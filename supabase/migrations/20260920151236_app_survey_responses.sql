
-- A separate, deliberately unauthenticated survey table -- reachable via a
-- standalone shareable link (no app sign-in / GPS gate), for a broader
-- one-time review rather than the quick in-app feedback box. Respondents
-- can optionally self-report their tester number to let us cross-reference
-- with tester_activity, but nothing else identifying is collected.
create table app_survey_responses (
  id uuid primary key default gen_random_uuid(),
  tester_number_claimed text,
  overall_rating smallint not null check (overall_rating between 1 and 5),
  ease_of_finding_parking smallint check (ease_of_finding_parking between 1 and 5),
  accuracy_rating smallint check (accuracy_rating between 1 and 5),
  location_detection_rating smallint check (location_detection_rating between 1 and 5),
  occupancy_feature_rating smallint check (occupancy_feature_rating between 1 and 5),
  guide_helpfulness_rating smallint check (guide_helpfulness_rating between 1 and 5),
  recommend_rating smallint check (recommend_rating between 1 and 5),
  most_useful_feature text,
  most_confusing_part text,
  bugs_encountered text,
  missing_features text,
  additional_comments text,
  created_at timestamptz not null default now()
);

alter table app_survey_responses enable row level security;

create policy "anyone can submit a survey response"
  on app_survey_responses for insert
  to anon, authenticated
  with check (true);

revoke select, update, delete on app_survey_responses from anon, authenticated, public;
;
