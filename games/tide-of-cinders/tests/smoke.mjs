import assert from 'node:assert/strict';
import {missions} from '../content.js';
import {createMission,endTurn,reachable,doMove,shoot,interact,lineOfSight} from '../engine.js';
const roster=['voss','oren','saye','kade'];
function flood(game){const seen=new Set(['1,3','2,3','1,5','2,5']),q=[{x:1,y:3},{x:2,y:3},{x:1,y:5},{x:2,y:5}];while(q.length){const p=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,k=x+','+y;if(x<1||y<1||x>=game.W-1||y>=game.H-1||game.grid[y][x].move>=3||seen.has(k))continue;seen.add(k);q.push({x,y})}}return seen}
let checked=0;
for(let seed=0;seed<100;seed++)for(let index=0;index<missions.length;index++){
 const game=createMission(index,'standard',{seed,roster,wounds:{}});assert.equal(game.index,index);assert.equal(game.units.length,4);assert.equal(game.grid.length,9);assert.equal(game.grid[0].length,12);
 assert(game.enemies.every(e=>game.grid[e.y][e.x].move<3));const seen=flood(game);for(const o of game.objectives)assert([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>seen.has((o.x+dx)+','+(o.y+dy))),
   'objective reachable, operation '+index+', campaign seed '+seed);
 if(seed===0){const u=game.units[0],moves=reachable(game,u);assert(moves.size>0);const next=[...moves.keys()].find(k=>k!==u.x+','+u.y);if(next){const [x,y]=next.split(',').map(Number);assert(doMove(game,u,x,y))}
  if(game.enemies.length){const enemy=game.enemies[0];u.x=enemy.x-1;u.y=enemy.y;u.ap=2;assert(shoot(game,u,enemy));assert.equal(u.ammo,3)}
  if(game.kind==='eliminate'){for(let n=0;n<game.target;n++){const enemy=game.enemies[n];enemy.hp=1;u.x=enemy.x-1;u.y=enemy.y;u.ammo=4;let guard=0;while(enemy.alive&&guard++<20){u.ap=2;assert(shoot(game,u,enemy))}}assert(game.extraction)}
  else {for(const o of game.objectives){u.x=o.x-1;u.y=o.y;for(let n=0;n<(game.kind==='hold'?3:1);n++){u.ap=2;assert(interact(game,u))}}assert(game.extraction)}
 }
 if(seed<1){const saved=JSON.parse(JSON.stringify(game));assert.equal(saved.grid.length,9);}
 if(seed===0){const live=createMission(index,'standard',{seed,roster,wounds:{}});endTurn(live);assert.equal(live.round,2);assert.equal(live.phase,'player');endTurn(live);assert.equal(live.round,3)}
 checked++;
}
console.log('PASS '+checked+' seeded mission maps: playable objective adjacency, movement, shot resolution, objective completion, elimination condition, two autonomous rounds and JSON state serialization.');
