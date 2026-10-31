import * as T from './vendor/three.module.js';
import {constrainArenaCamera} from './arena-shape.js?v=inventory-20261028';

// Rocket League-style camera rig. Distances are meters (100 game units = 1m).
// The horizon and orbit heading are independent of the visual car's flip rotation.
export class FollowCamera {
  constructor(camera, {width=40.96,length=51.2,height=20.44}={}) {
    this.camera=camera;
    this.bounds={width,length,height};
    this.heading=0;
    this.orbit=0;
    this.height=0;
    this.ready=false;
    this.position=new T.Vector3();
    this.lookDirection=new T.Vector3(0,0,-1);
    this.settings={distance:2.7,height:1.05,angle:3,horizontalFov:110,stiffness:.5};
    camera.up.set(0,1,0);
    camera.fov=T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(110)/2)/(16/9)));
    camera.updateProjectionMatrix();
    this.baseFov=camera.fov;this.kick=0;this.jitter=new T.Vector3();
  }
  reset() { this.ready=false;this.kick=0; }
  update(dt,{position,quaternion,velocity,ball,onGround=true,isFlipping=false,ballCam=false,speed3=0,boosting=false,shake=0}) {
    const blend=rate=>1-Math.exp(-Math.max(0,dt)*rate);
    const turn=(current,target,amount)=>current+Math.atan2(Math.sin(target-current),Math.cos(target-current))*amount;
    const nose=new T.Vector3(0,0,-1).applyQuaternion(quaternion);
    const up=new T.Vector3(0,1,0).applyQuaternion(quaternion);
    // Freeze heading throughout a dodge. Front flips otherwise invert the
    // flattened nose halfway through, sending the camera in front of the car.
    if (!isFlipping && (onGround || (up.y>.4 && Math.abs(nose.y)<.65))) {
      if(nose.x*nose.x+nose.z*nose.z>.2) {
        const target=Math.atan2(-nose.x,-nose.z);
        this.heading=this.ready?turn(this.heading,target,blend(onGround?10:3)):target;
      }
    }
    const offset=onGround&&!isFlipping?up:new T.Vector3(0,1,0);
    const pivot=position.clone().addScaledVector(offset,this.settings.height);
    const ballOffset=ball.clone().sub(pivot);
    const horizontal=Math.hypot(ballOffset.x,ballOffset.z);
    const ballHeading=horizontal>.25?Math.atan2(-ballOffset.x,-ballOffset.z):this.orbit;
    const desiredHeading=ballCam?ballHeading:this.heading;
    this.orbit=this.ready?turn(this.orbit,desiredHeading,blend(ballCam?9:11)):desiredHeading;
    // Follow vertical movement without copying body pitch/roll or suspension jitter.
    const verticalFollow=onGround&&up.y<.8?50:14;
    this.height=this.ready?T.MathUtils.lerp(this.height,pivot.y,blend(verticalFollow)):pivot.y;
    pivot.y=this.height;
    const forward=new T.Vector3(-Math.sin(this.orbit),0,-Math.cos(this.orbit));
    const speed=Math.hypot(velocity.x,velocity.z);
    const distance=this.settings.distance+Math.min(speed/23,1)*.3*(1-this.settings.stiffness);
    let pitch=-T.MathUtils.degToRad(this.settings.angle);
    if(ballCam && horizontal>.2) {
      const elevation=Math.atan2(ballOffset.y,horizontal);
      const follow=T.MathUtils.smoothstep(Math.abs(elevation),T.MathUtils.degToRad(20),T.MathUtils.degToRad(44));
      pitch=T.MathUtils.lerp(pitch,T.MathUtils.clamp(elevation*.8,-.65,1.05),follow);
    }
    // Orbit under a high ball rather than merely looking up from a fixed offset.
    const direction=forward.clone().multiplyScalar(Math.cos(pitch));direction.y=Math.sin(pitch);
    this.position.copy(pivot).addScaledVector(direction,-distance);
    constrainArenaCamera(this.position);
    // Translation follows immediately; heading/height carry the damping. A
    // world-position lerp would leave the car far away during a fast dodge.
    // Más campo de visión al ir muy rápido (supersónico) y con turbo, como en Rocket League.
    const target=T.MathUtils.smoothstep(speed3,19,22.5)*3.4+(boosting?1.1:0);
    this.kick+=(target-this.kick)*blend(4);
    const fov=this.baseFov+this.kick;
    if(Math.abs(this.camera.fov-fov)>.01){this.camera.fov=fov;this.camera.updateProjectionMatrix()}
    // Temblor muy leve en golpes fuertes y al arrancar el turbo.
    if(shake>0)this.jitter.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(shake*.14);else this.jitter.set(0,0,0);
    this.camera.position.copy(this.position).add(this.jitter);
    this.lookDirection.copy(direction);
    this.camera.up.set(0,1,0);
    this.camera.lookAt(this.position.clone().addScaledVector(direction,10));
    this.ready=true;
  }
}
