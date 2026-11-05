import * as T from './vendor/three.module.js';
let glowMap;
export function softGlow(){
 if(glowMap)return glowMap;const size=32,pixels=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const r=Math.hypot((x+0.5-size/2)/(size/2),(y+.5-size/2)/(size/2)),i=(y*size+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=255;pixels[i+3]=Math.round(255*Math.pow(Math.max(0,1-r),1.8))}
 glowMap=new T.DataTexture(pixels,size,size);glowMap.needsUpdate=true;return glowMap;
}
// Comportamiento propio de cada turbo: pulso, parpadeo, tonos del chorro (exterior/medio/interior) y color de las brasas.
const FX={
 ice:{pulse:.8},ion:{pulse:1.3,inner:.7},blue:{pulse:1.05,inner:.88},
 inferno:{pulse:1.25,jitter:.24,jf:57,tones:'fire',emberSize:.17},
 electric:{jitter:.32,jf:150,inner:.96,emberSpeed:2.6,twinkle:true},
 toxic:{pulse:.9,jitter:.08,jf:9,tones:'toxic',emberSize:.2,emberSpeed:.8},
 sakura:{ember:'sakura',emberSize:.22,emberSpeed:.55,pulse:.9},
 plasma:{tones:'two',jitter:.08,jf:33},
 gold:{inner:.92,twinkle:true,emberSize:.18},
 galaxy:{hue:'range',ember:'galaxy',twinkle:true,pulse:1.1,emberSize:.17},
 confetti:{ember:'confetti',emberSize:.21,emberSpeed:1.3},
 stars:{twinkle:true,emberSize:.2},
 void:{tones:'void',jitter:.2,jf:90,ember:'void',emberSize:.17},
 rainbow:{hue:'full'},
 ember:{pulse:.95,emberSize:.19,emberSpeed:.9,tones:'fire',jitter:.12,jf:31},sparkler:{twinkle:true,emberSize:.23,emberSpeed:2,ember:'sparkle',jitter:.06,jf:70},
 neon:{tones:'two',jitter:.05,jf:44,inner:.9},ghost:{pulse:.9,jitter:.14,jf:15,inner:.95,emberSize:.16,emberSpeed:.6,ember:'ghost'},
 aqua:{ember:'aqua',emberSize:.22,emberSpeed:.7,pulse:.95},candy:{tones:'candy',ember:'candy',emberSize:.2,jitter:.05,jf:20},snow:{ember:'snow',emberSize:.2,emberSpeed:.45,inner:.9,pulse:.9},
 magma:{tones:'fire',jitter:.2,jf:23,emberSize:.2,emberSpeed:.6,pulse:1.15},solar:{tones:'fire',pulse:1.3,jitter:.15,jf:40,twinkle:true},
 lightning:{jitter:.38,jf:170,inner:.97,twinkle:true,emberSpeed:3,emberSize:.17},pixel:{ember:'pixel',emberSize:.25,emberSpeed:1.2,jitter:.1,jf:12},
 comet:{pulse:1.45,inner:.95,emberSize:.17,emberSpeed:1.6,ember:'ghost'},aurora:{hue:'range',ember:'galaxy',pulse:1.05,twinkle:true,emberSpeed:.8}
};
export function createBoostVisual(){
 const group=new T.Group(),jets=[];let style=null,fx={},rgbColor=[1,.62,.22];const baseColor=new T.Color('#ff9a38'),work=new T.Color(),tone=new T.Color(),hsl={};
 const toRGB=c=>{const h=c.getHex();return[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255]};
 const WHITE=new T.Color(1,1,1),BLACK=new T.Color(0,0,0);
 const turn=(color,dh,l=null,s=1)=>{color.getHSL(hsl);return color.setHSL((hsl.h+dh+1)%1,Math.min(1,hsl.s*s),l??hsl.l)};
 for(const x of [-.17,.17]){
  const jet=new T.Group();jet.position.set(x,.15,.56);group.add(jet);
  for(const [radius,length,color,opacity] of [[.11,1.12,0xff6a13,.55],[.073,.88,0xffca55,.8],[.042,.48,0xfff4c1,1]]){
   const mesh=new T.Mesh(new T.ConeGeometry(radius,length,8),new T.MeshBasicMaterial({map:softGlow(),color,transparent:true,opacity,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));mesh.rotation.x=Math.PI/2;mesh.position.z=length/2;jet.add(mesh);
  }
  const halo=new T.Sprite(new T.SpriteMaterial({map:softGlow(),color:0xffbd48,transparent:true,opacity:.75,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));halo.scale.set(.5,.5,1);jet.add(halo);jets.push(jet);
 }
 const positions=new Float32Array(48*3),colors=new Float32Array(48*3).fill(1),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('color',new T.BufferAttribute(colors,3));
 const material=new T.PointsMaterial({map:softGlow(),color:0xffa047,vertexColors:true,size:.14,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false});const embers=new T.Points(geometry,material);embers.frustumCulled=false;group.add(embers);
 group.visible=false;
 // Tonos [exterior, medio, interior] del chorro según el estilo.
 function tones(base,time,i){
  const out=work.copy(base),mid=tone;
  if(fx.hue==='full')out.setHSL((time*.22+i*.12)%1,1,.65);
  else if(fx.hue==='range'){base.getHSL(hsl);out.setHSL((hsl.h+Math.sin(time*1.6+i)*.14+1)%1,.85,.62)}
  const result=[out.clone(),null,null];
  if(fx.tones==='fire'){result[1]=turn(out.clone(),.05,.58);result[2]=turn(out.clone(),.12,.86)}
  else if(fx.tones==='toxic'){result[1]=out.clone().lerp(WHITE,.25);result[2]=turn(out.clone(),.08,.82)}
  else if(fx.tones==='candy'){result[1]=out.clone().lerp(WHITE,.75);result[2]=turn(out.clone(),.08,.8)}
  else if(fx.tones==='two'){result[0]=turn(out.clone(),0,.58);result[1]=turn(out.clone(),.3,.62);result[2]=turn(out.clone(),.5,.85)}
  else if(fx.tones==='void'){result[0]=out.clone().lerp(BLACK,.35);result[1]=out.clone();result[2]=out.clone().lerp(WHITE,.65)}
  else{result[1]=out.clone().lerp(WHITE,.4);result[2]=out.clone().lerp(WHITE,fx.inner??.8)}
  return result;
 }
 function emberColor(i,time,target){
  const kind=fx.ember;
  if(kind==='sakura')return target.set(i%3?'#ffb8d6':'#ffffff').lerp(baseColor,i%2?.25:0);
  if(kind==='galaxy'){baseColor.getHSL(hsl);return target.setHSL((hsl.h+Math.sin(i*1.7+time)*.16+1)%1,.85,.68)}
  if(kind==='confetti')return target.setHSL((i*.137+time*.3)%1,.95,.62);
  if(kind==='void')return target.set(i%3?'#e9c6ff':'#ffffff').lerp(baseColor,i%2?.5:.1);
  if(kind==='sparkle')return target.set(i%2?'#ffffff':'#fff0b0').lerp(baseColor,i%3?.15:.5);
  if(kind==='ghost')return target.set('#e8fbff').lerp(baseColor,.25+(i%3)*.1);
  if(kind==='aqua')return target.set(i%2?'#ffffff':'#bff4ff').lerp(baseColor,.35);
  if(kind==='candy')return target.copy(i%2?WHITE:baseColor);
  if(kind==='snow')return target.set('#ffffff').lerp(baseColor,.18);
  if(kind==='pixel')return target.copy(i%2?baseColor:WHITE).lerp(baseColor,i%4===0?0:.1);
  return target.set(1,1,1);
 }
 return{group,
  setStyle(item){style=item;fx=item?.style==='rainbow'&&item.variantOf?{hue:'range'}:FX[item?.style]||{};baseColor.set(item?.color||'#ff9a38');rgbColor=toRGB(baseColor);material.color.copy(baseColor)},
  get rgb(){return rgbColor},
  update(time){
   if(!group.visible)return;
   jets.forEach((jet,i)=>{
    const [outer,mid,inner]=tones(baseColor,time,i),children=jet.children;
    children[0].material.color.copy(outer);children[1].material.color.copy(mid);children[2].material.color.copy(inner);children[3].material.color.copy(outer).lerp(WHITE,.15);
    if(fx.hue&&i===0)rgbColor=toRGB(outer);
    const noise=fx.jitter?Math.sin(time*(fx.jf||60)+i*2.3)*fx.jitter+(Math.random()-.5)*fx.jitter*.6:0,pulse=(fx.pulse||1)*(1+Math.sin(time*71+i*2)*.09)*(1+noise);
    jet.scale.set(1+noise*.35,1+noise*.35,Math.max(.4,pulse));
   });
   material.color.copy(fx.ember?WHITE:baseColor);
   const speed=fx.emberSpeed||1;
   for(let i=0;i<48;i++){const age=(time*1.8*speed+i/48)%1,j=i*3;positions[j]=(i%2?.17:-.17)+Math.sin(i*9.1)*age*.15;positions[j+1]=.15+Math.cos(i*4.2)*age*.12;positions[j+2]=.6+age*1.6;
    emberColor(i,time,work);const fade=fx.ember?1:1;colors[j]=work.r*fade;colors[j+1]=work.g*fade;colors[j+2]=work.b*fade}
   material.size=(fx.emberSize||.14)*(fx.twinkle?.85+.35*Math.sin(time*13):1);
   geometry.attributes.position.needsUpdate=true;geometry.attributes.color.needsUpdate=true;
  },
  dispose(){group.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})}};
}
