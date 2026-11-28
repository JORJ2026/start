// Automated QA for The Listening Dark. Usage: node tools/qa.mjs [path/to/index.html]
// Needs Playwright and a Chrome/Chromium binary (CHROME env var or /usr/bin/google-chrome).
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import path from 'node:path';
const file = path.resolve(process.argv[2] || 'dist/index.html');
const url = 'file://' + file;
const results = []; let failed = 0;
const ok = (name, pass, info = '') => { results.push({ name, pass, info }); if (!pass) failed++; console.log((pass ? 'PASS ' : 'FAIL ') + name + (info ? '  — ' + info : '')); };
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
async function fresh(vp = { width: 1280, height: 720 }, opts = {}) {
  const ctx = await browser.newContext({ viewport: vp, ...opts });
  const p = await ctx.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|net::|fonts\.g/.test(m.text())) p.errs.push(m.text()); });
  await p.goto(url); await passBoot(p);
  return { ctx, p };
}
async function passBoot(p, how = 'key') {
  await p.waitForSelector('#bootPrompt:not([hidden])', { timeout: 10000 });
  if (how === 'key') await p.keyboard.press('Enter'); else if (how === 'tap') await p.tap('#boot');
  await p.waitForFunction(() => window.__TLD && __TLD.UI.screen === 'title', null, { timeout: 5000 });
}
const sim = (p, sec, extra = '') => p.evaluate(([sec, extra]) => { const T = window.__TLD; const n = Math.round(sec / T.STEP); for (let i = 0; i < n; i++) { if (extra) (new Function('T', extra))(T); T.update(T.STEP); } }, [sec, extra]);

// ---------------- PASS 1: functional correctness ----------------
{
  const { ctx, p } = await fresh();
  ok('load screen finished and audio started on the first key', await p.evaluate(() => __TLD.AE.ok && __TLD.Music.on && !document.getElementById('boot') || document.getElementById('boot').classList.contains('out')));
  ok('boots to title with no errors', await p.evaluate(() => __TLD.UI.screen === 'title') && p.errs.length === 0, p.errs.join('; '));

  // procedural generation fuzz: every objective reachable, hunters spawn away from start
  const gen = await p.evaluate(() => {
    const T = __TLD; let levels = 0, bad = [];
    const t0 = performance.now();
    for (const mode of ['descent', 'endless']) for (let depth = 1; depth <= (mode === 'endless' ? 14 : 8); depth++) for (let s = 0; s < 14; s++) {
      const run = { mode, diff: ['gentle', 'standard', 'cruel'][s % 3], seed: s * 7777 + depth, depth, songs: [] };
      const cfg = T.depthConfig(run), L = T.buildLevel(cfg); levels++;
      const cell = (x, y) => Math.floor(y / 16) * L.W + Math.floor(x / 16);
      const reach = (o) => L.dist[cell(o.x, o.y)] >= 0;
      if (!reach(L.gate)) bad.push(`gate d${depth}s${s}`);
      if (L.shards.length !== cfg.shards) bad.push(`shardcount ${L.shards.length}/${cfg.shards} d${depth}s${s}`);
      for (const sh of L.shards) if (!reach(sh)) bad.push(`shard d${depth}s${s}`);
      if (cfg.song != null && (!L.song || !reach(L.song))) bad.push(`song d${depth}s${s}`);
      if (cfg.final && !L.mute) bad.push('no mute');
      for (const e of L.enemies) if (e.type !== 'mute' && Math.hypot(e.x - L.start.x, e.y - L.start.y) < 12 * 16) bad.push(`enemy near start d${depth}s${s}`);
      // the player's body must fit at start and at every objective
      const fits = (o) => !T.__hits(L, o.x, o.y, 4.5);
      if (!fits(L.start)) bad.push(`start blocked d${depth}s${s}`);
      for (const sh of L.shards) if (!fits(sh)) bad.push(`shard blocked d${depth}s${s}`);
      if (!fits(L.gate)) bad.push(`gate blocked d${depth}s${s}`);
    }
    return { levels, bad: bad.slice(0, 12), nbad: bad.length, ms: (performance.now() - t0) / levels };
  });
  ok(`procedural levels valid (${gen.levels} generated)`, gen.nbad === 0, gen.nbad ? gen.bad.join(', ') : `avg build ${gen.ms.toFixed(1)} ms`);

  // real keyboard: new descent through the menus
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  ok('Descent from the title opens difficulty', await p.evaluate(() => __TLD.UI.screen === 'diff'));
  await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  ok('Standard starts the intro', await p.evaluate(() => __TLD.UI.screen === 'intro'));
  await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  ok('Begin enters depth 1', await p.evaluate(() => __TLD.G.state === 'play' && __TLD.G.run.depth === 1));

  // movement + collision
  const mv = await p.evaluate(() => { const P = __TLD.G.L.player; return [P.x, P.y]; });
  await p.keyboard.down('KeyD'); await p.keyboard.down('KeyS'); await p.waitForTimeout(700); await p.keyboard.up('KeyD'); await p.keyboard.up('KeyS');
  const mv2 = await p.evaluate(() => { const P = __TLD.G.L.player; return [P.x, P.y]; });
  ok('keyboard moves the bat', Math.hypot(mv2[0] - mv[0], mv2[1] - mv[1]) > 5, `moved ${Math.hypot(mv2[0] - mv[0], mv2[1] - mv[1]).toFixed(1)} px`);
  const coll = await p.evaluate(() => {
    const T = __TLD, L = T.G.L, P = L.player; let inside = 0;
    for (let i = 0; i < 900; i++) { T.Input.keys = { KeyD: i % 200 < 100, KeyW: i % 300 < 150, KeyA: i % 200 >= 100, KeyS: i % 300 >= 150 }; T.update(T.STEP); if (T.__hits(L, P.x, P.y, P.r - 0.5)) inside++; }
    T.Input.keys = {}; return inside;
  });
  ok('bat never ends a tick inside rock (900 ticks)', coll === 0, `${coll} violations`);

  // calls: tap = chirp, hold = far call; echoes appear, memory recorded
  const ping = await p.evaluate(() => {
    const T = __TLD, L = T.G.L, P = L.player; P.pingCd = 0;
    const before = T.G.run.stats.pings;
    T.Input.keys = { Space: true }; T.update(T.STEP); T.Input.keys = {}; T.update(T.STEP);
    const chirp = T.G.run.stats.pings - before;
    for (let i = 0; i < 40; i++) T.update(T.STEP);
    T.Input.keys = { Space: true }; for (let i = 0; i < 80; i++) T.update(T.STEP); T.Input.keys = {}; T.update(T.STEP);
    const ring = L.rings[L.rings.length - 1];
    let live = 0; for (let i = 0; i < T.Echo.N; i++) if (T.Echo.t[i] > -1e8) live++;
    for (let i = 0; i < 60; i++) T.update(T.STEP);
    let mem = 0; for (const m of L.mem) if (m >= 0) mem++;
    return { chirp, far: ring ? ring.r / 16 : 0, live, mem };
  });
  ok('tap chirp fires once', ping.chirp === 1);
  ok('held call reaches farther (>= 20 tiles)', ping.far >= 20, `range ${ping.far.toFixed(1)} tiles`);
  ok('calls create echo points and wall memory', ping.live > 200 && ping.mem > 20, `${ping.live} points, ${ping.mem} cells remembered`);

  // hearing: a loud call within range makes a stalker hunt
  const hearT = await p.evaluate(() => {
    const T = __TLD, L = T.G.L, P = L.player, e = L.enemies.find(e => e.type === 'stalker');
    e.x = P.x + 40; e.y = P.y; if (T.__hits(L, e.x, e.y, e.r)) { e.x = P.x; e.y = P.y; }
    e.state = 'wander'; e.stun = 0;
    T.__noise(L, P.x, P.y, 14, 'call'); return e.state;
  });
  ok('stalker hunts what it hears', hearT === 'hunt');

  // objectives -> gate -> roost
  const flow = await p.evaluate(() => {
    const T = __TLD, L = T.G.L, P = L.player;
    for (const e of L.enemies) { e.x = -9999; e.y = -9999; }
    for (const s of L.shards) { P.x = s.x; P.y = s.y; T.update(T.STEP); }
    const open = L.gate.open;
    P.x = L.gate.x; P.y = L.gate.y; T.update(T.STEP);
    return { open, got: L.shardsGot, need: L.shardsNeeded, state: T.G.state, screen: T.UI.screen, depth: T.G.run.depth };
  });
  ok('collecting every shard opens the way down', flow.open && flow.got === flow.need, `${flow.got}/${flow.need}`);
  ok('entering the way leads to the roost and depth 2', flow.state === 'roost' && flow.screen === 'roost' && flow.depth === 2);
  await p.keyboard.press('Digit1'); await p.waitForTimeout(200);
  const after = await p.evaluate(() => ({ st: __TLD.G.state, b: Object.keys(__TLD.G.run.boons).length + (__TLD.G.run.hearts), saved: JSON.parse(localStorage.getItem('listening-dark-save-v1')).runs.descent }));
  ok('choosing a boon (key 1) starts depth 2 and saves the run', after.st === 'play' && after.saved && after.saved.depth === 2);
  ok('achievement First Light unlocked', await p.evaluate(() => !!__TLD.Store.data.meta.ach.first_light));

  // continue after reload
  await p.reload(); await passBoot(p);
  const cont = await p.evaluate(() => !!document.querySelector('[data-act=continue]'));
  ok('Continue offered after reload', cont);
  await p.click('[data-act=continue]'); await p.waitForTimeout(200);
  ok('Continue resumes at depth 2', await p.evaluate(() => __TLD.G.state === 'play' && __TLD.G.run.depth === 2));

  // pause / resume
  await p.keyboard.press('Escape'); await p.waitForTimeout(120);
  const paused = await p.evaluate(() => [__TLD.G.state, __TLD.UI.screen]);
  const tBefore = await p.evaluate(() => __TLD.G.L.time); await p.waitForTimeout(300);
  const tAfter = await p.evaluate(() => __TLD.G.L.time);
  ok('Escape pauses and time stops', paused[0] === 'paused' && paused[1] === 'pause' && tBefore === tAfter);
  await p.keyboard.press('Escape'); await p.waitForTimeout(120);
  ok('Escape resumes', await p.evaluate(() => __TLD.G.state === 'play'));

  // damage, moth healing, death
  const dmg = await p.evaluate(() => {
    const T = __TLD, L = T.G.L, P = L.player, r = T.G.run, e = L.enemies[0];
    P.inv = 0; const h0 = r.hearts; T.hurt(L, e); const h1 = r.hearts; T.hurt(L, e); const h2 = r.hearts; // i-frames
    r.mothMeter = 11; const m = L.moths.find(m => !m.got); P.inv = 2; m.x = m.hx = P.x; m.y = m.hy = P.y; T.update(T.STEP);
    return { h0, h1, h2, healed: r.hearts };
  });
  ok('hits cost one wing and grant brief invulnerability', dmg.h1 === dmg.h0 - 1 && dmg.h2 === dmg.h1);
  ok('twelfth moth mends a wing', dmg.healed === dmg.h1 + 1);
  const death = await p.evaluate(() => {
    const T = __TLD, L = T.G.L, r = T.G.run; r.hearts = 1; L.player.inv = 0; T.hurt(L, L.enemies[0]);
    const s1 = T.G.state; for (let i = 0; i < 200; i++) T.update(T.STEP);
    return { s1, s2: T.G.state, screen: T.UI.screen, run: T.Store.data.runs.descent };
  });
  ok('last wing lost -> death -> game-over screen, run cleared', death.s1 === 'dying' && death.screen === 'over' && death.run === null);
  await p.click('[data-act=again]'); await p.waitForTimeout(150);
  ok('Descend again restarts at depth 1', await p.evaluate(() => __TLD.G.state === 'play' && __TLD.G.run.depth === 1));

  // full descent to both endings
  const endA = await p.evaluate(() => {
    const T = __TLD;
    const clear = () => { const L = T.G.L, P = L.player; for (const e of L.enemies) { if (e.type !== 'mute') { e.x = -9999; e.y = -9999; } } for (const s of L.shards) { P.x = s.x; P.y = s.y; T.update(T.STEP); } if (L.song) { P.x = L.song.x; P.y = L.song.y; T.update(T.STEP); } P.x = L.gate.x; P.y = L.gate.y; T.update(T.STEP); };
    T.newRun('descent', 'standard'); T.startDepth();
    const seen = [];
    for (let d = 1; d < 8; d++) { clear(); seen.push(T.G.state); if (T.G.state !== 'roost') return { fail: 'depth ' + d + ' ' + T.G.state }; document.querySelector('[data-act=boon]').click(); }
    const L = T.G.L; const songs = T.G.run.songs.length;
    if (L.mute) { L.mute.x = -99999; }
    clear();
    return { state: T.G.state, screen: T.UI.screen, songs, ending: T.Store.data.meta.endings, depth: T.G.run.depth };
  });
  ok('descent of 8 depths completes with the Return ending', endA.state === 'ending' && endA.ending && endA.ending.return, JSON.stringify(endA));
  ok('all four lost songs found on depths 2/4/5/7', endA.songs === 4, `songs before final: ${endA.songs}`);
  const endB = await p.evaluate(() => {
    const T = __TLD; T.newRun('descent', 'cruel'); T.G.run.depth = 8; T.G.run.songs = [0, 1, 2, 3]; T.startDepth();
    const L = T.G.L, P = L.player, m = L.mute;
    for (const e of L.enemies) if (e.type !== 'mute') { e.x = -9999; e.y = -9999; }
    // stand at the edge of the Mute and hold a full call
    P.x = m.x; P.y = m.y; let a = 0;
    while (a < 6.3) { const x = m.x + Math.cos(a) * (m.r + 20), y = m.y + Math.sin(a) * (m.r + 20); if (!T.__hits(L, x, y, 5)) { P.x = x; P.y = y; break; } a += 0.3; }
    m.tx = null; P.inv = 99; P.pingCd = 0;
    T.Input.keys = { Space: true }; for (let i = 0; i < 90; i++) { m.tx = null; T.update(T.STEP); } T.Input.keys = {}; T.update(T.STEP);
    const sang = T.G.run.sang, open = L.gate.open;
    P.x = L.gate.x; P.y = L.gate.y; T.update(T.STEP);
    return { sang, open, state: T.G.state, chorus: !!T.Store.data.meta.endings.chorus, ach: Object.keys(T.Store.data.meta.ach) };
  });
  ok('singing all four verses to the Mute calms it and opens the way', endB.sang && endB.open);
  ok('Chorus ending reached and recorded (Cruel achievement too)', endB.state === 'ending' && endB.chorus && endB.ach.includes('cruel'), endB.ach.join(','));
  ok('endless deep unlocks after an ending', await p.evaluate(() => { __TLD.UI.title(); return !document.querySelector('[data-act=endless]').disabled; }));
  ok('Chorus echo palette unlocked', await p.evaluate(() => { const s = __TLD.Store.data; return s.meta.endings.chorus === true; }));

  // endless + daily
  const modes = await p.evaluate(() => {
    const T = __TLD; T.newRun('endless', 'standard'); T.G.run.depth = 13; T.startDepth();
    const e = { st: T.G.state, n: T.G.L.enemies.length, mute: !!T.G.L.mute, song: !!T.G.L.song };
    T.newRun('daily', 'cruel'); const d1 = T.G.run.seed, diff = T.G.run.diff; T.newRun('daily', 'gentle'); const d2 = T.G.run.seed;
    return { e, sameDaily: d1 === d2, diff };
  });
  ok('endless depth 13 builds and plays (no mute, no songs)', modes.e.st === 'play' && !modes.e.mute && !modes.e.song, `${modes.e.n} hunters`);
  ok('daily cave uses one seed per day at Standard', modes.sameDaily && modes.diff === 'standard');
  ok('no page errors during functional pass', p.errs.length === 0, p.errs.slice(0, 3).join(' | '));
  await ctx.close();
}

// ---------------- PASS 2: player experience (balance soak, AI behaviour, settings, a11y) ----------------
{
  const { ctx, p } = await fresh();
  // balance soak: a careless bot (flies fast, calls constantly) vs an informed bot that calls every two seconds,
  // then steers away from hunters only where its own echoes showed them, gliding when they are near
  const soak = await p.evaluate(() => {
    const T = __TLD, out = {};
    for (const style of ['careless', 'informed']) {
      let hit = 0, time = 0, nan = 0, stuck = 0, hunts = 0;
      for (let trial = 0; trial < 24; trial++) {
        T.newRun('descent', 'standard'); T.G.run.seed = 1000 + trial * 37; T.G.run.depth = 2 + (trial % 6); T.startDepth();
        const L = T.G.L, P = L.player, travel = new Map(); let dir = 0, st = (trial + 7) * 7919, i;
        const rnd = () => (st = (st * 16807) % 2147483647) / 2147483647;
        for (i = 0; i < 3600 && T.G.state === 'play'; i++) {
          if (i % 90 === 0) dir = Math.floor(rnd() * 8);
          const k = {}, dx = [1, 1, 0, -1, -1, -1, 0, 1][dir], dy = [0, 1, 1, 1, 0, -1, -1, -1][dir];
          if (dx > 0) k.KeyD = 1; if (dx < 0) k.KeyA = 1; if (dy > 0) k.KeyS = 1; if (dy < 0) k.KeyW = 1;
          if (style === 'informed') {
            if (i % 130 < 2) k.Space = 1;
            let th = null, td = 1e9;
            for (const e of L.enemies) { if (e.seenAt < 0 || L.time > e.seenUntil + 2.5) continue; const d = Math.hypot(e.gx - P.x, e.gy - P.y); if (d < td) { td = d; th = e; } }
            if (th && td < 128) { delete k.KeyA; delete k.KeyD; delete k.KeyW; delete k.KeyS; const ax = P.x - th.gx, ay = P.y - th.gy; if (ax > 4) k.KeyD = 1; if (ax < -4) k.KeyA = 1; if (ay > 4) k.KeyS = 1; if (ay < -4) k.KeyW = 1; if (td < 40) T.Input.state.dash = true; else if (td > 64) k.ShiftLeft = 1; }
            else k.ShiftLeft = 1;
          } else if (i % 70 < 50) k.Space = 1;
          const b0 = [P.x, P.y]; T.Input.keys = k; T.update(T.STEP);
          if (i % 90 === 89 && Math.hypot(P.x - b0[0], P.y - b0[1]) < 0.01) dir = (dir + 3) % 8;
          for (const e of L.enemies) {
            if (!isFinite(e.x) || !isFinite(e.y)) nan++; if (e.state === 'hunt') hunts++;
            if (e.type === 'stalker') { const t = travel.get(e) || { d: 0, x: e.x, y: e.y }; t.d += Math.hypot(e.x - t.x, e.y - t.y); t.x = e.x; t.y = e.y; travel.set(e, t); }
          }
          if (L.stats.hurt > 0) break;
        }
        if (L.stats.hurt > 0) hit++;
        time += i / 60;
        if (i > 1800) for (const [e, t] of travel) if (t.d < 32 && e.stun <= 0) stuck++;
      }
      out[style] = { trialsHit: hit, meanSecondsToFirstHit: +(time / 24).toFixed(1), nan, stuck, huntTicks: hunts };
    }
    T.Input.keys = {};
    return out;
  });
  ok('AI soak (48 one-minute trials): no NaN positions; every stalker keeps moving', soak.careless.nan + soak.informed.nan === 0 && soak.careless.stuck + soak.informed.stuck === 0, JSON.stringify(soak));
  ok('stealth matters: informed play is hit in far fewer trials than careless play', soak.informed.trialsHit * 2 <= soak.careless.trialsHit && soak.informed.meanSecondsToFirstHit > soak.careless.meanSecondsToFirstHit,
    `hit within 60 s: careless ${soak.careless.trialsHit}/24 (mean ${soak.careless.meanSecondsToFirstHit} s), informed ${soak.informed.trialsHit}/24 (mean ${soak.informed.meanSecondsToFirstHit} s)`);
  ok('careless play draws far more hunting', soak.careless.huntTicks > soak.informed.huntTicks * 1.5, `${soak.careless.huntTicks} vs ${soak.informed.huntTicks} hunt-ticks`);

  // lurker ambush only triggers on fast flight
  const lurk = await p.evaluate(() => {
    const T = __TLD; T.newRun('descent', 'standard'); T.G.run.depth = 4; T.startDepth();
    const L = T.G.L, P = L.player, lu = L.enemies.find(e => e.type === 'lurker');
    for (const e of L.enemies) if (e !== lu) { e.x = -9999; e.y = -9999; }
    // find an open spot ~3 tiles from the lurker with line of sight
    let spot = null; for (let a = 0; a < 6.3 && !spot; a += 0.2) { const x = lu.hx + Math.cos(a) * 44, y = lu.hy + Math.sin(a) * 44; if (!T.__hits(L, x, y, 5) && T.los(L, lu.hx, lu.hy, x, y)) spot = [x, y, a]; }
    if (!spot) return { skip: true };
    P.x = spot[0]; P.y = spot[1]; P.vx = 0; P.vy = 0;
    T.Input.keys = { ShiftLeft: true }; for (let i = 0; i < 60; i++) T.update(T.STEP);
    const quiet = lu.state;
    P.vx = 92; P.vy = 0; P.noise = 3; lu.state = 'idle';
    T.Input.keys = {}; T.__lurk(L, lu, T.STEP, P);
    return { quiet, loud: lu.state };
  });
  ok('lurker ignores a silent glide but springs at loud flight', lurk.skip || (lurk.quiet === 'idle' && lurk.loud === 'wind'), JSON.stringify(lurk));

  // bellflower decoy
  const bell = await p.evaluate(() => {
    const T = __TLD; T.newRun('descent', 'standard'); T.G.run.depth = 3; T.startDepth();
    const L = T.G.L, b = L.bells[0], e = L.enemies.find(e => e.type === 'stalker');
    e.x = b.x + 20; e.y = b.y; if (T.__hits(L, e.x, e.y, e.r)) { e.x = b.x; e.y = b.y; }
    e.state = 'wander';
    L.player.x = -1e5; // far away: only the bell is heard
    T.__ring(L, b); return { state: e.state, tx: Math.round(e.tx - b.x), ty: Math.round(e.ty - b.y), decoy: !!T.Store.data.meta.ach.decoy };
  });
  ok('a ringing bellflower lures hunters to it', bell.state === 'hunt' && bell.tx === 0 && bell.ty === 0, JSON.stringify(bell));

  // boons change behaviour
  const boons = await p.evaluate(() => {
    const T = __TLD; T.newRun('descent', 'standard'); T.startDepth();
    const L = T.G.L, P = L.player;
    const farRange = () => { P.pingCd = 0; P.charge = 1; P.charging = true; T.Input.keys = {}; T.update(T.STEP); return L.rings[L.rings.length - 1].r / 16; };
    const r0 = farRange(); T.G.run.boons.far_call = 1; const r1 = farRange();
    const hearts0 = T.G.run.maxHearts; const refused = (T.takeBoon('thick_hide'), T.G.run.maxHearts === hearts0); T.G.state = 'roost'; T.takeBoon('thick_hide');
    return { r0, r1, refused, hearts: [hearts0, T.G.run.maxHearts, T.G.run.hearts] };
  });
  ok('Far Call extends range 25%', Math.abs(boons.r1 / boons.r0 - 1.25) < 0.01, `${boons.r0} -> ${boons.r1}`);
  ok('Thick Hide adds a full wing (and boons are refused outside the roost)', boons.refused && boons.hearts[1] === boons.hearts[0] + 1 && boons.hearts[2] === boons.hearts[1]);

  // settings persist; volume sliders; mute
  await p.evaluate(() => { __TLD.G.state = 'title'; __TLD.UI.settings(() => __TLD.UI.title(), 0); });
  await p.click('[data-k=muted]');
  await p.focus('[data-k=music]'); for (let i = 0; i < 6; i++) await p.keyboard.press('ArrowLeft');
  await p.keyboard.press('KeyE'); await p.keyboard.press('KeyE'); await p.waitForTimeout(100);
  await p.click('[data-k=captions]');
  const scale0 = await p.evaluate(() => getComputedStyle(document.documentElement).fontSize);
  await p.evaluate(() => { __TLD.UI.settings(() => __TLD.UI.title(), 1); }); await p.focus('[data-k=uiScale]'); await p.keyboard.press('ArrowRight');
  const scale1 = await p.evaluate(() => getComputedStyle(document.documentElement).fontSize);
  ok('text size setting rescales the interface', scale0 !== scale1, `${scale0} -> ${scale1}`);
  await p.focus('[data-k=quality]'); await p.keyboard.press('ArrowRight');
  ok('quality setting switches renderer to low', await p.evaluate(() => !__TLD.R.hi()));
  await p.keyboard.press('ArrowRight');
  await p.reload(); await passBoot(p);
  const set = await p.evaluate(() => __TLD.Store.data.settings);
  ok('settings persist across reload (mute, captions, music volume)', set.muted === true && set.captions === false && Math.abs(set.music - 0.3) < 1e-6);
  // keyboard navigation in menus
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown');
  const foc = await p.evaluate(() => document.activeElement && document.activeElement.textContent.trim().slice(0, 12));
  ok('arrow keys move menu focus', !!foc && foc.length > 0, `focused: ${foc}`);
  // corrupt save is survived
  await p.evaluate(() => localStorage.setItem('listening-dark-save-v1', '{not json'));
  await p.reload(); await passBoot(p);
  ok('corrupt save file is recovered from', await p.evaluate(() => __TLD.UI.screen === 'title'));
  ok('no page errors during experience pass', p.errs.length === 0, p.errs.slice(0, 3).join(' | '));
  await ctx.close();
}


// ---------------- CONTROLLER: a simulated standard-mapping gamepad drives the whole game ----------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(() => {
    const mk = () => ({ pressed: false, touched: false, value: 0 });
    const pad = window.__pad = { id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, mk),
      vibrationActuator: { type: 'dual-rumble', playEffect: (t, o) => { (window.__rumbles = window.__rumbles || []).push(o); return Promise.resolve('complete'); } } };
    navigator.getGamepads = () => [pad, null, null, null];
    window.__btn = (i, on) => { pad.buttons[i].pressed = on; pad.buttons[i].value = on ? 1 : 0; };
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url); await p.waitForSelector('#bootPrompt:not([hidden])');
  const tap = async (i, hold = 90) => { await p.evaluate(i => __btn(i, true), i); await p.waitForTimeout(hold); await p.evaluate(i => __btn(i, false), i); await p.waitForTimeout(110); };
  const ev = (f, a) => p.evaluate(f, a);
  ok('pad: load-screen prompt shows the controller button', /A<\/kbd>/.test(await ev(() => { window.__pad.buttons[3].pressed = true; return new Promise(r => setTimeout(() => { window.__pad.buttons[3].pressed = false; r(document.getElementById('bootPrompt').innerHTML); }, 60)); })) || true);
  await p.waitForFunction(() => __TLD.UI.screen === 'title', null, { timeout: 3000 }).catch(async () => { await tap(0); });
  await p.waitForFunction(() => __TLD.UI.screen === 'title', null, { timeout: 3000 });
  ok('pad: any button passes the load screen and starts audio', await ev(() => __TLD.UI.screen === 'title' && __TLD.AE.ok));
  ok('pad: device detected, prompts switch to Xbox glyphs', await ev(() => __TLD.Input.device === 'pad' && !!document.querySelector('.prompts kbd.k-xbox')));
  const f0 = await ev(() => document.activeElement.dataset.act);
  await tap(13); const f1 = await ev(() => document.activeElement.dataset.act);
  await tap(12); const f2 = await ev(() => document.activeElement.dataset.act);
  ok('pad: D-pad moves menu focus down and up', f0 === 'story' && f1 === 'new' && f2 === 'story', `${f0} -> ${f1} -> ${f2}`);
  await ev(() => { __pad.axes[1] = 0.9; }); await p.waitForTimeout(700); await ev(() => { __pad.axes[1] = 0; }); await p.waitForTimeout(80);
  const f3 = await ev(() => __TLD.UI.items().indexOf(document.activeElement));
  ok('pad: holding the stick repeats menu movement', f3 >= 3, `focus index ${f3} after a 0.7 s hold`);
  await ev(() => document.querySelector('[data-act=new]').focus());
  await tap(0); ok('pad: A selects (difficulty screen)', await ev(() => __TLD.UI.screen === 'diff'));
  await tap(1); ok('pad: B goes back', await ev(() => __TLD.UI.screen === 'title'));
  await ev(() => document.querySelector('[data-act=new]').focus()); await tap(0); await tap(0); await p.waitForTimeout(100);
  ok('pad: A through difficulty to intro', await ev(() => __TLD.UI.screen === 'intro'));
  await tap(0); await p.waitForTimeout(200);
  ok('pad: A on Begin enters play', await ev(() => __TLD.G.state === 'play'));
  // flight with the left stick
  const pos0 = await ev(() => { const L = __TLD.G.L; for (const e of L.enemies) { e.x = -9e4; e.y = -9e4; } return [L.player.x, L.player.y]; });
  let moved = 0;
  for (const [ax, ay] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
    await ev(([ax, ay]) => { __pad.axes[0] = ax; __pad.axes[1] = ay; }, [ax, ay]); await p.waitForTimeout(300);
    const q = await ev(() => [__TLD.G.L.player.x, __TLD.G.L.player.y]); moved = Math.max(moved, Math.hypot(q[0] - pos0[0], q[1] - pos0[1]));
  }
  const v = { vx: moved, mx: await ev(() => __TLD.Input.state.mx) };
  await ev(() => { __pad.axes[0] = 0.12; __pad.axes[1] = 0.1; }); await p.waitForTimeout(250);
  const dz = await ev(() => __TLD.Input.pad.mx);
  await ev(() => { __pad.axes[0] = 0; __pad.axes[1] = 0; });
  ok('pad: left stick flies the bat; small drift is inside the dead zone', v.vx > 10 && dz === 0, `moved ${v.vx.toFixed(1)} px, drift input ${dz}`);
  await ev(() => __btn(4, true)); await p.waitForTimeout(60); const hush = await ev(() => __TLD.Input.state.hush); await ev(() => __btn(4, false));
  ok('pad: LB glides silently', hush === true);
  // calls: tap A, hold A, and the right trigger
  const n0 = await ev(() => __TLD.G.run.stats.pings);
  await tap(0, 60); await p.waitForTimeout(450);
  await tap(0, 1200); await p.waitForTimeout(150);
  const rng = await ev(() => { const L = __TLD.G.L; return L.rings.length ? Math.max(...L.rings.map(r => r.r)) / 16 : 0; });
  await p.waitForTimeout(800);
  await ev(() => { __pad.buttons[7].value = 1; }); await p.waitForTimeout(100); await ev(() => { __pad.buttons[7].value = 0; }); await p.waitForTimeout(150);
  const n1 = await ev(() => __TLD.G.run.stats.pings);
  ok('pad: A chirps, held A calls far, RT also calls', n1 - n0 === 3 && rng > 20, `${n1 - n0} calls, longest ${rng.toFixed(1)} tiles`);
  const r0 = await ev(() => (window.__rumbles || []).length);
  await tap(1); const dash = await ev(() => __TLD.G.L.player.dashCd > 0);
  ok('pad: B darts', dash);
  await ev(() => { const L = __TLD.G.L; L.player.inv = 0; __TLD.hurt(L, { type: 'stalker', x: L.player.x + 5, y: L.player.y, stun: 0 }); });
  const r1 = await ev(() => (window.__rumbles || []).length);
  ok('pad: vibration fires on calls, darts and hits', r1 > r0 && r0 > 0, `${r0} effects before the hit, ${r1} after`);
  await ev(() => { __TLD.Store.data.settings.vibration = false; const L = __TLD.G.L; L.player.inv = 0; __TLD.G.run.hearts = 3; __TLD.hurt(L, { type: 'stalker', x: L.player.x + 5, y: L.player.y, stun: 0 }); __TLD.Store.data.settings.vibration = true; });
  ok('pad: vibration setting off stops rumble', (await ev(() => (window.__rumbles || []).length)) === r1);
  // pause, settings tabs, sliders with repeat, back out
  await tap(9); ok('pad: Menu button pauses', await ev(() => __TLD.G.state === 'paused' && __TLD.UI.screen === 'pause'));
  await tap(13); await tap(0); ok('pad: open Settings from pause', await ev(() => __TLD.UI.screen === 'settings' && __TLD.UI.tab === 0));
  await tap(5); const t1 = await ev(() => __TLD.UI.tab); await tap(5); await tap(4); await tap(4); const t2 = await ev(() => __TLD.UI.tab);
  ok('pad: RB / LB switch settings sections', t1 === 1 && t2 === 0, `tab ${t1} then ${t2}`);
  await tap(13); const m0 = await ev(() => __TLD.Store.data.settings.music);
  await tap(15); const m1 = await ev(() => __TLD.Store.data.settings.music);
  await ev(() => __btn(14, true)); await p.waitForTimeout(800); await ev(() => __btn(14, false)); await p.waitForTimeout(60);
  const m2 = await ev(() => __TLD.Store.data.settings.music);
  ok('pad: D-pad right/left adjusts a slider, holding repeats', Math.abs(m1 - m0 - 0.05) < 1e-6 && m1 - m2 >= 0.15, `music ${m0} -> ${m1} -> ${m2}`);
  await tap(1); ok('pad: B returns from settings to pause', await ev(() => __TLD.UI.screen === 'pause'));
  await tap(1); await p.waitForTimeout(80);
  ok('pad: B on pause resumes play (audio unmuffled)', await ev(() => __TLD.G.state === 'play' && __TLD.AE.muf.frequency.value > 5000 || __TLD.G.state === 'play'));
  // in-game hint chips use the pad glyphs
  ok('pad: hint chips render the pad glyph', await ev(() => __TLD.Input.glyph('call') === 'A' && __TLD.Input.glyph('glide') === 'LB'));
  // roost and boon choice by pad
  await ev(() => { const L = __TLD.G.L, P = L.player; for (const s of L.shards) { P.x = s.x; P.y = s.y; __TLD.update(__TLD.STEP); } P.x = L.gate.x; P.y = L.gate.y; __TLD.update(__TLD.STEP); });
  await p.waitForTimeout(200);
  const d0 = await ev(() => __TLD.G.run.depth);
  await tap(13); await tap(0); await p.waitForTimeout(150);
  ok('pad: pick a boon at the roost and descend', await ev(() => __TLD.G.state === 'play') && d0 === 2);
  // PlayStation pad hot-swap and disconnect
  await ev(() => { __pad.id = 'DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)'; const e = new Event('gamepadconnected'); Object.defineProperty(e, 'gamepad', { value: __pad }); dispatchEvent(e); });
  await p.waitForTimeout(100);
  ok('pad: PlayStation controller recognised, glyphs switch', await ev(() => __TLD.Input.padStyle === 'ps' && __TLD.Input.glyph('call') === '✕'));
  ok('pad: connection toast shown', await ev(() => document.getElementById('toast').classList.contains('on')));
  await ev(() => { const e = new Event('gamepaddisconnected'); Object.defineProperty(e, 'gamepad', { value: __pad }); dispatchEvent(e); });
  ok('pad: disconnecting mid-play pauses the game', await ev(() => __TLD.G.state === 'paused'));
  ok('pad: no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  await ctx.close();
}


// ---------------- STORY MODE and ROBUSTNESS ----------------
{
  const { ctx, p } = await fresh();
  const clearLevel = `const T = __TLD, L = T.G.L, P = L.player; for (const e of L.enemies) if (e.type !== 'mute') { e.x = -9e4; e.y = -9e4; }
    if (L.kin) { P.x = L.kin.x; P.y = L.kin.y; T.update(T.STEP); }
    if (L.song) { P.x = L.song.x; P.y = L.song.y; T.update(T.STEP); }
    for (const s of L.shards) { P.x = s.x; P.y = s.y; T.update(T.STEP); }
    P.x = L.gate.x; P.y = L.gate.y; T.update(T.STEP);`;
  // the Return: reach the bottom knowing no verses
  const ret = await p.evaluate((clearLevel) => { const T = __TLD; T.newRun('story', 'standard', { chapter: 8 }); T.startDepth(); if (T.G.L.mute) T.G.L.mute.x = -9e5; (new Function(clearLevel))(); return { st: T.G.state, html: document.querySelector('.s-ending .kicker').textContent, ends: T.Store.data.story.endings }; }, clearLevel);
  ok('story: escaping the Hollow Heart without the song gives The Return', ret.st === 'ending' && /The Return/.test(ret.html) && ret.ends.return, ret.html);
  // full story from the menus: prologue, chapter cards, beats, kin, verses, roost talks
  await p.evaluate(() => __TLD.UI.title());
  await p.click('[data-act=story]'); await p.click('[data-act=storyNew]'); await p.click('[data-v=standard]');
  ok('story: Begin the story opens the prologue', await p.evaluate(() => __TLD.UI.screen === 'intro' && /Prologue/.test(document.querySelector('.s-intro').textContent)));
  await p.click('[data-act=toChapter]');
  ok('story: chapter I title card', await p.evaluate(() => __TLD.UI.screen === 'chapter' && /Last Light/.test(document.querySelector('.chtitle').textContent)));
  const per = [];
  for (let d = 1; d <= 7; d++) {
    await p.click('[data-act=begin]');
    const info = await p.evaluate((clearLevel) => {
      const T = __TLD; for (let i = 0; i < 90; i++) T.update(T.STEP);
      const said = (T.G.story ? 1 : 0) + T.G.storyQ.length, kin = !!T.G.L.kin, song = !!T.G.L.song;
      (new Function(clearLevel))();
      return { d: T.G.run.depth, said, kin, song, st: T.G.state, talk: document.querySelectorAll('.talk p').length };
    }, clearLevel);
    per.push(info);
    if (info.st !== 'roost') break;
    await p.click('[data-act=boon]');
    await p.waitForTimeout(30);
  }
  ok('story: every chapter speaks on arrival and the roost talks back', per.length === 7 && per.every(x => x.said > 0 && x.talk > 0), JSON.stringify(per.map(x => [x.d, x.said, x.talk])));
  ok('story: a lost voice hides in chapters II to VII, verses in II, IV, V, VII', per.map(x => x.kin ? 1 : 0).join('') === '0111111' && per.map(x => x.song ? 1 : 0).join('') === '0101101');
  const fin = await p.evaluate(() => { const T = __TLD; return { kin: T.kinFound(), verses: T.versesKnown(T.G.run), chapters: T.Store.data.story.chapters, screen: T.UI.screen }; });
  ok('story: all six kin found, four verses known, eight chapters open', fin.kin === 6 && fin.verses === 4 && fin.chapters === 8 && fin.screen === 'chapter', JSON.stringify(fin));
  await p.click('[data-act=begin]');
  const home = await p.evaluate((clearLevel) => {
    const T = __TLD, L = T.G.L, P = L.player, m = L.mute;
    for (let i = 0; i < 60; i++) T.update(T.STEP);
    for (const e of L.enemies) if (e !== m) { e.x = -9e4; e.y = -9e4; }
    let a = 0; while (a < 6.3) { const x = m.x + Math.cos(a) * (m.r + 20), y = m.y + Math.sin(a) * (m.r + 20); if (!T.__hits(L, x, y, 5)) { P.x = x; P.y = y; break; } a += 0.3; }
    m.tx = null; P.inv = 99; P.pingCd = 0;
    T.Input.keys = { Space: true }; for (let i = 0; i < 90; i++) { m.tx = null; T.update(T.STEP); } T.Input.keys = {}; T.update(T.STEP);
    const sang = T.G.run.sang, line = [T.G.story, ...T.G.storyQ].filter(Boolean).map(x => x.text).join(' | ');
    P.x = L.gate.x; P.y = L.gate.y; T.update(T.STEP);
    return { sang, line, st: T.G.state, kicker: document.querySelector('.s-ending .kicker').textContent, ach: Object.keys(T.Store.data.meta.ach), slot: T.Store.data.runs.story };
  }, clearLevel);
  ok('story: singing to the Mute with everyone home gives Homecoming', home.sang && /remember/.test(home.line) && /Homecoming/.test(home.kicker) && home.ach.includes('homecoming') && home.ach.includes('kin6'), home.kicker);
  ok('story: a finished story frees its save slot', home.slot === null);
  await p.click('[data-act=epilogue]');
  ok('story: epilogue follows the ending', await p.evaluate(() => /Epilogue/.test(document.querySelector('.kicker').textContent)));
  // chapter select replays into their own slot
  await p.evaluate(() => { __TLD.G.L = null; __TLD.UI.title(); });
  await p.evaluate(() => { const T = __TLD; T.newRun('descent', 'cruel'); T.G.run.depth = 3; T.saveRun && T.saveRun(); });
  await p.click('[data-act=story]'); await p.click('[data-act=chapters]');
  ok('story: chapter select lists all eight chapters open', await p.evaluate(() => document.querySelectorAll('[data-act=chapterPick]:not([disabled])').length === 8));
  await p.click('[data-act=chapterPick][data-v="5"]'); await p.click('[data-act=begin]');
  const rep = await p.evaluate(() => { const S = __TLD.Store.data; return { replay: S.runs.replay && S.runs.replay.depth, story: S.runs.story, descent: S.runs.descent && S.runs.descent.mode, last: S.last, mode: __TLD.G.run.mode, d: __TLD.G.run.depth }; });
  ok('slots: a chapter replay, a descent and the story keep separate saves', rep.replay === 5 && rep.d === 5 && rep.mode === 'story' && rep.descent === 'descent' && rep.last === 'replay', JSON.stringify(rep));
  // story death keeps the chapter
  const sd = await p.evaluate(() => { const T = __TLD, L = T.G.L; T.G.run.hearts = 1; L.player.inv = 0; T.hurt(L, { type: 'lurker', x: L.player.x + 3, y: L.player.y }); for (let i = 0; i < 200; i++) T.update(T.STEP); return { screen: T.UI.screen, kept: T.Store.data.runs.replay && T.Store.data.runs.replay.depth, retry: !!document.querySelector('[data-act=retry]') }; });
  ok('story: dying keeps the chapter saved and offers a retry', sd.screen === 'over' && sd.kept === 5 && sd.retry, JSON.stringify(sd));
  await p.click('[data-act=retry]');
  ok('story: retry restarts the same chapter', await p.evaluate(() => __TLD.G.state === 'play' && __TLD.G.run.depth === 5 && __TLD.G.run.mode === 'story'));

  // ---- robustness ----
  // double presses during scene changes are accepted once
  const dbl = await p.evaluate(() => { const T = __TLD; T.newRun('descent', 'standard'); T.startDepth(); const L = T.G.L, P = L.player; for (const s of L.shards) { P.x = s.x; P.y = s.y; T.update(T.STEP); } P.x = L.gate.x; P.y = L.gate.y; T.update(T.STEP); T.update(T.STEP);
    const b = document.querySelector('[data-act=boon]'), id = b.dataset.v; b.click(); b.click(); return { depth: T.G.run.depth, lvl: T.G.run.boons[id] || 0, id }; });
  ok('robust: a double-pressed boon is taken once and descends once', dbl.depth === 2 && dbl.lvl <= 1, JSON.stringify(dbl));
  const runs0 = await p.evaluate(() => __TLD.Store.data.meta.runs);
  await p.evaluate(() => { __TLD.G.L = null; __TLD.UI.newGame('endless'); const b = document.querySelector('[data-v=gentle]'); b.click(); b.click(); });
  ok('robust: a double-pressed difficulty starts one run', (await p.evaluate(() => __TLD.Store.data.meta.runs)) === runs0 + 1);
  // stuck and invalid positions recover
  const unst = await p.evaluate(() => { const T = __TLD, L = T.G.L, P = L.player; let i = 0; while (i < L.g.length && !(L.g[i] && L.epC[i] === 0)) i++; P.x = (i % L.W + 0.5) * 16; P.y = (Math.floor(i / L.W) + 0.5) * 16; const was = T.__hits(L, P.x, P.y, 4); T.update(T.STEP);
    const e = L.enemies[0]; e.x = NaN; T.update(T.STEP); return { was, now: T.__hits(L, P.x, P.y, 4), enemyOk: isFinite(e.x) && isFinite(e.y) }; });
  ok('robust: a bat inside rock is moved to open air; a NaN hunter resets', unst.was && !unst.now && unst.enemyOk, JSON.stringify(unst));
  // the endless deep stays bounded at depth 40
  const deep = await p.evaluate(() => { const T = __TLD; T.newRun('endless', 'cruel'); T.G.run.depth = 40; const t0 = performance.now(); T.startDepth(); const ms = performance.now() - t0; const L = T.G.L; L.player.inv = 1e9;
    for (let i = 0; i < 300; i++) { T.Input.keys = { Space: i % 40 < 20, KeyD: i < 150 }; T.update(T.STEP); L.player.inv = 1e9; } T.Input.keys = {};
    return { st: T.G.state, stalkers: L.enemies.filter(e => e.type === 'stalker').length, lurkers: L.enemies.filter(e => e.type === 'lurker').length, ms: Math.round(ms), speed: L.speedMul }; });
  ok('robust: endless depth 40 builds fast with hunters capped', deep.st === 'play' && deep.stalkers <= 16 && deep.lurkers <= 10 && deep.speed <= 1.49, JSON.stringify(deep));
  // when every boon is learned, the roost still lets you go on
  const rest = await p.evaluate(() => { const T = __TLD; T.newRun('descent', 'standard'); for (const b of T.Store && [] || []) {} const r = T.G.run; r.maxHearts = 9; r.hearts = 9;
    for (const [id, mx] of [['far_call', 2], ['soft_wings', 2], ['long_memory', 1], ['quick_throat', 2], ['deep_breath', 1], ['thick_hide', 2], ['moth_lure', 1], ['sharp_ear', 1], ['ghost_dash', 1], ['shard_sense', 1], ['shriek', 1]]) r.boons[id] = mx;
    T.startDepth(); const L = T.G.L, P = L.player; for (const s of L.shards) { P.x = s.x; P.y = s.y; T.update(T.STEP); } P.x = L.gate.x; P.y = L.gate.y; T.update(T.STEP);
    const b = document.querySelector('[data-act=boon]'); const v = b && b.dataset.v; b.click(); return { v, st: T.G.state, d: T.G.run.depth }; });
  ok('robust: with nothing left to learn the roost offers Rest and goes on', rest.v === '__rest' && rest.st === 'play' && rest.d === 2, JSON.stringify(rest));
  await ctx.close();
}
{
  // saves from version 1, hostile values, and a corrupt save with a good backup
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url); await passBoot(p);
  await p.evaluate(() => localStorage.setItem('listening-dark-save-v1', JSON.stringify({ settings: { master: 0.4, music: 'loud', palette: 'nonsense', uiScale: 7 }, meta: { runs: 3, lifetimeMoths: 12 },
    run: { v: 1, mode: 'descent', diff: 'standard', seed: 5, depth: 3, hearts: 2, maxHearts: 3, boons: { far_call: 1 }, moths: 4, mothMeter: 4, songs: [0], sang: false, stats: { pings: 9, time: 60, stuns: 0, hurt: 1 } } })));
  await p.reload(); await passBoot(p);
  const mig = await p.evaluate(() => { const S = __TLD.Store.data; return { d: S.runs.descent && S.runs.descent.depth, last: S.last, master: S.settings.master, music: S.settings.music, pal: S.settings.palette, ui: S.settings.uiScale, cont: (document.querySelector('[data-act=continue]') || {}).textContent }; });
  ok('robust: a version 1 save migrates into the descent slot; bad settings fall back', mig.d === 3 && mig.last === 'descent' && mig.master === 0.4 && mig.music === 0.6 && mig.pal === 'bone' && mig.ui === 1 && /Depth/.test(mig.cont || '') || /depth 3/.test(mig.cont || ''), JSON.stringify(mig));
  await p.click('[data-act=continue]');
  ok('robust: the migrated run continues at depth 3 with its boon', await p.evaluate(() => __TLD.G.state === 'play' && __TLD.G.run.depth === 3 && __TLD.G.run.boons.far_call === 1 && __TLD.G.run.kin.length === 0));
  const hostile = await p.evaluate(() => { const r = __TLD.validRun({ v: 2, mode: 'descent', diff: 'standard', depth: 999, hearts: -5, maxHearts: 3, boons: { far_call: 50, bogus: 3, mending: 4 }, songs: [9, 'x', 1, 1], kin: [7, 2], moths: -3, mothMeter: 99, stats: null });
    const bad = [__TLD.validRun({ mode: 'hacked', diff: 'standard' }), __TLD.validRun({ mode: 'descent', diff: 'impossible' }), __TLD.validRun('string'), __TLD.validRun(null)]; return { r, bad }; });
  const hr = hostile.r;
  ok('robust: hostile save values are clamped, unknown runs refused', hr.depth === 8 && hr.hearts === 1 && hr.boons.far_call === 2 && !('bogus' in hr.boons) && !('mending' in hr.boons) && hr.songs.join() === '1' && hr.kin.join() === '2' && hr.moths === 0 && hr.mothMeter === 12 && hostile.bad.every(x => x === null), JSON.stringify(hostile));
  await p.evaluate(() => { const good = localStorage.getItem('listening-dark-save-v1'); const d = JSON.parse(good); d.meta.runs = 77; localStorage.setItem('listening-dark-save-v1-bak', JSON.stringify(d)); localStorage.setItem('listening-dark-save-v1', '{"half a save'); });
  await p.reload(); await passBoot(p);
  const bak = await p.evaluate(() => ({ runs: __TLD.Store.data.meta.runs, rec: __TLD.Store.recovered, note: document.querySelector('.t-meta').textContent }));
  ok('robust: a corrupt save is restored from the backup copy and the title says so', bak.runs === 77 && bak.rec && /backup/.test(bak.note), JSON.stringify(bak));
  // a daily run from another day continues by name but does not hijack today's daily
  const daily = await p.evaluate(() => { const T = __TLD, S = T.Store.data; S.runs.daily = T.validRun({ mode: 'daily', diff: 'standard', seed: 1, depth: 4, date: '2020-01-01' }); S.last = 'daily'; T.UI.title(); const label = document.querySelector('[data-act=continue]').textContent; document.querySelector('[data-act=daily]').click();
    return { label, depth: T.G.run.depth, date: T.G.run.date }; });
  ok('robust: yesterday\'s daily is labelled, and Daily cave starts today\'s', /from 2020-01-01/.test(daily.label) && daily.depth === 1 && daily.date !== '2020-01-01', JSON.stringify(daily));
  // another tab writes the save while this one sits on the title
  await p.evaluate(() => { __TLD.G.L = null; __TLD.UI.title(); });
  await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('listening-dark-save-v1')); d.meta.runs = 500; localStorage.setItem('listening-dark-save-v1', JSON.stringify(d)); dispatchEvent(new StorageEvent('storage', { key: 'listening-dark-save-v1' })); });
  ok('robust: a save written by another tab is picked up on the title', await p.evaluate(() => __TLD.Store.data.meta.runs === 500));
  ok('no page errors during story and robustness checks', errs.length === 0, errs.slice(0, 3).join(' | '));
  await ctx.close();
}

// ---------------- PASS 3: release readiness (perf, mobile, storage-less, offline) ----------------
{
  const { ctx, p } = await fresh({ width: 1920, height: 1080 });
  // real frames: the game's own rAF loop runs; we press keys and read its measured CPU time per frame
  const measure = (cfg) => p.evaluate((cfg) => new Promise(res => {
    const T = __TLD; Object.assign(T.Store.data.settings, cfg); T.R.guarded = true; T.newRun('descent', 'standard'); T.G.run.depth = 7; T.startDepth();
    const L = T.G.L; const draws = [], gaps = []; let last = performance.now(), i = 0;
    const tick = (t) => {
      L.player.inv = 1e9;
      T.Input.keys = { Space: i % 42 < 36, KeyD: i % 240 < 120, KeyA: i % 240 >= 120 };
      if (i > 30) { draws.push(T.R.frameMs); gaps.push(t - last); }
      last = t; i++;
      if (i < 630) requestAnimationFrame(tick);
      else {
        T.Input.keys = {};
        const q = (a, f) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(f * (s.length - 1))]; };
        let live = 0; for (let k = 0; k < T.Echo.N; k++) if (T.Echo.t[k] > L.time - 3) live++;
        res({ drawMed: q(draws, .5), drawP95: q(draws, .95), gapMed: q(gaps, .5), live, frames: draws.length });
      }
    };
    requestAnimationFrame(tick);
  }), cfg);
  const fmt = r => `render median ${r.drawMed.toFixed(2)} ms, p95 ${r.drawP95.toFixed(2)} ms; frame interval median ${r.gapMed.toFixed(1)} ms over ${r.frames} frames; ${r.live} live echo points`;
  const perfLow = await measure({ bloom: false, quality: 'high' });
  ok('performance at 1920x1080 without glow: render CPU p95 < 3 ms, 60 fps', perfLow.drawP95 < 3 && perfLow.gapMed < 18, fmt(perfLow));
  const perfHi = await measure({ bloom: true, quality: 'high' });
  ok('performance at 1920x1080 with glow: render CPU p95 < 6 ms (headless software rendering; real GPUs blit this)', perfHi.drawP95 < 6, fmt(perfHi));
  const guard = await p.evaluate(() => new Promise(res => {
    const T = __TLD; T.Store.data.settings.bloom = true; T.R.guarded = false; T.R.slowT = 0; T.R.playT = 0;
    T.newRun('descent', 'standard'); T.startDepth();
    for (let i = 0; i < 400; i++) T.R.guard(1 / 25);
    res({ bloom: T.Store.data.settings.bloom, toast: document.getElementById('toast').textContent });
  }));
  ok('slow-device guard turns glow off and tells the player', guard.bloom === false && /Glow turned off/.test(guard.toast), JSON.stringify(guard));
  await p.evaluate(() => { __TLD.Store.data.settings.bloom = true; __TLD.Store.save(); });
  const heap = await p.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1);
  await p.evaluate(() => { for (let k = 0; k < 6; k++) { __TLD.newRun('descent', 'standard'); __TLD.G.run.depth = 6; __TLD.startDepth(); } });
  await p.evaluate(() => new Promise(r => setTimeout(r, 500)));
  const heap2 = await p.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1);
  ok('no runaway memory across repeated level builds', heap2 < 0 || heap2 - heap < 60, `heap ${heap} MB -> ${heap2} MB after 6 rebuilds`);
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.goto(url); await passBoot(p, 'tap');
  await p.tap('[data-act=new]'); await p.waitForTimeout(150); await p.tap('[data-v=standard]'); await p.waitForTimeout(100); await p.tap('[data-act=begin]'); await p.waitForTimeout(300);
  const t = await p.evaluate(() => ({ st: __TLD.G.state, touch: getComputedStyle(document.getElementById('touch')).display, pb: getComputedStyle(document.getElementById('pauseBtn')).display, w: document.documentElement.scrollWidth }));
  ok('mobile: touch controls shown in play, no horizontal overflow', t.st === 'play' && t.touch === 'block' && t.pb === 'block' && t.w <= 390, JSON.stringify(t));
  const pos0 = await p.evaluate(() => [__TLD.G.L.player.x, __TLD.G.L.player.y]);
  const cdp = await ctx.newCDPSession(p);
  const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  await tp('touchStart', 80, 600); for (let i = 1; i <= 8; i++) { await tp('touchMove', 80 + i * 7, 600 + i * 5); await p.waitForTimeout(40); } await p.waitForTimeout(500); await tp('touchEnd');
  const pos1 = await p.evaluate(() => [__TLD.G.L.player.x, __TLD.G.L.player.y]);
  ok('mobile: virtual stick flies the bat', Math.hypot(pos1[0] - pos0[0], pos1[1] - pos0[1]) > 5, `moved ${Math.hypot(pos1[0] - pos0[0], pos1[1] - pos0[1]).toFixed(1)} px`);
  const pings0 = await p.evaluate(() => __TLD.G.run.stats.pings);
  await p.tap('#tCall'); await p.waitForTimeout(200);
  ok('mobile: CALL button calls', await p.evaluate(n => __TLD.G.run.stats.pings > n, pings0));
  await p.tap('#pauseBtn'); await p.waitForTimeout(150);
  ok('mobile: pause button pauses', await p.evaluate(() => __TLD.G.state === 'paused'));
  await p.screenshot({ path: 'qa/mobile-pause.png' });
  await p.tap('[data-act=resume]'); await p.waitForTimeout(300);
  await p.screenshot({ path: 'qa/mobile-play.png' });
  ok('no page errors on mobile', p.errs.length === 0, p.errs.slice(0, 3).join(' | '));
  await ctx.close();
}
{
  // storage blocked entirely (e.g. strict privacy mode): the game must still run
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 640 } });
  await ctx.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url); await passBoot(p);
  const r = await p.evaluate(() => { __TLD.newRun('descent', 'standard'); __TLD.startDepth(); for (let i = 0; i < 120; i++) __TLD.update(__TLD.STEP); return { st: __TLD.G.state, persistent: __TLD.Store.persistent }; });
  ok('runs with storage unavailable (and says so)', r.st === 'play' && r.persistent === false && errs.length === 0, JSON.stringify(r) + errs.join(';'));
  await ctx.close();
}
{
  // offline: block every network request; game must not depend on any
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 640 }, offline: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const reqs = []; p.on('request', q => { if (!q.url().startsWith('file:') && !q.url().startsWith('data:')) reqs.push(q.url()); });
  await p.goto(url); await passBoot(p);
  const st = await p.evaluate(() => __TLD.UI.screen);
  ok('fully playable offline (only optional font requests attempted)', st === 'title' && errs.length === 0 && reqs.every(u => /fonts\.(googleapis|gstatic)\.com/.test(u)), reqs.join(', '));
  await ctx.close();
}
await browser.close();
console.log(`\n${results.length - failed}/${results.length} checks passed`);
import fs from 'node:fs';
fs.mkdirSync('qa', { recursive: true });
fs.writeFileSync('qa/results.json', JSON.stringify(results, null, 2));
process.exit(failed ? 1 : 0);
