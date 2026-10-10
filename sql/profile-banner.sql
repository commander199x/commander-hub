-- ============================================================================
-- Commander — profile cover banners.
-- Adds the banner image + which part of it to show (top / center / bottom).
-- Safe: adds two columns to profiles. Players already edit their own profile,
-- so no new permissions are needed. Banners must be stored in the site's own
-- storage (the "avatars" bucket) — links to other websites are refused.
-- ============================================================================

alter table public.profiles add column if not exists banner_url text;
alter table public.profiles add column if not exists banner_position text not null default 'center';

alter table public.profiles drop constraint if exists profiles_banner_position_check;
alter table public.profiles add constraint profiles_banner_position_check
  check (banner_position in ('top', 'center', 'bottom'));

alter table public.profiles drop constraint if exists profiles_banner_url_check;
alter table public.profiles add constraint profiles_banner_url_check
  check (banner_url is null or banner_url like '%/storage/v1/object/public/avatars/%');

notify pgrst, 'reload schema';

-- Check: should say ok | ok
select
  case when exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'banner_url') then 'ok' else 'MISSING' end as banner,
  case when exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'banner_position') then 'ok' else 'MISSING' end as position;
