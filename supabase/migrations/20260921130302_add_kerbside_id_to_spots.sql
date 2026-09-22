
-- The council's own reference number for a bay, where published. Likely
-- (not confirmed) the same number physically marked on the kerb/pavement
-- for Pay Stay bays -- only covers the subset of Melbourne's own dataset
-- that has it (~17% of mapped bays), not a universal feature.
alter table parking_spots add column kerbside_id text;

create table kerbside_id_staging (
  id uuid not null,
  kerbside_id text not null
);
alter table kerbside_id_staging enable row level security;
create policy "staging insert" on kerbside_id_staging for insert to authenticated with check (true);
;
