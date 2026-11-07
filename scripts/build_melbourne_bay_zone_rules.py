"""Build per-bay sign rules for City of Melbourne on-street bays.

Why: the original rule import attached every sign plate on a road segment to
every bay on that segment, so one loading-zone plate became a loading zone for
the whole block (Test 1 issue #3, Queen St between La Trobe St and A'Beckett St).

A road segment can hold several council parking zones. The council's sensor
feed publishes the parking zone of each sensor bay (`zone_number`, keyed by
`kerbsideid`), and the sign-plate dataset lists the plates of each zone. So a
bay's own zone -- not its segment -- decides its plates.

Bay -> zone, in order of evidence:
  1. the bay's sensor zone_number, accepted only when that zone is also linked
     to the bay's road segment (cross-check between two council datasets);
  2. otherwise the segment's zone, only when the segment has exactly one zone.
Bays on multi-zone segments without a sensor zone are left out, so the app
keeps telling the driver to read the sign rather than guessing.

Zones with a plate code we cannot interpret unambiguously are left out whole.

Output: public/data/melbourne/bay-zone-rules.json
Run:    python3 -I scripts/build_melbourne_bay_zone_rules.py
"""
from __future__ import annotations

import collections
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "datasets" / "melbourne-city-of-melbourne"
OUT = ROOT / "public" / "data" / "melbourne" / "bay-zone-rules.json"

DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]


def load(name: str):
    return json.loads((SRC / name).read_text())


def day_range(text: str) -> list[int] | None:
    text = text.strip()
    if text in DAYS:
        return [DAYS.index(text)]
    m = re.fullmatch(r"(\w{3})-(\w{3})", text)
    if not m or m.group(1) not in DAYS or m.group(2) not in DAYS:
        return None
    a, b = DAYS.index(m.group(1)), DAYS.index(m.group(2))
    out = [a]
    while out[-1] != b:
        out.append((out[-1] + 1) % 7)
    return sorted(out)


def plate_rule(code: str) -> dict | None:
    """Map a council restriction_display code to a Bay rule. Unknown -> None."""
    if m := re.fullmatch(r"MP(\d)P", code):
        return {"sign_type": "PAID_METER", "max_stay_minutes": int(m.group(1)) * 60,
                "notes": f"Council sign {code}: meter, {m.group(1)}P. Check the meter for the current rate."}
    if m := re.fullmatch(r"(\d)P", code):
        return {"sign_type": "TIME_LIMITED", "max_stay_minutes": int(m.group(1)) * 60, "notes": f"Council sign {code}"}
    if code == "QP":  # quarter-hour parking
        return {"sign_type": "TIME_LIMITED", "max_stay_minutes": 15, "notes": "Council sign 1/4P"}
    if m := re.fullmatch(r"LZ(\d+)", code):
        return {"sign_type": "LOADING_ZONE", "max_stay_minutes": int(m.group(1)), "notes": f"Council sign {code}: loading zone"}
    if code == "PP":
        return {"sign_type": "PERMIT_ONLY", "max_stay_minutes": None, "notes": "Council sign PP: permit parking"}
    if m := re.fullmatch(r"DP(\d)P", code):
        return {"sign_type": "ACCESSIBLE_PERMIT", "max_stay_minutes": int(m.group(1)) * 60, "notes": f"Council sign {code}: accessible permit"}
    return None  # e.g. FP*, SP: meaning not confirmed from the source, so not guessed


def main() -> int:
    bays = load("on-street-parking-bays.json")
    sensors = load("on-street-parking-bay-sensors.json")
    zone_links = load("parking-zones-linked-to-street-segments.json")
    plates = load("sign-plates-located-in-each-parking-zone.json")

    segment_zones: dict[int, set[int]] = collections.defaultdict(set)
    for row in zone_links:
        segment_zones[row["segment_id"]].add(row["parkingzone"])

    zones: dict[int, list[dict]] = {}
    skipped_zones: dict[int, str] = {}
    by_zone = collections.defaultdict(list)
    for p in plates:
        by_zone[p["parkingzone"]].append(p)
    for zone, rows in by_zone.items():
        rules = []
        for i, p in enumerate(rows):
            base = plate_rule(p["restriction_display"])
            days = day_range(p["restriction_days"] or "")
            if base is None or days is None:
                skipped_zones[zone] = f"uninterpreted plate {p['restriction_display']} / {p['restriction_days']}"
                rules = None
                break
            rules.append({
                "id": f"com-zone:{zone}:{i}",
                **base,
                "days_active": days,
                "time_from": (p["time_restrictions_start"] or "")[:5] or None,
                "time_to": (p["time_restrictions_finish"] or "")[:5] or None,
                "price_per_hour": None,
                "currency": "AUD",
                "match_method": "bay_id",
            })
        if rules:
            zones[zone] = rules

    sensor_zone = {str(s["kerbsideid"]): s["zone_number"] for s in sensors if s.get("kerbsideid") and s.get("zone_number")}
    bay_zone: dict[str, int] = {}
    reasons = collections.Counter()
    for b in bays:
        kid = b.get("kerbsideid")
        if not kid:
            reasons["no_kerbsideid"] += 1
            continue
        kid = str(kid)
        seg_zones = segment_zones.get(b.get("roadsegmentid"), set())
        z = sensor_zone.get(kid)
        if z is not None and z in seg_zones:
            chosen, why = z, "sensor_zone"
        elif z is None and len(seg_zones) == 1:
            chosen, why = next(iter(seg_zones)), "single_zone_segment"
        else:
            reasons["ambiguous_or_inconsistent"] += 1
            continue
        if chosen not in zones:
            reasons["zone_not_interpreted"] += 1
            continue
        bay_zone[kid] = chosen
        reasons[why] += 1

    OUT.write_text(json.dumps({
        "schema_version": 1,
        "source": "City of Melbourne open data: on-street parking bays, bay sensors (zone_number), "
                  "parking zones linked to street segments, sign plates located in each parking zone",
        "method": "bay zone from sensor zone_number (cross-checked against segment) or single-zone segment",
        "counts": dict(reasons),
        "skipped_zones": {str(k): v for k, v in sorted(skipped_zones.items())},
        "zones": {str(k): v for k, v in sorted(zones.items())},
        "bays": dict(sorted(bay_zone.items())),
    }, separators=(",", ":")))
    print(f"wrote {OUT.relative_to(ROOT)}: {len(bay_zone)} bays, {len(zones)} zones, skipped zones {len(skipped_zones)}")
    print(dict(reasons))
    return 0


if __name__ == "__main__":
    sys.exit(main())
