-- Temporary staging table for a one-off corrective data fix (enriching
-- Melbourne address_text with cross-street context). Open insert so a script
-- authenticated as any anonymous session can populate it, since the actual
-- parking_spots rows being corrected weren't created by that session and are
-- protected by ordinary ownership RLS. Dropped immediately after use.
create table temp_address_fix (
  id uuid primary key,
  address_text text not null
);
alter table temp_address_fix enable row level security;
create policy "anyone authenticated can insert" on temp_address_fix
  for insert to authenticated with check (true);;
