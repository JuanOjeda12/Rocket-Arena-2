// Lightweight decision forecast. Actual collisions are always simulated by RocketSim.
export function predictBall(ball,seconds){
 const p=[...ball.position],v=[...ball.velocity],steps=Math.max(1,Math.ceil(seconds/.04)),dt=seconds/steps;
 for(let i=0;i<steps;i++){
  for(let j=0;j<3;j++)p[j]+=v[j]*dt;
  v[1]-=6.5*dt;
  if(p[1]<.932){p[1]=.932;if(v[1]<0)v[1]*=-.6}
  // Account for drag and the initial sliding loss on grass; otherwise bots
  // chase a fast rolling ball several metres beyond its real position.
  const horizontal=Math.hypot(v[0],v[2]);
  if(horizontal){const rolling=p[1]<.97&&Math.abs(v[1])<.7,slip=rolling?Math.min(Math.max(0,horizontal-5.2),2.2*dt):0,k=Math.max(0,(horizontal-slip)/horizontal)*Math.exp(-.03*dt);v[0]*=k;v[2]*=k}
  if(p[1]>19.5){p[1]=19.5;v[1]=-Math.abs(v[1])*.6}
  if(Math.abs(p[0])>39.7){p[0]=Math.sign(p[0])*39.7;v[0]*=-.6}
  if(Math.abs(p[2])>50&&!(Math.abs(p[0])<8&&p[1]<5.5)){p[2]=Math.sign(p[2])*50;v[2]*=-.6}
  const cx=Math.max(0,Math.abs(p[0])-29.44),cz=Math.max(0,Math.abs(p[2])-39.68),d=Math.hypot(cx,cz);
  if(cx&&cz&&d>10.4){const nx=cx/d*Math.sign(p[0]),nz=cz/d*Math.sign(p[2]),dot=v[0]*nx+v[2]*nz;if(dot>0){v[0]-=1.6*dot*nx;v[2]-=1.6*dot*nz}p[0]-=nx*(d-10.4);p[2]-=nz*(d-10.4)}
 }
 return p;
}

export function incomingShot(ball,team){
 // Blue defends +Z in browser coordinates; Orange defends -Z.
 const end=team===0?1:-1,v=ball.velocity;
 if(v[2]*end<.6)return null;
 let t=(end*51.2-ball.position[2])/v[2];
 if(t<-.06||t>3)return null;
 t=Math.max(.001,t);let impact;
 for(let i=0;i<5;i++){impact=predictBall(ball,t);const error=51.2-impact[2]*end;if(Math.abs(error)<.03)break;t+=error/Math.max(1,v[2]*end);if(t<-.06||t>3)return null}
 // Reject trajectories that hit a side/end wall or cross above the crossbar.
 if(Math.abs(impact[0])>8.015||impact[1]>5.515||impact[2]*end<50)return null;
 return{time:t,impact,end};
}
