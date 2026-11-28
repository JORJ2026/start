// Endless Runner map generator. 25 long maps (5 overworlds x 5 styles), each procedurally
// built from a fixed seed with exactly 100 monsters and 100 obstacles on uneven terrain:
// gentle and steep inclines and declines, hills, valleys, stairs, plateaus, cliffs and
// tight tunnels (some low enough to need a slide). Only the maps you open are generated.
(function (H) {
  'use strict';
  const TS = 32, R = 30, MAXW = 7000;
  const C = (ch) => ch.charCodeAt(0);

  function mulberry(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  const VARIANTS = [
    { name: 'Rolling Run', tunnel: 0.05, lo: 9, hi: 21, gap: [1, 2],
      terr: { flat: 2, upG: 3, dnG: 3, upS: 2, dnS: 2, hill: 3, valley: 3, rolling: 4, mound: 1, stairsUp: 0.5, stairsDown: 0.5, plateau: 0.5 },
      mons: { crawler: 3, walker: 2, hopper: 2, bat: 2, charger: 1, burrower: 1 },
      obs: { spikes: 3, pit: 2, trap: 2, floorSaw: 1, swingSaw: 1, wall: 1, hurdle: 2, duck: 1, boulder: 1 } },
    { name: 'Broken Steps', tunnel: 0.05, lo: 8, hi: 22, gap: [1, 2],
      terr: { flat: 1, upG: 1, dnG: 1, upS: 2, dnS: 2, hill: 1, valley: 1, rolling: 1, mound: 2, stairsUp: 4, stairsDown: 4, plateau: 3 },
      mons: { crawler: 2, walker: 3, hopper: 2, bat: 1, charger: 2, burrower: 2 },
      obs: { spikes: 2, pit: 2, trap: 1, floorSaw: 1, swingSaw: 1, wall: 4, hurdle: 4, duck: 1, boulder: 1 } },
    { name: 'Crawlspace', tunnel: 0.34, lo: 10, hi: 21, gap: [1, 2],
      terr: { flat: 2, upG: 3, dnG: 3, upS: 2, dnS: 2, hill: 2, valley: 2, rolling: 3, mound: 1, stairsUp: 0.3, stairsDown: 0.3, plateau: 0.3 },
      mons: { crawler: 4, walker: 1, hopper: 1, bat: 2, charger: 2, burrower: 3 },
      obs: { spikes: 4, pit: 1, trap: 4, floorSaw: 1, swingSaw: 1, wall: 0.5, hurdle: 1, duck: 5, boulder: 0.5 } },
    { name: 'Monster Den', tunnel: 0.08, lo: 9, hi: 21, gap: [1, 2],
      terr: { flat: 3, upG: 2, dnG: 2, upS: 1, dnS: 1, hill: 2, valley: 2, rolling: 2, mound: 1, stairsUp: 0.5, stairsDown: 0.5, plateau: 1 },
      mons: { crawler: 2, walker: 2, hopper: 3, bat: 4, charger: 3, burrower: 3 },
      obs: { spikes: 2, pit: 1, trap: 3, floorSaw: 1, swingSaw: 1, wall: 1, hurdle: 2, duck: 2, boulder: 1 } },
    { name: 'Gauntlet', tunnel: 0.06, lo: 8, hi: 22, gap: [1, 2],
      terr: { flat: 1, upG: 1, dnG: 1, upS: 4, dnS: 4, hill: 3, valley: 3, rolling: 2, mound: 2, stairsUp: 1, stairsDown: 1, plateau: 1 },
      mons: { crawler: 2, walker: 2, hopper: 2, bat: 2, charger: 2, burrower: 2 },
      obs: { spikes: 2, pit: 3, trap: 1, floorSaw: 4, swingSaw: 4, wall: 1, hurdle: 1, duck: 1, boulder: 4 } },
  ];
  // per-overworld flavour: multiplies hazard weights and adds tunnels
  const FLAVOUR = [
    { tunnel: 0, mons: { crawler: 1.5 }, obs: { trap: 1.5 } },                       // forest
    { tunnel: 0.22, mons: { bat: 2 }, obs: { spikes: 2, trap: 1.5 } },               // caves
    { tunnel: 0.08, mons: { walker: 1.5 }, obs: { wall: 2, hurdle: 1.5 } },          // ruins
    { tunnel: 0.12, mons: { charger: 1.5 }, obs: { floorSaw: 2, swingSaw: 2 } },     // factory
    { tunnel: 0.04, mons: { hopper: 1.5, burrower: 1.5 }, obs: { pit: 1.5, boulder: 2 } }, // peaks
  ];

  function pick(rand, w) {
    let tot = 0; for (const k in w) tot += w[k];
    let r = rand() * tot;
    for (const k in w) { r -= w[k]; if (r <= 0) return k; }
    return Object.keys(w)[0];
  }
  function scaled(w, mult) { const o = {}; for (const k in w) o[k] = w[k] * ((mult && mult[k]) || 1); return o; }

  class Gen {
    constructor(idx) {
      this.idx = idx; this.wi = Math.floor(idx / 5); this.vi = idx % 5;
      this.V = VARIANTS[this.vi]; this.F = FLAVOUR[this.wi];
      this.rand = mulberry(918273 + idx * 7919);
      this.cells = new Uint8Array(R * MAXW).fill(C('.'));
      this.tops = new Int16Array(MAXW).fill(999);
      this.c = 1; this.top = 14 + Math.floor(this.rand() * 5);
      this.zone = null;
      this.ent = { traps: [], saws: [], boulders: [], monsters: [] };
      this.count = { m: 0, o: 0, types: {} };
      this.hazards = 0;
    }
    ri(a, b) { return a + Math.floor(this.rand() * (b - a + 1)); }
    set(c, r, ch) { if (c >= 0 && c < MAXW && r >= 0 && r < R) this.cells[r * MAXW + c] = C(ch); }
    solidCol(c, top) { for (let r = Math.max(0, top); r < R; r++) this.set(c, r, '#'); this.tops[c] = Math.min(this.tops[c], top); }
    tally(cat, type) { this.count[cat]++; this.count.types[type] = (this.count.types[type] || 0) + 1; }

    // ---------- terrain primitives ----------
    flat(n) { for (let i = 0; i < n; i++) { this.solidCol(this.c, this.top); this.c++; } }
    up(k, steep) {
      for (let i = 0; i < k; i++) {
        if (steep) { this.set(this.c, this.top - 1, '/'); this.solidCol(this.c, this.top); this.tops[this.c] = this.top - 1; this.c++; }
        else {
          this.set(this.c, this.top - 1, 'a'); this.solidCol(this.c, this.top); this.tops[this.c] = this.top - 1; this.c++;
          this.set(this.c, this.top - 1, 'b'); this.solidCol(this.c, this.top); this.tops[this.c] = this.top - 1; this.c++;
        }
        this.top--;
      }
    }
    down(k, steep) {
      for (let i = 0; i < k; i++) {
        if (steep) { this.set(this.c, this.top, '\\'); this.solidCol(this.c, this.top + 1); this.tops[this.c] = this.top; this.c++; }
        else {
          this.set(this.c, this.top, 'c'); this.solidCol(this.c, this.top + 1); this.tops[this.c] = this.top; this.c++;
          this.set(this.c, this.top, 'd'); this.solidCol(this.c, this.top + 1); this.tops[this.c] = this.top; this.c++;
        }
        this.top++;
      }
    }
    ok(dy) { const t = this.top + dy; return t >= this.V.lo && t <= this.V.hi; }

    terrain() {
      const inZone = !!this.zone;
      let w = scaled(this.V.terr, null);
      if (inZone) w = { flat: 3, upG: 2, dnG: 2, upS: 1, dnS: 1, rolling: 2 };
      for (let tries = 0; tries < 12; tries++) {
        const k = pick(this.rand, w), r = this;
        switch (k) {
          case 'flat': r.flat(r.ri(2, 5)); return;
          case 'upS': { const n = r.ri(2, 3); if (!r.ok(-n)) break; r.up(n, true); r.flat(r.ri(1, 3)); return; }
          case 'dnS': { const n = r.ri(2, 3); if (!r.ok(n)) break; r.down(n, true); r.flat(r.ri(1, 3)); return; }
          case 'upG': { const n = r.ri(1, 2); if (!r.ok(-n)) break; r.up(n, false); r.flat(r.ri(1, 2)); return; }
          case 'dnG': { const n = r.ri(1, 2); if (!r.ok(n)) break; r.down(n, false); r.flat(r.ri(1, 2)); return; }
          case 'hill': { const n = r.ri(2, 4), s = r.rand() < 0.6; if (!r.ok(-n)) break; r.up(n, s); r.flat(r.ri(1, 3)); r.down(n, s); r.flat(1); return; }
          case 'valley': { const n = r.ri(2, 4), s = r.rand() < 0.6; if (!r.ok(n)) break; r.down(n, s); r.flat(r.ri(2, 4)); r.up(n, s); r.flat(1); return; }
          case 'rolling': {
            for (let i = 0; i < r.ri(3, 5); i++) { const dn = r.rand() < 0.5; if (dn ? r.ok(1) : r.ok(-1)) { dn ? r.down(1, false) : r.up(1, false); } r.flat(r.ri(0, 2)); }
            r.flat(1); return;
          }
          case 'mound': { if (!r.ok(-1)) break; r.flat(1); r.up(1, true); r.flat(r.ri(1, 2)); r.down(1, true); r.flat(1); return; }
          case 'stairsUp': { const n = r.ri(2, 3); if (!r.ok(-n)) break; for (let i = 0; i < n; i++) { r.flat(2); r.top -= 1; } r.flat(2); return; }
          case 'stairsDown': { const n = r.ri(2, 3); if (!r.ok(n)) break; for (let i = 0; i < n; i++) { r.flat(2); r.top += 1; } r.flat(2); return; }
          case 'plateau': { if (!r.ok(-2)) break; r.flat(1); r.top -= 2; r.flat(r.ri(4, 7)); r.top += 2; r.flat(2); return; }
        }
      }
      this.flat(3);
    }

    // ---------- tunnels (ceiling zones) ----------
    beginZone(clear, n) { this.zone = { c0: this.c, clear, left: n }; }
    endZone() {
      const z = this.zone; if (!z) return;
      this.flat(2);
      const c1 = this.c;
      for (let c = z.c0; c < c1; c++) {
        let clr = z.clear;
        const fromStart = c - z.c0, fromEnd = c1 - 1 - c;
        clr += Math.max(0, 2 - fromStart, 2 - fromEnd);
        const m = Math.min(this.tops[c], this.top + 8);
        for (let r = 0; r <= m - clr - 1; r++) this.set(c, r, '#');
      }
      this.zone = null;
      this.flat(6);      // open ground to get a run-up after the tunnel
    }

    // ---------- obstacle events (all on flat ground) ----------
    obstacle(kind) {
      const r = this, T = () => r.top;
      switch (kind) {
        case 'spikes': { r.flat(3); const w = r.zone && r.zone.clear < 4 ? 1 : r.ri(1, 2); for (let i = 0; i < w; i++) { r.set(r.c, T(), '^'); r.solidCol(r.c, T() + 1); r.tops[r.c] = T(); r.c++; } r.flat(3); break; }
        case 'pit': { r.flat(3); const w = r.zone && r.zone.clear < 4 ? 1 : r.ri(1, 2); for (let i = 0; i < w; i++) { r.tops[r.c] = T(); r.c++; } r.flat(3); break; }
        case 'trap': { r.flat(3); r.ent.traps.push({ x: r.c, y: T() - 1 }); r.flat(1); r.flat(3); break; }
        case 'floorSaw': { r.flat(4); r.ent.saws.push({ x: r.c, y: T() - 0.625, dx: 0, dy: 0, r: 20, period: 2, phase: 0 }); r.flat(1); r.flat(4); break; }
        case 'swingSaw': { r.flat(5); r.ent.saws.push({ x: r.c + 1, y: T() - 0.9375, dx: 2.5, dy: 0, r: 18, period: 2.6, phase: r.rand() }); r.flat(8); break; }
        case 'wall': { r.flat(4); r.top -= r.ri(1, 2); r.flat(4); break; }
        case 'hurdle': {
          r.flat(4);
          const k = 1, w = r.ri(1, 2);
          for (let i = 0; i < w; i++) { for (let q = 1; q <= k; q++) r.set(r.c, T() - q, '#'); r.solidCol(r.c, T()); r.tops[r.c] = T() - k; r.c++; }
          r.flat(4); break;
        }
        case 'duck': {   // low roof: slide under it
          r.flat(4);
          const c0 = r.c, len = r.ri(4, 7), base = T();
          r.flat(len);
          r.flat(2);
          const c1 = r.c;
          for (let c = c0 - 2; c < c1 + 2; c++) {
            const fromS = c - (c0 - 2), fromE = c1 + 1 - c;
            const clr = 1 + Math.max(0, 3 - fromS - 1, 3 - fromE - 1);
            if (c < 0) continue;
            for (let rr = 0; rr <= base - clr - 1; rr++) r.set(c, rr, '#');
          }
          r.flat(3); break;
        }
        case 'boulder': {
          r.flat(3);
          const m0 = r.c, T0 = T();
          r.up(3, true); const px = r.c; r.flat(4);
          r.ent.boulders.push({ x: px, y: T0 - 4, hold: { zone: m0 + 2.6, vx: -130 } });
          break;
        }
      }
    }

    // ---------- monster events ----------
    monster(kind) {
      const r = this;
      const place = (col, rr) => r.ent.monsters.push({ k: kind, x: col + 0.5, y: r.top, r: rr || 0, ph: r.rand() * 6 });
      switch (kind) {
        case 'crawler': { r.flat(4); const c0 = r.c; r.flat(8); place(c0 + 4, 1.2); r.flat(3); break; }
        case 'walker': { r.flat(4); const c0 = r.c; r.flat(8); place(c0 + 4, 1); r.flat(3); break; }
        case 'hopper': { r.flat(4); const c0 = r.c; r.flat(5); place(c0 + 2, 0); r.flat(3); break; }
        case 'bat': { r.flat(4); const c0 = r.c; r.flat(9); place(c0 + 4, 3.2); r.flat(3); break; }
        case 'charger': { r.flat(3); const c0 = r.c; r.flat(15); place(c0 + 13, 0); r.flat(3); break; }
        case 'burrower': { r.flat(3); const c0 = r.c; r.flat(6); place(c0 + 3, 0); r.flat(3); break; }
      }
    }

    checkpoint() { this.flat(2); this.set(this.c - 1, this.top - 1, 'K'); this.flat(1); }

    build() {
      const r = this, V = this.V, F = this.F;
      r.flat(3); r.set(2, r.top - 1, 'P'); r.flat(4);
      const seq = [];
      for (let i = 0; i < 100; i++) seq.push('m', 'o');
      for (let i = seq.length - 1; i > 0; i--) { const j = Math.floor(r.rand() * (i + 1)); [seq[i], seq[j]] = [seq[j], seq[i]]; }
      const mons = scaled(V.mons, F.mons), obs = scaled(V.obs, F.obs);
      const tunnelP = V.tunnel + F.tunnel;
      let sinceCp = 0;
      for (const cat of seq) {
        // connector terrain between hazards
        const pieces = r.ri(V.gap[0], V.gap[1]);
        for (let i = 0; i < pieces; i++) r.terrain();
        if (!r.zone && r.rand() < tunnelP) {
          const q = r.rand();
          if (q < 0.25 && cat === 'm') r.beginZone(2, 1);          // slide-only bat tunnel
          else r.beginZone(4, r.ri(2, 4));
        }
        let kind;
        if (cat === 'm') {
          let w = mons;
          if (r.zone) w = r.zone.clear === 2 ? { bat: 1 } : r.zone.clear === 3 ? { crawler: mons.crawler, burrower: mons.burrower, bat: mons.bat, charger: mons.charger }
            : { crawler: mons.crawler, burrower: mons.burrower, bat: mons.bat, charger: mons.charger, walker: mons.walker, hopper: mons.hopper };
          kind = pick(r.rand, w); r.monster(kind); r.tally('m', kind);
        } else {
          let w = obs;
          if (r.zone) w = r.zone.clear >= 4 ? { spikes: obs.spikes, pit: obs.pit, trap: obs.trap, floorSaw: obs.floorSaw, swingSaw: obs.swingSaw, hurdle: obs.hurdle }
            : { spikes: obs.spikes, pit: obs.pit, trap: obs.trap };
          kind = pick(r.rand, w); r.obstacle(kind); r.tally('o', kind);
        }
        r.hazards++; sinceCp++;
        if (r.zone) { r.zone.left--; if (r.zone.left <= 0) r.endZone(); }
        if (sinceCp >= 12 && !r.zone) { r.checkpoint(); sinceCp = 0; }
        if (r.c > MAXW - 80) throw new Error('runner map too long');
      }
      if (r.zone) r.endZone();
      r.flat(4); r.set(r.c - 2, r.top - 1, 'E'); r.flat(8);
      const W = r.c + 1;
      for (let rr = 0; rr < R; rr++) { r.set(0, rr, '#'); r.set(W - 1, rr, '#'); }
      const rows = [];
      for (let rr = 0; rr < R; rr++) {
        let s = '';
        const base = rr * MAXW;
        for (let c0 = 0; c0 < W; c0 += 1024) s += String.fromCharCode.apply(null, r.cells.subarray(base + c0, base + Math.min(W, c0 + 1024)));
        rows.push(s);
      }
      const world = H.WORLDS[r.wi];
      return {
        id: 'run' + (r.idx + 1), name: `${world.name}: ${V.name}`, world: world.id, index: r.idx, runner: true, rows,
        traps: r.ent.traps, saws: r.ent.saws, boulders: r.ent.boulders, monsters: r.ent.monsters,
        stats: { monsters: r.count.m, obstacles: r.count.o, types: r.count.types, columns: W, interactiveTotal: 0, obstacleTotal: r.count.o },
      };
    }
  }

  const cache = {};
  H.runner = {
    COUNT: 25,
    generate(idx) { return cache[idx] || (cache[idx] = new Gen(idx).build()); },
    // speed multiplier for the auto-run: climbs with every map and every lap
    speedScale(idx, lap) { return Math.min(1.9, 1.25 + idx * 0.026 + lap * 0.3); },
    mapName(idx) { return `${H.WORLDS[Math.floor(idx / 5)].name}: ${VARIANTS[idx % 5].name}`; },
  };
})(globalThis.Hollow = globalThis.Hollow || {});
