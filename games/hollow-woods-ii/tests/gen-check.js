const fs=require('fs'),vm=require('vm');const ctx={console,globalThis:null};ctx.globalThis=ctx;vm.createContext(ctx);
for(const f of ['src/input.js','src/physics.js','src/hazards.js','src/monsters.js', 'src/pickups.js','src/player.js','src/world.js','src/levels.js','src/save.js','src/runner.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const H=ctx.Hollow;let bad=0;
for(let i=0;i<25;i++){const L=H.runner.generate(i);const s=L.stats;const ok=s.monsters===100&&s.obstacles===100&&L.monsters.length===100;if(!ok)bad++;
 const slopes=L.rows.join('').replace(/[^\/\\abcd]/g,'').length;
 console.log(i+1,L.name.padEnd(34),'cols',s.columns,'mon',s.monsters,'obs',s.obstacles,'slopeTiles',slopes,ok?'':'  <-- COUNT MISMATCH');}
console.log(bad?'FAIL':'all 25 maps: 100 monsters + 100 obstacles');
