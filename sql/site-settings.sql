-- ============================================================================
-- Commander — small site-wide settings (used for the TikTok "we're live" switch).
-- Safe: creates ONE new table. Everyone can read it; only admins can change it.
-- Run once in Supabase → SQL Editor (project xqrfagrefpjgxwdziumd).
-- ============================================================================

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.site_settings enable row level security;

drop policy if exists "site settings are public" on public.site_settings;
create policy "site settings are public" on public.site_settings
  for select to anon, authenticated using (true);

drop policy if exists "admins change site settings" on public.site_settings;
create policy "admins change site settings" on public.site_settings
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

insert into public.site_settings (key, value) values ('live', '{"live": false}'::jsonb)
on conflict (key) do nothing;

-- Check
select key, value from public.site_settings;
