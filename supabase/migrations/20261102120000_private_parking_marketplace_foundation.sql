-- BAY private parking marketplace foundation.
--
-- This intentionally does not reuse the legacy public.listings/public.bookings
-- workflow. Confirmed bookings and payment totals must be created by trusted
-- server code after availability and payment webhooks are verified.

create table if not exists public.marketplace_host_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone_e164 text,
  identity_status text not null default 'not_started'
    check (identity_status in ('not_started', 'pending', 'verified', 'rejected')),
  payout_status text not null default 'not_started'
    check (payout_status in ('not_started', 'pending', 'ready', 'restricted')),
  payment_account_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 80),
  description text check (description is null or char_length(description) <= 1000),
  address_text text not null,
  suburb text,
  state text,
  postcode text,
  country text not null default 'Australia' check (country = 'Australia'),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  location extensions.geography(Point, 4326) generated always as (
    extensions.ST_SetSRID(extensions.ST_MakePoint(lng, lat), 4326)::extensions.geography
  ) stored,
  space_type text not null check (space_type in ('driveway', 'apartment_bay', 'garage', 'commercial')),
  access_type text not null default 'open' check (access_type in ('open', 'key', 'fob', 'gate_code', 'attendant')),
  max_vehicle_size text not null default 'large_car'
    check (max_vehicle_size in ('motorcycle', 'small_car', 'large_car', 'van')),
  height_limit_cm integer check (height_limit_cm is null or height_limit_cm between 100 and 500),
  photo_paths text[] not null check (cardinality(photo_paths) between 1 and 8),
  currency text not null default 'AUD' check (currency = 'AUD'),
  price_per_hour_cents integer check (price_per_hour_cents is null or price_per_hour_cents > 0),
  price_per_day_cents integer check (price_per_day_cents is null or price_per_day_cents > 0),
  price_per_week_cents integer check (price_per_week_cents is null or price_per_week_cents > 0),
  price_per_month_cents integer check (price_per_month_cents is null or price_per_month_cents > 0),
  price_per_year_cents integer check (price_per_year_cents is null or price_per_year_cents > 0),
  minimum_booking_minutes integer not null default 60 check (minimum_booking_minutes between 30 and 525600),
  timezone text not null default 'Australia/Melbourne',
  availability jsonb not null default '{"days":[0,1,2,3,4,5,6],"from":"00:00","to":"23:59"}'::jsonb,
  instant_book boolean not null default false,
  moderation_status text not null default 'pending_review'
    check (moderation_status in ('draft', 'pending_review', 'active', 'rejected', 'suspended')),
  moderation_note text,
  rights_attested_at timestamptz not null,
  strata_or_owner_approval_attested boolean not null default false,
  is_public_road boolean not null default false check (is_public_road = false),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    price_per_hour_cents is not null or price_per_day_cents is not null or
    price_per_week_cents is not null or price_per_month_cents is not null or
    price_per_year_cents is not null
  )
);

create index if not exists marketplace_listings_location_idx on public.marketplace_listings using gist (location);
create index if not exists marketplace_listings_host_idx on public.marketplace_listings(host_id, created_at desc);
create index if not exists marketplace_listings_active_idx on public.marketplace_listings(moderation_status) where moderation_status = 'active';

-- Exact access instructions are deliberately separated from public listing
-- data and become readable to a driver only after a server-confirmed booking.
create table if not exists public.marketplace_listing_private (
  listing_id uuid primary key references public.marketplace_listings(id) on delete cascade,
  access_instructions text,
  gate_code text,
  host_contact_note text,
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete restrict,
  driver_id uuid not null references auth.users(id) on delete restrict,
  host_id uuid not null references auth.users(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  currency text not null default 'AUD' check (currency = 'AUD'),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  platform_fee_cents integer not null check (platform_fee_cents >= 0 and platform_fee_cents <= subtotal_cents),
  host_payout_cents integer not null check (host_payout_cents = subtotal_cents - platform_fee_cents),
  status text not null default 'requested'
    check (status in ('requested', 'awaiting_payment', 'confirmed', 'cancelled', 'completed', 'refunded', 'disputed')),
  payment_intent_ref text unique,
  idempotency_key text not null unique,
  cancellation_reason text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketplace_bookings_driver_idx on public.marketplace_bookings(driver_id, created_at desc);
create index if not exists marketplace_bookings_host_idx on public.marketplace_bookings(host_id, created_at desc);
create index if not exists marketplace_bookings_listing_idx on public.marketplace_bookings(listing_id, starts_at, ends_at);
alter table public.marketplace_bookings
  add constraint marketplace_bookings_no_confirmed_overlap
  exclude using gist (
    listing_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('awaiting_payment', 'confirmed'));

alter table public.marketplace_host_profiles enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.marketplace_listing_private enable row level security;
alter table public.marketplace_bookings enable row level security;

create policy "hosts read own marketplace profile" on public.marketplace_host_profiles
  for select to authenticated using (user_id = auth.uid());
create policy "hosts create own marketplace profile" on public.marketplace_host_profiles
  for insert to authenticated with check (
    user_id = auth.uid() and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) = false
  );
create policy "hosts update own non-payment profile" on public.marketplace_host_profiles
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Column grants prevent a host from self-asserting verified identity/payout
-- status or attaching an arbitrary provider account reference.
revoke insert, update on public.marketplace_host_profiles from authenticated;
grant insert (user_id, display_name, phone_e164) on public.marketplace_host_profiles to authenticated;
grant update (display_name, phone_e164, updated_at) on public.marketplace_host_profiles to authenticated;

create policy "active marketplace listings are public" on public.marketplace_listings
  for select using (moderation_status = 'active' or host_id = auth.uid());
create policy "verified users submit private spaces" on public.marketplace_listings
  for insert to authenticated with check (
    host_id = auth.uid()
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) = false
    and moderation_status in ('draft', 'pending_review')
    and is_public_road = false
  );
create policy "hosts edit listings before publication" on public.marketplace_listings
  for update to authenticated using (
    host_id = auth.uid() and moderation_status in ('draft', 'pending_review', 'rejected')
  ) with check (
    host_id = auth.uid() and moderation_status in ('draft', 'pending_review') and is_public_road = false
  );

create policy "hosts read own private access data" on public.marketplace_listing_private
  for select to authenticated using (
    exists (select 1 from public.marketplace_listings l where l.id = listing_id and l.host_id = auth.uid())
    or exists (
      select 1 from public.marketplace_bookings b
      where b.listing_id = marketplace_listing_private.listing_id
        and b.driver_id = auth.uid() and b.status = 'confirmed'
    )
  );
create policy "hosts create own private access data" on public.marketplace_listing_private
  for insert to authenticated with check (
    exists (select 1 from public.marketplace_listings l where l.id = listing_id and l.host_id = auth.uid())
  );
create policy "hosts update own private access data" on public.marketplace_listing_private
  for update to authenticated using (
    exists (select 1 from public.marketplace_listings l where l.id = listing_id and l.host_id = auth.uid())
  );

create policy "booking parties read their bookings" on public.marketplace_bookings
  for select to authenticated using (driver_id = auth.uid() or host_id = auth.uid());

-- No client insert/update/delete policies are provided for bookings. Quote,
-- availability, fees, payment creation and confirmation remain server-only.
revoke insert, update, delete on public.marketplace_bookings from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "hosts upload own listing photos" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) = false
  );
create policy "hosts read own listing photos" on storage.objects
  for select to authenticated using (
    bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "drivers read approved listing photos" on storage.objects
  for select using (
    bucket_id = 'listing-photos'
    and exists (
      select 1 from public.marketplace_listings l
      where l.moderation_status = 'active' and name = any(l.photo_paths)
    )
  );

create or replace function public.nearby_marketplace_listings(
  p_lat double precision,
  p_lng double precision,
  p_radius_m integer default 5000
)
returns table (
  id uuid,
  title text,
  display_address text,
  suburb text,
  state text,
  country text,
  lat double precision,
  lng double precision,
  distance_m double precision,
  photo_path text,
  space_type text,
  currency text,
  price_per_hour numeric,
  price_per_day numeric,
  price_per_week numeric,
  price_per_month numeric,
  price_per_year numeric,
  instant_book boolean
)
language sql stable security invoker
set search_path = public, extensions
as $$
  select
    l.id,
    l.title,
    concat_ws(', ', nullif(l.suburb, ''), nullif(l.state, '')) as display_address,
    l.suburb,
    l.state,
    l.country,
    round(l.lat::numeric, 3)::double precision,
    round(l.lng::numeric, 3)::double precision,
    extensions.ST_Distance(
      l.location,
      extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography
    ) as distance_m,
    l.photo_paths[1],
    l.space_type,
    l.currency,
    l.price_per_hour_cents / 100.0,
    l.price_per_day_cents / 100.0,
    l.price_per_week_cents / 100.0,
    l.price_per_month_cents / 100.0,
    l.price_per_year_cents / 100.0,
    l.instant_book
  from public.marketplace_listings l
  where l.moderation_status = 'active'
    and extensions.ST_DWithin(
      l.location,
      extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography,
      least(greatest(p_radius_m, 100), 50000)
    )
  order by distance_m asc
  limit 200;
$$;

grant execute on function public.nearby_marketplace_listings(double precision, double precision, integer) to anon, authenticated;

comment on table public.marketplace_listings is
  'Moderated, privately controlled off-street parking spaces. Public roads and kerbside spaces are prohibited.';
comment on table public.marketplace_bookings is
  'Server-controlled marketplace reservations. A confirmed status requires verified availability and payment webhook processing.';
