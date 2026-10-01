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

-- Permanent account deletion (App Store 5.1.1(v)).
-- Apply in the Supabase SQL editor with the rest of this file.
-- The client calls rpc('delete_own_account') with the user JWT.
-- Do not put a service-role key or Apple .p8 in the app.
-- This deletes auth.users (not a ban or a deactivated flag).
-- public.profiles and public.user_entitlements cascade.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_uid uuid;
begin
  current_uid := auth.uid();
  if current_uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = current_uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

comment on function public.delete_own_account() is
  'Permanently deletes the signed-in auth user. Cascades profiles and entitlements. Not a deactivation.';
