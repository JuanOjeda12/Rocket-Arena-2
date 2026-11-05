import {mmrBotSkill} from './bot-difficulty.js?v=final2';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const PLAYLISTS=['1v1','2v2','3v3'];
// Heatseeker y Snow Day tienen sus propios rangos (uno por tamaño de equipo, como el fútbol normal): clave 'heatseeker-2v2'
export const MODES=['heatseeker','snowday'];
export const MODE_TITLE={heatseeker:'HEATSEEKER',snowday:'SNOW DAY'};
export const ratingKey=(mode,playlist)=>MODES.includes(mode)?mode+'-'+playlist:playlist;
export const RANK_KEYS=[...PLAYLISTS,...MODES.flatMap(m=>PLAYLISTS.map(p=>m+'-'+p))];
export const keyLabel=k=>{const i=String(k).indexOf('-');return i<0?String(k):MODE_TITLE[k.slice(0,i)]+' '+k.slice(i+1)};
export const RANKS=['Bronce','Plata','Oro','Platino','Diamante','Campeón','Gran Campeón','Leyenda Supersónica'];
export const RANK_COLORS=['#c79568','#b9c9d7','#f4ca62','#75dde1','#559dff','#bc91ff','#ff777f','#f6e9ff'];
const integer=(n,fallback=0)=>Number.isFinite(Number(n))?Math.max(0,Math.floor(Number(n))):fallback;
export function emptyProgress(){return{version:1,xp:0,ranked:Object.fromEntries(RANK_KEYS.map(p=>[p,{mmr:400,played:0,wins:0,step:20}])),totals:{matches:0,wins:0,goals:0,assists:0,saves:0,shots:0},recent:[],pending:null,tutorial:false,peak:-1}}
export function cleanProgress(value={}){
 const p=emptyProgress();p.xp=integer(value.xp);
 for(const key of Object.keys(p.totals))p.totals[key]=integer(value.totals?.[key]);
 for(const list of RANK_KEYS){const r=value.ranked?.[list]||{};p.ranked[list]={mmr:clamp(integer(r.mmr,400),0,2400),played:integer(r.played),wins:integer(r.wins),step:clamp(integer(r.step,Math.floor(integer(r.mmr,400)/20)),0,84)}}
 p.tutorial=value.tutorial===true;
 p.peak=Math.max(-1,Math.min(7,Math.floor(Number(value.peak))||-1));for(const list of RANK_KEYS){const ri=rankInfo(p.ranked[list]);if(ri.placed)p.peak=Math.max(p.peak,ri.family)}   // rango más alto alcanzado en cualquier modo (no baja nunca)
 p.recent=Array.isArray(value.recent)?value.recent.filter(id=>typeof id==='string').slice(-100):[];
 if(value.pending&&typeof value.pending.id==='string'&&['casual','competitive'].includes(value.pending.mode)&&RANK_KEYS.includes(value.pending.playlist))p.pending={...value.pending};
 return p;
}
export function rankInfo(record){
 const placed=(record?.played||0)>=10,step=clamp(record?.step??Math.floor((record?.mmr??400)/20),0,84),tier=Math.floor(step/4),family=tier===21?7:Math.floor(tier/3),stage=tier===21?'':['I','II','III'][tier%3];
 return{placed,name:placed?`${RANKS[family]} ${stage}`.trim():'Sin rango',division:placed&&tier<21?step%4+1:null,family,color:placed?RANK_COLORS[family]:'#9cb0c2',step,mmr:record?.mmr??400,placements:Math.min(10,record?.played||0)};
}
export function rankBadge(rank,size=40){
 const shape=rank.family<2?'<path d="M32 5 54 17v27L32 59 10 44V17Z"/>':rank.family===2?'<path d="m9 42 3-27 13 13 7-22 7 22 13-13 3 27-23 15Z"/>':rank.family<5?'<path d="m32 5 25 16-25 38L7 21Z"/><path d="m18 23 14-9 14 9-14 22Z" fill="none" stroke-width="3"/>':rank.family<7?'<path d="m32 6 8 14 17-5-6 17 7 14-18-1-8 14-8-14-18 1 7-14-6-17 17 5Z"/>':'<path d="m32 4 26 15-8 28-18 13-18-13L6 19Z"/><path d="m19 23 13-7 13 7-13 22Z" fill="none" stroke-width="4"/>';
 return `<svg class="rank-badge" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true" style="color:${rank.color}"><g fill="currentColor" fill-opacity=".23" stroke="currentColor" stroke-width="2">${shape}</g><path d="m23 34 9-13 9 13-9 13Z" fill="currentColor"/></svg>`;
}
export function levelInfo(xp){let level=1,remaining=integer(xp);while(level<20){const needed=level*1000;if(remaining<needed)return{level,current:remaining,needed};remaining-=needed;level++}return{level:20+Math.floor(remaining/20000),current:remaining%20000,needed:20000}}
export const botSkill=record=>mmrBotSkill(record?.mmr??400);
export function completeResult(value,result){
 const p=cleanProgress(value);if(p.recent.includes(result.id))return{progress:p,award:null};
 p.pending=null;if(!['casual','competitive'].includes(result.mode)||!RANK_KEYS.includes(result.playlist))return{progress:p,award:null};
 const qualified=result.forfeit||result.seconds>=60;if(!qualified)return{progress:p,award:{xp:0,reason:'Completa al menos 60 segundos de partido para progresar.'}};
 p.recent.push(result.id);p.recent=p.recent.slice(-100);p.totals.matches++;if(result.won&&!result.forfeit)p.totals.wins++;
 const stats=result.stats||{};for(const key of ['goals','assists','saves','shots'])p.totals[key]+=integer(stats[key]);
 const beforeLevel=levelInfo(p.xp),record=p.ranked[result.playlist],beforeRank=rankInfo(record);let delta=0;
 if(result.mode==='competitive'){
  const expected=1/(1+10**(((result.opponentMmr??record.mmr+40)-record.mmr)/400)),k=record.played<10?80:32;
  delta=Math.round(k*((result.won&&!result.forfeit?1:0)-expected));const mmr=clamp(record.mmr+delta,0,2400);delta=mmr-record.mmr;record.mmr=mmr;record.played++;if(result.won&&!result.forfeit)record.wins++;
  const raw=Math.min(84,Math.floor(mmr/20));record.step=record.played<=10||raw>record.step?raw:mmr<record.step*20-5?Math.min(84,Math.floor((mmr+5)/20)):record.step;
 }
 const active=integer(stats.touches)>0||integer(stats.points)>0,xp=result.forfeit||!active?0:Math.round(Math.min(1200,result.seconds)*4.5+100+(result.won?150:0)+(result.mvp?75:0)+Math.min(1000,integer(stats.points))*.1);
 {const ra=rankInfo(record);if(ra.placed)p.peak=Math.max(p.peak,ra.family)}
 p.xp+=xp;return{progress:p,award:{xp,delta,levelBefore:beforeLevel.level,levelAfter:levelInfo(p.xp).level,rankBefore:beforeRank,rankAfter:rankInfo(record),ranked:result.mode==='competitive',forfeit:!!result.forfeit,reason:!active?'Sin XP: necesitas participar en el partido.':null}};
}
