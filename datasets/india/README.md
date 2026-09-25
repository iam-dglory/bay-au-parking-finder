# India parking data intake

India is enabled in the app, but there is no national authoritative live kerbside feed. The first pilot sources below are city-specific and must be imported with their own update date, tariff source, and availability meaning.

## Chennai pilot sources

- Greater Chennai Corporation / Chennai Smart City parking management: https://cscl.co.in/parking-management
- Chennai Smart City parking availability and tariff project: https://cscl.co.in/node/147
- Chennai Metro Rail parking facilities and availability: https://chennaimetrorail.org/technology/it-afc/
- Greater Chennai Corporation parking-road information: https://www.chennaicorporation.gov.in/

These are separate systems: municipal on-street spaces, facility parking, and metro parking. They must not be merged into one free-space count. Each imported record needs a source URL, capture date, city, facility or road identifier, capacity or occupancy meaning, tariff unit, and whether availability is live or scheduled.

No India record is labelled live until those fields are present. This prevents the Chennai screen from showing invented signs or prices while the source integration is completed.
