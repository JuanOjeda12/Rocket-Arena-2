// Calidad gráfica: 5 niveles que bajan resolución, sombras, público, luces y partículas (también en la introducción).
export const GFX_LEVELS=[
 {id:'max',name:'Máximo',scale:1,shadow:true,shadowSize:1024,shadowEvery:50,crowd:1,lights:true,fx:1,info:['Resolución completa','Sombras nítidas','Público completo','Luces del estadio','Todas las partículas']},
 {id:'high',name:'Alto',scale:.85,shadow:true,shadowSize:1024,shadowEvery:80,crowd:1,lights:true,fx:.85,info:['Resolución al 85 %','Sombras nítidas (menos fluidas)','Público completo','Luces del estadio','85 % de las partículas']},
 {id:'mid',name:'Medio',scale:.7,shadow:true,shadowSize:512,shadowEvery:120,crowd:.6,lights:true,fx:.6,info:['Resolución al 70 %','Sombras suaves de baja resolución','60 % del público','Luces del estadio','60 % de las partículas']},
 {id:'low',name:'Bajo',scale:.55,shadow:false,shadowSize:512,shadowEvery:200,crowd:.3,lights:false,fx:.35,info:['Resolución al 55 %','Sin sombras','30 % del público','Sin luces extra del estadio','35 % de las partículas']},
 {id:'min',name:'Mínimo',scale:.4,shadow:false,shadowSize:512,shadowEvery:200,crowd:0,lights:false,fx:.15,info:['Resolución al 40 %','Sin sombras','Sin público','Sin luces extra del estadio','15 % de las partículas']}
];
export function loadGfx(){try{const v=JSON.parse(localStorage.getItem('rocket-graphics')||'null');return{level:Math.max(0,Math.min(GFX_LEVELS.length-1,Math.floor(Number(v?.level))||0)),fps30:v?.fps30===true}}catch{return{level:0,fps30:false}}}
export function saveGfx(g){try{localStorage.setItem('rocket-graphics',JSON.stringify({level:g.level,fps30:!!g.fps30}))}catch{}}
export function gfxHTML(g){
 const L=GFX_LEVELS[g.level];
 return `<section class="panel gfx-panel"><h2>GRÁFICOS</h2><p class="muted">Si el juego va lento, baja la calidad. Afecta a las partidas y también a la introducción.</p><div class="gfx-slider"><input id="gfx-level" type="range" min="0" max="${GFX_LEVELS.length-1}" step="1" value="${g.level}" aria-label="Calidad gráfica"><div class="gfx-ticks">${GFX_LEVELS.map((l,i)=>`<span class="${i===g.level?'on':''}">${l.name}</span>`).join('')}</div></div><ul id="gfx-desc" class="gfx-desc">${L.info.map(x=>`<li>${x}</li>`).join('')}</ul><button data-action="gfx-fps" class="${g.fps30?'selected':''}">LIMITAR A 30 FPS: ${g.fps30?'SÍ':'NO'}</button><p class="muted">Limitar a 30 FPS ahorra batería y calor en equipos justos.</p></section>`;
}
export const gfxDescHTML=level=>GFX_LEVELS[level].info.map(x=>`<li>${x}</li>`).join('');
