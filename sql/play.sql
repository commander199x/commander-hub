-- ============================================================================
-- Commander — Find a game: challenges, "ready to play" and phone push sign-ups.
-- Safe: creates 3 new tables + 4 functions. Nothing existing is changed.
-- Run once in Supabase → SQL Editor (project xqrfagrefpjgxwdziumd).
-- ============================================================================

-- 1) Challenges between two players --------------------------------------------
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  from_user uuid not null references auth.users(id) on delete cascade,
  from_username text not null,
  to_user uuid not null references auth.users(id) on delete cascade,
  to_username text not null,
  mode text not null check (mode in ('1v1', '2v2', '3v3', '4v4', 'ffa')),
  message text check (char_length(message) <= 200),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  responded_at timestamptz,
  expires_at timestamptz not null default now() + interval '24 hours'
);
create index if not exists challenges_to_idx on public.challenges (to_user, status, created_at desc);
create index if not exists challenges_from_idx on public.challenges (from_user, status, created_at desc);
alter table public.challenges enable row level security;

-- Only the two players involved can see a challenge. All changes go through the functions below.
drop policy if exists "players see their own challenges" on public.challenges;
create policy "players see their own challenges" on public.challenges
  for select to authenticated using (from_user = auth.uid() or to_user = auth.uid());

-- 2) "Ready to play" list -------------------------------------------------------
create table if not exists public.ready_players (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  username text not null,
  modes text[] not null default '{}' check (modes <@ array['1v1', '2v2', '3v3', '4v4', 'ffa']),
  note text check (char_length(note) <= 120),
  until timestamptz not null,
  updated_at timestamptz not null default now()
);
alter table public.ready_players enable row level security;

drop policy if exists "ready list is public" on public.ready_players;
create policy "ready list is public" on public.ready_players for select to anon, authenticated using (true);

drop policy if exists "players manage their own ready status" on public.ready_players;
create policy "players manage their own ready status" on public.ready_players
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and until <= now() + interval '3 hours'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.username = ready_players.username and not coalesce(p.banned, false))
  );

-- 3) Phone push sign-ups (one row per phone/browser) ---------------------------
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  p256dh text,
  auth text,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;

drop policy if exists "players manage their own push sign-ups" on public.push_subscriptions;
create policy "players manage their own push sign-ups" on public.push_subscriptions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 4) Functions ------------------------------------------------------------------
-- Send a challenge and drop it into the other player's notification bell.
create or replace function public.send_challenge(p_to text, p_mode text, p_message text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare me public.profiles; them public.profiles; new_id uuid;
begin
  select * into me from public.profiles where id = auth.uid();
  if me.id is null then raise exception 'You need to be signed in.'; end if;
  if coalesce(me.banned, false) then raise exception 'Banned accounts can''t send challenges.'; end if;
  select * into them from public.profiles where lower(username) = lower(trim(p_to));
  if them.id is null then raise exception 'Player not found.'; end if;
  if them.id = me.id then raise exception 'You can''t challenge yourself.'; end if;
  if coalesce(them.banned, false) then raise exception 'This player can''t receive challenges.'; end if;
  if p_mode not in ('1v1', '2v2', '3v3', '4v4', 'ffa') then raise exception 'Unknown mode.'; end if;
  if exists (select 1 from public.challenges where from_user = me.id and to_user = them.id and status = 'pending' and expires_at > now()) then
    raise exception 'You already have a challenge waiting with this player.';
  end if;
  if (select count(*) from public.challenges where from_user = me.id and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Too many challenges — try again in a little while.';
  end if;

  insert into public.challenges (from_user, from_username, to_user, to_username, mode, message)
  values (me.id, me.username, them.id, them.username, p_mode, nullif(left(trim(coalesce(p_message, '')), 200), ''))
  returning id into new_id;

  insert into public.notifications (user_id, message, link, read)
  values (them.id, '⚔️ ' || me.username || ' challenged you to a ' || upper(p_mode) || ' match!', '/play', false);
  return new_id;
end $$;

-- Accept or decline a challenge sent to you (the challenger gets a notification).
create or replace function public.respond_challenge(p_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare c public.challenges;
begin
  select * into c from public.challenges where id = p_id for update;
  if c.id is null or c.to_user <> auth.uid() then raise exception 'Challenge not found.'; end if;
  if c.status <> 'pending' or c.expires_at <= now() then raise exception 'This challenge is no longer open.'; end if;
  update public.challenges set status = case when p_accept then 'accepted' else 'declined' end, responded_at = now() where id = p_id;
  insert into public.notifications (user_id, message, link, read)
  values (c.from_user,
          case when p_accept then '✅ ' || c.to_username || ' accepted your ' || upper(c.mode) || ' challenge — time to play!'
               else '❌ ' || c.to_username || ' declined your ' || upper(c.mode) || ' challenge.' end,
          '/play', false);
end $$;

-- Cancel a challenge you sent.
create or replace function public.cancel_challenge(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.challenges set status = 'cancelled', responded_at = now()
  where id = p_id and from_user = auth.uid() and status = 'pending';
  if not found then raise exception 'Challenge not found.'; end if;
end $$;

-- Phone push targets for a challenge that was JUST sent or answered (last 5 minutes),
-- only for the other player, and only if you are part of that challenge.
create or replace function public.challenge_push_targets(p_id uuid)
returns table (endpoint text) language sql stable security definer set search_path = public as $$
  select s.endpoint from public.challenges c
  join public.push_subscriptions s on s.user_id = case when c.from_user = auth.uid() then c.to_user else c.from_user end
  where c.id = p_id
    and auth.uid() in (c.from_user, c.to_user)
    and coalesce(c.responded_at, c.created_at) > now() - interval '5 minutes'
$$;

revoke all on function public.send_challenge(text, text, text) from public;
revoke all on function public.respond_challenge(uuid, boolean) from public;
revoke all on function public.cancel_challenge(uuid) from public;
revoke all on function public.challenge_push_targets(uuid) from public;
grant execute on function public.send_challenge(text, text, text) to authenticated;
grant execute on function public.respond_challenge(uuid, boolean) to authenticated;
grant execute on function public.cancel_challenge(uuid) to authenticated;
grant execute on function public.challenge_push_targets(uuid) to authenticated;

-- Check
select (select count(*) from public.challenges) as challenges, (select count(*) from public.ready_players) as ready, (select count(*) from public.push_subscriptions) as push;
