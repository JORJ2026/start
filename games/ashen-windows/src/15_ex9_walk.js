/* ==========================================================================
   SECTION 29: THE LONG WALK - a side-scrolling puzzle platformer mode
   Toby, alone on the wrong side of the river, walks home across Greywater
   by night, following the paper stars the neighbours hang on threads.
   Fifty levels in five chapters, built from hand-made segments in a fixed,
   seeded order, with an animated interlude after every level.
   The look follows the house rules: a grey world in silhouette, and colour
   only for people (Toby's orange hat).
   ========================================================================== */
const WALK_GY = 420, WALK_SPD = 125;   // 1.4: Toby walks a little slower; gaps, glass and the dogs were retuned to match
const WALK_CH = [
  { n: 'The Orchard', sky: [64, 26], fog: 0.35, part: 'ash', d: 'Dead trees and frozen furrows at the edge of the city.' },
  { n: 'The Rail Yard', sky: [56, 22], fog: 0.3, part: 'ash', d: 'Rusting wagons, cranes, and boards that do not hold.' },
  { n: 'The Drowned Streets', sky: [50, 20], fog: 0.45, part: 'rain', d: 'Black water where the river came through the houses.' },
  { n: 'The Works', sky: [44, 16], fog: 0.3, part: 'ash', d: 'Chimneys, searchlights, and the Grey Coats on the gantries.' },
  { n: 'The Long Bridge', sky: [70, 30], fog: 0.4, part: 'snow', d: 'Dogs, the last bridge, and the stairs home.' }
];
const WALK_STORY = {
  intro: [['narr', 'The night the shells came over the orchard, Toby and Ines were on the wrong side of the river.'], ['ines', 'If we lose each other, follow the paper stars. We hung them all the way home. Promise?'],
    ['toby', '(nods, and holds her sleeve very tight)'], ['narr', 'Then the ground jumped, and there was smoke, and then there was only Toby.']],
  lines: [
    'The first paper star hangs from a branch, turning in the wind. Toby takes it as a yes.',
    'He talks to himself in Dov\'s voice: "Short steps. Look where your feet go."',
    'An old scarecrow points the way. Or it is just falling over. He decides it is pointing.',
    'He counts the stars he has passed. Four. Ines said there were a hundred.',
    'A crow follows him for a while, then gets bored. He tells it about the soup.',
    'His hat is the only colour for miles. He pulls it down over his ears anyway.',
    'He finds a frozen apple and keeps it in his pocket for Granny Bea.',
    'Somewhere far off, a dog barks once and stops. Toby walks faster.',
    'The orchard ends at a fence. On the other side, the rails shine in the dark.',
    'He looks back once. The trees look like people waving. He waves back, just in case.',
    'Wagons sleep on the tracks like big animals. He walks between them on tiptoe.',
    'A star hangs from a signal post. Someone climbed all the way up to tie it.',
    'The crane creaks. He decides it is saying hello, not falling.',
    'He shares the apple with nobody, and saves the other half.',
    'There are chalk marks on a wagon: an arrow, and a little candle. Someone went this way.',
    'He sings the music-box tune under his breath, and forgets the middle, like always.',
    'A board gives way behind him. He does not look down. Dov said not to.',
    'He sleeps for a minute inside a coal wagon, and dreams the landing is warm.',
    'The rails turn toward the river. So does he.',
    'At the end of the yard, the stars go on, down into the flooded streets.',
    'The water is black and very still. The stars are reflected twice.',
    'A front door floats past him. He wonders who lived behind it.',
    'He crosses on a wardrobe that someone has turned into a raft.',
    'Somebody has painted the water line on every house. It is above his head.',
    'He hears a pump working somewhere. People live here, under the water line.',
    'A cat watches him from a windowsill, completely dry and completely unimpressed.',
    'The rain starts. His paper star gets soft. He holds it under his coat.',
    'An old tram stop sign: GREYWATER CENTRE, 3 STOPS. He walks all three.',
    'A light in a top window goes out as he passes. Then on again. A hello.',
    'The streets climb out of the water. Ahead are the chimneys of the Works.',
    'The Works never sleep. Even now the furnaces breathe.',
    'Searchlights cross the yard. He learns their rhythm like a song.',
    'He hides behind a boiler and counts to twenty, the way they do at home.',
    'Grey Coats on the gantry, smoking, talking about soup. Everyone talks about soup.',
    'He finds a star tied to a pipe with a red thread. Marta\'s thread. He knows it.',
    'A whistle blows. He freezes. It is only the shift changing.',
    'Soot on his face, on his hands, on his hat. The hat is still orange underneath.',
    'He draws a little sun on a wall with a bit of chalk, so the next person knows.',
    'The last chimney. Past it, the city lights up, window by careful window.',
    'Beyond the Works, the river, and the long bridge.',
    'Snow on the bridge approach. His footprints are the only ones.',
    'Dogs live under the bridge. They are hungry, and so is he.',
    'He throws the last half apple as far as he can. The dogs go after it.',
    'The bridge sways in the wind. Halfway across, he can see the Ashen Windows building.',
    'Six floors up, one window is lit. He knows exactly which one.',
    'The far bank. The stars are closer together now, one on every lamppost.',
    'His street. The shop with the mouse sign. The doorstep with the crack shaped like a dog.',
    'The front door is unlocked. It is never unlocked. Someone left it open for him.',
    'Six flights of stairs. He counts every step, out loud, very quietly.',
    'The landing. The candle. And Ines, asleep sitting up against the door, waiting.'
  ],
  end: [['narr', 'Nobody said anything for a long time. Then everybody said everything at once.'], ['ines', 'You followed the stars.'],
    ['toby', 'I counted them. There were a hundred and four.'], ['bea', 'Today\'s soup is called \'Toby Came Home\'. It is mostly hugs.']]
};
const WALK_TIPS = {
  gap: 'Jump with Space or Up. Hold a direction to carry your run over gaps.', step: 'Climb onto ledges by jumping at them.',
  spikes: 'Broken glass and wire: jump over, never through.', crateWall: 'Walk into a crate to push it. Climb onto it to reach high places.',
  lever: 'Stand at a lever and press E (or Up) to pull it.', plate: 'A pressure plate holds a gate open only while something heavy sits on it.',
  mover: 'Moving platforms carry you. Wait for them.', collapse: 'Rotten boards fall soon after you step on them. Keep moving.',
  water: 'Deep water is deadly. Find another way across.', elevator: 'Lifts go up and down. Ride them to high ledges.',
  debris: 'Dust falling from above means something heavy is next.', searchlight: 'Stay out of the searchlight. Shelter under roofs while it passes.',
  tunnel: 'Low ceilings: a short hop is all you get.', dog: 'Dogs are faster than you, but they cannot climb. Get up high.'
};

/* ---------- level building ---------- */
const WSEG = {
  ground(L, x, w) { L.solids.push({ x, y: WALK_GY, w, h: 400 }); return x + w; },
  flat(L, x) { return this.ground(L, x, 240); },
  gap(L, x, d) { this.ground(L, x, 90); const g = Math.round(44 + d * 26); L.pits.push({ x: x + 90, w: g }); return this.ground(L, x + 90 + g, 110); },
  doubleGap(L, x, d) { this.ground(L, x, 70); const g = Math.round(40 + d * 20); L.pits.push({ x: x + 70, w: g }, { x: x + 120 + g, w: g }); this.ground(L, x + 70 + g, 50); return this.ground(L, x + 70 + g + 50 + g, 100); },
  step(L, x, d) { this.ground(L, x, 280); const h = Math.round(40 + d * 16); L.solids.push({ x: x + 70, y: WALK_GY - h, w: 130, h }); L.solids.push({ x: x + 200, y: WALK_GY - Math.round(h * 0.5), w: 40, h: Math.round(h * 0.5) }); return x + 280; },
  spikes(L, x, d) { this.ground(L, x, 300); L.spikes.push({ x: x + 120, w: Math.round(34 + d * 20) }); return x + 300; },
  crateWall(L, x) { this.ground(L, x, 470); L.crates.push({ x: x + 70, y: WALK_GY - 44, w: 44, h: 44 }); L.solids.push({ x: x + 290, y: WALK_GY - 104, w: 46, h: 104 }); return x + 470; },
  lever(L, x) { this.ground(L, x, 320); const id = L.gates.length; L.levers.push({ x: x + 80, gate: id, on: false }); L.gates.push({ id, x: x + 210, y: WALK_GY - 130, w: 16, h: 130, open: 0, held: false }); return x + 320; },
  plate(L, x) { this.ground(L, x, 460); const id = L.gates.length; L.crates.push({ x: x + 40, y: WALK_GY - 44, w: 44, h: 44 }); L.plates.push({ x: x + 190, w: 50, gate: id, down: 0 }); L.solids.push({ x: x + 246, y: WALK_GY - 10, w: 10, h: 10 });   /* a kerb stops the crate on the plate */ L.gates.push({ id, x: x + 360, y: WALK_GY - 130, w: 16, h: 130, open: 0, plate: true }); return x + 460; },
  mover(L, x, d, water) { this.ground(L, x, 80); const g = 230; L.pits.push({ x: x + 80, w: g, water }); if (water) L.water.push({ x: x + 80, w: g }); L.movers.push({ x: x + 82, y: WALK_GY, w: 72, h: 12, ax: x + 82, bx: x + 80 + g - 74, ay: WALK_GY, by: WALK_GY, per: 4.2 - d, t: 0 }); return this.ground(L, x + 80 + g, 110); },
  water(L, x, d) { return this.mover(L, x, d, true); },
  collapse(L, x) { this.ground(L, x, 70); const g = 204; L.pits.push({ x: x + 70, w: g }); for (let i = 0; i < 3; i++) L.falls.push({ x: x + 70 + i * 68, y: WALK_GY, w: 68, h: 14, t: -1, vy: 0, gone: false }); return this.ground(L, x + 70 + g, 110); },
  elevator(L, x) { this.ground(L, x, 130); const top = WALK_GY - 150; L.movers.push({ x: x + 132, y: WALK_GY - 12, w: 64, h: 12, ax: x + 132, bx: x + 132, ay: WALK_GY - 12, by: top, per: 5, t: 0 }); L.solids.push({ x: x + 130, y: WALK_GY, w: 70, h: 400 }); L.solids.push({ x: x + 200, y: top, w: 210, h: 400 + 150 });
    for (let i = 0; i < 3; i++) L.solids.push({ x: x + 410 + i * 50, y: top + 50 * (i + 1), w: 50, h: 400 }); return this.ground(L, x + 560, 60); },
  debris(L, x, d) { this.ground(L, x, 420); L.debris.push({ trig: x + 110, x: x + 250 - d * 20, y: -60, vy: 0, st: 'wait', t: 0, w: 40, h: 40 }); return x + 420; },
  searchlight(L, x, d) { this.ground(L, x, 560); L.solids.push({ x: x + 130, y: WALK_GY - 88, w: 90, h: 14 }); L.solids.push({ x: x + 330, y: WALK_GY - 88, w: 90, h: 14 }); L.lights.push({ x0: x - 20, x1: x + 580, per: 6.5 - d * 1.5, ph: 0 }); return x + 560; },
  tunnel(L, x, d) { this.ground(L, x, 360); L.solids.push({ x: x + 80, y: WALK_GY - 400 - 110, w: 220, h: 400 }); L.spikes.push({ x: x + 170, w: Math.round(20 + d * 8) }); return x + 360; },
  dog(L, x) { this.ground(L, x, 400); L.dogs.push({ trig: x + 30, x: x - 260, y: WALK_GY - 22, st: 'wait', vx: 0, ph: 0 }); L.solids.push({ x: x + 400, y: WALK_GY - 58, w: 180, h: 458 }); return this.ground(L, x + 580, 80); }
};
const WALK_POOL = [['gap', 'step', 'spikes', 'crateWall', 'lever', 'doubleGap'], ['mover', 'plate', 'collapse'], ['water', 'elevator', 'debris'], ['searchlight', 'tunnel'], ['dog']];
function walkLevel(i, only) {
  const ch = Math.floor(i / 10), k = i % 10, r = new RNG(9173 + i * 7919), d = clamp(k / 10 + ch * 0.06, 0, 1);
  const L = { i, ch, solids: [], pits: [], spikes: [], crates: [], gates: [], levers: [], plates: [], movers: [], falls: [], debris: [], lights: [], dogs: [], water: [], checks: [], stars: [], tips: [] };
  let pool = []; for (let c = 0; c <= ch; c++) pool = pool.concat(WALK_POOL[c]);
  const fresh = WALK_POOL[ch], n = 3 + Math.floor(i / 9);
  const seq = [];
  if (only) seq.push(...only);
  else if (i === 0) seq.push('step', 'gap', 'spikes');
  else { seq.push(fresh[k % fresh.length]); for (let j = 1; j < n; j++) { const recent = r.chance(0.55) ? fresh : pool; let s = recent[Math.floor(r.r(0, recent.length))]; if (s === seq[seq.length - 1]) s = pool[Math.floor(r.r(0, pool.length))]; seq.push(s); } }
  L.solids.push({ x: -260, y: WALK_GY - 400, w: 60, h: 800 }); let x = WSEG.flat(L, -200);
  seq.forEach((s, j) => {
    if (j && j % 2 === 0) { x = WSEG.ground(L, x, 120); L.checks.push({ x: x - 60 }); }
    if (!L.tips.some(t => t.k === s)) L.tips.push({ k: s, x });
    L.stars.push({ x: x + 30, y: WALK_GY - 150 - r.r(0, 60) });
    x = WSEG[s](L, x, d);
  });
  x = WSEG.ground(L, x, 340); L.exit = x - 120; L.w = x;
  L.seq = seq; return L;
}
/* every level is checked for these in the test suite: start, ground under every checkpoint, an exit */

/* ---------- the play scene ---------- */
class WalkScene {
  enter(p) {
    this.p = p || {}; this.i = clamp(num(this.p.lvl), 0, 49); this.t = 0; this.cp = null; this.deaths = 0; this.tipShown = {};
    Snd.setTrack(['ch1', 'sortie', 'snow', 'danger', 'ch5'][Math.floor(this.i / 10)] || 'sortie'); Snd.tension = 0; Snd.amb.wind = 0.5; Snd.amb.rain = Math.floor(this.i / 10) === 2 ? 0.6 : 0;
    this.load();
    note((Math.floor(this.i / 10) + 1) + '-' + (this.i % 10 + 1) + '   ' + WALK_CH[Math.floor(this.i / 10)].n, 3.5);
  }
  load() {
    const L = this.L = walkLevel(this.i, this.p.only); this.cam = { x: 0, y: WALK_GY - 200 };
    const sx = this.cp != null ? this.cp : -120; this.P = { x: sx, y: this.groundAt(sx) - 30, w: 14, h: 30, vx: 0, vy: 0, on: false, coyote: 0, buf: 0, face: 1, ph: 0, dead: 0, ride: null, push: 0 };
    this.cam.x = this.P.x; this.done = 0;
  }
  groundAt(x) { let best = 9999; for (const r of this.L.solids) if (x + 7 > r.x && x - 7 < r.x + r.w && r.y < best && r.y > WALK_GY - 300) best = r.y; return best === 9999 ? WALK_GY : best; }
  blocks(ignoreCrate) {
    const L = this.L, out = L.solids.slice();
    for (const g of L.gates) if (g.open < 0.6) out.push(g);
    for (const m of L.movers) out.push(m);
    for (const f of L.falls) if (!f.gone && f.y < WALK_GY + 60) out.push(f);
    for (const d of L.debris) if (d.st === 'land') out.push(d);
    if (!ignoreCrate) for (const c of L.crates) out.push(c);
    return out;
  }
  hit(a, r) { return a.x < r.x + r.w && a.x + a.w > r.x && a.y < r.y + r.h && a.y + a.h > r.y; }
  moveX(e, dx, isPlayer) {
    if (!dx) return; e.x += dx;
    for (const r of this.blocks(true)) if (r !== e && this.hit(e, r)) { e.x = dx > 0 ? r.x - e.w : r.x + r.w; if (e.vx != null) e.vx = 0; }
    for (const c of this.L.crates) if (c !== e && this.hit(e, c)) {
      if (isPlayer && e.on) { const before = c.x; this.moveX(c, dx * 0.55, false); e.push = 0.2; if (c.x !== before) Snd.sfx('step', { surf: 'stone', v: 0.25 }); }
      if (this.hit(e, c)) e.x = dx > 0 ? c.x - e.w : c.x + c.w;
    }
  }
  moveY(e, dy) {
    e.on = false; e.ride = null; e.y += dy;
    const list = this.blocks(false);
    for (const r of list) if (r !== e && this.hit(e, r)) {
      if (dy > 0) { e.y = r.y - e.h; e.on = true; if (r.per) e.ride = r; if (r.h === 14 && r.t === -1 && this.L.falls.indexOf(r) >= 0) { r.t = 0.65; Snd.sfx('creak', { v: 0.6 }); } } else e.y = r.y + r.h;
      e.vy = 0;
    }
  }
  kill(how) {
    const P = this.P; if (P.dead) return; P.dead = 0.001; P.how = how; this.lastDeath = { x: Math.round(P.x), y: Math.round(P.y), how }; this.deaths++; const W2 = Save.data.walk || (Save.data.walk = { un: 0, deaths: 0 }); W2.deaths = num(W2.deaths) + 1; Save.write();
    Snd.sfx(how === 'water' ? 'splash' : how === 'dog' ? 'bark' : 'hit'); if (how !== 'water') Parts.emit('dust', P.x + 7, P.y + 20, 8, { sx: 10 });
  }
  update(dt) {
    this.t += dt; const L = this.L, P = this.P, st = Input.state(['main', 'pad0', 'pad1', 'pad2', 'pad3']), M = Input.menu;
    if (st.press.pause || (M.back && !Game.ov.length)) { this.openPause(); return; }
    // world
    for (const m of L.movers) { m.t += dt; const k = 0.5 - 0.5 * Math.cos(m.t / m.per * TAU), nx = lerp(m.ax, m.bx, k), ny = lerp(m.ay, m.by, k); m.dx = nx - m.x; m.dy = ny - m.y; m.x = nx; m.y = ny; }
    for (const f of L.falls) if (f.t > 0) { f.t -= dt; if (Math.random() < dt * 20) Parts.emit('dust', f.x + Math.random() * f.w, f.y + 14, 1, {}); if (f.t <= 0) { f.t = -2; Snd.sfx('creak'); } } else if (f.t === -2) { f.vy += 1500 * dt; f.y += f.vy * dt; if (f.y > WALK_GY + 400) f.gone = true; }
    for (const g of L.gates) { const want = g.plate ? (L.plates.find(q => q.gate === g.id) || {}).down : g.held; const o = g.open; g.open = clamp(g.open + (want ? 1.6 : -1.6) * dt, 0, 1); if ((o < 0.05 && g.open >= 0.05) || (o > 0.95 && g.open <= 0.95)) Snd.sfx('crank'); }
    for (const q of L.plates) { const box = { x: q.x, y: WALK_GY - 6, w: q.w, h: 6 }; q.down = this.hit(box, P) || L.crates.some(c => this.hit(box, { x: c.x, y: c.y + 2, w: c.w, h: c.h })); }
    for (const c of L.crates) { c.vy = num(c.vy) + 1500 * dt; const pv = c.vy; this.moveY(c, c.vy * dt); if (c.on && pv > 400) Snd.sfx('thud', { v: 0.5 }); if (c.y > WALK_GY + 500) c.y = WALK_GY + 500; }
    for (const d of L.debris) {
      if (d.st === 'wait' && P.x > d.trig && num(P.px) <= d.trig) { d.st = 'warn'; d.t = 0.5; Snd.sfx('rumble', { d: 0.8, v: 0.5 }); }
      if (d.st === 'warn') { d.t -= dt; if (Math.random() < dt * 30) Parts.emit('dust', d.x + Math.random() * 40, this.cam.y - 200 + 40, 1, {}); if (d.t <= 0) { d.st = 'fall'; d.y = this.cam.y - 300; } }
      if (d.st === 'fall') { d.vy += 1800 * dt; d.y += d.vy * dt; if (this.hit(d, P) && !P.dead) this.kill('rock'); const gy = this.groundAt(d.x + 20); if (d.y + d.h >= gy) { d.y = gy - d.h; d.st = 'land'; Snd.sfx('thud'); Parts.emit('dust', d.x + 20, gy - 4, 14, { sx: 30 }); } }
    }
    for (const g of L.dogs) {
      if (g.st === 'wait' && P.x > g.trig && num(P.px) <= g.trig) { g.st = 'run'; Snd.sfx('bark'); }
      if (g.st === 'run') {
        g.ph += dt * 14; const dir = sgn(P.x - g.x) || 1; let nx = g.x + dir * 175 * dt; const box = { x: nx, y: g.y, w: 30, h: 20 };
        if (this.blocks(true).some(r => this.hit(box, r))) { nx = g.x; g.blocked = (g.blocked || 0) + dt; if (g.blocked > 0.6) { g.blocked = 0; Snd.sfx('bark'); } }
        g.vx = (nx - g.x) / Math.max(dt, 1e-4); g.x = nx; g.face = dir;
        if (!P.dead && this.hit({ x: g.x, y: g.y, w: 30, h: 20 }, P)) this.kill('dog');
      }
    }
    if (this.done) { this.done += dt; if (this.done > 1.2 && !this.left) { this.left = true; this.finish(); } return; }
    // death and respawn
    if (P.dead) { P.dead += dt; if (P.dead > 1.5) this.load(); return; }
    // player control
    const mx = Math.abs(st.mx) > 0.2 ? sgn(st.mx) : 0, jumpP = st.press.jump || st.press.up || (Input.touch && st.my < -0.6 && !this.upHeld);
    this.upHeld = st.my < -0.6;
    P.px = P.x; P.buf = jumpP ? 0.14 : Math.max(0, P.buf - dt); P.coyote = P.on ? 0.1 : Math.max(0, P.coyote - dt);
    const target = mx * (P.push > 0 ? 66 : WALK_SPD); P.vx += (target - P.vx) * Math.min(1, dt * (P.on ? 14 : 6)); P.push = Math.max(0, P.push - dt);
    if (mx) P.face = mx;
    if (P.buf > 0 && P.coyote > 0) { P.vy = -545; P.buf = 0; P.coyote = 0; Snd.sfx('step', { surf: 'stone', v: 0.6 }); }
    if (!(st.held.jump || st.held.up || st.my < -0.5) && P.vy < -200) P.vy = -200;      // short hops when the button is let go
    P.vy = Math.min(900, P.vy + 1500 * dt);
    if (P.ride) { this.moveX(P, P.ride.dx || 0, false); P.y += P.ride.dy || 0; }
    P.landT = Math.max(0, num(P.landT) - dt); P.pullT = Math.max(0, num(P.pullT) - dt); P.idleT = P.on && Math.abs(P.vx) < 10 ? num(P.idleT) + dt : 0; P.airT = P.on ? 0 : num(P.airT) + dt; P.prevVy = P.vy;
    const wasOn = P.on; this.moveX(P, P.vx * dt, true); this.moveY(P, P.vy * dt);
    if (P.on && !wasOn && P.vy >= 0) { P.landT = 0.28; P.landK = clamp(num(P.prevVy) / 700, 0.2, 1); Parts.emit('dust', P.x + 7, P.y + P.h - 1, 2, { sx: 6 }); Snd.sfx('step', { surf: 'stone', v: 0.4 }); }
    if (P.on && Math.abs(P.vx) > 20) { const o = P.ph; P.ph += dt * Math.abs(P.vx) * 0.09; if (Math.floor(o / Math.PI) !== Math.floor(P.ph / Math.PI)) Snd.sfx('step', { surf: Math.floor(this.i / 10) === 4 ? 'snow' : 'stone', v: 0.25 }); }
    // levers
    const lv = L.levers.find(q => Math.abs(q.x - (P.x + 7)) < 24 && !q.on);
    if (lv && (st.press.interact || st.press.up || st.press.use)) { lv.on = true; P.pullT = 0.6; const g = L.gates[lv.gate]; if (g) g.held = true; Snd.sfx('crank'); Snd.sfx('unlock'); }
    // hazards
    for (const s of L.spikes) if (P.x + P.w > s.x + 2 && P.x < s.x + s.w - 2 && P.y + P.h > WALK_GY - 12) this.kill('spikes');
    for (const w of L.water) if (P.x + 7 > w.x && P.x + 7 < w.x + w.w && P.y + P.h > WALK_GY + 30) { this.kill('water'); Parts.emit('drop', P.x + 7, WALK_GY + 30, 10, { sx: 10 }); }
    if (P.y > WALK_GY + 260) this.kill('fall');
    for (const lt of L.lights) { const bx = this.beamX(lt); lt.bx = bx; if (P.x + 7 > lt.x0 && P.x < lt.x1 && Math.abs(P.x + 7 - bx) < 26 && !this.covered(P)) { lt.seen = num(lt.seen) + dt; if (lt.seen > 0.35) this.kill('light'); } else lt.seen = Math.max(0, num(lt.seen) - dt); }
    // checkpoints, tips, exit
    for (const c of L.checks) if (P.x > c.x && (this.cp == null || this.cp < c.x)) { this.cp = c.x; Snd.sfx('chime'); c.lit = 1; }
    for (const tp of L.tips) if (P.x > tp.x - 140 && !this.tipShown[tp.k]) { this.tipShown[tp.k] = 1; const seen = Save.data.walk && Save.data.walk.tips || {}; if (!seen[tp.k] && WALK_TIPS[tp.k]) { note(Input.fmt(WALK_TIPS[tp.k]), 5); (Save.data.walk || (Save.data.walk = {})).tips = Object.assign(seen, { [tp.k]: 1 }); } }
    for (const s of L.stars) if (!s.got && Math.abs(P.x + 7 - s.x) < 40) { s.got = true; Snd.sfx('pickup'); }
    if (P.x > L.exit && !this.done) { this.done = 0.001; Snd.sting('good'); }
    // camera
    this.cam.x += (P.x + P.face * 60 - this.cam.x) * Math.min(1, dt * 3); this.cam.y += (Math.min(WALK_GY - 160, P.y - 120) - this.cam.y) * Math.min(1, dt * 2);
  }
  beamX(lt) { return lerp(lt.x0, lt.x1, 0.5 - 0.5 * Math.cos(this.t / lt.per * TAU + lt.ph)); }
  covered(P) { return this.L.solids.some(r => r.h <= 20 && r.y < P.y && P.x + 7 > r.x && P.x + 7 < r.x + r.w); }
  finish() {
    const W2 = Save.data.walk || (Save.data.walk = { un: 0, deaths: 0 }); if (!this.p.free) { W2.un = Math.max(num(W2.un), this.i + 1); if (this.i === 49) W2.done = true; } Save.write();
    Game.go('WalkInterlude', { lvl: this.i, deaths: this.deaths, free: this.p.free }, 'blinds');
  }
  openPause() {
    Game.push(menuOverlay({ title: 'The Long Walk', key: 'walkpause', w: 340, y: 130, onBack: () => Game.pop(), noBackItem: true, items: [
      { label: 'Resume', act: () => Game.pop() },
      { label: 'Restart the level', act: () => { Game.pop(); this.cp = null; this.load(); } },
      { label: 'Settings', act: () => Game.push(settingsOverlay()) },
      { label: "Player's Guide (PDF)", act: () => openGuide() },
      { type: 'head', label: 'SCREEN FILTERS' }, ...filterItems(),
      { label: 'Leave the walk', sub: this.p.free ? 'Back to All Unlocked.' : 'Your furthest level is kept.', act: () => { Game.ov.length = 0; Game.go(this.p.free ? 'Unlocked' : 'WalkMenu', {}, 'flicker'); } }] }));
    Snd.sfx('page');
  }
  /* ---------- drawing ---------- */
  render(ctx) {
    const L = this.L, P = this.P, t = this.t, C = WALK_CH[L.ch], cx = this.cam.x, cy = this.cam.y, X = x => x - cx + W / 2, Y = y => y - cy + H / 2 - 40;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, grey(C.sky[1])); g.addColorStop(0.7, grey(C.sky[0])); g.addColorStop(1, grey(C.sky[0] - 10)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const mg = ctx.createRadialGradient(W * 0.7, 90, 4, W * 0.7, 90, 160); mg.addColorStop(0, grey(220, 0.35)); mg.addColorStop(1, grey(200, 0)); ctx.fillStyle = mg; ctx.fillRect(0, 0, W, 300);
    this.backLayer(ctx, 0.15, grey(C.sky[0] - 14), 0); this.backLayer(ctx, 0.35, grey(C.sky[0] - 26), 1);
    if (calm()) { /* still */ } else for (let k = 0; k < 4; k++) { const fy = Y(WALK_GY - 30 - k * 60), fx = ((t * (8 + k * 4) - cx * 0.4 + k * 300) % (W + 600)) - 300; const fg = ctx.createRadialGradient(fx, fy, 10, fx, fy, 320); fg.addColorStop(0, grey(200, 0.08 * C.fog * 2)); fg.addColorStop(1, grey(200, 0)); ctx.fillStyle = fg; ctx.fillRect(fx - 320, fy - 120, 640, 240); }
    // searchlight beams (behind the black foreground)
    for (const lt of L.lights) { const bx = X(lt.bx || this.beamX(lt)); const bg = ctx.createLinearGradient(0, Y(WALK_GY - 400), 0, Y(WALK_GY)); bg.addColorStop(0, grey(240, 0.05)); bg.addColorStop(1, grey(240, lt.seen > 0 ? 0.4 : 0.22)); ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(bx - 8, Y(WALK_GY - 420)); ctx.lineTo(bx + 8, Y(WALK_GY - 420)); ctx.lineTo(bx + 30, Y(WALK_GY)); ctx.lineTo(bx - 30, Y(WALK_GY)); ctx.fill(); ctx.fillStyle = grey(240, 0.25); ctx.beginPath(); ctx.ellipse(bx, Y(WALK_GY), 34, 5, 0, 0, TAU); ctx.fill(); }
    // paper stars on threads
    for (const s of L.stars) { const sx = X(s.x), sy = Y(s.y) + Math.sin(t * 1.3 + s.x) * 3; if (sx < -20 || sx > W + 20) continue; ctx.strokeStyle = grey(140, 0.6); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, sy); ctx.stroke(); ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.sin(t + s.x) * 0.4); ctx.fillStyle = grey(s.got ? 250 : 210); ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3 : 7; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); ctx.restore(); if (s.got) { const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 20); sg.addColorStop(0, grey(255, 0.3)); sg.addColorStop(1, grey(255, 0)); ctx.fillStyle = sg; ctx.fillRect(sx - 20, sy - 20, 40, 40); } }
    // water
    for (const w of L.water) { ctx.fillStyle = grey(14); ctx.fillRect(X(w.x), Y(WALK_GY + 30), w.w, 400); ctx.strokeStyle = grey(120, 0.4); ctx.lineWidth = 1; for (let k = 0; k < 6; k++) { const wx = X(w.x) + ((k * 47 + t * 16) % w.w); ctx.beginPath(); ctx.moveTo(wx, Y(WALK_GY + 32 + (k % 3) * 6)); ctx.lineTo(wx + 14, Y(WALK_GY + 32 + (k % 3) * 6)); ctx.stroke(); } }
    // solid silhouettes
    const ink = grey(7), rim = grey(40);
    const box = r => { const x = X(r.x), y = Y(r.y); if (x > W + 10 || x + r.w < -10) return; ctx.fillStyle = ink; ctx.fillRect(x, y, r.w, r.h); ctx.fillStyle = rim; ctx.fillRect(x, y, r.w, 1.5); };
    for (const r of L.solids) { box(r); if (r.y === WALK_GY && !calm()) { ctx.fillStyle = ink; for (let gx = Math.max(X(r.x), 0); gx < Math.min(X(r.x + r.w), W); gx += 7) { const hgt = 3 + PH(Math.floor(gx + cx), 5) * 6; ctx.fillRect(gx, Y(WALK_GY) - hgt + Math.sin(t * 2 + gx) * 0.6, 1.4, hgt); } } }
    for (const s of L.spikes) { ctx.fillStyle = ink; ctx.beginPath(); for (let k = 0; k <= s.w; k += 8) { ctx.moveTo(X(s.x + k), Y(WALK_GY)); ctx.lineTo(X(s.x + k + 4), Y(WALK_GY - 13 - (k % 16 ? 0 : 3))); ctx.lineTo(X(s.x + k + 8), Y(WALK_GY)); } ctx.fill(); ctx.strokeStyle = grey(60, 0.6); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(X(s.x - 4), Y(WALK_GY - 8)); for (let k = 0; k <= s.w + 8; k += 6) ctx.lineTo(X(s.x + k), Y(WALK_GY - 8 + (k % 12 ? 2 : -2))); ctx.stroke(); }
    for (const g of L.gates) { const h = g.h * (1 - g.open * 0.92); ctx.fillStyle = ink; ctx.fillRect(X(g.x), Y(g.y), g.w, h); ctx.fillStyle = rim; for (let k = 0; k < h; k += 14) ctx.fillRect(X(g.x), Y(g.y) + k, g.w, 1.2); ctx.fillStyle = ink; ctx.fillRect(X(g.x) - 4, Y(g.y) - 8, g.w + 8, 8); }
    for (const q of L.plates) { ctx.fillStyle = q.down ? grey(60) : grey(30); ctx.fillRect(X(q.x), Y(WALK_GY) - (q.down ? 2 : 5), q.w, q.down ? 2 : 5); }
    for (const lv of L.levers) { const x = X(lv.x), y = Y(WALK_GY); ctx.fillStyle = ink; ctx.fillRect(x - 8, y - 10, 16, 10); ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 8); const a = lv.on ? 0.7 : -0.7; ctx.lineTo(x + Math.sin(a) * 24, y - 8 - Math.cos(a) * 24); ctx.stroke(); ctx.fillStyle = grey(lv.on ? 120 : 200); ctx.beginPath(); ctx.arc(x + Math.sin(a) * 24, y - 8 - Math.cos(a) * 24, 3.4, 0, TAU); ctx.fill(); }
    for (const c of L.crates) { box(c); ctx.strokeStyle = grey(34); ctx.lineWidth = 1.5; ctx.strokeRect(X(c.x) + 3, Y(c.y) + 3, c.w - 6, c.h - 6); ctx.beginPath(); ctx.moveTo(X(c.x) + 3, Y(c.y) + 3); ctx.lineTo(X(c.x + c.w) - 3, Y(c.y + c.h) - 3); ctx.stroke(); }
    for (const m of L.movers) { box(m); ctx.strokeStyle = grey(40); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(m.x + 6), Y(m.y)); ctx.lineTo(X(m.x + 6), 0); ctx.moveTo(X(m.x + m.w - 6), Y(m.y)); ctx.lineTo(X(m.x + m.w - 6), 0); ctx.stroke(); }
    for (const f of L.falls) if (!f.gone) { ctx.save(); ctx.translate(X(f.x + f.w / 2), Y(f.y + 7)); if (f.t > 0 && !calm()) ctx.rotate(Math.sin(t * 40) * 0.02); ctx.fillStyle = grey(18); ctx.fillRect(-f.w / 2, -7, f.w - 2, 14); ctx.fillStyle = grey(44); for (let k = 0; k < 3; k++) ctx.fillRect(-f.w / 2 + 4 + k * 20, -6, 1.2, 12); ctx.restore(); }
    for (const d of L.debris) { if (d.st === 'warn') { ctx.fillStyle = grey(0, 0.4 + 0.3 * Math.sin(t * 30)); ctx.beginPath(); ctx.ellipse(X(d.x + 20), Y(this.groundAt(d.x + 20)), 26, 4, 0, 0, TAU); ctx.fill(); } if (d.st === 'fall' || d.st === 'land') { ctx.fillStyle = ink; ctx.beginPath(); ctx.moveTo(X(d.x), Y(d.y + d.h)); ctx.lineTo(X(d.x + 6), Y(d.y + 6)); ctx.lineTo(X(d.x + 22), Y(d.y)); ctx.lineTo(X(d.x + 40), Y(d.y + 12)); ctx.lineTo(X(d.x + 38), Y(d.y + d.h)); ctx.fill(); } }
    for (const g of L.dogs) if (g.st === 'run') { const n = { type: 'dog', T: NPCT.dog, face: g.face || 1, vx: g.vx, ph: g.ph, st: 'chase', aw: 1, x: g.x }; ctx.save(); ctx.translate(X(g.x + 15), Y(WALK_GY)); ctx.filter = 'brightness(0.15)'; Rig.drawNPC(ctx, n, 0, 0, 1); ctx.filter = 'none'; ctx.restore(); ctx.fillStyle = grey(230); ctx.fillRect(X(g.x + 15) + (g.face || 1) * 15, Y(WALK_GY - 20.5), 1.6, 1.6); }
    for (const c of L.checks) { const x = X(c.x), y = Y(this.groundAt(c.x)); ctx.fillStyle = ink; ctx.fillRect(x - 1.5, y - 46, 3, 46); ctx.save(); ctx.translate(x, y - 50); ctx.rotate(t * (c.lit ? 1.2 : 0.3)); ctx.fillStyle = grey(c.lit || (this.cp != null && this.cp >= c.x) ? 245 : 120); ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3.5 : 8; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); ctx.restore(); }
    { const x = X(L.exit + 60), y = Y(WALK_GY); ctx.fillStyle = grey(200, 0.12 + 0.05 * Math.sin(t * 2)); ctx.beginPath(); ctx.ellipse(x, y - 60, 70, 90, 0, 0, TAU); ctx.fill(); ctx.fillStyle = ink; ctx.fillRect(x - 24, y - 92, 48, 92); ctx.fillStyle = grey(190, 0.7); ctx.fillRect(x - 16, y - 84, 32, 84); }
    this.drawToby(ctx, X(P.x + 7), Y(P.y + P.h));
    this.backLayer(ctx, 1.6, grey(3), 2);
    // weather
    if (C.part === 'rain') { ctx.strokeStyle = grey(200, 0.22); ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 70; k++) { const p = (t * 1.6 + PH(k, 501)) % 1, x = (PH(k, 502) * (W + 60) - cx * 0.2) % (W + 60), y = p * H; ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 14); } ctx.stroke(); }
    else { ctx.fillStyle = grey(C.part === 'snow' ? 235 : 160, C.part === 'snow' ? 0.8 : 0.5); for (let k = 0; k < 50; k++) { const p = (t * (C.part === 'snow' ? 0.08 : 0.04) + PH(k, 503)) % 1, x = ((PH(k, 504) * (W + 60) + Math.sin(t + k) * 12 - cx * 0.3) % (W + 60) + W + 60) % (W + 60), y = p * H; ctx.fillRect(x, y, 1.8, 1.8); } }
    Parts.draw(ctx, true);
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.95); vg.addColorStop(0, grey(0, 0)); vg.addColorStop(1, grey(0, 0.7)); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (P.dead) { ctx.fillStyle = grey(0, clamp((P.dead - 0.5) / 0.8, 0, 1)); ctx.fillRect(0, 0, W, H); }
    if (this.done) { ctx.fillStyle = grey(255, clamp(this.done / 1.2, 0, 1) * 0.5); ctx.fillRect(0, 0, W, H); }
    txt(ctx, (L.ch + 1) + '-' + (L.i % 10 + 1) + '  ' + WALK_CH[L.ch].n, 20, 28, 11, G.paper, 'left', { serif: true });
    txt(ctx, 'stars ' + L.stars.filter(s => s.got).length + '/' + L.stars.length + '    falls ' + this.deaths, 20, 46, 9, G.fog, 'left', { normal: true });
    txt(ctx, Input.glyph('pause') + ': pause', W - 20, 28, 9, G.fog, 'right', { normal: true });
    Render.post(ctx, {});
  }
  backLayer(ctx, par, col, kind) {
    const L = this.L, ch = L.ch, cx = this.cam.x * par, t = this.t, base = kind === 2 ? H + 10 : H / 2 + 40 + 90 * (1 - par);
    ctx.fillStyle = col;
    for (let k = Math.floor((cx - 400) / 160); k < (cx + W + 400) / 160; k++) {
      const x = k * 160 - cx, r1 = PH(k + kind * 999, 61 + ch), r2 = PH(k + kind * 999, 71 + ch);
      if (kind === 2) { if (r1 < 0.6) continue; ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + 20 + Math.sin(t + k) * 4, base - 60 - r2 * 70, x + 40, base); ctx.fill(); continue; }
      if (ch === 0) { const h = 80 + r1 * 120; ctx.fillRect(x + 70, base - h, 6, h); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 73, base - h * 0.6); ctx.lineTo(x + 40, base - h * 0.9); ctx.moveTo(x + 73, base - h * 0.75); ctx.lineTo(x + 110, base - h); ctx.stroke(); }
      else if (ch === 1) { if (r1 < 0.5) { ctx.fillRect(x, base - 50, 140, 40); ctx.beginPath(); ctx.arc(x + 30, base - 8, 10, 0, TAU); ctx.arc(x + 110, base - 8, 10, 0, TAU); ctx.fill(); } else { ctx.fillRect(x + 60, base - 200, 8, 200); ctx.fillRect(x + 20, base - 200, 120, 6); ctx.fillRect(x + 120, base - 194, 2, 60 + r2 * 40); } }
      else if (ch === 2) { const h = 60 + r1 * 100; ctx.beginPath(); ctx.moveTo(x + 10, base); ctx.lineTo(x + 10, base - h); ctx.lineTo(x + 70, base - h - 40); ctx.lineTo(x + 130, base - h); ctx.lineTo(x + 130, base); ctx.fill(); }
      else if (ch === 3) { const h = 140 + r1 * 160; ctx.fillRect(x + 40, base - h, 26, h); ctx.fillRect(x, base - 80, 150, 80); if (par > 0.3) smokeColumn(ctx, x + 53, base - h, t + k, { rise: 200, al: 0.1, g: 120, wind: 0.9 }); ctx.fillStyle = col; }
      else { ctx.fillRect(x, base - 120, 160, 6); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, base - 120); ctx.quadraticCurveTo(x + 80, base - 60, x + 160, base - 120); ctx.stroke(); for (let j = 0; j < 8; j++) ctx.fillRect(x + j * 20, base - 120, 1.5, 30 + Math.abs(4 - j) * 8); ctx.fillRect(x + 76, base - 260, 8, 260); }
    }
  }
  drawToby(ctx, x, y) {
    const P = this.P, t = this.t, run = P.on && Math.abs(P.vx) > 20, sw = run ? Math.sin(P.ph) : 0, ink = grey(6);
    ctx.save(); ctx.translate(x, y);
    if (P.dead) { const k = clamp(P.dead / 0.4, 0, 1); ctx.rotate(P.face * k * 1.4); ctx.translate(0, -k * 2); }
    ctx.scale(P.face, 1);
    const air = !P.on, lean = run ? 0.08 : 0;
    ctx.strokeStyle = ink; ctx.lineCap = 'round'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-2, -12); ctx.lineTo(-2 - (air ? 4 : sw * 6), -1 + (air ? -3 : 0)); ctx.moveTo(2, -12); ctx.lineTo(2 + (air ? 5 : sw * 6), -1 + (air ? -5 : 0)); ctx.stroke();
    ctx.save(); ctx.rotate(lean); ctx.fillStyle = ink; rrect(ctx, -6, -27, 12, 17, 4); ctx.fill();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(air ? 9 : -sw * 8, air ? -32 : -14); ctx.moveTo(0, -24); ctx.lineTo(air ? -7 : sw * 8, air ? -30 : -14); ctx.stroke();
    ctx.beginPath(); ctx.arc(1, -32, 6.5, 0, TAU); ctx.fill();
    // the only colour in the world: Toby's orange hat
    const sv = SURVIVORS.toby; ctx.fillStyle = hsl(sv.hue, 1, 0); ctx.beginPath(); ctx.arc(1, -34, 6.8, Math.PI, TAU); ctx.fill(); ctx.fillRect(-6, -35, 14, 2.4); ctx.beginPath(); ctx.arc(-3, -41 + (run && !calm() ? Math.sin(t * 12) : 0), 2.2, 0, TAU); ctx.fill();
    ctx.restore(); ctx.restore();
  }
}

/* ---------- menu, interludes and the story ---------- */
class WalkMenuScene {
  enter() {
    this.t = 0; const W2 = Save.data.walk || (Save.data.walk = { un: 0, deaths: 0 }); Snd.setTrack('ch1');
    this.pick = Math.min(49, num(W2.un));
    const start = lvl => { if (lvl === 0 && !W2.seenIntro) { W2.seenIntro = 1; Save.write(); Game.go('Cutscene', { script: WALK_STORY.intro, title: 'The Long Walk', next: () => Game.go('Walk', { lvl: 0 }, 'iris') }, 'flicker'); } else Game.go('Walk', { lvl }, 'iris'); };
    this.menu = new Menu({ x: 40, y: 80, w: 380, key: 'walkmenu', title: 'The Long Walk', maxRows: 9, items: [
      { label: () => (num(W2.un) >= 50 ? 'Walk it again' : num(W2.un) ? 'Continue: level ' + (Math.floor(Math.min(49, W2.un) / 10) + 1) + '-' + (Math.min(49, W2.un) % 10 + 1) : 'Begin the walk'), sub: 'Toby walks home alone, following the paper stars.', act: () => start(num(W2.un) >= 50 ? 0 : num(W2.un)) },
      { type: 'choice', label: 'Choose a level', choices: Array.from({ length: Math.min(50, num(W2.un) + 1) }, (_, i) => i), get: () => this.pick, set: v => { this.pick = v; }, fmt: v => (Math.floor(v / 10) + 1) + '-' + (v % 10 + 1) + '  ' + WALK_CH[Math.floor(v / 10)].n, sub: 'Any level you have reached.' },
      { label: 'Play the chosen level', act: () => start(this.pick) },
      { label: 'Watch the prologue', act: () => Game.go('Cutscene', { script: WALK_STORY.intro, title: 'The Long Walk', next: () => Game.go('WalkMenu', {}, 'flicker') }, 'flicker') },
      { label: 'Watch the ending', hidden: () => !W2.done, act: () => Game.go('Cutscene', { script: WALK_STORY.end, title: 'Home', next: () => Game.go('WalkMenu', {}, 'flicker') }, 'flicker') }],
      onBack: () => Game.go('Title', {}, 'flicker') });
  }
  update(dt) { this.t += dt; this.menu.update(dt); }
  render(ctx) {
    const t = this.t, W2 = Save.data.walk || {};
    ctx.fillStyle = grey(24); ctx.fillRect(0, 0, W, H); WALK_VIG.road(ctx, t, 2, 0.6);
    this.menu.render(ctx);
    UI.paper(ctx, 500, 80, 420, 330, { seed: 140, rot: 0.006 });
    txt(ctx, 'Five chapters, fifty levels', 524, 116, 16, G.ink, 'left', { outline: false, serif: true });
    WALK_CH.forEach((c, i) => { const y = 150 + i * 50, got = num(W2.un) > i * 10; ctx.fillStyle = got ? G.ink : G.ash; ctx.beginPath(); ctx.arc(540, y, 10, 0, TAU); ctx.fill(); txt(ctx, String(i + 1), 540, y + 4, 10, G.bone, 'center', { outline: false, fixed: true }); txt(ctx, c.n, 560, y - 2, 13, got ? G.ink : G.iron, 'left', { outline: false, serif: true }); txt(ctx, c.d, 560, y + 14, 9, G.coal, 'left', { outline: false, normal: true }); });
    txt(ctx, 'Reached ' + Math.min(50, num(W2.un)) + ' of 50.   Falls so far: ' + num(W2.deaths), 524, 400, 10, G.iron, 'left', { outline: false });
    Render.post(ctx, {});
  }
}
/* the vignettes between levels: all drawn in silhouette, with Toby's hat for colour */
const WALK_VIG = {
  ground(ctx, y) { ctx.fillStyle = grey(7); ctx.fillRect(0, y, W, H - y); },
  kid(ctx, x, y, t, s, walk) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); const sw = walk && !calm() ? Math.sin(t * 7) : 0; ctx.strokeStyle = grey(6); ctx.lineCap = 'round'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-2, -12); ctx.lineTo(-2 - sw * 6, -1); ctx.moveTo(2, -12); ctx.lineTo(2 + sw * 6, -1); ctx.stroke(); ctx.fillStyle = grey(6); rrect(ctx, -6, -27, 12, 17, 4); ctx.fill(); ctx.beginPath(); ctx.arc(1, -32, 6.5, 0, TAU); ctx.fill(); ctx.fillStyle = hsl(SURVIVORS.toby.hue, 1, 0); ctx.beginPath(); ctx.arc(1, -34, 6.8, Math.PI, TAU); ctx.fill(); ctx.fillRect(-6, -35, 14, 2.4); ctx.beginPath(); ctx.arc(-3, -41, 2.2, 0, TAU); ctx.fill(); ctx.restore(); },
  road(ctx, t, ch, k) { const C = WALK_CH[ch], g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, grey(C.sky[1])); g.addColorStop(1, grey(C.sky[0])); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); const mg = ctx.createRadialGradient(700, 120, 4, 700, 120, 200); mg.addColorStop(0, grey(230, 0.4)); mg.addColorStop(1, grey(230, 0)); ctx.fillStyle = mg; ctx.fillRect(0, 0, W, 400);
    ctx.fillStyle = grey(C.sky[0] - 22); for (let i = 0; i < 12; i++) { const x = ((i * 110 - t * 10) % 1320 + 1320) % 1320 - 180, h = 60 + PH(i, 81 + ch) * 120; ctx.fillRect(x, 400 - h, 70, h); } this.ground(ctx, 400); },
  walk(ctx, t, ch) { this.road(ctx, t, ch); this.kid(ctx, 160 + Math.min(1, t / 8) * 520, 400, t, 2.2, t < 8); },
  star(ctx, t, ch) { this.road(ctx, t, ch); const sy = Math.min(340, 40 + t * 60), sx = 520 + Math.sin(t * 1.3) * 40; ctx.save(); ctx.translate(sx, sy); ctx.rotate(t); ctx.fillStyle = grey(240); ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4 : 10; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); ctx.restore(); this.kid(ctx, 500, 400, t, 2.2, false); },
  rest(ctx, t, ch) { this.road(ctx, t, ch); const f = Math.sin(t * 9) * 0.1; const g = ctx.createRadialGradient(470, 390, 2, 470, 390, 120 * (1 + f)); g.addColorStop(0, 'hsla(30,90%,55%,0.35)'); g.addColorStop(1, 'hsla(30,90%,55%,0)'); ctx.fillStyle = g; ctx.fillRect(330, 260, 280, 160); ctx.fillStyle = 'hsla(36,95%,60%,0.9)'; ctx.beginPath(); ctx.ellipse(470, 392, 6 * (1 + f), 12, 0, 0, TAU); ctx.fill(); smokeColumn(ctx, 470, 380, t, { rise: 200, al: 0.12, g: 120, wind: 0.6 }); this.kid(ctx, 430, 400, t, 2.2, false); },
  train(ctx, t, ch) { this.road(ctx, t, ch); ctx.fillStyle = grey(10); const x0 = ((t * 120) % 2400) - 1400; for (let i = 0; i < 8; i++) { ctx.fillRect(x0 + i * 170, 300, 160, 80); ctx.beginPath(); ctx.arc(x0 + i * 170 + 30, 384, 12, 0, TAU); ctx.arc(x0 + i * 170 + 130, 384, 12, 0, TAU); ctx.fill(); } this.kid(ctx, 160, 400, t, 2.2, false); },
  birds(ctx, t, ch) { this.road(ctx, t, ch); ctx.strokeStyle = grey(10); ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { const x = ((t * (40 + i * 6) + i * 120) % 1200) - 100, y = 90 + i * 16 + Math.sin(t + i) * 8, fl = Math.sin(t * 8 + i) * 6; ctx.beginPath(); ctx.moveTo(x - 9, y - fl); ctx.lineTo(x, y); ctx.lineTo(x + 9, y - fl); ctx.stroke(); } this.kid(ctx, 320 + Math.min(1, t / 8) * 200, 400, t, 2.2, t < 8); },
  window(ctx, t, ch) { this.road(ctx, t, ch); ctx.fillStyle = grey(14); ctx.fillRect(560, 120, 220, 280); for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) { const lit = (r * 4 + c) === 6 || (t > 2 && (r * 4 + c) === 9); ctx.fillStyle = lit ? 'hsla(40,90%,58%,0.9)' : grey(26); ctx.fillRect(574 + c * 52, 134 + r * 52, 30, 30); } this.kid(ctx, 330, 400, t, 2.2, false); }
};
const WALK_VIG_ORDER = ['walk', 'star', 'birds', 'rest', 'walk', 'train', 'star', 'window', 'birds', 'rest'];
class WalkInterludeScene {
  enter(p) { this.p = p; this.t = 0; this.st = { n: 0 }; this.line = WALK_STORY.lines[p.lvl] || ''; this.ch = Math.floor(p.lvl / 10); this.vig = p.lvl === 49 ? 'window' : WALK_VIG_ORDER[p.lvl % 10]; Snd.duck(2); }
  next() { if (this.done) return; this.done = true; const n = this.p.lvl + 1;
    const back = this.p.free ? 'Unlocked' : 'WalkMenu';
    if (n >= 50) Game.go('Cutscene', { script: WALK_STORY.end, title: 'Home', next: () => Game.go('Credits', { next: () => Game.go(back, {}, 'flicker') }, 'flicker') }, 'flicker');
    else if (n % 10 === 0) Game.go('WalkInterlude', { chapter: n / 10, lvl: -1, nextLvl: n, free: this.p.free }, 'tear');
    else Game.go('Walk', { lvl: n, free: this.p.free }, 'iris'); }
  update(dt) {
    this.t += dt; const text = this.p.chapter != null ? WALK_CH[this.p.chapter].d : this.line; if (this.t > 0.8) typeOut(this.st, text, dt, 30);
    if (this.t > 0.6 && (Input.menu.ok || Input.ptr.click || Input.menu.back)) { if (this.st.n < text.length) this.st.n = text.length; else if (this.p.chapter != null) { if (!this.done) { this.done = true; Game.go('Walk', { lvl: this.p.nextLvl, free: this.p.free }, 'iris'); } } else this.next(); }
  }
  render(ctx) {
    const t = this.t;
    if (this.p.chapter != null) {
      const c = WALK_CH[this.p.chapter]; WALK_VIG.road(ctx, t * 0.5, this.p.chapter); ctx.fillStyle = grey(0, 0.45); ctx.fillRect(0, 0, W, H);
      const k = calm() ? 1 : Ease.outCubic(clamp(t / 1.2, 0, 1)); ctx.globalAlpha = k;
      txt(ctx, 'CHAPTER ' + ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'][this.p.chapter], W / 2, 200, 12, G.fog, 'center', { fixed: true }); txt(ctx, c.n, W / 2, 246, 34, G.paper, 'center', { serif: true });
      ctx.fillStyle = grey(200, 0.6); ctx.fillRect(W / 2 - 120 * k, 266, 240 * k, 1.5); txt(ctx, c.d.slice(0, this.st.n), W / 2, 296, 13, G.bone, 'center', { serif: true, normal: true }); ctx.globalAlpha = 1;
    } else {
      WALK_VIG[this.vig](ctx, t, this.ch);
      ctx.fillStyle = grey(0, 0.55); ctx.fillRect(0, 430, W, 110);
      txt(ctx, 'Level ' + (this.ch + 1) + '-' + (this.p.lvl % 10 + 1) + ' complete' + (this.p.deaths ? '   (' + this.p.deaths + ' falls)' : '   (no falls)'), 40, 456, 10, G.fog, 'left', { fixed: true });
      txtWrap(ctx, this.line.slice(0, this.st.n), 40, 482, 860, 14, G.paper, { serif: true, normal: true });
    }
    const ready = this.st.n >= (this.p.chapter != null ? WALK_CH[this.p.chapter].d : this.line).length; ctx.globalAlpha = ready ? 1 : 0.4; UI.prompt(ctx, 'interact', 'Walk on', W - 150, 522); ctx.globalAlpha = 1;
    Render.post(ctx, {});
  }
}
MODES.splice(1, 0, { id: 'longwalk', n: 'The Long Walk', d: 'A different journey: Toby walks home alone through fifty levels of the dark city. A puzzle platformer.', kind: 'walk', coop: 1 });
MODE_BY_ID.longwalk = MODES[1];
(function () { const _st = Flow.start; Flow.start = function (mode, o) { if (mode === 'longwalk') { Game.go('WalkMenu', {}, 'flicker'); return; } return _st.call(this, mode, o); }; })();
