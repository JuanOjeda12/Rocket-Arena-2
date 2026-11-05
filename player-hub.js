import {equipItem,visitInventory,claimMission,claimPass,openDrop,collectDrop,recordInventoryMatch,grantRankItems,CREDIT_REWARD,DROP_CREDITS,passCredits} from './inventory.js?v=final2';
import {AccountStore} from './accounts.js?v=final2';
import {botSkill,cleanProgress,completeResult,levelInfo,PLAYLISTS,rankBadge,rankInfo,MODES,MODE_TITLE,RANK_KEYS,ratingKey,keyLabel} from './progression.js?v=final2';
import {itemById} from './item-catalog.js?v=final2';
import {Social} from './social.js?v=final2';
import {cleanIdentity,cardHTML} from './identity.js?v=final2';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class PlayerHub{
 constructor(apply){
  this.apply=apply;this.guestAccepted=false;this.context=null;this.award=null;this.social=new Social(this);this.onIdentity=null;this.unlockQueue=[];this.liveProvider=null;this.onCommand=null;this.onAdminChange=null;
  this.account=new AccountStore(undefined,text=>{for(const e of document.querySelectorAll('[data-sync-status]'))e.textContent=text});
  this.modal=document.createElement('div');this.modal.className='modal-shade';this.modal.hidden=true;
  this.modal.innerHTML=`<section class="dialog panel account-dialog" role="dialog" aria-modal="true" aria-label="Cuenta de jugador"><span class="eyebrow">TU PERFIL</span><h2 id="account-title">CREAR CUENTA</h2><p class="muted" id="account-info"></p><form id="account-form"><label id="account-name-row">NOMBRE DE USUARIO<input name="username" autocomplete="nickname" maxlength="24" minlength="2"></label><label>EMAIL<input name="email" type="email" autocomplete="email" required maxlength="254"></label><label>CONTRASEÑA<input name="password" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></label><p id="account-error" role="status"></p><button class="primary" id="account-submit" type="submit">CREAR CUENTA</button></form><button id="account-switch">YA TENGO CUENTA</button><button id="account-guest">JUGAR COMO INVITADO</button><button id="account-close">CANCELAR</button></section>`;
  document.body.append(this.modal);const get=id=>this.modal.querySelector('#'+id);this.form=get('account-form');this.mode='signup';
  this.form.onsubmit=async e=>{
   e.preventDefault();get('account-error').textContent='';get('account-submit').disabled=true;
   try{
    const email=this.form.elements.email.value.trim(),password=this.form.elements.password.value;
    const logged=this.mode==='signup'?await this.account.signup(email,password,this.form.elements.username.value.trim()):!!await this.account.login(email,password);
    this.form.elements.password.value='';
    if(!logged){this.mode='confirm';this.renderAuth();return}
    this.adopt();this.closeAuth();this.afterAuth?.();
   }catch(error){get('account-error').textContent=error.message}finally{get('account-submit').disabled=!this.account.configured}
  };
  get('account-switch').onclick=()=>{this.mode=this.mode==='signup'?'login':'signup';get('account-error').textContent='';this.renderAuth()};
  get('account-guest').onclick=()=>{this.guestAccepted=true;this.closeAuth();this.afterAuth?.()};get('account-close').onclick=()=>this.closeAuth();
  addEventListener('keydown',e=>{if(e.code==='Escape'&&!this.modal.hidden){e.preventDefault();e.stopImmediatePropagation();this.closeAuth()}},true);
  addEventListener('online',()=>this.account.flush());
  this.ready=this.account.restore().then(()=>{this.adopt();if(this.account.authError){this.modal.hidden=false;this.mode='login';this.renderAuth();get('account-error').textContent=this.account.authError}});
  addEventListener('storage',async e=>{
   if(e.key!=='rocket-auth-session'||!e.newValue||this.account.user)return;
   try{this.account.session=JSON.parse(e.newValue);await this.account.restore();if(this.account.user){this.adopt();if(!this.modal.hidden){this.closeAuth();this.afterAuth?.()}}}catch{}
  });
 }
 get inventory(){return this.account.data.inventory}
 get progress(){return this.account.data.progress}
 get canPlay(){return!!this.account.user||this.guestAccepted}
 adopt(){
  this.account.data.progress=cleanProgress(this.progress);
  const pending=this.progress.pending;if(pending){const {progress}=completeResult(this.progress,{...pending,forfeit:true,won:false,seconds:0,stats:{}});this.account.data.progress=progress;this.account.persist()}
  this.context=null;this.syncRankItems();this.apply(this.account.data);this.social.refreshMine();this.social.startBeat();
 }
 // Créditos y compras de la tienda
 get credits(){return Math.max(0,Math.floor(Number(this.account.data.credits)||0))}
 addCredits(n){this.account.data.credits=Math.max(0,Math.min(1e9,this.credits+Math.floor(Number(n)||0)))}
 buy(id,price){const i=itemById(id);if(!i)throw Error('Ese objeto no existe.');if(this.inventory.items[id])throw Error('Ya tienes este objeto.');if(this.credits<price)throw Error('No tienes suficientes créditos.');this.account.data.credits=this.credits-price;this.inventory.items[id]=1;this.account.persist();this.account.flush();return i}
 // Historial de partidas (local en tu cuenta y, con sesión, también online para el administrador)
 get history(){return this.account.data.history||[]}
 recordMatch(entry){const h=this.account.data.history??=[];if(h.some(x=>x.id===entry.id))return;h.push(entry);while(h.length>100)h.shift();this.account.persist();this.social.pushMatch(entry)}
 // Al alcanzar un rango se desbloquean su marco y su banner; quedan en cola para enseñarlos con la ficha ya puesta
 syncRankItems(){const added=grantRankItems(this.inventory,this.progress.peak);if(added.length){this.unlockQueue.push(...added);this.account.persist()}return added}
 takeUnlocks(){const q=this.unlockQueue;this.unlockQueue=[];return q}
 // Cómo se vería tu ficha con este marco, banner o título puesto
 previewCard(item){if(!item||!['frame','banner','title'].includes(item.category))return'';const id={...this.identity};id[item.category]=item.id;return `<div class="id-preview-mini">${cardHTML({name:this.account.data.garage.name,identity:id,sub:this.rankLine(),size:'sm'})}</div>`}
 // Marco y banner son objetos del inventario (se equipan como el resto); la foto y su estado vienen de la cuenta.
 get identity(){const g=this.account.data.garage.cosmetics||{};return{...this.account.data.identity,frame:g.frame,banner:g.banner,title:g.title}}
 get isAdmin(){return this.social.isAdmin}
 // Marco / banner (la foto solo cambia pasando por la revisión del administrador).
 setIdentity(patch){this.account.data.identity=cleanIdentity({...this.identity,...patch});this.account.persist();this.social.queueSync()}
 // Mejor rango entre las modalidades ya posicionadas, para la tarjeta del menú.
 bestRank(){
  let best=null;for(const p of PLAYLISTS){const r=this.rating(p),info=rankInfo(r);if(info.placed&&(!best||r.mmr>best.mmr))best={playlist:p,mmr:r.mmr,info}}
  return best;
 }
 rankLine(){const b=this.bestRank();return b?`${b.info.name} · ${b.mmr} MMR · ${b.playlist}`:'Sin rango · juega competitivo'}
 saveGarage(garage){if(garage.color!==this.account.data.garage.color)visitInventory(this.inventory,'paint');const rename=garage.name!==this.account.data.garage.name;this.account.data.garage={...garage};this.account.persist();if(rename)this.social.queueSync()}
 owns(id){return !!this.inventory.items[id]}
 visit(event){visitInventory(this.inventory,event);this.account.persist()}
 equip(id){this.account.data.garage=equipItem(this.inventory,this.account.data.garage,id);this.account.persist();this.social.queueSync();this.apply(this.account.data);return this.account.data.garage}
 claimMission(group,id){const reward=claimMission(this.inventory,group,id);this.lastMissionTitle=reward.title;this.progress.xp+=reward.xp;this.addCredits(CREDIT_REWARD[reward.drop]||0);this.account.persist();return reward}
 claimPass(tier){const reward=claimPass(this.inventory,tier);this.addCredits(passCredits(tier));this.account.persist();return reward}
 openDrop(type){const result=openDrop(this.inventory,type);if(result.credits)this.addCredits(result.credits);this.account.persist();this.account.flush();return result}
 collectDrop(){const reward=collectDrop(this.inventory);this.account.persist();return reward}
 saveControls(controls){this.account.data.controls=controls;this.account.persist()}
 openAuth(after){this.afterAuth=after;this.mode='signup';this.modal.querySelector('#account-error').textContent='';this.modal.hidden=false;this.renderAuth();this.form.elements[this.account.configured?'username':'email'].focus()}
 closeAuth(){this.modal.hidden=true;this.form.elements.password.value=''}
 renderAuth(){
  const confirming=this.mode==='confirm';this.form.hidden=confirming;this.modal.querySelector('#account-switch').hidden=confirming;
  if(confirming){this.modal.querySelector('#account-title').textContent='REVISA TU CORREO';this.modal.querySelector('#account-info').textContent='Revisa tu bandeja de entrada y confirma tu email. Si no aparece, mira en spam. El enlace te llevará a Rocket Arena e iniciará tu sesión automáticamente.';return}
  const signup=this.mode==='signup';this.modal.querySelector('#account-title').textContent=signup?'CREAR CUENTA':'INICIAR SESIÓN';this.modal.querySelector('#account-name-row').hidden=!signup;this.form.elements.username.required=signup;this.form.elements.password.autocomplete=signup?'new-password':'current-password';
  this.modal.querySelector('#account-submit').textContent=signup?'CREAR CUENTA':'ENTRAR';this.modal.querySelector('#account-submit').disabled=!this.account.configured;this.modal.querySelector('#account-switch').textContent=signup?'YA TENGO CUENTA':'CREAR UNA CUENTA';
  this.modal.querySelector('#account-info').textContent=this.account.configured?'Guarda tu auto, controles, rango y experiencia entre dispositivos. Como invitado se guardan solo en este navegador.':'Las cuentas online necesitan conectar tu proyecto gratuito de Supabase. Mientras tanto puedes jugar y guardar tu progreso como invitado en este navegador.';
 }
 async logout(){await this.account.logout();this.guestAccepted=false;this.adopt()}
 rating(playlist){return this.progress.ranked[playlist]}
 skill(playlist){return botSkill(this.rating(playlist))}
 rankHTML(playlist){const r=rankInfo(this.rating(playlist));return `${rankBadge(r,45)}<span><b>${esc(r.name)}</b><small>${r.placed?(r.division?'División '+['I','II','III','IV'][r.division-1]:'Rango máximo'):r.placements+'/10 posicionamiento'}</small></span>`}
 levelHTML(){const level=levelInfo(this.progress.xp);return `<div class="player-level"><b>NIVEL ${level.level}</b><span>${level.current.toLocaleString('es')} / ${level.needed.toLocaleString('es')} XP</span><div class="xp-track"><i style="width:${level.current/level.needed*100}%"></i></div></div>`}
 profileHTML(extra=''){return `<div class="page-title">PERFIL</div><section class="panel player-profile"><span class="eyebrow">${this.account.user?'CUENTA CONECTADA':'INVITADO'}</span><h2>${esc(this.account.data.garage.name)}</h2><p class="muted" data-sync-status>${esc(this.account.status)}</p>${this.levelHTML()}<div class="rank-cards">${PLAYLISTS.map(p=>`<div><strong>${p}</strong><div class="rank-label">${this.rankHTML(p)}</div><small>${this.rating(p).mmr} MMR · ${this.rating(p).wins} victorias</small></div>`).join('')}</div>${MODES.map(m=>`<h3 class="rank-mode">${MODE_TITLE[m]}</h3><div class="rank-cards">${PLAYLISTS.map(p=>{const k=ratingKey(m,p);return `<div><strong>${p}</strong><div class="rank-label">${this.rankHTML(k)}</div><small>${this.rating(k).mmr} MMR · ${this.rating(k).wins} victorias</small></div>`}).join('')}</div>`).join('')}<p>${this.progress.totals.matches} partidos · ${this.progress.totals.wins} victorias · ${this.progress.totals.goals} goles</p><p class="muted">Casual da experiencia y no cambia tus rangos. Cada modalidad competitiva (fútbol, Heatseeker y Snow Day, en 1v1, 2v2 y 3v3) tiene 10 posicionamientos y su propio MMR; los bots se adaptan a tu rango en cada una. Divisiones I–IV; ascensos por victorias y descensos por derrotas. Abandonar competitivo cuenta como derrota. Los umbrales y bots son propios de este juego.</p><button data-action="${this.account.user?'account-logout':'account-login'}">${this.account.user?'CERRAR SESIÓN':'CREAR CUENTA / ENTRAR'}</button></section>${extra}<button data-action="home" class="back">‹ VOLVER</button>`}
 start(options,state){
  this.award=null;this.context=null;if(options.training||options.privateLocal)return;
  const playlist=ratingKey(options.mode,`${options.blue}v${options.blue}`),mode=options.difficulty==='competitive'?'competitive':'casual';
  this.context={id:state.matchId,mode,playlist,opponentMmr:this.rating(playlist).mmr+40};this.progress.pending={...this.context};this.account.persist();
 }
 finish(state,slot){
  if(!this.context||this.context.id!==state.matchId)return;
  const car=state.cars.find(c=>c.slot===slot),stats=state.stats?.find(s=>s.slot===slot)||{},ownTeam=car?.team??0,won=state.score[ownTeam]>state.score[1-ownTeam],best=Math.max(...(state.stats||[]).filter(r=>state.cars.some(c=>c.slot===r.slot&&c.team===ownTeam)).map(r=>r.points));
  const result=completeResult(this.progress,{...this.context,seconds:state.played,won,stats,mvp:won&&stats.points===best});
  this.account.data.progress=result.progress;recordInventoryMatch(this.inventory,{id:state.matchId,seconds:state.played,won,stats,xp:result.award?.xp||0});this.award=result.award;this.context=null;this.account.persist();this.account.flush();this.social.queueSync();this.syncRankItems();
 }
 abandon(){if(!this.context)return;const result=completeResult(this.progress,{...this.context,seconds:0,won:false,forfeit:true,stats:{}});if(this.context.mode==='competitive')this.recordMatch({id:this.context.id,t:Date.now(),mode:this.context.playlist.includes('-')?this.context.playlist.split('-')[0]:'competitive',playlist:this.context.playlist.split('-').pop(),result:'loss',sf:0,sa:0,seconds:0,goals:0,assists:0,saves:0,shots:0,delta:result.award?.delta??null,forfeit:true});this.account.data.progress=result.progress;this.context=null;this.award=null;this.account.persist()}
 resultRankHTML(playlist='1v1'){
  const a=this.award,r=a?.ranked?a.rankAfter:rankInfo(this.rating(RANK_KEYS.includes(playlist)?playlist:'1v1'));
  const before=a?.rankBefore,changed=a?.ranked&&before?.placed&&r.placed;
  const title=changed?(r.step>before.step?'ASCENSO':r.step<before.step?'DESCENSO':'DIVISIÓN SIN CAMBIOS'):a?.ranked?'POSICIONAMIENTO':'RANGO SIN CAMBIOS';
  return `<section class="final-rank"><span class="eyebrow">${title} · ${esc(keyLabel(RANK_KEYS.includes(playlist)?playlist:'1v1'))}</span><div class="rank-label">${rankBadge(r,58)}<span><b>${esc(r.name)}</b><small>${r.placed?(r.division?'División '+['I','II','III','IV'][r.division-1]:'Rango máximo'):r.placements+'/10 posicionamientos'}${a?.ranked?' · '+(a.delta>0?'+':'')+a.delta+' MMR':''}</small></span></div></section>`;
 }
 awardHTML(showRank=true){
  const a=this.award;if(!a)return'';const r=a.rankAfter;let title='PROGRESO GUARDADO';
  if(a.ranked&&r.placed)title=!a.rankBefore.placed?'POSICIONAMIENTO COMPLETADO':r.step>a.rankBefore.step?'ASCENSO':r.step<a.rankBefore.step?'DESCENSO':'COMPETITIVO';
  return `<section class="reward-panel"><span class="eyebrow">${title}</span><h2>+${a.xp} XP${a.levelAfter>a.levelBefore?' · ¡SUBES DE NIVEL!':''}</h2>${a.ranked&&showRank?`<div class="rank-label">${rankBadge(r,52)}<span><b>${esc(r.name)}</b><small>${r.placed?(r.division?'División '+['I','II','III','IV'][r.division-1]:'Rango máximo'):r.placements+'/10 posicionamientos'} · ${a.delta>0?'+':''}${a.delta} MMR</small></span></div>`:''}${a.reason?`<p class="muted">${esc(a.reason)}</p>`:''}${this.levelHTML()}</section>`;
 }
}

