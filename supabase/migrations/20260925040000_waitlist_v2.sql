-- Three form fields. Legacy rows remain readable by the owner and unmodified.
begin;
alter table public.waitlist_signups
  add column if not exists device text check (device in ('android','iphone')),
  add column if not exists drives_in_melbourne boolean,
  add column if not exists form_version integer not null default 1,
  add column if not exists consent_version text;
alter table public.waitlist_signups alter column name set default '';
alter table public.waitlist_signups add constraint waitlist_v2_required
  check (form_version <> 2 or (device is not null and drives_in_melbourne is not null
    and consent_version='2026-09-25' and length(email) between 3 and 254
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'));
create unique index if not exists waitlist_v2_unique_email
  on public.waitlist_signups (lower(trim(email))) where form_version=2;

-- Durable owner-email queue. No subscriber addresses are exposed publicly.
create table if not exists public.waitlist_notifications (
  signup_id uuid primary key references public.waitlist_signups(id) on delete cascade,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  attempts integer not null default 0,
  last_error text
);
alter table public.waitlist_notifications enable row level security;
revoke all on public.waitlist_notifications from public, anon, authenticated;
create or replace function public.enqueue_waitlist_notification()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.form_version=2 and new.email !~* '@(example\.com|example\.org|example\.net)$' then
    insert into public.waitlist_notifications(signup_id) values(new.id) on conflict do nothing;
  end if;
  return new;
end; $$;
revoke all on function public.enqueue_waitlist_notification() from public, anon, authenticated;
create trigger waitlist_signup_notification after insert on public.waitlist_signups
for each row execute function public.enqueue_waitlist_notification();
commit;
