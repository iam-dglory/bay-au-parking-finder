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
import math
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


# Current City of Melbourne kerbside fees (cents/hour), checked 2026-11-18 at
# https://www.melbourne.vic.gov.au/parking-and-transport/parking/Pages/kerbside-parking-fees.aspx
# Peak = weekdays before 7pm; off-peak = weekdays after 7pm and all weekend.
# The Pay Stay datasets still carry pre-2018 prices ($5.50 central, $3.20 outer,
# $0.80 all-day), so they only tell us which tier a block is in, never the price.
TARIFF_CHECKED = "2026-11-18"
TARIFF_URL = "https://www.melbourne.vic.gov.au/parking-and-transport/parking/Pages/kerbside-parking-fees.aspx"
TARIFF = {"central": (700, 400), "outer": (400, 200), "allday": (200, 200)}
PEAK_END = 19 * 60
TIER_RADIUS_M = 400


def old_price_tier(cents: set[int]) -> str | None:
    """Fee tier implied by a block's pre-2018 Pay Stay prices."""
    paid = {c for c in cents if c > 0}
    if not paid:
        return None
    if max(paid) >= 540:
        return "central"
    if paid == {80}:
        return "allday"
    return "outer"


def price_days(days: list[list[list[int]]], tier: str | None) -> list[list[list[int]]]:
    """Replace prices in paid/metered windows with today's tariff for the tier,
    splitting weekday windows at 7pm into peak and off-peak. Free and no-parking
    windows are left alone; with no tier, metered windows stay 'unpublished'."""
    out = []
    for day, windows in enumerate(days):
        priced = []
        for start, end, cents, max_stay in windows:
            if cents == 0 or cents == NO_PARKING or tier is None:
                priced.append([start, end, cents if tier or cents <= 0 else UNPUBLISHED, max_stay])
                continue
            peak, off = TARIFF[tier]
            if 1 <= day <= 5:
                if start < PEAK_END:
                    priced.append([start, min(end, PEAK_END), peak, max_stay])
                if end > PEAK_END:
                    priced.append([max(start, PEAK_END), end, off, max_stay])
            else:
                priced.append([start, end, off, max_stay])
        out.append(priced)
    return out


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

    # Where each block is, for borrowing a neighbour's fee tier.
    seg_points: dict[int, list[tuple[float, float]]] = collections.defaultdict(list)
    for bay in bays:
        seg_points[bay["roadsegmentid"]].append((bay["latitude"], bay["longitude"]))
    seg_centre = {seg: (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)) for seg, pts in seg_points.items()}
    zone_tier = {z: old_price_tier({w[2] for d in zones[z].values() for w in d}) for z in zones}
    seg_tier: dict[int, str] = {}
    for seg, zs in seg_zones.items():
        tiers = {zone_tier[z] for z in zs} - {None}
        if tiers:
            seg_tier[seg] = "central" if "central" in tiers else "outer" if "outer" in tiers else "allday"
    tier_points = [(seg_centre[seg], tier) for seg, tier in seg_tier.items() if seg in seg_centre]

    def neighbour_tier(seg: int) -> str | None:
        """Tier of the nearest priced block within TIER_RADIUS_M, else None."""
        if seg not in seg_centre:
            return None
        lat, lng = seg_centre[seg]
        best = None
        for (plat, plng), tier in tier_points:
            d = math.hypot((plat - lat) * 111_320, (plng - lng) * 111_320 * math.cos(math.radians(lat)))
            if d <= TIER_RADIUS_M and (best is None or d < best[0]):
                best = (d, tier)
        # A metered sign is never all-day parking, so an all-day neighbour means the outer rate.
        return None if best is None else "outer" if best[1] == "allday" else best[1]

    streets = {}
    sign_zones: dict[str, dict] = {}
    counts = collections.Counter()
    for desc, segs in desc_segments.items():
        if len(segs) != 1:
            counts["ambiguous_description"] += sum(seg_bays[s] for s in segs)
            continue
        seg = next(iter(segs))
        # Current kerb signs first: their hours are up to date (meters now run 7am-10pm).
        signed = [(z, sign_zone(z)) for z in sorted(seg_parking_zones.get(seg, ()))]
        if signed and all(r for _, r in signed):
            tier = seg_tier.get(seg) or neighbour_tier(seg)
            keys = []
            for z, (days, lines) in signed:
                key = f"{z}-{tier or 'unpriced'}"
                sign_zones[key] = {"days": price_days(days, tier), "signs": lines}
                keys.append(key)
            exact = len({json.dumps(sign_zones[k]["days"]) for k in keys}) == 1
            streets[desc] = {"segment": seg, "zones": keys, "exact": exact, "same_price": exact, "from_signs": True}
            counts["from_signs" if tier else "from_signs_unpriced"] += seg_bays[seg]
            continue
        zs = sorted(seg_zones.get(seg, ()))
        if not zs:
            counts["no_paid_parking" if not signed else "unrecognised_signs"] += seg_bays[seg]
            continue
        exact = len({schedule(z) for z in zs}) == 1
        same_price = len({tuple(tuple((w[0], w[1], w[2]) for w in day) for day in schedule(z)) for z in zs}) == 1
        streets[desc] = {"segment": seg, "zones": zs, "exact": exact, "same_price": same_price}
        counts["pay_stay_hours"] += seg_bays[seg]

    used = sorted({z for s in streets.values() if not s.get("from_signs") for z in s["zones"]})
    OUT.write_text(json.dumps({
        "schema_version": 1,
        "source": "City of Melbourne open data: pay-stay-parking-restrictions, pay-stay-zones-linked-to-street-segments, on-street-parking-bays",
        "fetched": FETCHED,
        "currency": "AUD",
        "units": "windows are [from_minute, to_minute, cents_per_hour, max_stay_minutes] in Melbourne local time; days 0=Sunday..6=Saturday",
        "bay_counts": dict(counts),
        "tariff": {"checked": TARIFF_CHECKED, "source": TARIFF_URL, "cents_per_hour": TARIFF, "peak": "weekdays before 7pm"},
        "zones": {str(z): {"days": price_days([zones[z].get(d, []) for d in range(7)], zone_tier[z]), **({"monday_inferred": True} if z in monday_inferred else {})} for z in used},
        "sign_source": "City of Melbourne open data: parking-zones-linked-to-street-segments, sign-plates-located-in-each-parking-zone",
        "sign_zones": dict(sorted(sign_zones.items())),
        "streets": dict(sorted(streets.items())),
    }, separators=(",", ":")))
    print(f"wrote {OUT.relative_to(ROOT)}: {len(streets)} streets, {len(used)} zones")
    print(dict(counts))
    return 0


if __name__ == "__main__":
    sys.exit(main())
