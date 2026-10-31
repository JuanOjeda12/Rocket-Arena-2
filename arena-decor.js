import * as T from './vendor/three.module.js';
import {ARENA,arenaPerimeter,floorRadius} from './arena-shape.js?v=inventory-20261028';
import {softGlow} from './boost-visual.js?v=rl-20261031';
// Decoración extra de la arena para acercarla a Rocket League: pintura del campo con zonas de
// equipo, cortinas de luz en las paredes, redes y brillo en las porterías con carteles.
// Es solo visual: no toca la física ni la geometría de colisión.
const BLUE=0x2fb4ff,ORANGE=0xff8a2e;
const {width:W,length:L,goal:G,goalHeight:GH,goalBack:B}=ARENA;

// ---------- Pintura del campo ----------
function fieldPaint(scene){
 const PX=18,cw=Math.round(W*2*PX/2)*2,ch=Math.round(L*2*PX/2)*2,canvas=document.createElement('canvas');canvas.width=cw;canvas.height=ch;const x=canvas.getContext('2d');
 const X=m=>(m+W)*PX,Y=m=>(L-m)*PX; // z=+L (azul) arriba, z=-L (naranja) abajo
 // Zonas de equipo: degradado desde cada línea de fondo.
 for(const [sign,rgb] of [[1,'47,170,255'],[-1,'255,130,40']]){
  const g=x.createLinearGradient(0,Y(sign*L),0,Y(sign*(L-34)));g.addColorStop(0,`rgba(${rgb},.34)`);g.addColorStop(.55,`rgba(${rgb},.11)`);g.addColorStop(1,`rgba(${rgb},0)`);
  x.fillStyle=g;x.fillRect(0,Math.min(Y(sign*L),Y(sign*(L-34))),cw,Math.abs(Y(sign*L)-Y(sign*(L-34))));
 }
 // Retícula hexagonal muy suave, como los paneles del césped artificial de la arena.
 x.strokeStyle='rgba(255,255,255,.05)';x.lineWidth=1.2;const hr=2.4*PX,hh=Math.sqrt(3)*hr;
 for(let col=-1;col*hr*1.5<cw+hr;col++)for(let row=-1;row*hh<ch+hh;row++){
  const cx=col*hr*1.5,cy=row*hh+((col&1)?hh/2:0);
  x.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3;k?x.lineTo(cx+Math.cos(a)*hr,cy+Math.sin(a)*hr):x.moveTo(cx+Math.cos(a)*hr,cy+Math.sin(a)*hr)}x.closePath();x.stroke();
 }
 // Emblemas grandes de cada equipo delante de las porterías y en el centro.
 const diamond=(cx,cy,r,fill,stroke,w)=>{x.beginPath();x.moveTo(cx,cy-r);x.lineTo(cx+r*.72,cy);x.lineTo(cx,cy+r);x.lineTo(cx-r*.72,cy);x.closePath();if(fill){x.fillStyle=fill;x.fill()}if(stroke){x.strokeStyle=stroke;x.lineWidth=w;x.stroke()}};
 diamond(X(0),Y(33),6.5*PX,'rgba(47,170,255,.10)','rgba(120,210,255,.65)',PX*.22);diamond(X(0),Y(33),3.2*PX,'rgba(47,170,255,.16)',null);
 diamond(X(0),Y(-33),6.5*PX,'rgba(255,130,40,.10)','rgba(255,190,120,.65)',PX*.22);diamond(X(0),Y(-33),3.2*PX,'rgba(255,130,40,.16)',null);
 diamond(X(0),Y(0),4.2*PX,'rgba(255,255,255,.05)','rgba(255,255,255,.35)',PX*.15);
 // Líneas del campo (luminosas).
 x.lineCap='round';x.shadowColor='rgba(255,255,255,.7)';x.shadowBlur=PX*.35;x.strokeStyle='rgba(255,255,255,.88)';x.lineWidth=PX*.2;
 x.beginPath();x.moveTo(0,Y(0));x.lineTo(cw,Y(0));x.stroke();
 x.beginPath();x.arc(X(0),Y(0),9.15*PX,0,Math.PI*2);x.stroke();
 x.beginPath();x.arc(X(0),Y(0),.5*PX,0,Math.PI*2);x.fillStyle='rgba(255,255,255,.9)';x.fill();
 // Áreas de portería y semicírculos, en el color del equipo.
 for(const [sign,col] of [[1,'rgba(120,210,255,.92)'],[-1,'rgba(255,185,115,.92)']]){
  x.shadowColor=col;x.strokeStyle=col;x.lineWidth=PX*.22;
  x.strokeRect(X(-17),Math.min(Y(sign*L),Y(sign*(L-13))),34*PX,13*PX);
  x.beginPath();x.arc(X(0),Y(sign*(L-13)),6.5*PX,sign>0?0:Math.PI,sign>0?Math.PI:Math.PI*2,false);x.stroke();
  // Marcas de saque de esquina en las rampas.
  for(const cxm of [-1,1]){x.beginPath();x.arc(X(cxm*(W-11.5)),Y(sign*(L-11.5)),2.2*PX,0,Math.PI*2);x.lineWidth=PX*.14;x.stroke()}
 }
 // Borde luminoso en la unión suelo-rampa.
 x.shadowBlur=PX*.5;x.lineWidth=PX*.3;
 const per=arenaPerimeter();x.beginPath();per.forEach((p,i)=>{const r=floorRadius(p),px=X(p.x+p.nx*r),py=Y(p.z+p.nz*r);i?x.lineTo(px,py):x.moveTo(px,py)});x.closePath();
 const edge=x.createLinearGradient(0,0,0,ch);edge.addColorStop(0,'rgba(80,200,255,.95)');edge.addColorStop(.46,'rgba(190,230,255,.65)');edge.addColorStop(.54,'rgba(255,215,170,.65)');edge.addColorStop(1,'rgba(255,150,70,.95)');
 x.strokeStyle=edge;x.shadowColor='rgba(255,255,255,.5)';x.stroke();
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
 // Malla del suelo: el contorno redondeado de la zona plana de la arena.
 const contour=per.map(p=>{const r=floorRadius(p);return new T.Vector2(p.x+p.nx*r,p.z+p.nz*r)}),tris=T.ShapeUtils.triangulateShape(contour,[]);
 const positions=[],uvs=[];for(const c of contour){positions.push(c.x,0,c.y);uvs.push((c.x+W)/(2*W),(c.y+L)/(2*L))}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(tris.flat());
 const material=new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,toneMapped:false,color:0xdddddd});
 const mesh=new T.Mesh(geometry,material);mesh.position.y=.012;mesh.renderOrder=1;scene.add(mesh);
 return{material};
}

// ---------- Cortinas de luz en las paredes ----------
function wallLights(scene){
 const per=arenaPerimeter(),pos=[],uv=[],col=[],idx=[],top=15;let dist=0;
 const teamAt=z=>{const t=Math.max(-1,Math.min(1,z/16)),b=new T.Color(BLUE),o=new T.Color(ORANGE),mid=new T.Color(0xcfe9ff);return t>=0?mid.clone().lerp(b,t):mid.clone().lerp(o,-t)};
 for(let i=0;i<per.length;i++){
  const p=per[i],q=per[(i+1)%per.length],len=Math.hypot(q.x-p.x,q.z-p.z);
  const mouth=Math.abs((p.z+q.z)/2)>L-1e-5&&Math.abs((p.x+q.x)/2)<G+.3;
  if(!mouth){
   const inset=.05,lo=Math.max(floorRadius(p),floorRadius(q)),base=pos.length/3,cp=teamAt(p.z),cq=teamAt(q.z);
   for(const [pt,u,c] of [[p,dist,cp],[q,dist+len,cq]])for(const [y,v] of [[lo,0],[top,1]]){pos.push(pt.x+pt.nx*inset,y,pt.z+pt.nz*inset);uv.push(u,v);col.push(c.r,c.g,c.b)}
   idx.push(base,base+1,base+2,base+1,base+3,base+2);
  }
  dist+=len;
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setAttribute('color',new T.Float32BufferAttribute(col,3));geometry.setIndex(idx);
 const uniforms={time:{value:0},night:{value:0}};
 const material=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
  vertexShader:`attribute vec3 color;varying vec2 vUv;varying vec3 vColor;void main(){vUv=uv;vColor=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`varying vec2 vUv;varying vec3 vColor;uniform float time,night;
   void main(){float fall=pow(1.0-vUv.y,2.4);float flow=.55+.45*sin(vUv.x*.42-time*1.1);float panel=abs(fract(vUv.x/3.2)*2.0-1.0);float seam=smoothstep(.93,1.0,panel);
    float rows=smoothstep(.9,1.0,abs(fract(vUv.y*3.0)*2.0-1.0))*.5;
    float a=fall*(.2+.2*flow+seam*.5+rows*.25)*(.7+.9*night);gl_FragColor=vec4(vColor*1.25,a);}`});
 const mesh=new T.Mesh(geometry,material);mesh.renderOrder=4;scene.add(mesh);
 return{update(time,night){uniforms.time.value=time;uniforms.night.value=night}};
}

// ---------- Porterías: red, brillo interior y cartel ----------
function netTexture(){
 const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.strokeStyle='rgba(255,255,255,.95)';x.lineWidth=2.4;
 x.beginPath();x.moveTo(0,0);x.lineTo(64,64);x.moveTo(64,0);x.lineTo(0,64);x.moveTo(-32,32);x.lineTo(32,96);x.moveTo(32,-32);x.lineTo(96,32);x.moveTo(32,96);x.lineTo(96,32);x.moveTo(-32,32);x.lineTo(32,-32);x.stroke();
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;
}
function goals(scene){
 const net=netTexture(),items=[];
 for(const s of [-1,1]){
  const hex=s>0?BLUE:ORANGE,tint=new T.Color(hex).lerp(new T.Color(0xffffff),.55),rgb=s>0?'47,170,255':'255,130,40';
  const depth=B-L,mid=(L+B)/2;
  const plane=(w,h,x,y,z,ry,rx,rep)=>{const tex=net.clone();tex.needsUpdate=true;tex.repeat.set(w/rep,h/rep);const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,color:tint,transparent:true,opacity:.5,side:T.DoubleSide,depthWrite:false,toneMapped:false}));m.position.set(x,y,z);m.rotation.set(rx,ry,0);m.renderOrder=3;scene.add(m);return m};
  plane(G*2,GH,0,GH/2,s*(B-.03),0,0,.5);
  plane(depth,GH,-G+.03,GH/2,s*mid,Math.PI/2,0,.5);plane(depth,GH,G-.03,GH/2,s*mid,Math.PI/2,0,.5);
  plane(G*2,depth,0,GH-.03,s*mid,0,Math.PI/2,.5);
  // Resplandor interior: pared del fondo y suelo de la portería.
  const glowMat=()=>new T.MeshBasicMaterial({map:softGlow(),color:hex,transparent:true,opacity:.6,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false,side:T.DoubleSide});
  const back=new T.Mesh(new T.PlaneGeometry(G*2.1,GH*1.6),glowMat());back.position.set(0,GH*.42,s*(B-.06));back.renderOrder=4;scene.add(back);
  const floor=new T.Mesh(new T.PlaneGeometry(G*2,depth),glowMat());floor.rotation.x=-Math.PI/2;floor.position.set(0,.035,s*mid);floor.material.opacity=.45;floor.renderOrder=4;scene.add(floor);
  // Halo a lo largo de los postes y el larguero.
  for(const px of [-G,G]){const halo=new T.Sprite(new T.SpriteMaterial({map:softGlow(),color:hex,transparent:true,opacity:.55,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));halo.scale.set(1.8,GH*1.5,1);halo.position.set(px,GH/2,s*L);scene.add(halo);items.push(halo)}
  const bar=new T.Sprite(new T.SpriteMaterial({map:softGlow(),color:hex,transparent:true,opacity:.5,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));bar.scale.set(G*2.6,1.7,1);bar.position.set(0,GH,s*L);scene.add(bar);items.push(bar);
 }
 return items;
}

export function createArenaDecor(scene){
 const paint=fieldPaint(scene),walls=wallLights(scene),halos=goals(scene);
 return{update(time=0,state={}){
  const night=state.night??0;walls.update(time,night);paint.material.color.setScalar(.82+.18*night);
  const pulse=.9+.1*Math.sin(time*2.2);for(const h of halos)h.material.opacity=(.4+.3*night)*pulse;
 }};
}
