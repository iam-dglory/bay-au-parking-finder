
-- Melbourne's own published Pay Stay open-data feed omits a Monday row for
-- ~99% of zones (verified against the source: only 10 of 6270 rows have
-- day_of_week=1, vs ~1075 each for Tue-Sat) even though every zone checked
-- charges the identical rate Tue-Sat. Our import faithfully reflected that
-- gap, which meant the app told drivers parking was free on Monday when it
-- is almost certainly paid same as the rest of the week. Extend each
-- Tuesday-inclusive Pay Stay rule to also cover Monday, matching the
-- uniform weekday rate every checked zone already shares.
update parking_rules r
set days_active = array_prepend(1, r.days_active)
from parking_spots s
where s.id = r.spot_id
  and s.state = 'VIC'
  and r.sign_type = 'PAID_METER'
  and 2 = any(r.days_active)
  and not (1 = any(r.days_active));
;
