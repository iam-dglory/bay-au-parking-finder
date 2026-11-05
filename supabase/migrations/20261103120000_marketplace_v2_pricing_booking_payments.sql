-- BAY Marketplace V2: versioned pricing policy, server-owned listing
-- validation, reservation holds and payment/refund audit foundations.
--
-- All seeded price bands are provisional launch guardrails supplied by the
-- product owner. Geographic boundaries intentionally remain inactive until an
-- administrator loads verified geometry. Stripe secrets never belong here.

create table if not exists public.marketplace_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.marketplace_admins enable row level security;
revoke all on public.marketplace_admins from anon, authenticated;

create or replace function public.is_marketplace_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.marketplace_admins a where a.user_id = auth.uid()
  );
$$;
grant execute on function public.is_marketplace_admin() to authenticated;

create table if not exists public.marketplace_policy_versions (
  id uuid primary key default gen_random_uuid(),
  version_code text not null unique,
  currency text not null default 'AUD' check (currency = 'AUD'),
  commission_bps integer not null check (commission_bps between 0 and 10000),
  listing_fee_cents integer not null default 0 check (listing_fee_cents >= 0),
  driver_service_fee_cents integer not null default 0 check (driver_service_fee_cents >= 0),
  minimum_subtotal_cents integer not null check (minimum_subtotal_cents > 0),
  minimum_hourly_minutes integer not null check (minimum_hourly_minutes > 0),
  maximum_hourly_minutes integer not null check (maximum_hourly_minutes >= minimum_hourly_minutes),
  advance_booking_days integer not null check (advance_booking_days > 0),
  maximum_active_driver_bookings integer not null check (maximum_active_driver_bookings > 0),
  enabled_periods text[] not null default array['hour','day','week','month'],
  active boolean not null default false,
  effective_from timestamptz not null default now(),
  effective_until timestamptz,
  created_at timestamptz not null default now(),
  check (not ('year' = any(enabled_periods)))
);

create unique index if not exists marketplace_policy_one_active_idx
  on public.marketplace_policy_versions(active) where active;

create table if not exists public.marketplace_pricing_zones (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  priority integer not null default 0,
  boundary extensions.geometry(MultiPolygon, 4326),
  boundary_source text,
  boundary_verified_at timestamptz,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not active or (boundary is not null and boundary_source is not null and boundary_verified_at is not null))
);

create index if not exists marketplace_pricing_zones_boundary_idx
  on public.marketplace_pricing_zones using gist(boundary);

create table if not exists public.marketplace_pricing_bands (
  policy_version_id uuid not null references public.marketplace_policy_versions(id) on delete restrict,
  zone_id uuid not null references public.marketplace_pricing_zones(id) on delete restrict,
  period text not null check (period in ('hour','day','week','month')),
  minimum_cents integer not null check (minimum_cents > 0),
  maximum_cents integer not null check (maximum_cents >= minimum_cents),
  primary key (policy_version_id, zone_id, period)
);

create table if not exists public.marketplace_space_type_policies (
  policy_version_id uuid not null references public.marketplace_policy_versions(id) on delete restrict,
  space_type text not null check (space_type in (
    'open_driveway','uncovered_bay','covered_bay','private_garage','apartment_bay','commercial_space'
  )),
  label text not null,
  description text not null,
  hourly_maximum_cents integer not null check (hourly_maximum_cents > 0),
  daily_maximum_cents integer not null check (daily_maximum_cents > 0),
  active boolean not null default true,
  primary key (policy_version_id, space_type)
);

insert into public.marketplace_policy_versions (
  version_code, commission_bps, listing_fee_cents, driver_service_fee_cents,
  minimum_subtotal_cents, minimum_hourly_minutes, maximum_hourly_minutes,
  advance_booking_days, maximum_active_driver_bookings, active
) values ('launch-au-v1-provisional', 500, 0, 0, 500, 120, 1440, 90, 5, true)
on conflict (version_code) do nothing;

insert into public.marketplace_pricing_zones (code, name, description, priority)
values
  ('melbourne_cbd', 'Melbourne CBD', 'Provisional policy category; verified geometry required.', 10),
  ('inner_suburbs', 'Inner suburbs', 'Provisional policy category; verified geometry required.', 1),
  ('outer_suburbs', 'Outer suburbs', 'Provisional policy category; verified geometry required.', 0),
  ('universities', 'Universities', 'Verified university precincts override general suburb zones.', 70),
  ('hospitals', 'Hospitals', 'Verified hospital precincts override general suburb zones.', 80),
  ('train_stations', 'Train stations', 'Verified station precincts override general suburb zones.', 60),
  ('airport_surrounds', 'Airport surrounds', 'Verified airport-adjacent private inventory only.', 90),
  ('event_areas', 'Event areas', 'Verified event precincts override general suburb zones.', 100)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  priority = excluded.priority;

with p as (
  select id from public.marketplace_policy_versions where version_code = 'launch-au-v1-provisional'
), values_to_load(zone_code, period, minimum_cents, maximum_cents) as (
  values
    ('melbourne_cbd','hour',400,2000),('melbourne_cbd','day',2000,7500),('melbourne_cbd','week',9000,35000),('melbourne_cbd','month',25000,95000),
    ('inner_suburbs','hour',300,1500),('inner_suburbs','day',1500,5500),('inner_suburbs','week',7000,25000),('inner_suburbs','month',20000,75000),
    ('outer_suburbs','hour',200,1000),('outer_suburbs','day',800,3500),('outer_suburbs','week',4000,16000),('outer_suburbs','month',12000,45000),
    ('universities','hour',200,1200),('universities','day',1000,4500),('universities','week',5000,20000),('universities','month',15000,60000),
    ('hospitals','hour',300,1500),('hospitals','day',1500,6000),('hospitals','week',7000,25000),('hospitals','month',20000,75000),
    ('train_stations','hour',200,1200),('train_stations','day',1000,4000),('train_stations','week',5000,18000),('train_stations','month',15000,50000),
    ('airport_surrounds','hour',300,1800),('airport_surrounds','day',1500,6500),('airport_surrounds','week',7000,28000),('airport_surrounds','month',20000,80000),
    ('event_areas','hour',400,2000),('event_areas','day',2000,8000),('event_areas','week',9000,35000),('event_areas','month',25000,95000)
)
insert into public.marketplace_pricing_bands(policy_version_id, zone_id, period, minimum_cents, maximum_cents)
select p.id, z.id, v.period, v.minimum_cents, v.maximum_cents
from p cross join values_to_load v join public.marketplace_pricing_zones z on z.code = v.zone_code
on conflict (policy_version_id, zone_id, period) do update set
  minimum_cents = excluded.minimum_cents,
  maximum_cents = excluded.maximum_cents;

with p as (
  select id from public.marketplace_policy_versions where version_code = 'launch-au-v1-provisional'
), values_to_load(space_type, label, description, hourly_maximum_cents, daily_maximum_cents) as (
  values
    ('open_driveway','Open driveway','An off-street driveway controlled by the host.',1200,4500),
    ('uncovered_bay','Uncovered private bay','A marked private bay without a roof.',1200,4500),
    ('covered_bay','Covered parking bay','A private bay protected by a roof or structure.',1500,6000),
    ('private_garage','Private garage','An enclosed garage with controlled access.',2000,8000),
    ('apartment_bay','Apartment parking bay','A bay the host is authorised to offer.',1500,6000),
    ('commercial_space','Authorised commercial space','A business-controlled space approved for marketplace use.',2500,10000)
)
insert into public.marketplace_space_type_policies(
  policy_version_id, space_type, label, description, hourly_maximum_cents, daily_maximum_cents
)
select p.id, v.* from p cross join values_to_load v
on conflict (policy_version_id, space_type) do update set
  label = excluded.label,
  description = excluded.description,
  hourly_maximum_cents = excluded.hourly_maximum_cents,
  daily_maximum_cents = excluded.daily_maximum_cents;

alter table public.marketplace_listings drop constraint if exists marketplace_listings_space_type_check;
alter table public.marketplace_listings add constraint marketplace_listings_space_type_check check (space_type in (
  'driveway','garage','commercial',
  'open_driveway','uncovered_bay','covered_bay','private_garage','apartment_bay','commercial_space'
));
alter table public.marketplace_listings
  add column if not exists pricing_zone_id uuid references public.marketplace_pricing_zones(id) on delete restrict,
  add column if not exists policy_version_id uuid references public.marketplace_policy_versions(id) on delete restrict,
  add column if not exists address_validated_at timestamptz,
  add column if not exists pricing_validated_at timestamptz,
  add column if not exists accessible_verified boolean not null default false,
  add column if not exists ev_charging_verified boolean not null default false;

create table if not exists public.marketplace_listing_prices (
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  period text not null check (period in ('hour','day','week','month')),
  price_cents integer not null check (price_cents > 0),
  policy_version_id uuid not null references public.marketplace_policy_versions(id) on delete restrict,
  validated_at timestamptz not null default now(),
  primary key (listing_id, period)
);

create table if not exists public.marketplace_availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  available boolean not null default false,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists marketplace_availability_exceptions_idx
  on public.marketplace_availability_exceptions(listing_id, starts_at, ends_at);

alter table public.marketplace_host_profiles
  add column if not exists charges_enabled boolean not null default false,
  add column if not exists payouts_enabled boolean not null default false,
  add column if not exists details_submitted boolean not null default false,
  add column if not exists payment_requirements jsonb not null default '[]'::jsonb,
  add column if not exists payment_account_updated_at timestamptz;

create table if not exists public.marketplace_cancellation_policy_versions (
  id uuid primary key default gen_random_uuid(),
  version_code text not null unique,
  rules jsonb not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists marketplace_cancellation_one_active_idx
  on public.marketplace_cancellation_policy_versions(active) where active;
insert into public.marketplace_cancellation_policy_versions(version_code, rules, active)
values ('launch-au-v1-draft', '{"more_than_24_hours":100,"six_to_24_hours":75,"less_than_six_hours":50,"after_start":0,"host_cancellation":100,"verified_access_failure":100}'::jsonb, true)
on conflict (version_code) do nothing;

create table if not exists public.marketplace_reservation_holds (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete restrict,
  driver_id uuid not null references auth.users(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  period text not null check (period in ('hour','day','week','month')),
  quantity integer not null check (quantity > 0),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  platform_fee_cents integer not null check (platform_fee_cents >= 0),
  host_allocation_cents integer not null check (host_allocation_cents = subtotal_cents - platform_fee_cents),
  policy_version_id uuid not null references public.marketplace_policy_versions(id) on delete restrict,
  status text not null default 'held' check (status in ('held','payment_pending','converted','expired','cancelled')),
  expires_at timestamptz not null,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);
alter table public.marketplace_reservation_holds
  add constraint marketplace_holds_no_active_overlap
  exclude using gist (
    listing_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('held','payment_pending'));
create index if not exists marketplace_holds_expiry_idx on public.marketplace_reservation_holds(expires_at) where status in ('held','payment_pending');

create table if not exists public.marketplace_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.marketplace_bookings(id) on delete restrict,
  hold_id uuid references public.marketplace_reservation_holds(id) on delete restrict,
  provider text not null default 'stripe' check (provider = 'stripe'),
  livemode boolean not null default false,
  checkout_session_ref text unique,
  payment_intent_ref text unique,
  charge_ref text unique,
  connected_account_ref text,
  currency text not null default 'AUD' check (currency = 'AUD'),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  platform_fee_cents integer not null check (platform_fee_cents >= 0),
  processing_fee_cents integer,
  tax_cents integer not null default 0,
  host_allocation_cents integer not null,
  status text not null default 'created' check (status in ('created','pending','paid','failed','partially_refunded','refunded','disputed')),
  raw_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.marketplace_payments(id) on delete restrict,
  booking_id uuid references public.marketplace_bookings(id) on delete restrict,
  provider_ref text unique,
  amount_cents integer not null check (amount_cents > 0),
  refund_percent integer check (refund_percent between 0 and 100),
  reason text not null,
  status text not null default 'pending' check (status in ('pending','succeeded','failed','cancelled')),
  initiated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_disputes (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.marketplace_payments(id) on delete restrict,
  booking_id uuid references public.marketplace_bookings(id) on delete restrict,
  provider_ref text not null unique,
  amount_cents integer not null check (amount_cents >= 0),
  reason text,
  status text not null,
  evidence_due_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_payouts (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references auth.users(id) on delete set null,
  connected_account_ref text not null,
  provider_ref text not null unique,
  livemode boolean not null default false,
  currency text not null default 'AUD' check (currency = 'AUD'),
  amount_cents integer not null,
  arrival_at timestamptz,
  status text not null,
  failure_code text,
  failure_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- These records let administrators prepare reviewed exceptions/promotions,
-- but the launch quote function does not apply them until funding, tax and
-- disclosure rules are separately approved.
create table if not exists public.marketplace_pricing_exceptions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  period text not null check (period in ('hour','day','week','month')),
  minimum_cents integer not null check (minimum_cents > 0),
  maximum_cents integer not null check (maximum_cents >= minimum_cents),
  reason text not null,
  approved_by uuid not null references auth.users(id) on delete restrict,
  valid_from timestamptz not null,
  valid_until timestamptz,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null,
  discount_bps integer check (discount_bps is null or discount_bps between 1 and 10000),
  discount_cents integer check (discount_cents is null or discount_cents > 0),
  funding_source text check (funding_source in ('bay','host','shared')),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  maximum_redemptions integer check (maximum_redemptions is null or maximum_redemptions > 0),
  active boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check ((discount_bps is null) <> (discount_cents is null)),
  check (not active or funding_source is not null)
);

create table if not exists public.marketplace_webhook_events (
  provider text not null default 'stripe',
  event_id text not null,
  event_type text not null,
  api_version text,
  livemode boolean not null default false,
  payload_sha256 text not null,
  status text not null default 'received' check (status in ('received','processing','processed','failed','ignored')),
  attempts integer not null default 0,
  last_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  primary key (provider, event_id)
);

create table if not exists public.marketplace_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  actor_kind text not null check (actor_kind in ('user','admin','service','webhook')),
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.marketplace_policy_versions enable row level security;
alter table public.marketplace_pricing_zones enable row level security;
alter table public.marketplace_pricing_bands enable row level security;
alter table public.marketplace_space_type_policies enable row level security;
alter table public.marketplace_listing_prices enable row level security;
alter table public.marketplace_availability_exceptions enable row level security;
alter table public.marketplace_cancellation_policy_versions enable row level security;
alter table public.marketplace_reservation_holds enable row level security;
alter table public.marketplace_payments enable row level security;
alter table public.marketplace_refunds enable row level security;
alter table public.marketplace_disputes enable row level security;
alter table public.marketplace_payouts enable row level security;
alter table public.marketplace_pricing_exceptions enable row level security;
alter table public.marketplace_promotions enable row level security;
alter table public.marketplace_webhook_events enable row level security;
alter table public.marketplace_audit_log enable row level security;

create policy "read active marketplace policy" on public.marketplace_policy_versions for select using (active or public.is_marketplace_admin());
create policy "read active pricing zones" on public.marketplace_pricing_zones for select using (active or public.is_marketplace_admin());
create policy "read active pricing bands" on public.marketplace_pricing_bands for select using (
  exists (select 1 from public.marketplace_policy_versions p where p.id = policy_version_id and p.active) or public.is_marketplace_admin()
);
create policy "read active space type policies" on public.marketplace_space_type_policies for select using (
  active and exists (select 1 from public.marketplace_policy_versions p where p.id = policy_version_id and p.active) or public.is_marketplace_admin()
);
create policy "read approved listing prices" on public.marketplace_listing_prices for select using (
  exists (select 1 from public.marketplace_listings l where l.id = listing_id and (l.moderation_status = 'active' or l.host_id = auth.uid()))
);
create policy "hosts manage own availability exceptions" on public.marketplace_availability_exceptions for all to authenticated
  using (exists (select 1 from public.marketplace_listings l where l.id = listing_id and l.host_id = auth.uid()))
  with check (exists (select 1 from public.marketplace_listings l where l.id = listing_id and l.host_id = auth.uid()));
create policy "read active cancellation policy" on public.marketplace_cancellation_policy_versions for select using (active or public.is_marketplace_admin());
create policy "drivers read own holds" on public.marketplace_reservation_holds for select to authenticated using (driver_id = auth.uid());
create policy "booking parties read payments" on public.marketplace_payments for select to authenticated using (
  exists (select 1 from public.marketplace_bookings b where b.id = booking_id and (b.driver_id = auth.uid() or b.host_id = auth.uid()))
);
create policy "booking parties read refunds" on public.marketplace_refunds for select to authenticated using (
  exists (select 1 from public.marketplace_bookings b where b.id = booking_id and (b.driver_id = auth.uid() or b.host_id = auth.uid()))
);
create policy "booking parties read disputes" on public.marketplace_disputes for select to authenticated using (
  exists (select 1 from public.marketplace_bookings b where b.id = booking_id and (b.driver_id = auth.uid() or b.host_id = auth.uid()))
);
create policy "hosts read own payouts" on public.marketplace_payouts for select to authenticated using (host_id = auth.uid());
create policy "marketplace admins read listings" on public.marketplace_listings for select to authenticated using (public.is_marketplace_admin());
create policy "marketplace admins read bookings" on public.marketplace_bookings for select to authenticated using (public.is_marketplace_admin());
create policy "marketplace admins read host profiles" on public.marketplace_host_profiles for select to authenticated using (public.is_marketplace_admin());
create policy "marketplace admins read holds" on public.marketplace_reservation_holds for select to authenticated using (public.is_marketplace_admin());
create policy "marketplace admins read payments" on public.marketplace_payments for select to authenticated using (public.is_marketplace_admin());
create policy "marketplace admins read refunds" on public.marketplace_refunds for select to authenticated using (public.is_marketplace_admin());
create policy "marketplace admins read disputes" on public.marketplace_disputes for select to authenticated using (public.is_marketplace_admin());
create policy "marketplace admins read payouts" on public.marketplace_payouts for select to authenticated using (public.is_marketplace_admin());
create policy "marketplace admins read pricing exceptions" on public.marketplace_pricing_exceptions for select to authenticated using (public.is_marketplace_admin());
create policy "marketplace admins read promotions" on public.marketplace_promotions for select to authenticated using (public.is_marketplace_admin());
create policy "marketplace admins read audit log" on public.marketplace_audit_log for select to authenticated using (public.is_marketplace_admin());

revoke insert, update, delete on public.marketplace_listing_prices from anon, authenticated;
revoke insert, update, delete on public.marketplace_listings from anon, authenticated;
revoke insert, update, delete on public.marketplace_reservation_holds from anon, authenticated;
revoke insert, update, delete on public.marketplace_payments from anon, authenticated;
revoke insert, update, delete on public.marketplace_refunds from anon, authenticated;
revoke insert, update, delete on public.marketplace_disputes from anon, authenticated;
revoke insert, update, delete on public.marketplace_payouts from anon, authenticated;
revoke insert, update, delete on public.marketplace_pricing_exceptions from anon, authenticated;
revoke insert, update, delete on public.marketplace_promotions from anon, authenticated;
revoke all on public.marketplace_webhook_events from anon, authenticated;
revoke all on public.marketplace_audit_log from anon, authenticated;
revoke insert, update, delete on public.marketplace_policy_versions, public.marketplace_pricing_zones,
  public.marketplace_pricing_bands, public.marketplace_space_type_policies,
  public.marketplace_cancellation_policy_versions from anon, authenticated;

-- Hosts can preview their server-assigned zone and permitted ranges. No client
-- parameter can select or override a zone.
create or replace function public.marketplace_price_preview(
  p_lat double precision,
  p_lng double precision,
  p_space_type text
)
returns table (
  zone_code text,
  zone_name text,
  period text,
  minimum_cents integer,
  maximum_cents integer,
  commission_bps integer,
  policy_version_code text
)
language sql stable security definer
set search_path = public, extensions
as $$
  with selected_policy as (
    select * from public.marketplace_policy_versions where active order by effective_from desc limit 1
  ), selected_zone as (
    select z.*
    from public.marketplace_pricing_zones z
    where z.active
      and z.boundary is not null
      and extensions.ST_Covers(z.boundary, extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326))
    order by z.priority desc, extensions.ST_Area(z.boundary) asc, z.code asc
    limit 1
  )
  select
    z.code,
    z.name,
    b.period,
    b.minimum_cents,
    case
      when b.period = 'hour' then least(b.maximum_cents, t.hourly_maximum_cents)
      when b.period = 'day' then least(b.maximum_cents, t.daily_maximum_cents)
      else b.maximum_cents
    end,
    p.commission_bps,
    p.version_code
  from selected_policy p
  cross join selected_zone z
  join public.marketplace_pricing_bands b on b.policy_version_id = p.id and b.zone_id = z.id
  join public.marketplace_space_type_policies t on t.policy_version_id = p.id and t.space_type = p_space_type and t.active
  order by case b.period when 'hour' then 1 when 'day' then 2 when 'week' then 3 else 4 end;
$$;
grant execute on function public.marketplace_price_preview(double precision, double precision, text) to authenticated;

-- This is the only authenticated listing creation path for V2. It resolves the
-- zone, validates integer-cent prices and stores the exact policy version.
create or replace function public.marketplace_submit_listing_v2(
  p_title text,
  p_description text,
  p_address_text text,
  p_suburb text,
  p_state text,
  p_postcode text,
  p_lat double precision,
  p_lng double precision,
  p_space_type text,
  p_access_type text,
  p_photo_paths text[],
  p_availability jsonb,
  p_prices jsonb,
  p_rights_attested boolean,
  p_approval_attested boolean
)
returns uuid
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_user uuid := auth.uid();
  v_policy public.marketplace_policy_versions%rowtype;
  v_zone public.marketplace_pricing_zones%rowtype;
  v_type public.marketplace_space_type_policies%rowtype;
  v_period text;
  v_price integer;
  v_min integer;
  v_max integer;
  v_listing_id uuid;
begin
  if v_user is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) then
    raise exception 'A verified account is required to submit a space';
  end if;
  if not p_rights_attested or not p_approval_attested then
    raise exception 'Host authority declarations are required';
  end if;
  if cardinality(p_photo_paths) not between 1 and 8 then
    raise exception 'Add between 1 and 8 photos';
  end if;
  if p_prices ? 'year' then raise exception 'Yearly pricing is not available'; end if;
  if jsonb_typeof(p_prices) <> 'object' or not exists (select 1 from jsonb_object_keys(p_prices)) then
    raise exception 'At least one price is required';
  end if;

  select * into strict v_policy from public.marketplace_policy_versions where active order by effective_from desc limit 1;
  select * into strict v_type from public.marketplace_space_type_policies
    where policy_version_id = v_policy.id and space_type = p_space_type and active;
  select * into v_zone from public.marketplace_pricing_zones z
    where z.active and z.boundary is not null
      and extensions.ST_Covers(z.boundary, extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326))
    order by z.priority desc, extensions.ST_Area(z.boundary) asc, z.code asc limit 1;
  if v_zone.id is null then
    raise exception 'This location is not inside a verified BAY pricing zone yet';
  end if;

  for v_period in select jsonb_object_keys(p_prices)
  loop
    if not (v_period = any(v_policy.enabled_periods)) then raise exception 'Pricing period % is disabled', v_period; end if;
    begin v_price := (p_prices ->> v_period)::integer;
    exception when others then raise exception 'Price for % must be integer cents', v_period; end;
    select b.minimum_cents,
      case when v_period = 'hour' then least(b.maximum_cents, v_type.hourly_maximum_cents)
           when v_period = 'day' then least(b.maximum_cents, v_type.daily_maximum_cents)
           else b.maximum_cents end
    into strict v_min, v_max
    from public.marketplace_pricing_bands b
    where b.policy_version_id = v_policy.id and b.zone_id = v_zone.id and b.period = v_period;
    if v_price < v_min or v_price > v_max then
      raise exception '% price must be between % and % cents', v_period, v_min, v_max;
    end if;
  end loop;

  insert into public.marketplace_listings (
    host_id, title, description, address_text, suburb, state, postcode, country,
    lat, lng, space_type, access_type, photo_paths, currency,
    price_per_hour_cents, price_per_day_cents, price_per_week_cents, price_per_month_cents,
    minimum_booking_minutes, availability, instant_book, moderation_status,
    rights_attested_at, strata_or_owner_approval_attested, is_public_road,
    pricing_zone_id, policy_version_id, address_validated_at, pricing_validated_at
  ) values (
    v_user, trim(p_title), nullif(trim(p_description), ''), trim(p_address_text), trim(p_suburb), upper(trim(p_state)), nullif(trim(p_postcode), ''), 'Australia',
    p_lat, p_lng, p_space_type, p_access_type, p_photo_paths, 'AUD',
    (p_prices ->> 'hour')::integer, (p_prices ->> 'day')::integer, (p_prices ->> 'week')::integer, (p_prices ->> 'month')::integer,
    v_policy.minimum_hourly_minutes, p_availability, false, 'pending_review',
    now(), true, false, v_zone.id, v_policy.id, null, now()
  ) returning id into v_listing_id;

  insert into public.marketplace_listing_prices(listing_id, period, price_cents, policy_version_id)
  select v_listing_id, key, value::integer, v_policy.id from jsonb_each_text(p_prices);

  insert into public.marketplace_audit_log(actor_id, actor_kind, action, entity_type, entity_id, metadata)
  values (v_user, 'user', 'listing.submitted', 'marketplace_listing', v_listing_id::text,
    jsonb_build_object('zone_code', v_zone.code, 'policy_version', v_policy.version_code));
  return v_listing_id;
end;
$$;
revoke all on function public.marketplace_submit_listing_v2(text,text,text,text,text,text,double precision,double precision,text,text,text[],jsonb,jsonb,boolean,boolean) from public;
grant execute on function public.marketplace_submit_listing_v2(text,text,text,text,text,text,double precision,double precision,text,text,text[],jsonb,jsonb,boolean,boolean) to authenticated;

-- Trusted server code calls this function after authenticating the driver. It
-- recalculates totals, enforces capacity/overlap and creates a short hold.
create or replace function public.marketplace_create_reservation_hold(
  p_driver_id uuid,
  p_listing_id uuid,
  p_starts_at timestamptz,
  p_period text,
  p_quantity integer,
  p_idempotency_key text
)
returns public.marketplace_reservation_holds
language plpgsql security definer
set search_path = public
as $$
declare
  v_listing public.marketplace_listings%rowtype;
  v_policy public.marketplace_policy_versions%rowtype;
  v_unit integer;
  v_subtotal integer;
  v_fee integer;
  v_ends timestamptz;
  v_result public.marketplace_reservation_holds%rowtype;
begin
  select * into v_result from public.marketplace_reservation_holds where idempotency_key = p_idempotency_key;
  if found then
    if v_result.driver_id = p_driver_id and v_result.listing_id = p_listing_id
      and v_result.starts_at = p_starts_at and v_result.period = p_period and v_result.quantity = p_quantity
      and v_result.status in ('held','payment_pending') then
      return v_result;
    end if;
    raise exception 'Idempotency key has already been used for a different booking request';
  end if;
  select * into strict v_listing from public.marketplace_listings where id = p_listing_id and moderation_status = 'active' for update;
  select * into strict v_policy from public.marketplace_policy_versions where id = v_listing.policy_version_id and active;
  if not exists (
    select 1 from public.marketplace_host_profiles h
    where h.user_id = v_listing.host_id and h.charges_enabled and h.payouts_enabled and h.payout_status = 'ready'
  ) then
    raise exception 'This host is not eligible to receive marketplace payouts';
  end if;
  if p_starts_at < now() or p_starts_at > now() + make_interval(days => v_policy.advance_booking_days) then
    raise exception 'Start time is outside the booking window';
  end if;
  if p_quantity <= 0 then raise exception 'Quantity must be positive'; end if;
  if p_period = 'hour' then
    if p_quantity * 60 < v_policy.minimum_hourly_minutes or p_quantity * 60 > v_policy.maximum_hourly_minutes then raise exception 'Hourly duration is outside policy'; end if;
    v_ends := p_starts_at + make_interval(hours => p_quantity);
  elsif p_period = 'day' then v_ends := p_starts_at + make_interval(days => p_quantity);
  elsif p_period = 'week' then v_ends := p_starts_at + make_interval(days => p_quantity * 7);
  elsif p_period = 'month' then v_ends := p_starts_at + make_interval(days => p_quantity * 30);
  else raise exception 'Unsupported booking period'; end if;

  if (select count(*) from public.marketplace_bookings where driver_id = p_driver_id and status in ('awaiting_payment','confirmed') and ends_at > now()) >= v_policy.maximum_active_driver_bookings then
    raise exception 'Maximum active bookings reached';
  end if;
  select price_cents into strict v_unit from public.marketplace_listing_prices where listing_id = p_listing_id and period = p_period;
  v_subtotal := v_unit * p_quantity;
  if v_subtotal < v_policy.minimum_subtotal_cents then raise exception 'Booking subtotal is below the configured minimum'; end if;
  v_fee := round(v_subtotal::numeric * v_policy.commission_bps / 10000)::integer;

  update public.marketplace_reservation_holds set status = 'expired'
    where status = 'held' and expires_at <= now();
  if exists (
    select 1 from public.marketplace_bookings b
    where b.listing_id = p_listing_id
      and b.status in ('awaiting_payment','confirmed')
      and tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(p_starts_at, v_ends, '[)')
  ) then
    raise exception 'The space is no longer available for that time';
  end if;
  insert into public.marketplace_reservation_holds(
    listing_id, driver_id, starts_at, ends_at, period, quantity,
    subtotal_cents, platform_fee_cents, host_allocation_cents,
    policy_version_id, expires_at, idempotency_key
  ) values (
    p_listing_id, p_driver_id, p_starts_at, v_ends, p_period, p_quantity,
    v_subtotal, v_fee, v_subtotal - v_fee,
    v_policy.id, now() + interval '35 minutes', p_idempotency_key
  ) returning * into v_result;
  return v_result;
end;
$$;
revoke all on function public.marketplace_create_reservation_hold(uuid,uuid,timestamptz,text,integer,text) from public, anon, authenticated;
grant execute on function public.marketplace_create_reservation_hold(uuid,uuid,timestamptz,text,integer,text) to service_role;

create or replace function public.marketplace_attach_checkout(
  p_hold_id uuid,
  p_checkout_session_ref text,
  p_connected_account_ref text,
  p_livemode boolean
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_hold public.marketplace_reservation_holds%rowtype;
  v_payment_id uuid;
begin
  select id into v_payment_id from public.marketplace_payments
    where hold_id = p_hold_id and checkout_session_ref = p_checkout_session_ref;
  if found then return v_payment_id; end if;
  select * into strict v_hold from public.marketplace_reservation_holds
    where id = p_hold_id and status = 'held' and expires_at > now() for update;
  update public.marketplace_reservation_holds set status = 'payment_pending' where id = p_hold_id;
  insert into public.marketplace_payments(
    hold_id, checkout_session_ref, connected_account_ref, livemode, subtotal_cents,
    platform_fee_cents, host_allocation_cents, status
  ) values (
    v_hold.id, p_checkout_session_ref, p_connected_account_ref, p_livemode, v_hold.subtotal_cents,
    v_hold.platform_fee_cents, v_hold.host_allocation_cents, 'pending'
  ) returning id into v_payment_id;
  return v_payment_id;
end;
$$;
revoke all on function public.marketplace_attach_checkout(uuid,text,text,boolean) from public, anon, authenticated;
grant execute on function public.marketplace_attach_checkout(uuid,text,text,boolean) to service_role;

create or replace function public.marketplace_confirm_checkout(
  p_event_id text,
  p_event_type text,
  p_api_version text,
  p_livemode boolean,
  p_payload_sha256 text,
  p_checkout_session_ref text,
  p_payment_intent_ref text
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_payment public.marketplace_payments%rowtype;
  v_hold public.marketplace_reservation_holds%rowtype;
  v_listing public.marketplace_listings%rowtype;
  v_booking_id uuid;
begin
  if exists (select 1 from public.marketplace_webhook_events where provider = 'stripe' and event_id = p_event_id and status = 'processed') then
    select booking_id into v_booking_id from public.marketplace_payments where checkout_session_ref = p_checkout_session_ref;
    return v_booking_id;
  end if;

  insert into public.marketplace_webhook_events(provider, event_id, event_type, api_version, livemode, payload_sha256, status, attempts)
  values ('stripe', p_event_id, p_event_type, p_api_version, p_livemode, p_payload_sha256, 'processing', 1)
  on conflict (provider, event_id) do update set
    status = 'processing', attempts = public.marketplace_webhook_events.attempts + 1, last_error = null;

  select * into strict v_payment from public.marketplace_payments where checkout_session_ref = p_checkout_session_ref for update;
  select * into strict v_hold from public.marketplace_reservation_holds where id = v_payment.hold_id for update;
  select * into strict v_listing from public.marketplace_listings where id = v_hold.listing_id;
  if v_hold.status not in ('held','payment_pending') then raise exception 'Reservation hold is not confirmable'; end if;

  insert into public.marketplace_bookings(
    listing_id, driver_id, host_id, starts_at, ends_at, currency,
    subtotal_cents, platform_fee_cents, host_payout_cents, status,
    payment_intent_ref, idempotency_key, confirmed_at
  ) values (
    v_hold.listing_id, v_hold.driver_id, v_listing.host_id, v_hold.starts_at, v_hold.ends_at, 'AUD',
    v_hold.subtotal_cents, v_hold.platform_fee_cents, v_hold.host_allocation_cents, 'confirmed',
    p_payment_intent_ref, 'stripe:' || p_checkout_session_ref, now()
  ) returning id into v_booking_id;

  update public.marketplace_reservation_holds set status = 'converted' where id = v_hold.id;
  update public.marketplace_payments set
    booking_id = v_booking_id,
    payment_intent_ref = p_payment_intent_ref,
    status = 'paid',
    raw_status = 'checkout.session.completed',
    updated_at = now()
  where id = v_payment.id;
  update public.marketplace_webhook_events set status = 'processed', processed_at = now()
    where provider = 'stripe' and event_id = p_event_id;
  insert into public.marketplace_audit_log(actor_kind, action, entity_type, entity_id, metadata)
  values ('webhook', 'booking.confirmed', 'marketplace_booking', v_booking_id::text,
    jsonb_build_object('stripe_event_id', p_event_id, 'checkout_session_ref', p_checkout_session_ref));
  return v_booking_id;
end;
$$;
revoke all on function public.marketplace_confirm_checkout(text,text,text,boolean,text,text,text) from public, anon, authenticated;
grant execute on function public.marketplace_confirm_checkout(text,text,text,boolean,text,text,text) to service_role;

create or replace function public.marketplace_refund_percent(
  p_starts_at timestamptz,
  p_cancelled_at timestamptz,
  p_host_cancelled boolean default false,
  p_verified_access_failure boolean default false
)
returns integer
language sql stable
as $$
  select case
    when p_host_cancelled or p_verified_access_failure then 100
    when p_cancelled_at >= p_starts_at then 0
    when p_starts_at - p_cancelled_at > interval '24 hours' then 100
    when p_starts_at - p_cancelled_at >= interval '6 hours' then 75
    else 50
  end;
$$;
revoke all on function public.marketplace_refund_percent(timestamptz,timestamptz,boolean,boolean) from public;
grant execute on function public.marketplace_refund_percent(timestamptz,timestamptz,boolean,boolean) to service_role;

create or replace function public.marketplace_finalize_cancellation(
  p_actor_id uuid,
  p_booking_id uuid,
  p_provider_ref text,
  p_refund_amount_cents integer,
  p_refund_percent integer,
  p_reason text
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_booking public.marketplace_bookings%rowtype;
  v_payment public.marketplace_payments%rowtype;
begin
  select * into strict v_booking from public.marketplace_bookings where id = p_booking_id for update;
  if p_actor_id not in (v_booking.driver_id, v_booking.host_id) and not exists (
    select 1 from public.marketplace_admins where user_id = p_actor_id
  ) then raise exception 'Not authorised to cancel this booking'; end if;
  if v_booking.status <> 'confirmed' then raise exception 'Booking cannot be cancelled from its current state'; end if;
  if p_refund_percent not between 0 and 100 or p_refund_amount_cents < 0 or p_refund_amount_cents > v_booking.subtotal_cents then
    raise exception 'Invalid refund amount';
  end if;
  select * into strict v_payment from public.marketplace_payments where booking_id = p_booking_id for update;

  if p_refund_amount_cents > 0 then
    if p_provider_ref is null then raise exception 'Provider refund reference is required'; end if;
    insert into public.marketplace_refunds(
      payment_id, booking_id, provider_ref, amount_cents, refund_percent,
      reason, status, initiated_by
    ) values (
      v_payment.id, p_booking_id, p_provider_ref, p_refund_amount_cents, p_refund_percent,
      p_reason, 'pending', p_actor_id
    );
  end if;
  update public.marketplace_bookings set
    status = 'cancelled',
    cancellation_reason = p_reason,
    updated_at = now()
  where id = p_booking_id;
  insert into public.marketplace_audit_log(actor_id, actor_kind, action, entity_type, entity_id, metadata)
  values (p_actor_id, case when exists (select 1 from public.marketplace_admins where user_id = p_actor_id) then 'admin' else 'user' end,
    'booking.cancelled', 'marketplace_booking', p_booking_id::text,
    jsonb_build_object('refund_percent', p_refund_percent, 'refund_amount_cents', p_refund_amount_cents, 'refund_status', case when p_refund_amount_cents > 0 then 'pending' else 'not_applicable' end, 'reason', p_reason));
end;
$$;
revoke all on function public.marketplace_finalize_cancellation(uuid,uuid,text,integer,integer,text) from public, anon, authenticated;
grant execute on function public.marketplace_finalize_cancellation(uuid,uuid,text,integer,integer,text) to service_role;

create or replace function public.marketplace_admin_review_listing(
  p_listing_id uuid,
  p_decision text,
  p_note text default null
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare v_listing public.marketplace_listings%rowtype;
begin
  if not public.is_marketplace_admin() then raise exception 'Marketplace administrator access required'; end if;
  if p_decision not in ('active','rejected','suspended') then raise exception 'Invalid moderation decision'; end if;
  select * into strict v_listing from public.marketplace_listings where id = p_listing_id for update;
  if p_decision = 'active' then
    if v_listing.pricing_zone_id is null or v_listing.policy_version_id is null or v_listing.pricing_validated_at is null then
      raise exception 'Listing has not passed server pricing validation';
    end if;
    if not exists (select 1 from public.marketplace_listing_prices where listing_id = p_listing_id) then
      raise exception 'Listing has no validated prices';
    end if;
  end if;
  update public.marketplace_listings set
    moderation_status = p_decision,
    moderation_note = nullif(trim(p_note), ''),
    published_at = case when p_decision = 'active' then coalesce(published_at, now()) else published_at end,
    updated_at = now()
  where id = p_listing_id;
  insert into public.marketplace_audit_log(actor_id, actor_kind, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'admin', 'listing.' || p_decision, 'marketplace_listing', p_listing_id::text, jsonb_build_object('note', p_note));
end;
$$;
grant execute on function public.marketplace_admin_review_listing(uuid,text,text) to authenticated;

create or replace function public.marketplace_admin_set_zone_boundary(
  p_zone_code text,
  p_geojson text,
  p_source text
)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
declare v_geometry extensions.geometry;
begin
  if not public.is_marketplace_admin() then raise exception 'Marketplace administrator access required'; end if;
  if nullif(trim(p_source), '') is null then raise exception 'Boundary source is required'; end if;
  v_geometry := extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON(p_geojson), 4326);
  if extensions.GeometryType(v_geometry) not in ('POLYGON','MULTIPOLYGON') or not extensions.ST_IsValid(v_geometry) then
    raise exception 'Boundary must be valid Polygon or MultiPolygon GeoJSON';
  end if;
  update public.marketplace_pricing_zones set
    boundary = extensions.ST_Multi(v_geometry)::extensions.geometry(MultiPolygon, 4326),
    boundary_source = trim(p_source),
    boundary_verified_at = now(),
    active = true,
    updated_at = now()
  where code = p_zone_code;
  if not found then raise exception 'Unknown pricing zone'; end if;
  insert into public.marketplace_audit_log(actor_id, actor_kind, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'admin', 'pricing_zone.boundary_updated', 'marketplace_pricing_zone', p_zone_code,
    jsonb_build_object('source', trim(p_source)));
end;
$$;
grant execute on function public.marketplace_admin_set_zone_boundary(text,text,text) to authenticated;

create or replace function public.marketplace_admin_create_policy(
  p_version_code text,
  p_commission_bps integer,
  p_minimum_subtotal_cents integer,
  p_activate boolean default false
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare v_current public.marketplace_policy_versions%rowtype; v_new_id uuid;
begin
  if not public.is_marketplace_admin() then raise exception 'Marketplace administrator access required'; end if;
  if p_commission_bps not between 0 and 10000 or p_minimum_subtotal_cents <= 0 then raise exception 'Invalid policy values'; end if;
  if nullif(trim(p_version_code), '') is null then raise exception 'Version code is required'; end if;
  select * into strict v_current from public.marketplace_policy_versions where active order by effective_from desc limit 1 for update;
  if p_activate then update public.marketplace_policy_versions set active = false, effective_until = now() where active; end if;
  insert into public.marketplace_policy_versions(
    version_code, currency, commission_bps, listing_fee_cents, driver_service_fee_cents,
    minimum_subtotal_cents, minimum_hourly_minutes, maximum_hourly_minutes,
    advance_booking_days, maximum_active_driver_bookings, enabled_periods, active
  ) values (
    trim(p_version_code), v_current.currency, p_commission_bps, v_current.listing_fee_cents, v_current.driver_service_fee_cents,
    p_minimum_subtotal_cents, v_current.minimum_hourly_minutes, v_current.maximum_hourly_minutes,
    v_current.advance_booking_days, v_current.maximum_active_driver_bookings, v_current.enabled_periods, p_activate
  ) returning id into v_new_id;
  insert into public.marketplace_pricing_bands(policy_version_id, zone_id, period, minimum_cents, maximum_cents)
    select v_new_id, zone_id, period, minimum_cents, maximum_cents from public.marketplace_pricing_bands where policy_version_id = v_current.id;
  insert into public.marketplace_space_type_policies(policy_version_id, space_type, label, description, hourly_maximum_cents, daily_maximum_cents, active)
    select v_new_id, space_type, label, description, hourly_maximum_cents, daily_maximum_cents, active from public.marketplace_space_type_policies where policy_version_id = v_current.id;
  insert into public.marketplace_audit_log(actor_id, actor_kind, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'admin', 'pricing_policy.created', 'marketplace_policy', v_new_id::text,
    jsonb_build_object('version_code', trim(p_version_code), 'commission_bps', p_commission_bps, 'active', p_activate));
  return v_new_id;
end;
$$;
grant execute on function public.marketplace_admin_create_policy(text,integer,integer,boolean) to authenticated;

create or replace function public.marketplace_admin_dashboard_metrics()
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select case when public.is_marketplace_admin() then jsonb_build_object(
    'pending_listings', (select count(*) from public.marketplace_listings where moderation_status = 'pending_review'),
    'active_listings', (select count(*) from public.marketplace_listings where moderation_status = 'active'),
    'confirmed_bookings', (select count(*) from public.marketplace_bookings where status = 'confirmed'),
    'live_gross_booking_cents', (select coalesce(sum(subtotal_cents),0) from public.marketplace_payments where livemode and status in ('paid','partially_refunded','refunded')),
    'test_gross_booking_cents', (select coalesce(sum(subtotal_cents),0) from public.marketplace_payments where not livemode and status in ('paid','partially_refunded','refunded')),
    'live_gross_commission_cents', (select coalesce(sum(platform_fee_cents),0) from public.marketplace_payments where livemode and status in ('paid','partially_refunded','refunded')),
    'live_processing_fee_cents', (select coalesce(sum(processing_fee_cents),0) from public.marketplace_payments where livemode and processing_fee_cents is not null),
    'live_refund_cents', (select coalesce(sum(r.amount_cents),0) from public.marketplace_refunds r join public.marketplace_payments p on p.id = r.payment_id where p.livemode and r.status = 'succeeded'),
    'live_host_payout_cents', (select coalesce(sum(amount_cents),0) from public.marketplace_payouts where livemode and status = 'paid'),
    'pending_refunds', (select count(*) from public.marketplace_refunds where status = 'pending'),
    'restricted_hosts', (select count(*) from public.marketplace_host_profiles where payout_status = 'restricted')
  ) else null end;
$$;
grant execute on function public.marketplace_admin_dashboard_metrics() to authenticated;

comment on table public.marketplace_pricing_zones is 'Admin-managed verified geometry. Seeded categories are inactive until boundaries are sourced and verified.';
comment on table public.marketplace_webhook_events is 'Idempotency ledger for signature-verified provider webhooks; full provider payloads are not exposed to clients.';
