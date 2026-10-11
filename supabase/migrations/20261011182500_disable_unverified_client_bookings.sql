-- Direct client inserts previously created "confirmed" marketplace bookings
-- without an operator acceptance, a payment, or a deposit. Bay has no live
-- operator or payment integration yet, so clients must not create bookings.
drop policy if exists "drivers create bookings" on public.bookings;
drop policy if exists "driver or owner can update booking status" on public.bookings;
revoke insert, update, delete on public.bookings from anon, authenticated;

comment on table public.bookings is
  'Reserved for server-side operator-confirmed bookings. Client writes stay disabled until payment, provider availability, idempotency and webhook verification are implemented.';
