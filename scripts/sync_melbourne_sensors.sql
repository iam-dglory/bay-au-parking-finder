-- Apply the Test 1 provenance migration first. Exact council IDs only.
-- Coordinate proximity cannot establish which adjacent bay a sensor belongs to.
begin;
  with matched as (
    select distinct on (ps.id)
      ps.id as spot_id, sd.kerbside_id, sd.status, sd.status_ts, sd.last_confirmed_at
    from sensor_sync_staging sd
    join parking_spots ps on ps.kerbside_id = sd.kerbside_id::text
    order by ps.id, sd.last_confirmed_at desc
  )
  insert into spot_sensor_status (spot_id, sensor_kerbside_id, status, status_timestamp, last_confirmed_at, synced_at, match_method)
  select spot_id, kerbside_id, status, status_ts, last_confirmed_at, now(), 'kerbside_id' from matched
  on conflict (spot_id) do update set
    sensor_kerbside_id = excluded.sensor_kerbside_id,
    status = excluded.status,
    status_timestamp = excluded.status_timestamp,
    last_confirmed_at = excluded.last_confirmed_at,
    synced_at = excluded.synced_at,
    match_method = excluded.match_method;

truncate table sensor_sync_staging;
commit;
