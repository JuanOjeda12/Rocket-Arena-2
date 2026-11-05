// Explosiones de gol. Cada estilo es una "receta" que reparte partículas (chispas, niebla, confeti, farolillos, monedas...) con trayectorias analíticas,
// más anillos, flashes, textos y, en los estilos más raros, elementos propios (rayos, dragón, agujero negro).
import {itemById} from './item-catalog.js?v=final2';
import * as T from './vendor/three.module.js';
import {softGlow} from './boost-visual.js?v=final2';
import {createSoftPoints} from './fx-points.js';
const WHITE=new T.Color(1,1,1),BLACK=new T.Color(0,0,0),UP=new T.Vector3(0,1,0);
const rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const pick=list=>list[Math.floor(Math.random()*list.length)];
const tone=(color,amount)=>{const c=new T.Color(color);return amount>=0?c.lerp(WHITE,amount):c.lerp(BLACK,-amount)};
const shift=(color,dh,s=1,l=null)=>{const h={};new T.Color(color).getHSL(h);return new T.Color().setHSL((h.h+dh+1)%1,Math.min(1,h.s*s),l??h.l)};
const sphere=()=>{const z=rnd(-1,1),a=rnd(Math.PI*2),r=Math.sqrt(1-z*z);return[Math.cos(a)*r,Math.sin(a)*r,z]};
const cone=spread=>{const t=spread*Math.sqrt(Math.random()),a=rnd(Math.PI*2);return[Math.sin(t)*Math.cos(a),Math.sin(t)*Math.sin(a),Math.cos(t)]};
const DRAGON_SEGMENTS=110,SPARK=3,MIST=1.7,MESH=1.8,CAP={heart:170,bat:130,gear:90,balloon:90,quad:380,cube:260,coin:130,shard:300,lantern:90,bubble:200,star:180};
const star=(()=>{const s=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?.22:.5;i?s.lineTo(Math.cos(a)*r,Math.sin(a)*r):s.moveTo(Math.cos(a)*r,Math.sin(a)*r)}return new T.ShapeGeometry(s)})();
const lantern=new T.CylinderGeometry(.36,.27,.72,4);lantern.rotateY(Math.PI/4);
const heartShape=(()=>{const s=new T.Shape();s.moveTo(0,-.42);s.bezierCurveTo(-.7,.05,-.45,.55,0,.22);s.bezierCurveTo(.45,.55,.7,.05,0,-.42);return new T.ShapeGeometry(s)})();
const batShape=(()=>{const s=new T.Shape(),right=[[0,.14],[.1,.24],[.2,.14],[.5,.3],[.44,.06],[.52,-.06],[.34,-.03],[.3,-.15],[.16,-.05],[.07,-.12],[0,-.2]];right.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));[...right].reverse().forEach(([x,y])=>s.lineTo(-x,y));return new T.ShapeGeometry(s)})();
const gearGeometry=(()=>{const s=new T.Shape(),teeth=10;for(let i=0;i<teeth*4;i++){const a=i/(teeth*4)*Math.PI*2,out=i%4===1||i%4===2,q=out?.5:.38;i?s.lineTo(Math.cos(a)*q,Math.sin(a)*q):s.moveTo(Math.cos(a)*q,Math.sin(a)*q)}const hole=new T.Path();hole.absarc(0,0,.14,0,Math.PI*2,true);s.holes.push(hole);return new T.ShapeGeometry(s)})();
const balloonGeometry=new T.SphereGeometry(.4,14,10);balloonGeometry.scale(1,1.22,1);
const family=f=>f.variant?()=>shift(f.c.base,rnd(-.06,.06),1,rnd(.45,.72)):()=>new T.Color().setHSL(Math.random(),.9,.62);
const GEO={heart:heartShape,bat:batShape,gear:gearGeometry,balloon:balloonGeometry,quad:new T.PlaneGeometry(.5,.34),cube:new T.BoxGeometry(.4,.4,.4),coin:new T.CylinderGeometry(.34,.34,.07,16),shard:new T.OctahedronGeometry(.3),lantern,bubble:new T.SphereGeometry(.4,10,8),star};
const textures=new Map();
function textTexture(key,draw,w=1024,h=384,nearest=false){if(textures.has(key))return textures.get(key);const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d'),w,h);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;if(nearest){tex.magFilter=tex.minFilter=T.NearestFilter;tex.generateMipmaps=false}textures.set(key,tex);return tex}
const bigText=(text,{top,mid,bottom,stroke,glow,font='900 190px Impact, "Arial Black", sans-serif',lineWidth=26})=>(c,w,h)=>{c.textAlign='center';c.textBaseline='middle';c.font=font;c.lineJoin='round';c.shadowColor=glow;c.shadowBlur=36;c.lineWidth=lineWidth;c.strokeStyle=stroke;c.strokeText(text,w/2,h/2);c.shadowBlur=0;const g=c.createLinearGradient(0,h*.2,0,h*.8);g.addColorStop(0,top);g.addColorStop(.5,mid);g.addColorStop(1,bottom);c.fillStyle=g;c.fillText(text,w/2,h/2);c.globalCompositeOperation='source-atop';c.fillStyle='#ffffff55';c.fillRect(0,h*.28,w,h*.07)};
function splatTexture(key,fill,edge,spikes=14){return textTexture('splat-'+key,(c,w,h)=>{const cx=w/2,cy=h/2,pts=[];for(let i=0;i<spikes*2;i++){const a=i/(spikes*2)*Math.PI*2,long=i%2===0,hash=Math.abs(Math.sin(i*12.9898+spikes)*43758.5453)%1,r=(long?.62+hash*.34:.3+hash*.12)*w/2;pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r])}
 c.beginPath();pts.forEach(([x,y],i)=>{const [px,py]=pts[(i+pts.length-1)%pts.length],mx=(x+px)/2,my=(y+py)/2;i?c.quadraticCurveTo(px*.5+mx*.5,py*.5+my*.5,x,y):c.moveTo(x,y)});c.closePath();c.fillStyle=fill;c.fill();c.lineWidth=14;c.strokeStyle=edge;c.stroke();
 const g=c.createRadialGradient(cx-w*.1,cy-h*.12,10,cx,cy,w*.4);g.addColorStop(0,'#ffffff99');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.beginPath();c.arc(cx,cy,w*.4,0,7);c.fill();
 for(let i=0;i<14;i++){const a=i*.9+1,r=w*(.42+Math.abs(Math.sin(i*3.1))*.08);c.fillStyle=fill;c.beginPath();c.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,6+i%4*4,0,7);c.fill()}},512,512)}
const DEFAULTS={x0:0,y0:0,z0:0,vx:0,vy:0,vz:0,d:0,g:0,sw:0,wob:0,wf:3,ph:0,delay:0,life:2,s0:1,s1:1,sx:1,sy:1,rx:0,ry:0,rz:0,vrx:0,vry:0,vrz:0,a:1,floor:null,mode:0,tc:1,fadeIn:.06,fadeOut:.25,tw:0,align:false};
// Parámetros comunes de cada estilo: duración, anillos de onda [retraso, velocidad], destello, luz, y la función que reparte las partículas.
const STYLES={
 standard:{dur:2.6,rings:[[0,12],[.12,8]],light:140,build(f){const {base,light}=f.c,dir=f.dir;
  for(let i=0;i<340;i++){const [x,y,z]=cone(1.2),v=rnd(7,27);f.add('spark',{c:tone(base,rnd(.0,.7)),vx:x*v,vy:y*v+3,vz:z*v*dir,d:1.1,g:5,life:rnd(1.2,2.4),s0:rnd(.25,.55),s1:.05})}
  for(let i=0;i<46;i++){const [x,y,z]=cone(1.0),v=rnd(14,30);f.add('shard',{c:light,vx:x*v,vy:y*v,vz:z*v*dir,d:.9,g:3,align:true,life:rnd(.7,1.3),s0:rnd(.22,.4),s1:.02,sy:2.6})}
  for(let i=0;i<14;i++)f.add('mist',{c:base,y0:rnd(-1,1),x0:rnd(-2,2),vz:dir*rnd(1,5),life:rnd(1,1.6),s0:3,s1:10,a:.32})}},
 frost:{dur:3.1,rings:[[0,10],[.14,7],[.3,5]],light:120,build(f){const {base,light}=f.c;
  for(let i=0;i<160;i++){const [x,y,z]=sphere(),v=rnd(5,18);f.add('shard',{c:tone(base,rnd(.2,.8)),vx:x*v,vy:y*v+2,vz:z*v*.8+f.dir*4,d:1.4,g:1.6,life:rnd(1.8,2.9),s0:rnd(.35,.8),s1:.1,sy:1.7,vrx:rnd(-4,4),vry:rnd(-4,4),vrz:rnd(-5,5)})}
  for(let i=0;i<30;i++){const [x,y,z]=sphere(),v=rnd(3,10);f.add('star',{c:light,vx:x*v,vy:y*v+1.5,vz:z*v+f.dir*3,d:.9,g:.4,life:rnd(2,3),s0:rnd(.7,1.5),s1:.2,vrz:rnd(-2,2),tw:8})}
  for(let i=0;i<280;i++){const [x,y,z]=sphere(),v=rnd(2,13);f.add('spark',{c:tone(base,rnd(.55,1)),vx:x*v,vy:y*v,vz:z*v+f.dir*3,d:.8,g:.7,wob:.5,life:rnd(2,3),s0:rnd(.12,.3),s1:.04,tw:9})}
  for(let i=0;i<10;i++)f.add('mist',{c:base,x0:rnd(-3,3),y0:rnd(-1,2),vz:f.dir*rnd(1,4),life:1.5,s0:3,s1:9,a:.25})}},
 wave:{dur:2.9,rings:[[0,9],[.18,9],[.36,9],[.54,9],[.72,9]],light:110,build(f){const {base,light}=f.c;
  for(let i=0;i<260;i++){const a=rnd(Math.PI*2),v=rnd(4,17);f.add('spark',{c:tone(base,rnd(0,.6)),vx:Math.cos(a)*v,vy:Math.sin(a)*v*.7+rnd(2,8),vz:f.dir*rnd(1,9),d:1,g:6,delay:rnd(0,.45),life:rnd(1.2,2.2),s0:rnd(.18,.4),s1:.05})}
  for(let i=0;i<60;i++){const a=rnd(Math.PI*2),v=rnd(5,12);f.add('shard',{c:light,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.6+4,vz:f.dir*rnd(2,9),d:.9,g:5,life:rnd(1.2,2),s0:rnd(.3,.6),s1:.05,sy:1.8,vrx:3,vrz:4})}
  for(let i=0;i<6;i++)f.add('mist',{c:base,delay:i*.18,vz:f.dir*2,life:1,s0:2,s1:12,a:.22})}},
 solar:{dur:3.1,rings:[[0,18],[.1,13],[.25,9]],light:220,flicker:true,build(f){const {base}=f.c,fire=[tone(base,.25),base,shift(base,-.04,1,.5),shift(base,-.08,1,.35)];
  for(let i=0;i<26;i++)f.add('mist',{c:pick(fire),x0:rnd(-2,2),y0:rnd(-1,2),vx:rnd(-4,4),vy:rnd(0,6),vz:f.dir*rnd(1,9),d:.8,sw:rnd(-.8,.8),life:rnd(1.2,2.1),s0:2,s1:rnd(9,14),a:.38,delay:rnd(0,.25)});
  for(let i=0;i<400;i++){const [x,y,z]=cone(1.35),v=rnd(5,26);f.add('spark',{c:pick(fire),vx:x*v,vy:y*v+2,vz:z*v*f.dir,d:.7,g:4,life:rnd(1.5,3),s0:rnd(.15,.45),s1:.04,tw:12})}
  for(let i=0;i<54;i++){const [x,y,z]=cone(1.1),v=rnd(9,22);f.add('shard',{c:pick(fire),vx:x*v,vy:y*v,vz:z*v*f.dir,d:.8,g:7,align:true,life:rnd(.9,1.7),s0:rnd(.25,.5),s1:.03,sy:2})}}},
 galaxy:{dur:3.5,rings:[[0,7],[.3,5]],light:150,build(f){const {base,comp}=f.c,pal=[base,tone(base,.5),comp,shift(base,.08,1,.7),WHITE];
  for(let i=0;i<430;i++){const a=rnd(Math.PI*2),v=rnd(2,15);f.add('spark',{c:pick(pal),vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:f.dir*rnd(.5,6),d:.55,sw:rnd(1.1,1.8),life:rnd(2.2,3.3),s0:rnd(.12,.34),s1:.03,tw:7,ph:rnd(6)})}
  for(let i=0;i<40;i++){const a=rnd(Math.PI*2),v=rnd(2,12);f.add('star',{c:pick(pal),vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:f.dir*rnd(1,6),d:.5,sw:1.4,life:rnd(2.4,3.4),s0:rnd(.3,.9),s1:.1,vrz:rnd(-2,2),tw:9,ph:rnd(6)})}
  for(let i=0;i<18;i++)f.add('mist',{c:i%2?base:comp,vx:rnd(-3,3),vy:rnd(-3,3),vz:f.dir*rnd(1,5),sw:1.2,life:rnd(2,3),s0:2.5,s1:10,a:.2,delay:rnd(0,.5)})}},
 confetti:{dur:3.7,rings:[[0,9]],light:80,build(f){const {base}=f.c,tinted=f.variant,col=()=>tinted?shift(base,rnd(-.08,.08),1,rnd(.45,.75)):new T.Color().setHSL(Math.random(),.95,.6);
  for(let i=0;i<300;i++){const [x,y,z]=cone(1.35),v=rnd(6,23);f.add('quad',{c:col(),vx:x*v,vy:y*v+4,vz:z*v*f.dir,d:1.6,g:3.2,wob:1.2,wf:rnd(3,7),ph:rnd(6),vrx:rnd(-9,9),vry:rnd(-9,9),vrz:rnd(-6,6),life:rnd(2.4,3.5),s0:rnd(.5,1),s1:.9,fadeOut:.15})}
  for(let i=0;i<22;i++){const [x,y,z]=cone(1.2),v=rnd(9,20);f.add('quad',{c:col(),vx:x*v,vy:y*v+3,vz:z*v*f.dir,d:1.5,g:2.6,wob:1.6,wf:4,ph:rnd(6),vrz:rnd(-3,3),vrx:rnd(4,9),sx:.35,sy:5,life:rnd(2.3,3.2),s0:1,s1:1})}
  for(let i=0;i<90;i++){const [x,y,z]=cone(1.4),v=rnd(4,18);f.add('spark',{c:col(),vx:x*v,vy:y*v+3,vz:z*v*f.dir,d:1.1,g:3,life:rnd(1.4,2.6),s0:rnd(.15,.3),s1:.04,tw:14})}}},
 fireworks:{dur:3.6,rings:[],light:90,pulses:[.4,.8,1.15,1.5,1.9],build(f){const {base,comp,light}=f.c,pal=[base,light,comp,WHITE,shift(base,.12,1,.6)],bursts=[[0,0],[.4,1],[.8,2],[1.15,3],[1.5,4],[1.9,1]];
  bursts.forEach(([delay,k],n)=>{const cx=rnd(-10,10),cy=rnd(3.5,9.5),cz=f.dir*rnd(3,15),tint=[pal[k%5],pal[(k+2)%5]];
   f.add('spark',{c:WHITE,x0:cx,y0:-2.4,z0:cz,vy:(cy+2.4)/.38,delay:Math.max(0,delay-.38),life:.38,s0:.35,s1:.2,fadeIn:.02,fadeOut:.1});
   for(let j=0;j<5;j++)f.add('spark',{c:tone(base,.5),x0:cx,y0:-2.4,z0:cz,vy:(cy+2.4)/.38,delay:Math.max(0,delay-.38)+j*.035,life:.25,s0:.22-j*.03,s1:.02});
   for(let j=0;j<92;j++){const [x,y,z]=sphere(),v=rnd(5.5,10);f.add('spark',{c:pick(tint),x0:cx,y0:cy,z0:cz,vx:x*v,vy:y*v,vz:z*v,d:1.9,g:3.4,delay,life:rnd(1.3,1.9),s0:rnd(.2,.42),s1:.03,tw:16})}
   for(let j=0;j<26;j++){const [x,y,z]=sphere(),v=rnd(2,5);f.add('spark',{c:WHITE,x0:cx,y0:cy,z0:cz,vx:x*v,vy:y*v,vz:z*v,d:1.5,g:2,delay,life:rnd(.8,1.2),s0:.25,s1:.03})}
   f.add('star',{c:WHITE,x0:cx,y0:cy,z0:cz,delay,life:.3,s0:1.5,s1:5,vrz:2});f.add('mist',{c:pick(tint),x0:cx,y0:cy,z0:cz,delay,life:.5,s0:2,s1:9,a:.5})})}},
 bubbles:{dur:3.3,rings:[[0,8]],light:80,build(f){const {base,light}=f.c;
  for(let i=0;i<130;i++)f.add('bubble',{c:tone(base,rnd(.4,.85)),x0:rnd(-6,6),y0:rnd(-2,3),z0:f.dir*rnd(-1,4),vx:rnd(-3,3),vy:rnd(2,8),vz:f.dir*rnd(1,10),d:.6,g:-.9,wob:rnd(.3,1.1),wf:rnd(2,5),ph:rnd(6),delay:rnd(0,.5),life:rnd(1.7,3),s0:rnd(.4,1.5),s1:1.7,fadeOut:.12});
  for(let i=0;i<170;i++){const [x,y,z]=sphere(),v=rnd(2,13);f.add('spark',{c:i%3?light:WHITE,vx:x*v,vy:y*v+2,vz:z*v+f.dir*4,d:1,g:-.2,life:rnd(1.4,2.6),s0:rnd(.1,.25),s1:.03,tw:10})}
  for(let i=0;i<8;i++)f.add('mist',{c:base,x0:rnd(-4,4),vz:f.dir*rnd(1,5),life:1.5,s0:3,s1:9,a:.22})}},
 pixels:{dur:3.2,rings:[],light:110,label:'pixels',build(f){const {base,light,comp}=f.c,pal=[base,light,comp,new T.Color('#ffe14d'),WHITE];
  for(let i=0;i<170;i++){const [x,y,z]=cone(1.35),v=rnd(6,21),s=pick([.28,.38,.5,.7]);f.add('cube',{c:pick(pal),vx:x*v,vy:y*v+5,vz:z*v*f.dir,d:.5,g:15,floor:-2.2+s*.2,vrx:pick([0,3,6]),vry:pick([0,4,8]),vrz:pick([0,3]),life:rnd(2,3.1),s0:s,s1:s,fadeOut:.2})}
  for(let i=0;i<100;i++){const [x,y,z]=cone(1.4),v=rnd(4,18);f.add('spark',{c:pick(pal),vx:x*v,vy:y*v+3,vz:z*v*f.dir,d:1,g:4,life:rnd(1,2),s0:rnd(.18,.34),s1:.05,tw:18})}}},
 petals:{dur:4.1,rings:[[0,6]],light:70,build(f){const {base}=f.c,pal=()=>tone(base,rnd(-.1,.5));
  for(let i=0;i<200;i++)f.add('quad',{c:pal(),x0:rnd(-7,7),y0:rnd(-2,4),z0:f.dir*rnd(-1,3),vx:rnd(-4,4),vy:rnd(0,6),vz:f.dir*rnd(3,12),d:.9,g:1,wob:rnd(1,2.6),wf:rnd(2,4.5),ph:rnd(6),vrx:rnd(-4,4),vry:rnd(-4,4),vrz:rnd(-3,3),sx:.75,delay:rnd(0,.7),life:rnd(2.8,4),s0:rnd(.55,1),s1:.9,fadeOut:.18});
  for(let i=0;i<120;i++){const [x,y,z]=sphere(),v=rnd(2,11);f.add('spark',{c:tone(base,rnd(.4,.9)),vx:x*v,vy:y*v+2,vz:z*v+f.dir*4,d:.9,g:-.1,wob:.6,life:rnd(2,3.6),s0:rnd(.12,.28),s1:.03,tw:6})}
  for(let i=0;i<12;i++)f.add('mist',{c:base,x0:rnd(-5,5),y0:rnd(-1,3),vz:f.dir*rnd(1,5),life:2.2,s0:3,s1:10,a:.2,delay:rnd(0,.7)})}},
 lightning:{dur:2.9,rings:[[0,20],[.07,14]],light:260,strobe:true,bolts:true,build(f){const {base,light}=f.c;
  for(let i=0;i<190;i++){const [x,y,z]=sphere(),v=rnd(5,22);f.add('spark',{c:pick([base,light,WHITE]),vx:x*v,vy:y*v+2,vz:z*v*.8+f.dir*5,d:2,g:4,delay:rnd(0,.7),life:rnd(.5,1.2),s0:rnd(.15,.38),s1:.03,tw:30})}
  for(let i=0;i<8;i++)f.add('mist',{c:i%2?WHITE:base,x0:rnd(-6,6),y0:rnd(0,6),z0:f.dir*rnd(0,12),delay:rnd(0,1.1),life:.22,s0:6,s1:14,a:.55,fadeIn:.05,fadeOut:.7});
  for(let i=0;i<40;i++)f.add('star',{c:light,x0:rnd(-8,8),y0:rnd(-2,8),z0:f.dir*rnd(0,14),delay:rnd(0,1.2),life:.3,s0:rnd(.8,2),s1:.2,vrz:3,tw:30})}},
 meteor:{dur:3.5,rings:[[0,8]],light:120,build(f){const {base,light}=f.c,fire=[base,tone(base,.5),shift(base,-.05,1,.5)],floor=-2.45;
  for(let i=0;i<24;i++){const x0=rnd(-12,12),y0=rnd(12,18),z0=f.dir*rnd(-1,14),vx=rnd(-3,5),vy=-rnd(17,26),vz=f.dir*rnd(-1,5),delay=rnd(0,1.4),fall=(y0-floor)/-vy;
   f.add('shard',{c:tone(base,.35),x0,y0,z0,vx,vy,vz,delay,life:fall,align:true,s0:rnd(.6,1.1),s1:.9,sy:2.4,vrz:0,fadeIn:.01,fadeOut:.02});
   for(let j=1;j<=9;j++)f.add('spark',{c:pick(fire),x0,y0,z0,vx:vx*.9,vy:vy*.9,vz:vz*.9,delay:delay+j*.03,life:Math.max(.05,fall-j*.03),s0:.7-j*.055,s1:.05,fadeIn:.01,fadeOut:.5});
   const hx=x0+vx*fall,hz=z0+vz*fall;
   for(let j=0;j<22;j++){const a=rnd(Math.PI*2),v=rnd(3,9);f.add('spark',{c:pick(fire),x0:hx,y0:floor,z0:hz,vx:Math.cos(a)*v,vy:rnd(5,14),vz:Math.sin(a)*v,d:.8,g:18,delay:delay+fall,life:rnd(.5,1.1),s0:rnd(.15,.34),s1:.03})}
   f.add('mist',{c:base,x0:hx,y0:floor+.5,z0:hz,delay:delay+fall,life:.9,s0:1.5,s1:6.5,vy:2,a:.45});f.add('star',{c:light,x0:hx,y0:floor+.6,z0:hz,delay:delay+fall,life:.28,s0:1,s1:3.6,vrz:2})}}},
 coins:{dur:3.5,rings:[[0,10]],light:140,build(f){const {base,light}=f.c;
  for(let i=0;i<92;i++){const a=rnd(Math.PI*2),v=rnd(2,8);f.add('coin',{c:tone(base,rnd(-.1,.35)),vx:Math.cos(a)*v,vy:rnd(10,23),vz:f.dir*rnd(0,11)+Math.sin(a)*v*.4,d:.15,g:22,floor:-2.1,vrx:rnd(7,18),vry:rnd(-2,2),rz:rnd(6),delay:rnd(0,.25),life:rnd(2.3,3.3),s0:rnd(.6,.95),s1:.9,fadeOut:.18})}
  for(let i=0;i<220;i++){const [x,y,z]=sphere(),v=rnd(3,15);f.add('spark',{c:pick([base,light,WHITE]),vx:x*v,vy:y*v+6,vz:z*v+f.dir*3,d:1,g:8,life:rnd(1.2,2.8),s0:rnd(.12,.3),s1:.03,tw:16})}
  for(let i=0;i<6;i++)f.add('mist',{c:base,y0:rnd(0,3),vz:f.dir*3,life:1.1,s0:3,s1:9,a:.3})}},
 lanterns:{dur:4.8,rings:[],light:110,flicker:true,build(f){const {base,light}=f.c;
  for(let i=0;i<66;i++){const o={x0:rnd(-9,9),y0:rnd(-2,2),z0:f.dir*rnd(-1,6),vx:rnd(-1.3,1.3),vy:rnd(1.4,2.8),vz:f.dir*rnd(.6,3.8),g:-.28,wob:rnd(.6,1.4),wf:rnd(.8,1.8),ph:rnd(6),delay:rnd(0,.9),life:rnd(3.5,4.6),fadeIn:.12,fadeOut:.3},s=rnd(.5,1.05);
   f.add('lantern',{...o,c:tone(base,rnd(0,.3)),s0:s,s1:s*1.12,ry:rnd(6),vry:rnd(-.4,.4)});f.add('mist',{...o,c:light,s0:s*3.2,s1:s*3.8,a:.5,fadeIn:.12})}
  for(let i=0;i<90;i++){const [x,y,z]=sphere(),v=rnd(2,10);f.add('spark',{c:pick([base,light]),vx:x*v,vy:y*v+2,vz:z*v+f.dir*3,d:1.2,g:-.5,life:rnd(1.2,2.6),s0:rnd(.1,.25),s1:.03,tw:10})}
  for(let i=0;i<170;i++)f.add('spark',{c:pick([base,light]),x0:rnd(-9,9),y0:rnd(-2,2),z0:f.dir*rnd(-1,8),vx:rnd(-.5,.5),vy:rnd(.8,2.2),vz:f.dir*rnd(.2,1.5),g:-.15,wob:.5,wf:2,ph:rnd(6),delay:rnd(.2,2),life:rnd(1.5,3),s0:rnd(.1,.22),s1:.03,tw:7})}},
 dragon:{dur:3.9,rings:[[0,11]],light:170,flicker:true,dragon:true,build(f){const {base,light}=f.c,fire=[base,light,shift(base,.06,1,.55),WHITE];
  for(let i=0;i<110;i++){const t0=rnd(.05,2.9),p=f.path(t0),[x,y,z]=sphere(),v=rnd(1.5,5);f.add('shard',{c:pick([base,shift(base,.03,1,.4),tone(base,.3)]),x0:p.x,y0:p.y,z0:p.z,vx:x*v,vy:y*v,vz:z*v,d:1,g:3,delay:t0,life:rnd(1,1.7),s0:rnd(.25,.5),s1:.03,sy:1.6,vrx:rnd(-6,6),vrz:rnd(-6,6)})}
  for(let i=0;i<260;i++){const t0=rnd(.0,3),p=f.path(t0),[x,y,z]=sphere(),v=rnd(.5,3.5);f.add('spark',{c:pick(fire),x0:p.x,y0:p.y,z0:p.z,vx:x*v,vy:y*v,vz:z*v,d:1,g:-.3,delay:t0,life:rnd(.5,1.2),s0:rnd(.15,.4),s1:.03,tw:12})}
  for(let i=0;i<24;i++){const t0=rnd(.0,2.8),p=f.path(t0);f.add('mist',{c:i%3?base:light,x0:p.x,y0:p.y,z0:p.z,delay:t0,life:.9,s0:1.6,s1:5,a:.3})}}},
 splash:{dur:3.1,rings:[[0,13],[.15,9]],light:120,label:'splash',build(f){const {base,light}=f.c;
  for(let i=0;i<280;i++){const [x,y,z]=cone(1.55),v=rnd(8,24);f.add('spark',{c:tone(base,rnd(.1,.85)),vx:x*v,vy:y*v+4,vz:z*v*f.dir,d:.5,g:17,life:rnd(1.1,1.9),s0:rnd(.18,.42),s1:.06,tw:6})}
  for(let i=0;i<70;i++){const [x,y,z]=cone(1.45),v=rnd(5,17);f.add('quad',{c:tone(base,rnd(.2,.7)),vx:x*v,vy:y*v+3,vz:z*v*f.dir,d:.5,g:14,vrx:rnd(-8,8),vrz:rnd(-8,8),life:rnd(1.1,1.9),s0:rnd(.4,.9),s1:.2})}
  for(let i=0;i<26;i++)f.add('bubble',{c:light,x0:rnd(-5,5),y0:rnd(-2,1),z0:f.dir*rnd(0,6),vy:rnd(1,4),vz:f.dir*rnd(1,5),g:-.5,delay:rnd(.3,1.2),life:rnd(1,1.8),s0:rnd(.3,.9),s1:1.2});
  for(let i=0;i<8;i++)f.add('mist',{c:WHITE,x0:rnd(-3,3),y0:rnd(-1,1),vz:f.dir*rnd(1,4),life:.9,s0:3,s1:9,a:.28})}},
 nice:{dur:3.5,rings:[[0,13],[.14,9]],light:200,label:'nice',build(f){const {base,light}=f.c;
  for(let i=0;i<190;i++){const [x,y,z]=cone(1.4),v=rnd(6,23);f.add('spark',{c:tone(base,rnd(0,.7)),vx:x*v,vy:y*v+3,vz:z*v*f.dir,d:.7,g:11,life:rnd(1.2,2.5),s0:rnd(.16,.4),s1:.05,tw:10})}
  for(let i=0;i<50;i++){const [x,y,z]=cone(1.2),v=rnd(10,26);f.add('shard',{c:light,vx:x*v,vy:y*v,vz:z*v*f.dir,d:1,g:6,align:true,life:rnd(.8,1.5),s0:rnd(.22,.4),s1:.03,sy:2.8})}
  for(let i=0;i<22;i++){const [x,y,z]=sphere(),v=rnd(4,12);f.add('star',{c:pick([light,WHITE,base]),vx:x*v,vy:y*v+2,vz:z*v+f.dir*5,d:1.2,g:1,life:rnd(1.5,2.6),s0:rnd(.6,1.4),s1:.1,vrz:rnd(-3,3),tw:12})}
  for(let i=0;i<8;i++)f.add('mist',{c:base,x0:rnd(-3,3),vz:f.dir*rnd(1,4),life:1.2,s0:3,s1:10,a:.3})}},
 vortex:{dur:3.5,rings:[[0,11],[.2,8]],light:210,flicker:true,build(f){const {base,light}=f.c,fire=[tone(base,.3),base,shift(base,-.05,1,.45),shift(base,-.09,1,.3)];
  for(let i=0;i<64;i++){const a=rnd(Math.PI*2),r=rnd(.3,3),v=rnd(1.5,6);f.add('mist',{c:pick(fire),x0:Math.cos(a)*r,y0:Math.sin(a)*r,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:f.dir*rnd(1,9),d:.5,sw:rnd(2.4,3.6),delay:rnd(0,.5),life:rnd(1.4,2.4),s0:1.2,s1:rnd(3.5,6),a:.42})}
  for(let i=0;i<330;i++){const a=rnd(Math.PI*2),r=rnd(.2,2.5),v=rnd(3,15);f.add('spark',{c:pick(fire),x0:Math.cos(a)*r,y0:Math.sin(a)*r,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:f.dir*rnd(1,10),d:.4,sw:rnd(2.2,3.4),delay:rnd(0,.5),life:rnd(1.4,2.8),s0:rnd(.13,.38),s1:.03,tw:12})}
  for(let i=0;i<26;i++){const a=rnd(Math.PI*2),v=rnd(3,11);f.add('star',{c:pick([light,WHITE]),vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:f.dir*rnd(1,8),d:.4,sw:3,delay:rnd(0,.6),life:rnd(1.6,2.8),s0:rnd(.5,1.1),s1:.1,vrz:2,tw:10})}
  for(let i=0;i<46;i++){const a=rnd(Math.PI*2),v=rnd(6,14);f.add('shard',{c:pick(fire),vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:f.dir*rnd(2,9),d:.5,sw:3,align:false,delay:rnd(0,.4),life:rnd(1,2),s0:rnd(.3,.6),s1:.05,sy:2.2,vrz:3})}}},
 blackhole:{dur:3.7,rings:[[1.2,16],[1.3,11]],light:200,void:true,build(f){const {base,comp,light}=f.c,pal=[base,light,comp,WHITE];
  for(let i=0;i<330;i++){const [x,y,z]=sphere(),r=rnd(6,15),[bx,by,bz]=cone(1.3),v=rnd(7,25);f.add('spark',{c:pick(pal),mode:1,tc:1.25,x0:x*r,y0:y*r,z0:z*r*.6,sw:rnd(3.5,5),vx:bx*v,vy:by*v,vz:bz*v*f.dir,d:1,g:2,life:rnd(2.6,3.3),s0:rnd(.14,.36),s1:.04,fadeIn:.03,tw:9})}
  for(let i=0;i<22;i++){const [x,y,z]=sphere(),r=rnd(8,14);f.add('mist',{c:i%2?base:comp,mode:1,tc:1.25,x0:x*r,y0:y*r,z0:z*r*.6,sw:4,vx:rnd(-6,6),vy:rnd(-6,6),vz:f.dir*rnd(2,10),d:1.1,life:rnd(2,2.8),s0:2.5,s1:7,a:.3})}
  for(let i=0;i<26;i++){const [x,y,z]=sphere(),r=rnd(8,14),[bx,by,bz]=cone(1.2),v=rnd(6,14);f.add('star',{c:pick(pal),mode:1,tc:1.25,x0:x*r,y0:y*r,z0:z*r*.6,sw:4,vx:bx*v,vy:by*v,vz:bz*v*f.dir,d:.7,life:rnd(2.4,3.2),s0:rnd(.5,1.1),s1:.1,vrz:2,tw:9})}}},
 hearts:{dur:3.8,rings:[[0,8]],light:90,build(f){const {base,light}=f.c;
  for(let i=0;i<120;i++)f.add('heart',{c:tone(base,rnd(-.1,.5)),x0:rnd(-8,8),y0:rnd(-2,2),z0:f.dir*rnd(-1,6),vx:rnd(-2,2),vy:rnd(3,8),vz:f.dir*rnd(1,9),d:.5,g:-.4,wob:rnd(.4,1.3),wf:rnd(2,4),ph:rnd(6),rz:rnd(-.3,.3),vrz:rnd(-.6,.6),delay:rnd(0,.6),life:rnd(2.2,3.5),s0:rnd(.5,1.3),s1:.9,fadeOut:.18});
  for(let i=0;i<170;i++){const [x,y,z]=sphere(),v=rnd(2,12);f.add('spark',{c:pick([base,light,WHITE]),vx:x*v,vy:y*v+3,vz:z*v+f.dir*4,d:1,g:-.3,life:rnd(1.4,2.6),s0:rnd(.1,.26),s1:.03,tw:10})}
  for(let i=0;i<8;i++)f.add('mist',{c:base,x0:rnd(-5,5),vz:f.dir*rnd(1,4),life:1.6,s0:3,s1:9,a:.22})}},
 snow:{dur:4.4,rings:[[0,7]],light:70,build(f){const {base,light}=f.c;
  for(let i=0;i<90;i++)f.add('star',{c:tone(base,rnd(.35,.9)),x0:rnd(-11,11),y0:rnd(5,13),z0:f.dir*rnd(-1,15),vy:-rnd(1.2,3),vx:rnd(-1,1),vz:f.dir*rnd(.2,2),wob:rnd(.5,1.4),wf:rnd(1.5,3),ph:rnd(6),vrz:rnd(-1.5,1.5),delay:rnd(0,1.2),life:rnd(2.4,3.4),s0:rnd(.5,1.1),s1:.5,fadeOut:.2,tw:6});
  for(let i=0;i<300;i++)f.add('spark',{c:tone(base,rnd(.5,1)),x0:rnd(-12,12),y0:rnd(4,13),z0:f.dir*rnd(-1,15),vy:-rnd(.8,2.4),wob:rnd(.3,1),wf:2,ph:rnd(6),delay:rnd(0,1.5),life:rnd(2,3),s0:rnd(.1,.24),s1:.05,tw:5});
  for(let i=0;i<150;i++){const [x,y,z]=sphere(),v=rnd(3,13);f.add('spark',{c:pick([light,WHITE]),vx:x*v,vy:y*v+2,vz:z*v+f.dir*4,d:1.2,g:1.2,life:rnd(1.4,2.6),s0:rnd(.1,.25),s1:.03,tw:9})}
  for(let i=0;i<10;i++)f.add('mist',{c:base,x0:rnd(-6,6),y0:rnd(0,5),z0:f.dir*rnd(0,10),life:2,s0:4,s1:10,a:.18,delay:rnd(0,1)})}},
 leaves:{dur:4.2,rings:[[0,7]],light:80,build(f){const {base}=f.c,pal=[base,shift(base,-.04,1,.5),shift(base,.07,1,.55),tone(base,-.35),tone(base,.3)];
  for(let i=0;i<170;i++)f.add('quad',{c:pick(pal),x0:rnd(-6,6),y0:rnd(-1,5),z0:f.dir*rnd(-1,3),vx:rnd(-5,5),vy:rnd(1,8),vz:f.dir*rnd(3,13),d:.9,g:2.2,wob:rnd(1,2.6),wf:rnd(2,5),ph:rnd(6),sw:rnd(-.3,.3),vrx:rnd(-4,4),vry:rnd(-4,4),vrz:rnd(-3,3),sx:.8,sy:1.1,delay:rnd(0,.5),life:rnd(2.8,4),s0:rnd(.6,1.1),s1:.9,fadeOut:.2});
  for(let i=0;i<110;i++){const [x,y,z]=cone(1.5),v=rnd(3,14);f.add('spark',{c:pick(pal),vx:x*v,vy:y*v+3,vz:z*v*f.dir,d:1,g:3,life:rnd(1.2,2.4),s0:rnd(.12,.28),s1:.04,tw:8})}
  for(let i=0;i<8;i++)f.add('mist',{c:base,x0:rnd(-5,5),vz:f.dir*rnd(1,5),life:1.8,s0:3,s1:9,a:.2})}},
 balloons:{dur:4.4,rings:[[0,8]],light:90,build(f){const col=family(f);
  for(let i=0;i<46;i++)f.add('balloon',{c:col(),x0:rnd(-9,9),y0:rnd(-2,1),z0:f.dir*rnd(-1,8),vx:rnd(-1,1),vy:rnd(2.4,5),vz:f.dir*rnd(.4,5),g:-.4,wob:rnd(.5,1.2),wf:rnd(1.2,2.6),ph:rnd(6),delay:rnd(0,.7),life:rnd(3.2,4.3),s0:rnd(.55,1.05),s1:.9,fadeOut:.12});
  for(let i=0;i<120;i++){const [x,y,z]=cone(1.4),v=rnd(5,19);f.add('quad',{c:col(),vx:x*v,vy:y*v+4,vz:z*v*f.dir,d:1.5,g:3,wob:1.2,wf:rnd(3,6),ph:rnd(6),vrx:rnd(-8,8),vrz:rnd(-5,5),life:rnd(2.2,3.2),s0:rnd(.4,.8),s1:.8,fadeOut:.15})}
  for(let i=0;i<100;i++){const [x,y,z]=sphere(),v=rnd(3,13);f.add('spark',{c:col(),vx:x*v,vy:y*v+3,vz:z*v+f.dir*4,d:1,g:2,life:rnd(1.2,2.4),s0:rnd(.12,.28),s1:.04,tw:10})}}},
 gears:{dur:3.3,rings:[[0,9]],light:130,build(f){const {base,light}=f.c;
  for(let i=0;i<50;i++){const a=rnd(Math.PI*2),v=rnd(2,9);f.add('gear',{c:tone(base,rnd(-.25,.4)),vx:Math.cos(a)*v,vy:rnd(8,20),vz:f.dir*rnd(0,11)+Math.sin(a)*v*.4,d:.2,g:19,floor:-2.1,rz:rnd(6),vrz:rnd(-6,6),delay:rnd(0,.2),life:rnd(2.4,3.2),s0:rnd(.5,1.1),s1:.9,fadeOut:.18})}
  for(let i=0;i<180;i++){const [x,y,z]=sphere(),v=rnd(3,15);f.add('spark',{c:pick([base,light,WHITE]),vx:x*v,vy:y*v+5,vz:z*v+f.dir*3,d:1,g:9,life:rnd(1,2.2),s0:rnd(.12,.3),s1:.03,tw:14})}
  for(let i=0;i<6;i++)f.add('mist',{c:base,y0:rnd(0,3),vz:f.dir*3,life:1,s0:3,s1:8,a:.3})}},
 bats:{dur:3.8,rings:[[0,9]],light:120,build(f){const {base,light}=f.c,dark=tone(base,-.5);
  for(let i=0;i<80;i++){const [x,y,z]=cone(1.25),v=rnd(7,19);f.add('bat',{c:i%7?dark:tone(base,-.2),vx:x*v*.7,vy:y*v*.5+rnd(1,4),vz:z*v*f.dir,d:.3,g:-.6,wob:rnd(.4,1.4),wf:rnd(3,6),ph:rnd(6),flap:rnd(14,22),rz:rnd(-.3,.3),delay:rnd(0,.5),life:rnd(2.4,3.4),s0:rnd(.55,1.2),s1:.9,fadeOut:.2})}
  for(let i=0;i<220;i++){const [x,y,z]=sphere(),v=rnd(3,14);f.add('spark',{c:pick([base,light,shift(base,.5,1,.6)]),vx:x*v,vy:y*v+2,vz:z*v+f.dir*4,d:1,g:1,life:rnd(1.4,2.8),s0:rnd(.1,.28),s1:.03,tw:9})}
  for(let i=0;i<14;i++)f.add('mist',{c:i%2?base:tone(base,-.3),x0:rnd(-5,5),y0:rnd(-1,3),vz:f.dir*rnd(1,5),life:2,s0:3,s1:10,a:.3})}},
 tornado:{dur:3.8,rings:[[0,8]],light:100,build(f){const {base,light}=f.c;
  for(let i=0;i<420;i++){const phi=rnd(Math.PI*2),r=rnd(.4,1.8),rise=rnd(3,12);f.add('spark',{c:pick([base,light,WHITE,tone(base,-.2)]),x0:Math.cos(phi)*r,y0:-2.3,z0:Math.sin(phi)*r,vx:Math.cos(phi)*rise*.55,vy:rise,vz:f.dir*rnd(.5,2.5)+Math.sin(phi)*rise*.55,swy:rnd(3.5,6),ph:phi,delay:rnd(0,.9),life:rnd(1.4,2.6),s0:rnd(.14,.34),s1:.05,tw:7})}
  for(let i=0;i<90;i++){const phi=rnd(Math.PI*2),r=rnd(.4,1.4),rise=rnd(4,11);f.add('quad',{c:pick([light,WHITE,base]),x0:Math.cos(phi)*r,y0:-2.3,z0:Math.sin(phi)*r,vx:Math.cos(phi)*rise*.3,vy:rise,vz:f.dir*rnd(3,7),swy:rnd(3,5),ph:phi,vrx:rnd(-6,6),vrz:rnd(-6,6),delay:rnd(0,1),life:rnd(1.4,2.4),s0:rnd(.3,.7),s1:.3})}
  for(let i=0;i<28;i++){const phi=rnd(Math.PI*2),r=rnd(.5,1.6),rise=rnd(3,9);f.add('mist',{c:base,x0:Math.cos(phi)*r,y0:-2,z0:Math.sin(phi)*r,vx:Math.cos(phi)*rise*.3,vy:rise,vz:f.dir*rnd(3,6),swy:4,ph:phi,delay:rnd(0,.8),life:rnd(1.4,2.2),s0:1.4,s1:rnd(4,7),a:.28})}}},
 sunburst:{dur:3,rings:[[0,15],[.12,10],[.28,7]],light:260,build(f){const {base,light}=f.c;
  for(let i=0;i<28;i++){const a=i/28*Math.PI*2+rnd(-.05,.05),v=rnd(6,14);f.add('quad',{c:i%2?light:base,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:f.dir*rnd(.5,3),rz:a-Math.PI/2,sx:.34,sy:rnd(14,26),d:1.4,life:rnd(.9,1.6),s0:.25,s1:1.2,fadeIn:.04,fadeOut:.6})}
  for(let i=0;i<300;i++){const a=rnd(Math.PI*2),v=rnd(4,24);f.add('spark',{c:pick([base,light,WHITE]),vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:f.dir*rnd(1,8),d:1.1,g:2,life:rnd(1,2.4),s0:rnd(.15,.4),s1:.04,tw:10})}
  for(let i=0;i<24;i++){const a=rnd(Math.PI*2),v=rnd(3,12);f.add('star',{c:pick([light,WHITE]),vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:f.dir*rnd(1,6),d:.8,life:rnd(1.2,2.2),s0:rnd(.5,1.2),s1:.1,vrz:2,tw:12})}
  f.add('mist',{c:light,life:1.2,s0:6,s1:20,a:.5})}},
 comet:{dur:3.1,rings:[[0,8]],light:130,build(f){const {base,light}=f.c;
  for(let i=0;i<24;i++){const x0=rnd(-9,9),y0=rnd(-1,8),vx=rnd(-5,5),vy=rnd(-3,5),vz=f.dir*rnd(16,28),delay=rnd(0,1.3),life=rnd(1.2,1.8);
   f.add('star',{c:WHITE,x0,y0,z0:0,vx,vy,vz,delay,life,s0:rnd(.9,1.6),s1:.7,vrz:3,fadeIn:.02,fadeOut:.15});
   for(let j=1;j<=12;j++)f.add('spark',{c:j<4?light:base,x0,y0,z0:0,vx,vy,vz,delay:delay+j*.028,life:life-j*.02,s0:.85-j*.055,s1:.05,fadeIn:.01,fadeOut:.55})}
  for(let i=0;i<150;i++){const [x,y,z]=cone(1.3),v=rnd(5,19);f.add('spark',{c:pick([base,light,WHITE]),vx:x*v,vy:y*v+2,vz:z*v*f.dir,d:1,g:2,life:rnd(1,2),s0:rnd(.12,.3),s1:.04,tw:9})}}},
 nova:{dur:3.3,rings:[[0,24],[.1,17],[.22,12],[.4,8]],light:360,build(f){const {base,light,comp}=f.c,pal=[base,light,WHITE,comp];
  for(let i=0;i<520;i++){const [x,y,z]=sphere(),v=rnd(6,36);f.add('spark',{c:pick(pal),vx:x*v,vy:y*v,vz:z*v,d:1.3,g:1.5,life:rnd(1.2,2.8),s0:rnd(.15,.45),s1:.03,tw:8})}
  for(let i=0;i<80;i++){const [x,y,z]=sphere(),v=rnd(14,34);f.add('shard',{c:pick([light,WHITE,base]),vx:x*v,vy:y*v,vz:z*v,d:1,align:true,life:rnd(.7,1.4),s0:rnd(.25,.5),s1:.02,sy:3.2})}
  for(let i=0;i<24;i++){const [x,y,z]=sphere(),v=rnd(2,9);f.add('star',{c:pick(pal),vx:x*v,vy:y*v,vz:z*v,d:.8,life:rnd(1.6,2.8),s0:rnd(.6,1.4),s1:.1,vrz:rnd(-2,2),tw:10})}
  for(let i=0;i<20;i++)f.add('mist',{c:i%3?base:light,vx:rnd(-4,4),vy:rnd(-4,4),vz:rnd(-4,4),delay:rnd(0,.2),life:rnd(1.2,2),s0:3,s1:rnd(10,18),a:.35})}},
 disco:{dur:3.6,rings:[[1,12],[1.12,8]],light:200,strobe:true,build(f){const col=family(f),{base,light}=f.c,swirl=3.2,hold=1;
  for(let i=0;i<170;i++){const [x,y,z]=sphere(),r=2.4,sx=x*r,sy=y*r,sz=z*r*.9,tone0=i%3?light:WHITE;
   f.add('cube',{c:tone0,x0:sx,y0:sy,z0:sz,swy:swirl,delay:0,life:hold,s0:.55,s1:.55,fadeIn:.01,fadeOut:.02});
   const ang=swirl*hold,c=Math.cos(ang),sn=Math.sin(ang),rx=sx*c-sz*sn,rz2=sx*sn+sz*c,v=rnd(6,22);
   f.add('cube',{c:tone0,x0:rx,y0:sy,z0:rz2,vx:x*v,vy:y*v+2,vz:z*v,d:.9,g:6,vrx:rnd(-6,6),vry:rnd(-6,6),delay:hold,life:rnd(1.2,2.3),s0:.55,s1:.12,fadeIn:.01})}
  for(let i=0;i<10;i++)f.add('quad',{c:col(),z0:-f.dir*.2,rz:i*Math.PI/5,vrz:.9,sx:.18,sy:30,s0:.01,s1:1,delay:hold,life:2.2,fadeIn:.1,fadeOut:.35});
  for(let i=0;i<260;i++){const [x,y,z]=sphere(),v=rnd(4,20);f.add('spark',{c:col(),vx:x*v,vy:y*v+2,vz:z*v,d:1.1,g:3,delay:hold,life:rnd(1.1,2.3),s0:rnd(.14,.34),s1:.04,tw:16})}
  for(let i=0;i<40;i++){const [x,y,z]=sphere(),v=rnd(3,10);f.add('star',{c:pick([WHITE,light,col()]),vx:x*v,vy:y*v,vz:z*v,d:.8,delay:hold,life:rnd(1.2,2.2),s0:rnd(.5,1.2),s1:.1,vrz:2,tw:14})}
  for(let i=0;i<34;i++){const [x,y,z]=sphere();f.add('spark',{c:WHITE,x0:x*2,y0:y*2,z0:z*2,swy:swirl,delay:0,life:hold,s0:.55,s1:.55,tw:16,ph:rnd(6)})}}},
 aurora:{dur:4.6,rings:[],light:100,build(f){const {base,light,comp}=f.c,pal=[base,shift(base,.12,1,.6),comp,light];
  for(let k=0;k<4;k++){const cz=f.dir*(3+k*3.5),hue=pal[k%4];for(let i=0;i<150;i++){const x=rnd(-12,12),y=rnd(0,10);f.add('spark',{c:tone(hue,rnd(-.1,.4)),x0:x,y0:y,z0:cz,vy:rnd(.2,1.2),wob:rnd(.8,1.8),wf:rnd(.8,1.6),ph:x*.6+k,delay:rnd(0,1),life:rnd(2.6,3.6),s0:rnd(.25,.6),s1:.15,fadeIn:.25,fadeOut:.4,tw:3,a:.85})}}
  for(let i=0;i<40;i++)f.add('mist',{c:pal[i%4],x0:rnd(-11,11),y0:rnd(1,9),z0:f.dir*rnd(2,14),vy:rnd(.3,1),wob:1.2,wf:1,ph:rnd(6),delay:rnd(0,1),life:rnd(2.8,3.8),s0:4,s1:9,a:.16,fadeIn:.3,fadeOut:.4});
  for(let i=0;i<50;i++)f.add('star',{c:pick([WHITE,light]),x0:rnd(-13,13),y0:rnd(2,12),z0:f.dir*rnd(0,16),delay:rnd(0,1.5),life:rnd(1.2,2.6),s0:rnd(.3,.8),s1:.2,vrz:1,tw:10,ph:rnd(6),fadeIn:.3,fadeOut:.3})}},
 starfall:{dur:3.4,rings:[[0,8]],light:130,build(f){const {base,light}=f.c,floor=-2.4;
  for(let i=0;i<70;i++){const x0=rnd(-12,12),y0=rnd(9,17),z0=f.dir*rnd(-1,15),vx=rnd(-3,3),vy=-rnd(7,13),vz=f.dir*rnd(1,7),delay=rnd(0,1.5),fall=(y0-floor)/-vy;
   f.add('star',{c:pick([light,WHITE,base]),x0,y0,z0,vx,vy,vz,delay,life:fall,s0:rnd(.8,1.5),s1:.9,vrz:rnd(-3,3),fadeIn:.02,fadeOut:.02});
   for(let j=1;j<=7;j++)f.add('spark',{c:j<3?light:base,x0,y0,z0,vx,vy,vz,delay:delay+j*.035,life:Math.max(.05,fall-j*.035),s0:.55-j*.06,s1:.04,fadeIn:.01,fadeOut:.5});
   const hx=x0+vx*fall,hz=z0+vz*fall;for(let j=0;j<12;j++){const a=rnd(Math.PI*2),v=rnd(2,7);f.add('spark',{c:pick([light,WHITE,base]),x0:hx,y0:floor,z0:hz,vx:Math.cos(a)*v,vy:rnd(3,9),vz:Math.sin(a)*v,d:.8,g:14,delay:delay+fall,life:rnd(.5,1),s0:rnd(.14,.3),s1:.03})}
   f.add('star',{c:WHITE,x0:hx,y0:floor+.4,z0:hz,delay:delay+fall,life:.3,s0:.8,s1:2.8,vrz:2})}}},
 ripple:{dur:3.1,rings:[[0,8],[.18,8],[.36,8],[.54,8],[.72,8]],light:100,build(f){const {base,light}=f.c;
  for(let i=0;i<220;i++){const [x,y,z]=cone(1.45),v=rnd(6,19);f.add('spark',{c:tone(base,rnd(.1,.8)),vx:x*v,vy:y*v+4,vz:z*v*f.dir,d:.6,g:15,delay:rnd(0,.5),life:rnd(1,1.8),s0:rnd(.15,.36),s1:.05,tw:6})}
  for(let i=0;i<30;i++)f.add('bubble',{c:light,x0:rnd(-6,6),y0:rnd(-2,1),z0:f.dir*rnd(0,8),vy:rnd(1,4),vz:f.dir*rnd(1,5),g:-.5,delay:rnd(0,1),life:rnd(1,2),s0:rnd(.3,.9),s1:1.2});
  for(let i=0;i<7;i++)f.add('mist',{c:base,delay:i*.12,vz:f.dir*2,life:1,s0:2,s1:12,a:.2})}}
};
export class GoalEffects{
 constructor(scene){
  this.group=new T.Group();scene.add(this.group);
  this.sparks=createSoftPoints(1000);this.mist=createSoftPoints(200);this.boltGlow=createSoftPoints(120);this.group.add(this.mist.points,this.sparks.points,this.boltGlow.points);
  this.meshes={};this.live={spark:[],mist:[]};const dummyColor=new T.Color();
  for(const [kind,geometry] of Object.entries(GEO)){const material=new T.MeshBasicMaterial({toneMapped:false,side:T.DoubleSide,transparent:kind==='bubble',opacity:kind==='bubble'?.38:1,depthWrite:kind!=='bubble'});const mesh=new T.InstancedMesh(geometry,material,CAP[kind]);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.setColorAt(0,dummyColor.set(1,1,1));mesh.count=0;mesh.frustumCulled=false;this.group.add(mesh);this.meshes[kind]=mesh;this.live[kind]=[]}
  this.rings=Array.from({length:5},()=>{const ring=new T.Mesh(new T.TorusGeometry(1,.045,8,96),new T.MeshBasicMaterial({color:0x64caff,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));ring.visible=false;this.group.add(ring);return ring});
  this.core=new T.Mesh(new T.SphereGeometry(1,20,12),new T.MeshBasicMaterial({color:0xd9f5ff,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));this.group.add(this.core);
  this.bloom=new T.Sprite(new T.SpriteMaterial({map:softGlow(),color:0xffffff,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));this.group.add(this.bloom);
  this.light=new T.PointLight(0x64caff,0,34,2);this.group.add(this.light);
  this.label=new T.Sprite(new T.SpriteMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));this.label.renderOrder=30;this.label.visible=false;this.group.add(this.label);
  this.splat=new T.Sprite(new T.SpriteMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));this.splat.renderOrder=29;this.splat.visible=false;this.group.add(this.splat);
  // Dragón: cuerpo segmentado + cabeza propia (solo visible en esa explosión).
  const bodyGeometry=new T.SphereGeometry(.5,14,10);bodyGeometry.scale(1,.92,1.7);
  this.dragonBody=new T.InstancedMesh(bodyGeometry,new T.MeshBasicMaterial({toneMapped:false}),DRAGON_SEGMENTS);this.dragonBody.setColorAt(0,dummyColor.set(1,1,1));this.dragonBody.count=0;this.dragonBody.frustumCulled=false;this.group.add(this.dragonBody);
  const spineGeometry=new T.ConeGeometry(.2,.7,5);spineGeometry.translate(0,.35,0);
  this.dragonSpines=new T.InstancedMesh(spineGeometry,new T.MeshBasicMaterial({toneMapped:false}),DRAGON_SEGMENTS);this.dragonSpines.setColorAt(0,dummyColor.set(1,1,1));this.dragonSpines.count=0;this.dragonSpines.frustumCulled=false;this.group.add(this.dragonSpines);
  this.dragonHead=this.buildDragonHead();this.group.add(this.dragonHead);
  // Rayos: líneas que se regeneran varias veces por segundo.
  this.boltCount=6;this.boltSegs=12;this.boltPositions=new Float32Array(this.boltCount*this.boltSegs*2*3);const boltGeometry=new T.BufferGeometry();boltGeometry.setAttribute('position',new T.BufferAttribute(this.boltPositions,3));
  this.bolts=new T.LineSegments(boltGeometry,new T.LineBasicMaterial({color:0xcfe6ff,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));this.bolts.frustumCulled=false;this.bolts.visible=false;this.group.add(this.bolts);this.boltAt=-1;this.boltShapes=[];
  // Agujero negro: núcleo oscuro y disco de acreción.
  this.hole=new T.Mesh(new T.SphereGeometry(1,24,16),new T.MeshBasicMaterial({color:0x000000,toneMapped:false}));this.hole.visible=false;this.group.add(this.hole);
  this.disk=new T.Mesh(new T.TorusGeometry(1,.09,10,72),new T.MeshBasicMaterial({color:0xb36bff,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));this.disk.visible=false;this.group.add(this.disk);
  this.reset();
 }
 buildDragonHead(){
  // Cabeza de dragón chino: cráneo, hocico alargado, mandíbula articulada con dientes, ojos furiosos, cuernos curvos, bigotes largos y melena de llamas.
  const head=new T.Group(),mat=color=>new T.MeshBasicMaterial({color,toneMapped:false}),M=this.dragonMats={main:mat(0xe02a24),dark:mat(0x8e1010),gold:mat(0xffc93c),white:mat(0xfff6e0),pupil:mat(0x120808),eye:mat(0xffe14d),mane:mat(0xff7a1a)};
  const part=(geometry,material,position,parent=head)=>{const o=new T.Mesh(geometry,material);o.position.set(position[0],position[1],position[2]);parent.add(o);return o};
  const tube=(points,radius,material,parent=head)=>part(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,radius,7),material,[0,0,0],parent);
  part(new T.SphereGeometry(.5,16,12),M.main,[0,0,0]).scale.set(1.05,.9,1.25);
  part(new T.SphereGeometry(.42,12,10),M.main,[0,-.05,-.55]);
  const snout=part(new T.CylinderGeometry(.2,.33,.95,12),M.main,[0,-.04,.85]);snout.rotation.x=Math.PI/2;snout.scale.set(1.1,1,.72);
  part(new T.SphereGeometry(.24,12,8),M.main,[0,-.01,1.3]).scale.set(1.15,.8,1);
  const jaw=new T.Group();jaw.position.set(0,-.17,.3);head.add(jaw);const lower=part(new T.CylinderGeometry(.15,.27,.8,10),M.dark,[0,-.06,.45],jaw);lower.rotation.x=Math.PI/2;lower.scale.set(1,1,.5);
  part(new T.ConeGeometry(.1,.4,6),M.gold,[0,-.2,.85],jaw).rotation.x=Math.PI*.85;
  for(const s of [-1,1]){
   part(new T.SphereGeometry(.05,6,5),M.pupil,[s*.1,.05,1.5]);
   for(let i=0;i<4;i++){part(new T.ConeGeometry(.04,.13,5),M.white,[s*(.2-i*.012),-.17,.6+i*.22]).rotation.x=Math.PI;part(new T.ConeGeometry(.035,.1,5),M.white,[s*(.15-i*.008),.06,.3+i*.2],jaw)}
   part(new T.SphereGeometry(.12,10,8),M.eye,[s*.36,.22,.5]).scale.set(1,1,.7);part(new T.BoxGeometry(.03,.17,.03),M.pupil,[s*.46,.22,.55]);
   const brow=part(new T.BoxGeometry(.3,.07,.15),M.dark,[s*.36,.37,.5]);brow.rotation.z=s*.45;
   tube([[s*.2,.38,-.05],[s*.35,.75,-.35],[s*.5,1.05,-.85],[s*.55,1.2,-1.4]],.075,M.gold);part(new T.ConeGeometry(.075,.28,7),M.gold,[s*.55,1.3,-1.55]).rotation.x=-1.3;
   const fin=part(new T.ConeGeometry(.2,.6,4),M.mane,[s*.5,.12,-.2]);fin.rotation.set(-.6,0,-s*1.2);
  }
  const whiskers=new T.Group();head.add(whiskers);for(const s of [-1,1])for(const k of [0,1])tube([[s*.28,-.05+k*.1,1.05],[s*.8,-.1+k*.3,1.5],[s*1.5,.1-k*.4,1.2],[s*2.1,-.35-k*.3,.4]],.022,M.gold,whiskers);
  for(let i=0;i<8;i++){const flame=part(new T.ConeGeometry(.23-i*.012,.8-i*.04,5),i%2?M.gold:M.mane,[0,.28-i*.02,-.5-i*.3]);flame.rotation.x=-1.05}
  head.userData={jaw,whiskers};head.visible=false;return head;
 }
 reset(){this.group.visible=false;this.age=10;this.dur=0;this.seen=new Set()}
 seed(events=[]){for(const e of events)this.seen.add(e.id)}
 sync(events,ownSlot,onSave,cars=[]){for(const event of events||[]){if(this.seen.has(event.id))continue;this.seen.add(event.id);if(event.type==='goal')this.explode(event.end,cars.find(c=>c.slot===event.slot)?.profile);else if(event.slot===ownSlot&&['save','epic-save'].includes(event.type))onSave(event)} }
 add(kind,o){
  const list=this.live[kind];if(!list||(CAP[kind]&&list.length>=CAP[kind])||(kind==='spark'&&list.length>=this.sparks.capacity)||(kind==='mist'&&list.length>=this.mist.capacity))return;
  const p={...DEFAULTS,...o,kind};const c=o.c||this.c.base;p.cr=c.r;p.cg=c.g;p.cb=c.b;list.push(p);
  const mesh=this.meshes[kind];if(mesh)mesh.setColorAt(list.length-1,c);
 }
 path(t){const dir=this.dir;return{x:Math.sin(t*2.1)*7.5,y:2.6+Math.cos(t*1.6)*2.4+t*.5,z:dir*(t*10.5-3)}}
 explode(end,profile=null){
  const item=itemById(profile?.cosmetics?.goalExplosion),styleKey=item?.style&&STYLES[item.style]?item.style:'standard',style=STYLES[styleKey];
  this.style=styleKey;this.def=style;this.end=end;this.dir=-end;this.age=0;this.dur=style.dur;this.group.scale.setScalar(1);this.group.visible=true;this.group.position.set(0,2.5,end*50.6);
  const color=item?.color?new T.Color(item.color):new T.Color(end<0?0x39b7ff:0xff8b30),h={};color.getHSL(h);
  this.c={base:color,light:tone(color,.55),dark:tone(color,-.45),comp:shift(color,.5,1,Math.max(.5,h.l))};this.variant=!!item?.variantOf;
  for(const k of Object.keys(this.live))this.live[k].length=0;
  style.build(this);
  for(const [kind,mesh] of Object.entries(this.meshes)){mesh.count=this.live[kind].length;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true}
  this.rings.forEach((ring,i)=>{const conf=style.rings[i];ring.visible=!!conf;if(conf){ring.material.color.copy(i%2?this.c.light:this.c.base)}});
  this.core.material.color.copy(this.c.light);this.core.visible=!style.void;this.bloom.material.color.copy(this.c.base);this.light.color.copy(this.c.base);
  // Texto / splat propios de cada estilo.
  this.label.visible=this.splat.visible=false;
  if(style.label==='splash'){this.label.material.map=textTexture('t-splash',bigText('¡SPLASH!',{top:'#ffffff',mid:'#e6f9ff',bottom:'#8fdcff',stroke:'#0a5cb8',glow:'#38bdf8'}));this.splat.material.map=splatTexture('water','#27a8ff','#0b6fd1',16)}
  if(style.label==='nice'){this.label.material.map=textTexture('t-nice',bigText('¡TIRAZO!',{top:'#fff6b8',mid:'#ffd54a',bottom:'#b86e0d',stroke:'#6b3a05',glow:'#ffb300'}));this.splat.material.map=splatTexture('gold','#ffcd3c','#b57a12',13)}
  if(style.label==='pixels'){this.label.material.map=textTexture('t-pixels',(c,w,h)=>{c.imageSmoothingEnabled=false;c.font='900 30px "Courier New", monospace';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#16203a';c.fillText('¡GOL!',w/2+2,h/2+2);c.fillStyle='#7dff7a';c.fillText('¡GOL!',w/2,h/2)},128,48,true)}
  if(this.label.material.map){this.label.material.needsUpdate=true}
  this.splat.material.needsUpdate=true;
  this.dragonHead.visible=!!style.dragon;this.dragonBody.visible=this.dragonSpines.visible=!!style.dragon;this.bolts.visible=!!style.bolts;this.hole.visible=this.disk.visible=!!style.void;
  if(style.dragon){const {base}=this.c,gold=shift(base,.1,.9,.62),dark=tone(base,-.2);this.dragonMats.main.color.copy(base);this.dragonMats.dark.color.copy(tone(base,-.4));this.dragonMats.gold.color.copy(gold);this.dragonMats.mane.color.copy(shift(base,.06,1,.55));
   for(let j=0;j<DRAGON_SEGMENTS;j++){this.dragonBody.setColorAt(j,j%8===0?gold:j%2?base:dark);this.dragonSpines.setColorAt(j,gold)}this.dragonBody.instanceColor.needsUpdate=true;this.dragonSpines.instanceColor.needsUpdate=true;this.dragonBody.count=this.dragonSpines.count=DRAGON_SEGMENTS}
  this.boltAt=-1;this.sparks.pixelScale(1);this.mist.pixelScale(1);this.boltGlow.pixelScale(1);
 }
 // Posición, escala y opacidad de una partícula en el instante t (fórmula cerrada: sirve igual si el juego se pausa).
 place(p,t,out){
  const a=t-p.delay;if(a<0||a>p.life){out.on=false;return false}
  let x,y,z;
  if(p.mode===1){if(a<p.tc){const s=Math.pow(1-a/p.tc,1.5);x=p.x0*s;y=p.y0*s;z=p.z0*s;const ang=p.sw*a*s,c=Math.cos(ang),sn=Math.sin(ang),nx=x*c-y*sn;y=x*sn+y*c;x=nx}
   else{const b=a-p.tc,f=p.d>0?(1-Math.exp(-p.d*b))/p.d:b;x=p.vx*f;y=p.vy*f-.5*p.g*b*b;z=p.vz*f}}
  else{const f=p.d>0?(1-Math.exp(-p.d*a))/p.d:a;x=p.vx*f;y=p.vy*f-.5*p.g*a*a;z=p.vz*f;
   if(p.sw){const ang=p.sw*a,c=Math.cos(ang),sn=Math.sin(ang),nx=x*c-y*sn;y=x*sn+y*c;x=nx}
   x+=p.x0;y+=p.y0;z+=p.z0;if(p.wob){x+=Math.sin(p.wf*a+p.ph)*p.wob;z+=Math.cos(p.wf*a*.8+p.ph)*p.wob*.6}if(p.swy){const ang=p.swy*a+p.ph,c=Math.cos(ang),sn=Math.sin(ang),nx=x*c-z*sn;z=x*sn+z*c;x=nx}}
  if(p.floor!==null&&y<p.floor)y=p.floor;
  const k=a/p.life,fade=Math.min(1,p.fadeIn>0?k/p.fadeIn:1,p.fadeOut>0?(1-k)/p.fadeOut:1);
  out.x=x;out.y=y;out.z=z;out.k=k;out.a=a;out.fade=Math.max(0,fade);out.size=(p.s0+(p.s1-p.s0)*k)*out.fade;out.alpha=p.a*out.fade*(p.tw?.65+.35*Math.sin(p.tw*a+p.ph):1);out.on=true;return true;
 }
 update(dt,visible=true){
  this.age+=dt;const t=this.age,def=this.def;this.group.visible=!!def&&visible&&t<this.dur;if(!this.group.visible)return;
  const worldScale=this.group.scale.x;this.sparks.pixelScale(worldScale);this.mist.pixelScale(worldScale);this.boltGlow.pixelScale(worldScale);
  const out={},dummy=this.dummy||(this.dummy=new T.Object3D()),velocity=this.velocity||(this.velocity=new T.Vector3());
  for(const [name,system] of [['spark',this.sparks],['mist',this.mist]]){let n=0;for(const p of this.live[name]){if(!this.place(p,t,out))continue;system.set(n++,out.x,out.y,out.z,Math.max(.001,out.size)*(name==='spark'?SPARK:MIST),p.cr,p.cg,p.cb,out.alpha)}system.flush(n)}
  for(const [kind,mesh] of Object.entries(this.meshes)){const list=this.live[kind];for(let i=0;i<list.length;i++){const p=list[i];if(!this.place(p,t,out)){dummy.position.set(0,-999,0);dummy.scale.setScalar(0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);continue}
    dummy.position.set(out.x,out.y,out.z);
    if(p.align){velocity.set(p.vx,p.vy-p.g*out.a,p.vz).normalize();dummy.quaternion.setFromUnitVectors(UP,velocity)}else dummy.rotation.set(p.rx+p.vrx*out.a,p.ry+p.vry*out.a,p.rz+p.vrz*out.a);
    const flap=p.flap?.4+.6*Math.abs(Math.cos(p.flap*out.a+p.ph)):1;dummy.scale.set(out.size*p.sx*MESH*flap,out.size*p.sy*MESH,out.size*MESH);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)}
   mesh.instanceMatrix.needsUpdate=true}
  this.rings.forEach((ring,i)=>{const conf=def.rings[i];if(!conf){ring.visible=false;return}const a=t-conf[0];ring.visible=a>0;if(a<=0)return;ring.scale.setScalar(Math.max(.01,a*conf[1]));ring.position.z=-this.end*i*.3;ring.material.opacity=Math.max(0,.85-a*.5)});
  this.core.scale.setScalar(.2+Math.min(t,.16)*20);this.core.material.opacity=Math.max(0,.95-t*3);
  this.bloom.scale.setScalar(5+t*22);this.bloom.material.opacity=Math.max(0,.85-t*1.5);
  this.light.intensity=Math.max(0,(def.light||140)*(1-t/1.3))*(def.flicker?.75+.25*Math.sin(t*47):1)*(def.strobe?(Math.sin(t*60)>0?1.2:.2):1);
  if(def.pulses)for(const at of def.pulses)if(t>at&&t<at+.35)this.light.intensity=Math.max(this.light.intensity,def.light*(1-(t-at)/.35));
  this.updateLabel(t);if(def.dragon)this.updateDragon(t);if(def.bolts)this.updateBolts(t);if(def.void)this.updateHole(t);
 }
 updateLabel(t){
  const def=this.def;if(!def.label||!this.label.material.map)return;const start=.06,life=this.dur-.6,k=t-start;
  this.label.visible=k>0&&k<life;this.splat.visible=this.label.visible&&def.label!=='pixels';
  if(!this.label.visible)return;
  const pop=Math.min(1,k/.28),over=1+Math.pow(1-pop,2)*1.6*Math.sin(pop*Math.PI*1.2+Math.PI),scale=Math.max(.01,pop<1?pop*1.18:1.18-(Math.min(1,(k-.28)/.3))*.18),fade=Math.max(0,Math.min(1,(life-k)/.5));
  const base=def.label==='pixels'?[11,4.1]:[17,6.4],wobble=1+Math.sin(k*9)*.025*Math.max(0,1-k);
  this.label.scale.set(base[0]*scale*wobble*over*.9,base[1]*scale*wobble*.9/Math.max(.6,over*.9),1);this.label.position.set(0,2.2+Math.min(1,k*3)*.6,this.dir*6);this.label.material.opacity=fade;
  if(def.label!=='pixels'){const sp=Math.max(.01,Math.min(1,k/.22));this.splat.scale.set(25*sp*(1+Math.sin(k*5)*.02),25*sp*(.8+.2*Math.min(1,k*4)),1);this.splat.position.set(0,2,this.dir*5.5);this.splat.material.opacity=fade;this.splat.material.rotation=Math.sin(k*1.5)*.06}
 }
 updateDragon(t){
  // Cuerpo serpenteante: cada segmento sigue la trayectoria de la cabeza con retraso, orientado según la tangente y con espinas doradas en el lomo.
  const dummy=this.dummy,fadeOut=Math.min(1,Math.max(0,(this.dur-.4-t)/.6)),A=this.dA||(this.dA=new T.Vector3()),B=this.dB||(this.dB=new T.Vector3()),Z=new T.Vector3(0,0,1);
  for(let j=0;j<DRAGON_SEGMENTS;j++){
   const tau=t-.1-j*.032,k=j/DRAGON_SEGMENTS;
   if(tau<0||fadeOut<=0){dummy.position.set(0,-999,0);dummy.scale.setScalar(0);dummy.updateMatrix();this.dragonBody.setMatrixAt(j,dummy.matrix);this.dragonSpines.setMatrixAt(j,dummy.matrix);continue}
   const p=this.path(tau),a=this.path(tau-.03),b=this.path(tau+.03),thick=(1.05-.88*Math.pow(k,.75))*(1+.05*Math.sin(j*.8-t*9))*fadeOut*1.25;
   A.set(b.x-a.x,b.y-a.y,b.z-a.z).normalize();
   dummy.position.set(p.x,p.y,p.z);dummy.quaternion.setFromUnitVectors(Z,A);dummy.scale.set(thick,thick,1.15);dummy.updateMatrix();this.dragonBody.setMatrixAt(j,dummy.matrix);
   if(j%3===0){B.set(0,1,0).addScaledVector(A,-.55).normalize();dummy.position.set(p.x,p.y+thick*.42,p.z);dummy.quaternion.setFromUnitVectors(UP,B);const s=thick*(1.15-.5*k);dummy.scale.set(s,s,s)}else dummy.scale.setScalar(0);
   dummy.updateMatrix();this.dragonSpines.setMatrixAt(j,dummy.matrix);
  }
  this.dragonBody.instanceMatrix.needsUpdate=true;this.dragonSpines.instanceMatrix.needsUpdate=true;
  const head=this.path(t),ahead=this.path(t+.05);this.dragonHead.position.set(head.x,head.y,head.z);this.dragonHead.lookAt(ahead.x,ahead.y,ahead.z);this.dragonHead.scale.setScalar(Math.max(.01,1.9*fadeOut));this.dragonHead.visible=fadeOut>0;
  const {jaw,whiskers}=this.dragonHead.userData;jaw.rotation.x=.24+Math.sin(t*9)*.13;whiskers.rotation.z=Math.sin(t*5)*.07;whiskers.rotation.x=Math.sin(t*4+1)*.05;
 }
 updateBolts(t){
  if(t-this.boltAt>.05){this.boltAt=t;this.boltShapes=[];const dir=this.dir;for(let b=0;b<this.boltCount;b++){const start=[rnd(-7,7),9,dir*rnd(0,10)],end=[rnd(-10,10),-2.5,dir*rnd(2,16)],pts=[];for(let k=0;k<=this.boltSegs;k++){const u=k/this.boltSegs,j=k===0||k===this.boltSegs?0:1;pts.push([start[0]+(end[0]-start[0])*u+rnd(-1.1,1.1)*j,start[1]+(end[1]-start[1])*u,start[2]+(end[2]-start[2])*u+rnd(-1.1,1.1)*j])}this.boltShapes.push(pts)}}
  let v=0,g=0;this.boltShapes.forEach((pts,b)=>{const at=.04+b*.17,active=t>at&&t<at+.42&&Math.sin(t*95+b*7)>-.45;if(!active)return;
   for(let k=0;k<this.boltSegs;k++){for(const q of [pts[k],pts[k+1]]){this.boltPositions[v++]=q[0];this.boltPositions[v++]=q[1];this.boltPositions[v++]=q[2]}const q=pts[k];this.boltGlow.set(g++,q[0],q[1],q[2],2.6,.55,.7,1,.55)}});
  this.bolts.geometry.setDrawRange(0,v/3);this.bolts.geometry.attributes.position.needsUpdate=true;this.boltGlow.flush(g);
 }
 updateHole(t){
  const tc=1.25,grow=t<tc?Math.pow(t/tc,1.4):Math.max(0,1-(t-tc)*4);this.hole.scale.setScalar(Math.max(.001,grow*1.7));this.hole.visible=grow>.001;
  this.disk.visible=this.hole.visible;this.disk.scale.setScalar(Math.max(.001,grow*3.1));this.disk.rotation.set(1.15,0,t*5);this.disk.material.opacity=.95;
  const burst=t-tc;if(burst>0&&burst<.3){this.core.visible=true;this.core.scale.setScalar(2+burst*40);this.core.material.opacity=Math.max(0,.9-burst*3)}else this.core.visible=false;
 }
}
