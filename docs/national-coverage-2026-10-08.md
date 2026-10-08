# National parking coverage — 8 October 2026

## Goal and method

Bay now has a country-wide, geographically tiled baseline for **India** and
**Australia**. It is built from each country's current Geofabrik OpenStreetMap
extract and attributed state/territory boundaries. The app downloads only
nearby tiles, so country-scale coverage does not make the phone map download a
country-scale file.

This is a location layer, not a claim that every physical bay, sign, tariff or
vacancy state is known. An entry needs a coordinate, OSM identifier, source
URL, collected date, country and state/territory before it is published. Private,
permit-only, employee-only, delivery-only, agricultural, forestry and
emergency-only areas are excluded. A bay inside a mapped restricted parking
area is excluded as well.

## What users see

- Mapped parking areas and individual spaces near their selected place across
  Indian states/UTs and Australian states/territories.
- A price only when the source contains an explicit, unambiguous per-hour
  `charge` tag in INR or AUD, or when Bay has a separately archived operator or
  council tariff.
- The original source charge text when it cannot be converted safely. `fee=yes`
  is shown as paid parking with the price unavailable; it is never converted to
  a guessed amount.
- No live vacancy colour unless a current council/operator feed provides it.
  The national OSM baseline uses “availability on arrival”.

## Published coverage — 8 October 2026

The following counts are from the completed country imports and their verified manifests. A zero is retained rather than being inferred: the India source contained no eligible mapped parking feature in Lakshadweep. Country-wide coverage means Bay can search the current mapped baseline in every defined state/territory boundary; it does **not** make the source a complete parking, tariff, sign or sensor inventory.

### India

| State / territory | Source-backed parking records |
| --- | ---: |
| Andaman and Nicobar Islands | 16 |
| Andhra Pradesh | 382 |
| Arunachal Pradesh | 18 |
| Assam | 42 |
| Bihar | 87 |
| Chandigarh | 138 |
| Chhattisgarh | 105 |
| Dadra and Nagar Haveli and Daman and Diu | 10 |
| Delhi | 602 |
| Goa | 527 |
| Gujarat | 559 |
| Haryana | 428 |
| Himachal Pradesh | 188 |
| Jammu and Kashmir | 176 |
| Jharkhand | 58 |
| Karnataka | 1,766 |
| Kerala | 2,740 |
| Ladakh | 47 |
| Lakshadweep | 0 |
| Madhya Pradesh | 212 |
| Maharashtra | 1,410 |
| Manipur | 11 |
| Meghalaya | 68 |
| Mizoram | 1 |
| Nagaland | 20 |
| Odisha | 124 |
| Puducherry | 84 |
| Punjab | 299 |
| Rajasthan | 344 |
| Sikkim | 46 |
| Tamil Nadu | 1,022 |
| Telangana | 518 |
| Tripura | 5 |
| Uttar Pradesh | 484 |
| Uttarakhand | 243 |
| West Bengal | 287 |

Published map records: **12,992** across 2,010 nearby-loadable tiles. These state counts include mapped child bays that are grouped beneath their parking area on the map, so they are not a count of visible pins, spaces, vacancies or legal entitlement.

### Australia

| State / territory | Source-backed parking records |
| --- | ---: |
| Australian Capital Territory | 13,973 |
| New South Wales | 62,130 |
| Northern Territory | 5,303 |
| Other Territories | 113 |
| Queensland | 35,877 |
| South Australia | 21,275 |
| Tasmania | 5,869 |
| Victoria | 83,499 |
| Western Australia | 25,423 |

Published map records: **138,187** across 6,869 nearby-loadable tiles. These state counts include mapped child bays that are grouped beneath their parking area on the map, so they are not a count of visible pins, spaces, vacancies or legal entitlement.

## Source inventory

| Source | Stored record | Used in the app | Boundary |
| --- | --- | --- | --- |
| Geofabrik India current PBF | local source PBF plus filtered, compressed parking archive and hash manifest | Country-wide mapped parking points/areas, tiled by proximity | OSM mapping is community-maintained and not a legal sign or completeness survey. |
| Geofabrik Australia current PBF | local source PBF plus filtered, compressed parking archive and hash manifest | Country-wide mapped parking points/areas, tiled by proximity | Same OSM limitation. |
| geoBoundaries India ADM1 | simplified GeoJSON snapshot, CC BY 2.5 IN | State/UT attribution | Boundary vintage is retained in source metadata. |
| geoBoundaries Australia ADM1 | simplified GeoJSON snapshot, CC BY 4.0 | State/territory attribution | Boundary vintage is retained in source metadata. |
| data.gov.au parking catalog search | raw catalog response and normalized resource summary | Research ledger only | The catalog contains heterogeneous city/state datasets. A record is not merged unless it has usable coordinates, access semantics, provenance and price/occupancy meaning. |
| Existing council/operator datasets | `datasets/melbourne/`, `datasets/brisbane-city-council/`, `datasets/india/2026-09-26/` | Existing Melbourne/Brisbane schedules and reviewed operator price/sensor records | Remain separate from the nationwide mapped baseline. |

## Reproduction

Install `scripts/data-requirements.txt`, then run:

```bash
python3 scripts/build_country_parking.py --country india
python3 scripts/build_country_parking.py --country australia
python3 scripts/verify_country_parking.py --country india
python3 scripts/verify_country_parking.py --country australia
```

The source PBFs stay under `datasets/<country>/raw-pbf/` and are intentionally
not versioned in Git because they are multi-gigabyte upstream snapshots. The
filtered source archives, state boundary snapshots, country manifests and
published map tiles are stored under `datasets/<country>/<date>/` and
`public/data/<country>/`.

## Accuracy checks

The importer verifies finite coordinates, country bounds, non-restricted
access, successful state/territory attribution, unique OSM IDs, source URLs,
and every displayed numeric tariff's source URL, retrieval date and nonnegative
amount. Runtime tests verify nearby tile selection, no inferred occupancy, and
country routing. These tests validate source handling; they cannot turn a
missing operator price or live sensor feed into data.
