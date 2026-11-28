// Collectible shield orbs. Pick one up and a glowing bubble guards you: it soaks up the next hit from
// spikes, bear traps, saws, monsters or a rolling boulder (you then get a moment of invulnerability).
// You can hold up to two. Orbs are placed near the start and by every checkpoint; they come back
// whenever you respawn, and the shield is lost when you die.
(function (H) {
  'use strict';
  const { TS, T } = H;
  const MAX = 2, SHIELDED = { spikes: 1, trap: 1, saw: 1, monster: 1, boulder: 1 };
  function groundAt(world, c, r0) {
    for (let r = Math.max(0, r0 - 6); r < Math.min(world.rows - 1, r0 + 8); r++) {
      const t = world.tileAt(c, r), above = world.tileAt(c, r - 1);
      if (t !== T.EMPTY && t !== T.LADDER && t !== T.SPIKE && above === T.EMPTY) return r;
    }
    return -1;
  }
  const pickups = {
    SHIELDED, MAX,
    init(world, level) {
      world.pickups = [];
      const spots = [];
      world.checkpoints.forEach((cp, i) => spots.push(Math.floor(cp.x / TS) + (i === 0 ? 6 : 4)));
      for (const c of spots) {
        const r = groundAt(world, c, Math.floor(world.start.y / TS));
        let rr = r;
        if (rr < 0) { for (const cp of world.checkpoints) { const q = groundAt(world, c, Math.floor(cp.y / TS)); if (q >= 0) { rr = q; break; } } }
        if (rr < 0) continue;
        world.pickups.push({ x: c * TS + TS / 2, y: rr * TS - 20, got: false, ph: c * 0.7 });
      }
    },
    restore(world) { for (const k of world.pickups || []) k.got = false; world.player.shield = 0; },
    step(world, dt) {
      const p = world.player;
      if (p.shield === undefined) p.shield = 0;
      if (p.dead) return;
      for (const k of world.pickups) {
        if (k.got || p.shield >= MAX) continue;
        if (Math.abs(k.x - (p.x + p.w / 2)) < 20 && Math.abs(k.y - (p.y + p.h / 2)) < 30) {
          k.got = true; p.shield++; world.emit('pickup', k.x, k.y, 1);
        }
      }
    },
    // returns true if the shield absorbed this hit
    absorb(world, cause) {
      const p = world.player;
      if (!(p.shield > 0) || !SHIELDED[cause]) return false;
      p.shield--; world.invuln = 1.3; world.emit('shieldBreak', p.x + p.w / 2, p.y + p.h / 2, 1);
      p.shieldFlash = 0.5;
      return true;
    },
    draw(ctx, world, time) {
      for (const k of world.pickups || []) {
        if (k.got) continue;
        const y = k.y + Math.sin(time * 2.2 + k.ph) * 4, pulse = 0.5 + 0.5 * Math.sin(time * 3 + k.ph);
        ctx.save(); ctx.translate(k.x, y);
        ctx.shadowColor = 'rgba(150,225,255,.95)'; ctx.shadowBlur = 10 + 8 * pulse;
        ctx.strokeStyle = 'rgba(170,230,255,.95)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 9 + pulse, 0, 6.283); ctx.stroke();
        ctx.rotate(time * 1.2); ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(4.5, 0); ctx.lineTo(0, 5); ctx.lineTo(-4.5, 0); ctx.closePath(); ctx.fillStyle = 'rgba(210,240,255,.95)'; ctx.fill();
        ctx.restore();
      }
    },
    drawShield(ctx, p, time) {
      if (!(p.shield > 0) && !(p.shieldFlash > 0)) return;
      const cx = p.x + p.w / 2, cy = p.y + p.h / 2, pulse = 0.5 + 0.5 * Math.sin(time * 4);
      ctx.save(); ctx.translate(cx, cy);
      ctx.shadowColor = 'rgba(150,225,255,.95)'; ctx.shadowBlur = 12 + 6 * pulse;
      for (let i = 0; i < Math.max(1, p.shield || 0); i++) {
        ctx.strokeStyle = `rgba(170,230,255,${0.55 + 0.3 * pulse})`; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.ellipse(0, 0, 17 + i * 5 + pulse, 25 + i * 5 + pulse, 0, 0, 6.283); ctx.stroke();
        ctx.save(); ctx.rotate(time * (1 + i)); ctx.beginPath(); ctx.arc(0, 0, 21 + i * 5, 0, 1.2); ctx.stroke(); ctx.restore();
      }
      if (p.shieldFlash > 0) { ctx.strokeStyle = `rgba(255,255,255,${p.shieldFlash * 2})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 20 + (0.5 - p.shieldFlash) * 90, 0, 6.283); ctx.stroke(); }
      ctx.restore();
    },
  };
  H.pickups = pickups;
})(globalThis.Hollow = globalThis.Hollow || {});
