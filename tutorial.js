import {logoSVG} from './logo.js?v=rl-20261031';
import {drive,shoot} from './autopilot.js?v=rl-20261031';
// Tutorial interactivo de Rocket Arena: se juega en entrenamiento, de noche, y detecta cada acción del jugador.
const STYLE=`
#tutorial{position:fixed;left:50%;bottom:17%;transform:translateX(-50%);z-index:20;width:min(620px,94vw);pointer-events:none;font-family:Barlow,Arial,sans-serif;color:#e9fbff;text-align:center;transition:opacity .4s}
#tutorial[hidden]{display:none}
#tutorial .card{position:relative;padding:12px 28px 14px;background:linear-gradient(90deg,#0b3b4a00,#0f5a6bcc 18%,#0f5a6bcc 82%,#0b3b4a00);border-top:1px solid #6fe3ff66;border-bottom:1px solid #6fe3ff66;backdrop-filter:blur(3px)}
#tutorial small{display:block;letter-spacing:.34em;font-size:10.5px;color:#9fe9ff;font-weight:700;opacity:.85}
#tutorial h3{margin:3px 0 2px;font:800 15px 'Barlow Condensed',Arial,sans-serif;letter-spacing:.22em;color:#ffd36a}
#tutorial p{margin:0;font-size:21px;line-height:1.3;color:#f3feff;text-shadow:0 2px 10px #000a}
#tutorial kbd{display:inline-block;min-width:26px;padding:0 9px;margin:0 3px;border-radius:3px;background:#e9fbff;color:#06222c;font-weight:800;font-size:17px;box-shadow:0 2px 0 #66aabd}
#tutorial .bar{height:3px;margin:10px auto 0;width:60%;background:#ffffff22;overflow:hidden}
#tutorial .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#3cc8ff,#ffb02e);transition:width .25s}
#tutorial .dots{display:none}
#tutorial .ready{font:600 22px Barlow,Arial,sans-serif;letter-spacing:.12em;color:#8ff0ff;text-shadow:0 0 14px #2fd0ff,0 2px 6px #000}
#tutorial .skip{margin-top:8px;font-size:11px;letter-spacing:.14em;color:#9ccbd8}
#tutorial.ok .card{animation:tutOk .55s}
@keyframes tutOk{0%{filter:brightness(1.9)}100%{filter:none}}
#tutorial-dim{position:fixed;inset:0;z-index:15;pointer-events:none;background:radial-gradient(ellipse at 50% 55%,#00060c55 10%,#00060ccc 100%);opacity:0;transition:opacity .45s}
#tutorial-dim.on{opacity:1}
#tutorial-end{position:fixed;inset:0;z-index:40;background:#000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 1.2s;pointer-events:none}
#tutorial-end.on{opacity:1}#tutorial-end svg{width:min(70vw,780px);height:auto;opacity:0;transform:scale(1.06);transition:opacity 1.2s .9s,transform 4s .9s}
#tutorial-end.on svg{opacity:1;transform:none}
`;
const speedOf=c=>Math.hypot(c.velocity[0],c.velocity[2]);
const dist=(c,p)=>Math.hypot(p[0]-c.position[0],p[2]-c.position[2]);
// El tutorial es una cinemática: el piloto automático conduce y se detiene en cada aviso hasta que el jugador hace la acción.
export class Tutorial{
 constructor(controls){
  this.controls=controls;this.hold=false;this.active=false;this.done=false;this.finishedAt=0;this.timeScale=1;
  if(!document.getElementById('tutorial-style')){const s=document.createElement('style');s.id='tutorial-style';s.textContent=STYLE;document.head.append(s)}
  this.root=document.createElement('div');this.root.id='tutorial';this.root.hidden=true;document.body.append(this.root);
  this.dim=document.createElement('div');this.dim.id='tutorial-dim';document.body.append(this.dim);
 }
 k(a){return `<kbd>${this.controls.label(a)}</kbd>`}
 plan(){
  const k=a=>this.k(a);
  return[
   {id:'ready',kind:'wait',time:3,title:'',text:'PREPÁRATE PARA DEFENDER'},
   {id:'drive',kind:'prompt',title:'ACELERA',text:`Mantén ${k('forward')} para conducir.`,test:(c,s,dt,raw)=>raw.throttle>.5&&speedOf(c)>4?(s.t=(s.t||0)+dt)>.9:(s.t=0,false)},
   {id:'auto1',kind:'auto',target:'ball',stopAt:17,max:9},
   {id:'jump',kind:'prompt',slow:true,title:'SALTA',text:`Pulsa ${k('jump')} para saltar y golpear el balón.`,test:(c)=>!c.onGround},
   {id:'jumpRun',kind:'mix',time:1.8,target:'ball'},
   {id:'auto2',kind:'auto',target:'ball',time:2.4,speed:20},
   {id:'boost',kind:'prompt',slow:true,title:'TURBO',text:`Mantén ${k('boost')} para usar el turbo.`,test:(c,s,dt,raw)=>raw.boost?(s.t=(s.t||0)+dt)>.5:(s.t=0,false)},
   {id:'boostRun',kind:'mix',time:2.6,target:'ball',speed:34},
   {id:'auto3',kind:'auto',target:'ball',stopAt:18,max:6},
   {id:'flip',kind:'prompt',slow:true,title:'VOLTERETA',text:`Pulsa ${k('jump')} y, en el aire, ${k('jump')} otra vez con ${k('forward')} para una voltereta.`,test:(c)=>c.isFlipping},
   {id:'flipRun',kind:'mix',time:2,target:'ball'},
   {id:'shoot',kind:'shoot',max:12,onEnter:'reset'}
  ];
 }
 start(onComplete){
  this.onComplete=onComplete;this.active=true;this.done=false;this.list=this.plan();this.i=-1;this.next();this.root.hidden=false;
 }
 stop(){this.active=false;this.root.hidden=true;this.dim.classList.remove('on');this.timeScale=1}
 next(){
  this.i++;this.t=0;this.state={};const s=this.list[this.i];
  if(!s){this.finish(false);return}
  if(s.onEnter&&this.hooks?.[s.onEnter])this.hooks[s.onEnter]();
  const prompt=s.kind==='prompt'||s.kind==='free'||s.kind==='wait';
  this.timeScale=s.slow?.1:1;this.dim.classList.toggle('on',s.kind==='prompt'||s.kind==='wait');
  if(prompt){this.root.hidden=false;this.root.classList.remove('ok');this.root.innerHTML=s.kind==='wait'?`<div class="ready">${s.text}</div>`:`<div class="card"><h3>${s.title}</h3><p>${s.text}</p><div class="skip">Pulsa <b>ENTER</b> para saltar el tutorial</div></div>`}
  else this.root.hidden=true;
 }
 // Devuelve los controles que debe recibir el coche este fotograma.
 control(raw,car,view,dt){
  if(!this.active||this.done||!car)return raw;
  if(this.hold)return{throttle:0,steer:0,pitch:0,yaw:0,roll:0,jump:false,boost:false,handbrake:false};
  const s=this.list[this.i];if(!s)return raw;this.t+=dt;
  const ball=view.ball.position,target=[ball[0]+(ball[0]<0?9:-9),0,ball[2]];
  if(s.kind==='wait'){if(this.t>s.time)this.next();return{throttle:0,steer:0,pitch:0,yaw:0,roll:0,jump:false,boost:false,handbrake:false}}
  if(s.kind==='prompt'||s.kind==='free'){
   if(s.test(car,this.state,dt,raw,view)){this.root.classList.add('ok');this.next();return raw}
   return raw;
  }
  if(s.kind==='shoot'){if(view.score[car.team]>0||this.t>s.max){this.next();return raw}return shoot(car,ball,0,-60)}
  const auto=drive(car,target[0],target[2],{speed:s.speed??22});
  if(s.kind==='auto'){
   const d=dist(car,target);if((s.stopAt&&d<s.stopAt)||(s.max&&this.t>s.max)||(s.time&&this.t>s.time)){this.next();return auto}
   return auto;
  }
  if(s.kind==='mix'){
   if(this.t>s.time){this.next();return raw}
   const a=drive(car,target[0],target[2],{speed:s.speed??22});
   return{...a,pitch:raw.pitch,yaw:raw.yaw,roll:raw.roll,jump:raw.jump,boost:raw.boost||(s.speed>30&&car.boost>5)};
  }
  return raw;
 }
 finish(skipped){
  if(this.done)return;this.done=true;this.timeScale=1;this.dim.classList.remove('on');this.root.hidden=false;
  this.root.innerHTML=`<div class="card"><small>TUTORIAL</small><h3>${skipped?'TUTORIAL OMITIDO':'¡TUTORIAL COMPLETADO!'}</h3><p>${skipped?'Puedes volver a practicar en Entrenamiento.':'Ya conoces lo básico. ¡Nos vemos en la arena!'}</p></div>`;this.root.classList.add('ok');
  this.finishedAt=performance.now();this.onComplete?.(skipped);if(!skipped)this.endScene();
 }
 endScene(){setTimeout(()=>{const e=document.createElement('div');e.id='tutorial-end';e.innerHTML=logoSVG({id:'end',tagline:true});document.body.append(e);requestAnimationFrame(()=>requestAnimationFrame(()=>e.classList.add('on')));setTimeout(()=>{e.classList.remove('on');setTimeout(()=>e.remove(),1300)},6000)},1800)}
 skip(){if(this.active&&!this.done)this.finish(true)}
 update(){if(this.done&&performance.now()-this.finishedAt>7000)this.stop()}
}
