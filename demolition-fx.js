// Explosión de demolición al estilo Rocket League: destello, bola de fuego, onda expansiva, chispas, humo y piezas del coche saliendo disparadas.
// Es determinista y se dibuja a partir del tiempo (setTime), así sirve igual en el juego (tick), en la intro y en el editor (que salta por la línea de tiempo).
import * as T from './vendor/three.module.js';

const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
let softTex=null;
const soft=()=>{if(softTex)return softTex;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);
 r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.35,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);
 softTex=new T.CanvasTexture(c);softTex.colorSpace=T.SRGBColorSpace;return softTex};
const DUR=3.4,G=14,clamp01=v=>Math.min(1,Math.max(0,v)),ease=k=>1-Math.pow(1-clamp01(k),3);
const TEAM=[new T.Color(0x3aa0ff),new T.Color(0xff8420)],WHITE=new T.Color(1,.96,.8),DARK=new T.Color(.18,.07,.03);
const NF=13,NS=150,NM=16,ND=26;

class Rig{
 constructor(scene){
  this.g=new T.Group();this.g.visible=false;scene.add(this.g);this.t0=0;this.used=false;
  const add=(m)=>{this.g.add(m);return m};
  const spriteMat=()=>new T.SpriteMaterial({map:soft(),blending:T.AdditiveBlending,transparent:true,depthWrite:false});
  this.flash=add(new T.Sprite(spriteMat()));
  this.fire=Array.from({length:NF},()=>add(new T.Sprite(spriteMat())));
  // chispas
  this.sGeo=new T.BufferGeometry();this.sGeo.setAttribute('position',new T.BufferAttribute(new Float32Array(NS*3),3));this.sGeo.setAttribute('color',new T.BufferAttribute(new Float32Array(NS*3),3));
  this.sparks=add(new T.Points(this.sGeo,new T.PointsMaterial({map:soft(),size:.55,vertexColors:true,blending:T.AdditiveBlending,transparent:true,depthWrite:false,sizeAttenuation:true})));this.sparks.frustumCulled=false;
  // humo
  this.mGeo=new T.BufferGeometry();this.mGeo.setAttribute('position',new T.BufferAttribute(new Float32Array(NM*3),3));
  this.smoke=add(new T.Points(this.mGeo,new T.PointsMaterial({map:soft(),size:4,color:0x2a2724,transparent:true,opacity:.5,depthWrite:false,sizeAttenuation:true})));this.smoke.frustumCulled=false;
  // onda expansiva (anillo en el suelo + esfera translúcida)
  this.ring=add(new T.Mesh(new T.RingGeometry(.86,1,56),new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide,transparent:true,blending:T.AdditiveBlending,depthWrite:false})));this.ring.rotation.x=-Math.PI/2;
  this.shell=add(new T.Mesh(new T.SphereGeometry(1,24,16),new T.MeshBasicMaterial({color:0xffffff,side:T.BackSide,transparent:true,blending:T.AdditiveBlending,depthWrite:false})));
  // piezas del coche
  this.debris=Array.from({length:ND},()=>{const m=new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color:0x777777,roughness:.6,metalness:.4}));m.castShadow=false;add(m);return m});
  this.fp=[];this.sp=[];this.mp=[];this.dp=[];
 }
 start(x,y,z,team,t0,seed){
  const R=mulberry(seed|0),col=TEAM[team?1:0];this.t0=t0;this.col=col;this.p=new T.Vector3(x,Math.max(.4,y),z);this.used=true;
  this.fp=Array.from({length:NF},(_,i)=>{const a=R()*6.283,b=(R()-.25)*1.2,s=2+R()*9;return{d:new T.Vector3(Math.cos(a)*Math.cos(b),Math.sin(b),Math.sin(a)*Math.cos(b)),s,size:(i===0?9:3+R()*6),delay:i===0?0:R()*.12}});
  this.sp=Array.from({length:NS},()=>{const a=R()*6.283,b=(R()-.2)*1.35,s=5+R()*22;return{v:new T.Vector3(Math.cos(a)*Math.cos(b)*s,Math.sin(b)*s+4,Math.sin(a)*Math.cos(b)*s),life:.5+R()*.9,w:R()}});
  this.mp=Array.from({length:NM},()=>{const a=R()*6.283,s=.8+R()*3.2;return{v:new T.Vector3(Math.cos(a)*s,.6+R()*1.6,Math.sin(a)*s),delay:.05+R()*.25}});
  this.dp=Array.from({length:ND},(_,i)=>{const a=R()*6.283,b=.25+R()*1.0,s=4+R()*13;const big=i<8;
   return{v:new T.Vector3(Math.cos(a)*Math.cos(b)*s,Math.sin(b)*s+3,Math.sin(a)*Math.cos(b)*s),ax:new T.Vector3(R()-.5,R()-.5,R()-.5).normalize(),w:3+R()*12,
    sz:big?new T.Vector3(.5+R()*.7,.12+R()*.2,.4+R()*.5):new T.Vector3(.1+R()*.25,.08+R()*.15,.1+R()*.25),col:i%3===0?col:(i%3===1?new T.Color(.12,.12,.13):new T.Color(.45,.46,.5))}});
  this.debris.forEach((m,i)=>{m.material.color.copy(this.dp[i].col);m.scale.copy(this.dp[i].sz)});
 }
 draw(t){
  const age=t-this.t0;if(!this.used||age<0||age>DUR){this.g.visible=false;return}
  this.g.visible=true;const p=this.p,col=this.col;
  // destello
  const fa=clamp01(1-age/.32);this.flash.visible=fa>0;this.flash.position.copy(p);this.flash.scale.setScalar(12+60*ease(age/.32));this.flash.material.opacity=fa;this.flash.material.color.copy(WHITE);
  // bolas de fuego: blanco → color del equipo → ceniza
  this.fire.forEach((s,i)=>{const f=this.fp[i],a=age-f.delay;if(a<0||a>1.15){s.visible=false;return}s.visible=true;
   const k=a/1.15,e=(1-Math.exp(-3.2*a))/3.2;s.position.set(p.x+f.d.x*f.s*e,p.y+f.d.y*f.s*e+.9*a,p.z+f.d.z*f.s*e);s.scale.setScalar(f.size*(.45+1.7*ease(a/.55)));
   s.material.color.copy(WHITE).lerp(col,clamp01(k*2.2)).lerp(DARK,clamp01((k-.45)*1.6));s.material.opacity=clamp01(1-k)*(i===0?1:.85)});
  // chispas
  const pos=this.sGeo.attributes.position.array,cl=this.sGeo.attributes.color.array;
  for(let i=0;i<NS;i++){const s=this.sp[i],a=Math.min(age,s.life+.3);const y=p.y+s.v.y*a-.5*G*a*a;pos[i*3]=p.x+s.v.x*a;pos[i*3+1]=Math.max(.06,y);pos[i*3+2]=p.z+s.v.z*a;
   const f=clamp01(1-age/s.life),hot=s.w<.5;   // la mitad amarillo-blanco, la otra mitad del color del equipo
   cl[i*3]=f*(hot?1:.3+col.r*.9);cl[i*3+1]=f*(hot?.85:.25+col.g*.7);cl[i*3+2]=f*(hot?.5:.1+col.b*.9)}
  this.sGeo.attributes.position.needsUpdate=true;this.sGeo.attributes.color.needsUpdate=true;this.sparks.material.size=.55*clamp01(1-age/1.6)+.12;this.sparks.material.opacity=clamp01(1.6-age/.9);
  // humo
  const mp=this.mGeo.attributes.position.array;for(let i=0;i<NM;i++){const m=this.mp[i],a=Math.max(0,age-m.delay);mp[i*3]=p.x+m.v.x*a*.7;mp[i*3+1]=p.y+.3+m.v.y*a;mp[i*3+2]=p.z+m.v.z*a*.7}
  this.mGeo.attributes.position.needsUpdate=true;this.smoke.material.size=3+age*3.2;this.smoke.material.opacity=.5*clamp01(age/.25)*clamp01(1-(age-.4)/(DUR-.4));
  // ondas
  const ra=clamp01(1-age/.6);this.ring.visible=ra>0;this.ring.position.set(p.x,.08,p.z);this.ring.scale.setScalar(1+34*ease(age/.6));this.ring.material.opacity=.85*ra;this.ring.material.color.copy(col).lerp(WHITE,.4);
  const sa=clamp01(1-age/.4);this.shell.visible=sa>0;this.shell.position.copy(p);this.shell.scale.setScalar(1+16*ease(age/.4));this.shell.material.opacity=.32*sa;this.shell.material.color.copy(col);
  // piezas
  this.debris.forEach((m,i)=>{const d=this.dp[i],tl=(d.v.y+Math.sqrt(d.v.y*d.v.y+2*G*Math.max(0,p.y-.12)))/G,a=Math.min(age,tl+.2),k=.9;
   const h=(1-Math.exp(-k*Math.min(age,tl+1.6)))/k;m.position.set(p.x+d.v.x*h,Math.max(.12,p.y+d.v.y*Math.min(age,tl)-.5*G*Math.min(age,tl)**2),p.z+d.v.z*h);
   m.quaternion.setFromAxisAngle(d.ax,d.w*Math.min(age,tl+.35));m.visible=true;const fade=clamp01((DUR-age)/.5);m.scale.copy(d.sz).multiplyScalar(fade)});
 }
}

export class DemolitionFX{
 constructor(scene,pool=6){this.rigs=Array.from({length:pool},()=>new Rig(scene));this.clock=0;this.n=0}
 // t0 en el mismo reloj que setTime (segundos). seed distinto = explosión distinta
 spawn(x,y,z,team,t0=this.clock,seed=this.n*7919+13){
  let r=this.rigs.find(q=>!q.used||q.t0+DUR<this.clock)||this.rigs.reduce((a,b)=>a.t0<b.t0?a:b);r.start(x,y,z,team,t0,seed);this.n++;return r}
 setTime(t){this.clock=t;for(const r of this.rigs)r.draw(t)}
 clear(){for(const r of this.rigs){r.used=false;r.g.visible=false}}
 // modo "en vivo" (juego): burst + tick(dt)
 burst(x,y,z,team){this.spawn(x,y,z,team,this.clock)}
 tick(dt){this.setTime(this.clock+dt)}
}
