alter table parking_rules add column currency text;

-- backfill existing AU seed data with the correct currency
update parking_rules set currency = 'AUD'
where sign_type = 'PAID_METER' and currency is null
and spot_id in (select id from parking_spots where country is null or country = 'Australia');

update parking_rules set currency = 'INR'
where sign_type = 'PAID_METER' and currency is null
and spot_id in (select id from parking_spots where country = 'India');;
