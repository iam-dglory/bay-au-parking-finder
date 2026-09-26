# Bay coverage release — 26 September 2026

Source version: `fa27ca7`, tag `coverage-2026-09-26`; Pages deployment: `0c51191` (successful build, 26 Sep 2026 05:30 UTC).

Status: source and web release; Android internal-testing binary must be rebuilt separately. Coverage is partial, not an inventory of every legal space or every sign.

## Tracked fixes

| ID | Issue | Change | Evidence / remaining limit |
| --- | --- | --- | --- |
| C01 | Sensor gaps and incorrect bay assignments | Read council feed directly; exact kerbside ID, nearest same-ID stored point within 15 m; suppress displaced/duplicate same-ID rows. Add missing published sensor points with their own coordinates and no borrowed rules. | 6,324 published sensor rows; 1,611 IDs absent from stored inventory. Source snapshot contained 5,345 updates within 5 minutes. Counts change with source freshness. |
| C02 | Old readings appeared live | Green/red requires source Lastupdated and refresh both within 5 minutes; refresh every minute and on returning to the app. | Stale, future, malformed and unrelated readings cannot indicate vacancy. Cached database rows lacking exact provenance are ignored. |
| C03 | Complicated or misleading status | Neutral dots and “Availability on arrival” for mapped-only locations; neutral bay clusters; separate “Vacant now” and “No fee” filters. Directions first, schedules and source details collapsed. | Missing occupancy is not converted into vacant or occupied. Permission remains separate from vehicle presence. |
| C04 | Manual reports become outdated | Removed occupied/vacant reporting from spot details. | Historical records retained; reports never control vacancy colours. A driver observation cannot reserve a bay or guarantee arrival availability. |
| C05 | Slow location startup | Quick cached/coarse fix with 5-second request timeout, precise background refinement, 6-second startup fallback, immediate manual choice, offline suggestions for four supported cities. Cancel late callbacks after manual changes. | OS permission and signal still affect speed; native-device field timing remains to be measured. |
| C06 | Limited regional data and missing prices | Expanded OSM parking spaces, areas and explicit street layouts; exact facility operator tariffs; tile Greater Melbourne data; page lists. | Mapped layouts are not legally verified signs. Published prices only; no guessed prices or tariff transfer to adjacent facilities. |

## Published regional catalog

These are source records, not unique physical facilities: entrances and station-level locations may represent the same facility. Council bays and census areas are additional layers.

| Region | Mapped bay records | Area / zone records | Records with operator prices |
| --- | ---: | ---: | ---: |
| Greater Melbourne | 46,002 | 24,793 | 11 (9 Secure facilities and 2 QV entrance records) |
| Chennai | 128 | 593 | 40 |
| Bengaluru | 102 | 1,379 | 70 |
| Hyderabad | 21 | 395 | 2 airport records |

Explicit private/restricted access and bays within mapped private areas are excluded. Untagged access is not asserted to be public. Chennai Metro snapshots without an observation timestamp are dated snapshots, never live sensor readings. Bengaluru station coordinates are labelled station locations, not confirmed car-park entrances; vehicle-specific capacity and no-overnight terms are preserved. Some Chennai facilities accept only two-wheelers. Secure/QV special rates retain entry, exit, day and eligibility conditions.

## Source boundaries and outstanding data

The [council plan](https://mvga-prod-files.s3.ap-southeast-4.amazonaws.com/public/2024-05/parking-kerbside-management-plan.pdf) explicitly states sensors are not in every on-street bay. City of Melbourne is one municipality, not all Greater Melbourne. [DataVic](https://discover.data.vic.gov.au/dataset/on-street-parking-bay-sensors) warns relay outages can delay Lastupdated. Removing the missing-data label cannot create an accurate reading.

Archived council exports include 29,053 bay geometries, 6,270 Pay Stay restrictions, 935 Pay Stay zones, 926 parking zones, both sign-plate tables, meters, historical restrictions, sign panels, dataset metadata and the latest 2024 commercial census (143 rows). Sign-plate exports lack each plate’s coordinates and a reusable plate identifier; parent-zone coordinates cannot prove which side of a sign applies to a bay. Existing schedule confidence guards remain. Overnight no-fee parking is not inferred from a nearby paid schedule alone.

Read-only database audit found 1,062 legacy sensor rows whose sensor ID differs from the assigned spot, 33 displaced same-ID locations and 19 duplicate IDs. This web release bypasses unsafe assignments. It does **not** claim a backend cache repair: no authenticated database mutation was applied on 26 September.

No current reusable public bay-occupancy feed was confirmed for the three Indian cities. Hyderabad Police zone names lack precise bay geometry/current numeric tariffs. Chennai road capacity lists are historical, not current sign schedules. Hyderabad Metro’s 2018 smart-parking document is historical. Bengaluru Airport’s published page did not yield a reusable tariff response. The 2024 L&T announcement confirms paid parking at Nagole/Miyapur but supplies no numeric tariff. These sources are archived or explicitly recorded as gaps; historic/unsupported values are not promoted to current prices. Additional archived official geometry covers Casey restrictions (4,345 segments), Port Phillip accessible parking (402 points) and machines (498 points), and Yarra permit zones (24 polygons). These are context layers, not interpreted as general bays or live availability. Casey’s separate car-parks export was unavailable. Stonnington and Yarra confirm separate sensors but no reusable current per-bay API was confirmed on their council pages. Yarra’s archived coverage map dates to 2018. Maribyrnong links a live dashboard whose hostname did not resolve during this audit. See `source-gap-ledger.json`. Broader live coverage requires council/operator access and exact bay/sign identifiers.

## Files and reproduction

Raw parking data and operator documents: `datasets/melbourne/2026-09-26/` and `datasets/india/2026-09-26/`. Research/audit records: `datasets/research-2026-09-26/`. Published catalog: `public/data/india-parking.json` and `public/data/melbourne/` (1,015 geographic tiles). All acquired parking datasets are kept in the source repository; the lossless Melbourne raw OSM archive is gzip compressed. Private waitlist data is excluded.

`datasets/manifest.json` records file hashes, bytes and retrieval/source metadata. Use `scripts/data-requirements.txt`, then run `build_regional_catalogs.py`, `audit_melbourne_coverage.py`, `finalize_coverage_manifest.py` and `verify_regional_catalogs.py` from the repository root. OSM © contributors / ODbL 1.0; council CC BY; operator documents retain source attribution and are not represented as an open-licensed live feed.

## Validation

67 unit tests across 12 files, lint, TypeScript and production build passed. Catalog validation checked 73,413 records, 1,015 tile memberships and 1,166 file hashes, including private access, duplicate IDs, vehicle tariffs and snapshot/sensor separation. Phone browser checks and deployment verification are recorded in the project tracker. Software checks do not measure street-level vacancy accuracy; paired timed field observations are still required.
