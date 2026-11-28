// Reactive bot for the Endless Runner. It never sees a solution: each tick it looks ahead at the
// terrain rows, traps, saws, boulders and monsters and decides to jump, slide or keep running.
(function (H) {
  'use strict';
  const TS = 32, T_APEX = 0.3;
  class RunnerBot {
    constructor(world, input, level) { this.w = world; this.input = input; this.L = level; this.groundRow = 0; this.log = []; }
    ch(c, r) { const row = this.L.rows[r]; return row && c >= 0 && c < row.length ? row[c] : '#'; }
    solid(ch) { return ch !== '.' && ch !== 'P' && ch !== 'K' && ch !== 'E' && ch !== '^'; }
    // floor info for column c scanning down from the player's ground row: {y, kind}
    floor(c) {
      let r0 = Math.max(0, this.groundRow - 3);
      while (r0 < this.groundRow && this.solid(this.ch(c, r0))) r0++;   // skip a ceiling
      for (let r = r0; r < this.L.rows.length; r++) {
        const ch = this.ch(c, r);
        if (ch === '^') return { y: r * TS, kind: 'spike' };
        if (this.solid(ch)) { const E = { '/': 0, '\\': 32, a: 16, b: 0, c: 16, d: 32 }; return { y: r * TS + ('/\\abcd'.includes(ch) ? 16 : 0), kind: 'solid', slope: '/\\abcd'.includes(ch), edge: r * TS + (E[ch] || 0) }; }
      }
      return { y: 9999, kind: 'pit' };
    }
    ceilClear(c, floorY) {
      let top = -1;
      for (let r = 0; r < this.L.rows.length; r++) { const ch = this.ch(c, r); if (this.solid(ch) && r * TS + TS <= floorY - 8) top = r; else if (r * TS > floorY - 8) break; }
      return top < 0 ? 9999 : floorY - (top + 1) * TS;
    }
    // simulate the hopper and the player together for the next second: true if they never touch
    hopperSafe(m, mx, pcx, sA, h, mode) {
      const feet0 = this.lastFeet || this.w.player.y + this.w.player.h, G = 1800, dt = 1 / 60;
      let y = m.y, vy = m.vy, timer = m.timer; const floor = m.feet - m.h;
      for (let t = dt; t < 1.1; t += dt) {
        if (y >= floor - 0.01 && vy >= 0) { timer -= dt; if (timer <= 0) { vy = -389; timer = 1.0 + 0.3 * Math.sin(m.ph); } }
        vy += G * dt; y += vy * dt; if (y > floor) { y = floor; vy = 0; }
        const px = pcx + sA * t, fy = feet0 - (mode === 'jump' ? h(t + dt) : 0);
        if (Math.abs(px - mx) < 11 + 9 + 1 && fy > y + 2 && fy - 34 < y + m.h) return false;
      }
      return true;
    }
    tick(dt) {
      const v = this.input.virtual = { left: false, right: true, up: false, down: false, jump: false, grab: false };
      const w = this.w, p = w.player;
      if (p.dead || w.deathT >= 0 || w.finished) return;
      if (p.grounded) this.lastFeet = p.y + p.h;
      if (p.grounded) this.groundRow = Math.floor((p.y + p.h - 1) / TS);
      const pcx = p.x + p.w / 2, spd = Math.max(60, Math.abs(p.vx));
      const grounded = p.grounded || p.coyote > 0;
      let want = false, crouch = false;
      const sA = Math.max(spd, 140 * (p.runScale || 1));
      // jump trajectory, clipped by a low ceiling: height h(t) above the ground
      const f0 = this.floor(Math.floor(pcx / TS));
      let room = 9999; { const fl = Math.min(f0.y, this.groundRow * TS + TS); for (const dc of [-1, 0, 1, 2]) { const c = Math.floor(pcx / TS) + dc; const ff = this.floor(c); if (ff.kind !== 'pit') room = Math.min(room, this.ceilClear(c, Math.min(ff.y, this.groundRow * TS + TS))); } }
      const rise = Math.min(80, Math.max(2, room - 34 - 2)), V = 537, G = 1800;
      this.dbgRoom = [room, rise, this.groundRow];
      const t1 = rise >= 80 ? V / G : (V - Math.sqrt(Math.max(0, V * V - 2 * G * rise))) / G;
      const h = (t) => rise >= 80 ? V * t - 0.5 * G * t * t : (t < t1 ? V * t - 0.5 * G * t * t : rise - 0.5 * G * (t - t1) * (t - t1));
      let ta = 9, tb = -9;   // window where height exceeds hz computed per threat
      const window = (hz) => { let a = 9, bb = -9; for (let t = 0; t < 1.2; t += 0.01) { if (h(t) > hz) { if (a === 9) a = t; bb = t; } } return [a, bb]; };
      const clear = (d, vm, hz, hw) => {
        const cl = sA - vm; if (cl < 5 || d < -hw) return false;
        const te = (d - hw) / cl, tx = (d + hw) / cl, w2 = window(hz);
        if (w2[0] === 9) return false;
        if (te > w2[0] + 0.005) return false;           // too early: wait
        if (tx <= w2[1]) return true;                   // whole overlap is inside the safe window
        return te <= w2[0] - 0.01 ? true : false;       // out of time: try anyway
      };
      // --- terrain: simulate "keep running" and "jump now" against the tile rows ---
      const feet0 = p.grounded ? p.y + p.h : (this.lastFeet || p.y + p.h);
      const sim = (jump, horizon) => {
        let feet = feet0, air = jump;
        for (let t = 0.02; t <= (horizon || 1.0); t += 0.02) {
          const x = pcx + sA * t, fC = this.floor(Math.floor(x / TS)), fF = this.floor(Math.floor((x + 9) / TS));
          if (air) {
            feet = feet0 - h(t);
            if (fF.kind === 'solid' && feet > fF.y + (fF.slope ? 16 : 3)) return false;
            if (t > 0.08 && fC.kind !== 'pit' && feet >= fC.y - 1) { if (fC.kind === 'spike') return false; air = false; feet = fC.y; }
            else if (feet > feet0 + 220) return false;
          } else {
            if (fC.kind === 'pit' || fC.kind === 'spike') { if (fC.kind === 'pit' && this.floor(Math.floor((x - 9) / TS)).kind !== 'pit') continue; return false; }
            if (fF.kind === 'solid' && !fF.slope && fF.y < feet - 14) return false;
            if (fF.kind === 'spike') return false;
            feet = fC.y;
          }
        }
        return true;
      };
      this.dbgSim = [sim(false) ? 1 : 0, sim(true) ? 1 : 0];
      if (grounded && !sim(false) && (sim(true) || !sim(false, 0.35))) { want = true; this.why = 'terrain'; }
      // --- low ceilings: slide ---
      for (let c = Math.floor((pcx - 16) / TS); c <= Math.floor((pcx + 70) / TS); c++) {
        const f = this.floor(c); if (f.kind === 'pit') continue;
        if (this.ceilClear(c, Math.min(f.y, this.groundRow * TS + TS)) < 44) crouch = true;
      }
      // --- entities ---
      for (const m of w.monsters) {
        const mx = m.x + m.w / 2, d = mx - pcx;
        if (d < -70 || d > 320) continue;
        if (m.k === 'bat') { if (d > -50 && d < 110) crouch = true; continue; }
        let vx = m.vx || 0;
        if (m.k === 'charger' && m.state !== 'charge') vx = (m.state === 'spent') ? 0 : -190;
        if (m.k === 'burrower') vx = 0;
        if (m.k === 'hopper') { if (d > -10 && d < 200 && this.hopperSafe(m, mx, pcx, sA, h, 'jump') && !this.hopperSafe(m, mx, pcx, sA, h, 'run')) { want = true; this.why = "hopper"; }; continue; }
        if (clear(d, vx, m.h + 2, m.w / 2 + 11)) { want = true; this.why = "mon"; };
      }
      for (const t of w.traps) if (t.armed) { const mx = t.x + t.w / 2; if (mx - pcx < 240 && clear(mx - pcx, 0, 8, 13 + 11)) { want = true; this.why = "trap"; }; }
      for (const s of w.saws) {
        if (Math.abs(s.cx - pcx) > 300) continue;
        const gy = this.lastFeet || p.y + p.h;
        let mx = s.cx;
        for (let it = 0; it < 3; it++) { const tt = Math.max(0, (mx - pcx) / sA); const k = H.hazards.sawPhase({ time: w.time + tt }, s); mx = s.x0 + s.dx * k; }
        const vsaw = 0, hz = gy - (s.y0 + s.dy * 0.5 - s.r) + 3;
        if (clear(mx - pcx, vsaw, hz, s.r + 9)) { want = true; this.why = "saw"; };
      }
      for (const bo of w.bodies) if (bo.kind === 'boulder' && !bo.held) { const mx = bo.x + bo.w / 2, d = mx - pcx; if (d > -40 && d < 300 && clear(d, bo.vx, bo.h + 3, bo.w / 2 + 10)) { want = true; this.why = "boulder"; }; }
      if (grounded && want && !crouch) { v.jump = true; }
      if (grounded && crouch) v.down = true;
      if (!grounded && crouch) v.down = true;
      v.up = false;
      if (!p.grounded && p.vy < 0 && want) v.jump = true;
      if (!p.grounded) v.jump = p.vy < 0 && this.prevJump;   // hold jump only while rising from a jump (no buffered re-jump on landing)
      else if (this.prevJump && p.grounded) v.jump = false;   // release first so the next press is a fresh edge
      this.prevJump = v.jump;
    }
  }
  H.RunnerBot = RunnerBot;
})(globalThis.Hollow = globalThis.Hollow || {});
