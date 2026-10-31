import * as T from './vendor/three.module.js';
// Piezas básicas para los efectos del juego. Todo es barato: un solo draw call por tipo
// (partículas, chispas, estelas, marcas de derrape) y buffers que se reutilizan sin crear objetos por frame.
export const rgb=h=>[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255];
export const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// ---------- Partículas redondas y suaves (humo, polvo, brillos) ----------
const POINT_VERT=`attribute float size;attribute vec4 tint;varying vec4 vTint;uniform float scale;
void main(){vTint=tint;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*scale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}`;
const POINT_FRAG=`varying vec4 vTint;uniform float soft;
void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.0;if(r>1.0)discard;float a=pow(1.0-r,soft);gl_FragColor=vec4(vTint.rgb,vTint.a*a);}`;
export class PointPool{
 constructor(scene,{max=2000,additive=true,soft=1.6}={}){
  this.max=max;this.head=0;this.scene=scene;
  const n=max;this.pos=new Float32Array(n*3);this.sz=new Float32Array(n);this.tint=new Float32Array(n*4);
  this.vel=new Float32Array(n*3);this.life=new Float32Array(n);this.age=new Float32Array(n);this.s0=new Float32Array(n);this.s1=new Float32Array(n);
  this.c0=new Float32Array(n*3);this.c1=new Float32Array(n*3);this.a0=new Float32Array(n);this.a1=new Float32Array(n);this.drag=new Float32Array(n);this.grav=new Float32Array(n);
  this.geometry=new T.BufferGeometry();
  this.geometry.setAttribute('position',new T.BufferAttribute(this.pos,3).setUsage(T.DynamicDrawUsage));
  this.geometry.setAttribute('size',new T.BufferAttribute(this.sz,1).setUsage(T.DynamicDrawUsage));
  this.geometry.setAttribute('tint',new T.BufferAttribute(this.tint,4).setUsage(T.DynamicDrawUsage));
  this.material=new T.ShaderMaterial({uniforms:{scale:{value:600},soft:{value:soft}},vertexShader:POINT_VERT,fragmentShader:POINT_FRAG,transparent:true,depthWrite:false,blending:additive?T.AdditiveBlending:T.NormalBlending});
  this.points=new T.Points(this.geometry,this.material);this.points.frustumCulled=false;this.points.renderOrder=additive?8:6;scene.add(this.points);
 }
 spawn(x,y,z,vx,vy,vz,life,s0,s1,c0,c1,a0=1,a1=0,drag=0,grav=0){
  const i=this.head;this.head=(this.head+1)%this.max;
  this.pos[i*3]=x;this.pos[i*3+1]=y;this.pos[i*3+2]=z;this.vel[i*3]=vx;this.vel[i*3+1]=vy;this.vel[i*3+2]=vz;
  this.life[i]=life;this.age[i]=0;this.s0[i]=s0;this.s1[i]=s1;this.a0[i]=a0;this.a1[i]=a1;this.drag[i]=drag;this.grav[i]=grav;
  this.c0[i*3]=c0[0];this.c0[i*3+1]=c0[1];this.c0[i*3+2]=c0[2];this.c1[i*3]=c1[0];this.c1[i*3+1]=c1[1];this.c1[i*3+2]=c1[2];
 }
 update(dt,camera,heightPx){
  this.material.uniforms.scale.value=heightPx/(2*Math.tan(T.MathUtils.degToRad(camera.fov)/2));
  for(let i=0;i<this.max;i++){
   if(this.life[i]<=0){this.sz[i]=0;continue}
   const age=this.age[i]+=dt;if(age>=this.life[i]){this.life[i]=0;this.sz[i]=0;continue}
   const u=age/this.life[i],k=Math.exp(-this.drag[i]*dt),j=i*3;
   this.vel[j]*=k;this.vel[j+1]=this.vel[j+1]*k-this.grav[i]*dt;this.vel[j+2]*=k;
   this.pos[j]+=this.vel[j]*dt;this.pos[j+1]+=this.vel[j+1]*dt;this.pos[j+2]+=this.vel[j+2]*dt;
   if(this.pos[j+1]<.02&&this.vel[j+1]<0){this.pos[j+1]=.02;this.vel[j+1]*=-.2}
   this.sz[i]=this.s0[i]+(this.s1[i]-this.s0[i])*u;
   const t=i*4;this.tint[t]=this.c0[j]+(this.c1[j]-this.c0[j])*u;this.tint[t+1]=this.c0[j+1]+(this.c1[j+1]-this.c0[j+1])*u;this.tint[t+2]=this.c0[j+2]+(this.c1[j+2]-this.c0[j+2])*u;
   this.tint[t+3]=(this.a0[i]+(this.a1[i]-this.a0[i])*u);
  }
  const g=this.geometry.attributes;g.position.needsUpdate=g.size.needsUpdate=g.tint.needsUpdate=true;
 }
}

// ---------- Chispas (líneas cortas con estela) ----------
export class SparkLines{
 constructor(scene,{max=700}={}){
  this.max=max;this.head=0;
  this.pos=new Float32Array(max*3);this.vel=new Float32Array(max*3);this.life=new Float32Array(max);this.age=new Float32Array(max);this.col=new Float32Array(max*3);this.grav=new Float32Array(max);this.trail=new Float32Array(max);this.alpha=new Float32Array(max);
  this.verts=new Float32Array(max*6);this.colors=new Float32Array(max*8);
  this.geometry=new T.BufferGeometry();this.geometry.setAttribute('position',new T.BufferAttribute(this.verts,3).setUsage(T.DynamicDrawUsage));this.geometry.setAttribute('color',new T.BufferAttribute(this.colors,4).setUsage(T.DynamicDrawUsage));
  this.lines=new T.LineSegments(this.geometry,new T.LineBasicMaterial({vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));this.lines.frustumCulled=false;this.lines.renderOrder=9;scene.add(this.lines);
 }
 spawn(x,y,z,vx,vy,vz,life,color,gravity=8,trail=.03,alpha=1){
  const i=this.head,j=i*3;this.head=(this.head+1)%this.max;
  this.pos[j]=x;this.pos[j+1]=y;this.pos[j+2]=z;this.vel[j]=vx;this.vel[j+1]=vy;this.vel[j+2]=vz;this.life[i]=life;this.age[i]=0;this.col[j]=color[0];this.col[j+1]=color[1];this.col[j+2]=color[2];this.grav[i]=gravity;this.trail[i]=trail;this.alpha[i]=alpha;
 }
 update(dt){
  for(let i=0;i<this.max;i++){
   const v=i*6,c=i*8;
   if(this.life[i]<=0){this.verts.fill(0,v,v+6);this.colors.fill(0,c,c+8);continue}
   const age=this.age[i]+=dt;if(age>=this.life[i]){this.life[i]=0;continue}
   const j=i*3,u=age/this.life[i];
   this.vel[j+1]-=this.grav[i]*dt;this.pos[j]+=this.vel[j]*dt;this.pos[j+1]+=this.vel[j+1]*dt;this.pos[j+2]+=this.vel[j+2]*dt;
   if(this.pos[j+1]<.02){this.pos[j+1]=.02;if(this.vel[j+1]<0)this.vel[j+1]*=-.35}
   const tr=this.trail[i];
   this.verts[v]=this.pos[j];this.verts[v+1]=this.pos[j+1];this.verts[v+2]=this.pos[j+2];
   this.verts[v+3]=this.pos[j]-this.vel[j]*tr;this.verts[v+4]=this.pos[j+1]-this.vel[j+1]*tr;this.verts[v+5]=this.pos[j+2]-this.vel[j+2]*tr;
   const a=this.alpha[i]*(1-u)*(1-u);
   this.colors[c]=this.col[j];this.colors[c+1]=this.col[j+1];this.colors[c+2]=this.col[j+2];this.colors[c+3]=a;
   this.colors[c+4]=this.col[j];this.colors[c+5]=this.col[j+1];this.colors[c+6]=this.col[j+2];this.colors[c+7]=0;
  }
  this.geometry.attributes.position.needsUpdate=this.geometry.attributes.color.needsUpdate=true;
 }
}

// ---------- Ondas de choque (anillos que se expanden) ----------
const ringGeometry=new T.RingGeometry(.86,1,56);
export class RingPool{
 constructor(scene,count=24){
  this.items=Array.from({length:count},()=>{const mesh=new T.Mesh(ringGeometry,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,toneMapped:false}));mesh.visible=false;mesh.renderOrder=7;scene.add(mesh);return{mesh,age:0,life:0,radius:1,opacity:1,grow:1}});
  this.next=0;this.up=new T.Vector3(0,0,1);
 }
 spawn(x,y,z,normal,radius,life,color,opacity=.8,grow=1){
  const it=this.items[this.next];this.next=(this.next+1)%this.items.length;
  it.age=0;it.life=life;it.radius=radius;it.opacity=opacity;it.grow=grow;
  it.mesh.position.set(x,y,z);it.mesh.quaternion.setFromUnitVectors(this.up,normal);it.mesh.material.color.setRGB(color[0],color[1],color[2]);it.mesh.visible=true;it.mesh.scale.setScalar(.05);
 }
 update(dt){
  for(const it of this.items){
   if(!it.mesh.visible)continue;it.age+=dt;
   if(it.age>=it.life){it.mesh.visible=false;continue}
   const u=it.age/it.life,ease=1-Math.pow(1-u,2.4);
   it.mesh.scale.setScalar(Math.max(.05,it.radius*(.12+.88*ease)*it.grow));it.mesh.material.opacity=it.opacity*Math.pow(1-u,1.6);
  }
 }
}

// ---------- Estela en cinta, orientada hacia la cámara ----------
const tmpA=new T.Vector3(),tmpB=new T.Vector3(),tmpC=new T.Vector3();
export class Ribbon{
 constructor(scene,{samples=28,life=.5,width=.1,color=[1,1,1],spacing=.07}={}){
  this.samples=samples;this.life=life;this.width=width;this.color=color;this.spacing=spacing;this.pts=[];this.strength=0;
  this.verts=new Float32Array(samples*2*3);this.colors=new Float32Array(samples*2*4);
  const index=[];for(let i=0;i<samples-1;i++){const a=i*2;index.push(a,a+1,a+2,a+1,a+3,a+2)}
  this.geometry=new T.BufferGeometry();this.geometry.setAttribute('position',new T.BufferAttribute(this.verts,3).setUsage(T.DynamicDrawUsage));this.geometry.setAttribute('color',new T.BufferAttribute(this.colors,4).setUsage(T.DynamicDrawUsage));this.geometry.setIndex(index);
  this.mesh=new T.Mesh(this.geometry,new T.MeshBasicMaterial({vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,toneMapped:false}));this.mesh.frustumCulled=false;this.mesh.renderOrder=8;this.mesh.visible=false;scene.add(this.mesh);
 }
 clear(){this.pts.length=0;this.mesh.visible=false}
 // `emit` = true mientras la estela debe crecer; si no, solo se desvanece.
 update(dt,camera,point,emit,strength=1){
  for(const p of this.pts)p.age+=dt;
  while(this.pts.length&&this.pts[this.pts.length-1].age>this.life)this.pts.pop();
  if(emit&&point){
   const head=this.pts[0];
   if(head&&Math.hypot(head.x-point.x,head.y-point.y,head.z-point.z)<this.spacing){head.x=point.x;head.y=point.y;head.z=point.z}
   else{this.pts.unshift({x:point.x,y:point.y,z:point.z,age:0});if(this.pts.length>this.samples)this.pts.pop()}
  }
  const n=this.pts.length;if(n<2){this.mesh.visible=false;return}
  this.mesh.visible=true;const cam=camera.position;
  for(let i=0;i<n;i++){
   const p=this.pts[i],a=this.pts[Math.max(0,i-1)],b=this.pts[Math.min(n-1,i+1)];
   tmpA.set(a.x-b.x,a.y-b.y,a.z-b.z);tmpB.set(cam.x-p.x,cam.y-p.y,cam.z-p.z);tmpC.crossVectors(tmpA,tmpB);
   if(tmpC.lengthSq()<1e-10)tmpC.set(0,1,0);tmpC.normalize();
   const taper=Math.pow(1-i/n,.7),w=this.width*(.25+.75*taper),fade=Math.pow(Math.max(0,1-p.age/this.life),1.4)*strength,v=i*6,c=i*8;
   this.verts[v]=p.x+tmpC.x*w;this.verts[v+1]=p.y+tmpC.y*w;this.verts[v+2]=p.z+tmpC.z*w;this.verts[v+3]=p.x-tmpC.x*w;this.verts[v+4]=p.y-tmpC.y*w;this.verts[v+5]=p.z-tmpC.z*w;
   for(let k=0;k<2;k++){this.colors[c+k*4]=this.color[0];this.colors[c+k*4+1]=this.color[1];this.colors[c+k*4+2]=this.color[2];this.colors[c+k*4+3]=fade*(k?.45:1)}
  }
  this.geometry.setDrawRange(0,(n-1)*6);this.geometry.attributes.position.needsUpdate=this.geometry.attributes.color.needsUpdate=true;
 }
}

// ---------- Marcas de derrape en el suelo ----------
export class SkidMarks{
 constructor(scene,{segments=800,life=10}={}){
  this.segments=segments;this.life=life;this.head=0;this.clock=0;
  this.verts=new Float32Array(segments*4*3);this.colors=new Float32Array(segments*4*4);this.birth=new Float32Array(segments).fill(-1e9);this.base=new Float32Array(segments);
  const index=new Uint32Array(segments*6);for(let i=0;i<segments;i++){const a=i*4;index.set([a,a+1,a+2,a,a+2,a+3],i*6)}
  this.geometry=new T.BufferGeometry();this.geometry.setAttribute('position',new T.BufferAttribute(this.verts,3).setUsage(T.DynamicDrawUsage));this.geometry.setAttribute('color',new T.BufferAttribute(this.colors,4).setUsage(T.DynamicDrawUsage));this.geometry.setIndex(new T.BufferAttribute(index,1));
  this.mesh=new T.Mesh(this.geometry,new T.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3,toneMapped:false}));this.mesh.frustumCulled=false;this.mesh.renderOrder=2;scene.add(this.mesh);
 }
 add(ax,az,bx,bz,y,width,alpha){
  const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz);if(len<1e-4)return;
  const px=-dz/len*width/2,pz=dx/len*width/2,i=this.head;this.head=(this.head+1)%this.segments;const v=i*12;
  this.verts.set([ax+px,y,az+pz,ax-px,y,az-pz,bx-px,y,bz-pz,bx+px,y,bz+pz],v);this.birth[i]=this.clock;this.base[i]=alpha;
 }
 update(dt){
  this.clock+=dt;let dirty=false;
  for(let i=0;i<this.segments;i++){
   const age=this.clock-this.birth[i],c=i*16;
   const a=age>this.life?0:this.base[i]*Math.min(1,age*8)*(1-Math.pow(age/this.life,2));
   if(this.colors[c+3]===a&&a===0)continue;
   for(let k=0;k<4;k++){this.colors[c+k*4]=.03;this.colors[c+k*4+1]=.03;this.colors[c+k*4+2]=.04;this.colors[c+k*4+3]=a}dirty=true;
  }
  if(dirty)this.geometry.attributes.color.needsUpdate=true;
  this.geometry.attributes.position.needsUpdate=true;
 }
 clear(){this.birth.fill(-1e9);this.colors.fill(0);this.geometry.attributes.color.needsUpdate=true}
}

// ---------- Rayas de velocidad alrededor de la cámara ----------
export class SpeedStreaks{
 constructor(scene,{count=90}={}){
  this.count=count;this.p=new Float32Array(count*3);this.seed=new Float32Array(count);
  this.verts=new Float32Array(count*6);this.colors=new Float32Array(count*8);
  this.geometry=new T.BufferGeometry();this.geometry.setAttribute('position',new T.BufferAttribute(this.verts,3).setUsage(T.DynamicDrawUsage));this.geometry.setAttribute('color',new T.BufferAttribute(this.colors,4).setUsage(T.DynamicDrawUsage));
  this.lines=new T.LineSegments(this.geometry,new T.LineBasicMaterial({vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));this.lines.frustumCulled=false;this.lines.renderOrder=10;this.lines.visible=false;scene.add(this.lines);
  this.ready=false;this.fwd=new T.Vector3();this.right=new T.Vector3();this.up=new T.Vector3();this.dir=new T.Vector3();
 }
 respawn(i,camera,far=false){
  const r=1.9+Math.pow(Math.random(),.7)*7.5,a=Math.random()*Math.PI*2,d=far?6+Math.random()*28:4+Math.random()*10;
  this.p[i*3]=camera.position.x+this.fwd.x*d+this.right.x*Math.cos(a)*r+this.up.x*Math.sin(a)*r;
  this.p[i*3+1]=camera.position.y+this.fwd.y*d+this.right.y*Math.cos(a)*r+this.up.y*Math.sin(a)*r;
  this.p[i*3+2]=camera.position.z+this.fwd.z*d+this.right.z*Math.cos(a)*r+this.up.z*Math.sin(a)*r;
  this.p[i*3+1]=Math.max(.1,this.p[i*3+1]);this.seed[i]=.45+Math.random()*.55;
 }
 // `velocity` es la velocidad del coche (m/s); `amount` 0..1 es la intensidad deseada.
 update(dt,camera,velocity,amount,color=[.75,.93,1]){
  this.lines.visible=amount>.01;if(!this.lines.visible){this.ready=false;return}
  camera.getWorldDirection(this.fwd);this.right.crossVectors(this.fwd,camera.up).normalize();this.up.crossVectors(this.right,this.fwd).normalize();
  if(!this.ready){for(let i=0;i<this.count;i++)this.respawn(i,camera,true);this.ready=true}
  const speed=velocity.length(),len=clamp(speed*.05,.4,1.8),dx=velocity.x,dy=velocity.y,dz=velocity.z;this.dir.copy(velocity).normalize();
  for(let i=0;i<this.count;i++){
   const j=i*3;
   // Un punto del aire quieto "se mueve" hacia atrás respecto al coche.
   this.p[j]-=dx*dt;this.p[j+1]-=dy*dt;this.p[j+2]-=dz*dt;
   const rx=this.p[j]-camera.position.x,ry=this.p[j+1]-camera.position.y,rz=this.p[j+2]-camera.position.z,along=rx*this.fwd.x+ry*this.fwd.y+rz*this.fwd.z;
   if(along<-1||along>40||this.p[j+1]<.05)this.respawn(i,camera,false);
   const v=i*6,c=i*8,s=this.seed[i];
   this.verts[v]=this.p[j];this.verts[v+1]=this.p[j+1];this.verts[v+2]=this.p[j+2];
   this.verts[v+3]=this.p[j]+this.dir.x*len*s;this.verts[v+4]=this.p[j+1]+this.dir.y*len*s;this.verts[v+5]=this.p[j+2]+this.dir.z*len*s;
   const edge=clamp(along/6,0,1),a=amount*.55*s*edge;
   this.colors[c]=color[0];this.colors[c+1]=color[1];this.colors[c+2]=color[2];this.colors[c+3]=a;
   this.colors[c+4]=color[0];this.colors[c+5]=color[1];this.colors[c+6]=color[2];this.colors[c+7]=0;
  }
  this.geometry.attributes.position.needsUpdate=this.geometry.attributes.color.needsUpdate=true;
 }
}
