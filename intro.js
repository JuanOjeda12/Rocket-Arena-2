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
const TIMELINE={ignite:.9,towers:.62,city:3.1,neon:4.4,walls:4.6,paint:6.2,goals:7.2,pads:7.0,sign:9.0,blue:13.4,orange:16.4,octane:19.4,count:23.5,kick:26.0,end:0};
const SIGN={x:0,y:17,z:-61};
function makeSign(scene){
 const c=document.createElement('canvas');c.width=1024;c.height=300;const x=c.getContext('2d');
 x.fillStyle='#040a16';x.fillRect(0,0,1024,300);
 const g=x.createLinearGradient(0,0,0,300);g.addColorStop(0,'#0a2a5a');g.addColorStop(1,'#040a16');x.fillStyle=g;x.fillRect(0,0,1024,300);
 x.strokeStyle='#38b6ff';x.lineWidth=8;x.shadowColor='#2fa8ff';x.shadowBlur=26;x.strokeRect(16,16,992,268);
 x.textAlign='center';x.textBaseline='middle';x.font="italic 900 138px 'Barlow Condensed','Arial Black',Impact,sans-serif";
 x.shadowBlur=36;x.fillStyle='#d6f2ff';x.fillText('ROCKET ARENA',512,128,900);x.shadowBlur=14;x.fillText('ROCKET ARENA',512,128,900);
 x.font="700 40px Barlow,Arial,sans-serif";x.shadowColor='#ff9a2e';x.shadowBlur=18;x.fillStyle='#ffc070';
 try{x.letterSpacing='16px'}catch{}x.fillText('ENTRENAMIENTO',512,238);
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
 root.innerHTML=`<div class="fade"></div><div class="vignette"></div><div class="flash"></div><div class="dim"></div><div class="prompt"></div><div class="ready">PREPÁRATE PARA DEFENDER</div><div class="goalword">GOAL!</div><div class="count"></div><div class="black"></div><div class="logo">${logoSVG({id:'intro',tagline:true})}</div><div class="bar top"></div><div class="bar bottom"></div><div class="skip"><kbd>ENTER</kbd> Saltar introducción</div>`;
 document.body.append(root);
 const fade=root.querySelector('.fade'),flash=root.querySelector('.flash'),count=root.querySelector('.count'),dim=root.querySelector('.dim'),promptEl=root.querySelector('.prompt'),black=root.querySelector('.black'),logo=root.querySelector('.logo');
 let hold=false,fans=null,vehicle=null,orange=null,sign=null,bursts=null,padStates=null,pads=null,t=0,active=false,resolve=null,sounds=new Set(),savedFov=65,fired=new Set(),lastCount=0;
 const power=()=>stadium.power,decor=()=>stadium.decorPower;
 const night=()=>{stadium.update(0,false,true,t);const k=.1+.9*Math.min(1,power().flood*1.15);if(rig){rig.hemisphere.intensity*=k;rig.sun.intensity*=k}scene.environmentIntensity*=k};
 function sound(key,fn){if(sounds.has(key))return;sounds.add(key);try{fn()}catch{}}
 function once(key,fn){if(fired.has(key))return;fired.add(key);fn()}
 function lights(){
  const P=power(),D=decor(),T0=TIMELINE;let sum=0;
  P.towers.forEach((_,i)=>{const s=T0.ignite+i*T0.towers,k=Math.min(1,Math.max(0,(t-s)/.9));let v=smooth(k);if(k>0&&k<1)v*=Math.sin(t*95+i*7)>-.15?1:.25;P.towers[i]=t<s?0:v;sum+=P.towers[i];if(t>=s)sound('tw'+i,()=>{audio.tone(70+i*9,.5,.34,'square',38);audio.noise(.35,.28,3200)})});
  P.flood=Math.max(.04,sum/P.towers.length);P.city=ramp(t,T0.city,T0.city+2.2);P.neon=ramp(t,T0.neon,T0.neon+1.8);
  D.wall=ramp(t,T0.walls,T0.walls+3.2);D.paint=ramp(t,T0.paint,T0.paint+1.8);D.goal=ramp(t,T0.goals,T0.goals+1.4);
  if(t>=T0.neon)sound('sweep',()=>audio.tone(180,3.4,.09,'sawtooth',1700));
  padStates?.forEach((s,i)=>{s.active=t>T0.pads+(i%7)*.13+Math.floor(i/7)*.09});
  pads?.update(padStates,t);
 }
 const WIDE=[
  {t:0,p:[-92,52,108],l:[0,6,10],f:46},{t:3.2,p:[-72,46,86],l:[0,4,6],f:48},{t:6.5,p:[-20,95,52],l:[0,0,6],f:52},
  {t:9.0,p:[30,80,40],l:[0,8,-20],f:50}
 ];
 function aerial(){const k=track(WIDE,t);camera.position.set(...k.p);camera.up.set(0,1,0);camera.lookAt(...k.l);camera.fov=k.f}
 // Cartel de neón con fuegos artificiales (como el cartel OVERTIME del vídeo).
 function signShot(){
  const T0=TIMELINE,k=(t-T0.sign)/(T0.blue-T0.sign);
  camera.position.set(lerp(-6,3,smooth(k)),lerp(8,13,smooth(k)),lerp(-4,-12,smooth(k)));camera.up.set(0,1,0);camera.lookAt(SIGN.x,SIGN.y-1,SIGN.z);camera.fov=lerp(62,54,smooth(k));
  const times=[0,.45,.95,1.4,1.9,2.5,3.1],cols=[[.4,.8,1],[1,.6,.2],[1,1,1],[.5,.9,1],[1,.5,.15],[.7,.8,1],[1,.8,.4]];
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
   camera.position.set(lerp(-1.6,-.4,k),.55,30);camera.up.set(0,1,0);camera.lookAt(3,.7,24);camera.fov=lerp(46,40,k);
  }else{
   const k=(s-half)/(T0.count-T0.octane-half);place(orange,-3,.17+Math.sin(t*2.4)*.01,-22,0);vehicle.setVisible(false,false);
   camera.position.set(lerp(1.2,3.4,k),.8,lerp(-12.5,-13.5,k));camera.up.set(0,1,0);camera.lookAt(-3,.9,-22);camera.fov=lerp(50,44,k);
  }
 }
 // Cuenta atrás 3-2-1 con el balón en el centro y los dos coches esperando.
 function countShot(){
  const T0=TIMELINE,s=t-T0.count,k=s/(T0.kick-T0.count);
  ball.visible=true;ballShadow.visible=true;ball.position.set(0,.9125,0);ballShadow.position.set(0,.015,0);
  vehicle.setVisible(false,false);orange.setVisible(false,false);
  camera.position.set(lerp(-6,6,smooth(k)),lerp(.7,.9,k),lerp(7.5,6.5,k));camera.up.set(0,1,0);camera.lookAt(0,1.2,0);camera.fov=lerp(46,40,k);
  const n=3-Math.floor(s/((T0.kick-T0.count)/3));
  if(n>=1&&n!==lastCount){lastCount=n;count.textContent=n;count.classList.remove('pop');void count.offsetWidth;count.classList.add('pop');audio.tone(n===1?880:660,.35,.28,'sine')}
 }
 // Saque: los dos coches con turbo contra el balón y explosión.
 // ───────── Cinemática guionizada (partido de bienvenida) ─────────
 // Todo está animado por guion: el jugador solo desbloquea cada aviso; no puede desviar coches ni balón.
 const L=(a,b,k)=>a+(b-a)*k,E=smooth,yawOf=(dx,dz)=>Math.atan2(-dx,-dz);
 const clamp01=k=>Math.min(1,Math.max(0,k));
 const frameCars=[];
 const car=(a,x,y,z,yaw,o={})=>{a.root.position.set(x,y,z);a.root.rotation.set(o.pitch||0,yaw,o.roll||0,'YXZ');a.setVisible(true,false);a.flame.visible=!!o.boost;a.update(t);
  if(o.boost){const f=new T.Vector3(0,0,-1).applyEuler(a.root.rotation);frameCars.push({a,state:{slot:a.__slot,team:a.__team,onGround:y<.4,isBoosting:true,isFlipping:false,isDemoed:false,boost:90,position:[x,y,z],velocity:[f.x*30,f.y*30,f.z*30],forward:{x:f.x,y:f.y,z:f.z}}})}};
 const ballAt=(x,y,z,spin=0)=>{ball.visible=true;ballShadow.visible=true;ball.position.set(x,y,z);ball.rotation.set(spin,spin*.6,0);ballShadow.position.set(x,.015,z);ballShadow.material.opacity=.22/(1+y*.15)};
 const cam=(px,py,pz,lx,ly,lz,fov=50)=>{camera.position.set(px,py,pz);camera.up.set(0,1,0);camera.lookAt(lx,ly,lz);camera.fov=fov};
 const chase=(x,y,z,yaw,back,up,ahead,fov=62)=>{const dx=-Math.sin(yaw),dz=-Math.cos(yaw);cam(x-dx*back,y+up,z-dz*back,x+dx*ahead,y+.7,z+dz*ahead,fov)};
 const burst=(key,c,rgb,n,sp,ttl)=>once(key,()=>bursts.add(c,rgb,n,sp,ttl));
 const boom=(key,c,big=1)=>once(key,()=>{bursts.add(c,[1,.72,.28],Math.round(420*big),16*big,1.6);bursts.add(c,[1,1,.9],Math.round(160*big),26*big,.8);audio.noise(1.6,.9,900);audio.tone(55,1,.7,'sine',22);flash.style.transition='none';flash.style.opacity=.85;requestAnimationFrame(()=>{flash.style.transition='opacity .6s';flash.style.opacity=0})});
 const S=[];const sh=(id,dur,run,o={})=>S.push({id,dur,run,...o});
 const dirB=yawOf(0,-1),dirO=yawOf(0,1);
 // Saque y montaje: copia plano a plano del vídeo (19.6–30.6 s).
 const huge=(a,on)=>{a.flame.scale.setScalar(on?3.4:1)};
 const goTxt=()=>once('go',()=>{count.textContent='GO!';count.classList.remove('pop');void count.offsetWidth;count.classList.add('pop');audio.tone(990,.4,.25,'sine')});
 const trail=(key,p,rgb)=>bursts.add(p,rgb,5,1.2,.45);
 // 19.6–20.0 coche azul de lado, de izquierda a derecha.
 sh('k1',.5,(k)=>{const z=L(38,22,k);car(B,-1,.17,z,dirB,{boost:true});ballAt(0,.9125,0);cam(7,.7,30,-1,1,30,50);if(k>.55)goTxt()});
 // 20.1–20.3 coche naranja en primer plano, tres cuartos delantero.
 sh('k2',.3,(k)=>{car(O,0,.17,L(-31,-26,k),dirO+.35,{boost:true});huge(O,false);ballAt(0,.9125,0);cam(3,.75,-21.5,-.5,.6,-28,56)});
 // 20.4–20.8 coche naranja de lado con una llama enorme.
 sh('k3',.5,(k)=>{car(O,0,.17,L(-24,-12,k),dirO,{boost:true});huge(O,true);ballAt(0,.9125,0);cam(8,.6,-18,-1,.9,-18,50)});
 // 20.9–21.5 vista alta del círculo central: dos estelas convergen en el balón.
 sh('k4',.7,(k)=>{huge(O,false);const e=E(k);car(B,L(-26,-3.2,e),.17,L(-9,-1.4,e),yawOf(22.8,7.6),{boost:true});car(O,L(27,3.2,e),.17,L(6,1.2,e),yawOf(-23.8,-4.8),{boost:true});ballAt(0,.9125+Math.sin(k*40)*.015,0,0);cam(0,6.5,10.5,0,0,-1.5,64)});
 // 21.6–21.9 el balón sale disparado hacia la cámara.
 sh('k5',.4,(k)=>{const e=k*k;ballAt(L(0,.4,e),L(.9,2.3,e),L(0,7.2,e),k*18);boom('b0',[0,.9,0],.35);cam(0,2,7.8,0,1,0,58)});
 // 22.0–22.9 a ras de suelo: coche naranja y el balón enorme encima.
 sh('k6',1,(k)=>{car(O,L(-4.8,3.4,k),.17,3.4,yawOf(1,0),{boost:false});ballAt(L(-3.2,-2.4,k),L(3.3,3.1,k),5.6,k*5);cam(0,.8,10.5,1,2,-1,62)});
 // 23.0–23.3 explosión que llena la pantalla.
 sh('k7',.4,(k)=>{ballAt(-3,2.9,5.8,2.5);boom('b1',[3.4,1.1,3.4],1.5);cam(0,.8,10.5,1,2,-1,62)});
 // 23.4–23.9 un coche oscuro vuela del revés por la explosión; humo.
 sh('k8',.6,(k)=>{ballAt(-3.2,L(2.6,1.3,E(k)),L(5.8,6.8,k),2.5+k*3);car(D,L(2,7,k),L(3.8,3.2,k),4.2,yawOf(1,-.4),{roll:Math.PI*.8+k*5,pitch:k*2});burst('sm',[3,1,3],[.45,.42,.4],140,6,1.2);cam(0,.8,10.5,1,2,-1,62)});
 // 24.0–24.3 balón rodando bajo, a la izquierda.
 sh('k9',.4,(k)=>{ballAt(L(-4,-8.5,k),.9125+Math.abs(Math.sin(k*6))*.5,L(2,3,k),k*-7);cam(1,.5,10,-6,1.1,0,56)});
 // 24.4–24.8 un coche naranja avanza hacia la izquierda; otro, pequeño, detrás.
 sh('k10',.5,(k)=>{car(O,L(5,-2,k),.17,-24,yawOf(-1,.18),{boost:true});car(W,L(13,8,k),.17,-27,yawOf(-1,.1),{boost:true});ballAt(14,.9125,-26);cam(1,.7,-18.5,4,1.2,-25,58)});
 // 24.9–25.7 el balón entra botando desde la derecha.
 sh('k11',.9,(k)=>{car(O,L(-2,-8,k),.17,-23,yawOf(-1,.3),{boost:k<.5});car(W,L(7,3,k),.17,-26.5,yawOf(-1,.3));const b=L(15,3,E(k));ballAt(b,.9125+Math.abs(Math.sin(k*7))*2.3*(1-k*.5),L(-24,-17,k),k*-9);cam(1,.7,-18,4,1.3,-24,58)});
 // 25.8–26.7 choque entre coche blanco y oscuro; el naranja vuelca; explosiones.
 sh('k12',.9,(k)=>{const c=clamp01((k-.28)/.3);car(W,L(18,6,E(clamp01(k/.55))),.17+(k>.5?Math.max(0,(k-.5))*5:0),-24,yawOf(-1,.1)+c*1.5,{boost:k<.55,roll:c*2.5});car(D,L(-2,4,k),.17+Math.max(0,Math.sin(clamp01(k/.5)*Math.PI))*3.6,-23,yawOf(1,0),{roll:k*7,pitch:k*3});car(O,L(-11,-16,k),.17+(k>.4?.5:0),L(-22,-27,k),yawOf(-1,.4),{roll:k>.4?Math.PI:0});
   ballAt(L(-3,2,k),.9125+Math.abs(Math.sin(k*5))*1.4,L(-27,-31,k),k*5);if(k>.3)burst('c1',[4.5,1.5,-24],[1,.8,.4],160,8,.8);if(k>.6)boom('b2',[10,1,-38],.8);cam(0,.8,-17.5,3,1.3,-25,60)});
 // 26.8–27.3 cámara pegada a la pared; el Octane azul acelera por el borde.
 sh('k13',.6,(k)=>{car(B,31,.17,L(22,-6,k),dirB,{boost:true});ballAt(0,.9125,-30);cam(35.8,.45,16,31,.9,L(10,-4,k),66)});
 // 27.4–28.1 salto del coche azul al balón en el aire.
 sh('k14',.8,(k)=>{const e=E(k);car(B,L(-9,0,e),L(.17,5.6,e),L(11,-5,e),yawOf(.7,-1),{boost:true,pitch:.38});ballAt(L(-5,-1,e),L(5.8,7,e),L(-5,-9,e),k*8);car(W,L(10,14,k),L(7,10,k),L(-3,-9,k),yawOf(1,-1),{boost:true,pitch:.3});const cx=L(-9,0,e),cz=L(11,-5,e);cam(cx+6,L(.9,4.5,e),cz+7,L(-5,-1,e),L(5.8,7,e),L(-5,-9,e),64)});
 // 28.2–29.0 el balón sale volando; el coche azul cae dando vueltas.
 sh('k15',.9,(k)=>{ballAt(L(-1,13,E(k)),L(7,19,E(k))-k*k*4,L(-9,-30,E(k)),k*14);trail('t',ball.position.toArray(),[.35,.7,1]);car(B,L(-8,-9,k),L(5.2,.5,k*k),L(-5,-4,k),yawOf(1,-1),{roll:k*7,pitch:k*3});if(k<.2)boom('b3',[13,12,-24],.8);cam(L(-2,2,k),L(1,4,k),L(1,-1,k),L(0,6,k),L(5,12,k),-18,64)});
 // 29.1–30.6 coche naranja derrapando de izquierda a derecha; el balón cae hacia la cámara; plano inclinado.
 sh('k16',1.6,(k)=>{camera.up.set(0,1,0);car(O,L(-9,10,k),.17,L(-3,-2.4,k),yawOf(1,0)+.55,{boost:true});ballAt(L(-6.5,-4.2,k),L(8,2.3,E(k)),L(0,5.5,k),k*-8);cam(0,.6,6,0,1.2,-2.5,60);camera.up.set(Math.sin(.17),Math.cos(.17),0);camera.lookAt(0,1.2,-2.5)});
 // ───────── Aviso "PREPÁRATE PARA DEFENDER" (30.7–33.5 s): rótulo plano fijo en pantalla ─────────
 sh('ready',2.8,(k,s)=>{camera.up.set(0,1,0);ballAt(L(2,-3,k),.9125+Math.abs(Math.sin(k*9))*3.2*(1-k*.5),-44,k*6);cam(L(-9,-5,E(k)),L(.55,2.2,E(k)),L(14,28,E(k)),L(-3,-8,E(k)),L(3,6,E(k)),-44,L(48,60,E(k)));ready.classList.toggle('on',k>.04&&k<.97)});
 // 33.5–34.4 entra el coche del jugador por abajo de la cámara.
 sh('arrive',.9,(k)=>{ready.classList.remove('on');car(B,L(-3.2,2.2,E(k)),.17,L(22.5,19.4,E(k)),yawOf(1,-.35)+(1-k)*.3);ballAt(0,.9125,-40);cam(0,.55,25,-4,3.4,-6,56)});
 // AVISO 1 (34.5 s): mantener W — escena oscurecida y casi parada.
 sh('p1',.8,(k)=>{car(B,L(2.2,3.4,k),.17,L(19.4,17.6,k),yawOf(.7,-1));ballAt(0,.9125,-40);cam(0,.55,25,-4,3.4,-6,56)},{prompt:{action:'forward',mode:'hold',text:a=>`Mantén ${a('forward')} para conducir.`}});
 // 36.7–38.9 cámara al pie de la pared azul; el coche se aleja en diagonal.
 sh('d1',2.2,(k)=>{const cx=L(30,23,E(k)),cz=L(17,3,E(k));car(B,cx,.17,cz,yawOf(-1,-1.25),{boost:false});ballAt(0,.9125,-40);cam(cx+6.5,.5,cz+8,cx-3,1.3,cz-7,58)});
 // AVISO 2 (39.0 s): saltar.
 sh('p2',.8,(k)=>{const cx=L(23,21,k),cz=L(3,1.4,k);car(B,cx,.17,cz,yawOf(-1,-1.25));ballAt(0,.9125,-40);cam(cx+6.5,.5,cz+8,cx-3,1.3,cz-7,58)},{prompt:{action:'jump',mode:'press',text:a=>`Pulsa ${a('jump')} para saltar.`}});
 // 40.5–41.6 persecución baja: el coche avanza sobre las franjas azules; el balón bota al fondo.
 sh('d2',1.2,(k)=>{const z=L(1.4,-9,k),x=L(21,18,k);car(B,x,.17,z,yawOf(0,-1)+.1);ballAt(L(15,13,k),.9125+Math.abs(Math.sin(k*5))*2.6,L(-14,-12,k),k*-6);cam(x-3.4,.6,z+7,x+1,1.2,z-10,64)});
 // 41.7–41.9 primer plano: balón a la izquierda, coche abajo.
 sh('d3',.3,(k)=>{car(B,18,.17,L(-9,-8,k),yawOf(0,-1)+.05,{boost:false});ballAt(L(15,14,k),3.2,-14,k*5);cam(14,.7,-1.5,16,1.7,-12,70)});
 // 42.0–43.3 plano lateral junto a una plataforma de turbo: salto del Octane azul.
 sh('d4',1.4,(k)=>{const e=E(k);car(B,L(10,16,e),L(.17,3.3,E(clamp01(k*1.25))),-14,yawOf(1,0),{pitch:.28,boost:true});ballAt(L(13,15,k),4.7,-14.5,k*-2);cam(L(7,9,k),.9,-6.5,L(12,15,k),2.7,-14,60)});
 // 43.4–44.4 cámara a ras de línea de banda frente a la pared de flechas; el balón cae.
 sh('d5',1.1,(k)=>{ballAt(L(39,33,E(k)),L(14,1.2,k*k),-10,k*-12);if(k>.8)car(B,33,.17,L(2,-8,(k-.8)*5),yawOf(0,-1));cam(13,.5,-4,41,6,-10,52)});
 // 44.5–44.7 detrás del coche, sobre el círculo central, con una plataforma hexagonal.
 sh('d6',.3,(k)=>{car(B,0,.17,6.2,dirB);ballAt(2,L(6.5,6,k),-17,k*3);cam(-2.4,.8,10.8,.4,1.6,-6,56)});
 // AVISO 3 (44.8 s): mantener Mayús (turbo).
 sh('p3',.7,(k)=>{car(B,0,.17,L(6.2,5.3,k),dirB);ballAt(1.4,L(5,4.4,k),-20,k*3);cam(-2.4,.8,L(10.2,9.4,k),.4,1.6,-6,56)},{prompt:{action:'boost',mode:'hold',text:a=>`Mantén ${a('boost')} para usar el turbo.`}});
 // 45.8–47.9 persecución con turbo hacia el balón; entran dos rivales por la derecha.
 sh('d7',2.1,(k)=>{const e=k<.28?0:E((k-.28)/.72),z=L(5,-26,e*e*.6+e*.4);car(B,L(0,-.7,k),.17,z,dirB,{boost:k>.28});ballAt(L(1.5,3,k),.9125+Math.abs(Math.sin(k*8))*2.8,L(-28,-34,k),k*-8);
   if(k>.82){car(O,L(19,8,(k-.82)*5.5),.17,-26,yawOf(-1,0),{boost:true});car(W,-14,.17,-27,yawOf(1,-.1))}chase(L(0,-.7,k),.17,z,dirB,5,1.7,14,60)});
 // 48.0–48.3 cámara baja de lado; el coche cruza con una estela larga.
 sh('d8',.4,(k)=>{car(B,L(-3,-13,k),.17,L(-30,-32.5,k),yawOf(-1,-.2),{boost:true});huge(B,true);ballAt(-15,L(5.5,5,k),-37,k*-5);cam(L(1,-5,k),.5,-26,L(-3,-13,k),1,L(-30,-32.5,k),58)});
 // 48.4–50.5 cámara baja mirando la portería naranja; el balón rueda con estela azul.
 sh('d9',2.2,(k)=>{huge(B,false);const e=E(k);ballAt(L(-5,0,e),L(3.4,.9125,e)+Math.abs(Math.sin(k*9))*.7*(1-k),L(-30,-47,e),k*-12);if(k>.55)trail('t2',ball.position.toArray(),[.3,.6,1]);cam(L(10,14,k),.45,L(-27,-24,k),L(-4,0,k),L(2.6,3.2,k),-47,L(62,56,k))});
 // 50.6–51.9 colisión aérea de dos coches junto al balón (a nivel de grada).
 sh('d10',1.4,(k)=>{const e=E(k),c=clamp01((k-.5)/.3);car(O,L(-6,3,e),L(5,9.5,e),-44,yawOf(1,0)+c*2,{boost:k<.55,roll:c*5,pitch:c*2});car(D,L(8,2,e),L(5,8.8,e),-44,yawOf(-1,0)+c*2,{boost:k<.55,roll:-c*5,pitch:c*2});ballAt(L(0,5,k),L(5,13,k),-46,k*7);if(k>.45)boom('b4',[2.5,9,-44],.9);cam(-4,2.6,-34,1,8,-44,62)});
 // 52.0–52.1 plano general desde el centro; entra el coche azul por abajo a la derecha.
 sh('d11',.2,(k)=>{car(B,L(6,5,k),.17,L(14,13.4,k),dirB);ballAt(0,L(7,6,k),-45,k*5);cam(4,.65,16,0,3.3,-30,52)});
 // 52.2–52.9 el coche azul pasa junto a la cámara, de espaldas, hacia la portería.
 sh('d12',.8,(k)=>{const z=L(13.4,2,E(k));car(B,L(5,2,E(k)),.17,z,dirB+.12*(1-k),{boost:false});ballAt(0,L(6,4.5,k),-45,k*5);cam(7.5,1.1,18,0,1.8,-30,56)});
 // 53.0–53.9 acelera y salta cerca de la portería; el balón bota en la línea.
 sh('d13',1,(k)=>{const e=E(k),j=clamp01((k-.45)/.5);car(B,L(2,.4,e),.17+Math.max(0,3*Math.sin(j*Math.PI)),L(2,-27,e),dirB,{boost:k>.1,pitch:-j*.4});ballAt(L(0,1.5,k),.9125+Math.abs(Math.sin(k*5))*3,L(-45,-47,k),k*7);if(k>.8)burst('hit2',[1.5,2.6,-45.5],[.5,.8,1],110,8,.8);chase(L(2,.4,e),.17,L(2,-27,e),dirB,5.2,1.9,12,62)});
 // 54.0–54.1 un coche verde azulado voltea junto al balón.
 sh('d14',.2,(k)=>{car(D,L(3,2,k),L(3.2,3.8,k),-44,yawOf(0,-1),{roll:1+k*3,pitch:.5});ballAt(L(.5,1,k),3,-46,1);cam(0,.8,-22,0,2.8,-46,56)});
 // 54.2–55.0 plano general bajo: el coche azul gira sobre las plataformas; el balón diminuto al fondo.
 sh('d15',.9,(k)=>{car(B,L(-1,5,k),.17,L(-23,-24,k),yawOf(1,-1.2*(1-k)-.1));ballAt(-1,L(5,1.5,k),-45,k*3);cam(-3,.7,-16.5,L(0,5,k),1.2,-30,60)});
 // AVISO 4 (55.1 s): saltar otra vez.
 sh('p4',.7,(k)=>{car(B,L(5,6.2,k),.17,-24.2,yawOf(1,-.8));ballAt(-1,2.5,-45,1);cam(2,.8,-17,8,1.8,-26,58)},{prompt:{action:'jump',mode:'press',text:a=>`Pulsa ${a('jump')} para saltar.`}});
 // 56.0–56.7 el coche salta sobre la plataforma de turbo con fuego trasero.
 sh('d16',.8,(k)=>{const h=Math.max(0,Math.sin(k*Math.PI));car(B,L(6.2,9.5,E(k)),.17+h*1.6,-24.3,yawOf(1,-.6),{boost:k>.45,pitch:-h*.3});ballAt(-1,L(2.5,2,k),-45,1);cam(2,.8,-17,L(8,10,k),1.8,-26,58)});
 // AVISO 5 (56.8 s): voltereta hacia delante (W + espacio).
 sh('p5',.9,(k)=>{car(B,L(9.5,10.6,k),.17+1.4+Math.sin(k*2)*.1,-24.3,yawOf(1,-.9),{pitch:-.15});ballAt(-1,2,-45,1);cam(2,.8,-17,10,2.4,-26,58)},{prompt:{action:'forward',mode:'dodge',text:a=>`Pulsa ${a('forward')} + ${a('jump')} para hacer la voltereta hacia delante.`}});
 // 58.5–58.9 persecución desde detrás: el coche hace la voltereta hacia el balón.
 sh('d17',.5,(k)=>{const e=E(k),z=L(-24.3,-39,e);car(B,L(10.6,3,e),.17+Math.max(0,Math.sin(k*Math.PI))*2.4+1.1*(1-k),z,yawOf(-.35,-1),{pitch:-k*Math.PI*2,boost:true});ballAt(L(-1,0,k),L(2,2.7,k),L(-45,-45,k),k*9);cam(L(16,6,k),1.7,z+9,L(8,2,k),2,L(-34,-45,k),62)});
 // 59.0–59.3 plano lateral a ras de línea de gol: el balón enorme junto al coche azul; el defensor (verde azulado) vuelca dentro de la portería.
 sh('d18',.4,(k)=>{goalword.classList.remove('on','r');car(B,L(6.2,4,k),L(2,1.3,k),L(-45,-47,k),yawOf(-.9,-1),{boost:true,pitch:.3,roll:.3});car(D,L(2.2,3,k),L(2.6,1.9,k),L(-51,-50.8,k),yawOf(-.2,1),{roll:1.6+k*3,pitch:.5});ballAt(L(3.4,1.4,k),L(2.6,2.3,k),L(-45.6,-48.6,k),k*12);cam(16,1.1,-44.5,-1,2.2,-51.5,56)});
 // 59.4–59.7 el balón cruza la línea; el azul cae al césped y el defensor queda dando vueltas en la red.
 sh('d19',.4,(k)=>{car(B,L(4,4.8,k),L(1.2,.45,k),L(-47,-46.2,k),yawOf(-1,-1),{roll:L(.3,2.6,k),pitch:.2});car(D,L(3,2.2,k),L(1.9+Math.sin(k*3)*.5,.9,k),L(-50.8,-51.2,k),yawOf(-.2,1),{roll:4.6+k*3,pitch:.5+k*2});ballAt(L(1.4,0,k),L(2.3,1.3,k),L(-48.6,-52,E(k)),k*10);cam(16,1.1,-44.5,-1,2.2,-51.5,56)});
 // 59.8–60.1 destello blanco y explosión de rayos naranja dentro de la red (el cartel GOAL! detrás).
 sh('d20',.4,(k)=>{goalword.classList.add('on','r');car(B,4.8,.2,-46.2,yawOf(-1,-1),{roll:2.6});car(D,L(2.2,1.6,k),L(.9,2.6,k),-51.3,yawOf(-.2,1),{roll:L(7.6,9.5,k),pitch:L(1.5,3,k)});ballAt(.4,1.2,-52.2,k*10);boom('goal',[.2,1.6,-52.3],2.1);burst('g2',[.2,2,-52],[1,.55,.1],300,18,1.3);cam(16,1.1,-44.5,-1,2.2,-51.5,56)});
 // 60.2–61.1 césped alto en primer plano, frente a la portería: explosión naranja, humo; el coche verde azulado sale lanzado y cae; cartel GOAL! azul a la izquierda.
 sh('d21',1,(k)=>{goalword.classList.remove('r');goalword.classList.add('on');B.setVisible(false,false);car(D,L(1.2,3.5,k),.17+Math.max(0,Math.sin(k*Math.PI*.9))*4.5,L(-51,-48.8,k),yawOf(1,1),{roll:k*7,pitch:k*4});burst('g3',[0,2,-51.5],[.55,.38,.2],260,7,2.2);if(k>.3)burst('g4',[.6,1.4,-50.5],[.4,.36,.34],200,4,2.4);if(k>.6)burst('g5',[-.4,1.2,-50],[.4,.36,.34],160,3,2.2);ballAt(0,-9,0);cam(0,.3,-31,-3,3.2,-52,46)});
 // 61.2–61.6 el coche azul sale de la portería hacia la cámara, a ras de césped; el defensor queda en el suelo.
 sh('end',.55,(k)=>{goalword.classList.add('on');car(D,2,.3,-50.3,yawOf(1,1),{roll:Math.PI*.55,pitch:.2});const z=L(-47,-30.4,k*k*k);car(B,0,.17,z,yawOf(0,1),{boost:false});cam(0,.3,-30,-3,3.2,-52,L(46,60,k*k));ballAt(0,-9,0)});
 const TOTAL_REL=()=>S.reduce((a,b)=>a+b.dur,0);
 let B=null,O=null,D=null,W=null,ready=null,goalword=null;
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
   rate=.06;const d=isDown(p.action),j=isDown('jump');
   if(p.mode==='hold'){held=d?held+dt:0;if(held>.55)release()}
   else if(p.mode==='press'){if(d&&!prevDown[p.action])release()}
   else if(p.mode==='dodge'){if(j&&!prevDown.jump&&isDown('forward'))release()}
   prevDown={[p.action]:d,jump:j,forward:isDown('forward')};
   if(pressedPointer){pressedPointer=false;release()}
  }
  shotT+=dt*rate;const k=clamp01(shotT/s.dur);
  frameCars.length=0;
  [B,O,D,W].forEach(a=>a.setVisible(false,false));ball.visible=true;
  ready.classList.remove('on');goalword.classList.remove('on');
  s.run(k,shotT);camera.updateProjectionMatrix();
  if(shotT>=s.dur&&!waiting)nextShot();
 }
 let pressedPointer=false;
 function release(){waiting=false;promptEl.classList.remove('on');dim.classList.remove('on');sound('ok'+idx,()=>audio.tone(990,.2,.14,'sine'))}
 function endSeq(dt){
  // El coche pasa sobre la cámara → corte a negro → logo.
  endT+=dt;[B,O,D,W].forEach(a=>a.setVisible(false,false));frameCars.length=0;
  black.style.opacity=1;if(endT>.25&&!logo.classList.contains('show')){logo.classList.add('show');sound('logo',()=>{audio.tone(60,1.6,.9,'sine',26);audio.noise(1.3,.5,2600);for(const f of [261.6,392,523.2,784])audio.tone(f,1.8,.09)})}
  if(endT>4.8)finish();
 }
 // ───────── fin guion ─────────
 function start(){
  return new Promise(done=>{
   if(active)return done();
   resolve=done;active=true;t=0;sounds.clear();fired.clear();lastCount=0;root.hidden=false;flash.style.opacity=0;fade.style.opacity=1;fade.style.transition='none';count.classList.remove('pop');
   requestAnimationFrame(()=>root.classList.add('on'));
   savedFov=camera.fov;if(!fans)fans=createFans(scene);stadium.maskCrowd?.([{x:fans.blue.focus.x,z:fans.blue.focus.z,r:12},{x:fans.orange.focus.x,z:fans.orange.focus.z,r:12}]);
   if(!sign)sign=makeSign(scene);if(!bursts)bursts=makeBursts(scene);bursts.hide();sign.visible=true;
   if(!B){B=createVehicle(scene);O=createVehicle(scene);D=createVehicle(scene);W=createVehicle(scene);[[B,0,0],[O,1,1],[D,2,1],[W,3,1]].forEach(([c,sl,tm])=>{c.__slot=sl;c.__team=tm})}
   B.apply(getProfile());O.apply({name:'Rival',body:'octane',color:'#ff8b32'});D.apply({name:'Rival',body:'dominus',color:'#1b2a33'});W.apply({name:'Rival',body:'fennec',color:'#f2f2f2'});
   vehicle=B;orange=O;[B,O,D,W].forEach(c=>c.setVisible(false,false));
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
  fans?.hide();stadium.maskCrowd?.(null);[B,O,D,W].forEach(c=>c?.setVisible(false,false));black.style.opacity=0;logo.classList.remove('show');dim.classList.remove('on');promptEl.classList.remove('on');if(sign)sign.visible=false;bursts?.hide();
  ball.rotation.set(0,0,0);camera.fov=savedFov;camera.updateProjectionMatrix();
  setTimeout(()=>{root.hidden=true},600);root.style.pointerEvents='none';
  const r=resolve;resolve=null;r?.();
 }
 function update(dt){
  if(!active||hold)return;
  t+=dt;const T0=TIMELINE;
  lights();night();
  fade.style.opacity=t<1.6?String(1-ramp(t,.2,1.6)):'0';frameCars.length=0;
  const lvB=t>=T0.blue&&t<T0.orange?1:.12,lvO=t>=T0.orange&&t<T0.octane?1:.12;
  fans.blue.update(t,dt,lvB,t>=T0.blue-.6&&t<T0.orange+.4);fans.orange.update(t,dt,lvO,t>=T0.orange-.6&&t<T0.octane+.4);
  let info=null;
  if(t<T0.sign){aerial();ball.position.y=.9125}
  else if(t<T0.blue)signShot();
  else if(t<T0.orange){fanShot(fans.blue,T0.blue,T0.orange-T0.blue);sound('crowdB',()=>{audio.noise(4.6,.55,1100);audio.tone(220,.9,.08,'triangle',330)})}
  else if(t<T0.octane){fanShot(fans.orange,T0.orange,T0.octane-T0.orange);sound('crowdO',()=>{audio.noise(4.6,.55,1100);audio.tone(262,.9,.08,'triangle',392)})}
  else if(t<T0.count){octaneShot();sound('engine',()=>{audio.tone(55,3.6,.15,'sawtooth',160);audio.noise(3.6,.1,500)})}
  else if(t<T0.kick)countShot();
  else{if(count.classList.contains('pop'))count.classList.remove('pop');script(dt)}
  if(t>=T0.sign&&t<T0.blue+.5){sign.visible=true}else if(t>=T0.blue+.5)sign.visible=false;
  camera.updateProjectionMatrix();
  vfx.begin(dt);for(const f of frameCars)vfx.car(f.state,f.a.root,{localSlot:0,boostRGB:f.a.boostRGB});vfx.update(dt,{streaks:frameCars.some(f=>f.a===B)});
  bursts?.update(dt);
 }
 return{get debug(){return{idx,waiting,id:S[idx]?.id,shotT,endT}},get active(){return active},set hold(v){hold=v},start,update,skip:finish,bindPads(p,states){pads=p;padStates=states},seek(time,step=1/30){if(!active)return;const n=Math.max(0,Math.round((time-t)/step));for(let i=0;i<n;i++)update(step)},get time(){return t}};
}
