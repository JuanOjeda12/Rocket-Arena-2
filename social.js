// Parte online de la identidad: podio público, revisión de fotos y panel admin (Supabase). Requiere setup/perfiles-publicos.sql.
import {levelInfo,PLAYLISTS} from './progression.js?v=final2';
import {ADMIN_EMAIL,validAvatar} from './identity.js?v=final2';
const MISSING='Falta activar el podio online: ejecuta setup/perfiles-publicos.sql en el SQL Editor de Supabase (ver LEEME-PODIO.md).';
const friendly=error=>{
 if(error?.status===404||/PGRST20[0-9]|schema cache|does not exist|Could not find/i.test(error?.message||''))return Error(MISSING);
 if(error?.status===403||/42501|No autorizado|permission denied|row-level/i.test(error?.message||''))return Error('No tienes permiso para esta acción.');
 return error;
};
export class Social{
 constructor(hub){this.hub=hub;this.timer=null;this.last='';this.mineLoaded=null}
 get acc(){return this.hub.account}
 get online(){return !!(this.acc.user&&this.acc.configured)}
 get isAdmin(){const u=this.acc.user;return !!u&&String(u.email||'').toLowerCase()===ADMIN_EMAIL&&!!(u.email_confirmed_at||u.confirmed_at)}
 async call(route,opts={}){try{return await this.acc.request(route,{...opts,token:opts.anon?null:await this.acc.token()})}catch(error){throw friendly(error)}}
 // ── Mi tarjeta pública ──
 body(){
  const g=this.acc.data.garage,id=this.hub.identity,p=this.hub.progress,body={id:this.acc.user.id,name:g.name,frame:id.frame,banner:id.banner,level:levelInfo(p.xp).level};
  for(const list of PLAYLISTS){const r=p.ranked[list];body['mmr_'+list]=r.mmr;body['played_'+list]=r.played}
  return body;
 }
 queueSync(){clearTimeout(this.timer);if(!this.online)return;this.timer=setTimeout(()=>this.sync().catch(()=>{}),2500)}
 async sync(){
  if(!this.online)return;const body=this.body(),key=JSON.stringify(body);if(key===this.last)return;
  await this.call('/rest/v1/public_profiles?on_conflict=id',{method:'POST',body});this.last=key;
 }
 // Trae el estado de mi foto (aprobada / pendiente / rechazada) y sube mis datos.
 async refreshMine(){
  if(!this.online)return;const uid=this.acc.user.id;
  try{
   const [pub,req]=await Promise.all([this.call('/rest/v1/public_profiles?id=eq.'+uid+'&select=avatar'),this.call('/rest/v1/avatar_requests?user_id=eq.'+uid+'&select=status,note')]);
   if(this.acc.user?.id!==uid)return;
   const id=this.acc.data.identity,avatar=validAvatar(pub?.[0]?.avatar)?pub[0].avatar:null,r=req?.[0];
   const status=r?.status==='pending'?'pending':r?.status==='rejected'&&!avatar?'rejected':avatar?'approved':'none',note=status==='rejected'?String(r?.note||''):'';
   if(id.avatar!==avatar||id.avatarStatus!==status||id.avatarNote!==note){id.avatar=avatar;id.avatarStatus=status;id.avatarNote=note;this.acc.persist();this.hub.onIdentity?.()}
   await this.sync();
  }catch{/* sin SQL o sin conexión: se sigue jugando con marco y banner locales */}
 }
 async submitAvatar(image){
  if(!this.online)throw Error('Inicia sesión para subir una foto.');if(!validAvatar(image))throw Error('Imagen no válida.');
  await this.call('/rest/v1/avatar_requests?on_conflict=user_id',{method:'POST',body:{user_id:this.acc.user.id,image}});
  const id=this.acc.data.identity;id.avatarStatus='pending';id.avatarNote='';this.acc.persist();
 }
 async removeAvatar(){
  if(this.online)await this.call('/rest/v1/rpc/remove_my_avatar',{method:'POST',body:{}});
  const id=this.acc.data.identity;id.avatar=null;id.avatarStatus='none';id.avatarNote='';this.acc.persist();
 }
 // ── Podio ──
 async leaderboard(playlist){
  if(!this.acc.configured)throw Error('Las cuentas online aún no están configuradas.');
  const m='mmr_'+playlist,p='played_'+playlist;
  const rows=await this.call(`/rest/v1/public_profiles?select=id,name,frame,banner,avatar,level,${m},${p}&${p}=gte.10&hidden=eq.false&order=${m}.desc&limit=50`,{anon:true});
  return rows.map(r=>({id:r.id,name:r.name,frame:r.frame,banner:r.banner,avatar:validAvatar(r.avatar)?r.avatar:null,level:r.level,mmr:r[m],played:r[p]}));
 }
 // ── Panel admin (la seguridad real está en las políticas de la base de datos) ──
 async adminPending(){
  const reqs=await this.call('/rest/v1/avatar_requests?status=eq.pending&select=user_id,image,created_at&order=created_at.asc&limit=50');
  if(!reqs.length)return[];
  const names=await this.call('/rest/v1/public_profiles?select=id,name&id=in.('+reqs.map(r=>r.user_id).join(',')+')'),map=new Map(names.map(n=>[n.id,n.name]));
  return reqs.map(r=>({...r,name:map.get(r.user_id)||'Jugador'}));
 }
 adminApproved(){return this.call('/rest/v1/public_profiles?avatar=not.is.null&select=id,name,avatar&order=updated_at.desc&limit=100')}
 adminPlayers(){return this.call('/rest/v1/public_profiles?select=id,name,hidden,mmr_1v1,mmr_2v2,mmr_3v3&order=updated_at.desc&limit=100')}
 review(target,approve,reason=null){return this.call('/rest/v1/rpc/admin_review_avatar',{method:'POST',body:{target,approve,reason}})}
 revoke(target){return this.call('/rest/v1/rpc/admin_revoke_avatar',{method:'POST',body:{target}})}
 setHidden(target,hide){return this.call('/rest/v1/rpc/admin_set_hidden',{method:'POST',body:{target,hide}})}
}
