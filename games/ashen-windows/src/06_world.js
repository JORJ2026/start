
/* ==========================================================================
   SECTION 9: LEVELS (home cutaway and scavenging sites) AND THE WORLD
   A level is floors + connectors (ladders/stairs) + blockers + objects.
   That same structure is the coarse navigation graph the AI walks.
   ========================================================================== */
function mkLevel(o) {
  return Object.assign({ w: 960, h: 540, floors: [], ladders: [], blockers: [], objs: [], lights: [], water: [], snipers: [], npcSpec: [], dark: 0.3, site: false, spawn: { x: 100, f: 0 } }, o);
}

/* --- The Ashen Windows shelter: roof, three interior floors, cellar --- */
function buildHome(run, night) {
  const Hc = CFG.home, L = mkLevel({ id: 'home', name: 'Ashen Windows', w: 960, home: true, dark: night ? 0.76 : 0.1 });
  Hc.floorsY.forEach((y, i) => L.floors.push({ y, x0: Hc.x0 + (i === 0 ? 14 : 0), x1: i === 3 ? Hc.streetX : Hc.x1 - (i === 0 ? 14 : 0), surf: (i === 0 || i === 4) ? 'stone' : 'wood' }));
  L.ladders.push({ id: 'l01', xa: 480, xb: 480, fa: 0, fb: 1 }, { id: 's12', xa: 760, xb: 680, fa: 1, fb: 2, stairs: true },
                 { id: 's23', xa: 200, xb: 280, fa: 2, fb: 3, stairs: true }, { id: 'l34', xa: 600, xb: 600, fa: 3, fb: 4 });
  L.ladders.forEach(l => { l.broken = !!(run.broken && run.broken.ladders[l.id]); });
  L.blockers.push({ type: 'door', x: Hc.doorX, f: 3, open: false, home: true, id: 'frontdoor', hp: 30 + (run.barricade || 0) * 26, max: 30 + BARRICADE_MAX * 26 });
  const add = (type, x, f, ex) => { const o = Object.assign({ type, x, f }, ex || {}); L.objs.push(o); return o; };
  const up = id => !!run.up[id];
  // roof
  if (up('raincatcher')) add('raincatcher', UPGRADES.raincatcher.x, 0);
  if (up('garden')) add('garden', UPGRADES.garden.x, 0);
  if (up('coop')) add('coop', UPGRADES.coop.x, 0);
  if (up('firebarrel')) add('firebarrel', UPGRADES.firebarrel.x, 0);
  // floor 1: beds, care, keepsakes
  add('plant', 122, 1); add('bed', 190, 1);
  if (up('bed2')) add('bed', 280, 1);
  add('medshelf', 380, 1); add('sewing', 560, 1); add('photo', 640, 1); add('hide', 830, 1, { kind: 'wardrobe' });
  add('window', 96, 1); add('window', 96, 2);
  // floor 2: talk, play, light
  add('drawing', 132, 2);
  if (up('radio')) add('radio', UPGRADES.radio.x, 2);
  if (up('cards')) add('cards', UPGRADES.cards.x, 2);
  if (run.musicbox) add('musicbox', 520, 2);
  add('candle', 590, 2); add('drawer', 770, 2); add('painting', 834, 2);
  // floor 3: kitchen, workshop, door
  add('jars', 130, 3); add('fridge', 186, 3); add('stove', UPGRADES.stove.x, 3); add('pantry', 440, 3); add('workbench', UPGRADES.workbench.x, 3);
  if (up('heater')) add('heater', UPGRADES.heater.x, 3);
  add('hide', 752, 3, { kind: 'coats' }); add('door', Hc.doorX - 22, 3);
  // cellar
  add('mouse', 118, 4); add('safe', 200, 4); add('barrel', 300, 4);
  if (up('filter')) add('filter', UPGRADES.filter.x, 4);
  add('hide', 700, 4, { kind: 'rubble' }); add('buttons', 786, 4);
  for (const id in UPGRADES) { const u = UPGRADES[id]; if (u.obj && up(id)) add(u.obj, u.x, u.f); }
  // lights: one bulb per interior floor, plus the candle
  for (let f = 1; f <= 4; f++) L.lights.push({ x: 300 + (f % 2) * 280, f, r: 150, flick: true, bulb: true });
  L.spawn = { x: 440, f: 3 };
  return L;
}
const HOME_ROOMS = [];                                               // 12 rooms: floors 1..4 x three zones
for (let f = 1; f <= 4; f++) for (let z = 0; z < 3; z++) HOME_ROOMS.push({ f, z, x0: 90 + z * 260, x1: 350 + z * 260, id: f + '-' + z });
function roomOf(x, f) { return HOME_ROOMS.find(r => r.f === f && x >= r.x0 && x < r.x1 + (r.z === 2 ? 90 : 0)) || null; }

/* --- Scavenging sites are generated from the location table with a seeded RNG --- */
function buildSite(id, seed, o) {
  o = o || {}; const loc = LOCS[id], r = new RNG(seed), diff = o.diff || DIFF.normal;
  const nF = o.floors || loc.floors, w = o.w || loc.w, gy = CFG.site.groundY, fh = CFG.site.floorH;
  const L = mkLevel({ id, name: loc.n, w, site: true, dark: o.dark != null ? o.dark : loc.dark, bg: loc.bg, loc, seed });
  for (let i = 0; i < nF; i++) {
    let x0 = i === nF - 1 ? 0 : 170 + r.i(0, 70), x1 = w;
    if (loc.partial && i < nF - 1) x1 = Math.round(w * (0.52 + 0.22 * i));
    if (id === 'metro' && i === 0) x1 = Math.round(w * 0.5);
    L.floors.push({ y: gy - (nF - 1 - i) * fh, x0, x1, surf: (loc.bg === 'tunnel' || loc.bg === 'open') ? 'stone' : 'wood' });
  }
  const Gf = nF - 1, used = L.floors.map(() => []);
  const free = (x, f, gap) => used[f].every(u => Math.abs(u - x) >= (gap || 50));
  const put = (f, a, b, gap) => {
    const fl = L.floors[f]; a = Math.max(a, fl.x0 + 34); b = Math.min(b, fl.x1 - 34); if (b <= a) return null;
    for (let k = 0; k < 40; k++) { const x = Math.round(r.r(a, b)); if (free(x, f, gap)) { used[f].push(x); return x; } }
    return null;
  };
  L.objs.push({ type: 'exit', x: 46, f: Gf }); used[Gf].push(46); L.spawn = { x: 84, f: Gf };
  // connectors between floors, alternating stairs and ladders
  for (let i = 0; i < nF - 1; i++) {
    const upF = L.floors[i], lo = L.floors[i + 1], a = Math.max(upF.x0, lo.x0) + 70, b = Math.min(upF.x1, lo.x1) - 90, n = Math.max(2, Math.round((b - a) / 760));
    for (let k = 0; k < n; k++) {
      const cx = Math.round(a + (b - a) * (k + 0.5) / n + r.r(-50, 50)), stairs = (k + i) % 2 === 0;
      const lad = stairs ? { xa: clamp(cx + (k % 2 ? -80 : 80), upF.x0 + 12, upF.x1 - 12), xb: cx, fa: i, fb: i + 1, stairs: true } : { xa: cx, xb: cx, fa: i, fb: i + 1 };
      L.ladders.push(lad); used[i].push(lad.xa); used[i + 1].push(lad.xb); if (stairs) used[i + 1].push((lad.xa + lad.xb) / 2);
    }
  }
  // sniper corridors on the ground floor of open sites
  const nSn = o.snipers != null ? o.snipers : (loc.snipers || 0);
  for (let k = 0; k < nSn; k++) {
    const cx = Math.round(w * (0.3 + 0.55 * (k + 0.5) / nSn)), half = 120;
    L.snipers.push({ x0: cx - half, x1: cx + half, f: Gf, period: 6.2 + k * 0.7, safe: clamp(2.7 * diff.warn, 2.2, 4.2), t: r.r(0, 5), rx: cx });
    L.objs.push({ type: 'hide', kind: 'pillar', x: cx, f: Gf }); used[Gf].push(cx);
  }
  const inSniper = x => L.snipers.some(z => x > z.x0 - 30 && x < z.x1 + 30);
  // doors
  for (let f = 0; f < nF; f++) {
    const fl = L.floors[f];
    for (let x = fl.x0 + 400 + r.i(0, 120); x < fl.x1 - 220; x += 470 + r.i(0, 240)) {
      if (!free(x, f, 44) || (f === Gf && inSniper(x)) || o.noDoors) continue;
      used[f].push(x); L.blockers.push({ type: 'door', x, f, open: false, locked: r.chance(f < Gf ? 0.16 + loc.danger * 0.05 : 0.05 * loc.danger) });
    }
  }
  // containers with loot; the first is always useful, far ones are richer
  const kinds = ['cabinet', 'crate', 'locker', 'shelf', 'drawers'], conts = [];
  const nCont = o.cont != null ? o.cont : loc.cont;
  for (let k = 0; k < nCont; k++) {
    const f = r.i(0, nF - 1), x = put(f, 230, w - 40); if (x == null) continue;
    const far = x / w; let n = 1 + (r.chance(0.5) ? 1 : 0) + (far > 0.6 && r.chance(0.6) ? 1 : 0);
    if (diff.scarcity > 1 && r.chance(diff.scarcity - 1)) n++; if (diff.scarcity < 1 && n > 1 && r.chance(1 - diff.scarcity)) n--;
    if (o.scarce && n > 1 && r.chance(o.scarce)) n--;
    const items = []; for (let j = 0; j < n; j++) items.push(r.w(loc.loot));
    const c = { type: 'cont', kind: r.pick(kinds), x, f, items, rich: far > 0.6 }; conts.push(c); L.objs.push(c);
  }
  conts.sort((a, b) => a.x - b.x);
  if (conts[0]) conts[0].items.unshift(loc.guarantee);
  if (o.rare && conts.length) conts[conts.length - 1].items.push(o.rare);
  if (o.luck && conts.length > 2) conts[conts.length - 2].items.push(r.w(loc.loot));
  L.conts = conts;
  // hide spots
  for (let f = 0; f < nF; f++) {
    const fl = L.floors[f];
    for (let x = fl.x0 + 190; x < fl.x1 - 100; x += 320 + r.i(0, 110)) { const hx = put(f, x - 60, x + 60, 46); if (hx != null) L.objs.push({ type: 'hide', kind: r.pick(['wardrobe', 'rubble', 'stairs']), x: hx, f }); }
  }
  // squeaky boards and loose bricks
  for (let k = 0; k < 3 + loc.danger; k++) { const f = r.i(0, nF - 1), x = put(f, 260, w - 60, 40); if (x != null) L.objs.push({ type: 'squeak', x, f }); }
  for (let k = 0; k < 2; k++) { const f = r.i(0, nF - 1), x = put(f, 200, w - 60, 40); if (x != null) L.objs.push({ type: 'brick', x, f }); }
  // lamps: lit zones raise exposure
  if (!o.blackout) for (let f = 0; f < nF; f++) { const fl = L.floors[f]; for (let x = fl.x0 + 300 + r.i(0, 200); x < fl.x1 - 100; x += 620 + r.i(0, 260)) L.lights.push({ x, f, r: 120, flick: r.chance(0.5), bulb: true }); }
  // flood water
  if (loc.water) { for (let x = 420; x < w - 300; x += 640 + r.i(0, 200)) L.water.push({ x0: x, x1: x + 260 + r.i(0, 180), f: Gf }); }
  // gaps only a child fits through, guarding a bonus cabinet
  for (let k = 0; k < (loc.gaps || 0); k++) {
    const f = k % Math.max(1, nF - 1), fl = L.floors[f], gx = fl.x1 - 150 - k * 40;
    if (!free(gx, f, 40)) continue;
    L.blockers.push({ type: 'gap', x: gx, f, open: false }); used[f].push(gx);
    L.objs.push({ type: 'cont', kind: 'locker', x: gx + 70, f, items: [r.w(loc.loot), r.w(loc.loot), loc.guarantee], rich: true });
  }
  // inhabitants
  if (!o.noNpc) {
    const list = o.npcs || loc.npcs, cnt = Math.max(1, Math.round(list.length * diff.patrols + (o.extraNpc || 0)));
    for (let i = 0; i < cnt; i++) {
      const type = list[i % list.length], f = (type === 'dog' || type === 'civ') ? Gf : r.i(0, nF - 1), fl = L.floors[f];
      const x = clamp(r.r(w * 0.32, w * 0.92), fl.x0 + 120, fl.x1 - 120), span = r.i(130, 250);
      L.npcSpec.push({ type, x, f, p0: Math.max(fl.x0 + 30, x - span), p1: Math.min(fl.x1 - 30, x + span) });
    }
  }
  // mode and set-piece extras
  if (o.shutter) {
    const sx = Math.round(w * 0.56); L.blockers = L.blockers.filter(b => !(b.f === Gf && Math.abs(b.x - sx) < 200));
    L.blockers.push({ type: 'shutter', x: sx, f: Gf, open: false, prog: 0 });
    L.objs.push({ type: 'cont', kind: 'cabinet', x: sx + 90, f: Gf, items: ['meds', 'meds', 'antibio', 'bandage'], rich: true, story: true });
    L.npcSpec.push({ type: 'patrol', x: sx + 420, f: Gf, p0: sx - 330, p1: sx + 460 });
    const lad = L.ladders[0]; if (lad) L.npcSpec.push({ type: 'civ', x: lad.xa + 60, f: lad.fa, p0: lad.xa + 60, p1: lad.xa + 60, mode: 'wounded' });
  }
  if (o.collapse) { L.collapse = { x: w + 40, active: false, warn: 0, speed: 92, done: false }; const far = conts[conts.length - 1]; if (far) { far.trigger = 'collapse'; far.items.push('parts', 'fuel'); } }
  if (o.signal) L.objs.push({ type: 'signal', x: w - 90, f: Gf });
  if (o.goal) L.objs.push({ type: 'goal', x: w - 80, f: o.goalGround ? Gf : 0 });
  if (o.tuner) L.objs.push({ type: 'tuner', x: w - 90, f: Gf });
  for (let k = 0; k < (o.crates || 0); k++) { const f = r.i(0, nF - 1), x = put(f, w * 0.35, w - 60, 44); if (x != null) L.objs.push({ type: 'crate', x, f }); }
  for (let k = 0; k < (o.mail || 0); k++) { let f = r.i(0, nF - 1), x = put(f, 260 + k * (w - 400) / Math.max(1, o.mail), w - 60, 60); if (x == null) { f = Gf; x = put(f, 200, w - 60, 40); } if (x != null) L.objs.push({ type: 'mailbox', x, f, idx: k }); }
  for (let k = 0; k < (o.keeps || 0); k++) { const f = r.i(0, nF - 1), x = put(f, w * 0.25, w - 60, 44); if (x != null) L.objs.push({ type: 'keep', x, f, idx: (o.keepBase || 0) + k }); }
  if (o.cat) L.npcSpec.push({ type: 'cat', x: 300, f: Gf, p0: 240, p1: 420 });
  return L;
}

/* A short handcrafted street for the tutorial night. */
function buildTutorial() {
  const L = mkLevel({ id: 'pharmacy', name: 'Corner Pharmacy', w: 1500, site: true, dark: 0.82, bg: 'shop', loc: LOCS.pharmacy, tutorial: true });
  L.floors.push({ y: 340, x0: 430, x1: 1500, surf: 'wood' }, { y: 440, x0: 0, x1: 1500, surf: 'stone' });
  L.ladders.push({ xa: 610, xb: 530, fa: 0, fb: 1, stairs: true });
  L.objs.push({ type: 'exit', x: 46, f: 1 }, { type: 'cont', kind: 'cabinet', x: 360, f: 1, items: ['bandage', 'can'] },
    { type: 'cont', kind: 'shelf', x: 760, f: 0, items: ['meds', 'syrup'] }, { type: 'hide', kind: 'wardrobe', x: 900, f: 0 },
    { type: 'cont', kind: 'locker', x: 1180, f: 0, items: ['bandage', 'battery', 'cloth'], rich: true }, { type: 'squeak', x: 1040, f: 0 }, { type: 'hide', kind: 'rubble', x: 1120, f: 1 });
  L.lights.push({ x: 300, f: 1, r: 120, flick: true, bulb: true });
  L.npcSpec.push({ type: 'patrol', x: 1420, f: 0, p0: 1010, p1: 1440, late: true });
  L.spawn = { x: 84, f: 1 }; L.conts = L.objs.filter(o => o.type === 'cont');
  return L;
}

/* The bell tower for Signal Run: five short floors, gusts on the ladders. */
function buildTower(seed, diff) {
  const r = new RNG(seed), L = mkLevel({ id: 'church', name: 'Bell Tower', w: 1100, site: true, dark: 0.84, bg: 'nave', loc: LOCS.church });
  for (let i = 0; i < 5; i++) L.floors.push({ y: 40 + i * 100, x0: i === 4 ? 0 : 180, x1: i === 4 ? 1100 : 940, surf: 'wood' });
  for (let i = 0; i < 4; i++) {
    const left = i % 2 === 0;
    L.ladders.push({ xa: left ? 260 : 860, xb: left ? 260 : 860, fa: i, fb: i + 1 }, { xa: left ? 760 : 380, xb: left ? 680 : 460, fa: i, fb: i + 1, stairs: true, loose: i === 2 });
    L.objs.push({ type: 'hide', kind: 'rubble', x: 560, f: i + 1 }, { type: 'squeak', x: 470 + r.i(-40, 40), f: i });
  }
  L.objs.push({ type: 'exit', x: 46, f: 4 }, { type: 'goal', x: 560, f: 0, bell: true });
  L.gust = { t: 3, period: 9, warn: 2 * diff.warn, dur: 1.2, phase: 'calm' };
  L.npcSpec.push({ type: 'patrol', x: 600, f: 2, p0: 320, p1: 820 }); if (diff.patrols > 1) L.npcSpec.push({ type: 'patrol', x: 500, f: 3, p0: 300, p1: 800 });
  L.spawn = { x: 84, f: 4 }; L.conts = [];
  return L;
}

/* ==========================================================================
   The World: one level plus everyone and everything in it.
   ========================================================================== */
class World {
  constructor(L, run, o) {
    this.L = L; this.run = run; this.o = o || {}; this.surv = []; this.npcs = []; this.proj = [];
    for (let i = 0; i < 10; i++) this.proj.push({ a: false });
    this.t = 0; this.night = !!this.o.night; this.diff = DIFF[run.diff] || DIFF.normal;
    this.noiseLvl = 0; this.cam = { x: L.home ? 480 : W / 2, y: L.home ? CFG.home.camY : 270, zoom: L.home ? CFG.home.zoom : 1, shake: 0, punch: 0 };
    this.slowT = 0; this.hitStop = 0; this.pack = { items: {}, cap: CFG.pack }; this.noTools = !!this.o.noTools;
    this.rec = []; this.recT = 0; this.replay = null; this.replayScore = 0; this.spotted = 0; this.closeCalls = 0; this.distractions = 0;
    this.rng = new RNG((run.seed ^ hashStr(L.id + ':' + run.day)) >>> 0);
    this.acts = {}; this.over = null; this.scene = null; this.ccCool = 0; this.heartCool = 0;
    for (const sp of L.npcSpec) this.spawnNPC(sp.type, sp.x, sp.f, sp);
  }
  spawnNPC(type, x, f, o) { const n = new NPC(type, x, f, o || {}); this.npcs.push(n); return n; }
  floorY(f) { return this.L.floors[clamp(f, 0, this.L.floors.length - 1)].y; }
  entY(e) { if (e.cl) { const l = e.cl.lad; return lerp(this.floorY(l.fb), this.floorY(l.fa), clamp(e.cl.t, 0, 1)); } return this.floorY(e.f); }
  entF(e) { if (e.cl) return e.cl.t > 0.5 ? e.cl.lad.fa : e.cl.lad.fb; return e.f; }
  sx(x) { return (x - this.cam.x) * this.cam.zoom + W / 2; }
  sy(y) { return (y - this.cam.y) * this.cam.zoom + H / 2; }
  place(s, x, f) { s.x = x; s.f = f; s.cl = null; s.vx = 0; }
  /* A closed blocker stops movement from x0 to x1 (survivors stop 8px short of it). */
  blockerBetween(f, x0, x1, e) {
    const bl = this.L.blockers;
    for (let i = 0; i < bl.length; i++) {
      const b = bl[i]; if (b.f !== f || b.open) continue;
      if (b.type === 'gap' && e && e.id === 'toby') continue;
      if ((x0 < b.x && x1 > b.x - 8) || (x0 >= b.x && x1 < b.x + 8)) return b;
    }
    return null;
  }
  /* Line of sight / projectile test: is there a closed blocker strictly between two points? */
  wallBetween(f, x0, x1) {
    const bl = this.L.blockers;
    for (let i = 0; i < bl.length; i++) { const b = bl[i]; if (b.f === f && !b.open && (x0 < b.x) !== (x1 < b.x)) return b; }
    return null;
  }
  ladderNear(e) { for (const l of this.L.ladders) { if (l.broken) continue; if ((l.fb === e.f && Math.abs(e.x - l.xb) < 16) || (l.fa === e.f && Math.abs(e.x - l.xa) < 16)) return l; } return null; }
  /* Shared movement for survivors and NPCs: walk on a floor, stop at blockers, climb connectors. */
  move(e, mx, my, dt, spd) {
    if (e.cl) {
      const l = e.cl.lad; let d = e.cl.auto != null ? e.cl.auto : (my < -0.3 ? 1 : my > 0.3 ? -1 : 0);
      if (!d && l.stairs && Math.abs(mx) > 0.2) d = sgn(mx) * sgn(l.xa - l.xb);
      if (e.gustHold) d = 0;
      e.cl.t += d * CFG.climb * (l.stairs ? 1.2 : 1) * (spd / CFG.walk) * 0.62 * dt;
      e.x = lerp(l.xb, l.xa, clamp(e.cl.t, 0, 1)); e.vx = d * 24; e.climbing = d !== 0;
      if (l.stairs && d) e.face = sgn((l.xa - l.xb) * d) || e.face;
      if (e.cl.t >= 1) { e.f = l.fa; e.x = l.xa; e.cl = null; e.vx = 0; if (l.loose && !l.broken && e instanceof Survivor) { l.broken = true; Snd.sfx('creak'); Snd.sfx('thud'); Floaters.add('The stair gives way behind you.', e.x, this.floorY(e.f) - 60, {}); } }
      else if (e.cl.t <= 0) { e.f = l.fb; e.x = l.xb; e.cl = null; e.vx = 0; }
      return;
    }
    if (my < -0.5 || my > 0.5) {
      const upw = my < 0;
      for (const l of this.L.ladders) {
        if (l.broken) continue;
        if (upw && l.fb === e.f && Math.abs(e.x - l.xb) < 16) { e.cl = { lad: l, t: 0.001 }; e.x = l.xb; return; }
        if (!upw && l.fa === e.f && Math.abs(e.x - l.xa) < 16) { e.cl = { lad: l, t: 0.999 }; e.x = l.xa; return; }
      }
    }
    const fl = this.L.floors[e.f]; let nx = e.x + mx * spd * dt;
    const b = (e.jz > 5 ? null : this.blockerBetween(e.f, e.x, nx, e));
    if (b) { const lim = e.x < b.x ? b.x - 8 : b.x + 8; nx = e.x < b.x ? Math.min(nx, lim) : Math.max(nx, lim); e.blockedBy = b; } else e.blockedBy = null;
    nx = clamp(nx, fl.x0 + 6, fl.x1 - 6);
    e.vx = dt > 0 ? (nx - e.x) / dt : 0; e.x = nx; if (Math.abs(mx) > 0.05) e.face = sgn(mx);
  }
  /* Which connector to take from floor f0 toward f1 (BFS over floors). */
  pathLadder(f0, f1, x) {
    const nF = this.L.floors.length, dist = new Array(nF).fill(99), q = [f1]; dist[f1] = 0;
    while (q.length) { const f = q.shift(); for (const l of this.L.ladders) { if (l.broken) continue; const o = l.fa === f ? l.fb : l.fb === f ? l.fa : -1; if (o >= 0 && dist[o] > dist[f] + 1) { dist[o] = dist[f] + 1; q.push(o); } } }
    let best = null, bd = 1e9;
    for (const l of this.L.ladders) {
      if (l.broken) continue; const o = l.fa === f0 ? l.fb : l.fb === f0 ? l.fa : -1; if (o < 0 || dist[o] !== dist[f0] - 1) continue;
      const d = Math.abs((l.fa === f0 ? l.xa : l.xb) - x); if (d < bd) { bd = d; best = l; }
    }
    return best;
  }
  /* Steer an entity toward (tx, tf). Returns 'arrived' | 'moving' | 'blocked'. */
  nav(e, tx, tf, dt, spd) {
    if (e.cl) { this.move(e, 0, 0, dt, spd); return 'moving'; }
    if (e.f === tf) {
      const dx = tx - e.x; if (Math.abs(dx) < 6) { e.vx = 0; return 'arrived'; }
      this.move(e, sgn(dx), 0, dt, spd);
      if (e.blockedBy) { const b = e.blockedBy; if (b.type === 'door' && !b.locked && !b.home) { b.open = true; Snd.sfx('door'); return 'moving'; } return 'blocked'; }
      return 'moving';
    }
    const lad = this.pathLadder(e.f, tf, e.x); if (!lad) return 'blocked';
    const upw = lad.fb === e.f, lx = upw ? lad.xb : lad.xa;
    if (Math.abs(lx - e.x) < 5) { e.x = lx; e.cl = { lad, t: upw ? 0.001 : 0.999, auto: upw ? 1 : -1 }; return 'moving'; }
    this.move(e, sgn(lx - e.x), 0, dt, spd);
    if (e.blockedBy) { const b = e.blockedBy; if (b.type === 'door' && !b.locked && !b.home) { b.open = true; Snd.sfx('door'); return 'moving'; } return 'blocked'; }
    return 'moving';
  }
  lit(x, f) { for (const l of this.L.lights) if (l.on !== false && l.f === f && Math.abs(x - l.x) < l.r * 0.8) return true; return false; }
  /* How visible a survivor is right now (the light meter). */
  expo(s) {
    let e = this.night ? CFG.expo.dark : 1.0;
    if (s.light) e += CFG.expo.torch; if (this.night && this.lit(s.x, this.entF(s))) e += CFG.expo.lit; if (s.lantern) e += 0.45;
    if (s.crouch) e *= CFG.expo.crouch; if (s.sprint) e *= CFG.expo.run;
    e *= (1.2 - s.st.stl * 0.07); if (this.run.mods.fog) e *= 0.75;
    return e;
  }
  noise(x, f, r, src) {
    if (this.run.mods.noisy) r *= 1.4;
    if (r > this.noiseLvl) this.noiseLvl = r;
    for (const n of this.npcs) n.hear(this, x, f, r, src);
    if (r >= 100) { Parts.emit('ripple', x, this.floorY(f) - 8, 1, { size: r * 0.35, life: 0.6 }); Bus.emit('noiseMade', { x, f, r, src }); }
  }
  packCount() { let n = 0; for (const k in this.pack.items) n += this.pack.items[k]; return n; }
  /* Give an item to whoever should hold it: the backpack on a sortie, the shelf at home. */
  give(item, n, s) {
    n = n || 1;
    if (this.L.home) { Run.add(this.run, item, n); Bus.emit('itemPickup', { item, n, s }); return n; }
    const room = this.pack.cap - this.packCount(), k = Math.max(0, Math.min(n, room));
    if (k > 0) { this.pack.items[item] = (this.pack.items[item] || 0) + k; Bus.emit('itemPickup', { item, n: k, s }); }
    return k;
  }
  footstep(s, k) {
    const fl = this.L.floors[s.f], surf = s.waterIn ? 'water' : (this.run.weather === 'snow' && this.L.site && this.L.bg === 'open') ? 'snow' : fl.surf;
    let r = (s.crouch ? CFG.noise.sneak : s.sprint ? CFG.noise.run : CFG.noise.walk) * s.noiseMul() * k;
    if (s.waterIn) r += CFG.noise.water; if (this.o.cart) r *= 1.5;
    if (this.night) this.noise(s.x, s.f, r, s);
    Snd.sfx('step', { surf, v: s.crouch ? 0.35 : s.sprint ? 1 : 0.65 });
    if (this.tension > 0.5) Input.haptic(8);
    if (s.sprint || s.waterIn) Parts.emit(s.waterIn ? 'drop' : 'dust', s.x, this.floorY(s.f) - 2, 2, { sx: 8 });
    else if (!s.crouch && this.L.site && FX.f() < 0.5) Parts.emit('puff', s.x - s.face * 4, this.floorY(s.f) - 2, 1, { vy: 10 });
    if (s.waterIn) Parts.emit('ripple', s.x, this.floorY(s.f) - 6, 1, { size: 18, life: 0.6 });
    Polish.footprint(this, s);
  }
  /* --- one survivor, one step. inp = { mx, my, held, press, ai } --- */
  stepSurvivor(s, inp, dt) {
    if (s.down || s.carriedBy || s.stun > 0) { s.vx = 0; return; }
    const P = inp.press, Hd = inp.held;
    if (s.hidden) { s.vx = 0; if (P.interact || P.crouch || P.jump || Math.abs(inp.mx) > 0.6) { s.hidden.occ = null; s.hidden = null; Snd.sfx('door', {}); } return; }
    if (s.sleeping) { s.vx = 0; if (P.interact || Math.abs(inp.mx) > 0.5) this.wake(s); return; }
    if (s.busy) {
      const b = s.busy, keep = Hd.interact || b.auto || Save.s.holdToggle || inp.ai;
      if (!keep || Math.abs(inp.mx) > 0.6) { s.busy = null; }
      else {
        b.t += dt; b.nt -= dt;
        if (b.nt <= 0) { b.nt = 0.45; if (b.noise) this.noise(s.x, s.f, b.noise * (s.crouch ? 0.5 : 1) * s.noiseMul(), s); if (b.sfx) Snd.sfx(b.sfx, { v: 0.6 }); }
        if (b.t >= b.dur) { s.busy = null; b.fn(); }
        s.vx = 0; return;
      }
    }
    if (inp.ai) s.crouch = !!Hd.crouch;
    else if (Save.s.holdToggle || Input.last === 'touch') { if (P.crouch) s.crouch = !s.crouch; }
    else s.crouch = !!Hd.crouch;
    const mx = Math.abs(inp.mx) < 0.15 ? 0 : clamp(inp.mx, -1, 1);
    s.sprint = !!Hd.sprint && !s.crouch && s.fatigue > 5 && Math.abs(mx) > 0.3 && !s.cl;
    s.waterIn = false; for (const z of this.L.water) if (z.f === s.f && s.x > z.x0 && s.x < z.x1 && !s.cl) s.waterIn = true;
    const spd = CFG.walk * s.speedMul() * (s.crouch ? CFG.sneakMul : s.sprint ? CFG.runMul : 1) * (this.run.mods.snow && this.L.site ? 0.92 : 1);
    const wasCl = !!s.cl;
    this.move(s, mx, inp.my, dt, spd);
    if (!s.cl && !wasCl && s.jz <= 0 && s.jv <= 0 && (P.jump || (P.up && !this.ladderNear(s)))) { s.jv = CFG.jumpV; s.jz = 0.1; Snd.sfx('whoosh', {}); }
    if (s.jz > 0 || s.jv > 0) { s.jz += s.jv * dt; s.jv -= CFG.gravity * dt; if (s.jz <= 0) { s.jz = 0; s.jv = 0; s.land = 1; Parts.emit('dust', s.x, this.floorY(s.f) - 2, 4, { sx: 12 }); Parts.emit('land', s.x, this.floorY(s.f) - 1, 1, { size: 14 }); this.footstep(s, 1.25); } }
    if (!s.cl && s.jz <= 0 && Math.abs(s.vx) > 5) {
      s.ph += Math.abs(s.vx) * dt * 0.17 * (s.crouch ? 1.5 : 1); s.stepAcc += Math.abs(s.vx) * dt;
      if (s.stepAcc >= CFG.stepDist) { s.stepAcc = 0; this.footstep(s, 1); }
      // passive floor traps: squeaky boards unless you jump or creep
      for (const o of this.L.objs) if (o.type === 'squeak' && o.f === s.f && Math.abs(o.x - s.x) < 8 && this.t - (o.last || -9) > 1.2 && !s.crouch) { o.last = this.t; Snd.sfx('squeak'); this.noise(o.x, o.f, 150, s); Floaters.add('creak!', o.x, this.floorY(o.f) - 20, {}); }
    }
    if (P.light && this.night) { if (this.battery > 0 || s.light) { s.light = !s.light; Snd.sfx('tick', { v: 2 }); } else Floaters.add('The battery is flat.', s.x, this.floorY(s.f) - 60, {}); }
    if (P.use) this.useTool(s);
    if (P.interact) this.interact(s);
  }
  wake(s) { s.sleeping = false; if (s.bed) { s.bed.occ = null; s.bed = null; } }
  interact(s) {
    const a = this.bestAct(s); if (!a) return;
    if (a.dis) { Floaters.add(a.dis, s.x, this.entY(s) - 62, {}); Snd.sfx('deny'); return; }
    if (a.hold) { s.busy = { t: 0, dur: a.hold, fn: a.fn, noise: a.noise || 0, nt: 0, label: a.label, sfx: a.sfx, auto: !!a.auto }; }
    else { s.act('interact', 0.3); a.fn(); }
  }
  /* The nearest thing this survivor could act on, with its label for the prompt. */
  bestAct(s) {
    if (s.cl || s.down || s.hidden || s.sleeping) return null;
    let best = null, bd = 1e9;
    const consider = (a, x, y) => { if (!a) return; const d = Math.abs(x - s.x) - (a.pri || 0); if (d < bd) { bd = d; a.x = x; a.y = y; best = a; } };
    const fy = this.floorY(s.f);
    for (const o of this.L.objs) {
      if (o.f !== s.f) continue; const def = OBJDEF[o.type]; if (!def || !def.act) continue;
      if (Math.abs(o.x - s.x) > (def.r || CFG.interactR)) continue;
      if (this.L.home && this.run.broken && !def.always) { const rm = roomOf(o.x, o.f); if (rm && this.run.broken.rooms[rm.id]) continue; }
      consider(def.act(this, s, o), o.x, fy - 44);
    }
    for (const b of this.L.blockers) { if (b.f !== s.f || b.open || Math.abs(b.x - s.x) > 26) continue; consider(blockerAct(this, s, b), b.x, fy - 50); }
    for (const n of this.npcs) { if (n.f !== s.f || Math.abs(n.x - s.x) > 36 || n.gone) continue; consider(npcAct(this, s, n), n.x, fy - 56); }
    for (const p of this.surv) { if (p === s || p.f !== s.f || Math.abs(p.x - s.x) > 30) continue; if (p.down && !p.carriedBy && !s.carry) consider({ label: 'Carry ' + p.name, hold: 1.6, pri: 20, fn: () => { s.carry = p; p.carriedBy = s; Snd.sfx('chime'); Bus.emit('carry', { s, p }); } }, p.x, fy - 30); }
    if (this.extraActs) this.extraActs(s, consider, fy);
    return best;
  }
  useTool(s) {
    if (s.cool > 0) return;
    if (!this.night && this.L.home) { s.gestureT = 1; s.cool = 1.2; for (const p of this.surv) if (p !== s && p.f === s.f && Math.abs(p.x - s.x) < 90 && Run.once(this.run, 'wave' + p.id)) { p.addMorale(1.5, true); p.gestureT = 0.8; } return; }
    if (this.noTools) { Floaters.add('Empty hands tonight.', s.x, this.entY(s) - 60, {}); return; }
    const near = this.npcs.find(n => n.T.hostile && n.f === s.f && Math.abs(n.x - s.x) < 48 && (n.x - s.x) * s.face > -10 && n.st !== 'stun');
    const hasMelee = s.id === 'pavel' || this.pack.items.pan > 0 || (this.L.home && Run.count(this.run, 'pan') > 0) || this.o.pans;
    const th = ['bottle', 'clatter', 'brick', 'firecracker', 'pebble'].find(k => (this.pack.items[k] || 0) > 0 || (this.L.home && this.night && Run.count(this.run, k) > 0));
    if (near && hasMelee) {
      s.hasPan = s.id !== 'pavel'; s.act('use', 0.42); s.cool = 0.85; Snd.sfx('pan'); this.noise(s.x, s.f, CFG.noise.swing, s);
      if (near.type === 'dog') { near.st = 'flee'; near.wait = 3; near.say('dog'); }
      else { near.stunN++; near.st = 'stun'; near.wait = 1.7 / near.stunN; near.x += s.face * 26 / near.stunN; near.nerve -= 1; near.aw = 0; }
      this.impact(near.x, this.floorY(near.f) - 28, 0.5); Bus.emit('swing', { s, n: near });
    } else if (th) {
      if (this.pack.items[th] > 0) this.pack.items[th]--; else Run.add(this.run, th, -1);
      s.act('throw', 0.5); s.cool = 0.8; Snd.sfx('whoosh');
      const p = this.proj.find(q => !q.a); if (p) { p.a = true; p.x = s.x + s.face * 8; p.y = this.entY(s) - 34; p.vx = s.face * 235; p.vy = -190; p.f = s.f; p.kind = th; p.by = s; }
    } else if (hasMelee) { s.hasPan = s.id !== 'pavel'; s.act('use', 0.42); s.cool = 0.85; Snd.sfx('pan'); this.noise(s.x, s.f, CFG.noise.swing, s); Bus.emit('swing', { s, n: null }); }
    else Floaters.add('Nothing to throw.', s.x, this.entY(s) - 60, {});
  }
  /* Consistent damage feedback: flash + dust puff + camera punch + thud + hit-stop. */
  impact(x, y, k) {
    Parts.emit('puff', x, y, 6, { sx: 14, sy: 14 }); Parts.emit('dust', x, y, 6, { sx: 16 });
    this.flash = 0.12; this.hitStop = CFG.hitStop; Snd.sfx('hit');
    if (!Save.s.reduce) { this.cam.punch = 6 * k; this.cam.shake = Math.max(this.cam.shake, 5 * k); } else this.cam.shake = Math.max(this.cam.shake, 1.2 * k);
    Input.rumble(0.6 * k, 140); Input.haptic(30);
  }
  shake(k, rumble) { this.cam.shake = Math.max(this.cam.shake, Save.s.reduce ? k * 0.25 : k); if (rumble) Input.rumble(rumble, 400); }
  closeCall(s, label) {
    if (this.ccCool > 0) return; this.ccCool = 8; this.closeCalls++;
    this.slowT = Save.s.reduce ? 0.35 : 0.95; s.flare = 1; Bus.emit('closeCall', { s }); this.mark(5 + this.closeCalls, label || 'A close call');
  }
  /* Replay recorder: ring buffer of positions, snapshotted at the run's most intense moment. */
  record(dt) {
    this.recT -= dt; if (this.recT > 0) return; this.recT = 1 / CFG.replayHz;
    const fr = { s: [], n: [], cx: this.cam.x, cy: this.cam.y };
    for (const s of this.surv) fr.s.push({ id: s.id, x: s.x, y: this.entY(s), face: s.face, ph: s.ph, anim: s.anim, hid: !!s.hidden });
    for (const n of this.npcs) if (!n.gone) fr.n.push({ type: n.type, x: n.x, y: this.entY(n), face: n.face, ph: n.ph, st: n.st });
    this.rec.push(fr); if (this.rec.length > CFG.replaySecs * CFG.replayHz) this.rec.shift();
  }
  mark(score, label) {
    if (score <= this.replayScore || this.rec.length < 8) return; this.replayScore = score;
    this.replay = { frames: this.rec.slice(), label, floors: this.L.floors.map(f => ({ y: f.y, x0: f.x0, x1: f.x1 })), zoom: this.cam.zoom };
  }
  updateProjectiles(dt) {
    for (const p of this.proj) {
      if (!p.a) continue;
      p.vy += 620 * dt; const nx = p.x + p.vx * dt; if (this.wallBetween(p.f, p.x, nx)) p.vx *= -0.3; else p.x = nx; p.y += p.vy * dt;
      const fy = this.floorY(p.f), fl = this.L.floors[p.f];
      if (p.y >= fy - 2 || p.x < fl.x0 || p.x > fl.x1) {
        p.a = false; p.x = clamp(p.x, fl.x0 + 4, fl.x1 - 4);
        Snd.sfx(p.kind === 'bottle' ? 'shatter' : p.kind === 'clatter' ? 'clatter' : p.kind === 'firecracker' ? 'boom' : 'thud'); if (p.kind === 'firecracker') Parts.emit('spark', p.x, fy - 6, 14, {}); if (p.kind === 'clatter') { Snd.sfx('clatter', { v: 0.7 }); this.o.rattle = { x: p.x, f: p.f, t: 2.2 }; } Parts.emit('spark', p.x, fy - 3, 8, {}); Parts.emit('dust', p.x, fy - 3, 5, { sx: 10 });
        let drew = 0; for (const n of this.npcs) { const before = n.st; n.hear(this, p.x, p.f, CFG.noise.throw * (p.kind === 'clatter' ? 1.7 : p.kind === 'firecracker' ? 2.4 : p.kind === 'pebble' ? 0.7 : 1), 'throw'); if (before !== n.st && n.st === 'investigate') drew++; }
        this.noiseLvl = Math.max(this.noiseLvl, CFG.noise.throw);
        if (drew) { this.distractions++; Bus.emit('distraction', { s: p.by }); }
      }
    }
  }
  /* Site hazards: sniper corridors, the collapsing platform, tower gusts. All telegraphed first. */
  updateHazards(dt) {
    const L = this.L;
    for (const z of L.snipers) {
      z.t += dt; const cyc = z.t % z.period, danger = cyc < z.period - z.safe; z.danger = danger; z.left = danger ? 0 : z.period - cyc;
      let tx = lerp(z.x0, z.x1, 0.5 + 0.5 * Math.sin(z.t * 1.25)), any = false;
      for (const s of this.surv) {
        const inside = !s.hidden && !s.down && this.entF(s) === z.f && s.x > z.x0 && s.x < z.x1;
        if (inside && danger) { any = true; tx = s.x; s.snT = (s.snT || 0) + dt; if (s.snT > HAZARDS.sniper.warn * this.diff.warn) { s.snT = 0; if (s.damage(HAZARDS.sniper.dmg * this.diff.dmg, 'sniper')) { this.impact(s.x, this.entY(s) - 26, 1); s.x += (s.x < (z.x0 + z.x1) / 2 ? -1 : 1) * 26; Bus.emit('hazardImpact', { type: 'sniper', s }); this.mark(7, 'The corridor'); } } }
        else s.snT = 0;
      }
      z.rx += (tx - z.rx) * Math.min(1, dt * (any ? 9 : 3)); z.lock = any;
      const near = this.surv.some(s => Math.abs(s.x - (z.x0 + z.x1) / 2) < 420);
      if (danger && near) { z.tick = (z.tick || 0) - dt; if (z.tick <= 0) { z.tick = any ? 0.34 : 0.7; Snd.sfx('tick', { v: any ? 2.5 : 1.2 }); } }
      if (!danger && z.was) { Snd.sfx('drip'); } z.was = danger;
    }
    const c = L.collapse;
    if (c && c.active && !c.done) {
      if (c.warn > 0) { c.warn -= dt; this.shake(1.5); if (Math.random() < dt * 14) Parts.emit('dust', FX.r(this.cam.x - 400, this.cam.x + 400), 300, 2, {}); }
      else {
        c.x -= c.speed * dt; this.shake(2.2);
        if (Math.random() < dt * 30) { Parts.emit('dust', c.x + FX.r(0, 60), this.floorY(L.floors.length - 1) - 20, 3, { sx: 30 }); Parts.emit('drop', c.x + FX.r(0, 80), this.floorY(L.floors.length - 1) - 4, 2, {}); }
        for (const s of this.surv) { if (s.x > c.x - 6 && this.entF(s) === L.floors.length - 1) { if (s.damage(HAZARDS.collapse.dmg * this.diff.dmg, 'collapse')) { this.impact(s.x, this.entY(s) - 24, 1); Snd.sfx('splash'); Bus.emit('hazardImpact', { type: 'collapse', s }); this.mark(8, 'The platform'); } s.x = Math.min(s.x, c.x - 30); s.cl = null; } }
        for (const n of this.npcs) if (n.x > c.x && n.f === L.floors.length - 1) n.x = c.x - 20;
        if (c.x < 360) { c.done = true; Bus.emit('setpieceDone', { id: 'platform' }); }
      }
    }
    const g = L.gust;
    if (g) {
      g.t -= dt;
      if (g.phase === 'calm' && g.t <= 0) { g.phase = 'warn'; g.t = g.warn; Snd.sfx('rise', { d: g.warn }); Bus.emit('hazardWarning', { type: 'draft', text: 'A gust is coming. Hold still on the ladder.' }); }
      else if (g.phase === 'warn' && g.t <= 0) { g.phase = 'blow'; g.t = g.dur; Snd.sfx('gust', { d: g.dur }); }
      else if (g.phase === 'blow') {
        Parts.emit('dust', this.cam.x - 480, FX.r(0, 500), 4, { vx: 500, screen: false });
        for (const s of this.surv) if (s.cl && s.climbing && !s.cl.lad.stairs) { const l = s.cl.lad; s.cl = null; s.f = l.fb; s.x = l.xb; if (s.damage(10 * this.diff.dmg, 'gust')) { this.impact(s.x, this.entY(s) - 20, 0.7); Bus.emit('hazardImpact', { type: 'draft', s }); } }
        if (g.t <= 0) { g.phase = 'calm'; g.t = g.period * (0.8 + Math.random() * 0.5); }
      }
    }
  }
  update(dt, ctl) {
    // remember last positions for interpolated rendering
    this.cam.px = this.cam.x; this.cam.py = this.cam.y;
    for (const s of this.surv) { s.px = s.x; s.pyy = this.entY(s); }
    for (const n of this.npcs) { n.px = n.x; n.pyy = this.entY(n); }
    if (this.hitStop > 0) { this.hitStop -= dt; return; }
    if (this.slowT > 0) { this.slowT -= dt; dt *= 0.35; }
    this.t += dt; this.ccCool -= dt;
    if (this.flash > 0) this.flash -= dt;
    this.noiseLvl = Math.max(0, this.noiseLvl - dt * 120);
    for (const s of this.surv) {
      const inp = ctl(s); if (inp) this.stepSurvivor(s, inp, dt);
      if (s.carry) { const p = s.carry; p.x = s.x - s.face * 6; p.f = s.f; p.cl = null; p.jz = 0; if (s.down) { p.carriedBy = null; s.carry = null; } }
      if (s.health <= 0 && !s.down && this.L.site) { s.down = true; s.light = false; Bus.emit('survivorDown', { s, sortie: true }); this.mark(9, s.name + ' goes down'); }
      Rig.update(s, dt, this.t);
      if (this.night && s.cold < 30 && Math.random() < dt * 0.8) Parts.emit('breath', s.x + s.face * 6, this.entY(s) - 38, 1, { dir: s.face });
    }
    // flashlight battery
    let lit = 0; for (const s of this.surv) if (s.light) lit++;
    if (lit && this.battery != null) { this.battery = Math.max(0, this.battery - CFG.light.batteryDrain * (this.run.mods.blackout ? 1.5 : 1) * lit * dt); if (this.battery <= 0) { for (const s of this.surv) s.light = false; Snd.sfx('tick'); Floaters.add('The light dies.', this.surv[0].x, this.entY(this.surv[0]) - 60, {}); } }
    let ten = 0;
    for (let i = this.npcs.length - 1; i >= 0; i--) { const n = this.npcs[i]; n.update(this, dt); if (n.gone) { this.npcs.splice(i, 1); continue; } if (n.T.hostile) ten = Math.max(ten, n.st === 'chase' || n.st === 'hostile' ? 1 : n.aw * 0.8); }
    this.tension = num(this.tension) + (ten - num(this.tension)) * Math.min(1, dt * 2);
    this.updateProjectiles(dt); this.updateHazards(dt); this.record(dt);
    const rt = this.o.rattle; if (rt) { const k = Math.floor(rt.t / 0.55); rt.t -= dt; if (Math.floor(rt.t / 0.55) !== k && rt.t > 0) { Snd.sfx('clatter', { v: 0.5 }); for (const n of this.npcs) n.hear(this, rt.x, rt.f, CFG.noise.throw * 0.9, 'throw'); Parts.emit('dust', rt.x, this.floorY(rt.f) - 3, 2, { sx: 6 }); } if (rt.t <= 0) this.o.rattle = null; }
    // camera
    const c = this.cam; c.shake = Math.max(0, c.shake - dt * 14); c.punch = Math.max(0, c.punch - dt * 40);
    if (this.L.site) {
      let ax = 0, ay = 0, k = 0; for (const s of this.surv) { if (s.down && !this.focusDown) continue; ax += s.x + s.face * 60; ay += this.entY(s); k++; }
      if (k) { const tx = clamp(ax / k, W / 2, Math.max(W / 2, this.L.w - W / 2)), ty = Math.min(270, ay / k - 30); c.x += (tx - c.x) * Math.min(1, dt * 3.2); c.y += (ty - c.y) * Math.min(1, dt * 3); }
    }
  }
}

/* --- Blockers: doors, locked doors, child-sized gaps, the stuck shutter --- */
function blockerAct(w, s, b) {
  if (b.home) return null;
  if (b.type === 'door') {
    if (!b.locked) return { label: 'Open the door', fn() { b.open = true; Snd.sfx('door'); w.noise(b.x, b.f, CFG.noise.door * (s.crouch ? 0.5 : 1), s); } };
    if (s.id === 'ines') return { label: 'Pick the lock', hold: 1.8, sfx: 'tick', fn() { b.open = true; b.locked = false; Snd.sfx('unlock'); Bus.emit('lockpicked', { s }); } };
    return { label: 'Force the door', hold: s.st.str >= 4 ? 1.6 : 3.2, noise: CFG.noise.pry, sfx: 'thud', fn() { b.open = true; b.locked = false; Snd.sfx('door'); w.impact(b.x, w.floorY(b.f) - 30, 0.4); } };
  }
  if (b.type === 'gap') return s.id === 'toby' ? { label: 'Squeeze through', hold: 0.6, fn() { s.x = b.x + (s.x < b.x ? 12 : -12); Snd.sfx('whoosh'); } } : { label: 'A gap. Too small for you.', dis: 'Only a child would fit.', fn() {} };
  if (b.type === 'shutter') return { label: 'Crank the shutter (' + Math.round(b.prog * 100) + '%)', hold: 1.1, noise: 190, sfx: 'crank', fn() { b.prog = Math.min(1, b.prog + (s.st.str >= 4 ? 0.34 : 0.25)); Snd.sfx('creak'); if (b.prog >= 1) { b.open = true; Snd.sfx('door'); Bus.emit('setpieceDone', { id: 'shutter' }); } } };
  return null;
}

/* --- Interactive objects. act(world, survivor, obj) returns { label, hold, noise, fn, dis } or null. --- */
function note(t, d) { Bus.emit('note', { text: t, dur: d || 4.5 }); }
function pickPatient(w, s) {
  let best = null, bs = 0; const run = w.run;
  for (const p of w.surv) {
    if (!p.present || p.down) continue; let sc = 0, need = null;
    if (p.wound && Run.count(run, 'bandage') > 0) { sc = 3; need = 'bandage'; }
    if (p.sick) { const m = ['antibio', 'meds', 'syrup'].find(i => Run.count(run, i) > 0); if (m) { sc = 4; need = m; } }
    if (sc > bs || (sc === bs && sc && p === s)) { bs = sc; best = { p, need }; }
  }
  return best;
}
function treat(w, healer, p, need) {
  const run = w.run; Run.add(run, need, -1);
  const bonus = (run.up.medcorner ? 8 : 0) + (healer.id === 'marta' ? 8 : 0) + healer.st.med * 2;
  if (need === 'bandage') { p.wound = false; p.health = clamp(p.health + 8 + bonus, 0, 100); }
  else if (need === 'syrup') { if (w.rng.chance(0.55 + healer.st.med * 0.06)) p.sick = false; p.health = clamp(p.health + 5 + bonus * 0.5, 0, 100); }
  else { p.sick = false; p.health = clamp(p.health + 12 + bonus, 0, 100); }
  p.crit = 0; p.addMorale(5); if (p !== healer) { Run.trust(run, healer, p, 6); healer.addMorale(2, true); }
  Snd.sfx('chime'); Bus.emit('itemUsed', { item: need, s: healer, on: p });
}
function eatBest(w, s) {
  const run = w.run, inPack = !w.L.home, src = inPack ? w.pack.items : run.stock;
  const order = [['soup', 46], ['can', 42], ['bread', 34], ['jam', 18], ['egg', 30], ['raw', CFG.needs.mealRaw]];
  for (const [id, v] of order) { if ((src[id] || 0) > 0) { src[id]--; s.hunger = clamp(s.hunger + v, 0, 100); s.act('eat', 1.2); Snd.sfx(id === 'can' ? 'can' : 'sip'); if (id === 'raw') s.addMorale(-2, true); Bus.emit('itemUsed', { item: id, s }); return id; } }
  return null;
}
const OBJDEF = {
  exit: { r: 34, always: true, act(w, s) { const g = w.o.canLeave ? w.o.canLeave(w) : true; return { label: g === true ? 'Head home' : g, dis: g === true ? null : 'Not yet.', hold: 0.9, fn() { Bus.emit('sortieExit', { s }); } }; } },
  cont: { r: 26, act(w, s, o) {
    if (!o.items.length) return null;
    return { label: w.packCount() >= w.pack.cap ? 'Search (pack is full)' : 'Search', hold: clamp(1.25 - s.st.luck * 0.08, 0.7, 1.3), noise: CFG.noise.loot, sfx: 'page', fn() {
      let got = 0; const keep = [];
      for (const it of o.items) { if (it === 'musicbox') { w.run.musicbox = true; note('A music box, wrapped in a tea towel. It still turns.'); Bus.emit('itemPickup', { item: it, n: 1, s }); got++; continue; } if (w.give(it, 1, s)) { got++; Floaters.add('+ ' + ITEMS[it].n, o.x, w.floorY(o.f) - 50 - got * 12, {}); } else keep.push(it); }
      if ((s.id === 'ravi' || s.wears('luck')) && got && w.rng.chance(0.3) && w.give('parts', 1, s)) Floaters.add('+ Parts (lucky find)', o.x, w.floorY(o.f) - 50 - (got + 1) * 12, {});
      o.items = keep; if (got) { Parts.emit('glint', o.x, w.floorY(o.f) - 30, 3, { sx: 16, sy: 10 }); w.looted = (w.looted || 0) + got; } else Floaters.add('No room in the pack.', o.x, w.floorY(o.f) - 50, {});
      if (o.trigger === 'collapse' && w.L.collapse && !w.L.collapse.active) { const c = w.L.collapse; c.active = true; c.warn = HAZARDS.collapse.warn * w.diff.warn; Snd.sfx('rumble', { d: c.warn }); Bus.emit('hazardWarning', { type: 'collapse', text: 'The platform is giving way. Run for the stairs!' }); }
    } };
  } },
  hide: { r: 24, always: true, act(w, s, o) { if (o.occ && o.occ !== s) return { label: 'Occupied', dis: 'No room.', fn() {} }; if (s.carry) return null; return { label: o.kind === 'wardrobe' ? 'Hide in the wardrobe' : o.kind === 'coats' ? 'Hide among the coats' : o.kind === 'pillar' ? 'Duck behind the pillar' : o.kind === 'stairs' ? 'Hide under the stairs' : 'Hide behind the rubble', fn() { s.hidden = o; o.occ = s; s.x = o.x; s.light = false; s.crouch = false; Snd.sfx('door', {}); Bus.emit('hidden', { s }); } }; } },
  squeak: {}, brick: { r: 20, act(w, s, o) { return { label: 'Take the loose brick', fn() { if (w.give('brick', 1, s)) { o.type = 'gone'; Snd.sfx('thud', { v: 0.4 }); } else Floaters.add('No room in the pack.', o.x, w.floorY(o.f) - 40, {}); } }; } },
  crate: { r: 24, act(w, s, o) { return { label: 'Take the supply crate', hold: 0.8, noise: 60, fn() { if (w.give('crate', 1, s)) { o.type = 'gone'; w.crates = (w.crates || 0) + 1; } else Floaters.add('No room in the pack.', o.x, w.floorY(o.f) - 40, {}); } }; } },
  keep: { r: 24, act(w, s, o) { return { label: 'Pick up the keepsake', hold: 0.6, fn() { o.type = 'gone'; Bus.emit('keepsakeFound', { idx: o.idx, s }); } }; } },
  goal: { r: 28, act(w, s, o) { if (w.goalDone) return null; return { label: o.bell ? 'Tie off the bell rope' : 'Take the ledger page', hold: 1.2, fn() { w.goalDone = true; Snd.sfx(o.bell ? 'bell' : 'page'); Bus.emit('goalReached', { s }); } }; } },
  signal: { r: 30, act(w, s, o) { if (o.done) return null; return { label: 'The signal lamp', fn() { Bus.emit('signalChoice', { s, o }); } }; } },
  tuner: { r: 30, act(w, s, o) { if (o.done) return null; return { label: 'Tune the radio dial', fn() { Bus.emit('openTuner', { s, o }); } }; } },
  gone: {},

  /* ---- home objects ---- */
  bed: { r: 26, act(w, s, o) { if (o.occ && o.occ !== s) return null; return { label: 'Rest', fn() { s.sleeping = true; s.x = o.x; o.occ = s; s.bed = o; Snd.sfx('creak'); } }; } },
  medshelf: { r: 26, act(w, s) { const b = pickPatient(w, s); if (!b) return { label: 'First-aid shelf', fn() { note(w.surv.some(p => p.sick || p.wound) ? 'Nothing here that would help. Bandages for wounds, medicine for fever.' : 'Everyone is in one piece. Marta would like it noted.'); } }; return { label: 'Treat ' + (b.p === s ? 'yourself' : b.p.name) + ' (' + ITEMS[b.need].n + ')', hold: clamp(2.2 - s.st.med * 0.25, 0.9, 2.2), sfx: 'snip', fn() { treat(w, s, b.p, b.need); } }; } },
  plant: { r: 24, act(w, s) { const run = w.run; if (run.daily.plant) return { label: 'The window plant', fn() { note(run.plant >= 1 ? 'It has flowered. Nobody says anything, in case it hears.' : 'Watered. It leans toward the boarded window anyway.'); } }; return { label: 'Water the plant', dis: Run.count(run, 'water') > 0 || Run.count(run, 'dirty') > 0 ? null : 'No water to spare.', fn() { Run.add(run, Run.count(run, 'dirty') > 0 ? 'dirty' : 'water', -1); run.daily.plant = true; run.plantWater = (run.plantWater || 0) + 1; Snd.sfx('drip'); s.addMorale(2); note('A cup for the plant. It is, after all, one of us.'); } }; } },
  sewing: { r: 24, act(w, s) { const run = w.run; if (run.daily.sew) return null; return { label: 'Mend clothes', dis: Run.count(run, 'cloth') > 0 ? null : 'No cloth.', hold: 2.4, sfx: 'snip', fn() { Run.add(run, 'cloth', -1); run.daily.sew = true; s.coldRes = Math.min(12, s.coldRes + 4); const o2 = w.surv.find(p => p !== s && p.present && Math.abs(p.x - s.x) < 160 && p.f === s.f); if (o2) { o2.coldRes = Math.min(12, o2.coldRes + 4); Run.trust(run, s, o2, 5); o2.addMorale(3); note(s.name + ' patches ' + o2.name + "'s sleeve. Neither of them says much. It is a good quiet."); } else note('A patched elbow. Slightly warmer, slightly more dignified.'); s.addMorale(3); } }; } },
  photo: { r: 22, act(w, s) { const run = w.run, key = 'photo' + s.id; if (run.daily[key]) return null; return { label: 'Hold the old photograph', fn() { run.daily[key] = true; s.addMorale(s.morale < 60 ? 9 : 4); s.flare = 0.6; Snd.sfx('page'); Bus.emit('memory', { s, kind: 'photo' }); } }; } },
  window: { r: 18, act(w, s, o) { if (!w.o.drafts || o.boarded) return null; return { label: 'Board the window', dis: Run.count(w.run, 'wood') > 0 ? null : 'No wood.', hold: 1.8, noise: 90, sfx: 'thud', fn() { Run.add(w.run, 'wood', -1); o.boarded = true; Snd.sfx('door'); } }; } },
  drawing: { r: 26, act(w, s) { const run = w.run; return { label: "Look at Toby's drawing", fn() { const rd = RIDDLES[0]; if (!run.flags.clue0) { run.flags.clue0 = true; Run.log(run, rd.clue); } note('A crayon stairwell: four windows, three stairs, three spoons. And everyone, holding hands.', 6); if (s.id === 'toby' && Run.once(run, 'tobydraw')) { run.hint = w.rng.pick(run.sites); note('Toby adds an arrow, a door, and a small sun: "' + LOCS[run.hint].n + '". He seems sure.', 6); Bus.emit('tobyDraws', { s }); } } }; } },
  radio: { r: 26, act(w, s) { return { label: 'Scan the radio dial', hold: 1.3, sfx: 'crank', fn() { Bus.emit('radioScan', { s }); } }; } },
  cards: { r: 28, act(w, s) { const run = w.run; if (run.daily.cards) return null; return { label: 'Deal the cards', hold: 1.6, sfx: 'page', fn() { run.daily.cards = true; Bus.emit('cardGame', { s }); } }; } },
  musicbox: { r: 22, act(w, s, o) { const run = w.run; if (run.daily.box) return null; return { label: 'Wind the music box', hold: 1.2, sfx: 'crank', fn() { run.daily.box = true; o.playT = 4; Snd.sfx('box'); Snd.duck(3.2); for (const p of w.surv) if (Math.abs(p.f - s.f) <= 1 && p.present) { p.addMorale(7); Parts.emit('ripple', p.x, w.entY(p) - 24, 1, { col: p.hueC() }); } Bus.emit('musicBox', { s }); } }; } },
  candle: { r: 20, act(w, s, o) { const run = w.run; if (w.o.lastCandle) return candleAct(w, s, o); if (run.candleLit) return { label: 'Snuff the candle', fn() { run.candleLit = false; Snd.sfx('sip'); } }; return { label: 'Light the candle', dis: Run.count(run, 'matches') > 0 && Run.count(run, 'candle') > 0 ? null : (Run.count(run, 'candle') > 0 ? 'No matches.' : 'No candle left.'), fn() { Run.add(run, 'matches', -1); run.candleLit = true; Snd.sfx('match'); for (const p of w.surv) if (p.f === s.f) p.addMorale(2, true); Bus.emit('candleLit', { s }); } }; } },
  drawer: { r: 22, act(w, s) { const run = w.run; if (run.flags.drawer) return null; return { label: 'Try the locked drawer', fn() { Bus.emit('openCode', { idx: 0, s }); } }; } },
  safe: { r: 22, act(w, s) { const run = w.run; if (run.flags.safe) return null; return { label: 'Try the old safe', fn() { if (!run.flags.clue1) { run.flags.clue1 = true; Run.log(run, RIDDLES[1].clue); } Bus.emit('openCode', { idx: 1, s }); } }; } },
  painting: { r: 22, act(w, s, o) { return { label: 'Look at the painting', fn() { o.wink = 1.2; note('A stern lady in a frame. For a moment you are certain she winked.'); if (Run.once(w.run, 'paint')) s.addMorale(1.5, true); } }; } },
  jars: { r: 20, act(w, s) { const run = w.run; if (!run.flags.preserves && Run.avgMorale(run) >= 68) return { label: 'Open the plum preserves', fn() { run.flags.preserves = true; Run.add(run, 'can', 2); Run.allMorale(run, 5); Snd.sfx('can'); note('Label: "for a good day". Everyone agrees that this is one.'); } }; return { label: 'Examine the preserves', fn() { note(run.flags.preserves ? 'An empty jar, washed and kept. For next year.' : 'Plum preserves. The label reads: "for a good day".'); } }; } },
  buttons: { r: 20, act() { return { label: 'Examine the jar of buttons', fn() { note('Four hundred and six buttons. Legal tender at the card table.'); } }; } },
  fridge: { r: 22, act(w, s, o) { return { label: 'Open the fridge', fn() { Snd.sfx('door', {}); o.n = (o.n || 0) + 1; if (o.n >= 2) { o.dance = 3.5; note('Inside, a very small sandwich is dancing. You close the door politely.'); Bus.emit('easter', { id: 'sandwich' }); } else note('Dark, warm, and empty. The light has not worked since autumn.'); } }; } },
  stove: { r: 26, act(w, s) { const run = w.run; if (run.gas) return { label: 'Fix the gas leak', dis: (s.id === 'dov' || s.id === 'ravi' || Run.count(run, 'parts') > 0) ? null : 'Needs parts.', hold: s.id === 'dov' || s.id === 'ravi' ? 1.8 : 3, sfx: 'tick', fn() { if (!(s.id === 'dov' || s.id === 'ravi')) Run.add(run, 'parts', -1); run.gas = null; Snd.sfx('unlock'); note('The hiss stops. Everyone breathes out, carefully.'); Bus.emit('hazardFixed', { type: 'gas', s }); } }; return { label: 'Use the stove', fn() { Bus.emit('openCraft', { at: 'stove', s }); } }; } },
  pantry: { r: 24, act(w, s) { if (w.o.stash) return stashAct(w, s, 'pantry'); if (s.hunger > 82) return { label: 'Check the shelves', fn() { Bus.emit('openJournal', { tab: 0 }); } }; return { label: 'Eat something', fn() { const got = eatBest(w, s); if (!got) note('The shelf is bare. ' + s.name + ' closes the cupboard gently.'); } }; } },
  workbench: { r: 26, act(w, s) { return { label: 'Use the workbench', fn() { Bus.emit('openCraft', { at: 'workbench', s }); } }; } },
  heater: { r: 24, act(w, s) { const run = w.run; if (w.o.heaterAct) return w.o.heaterAct(w, s); if (run.heaterOn) return { label: 'Bank the heater', fn() { run.heaterOn = false; Snd.sfx('tick'); } }; return { label: 'Light the heater', dis: Run.count(run, 'fuel') > 0 || Run.count(run, 'wood') > 1 ? null : 'No fuel or wood.', fn() { run.heaterOn = true; Snd.sfx('match'); note('The heater ticks awake. It will eat fuel (or wood) each night.'); } }; } },
  door: { r: 26, always: true, act(w, s) { if (w.o.doorAct) return w.o.doorAct(w, s); return null; } },
  mouse: { r: 22, always: true, act(w, s, o) { return { label: 'Read the tiny sign', fn() { note('A mouse with a cardboard sign. It reads: "' + (MOUSE_SIGNS[o.mood || 'calm']) + '"'); Snd.sfx('squeak', { v: 0.4 }); } }; } },
  barrel: { r: 24, always: true, act(w, s) { const run = w.run; if (run.flood > 0) return { label: 'Bail out the cellar', hold: 1.4, sfx: 'splash', fn() { run.flood = Math.max(0, run.flood - (s.st.str >= 4 ? 0.5 : 0.34)); if (run.flood <= 0.01) { run.flood = 0; note('The cellar is merely damp again. A victory, of a kind.'); Bus.emit('hazardFixed', { type: 'flood', s }); } } }; return { label: 'The rain barrel', fn() { note(run.up.raincatcher ? 'The barrel fills from the roof when it rains or snows.' : 'An empty barrel. A rain catcher on the roof would fill it.'); } }; } },
  filter: { r: 24, act(w, s, o) { const run = w.run; return { label: 'Filter rain water', dis: Run.count(run, 'dirty') > 0 ? null : 'No rain water.', hold: 1.3, sfx: 'drip', fn() { const n = Math.min(2, Run.count(run, 'dirty')); Run.add(run, 'dirty', -n); Run.add(run, 'water', n); o.drip = 2; Snd.sfx('drip'); Floaters.add('+ ' + n + ' Clean water', o.x, w.floorY(o.f) - 50, {}); } }; } },
  raincatcher: { r: 24, act(w, s) { return { label: 'The rain catcher', fn() { note('Tarpaulin and gutters. It fills the cellar barrel in rain or snow.'); } }; } },
  garden: { r: 24, act(w, s) { const run = w.run; if ((run.gardenT || 0) >= 3) return { label: 'Harvest the garden box', hold: 1, fn() { run.gardenT = 0; Run.add(run, 'herbs', 1); Run.add(run, 'raw', 2); Snd.sfx('pickup'); note('Two pale carrots and a fistful of thyme. Granny approves the thyme.'); } }; return { label: 'The garden box', fn() { note('Green things, taking their time. Ready in ' + (3 - (run.gardenT || 0)) + ' day(s).'); } }; } },
  coop: { r: 24, act(w, s) { const run = w.run; if ((run.coopT || 0) >= 2) return { label: 'Collect an egg', fn() { run.coopT = 0; Run.add(run, 'egg', 1); Snd.sfx('coo'); note('One egg. The pigeons regard you without resentment.'); } }; return { label: 'The pigeon coop', fn() { Snd.sfx('coo'); note('Soft, unhurried noises. Nothing to collect yet.'); } }; } },
  firebarrel: { r: 28, act(w, s) { const run = w.run; if (run.barrelLit) return { label: 'Warm your hands', hold: 1.5, fn() { s.cold = clamp(s.cold + 14, 0, 100); s.addMorale(2, true); } }; return { label: 'Light the fire barrel', dis: Run.count(run, 'wood') > 0 ? null : 'No wood.', fn() { Run.add(run, 'wood', -1); run.barrelLit = true; Snd.sfx('match'); note('Warmth on the roof. At night, light like this can be seen from the street.'); } }; } },
  fire: { r: 40, always: true, act(w, s, o) { const run = w.run; return { label: 'Douse the fire', dis: Run.count(run, 'water') + Run.count(run, 'dirty') > 0 ? null : 'No water!', hold: 1.0, sfx: 'sizzle', fn() { Run.add(run, Run.count(run, 'dirty') > 0 ? 'dirty' : 'water', -1); o.hp -= 1; Parts.emit('smoke', o.x, w.floorY(o.f) - 20, 10, { sx: 30 }); if (o.hp <= 0) { o.type = 'gone'; run.fire = null; note('Out. The wallpaper will never be the same, but it is still wallpaper.'); Bus.emit('hazardFixed', { type: 'fire', s }); } } }; } },
  rubble: { r: 40, always: true, act(w, s, o) { const run = w.run; return { label: 'Repair the room', dis: Run.count(run, 'wood') > 0 ? null : 'Needs wood.', hold: s.id === 'dov' ? 1.6 : 3, noise: 0, sfx: 'thud', fn() { Run.add(run, 'wood', -1); delete run.broken.rooms[o.room]; o.type = 'gone'; Snd.sfx('unlock'); Bus.emit('hazardFixed', { type: 'tremor', s }); note('Propped, swept, usable. Dov would call it "temporary". It will last years.'); } }; } },
  stairfix: { r: 30, always: true, act(w, s, o) { const run = w.run; return { label: 'Repair the stair', dis: Run.count(run, 'wood') > 1 ? null : 'Needs 2 wood.', hold: s.id === 'dov' ? 1.6 : 3, sfx: 'thud', fn() { Run.add(run, 'wood', -2); delete run.broken.ladders[o.lad.id]; o.lad.broken = false; o.type = 'gone'; for (const q of w.L.objs) if (q.type === 'stairfix' && q.lad === o.lad) q.type = 'gone'; Snd.sfx('unlock'); Bus.emit('hazardFixed', { type: 'stair', s }); } }; } },
  stash: { r: 24, always: true, act(w, s, o) { return stashAct(w, s, 'spot', o); } },
  handoff: { r: 30, always: true, act(w, s, o) { return w.o.handoffAct ? w.o.handoffAct(w, s, o) : null; } },
  lantern: { r: 26, always: true, act(w, s, o) { return w.o.lanternAct ? w.o.lanternAct(w, s, o) : null; } },
  keepspot: { r: 24, always: true, act(w, s, o) { return w.o.keepAct ? w.o.keepAct(w, s, o) : null; } },
  potrack: { r: 24, always: true, act(w, s) { return { label: 'Bang the pots', fn() { s.act('use', 0.4); Snd.sfx('pan'); Snd.sfx('clatter'); w.noise(s.x, s.f, 300, 'pots'); Bus.emit('potsBanged', { s }); } }; } }
};
function candleAct(w, s, o) {
  const c = w.candle; if (!c) return null;
  if (c.lit) return { label: 'Shield the flame', hold: 0.5, auto: false, fn() { c.shield = 1.2; c.str = Math.min(100, c.str + 6); } };
  return { label: 'Relight the candle (' + c.matches + ' matches)', dis: c.matches > 0 ? null : 'No matches left.', hold: 0.8, fn() { c.matches--; c.lit = true; c.str = 60; c.outT = 0; Snd.sfx('match'); Bus.emit('candleLit', { s }); } };
}
function stashAct(w, s, where, o) {
  const st = w.stashState; if (!st) return null;
  if (where === 'pantry') { if (s.bundle || st.pantry <= 0) return null; return { label: 'Take a bundle to hide (' + st.pantry + ' left)', hold: 0.6, fn() { st.pantry--; s.bundle = true; Snd.sfx('page'); } }; }
  if (!s.bundle) return null;
  return { label: 'Stash the bundle here', hold: 0.9, fn() { s.bundle = false; st.hidden++; o.n = (o.n || 0) + 1; Snd.sfx('thud', { v: 0.3 }); Floaters.add('Hidden (' + st.hidden + '/' + st.total + ')', o.x, w.floorY(o.f) - 40, {}); } };
}
