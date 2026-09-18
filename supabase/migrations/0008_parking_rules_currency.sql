-- A paid sign's price needs a currency too — was hardcoded to $ before, wrong
-- for e.g. an INR-priced Pay & Park sign in India.
alter table parking_rules add column currency text;

update parking_rules set currency = 'AUD'
where sign_type = 'PAID_METER' and currency is null
and spot_id in (select id from parking_spots where country is null or country = 'Australia');

update parking_rules set currency = 'INR'
where sign_type = 'PAID_METER' and currency is null
and spot_id in (select id from parking_spots where country = 'India');
