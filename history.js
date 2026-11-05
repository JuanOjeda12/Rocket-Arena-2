// Historial de partidas: modo, resultado y estadísticas de cada una (se guarda en tu cuenta y, si tienes sesión, también online para el administrador).
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const int=(n,max=999999)=>Math.max(0,Math.min(max,Math.floor(Number(n)||0)));
const MODE_LABEL={casual:'CASUAL',competitive:'COMPETITIVO',heatseeker:'HEATSEEKER',snowday:'SNOW DAY',privada:'PRIVADA LOCAL'};
export const modeLabel=m=>MODE_LABEL[m]||String(m||'').toUpperCase();
export const RESULT_LABEL={win:'VICTORIA',loss:'DERROTA',draw:'EMPATE'};
export function cleanHistory(v){
 if(!Array.isArray(v))return[];
 return v.filter(e=>e&&typeof e.id==='string').slice(-100).map(e=>({id:e.id.slice(0,100),t:Number(e.t)||0,mode:String(e.mode||'casual').slice(0,20),playlist:String(e.playlist||'').slice(0,8),result:['win','loss','draw'].includes(e.result)?e.result:'draw',sf:int(e.sf,999),sa:int(e.sa,999),seconds:int(e.seconds,86400),goals:int(e.goals),assists:int(e.assists),saves:int(e.saves),shots:int(e.shots),delta:Number.isFinite(Number(e.delta))&&e.delta!==null?Math.round(Number(e.delta)):null,forfeit:!!e.forfeit}));
}
// filas de la tabla match_history (servidor) → mismo formato que el historial local
export const fromRows=rows=>(rows||[]).map(r=>({id:r.client_id||r.id,t:Date.parse(r.played_at)||0,mode:r.mode,playlist:r.playlist,result:r.result,sf:r.score_for,sa:r.score_against,seconds:r.seconds,goals:r.goals,assists:r.assists,saves:r.saves,shots:r.shots,delta:r.mmr_delta,forfeit:r.forfeit}));
const dur=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
const when=t=>t?new Date(t).toLocaleString('es',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'—';
export function historyHTML(list,{empty='Todavía no hay partidas registradas. Juega un partido y aparecerá aquí.'}={}){
 const rows=[...list].sort((a,b)=>b.t-a.t);
 if(!rows.length)return `<p class="muted">${esc(empty)}</p>`;
 const wins=rows.filter(r=>r.result==='win').length,losses=rows.filter(r=>r.result==='loss').length;
 return `<p class="muted">${rows.length} partidas · ${wins} victorias · ${losses} derrotas</p><div class="history-list">${rows.map(r=>`<div class="history-row ${r.result}"><span class="hr-result">${RESULT_LABEL[r.result]}${r.forfeit?' · ABANDONO':''}</span><b class="hr-score">${r.sf} – ${r.sa}</b><span class="hr-mode">${esc(modeLabel(r.mode))}${r.playlist?' '+esc(r.playlist):''}</span><small class="hr-stats">${r.goals} goles · ${r.assists} asist. · ${r.saves} salvadas · ${dur(r.seconds)}${r.delta!=null?` · ${r.delta>0?'+':''}${r.delta} MMR`:''}</small><small class="hr-date">${when(r.t)}</small></div>`).join('')}</div>`;
}
