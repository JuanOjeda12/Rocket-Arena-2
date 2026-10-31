import * as T from './vendor/three.module.js';
export class FlipResetIndicator{
 constructor(scene){this.scene=scene;this.effects=new Map();this.counts=new Map();this.phase='';try{this.enabled=localStorage.getItem('rocket-flip-indicator')!=='false'}catch{this.enabled=true}
  this.ringGeometry=new T.RingGeometry(.6,.66,64);this.discGeometry=new T.CircleGeometry(.63,48);this.coreGeometry=new T.CircleGeometry(.14,24);
  const p=[];for(let i=0;i<12;i++){const a=i*Math.PI/6;for(const r of [.49,.57])p.push(Math.cos(a)*r,Math.sin(a)*r,0)}this.tickGeometry=new T.BufferGeometry();this.tickGeometry.setAttribute('position',new T.Float32BufferAttribute(p,3));
 }
 toggle(){this.enabled=!this.enabled;try{localStorage.setItem('rocket-flip-indicator',String(this.enabled))}catch{}if(!this.enabled)for(const e of this.effects.values())e.group.visible=false}
 effect(slot){if(this.effects.has(slot))return this.effects.get(slot);const group=new T.Group(),face=new T.Group();face.rotation.x=-Math.PI/2;group.add(face);
  const material=new T.MeshBasicMaterial({color:0xf3fdff,transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false});const ring=new T.Mesh(this.ringGeometry,material),disc=new T.Mesh(this.discGeometry,material.clone()),core=new T.Mesh(this.coreGeometry,material.clone());face.add(ring,disc,core);for(const m of[ring,disc,core])m.renderOrder=100;
  const ticks=new T.LineSegments(this.tickGeometry,new T.LineBasicMaterial({color:0xffffff,transparent:true,blending:T.AdditiveBlending,depthTest:false,depthWrite:false,toneMapped:false}));ticks.renderOrder=100;face.add(ticks);this.scene.add(group);const effect={group,ring,disc,core,ticks,age:1};this.effects.set(slot,effect);return effect;
 }
 update(cars,views,dt,phase,ownSlot){const supported=['live','replay','highlight'].includes(phase),changed=phase!==this.phase;this.phase=phase;
  for(const c of cars){const count=c.flipResetCount||0,previous=this.counts.get(c.slot);this.counts.set(c.slot,count);
   if(this.enabled&&supported&&!changed&&previous!==undefined&&count>previous&&(c.slot===ownSlot||phase!=='live'))this.effect(c.slot).age=0;
  }
  for(const [slot,e]of this.effects){e.age+=dt;const view=views.get(slot);e.group.visible=this.enabled&&supported&&e.age<.48&&!!view;if(!e.group.visible)continue;
   const t=e.age/.48,opacity=(1-t)*(1-t);e.group.position.copy(view.root.position).add(new T.Vector3(0,-.12,0).applyQuaternion(view.root.quaternion));e.group.quaternion.copy(view.root.quaternion);e.group.rotateY(t*2);e.group.scale.setScalar(.65+t*.85);e.ring.material.opacity=opacity;e.disc.material.opacity=opacity*.2;e.core.material.opacity=opacity*.95;e.ticks.material.opacity=opacity*.85;
  }
 }
}
