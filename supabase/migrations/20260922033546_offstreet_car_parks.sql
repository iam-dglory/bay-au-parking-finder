
-- Public/commercial off-street car parks (multi-storey buildings, paid
-- lots) from City of Melbourne's annual CLUE census -- a fundamentally
-- different entity from on-street bays: one point per building with a
-- total capacity number, not a per-bay legal-restriction rule set, and no
-- live availability (the council doesn't publish that for these). "Private"
-- and "Residential" census categories are excluded -- those are
-- staff/tenant-only or home garage spaces, not public parking.
create table offstreet_car_parks (
  id uuid primary key default gen_random_uuid(),
  property_id text not null unique,
  address_text text not null,
  suburb text,
  lat double precision not null,
  lng double precision not null,
  location extensions.geography(Point, 4326) generated always as (
    extensions.ST_SetSRID(extensions.ST_MakePoint(lng, lat), 4326)::extensions.geography
  ) stored,
  capacity integer not null,
  census_year integer not null default 2024,
  created_at timestamptz not null default now()
);

create index offstreet_car_parks_location_idx on offstreet_car_parks using gist (location);

alter table offstreet_car_parks enable row level security;

create policy "car parks are publicly readable"
  on offstreet_car_parks for select
  to anon, authenticated
  using (true);

-- Reference data from council census, not user-generated -- no client writes.
revoke insert, update, delete on offstreet_car_parks from anon, authenticated;

create function nearby_car_parks(p_lat double precision, p_lng double precision, p_radius_m integer default 1000)
returns table(id uuid, address_text text, suburb text, lat double precision, lng double precision, distance_m double precision, capacity integer, census_year integer)
language sql
stable
set search_path = public, extensions
as $$
  select
    cp.id, cp.address_text, cp.suburb, cp.lat, cp.lng,
    extensions.ST_Distance(cp.location, extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography) as distance_m,
    cp.capacity, cp.census_year
  from offstreet_car_parks cp
  where extensions.ST_DWithin(cp.location, extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography, p_radius_m)
  order by distance_m asc;
$$;

insert into offstreet_car_parks (property_id, address_text, suburb, lat, lng, capacity) values
('578328', 'Carpark Federation Square 2 Swanston Street MELBOURNE VIC 3000', 'Melbourne (CBD)', -37.81784465, 144.969917465, 450),
('103957', '517-537 Flinders Lane MELBOURNE VIC 3000', 'Melbourne (CBD)', -37.81988483, 144.956601666, 117),
('103997', '472-482 Flinders Street MELBOURNE VIC 3000', 'Melbourne (CBD)', -37.81974183, 144.958272108, 330),
('110091', '15-33 William Street MELBOURNE VIC 3000', 'Melbourne (CBD)', -37.8192157, 144.959187534, 300)
on conflict (property_id) do nothing;
;
