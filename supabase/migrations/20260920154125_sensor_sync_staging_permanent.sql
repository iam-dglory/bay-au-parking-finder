
-- Permanent staging table for the recurring sensor sync (see
-- scripts/sync_melbourne_sensors.py). Truncated and refilled on every run
-- rather than dropped, so the sync doesn't need migration privileges each
-- time -- just insert (via the public anon key) and the operator-run join.
create table sensor_sync_staging (
  kerbside_id integer not null,
  status text not null,
  status_ts timestamptz not null,
  last_confirmed_at timestamptz not null,
  lat double precision not null,
  lng double precision not null
);

alter table sensor_sync_staging enable row level security;

create policy "sync can insert"
  on sensor_sync_staging for insert
  to authenticated
  with check (true);

-- No public select/update/delete -- only the operator (via execute_sql,
-- which bypasses RLS) truncates and reads it between runs.
;
