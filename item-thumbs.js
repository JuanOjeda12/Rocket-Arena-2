// Iconos de los objetos: un render pequeño del OBJETO SOLO (no del coche con el objeto puesto):
//  · coches → el coche · decals → la imagen plana del decal · pintura/acabado → una esfera de muestra
//  · coronas/techos, ruedas y turbos → la pieza suelta · explosiones de gol → la explosión en la portería
// Usa su propio renderer pequeño (no toca el del juego) y genera cada imagen una sola vez, de una en una.
import * as T from './vendor/three.module.js';
import {createVehicle} from './vehicle-view.js?v=final2';
import {GoalEffects} from './goal-effects.js?v=final2';
import {createCarCosmetics,DECALS,FINISH,finishTexture} from './car-cosmetics.js?v=final2';
import {createBoostVisual} from './boost-visual.js?v=final2';
import {itemById,DEFAULT_COSMETICS} from './item-catalog.js?v=final2';
const W=256,H=176;
export const THUMB_CATEGORIES=new Set(['body','decal','paint','finish','topper','wheels','boost','goalExplosion']);
const BODY_SHOT=[[3.9,1.5,-4.1],[0,.55,0],30];
export function createThumbs(getProfile){
 let ctx=null;const cache=new Map(),queue=[];let running=false;
 function init(){
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(1);renderer.setSize(W,H,false);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.setClearColor(0x000000,0);
  const scene=new T.Scene();scene.add(new T.HemisphereLight(0xe6f4ff,0x30404e,2.6));
  const key=new T.DirectionalLight(0xffffff,3.4);key.position.set(4,7,-3);scene.add(key);const fill=new T.DirectionalLight(0x9fc8ff,1.4);fill.position.set(-5,3,4);scene.add(fill);
  // entorno de estudio sencillo para que los metales y el cromo reflejen algo
  try{const env=new T.Scene(),g=document.createElement('canvas');g.width=4;g.height=128;const x=g.getContext('2d'),gr=x.createLinearGradient(0,0,0,128);gr.addColorStop(0,'#e8f4ff');gr.addColorStop(.5,'#7f93a6');gr.addColorStop(1,'#1b232c');x.fillStyle=gr;x.fillRect(0,0,4,128);
   const tex=new T.CanvasTexture(g);tex.colorSpace=T.SRGBColorSpace;env.add(new T.Mesh(new T.SphereGeometry(40,24,12),new T.MeshBasicMaterial({map:tex,side:T.BackSide})));
   for(const [px,py,pz,w,h] of [[-14,12,10,16,6],[16,6,-8,10,10],[0,24,0,18,18]]){const p=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide}));p.position.set(px,py,pz);p.lookAt(0,0,0);env.add(p)}
   const pm=new T.PMREMGenerator(renderer);scene.environment=pm.fromScene(env,.03).texture;scene.environmentIntensity=.75;pm.dispose()}catch(e){console.warn('entorno de iconos',e)}
  const veh=createVehicle(scene);veh.root.position.set(0,.17,0);
  const fx=new GoalEffects(scene);fx.group.visible=false;
  // piezas sueltas (techo, ruedas): se montan sobre un coche "vacío" sin carrocería
  const partsRoot=new T.Group(),shell=new T.Group();partsRoot.add(shell);scene.add(partsRoot);
  const dummy=new T.Mesh(new T.BoxGeometry(.5,.01,.5),new T.MeshBasicMaterial());dummy.visible=false;shell.add(dummy);
  const parts=createCarCosmetics(partsRoot,{setStyle(){}});
  const boost=createBoostVisual();scene.add(boost.group);
  const swatch=new T.Mesh(new T.SphereGeometry(.5,56,36),new T.MeshPhysicalMaterial());scene.add(swatch);
  ctx={renderer,scene,veh,fx,parts,partsRoot,shell,boost,swatch,cam:new T.PerspectiveCamera(30,W/H,.05,150)};
 }
 const wait=async cond=>{for(let i=0;i<150&&!cond();i++)await new Promise(r=>setTimeout(r,40))};
 // encuadra un objeto desde una dirección (dir) para que ocupe bien la imagen
 function frame(cam,obj,dir,fov,pad=1){
  const box=new T.Box3();obj.updateWorldMatrix(true,true);obj.traverse(o=>{if(o.isMesh&&o.visible)box.union(new T.Box3().setFromObject(o))});if(box.isEmpty())box.setFromObject(obj);
  const c=box.getCenter(new T.Vector3()),r=Math.max(.05,box.getSize(new T.Vector3()).length()/2),d=r*pad/Math.sin(fov/2*Math.PI/180);
  cam.fov=fov;cam.position.copy(c).addScaledVector(dir.clone().normalize(),d);cam.lookAt(c);cam.updateProjectionMatrix();
 }
 // la imagen plana del decal, tal cual se pinta sobre el coche
 function decalImage(item){
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),s=H-16,x0=(W-s)/2;
  const tile=document.createElement('canvas');tile.width=tile.height=256;const draw=DECALS[item.style];if(draw){try{draw(tile.getContext('2d'),item.color||'#ffffff')}catch(e){console.warn('decal',item.id,e)}}
  g.save();g.beginPath();g.roundRect(x0,8,s,s,14);g.clip();const bg=g.createLinearGradient(0,8,0,8+s);bg.addColorStop(0,'#33475c');bg.addColorStop(1,'#1b2836');g.fillStyle=bg;g.fillRect(x0,8,s,s);g.drawImage(tile,x0,8,s,s);g.restore();
  g.strokeStyle='#ffffff30';g.lineWidth=2;g.beginPath();g.roundRect(x0,8,s,s,14);g.stroke();
  return c.toDataURL('image/png');
 }
 async function make(item,profile){
  if(item.category==='decal')return decalImage(item);
  if(!ctx)init();const {renderer,scene,veh,fx,parts,partsRoot,shell,boost,swatch,cam}=ctx;
  veh.setVisible(false,false);partsRoot.visible=false;boost.group.visible=false;swatch.visible=false;fx.group.visible=false;
  const cos={...DEFAULT_COSMETICS};
  if(item.category==='goalExplosion'){
   const look={...profile,cosmetics:{...DEFAULT_COSMETICS,...profile.cosmetics,goalExplosion:item.id}};
   fx.explode(1,look);fx.group.scale.setScalar(.42);for(let k=0;k<11;k++)fx.update(.055,true);
   renderer.setClearColor(0x0a1420,1);cam.fov=40;cam.position.set(-4.5,3.2,42.5);cam.lookAt(0,2.6,50.6);cam.updateProjectionMatrix();renderer.render(scene,cam);renderer.setClearColor(0x000000,0);fx.group.visible=false;
  }else if(item.category==='body'){
   const look={...profile,body:item.id,cosmetics:cos};
   veh.setVisible(true,false);veh.apply(look);await wait(()=>veh.ready);
   veh.flame.visible=false;for(let k=0;k<6;k++)veh.update(k*.07);
   const [p,l,f]=BODY_SHOT;cam.fov=f;cam.position.set(l[0]+(p[0]-l[0])*.66,l[1]+(p[1]-l[1])*.66,l[2]+(p[2]-l[2])*.66);cam.lookAt(...l);cam.updateProjectionMatrix();renderer.render(scene,cam);
  }else if(item.category==='topper'||item.category==='wheels'){
   cos[item.category]=item.id;
   parts.apply(shell,{cosmetics:cos,color:profile.color},{tint:/(?!)/,length:0});
   partsRoot.visible=true;const props=partsRoot.children[1];
   if(item.category==='wheels'&&props){const keep=props.children.filter(o=>o.position.x>0)[0];for(const o of [...props.children])if(o!==keep)props.remove(o);if(keep)keep.position.set(0,0,0)}
   for(let k=0;k<6;k++)parts.update(.3+k*.05);
   partsRoot.updateMatrixWorld(true);
   frame(cam,props||partsRoot,item.category==='wheels'?new T.Vector3(1,.28,.5):new T.Vector3(1,.55,1.1),30,item.category==='wheels'?.62:.8);renderer.render(scene,cam);
  }else if(item.category==='boost'){
   boost.setStyle(item);boost.group.visible=true;for(let k=0;k<10;k++)boost.update(.8+k*.07);
   cam.fov=30;cam.position.set(2.3,.85,2.3);cam.lookAt(0,.12,1.15);cam.updateProjectionMatrix();renderer.render(scene,cam);boost.group.visible=false;
  }else if(item.category==='paint'||item.category==='finish'){
   const m=swatch.material;m.map=null;m.emissiveMap=null;m.emissive.set(0x000000);m.emissiveIntensity=0;m.clearcoat=0;m.color.set('#ffffff');
   if(item.category==='paint'){m.color.set(item.color||'#ffffff');m.roughness=.26;m.metalness=.25;m.clearcoat=0}
   else{const p=FINISH[item.style]||FINISH.gloss;m.roughness=p[0];m.metalness=p[1];m.clearcoat=p[2];m.clearcoatRoughness=.1;
    m.map=finishTexture(item.style);m.color.set(item.variantOf?item.color:'#ffffff');if(p[4]){m.emissive.set(0xffffff);m.emissiveMap=m.map;m.emissiveIntensity=p[4]}}
   m.needsUpdate=true;swatch.visible=true;swatch.rotation.y=.6;swatch.updateMatrixWorld(true);
   frame(cam,swatch,new T.Vector3(.35,.45,1),26,.62);renderer.render(scene,cam);swatch.visible=false;
  }
  return renderer.domElement.toDataURL('image/png');
 }
 // el coche completo de un jugador (modelo, color y cosméticos), para el panel de administración
 async function makeCar(car){
  if(!ctx)init();const {renderer,scene,veh,fx,partsRoot,boost,swatch,cam}=ctx;
  veh.setVisible(true,false);partsRoot.visible=false;boost.group.visible=false;swatch.visible=false;fx.group.visible=false;
  veh.apply({name:'x',body:car.body,color:car.color,cosmetics:{...DEFAULT_COSMETICS,...(car.cos||{})}});await wait(()=>veh.ready);
  veh.flame.visible=false;for(let k=0;k<6;k++)veh.update(k*.07);
  const [p,l,f]=BODY_SHOT;cam.fov=f;cam.position.set(l[0]+(p[0]-l[0])*.66,l[1]+(p[1]-l[1])*.66,l[2]+(p[2]-l[2])*.66);cam.lookAt(...l);cam.updateProjectionMatrix();renderer.render(scene,cam);
  return renderer.domElement.toDataURL('image/png');
 }
 async function pump(){
  if(running)return;running=true;
  while(queue.length){
   const {id,img,car}=queue.shift();if(!img.isConnected)continue;
   if(car){const key='car|'+JSON.stringify(car);try{let url=cache.get(key);if(!url){url=await makeCar(car);cache.set(key,url)}if(img.isConnected){img.onload=()=>{img.classList.add('on');img.previousElementSibling?.classList.add('hide')};img.src=url}}catch(e){console.warn('coche',e)}await new Promise(r=>setTimeout(r,0));continue}
   const item=itemById(id);if(!item)continue;
   const p=getProfile(),key=`${id}|${item.category==='body'?p.color:''}`;
   try{let url=cache.get(key);if(!url){url=await make(item,p);cache.set(key,url)}if(img.isConnected){img.onload=()=>{img.classList.add('on');img.previousElementSibling?.classList.add('hide')};img.src=url}}catch(e){console.warn('icono',id,e)}
   await new Promise(r=>setTimeout(r,0));
  }
  running=false;
 }
 return{
  // busca las <img data-thumb="id"> pendientes dentro de un contenedor y las rellena poco a poco
  fill(root){for(const img of root.querySelectorAll('img[data-thumb]:not([data-q])')){img.dataset.q='1';queue.push({id:img.dataset.thumb,img})}
   for(const img of root.querySelectorAll('img[data-car]:not([data-q])')){img.dataset.q='1';try{queue.push({car:JSON.parse(img.dataset.car),img})}catch{}}pump()},
  clear(){cache.clear()}
 };
}
