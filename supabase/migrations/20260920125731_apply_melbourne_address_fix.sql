UPDATE parking_spots
SET address_text = t.address_text
FROM temp_address_fix t
WHERE parking_spots.id = t.id;

DROP TABLE temp_address_fix;;
