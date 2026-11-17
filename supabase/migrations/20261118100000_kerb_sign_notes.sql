-- Drivers can tell us what the kerb sign says on street blocks the council
-- publishes no rules for. Notes start 'pending'; an operator approves or
-- rejects them (Supabase table editor: set status and reviewed_at). Approved
-- notes are shown on that block's card through approved_kerb_sign_notes(),
-- which never exposes who wrote them.
create table if not exists public.kerb_sign_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  block text not null check (length(block) between 3 and 200),
  sign_text text not null check (length(btrim(sign_text)) between 2 and 200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- One open note per driver per block, so a single person can't flood a block.
create unique index if not exists kerb_sign_notes_one_pending
  on public.kerb_sign_notes (user_id, block) where status = 'pending';
create index if not exists kerb_sign_notes_review_idx on public.kerb_sign_notes (status, created_at);

alter table public.kerb_sign_notes enable row level security;

create policy "drivers submit kerb sign notes"
  on public.kerb_sign_notes for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and reviewed_at is null);

create policy "drivers see their own kerb sign notes"
  on public.kerb_sign_notes for select to authenticated
  using (user_id = auth.uid());

create or replace function public.approved_kerb_sign_notes()
returns table (block text, sign_text text, reviewed_at timestamptz)
language sql stable security definer set search_path = public as $$
  select distinct on (n.block) n.block, n.sign_text, n.reviewed_at
  from public.kerb_sign_notes n
  where n.status = 'approved'
  order by n.block, n.reviewed_at desc nulls last
$$;

revoke all on function public.approved_kerb_sign_notes() from public;
grant execute on function public.approved_kerb_sign_notes() to anon, authenticated;
