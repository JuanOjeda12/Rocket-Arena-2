import {ITEMS,DEFAULT_COSMETICS,itemById,dropById,cleanCosmetics} from './item-catalog.js?v=inventory-20261028';
const integer=n=>Math.max(0,Math.min(1e9,Math.floor(Number(n)||0)));
const DAY=86400000,EPOCH=Date.parse('2026-10-26T00:00:00Z');
export function seasonAt(now=Date.now()){const n=Math.max(0,Math.floor((now-EPOCH)/(28*DAY))),start=EPOCH+n*28*DAY;return{id:'arena-'+(n+1),number:n+1,start,end:start+28*DAY,stage:Math.min(3,Math.max(0,Math.floor((now-start)/(7*DAY))))}}
const weekAt=now=>Math.floor((now-Date.parse('2026-10-26T00:00:00Z'))/(7*DAY));
const stats=()=>({matches:0,wins:0,goals:0,saves:0,assists:0,shots:0,touches:0,points:0,garage:0,paint:0,equip:0,training:0});
export function cleanInventory(value,legacyBody='octane',now=Date.now()){
 const v=value&&typeof value==='object'?value:{},season=seasonAt(now),counts=stats();for(const k of Object.keys(counts))counts[k]=integer(v.counters?.[k]);
 const items={};for(const [id,n] of Object.entries(v.items||{}))if(itemById(id)&&integer(n))items[id]=integer(n);
 for(const id of ['octane',...Object.values(DEFAULT_COSMETICS)])items[id]=Math.max(1,items[id]||0);
 if(!value&&itemById(legacyBody)?.category==='body')items[legacyBody]=1;
 const drops=Object.fromEntries(['sport','special','deluxe','import','exotic','blackmarket'].map(id=>[id,integer(v.drops?.[id])]));
 const period=(old,id)=>old?.id===id?{id,baseline:{...stats(),...old.baseline},claimed:Array.isArray(old.claimed)?old.claimed.filter(x=>typeof x==='string').slice(-80):[],xp:integer(old.xp),tiers:Array.isArray(old.tiers)?[...new Set(old.tiers.filter(n=>Number.isInteger(n)&&n>=1&&n<=30))]:[]}:{id,baseline:{...counts},claimed:[],xp:0,tiers:[]};
 return{version:1,skipAnimation:!!v.skipAnimation,items,drops,counters:counts,driverClaims:Array.isArray(v.driverClaims)?v.driverClaims.filter(x=>typeof x==='string').slice(-30):[],week:period(v.week,weekAt(now)),season:period(v.season,season.id),receipts:Array.isArray(v.receipts)?v.receipts.filter(x=>typeof x==='string').slice(-100):[],opening:itemById(v.opening?.itemId)&&dropById(v.opening?.drop)?{id:String(v.opening.id).slice(0,100),itemId:v.opening.itemId,drop:v.opening.drop,duplicate:!!v.opening.duplicate}:null};
}
export function refreshPeriods(inv,now=Date.now()){const clean=cleanInventory(inv,'octane',now);Object.assign(inv,{week:clean.week,season:clean.season});return inv}
export function inventoryProfile(profile,inv){const cosmetics=cleanCosmetics(profile.cosmetics),body=inv.items[profile.body]?profile.body:'octane';for(const [k,id] of Object.entries(cosmetics))if(!inv.items[id])cosmetics[k]=DEFAULT_COSMETICS[k];return{...profile,body,cosmetics}}
export function equipItem(inv,profile,id){const i=itemById(id);if(!i||!inv.items[id])throw Error('Todavía no tienes este objeto.');inv.counters.equip++;return i.category==='body'?{...profile,body:id}:{...profile,cosmetics:{...cleanCosmetics(profile.cosmetics),[i.category]:id}}}
export function visitInventory(inv,event){if(['garage','paint','training'].includes(event))inv.counters[event]++}
const mission=(id,name,stat,target,drop,xp=500,stage=0)=>({id,name,stat,target,drop,xp,stage});
const DRIVER=[mission('garage','Tu primer garaje','garage',1,'sport',150),mission('paint','Dale tu color','paint',1,'sport',150),mission('training','Listo para entrenar','training',1,'sport',250),mission('match','Primer partido completo','matches',1,'special'),mission('goals','Olfato de gol','goals',3,'special'),mission('shots','Prueba de puntería','shots',8,'deluxe'),mission('save','Protege la portería','saves',2,'deluxe'),mission('wins','Tu primera racha','wins',3,'import',1000)];
const WEEKLY=[mission('matches','Sal al campo','matches',4,'sport'),mission('goals','Redes en movimiento','goals',8,'special'),mission('shots','Bajo presión','shots',20,'special'),mission('saves','Última defensa','saves',3,'deluxe'),mission('wins','Semana de victorias','wins',3,'deluxe',750),mission('assist','En equipo','assists',3,'special')];
const SEASON=[mission('s1m','Calentamiento','matches',5,'special',750,0),mission('s1g','Primeros goles','goals',10,'deluxe',750,0),mission('s2m','Mantén el ritmo','matches',10,'deluxe',1000,1),mission('s2s','Tirador de temporada','shots',40,'import',1000,1),mission('s3w','Camino a la cima','wins',10,'import',1250,2),mission('s3d','Muralla defensiva','saves',12,'deluxe',1250,2),mission('s4m','Veterano de la arena','matches',25,'exotic',1500,3),mission('s4g','Temporada goleadora','goals',50,'import',1500,3)];
export function missions(inv,group,now=Date.now()){
 refreshPeriods(inv,now);const definitions=group==='driver'?DRIVER:group==='weekly'?WEEKLY:SEASON,period=group==='weekly'?inv.week:inv.season,claimed=group==='driver'?inv.driverClaims:period.claimed;
 return definitions.map(m=>({...m,group,progress:Math.min(m.target,Math.max(0,inv.counters[m.stat]-(group==='driver'?0:integer(period.baseline[m.stat])))),claimed:claimed.includes(m.id),locked:group==='season'&&m.stage>seasonAt(now).stage}));
}
export function claimMission(inv,group,id,now=Date.now()){
 const m=missions(inv,group,now).find(m=>m.id===id);if(!m||m.claimed||m.locked||m.progress<m.target)throw Error('Esta misión todavía no se puede reclamar.');
 (group==='driver'?inv.driverClaims:group==='weekly'?inv.week.claimed:inv.season.claimed).push(id);inv.drops[m.drop]++;inv.season.xp+=m.xp;
 if(group==='season'&&inv.season.claimed.length===SEASON.length&&!inv.season.claimed.includes('bonus')){inv.season.claimed.push('bonus');inv.drops.import++}
 return m;
}
export function recordInventoryMatch(inv,result,now=Date.now()){
 refreshPeriods(inv,now);const s=result.stats||{};if(result.seconds<60||!(s.touches>0||s.points>0)||!result.id||inv.receipts.includes(result.id))return false;
 inv.receipts.push(result.id);inv.receipts=inv.receipts.slice(-100);inv.counters.matches++;inv.counters.wins+=Number(!!result.won);
 for(const key of ['goals','saves','assists','shots','touches','points'])inv.counters[key]+=integer(s[key]);
 inv.season.xp+=integer(result.xp??(result.seconds*4+Math.min(1000,s.points||0)*.15+(result.won?150:0)));return true;
}
const PASS_ITEMS={2:'decal-stripes',4:'finish-matte',5:'topper-cone',7:'wheels-silver',8:'paint-ice',10:'boost-lime',12:'fennec',13:'decal-checker',15:'finish-carbon',16:'topper-cap',18:'goal-frost',20:'dominus',21:'wheels-neon',23:'boost-violet',25:'decal-hex',27:'goal-solar',28:'topper-crown',30:'f1'};
export function rocketPass(inv,now=Date.now()){refreshPeriods(inv,now);return Array.from({length:30},(_,i)=>{const tier=i+1,item=PASS_ITEMS[tier],drop=tier===29?'exotic':tier>=24?'import':tier>=14?'deluxe':tier>=6?'special':'sport';return{tier,xp:i*1500,item,drop:item?null:drop,claimed:inv.season.tiers.includes(tier),unlocked:inv.season.xp>=i*1500}})}
export function claimPass(inv,tier,now=Date.now()){const r=rocketPass(inv,now).find(t=>t.tier===tier);if(!r||r.claimed||!r.unlocked)throw Error('Este nivel del pase todavía no se puede reclamar.');inv.season.tiers.push(tier);if(r.item)inv.items[r.item]=(inv.items[r.item]||0)+1;else inv.drops[r.drop]++;return r}
function randomUnit(){if(globalThis.crypto?.getRandomValues){const v=new Uint32Array(1);crypto.getRandomValues(v);return v[0]/4294967296}return Math.random()}
export function openDrop(inv,type,random=randomUnit){
 if(inv.opening)throw Error('Primero recoge el objeto del drop anterior.');const drop=dropById(type);if(!drop||!inv.drops[type])throw Error('No tienes este tipo de drop.');
 let r=random()*100,rarity=drop.contents.at(-1).rarity;for(const c of drop.contents){r-=c.weight;if(r<0){rarity=c.rarity;break}}
 const pool=ITEMS.filter(i=>i.rarity===rarity),item=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];if(!item)throw Error('No hay objetos en este drop.');
 const duplicate=!!inv.items[item.id];inv.drops[type]--;inv.items[item.id]=(inv.items[item.id]||0)+1;
 inv.opening={id:globalThis.crypto?.randomUUID?.()||Date.now()+'-'+random(),itemId:item.id,drop:type,duplicate};return inv.opening;
}
export function collectDrop(inv){const reward=inv.opening;inv.opening=null;return reward}
