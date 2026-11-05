// Mapas por modo de juego (solo visuales: la física y la cancha son las mismas).
//  · snowday    → aldea nevada al atardecer: arcos con columnas de color, pinos, casas, rocas y colinas con nieve, nieve cayendo
//  · heatseeker → arena de neón oscura: suelo de rejilla, paredes y techo marcados con neón, olas y pirámides al fondo
// El estadio normal se oculta mientras dura el mapa y se vuelve a mostrar al salir al menú.
import * as T from './vendor/three.module.js';
import {ARENA,arenaPerimeter,floorRadius} from './arena-shape.js?v=final2';
import {softGlow} from './boost-visual.js?v=final2';
const {width:W,length:L,height:H}=ARENA;
const BLUE=0x2fb4ff,ORANGE=0xff8a2e;
const rnd=(()=>{let s=20261104;return()=>(s=(s*1664525+1013904223)>>>0)/4294967296})();
const fract=v=>v-Math.floor(v),h3=(x,y,z,s=0)=>fract(Math.sin((x*12.9898+y*78.233+z*37.719+s)*43758.5453));
const mx=(x,y,z,ry=0,sx=1,sy=sx,sz=sx,rx=0,rz=0)=>new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(sx,sy,sz));

// Malla fusionada con color por vértice (un solo dibujo para cientos de piezas)
class Batch{
 constructor(){this.p=[];this.n=[];this.c=[]}
 add(geo,m,color,jit=0){
  const g=geo.index?geo.toNonIndexed():geo.clone();g.applyMatrix4(m);const p=g.attributes.position,n=g.attributes.normal,c=new T.Color(color);let k=1;
  for(let i=0;i<p.count;i++){if(i%3===0)k=1+(rnd()-.5)*jit;this.p.push(p.getX(i),p.getY(i),p.getZ(i));this.n.push(n.getX(i),n.getY(i),n.getZ(i));this.c.push(c.r*k,c.g*k,c.b*k)}
  g.dispose();
 }
 mesh(mat){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(this.n,3));g.setAttribute('color',new T.Float32BufferAttribute(this.c,3));const m=new T.Mesh(g,mat);m.frustumCulled=false;return m}
}
function wobble(geo,amp,seed){const p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+(h3(Math.round(x*40),Math.round(y*40),Math.round(z*40),seed)-.5)*amp;p.setXYZ(i,x*k,y,z*k)}geo.computeVertexNormals();return geo}
const BOX=new T.BoxGeometry(1,1,1),SPH=new T.IcosahedronGeometry(1,1),SPH0=new T.IcosahedronGeometry(1,0),CYL6=new T.CylinderGeometry(1,1,1,6);

function floorMesh(material,y){
 const per=arenaPerimeter(),contour=per.map(p=>{const r=floorRadius(p);return new T.Vector2(p.x+p.nx*r,p.z+p.nz*r)}),tris=T.ShapeUtils.triangulateShape(contour,[]);
 const pos=[],uv=[];for(const c of contour){pos.push(c.x,0,c.y);uv.push((c.x+W)/(2*W),(c.y+L)/(2*L))}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(tris.flat());
 const m=new T.Mesh(g,material);m.position.y=y;return m;
}
function dome(fragment,uniforms,radius=290){
 const m=new T.Mesh(new T.SphereGeometry(radius,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms,vertexShader:'varying vec3 d;void main(){d=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 d;uniform float time;float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}\n'+fragment}));
 m.renderOrder=-100;m.frustumCulled=false;return m;
}
const spaced=step=>{const per=arenaPerimeter(),out=[];let acc=step;for(let i=0;i<per.length;i++){const p=per[i],q=per[(i+1)%per.length];acc+=Math.hypot(q.x-p.x,q.z-p.z);if(acc>=step){acc=0;out.push({x:p.x,z:p.z,nx:p.nx,nz:p.nz})}}return out};
const teamColor=z=>{const t=Math.max(-1,Math.min(1,z/16)),mid=new T.Color(0xcfe9ff);return t>=0?mid.clone().lerp(new T.Color(BLUE),t):mid.clone().lerp(new T.Color(ORANGE),-t)};
const ring=(inner,outer)=>{const a=rnd()*6.283,r=inner+rnd()*(outer-inner);return[Math.cos(a)*r,Math.sin(a)*r]};
const outward=(p,o)=>({x:p.x-p.nx*o,z:p.z-p.nz*o});

// ───────────────────────── SNOW DAY ─────────────────────────
function pillarTexture(base,accent){
 const c=document.createElement('canvas');c.width=256;c.height=512;const x=c.getContext('2d');
 x.fillStyle=base;x.fillRect(0,0,256,512);
 for(let i=0;i<16;i++){x.fillStyle=i%2?'rgba(255,255,255,.07)':'rgba(0,0,0,.14)';x.fillRect(i*16,0,8,512)}             // estrías verticales
 x.fillStyle=accent;for(const y of [14,30,470,490]){x.fillRect(0,y,256,7)}x.fillRect(0,236,256,5);x.fillRect(0,250,256,5);   // bandas doradas
 x.fillStyle='rgba(255,255,255,.1)';for(let i=0;i<300;i++)x.fillRect(rnd()*256,rnd()*512,1+rnd()*2,1+rnd()*3);
 const blot=(px,py,rx,ry)=>{const g=x.createRadialGradient(px,py,0,px,py,Math.max(rx,ry));g.addColorStop(0,'rgba(248,251,255,1)');g.addColorStop(.7,'rgba(240,246,255,.95)');g.addColorStop(1,'rgba(240,246,255,0)');x.save();x.translate(px,py);x.scale(rx/Math.max(rx,ry),ry/Math.max(rx,ry));x.translate(-px,-py);x.fillStyle=g;x.beginPath();x.arc(px,py,Math.max(rx,ry),0,7);x.fill();x.restore()};
 for(let i=0;i<9;i++)blot(rnd()*256,rnd()*70,24+rnd()*30,18+rnd()*22);          // nieve acumulada arriba
 for(let i=0;i<8;i++)blot(rnd()*256,430+rnd()*82,26+rnd()*30,16+rnd()*24);      // y abajo
 for(let i=0;i<9;i++)blot(rnd()*256,90+rnd()*320,5+rnd()*13,8+rnd()*22);        // manchas sueltas
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=T.RepeatWrapping;t.anisotropy=8;return t;
}
// Textura de nieve en mosaico (1024 px por ~7 m): grano fino, destellos, briznas de hierba y bordes definidos
function snowTile(opaque){
 const S=1024,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');
 x.fillStyle=opaque?'#eef3fd':'rgba(240,246,255,.97)';x.fillRect(0,0,S,S);
 if(!opaque){x.globalCompositeOperation='destination-out';for(let i=0;i<220;i++){const px=rnd()*S,py=rnd()*S;x.fillStyle='rgba(0,0,0,'+(.1+rnd()*.22)+')';x.beginPath();x.ellipse(px,py,1.5+rnd()*6,1+rnd()*3.5,rnd()*3,0,7);x.fill()}x.globalCompositeOperation='source-over'}
 for(let i=0;i<90;i++){const px=rnd()*S,py=rnd()*S,r=20+rnd()*60,gr=x.createRadialGradient(px,py,0,px,py,r);gr.addColorStop(0,'rgba(180,198,238,.10)');gr.addColorStop(1,'rgba(180,198,238,0)');x.fillStyle=gr;x.fillRect(px-r,py-r,2*r,2*r)}
 for(let i=0;i<9000;i++){x.fillStyle=rnd()<.5?'rgba(255,255,255,'+(.3+rnd()*.5)+')':'rgba(165,188,232,'+(.12+rnd()*.2)+')';x.fillRect(rnd()*S,rnd()*S,1+(rnd()<.2?1:0),1)}
 for(let i=0;i<600;i++){x.fillStyle='rgba(50,95,65,'+(.12+rnd()*.16)+')';x.fillRect(rnd()*S,rnd()*S,1,2+rnd()*3)}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=16;return t;
}
// Rama de abeto dibujada a mano (canvas con transparencia): tallo, agujas en abanico y, en la capa de nieve, cobertura blanca
function branchTexture(snow){
 const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');x.translate(0,64);x.lineCap='round';
 const draw=(col,w,sx,sy,ex,ey)=>{x.strokeStyle=col;x.lineWidth=w;x.beginPath();x.moveTo(sx,sy);x.lineTo(ex,ey);x.stroke()};
 if(!snow)draw('#4a3a26',3,2,0,232,0);
 for(let i=0;i<260;i++){const t=i/260,px=6+t*240,len=(1-t*.6)*66*(.75+rnd()*.5);
  for(const side of [-1,1]){const ang=.55+rnd()*.35,mL=60*Math.sqrt(Math.max(0,1-Math.pow((px-118)/128,2))),ey=side*Math.min(Math.sin(ang)*len,mL),ex=Math.min(px+Math.cos(ang)*len*.85,118+128*Math.sqrt(Math.max(0,1-Math.pow(ey/64,2))));
   if(!snow){const g=40+rnd()*45;draw('rgb('+Math.floor(14+rnd()*20)+','+Math.floor(g+30)+','+Math.floor(30+rnd()*25)+')',3.6,px,0,ex,ey);draw('rgb('+Math.floor(30+rnd()*20)+','+Math.floor(g+62)+','+Math.floor(50+rnd()*25)+')',1.6,px,0,ex*.98,ey*.98)}
   else if(rnd()<.78)draw('rgba(248,251,255,'+(.8+rnd()*.2)+')',4.6+rnd()*2,px+1,side*1.5,ex*.96,ey*.9)}}
 if(snow){for(let i=0;i<90;i++){const px=10+rnd()*205,py=(rnd()-.5)*44,r=4+rnd()*9;x.fillStyle='rgba(250,252,255,'+(.8+rnd()*.2)+')';x.beginPath();x.ellipse(px,py,r*1.6,r,0,0,7);x.fill()}draw('rgba(250,252,255,.95)',5,2,0,228,0)}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;
}
function buildSnow(){
 const g=new T.Group(),far=new T.Group(),mid=new T.Group();g.add(far,mid);
 g.add(dome(`uniform vec3 top,mid,horizon;void main(){vec3 n=normalize(d);float h=clamp(n.y,0.0,1.0);vec3 c=mix(horizon,mid,smoothstep(0.0,.22,h));c=mix(c,top,smoothstep(.2,.8,h));
  vec3 cell=floor(n*430.0);float st=step(.9972,hash(cell))*smoothstep(.12,.5,h);c+=vec3(st*(.6+.4*sin(time*2.0+hash(cell)*30.0)));
  vec3 m=normalize(vec3(.6,.42,-.68));float md=dot(n,m);c+=vec3(1.0,.93,.85)*(smoothstep(.99935,.9996,md)*.9+pow(max(md,0.0),80.0)*.12);gl_FragColor=vec4(c,1.0);}`,
  {time:{value:0},top:{value:new T.Color(0x1d1646)},mid:{value:new T.Color(0x64417f)},horizon:{value:new T.Color(0xe79a82)}}));
 const groundTex=snowTile(true);groundTex.repeat.set(190,190);const ground=new T.Mesh(new T.PlaneGeometry(1500,1500),new T.MeshStandardMaterial({color:0xffffff,map:groundTex,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.62;g.add(ground);
 // nieve sobre el césped: mosaico nítido repetido por todo el campo
 const tex=snowTile(false);tex.repeat.set(12,14);
 g.add(floorMesh(new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:T.DoubleSide,color:0xeef0ff,polygonOffset:true,polygonOffsetFactor:-.5,polygonOffsetUnits:-.5}),.008));

 const lightPos=[],lightCol=[],palette=[0xff4a4a,0x4aff7a,0xffe14a,0x4aa8ff,0xff7ad9,0xfff0c8].map(h=>new T.Color(h)),glowPos=[],lit=new Batch(),glow=new Batch(),forest=new Batch(),SNOW=0xf5f8ff;
 const addLight=(px,py,pz,i)=>{const col=palette[Math.abs(Math.floor(i))%palette.length];lightPos.push(px,py,pz);lightCol.push(col.r,col.g,col.b)};

 // ── arcos con columnas de color y nieve ──
 const stoneMat=new T.MeshStandardMaterial({color:0xffffff,roughness:.8}),texBlue=pillarTexture('#35568a','#e0b552'),texOrange=pillarTexture('#8f4c36','#e8c15a'),texMid=pillarTexture('#5a4f78','#e0b552');
 const matBlue=new T.MeshStandardMaterial({map:texBlue,roughness:.75}),matOrange=new T.MeshStandardMaterial({map:texOrange,roughness:.75}),matMid=new T.MeshStandardMaterial({map:texMid,roughness:.75});
 const shaftGeo=new T.CylinderGeometry(.95,1.08,12,18,1);
 const sideOf=z=>z>7?[matBlue,0x3a5c92,0x2a4572]:z<-7?[matOrange,0x9a523a,0x73392a]:[matMid,0x66588a,0x4c4068];
 const P=spaced(10);
 P.forEach((p,i)=>{
  const a=outward(p,17),q=P[(i+1)%P.length],b=outward(q,17),[mat,stone,dark]=sideOf(p.z);
  const shaft=new T.Mesh(shaftGeo,mat);shaft.position.set(a.x,6.6,a.z);shaft.rotation.y=rnd()*6;mid.add(shaft);
  lit.add(BOX,mx(a.x,.5,a.z,0,3,1,3),dark);lit.add(BOX,mx(a.x,1.15,a.z,0,2.4,.4,2.4),stone);                  // plinto escalonado
  lit.add(CYL6,mx(a.x,12.9,a.z,0,1.5,.55,1.5),0xd9b04e);lit.add(BOX,mx(a.x,13.3,a.z,0,3,.35,3),stone);          // capitel dorado + ábaco
  lit.add(SPH,mx(a.x,13.55,a.z,0,1.9,.5,1.9),SNOW);lit.add(SPH,mx(a.x+.3,.55,a.z-.2,0,2.6,.7,2.4),SNOW);        // nieve en lo alto y al pie
  lit.add(SPH,mx(a.x-1.6,.35,a.z+1,0,1.5,.45,1.2),SNOW);
  const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),r=d/2,cx=dx/d,cz=dz/d,mxp=(a.x+b.x)/2,mzp=(a.z+b.z)/2,ry=-Math.atan2(dz,dx);
  const arch=new T.Mesh(new T.TorusGeometry(r,.55,10,32,Math.PI),stoneMat);arch.material=new T.MeshStandardMaterial({color:stone,roughness:.8});arch.position.set(mxp,13.6,mzp);arch.rotation.y=ry;mid.add(arch);
  const trim=new T.Mesh(new T.TorusGeometry(r,.2,6,32,Math.PI),new T.MeshStandardMaterial({color:0xd9b04e,roughness:.5,metalness:.3}));trim.position.set(mxp,13.6,mzp);trim.rotation.y=ry;trim.scale.set(1,1,1.0);mid.add(trim);
  // nieve apoyada sobre algunos tramos del arco
  for(let s=0;s<9;s++){const st=.05+rnd()*2.7,len=.7+rnd()*.9,sn=new T.Mesh(new T.TorusGeometry(r,.52,6,12,len),new T.MeshStandardMaterial({color:SNOW,roughness:1}));sn.position.set(mxp,13.86,mzp);sn.rotation.set(0,ry,st);sn.scale.set(1,1,.9);mid.add(sn)}
  for(let k=0;k<=12;k++){const ang=Math.PI*k/12;addLight(mxp+cx*r*Math.cos(ang),13.6+r*Math.sin(ang)-.55,mzp+cz*r*Math.cos(ang),i*3+k)}
  for(let k=0;k<14;k++){const ang=k*.9;addLight(a.x+Math.cos(ang)*1.15,1.2+k*.78,a.z+Math.sin(ang)*1.15,i+k)}
  if(i%3===0){const blue=p.z>0,flag=new T.Mesh(new T.PlaneGeometry(2.2,7),new T.MeshStandardMaterial({color:blue?0x2a8cff:0xff7a2a,emissive:blue?0x0a3a80:0x802a0a,emissiveIntensity:.6,side:T.DoubleSide,roughness:.8}));flag.position.set(a.x+p.nx*1.7,9,a.z+p.nz*1.7);flag.lookAt(a.x+p.nx*5,9,a.z+p.nz*5);mid.add(flag)}
 });

 // ── pinos nevados detallados ──
 const pine=(px,pz,s,tiers,decor)=>{
  const trunkH=2.2*s;forest.add(CYL6,mx(px,trunkH/2,pz,0,.4*s,trunkH,.4*s),0x4a3222,.2);
  let y=trunkH*.55;const R0=3.7*s,H0=2.5*s,greens=[0x1f4d36,0x25593a,0x1b4531,0x2a6340];
  for(let i=0;i<tiers;i++){
   const f=1-i/tiers,r=R0*(.22+.78*f),h=H0*(1.1+.25*f),ry=rnd()*6.28;
   forest.add(wobble(new T.ConeGeometry(r,h,12,2),.3,px*3+i+pz),mx(px,y+h/2,pz,ry),greens[(i+Math.floor(px))&3],.22);
   forest.add(wobble(new T.ConeGeometry(r*.95,h*.74,12,2),.4,i*5+pz),mx(px,y+h*.5+h*.11,pz,ry),SNOW,.05);
   for(let k=0;k<7;k++){const a=rnd()*6.28,rr=r*(.5+rnd()*.42);forest.add(SPH0,mx(px+Math.cos(a)*rr,y+h*(.12+rnd()*.15),pz+Math.sin(a)*rr,0,.55*s*(.6+rnd()*.7),.28*s,.55*s*(.6+rnd()*.7)),SNOW)}
   if(decor)for(let k=0;k<6;k++){const a=rnd()*6.28,rr=r*(.5+rnd()*.4);addLight(px+Math.cos(a)*rr,y+h*(.1+rnd()*.35),pz+Math.sin(a)*rr,(i+k)%6)}
   y+=h*.52;
  }
  forest.add(new T.ConeGeometry(.6*s,1.6*s,6),mx(px,y+.5*s,pz),greens[0]);forest.add(SPH0,mx(px,y+1.2*s,pz,0,.55*s,.45*s,.55*s),SNOW);
  if(decor)addLight(px,y+1.9*s,pz,2);
 };
 const bare=(px,pz,s)=>{   // árbol sin hojas con nieve en las ramas
  forest.add(CYL6,mx(px,2.2*s,pz,0,.34*s,4.4*s,.34*s),0x45362c);
  for(let k=0;k<7;k++){const a=k*.9+rnd(),hy=(2.2+k*.45)*s,len=(1.7+rnd()*1.2)*s*(1-k*.06),tilt=.9+rnd()*.5;
   forest.add(CYL6,mx(px+Math.cos(a)*len*.35,hy+len*.28,pz+Math.sin(a)*len*.35,-a,.09*s,len,.09*s,0,tilt),0x45362c);
   forest.add(CYL6,mx(px+Math.cos(a)*len*.35,hy+len*.28+.08*s,pz+Math.sin(a)*len*.35,-a,.12*s,len*.8,.07*s,0,tilt),SNOW)}
  forest.add(SPH0,mx(px,4.5*s,pz,0,.5*s,.3*s,.5*s),SNOW);
 };
 // pinos realistas: tronco, cuerpo oscuro y cientos de ramas con agujas (tarjetas con textura) más una capa de nieve encima
 const baseM=[],snowM=[];
 const pineCards=(px,pz,s,decor)=>{
  const T_=11+Math.floor(rnd()*2),trunkH=.9*s,step=.72*s,total=trunkH+T_*step;
  forest.add(CYL6,mx(px,trunkH*1.2,pz,0,.5*s,trunkH*2.4,.5*s),0x3e2c20);
  forest.add(new T.ConeGeometry(3.4*s,total*.95,14,4),mx(px,total*.47,pz),0x16381f,.2);                    // cuerpo oscuro que rellena y esconde el tronco
  for(let i=0;i<T_;i++){
   const f=1-i/T_,y=trunkH*.8+i*step,len=(1.4+3.9*f)*s,n=16+Math.floor(f*12);
   for(let k=0;k<n;k++){const a=(k/n)*6.283+rnd()*.35+i*.9,L2=len*(.88+rnd()*.14),W2=L2*(.9+rnd()*.12),yy=y+rnd()*.35*s,rz=.1+rnd()*.22,ox=Math.cos(a)*.2*s,oz=Math.sin(a)*.2*s;
    baseM.push([mx(px+ox,yy,pz+oz,-a,L2,1,W2,0,rz),.8+rnd()*.35]);snowM.push(mx(px+ox,yy+.08*s,pz+oz,-a,L2*(.6+rnd()*.4),1,W2*.95,0,rz))}
   if(decor)for(let k=0;k<7;k++){const a=rnd()*6.28,rr=len*(.35+rnd()*.55);addLight(px+Math.cos(a)*rr,y+.1*s,pz+Math.sin(a)*rr,i+k)}
  }
  forest.add(new T.ConeGeometry(1.7*s,2.4*s,14,2),mx(px,total+.6*s,pz),0x1d4a2c);forest.add(new T.ConeGeometry(1.3*s,1.5*s,14,1),mx(px,total+.95*s,pz),SNOW);
 };
 const nearTrees=[],per0=arenaPerimeter();
 for(let i=0;i<80;i++){const p=per0[Math.floor(rnd()*per0.length)],o=22+rnd()*30,pt=outward(p,o);nearTrees.push([pt.x+(rnd()-.5)*8,pt.z+(rnd()-.5)*8,i%3===0?.8+rnd()*.4:1.4+rnd()*.7,i<14])}
 nearTrees.forEach(([x0,z0,s,d],i)=>i%7===6?bare(x0,z0,s):pineCards(x0,z0,s,d));
 const treeCards=new T.Group();mid.add(treeCards);
 {const cardGeo=new T.PlaneGeometry(1,1,3,1);cardGeo.rotateX(-Math.PI/2);cardGeo.translate(.5,0,0);const pp=cardGeo.attributes.position;for(let i=0;i<pp.count;i++)pp.setY(i,-Math.pow(pp.getX(i),2)*.4);cardGeo.computeVertexNormals();
  const green=new T.InstancedMesh(cardGeo,new T.MeshStandardMaterial({map:branchTexture(false),alphaTest:.45,side:T.DoubleSide,roughness:.9}),baseM.length),white=new T.InstancedMesh(cardGeo,new T.MeshStandardMaterial({map:branchTexture(true),alphaTest:.45,side:T.FrontSide,roughness:1}),snowM.length),cc=new T.Color();
  baseM.forEach(([m,k],i)=>{green.setMatrixAt(i,m);green.setColorAt(i,cc.setRGB(.7*k,.95*k,.7*k))});snowM.forEach((m,i)=>white.setMatrixAt(i,m));
  green.frustumCulled=white.frustumCulled=false;treeCards.add(green,white)}
 // bosque lejano (pinos sencillos) sobre las colinas
 for(let i=0;i<190;i++){const [fx,fz]=ring(125,245),s=1.3+rnd()*1.3;forest.add(wobble(new T.ConeGeometry(2.4*s,7*s,7,1),.3,i),mx(fx,3.5*s,fz),0x1b4431,.25);forest.add(new T.ConeGeometry(2*s,3.6*s,7),mx(fx,5.2*s,fz),SNOW)}

 // ── aldea: casas y torre con nieve, ventanas encendidas ──
 const house=(px,pz,ry,w,d,h,wall,roof,tower)=>{
  const M=(x,y,z,sx,sy,sz,rz=0)=>{const c=Math.cos(ry),s=Math.sin(ry);return mx(px+x*c+z*s,y,pz-x*s+z*c,ry,sx,sy,sz,0,rz)};
  lit.add(BOX,M(0,h/2,0,w,h,d),wall,.08);lit.add(BOX,M(0,.25,0,w+.4,.5,d+.4),0x6b6a72);
  if(tower){lit.add(new T.ConeGeometry(Math.max(w,d)*.78,h*.75,4),mx(px,h+h*.37,pz,ry+Math.PI/4),roof);lit.add(new T.ConeGeometry(Math.max(w,d)*.62,h*.45,4),mx(px,h+h*.52,pz,ry+Math.PI/4),SNOW);lit.add(CYL6,mx(px,h+h*.88,pz,0,.15,h*.35,.15),0x6d6d78)}
  else{
   const ang=Math.atan2(h*.5,w/2),sl=Math.hypot(w/2,h*.5)+.5;
   for(const sg of [-1,1]){lit.add(BOX,M(sg*w/4,h+h*.25,0,sl,.35,d+.9,-sg*ang),roof,.1);lit.add(BOX,M(sg*(w/4-.05),h+h*.25+.3,0,sl*.93,.4,d*.9,-sg*ang),SNOW)}
   lit.add(BOX,M(w*.22,h+h*.55,d*.2,.8,1.6,.8),0x7a4a3a);lit.add(SPH,M(w*.22,h+h*.55+.9,d*.2,.65,.3,.65),SNOW);
   for(let k=0;k<5;k++)addLight(px+(rnd()-.5)*w*.9*Math.cos(ry),h+.05,pz-(rnd()-.5)*w*.9*Math.sin(ry)+d/2*0,k+px);
  }
  const rows=Math.max(1,Math.floor(h/3.4)),cols=Math.max(1,Math.floor(w/3.2));
  for(let r=0;r<rows;r++)for(let k=0;k<cols;k++){const wx=(k-(cols-1)/2)*3.1,wy=2.6+r*3.2;glow.add(BOX,M(wx,wy,d/2+.06,1.1,1.5,.08),0xffc368);glow.add(BOX,M(wx,wy,-d/2-.06,1.1,1.5,.08),0xffb050)}
  lit.add(BOX,M(0,1.3,d/2+.07,1.3,2.5,.1),0x5a3a28);
  lit.add(SPH,M(0,h*.02+.2,d/2+1.2,w*.22,.3,.9),SNOW);
 };
 const walls=[0xb9744f,0x8e5a46,0xc9a56a,0x7d8fa8,0xa86b6b,0x9aa57a],roofs=[0x6e3a2e,0x3f4a63,0x5a3a52,0x4a5a46];
 for(let i=0;i<15;i++){const [hx,hz]=ring(62,100),ang=Math.atan2(hx,hz)+Math.PI,w=7+rnd()*5,d=6+rnd()*3,h=5+rnd()*4;house(hx,hz,ang,w,d,h,walls[i%walls.length],roofs[i%roofs.length],i%5===4)}
 for(let i=0;i<9;i++){const [hx,hz]=ring(105,150),ang=Math.atan2(hx,hz)+Math.PI;house(hx,hz,ang,8+rnd()*5,7,6+rnd()*5,walls[(i+2)%walls.length],roofs[i%roofs.length],i%4===3)}

 // ── naturaleza: rocas, arbustos, montículos y colinas ──
 for(let i=0;i<100;i++){const p=per0[Math.floor(rnd()*per0.length)],pt=outward(p,20+rnd()*44),s=.8+rnd()*2.2;
  lit.add(wobble(new T.IcosahedronGeometry(1,1),.5,i),mx(pt.x,s*.45,pt.z,rnd()*6,s*1.3,s*.8,s),0x6b7180,.18);lit.add(SPH,mx(pt.x,s*.95,pt.z,0,s*1.05,s*.42,s*.85),SNOW)}
 for(let i=0;i<170;i++){const p=per0[Math.floor(rnd()*per0.length)],pt=outward(p,19+rnd()*46),s=.7+rnd()*1.3;
  lit.add(SPH,mx(pt.x,s*.6,pt.z,0,s*1.2,s*.9,s*1.2),0x2a5a3e,.3);lit.add(SPH,mx(pt.x,s*1.1,pt.z,0,s*.95,s*.4,s*.95),SNOW);
  if(i%3===0)for(let k=0;k<4;k++){const a=rnd()*6.28;lit.add(SPH,mx(pt.x+Math.cos(a)*s,s*.6+rnd()*.5,pt.z+Math.sin(a)*s,0,.12,.12,.12),0xd83a3a)}}                      // bayas rojas
 for(let i=0;i<120;i++){const p=per0[Math.floor(rnd()*per0.length)],pt=outward(p,15+rnd()*50),s=2+rnd()*5;lit.add(SPH,mx(pt.x,0,pt.z,0,s*1.6,s*.45,s*1.4),0xf2f6ff,.04)}
 for(let i=0;i<16;i++){const a=i/16*6.283+rnd()*.3,r=185+rnd()*60,s=38+rnd()*38;lit.add(wobble(new T.IcosahedronGeometry(1,3),.14,i),mx(Math.cos(a)*r,-s*.25,Math.sin(a)*r,0,s*1.5,s*.45,s*1.3),0xe3eaf8,.05)}
 // farolas con luz cálida a lo largo de un camino alrededor de la arena
 spaced(22).forEach((p,i)=>{const pt=outward(p,23);lit.add(CYL6,mx(pt.x,2.4,pt.z,0,.12,4.8,.12),0x2c2f3a);lit.add(SPH,mx(pt.x,4.9,pt.z,0,.36,.36,.36),0xffe2a0);glow.add(SPH,mx(pt.x,4.9,pt.z,0,.3,.3,.3),0xfff0c0);lit.add(SPH,mx(pt.x,5.2,pt.z,0,.55,.2,.55),SNOW)});

 const litMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.9,metalness:0});mid.add(lit.mesh(litMat));const forestMesh=forest.mesh(litMat);mid.add(forestMesh);
 mid.add(glow.mesh(new T.MeshBasicMaterial({vertexColors:true,toneMapped:false})));
 const lg=new T.BufferGeometry();lg.setAttribute('position',new T.Float32BufferAttribute(lightPos,3));lg.setAttribute('color',new T.Float32BufferAttribute(lightCol,3));
 const lights=new T.Points(lg,new T.PointsMaterial({map:softGlow(),size:1.4,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));lights.frustumCulled=false;g.add(lights);
 // nieve cayendo
 const N=2600,fp=new Float32Array(N*3),fv=new Float32Array(N),fph=new Float32Array(N);
 for(let i=0;i<N;i++){fp[i*3]=(rnd()-.5)*190;fp[i*3+1]=rnd()*46;fp[i*3+2]=(rnd()-.5)*230;fv[i]=2.2+rnd()*3.2;fph[i]=rnd()*6.28}
 const fg=new T.BufferGeometry();fg.setAttribute('position',new T.BufferAttribute(fp,3));
 const flakes=new T.Points(fg,new T.PointsMaterial({map:softGlow(),size:.55,color:0xffffff,transparent:true,opacity:.9,depthWrite:false}));flakes.frustumCulled=false;g.add(flakes);
 return{group:g,
  fog:{color:0x6f5088,near:70,far:290},hemi:{sky:0xe0d0ff,ground:0x6070a0,i:2.1},sun:{color:0xffd9ee,i:1.7,pos:[-30,60,20]},exposure:1.05,env:.55,
  tint:{wall:0xc6dcff,turf:0xffffff},hideLines:false,
  quality(k){fg.setDrawRange(0,Math.max(0,Math.round(N*Math.min(1,k+.15))));lights.visible=k>.2;forestMesh.visible=treeCards.visible=k>.4},
  tick(dt,t){g.children[2].material.uniforms.time.value=t;const a=fg.attributes.position.array;for(let i=0;i<N;i++){a[i*3+1]-=fv[i]*dt;a[i*3]+=(Math.sin(t*.7+fph[i])*.5+.7)*dt;if(a[i*3+1]<0){a[i*3+1]=46;a[i*3]=(rnd()-.5)*190}if(a[i*3]>95)a[i*3]=-95}fg.attributes.position.needsUpdate=true;lights.material.opacity=.8+.2*Math.sin(t*3)}};
}

// ───────────────────────── HEATSEEKER ─────────────────────────
function neonFloor(){
 const cw=1024,ch=2048,c=document.createElement('canvas');c.width=cw;c.height=ch;const x=c.getContext('2d'),PX=cw/(2*W),X=m=>(m+W)*PX,Y=m=>(L-m)*PX;
 const bg=x.createLinearGradient(0,0,0,ch);bg.addColorStop(0,'#0a2260');bg.addColorStop(.45,'#0a1130');bg.addColorStop(.55,'#2a0e0a');bg.addColorStop(1,'#5a2008');x.fillStyle=bg;x.fillRect(0,0,cw,ch);
 x.lineWidth=1.4;
 for(let m=-W;m<=W+.01;m+=2.56){x.strokeStyle='rgba(90,160,255,.2)';x.beginPath();x.moveTo(X(m),0);x.lineTo(X(m),ch/2);x.stroke();x.strokeStyle='rgba(255,150,70,.2)';x.beginPath();x.moveTo(X(m),ch/2);x.lineTo(X(m),ch);x.stroke()}
 for(let m=-L;m<=L+.01;m+=2.56){x.strokeStyle=m>=0?'rgba(90,160,255,.2)':'rgba(255,150,70,.2)';x.beginPath();x.moveTo(0,Y(m));x.lineTo(cw,Y(m));x.stroke()}
 x.lineCap='round';x.lineJoin='round';const glow=(col,w)=>{x.shadowColor=col;x.shadowBlur=PX*1.1;x.strokeStyle=col;x.lineWidth=PX*w};
 glow('#ffffff',.26);x.beginPath();x.moveTo(0,Y(0));x.lineTo(cw,Y(0));x.stroke();x.beginPath();x.arc(X(0),Y(0),9.15*PX,0,Math.PI*2);x.stroke();
 for(const [s,col] of [[1,'#3aa8ff'],[-1,'#ff8a2e']]){
  glow(col,.34);x.strokeRect(X(-17),Math.min(Y(s*L),Y(s*(L-13))),34*PX,13*PX);
  x.beginPath();x.arc(X(0),Y(s*(L-13)),6.5*PX,s>0?0:Math.PI,s>0?Math.PI:Math.PI*2,false);x.stroke();
  for(const sx of [-1,1]){x.beginPath();x.moveTo(X(sx*17),Y(s*(L-13)));x.lineTo(X(sx*26),Y(s*(L-13)));x.lineTo(X(sx*26),Y(s*14));x.lineTo(X(sx*9),Y(s*14));x.lineTo(X(sx*9),Y(s*3));x.stroke()}
 }
 glow('#9fd8ff',.5);const per=arenaPerimeter();x.beginPath();per.forEach((p,i)=>{const r=floorRadius(p),px=X(p.x+p.nx*r),py=Y(p.z+p.nz*r);i?x.lineTo(px,py):x.moveTo(px,py)});x.closePath();
 const edge=x.createLinearGradient(0,0,0,ch);edge.addColorStop(0,'#3aa8ff');edge.addColorStop(.47,'#c8e6ff');edge.addColorStop(.53,'#ffd9b0');edge.addColorStop(1,'#ff8a2e');x.strokeStyle=edge;x.stroke();
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;
}
// Rejilla de cuadrados iguales que sigue la superficie (usa las coordenadas de la propia arena: 1 unidad = 3 m de superficie), línea de 1 px constante y muy transparente
function gridMaterial(scale){
 return new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,
  uniforms:{scale:{value:new T.Vector2(scale[0],scale[1])}},
  vertexShader:'varying vec2 vUv;varying vec3 vW;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform vec2 scale;varying vec2 vUv;varying vec3 vW;void main(){vec2 q=vUv*scale;vec2 g=abs(fract(q-.5)-.5)/max(fwidth(q)*1.4,vec2(1e-4));float line=1.0-min(min(g.x,g.y),1.0);vec3 col=mix(vec3(1.0,.55,.2),vec3(.3,.65,1.0),smoothstep(-14.0,14.0,vW.z));float a=line*.22+.02;gl_FragColor=vec4(col*a*2.0,a);}'});
}
function buildNeon({arenaMesh}){
 const g=new T.Group(),FAR=5200;
 // cielo: degradado oscuro, sin líneas
 g.add(dome(`void main(){vec3 n=normalize(d);float h=n.y;vec3 team=mix(vec3(1.0,.45,.1),vec3(.15,.5,1.0),smoothstep(-.4,.4,n.z));
  vec3 c=mix(vec3(.004,.006,.028),vec3(.03,.012,.09),pow(1.0-clamp(h,0.0,1.0),3.0));
  c+=team*pow(clamp(1.0-abs(h),0.0,1.0),16.0)*.5+team*exp(-abs(h)*9.0)*.1;
  vec3 cell=floor(n*340.0);c+=vec3(step(.9988,hash(cell))*smoothstep(.15,.55,h)*.8);gl_FragColor=vec4(c,1.0);}`,{time:{value:0}},FAR));
 const gm=new T.Mesh(new T.PlaneGeometry(24000,24000),new T.MeshBasicMaterial({color:0x04060f,fog:true}));gm.rotation.x=-Math.PI/2;gm.position.set(0,-.62,0);g.add(gm);
 const floor=floorMesh(new T.MeshBasicMaterial({map:neonFloor(),side:T.DoubleSide,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),.013);floor.renderOrder=2;g.add(floor);

 // olas de neón y pirámides escalonadas, MUY lejos (en el horizonte)
 const verts=[],R0=2800,R1=4500;
 for(let r=R0;r<=R1;r+=45)for(let k=0;k<200;k++){const a0=k/200*6.2832,a1=(k+1)/200*6.2832;verts.push(Math.cos(a0)*r,0,Math.sin(a0)*r,Math.cos(a1)*r,0,Math.sin(a1)*r)}
 const wg=new T.BufferGeometry();wg.setAttribute('position',new T.Float32BufferAttribute(verts,3));
 const waveMat=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{time:{value:0}},
  vertexShader:'uniform float time;varying float vA;varying float vT;void main(){vec3 p=position;float r=length(p.xz),a=atan(p.z,p.x);float amp=smoothstep(2800.,4300.,r)*130.0;p.y=-.4+amp*(sin(a*6.0+time*.5+r*.0045)*.55+sin(a*11.0-time*.7+r*.008)*.35+.55);vA=1.0-smoothstep(4200.,4600.,r);vT=smoothstep(-300.,300.,p.z);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}',
  fragmentShader:'varying float vA;varying float vT;void main(){vec3 c=mix(vec3(1.0,.5,.14),vec3(.2,.6,1.0),vT);gl_FragColor=vec4(c*vA*1.4,vA*.9);}'});
 const waves=new T.LineSegments(wg,waveMat);waves.frustumCulled=false;waves.renderOrder=-50;g.add(waves);
 const pyr=new Batch(),edges=[[],[]];
 const boxEdges=(arr,cx,cy,cz,w,h,d)=>{const x0=cx-w/2,x1=cx+w/2,y0=cy-h/2,y1=cy+h/2,z0=cz-d/2,z1=cz+d/2,c=[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];for(const [a,b] of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]])arr.push(...c[a],...c[b])};
 for(let i=0;i<12;i++){const a=i/12*6.2832+rnd()*.25,r=3600+rnd()*500,px=Math.cos(a)*r,pz=Math.sin(a)*r,s=330+rnd()*170,steps=7,tgt=pz>0?0:1;
  for(let k=0;k<steps;k++){const w=s*(1-k/steps),h=s*.15,cy=-.6+k*h+h/2;pyr.add(BOX,mx(px,cy,pz,0,w,h,w),0x050a22);boxEdges(edges[tgt],px,cy,pz,w,h,w)}}
 const pm=pyr.mesh(new T.MeshBasicMaterial({vertexColors:true,fog:true}));g.add(pm);
 for(const [i,col] of [[0,0x3aa8ff],[1,0xff8a2e]]){const eg=new T.BufferGeometry();eg.setAttribute('position',new T.Float32BufferAttribute(edges[i],3));const l=new T.LineSegments(eg,new T.LineBasicMaterial({color:col,fog:true,transparent:true,opacity:.6}));l.frustumCulled=false;g.add(l)}

 // rejilla continua sobre TODA la superficie de la arena (suelo-rampa, paredes, cristal y curva superior) y sobre el techo
 if(arenaMesh){const mats=[0,1,2,3].map(()=>gridMaterial([2,2]));mats.push(new T.MeshBasicMaterial({visible:false}));const ov=new T.Mesh(arenaMesh.geometry,mats);ov.renderOrder=3;ov.frustumCulled=false;g.add(ov)}
 const ceil=floorMesh(gridMaterial([2*W/1.5,2*L/1.5]),H-.02);ceil.renderOrder=3;g.add(ceil);
 // aros de neón: base de la pared y borde del techo
 const per=arenaPerimeter(),mouth=(p,q)=>Math.abs((p.z+q.z)/2)>L-1e-5&&Math.abs((p.x+q.x)/2)<ARENA.goal+.3,segs=[],segsAll=[];
 for(let i=0;i<per.length;i++){const p=per[i],q=per[(i+1)%per.length];segsAll.push([p,q]);if(!mouth(p,q))segs.push([p,q])}
 const rings=[[.2,1.9,0,.34],[H-.05,1.7,2,.4]];
 const rm=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({toneMapped:false}),(segs.length+segsAll.length)),dm=new T.Object3D(),col=new T.Color();let n=0;
 for(const [y,k,kind,th] of rings)for(const [p,q] of (kind===2?segsAll:segs)){
  const rp=kind===0?floorRadius(p):ARENA.ramp,rq=kind===0?floorRadius(q):ARENA.ramp,ax=p.x+p.nx*rp,az=p.z+p.nz*rp,bx=q.x+q.nx*rq,bz=q.z+q.nz*rq;
  dm.position.set((ax+bx)/2,y,(az+bz)/2);dm.rotation.set(0,-Math.atan2(bz-az,bx-ax),0);dm.scale.set(Math.hypot(bx-ax,bz-az)+.06,th,th);dm.updateMatrix();rm.setMatrixAt(n,dm.matrix);col.copy(teamColor((p.z+q.z)/2)).multiplyScalar(k);rm.setColorAt(n,col);n++}
 rm.frustumCulled=false;g.add(rm);
 const beamMat=c=>new T.MeshBasicMaterial({color:c,transparent:true,opacity:.28,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}),beams=[];
 spaced(26).forEach(p=>{const b=new T.Mesh(new T.CylinderGeometry(.35,.9,90,10,1,true),beamMat(p.z>=0?BLUE:ORANGE));b.position.set(p.x-p.nx*16,42,p.z-p.nz*16);g.add(b);beams.push(b)});
 return{group:g,far:FAR+900,hideMats:[3],
  fog:{color:0x050818,near:800,far:12000},hemi:{sky:0x4558c8,ground:0x1c0e3a,i:1.45},sun:{color:0x86b0ff,i:1.0,pos:[-30,60,20]},exposure:1.15,env:.2,
  tint:{wall:0x1b2750,turf:0x101828},hideLines:true,
  quality(k){beams.forEach(b=>b.visible=k>.25);waves.visible=k>.2;pm.visible=k>.2},
  tick(dt,t){waveMat.uniforms.time.value=t;g.children[0].material.uniforms.time.value=t;for(let i=0;i<beams.length;i++)beams[i].material.opacity=.2+.1*Math.sin(t*2+i)}};
}

export function createThemes({scene,camera,renderer,hemisphere,sun,fieldObjs=[],stadiumObjs=[],turf=[]}){
 const arenaMesh=fieldObjs.find(o=>o.isMesh&&Array.isArray(o.material)),baseFar=camera?.far||400;
 const BUILD={snowday:buildSnow,heatseeker:buildNeon},built={};let current='classic',cur=null,quality=1;
 const saved=new Map(),orig=new Map();
 const mats=new Set();for(const o of fieldObjs)o.traverse(m=>{if(m.isMesh&&!m.isInstancedMesh)for(const mt of [].concat(m.material))if(mt?.color)mats.add(mt)});
 const turfSet=new Set(turf);
 function tint(on,cfg){for(const mt of mats){if(!orig.has(mt))orig.set(mt,mt.color.getHex());mt.color.setHex(orig.get(mt));if(on)mt.color.multiply(new T.Color(turfSet.has(mt)?cfg.tint.turf:cfg.tint.wall))}}
 const lines=fieldObjs.filter(o=>o.isLine);
 return{
  get name(){return current},
  set(name){
   if(name===current)return false;
   if(cur){cur.group.visible=false;for(const [o,v] of saved)o.visible=v;saved.clear();tint(false);for(const l of lines)l.visible=true;for(const i of cur.hideMats||[])if(arenaMesh)arenaMesh.material[i].visible=true;if(camera){camera.far=baseFar;camera.updateProjectionMatrix()}}
   current=name;cur=BUILD[name]?(built[name]??=(()=>{const b=BUILD[name]({arenaMesh});b.quality?.(quality);scene.add(b.group);return b})()):null;
   if(cur){cur.group.visible=true;for(const o of stadiumObjs){saved.set(o,o.visible);o.visible=false}tint(true,cur);for(const l of lines)l.visible=!cur.hideLines;for(const i of cur.hideMats||[])if(arenaMesh)arenaMesh.material[i].visible=false;if(camera&&cur.far){camera.far=cur.far;camera.updateProjectionMatrix()}}
   return true;
  },
  setQuality(k){quality=k;for(const b of Object.values(built))b.quality?.(k)},
  // se llama cada fotograma DESPUÉS de stadium.update: aquí se imponen las luces, la niebla y el estadio oculto
  update(dt,t){
   if(!cur)return;
   for(const o of stadiumObjs)o.visible=false;
   scene.fog.color.setHex(cur.fog.color);scene.fog.near=cur.fog.near;scene.fog.far=cur.fog.far;
   hemisphere.color.setHex(cur.hemi.sky);hemisphere.groundColor.setHex(cur.hemi.ground);hemisphere.intensity=cur.hemi.i;
   sun.color.setHex(cur.sun.color);sun.intensity=cur.sun.i;sun.position.set(...cur.sun.pos);
   renderer.toneMappingExposure=cur.exposure;scene.environmentIntensity=cur.env;
   cur.tick(dt,t);
  }
 };
}
