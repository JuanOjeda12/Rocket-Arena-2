import * as T from './vendor/three.module.js';
import {itemById} from './item-catalog.js?v=inventory-20261028';
const textures=new Map();
function pattern(style){if(textures.has(style))return textures.get(style);const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');c.clearRect(0,0,256,256);
 if(style==='white'){c.fillStyle='#fff';c.fillRect(0,0,256,256)}
 if(style==='stripes'){c.fillStyle='#f6efcbdd';c.fillRect(65,0,24,256);c.fillRect(104,0,11,256)}
 if(style==='checker'){for(let x=0;x<8;x++)for(let y=0;y<8;y++)if((x+y)%2){c.fillStyle='#e7f4ffd0';c.fillRect(x*32,y*32,32,32)}}
 if(style==='flames'){c.fillStyle='#ffd05bdc';for(let i=0;i<9;i++){c.beginPath();c.moveTo(i*31,256);c.bezierCurveTo(i*31-30,190,i*31+45,180,i*31+12,80+(i%3)*20);c.bezierCurveTo(i*31+75,175,i*31+20,204,i*31+30,256);c.fill()}}
 if(style==='lightning'){c.strokeStyle='#aff0ff';c.lineWidth=8;c.shadowColor='#77cbff';c.shadowBlur=15;for(let i=0;i<5;i++){c.beginPath();c.moveTo(i*60,0);c.lineTo(i*60-30,70);c.lineTo(i*60+13,57);c.lineTo(i*60-20,155);c.lineTo(i*60+20,133);c.lineTo(i*60-5,256);c.stroke()}}
 if(style==='hex'){c.strokeStyle='#c4afffe0';c.lineWidth=3;for(let y=-1;y<8;y++)for(let x=-1;x<7;x++){const cx=x*43+(y%2)*21.5,cy=y*37;c.beginPath();for(let k=0;k<=6;k++){const a=k*Math.PI/3;c.lineTo(cx+25*Math.cos(a),cy+25*Math.sin(a))}c.stroke()}}
 if(style==='nebula'){const g=c.createLinearGradient(0,0,256,256);g.addColorStop(0,'#a36bffdd');g.addColorStop(.45,'#191a6299');g.addColorStop(.7,'#f494dfcc');g.addColorStop(1,'#74caffaa');c.fillStyle=g;c.fillRect(0,0,256,256);c.fillStyle='#eaffff';for(let i=0;i<100;i++)c.fillRect((i*47)%256,(i*i*23)%256,i%4===0?2:1,2)}
 if(style==='carbon'||style==='metal'){c.fillStyle=style==='carbon'?'#778087':'#b7bdc2';c.fillRect(0,0,256,256);for(let i=0;i<256;i+=style==='carbon'?8:3){c.strokeStyle=i%2?'#59616b':'#c2cad0';c.beginPath();c.moveTo(0,i);c.lineTo(256,i);c.stroke();if(style==='carbon'){c.beginPath();c.moveTo(i,0);c.lineTo(i,256);c.stroke()}}}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;textures.set(style,texture);return texture;
}
export function createCarCosmetics(root,boost){
 const props=new T.Group();root.add(props);let decorativeWheels=[];
 const material=(color,glow=false)=>new T.MeshStandardMaterial({color,roughness:.35,metalness:.6,emissive:glow?color:0,emissiveIntensity:glow?.5:0});
 function add(geometry,mat,position=[0,0,0],parent=props){const m=new T.Mesh(geometry,mat);m.position.fromArray(position);m.castShadow=true;parent.add(m);return m}
 function clear(){props.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});props.clear();decorativeWheels=[]}
 function apply(shell,profile,spec){
  clear();root.updateMatrixWorld(true);const wheelCenters=[];
  shell.traverse(o=>{if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];if(o.userData.originalVisible!==undefined)o.visible=o.userData.originalVisible;
   for(const m of mats){if(!m)return;
    if(/rim/i.test(m.name)){const b=new T.Box3().setFromObject(o),center=root.worldToLocal(b.getCenter(new T.Vector3()));wheelCenters.push({center,radius:Math.max(.07,b.max.y-b.min.y)/2});if(profile.cosmetics.wheels!=='wheels-stock'){o.userData.originalVisible??=o.visible;o.visible=false}}
    if(!spec.tint.test(m.name||''))continue;
    m.color.set(itemById(profile.cosmetics.paint)?.color||profile.color);
    const finish=itemById(profile.cosmetics.finish)?.style||'gloss';m.roughness={gloss:.26,matte:.96,carbon:.6,metal:.4,chrome:.1}[finish];m.metalness={gloss:.25,matte:.02,carbon:.35,metal:.78,chrome:1}[finish];
    m.map||=pattern('white');m.userData.decalMap=pattern(itemById(profile.cosmetics.decal)?.style||'none');m.userData.finishMap=pattern(['carbon','metal'].includes(finish)?finish:'white');
    if(!m.userData.cosmeticShaderInstalled){m.userData.cosmeticShaderInstalled=true;m.onBeforeCompile=shader=>{shader.uniforms.arenaDecal={value:m.userData.decalMap};shader.uniforms.arenaFinish={value:m.userData.finishMap};shader.fragmentShader='uniform sampler2D arenaDecal;uniform sampler2D arenaFinish;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n vec4 arenaInk=texture2D(arenaDecal,vMapUv);diffuseColor.rgb=mix(diffuseColor.rgb,arenaInk.rgb,arenaInk.a*.85);diffuseColor.rgb*=mix(vec3(1.),texture2D(arenaFinish,vMapUv).rgb,.3);');m.userData.cosmeticShader=shader};m.customProgramCacheKey=()=> 'arena-paint-v1';m.needsUpdate=true}
    if(m.userData.cosmeticShader){m.userData.cosmeticShader.uniforms.arenaDecal.value=m.userData.decalMap;m.userData.cosmeticShader.uniforms.arenaFinish.value=m.userData.finishMap}
   }
  });
  const topper=itemById(profile.cosmetics.topper);shell.updateWorldMatrix(true,true);const bounds=new T.Box3().setFromObject(shell),roofPoint=root.worldToLocal(new T.Vector3(bounds.getCenter(new T.Vector3()).x,bounds.max.y,bounds.getCenter(new T.Vector3()).z));
  shell.traverse(o=>{if(o.isMesh&&/window|glass|halo/i.test(o.material?.name||'')){const b=new T.Box3().setFromObject(o);roofPoint.copy(root.worldToLocal(new T.Vector3(b.getCenter(new T.Vector3()).x,b.max.y,b.getCenter(new T.Vector3()).z)))}});
  if(topper?.style!=='none'){
   const hat=new T.Group();hat.position.set(roofPoint.x,roofPoint.y+.025,roofPoint.z);props.add(hat);const mat=material(topper.color,true);
   if(topper.style==='halo'){const ring=add(new T.TorusGeometry(.23,.025,8,32),mat,[0,.14,0],hat);ring.rotation.x=Math.PI/2}
   if(topper.style==='cone'){add(new T.ConeGeometry(.17,.4,12),mat,[0,.2,0],hat);add(new T.BoxGeometry(.39,.025,.39),material('#fff'),[0,.01,0],hat)}
   if(topper.style==='cap'){const cap=add(new T.SphereGeometry(.22,14,8,0,Math.PI*2,0,Math.PI/2),mat,[0,0,0],hat);cap.scale.y=.6;add(new T.BoxGeometry(.3,.025,.24),mat,[0,.015,-.19],hat)}
   if(topper.style==='crown'){add(new T.CylinderGeometry(.19,.18,.14,12,true),mat,[0,.07,0],hat);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;add(new T.ConeGeometry(.065,.18,4),mat,[Math.sin(a)*.16,.2,Math.cos(a)*.16],hat)}}
   if(topper.style==='ufo'){const saucer=add(new T.SphereGeometry(.25,16,8),mat,[0,.12,0],hat);saucer.scale.y=.25;add(new T.SphereGeometry(.12,12,8),material('#72c9ff',true),[0,.16,0],hat)}
  }
  const wheel=itemById(profile.cosmetics.wheels);
  if(wheel?.style!=='stock'){
   if(!wheelCenters.length)for(const x of [-.43,.43])for(const z of [-spec.length*.3,spec.length*.3])wheelCenters.push({center:new T.Vector3(x,.04,z),radius:.15});
   for(const {center,radius:r} of wheelCenters){const group=new T.Group();group.position.copy(center);group.position.x+=Math.sign(center.x)*.025;props.add(group);decorativeWheels.push(group);const mat=material(wheel.color,['neon','plasma'].includes(wheel.style)),ring=add(new T.TorusGeometry(r*.92,r*.1,6,20),mat,[0,0,0],group);ring.rotation.y=Math.PI/2;
    if(wheel.style==='disc'){const disc=add(new T.CylinderGeometry(r*.8,r*.8,.025,20),mat,[0,0,0],group);disc.rotation.z=Math.PI/2}
    else for(let i=0;i<(wheel.style==='turbine'?10:6);i++){const a=i*Math.PI*2/(wheel.style==='turbine'?10:6),spoke=add(new T.BoxGeometry(.025,r*1.6,r*.12),mat,[0,0,0],group);spoke.rotation.x=a}
   }
  }
  boost.setStyle?.(itemById(profile.cosmetics.boost));
 }
 return{apply,update(time){for(const wheel of decorativeWheels)wheel.rotation.x=time*.7},dispose:clear};
}
