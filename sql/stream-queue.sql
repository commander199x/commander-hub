-- ============================================================================
-- Commander — livestream FFA queue ("winner stays, queue rotates in").
-- After each game: the winner keeps their seat; if N players wait, the bottom N leave
-- and the first N in the queue join (max seats-1 newcomers). Fair: first come, first served.
-- Safe: creates 3 new tables + 4 functions. Needs sql/site-settings.sql to have been run.
-- ============================================================================

create table if not exists public.stream_queue (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  username text not null,
  joined_at timestamptz not null default now()
);
create table if not exists public.stream_lobby (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  seat int not null,
  games int not null default 0,
  joined_at timestamptz not null default now()
);
create table if not exists public.stream_games (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  ranking text[] not null,
  stayed text[] not null default '{}',
  joined text[] not null default '{}',
  removed text[] not null default '{}'
);

-- Settings: open/closed, seats, and whether players who lose their seat re-join the queue
insert into public.site_settings (key, value) values ('stream', '{"open": false, "size": 7, "requeue": true}'::jsonb)
on conflict (key) do nothing;

alter table public.stream_queue enable row level security;
alter table public.stream_lobby enable row level security;
alter table public.stream_games enable row level security;

-- Everyone (even viewers who aren't signed in) can see the lobby, queue and history
drop policy if exists "stream queue is public" on public.stream_queue;
create policy "stream queue is public" on public.stream_queue for select to anon, authenticated using (true);
drop policy if exists "stream lobby is public" on public.stream_lobby;
create policy "stream lobby is public" on public.stream_lobby for select to anon, authenticated using (true);
drop policy if exists "stream games are public" on public.stream_games;
create policy "stream games are public" on public.stream_games for select to anon, authenticated using (true);

-- Players join the queue as themselves, once, while it's open, if not banned and not already seated
drop policy if exists "players join the stream queue" on public.stream_queue;
create policy "players join the stream queue" on public.stream_queue
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.username = stream_queue.username and not coalesce(p.banned, false))
    and not exists (select 1 from public.stream_lobby l where l.user_id = auth.uid())
    and coalesce((select (s.value->>'open')::boolean from public.site_settings s where s.key = 'stream'), false)
  );

-- Players can leave the queue; admins can remove anyone
drop policy if exists "players leave the stream queue" on public.stream_queue;
create policy "players leave the stream queue" on public.stream_queue
  for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Only admins change the lobby directly (normally through the functions below)
drop policy if exists "admins manage the stream lobby" on public.stream_lobby;
create policy "admins manage the stream lobby" on public.stream_lobby
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Internal: seat the first `how_many` players from the queue (oldest first) and ping them
create or replace function public.stream_take_from_queue(how_many int)
returns text[] language plpgsql security definer set search_path = public as $$
declare r record; taken text[] := '{}'; next_seat int;
begin
  if how_many <= 0 then return taken; end if;
  select coalesce(max(seat), 0) into next_seat from public.stream_lobby;
  for r in
    select q.user_id, q.username from public.stream_queue q
    where not exists (select 1 from public.stream_lobby l where l.user_id = q.user_id)
    order by q.joined_at, q.username
    limit how_many
  loop
    next_seat := next_seat + 1;
    insert into public.stream_lobby (user_id, username, seat, games) values (r.user_id, r.username, next_seat, 0);
    delete from public.stream_queue where user_id = r.user_id;
    insert into public.notifications (user_id, message, link, read)
    values (r.user_id, '🎮 You''re up! Your seat in the stream lobby is ready — join now', '/live', false);
    taken := taken || r.username;
  end loop;
  return taken;
end $$;
revoke all on function public.stream_take_from_queue(int) from public, anon, authenticated;

-- Admin: fill empty seats from the queue (start of stream, or after a no-show)
create or replace function public.stream_fill()
returns jsonb language plpgsql security definer set search_path = public as $$
declare cfg jsonb; seats int; free int; taken text[];
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then raise exception 'Admins only.'; end if;
  lock table public.stream_lobby in exclusive mode;
  select value into cfg from public.site_settings where key = 'stream';
  seats := least(greatest(coalesce((cfg->>'size')::int, 7), 2), 8);
  free := seats - (select count(*) from public.stream_lobby);
  taken := public.stream_take_from_queue(free);
  return jsonb_build_object('joined', to_jsonb(taken));
end $$;

-- Admin: game over. p_ranking = every lobby player in finishing order (1st first).
create or replace function public.stream_next_round(p_ranking text[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  cfg jsonb; seats int; requeue boolean; lobby text[]; waiting int; newcomers int;
  keep_count int; keep text[]; removed text[]; joined text[]; i int; out_user uuid;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then raise exception 'Admins only.'; end if;
  lock table public.stream_lobby in exclusive mode;
  select value into cfg from public.site_settings where key = 'stream';
  seats := least(greatest(coalesce((cfg->>'size')::int, 7), 2), 8);
  requeue := coalesce((cfg->>'requeue')::boolean, true);

  select array_agg(username order by seat) into lobby from public.stream_lobby;
  if lobby is null then raise exception 'The lobby is empty — fill it from the queue first.'; end if;
  if cardinality(p_ranking) <> cardinality(lobby)
     or (select count(distinct x) from unnest(p_ranking) x) <> cardinality(p_ranking)
     or not (p_ranking <@ lobby) then
    raise exception 'The finishing order must list every lobby player exactly once.';
  end if;

  -- the winner always stays; N waiting players replace the bottom N (max seats - 1)
  select count(*) into waiting from public.stream_queue q where not exists (select 1 from public.stream_lobby l where l.user_id = q.user_id);
  newcomers := least(waiting, seats - 1);
  keep_count := greatest(1, least(cardinality(p_ranking), seats - newcomers));
  keep := p_ranking[1:keep_count];
  removed := coalesce(p_ranking[keep_count + 1:cardinality(p_ranking)], '{}');

  -- remove the players who lost their seat
  delete from public.stream_lobby where username = any (removed);
  -- re-seat the stayers in finishing order (winner = seat 1) and count their games
  for i in 1 .. cardinality(keep) loop
    update public.stream_lobby set seat = i, games = games + 1 where username = keep[i];
  end loop;
  -- bring in the queue (oldest first) to fill every free seat
  joined := public.stream_take_from_queue(seats - cardinality(keep));
  -- AFTER filling, the players who left go to the back of the queue (so nobody skips the line)
  if requeue then
    for i in 1 .. coalesce(cardinality(removed), 0) loop
      select id into out_user from public.profiles where username = removed[i];
      if out_user is not null then
        insert into public.stream_queue (user_id, username, joined_at) values (out_user, removed[i], clock_timestamp())
        on conflict (user_id) do nothing;
      end if;
    end loop;
  end if;

  insert into public.stream_games (ranking, stayed, joined, removed) values (p_ranking, keep, joined, removed);
  return jsonb_build_object('stayed', to_jsonb(keep), 'joined', to_jsonb(joined), 'removed', to_jsonb(removed), 'requeued', requeue);
end $$;

-- Admin: remove a player from the lobby (no-show / left) and give the seat to the next in line
create or replace function public.stream_remove(p_username text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare taken text[];
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then raise exception 'Admins only.'; end if;
  lock table public.stream_lobby in exclusive mode;
  delete from public.stream_lobby where username = p_username;
  -- close the gap in seat numbers
  update public.stream_lobby l set seat = s.n from (select user_id, row_number() over (order by seat) as n from public.stream_lobby) s where s.user_id = l.user_id;
  taken := public.stream_take_from_queue(1);
  return jsonb_build_object('joined', to_jsonb(taken));
end $$;

revoke all on function public.stream_fill() from public;
revoke all on function public.stream_next_round(text[]) from public;
revoke all on function public.stream_remove(text) from public;
grant execute on function public.stream_fill() to authenticated;
grant execute on function public.stream_next_round(text[]) to authenticated;
grant execute on function public.stream_remove(text) to authenticated;

notify pgrst, 'reload schema';

-- Check: should say ok | ok | ok
select
  case when to_regclass('public.stream_queue') is not null then 'ok' else 'MISSING' end as queue,
  case when to_regclass('public.stream_lobby') is not null then 'ok' else 'MISSING' end as lobby,
  case when exists (select 1 from pg_proc where proname = 'stream_next_round') then 'ok' else 'MISSING' end as rotation;
