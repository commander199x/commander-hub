-- ============================================================================
-- Commander — record which general each player used in a match.
-- Safe: adds ONE new column with an empty default. No existing data changes.
-- Run once in Supabase → SQL Editor (project xqrfagrefpjgxwdziumd).
-- ============================================================================

alter table public.matches
  add column if not exists generals jsonb not null default '{}'::jsonb;

comment on column public.matches.generals is
  'Which general each player used, e.g. {"Ace": "china_nuke", "Bob": "usa_air"}. Keys are usernames.';

-- Check: should list the new column
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'matches' and column_name = 'generals';
