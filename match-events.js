import {incomingShot} from './ball-prediction.js?v=inventory-20261028';
export class MatchEvents{
 constructor(){this.serial=0;this.time=0;this.list=[];this.resetCounts={};this.resetRound()}
 resetRound(){this.pending=[];this.nextThreat=0;this.threats=new Map();this.lastAward=new Map();this.contactCooldown=new Map();this.list=[]}
 emit(type,details){const event={id:++this.serial,type,...details};this.list.push(event);this.list=this.list.slice(-12);return event}
 goal(end,position,slot=null){this.pending=[];this.emit('goal',{slot,end,position:[...position],team:end<0?0:1})}
 update(before,after,dt){
  this.time+=dt;
  if(after.goal){this.pending=[];return}
  if(this.time>=this.nextThreat){this.nextThreat=this.time+.05;for(const team of [0,1]){const shot=incomingShot(before.ball,team);if(shot)this.threats.set(team,{shot,time:this.time,position:[...before.ball.position]})}}
  for(const car of after.cars){
   const previous=before.cars.find(c=>c.slot===car.slot);
   if(car.wheelBallContacts>=3&&!(previous?.wheelBallContacts>=3)&&car.hasFlip){this.resetCounts[car.slot]=(this.resetCounts[car.slot]||0)+1;this.emit('flip-reset',{slot:car.slot,position:[...car.position]})}
   if(car.ballTouchAge<0||car.ballTouchAge>dt*1.5||car.isDemoed||this.time-(this.contactCooldown.get(car.slot)??-99)<.12)continue;
   this.contactCooldown.set(car.slot,this.time);
   const recent=this.threats.get(car.team),shot=incomingShot(before.ball,car.team)||(recent&&this.time-recent.time<.12&&Math.hypot(...before.ball.position.map((v,i)=>v-recent.position[i]))<5?recent.shot:null);
   if(!shot||this.time-(this.lastAward.get(car.slot)??-99)<2.5)continue;
   this.pending=this.pending.filter(p=>p.team!==car.team);this.threats.delete(car.team);
   this.pending.push({slot:car.slot,team:car.team,due:this.time+.1,deadline:this.time+Math.max(.35,shot.time)+.25,epic:shot.time<.7||car.position[2]*shot.end>45,position:[...car.position]});
  }
  const keep=[];
  for(const save of this.pending){
   if(this.time<save.due){keep.push(save);continue}
   const still=incomingShot(after.ball,save.team);
   if(still&&this.time<save.deadline){keep.push(save);continue}
   if(!still&&this.time-(this.lastAward.get(save.slot)??-99)>2.5){this.emit(save.epic?'epic-save':'save',{slot:save.slot,team:save.team,position:save.position});this.lastAward.set(save.slot,this.time)}
  }
  this.pending=keep;
 }
}
