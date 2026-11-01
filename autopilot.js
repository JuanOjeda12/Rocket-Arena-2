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
// Dispara al balón hacia la portería (gx,gz): primero se coloca detrás del balón y luego embiste.
export function shoot(car,ball,gx,gz,opts={}){
 const bx=ball[0],bz=ball[2],dx=gx-bx,dz=gz-bz,l=Math.hypot(dx,dz)||1,ux=dx/l,uz=dz/l;
 const ax=bx-ux*6,az=bz-uz*6;
 // ¿está ya detrás del balón y alineado con la portería?
 const rx=car.position[0]-bx,rz=car.position[2]-bz,behind=rx*ux+rz*uz<-2,lateral=Math.abs(rx*uz-rz*ux);
 const target=behind&&lateral<5?[bx+ux*3,bz+uz*3]:[ax,az];
 return drive(car,target[0],target[1],{speed:opts.speed??13,boost:false});
}
