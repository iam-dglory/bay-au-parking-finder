-- Privacy and moderation hardening (issue list of 1 Nov 2026, items 3, 4, 5, 10).
-- Works with or without the marketplace/analytics migrations
-- (20261102120000..20261104120000): tables from those are used only if present.
--
-- 1. sign-photos becomes a private bucket. A photo is readable by the person
--    who uploaded it, by moderators, and by anyone once the sign it belongs
--    to is approved. The app now requests short-lived signed URLs.
-- 2. The legacy occupancy-report table is no longer world-readable. Reports
--    are still summarised by nearby_parking (security definer).
-- 3. delete_my_data(): in-app deletion of everything tied to the caller's
--    anonymous account, including the auth user itself.
-- 4. Moderation: a private moderators list and two RPCs (queue + decision).

-- 1. Private sign photos -----------------------------------------------------
update storage.buckets set public = false where id = 'sign-photos';

create table if not exists public.moderators (
  user_id uuid primary key,
  added_at timestamptz not null default now(),
  note text
);
alter table public.moderators enable row level security;
revoke all on public.moderators from anon, authenticated, public;
comment on table public.moderators is
  'Accounts allowed to approve/reject reported signs. Add rows from the SQL editor only.';

-- Marketplace admins can also review signs, so there is one admin list to manage.
create or replace function public.is_moderator()
returns boolean language plpgsql stable security definer set search_path = public as $$
declare found boolean;
begin
  if exists (select 1 from public.moderators where user_id = auth.uid()) then return true; end if;
  if to_regclass('public.marketplace_admins') is null then return false; end if;
  execute 'select exists (select 1 from public.marketplace_admins where user_id = $1)' into found using auth.uid();
  return found;
end;
$$;
revoke all on function public.is_moderator() from public;
grant execute on function public.is_moderator() to anon, authenticated;

-- Security definer so the storage policy does not depend on table grants/RLS.
create or replace function public.sign_photo_is_published(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parking_spots s
    where s.moderation_status = 'approved' and s.photo_url like '%/sign-photos/' || p_name
  );
$$;
revoke all on function public.sign_photo_is_published(text) from public;
grant execute on function public.sign_photo_is_published(text) to anon, authenticated;

drop policy if exists "sign photos are publicly readable" on storage.objects;
drop policy if exists "sign photos readable by owner, moderators or once approved" on storage.objects;
create policy "sign photos readable by owner, moderators or once approved" on storage.objects
  for select using (
    bucket_id = 'sign-photos' and (
      owner = auth.uid()
      or public.is_moderator()
      or public.sign_photo_is_published(storage.objects.name)
    )
  );

drop policy if exists "owners delete their sign photos" on storage.objects;
create policy "owners delete their sign photos" on storage.objects
  for delete to authenticated using (bucket_id = 'sign-photos' and owner = auth.uid());

-- 2. Legacy occupancy reports: own rows only ---------------------------------
drop policy if exists "pings are publicly readable" on public.spot_status_pings;
drop policy if exists "reporters read their own pings" on public.spot_status_pings;
create policy "reporters read their own pings" on public.spot_status_pings
  for select to authenticated using (user_id = auth.uid());
revoke select on public.spot_status_pings from anon;

-- 3. In-app data deletion -----------------------------------------------------
-- Photos are removed by the app first (storage rows cannot be deleted from SQL);
-- this function removes every database row tied to the caller.
create or replace function public.delete_my_data()
returns json language plpgsql security definer set search_path = public, auth as $$
declare
  uid uuid := auth.uid();
  removed json;
begin
  if uid is null then raise exception 'not signed in'; end if;
  with
    pings    as (delete from spot_status_pings  where user_id = uid returning 1),
    claims   as (delete from spot_claims        where user_id = uid returning 1),
    visits   as (delete from spot_visits        where user_id = uid returning 1),
    searches as (delete from search_events      where user_id = uid returning 1),
    feedback as (delete from app_feedback       where user_id = uid returning 1),
    bookings as (delete from bookings           where driver_id = uid returning 1),
    tester   as (delete from testers            where user_id = uid returning 1)
  select json_build_object(
    'occupancy_reports', (select count(*) from pings),
    'claims', (select count(*) from claims),
    'visits', (select count(*) from visits),
    'searches', (select count(*) from searches),
    'feedback', (select count(*) from feedback),
    'bookings', (select count(*) from bookings),
    'tester_number', (select count(*) from tester)
  ) into removed;
  delete from listings where owner_id = uid;
  delete from parking_rules where created_by = uid;
  delete from parking_spots where created_by = uid;   -- cascades to their rules and pings
  delete from moderators where user_id = uid;
  if to_regclass('public.analytics_events') is not null then
    execute 'delete from public.analytics_events where user_id = $1' using uid;
  end if;
  if to_regclass('public.parking_information_reports') is not null then
    execute 'delete from public.parking_information_reports where reporter_id = $1' using uid;
  end if;
  -- Deleting the account cascades to analytics events, parking-information
  -- reports, marketplace host profiles, listings and reservation holds.
  -- Marketplace bookings and payments reference the account with ON DELETE
  -- RESTRICT because they must be kept for refunds, disputes and tax; in that
  -- case everything above is still deleted and the account itself is kept.
  begin
    delete from auth.users where id = uid;
    removed := (removed::jsonb || jsonb_build_object('account_deleted', true))::json;
  exception when foreign_key_violation then
    removed := (removed::jsonb || jsonb_build_object('account_deleted', false,
      'kept', 'marketplace bookings and payment records')) ::json;
  end;
  return removed;
end;
$$;
revoke all on function public.delete_my_data() from public, anon;
grant execute on function public.delete_my_data() to authenticated;

-- 4. Moderation --------------------------------------------------------------
create or replace function public.moderation_queue()
returns table (id uuid, address_text text, suburb text, state text, country text, lat double precision,
               lng double precision, photo_url text, created_at timestamptz, rules json)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_moderator() then raise exception 'moderators only' using errcode = '42501'; end if;
  return query
    select s.id, s.address_text, s.suburb, s.state, s.country, s.lat, s.lng, s.photo_url, s.created_at,
           coalesce((select json_agg(row_to_json(r)) from (
             select r2.sign_type, r2.max_stay_minutes, r2.days_active, r2.time_from, r2.time_to,
                    r2.price_per_hour, r2.currency, r2.notes
             from parking_rules r2 where r2.spot_id = s.id) r), '[]'::json)
    from parking_spots s
    where s.moderation_status = 'pending'
    order by s.created_at asc
    limit 100;
end;
$$;
revoke all on function public.moderation_queue() from public, anon;
grant execute on function public.moderation_queue() to authenticated;

create or replace function public.moderate_spot(p_spot_id uuid, p_decision text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_moderator() then raise exception 'moderators only' using errcode = '42501'; end if;
  if p_decision not in ('approved', 'rejected') then raise exception 'decision must be approved or rejected'; end if;
  update parking_spots set moderation_status = p_decision where id = p_spot_id and moderation_status = 'pending';
  if not found then raise exception 'spot is not pending'; end if;
end;
$$;
revoke all on function public.moderate_spot(uuid, text) from public, anon;
grant execute on function public.moderate_spot(uuid, text) to authenticated;
