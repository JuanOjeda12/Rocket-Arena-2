import {incomingShot} from './ball-prediction.js?v=inventory-20261028';
const blank=slot=>({slot,points:0,goals:0,assists:0,saves:0,epicSaves:0,shots:0,touches:0});
export class MatchStats{
 constructor(count){this.rows=Array.from({length:count},(_,i)=>blank(i));this.time=0;this.eventId=0;this.roundReset()}
 roundReset(){this.history=[];this.touchAt=new Map();this.shotAt=new Map()}
 update(before,after,dt,events){
  this.time+=dt;
  for(const car of after.cars){
   if(car.ballTouchAge<0||car.ballTouchAge>dt*1.5||this.time-(this.touchAt.get(car.slot)??-99)<.2)continue;
   this.touchAt.set(car.slot,this.time);const row=this.rows[car.slot];row.touches++;row.points+=2;
   if(this.history.at(-1)?.slot!==car.slot)this.history.push({slot:car.slot,team:car.team,time:this.time});else this.history.at(-1).time=this.time;this.history=this.history.slice(-16);
   if(incomingShot(after.ball,1-car.team)&&this.time-(this.shotAt.get(car.slot)??-99)>2.5){row.shots++;row.points+=10;this.shotAt.set(car.slot,this.time)}
  }
  for(const e of events||[]){if(e.id<=this.eventId)continue;this.eventId=e.id;if(e.type==='save'||e.type==='epic-save'){const row=this.rows[e.slot];if(row){row.saves++;row.epicSaves+=Number(e.type==='epic-save');row.points+=e.type==='epic-save'?75:50}}}
 }
 goal(end){
  const team=end<0?0:1,scorer=[...this.history].reverse().find(h=>h.team===team&&this.time-h.time<15);if(!scorer)return;
  const row=this.rows[scorer.slot];row.goals++;row.points+=100;
  if(this.time-(this.shotAt.get(scorer.slot)??-99)>5){row.shots++;row.points+=10}
  const index=this.history.indexOf(scorer),assist=this.history[index-1];if(assist&&assist.team===team&&assist.slot!==scorer.slot&&this.time-assist.time<10){this.rows[assist.slot].assists++;this.rows[assist.slot].points+=50}
  return scorer.slot;
 }
 snapshot(){return this.rows.map(r=>({...r}))}
}
