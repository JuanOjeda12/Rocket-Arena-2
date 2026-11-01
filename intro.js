import * as T from './vendor/three.module.js';
import {createFans} from './fans.js?v=rl-20261031';
import {softGlow} from './boost-visual.js?v=rl-20261031';
import {logoSVG} from './logo.js?v=rl-20261031';
// Introducción cinematográfica nocturna: los reflectores se encienden, los LED recorren la cancha,
// los aficionados (en 3D, solo aquí) celebran y un Octane salta sobre la cámara hasta que aparece el logo.
const STYLE=`
#intro{position:fixed;inset:0;z-index:60;pointer-events:none;overflow:hidden;font-family:Barlow,Arial,sans-serif}
#intro[hidden]{display:none}
#intro .bar{position:absolute;left:0;right:0;height:11vh;background:#000;transition:transform 1.2s cubic-bezier(.2,.7,.2,1)}
#intro .bar.top{top:0;transform:translateY(-100%)}#intro .bar.bottom{bottom:0;transform:translateY(100%)}
#intro.on .bar{transform:none}
#intro .fade{position:absolute;inset:0;background:#000;opacity:1}
#intro .flash{position:absolute;inset:0;background:radial-gradient(circle,#fff 0,#bfe6ff 35%,#2a7bff00 75%);opacity:0}
#intro .vignette{position:absolute;inset:0;background:radial-gradient(ellipse at center,#0000 55%,#000b 100%);transition:background 1s}
#intro .caption{position:absolute;left:50%;bottom:15vh;transform:translateX(-50%);font-size:clamp(14px,1.7vw,24px);letter-spacing:.6em;font-weight:700;color:#cfe6fa;text-shadow:0 0 18px #2a7bff;opacity:0;transition:opacity .8s}
#intro .skip{pointer-events:none;position:absolute;right:2.2vw;bottom:calc(11vh + 14px);font-size:11px;letter-spacing:.14em;color:#9fb8cf;opacity:.0;transition:opacity .8s;text-transform:uppercase}
#intro .skip kbd{border:1px solid #9fb8cf88;padding:2px 7px;border-radius:4px;margin-right:6px}
#intro.on .skip{opacity:.8}

#intro .dim{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 60%,#00060c22 10%,#00060c88 100%);opacity:0;transition:opacity .45s}
#intro .dim.on{opacity:1}
#intro .prompt{position:absolute;left:50%;top:49%;transform:translate(-50%,-50%) skewX(-12deg);min-width:min(340px,70vw);text-align:center;padding:.5vw 2.4vw;background:linear-gradient(90deg,#0a6a74cc,#14a9b5d9 50%,#0a6a74cc);color:#f1feff;font:700 clamp(12px,1.25vw,20px) Barlow,Arial,sans-serif;letter-spacing:.03em;opacity:0;transition:opacity .35s;box-shadow:0 0 18px #19c5d455}
#intro .prompt.on{opacity:1}
#intro .prompt kbd{display:inline-block;min-width:1.5em;padding:0 .45em;margin:0 .15em;border-radius:3px;background:#e9fbff;color:#06222c;font-weight:800;box-shadow:0 2px 0 #66aabd}
#intro .ready{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:800 clamp(16px,2.5vw,40px) Barlow,Arial,sans-serif;letter-spacing:.06em;color:#3fe6d6;text-shadow:0 0 10px #12b5a899,0 2px 4px #000;opacity:0;transition:opacity .45s;white-space:nowrap}
#intro .ready.on{opacity:1}
#intro .goalword{position:absolute;left:4%;top:25%;font:italic 900 clamp(34px,7.6vw,120px) 'Barlow Condensed',Arial Black,sans-serif;letter-spacing:.04em;color:#2d8cff;text-shadow:0 0 22px #1d6fffcc,0 0 60px #1d6fff88;transform:skewX(-8deg);opacity:0;transition:opacity .2s}
#intro .goalword.on{opacity:1}
#intro .goalword.r{left:auto;right:8%;top:20%;font-size:clamp(20px,4.4vw,70px);filter:blur(.4px)}
#intro .black{position:absolute;inset:0;background:#000;opacity:0}
#intro .logo{position:absolute;left:50%;top:50%;width:min(66vw,900px);transform:translate(-50%,-50%);opacity:0}
#intro .logo svg{display:block;width:100%;height:auto}
#intro .logo.show{animation:introLogo .4s ease-out forwards}
@keyframes introLogo{0%{opacity:0}100%{opacity:1}}
#intro .count{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);font:300 clamp(22px,4.4vh,48px) 'Barlow Condensed',Arial,sans-serif;letter-spacing:.1em;color:#ffe9a8;text-shadow:0 0 10px #ffb02e,0 1px 3px #000;opacity:0}
#intro .count.pop{animation:cnt .9s ease-out forwards}
@keyframes cnt{0%{opacity:0}12%{opacity:1}80%{opacity:1}100%{opacity:0}}
#intro .title{position:absolute;left:50%;bottom:19vh;transform:translateX(-50%);font:700 clamp(15px,2vw,26px) Barlow,Arial,sans-serif;letter-spacing:.5em;color:#cfe9ff;text-shadow:0 0 18px #2a7bff;opacity:0;transition:opacity .7s}
#intro .title.on{opacity:1}
#intro .bar{display:none}
#intro .skip{bottom:14px}
#intro .card{position:absolute;left:50%;transform:translate(-50%,-50%);opacity:0;text-align:center}
#intro .card svg{display:block;width:100%;height:auto}
#intro .studio{top:50%;width:min(36vw,460px)}
#intro .titlecard{top:34%;width:min(54vw,740px)}
#intro .press{margin-top:2.4vh;font:600 clamp(11px,1.2vw,18px) Barlow,Arial,sans-serif;letter-spacing:.2em;color:#6fd7f2;text-shadow:0 0 10px #1a8fb0;opacity:0}
`;
const smooth=x=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x)};
const ramp=(t,a,b)=>smooth((t-a)/(b-a));
const lerp=(a,b,k)=>a+(b-a)*k;
const V=(a)=>new T.Vector3(...a);
// Spline Catmull-Rom sobre fotogramas clave {t,p,l,f}.
function track(keys,t){
 let i=0;while(i<keys.length-2&&t>keys[i+1].t)i++;
 const a=keys[Math.max(0,i-1)],b=keys[i],c=keys[i+1],d=keys[Math.min(keys.length-1,i+2)],u=Math.min(1,Math.max(0,(t-b.t)/(c.t-b.t)));
 const cr=(k)=>{const p0=a[k],p1=b[k],p2=c[k],p3=d[k];return p1.map((_,j)=>.5*((2*p1[j])+(-p0[j]+p2[j])*u+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*u*u+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*u*u*u))};
 return{p:cr('p'),l:cr('l'),f:lerp(b.f,c.f,smooth(u))};
}
const TIMELINE={ignite:.2,towers:.1,city:.4,neon:.5,walls:.5,paint:.7,goals:.7,pads:.7,logoOut:1.95,title:2.0,black:4.4,aerial:9.5,sign:10.8,octane:12.9,count:17.0,kick:19.6,end:0};
const SIGN={x:0,y:17,z:-61};
function makeSign(scene){
 const c=document.createElement('canvas');c.width=1024;c.height=300;const x=c.getContext('2d');
 x.fillStyle='#040a16';x.fillRect(0,0,1024,300);
 const g=x.createLinearGradient(0,0,0,300);g.addColorStop(0,'#0a2a5a');g.addColorStop(1,'#040a16');x.fillStyle=g;x.fillRect(0,0,1024,300);
 x.strokeStyle='#38b6ff';x.lineWidth=8;x.shadowColor='#2fa8ff';x.shadowBlur=26;x.strokeRect(16,16,992,268);
 x.textAlign='center';x.textBaseline='middle';x.font="italic 900 138px 'Barlow Condensed','Arial Black',Impact,sans-serif";
 x.shadowBlur=36;x.fillStyle='#d6f2ff';x.fillText('OVERTIME',512,150,900);x.shadowBlur=14;x.fillText('OVERTIME',512,150,900);
 x.font="700 40px Barlow,Arial,sans-serif";x.shadowColor='#ff9a2e';x.shadowBlur=18;x.fillStyle='#ffc070';
 
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
 const group=new T.Group();
 const board=new T.Mesh(new T.PlaneGeometry(30,8.8),new T.MeshBasicMaterial({map:tex,toneMapped:false}));group.add(board);
 const back=new T.Mesh(new T.BoxGeometry(31,9.8,.8),new T.MeshStandardMaterial({color:0x0a121e,roughness:.6,metalness:.4}));back.position.z=-.5;group.add(back);
 for(const sx of [-1,1]){const col=new T.Mesh(new T.BoxGeometry(1.3,15,1.3),new T.MeshBasicMaterial({color:0x2a7bff,toneMapped:false}));col.position.set(sx*17.4,-2.5,-.4);group.add(col);
  const cap=new T.Sprite(new T.SpriteMaterial({map:softGlow(),color:0x2a9bff,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));cap.scale.set(12,16,1);cap.position.set(sx*17.4,-2.5,.4);group.add(cap)}
 const halo=new T.Sprite(new T.SpriteMaterial({map:softGlow(),color:0x2a7bff,transparent:true,opacity:.55,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));halo.scale.set(52,22,1);halo.position.z=.6;group.add(halo);
 group.position.set(SIGN.x,SIGN.y,SIGN.z);scene.add(group);group.visible=false;return group;
}
// Partículas aditivas para fuegos artificiales y explosiones.
function makeBursts(scene){
 const N=1400,pos=new Float32Array(N*3),col=new Float32Array(N*3),vel=new Float32Array(N*3),life=new Float32Array(N),max=new Float32Array(N);let head=0;
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('color',new T.BufferAttribute(col,3));
 const pts=new T.Points(g,new T.PointsMaterial({map:softGlow(),size:.9,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,sizeAttenuation:true}));pts.frustumCulled=false;scene.add(pts);
 for(let i=0;i<N;i++)pos[i*3+1]=-999;
 return{pts,add(c,rgb,n,speed,ttl=1.6,spread=1){for(let k=0;k<n;k++){const i=head++%N,a=Math.random()*6.283,b=Math.acos(2*Math.random()-1),sp=speed*(.35+Math.random()*.65);pos.set(c,i*3);vel[i*3]=Math.sin(b)*Math.cos(a)*sp*spread;vel[i*3+1]=Math.cos(b)*sp;vel[i*3+2]=Math.sin(b)*Math.sin(a)*sp*spread;col.set(rgb,i*3);life[i]=max[i]=ttl*(.6+Math.random()*.6)}},
  update(dt){for(let i=0;i<N;i++){if(life[i]<=0){pos[i*3+1]=-999;continue}life[i]-=dt;vel[i*3+1]-=7*dt;for(let j=0;j<3;j++)pos[i*3+j]+=vel[i*3+j]*dt;const f=Math.max(0,life[i]/max[i]);col[i*3]*=1-dt*.4;col[i*3+1]*=1-dt*.6;col[i*3+2]*=1-dt*.8;if(f<.25){col[i*3]*=f*4;col[i*3+1]*=f*4;col[i*3+2]*=f*4}}g.attributes.position.needsUpdate=true;g.attributes.color.needsUpdate=true},
  hide(){life.fill(0);for(let i=0;i<N;i++)pos[i*3+1]=-999;g.attributes.position.needsUpdate=true}};
}
export function createIntro({scene,camera,renderer,stadium,vfx,createVehicle,audio,ball,ballShadow,getProfile,rig,onSkip=()=>{},matches=()=>false,keyLabel=a=>a}){
 const labelOf=keyLabel;
 if(!document.getElementById('intro-style')){const s=document.createElement('style');s.id='intro-style';s.textContent=STYLE;document.head.append(s)}
 const root=document.createElement('div');root.id='intro';root.hidden=true;
 root.innerHTML=`<div class="fade"></div><div class="card studio">${logoSVG({id:'introS',tagline:true})}</div><div class="card titlecard">${logoSVG({id:'introT',tagline:false})}<div class="press">PRESIONA CUALQUIER BOTÓN PARA INICIAR</div></div><div class="vignette"></div><div class="flash"></div><div class="dim"></div><div class="prompt"></div><div class="ready">PREPÁRATE PARA DEFENDER</div><div class="goalword">GOAL!</div><div class="count"></div><div class="black"></div><div class="logo">${logoSVG({id:'intro',tagline:true})}</div><div class="bar top"></div><div class="bar bottom"></div><div class="skip"><kbd>ENTER</kbd> Saltar introducción</div>`;
 document.body.append(root);
 const fade=root.querySelector('.fade'),flash=root.querySelector('.flash'),count=root.querySelector('.count'),dim=root.querySelector('.dim'),promptEl=root.querySelector('.prompt'),black=root.querySelector('.black'),logo=root.querySelector('.logo'),studio=root.querySelector('.studio'),titlecard=root.querySelector('.titlecard'),press=root.querySelector('.press');
 let hold=false,fans=null,vehicle=null,orange=null,sign=null,bursts=null,padStates=null,pads=null,t=0,active=false,resolve=null,sounds=new Set(),savedFov=65,fired=new Set(),lastCount=0;
 const power=()=>stadium.power,decor=()=>stadium.decorPower;
 const night=()=>{stadium.update(0,false,true,t);const k=.1+.9*Math.min(1,power().flood*1.15);if(rig){rig.hemisphere.intensity*=k;rig.sun.intensity*=k}scene.environmentIntensity*=k};
 function sound(key,fn){if(sounds.has(key))return;sounds.add(key);try{fn()}catch{}}
 function once(key,fn){if(fired.has(key))return;fired.add(key);fn()}
 function soft(key,fn){if(t<TIMELINE.aerial){sounds.add(key);return}sound(key,fn)}
 function lights(){
  const P=power(),D=decor(),T0=TIMELINE;let sum=0;
  P.towers.forEach((_,i)=>{const s=T0.ignite+i*T0.towers,k=Math.min(1,Math.max(0,(t-s)/.9));let v=smooth(k);if(k>0&&k<1)v*=Math.sin(t*95+i*7)>-.15?1:.25;P.towers[i]=t<s?0:v;sum+=P.towers[i];if(t>=s)soft('tw'+i,()=>{audio.tone(70+i*9,.5,.34,'square',38);audio.noise(.35,.28,3200)})});
  P.flood=Math.max(.04,sum/P.towers.length);P.city=ramp(t,T0.city,T0.city+2.2);P.neon=ramp(t,T0.neon,T0.neon+1.8);
  D.wall=ramp(t,T0.walls,T0.walls+3.2);D.paint=ramp(t,T0.paint,T0.paint+1.8);D.goal=ramp(t,T0.goals,T0.goals+1.4);
  if(t>=T0.neon)soft('sweep',()=>audio.tone(180,3.4,.09,'sawtooth',1700));
  padStates?.forEach((s,i)=>{s.active=t>T0.pads+(i%7)*.13+Math.floor(i/7)*.09&&!(t>=T0.octane&&t<T0.count)});
  pads?.update(padStates,t);
 }
 const WIDE=[
  {t:9.4,p:[-46,17,46],l:[-4,5,6],f:62},{t:9.8,p:[-40,16,38],l:[0,5,0],f:62},{t:10.4,p:[-30,15,28],l:[8,4,-10],f:60},{t:10.9,p:[-22,14,18],l:[12,4,-20],f:60}
 ];
 function aerial(){const k=track(WIDE,t);camera.position.set(...k.p);camera.up.set(0,1,0);camera.lookAt(...k.l);camera.fov=k.f}
 // Cartel de neón con fuegos artificiales (como el cartel OVERTIME del vídeo).
 function signShot(){
  const T0=TIMELINE,k=(t-T0.sign)/(T0.octane-T0.sign);
  camera.position.set(lerp(-6,3,smooth(k)),lerp(8,13,smooth(k)),lerp(-4,-12,smooth(k)));camera.up.set(0,1,0);camera.lookAt(SIGN.x,SIGN.y-1,SIGN.z);camera.fov=lerp(62,54,smooth(k));
  const times=[0,.3,.65,1,1.35,1.7,1.95],cols=[[.4,.8,1],[1,.6,.2],[1,1,1],[.5,.9,1],[1,.5,.15],[.7,.8,1],[1,.8,.4]];
  times.forEach((tm,i)=>{if(t-T0.sign>=tm)once('fw'+i,()=>{const sx=(i%2?1:-1)*(10+i*2),c=[SIGN.x+sx,SIGN.y+9+(i%3)*3,SIGN.z+4];bursts.add(c,cols[i],150,13,2.2);audio.noise(.5,.3,2200);audio.tone(120,.4,.15,'sawtooth',40)})});
 }
 function fanShot(section,start,len){
  const k=(t-start)/len,tn=section.tangent,n=section.normal,c=section.focus;
  const along=lerp(-6,6,smooth(k)),dist=lerp(6.4,5,smooth(k));
  camera.position.copy(c).addScaledVector(tn,along).addScaledVector(n,dist);camera.position.y=c.y+.75+Math.sin(k*3)*.12;
  const look=c.clone().addScaledVector(tn,along*.5+1.2);look.y=c.y+1.9;camera.up.set(0,1,0);camera.lookAt(look);camera.fov=lerp(42,32,smooth(k));
 }
 const place=(v,x,y,z,ry)=>{v.root.position.set(x,y,z);v.root.rotation.set(0,ry,0);v.setVisible(true,false)};
 // Primer plano de los dos Octane (azul y naranja) a ras de césped.
 function octaneShot(){
  const T0=TIMELINE,s=t-T0.octane,half=2.2;
  ball.visible=false;ballShadow.visible=false;
  if(s<half){
   const k=s/half;place(vehicle,3,.17+Math.sin(t*2.2)*.01,24,Math.PI+.5);orange.setVisible(false,false);
   camera.position.set(lerp(1.6,3.2,k),.5,28.6);camera.up.set(0,1,0);camera.lookAt(3,.65,24);camera.fov=lerp(52,46,k);
  }else{
   const k=(s-half)/(T0.count-T0.octane-half);place(orange,-3,.17+Math.sin(t*2.4)*.01,-22,0);vehicle.setVisible(false,false);
   camera.position.set(lerp(-.2,1.2,k),.8,lerp(-16.4,-17.4,k));camera.up.set(0,1,0);camera.lookAt(-3,.9,-22);camera.fov=lerp(56,50,k);
  }
 }
 // Cuenta atrás 3-2-1 con el balón en el centro y los dos coches esperando.
 function countShot(){
  const T0=TIMELINE,s=t-T0.count,k=s/(T0.kick-T0.count);
  ball.visible=true;ballShadow.visible=true;ball.position.set(0,.9125,0);ballShadow.position.set(0,.015,0);
  vehicle.setVisible(false,false);orange.setVisible(false,false);
  camera.position.set(lerp(-6,6,smooth(k)),lerp(.7,.9,k),lerp(7.5,6.5,k));camera.up.set(0,1,0);camera.lookAt(0,1.2,0);camera.fov=lerp(46,40,k);
 }
 // Saque: los dos coches con turbo contra el balón y explosión.
 // Cuenta atrás 3-2-1 (16.9 / 17.9 / 18.9 s del vídeo); el 3 ya aparece sobre el último plano del coche naranja.
 function digit(){const n=t<16.9||t>=TIMELINE.kick?0:t<17.9?3:t<18.9?2:1;if(n&&n!==lastCount){lastCount=n;count.textContent=n;count.classList.remove('pop');void count.offsetWidth;count.classList.add('pop');audio.tone(n===1?880:660,.35,.28,'sine')}}
 // Pantalla de título (2.4–4.4 s del vídeo): cámara baja ante la pared de marcador y el balón en primer plano.
 function titleShot(){const k=Math.min(1,Math.max(0,(t-2.0)/2.4));ball.visible=true;ballShadow.visible=true;ball.position.set(5.5,.9125,10);ballShadow.position.set(5.5,.015,10);ballShadow.material.opacity=.22;ALL().forEach(a=>a?.setVisible(false,false));camera.position.set(lerp(-5,-3,k),lerp(1.3,1.6,k),lerp(20,17,k));camera.up.set(0,1,0);camera.lookAt(1,lerp(7,6.5,k),-34);camera.fov=58}
 // Tarjeta de estudio (0–1.9 s), título (2.0–4.4 s) y negro (4.4–9.4 s).
 function stage(){
  const T0=TIMELINE,op=(el,v)=>{el.style.opacity=v.toFixed(3)};
  op(studio,t<T0.title?ramp(t,0,.2)*(1-ramp(t,1.6,T0.logoOut)):0);
  op(titlecard,ramp(t,T0.title+.05,T0.title+.4)*(1-ramp(t,3.7,4.3)));op(press,ramp(t,2.2,2.5));
  fade.style.opacity=t<2.4?'1':t<3.7?String(1-ramp(t,2.4,2.6)):t<T0.aerial?String(ramp(t,3.7,4.4)):'0';
 }
 // ───────── Partida real 2v2 (simulada con el motor del juego y grabada) ─────────
 // intro-track.json guarda UNA partida continua de 4 coches. Aquí solo se reproduce: los coches y el balón se mueven por la física grabada.
 // Los avisos congelan la partida hasta que el jugador pulsa la tecla. Cámara provisional (se afinará después).
 const L=(a,b,k)=>a+(b-a)*k,E=smooth,clamp01=k=>Math.min(1,Math.max(0,k));
 const frameCars=[];
 const V3=T.Vector3,Q4=T.Quaternion;
 const carS=Array.from({length:4},()=>({p:new V3(),q:new Q4(),v:new V3(),f:new V3(),fl:0,boost:0}));
 const ballS={p:new V3(),q:new Q4(),v:new V3()};
 const qa=new Q4(),qb=new Q4(),tA=new V3(),tB=new V3();
 function sample(sc,time){
  const n=sc.n,hz=sc.hz,x=Math.max(0,Math.min(n-1.0001,time*hz)),i=x|0,k=x-i,A=sc.frames[i],Bf=sc.frames[i+1],ns=sc.slots.length;
  for(let c=0;c<ns;c++){const o=c*9,s=carS[sc.slots[c]];
   s.p.set(L(A[o],Bf[o],k),L(A[o+1],Bf[o+1],k),L(A[o+2],Bf[o+2],k));
   s.v.set((Bf[o]-A[o])*hz,(Bf[o+1]-A[o+1])*hz,(Bf[o+2]-A[o+2])*hz);
   qa.set(A[o+3],A[o+4],A[o+5],A[o+6]);qb.set(Bf[o+3],Bf[o+4],Bf[o+5],Bf[o+6]);s.q.copy(qa).slerp(qb,k);
   s.fl=(k<.5?A:Bf)[o+7];s.boost=A[o+8];s.f.set(0,0,-1).applyQuaternion(s.q);
  }
  const o=ns*9;
  ballS.p.set(L(A[o],Bf[o],k),L(A[o+1],Bf[o+1],k),L(A[o+2],Bf[o+2],k));
  ballS.v.set((Bf[o]-A[o])*hz,(Bf[o+1]-A[o+1])*hz,(Bf[o+2]-A[o+2])*hz);
  qa.set(A[o+3],A[o+4],A[o+5],A[o+6]);qb.set(Bf[o+3],Bf[o+4],Bf[o+5],Bf[o+6]);ballS.q.copy(qa).slerp(qb,k);
 }
 const bigFlame=new Set();let goalAt=0;
 const VEH=()=>[B,R,O,W];
 // Muestra la partida en el instante `time` (segundos de juego). Siempre se ven los 4 coches.
 function show(time){
  const sc=TRK.G;sample(sc,time);const veh=VEH();
  for(const k of sc.slots){const v=veh[k],s=carS[k];if(!v)continue;
   const dem=!!(s.fl&8),boost=!!(s.fl&2)&&!dem;
   v.root.position.copy(s.p);v.root.quaternion.copy(s.q);v.setVisible(!dem,false);
   v.flame.visible=boost;v.flame.scale.setScalar(bigFlame.has(v)?3.4:1);v.update(time);
   if(boost)frameCars.push({a:v,state:{slot:k,team:k<2?0:1,onGround:!!(s.fl&1),isBoosting:true,isFlipping:!!(s.fl&4),isDemoed:false,boost:s.boost,position:s.p.toArray(),velocity:s.v.toArray(),forward:{x:s.f.x,y:s.f.y,z:s.f.z}}});
  }
  ball.visible=true;ballShadow.visible=true;ball.position.copy(ballS.p);ball.quaternion.copy(ballS.q);ballShadow.position.set(ballS.p.x,.015,ballS.p.z);ballShadow.material.opacity=Math.max(.04,.22-ballS.p.y*.008);
  // Eventos reales de la simulación: demolición y gol.
  for(const e of sc.events){if(e.t>(sc.last??-1)&&e.t<=time){
   if(e.type==='demo'){boom('dm'+e.t+e.slot,e.p,1.5);burst('dms'+e.t+e.slot,e.p,[.45,.42,.4],140,6,1.4)}
   if(e.type==='goal'){goalAt=e.t;boom('goal',[ballS.p.x,Math.max(1.4,ballS.p.y),Math.min(ballS.p.z,-51.5)],2.1);burst('g2',[ballS.p.x,2,-52],[1,.55,.1],300,18,1.3);burst('g3',[ballS.p.x,2,-51.5],[.55,.38,.2],220,7,2.2)}
  }}
  sc.last=time;
 }
 const burst=(key,c,rgb,n,sp,ttl)=>once(key,()=>bursts.add(c,rgb,n,sp,ttl));
 const boom=(key,c,big=1)=>once(key,()=>{bursts.add(c,[1,.72,.28],Math.round(420*big),16*big,1.6);bursts.add(c,[1,1,.9],Math.round(160*big),26*big,.8);audio.noise(1.6,.9,900);audio.tone(55,1,.7,'sine',22);flash.style.transition='none';flash.style.opacity=.85;requestAnimationFrame(()=>{flash.style.transition='opacity .6s';flash.style.opacity=0})});
 const goTxt=()=>once('go',()=>{count.textContent='GO!';count.classList.remove('pop');void count.offsetWidth;count.classList.add('pop');audio.tone(990,.4,.25,'sine')});
 // Cámara provisional: nunca sale del estadio (elipse de 40 x 50 m).
 const cam=(px,py,pz,lx,ly,lz,fov=50)=>{const q=(px/40)*(px/40)+(pz/50)*(pz/50);if(q>.88){const k=Math.sqrt(.88/q);px*=k;pz*=k}camera.position.set(px,Math.max(.6,py),pz);camera.up.set(0,1,0);camera.lookAt(lx,ly,lz);camera.fov=fov};
 let curShot='';const SM={p:new V3(),l:new V3(),id:''};
 const follow=(pos,look,fov,sm)=>{if(SM.id!==curShot){SM.p.copy(pos);SM.l.copy(look);SM.id=curShot}else{SM.p.lerp(pos,sm);SM.l.lerp(look,sm)}cam(SM.p.x,SM.p.y,SM.p.z,SM.l.x,SM.l.y,SM.l.z,fov)};
 // Plano general que sigue la acción: entre el balón y el centro del campo, a media altura.
 const wide=()=>{tA.copy(ballS.p);tB.set(-tA.x*.3,0,-tA.z*.3);const dx=tB.x,dz=tB.z;let l=Math.hypot(dx,dz);const ux=l>1?dx/l:0,uz=l>1?dz/l:1;
  tB.set(tA.x+ux*24,12+Math.min(8,tA.y*.4),tA.z+uz*24);tA.set(ballS.p.x,Math.max(1,ballS.p.y*.7),ballS.p.z);follow(tB,tA,58,.07)};
 // Persecución detrás del coche del jugador.
 const chase=(c,back,up,ahead,fov)=>{tA.copy(c.f).setY(0).normalize();tB.set(c.p.x-tA.x*back,c.p.y+up,c.p.z-tA.z*back);const lk=new V3(c.p.x+tA.x*ahead,c.p.y+.8,c.p.z+tA.z*ahead);follow(tB,lk,fov,.2)};
 const S=[];let vAcc=0;
 const sh=(id,dur,cm,o={})=>{const v0=vAcc,run=(k,st,v)=>{show(v);if(o.go&&v>.3)goTxt();cm(k,st,v)};const {go,...rest}=o;S.push({id,dur,run,v0,...rest});vAcc+=dur};
 const G0=11;
 const P=()=>carS[0];
 // Montaje del saque: la partida real desde el pitido inicial.
 sh('play',G0,(k,s,v)=>{wide()},{go:true});
 // Tutorial dentro de la misma partida.
 sh('ready',2.8,(k,s,v)=>{wide();ready.classList.toggle('on',k>.04&&k<.97)});
 sh('arrive',.9,(k,s,v)=>{ready.classList.remove('on');chase(P(),6,2.4,12,60)});
 sh('p1',.8,(k,s,v)=>{chase(P(),6,2.4,12,60)},{prompt:{action:'forward',mode:'hold',text:a=>`Mantén ${a('forward')} para conducir.`}});
 sh('d1',3.6,(k,s,v)=>{chase(P(),6,2.4,12,60)});
 sh('p2',.8,(k,s,v)=>{chase(P(),6,2.4,12,60)},{prompt:{action:'jump',mode:'press',text:a=>`Pulsa ${a('jump')} para saltar.`}});
 sh('d2',5.1,(k,s,v)=>{chase(P(),6,2.4,12,60)});
 sh('p3',.7,(k,s,v)=>{chase(P(),6,2.4,12,60)},{prompt:{action:'boost',mode:'hold',text:a=>`Mantén ${a('boost')} para usar el turbo.`}});
 sh('d3',9.2,(k,s,v)=>{chase(P(),6,2.4,12,60)});
 sh('p4',.7,(k,s,v)=>{chase(P(),6,2.4,12,60)},{prompt:{action:'jump',mode:'press',text:a=>`Pulsa ${a('jump')} para saltar.`}});
 sh('d4',1.5,(k,s,v)=>{chase(P(),6,2.4,12,60)});
 sh('p5',.9,(k,s,v)=>{chase(P(),6,2.4,12,60)},{prompt:{action:'forward',mode:'dodge',text:a=>`Pulsa ${a('forward')} + ${a('jump')} para hacer la voltereta hacia delante.`}});
 sh('d5',2.05,(k,s,v)=>{chase(P(),6,2.4,12,60)});
 sh('goal',1.6,(k,s,v)=>{goalword.classList.add('on');wide()});
 sh('end',.55,(k,s,v)=>{goalword.classList.add('on');wide()});
 const TOTAL_REL=()=>S.reduce((a,b)=>a+b.dur,0);
 let B=null,R=null,O=null,W=null,ready=null,goalword=null,TRK=null;
 const ALL=()=>[B,R,O,W].filter(Boolean);
 const TRACK_URL=new URL('./intro-track.json?v=rl-20261101',import.meta.url);
 let st=0,idx=0,shotT=0,waiting=false,held=0,prevDown={},endPhase=0,endT=0;
 const downKeys=new Set();
 const isDown=(a)=>{for(const c of downKeys)if(matches(a,c))return true;return false};
 const label=a=>{try{return labelOf(a)}catch{return a}};
 function nextShot(){
  idx++;shotT=0;held=0;waiting=false;const s=S[idx];
  promptEl.classList.remove('on');dim.classList.remove('on');
  if(s?.prompt){waiting=true;dim.classList.add('on');promptEl.innerHTML=s.prompt.text(a=>`<kbd>${label(a)}</kbd>`);promptEl.classList.add('on');sound('p'+idx,()=>audio.tone(660,.25,.18,'sine'))}
 }
 function script(dt){
  if(idx<0){idx=0;shotT=0;const s0=S[0];if(s0?.prompt){}}
  const s=S[idx];if(!s){return endSeq(dt)}
  const p=s.prompt;let rate=1;
  if(waiting&&p){
   rate=0;const d=isDown(p.action),j=isDown('jump');
   if(p.mode==='hold'){held=d?held+dt:0;if(held>.55)release()}
   else if(p.mode==='press'){if(d&&!prevDown[p.action])release()}
   else if(p.mode==='dodge'){if(j&&!prevDown.jump&&isDown('forward'))release()}
   prevDown={[p.action]:d,jump:j,forward:isDown('forward')};
   if(pressedPointer){pressedPointer=false;release()}
  }
  shotT+=dt*rate;const k=clamp01(shotT/s.dur);
  frameCars.length=0;
  ALL().forEach(a=>a.setVisible(false,false));ball.visible=true;
  ready.classList.remove('on');goalword.classList.remove('on');
  curShot=s.id;s.run(k,shotT,s.v0+shotT);camera.updateProjectionMatrix();
  if(shotT>=s.dur&&!waiting)nextShot();
 }
 let pressedPointer=false;
 function release(){waiting=false;promptEl.classList.remove('on');dim.classList.remove('on');sound('ok'+idx,()=>audio.tone(990,.2,.14,'sine'))}
 function endSeq(dt){
  // El coche pasa sobre la cámara → corte a negro → logo.
  endT+=dt;ALL().forEach(a=>a.setVisible(false,false));frameCars.length=0;
  black.style.opacity=1;if(endT>.25&&!logo.classList.contains('show')){logo.classList.add('show');sound('logo',()=>{audio.tone(60,1.6,.9,'sine',26);audio.noise(1.3,.5,2600);for(const f of [261.6,392,523.2,784])audio.tone(f,1.8,.09)})}
  if(endT>4.8)finish();
 }
 // ───────── fin guion ─────────
 async function start(){
  if(active)return;
  if(!TRK)TRK=await fetch(TRACK_URL).then(r=>{if(!r.ok)throw Error('No se pudo cargar la cinemática');return r.json()});
  return new Promise(done=>{
   if(active)return done();
   resolve=done;active=true;t=0;sounds.clear();fired.clear();lastCount=0;root.hidden=false;flash.style.opacity=0;fade.style.opacity=1;fade.style.transition='none';count.classList.remove('pop');
   requestAnimationFrame(()=>root.classList.add('on'));
   savedFov=camera.fov;
   if(!sign)sign=makeSign(scene);if(!bursts)bursts=makeBursts(scene);bursts.hide();sign.visible=true;
   if(!B){B=createVehicle(scene);R=createVehicle(scene);O=createVehicle(scene);W=createVehicle(scene);[[B,0,0],[R,1,0],[O,2,1],[W,3,1]].forEach(([c,sl,tm])=>{c.__slot=sl;c.__team=tm})}
   B.apply(getProfile());R.apply({name:'Aliado',body:'octane',color:'#1d6fd8'});O.apply({name:'Rival',body:'octane',color:'#ff8b32'});W.apply({name:'Rival',body:'octane',color:'#ff8b32'});
   vehicle=B;orange=O;ALL().forEach(c=>c.setVisible(false,false));bigFlame.clear();goalAt=0;if(TRK)TRK.G.last=-1;
   ready=root.querySelector('.ready');goalword=root.querySelector('.goalword');idx=-1;shotT=0;endT=0;waiting=false;held=0;prevDown={};pressedPointer=false;downKeys.clear();black.style.opacity=0;logo.classList.remove('show');dim.classList.remove('on');promptEl.classList.remove('on');ready.classList.remove('on');goalword.classList.remove('on');frameCars.length=0;
   ball.visible=true;ball.position.set(0,.9125,0);ballShadow.visible=true;ballShadow.position.set(0,.015,0);ballShadow.material.opacity=.22;
   const keyHandler=e=>{if(!active||hold)return;if(e.target?.closest?.('form,input,textarea'))return;if(e.code==='Enter'&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();onSkip();return}downKeys.add(e.code);if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault()};
   const upHandler=e=>downKeys.delete(e.code),ptr=()=>{if(waiting)pressedPointer=true};
   start.keyHandler=keyHandler;start.upHandler=upHandler;start.ptr=ptr;addEventListener('keydown',keyHandler,true);addEventListener('keyup',upHandler,true);addEventListener('pointerdown',ptr,true);
   root.style.pointerEvents='none';
  });
 }
 function finish(){
  if(!active)return;active=false;root.classList.remove('on');removeEventListener('keydown',start.keyHandler,true);removeEventListener('keyup',start.upHandler,true);removeEventListener('pointerdown',start.ptr,true);downKeys.clear();
  const P=power(),Dc=decor();P.towers.fill(1);P.flood=P.city=P.neon=1;Dc.wall=Dc.paint=Dc.goal=1;
  fans?.hide();stadium.maskCrowd?.(null);ALL().forEach(c=>c?.setVisible(false,false));black.style.opacity=0;logo.classList.remove('show');dim.classList.remove('on');promptEl.classList.remove('on');if(sign)sign.visible=false;bursts?.hide();
  ball.rotation.set(0,0,0);camera.fov=savedFov;camera.updateProjectionMatrix();
  setTimeout(()=>{root.hidden=true},600);root.style.pointerEvents='none';
  const r=resolve;resolve=null;r?.();
 }
 function update(dt){
  if(!active||hold)return;
  t+=dt;const T0=TIMELINE;
  lights();night();
  stage();frameCars.length=0;
  if(t<T0.black){titleShot();ball.position.y=.9125}
  else if(t<T0.aerial){}
  else if(t<T0.sign){aerial();ball.position.y=.9125}
  else if(t<T0.octane)signShot();
  else if(t<T0.count){octaneShot();sound('engine',()=>{audio.tone(55,3.6,.15,'sawtooth',160);audio.noise(3.6,.1,500)})}
  else if(t<T0.kick)countShot();
  else{if(count.classList.contains('pop'))count.classList.remove('pop');script(dt)}
  if(t<T0.kick)digit();
  sign.visible=t>=T0.sign&&t<T0.octane;
  camera.updateProjectionMatrix();
  vfx.begin(dt);for(const f of frameCars)vfx.car(f.state,f.a.root,{localSlot:0,boostRGB:f.a.boostRGB});vfx.update(dt,{streaks:frameCars.some(f=>f.a===B)});
  bursts?.update(dt);
 }
 return{get debug(){return{idx,waiting,id:S[idx]?.id,shotT,endT}},get active(){return active},set hold(v){hold=v},start,update,skip:finish,bindPads(p,states){pads=p;padStates=states},seek(time,step=1/30){if(!active)return;const n=Math.max(0,Math.round((time-t)/step));for(let i=0;i<n;i++)update(step)},get time(){return t}};
}
