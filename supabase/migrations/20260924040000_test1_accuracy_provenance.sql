-- Test 1: preserve source evidence while removing unjustified certainty.
-- Backward-compatible RPC shape: provenance is nested in existing JSON fields.
alter table public.parking_rules add column match_method text not null default 'reported'
  check (match_method in ('reported', 'segment', 'bay_id', 'sign_coordinate', 'field_verified', 'unverified'));
update public.parking_rules set match_method = 'segment'
where notes ~* '^(Melway sign:|Pay Stay)';

alter table public.spot_sensor_status add column match_method text not null default 'unknown'
  check (match_method in ('unknown', 'coordinate', 'kerbside_id'));
update public.spot_sensor_status ss set match_method = case
  when ps.kerbside_id = ss.sensor_kerbside_id::text then 'kerbside_id' else 'coordinate' end
from public.parking_spots ps where ps.id = ss.spot_id;




create or replace function public.nearby_parking(p_lat double precision, p_lng double precision, p_radius_m integer default 1000)
 returns table(id uuid, address_text text, suburb text, state text, country text, lat double precision, lng double precision, distance_m double precision, created_by uuid, photo_url text, moderation_status text, kerbside_id text, rules json, latest_ping json, sensor_status json)
 language sql
 stable
 set search_path to 'public', 'extensions'
as $function$
  select
    s.id,
    s.address_text,
    s.suburb,
    s.state,
    s.country,
    s.lat,
    s.lng,
    extensions.ST_Distance(s.location, extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography) as distance_m,
    s.created_by,
    s.photo_url,
    s.moderation_status,
    s.kerbside_id,
    coalesce(
      (select json_agg(row_to_json(r)) from (
        select r2.id, r2.sign_type, r2.max_stay_minutes, r2.days_active,
               r2.time_from, r2.time_to, r2.price_per_hour, r2.currency, r2.notes, r2.match_method
        from parking_rules r2 where r2.spot_id = s.id
      ) r),
      '[]'::json
    ) as rules,
    (
      select json_build_object(
        'status', p.status,
        'created_at', p.created_at,
        'photo_url', p.photo_url,
        'corroborating_count', (
          select count(distinct p2.user_id) from spot_status_pings p2
          where p2.spot_id = s.id and p2.status = p.status and p2.created_at > now() - interval '30 minutes'
        )
      )
      from spot_status_pings p
      where p.spot_id = s.id
      order by p.created_at desc
      limit 1
    ) as latest_ping,
    (
      select json_build_object(
        'status', sss.status,
        'status_timestamp', sss.status_timestamp,
        'last_confirmed_at', sss.last_confirmed_at,
        'synced_at', sss.synced_at,
        'match_method', sss.match_method
      )
      from spot_sensor_status sss
      where sss.spot_id = s.id
    ) as sensor_status
  from parking_spots s
  where s.moderation_status = 'approved'
    and extensions.ST_DWithin(
      s.location,
      extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography,
      p_radius_m
    )
  order by distance_m asc, s.id asc;
$function$;
;

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

  -- Only exact council IDs can establish a sensor-to-bay relationship.
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
  delete from net._http_response where id = req_id;
  update sensor_sync_state set pending_request_id = null, last_error = null, last_success_at = now() where id = 1;

  return json_build_object('staged', staged_count, 'synced_at', now());
end;
$$;

revoke all on function process_melbourne_sensor_sync() from anon, authenticated, public;
