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

Sign fallback: the pay-stay link table skips many metered CBD blocks (e.g.
Little Bourke Street between Swanston and Elizabeth). For a block with no
pay-stay zone, the council's parking-zone sign plates still say what the kerb
allows and when (MP2P = metered 2P, 2P = free 2P, LZ30 = loading zone, ...).
Those blocks get schedules from the signs, with special cents values:
  -1 = metered, hourly rate not published for this block
  -2 = no general parking (loading / permit / disabled zone)
Unrecognised sign codes leave the block out rather than guess.

Output: public/data/melbourne/street-rates.json
Run:    python3 -I scripts/build_melbourne_street_rates.py
"""
from __future__ import annotations

import collections
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "datasets" / "melbourne-city-of-melbourne"
OUT = ROOT / "public" / "data" / "melbourne" / "street-rates.json"
# Date the source files were fetched; the weekly refresh job sets RATES_FETCHED.
FETCHED = os.environ.get("RATES_FETCHED", "2026-09-26")

# Council day_of_week: 1=Monday .. 7=Sunday. App uses JS getDay(): 0=Sunday .. 6=Saturday.
COUNCIL_TO_JS = {1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0}


def minutes(hhmm: str) -> int:
    h, m = hhmm.strip().split(":")[:2]
    return int(h) * 60 + int(m)


SIGN_DAYS = {
    "Mon-Fri": [1, 2, 3, 4, 5], "Sat-Sun": [6, 0], "Sat": [6], "Sun": [0], "Fri": [5],
    "Mon-Sat": [1, 2, 3, 4, 5, 6], "Mon-Sun": [0, 1, 2, 3, 4, 5, 6], "Mon-Thu": [1, 2, 3, 4],
}
UNPUBLISHED, NO_PARKING = -1, -2


def sign_rule(code: str):
    """(cents, max_stay_minutes, plain-English label) for a sign code, or None."""
    import re
    if m := re.fullmatch(r"MP(\d)P", code):
        return UNPUBLISHED, int(m[1]) * 60, f"{m[1]}P meter"
    if m := re.fullmatch(r"(\d)P", code):
        return 0, int(m[1]) * 60, f"{m[1]}P, free"
    if code == "QP":
        return 0, 15, "¼P (15 min), free"
    if m := re.fullmatch(r"FP(\d+)", code):
        return 0, int(m[1]), f"{m[1]} min, free"
    if m := re.fullmatch(r"FP(\d)P", code):
        return 0, int(m[1]) * 60, f"{m[1]}P, free"
    if code.startswith("LZ"):
        return NO_PARKING, 0, "Loading zone"
    if code == "PP":
        return NO_PARKING, 0, "Permit holders only"
    if code.startswith("DP"):
        return NO_PARKING, 0, "Disabled permit only"
    return None


def main() -> int:
    restrictions = json.loads((SRC / "pay-stay-parking-restrictions.json").read_text())
    zone_links = json.loads((SRC / "pay-stay-zones-linked-to-street-segments.json").read_text())
    bays = json.loads((SRC / "on-street-parking-bays.json").read_text())
    parking_zone_links = json.loads((SRC / "parking-zones-linked-to-street-segments.json").read_text())
    plates = json.loads((SRC / "sign-plates-located-in-each-parking-zone.json").read_text())

    seg_parking_zones: dict[int, set[int]] = collections.defaultdict(set)
    for link in parking_zone_links:
        seg_parking_zones[link["segment_id"]].add(link["parkingzone"])
    zone_plates: dict[int, list[dict]] = collections.defaultdict(list)
    for plate in plates:
        zone_plates[plate["parkingzone"]].append(plate)

    def sign_zone(zone: int):
        """(week schedule, sign lines) from a parking zone's plates, or None."""
        days: list[list[list[int]]] = [[] for _ in range(7)]
        lines = []
        for plate in zone_plates.get(zone, []):
            rule = sign_rule(plate["restriction_display"])
            day_list = SIGN_DAYS.get(plate["restriction_days"])
            if rule is None or day_list is None:
                return None
            start = minutes(plate["time_restrictions_start"])
            end = minutes(plate["time_restrictions_finish"]) or 1440
            for d in day_list:
                days[d].append([start, end, rule[0], rule[1]])
            lines.append((min(day_list, key=lambda d: (d + 6) % 7), start, f"{plate['restriction_days']} {plate['time_restrictions_start'][:5]}\u2013{plate['time_restrictions_finish'][:5]}: {rule[2]}"))
        if not lines:
            return None
        for i, windows in enumerate(days):
            windows.sort()
            merged: list[list[int]] = []
            for w in windows:  # 2P 4-7pm + 2P 7-10pm reads as one 2P period, as on the kerb
                if merged and merged[-1][1] == w[0] and merged[-1][2:] == w[2:]:
                    merged[-1][1] = w[1]
                else:
                    merged.append(w)
            days[i] = merged
        return days, [line for _, _, line in sorted(lines, key=lambda x: ((x[0] + 6) % 7, x[1]))]

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
    sign_zones: dict[int, dict] = {}
    counts = collections.Counter()
    for desc, segs in desc_segments.items():
        if len(segs) != 1:
            counts["ambiguous_description"] += sum(seg_bays[s] for s in segs)
            continue
        seg = next(iter(segs))
        zs = sorted(seg_zones.get(seg, ()))
        if not zs:
            signed = [(z, sign_zone(z)) for z in sorted(seg_parking_zones.get(seg, ()))]
            if signed and all(r for _, r in signed):
                for z, (days, lines) in signed:
                    sign_zones[z] = {"days": days, "signs": lines}
                exact = len({json.dumps(r[0]) for _, r in signed}) == 1
                streets[desc] = {"segment": seg, "zones": [z for z, _ in signed], "exact": exact, "same_price": exact, "from_signs": True}
                counts["from_signs"] += seg_bays[seg]
            else:
                counts["no_paid_parking" if not signed else "unrecognised_signs"] += seg_bays[seg]
            continue
        exact = len({schedule(z) for z in zs}) == 1
        same_price = len({tuple(tuple((w[0], w[1], w[2]) for w in day) for day in schedule(z)) for z in zs}) == 1
        streets[desc] = {"segment": seg, "zones": zs, "exact": exact, "same_price": same_price}
        counts["exact" if exact else "same_price_limits_vary" if same_price else "price_varies"] += seg_bays[seg]

    used = sorted({z for s in streets.values() if not s.get("from_signs") for z in s["zones"]})
    OUT.write_text(json.dumps({
        "schema_version": 1,
        "source": "City of Melbourne open data: pay-stay-parking-restrictions, pay-stay-zones-linked-to-street-segments, on-street-parking-bays",
        "fetched": FETCHED,
        "currency": "AUD",
        "units": "windows are [from_minute, to_minute, cents_per_hour, max_stay_minutes] in Melbourne local time; days 0=Sunday..6=Saturday",
        "bay_counts": dict(counts),
        "zones": {str(z): {"days": [zones[z].get(d, []) for d in range(7)], **({"monday_inferred": True} if z in monday_inferred else {})} for z in used},
        "sign_source": "City of Melbourne open data: parking-zones-linked-to-street-segments, sign-plates-located-in-each-parking-zone",
        "sign_zones": {str(z): sign_zones[z] for z in sorted(sign_zones)},
        "streets": dict(sorted(streets.items())),
    }, separators=(",", ":")))
    print(f"wrote {OUT.relative_to(ROOT)}: {len(streets)} streets, {len(used)} zones")
    print(dict(counts))
    return 0


if __name__ == "__main__":
    sys.exit(main())
