-- Crowdsourced, time-decaying "is a car actually there right now" signal.
-- Static sign rules can never answer this; only recent human reports can.
create table spot_status_pings (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references parking_spots(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  status text not null check (status in ('occupied', 'free')),
  created_at timestamptz not null default now()
);

create index spot_status_pings_spot_id_idx on spot_status_pings(spot_id, created_at desc);

alter table spot_status_pings enable row level security;

create policy "pings are publicly readable" on spot_status_pings
  for select using (true);
create policy "authenticated users can submit pings" on spot_status_pings
  for insert to authenticated with check (user_id = auth.uid());

-- Extend nearby_parking to also return each spot's single most recent ping
drop function if exists nearby_parking(double precision, double precision, integer) cascade;

create or replace function nearby_parking(p_lat double precision, p_lng double precision, p_radius_m integer default 1000)
returns table (
  id uuid,
  address_text text,
  suburb text,
  state text,
  country text,
  lat double precision,
  lng double precision,
  distance_m double precision,
  created_by uuid,
  rules json,
  latest_ping json
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
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
    coalesce(
      (select json_agg(row_to_json(r)) from (
        select r2.id, r2.sign_type, r2.max_stay_minutes, r2.days_active,
               r2.time_from, r2.time_to, r2.price_per_hour, r2.currency, r2.notes
        from parking_rules r2 where r2.spot_id = s.id
      ) r),
      '[]'::json
    ) as rules,
    (
      select json_build_object('status', p.status, 'created_at', p.created_at)
      from spot_status_pings p
      where p.spot_id = s.id
      order by p.created_at desc
      limit 1
    ) as latest_ping
  from parking_spots s
  where extensions.ST_DWithin(
    s.location,
    extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography,
    p_radius_m
  )
  order by distance_m asc;
$$;

grant execute on function nearby_parking(double precision, double precision, integer) to anon, authenticated;
;
