import {missions,operatives,adversaries} from './content.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function hash32(x){let h=x|0;h=Math.imul(h^(h>>>16),0x45d9f3b);h=Math.imul(h^(h>>>16),0x45d9f3b);return (h^(h>>>16))>>>0}
export function rng(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
export function distance(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)}
export function createMission(index, difficulty, campaign) {
 const m=missions[index], rand=rng(m.mapSeed+(campaign.seed||0)); const W=12,H=9;
 const grid=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>({x,y,kind:(x===0||y===0||x===W-1||y===H-1)?'water':'ground',cover:0,move:1})));
 // Design three navigable lanes around a generated central hazard and authored site landmarks.
 const cx=7+Math.floor(rand()*2), cy=3+Math.floor(rand()*3);
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
  const n=rand(); if((Math.abs(x-cx)<2&&Math.abs(y-cy)<2&&n<.48)||(n<.065&&x>3))Object.assign(grid[y][x],{kind:'water',move:99});
  else if(n<.17)Object.assign(grid[y][x],{kind:'rock',cover:2});
  else if(n<.28)Object.assign(grid[y][x],{kind:'ruin',cover:1});
  else if(n<.37)Object.assign(grid[y][x],{kind:'wreck',cover:1});
  else if(n<.43)Object.assign(grid[y][x],{kind:'mud',move:2});
 }
 // Make deployment and objective areas navigable.
 const start={x:1,y:4}, exit={x:1,y:4}, objective={x:9,y:4};
 for(const [x,y] of [[1,4],[2,4],[3,4],[4,4],[5,4],[9,4],[8,4],[10,4]]) Object.assign(grid[y][x],{kind:'ground',cover:0,move:1});
 const occupied=new Set(['1,4','2,4','1,5','2,5']);
 for(let i=0;i<4;i++)for(let tries=0;tries<50;tries++){let x=1+Math.floor(rand()*3),y=3+Math.floor(rand()*3),k=x+','+y;if(!occupied.has(k)&&grid[y][x].move<3){occupied.add(k);break}}
 const roster=(campaign.roster||operatives.slice(0,4).map(o=>o.id)).slice(0,4).map(id=>operatives.find(o=>o.id===id)).filter(Boolean);
 const units=roster.map((o,i)=>({id:o.id,name:o.name,role:o.role,x:[1,2,1,2][i],y:[3,3,5,5][i],hp:Math.max(1,o.hp-(campaign.wounds?.[o.id]||0)),maxHp:o.hp,aim:o.aim,range:o.range,ap:2,ammo:4,alive:true,guard:false,injury:campaign.wounds?.[o.id]||0}));
 const types=adversaries;
 const enemies=[];
 for(let i=0;i<m.enemyCount;i++){
  let x=7+Math.floor(rand()*4),y=1+Math.floor(rand()*7); if(grid[y][x].move>=3){x=8;y=2+i%5}
  if(grid[y][x].move>=3||enemies.some(e=>e.x===x&&e.y===y)){const candidates=[];for(let yy=1;yy<H-1;yy++)for(let xx=6;xx<W-1;xx++)if(grid[yy][xx].move<3&&!enemies.some(e=>e.x===xx&&e.y===yy))candidates.push({x:xx,y:yy});const p=candidates[Math.floor(rand()*candidates.length)]||{x:8,y:2};x=p.x;y=p.y}
  const type=types[(i+index)%Math.min(5,2+Math.floor(index/4))];
  enemies.push({id:'e'+i,name:type.name,role:type.role,x,y,hp:type.hp,maxHp:type.hp,range:type.range,alive:true,ap:1,active:false,disrupted:0});
 }
 const objectives=[];for(let i=0;i<(m.kind==='hold'?1:(m.kind==='eliminate'?0:m.target));i++){
  const x= i===0?objective.x:Math.min(10,8+(i%3)),y=i===0?objective.y:2+(i*3)%5;
  objectives.push({x,y,progress:0,done:false,kind:m.kind});
  for(let yy=Math.max(1,y-1);yy<=Math.min(H-2,y+1);yy++)for(let xx=Math.max(1,x-1);xx<=Math.min(W-2,x+1);xx++)if(grid[yy][xx].kind==='water')grid[yy][xx]={x:xx,y:yy,kind:'ground',cover:0,move:1};
 }
 const player={index,round:1,phase:'player',selected:units[0]?.id,mode:'select',kills:0,objectiveCount:0,shots:0,misses:0,damage:0,log:[m.brief],won:false,lost:false,grid,units,enemies,objectives,start,exit,weather:m.weather,difficulty,kind:m.kind,target:m.target,seed:m.mapSeed+(campaign.seed||0),W,H,extraction:false};
 return player;
}
export function reachable(game,unit){
 const dist=new Map([[unit.x+','+unit.y,0]]), q=[{x:unit.x,y:unit.y}];
 while(q.length){q.sort((a,b)=>dist.get(a.x+','+a.y)-dist.get(b.x+','+b.y));const p=q.shift(),d=dist.get(p.x+','+p.y);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy;if(x<0||y<0||x>=game.W||y>=game.H||game.grid[y][x].move>=3||d+game.grid[y][x].move>unit.ap)continue;const block=[...game.units,...game.enemies].some(u=>u.alive&&u!==unit&&u.x===x&&u.y===y);if(block)continue;const k=x+','+y;if(!dist.has(k)||dist.get(k)>d+game.grid[y][x].move){dist.set(k,d+game.grid[y][x].move);q.push({x,y})}}}
 return dist;
}
export function lineOfSight(game,a,b){let x0=a.x,y0=a.y,x1=b.x,y1=b.y,dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy;for(;;){if(!(x0===a.x&&y0===a.y)&&!(x0===b.x&&y0===b.y)&&game.grid[y0]?.[x0]?.cover>=2)return false;if(x0===x1&&y0===y1)break;const e=2*err;if(e>=dy){err+=dy;x0+=sx}if(e<=dx){err+=dx;y0+=sy}}return true}
const log=(g,s)=>{g.log.unshift(s);g.log=g.log.slice(0,7)};
function nearest(unit,arr){return arr.filter(a=>a.alive).sort((a,b)=>distance(unit,a)-distance(unit,b))[0]}
function pathStep(game,from,to){
 // A* on four-neighbour grid, cost accounts for mud and hard obstruction.
 const key=p=>p.x+','+p.y, open=[{...from,g:0,f:distance(from,to)}],came=new Map(),cost=new Map([[key(from),0]]),closed=new Set();
 while(open.length){open.sort((a,b)=>a.f-b.f);const p=open.shift(),pk=key(p);if(pk===key(to))break;if(closed.has(pk))continue;closed.add(pk);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const q={x:p.x+dx,y:p.y+dy},k=key(q);if(q.x<0||q.y<0||q.x>=game.W||q.y>=game.H||game.grid[q.y][q.x].move>=3||closed.has(k))continue;if([...game.units,...game.enemies].some(u=>u.alive&&u!==from&&u.x===q.x&&u.y===q.y))continue;const c=cost.get(pk)+game.grid[q.y][q.x].move;if(c<(cost.get(k)??1e9)){came.set(k,p);cost.set(k,c);open.push({...q,g:c,f:c+distance(q,to)})}}
 }
 let cur=to,k=key(cur);if(!came.has(k))return null;while(came.has(k)&&key(came.get(k))!==key(from)){cur=came.get(k);k=key(cur)}return cur;
}
export function doMove(g,u,x,y){const d=reachable(g,u).get(x+','+y);if(d===undefined||d===0)return false;u.x=x;u.y=y;u.ap-=d;u.guard=false;log(g, u.name+' moves through '+g.grid[y][x].kind+'.');return true}
export function shoot(g,u,target,bonus=0){if(!u?.alive||!target?.alive||u.ap<1||u.ammo<1||distance(u,target)>u.range||!lineOfSight(g,u,target))return false;u.ap--;u.ammo--;g.shots++;u.guard=false;const cover=g.grid[target.y][target.x].cover;let chance=clamp(u.aim+bonus-cover*.12-distance(u,target)*.025+(g.difficulty==='story'?.1:0)-(g.difficulty==='hard'?.08:0),.18,.9);if(rng(g.seed+g.round*121+g.shots*39)()<chance){target.hp-=g.difficulty==='hard'?1.05:1;g.damage++;log(g,u.name+' hits '+target.name+'.');if(target.hp<=0){target.alive=false;g.kills++;log(g,target.name+' is out of the fight.');if(g.kind==='eliminate'&&g.kills>=g.target){g.extraction=true;log(g,'All hostile contacts neutralized. Extraction is clear.');}}}else{g.misses++;log(g,u.name+' misses in the weather.')}return true}
function coverScore(g,p,threats){let s=g.grid[p.y][p.x].cover*.9;for(const t of threats)if(distance(p,t)<=t.range)s+=g.grid[p.y][p.x].cover?1.1:-.8;return s}
function enemyTurn(g){
 g.phase='enemy';g.enemies.filter(e=>e.alive).forEach(e=>{if(e.disrupted){e.disrupted--;return}const alive=g.units.filter(u=>u.alive);if(!alive.length)return;const target=nearest(e,alive);const allies=g.enemies.filter(a=>a.alive&&a!==e);const d=distance(e,target);
  // Utility-driven behaviors distinguish flankers, anchors, disruptors, hunters and command units.
  const hunterTarget=e.role==='HUNTER'?alive.slice().sort((a,b)=>a.hp-b.hp)[0]:target;
  const chosenTarget=hunterTarget||target;
  let utility={attack:distance(e,chosenTarget)<=e.range&&lineOfSight(g,e,chosenTarget)?4.2:0,objective:g.objectives.some(o=>!o.done&&distance(e,o)<=2)?3.2:0,flank:e.role==='FLANKER'?2.5:0,protect:e.role==='COMMAND'&&allies.some(a=>distance(e,a)<=3)?2.8:0,disrupt:e.role==='DISRUPTOR'&&g.objectives.some(o=>!o.done)?3.6:0,anchor:e.role==='ANCHOR'?1.6:0};
  if(utility.attack>=Math.max(utility.objective,utility.flank,utility.protect,utility.disrupt)&&utility.attack>0){let hit=rng(g.seed+g.round*77+e.x*13+e.y*7)()<(g.difficulty==='hard'?.58:(g.difficulty==='story'?.2:.4)-(g.fieldcraft>=4?.1:0));if(hit){target.hp-=target.guard?0.5:1;g.damage+=target.guard?.5:1;log(g,e.name+' tags '+target.name+'.');if(target.hp<=0){target.alive=false;log(g,target.name+' is down.')}}else log(g,e.name+' fires wide.');return}
  let goal=chosenTarget;
  if(utility.disrupt>3)goal=g.objectives.find(o=>!o.done)||chosenTarget;else if(utility.objective>utility.flank)goal=g.objectives.find(o=>!o.done)||chosenTarget;
  let routeStep=null,routeCost=1e9;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const q={x:goal.x+dx,y:goal.y+dy};if(q.x<1||q.y<1||q.x>=g.W-1||q.y>=g.H-1||g.grid[q.y][q.x].move>=3||[...g.units,...g.enemies].some(a=>a.alive&&a!==e&&a.x===q.x&&a.y===q.y))continue;const step=pathStep(g,e,q);if(step){const cost=distance(step,e);if(cost<routeCost){routeCost=cost;routeStep=step}}}
  let best=null,bestScore=-1e9;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[0,0]]){let p={x:e.x+dx,y:e.y+dy};if(p.x<1||p.y<1||p.x>=g.W-1||p.y>=g.H-1||g.grid[p.y][p.x].move>=3||[...g.units,...g.enemies].some(a=>a.alive&&a!==e&&a.x===p.x&&a.y===p.y))continue;let score=-distance(p,goal)*1.1+coverScore(g,p,alive)+(e.role==='FLANKER'&&distance(p,chosenTarget)<=2?2:0)+(e.role==='COMMAND'&&allies.some(a=>distance(p,a)<=2)?1.5:0)+(e.role==='DISRUPTOR'&&g.objectives.some(o=>distance(p,o)<=1)?2:0)+(e.role==='ANCHOR'&&g.grid[p.y][p.x].cover?1.5:0)+(routeStep&&p.x===routeStep.x&&p.y===routeStep.y?2.6:0);if(score>bestScore){bestScore=score;best=p}}
  if(best){e.x=best.x;e.y=best.y;if(e.role==='DISRUPTOR'&&g.objectives.some(o=>!o.done&&distance(e,o)<=1)){e.disrupted=1;log(g,'A signal thief jams the objective.')}else log(g,e.name+' shifts to cover.')}
 });g.round++;g.phase='player';g.units.filter(u=>u.alive).forEach(u=>{u.ap=2;u.guard=false});g.enemies.forEach(e=>e.active=false);if(g.objectives.filter(o=>o.done).length===g.objectives.length)g.extraction=true;
}
export function endTurn(g){if(g.phase!=='player')return;enemyTurn(g);if(g.kind==='eliminate'&&g.kills>=g.target)g.extraction=true;if(!g.units.some(u=>u.alive)){g.lost=true;log(g,'No one answers the extraction call.')} }
export function interact(g,u){if(!u?.alive||u.ap<1)return false;const o=g.objectives.find(o=>!o.done&&distance(u,o)<=1);if(!o)return false;u.ap--;o.progress++;if(o.kind==='hold'){o.done=o.progress>=3;log(g,o.done?'The position is secured.':'Holding the ground ('+o.progress+'/3).')}else{o.done=true;log(g, o.kind==='rescue'?'Survivors board the cutter.':'Objective secured.')}if(g.objectives.every(x=>x.done)){g.extraction=true;log(g,'All objectives complete. Extraction is clear.')}return true}
export function useSkill(g,u){if(!u?.alive||u.ap<1)return false;u.ap--;u.guard=true;if(u.role==='MEDIC'){const v=g.units.filter(x=>x.alive&&x.hp<x.maxHp&&distance(u,x)<=1).sort((a,b)=>a.hp-b.hp)[0];if(v){v.hp=Math.min(v.maxHp,v.hp+2);log(g,u.name+' patches '+v.name+'.')}else log(g,u.name+' prepares a field kit.')}else if(u.role==='TECH'){const e=g.enemies.filter(x=>x.alive&&distance(u,x)<=4).sort((a,b)=>distance(u,a)-distance(u,b))[0];if(e){e.disrupted=2;log(g,u.name+' scrambles '+e.name+"'s rig.")}else log(g,u.name+' fortifies the nearest relay.')}else if(u.role==='HEAVY'){g.enemies.filter(e=>e.alive&&distance(u,e)<=4).forEach(e=>e.disrupted=1);log(g,u.name+' suppresses the shoreline.')}else {u.ap=Math.min(3,u.ap+1);log(g,u.name+' takes a tidewise position.')}return true}
export function setGuard(u){if(u?.alive&&u.ap>0){u.ap=0;u.guard=true;return true}return false}
