# Test 1 — field test, 2026-09-23

Real-world walk test around Melbourne CBD (Spencer St, La Trobe St, Queen St / A'Beckett St). Comparing what the app showed against the actual street. Logged as issues come in from testing, not by feature — carry forward to Test 2, don't restart numbering.

| # | Issue observed | Root cause | Status |
|---|---|---|---|
| 1 | Multiple spots on the same block showed **free (sensor)** when a car was visibly parked there, and vice versa — often alternating with the correct one right next to it | Sensor sync matched each sensor to the *nearest bay coordinate* (≤5m). On a row of bays 2–3m apart, that's ambiguous and regularly grabbed the wrong neighbour. Verified: both the sensor feed and the bay dataset actually carry the same `kerbsideid` for 76% of sensors — an exact, unambiguous match was available and unused. | **Fixed.** Sync now matches by exact `kerbsideid` first (4,732 of 5,794 currently-matched spots, 82%), falling back to nearest-coordinate only for sensors with no id match. Migration `sensor_sync_process_match_by_kerbside_id_first`, re-run and verified live. |
| 2 | A confirmed sensor reading was shown even when it looked wrong, with no way to see if a driver had reported differently | The UI hid the crowdsourced "Mark occupied/free" report badge entirely whenever a sensor existed for that bay, sensor or not | **Fixed.** Detail sheet and spot card now show the crowdsourced report alongside the sensor badge, not instead of it, so a wrong or misassigned sensor reading doesn't silently bury a driver's own recent report. |
| 3 | **Queen St between La Trobe St and A'Beckett St**: app showed "Loading zone only until 4pm" for a bay whose physical sign was just a plain 2P meter (photo confirmed) | Confirmed by data: every one of the ~20+ bays on this entire block carries the *same* two rules (Loading Zone 7am–4pm *and* Pay Stay meter). A loading zone almost never covers a whole block — it's normally a short stretch near a driveway/dock. The rule import links rules to the whole road segment rather than to the specific bay nearest each physical sign, so a loading zone plate anywhere on the block gets applied to every bay on it. | **Open — root cause confirmed, fix not yet started.** Needs the rule import reworked to match each sign plate's own coordinate to its nearest bay, not broadcast to the whole segment. Likely affects other segments with mixed signage too, not just this one — scope unknown until audited. |
| 4 | Off-street car park markers and popups | — | **Working as intended.** No issue found. |
| 5 | Map doesn't rotate to heading while driving, unlike Google/Apple Maps | Not a bug — never built. Leaflet (our map library) needs a plugin for compass-based rotation, not built in. | **Backlog feature**, not started. |

## Sensor question — is it worth doing this manually instead?

City of Melbourne's in-ground sensors were installed for the council's own compliance/enforcement analytics, not for public live-availability apps — that's an accurate but secondary use of their data, sourced free from open data, and issue #1 shows exactly the kind of accuracy problem that comes with repurposing it that way. The manual reporting system ("Mark occupied"/"Mark free") is already live in the app and, unlike hardware sensors, needs zero council partnership or physical installation to work in a new city — it just needs users. My recommendation: keep the sensors as one input (Melbourne only, imperfect), but treat crowdsourced reports as the piece that actually scales nationally, and lean into surfacing/prompting for them more as usage grows, rather than trying to get sensor accuracy to something it structurally can't reach.

## Verification

- `npm run test` — 38/38 passing
- `npm run build` — clean
- Sensor re-sync run live against production data, re-matched 5,794 spots (82% now by exact bay reference)
- `get_advisors` (security) — no new issues from the fix
