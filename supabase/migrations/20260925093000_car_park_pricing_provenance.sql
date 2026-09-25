-- The capacity census does not publish tariffs. Keep pricing nullable and
-- store it only when a dated council/operator/facility source is available.
alter table public.offstreet_car_parks
  add column if not exists hourly_rate_min numeric,
  add column if not exists hourly_rate_max numeric,
  add column if not exists currency text,
  add column if not exists pricing_notes text,
  add column if not exists pricing_source_url text;

drop function if exists public.nearby_car_parks(double precision, double precision, integer);
create function public.nearby_car_parks(p_lat double precision, p_lng double precision, p_radius_m integer default 1000)
returns table(id uuid, address_text text, suburb text, lat double precision, lng double precision, distance_m double precision, capacity integer, census_year integer, hourly_rate_min numeric, hourly_rate_max numeric, currency text, pricing_notes text, pricing_source_url text)
language sql stable set search_path = public, extensions
as $$
  select cp.id, cp.address_text, cp.suburb, cp.lat, cp.lng,
    extensions.ST_Distance(cp.location, extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography),
    cp.capacity, cp.census_year, cp.hourly_rate_min, cp.hourly_rate_max, cp.currency, cp.pricing_notes, cp.pricing_source_url
  from public.offstreet_car_parks cp
  where extensions.ST_DWithin(cp.location, extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography, p_radius_m)
  order by 6 asc;
$$;
