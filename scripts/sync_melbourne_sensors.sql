-- Run this against the Supabase project (via execute_sql / SQL editor)
-- immediately after sync_melbourne_sensors.py has staged fresh rows into
-- sensor_sync_staging. Matches each sensor to the nearest parking_spots row
-- within 5m (the two Melbourne datasets use incompatible kerbside-id
-- numbering, but their bay coordinates line up to within ~2m in practice),
-- upserts into spot_sensor_status, then clears the staging table so it's
-- ready for the next run.
with sensor_to_spot as (
  select distinct on (sd.kerbside_id)
    sd.kerbside_id, sd.status, sd.status_ts, sd.last_confirmed_at,
    ps.id as spot_id,
    extensions.ST_Distance(ps.location, extensions.ST_SetSRID(extensions.ST_MakePoint(sd.lng, sd.lat),4326)::extensions.geography) as dist_m
  from sensor_sync_staging sd
  join parking_spots ps
    on extensions.ST_DWithin(ps.location, extensions.ST_SetSRID(extensions.ST_MakePoint(sd.lng, sd.lat),4326)::extensions.geography, 5)
  order by sd.kerbside_id, dist_m asc
),
matched as (
  select distinct on (spot_id) spot_id, kerbside_id, status, status_ts, last_confirmed_at
  from sensor_to_spot
  order by spot_id, dist_m asc
)
insert into spot_sensor_status (spot_id, sensor_kerbside_id, status, status_timestamp, last_confirmed_at, synced_at)
select spot_id, kerbside_id, status, status_ts, last_confirmed_at, now() from matched
on conflict (spot_id) do update set
  sensor_kerbside_id = excluded.sensor_kerbside_id,
  status = excluded.status,
  status_timestamp = excluded.status_timestamp,
  last_confirmed_at = excluded.last_confirmed_at,
  synced_at = excluded.synced_at;

truncate table sensor_sync_staging;
