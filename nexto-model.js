// Nexto model and architecture: Rolv-Arild/Necto, CC BY-NC-SA 4.0.
import createModel from './engine/nexto/nexto.js?v=stadium-finale-20261027';
export function nextoActions(){const a=[];
 for(const throttle of [-1,0,1])for(const steer of [-1,0,1])for(const boost of [0,1])for(const handbrake of [0,1]){if(boost&&throttle!==1)continue;a.push([throttle||boost,steer,0,steer,0,0,boost,handbrake])}
 for(const pitch of [-1,0,1])for(const yaw of [-1,0,1])for(const roll of [-1,0,1])for(const jump of [0,1])for(const boost of [0,1]){if(jump&&yaw!==0||pitch===0&&roll===0&&jump===0)continue;a.push([boost,yaw,pitch,yaw,roll,jump,boost,Number(jump===1&&(pitch!==0||yaw!==0||roll!==0))])}return a;
}
let loading;
export function loadNexto(){return loading??=(async()=>{
 const url=new URL('./engine/nexto/weights.bin',import.meta.url),weights=typeof process!=='undefined'&&process.versions?.node?new Uint8Array(await(await import('node:fs/promises')).readFile(url)):new Uint8Array(await fetch(url).then(r=>{if(!r.ok)throw Error('No se pudo cargar la IA Nexto');return r.arrayBuffer()}));
 const m=await createModel();if(weights.byteLength!==444032*4)throw Error('El modelo Nexto está incompleto');m.HEAPF32.set(new Float32Array(weights.buffer,weights.byteOffset,weights.byteLength/4),m._nn_weights()/4);m._nn_init();
 const actions=nextoActions();return{actions,infer(query,entities,count){if(count<1||count>45)throw Error('Cantidad de entidades inválida');m.HEAPF32.set(query,m._nn_query()/4);m.HEAPF32.set(entities,m._nn_entities()/4);return m._nn_infer(count)},logits(){return Array.from(m.HEAPF32.subarray(m._nn_logits()/4,m._nn_logits()/4+90))}};
 })().catch(e=>{loading=null;throw e})}
