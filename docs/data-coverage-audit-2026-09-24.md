# Bay data coverage audit — 24 September 2026

## Result

The repository contains the raw snapshots used by Bay, the live sensor refresh scripts, and the source catalog searches. The audit found two parking-related City of Melbourne datasets that were catalogued but had not been archived: non-parking sign panels and the historical southeast-CBD restriction survey. Both are now stored under `datasets/melbourne-city-of-melbourne/` and recorded in `datasets/manifest.json` with SHA-256 hashes.

## Stored data inventory

| Area | Snapshot | Purpose | Status |
|---|---|---|---|
| Melbourne | On-street parking bays (29,053) | Bay coordinates and kerbside IDs | Used by app |
| Melbourne | Pay Stay restrictions (6,270) | Paid hours, price and maximum stay | Used by app; Monday extrapolation exists; still requires sign validation |
| Melbourne | Pay Stay zones linked to street segments (935) | Zone-to-road join | Used by app |
| Melbourne | Parking zones linked to street segments (926) | Legacy zone-to-road join | Used by app |
| Melbourne | Sign plates in parking zones (1,821) | Legacy sign rules | Used by app |
| Melbourne | Sign plates in Pay Stay zones (1,495) | Pay Stay sign rules | Archived and investigated |
| Melbourne | On-street bay sensors (6,324) | Live vacant/present readings | Archived snapshot; server-side refresh remains live |
| Melbourne | On-street bay restrictions (4,263) | Individual bay restrictions | Archived; needs a reliable bay-to-coordinate bridge before import |
| Melbourne | On-street parking meters (1,404) | Meter location/payment context | Archived; not a per-bay rule source |
| Melbourne | Off-street commercial car parks 2024 (143) | Public/commercial parking-area capacity | Used by app |
| Melbourne | Full off-street CLUE census (151,199) | Complete raw census, including private/residential records | Archived for analysis; filtered subset used by app |
| Melbourne | Non-parking sign panels (26,827) | Traffic, wayfinding and roadside context | Newly archived; not a parking-rule source |
| Melbourne | Southeast CBD restrictions 2014 (2,188) | Historical restriction survey | Newly archived; reference only, not treated as current |
| Brisbane | Parking sign locations (51,984) | Sign coordinates and restriction hours | Archived; pilot expansion source |

## What is still missing or unsafe to claim

- The Melbourne bay-restrictions table has no usable coordinates and only overlaps the current kerbside ID scheme in a small fraction of rows. It is retained, but must not be spatially joined by guesswork.
- Non-parking sign panels mostly describe traffic, wayfinding and community signs. Their coordinates do not solve the missing per-plate parking-rule coordinate bridge.
- Off-street car parks publish capacity, not live spaces free. Bay labels these as parking areas and never presents capacity as live availability.
- Historical sensor event exports (2011–2020) are useful for analysis but are not current occupancy and are intentionally not downloaded into the production seed set.
- Neighbouring Melbourne councils generally publish zones or meter locations rather than bay-level restrictions. The catalog evidence is retained in `datasets/research-2026-09-24/`; expansion requires a fresh portal audit per council.

## Refresh and provenance

Every archived JSON response is listed in `datasets/manifest.json` with source URL, byte count and SHA-256. New fetches include timestamps; older exports explicitly record unknown fetch time. Live sensor data is refreshed by `scripts/sync_melbourne_sensors.py` and the matching SQL migrations. Re-run the archive helper for a new immutable snapshot rather than overwriting an existing file.

## Additional sources retained in this pass

- Brisbane parking meters and regulated permit areas: downloaded alongside the existing sign locations. These add payment and permit-area context, not vacancy.
- Melbourne CBD and Southbank parking-improvement pages: archived as reference HTML with hashes and URLs. Council describes changed paid hours and time limits. This is further reason to validate older rule exports against current signs, not silently import historical rules as current.
- Source: https://participate.melbourne.vic.gov.au/central-city-parking-review/parking-improvements
- Source: https://participate.melbourne.vic.gov.au/southbank-parking-review/parking-improvements

This audit covers the listed sources. It does not establish that every useful dataset across Australia has been discovered or downloaded. Known historical sensor exports and neighbouring-council candidates remain gaps for a separate expansion pass.
