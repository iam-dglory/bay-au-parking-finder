-- The view was created as SECURITY DEFINER by default, which would let any
-- caller see every tester's row regardless of the testers table's own RLS.
-- Recreate as SECURITY INVOKER (respects the querying user's own RLS), and
-- also revoke API access outright since this is meant to be queried only via
-- the Supabase SQL editor as the project owner, never through the app.
drop view if exists tester_activity;

create view tester_activity with (security_invoker = true) as
select
  t.tester_number,
  t.first_seen_at,
  t.last_seen_at,
  (select count(*) from parking_spots where created_by = t.user_id) as signs_reported,
  (select count(*) from spot_status_pings where user_id = t.user_id) as occupancy_reports,
  (select count(*) from spot_visits where user_id = t.user_id) as directions_taken
from testers t
order by t.tester_number;

revoke all on tester_activity from anon, authenticated, public;

-- Not meant to be called directly by a client; it should only ever fire as
-- this table's own insert trigger.
revoke execute on function prevent_rapid_repeat_pings() from anon, authenticated, public;;
