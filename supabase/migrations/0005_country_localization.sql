-- Country-aware sign reporting: track detected/selected country per spot,
-- and add a sign type for regions (e.g. India) where street parking is
-- mostly informal/tolerated rather than formally signed.
alter table parking_spots add column country text;

alter type sign_type add value 'INFORMAL_TOLERATED';
