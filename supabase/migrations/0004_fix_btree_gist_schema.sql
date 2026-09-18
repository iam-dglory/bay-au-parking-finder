-- Move btree_gist out of the public schema per Supabase security advisor
alter table bookings drop constraint bookings_listing_id_tstzrange_excl;
drop extension btree_gist;
create extension btree_gist with schema extensions;
alter table bookings add constraint bookings_listing_id_tstzrange_excl
  exclude using gist (
    listing_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status = 'confirmed');
