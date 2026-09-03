-- AU Parking Finder: core schema
create extension if not exists postgis with schema extensions;

create type sign_type as enum (
  'FREE_UNLIMITED',
  'TIME_LIMITED',
  'PAID_METER',
  'PERMIT_ONLY',
  'NO_STOPPING_CLEARWAY',
  'LOADING_ZONE'
);

create table parking_spots (
  id uuid primary key default gen_random_uuid(),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  location extensions.geography(Point, 4326) generated always as (
    extensions.ST_SetSRID(extensions.ST_MakePoint(lng, lat), 4326)::extensions.geography
  ) stored,
  address_text text not null,
  suburb text,
  state text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create index parking_spots_location_idx on parking_spots using gist (location);

create table parking_rules (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references parking_spots(id) on delete cascade,
  sign_type sign_type not null,
  max_stay_minutes integer check (max_stay_minutes is null or max_stay_minutes > 0),
  days_active integer[] not null default '{0,1,2,3,4,5,6}',
  time_from time,
  time_to time,
  price_per_hour numeric(6,2) check (price_per_hour is null or price_per_hour >= 0),
  notes text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create index parking_rules_spot_id_idx on parking_rules(spot_id);

alter table parking_spots enable row level security;
alter table parking_rules enable row level security;

create policy "spots are publicly readable" on parking_spots
  for select using (true);
create policy "authenticated users can add spots" on parking_spots
  for insert to authenticated with check (created_by = auth.uid());
create policy "owners can update their spots" on parking_spots
  for update to authenticated using (created_by = auth.uid());
create policy "owners can delete their spots" on parking_spots
  for delete to authenticated using (created_by = auth.uid());

create policy "rules are publicly readable" on parking_rules
  for select using (true);
create policy "authenticated users can add rules" on parking_rules
  for insert to authenticated with check (created_by = auth.uid());
create policy "owners can update their rules" on parking_rules
  for update to authenticated using (created_by = auth.uid());
create policy "owners can delete their rules" on parking_rules
  for delete to authenticated using (created_by = auth.uid());

-- Nearby search RPC: returns spots + their rules (as JSON) within radius_m, sorted by distance
create or replace function nearby_parking(p_lat double precision, p_lng double precision, p_radius_m integer default 1000)
returns table (
  id uuid,
  address_text text,
  suburb text,
  state text,
  lat double precision,
  lng double precision,
  distance_m double precision,
  created_by uuid,
  rules json
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    s.id,
    s.address_text,
    s.suburb,
    s.state,
    s.lat,
    s.lng,
    extensions.ST_Distance(s.location, extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography) as distance_m,
    s.created_by,
    coalesce(
      (select json_agg(row_to_json(r)) from (
        select r2.id, r2.sign_type, r2.max_stay_minutes, r2.days_active,
               r2.time_from, r2.time_to, r2.price_per_hour, r2.notes
        from parking_rules r2 where r2.spot_id = s.id
      ) r),
      '[]'::json
    ) as rules
  from parking_spots s
  where extensions.ST_DWithin(
    s.location,
    extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography,
    p_radius_m
  )
  order by distance_m asc;
$$;

grant execute on function nearby_parking(double precision, double precision, integer) to anon, authenticated;
