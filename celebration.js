// Bounded celebration motion, shared by offline and authoritative network simulation.
export const PODIUM_SECONDS=8;
export function advanceCelebration(p={},input={},dt=0){
 const pose={yaw:0,jump:0,v:0,held:false,flip:0,flipTime:0,flipping:false,boost:false,pitch:0,...p};
 pose.yaw+=(input.steer||input.roll||0)*dt*2.4;
 if(input.jump&&!pose.held){if(pose.jump>.12&&!pose.flipping){pose.flipping=true;pose.flipTime=0}else if(pose.jump===0)pose.v=3.8}
 pose.held=!!input.jump;pose.boost=!!input.boost;
 pose.pitch+=((pose.jump>.08?(input.pitch||0)*.2:0)-pose.pitch)*(1-Math.exp(-dt*15));
 if(pose.flipping){pose.flipTime+=dt;pose.flip=Math.PI*2*Math.min(1,pose.flipTime/.6);if(pose.flipTime>=.6){pose.flip=0;pose.flipping=false}}
 pose.v-=10*dt;pose.jump=Math.max(0,pose.jump+pose.v*dt);if(!pose.jump){pose.v=0;pose.flip=0;pose.flipping=false}
 return pose;
}
