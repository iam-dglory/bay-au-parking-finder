# Datasets

Archived dataset exports and catalog responses, including sources not used in the app. Fetch dates are recorded in `manifest.json` where known; older snapshots have an unknown exact fetch time. These are point-in-time exports, not live mirrors. The app itself re-syncs the live sensor feed on a schedule (see `../scripts/`); everything else here was a one-off fetch, so re-run the fetch if you want a fresher copy.

Source licence terms must be checked per dataset before reuse; retain council attribution. Archiving a source does not verify its accuracy or grant additional reuse rights.

## `melbourne-city-of-melbourne/`

Everything here covers the **City of Melbourne LGA only** (CBD, Docklands, Southbank, Carlton, North Melbourne, Kensington, Parkville, East Melbourne) . This is the primary source audited here; the archive is not an exhaustive survey of every Greater Melbourne council. See the coverage audit for known expansion sources and gaps.

### Used in the app

| File | Source dataset | Rows | Used for |
|---|---|---|---|
| `on-street-parking-bays.json` | [on-street-parking-bays](https://data.melbourne.vic.gov.au/explore/dataset/on-street-parking-bays/) | 29,053 | Bay coordinates, road segment description (→ `address_text`), and `kerbsideid` (→ `parking_spots.kerbside_id`, council bay reference, ~17% coverage) |
| `pay-stay-parking-restrictions.json` | [pay-stay-parking-restrictions](https://data.melbourne.vic.gov.au/explore/dataset/pay-stay-parking-restrictions/) | 6,270 | Paid-meter rules (days/times/price) per Pay Stay zone. **Known gap in the source itself**: only 10 of 6,270 rows have a Monday entry — we extend the uniform Tue–Sat rate to Monday for the ~14,444 affected spots (see migration `fix_missing_monday_paystay_rules`) |
| `pay-stay-zones-linked-to-street-segments.json` | [pay-stay-zones-linked-to-street-segments](https://data.melbourne.vic.gov.au/explore/dataset/pay-stay-zones-linked-to-street-segments/) | 935 | Joins Pay Stay zones to road segments → bay coordinates |
| `sign-plates-located-in-each-parking-zone.json` | [sign-plates-located-in-each-parking-zone](https://data.melbourne.vic.gov.au/explore/dataset/sign-plates-located-in-each-parking-zone/) | 1,821 | Legacy zone signage (2P/LZ/PP-style codes) for the older, non-Pay-Stay zone system |
| `parking-zones-linked-to-street-segments.json` | [parking-zones-linked-to-street-segments](https://data.melbourne.vic.gov.au/explore/dataset/parking-zones-linked-to-street-segments/) | 926 | Joins legacy zones to road segments → bay coordinates |
| `on-street-parking-bay-sensors.json` | [on-street-parking-bay-sensors](https://data.melbourne.vic.gov.au/explore/dataset/on-street-parking-bay-sensors/) | 6,324 | **Live** in-ground sensor occupancy (verified genuinely live: ~85% of sensors report within the last hour). Matched to `parking_spots` by nearest coordinate (≤5m) — the two datasets use incompatible kerbside-id numbering. This snapshot is a point-in-time copy; the app re-fetches this URL on a schedule, see `../scripts/sync_melbourne_sensors.py` and the server-side `pg_cron` version in `../supabase/migrations/`. |
| `off-street-car-parks-2024-commercial.json` | [off-street-car-parks-with-capacity-and-type](https://data.melbourne.vic.gov.au/explore/dataset/off-street-car-parks-with-capacity-and-type/) | 143 (filtered) | Public/commercial multi-storey car parks with total capacity (~59,600 spaces). Filtered from the full census below down to `census_year=2024, parking_type=Commercial`. No live availability is published for these, capacity only. |

### Fetched and investigated, not used

| File | Source dataset | Rows | Why we pulled it | Why it's not used |
|---|---|---|---|---|
| `off-street-car-parks-full-census.json` | [off-street-car-parks-with-capacity-and-type](https://data.melbourne.vic.gov.au/explore/dataset/off-street-car-parks-with-capacity-and-type/) | 151,199 (full, unfiltered) | The complete 23-year (2002–2024) property census this app's filtered subset comes from | Most rows are `Residential` (home garages) or `Private` (staff/tenant-only allocations) — not public parking. Kept in full here for anyone who wants the raw source rather than our filter. |
| `sign-plates-located-in-each-pay-stay-zone.json` | [sign-plates-located-in-each-pay-stay-zone](https://data.melbourne.vic.gov.au/explore/dataset/sign-plates-located-in-each-pay-stay-zone/) | 1,495 | Checking whether it held individual bay numbers (chasing a user report of small sequential numbers painted on kerbs) | Zone-level sign text/hours only, no bay-level numbering — redundant with `pay-stay-parking-restrictions.json`, which we already had |
| `on-street-car-parking-meters-with-location.json` | [on-street-car-parking-meters-with-location](https://data.melbourne.vic.gov.au/explore/dataset/on-street-car-parking-meters-with-location/) | 1,404 | Checking for richer per-bay payment info | Just physical meter/machine locations + accepted payment methods (card/tap-and-go) — one meter often serves several bays, no restriction rules attached. Lower value than what we already have via Pay Stay. |
| `on-street-car-park-bay-restrictions.json` | [on-street-car-park-bay-restrictions](https://data.melbourne.vic.gov.au/explore/dataset/on-street-car-park-bay-restrictions/) | 4,263 | Found while investigating Test 1's "loading zone applied to a whole block" bug (see `../docs/test-1-findings.md`) — this is genuinely **bay-level** restriction data (up to 6 rules per individual `bayid`, including `Loading Zone`), which is exactly the granularity our current segment-level import lacks | Keyed by `bayid`/`deviceid`, an identifier scheme that doesn't overlap with `kerbsideid` (checked: 10 of 4,263 ids in common) and carries **no coordinates of its own** — there's no dataset in this catalog that maps its `bayid` to a location, so it can't currently be joined to our spots. Kept here in case a bridging dataset turns up later, or Melbourne adds coordinates to this one. |

## `brisbane-city-council/`

| File | Source dataset | Rows | Used for |
|---|---|---|---|
| `parking-sign-locations.json` | [parking-sign-locations](https://data.brisbane.qld.gov.au/explore/dataset/parking-sign-locations/) | 51,984 | Brisbane CBD sign locations + restriction type/hours (`parkingrestrictiondaysandtimes`, `parkingrestrictioncode`) — Brisbane's own version of what Melbourne's Pay Stay/legacy datasets provide |

## Investigated, no data pulled (existence-only)

These were found via catalog search (`discover.data.vic.gov.au`, `data.gov.au`) during the Sep 2026 coverage audit. We confirmed they exist and read their descriptions, but never fetched actual records — either because the description made clear they wouldn't help (zone boundaries only, no bay-level data) or because after Melbourne + Brisbane the marginal value didn't justify the time. Listed here so "what have we looked at" is honest and complete, not because the data is archived:

- **City of Port Phillip** (St Kilda, South Melbourne, Port Melbourne): `city-of-port-phillip-parking-machines` (meter locations only), `city-of-port-phillip-accessible-parking`
- **City of Yarra** (Richmond, Fitzroy, Collingwood): `yarra-permit-parking-zones` (zone *boundaries*, not individual bays)
- **City of Casey** (outer south-east Melbourne, ~40km away): `city-of-casey-parking-restriction-zones`, `car-parks-locations-in-city-of-casey`
- **City of Ballarat**, **City of Greater Geelong** (both well outside metro Melbourne): each publish several parking datasets (meters, permit zones, real-time availability for Geelong) — worth a proper look if/when expanding beyond Melbourne metro
- **Brisbane City Council**: `parking-regulated-permit-parking-areas` and `brisbane-parking-meters` are now archived (24 September 2026); useful for context, not live vacancy.

## Coverage reality check

If you're deciding where to expand next: bay-level open data like this is rare. Before adding a new city, search that city/state's open data portal for "parking" the way this was done for Melbourne (full-text search across *all* organisations, not just the city's own council) — most councils simply don't publish it, and there's no substitute for checking rather than assuming.

## 2026-09-24 coverage audit additions

The 2026-09-24 catalog review found two parking-related snapshots that were previously only represented in the catalog search results. They are now archived and hashed in `manifest.json`:

- `sign-panels-non-parking.json` — 26,827 roadside sign panels. This primarily contains traffic, wayfinding and community signs. It is archived as road context, not assumed to be a source of parking rules.
- `parking-restrictions-southeast-cbd-only-2014.json` — 2,188 historical restriction records. This is retained as reference data and is not treated as current policy.

The catalog also contains historical sensor event exports (2011–2020), a weather feed, and support-service records. Those are not current parking permission or live occupancy data, so they remain documented rather than being mixed into Bay's production parking dataset.
