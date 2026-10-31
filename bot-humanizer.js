import {humanTuning} from './bot-difficulty.js?v=rl-20261031';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Capa "humana" que se aplica encima de cualquier conductor: los jugadores reales
// no dirigen perfecto, se despistan un instante y no gastan el turbo al óptimo.
// Solo toca la dirección en suelo, el turbo y los despistes en suelo; en el aire
// nunca interfiere para que las acrobacias no se rompan.
export class Humanizer{
 constructor(){this.reset()}
 reset(){this.time=0;this.phase=Math.random()*100;this.lapseUntil=0;this.nextLapse=1.5+Math.random()*3;this.gate=true;this.nextGate=0;this.last={}}
 apply(controls,skill,dt,{onGround=true,kind='rules'}={}){
  const h=humanTuning(skill);this.time+=dt;
  const scale=kind==='nexto'?.5:1; // Nexto ya trae su propio nivel de error por rango
  if(h.noise<=0&&h.lapseRate<=0&&h.boostUse>=1)return this.last=controls;
  const out={...controls};
  if(onGround){
   if(this.time>=this.nextLapse&&h.lapseRate>0){const length=h.lapseTime*(.5+Math.random()*.7)*scale;this.lapseUntil=this.time+length;this.nextLapse=this.time+length+(.5+Math.random())/(h.lapseRate*scale)}
   if(this.time<this.lapseUntil){
    // Despiste: sigue con lo último que hacía pero sin turbo ni saltos nuevos.
    return this.last={...this.last,jump:false,boost:false};
   }
   const p=this.phase+this.time,wobble=Math.sin(p*1.7)*.5+Math.sin(p*3.1)*.3+Math.sin(p*5.3)*.2;
   if(typeof out.steer==='number')out.steer=clamp(out.steer+wobble*h.noise*scale,-1,1);
  }
  if(kind!=='nexto'&&h.boostUse<1){
   if(this.time>=this.nextGate){this.nextGate=this.time+.8+Math.random()*1.2;this.gate=Math.random()<h.boostUse}
   if(!this.gate&&onGround)out.boost=false;
  }
  return this.last=out;
 }
}
