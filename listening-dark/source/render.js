// ---------- render: point-cloud echoes, glow pass, parallax spores, glyph creatures, HUD, echo-drawn title ----------
const DEPTH_TINT = [[120, 160, 200], [120, 160, 200], [110, 175, 190], [140, 150, 215], [100, 180, 175], [160, 150, 205], [175, 135, 150], [135, 120, 200], [180, 90, 105]];
const R = {
  cam: { x: 0, y: 0 }, zoom: 3, dpr: 1, w: 0, h: 0, frameMs: 0, fps: 60, sat: 0, tw: [], twNext: 0,
  init() {
    this.cv = document.getElementById('cv');
    this.c = this.cv.getContext('2d', { alpha: false });
    const g = document.createElement('canvas'); g.width = g.height = 128;
    const gc = g.getContext('2d'), id = gc.createImageData(128, 128);
    for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    gc.putImageData(id, 0, 0); this.grain = this.c.createPattern(g, 'repeat');
    const s = this.glow = document.createElement('canvas'); s.width = s.height = 64;
    const sc = s.getContext('2d'), rg = sc.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.22, 'rgba(255,255,255,.38)'); rg.addColorStop(0.6, 'rgba(255,255,255,.08)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    sc.fillStyle = rg; sc.fillRect(0, 0, 64, 64);
    this.tints = {}; this.buckets = Array.from({ length: 4 * 9 }, () => []);
    this.b1 = document.createElement('canvas'); this.b2 = document.createElement('canvas');
    this.b1c = this.b1.getContext('2d'); this.b2c = this.b2.getContext('2d');
    this.spores = Array.from({ length: 150 }, () => ({ x: Math.random(), y: Math.random(), z: 0.15 + Math.random() * 0.5, r: 0.6 + Math.random() * 1.6, a: 0.05 + Math.random() * 0.17, ph: Math.random() * TAU }));
    this.resize(); addEventListener('resize', () => this.resize());
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => { this.titleKey = ''; });
  },
  tinted(col) {
    const k = col.join(','); if (this.tints[k]) return this.tints[k];
    const s = document.createElement('canvas'); s.width = s.height = 64; const c = s.getContext('2d');
    c.drawImage(this.glow, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = rgba(col, 1); c.fillRect(0, 0, 64, 64);
    return (this.tints[k] = s);
  },
  prewarm() { for (const col of [COL.moth, COL.shard, COL.bell, COL.song, COL.enemy, [255, 238, 200], ...Object.values(PALETTES).map(p => p.c)]) this.tinted(col); },
  resize() {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = Math.max(1, Math.floor(innerWidth * this.dpr)); this.h = Math.max(1, Math.floor(innerHeight * this.dpr));
    this.cv.width = this.w; this.cv.height = this.h;
    this.zoom = Math.max(1.3 * this.dpr, Math.min(this.w, this.h) / (T * 22));
    const se = document.getElementById('sat'); this.sat = se ? se.offsetHeight : 0;
    this.b1.width = Math.max(1, this.w >> 2); this.b1.height = Math.max(1, this.h >> 2);
    this.b2.width = Math.max(1, this.w >> 3); this.b2.height = Math.max(1, this.h >> 3);
    const v = this.vig = document.createElement('canvas'); v.width = 256; v.height = 256;
    const vc = v.getContext('2d'), rg = vc.createRadialGradient(128, 128, 30, 128, 128, 182);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(0.6, 'rgba(0,0,0,.25)'); rg.addColorStop(1, 'rgba(0,0,0,.9)'); vc.fillStyle = rg; vc.fillRect(0, 0, 256, 256);
    const rv = this.rvig = document.createElement('canvas'); rv.width = 256; rv.height = 256;
    const rc = rv.getContext('2d'), rr = rc.createRadialGradient(128, 128, 60, 128, 128, 182);
    rr.addColorStop(0, 'rgba(255,40,30,0)'); rr.addColorStop(1, 'rgba(255,40,30,1)'); rc.fillStyle = rr; rc.fillRect(0, 0, 256, 256);
    this.titleKey = '';
  },
  snapCam(x, y) { this.cam.x = x; this.cam.y = y; },
  pal() { return (PALETTES[Store.data.settings.palette] || PALETTES.bone).c; },
  hi() { return Store.data.settings.quality !== 'low'; },
  font(px, w = 500, it = false) { return `${it ? 'italic ' : ''}${w} ${Math.round(px)}px "EB Garamond", Georgia, "Times New Roman", serif`; },

  draw(dt) {
    const t0 = performance.now();
    this.fps = lerp(this.fps, dt > 0 ? 1 / dt : 60, 0.05);
    this.guard(dt);
    const play = ['play', 'paused', 'roost', 'chapter', 'dying', 'ending', 'over'].includes(G.state) && G.L;
    const L = play ? G.L : (G.demo ? G.demo.L : null);
    const c = this.c, S = Store.data.settings;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#02040a'; c.fillRect(0, 0, this.w, this.h);
    if (!L) { this.drawTitle(c); return; }
    const now = L.time, pal = this.pal(), z = this.zoom;
    let tx, ty;
    if (play) { const p = L.player; tx = p.x + p.vx * 0.25; ty = p.y + p.vy * 0.25; } else { tx = G.demo.cam.x; ty = G.demo.cam.y; }
    const k = Math.min(1, dt * 4); this.cam.x += (tx - this.cam.x) * k; this.cam.y += (ty - this.cam.y) * k;
    let sx = 0, sy = 0;
    if (G.shake > 0) { sx = (Math.random() - 0.5) * G.shake * this.dpr; sy = (Math.random() - 0.5) * G.shake * this.dpr; G.shake = Math.max(0, G.shake - dt * 30); }
    // drifting spores: a far layer of faint light that gives the void depth
    const tint = DEPTH_TINT[Math.min(8, play && G.run ? G.run.depth : 3)];
    c.fillStyle = rgba(tint, 1);
    for (const s of this.spores) {
      s.ph += dt * 0.4;
      let x = (s.x * this.w - this.cam.x * z * s.z * 0.35 + Math.sin(s.ph) * 8 * this.dpr) % this.w; if (x < 0) x += this.w;
      let y = (s.y * this.h - this.cam.y * z * s.z * 0.35 - s.ph * 6 * this.dpr) % this.h; if (y < 0) y += this.h;
      c.globalAlpha = s.a * (0.6 + 0.4 * Math.sin(s.ph * 1.7)); const r = s.r * this.dpr * s.z * 1.6;
      c.fillRect(x - r / 2, y - r / 2, r, r);
    }
    c.globalAlpha = 1;
    const ox = this.w / 2 - this.cam.x * z + sx, oy = this.h / 2 - this.cam.y * z + sy;
    c.setTransform(z, 0, 0, z, ox, oy);
    const vx0 = (this.cam.x - this.w / 2 / z) - T, vx1 = (this.cam.x + this.w / 2 / z) + T;
    const vy0 = (this.cam.y - this.h / 2 / z) - T, vy1 = (this.cam.y + this.h / 2 / z) + T;
    // remembered walls
    const cx0 = Math.max(0, Math.floor(vx0 / T)), cx1 = Math.min(L.W - 1, Math.floor(vx1 / T));
    const cy0 = Math.max(0, Math.floor(vy0 / T)), cy1 = Math.min(L.H - 1, Math.floor(vy1 / T));
    const mb = [[], [], [], [], [], []], ml = L.memLife || 14;
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      const i = cy * L.W + cx, m = L.mem[i];
      if (m < 0 || m > now || !L.epC[i]) continue;
      const a = 0.06 + 0.3 * Math.max(0, 1 - (now - m) / ml);
      mb[Math.min(5, Math.floor((a - 0.06) / 0.3 * 6))].push(i);
    }
    const ps = 1.1;
    for (let b = 0; b < 6; b++) {
      if (!mb[b].length) continue;
      c.fillStyle = rgba(pal, 0.07 + b * 0.05); c.beginPath();
      for (const i of mb[b]) { const s = L.epS[i] * 2, n = L.epC[i]; for (let j = 0; j < n; j++) c.rect(L.ep[s + j * 2] - ps / 2, L.ep[s + j * 2 + 1] - ps / 2, ps, ps); }
      c.fill();
    }
    // live echoes, bucketed by kind and brightness
    const bk = this.buckets; for (const a of bk) a.length = 0;
    const E = Echo;
    for (let i = 0; i < E.N; i++) {
      const t = E.t[i]; if (t > now) continue;
      const age = now - t, life = E.l[i]; if (age > life) continue;
      const x = E.x[i], y = E.y[i]; if (x < vx0 || x > vx1 || y < vy0 || y > vy1) continue;
      const lvl = age < 0.09 ? 8 : Math.min(7, Math.floor(Math.pow(1 - age / life, 1.5) * 8));
      bk[E.k[i] * 9 + lvl].push(i);
    }
    const kc = [pal, COL.bell, COL.mute, [130, 185, 255]];
    c.globalCompositeOperation = 'lighter';
    for (let kk = 0; kk < 4; kk++) for (let lv = 0; lv < 9; lv++) {
      const arr = bk[kk * 9 + lv]; if (!arr.length) continue;
      const flash = lv === 8, sz = flash ? 2.2 : lv >= 6 ? 1.6 : 1.3;
      if (flash) c.fillStyle = kk === 2 ? 'rgba(255,120,100,1)' : 'rgba(255,255,255,0.95)';
      else { const col = kc[kk], w = lv >= 6 ? 0.35 : 0; c.fillStyle = `rgba(${Math.round(lerp(col[0], 255, w))},${Math.round(lerp(col[1], 255, w))},${Math.round(lerp(col[2], 255, w))},${((lv + 1) / 8 * 0.85).toFixed(3)})`; }
      c.beginPath(); for (const i of arr) c.rect(E.x[i] - sz / 2, E.y[i] - sz / 2, sz, sz); c.fill();
    }
    // wavefronts: a bright edge with a soft wake
    for (const g of L.rings) {
      const rr = (now - g.t0) * ECHO_SPEED; if (rr <= 0 || rr > g.r) continue;
      const col = g.kind === 1 ? COL.bell : g.kind === 2 ? COL.mute : g.kind === 3 ? [130, 185, 255] : pal, a = (g.kind === 3 ? 0.12 : 0.26) * (1 - rr / g.r);
      for (const [off, m, lw] of [[0, 1, 1.3], [-3, 0.45, 2.2], [-8, 0.18, 4]]) {
        if (rr + off <= 0) continue;
        c.strokeStyle = rgba(col, a * m); c.lineWidth = lw / z * this.dpr;
        c.beginPath(); c.arc(g.x, g.y, rr + off, 0, TAU); c.stroke();
      }
    }
    const P = play ? L.player : null;
    const fade = (e, mult = 1) => {
      if (now < e.seenAt || now > e.seenUntil) return 0;
      const a = now - e.seenAt; return (a < 0.08 ? 1 : Math.pow(1 - a / (e.seenUntil - e.seenAt), 1.2)) * mult;
    };
    const near = (e, r) => P ? clamp(1 - hyp(e.x - P.x, e.y - P.y) / r, 0, 1) : 0;
    const inView = (e, m = 40) => e.x > vx0 - m && e.x < vx1 + m && e.y > vy0 - m && e.y < vy1 + m;
    // moths: the cave's only free light
    for (const m of L.moths) {
      if (m.got || !inView(m)) continue;
      const fl = 0.55 + 0.25 * Math.sin(m.ph * 3.1) + 0.2 * Math.sin(m.ph * 7.3);
      c.globalAlpha = 0.5 * fl; c.drawImage(this.tinted(COL.moth), m.x - 15, m.y - 15, 30, 30);
      c.globalAlpha = 0.95; c.fillStyle = rgba(COL.moth, 1);
      const w = Math.abs(Math.sin(m.ph * 4)) * 2.2;
      c.fillRect(m.x - 0.8, m.y - 0.9, 1.6, 1.8);
      c.beginPath(); c.moveTo(m.x - 0.5, m.y - 0.3); c.lineTo(m.x - 0.6 - w * 1.3, m.y - 1.6); c.lineTo(m.x - 0.6 - w, m.y + 0.8); c.closePath();
      c.moveTo(m.x + 0.5, m.y - 0.3); c.lineTo(m.x + 0.6 + w * 1.3, m.y - 1.6); c.lineTo(m.x + 0.6 + w, m.y + 0.8); c.closePath(); c.fill();
    }
    c.globalAlpha = 1;
    // shards: faceted crystals
    for (const s of L.shards) {
      if (s.got || !inView(s)) continue;
      const a = Math.max(fade(s), near(s, 1.8 * T) * 0.6, B('shard_sense') ? 0.12 + 0.08 * Math.sin(now * 2 + s.hum) : 0);
      if (a <= 0.01) continue;
      const bob = Math.sin(now * 2 + s.hum) * 1, y = s.y + bob;
      c.globalAlpha = a * 0.7; c.drawImage(this.tinted(COL.shard), s.x - 16, y - 16, 32, 32);
      c.globalAlpha = a; c.fillStyle = rgba([225, 210, 255], 1);
      c.beginPath(); c.moveTo(s.x, y - 6); c.lineTo(s.x - 3.4, y); c.lineTo(s.x, y + 6); c.closePath(); c.fill();
      c.fillStyle = rgba(COL.shard, 1);
      c.beginPath(); c.moveTo(s.x, y - 6); c.lineTo(s.x + 3.4, y); c.lineTo(s.x, y + 6); c.closePath(); c.fill();
      const sp = (now * 0.7 + s.hum) % 2.2;
      if (sp < 0.25) { const q = 1 - sp / 0.25; c.globalAlpha = a * q; c.fillStyle = '#fff'; c.fillRect(s.x + 2 - 3 * q, y - 3.5, 6 * q, 0.5); c.fillRect(s.x + 2 - 0.25, y - 3.5 - 3 * q, 0.5, 6 * q); }
    }
    // bellflowers
    for (const b of L.bells) {
      if (!inView(b)) continue;
      const lit = clamp(1 - (now - b.lit) / 1.6, 0, 1), a = Math.max(fade(b, 0.8), lit, near(b, 1.5 * T) * 0.4);
      if (a <= 0.01) continue;
      if (lit > 0) { c.globalAlpha = lit * 0.8; c.drawImage(this.tinted(COL.bell), b.x - 26, b.y - 26, 52, 52); }
      c.globalAlpha = a; c.fillStyle = rgba(COL.bell, 1);
      for (let j = 0; j < 6; j++) { const an = j / 6 * TAU + now * 0.25, r1 = 2.8 + lit * 1.5; c.beginPath(); c.ellipse(b.x + Math.cos(an) * r1, b.y + Math.sin(an) * r1, 1.6, 0.9, an, 0, TAU); c.fill(); }
      c.fillStyle = '#eafffb'; c.fillRect(b.x - 0.7, b.y - 0.7, 1.4, 1.4);
    }
    // lost verse
    if (L.song && !L.song.got) {
      const s = L.song, a = Math.max(fade(s), near(s, 1.6 * T) * 0.5);
      if (a > 0.01) {
        c.globalAlpha = a * 0.6; c.drawImage(this.tinted(COL.song), s.x - 18, s.y - 18, 36, 36);
        c.globalAlpha = a; c.strokeStyle = rgba(COL.song, 1); c.lineWidth = 0.9; c.beginPath();
        for (let j = 0; j < 44; j++) { const an = j * 0.42 + now, rr = j * 0.12; j ? c.lineTo(s.x + Math.cos(an) * rr, s.y + Math.sin(an) * rr) : c.moveTo(s.x, s.y); }
        c.stroke();
        c.fillStyle = rgba(COL.song, 1);
        for (let j = 0; j < 3; j++) { const an = now * 1.3 + j * TAU / 3; c.fillRect(s.x + Math.cos(an) * 8 - 0.6, s.y + Math.sin(an) * 8 - 0.6, 1.2, 1.2); }
      }
    }
    // a lost member of the colony: small, warm, trembling
    if (L.kin && !L.kin.got && inView(L.kin)) {
      const k = L.kin, a = Math.max(fade(k), near(k, 2 * T) * 0.6);
      if (a > 0.01) {
        const sh = Math.sin(now * 23 + k.ph) * 0.4;
        c.globalAlpha = a * 0.7; c.drawImage(this.tinted(COL.kin), k.x - 18, k.y - 18, 36, 36);
        c.globalAlpha = a; this.drawBat(c, { x: k.x + sh, y: k.y, flap: now * 2 + k.ph, inv: 0 }, COL.kin, now, true, 0.7);
      }
    }
    if (L.kinFly) {
      const f = L.kinFly, q = f.t / 3;
      c.globalAlpha = (1 - q) * 0.9; this.drawBat(c, { x: f.x + Math.sin(f.t * 4) * 6, y: f.y - f.t * 40, flap: f.t * 22, inv: 0 }, COL.kin, now, true, 0.7);
      c.globalAlpha = (1 - q) * 0.5; c.drawImage(this.tinted(COL.kin), f.x - 20, f.y - f.t * 40 - 20, 40, 40);
    }
    c.globalAlpha = 1;
    // the way down
    {
      const g = L.gate, a = Math.max(fade(g), g.open ? 0.75 : 0);
      if (a > 0.01 && inView(g, 80)) {
        if (g.open) {
          c.globalAlpha = 0.4 + 0.15 * Math.sin(now * 2); c.drawImage(this.tinted(pal), g.x - 40, g.y - 40, 80, 80);
          c.fillStyle = rgba(pal, 1);
          for (let j = 0; j < 28; j++) {
            const f = (now * 0.45 + j / 28) % 1, rr = (1 - f) * 30, an = j * 2.4 + f * 3.2;
            c.globalAlpha = f * 0.9; c.fillRect(g.x + Math.cos(an) * rr - 0.6, g.y + Math.sin(an) * rr - 0.6, 1.2, 1.2);
          }
        }
        c.globalAlpha = a; c.fillStyle = rgba(pal, 1);
        for (const [n, r0, sp] of [[20, 10, 0.6], [12, 14.5, -0.35]]) for (let j = 0; j < n; j++) {
          const an = j / n * TAU + (g.open ? now * sp : 0);
          c.fillRect(g.x + Math.cos(an) * r0 - 0.7, g.y + Math.sin(an) * r0 - 0.7, 1.4, 1.4);
        }
        if (g.open) { c.beginPath(); c.arc(g.x, g.y, 3 + Math.sin(now * 3), 0, TAU); c.fill(); }
      }
    }
    // hunters: drawn where the wave caught them
    for (const e of L.enemies) {
      if (e.type === 'mute') { this.drawMute(c, e, now, P); continue; }
      const a = fade(e), n = near(e, 1.7 * T) * 0.55;
      if (a > 0.01) this.drawHunter(c, e, e.gx, e.gy, a, now);
      if (n > 0.01) this.drawHunter(c, e, e.x, e.y, n, now);
    }
    c.globalAlpha = 1;
    if (P) {
      if (P.noise > 0.25) { c.strokeStyle = rgba(pal, 0.05 + P.noise * 0.012); c.lineWidth = 0.8; c.setLineDash([2, 4]); c.beginPath(); c.arc(P.x, P.y, P.noise * T, now * 0.5, now * 0.5 + TAU); c.stroke(); c.setLineDash([]); }
      if (P.trail) P.trail.forEach((q, i) => { c.globalAlpha = (i + 1) / P.trail.length * 0.25; this.drawBat(c, { ...P, x: q[0], y: q[1], inv: 0 }, pal, now, true); });
      c.globalAlpha = 1;
      if (G.state !== 'dying' || Math.random() < 0.5) this.drawBat(c, P, pal, now);
      if (P.charging && P.charge > 0.18) {
        const cc = clamp((P.charge - 0.18) / 0.8, 0, 1);
        c.strokeStyle = rgba(pal, 0.25 + cc * 0.6); c.lineWidth = 1.1;
        c.beginPath(); c.arc(P.x, P.y, 10 + cc * 3, -Math.PI / 2, -Math.PI / 2 + cc * TAU); c.stroke();
        for (let j = 0; j < 12; j++) { const an = -Math.PI / 2 + j / 12 * TAU; if (j / 12 > cc) break; c.fillStyle = rgba(pal, 0.8); c.fillRect(P.x + Math.cos(an) * (15 + cc * 3) - 0.4, P.y + Math.sin(an) * (15 + cc * 3) - 0.4, 0.8, 0.8); }
        if (cc >= 1) { c.globalAlpha = 0.4 + 0.3 * Math.sin(now * 20); c.beginPath(); c.arc(P.x, P.y, 16, 0, TAU); c.stroke(); c.globalAlpha = 1; }
      }
      if (P.dashCd > 0) { const f = 1 - P.dashCd / (1.6 * (B('ghost_dash') ? 0.7 : 1)); c.strokeStyle = rgba(pal, 0.3); c.lineWidth = 0.8; c.beginPath(); c.arc(P.x, P.y, 7.5, Math.PI * 0.75, Math.PI * (0.75 + 0.5 * f)); c.stroke(); }
      if (S.captions) for (const q of L.cues) {
        const age = now - q.t, a = (1 - age / 1.3) * clamp(1.4 - q.d / (28 * T), 0.3, 1);
        c.strokeStyle = rgba(q.kind === 'bell' ? COL.bell : q.kind === 'shard' ? COL.shard : q.kind === 'kin' ? COL.kin : COL.danger, a * 0.85);
        c.lineWidth = q.kind === 'enemy' ? 1.8 : 1.2;
        const rr = 22 + age * 6; c.beginPath(); c.arc(P.x, P.y, rr, q.a - 0.32, q.a + 0.32); c.stroke();
        c.lineWidth = 0.8; c.beginPath(); c.arc(P.x, P.y, rr + 3, q.a - 0.18, q.a + 0.18); c.stroke();
      }
    }
    c.globalCompositeOperation = 'source-over';
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
    if (!play && UI.screen === 'title') { c.fillStyle = 'rgba(2,4,10,.5)'; c.fillRect(0, 0, this.w, this.h); }
    if (!play) this.drawTitle(c);
    this.bloom(c);
    c.drawImage(this.vig, 0, 0, this.w, this.h);
    if (play && G.run && G.run.hearts === 1 && G.state === 'play') {
      c.globalAlpha = (0.12 + 0.1 * Math.max(0, Math.sin(performance.now() / 1000 * 7))) * (S.reduceFlash ? 0.5 : 1);
      c.drawImage(this.rvig, 0, 0, this.w, this.h); c.globalAlpha = 1;
    }
    if (S.grain) {
      c.globalAlpha = 0.045; c.fillStyle = this.grain;
      c.save(); c.translate((Math.random() * 128) | 0, (Math.random() * 128) | 0); c.fillRect(-128, -128, this.w + 256, this.h + 256); c.restore();
      c.globalAlpha = 1;
    }
    if (play && P) {
      if (G.flash > 0) { c.fillStyle = rgba(COL.danger, (S.reduceFlash ? 0.12 : 0.32) * G.flash); c.fillRect(0, 0, this.w, this.h); G.flash = Math.max(0, G.flash - dt * 2.2); }
      if (G.state === 'play' || G.state === 'dying') { this.exitHint(c, L, P, ox, oy, z); this.hud(c, L, P, dt); }
      else { c.fillStyle = 'rgba(2,4,10,.4)'; c.fillRect(0, 0, this.w, this.h); }
    }
    if (G.state === 'dying') { c.fillStyle = `rgba(2,4,10,${clamp(1 - G.dieT / 2.4, 0, 1) * 0.8})`; c.fillRect(0, 0, this.w, this.h); }
    if (G.fade > 0) { c.fillStyle = `rgba(2,4,10,${G.fade})`; c.fillRect(0, 0, this.w, this.h); G.fade = Math.max(0, G.fade - dt * 1.4); }
    this.toastsDraw(c, dt);
    if (S.fps) { c.font = this.font(13 * this.dpr, 500); c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillStyle = 'rgba(222,233,228,.55)'; c.fillText(Math.round(this.fps) + ' fps · ' + this.frameMs.toFixed(1) + ' ms', this.w - 14 * this.dpr, this.h - 10 * this.dpr); }
    this.frameMs = performance.now() - t0;
  },
  // if a device can't hold its frame rate with the glow pass, drop the glow once and say so
  guard(dt) {
    const S = Store.data.settings;
    if (G.state !== 'play' || !S.bloom || !this.hi() || this.guarded || document.hidden) { this.slowT = 0; this.playT = 0; return; }
    this.playT = (this.playT || 0) + dt; if (this.playT < 3) return;
    this.slowT = dt > 1 / 40 ? (this.slowT || 0) + dt : Math.max(0, (this.slowT || 0) - dt * 0.5);
    if (this.slowT > 2.5) { this.guarded = true; S.bloom = false; Store.save(); UI.toast('Glow turned off', 'to keep play smooth. Turn it back on in Settings, Display.'); }
  },
  // cheap glow: downsample twice, add back blurred
  bloom(c) {
    const S = Store.data.settings; if (!S.bloom || !this.hi()) return;
    const a = this.b1c, b = this.b2c;
    this.bf = (this.bf || 0) + 1;
    if (this.bf % 2 === 0) {
    a.globalCompositeOperation = 'copy'; a.imageSmoothingEnabled = true; a.drawImage(this.cv, 0, 0, this.b1.width, this.b1.height);
    b.globalCompositeOperation = 'copy'; b.imageSmoothingEnabled = true; b.drawImage(this.b1, 0, 0, this.b2.width, this.b2.height);
    }
    c.save(); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true;
    c.globalAlpha = 0.5; c.drawImage(this.b2, 0, 0, this.w, this.h);
    c.globalAlpha = 0.3; c.drawImage(this.b1, 0, 0, this.w, this.h);
    c.restore();
  },
  drawBat(c, p, pal, now, ghost, scale = 1) {
    const blink = !ghost && p.inv > 0 && G.state === 'play' ? (Math.sin(now * 30) > 0 ? 0.35 : 1) : 1;
    const ga = c.globalAlpha;
    if (!ghost) { c.globalAlpha = 0.14 * blink; c.drawImage(this.tinted(pal), p.x - 18, p.y - 18, 36, 36); }
    c.globalAlpha = ga * blink; c.fillStyle = rgba(pal, 1);
    c.save(); c.translate(p.x, p.y); if (scale !== 1) c.scale(scale, scale);
    const f = Math.sin(p.flap);
    c.beginPath(); c.ellipse(0, 0.5, 1.9, 3, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-1.4, -2.2); c.lineTo(-1.1, -4.3); c.lineTo(-0.2, -2.6); c.moveTo(1.4, -2.2); c.lineTo(1.1, -4.3); c.lineTo(0.2, -2.6); c.fill();
    for (const s of [-1, 1]) {
      c.save(); c.scale(s, 1); c.beginPath();
      c.moveTo(1.2, -1); c.quadraticCurveTo(4, -3.5 - f * 2.5, 8.6, -2.2 - f * 3.2);
      c.lineTo(7.5, 0.4 - f * 1.5); c.lineTo(5.7, -0.2 - f); c.lineTo(4.7, 1.6 - f * 0.6); c.lineTo(3, 0.6); c.lineTo(1.3, 1.6);
      c.closePath(); c.fill(); c.restore();
    }
    if (!ghost) { c.fillStyle = '#02040a'; c.fillRect(-1, -1.2, 0.6, 0.6); c.fillRect(0.4, -1.2, 0.6, 0.6); }
    c.restore(); c.globalAlpha = ga;
  },
  drawHunter(c, e, x, y, a, now) {
    c.globalAlpha = a * 0.6; c.drawImage(this.tinted(COL.enemy), x - 20, y - 20, 40, 40);
    c.globalAlpha = a; c.strokeStyle = rgba(COL.enemy, 1); c.fillStyle = 'rgba(70,12,10,1)'; c.lineWidth = 1;
    if (e.type === 'stalker') {
      const n = 11, rot = e.seed * TAU + now * 0.3;
      c.beginPath();
      for (let j = 0; j <= n * 2; j++) {
        const an = rot + j / (n * 2) * TAU, rr = j % 2 ? 3.8 : 7.6 + 1.6 * Math.sin(j * 1.7 + e.seed * 9 + now * 4);
        const px = x + Math.cos(an) * rr, py = y + Math.sin(an) * rr; j ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.arc(x, y + 0.5, 2.2, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
      c.fillStyle = rgba(COL.enemy, 1); c.fillRect(x - 0.6, y - 1.6, 1.2, 1.2);
      if (e.stun > 0) { c.beginPath(); c.arc(x, y, 11, now * 6, now * 6 + 1.2); c.stroke(); c.beginPath(); c.arc(x, y, 11, now * 6 + Math.PI, now * 6 + Math.PI + 1.2); c.stroke(); }
    } else {
      const open = e.state === 'wind' || e.state === 'lunge' ? 0.9 : 0.35 + Math.sin(now * 1.5 + e.seed * 9) * 0.05;
      c.beginPath(); c.arc(x, y, 7, Math.PI * (1 + open * 0.3), Math.PI * (2 - open * 0.3)); c.stroke();
      c.beginPath(); c.arc(x, y, 7, Math.PI * open * 0.3, Math.PI * (1 - open * 0.3)); c.stroke();
      c.lineWidth = 0.8;
      for (let j = -3; j <= 3; j++) { const xx = x + j * 1.7, l = 2.4 - Math.abs(j) * 0.35; c.beginPath(); c.moveTo(xx, y - 6.4 + open * 2); c.lineTo(xx, y - 6.4 + open * 2 + l); c.moveTo(xx, y + 6.4 - open * 2); c.lineTo(xx, y + 6.4 - open * 2 - l); c.stroke(); }
    }
  },
  drawMute(c, e, now, P) {
    const nearA = P ? clamp(1 - (hyp(e.x - P.x, e.y - P.y) - e.r) / (4 * T), 0, 1) : 0;
    if (e.calm) {
      c.globalAlpha = 0.55 + 0.2 * Math.sin(now); c.drawImage(this.tinted([255, 238, 200]), e.x - 60, e.y - 60, 120, 120);
      c.globalAlpha = 0.85; c.strokeStyle = 'rgba(255,238,200,.85)'; c.lineWidth = 0.8;
      for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(e.x, e.y, e.r * (0.4 + j * 0.28) + Math.sin(now * 2 + j) * 2, 0, TAU); c.stroke(); }
      return;
    }
    if (nearA > 0) {
      c.globalAlpha = nearA * 0.7; c.strokeStyle = rgba(COL.mute, 1); c.lineWidth = 1;
      for (let j = 0; j < 5; j++) { c.beginPath(); c.arc(e.x, e.y, e.r * (0.3 + j * 0.2) + Math.sin(now * 3 + j * 2) * 1.5, 0, TAU); c.stroke(); }
    }
  },
  exitHint(c, L, P, ox, oy, z) {
    const s = Store.data.settings;
    if (!L.gate.open || !s.exitHint || (G.run && D_().noHint)) return;
    const gx = L.gate.x * z + ox, gy = L.gate.y * z + oy, m = 36 * this.dpr;
    if (gx > m && gx < this.w - m && gy > m && gy < this.h - m) return;
    const cx = this.w / 2, cy = this.h / 2, a = Math.atan2(gy - cy, gx - cx);
    const ex = clamp(cx + Math.cos(a) * this.w, m, this.w - m), ey = clamp(cy + Math.sin(a) * this.h, 110 * this.dpr, this.h - 60 * this.dpr);
    c.save(); c.translate(ex, ey); c.rotate(a); c.strokeStyle = rgba(this.pal(), 0.6 + 0.2 * Math.sin(L.time * 3)); c.lineWidth = 2 * this.dpr;
    const u = 9 * this.dpr; c.beginPath(); c.moveTo(-u, -u); c.lineTo(0, 0); c.lineTo(-u, u); c.moveTo(-u * 2, -u); c.lineTo(-u, 0); c.lineTo(-u * 2, u); c.stroke(); c.restore();
  },
  // text with inline button chips: "Hold {glide} to glide"
  rich(c, text, x, y, size, col, maxW) {
    const parts = text.split(/(\{\w+\})/).filter(Boolean);
    let fs = size, total;
    const measure = () => {
      total = 0;
      for (const p of parts) {
        if (p[0] === '{') { c.font = this.font(fs * 0.78, 600); total += c.measureText(Input.glyph(p.slice(1, -1))).width + fs * 0.9; }
        else { c.font = this.font(fs, 500, true); total += c.measureText(p).width; }
      }
    };
    measure(); while (total > maxW && fs > 11 * this.dpr) { fs *= 0.92; measure(); }
    let cx = x - total / 2;
    c.textAlign = 'left'; c.textBaseline = 'middle';
    for (const p of parts) {
      if (p[0] === '{') {
        const lab = Input.glyph(p.slice(1, -1)); c.font = this.font(fs * 0.78, 600);
        const w = c.measureText(lab).width + fs * 0.62, h = fs * 1.25, rx = cx + fs * 0.14;
        c.strokeStyle = col.replace(/[\d.]+\)$/, '0.75)'); c.lineWidth = 1.2 * this.dpr;
        c.beginPath(); if (c.roundRect) c.roundRect(rx, y - h / 2, w, h, h * 0.28); else c.rect(rx, y - h / 2, w, h); c.stroke();
        c.fillStyle = col; c.fillText(lab, rx + fs * 0.31, y + fs * 0.03);
        cx += w + fs * 0.28;
      } else { c.font = this.font(fs, 500, true); c.fillStyle = col; c.fillText(p, cx, y); cx += c.measureText(p).width; }
    }
  },
  hud(c, L, P, dt) {
    const r = G.run, s = this.dpr * Store.data.settings.uiScale, pal = this.pal(), pad = 22 * s;
    const top = pad + this.sat * this.dpr, now = L.time;
    c.textBaseline = 'middle';
    for (let i = 0; i < r.maxHearts; i++) {
      const x = pad + i * 30 * s, full = i < r.hearts, low = r.hearts === 1 && full;
      const y = top + 6 * s + (low ? Math.sin(now * 7) * 1.2 * s : 0);
      c.save(); c.translate(x + 12 * s, y); c.scale(s * 1.25, s * 1.25);
      c.beginPath(); c.moveTo(0, 2); c.quadraticCurveTo(-4, -6, -10, -4); c.lineTo(-8, 0); c.lineTo(-6, -1); c.lineTo(-5, 2); c.lineTo(-2, 1); c.closePath();
      c.moveTo(0, 2); c.quadraticCurveTo(4, -6, 10, -4); c.lineTo(8, 0); c.lineTo(6, -1); c.lineTo(5, 2); c.lineTo(2, 1); c.closePath();
      if (full) { c.fillStyle = low ? rgba([255, 150, 130], 0.95) : rgba(pal, 0.95); c.fill(); } else { c.strokeStyle = rgba(pal, 0.3); c.lineWidth = 0.8; c.stroke(); }
      c.restore();
    }
    const my = top + 36 * s, mx = pad + 6 * s;
    c.globalAlpha = 0.5; c.drawImage(this.tinted(COL.moth), mx - 12 * s, my - 12 * s, 24 * s, 24 * s); c.globalAlpha = 1;
    c.fillStyle = rgba(COL.moth, 1); c.beginPath(); c.arc(mx, my, 3 * s, 0, TAU); c.fill();
    c.strokeStyle = rgba(COL.moth, 0.2); c.lineWidth = 2 * s; c.beginPath(); c.arc(mx, my, 8.5 * s, 0, TAU); c.stroke();
    c.strokeStyle = rgba(COL.moth, 0.9); c.beginPath(); c.arc(mx, my, 8.5 * s, -Math.PI / 2, -Math.PI / 2 + r.mothMeter / 12 * TAU); c.stroke();
    c.font = this.font(19 * s, 500); c.fillStyle = rgba(pal, 0.9); c.textAlign = 'left';
    c.fillText(String(r.moths), mx + 16 * s, my + 1 * s);
    const n = L.shardsNeeded, sw = 19 * s, sx0 = this.w - pad - 60 * s - (n - 1) * sw;
    for (let i = 0; i < n; i++) {
      const x = sx0 + i * sw, y = top + 6 * s, got = i < L.shardsGot;
      if (got) { c.globalAlpha = 0.6; c.drawImage(this.tinted(COL.shard), x - 12 * s, y - 12 * s, 24 * s, 24 * s); c.globalAlpha = 1; }
      c.beginPath(); c.moveTo(x, y - 8 * s); c.lineTo(x + 5 * s, y); c.lineTo(x, y + 8 * s); c.lineTo(x - 5 * s, y); c.closePath();
      if (got) { c.fillStyle = rgba(COL.shard, 1); c.fill(); } else { c.strokeStyle = rgba(COL.shard, 0.45); c.lineWidth = 1.2 * s; c.stroke(); }
    }
    c.textAlign = 'right'; c.font = this.font(15 * s, 500, true);
    let ly = top + 30 * s;
    if (L.gate.open) { c.fillStyle = rgba(pal, 0.6 + 0.25 * Math.sin(now * 3)); c.fillText('the way is open', this.w - pad - 52 * s, ly); ly += 20 * s; }
    if (r.songs.length) { c.fillStyle = rgba(COL.song, 0.7); c.fillText('verses ' + r.songs.length + ' / 4', this.w - pad - 52 * s, ly); }
    c.font = this.font(15 * s, 500, true); c.textAlign = 'left'; c.fillStyle = rgba(pal, 0.42);
    const narrow = this.w / this.dpr < 720, by = this.h - pad - (Input.touchMode() ? 150 * this.dpr : 0);
    c.fillText(r.mode === 'story' ? 'Chapter ' + ROMAN[r.depth] + ' · ' + STORY[r.depth].title : 'Depth ' + r.depth + ' · ' + depthName(r) + (r.mode === 'daily' ? ' · daily' : r.mode === 'endless' ? ' · endless' : ''), pad, by);
    if (r.mode === 'story' && L.kin) { c.textAlign = narrow ? 'left' : 'right'; c.fillStyle = rgba(COL.kin, L.kin.got ? 0.75 : 0.5); c.fillText(L.kin.got ? KIN[L.kin.idx].name + ' is on the way home' : (L.kin.heard ? 'a lost voice answered' : 'a lost voice, somewhere'), narrow ? pad : this.w - pad, narrow ? by - 22 * s : by); }
    if (G.banner) {
      const b = G.banner; b.t += dt; const a = b.t < 0.6 ? b.t / 0.6 : b.t > 3 ? Math.max(0, 1 - (b.t - 3) / 1) : 1;
      if (b.t > 4) G.banner = null;
      const cy = this.h * 0.3, fsz = clamp(innerWidth / 18, 30, 50) * s;
      c.textAlign = 'center'; c.fillStyle = rgba(pal, a * 0.55); c.font = this.font(17 * s, 500, true); if (b.a) c.fillText(b.a, this.w / 2, cy - 34 * s);
      c.fillStyle = rgba(pal, a); c.font = this.font(fsz, 500); c.fillText(b.b, this.w / 2, cy + 4 * s);
      const tw = c.measureText(b.b).width, ext = Math.min(1, b.t / 1.2) * 60 * s;
      c.strokeStyle = rgba(pal, a * 0.4); c.lineWidth = 1 * this.dpr; c.beginPath();
      c.moveTo(this.w / 2 - tw / 2 - 18 * s, cy + 4 * s); c.lineTo(this.w / 2 - tw / 2 - 18 * s - ext, cy + 4 * s);
      c.moveTo(this.w / 2 + tw / 2 + 18 * s, cy + 4 * s); c.lineTo(this.w / 2 + tw / 2 + 18 * s + ext, cy + 4 * s); c.stroke();
    }
    if (!G.story && G.storyQ.length) G.story = G.storyQ.shift();
    if (G.story) {
      const st = G.story; st.t += dt;
      if (st.t >= 0) {
        const dur = st.dur || (st.dur = clamp(2.6 + st.text.length * 0.05, 3.5, 8)), a = st.t < 0.6 ? st.t / 0.6 : st.t > dur ? Math.max(0, 1 - (st.t - dur) / 0.6) : 1;
        if (st.t > dur + 0.6) G.story = null;
        const col = st.col || COL.song, y = this.h * 0.74 - (Input.touchMode() ? 60 * this.dpr : 0);
        c.textAlign = 'center'; c.font = this.font(clamp(innerWidth / 36, 18, 25) * s, 500, st.it !== false); c.fillStyle = rgba(col, a);
        const nl = this.wrap(c, st.text, this.w / 2, y, Math.min(this.w * 0.82, 660 * s), 31 * s);
        if (st.sub) { c.font = this.font(13 * s, 600); c.fillStyle = rgba(col, a * 0.6); c.fillText(st.sub, this.w / 2, y - ((nl - 1) / 2) * 31 * s - 30 * s); }
      }
    }
    if (!G.hint && G.hintQ.length && !G.story) G.hint = { t: 0, text: G.hintQ.shift() };
    if (G.hint) {
      const h = G.hint; h.t += dt; const a = h.t < 0.4 ? h.t / 0.4 : h.t > 4.8 ? Math.max(0, 1 - (h.t - 4.8) / 0.6) : 1;
      if (h.t > 5.4) G.hint = null;
      const txt = typeof h.text === 'function' ? h.text() : h.text;
      this.rich(c, txt, this.w / 2, this.h - 72 * s - (Input.touchMode() ? 120 * this.dpr : 0), clamp(innerWidth / 42, 17, 21) * s, rgba(pal, a * 0.88), Math.min(this.w * 0.9, 720 * s));
    }
  },
  toastsDraw(c, dt) {
    if (!G.toasts.length) return;
    const s = this.dpr * Store.data.settings.uiScale, pal = this.pal(), top = 24 * s + this.sat * this.dpr;
    const q = G.toasts[0]; if (!q.t) { q.t = 0.0001; if (q.ach) AE.achieve(); } q.t += dt;
    const a = q.t < 0.4 ? q.t / 0.4 : q.t > 3 ? Math.max(0, 1 - (q.t - 3) / 0.5) : 1;
    if (q.t > 3.5) G.toasts.shift();
    c.textBaseline = 'middle'; c.textAlign = 'center';
    if (q.ach) { c.globalAlpha = a * 0.6; c.drawImage(this.tinted(COL.moth), this.w / 2 - 70 * s, top - 30 * s, 140 * s, 60 * s); c.globalAlpha = 1; }
    c.fillStyle = rgba(COL.moth, a); c.font = this.font(18 * s, 600); c.fillText(q.text, this.w / 2, top + 6 * s);
    if (q.sub) { c.fillStyle = rgba(pal, a * 0.6); c.font = this.font(14 * s, 500, true); c.fillText(q.sub, this.w / 2, top + 28 * s); }
  },
  wrap(c, text, x, y, maxW, lh) {
    const words = text.split(' '), lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    lines.push(line);
    lines.forEach((l, i) => c.fillText(l, x, y + (i - (lines.length - 1) / 2) * lh));
    return lines.length;
  },
  // ---- the title, set in echo points and lit by passing wavefronts ----
  titleWave() { this.tw.push(performance.now() / 1000); },
  buildTitle(rect) {
    const d = this.dpr, W = Math.max(1, Math.round(rect.width * d)), H = Math.max(1, Math.round(rect.height * d));
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const o = off.getContext('2d');
    o.font = this.font(100, 500); const tw = o.measureText('The Listening').width;
    const fs = Math.min(W / tw * 100 * 0.98, H / 1.95);
    o.font = this.font(fs, 500); o.fillStyle = '#fff'; o.textBaseline = 'alphabetic';
    o.fillText('The Listening', 0, fs * 0.86); o.fillText('Dark', 0, fs * 1.78);
    const img = o.getImageData(0, 0, W, H).data, step = Math.max(2, Math.round(fs / 30));
    const xs = [], ys = [];
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
      if (img[(y * W + x) * 4 + 3] > 110) { xs.push(rect.left * d + x + (Math.random() - 0.5) * step * 0.6); ys.push(rect.top * d + y + (Math.random() - 0.5) * step * 0.6); }
    }
    const n = xs.length, ox = rect.left * d - 70 * d, oy = rect.top * d + H * 0.5;
    const dist = new Float32Array(n); for (let i = 0; i < n; i++) dist[i] = hyp(xs[i] - ox, ys[i] - oy);
    this.tp = { x: Float32Array.from(xs), y: Float32Array.from(ys), d: dist, hit: new Float32Array(n).fill(-99), n, size: Math.max(1.5, step * 0.62), ox, oy };
    this.tb = [[], [], [], [], [], [], [], [], [], []];
  },
  drawTitle(c) {
    if (UI.screen !== 'title') return;
    const el = document.getElementById('titleBox'); if (!el) return;
    const rect = el.getBoundingClientRect(); if (rect.width < 10) return;
    const key = [rect.left, rect.top, rect.width, rect.height, this.dpr].map(Math.round).join(',');
    if (key !== this.titleKey) { this.buildTitle(rect); this.titleKey = key; }
    const tp = this.tp, now = performance.now() / 1000, sp = 950 * this.dpr, dt = 1 / 30;
    if (now > this.twNext) { this.twNext = now + 4.2; this.tw.push(now); }
    this.tw = this.tw.filter(t => (now - t) * sp < 3000 * this.dpr);
    for (const t of this.tw) { const r = (now - t) * sp, band = sp * dt * 1.5; for (let i = 0; i < tp.n; i++) if (tp.d[i] < r && tp.d[i] > r - band) tp.hit[i] = now; }
    const bk = this.tb; for (const b of bk) b.length = 0;
    for (let i = 0; i < tp.n; i++) { const a = 0.32 + 0.68 * Math.exp(-(now - tp.hit[i]) * 1.3); bk[Math.min(9, Math.floor(a * 10))].push(i); }
    const pal = this.pal(), sz = tp.size;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let b = 0; b < 10; b++) {
      if (!bk[b].length) continue;
      const w = b >= 8 ? 0.6 : 0;
      c.fillStyle = `rgba(${Math.round(lerp(pal[0], 255, w))},${Math.round(lerp(pal[1], 255, w))},${Math.round(lerp(pal[2], 255, w))},${((b + 1) / 10).toFixed(2)})`;
      c.beginPath(); for (const i of bk[b]) c.rect(tp.x[i] - sz / 2, tp.y[i] - sz / 2, sz, sz); c.fill();
    }
    for (const t of this.tw) { const r = (now - t) * sp; c.strokeStyle = rgba(pal, Math.max(0, 0.18 * (1 - r / (2600 * this.dpr)))); c.lineWidth = 1.2 * this.dpr; c.beginPath(); c.arc(tp.ox, tp.oy, r, 0, TAU); c.stroke(); }
    c.restore();
  }
};
