-- Stops a single anonymous session from flooding the same spot with repeat
-- occupied/free reports. Combined with the GPS-proximity check (client-side,
-- needs live device location) and "unconfirmed until corroborated" display
-- (client-side, needs the viewer's own judgement), this is the server-side
-- backstop: even a determined spammer can only affect one spot once every
-- 5 minutes per session, and would need a fresh anonymous session (and to
-- physically be there) to try again sooner.
create or replace function prevent_rapid_repeat_pings() returns trigger as $$
begin
  if exists (
    select 1 from spot_status_pings
    where spot_id = new.spot_id and user_id = new.user_id
      and created_at > now() - interval '5 minutes'
  ) then
    raise exception 'You already reported on this spot recently. Try again in a few minutes.';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger spot_status_pings_rate_limit
before insert on spot_status_pings
for each row execute function prevent_rapid_repeat_pings();;
