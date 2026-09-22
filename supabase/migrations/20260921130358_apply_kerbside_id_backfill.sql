
update parking_spots ps
set kerbside_id = s.kerbside_id
from kerbside_id_staging s
where ps.id = s.id;

drop table kerbside_id_staging;
;
