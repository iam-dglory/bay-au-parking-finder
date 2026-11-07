"""Build street parking rates for City of Melbourne paid bays.

Answers "what does this street bay cost, and for how long can I stay" from the
council's Pay Stay datasets:
  - pay-stay-parking-restrictions: per pay-stay zone, per weekday, time windows
    with cost_per_hour (cents) and maximum_stay (minutes)
  - pay-stay-zones-linked-to-street-segments: which zones sit on which street
  - on-street-parking-bays: bay -> road segment and its description

Bays in the app carry the segment description as their address, so streets are
keyed by that description.

A street is "exact" when every pay-stay zone on it has the same schedule
(price AND maximum stay). Otherwise the app shows the range and tells the
driver to check the meter. Nothing is averaged or guessed.

Source gap: Monday rows are missing for almost every zone. As in the existing
migration fix_missing_monday_paystay_rules, Monday copies Tuesday only when
Tuesday-Friday are identical, and the zone is flagged monday_inferred.

Output: public/data/melbourne/street-rates.json
Run:    python3 -I scripts/build_melbourne_street_rates.py
"""
from __future__ import annotations

import collections
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "datasets" / "melbourne-city-of-melbourne"
OUT = ROOT / "public" / "data" / "melbourne" / "street-rates.json"
FETCHED = "2026-09-26"  # datasets/manifest.json fetched_at for the same checksums

# Council day_of_week: 1=Monday .. 7=Sunday. App uses JS getDay(): 0=Sunday .. 6=Saturday.
COUNCIL_TO_JS = {1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0}


def minutes(hhmm: str) -> int:
    h, m = hhmm.strip().split(":")[:2]
    return int(h) * 60 + int(m)


def main() -> int:
    restrictions = json.loads((SRC / "pay-stay-parking-restrictions.json").read_text())
    zone_links = json.loads((SRC / "pay-stay-zones-linked-to-street-segments.json").read_text())
    bays = json.loads((SRC / "on-street-parking-bays.json").read_text())

    # zone -> js day -> sorted windows [from, to, cents, max_stay]
    zones: dict[int, dict[int, list[list[int]]]] = collections.defaultdict(lambda: collections.defaultdict(list))
    for r in restrictions:
        day = COUNCIL_TO_JS[int(r["day_of_week"])]
        zones[r["pay_stay_zone"]][day].append([
            minutes(r["start_time"]), minutes(r["end_time"]), int(r["cost_per_hour"]), int(r["maximum_stay"] or 0),
        ])
    monday_inferred = set()
    for zone, days in zones.items():
        for windows in days.values():
            windows.sort()
        if 1 not in days and all(d in days for d in (2, 3, 4, 5)) and days[2] == days[3] == days[4] == days[5]:
            days[1] = [list(w) for w in days[2]]
            monday_inferred.add(zone)

    def schedule(zone: int):
        return tuple(tuple(tuple(w) for w in zones[zone].get(d, [])) for d in range(7))

    seg_zones: dict[int, set[int]] = collections.defaultdict(set)
    for link in zone_links:
        if link["pay_stay_zone"] in zones:
            seg_zones[link["street_segment_id"]].add(link["pay_stay_zone"])

    desc_segments: dict[str, set[int]] = collections.defaultdict(set)
    seg_bays = collections.Counter()
    for b in bays:
        desc_segments[b["roadsegmentdescription"]].add(b["roadsegmentid"])
        seg_bays[b["roadsegmentid"]] += 1

    streets = {}
    counts = collections.Counter()
    for desc, segs in desc_segments.items():
        if len(segs) != 1:
            counts["ambiguous_description"] += sum(seg_bays[s] for s in segs)
            continue
        seg = next(iter(segs))
        zs = sorted(seg_zones.get(seg, ()))
        if not zs:
            counts["no_paid_parking"] += seg_bays[seg]
            continue
        exact = len({schedule(z) for z in zs}) == 1
        same_price = len({tuple(tuple((w[0], w[1], w[2]) for w in day) for day in schedule(z)) for z in zs}) == 1
        streets[desc] = {"segment": seg, "zones": zs, "exact": exact, "same_price": same_price}
        counts["exact" if exact else "same_price_limits_vary" if same_price else "price_varies"] += seg_bays[seg]

    used = sorted({z for s in streets.values() for z in s["zones"]})
    OUT.write_text(json.dumps({
        "schema_version": 1,
        "source": "City of Melbourne open data: pay-stay-parking-restrictions, pay-stay-zones-linked-to-street-segments, on-street-parking-bays",
        "fetched": FETCHED,
        "currency": "AUD",
        "units": "windows are [from_minute, to_minute, cents_per_hour, max_stay_minutes] in Melbourne local time; days 0=Sunday..6=Saturday",
        "bay_counts": dict(counts),
        "zones": {str(z): {"days": [zones[z].get(d, []) for d in range(7)], **({"monday_inferred": True} if z in monday_inferred else {})} for z in used},
        "streets": dict(sorted(streets.items())),
    }, separators=(",", ":")))
    print(f"wrote {OUT.relative_to(ROOT)}: {len(streets)} streets, {len(used)} zones")
    print(dict(counts))
    return 0


if __name__ == "__main__":
    sys.exit(main())
