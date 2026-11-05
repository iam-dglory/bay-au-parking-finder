# Melbourne parking coverage and pricing-zone audit

**Audit date:** 4 November 2026  
**Status:** Geometry collected and verified; metropolitan parking completeness and pricing are **not** verified as complete.

## Result

BAY does **not** currently contain every parking spot in Greater Melbourne, and the available public sources cannot support a truthful claim of 100% completeness or accuracy.

The reproducible audit uses the ABS ASGS 2021 Greater Melbourne GCCSA as the metropolitan scope and current Vicmap bounded-locality geometry for suburb/locality reporting. The GCCSA covers 9,992.6081 km². It intersects 614 Vicmap localities and parts of 40 LGAs.

| Measure | Audited result |
|---|---:|
| BAY catalogue records read | 70,795 |
| Records inside the official Greater Melbourne scope | 68,150 |
| Mapped bay records inside scope | 45,144 |
| Mapped area records inside scope | 23,006 |
| Localities with one or more catalogue observations | 516 / 614 |
| Localities with zero catalogue observations | 98 / 614 |
| Catalogue records with a numeric tariff | 13 |
| City of Melbourne official bay rows | 29,053 |
| City of Melbourne sensor rows | 6,324 |
| City of Melbourne commercial car parks / spaces | 143 / 59,634 |

The BAY catalogue is based primarily on OpenStreetMap observations. A record means a mapped observation exists; it does not prove that the location is currently legal, public, available, correctly priced, or complete. The City of Melbourne council inventory only covers that municipality and maps to 13 localities in this metropolitan audit. It cannot fill the rest of Greater Melbourne.

The complete locality table is in `datasets/melbourne/2026-11-04/coverage-by-locality.csv`. The 98 zero-record localities are listed in `datasets/melbourne/2026-11-04/provenance-and-audit.json`.

## Pricing-zone findings

There is no current, machine-readable, metro-wide official pricing-zone dataset covering all Greater Melbourne councils.

The collected source material is deliberately separated so historical prices cannot be shown as current:

| File | What is verified | Safe use |
|---|---|---|
| `city-of-melbourne-current-parking-restriction-zones.geojson` | 839 current City of Melbourne zone/sign joins with official road-corridor geometry; all 926 zone-to-segment rows resolved | Current restriction context only. The source does not publish a tariff for each zone. |
| `source-verified-deprecated-paystay-pricing-zones.geojson` | 880 spatial Pay Stay zones with source-published historical rates | Research only. The publisher marks Pay Stay deprecated/static and the rate source was last processed in 2022. Every feature is blocked from activation. |
| `current-cbd-pricing-policy.json` | Current City-published CBD policy text: $7/hour peak to 7pm weekdays, $4/hour after 7pm weekdays and weekends, subject to metered-space/sign conditions | Policy display with a sign-check warning. It is not attached to an invented polygon because no current machine-readable tariff-zone boundary was located. |
| `locality-geometry-candidates.geojson` | Official Vicmap locality geometry clipped to the official Greater Melbourne scope | Geographic grouping only. It is not a tariff zone. |

Current restriction geometry and current prices must not be combined unless the council/operator publishes a stable zone identifier or approves a documented spatial crosswalk. A locality, suburb, road, or proximity buffer is not a valid substitute for a tariff boundary.

## Source coverage by council

Of the 40 LGAs intersecting the ABS Greater Melbourne scope:

- 1 has a substantial official spatial inventory in the collected sources (City of Melbourne), still without a guarantee of every legal space or current per-bay tariff;
- 3 have partial official layers (Casey, Port Phillip and Yarra);
- 2 have discovery/project information but no verified complete reusable bay feed (Stonnington and Maribyrnong);
- Greater Geelong has official parking layers, but only a fringe of that LGA intersects the selected Greater Melbourne scope and those feeds are not integrated here; and
- 33 have no confirmed complete council inventory in this audit.

See `datasets/melbourne/2026-11-04/source-gap-ledger.json` for every LGA and the missing source classes.

## What is required before claiming complete Melbourne coverage

For every intersecting council and private operator, BAY needs a licensed, refreshable source or agreement covering:

1. bay/area geometry and public-access status;
2. sign restrictions and effective dates;
3. current tariffs and tariff-zone geometry or stable bay/zone identifiers;
4. capacity and accessible/vehicle-specific rules;
5. live occupancy, including timestamps, outages and quality flags where available; and
6. an owner-approved reconciliation process for closures, construction, new bays and corrections.

Every record also needs automated validation (schema, geometry, duplicates, referential joins and freshness), anomaly review, and an in-app “check the physical sign” warning. Live availability must expire when stale; it must never be inferred from nearby sensors.

Until those conditions are met, the defensible product claim is: **“BAY shows sourced parking observations across Greater Melbourne, with official detail in selected councils; coverage, prices and availability vary by source.”**

## Reproduction

Run from the repository root after the official source downloads are present:

```bash
PYTHONPATH=/private/tmp/bay-pydeps python3 scripts/build_melbourne_locality_audit.py
```

The script keeps official scope geometry, official locality/LGA geometry, current restriction zones, deprecated price zones and catalogue observations separate. It creates provenance hashes and blocks unverified pricing geometry from activation.
