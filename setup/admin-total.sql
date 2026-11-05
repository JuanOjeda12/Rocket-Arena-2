-- ============ ROCKET ARENA: panel admin completo, historial de partidas y presencia en línea ============
-- Ejecuta este archivo UNA vez en el SQL Editor de Supabase (después de account-schema.sql y perfiles-publicos.sql). Se puede repetir sin problema.
-- Requiere que perfiles-publicos.sql ya esté ejecutado (usa public.is_admin() y public.public_profiles).

-- 0) Título de la ficha en el podio
alter table public.public_profiles add column if not exists title text check (title is null or char_length(title) <= 40);
grant insert (title) on public.public_profiles to authenticated;
grant update (title) on public.public_profiles to authenticated;

-- 1) Perfil privado de cada jugador: el administrador puede leerlo y editarlo todo
alter table public.player_profiles add column if not exists admin_rev int not null default 0;
revoke insert, update on public.player_profiles from authenticated;
grant insert (id, data) on public.player_profiles to authenticated;
grant update (id, data) on public.player_profiles to authenticated;
drop policy if exists "Admin ve todos los perfiles" on public.player_profiles;
create policy "Admin ve todos los perfiles" on public.player_profiles for select to authenticated using (public.is_admin());

-- 2) Presencia: última vez visto, si está en línea y qué partido juega (para ver y editar el marcador en vivo)
create table if not exists public.player_presence (
 user_id uuid primary key references auth.users(id) on delete cascade,
 last_seen timestamptz not null default now(),
 status text not null default 'menu' check (status in ('menu', 'playing')),
 live jsonb check (live is null or octet_length(live::text) < 4000)
);
alter table public.player_presence enable row level security;
revoke all on public.player_presence from anon, authenticated;
grant select on public.player_presence to authenticated;
grant insert (user_id, status, live) on public.player_presence to authenticated;
grant update (user_id, status, live) on public.player_presence to authenticated;
drop policy if exists "Ver presencia" on public.player_presence;
create policy "Ver presencia" on public.player_presence for select to authenticated using ((select auth.uid()) = user_id or public.is_admin());
drop policy if exists "Crear mi presencia" on public.player_presence;
create policy "Crear mi presencia" on public.player_presence for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Actualizar mi presencia" on public.player_presence;
create policy "Actualizar mi presencia" on public.player_presence for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create or replace function public.stamp_presence() returns trigger language plpgsql set search_path = '' as $$
begin new.last_seen = now(); return new; end $$;
drop trigger if exists stamp_presence on public.player_presence;
create trigger stamp_presence before insert or update on public.player_presence for each row execute function public.stamp_presence();

-- 3) Historial de partidas de cada jugador
create table if not exists public.match_history (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 client_id text not null check (char_length(client_id) <= 100),
 played_at timestamptz not null default now(),
 mode text not null check (char_length(mode) <= 20),
 playlist text not null default '' check (char_length(playlist) <= 8),
 result text not null check (result in ('win', 'loss', 'draw')),
 score_for int not null default 0 check (score_for between 0 and 999),
 score_against int not null default 0 check (score_against between 0 and 999),
 seconds int not null default 0 check (seconds between 0 and 86400),
 goals int not null default 0, assists int not null default 0, saves int not null default 0, shots int not null default 0,
 mmr_delta int,
 forfeit boolean not null default false,
 unique (user_id, client_id)
);
create index if not exists match_history_user on public.match_history (user_id, played_at desc);
alter table public.match_history enable row level security;
revoke all on public.match_history from anon, authenticated;
grant select on public.match_history to authenticated;
grant insert (id, user_id, client_id, played_at, mode, playlist, result, score_for, score_against, seconds, goals, assists, saves, shots, mmr_delta, forfeit) on public.match_history to authenticated;
grant update (id, user_id, client_id, played_at, mode, playlist, result, score_for, score_against, seconds, goals, assists, saves, shots, mmr_delta, forfeit) on public.match_history to authenticated;
drop policy if exists "Ver historial" on public.match_history;
create policy "Ver historial" on public.match_history for select to authenticated using ((select auth.uid()) = user_id or public.is_admin());
drop policy if exists "Guardar mi partida" on public.match_history;
create policy "Guardar mi partida" on public.match_history for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Corregir mi partida" on public.match_history;
create policy "Corregir mi partida" on public.match_history for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 4) Órdenes del administrador a un jugador en vivo (cambiar marcador o tiempo)
create table if not exists public.admin_commands (
 id bigserial primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check (kind in ('set-score', 'set-time')),
 payload jsonb not null default '{}'::jsonb check (octet_length(payload::text) < 1000),
 created_at timestamptz not null default now(),
 done boolean not null default false
);
create index if not exists admin_commands_pending on public.admin_commands (user_id) where not done;
alter table public.admin_commands enable row level security;
revoke all on public.admin_commands from anon, authenticated;
grant select on public.admin_commands to authenticated;
drop policy if exists "Ver mis ordenes" on public.admin_commands;
create policy "Ver mis ordenes" on public.admin_commands for select to authenticated using ((select auth.uid()) = user_id or public.is_admin());

create or replace function public.admin_send_command(target uuid, k text, p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
 insert into public.admin_commands (user_id, kind, payload) values (target, k, coalesce(p, '{}'::jsonb));
 delete from public.admin_commands where done and created_at < now() - interval '2 days';
end $$;

create or replace function public.ack_command(cid bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
 update public.admin_commands set done = true where id = cid and user_id = (select auth.uid());
end $$;

-- 5) Funciones del panel admin
-- Lista de todos los jugadores con correo, última conexión y si están en línea
create or replace function public.admin_list_players() returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
 return coalesce((select jsonb_agg(to_jsonb(r) order by r.last_seen desc nulls last, r.created_at desc) from (
  select u.id, u.email, u.created_at, u.last_sign_in_at,
   pp.name, pp.frame, pp.banner, pp.title, pp.level, pp.hidden, (pp.avatar is not null) as has_avatar,
   pp.mmr_1v1, pp.mmr_2v2, pp.mmr_3v3, pp.played_1v1, pp.played_2v2, pp.played_3v3,
   pr.last_seen, pr.status, pr.live, coalesce(pr.last_seen > now() - interval '75 seconds', false) as online
  from auth.users u
  left join public.public_profiles pp on pp.id = u.id
  left join public.player_presence pr on pr.user_id = u.id
  order by pr.last_seen desc nulls last, u.created_at desc limit 1000) r), '[]'::jsonb);
end $$;

-- Toda la información de un jugador: datos privados, tarjeta pública, presencia e historial
create or replace function public.admin_get_player(target uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare res jsonb;
begin
 if not public.is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
 select jsonb_build_object(
  'id', u.id, 'email', u.email, 'created_at', u.created_at, 'last_sign_in_at', u.last_sign_in_at,
  'data', coalesce((select data from public.player_profiles where id = u.id), '{}'::jsonb),
  'admin_rev', coalesce((select admin_rev from public.player_profiles where id = u.id), 0),
  'public', (select to_jsonb(p) from public.public_profiles p where p.id = u.id),
  'presence', (select to_jsonb(r) || jsonb_build_object('online', r.last_seen > now() - interval '75 seconds') from public.player_presence r where r.user_id = u.id),
  'history', coalesce((select jsonb_agg(to_jsonb(h) order by h.played_at desc) from (select * from public.match_history where user_id = u.id order by played_at desc limit 100) h), '[]'::jsonb)
 ) into res from auth.users u where u.id = target;
 return res;
end $$;

-- Guarda TODO lo que el administrador editó (datos privados + tarjeta pública + foto)
create or replace function public.admin_save_player(target uuid, new_data jsonb, pub jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare av text;
begin
 if not public.is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
 if not exists (select 1 from auth.users where id = target) then raise exception 'El jugador no existe'; end if;
 insert into public.player_profiles (id, data, admin_rev) values (target, new_data, 1)
  on conflict (id) do update set data = excluded.data, admin_rev = public.player_profiles.admin_rev + 1;
 insert into public.public_profiles (id, name, frame, banner, title)
  values (target, left(coalesce(nullif(pub->>'name', ''), 'Jugador'), 24), coalesce(pub->>'frame', 'frame-acero'), coalesce(pub->>'banner', 'banner-acero'), nullif(pub->>'title', ''))
  on conflict (id) do update set name = excluded.name, frame = excluded.frame, banner = excluded.banner, title = excluded.title, updated_at = now();
 update public.public_profiles set
  level = coalesce((pub->>'level')::int, level),
  mmr_1v1 = coalesce((pub->>'mmr_1v1')::int, mmr_1v1), mmr_2v2 = coalesce((pub->>'mmr_2v2')::int, mmr_2v2), mmr_3v3 = coalesce((pub->>'mmr_3v3')::int, mmr_3v3),
  played_1v1 = coalesce((pub->>'played_1v1')::int, played_1v1), played_2v2 = coalesce((pub->>'played_2v2')::int, played_2v2), played_3v3 = coalesce((pub->>'played_3v3')::int, played_3v3)
  where id = target;
 if pub ? 'avatar' then
  av := pub->>'avatar';
  update public.public_profiles set avatar = nullif(av, ''), updated_at = now() where id = target;
  delete from public.avatar_requests where user_id = target;
 end if;
end $$;

-- Eliminar una cuenta por completo (borra también su perfil, historial, presencia y fotos por cascada)
create or replace function public.admin_delete_user(target uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
 if target = (select auth.uid()) then raise exception 'No puedes eliminar tu propia cuenta de administrador'; end if;
 delete from auth.users where id = target;
end $$;

revoke all on function public.admin_send_command(uuid, text, jsonb), public.ack_command(bigint), public.admin_list_players(), public.admin_get_player(uuid), public.admin_save_player(uuid, jsonb, jsonb), public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_send_command(uuid, text, jsonb), public.ack_command(bigint), public.admin_list_players(), public.admin_get_player(uuid), public.admin_save_player(uuid, jsonb, jsonb), public.admin_delete_user(uuid) to authenticated;
