
create table temp_sensor_staging (
  kerbside_id integer not null,
  status text not null,
  status_ts timestamptz not null,
  lat double precision not null,
  lng double precision not null
);

alter table temp_sensor_staging enable row level security;

create policy "scratch table open insert"
  on temp_sensor_staging for insert
  to authenticated
  with check (true);
;
