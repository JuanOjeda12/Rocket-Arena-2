import * as T from './vendor/three.module.js';
import {dropById,rarityById,RARITIES} from './item-catalog.js?v=final2';
import {softGlow} from './boost-visual.js?v=final2';
import {createSoftPoints} from './fx-points.js';
// Drop: cofre redondeado de 14 caras (octaedro truncado) como los de RL: paneles superiores del color de la rareza con ranuras plateadas y logo, emblema de rombo, paneles inferiores oscuros con marco blanco y ranura cuadrada arriba.
// Línea de tiempo: carga 0–3.2 s (gira más rápido, vibra, los paneles se separan y la luz se cuela por las juntas), estallido a 3.2 s (los paneles salen disparados) y cierre a 4.7 s.
const BURST=3.2,END=4.7,R=.64;
const WHITE=new T.Color(1,1,1),clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const tri=(list,a,b,c)=>list.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z);
const geometryOf=list=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(list,3));g.computeVertexNormals();return g};
// Construye el cofre: un octaedro truncado de 14 caras (6 cuadrados + 8 hexágonos) con las esquinas redondeadas, como los drops de RL.
// Arriba: ranura cuadrada oscura. Hexágonos superiores: color de rareza (con ranuras plateadas y logo). Cuadrados laterales: color con emblema de rombo.
// Hexágonos inferiores y base: paneles oscuros hundidos con marco blanco grueso.
const SCALE=R/Math.sqrt(5),UPV=new T.Vector3(0,1,0);
const facing=normal=>{const up=Math.abs(normal.y)>.95?new T.Vector3(0,0,-1):UPV,x=new T.Vector3().crossVectors(up,normal).normalize(),y=new T.Vector3().crossVectors(normal,x),m=new T.Matrix4().makeBasis(x,y,normal);return new T.Quaternion().setFromRotationMatrix(m)};
function crateFaces(){
 const verts=[];for(const perm of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]])for(const s1 of [-1,1])for(const s2 of [-1,1]){const v=[0,0,0],[a,b,c]=perm;v[a]=0;v[b]=s1;v[c]=2*s2;verts.push(new T.Vector3(...v))}
 const faces=[];
 for(let axis=0;axis<3;axis++)for(const s of [-1,1]){const normal=new T.Vector3();normal.setComponent(axis,s);faces.push({kind:s>0&&axis===1?'top':s<0&&axis===1?'bottom':'side',normal,pts:verts.filter(v=>v.getComponent(axis)===2*s)})}
 for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1]){const normal=new T.Vector3(sx,sy,sz).normalize();faces.push({kind:sy>0?'hexUp':'hexDown',normal,pts:verts.filter(v=>sx*v.x+sy*v.y+sz*v.z===3)})}
 for(const face of faces){const n=face.normal,u=Math.abs(n.y)>.9?new T.Vector3(1,0,0):new T.Vector3(0,1,0).sub(n.clone().multiplyScalar(n.y)).normalize(),w=new T.Vector3().crossVectors(n,u);face.pts.sort((a,b)=>Math.atan2(a.dot(w),a.dot(u))-Math.atan2(b.dot(w),b.dot(u)))}
 return faces;
}
function buildPanels(){
 const round=v=>{const p=v.clone().multiplyScalar(SCALE);return p.clone().lerp(p.clone().normalize().multiplyScalar(R),.58)};
 return crateFaces().map(face=>{
  const dark=face.kind==='hexDown'||face.kind==='top'||face.kind==='bottom',pts=face.pts.map(round),n=pts.length,center=new T.Vector3();pts.forEach(p=>center.add(p));center.multiplyScalar(1/n);
  const normal=face.normal,frame=face.kind==='top'?.4:dark?.3:.1,lift=dark?-.03*R:.012*R,topLift=dark?-.06*R:.05*R;
  const inner=pts.map(p=>p.clone().lerp(center,frame).addScaledVector(normal,lift)),top=center.clone().addScaledVector(normal,topLift),rim=[],topList=[];
  for(let i=0;i<n;i++){const j=(i+1)%n;tri(rim,pts[i],pts[j],inner[j]);tri(rim,pts[i],inner[j],inner[i]);tri(topList,top,inner[i],inner[j])}
  const flat=geometryOf(topList),normals=flat.attributes.normal;for(let i=0;i<normals.count;i++)normals.setXYZ(i,normal.x,normal.y,normal.z);
  return{kind:face.kind,dark,normal,center:normal.clone(),anchor:center.clone().addScaledVector(normal,R*.045),top:flat,rim:geometryOf(rim)};
 });
}
// Emblemas por tipo de drop (blancos con contorno oscuro).
const glyphs=new Map();
function glyphTexture(type){
 if(glyphs.has(type))return glyphs.get(type);const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');c.translate(64,64);c.lineCap=c.lineJoin='round';
 const draw=shape=>{for(const [w,col] of [[20,'#0a1016cc'],[10,'#ffffff']]){c.lineWidth=w;c.strokeStyle=col;c.fillStyle=col;shape(col==='#ffffff')}};
 const shapes={
  sport:fill=>{c.beginPath();c.arc(0,0,34,0,7);c.stroke();c.beginPath();c.arc(0,0,9,0,7);c.fill()},
  special:fill=>{c.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?16:40;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.stroke();c.fill()},
  deluxe:fill=>{for(const y of [-28,-4,20]){c.beginPath();c.moveTo(-34,y);c.lineTo(0,y+26);c.lineTo(34,y);c.stroke()}},
  import:fill=>{for(const [x,y,a] of [[-10,26,-.2],[8,10,-.45],[24,-8,-.7]]){c.beginPath();c.moveTo(x-22,y);c.quadraticCurveTo(x+4,y-26,x+26,y-30+a*10);c.stroke()}},
  exotic:fill=>{for(const s of [40,20]){c.beginPath();c.moveTo(0,-s);c.lineTo(s*.85,0);c.lineTo(0,s);c.lineTo(-s*.85,0);c.closePath();c.stroke()}},
  blackmarket:fill=>{c.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?18:42;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.stroke();c.beginPath();c.arc(0,0,8,0,7);c.fill()}
 };
 draw(shapes[type]||shapes.sport);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;glyphs.set(type,tex);return tex;
}
function slitTexture(){const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');for(const y of [22,72]){const g=x.createLinearGradient(0,y,0,y+34);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#aab4c2');x.fillStyle=g;x.beginPath();x.roundRect(12,y,232,34,17);x.fill()}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t}
function diamondTexture(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.translate(64,64);const d=(s,col)=>{x.fillStyle=col;x.beginPath();x.moveTo(0,-s);x.lineTo(s,0);x.lineTo(0,s);x.lineTo(-s,0);x.closePath();x.fill()};d(60,'#ffffff');d(46,'#3a4350');d(34,'#ffffff');d(20,'#222a35');d(9,'#ffffff');const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t}
let rayMap;
function rays(){if(rayMap)return rayMap;const c=document.createElement('canvas');c.width=64;c.height=256;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#ffffff00');g.addColorStop(.35,'#ffffffaa');g.addColorStop(1,'#ffffff00');x.fillStyle=g;x.fillRect(0,0,64,256);x.globalCompositeOperation='destination-in';const h=x.createLinearGradient(0,0,64,0);h.addColorStop(0,'#0000');h.addColorStop(.5,'#000f');h.addColorStop(1,'#0000');x.fillStyle=h;x.fillRect(0,0,64,256);rayMap=new T.CanvasTexture(c);rayMap.colorSpace=T.SRGBColorSpace;return rayMap}
export function createDropStage(scene){
 const group=new T.Group(),tilt=new T.Group(),ball=new T.Group();scene.add(group);group.add(tilt);tilt.add(ball);tilt.rotation.set(.16,0,0);group.visible=false;
 const tintColor=new T.Color(0x51d0c3),revealColor=new T.Color(0x51d0c3),scratch=new T.Color(),additive={transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false};
 // Materiales: paneles de color brillante, paneles oscuros hundidos y marcos blancos.
 const colorMat=new T.MeshPhysicalMaterial({color:0x51d0c3,metalness:.18,roughness:.26,clearcoat:1,clearcoatRoughness:.12,emissive:0x51d0c3,emissiveIntensity:.1,transparent:true,side:T.DoubleSide});
 const edgeMat=new T.MeshStandardMaterial({color:0x2a7f78,metalness:.3,roughness:.4,emissive:0x51d0c3,emissiveIntensity:.08,transparent:true,side:T.DoubleSide});
 const darkMat=new T.MeshStandardMaterial({color:0x1a1d24,metalness:.75,roughness:.28,transparent:true,side:T.DoubleSide});
 const rimBase=new T.Color(0xb5bfcc),rimMat=new T.MeshStandardMaterial({color:0xf4f7fb,metalness:.4,roughness:.26,emissive:0xb5bfcc,emissiveIntensity:.4,transparent:true,side:T.DoubleSide});
 const decalMats=[],decal=(texture,size,color)=>{const m=new T.MeshBasicMaterial({map:texture,transparent:true,toneMapped:false,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});m.userData.tint=color;decalMats.push(m);return m};
 const panels=buildPanels().map(p=>{const grp=new T.Group();grp.add(new T.Mesh(p.top,p.dark?darkMat:colorMat),new T.Mesh(p.rim,p.dark?rimMat:edgeMat));ball.add(grp);
  const axis=new T.Vector3().randomDirection(),seed=Math.random();return{...p,grp,axis,seed,quat:new T.Quaternion()}});
 // Decoración: ranuras plateadas y logo en los hexágonos superiores, emblema de rombo en los cuadrados laterales.
 const hexUp=panels.filter(p=>p.kind==='hexUp').sort((a,b)=>Math.atan2(a.normal.z,a.normal.x)-Math.atan2(b.normal.z,b.normal.x)),sides=panels.filter(p=>p.kind==='side');
 const glyphMat=decal(null,0,new T.Color(1,1,1)),slitMat=decal(slitTexture(),0,new T.Color(1,1,1)),diamondMat=decal(diamondTexture(),0,null);
 const place=(panel,material,w,h,rotate=0)=>{const mesh=new T.Mesh(new T.PlaneGeometry(w,h),material);mesh.position.copy(panel.anchor);mesh.quaternion.copy(facing(panel.normal));mesh.rotateZ(rotate);mesh.renderOrder=3;panel.grp.add(mesh);return mesh};
 hexUp.forEach((p,i)=>{if(i%2===0)place(p,slitMat,R*.7,R*.38);else place(p,glyphMat,R*.62,R*.62)});
 sides.forEach(p=>place(p,diamondMat,R*.5,R*.5));
 // Luz interior que se cuela por las juntas.
 const core=new T.Sprite(new T.SpriteMaterial({map:softGlow(),color:0xffffff,opacity:0,...additive}));core.scale.set(1.6,1.6,1);group.add(core);
 const glow=new T.Sprite(new T.SpriteMaterial({map:softGlow(),color:0x68fff1,opacity:.6,...additive}));glow.scale.set(2.6,2.6,1);group.add(glow);
 // Rayos, suelo, runas, onda de choque.
 const rayMat=new T.MeshBasicMaterial({map:rays(),color:0x8dfff1,opacity:.1,side:T.DoubleSide,...additive}),rayGroup=new T.Group();rayGroup.position.y=-.62;group.add(rayGroup);
 for(let i=0;i<10;i++){const m=new T.Mesh(new T.PlaneGeometry(.55,3.6),rayMat);m.position.y=1.7;m.rotation.y=i*Math.PI/10;rayGroup.add(m)}
 const floorMat=new T.MeshBasicMaterial({map:softGlow(),color:0x8dfff1,opacity:.7,...additive}),floorGlow=new T.Mesh(new T.CircleGeometry(1.3,32),floorMat);floorGlow.rotation.x=-Math.PI/2;floorGlow.position.y=-.645;group.add(floorGlow);
 const ringMat=new T.MeshBasicMaterial({color:0x8dfff1,opacity:.7,...additive}),ring=new T.Mesh(new T.TorusGeometry(.7,.016,5,64),ringMat);ring.rotation.x=Math.PI/2;ring.position.y=-.65;group.add(ring);
 const runes=new T.Group();runes.position.y=-.647;group.add(runes);for(let i=0;i<28;i++){const a=i*Math.PI*2/28,m=new T.Mesh(new T.BoxGeometry(i%2?.05:.1,.006,.02),ringMat);m.position.set(Math.cos(a)*.92,0,Math.sin(a)*.92);m.rotation.y=-a;runes.add(m)}
 const shock=new T.Mesh(new T.TorusGeometry(1,.03,6,80),new T.MeshBasicMaterial({color:0xffffff,opacity:0,...additive})),shock2=new T.Mesh(new T.TorusGeometry(1,.02,6,80),new T.MeshBasicMaterial({color:0xffffff,opacity:0,...additive}));for(const s of [shock,shock2]){s.rotation.x=Math.PI/2;s.position.y=-.63;group.add(s)}
 const beam=new T.Mesh(new T.CylinderGeometry(.05,.65,2,20,1,true),new T.MeshBasicMaterial({color:0x8af4ff,side:T.DoubleSide,opacity:.12,...additive}));beam.position.y=.35;group.add(beam);
 const flash=new T.Sprite(new T.SpriteMaterial({map:softGlow(),color:0xffffff,opacity:0,...additive}));flash.scale.set(6,6,1);group.add(flash);
 const motes=createSoftPoints(240);group.add(motes.points);
 const seeds=Array.from({length:240},()=>{const z=Math.random()*2-1,a=Math.random()*6.283,r=Math.sqrt(1-z*z);return{s:Math.random(),a,dx:Math.cos(a)*r,dy:Math.abs(z)*.8+.25,dz:Math.sin(a)*r,v:4+Math.random()*9,size:.07+Math.random()*.13}});
 let clock=0,opening=false,completed=false,type='sport',power=0;
 const tint=color=>{tintColor.set(color);colorMat.color.set(color);colorMat.emissive.set(color);edgeMat.color.set(color).multiplyScalar(.5);edgeMat.emissive.set(color);diamondMat.color.set(color).lerp(WHITE,.55);glow.material.color.set(color);beam.material.color.set(color);ring.material.color.set(color);ringMat.color.set(color);rayMat.color.set(color);floorMat.color.set(color)};
 const resetState=()=>{for(const m of [colorMat,edgeMat,darkMat,rimMat,glyphMat,slitMat,diamondMat])m.opacity=1;colorMat.emissiveIntensity=.1;rimMat.emissive.copy(rimBase);rimMat.emissiveIntensity=.38;
  panels.forEach(p=>{p.grp.position.set(0,0,0);p.grp.quaternion.identity();p.grp.scale.setScalar(1)});ball.position.set(0,0,0);ball.rotation.set(0,0,0);tilt.scale.setScalar(1);
  ringMat.opacity=.7;floorMat.opacity=.6;rayMat.opacity=.1;beam.scale.set(1,1,1);beam.material.opacity=.12;glow.scale.set(2.6,2.6,1);core.material.opacity=0;flash.material.opacity=0;shock.material.opacity=shock2.material.opacity=0;rayGroup.scale.set(1,1,1);ring.scale.setScalar(1);floorGlow.scale.setScalar(1);motes.flush(0)};
 const setType=drop=>{type=drop;glyphMat.map=glyphTexture(drop);glyphMat.needsUpdate=true};
 return{group,get completed(){return completed},get clock(){return clock},
  idle(drop){setType(drop);opening=false;completed=false;group.visible=true;group.position.set(1.4,.9,30);tint(dropById(drop).color);resetState()},
  start(drop,skip=false,reveal=null){setType(drop);clock=0;opening=true;completed=skip;group.position.set(0,.9,30);group.visible=!skip;resetState();tint(dropById(drop).color);const content=dropById(drop).contents,id=reveal||content[content.length-1].rarity;revealColor.set(rarityById(id).color);power=clamp(RARITIES.findIndex(r=>r.id===id)/6)},
  hide(){group.visible=false},
  update(dt,time){
   if(!group.visible)return;
   rayGroup.rotation.y=time*(opening?.9:.25);runes.rotation.y=-time*.4;ring.rotation.z=time*.3;
   // Reposo (vista previa en el inventario): el balón gira despacio y flota.
   if(!opening){
    ball.rotation.y=Math.sin(time*.8)*.32;tilt.position.y=Math.sin(time*1.5)*.05;glow.material.opacity=.4+Math.sin(time*2)*.08;beam.material.opacity=.08;rayMat.opacity=.08;floorMat.opacity=.5;rimMat.emissiveIntensity=.38+Math.sin(time*2.2)*.06;
    let n=0;for(let i=0;i<48;i++){const sd=seeds[i],u=(time*.22+sd.s)%1,a=sd.a+time*.5;motes.set(n++,Math.cos(a)*(.6+sd.s*.5),-.6+u*1.7,Math.sin(a)*(.6+sd.s*.5),sd.size*.8,tintColor.r,tintColor.g,tintColor.b,Math.sin(u*Math.PI)*.7)}motes.flush(n);motes.pixelScale();
    return;
   }
   clock+=dt;
   if(clock<BURST){
    // Carga: color por rareza, vibración creciente, paneles que se separan y chispas en espiral hacia el balón.
    const k=clock/BURST,drop=dropById(type),index=Math.min(drop.contents.length-1,Math.floor(clock/(BURST/drop.contents.length)));tint(rarityById(drop.contents[index].rarity).color);
    const shake=k*k*.045;tilt.position.set(Math.sin(clock*63)*shake,Math.sin(clock*4)*.03+Math.cos(clock*57)*shake,Math.cos(clock*49)*shake);
    ball.rotation.y=time*(.45+k*1.9);colorMat.emissiveIntensity=.1+Math.pow(Math.sin(clock*(5+k*14)),2)*.9*k+k*.5;rimMat.emissive.copy(rimBase).lerp(tintColor,Math.min(1,k*1.3));rimMat.emissiveIntensity=.38+k*1.5+Math.sin(clock*(8+k*20))*.25*k;
    panels.forEach((p,i)=>p.grp.position.copy(p.center).multiplyScalar(k*k*.05+Math.sin(clock*40+i*2)*.007*k));
    core.material.color.copy(tintColor);core.material.opacity=k*k*.85;core.scale.setScalar(1.2+k*1.6);
    glow.material.opacity=.35+Math.pow(Math.sin(clock*5),8)*.5+k*.5;glow.scale.setScalar(2.6+k*1.4);beam.material.opacity=.09+k*.25;rayMat.opacity=.1+k*.3;floorMat.opacity=.6+k*.4;
    let n=0;for(let i=0;i<150;i++){const sd=seeds[i],u=(clock*(.55+k*1.5)+sd.s)%1,r=1.9*(1-u)+.15,a=sd.a+clock*(2+k*5)+u*3;motes.set(n++,Math.cos(a)*r,-.6+u*1.1+Math.sin(sd.s*9)*.2,Math.sin(a)*r,sd.size*(.6+k*.5),tintColor.r,tintColor.g,tintColor.b,Math.sin(u*Math.PI)*(.35+k*.65))}
    motes.flush(n);motes.pixelScale();return;
   }
   // Estallido: los paneles salen despedidos, el núcleo brilla, onda de choque y lluvia de chispas con el color de la rareza.
   const t=clock-BURST;tint(revealColor);tilt.position.set(0,0,0);ball.rotation.y=time*1.1;
   const fade=clamp((t-.7)/.8);panels.forEach((p,i)=>{const speed=3.2+p.seed*3.2,f=(1-Math.exp(-2.8*t))/2.8;p.grp.position.copy(p.center).multiplyScalar(.05+speed*f*.42);p.quat.setFromAxisAngle(p.axis,(2+p.seed*5)*f);p.grp.quaternion.copy(p.quat);p.grp.scale.setScalar(Math.max(.01,1-fade*.75))});
   for(const m of [colorMat,edgeMat,darkMat,rimMat,glyphMat,slitMat,diamondMat])m.opacity=1-fade;colorMat.emissiveIntensity=1.6*(1-clamp(t/.8));rimMat.emissive.copy(revealColor).lerp(WHITE,.4);rimMat.emissiveIntensity=.38+1.9*(1-clamp(t/.6));
   core.material.color.copy(revealColor).lerp(new T.Color(1,1,1),.55);core.material.opacity=Math.max(0,1-t*1.1);core.scale.setScalar(2.8+t*(7+power*5));
   flash.material.opacity=Math.max(0,1-t*3.4);flash.scale.setScalar(6+t*(20+power*10));glow.material.opacity=Math.max(0,1-t*.9);glow.scale.setScalar(3.6+t*(5+power*4));
   shock.material.color.copy(revealColor).lerp(new T.Color(1,1,1),.5);shock.scale.setScalar(.6+t*8);shock.material.opacity=Math.max(0,.95-t*.9);
   if(power>.3){shock2.material.color.copy(revealColor);const t2=Math.max(0,t-.15);shock2.scale.setScalar(.4+t2*(11+power*6));shock2.material.opacity=Math.max(0,.8-t2*.8)}
   rayGroup.scale.set(1,1+t*.7,1);rayMat.opacity=Math.max(0,.55+power*.15-t*.5);beam.scale.set(1+t*2,1+t*1.5,1+t*2);beam.material.opacity=Math.max(0,.4-t*.3);floorMat.opacity=Math.max(0,1-t*.7);
   ring.scale.setScalar(1+t*4);ringMat.opacity=Math.max(0,.7-t*.55);floorGlow.scale.setScalar(1+t*2.5);
   const count=Math.floor(130+power*110);let n=0;for(let i=0;i<count;i++){const sd=seeds[i],f=(1-Math.exp(-2.2*t))/2.2,life=clamp(t/(1.1+sd.s*.6));motes.set(n++,sd.dx*sd.v*f*.55,sd.dy*sd.v*f*.7-3.2*t*t*.5,sd.dz*sd.v*f*.55,sd.size*(1.2-life*.7),revealColor.r*(1-life*.2)+.2*(1-life),revealColor.g*(1-life*.2)+.2*(1-life),revealColor.b*(1-life*.2)+.2*(1-life),(1-life)*(.9+power*.1))}
   motes.flush(n);motes.pixelScale();
   if(clock>=END){completed=true;group.visible=false;resetState()}
  }};
}
