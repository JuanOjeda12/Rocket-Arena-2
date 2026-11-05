-- ============ ROCKET ARENA: panel admin visual (coches y fotos de los jugadores) ============
-- Ejecuta este archivo UNA vez en el SQL Editor de Supabase (después de perfiles-publicos.sql, admin-total.sql y tienda.sql). Se puede repetir sin problema.

-- 1) La lista de jugadores ahora incluye el coche de cada uno (modelo, color y cosméticos) para dibujarlo en el panel
create or replace function public.admin_list_players() returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
 return coalesce((select jsonb_agg(to_jsonb(r) order by r.last_seen desc nulls last, r.created_at desc) from (
  select u.id, u.email, u.created_at, u.last_sign_in_at,
   pp.name, pp.frame, pp.banner, pp.title, pp.level, pp.hidden, (pp.avatar is not null) as has_avatar,
   pp.mmr_1v1, pp.mmr_2v2, pp.mmr_3v3, pp.played_1v1, pp.played_2v2, pp.played_3v3,
   (select nullif(data->>'credits', '')::int from public.player_profiles where id = u.id) as credits,
   (select jsonb_build_object('body', data->'garage'->>'body', 'color', data->'garage'->>'color', 'cos', data->'garage'->'cosmetics')
      from public.player_profiles where id = u.id) as car,
   pr.last_seen, pr.status, pr.live, coalesce(pr.last_seen > now() - interval '75 seconds', false) as online
  from auth.users u
  left join public.public_profiles pp on pp.id = u.id
  left join public.player_presence pr on pr.user_id = u.id
  order by pr.last_seen desc nulls last, u.created_at desc limit 1000) r), '[]'::jsonb);
end $$;
revoke all on function public.admin_list_players() from public, anon;
grant execute on function public.admin_list_players() to authenticated;

-- 2) Las fotos de perfil se piden aparte y solo de los jugadores que se ven en pantalla (así la lista carga rápido)
create or replace function public.admin_avatars(ids uuid[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
 return coalesce((select jsonb_object_agg(id::text, avatar) from public.public_profiles where id = any(ids) and avatar is not null), '{}'::jsonb);
end $$;
revoke all on function public.admin_avatars(uuid[]) from public, anon;
grant execute on function public.admin_avatars(uuid[]) to authenticated;
