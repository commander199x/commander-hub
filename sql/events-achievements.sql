-- ============================================================================
-- Commander — events calendar + saved achievements.
-- Safe: creates 3 new tables, a few functions and two triggers. No existing data changes.
-- Achievement checks can NEVER block a match from being logged (errors are caught).
-- Run once in Supabase → SQL Editor (project xqrfagrefpjgxwdziumd).
-- ============================================================================

-- ======================= EVENTS =======================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by text,
  title text not null check (char_length(title) between 3 and 90),
  description text check (char_length(description) <= 600),
  kind text not null default 'clan_night' check (kind in ('clan_night', 'tournament', 'stream', 'training', 'other')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  link text check (link is null or link ~ '^(/|https://)'),
  reminded_at timestamptz
);
create index if not exists events_starts_idx on public.events (starts_at);

create table if not exists public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  username text not null,
  status text not null default 'going' check (status in ('going', 'maybe')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;

drop policy if exists "events are public" on public.events;
create policy "events are public" on public.events for select to anon, authenticated using (true);
drop policy if exists "admins manage events" on public.events;
create policy "admins manage events" on public.events for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "rsvps are public" on public.event_rsvps;
create policy "rsvps are public" on public.event_rsvps for select to anon, authenticated using (true);
drop policy if exists "players rsvp as themselves" on public.event_rsvps;
create policy "players rsvp as themselves" on public.event_rsvps for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.username = event_rsvps.username and not coalesce(p.banned, false))
    and exists (select 1 from public.events e where e.id = event_id and e.starts_at > now() - interval '3 hours')
  );
drop policy if exists "players change their own rsvp" on public.event_rsvps;
create policy "players change their own rsvp" on public.event_rsvps for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "players cancel their own rsvp" on public.event_rsvps;
create policy "players cancel their own rsvp" on public.event_rsvps for delete to authenticated using (user_id = auth.uid());

-- Reminders: ping everyone who RSVP'd, about an hour before (run every 10 minutes by pg_cron)
create or replace function public.send_event_reminders()
returns int language plpgsql security definer set search_path = public as $$
declare e record; n int := 0;
begin
  for e in select * from public.events where reminded_at is null and starts_at > now() and starts_at <= now() + interval '65 minutes' loop
    insert into public.notifications (user_id, message, link, read)
    select r.user_id, '⏰ Starting soon: ' || e.title || ' — ' || to_char(e.starts_at at time zone 'UTC', 'HH24:MI') || ' UTC', '/events#' || e.id, false
    from public.event_rsvps r where r.event_id = e.id;
    update public.events set reminded_at = now() where id = e.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.send_event_reminders() from public, anon, authenticated;

-- ======================= ACHIEVEMENTS =======================
create table if not exists public.player_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  key text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, key)
);
create index if not exists player_achievements_key_idx on public.player_achievements (key);
alter table public.player_achievements enable row level security;
drop policy if exists "achievements are public" on public.player_achievements;
create policy "achievements are public" on public.player_achievements for select to anon, authenticated using (true);
-- (nobody writes directly; only the database functions below award achievements)

-- Works out which achievements a player has earned, saves new ones, optionally notifies.
create or replace function public.award_achievements(p_username text, p_notify boolean default true)
returns text[] language plpgsql security definer set search_path = public as $$
declare
  me public.profiles; games int; wins int; best int; maps int; map_master int; ffa_w int; modes_won int;
  champ boolean; tourn boolean; replay boolean; top3 boolean; factions int; gen_master int; gens int;
  has_generals boolean; earned text[] := '{}'; k text; newly text[] := '{}';
  names jsonb := '{"first_win":"First Blood","wins10":"Battle-Hardened","wins50":"War Hero","games30":"Veteran","games100":"Centurion","streak5":"Hot Streak","streak10":"Unstoppable","maps10":"Globetrotter","mapMaster":"Map Master","tournament":"Tournament Contender","top3":"High Command","replay":"Archivist","ffa_winner":"Last One Standing","all_modes":"Combined Arms","champion":"Champion","three_factions":"Three Flags","general_master":"Signature General","all_generals":"Twelve Commands"}';
begin
  select * into me from public.profiles where username = p_username;
  if me.id is null then return newly; end if;

  select count(*), count(*) filter (where p_username = any (winners)), count(distinct map) filter (where map is not null),
         count(*) filter (where mode = 'ffa' and p_username = any (winners)),
         count(distinct mode) filter (where p_username = any (winners)),
         bool_or(tournament_name is not null), bool_or(replay_url is not null),
         bool_or(tournament_name is not null and round ~* 'final' and round !~* '(semi|quarter|1/2|1/4|نصف|ربع)' and p_username = any (winners))
    into games, wins, maps, ffa_w, modes_won, tourn, replay, champ
  from public.matches where p_username = any (participants);

  select coalesce(max(c), 0) into map_master from (
    select count(*) c from public.matches where p_username = any (winners) and map is not null group by map) x;

  -- best win streak (in time order)
  select coalesce(max(c), 0) into best from (
    select count(*) c from (
      select won, sum(case when won then 0 else 1 end) over (order by created_at, id rows unbounded preceding) grp
      from (select created_at, id, (p_username = any (winners)) won from public.matches where p_username = any (participants)) m
    ) g where won group by grp) s;

  -- Team top 3 (players with 3+ team matches, by team rating)
  select coalesce(rk <= 3, false) into top3 from (
    select p.username, row_number() over (order by p.rating_team desc, p.username) rk
    from public.profiles p
    where (select count(*) from public.matches m where m.mode <> 'ffa' and p.username = any (m.participants)) >= 3
  ) r where r.username = p_username;

  -- generals (only if the generals column exists)
  has_generals := exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'matches' and column_name = 'generals');
  factions := 0; gen_master := 0; gens := 0;
  if has_generals then
    execute $q$ select count(distinct split_part(generals->>$1, '_', 1)) filter (where $1 = any (winners) and generals ? $1),
                       count(distinct generals->>$1) filter (where generals ? $1)
                from public.matches where $1 = any (participants) $q$ into factions, gens using p_username;
    execute $q$ select coalesce(max(c), 0) from (select count(*) c from public.matches
                where $1 = any (winners) and generals ? $1 group by generals->>$1) x $q$ into gen_master using p_username;
  end if;

  if wins >= 1 then earned := array_append(earned, 'first_win'); end if;
  if wins >= 10 then earned := array_append(earned, 'wins10'); end if;
  if wins >= 50 then earned := array_append(earned, 'wins50'); end if;
  if games >= 30 then earned := array_append(earned, 'games30'); end if;
  if games >= 100 then earned := array_append(earned, 'games100'); end if;
  if best >= 5 then earned := array_append(earned, 'streak5'); end if;
  if best >= 10 then earned := array_append(earned, 'streak10'); end if;
  if maps >= 10 then earned := array_append(earned, 'maps10'); end if;
  if map_master >= 10 then earned := array_append(earned, 'mapMaster'); end if;
  if coalesce(tourn, false) then earned := array_append(earned, 'tournament'); end if;
  if coalesce(top3, false) then earned := array_append(earned, 'top3'); end if;
  if coalesce(replay, false) then earned := array_append(earned, 'replay'); end if;
  if ffa_w >= 1 then earned := array_append(earned, 'ffa_winner'); end if;
  if modes_won >= 4 then earned := array_append(earned, 'all_modes'); end if;
  if coalesce(champ, false) then earned := array_append(earned, 'champion'); end if;
  if factions >= 3 then earned := array_append(earned, 'three_factions'); end if;
  if gen_master >= 10 then earned := array_append(earned, 'general_master'); end if;
  if gens >= 12 then earned := array_append(earned, 'all_generals'); end if;

  foreach k in array earned loop
    insert into public.player_achievements (user_id, username, key) values (me.id, me.username, k)
    on conflict (user_id, key) do nothing;
    if found then
      newly := newly || k;
      if p_notify then
        insert into public.notifications (user_id, message, link, read)
        values (me.id, '🏅 Achievement unlocked: ' || coalesce(names->>k, k), '/profile/' || me.username || '#achievements', false);
      end if;
    end if;
  end loop;
  return newly;
end $$;
revoke all on function public.award_achievements(text, boolean) from public, anon, authenticated;

-- After a match is logged or its generals are tagged: check every registered player in it.
-- Any error here is caught so it can never stop the match itself from being saved.
create or replace function public.matches_award_achievements()
returns trigger language plpgsql security definer set search_path = public as $$
declare p text;
begin
  begin
    foreach p in array coalesce(new.participants, '{}') loop
      perform public.award_achievements(p, true);
    end loop;
  exception when others then
    raise warning 'achievements skipped: %', sqlerrm;
  end;
  return new;
end $$;

drop trigger if exists matches_achievements_insert on public.matches;
create trigger matches_achievements_insert after insert on public.matches
  for each row execute function public.matches_award_achievements();

-- generals are often tagged after the match (Admin → Generals): check again when they change
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'matches' and column_name = 'generals') then
    execute 'drop trigger if exists matches_achievements_generals on public.matches';
    execute 'create trigger matches_achievements_generals after update of generals on public.matches
             for each row when (new.generals is distinct from old.generals) execute function public.matches_award_achievements()';
  end if;
end $$;

-- top 3 can change when ratings change
create or replace function public.profiles_award_achievements()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.rating_team is distinct from old.rating_team then
    begin
      perform public.award_achievements(new.username, true);
    exception when others then
      raise warning 'achievements skipped: %', sqlerrm;
    end;
  end if;
  return new;
end $$;
drop trigger if exists profiles_achievements_rating on public.profiles;
create trigger profiles_achievements_rating after update of rating_team on public.profiles
  for each row execute function public.profiles_award_achievements();

-- Give everyone the achievements they've ALREADY earned — quietly, without notifications
do $$ declare p record; begin
  for p in select username from public.profiles where username is not null loop
    perform public.award_achievements(p.username, false);
  end loop;
end $$;

-- ======================= REMINDER SCHEDULE (optional) =======================
-- Uses Supabase's pg_cron. If it can't be switched on, everything else still works —
-- enable "pg_cron" in Database → Extensions and run this file again.
do $$ begin
  create extension if not exists pg_cron;
  perform cron.schedule('commander-event-reminders', '*/10 * * * *', 'select public.send_event_reminders()');
exception when others then
  raise notice 'Event reminders not scheduled (pg_cron unavailable): %', sqlerrm;
end $$;

notify pgrst, 'reload schema';

-- Check: should say ok | ok | <number of achievements awarded>
select
  case when to_regclass('public.events') is not null then 'ok' else 'MISSING' end as events,
  case when to_regclass('public.player_achievements') is not null then 'ok' else 'MISSING' end as achievements,
  (select count(*) from public.player_achievements) as achievements_awarded;
