# India parking data intake

India is enabled in the app, but there is no national authoritative live kerbside feed. The first pilot sources below are city-specific and must be imported with their own update date, tariff source, and availability meaning.

## Chennai pilot sources

- Greater Chennai Corporation / Chennai Smart City parking management: https://cscl.co.in/parking-management
- Chennai Smart City parking availability and tariff project: https://cscl.co.in/node/147
- Chennai Metro Rail parking facilities and availability: https://chennaimetrorail.org/technology/it-afc/
- Greater Chennai Corporation parking-road information: https://www.chennaicorporation.gov.in/

## Bengaluru pilot sources

- Namma Bengaluru Smart Parking project brief (BBMP / NIUA): https://smartnet.niua.org/indiacyclechallenge/wp-content/uploads/2022/07/Bengaluru-Parking-_-CPS.pdf
- Bengaluru South City Corporation HSR Layout smart-parking procurement (12 roads; project scope, not a live feed): https://tenders.infralens.in/tender/bscc-2026-27-se0099-79685

## Hyderabad pilot sources

- Hyderabad Metro Rail Park Hyderabad smart-parking brief (24 stations; facility availability and tariffs): https://hmrl.co.in/wp-content/uploads/2023/04/launching-of-smart-parking.pdf
- Hyderabad Traffic Police Road Smart parking-zone list: https://www.htp.gov.in/road_smart.html
- GHMC sensor-lot pilot reporting (sensor rollout status, not a public API): https://www.deccanchronicle.com/southern-states/telangana/ghmc-proposes-14-sensor-equipped-lots-with-app-integration-1939396

These are separate systems: municipal on-street spaces, facility parking, and metro parking. They must not be merged into one free-space count. Each imported record needs a source URL, capture date, city, facility or road identifier, capacity or occupancy meaning, tariff unit, and whether availability is live or scheduled.

No India record is labelled live until those fields are present. This prevents the three city screens from showing invented signs or prices while the source integrations are completed. Research sources are stored here for the import work; they are not yet treated as app records.
