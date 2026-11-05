#!/usr/bin/env python3
"""Build the sourced Greater Melbourne geometry and audit BAY records by locality.

This script deliberately keeps three concepts separate:

* the ABS Greater Melbourne statistical boundary (official scope geometry);
* Vicmap bounded-locality/LGA geometry (official administrative geography); and
* parking observations from BAY's current catalogue and official council files.

It does not infer a tariff, legal permission, or live vacancy from geometry.
"""
from __future__ import annotations

import collections
import csv
import datetime as dt
import hashlib
import json
from pathlib import Path
from typing import Any

from shapely import make_valid
from shapely.geometry import Point, mapping, shape
from shapely.ops import unary_union
from shapely.strtree import STRtree


ROOT = Path(__file__).resolve().parents[1]
RUN_DATE = "2026-11-04"
OUT = ROOT / "datasets" / "melbourne" / RUN_DATE
ZONE_OUT = OUT / "pricing-zones"
BOUNDARY_PATH = ZONE_OUT / "greater-melbourne-gccsa-2021.geojson"
LOCALITY_SOURCE = Path("/private/tmp/vicmap-metro-localities-bbox.geojson")
LGA_SOURCE = Path("/private/tmp/vicmap-metro-lga-bbox.geojson")
CATALOG_DIR = ROOT / "public" / "data" / "melbourne"
CITY_SOURCE_DIR = ROOT / "datasets" / "melbourne" / "2026-09-26"

ABS_URL = "https://geo.abs.gov.au/arcgis/rest/services/ASGS2021/GCCSA/MapServer"
VICMAP_URL = "https://discover.data.vic.gov.au/dataset/vicmap-admin-locality-polygon-aligned-to-property"
CITY_BAYS_URL = "https://discover.data.vic.gov.au/dataset/on-street-parking-bays"
CITY_SENSORS_URL = "https://data.melbourne.vic.gov.au/explore/dataset/on-street-parking-bay-sensors/"
ROAD_CORRIDORS_URL = "https://data.melbourne.vic.gov.au/explore/dataset/road-corridors/"
PARKING_ZONE_URL = "https://data.melbourne.vic.gov.au/explore/dataset/parking-zones-linked-to-street-segments/"
PARKING_SIGN_URL = "https://data.melbourne.vic.gov.au/explore/dataset/sign-plates-located-in-each-parking-zone/"
PAYSTAY_URL = "https://data.melbourne.vic.gov.au/explore/dataset/pay-stay-parking-restrictions/"
CBD_POLICY_URL = "https://participate.melbourne.vic.gov.au/central-city-parking-review/parking-improvements"


def read_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as source:
        return json.load(source)


def write_json(path: Path, value: Any, *, compact: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if compact:
        text = json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n"
    else:
        text = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
    path.write_text(text, encoding="utf-8")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def clipped_collection(source_path: Path, boundary, name_field: str, source_url: str) -> dict[str, Any]:
    features = []
    for feature in read_json(source_path).get("features", []):
        geometry = make_valid(shape(feature["geometry"]))
        if not geometry.intersects(boundary):
            continue
        clipped = make_valid(geometry.intersection(boundary))
        if clipped.is_empty:
            continue
        source_properties = feature.get("properties", {})
        properties = {
            "name": source_properties.get(name_field),
            "source_object_id": source_properties.get("OBJECTID"),
            "source_pfi": source_properties.get("pfi"),
            "source_ufi": source_properties.get("ufi"),
            "source": "Vicmap Admin",
            "source_url": source_url,
            "scope_clip": "ABS ASGS 2021 Greater Melbourne GCCSA",
            "geometry_status": "official_source_geometry_clipped_to_official_scope",
            "pricing_status": "not_assigned",
        }
        if name_field == "locality_name":
            properties["gazetted_name"] = source_properties.get("gazetted_locality_name")
            properties["vicnames_id"] = source_properties.get("vicnames_id")
        else:
            properties["official_name"] = source_properties.get("lga_official_name")
            properties["abs_lga_code"] = source_properties.get("abs_lga_code")
        features.append({"type": "Feature", "properties": properties, "geometry": mapping(clipped)})
    features.sort(key=lambda item: (item["properties"].get("name") or ""))
    return {
        "type": "FeatureCollection",
        "name": f"Greater Melbourne {name_field}",
        "metadata": {
            "built_at": dt.datetime.now(dt.timezone.utc).isoformat(),
            "scope_source": ABS_URL,
            "geometry_source": source_url,
            "warning": "Official geometry only. Pricing is not verified or assigned by these boundary datasets.",
        },
        "features": features,
    }


def build_tree(collection: dict[str, Any]):
    geometries = [shape(feature["geometry"]) for feature in collection["features"]]
    return geometries, STRtree(geometries)


def find_feature(point: Point, collection: dict[str, Any], geometries, tree) -> dict[str, Any] | None:
    candidates = tree.query(point, predicate="intersects")
    if len(candidates) == 0:
        return None
    # Locality/LGA polygons should not overlap. On a shared boundary, select the
    # smallest clipped polygon deterministically and record a boundary match.
    index = min((int(candidate) for candidate in candidates), key=lambda item: geometries[item].area)
    return collection["features"][index]


def blank_stats() -> collections.Counter:
    return collections.Counter(
        catalog_records=0,
        catalog_bays=0,
        catalog_areas=0,
        catalog_fee_yes=0,
        catalog_fee_no=0,
        catalog_fee_unknown=0,
        catalog_numeric_tariff=0,
        city_official_bays=0,
        city_sensor_rows=0,
        city_commercial_carparks=0,
        city_commercial_spaces=0,
    )


def add_catalog_record(stats: collections.Counter, record: dict[str, Any]) -> None:
    stats["catalog_records"] += 1
    stats["catalog_bays" if record.get("kind") == "bay" else "catalog_areas"] += 1
    fee = str(record.get("fee") or "").strip().lower()
    if fee in {"yes", "paid", "true", "1"}:
        stats["catalog_fee_yes"] += 1
    elif fee in {"no", "free", "false", "0", "zero"}:
        stats["catalog_fee_no"] += 1
    else:
        stats["catalog_fee_unknown"] += 1
    if record.get("tariffs"):
        stats["catalog_numeric_tariff"] += 1


def add_point(
    lat: float,
    lng: float,
    stats_by_name: dict[str, collections.Counter],
    collection: dict[str, Any],
    geometries,
    tree,
    updater,
) -> bool:
    feature = find_feature(Point(float(lng), float(lat)), collection, geometries, tree)
    if not feature:
        return False
    updater(stats_by_name[feature["properties"]["name"]])
    return True


def audit_catalog(localities: dict[str, Any], stats_by_name: dict[str, collections.Counter]) -> dict[str, Any]:
    geometries, tree = build_tree(localities)
    index = read_json(CATALOG_DIR / "index.json")
    seen: set[str] = set()
    outside = 0
    duplicates = 0
    for position, tile in enumerate(index["tiles"], 1):
        for record in read_json(CATALOG_DIR / f"{tile}.json"):
            record_id = str(record.get("id"))
            if record_id in seen:
                duplicates += 1
                continue
            seen.add(record_id)
            matched = add_point(
                record["lat"], record["lng"], stats_by_name, localities, geometries, tree,
                lambda stats, row=record: add_catalog_record(stats, row),
            )
            if not matched:
                outside += 1
        if position % 100 == 0:
            print(f"catalog tiles: {position}/{len(index['tiles'])}", flush=True)
    return {
        "catalog_collected_at": index.get("collected_at"),
        "catalog_index_coverage": index.get("coverage"),
        "unique_catalog_records_read": len(seen),
        "duplicate_record_ids_skipped": duplicates,
        "catalog_records_outside_official_scope": outside,
    }


def audit_city_sources(localities: dict[str, Any], stats_by_name: dict[str, collections.Counter]) -> dict[str, Any]:
    geometries, tree = build_tree(localities)
    unmatched: collections.Counter = collections.Counter()

    def run(path: Path, lat_key: str, lng_key: str, updater, label: str) -> int:
        rows = read_json(path)
        for row in rows:
            if not add_point(row[lat_key], row[lng_key], stats_by_name, localities, geometries, tree, lambda stats, r=row: updater(stats, r)):
                unmatched[label] += 1
        return len(rows)

    totals = {
        "city_official_bay_rows": run(
            CITY_SOURCE_DIR / "on-street-parking-bays.json", "latitude", "longitude",
            lambda stats, _: stats.update(city_official_bays=1), "city_official_bays",
        ),
    }

    # Sensor location is an object rather than independent latitude/longitude fields.
    sensors = read_json(CITY_SOURCE_DIR / "on-street-parking-bay-sensors.json")
    for row in sensors:
        location = row["location"]
        if not add_point(location["lat"], location["lon"], stats_by_name, localities, geometries, tree, lambda stats: stats.update(city_sensor_rows=1)):
            unmatched["city_sensor_rows"] += 1
    totals["city_sensor_rows"] = len(sensors)

    carparks = read_json(CITY_SOURCE_DIR / "off-street-car-parks-2024-commercial.json")
    for row in carparks:
        if not add_point(
            row["latitude"], row["longitude"], stats_by_name, localities, geometries, tree,
            lambda stats, r=row: stats.update(city_commercial_carparks=1, city_commercial_spaces=int(r.get("parking_spaces") or 0)),
        ):
            unmatched["city_commercial_carparks"] += 1
    totals["city_commercial_carpark_rows"] = len(carparks)
    totals["unmatched"] = dict(unmatched)
    return totals


def write_locality_reports(localities: dict[str, Any], stats_by_name: dict[str, collections.Counter]) -> dict[str, Any]:
    fieldnames = [
        "locality", "geometry_status", "catalog_records", "catalog_bays", "catalog_areas",
        "catalog_fee_yes", "catalog_fee_no", "catalog_fee_unknown", "catalog_numeric_tariff",
        "city_official_bays", "city_sensor_rows", "city_commercial_carparks", "city_commercial_spaces",
        "coverage_flag", "accuracy_status",
    ]
    rows = []
    for feature in localities["features"]:
        name = feature["properties"]["name"]
        stats = stats_by_name[name]
        rows.append({
            "locality": name,
            "geometry_status": feature["properties"]["geometry_status"],
            **{field: int(stats[field]) for field in fieldnames if field in stats},
            "coverage_flag": "no_catalog_records" if not stats["catalog_records"] else "mapped_records_present",
            "accuracy_status": "locations_are_source_observations_not_complete_inventory",
        })
    rows.sort(key=lambda row: row["locality"])
    csv_path = OUT / "coverage-by-locality.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as target:
        writer = csv.DictWriter(target, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    write_json(OUT / "coverage-by-locality.json", rows)
    return {
        "localities": len(rows),
        "localities_with_catalog_records": sum(row["catalog_records"] > 0 for row in rows),
        "localities_without_catalog_records": sum(row["catalog_records"] == 0 for row in rows),
        "localities_with_any_official_city_bay": sum(row["city_official_bays"] > 0 for row in rows),
        "catalog_records": sum(row["catalog_records"] for row in rows),
        "catalog_bays": sum(row["catalog_bays"] for row in rows),
        "catalog_areas": sum(row["catalog_areas"] for row in rows),
        "catalog_numeric_tariffs": sum(row["catalog_numeric_tariff"] for row in rows),
        "city_official_bays": sum(row["city_official_bays"] for row in rows),
        "city_sensor_rows": sum(row["city_sensor_rows"] for row in rows),
        "city_commercial_carparks": sum(row["city_commercial_carparks"] for row in rows),
        "city_commercial_spaces": sum(row["city_commercial_spaces"] for row in rows),
        "zero_catalog_localities": [row["locality"] for row in rows if row["catalog_records"] == 0],
    }


def build_city_zone_files() -> dict[str, Any]:
    """Create spatial zone joins from City of Melbourne source tables.

    The current parking-zone tables publish sign restrictions but no tariff.
    The only machine-readable tariff table is Pay Stay, which the publisher
    marks as deprecated/static. Outputs therefore remain separate and carry
    activation guards in every feature.
    """
    road_path = ZONE_OUT / "city-of-melbourne-road-corridors.geojson"
    roads = read_json(road_path)["features"]
    road_by_segment: dict[str, list[Any]] = collections.defaultdict(list)
    for feature in roads:
        segment = str(feature.get("properties", {}).get("seg_id") or "")
        if segment and feature.get("geometry"):
            road_by_segment[segment].append(make_valid(shape(feature["geometry"])))

    def build_zones(mapping_rows, mapping_key, segment_key, detail_rows, detail_key, *, historical):
        segments_by_zone: dict[str, set[str]] = collections.defaultdict(set)
        mappings_by_zone: dict[str, list[dict[str, Any]]] = collections.defaultdict(list)
        details_by_zone: dict[str, list[dict[str, Any]]] = collections.defaultdict(list)
        for row in mapping_rows:
            zone = str(row.get(mapping_key))
            segment = str(row.get(segment_key))
            segments_by_zone[zone].add(segment)
            mappings_by_zone[zone].append(row)
        for row in detail_rows:
            details_by_zone[str(row.get(detail_key))].append(row)
        features = []
        missing_segments: set[str] = set()
        for zone, segment_ids in sorted(segments_by_zone.items()):
            geometries = []
            for segment in segment_ids:
                if segment not in road_by_segment:
                    missing_segments.add(segment)
                geometries.extend(road_by_segment.get(segment, []))
            if not geometries:
                continue
            merged = make_valid(unary_union(geometries))
            properties = {
                "zone_id": zone,
                "segment_ids": sorted(segment_ids),
                "street_links": mappings_by_zone[zone],
                "source_details": details_by_zone.get(zone, []),
                "geometry_source": ROAD_CORRIDORS_URL,
                "zone_link_source": PAYSTAY_URL if historical else PARKING_ZONE_URL,
                "status": "deprecated_historical_do_not_activate" if historical else "current_restriction_zone_no_verified_tariff",
                "pricing_verified": bool(historical and details_by_zone.get(zone)),
                "activation_status": "blocked",
            }
            features.append({"type": "Feature", "properties": properties, "geometry": mapping(merged)})
        return features, sorted(missing_segments)

    current_features, current_missing = build_zones(
        read_json(CITY_SOURCE_DIR / "parking-zones-linked-to-street-segments.json"),
        "parkingzone", "segment_id",
        read_json(CITY_SOURCE_DIR / "sign-plates-located-in-each-parking-zone.json"), "parkingzone",
        historical=False,
    )
    current_path = ZONE_OUT / "city-of-melbourne-current-parking-restriction-zones.geojson"
    write_json(current_path, {
        "type": "FeatureCollection",
        "name": "City of Melbourne current parking restriction zones",
        "metadata": {
            "pricing_verified": False,
            "warning": "These are official parking/sign restriction zones. The current source does not publish a tariff per zone.",
            "zone_source": PARKING_ZONE_URL,
            "sign_source": PARKING_SIGN_URL,
            "geometry_source": ROAD_CORRIDORS_URL,
        },
        "features": current_features,
    }, compact=True)

    historical_features, historical_missing = build_zones(
        read_json(CITY_SOURCE_DIR / "pay-stay-zones-linked-to-street-segments.json"),
        "pay_stay_zone", "street_segment_id",
        read_json(CITY_SOURCE_DIR / "pay-stay-parking-restrictions.json"), "pay_stay_zone",
        historical=True,
    )
    historical_path = ZONE_OUT / "source-verified-deprecated-paystay-pricing-zones.geojson"
    write_json(historical_path, {
        "type": "FeatureCollection",
        "name": "City of Melbourne source-verified historical Pay Stay pricing zones",
        "metadata": {
            "geometry_verified": True,
            "pricing_source_verified": True,
            "current_for_navigation_or_pricing": False,
            "warning": "The publisher labels Pay Stay as deprecated, static, useful with caveats, with source data last processed in 2022. Never show these rates as current.",
            "pricing_source": PAYSTAY_URL,
            "geometry_source": ROAD_CORRIDORS_URL,
        },
        "features": historical_features,
    }, compact=True)

    policy_path = ZONE_OUT / "current-cbd-pricing-policy.json"
    write_json(policy_path, {
        "policy_area": "City of Melbourne Central City (CBD)",
        "publisher": "City of Melbourne",
        "source_url": CBD_POLICY_URL,
        "checked_at": RUN_DATE,
        "applies_to": "metered spaces; drivers must check the physical sign and payment channel",
        "conditions": [
            {"days": "Monday-Friday", "start": "07:00", "end": "19:00", "aud_per_hour": 7.0, "label": "peak"},
            {"days": "Monday-Friday", "start": "19:00", "end": "22:00", "aud_per_hour": 4.0, "label": "off-peak"},
            {"days": "Saturday-Sunday", "start": "07:00", "end": "22:00", "aud_per_hour": 4.0, "label": "off-peak"},
        ],
        "time_limit": "2P for general parking spaces, 07:00-22:00 every day",
        "free_period": "Up to 15 minutes only when a parking session is started in EasyPark; conditions apply",
        "geometry_status": "No current machine-readable official tariff-zone boundary located; do not spatially apply this policy from a locality proxy.",
    })
    return {
        "road_corridors": len(roads),
        "current_restriction_zones": len(current_features),
        "current_missing_road_segments": current_missing,
        "historical_paystay_price_zones": len(historical_features),
        "historical_missing_road_segments": historical_missing,
        "outputs": [str(path.relative_to(ROOT)) for path in (current_path, historical_path, policy_path)],
    }


def write_source_gap_ledger(lgas: dict[str, Any]) -> dict[str, Any]:
    known = {
        "MELBOURNE": {
            "status": "official_spatial_inventory_available_for_municipality",
            "sources": ["on-street bays", "subset sensor feed", "parking/sign restriction zones", "commercial off-street census"],
            "gap": "No publisher guarantee of every legal space, current tariff per bay, or sensor coverage for every bay.",
        },
        "CASEY": {
            "status": "partial_official_layers_available",
            "sources": ["parking restriction zones", "car park locations"],
            "gap": "No verified complete bay-level inventory, current tariff catalogue, or live occupancy feed.",
        },
        "PORT PHILLIP": {
            "status": "partial_official_layers_available",
            "sources": ["accessible parking", "parking machines"],
            "gap": "These layers do not enumerate all public parking spaces or current restrictions/prices.",
        },
        "YARRA": {
            "status": "partial_official_layers_available",
            "sources": ["permit parking zones"],
            "gap": "Permit polygons are not a complete parking-space, tariff, or occupancy inventory.",
        },
        "STONNINGTON": {
            "status": "discovery_only",
            "sources": ["parking sensor project information page"],
            "gap": "No verified, reusable, complete machine-readable bay feed was located in this audit.",
        },
        "MARIBYRNONG": {
            "status": "discovery_only",
            "sources": ["smart-city project information page"],
            "gap": "No verified, reusable, complete machine-readable bay feed was located in this audit.",
        },
        "GREATER GEELONG": {
            "status": "official_layers_exist_outside_primary_metro_scope",
            "sources": ["parking lots", "sensor occupancy", "historical utilisation", "real-time availability"],
            "gap": "Only a fringe of this LGA intersects the ABS Greater Melbourne GCCSA; sources were not integrated into BAY's Melbourne catalogue in this audit.",
        },
    }
    rows = []
    for feature in lgas["features"]:
        name = feature["properties"]["name"]
        entry = known.get(name, {
            "status": "no_confirmed_complete_council_inventory",
            "sources": ["BAY/OpenStreetMap mapped observations only"],
            "gap": "Council/operator data agreement or a verified open bay, restriction, tariff and occupancy source is still required.",
        })
        rows.append({"lga": name, **entry})
    rows.sort(key=lambda row: row["lga"])
    output = {
        "as_of": RUN_DATE,
        "scope": "LGAs intersecting ABS ASGS 2021 Greater Melbourne GCCSA",
        "method": "Official DataVic/municipal catalogue discovery plus repository source inspection; absence means no confirmed source in this audit, not proof that no source exists.",
        "state_context": "The Victorian Car Parking / PPTN Area layer is a planning/context layer, not a bay-level availability or tariff inventory.",
        "councils": rows,
        "summary": dict(collections.Counter(row["status"] for row in rows)),
    }
    write_json(OUT / "source-gap-ledger.json", output)
    return output["summary"]


def main() -> None:
    boundary_collection = read_json(BOUNDARY_PATH)
    boundary = make_valid(shape(boundary_collection["features"][0]["geometry"]))
    localities = clipped_collection(LOCALITY_SOURCE, boundary, "locality_name", VICMAP_URL)
    lgas = clipped_collection(LGA_SOURCE, boundary, "lga_name", VICMAP_URL)
    locality_path = ZONE_OUT / "vicmap-localities-greater-melbourne.geojson"
    lga_path = ZONE_OUT / "vicmap-lgas-greater-melbourne.geojson"
    write_json(locality_path, localities, compact=True)
    write_json(lga_path, lgas, compact=True)

    # Locality geometry can support a future product policy, but it is not a
    # parking tariff zone and must never be activated as one implicitly.
    zone_features = []
    for feature in localities["features"]:
        properties = dict(feature["properties"])
        properties.update({
            "zone_id": f"vicmap-locality-{properties['source_ufi']}",
            "zone_name": properties["name"],
            "zone_basis": "bounded_locality",
            "rate_status": "unverified_no_rate_attached",
            "activation_status": "inactive_until_rate_source_is_approved",
        })
        zone_features.append({"type": "Feature", "properties": properties, "geometry": feature["geometry"]})
    locality_candidates = {
        "type": "FeatureCollection",
        "name": "BAY Greater Melbourne locality geometry candidates",
        "metadata": {
            "geometry_verified": True,
            "pricing_verified": False,
            "scope_source": ABS_URL,
            "zone_geometry_source": VICMAP_URL,
            "warning": "Do not activate or display a price until an operator/council rate source is linked to the zone.",
        },
        "features": zone_features,
    }
    pricing_path = ZONE_OUT / "locality-geometry-candidates.geojson"
    write_json(pricing_path, locality_candidates, compact=True)

    city_zones = build_city_zone_files()
    source_gap_summary = write_source_gap_ledger(lgas)

    stats_by_name = collections.defaultdict(blank_stats)
    catalog_audit = audit_catalog(localities, stats_by_name)
    city_audit = audit_city_sources(localities, stats_by_name)
    summary = write_locality_reports(localities, stats_by_name)
    provenance = {
        "built_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "scope": "ABS ASGS 2021 Greater Melbourne GCCSA",
        "scope_warning": "The ABS notes GCCSA boundaries are statistical and may differ from other definitions of Melbourne.",
        "sources": [
            {"path": str(BOUNDARY_PATH.relative_to(ROOT)), "url": ABS_URL, "license": "Creative Commons Attribution 4.0", "sha256": sha256(BOUNDARY_PATH)},
            {"path": str(locality_path.relative_to(ROOT)), "url": VICMAP_URL, "license": "Creative Commons Attribution 4.0", "sha256": sha256(locality_path)},
            {"path": str(lga_path.relative_to(ROOT)), "url": VICMAP_URL, "license": "Creative Commons Attribution 4.0", "sha256": sha256(lga_path)},
            {"path": str(pricing_path.relative_to(ROOT)), "url": VICMAP_URL, "license": "Creative Commons Attribution 4.0", "sha256": sha256(pricing_path)},
            {"path": "public/data/melbourne/index.json", "url": "https://www.openstreetmap.org/", "license": "ODbL 1.0"},
            {"path": "datasets/melbourne/2026-09-26/on-street-parking-bays.json", "url": CITY_BAYS_URL, "license": "Creative Commons Attribution 4.0"},
            {"path": "datasets/melbourne/2026-09-26/on-street-parking-bay-sensors.json", "url": CITY_SENSORS_URL, "license": "Creative Commons Attribution 4.0"},
        ],
        "geometry": {"greater_melbourne_features": 1, "localities": len(localities["features"]), "lgas_intersecting_scope": len(lgas["features"])},
        "catalog_audit": catalog_audit,
        "city_source_audit": city_audit,
        "city_zone_audit": city_zones,
        "source_gap_summary": source_gap_summary,
        "summary": summary,
        "assurance": {
            "geometry": "source-verified and validity-checked",
            "parking_completeness": "not complete; public sources do not enumerate every legal public/private parking space across all metropolitan councils",
            "pricing": "not verified by boundary data; only source-linked rates may be shown",
            "live_occupancy": "not complete; City of Melbourne sensors cover a subset of bays and may be delayed or unavailable",
        },
    }
    write_json(OUT / "provenance-and-audit.json", provenance)
    print(json.dumps(provenance["geometry"] | summary, indent=2), flush=True)


if __name__ == "__main__":
    main()
