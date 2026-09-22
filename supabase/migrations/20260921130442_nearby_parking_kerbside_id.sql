
drop function nearby_parking(double precision, double precision, integer);

create function public.nearby_parking(p_lat double precision, p_lng double precision, p_radius_m integer default 1000)
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
               r2.time_from, r2.time_to, r2.price_per_hour, r2.currency, r2.notes
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
        'last_confirmed_at', sss.last_confirmed_at
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
  order by distance_m asc;
$function$;
;
