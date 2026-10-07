-- ============================================================================
-- Commander — link each challenge to its result report (match lifecycle).
-- Challenged → Accepted → Reported → Confirmed → Approved (challenge = Completed)
-- + automatic notifications at every step.
-- Safe: adds one column, one index, two triggers, and widens one rule. No data is deleted.
-- Needs sql/play.sql and sql/match-submissions.sql to have been run first.
-- ============================================================================

-- 1) Reports can point at the challenge they came from
alter table public.match_submissions
  add column if not exists challenge_id uuid references public.challenges(id) on delete set null;

-- only ONE open report per challenge (a rejected one can be replaced)
create unique index if not exists match_submissions_one_per_challenge
  on public.match_submissions (challenge_id)
  where challenge_id is not null and status <> 'rejected';

-- 2) Challenges can be "completed" once their result is approved
alter table public.challenges drop constraint if exists challenges_status_check;
alter table public.challenges add constraint challenges_status_check
  check (status in ('pending', 'accepted', 'declined', 'cancelled', 'completed'));

-- 3) Reporting rule: same as before, plus — if a challenge is linked — you must be one of its
--    two players and it must be accepted.
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
    and (
      challenge_id is null
      or exists (select 1 from public.challenges c
                 where c.id = challenge_id and c.status = 'accepted' and auth.uid() in (c.from_user, c.to_user))
    )
  );

-- 4) Notifications for every step (written by the database, so players never need write access)
create or replace function public.notify_report_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare my_side text[];
begin
  my_side := case when new.submitter_username = any (new.winners) then new.winners
                  else array(select x from unnest(new.participants) x where not (x = any (new.winners))) end;
  insert into public.notifications (user_id, message, link, read)
  select p.id, '📋 ' || new.submitter_username || ' reported your ' || upper(new.mode) || ' result — confirm it', '/report', false
  from public.profiles p
  where p.username = any (new.participants)
    and p.username <> new.submitter_username
    and (new.mode = 'ffa' or not (p.username = any (my_side)));
  return new;
end $$;

drop trigger if exists match_submissions_notify_insert on public.match_submissions;
create trigger match_submissions_notify_insert after insert on public.match_submissions
  for each row execute function public.notify_report_created();

create or replace function public.notify_report_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare reporter uuid;
begin
  if new.status is not distinct from old.status then return new; end if;
  reporter := new.submitted_by;
  if new.status = 'confirmed' then
    insert into public.notifications (user_id, message, link, read)
    values (reporter, '🛡️ ' || coalesce(new.confirmed_by, 'Your opponent') || ' confirmed your ' || upper(new.mode) || ' report — waiting for an admin', '/report', false);
  elsif new.status = 'disputed' then
    insert into public.notifications (user_id, message, link, read)
    values (reporter, '⚠️ ' || coalesce(new.confirmed_by, 'Your opponent') || ' disputed your ' || upper(new.mode) || ' report — an admin will decide', '/report', false);
  elsif new.status = 'rejected' then
    insert into public.notifications (user_id, message, link, read)
    values (reporter, '❌ Your ' || upper(new.mode) || ' report was rejected' || coalesce(': ' || nullif(new.dispute_reason, ''), ''), '/report', false);
  elsif new.status = 'approved' and new.challenge_id is not null then
    -- result is on the ladder: the challenge is done (players already get their rating notifications)
    update public.challenges set status = 'completed' where id = new.challenge_id and status = 'accepted';
  end if;
  return new;
end $$;

drop trigger if exists match_submissions_notify_update on public.match_submissions;
create trigger match_submissions_notify_update after update of status on public.match_submissions
  for each row execute function public.notify_report_status();

-- Make the website notice the changes right away
notify pgrst, 'reload schema';

-- Check: should say ok | ok | ok
select
  case when exists (select 1 from information_schema.columns where table_name = 'match_submissions' and column_name = 'challenge_id') then 'ok' else 'MISSING' end as challenge_link,
  case when exists (select 1 from pg_trigger where tgname = 'match_submissions_notify_insert') then 'ok' else 'MISSING' end as notify_on_report,
  case when exists (select 1 from pg_trigger where tgname = 'match_submissions_notify_update') then 'ok' else 'MISSING' end as notify_on_status;
