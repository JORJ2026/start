// ---------- world: cave generation, placement, physics, pathfinding, echo field ----------
function genCave(seed, depth) {
  const W = Math.min(150, 60 + depth * 8), H = Math.min(104, 42 + depth * 5);
  for (let attempt = 0; attempt < 16; attempt++) {
    const rng = new RNG(seed + attempt * 7919);
    let g = new Uint8Array(W * H), b = new Uint8Array(W * H);
    const fill = 0.455 + Math.min(depth, 12) * 0.002;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
      g[y * W + x] = (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) ? 1 : (rng.next() < fill ? 1 : 0);
    for (let it = 0; it < 5; it++) {
      b.set(g);
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) n += g[(y + dy) * W + x + dx];
        const i = y * W + x;
        b[i] = n >= 5 ? 1 : (n <= 3 ? 0 : g[i]);
      }
      [g, b] = [b, g];
    }
    // keep the largest connected open region
    const lab = new Int32Array(W * H).fill(-1), q = new Int32Array(W * H);
    let best = -1, bestN = 0, rid = 0;
    for (let i = 0; i < W * H; i++) {
      if (g[i] || lab[i] >= 0) continue;
      let h = 0, tl = 0; q[tl++] = i; lab[i] = rid; let n = 0;
      while (h < tl) {
        const c = q[h++]; n++;
        const cx = c % W, cy = (c / W) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy, ni = ny * W + nx;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || g[ni] || lab[ni] >= 0) continue;
          lab[ni] = rid; q[tl++] = ni;
        }
      }
      if (n > bestN) { bestN = n; best = rid; }
      rid++;
    }
    for (let i = 0; i < W * H; i++) if (!g[i] && lab[i] !== best) g[i] = 1;
    if (bestN > W * H * 0.3) return { W, H, g, rng };
  }
  throw new Error('Cave generation failed');
}

const solidAt = (L, cx, cy) => cx < 0 || cy < 0 || cx >= L.W || cy >= L.H || L.g[cy * L.W + cx] === 1;
function wallCount8(L, i) {
  const x = i % L.W, y = (i / L.W) | 0; let n = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && solidAt(L, x + dx, y + dy)) n++;
  return n;
}
function openAround(L, i, r) {
  const x = i % L.W, y = (i / L.W) | 0;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (solidAt(L, x + dx, y + dy)) return false;
  return true;
}
function bfs(L, start) {
  const N = L.W * L.H, d = new Int32Array(N).fill(-1), q = new Int32Array(N);
  let h = 0, t = 0; q[t++] = start; d[start] = 0;
  while (h < t) {
    const c = q[h++], cx = c % L.W, cy = (c / L.W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (solidAt(L, nx, ny)) continue;
      const ni = ny * L.W + nx; if (d[ni] >= 0) continue;
      d[ni] = d[c] + 1; q[t++] = ni;
    }
  }
  return d;
}
const cellX = (L, i) => (i % L.W + 0.5) * T, cellY = (L, i) => (((i / L.W) | 0) + 0.5) * T;

// spaced sampling: pick n cells from candidates, each far from those already taken
function spaced(L, rng, cands, n, minCells, avoid) {
  const out = [], taken = avoid ? avoid.slice() : [];
  const md2 = minCells * minCells * T * T;
  for (let k = 0; k < n && cands.length; k++) {
    let bestI = -1, bestD = -1;
    for (let s = 0; s < 70; s++) {
      const c = cands[Math.floor(rng.next() * cands.length)], x = cellX(L, c), y = cellY(L, c);
      let dm = Infinity;
      for (const [tx, ty] of taken) { const dd = (tx - x) ** 2 + (ty - y) ** 2; if (dd < dm) dm = dd; }
      if (dm > bestD) { bestD = dm; bestI = c; }
    }
    if (bestI < 0 || (bestD < md2 && taken.length)) { if (bestD < md2 * 0.25) break; }
    out.push(bestI); taken.push([cellX(L, bestI), cellY(L, bestI)]);
  }
  return out;
}

function buildLevel(cfg) {
  const cave = genCave(cfg.seed, cfg.size);
  const L = { W: cave.W, H: cave.H, g: cave.g, time: 0, cfg };
  const rng = cave.rng, N = L.W * L.H;
  const open = []; for (let i = 0; i < N; i++) if (!L.g[i]) open.push(i);
  // start: roomy cell near the left
  let sc = open.filter(i => openAround(L, i, 1) && (i % L.W) < L.W * 0.3);
  if (!sc.length) sc = open.filter(i => openAround(L, i, 1));
  if (!sc.length) sc = open;
  const start = rng.pick(sc);
  const dist = bfs(L, start);
  let maxD = 0; for (const i of open) if (dist[i] > maxD) maxD = dist[i];
  const reach = open.filter(i => dist[i] >= 0);
  // gate: among the farthest roomy cells
  let gc = reach.filter(i => openAround(L, i, 1) && dist[i] > maxD * 0.85);
  if (!gc.length) gc = reach.filter(i => dist[i] > maxD * 0.8);
  const gate = rng.pick(gc);
  L.dist = dist; L.maxD = maxD;
  L.start = { x: cellX(L, start), y: cellY(L, start) };
  L.gate = { x: cellX(L, gate), y: cellY(L, gate), open: false, seenAt: -99, seenUntil: -99 };
  const avoid = [[L.start.x, L.start.y], [L.gate.x, L.gate.y]];
  // shards
  let shC = reach.filter(i => dist[i] > Math.min(14, maxD * 0.25));
  const sh = spaced(L, rng, shC, cfg.shards, 10, avoid);
  L.shards = sh.map(i => ({ x: cellX(L, i), y: cellY(L, i), got: false, seenAt: -99, seenUntil: -99, hum: rng.range(0, 3) }));
  for (const s of L.shards) avoid.push([s.x, s.y]);
  // lost song: tucked into a nook
  L.song = null;
  if (cfg.song != null) {
    let c = reach.filter(i => wallCount8(L, i) >= 5 && dist[i] > maxD * 0.35);
    if (!c.length) c = reach.filter(i => dist[i] > maxD * 0.35);
    const s = spaced(L, rng, c, 1, 6, avoid)[0];
    if (s != null) { L.song = { x: cellX(L, s), y: cellY(L, s), idx: cfg.song, got: false, seenAt: -99, seenUntil: -99 }; avoid.push([L.song.x, L.song.y]); }
  }
  // a lost member of the colony, hiding in a far nook (story only)
  L.kin = null;
  if (cfg.kin != null) {
    let c = reach.filter(i => wallCount8(L, i) >= 4 && dist[i] > maxD * 0.3 && openAround(L, i, 0));
    if (!c.length) c = reach.filter(i => dist[i] > maxD * 0.3);
    const k = spaced(L, rng, c, 1, 8, avoid)[0];
    if (k != null) { L.kin = { x: cellX(L, k), y: cellY(L, k), idx: cfg.kin, got: false, heard: false, chirpT: 4, seenAt: -99, seenUntil: -99, ph: rng.range(0, TAU) }; avoid.push([L.kin.x, L.kin.y]); }
  }
  // bellflowers grow against walls
  const bc = reach.filter(i => { const w = wallCount8(L, i); return w >= 3 && w <= 5 && dist[i] > 8; });
  L.bells = spaced(L, rng, bc, cfg.bells, 12, avoid).map(i => ({ x: cellX(L, i), y: cellY(L, i), cd: 0, lit: -99, seenAt: -99, seenUntil: -99 }));
  // moths
  const mc = reach.filter(i => dist[i] > 5);
  L.moths = spaced(L, rng, mc, cfg.moths, 4, [[L.start.x, L.start.y]]).map(i => {
    const x = cellX(L, i), y = cellY(L, i);
    return { x, y, hx: x, hy: y, ph: rng.range(0, TAU), flee: 0, fx: 0, fy: 0, got: false };
  });
  // water drips: tiny environmental echoes
  const dc = reach.filter(i => wallCount8(L, i) >= 2);
  L.drips = spaced(L, rng, dc, 7 + Math.min(cfg.depth || 1, 10), 9, []).map(i => ({ x: cellX(L, i), y: cellY(L, i), t: rng.range(0.5, 8) }));
  // hunters
  L.enemies = [];
  let stc = reach.filter(i => openAround(L, i, 1) && dist[i] > 30);
  if (stc.length < cfg.stalkers * 3) stc = reach.filter(i => dist[i] > 20);
  for (const i of spaced(L, rng, stc, cfg.stalkers, 12, [[L.start.x, L.start.y]]))
    L.enemies.push(makeEnemy('stalker', cellX(L, i), cellY(L, i), rng));
  const luc = reach.filter(i => wallCount8(L, i) >= 4 && dist[i] > 16);
  const lAvoid = [[L.start.x, L.start.y], ...L.enemies.map(e => [e.x, e.y])];
  for (const i of spaced(L, rng, luc, cfg.lurkers, 10, lAvoid))
    L.enemies.push(makeEnemy('lurker', cellX(L, i), cellY(L, i), rng));
  L.mute = null;
  if (cfg.final) {
    const mc2 = reach.filter(i => dist[i] > maxD * 0.55 && dist[i] < maxD * 0.8 && openAround(L, i, 1));
    const i = mc2.length ? rng.pick(mc2) : gate;
    L.mute = makeEnemy('mute', cellX(L, i), cellY(L, i), rng);
    L.enemies.push(L.mute);
  }
  // memory + contour stipple: points sampled along the iso-surface, bucketed by cell
  L.mem = new Float32Array(N).fill(-1);
  const per = new Map(), S = 4, sw = Math.ceil(L.W * T / S), shh = Math.ceil(L.H * T / S);
  const solidS = new Uint8Array(sw * shh);
  for (let y = 0; y < shh; y++) for (let x = 0; x < sw; x++) solidS[y * sw + x] = field(L, x * S + S / 2, y * S + S / 2) > 0.5 ? 1 : 0;
  for (let y = 1; y < shh - 1; y++) for (let x = 1; x < sw - 1; x++) {
    const i = y * sw + x; if (!solidS[i]) continue;
    if (solidS[i - 1] && solidS[i + 1] && solidS[i - sw] && solidS[i + sw]) continue;
    const h = hashStr(x + ',' + y), px = x * S + S / 2 + ((h & 15) / 15 - 0.5) * 2.4, py = y * S + S / 2 + (((h >> 4) & 15) / 15 - 0.5) * 2.4;
    const ci = Math.floor(py / T) * L.W + Math.floor(px / T);
    if (!per.has(ci)) per.set(ci, []); per.get(ci).push(px, py);
  }
  const pts = [], ps = new Int32Array(N).fill(-1), pc = new Uint8Array(N);
  for (const [ci, arr] of per) { ps[ci] = pts.length / 2; pc[ci] = Math.min(255, arr.length / 2); for (const v of arr) pts.push(v); }
  L.ep = new Float32Array(pts); L.epS = ps; L.epC = pc;
  L.path = makePather(L);
  L.rings = []; L.events = []; L.cues = []; L.noises = [];
  L.shardsGot = 0; L.shardsNeeded = L.shards.length;
  L.stats = { pings: 0, hurt: 0, time: 0 };
  return L;
}

function makeEnemy(type, x, y, rng) {
  const base = { type, x, y, vx: 0, vy: 0, hx: x, hy: y, stun: 0, seenAt: -99, seenUntil: -99, gx: x, gy: y, seed: rng.next(), path: null, pi: 0 };
  if (type === 'stalker') return Object.assign(base, { r: 5, hear: 1, state: 'wander', click: rng.range(1, 4), wait: rng.range(0, 2), repath: 0, stuck: 0, tx: x, ty: y, searchT: 0, jit: 0, ja: 0 });
  if (type === 'lurker') return Object.assign(base, { r: 6, hear: 0.7, state: 'idle', t: 0, breath: rng.range(2, 6), lx: 0, ly: 0 });
  return Object.assign(base, { r: 22, hear: 1.7, state: 'drift', pulse: 2, tx: null, ty: null, calm: false });
}

// Smooth wall field: bilinear over cell centres plus a low organic wobble. Iso 0.5 is the rock surface.
const NZ = 0.075;
function cellV(L, cx, cy) { return (cx < 0 || cy < 0 || cx >= L.W || cy >= L.H) ? 1 : L.g[cy * L.W + cx]; }
function field(L, x, y) {
  const gx = x / T - 0.5, gy = y / T - 0.5, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
  const a = cellV(L, x0, y0), b = cellV(L, x0 + 1, y0), c = cellV(L, x0, y0 + 1), d = cellV(L, x0 + 1, y0 + 1);
  const top = a + (b - a) * fx, bot = c + (d - c) * fx;
  return top + (bot - top) * fy + NZ * (Math.sin(x * 0.23 + Math.sin(y * 0.11) * 2) * 0.55 + Math.sin(y * 0.29 + x * 0.07) * 0.45);
}
// is the 2x2 block of cells around this point all open? then the point is certainly open
function clearBlock(L, x, y) {
  const x0 = Math.floor(x / T - 0.5), y0 = Math.floor(y / T - 0.5);
  return !(cellV(L, x0, y0) | cellV(L, x0 + 1, y0) | cellV(L, x0, y0 + 1) | cellV(L, x0 + 1, y0 + 1));
}
const RING = Array.from({ length: 8 }, (_, i) => [Math.cos(i / 8 * TAU), Math.sin(i / 8 * TAU)]);
function hitsWall(L, x, y, r) {
  if (field(L, x, y) > 0.5) return true;
  for (const [dx, dy] of RING) if (field(L, x + dx * r, y + dy * r) > 0.5) return true;
  return false;
}
// axis-separated slide; returns true if blocked
function moveCircle(L, e, dx, dy) {
  let blocked = false;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (e.r * 0.8)));
  const sx = dx / steps, sy = dy / steps;
  for (let s = 0; s < steps; s++) {
    e.x += sx; if (hitsWall(L, e.x, e.y, e.r)) { e.x -= sx; e.vx = 0; blocked = true; }
    e.y += sy; if (hitsWall(L, e.x, e.y, e.r)) { e.y -= sy; e.vy = 0; blocked = true; }
  }
  return blocked;
}
// march the field; returns distance to the rock surface or -1. castRay.cx/cy = cell at the hit.
function castRay(L, ox, oy, dx, dy, max) {
  if (field(L, ox, oy) > 0.5) { castRay.cx = Math.floor(ox / T); castRay.cy = Math.floor(oy / T); return 0; }
  let t = 0, pt = 0;
  while (t < max) {
    pt = t;
    t += clearBlock(L, ox + dx * t, oy + dy * t) ? 4 : 1.5;
    if (t > max) t = max;
    if (field(L, ox + dx * t, oy + dy * t) > 0.5) {
      let lo = pt, hi = t;
      for (let k = 0; k < 4; k++) { const m = (lo + hi) / 2; if (field(L, ox + dx * m, oy + dy * m) > 0.5) hi = m; else lo = m; }
      castRay.cx = Math.floor((ox + dx * (hi + 3)) / T); castRay.cy = Math.floor((oy + dy * (hi + 3)) / T);
      return hi;
    }
    if (t >= max) break;
  }
  return -1;
}
function los(L, x0, y0, x1, y1) {
  const d = hyp(x1 - x0, y1 - y0); if (d < 1) return true;
  return castRay(L, x0, y0, (x1 - x0) / d, (y1 - y0) / d, d) < 0;
}

// A* on the grid (8-way, no corner cutting). Arrays are reused per level.
function makePather(L) {
  const N = L.W * L.H, gS = new Float32Array(N), came = new Int32Array(N), seen = new Uint32Array(N), shut = new Uint32Array(N);
  let gen = 0; const hf = [], hi = [];
  const push = (f, i) => { hf.push(f); hi.push(i); let k = hf.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (hf[p] <= hf[k]) break; [hf[p], hf[k]] = [hf[k], hf[p]]; [hi[p], hi[k]] = [hi[k], hi[p]]; k = p; } };
  const pop = () => {
    const r = hi[0], lf = hf.pop(), li = hi.pop();
    if (hf.length) { hf[0] = lf; hi[0] = li; let k = 0; for (;;) { const a = 2 * k + 1, b = a + 1; let m = k; if (a < hf.length && hf[a] < hf[m]) m = a; if (b < hf.length && hf[b] < hf[m]) m = b; if (m === k) break; [hf[m], hf[k]] = [hf[k], hf[m]]; [hi[m], hi[k]] = [hi[k], hi[m]]; k = m; } }
    return r;
  };
  const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  return function (sx, sy, tx, ty, maxExp = 3000) {
    let s = Math.floor(sy / T) * L.W + Math.floor(sx / T), t = Math.floor(ty / T) * L.W + Math.floor(tx / T);
    if (L.g[s] || L.g[t] || s < 0 || t < 0 || s >= N || t >= N) return null;
    gen++; hf.length = 0; hi.length = 0;
    const txc = t % L.W, tyc = (t / L.W) | 0;
    const h = i => { const dx = Math.abs(i % L.W - txc), dy = Math.abs(((i / L.W) | 0) - tyc); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
    gS[s] = 0; seen[s] = gen; came[s] = -1; push(h(s), s);
    let exp = 0;
    while (hf.length) {
      const c = pop();
      if (shut[c] === gen) continue;
      shut[c] = gen;
      if (c === t) {
        const out = []; let k = c;
        while (k !== -1) { out.push([cellX(L, k), cellY(L, k)]); k = came[k]; }
        out.reverse(); out.shift();
        if (out.length) out[out.length - 1] = [tx, ty];
        return out;
      }
      if (++exp > maxExp) return null;
      const cx = c % L.W, cy = (c / L.W) | 0;
      for (const [dx, dy, cost] of DIRS) {
        const nx = cx + dx, ny = cy + dy;
        if (solidAt(L, nx, ny)) continue;
        if (dx && dy && (solidAt(L, cx + dx, cy) || solidAt(L, cx, cy + dy))) continue;
        const ni = ny * L.W + nx, ng = gS[c] + cost;
        if (seen[ni] === gen && ng >= gS[ni]) continue;
        seen[ni] = gen; gS[ni] = ng; came[ni] = c; push(ng + h(ni), ni);
      }
    }
    return null;
  };
}

// echo point field (ring buffer)
const Echo = {
  N: 22000, i: 0,
  init() { this.x = new Float32Array(this.N); this.y = new Float32Array(this.N); this.t = new Float32Array(this.N); this.l = new Float32Array(this.N); this.k = new Uint8Array(this.N); this.clear(); },
  clear() { this.t.fill(-1e9); this.l.fill(0); this.i = 0; },
  add(x, y, t, l, k) { const i = this.i; this.x[i] = x; this.y[i] = y; this.t[i] = t; this.l[i] = l; this.k[i] = k; this.i = (i + 1) % this.N; }
};
