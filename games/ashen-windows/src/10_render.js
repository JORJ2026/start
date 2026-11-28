
/* ==========================================================================
   SECTION 14: RENDERING
   The world is drawn to an offscreen layer in greys and forced to greyscale
   when composited (ctx.filter where supported; the palette itself is the
   fallback). Darkness and lights are a second layer. Survivors and rare
   "color echoes" are drawn last, on top, in full color.
   ========================================================================== */
const Render = {
  S: 1, ls: 0.5, filterOK: false, resScale: 1, laundry: [], sky: null,
  /* frames-per-second independent chance scale for effects spawned while drawing (1.0 at 60 FPS) */
  rk() { return clamp((Game.rdt || 1 / 60) * 60, 0, 3); },
  init(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.wc = document.createElement('canvas'); this.wctx = this.wc.getContext('2d');
    this.lc = document.createElement('canvas'); this.lctx = this.lc.getContext('2d');
    try { this.filterOK = typeof this.ctx.filter === 'string'; } catch (e) { this.filterOK = false; }
    // film grain tile and vignette, built once
    this.grain = document.createElement('canvas'); this.grain.width = this.grain.height = 512;
    const g = this.grain.getContext('2d'), id = g.createImageData(512, 512);
    for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 22; }
    g.putImageData(id, 0, 0);
    this.vig = document.createElement('canvas'); this.vig.width = 240; this.vig.height = 135;
    const v = this.vig.getContext('2d'), gr = v.createRadialGradient(120, 67, 40, 120, 67, 140); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.5)'); v.fillStyle = gr; v.fillRect(0, 0, 240, 135);
    for (let i = 0; i < 8; i++) this.laundry.push(new Spring(0, 30, 2.2));
    const r = new RNG(77); this.sky = { far: [], mid: [] };
    for (let x = 0; x < 2400;) { const w = r.i(60, 150); this.sky.far.push({ x, w, h: r.i(70, 190), cut: r.i(0, 3), win: r.i(0, 5) }); x += w + r.i(4, 30); }
    for (let x = 0; x < 2400;) { const w = r.i(90, 220); this.sky.mid.push({ x, w, h: r.i(50, 150), cut: r.i(0, 3), win: r.i(0, 6) }); x += w + r.i(20, 90); }
    this.resize();
  },
  /* Fit the 16:9 logical view into the window, honoring devicePixelRatio and the adaptive resolution scale. */
  resize() {
    const wrap = document.getElementById('wrap'), cs = window.getComputedStyle ? getComputedStyle(wrap) : null;
    const pad = k => (cs ? parseFloat(cs[k]) || 0 : 0);
    const aw = Math.max(160, (window.innerWidth || W) - pad('paddingLeft') - pad('paddingRight')), ah = Math.max(90, (window.innerHeight || H) - pad('paddingTop') - pad('paddingBottom'));
    const fit = Math.min(aw / W, ah / H), dpr = clamp(num(window.devicePixelRatio, 1), 1, 3);
    const q = Save.data ? (Save.s.lowfx ? 'low' : Save.s.quality) : 'high', qs = q === 'low' ? 0.6 : q === 'medium' ? 0.8 : 1;
    this.S = clamp(fit * Math.min(dpr, q === 'high' ? 2 : 1.5) * qs * this.resScale, 0.4, 4);
    const pw = Math.max(2, Math.round(W * this.S)), ph = Math.max(2, Math.round(H * this.S));
    this.canvas.width = pw; this.canvas.height = ph; this.canvas.style.width = Math.floor(W * fit) + 'px'; this.canvas.style.height = Math.floor(H * fit) + 'px';
    this.wc.width = pw; this.wc.height = ph; this.ls = this.S * (q === 'high' ? 0.5 : 0.34);
    this.lc.width = Math.max(2, Math.round(W * this.ls)); this.lc.height = Math.max(2, Math.round(H * this.ls));
    this.portrait = (window.innerHeight || 1) > (window.innerWidth || 1) * 1.1;
  },
  /* --- sky and parallax skyline --- */
  backdrop(c, camX, night, o) {
    o = o || {}; const t = Game.time, g = c.createLinearGradient(0, 0, 0, H);
    if (night) { g.addColorStop(0, grey(10)); g.addColorStop(0.7, grey(34)); g.addColorStop(1, grey(22)); } else { g.addColorStop(0, grey(96)); g.addColorStop(0.7, grey(146)); g.addColorStop(1, grey(110)); }
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    Polish.sky(c, camX, night, t);
    if (night) { c.fillStyle = grey(190, 0.5); c.beginPath(); c.arc(500 - camX * 0.02, 96, 20, 0, TAU); c.fill(); c.fillStyle = grey(22, 0.9); c.beginPath(); c.arc(493 - camX * 0.02, 91, 18, 0, TAU); c.fill(); }
    // distant smoke columns
    for (let i = 0; i < 3; i++) { const sx = ((i * 420 + 180 - camX * 0.08) % 1300 + 1300) % 1300 - 150; c.fillStyle = grey(night ? 40 : 86, 0.35); for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(sx + Math.sin(t * 0.3 + k + i) * 10 + k * 9, 250 - k * 34, 16 + k * 7, 0, TAU); c.fill(); } }
    const layer = (list, par, base, col, winCol) => {
      const off = camX * par;
      for (const b of list) {
        const x = ((b.x - off) % 2400 + 2400) % 2400 - 200; if (x > W + 10) continue;
        c.fillStyle = col; c.fillRect(x, base - b.h, b.w, b.h + 200);
        c.fillStyle = col; if (b.cut === 1) { c.beginPath(); c.moveTo(x, base - b.h); c.lineTo(x + b.w * 0.4, base - b.h - 18); c.lineTo(x + b.w * 0.5, base - b.h); c.fill(); }
        if (b.cut === 2) { c.fillStyle = night ? grey(10) : grey(96); c.beginPath(); c.moveTo(x + b.w, base - b.h - 1); c.lineTo(x + b.w * 0.55, base - b.h - 1); c.lineTo(x + b.w * 0.8, base - b.h + 26); c.lineTo(x + b.w, base - b.h + 40); c.fill(); }
        c.fillStyle = winCol; for (let k = 0; k < b.win; k++) c.fillRect(x + 10 + (k * 37 % Math.max(12, b.w - 22)), base - b.h + 14 + (k * 23 % Math.max(10, b.h - 30)), 6, 9);
        Polish.roof(c, b, x, base - b.h, night, col, b.x + (par > 0.2 ? 5000 : 0), t);
      }
    };
    layer(this.sky.far, 0.12, 330, grey(night ? 24 : 78), grey(night ? 14 : 60));
    layer(this.sky.mid, 0.3, 380, grey(night ? 17 : 62), grey(night ? 8 : 44));
    // one distant window stays lit; now and then a silhouette crosses it
    if (night && !o.noWindow) { const wx = ((520 - camX * 0.3) % 2400 + 2400) % 2400 - 200, wy = 300; c.fillStyle = grey(150); c.fillRect(wx, wy, 14, 20); const k = (t % 15) / 15; if (k > 0.3 && k < 0.5) { c.fillStyle = grey(30); c.fillRect(wx + (k - 0.3) / 0.2 * 14 - 3, wy + 6, 6, 14); } c.fillStyle = grey(30); c.fillRect(wx + 6.5, wy, 1, 20); }
    Polish.skyFront(c, camX, night, t);
    // power lines and hanging laundry on spring sway
    const off = camX * 0.55;
    c.strokeStyle = grey(night ? 8 : 40); c.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      const px = ((i * 430 + 90 - off) % 2150 + 2150) % 2150 - 300, sp = this.laundry[i];
      c.fillStyle = grey(night ? 8 : 40); c.fillRect(px, 150, 4, 300);
      c.beginPath(); c.moveTo(px + 2, 160); c.quadraticCurveTo(px + 215, 205 + sp.x * 0.4, px + 432, 160); c.stroke();
      if (i % 2 === 0) for (let k = 0; k < 4; k++) { const lx = px + 120 + k * 46, ly = 186 + Math.sin((k + 0.8) / 4.8 * Math.PI) * 14; c.save(); c.translate(lx, ly); c.rotate(sp.x * 0.03 + Math.sin(t * 1.2 + k) * 0.05); c.fillStyle = grey(night ? 46 + k * 12 : 150 + k * 16); c.fillRect(-7, 0, 14, k % 2 ? 22 : 15); c.restore(); }
    }
  },
  /* --- generic structure pieces --- */
  ladder(c, w, l) {
    const ya = w.floorY(l.fa), yb = w.floorY(l.fb);
    if (l.stairs) {
      const n = 9, dx = (l.xa - l.xb) / n, dy = (ya - yb) / n;
      c.fillStyle = grey(l.broken ? 40 : 124);
      for (let i = 0; i < n; i++) { if (l.broken && i > 2 && i < 7) continue; c.fillRect(Math.min(l.xb + dx * i, l.xb + dx * (i + 1)), yb + dy * (i + 1), Math.abs(dx) + 1, 4); c.fillStyle = grey(l.broken ? 30 : 46); c.fillRect(Math.min(l.xb + dx * i, l.xb + dx * (i + 1)), yb + dy * (i + 1) + 4, Math.abs(dx) + 1, Math.abs(dy) - 3); c.fillStyle = grey(l.broken ? 40 : 124); }
      c.strokeStyle = grey(150); c.lineWidth = 2; c.beginPath(); c.moveTo(l.xb, yb - 26); c.lineTo(l.xa, ya - 26); if (!l.broken) c.stroke();
    } else {
      c.strokeStyle = grey(l.broken ? 40 : 140); c.lineWidth = 3; c.beginPath(); c.moveTo(l.xa - 7, ya - 4); c.lineTo(l.xa - 7, yb); c.moveTo(l.xa + 7, ya - 4); c.lineTo(l.xa + 7, yb); c.stroke();
      c.lineWidth = 2; for (let y = yb - 8; y > ya; y -= 11) { c.beginPath(); c.moveTo(l.xa - 7, y); c.lineTo(l.xa + 7, y); c.stroke(); }
      c.fillStyle = grey(12); c.fillRect(l.xa - 12, ya, 24, 11);
    }
  },
  blocker(c, w, b) {
    const y = w.floorY(b.f), run = w.run;
    if (b.type === 'door') {
      if (b.home) {
        const sh = b.hitT > 0 ? Math.sin(Game.time * 60) * 2 : 0; if (b.hitT > 0) b.hitT -= (Game.rdt || 0.016);
        if (b.open) { c.fillStyle = grey(50); c.save(); c.translate(b.x, y); c.rotate(-0.5); c.fillRect(-3, -76, 26, 76); c.restore(); return; }
        c.fillStyle = grey(74); c.fillRect(b.x - 5 + sh, y - 78, 10, 78); c.fillStyle = grey(30); c.fillRect(b.x - 7 + sh, y - 44, 3, 6);
        for (let i = 0; i < (run.barricade || 0); i++) { c.save(); c.translate(b.x - 8 + sh, y - 16 - i * 17); c.rotate((i % 2 ? 1 : -1) * 0.09); c.fillStyle = grey(100 - i * 6); c.fillRect(-12, -4, 26, 7); c.fillStyle = grey(20); c.fillRect(-9, -1.5, 2, 2); c.fillRect(9, -1.5, 2, 2); c.restore(); }
        return;
      }
      if (b.open) { c.fillStyle = grey(44); c.fillRect(b.x - 1, y - 76, 3, 76); c.fillRect(b.x - 16, y - 76, 16, 3); return; }
      c.fillStyle = grey(66); c.fillRect(b.x - 4, y - 76, 8, 76); c.fillStyle = grey(96); c.fillRect(b.x - 4, y - 76, 8, 2); c.fillStyle = grey(24); c.fillRect(b.x - 6, y - 40, 3, 5);
      if (b.locked) { c.strokeStyle = grey(190); c.lineWidth = 1.5; c.strokeRect(b.x - 4.5, y - 32, 9, 8); c.beginPath(); c.arc(b.x, y - 32, 3, Math.PI, 0); c.stroke(); }
    } else if (b.type === 'gap') { c.fillStyle = grey(52); c.fillRect(b.x - 6, y - 90, 12, 68); c.fillStyle = grey(8); c.beginPath(); c.arc(b.x, y - 10, 12, Math.PI, 0); c.fill(); c.fillStyle = grey(52); c.fillRect(b.x - 6, y - 24, 12, 4); }
    else if (b.type === 'shutter') { const hgt = 78 * (1 - b.prog * 0.9); c.fillStyle = grey(84); c.fillRect(b.x - 5, y - 80, 10, hgt); c.fillStyle = grey(50); for (let yy = y - 76; yy < y - 80 + hgt; yy += 7) c.fillRect(b.x - 5, yy, 10, 2); c.fillStyle = grey(40); c.fillRect(b.x - 12, y - 84, 24, 6); }
  },
  site(c, w) {
    const L = w.L, cam = w.cam, x0 = cam.x - W / 2 - 80, x1 = cam.x + W / 2 + 80, gy = w.floorY(L.floors.length - 1), top = L.floors[0].y - 100, interior = L.bg !== 'open', t = Game.time;
    if (interior) {
      c.fillStyle = grey(L.bg === 'tunnel' ? 40 : 56); c.fillRect(Math.max(-20, x0), top, Math.min(L.w + 20, x1) - Math.max(-20, x0), gy - top);
      for (let x = Math.floor(x0 / 160) * 160; x < x1; x += 160) {
        if (x < 0 || x > L.w) continue;
        if (L.bg === 'tunnel') { c.strokeStyle = grey(58); c.lineWidth = 6; c.beginPath(); c.arc(x + 80, gy, 150, Math.PI, 0); c.stroke(); c.fillStyle = grey(50); for (let k = 0; k < 4; k++) c.fillRect(x + k * 40, gy - 150, 38, 1); }
        else if (L.bg === 'nave') { c.strokeStyle = grey(74); c.lineWidth = 5; c.beginPath(); c.moveTo(x + 20, gy); c.lineTo(x + 20, top + 60); c.quadraticCurveTo(x + 80, top - 10, x + 140, top + 60); c.lineTo(x + 140, gy); c.stroke(); }
        else if (L.bg === 'shop') { c.fillStyle = grey(70); for (let f = 0; f < L.floors.length; f++) { const fy = L.floors[f].y; c.fillRect(x + 16, fy - 74, 120, 3); c.fillRect(x + 16, fy - 50, 120, 3); c.fillStyle = grey(84); for (let k = 0; k < 5; k++) if ((x / 160 + k + f) % 3) c.fillRect(x + 22 + k * 22, fy - 62, 9, 12); c.fillStyle = grey(70); } }
        else if (L.bg === 'flats') { c.fillStyle = grey(66); for (let k = 0; k < 10; k++) c.fillRect(x + k * 16, top, 2, gy - top); }
        else { c.fillStyle = grey(68); for (let f = 0; f < L.floors.length; f++) c.fillRect(x, L.floors[f].y - 50, 160, 1); c.fillRect(x, top, 1, gy - top); }
        if ((x / 160) % 3 === 0) for (let f = 0; f < L.floors.length; f++) { const fy = L.floors[f].y; if (x < L.floors[f].x0 || x > L.floors[f].x1 - 60) continue; c.fillStyle = grey(12); c.fillRect(x + 60, fy - 78, 34, 44); c.fillStyle = grey(54); c.fillRect(x + 58, fy - 80, 38, 3); c.save(); c.translate(x + 77, fy - 56); c.rotate(0.3); c.fillStyle = grey(62); c.fillRect(-22, -3, 44, 6); c.restore(); }
        c.fillStyle = grey(40); c.fillRect(x - 6, top, 12, gy - top);
      }
    } else {
      for (let x = Math.floor(x0 / 300) * 300; x < x1; x += 300) {
        if (x < 0 || x > L.w) continue;
        if (L.id === 'bridge') { c.strokeStyle = grey(40); c.lineWidth = 5; c.beginPath(); c.moveTo(x, gy - 4); c.lineTo(x + 150, gy - 190); c.lineTo(x + 300, gy - 4); c.stroke(); c.fillStyle = grey(34); c.fillRect(x, gy - 30, 300, 3); for (let k = 0; k < 6; k++) c.fillRect(x + k * 50, gy - 30, 3, 30); }
        else { c.fillStyle = grey(34); c.fillRect(x + 40, gy - 82, 4, 82); c.fillRect(x + 190, gy - 82, 4, 82); c.fillStyle = grey(54); c.beginPath(); c.moveTo(x + 30, gy - 82); c.lineTo(x + 204, gy - 82); c.lineTo(x + 214, gy - 66); c.lineTo(x + 20, gy - 66); c.fill(); c.fillStyle = grey(40); c.fillRect(x + 44, gy - 30, 146, 30); }
      }
    }
    Polish.siteBack(c, w, x0, x1, gy, top);
    for (let f = 0; f < L.floors.length; f++) {
      const fl = L.floors[f], a = Math.max(fl.x0, x0), b = Math.min(fl.x1, x1); if (b <= a) continue;
      c.fillStyle = grey(f === L.floors.length - 1 ? 84 : 100); c.fillRect(a, fl.y, b - a, 12); c.fillStyle = grey(156); c.fillRect(a, fl.y, b - a, 1.5);
      c.fillStyle = grey(56); for (let x = Math.ceil(a / 44) * 44; x < b; x += 44) c.fillRect(x, fl.y + 2, 1, 9);
      if (f < L.floors.length - 1) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(a, fl.y + 12, b - a, 10); }
      for (const ex of [fl.x0, fl.x1]) if (ex > 0 && ex < L.w && ex > x0 && ex < x1 && f < L.floors.length - 1) { const d = ex === fl.x0 ? -1 : 1; c.fillStyle = grey(100); c.beginPath(); c.moveTo(ex, fl.y); c.lineTo(ex + d * 16, fl.y + 5); c.lineTo(ex + d * 7, fl.y + 12); c.lineTo(ex, fl.y + 12); c.fill(); }
    }
    c.fillStyle = grey(9); c.fillRect(x0, gy + 12, x1 - x0, 300);
    for (const z of L.water) { if (z.x1 < x0 || z.x0 > x1) continue; const fy = w.floorY(z.f); c.fillStyle = grey(70, 0.55); c.fillRect(z.x0, fy - 9, z.x1 - z.x0, 12); c.strokeStyle = grey(150, 0.5); c.lineWidth = 1; for (let x = z.x0 + 10; x < z.x1 - 10; x += 34) { const ox = Math.sin(t * 1.4 + x) * 6; c.beginPath(); c.moveTo(x + ox, fy - 9); c.lineTo(x + 14 + ox, fy - 9); c.stroke(); } }
    for (const z of L.snipers) { if (z.x1 < x0 || z.x0 > x1) continue; const fy = w.floorY(z.f); c.strokeStyle = grey(130, z.danger ? 0.6 : 0.22); c.lineWidth = 2; for (let x = z.x0; x < z.x1; x += 16) { c.beginPath(); c.moveTo(x, fy + 11); c.lineTo(x + 9, fy + 1); c.stroke(); } c.fillStyle = grey(92); c.fillRect(z.x0 - 3, fy - 44, 5, 44); c.fillRect(z.x1 - 2, fy - 44, 5, 44); c.fillStyle = grey(200); c.fillRect(z.x0 - 6, fy - 50, 11, 8); c.fillRect(z.x1 - 5, fy - 50, 11, 8); }
    const cp = L.collapse; if (cp && cp.active) { c.fillStyle = grey(6); c.fillRect(cp.x, gy - 4, L.w - cp.x + 100, 20); c.fillStyle = grey(54); for (let x = cp.x; x < Math.min(x1, cp.x + 400); x += 60) { c.save(); c.translate(x + 20, gy + 8 + ((x * 7) % 9)); c.rotate(((x * 13) % 10 - 5) * 0.06); c.fillRect(-24, -5, 48, 10); c.restore(); } }
    for (const l of L.ladders) if (Math.max(l.xa, l.xb) > x0 && Math.min(l.xa, l.xb) < x1) this.ladder(c, w, l);
    for (const b of L.blockers) if (b.x > x0 && b.x < x1) this.blocker(c, w, b);
    for (const l of L.lights) { if (l.x < x0 || l.x > x1 || l.on === false) continue; const fy = w.floorY(l.f); c.strokeStyle = grey(20); c.lineWidth = 1; c.beginPath(); c.moveTo(l.x, fy - 100); c.lineTo(l.x, fy - 78); c.stroke(); c.fillStyle = grey(l.flick && Math.sin(t * 23 + l.x) > 0.86 ? 120 : 235); c.beginPath(); c.arc(l.x, fy - 74, 4, 0, TAU); c.fill(); }
    Polish.siteFront(c, w, x0, x1, gy);
  },
  /* --- the home cutaway: wallpaper, plaster, floorboards, boarded windows, lopsided balconies --- */
  home(c, w) {
    const Hc = CFG.home, fy = Hc.floorsY, x0 = Hc.x0 - 12, x1 = Hc.x1 + 12, run = w.run, t = Game.time, pat = (SKINS[Save.data.equip.skin] || SKINS.plain).pat;
    c.fillStyle = grey(w.night ? 10 : 30); c.fillRect(-120, fy[3] + 10, 1300, 320);                                       // ground and street
    c.fillStyle = grey(w.night ? 20 : 48); c.fillRect(x1, fy[3] + 8, 200, 4);
    c.fillStyle = grey(30); c.fillRect(x0 - 8, fy[3] + 10, x1 - x0 + 16, fy[4] - fy[3] + 12);                                // cellar pit
    c.fillStyle = grey(60); c.fillRect(x0, fy[0] + 10, x1 - x0, fy[3] - fy[0]);
    for (let f = 1; f <= 4; f++) {
      const ty = fy[f - 1] + 10, by = fy[f], hh = by - ty, shade = 66 + f * 5;
      c.fillStyle = grey(f === 4 ? 44 : shade); c.fillRect(x0, ty, x1 - x0, hh);
      c.fillStyle = grey(f === 4 ? 54 : shade + 10);
      if (f === 4 || pat === 2) { for (let yy = ty + 6; yy < by; yy += 12) for (let x = x0 + ((yy / 12) % 2 ? 0 : 14); x < x1; x += 28) c.fillRect(x, yy, 26, 1); }
      else if (pat === 0) { for (let x = x0 + 8 + f * 3; x < x1; x += 15) c.fillRect(x, ty, 2, hh); if (f === 2) for (let x = x0 + 22; x < x1; x += 60) { c.beginPath(); c.moveTo(x, by - 40); c.lineTo(x + 12, by - 40); c.lineTo(x + 6, by - 50); c.fill(); c.fillRect(x, by - 40, 12, 3); } }
      else if (pat === 1) { for (let yy = ty + 9; yy < by - 4; yy += 14) for (let x = x0 + ((yy | 0) % 28 ? 6 : 14); x < x1; x += 18) c.fillRect(x, yy, 2, 2); }
      else if (pat === 3) { c.strokeStyle = grey(shade + 10); c.lineWidth = 1; for (let x = x0 - 80; x < x1; x += 22) { c.beginPath(); c.moveTo(x, by); c.lineTo(x + hh, ty); c.moveTo(x + hh, by); c.lineTo(x, ty); c.stroke(); } }
      else { for (let yy = ty + 16; yy < by; yy += 20) { c.fillRect(x0, yy, x1 - x0, 2); for (let x = x0 + 6; x < x1; x += 9) c.fillRect(x, yy - 12 + (x % 4), 5, 12 - (x % 4)); } }
      c.fillStyle = grey(shade - 16); c.fillRect(x0, by - 12, x1 - x0, 2);                                                 // skirting
      for (const dx of [350, 610]) { c.fillStyle = grey(40); c.fillRect(dx - 4, ty, 8, 24); c.fillRect(dx - 9, ty + 22, 18, 3); }
    }
    // cracked plaster
    c.strokeStyle = grey(40); c.lineWidth = 1; const cr = new RNG(run.seed % 9973 + 5);
    for (let i = 0; i < 9; i++) { let cx = cr.r(x0 + 20, x1 - 20), cy = fy[cr.i(1, 3)] - cr.r(30, 80); c.beginPath(); c.moveTo(cx, cy); for (let k = 0; k < 4; k++) { cx += cr.r(-10, 10); cy += cr.r(4, 10); c.lineTo(cx, cy); } c.stroke(); }
    Polish.homeWalls(c, w);
    // slabs and floorboards
    for (let f = 0; f <= 4; f++) { c.fillStyle = grey(f === 0 ? 84 : 104); c.fillRect(x0, fy[f], x1 - x0, 10); c.fillStyle = grey(150); c.fillRect(x0, fy[f], x1 - x0, 1.5); c.fillStyle = grey(60); for (let x = x0 + 20; x < x1; x += 38) c.fillRect(x, fy[f] + 2, 1, 7); }
    c.fillStyle = grey(90); c.fillRect(x1, fy[3], Hc.streetX - x1 + 140, 6);
    // outer walls, parapet, chimney, boarded windows, lopsided balconies
    c.fillStyle = grey(34); c.fillRect(x0 - 12, fy[0] - 14, 12, fy[4] - fy[0] + 26); c.fillRect(x1, fy[0] - 14, 12, fy[3] - fy[0] - 64); c.fillRect(x1, fy[3] + 10, 12, fy[4] - fy[3] + 2);
    c.fillRect(x0 - 12, fy[4] + 10, x1 - x0 + 24, 10);
    c.fillStyle = grey(48); c.fillRect(300, fy[0] - 44, 26, 44); c.fillStyle = grey(30); c.fillRect(296, fy[0] - 48, 34, 6);
    if (Math.random() < 0.06 * Render.rk() && run.heaterOn) Parts.emit('smoke', 313, fy[0] - 50, 1, { v: 70 });
    for (const f of [1, 2]) { const wy = fy[f] - 70; c.fillStyle = grey(w.night ? 14 : 150); c.fillRect(x0 - 12, wy, 12, 40); const o = w.L.objs.find(q => q.type === 'window' && q.f === f); const nb = o && o.boarded ? 4 : 2; c.fillStyle = grey(78); for (let i = 0; i < nb; i++) { c.save(); c.translate(x0 - 6, wy + 6 + i * (36 / nb)); c.rotate((i % 2 ? 1 : -1) * 0.12); c.fillRect(-10, -3, 20, 6); c.restore(); }
      c.fillStyle = grey(96, 0.6); c.beginPath(); c.moveTo(x0 + 2, wy); c.quadraticCurveTo(x0 + 10 + Math.sin(t * 1.7 + f) * 5 + (o && o.rattle ? Math.sin(t * 30) * 4 : 0), wy + 22, x0 + 4, wy + 44); c.lineTo(x0, wy + 44); c.lineTo(x0, wy); c.fill(); }
    c.fillStyle = grey(24); c.save(); c.translate(x1 + 12, fy[1] - 2); c.rotate(0.07); c.fillRect(0, 0, 40, 5); c.strokeStyle = grey(40); c.lineWidth = 1.5; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(4 + k * 8, 0); c.lineTo(4 + k * 8, -18); c.stroke(); } c.restore();
    c.save(); c.translate(x1 + 12, fy[2] - 2); c.rotate(-0.05); c.fillStyle = grey(24); c.fillRect(0, 0, 34, 5); c.restore();
    c.fillStyle = grey(30); c.fillRect(928, fy[3] - 118, 4, 118); c.fillRect(916, fy[3] - 120, 20, 4);                      // dead street lamp
    // wall clock, dripping pipe
    const ck = { x: 468, y: fy[2] - 66 }; c.fillStyle = grey(190); c.beginPath(); c.arc(ck.x, ck.y, 8, 0, TAU); c.fill(); c.strokeStyle = grey(20); c.lineWidth = 1.2; c.stroke();
    const sa = Math.floor(t) * TAU / 60; c.beginPath(); c.moveTo(ck.x, ck.y); c.lineTo(ck.x + Math.sin(sa) * 6, ck.y - Math.cos(sa) * 6); c.moveTo(ck.x, ck.y); c.lineTo(ck.x + Math.sin(sa / 12) * 4, ck.y - Math.cos(sa / 12) * 4); c.stroke();
    c.strokeStyle = grey(44); c.lineWidth = 4; c.beginPath(); c.moveTo(250, fy[3] + 10); c.lineTo(250, fy[3] + 34); c.lineTo(330, fy[3] + 34); c.stroke();
    if (Math.random() < 0.012 * Render.rk()) Parts.emit('drop', 300, fy[3] + 38, 1, {});
    for (const l of w.L.ladders) this.ladder(c, w, l);
    for (const b of w.L.blockers) this.blocker(c, w, b);
    if (run.traps > 0) { c.strokeStyle = grey(150); c.lineWidth = 1; c.beginPath(); c.moveTo(Hc.doorX + 14, fy[3] - 14); c.lineTo(Hc.doorX + 60, fy[3] - 14); c.stroke(); c.fillStyle = grey(130); for (let k = 0; k < 3; k++) c.fillRect(Hc.doorX + 22 + k * 12, fy[3] - 14 + Math.sin(t * 2 + k) * 0.8, 5, 8); }
    for (const l of w.L.lights) { const y = fy[l.f]; c.strokeStyle = grey(14); c.lineWidth = 1; c.beginPath(); c.moveTo(l.x, y - 85); c.lineTo(l.x, y - 70); c.stroke(); c.fillStyle = grey(l.on === false ? 60 : (Math.sin(t * 19 + l.x) > 0.9 ? 150 : 240)); c.beginPath(); c.arc(l.x, y - 66, 3.5, 0, TAU); c.fill(); Polish.shade(c, l.x, y - 66); }
    // unusable rooms and the flooded cellar
    for (const id in run.broken.rooms) { const rm = HOME_ROOMS.find(r => r.id === id); if (!rm) continue; const ty = fy[rm.f - 1] + 10; c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(rm.x0, ty, rm.x1 - rm.x0, fy[rm.f] - ty); c.strokeStyle = grey(70); c.lineWidth = 3; c.beginPath(); c.moveTo(rm.x0 + 20, ty); c.lineTo(rm.x0 + 120, fy[rm.f]); c.moveTo(rm.x1 - 30, ty); c.lineTo(rm.x1 - 90, fy[rm.f] - 30); c.stroke(); }
    if (run.flood > 0) { const h = 26 * clamp(run.flood, 0, 1); c.fillStyle = grey(80, 0.6); c.fillRect(x0, fy[4] - h, x1 - x0, h); c.strokeStyle = grey(160, 0.5); c.lineWidth = 1; for (let x = x0 + 10; x < x1; x += 40) { c.beginPath(); c.moveTo(x + Math.sin(t + x) * 6, fy[4] - h); c.lineTo(x + 16 + Math.sin(t + x) * 6, fy[4] - h); c.stroke(); } }
    Polish.homeFront(c, w);
  },
  /* --- objects: one compact drawing per type, all in greys --- */
  obj(c, w, o) {
    const y = w.floorY(o.f), x = o.x, t = Game.time, run = w.run, B = (dx, dy, bw, bh, g, a) => { c.fillStyle = grey(Math.min(255, g * 1.2 + 16), a); c.fillRect(x + dx, y + dy, bw, bh); };
    switch (o.type) {
      case 'exit': B(-16, -84, 32, 84, 14); B(-18, -86, 36, 4, 70); B(-18, -86, 3, 86, 70); B(15, -86, 3, 86, 70); c.strokeStyle = grey(210); c.lineWidth = 2; c.beginPath(); c.moveTo(x + 8, y - 50); c.lineTo(x - 6, y - 50); c.lineTo(x - 1, y - 55); c.moveTo(x - 6, y - 50); c.lineTo(x - 1, y - 45); c.stroke(); break;
      case 'cont': { const e = !o.items.length, g = e ? 40 : 76;
        if (o.kind === 'cabinet') { B(-13, -46, 26, 46, g); B(-1, -44, 2, 42, 24); B(-13, -46, 26, 2, g + 26); if (e) B(-11, -42, 9, 38, 12); }
        else if (o.kind === 'crate') { B(-12, -22, 24, 22, g); c.strokeStyle = grey(30); c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 12, y - 22); c.lineTo(x + 12, y); c.moveTo(x + 12, y - 22); c.lineTo(x - 12, y); c.stroke(); if (e) B(-12, -26, 24, 3, 30); }
        else if (o.kind === 'locker') { B(-9, -54, 18, 54, g); B(-6, -48, 12, 2, 24); B(-6, -43, 12, 2, 24); B(5, -28, 2, 6, 150); if (e) B(-7, -38, 10, 36, 12); }
        else if (o.kind === 'shelf') { B(-16, -50, 32, 50, 30); for (let k = 0; k < 3; k++) { B(-16, -50 + k * 17, 32, 3, g); if (!e) { B(-12 + k * 5, -44 + k * 17, 6, 9, 104); B(2, -42 + k * 17, 8, 7, 90); } } }
        else { B(-14, -32, 28, 32, g); for (let k = 0; k < 3; k++) { B(-12, -29 + k * 10, 24, 1.5, 24); B(-2, -26 + k * 10, 4, 2, 150); } if (e) B(-12, -30, 24, 8, 12); }
        if (o.hint && !e) { UI.icon(c, 'star', x, y - 64 + Math.sin(t * 3) * 2, 8, G.bone); }
        break; }
      case 'hide': {
        if (o.kind === 'wardrobe') { B(-15, -60, 30, 60, 46); B(-15, -60, 30, 3, 70); B(-1, -56, 2, 54, 20); B(3, -32, 2, 5, 140); if (o.occ) { B(-14, -56, 5, 52, 10); B(-12, -40, 1.5, 1.5, 230); } }
        else if (o.kind === 'coats') { B(-16, -62, 32, 3, 70); B(-1, -62, 2, 62, 50); for (let k = 0; k < 3; k++) { c.fillStyle = grey(44 + k * 12); c.beginPath(); c.moveTo(x - 12 + k * 10, y - 59); c.lineTo(x - 18 + k * 10, y - 16); c.lineTo(x - 4 + k * 10, y - 14); c.fill(); } }
        else if (o.kind === 'pillar') { B(-11, -100, 22, 100, 56); B(-14, -100, 28, 6, 76); B(-14, -6, 28, 6, 76); }
        else if (o.kind === 'stairs') { c.fillStyle = grey(16); c.beginPath(); c.moveTo(x - 22, y); c.lineTo(x + 22, y); c.lineTo(x + 22, y - 44); c.fill(); B(-22, -3, 44, 3, 60); }
        else { c.fillStyle = grey(50); c.beginPath(); c.moveTo(x - 22, y); c.lineTo(x - 12, y - 22); c.lineTo(x - 2, y - 14); c.lineTo(x + 8, y - 30); c.lineTo(x + 22, y); c.fill(); c.fillStyle = grey(70); c.fillRect(x - 6, y - 12, 14, 5); }
        break; }
      case 'squeak': B(-9, 0, 18, 2, 86); B(-9, 2, 1, 6, 20); B(8, 2, 1, 6, 20); break;
      case 'brick': B(-5, -5, 10, 5, 110); break;
      case 'crate': B(-11, -20, 22, 20, 104); c.strokeStyle = grey(240, 0.5 + 0.4 * Math.sin(t * 4)); c.lineWidth = 1.5; c.setLineDash([4, 3]); c.strokeRect(x - 14, y - 23, 28, 25); c.setLineDash([]); B(-4, -14, 8, 8, 220); break;
      case 'keep': case 'keepspot': if (o.type === 'keep' || o.glow) { B(-5, -8, 10, 8, 150); if (Math.sin(t * 3 + x) > 0.4) UI.icon(c, 'star', x, y - 20, 7, G.white); } break;
      case 'goal': if (o.bell) { c.strokeStyle = grey(170); c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 100); c.lineTo(x + Math.sin(t * 1.5) * 3, y - 16); c.stroke(); c.fillStyle = grey(120); c.beginPath(); c.arc(x, y - 96, 16, Math.PI, 0); c.fill(); c.fillRect(x - 18, y - 96, 36, 4); } else { B(-8, -36, 16, 36, 60); B(-12, -40, 24, 5, 90); B(-7, -44, 14, 5, 225); }
        if (!w.goalDone) { c.strokeStyle = grey(240, 0.5 + 0.4 * Math.sin(t * 4)); c.setLineDash([4, 3]); c.lineWidth = 1.5; c.strokeRect(x - 20, y - 52, 40, 54); c.setLineDash([]); } break;
      case 'signal': B(-2, -46, 4, 46, 60); c.strokeStyle = grey(60); c.lineWidth = 2; c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x, y - 30); c.lineTo(x + 14, y); c.stroke(); B(-9, -62, 18, 18, 90); B(-6, -59, 12, 12, o.done === 'signal' ? 250 : 30); break;
      case 'tuner': B(-16, -30, 32, 30, 70); B(-12, -26, 14, 10, 20); c.fillStyle = grey(200); c.beginPath(); c.arc(x + 8, y - 20, 4, 0, TAU); c.fill(); c.strokeStyle = grey(120); c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 12, y - 30); c.lineTo(x + 22, y - 74); c.stroke(); break;
      case 'bed': B(-26, -12, 52, 6, 70); B(-26, -22, 4, 22, 50); B(22, -16, 4, 16, 50); B(-22, -17, 44, 6, 150); B(-22, -21, 12, 5, 210); B(-6, -18, 28, 7, 96); break;
      case 'medshelf': B(-14, -52, 28, 22, run.up.medcorner ? 190 : 120); c.fillStyle = grey(30); c.fillRect(x - 2, y - 48, 4, 14); c.fillRect(x - 7, y - 43, 14, 4); if (run.up.medcorner) { B(-20, -16, 40, 4, 80); B(-18, -12, 3, 12, 60); B(15, -12, 3, 12, 60); B(-10, -22, 6, 6, 200); B(2, -24, 5, 8, 160); } break;
      case 'plant': { B(-8, -20, 16, 3, 70); B(-5, -17, 2, 17, 50); B(3, -17, 2, 17, 50); B(-6, -30, 12, 10, 104); const g = clamp(run.plant, 0.1, 1.2); c.strokeStyle = grey(140); c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y - 30); c.quadraticCurveTo(x + Math.sin(t) * 2, y - 30 - g * 12, x + 1, y - 30 - g * 22); c.stroke(); if (run.plant < 1) { c.fillStyle = grey(150); for (let k = 0; k < Math.floor(g * 4) + 1; k++) { c.beginPath(); c.ellipse(x + (k % 2 ? 5 : -5), y - 34 - k * 4.5, 4.5, 2, k % 2 ? 0.5 : -0.5, 0, TAU); c.fill(); } } break; }
      case 'sewing': B(-14, -20, 28, 3, 80); B(-11, -17, 2, 17, 56); B(9, -17, 2, 17, 56); B(-8, -27, 6, 7, 190); B(2, -24, 10, 4, 140); break;
      case 'photo': B(-14, -42, 28, 3, 80); B(-8, -58, 12, 15, 200); B(-6, -56, 8, 11, 100); B(6, -50, 7, 8, 150); break;
      case 'window': if (w.o.drafts && !o.boarded && o.rattle) { c.strokeStyle = grey(240, 0.4 + 0.4 * Math.sin(t * 6)); c.lineWidth = 2; c.setLineDash([5, 4]); c.strokeRect(x - 22, y - 76, 30, 52); c.setLineDash([]); UI.icon(c, 'warn', x + 20, y - 80, 12, G.white); } break;
      case 'drawing': B(-12, -66, 24, 30, 214); c.strokeStyle = grey(70); c.lineWidth = 1; c.beginPath(); c.moveTo(x - 8, y - 42); c.lineTo(x - 8, y - 56); c.lineTo(x + 2, y - 56); c.lineTo(x + 2, y - 42); c.moveTo(x - 9, y - 40); c.lineTo(x + 9, y - 40); c.stroke(); for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x - 6 + k * 4, y - 46, 1.2, 0, TAU); c.stroke(); } break;
      case 'radio': B(-16, -22, 32, 3, 80); B(-13, -19, 2, 19, 56); B(11, -19, 2, 19, 56); B(-12, -40, 24, 18, 60); B(-9, -37, 10, 8, 24); c.fillStyle = grey(200); c.beginPath(); c.arc(x + 6, y - 31, 3, 0, TAU); c.fill(); c.strokeStyle = grey(110); c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + 10, y - 40); c.lineTo(x + 18, y - 68); c.stroke(); if (o.waveT > 0) { o.waveT -= (Game.rdt || 0.016); c.strokeStyle = grey(220, 0.5); for (let k = 1; k < 4; k++) { c.beginPath(); c.arc(x + 18, y - 68, k * 7 + (t * 20 % 7), -1.2, 0.4); c.stroke(); } } break;
      case 'cards': c.fillStyle = grey(84); c.beginPath(); c.ellipse(x, y - 22, 24, 5, 0, 0, TAU); c.fill(); B(-2, -22, 4, 22, 56); B(-10, -1, 20, 2, 56); B(-9, -27, 6, 4, 220); B(1, -26, 6, 4, 220); B(-2, -25, 5, 3, 180); break;
      case 'musicbox': B(-12, -22, 24, 3, 80); B(-1, -19, 2, 19, 56); B(-7, -31, 14, 9, 150); B(-7, -33, 14, 3, 190); c.strokeStyle = grey(200); c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 7, y - 27); c.lineTo(x + 12, y - 27 + Math.sin(t * (o.playT > 0 ? 10 : 0)) * 3); c.stroke(); if (o.playT > 0) { o.playT -= (Game.rdt || 0.016); if (Math.random() < 0.1 * Render.rk()) Floaters.add(['~', '*', '.'][Math.floor(Math.random() * 3)], x + FX.r(-10, 10), y - 40, { life: 1 }); } break;
      case 'candle': B(-14, -22, 28, 3, 80); B(-1, -19, 2, 19, 56); c.fillStyle = grey(120); c.beginPath(); c.ellipse(x, y - 23, 7, 2, 0, 0, TAU); c.fill(); B(-2, -34, 4, 11, 220); break;
      case 'drawer': B(-15, -34, 30, 34, 66); for (let k = 0; k < 3; k++) { B(-13, -31 + k * 10, 26, 1.5, 26); B(-2, -28 + k * 10, 4, 2, 150); } if (run.flags.drawer) B(-13, -32, 26, 9, 14); else { c.fillStyle = grey(210); c.beginPath(); c.arc(x + 9, y - 27, 1.6, 0, TAU); c.fill(); } break;
      case 'safe': B(-13, -28, 26, 28, 54); B(-13, -28, 26, 2, 90); c.strokeStyle = grey(190); c.lineWidth = 1.5; c.beginPath(); c.arc(x, y - 14, 6, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(x, y - 14); c.lineTo(x + 4, y - 18); c.stroke(); if (run.flags.safe) B(-11, -26, 22, 24, 10); break;
      case 'painting': { B(-13, -72, 26, 32, 90); B(-10, -69, 20, 26, 150); c.fillStyle = grey(60); c.beginPath(); c.arc(x, y - 59, 5, 0, TAU); c.fill(); c.fillRect(x - 7, y - 54, 14, 10); c.fillStyle = grey(220); c.fillRect(x - 3, y - 60, 1.5, 1.5); if (o.wink > 0) { o.wink -= (Game.rdt || 0.016); c.fillRect(x + 1, y - 59.5, 2.4, 0.9); } else c.fillRect(x + 1.5, y - 60, 1.5, 1.5); break; }
      case 'jars': B(-14, -40, 28, 3, 80); for (let k = 0; k < 3; k++) { B(-12 + k * 9, -51, 7, 11, 110 + k * 26, 0.9); B(-12 + k * 9, -53, 7, 2, 60); } break;
      case 'buttons': B(-9, -12, 18, 12, 60); B(-5, -24, 10, 12, 170, 0.8); B(-5, -26, 10, 2, 70); c.fillStyle = grey(60); for (let k = 0; k < 5; k++) c.fillRect(x - 3 + (k * 3) % 7, y - 22 + (k * 5) % 9, 1.5, 1.5); break;
      case 'fridge': B(-12, -58, 24, 58, 150); B(-12, -38, 24, 1.5, 70); B(7, -52, 2, 9, 60); B(7, -32, 2, 14, 60);
        if (o.dance > 0) { o.dance -= (Game.rdt || 0.016); const hx = x + 26 + Math.sin(t * 8) * 6, hy = y - Math.abs(Math.sin(t * 10)) * 8; c.fillStyle = grey(220); c.fillRect(hx - 6, hy - 12, 12, 3); c.fillStyle = grey(120); c.fillRect(hx - 6, hy - 9, 12, 3); c.fillStyle = grey(220); c.fillRect(hx - 6, hy - 6, 12, 3); c.strokeStyle = grey(230); c.lineWidth = 1; c.beginPath(); c.moveTo(hx - 3, hy - 3); c.lineTo(hx - 5 + Math.sin(t * 16) * 2, hy); c.moveTo(hx + 3, hy - 3); c.lineTo(hx + 5 - Math.sin(t * 16) * 2, hy); c.moveTo(hx - 6, hy - 9); c.lineTo(hx - 10, hy - 13 + Math.sin(t * 16) * 2); c.moveTo(hx + 6, hy - 9); c.lineTo(hx + 10, hy - 13 - Math.sin(t * 16) * 2); c.stroke(); } break;
      case 'stove': B(-16, -30, 32, 30, 40); B(-18, -32, 36, 4, 70); B(-10, -22, 12, 9, 200, 0.5 + 0.3 * Math.sin(t * 9)); B(8, -96, 6, 66, 44); B(-8, -40, 14, 8, 120); B(-10, -42, 18, 2, 150);
        if (run.gas) { c.strokeStyle = grey(230, 0.6); c.lineWidth = 1.2; for (let k = 0; k < 3; k++) { c.beginPath(); for (let i = 0; i < 6; i++) c.lineTo(x - 20 - k * 8 + Math.sin(t * 5 + i + k) * 3, y - 30 - i * 7); c.stroke(); } UI.icon(c, 'warn', x, y - 112 + Math.sin(t * 5) * 2, 13, G.white); } break;
      case 'pantry': { B(-16, -56, 32, 56, 34); const n = Math.min(12, Run.food(run)); for (let k = 0; k < 3; k++) { B(-16, -56 + k * 19, 32, 3, 74); for (let i = 0; i < 4; i++) if (k * 4 + i < n) B(-13 + i * 7, -48 + k * 19, 5, 9, 150 - i * 10); } if (w.stashState) for (let i = 0; i < w.stashState.pantry; i++) B(-22 + i * 6, -8, 6, 8, 180); break; }
      case 'workbench': B(-20, -24, 40, 4, 96); B(-17, -20, 3, 20, 60); B(14, -20, 3, 20, 60); B(8, -32, 8, 8, 70); B(-14, -29, 12, 2, 170); B(-10, -32, 3, 5, 130); break;
      case 'heater': B(-9, -34, 18, 34, 56); B(-11, -36, 22, 3, 86); for (let k = 0; k < 4; k++) B(-6, -28 + k * 6, 12, 2, run.heaterOn ? 220 + Math.sin(t * 8 + k) * 30 : 24); B(3, -78, 4, 44, 44); break;
      case 'mouse': { c.fillStyle = grey(120); c.beginPath(); c.ellipse(x, y - 4, 6, 4, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(x + 5, y - 6, 3, 0, TAU); c.fill(); c.beginPath(); c.arc(x + 4, y - 9, 1.6, 0, TAU); c.fill(); c.strokeStyle = grey(120); c.lineWidth = 1; c.beginPath(); c.moveTo(x - 6, y - 3); c.quadraticCurveTo(x - 12, y - 8 + Math.sin(t * 3) * 2, x - 14, y - 2); c.stroke(); c.fillStyle = grey(20); c.fillRect(x + 6, y - 7, 1, 1);
        B(8, -22, 26, 11, 200); B(20, -11, 1.5, 11, 150); c.save(); setFont(c, 6, { fixed: true }); c.fillStyle = G.ink; c.textAlign = 'center'; c.fillText(MOUSE_SIGNS[o.mood || 'calm'], x + 21, y - 14); c.restore(); if (o.moodT > 0) { o.moodT -= (Game.rdt || 0.016); if (o.moodT <= 0) o.mood = 'calm'; } break; }
      case 'barrel': { B(-12, -30, 24, 30, 66); B(-13, -24, 26, 2, 110); B(-13, -10, 26, 2, 110); const lv = clamp(Run.count(run, 'dirty') / 8, 0, 1); B(-10, -28, 20, 3, 150, lv > 0 ? 0.8 : 0); break; }
      case 'filter': B(-10, -14, 20, 14, 86); B(-8, -34, 16, 16, 110); B(-6, -50, 12, 14, 140); B(-1, -18, 2, 5, 40); if (o.drip > 0) { o.drip -= (Game.rdt || 0.016); if (Math.random() < 0.2 * Render.rk()) Parts.emit('drop', x, y - 16, 1, {}); } break;
      case 'safeDummy': break;
      case 'raincatcher': c.strokeStyle = grey(96); c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 24, y); c.lineTo(x - 24, y - 40); c.moveTo(x + 24, y); c.lineTo(x + 24, y - 30); c.stroke(); c.fillStyle = grey(120, 0.9); c.beginPath(); c.moveTo(x - 26, y - 40); c.quadraticCurveTo(x, y - 14, x + 26, y - 30); c.lineTo(x + 26, y - 27); c.quadraticCurveTo(x, y - 10, x - 26, y - 37); c.fill(); B(-3, -14, 6, 14, 70); break;
      case 'garden': B(-24, -12, 48, 12, 70); B(-24, -14, 48, 3, 100); for (let k = 0; k < 5; k++) { const gh = 4 + clamp(run.gardenT || 0, 0, 3) * 4; c.strokeStyle = grey(170); c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - 18 + k * 9, y - 14); c.lineTo(x - 18 + k * 9 + Math.sin(t + k) * 1.5, y - 14 - gh); c.stroke(); } break;
      case 'coop': B(-18, -34, 36, 34, 70); c.fillStyle = grey(96); c.beginPath(); c.moveTo(x - 22, y - 34); c.lineTo(x, y - 50); c.lineTo(x + 22, y - 34); c.fill(); B(-6, -20, 12, 12, 16); for (let k = 0; k < 2; k++) { const px = x - 30 - k * 14 + Math.sin(t * 0.6 + k * 2) * 4, bob = Math.abs(Math.sin(t * 3 + k)) * 1.5; c.fillStyle = grey(150 + k * 30); c.beginPath(); c.ellipse(px, y - 5 - bob, 5, 3.5, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(px + 4, y - 9 - bob * 2, 2.2, 0, TAU); c.fill(); } break;
      case 'firebarrel': B(-11, -28, 22, 28, 50); B(-12, -29, 24, 3, 84); B(-12, -14, 24, 2, 84); if (run.barrelLit || o.lit) { for (let k = 0; k < 4; k++) { c.fillStyle = grey(200 + k * 14, 0.8); c.beginPath(); c.moveTo(x - 8 + k * 5, y - 28); c.quadraticCurveTo(x - 6 + k * 5 + Math.sin(t * 9 + k) * 3, y - 44 - k % 2 * 6, x - 5 + k * 5, y - 28); c.fill(); } if (Math.random() < 0.15 * Render.rk()) Parts.emit('ember', x, y - 34, 1, {}); } break;
      case 'fire': { for (let k = 0; k < 7; k++) { const fx = x - 30 + k * 10, fh = 22 + Math.sin(t * 8 + k * 1.7) * 9 + (k % 2) * 8; c.fillStyle = grey(210 + (k % 3) * 15, 0.85); c.beginPath(); c.moveTo(fx - 7, y); c.quadraticCurveTo(fx + Math.sin(t * 6 + k) * 5, y - fh * 1.6, fx + 7, y); c.fill(); c.fillStyle = G.alert; c.globalAlpha = 0.5; c.beginPath(); c.moveTo(fx - 2, y); c.quadraticCurveTo(fx, y - fh * 0.5, fx + 2, y); c.fill(); c.globalAlpha = 1; } if (Math.random() < 0.3 * Render.rk()) Parts.emit('smoke', x + FX.r(-30, 30), y - 30, 1, { v: 60 }); if (Math.random() < 0.2 * Render.rk()) Parts.emit('ember', x + FX.r(-30, 30), y - 20, 1, {}); break; }
      case 'smoke': if (Math.random() < 0.4 * Render.rk()) Parts.emit('smoke', x + FX.r(-30, 30), y - 10, 1, { v: 90 }); break;
      case 'rubble': c.fillStyle = grey(60); c.beginPath(); c.moveTo(x - 50, y); c.lineTo(x - 30, y - 22); c.lineTo(x - 6, y - 12); c.lineTo(x + 16, y - 30); c.lineTo(x + 50, y); c.fill(); c.save(); c.translate(x, y - 20); c.rotate(0.5); c.fillStyle = grey(90); c.fillRect(-40, -3, 80, 6); c.restore(); break;
      case 'stairfix': c.strokeStyle = grey(190); c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 12, y); c.lineTo(x - 6, y - 22); c.lineTo(x, y); c.moveTo(x + 2, y); c.lineTo(x + 8, y - 22); c.lineTo(x + 14, y); c.stroke(); B(-12, -24, 28, 5, 210); for (let k = 0; k < 3; k++) B(-9 + k * 9, -24, 4, 5, 30); break;
      case 'stash': B(-10, -1, 20, 3, 110); B(-10, 2, 1, 5, 20); if (o.n) B(-5, -7, 10, 6, 160); else if (w.stashState) { c.strokeStyle = grey(220, 0.4 + 0.3 * Math.sin(t * 3)); c.setLineDash([3, 3]); c.strokeRect(x - 13, y - 12, 26, 14); c.setLineDash([]); } break;
      case 'handoff': c.strokeStyle = grey(230, o.done ? 0.2 : 0.5 + 0.3 * Math.sin(t * 4)); c.lineWidth = 2; c.beginPath(); c.moveTo(x - 8, y - 3); c.lineTo(x + 8, y + 5); c.moveTo(x + 8, y - 3); c.lineTo(x - 8, y + 5); c.stroke(); break;
      case 'lantern': B(-5, -14, 10, 12, 90); B(-3, -17, 6, 3, 130); B(-6, -2, 12, 2, 130); break;
      case 'potrack': B(-16, -74, 32, 3, 80); for (let k = 0; k < 3; k++) { c.strokeStyle = grey(80); c.lineWidth = 1; c.beginPath(); c.moveTo(x - 10 + k * 10, y - 71); c.lineTo(x - 10 + k * 10, y - 62); c.stroke(); c.fillStyle = grey(110 + k * 20); c.beginPath(); c.arc(x - 10 + k * 10, y - 57, 5, 0, Math.PI); c.fill(); } break;
      default: if (OBJ_DRAW[o.type]) OBJ_DRAW[o.type](c, w, o, x, y, t, run, B); break;
    }
  },
  /* --- darkness layer with punched-out lights and flashlight cones --- */
  lights(w, shx, shy) {
    const l = this.lctx, c = w.cam, L = w.L, run = w.run, t = Game.time;
    l.setTransform(this.ls, 0, 0, this.ls, 0, 0); l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, W, H);
    let dark = L.dark; if (run.mods.fog && w.night) dark = Math.min(0.94, dark + 0.05); if (w.slowT > 0) dark = Math.min(0.95, dark + 0.08);
    l.fillStyle = 'rgba(0,0,0,' + dark + ')'; l.fillRect(0, 0, W, H);
    l.globalCompositeOperation = 'destination-out';
    const X = x => (x - c.x + shx) * c.zoom + W / 2, Y = y => (y - c.y + shy) * c.zoom + H / 2, z = c.zoom;
    const glow = (x, y, r, a) => { if (x < -r || x > W + r) return; const g = l.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); l.fillStyle = g; l.fillRect(x - r, y - r, r * 2, r * 2); };
    const bulbs = !(run.mods.blackout || w.o.blackout);
    for (const li of L.lights) { if (li.on === false || (li.bulb && !bulbs && w.night)) continue; const fl = li.flick ? (Math.sin(t * 19 + li.x) > 0.9 ? 0.45 : 0.85) : 0.85; glow(X(li.x), Y(w.floorY(li.f) - 60), li.r * z * (L.home && !w.night ? 1.4 : 1), fl * (L.home ? 0.6 : 0.8)); }
    if (L.home) {
      const fy = CFG.home.floorsY;
      if (!w.night) { for (const f of [1, 2]) { l.fillStyle = 'rgba(0,0,0,0.35)'; l.beginPath(); l.moveTo(X(78), Y(fy[f] - 70)); l.lineTo(X(250), Y(fy[f])); l.lineTo(X(150), Y(fy[f])); l.lineTo(X(78), Y(fy[f] - 30)); l.fill(); } glow(X(480), Y(40), 620 * z, 0.5); }
      for (const o of L.objs) {
        const oy = w.floorY(o.f);
        if (o.type === 'candle' && (run.candleLit || (w.candle && w.candle.lit))) glow(X(o.x), Y(oy - 36), (80 + Math.sin(t * 11) * 6) * z * (w.candle ? 0.5 + w.candle.str / 200 : 1), 0.85);
        if (o.type === 'heater' && run.heaterOn) glow(X(o.x), Y(oy - 20), 60 * z, 0.5);
        if (o.type === 'firebarrel' && (run.barrelLit || o.lit)) glow(X(o.x), Y(oy - 34), 110 * z, 0.8);
        if (o.type === 'fire') glow(X(o.x), Y(oy - 30), (130 + Math.sin(t * 13) * 12) * z, 0.9);
        if (o.type === 'stove') glow(X(o.x), Y(oy - 18), 40 * z, 0.4);
        if (o.type === 'lantern') glow(X(o.x), Y(oy - 10), 70 * z, 0.7);
      }
    }
    for (const s of w.surv) {
      const sy = w.entY(s) - 28, sx = s.x;
      glow(X(sx), Y(sy), (s.hidden ? 30 : 52) * z, 0.5);
      if (s.lantern) glow(X(sx), Y(sy), (s.lantern.dim ? 80 : 150) * z, 0.85);
      if (s.light && !s.hidden) {
        const f = w.entF(s), dir = s.face; let len = CFG.light.cone;
        for (const b of L.blockers) if (b.f === f && !b.open && (b.x - sx) * dir > 0 && Math.abs(b.x - sx) < len) len = Math.abs(b.x - sx);      // occlusion by doors and walls
        const x0 = X(sx + dir * 6), y0 = Y(sy - 4), x1 = X(sx + dir * len), sp = Math.tan(CFG.light.half) * len * z, fyy = w.floorY(f);
        l.save(); l.beginPath(); l.rect(0, Y(fyy - 98), W, 104 * z); l.clip();
        const g = l.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, 'rgba(0,0,0,0.95)'); g.addColorStop(0.75, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        l.fillStyle = g; l.beginPath(); l.moveTo(x0, y0 - 3); l.lineTo(x1, y0 - sp); l.lineTo(x1, y0 + sp); l.lineTo(x0, y0 + 3); l.fill(); l.restore();
      }
    }
    for (const n of w.npcs) if (n.type === 'civ' || n.type === 'cat') glow(X(n.x), Y(w.entY(n) - 20), 34 * z, 0.35);
    l.globalCompositeOperation = 'source-over';
  },
  /* --- rare color echoes: a candle flame, a blooming plant, a child's balloon, an orange crayon sun --- */
  echoes(c, w) {
    const L = w.L, run = w.run, t = Game.time;
    const flame = (x, y, k) => { const g = c.createRadialGradient(x, y - 4, 0, x, y - 4, 26 * k); g.addColorStop(0, 'hsla(46,95%,62%,0.3)'); g.addColorStop(1, 'hsla(46,95%,62%,0)'); c.fillStyle = g; c.fillRect(x - 30, y - 34, 60, 60); c.fillStyle = 'hsl(46,96%,' + (60 + Math.sin(t * 17) * 6) + '%)'; c.beginPath(); c.moveTo(x - 2.4 * k, y); c.quadraticCurveTo(x - 3 * k + Math.sin(t * 13) * 1.2, y - 6 * k, x + Math.sin(t * 9) * 1.2, y - 10 * k); c.quadraticCurveTo(x + 3 * k, y - 5 * k, x + 2.4 * k, y); c.fill(); };
    if (L.home) {
      for (const o of L.objs) {
        const y = w.floorY(o.f);
        if (o.type === 'candle' && (run.candleLit || (w.candle && w.candle.lit))) flame(o.x, y - 35, w.candle ? 0.5 + w.candle.str / 130 : 1);
        if (o.type === 'plant' && run.plant >= 1) { c.fillStyle = 'hsl(124,44%,38%)'; for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(o.x + (k % 2 ? 5 : -5), y - 34 - k * 4.5, 4.8, 2.2, k % 2 ? 0.5 : -0.5, 0, TAU); c.fill(); } c.fillStyle = 'hsl(332,72%,66%)'; for (let k = 0; k < 5; k++) { const a = k * TAU / 5 + Math.sin(t) * 0.1; c.beginPath(); c.arc(o.x + 1 + Math.cos(a) * 3, y - 56 + Math.sin(a) * 3, 2.2, 0, TAU); c.fill(); } c.fillStyle = 'hsl(48,90%,60%)'; c.beginPath(); c.arc(o.x + 1, y - 56, 1.6, 0, TAU); c.fill(); }
        if (o.type === 'drawing' && run.surv.some(s => s.id === 'toby' && !s.gone)) { c.fillStyle = 'hsl(28,92%,56%)'; c.beginPath(); c.arc(o.x + 6, y - 60, 2.6, 0, TAU); c.fill(); }
      }
      if (run.flags.balloon) { const bx = 706 + Math.sin(t * 0.9) * 4, by = w.floorY(1) - 62 + Math.sin(t * 1.3) * 3; c.strokeStyle = grey(200, 0.7); c.lineWidth = 0.8; c.beginPath(); c.moveTo(704, w.floorY(1) - 26); c.quadraticCurveTo(700, by + 20, bx, by + 9); c.stroke(); c.fillStyle = 'hsl(2,78%,52%)'; c.beginPath(); c.ellipse(bx, by, 7.5, 9, 0, 0, TAU); c.fill(); c.fillStyle = 'hsla(2,90%,80%,0.6)'; c.beginPath(); c.ellipse(bx - 2.5, by - 3, 1.8, 2.8, -0.4, 0, TAU); c.fill(); }
    }
    for (const o of L.objs) { if (o.type === 'signal' && o.done === 'signal') flame(o.x, w.floorY(o.f) - 50, 1.6); if (o.type === 'lantern' && o.lit) flame(o.x, w.floorY(o.f) - 5, 0.7); }
    for (const s of w.surv) if (s.lantern) flame(s.x + s.face * 11, w.entY(s) - 20 - (s.jz || 0), s.lantern.dim ? 0.6 : 1);
  },
  /* --- the full world pass --- */
  world(ctx, w) {
    const L = w.L, cam = w.cam, S = this.S, wx = this.wctx, t = Game.time;
    const al = Game.alpha, IX = e => (e.px == null ? e.x : e.px + (e.x - e.px) * al), IY = e => (e.pyy == null ? w.entY(e) : e.pyy + (w.entY(e) - e.pyy) * al);
    const cdx = cam.px == null ? 0 : (cam.x - cam.px) * (1 - al), cdy = cam.py == null ? 0 : (cam.y - cam.py) * (1 - al);
    const sh = cam.shake > 0.1 ? cam.shake : 0, shx = (sh ? (Math.random() - 0.5) * sh * 2 : 0) + cdx, shy = (sh ? (Math.random() - 0.5) * sh * 2 - cam.punch : -cam.punch) + cdy;
    wx.setTransform(S, 0, 0, S, 0, 0);
    this.backdrop(wx, L.home ? 300 : cam.x, w.night || !L.home, {});
    const camT = c => { c.translate(W / 2, H / 2); c.scale(cam.zoom, cam.zoom); c.translate(-cam.x + shx, -cam.y + shy); };
    wx.save(); camT(wx);
    if (L.home) this.home(wx, w); else this.site(wx, w);
    const vx0 = cam.x - W / 2 / cam.zoom - 60, vx1 = cam.x + W / 2 / cam.zoom + 60;
    for (const o of L.objs) if (o.x > vx0 && o.x < vx1) { this.obj(wx, w, o); Polish.obj(wx, w, o); }
    for (const n of w.npcs) if (n.x > vx0 && n.x < vx1) { Rig.drawNPC(wx, n, IX(n), IY(n), 1); if (n.carry) { wx.fillStyle = grey(120); wx.beginPath(); wx.arc(IX(n) - n.face * 8, IY(n) - 26, 6, 0, TAU); wx.fill(); } }
    for (const p of w.proj) if (p.a) { wx.fillStyle = grey(200); wx.fillRect(p.x - 2, p.y - 3, 4, 6); }
    wx.restore();
    ctx.save();
    const useFilter = this.filterOK && Save.s.quality === 'high' && !Save.s.lowfx && !this.cheap;
    if (useFilter) ctx.filter = 'grayscale(1)';                    // force the world layer to grey at draw time
    ctx.drawImage(this.wc, 0, 0, W, H);
    if (useFilter) ctx.filter = 'none';
    ctx.restore();
    this.lights(w, shx, shy);
    ctx.drawImage(this.lc, 0, 0, W, H);
    Polish.glows(ctx, w, x => (x - cam.x + shx) * cam.zoom + W / 2, y => (y - cam.y + shy) * cam.zoom + H / 2);
    // color layer
    ctx.save(); camT(ctx);
    // attention cones: soft, readable, brighter with suspicion (shape + glyph, never color alone)
    for (const n of w.npcs) {
      if (!n.T.hostile || n.tame || n.gone || n.st === 'stun' || n.late || n.x < vx0 - 250 || n.x > vx1 + 250) continue;
      const y = w.entY(n) - 34, hot = n.st === 'chase' || n.st === 'hostile', a = hot ? 0.3 : 0.06 + n.aw * 0.2;
      if (n.type === 'dog') { ctx.fillStyle = grey(255, a); ctx.beginPath(); ctx.ellipse(n.x, y + 22, n.T.vis * 0.6, 26, 0, 0, TAU); ctx.fill(); }
      else {
        let len = n.T.vis * w.diff.vision * 0.85; for (const b of L.blockers) if (b.f === n.f && !b.open && (b.x - n.x) * n.face > 0 && Math.abs(b.x - n.x) < len) len = Math.abs(b.x - n.x);
        const x1 = n.x + n.face * len, g = ctx.createLinearGradient(n.x, 0, x1, 0); g.addColorStop(0, grey(255, a)); g.addColorStop(1, grey(255, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(n.x + n.face * 5, y); ctx.lineTo(x1, y - 30); ctx.lineTo(x1, y + 32); ctx.fill();
        if (Save.s.colorblind || Save.s.contrast) { ctx.strokeStyle = grey(255, 0.4); ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]); }
      }
      const gl = hot ? '!' : n.st === 'search' ? '...' : n.aw > 0.4 || n.st === 'investigate' ? '?' : '';
      if (gl) { ctx.fillStyle = hot ? G.white : G.paper; ctx.beginPath(); ctx.arc(n.x, y - 30, 8, 0, TAU); ctx.fill(); txt(ctx, gl, n.x, y - 26, 11, G.ink, 'center', { outline: false, fixed: true }); }
      if (w.night) { ctx.globalAlpha = 0.25; Rig.drawNPC(ctx, n, n.x, w.entY(n), 0.25); ctx.globalAlpha = 1; }
    }
    this.echoes(ctx, w);
    const list = w.surv.slice().sort((a, b) => (a.active ? 1 : 0) - (b.active ? 1 : 0));
    for (const s of list) {
      const y = IY(s), ix = IX(s); s.sx = w.sx(s.x); s.sy = w.sy(w.entY(s));
      if (s.x < vx0 || s.x > vx1) continue;
      Rig.draw(ctx, s, ix, y, { pack: !!L.site });
      if (s.bundle) { ctx.fillStyle = grey(190); ctx.fillRect(s.x + s.face * 7 - 4, y - 26, 8, 8); }
      if (s.lantern) { ctx.fillStyle = grey(60); ctx.fillRect(s.x + s.face * 11 - 4, y - 22 - (s.jz || 0), 8, 9); }
      if (s.sleeping && Math.random() < 0.02 * Render.rk()) Parts.emit('zzz', s.x + 8, y - 16, 1, {});
    }
    // sniper reticles: the one allowed alert tint, tiny, plus a shape that changes when the window is safe
    for (const z of L.snipers) {
      const y = w.floorY(z.f) - 34; ctx.lineWidth = 1.4;
      if (z.danger) { ctx.strokeStyle = G.alert; const r = z.lock ? 5 + Math.sin(t * TAU * 2.5) * 1.5 : 5; ctx.beginPath(); ctx.arc(z.rx, y, r, 0, TAU); ctx.moveTo(z.rx - r - 4, y); ctx.lineTo(z.rx + r + 4, y); ctx.moveTo(z.rx, y - r - 4); ctx.lineTo(z.rx, y + r + 4); ctx.stroke(); }
      else { ctx.strokeStyle = grey(210, 0.8); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc((z.x0 + z.x1) / 2, y - 40, 8, 0, TAU); ctx.stroke(); ctx.setLineDash([]); txt(ctx, 'clear ' + Math.ceil(z.left), (z.x0 + z.x1) / 2, y - 54, 10, G.bone, 'center'); }
    }
    // hazard telegraphs: pulsing dashed outline with a warning shape
    if (w.tele) for (const tl of w.tele) { const pulse = 0.5 + 0.5 * Math.sin(t * TAU * 2); ctx.strokeStyle = grey(255, 0.4 + pulse * 0.5); ctx.lineWidth = 2 + pulse; ctx.setLineDash([8, 6]); ctx.strokeRect(tl.x, tl.y, tl.w, tl.h); ctx.setLineDash([]); UI.icon(ctx, 'warn', tl.x + tl.w / 2, tl.y + 16, 16 + pulse * 2, G.white); }
    if (L.gust && L.gust.phase !== 'calm') { ctx.strokeStyle = grey(255, L.gust.phase === 'warn' ? 0.25 : 0.6); ctx.lineWidth = 1; for (let k = 0; k < 9; k++) { const gy = 30 + k * 52, gx = (t * (L.gust.phase === 'warn' ? 200 : 900) + k * 170) % 1300 - 100; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + 70, gy); ctx.stroke(); } }
    Parts.draw(ctx, false); Floaters.draw(ctx, false);
    ctx.restore();
    // speech bubbles in screen space so they stay readable
    for (const s of w.surv) if (s.bubble && s.sx > -40 && s.sx < W + 40) UI.bubble(ctx, s.bubble.text, s.sx, s.sy - 56 * cam.zoom * s.d.b.h - 6, clamp(s.bubble.t * 2, 0, 1));
    for (const n of w.npcs) if (n.bubble) { const bx = w.sx(n.x); if (bx > -40 && bx < W + 40) UI.bubble(ctx, n.bubble.text, bx, w.sy(w.entY(n)) - 60 * cam.zoom * n.T.h - 6, clamp(n.bubble.t * 2, 0, 1)); }
  },
  /* Screen-space atmosphere: weather, fog, film grain, vignette, flash. */
  post(ctx, o) {
    o = o || {}; const t = Game.time, s = Save.s;
    Parts.draw(ctx, true);
    Polish.post(ctx, o);
    if (!s.lowfx) {
      const fa = o.fog ? 0.16 : 0.06;
      for (let i = 0; i < 3; i++) { const fx = ((t * (9 + i * 4) + i * 420) % (W + 600)) - 300, fy = 150 + i * 120; const g = ctx.createRadialGradient(fx, fy, 10, fx, fy, 300); g.addColorStop(0, grey(190, fa)); g.addColorStop(1, grey(190, 0)); ctx.fillStyle = g; ctx.fillRect(fx - 300, fy - 150, 600, 300); }
      if (s.quality !== 'low' && !this.cheap) { const ox = Math.floor(Math.random() * 512), oy = Math.floor(Math.random() * 512); for (let x = -ox; x < W; x += 512) for (let y = -oy; y < H; y += 512) ctx.drawImage(this.grain, x, y); }
    }
    ctx.drawImage(this.vig, 0, 0, W, H);
    if (o.close > 0) { ctx.globalAlpha = clamp(o.close, 0, 1) * 0.7; ctx.drawImage(this.vig, -W * 0.25, -H * 0.25, W * 1.5, H * 1.5); ctx.drawImage(this.vig, 0, 0, W, H); ctx.globalAlpha = 1; }
    if (o.flash > 0 && !s.reduce) { ctx.fillStyle = grey(255, clamp(o.flash * 2.2, 0, 0.3)); ctx.fillRect(0, 0, W, H); }
  },
  /* Memory replay: greyscale, slow motion, re-rendered from recorded positions. */
  replay(ctx, rp, t, x, y, w, h) {
    if (!rp || !rp.frames.length) return;
    const i = Math.floor(t * CFG.replayHz * 0.45) % rp.frames.length, fr = rp.frames[i], sc = Math.min(w / 520, h / 300);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.fillStyle = grey(36); ctx.fillRect(x, y, w, h);
    ctx.translate(x + w / 2, y + h * 0.62); ctx.scale(sc, sc);
    let fx = 0, fyy = 0, n = 0; for (const s of fr.s) { fx += s.x; fyy += s.y; n++; } if (n) { fx /= n; fyy /= n; } ctx.translate(-fx, -fyy);
    for (const f of rp.floors) { ctx.fillStyle = grey(70); ctx.fillRect(f.x0, f.y, f.x1 - f.x0, 8); ctx.fillStyle = grey(26); ctx.fillRect(f.x0, f.y + 8, f.x1 - f.x0, 4); }
    for (const q of fr.n) { const fake = { type: q.type, T: NPCT[q.type], face: q.face, vx: 20, ph: q.ph, st: q.st, aw: 0 }; Rig.drawNPC(ctx, fake, q.x, q.y, 1); }
    for (const q of fr.s) {
      rp.tmp = rp.tmp || {}; const s = rp.tmp[q.id] || (rp.tmp[q.id] = new Survivor(q.id)); s.face = q.face; s.ph = q.ph; s.anim = q.anim; s.morale = 50;
      const T = Rig.target(s, t); for (const k in T) s.pose[k] = T[k]; if (q.hid) s.pose.alpha = 0.3;
      Rig.draw(ctx, s, q.x, q.y, { mono: true });
    }
    ctx.restore();
    ctx.strokeStyle = G.paper; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
    ctx.save(); ctx.translate(x + w - 54, y + 18); ctx.rotate(0.06); ctx.fillStyle = G.bone; ctx.fillRect(-46, -11, 92, 20); txt(ctx, 'REMEMBER', 0, 4, 12, G.ink, 'center', { outline: false, fixed: true }); ctx.restore();
    txt(ctx, rp.label || '', x + 8, y + h - 8, 10, G.paper, 'left');
  },
  /* The building from outside, for the title, credits and endings. lit: 0..1, color: light every window in a survivor's color. */
  building(ctx, t, o) {
    o = o || {}; const bx = o.x || 250, by = 96, bw = 300, bh = 470, night = !o.dawn;
    this.backdrop(ctx, 200 + t * 4, night, {});
    if (o.dawn) { const g = ctx.createLinearGradient(0, 200, 0, H); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.25)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = grey(night ? 40 : 70); ctx.fillRect(bx, by, bw, bh); ctx.fillStyle = grey(night ? 26 : 50); ctx.fillRect(bx - 6, by - 8, bw + 12, 10); ctx.fillStyle = grey(night ? 34 : 62); for (let yy = by + 8; yy < by + bh; yy += 72) ctx.fillRect(bx, yy + 62, bw, 2);
    ctx.fillStyle = night ? grey(10) : grey(96); ctx.beginPath(); ctx.moveTo(bx + bw + 1, by - 9); ctx.lineTo(bx + bw - 70, by - 9); ctx.lineTo(bx + bw - 40, by + 34); ctx.lineTo(bx + bw + 1, by + 60); ctx.fill();
    Polish.buildingRoof(ctx, t, bx, by, bw, bh, night);
    const ids = SURV_ORDER.slice(0, 8), group = o.group || Save.data.group;
    for (let r = 0; r < 6; r++) for (let cI = 0; cI < 4; cI++) {
      const wx = bx + 22 + cI * 70, wy = by + 26 + r * 72, k = r * 4 + cI, litW = o.color ? true : ((k * 7 + 3) % 5 === 0 || k === 9 || k === 14);
      const tilt = ((k * 13) % 7 - 3) * 0.012;
      ctx.save(); ctx.translate(wx + 22, wy + 46); ctx.rotate(tilt); ctx.fillStyle = grey(night ? 70 : 100); ctx.fillRect(-28, 0, 56, 5); ctx.strokeStyle = grey(night ? 84 : 120); ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-25 + i * 10, 0); ctx.lineTo(-25 + i * 10, -12); ctx.stroke(); } ctx.restore();
      if (litW) {
        const sid = o.color ? ids[k % ids.length] : group[(k >> 1) % Math.max(1, group.length)], sv = SURVIVORS[sid] || SURVIVORS.marta;
        ctx.fillStyle = o.color ? hsl(sv.hue, 1, 14, 0.9) : grey(176 + Math.sin(t * 3 + k) * 8); ctx.fillRect(wx, wy, 44, 40);
        ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, 44, 40); ctx.clip();
        Render.tmpS = Render.tmpS || {}; const s = Render.tmpS[sid + k] || (Render.tmpS[sid + k] = new Survivor(sid)); s.morale = o.color ? 100 : 62; const px = wx + 22 + Math.sin(t * 0.4 + k) * 16; s.face = Math.cos(t * 0.4 + k) > 0 ? 1 : -1; s.vx = 20; s.ph = t * 4 + k; s.anim = 'walk';
        const T = Rig.target(s, t); for (const kk in T) s.pose[kk] = T[kk]; Rig.draw(ctx, s, px, wy + 44, { scale: 0.8 }); ctx.restore();
        ctx.fillStyle = grey(20); ctx.fillRect(wx + 21, wy, 2, 40);
        Polish.litWindow(ctx, t, wx, wy, k, night);
      } else { ctx.fillStyle = grey(night ? 8 : 34); ctx.fillRect(wx, wy, 44, 40); if (k % 3 === 0) { ctx.fillStyle = grey(night ? 40 : 80); ctx.save(); ctx.translate(wx + 22, wy + 20); ctx.rotate(0.3); ctx.fillRect(-26, -3, 52, 6); ctx.restore(); } }
    }
    ctx.fillStyle = grey(night ? 8 : 30); ctx.fillRect(0, H - 22, W, 22);
  },
  /* Scene transitions: paper tear, window blinds, iris onto a focus point, lamp flicker. */
  transition(ctx, type, p, fx, fy) {
    if (p <= 0) return;
    ctx.fillStyle = G.ink;
    if (type === 'tear') { const x = (W + 80) * p; ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(x, -10); for (let y = 0; y <= H + 20; y += 18) ctx.lineTo(x + ((y * 7) % 23) - 14, y); ctx.lineTo(-10, H + 10); ctx.fill(); ctx.fillStyle = G.paper; ctx.beginPath(); for (let y = 0; y <= H + 20; y += 18) ctx.lineTo(x + ((y * 7) % 23) - 14, y); for (let y = H + 20; y >= 0; y -= 18) ctx.lineTo(x + ((y * 7) % 23) - 8, y); ctx.fill(); }
    else if (type === 'blinds') { const n = 10, bh = H / n; for (let i = 0; i < n; i++) ctx.fillRect(0, i * bh, W, bh * p + 0.5); }
    else if (type === 'iris') { const R = Math.hypot(W, H) * (1 - p); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(fx == null ? W / 2 : fx, fy == null ? H / 2 : fy, Math.max(0, R), 0, TAU, true); ctx.fill('evenodd'); }
    else { ctx.globalAlpha = clamp(p + (p > 0.2 && p < 0.8 && !Save.s.reduce ? Math.sin(p * 9) * 0.18 : 0), 0, 1); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }
};
