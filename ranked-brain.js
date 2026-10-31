import {driverWeights} from './bot-difficulty.js?v=rl-20261031';
import {Humanizer} from './bot-humanizer.js?v=rl-20261031';
// Elige qué "conductor" lleva a cada bot competitivo. En lugar de promediar los
// controles de dos IAs (lo que da un híbrido torpe), el bot trabaja por tramos:
// durante 1-3 s sigue UN solo conductor completo y después puede cambiar, con
// probabilidades que dependen del rango. Nunca cambia en pleno salto o dodge.
//   Bronce/Plata  -> conductor sencillo
//   Oro           -> mezcla de sencillo y por reglas
//   Platino+      -> por reglas (con aéreos desde Diamante II)
//   Campeón+      -> por reglas con tramos de Nexto cada vez más largos
//   Leyenda Supers.-> Nexto completo
const TRAMO={basic:1.6,rules:1.6,nexto:2.7}; // duración media (s) de cada tramo
export class RankedBrain{
 constructor(skill=.5){this.skill=skill;this.human=new Humanizer();this.reset()}
 reset(){this.driver=null;this.clock=0;this.until=0;this.switched=false;this.human.reset()}
 setSkill(skill){this.skill=Math.max(0,Math.min(1,Number(skill)||0))}
 weights(){return driverWeights(this.skill)}
 // Devuelve 'basic' | 'rules' | 'nexto'. `switched` es true el tick en que cambia.
 pick(car,dt){
  this.clock+=dt;this.switched=false;const w=this.weights();
  if(w.nexto>=.999){if(this.driver!=='nexto'){this.driver='nexto';this.switched=true}return this.driver}
  const settled=!!car&&car.onGround&&!car.isFlipping&&!car.isDemoed;
  if(this.driver&&(this.clock<this.until||!settled&&this.clock<this.until+4))return this.driver;
  // Los tramos de Nexto duran más; se compensa para que el TIEMPO total repartido coincida con los pesos.
  const a=w.basic/TRAMO.basic,b=w.rules/TRAMO.rules,c=w.nexto/TRAMO.nexto,roll=Math.random()*(a+b+c);
  const next=roll<a?'basic':roll<a+b?'rules':'nexto';
  if(next!==this.driver)this.switched=true;
  this.driver=next;this.until=this.clock+(next==='nexto'?1.8+Math.random()*1.8:.9+Math.random()*1.4);
  return next;
 }
 shape(controls,car,dt,kind){return this.human.apply(controls,this.skill,dt,{onGround:!!car?.onGround,kind:kind==='nexto'?'nexto':'rules'})}
}
