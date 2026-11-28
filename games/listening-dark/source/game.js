// ---------- game: rules, run flow, entities, progression ----------
const G = {
  state: 'boot', run: null, L: null, demo: null,
  shake: 0, flash: 0, fade: 0, banner: null, story: null, storyQ: [], hint: null, hintQ: [], hintsShown: {}, toasts: [], dieT: 0
};
const B = id => (G.run && G.run.boons[id]) || 0;
const D_ = () => DIFFS[(G.run && G.run.diff) || 'standard'];
const STORY_SEED = hashStr('the-colonys-song');
const slotOf = r => r.replay ? 'replay' : r.mode;

function newRun(mode, diff, opts = {}) {
  if (!DIFFS[diff]) diff = 'standard';
  if (mode === 'daily') diff = 'standard';
  const seed = mode === 'daily' ? hashStr('daily-' + todayStr()) : mode === 'story' ? STORY_SEED : (Math.random() * 2 ** 31) >>> 0;
  const D = DIFFS[diff];
  G.run = { v: 2, mode, diff, seed, replay: !!opts.replay, depth: opts.chapter || 1, hearts: D.hearts, maxHearts: D.hearts, boons: {}, moths: 0, mothMeter: 0, songs: [], kin: [], sang: false, date: todayStr(), stats: { pings: 0, time: 0, stuns: 0, hurt: 0 } };
  Store.data.meta.runs++;
  G.hintsShown = (opts.chapter || 1) > 1 ? { call: 1, shards: 1, hush: 1, moth: 1 } : {};
  if (mode === 'story' && !opts.replay) Store.data.runs.replay = null;
  saveRun();
}
function saveRun() {
  if (!G.run) return;
  const v = validRun(G.run); if (!v) return;
  v.replay = !!G.run.replay;
  Store.data.runs[slotOf(G.run)] = v; Store.data.last = slotOf(G.run); Store.save();
}
function clearRun(r) {
  if (!r) return;
  Store.data.runs[slotOf(r)] = null;
  if (Store.data.last === slotOf(r)) Store.data.last = Object.keys(Store.data.runs).find(k => Store.data.runs[k]) || null;
  Store.save();
}
function loadRun(slot) {
  slot = slot || Store.data.last;
  const r = slot && validRun(Store.data.runs[slot]); if (!r) return false;
  r.replay = slot === 'replay';
  G.run = r; G.hintsShown = { call: 1, shards: 1, hush: 1, moth: 1 };
  return true;
}
function isFinal(r) { return r.mode !== 'endless' && r.depth === FINAL_DEPTH; }
function depthConfig(r) {
  const d = r.depth, D = DIFFS[r.diff] || DIFFS.standard, final = isFinal(r), story = r.mode === 'story';
  return {
    seed: (r.seed + d * 104729) >>> 0, size: Math.min(d, 11), depth: d, final,
    shards: final ? 4 : Math.min(6, 2 + Math.floor((d + 1) / 3)),
    moths: Math.min(34, 14 + Math.min(d, 10) * 2), bells: Math.min(7, 2 + Math.floor(d / 2)),
    // hunters grow with depth but are capped, so the endless deep stays playable at any depth
    stalkers: Math.min(16, Math.max(1, Math.round((d <= 1 ? 1 : 1 + d * 0.72) * D.enemyCount))),
    lurkers: Math.min(10, Math.round((Math.floor(d / 2) + (d >= 2 ? 1 : 0)) * D.enemyCount)),
    song: (r.mode !== 'endless' && SONG_DEPTHS[d] != null && !r.songs.includes(SONG_DEPTHS[d])) ? SONG_DEPTHS[d] : null,
    kin: story && KIN_AT[d] != null && !r.kin.includes(KIN_AT[d]) ? KIN_AT[d] : null
  };
}
// a level that fails to generate (it never has in testing) retries with nearby seeds instead of crashing
function buildSafe(cfg) {
  for (let k = 0; k < 6; k++) {
    try { const L = buildLevel(k ? { ...cfg, seed: (cfg.seed + k * 7907) >>> 0 } : cfg); if (L.gate && L.dist[Math.floor(L.gate.y / T) * L.W + Math.floor(L.gate.x / T)] >= 0) return L; }
    catch (e) { console.warn('level build retry', k, e); }
  }
  throw new Error('This cave could not be carved');
}

function startDepth() {
  const r = G.run; if (!r) return;
  const cfg = depthConfig(r);
  const L = G.L = buildSafe(cfg);
  L.speedMul = 1 + Math.min(12, Math.max(0, r.depth - FINAL_DEPTH)) * 0.04;
  L.memLife = 14 * (1 + B('long_memory'));
  L.player = { x: L.start.x, y: L.start.y, vx: 0, vy: 0, r: 4.5, inv: 1, dashT: 0, dashCd: 0, charge: 0, charging: false, pingCd: 0, face: 1, flap: 0, noise: 0, noiseTick: 0, moved: 0 };
  L.player.trail = []; L.beats = {}; L.story = r.mode === 'story';
  Echo.clear();
  R.snapCam(L.player.x, L.player.y);
  G.state = 'play'; G.story = null; G.storyQ = []; G.flash = 0; G.fade = 1; G.rumbleT = 20 + Math.random() * 20; G.busy = false;
  AE.muffle(false); AE.ambDepth(r.depth);
  Music.verses = versesKnown(r); Music.setDepth(r.depth); Music.setMode(cfg.final ? 'final' : 'game');
  G.banner = L.story ? { t: 0, a: 'Chapter ' + ROMAN[r.depth], b: STORY[r.depth].title } : { t: 0, a: 'Depth ' + r.depth, b: depthName(r) };
  AE.humStart();
  UI.hide(); Input.showTouch(true);
  emitPing(L, L.player.x, L.player.y, 5, 120, 0, true);
  if (!L.story && cfg.final && r.songs.length >= 4) say([['n', 'The four verses ache in your throat. Something enormous is listening.']], 3);
}

// ---- story beats: each fires once per attempt at a chapter ----
function say(lines, delay = 0) {
  for (const ln of lines) {
    if (ln[2] && !ln[2](G.run)) continue;
    const sp = SPEAKERS[ln[0]] || SPEAKERS.n;
    G.storyQ.push({ t: -delay, text: ln[1], sub: sp.name, col: sp.col, it: ln[0] === 'n' || ln[0] === 'verse' });
    delay = 0;
  }
}
function beat(id) {
  const r = G.run, L = G.L;
  if (!r || !L || !L.story || L.beats[id]) return;
  L.beats[id] = 1;
  const ch = STORY[r.depth]; if (ch && ch.beats[id]) say(ch.beats[id]);
}

function hint(id, text) {
  if (!Store.data.settings.hints || G.hintsShown[id] || !G.run || G.run.depth > 2) return;
  G.hintsShown[id] = 1; G.hintQ.push(text);
}
function unlock(id) {
  const m = Store.data.meta; if (m.ach[id]) return;
  m.ach[id] = Date.now(); Store.save();
  const a = ACH.find(a => a.id === id); if (a) G.toasts.push({ t: 0, text: a.name, sub: a.desc, ach: true });
}

// ---- sound propagation ----
function noiseEvent(L, x, y, rt, kind) {
  const D = D_(), R0 = rt * T;
  L.noises.push({ x, y, r: R0, t: L.time, kind });
  for (const e of L.enemies) {
    const R1 = R0 * D.hearMul * e.hear, d = hyp(e.x - x, e.y - y);
    if (d > R1) continue;
    if (e.type !== 'mute' && d > R1 * 0.6 && !los(L, x, y, e.x, e.y)) continue; // stone muffles
    hear(L, e, x, y, kind);
  }
  if (kind !== 'bell') for (const m of L.moths) {
    if (m.got || B('moth_lure')) continue;
    const d = hyp(m.x - x, m.y - y);
    if (d < R0 * 0.6 + 8) { m.flee = 0.9; m.fx = (m.x - x) / (d || 1); m.fy = (m.y - y) / (d || 1); }
  }
}
function hear(L, e, x, y, kind) {
  if (e.stun > 0) return;
  if (e.type === 'stalker') {
    if (e.state !== 'hunt') { AE.growl(e.x, e.y); cue(L, e.x, e.y, 'enemy'); if (kind === 'bell') unlock('decoy'); hint('hunter', 'Something heard you. Go quiet, or go quickly.'); Input.rumble(160, 0.25, 0.1); beat('hunter'); }
    e.state = 'hunt'; e.tx = x; e.ty = y; e.path = null; e.direct = false;
  } else if (e.type === 'lurker') {
    if (e.state === 'idle' && hyp(x - e.hx, y - e.hy) < 5.5 * T && kind !== 'bell') { e.state = 'wind'; e.t = 0.45; AE.growl(e.x, e.y); cue(L, e.x, e.y, 'enemy'); }
  } else if (e.type === 'mute' && !e.calm) { e.tx = x; e.ty = y; }
}
function cue(L, x, y, kind) {
  const p = L.player; if (!p) return;
  const d = hyp(x - p.x, y - p.y); if (d > 28 * T || d < 1.2 * T) return;
  L.cues.push({ a: Math.atan2(y - p.y, x - p.x), t: L.time, kind, d });
}

// ---- echolocation ----
function revealE(L, e, at, life, snap) {
  L.events.push({ at, fn: () => {
    e.seenAt = L.time; e.seenUntil = L.time + life;
    if (snap) { e.gx = e.x; e.gy = e.y; }
  } });
}
function emitPing(L, ox, oy, range, rays, kind, quiet) {
  const now = L.time, rpx = range * T, mute = L.mute;
  L.rings.push({ x: ox, y: oy, t0: now, r: rpx, kind });
  const life = (kind === 0 ? 2.6 : kind === 3 ? 1.5 : 2.1) * (1 + B('long_memory'));
  let sum = 0, n = 0;
  if (Store.data.settings.quality === 'low' && kind !== 3) rays = Math.round(rays * 0.6);
  const tickEvery = Math.max(1, Math.floor(rays / 9)), ticks = kind === 0 && !quiet;
  for (let i = 0; i < rays; i++) {
    const a = (i + Math.random() * 0.85) / rays * TAU, dx = Math.cos(a), dy = Math.sin(a);
    let t = castRay(L, ox, oy, dx, dy, rpx), k = kind, hcx = castRay.cx, hcy = castRay.cy;
    if (t < 0) t = Infinity;
    if (mute && !mute.calm) {
      const mx = mute.x - ox, my = mute.y - oy, pr = mx * dx + my * dy;
      if (pr > 0) {
        const perp2 = mx * mx + my * my - pr * pr, R2 = mute.r * mute.r;
        if (perp2 < R2) { const tt = Math.max(0, pr - Math.sqrt(R2 - perp2)); if (tt < t && tt < rpx) { t = tt; k = 2; } }
      }
    }
    if (t > rpx) continue;
    const at = now + t / ECHO_SPEED;
    const lf = life * (1 - 0.45 * t / rpx);
    Echo.add(ox + dx * t + (Math.random() - 0.5) * 0.8, oy + dy * t + (Math.random() - 0.5) * 0.8, at, lf, k);
    if (k !== 2 && Math.random() < 0.6) { const dd = t + 1.5 + Math.random() * 3; Echo.add(ox + dx * dd, oy + dy * dd, at + 0.02, lf * 0.45, k); }
    if (ticks && i % tickEvery === 0 && k !== 2) AE.echoTick(ox + dx * t, oy + dy * t, t / ECHO_SPEED, 1 - 0.6 * t / rpx);
    if (k !== 2) { const ci = hcy * L.W + hcx; if (ci >= 0 && ci < L.mem.length && (L.mem[ci] < at || L.mem[ci] < 0)) L.mem[ci] = at; sum += t; n++; }
  }
  // what the wave touches
  const reach = (e, r0 = 0) => { const d = hyp(e.x - ox, e.y - oy); return d < rpx + r0 && (d < T || los(L, ox, oy, e.x, e.y)) ? d : -1; };
  for (const e of L.enemies) {
    if (e.type === 'mute') continue;
    const d = reach(e); if (d >= 0) revealE(L, e, now + d / ECHO_SPEED, life * 0.9, true);
  }
  if (mute && mute.calm) { const d = hyp(mute.x - ox, mute.y - oy); if (d < rpx) revealE(L, mute, now + d / ECHO_SPEED, life, true); }
  for (const s of L.shards) {
    if (s.got) continue; const d = reach(s);
    if (d >= 0) { revealE(L, s, now + d / ECHO_SPEED, life * 1.4); if (!quiet) L.events.push({ at: now + d / ECHO_SPEED, fn: () => AE.shardPing(s.x, s.y, 0.8) }); }
  }
  for (const b of L.bells) {
    const d = reach(b); if (d < 0) continue;
    revealE(L, b, now + d / ECHO_SPEED, life * 1.3);
    if (kind === 0 && !quiet && b.cd <= 0) {
      b.cd = 8;
      L.events.push({ at: now + d / ECHO_SPEED + 0.55, fn: () => ringBell(L, b) });
    }
  }
  if (L.song && !L.song.got) { const d = reach(L.song); if (d >= 0) revealE(L, L.song, now + d / ECHO_SPEED, life * 1.4); }
  if (L.kin && !L.kin.got) {
    const k = L.kin, d = reach(k);
    if (d >= 0) {
      revealE(L, k, now + d / ECHO_SPEED, life * 1.6);
      // a lost voice answers a real call (not a drip, not the cave's greeting)
      if (kind === 0 && !quiet) L.events.push({ at: now + d / ECHO_SPEED + 0.35, fn: () => { AE.kinChirp(k.x, k.y); cue(L, k.x, k.y, 'kin'); k.chirpT = 3.5; k.seenUntil = L.time + 4; if (!k.heard) { k.heard = true; beat('kinHeard'); } } });
    }
  }
  { const d = reach(L.gate); if (d >= 0) revealE(L, L.gate, now + d / ECHO_SPEED, life * 1.5); }
  return n ? sum / n : 0;
}
function ringBell(L, b) {
  b.lit = L.time; AE.bell(b.x, b.y); cue(L, b.x, b.y, 'bell'); beat('bell');
  emitPing(L, b.x, b.y, 11, 190, 1);
  noiseEvent(L, b.x, b.y, 24, 'bell');
}

function releasePing(L, p) {
  const r = G.run, ch = p.charge; p.charging = false; p.charge = 0; AE.chargeStop();
  r.stats.pings++; L.stats.pings++; beat('firstCall');
  const RM = 1 + 0.25 * B('far_call'), cdm = Math.pow(0.7, B('quick_throat'));
  let range, rays, noise, full = false;
  if (ch < 0.18) { range = 9 * RM; rays = 210; noise = 10; AE.chirp(); p.pingCd = 0.35 * cdm; }
  else {
    const c = clamp((ch - 0.18) / 0.8, 0, 1);
    range = lerp(13, 26, c) * RM; rays = Math.round(lerp(270, 430, c)); noise = lerp(14, 30, c);
    AE.call(c); p.pingCd = 0.8 * cdm; full = c >= 0.999; Input.rumble(90 + c * 140, c * 0.35, 0.3 + c * 0.3);
  }
  const avg = emitPing(L, p.x, p.y, range, rays, 0);
  noiseEvent(L, p.x, p.y, noise, 'call');
  if (full && B('shriek')) {
    let n = 0;
    for (const e of L.enemies) {
      if (e.type === 'mute' || hyp(e.x - p.x, e.y - p.y) > 7 * T || !los(L, p.x, p.y, e.x, e.y)) continue;
      e.stun = 2.4; e.state = e.type === 'stalker' ? 'search' : 'back'; e.searchT = 3; e.path = null; n++; AE.stun(e.x, e.y);
    }
    if (L.mute && !L.mute.calm && hyp(L.mute.x - p.x, L.mute.y - p.y) < 7 * T) { L.mute.stun = 1; }
    r.stats.stuns += n; if (n >= 3) unlock('shriek3');
  }
  if (full && L.mute && !L.mute.calm && versesKnown(r) >= 4 && hyp(L.mute.x - p.x, L.mute.y - p.y) < 8 * T + L.mute.r) singToMute(L);
  hint('shards', 'Find the violet shards. When all are found, the way down opens.');
  if (L.bells.some(b => b.seenAt > -99)) hint('bell', 'Bellflowers ring when you call them. Whatever hears them goes to them.');
}
function singToMute(L) {
  const m = L.mute; m.calm = true; m.tx = null; G.run.sang = true;
  AE.chorus(); Music.setMode('chorus'); Input.rumble(900, 0.5, 0.5); emitPing(L, m.x, m.y, 30, 480, 1, true);
  if (L.story) beat('sang'); else say([['n', 'You sing the four verses. The thing that listens falters, then answers in a thousand swallowed voices.']]);
  unlock('chorus');
  if (!L.gate.open) openGate(L);
}
function openGate(L) {
  L.gate.open = true; AE.gateOpen(); Input.rumble(450, 0.35, 0.35);
  L.gate.seenAt = L.time; L.gate.seenUntil = L.time + 4;
  hint('gate', 'The way down is open. Follow its hum.'); beat('gate');
  G.banner = G.banner && G.banner.t < 3 ? G.banner : { t: 0, a: '', b: 'The way down opens' };
}

// ---- player ----
function hurt(L, e) {
  const p = L.player, r = G.run;
  if (p.inv > 0 || G.state !== 'play') return;
  r.hearts--; r.stats.hurt++; L.stats.hurt++;
  p.inv = 1.6; AE.hurt(); Input.rumble(320, 0.9, 0.6); G.lastHurt = e.type;
  const a = Math.atan2(p.y - e.y, p.x - e.x); p.vx = Math.cos(a) * 200; p.vy = Math.sin(a) * 200; p.dashT = 0.12;
  G.shake = Store.data.settings.shake ? 9 : 0; G.flash = 1;
  if (e.type === 'stalker') { e.state = 'search'; e.searchT = 2.5; e.stun = 0.9; e.path = null; }
  if (e.type === 'lurker') { e.state = 'back'; }
  hint('dash', () => 'Press {dart} to dart away.');
  if (r.hearts === 1) beat('lowWings');
  if (r.hearts <= 0) die(L);
}
function die(L) {
  G.state = 'dying'; G.dieT = 2.4; AE.death(); AE.humStop(); AE.chargeStop(); Music.setMode('over'); Input.rumble(800, 1, 0.7); Input.showTouch(false);
  emitPing(L, L.player.x, L.player.y, 14, 300, 2, true);
  const m = Store.data.meta, r = G.run;
  m.bestDepth = Math.max(m.bestDepth, r.depth - 1);
  if (r.mode === 'endless') m.endlessBest = Math.max(m.endlessBest, r.depth);
  if (r.mode === 'daily') m.dailyBest[r.date] = Math.max(m.dailyBest[r.date] || 0, score(r));
  // a story chapter is never lost: its save stays at the chapter's start
  if (r.mode !== 'story') clearRun(r); else Store.save();
}
function score(r) { return r.moths * 10 + (r.depth - 1) * 150 + r.songs.length * 250 + (r.sang ? 1000 : 0); }

function completeDepth() {
  if (G.state !== 'play') return;
  const L = G.L, r = G.run, m = Store.data.meta;
  G.state = 'roost';
  AE.humStop(); AE.chargeStop(); AE.descend(); Input.showTouch(false);
  if (r.depth === 1) unlock('first_light');
  if (r.depth === 4 && r.mode !== 'endless') unlock('halfway');
  if (L.stats.hurt === 0) unlock('untouched');
  if (L.stats.pings <= 5) unlock('whisper');
  if (L.stats.time < 75) unlock('swift');
  if (r.hearts === 1) unlock('close_call');
  m.bestDepth = Math.max(m.bestDepth, r.depth);
  if (r.mode === 'endless') { m.endlessBest = Math.max(m.endlessBest, r.depth); if (r.depth >= 12) unlock('abyss'); }
  if (r.mode === 'story') Store.data.story.chapters = Math.max(Store.data.story.chapters, Math.min(FINAL_DEPTH, r.depth + 1));
  if (isFinal(r)) {
    let kind = r.sang ? 'chorus' : 'return';
    if (r.mode === 'story') {
      if (r.sang && kinFound() >= 6) { kind = 'homecoming'; unlock('homecoming'); }
      Store.data.story.endings[kind] = true;
    }
    m.endings[kind === 'homecoming' ? 'chorus' : kind] = true; unlock('return'); if (r.diff === 'cruel') unlock('cruel');
    if (r.mode === 'daily') m.dailyBest[r.date] = Math.max(m.dailyBest[r.date] || 0, score(r) + 500);
    clearRun(r);
    G.state = 'ending'; Music.setMode(kind === 'return' ? 'ending_return' : 'ending_chorus'); UI.ending(kind);
    return;
  }
  const last = { time: L.stats.time, pings: L.stats.pings, hurt: L.stats.hurt, depth: r.depth };
  r.depth++;
  Store.save();
  UI.roost(rollBoons(r), last);
}
function rollBoons(r) {
  const rng = new RNG(r.seed + r.depth * 31 + r.stats.pings);
  const pool = BOONS.filter(b => (r.boons[b.id] || 0) < b.max && (!b.cond || b.cond(r)));
  const out = [];
  while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(rng.next() * pool.length), 1)[0]);
  return out;
}
function takeBoon(id) {
  const r = G.run;
  if (G.state !== 'roost' || !r) return;
  G.state = 'chapter';
  if (id === '__rest') { /* nothing left to learn */ }
  else if (id === 'mending') { r.hearts = r.maxHearts; AE.heal(); }
  else {
    r.boons[id] = (r.boons[id] || 0) + 1;
    if (id === 'thick_hide') { r.maxHearts++; r.hearts++; }
  }
  saveRun();
  if (r.mode === 'story') UI.chapter(); else startDepth();
}

function collectMoth(L, m) {
  const r = G.run; m.got = true; r.moths++; Store.data.meta.lifetimeMoths++;
  if (r.mothMeter < 12) r.mothMeter++;
  AE.moth(r.mothMeter - 1); Input.rumble(40, 0, 0.15);
  if (r.mothMeter >= 12 && r.hearts < r.maxHearts) { r.hearts++; r.mothMeter = 0; AE.heal(); G.toasts.push({ t: 0, text: 'A wing mends', sub: '' }); }
  if (r.moths >= 40) unlock('glutton');
  hint('moth', 'Moths feed you. Twelve of them mend a wing.');
}

// ---- per-tick simulation ----
function updatePlay(dt) {
  const L = G.L, p = L.player, r = G.run, inp = Input.state, D = D_();
  L.time += dt; r.stats.time += dt; L.stats.time += dt;
  // guards: never leave the bat inside rock or at an invalid position
  if (!isFinite(p.x) || !isFinite(p.y)) { p.x = L.start.x; p.y = L.start.y; p.vx = p.vy = 0; }
  if (hitsWall(L, p.x, p.y, p.r - 0.5)) unstick(L, p);
  if (L.story) {
    if (L.time > 1.2) beat('start');
    if (L.time > 25 && r.depth === 7) beat('deep');
    if (L.mute && !L.mute.calm && hyp(L.mute.x - p.x, L.mute.y - p.y) < 12 * T) beat('muteNear');
  }
  // scheduled wave arrivals
  if (L.events.length) {
    const due = L.events.filter(e => e.at <= L.time);
    if (due.length) { L.events = L.events.filter(e => e.at > L.time); for (const e of due) e.fn(); }
  }
  // movement
  let ix = inp.mx, iy = inp.my; const m = hyp(ix, iy); if (m > 1) { ix /= m; iy /= m; }
  const maxS = 92 * (inp.hush ? 0.4 : 1);
  if (p.dashT > 0) p.dashT -= dt;
  else { const k = Math.min(1, dt * (m > 0.05 ? 9 : 5)); p.vx += (ix * maxS - p.vx) * k; p.vy += (iy * maxS - p.vy) * k; }
  p.dashCd -= dt; p.inv -= dt;
  if (inp.dash && p.dashCd <= 0) {
    let dx = ix, dy = iy; if (hyp(dx, dy) < 0.1) { dx = p.vx; dy = p.vy; } if (hyp(dx, dy) < 0.1) { dx = p.face; dy = 0; }
    const d = hyp(dx, dy); p.vx = dx / d * 270; p.vy = dy / d * 270; p.dashT = 0.17;
    p.dashCd = 1.6 * (B('ghost_dash') ? 0.7 : 1); AE.dash(); Input.rumble(90, 0, 0.45);
    if (!B('ghost_dash')) noiseEvent(L, p.x, p.y, 11, 'dash');
  }
  inp.dash = false;
  moveCircle(L, p, p.vx * dt, p.vy * dt);
  if (Math.abs(p.vx) > 4) p.face = Math.sign(p.vx);
  const spd = hyp(p.vx, p.vy), fp = Math.floor(p.flap / Math.PI); p.flap += dt * (5 + spd * 0.09);
  if (Math.floor(p.flap / Math.PI) !== fp && fp % 2 === 0 && spd > 30) AE.flap(clamp(p.noise / 5, 0, 1));
  if (p.dashT > 0) { p.trail.push([p.x, p.y]); if (p.trail.length > 6) p.trail.shift(); } else if (p.trail.length) p.trail.shift();
  p.noise = p.dashT > 0 ? 0 : Math.max(0, (spd / 92 - 0.48) / 0.52) * 6 * Math.pow(0.65, B('soft_wings'));
  p.noiseTick -= dt;
  if (p.noiseTick <= 0) { p.noiseTick = 0.3; if (p.noise > 0.25) { noiseEvent(L, p.x, p.y, p.noise, 'wings'); p.moved += 0.3; if (p.moved > 4) hint('hush', () => Input.touchMode() ? 'Fast wings are loud. Push the stick gently to glide in silence.' : 'Fast wings are loud. Hold {glide} to glide in silence.'); } }
  AE.listener.x = p.x; AE.listener.y = p.y;
  // calling
  p.pingCd -= dt;
  if (inp.ping && p.pingCd <= 0) {
    if (!p.charging) { p.charging = true; p.charge = 0; }
    const was = p.charge;
    p.charge = Math.min(1, p.charge + dt / (1.1 * Math.pow(0.6, B('deep_breath'))));
    if (p.charge > 0.18) { if (was <= 0.18) AE.chargeStart(); AE.chargeUpdate(clamp((p.charge - 0.18) / 0.8, 0, 1)); }
    if (was < 1 && p.charge >= 1) Input.rumble(60, 0, 0.25);
  } else if (!inp.ping && p.charging) releasePing(L, p);
  if (L.time > 2 && r.stats.pings === 0) hint('call', () => (Input.touchMode() ? 'Tap {call}' : 'Press {call}') + ' to call into the dark. Hold it to call farther.');
  // world
  for (const b of L.bells) b.cd -= dt;
  let tension = 0;
  for (const e of L.enemies) {
    if (!isFinite(e.x) || !isFinite(e.y)) { e.x = e.hx; e.y = e.hy; e.path = null; e.state = e.type === 'stalker' ? 'wander' : e.state; }
    if (e.type === 'stalker') updStalker(L, e, dt, p, D);
    else if (e.type === 'lurker') updLurker(L, e, dt, p, D);
    else updMute(L, e, dt, p, D);
    if (G.state !== 'play') return;
    const d = hyp(e.x - p.x, e.y - p.y) / T;
    if ((e.state === 'hunt' || e.state === 'lunge' || e.state === 'wind' || (e.type === 'mute' && !e.calm)) && d < 18) tension = Math.max(tension, 1 - d / 18);
  }
  Music.tension = lerp(Music.tension, tension, dt * 1.5);
  const lure = B('moth_lure');
  for (const mo of L.moths) {
    if (mo.got) continue;
    mo.ph += dt * 3;
    const d = hyp(mo.x - p.x, mo.y - p.y);
    if (lure && d < 7 * T && d > 4) { const nx = mo.hx + (p.x - mo.hx) / d * 26 * dt, ny = mo.hy + (p.y - mo.hy) / d * 26 * dt; if (!hitsWall(L, nx, ny, 3)) { mo.hx = nx; mo.hy = ny; } }
    if (mo.flee > 0) { mo.flee -= dt; const nx = mo.hx + mo.fx * 55 * dt, ny = mo.hy + mo.fy * 55 * dt; if (!hitsWall(L, nx, ny, 3)) { mo.hx = nx; mo.hy = ny; } else mo.flee = 0; }
    const tx = mo.hx + Math.sin(mo.ph) * 4, ty = mo.hy + Math.sin(mo.ph * 1.7) * 3;
    if (!hitsWall(L, tx, ty, 2)) { mo.x = tx; mo.y = ty; }
    if (d < 10) collectMoth(L, mo);
  }
  for (const s of L.shards) {
    if (s.got) continue;
    if (B('shard_sense')) { s.hum -= dt; if (s.hum <= 0) { s.hum = 3.5; AE.shardPing(s.x, s.y, 0.7); cue(L, s.x, s.y, 'shard'); } }
    if (hyp(s.x - p.x, s.y - p.y) < 11) {
      s.got = true; L.shardsGot++; AE.shard(L.shardsGot - 1); Input.rumble(120, 0.1, 0.35);
      if (L.shardsGot === 1) beat('firstShard');
      if (L.shardsGot >= L.shardsNeeded) openGate(L);
    }
  }
  if (L.song && !L.song.got && hyp(L.song.x - p.x, L.song.y - p.y) < 11) {
    const s = L.song; s.got = true; r.songs.push(s.idx); Music.verses = r.songs.length; AE.song(); Store.data.meta.verses[s.idx] = true; Input.rumble(300, 0.2, 0.2);
    if (r.mode === 'story') Store.data.story.found.verses[s.idx] = true;
    G.storyQ.unshift({ t: 0, text: '\u201c' + SONG_TEXT[s.idx] + '\u201d', sub: 'Lost verse ' + versesKnown(r) + ' of 4', col: COL.song, it: true });
    beat('verse'); Music.verses = versesKnown(r); Store.save();
    unlock('verse'); if (r.songs.length >= 4) unlock('all_verses');
  }
  if (L.kin && !L.kin.got) {
    const k = L.kin, d = hyp(k.x - p.x, k.y - p.y);
    k.chirpT -= dt;
    if (k.chirpT <= 0) { k.chirpT = k.heard ? 4 : 7.5; if (d < 24 * T) { AE.kinChirp(k.x, k.y); cue(L, k.x, k.y, 'kin'); } }
    if (d < 12) {
      k.got = true; r.kin.push(k.idx); Store.data.story.found.kin[k.idx] = true; Store.save();
      L.kinFly = { x: k.x, y: k.y, t: 0 }; AE.kinFound(); Input.rumble(260, 0.15, 0.3);
      if (!k.heard) { k.heard = true; beat('kinHeard'); }
      beat('kinFound');
      if (kinFound() >= 6) unlock('kin6');
    }
  }
  if (L.kinFly) { L.kinFly.t += dt; if (L.kinFly.t > 3) L.kinFly = null; }
  AE.humUpdate(L.gate.x, L.gate.y, L.gate.open);
  if (L.gate.open && hyp(L.gate.x - p.x, L.gate.y - p.y) < 14) { completeDepth(); return; }
  updateDrips(L, p.x, p.y, dt);
  G.rumbleT -= dt;
  if (G.rumbleT <= 0) { G.rumbleT = 25 + Math.random() * 30; const a = Math.random() * TAU; AE.rumble(p.x + Math.cos(a) * 30 * T, p.y + Math.sin(a) * 30 * T); }
  // housekeeping
  L.rings = L.rings.filter(g => (L.time - g.t0) * ECHO_SPEED < g.r);
  L.cues = L.cues.filter(c => L.time - c.t < 1.3);
  L.noises = L.noises.filter(n => L.time - n.t < 0.6);
}

function updateDrips(L, x, y, dt) {
  for (const d of L.drips) {
    if (Math.abs(d.x - x) > 30 * T || Math.abs(d.y - y) > 30 * T) continue;
    d.t -= dt;
    if (d.t <= 0) { d.t = 3.5 + Math.random() * 7; emitPing(L, d.x, d.y, 2.6, 40, 3, true); AE.drip(d.x, d.y); }
  }
}
function restartDepth() { const slot = G.run ? slotOf(G.run) : null; if (loadRun(slot)) startDepth(); }
// push the bat to the nearest open cell centre if anything ever leaves it inside rock
function unstick(L, p) {
  const cx = Math.floor(p.x / T), cy = Math.floor(p.y / T);
  for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = (cx + dx + 0.5) * T, y = (cy + dy + 0.5) * T;
    if (!solidAt(L, cx + dx, cy + dy) && !hitsWall(L, x, y, p.r)) { p.x = x; p.y = y; p.vx = p.vy = 0; return; }
  }
  p.x = L.start.x; p.y = L.start.y; p.vx = p.vy = 0;
}

function stuckCheck(e, dt, want) {
  const moved = hyp(e.x - (e.lx ?? e.x), e.y - (e.ly ?? e.y)); e.lx = e.x; e.ly = e.y;
  if (want > 5 && moved < want * dt * 0.25) e.stuck += dt; else e.stuck = Math.max(0, e.stuck - dt);
  if (e.stuck > 1.1) { e.stuck = 0; e.path = null; return true; }
  return false;
}
function follow(L, e, spd, dt) {
  const pt = e.path[e.pi]; if (!pt) return true;
  const dx = pt[0] - e.x, dy = pt[1] - e.y, d = hyp(dx, dy);
  if (d < 3) { e.pi++; return e.pi >= e.path.length; }
  const s = Math.min(d, spd * dt);
  moveCircle(L, e, dx / d * s, dy / d * s);
  return false;
}
function updStalker(L, e, dt, p, D) {
  if (e.stun > 0) { e.stun -= dt; return; }
  e.click -= dt;
  if (e.click <= 0) {
    e.click = e.state === 'hunt' ? 0.65 + Math.random() * 0.3 : 2.6 + Math.random() * 3;
    AE.click(e.x, e.y); cue(L, e.x, e.y, 'enemy');
    if (B('sharp_ear') && hyp(e.x - p.x, e.y - p.y) < 22 * T) { e.seenAt = L.time; e.seenUntil = L.time + 0.9; e.gx = e.x; e.gy = e.y; }
  }
  const sm = D.enemySpeed * L.speedMul, d = hyp(p.x - e.x, p.y - e.y);
  // at arm's length it can feel your warmth
  if (d < 1.5 * T && los(L, e.x, e.y, p.x, p.y)) { e.state = 'hunt'; e.direct = true; e.tx = p.x; e.ty = p.y; }
  else if (e.direct) { e.direct = false; e.path = null; }
  let want = 0;
  if (e.state === 'wander') {
    if (!e.path || e.pi >= e.path.length) {
      e.wait -= dt;
      if (e.wait <= 0) {
        e.wait = 1 + Math.random() * 2.5;
        for (let k = 0; k < 8; k++) {
          const tx = e.x + (Math.random() - 0.5) * 18 * T, ty = e.y + (Math.random() - 0.5) * 18 * T;
          if (!solidAt(L, Math.floor(tx / T), Math.floor(ty / T))) { e.path = L.path(e.x, e.y, tx, ty, 1500); e.pi = 0; if (e.path) break; }
        }
      }
    } else { want = 34 * sm; follow(L, e, want, dt); }
  } else if (e.state === 'hunt') {
    if (e.direct) { want = 96 * sm; const dd = d || 1; moveCircle(L, e, (p.x - e.x) / dd * want * dt, (p.y - e.y) / dd * want * dt); }
    else {
      e.repath -= dt;
      if (!e.path && e.repath <= 0) { e.repath = 0.3; e.path = L.path(e.x, e.y, e.tx, e.ty, 4500); e.pi = 0; if (!e.path) { e.state = 'search'; e.searchT = 2; } }
      if (e.path) { want = 74 * sm; if (follow(L, e, want, dt)) { e.state = 'search'; e.searchT = 2.5 + Math.random() * 1.5; e.path = null; } }
    }
  } else if (e.state === 'search') {
    e.searchT -= dt; e.jit -= dt;
    if (e.jit <= 0) { e.jit = 0.6; e.ja = Math.random() * TAU; }
    want = 22 * sm; moveCircle(L, e, Math.cos(e.ja) * want * dt, Math.sin(e.ja) * want * dt);
    if (e.searchT <= 0) { e.state = 'wander'; e.path = null; e.wait = 0.5; }
  }
  if (stuckCheck(e, dt, want) && e.state === 'wander') e.wait = 0;
  if (d < e.r + p.r) hurt(L, e);
}
function updLurker(L, e, dt, p, D) {
  if (e.stun > 0) { e.stun -= dt; return; }
  const d = hyp(p.x - e.x, p.y - e.y);
  e.breath -= dt;
  if (e.breath <= 0) { e.breath = 5 + Math.random() * 3; AE.breath(e.x, e.y); }
  if (e.state === 'idle') {
    if (d < 4.5 * T && p.noise > 0.3 && los(L, e.x, e.y, p.x, p.y)) { e.state = 'wind'; e.t = 0.45; AE.growl(e.x, e.y); cue(L, e.x, e.y, 'enemy'); }
    if (d < 1.2 * T) { e.state = 'wind'; e.t = 0.3; AE.growl(e.x, e.y); }
  } else if (e.state === 'wind') {
    e.t -= dt;
    if (e.t <= 0) { const dd = d || 1; e.state = 'lunge'; e.t = 0.4; e.vx = (p.x - e.x) / dd * 235 * D.enemySpeed; e.vy = (p.y - e.y) / dd * 235 * D.enemySpeed; AE.lunge(e.x, e.y); e.seenAt = L.time; e.seenUntil = L.time + 0.35; e.gx = e.x; e.gy = e.y; }
  } else if (e.state === 'lunge') {
    e.t -= dt;
    const vx = e.vx, vy = e.vy;
    if (moveCircle(L, e, vx * dt, vy * dt) || e.t <= 0) e.state = 'back';
  } else if (e.state === 'back') {
    const dx = e.hx - e.x, dy = e.hy - e.y, dh = hyp(dx, dy);
    if (dh < 2) { e.state = 'idle'; e.x = e.hx; e.y = e.hy; }
    else { const s = Math.min(dh, 30 * dt); if (moveCircle(L, e, dx / dh * s, dy / dh * s)) { e.x = e.hx; e.y = e.hy; e.state = 'idle'; } }
  }
  if (d < e.r + p.r && e.state !== 'back') hurt(L, e);
}
function updMute(L, e, dt, p, D) {
  e.pulse -= dt;
  if (e.calm) { e.x += Math.sin(L.time * 0.3) * 6 * dt; return; }
  if (e.pulse <= 0) { e.pulse = 3.6; AE.mutePulse(e.x, e.y); cue(L, e.x, e.y, 'enemy'); }
  if (e.stun > 0) { e.stun -= dt; return; }
  // it drifts through stone toward what it last heard
  if (e.tx != null) {
    const dx = e.tx - e.x, dy = e.ty - e.y, d = hyp(dx, dy);
    if (d < 6) e.tx = null; else { const s = Math.min(d, 27 * D.enemySpeed * dt); e.x += dx / d * s; e.y += dy / d * s; }
  }
  if (hyp(p.x - e.x, p.y - e.y) < e.r + p.r - 2) hurt(L, e);
}

// ---- title-screen attract mode ----
function makeDemo() {
  const L = buildLevel({ seed: (Math.random() * 1e9) >>> 0, size: 4, depth: 4, shards: 3, moths: 20, bells: 3, stalkers: 0, lurkers: 0, song: null });
  L.memLife = 9;
  const cam = { x: L.start.x, y: L.start.y };
  G.demo = { L, cam, path: null, pi: 0, ping: 0.6 };
  R.snapCam(cam.x, cam.y);
}
function updateDemo(dt) {
  const d = G.demo; if (!d) return;
  const L = d.L; L.time += dt;
  if (L.events.length) { const due = L.events.filter(e => e.at <= L.time); if (due.length) { L.events = L.events.filter(e => e.at > L.time); for (const e of due) e.fn(); } }
  if (!d.path || d.pi >= d.path.length) {
    for (let k = 0; k < 10 && (!d.path || d.pi >= d.path.length); k++) {
      const i = Math.floor(Math.random() * L.W * L.H);
      if (!L.g[i] && L.dist[i] >= 0) { d.path = L.path(d.cam.x, d.cam.y, cellX(L, i), cellY(L, i), 6000); d.pi = 0; }
    }
  }
  if (d.path && d.path[d.pi]) {
    const pt = d.path[d.pi], dx = pt[0] - d.cam.x, dy = pt[1] - d.cam.y, dd = hyp(dx, dy);
    if (dd < 3) d.pi++; else { d.cam.x += dx / dd * 34 * dt; d.cam.y += dy / dd * 34 * dt; }
  }
  for (const mo of L.moths) { mo.ph += dt * 3; mo.x = mo.hx + Math.sin(mo.ph) * 4; mo.y = mo.hy + Math.sin(mo.ph * 1.7) * 3; }
  AE.listener.x = d.cam.x; AE.listener.y = d.cam.y;
  updateDrips(L, d.cam.x, d.cam.y, dt);
  d.ping -= dt;
  if (d.ping <= 0) { d.ping = 1.9; emitPing(L, d.cam.x, d.cam.y, 17, 320, 0, true); }
  L.rings = L.rings.filter(g => (L.time - g.t0) * ECHO_SPEED < g.r);
}
