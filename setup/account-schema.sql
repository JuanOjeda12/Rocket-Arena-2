-- Run once in YOUR Supabase project's SQL Editor. Contains no secrets.
create table if not exists public.player_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and octet_length(data::text) < 100000),
 updated_at timestamptz not null default now()
);
alter table public.player_profiles enable row level security;
revoke all on public.player_profiles from anon;
grant select, insert, update on public.player_profiles to authenticated;
drop policy if exists "Read own profile" on public.player_profiles;
create policy "Read own profile" on public.player_profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "Create own profile" on public.player_profiles;
create policy "Create own profile" on public.player_profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "Update own profile" on public.player_profiles;
create policy "Update own profile" on public.player_profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create or replace function public.stamp_player_profile() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists stamp_player_profile on public.player_profiles;
create trigger stamp_player_profile before update on public.player_profiles for each row execute function public.stamp_player_profile();
