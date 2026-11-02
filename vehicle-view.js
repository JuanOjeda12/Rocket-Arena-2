import {createCarCosmetics} from './car-cosmetics.js?v=final2';
import * as T from './vendor/three.module.js';import {GLTFLoader} from './vendor/GLTFLoader.js';
import {carById,cleanProfile} from './catalog.js?v=final2';import {OCTANE_SCALE,OCTANE_FORWARD_OFFSET} from './proportions.js?v=inventory-20261028';
import {createBoostVisual} from './boost-visual.js?v=rl-20261031';
const cache=new Map(),loader=new GLTFLoader();
function source(spec){if(!cache.has(spec.id))cache.set(spec.id,loader.loadAsync(spec.path).then(g=>g.scene).catch(e=>{cache.delete(spec.id);throw e}));return cache.get(spec.id)}
export function createVehicle(scene){
 const root=new T.Group(),shell=new T.Group();root.add(shell);scene.add(root);
 const fallback=new T.Mesh(new T.BoxGeometry(.8,.4,1.2),new T.MeshStandardMaterial({color:0x248bff}));fallback.position.y=.2;shell.add(fallback);
 const boost=createBoostVisual(),flame=boost.group;root.add(flame);const cosmeticView=createCarCosmetics(root,boost);
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const context=canvas.getContext('2d'),map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 const label=new T.Sprite(new T.SpriteMaterial({map,transparent:true}));label.scale.set(1.7,.425,1);scene.add(label);label.visible=false;
 let localBounds=new T.Box3(new T.Vector3(-.4,0,-.6),new T.Vector3(.4,.4,.6));const supportPoint=new T.Vector3();
 let profile=null,body='',token=0,disposed=false,ready=false;
 function tint(){if(profile)cosmeticView.apply(shell,profile,carById(profile.body))}
 function setLabel(){context.clearRect(0,0,256,64);context.fillStyle='#102538e8';context.fillRect(0,0,256,64);context.fillStyle=profile.color;context.fillRect(0,58,256,6);context.fillStyle='#fff';context.font='bold 27px Arial';context.textAlign='center';context.fillText(profile.name,128,41,245);map.needsUpdate=true}
 function apply(next){
  if(profile&&profile.name===next.name&&profile.body===next.body&&profile.color===next.color&&profile.human===!!next.human&&JSON.stringify(profile.cosmetics)===JSON.stringify(cleanProfile(next).cosmetics))return;
  next={...cleanProfile(next),human:!!next.human};
  const change=body!==next.body;profile=next;setLabel();if(!change){tint();return}
  body=next.body;ready=false;const current=++token,spec=carById(body);
  (async()=>{try{const template=await source(spec);if(disposed||current!==token)return;const model=template.clone(true);model.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.castShadow=true;o.receiveShadow=true;if(o.material.map)o.material.map.anisotropy=4}});
   const normalized=new T.Group();normalized.add(model);model.rotation.y=spec.rotation;
   if(spec.id==='octane'){model.scale.setScalar(OCTANE_SCALE);model.position.set(0,-.15,-OCTANE_FORWARD_OFFSET)}
   else{model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),k=spec.length/Math.max(size.x,size.z);normalized.scale.setScalar(k);normalized.position.set(-center.x*k,-.17-bounds.min.y*k,-center.z*k-.07)}
   normalized.updateMatrixWorld(true);localBounds=new T.Box3().setFromObject(normalized);
   shell.traverse(o=>{if(o!==fallback)o.material?.dispose()});shell.clear();shell.add(normalized);ready=true;tint();
  }catch(e){console.error('Modelo no disponible: '+spec.name,e)}})();
 }
 return{root,flame,label,apply,groundHeight(quaternion){let low=Infinity;for(const x of [localBounds.min.x,localBounds.max.x])for(const y of [localBounds.min.y,localBounds.max.y])for(const z of [localBounds.min.z,localBounds.max.z])low=Math.min(low,supportPoint.set(x,y,z).applyQuaternion(quaternion).y);return -low},get ready(){return ready},get boostRGB(){return boost.rgb},setVisible(v,showLabel=true){root.visible=v;label.visible=v&&showLabel},update(time=0){label.position.copy(root.position).add(new T.Vector3(0,1.25,0));boost.update(time);cosmeticView.update(time)},dispose(){disposed=true;token++;scene.remove(root,label);shell.traverse(o=>o.material?.dispose());boost.dispose();cosmeticView.dispose();map.dispose();label.material.dispose()}};
}
