-- Peer-to-peer parking marketplace: listings + bookings
create extension if not exists btree_gist;

create table listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  location extensions.geography(Point, 4326) generated always as (
    extensions.ST_SetSRID(extensions.ST_MakePoint(lng, lat), 4326)::extensions.geography
  ) stored,
  address_text text not null,
  country text,
  currency text not null default 'USD',
  price_per_hour numeric(8,2) not null check (price_per_hour >= 0),
  description text,
  days_active integer[] not null default '{0,1,2,3,4,5,6}',
  time_from time,
  time_to time,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index listings_location_idx on listings using gist (location);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  driver_id uuid not null default auth.uid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  total_price numeric(8,2) not null check (total_price >= 0),
  currency text not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  exclude using gist (
    listing_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status = 'confirmed')
);

create index bookings_listing_id_idx on bookings(listing_id);
create index bookings_driver_id_idx on bookings(driver_id);

alter table listings enable row level security;
alter table bookings enable row level security;

create policy "listings are publicly readable" on listings
  for select using (true);
create policy "authenticated users can create listings" on listings
  for insert to authenticated with check (owner_id = auth.uid());
create policy "owners can update their listings" on listings
  for update to authenticated using (owner_id = auth.uid());
create policy "owners can delete their listings" on listings
  for delete to authenticated using (owner_id = auth.uid());

create policy "bookings visible to driver or listing owner" on bookings
  for select using (
    driver_id = auth.uid()
    or exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid())
  );
create policy "drivers create bookings" on bookings
  for insert to authenticated with check (driver_id = auth.uid());
create policy "driver or owner can update booking status" on bookings
  for update to authenticated using (
    driver_id = auth.uid()
    or exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid())
  );

create or replace function nearby_listings(p_lat double precision, p_lng double precision, p_radius_m integer default 5000)
returns table (
  id uuid,
  address_text text,
  country text,
  currency text,
  price_per_hour numeric,
  description text,
  days_active integer[],
  time_from time,
  time_to time,
  lat double precision,
  lng double precision,
  distance_m double precision,
  owner_id uuid
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    s.id, s.address_text, s.country, s.currency, s.price_per_hour, s.description,
    s.days_active, s.time_from, s.time_to, s.lat, s.lng,
    extensions.ST_Distance(s.location, extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography) as distance_m,
    s.owner_id
  from listings s
  where s.is_active
    and extensions.ST_DWithin(
      s.location,
      extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography,
      p_radius_m
    )
  order by distance_m asc;
$$;

grant execute on function nearby_listings(double precision, double precision, integer) to anon, authenticated;
;
