-- Runs the waitlist-notify Edge Function every 5 minutes.
-- BEFORE applying: deploy the function and set its secrets (see
-- supabase/functions/waitlist-notify/index.ts), then store the same
-- CRON_SECRET in Vault:
--   select vault.create_secret('<CRON_SECRET>', 'waitlist_notify_cron_secret');
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select cron.unschedule('waitlist-notify') where exists (select 1 from cron.job where jobname = 'waitlist-notify');
select cron.schedule('waitlist-notify', '*/5 * * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/waitlist-notify',
    headers := jsonb_build_object('authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'waitlist_notify_cron_secret'))
  );
$$);
