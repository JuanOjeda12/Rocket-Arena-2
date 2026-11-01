// Piloto automático para el tutorial cinematográfico: conduce el coche del jugador entre los avisos.
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function headingError(car,tx,tz){
 const dx=tx-car.position[0],dz=tz-car.position[2];
 return wrap(Math.atan2(car.forward.x*dz-car.forward.z*dx,car.forward.x*dx+car.forward.z*dz));
}
// Devuelve controles hacia (tx,tz). opts: {speed:velocidad deseada m/s, boost:bool}
export function drive(car,tx,tz,opts={}){
 const err=headingError(car,tx,tz),speed=Math.hypot(car.velocity[0],car.velocity[2]),want=opts.speed??22;
 const steer=Math.max(-1,Math.min(1,err*(opts.sign??1)*(speed<8?.9:1.3)));
 const throttle=speed<want?1:speed>want+6?-.4:.3;
 return{throttle,steer,pitch:0,yaw:0,roll:0,jump:false,boost:!!opts.boost&&Math.abs(err)<.3&&car.boost>5,handbrake:false};
}
