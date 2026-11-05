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
  const g=this.acc.data.garage,id=this.hub.identity,p=this.hub.progress,body={id:this.acc.user.id,name:g.name,frame:id.frame,banner:id.banner,level:levelInfo(p.xp).level};if(!this.noTitle)body.title=id.title&&id.title!=='title-none'?id.title:null;
  for(const list of PLAYLISTS){const r=p.ranked[list];body['mmr_'+list]=r.mmr;body['played_'+list]=r.played}
  return body;
 }
 queueSync(){clearTimeout(this.timer);if(!this.online)return;this.timer=setTimeout(()=>this.sync().catch(()=>{}),2500)}
 async sync(){
  if(!this.online)return;const body=this.body(),key=JSON.stringify(body);if(key===this.last)return;
  try{await this.call('/rest/v1/public_profiles?on_conflict=id',{method:'POST',body})}catch(error){if(!this.noTitle&&/title|column|schema/i.test(error.message||'')){this.noTitle=true;delete body.title;await this.call('/rest/v1/public_profiles?on_conflict=id',{method:'POST',body})}else throw error}this.last=key;
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
  const q=cols=>this.call(`/rest/v1/public_profiles?select=${cols}&${p}=gte.10&hidden=eq.false&order=${m}.desc&limit=50`,{anon:true});
  let rows;try{rows=await q(`id,name,frame,banner,avatar,level,${this.noTitle?'':'title,'}${m},${p}`)}catch(error){if(!this.noTitle&&/title|column|schema/i.test(error.message||'')){this.noTitle=true;rows=await q(`id,name,frame,banner,avatar,level,${m},${p}`)}else throw error}
  return rows.map(r=>({id:r.id,name:r.name,title:r.title||null,frame:r.frame,banner:r.banner,avatar:validAvatar(r.avatar)?r.avatar:null,level:r.level,mmr:r[m],played:r[p]}));
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
 // ── Presencia (última vez visto / en línea / partido en vivo), órdenes del admin y cambios hechos por el admin ──
 startBeat(){
  this.stopBeat();if(!this.online||this.beatDead)return;let n=0;this.beatErrors=0;
  const tick=async()=>{
   if(!this.online){this.stopBeat();return}
   const live=this.hub.liveProvider?.()||null;
   try{
    if(live||n%3===0)await this.call('/rest/v1/player_presence?on_conflict=user_id',{method:'POST',body:{user_id:this.acc.user.id,status:live?'playing':'menu',live}});
    if(live||n%4===0)await this.pollCommands();
    if(n%4===0)await this.checkAdminRev();
    this.beatErrors=0;
   }catch(error){if(/Falta activar|schema|PGRST|does not exist/i.test(error.message||'')&&++this.beatErrors>=3)this.stopBeat(true)}
   n++;
  };
  tick();this.beatTimer=setInterval(tick,5000);
 }
 stopBeat(dead=false){clearInterval(this.beatTimer);this.beatTimer=null;if(dead)this.beatDead=true}
 async pollCommands(){const uid=this.acc.user.id,cmds=await this.call(`/rest/v1/admin_commands?user_id=eq.${uid}&done=eq.false&select=id,kind,payload&order=id.asc&limit=10`);for(const c of cmds||[]){try{await this.hub.onCommand?.(c)}catch{}await this.call('/rest/v1/rpc/ack_command',{method:'POST',body:{cid:c.id}})}}
 async checkAdminRev(){
  const uid=this.acc.user.id,rows=await this.call(`/rest/v1/player_profiles?id=eq.${uid}&select=admin_rev`),rev=rows?.[0]?.admin_rev;if(rev==null)return;
  if(this.seenRev==null||this.seenUid!==uid){this.seenRev=rev;this.seenUid=uid;return}
  if(rev>this.seenRev){this.seenRev=rev;await this.acc.reloadRemote();this.hub.adopt();this.hub.onAdminChange?.()}
 }
 async pushMatch(e){if(!this.online)return;try{await this.call('/rest/v1/match_history',{method:'POST',body:{client_id:e.id,played_at:new Date(e.t||Date.now()).toISOString(),mode:e.mode,playlist:e.playlist||'',result:e.result,score_for:e.sf,score_against:e.sa,seconds:e.seconds,goals:e.goals,assists:e.assists,saves:e.saves,shots:e.shots,mmr_delta:e.delta,forfeit:!!e.forfeit}})}catch{}}
 // Tienda: lo que el administrador excluyó del sorteo y lo que retiró de la tienda de hoy (lectura pública)
 async shopConfig(){const rows=await this.call('/rest/v1/shop_config?select=excluded,removed&id=eq.1',{anon:true});return rows?.[0]||{excluded:[],removed:{}}}
 adminSetShop(excl,rem){return this.call('/rest/v1/rpc/admin_set_shop',{method:'POST',body:{excl,rem}})}
 adminListPlayers(){return this.call('/rest/v1/rpc/admin_list_players',{method:'POST',body:{}})}
 adminAvatars(ids){return this.call('/rest/v1/rpc/admin_avatars',{method:'POST',body:{ids}})}
 adminGetPlayer(target){return this.call('/rest/v1/rpc/admin_get_player',{method:'POST',body:{target}})}
 adminSavePlayer(target,new_data,pub){return this.call('/rest/v1/rpc/admin_save_player',{method:'POST',body:{target,new_data,pub}})}
 adminDeleteUser(target){return this.call('/rest/v1/rpc/admin_delete_user',{method:'POST',body:{target}})}
 adminCommand(target,k,p){return this.call('/rest/v1/rpc/admin_send_command',{method:'POST',body:{target,k,p}})}
 review(target,approve,reason=null){return this.call('/rest/v1/rpc/admin_review_avatar',{method:'POST',body:{target,approve,reason}})}
 revoke(target){return this.call('/rest/v1/rpc/admin_revoke_avatar',{method:'POST',body:{target}})}
 setHidden(target,hide){return this.call('/rest/v1/rpc/admin_set_hidden',{method:'POST',body:{target,hide}})}
}
