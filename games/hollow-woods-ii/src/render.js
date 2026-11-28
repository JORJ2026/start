// Stage-1 grey-box renderer + camera. Positions are interpolated between
// physics steps so motion is smooth at any refresh rate.
// (Stage 2 replaces the flat look with parallax, fog, grain and lighting.)
(function (H) {
  'use strict';
  const { TS } = H;
  const VIEW_W = 960, VIEW_H = 540;
  H.VIEW = { W: VIEW_W, H: VIEW_H };
  const lerp = (a, b, t) => a + (b - a) * t;

  class Camera {
    constructor() { this.x = 0; this.y = 0; this.prevX = 0; this.prevY = 0; this.look = 0; }
    target(world) {
      const p = world.player;
      return { x: p.x + p.w / 2 + this.look - VIEW_W / 2, y: p.y + p.h / 2 - 40 - VIEW_H / 2 };
    }
    clamp(world) {
      this.x = Math.max(0, Math.min(this.x, world.width - VIEW_W));
      this.y = Math.max(Math.min(0, world.height - VIEW_H), Math.min(this.y, world.height - VIEW_H));
    }
    snap(world) {
      this.look = world.player.facing * (world.runner ? 150 : 70);
      const t = this.target(world);
      this.x = t.x; this.y = t.y; this.clamp(world);
      this.prevX = this.x; this.prevY = this.y;
    }
    update(world, dt) {
      this.prevX = this.x; this.prevY = this.y;
      if (world.fadeInT > 0 && world.fade > 0.95) { this.snap(world); return; }
      this.look += (world.player.facing * (world.runner ? 150 : 70) - this.look) * (1 - Math.exp(-dt * 1.5));
      const t = this.target(world);
      const k = 1 - Math.exp(-dt * 4);
      this.x += (t.x - this.x) * k;
      this.y += (t.y - this.y) * (1 - Math.exp(-dt * 3));
      this.clamp(world);
    }
  }

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.scale = 1;
      this.resize();
    }

    resize() {
      const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
      const s = Math.min(innerWidth / VIEW_W, innerHeight / VIEW_H);
      this.scale = s;
      this.canvas.style.width = Math.floor(VIEW_W * s) + 'px';
      this.canvas.style.height = Math.floor(VIEW_H * s) + 'px';
      this.canvas.width = Math.floor(VIEW_W * s * dpr);
      this.canvas.height = Math.floor(VIEW_H * s * dpr);
      this.ctx.setTransform(s * dpr, 0, 0, s * dpr, 0, 0);
    }

    // Canvas-space -> view-space (for mouse clicks on menus).
    toView(clientX, clientY) {
      const r = this.canvas.getBoundingClientRect();
      return { x: (clientX - r.left) / r.width * VIEW_W, y: (clientY - r.top) / r.height * VIEW_H };
    }

    drawWorld(world, cam, a, debug, weather, opts = {}) {
      const ctx = this.ctx;
      const cx = Math.round(lerp(cam.prevX, cam.x, a)), cy = Math.round(lerp(cam.prevY, cam.y, a));

      const th = H.theme(world);
      const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      sky.addColorStop(0, th.sky[0]); sky.addColorStop(1, th.sky[1]);
      ctx.fillStyle = sky; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      H.fx.drawAbstract(ctx, th, cx, cy, world.time);
      H.fx.drawAbstract2(ctx, th, cx, cy, world.time);
      H.fx.drawBackdrop(ctx, th, cx, cy, world.time);
      const glowK = 0.55 + 0.45 * Math.sin(world.time * 3.2);
      const spikes = [];

      ctx.save();
      ctx.translate(-cx, -cy);
      const c0 = Math.max(0, Math.floor(cx / TS)), c1 = Math.min(world.cols - 1, Math.floor((cx + VIEW_W) / TS));
      const r0 = Math.max(0, Math.floor(cy / TS)), r1 = Math.min(world.rows - 1, Math.floor((cy + VIEW_H) / TS));

      const T = H.T, slopeY = H.phys.slopeY;
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const t = world.tiles[r * world.cols + c];
          if (!t) continue;
          const x = c * TS, y = r * TS;
          if (t === T.SOLID) {
            ctx.fillStyle = th.ground; ctx.fillRect(x - 0.5, y - 0.5, TS + 1, TS + 1);
            const above = world.tileAt(c, r - 1);
            if (above === T.EMPTY || above === T.SPIKE || above === T.LADDER) { ctx.fillStyle = th.edge; ctx.fillRect(x, y, TS, 3); }
          } else if (t === T.LADDER) {
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(x + 7, y, 3, TS); ctx.fillRect(x + TS - 10, y, 3, TS);
            for (let i = 4; i < TS; i += 9) ctx.fillRect(x + 7, y + i, TS - 14, 2);
          } else if (t === T.SPIKE) {
            spikes.push(x, y);
            ctx.fillStyle = '#111';
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
              const sx = x + i * 8;
              ctx.moveTo(sx, y + TS); ctx.lineTo(sx + 4, y + 12 + (i % 2) * 4); ctx.lineTo(sx + 8, y + TS);
            }
            ctx.fill();
          } else {
            const y0 = slopeY(t, 0), y1 = slopeY(t, TS);
            ctx.fillStyle = th.ground;
            ctx.beginPath(); ctx.moveTo(x - 0.5, y + y0); ctx.lineTo(x + TS + 0.5, y + y1); ctx.lineTo(x + TS + 0.5, y + TS + 0.5); ctx.lineTo(x - 0.5, y + TS + 0.5); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = th.edge; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(x, y + y0 + 1); ctx.lineTo(x + TS, y + y1 + 1); ctx.stroke();
          }
        }
      }

      // planks
      for (const k of world.planks) {
        if (!k.broken) {
          ctx.fillStyle = '#2b2622'; ctx.fillRect(k.x, k.y, k.w, k.h);
          ctx.fillStyle = '#3a342e';
          for (let i = 0; i < k.w; i += 16) ctx.fillRect(k.x + i + 1, k.y + 1, 14, 3);
        } else if (k.breakT < 1.2) {
          const f = k.breakT;
          ctx.fillStyle = `rgba(43,38,34,${1 - f / 1.2})`;
          for (let i = 0; i < 4; i++) ctx.fillRect(k.x + i * k.w / 4 + (i - 1.5) * f * 20, k.y + f * f * 260 + i * 3, k.w / 4 - 2, 6);
        }
      }

      // plates
      for (const pl of world.plates) {
        ctx.fillStyle = '#3a3a3a';
        const d = pl.pressed ? 3 : 0;
        ctx.fillRect(pl.x + 2, pl.y - 5 + d, pl.w - 4, 5 - d);
      }

      // levers
      for (const l of world.levers) {
        const an = lerp(l.prevAnim, l.anim, a);
        const bx = l.x + l.w / 2, by = l.y + l.h;
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(bx - 8, by - 6, 16, 6);
        const ang = -0.7 + an * 1.4;
        ctx.strokeStyle = '#141414'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(bx, by - 5); ctx.lineTo(bx + Math.sin(ang) * 22, by - 5 - Math.cos(ang) * 22); ctx.stroke();
        ctx.fillStyle = '#141414'; ctx.beginPath(); ctx.arc(bx + Math.sin(ang) * 22, by - 5 - Math.cos(ang) * 22, 3.5, 0, Math.PI * 2); ctx.fill();
      }

      // movers: gates, lifts, bridges, crushers
      for (const m of world.movers) {
        const x = lerp(m.prevX, m.x, a), y = lerp(m.prevY, m.y, a);
        if (m.kind === 'gate') {
          ctx.fillStyle = '#151515'; ctx.fillRect(x, y, m.w, m.h);
          ctx.fillStyle = '#2b2b2b';
          for (let yy = y + 6; yy < y + m.h - 2; yy += 14) ctx.fillRect(x + 2, yy, m.w - 4, 2);
        } else if (m.kind === 'crusher') {
          ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(x + m.w / 2, m.y0 - 2); ctx.lineTo(x + m.w / 2, y); ctx.stroke();
          ctx.fillStyle = '#121212'; ctx.fillRect(x, y, m.w, m.h);
          ctx.fillStyle = '#262626'; ctx.fillRect(x + 3, y + m.h - 6, m.w - 6, 3);
        } else {
          ctx.fillStyle = '#181818'; ctx.fillRect(x, y, m.w, m.h);
          ctx.fillStyle = '#303030'; ctx.fillRect(x, y, m.w, 3);
          if (m.kind === 'lift') {
            ctx.strokeStyle = 'rgba(20,20,20,.7)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x + 6, y); ctx.lineTo(x + 6, y - 2000); ctx.moveTo(x + m.w - 6, y); ctx.lineTo(x + m.w - 6, y - 2000); ctx.stroke();
          }
        }
      }

      // bear traps
      for (const t of world.traps) {
        ctx.fillStyle = '#121212';
        ctx.fillRect(t.x, t.y + 7, t.w, 3);
        const close = t.armed ? 0 : Math.min(1, t.snapT * 10 + (t.snapT > 0 ? 0.6 : 1));
        const open = 1 - close;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const tx = t.x + 2 + i * 5.5;
          ctx.moveTo(tx, t.y + 8); ctx.lineTo(tx + 2.5, t.y + 8 - (2 + 6 * open)); ctx.lineTo(tx + 5, t.y + 8);
        }
        ctx.fill();
        if (!t.armed) { ctx.fillRect(t.x + 4, t.y + 1, t.w - 8, 5); }
      }

      // saws
      for (const sw of world.saws) {
        const ret = lerp(sw.prevRetract, sw.retract, a);
        if (ret >= 1) continue;
        const sx = lerp(sw.prevCx, sw.cx, a), sy = lerp(sw.prevCy, sw.cy, a);
        const rr = sw.r * (1 - ret);
        ctx.fillStyle = '#0d0d0d';
        ctx.beginPath();
        const teeth = 14;
        for (let i = 0; i <= teeth * 2; i++) {
          const ang = sw.spin + (i / (teeth * 2)) * Math.PI * 2;
          const rad = i % 2 ? rr : rr * 0.82;
          ctx.lineTo(sx + Math.cos(ang) * rad, sy + Math.sin(ang) * rad);
        }
        ctx.fill();
        ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.arc(sx, sy, rr * 0.18, 0, Math.PI * 2); ctx.fill();
      }

      // ropes (+ beam hooks)
      for (const rp of world.ropes) {
        const th = lerp(rp.prevTheta, rp.theta, a);
        ctx.strokeStyle = '#151515'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(rp.ax, rp.ay);
        ctx.lineTo(rp.ax + Math.sin(th) * rp.len, rp.ay + Math.cos(th) * rp.len);
        ctx.stroke();
      }

      // crates & boulders
      for (const k of world.bodies) {
        const x = lerp(k.prevX, k.x, a), y = lerp(k.prevY, k.y, a);
        if (k.kind === 'boulder') {
          const ang = lerp(k.prevAngle, k.angle, a);
          const cx2 = x + k.w / 2, cy2 = y + k.h / 2;
          ctx.fillStyle = '#161616';
          ctx.beginPath(); ctx.arc(cx2, cy2, k.w / 2, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#2d2d2d'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cx2, cy2, k.w / 2 - 5, ang, ang + 1.6); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx2, cy2, k.w / 2 - 10, ang + 3, ang + 4.2); ctx.stroke();
        } else {
          ctx.fillStyle = '#202020'; ctx.fillRect(x, y, k.w, k.h);
          ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 2;
          ctx.strokeRect(x + 3, y + 3, k.w - 6, k.h - 6);
          ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + k.w - 4, y + k.h - 4); ctx.stroke();
        }
      }

      for (const m of world.monsters) if (Math.abs(m.x - cx - VIEW_W / 2) < VIEW_W / 2 + 120) H.monsters.draw(ctx, m, world.time, a, false);
      this.drawGlow(world, a, spikes, glowK);

      const p = world.player;
      if (H.pickups) H.pickups.draw(ctx, world, world.time);
      if (world.invuln > 0 && Math.floor(world.time * 14) % 2) ctx.globalAlpha = 0.35;
      if (!p.dead || world.fade < 1) this.drawPlayer(p, a, world.time, world);
      ctx.globalAlpha = 1;
      if (H.pickups) H.pickups.drawShield(ctx, p, world.time);

      if (debug) this.drawDebug(world, a);
      ctx.restore();

      H.fx.drawEnclosure(ctx, th, cx, cy, world.time);
      if (weather) weather.draw(ctx, opts);
      H.fx.grain(ctx, weather ? weather.grainSeed : 0, opts.grain == null ? 0.6 : opts.grain);
      if (world.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${world.fade})`; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
    }

    // Glowing, pulsing white outline around every obstacle and enemy.
    drawGlow(world, a, spikes, k) {
      const ctx = this.ctx;
      ctx.save();
      ctx.shadowColor = `rgba(255,255,255,${0.7 + 0.3 * k})`;
      ctx.shadowBlur = 6 + 6 * k;
      ctx.strokeStyle = `rgba(255,255,255,${0.45 + 0.4 * k})`;
      ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < spikes.length; i += 2) {
        const x = spikes[i], y = spikes[i + 1];
        ctx.moveTo(x, y + TS);
        for (let j = 0; j < 4; j++) { const sx = x + j * 8; ctx.lineTo(sx + 4, y + 12 + (j % 2) * 4); ctx.lineTo(sx + 8, y + TS); }
      }
      for (const t of world.traps) if (t.armed) ctx.rect(t.x - 1, t.y - 1, t.w + 2, t.h + 1);
      for (const m of world.movers) {
        if (m.kind !== 'crusher' && m.kind !== 'gate') continue;
        const x = lerp(m.prevX, m.x, a), y = lerp(m.prevY, m.y, a);
        if (m.h > 1) ctx.rect(x - 1, y - 1, m.w + 2, m.h + 2);
      }
      for (const b of world.bodies) {
        if (b.kind !== 'boulder' || !(b.held || Math.abs(b.vx) > 140)) continue;
        const x = lerp(b.prevX, b.x, a), y = lerp(b.prevY, b.y, a);
        ctx.moveTo(x + b.w + 1, y + b.h / 2); ctx.arc(x + b.w / 2, y + b.h / 2, b.w / 2 + 1, 0, Math.PI * 2);
      }
      for (const sw of world.saws) {
        const ret = lerp(sw.prevRetract, sw.retract, a);
        if (ret >= 0.95) continue;
        const sx = lerp(sw.prevCx, sw.cx, a), sy = lerp(sw.prevCy, sw.cy, a), rr = sw.r * (1 - ret) + 1;
        ctx.moveTo(sx + rr, sy); ctx.arc(sx, sy, rr, 0, Math.PI * 2);
      }
      ctx.stroke();
      const pcx = world.player.x;
      for (const m of world.monsters) if (Math.abs(m.x - pcx) < 760) H.monsters.draw(ctx, m, world.time, a, true);
      ctx.restore();
    }

    // Procedural character: two-segment limbs, per-state poses (run, idle, crouch, push,
    // pull, jump, fall, ladder, rope, lever, teeter, fidgets, joy, death by cause), squash and
    // stretch, lean (speed, acceleration, slopes), breathing, blinking, wandering and fearful
    // eyes, spring-driven hair and tunic, a cloth scarf, belt and folds, rim light, hands,
    // dust, snow footprints and cold breath.
    drawPlayer(p, a, time, world) {
      const ctx = this.ctx, an = p.ensureAnim();
      const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      const mix = (u, v, t) => u + (v - u) * t;
      const x = lerp(p.prevX, p.x, a), y = lerp(p.prevY, p.y, a);
      const cx = x + p.w / 2, feet = y + p.h;
      const f = p.facing >= 0 ? 1 : -1;

      // world-space bits: snow prints, dust, breath
      for (const pr of an.prints) { ctx.fillStyle = `rgba(40,48,58,${0.34 * (1 - pr.t / 9)})`; ctx.beginPath(); ctx.ellipse(pr.x, pr.y - 0.5, 4, 1.3, 0, 0, 6.283); ctx.fill(); }
      for (const q of an.puffs) {
        const k = q.life / q.max;
        ctx.fillStyle = `rgba(214,214,206,${0.38 * k})`;
        ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (1.6 - k * 0.6), 0, 6.283); ctx.fill();
      }
      for (const b of an.breath) { const k = b.life / b.max; ctx.fillStyle = `rgba(255,255,255,${0.42 * k})`; ctx.beginPath(); ctx.arc(b.x, b.y, 2 + (1 - k) * 4, 0, 6.283); ctx.fill(); }

      const cause = p.deathCause || '';
      const dk = p.dead && world ? Math.min(1, world.deathT / 0.25) : 0;
      const flat = cause === 'crushed' || cause === 'boulder', stiff = cause === 'spikes' || cause === 'trap', spun = cause === 'saw';
      const st = p.state, crouch = p.crouch;
      const speed = Math.abs(p.vx), moving = st === 'ground' && speed > 8;
      const H = crouch ? 22 : 34;
      const ph = an.stride, amp = Math.min(1, speed / 100);
      const bob = moving && !crouch ? Math.abs(Math.sin(ph)) * 1.8 * amp : 0;
      const idle = !moving && st === 'ground' && !crouch && !p.grab && !p.pushing;
      const breathe = idle ? Math.sin(time * 2.1) * 0.7 : 0;
      const airT = clamp(p.vy / 320, -1, 1);
      const pushing = p.pushing || (p.grab && st === 'ground');
      const pulling = p.grab && p.vx * f < -5;
      const fid = an.fidget && idle ? an.fidget : null;
      const fe = fid ? Math.sin(Math.PI * clamp(fid.t / 1.6, 0, 1)) : 0;

      // scarf (behind the body)
      if (an.scarf) {
        const dx = x - p.x, dy = y - p.y, sc = an.scarf;
        ctx.fillStyle = '#0b0b0b';
        const L = [], R = [];
        for (let i = 0; i < sc.length; i++) {
          const a0 = sc[Math.max(0, i - 1)], b0 = sc[Math.min(sc.length - 1, i + 1)];
          let nx = -(b0.y - a0.y), ny = b0.x - a0.x; const d = Math.hypot(nx, ny) || 1; nx /= d; ny /= d;
          const w = (3.4 * (1 - i / sc.length) + 0.5) * (1 + 0.15 * Math.sin(time * 6 + i));
          L.push([sc[i].x + dx + nx * w, sc[i].y + dy + ny * w]); R.push([sc[i].x + dx - nx * w, sc[i].y + dy - ny * w]);
        }
        ctx.globalAlpha = 1 - dk * 0.5;
        ctx.beginPath(); L.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); R.reverse().forEach((q) => ctx.lineTo(q[0], q[1])); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
      }

      // soft ground shadow
      if (p.grounded && !p.dead) {
        ctx.fillStyle = 'rgba(0,0,0,.26)';
        ctx.beginPath(); ctx.ellipse(cx, feet + 0.6, 9 * (1 + an.landSq * 0.35), 2.2, 0, 0, 6.283); ctx.fill();
      }

      // body lean: speed, acceleration, slopes, task
      let lean = (moving ? 0.05 + amp * 0.1 : 0) + an.accLean + an.slopeLean;
      if (crouch) lean = 0.12;
      if (pushing) lean = pulling ? -0.14 : 0.27;
      if (st === 'air') lean = clamp(p.vx / 500, -0.2, 0.2) + airT * 0.04;
      if (p.leverT > 0) lean = 0.18;
      if (st === 'ladder') lean = 0;
      if (st === 'rope') lean = p.rope ? -p.rope.theta * 0.4 : 0;
      if (fid && fid.k === 'stretch') lean -= 0.12 * fe;
      if (fid && fid.k === 'peek') lean += 0.12 * fe;
      if (an.teeter > 0.5) lean += -0.1 + Math.sin(time * 12) * 0.04;
      let sy = 1 - an.landSq * 0.2 + an.stretch * 0.12 - an.hard * 0.25;
      let sx = (1 / sy) * (1 - an.turn * 0.25);
      let dRot = 0;
      if (p.dead) {
        if (flat) { sy = Math.max(0.16, 1 - dk * 0.85); sx = 1 + dk * 0.9; }
        else if (stiff) { sy = 1 - dk * 0.08; dRot = dk * 0.14; }
        else if (spun) { dRot = dk * 3.4; sy = 1 - dk * 0.2; }
        else { sy = 1 - dk * 0.5; dRot = dk; }
      }
      const shake = pushing && speed < 10 ? Math.sin(time * 40) * 0.45 : 0;

      ctx.save();
      ctx.translate(cx + shake, feet);
      ctx.scale(f * sx, sy);
      ctx.rotate(lean + dRot);
      ctx.globalAlpha = 1 - dk * (spun ? 0.8 : 0.45);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const NEAR = '#040404', FAR = '#171717';
      const crouchLike = crouch || an.hard > 0;

      // limb pose: [thigh, knee bend, shoulder, elbow bend]; angles from straight down, + = forward
      const pose = (side) => {
        const pp = ph + side * Math.PI;
        if (p.dead) return stiff ? [side ? 0.15 : -0.1, 0.05, 1.6 + side * 0.3, 0.05] : (side ? [0.5, 0.4, 0.4, 0.3] : [-0.25, 0.3, 0.7, 0.4]);
        if (an.joy > 0.2) return [side ? 0.1 : -0.1, 0.05, 2.5 + Math.sin(time * 9 + side * 2) * 0.35, 0.2];
        if (st === 'rope') {
          const sw = p.rope ? clamp(p.rope.omega * 0.12, -0.4, 0.4) : 0;
          return [0.15 + side * 0.12 - sw, 0.4 + side * 0.15, 2.35 - side * 0.2, 0.1];
        }
        if (st === 'ladder') {
          const c = an.climb + side * Math.PI, up = Math.max(0, Math.sin(c));
          return [0.3 + 0.5 * up, 0.35 + 0.9 * up, 2.2 + 0.3 * Math.sin(c), 0.25 + 0.2 * Math.cos(c)];
        }
        if (st === 'air' || !p.grounded) {
          const rise = side ? [-0.15, 0.6, 1.7, 0.3] : [0.8, 1.3, 2.0, 0.2];
          const fall = side ? [-0.45, 0.3, 2.3 + Math.sin(time * 14) * 0.12, 0.3] : [0.4, 0.4, 1.45 + Math.sin(time * 14 + 1) * 0.12, 0.3];
          return rise.map((v, i) => mix(v, fall[i], (airT + 1) / 2));
        }
        if (crouchLike) {
          const sw = crouch && moving ? Math.sin(pp) * 0.25 : 0;
          return [(side ? 1.05 : 1.15) + sw, 2.05, 0.7 + side * 0.2, 0.6];
        }
        if (an.teeter > 0.5) return [side ? -0.2 : 0.1, 0.05, 1.6 + Math.sin(time * 13 + side * 2) * 0.9, 0.25];
        if (pushing) {
          const sw = moving ? Math.sin(pp) * 0.25 : 0;
          return [(side ? -0.38 : 0.45) + sw, 0.15 + (moving ? Math.max(0, Math.cos(pp)) * 0.3 : 0), 1.5 - side * 0.1, 0.08];
        }
        if (moving) return [Math.sin(pp) * 0.8 * amp, 0.12 + Math.max(0, Math.cos(pp)) * 0.95 * amp, -Math.sin(pp) * 0.85 * amp - 0.05, 0.35 + 0.7 * amp];
        const base = [side ? -0.06 : 0.06, 0.04, 0.08 + Math.sin(time * 2.1 + side) * 0.04, 0.2];
        if (fid && fid.k === 'stretch') { base[2] = mix(base[2], 2.75, fe); base[3] = mix(base[3], 0.1, fe); }
        if (fid && fid.k === 'shrug') { base[2] = mix(base[2], 1.0 + side * 0.25, fe); base[3] = mix(base[3], 0.9, fe); }
        return base;
      };
      const P0 = pose(0), P1 = pose(1);
      if (p.leverT > 0 && !p.dead) { P0[2] = 1.1 + (1 - p.leverT / 0.25) * 1.0; P0[3] = 0.15; }

      const hipY = -(crouch ? 7 : 11) - bob * 0.5 + an.landSq * 1.5 + an.hard * 4;
      const topY = -H + 12.5 - breathe * 0.5 - bob * 0.3 - (fid && fid.k === 'shrug' ? 1.4 * fe : 0);
      const limb = (x0, y0, a0, bend, col, lw, len1, len2, back, hand) => {
        const x1 = x0 + Math.sin(a0) * len1, y1 = y0 + Math.cos(a0) * len1;
        const a1 = back ? a0 - bend : a0 + bend;
        const x2 = x1 + Math.sin(a1) * len2, y2 = y1 + Math.cos(a1) * len2;
        ctx.strokeStyle = col; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        if (hand) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x2, y2, 1.9, 0, 6.283); ctx.fill(); }
        return [x2, y2];
      };
      const leg = (P, col) => {
        const e = limb(0, hipY, P[0], P[1], col, 3.3, 5.6, 5.6, true, false);
        ctx.strokeStyle = col; ctx.lineWidth = 3.0;
        ctx.beginPath(); ctx.moveTo(e[0] - 0.8, e[1] + 0.2); ctx.lineTo(e[0] + 3.6, e[1] + 0.4); ctx.stroke();
      };
      const shX = 0.4 + (moving ? Math.sin(ph) * 0.6 * amp : 0) + (st === 'ladder' ? Math.sin(an.climb) * 0.7 : 0);
      const arm = (P, col) => limb(shX, topY + 1.5, P[2], P[3], col, 2.7, 6.0, 6.2, false, true);

      arm(P1, FAR); leg(P1, FAR);

      // torso: tunic with spring-driven hem, belt and folds
      const trail = an.hem + Math.sin(time * 5) * 0.35 * amp;
      const hemY = hipY + 4.6 + (st === 'air' ? -airT * 1.2 : 0);
      ctx.fillStyle = NEAR;
      ctx.beginPath();
      ctx.moveTo(-4.6 + shX, topY); ctx.lineTo(4.6 + shX, topY);
      ctx.lineTo(5.2, hipY + 3.2); ctx.lineTo(5.0 + trail, hemY);
      ctx.lineTo(-5.0 + trail, hemY); ctx.lineTo(-5.2, hipY + 3.2);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#242424'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(-4.4, hipY - 1.2); ctx.lineTo(4.4, hipY - 1.2);
      ctx.moveTo(-1.5 + trail * 0.2, hipY + 1.6); ctx.lineTo(-2 + trail * 0.6, hemY - 0.6);
      ctx.moveTo(1.8 + trail * 0.2, hipY + 1.6); ctx.lineTo(2.2 + trail * 0.6, hemY - 0.6); ctx.stroke();

      leg(P0, NEAR);

      // head
      const lookY = p.dead ? 1 : (st === 'air' ? clamp(p.vy / 500, -1.2, 1) : 0) + (fid ? (fid.k === 'stretch' ? -1 : fid.k === 'peek' ? 1 : 0) * fe : 0);
      const lookXf = an.lookX + (fid && fid.k === 'look' ? Math.sin(time * 3) * 2 * fe : 0);
      const hx = 1.2 + amp * 1.2 + (pushing ? 1.5 : 0) + dk * 3 - an.accLean * 14;
      const hy = -H + 7.4 - breathe - bob * 0.55 - lookY * 0.5 * (st === 'air' ? 1 : -1) + (crouchLike ? 1 : 0) + an.hard * 2.5;
      ctx.fillStyle = NEAR;
      ctx.beginPath(); ctx.arc(hx, hy, 7.4, 0, 6.283); ctx.fill();
      ctx.fillRect(hx - 2.2, hy + 4, 4.4, 5);
      // rim light from the sky on the top and back of the head and shoulders
      ctx.strokeStyle = 'rgba(255,255,255,.13)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(hx, hy, 7.1, -2.7, -0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4.6 + shX, topY + 0.6); ctx.lineTo(-5.0, hipY + 2); ctx.stroke();

      // hair tufts that flutter against the direction of travel (spring-driven)
      ctx.strokeStyle = NEAR; ctx.lineWidth = 1.9;
      const wx = -0.6 + an.hair - (st === 'air' ? Math.abs(p.vx) / 200 : 0), wy = (st === 'air' ? -airT * 3 : 0);
      for (let i = 0; i < 3; i++) {
        const ang = -2.1 + i * 0.5, bx = hx + Math.cos(ang) * 7, by = hy + Math.sin(ang) * 7;
        const fl = Math.sin(time * 8 + i * 1.7) * 1.2 * (0.4 + amp + (st === 'air' ? 0.6 : 0));
        ctx.beginPath(); ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + wx * 0.7, by - 1.4 + wy * 0.4 + fl * 0.6, bx + wx * 1.6 + Math.cos(ang) * 1.5, by - 0.2 + wy + fl + i * 0.6);
        ctx.stroke();
      }

      arm(P0, NEAR);

      // eyes: glow, blink, wander, widen when falling or scared, squint when happy
      const glow = 0.7 + 0.3 * Math.sin(time * 2.4);
      const ey = hy - 0.8 + lookY * 0.9 * (st === 'air' ? -1 : 1);
      const ex = hx + lookXf * 0.8 + Math.sin(time * 40) * 0.3 * an.fear;
      let open = p.dead ? 0.12 : (1 - an.blink * 0.92) * (st === 'air' && airT > 0.3 ? 1.2 : 1) * (crouchLike ? 0.85 : 1);
      open *= 1 + 0.28 * an.fear + 0.15 * an.teeter - 0.4 * an.joy;
      const halo = ctx.createRadialGradient(ex + 3.4, ey, 0, ex + 3.4, ey, 15);
      halo.addColorStop(0, `rgba(255,255,255,${0.18 * glow})`); halo.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = halo; ctx.fillRect(ex - 12, ey - 15, 30, 30);
      ctx.shadowColor = 'rgba(255,255,255,.9)'; ctx.shadowBlur = 4 + 3 * glow + 3 * an.fear;
      ctx.fillStyle = '#f7f7f1';
      const er = 1.6 * (1 + 0.1 * an.fear);
      ctx.beginPath(); ctx.ellipse(ex + 1.6, ey, er, 2.0 * open, 0, 0, 6.283); ctx.ellipse(ex + 5.2, ey, er, 2.0 * open, 0, 0, 6.283); ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    }

    drawDebug(world, a) {
      const ctx = this.ctx;
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,40,40,.9)';
      const p = world.player;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = 'rgba(40,160,255,.9)';
      for (const k of world.bodies) ctx.strokeRect(k.x, k.y, k.w, k.h);
      for (const m of world.movers) ctx.strokeRect(m.x, m.y, m.w, m.h);
      ctx.strokeStyle = 'rgba(255,160,0,.9)';
      for (const t of world.traps) ctx.strokeRect(t.x, t.y, t.w, t.h);
      for (const sw of world.saws) { ctx.beginPath(); ctx.arc(sw.cx, sw.cy, sw.r * 0.86, 0, Math.PI * 2); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(40,200,80,.9)';
      world.checkpoints.forEach((cp, i) => {
        ctx.beginPath(); ctx.moveTo(cp.x, cp.y); ctx.lineTo(cp.x, cp.y - 60); ctx.stroke();
        ctx.fillStyle = i === world.cpIndex ? '#2c8' : 'rgba(40,200,80,.5)';
        ctx.fillText('K' + i, cp.x + 3, cp.y - 52);
      });
      if (Number.isFinite(world.endX)) { ctx.strokeStyle = '#c80'; ctx.beginPath(); ctx.moveTo(world.endX, 0); ctx.lineTo(world.endX, world.height); ctx.stroke(); }
    }

    text(str, x, y, size, align, color, font) {
      const ctx = this.ctx;
      ctx.font = `${size}px ${font || 'Georgia, "Times New Roman", serif'}`;
      ctx.textAlign = align || 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color || '#eee';
      ctx.fillText(str, x, y);
    }

    // items: [{label, sub?, disabled?}], returns hit rects for mouse.
    drawMenu(title, subtitle, items, sel, opts = {}) {
      const ctx = this.ctx;
      ctx.fillStyle = opts.solid ? '#0b0b0b' : 'rgba(5,5,5,.78)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      let y = opts.top || 140;
      this.text(title, VIEW_W / 2, y, opts.titleSize || 54, 'center', '#e8e8e2');
      y += 46;
      if (subtitle) { this.text(subtitle, VIEW_W / 2, y, 15, 'center', '#888', 'system-ui, sans-serif'); }
      y += 44;
      const rects = [];
      items.forEach((it, i) => {
        const h = it.sub ? 46 : 34;
        const r = { x: VIEW_W / 2 - 220, y, w: 440, h };
        if (i === sel) { ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(r.x, r.y, r.w, r.h); }
        const col = it.disabled ? '#555' : (i === sel ? '#fff' : '#aaa');
        this.text((i === sel ? '›  ' : '') + it.label, VIEW_W / 2, y + (it.sub ? 15 : h / 2), 20, 'center', col);
        if (it.sub) this.text(it.sub, VIEW_W / 2, y + 34, 12.5, 'center', '#777', 'system-ui, sans-serif');
        rects.push(r);
        y += h + 6;
      });
      if (opts.footer) this.text(opts.footer, VIEW_W / 2, VIEW_H - 28, 12.5, 'center', '#666', 'system-ui, sans-serif');
      if (opts.message) this.text(opts.message, VIEW_W / 2, VIEW_H - 54, 14, 'center', opts.messageColor || '#bbb', 'system-ui, sans-serif');
      return rects;
    }

    drawDebugHud(lines) {
      const ctx = this.ctx;
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      ctx.fillRect(6, 6, 250, 14 * lines.length + 8);
      ctx.font = '11px ui-monospace, Menlo, Consolas, monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#9f9';
      lines.forEach((l, i) => ctx.fillText(l, 12, 10 + i * 14));
    }
  }

  H.Camera = Camera;
  H.Renderer = Renderer;
})(globalThis.Hollow = globalThis.Hollow || {});
