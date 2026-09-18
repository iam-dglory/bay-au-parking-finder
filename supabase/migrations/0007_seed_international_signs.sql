-- Demo signs showing the localized vocabulary in action
with s as (
  insert into parking_spots (lat, lng, address_text, country, created_by)
  values (19.076, 72.8777, 'Linking Road, near market', 'India', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, days_active, notes, created_by)
select id, 'INFORMAL_TOLERATED', '{0,1,2,3,4,5,6}', 'No sign, but everyone parks here — attendant sometimes asks for ₹20', '00000000-0000-0000-0000-000000000000' from s;

with s as (
  insert into parking_spots (lat, lng, address_text, country, created_by)
  values (19.0821, 72.8416, 'S V Road, Bandra', 'India', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, days_active, price_per_hour, notes, created_by)
select id, 'PAID_METER', '{0,1,2,3,4,5,6}', 30, 'Municipal Pay & Park, attendant collects cash', '00000000-0000-0000-0000-000000000000' from s;

with s as (
  insert into parking_spots (lat, lng, address_text, country, created_by)
  values (51.5074, -0.1278, 'Baker Street', 'United Kingdom', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, days_active, time_from, time_to, notes, created_by)
select id, 'NO_STOPPING_CLEARWAY', '{1,2,3,4,5}', '08:30', '18:30', 'Single yellow line, MON-FRI 8:30am-6:30pm', '00000000-0000-0000-0000-000000000000' from s;

with s as (
  insert into parking_spots (lat, lng, address_text, country, created_by)
  values (40.7128, -74.006, 'Canal St', 'United States', '00000000-0000-0000-0000-000000000000')
  returning id
)
insert into parking_rules (spot_id, sign_type, days_active, time_from, time_to, notes, created_by)
select id, 'NO_STOPPING_CLEARWAY', '{2}', '08:00', '10:00', 'No parking Tue 8-10am — street cleaning', '00000000-0000-0000-0000-000000000000' from s;
