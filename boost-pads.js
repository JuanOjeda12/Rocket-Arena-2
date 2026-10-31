import * as T from './vendor/three.module.js';
import {softGlow} from './boost-visual.js?v=rl-20261031';

// Las posiciones y la disponibilidad vienen siempre del motor de física, nunca de un
// diseño decorativo aparte. Estilo Rocket League: placa hexagonal con luz naranja, haz de
// luz vertical y, en los grandes, anillo giratorio y esfera flotante con destello.
let beamTexture;
function beam(){
 if(beamTexture)return beamTexture;
 const c=document.createElement('canvas');c.width=4;c.height=128;const x=c.getContext('2d'),g=x.createLinearGradient(0,128,0,0);
 g.addColorStop(0,'rgba(255,220,130,.85)');g.addColorStop(.35,'rgba(255,190,90,.32)');g.addColorStop(1,'rgba(255,170,60,0)');x.fillStyle=g;x.fillRect(0,0,4,128);
 beamTexture=new T.CanvasTexture(c);beamTexture.colorSpace=T.SRGBColorSpace;return beamTexture;
}
export function createBoostPads(scene,definitions){
 const pads=definitions.map(p=>{
  const group=new T.Group();group.position.set(p.position[0],.045,p.position[2]);scene.add(group);
  const big=p.isBig,r=big?1.3:.72;
  const plate=new T.Mesh(new T.CylinderGeometry(r,r+.12,.07,6),new T.MeshStandardMaterial({color:0x2b3a45,metalness:.6,roughness:.5}));plate.rotation.y=Math.PI/6;plate.receiveShadow=true;group.add(plate);
  const glow=new T.Mesh(new T.CylinderGeometry(r*.78,r*.78,.012,6),new T.MeshBasicMaterial({color:0xffb347,toneMapped:false}));glow.rotation.y=Math.PI/6;glow.position.y=.042;group.add(glow);
  const core=new T.Mesh(new T.CylinderGeometry(r*.4,r*.4,.014,6),new T.MeshBasicMaterial({color:0xfff0b8,toneMapped:false}));core.rotation.y=Math.PI/6;core.position.y=.05;group.add(core);
  const halo=new T.Mesh(new T.PlaneGeometry(r*5.2,r*5.2),new T.MeshBasicMaterial({map:softGlow(),color:0xff9d2e,transparent:true,opacity:.5,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));halo.rotation.x=-Math.PI/2;halo.position.y=.03;group.add(halo);
  const ring=new T.Mesh(new T.RingGeometry(r+.06,r+.17,72),new T.MeshBasicMaterial({color:0xffd276,side:T.DoubleSide,toneMapped:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.052;group.add(ring);
  const height=big?3.4:1.05;
  const light=new T.Mesh(new T.CylinderGeometry(r*(big?.55:.4),r*(big?.7:.55),height,24,1,true),new T.MeshBasicMaterial({map:beam(),transparent:true,opacity:big?.75:.5,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,toneMapped:false}));light.position.y=height/2;group.add(light);
  let orb=null,orbGlow=null,spin=null;
  if(big){
   orb=new T.Mesh(new T.IcosahedronGeometry(.4,1),new T.MeshStandardMaterial({color:0xffd16e,emissive:0xffaa22,emissiveIntensity:1.5,roughness:.3,metalness:.25}));orb.position.y=.95;group.add(orb);
   orbGlow=new T.Sprite(new T.SpriteMaterial({map:softGlow(),color:0xffc15a,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));orbGlow.scale.set(2.6,2.6,1);orbGlow.position.y=.95;group.add(orbGlow);
   spin=new T.Mesh(new T.TorusGeometry(.72,.025,8,48),new T.MeshBasicMaterial({color:0xffd98a,transparent:true,opacity:.85,toneMapped:false}));spin.position.y=.95;group.add(spin);
  }
  return {id:p.id,group,glow,core,halo,ring,light,orb,orbGlow,spin,big,was:null,x:p.position[0],z:p.position[2]};
 });
 const api={count:pads.length,onPickup:null,update(states,time=0){
  for(let i=0;i<pads.length;i++){
   const v=pads[i],s=states[i];if(!s)continue;
   if(v.was===true&&!s.active)api.onPickup?.(v.x,v.z,v.big);
   v.was=s.active;
   const pulse=.82+.18*Math.sin(time*3.2+i*1.7);
   v.glow.visible=v.core.visible=v.halo.visible=v.light.visible=s.active;
   if(s.active){v.halo.material.opacity=.38+.22*pulse;v.light.material.opacity=(v.big?.65:.42)*(.8+.2*Math.sin(time*5+i));v.light.rotation.y=time*.4}
   if(v.orb){v.orb.visible=v.orbGlow.visible=v.spin.visible=s.active;v.orb.rotation.y=time*1.1;v.orb.rotation.x=time*.6;const y=.95+Math.sin(time*2+i)*.12;v.orb.position.y=v.orbGlow.position.y=v.spin.position.y=y;v.spin.rotation.x=Math.PI/2+Math.sin(time*1.4+i)*.35;v.spin.rotation.z=time*1.6;v.orbGlow.material.opacity=.55+.3*pulse}
   const progress=s.active?1:T.MathUtils.clamp(1-s.cooldown/(v.big?10:4),0,1);
   v.ring.geometry.setDrawRange(0,Math.floor(progress*72)*6);
   v.ring.material.color.setHex(s.active?0xffd276:0x9a7440);
  }
 },dispose(){for(const p of pads){scene.remove(p.group);p.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})}}};
 return api;
}
