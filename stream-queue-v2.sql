-- ============================================================================
-- Commander — stream queue v2: choose how open seats are filled.
--   "fifo" = first come, first served (as before)
--   "fair" = players who haven't played tonight first, then a weighted random draw
--            (every round you're passed over = one more ticket)
-- + host can add a player by name.  The winner still always keeps their seat.
-- Safe: adds one column and replaces the queue functions. Needs sql/stream-queue.sql first.
-- ============================================================================

alter table public.stream_queue add column if not exists skips int not null default 0;

-- default seat order stays first come, first served until the host switches it
update public.site_settings set value = value || '{"mode": "fifo"}'::jsonb
where key = 'stream' and not (value ? 'mode');

-- Seat players from the queue, using the mode the host picked; ping each new player
create or replace function public.stream_take_from_queue(how_many int)
returns text[] language plpgsql security definer set search_path = public as $$
declare r record; taken text[] := '{}'; next_seat int; mode text;
begin
  if how_many <= 0 then return taken; end if;
  select coalesce(value->>'mode', 'fifo') into mode from public.site_settings where key = 'stream';
  select coalesce(max(seat), 0) into next_seat from public.stream_lobby;
  for r in
    select q.user_id, q.username from public.stream_queue q
    where not exists (select 1 from public.stream_lobby l where l.user_id = q.user_id)
    order by
      -- fair draw: fewest games played in the last 12 hours first …
      case when mode = 'fair' then (select count(*) from public.stream_games g
                                    where g.created_at > now() - interval '12 hours' and q.username = any (g.ranking)) else 0 end,
      -- … then a weighted random draw: 1 ticket + 1 per round already passed over
      case when mode = 'fair' then power(random(), 1.0 / (1 + q.skips)) else 0 end desc,
      -- first come, first served (also the tie-breaker)
      q.joined_at, q.username
    limit how_many
  loop
    next_seat := next_seat + 1;
    insert into public.stream_lobby (user_id, username, seat, games) values (r.user_id, r.username, next_seat, 0);
    delete from public.stream_queue where user_id = r.user_id;
    insert into public.notifications (user_id, message, link, read)
    values (r.user_id, '🎮 You''re up! Your seat in the stream lobby is ready — join now', '/live', false);
    taken := taken || r.username;
  end loop;
  -- everyone still waiting after a draw earns one more ticket
  if cardinality(taken) > 0 then
    update public.stream_queue set skips = skips + 1
    where not exists (select 1 from public.stream_lobby l where l.user_id = stream_queue.user_id);
  end if;
  return taken;
end $$;
revoke all on function public.stream_take_from_queue(int) from public, anon, authenticated;

-- Host: put a registered player in the queue by name (for viewers who ask in chat)
create or replace function public.stream_add(p_username text)
returns text language plpgsql security definer set search_path = public as $$
declare p public.profiles;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then raise exception 'Admins only.'; end if;
  select * into p from public.profiles where lower(username) = lower(trim(p_username));
  if p.id is null then raise exception 'No player called "%" — they need a free Commander account first.', trim(p_username); end if;
  if coalesce(p.banned, false) then raise exception '% is banned.', p.username; end if;
  if exists (select 1 from public.stream_lobby where user_id = p.id) then raise exception '% is already in the lobby.', p.username; end if;
  insert into public.stream_queue (user_id, username) values (p.id, p.username) on conflict (user_id) do nothing;
  insert into public.notifications (user_id, message, link, read)
  values (p.id, '📺 The host added you to the stream queue — you''ll be notified when it''s your turn', '/live', false);
  return p.username;
end $$;
revoke all on function public.stream_add(text) from public;
grant execute on function public.stream_add(text) to authenticated;

notify pgrst, 'reload schema';

-- Check: should say ok | ok
select
  case when exists (select 1 from information_schema.columns where table_name = 'stream_queue' and column_name = 'skips') then 'ok' else 'MISSING' end as tickets,
  case when exists (select 1 from pg_proc where proname = 'stream_add') then 'ok' else 'MISSING' end as host_add;
