import {advanceCelebration,PODIUM_SECONDS} from './celebration.js?v=inventory-20261028';
import {ReplayBuffer} from './match-flow.js?v=inventory-20261028';
const visual=s=>({cars:s.cars.map(c=>({...c,position:[...c.position],quaternion:[...c.quaternion]})),ball:{...s.ball,position:[...s.ball.position],quaternion:[...s.ball.quaternion]},pads:s.pads});
export class PostMatch{
 constructor(){this.reset()}
 reset(){this.matchId=null;this.history=new ReplayBuffer(7);this.clips=[];this.seen=new Set();this.time=0;this.captureAt=0;this.pending=[];this.finished=false;this.clock=0;this.mode='highlights';this.poses=new Map()}
 observe(state,dt){
  if(state.matchId!==this.matchId){this.reset();this.matchId=state.matchId}
  if(this.finished)return;
  if(state.phase==='live'){
   this.time+=dt;this.captureAt-=dt;if(this.captureAt<=0){this.history.record(this.time,visual(state),true);this.captureAt=1/12}
  }
  for(const event of state.events||[]){
   if(this.seen.has(event.id))continue;this.seen.add(event.id);
   if(event.type==='goal'){this.history.record(this.time,visual(state),true);this.addClip('GOL',3)}
   else if(['save','epic-save'].includes(event.type))this.pending.push({due:this.time+1.5,title:event.type==='epic-save'?'SALVADA ÉPICA':'SALVADA',weight:event.type==='epic-save'?3:2});
  }
  this.pending=this.pending.filter(p=>{if(this.time<p.due)return true;this.addClip(p.title,p.weight);return false});
 }
 addClip(title,weight){const clip=this.history.clip();if(clip.duration<.25)return;this.clips.push({...clip,title,weight});if(this.clips.length>6){const lowest=this.clips.reduce((a,c,i)=>c.weight<this.clips[a].weight?i:a,0);this.clips.splice(lowest,1)}}
 finish(state,slot){
  if(this.finished)return;for(const p of this.pending)this.addClip(p.title,p.weight);this.pending=[];
  if(!this.clips.length)this.addClip('MEJORES JUGADAS',1);
  this.finished=true;this.clock=0;this.mode='podium';this.state=structuredClone(state);this.slot=slot;
  this.winner=state.score[0]>state.score[1]?0:1;
  this.winners=state.cars.filter(c=>c.team===this.winner).sort((a,b)=>(state.stats.find(s=>s.slot===b.slot)?.points||0)-(state.stats.find(s=>s.slot===a.slot)?.points||0));
 }
 update(dt,input={},shared=null){
  if(!this.finished)return null;
  this.clock=shared?shared.time:this.clock+dt;
  this.mode=this.clock<PODIUM_SECONDS?'podium':'highlights';
  if(this.mode==='highlights'){
   const duration=this.clips.reduce((sum,c)=>sum+c.duration/.8+.6,0);
   let at=duration?(this.clock-PODIUM_SECONDS)%duration:0;
   for(let index=0;index<this.clips.length;index++){
    const clip=this.clips[index],length=clip.duration/.8+.6;
    if(at<length)return{mode:'highlights',title:clip.title,clip:index,sample:ReplayBuffer.sample(clip,Math.min(clip.duration,at*.8))};at-=length;
   }
   return{mode:'highlights',title:'PARTIDO TERMINADO',clip:-1};
  }
  const pose=shared?.poses?.[this.slot]||advanceCelebration(this.poses.get(this.slot),input,dt);this.poses.set(this.slot,pose);
  return{mode:'podium',title:'EQUIPO GANADOR',pose,poses:shared?.poses||Object.fromEntries(this.poses),progress:Math.min(1,this.clock/1.2)};
 }
 accolades(car){
  const s=this.state?.stats.find(s=>s.slot===car.slot)||{},out=[];
  if(s.goals)out.push({title:'GOLEADOR',detail:s.goals+' goles'});
  if(s.saves)out.push({title:s.epicSaves?'GUARDIÁN ÉPICO':'GUARDIÁN',detail:s.saves+' salvadas'});
  if(s.shots)out.push({title:'ARTILLERO',detail:s.shots+' tiros a portería'});
  if(s.assists)out.push({title:'ESTRATEGA',detail:s.assists+' asistencias'});
  if(out.length<2)out.push({title:'ACTIVO',detail:(s.touches||0)+' toques de balón'});
  return out.slice(0,2);
 }
 achievement(car){const s=this.state?.stats.find(s=>s.slot===car.slot)||{},mvp=this.winners?.[0]?.slot===car.slot;
  return mvp?'MVP · '+(s.points||0)+' PTS':s.saves?'GUARDIÁN · '+s.saves+' SALVADAS':s.goals?'GOLEADOR · '+s.goals+' GOLES':s.assists?'ASISTENTE · '+s.assists+' ASIST.':'COMPAÑERO DE EQUIPO';
 }
}
