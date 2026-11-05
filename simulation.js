import {loadNecto} from './necto-model.js?v=final2';
import {NectoController} from './necto-controller.js?v=final2';
import {rankedScriptedProfile} from './bot-profile.js?v=final2';
import {BasicBot} from './basic-bot.js?v=final2';
import {rankedDriver} from './bot-difficulty.js?v=final2';
import {advanceCelebration,PODIUM_SECONDS} from './celebration.js?v=inventory-20261028';
import {createMatchEngine} from './engine/adapter.js?v=stadium-finale-20261027';
import {OpponentAI} from './opponent-ai.js?v=final2';
import {MatchFlow} from './match-flow.js?v=inventory-20261028';
import {carById,cleanProfile} from './catalog.js?v=final2';
import {MatchEvents} from './match-events.js?v=inventory-20261028';
import {MatchStats} from './match-stats.js?v=inventory-20261028';
import {incomingShot} from './ball-prediction.js?v=inventory-20261028';
import {BALL_RADIUS} from './proportions.js?v=inventory-20261028';
import {ARENA} from './arena-shape.js?v=final2';
import {loadNexto} from './nexto-model.js?v=inventory-20261028';
import {NextoController} from './nexto-controller.js?v=final2';
// ── Disco de Snow Day: hitbox cilíndrico (radio 1.4, medio grosor .25) sobre la física esférica del motor ──
const PUCK_R=1.4,PUCK_H=.25,PUCK_REST=.27;
const qmul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
const qaxis=(x,y,z,ang)=>{const k=Math.sin(ang/2);return[x*k,y*k,z*k,Math.cos(ang/2)]};
const qrot=(q,v)=>{const [x,y,z,w]=q,tx=2*(y*v[2]-z*v[1]),ty=2*(z*v[0]-x*v[2]),tz=2*(x*v[1]-y*v[0]);return[v[0]+w*tx+(y*tz-z*ty),v[1]+w*ty+(z*tx-x*tz),v[2]+w*tz+(x*ty-y*tx)]};
const qnorm=q=>{const n=Math.hypot(q[0],q[1],q[2],q[3])||1;return q.map(v=>v/n)};
// distancia desde un punto al borde de la arena (paredes con esquinas redondas, rampas y techo) y normal hacia el interior; null dentro de la portería
function arenaSDF(x,y,z){
 const {width:W,length:L,height:H,corner:R,ramp:r,goal:G,goalHeight:GH}=ARENA,ax=Math.abs(x),az=Math.abs(z),sx=x<0?-1:1,sz=z<0?-1:1;
 if(az>L-1&&ax<G+.5&&y<GH+.5)return null;
 const cx=W-R,cz=L-R,qx=ax-cx,qz=az-cz;let dp,nx,nz;
 if(qx>0&&qz>0){const h=Math.hypot(qx,qz)||1e-6;dp=R-h;nx=-sx*qx/h;nz=-sz*qz/h}else if(W-ax<L-az){dp=W-ax;nx=-sx;nz=0}else{dp=L-az;nx=0;nz=-sz}
 const dv=Math.min(y,H-y),ny=y<H-y?1:-1,a=r-dp,b=r-dv;
 if(a>0&&b>0){const h=Math.hypot(a,b)||1e-6;return{d:r-h,n:[a*nx/h,b*ny/h,a*nz/h]}}
 return dp<dv?{d:dp,n:[nx,0,nz]}:{d:dv,n:[0,ny,0]};
}
const puckSupport=(u,n)=>{const c=Math.abs(u[0]*n[0]+u[1]*n[1]+u[2]*n[2]);return PUCK_R*Math.sqrt(Math.max(0,1-c*c))+PUCK_H*c};
const PUCK_PTS=[];for(const i of [-1,0,1])for(const j of [-1,0,1])for(const k of [-1,0,1])if(i||j||k)PUCK_PTS.push([i,j,k]);
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const newMatchId=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2);
const rotate=(v,sign)=>[v[0]*sign,v[1],v[2]*sign];
const axis=(v,sign)=>({x:v.x*sign,y:v.y,z:v.z*sign});
const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
function qlerp(a,b,t){const s=a.reduce((n,v,i)=>n+v*b[i],0)<0?-1:1,q=a.map((v,i)=>v+(b[i]*s-v)*t),n=Math.hypot(...q)||1;return q.map(v=>v/n)}
function blendState(a,b,t){return{...b,cars:b.cars.map((c,i)=>{const p=a.cars[i]||c;return{...c,position:lerp(p.position,c.position,t),quaternion:qlerp(p.quaternion,c.quaternion,t)}}),ball:{...b.ball,position:lerp(a.ball.position,b.ball.position,t),quaternion:qlerp(a.ball.quaternion,b.ball.quaternion,t)}}}
export class Simulation{
 static async create(options={}){const s=new Simulation();[s.engine,s.neural,s.necto]=await Promise.all([createMatchEngine(),loadNexto(),loadNecto()]);s.configure(options);return s}
 configure(options={}){
  this.options={blue:1,orange:1,difficulty:'casual',training:false,...options};
  this.options.blue=Math.max(1,Math.min(5,Number(this.options.blue)||1));this.options.orange=this.options.training?0:Math.max(1,Math.min(5,Number(this.options.orange)||1));
  this.live=this.engine.configure(this.options.blue,this.options.orange);this.profiles=this.live.cars.map(c=>({name:`${this.options.difficulty==='competitive'&&this.options.useNexto!==false&&rankedDriver(this.options.botSkills?.[c.slot]??this.options.skill??.65)==='nexto'?'NEXTO':this.options.difficulty==='competitive'&&this.options.useNexto!==false&&rankedDriver(this.options.botSkills?.[c.slot]??this.options.skill??.65)==='necto'?'NECTO':'BOT'} ${c.slot+1}`,body:'octane',color:c.team?'#ff8b32':'#248bff',human:false}));
  this.bots=this.live.cars.map(c=>new OpponentAI({difficulty:this.options.difficulty,skill:this.options.botSkills?.[c.slot]??this.options.skill}));this.neuralBots=this.live.cars.map(c=>new NextoController(this.neural,this.options.botSkills?.[c.slot]??this.options.skill??.65));this.nectoBots=this.live.cars.map(c=>new NectoController(this.necto,this.options.botSkills?.[c.slot]??this.options.skill??.65));this.basicBots=this.live.cars.map(c=>new BasicBot(this.options.botSkills?.[c.slot]??this.options.skill??.65));this.roles=[null,null];this.roleClock=0;this.events=new MatchEvents();this.stats=new MatchStats(this.live.cars.length);this.matchId=newMatchId();this.played=0;this.postmatch={time:0,poses:{}};this.flow=new MatchFlow(()=>this.nextRound());this.remaining=300;this.overtime=false;this.endAfterReplay=false;this.started=false;this.resetRound();
 }
 assign(slot,profile,human=true){if(!this.profiles[slot])throw Error('Puesto inválido');this.profiles[slot]={...cleanProfile(profile),human};this.engine.setBody(slot,carById(profile.body).kind);this.live=this.engine.state();this.refreshBotSkills()}
 refreshBotSkills(){
  for(const c of this.live.cars){const base=this.options.botSkills?.[c.slot]??this.options.skill??.65,withHuman=this.live.cars.some(m=>m.team===c.team&&this.profiles[m.slot]?.human),skill=withHuman?base*.85:base;if(this.neuralBots[c.slot])this.neuralBots[c.slot].skill=Math.max(0,Math.min(1,skill));if(this.nectoBots[c.slot])this.nectoBots[c.slot].skill=Math.max(0,Math.min(1,skill));if(this.basicBots[c.slot])this.basicBots[c.slot].skill=Math.max(0,Math.min(1,skill))}
 }
 release(slot){const c=this.live.cars[slot];if(c)this.assign(slot,{name:`BOT ${slot+1}`,body:'octane',color:c.team?'#ff8b32':'#248bff'},false)}
 resetRound(){this.hs={team:null,hits:0,cool:0};this.sp=null;this.live=this.engine.reset();this.lastTouchTeam=null;this.bots?.forEach(b=>b.reset());this.neuralBots?.forEach(b=>b.reset());this.basicBots?.forEach(b=>b.reset());this.nectoBots?.forEach(b=>b.reset());this.roles=[null,null];this.roleClock=0;this.events?.resetRound();this.stats?.roundReset();this.flow?.beginRound(!this.options.training)}
 nextRound(){if(this.endAfterReplay){this.flow.phase='finished';return}this.resetRound()}
 start(){this.started=true;this.resetRound()}
 restart(){this.postmatch={time:0,poses:{}};this.remaining=300;this.played=0;this.matchId=newMatchId();this.stats=new MatchStats(this.live.cars.length);this.overtime=false;this.endAfterReplay=false;this.flow.score=[0,0];this.start()}
 botInput(slot,dt){
  const ranked=this.options.difficulty==='competitive'&&this.options.useNexto!==false,skill=this.neuralBots[slot].skill,driver=ranked?rankedDriver(this.options.botSkills?.[slot]??this.options.skill??skill):'fallback';
  if(driver==='necto'){this.bots[slot].intent='Necto';return this.nectoBots[slot].update(this.live,slot)}
  if(driver==='nexto'){this.bots[slot].intent='Nexto';return this.neuralBots[slot].update(this.live,slot)}
  const ai=driver==='basic'?this.basicBots[slot]:this.bots[slot];
  if(driver==='scripted'){ai.difficulty='casual';ai.tuning=rankedScriptedProfile(skill)}
  if(ai.time+dt<ai.nextThink){ai.time+=dt;return ai.controls}
  const self=this.live.cars[slot],sign=self.team?1:-1,convert=c=>({...c,position:rotate(c.position,sign),velocity:rotate(c.velocity,sign),forward:axis(c.forward,sign),right:axis(c.right,sign),up:axis(c.up,sign)});
  const team=this.live.cars.filter(c=>c.team===self.team&&!c.isDemoed).sort((a,b)=>distance(a.position,this.live.ball.position)-distance(b.position,this.live.ball.position));
  const chaser=this.roles[self.team]??team[0]?.slot,others=team.filter(c=>c.slot!==chaser).sort((a,b)=>a.position[2]*sign-b.position[2]*sign),rank=slot===chaser?0:others.findIndex(c=>c.slot===slot)+1;
  const ball={...this.live.ball,position:rotate(this.live.ball.position,sign),velocity:rotate(this.live.ball.velocity,sign)},enemy=this.live.cars.find(c=>c.team!==self.team)||self;
  const state={opponent:convert(self),car:convert(enemy),ball,teammates:team.filter(c=>c.slot!==slot).map(convert),opponents:this.live.cars.filter(c=>c.team!==self.team&&!c.isDemoed).map(convert),pads:this.live.pads.map(p=>({...p,position:rotate(p.position,sign)})),role:rank===0?'attack':rank===1?'keeper':'support'};
  const [x,,z]=ball.position,threat=incomingShot(ball,1);
  if(rank>0){
   if(rank===1){state.targetOverride=[Math.max(-6.2,Math.min(6.2,threat?threat.impact[0]:x*.25)),0,z<-20?-48:Math.max(-43,Math.min(-9,z-29))]}
   else{const lane=(rank%2?1:-1)*Math.min(16,7+rank*2);state.targetOverride=[Math.max(-27,Math.min(27,x*.3+lane)),0,Math.max(-38,Math.min(35,z-10-(rank-2)*4))]}
  }
  // The goal-side defender may leave the line to cut a shot, never to chase a harmless ball.
  if(threat&&rank===1&&state.opponent.position[2]<ball.position[2]+1&&distance(state.opponent.position,ball.position)<21)state.targetOverride=null;
  return ai.update(state,dt);
 }
 // Modos extra sobre la misma física: Heatseeker (la pelota busca la portería rival) y Snow Day (disco que se desliza)
 modeStep(dt,touch){
  const mode=this.options.mode;if(!mode||mode==='soccar'||this.options.training||this.live.goal)return;
  const b=this.live.ball,[x,y,z]=b.position,[vx,vy,vz]=b.velocity;let out=null,pos=[x,y,z],puck=null;
  if(mode==='heatseeker'){
   const h=this.hs;h.cool=Math.max(0,h.cool-dt);
   if(touch&&h.cool<=0){h.cool=.25;h.team=touch.team;h.hits++}
   if(h.team==null)return;
   // tras cada golpe acelera y gira hacia la portería del equipo contrario al que la golpeó (azul ataca -z, naranja +z)
   const speed=Math.min(58,26+h.hits*3),gz=h.team===0?-51.5:51.5;
   let dx=-x,dy=1.4-y,dz=gz-z;const dn=Math.hypot(dx,dy,dz)||1;dx/=dn;dy/=dn;dz/=dn;
   const cs=Math.hypot(vx,vy,vz)||1,k=Math.min(1,(3+h.hits*.35)*dt);
   let nx=vx/cs+(dx-vx/cs)*k,ny=vy/cs+(dy-vy/cs)*k,nz=vz/cs+(dz-vz/cs)*k;const nn=Math.hypot(nx,ny,nz)||1;
   out=[nx/nn*speed,ny/nn*speed,nz/nn*speed];
  }else if(mode==='snowday'){
   let nvx=vx,nvy=vy,nvz=vz;const rb=BALL_RADIUS,P=this.sp??={q:[0,0,0,1],w:[0,0,0],pv:[vx,vy,vz]};
   // golpes: el disco recibe un giro (levantado → vuelca; lateral → gira plano)
   const dvx=vx-P.pv[0],dvy=vy-P.pv[1],dvz=vz-P.pv[2],dh=Math.hypot(dvx,dvz);P.pv=[vx,vy,vz];
   if(Math.hypot(dh,dvy)>2.2){const vh=Math.hypot(vx,vz);if(dvy>1.2){const k=Math.min(16,dvy*1.4+dh*.25),ax=vh>.3?vz/vh:1,az=vh>.3?-vx/vh:0;P.w[0]+=ax*k;P.w[2]+=az*k}P.w[1]+=(Math.random()-.5)*Math.min(8,dh*.6)}
   // superficie más cercana al centro de la esfera física
   const sd0=arenaSDF(x,y,z),cw=sd0?Math.pow(Math.max(0,1-(Math.max(rb,sd0.d)-rb)/2.6),2):0,nS=sd0&&cw>.02?sd0.n:[0,1,0];
   if(y<=rb+.06){const f=Math.max(0,1-.3*dt);nvx*=f;nvz*=f;if(nvy>0&&nvy<8)nvy=0}else nvy-=9*dt;   // casi sin rebote, rozamiento suave y más peso en el aire
   // giro libre + se acuesta sobre la cara más cercana a la superficie (tiende a caerse porque es fino)
   const wl=Math.hypot(P.w[0],P.w[1],P.w[2]);if(wl>1e-3){P.q=qnorm(qmul(qaxis(P.w[0]/wl,P.w[1]/wl,P.w[2]/wl,wl*dt),P.q));const dmp=Math.exp(-dt*(1.2+9*cw));P.w=P.w.map(v=>v*dmp)}
   let u=qrot(P.q,[0,1,0]);if(u[0]*nS[0]+u[1]*nS[1]+u[2]*nS[2]<0)u=u.map(v=>-v);
   {const cx=u[1]*nS[2]-u[2]*nS[1],cy=u[2]*nS[0]-u[0]*nS[2],cz=u[0]*nS[1]-u[1]*nS[0],sl=Math.hypot(cx,cy,cz),dot=Math.max(-1,Math.min(1,u[0]*nS[0]+u[1]*nS[1]+u[2]*nS[2]));
    if(sl>1e-5){const ang=Math.atan2(sl,dot)*(1-Math.exp(-dt*(.8+12*cw)));P.q=qnorm(qmul(qaxis(cx/sl,cy/sl,cz/sl,ang),P.q))}}
   u=qrot(P.q,[0,1,0]);
   // centro visual del disco (apoyado en la superficie su centro queda más bajo que el de la esfera física)
   const off=(rb-PUCK_REST)*cw,c=[x-nS[0]*off,y-nS[1]*off,z-nS[2]*off];
   // colisión con los coches: se muestrean 26 puntos de cada coche contra el cilindro y se empuja el disco hacia fuera
   for(const car of this.live.cars){if(car.isDemoed)continue;const fw=car.forward,rt=car.right,up=car.up,cp=car.position;let best=null;
    for(const [i,j,k] of PUCK_PTS){const lx=i*.62,ly=j*.24,lz=k*.46,px=cp[0]+fw.x*lx+up.x*ly+rt.x*lz,py=cp[1]+fw.y*lx+up.y*ly+rt.y*lz,pz=cp[2]+fw.z*lx+up.z*ly+rt.z*lz,rx=px-c[0],ry=py-c[1],rz=pz-c[2],ax=rx*u[0]+ry*u[1]+rz*u[2],qx=rx-ax*u[0],qy=ry-ax*u[1],qz=rz-ax*u[2],rr=Math.hypot(qx,qy,qz);
     if(Math.abs(ax)<PUCK_H&&rr<PUCK_R){const pa=PUCK_H-Math.abs(ax),pr=PUCK_R-rr,axial=pa<pr,pen=axial?pa:pr;if(!best||pen>best.pen){const sg=ax>=0?-1:1,dir=axial?[u[0]*sg,u[1]*sg,u[2]*sg]:(rr>1e-4?[-qx/rr,-qy/rr,-qz/rr]:[x-cp[0],0,z-cp[2]].map(v=>v/(Math.hypot(x-cp[0],z-cp[2])||1)));best={pen,dir}}}}
    if(best){const {pen,dir}=best;c[0]+=dir[0]*pen;c[1]+=dir[1]*pen;c[2]+=dir[2]*pen;const cn=car.velocity[0]*dir[0]+car.velocity[1]*dir[1]+car.velocity[2]*dir[2],vn=nvx*dir[0]+nvy*dir[1]+nvz*dir[2];if(vn<cn){const g=(cn-vn)*1.2;nvx+=dir[0]*g;nvy+=dir[1]*g;nvz+=dir[2]*g}}}
   // colisión con paredes, rampas y techo según la forma real del disco (un lado o una esquina no atraviesan)
   const sd=arenaSDF(c[0],c[1],c[2]);if(sd){const hh=puckSupport(u,sd.n);if(sd.d<hh){const pen=hh-sd.d;c[0]+=sd.n[0]*pen;c[1]+=sd.n[1]*pen;c[2]+=sd.n[2]*pen;const vn=nvx*sd.n[0]+nvy*sd.n[1]+nvz*sd.n[2];if(vn<0){const g=-vn*1.25;nvx+=sd.n[0]*g;nvy+=sd.n[1]*g;nvz+=sd.n[2]*g}}}
   pos=[c[0]+nS[0]*off,c[1]+nS[1]*off,c[2]+nS[2]*off];puck={q:[...P.q],c:[...c]};
   out=[nvx,nvy,nvz];
  }
  if(!out)return;
  const s=this.engine.placeBall(pos[0],pos[1],pos[2],out[0],out[1],out[2]);this.live.ball={...s.ball,lastTouchTeam:this.lastTouchTeam,...(puck?{puck}:{})};
 }
 tick(dt,inputs={}){
  if(!this.started)return;
  if(this.flow.phase==='finished'){
   if(this.postmatch.time<PODIUM_SECONDS){for(const car of this.live.cars)if(this.profiles[car.slot]?.human)this.postmatch.poses[car.slot]=advanceCelebration(this.postmatch.poses[car.slot],inputs[car.slot]||{},dt)}
   this.postmatch.time+=dt;return;
  }
  this.flow.update(dt);if(this.flow.phase!=='live')return;
  this.roleClock-=dt;
  if(this.roleClock<=0){this.roleClock=.12;for(const team of [0,1]){
   const sign=team?1:-1,ball=this.live.ball.position;
   const eligible=this.live.cars.filter(c=>c.team===team&&!c.isDemoed);
   const cost=c=>{const dx=ball[0]-c.position[0],dz=ball[2]-c.position[2],angle=Math.abs(Math.atan2(c.forward.x*dz-c.forward.z*dx,c.forward.x*dx+c.forward.z*dz));return distance(c.position,ball)/20+angle*.27+(c.position[2]*sign>ball[2]*sign+1?1.1:0)+(c.onGround?0:.18)-(this.roles[team]===c.slot?.22:0)};
   eligible.sort((a,b)=>cost(a)-cost(b));this.roles[team]=eligible[0]?.slot??null;
  }}
  const before=this.live,controls=this.live.cars.map(c=>this.profiles[c.slot].human?(inputs[c.slot]||{}):this.botInput(c.slot,dt));this.live=this.engine.step(controls);
  this.events.update(before,this.live,dt);
  this.played+=dt;this.stats.update(before,this.live,dt,this.events.list);
  const touch=this.live.cars.filter(c=>c.ballTouchAge>=0&&c.ballTouchAge<=dt*1.5).sort((a,b)=>a.ballTouchAge-b.ballTouchAge)[0];if(touch)this.lastTouchTeam=touch.team;this.live.ball.lastTouchTeam=this.lastTouchTeam;this.modeStep(dt,touch);
  this.live.cars=this.live.cars.map(c=>({...c,profile:this.profiles[c.slot],flipResetCount:this.events.resetCounts[c.slot]||0}));this.flow.record(this.live,dt);
  if(this.live.goal){const scorer=this.stats.goal(this.live.goal);this.events.goal(this.live.goal,this.live.ball.position,scorer);this.flow.goal(this.live.goal,this.live)}
  if(!this.options.training){
   const wasOvertime=this.overtime;this.remaining=Math.max(0,this.remaining-dt);
   if(this.flow.phase==='goal'){
    if(wasOvertime||this.remaining===0&&this.flow.score[0]!==this.flow.score[1])this.endAfterReplay=true;
    // An equalizer at 0:00 gets its replay and a fresh overtime kickoff.
    else if(this.remaining===0)this.overtime=true;
   }else if(this.remaining===0&&!this.overtime&&this.live.ball.position[1]<=BALL_RADIUS+.035){
    if(this.flow.score[0]===this.flow.score[1]){this.overtime=true;this.resetRound()}
    else this.flow.phase='finished';
   }
  }
 }
 view(){
  let state=this.live;const replay=this.flow.sample();if(replay)state=blendState(replay.a,replay.b,replay.alpha);
  return{postmatch:this.postmatch,matchId:this.matchId,played:this.played,stats:this.stats.snapshot(),cars:state.cars.map(c=>({...c,profile:c.profile||this.profiles[c.slot]})),ball:state.ball,pads:state.pads,events:this.events.list,phase:!this.started?'lobby':this.flow.phase,score:[...this.flow.score],countdown:this.flow.clock,goalEnd:this.flow.end||1,replayProgress:this.flow.clip?Math.min(1,this.flow.playback/Math.max(.01,this.flow.clip.duration)):0,remaining:this.remaining,overtime:this.overtime,training:this.options.training,difficulty:this.options.difficulty};
 }
 skip(){this.flow.skip()}
}

