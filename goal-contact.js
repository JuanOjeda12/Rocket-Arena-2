import {ARENA} from './arena-shape.js?v=inventory-20261028';
import {BALL_RADIUS} from './proportions.js?v=inventory-20261028';
export function goalFrameHit(before,after,radius=BALL_RADIUS){
 if(!before||!after)return false;const p=after.position,v=before.velocity,w=after.velocity;
 if(Math.abs(Math.abs(p[2])-ARENA.length)>radius+.35)return false;
 const horizontal=Math.hypot(w[0]-v[0],w[2]-v[2]),vertical=Math.abs(w[1]-v[1]);
 const post=Math.abs(Math.abs(p[0])-ARENA.goal)<radius+.3&&p[1]<ARENA.goalHeight+radius&&horizontal>2.5;
 const bar=Math.abs(p[1]-ARENA.goalHeight)<radius+.3&&Math.abs(p[0])<ARENA.goal+radius&&(horizontal>2.5||vertical>3);
 return post||bar;
}
