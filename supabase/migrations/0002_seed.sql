-- Seed demo parking spots across Sydney, Melbourne, Brisbane CBDs
-- created_by uses a fixed system uuid since this runs outside a user session

with s as (
  insert into parking_spots (lat, lng, address_text, suburb, state, created_by)
  values (-33.8688, 151.2093, '483 George St', 'Sydney', 'NSW', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, max_stay_minutes, days_active, time_from, time_to, price_per_hour, notes, created_by)
select id, 'TIME_LIMITED', 120, '{1,2,3,4,5}', '08:30', '18:00', null, '2P MON-FRI 8:30AM-6PM', '00000000-0000-0000-0000-000000000000' from s;

with s as (
  insert into parking_spots (lat, lng, address_text, suburb, state, created_by)
  values (-33.8712, 151.2046, '210 Clarence St', 'Sydney', 'NSW', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, max_stay_minutes, days_active, time_from, time_to, price_per_hour, notes, created_by)
select id, 'PAID_METER', null, '{0,1,2,3,4,5,6}', '00:00', '23:59', 6.50, 'Ticket parking, all days', '00000000-0000-0000-0000-000000000000' from s;

with s as (
  insert into parking_spots (lat, lng, address_text, suburb, state, created_by)
  values (-33.8650, 151.2094, '77 Castlereagh St', 'Sydney', 'NSW', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, max_stay_minutes, days_active, time_from, time_to, price_per_hour, notes, created_by)
select id, 'FREE_UNLIMITED', null, '{0,1,2,3,4,5,6}', '00:00', '23:59', null, 'Free parking, no time limit', '00000000-0000-0000-0000-000000000000' from s;

with s as (
  insert into parking_spots (lat, lng, address_text, suburb, state, created_by)
  values (-33.8830, 151.2001, '15 Foveaux St', 'Surry Hills', 'NSW', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, max_stay_minutes, days_active, time_from, time_to, price_per_hour, notes, created_by)
select id, 'TIME_LIMITED', 60, '{1,2,3,4,5,6}', '07:30', '19:00', null, '1P MON-SAT 7:30AM-7PM', '00000000-0000-0000-0000-000000000000' from s;

with s as (
  insert into parking_spots (lat, lng, address_text, suburb, state, created_by)
  values (-33.8721, 151.2073, '1 Market St', 'Sydney', 'NSW', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, max_stay_minutes, days_active, time_from, time_to, price_per_hour, notes, created_by)
select id, 'NO_STOPPING_CLEARWAY', null, '{1,2,3,4,5}', '16:00', '19:00', null, 'Clearway MON-FRI 4PM-7PM, unrestricted otherwise', '00000000-0000-0000-0000-000000000000' from s;

with s as (
  insert into parking_spots (lat, lng, address_text, suburb, state, created_by)
  values (-33.8795, 151.2159, '5 Yurong St', 'Darlinghurst', 'NSW', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, max_stay_minutes, days_active, time_from, time_to, price_per_hour, notes, created_by)
select id, 'PERMIT_ONLY', null, '{0,1,2,3,4,5,6}', '00:00', '23:59', null, 'Resident permit holders only, area 12', '00000000-0000-0000-0000-000000000000' from s;

with s as (
  insert into parking_spots (lat, lng, address_text, suburb, state, created_by)
  values (-33.8688, 151.2013, '99 Kent St', 'Sydney', 'NSW', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, max_stay_minutes, days_active, time_from, time_to, price_per_hour, notes, created_by)
select id, 'TIME_LIMITED', 240, '{1,2,3,4,5}', '08:00', '18:00', null, '4P MON-FRI 8AM-6PM', '00000000-0000-0000-0000-000000000000' from s;

with s as (
  insert into parking_spots (lat, lng, address_text, suburb, state, created_by)
  values (-33.8568, 151.2153, '20 Mrs Macquaries Rd', 'Sydney', 'NSW', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, max_stay_minutes, days_active, time_from, time_to, price_per_hour, notes, created_by)
select id, 'LOADING_ZONE', 30, '{1,2,3,4,5}', '06:00', '10:00', null, 'Loading zone MON-FRI 6-10AM, unrestricted otherwise', '00000000-0000-0000-0000-000000000000' from s;

-- Melbourne CBD
with s as (
  insert into parking_spots (lat, lng, address_text, suburb, state, created_by)
  values (-37.8136, 144.9631, '250 Collins St', 'Melbourne', 'VIC', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, max_stay_minutes, days_active, time_from, time_to, price_per_hour, notes, created_by)
select id, 'TIME_LIMITED', 120, '{1,2,3,4,5}', '07:30', '18:30', null, '2P MON-FRI 7:30AM-6:30PM', '00000000-0000-0000-0000-000000000000' from s;

with s as (
  insert into parking_spots (lat, lng, address_text, suburb, state, created_by)
  values (-37.8102, 144.9628, '100 Bourke St', 'Melbourne', 'VIC', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, max_stay_minutes, days_active, time_from, time_to, price_per_hour, notes, created_by)
select id, 'PAID_METER', null, '{0,1,2,3,4,5,6}', '00:00', '23:59', 7.00, 'Ticket parking, all days', '00000000-0000-0000-0000-000000000000' from s;

with s as (
  insert into parking_spots (lat, lng, address_text, suburb, state, created_by)
  values (-37.8226, 144.9548, '30 Southbank Blvd', 'Southbank', 'VIC', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, max_stay_minutes, days_active, time_from, time_to, price_per_hour, notes, created_by)
select id, 'FREE_UNLIMITED', null, '{0,1,2,3,4,5,6}', '00:00', '23:59', null, 'Free parking, no time limit', '00000000-0000-0000-0000-000000000000' from s;

with s as (
  insert into parking_spots (lat, lng, address_text, suburb, state, created_by)
  values (-37.8076, 144.9605, '88 Queen St', 'Melbourne', 'VIC', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, max_stay_minutes, days_active, time_from, time_to, price_per_hour, notes, created_by)
select id, 'TIME_LIMITED', 60, '{1,2,3,4,5,6}', '08:00', '19:00', null, '1P MON-SAT 8AM-7PM', '00000000-0000-0000-0000-000000000000' from s;

with s as (
  insert into parking_spots (lat, lng, address_text, suburb, state, created_by)
  values (-37.8180, 144.9690, '10 Wellington Pde', 'East Melbourne', 'VIC', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, max_stay_minutes, days_active, time_from, time_to, price_per_hour, notes, created_by)
select id, 'PERMIT_ONLY', null, '{0,1,2,3,4,5,6}', '00:00', '23:59', null, 'Resident permit holders only, area 3', '00000000-0000-0000-0000-000000000000' from s;

-- Brisbane CBD
with s as (
  insert into parking_spots (lat, lng, address_text, suburb, state, created_by)
  values (-27.4698, 153.0251, '150 Queen St', 'Brisbane City', 'QLD', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, max_stay_minutes, days_active, time_from, time_to, price_per_hour, notes, created_by)
select id, 'TIME_LIMITED', 120, '{1,2,3,4,5}', '08:00', '17:00', null, '2P MON-FRI 8AM-5PM', '00000000-0000-0000-0000-000000000000' from s;

with s as (
  insert into parking_spots (lat, lng, address_text, suburb, state, created_by)
  values (-27.4705, 153.0286, '40 Edward St', 'Brisbane City', 'QLD', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, max_stay_minutes, days_active, time_from, time_to, price_per_hour, notes, created_by)
select id, 'PAID_METER', null, '{0,1,2,3,4,5,6}', '00:00', '23:59', 5.50, 'Ticket parking, all days', '00000000-0000-0000-0000-000000000000' from s;

with s as (
  insert into parking_spots (lat, lng, address_text, suburb, state, created_by)
  values (-27.4809, 153.0176, '20 Grey St', 'South Brisbane', 'QLD', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, max_stay_minutes, days_active, time_from, time_to, price_per_hour, notes, created_by)
select id, 'FREE_UNLIMITED', null, '{0,1,2,3,4,5,6}', '00:00', '23:59', null, 'Free parking, no time limit', '00000000-0000-0000-0000-000000000000' from s;

with s as (
  insert into parking_spots (lat, lng, address_text, suburb, state, created_by)
  values (-27.4650, 153.0280, '5 Ann St', 'Fortitude Valley', 'QLD', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, max_stay_minutes, days_active, time_from, time_to, price_per_hour, notes, created_by)
select id, 'NO_STOPPING_CLEARWAY', null, '{1,2,3,4,5}', '15:30', '19:00', null, 'Clearway MON-FRI 3:30PM-7PM, unrestricted otherwise', '00000000-0000-0000-0000-000000000000' from s;

with s as (
  insert into parking_spots (lat, lng, address_text, suburb, state, created_by)
  values (-27.4735, 153.0220, '60 Roma St', 'Brisbane City', 'QLD', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, max_stay_minutes, days_active, time_from, time_to, price_per_hour, notes, created_by)
select id, 'TIME_LIMITED', 240, '{1,2,3,4,5,6}', '07:00', '18:00', null, '4P MON-SAT 7AM-6PM', '00000000-0000-0000-0000-000000000000' from s;
