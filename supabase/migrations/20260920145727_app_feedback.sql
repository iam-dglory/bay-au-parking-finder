
create table app_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  rating smallint check (rating between 1 and 5),
  message text not null,
  page_context text,
  created_at timestamptz not null default now()
);

alter table app_feedback enable row level security;

create policy "users can submit feedback"
  on app_feedback for insert
  to authenticated
  with check (user_id = auth.uid());

-- Operator-only read (via the SQL editor / service role), same pattern as
-- testers/tester_activity -- feedback shouldn't be readable by other users.
create view feedback_with_tester
  with (security_invoker = true) as
  select
    f.id,
    t.tester_number,
    f.rating,
    f.message,
    f.page_context,
    f.created_at
  from app_feedback f
  left join testers t on t.user_id = f.user_id
  order by f.created_at desc;

revoke all on feedback_with_tester from anon, authenticated, public;
;
