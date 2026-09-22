
-- Melbourne publishes a genuinely live in-ground sensor feed (verified: ~85%
-- of its 6300+ sensors reported within the last hour) for a subset of CBD
-- bays. This is real hardware ground truth for "is a car physically here
-- right now" -- strictly better than crowdsourced pings for the bays it
-- covers, since it doesn't depend on having enough users to corroborate.
-- Matched to our spots by nearest coordinate (the two Melbourne datasets
-- use incompatible kerbside-id numbering, but their bay coordinates line
-- up to within ~2m).
create table spot_sensor_status (
  spot_id uuid primary key references parking_spots(id) on delete cascade,
  sensor_kerbside_id integer not null,
  status text not null check (status in ('present', 'unoccupied')),
  status_timestamp timestamptz not null,
  synced_at timestamptz not null default now()
);

alter table spot_sensor_status enable row level security;

create policy "sensor status is publicly readable"
  on spot_sensor_status for select
  to anon, authenticated
  using (true);

-- Written only by the sync job's service-role key, never by app clients.
revoke insert, update, delete on spot_sensor_status from anon, authenticated;
;
