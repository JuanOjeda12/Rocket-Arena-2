// Tienda diaria: 8 objetos aleatorios (los mismos para todos) que cambian cada día. Se pagan con créditos.
// La selección sale de la fecha (día UTC), así que no hace falta servidor. El administrador puede excluir objetos del sorteo y retirar objetos de la tienda de hoy.
import {ITEMS} from './item-catalog.js?v=final2';
export const SHOP_SIZE=8;
const PRICE={sport:100,special:300,deluxe:600,import:1000,exotic:1500,blackmarket:2200};
export const priceOf=i=>Math.round((PRICE[i.rarity]||100)*(i.category==='body'?1.5:1));
export const dayKey=(now=Date.now())=>new Date(now).toISOString().slice(0,10);
export const msToNextDay=(now=Date.now())=>{const d=new Date(now);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+1)-now};
// objetos que se pueden vender: los que salen en drops (no los de rango/misión/pase) y no son gratuitos
export const shopPool=()=>ITEMS.filter(i=>!i.noDrop&&i.rarity!=='base').sort((a,b)=>a.id<b.id?-1:1);
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
// Orden barajado del día: excluir un objeto solo lo sustituye por el siguiente; el resto de la tienda no cambia.
export function shuffledPool(day){const p=shopPool(),r=mulberry(hash('rocket-arena-shop-'+day));for(let i=p.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[p[i],p[j]]=[p[j],p[i]]}return p}
// config = {excluded:[ids], removed:{day,ids}}. Un id excluido de un objeto base excluye también todos sus colores.
export function todaysItems(config,now=Date.now()){
 const day=dayKey(now),ex=new Set(config?.excluded||[]),rm=new Set(config?.removed?.day===day?config.removed.ids||[]:[]);
 return shuffledPool(day).filter(i=>!ex.has(i.id)&&!ex.has(i.variantOf)).slice(0,SHOP_SIZE).filter(i=>!rm.has(i.id)).sort((a,b)=>priceOf(b)-priceOf(a)||(a.id<b.id?-1:1));
}
