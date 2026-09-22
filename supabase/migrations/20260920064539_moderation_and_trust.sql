-- Trust & moderation pass:
-- 1. Reported signs now require a photo and go through approval before being
--    shown to anyone but their own reporter -- prevents spammed/fake signs.
-- 2. Occupancy pings now surface how many distinct people agree, so a single
--    tap can't fake consensus (the GPS-proximity gate that stops a report
--    being submitted from far away lives client-side, since it needs the
--    reporter's live device location).
-- 3. Booking/claims removed from the product; nearby_parking stops returning
--    latest_claim. The spot_claims table itself is left dormant (same as the
--    earlier listings/bookings tables) rather than dropped.

alter table parking_spots
  add column moderation_status text not null default 'approved'
    check (moderation_status in ('pending', 'approved', 'rejected')),
  add column photo_url text;

alter table parking_spots alter column moderation_status set default 'pending';

create index parking_spots_moderation_status_idx on parking_spots(moderation_status);

insert into storage.buckets (id, name, public)
values ('sign-photos', 'sign-photos', true)
on conflict (id) do nothing;

create policy "sign photos are publicly readable" on storage.objects
  for select using (bucket_id = 'sign-photos');
create policy "authenticated users can upload sign photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'sign-photos');

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
