-- Privacy-minimised launch analytics and moderated parking-information reports.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null check (event_name in (
    'first_open','parking_search','parking_result_view','directions_open',
    'restriction_view','marketplace_view','listing_started','listing_submitted',
    'booking_started','booking_confirmed','feedback_submitted'
  )),
  properties jsonb not null default '{}'::jsonb,
  source_key text unique,
  created_at timestamptz not null default now(),
  constraint analytics_properties_object check (jsonb_typeof(properties) = 'object'),
  constraint analytics_properties_size check (octet_length(properties::text) <= 2048)
);
create index if not exists analytics_events_name_created_idx on public.analytics_events(event_name, created_at desc);
create index if not exists analytics_events_user_created_idx on public.analytics_events(user_id, created_at desc);
create unique index if not exists analytics_first_open_user_uidx on public.analytics_events(user_id) where event_name = 'first_open';
alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from public, anon, authenticated;

create or replace function public.record_analytics_event(p_event_name text, p_properties jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_event_name not in ('first_open','parking_search','parking_result_view','directions_open','restriction_view','marketplace_view','listing_started','listing_submitted','booking_started','feedback_submitted') then
    raise exception 'Unsupported client event';
  end if;
  if jsonb_typeof(coalesce(p_properties, '{}'::jsonb)) <> 'object' or octet_length(coalesce(p_properties, '{}'::jsonb)::text) > 2048 then
    raise exception 'Invalid event properties';
  end if;
  if (select count(*) from public.analytics_events where user_id = v_user and created_at > now() - interval '1 minute') >= 60 then
    return;
  end if;
  insert into public.analytics_events(user_id, event_name, properties)
  values (v_user, p_event_name, coalesce(p_properties, '{}'::jsonb))
  on conflict do nothing;
end; $$;
revoke all on function public.record_analytics_event(text,jsonb) from public, anon;
grant execute on function public.record_analytics_event(text,jsonb) to authenticated;

create table if not exists public.parking_information_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('incorrect_location','incorrect_restriction','outdated_information','incorrect_price','missing_location','map_navigation_problem','other')),
  location_kind text not null check (location_kind in ('spot','area','missing')),
  location_identifier text not null,
  location_label text not null,
  description text,
  screenshot_path text,
  status text not null default 'new' check (status in ('new','reviewing','verified','rejected','resolved')),
  duplicate_of uuid references public.parking_information_reports(id),
  review_notes text,
  reviewed_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_description_size check (description is null or length(description) <= 1000),
  constraint report_label_size check (length(location_label) <= 240)
);
create index if not exists parking_reports_review_idx on public.parking_information_reports(status, created_at);
create index if not exists parking_reports_location_idx on public.parking_information_reports(location_kind, location_identifier, category, created_at desc);
alter table public.parking_information_reports enable row level security;
create policy "reporters see their own parking reports" on public.parking_information_reports for select to authenticated using (reporter_id = auth.uid());
revoke insert, update, delete on public.parking_information_reports from public, anon, authenticated;
grant select on public.parking_information_reports to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('parking-report-screenshots','parking-report-screenshots',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false, file_size_limit=5242880, allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy "users upload their own parking report screenshots" on storage.objects for insert to authenticated
  with check (bucket_id='parking-report-screenshots' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "users remove their own unsubmitted report screenshots" on storage.objects for delete to authenticated
  using (bucket_id='parking-report-screenshots' and (storage.foldername(name))[1]=auth.uid()::text);

create or replace function public.submit_parking_information_report(
  p_category text, p_location_kind text, p_location_identifier text,
  p_location_label text, p_description text default null, p_screenshot_path text default null
) returns uuid language plpgsql security definer set search_path = public, storage as $$
declare v_user uuid := auth.uid(); v_existing uuid; v_id uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_category not in ('incorrect_location','incorrect_restriction','outdated_information','incorrect_price','missing_location','map_navigation_problem','other') then raise exception 'Invalid report category'; end if;
  if p_location_kind not in ('spot','area','missing') then raise exception 'Invalid location kind'; end if;
  if length(trim(p_location_identifier)) not between 1 and 200 or length(trim(p_location_label)) not between 1 and 240 then raise exception 'Invalid location reference'; end if;
  if p_description is not null and length(p_description) > 1000 then raise exception 'Description is too long'; end if;
  if p_screenshot_path is not null and split_part(p_screenshot_path,'/',1) <> v_user::text then raise exception 'Invalid screenshot path'; end if;
  if (select count(*) from public.parking_information_reports where reporter_id=v_user and created_at > now()-interval '1 hour') >= 10 then raise exception 'Too many reports. Please try again later.'; end if;
  select id into v_existing from public.parking_information_reports
    where reporter_id=v_user and location_kind=p_location_kind and location_identifier=trim(p_location_identifier)
      and category=p_category and status in ('new','reviewing','verified') and created_at > now()-interval '24 hours'
    order by created_at desc limit 1;
  if v_existing is not null then return v_existing; end if;
  insert into public.parking_information_reports(reporter_id,category,location_kind,location_identifier,location_label,description,screenshot_path)
  values(v_user,p_category,p_location_kind,trim(p_location_identifier),trim(p_location_label),nullif(trim(coalesce(p_description,'')),''),p_screenshot_path)
  returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.submit_parking_information_report(text,text,text,text,text,text) from public, anon;
grant execute on function public.submit_parking_information_report(text,text,text,text,text,text) to authenticated;

create or replace view public.launch_analytics_daily with (security_invoker=true) as
select created_at::date as day, event_name, count(*) as events, count(distinct user_id) as users
from public.analytics_events group by 1,2 order by 1 desc,2;
revoke all on public.launch_analytics_daily from public, anon, authenticated;
