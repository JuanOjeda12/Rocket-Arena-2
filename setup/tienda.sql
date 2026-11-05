-- ============ ROCKET ARENA: tienda diaria + créditos de cada jugador en el panel admin ============
-- Ejecuta este archivo UNA vez en el SQL Editor de Supabase (después de perfiles-publicos.sql y admin-total.sql). Se puede repetir sin problema.

-- 1) Configuración de la tienda (una sola fila): objetos excluidos del sorteo y objetos retirados de la tienda de hoy
create table if not exists public.shop_config (
 id int primary key default 1 check (id = 1),
 excluded jsonb not null default '[]'::jsonb check (jsonb_typeof(excluded) = 'array' and octet_length(excluded::text) < 200000),
 removed jsonb not null default '{}'::jsonb check (jsonb_typeof(removed) = 'object' and octet_length(removed::text) < 20000),
 updated_at timestamptz not null default now()
);
insert into public.shop_config (id) values (1) on conflict (id) do nothing;
alter table public.shop_config enable row level security;
revoke all on public.shop_config from anon, authenticated;
grant select on public.shop_config to anon, authenticated;
drop policy if exists "Ver tienda" on public.shop_config;
create policy "Ver tienda" on public.shop_config for select to anon, authenticated using (true);

-- Solo el administrador puede cambiarla
create or replace function public.admin_set_shop(excl jsonb, rem jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
 update public.shop_config set excluded = coalesce(excl, '[]'::jsonb), removed = coalesce(rem, '{}'::jsonb), updated_at = now() where id = 1;
end $$;
revoke all on function public.admin_set_shop(jsonb, jsonb) from public, anon;
grant execute on function public.admin_set_shop(jsonb, jsonb) to authenticated;

-- 2) La lista de jugadores del panel admin ahora incluye los créditos de cada uno
create or replace function public.admin_list_players() returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
 return coalesce((select jsonb_agg(to_jsonb(r) order by r.last_seen desc nulls last, r.created_at desc) from (
  select u.id, u.email, u.created_at, u.last_sign_in_at,
   pp.name, pp.frame, pp.banner, pp.title, pp.level, pp.hidden, (pp.avatar is not null) as has_avatar,
   pp.mmr_1v1, pp.mmr_2v2, pp.mmr_3v3, pp.played_1v1, pp.played_2v2, pp.played_3v3,
   (select nullif(data->>'credits', '')::int from public.player_profiles where id = u.id) as credits,
   pr.last_seen, pr.status, pr.live, coalesce(pr.last_seen > now() - interval '75 seconds', false) as online
  from auth.users u
  left join public.public_profiles pp on pp.id = u.id
  left join public.player_presence pr on pr.user_id = u.id
  order by pr.last_seen desc nulls last, u.created_at desc limit 1000) r), '[]'::jsonb);
end $$;
revoke all on function public.admin_list_players() from public, anon;
grant execute on function public.admin_list_players() to authenticated;
