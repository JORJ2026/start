/* ==========================================================================
   SECTION 30 (1.3): MAP HAZARDS and GLOWING OUTLINES
   Hazards on the sites that hurt: broken glass (creep over it or hop it),
   rusty nails (hop them), live wires that spark on and off, and rotten
   floors that give way and drop you to the floor below.
   Enemies, obstacles and hazards get a soft, breathing white outline so
   they read in the dark (Settings > Glowing outlines).
   ========================================================================== */
const HAZ = {
  glass: { n: 'Broken glass', w: 16, dmg: 5, d: 'Cuts you unless you creep (crouch) across or hop over it. Crunches loudly either way.' },
  nails: { n: 'Rusty nails', w: 12, dmg: 7, d: 'A plank full of nails. Hop over it; creeping does not help.' },
  wire: { n: 'Live wire', w: 12, dmg: 12, d: 'A dangling cable that sparks on and off. Cross while it is dark.' },
  weak: { n: 'Rotten floor', w: 22, dmg: 9, d: 'Creaks, then gives way and drops you to the floor below. Cross quickly, or not at all.' }
};
['glass', 'nails', 'wire', 'weak'].forEach(k => { OBJDEF[k] = {}; });
const Glow = {
  on() { return Save.s.outlines !== false; },
  a(t, ph) { return Save.s.reduce ? 0.55 : 0.42 + 0.24 * Math.sin(t * 3.2 + (ph || 0)); },
  /* stroke a path with a soft white glow; the path is built by fn(ctx) */
  stroke(ctx, fn, t, ph, lw) {
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,' + this.a(t, ph).toFixed(3) + ')'; ctx.lineWidth = lw || 1.4; ctx.lineJoin = 'round';
    if (!Render.cheap) { ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 7 + 3 * Math.sin(t * 3.2 + (ph || 0)); }
    ctx.beginPath(); fn(ctx); ctx.stroke(); ctx.restore();
  },
  /* an outline that follows a sprite: draw(c) paints it at the offscreen origin */
  cv: null, cv2: null,
  sprite(ctx, draw, x, y, z, t, ph) {
    const S = 180; if (!this.cv) { this.cv = document.createElement('canvas'); this.cv2 = document.createElement('canvas'); this.cv.width = this.cv2.width = S; this.cv.height = this.cv2.height = S; }
    const A = this.cv.getContext('2d'), B = this.cv2.getContext('2d'), ox = S / 2, oy = S - 14;
    A.setTransform(1, 0, 0, 1, 0, 0); A.globalCompositeOperation = 'source-over'; A.clearRect(0, 0, S, S); A.setTransform(z, 0, 0, z, ox, oy); draw(A);
    A.setTransform(1, 0, 0, 1, 0, 0); A.globalCompositeOperation = 'source-in'; A.fillStyle = '#fff'; A.fillRect(0, 0, S, S); A.globalCompositeOperation = 'source-over';
    B.setTransform(1, 0, 0, 1, 0, 0); B.globalCompositeOperation = 'source-over'; B.clearRect(0, 0, S, S);
    const r = 1.6; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; B.drawImage(this.cv, Math.cos(a) * r, Math.sin(a) * r); }
    B.globalCompositeOperation = 'destination-out'; B.drawImage(this.cv, 0, 0); B.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalAlpha = Math.min(1, this.a(t, ph) * 1.5);
    if (!Render.cheap) { ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 8 + 3 * Math.sin(t * 3.2 + (ph || 0)); }
    ctx.drawImage(this.cv2, x - ox, y - oy); ctx.restore();
  }
};

/* ---------- placing hazards on the sites ---------- */
(function () {
  const _build = buildSite;
  buildSite = function (id, seed, o) {
    const L = _build(id, seed, o), loc = LOCS[id]; if (!L || !loc || !L.site) return L;
    const r = new RNG(((seed | 0) ^ 0x5a17) >>> 0), nF = L.floors.length, n = 3 + (loc.danger || 1) + Math.floor(nF / 2);
    const free = (f, x) => !L.ladders.some(l => (l.fa === f || l.fb === f) && (Math.abs(l.xa - x) < 60 || Math.abs(l.xb - x) < 60)) && !L.objs.some(q => q.f === f && Math.abs(q.x - x) < 46) && !L.blockers.some(q => q.f === f && Math.abs(q.x - x) < 46);
    for (let k = 0, tries = 0; k < n && tries < 200; tries++) {
      const f = r.i(0, nF - 1), fl = L.floors[f]; if (!fl) continue;
      const kind = r.w({ glass: 4, nails: 3, wire: f < nF - 1 ? 2 : 1, weak: f < nF - 1 ? 3 : 0 }), x = Math.round(r.r(fl.x0 + 180, fl.x1 - 120));
      if (!(x > fl.x0 + 120) || !free(f, x)) continue;
      if (kind === 'weak' && L.floors[f + 1] && (x < L.floors[f + 1].x0 + 20 || x > L.floors[f + 1].x1 - 20)) continue;
      L.objs.push({ type: kind, x, f, ph: r.r(0, TAU), haz: true }); k++;
    }
    return L;
  };
})();

/* ---------- what hazards do ---------- */
const HazSys = {
  tick(w, dt) {
    if (!w.L.site) return; const t = w.t;
    for (const o of w.L.objs) {
      if (!o.haz) continue;
      if (o.type === 'wire') { const on = Math.sin(t * 1.3 + o.ph) > 0.35; if (on && !o.on) Snd.sfx('static', { v: 0.4 }); o.on = on; if (on && Math.random() < dt * 14) Parts.emit('spark', o.x + (Math.random() - 0.5) * 4, w.floorY(o.f) - 6, 2, {}); }
      if (o.type === 'weak' && o.t > 0) { o.t -= dt; if (Math.random() < dt * 20) Parts.emit('dust', o.x + (Math.random() - 0.5) * 40, w.floorY(o.f) + 4, 1, {}); if (o.t <= 0) this.give(w, o); }
    }
    for (const s of w.surv) {
      if (s.down || s.cl || s.hidden || s.sleeping) continue; const ground = !(s.jz > 0);
      for (const o of w.L.objs) {
        if (!o.haz || o.f !== s.f || Math.abs(o.x - s.x) > HAZ[o.type].w) continue;
        const ready = t - (o['h' + s.id] || -9) > 1.4;
        if (o.type === 'glass' && ground && ready) { o['h' + s.id] = t; w.noise(o.x, o.f, s.crouch ? 110 : 170, s); Snd.sfx('shatter', { v: 0.35 }); if (!s.crouch) this.hurt(w, s, o, 'Cut on broken glass!'); else Floaters.add('crunch...', o.x, w.floorY(o.f) - 22, {}); }
        if (o.type === 'nails' && ground && ready) { o['h' + s.id] = t; this.hurt(w, s, o, 'Stepped on a nail!'); }
        if (o.type === 'wire' && o.on && ready && Math.abs(o.x - s.x) < 10) { o['h' + s.id] = t; Snd.sfx('static'); Parts.emit('spark', s.x, w.floorY(s.f) - 30, 10, {}); this.hurt(w, s, o, 'Shocked by a live wire!'); }
        if (o.type === 'weak' && ground && !(o.t > 0)) { o.t = s.crouch ? 1.1 : 0.55; Snd.sfx('creak'); Floaters.add('creak...', o.x, w.floorY(o.f) - 22, {}); }
      }
    }
  },
  hurt(w, s, o, msg) {
    const d = HAZ[o.type].dmg * (w.diff && w.diff.dmg || 1);
    if (s.damage(d, 'hazard')) { w.impact(s.x, w.entY(s) - 20, 0.5); Floaters.add(msg, s.x, w.floorY(s.f) - 70, {}); Bus.emit('hazardImpact', { type: o.type, s }); const H = Save.data.haz || (Save.data.haz = {}); H[o.type] = num(H[o.type]) + 1; }
  },
  give(w, o) {
    Snd.sfx('thud'); Snd.sfx('creak'); Parts.emit('dust', o.x, w.floorY(o.f) + 6, 18, { sx: 26 }); w.noise(o.x, o.f, 220, null);
    const below = o.f + 1, fl = w.L.floors[below];
    for (const s of w.surv) if (s.f === o.f && !s.cl && Math.abs(s.x - o.x) < HAZ.weak.w && !(s.jz > 0) && fl) {
      w.place(s, clamp(s.x, fl.x0 + 8, fl.x1 - 8), below); s.land = 1; this.hurt(w, s, o, 'The floor gave way!');
    }
    o.type = 'hole'; o.haz = false;
  }
};
(function () {
  const _wu = World.prototype.update;
  World.prototype.update = function (dt, ctl) { const r = _wu.call(this, dt, ctl); try { HazSys.tick(this, dt); } catch (e) { if (DEBUG) console.warn(e); } return r; };
  // drawing the hazards (in the grey world layer)
  const _obj = Polish.obj;
  Polish.obj = function (c, w, o) {
    const r = _obj.apply(this, arguments); if (!o.haz) return r;
    const y = w.floorY(o.f), x = o.x, t = Game.time;
    if (o.type === 'glass') { for (let k = 0; k < 7; k++) { const gx = x - 14 + k * 4.5 + PH(k, 31 + o.f) * 3, h = 2 + PH(k, 37) * 5; c.fillStyle = grey(150 + PH(k, 41) * 80, 0.85); c.beginPath(); c.moveTo(gx, y); c.lineTo(gx + 1.5, y - h); c.lineTo(gx + 3.5, y); c.fill(); } if (Math.sin(t * 2 + x) > 0.9) { c.fillStyle = grey(255, 0.9); c.fillRect(x - 3 + Math.sin(x) * 8, y - 4, 1.5, 1.5); } }
    else if (o.type === 'nails') { c.fillStyle = grey(52); c.fillRect(x - 12, y - 3, 24, 3); c.fillStyle = grey(140); for (let k = 0; k < 5; k++) c.fillRect(x - 10 + k * 5, y - 8, 1, 5); }
    else if (o.type === 'wire') { const top = y - 92; c.strokeStyle = grey(30); c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 6, top); c.quadraticCurveTo(x + 10 + Math.sin(t * 0.8 + o.ph) * 3, y - 40, x, y - 4); c.stroke(); c.fillStyle = grey(o.on ? 240 : 60); c.fillRect(x - 2, y - 6, 4, 3); }
    else if (o.type === 'weak') { const sag = o.t > 0 ? 2 + Math.sin(t * 40) * 0.6 : 0; c.fillStyle = grey(44); c.fillRect(x - 22, y - 1 + sag, 44, 3); c.strokeStyle = grey(14); c.lineWidth = 1; c.beginPath(); c.moveTo(x - 10, y + sag); c.lineTo(x - 4, y + 2 + sag); c.lineTo(x + 3, y + sag); c.moveTo(x + 8, y + sag); c.lineTo(x + 14, y + 2 + sag); c.stroke(); for (let k = 0; k < 5; k++) { c.fillStyle = grey(24); c.fillRect(x - 22 + k * 9, y - 1 + sag, 1, 3); } }
    return r;
  };
  // glowing outlines, drawn in screen space after the darkness so they read at night
  const _gl = Polish.glows;
  Polish.glows = function (ctx, w, X, Y) {
    const r = _gl.apply(this, arguments); if (!Glow.on()) return r;
    try {
      const t = Game.time, z = w.cam.zoom, L = w.L;
      for (const o of L.objs) {
        if (!(o.haz || o.type === 'hole')) continue; const x = X(o.x), y = Y(w.floorY(o.f)); if (x < -60 || x > W + 60) continue; const ph = o.x * 0.01;
        if (o.type === 'glass') Glow.stroke(ctx, c => { c.moveTo(x - 16 * z, y); c.lineTo(x - 10 * z, y - 7 * z); c.lineTo(x - 2 * z, y - 3 * z); c.lineTo(x + 5 * z, y - 8 * z); c.lineTo(x + 16 * z, y); }, t, ph);
        else if (o.type === 'nails') Glow.stroke(ctx, c => { c.rect(x - 13 * z, y - 9 * z, 26 * z, 9 * z); }, t, ph);
        else if (o.type === 'wire') Glow.stroke(ctx, c => { c.moveTo(x - 6 * z, y - 92 * z); c.quadraticCurveTo(x + 10 * z, y - 40 * z, x, y - 4 * z); }, t, ph, o.on ? 2.4 : 1.2);
        else if (o.type === 'weak') Glow.stroke(ctx, c => { c.rect(x - 23 * z, y - 2 * z, 46 * z, 5 * z); }, t, ph);
        else Glow.stroke(ctx, c => { c.moveTo(x - 25 * z, y - 1 * z); for (let k = 0; k <= 8; k++) c.lineTo(x + (-25 + k * 6.2) * z, y + (k % 2 ? 4 : -1) * z); }, t, ph);
      }
      for (const b of L.blockers) { if (b.open || b.home) continue; const x = X(b.x), y = Y(w.floorY(b.f)); if (x < -60 || x > W + 60) continue; Glow.stroke(ctx, c => { if (b.type === 'gap') { c.moveTo(x - 20 * z, y); c.lineTo(x + 20 * z, y); } else c.rect(x - 17 * z, y - 86 * z, 34 * z, 86 * z); }, t, b.x * 0.01); }
      for (const n of w.npcs) {
        if (!n.T || !n.T.hostile || n.dead || n.gone) continue; const x = X(n.x), y = Y(w.entY(n)); if (x < -80 || x > W + 80) continue;
        Glow.sprite(ctx, c => Rig.drawNPC(c, n, 0, 0, 1), x, y, z, t, n.x * 0.01);
      }
    } catch (e) { if (DEBUG) console.warn(e); }
    return r;
  };
})();

/* ---------- outlines in The Long Walk ---------- */
(function () {
  const _r = WalkScene.prototype.render;
  WalkScene.prototype.render = function (ctx) {
    _r.call(this, ctx); if (!Glow.on() || this.P.dead > 0.5 || this.done) return;
    const L = this.L, t = this.t, cx = this.cam.x, cy = this.cam.y, X = x => x - cx + W / 2, Y = y => y - cy + H / 2 - 40, vis = (x, w) => X(x + w) > -20 && X(x) < W + 20;
    const box = (r, ph) => { if (vis(r.x, r.w)) Glow.stroke(ctx, c => c.rect(X(r.x) - 0.5, Y(r.y) - 0.5, r.w + 1, r.h + 1), t, ph); };
    for (const s of L.spikes) if (vis(s.x, s.w)) Glow.stroke(ctx, c => { c.moveTo(X(s.x), Y(WALK_GY)); for (let k = 0; k <= s.w; k += 8) { c.lineTo(X(s.x + k + 4), Y(WALK_GY - 13 - (k % 16 ? 0 : 3))); c.lineTo(X(s.x + k + 8), Y(WALK_GY)); } }, t, s.x * 0.01);
    for (const c of L.crates) box(c, c.x * 0.01);
    for (const g of L.gates) if (g.open < 0.95) box({ x: g.x, y: g.y, w: g.w, h: g.h * (1 - g.open * 0.92) }, 1);
    for (const m of L.movers) box(m, 2);
    for (const f of L.falls) if (!f.gone) box(f, f.x * 0.01);
    for (const d of L.debris) if (d.st === 'fall' || d.st === 'land') box(d, 3);
    for (const w of L.water) if (vis(w.x, w.w)) Glow.stroke(ctx, c => { c.moveTo(X(w.x), Y(WALK_GY + 30)); c.lineTo(X(w.x + w.w), Y(WALK_GY + 30)); }, t, 4);
    for (const p of L.pits) if (!p.water && vis(p.x, p.w)) Glow.stroke(ctx, c => { c.moveTo(X(p.x), Y(WALK_GY)); c.lineTo(X(p.x), Y(WALK_GY) + 40); c.moveTo(X(p.x + p.w), Y(WALK_GY)); c.lineTo(X(p.x + p.w), Y(WALK_GY) + 40); }, t, p.x * 0.01, 1);
    for (const g of L.dogs) if (g.st === 'run' && vis(g.x, 30)) { const n = { type: 'dog', T: NPCT.dog, face: g.face || 1, vx: g.vx, ph: g.ph, st: 'chase', aw: 1, x: g.x }; Glow.sprite(ctx, c => Rig.drawNPC(c, n, 0, 0, 1), X(g.x + 15), Y(WALK_GY), 1, t, 5); }
  };
})();
