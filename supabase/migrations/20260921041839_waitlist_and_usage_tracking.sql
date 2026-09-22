
-- Play Store early-access waitlist, collected from the standalone landing
-- page. Unauthenticated by design (same pattern as app_survey_responses) --
-- this is meant to be filled out by people who haven't opened the app yet.
create table waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  suburb text,
  drive_frequency text,
  created_at timestamptz not null default now()
);

alter table waitlist_signups enable row level security;

create policy "anyone can join the waitlist"
  on waitlist_signups for insert
  to anon, authenticated
  with check (true);

revoke select, update, delete on waitlist_signups from anon, authenticated, public;

-- Lightweight usage instrumentation: one row per real "find parking near me"
-- search that actually returned results, so "are people actually using
-- Bay" has a real number behind it instead of only survey impressions.
create table search_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  lat double precision not null,
  lng double precision not null,
  radius_m integer not null,
  result_count integer not null,
  created_at timestamptz not null default now()
);

alter table search_events enable row level security;

create policy "users can log their own searches"
  on search_events for insert
  to authenticated
  with check (user_id = auth.uid());

revoke select, update, delete on search_events from anon, authenticated, public;

-- A single at-a-glance view for the "simple dashboard" -- queryable the same
-- way as tester_activity, no separate tooling needed.
create view pilot_dashboard
  with (security_invoker = true) as
select
  (select count(*) from testers) as test_users,
  (select count(*) from search_events) as actual_searches,
  (select count(distinct user_id) from search_events) as users_who_searched,
  (select count(*) from app_survey_responses) as survey_responses,
  (select count(*) from app_feedback) as quick_feedback_notes,
  (select count(*) from waitlist_signups) as waitlist_signups,
  (select count(*) from testers t where exists (
    select 1 from search_events se where se.user_id = t.user_id
    and se.created_at::date <> (select min(created_at)::date from search_events se2 where se2.user_id = t.user_id)
  )) as repeat_users,
  (select count(*) from parking_spots where moderation_status = 'approved') as approved_signs;

revoke all on pilot_dashboard from anon, authenticated, public;
;
