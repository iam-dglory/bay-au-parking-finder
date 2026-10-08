#!/usr/bin/env python3
"""Build country-wide parking-location catalogs from current OSM country extracts.

The source PBFs are retained locally (not Git) because they are multi-gigabyte
source snapshots. The filtered parking-only archives and the app's geographic
tiles are reproducible, retained in the repository and hashed in each country
manifest. This intentionally publishes mapped locations only: it never infers
legal permission, a tariff, capacity, or live availability from geometry.

Usage:
  PYTHONPATH=/private/tmp/bay-osmium python3 scripts/build_country_parking.py --country india
  PYTHONPATH=/private/tmp/bay-osmium python3 scripts/build_country_parking.py --country australia
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import gzip
import hashlib
import json
import math
import re
import shutil
import subprocess
import sys
import unicodedata
from pathlib import Path
from typing import Any

try:
    import osmium
    from shapely.geometry import Point, shape
    from shapely.prepared import prep
except ImportError:
    sys.exit('Install dependencies first: python3 -m pip install -r scripts/data-requirements.txt')

ROOT = Path(__file__).resolve().parents[1]
DATE = dt.datetime.now(dt.timezone.utc).date().isoformat()
TILE_SIZE = .1
PARKING_AMENITIES = {'parking', 'parking_space', 'motorcycle_parking'}
SKIP_ACCESS = {'private', 'no', 'delivery', 'employees', 'permit', 'emergency', 'agricultural', 'forestry'}
COUNTRIES = {
    'india': {
        'code': 'IN', 'label': 'India', 'currency': 'INR',
        'pbf_url': 'https://download.geofabrik.de/asia/india-latest.osm.pbf',
        'boundary_url': 'https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IND/ADM1/geoBoundaries-IND-ADM1_simplified.geojson',
        'boundary_license': 'geoBoundaries / DataMeet India community, CC BY 2.5 IN',
        'bounds': (6.0, 37.5, 68.0, 98.5),
    },
    'australia': {
        'code': 'AU', 'label': 'Australia', 'currency': 'AUD',
        'pbf_url': 'https://download.geofabrik.de/australia-oceania/australia-latest.osm.pbf',
        'boundary_url': 'https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/AUS/ADM1/geoBoundaries-AUS-ADM1_simplified.geojson',
        'boundary_license': 'geoBoundaries / Australian Bureau of Statistics, CC BY 4.0',
        'bounds': (-55.0, -8.0, 95.0, 170.0),
    },
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n')


def write_json_gz(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    content = (json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n').encode()
    path.write_bytes(gzip.compress(content, compresslevel=6, mtime=0))


def download(url: str, target: Path) -> Path:
    if target.exists() and target.stat().st_size > 1000:
        return target
    target.parent.mkdir(parents=True, exist_ok=True)
    partial = target.with_suffix(target.suffix + '.partial')
    subprocess.run(['curl', '-fL', '--retry', '3', '--connect-timeout', '20', '--max-time', '7200', '-C', '-', '-o', str(partial), url], check=True)
    if partial.stat().st_size < 1000:
        raise ValueError(f'Incomplete download: {url}')
    partial.replace(target)
    return target


def tags_of(element: Any) -> dict[str, str]:
    return {tag.k: tag.v for tag in element.tags}


def class_of(tags: dict[str, str]) -> str | None:
    amenity = tags.get('amenity')
    if amenity not in PARKING_AMENITIES:
        return None
    if tags.get('parking') in {'private', 'carports'}:
        return None
    return 'bay' if amenity == 'parking_space' and tags.get('capacity') in {None, '1'} else 'area'


def point_of(element: Any) -> list[float] | None:
    if element.is_node():
        return [element.location.lat, element.location.lon]
    points = [[node.location.lat, node.location.lon] for node in element.nodes if node.location.valid()]
    return [sum(point[0] for point in points) / len(points), sum(point[1] for point in points) / len(points)] if points else None


def raw_polygons(row: dict[str, Any]) -> list[list[list[float]]]:
    if row['kind'] != 'area' or row['type'] == 'node':
        return []
    geometry = row.get('geometry', [])
    return geometry if row['type'] == 'relation' else [geometry]


def contains(point: tuple[float, float], polygon: list[list[float]]) -> bool:
    lat, lng = point
    inside = False
    for index in range(len(polygon)):
        a, b = polygon[index - 1], polygon[index]
        if (a[0] > lat) != (b[0] > lat):
            crossing = (b[1] - a[1]) * (lat - a[0]) / (b[0] - a[0]) + a[1]
            if lng < crossing:
                inside = not inside
    return inside


def normalise_state_name(value: str) -> str:
    """Keep the published state labels readable while retaining the source
    boundary file unchanged for provenance."""
    return ''.join(char for char in unicodedata.normalize('NFKD', value) if not unicodedata.combining(char))

def load_states(path: Path):
    collection = json.loads(path.read_text())
    states = []
    for feature in collection['features']:
        geometry = shape(feature['geometry'])
        states.append((normalise_state_name(feature['properties']['shapeName']), geometry.bounds, prep(geometry)))
    return states


def state_for(lat: float, lng: float, states) -> str | None:
    point = Point(lng, lat)
    for name, bounds, geometry in states:
        if bounds[0] <= lng <= bounds[2] and bounds[1] <= lat <= bounds[3] and geometry.covers(point):
            return name
    return None

def tariff_from_tags(tags: dict[str, str], currency: str) -> tuple[list[dict[str, Any]], str | None]:
    """Only create a numeric price when OSM states one unambiguous rate in its
    local currency. All other source charge terms are kept verbatim for display.
    """
    raw = tags.get('charge') or tags.get('charge:fee')
    if not raw:
        return [], None
    # Examples accepted: "50 INR/hour", "₹50/hour", "A$5.00/hour", "5 AUD/hour".
    if currency == 'INR':
        match = re.fullmatch(r'\s*(?:₹\s*|INR\s*)?(\d+(?:\.\d+)?)\s*(?:INR)?\s*/\s*(hour|hr)\s*', raw, flags=re.I)
    else:
        match = re.fullmatch(r'\s*(?:A\$\s*|AUD\s*)?(\d+(?:\.\d+)?)\s*(?:AUD)?\s*/\s*(hour|hr)\s*', raw, flags=re.I)
    if not match:
        return [], raw
    amount = float(match.group(1))
    return [{'vehicle': 'Vehicle type not listed', 'period': 'Per hour', 'amount': amount}], raw


class ParkingHandler(osmium.SimpleHandler):
    def __init__(self, output: Any, counts: collections.Counter):
        super().__init__()
        self.output, self.counts = output, counts

    def record(self, element: Any, element_type: str) -> None:
        tags = tags_of(element)
        kind = class_of(tags)
        if not kind:
            return
        self.counts['candidate'] += 1
        restricted = tags.get('access') in SKIP_ACCESS or tags.get('motorcar') in {'no', 'private'}
        try:
            point = point_of(element)
        except osmium.InvalidLocationError:
            point = None
        if point is None:
            self.counts['missing_geometry'] += 1
            return
        raw: dict[str, Any] = {
            'type': element_type, 'id': element.id, 'lat': round(point[0], 7), 'lng': round(point[1], 7),
            'timestamp': element.timestamp.isoformat() if element.timestamp else None,
            'kind': kind, 'tags': tags, 'restricted': restricted,
        }
        if element_type == 'way':
            raw['geometry'] = [[round(node.location.lat, 7), round(node.location.lon, 7)] for node in element.nodes if node.location.valid()]
        self.output.write(json.dumps(raw, ensure_ascii=False, separators=(',', ':')) + '\n')
        self.counts['restricted_access' if restricted else kind] += 1

    def node(self, element: Any) -> None:
        self.record(element, 'node')

    def way(self, element: Any) -> None:
        self.record(element, 'way')

    def area(self, area: Any) -> None:
        if area.from_way():
            return
        tags = tags_of(area)
        kind = class_of(tags)
        if not kind:
            return
        self.counts['candidate'] += 1
        restricted = tags.get('access') in SKIP_ACCESS or tags.get('motorcar') in {'no', 'private'}
        rings: list[list[list[float]]] = []
        try:
            for ring in area.outer_rings():
                points = [[round(node.location.lat, 7), round(node.location.lon, 7)] for node in ring if node.location.valid()]
                if len(points) >= 3:
                    rings.append(points)
        except osmium.InvalidLocationError:
            pass
        if not rings:
            self.counts['missing_geometry'] += 1
            return
        flat = [point for ring in rings for point in ring]
        raw = {
            'type': 'relation', 'id': area.orig_id(), 'lat': round(sum(point[0] for point in flat) / len(flat), 7),
            'lng': round(sum(point[1] for point in flat) / len(flat), 7),
            'timestamp': area.timestamp.isoformat() if area.timestamp else None, 'kind': kind,
            'tags': tags, 'geometry': rings, 'restricted': restricted,
        }
        self.output.write(json.dumps(raw, ensure_ascii=False, separators=(',', ':')) + '\n')
        self.counts['restricted_access' if restricted else kind] += 1


def restricted_grid(raw_rows: list[dict[str, Any]]) -> dict[tuple[int, int], list[tuple[tuple[float, float, float, float], list[list[float]]]]]:
    grid: dict[tuple[int, int], list[tuple[tuple[float, float, float, float], list[list[float]]]]] = collections.defaultdict(list)
    for row in raw_rows:
        if not row['restricted']:
            continue
        for polygon in raw_polygons(row):
            if len(polygon) < 4 or polygon[0] != polygon[-1]:
                continue
            lats, lngs = [point[0] for point in polygon], [point[1] for point in polygon]
            bbox = (min(lats), min(lngs), max(lats), max(lngs))
            if (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]) > .01:
                continue
            for y in range(math.floor(bbox[0] / .01), math.floor(bbox[2] / .01) + 1):
                for x in range(math.floor(bbox[1] / .01), math.floor(bbox[3] / .01) + 1):
                    grid[y, x].append((bbox, polygon))
    return grid


def inside_restricted(row: dict[str, Any], grid: dict[tuple[int, int], Any]) -> bool:
    point = (row['lat'], row['lng'])
    for bbox, polygon in grid.get((math.floor(point[0] / .01), math.floor(point[1] / .01)), []):
        if bbox[0] <= point[0] <= bbox[2] and bbox[1] <= point[1] <= bbox[3] and contains(point, polygon):
            return True
    return False


def display(raw: dict[str, Any], config: dict[str, Any], state: str) -> dict[str, Any]:
    tags = raw['tags']
    kind = raw['kind']
    name = tags.get('name:en') or tags.get('name')
    kind_label = {'multi-storey': 'Multi-storey parking', 'underground': 'Underground parking', 'surface': 'Surface parking', 'street_side': 'Street-side parking', 'rooftop': 'Rooftop parking'}.get(tags.get('parking'))
    if not name and tags.get('addr:street'):
        name = 'Parking · ' + ' '.join(filter(None, [tags.get('addr:housenumber'), tags['addr:street']]))
    if not name:
        name = 'Mapped parking space' if kind == 'bay' else kind_label or 'Parking area'
    capacity = int(tags['capacity']) if re.fullmatch(r'\d+', tags.get('capacity', '')) else None
    source_terms = {key: value for key, value in tags.items() if key.startswith(('parking:', 'charge', 'fee', 'maxstay', 'restriction')) or key in {'parking', 'access', 'motorcar', 'motorcycle'}}
    tariffs, raw_price = tariff_from_tags(tags, config['currency'])
    record: dict[str, Any] = {
        'id': f"osm:{raw['type']}:{raw['id']}", 'kind': kind, 'address_text': name,
        'city': tags.get('addr:city'), 'state': state, 'country': config['code'], 'suburb': tags.get('addr:suburb'),
        'lat': raw['lat'], 'lng': raw['lng'], 'capacity': capacity, 'census_year': None,
        'access': tags.get('access', 'not_listed'), 'fee': tags.get('fee'), 'opening_hours': tags.get('opening_hours'),
        'vehicle_types': 'Two-wheelers' if tags.get('amenity') == 'motorcycle_parking' else 'Vehicle types not listed',
        'source_url': f"https://www.openstreetmap.org/{raw['type']}/{raw['id']}", 'source_name': 'OpenStreetMap',
        'source_updated_at': raw['timestamp'], 'collected_at': DATE,
        'location_note': 'Mapped point; entrance may differ' if raw['type'] == 'node' else 'Mapped area centre; use the signed entrance',
        'occupancy': 'not_provided', 'currency': config['currency'], 'mapped_zone': False, 'source_terms': source_terms,
        'facility_type': kind_label,
    }
    if tariffs:
        record.update({'tariffs': tariffs, 'price_summary': f"Mapped: {raw_price}", 'pricing_source_url': record['source_url'],
                       'pricing_checked_at': DATE, 'pricing_notes': 'Rate is from the OpenStreetMap source tag, retrieved on the collection date. Confirm the current tariff at the entrance.'})
    return record


def group_bays(records: list[dict[str, Any]], raw_rows: list[dict[str, Any]]) -> None:
    polygons: dict[tuple[int, int], list[tuple[float, dict[str, Any], tuple[float, float, float, float], list[list[float]]]]] = collections.defaultdict(list)
    for record, raw in zip(records, raw_rows):
        if record['kind'] != 'area':
            continue
        for polygon in raw_polygons(raw):
            if len(polygon) < 4 or polygon[0] != polygon[-1]:
                continue
            lats, lngs = [point[0] for point in polygon], [point[1] for point in polygon]
            bbox = (min(lats), min(lngs), max(lats), max(lngs))
            area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
            if area > .01:
                continue
            for y in range(math.floor(bbox[0] / .01), math.floor(bbox[2] / .01) + 1):
                for x in range(math.floor(bbox[1] / .01), math.floor(bbox[3] / .01) + 1):
                    polygons[y, x].append((area, record, bbox, polygon))
    for record in records:
        if record['kind'] != 'bay':
            continue
        point = (record['lat'], record['lng'])
        for _, parent, bbox, polygon in sorted(polygons.get((math.floor(point[0] / .01), math.floor(point[1] / .01)), []), key=lambda candidate: candidate[0]):
            if bbox[0] <= point[0] <= bbox[2] and bbox[1] <= point[1] <= bbox[3] and contains(point, polygon):
                record['parent_area_id'] = parent['id']
                parent['mapped_bay_count'] = parent.get('mapped_bay_count', 0) + 1
                break


def build(country: str, local_pbf: Path | None) -> None:
    config = COUNTRIES[country]
    source_dir = ROOT / 'datasets' / country / DATE
    raw_pbf = local_pbf or ROOT / 'datasets' / country / 'raw-pbf' / f'{country}-latest.osm.pbf'
    if local_pbf is None:
        download(config['pbf_url'], raw_pbf)
    if not raw_pbf.exists() or raw_pbf.stat().st_size < 1000:
        raise ValueError(f'Missing PBF for {country}')
    boundary = source_dir / f'{country}-state-boundaries.geojson'
    download(config['boundary_url'], boundary)
    states = load_states(boundary)
    archive = source_dir / f'{country}-parking-osm.jsonl.gz'
    counts: collections.Counter = collections.Counter()
    with gzip.open(archive, 'wt', encoding='utf-8', compresslevel=6) as output:
        handler = ParkingHandler(output, counts)
        processor = (osmium.FileProcessor(str(raw_pbf)).with_locations().with_areas(osmium.filter.TagFilter(('amenity', 'parking'), ('amenity', 'parking_space'), ('amenity', 'motorcycle_parking'))).with_filter(osmium.filter.KeyFilter('amenity')))
        for element in processor:
            if element.is_area():
                handler.area(element)
            elif element.is_node():
                handler.node(element)
            elif element.is_way():
                handler.way(element)
    raw_rows = []
    with gzip.open(archive, 'rt', encoding='utf-8') as source:
        for line in source:
            row = json.loads(line)
            min_lat, max_lat, min_lng, max_lng = config['bounds']
            if min_lat <= row['lat'] <= max_lat and min_lng <= row['lng'] <= max_lng:
                raw_rows.append(row)
    restricted = restricted_grid(raw_rows)
    visible_raw = []
    records = []
    by_state: collections.Counter = collections.Counter()
    for row in raw_rows:
        if row['restricted']:
            continue
        if inside_restricted(row, restricted):
            counts['excluded_inside_restricted'] += 1
            continue
        state = state_for(row['lat'], row['lng'], states)
        if not state:
            counts['excluded_outside_adm1'] += 1
            continue
        visible_raw.append(row)
        record = display(row, config, state)
        records.append(record)
        by_state[state] += 1
    group_bays(records, visible_raw)
    tiles: dict[str, list[dict[str, Any]]] = collections.defaultdict(list)
    for record in records:
        if record.get('parent_area_id'):
            continue
        tiles[f"{math.floor(record['lat'] / TILE_SIZE)}_{math.floor(record['lng'] / TILE_SIZE)}"].append(record)
    public_dir = ROOT / 'public/data' / country
    if public_dir.exists():
        shutil.rmtree(public_dir)
    for key, rows in tiles.items():
        write_json_gz(public_dir / f'{key}.json.gz', rows)
    state_counts = {name: by_state.get(name, 0) for name, _, _ in states}
    index = {'schema_version': 1, 'tile_size': TILE_SIZE, 'country': config['code'], 'collected_at': DATE,
             'tiles': sorted(tiles), 'states': dict(sorted(state_counts.items())), 'records': sum(map(len, tiles.values())),
             'license': 'OpenStreetMap © contributors, ODbL 1.0',
             'coverage_note': 'Mapped parking locations only. This is not a complete inventory, a legal sign record, price guarantee, or live occupancy feed.'}
    write_json(public_dir / 'index.json', index)
    manifest = {'country': config['label'], 'country_code': config['code'], 'collected_at': DATE,
                'source_pbf_url': config['pbf_url'], 'source_pbf_path': str(raw_pbf.relative_to(ROOT)),
                'source_pbf_bytes': raw_pbf.stat().st_size, 'source_pbf_sha256': sha256(raw_pbf),
                'boundary_url': config['boundary_url'], 'boundary_path': str(boundary.relative_to(ROOT)), 'boundary_license': config['boundary_license'],
                'parking_archive': str(archive.relative_to(ROOT)), 'parking_archive_bytes': archive.stat().st_size, 'parking_archive_sha256': sha256(archive),
                'records': index['records'], 'tiles': len(tiles), 'states_or_territories': dict(sorted(state_counts.items())),
                'counts': dict(counts), 'priced_records': sum(bool(row.get('tariffs')) for row in records),
                'license': 'OpenStreetMap © contributors, ODbL 1.0'}
    write_json(source_dir / f'{country}-coverage-manifest.json', manifest)
    print(json.dumps(manifest, indent=2), flush=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--country', choices=sorted(COUNTRIES), required=True)
    parser.add_argument('--local-pbf', type=Path)
    args = parser.parse_args()
    build(args.country, args.local_pbf)


if __name__ == '__main__':
    main()
