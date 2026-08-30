-- Run this in Supabase → SQL Editor

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default now()
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);
