
/* ==========================================================================
   SECTION 7: PARTICLES, FLOATING TEXT, PROJECTILES (all pooled), TEXT HELPERS
   ========================================================================== */
const Parts = {
  pool: [], cur: 0, live: 0, quality: 1,
  init() { for (let i = 0; i < CFG.particles.high; i++) this.pool.push({ a: false }); },
  budget() { const s = Save.s; const q = s.lowfx ? 'low' : s.quality; return Math.floor((CFG.particles[q] || 340) * this.quality); },
  /* emit(type, x, y, count, opts). screen: true draws in screen space (weather, UI juice). */
  emit(type, x, y, n, o) {
    o = o || {}; const max = this.budget();
    for (let k = 0; k < (n || 1); k++) {
      if (this.live >= max) return;
      let p = null;
      for (let j = 0; j < this.pool.length; j++) { const q = this.pool[(this.cur + j) % this.pool.length]; if (!q.a) { p = q; this.cur = (this.cur + j + 1) % this.pool.length; break; } }
      if (!p) return;
      p.a = true; p.type = type; p.x = x + (o.sx ? (FX.f() - 0.5) * o.sx : 0); p.y = y + (o.sy ? (FX.f() - 0.5) * o.sy : 0);
      p.screen = !!o.screen; p.col = o.col || null; p.g = 0; p.rot = FX.f() * TAU; p.t = 0; p.v = 150;
      switch (type) {
        case 'dust': p.vx = (FX.f() - 0.5) * 30; p.vy = 10 + FX.f() * 50; p.max = 0.5 + FX.f() * 0.8; p.size = 1 + FX.f() * 1.4; p.g = 60; p.v = 150; break;
        case 'puff': p.vx = (FX.f() - 0.5) * 50; p.vy = -10 - FX.f() * 30; p.max = 0.4 + FX.f() * 0.4; p.size = 2 + FX.f() * 4; p.v = 170; break;
        case 'ash': p.vx = -8 + FX.f() * 16; p.vy = 14 + FX.f() * 18; p.max = 6 + FX.f() * 4; p.size = 0.8 + FX.f() * 1.4; p.v = 120 + FX.f() * 60; break;
        case 'rain': p.vx = -70; p.vy = 520 + FX.f() * 120; p.max = 1.2; p.size = 7 + FX.f() * 6; p.v = 170; break;
        case 'snow': p.vx = -14 + FX.f() * 10; p.vy = 34 + FX.f() * 30; p.max = 9; p.size = 1 + FX.f() * 1.8; p.v = 225; break;
        case 'ember': p.vx = (FX.f() - 0.5) * 24; p.vy = -30 - FX.f() * 40; p.max = 0.8 + FX.f() * 1; p.size = 1 + FX.f() * 1.2; p.v = 235; break;
        case 'smoke': p.vx = (FX.f() - 0.5) * 10 + (o.vx || 0); p.vy = -16 - FX.f() * 14; p.max = 1.6 + FX.f() * 1.4; p.size = 3 + FX.f() * 3; p.v = o.v || 95; break;
        case 'breath': p.vx = (o.dir || 1) * (10 + FX.f() * 8); p.vy = -5 - FX.f() * 5; p.max = 0.9; p.size = 2 + FX.f() * 2; p.v = 210; break;
        case 'spark': p.vx = (FX.f() - 0.5) * 180; p.vy = -FX.f() * 160; p.max = 0.25 + FX.f() * 0.3; p.size = 1.2; p.g = 500; p.v = 245; break;
        case 'glint': p.vx = 0; p.vy = -14; p.max = 0.5; p.size = 4 + FX.f() * 3; p.v = 250; break;
        case 'ripple': p.vx = 0; p.vy = 0; p.max = o.life || 0.9; p.size = o.size || 46; break;
        case 'drop': p.vx = 0; p.vy = 40; p.max = 0.7; p.size = 1.6; p.g = 500; p.v = 200; break;
        case 'zzz': p.vx = 6; p.vy = -14; p.max = 1.6; p.size = 7; p.v = 200; break;
        case 'steam': p.vx = (FX.f() - 0.5) * 8; p.vy = -18 - FX.f() * 10; p.max = 1.2 + FX.f() * 0.6; p.size = 2 + FX.f() * 2; p.v = 225; break;
        case 'splash': p.vx = (FX.f() - 0.5) * 40; p.vy = -30 - FX.f() * 40; p.max = 0.3; p.size = 1.2; p.g = 420; p.v = 200; break;
        case 'land': p.vx = 0; p.vy = 0; p.max = 0.35; p.size = o.size || 12; break;
        case 'mote': p.vx = (FX.f() - 0.5) * 6; p.vy = -2 + FX.f() * 6; p.max = 3 + FX.f() * 3; p.size = 0.8 + FX.f(); p.v = 235; break;
        default: p.vx = 0; p.vy = 0; p.max = 0.5; p.size = 2;
      }
      if (o.vx != null && type !== 'smoke') p.vx += o.vx; if (o.vy != null) p.vy += o.vy;
      this.live++;
    }
  },
  update(dt) {
    let n = 0;
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i]; if (!p.a) continue;
      p.t += dt; if (p.t >= p.max) { p.a = false; if (p.type === 'rain' && p.screen && p.y > H * 0.55 && FX.f() < 0.5) this.emit('splash', p.x, Math.min(p.y, H - 4), 2, { screen: true }); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.type === 'snow' || p.type === 'ash') p.x += Math.sin(p.t * 2 + p.rot) * 8 * dt;
      n++;
    }
    this.live = n;
  },
  clear() { for (const p of this.pool) p.a = false; this.live = 0; },
  draw(ctx, screen) {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i]; if (!p.a || p.screen !== screen) continue;
      const k = p.t / p.max, a = 1 - k;
      switch (p.type) {
        case 'rain': ctx.strokeStyle = grey(p.v, 0.35); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.size * 0.14, p.y - p.size); ctx.stroke(); break;
        case 'steam': ctx.fillStyle = grey(240, a * 0.22); ctx.beginPath(); ctx.arc(p.x + Math.sin(p.t * 5 + p.rot) * 3, p.y, p.size * (1 + k * 2.2), 0, TAU); ctx.fill(); break;
        case 'land': ctx.strokeStyle = grey(200, a * 0.5); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size * (0.4 + Ease.outCubic(k)), 2 + k * 2, 0, Math.PI, TAU); ctx.stroke(); break;
        case 'puff': case 'smoke': case 'breath': ctx.fillStyle = grey(p.v, a * 0.35); ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 + k * 1.6), 0, TAU); ctx.fill(); break;
        case 'glint': { ctx.strokeStyle = grey(255, a); ctx.lineWidth = 1.2; const s = p.size * Math.sin(k * Math.PI); ctx.beginPath(); ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x + s, p.y); ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x, p.y + s); ctx.stroke(); break; }
        case 'ripple': ctx.strokeStyle = p.col ? hsl(p.col, 1, 8, a * 0.8) : grey(240, a * 0.6); ctx.lineWidth = 2.5 * a + 0.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * Ease.outCubic(k), 0, TAU); ctx.stroke(); break;
        case 'zzz': ctx.fillStyle = grey(p.v, a); ctx.font = 'bold ' + Math.round(p.size + k * 4) + 'px ' + CFG.fonts.type; ctx.fillText('z', p.x, p.y); break;
        case 'ember': ctx.fillStyle = grey(p.v, a * (0.6 + 0.4 * Math.sin(p.t * 30))); ctx.fillRect(p.x, p.y, p.size, p.size); break;
        default: ctx.fillStyle = grey(p.v, a * 0.8); ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    }
  }
};

const Floaters = {
  pool: [],
  init() { for (let i = 0; i < 40; i++) this.pool.push({ a: false }); },
  add(text, x, y, o) {
    o = o || {}; const p = this.pool.find(q => !q.a); if (!p) return;
    p.a = true; p.text = text; p.x = x; p.y = y; p.t = 0; p.max = o.life || 1.6; p.col = o.col || G.bone; p.size = o.size || 12; p.screen = !!o.screen; p.rot = (FX.f() - 0.5) * 0.08;
  },
  update(dt) { for (const p of this.pool) { if (!p.a) continue; p.t += dt; p.y -= 16 * dt; if (p.t > p.max) p.a = false; } },
  clear() { for (const p of this.pool) p.a = false; },
  draw(ctx, screen) {
    for (const p of this.pool) {
      if (!p.a || p.screen !== screen) continue;
      const k = p.t / p.max; ctx.globalAlpha = k < 0.15 ? k / 0.15 : k > 0.75 ? (1 - k) / 0.25 : 1;
      txt(ctx, p.text, p.x, p.y - Ease.outBack(Math.min(1, k * 4)) * 6, p.size, p.col, 'center', { rot: p.rot });
      ctx.globalAlpha = 1;
    }
  }
};

/* --- text helpers (typewriter stack, outlined for readability on busy backgrounds) --- */
function textScale() { return clamp(num(Save.data ? Save.s.text : 1, 1), 0.8, 1.4); }
function setFont(ctx, size, o) { o = o || {}; ctx.font = (o.normal ? '' : 'bold ') + Math.max(6, Math.round(size * (o.fixed ? 1 : textScale()))) + 'px ' + (o.serif ? CFG.fonts.serif : CFG.fonts.type); }
function txt(ctx, str, x, y, size, col, align, o) {
  o = o || {}; ctx.save(); setFont(ctx, size, o);
  ctx.textAlign = align || 'left'; ctx.textBaseline = o.base || 'alphabetic';
  if (o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); x = 0; y = 0; }
  if (o.outline !== false) { ctx.lineWidth = o.lw || 3; ctx.strokeStyle = o.oc || 'rgba(0,0,0,0.8)'; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y); }
  ctx.fillStyle = col || G.paper; ctx.fillText(str, x, y); ctx.restore();
}
function wrapText(ctx, str, maxW, size, o) {
  setFont(ctx, size, o); const out = [];
  String(str).split('\n').forEach(par => {
    let line = ''; par.split(' ').forEach(w => { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; });
    out.push(line);
  });
  return out;
}
function txtWrap(ctx, str, x, y, maxW, size, col, o) {
  o = o || {}; const lines = wrapText(ctx, str, maxW, size, o), lh = (o.lh || 1.35) * size * textScale();
  for (let i = 0; i < lines.length; i++) txt(ctx, lines[i], x, y + i * lh, size, col, o.align || 'left', o);
  return lines.length * lh;
}
function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
