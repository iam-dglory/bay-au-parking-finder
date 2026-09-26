# QVM parking-area correction — 26 September 2026

Issue QVM-01: the open-air car park appeared as hundreds of individual grey bays. Status: implemented and validated; deployment recorded in the project tracker.

| Item | Change | Evidence / limit |
| --- | --- | --- |
| Classification | One blue parking-area marker and boundary for the open-air facility; separate undercover facility | Exact OSM IDs `way/7674137` and `node/11140069164`; operator identifies both as car parks |
| Individual dots | 603 mapped QVM spaces display through their parent car park | All source records retained; whole geometry within the parent at the same level, allowing ≤0.12m boundary rounding |
| Prices | Market days: A$8 first two hours after 9am, then published A$4 additional-hour rate; Mon/Wed: A$4 first hour | Evening, event and public holiday conditions retained separately; no calculated total from overlapping slabs |
| Free period | 6am–9am on Tue/Thu/Fri/Sat/Sun | Time window only; not free all-day parking |
| Access / hours | Queen Street entry; open air 5am–7pm with Night Market sessions; undercover 24/7 | Undercover capacity 506, clearance 2.2m; no invented current open-air capacity |
| Census duplicates | Reviewed 2024 records for 391 Queen Street and 131–151 Therry Street replaced in display by current operator records | Historical capacities 564/507 remain archived; exact address aliases plus 150m location guard; census fallback retained if operator data fails |
| Availability | Availability on arrival | No reusable live occupancy feed confirmed for these facilities; neither capacity nor mapped spaces becomes vacancy |

Source pages: [facilities](https://qvm.com.au/parking/), [prices](https://qvm.com.au/parking/car-park-rates/), [entry](https://qvm.com.au/parking/car-park-access/). Archived in `datasets/melbourne/2026-09-26/qvm-operator/`; hashes/provenance in `datasets/manifest.json`. The main rates page resolves incorrect exit times on the separate help article. Its A$40 “5+ Hours” slab is preserved separately, rather than reconciled by guessing.

The same classification repair groups 21,541 mapped off-street spaces across Greater Melbourne. Displayed standalone catalog bays: 24,472. Council street-sensor matching remains by exact council ID.

Validation: 70 frontend tests, two geometry/operator-source checks, lint, TypeScript and production build passed. Catalog verification: 73,413 retained records, 21,541 parent memberships, 603 QVM memberships and 1,174 file hashes. This verifies classification and source handling, not real-world vacancy accuracy.
