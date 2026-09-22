
alter table app_survey_responses
  add column trip_start text,
  add column trip_destination text,
  add column bay_helped_find_parking text,
  add column info_matched_reality text,
  add column ui_confusing text,
  add column encountered_full_bay text,
  add column would_use_again text,
  add column expected_but_missing text,
  add column what_made_you_stop text;
;
