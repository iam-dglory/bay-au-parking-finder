-- Bay's single early-access form now records a country instead of a Melbourne
-- yes/no answer. Existing v1/v2 responses stay intact.
begin;
alter table public.waitlist_signups
  add column if not exists country_code text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'waitlist_v3_required') then
    alter table public.waitlist_signups
      add constraint waitlist_v3_required check (
        form_version <> 3 or (
          device in ('android', 'iphone')
          and country_code in ('AU', 'IN', 'US')
          and drives_in_melbourne is null
          and consent_version = '2026-09-29'
          and length(email) between 3 and 254
          and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
        )
      );
  end if;
end $$;

-- A person already on v2 must not receive a second row or notification after
-- using the new form. The public form treats a duplicate as already joined.
create unique index if not exists waitlist_v2_v3_unique_email
  on public.waitlist_signups (lower(trim(email)))
  where form_version in (2, 3);

create or replace function public.enqueue_waitlist_notification()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.form_version in (2, 3)
     and new.email !~* '@(example\.com|example\.org|example\.net)$' then
    insert into public.waitlist_notifications(signup_id)
      values (new.id) on conflict do nothing;
  end if;
  return new;
end; $$;
revoke all on function public.enqueue_waitlist_notification() from public, anon, authenticated;
commit;
