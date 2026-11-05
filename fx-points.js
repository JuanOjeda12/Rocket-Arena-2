// Soft additive point sprites with per-particle size and RGBA (used by goal explosions and the drop-opening stage).
import * as T from './vendor/three.module.js';
import {softGlow} from './boost-visual.js?v=final2';
const VERTEX='attribute vec4 color4;attribute float size;uniform float scale;varying vec4 vColor;void main(){vColor=color4;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=max(0.,size*scale/max(.05,-mv.z));gl_Position=projectionMatrix*mv;}';
const FRAGMENT='uniform sampler2D map;varying vec4 vColor;void main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(vColor.rgb,t.a*vColor.a);if(gl_FragColor.a<.004)discard;\n#include <colorspace_fragment>\n}';
export function createSoftPoints(capacity,{blending=T.AdditiveBlending}={}){
 const pos=new Float32Array(capacity*3),col=new Float32Array(capacity*4),size=new Float32Array(capacity);
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.BufferAttribute(pos,3));geometry.setAttribute('color4',new T.BufferAttribute(col,4));geometry.setAttribute('size',new T.BufferAttribute(size,1));
 const material=new T.ShaderMaterial({uniforms:{map:{value:softGlow()},scale:{value:700}},vertexShader:VERTEX,fragmentShader:FRAGMENT,transparent:true,depthWrite:false,blending});
 const points=new T.Points(geometry,material);points.frustumCulled=false;geometry.setDrawRange(0,0);
 return{
  points,material,capacity,
  set(i,x,y,z,s,r,g,b,a){if(i>=capacity)return;const j=i*3,k=i*4;pos[j]=x;pos[j+1]=y;pos[j+2]=z;size[i]=s;col[k]=r;col[k+1]=g;col[k+2]=b;col[k+3]=a},
  flush(count){geometry.setDrawRange(0,Math.min(capacity,count));geometry.attributes.position.needsUpdate=true;geometry.attributes.color4.needsUpdate=true;geometry.attributes.size.needsUpdate=true},
  pixelScale(worldScale=1){material.uniforms.scale.value=Math.max(300,(globalThis.innerHeight||720)*Math.min(2,globalThis.devicePixelRatio||1))*.86*worldScale},
  dispose(){geometry.dispose();material.dispose()}
 };
}
