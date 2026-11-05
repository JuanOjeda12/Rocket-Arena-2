import * as T from './vendor/three.module.js';
import {softGlow} from './boost-visual.js?v=final2';
import {PointPool,SparkLines,RingPool,Ribbon,SkidMarks,SpeedStreaks,rgb,rand} from './vfx-core.js?v=final2';
import {DemolitionFX} from './demolition-fx.js?v=demo1';
// Efectos de conducción al estilo Rocket League: turbo, derrape con marcas y humo, velocidad
// supersónica (estelas, onda de choque, partículas pegadas al suelo), saltos, aterrizajes,
// demoliciones, impactos en el balón y recogida de turbo. Todo se deriva del estado visible
// de cada coche, así funciona igual en partida local, LAN, online y repeticiones.
export const SUPERSONIC_ON=22,SUPERSONIC_OFF=21.3; // m/s (2200 uu/s)
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const WHITE=[1,1,1],SONIC=[.62,.9,1],SONIC_DEEP=[.2,.6,1],DUST=[.66,.72,.75],SMOKE=[.86,.88,.92],BLUE=rgb(0x59c8ff),ORANGE=rgb(0xffa45a),GOLD=rgb(0xffd276);
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const q=new T.Vector3(),fwd=new T.Vector3(),right=new T.Vector3(),up=new T.Vector3(),w1=new T.Vector3(),w2=new T.Vector3(),w3=new T.Vector3(),vel=new T.Vector3(),n=new T.Vector3();

class CarFx{
 constructor(hub){
  this.hub=hub;this.acc={};this.trails=[0,1].map(()=>new Ribbon(hub.scene,{samples:30,life:.5,width:.045,color:SONIC}));
  this.glow=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:softGlow(),color:0xffa447,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));this.glow.rotation.x=-Math.PI/2;this.glow.renderOrder=3;this.glow.visible=false;hub.scene.add(this.glow);
  this.reset();
 }
 reset(){this.last=null;this.onGround=true;this.boosting=false;this.flipping=false;this.demoed=false;this.ss=false;this.level=0;this.vn=0;this.glowAmount=0;this.wheelPrev=[null,null,null,null];this.emitTrail=false;this.points=[null,null];this.floorHeight=0;for(const t of this.trails)t.clear()}
 tick(key,rate,dt){const a=(this.acc[key]||0)+rate*dt,whole=Math.floor(a);this.acc[key]=a-whole;return Math.min(8,whole)}
 wheel(out,i,pos,quat){ // 0,1 traseras (izq/der), 2,3 delanteras
  return out.set(i%2?.45:-.45,-.16,i<2?.42:-.42).applyQuaternion(quat).add(pos);
 }
 observe(dt,car,root,ctx){
  const hub=this.hub,pos=root.position,quat=root.quaternion;
  if(this.last&&this.last.distanceToSquared(pos)>36){const wasDemoed=this.demoed;this.reset();this.demoed=wasDemoed}
  if(!this.last)this.last=new T.Vector3();
  const grounded=!!car.onGround,boosting=!!car.isBoosting,flipping=!!car.isFlipping,demoed=!!car.isDemoed;
  vel.set(car.velocity[0],car.velocity[1],car.velocity[2]);const speed=vel.length();
  if(demoed){
   if(!this.demoed)hub.explosion(this.last.x,this.last.y,this.last.z,car.team);
   this.demoed=true;this.emitTrail=false;this.boosting=false;this.ss=false;this.level=Math.max(0,this.level-dt*4);this.glowAmount=0;this.last.copy(pos);return;
  }
  this.demoed=false;
  fwd.set(0,0,-1).applyQuaternion(quat);right.set(1,0,0).applyQuaternion(quat);up.set(0,1,0).applyQuaternion(quat);
  const boostColor=ctx.boostRGB||[1,.62,.22],teamColor=car.team?ORANGE:BLUE;
  // Velocidad vertical respecto a la superficie (para detectar aterrizajes).
  const vn=vel.dot(up),slip=Math.abs(vel.dot(right)),forward=vel.dot(fwd);
  // ---- Supersónico, con histéresis para que no parpadee en el umbral ----
  const ss=this.ss?speed>=SUPERSONIC_OFF:speed>=SUPERSONIC_ON;
  if(ss&&!this.ss)this.hub.sonicBoom(pos,vel,quat,car.slot===ctx.localSlot);
  this.ss=ss;this.level=ss?Math.min(1,this.level+dt*5):Math.max(0,this.level-dt*3.2);
  // ---- Salto, dodge, aterrizaje ----
  const floor=pos.y<1.5&&up.y>.7;
  if(this.onGround&&!grounded&&vel.y>1.5&&floor){this.dustBurst(pos,quat,6,1.6,.9)}
  if(!this.onGround&&grounded&&this.vn<-3){const s=clamp(-this.vn/12,0,1.2);this.dustBurst(pos,quat,Math.round(4+s*12),1.2+s,.8+s*.6);hub.rings.spawn(pos.x-up.x*.16,pos.y-up.y*.16+.03,pos.z-up.z*.16,up,1.2+s*1.6,.4,DUST,.28+s*.2);if(s>.6&&ctx.localSlot===car.slot)hub.shake=Math.min(.6,hub.shake+.15*s)}
  if(flipping&&!this.flipping){
   hub.rings.spawn(pos.x,pos.y,pos.z,fwd,1.55,.38,ss?SONIC:WHITE,.55);
   for(let i=0;i<14;i++){const a=Math.random()*6.28;w1.copy(right).multiplyScalar(Math.cos(a)).addScaledVector(up,Math.sin(a));hub.sparks.spawn(pos.x,pos.y,pos.z,w1.x*rand(3,7)+vel.x*.5,w1.y*rand(3,7)+vel.y*.5,w1.z*rand(3,7)+vel.z*.5,rand(.2,.4),ss?SONIC:WHITE,4,.04,.9)}
  }
  // ---- Turbo ----
  if(boosting&&!this.boosting){for(const side of [-1,1]){w1.set(side*.17,.15,.7).applyQuaternion(quat).add(pos);hub.glow.spawn(w1.x,w1.y,w1.z,vel.x*.4,vel.y*.4,vel.z*.4,.2,1.3,.2,WHITE,boostColor,.9,0,0,0);for(let i=0;i<5;i++)hub.sparks.spawn(w1.x,w1.y,w1.z,-fwd.x*rand(6,12)+vel.x*.5+rand(-1.5,1.5),-fwd.y*rand(6,12)+vel.y*.5+rand(-1,1.5),-fwd.z*rand(6,12)+vel.z*.5+rand(-1.5,1.5),rand(.25,.45),mix(boostColor,WHITE,.5),6,.04,1)}}
  if(boosting){
   const hot=mix(boostColor,WHITE,.55),cool=mix(boostColor,[.5,.08,.02],.55);
   for(let i=this.tick('boost',150+this.level*60,dt);i>0;i--){
    w1.set((Math.random()<.5?-1:1)*.17,.15,.64).applyQuaternion(quat).add(pos);
    const s=rand(7,12);hub.glow.spawn(w1.x,w1.y,w1.z,-fwd.x*s+vel.x*.55+rand(-.5,.5),-fwd.y*s+vel.y*.55+rand(-.4,.4),-fwd.z*s+vel.z*.55+rand(-.5,.5),rand(.2,.34),rand(.3,.4),.09,hot,cool,.85,0,2.4,0);
   }
   for(let i=this.tick('ember',45,dt);i>0;i--){
    w1.set((Math.random()<.5?-1:1)*.17,.15,.64).applyQuaternion(quat).add(pos);
    const s=rand(4,9);hub.glow.spawn(w1.x,w1.y,w1.z,-fwd.x*s+vel.x*.5+rand(-1.2,1.2),-fwd.y*s+vel.y*.5+rand(-.6,1.4),-fwd.z*s+vel.z*.5+rand(-1.2,1.2),rand(.5,.9),rand(.07,.12),.02,mix(boostColor,WHITE,.3),cool,.9,0,1,3);
   }
   for(let i=this.tick('spark',30,dt);i>0;i--){
    w1.set((Math.random()<.5?-1:1)*.17,.15,.64).applyQuaternion(quat).add(pos);
    const s=rand(10,18);hub.sparks.spawn(w1.x,w1.y,w1.z,-fwd.x*s+vel.x*.5+rand(-2.2,2.2),-fwd.y*s+vel.y*.5+rand(-1.5,2.2),-fwd.z*s+vel.z*.5+rand(-2.2,2.2),rand(.3,.6),mix(boostColor,WHITE,.4),7,.035,.95);
   }
  }
  // ---- Derrape: marcas en el suelo y humo ----
  const drifting=grounded&&up.y>.55&&speed>4.5&&slip>2.4,d=drifting?clamp((slip-2.4)/8,0,1):0;
  if(d>0){
   for(let i=this.tick('smoke',(14+70*d)*(1+.4*this.level),dt);i>0;i--){
    this.wheel(w1,Math.random()<.5?0:1,pos,quat);
    hub.smoke.spawn(w1.x,w1.y+.05,w1.z,-right.x*Math.sign(vel.dot(right))*rand(.2,1.3)+rand(-.3,.3)+vel.x*.08,rand(.5,1.4),-right.z*Math.sign(vel.dot(right))*rand(.2,1.3)+rand(-.3,.3)+vel.z*.08,rand(.7,1.15),rand(.25,.4),rand(1.1,1.7),SMOKE,[.62,.64,.7],.26+.14*d,0,1.4,-.25);
   }
   if(this.level>.4)for(let i=this.tick('dsp',22*d,dt);i>0;i--){this.wheel(w1,Math.random()<.5?0:1,pos,quat);hub.sparks.spawn(w1.x,w1.y,w1.z,-fwd.x*rand(1,4)+rand(-1.5,1.5),rand(.8,2.6),-fwd.z*rand(1,4)+rand(-1.5,1.5),rand(.18,.35),mix(SONIC,WHITE,.4),9,.03,.9)}
  }
  const marks=d>.12&&up.y>.9&&pos.y<.7;
  for(let i=0;i<4;i++){
   if(!marks||(i>1&&d<.55)){this.wheelPrev[i]=null;continue}
   this.wheel(w1,i,pos,quat);const p=this.wheelPrev[i];
   if(p){const dist=Math.hypot(w1.x-p[0],w1.z-p[1]);if(dist>.14&&dist<2){hub.skid.add(p[0],p[1],w1.x,w1.z,.022,.17,.55*Math.min(1,d*1.6));this.wheelPrev[i]=[w1.x,w1.z]}else if(dist>=2)this.wheelPrev[i]=[w1.x,w1.z]}
   else this.wheelPrev[i]=[w1.x,w1.z];
  }
  // ---- Polvo del suelo al ir rápido ----
  const g=clamp((speed-8)/15,0,1);
  if(grounded&&g>0&&!d){
   for(let i=this.tick('dust',3+30*g,dt);i>0;i--){this.wheel(w1,Math.random()<.5?0:1,pos,quat);hub.smoke.spawn(w1.x,w1.y+.03,w1.z,-fwd.x*rand(.5,2)+rand(-.5,.5),rand(.2,.8),-fwd.z*rand(.5,2)+rand(-.5,.5),rand(.45,.8),rand(.18,.3),rand(.7,1.1),DUST,DUST,.1+.1*g,0,1.6,-.15)}
  }
  // ---- Partículas de velocidad supersónica pegadas al suelo ----
  if(this.level>.15&&grounded){
   for(let i=this.tick('glint',120*this.level,dt);i>0;i--){
    w1.set(rand(-.95,.95),-.15,rand(-.45,.95)).applyQuaternion(quat).add(pos);
    hub.glow.spawn(w1.x,w1.y,w1.z,-vel.x*.1+up.x*rand(.2,1.4)+right.x*rand(-1,1),-vel.y*.1+up.y*rand(.2,1.6),-vel.z*.1+up.z*rand(.2,1.4)+right.z*rand(-1,1),rand(.3,.6),rand(.12,.2),.03,WHITE,SONIC_DEEP,.95,0,1.2,-.6);
   }
   for(let i=this.tick('streak',55*this.level,dt);i>0;i--){
    this.wheel(w1,Math.random()<.5?0:1,pos,quat);
    hub.sparks.spawn(w1.x+rand(-.15,.15),w1.y+.02,w1.z+rand(-.15,.15),-fwd.x*rand(5,10)+right.x*rand(-1.2,1.2),rand(.2,1.1),-fwd.z*rand(5,10)+right.z*rand(-1.2,1.2),rand(.25,.45),mix(SONIC,WHITE,.5),5,.07,.9);
   }
   if(this.tick('ripple',2.6*this.level,dt)>0){this.wheel(w1,Math.random()<.5?0:1,pos,quat);hub.rings.spawn(w1.x,.03,w1.z,up.y>.7?up:n.set(0,1,0),.9+Math.random()*.6,.45,SONIC_DEEP,.22)}
  }
  // ---- Estelas supersónicas en cinta desde las esquinas traseras ----
  this.emitTrail=this.level>.3;
  for(let i=0;i<2;i++)this.points[i]=this.emitTrail?w2.set(i?.5:-.5,.06,.55).applyQuaternion(quat).add(pos).clone():null;
  // ---- Brillo bajo el coche ----
  const target=boosting?.55:this.level>.2?.3*this.level:0;this.glowAmount+=(target-this.glowAmount)*Math.min(1,dt*10);
  this.glowColor=boosting?boostColor:SONIC;this.glowPos=pos;this.glowFloor=pos.y;
  if(boosting&&ctx.localSlot===car.slot&&!this.boosting)hub.shake=Math.min(.6,hub.shake+.04);
  this.onGround=grounded;this.boosting=boosting;this.flipping=flipping;this.vn=vn;this.last.copy(pos);
 }
 dustBurst(pos,quat,count,spread,size){
  for(let i=0;i<count;i++){const a=Math.random()*6.28,s=rand(.8,2.2)*spread;this.hub.smoke.spawn(pos.x+Math.cos(a)*.5,Math.max(.05,pos.y-.14),pos.z+Math.sin(a)*.5,Math.cos(a)*s,rand(.2,.9),Math.sin(a)*s,rand(.45,.8),.3*size,1.1*size,DUST,DUST,.2,0,2.2,-.2)}
 }
 finish(dt,camera){
  for(let i=0;i<2;i++)this.trails[i].update(dt,camera,this.points[i],this.emitTrail,.55*Math.max(.25,this.level));
  const show=this.glowAmount>.01&&this.glowFloor<3&&!this.demoed;this.glow.visible=show;
  if(show){this.glow.position.set(this.glowPos.x,.03,this.glowPos.z);this.glow.scale.setScalar(3.4+this.level*1.2);this.glow.material.color.setRGB(this.glowColor[0],this.glowColor[1],this.glowColor[2]);this.glow.material.opacity=this.glowAmount*clamp(1-this.glowFloor/3,0,1)}
 }
}

export class VfxHub{
 constructor({scene,camera,renderer}){
  Object.assign(this,{scene,camera,renderer});this.size=new T.Vector2();this.demoFx=new DemolitionFX(scene);   // explosión de demolición estilo Rocket League
  this.glow=new PointPool(scene,{max:3600,additive:true,soft:1.8});this.smoke=new PointPool(scene,{max:1500,additive:false,soft:1.15});
  this.sparks=new SparkLines(scene,{max:900});this.rings=new RingPool(scene,30);this.skid=new SkidMarks(scene);this.streaks=new SpeedStreaks(scene);
  this.cars=new Map();this.ballPrev=null;this.shake=0;this.dt=0;this.superLevel=0;this.local=null;
 }
 setQuality(k){this.glow.keep=k;this.smoke.keep=k;this.sparks.keep=k}
 begin(dt){this.dt=dt;this.local=null}
 idle(dt){this.begin(dt);this.update(dt,{streaks:false})}
 car(car,root,{localSlot=-1,boostRGB=null}={}){
  let fx=this.cars.get(car.slot);if(!fx){fx=new CarFx(this);this.cars.set(car.slot,fx)}
  fx.observe(this.dt,car,root,{localSlot,boostRGB});
  if(car.slot===localSlot)this.local={car,fx};
 }
 sonicBoom(pos,vel,quat,isLocal){
  n.copy(vel).normalize();this.rings.spawn(pos.x,pos.y,pos.z,n,2.6,.55,SONIC,.7);this.rings.spawn(pos.x-n.x*.8,pos.y-n.y*.8,pos.z-n.z*.8,n,1.7,.4,WHITE,.5);
  for(let i=0;i<26;i++){const a=Math.random()*6.28,r=rand(.6,1.4);w3.set(Math.cos(a),Math.sin(a),0).applyQuaternion(quat);this.sparks.spawn(pos.x,pos.y,pos.z,w3.x*r*3+vel.x*.35,w3.y*r*3+vel.y*.35,w3.z*r*3+vel.z*.35,rand(.25,.5),mix(SONIC,WHITE,Math.random()*.6),1,.05,.95)}
  if(isLocal)this.shake=Math.min(.6,this.shake+.18);
 }
 explosion(x,y,z,team){
  this.demoFx.burst(x,y,z,team);
  const c=team?ORANGE:BLUE;
  for(let i=0;i<70;i++){const a=Math.random()*6.28,b=(Math.random()-.3)*Math.PI*.9,s=rand(4,16);this.sparks.spawn(x,y,z,Math.cos(a)*Math.cos(b)*s,Math.sin(b)*s+3,Math.sin(a)*Math.cos(b)*s,rand(.4,.9),mix(c,WHITE,Math.random()*.6),9,.04,1)}
  for(let i=0;i<26;i++){const a=Math.random()*6.28,s=rand(1,5);this.smoke.spawn(x,y,z,Math.cos(a)*s,rand(.5,3),Math.sin(a)*s,rand(.8,1.4),.6,2.6,[.35,.33,.34],[.15,.15,.17],.55,0,1.6,-.3)}
  this.glow.spawn(x,y,z,0,0,0,.35,6,1,WHITE,c,1,0,0,0);this.rings.spawn(x,y,z,new T.Vector3(0,1,0),5.5,.6,c,.8);this.rings.spawn(x,y,z,new T.Vector3(1,.2,0).normalize(),4,.5,WHITE,.5);
  this.shake=Math.min(.6,this.shake+.12);
 }
 // Llamar una vez por frame con la pelota y los coches visibles.
 ball(ball,cars,active=true){
  const v=ball.velocity,p=ball.position;
  if(this.ballPrev&&active&&this.dt>0){
   const pv=this.ballPrev.v,dx=v[0]-pv[0],dy=v[1]-pv[1],dz=v[2]-pv[2],dv=Math.hypot(dx,dy,dz),moved=Math.hypot(p[0]-this.ballPrev.p[0],p[1]-this.ballPrev.p[1],p[2]-this.ballPrev.p[2]);
   if(dv>5.5&&moved<3){
    let near=null,best=3.2;for(const c of cars){if(c.isDemoed)continue;const d=Math.hypot(c.position[0]-p[0],c.position[1]-p[1],c.position[2]-p[2]);if(d<best){best=d;near=c}}
    if(near)this.ballImpact(p,dx,dy,dz,dv,near);
   }
  }
  this.ballPrev={p:[p[0],p[1],p[2]],v:[v[0],v[1],v[2]]};
 }
 ballImpact(p,dx,dy,dz,dv,car){
  const s=clamp(dv/26,0,1.2),tc=mix(car.team?ORANGE:BLUE,WHITE,.45);n.set(dx,dy,dz).normalize();
  const x=p[0]-n.x*.6,y=p[1]-n.y*.6,z=p[2]-n.z*.6;
  this.glow.spawn(x,y,z,0,0,0,.16,1.4+3*s,.3,WHITE,tc,.9,0,0,0);
  this.rings.spawn(x,y,z,n,.8+2.1*s,.26+.2*s,tc,.75);
  const count=Math.round(8+24*s);for(let i=0;i<count;i++){const sp=rand(5,16)*(.5+s);this.sparks.spawn(x,y,z,n.x*sp+rand(-4,4),n.y*sp+rand(-3,4),n.z*sp+rand(-4,4),rand(.25,.6),mix(tc,WHITE,Math.random()*.5),9,.035,1)}
  if(s>.55)this.shake=Math.min(.6,this.shake+.22*s);
 }
 padPickup(x,z,big){
  const count=big?34:14;for(let i=0;i<count;i++){const a=Math.random()*6.28,s=rand(.6,big?4:2.4);this.glow.spawn(x,.2,z,Math.cos(a)*s,rand(1.5,big?8:5),Math.sin(a)*s,rand(.5,.9),big?.22:.15,.03,[1,.95,.6],GOLD,1,0,1.4,5)}
  this.rings.spawn(x,.05,z,new T.Vector3(0,1,0),big?2.8:1.5,.5,GOLD,.6);
 }
 clearMarks(){this.skid.clear();for(const fx of this.cars.values())fx.reset()}
 // Intensidad 0..1 del coche local para HUD y cámara.
 get superSonic(){return this.local?this.local.fx.level:0}
 update(dt,{streaks=true}={}){
  const cam=this.camera;this.renderer.getDrawingBufferSize(this.size);this.demoFx.tick(dt);
  this.glow.update(dt,cam,this.size.y);this.smoke.update(dt,cam,this.size.y);this.sparks.update(dt);this.rings.update(dt);this.skid.update(dt);
  for(const fx of this.cars.values())fx.finish(dt,cam);
  const local=this.local;
  if(local&&streaks){
   const c=local.car,v=vel.set(c.velocity[0],c.velocity[1],c.velocity[2]),speed=v.length(),base=clamp((speed-17)/5,0,1),boosting=!!c.isBoosting;
   const amount=clamp(base*(boosting?.35:.15)+local.fx.level*.7,0,1);
   this.streaks.update(dt,cam,v,amount,local.fx.level>.5?SONIC:[.9,.82,.7]);
  }else this.streaks.update(dt,cam,vel.set(0,0,1),0);
  this.shake=Math.max(0,this.shake-dt*1.6);
 }
}
