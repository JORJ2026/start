// Solution bot: replays a level's `solution` steps through the real Input and
// World code (no shortcuts), proving the level can be finished.
// Used by tests/run-node.js (headless) and can be driven from the browser.
(function (H) {
  'use strict';

  const TIMEOUT = 25;

  class Bot {
    constructor(world, input, steps) {
      this.w = world; this.input = input; this.steps = steps || world.level.solution || [];
      this.i = 0; this.s = {}; this.t = 0; this.status = 'running'; this.reason = '';
      this.v = {}; this.lastFeet = 0;
    }

    body(kind, i) { return kind === 'boulder' ? this.w.boulders[i] : this.w.crates[i]; }
    cx() { const p = this.w.player; return p.x + p.w / 2; }
    next() { this.i++; this.s = {}; this.t = 0; }
    fail(why) { this.status = 'fail'; this.reason = `step ${this.i} ${JSON.stringify(this.steps[this.i])}: ${why}`; }

    // Called before each world.step(): sets this.input.virtual.
    tick(dt) {
      const v = this.v = { left: false, right: false, up: false, down: false, jump: false, grab: false };
      this.input.virtual = v;
      const w = this.w, p = w.player;
      if (p.grounded) this.lastFeet = p.y + p.h;
      if (this.status !== 'running') return;
      if (w.finished) { this.status = 'done'; return; }
      if (p.dead || w.deathT >= 0) { this.fail(`player died (${p.deathCause})`); return; }
      if (this.i >= this.steps.length) { this.status = w.finished ? 'done' : 'fail'; this.reason = 'ran out of steps before the end'; return; }
      this.t += dt;
      const st = this.steps[this.i];
      if (this.t > TIMEOUT) { this.fail('timeout'); return; }
      const fn = this['do_' + st[0]];
      if (!fn) { this.fail('unknown step'); return; }
      fn.apply(this, st.slice(1));
    }

    hold(dir) { if (dir > 0) this.v.right = true; else if (dir < 0) this.v.left = true; }

    do_walk(x) {
      const s = this.s, cx = this.cx(), p = this.w.player;
      if (s.dir === undefined) { s.dir = Math.sign(x - cx) || 1; s.best = Math.abs(x - cx); s.stuck = 0; }
      if ((s.dir > 0 && cx >= x - 2) || (s.dir < 0 && cx <= x + 2)) { this.next(); return; }
      if (s.hopping) {
        this.hold(s.dir); this.v.jump = true;
        if (!p.grounded) s.air = true;
        if (s.air && p.grounded) { s.hopping = false; s.air = false; }
        return;
      }
      this.hold(s.dir);
      const d = Math.abs(x - cx);
      if (d < s.best - 0.5) { s.best = d; s.stuck = 0; } else s.stuck += 1 / 60;
      if (s.stuck > 0.8 && p.grounded) { s.hopping = true; s.stuck = 0; s.hops = (s.hops || 0) + 1; if (s.hops > 4) this.fail('stuck walking'); }
    }

    do_jump(x, dir) {
      const s = this.s, p = this.w.player, cx = this.cx();
      this.hold(dir);
      if (!s.jumped) {
        if ((dir > 0 ? cx >= x : cx <= x) && (p.grounded || p.coyote > 0)) { this.v.jump = true; s.jumped = true; }
        return;
      }
      this.v.jump = true;
      if (p.state === 'rope') { this.next(); return; }
      if (!p.grounded) s.air = true;
      else if (s.air) this.next();
    }

    do_hop(dir) {
      const s = this.s, p = this.w.player;
      if (!s.jumped) { if (!p.grounded) return; this.v.jump = true; this.hold(dir); s.jumped = true; return; }
      this.v.jump = true; this.hold(dir);
      if (!p.grounded) s.air = true;
      else if (s.air || this.t > 0.5) this.next();
    }

    do_push(kind, i, target) {
      const s = this.s, p = this.w.player, b = this.body(kind, i), cx = this.cx();
      const bcx = b.x + b.w / 2;
      const need = s.need || (s.need = Math.sign(target - bcx) || 1);
      if ((need > 0 ? bcx >= target : bcx <= target)) { this.next(); return; }
      if (s.pushedOnce && !b.grounded) { this.next(); return; }
      if (s.hop) {
        this.v.jump = true; this.hold(s.hop);
        if (!p.grounded) s.air = true;
        else if (s.air) { s.hop = 0; s.air = false; }
        return;
      }
      const onTop = Math.abs(p.y + p.h - b.y) < 2 && p.x < b.x + b.w && p.x + p.w > b.x;
      const wrongSide = need > 0 ? cx > bcx : cx < bcx;
      if (onTop) { this.hold(-need); return; }
      if (wrongSide && p.grounded) {
        const gap = need > 0 ? p.x - (b.x + b.w) : b.x - (p.x + p.w);
        if (gap < 8) { s.hop = -need; this.v.jump = true; this.hold(-need); return; }
        this.hold(-need); return;
      }
      this.hold(need);
      if (p.pushing) s.pushedOnce = true;
      if (s.last === undefined || Math.abs(bcx - s.last) > 0.3) { s.last = bcx; s.still = 0; }
      else { s.still += 1 / 60; if (s.still > 3) this.fail('push made no progress'); }
    }
    do_pushTo(kind, i, target) { this.do_push(kind, i, target); }

    do_lever(i) {
      const s = this.s, l = this.w.levers[i], cx = this.cx(), p = this.w.player;
      const x = l.x + l.w / 2;
      if (s.start === undefined) s.start = l.on;
      if (l.on !== s.start) { this.next(); return; }
      if (Math.abs(cx - x) > 4) { this.hold(Math.sign(x - cx)); return; }
      if (p.grounded && !s.pressedLast) { this.v.grab = true; s.pressedLast = true; } else s.pressedLast = false;
    }

    do_climb(dir, x) {
      const s = this.s, p = this.w.player, cx = this.cx();
      if (!s.on) {
        if (p.state === 'ladder') { s.on = true; }
        else if (Math.abs(cx - x) > 3) { this.hold(Math.sign(x - cx)); return; }
      }
      if (dir === 'up') this.v.up = true; else this.v.down = true;
      if (s.on && p.state !== 'ladder') this.next();
    }

    do_waitMover(i, t) {
      const m = this.w.movers[i];
      if (t >= 0.5 ? m.t >= t : m.t <= t) this.next();
    }

    do_waitSaw(i, kMin) {
      const s = this.s, saw = this.w.saws[i];
      const k = H.hazards.sawPhase(this.w, saw);
      if (s.prev !== undefined && k >= kMin && k > s.prev) this.next();
      s.prev = k;
    }

    do_waitCrusher(_c, ci) {
      const m = this.w.movers.filter((mm) => mm.kind === 'crusher')[ci];
      const ph = (((this.w.time / m.period) + m.phase) % 1 + 1) % 1;
      if (m.t === 0 && ph < 0.05) this.next();
    }

    do_waitBody(kind, i) {
      const s = this.s, b = this.body(kind, i);
      if (!b.held && b.grounded && Math.abs(b.vx) < 1 && Math.abs(b.y - b.prevY) < 0.01 && Math.abs(b.x - b.prevX) < 0.01) s.n = (s.n || 0) + 1; else s.n = 0;
      if (s.n > 10) this.next();
    }

    do_waitLand() { if (this.w.player.grounded && this.t > 0.05) this.next(); }
    do_wait(sec) { if (this.t >= sec) this.next(); }

    do_rope(i, landX) {
      const s = this.s, p = this.w.player, r = this.w.ropes[i], G = H.PHYS.G;
      if (s.released) {
        this.hold(1);
        if (p.grounded) this.next();
        return;
      }
      if (p.state !== 'rope') { if (this.t > 1.5) this.fail('missed the rope'); return; }
      if (r.omega >= 0) this.v.right = true; else this.v.left = true;
      if (r.omega > 0 && this.t > 0.3) {
        const L = p.ropeLen, th = r.theta, om = r.omega;
        const vx = Math.min(420, L * om * Math.cos(th)), vy = -L * om * Math.sin(th) - 260;
        const feet = p.y + p.h, land = this.lastFeet;
        const tt = (-vy + Math.sqrt(vy * vy + 2 * G * Math.max(0, land - feet))) / G;
        const xl = p.x + p.w / 2 + vx * tt;
        if (xl >= landX && xl <= landX + 180) { this.v.jump = true; s.released = true; }
      }
    }
  }

  H.Bot = Bot;
})(globalThis.Hollow = globalThis.Hollow || {});
