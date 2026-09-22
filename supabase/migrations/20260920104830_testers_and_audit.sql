-- Gives each distinct anonymous session a friendly, stable, sequential identity
-- ("Test User 1", "Test User 2", ...) for the pilot testing phase, and a
-- server-side audit view for the operator, without collecting IP addresses or
-- any other personal data -- consistent with the published privacy policy.
create sequence if not exists tester_number_seq start 1;

create table testers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  tester_number int not null unique default nextval('tester_number_seq'),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table testers enable row level security;

create policy "users can see their own tester row" on testers
  for select to authenticated using (user_id = auth.uid());

-- Called once per app open. Creates a tester row on first visit, or just
-- bumps last_seen_at on return visits, and always returns the stable number.
create or replace function get_or_create_tester_number() returns int
language plpgsql security definer set search_path = public
as $$
declare
  result int;
  uid uuid := auth.uid();
begin
  if uid is null then
    return null;
  end if;
  update testers set last_seen_at = now() where user_id = uid returning tester_number into result;
  if result is null then
    insert into testers (user_id) values (uid) returning tester_number into result;
  end if;
  return result;
end;
$$;

grant execute on function get_or_create_tester_number() to authenticated;

-- Operator-only audit view (query via the Supabase SQL editor, not exposed to
-- the app's anon/authenticated API roles): who is actually using the pilot,
-- and how much, keyed by the same anonymous identity as everything else.
create view tester_activity as
select
  t.tester_number,
  t.first_seen_at,
  t.last_seen_at,
  (select count(*) from parking_spots where created_by = t.user_id) as signs_reported,
  (select count(*) from spot_status_pings where user_id = t.user_id) as occupancy_reports,
  (select count(*) from spot_visits where user_id = t.user_id) as directions_taken
from testers t
order by t.tester_number;;
