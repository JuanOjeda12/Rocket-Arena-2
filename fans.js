import * as T from './vendor/three.module.js';
import {arenaPerimeter} from './arena-shape.js?v=inventory-20261028';
import {softGlow} from './boost-visual.js?v=rl-20261031';
// Aficionados en 3D SOLO para la cinemática de introducción: una tribuna azul y otra naranja.
// Cada espectador es un huevito (como en Rocket League), sin ojos, que salta y se mece. En partida son planos 2D.
const SKIN=[0xf1c9a5,0xd9a47c,0xb97a52,0x8a5a3a,0x5e3b26,0xffdcb8];
const rand=(()=>{let s=1337;return()=>(s=(s*1664525+1013904223)>>>0)/4294967296})();
const TEAM={blue:0x1e8cff,orange:0xff7a1c};
function nearest(per,x,z){let best=per[0],d=1e9;for(const p of per){const k=Math.hypot(p.x-x,p.z-z);if(k<d){d=k;best=p}}return best}
class Section{
 constructor(scene,per,{team,x,z}){
  this.team=team;this.level=0;this.fans=[];this.group=new T.Group();scene.add(this.group);
  const p=nearest(per,x,z),nx=p.nx,nz=p.nz,tx=-nz,tz=nx,color=TEAM[team];
  this.normal=new T.Vector3(nx,0,nz);this.tangent=new T.Vector3(tx,0,tz);
  for(let tier=0;tier<2;tier++)for(let row=0;row<5;row++){
   const off=5+tier*9+row*1.25,y=5.3+tier*7.3+row*.83+.43,count=tier?11:17;
   for(let j=0;j<count;j++){
    const along=(j-(count-1)/2)*.9+(rand()-.5)*.25,lateral=(rand()-.5)*.3;
    const pos=new T.Vector3(p.x-nx*(off+lateral)+tx*along,y,p.z-nz*(off+lateral)+tz*along);
    this.fans.push({tier,pos,yaw:Math.atan2(nx,nz)+(rand()-.5)*.5,phase:rand()*6.28,speed:.8+rand()*.5,skin:SKIN[Math.floor(rand()*SKIN.length)],hair:[0x16110d,0x3a2616,0x6b4423,0xc9a35a,0x1a1a1f,0x7a3b1d][Math.floor(rand()*6)],bald:rand()<.14,shirt:rand()<.6?color:rand()<.55?0xc8d2dc:0x1c2530,height:.93+rand()*.14,arm:rand()<.5?1:.6});
   }
  }
  const low=this.fans.filter(f=>f.tier===0);this.focus=low.reduce((a,f)=>a.add(f.pos),new T.Vector3()).multiplyScalar(1/low.length);
  this.center=this.focus.clone().add(new T.Vector3(0,3,0));
  const n=this.fans.length,mat=(c,r=.75)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:.02});
  const egg=new T.SphereGeometry(.5,20,16);const pa=egg.attributes.position;for(let i=0;i<pa.count;i++){const y=pa.getY(i),k=y>0?1-.2*y:1+.1*y;pa.setX(i,pa.getX(i)*.62*k);pa.setZ(i,pa.getZ(i)*.5*k);pa.setY(i,y*1.0)}egg.computeVertexNormals();
  this.egg=new T.InstancedMesh(egg,new T.MeshStandardMaterial({color:0xffffff,roughness:.55,metalness:.02}),n);this.egg.frustumCulled=false;this.group.add(this.egg);
  const shades=[color,color,color,0xd8d5c4,0x78b8ed,0xedaa67,0x9fc682,0xdb8499,0xaa96d0,0x64a8a8,0xd8c268];
  this.fans.forEach((f,i)=>this.egg.setColorAt(i,new T.Color(rand()<.55?color:shades[Math.floor(rand()*shades.length)])));
  // Banderas de equipo que ondean.
  this.flags=[];const flagTex=(()=>{const c=document.createElement('canvas');c.width=64;c.height=40;const x=c.getContext('2d'),col='#'+new T.Color(color).getHexString();x.fillStyle=col;x.fillRect(0,0,64,40);x.fillStyle='#ffffffcc';x.beginPath();x.moveTo(8,34);x.lineTo(32,6);x.lineTo(56,34);x.lineTo(44,34);x.lineTo(32,18);x.lineTo(20,34);x.fill();const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t})();
  for(let i=0;i<this.fans.length;i+=9){
   const f=this.fans[i],g=new T.Group(),pole=new T.Mesh(new T.CylinderGeometry(.018,.018,1.6,6),mat(0xdddddd,.4)),cloth=new T.Mesh(new T.PlaneGeometry(.95,.6,14,5),new T.MeshBasicMaterial({map:flagTex,side:T.DoubleSide,toneMapped:false}));
   pole.position.y=.8;cloth.position.set(.48,1.28,0);g.add(pole,cloth);g.position.copy(f.pos).add(new T.Vector3(tx*.3,1.1,tz*.3));g.rotation.y=Math.atan2(tx,tz)+1.2;this.group.add(g);
   this.flags.push({g,cloth,base:cloth.geometry.attributes.position.array.slice(),phase:rand()*6});
  }
  // Confeti.
  const m=240,pos=new Float32Array(m*3),col=new Float32Array(m*3),pal=[color,0xffffff,0xffd84a,color];
  this.confetti={n:m,pos,vel:Array.from({length:m},()=>({vy:.9+rand()*1.6,sway:rand()*6,sp:.5+rand()*1.5}))};
  for(let i=0;i<m;i++){this.resetConfetti(i,true);const c=new T.Color(pal[i%4]);col.set([c.r,c.g,c.b],i*3)}
  const cg=new T.BufferGeometry();cg.setAttribute('position',new T.BufferAttribute(pos,3));cg.setAttribute('color',new T.BufferAttribute(col,3));
  this.confettiPoints=new T.Points(cg,new T.PointsMaterial({size:.16,vertexColors:true,toneMapped:false,transparent:true,opacity:0,depthWrite:false}));this.confettiPoints.frustumCulled=false;this.group.add(this.confettiPoints);
  // Destellos de cámaras.
  this.sparks=Array.from({length:22},()=>{const s=new T.Sprite(new T.SpriteMaterial({map:softGlow(),color:0xffffff,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));s.scale.setScalar(1.4);s.userData.life=0;this.group.add(s);return s});
  // Foco del color del equipo sobre la tribuna.
  this.spot=new T.SpotLight(color,0,38,.95,.85,1.1);this.spot.position.copy(this.focus).addScaledVector(this.normal,5).add(new T.Vector3(0,4.5,0));this.spot.target.position.copy(this.focus).add(new T.Vector3(0,1.8,0));scene.add(this.spot,this.spot.target);
  this.dummy=new T.Object3D();this.group.visible=false;
 }
 resetConfetti(i,fresh=false){const c=this.center,p=this.confetti.pos;p[i*3]=c.x+this.tangent.x*(rand()-.5)*16+this.normal.x*(rand()*5);p[i*3+1]=c.y+(fresh?rand()*8:6+rand()*2);p[i*3+2]=c.z+this.tangent.z*(rand()-.5)*16+this.normal.z*(rand()*5)}
 update(t,dt,level,show){
  this.group.visible=show;this.spot.intensity=show?95*Math.min(1,level*1.6+.25):0;if(!show)return;
  const d=this.dummy,e=level;
  this.fans.forEach((f,i)=>{
   const hop=Math.abs(Math.sin(t*5.4*f.speed+f.phase))*.28*e,rock=Math.sin(t*(2+e*5)*f.speed+f.phase)*(.04+.16*e),q=new T.Quaternion().setFromEuler(new T.Euler(0,f.yaw,rock,'YXZ'));
   d.position.set(f.pos.x,f.pos.y+.5*f.height+hop,f.pos.z);d.quaternion.copy(q);d.scale.set(1,f.height,1);d.updateMatrix();this.egg.setMatrixAt(i,d.matrix);
  });
  this.egg.instanceMatrix.needsUpdate=true;
  for(const fl of this.flags){const a=fl.cloth.geometry.attributes.position,b=fl.base;for(let k=0;k<a.count;k++){const x=b[k*3]+.48;a.array[k*3+2]=Math.sin(t*(7+e*5)-x*5+fl.phase)*.09*x;}a.needsUpdate=true;fl.g.rotation.z=Math.sin(t*3+fl.phase)*.12*e;}
  const c=this.confetti;this.confettiPoints.material.opacity=Math.min(1,e*1.5);
  for(let i=0;i<c.n;i++){const v=c.vel[i];c.pos[i*3+1]-=v.vy*dt*e;c.pos[i*3]+=Math.sin(t*v.sp+v.sway)*dt*.9;if(c.pos[i*3+1]<this.center.y-5)this.resetConfetti(i)}
  this.confettiPoints.geometry.attributes.position.needsUpdate=true;
  for(const s of this.sparks){s.userData.life-=dt;if(s.userData.life<=0&&rand()<.1*e+.01){s.userData.life=.09+rand()*.07;const f=this.fans[Math.floor(rand()*this.fans.length)];s.position.copy(f.pos).add(new T.Vector3(0,1.6,0)).addScaledVector(this.normal,.4)}s.material.opacity=Math.max(0,s.userData.life*9)*.9}
 }
}
export function createFans(scene){
 const per=arenaPerimeter();
 // Azul en la banda este (mitad de la portería azul, z>0); naranja en la oeste (z<0).
 return{blue:new Section(scene,per,{team:'blue',x:60,z:16}),orange:new Section(scene,per,{team:'orange',x:-60,z:-16}),
  hide(){this.blue.update(0,0,0,false);this.orange.update(0,0,0,false)}};
}
