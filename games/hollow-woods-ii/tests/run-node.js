// Headless runner (Node, no packages): loads the real game modules and has the
// solution bot play every level start to finish. Usage: node tests/run-node.js [levelId]
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = { console, Math, JSON, Date, Object, Array, Number, String, Set, Map, Uint8Array, Error, isFinite };
ctx.globalThis = ctx;
vm.createContext(ctx);
const files = ['src/input.js', 'src/physics.js', 'src/hazards.js', 'src/monsters.js', 'src/pickups.js', 'src/player.js', 'src/world.js', 'src/levels.js', 'src/save.js', 'src/runner.js', 'tests/bot.js'];
for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
for (const f of fs.readdirSync(path.join(root, 'levels')).filter((n) => n.endsWith('.js'))) {
  vm.runInContext(fs.readFileSync(path.join(root, 'levels', f), 'utf8'), ctx, { filename: 'levels/' + f });
}
const H = ctx.Hollow;
const only = process.argv[2];
const dt = H.PHYS.STEP;
let ok = true, ti = 0, to = 0;
for (const id of H.LEVEL_ORDER) {
  if (only && id !== only) continue;
  const lvl = H.levels[id];
  const world = new H.World(lvl);
  const input = new H.Input();
  const bot = new H.Bot(world, input);
  let steps = 0;
  const t0 = Date.now();
  while (bot.status === 'running' && steps < 60 * 60 * 30) {
    bot.tick(dt);
    input.poll();
    world.step(dt, input);
    steps++;
  }
  if (world.finished) bot.status = 'done';
  const st = lvl.stats;
  ti += st.interactiveTotal; to += st.obstacleTotal;
  const p = world.player;
  if (false) console.log(`${id.padEnd(8)} ${bot.status === 'done' ? 'PASS' : 'FAIL'}  game time ${(steps * dt).toFixed(1)}s  deaths ${world.deaths}  ` +
    `interactive ${st.interactiveTotal}  obstacles ${st.obstacleTotal}  (${Date.now() - t0} ms)`);
  // Check that the puzzles were solved by using the items, not bypassed.
  const problems = [];
  world.planks.forEach((k, i) => { if (!k.broken) problems.push(`plank ${i} never broken`); });
  world.levers.forEach((l, i) => { if (!l.on) problems.push(`lever ${i} never pulled`); });
  world.plates.forEach((pl, i) => { if (!pl.byBody) problems.push(`plate ${i} never weighted by a crate/boulder`); });
  world.movers.forEach((m, i) => {
    if (m.kind === 'lift' && !m.carriedPlayer) problems.push(`lift ${i} never ridden`);
    if ((m.kind === 'gate' || m.kind === 'bridge') && m.t < 0.99) problems.push(`${m.kind} ${i} never opened`);
  });
  world.bodies.forEach((b, i) => {
    const s0 = lvl.crates && i < lvl.crates.length ? lvl.crates[i] : lvl.boulders[i - (lvl.crates || []).length];
    if (Math.abs(b.x - s0.x * 32) < 16 && Math.abs(b.y - s0.y * 32) < 16) problems.push(`${b.kind} ${i} never moved`);
  });
  const ropesUsed = new Set(lvl.solution.filter((st) => st[0] === 'rope').map((st) => st[1]));
  world.ropes.forEach((r, i) => { if (!ropesUsed.has(i)) problems.push(`rope ${i} unused`); });
  if (problems.length) { bot.status = 'fail'; bot.reason = 'items not used: ' + problems.join('; '); }
  console.log(`${id.padEnd(8)} ${bot.status === 'done' ? 'PASS' : 'FAIL'}  game time ${(steps * dt).toFixed(1)}s  deaths ${world.deaths}  ` +
    `interactive ${st.interactiveTotal}  obstacles ${st.obstacleTotal}  (${Date.now() - t0} ms)`);
  if (bot.status !== 'done') {
    ok = false;
    console.log('   ', bot.reason, `player @ (${(p.x / 32).toFixed(2)}, ${(p.y / 32).toFixed(2)}) state=${p.state} cp=${world.cpIndex}`);
  }
}
console.log(`totals: interactive ${ti}, obstacles ${to}`);
process.exit(ok ? 0 : 1);
