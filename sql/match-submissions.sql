-- ============================================================================
-- Commander — players report their own match results.
-- Flow: a player reports → a player from the OTHER side confirms → an admin approves
--       (approving logs the match with the normal rating maths).
-- Safe: creates ONE new table + 2 functions. Nothing existing is changed.
-- Run once in Supabase → SQL Editor (project xqrfagrefpjgxwdziumd).
-- ============================================================================

create table if not exists public.match_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  submitted_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  submitter_username text not null,
  mode text not null check (mode in ('2v2', '3v3', '4v4', 'ffa')),
  participants text[] not null check (cardinality(participants) between 2 and 8),
  winners text[] not null check (cardinality(winners) >= 1),
  map text,
  notes text check (char_length(notes) <= 500),
  replay_url text,
  generals jsonb not null default '{}'::jsonb,
  match_date date not null default current_date,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'disputed', 'approved', 'rejected')),
  confirmed_by text,
  confirmed_at timestamptz,
  dispute_reason text,
  reviewed_by text,
  reviewed_at timestamptz,
  match_id text
);

create index if not exists match_submissions_status_idx on public.match_submissions (status, created_at desc);

alter table public.match_submissions enable row level security;

-- Counts a player's waiting reports. Runs with the table owner's rights so the insert rule
-- below doesn't look up its own table (which PostgreSQL rejects as "infinite recursion").
create or replace function public.pending_submission_count(p_user uuid)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int from public.match_submissions where submitted_by = p_user and status = 'pending'
$$;
revoke all on function public.pending_submission_count(uuid) from public;
grant execute on function public.pending_submission_count(uuid) to authenticated;

-- Signed-in players can see reports (needed so opponents can confirm them)
drop policy if exists "submissions readable by signed-in players" on public.match_submissions;
create policy "submissions readable by signed-in players" on public.match_submissions
  for select to authenticated using (true);

-- A player may only report a match they played in, as themselves, as "pending",
-- while not banned, with at most 5 reports waiting at a time.
drop policy if exists "players report their own matches" on public.match_submissions;
create policy "players report their own matches" on public.match_submissions
  for insert to authenticated
  with check (
    submitted_by = auth.uid()
    and status = 'pending'
    and confirmed_by is null and reviewed_by is null and match_id is null
    and winners <@ participants
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.username = submitter_username
        and p.username = any (participants)
        and not coalesce(p.banned, false)
    )
    and public.pending_submission_count(auth.uid()) < 5
  );

-- Only admins edit or delete reports directly (approve / reject)
drop policy if exists "admins manage submissions" on public.match_submissions;
create policy "admins manage submissions" on public.match_submissions
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Opponent confirms: only a player from the other side (any other player in FFA), never the reporter.
create or replace function public.confirm_submission(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me text; s public.match_submissions;
begin
  select username into me from public.profiles where id = auth.uid();
  if me is null then raise exception 'You need to be signed in.'; end if;
  select * into s from public.match_submissions where id = p_id for update;
  if not found then raise exception 'Report not found.'; end if;
  if s.status <> 'pending' then raise exception 'This report was already handled.'; end if;
  if s.submitted_by = auth.uid() then raise exception 'You can''t confirm your own report.'; end if;
  if not (me = any (s.participants)) then raise exception 'Only players in this match can confirm it.'; end if;
  if s.mode <> 'ffa' and ((me = any (s.winners)) = (s.submitter_username = any (s.winners))) then
    raise exception 'A player from the other team has to confirm.';
  end if;
  update public.match_submissions set status = 'confirmed', confirmed_by = me, confirmed_at = now() where id = p_id;
end $$;

-- Opponent disputes the reported result (an admin then decides).
create or replace function public.dispute_submission(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare me text; s public.match_submissions;
begin
  select username into me from public.profiles where id = auth.uid();
  if me is null then raise exception 'You need to be signed in.'; end if;
  select * into s from public.match_submissions where id = p_id for update;
  if not found then raise exception 'Report not found.'; end if;
  if s.status <> 'pending' then raise exception 'This report was already handled.'; end if;
  if s.submitted_by = auth.uid() or not (me = any (s.participants)) then raise exception 'Only the other players in this match can dispute it.'; end if;
  update public.match_submissions set status = 'disputed', confirmed_by = me, confirmed_at = now(), dispute_reason = left(coalesce(p_reason, ''), 300) where id = p_id;
end $$;

revoke all on function public.confirm_submission(uuid) from public;
revoke all on function public.dispute_submission(uuid, text) from public;
grant execute on function public.confirm_submission(uuid) to authenticated;
grant execute on function public.dispute_submission(uuid, text) to authenticated;

-- Check: should list the new table
select count(*) as submissions from public.match_submissions;
