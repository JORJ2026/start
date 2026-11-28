// Monsters for the Endless Runner. Six kinds, all deterministic (no randomness in the sim):
//   crawler  - low bug patrolling the ground (jump it)
//   walker   - tall shade patrolling the ground (jump it)
//   hopper   - blob that hops on the spot (time it, or jump)
//   bat      - flies at head height (slide under it)
//   charger  - winds up, then dashes at you (jump it)
//   burrower - mound that shakes, then erupts (jump it)
// Touching one kills. Each has a pulsing white outline like every other hazard.
(function (H) {
  'use strict';
  const { TS, PHYS } = H;
  const { overlaps } = H.phys;

  const SPEC = {
    crawler: { w: 30, h: 14, v: 42 }, walker: { w: 20, h: 30, v: 34 }, hopper: { w: 22, h: 22 },
    bat: { w: 28, h: 12 }, charger: { w: 28, h: 24 }, burrower: { w: 26, h: 22 },
  };
  const TYPES = Object.keys(SPEC);
  const EYE = '#f7f7f1', BODY = '#0a0a0a';

  function reset(m) {
    m.t = 0; m.state = 'idle'; m.timer = 0; m.dir = -1; m.vy = 0; m.cx = m.hx; m.squash = 0; m.up = 0;
    m.growled = false; m.screeched = false; m.vx = 0;
    m.y = m.k === 'bat' ? m.feet - 38 - m.h / 2 : m.feet - m.h;
    m.x = m.hx - m.w / 2; m.prevX = m.x; m.prevY = m.y;
    if (m.k === 'hopper') m.timer = 0.3 + (m.ph % 1);
  }

  function make(d, i) {
    const s = SPEC[d.k];
    const m = { k: d.k, i, w: s.w, h: s.h, hx: d.x * TS, feet: d.y * TS, r: (d.r || 0) * TS, ph: i * 1.7 + (d.ph || 0) };
    reset(m);
    return m;
  }

  function hitbox(m) {
    if (m.k === 'burrower') { const hh = m.h * m.up; return m.up > 0.55 ? { x: m.cx - 13, y: m.feet - hh, w: 26, h: hh } : null; }
    return { x: m.x + 2, y: m.y + 2, w: m.w - 4, h: m.h - 3 };
  }

  const monsters = {
    TYPES,
    init(world, level) { world.monsters = (level.monsters || []).map(make); },
    restore(world) { for (const m of world.monsters || []) reset(m); },

    step(world, dt) {
      const list = world.monsters;
      if (!list || !list.length) return;
      const p = world.player, pcx = p.x + p.w / 2;
      for (const m of list) {
        m.prevX = m.x; m.prevY = m.y; m.t += dt;
        // far-away monsters sleep (cheap) except they keep their place
        if (Math.abs(m.hx - pcx) > 1400) continue;
        switch (m.k) {
          case 'crawler': case 'walker': {
            m.cx += m.dir * SPEC[m.k].v * dt;
            if (m.cx < m.hx - m.r) { m.cx = m.hx - m.r; m.dir = 1; }
            if (m.cx > m.hx + m.r) { m.cx = m.hx + m.r; m.dir = -1; }
            m.x = m.cx - m.w / 2; m.vx = m.dir * SPEC[m.k].v; break;
          }
          case 'hopper': {
            const floor = m.feet - m.h;
            if (m.y >= floor - 0.01 && m.vy >= 0) { m.timer -= dt; if (m.timer <= 0) { m.vy = -389; m.timer = 1.0 + 0.3 * Math.sin(m.ph); } }
            m.vy += PHYS.G * dt; m.y += m.vy * dt;
            if (m.y > floor) { m.y = floor; if (m.vy > 200) m.squash = 1; m.vy = 0; }
            m.squash = Math.max(0, m.squash - dt * 6); break;
          }
          case 'bat': {
            const a = m.t * 0.9 + m.ph;
            m.cx = m.hx + Math.sin(a) * m.r; m.x = m.cx - m.w / 2; m.dir = Math.cos(a) >= 0 ? 1 : -1; m.vx = Math.cos(a) * 0.9 * m.r;
            m.y = m.feet - 38 - m.h / 2 + Math.sin(m.t * 2.4 + m.ph) * 7;
            if (!m.screeched && Math.abs(pcx - m.cx) < 170) { m.screeched = true; world.emit && world.emit('screech', m.cx, m.y, 1); }
            if (m.screeched && Math.abs(pcx - m.cx) > 420) m.screeched = false;
            break;
          }
          case 'charger': {
            const dx = m.cx - pcx;
            if (m.state === 'idle' && !p.dead && dx > 0 && dx < 270 && Math.abs(p.y + p.h - m.feet) < 80) { m.state = 'wind'; m.timer = 0.35; world.emit && world.emit('growl', m.cx, m.feet, 1); }
            else if (m.state === 'wind') { m.timer -= dt; if (m.timer <= 0) { m.state = 'charge'; m.timer = 1.5; } }
            else if (m.state === 'charge') { m.timer -= dt; m.cx -= 190 * dt; m.vx = -190; if (m.timer <= 0) { m.state = 'spent'; m.vx = 0; } }
            m.dir = -1; m.x = m.cx - m.w / 2 + (m.state === 'wind' ? Math.sin(m.t * 60) * 1.2 : 0); break;
          }
          case 'burrower': {
            const dx = m.cx - pcx;
            if (m.state === 'idle') { if (!p.dead && dx > 0 && dx < 150) { m.state = 'warn'; m.timer = 0.55; } }
            else if (m.state === 'warn') { m.timer -= dt; if (m.timer <= 0) { m.state = 'up'; m.timer = 0.95; world.emit && world.emit('growl', m.cx, m.feet, 1); } }
            else if (m.state === 'up') { m.up = Math.min(1, m.up + dt * 8); m.timer -= dt; if (m.timer <= 0) { m.state = 'down'; m.timer = 0.6; } }
            else if (m.state === 'down') { m.up = Math.max(0, m.up - dt * 3); m.timer -= dt; if (m.timer <= 0) m.state = 'idle'; }
            m.x = m.cx - m.w / 2; break;
          }
        }
        if (!p.dead && Math.abs(m.x - p.x) < 80) {
          const hb = hitbox(m);
          if (hb && overlaps({ x: p.x + 2, y: p.y + 3, w: p.w - 4, h: p.h - 4 }, hb)) world.kill('monster');
        }
      }
    },

    // ---------- drawing (also used for the glow outline pass) ----------
    draw(ctx, m, time, a, glow) {
      const x = m.prevX + (m.x - m.prevX) * a + m.w / 2, y = m.prevY + (m.y - m.prevY) * a;
      const feet = m.feet, f = m.dir >= 0 ? 1 : -1;
      const P = () => (glow ? ctx.stroke() : ctx.fill());
      const T = time * 8 + m.ph;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (!glow) { ctx.fillStyle = BODY; ctx.strokeStyle = BODY; }
      const eye = (ex, ey, r) => { if (glow) return; ctx.shadowColor = 'rgba(255,255,255,.9)'; ctx.shadowBlur = 5; ctx.fillStyle = EYE; ctx.beginPath(); ctx.arc(ex, ey, r, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = BODY; };
      const line = (x0, y0, x1, y1, w) => { ctx.lineWidth = glow ? 1.4 : w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
      ctx.lineWidth = 1.4;
      switch (m.k) {
        case 'crawler': {
          ctx.translate(x, feet); ctx.scale(f, 1);
          for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const sw = Math.sin(T * 1.4 + i * 1.3 + (s > 0 ? 1.7 : 0)) * 3; const lx = -9 + i * 9 + sw; line(-9 + i * 9, -7, lx + s * 2, 0, 2); }
          ctx.beginPath(); ctx.ellipse(0, -8, 14, 6, 0, 0, 6.283); P();
          ctx.beginPath(); ctx.ellipse(12, -9, 5, 4.5, 0, 0, 6.283); P();
          line(14, -12, 20, -17 + Math.sin(T) * 2, 1.4); line(12, -12, 16, -18 + Math.cos(T) * 2, 1.4);
          eye(14, -9.5, 1.5); eye(10.5, -9.5, 1.3); break;
        }
        case 'walker': {
          ctx.translate(x, feet); ctx.scale(f, 1);
          const sw = Math.sin(T * 0.9) * 5;
          line(-1, -11, -1 + sw, 0, 3); line(2, -11, 2 - sw, 0, 3);
          ctx.beginPath(); ctx.moveTo(-5, -21); ctx.lineTo(5, -21); ctx.lineTo(3.5, -10); ctx.lineTo(-3.5, -10); ctx.closePath(); P();
          line(-3, -20, 4 + sw * 0.5, -9, 2.2); line(3, -20, 10 - sw * 0.5, -10, 2.2);
          ctx.beginPath(); ctx.ellipse(1, -26, 5, 5.5, 0, 0, 6.283); P();
          eye(3.5, -27, 1.6); eye(-0.5, -27, 1.4); break;
        }
        case 'hopper': {
          const sq = m.squash, air = Math.abs(m.vy) > 20 ? 1 : 0;
          ctx.translate(x, y + m.h); ctx.scale(1 + sq * 0.25 + air * -0.08, 1 - sq * 0.3 + air * 0.12);
          ctx.beginPath(); ctx.ellipse(0, -10, 11, 10, 0, 0, 6.283); P();
          line(-5, -2, -7, 1, 2.4); line(5, -2, 7, 1, 2.4);
          line(-8, -17, -11, -21 + Math.sin(T) * 1.5, 1.6); line(8, -17, 11, -21 + Math.cos(T) * 1.5, 1.6);
          eye(-3.5, -11, 2.2); eye(3.5, -11, 2.2); break;
        }
        case 'bat': {
          ctx.translate(x, y + m.h / 2); ctx.scale(f, 1);
          const fl = Math.sin(T * 1.8);
          ctx.beginPath(); ctx.moveTo(-2, -1); ctx.quadraticCurveTo(-10, -9 * fl - 3, -22, -3 * fl + 2); ctx.lineTo(-17, 2); ctx.lineTo(-12, 0); ctx.lineTo(-7, 3); ctx.lineTo(-2, 2); ctx.closePath(); P();
          ctx.beginPath(); ctx.moveTo(2, -1); ctx.quadraticCurveTo(10, -9 * fl - 3, 22, -3 * fl + 2); ctx.lineTo(17, 2); ctx.lineTo(12, 0); ctx.lineTo(7, 3); ctx.lineTo(2, 2); ctx.closePath(); P();
          ctx.beginPath(); ctx.ellipse(0, 1, 6, 5.5, 0, 0, 6.283); P();
          ctx.beginPath(); ctx.moveTo(-4, -3); ctx.lineTo(-5, -9); ctx.lineTo(-1, -4); ctx.moveTo(4, -3); ctx.lineTo(5, -9); ctx.lineTo(1, -4); P();
          eye(-2.2, 0, 1.4); eye(2.2, 0, 1.4); break;
        }
        case 'charger': {
          const run = m.state === 'charge', wind = m.state === 'wind';
          ctx.translate(x, feet); ctx.scale(f, 1);
          const sw = run ? Math.sin(T * 3) * 6 : 0, crouch = wind ? 3 : 0;
          for (const lx of [-9, -3, 4, 10]) line(lx, -9 + crouch, lx + (lx > 0 ? sw : -sw), 0, 3);
          ctx.beginPath(); ctx.ellipse(0, -13 + crouch, 14, 10, 0, 0, 6.283); P();
          ctx.beginPath(); ctx.ellipse(14, -14 + crouch, 7, 6.5, 0, 0, 6.283); P();
          ctx.beginPath(); ctx.moveTo(17, -19 + crouch); ctx.lineTo(25, -25 + crouch); ctx.lineTo(20, -14 + crouch); ctx.closePath(); P();
          ctx.beginPath(); ctx.moveTo(-14, -16 + crouch); ctx.lineTo(-20, -22 + crouch); ctx.lineTo(-12, -20 + crouch); P();
          eye(16, -15 + crouch, 1.6); break;
        }
        case 'burrower': {
          const up = m.up, shake = m.state === 'warn' ? Math.sin(time * 70) * 1.6 : 0;
          ctx.translate(x + shake, feet);
          ctx.beginPath(); ctx.ellipse(0, 0, 17, 4 + (m.state === 'warn' ? 3 : 0), 0, Math.PI, 0); P();
          if (up > 0.05) {
            const hgt = 22 * up;
            ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-6, -hgt * 0.6); ctx.lineTo(-10, -hgt * 0.9); ctx.lineTo(-3, -hgt * 0.75); ctx.lineTo(0, -hgt); ctx.lineTo(3, -hgt * 0.75); ctx.lineTo(10, -hgt * 0.9); ctx.lineTo(6, -hgt * 0.6); ctx.lineTo(9, 0); ctx.closePath(); P();
            if (up > 0.6) { eye(-2.5, -hgt * 0.62, 1.7); eye(2.5, -hgt * 0.62, 1.7); }
          }
          break;
        }
      }
      ctx.restore();
    },
  };

  H.monsters = monsters;
})(globalThis.Hollow = globalThis.Hollow || {});
