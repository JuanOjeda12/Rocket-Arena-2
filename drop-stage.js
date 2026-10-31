import * as T from './vendor/three.module.js';
import {dropById,rarityById} from './item-catalog.js?v=inventory-20261028';
import {softGlow} from './boost-visual.js?v=rl-20261031';
export function createDropStage(scene){
 const group=new T.Group(),orb=new T.Group();scene.add(group);group.add(orb);group.visible=false;
 const material=new T.MeshStandardMaterial({color:0x51d0c3,metalness:.7,roughness:.25,flatShading:true,emissive:0x154c52,emissiveIntensity:.6});
 const shell=new T.Mesh(new T.IcosahedronGeometry(.43,0),material);orb.add(shell);
 const wire=new T.LineSegments(new T.EdgesGeometry(shell.geometry),new T.LineBasicMaterial({color:0xc9faff,transparent:true,opacity:.8}));orb.add(wire);
 const seal=new T.Mesh(new T.TorusGeometry(.24,.025,6,24),new T.MeshBasicMaterial({color:0xeaffff,toneMapped:false}));seal.position.z=.36;orb.add(seal);
 const fragments=[];for(let i=0;i<12;i++){const m=new T.Mesh(new T.OctahedronGeometry(.09,0),material);orb.add(m);fragments.push(m);m.visible=false}
 const glow=new T.Sprite(new T.SpriteMaterial({map:softGlow(),color:0x68fff1,transparent:true,opacity:.65,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));glow.scale.set(2.2,2.2,1);group.add(glow);
 const ring=new T.Mesh(new T.TorusGeometry(.65,.016,5,64),new T.MeshBasicMaterial({color:0x8dfff1,transparent:true,opacity:.7,toneMapped:false}));ring.rotation.x=Math.PI/2;ring.position.y=-.57;group.add(ring);
 const beam=new T.Mesh(new T.CylinderGeometry(.05,.65,2,20,1,true),new T.MeshBasicMaterial({color:0x8af4ff,side:T.DoubleSide,transparent:true,opacity:.13,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));beam.position.y=.35;group.add(beam);
 let clock=0,opening=false,completed=false,type='sport';
 const tint=color=>{material.color.set(color);material.emissive.set(color).multiplyScalar(.25);glow.material.color.set(color);beam.material.color.set(color);ring.material.color.set(color)};
 return{group,get completed(){return completed},get clock(){return clock},idle(drop){type=drop;opening=false;completed=false;group.visible=true;group.position.set(1.4,.9,30);tint(dropById(drop).color);shell.visible=wire.visible=seal.visible=true;fragments.forEach(m=>m.visible=false)},start(drop,skip=false){type=drop;clock=0;opening=true;completed=skip;group.position.set(0,.9,30);group.visible=!skip;orb.scale.setScalar(1);shell.visible=wire.visible=seal.visible=true;fragments.forEach(m=>m.visible=false);tint(dropById(drop).color)},hide(){group.visible=false},update(dt,time){
  if(!group.visible)return;orb.rotation.set(.15+Math.sin(time)*.12,time*(opening?1.5: .45),.12);ring.rotation.z=time*.3;
  if(!opening){orb.position.y=Math.sin(time*1.5)*.06;glow.material.opacity=.5;beam.material.opacity=.1;return}
  clock+=dt;orb.position.y=Math.sin(clock*4)*.03;
  const drop=dropById(type);if(clock<3.2){const index=Math.min(drop.contents.length-1,Math.floor(clock/.9));tint(rarityById(drop.contents[index].rarity).color);glow.material.opacity=.35+Math.pow(Math.sin(clock*5),8)*.6;beam.material.opacity=.09+clock*.055}
  else{shell.visible=wire.visible=seal.visible=false;const t=clock-3.2;fragments.forEach((m,i)=>{m.visible=t<1;const a=i*Math.PI*2/12;m.position.set(Math.cos(a)*t*2,Math.sin(a)*t*1.5,t*.5);m.rotation.set(t*4,i,t*3);m.scale.setScalar(Math.max(.01,1-t))});glow.scale.setScalar(2+t*5);glow.material.opacity=Math.max(0,1-t);beam.material.opacity=Math.max(0,.3-t*.3);ring.scale.setScalar(1+t*4);ring.material.opacity=Math.max(0,1-t)}
  if(clock>=4.4){completed=true;group.visible=false;glow.scale.set(2.2,2.2,1);ring.scale.setScalar(1);ring.material.opacity=.7}
 }};
}
