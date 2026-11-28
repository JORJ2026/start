// World: level loading, solids queries (tiles, slopes, bodies, movers, planks),
// crates & boulders, signals (levers + plates), movers (gates, lifts, bridges,
// crushers), ropes, checkpoints with full world-state snapshots, death/respawn.
(function (H) {
  'use strict';
  const { TS, PHYS, T } = H;
  const { overlaps, sweepX, sweepY, sweptArea, groundMoveX, groundMoveY, slopeY, isSlope, slopeInfo, EPS } = H.phys;

  const DEATH_OUT = 0.25, DEATH_HOLD = 0.12, FADE_IN = 0.3;
  const CHAR_TILE = { '#': T.SOLID, 'H': T.LADDER, '^': T.SPIKE, '/': T.UP45, '\\': T.DN45, 'a': T.UPLO, 'b': T.UPHI, 'c': T.DNHI, 'd': T.DNLO };

  class World {
    constructor(level) {
      this.level = level;
      this.id = level.id;
      this.rows = level.rows.length;
      this.cols = level.rows[0].length;
      this.width = this.cols * TS;
      this.height = this.rows * TS;
      this.tiles = new Uint8Array(this.cols * this.rows);
      this.bodies = [];
      this.checkpoints = [];
      this.start = null;
      this.endX = Infinity;

      for (let r = 0; r < this.rows; r++) {
        const line = level.rows[r];
        if (line.length !== this.cols) throw new Error(`Level ${level.id}: row ${r} has length ${line.length}, expected ${this.cols}`);
        for (let c = 0; c < this.cols; c++) {
          const ch = line[c];
          let t = CHAR_TILE[ch] || T.EMPTY;
          if (ch === 'P') this.start = { x: c * TS + TS / 2, y: (r + 1) * TS };
          else if (ch === 'C') this.bodies.push(this.makeBody('crate', c * TS, r * TS));
          else if (ch === 'K') this.checkpoints.push({ x: c * TS + TS / 2, y: (r + 1) * TS });
          else if (ch === 'E') this.endX = c * TS;
          this.tiles[r * this.cols + c] = t;
        }
      }
      if (!this.start) throw new Error(`Level ${level.id}: no player start (P)`);
      this.checkpoints.unshift({ x: this.start.x, y: this.start.y });
      this.checkpoints.sort((a, b) => a.x - b.x);

      for (const c of level.crates || []) this.bodies.push(this.makeBody('crate', c.x * TS, c.y * TS));
      for (const b of level.boulders || []) {
        const body = this.makeBody('boulder', b.x * TS + 1, b.y * TS + 2);
        if (b.hold) { body.held = true; body.zone = b.hold.zone * TS; body.releaseVx = b.hold.vx; }
        this.bodies.push(body);
      }
      this.crates = this.bodies.filter((b) => b.kind === 'crate');
      this.boulders = this.bodies.filter((b) => b.kind === 'boulder');

      this.plates = (level.plates || []).map((p) => ({ id: p.id, x: p.x * TS, y: p.y * TS, w: p.w * TS, pressed: false }));
      this.levers = (level.levers || []).map((l) => ({
        id: l.id, x: l.x * TS + 4, y: (l.y + 1) * TS - 30, w: 24, h: 30, on: !!l.on, once: !!l.once, anim: l.on ? 1 : 0, prevAnim: l.on ? 1 : 0,
      }));
      this.movers = [];
      for (const m of level.movers || []) this.movers.push(this.makeMover(m, m.kind || 'lift'));
      for (const m of level.crushers || []) this.movers.push(this.makeMover(Object.assign({ dx: 0, dy: m.drop }, m), 'crusher'));
      this.planks = (level.planks || []).map((p) => ({ x: p.x * TS, y: p.y * TS, w: p.w * TS, h: 10, broken: false, breakT: 0 }));
      this.ropes = (level.ropes || []).map((r) => ({ ax: r.x * TS + TS / 2, ay: r.y * TS, len: r.len * TS, theta: 0, omega: 0, prevTheta: 0 }));
      this.signals = {};

      H.hazards.init(this, level);
      this.runner = !!level.runner;
      this.invuln = 0; this.stallT = 0;
      if (H.monsters) H.monsters.init(this, level); else this.monsters = [];
      this.pickups = [];

      this.player = new H.Player(this.start.x, this.start.y);
      this.player.shield = 0;
      if (H.pickups) H.pickups.init(this, level);
      this.cpIndex = 0;
      this.deaths = 0;
      this.time = 0;
      this.finished = false;
      this.deathT = -1;
      this.fadeInT = 0;
      this.fade = 0;
      this.onCheckpoint = null;
      this.onFinish = null;
      this.computeSignals();
      this.snap = this.snapshot();
    }

    emit(type, x, y, v) { if (this.onSound) this.onSound(type, x, y, v); }

    makeBody(kind, x, y) {
      const s = kind === 'boulder' ? 30 : TS;
      return { kind, x, y, w: s, h: s, vx: 0, vy: 0, grounded: false, pushed: false, prevX: x, prevY: y, angle: 0, prevAngle: 0, held: false, caught: false };
    }

    makeMover(m, kind) {
      const x0 = m.x * TS, y0 = m.y * TS;
      const mv = {
        kind, x0, y0, w: m.w * TS, h: m.h * TS, ox: (m.dx || 0) * TS, oy: (m.dy || 0) * TS,
        t: m.t0 || 0, needs: m.needs || [], invert: !!m.invert, any: !!m.any,
        speed: (m.speed || 2) * TS, period: m.period || 2.4, phase: m.phase || 0, stopOn: m.stopOn || null,
      };
      mv.moving = false;
      mv.x = mv.prevX = x0 + mv.ox * mv.t; mv.y = mv.prevY = y0 + mv.oy * mv.t;
      return mv;
    }

    tileAt(c, r) {
      if (c < 0 || c >= this.cols) return T.SOLID;
      if (r < 0 || r >= this.rows) return T.EMPTY;
      return this.tiles[r * this.cols + c];
    }
    isLadderTop(c, r) { return this.tileAt(c, r) === T.LADDER && this.tileAt(c, r - 1) !== T.LADDER; }

    // Highest slope surface at world x between yMin and yMax, or null.
    slopeSurface(x, yMin, yMax) {
      const c = Math.floor(x / TS), lx = x - c * TS;
      const r0 = Math.floor(yMin / TS), r1 = Math.floor(yMax / TS);
      for (let r = r0; r <= r1; r++) {
        const t = this.tileAt(c, r);
        if (!isSlope(t)) continue;
        const s = r * TS + slopeY(t, lx);
        if (s >= yMin - EPS && s <= yMax + EPS) return s;
      }
      return null;
    }

    // Slope tile directly under a body's feet (for speed & rolling), or null.
    slopeUnder(b) {
      const x = b.x + b.w / 2, feet = b.y + b.h;
      for (const y of [feet - 1, feet + 1]) {
        const t = this.tileAt(Math.floor(x / TS), Math.floor(y / TS));
        if (isSlope(t)) return slopeInfo(t);
      }
      return null;
    }

    slopeAtPoint(x, feet) {
      for (const y of [feet - 1, feet + 1, feet + 7]) {
        const t = this.tileAt(Math.floor(x / TS), Math.floor(y / TS));
        if (isSlope(t)) return slopeInfo(t);
      }
      return null;
    }

    // Nearest support (solid top or slope) within maxDist below the body's feet.
    supportBelow(b, maxDist, opts) {
      const feet = b.y + b.h;
      let best = null;
      const area = { x: b.x, y: feet - 1, w: b.w, h: maxDist + 2 };
      for (const s of this.collect(area, opts)) {
        if (!(b.x < s.x + s.w - EPS && b.x + b.w > s.x + EPS)) continue;
        if (s.y >= feet - EPS && s.y <= feet + maxDist && (best === null || s.y < best)) best = s.y;
      }
      const sl = this.slopeSurface(b.x + b.w / 2, feet - EPS, feet + maxDist);
      if (sl !== null && (best === null || sl < best)) best = sl;
      return best;
    }

    // Solid rects touching `area`. opts: exclude (body), oneWay, player
    collect(area, opts = {}) {
      const out = [];
      const c0 = Math.floor(area.x / TS), c1 = Math.floor((area.x + area.w) / TS);
      const r0 = Math.floor(area.y / TS), r1 = Math.floor((area.y + area.h) / TS);
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const t = this.tileAt(c, r);
          if (t === T.SOLID) out.push({ x: c * TS, y: r * TS, w: TS, h: TS });
          else if (opts.oneWay && t === T.LADDER && this.tileAt(c, r - 1) !== T.LADDER) out.push({ x: c * TS, y: r * TS, w: TS, h: TS, oneWay: true });
        }
      }
      for (const b of this.bodies) {
        if (b === opts.exclude) continue;
        if (overlaps(b, area)) out.push({ x: b.x, y: b.y, w: b.w, h: b.h, body: b });
      }
      for (const m of this.movers) {
        if (m === opts.excludeMover) continue;
        if (overlaps(m, area)) out.push({ x: m.x, y: m.y, w: m.w, h: m.h, mover: m });
      }
      for (const p of this.planks) if (!p.broken && overlaps(p, area)) out.push({ x: p.x, y: p.y, w: p.w, h: p.h, plank: p });
      if (opts.player) {
        const p = this.player;
        if (!p.dead && p.state !== 'rope' && overlaps(p, area)) out.push({ x: p.x, y: p.y, w: p.w, h: p.h, player: true });
      }
      return out;
    }

    isFree(rect, exclude, withPlayer) {
      for (const s of this.collect(rect, { exclude, player: withPlayer })) if (overlaps(s, rect)) return false;
      return true;
    }

    // Push a body horizontally (by the player). Returns distance moved.
    pushBody(b, dx) {
      const r = groundMoveX(this, b, dx, { exclude: b, player: true, grounded: b.grounded });
      return r.moved;
    }

    ladderColumnAt(body) {
      const cx = body.x + body.w / 2;
      const c = Math.floor(cx / TS);
      if (Math.abs(cx - (c * TS + TS / 2)) > 12) return -1;
      const r0 = Math.floor((body.y + 2) / TS), r1 = Math.floor((body.y + body.h - 2) / TS);
      for (let r = r0; r <= r1; r++) if (this.tileAt(c, r) === T.LADDER) return c;
      return -1;
    }
    ladderExtent(c, row) {
      let top = row, bot = row;
      while (this.tileAt(c, top - 1) === T.LADDER) top--;
      while (this.tileAt(c, bot + 1) === T.LADDER) bot++;
      return { top: top * TS, bottom: (bot + 1) * TS };
    }

    leverAt(p) {
      for (const l of this.levers) if (overlaps(p, { x: l.x - 6, y: l.y, w: l.w + 12, h: l.h })) return l;
      return null;
    }
    toggleLever(l) {
      if (l.once && l.on) return;
      l.on = !l.on;
      this.emit('lever', l.x + l.w / 2, l.y + l.h, 1);
      this.computeSignals();
    }

    kill(cause) {
      const p = this.player;
      if (p.dead || this.finished || this.invuln > 0) return;
      if (H.pickups && H.pickups.absorb(this, cause)) return;
      p.dead = true; p.deathCause = cause;
      if (p.state === 'rope') { p.state = 'air'; p.rope = null; }
      this.deaths++;
      this.deathT = 0;
      if (this.onDeath) this.onDeath(this, cause);
    }

    // ---------------- snapshots ----------------
    snapshot() {
      const p = this.player;
      return {
        player: { x: p.x, y: p.y, facing: p.facing },
        bodies: this.bodies.map((b) => ({ x: b.x, y: b.y, held: b.held, caught: b.caught })),
        levers: this.levers.map((l) => l.on),
        movers: this.movers.map((m) => m.t),
        planks: this.planks.map((k) => k.broken),
        ropes: this.ropes.map((r) => ({ theta: r.theta, omega: r.omega })),
        hazards: H.hazards.snapshot(this),
        cpIndex: this.cpIndex,
      };
    }

    restore(s) {
      this.player.reset(s.player.x, s.player.y, s.player.facing);
      s.bodies.forEach((v, i) => {
        const b = this.bodies[i]; if (!b) return;
        b.x = b.prevX = v.x; b.y = b.prevY = v.y; b.vx = b.vy = 0; b.grounded = false; b.held = !!v.held; b.caught = !!v.caught;
      });
      s.levers.forEach((on, i) => { const l = this.levers[i]; if (l) { l.on = on; l.anim = l.prevAnim = on ? 1 : 0; } });
      s.movers.forEach((t, i) => {
        const m = this.movers[i]; if (!m) return;
        m.t = t; m.x = m.prevX = m.x0 + m.ox * t; m.y = m.prevY = m.y0 + m.oy * t;
      });
      s.planks.forEach((br, i) => { if (this.planks[i]) { this.planks[i].broken = br; this.planks[i].breakT = br ? 9 : 0; } });
      s.ropes.forEach((r, i) => { const rp = this.ropes[i]; if (rp) { rp.theta = rp.prevTheta = r.theta; rp.omega = r.omega; } });
      H.hazards.restore(this, s.hazards);
      if (H.monsters) H.monsters.restore(this);
      if (H.pickups) H.pickups.restore(this);
      this.cpIndex = s.cpIndex;
      this.snap = s;
      this.computeSignals();
      this.quiet = true; this.updatePlates(); this.quiet = false;
    }

    validSnapshot(s) {
      const num = (v) => typeof v === 'number' && Number.isFinite(v);
      const arr = (a, n, f) => Array.isArray(a) && a.length === n && a.every(f);
      return !!(s && s.player && num(s.player.x) && num(s.player.y) &&
        arr(s.bodies, this.bodies.length, (b) => b && num(b.x) && num(b.y)) &&
        arr(s.levers, this.levers.length, (v) => typeof v === 'boolean') &&
        arr(s.movers, this.movers.length, num) &&
        arr(s.planks, this.planks.length, (v) => typeof v === 'boolean') &&
        arr(s.ropes, this.ropes.length, (r) => r && num(r.theta) && num(r.omega)) &&
        H.hazards.validSnapshot(this, s.hazards) &&
        Number.isInteger(s.cpIndex) && s.cpIndex >= 0 && s.cpIndex < this.checkpoints.length);
    }

    respawn() {
      this.restore(JSON.parse(JSON.stringify(this.snap)));
      this.deathT = -1;
      this.fadeInT = FADE_IN;
      if (this.runner) { this.invuln = 1.6; this.stallT = 0; }
    }

    skipToNextCheckpoint() {
      const i = Math.min(this.cpIndex + 1, this.checkpoints.length - 1);
      const cp = this.checkpoints[i];
      this.player.reset(cp.x - this.player.w / 2, cp.y - this.player.h, 1);
      this.cpIndex = i;
      this.snap = this.snapshot();
      if (this.onCheckpoint) this.onCheckpoint(this);
    }

    // ---------------- simulation ----------------
    step(dt, input) {
      this.time += dt;
      const p = this.player;
      p.prevX = p.x; p.prevY = p.y;
      for (const b of this.bodies) { b.prevX = b.x; b.prevY = b.y; b.prevAngle = b.angle; b.pushed = false; }
      for (const m of this.movers) { m.prevX = m.x; m.prevY = m.y; }
      for (const r of this.ropes) r.prevTheta = r.theta;
      for (const l of this.levers) l.prevAnim = l.anim;
      H.hazards.beginStep(this);

      if (this.deathT >= 0) {
        this.deathT += dt;
        this.fade = Math.min(1, this.deathT / DEATH_OUT);
        if (this.deathT >= DEATH_OUT + DEATH_HOLD) this.respawn();
        return;
      }
      if (this.fadeInT > 0) { this.fadeInT = Math.max(0, this.fadeInT - dt); this.fade = this.fadeInT / FADE_IN; }
      else this.fade = 0;

      if (!this.finished) p.update(this, input, dt);
      if (!p.dead) p.tickAnim(this, dt);
      this.stepBodies(dt);
      this.updatePlates();
      this.computeSignals();
      this.stepMovers(dt);
      this.stepRopes(dt);
      for (const l of this.levers) l.anim += ((l.on ? 1 : 0) - l.anim) * Math.min(1, dt * 14);
      for (const k of this.planks) if (k.broken) k.breakT += dt;
      H.hazards.step(this, dt);
      if (this.monsters.length) H.monsters.step(this, dt);
      if (H.pickups) H.pickups.step(this, dt);
      if (this.player.shieldFlash > 0) this.player.shieldFlash -= dt;
      if (this.invuln > 0) this.invuln = Math.max(0, this.invuln - dt);
      if (this.runner) this.checkStall(dt);
      this.checkProgress();
    }

    stepBodies(dt) {
      for (const b of this.bodies) {
        if (b.held) {
          const p = this.player;
          if (!p.dead && p.x + p.w / 2 >= b.zone) { b.held = false; b.vx = b.releaseVx; }
          else continue;
        }
        const sl = b.grounded ? this.slopeUnder(b) : null;
        if (b.kind === 'boulder') {
          if (b.grounded) {
            if (sl) {
              const ahead = this.slopeAtPoint(b.x + b.w / 2 + sl.down * 6, b.y + b.h);
              if ((!ahead || ahead.down !== sl.down) && Math.abs(b.vx) < 90) b.vx *= 0.5;   // settling in a valley
              else b.vx += sl.down * (sl.grade >= 1 ? 900 : 460) * dt;
            } else if (!b.pushed) b.vx = H.phys.approach(b.vx, 0, 150 * dt);
            b.vx *= (1 - 0.25 * dt);
            if (Math.abs(b.vx) < 2) b.vx = 0;
          }
          b.vx = Math.max(-430, Math.min(430, b.vx));
        } else if (b.grounded && !b.pushed) {
          b.vx = 0;
        }
        if (b.caught) b.vx = 0;
        if (b.vx !== 0 && !b.pushed) {
          const dx = b.vx * dt;
          const r = groundMoveX(this, b, dx, { exclude: b, player: true, grounded: b.grounded });
          if (r.hit) {
            if (r.hit.player && b.kind === 'boulder' && Math.abs(b.vx) > 140) this.kill('boulder');
            b.vx = r.hit.player ? 0 : -b.vx * (b.kind === 'boulder' ? 0.15 : 0);
          }
          if (!b.grounded && b.kind === 'crate') b.vx *= (1 - 0.5 * dt);
        }
        if (b.kind === 'boulder') b.angle += (b.x - b.prevX) / 15;
        b.vy = Math.min(b.vy + PHYS.G * dt, PHYS.MAX_FALL);
        const impact = b.vy;
        const ry = groundMoveY(this, b, b.vy * dt, { exclude: b, player: true, grounded: b.grounded });
        if (ry.landed) {
          const hit = ry.hit || {};
          if (hit.player && impact > 260) this.kill('crushed');
          if (hit.plank && impact >= 330) {
            hit.plank.broken = true;
            this.emit('plank', hit.plank.x + hit.plank.w / 2, hit.plank.y, 1);
            b.grounded = false;
            continue;
          }
          if (impact > 220 && !hit.player && !hit.slope) this.emit('crateLand', b.x + b.w / 2, b.y + b.h, Math.min(1, impact / 600));
          b.vy = 0; b.grounded = true;
        } else {
          if (ry.bumped) b.vy = 0;
          b.grounded = false;
        }
      }
    }

    updatePlates() {
      const p = this.player;
      for (const pl of this.plates) {
        const onIt = (b) => b.y + b.h >= pl.y - 8 && b.y + b.h <= pl.y + 3 && b.x < pl.x + pl.w && b.x + b.w > pl.x;
        let pressed = false;
        for (const b of this.bodies) if (!b.held && onIt(b)) { pressed = true; pl.byBody = true; }
        if (!p.dead && p.grounded && onIt(p)) pressed = true;
        if (pl.pressed !== pressed && !this.quiet) this.emit(pressed ? 'plate' : 'plateUp', pl.x + pl.w / 2, pl.y, 1);
        pl.pressed = pressed;
      }
    }

    computeSignals() {
      const s = this.signals;
      for (const k of Object.keys(s)) s[k] = false;
      for (const l of this.levers) s[l.id] = s[l.id] || l.on;
      for (const p of this.plates) s[p.id] = s[p.id] || p.pressed;
    }
    isWeighted(m) {
      const p = this.player;
      const on = (b) => Math.abs(b.y + b.h - m.y) < 1.5 && b.x < m.x + m.w - EPS && b.x + b.w > m.x + EPS;
      if (!p.dead && p.state === 'ground' && on(p)) return true;
      return this.bodies.some((b) => !b.held && b.grounded && on(b));
    }
    activeFor(m) {
      if (!m.needs.length) return false;
      const val = (id) => (id === 'self' ? this.isWeighted(m) : !!this.signals[id]);
      return m.any ? m.needs.some(val) : m.needs.every(val);
    }

    stepMovers(dt) {
      for (const m of this.movers) {
        const len = Math.hypot(m.ox, m.oy) || 1;
        let t = m.t;
        if (m.kind === 'crusher') {
          if (m.stopOn && this.signals[m.stopOn]) t = Math.max(0, t - dt * 1.2);
          else {
            const ph = (((this.time / m.period) + m.phase) % 1 + 1) % 1;
            if (ph < 0.4) t = Math.max(0, t - dt * 3);
            else if (ph < 0.5) t = Math.min(1, t + dt / (m.period * 0.08));
            else if (ph < 0.7) t = 1;
            else t = Math.max(0, t - dt / (m.period * 0.28));
          }
        } else {
          let want = this.activeFor(m) ? 1 : 0;
          if (m.invert) want = 1 - want;
          t = H.phys.approach(t, want, (m.speed / len) * dt);
        }
        m.moving = t !== m.t;
        if (m.kind === 'crusher' && m.t < 1 && t >= 1) this.emit('crush', m.x + m.w / 2, m.y + m.h, 1);
        if (t !== m.t) this.moveMover(m, t);
      }
    }

    moveMover(m, t) {
      const nx = m.x0 + m.ox * t, ny = m.y0 + m.oy * t;
      const mx = nx - m.x, my = ny - m.y;
      const p = this.player;
      const all = this.bodies.filter((b) => !b.held);
      const pAlive = !p.dead && p.state !== 'rope';
      if (pAlive) all.push(p);
      const riding = (b) => Math.abs(b.y + b.h - m.y) < 1.5 && b.x < m.x + m.w - EPS && b.x + b.w > m.x + EPS &&
        (b === p ? (p.state === 'ground') : b.grounded);
      const riders = all.filter(riding);
      if (riders.includes(p)) m.carriedPlayer = true;
      const opt = (b) => ({ exclude: b === p ? null : b, player: b !== p, excludeMover: m, oneWay: b === p });
      const oldX = m.x, oldY = m.y, oldT = m.t;

      if (my < 0) for (const b of riders) sweepY(b, my, this.collect(sweptArea(b, 0, my), opt(b)));
      m.x = nx; m.y = ny; m.t = t;
      if (my > 0) for (const b of riders) sweepY(b, my, this.collect(sweptArea(b, 0, my), opt(b)));
      if (mx !== 0) for (const b of riders) sweepX(b, mx, this.collect(sweptArea(b, mx, 0), opt(b)));

      for (const b of all) {
        if (!overlaps(b, m)) continue;
        // Try to shove the body out along the motion.
        if (my > 0) sweepY(b, m.y + m.h - b.y, this.collect(sweptArea(b, 0, m.y + m.h - b.y), opt(b)));
        else if (my < 0) sweepY(b, m.y - (b.y + b.h), this.collect(sweptArea(b, 0, m.y - (b.y + b.h)), opt(b)));
        if (overlaps(b, m) && mx !== 0) {
          const d = mx > 0 ? m.x + m.w - b.x : m.x - (b.x + b.w);
          sweepX(b, d, this.collect(sweptArea(b, d, 0), opt(b)));
        }
        if (overlaps(b, m)) {
          if (b === p) { this.kill('crushed'); }
          else { m.x = oldX; m.y = oldY; m.t = oldT; return; }
        }
      }
    }

    stepRopes(dt) {
      for (const r of this.ropes) {
        if (this.player.rope === r) continue;
        r.omega += (-(PHYS.G / r.len) * Math.sin(r.theta)) * dt;
        r.omega *= (1 - 0.8 * dt);
        r.theta += r.omega * dt;
      }
    }

    // Auto-run: being stopped dead against a wall or low roof (you needed to jump or slide) is fatal.
    checkStall(dt) {
      const p = this.player;
      if (p.dead || this.finished) return;
      if (p.state !== 'rope' && Math.abs(p.x - p.prevX) < 0.05 && p.state !== 'ladder') this.stallT += dt; else this.stallT = 0;
      if (this.stallT > 0.45) { this.stallT = 0; this.kill('stalled'); }
    }

    checkProgress() {
      const p = this.player;
      if (p.dead) return;
      if (p.y > this.height + 64) { this.kill('fell'); return; }
      const cx = p.x + p.w / 2;
      if (p.grounded && p.state === 'ground') {
        let i = this.cpIndex;
        while (i + 1 < this.checkpoints.length && cx >= this.checkpoints[i + 1].x) i++;
        if (i !== this.cpIndex) {
          this.cpIndex = i;
          this.snap = this.snapshot();
          if (this.onCheckpoint) this.onCheckpoint(this);
        }
      }
      if (!this.finished && cx >= this.endX) {
        this.finished = true;
        if (this.onFinish) this.onFinish(this);
      }
    }
  }

  H.World = World;
})(globalThis.Hollow = globalThis.Hollow || {});
