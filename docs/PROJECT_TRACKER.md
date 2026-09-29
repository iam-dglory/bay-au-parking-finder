# Bay project tracker

Last updated: 29 September 2026 (Australia/Melbourne)

## Current release state

- Source branch: `main`; Android release is in Google Play internal testing.
- Web deployment: `https://iam-dglory.github.io/bay-au-parking-finder/`.
- Waitlist: `https://iam-dglory.github.io/bay-au-parking-finder/waitlist.html`.
- Waitlist data: private Supabase table `public.waitlist_signups`. Public roles can insert and cannot read, update or delete subscriber data.
- Signup email delivery: database queue implemented; an email sending service is still required before messages can be delivered to `gopikaaravindoffl@gmail.com`.

## Waitlist v2

| Form field | Stored column | Rule |
| --- | --- | --- |
| Email | `email` | Required, normalized to lower case |
| Android / iPhone | `device` | Required: `android` or `iphone` |
| Drives in Melbourne | `drives_in_melbourne` | Required boolean |

Form metadata: `form_version=2`, `consent_version=2026-09-25`, database `created_at`. Name, suburb and driving frequency were removed from the public form. QA addresses on reserved example domains do not enter the notification queue.

## 28 September US catalog expansion

- 29 Sep follow-up: added official SFMTA meter-location layer for San Francisco. Of 17,310 active general-use query rows, 16,450 without additional signage are published; 860 special-signage rows are archived only. The city-centre 500 m search now returns 1,024 meter locations and 78 OSM parking areas/zones. M clusters remain distinct from P areas. Meter locations do not establish current vacancy, legal parking hours, or price. Raw source, 3 tiles and manifest are registered in the dataset ledger. [Source and limitations](us-parking-coverage-2026-09-28.md).
- The phone map groups dense meter locations, and the US list puts street locations before parking areas. A failed meter catalog now shows a load error instead of silently presenting incomplete coverage. Validation: 75 frontend tests, lint, production build, checksum audit and 390 × 844 phone map/list check passed.

- Added 54 state/territory-source extracts: 1,530,539 published OSM parking records across 36,292 compressed geographic tiles. This comprises 112,285 individually mapped space records and 1,418,254 area/zone records, including 52,209 mapped street-parking zones. Records can overlap at state boundaries and are not a count of physically available spaces. The 54 filtered parking-only source archives, source PBF checksums, published tiles and coverage audit are retained. [Source, scope and rebuild procedure](us-parking-coverage-2026-09-28.md).
- US maps separate mapped areas, street-parking zones and individually mapped spaces. Spaces inside mapped facilities are grouped under the facility marker. The displayed count is mapped places, never claimed vacancies.
- US occupancy is not marked vacant or occupied because the source does not supply a nationwide live sensor feed. Bay displays 1,571 source records with an explicit `charge` tag and a current-price caveat; a bare `fee=yes` does not supply an hourly rate.
- All 54 regions passed the archive checksum and tile count audit; non-empty 5 km samples include New York City, Los Angeles, Chicago, Houston, San Francisco, Seattle, Washington DC, Miami, Honolulu, Anchorage, San Juan, Pago Pago and Hagatna. `datasets/manifest.json` accounts for every published US tile and source archive. Frontend validation: 73 tests across 14 files, lint and a 223 MB production build passed.
- Source commit `3c9a5e2b`; Pages commit `31514b5e`, built 28 September 2026 at 13:05 UTC. Served HTML, waitlist, US index, Washington tile and app JavaScript match the validated build byte for byte. Live searches showed 196 mapped places within 1 km of central Washington DC, 131 in central Los Angeles and 72 in central Honolulu. These are mapped features, not vacancy counts. Phone viewport at 390 × 844 had no horizontal overflow in the Washington map/list.

## 26 September coverage release

### QVM-01 follow-up: off-street parking classification

- Open-air Queen Victoria Market parking now displays as a parking area with a blue boundary and P marker, rather than 603 separate grey bays. Undercover parking is a separate facility.
- Added exact facility tariffs, time-window conditions, Queen Street entry, opening hours and the operator's 506-space undercover capacity. Historical census duplicates are replaced in the display; their source records remain stored.
- Archived three QVM operator pages, facility/census crosswalk and per-space area memberships. Applied source-polygon grouping to 21,541 mapped Melbourne spaces without attaching guessed sensors.
- Validation: 70 frontend tests, two geometry/operator-source checks, lint, production build, 73,413 catalog records and 1,174 archive hashes. Phone checks verify market area details and map boundary. Live occupancy for the market car parks is not published through a confirmed reusable feed.
- Source commit `2bc0ed4`, tag `qvm-area-2026-09-26`; Pages commit `9106edf`, built successfully at 13:20:49 UTC on 26 Sep. Served HTML, JavaScript/CSS, Melbourne index/market tile and waitlist match the validated build byte for byte.
- Phone verification (390 × 844): two current market facilities, no duplicate census listings, open-air boundary/P marker, scrollable tariff table, no horizontal overflow. Compass controls hide during a parking-area popup so the title stays readable.
- Details: [QVM-01 correction](qvm-parking-area-fix-2026-09-26.md).

Earlier coverage release: `coverage-2026-09-26` (web source and datasets; Android internal-testing binary is separate).

- Application/data source commit: `fa27ca7`.
- GitHub Pages deployment commit: `0c51191`; build succeeded 26 Sep 2026 at 05:30 UTC.
- Served app entry, India catalog, Melbourne index/CBD tile and waitlist page match the validated production build byte for byte.

Details and limits: [coverage release](coverage-release-2026-09-26.md). Source archives, operator documents and published catalogs are tracked in Git; subscriber data remains private.

- Direct council sensor layer with exact IDs, a five-minute source freshness limit and missing published sensor coordinates.
- Removed manual vacancy reporting; neutral mapped-location markers, a separate Vacant now filter, paginated lists and simpler details.
- Faster cached GPS startup, background refinement, cancellation and offline city suggestions.
- Greater Melbourne: 46,002 mapped bay records, 24,793 area/zone records, 11 priced operator records. These are not an exhaustive unique facility inventory.
- Chennai: 128 bays, 593 areas/zones, 40 priced records. Bengaluru: 102 bays, 1,379 areas/zones, 70 priced records. Hyderabad: 21 bays, 395 areas/zones, 2 priced airport records.
- No authenticated backend mutation this release; unsafe legacy sensor assignments are bypassed in the client.
- Phone browser verification (390 × 844): Melbourne live readings and bay details; Chennai facility tariff slabs; Bengaluru bays and area pagination; Hyderabad bays/areas at 5 km; no horizontal overflow or occupancy-report buttons in the checked detail.
- Read-only phone smoke checks passed for the guide (India selected immediately), activity and sign-contribution screen.
- Open spot details follow refreshed unfiltered source rows, so a Vacant now filter cannot freeze an old vacancy. Manual country selection is retained for the guide.
- 67 unit tests across 12 files, lint and production build passing; 73,413 catalog records and 1,166 archived/published files validated.

## India catalog snapshot — 25 September (historical)

Raw OSM responses and operator source documents are archived under `datasets/india/2026-09-25/`. The deployed compact catalog is generated by `scripts/build_india_catalog.py` and must not be hand-edited.

| City | Raw features | Imported | Bays | Areas | Priced areas | Operator snapshots | Sensor bays |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Chennai | 413 | 381 | 128 | 253 | 2 | 2 | 0 |
| Bengaluru | 1,845 | 1,313 | 102 | 1,211 | 22 | 0 | 0 |
| Hyderabad | 433 | 388 | 21 | 367 | 2 | 0 | 0 |

Private, permit-only and other explicitly restricted records are excluded. Points inside mapped restricted parking areas are also excluded. Records without a published access tag remain visible with “Entry conditions apply”; Bay does not claim they are public without evidence.

Pricing is attached only to exact matched operator facilities. Capacity is never converted into vacancy. Chennai Metro availability is shown as a fetched operator snapshot because its endpoint does not publish an observation timestamp. No current reusable public bay-sensor feed was confirmed for Bengaluru or Hyderabad.

## Data sources and versions

- OpenStreetMap Overpass snapshots, fetched 25 September 2026; full raw tags, geometry and edit timestamps preserved. ODbL 1.0 attribution applies.
- Chennai Metro approved parking tariff effective 1 February 2025, facility availability and public availability response.
- Bengaluru Metro station-capacity and tariff page, fetched 25 September 2026.
- Hyderabad Airport public parking tariff and Hyderabad Traffic Police parking-zone pages, fetched 25 September 2026.
- Checksums, sizes, source URLs and fetch times: `datasets/manifest.json`.

## Change history

- 26 Sep: audited Melbourne sensors/signs, expanded regional catalogs and sourced operator tariffs; improved location startup and removed manual vacancy reports.

- 25 Sep: added India archive, audit, restricted-area exclusion, bay/area layers, exact facility tariffs, source details and Chennai snapshots.
- 25 Sep: rebuilt waitlist with three fields, private constraints, duplicate protection, share actions and notification queue.
- 25 Sep: added parking-area prices and provenance; simplified markers, schedules and occupancy language.
- 24 Sep: redesigned mobile UI, made screens scrollable, added parking areas, compass rotation and Test 1 accuracy fixes.
- Earlier database migrations, archived datasets and Test 1 PDF remain tracked in Git and `supabase/migrations/`.

## Verification — 25 September (historical)

- Production build: passing.
- Unit tests: 42 passing across 8 files.
- Database migration: applied successfully on 25 September 2026.
- Waitlist v2 write: HTTP 201 with a reserved QA address, excluded from invitations and notifications.
- Remaining dependency: connect a server-side email sender to process `waitlist_notifications`.
