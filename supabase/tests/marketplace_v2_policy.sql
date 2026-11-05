-- Run after applying migrations to a disposable/staging database:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/marketplace_v2_policy.sql
-- This test is read-only and fails via assertions if launch policy drifted.

begin;

do $$
declare
  v_policy public.marketplace_policy_versions%rowtype;
  v_count integer;
begin
  select * into strict v_policy from public.marketplace_policy_versions where active;
  assert v_policy.commission_bps = 500, 'Expected 5% launch commission';
  assert v_policy.minimum_subtotal_cents = 500, 'Expected A$5 minimum subtotal';
  assert v_policy.minimum_hourly_minutes = 120, 'Expected 2-hour minimum';
  assert v_policy.maximum_hourly_minutes = 1440, 'Expected 24-hour maximum';
  assert v_policy.advance_booking_days = 90, 'Expected 90-day booking window';
  assert v_policy.maximum_active_driver_bookings = 5, 'Expected five active driver bookings';
  assert not ('year' = any(v_policy.enabled_periods)), 'Yearly pricing must remain disabled';

  select count(*) into v_count from public.marketplace_pricing_bands where policy_version_id = v_policy.id;
  assert v_count = 32, 'Expected 8 zones x 4 duration bands';
  select count(*) into v_count from public.marketplace_space_type_policies where policy_version_id = v_policy.id and active;
  assert v_count = 6, 'Expected six active space types';
  select count(*) into v_count from public.marketplace_pricing_zones where active and boundary is null;
  assert v_count = 0, 'An active zone must never have missing geometry';

  assert public.marketplace_refund_percent(now() + interval '25 hours', now()) = 100;
  assert public.marketplace_refund_percent(now() + interval '24 hours', now()) = 75;
  assert public.marketplace_refund_percent(now() + interval '6 hours', now()) = 75;
  assert public.marketplace_refund_percent(now() + interval '5 hours', now()) = 50;
  assert public.marketplace_refund_percent(now() - interval '1 minute', now()) = 0;
  assert public.marketplace_refund_percent(now() - interval '1 minute', now(), true, false) = 100;
end;
$$;

rollback;
