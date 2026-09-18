-- Advance-reservation premium: auditable alongside the total price
alter table bookings add column reservation_fee numeric(8,2) not null default 0;

-- Parking history: the only "you parked here" signal we can honestly observe
-- is the user asking for directions, or completing a booking.
create table spot_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  kind text not null check (kind in ('free_sign', 'listing')),
  ref_id uuid not null,
  address_text text not null,
  country text,
  visited_at timestamptz not null default now()
);

create index spot_visits_user_id_idx on spot_visits(user_id);

alter table spot_visits enable row level security;

create policy "users see their own visit history" on spot_visits
  for select using (user_id = auth.uid());
create policy "users log their own visits" on spot_visits
  for insert to authenticated with check (user_id = auth.uid());
