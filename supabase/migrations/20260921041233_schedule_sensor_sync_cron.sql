
select cron.schedule('submit-melbourne-sensor-sync', '*/15 * * * *', $$select submit_melbourne_sensor_sync();$$);
select cron.schedule('process-melbourne-sensor-sync', '* * * * *', $$select process_melbourne_sensor_sync();$$);
;
