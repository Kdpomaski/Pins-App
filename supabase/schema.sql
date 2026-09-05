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

-- Pins Pro / Bundle entitlements (stub) — shared with Pins Pets via signed-in account.
create table if not exists public.user_entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  is_pro boolean not null default false,
  plan text not null default 'none',
  product_id text,
  source_app text not null default 'pins' check (source_app in ('pins', 'pinspets', 'bundle')),
  updated_at timestamptz not null default now()
);

alter table public.user_entitlements enable row level security;

drop policy if exists "Users can read own entitlement" on public.user_entitlements;
drop policy if exists "Users can upsert own entitlement" on public.user_entitlements;
drop policy if exists "Users can update own entitlement" on public.user_entitlements;

create policy "Users can read own entitlement"
  on public.user_entitlements for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can upsert own entitlement"
  on public.user_entitlements for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own entitlement"
  on public.user_entitlements for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update on table public.user_entitlements to authenticated;
grant select on table public.user_entitlements to service_role;
