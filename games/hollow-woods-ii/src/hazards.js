// Hazards: spike tiles, bear traps (sprung harmlessly by crates/boulders),
// moving saw blades (can be retracted by a signal). Crushers live in world.movers.
(function (H) {
  'use strict';
  const { TS, T } = H;
  const { overlaps } = H.phys;

  function circleRect(cx, cy, r, b) {
    const nx = Math.max(b.x, Math.min(cx, b.x + b.w)), ny = Math.max(b.y, Math.min(cy, b.y + b.h));
    return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
  }

  const hazards = {
    init(world, level) {
      world.traps = (level.traps || []).map((t) => ({ x: t.x * TS + 3, y: (t.y + 1) * TS - 10, w: 26, h: 10, armed: true, snapT: 0 }));
      world.saws = (level.saws || []).map((s) => ({
        x0: s.x * TS + TS / 2, y0: s.y * TS + TS / 2, dx: (s.dx || 0) * TS, dy: (s.dy || 0) * TS,
        r: s.r || 22, period: s.period || 2, phase: s.phase || 0, stopOn: s.stopOn || null,
        cx: 0, cy: 0, prevCx: 0, prevCy: 0, spin: 0, retract: 0, prevRetract: 0,
      }));
      for (const s of world.saws) { hazards.placeSaw(world, s); s.prevCx = s.cx; s.prevCy = s.cy; }
    },

    sawPhase(world, s) {
      return 0.5 - 0.5 * Math.cos(2 * Math.PI * (world.time / s.period + s.phase));
    },
    placeSaw(world, s) {
      const k = hazards.sawPhase(world, s);
      s.cx = s.x0 + s.dx * k; s.cy = s.y0 + s.dy * k;
    },

    beginStep(world) {
      for (const s of world.saws) { s.prevCx = s.cx; s.prevCy = s.cy; s.prevRetract = s.retract; }
    },

    step(world, dt) {
      const p = world.player;
      const alive = () => !p.dead;
      // Saws
      for (const s of world.saws) {
        const off = s.stopOn && world.signals[s.stopOn];
        s.retract = H.phys.approach(s.retract, off ? 1 : 0, dt * 2.5);
        if (s.retract < 1) { hazards.placeSaw(world, s); s.spin += dt * 14 * (1 - s.retract); }
        if (alive() && s.retract < 0.5 && Math.abs(s.cx - world.player.x) < 120) {
          const hb = { x: p.x + 2, y: p.y + 2, w: p.w - 4, h: p.h - 3 };
          if (circleRect(s.cx, s.cy, s.r * 0.86 * (1 - s.retract), hb)) world.kill('saw');
        }
      }
      // Bear traps
      for (const t of world.traps) {
        if (!t.armed) { t.snapT += dt; continue; }
        for (const b of world.bodies) {
          if (!b.held && overlaps(b, t)) { t.armed = false; world.emit('trap', t.x + t.w / 2, t.y, 1); b.caught = true; b.vx = 0; break; }
        }
        if (t.armed && alive() && overlaps({ x: p.x + 3, y: p.y, w: p.w - 6, h: p.h }, t)) { t.armed = false; world.emit('trap', t.x + t.w / 2, t.y, 1); world.kill('trap'); }
      }
      // Spike tiles
      if (alive()) {
        const c0 = Math.floor(p.x / TS), c1 = Math.floor((p.x + p.w) / TS);
        const r0 = Math.floor(p.y / TS), r1 = Math.floor((p.y + p.h) / TS);
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
          if (world.tileAt(c, r) !== T.SPIKE) continue;
          if (overlaps(p, { x: c * TS + 3, y: r * TS + 14, w: TS - 6, h: TS - 14 })) { world.kill('spikes'); return; }
        }
      }
    },

    snapshot(world) {
      return { traps: world.traps.map((t) => t.armed) };
    },
    restore(world, s) {
      s.traps.forEach((a, i) => { const t = world.traps[i]; if (t) { t.armed = a; t.snapT = a ? 0 : 9; } });
    },
    validSnapshot(world, s) {
      return !!(s && Array.isArray(s.traps) && s.traps.length === world.traps.length && s.traps.every((v) => typeof v === 'boolean'));
    },
  };

  H.hazards = hazards;
})(globalThis.Hollow = globalThis.Hollow || {});
