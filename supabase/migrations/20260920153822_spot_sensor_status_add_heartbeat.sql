
-- status_timestamp is when the reading last CHANGED, which stays old for a
-- car that's genuinely been parked a long time -- not a sign of trouble.
-- last_confirmed_at is the sensor's own heartbeat (source field
-- "lastupdated"): how recently the sensor itself last checked in at all.
-- That's the correct signal for "is this sensor still working", independent
-- of how long the current reading has held.
alter table spot_sensor_status add column last_confirmed_at timestamptz;
;
