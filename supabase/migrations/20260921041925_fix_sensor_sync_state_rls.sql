
alter table sensor_sync_state enable row level security;
revoke all on sensor_sync_state from anon, authenticated, public;
;
