// Conductor sencillo por reglas, para Bronce, Plata y la parte baja de Oro.
// No usa ningún modelo entrenado. Escala de "q": 0 = Bronce I, 1 = Oro I.
import {botRankFromSkill} from './bot-difficulty.js?v=rl-20261031';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class BasicBot{
 constructor(skill=.06){this.skill=skill;this.reset()}
 reset(){this.time=0;this.nextThink=0;this.controls={};this.intent='Aprendiendo';this.jumpAt=-10;this.stuck=0;this.backUntil=0;this.lastPos=null}
 update(state,dt){
  this.time+=dt;if(this.time<this.nextThink)return this.controls;
  const rank=botRankFromSkill(this.skill),q=clamp(rank/2.2,0,1),car=state.opponent,ball=state.ball;
  // Reacción: ~0.5 s en Bronce, ~0.14 s al llegar a Oro (con algo de variación).
  this.nextThink=this.time+(.52*(1-q)+.14*q)*(.85+Math.random()*.3);
  if(!car||car.isDemoed)return this.controls={};
  const p=car.position,b=ball.position,f=car.forward,speed=Math.hypot(car.velocity[0],car.velocity[2]),distance=Math.hypot(b[0]-p[0],b[2]-p[2]);
  // Anticipa el balón un poco más cuanto mayor es el rango y falla menos el punto de apunte.
  const lead=rank<.6?0:Math.min(.5,.08+q*.4),error=2.4*Math.pow(1-q,2)+.12;
  let x=b[0]+ball.velocity[0]*lead+Math.sin(this.time*1.15+car.slot*2.4)*error;
  let z=b[2]+ball.velocity[2]*lead+Math.cos(this.time*.8+car.slot)*error*.5;
  // Desde Plata intenta ponerse del lado de su portería en vez de embestir siempre de frente.
  if(rank>=.9&&p[2]>b[2]-.7&&distance<14){x=b[0]+(p[0]>b[0]?1:-1)*(2.4+error);z=b[2]-2.6}
  if(rank>=1.4&&state.targetOverride&&distance>10){x=state.targetOverride[0];z=state.targetOverride[2]}
  // Atascado contra una pared o dentro de la portería: marcha atrás un instante girando.
  if(this.lastPos&&car.onGround&&Math.hypot(p[0]-this.lastPos[0],p[2]-this.lastPos[2])<.25)this.stuck+=this.time-this.lastT;else this.stuck=0;
  this.lastPos=[p[0],p[2]];this.lastT=this.time;
  if(this.stuck>1.1){this.backUntil=this.time+1.1;this.stuck=0}
  if(this.time<this.backUntil)return this.controls={throttle:-1,steer:(Math.sin(this.time*7)>0?1:-1),pitch:0,yaw:0,roll:0,jump:false,boost:false,handbrake:false};
  const dx=x-p[0],dz=z-p[2],angle=Math.atan2(f.x*dz-f.z*dx,f.x*dx+f.z*dz),turn=Math.abs(angle);
  // Velocidad objetivo: 8 m/s (Bronce) -> 19 m/s (Oro I). Frena para girar.
  const desired=8+q*11;let throttle=speed>desired?0:(.6+q*.4);
  if(turn>1.3)throttle*=.5;
  const steer=clamp(angle*(1.15+q*1.9),-1,1);
  let jump=false;
  if(rank>=1.5&&car.onGround&&distance<2.4&&b[1]>1.2&&b[1]<2.8&&turn<.45&&this.time-this.jumpAt>2){jump=true;this.jumpAt=this.time}
  // Turbo en recta larga, de forma intermitente (más seguido cuanto mayor es el nivel).
  const boost=rank>=1&&car.onGround&&car.boost>12&&distance>9&&turn<.2&&speed<desired+2&&this.time%2.4<(.25+q*.65);
  this.intent=rank<1?'Persigue el balón con errores':'Conducción básica';
  return this.controls={throttle,steer,pitch:car.onGround?0:clamp(-car.forward.y*2,-1,1),yaw:steer,roll:0,jump,boost,handbrake:rank>=1.8&&turn>1.4&&speed>10};
 }
}
