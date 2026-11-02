import * as T from './vendor/three.module.js';
import {createFans} from './fans.js?v=rl-20261031';
import {softGlow} from './boost-visual.js?v=rl-20261031';
import {logoSVG} from './logo.js?v=rl-20261031';
import {DemolitionFX} from './demolition-fx.js?v=demo1';
import {FollowCamera} from './follow-camera.js?v=rl-20261031';
import {createTutorialAudio} from './tutorial-audio.js?v=final2';
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
   const k=s/half;placeSpawn(vehicle,0,.17+Math.sin(t*2.2)*.01);orange.setVisible(false,false);
   camAtSpawn(0,[lerp(1.6,3.2,k),.5,28.6],[3,.65,24]);camera.fov=lerp(52,46,k);
  }else{
   const k=(s-half)/(T0.count-T0.octane-half);placeSpawn(orange,2,.17+Math.sin(t*2.4)*.01);vehicle.setVisible(false,false);
   camAtSpawn(2,[lerp(-.2,1.2,k),.8,lerp(-16.4,-17.4,k)],[-3,.9,-22]);camera.fov=lerp(56,50,k);
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
 let cdMute=false,lastWall=0,wasHold=false,anyPress=false,arrived=false,holdDone=false,gate=0,lastRate=1,prepared=null;const HOLD=3.2;   // HOLD: la tarjeta «presiona cualquier botón» espera aquí hasta que el jugador pulse   // cdMute: si suena la pista de audio (trae su propia cuenta atrás) no se añade el pitido sintético
 function digit(){const n=t<16.9||t>=TIMELINE.kick?0:t<17.9?3:t<18.9?2:1;if(n&&n!==lastCount){lastCount=n;count.textContent=n;count.classList.remove('pop');void count.offsetWidth;count.classList.add('pop');cdMute||audio.tone(n===1?880:660,.35,.28,'sine')}}
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
 // El tutorial es la continuación de esa misma partida: un tiro naranja a portería, la atajada del coche azul y un contraataque con gol.
 // Cada aviso congela la partida justo antes de la acción que el coche hace en la grabación y la reanuda al pulsar la tecla.
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
 const bigFlame=new Set();let autoW=0;
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
  // Eventos reales de la simulación: la demolición y el gol.
  for(const e of sc.events){if(e.t>(sc.last??-1)&&e.t<=time){
   if(e.type==='demo')once('dm'+e.t+e.slot,()=>{audio.noise(1.5,.9,900);audio.tone(52,1,.7,'sine',22)});      // el efecto visual lo dibuja DemolitionFX (más abajo)
   if(e.type==='goal'){boom('goal',[ballS.p.x,Math.max(1.4,ballS.p.y),Math.min(ballS.p.z,-51.5)],2.1);burst('g2',[ballS.p.x,2,-52],[1,.55,.1],300,18,1.3);burst('g3',[ballS.p.x,2,-51.5],[.55,.38,.2],220,7,2.2)}
  }}
  sc.last=time;DFX&&DFX.setTime(time);
 }
 const burst=(key,c,rgb,n,sp,ttl)=>once(key,()=>bursts.add(c,rgb,n,sp,ttl));
 const boom=(key,c,big=1)=>once(key,()=>{bursts.add(c,[1,.72,.28],Math.round(420*big),16*big,1.6);bursts.add(c,[1,1,.9],Math.round(160*big),26*big,.8);audio.noise(1.6,.9,900);audio.tone(55,1,.7,'sine',22);flash.style.transition='none';flash.style.opacity=.85;requestAnimationFrame(()=>{flash.style.transition='opacity .6s';flash.style.opacity=0})});
 const goTxt=()=>once('go',()=>{count.textContent='GO!';count.classList.remove('pop');void count.offsetWidth;count.classList.add('pop');cdMute||audio.tone(990,.4,.25,'sine')});
 // Cámara provisional: nunca sale del estadio (elipse de 40 x 50 m).
 const cam=(px,py,pz,lx,ly,lz,fov=50)=>{const q=(px/40)*(px/40)+(pz/50)*(pz/50);if(q>.88){const k=Math.sqrt(.88/q);px*=k;pz*=k}camera.position.set(px,Math.max(.6,py),pz);camera.up.set(0,1,0);camera.lookAt(lx,ly,lz);camera.fov=fov};
 let curShot='';const SM={p:new V3(),l:new V3(),id:''};
 const follow=(pos,look,fov,sm)=>{if(SM.id!==curShot){SM.p.copy(pos);SM.l.copy(look);SM.id=curShot}else{SM.p.lerp(pos,sm);SM.l.lerp(look,sm)}cam(SM.p.x,SM.p.y,SM.p.z,SM.l.x,SM.l.y,SM.l.z,fov)};
 // Plano general que sigue la acción: entre el balón y el centro del campo, a media altura.
 const wide=()=>{tA.copy(ballS.p);tB.set(-tA.x*.3,0,-tA.z*.3);const dx=tB.x,dz=tB.z;let l=Math.hypot(dx,dz);const ux=l>1?dx/l:0,uz=l>1?dz/l:1;
  tB.set(tA.x+ux*24,12+Math.min(8,tA.y*.4),tA.z+uz*24);tA.set(ballS.p.x,Math.max(1,ballS.p.y*.7),ballS.p.z);follow(tB,tA,58,.07)};
 // Persecución detrás de un coche.
 const chase=(c,back,up,ahead,fov)=>{tA.copy(c.f).setY(0).normalize();tB.set(c.p.x-tA.x*back,c.p.y+up,c.p.z-tA.z*back);const lk=new V3(c.p.x+tA.x*ahead,c.p.y+.8,c.p.z+tA.z*ahead);follow(tB,lk,fov,.2)};
 let DFX=null;const S=[];let vAcc=0;const MK_END=()=>TRK.G.n/TRK.G.hz;let FS=null;
 const sh=(id,dur,cm,o={})=>{const v0=vAcc,run=(k,st,v)=>{show(v);if(o.go&&v>.3)goTxt();cm(k,st,v)};const {go,...rest}=o;S.push({id,dur,run,v0,...rest});vAcc+=dur};
 const P=()=>carS[0];
 const readyTop=v=>{ready.style.top=v};
 // ───── Cámaras de cine hechas en el editor de cámaras (camaras-tutorial.json) ─────
 let CK=null,CQ=null,CSEC=[],lastCd=-1,fLast=-1,fSec=null,ovEls=null;
 const FOLLOW=new FollowCamera(new T.PerspectiveCamera(60,16/9,.1,400)),fcam2=FOLLOW.camera,OUTC={pos:new V3(),q:new Q4(),fov:60,bars:0,vig:0,grain:0};
 const qlog=q=>{const w=Math.min(1,Math.max(-1,q.w)),s=Math.sqrt(1-w*w);if(s<1e-6)return [0,0,0];const a=Math.acos(w)/s;return [q.x*a,q.y*a,q.z*a]};
 const qexp=v=>{const a=Math.hypot(v[0],v[1],v[2]);if(a<1e-6)return new Q4(0,0,0,1);const s=Math.sin(a)/a;return new Q4(v[0]*s,v[1]*s,v[2]*s,Math.cos(a))};
 const hermite=(p0,p1,m0,m1,dt,u)=>{const u2=u*u,u3=u2*u;return (2*u3-3*u2+1)*p0+(u3-2*u2+u)*dt*m0+(-2*u3+3*u2)*p1+(u3-u2)*dt*m1};
 const tangentK=(ks,i,get)=>{const n=ks.length;if(i<=0||i>=n-1)return 0;if(ks[i+1].ease==='cut'||ks[i].ease==='cut')return 0;return (get(ks[i+1])-get(ks[i-1]))/Math.max(1e-4,ks[i+1].t-ks[i-1].t)};
 function rotControlsK(ks){const qs=ks.map(k=>new Q4(...k.q).normalize());for(let i=1;i<qs.length;i++)if(qs[i-1].dot(qs[i])<0)qs[i].set(-qs[i].x,-qs[i].y,-qs[i].z,-qs[i].w);
  const ss=qs.map((q,i)=>{let prev=qs[Math.max(0,i-1)],next=qs[Math.min(qs.length-1,i+1)];if(i<ks.length-1&&ks[i+1].ease==='cut')next=q;if(i>0&&ks[i].ease==='cut')prev=q;const qi=q.clone().invert(),a=qlog(qi.clone().multiply(next)),b=qlog(qi.clone().multiply(prev));return q.clone().multiply(qexp([-(a[0]+b[0])/4,-(a[1]+b[1])/4,-(a[2]+b[2])/4]))});return {qs,ss}}
 function evalKeysK(t){const ks=CK,set=k=>{OUTC.pos.set(...k.pos);OUTC.q.set(...k.q);OUTC.fov=k.fov;OUTC.bars=k.bars;OUTC.vig=k.vig;OUTC.grain=k.grain};
  if(t<=ks[0].t||ks.length===1){set(ks[0]);return}if(t>=ks[ks.length-1].t){set(ks[ks.length-1]);return}
  let i=0;while(i<ks.length-2&&t>=ks[i+1].t)i++;const a=ks[i],b=ks[i+1],dt=b.t-a.t,u=clamp01((t-a.t)/dt);
  if(b.ease==='cut'){set(a);return}
  if(b.ease==='linear'){OUTC.pos.set(L(a.pos[0],b.pos[0],u),L(a.pos[1],b.pos[1],u),L(a.pos[2],b.pos[2],u));OUTC.q.copy(CQ.qs[i]).slerp(CQ.qs[i+1],u);OUTC.fov=L(a.fov,b.fov,u);OUTC.bars=L(a.bars,b.bars,u);OUTC.vig=L(a.vig,b.vig,u);OUTC.grain=L(a.grain,b.grain,u);return}
  const H=get=>hermite(get(a),get(b),tangentK(ks,i,get),tangentK(ks,i+1,get),dt,u);
  OUTC.pos.set(H(k=>k.pos[0]),H(k=>k.pos[1]),H(k=>k.pos[2]));
  const s1=CQ.qs[i].clone().slerp(CQ.qs[i+1],u),s2=CQ.ss[i].clone().slerp(CQ.ss[i+1],u);OUTC.q.copy(s1).slerp(s2,2*u*(1-u));
  OUTC.fov=Math.min(130,Math.max(10,H(k=>k.fov)));OUTC.bars=Math.min(.3,Math.max(0,H(k=>k.bars)));OUTC.vig=clamp01(H(k=>k.vig));OUTC.grain=clamp01(H(k=>k.grain))}
 // vista del jugador: la cámara del propio juego siguiendo al coche del jugador (con calentamiento al entrar o al saltar en el tiempo)
 function stepF(x,dt){sample(TRK.G,x);const c=carS[0];FOLLOW.update(dt,{position:c.p,quaternion:c.q,velocity:c.v,ball:ballS.p,onGround:!!(c.fl&1),isFlipping:!!(c.fl&4),ballCam:!!fSec.ballCam,speed3:c.v.length(),boosting:!!(c.fl&2),shake:0})}
 function playerCam(v,sec){if(fSec!==sec||v<fLast||v-fLast>.25){fSec=sec;FOLLOW.reset();for(let x=Math.max(sec.from,v-.7);x<v;x+=1/30)stepF(x,1/30)}
  stepF(v,Math.max(1/60,Math.min(.1,v-fLast)));fLast=v}
 // barras de cine, viñeta y grano (con el valor de cada instante) y cuenta atrás 3-2-1-¡YA!
 function ensureOv(){if(ovEls)return;const mk=css=>{const d=document.createElement('div');d.style.cssText='position:absolute;pointer-events:none;z-index:2;'+css;root.append(d);return d};
  ovEls={t:mk('left:0;right:0;top:0;height:0;background:#000'),b:mk('left:0;right:0;bottom:0;height:0;background:#000'),v:mk('inset:0;opacity:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 45%,rgba(0,0,0,.92) 100%)'),g:mk('inset:0;opacity:0;mix-blend-mode:overlay;background-size:160px 160px')};
  const c=document.createElement('canvas');c.width=c.height=160;const g=c.getContext('2d'),im=g.createImageData(160,160);for(let i=0;i<im.data.length;i+=4){const x=Math.random()*255;im.data[i]=im.data[i+1]=im.data[i+2]=x;im.data[i+3]=255}g.putImageData(im,0,0);ovEls.g.style.backgroundImage=`url(${c.toDataURL()})`}
 function ovApply(o){ensureOv();const h=(o.bars||0)*100+'%';ovEls.t.style.height=h;ovEls.b.style.height=h;ovEls.v.style.opacity=o.vig||0;ovEls.g.style.opacity=(o.grain||0)*.5;ovEls.g.style.backgroundPosition=`${Math.random()*160|0}px ${Math.random()*160|0}px`}
 function countdown(v){count.style.cssText='top:42%;font:italic 900 clamp(90px,22vh,260px) \'Barlow Condensed\',Impact,Arial Black,sans-serif;letter-spacing:.02em;color:#fff;text-shadow:0 0 30px #2d8cff,0 0 80px #1d6fff;z-index:3';const pop=txt=>{count.textContent=txt;count.classList.remove('pop');void count.offsetWidth;count.classList.add('pop')};
  const n=v<3?Math.floor(Math.max(0,v)):v<3.9?3:4;if(n===lastCd)return;lastCd=n;
  if(n<3){pop(String(3-n));cdMute||audio.tone(440,.25,.2,'sine')}else if(n===3){pop('¡YA!');cdMute||audio.tone(990,.4,.25,'sine')}else{count.classList.remove('pop');count.textContent=''}}
 function applyCam(v){const sec=CSEC.find(s=>v>=s.from&&v<=s.to);let o;
  if(sec){playerCam(v,sec);camera.position.copy(fcam2.position);camera.quaternion.copy(fcam2.quaternion);camera.fov=fcam2.fov;o={bars:sec.bars||0,vig:0,grain:0}}
  else{evalKeysK(v);camera.position.copy(OUTC.pos);camera.quaternion.copy(OUTC.q);camera.fov=OUTC.fov;o=OUTC}
  camera.up.set(0,1,0);ovApply(o);countdown(v)}
 // Los planos se construyen al cargar la grabación: los momentos de cada acción se midieron en ella.
 function buildShots(){
  if(!DFX)DFX=new DemolitionFX(scene);DFX.clear();
  for(const e of TRK.G.events)if(e.type==='demo'){const G0=TRK.G,i=Math.min(G0.n-1,Math.max(0,Math.floor((e.t-.03)*G0.hz))),f=G0.frames[i],o=e.slot*9;DFX.spawn(f[o],f[o+1],f[o+2],e.slot>=2?1:0,e.t,Math.round(e.t*1000))}
  // cámaras de cine del editor (si existe camaras-tutorial.json)
  CK=null;CSEC=[];lastCd=-1;fLast=-1;fSec=null;
  if(CAM&&CAM.cameraKeys&&CAM.cameraKeys.length){CK=CAM.cameraKeys.map(k=>({t:k.t,pos:k.pos,q:k.quat,fov:k.fov,bars:k.bars||0,vig:k.vignette||0,grain:k.grain||0,ease:k.transition||'smooth'})).sort((a,b)=>a.t-b.t);CSEC=(CAM.playerSections||[]).map(s=>({...s}));CQ=rotControlsK(CK)}
  S.length=0;vAcc=0;FS=null;const MK=TRK.G.marks,LEAD=.05,SC=()=>carS[MK.scorer??0];let CUT=Infinity;
  if(CK){
   // Con las cámaras del editor: cuenta atrás, montaje y tutorial hasta donde llegan tus cámaras (el resto aún no está dirigido)
   const lastEnd=Math.max(CK[CK.length-1].t,...CSEC.map(s=>s.to));CUT=Math.min(MK.goal,lastEnd+.6);
   sh('play',MK.tb,(k,s,v)=>{readyTop('');applyCam(v)});
   sh('ready',MK.move-LEAD-MK.tb,(k,s,v)=>{readyTop('34%');ready.classList.add('on');applyCam(v)});
   sh('p1',MK.hop-LEAD-(MK.move-LEAD),(k,s,v)=>{readyTop('34%');ready.classList.toggle('on',v<MK.move+1.3);applyCam(v)});   // sin aviso: conducir no se enseña
   sh('p2',MK.boost-LEAD-(MK.hop-LEAD),(k,s,v)=>{ready.classList.remove('on');applyCam(v)},{prompt:{action:'jump',mode:'press',text:a=>`Pulsa ${a('jump')} para saltar.`}});
   sh('p3',MK.dodge-LEAD-(MK.boost-LEAD),(k,s,v)=>{applyCam(v)},{prompt:{action:'boost',mode:'hold',text:a=>`Mantén ${a('boost')} para usar el turbo.`}});
   // segunda acción del jugador: el golpe del gol (el coche salta y hace la esquiva hacia el balón)
   let HIT=null;{const G0=TRK.G;for(let i=Math.round((MK.dodge+1)*G0.hz);i<G0.n-1&&HIT==null;i++){const f=G0.frames[i],pf=G0.frames[i-1];if(!(f[7]&1)&&(pf[7]&1)){for(let j=i;j<Math.min(G0.n,i+Math.round(.6*G0.hz));j++)if(G0.frames[j][7]&4){HIT=i/G0.hz;break}}}}
   if(HIT!=null&&HIT-LEAD>MK.dodge&&HIT<CUT){
    sh('p4',HIT-MK.dodge,(k,s,v)=>{applyCam(v)},{prompt:{action:'forward',mode:'dodge',text:a=>`Pulsa ${a('forward')} + ${a('jump')} para esquivar hacia delante.`}});
    sh('p5',Math.max(.2,CUT-(HIT-LEAD)),(k,s,v)=>{applyCam(v)},{prompt:{action:'forward',mode:'dodge',text:a=>`Pulsa ${a('forward')} + ${a('jump')} para esquivar y golpear el balón.`}});
   }else sh('p4',Math.max(.2,CUT-(MK.dodge-LEAD)),(k,s,v)=>{applyCam(v)},{prompt:{action:'forward',mode:'dodge',text:a=>`Pulsa ${a('forward')} + ${a('jump')} para esquivar hacia delante.`}});
  }else{
   sh('play',MK.tb,(k,s,v)=>{readyTop('');wide()},{go:true});
   sh('ready',MK.move-LEAD-MK.tb,(k,s,v)=>{readyTop('34%');ready.classList.add('on');wide()});
   sh('p1',MK.hop-LEAD-(MK.move-LEAD),(k,s,v)=>{readyTop('34%');ready.classList.toggle('on',v<MK.move+1.3);chase(P(),6,2.4,12,60)});
   sh('p2',MK.boost-LEAD-(MK.hop-LEAD),(k,s,v)=>{ready.classList.remove('on');chase(P(),6,2.4,12,60)},{prompt:{action:'jump',mode:'press',text:a=>`Pulsa ${a('jump')} para saltar.`}});
   sh('p3',MK.dodge-LEAD-(MK.boost-LEAD),(k,s,v)=>{chase(P(),7,2.6,12,62)},{prompt:{action:'boost',mode:'hold',text:a=>`Mantén ${a('boost')} para usar el turbo.`}});
   sh('p4',MK.goal-(MK.dodge-LEAD),(k,s,v)=>{if(v<MK.save+1.3)chase(P(),7,2.6,12,62);else if(v<MK.goal-1.6)wide();else chase(SC(),8,3,14,62)},{prompt:{action:'forward',mode:'dodge',text:a=>`Pulsa ${a('forward')} + ${a('jump')} para esquivar hacia delante.`}});
  }
  if(CK&&CUT<MK.goal)return;   // las cámaras llegan solo hasta aquí: se pasa al logo
  // 4) Final: en la explosión del gol todos los coches salen volando; el del jugador da una vuelta en el aire para no caer boca arriba,
  //    aterriza, sigue acelerando hasta pasar por encima de la cámara y entonces aparece el logo.
  const GRAV=9.5,sm01=k=>{k=clamp01(k);return k*k*(3-2*k)},QY=new Q4(),QX=new Q4(),QS=new Q4(),AXY=new V3(0,1,0),AXX=new V3(1,0,0),TMP=new V3();
  const wrapA=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a};
  sh('fly',4.0,(k,st,v)=>{
   show(MK_END());goalword.classList.toggle('on',st<1.9);
   const sci=MK.scorer??0,vs=VEH();
   // si el usuario puso cámaras hasta el gol, la del final es SU último keyframe y el coche pasa por encima de ella cuando sale el logo
   const FTGT=(CK&&CK[CK.length-1].t>=MK.goal-.3)?{x:CK[CK.length-1].pos[0],z:CK[CK.length-1].pos[2],arr:(CAM&&CAM.logo?CAM.logo.t:MK.goal+3.6)}:null;
   if(!FS){FS=[];const gx=ballS.p.x;
    for(let i=0;i<4;i++){const c=carS[i];const d=new V3(c.p.x-gx,0,c.p.z+51.5);if(d.lengthSq()<1)d.set(0,0,1);const dist=d.length();d.normalize();
     let vhS=null;if(i===sci&&FTGT){d.set(FTGT.x-c.p.x,0,FTGT.z-c.p.z);const D0=d.length()||1;d.divideScalar(D0);const tlS=(13+Math.sqrt(169+2*GRAV*Math.max(0,c.p.y-.17)))/GRAV,tau=Math.max(.3,FTGT.arr-MK.goal-tlS);vhS=Math.min(30,Math.max(3,(D0-13*tau*tau)/(tlS+tau)))}
     const isS=i===sci,vh=isS?(vhS??13):7+((i*3)%6)+Math.max(0,1-dist/60)*8,vy=isS?13:11+i*1.7,sd=isS?0:(i%2?1:-1)*(2+i);
     const V0=new V3(d.x*vh-d.z*sd+(vhS!=null?0:c.v.x*.3),vy,d.z*vh+d.x*sd+(vhS!=null?0:c.v.z*.3)),tl=(V0.y+Math.sqrt(V0.y*V0.y+2*GRAV*Math.max(0,c.p.y-.17)))/GRAV;
     const o={p0:c.p.clone(),q0:c.q.clone(),V0,tl,d,spin:new V3(Math.sin(i*2.1+1),Math.cos(i*1.7),Math.sin(i*3.3)).normalize(),w:5+i};
     if(isS){const f=new V3(0,0,-1).applyQuaternion(c.q);o.psi0=Math.atan2(f.x,-f.z);o.psi1=Math.atan2(d.x,-d.z);o.dpsi=wrapA(o.psi1-o.psi0);
      o.land=new V3(c.p.x+V0.x*tl,.17,c.p.z+V0.z*tl);o.vL=Math.hypot(V0.x,V0.z);o.cam=new V3(o.land.x+d.x*14,1.3,o.land.z+d.z*14)}
     FS.push(o)}}
   
   let sp=null;
   for(let i=0;i<4;i++){const o=FS[i],veh=vs[i];if(!veh)continue;const dem=!!(carS[i].fl&8);veh.setVisible(!dem,false);if(dem)continue;
    let air=st<o.tl,t=Math.min(st,o.tl);
    const px=o.p0.x+o.V0.x*t,pz=o.p0.z+o.V0.z*t,py=Math.max(.17,o.p0.y+o.V0.y*t-.5*GRAV*t*t);
    if(i!==sci){
     if(air){TMP.set(px,py,pz);veh.root.position.copy(TMP);QS.setFromAxisAngle(o.spin,o.w*st);veh.root.quaternion.copy(o.q0).multiply(QS)}
     else{const tau=st-o.tl,sl=(1-Math.exp(-3*tau))/3;veh.root.position.set(px+o.V0.x*sl,.17,pz+o.V0.z*sl);QS.setFromAxisAngle(o.spin,o.w*o.tl);veh.root.quaternion.copy(o.q0).multiply(QS)}
     veh.flame.visible=false;veh.update(v);continue}
    // coche del jugador
    if(air){const u=sm01(st/o.tl);veh.root.position.set(px,py,pz);QY.setFromAxisAngle(AXY,-(o.psi0+o.dpsi*u));QX.setFromAxisAngle(AXX,-2*Math.PI*u);veh.root.quaternion.copy(QY).multiply(QX);veh.flame.visible=true;veh.flame.scale.setScalar(1.6)}
    else{const tau=st-o.tl,sd=o.vL*tau+13*tau*tau,y=.17;veh.root.position.set(o.land.x+o.d.x*sd,y,o.land.z+o.d.z*sd);
     QY.setFromAxisAngle(AXY,-o.psi1);QX.setFromAxisAngle(AXX,0);veh.root.quaternion.copy(QY).multiply(QX);veh.flame.visible=true;veh.flame.scale.setScalar(2.6)}
    veh.update(v);sp=veh.root.position;
   }
   const o=FS[sci];if(FTGT){applyCam(v)}else if(sp&&o){SM.p.lerp(o.cam,st<.25?.01:.045);SM.l.lerp(sp,.1);const tf=st<o.tl?56:64;cam(SM.p.x,SM.p.y,SM.p.z,SM.l.x,SM.l.y,SM.l.z,camera.fov+(tf-camera.fov)*.05)}
  }); }
 const TOTAL_REL=()=>S.reduce((a,b)=>a+b.dur,0);
 let B=null,R=null,O=null,W=null,ready=null,goalword=null,TRK=null,CAM=null;
 const ALL=()=>[B,R,O,W].filter(Boolean);
 const PREVIEW=new URLSearchParams(location.search).get('preview');
 const TRACK_URL=new URL(PREVIEW?`./intro-track-${PREVIEW}.json`:'./intro-track.json?v=final1',import.meta.url);
 let st=0,idx=0,shotT=0,waiting=false,held=0,prevDown={},endPhase=0,endT=0;
 const downKeys=new Set();
 const isDown=(a)=>{for(const c of downKeys)if(matches(a,c))return true;return false};
 const label=a=>{try{return labelOf(a)}catch{return a}};
  // ───── Avisos al jugador: teclas EXACTAS, cámara lenta progresiva, congelado y audio ─────
  const LIVE=new URLSearchParams(location.search).get('live')==='1';   // ?live=1 → proyecto del editor (localStorage + IndexedDB)
  const TA=createTutorialAudio();let preOK=false,promptFor=null,PT=-19.6,audLoaded=false,rmp=-1,rampFrom=1,levelFrom=1;let rampDur=.9;const prm=sh=>{const c=CSEC.find(x=>sh&&sh.v0>=x.from-.01&&sh.v0<=x.to+.01)||{};return{win:c.slowDownSeconds??1.1,min:c.minSpeed??.1,up:c.speedUpSeconds??.9}};   // ajustes de cada sección de vista del jugador
  function idbBytes(key){return new Promise(res=>{try{const r=indexedDB.open('rocketArenaCamEditor',2);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('a'))r.result.createObjectStore('a')};r.onerror=()=>res(null);
   r.onsuccess=()=>{try{const q=r.result.transaction('a').objectStore('a').get(key);q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null)}catch{res(null)}}}catch{res(null)}})}
  const loadAudioBytes=src=>LIVE?idbBytes('s_'+src.id):fetch(new URL('./audio/'+encodeURIComponent(src.file),import.meta.url),{cache:'no-cache'}).then(r=>r.ok?r.arrayBuffer():null);
  // posición de saque de cada coche (la de la grabación en t=0) para la presentación previa
  const SHOWC={0:{x:3,z:24,yaw:Math.PI+.5},2:{x:-3,z:-22,yaw:0}};
  function spawnPose(slot){const f=TRK.G.frames[0],o=slot*9,q=new Q4(f[o+3],f[o+4],f[o+5],f[o+6]),fw=new V3(0,0,-1).applyQuaternion(q);return{x:f[o],z:f[o+2],yaw:Math.atan2(-fw.x,-fw.z)}}
  function placeSpawn(v,slot,y){const p=spawnPose(slot);place(v,p.x,y,p.z,p.yaw)}
  function camAtSpawn(slot,pp,ll){const o=SHOWC[slot],n=spawnPose(slot),d=n.yaw-o.yaw,c=Math.cos(d),sn=Math.sin(d);
   const tr=a=>{const dx=a[0]-o.x,dz=a[2]-o.z;return[n.x+dx*c+dz*sn,a[1],n.z-dx*sn+dz*c]};
   camera.position.set(...tr(pp));camera.up.set(0,1,0);camera.lookAt(...tr(ll))}
  function showPrompt(s,dimOn=true){
   promptEl.innerHTML=(PREVIEW&&!LIVE?'<b style="color:#ffd36a">AQUÍ ACTÚA EL JUGADOR ▸ </b>':'')+s.prompt.text(a=>'<kbd>'+label(a)+'</kbd>');promptEl.classList.add('on');if(dimOn)dim.classList.add('on');
   sound('p'+S.indexOf(s),()=>audio.tone(660,.25,.18,'sine'))}
  // true solo cuando el jugador hace EXACTAMENTE lo que pide el aviso con las teclas configuradas en el juego (un clic cualquiera no vale)
  function promptState(p,dt){
   const d=isDown(p.action),j=isDown('jump');let ok=false;
   if(p.mode==='hold'){held=d?held+dt:0;ok=held>.55}
   else if(p.mode==='press'){ok=d&&!prevDown[p.action]}
   else if(p.mode==='dodge'){ok=j&&!prevDown.jump&&isDown('forward')}
   prevDown={[p.action]:d,jump:j,forward:isDown('forward')};
   return ok}
  function autoRelease(dt){return false}
  function nextShot(){
   idx++;shotT=0;held=0;waiting=false;const s=S[idx];
   promptEl.classList.remove('on');dim.classList.remove('on');
   if(s?.prompt){if(preOK){preOK=false;promptFor=null;sound('ok'+idx,()=>audio.tone(990,.2,.14,'sine'))}else{waiting=true;rmp=-1;promptFor=s;showPrompt(s,true);if(TA.hasAudio)TA.fadeOut(.6)}}   // si ya lo hizo durante la cámara lenta, no se congela
  }
  function script(dt){
   if(idx<0){idx=0;shotT=0}
   const s=S[idx];if(!s){PT+=dt;return endSeq(dt)}
   const p=s.prompt,nxt=S[idx+1];let rate=1;
   if(waiting&&p){
    // momento límite: todo congelado hasta que pulse las teclas exactas
    rate=0;if(promptState(p,dt)||autoRelease(dt))release()
   }else if(!waiting&&(!p||s.dur>1.2)&&nxt&&nxt.prompt&&!preOK&&rmp<0){   // cámara lenta antes de cada aviso (salvo los que vienen pegados al anterior)
    // se acerca la acción: la escena se ralentiza poco a poco; el audio se ralentiza y se silencia a la vez, hasta el silencio total al congelarse
    const PRM=prm(nxt),rem=s.dur-shotT;
    if(rem<PRM.win){
     const k=clamp01(1-rem/PRM.win);rate=L(1,PRM.min,E(k));const lvl=1-E(k);
     if(promptFor!==nxt){promptFor=nxt;held=0;prevDown={};showPrompt(nxt,false)}
     TA.follow(rate,lvl);
     if(promptState(nxt.prompt,dt)||autoRelease(dt)){preOK=true;promptFor=null;promptEl.classList.remove('on');sound('okpre'+idx,()=>audio.tone(990,.2,.14,'sine'));rmp=0;rampDur=PRM.up;rampFrom=rate;levelFrom=lvl}   // lo hizo a tiempo: no se congela
    }
   }
   if(rmp>=0){   // al cumplirse: escena y audio recuperan poco a poco la velocidad y el volumen normales
    rmp+=dt;const kk=clamp01(rmp/rampDur);if(!waiting){rate=L(rampFrom,1,E(kk));TA.follow(rate,L(levelFrom,1,E(kk)))}if(kk>=1)rmp=-1}
   shotT+=dt*rate;const k=clamp01(shotT/s.dur);PT=s.v0+shotT;if(logoStep()){finish();return}
   frameCars.length=0;
   ALL().forEach(a=>a.setVisible(false,false));ball.visible=true;
   ready.classList.remove('on');goalword.classList.remove('on');
   curShot=s.id;s.run(k,shotT,s.v0+shotT);camera.updateProjectionMatrix();
   if(shotT>=s.dur&&!waiting)nextShot();
  }
  let pressedPointer=false;
  function release(){autoW=0;waiting=false;promptFor=null;held=0;promptEl.classList.remove('on');dim.classList.remove('on');sound('ok'+idx,()=>audio.tone(990,.2,.14,'sine'));const P2=prm(S[idx]);rmp=0;rampDur=P2.up;rampFrom=P2.min;levelFrom=0;if(TA.hasAudio)TA.start(PT,0,P2.min,0)}   // cumplido: vuelve el sonido que toca en ese momento (desde silencio y lento) y la escena se desralentiza
 function logoStep(){const lg=CAM&&CAM.logo;if(!lg)return false;const k=PT-lg.t;black.style.opacity=k<=0?0:clamp01(k/Math.max(.02,lg.fadeToBlack));
  if(k>=lg.fadeToBlack&&!logo.classList.contains('show')){logo.classList.add('show');sound('logo',()=>{audio.tone(60,1.6,.9,'sine',26);audio.noise(1.3,.5,2600);for(const f of [261.6,392,523.2,784])audio.tone(f,1.8,.09)})}
  return k>=lg.duration}
 function endSeq(dt){
  // El coche pasa sobre la cámara → corte a negro → logo.
  endT+=dt;ALL().forEach(a=>a.setVisible(false,false));frameCars.length=0;
   if(CAM&&CAM.logo){if(logoStep())finish();return}
  black.style.opacity=1;if(endT>.25&&!logo.classList.contains('show')){logo.classList.add('show');sound('logo',()=>{audio.tone(60,1.6,.9,'sine',26);audio.noise(1.3,.5,2600);for(const f of [261.6,392,523.2,784])audio.tone(f,1.8,.09)})}
  if(endT>4.8)finish();
 }
 // ───────── fin guion ─────────
 // Carga todo lo pesado (cinemática, cámaras, audio decodificado, coches, sombras compiladas) ANTES de que empiece la intro.
 async function prepare(){
  if(!TRK)TRK=await fetch(TRACK_URL,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('No se pudo cargar la cinemática');return r.json()});
  if(!TRK||!TRK.G||!TRK.G.frames||!TRK.G.marks)throw Error('La cinemática está desactualizada: recarga con Ctrl+F5');
  if(!CAM||LIVE){try{if(LIVE){const raw=localStorage.getItem('rocketArena.camEditor.live');CAM=raw?JSON.parse(raw):null;audLoaded=false}else{const r=await fetch(new URL('./camaras-tutorial.json?v=final1',import.meta.url),{cache:'no-cache'});if(r.ok)CAM=await r.json()}}catch{}}
  if(CAM&&CAM.audio&&!audLoaded){audLoaded=true;try{await TA.load(CAM,loadAudioBytes)}catch(e){console.warn(e)}}
  cdMute=!!(CAM&&CAM.cameraKeys&&TA.hasAudio);
 }
 function ensureObjects(){
  if(!sign)sign=makeSign(scene);if(!bursts)bursts=makeBursts(scene);
  if(!B){B=createVehicle(scene);R=createVehicle(scene);O=createVehicle(scene);W=createVehicle(scene);[[B,0,0],[R,1,0],[O,2,1],[W,3,1]].forEach(([c,sl,tm])=>{c.__slot=sl;c.__team=tm})}
  B.apply(getProfile());R.apply({name:'Aliado',body:'octane',color:'#1d6fd8'});O.apply({name:'Rival',body:'octane',color:'#ff8b32'});W.apply({name:'Rival',body:'octane',color:'#ff8b32'});
 }
 function warm(){   // dibuja una vez todo lo que usará la intro para que los shaders y texturas ya estén en la GPU
  const p=camera.position.clone(),q=camera.quaternion.clone(),f=camera.fov;
  try{ensureObjects();ALL().forEach((c,i)=>{c.setVisible(true,false);c.root.position.set(-3+i*2,.17,0)});if(sign)sign.visible=true;camera.position.set(0,2.5,9);camera.lookAt(0,.5,0);camera.fov=50;camera.updateProjectionMatrix();renderer.compile(scene,camera);renderer.render(scene,camera)}
  catch(e){console.warn('precarga',e)}
  finally{ALL().forEach(c=>c?.setVisible(false,false));if(sign)sign.visible=false;bursts?.hide();camera.position.copy(p);camera.quaternion.copy(q);camera.fov=f;camera.updateProjectionMatrix()}
 }
 function preload(){return prepared??=prepare().then(()=>{if(!active)warm()}).catch(e=>{prepared=null;throw e})}
 async function start(){
  if(active)return;
  await(LIVE?prepare():preload());await TA.prime();
  if(active)return;
  buildShots();
  return new Promise(done=>{
   if(active)return done();
   resolve=done;active=true;t=0;sounds.clear();fired.clear();lastCount=0;root.hidden=false;flash.style.opacity=0;fade.style.opacity=1;fade.style.transition='none';count.classList.remove('pop');
   requestAnimationFrame(()=>root.classList.add('on'));
   savedFov=camera.fov;
   if(!sign)sign=makeSign(scene);if(!bursts)bursts=makeBursts(scene);bursts.hide();sign.visible=true;
   if(!B){B=createVehicle(scene);R=createVehicle(scene);O=createVehicle(scene);W=createVehicle(scene);[[B,0,0],[R,1,0],[O,2,1],[W,3,1]].forEach(([c,sl,tm])=>{c.__slot=sl;c.__team=tm})}
   B.apply(getProfile());R.apply({name:'Aliado',body:'octane',color:'#1d6fd8'});O.apply({name:'Rival',body:'octane',color:'#ff8b32'});W.apply({name:'Rival',body:'octane',color:'#ff8b32'});
   vehicle=B;orange=O;ALL().forEach(c=>c.setVisible(false,false));bigFlame.clear();if(TRK)TRK.G.last=-1;
   ready=root.querySelector('.ready');goalword=root.querySelector('.goalword');idx=-1;shotT=0;endT=0;waiting=false;held=0;prevDown={};PT=-19.6;promptFor=null;preOK=false;rmp=-1;anyPress=false;arrived=false;holdDone=false;gate=0;lastRate=1;lastWall=0;pressedPointer=false;downKeys.clear();black.style.opacity=0;logo.classList.remove('show');dim.classList.remove('on');promptEl.classList.remove('on');ready.classList.remove('on');goalword.classList.remove('on');frameCars.length=0;
   ball.visible=true;ball.position.set(0,.9125,0);ballShadow.visible=true;ballShadow.position.set(0,.015,0);ballShadow.material.opacity=.22;
   const keyHandler=e=>{if(!active||hold)return;if(e.target?.closest?.('form,input,textarea'))return;if(e.code==='Enter'&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();onSkip();return}if(!e.repeat)anyPress=true;downKeys.add(e.code);if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault()};
   const upHandler=e=>downKeys.delete(e.code),mdown=e=>{anyPress=true;downKeys.add('Mouse'+e.button)},mup=e=>downKeys.delete('Mouse'+e.button);
   start.keyHandler=keyHandler;start.upHandler=upHandler;start.ptr=mdown;start.mup=mup;addEventListener('keydown',keyHandler,true);addEventListener('keyup',upHandler,true);addEventListener('mousedown',mdown,true);addEventListener('mouseup',mup,true);
   root.style.pointerEvents='none';
  });
 }
 function finish(){
  if(!active)return;active=false;root.classList.remove('on');removeEventListener('keydown',start.keyHandler,true);removeEventListener('keyup',start.upHandler,true);removeEventListener('mousedown',start.ptr,true);removeEventListener('mouseup',start.mup,true);downKeys.clear();TA.stop();try{if(parent!==window)parent.postMessage({type:'tutorial-done'},'*')}catch{}
  const P=power(),Dc=decor();P.towers.fill(1);P.flood=P.city=P.neon=1;Dc.wall=Dc.paint=Dc.goal=1;
  fans?.hide();stadium.maskCrowd?.(null);ALL().forEach(c=>c?.setVisible(false,false));black.style.opacity=0;logo.classList.remove('show');dim.classList.remove('on');promptEl.classList.remove('on');if(sign)sign.visible=false;bursts?.hide();
  ball.rotation.set(0,0,0);camera.fov=savedFov;camera.updateProjectionMatrix();
  setTimeout(()=>{root.hidden=true},600);root.style.pointerEvents='none';
  const r=resolve;resolve=null;r?.();
 }
 function update(dt0){
  // El tiempo de la intro es el del reloj real (igual que el audio): con el dt recortado del juego, cualquier tirón (carga de sombras, pestaña lenta) retrasaba la imagen y el sonido se adelantaba.
  const wall=performance.now();let dt=lastWall?Math.min(.5,(wall-lastWall)/1000):Math.min(dt0,.05);lastWall=wall;
  if(!active)return;
  if(hold){if(!wasHold){wasHold=true;TA.stop()}return}   // pausa (p. ej. ventana de inicio de sesión): el audio también se detiene
  if(wasHold){wasHold=false;if(TA.hasAudio&&!waiting&&holdDone)gate=TA.start(PT,.3)}
  if(gate){if(TA.clock()<gate)dt=0;else gate=0}   // la imagen espera el instante exacto en que empieza a sonar el audio
  // La tarjeta «PRESIONA CUALQUIER BOTÓN» no avanza sola: se queda quieta hasta que el jugador pulse (teclado, ratón o mando)
  if(!holdDone&&LIVE){holdDone=true;if(TA.hasAudio)gate=TA.start(PT,0)}
  if(!holdDone&&t+dt>=HOLD){
   if(!arrived){arrived=true;anyPress=false}
   if(!anyPress)try{for(const g of navigator.getGamepads?.()||[])if(g&&g.buttons.some(b=>b.pressed))anyPress=true}catch{}
   if(!anyPress){t=HOLD;dt=0}
   else{holdDone=true;t=HOLD;dt=0;PT=HOLD-TIMELINE.kick;if(TA.hasAudio)gate=TA.start(PT,0)}   // el audio arranca justo ahora, desde donde toca
  }
  // mientras todo va a velocidad normal, la imagen se mantiene pegada al reloj del audio (corrige cualquier tirón)
  if(holdDone&&!gate&&lastRate===1&&!waiting&&rmp<0){const p=TA.pos();if(p!=null&&Math.abs(p-PT)<.5)dt*=1+Math.max(-.15,Math.min(.15,(p-PT)*.6))}
  t+=dt;const T0=TIMELINE;
  lights();night();if(t<T0.kick)PT=t-T0.kick;
  stage();frameCars.length=0;
  if(t<T0.black){titleShot();ball.position.y=.9125}
  else if(t<T0.aerial){}
  else if(t<T0.sign){aerial();ball.position.y=.9125}
  else if(t<T0.octane)signShot();
  else if(t<T0.count){octaneShot();sound('engine',()=>{audio.tone(55,3.6,.15,'sawtooth',160);audio.noise(3.6,.1,500)})}
  else if(t<T0.kick)countShot();
  else{if(!CK&&count.classList.contains('pop'))count.classList.remove('pop');script(dt)}
  if(CK&&CK[0].t<0&&t<T0.kick){evalKeysK(t-T0.kick);camera.position.copy(OUTC.pos);camera.quaternion.copy(OUTC.q);camera.fov=OUTC.fov;camera.up.set(0,1,0);ovApply(OUTC)}   // cámaras de la previa hechas en el editor
  if(t<T0.kick&&!(CAM&&CAM.cameraKeys&&CAM.cameraKeys.length))digit();
  sign.visible=t>=T0.sign&&t<T0.octane;
  camera.updateProjectionMatrix();
  vfx.begin(dt);for(const f of frameCars)vfx.car(f.state,f.a.root,{localSlot:0,boostRGB:f.a.boostRGB});vfx.update(dt,{streaks:frameCars.some(f=>f.a===B)});
  bursts?.update(dt);
 }
 return{preload,get debug(){return{idx,waiting,id:S[idx]?.id,shotT,endT}},get active(){return active},set hold(v){hold=v},start,update,skip:finish,bindPads(p,states){pads=p;padStates=states},seek(time,step=1/30){if(!active)return;const n=Math.max(0,Math.round((time-t)/step));for(let i=0;i<n;i++)update(step)},get time(){return t}};
}
