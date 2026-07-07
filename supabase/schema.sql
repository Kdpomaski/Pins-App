-- Pins Beta: minimal anonymous profile
-- Run this entire file in Supabase → SQL Editor → Run

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  age_range text not null check (age_range in ('18-24', '25-34', '35-44', '45-54', '55-64', '65+')),
  gender text not null check (gender in ('male', 'female', 'non-binary', 'prefer-not-to-say')),
  terms_accepted_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant select, insert, update on table public.profiles to authenticated;
grant select on table public.profiles to service_role;