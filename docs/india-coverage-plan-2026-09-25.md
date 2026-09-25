# India coverage plan

Bay already supports India as a reporting country, INR pricing, India-specific sign choices, city-scoped search, and the same spot detail and navigation flow used in Australia.

India does not have one national, reliable live kerbside-availability feed. Parking rules and occupancy are published by individual municipal corporations, smart-city programs, private facilities, and local attendants. The app therefore treats an India spot as live-accurate only when it has a city or facility source attached to the record. A user-added sign is useful evidence of the local terms, but it is not presented as a live occupancy sensor.

## Required source fields before city launch

- city and municipal owner
- source URL or dataset identifier
- sign or facility coordinates
- capture or update date
- operating hours, payment method, currency, and maximum stay
- whether the source reports capacity, occupancy, or only rules

Until those fields exist, the UI shows the recorded parking terms and asks the driver to read the physical sign. It does not invent free space or claim a national India feed.

## Pilot sequence

1. Select one city and one authoritative municipal or facility source.
2. Archive the raw source response and its checksum in `datasets/`.
3. Import signs and parking areas with source provenance attached to every record.
4. Validate a field sample on site before enabling live-availability language.
