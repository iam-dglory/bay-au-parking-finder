# Datasets

Raw snapshots of the open government data Bay is built on. Fetched **2026-09-22** — these are point-in-time exports, not live mirrors. The app itself re-syncs the live sensor feed on a schedule (see `../scripts/`); everything else here was a one-off import, so re-fetch and re-run the matching import/migration if you want to refresh it.

All datasets are published under their respective councils' open data licences (Creative Commons Attribution, unless noted) — attribute the source council if you republish.

## `melbourne-city-of-melbourne/`

Everything here covers the **City of Melbourne LGA only** (CBD, Docklands, Southbank, Carlton, North Melbourne, Kensington, Parkville, East Melbourne) — confirmed by exhaustive search (Sep 2026) to be the *only* Greater Melbourne council publishing bay-level parking data; neighbouring councils (Yarra, Port Phillip, Stonnington, Boroondara, etc.) publish nothing comparable.

| File | Source dataset | Rows | Used for |
|---|---|---|---|
| `on-street-parking-bays.json` | [on-street-parking-bays](https://data.melbourne.vic.gov.au/explore/dataset/on-street-parking-bays/) | 29,053 | Bay coordinates, road segment description (→ `address_text`), and `kerbsideid` (→ `parking_spots.kerbside_id`, council bay reference, ~17% coverage) |
| `pay-stay-parking-restrictions.json` | [pay-stay-parking-restrictions](https://data.melbourne.vic.gov.au/explore/dataset/pay-stay-parking-restrictions/) | 6,270 | Paid-meter rules (days/times/price) per Pay Stay zone. **Known gap in the source itself**: only 10 of 6,270 rows have a Monday entry — we extend the uniform Tue–Sat rate to Monday for the ~14,444 affected spots (see migration `fix_missing_monday_paystay_rules`) |
| `pay-stay-zones-linked-to-street-segments.json` | [pay-stay-zones-linked-to-street-segments](https://data.melbourne.vic.gov.au/explore/dataset/pay-stay-zones-linked-to-street-segments/) | 935 | Joins Pay Stay zones to road segments → bay coordinates |
| `sign-plates-located-in-each-parking-zone.json` | [sign-plates-located-in-each-parking-zone](https://data.melbourne.vic.gov.au/explore/dataset/sign-plates-located-in-each-parking-zone/) | 1,821 | Legacy zone signage (2P/LZ/PP-style codes) for the older, non-Pay-Stay zone system |
| `parking-zones-linked-to-street-segments.json` | [parking-zones-linked-to-street-segments](https://data.melbourne.vic.gov.au/explore/dataset/parking-zones-linked-to-street-segments/) | 926 | Joins legacy zones to road segments → bay coordinates |
| `on-street-parking-bay-sensors.json` | [on-street-parking-bay-sensors](https://data.melbourne.vic.gov.au/explore/dataset/on-street-parking-bay-sensors/) | 6,324 | **Live** in-ground sensor occupancy (verified genuinely live: ~85% of sensors report within the last hour). Matched to `parking_spots` by nearest coordinate (≤5m) — the two datasets use incompatible kerbside-id numbering. This snapshot is a point-in-time copy; the app re-fetches this URL on a schedule, see `../scripts/sync_melbourne_sensors.py` and the server-side `pg_cron` version in `../supabase/migrations/`. |
| `off-street-car-parks-2024-commercial.json` | [off-street-car-parks-with-capacity-and-type](https://data.melbourne.vic.gov.au/explore/dataset/off-street-car-parks-with-capacity-and-type/) | 143 (filtered) | Public/commercial multi-storey car parks with total capacity (~59,600 spaces). Filtered from the full 151,199-row, 23-year property census down to `census_year=2024, parking_type=Commercial` — the full file also has residential/private-garage counts irrelevant to a public parking finder. No live availability is published for these, capacity only. |

## `brisbane-city-council/`

| File | Source dataset | Rows | Used for |
|---|---|---|---|
| `parking-sign-locations.json` | [parking-sign-locations](https://data.brisbane.qld.gov.au/explore/dataset/parking-sign-locations/) | 51,984 | Brisbane CBD sign locations + restriction type/hours (`parkingrestrictiondaysandtimes`, `parkingrestrictioncode`) — Brisbane's own version of what Melbourne's Pay Stay/legacy datasets provide |

## Coverage reality check

If you're deciding where to expand next: bay-level open data like this is rare. Before adding a new city, search that city/state's open data portal for "parking" the way this was done for Melbourne (`discover.data.vic.gov.au` / `data.gov.au` full-text search across *all* organisations, not just the city's own council) — most councils simply don't publish it, and there's no substitute for checking rather than assuming.
