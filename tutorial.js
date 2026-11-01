// Tutorial interactivo de Rocket Arena: se juega en entrenamiento, de noche, y detecta cada acción del jugador.
const STYLE=`
#tutorial{position:fixed;top:112px;left:50%;transform:translateX(-50%);z-index:20;width:min(560px,92vw);pointer-events:none;font-family:Barlow,Arial,sans-serif;color:#eef7fd;text-align:center;transition:opacity .4s}
#tutorial[hidden]{display:none}
#tutorial .card{background:linear-gradient(180deg,#0a1b2cd9,#06111ee6);border:1px solid #4fb8ff55;border-top:3px solid #4fb8ff;border-radius:6px;padding:14px 22px 16px;box-shadow:0 12px 40px #0009,0 0 40px #2a7bff22 inset;backdrop-filter:blur(6px)}
#tutorial small{display:block;letter-spacing:.32em;font-size:11px;color:#79c8ff;font-weight:700}
#tutorial h3{margin:6px 0 4px;font:italic 800 30px 'Barlow Condensed',Arial,sans-serif;letter-spacing:.08em;color:#fff;text-shadow:0 0 18px #2a7bff}
#tutorial p{margin:0;font-size:17px;line-height:1.4;color:#d4e6f4}
#tutorial kbd{display:inline-block;min-width:26px;padding:1px 9px;margin:0 2px;border-radius:4px;background:#e9f4fc;color:#07182a;font-weight:800;font-size:15px;box-shadow:0 2px 0 #7da3c0}
#tutorial .bar{height:5px;margin-top:12px;background:#ffffff1c;border-radius:3px;overflow:hidden}
#tutorial .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#3cc8ff,#ffb02e);transition:width .25s}
#tutorial .dots{display:flex;gap:6px;justify-content:center;margin-top:10px}
#tutorial .dots b{width:22px;height:4px;border-radius:2px;background:#ffffff26}
#tutorial .dots b.done{background:#ffb02e}#tutorial .dots b.now{background:#4fb8ff}
#tutorial .skip{margin-top:10px;font-size:12px;letter-spacing:.12em;color:#8fa9bd}
#tutorial.ok .card{border-top-color:#ffb02e;animation:tutOk .5s}
@keyframes tutOk{0%{transform:scale(1.07);box-shadow:0 0 60px #ffb02eaa}100%{transform:none}}
`;
const speedOf=c=>Math.hypot(c.velocity[0],c.velocity[2]);
export class Tutorial{
 constructor(controls){
  this.controls=controls;this.active=false;this.index=0;this.progress=0;this.finishedAt=0;
  if(!document.getElementById('tutorial-style')){const s=document.createElement('style');s.id='tutorial-style';s.textContent=STYLE;document.head.append(s)}
  this.root=document.createElement('div');this.root.id='tutorial';this.root.hidden=true;document.body.append(this.root);
 }
 key(a){return `<kbd>${this.controls.label(a)}</kbd>`}
 steps(){
  const k=a=>this.key(a);
  return[
   {id:'drive',title:'ACELERA',text:`Mantén ${k('forward')} para avanzar. ${k('back')} para retroceder.`,need:1.2,test:(c,s,dt)=>speedOf(c)>7?dt:0},
   {id:'turn',title:'GIRA',text:`Usa ${k('left')} y ${k('right')} para girar y recorrer la cancha.`,need:1.9,test:(c,s,dt)=>{const f=c.forward,prev=s.prev;s.prev=Math.atan2(f.x,f.z);return prev===undefined||!c.onGround?0:Math.abs(Math.atan2(Math.sin(s.prev-prev),Math.cos(s.prev-prev)))}},
   {id:'boost',title:'TURBO',text:`Mantén ${k('boost')} para usar el turbo. Gastará tu barra de boost.`,need:1.4,test:(c,s,dt)=>c.isBoosting?dt:0},
   {id:'pads',title:'RECOGE BOOST',text:`Pasa sobre las almohadillas naranjas del suelo para recargar el turbo. Las grandes dan 100.`,need:14,test:(c,s)=>{if(s.last===undefined)s.last=c.boost;const gain=Math.max(0,c.boost-s.last);s.last=c.boost;return gain>1?gain:0}},
   {id:'jump',title:'SALTA',text:`Pulsa ${k('jump')} para saltar.`,need:1,test:(c)=>c.onGround?0:1},
   {id:'flip',title:'VOLTERETA',text:`Salta y pulsa ${k('jump')} otra vez mientras mantienes ${k('forward')} (o ${k('left')}/${k('right')}) para hacer una voltereta.`,need:1,test:(c)=>c.isFlipping?1:0},
   {id:'ball',title:'GOLPEA EL BALÓN',text:`Acércate al balón y golpéalo. ¡Usa el turbo para llegar antes!`,need:1,test:(c)=>c.ballTouchAge>=0&&c.ballTouchAge<.25?1:0},
   {id:'goal',title:'¡MARCA UN GOL!',text:`Lleva el balón a la portería rival. Los goles azules se marcan en la portería naranja.`,need:1,test:(c,s,dt,b)=>b.score[c.team]>0?1:0}
  ];
 }
 start(onComplete){
  this.onComplete=onComplete;this.active=true;this.index=0;this.progress=0;this.state={};this.list=this.steps();this.done=false;this.root.hidden=false;this.root.classList.remove('ok');this.render();
 }
 stop(){this.active=false;this.root.hidden=true}
 render(){
  const s=this.list[this.index],dots=this.list.map((_,i)=>`<b class="${i<this.index?'done':i===this.index?'now':''}"></b>`).join('');
  this.root.innerHTML=`<div class="card"><small>TUTORIAL · PASO ${this.index+1} DE ${this.list.length}</small><h3>${s.title}</h3><p>${s.text}</p><div class="bar"><i style="width:${Math.min(100,this.progress/s.need*100)}%"></i></div><div class="dots">${dots}</div><div class="skip">Pulsa <b>T</b> para saltar el tutorial · <b>ESC</b> para el menú</div></div>`;
 }
 finish(skipped){
  if(this.done)return;this.done=true;
  this.root.innerHTML=`<div class="card"><small>TUTORIAL</small><h3>${skipped?'TUTORIAL OMITIDO':'¡TUTORIAL COMPLETADO!'}</h3><p>${skipped?'Puedes volver a practicar en Entrenamiento.':'Ya conoces lo básico. ¡Nos vemos en la arena!'}</p></div>`;this.root.classList.add('ok');
  this.finishedAt=performance.now();this.onComplete?.(skipped);
 }
 skip(){if(this.active&&!this.done)this.finish(true)}
 update(car,view,dt,running){
  if(!this.active)return;
  if(this.done){if(performance.now()-this.finishedAt>7000){this.stop()}return}
  if(!car||!running)return;
  const step=this.list[this.index],amount=step.test(car,this.state,dt,view)||0;
  if(amount>0){this.progress+=amount;if(this.progress>=step.need){this.root.classList.add('ok');this.index++;this.progress=0;this.state={};setTimeout(()=>this.root.classList.remove('ok'),500);if(this.index>=this.list.length){this.finish(false);return}}this.render()}
 }
}
