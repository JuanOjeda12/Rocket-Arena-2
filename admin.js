// Panel de administración de jugadores: ver y editar TODO (ficha, coche, inventario, drops, progreso), ver su historial y presencia,
// editar el marcador de un partido en vivo y eliminar cuentas. La seguridad real está en las funciones y políticas de la base de datos (setup/admin-total.sql).
import {ITEMS,CATEGORIES,DEFAULT_COSMETICS,rarityById} from './item-catalog.js?v=final2';
import {CARS,cleanProfile} from './catalog.js?v=final2';
import {cleanInventory} from './inventory.js?v=final2';
import {cleanProgress,PLAYLISTS,RANK_KEYS,keyLabel,RANKS,rankInfo,levelInfo} from './progression.js?v=final2';
import {cardHTML,resizeAvatar,validAvatar} from './identity.js?v=final2';
import {historyHTML,fromRows} from './history.js?v=final2';
import {todaysItems,priceOf,dayKey} from './shop.js?v=final2';
import {THUMB_CATEGORIES} from './item-thumbs.js?v=final2';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DROP_TYPES=['sport','special','deluxe','import','exotic','blackmarket'],COSMETIC_CATS=['decal','paint','finish','topper','wheels','boost','goalExplosion'];
const SECTIONS=[['ficha','FICHA'],['coche','COCHE'],['inventario','INVENTARIO'],['drops','DROPS'],['progreso','PROGRESO'],['creditos','CRÉDITOS'],['partidas','PARTIDAS'],['vivo','EN VIVO'],['cuenta','CUENTA']];
const setPath=(o,p,v)=>{const k=p.split('.');let t=o;for(let i=0;i<k.length-1;i++)t=t[k[i]]??={};t[k.at(-1)]=v};
const ago=iso=>{if(!iso)return'nunca';const s=Math.max(0,Math.round((Date.now()-Date.parse(iso))/1000));return s<60?'hace unos segundos':s<3600?`hace ${Math.round(s/60)} min`:s<86400?`hace ${Math.round(s/3600)} h`:`hace ${Math.round(s/86400)} d`};
const fmtDate=iso=>iso?new Date(iso).toLocaleString('es',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—';
const bestRank=p=>{let best=null;for(const l of PLAYLISTS){const r=rankInfo({mmr:p['mmr_'+l],played:p['played_'+l]});if(r.placed&&(!best||p['mmr_'+l]>best.mmr))best={mmr:p['mmr_'+l],name:r.name,list:l}}return best?`${best.name} · ${best.mmr} MMR · ${best.list}`:'Sin rango'};
const clock=s=>`${Math.floor(s/60)}:${String(Math.max(0,s)%60).padStart(2,'0')}`;
const opts=(list,value)=>list.map(([v,t])=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(t)}</option>`).join('');

export function createAdmin({hub,toast,rerender,goto}){
 const A={players:[],q:'',filter:'all',sel:null,det:null,edit:null,section:'ficha',dirty:false,avatarNew:undefined,invQ:'',invCat:'all',busy:false,shopCfg:null,shopQ:'',sort:'recent',shown:24,avatars:{}};
 const social=()=>hub.social;
 // imágenes: coche del jugador y miniatura de un objeto (las genera item-thumbs.js después de pintar)
 const carImg=(car,cls='adm-car')=>car&&car.body?`<span class="${cls}"><img class="item-thumb" alt="Coche" data-car="${esc(JSON.stringify({body:car.body,color:car.color||'#2f8cff',cos:car.cos||{}}))}"></span>`:`<span class="${cls} empty">Sin coche</span>`;
 const thumb=id=>{const i=ITEMS.find(x=>x.id===id);return i&&THUMB_CATEGORIES.has(i.category)?`<span class="adm-thumb"><img class="item-thumb" alt="" data-thumb="${esc(id)}"></span>`:''};
 // las fotos se piden aparte, solo de los jugadores visibles, y se recuerdan
 const asked=new Set();
 function want(ids){const need=ids.filter(id=>id&&!asked.has(id));if(!need.length)return;need.forEach(id=>asked.add(id));
  Promise.resolve().then(()=>social().adminAvatars(need)).then(map=>{if(map&&typeof map==='object'){Object.assign(A.avatars,map);rerender()}}).catch(()=>{})}
 const safe=async(fn)=>{try{return await fn()}catch(e){toast(e.message||'Error');return undefined}};
 function normalize(d){const e={...(d||{})};e.garage=cleanProfile(e.garage||{});e.inventory=cleanInventory(e.inventory,e.garage.body);e.progress=cleanProgress(e.progress||{});e.credits=Math.max(0,Math.min(1e9,Math.floor(Number(e.credits)||0)));return e}
 const own=(id)=>{if(!id)return;const it=A.edit.inventory.items;it[id]=Math.max(1,it[id]||0)};
 // ───────── listas ─────────
 async function loadPlayers(){const rows=await social().adminListPlayers();A.players=Array.isArray(rows)?rows:[];return A.players}
 const bestMmr=p=>Math.max(0,...PLAYLISTS.map(l=>Number(p['mmr_'+l])||0));
 function filtered(){const q=A.q.trim().toLowerCase(),rows=A.players.filter(p=>(A.filter==='all'||(A.filter==='online'&&p.online)||(A.filter==='playing'&&p.online&&p.status==='playing'))&&(!q||(p.name||'').toLowerCase().includes(q)||(p.email||'').toLowerCase().includes(q)));
  if(A.sort==='name')rows.sort((a,b)=>(a.name||'').localeCompare(b.name||'','es'));else if(A.sort==='level')rows.sort((a,b)=>(b.level||0)-(a.level||0));else if(A.sort==='mmr')rows.sort((a,b)=>bestMmr(b)-bestMmr(a));else if(A.sort==='credits')rows.sort((a,b)=>(b.credits||0)-(a.credits||0));else if(A.sort==='new')rows.sort((a,b)=>Date.parse(b.created_at||0)-Date.parse(a.created_at||0));
  return rows}
 const statusHTML=p=>p.online?`<span class="adm-status on">● EN LÍNEA${p.status==='playing'&&p.live?` · JUGANDO ${esc(p.live.label||'')} ${(p.live.score||[0,0]).join('–')}`:''}</span>`:`<span class="adm-status">Última vez: ${esc(ago(p.last_seen||p.last_sign_in_at))}</span>`;
 function listHTML(tab){
  const online=A.players.filter(p=>p.online).length,playing=A.players.filter(p=>p.online&&p.status==='playing').length;
  const bar=`<div class="adm-bar"><input data-adm-q placeholder="Buscar por nombre o correo…" value="${esc(A.q)}" aria-label="Buscar jugador"><select data-adm-filter>${opts([['all','Todos'],['online','En línea'],['playing','Jugando']],A.filter)}</select><select data-adm-sort aria-label="Ordenar">${opts([['recent','Última conexión'],['new','Más nuevos'],['name','Nombre (A-Z)'],['level','Nivel'],['mmr','Mejor MMR'],['credits','Créditos']],A.sort)}</select><span class="muted">${A.players.length} jugadores · ${online} en línea · ${playing} jugando</span></div>`;
  if(tab==='live'){
   const rows=A.players.filter(p=>p.online&&p.status==='playing'&&p.live);
   return bar+(rows.length?`<div class="adm-live">${rows.map(p=>{const s=p.live.score||[0,0];return `<div class="adm-live-card"><div><b>${esc(p.name||'Jugador')}</b><small>${esc(p.live.label||'')} · quedan ${clock(p.live.remaining||0)}</small></div><div class="adm-score"><label>AZUL<input type="number" min="0" max="99" id="adm-live-b-${esc(p.id)}" value="${s[0]}"></label><label>NARANJA<input type="number" min="0" max="99" id="adm-live-o-${esc(p.id)}" value="${s[1]}"></label><button class="primary" data-action="adm:livescore:${esc(p.id)}">CAMBIAR MARCADOR</button></div><button data-action="adm:open:${esc(p.id)}">VER JUGADOR</button></div>`}).join('')}</div>`:'<p class="muted">Nadie está jugando una partida ahora mismo. Esta lista se actualiza sola cada pocos segundos.</p>');
  }
  const rows=filtered();
  const page=rows.slice(0,A.shown);want(page.map(p=>p.id));
  return bar+(rows.length?`<div class="adm-pgrid">${page.map(p=>`<article class="adm-pcard ${p.online?'online':''}"><div class="adm-pcard-art">${carImg(p.car)}<div class="adm-pcard-id">${cardHTML({name:p.name||'Jugador',identity:{frame:p.frame,banner:p.banner,title:p.title,avatar:validAvatar(A.avatars[p.id])?A.avatars[p.id]:null},sub:bestRank(p),size:'sm'})}</div></div><div class="adm-meta"><b>${esc(p.name||'(sin nombre)')} <small>Nv. ${p.level||1}</small></b><small>${esc(p.email||'')}</small>${p.credits!=null?`<small>◈ ${Number(p.credits).toLocaleString('es')} créditos</small>`:''}${statusHTML(p)}<small>Se unió: ${esc(fmtDate(p.created_at))}</small></div><button class="primary" data-action="adm:open:${esc(p.id)}">VER / EDITAR</button></article>`).join('')}</div>${rows.length>page.length?`<button class="adm-more" data-action="adm:more">VER MÁS JUGADORES (${rows.length-page.length} restantes)</button>`:''}`:'<p class="muted">No hay jugadores que coincidan.</p>');
 }
 // ───────── tienda ─────────
 async function loadShop(){const c=await social().shopConfig();A.shopCfg={excluded:[...(c?.excluded||[])],removed:{day:c?.removed?.day||'',ids:[...(c?.removed?.ids||[])]}};return[]}
 const nameOf=id=>ITEMS.find(i=>i.id===id)?.name||id;
 function shopHTML(){
  if(!A.shopCfg)return '<p class="muted">Cargando…</p>';
  const cfg=A.shopCfg,day=dayKey(),rm=new Set(cfg.removed.day===day?cfg.removed.ids:[]),today=todaysItems({excluded:cfg.excluded,removed:{day,ids:[]}});
  const q=A.shopQ.trim().toLowerCase(),ex=new Set(cfg.excluded),found=q?ITEMS.filter(i=>!i.variantOf&&!i.noDrop&&i.rarity!=='base'&&(i.name.toLowerCase().includes(q)||i.id.includes(q))).slice(0,40):[];
  return `<p class="muted">La tienda de hoy (${day}, hora UTC) es la misma para todos y cambia sola cada día. Aquí decides qué objetos no pueden salir nunca y qué objetos retiras de la tienda de HOY. Pulsa GUARDAR para aplicarlo.</p>
<h3>TIENDA DE HOY (${today.length} objetos)</h3><div class="adm-items">${today.map(i=>`<div class="adm-item-row ${rm.has(i.id)?'removed':''}"><span class="dot" style="background:${rarityById(i.rarity).color}"></span>${thumb(i.id)}<b>${esc(i.name)}</b><small>${esc(CATEGORIES[i.category])} · ◈ ${priceOf(i).toLocaleString('es')}</small><button data-action="adm:shop-rm:${esc(i.id)}" class="${rm.has(i.id)?'':'danger'}">${rm.has(i.id)?'VOLVER A PONER':'RETIRAR HOY'}</button></div>`).join('')||'<p class="muted">Sin objetos.</p>'}</div>
<h3>OBJETOS EXCLUIDOS DEL SORTEO (${cfg.excluded.length})</h3><div class="adm-chips">${cfg.excluded.map(id=>`<span class="adm-chip">${esc(nameOf(id))}<button data-action="adm:shop-incl:${esc(id)}" title="Permitir otra vez">✕</button></span>`).join('')||'<span class="muted">Ninguno: cualquier objeto puede salir.</span>'}</div>
<h3>EXCLUIR UN OBJETO</h3><div class="adm-bar"><input data-adm-shopq placeholder="Buscar objeto para excluir (excluye todos sus colores)…" value="${esc(A.shopQ)}"></div><div class="adm-items">${found.map(i=>`<div class="adm-item-row"><b>${esc(i.name)}</b><small>${esc(CATEGORIES[i.category])} · ${esc(rarityById(i.rarity).name.split(' · ')[0])}</small>${ex.has(i.id)?'<small>YA EXCLUIDO</small>':`<button data-action="adm:shop-excl:${esc(i.id)}" class="danger">EXCLUIR</button>`}</div>`).join('')}</div>
<button class="primary" data-action="adm:shop-save">GUARDAR TIENDA</button>`;
 }
 // ───────── detalle ─────────
 async function open(uid){
  const det=await social().adminGetPlayer(uid);if(!det)throw Error('No se encontró al jugador');
  A.sel=uid;A.det=det;A.edit=normalize(det.data);A.section='ficha';A.dirty=false;A.avatarNew=undefined;goto('admin-player','admin');
 }
 async function refreshDetail(){if(!A.sel)return;const det=await social().adminGetPlayer(A.sel);if(det){A.det=det;if(!A.dirty){A.edit=normalize(det.data);}}}
 const avatarNow=()=>A.avatarNew!==undefined?A.avatarNew:(A.det?.public?.avatar||null);
 function field(label,path,type='text',extra=''){const v=path.split('.').reduce((o,k)=>o?.[k],A.edit);return `<label class="adm-field">${label}<input ${type==='number'?'type="number" min="0"':`type="${type}"`} data-adm-set="${path}" data-type="${type==='number'?'num':'text'}" value="${esc(v??'')}" ${extra}></label>`}
 function sel(label,path,list){const v=path.split('.').reduce((o,k)=>o?.[k],A.edit);return `<label class="adm-field">${label}<span class="adm-sel">${path.startsWith('garage.cosmetics.')?thumb(v):''}<select data-adm-set="${path}">${opts(list,v)}</select></span></label>`}
 const itemOptions=cat=>ITEMS.filter(i=>i.category===cat).map(i=>[i.id,i.name]);
 function sectionHTML(){
  const e=A.edit,cos=e.garage.cosmetics,det=A.det;
  if(A.section==='ficha'){const av=avatarNow();return `<div class="adm-grid2"><div>${field('NOMBRE DE USUARIO','garage.name','text','maxlength="24"')}${sel('MARCO','garage.cosmetics.frame',itemOptions('frame'))}${sel('BANNER','garage.cosmetics.banner',itemOptions('banner'))}${sel('TÍTULO','garage.cosmetics.title',itemOptions('title'))}</div><div class="adm-avatar"><b>FOTO DE PERFIL</b>${validAvatar(av)?`<img alt="Foto" src="${av}">`:'<div class="adm-noavatar">Sin foto</div>'}<div class="adm-buttons"><button data-action="adm:avatar-pick">SUBIR / CAMBIAR</button><button class="danger" data-action="adm:avatar-remove">QUITAR</button><input id="adm-avatar-file" type="file" accept="image/*" hidden></div>${A.avatarNew!==undefined?'<small class="muted">Cambio de foto pendiente de guardar.</small>':''}</div></div>`}
  if(A.section==='coche'){return `<div class="adm-showcar">${carImg({body:e.garage.body,color:e.garage.color,cos:cos},'adm-car big')}</div><div class="adm-grid2"><div>${sel('COCHE','garage.body',CARS.map(c=>[c.id,c.name]))}<label class="adm-field">COLOR<input type="color" data-adm-set="garage.color" data-type="text" value="${esc(e.garage.color)}"></label></div><div>${COSMETIC_CATS.map(c=>sel(CATEGORIES[c].toUpperCase(),'garage.cosmetics.'+c,itemOptions(c))).join('')}</div></div><p class="muted">Al elegir un objeto se le da automáticamente al jugador, para que no se le quite al cargar su cuenta.</p>`}
  if(A.section==='inventario'){
   const items=e.inventory.items,q=A.invQ.trim().toLowerCase(),match=i=>(A.invCat==='all'||i.category===A.invCat)&&(!q||i.name.toLowerCase().includes(q)||i.id.includes(q));
   const groupOf=b=>[b,...ITEMS.filter(v=>v.variantOf===b.id)],bases=ITEMS.filter(i=>!i.variantOf&&match(i));
   const ownedBases=bases.filter(b=>groupOf(b).some(v=>items[v.id])),addable=(q||A.invCat!=='all')?bases.filter(b=>groupOf(b).some(v=>!items[v.id])).slice(0,40):[];
   const chip=v=>`<span class="adm-chip">${esc(v.variantName||'Original')}${items[v.id]>1?` ×${items[v.id]}`:''}<button data-action="adm:rm:${esc(v.id)}" title="Quitar">✕</button></span>`;
   return `<div class="adm-bar"><input data-adm-invq placeholder="Buscar objeto…" value="${esc(A.invQ)}"><select data-adm-invcat>${opts([['all','Todas las categorías'],...Object.entries(CATEGORIES)],A.invCat)}</select><span class="muted">${Object.keys(items).length} objetos distintos</span></div>
<h3>LO QUE TIENE</h3><div class="adm-items">${ownedBases.slice(0,60).map(b=>{const g=groupOf(b),have=g.filter(v=>items[v.id]);return `<div class="adm-item-row owned"><span class="dot" style="background:${rarityById(b.rarity).color}"></span>${thumb(b.id)}<b>${esc(b.name)}</b><small>${esc(CATEGORIES[b.category])} · ${have.length} de ${g.length}${g.length>1?' colores':''}</small><span class="adm-chips">${have.map(chip).join('')}</span></div>`}).join('')||'<p class="muted">Nada que mostrar con ese filtro.</p>'}</div>
<h3>AÑADIR OBJETO</h3><p class="muted">Busca el objeto (por ejemplo «explosión» o «splash») y elige el color. No se pueden añadir objetos que el jugador ya tiene.</p><div class="adm-items">${addable.map(b=>{const miss=groupOf(b).filter(v=>!items[v.id]);return `<div class="adm-item-row">${thumb(b.id)}<b>${esc(b.name)}</b><small>${esc(CATEGORIES[b.category])}</small><span class="adm-add">${miss.length>1||miss[0]?.variantOf?`<select id="adm-add-${esc(b.id)}">${miss.map(v=>`<option value="${esc(v.id)}">${esc(v.variantName||'Color original')}</option>`).join('')}</select>`:`<input type="hidden" id="adm-add-${esc(b.id)}" value="${esc(miss[0].id)}">`}<button data-action="adm:add:${esc(b.id)}">AÑADIR</button></span></div>`}).join('')||(q||A.invCat!=='all'?'<p class="muted">Ya tiene todo lo que coincide con la búsqueda.</p>':'<p class="muted">Escribe en el buscador o elige una categoría para ver objetos que añadir.</p>')}</div>`;
  }
  if(A.section==='drops')return `<div class="adm-drops">${DROP_TYPES.map(t=>`<div class="adm-drop"><b style="color:${rarityById(t).color}">${esc(rarityById(t).name.split(' · ')[0])}</b><span class="adm-qty"><button data-action="adm:drop:${t}:-1">−</button><input type="number" min="0" data-adm-set="inventory.drops.${t}" data-type="num" value="${e.inventory.drops[t]||0}"><button data-action="adm:drop:${t}:1">+</button></span></div>`).join('')}</div>`;
  if(A.section==='progreso'){const p=e.progress;return `<div class="adm-grid2"><div>${field('XP TOTAL','progress.xp','number')}${field('PARTIDOS','progress.totals.matches','number')}${field('VICTORIAS','progress.totals.wins','number')}${field('GOLES','progress.totals.goals','number')}${field('ASISTENCIAS','progress.totals.assists','number')}${field('SALVADAS','progress.totals.saves','number')}${field('TIROS','progress.totals.shots','number')}<label class="adm-check"><input type="checkbox" data-adm-set="progress.tutorial" ${p.tutorial?'checked':''}> Tutorial completado</label></div><div>${RANK_KEYS.map(l=>`<fieldset class="adm-rank"><legend>${esc(keyLabel(l))}</legend>${field('MMR',`progress.ranked.${l}.mmr`,'number')}${field('PARTIDOS COMPETITIVOS',`progress.ranked.${l}.played`,'number')}${field('VICTORIAS',`progress.ranked.${l}.wins`,'number')}</fieldset>`).join('')}<p class="muted">Rango alcanzado más alto: ${p.peak>=0?esc(RANKS[p.peak]):'ninguno'} (se recalcula al guardar). Marcos y banners de rango se dan solos.</p></div></div>`}
  if(A.section==='creditos')return `<div class="adm-credits"><p class="adm-big">◈ <b>${e.credits.toLocaleString('es')}</b> créditos</p><div class="adm-buttons">${[-5000,-1000,-500,-100,100,500,1000,5000].map(n=>`<button data-action="adm:cred:${n}" class="${n<0?'danger':''}">${n>0?'+':''}${n}</button>`).join('')}</div>${field('FIJAR CANTIDAD EXACTA','credits','number')}<p class="muted">Los créditos se ganan con misiones, el Rocket Pass y drops, y se gastan en la tienda. Guarda para aplicar el cambio.</p></div>`;
  if(A.section==='partidas')return historyHTML(fromRows(det.history),{empty:'Este jugador todavía no tiene partidas registradas online.'});
  if(A.section==='vivo'){const pr=det.presence;if(pr?.online&&pr.status==='playing'&&pr.live){const s=pr.live.score||[0,0];return `<p><b>JUGANDO AHORA</b> · ${esc(pr.live.label||'')}</p><div class="adm-score"><label>AZUL<input type="number" min="0" max="99" id="adm-live-b-${esc(A.sel)}" value="${s[0]}"></label><label>NARANJA<input type="number" min="0" max="99" id="adm-live-o-${esc(A.sel)}" value="${s[1]}"></label><button class="primary" data-action="adm:livescore:${esc(A.sel)}">CAMBIAR MARCADOR</button></div><div class="adm-score"><label>MINUTOS<input type="number" min="0" max="60" id="adm-live-m" value="${Math.floor((pr.live.remaining||0)/60)}"></label><label>SEGUNDOS<input type="number" min="0" max="59" id="adm-live-s" value="${(pr.live.remaining||0)%60}"></label><button data-action="adm:livetime:${esc(A.sel)}">CAMBIAR TIEMPO</button></div><p class="muted">El cambio le llega al jugador en unos 5 segundos. Esta vista se actualiza sola.</p>`}return `<p class="muted">${pr?.online?'Está en línea (menús), no en un partido.':'No está en línea.'} Cuando juegue un partido podrás ver y editar su marcador aquí.</p>`}
  if(A.section==='cuenta'){const pr=det.presence;return `<div class="adm-info"><p><b>Correo:</b> ${esc(det.email)}</p><p><b>ID:</b> <code>${esc(det.id)}</code></p><p><b>Se unió:</b> ${esc(fmtDate(det.created_at))}</p><p><b>Último inicio de sesión:</b> ${esc(fmtDate(det.last_sign_in_at))}</p><p><b>Visto por última vez:</b> ${pr?(pr.online?'● EN LÍNEA ahora':esc(fmtDate(pr.last_seen))):'sin datos'}</p></div><button class="danger" data-action="adm:delete">ELIMINAR CUENTA…</button>`}
  return '';
 }
 function playerHTML(){
  if(!A.edit)return `<div class="page-title">JUGADOR</div><p class="muted">Cargando…</p><button data-action="admin" class="back">‹ VOLVER</button>`;
  const e=A.edit,cos=e.garage.cosmetics,pr=A.det?.presence,av=avatarNow(),lvl=levelInfo(e.progress.xp).level;
  const status=pr?(pr.online?`<span class="adm-status on">● EN LÍNEA${pr.status==='playing'&&pr.live?` · JUGANDO ${esc(pr.live.label||'')} ${(pr.live.score||[0,0]).join('–')}`:''}</span>`:`<span class="adm-status">Última vez: ${esc(ago(pr.last_seen))}</span>`):`<span class="adm-status">Última conexión: ${esc(ago(A.det?.last_sign_in_at))}</span>`;
  return `<div class="page-title">JUGADOR</div><div class="adm-head">${carImg({body:e.garage.body,color:e.garage.color,cos:cos},'adm-car mid')}${cardHTML({name:e.garage.name,identity:{frame:cos.frame,banner:cos.banner,title:cos.title,avatar:validAvatar(av)?av:null},sub:`Nv. ${lvl} · ${bestRank(Object.fromEntries(PLAYLISTS.flatMap(l=>[['mmr_'+l,e.progress.ranked[l].mmr],['played_'+l,e.progress.ranked[l].played]])))}`,size:'md'})}<div><b>${esc(A.det.email||'')}</b>${status}${A.dirty?'<span class="adm-dirty">● CAMBIOS SIN GUARDAR</span>':''}</div><button class="primary" data-action="adm:save" ${A.busy?'disabled':''}>GUARDAR CAMBIOS</button><button data-action="adm:reload">DESCARTAR / RECARGAR</button></div><div class="podio-tabs">${SECTIONS.map(([k,t])=>`<button data-action="adm:section:${k}" class="${A.section===k?'selected':''}">${t}</button>`).join('')}</div><section class="panel adm-section">${sectionHTML()}</section><button data-action="admin" class="back">‹ JUGADORES</button>`;
 }
 // ───────── acciones ─────────
 async function save(){
  const e=A.edit;if(!e)return;A.busy=true;rerender();
  try{
   const cos=e.garage.cosmetics;for(const id of [e.garage.body,...Object.values(cos)])own(id);
   const pr=e.progress=cleanProgress(e.progress);for(const l of RANK_KEYS){const r=pr.ranked[l];r.step=Math.min(84,Math.floor(r.mmr/20))}
   e.progress=cleanProgress(pr);e.garage.name=e.garage.name.slice(0,24)||'Jugador';
   if(A.avatarNew!==undefined)e.identity={...(e.identity||{}),avatar:A.avatarNew||null,avatarStatus:A.avatarNew?'approved':'none',avatarNote:''};
   const pub={name:e.garage.name,frame:cos.frame,banner:cos.banner,title:cos.title==='title-none'?'':cos.title,level:levelInfo(e.progress.xp).level};
   for(const l of PLAYLISTS){pub['mmr_'+l]=e.progress.ranked[l].mmr;pub['played_'+l]=e.progress.ranked[l].played}
   if(A.avatarNew!==undefined)pub.avatar=A.avatarNew;
   await social().adminSavePlayer(A.sel,e,pub);A.dirty=false;A.avatarNew=undefined;toast('Cambios guardados. El jugador los recibirá en unos segundos.');await refreshDetail();
  }catch(error){toast(error.message||'No se pudo guardar')}finally{A.busy=false;rerender()}
 }
 async function remove(){
  const name=A.edit.garage.name;
  if(!confirm(`¿Eliminar la cuenta de «${name}»?\nSe borrarán su progreso, inventario, historial, foto y tarjeta del podio.`))return;
  if(!confirm('Esta acción es PERMANENTE y no se puede deshacer.\n¿Estás completamente seguro?'))return;
  const t1=prompt(`Para continuar escribe el nombre exacto del jugador:\n${name}`);if(t1!==name){toast('Cancelado: el nombre no coincide.');return}
  const t2=prompt('Última confirmación: escribe ELIMINAR (en mayúsculas).');if(t2!=='ELIMINAR'){toast('Cancelado.');return}
  await safe(async()=>{await social().adminDeleteUser(A.sel);toast('Cuenta eliminada.');A.sel=A.det=A.edit=null;await loadPlayers();goto('admin','profile')});
 }
 async function sendLive(kind,uid){
  const g=id=>document.getElementById(id);
  if(kind==='score'){const b=Math.max(0,Math.min(99,Math.floor(Number(g('adm-live-b-'+uid)?.value)||0))),o=Math.max(0,Math.min(99,Math.floor(Number(g('adm-live-o-'+uid)?.value)||0)));await safe(async()=>{await social().adminCommand(uid,'set-score',{score:[b,o]});toast(`Marcador enviado: ${b}–${o}`)})}
  else{const m=Math.max(0,Math.min(60,Math.floor(Number(g('adm-live-m')?.value)||0))),s=Math.max(0,Math.min(59,Math.floor(Number(g('adm-live-s')?.value)||0)));await safe(async()=>{await social().adminCommand(uid,'set-time',{remaining:m*60+s});toast(`Tiempo enviado: ${m}:${String(s).padStart(2,'0')}`)})}
 }
 async function action(a){
  const [k,x,y]=a.split(':');
  if(k==='open'){await safe(()=>open(x));return}
  if(k==='section'){A.section=x;rerender();return}
  if(k==='more'){A.shown+=24;rerender();return}
  if(k==='save'){await save();return}
  if(k==='reload'){if(A.dirty&&!confirm('¿Descartar los cambios sin guardar?'))return;A.dirty=false;A.avatarNew=undefined;await safe(()=>open(A.sel));return}
  if(k==='cred'){A.edit.credits=Math.max(0,Math.min(1e9,(A.edit.credits||0)+Number(x)));A.dirty=true;rerender();return}
  if(k==='shop-rm'){const c=A.shopCfg,day=dayKey();if(c.removed.day!==day)c.removed={day,ids:[]};const i=c.removed.ids.indexOf(x);if(i>=0)c.removed.ids.splice(i,1);else c.removed.ids.push(x);rerender();return}
  if(k==='shop-excl'){if(!A.shopCfg.excluded.includes(x))A.shopCfg.excluded.push(x);rerender();return}
  if(k==='shop-incl'){A.shopCfg.excluded=A.shopCfg.excluded.filter(id=>id!==x);rerender();return}
  if(k==='shop-save'){await safe(async()=>{const c=A.shopCfg;await social().adminSetShop(c.excluded,c.removed.day?c.removed:{});toast('Tienda guardada. Los jugadores la verán en menos de un minuto.')});return}
  if(k==='add'){const id=document.getElementById('adm-add-'+x)?.value,it=A.edit.inventory.items;if(!id)return;if(it[id]){toast('El jugador ya tiene ese objeto.');return}it[id]=1;A.dirty=true;rerender();return}
  if(k==='rm'){const it=A.edit.inventory.items,c=A.edit.garage.cosmetics;delete it[x];for(const [cat,id] of Object.entries(c))if(id===x)c[cat]=DEFAULT_COSMETICS[cat];if(A.edit.garage.body===x)A.edit.garage.body='octane';A.dirty=true;rerender();return}
  if(k==='drop'){const d=A.edit.inventory.drops;d[x]=Math.max(0,(d[x]||0)+Number(y));A.dirty=true;rerender();return}
  if(k==='avatar-pick'){document.getElementById('adm-avatar-file')?.click();return}
  if(k==='avatar-remove'){A.avatarNew='';A.dirty=true;rerender();return}
  if(k==='delete'){await remove();return}
  if(k==='livescore'){await sendLive('score',x);return}
  if(k==='livetime'){await sendLive('time',x);return}
 }
 async function change(el){
  if(el.hasAttribute('data-adm-q')){A.q=el.value;A.shown=24;rerender();return}
  if(el.hasAttribute('data-adm-filter')){A.filter=el.value;A.shown=24;rerender();return}
  if(el.hasAttribute('data-adm-sort')){A.sort=el.value;A.shown=24;rerender();return}
  if(el.hasAttribute('data-adm-shopq')){A.shopQ=el.value;rerender();return}
  if(el.hasAttribute('data-adm-invq')){A.invQ=el.value;rerender();return}
  if(el.hasAttribute('data-adm-invcat')){A.invCat=el.value;rerender();return}
  if(el.id==='adm-avatar-file'){const f=el.files?.[0];el.value='';if(!f)return;await safe(async()=>{A.avatarNew=await resizeAvatar(f);A.dirty=true;rerender()});return}
  const path=el.dataset.admSet;if(!path||!A.edit)return;
  let v=el.type==='checkbox'?el.checked:el.value;if(el.dataset.type==='num')v=Math.max(0,Math.floor(Number(v)||0));
  setPath(A.edit,path,v);
  if(path==='garage.body'||path.startsWith('garage.cosmetics.'))own(v);
  if(path==='garage.name')A.edit.garage.name=String(v).replace(/[\x00-\x1f]/g,'').slice(0,24);
  A.dirty=true;rerender();
 }
 // refresco automático (lista y vista en vivo) sin pisar lo que se está escribiendo
 async function auto(scr){const t=document.activeElement;if(t&&(t.tagName==='INPUT'||t.tagName==='SELECT'||t.tagName==='TEXTAREA'))return;try{if(scr==='admin-player'){if(A.section==='ficha'&&!A.dirty)return;await refreshDetail()}else await loadPlayers();rerender()}catch{}}
 return{loadPlayers,loadShop,shopHTML,listHTML,playerHTML,action,change,auto,get section(){return A.section},get selected(){return A.sel}};
}
