-- Ejecuta este archivo UNA vez en el SQL Editor de tu proyecto de Supabase (después de account-schema.sql). No contiene secretos.
-- Crea el podio público (nombre, marco, banner, MMR) y la revisión de fotos de perfil con panel de administrador.

-- 1) Quién es administrador: solo esta cuenta, y solo con el correo ya confirmado.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists (
  select 1 from auth.users u
  where u.id = (select auth.uid())
    and lower(u.email) = 'juanojeda@e.correosanbartolo.edu.co'
    and u.email_confirmed_at is not null
 );
$$;
-- anon también necesita poder evaluarla (las políticas de lectura la usan); para ellos siempre devuelve false.
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 2) Tarjeta pública de cada jugador (lo único que ven los demás).
create table if not exists public.public_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null default 'Jugador' check (char_length(name) between 1 and 24),
 frame text not null default 'frame-acero' check (char_length(frame) <= 32),
 banner text not null default 'banner-acero' check (char_length(banner) <= 32),
 title text check (title is null or char_length(title) <= 40),
 avatar text check (avatar is null or (avatar like 'data:image/jpeg;base64,%' and octet_length(avatar) < 60000)),
 level int not null default 1 check (level between 1 and 100000),
 mmr_1v1 int not null default 400 check (mmr_1v1 between 0 and 2400),
 mmr_2v2 int not null default 400 check (mmr_2v2 between 0 and 2400),
 mmr_3v3 int not null default 400 check (mmr_3v3 between 0 and 2400),
 played_1v1 int not null default 0 check (played_1v1 >= 0),
 played_2v2 int not null default 0 check (played_2v2 >= 0),
 played_3v3 int not null default 0 check (played_3v3 >= 0),
 hidden boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.public_profiles enable row level security;
revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to anon, authenticated;
-- El jugador NO puede tocar "avatar" ni "hidden": solo el administrador, mediante las funciones de abajo.
grant insert (id, name, frame, banner, title, level, mmr_1v1, mmr_2v2, mmr_3v3, played_1v1, played_2v2, played_3v3) on public.public_profiles to authenticated;
grant update (id, name, frame, banner, title, level, mmr_1v1, mmr_2v2, mmr_3v3, played_1v1, played_2v2, played_3v3) on public.public_profiles to authenticated;
drop policy if exists "Ver podio" on public.public_profiles;
create policy "Ver podio" on public.public_profiles for select to anon, authenticated
 using (not hidden or id = (select auth.uid()) or public.is_admin());
drop policy if exists "Crear mi tarjeta" on public.public_profiles;
create policy "Crear mi tarjeta" on public.public_profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "Editar mi tarjeta" on public.public_profiles;
create policy "Editar mi tarjeta" on public.public_profiles for update to authenticated
 using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create index if not exists public_profiles_mmr_1v1 on public.public_profiles (mmr_1v1 desc) where played_1v1 >= 10 and not hidden;
create index if not exists public_profiles_mmr_2v2 on public.public_profiles (mmr_2v2 desc) where played_2v2 >= 10 and not hidden;
create index if not exists public_profiles_mmr_3v3 on public.public_profiles (mmr_3v3 desc) where played_3v3 >= 10 and not hidden;

create or replace function public.stamp_public_profile() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists stamp_public_profile on public.public_profiles;
create trigger stamp_public_profile before update on public.public_profiles for each row execute function public.stamp_public_profile();

-- 3) Fotos en espera de aprobación (una solicitud por jugador). Nadie más que el dueño y el administrador las ve.
create table if not exists public.avatar_requests (
 user_id uuid primary key references auth.users(id) on delete cascade,
 image text not null check (image like 'data:image/jpeg;base64,%' and octet_length(image) < 60000),
 status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
 note text check (note is null or char_length(note) <= 200),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz
);
alter table public.avatar_requests enable row level security;
revoke all on public.avatar_requests from anon, authenticated;
grant select on public.avatar_requests to authenticated;
grant insert (user_id, image) on public.avatar_requests to authenticated;
grant update (user_id, image) on public.avatar_requests to authenticated;
drop policy if exists "Ver mi solicitud" on public.avatar_requests;
create policy "Ver mi solicitud" on public.avatar_requests for select to authenticated
 using ((select auth.uid()) = user_id or public.is_admin());
drop policy if exists "Enviar mi foto" on public.avatar_requests;
create policy "Enviar mi foto" on public.avatar_requests for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Reemplazar mi foto" on public.avatar_requests;
create policy "Reemplazar mi foto" on public.avatar_requests for update to authenticated
 using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Una foto nueva siempre vuelve a "pendiente".
create or replace function public.reset_avatar_request() returns trigger language plpgsql set search_path = '' as $$
begin new.status = 'pending'; new.note = null; new.reviewed_at = null; new.created_at = now(); return new; end $$;
drop trigger if exists reset_avatar_request on public.avatar_requests;
create trigger reset_avatar_request before insert or update of image on public.avatar_requests for each row execute function public.reset_avatar_request();

-- 4) Acciones del administrador.
create or replace function public.admin_review_avatar(target uuid, approve boolean, reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare img text;
begin
 if not public.is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
 select image into img from public.avatar_requests where user_id = target;
 if img is null then raise exception 'No hay solicitud para este jugador'; end if;
 if approve then
  insert into public.public_profiles (id, avatar) values (target, img)
   on conflict (id) do update set avatar = excluded.avatar, updated_at = now();
  update public.avatar_requests set status = 'approved', note = null, reviewed_at = now() where user_id = target;
 else
  update public.avatar_requests set status = 'rejected', note = left(coalesce(reason, ''), 200), reviewed_at = now() where user_id = target;
 end if;
end $$;

create or replace function public.admin_revoke_avatar(target uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
 update public.public_profiles set avatar = null, updated_at = now() where id = target;
 update public.avatar_requests set status = 'rejected', note = 'Foto retirada por el administrador', reviewed_at = now() where user_id = target;
end $$;

create or replace function public.admin_set_hidden(target uuid, hide boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
 update public.public_profiles set hidden = hide, updated_at = now() where id = target;
end $$;

-- El jugador puede quitarse su propia foto.
create or replace function public.remove_my_avatar() returns void
language plpgsql security definer set search_path = '' as $$
begin
 if (select auth.uid()) is null then raise exception 'No autorizado' using errcode = '42501'; end if;
 update public.public_profiles set avatar = null, updated_at = now() where id = (select auth.uid());
 delete from public.avatar_requests where user_id = (select auth.uid());
end $$;

revoke all on function public.admin_review_avatar(uuid, boolean, text), public.admin_revoke_avatar(uuid), public.admin_set_hidden(uuid, boolean), public.remove_my_avatar() from public, anon;
grant execute on function public.admin_review_avatar(uuid, boolean, text), public.admin_revoke_avatar(uuid), public.admin_set_hidden(uuid, boolean), public.remove_my_avatar() to authenticated;

-- Si ya habias ejecutado este archivo antes de que existieran los titulos, ejecuta SOLO estas tres lineas:
-- alter table public.public_profiles add column if not exists title text check (title is null or char_length(title) <= 40);
-- grant insert (title) on public.public_profiles to authenticated;
-- grant update (title) on public.public_profiles to authenticated;
