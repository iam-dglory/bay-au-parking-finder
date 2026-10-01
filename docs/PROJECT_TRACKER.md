# Bay project tracker

Last updated: 1 October 2026 (Australia/Melbourne)

## Android closed test — 1 October 2026

- Built Bay `1.1.0` (Android version code `2`) from source commit `45e8bff9` and the current web assets. The signed local bundle is `/Users/gopika/Documents/Codex/2026-09-24/c/outputs/android/bay-1.1.0-code2-2026-10-01.aab` outside Git; SHA-256 `beb9b0656f8f27b90c053e4258ca923bbe8ce2a3e54384b9511f464c7222c088`. The upload certificate SHA-256 matches Play Console's registered upload key (`A2:03:2D:9A:BB:4E:F3:B9:02:D7:1C:D2:80:BC:42:0E:46:86:55:3D:CC:E3:79:6E:3F:1E:BD:35:1F:A1:08:87`). Keep the private keystore and properties out of Git.
- All 75 tests, lint, production web build and signed Gradle AAB build passed. The AAB contains the newly built web assets. Play Console's closed-test track targets Australia, India and the United States; its tester setup uses the selected nine-person `Bay Internal Testers` list and `gopikaaravindoffl@gmail.com` for feedback.
- The signed AAB was uploaded to Play Console's **Alpha closed-testing** release, and Play accepted version code `2` / version `1.1.0` (target SDK 36). The release review found no blocking errors; it showed two nonblocking warnings about missing deobfuscation and native debug-symbol files. On 1 October, all 14 pending release, country, tester, listing and app-content changes were submitted and subsequently **published**. Play now shows the track as **Active** and Bay 1.1.0 Closed Beta as **Available to selected testers**, released 1 October at 4:14 pm. The web join link is `https://play.google.com/apps/testing/au.com.bayparking.app`; the Play listing is `https://play.google.com/store/apps/details?id=au.com.bayparking.app`. The Dashboard currently shows **0 opted-in testers**. Before applying for production access, at least 12 tester accounts must remain opted in continuously for 14 days; nine addresses are currently on the selected list. Adding an address or installing on multiple phones does not replace opt-in.

## Privacy policy — 29 September 2026

- Replaced the legacy policy with a standalone, mobile-friendly 15-section Bay Privacy Policy and kept the waitlist's `#waitlist` link working. Source: `public/privacy-policy.html` (also mirrored at repository root). The Guide now links to it from within the app. The policy discloses stored search coordinates, anonymous usage records, current and historical waitlist fields, third-party map/geocoding services, and the fact that uploaded sign-photo URLs are public before moderation.
- Based on the current app and Supabase migrations; no subscriber data was placed in Git. The policy does not claim automatic deletion periods or that all sign photos stay private during review.
- Before representing the Android release as fully Play-compliant, reconcile the Play Console Data safety form with this policy, confirm an in-app account/data-deletion path for anonymous sessions, verify the actual deletion workflow and provider processing regions, and address the public sign-photo bucket and publicly readable legacy occupancy-observation table. A policy page alone cannot implement these controls.
- Source commits `9e06985e`, `d26eddd3`; GitHub Pages commits `7a700c8b`, `e17e31e0`. The second pair clarifies legacy observations and backup limits. TypeScript and production build passed; all 15 policy anchors, waitlist anchor and built-page copy were checked. The published `privacy-policy.html` loaded with the new date and sections on 29 September 2026.

## Current release state

- Source branch: `main`; Android release is in Google Play internal testing.
- Web deployment: `https://iam-dglory.github.io/bay-au-parking-finder/`.
- Waitlist: `https://iam-dglory.github.io/bay-au-parking-finder/waitlist.html`.
- Waitlist data: private Supabase table `public.waitlist_signups`. Public roles can insert and cannot read, update or delete subscriber data.
- Signup email delivery: database queue implemented; an email sending service is still required before messages can be delivered to `gopikaaravindoffl@gmail.com`.

## Waitlist v3 — three-country early access

The same public link now accepts early-access interest for Australia, India and the United States. The form stores only email, phone type and the country where the person drives most; it does not ask for a city or invent equal data coverage. The authenticated Supabase migration `20260929040000_waitlist_v3_countries.sql` was applied on 29 September. Existing v1/v2 responses remain unchanged, and duplicate v2/v3 emails are accepted by the form as already joined without creating a second row. The owner-notification queue handles v3 records but still needs an email sender to deliver alerts.

| Form field | Stored column | Rule |
| --- | --- | --- |
| Email | `email` | Required, normalized to lower case |
| Android / iPhone | `device` | Required: `android` or `iphone` |
| Where do you drive most? | `country_code` | Required: `AU`, `IN` or `US` |

Form metadata: `form_version=3`, `consent_version=2026-09-29`, database `created_at`. The previous `drives_in_melbourne` value is not sent by v3; historical v2 answers remain private. Do not commit subscriber rows or private workbook.

29 Sep verification: source implementation commit `d66edf61`; Pages commit `af737af4`. The served waitlist has all three country choices. At a 390 × 844 phone viewport it scrolls vertically and has no horizontal overflow. A reserved example-domain QA signup submitted through the live form stored `device=iphone`, `country_code=IN`, `form_version=3` with no Melbourne value and no owner-notification queue item. The private workbook was refreshed from the authenticated table: 1 genuine signup, 3 QA rows excluded; the hourly refresh automation now understands v3 and preserves the historical Melbourne column. No real subscriber was contacted. The sender connection is still outstanding.

### Coverage reality across the three countries

| Country | App data available | Live occupancy / price limits |
| --- | --- | --- |
| Australia | Greater Melbourne catalog with 46,002 mapped bay records and 24,793 mapped area/zone records, plus council-sign/rule sources. | Current Melbourne council sensor readings apply only to exact matched published sensor bays; they do not cover every bay or all Australia. Eleven operator-priced records in the 26 Sep catalog. |
| India | Chennai 128 bays / 593 areas; Bengaluru 102 / 1,379; Hyderabad 21 / 395. | No confirmed reusable current bay-sensor feed. 40 Chennai, 70 Bengaluru and 2 Hyderabad priced records are source-specific, not citywide tariffs. Other Indian cities do not have comparable coverage yet. |
| United States | 54 state/territory OSM extracts with 1,530,539 mapped records, including 112,285 individually mapped spaces and 52,209 street-parking zones; San Francisco adds 16,450 official meter locations. | No nationwide live vacancy or complete sign inventory. SFMTA meters are mapped locations, not current availability. Prices are shown only from explicit source charges; a fee tag alone is not a tariff. |

Counts are source records, not unique legal spaces or current vacancies. The app must continue to use neutral status when a reliable live reading is absent. See [coverage release](coverage-release-2026-09-26.md) and [US source audit](us-parking-coverage-2026-09-28.md).

29 Sep integrity recheck: 73,413 Australia/India regional catalog records, 1,015 Melbourne tiles, 21,541 grouped Melbourne spaces, price/access rules, source IDs and sensor-versus-snapshot semantics passed `verify_regional_catalogs.py`. The US verifier passed all 54 extracts, 1,530,539 records and 36,292 published tiles. All 75 frontend tests, lint and production build passed. These checks verify stored data and UI behavior, not real-world vacancy accuracy or complete national sign coverage.

## Waitlist v2 (historical)

| Form field | Stored column | Rule |
| --- | --- | --- |
| Email | `email` | Required, normalized to lower case |
| Android / iPhone | `device` | Required: `android` or `iphone` |
| Drives in Melbourne | `drives_in_melbourne` | Required boolean |

Form metadata: `form_version=2`, `consent_version=2026-09-25`, database `created_at`. Name, suburb and driving frequency were removed from the public form. QA addresses on reserved example domains do not enter the notification queue.

## 28 September US catalog expansion

- 29 Sep follow-up: added official SFMTA meter-location layer for San Francisco. Of 17,310 active general-use query rows, 16,450 without additional signage are published; 860 special-signage rows are archived only. The city-centre 500 m search now returns 1,024 meter locations and 78 OSM parking areas/zones. M clusters remain distinct from P areas. Meter locations do not establish current vacancy, legal parking hours, or price. Raw source, 3 tiles and manifest are registered in the dataset ledger. [Source and limitations](us-parking-coverage-2026-09-28.md).
- The phone map groups dense meter locations, and the US list puts street locations before parking areas. A failed meter catalog now shows a load error instead of silently presenting incomplete coverage. Validation: 75 frontend tests, lint, production build, checksum audit and 390 × 844 phone map/list check passed.
- Archived three additional official SF regulation/color-curb layers (6,894 + 871 + 17,577 records) with full geometry and metadata. They are excluded from user-facing rules because SFMTA describes the regulation layers as not comprehensively vetted, the color-curb layer is dated 2021, and no exact meter-to-sign join has been verified. Their source URLs and checksums are in `datasets/manifest.json`.
- Implementation/source commits: `04c568cf`, `0ecf316a`; GitHub Pages deployment: `dce4edf2`. Live 500 m San Francisco map, list and meter detail were checked on a 390 × 844 viewport. The served HTML references the validated `index-CFdXUpl5.js` bundle, and the SFMTA catalog index is available at the public data path.

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
