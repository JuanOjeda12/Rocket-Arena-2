// Original procedural effects. No recordings or assets from Rocket League.
import {goalFrameHit} from './goal-contact.js?v=inventory-20261028';
export class GameAudio{
 constructor(){this.seen=new Set();this.previous=null;this.matchId=null;this.lastPhase='';try{this.muted=localStorage.getItem('rocket-audio-muted')==='true'}catch{this.muted=false}}
 async unlock(){try{if(!this.context){const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return;const c=this.context=new C();this.master=c.createGain();this.master.gain.value=this.muted?0:.32;this.master.connect(c.destination);
   this.engine=c.createOscillator();this.engine.type='sawtooth';this.engine.frequency.value=50;this.engineGain=c.createGain();this.engineGain.gain.value=0;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650;this.engine.connect(filter).connect(this.engineGain).connect(this.master);this.engine.start();
   const buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
   this.noiseBuffer=buffer;this.boost=c.createBufferSource();this.boost.buffer=buffer;this.boost.loop=true;const high=c.createBiquadFilter();high.type='bandpass';high.frequency.value=1600;this.boostGain=c.createGain();this.boostGain.gain.value=0;this.boost.connect(high).connect(this.boostGain).connect(this.master);this.boost.start();
  }if(this.context.state==='suspended')await this.context.resume()}catch{}}
 toggle(){this.muted=!this.muted;try{localStorage.setItem('rocket-audio-muted',String(this.muted))}catch{}if(this.context)this.master.gain.setTargetAtTime(this.muted?0:.32,this.context.currentTime,.03)}
 tone(frequency,duration=.15,gain=.2,type='sine',end=frequency){if(!this.context||this.muted||this.context.state!=='running')return;const c=this.context,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(frequency,c.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(1,end),c.currentTime+duration);g.gain.setValueAtTime(gain,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);o.connect(g).connect(this.master);o.start();o.stop(c.currentTime+duration);o.onended=()=>{o.disconnect();g.disconnect()}}
 noise(duration,gain,frequency=800){if(!this.context||this.muted||this.context.state!=='running')return;const c=this.context,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noiseBuffer;f.type='lowpass';f.frequency.value=frequency;g.gain.setValueAtTime(gain,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);s.connect(f).connect(g).connect(this.master);s.start();s.stop(c.currentTime+duration);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect()}}
 update(state,slot,active,dt){
  const c=this.context;if(!c)return;const car=state?.cars.find(v=>v.slot===slot),live=active&&state&&['live','replay'].includes(state.phase)&&!document.hidden;
  const speed=car?Math.hypot(...car.velocity):0;
  this.engine.frequency.setTargetAtTime(45+speed*5,c.currentTime,.08);this.engineGain.gain.setTargetAtTime(live&&car&&!car.isDemoed? .035+Math.min(.09,speed*.003):0,c.currentTime,.05);this.boostGain.gain.setTargetAtTime(live&&car?.isBoosting? .28:0,c.currentTime,.04);
  if(!state||!active){this.previous=null;return}if(state.matchId!==this.matchId){this.matchId=state.matchId;this.seen.clear();this.previous=null;this.lastPhase=''}
  for(const e of state.events||[]){if(this.seen.has(e.id))continue;this.seen.add(e.id);if(e.type==='goal'){this.tone(75,1,.7,'sine',25);this.noise(1.6,.65,1700);for(const f of [261.6,329.6,392,523.2])this.tone(f,1.4,.07)}else if(e.slot===slot){if(e.type==='flip-reset'){if(this.indicatorEnabled!==false)this.tone(1150,.18,.14,'sine',1750)}else this.tone(e.type==='epic-save'?880:660,.4,.15,'sine',1320)}}
  if(state.phase==='kickoff'&&Math.ceil(state.countdown)!==this.countdown){this.countdown=Math.ceil(state.countdown);this.tone(440,.11,.18)}
  if(this.lastPhase==='kickoff'&&state.phase==='live')this.tone(880,.3,.22);if(state.phase==='finished'&&this.lastPhase!=='finished'){this.tone(523,.7,.15);this.tone(784,1,.12)}this.lastPhase=state.phase;
  const p=this.previous;if(live&&p&&dt>0){
   if(car&&!car.onGround&&p.car?.onGround&&car.velocity[1]>1)this.tone(130,.2,.22,'triangle',350);
   if(car&&p.car&&car.boost>p.car.boost+2){this.tone(850,.16,.15,'sine',1700);if(car.boost-p.car.boost>30)this.tone(1300,.3,.12)}
   if(state.phase==='live'&&p.phase==='live'){const change=Math.hypot(...state.ball.velocity.map((v,i)=>v-p.ball.velocity[i]));if(change>2.5&&c.currentTime-(this.impactAt||-1)>.08){const distance=car?Math.hypot(...state.ball.position.map((v,i)=>v-car.position[i])):20,g=Math.min(.5,change*.025)/(1+distance*.04);if(goalFrameHit(p.ball,state.ball))this.postStrike(g);else{this.tone(95,.16,g,'sine',38);this.noise(.12,g,1400)}this.impactAt=c.currentTime}if(car&&p.car&&goalFrameHit(p.car,car,.65)&&c.currentTime-(this.postAt||-1)>.18){this.postStrike(.25);this.postAt=c.currentTime}}
  }this.previous={car:car?{position:car.position,velocity:car.velocity,onGround:car.onGround,boost:car.boost}:null,ball:state.ball,phase:state.phase};
 }
 postStrike(gain){this.tone(220,.15,gain,'triangle',150);this.tone(590,.65,gain*.45,'sine',550);this.tone(1270,.38,gain*.22);this.noise(.05,gain*.2,3200)}
}
