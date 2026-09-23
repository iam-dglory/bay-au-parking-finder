-- Field-testing (2026-09-23) found sensors reporting the wrong bay's status --
-- e.g. a row of adjacent bays where occupied/free was shifted by one spot.
-- Root cause: the sync matched sensors to spots purely by nearest-coordinate
-- within 5m, which is ambiguous on a street with bays spaced 2-3m apart.
-- Both datasets actually carry the same kerbsideid numbering for ~76% of
-- sensors (verified against the raw source exports), so match on that exact
-- id first -- unambiguous -- and only fall back to nearest-coordinate for
-- sensors whose id isn't in parking_spots.kerbside_id.
--
-- NOTE: this targets sync_melbourne_sensors_from_source(), which had already
-- been dropped and replaced by the submit_melbourne_sensor_sync() /
-- process_melbourne_sensor_sync() split in an earlier migration -- so this
-- recreates then immediately drops dead code. See the following migration
-- (20260923054718) for the fix actually applied to the live scheduled
-- function. Kept here only so the local migrations folder matches exactly
-- what's recorded in supabase_migrations.schema_migrations.
create or replace function sync_melbourne_sensors_from_source()
returns json
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  req_id bigint;
  resp net._http_response;
  waited int := 0;
  sensor_json jsonb;
  staged_count int := 0;
begin
  req_id := net.http_get(
    'https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bay-sensors/exports/json',
    timeout_milliseconds := 30000
  );

  loop
    select * into resp from net._http_response where id = req_id;
    exit when resp.id is not null or waited >= 30;
    perform pg_sleep(1);
    waited := waited + 1;
  end loop;

  if resp.id is null then
    return json_build_object('error', 'timed out waiting for sensor feed response');
  end if;
  if resp.status_code is distinct from 200 then
    return json_build_object('error', 'bad status from sensor feed', 'status_code', resp.status_code);
  end if;

  sensor_json := resp.content::jsonb;

  truncate table sensor_sync_staging;

  insert into sensor_sync_staging (kerbside_id, status, status_ts, last_confirmed_at, lat, lng)
  select
    (elem->>'kerbsideid')::int,
    case elem->>'status_description' when 'Present' then 'present' when 'Unoccupied' then 'unoccupied' end,
    (elem->>'status_timestamp')::timestamptz,
    (elem->>'lastupdated')::timestamptz,
    (elem->'location'->>'lat')::double precision,
    (elem->'location'->>'lon')::double precision
  from jsonb_array_elements(sensor_json) as elem
  where elem->>'status_description' in ('Present', 'Unoccupied')
    and elem->>'kerbsideid' is not null
    and elem->'location' is not null
    and elem->>'status_timestamp' is not null
    and elem->>'lastupdated' is not null;

  get diagnostics staged_count = row_count;

  with by_id as (
    -- Unambiguous: exact bay reference match.
    select
      sd.kerbside_id, sd.status, sd.status_ts, sd.last_confirmed_at,
      ps.id as spot_id
    from sensor_sync_staging sd
    join parking_spots ps on ps.kerbside_id = sd.kerbside_id::text
  ),
  remaining as (
    -- Only sensors with no bay-reference match fall back to a coordinate guess.
    select sd.* from sensor_sync_staging sd
    where not exists (select 1 from by_id where by_id.kerbside_id = sd.kerbside_id)
  ),
  by_coord as (
    select distinct on (sd.kerbside_id)
      sd.kerbside_id, sd.status, sd.status_ts, sd.last_confirmed_at,
      ps.id as spot_id,
      extensions.ST_Distance(ps.location, extensions.ST_SetSRID(extensions.ST_MakePoint(sd.lng, sd.lat), 4326)::extensions.geography) as dist_m
    from remaining sd
    join parking_spots ps
      on extensions.ST_DWithin(ps.location, extensions.ST_SetSRID(extensions.ST_MakePoint(sd.lng, sd.lat), 4326)::extensions.geography, 5)
      and ps.kerbside_id is null -- never let a coordinate guess steal a spot that already has a confirmed bay reference
    order by sd.kerbside_id, dist_m asc
  ),
  combined as (
    select spot_id, kerbside_id, status, status_ts, last_confirmed_at from by_id
    union all
    select spot_id, kerbside_id, status, status_ts, last_confirmed_at from by_coord
  ),
  matched as (
    select distinct on (spot_id) spot_id, kerbside_id, status, status_ts, last_confirmed_at
    from combined
    order by spot_id, kerbside_id
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
  delete from net._http_response where id = req_id;

  return json_build_object('staged', staged_count, 'synced_at', now());
end;
$$;

revoke all on function sync_melbourne_sensors_from_source() from anon, authenticated, public;
