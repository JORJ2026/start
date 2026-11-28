// Plays Endless Runner maps with the reactive bot; reports completion, deaths and causes.
// Usage: node tests/run-runner.js [mapIndex 1..25|all] [lap]
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { console, Math, JSON, Date, Object, Array, Number, String, Set, Map, Uint8Array, Int16Array, Error, isFinite };
ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['src/input.js', 'src/physics.js', 'src/hazards.js', 'src/monsters.js', 'src/pickups.js', 'src/player.js', 'src/world.js', 'src/levels.js', 'src/save.js', 'src/runner.js', 'tests/runner-bot.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const H = ctx.Hollow;
const arg = process.argv[2] || 'all', lap = +(process.argv[3] || 0);
const maps = arg === 'all' ? [...Array(25).keys()] : [+arg - 1];
let tot = 0, fin = 0; const causes = {};
for (const idx of maps) {
  const L = H.runner.generate(idx), world = new H.World(L), input = new H.Input();
  input.autoRun = true; world.player.runScale = H.runner.speedScale(idx, lap);
  const bot = new H.RunnerBot(world, input, L);
  let steps = 0; const dt = H.PHYS.STEP, local = {}; let lastDead = false;
  const t0 = Date.now();
  while (!world.finished && steps < 60 * 60 * 25 && world.deaths < 400) {
    bot.tick(dt); input.poll(); world.step(dt, input); steps++;
    if (world.player.dead && !lastDead) { let nm=''; if(world.player.deathCause==='monster'){let b=1e9;for(const m of world.monsters){const d=Math.abs(m.x-world.player.x);if(d<b){b=d;nm=m.k;}}} const k = world.player.deathCause + (nm?':'+nm:'') + '@' + Math.round(world.player.x / 32); local[k] = 1; causes[k.split('@')[0]] = (causes[k.split('@')[0]] || 0) + 1; }
    lastDead = world.player.dead;
  }
  tot += world.deaths; if (world.finished) fin++;
  console.log(`map ${String(idx + 1).padStart(2)} ${L.name.padEnd(32)} ${world.finished ? 'FINISHED' : 'FAILED  '} time ${(steps * dt).toFixed(0)}s deaths ${world.deaths} (${Date.now() - t0}ms)` + (world.deaths && process.env.V ? ' ' + Object.keys(local).slice(0, 12).join(' ') : ''));
}
console.log(`finished ${fin}/${maps.length}  total deaths ${tot}  causes ${JSON.stringify(causes)}`);
