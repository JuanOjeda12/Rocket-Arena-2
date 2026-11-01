import * as T from './vendor/three.module.js';
import {createFans} from './fans.js?v=rl-20261031';
import {logoSVG} from './logo.js?v=rl-20261031';
import {softGlow} from './boost-visual.js?v=rl-20261031';
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
#intro.logo-on .vignette{background:none}
#intro .logo{position:absolute;left:50%;top:50%;width:min(66vw,900px);transform:translate(-50%,-50%);opacity:0}
#intro .logo svg{display:block;width:100%;height:auto}
#intro .logo.show{animation:introLogo .4s ease-out forwards}
@keyframes introLogo{0%{opacity:0}100%{opacity:1}}
#intro .caption{position:absolute;left:50%;bottom:15vh;transform:translateX(-50%);font-size:clamp(14px,1.7vw,24px);letter-spacing:.6em;font-weight:700;color:#cfe6fa;text-shadow:0 0 18px #2a7bff;opacity:0;transition:opacity .8s}
#intro .skip{position:absolute;right:3vw;bottom:3vh;font-size:13px;letter-spacing:.14em;color:#9fb8cf;opacity:.0;transition:opacity .8s;text-transform:uppercase}
#intro .skip kbd{border:1px solid #9fb8cf88;padding:2px 7px;border-radius:4px;margin-right:6px}
#intro.on .skip{opacity:.8}
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
const TIMELINE={ignite:.9,towers:.62,city:3.1,neon:4.4,walls:4.6,paint:6.2,goals:7.2,pads:7.0,blue:9.8,orange:15.6,car:21.4,end:28.8};
export function createIntro({scene,camera,renderer,stadium,vfx,createVehicle,audio,ball,ballShadow,getProfile,rig}){
 if(!document.getElementById('intro-style')){const s=document.createElement('style');s.id='intro-style';s.textContent=STYLE;document.head.append(s)}
 const root=document.createElement('div');root.id='intro';root.hidden=true;
 root.innerHTML=`<div class="fade"></div><div class="vignette"></div><div class="flash"></div><div class="logo">${logoSVG({id:'intro',tagline:true})}</div><div class="bar top"></div><div class="bar bottom"></div><div class="skip"><kbd>ENTER</kbd> Saltar introducción</div>`;
 document.body.append(root);
 const fade=root.querySelector('.fade'),flash=root.querySelector('.flash'),logo=root.querySelector('.logo');
 let fans=null,vehicle=null,padStates=null,pads=null,t=0,active=false,resolve=null,sounds=new Set(),savedFov=65,carState=null;
 const power=()=>stadium.power,decor=()=>stadium.decorPower;
 // Siempre de noche; mientras no se enciendan los reflectores el estadio queda casi a oscuras.
 const night=()=>{stadium.update(0,false,true,t);const k=.1+.9*Math.min(1,power().flood*1.15);if(rig){rig.hemisphere.intensity*=k;rig.sun.intensity*=k}scene.environmentIntensity*=k};
 function sound(key,fn){if(sounds.has(key))return;sounds.add(key);try{fn()}catch{}}
 function lights(){
  const P=power(),D=decor(),T0=TIMELINE;let sum=0;
  P.towers.forEach((_,i)=>{const s=T0.ignite+i*T0.towers,k=Math.min(1,Math.max(0,(t-s)/.9));let v=smooth(k);if(k>0&&k<1)v*=Math.sin(t*95+i*7)>-.15?1:.25;P.towers[i]=t<s?0:v;sum+=P.towers[i];if(t>=s)sound('tw'+i,()=>{audio.tone(70+i*9,.5,.34,'square',38);audio.noise(.35,.28,3200)})});
  P.flood=Math.max(.04,sum/P.towers.length);P.city=ramp(t,T0.city,T0.city+2.2);P.neon=ramp(t,T0.neon,T0.neon+1.8);
  D.wall=ramp(t,T0.walls,T0.walls+3.2);D.paint=ramp(t,T0.paint,T0.paint+1.8);D.goal=ramp(t,T0.goals,T0.goals+1.4);
  if(t>=T0.neon)sound('sweep',()=>audio.tone(180,3.4,.09,'sawtooth',1700));
  padStates?.forEach((s,i)=>{s.active=t>T0.pads+(i%7)*.13+Math.floor(i/7)*.09});
  pads?.update(padStates,t);
 }
 // Cámara de cada fase.
 const WIDE=[
  {t:0,p:[-92,52,108],l:[0,6,10],f:46},{t:3.2,p:[-72,46,86],l:[0,4,6],f:48},{t:6.5,p:[-20,95,52],l:[0,0,6],f:52},
  {t:9.8,p:[34,112,30],l:[0,0,0],f:50}
 ];
 function aerial(){
  if(t<9.8){const k=track(WIDE,t);camera.position.set(...k.p);camera.up.set(0,1,0);camera.lookAt(...k.l);camera.fov=k.f}
 }
 function fanShot(section,start,len){
  const k=(t-start)/len,e=smooth(Math.min(1,k*2.5)),tn=section.tangent,n=section.normal,c=section.focus;
  const along=lerp(-6,6,smooth(k)),dist=lerp(6.4,5,smooth(k));
  camera.position.copy(c).addScaledVector(tn,along).addScaledVector(n,dist);camera.position.y=c.y+.75+Math.sin(k*3)*.12;
  const look=c.clone().addScaledVector(tn,along*.5+1.2);look.y=c.y+1.9;camera.up.set(0,1,0);camera.lookAt(look);camera.fov=lerp(42,32,smooth(k));
  return e;
 }
 function carShot(){
  const T0=TIMELINE,s=t-T0.car,v=36,z0=48,x0=1.2,camPos=V([-.6,1.1,-24]);
  const travel=z0-v*s,flightStart=(z0-(-4))/v,tau=s-flightStart;let y=.17,pitch=0;
  if(tau>0){y=.17+11.2*tau-9*tau*tau;pitch=-Math.PI*2*Math.min(1,Math.max(0,(tau-.1)/.78))}
  if(y<.17)y=.17;
  const pos=V([x0*(travel+24)/90,y,travel]),q=new T.Quaternion().setFromEuler(new T.Euler(pitch,0,0));
  vehicle.root.position.copy(pos);vehicle.root.quaternion.copy(q);vehicle.setVisible(true,false);vehicle.flame.visible=s>.4&&tau<.2;vehicle.update(t);
  const forward=V([0,0,-1]).applyQuaternion(q);
  carState={slot:0,team:0,onGround:tau<=0,isBoosting:s>.4&&tau<1.0,isFlipping:tau>.1&&tau<.9,isDemoed:false,boost:80,position:pos.toArray(),velocity:[0,tau>0?11.2-18*tau:0,-v],forward:{x:forward.x,y:forward.y,z:forward.z}};
  // La cámara espera a ras de suelo y sigue al coche hasta que pasa por encima.
  const dist=Math.abs(pos.z-camPos.z),near=Math.max(0,1-dist/30),shake=near*near*.06;
  camera.position.set(camPos.x+(Math.random()-.5)*shake,camPos.y+(Math.random()-.5)*shake,camPos.z);
  const look=pos.clone();camera.up.set(0,1,0);camera.lookAt(look);
  camera.fov=lerp(46,92,Math.pow(near,1.6));
  const pass=flightStart+(-4-(-24))/v;// instante en que cruza la cámara
  return{pass:T0.car+(z0-(-24))/v};
 }
 function start(){
  return new Promise(done=>{
   if(active)return done();
   resolve=done;active=true;t=0;sounds.clear();root.hidden=false;logo.classList.remove('show');root.classList.remove('logo-on');flash.style.opacity=0;fade.style.opacity=1;root.querySelector('.fade').style.transition='none';
   requestAnimationFrame(()=>root.classList.add('on'));
   savedFov=camera.fov;if(!fans)fans=createFans(scene);stadium.maskCrowd?.([{x:fans.blue.focus.x,z:fans.blue.focus.z,r:12},{x:fans.orange.focus.x,z:fans.orange.focus.z,r:12}]);
   if(!vehicle){vehicle=createVehicle(scene)}vehicle.apply(getProfile());vehicle.setVisible(false,false);
   ball.visible=true;ball.position.set(0,.9125,0);ballShadow.visible=true;ballShadow.position.set(0,.015,0);ballShadow.material.opacity=.22;
   const keyHandler=e=>{if(!active)return;if(['Enter','Escape','Space'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();finish()}};
   start.keyHandler=keyHandler;addEventListener('keydown',keyHandler,true);
   root.style.pointerEvents='auto';root.onclick=()=>finish();
  });
 }
 function finish(){
  if(!active)return;active=false;root.classList.remove('on');removeEventListener('keydown',start.keyHandler,true);
  const P=power(),D=decor();P.towers.fill(1);P.flood=P.city=P.neon=1;D.wall=D.paint=D.goal=1;
  fans?.hide();stadium.maskCrowd?.(null);if(vehicle)vehicle.setVisible(false,false);camera.fov=savedFov;camera.updateProjectionMatrix();
  setTimeout(()=>{root.hidden=true;logo.classList.remove('show')},600);root.style.pointerEvents='none';
  const r=resolve;resolve=null;r?.();
 }
 function update(dt){
  if(!active)return;
  t+=dt;const T0=TIMELINE;
  lights();night();
  // Fundido inicial y final.
  fade.style.opacity=t<1.6?String(1-ramp(t,.2,1.6)):t>T0.end-1.2?String(ramp(t,T0.end-1.2,T0.end)):'0';
  const lvB=t>=T0.blue&&t<T0.orange?1:.12,lvO=t>=T0.orange&&t<T0.car?1:.12;
  fans.blue.update(t,dt,lvB,t>=T0.blue-.6&&t<T0.orange+.4);fans.orange.update(t,dt,lvO,t>=T0.orange-.6&&t<T0.car+.4);
  let carInfo=null;
  if(t<T0.blue){aerial();ball.position.y=.9125}
  else if(t<T0.orange){fanShot(fans.blue,T0.blue,T0.orange-T0.blue);sound('crowdB',()=>{audio.noise(4.6,.55,1100);audio.tone(220,.9,.08,'triangle',330)})}
  else if(t<T0.car){fanShot(fans.orange,T0.orange,T0.car-T0.orange);sound('crowdO',()=>{audio.noise(4.6,.55,1100);audio.tone(262,.9,.08,'triangle',392)})}
  else{carInfo=carShot();sound('engine',()=>{audio.tone(55,3.6,.2,'sawtooth',260);audio.noise(3.6,.16,500)})}
  camera.updateProjectionMatrix();
  vfx.begin(dt);if(carInfo&&carState)vfx.car(carState,vehicle.root,{localSlot:0,boostRGB:vehicle.boostRGB});vfx.update(dt,{streaks:!!carInfo});
  if(carInfo){
   const pass=carInfo.pass,since=t-pass;
   if(since>-.25)sound('whoosh',()=>{audio.noise(1.4,.7,3600);audio.tone(300,.9,.18,'sawtooth',60)});
   flash.style.opacity='0';
   if(since>=.12&&t<T0.end){if(since<.5||true){fade.style.transition='none';fade.style.opacity=1}if(!logo.classList.contains('show')){logo.classList.add('show');root.classList.add('logo-on');sound('logo',()=>{audio.tone(60,1.6,.9,'sine',26);audio.noise(1.3,.5,2600);for(const f of [261.6,392,523.2,784])audio.tone(f,1.8,.09)})}}
  }
  if(t>=T0.end)finish();
 }
 return{get active(){return active},start,update,skip:finish,bindPads(p,states){pads=p;padStates=states},seek(time,step=1/30){if(!active)return;const n=Math.max(0,Math.round((time-t)/step));for(let i=0;i<n;i++)update(step)},get time(){return t}};
}
