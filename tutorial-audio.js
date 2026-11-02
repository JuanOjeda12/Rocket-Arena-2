// Audio del tutorial: reproduce el proyecto hecho en el editor (fragmentos en 2 líneas + efectos) sincronizado con el tiempo de la intro.
// El tiempo del proyecto es relativo al "3" de la cuenta atrás: -19.6 = inicio de la intro, 0 = el 3.
// La intro lo para y lo vuelve a arrancar donde toque cuando el jugador tiene que actuar (se apaga poco a poco al ralentizar y vuelve al cumplir la acción).
const PRE=19.6,MPS=.02;
const clamp01=v=>Math.min(1,Math.max(0,v)),L=(a,b,k)=>a+(b-a)*k,sm=k=>{k=clamp01(k);return k*k*(3-2*k)};
const FXN={lp:20000,hp:20,dist:0,verb:0,rate:1,vol:1};

export function createTutorialAudio(){
 let ctx=null,AU=null,clips=[],fx=[],AB={},END=60,token=0,impulseBuf=null;const rt=new Map();
 const ensure=()=>{if(!ctx)ctx=new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume().catch(()=>{});return ctx};
 function fxVal(t,track){const v={...FXN};
  for(const s of fx){const tg=s.target??'all';if(tg!=='all'&&+tg!==track)continue;const f=Math.max(.02,s.fade??.4),w=sm((t-s.t0)/f)*(1-sm((t-s.t1)/f));if(w<=0)continue;
   v.lp=Math.exp(L(Math.log(v.lp),Math.log(Math.max(40,s.lp)),w));v.hp=Math.exp(L(Math.log(v.hp),Math.log(Math.max(20,s.hp)),w));
   v.dist=L(v.dist,s.dist,w);v.verb=L(v.verb,s.verb,w);v.rate=Math.exp(L(Math.log(v.rate),Math.log(Math.max(.1,s.rate)),w));v.vol=L(v.vol,s.vol,w)}
  return v}
 function rateTable(track){let e=rt.get(track);if(e)return e;const arr=[0],n=Math.ceil((END+PRE+60)/MPS);for(let i=1;i<=n;i++)arr.push(arr[i-1]+fxVal((i-.5)*MPS-PRE,track).rate*MPS);rt.set(track,arr);return arr}
 const Rk=(track,t)=>{const a=rateTable(track),x=Math.max(0,t+PRE)/MPS,i=Math.min(a.length-2,x|0);return L(a[i],a[i+1],x-i)};
 const mediaOf=(c,t)=>c.trimIn+Rk(c.track,t)-Rk(c.track,c.startAt);
 function clipEnd(c){const a=rateTable(c.track),target=Rk(c.track,c.startAt)+c.len;let lo=0,hi=a.length-1;while(lo<hi){const m=(lo+hi)>>1;if(a[m]>=target)hi=m;else lo=m+1}return Math.max(.2,lo*MPS-PRE)}
 function curve(param,fn,t0,t1,when){const n=Math.max(3,Math.ceil((t1-t0)*60)),a=new Float32Array(n);for(let i=0;i<n;i++)a[i]=fn(t0+(t1-t0)*i/(n-1));param.cancelScheduledValues(0);param.setValueAtTime(a[0],0);param.setValueCurveAtTime(a,when,Math.max(.05,t1-t0))}
 function impulse(c){if(impulseBuf&&impulseBuf.sampleRate===c.sampleRate)return impulseBuf;const len=Math.floor(c.sampleRate*1.6),b=c.createBuffer(2,len,c.sampleRate);for(let k=0;k<2;k++){const d=b.getChannelData(k);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.4)}return impulseBuf=b}
 const distCurve=()=>{const n=1024,c=new Float32Array(n),a=25;for(let i=0;i<n;i++)c[i]=Math.tanh(a*(i/(n-1)*2-1))/Math.tanh(a);return c};
 function chain(c,k,master,t0,t1,now){
  const input=c.createGain(),hp=c.createBiquadFilter(),lp=c.createBiquadFilter(),dry=c.createGain(),shG=c.createGain(),sh=c.createWaveShaper(),mix=c.createGain(),conv=c.createConvolver(),vG=c.createGain();
  hp.type='highpass';hp.Q.value=.7;lp.type='lowpass';lp.Q.value=.9;sh.curve=distCurve();sh.oversample='2x';conv.buffer=impulse(c);
  input.connect(hp);hp.connect(lp);lp.connect(dry);lp.connect(shG);shG.connect(sh);sh.connect(mix);dry.connect(mix);mix.connect(master);mix.connect(conv);conv.connect(vG);vG.connect(master);
  curve(hp.frequency,t=>fxVal(t,k).hp,t0,t1,now);curve(lp.frequency,t=>fxVal(t,k).lp,t0,t1,now);curve(dry.gain,t=>1-fxVal(t,k).dist*.85,t0,t1,now);curve(shG.gain,t=>fxVal(t,k).dist*.8,t0,t1,now);curve(vG.gain,t=>fxVal(t,k).verb*.9,t0,t1,now);curve(input.gain,t=>fxVal(t,k).vol,t0,t1,now);
  return input}
 function kill(){token++;if(AU){for(const s of AU.srcs){try{s.stop()}catch{}}try{AU.cs.stop()}catch{}try{AU.master.disconnect()}catch{}AU=null}}
 return{
  get hasAudio(){return clips.length>0&&Object.keys(AB).length>0},
  // project = JSON exportado por el editor; loader(source) -> ArrayBuffer con los bytes del archivo
  async load(project,loader){
   rt.clear();AB={};clips=[];fx=[];END=project?.timeline?.total??60;
   const a=project?.audio;if(!a||!a.clips?.length)return;
   fx=(project.audioFx||[]).map(f=>({t0:f.from,t1:f.to,fade:f.transition??.4,lp:f.lowpassHz,hp:f.highpassHz,dist:f.distortion,verb:f.reverb,rate:f.rate,vol:f.volume,target:f.target||'all'}));
   const c=ensure();
   for(const s of a.sources||[]){try{const bytes=await loader(s);if(bytes)AB[s.id]=await c.decodeAudioData(bytes)}catch(e){console.warn('Audio del tutorial no disponible:',s.file,e)}}
   clips=a.clips.map(k=>({src:k.source,track:(k.line||1)-1,startAt:k.startAt,trimIn:k.sourceFrom||0,len:k.sourceLength,volume:k.volume??1,fadeIn:k.fadeIn||0,fadeOut:k.fadeOut||0}));
  },
  start(tFrom,fadeIn=.4,rate0=1,level0=1){
   kill();if(!clips.length)return;const c=ensure(),now=c.currentTime+.05;
   // el sonido tarda un poco en llegar a los altavoces (más con Bluetooth): se adelanta esa latencia para que coincida con la imagen
   tFrom+=Math.min(.35,(c.outputLatency||0)+(c.baseLatency||0));const tEnd=Math.max(END,tFrom+.5);
   const master=c.createGain();master.connect(c.destination);const cs=c.createConstantSource();cs.offset.value=1200*Math.log2(Math.max(.05,rate0));cs.start();master.gain.setValueAtTime(fadeIn>0&&level0>=1?0:level0,now);if(fadeIn>0&&level0>=1)master.gain.linearRampToValueAtTime(1,now+Math.max(.01,fadeIn));
   const chains=[0,1].map(k=>chain(c,k,master,tFrom,tEnd,now)),srcs=[];
   for(const k of clips){const buf=AB[k.src];if(!buf)continue;const cEnd=clipEnd(k);if(cEnd<=tFrom+.01)continue;
    const tA=Math.max(tFrom,k.startAt),off=mediaOf(k,tA),endM=k.trimIn+k.len;if(off>=endM-.01||off>=buf.duration)continue;
    const src=c.createBufferSource();src.buffer=buf;cs.connect(src.detune);const g=c.createGain();src.connect(g);g.connect(chains[k.track]);const W=now+(tA-tFrom);
    curve(src.playbackRate,t=>fxVal(t,k.track).rate,tA,tEnd,W);
    curve(g.gain,t=>{if(t>cEnd)return 0;const a=k.fadeIn>0?clamp01((t-k.startAt)/k.fadeIn):1,b=k.fadeOut>0?clamp01((cEnd-t)/k.fadeOut):1;return k.volume*a*b},tA,tEnd,W);
    src.start(W,off,Math.max(.01,Math.min(endM,buf.duration)-off));srcs.push(src)}
   AU={srcs,master,cs}},
  // sigue la velocidad y el volumen de la escena (cámara lenta): rate 1 = normal, level 0 = silencio
  follow(rate,level){if(!AU)return;const c=ensure(),now=c.currentTime;AU.cs.offset.cancelScheduledValues(now);AU.cs.offset.setTargetAtTime(1200*Math.log2(Math.max(.05,rate)),now,.04);AU.master.gain.cancelScheduledValues(now);AU.master.gain.setTargetAtTime(Math.max(0,level),now,.04)},
  // se apaga poco a poco (el jugador está a punto de actuar) y al terminar se corta del todo
  fadeOut(sec=1.6){if(!AU)return;const c=ensure(),g=AU.master.gain,now=c.currentTime,my=token;g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);g.linearRampToValueAtTime(0,now+Math.max(.05,sec));setTimeout(()=>{if(my===token)kill()},sec*1000+120)},
  stop:kill
 }}
