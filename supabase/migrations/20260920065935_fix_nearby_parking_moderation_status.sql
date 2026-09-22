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
  photo_url text,
  moderation_status text,
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
    s.photo_url,
    s.moderation_status,
    coalesce(
      (select json_agg(row_to_json(r)) from (
        select r2.id, r2.sign_type, r2.max_stay_minutes, r2.days_active,
               r2.time_from, r2.time_to, r2.price_per_hour, r2.currency, r2.notes
        from parking_rules r2 where r2.spot_id = s.id
      ) r),
      '[]'::json
    ) as rules,
    (
      select json_build_object(
        'status', p.status,
        'created_at', p.created_at,
        'corroborating_count', (
          select count(distinct p2.user_id) from spot_status_pings p2
          where p2.spot_id = s.id and p2.status = p.status and p2.created_at > now() - interval '30 minutes'
        )
      )
      from spot_status_pings p
      where p.spot_id = s.id
      order by p.created_at desc
      limit 1
    ) as latest_ping
  from parking_spots s
  where s.moderation_status = 'approved'
    and extensions.ST_DWithin(
      s.location,
      extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography,
      p_radius_m
    )
  order by distance_m asc;
$$;

grant execute on function nearby_parking(double precision, double precision, integer) to anon, authenticated;;
