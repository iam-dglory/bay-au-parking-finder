
-- Split into submit + process so neither step ever waits/polls in a loop --
-- avoids relying on a single transaction's snapshot staying fresh while a
-- background worker (pg_net) writes the response concurrently. Each step is
-- its own fast, independent transaction.
create table sensor_sync_state (
  id int primary key default 1,
  pending_request_id bigint,
  last_error text,
  last_success_at timestamptz,
  check (id = 1)
);
insert into sensor_sync_state (id) values (1);

create or replace function submit_melbourne_sensor_sync()
returns json
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  req_id bigint;
begin
  req_id := net.http_get(
    'https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bay-sensors/exports/json',
    timeout_milliseconds := 45000
  );
  update sensor_sync_state set pending_request_id = req_id where id = 1;
  return json_build_object('submitted_request_id', req_id);
end;
$$;

create or replace function process_melbourne_sensor_sync()
returns json
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  req_id bigint;
  resp net._http_response;
  sensor_json jsonb;
  staged_count int := 0;
begin
  select pending_request_id into req_id from sensor_sync_state where id = 1;
  if req_id is null then
    return json_build_object('skipped', 'no pending request');
  end if;

  select * into resp from net._http_response where id = req_id;
  if resp.id is null then
    return json_build_object('skipped', 'response not ready yet', 'request_id', req_id);
  end if;

  if resp.status_code is distinct from 200 then
    update sensor_sync_state set pending_request_id = null, last_error = 'bad status ' || resp.status_code where id = 1;
    delete from net._http_response where id = req_id;
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

  with sensor_to_spot as (
    select distinct on (sd.kerbside_id)
      sd.kerbside_id, sd.status, sd.status_ts, sd.last_confirmed_at,
      ps.id as spot_id,
      extensions.ST_Distance(ps.location, extensions.ST_SetSRID(extensions.ST_MakePoint(sd.lng, sd.lat), 4326)::extensions.geography) as dist_m
    from sensor_sync_staging sd
    join parking_spots ps
      on extensions.ST_DWithin(ps.location, extensions.ST_SetSRID(extensions.ST_MakePoint(sd.lng, sd.lat), 4326)::extensions.geography, 5)
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
  delete from net._http_response where id = req_id;
  update sensor_sync_state set pending_request_id = null, last_error = null, last_success_at = now() where id = 1;

  return json_build_object('staged', staged_count, 'synced_at', now());
end;
$$;

drop function if exists sync_melbourne_sensors_from_source();

revoke all on function submit_melbourne_sensor_sync() from anon, authenticated, public;
revoke all on function process_melbourne_sensor_sync() from anon, authenticated, public;
;
