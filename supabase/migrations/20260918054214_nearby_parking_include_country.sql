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
  rules json
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
;
