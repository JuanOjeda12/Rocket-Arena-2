// Identidad del jugador: marco, banner y foto de perfil (tarjeta tipo Rocket League), más las pantallas de Podio y Panel admin.
// Los marcos y banners son de dibujo propio (CSS + SVG); no se usa ninguna imagen de Rocket League.
import {rankInfo,rankBadge,PLAYLISTS,RANKS} from './progression.js?v=final2';
import {itemById,rarityById,ITEMS} from './item-catalog.js?v=final2';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Color del título según su rareza: azul, amarillo y rojo lisos; los más raros con degradado de varios colores
const GRAD=g=>`background:linear-gradient(90deg,${g});-webkit-background-clip:text;background-clip:text;color:transparent`;
const TITLE_STYLE={base:'color:#c7d4df',sport:'color:#8fdcff',special:'color:#6fb0ff',deluxe:'color:#ffd23f',import:'color:#ff4d5e',exotic:GRAD('#ffd23f,#ff9a3c,#ff4d5e,#ff6fae'),blackmarket:GRAD('#4de1ff,#6f7bff,#c25bff,#ff5fb0,#ffd23f')};
export const titleCss=r=>TITLE_STYLE[r]||TITLE_STYLE.base;
export const ADMIN_EMAIL='juanojeda@e.correosanbartolo.edu.co';

// c1/c2/c3: colores del degradado; acc: color de detalles; shape: emblema del extremo; tally: rayitas de la esquina (como las divisiones de rango)
const PAL=[
 {id:'acero',name:'Acero',c1:'#8fa6b8',c2:'#3a4a58',c3:'#0c141b',acc:'#cfe3f2',shape:'ring',tally:0},
 {id:'cobre',name:'Bronce',c1:'#e8a05a',c2:'#8a4a1c',c3:'#2a1407',acc:'#ffb36b',shape:'circle',tally:1},
 {id:'plata',name:'Plata',c1:'#f0f5f8',c2:'#7b8993',c3:'#222a30',acc:'#eef6fb',shape:'hexagon',tally:2},
 {id:'oro',name:'Oro',c1:'#ffe055',c2:'#b28400',c3:'#3a2a00',acc:'#ffe46b',shape:'triangle',tally:3},
 {id:'esmeralda',name:'Platino',c1:'#2fe0b5',c2:'#087562',c3:'#02261f',acc:'#62f5d2',shape:'star',tally:4},
 {id:'zafiro',name:'Diamante',c1:'#3d8bff',c2:'#0a37a3',c3:'#03153f',acc:'#6eb0ff',shape:'gem',tally:5},
 {id:'amatista',name:'Campeón',c1:'#b058ff',c2:'#471a96',c3:'#170636',acc:'#d6a5ff',shape:'twin',tally:6},
 {id:'rubi',name:'Gran Campeón',c1:'#ff4a5e',c2:'#860f22',c3:'#2f040b',acc:'#ff909c',shape:'crown',tally:7},
 {id:'leyenda',name:'Leyenda Supersónica',c1:'#f6ecff',c2:'#7b5cc4',c3:'#1d1038',acc:'#efe0ff',shape:'sonic',tally:8}
];
export const FRAMES=PAL.map(p=>({...p,id:'frame-'+p.id}));
export const BANNERS=PAL.map(p=>({...p,id:'banner-'+p.id}));
const byId=(list,id)=>list.find(x=>x.id===id)||list[0];
export const frameById=id=>byId(FRAMES,id),bannerById=id=>byId(BANNERS,id);
const TIER_PAL=['cobre','plata','oro','esmeralda','zafiro','amatista','rubi','leyenda'];
// Los bots llevan el banner de su rango (0 = Bronce … 7 = Leyenda).
export function botIdentity(rank=0){const k=TIER_PAL[Math.max(0,Math.min(7,Math.floor(Number(rank)||0)))];return{frame:'frame-'+k,banner:'banner-'+k,avatar:null}}

const AVATAR=/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;
export const validAvatar=v=>typeof v==='string'&&v.length<60000&&AVATAR.test(v);
export function cleanIdentity(v={}){
 const status=['none','pending','approved','rejected'].includes(v?.avatarStatus)?v.avatarStatus:'none';
 return{frame:frameById(v?.frame).id,banner:bannerById(v?.banner).id,title:itemById(v?.title)?.category==='title'?v.title:'title-none',avatar:validAvatar(v?.avatar)?v.avatar:null,avatarStatus:status,avatarNote:String(v?.avatarNote||'').replace(/[\x00-\x1f]/g,'').slice(0,200)};
}

const SHAPES={
 ring:'<circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/>',
 circle:'<circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="2.6"/>',
 hexagon:'<path d="M12 3.2 19.6 7.6v8.8L12 20.8l-7.6-4.4V7.6Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
 triangle:'<path d="M12 4.2 20 18.6H4Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>',
 star:'<path d="m12 3.4 2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.8l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
 gem:'<path d="M7 4h10l4 5-9 11L3 9Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M3 9h18M9 4l3 16m3-16-3 16" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".7"/>',
 twin:'<path d="M12 2.8 19 12l-7 9.2L5 12Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="m12 8 2.7 4-2.7 4-2.7-4Z" fill="currentColor"/>',
 sonic:'<path d="M13.5 2.5 5.5 13.2h5.6l-1.3 8.3 8.7-11.4h-5.7Z" fill="currentColor" fill-opacity=".3" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
 crown:'<path d="m3.6 8.4 4.4 3.2L12 4.2l4 7.4 4.4-3.2-2 10.4H5.6Z" fill="currentColor" fill-opacity=".35" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
};
export const emblem=(shape,size='1em')=>`<svg class="pc-emblem" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${SHAPES[shape]||SHAPES.ring}</svg>`;
const avatarInner=(name,avatar)=>validAvatar(avatar)?`<img alt="" src="${avatar}" draggable="false">`:`<b>${esc(String(name||'?').trim().slice(0,1).toUpperCase()||'?')}</b>`;

// Solo el marco con la foto (para los selectores y el podio).
export function frameHTML(frameId,{name='',avatar=null,size=''}={}){
 const f=frameById(frameId);
 return `<span class="pc-frame ${size}" style="--f1:${f.c1};--f2:${f.c2};--fa:${f.acc}"><span class="pc-avatar">${avatarInner(name,avatar)}</span><i class="pc-badge">${emblem(f.shape,'1.05em')}</i><i class="pc-tally">${'/'.repeat(f.tally)}</i></span>`;
}
// Tarjeta completa: marco + foto + banner + nombre + rango.
export function cardHTML({name='Jugador',identity=null,sub='',size='',tag=''}={}){
 const id=cleanIdentity(identity||{}),f=frameById(id.frame),b=bannerById(id.banner),ti=itemById(id.title),tt=ti&&ti.id!=='title-none'?ti:null;
 return `<div class="pcard ${size}${tt?' has-title':''}" style="--f1:${f.c1};--f2:${f.c2};--fa:${f.acc};--b1:${b.c1};--b2:${b.c2};--b3:${b.c3};--ba:${b.acc}"><span class="pc-frame"><span class="pc-avatar">${avatarInner(name,id.avatar)}</span><i class="pc-badge">${emblem(f.shape,'1.05em')}</i><i class="pc-tally">${'/'.repeat(f.tally)}</i></span><div class="pc-bar"><span class="pc-name">${esc(name)}</span>${tt?`<span class="pc-title" style="${titleCss(tt.rarity)}">${esc(tt.name)}</span>`:''}${sub?`<span class="pc-sub">${esc(sub)}</span>`:''}<span class="pc-end">${emblem(b.shape,'1.9em')}</span></div>${tag?`<em class="pc-tag">${esc(tag)}</em>`:''}</div>`;
}
const lockNote=id=>{const it=itemById(id);return it?.rank!=null?`🔒 Por rango`:''};
export function bannerSwatch(b,selected,owned=true){return `<button class="id-opt ${selected?'selected':''} ${owned?'':'locked'}" data-action="${owned?'banner:':'lock:'}${b.id}" style="--b1:${b.c1};--b2:${b.c2};--b3:${b.c3};--ba:${b.acc}"><span class="pc-mini"><i class="pc-mini-bar"></i><i class="pc-mini-end">${emblem(b.shape,'1.4em')}</i></span><small>${esc(b.name)}${owned?'':`<br>${lockNote(b.id)}`}</small></button>`}
export function frameSwatch(f,selected,identity,name,owned=true){return `<button class="id-opt ${selected?'selected':''} ${owned?'':'locked'}" data-action="${owned?'frame:':'lock:'}${f.id}">${frameHTML(f.id,{name,avatar:identity.avatar,size:'mini'})}<small>${esc(f.name)}${owned?'':`<br>${lockNote(f.id)}`}</small></button>`}

const STATUS={
 none:'Sin foto. Se muestra tu inicial.',
 pending:'⏳ En revisión: se mostrará cuando el administrador la apruebe.',
 approved:'✔ Foto aprobada.',
 rejected:'✖ La foto no fue aprobada.'
};
// Redimensiona y recorta al centro a 160×160 (JPEG) para que pese poco y se pueda revisar rápido.
export async function resizeAvatar(file){
 if(!file||!/^image\//.test(file.type))throw Error('Elige una imagen (JPG, PNG o WebP).');
 if(file.size>12*1024*1024)throw Error('La imagen es demasiado grande (máximo 12 MB).');
 const bmp=await createImageBitmap(file),side=Math.min(bmp.width,bmp.height),canvas=document.createElement('canvas');canvas.width=canvas.height=160;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,160,160);ctx.drawImage(bmp,(bmp.width-side)/2,(bmp.height-side)/2,side,side,0,0,160,160);bmp.close?.();
 for(const q of [.86,.74,.6,.45]){const url=canvas.toDataURL('image/jpeg',q);if(validAvatar(url))return url}
 throw Error('No se pudo reducir la imagen.');
}
export function editorHTML({name,identity,signedIn,configured,rankLine,isAdmin,owns=()=>true}){
 const id=cleanIdentity(identity),sub=rankLine||'Sin rango';
 return `<section class="panel identity-panel"><span class="eyebrow">IDENTIDAD</span><h2>MARCO, BANNER Y FOTO</h2><p class="muted">Así te ven los demás: al meter un gol, en el menú y en el podio. Acero es el de inicio. Cada uno de los demás se desbloquea al llegar a ese rango en cualquier modo (1v1, 2v2 o 3v3); no salen en drops. También los equipas desde el INVENTARIO.</p><div class="id-preview">${cardHTML({name,identity:id,sub,size:'lg'})}</div>
 <h3>MARCO</h3><div class="id-grid">${FRAMES.map(f=>frameSwatch(f,f.id===id.frame,id,name,owns(f.id))).join('')}</div>
 <h3>BANNER</h3><div class="id-grid">${BANNERS.map(b=>bannerSwatch(b,b.id===id.banner,owns(b.id))).join('')}</div>
 <h3>TÍTULO</h3><div class="title-grid">${ITEMS.filter(i=>i.category==='title'&&owns(i.id)).map(i=>`<button class="id-opt title-opt ${i.id===id.title?'selected':''}" data-action="title:${i.id}" style="${titleCss(i.rarity)}">${esc(i.name)}</button>`).join('')}</div><p class="muted">${ITEMS.filter(i=>i.category==='title'&&owns(i.id)).length-1} de ${ITEMS.filter(i=>i.category==='title').length-1} títulos conseguidos (drops, misiones y Rocket Pass).</p>
 <h3>FOTO DE PERFIL</h3>${signedIn&&configured?`<p class="id-status" data-status="${id.avatarStatus}">${STATUS[id.avatarStatus]}${id.avatarStatus==='rejected'&&id.avatarNote?` Motivo: ${esc(id.avatarNote)}`:''}</p><div class="id-actions"><button data-action="avatar-pick">${id.avatar||id.avatarStatus==='pending'?'CAMBIAR FOTO':'SUBIR FOTO'}</button>${id.avatar?'<button data-action="avatar-remove" class="danger">QUITAR FOTO</button>':''}<input id="avatar-file" type="file" accept="image/*" hidden></div><p class="muted">Toda foto la revisa el administrador antes de mostrarse. Evita rostros de otras personas, contenido ofensivo o con derechos de autor.</p>`:`<p class="muted">${configured?'Inicia sesión con tu cuenta para subir una foto (se revisa antes de mostrarse).':'Las cuentas online aún no están configuradas.'} Mientras tanto puedes elegir marco y banner.</p>${configured?'<button data-action="account-login">CREAR CUENTA / ENTRAR</button>':''}`}
 <h3>HISTORIAL</h3><button data-action="history">VER MIS PARTIDAS</button>
 ${isAdmin?'<h3>ADMINISTRACIÓN</h3><button data-action="admin" class="primary">ABRIR PANEL ADMIN</button>':''}</section>`;
}

const ago=iso=>{const m=Math.max(0,Math.round((Date.now()-Date.parse(iso))/60000));return m<1?'ahora':m<60?`hace ${m} min`:m<1440?`hace ${Math.round(m/60)} h`:`hace ${Math.round(m/1440)} d`};
const rankLabel=r=>r.placed?r.name:'Sin rango';
export function podioHTML(s){
 const tabs=PLAYLISTS.map(p=>`<button data-action="podio:${p}" class="${p===s.playlist?'selected':''}">${p}</button>`).join('');
 let body;
 if(s.status==='loading')body='<p class="muted">Cargando clasificación…</p>';
 else if(s.status==='error')body=`<p class="muted">${esc(s.message||'No se pudo cargar la clasificación.')}</p>`;
 else if(!s.rows.length)body=`<p class="muted">Todavía nadie tiene rango en ${esc(s.playlist)}. Juega 10 partidos competitivos para aparecer aquí.</p>`;
 else{
  const row=(r,i)=>{const rk=rankInfo({mmr:r.mmr,played:r.played});return{r,i,rk,card:cardHTML({name:r.name,identity:{frame:r.frame,banner:r.banner,avatar:r.avatar,title:r.title},sub:`${rankLabel(rk)} · ${r.mmr} MMR`,size:'md',tag:r.id===s.meId?'TÚ':''})}};
  const rows=s.rows.map(row),top=[rows[1],rows[0],rows[2]].filter(Boolean);
  body=`<div class="podio-top">${top.map(x=>`<div class="podio-col p${x.i+1}"><div class="podio-badge">${rankBadge(x.rk,x.i===0?74:56)}</div>${x.card}<div class="podio-step"><b>${x.i+1}</b><small>${x.r.mmr} MMR · Nv. ${x.r.level}</small></div></div>`).join('')}</div>
  <div class="podio-list">${rows.slice(3).map(x=>`<div class="podio-row ${x.r.id===s.meId?'me':''}"><b class="podio-pos">${x.i+1}</b>${x.card}<span class="podio-mmr">${rankBadge(x.rk,34)}<b>${x.r.mmr}</b><small>MMR</small></span></div>`).join('')}</div>`;
 }
 return `<div class="page-title">PODIO</div><p class="page-sub">Los mejores jugadores por modalidad. Se necesitan 10 partidos competitivos para clasificar.</p><div class="podio-tabs">${tabs}<button data-action="podio-refresh">ACTUALIZAR</button></div>${s.mine?`<div class="podio-mine"><span class="eyebrow">TU TARJETA</span>${s.mine}</div>`:''}${body}<button data-action="home" class="back">‹ VOLVER</button>`;
}
export function adminHTML(s){
 const tabs=[['pending','FOTOS PENDIENTES'],['approved','FOTOS APROBADAS'],['players','JUGADORES'],['live','EN VIVO'],['shop','TIENDA']].map(([k,t])=>`<button data-action="admin-tab:${k}" class="${s.tab===k?'selected':''}">${t}${k==='pending'&&s.pendingCount!=null?` (${s.pendingCount})`:''}</button>`).join('');
 let body;
 if(s.custom&&s.status==='ok')body=s.custom;
 else if(s.status==='loading')body='<p class="muted">Cargando…</p>';
 else if(s.status==='error')body=`<p class="muted">${esc(s.message)}</p>`;
 else if(!s.items.length)body=`<p class="muted">${s.tab==='pending'?'No hay fotos pendientes. 🎉':s.tab==='approved'?'Aún no hay fotos aprobadas.':'Todavía no hay jugadores sincronizados.'}</p>`;
 else if(s.tab==='pending')body=`<div class="admin-grid">${s.items.map(i=>`<div class="admin-item"><img alt="Foto pendiente de ${esc(i.name)}" src="${validAvatar(i.image)?i.image:''}"><div><b>${esc(i.name)}</b><small>${esc(ago(i.created_at))} · ${esc(String(i.user_id).slice(0,8))}</small><div class="admin-buttons"><button class="primary" data-action="admin-approve:${esc(i.user_id)}">APROBAR</button><button class="danger" data-action="admin-reject:${esc(i.user_id)}">RECHAZAR</button></div></div></div>`).join('')}</div>`;
 else if(s.tab==='approved')body=`<div class="admin-grid">${s.items.map(i=>`<div class="admin-item"><img alt="" src="${validAvatar(i.avatar)?i.avatar:''}"><div><b>${esc(i.name)}</b><small>${esc(String(i.id).slice(0,8))}</small><div class="admin-buttons"><button class="danger" data-action="admin-revoke:${esc(i.id)}">RETIRAR FOTO</button></div></div></div>`).join('')}</div>`;
 else body=`<div class="admin-table">${s.items.map(i=>`<div class="admin-row ${i.hidden?'hidden-player':''}"><b>${esc(i.name)}</b><small>${esc(String(i.id).slice(0,8))} · 1v1 ${i.mmr_1v1} · 2v2 ${i.mmr_2v2} · 3v3 ${i.mmr_3v3}</small><button data-action="admin-hide:${esc(i.id)}:${i.hidden?0:1}" class="${i.hidden?'':'danger'}">${i.hidden?'MOSTRAR EN PODIO':'OCULTAR DEL PODIO'}</button></div>`).join('')}</div>`;
 return `<div class="page-title">PANEL ADMIN</div><p class="page-sub">Solo la cuenta administradora ve esto. Las fotos no se muestran a nadie hasta que las apruebes.</p><div class="podio-tabs">${tabs}<button data-action="admin-refresh">ACTUALIZAR</button></div>${body}<button data-action="profile" class="back">‹ VOLVER</button>`;
}
