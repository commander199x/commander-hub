-- ============================================================================
-- Commander — READ-ONLY checks for recovering deleted matches and replays.
-- Nothing here changes data. Run in Supabase → SQL Editor, in project
-- xqrfagrefpjgxwdziumd, one block at a time, and send Claude the results.
-- ============================================================================

-- 1) What the admin audit log contains (action names and counts)
select action, count(*) as rows, min(created_at) as first, max(created_at) as last
from public.admin_audit_log
group by action
order by rows desc;

-- 2) The audit log's columns (so the recovery script uses the right names)
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'admin_audit_log'
order by ordinal_position;

-- 3) Five recent "delete_match" entries, in full
select *
from public.admin_audit_log
where action = 'delete_match'
order by created_at desc
limit 5;

-- 4) How many deleted matches are still missing from the matches table
select count(*) as deleted_and_still_missing
from public.admin_audit_log a
where a.action = 'delete_match'
  and not exists (
    select 1 from public.matches m
    where m.id::text = coalesce(
      to_jsonb(a)->'details'->>'match_id',
      to_jsonb(a)->'metadata'->>'match_id',
      to_jsonb(a)->'payload'->>'match_id'
    )
  );

-- 5) Is the trash table (used by Undo) installed, and what's in it?
select to_regclass('public.matches_trash') as trash_table;
-- If the line above returns "matches_trash", also run:
-- select count(*) from public.matches_trash;

-- 6) Replay files in storage that no match points to
select count(*) as orphaned_replays,
       pg_size_pretty(coalesce(sum((o.metadata->>'size')::bigint), 0)) as total_size
from storage.objects o
where o.bucket_id = 'replays'
  and not exists (
    select 1 from public.matches m
    where m.replay_url is not null and m.replay_url like '%' || o.name
  );

-- 7) The 15 oldest orphaned replay files, with upload times (used to match them to matches)
select o.name, o.created_at, (o.metadata->>'size')::bigint as bytes
from storage.objects o
where o.bucket_id = 'replays'
  and not exists (
    select 1 from public.matches m
    where m.replay_url is not null and m.replay_url like '%' || o.name
  )
order by o.created_at
limit 15;
