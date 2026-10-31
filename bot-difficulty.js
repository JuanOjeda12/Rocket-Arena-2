// Una sola curva progresiva para MMR competitivo y rangos de partidas privadas.
// TODO el balance de los bots vive en la tabla TIERS de abajo: cada fila tiene 8
// valores (Bronce, Plata, Oro, Platino, Diamante, Campeón, Gran Campeón, Leyenda
// Supersónica) y se interpola linealmente entre divisiones. Si un rango se siente
// demasiado fácil o difícil, cambia SOLO el número de esa columna.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const LEVELS=[.06,.10,.18,.28,.43,.62,.82,1];
export function rankBotSkill(rank){const t=clamp(Number(rank)||0,0,7),i=Math.floor(t);return i===7?1:LEVELS[i]+(LEVELS[i+1]-LEVELS[i])*(t-i)}
export const mmrBotSkill=mmr=>rankBotSkill(Math.max(0,Number(mmr)||0)/240);
export const nextoDecisionTicks=skill=>8+Math.round(18*Math.pow(1-clamp(Number(skill)||0,0,1),1.4));

// Convierte la curva continua de habilidad en un rango 0..7 sin saltos bruscos.
export function botRankFromSkill(skill){const s=clamp(Number(skill)||0,0,1);if(s<=LEVELS[0])return 0;for(let i=0;i<7;i++)if(s<LEVELS[i+1])return i+(s-LEVELS[i])/(LEVELS[i+1]-LEVELS[i]);return 7}

export const TIERS={
 //                   Bronce Plata  Oro   Plat  Diam  Camp  GC    SSL
 // Qué conductor usa cada bot (porcentaje de tiempo). El resto es el conductor por reglas.
 basicWeight:       [1,     1,     .10,  0,    0,    0,    0,    0],   // conductor sencillo
 nextoWeight:       [0,     0,     0,    0,    0,    .18,  .55,  1],   // IA Nexto (solo rangos altos)
 // Conductor por reglas (OpponentAI): velocidad de reacción y calidad de ejecución.
 think:             [.30,   .24,   .17,  .12,  .09,  .068, .052, .045], // segundos entre decisiones
 topSpeed:          [14,    16,    18,   19.5, 20.7, 21.7, 22.4, 23],   // m/s (23 = máximo del juego)
 prediction:        [1.0,   1.2,   1.5,  1.9,  2.2,  2.5,  2.8,  3.0],   // segundos que anticipa el balón
 accuracy:          [2.0,   2.4,   2.8,  3.1,  3.4,  3.7,  4.0,  4.2],   // ganancia de dirección
 jumpHeight:        [2.4,   2.6,   2.8,  3.2,  4.5,  6.5,  9,    12],     // altura máxima que intenta alcanzar
 boostAngle:        [.18,   .20,   .22,  .25,  .30,  .35,  .40,  .45],   // cuánto apunta antes de usar turbo
 // "Factor humano": errores que se aplican encima de cualquier conductor.
 noise:             [.30,   .22,   .11,  .10,  .06,  .035, .015, 0],     // temblor de la dirección
 lapseRate:         [.30,   .22,   .10,  .09,  .055, .03,  .012, 0],     // despistes por segundo
 lapseTime:         [.55,   .45,   .35,  .28,  .22,  .18,  .15,  0],     // duración de cada despiste (s)
 boostUse:          [.45,   .62,   .85,  .92,  .96,  .95,  1,    1]      // fracción del turbo que realmente usa
};
const at=(table,rank)=>{const t=clamp(Number(rank)||0,0,7),i=Math.min(6,Math.floor(t));return table[i]+(table[i+1]-table[i])*(t-i)};
export const tierValue=(name,skill)=>at(TIERS[name],botRankFromSkill(skill));

export function nextoAssistance(skill){return at(TIERS.nextoWeight,botRankFromSkill(skill))}

// Probabilidad de cada conductor para un nivel de habilidad. Suma siempre 1.
export function driverWeights(skill){
 const rank=botRankFromSkill(skill),nexto=at(TIERS.nextoWeight,rank),basic=Math.min(1-nexto,at(TIERS.basicWeight,rank));
 return{rank,nexto,basic,rules:Math.max(0,1-nexto-basic)};
}

// Parámetros del conductor por reglas (mismo formato que botProfile()).
export function rankedTuning(skill){
 const rank=botRankFromSkill(skill);
 return{skill:clamp(Number(skill)||0,0,1),rank,think:at(TIERS.think,rank),topSpeed:at(TIERS.topSpeed,rank),prediction:at(TIERS.prediction,rank),accuracy:at(TIERS.accuracy,rank),
  air:rank>=4.5,carry:rank>=6.4,speedFlip:rank>=3.5,jumpHeight:at(TIERS.jumpHeight,rank),boostAngle:at(TIERS.boostAngle,rank)};
}
// Parámetros del factor humano para un rango.
export function humanTuning(skill){
 const rank=botRankFromSkill(skill);
 return{rank,noise:at(TIERS.noise,rank),lapseRate:at(TIERS.lapseRate,rank),lapseTime:at(TIERS.lapseTime,rank),boostUse:at(TIERS.boostUse,rank)};
}

// Se conserva por compatibilidad: mezcla lineal de dos conjuntos de controles.
export function blendRankedControls(basic,neural,weight){
 if(weight<=0)return basic;if(weight>=1)return neural;
 const result={};for(const key of ['throttle','steer','pitch','yaw','roll'])result[key]=(basic[key]||0)*(1-weight)+(neural[key]||0)*weight;
 for(const key of ['jump','boost','handbrake'])result[key]=!!(weight>=.5?neural[key]:basic[key]);return result;
}
