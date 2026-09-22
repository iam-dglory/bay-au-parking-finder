-- Real bug found via user testing: two different bootstrap-import passes
-- (Melbourne's legacy zone system and its newer Pay Stay system, and in a
-- smaller number of Brisbane cases, two genuinely separate plates surveyed
-- at the exact same point) each created their own parking_spots row at the
-- identical lat/lng. Since address_text has no distinguishing house number,
-- these looked like "the same spot showing two different things" to a user,
-- when really it should always have been one spot with two signed rules --
-- exactly what the schema already supports. This merges every exact
-- (lat, lng) duplicate group into a single surviving spot, moving all rules
-- and occupancy pings onto it before removing the redundant rows.
do $$
declare
  grp record;
  keep_id uuid;
  ids uuid[];
  i int;
begin
  for grp in
    select lat, lng, array_agg(id order by created_at) as ids
    from parking_spots
    group by lat, lng
    having count(*) > 1
  loop
    ids := grp.ids;
    keep_id := ids[1];
    for i in 2..array_length(ids, 1) loop
      update parking_rules set spot_id = keep_id where spot_id = ids[i];
      update spot_status_pings set spot_id = keep_id where spot_id = ids[i];
      update spot_visits set ref_id = keep_id where ref_id = ids[i];
      delete from parking_spots where id = ids[i];
    end loop;
  end loop;
end $$;;
