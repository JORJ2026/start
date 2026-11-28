/* ==========================================================================
   SECTION 25: RELEASE 1.0 POLISH
   The extra layer of detail added for 1.0: skyline life, set dressing for the
   shelter and every scavenging site, object details, light bloom, weather
   effects and footprints. Everything here is drawn in code, keeps to the
   charcoal palette in the world layer, and steps aside on low quality or
   when "Reduce motion" is on. Numbers in the comments match CHANGELOG.md.
   ========================================================================== */
const PH = (n, s) => { let h = Math.imul((n | 0) ^ 0x9e3779b9, 2654435761) ^ Math.imul(s | 0, 1597334677); h = Math.imul(h ^ (h >>> 15), 2246822519); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
const rich = () => !(Save.s.lowfx || Save.s.quality === 'low' || Render.cheap);
const calm = () => !!Save.s.reduce;

const Polish = {
  stars: null, prints: [], bolt: 0, boltT: 6, flashSky: 0, searchA: 0,
  init() {
    if (this.stars) return;
    this.stars = [];
    for (let i = 0; i < 90; i++) this.stars.push({ x: PH(i, 1) * 2400, y: PH(i, 2) * 260, r: 0.4 + PH(i, 3) * 1.1, ph: PH(i, 4) * TAU, sp: 0.6 + PH(i, 5) * 2.2 });
  },

  /* ---------- SKY (behind the skyline) ---------- */
  sky(c, camX, night, t) {
    this.init();
    if (night) {
      // #1 twinkling stars with parallax
      for (const s of this.stars) {
        const x = ((s.x - camX * 0.04) % 2400 + 2400) % 2400 - 200; if (x < -4 || x > W + 4) continue;
        const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph)); c.fillStyle = grey(220, calm() ? 0.4 : a); c.fillRect(x, s.y, s.r * 1.6, s.r * 1.6);
      }
      // #2 soft halo around the moon
      const mx = 500 - camX * 0.02, g = c.createRadialGradient(mx, 96, 14, mx, 96, 90); g.addColorStop(0, grey(200, 0.16)); g.addColorStop(1, grey(200, 0)); c.fillStyle = g; c.fillRect(mx - 90, 6, 180, 180);
      // #3 a searchlight that sweeps the clouds far away
      if (rich()) {
        const sx = ((1500 - camX * 0.1) % 2400 + 2400) % 2400 - 300, ang = -Math.PI / 2 + Math.sin(t * 0.21) * 0.55;
        c.save(); c.translate(sx, 380); c.rotate(ang + Math.PI / 2);
        const bg = c.createLinearGradient(0, 0, 0, -420); bg.addColorStop(0, grey(200, 0.12)); bg.addColorStop(1, grey(200, 0));
        c.fillStyle = bg; c.beginPath(); c.moveTo(-3, 0); c.lineTo(-42, -420); c.lineTo(42, -420); c.lineTo(3, 0); c.fill(); c.restore();
      }
      // #4 distant shelling glow on the horizon, now and then
      if (!calm()) {
        const k = (t % 23) / 23; if (k > 0.82 && k < 0.86) { const a = Math.sin((k - 0.82) / 0.04 * Math.PI) * 0.22, hx = ((900 - camX * 0.06) % 1400 + 1400) % 1400 - 200, hg = c.createRadialGradient(hx, 330, 0, hx, 330, 220); hg.addColorStop(0, grey(220, a)); hg.addColorStop(1, grey(220, 0)); c.fillStyle = hg; c.fillRect(hx - 220, 110, 440, 440); }
      }
    } else {
      // #5 slow cloud banks drifting over the day sky
      for (let i = 0; i < 6; i++) {
        const cx = ((PH(i, 7) * 1800 + t * (4 + i) - camX * 0.05) % 1800 + 1800) % 1800 - 300, cy = 40 + PH(i, 8) * 140, cw = 120 + PH(i, 9) * 160;
        c.fillStyle = grey(170, 0.18); for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(cx + k * cw / 5, cy + Math.sin(k * 1.7) * 6, cw / 4, 14 + (k % 2) * 6, 0, 0, TAU); c.fill(); }
      }
    }
  },
  /* #6 rooftop silhouettes (water towers, antennas, chimneys) and #7 a few lived-in windows on the skyline */
  roof(c, b, x, top, night, col, idx, t) {
    const kind = Math.floor(PH(idx, 11) * 5);
    c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 1.2;
    if (kind === 0) { const tx = x + b.w * 0.6; c.fillRect(tx, top - 22, 18, 14); c.fillRect(tx + 2, top - 8, 2, 8); c.fillRect(tx + 14, top - 8, 2, 8); c.beginPath(); c.moveTo(tx - 2, top - 22); c.lineTo(tx + 9, top - 30); c.lineTo(tx + 20, top - 22); c.fill(); }
    else if (kind === 1) { const ax = x + b.w * 0.3; c.beginPath(); c.moveTo(ax, top); c.lineTo(ax, top - 30); c.moveTo(ax - 8, top - 24); c.lineTo(ax + 8, top - 24); c.moveTo(ax - 5, top - 17); c.lineTo(ax + 5, top - 17); c.stroke(); }
    else if (kind === 2) { c.fillRect(x + b.w * 0.2, top - 12, 8, 12); c.fillRect(x + b.w * 0.75, top - 9, 6, 9); }
    if (night && b.win > 2 && PH(idx, 12) < 0.45) {
      const wx = x + 10 + ((idx * 37) % Math.max(12, b.w - 22)), wy = top + 14 + ((idx * 23) % Math.max(10, b.h - 30)), on = calm() || Math.sin(t * 0.7 + idx * 3.1) > -0.6;
      if (on) { c.fillStyle = grey(110 + PH(idx, 13) * 60, 0.9); c.fillRect(wx, wy, 6, 9); }
    }
  },
  skyFront(c, camX, night, t) {
    // #8 birds crossing the day sky in loose V's
    if (!night && !calm()) {
      for (let f = 0; f < 2; f++) {
        const k = ((t * 0.03 + f * 0.5) % 1), bx = -100 + k * (W + 200), by = 70 + f * 50 + Math.sin(t * 0.5 + f) * 10;
        c.strokeStyle = grey(50, 0.7); c.lineWidth = 1.1;
        for (let i = 0; i < 5; i++) { const ox = bx - Math.abs(i - 2) * 14, oy = by + (i - 2) * 9, fl = Math.sin(t * 9 + i) * 2.5; c.beginPath(); c.moveTo(ox - 5, oy - fl); c.lineTo(ox, oy); c.lineTo(ox + 5, oy - fl); c.stroke(); }
      }
    }
    // #9 low ground haze where the city meets the sky
    const hg = c.createLinearGradient(0, 330, 0, 420); hg.addColorStop(0, grey(night ? 40 : 150, 0)); hg.addColorStop(1, grey(night ? 40 : 150, 0.28)); c.fillStyle = hg; c.fillRect(0, 330, W, 90);
  },

  /* ---------- THE SHELTER ---------- */
  homeWalls(c, w) {
    const fy = CFG.home.floorsY, run = w.run, t = Game.time, Hc = CFG.home, x0 = Hc.x0 - 12, x1 = Hc.x1 + 12;
    // #10 brick courses and arches in the cellar
    c.fillStyle = grey(38); for (let yy = fy[3] + 22; yy < fy[4] - 4; yy += 9) for (let x = x0 + ((yy / 9) % 2 ? 0 : 11); x < x1; x += 22) c.fillRect(x, yy, 1, 9);
    c.strokeStyle = grey(36); c.lineWidth = 6; for (const ax of [170, 450, 730]) { c.beginPath(); c.arc(ax, fy[4], 70, Math.PI, 0); c.stroke(); }
    // #11 cobwebs in the cellar corners
    c.strokeStyle = grey(120, 0.35); c.lineWidth = 0.7;
    for (const [cx, d] of [[x0, 1], [x1, -1]]) { const cy = fy[3] + 10; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + d * (10 + i * 8), cy + 26 - i * 6); c.stroke(); } for (let r = 8; r < 30; r += 7) { c.beginPath(); c.arc(cx, cy, r, d > 0 ? 0 : Math.PI / 2, d > 0 ? Math.PI / 2 : Math.PI); c.stroke(); } }
    // #12 framed photographs on the bedroom wall
    for (const [px, ph, pw] of [[470, 20, 16], [498, 14, 12], [720, 18, 24]]) { const y = fy[1] - 78; c.fillStyle = grey(40); c.fillRect(px - 2, y - 2, pw + 4, ph + 4); c.fillStyle = grey(150); c.fillRect(px, y, pw, ph); c.fillStyle = grey(95); c.fillRect(px + 2, y + ph * 0.45, pw - 4, ph * 0.5); c.beginPath(); c.arc(px + pw / 2, y + ph * 0.35, Math.min(pw, ph) * 0.2, 0, TAU); c.fill(); }
    // #13 the day calendar: a cross through every day survived
    { const cx = 236, cy = fy[2] - 76, d = num(run.day, 1); c.fillStyle = grey(200); c.fillRect(cx, cy, 34, 30); c.fillStyle = grey(60); c.fillRect(cx, cy, 34, 6); c.strokeStyle = grey(70); c.lineWidth = 0.8;
      for (let i = 0; i < 20; i++) { const gx = cx + 3 + (i % 5) * 6, gy = cy + 9 + Math.floor(i / 5) * 5; if (i < d - 1) { c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + 4, gy + 3.5); c.moveTo(gx + 4, gy); c.lineTo(gx, gy + 3.5); c.stroke(); } else { c.fillStyle = grey(150); c.fillRect(gx + 1, gy + 1, 2, 2); } } }
    // #14 a bookshelf on the sitting-room wall
    { const bx = 660, by = fy[2] - 60; c.fillStyle = grey(54); c.fillRect(bx, by, 64, 3); c.fillRect(bx + 4, by + 3, 2, 5); c.fillRect(bx + 58, by + 3, 2, 5);
      for (let i = 0; i < 9; i++) { const bh = 10 + PH(i, 21) * 7, bw = 4 + PH(i, 22) * 3; c.fillStyle = grey(70 + PH(i, 23) * 90); if (i === 6) { c.save(); c.translate(bx + 6 + i * 6.4, by); c.rotate(-0.3); c.fillRect(0, -bh, bw, bh); c.restore(); } else c.fillRect(bx + 4 + i * 6.4, by - bh, bw, bh); } }
    // #15 a kitchen notice board with pinned notes
    { const nx = 612, ny = fy[3] - 80; c.fillStyle = grey(84); c.fillRect(nx, ny, 40, 26); c.strokeStyle = grey(44); c.lineWidth = 1.5; c.strokeRect(nx, ny, 40, 26);
      for (let i = 0; i < 4; i++) { c.save(); c.translate(nx + 6 + i * 9, ny + 5 + (i % 2) * 6); c.rotate((PH(i, 31) - 0.5) * 0.4); c.fillStyle = grey(190 + i * 12); c.fillRect(0, 0, 8, 10); c.fillStyle = grey(30); c.fillRect(3.5, 0.5, 1.4, 1.4); c.restore(); } }
    // #16 cellar shelf of jars and a crate stack
    { const sx = 450, sy = fy[4] - 46; c.fillStyle = grey(60); c.fillRect(sx, sy, 60, 3); c.fillRect(sx + 3, sy, 2, 46); c.fillRect(sx + 55, sy, 2, 46); for (let i = 0; i < 5; i++) { c.fillStyle = grey(110 + i * 14, 0.9); c.fillRect(sx + 8 + i * 10, sy - 9, 7, 9); c.fillStyle = grey(50); c.fillRect(sx + 8 + i * 10, sy - 10, 7, 2); }
      c.fillStyle = grey(70); c.fillRect(sx + 8, fy[4] - 18, 22, 18); c.fillRect(sx + 32, fy[4] - 14, 18, 14); c.strokeStyle = grey(40); c.lineWidth = 1; c.strokeRect(sx + 8, fy[4] - 18, 22, 18); c.strokeRect(sx + 32, fy[4] - 14, 18, 14); }
    // #17 water stains under the old pipes
    c.fillStyle = grey(50, 0.35); for (const dx of [350, 610]) { c.beginPath(); c.ellipse(dx, fy[3] - 70, 14, 30, 0, 0, TAU); c.fill(); }
    // #18 a coat of light dust in the corners of every room
    for (let f = 1; f <= 3; f++) { const g = c.createLinearGradient(0, fy[f] - 30, 0, fy[f]); g.addColorStop(0, grey(0, 0)); g.addColorStop(1, grey(0, 0.18)); c.fillStyle = g; c.fillRect(x0, fy[f] - 30, x1 - x0, 30); }
    void t;
  },
  homeFront(c, w) {
    const fy = CFG.home.floorsY, run = w.run, t = Game.time, Hc = CFG.home, x0 = Hc.x0 - 12, x1 = Hc.x1 + 12, night = w.night, cold = num(run.temp, 5) <= 0;
    const snowy = run.weather === 'snow' || run.weather === 'coldsnap' || (run.mods && run.mods.snow);
    // #19 brick texture on the outside walls
    c.fillStyle = grey(night ? 24 : 44); for (let yy = fy[0] - 10; yy < fy[4] + 10; yy += 7) { const off = (yy / 7) % 2 ? 0 : 3; c.fillRect(x0 - 12 + off, yy, 1, 7); c.fillRect(x0 - 6 + off, yy, 1, 7); if (yy < fy[3] - 70 || yy > fy[3] + 10) { c.fillRect(x1 + 3 + off, yy, 1, 7); c.fillRect(x1 + 9 - off, yy, 1, 7); } c.fillRect(x0 - 12, yy, 12, 0.8); }
    // #20 a rooftop water tank and #21 a bent TV aerial with a swaying wire
    { const tx = 812; c.fillStyle = grey(44); c.fillRect(tx, fy[0] - 52, 40, 30); c.fillStyle = grey(56); c.fillRect(tx - 2, fy[0] - 56, 44, 6); c.fillStyle = grey(34); for (const lx of [tx + 3, tx + 34]) c.fillRect(lx, fy[0] - 22, 3, 22); c.strokeStyle = grey(34); c.lineWidth = 1; c.beginPath(); c.moveTo(tx + 4, fy[0] - 22); c.lineTo(tx + 36, fy[0] - 4); c.moveTo(tx + 36, fy[0] - 22); c.lineTo(tx + 4, fy[0] - 4); c.stroke(); c.fillStyle = grey(70); for (let i = 0; i < 4; i++) c.fillRect(tx + 2, fy[0] - 48 + i * 7, 36, 1); }
    { const ax = 150, sw = calm() ? 0 : Math.sin(t * 1.3) * 0.05; c.save(); c.translate(ax, fy[0]); c.rotate(-0.06 + sw); c.strokeStyle = grey(30); c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -60); c.stroke(); c.lineWidth = 1.4; for (let i = 0; i < 4; i++) { const l = 22 - i * 4; c.beginPath(); c.moveTo(-l / 2, -58 + i * 8); c.lineTo(l / 2, -58 + i * 8 + (i === 2 ? 4 : 0)); c.stroke(); } c.restore();
      c.strokeStyle = grey(30, 0.8); c.lineWidth = 0.8; c.beginPath(); c.moveTo(ax, fy[0] - 50); c.quadraticCurveTo(ax - 40, fy[0] - 20 + Math.sin(t * 1.7) * 3, x0 - 12, fy[0] + 30); c.stroke(); }
    // #22 chimney bricks and a cowl
    c.fillStyle = grey(38); for (let yy = fy[0] - 40; yy < fy[0]; yy += 6) c.fillRect(300, yy, 26, 0.8); c.fillStyle = grey(26); c.fillRect(304, fy[0] - 58, 18, 8);
    // #23 a drainpipe down the right-hand wall, with brackets
    c.fillStyle = grey(night ? 30 : 52); c.fillRect(x1 + 14, fy[0] - 6, 5, fy[3] - fy[0] - 64); c.fillRect(x1 + 10, fy[0] - 8, 12, 4); for (let yy = fy[0] + 20; yy < fy[3] - 80; yy += 60) c.fillRect(x1 + 12, yy, 9, 2);
    // #24 the painted house number by the door
    c.save(); c.translate(x1 + 2, fy[2] + 34); c.rotate(-0.04); txt(c, '6', 0, 0, 16, grey(night ? 70 : 120), 'left', { serif: true, outline: false, fixed: true }); c.restore();
    // #25 cobbled street, curb and #26 puddles that mirror the lamp
    { const sy = fy[3] + 10; c.fillStyle = grey(night ? 18 : 40); for (let x = x1 + 10; x < 1100; x += 14) for (let r = 0; r < 3; r++) { c.beginPath(); c.ellipse(x + (r % 2) * 7, sy + 6 + r * 8, 6, 3, 0, 0, TAU); c.fill(); }
      c.fillStyle = grey(night ? 40 : 76); c.fillRect(x1 + 12, sy - 2, 240, 2);
      if (run.weather === 'rain' || run.weather === 'fog' || run.weather === 'clear') { c.fillStyle = grey(night ? 26 : 70, 0.9); c.beginPath(); c.ellipse(910, sy + 14, 26, 3.5, 0, 0, TAU); c.fill(); c.fillStyle = grey(night ? 70 : 150, 0.5); c.fillRect(904, sy + 13, 12, 1); } }
    // #27 the dead street lamp gets a glass head and a bent arm
    c.fillStyle = grey(30); c.beginPath(); c.moveTo(916, fy[3] - 120); c.lineTo(936, fy[3] - 120); c.lineTo(932, fy[3] - 132); c.lineTo(920, fy[3] - 132); c.fill(); c.fillStyle = grey(night ? 50 : 120, 0.8); c.fillRect(921, fy[3] - 130, 10, 8); c.fillStyle = grey(30); c.fillRect(925, fy[3] - 140, 2, 8);
    // #28 glass panes in the side windows: moonlight or daylight streaks, #29 rain running down them
    for (const f of [1, 2]) {
      const wy = fy[f] - 70; c.strokeStyle = grey(night ? 70 : 230, night ? 0.5 : 0.7); c.lineWidth = 1; c.beginPath(); c.moveTo(x0 - 10, wy + 10); c.lineTo(x0 - 3, wy + 2); c.moveTo(x0 - 10, wy + 22); c.lineTo(x0 - 2, wy + 13); c.stroke();
      c.fillStyle = grey(night ? 40 : 90); c.fillRect(x0 - 14, wy + 40, 16, 3);
      if (run.weather === 'rain') { c.strokeStyle = grey(200, 0.5); for (let i = 0; i < 3; i++) { const ry = wy + ((t * 22 + i * 13 + f * 7) % 40); c.beginPath(); c.moveTo(x0 - 9 + i * 3, ry); c.lineTo(x0 - 9 + i * 3, ry + 4); c.stroke(); } }
      if (snowy) { c.fillStyle = grey(230); c.beginPath(); c.ellipse(x0 - 6, wy + 40, 9, 2.6, 0, Math.PI, 0); c.fill(); }
    }
    // #30 snow on the roof, the parapet and the balconies; #31 icicles when it freezes
    if (snowy) { c.fillStyle = grey(235); c.fillRect(x0 - 12, fy[0] - 16, x1 - x0 + 24, 3); for (let x = x0; x < x1; x += 30) { c.beginPath(); c.ellipse(x + 15, fy[0] - 0.5, 16, 2.4, 0, Math.PI, 0); c.fill(); } c.beginPath(); c.ellipse(313, fy[0] - 46, 16, 3, 0, Math.PI, 0); c.fill(); c.beginPath(); c.ellipse(832, fy[0] - 56, 23, 3, 0, Math.PI, 0); c.fill(); c.fillRect(x1 + 12, fy[1] - 5, 40, 2.5); c.fillRect(x1 + 12, fy[2] - 5, 34, 2.5); c.fillRect(x1 + 12, fy[3] + 6, 220, 2); }
    if (cold) { c.fillStyle = grey(210, 0.85); for (let i = 0; i < 14; i++) { const ix = x0 - 10 + PH(i, 41) * (x1 - x0 + 20), il = 3 + PH(i, 42) * 9; c.beginPath(); c.moveTo(ix - 1.5, fy[0] + 10); c.lineTo(ix + 1.5, fy[0] + 10); c.lineTo(ix, fy[0] + 10 + il); c.fill(); } for (let i = 0; i < 5; i++) { const ix = x1 + 16 + i * 8, il = 3 + PH(i, 43) * 6; c.beginPath(); c.moveTo(ix - 1.2, fy[1] + 3); c.lineTo(ix + 1.2, fy[1] + 3); c.lineTo(ix, fy[1] + 3 + il); c.fill(); } }
    // #32 rugs with fringes on the bedroom and sitting-room floors
    for (const [rx, rw, f, g] of [[440, 90, 1, 110], [380, 110, 2, 96]]) { const y = fy[f]; c.fillStyle = grey(g); c.fillRect(rx, y - 2, rw, 2.5); c.fillStyle = grey(g - 30); for (let x = rx + 6; x < rx + rw - 4; x += 10) c.fillRect(x, y - 2, 4, 1); c.fillStyle = grey(g + 30); for (const ex of [rx - 3, rx + rw]) for (let k = 0; k < 2; k++) c.fillRect(ex + k * 1.5, y - 1, 1, 2); }
    // #33 wood grain and knots in the floorboards
    c.fillStyle = grey(86); for (let f = 1; f <= 3; f++) for (let x = x0 + 12; x < x1 - 10; x += 38) { c.fillRect(x + 6, fy[f] + 4, 18, 0.7); if (PH(x, f) < 0.25) { c.beginPath(); c.ellipse(x + 26, fy[f] + 5.5, 2, 1, 0, 0, TAU); c.fill(); } }
  },
  /* #34 ceiling lamp shades that sway a little; drawn over each bulb */
  shade(c, x, y, k) {
    const sw = calm() ? 0 : Math.sin(Game.time * 1.1 + x) * 0.05;
    c.save(); c.translate(x, y - 20); c.rotate(sw); c.fillStyle = grey(48); c.beginPath(); c.moveTo(-3, 12); c.lineTo(3, 12); c.lineTo(12, 22); c.lineTo(-12, 22); c.fill(); c.fillStyle = grey(70); c.fillRect(-12, 21, 24, 1.5); c.restore(); void k;
  },

  /* ---------- SCAVENGING SITES ---------- */
  siteBack(c, w, x0, x1, gy, top) {
    const L = w.L, t = Game.time, F = L.floors, id = L.id, bg = L.bg;
    const vis = (x, m) => x > x0 - (m || 60) && x < x1 + (m || 60);
    if (bg !== 'open') {
      // #35 ceiling pipes and conduit along every interior ceiling
      c.fillStyle = grey(46); for (const fl of F) { const y = fl.y - 96; c.fillRect(Math.max(x0, fl.x0), y, Math.min(x1, fl.x1) - Math.max(x0, fl.x0), 4); for (let x = Math.ceil(Math.max(x0, fl.x0) / 120) * 120; x < Math.min(x1, fl.x1); x += 120) c.fillRect(x - 2, y - 2, 6, 8); }
      // #36 peeling wallpaper patches and damp stains
      if (bg !== 'tunnel') for (let k = Math.floor(x0 / 230); k < x1 / 230; k++) { if (k < 0) continue; const f = Math.floor(PH(k, 51) * F.length), fl = F[f], x = k * 230 + PH(k, 52) * 120; if (x < fl.x0 || x > fl.x1 - 40) continue; c.fillStyle = grey(PH(k, 53) < 0.5 ? 30 : 74, 0.35); c.beginPath(); c.moveTo(x, fl.y - 80); for (let i = 0; i < 6; i++) c.lineTo(x + i * 8 + PH(k, 60 + i) * 6, fl.y - 80 + (i % 2 ? 18 : 6) + PH(k, 70 + i) * 12); c.lineTo(x + 46, fl.y - 80); c.fill(); }
    }
    for (let k = Math.max(0, Math.floor((x0 - 400) / 400)); k * 400 < x1 + 400; k++) {
      const bx = k * 400 + 200, fl = F[(k + 1) % F.length], fy = fl.y; if (bx < fl.x0 + 60 || bx > fl.x1 - 60 || !vis(bx, 120) || bx > L.w) continue;
      const seed = k * 7 + 3;
      if (id === 'pharmacy') {                                          // #37 a hanging cross sign and a dispensing counter
        if (k % 2 === 0) { c.strokeStyle = grey(40); c.lineWidth = 1; c.beginPath(); c.moveTo(bx - 8, fy - 96); c.lineTo(bx - 8, fy - 84); c.moveTo(bx + 8, fy - 96); c.lineTo(bx + 8, fy - 84); c.stroke(); c.fillStyle = grey(88); c.fillRect(bx - 12, fy - 84, 24, 24); c.fillStyle = grey(170); c.fillRect(bx - 3, fy - 80, 6, 16); c.fillRect(bx - 8, fy - 75, 16, 6); }
        else { c.fillStyle = grey(64); c.fillRect(bx - 50, fy - 30, 100, 30); c.fillStyle = grey(90); c.fillRect(bx - 54, fy - 33, 108, 4); c.fillStyle = grey(110); c.fillRect(bx - 30, fy - 40, 8, 7); c.fillRect(bx + 10, fy - 38, 12, 5); }
      } else if (id === 'market') {                                     // #38 striped stall awnings and a string of dead bulbs
        const sw = calm() ? 0 : Math.sin(t * 1.4 + k) * 2; c.fillStyle = grey(50); c.fillRect(bx - 50, fy - 64, 3, 64); c.fillRect(bx + 47, fy - 64, 3, 64);
        for (let i = 0; i < 8; i++) { c.fillStyle = grey(i % 2 ? 80 : 130); c.beginPath(); c.moveTo(bx - 54 + i * 13.5, fy - 70); c.lineTo(bx - 54 + (i + 1) * 13.5, fy - 70); c.lineTo(bx - 54 + (i + 1) * 13.5 + sw, fy - 56); c.lineTo(bx - 54 + i * 13.5 + sw, fy - 56); c.fill(); }
        c.fillStyle = grey(70); c.fillRect(bx - 44, fy - 24, 88, 4); for (let i = 0; i < 5; i++) { c.fillStyle = grey(90 + i * 18); c.beginPath(); c.arc(bx - 34 + i * 17, fy - 27, 5, Math.PI, 0); c.fill(); }
        c.strokeStyle = grey(40); c.lineWidth = 0.8; c.beginPath(); c.moveTo(bx - 200, fy - 92); c.quadraticCurveTo(bx, fy - 66, bx + 200, fy - 92); c.stroke(); for (let i = 1; i < 8; i++) { const lx = bx - 200 + i * 50, ly = fy - 92 + Math.sin(i / 8 * Math.PI) * 13; c.fillStyle = grey(120); c.beginPath(); c.arc(lx, ly + 3, 2.2, 0, TAU); c.fill(); }
      } else if (id === 'metro') {                                      // #39 tiled walls, a station plaque and the platform edge stripe
        c.fillStyle = grey(52); for (let yy = fy - 90; yy < fy - 10; yy += 8) for (let x = bx - 160; x < bx + 160; x += 12) c.fillRect(x, yy, 11, 7);
        if (k % 2 === 0) { c.fillStyle = grey(30); c.fillRect(bx - 40, fy - 72, 80, 18); c.fillStyle = grey(150); c.fillRect(bx - 38, fy - 70, 76, 14); txt(c, 'GREYWATER', bx, fy - 59, 9, grey(30), 'center', { outline: false, fixed: true }); }
        c.fillStyle = grey(140); for (let x = bx - 200; x < bx + 200; x += 16) c.fillRect(x, fy + 1, 9, 2);
      } else if (id === 'school') {                                     // #40 chalkboards with doodles and child-sized chairs
        if (k % 2 === 0) { c.fillStyle = grey(30); c.fillRect(bx - 50, fy - 84, 100, 44); c.strokeStyle = grey(72); c.lineWidth = 3; c.strokeRect(bx - 50, fy - 84, 100, 44); c.strokeStyle = grey(180, 0.7); c.lineWidth = 1; c.beginPath(); c.moveTo(bx - 40, fy - 70); c.lineTo(bx - 20, fy - 70); c.moveTo(bx - 40, fy - 62); c.lineTo(bx - 10, fy - 62); c.arc(bx + 22, fy - 64, 9, 0, TAU); c.moveTo(bx + 22, fy - 76); c.lineTo(bx + 22, fy - 79); c.moveTo(bx + 33, fy - 64); c.lineTo(bx + 36, fy - 64); c.stroke(); }
        else for (let i = 0; i < 3; i++) { const cx = bx - 40 + i * 34; c.fillStyle = grey(70); c.fillRect(cx, fy - 14, 14, 2); c.fillRect(cx, fy - 14, 2, 14); c.fillRect(cx + 12, fy - 14, 2, 14); c.fillRect(cx, fy - 28, 2, 14); }
      } else if (id === 'apartments') {                                 // #41 exposed rebar and hanging cables in the broken block
        c.strokeStyle = grey(70); c.lineWidth = 1.2; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(bx - 30 + i * 8, fy - 100); c.quadraticCurveTo(bx - 26 + i * 8, fy - 80, bx - 34 + i * 10 + PH(seed, i) * 6, fy - 66 - i * 3); c.stroke(); }
        c.strokeStyle = grey(30); c.beginPath(); c.moveTo(bx + 40, fy - 100); c.quadraticCurveTo(bx + 46 + (calm() ? 0 : Math.sin(t * 1.6 + k) * 4), fy - 60, bx + 38, fy - 40); c.stroke();
        c.fillStyle = grey(90); c.fillRect(bx + 60, fy - 70, 22, 16); c.fillStyle = grey(150); c.fillRect(bx + 62, fy - 68, 18, 12);
      } else if (id === 'hospital') {                                   // #42 ward beds, drip stands and curtain rails
        c.fillStyle = grey(60); c.fillRect(bx - 50, fy - 18, 64, 4); c.fillRect(bx - 50, fy - 30, 3, 30); c.fillRect(bx + 11, fy - 22, 3, 22); c.fillStyle = grey(120); c.fillRect(bx - 46, fy - 22, 56, 5); c.fillStyle = grey(150); c.fillRect(bx - 46, fy - 26, 14, 5);
        c.fillStyle = grey(70); c.fillRect(bx + 30, fy - 60, 2, 60); c.fillRect(bx + 24, fy - 2, 14, 2); c.fillStyle = grey(140, 0.8); c.fillRect(bx + 33, fy - 58, 6, 10);
        c.fillStyle = grey(50); c.fillRect(bx - 70, fy - 92, 130, 2); for (let i = 0; i < 6; i++) { c.fillStyle = grey(72 + (i % 2) * 10, 0.85); c.fillRect(bx - 70 + i * 6, fy - 90, 5, 70); }
      } else if (id === 'church') {                                     // #43 rose windows and tall candle stands
        if (k % 2 === 0) { const ry = fy - 70; c.fillStyle = grey(26); c.beginPath(); c.arc(bx, ry, 20, 0, TAU); c.fill(); c.fillStyle = grey(110); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; c.beginPath(); c.arc(bx + Math.cos(a) * 12, ry + Math.sin(a) * 12, 5, 0, TAU); c.fill(); } c.fillStyle = grey(150); c.beginPath(); c.arc(bx, ry, 5, 0, TAU); c.fill(); }
        else for (const cx of [bx - 30, bx + 30]) { c.fillStyle = grey(60); c.fillRect(cx - 1, fy - 46, 2, 46); c.fillRect(cx - 6, fy - 2, 12, 2); c.fillRect(cx - 10, fy - 46, 20, 2); for (const dx of [-8, 0, 8]) { c.fillStyle = grey(190); c.fillRect(cx + dx - 1, fy - 54, 2.5, 8); } }
      } else if (id === 'bridge') {                                     // #44 suspension cables and lamp posts on the span
        c.strokeStyle = grey(56); c.lineWidth = 1; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(bx + i * 30, fy - 4); c.lineTo(bx, fy - 190); c.stroke(); }
        c.fillStyle = grey(44); c.fillRect(bx + 120, fy - 80, 3, 80); c.fillRect(bx + 112, fy - 82, 18, 3);
      } else if (bg === 'open') {                                       // #45 burnt-out cars on open ground
        c.fillStyle = grey(30); c.beginPath(); c.moveTo(bx - 40, fy - 6); c.lineTo(bx - 38, fy - 20); c.lineTo(bx - 20, fy - 22); c.lineTo(bx - 10, fy - 34); c.lineTo(bx + 20, fy - 34); c.lineTo(bx + 30, fy - 22); c.lineTo(bx + 42, fy - 18); c.lineTo(bx + 42, fy - 6); c.fill(); c.fillStyle = grey(16); for (const wx of [bx - 22, bx + 24]) { c.beginPath(); c.arc(wx, fy - 6, 7, 0, TAU); c.fill(); }
      }
    }
  },
  siteFront(c, w, x0, x1, gy) {
    const L = w.L, t = Game.time, run = w.run;
    if (L.id === 'bridge' || L.id === 'metro') {                            // #46 river below the bridge and black water under the tracks
      const ry = gy + 30; c.fillStyle = grey(16); c.fillRect(x0, ry, x1 - x0, 200); c.strokeStyle = grey(70, 0.5); c.lineWidth = 1;
      for (let i = 0; i < 18; i++) { const wx = x0 + ((i * 97 + t * 14) % (x1 - x0 + 100)) - 50, wy = ry + 8 + (i % 6) * 12; c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + 18 + (i % 3) * 8, wy); c.stroke(); }
    }
    const snowy = L.bg === 'open' && (run.weather === 'snow' || run.weather === 'coldsnap' || (run.mods && run.mods.snow));
    for (let f = 0; f < L.floors.length; f++) {
      const fl = L.floors[f], a = Math.max(fl.x0, x0), b = Math.min(fl.x1, x1); if (b <= a) continue;
      // #47 scattered debris, papers and broken glass on the floors
      for (let x = Math.ceil(a / 37) * 37; x < b; x += 37) {
        const r = PH(x, f + 90); if (r > 0.42) continue;
        if (r < 0.14) { c.fillStyle = grey(70); c.beginPath(); c.moveTo(x, fl.y); c.lineTo(x + 3, fl.y - 4); c.lineTo(x + 7, fl.y - 2); c.lineTo(x + 9, fl.y); c.fill(); }
        else if (r < 0.28) { c.save(); c.translate(x, fl.y - 0.5); c.rotate((r - 0.2) * 2); c.fillStyle = grey(170, 0.8); c.fillRect(-4, -1, 8, 2); c.restore(); }
        else { c.fillStyle = grey(200, 0.6); c.fillRect(x, fl.y - 1, 1.5, 1); c.fillRect(x + 4, fl.y - 1.5, 1, 1); }
      }
      // #48 snow drifts along open ground when it snows
      if (snowy) { c.fillStyle = grey(230); c.fillRect(a, fl.y - 1.5, b - a, 2); for (let x = Math.ceil(a / 60) * 60; x < b; x += 60) { c.beginPath(); c.ellipse(x + 30, fl.y, 22 + PH(x, 3) * 18, 3 + PH(x, 4) * 2, 0, Math.PI, 0); c.fill(); } }
    }
    // #49 footprints left in the snow, fading as they fill in
    if (this.prints.length) { c.fillStyle = grey(140, 0.5); for (let i = this.prints.length - 1; i >= 0; i--) { const p = this.prints[i]; p.t -= Game.rdt || 0.016; if (p.t <= 0 || p.w !== w) { this.prints.splice(i, 1); continue; } c.globalAlpha = clamp(p.t / 4, 0, 1); c.beginPath(); c.ellipse(p.x, p.y, 3, 1, 0, 0, TAU); c.fill(); } c.globalAlpha = 1; }
    void t;
  },
  footprint(w, s) {
    const snowy = w.L.site && w.L.bg === 'open' && (w.run.weather === 'snow' || w.run.weather === 'coldsnap' || (w.run.mods && w.run.mods.snow));
    if (!snowy || s.cl || s.jz > 0) return;
    this.prints.push({ x: s.x + (this.prints.length % 2 ? 3 : -3), y: w.floorY(s.f) - 0.5, t: 14, w }); if (this.prints.length > 120) this.prints.shift();
  },

  /* ---------- OBJECT DETAILS (drawn after each object) ---------- */
  obj(c, w, o) {
    const y = w.floorY(o.f), x = o.x, t = Game.time, run = w.run;
    switch (o.type) {
      case 'exit': {                                                    // #50 exit sign over the street door and light spilling under it
        c.fillStyle = grey(30); c.fillRect(x - 13, y - 104, 26, 12); c.fillStyle = grey(200); c.fillRect(x - 11, y - 102, 22, 8); txt(c, 'EXIT', x, y - 95.5, 6.5, grey(30), 'center', { outline: false, fixed: true });
        const g = c.createLinearGradient(0, y - 8, 0, y + 10); g.addColorStop(0, grey(200, 0.0)); g.addColorStop(1, grey(200, 0.3)); c.fillStyle = g; c.fillRect(x - 16, y - 8, 32, 10); break; }
      case 'cont': {                                                    // #51 handles that catch the light, #52 searched containers left ajar
        const e = !o.items.length;
        c.fillStyle = grey(200, 0.7); if (o.kind === 'cabinet' || o.kind === 'drawers') c.fillRect(x - 4, y - 30, 1, 2); if (o.kind === 'locker') c.fillRect(x + 6, y - 27, 1, 3);
        if (e) { c.fillStyle = grey(40); if (o.kind === 'cabinet') { c.beginPath(); c.moveTo(x + 13, y - 46); c.lineTo(x + 20, y - 43); c.lineTo(x + 20, y - 3); c.lineTo(x + 13, y); c.fill(); } else if (o.kind === 'drawers') c.fillRect(x - 15, y - 32, 30, 3); else if (o.kind === 'locker') { c.beginPath(); c.moveTo(x + 9, y - 54); c.lineTo(x + 15, y - 51); c.lineTo(x + 15, y - 2); c.lineTo(x + 9, y); c.fill(); } }
        if (o.kind === 'crate') { c.fillStyle = grey(110, 0.6); for (let i = 0; i < 3; i++) c.fillRect(x - 12, y - 21 + i * 7, 24, 0.8); }
        if (o.rich && !e && !calm() && Math.sin(t * 2 + x) > 0.96) Parts.emit('glint', x + 6, y - 30, 1, {});
        break; }
      case 'bed': { c.fillStyle = grey(180); c.beginPath(); c.ellipse(x - 16, y - 21, 6, 3, 0, 0, TAU); c.fill();      // #53 a plumped pillow and quilted blanket
        c.strokeStyle = grey(70, 0.6); c.lineWidth = 0.8; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x - 4 + i * 7, y - 18); c.lineTo(x - 4 + i * 7, y - 11); c.stroke(); } break; }
      case 'stove': {                                                   // #54 a pot on the hob that steams when food is around
        c.fillStyle = grey(90); c.fillRect(x - 12, y - 44, 14, 3); c.fillRect(x + 2, y - 43, 6, 1.5);
        if (Run.food(run) > 0 && rich() && Math.random() < (Game.rdt || 0.016) * 2.5) Parts.emit('steam', x - 5, y - 48, 1, {}); break; }
      case 'radio': { c.fillStyle = grey(50); for (let i = 0; i < 4; i++) c.fillRect(x - 8, y - 36 + i * 2, 8, 0.8); break; }   // #55 speaker grille on the radio
      case 'workbench': {                                               // #56 a pegboard of tools above the workbench
        c.fillStyle = grey(70); c.fillRect(x - 22, y - 74, 44, 32); c.fillStyle = grey(50); for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) c.fillRect(x - 18 + i * 9, y - 70 + j * 8, 1, 1);
        c.fillStyle = grey(150); c.fillRect(x - 16, y - 68, 2, 14); c.fillRect(x - 19, y - 68, 8, 3); c.strokeStyle = grey(150); c.lineWidth = 1.5; c.beginPath(); c.arc(x, y - 60, 5, 0.3, Math.PI * 1.7); c.stroke(); c.fillRect(x + 10, y - 70, 2, 18); c.fillRect(x + 7, y - 54, 8, 3); break; }
      case 'heater': if (run.heaterOn && rich() && !calm()) { c.strokeStyle = grey(200, 0.15); c.lineWidth = 1; for (let i = 0; i < 3; i++) { c.beginPath(); for (let k = 0; k < 6; k++) c.lineTo(x - 6 + i * 6 + Math.sin(t * 6 + k + i) * 2, y - 38 - k * 5); c.stroke(); } } break;   // #57 heat shimmer
      case 'pantry': { c.fillStyle = grey(210); for (let k = 0; k < 3; k++) c.fillRect(x - 6, y - 41 + k * 19, 12, 3); c.fillStyle = grey(40); for (let k = 0; k < 3; k++) c.fillRect(x - 4, y - 40 + k * 19, 8, 0.8); break; }   // #58 labelled pantry shelves
      case 'fridge': { c.fillStyle = grey(210); c.fillRect(x - 8, y - 54, 5, 4); c.fillStyle = grey(120); c.fillRect(x - 4, y - 48, 4, 4); break; }   // #59 magnets and a child's note on the fridge
      case 'hide':
        if (o.kind === 'wardrobe') { c.fillStyle = grey(90); c.fillRect(x - 13, y - 58, 1, 54); c.fillRect(x + 12, y - 58, 1, 54); c.fillStyle = grey(30); c.fillRect(x - 15, y - 4, 4, 4); c.fillRect(x + 11, y - 4, 4, 4); }   // #60 wardrobe panelling and feet
        if (o.occ && !calm()) { const k = 0.5 + 0.5 * Math.sin(t * 2); c.fillStyle = grey(220, 0.25 + k * 0.2); c.fillRect(x - 2, y - 44, 1.2, 1.2); c.fillRect(x + 1, y - 44, 1.2, 1.2); }   // #61 eyes peeking from a hiding place
        break;
      case 'candle': { c.fillStyle = grey(220); c.beginPath(); c.moveTo(x - 2, y - 30); c.quadraticCurveTo(x - 4, y - 26, x - 3, y - 23); c.lineTo(x - 2, y - 23); c.fill(); break; }   // #62 wax drips down the candle
      case 'door': break;
      case 'coop': if (!calm() && Math.sin(t * 0.8) > 0.97) { c.fillStyle = grey(200); c.fillRect(x - 36, y - 18, 1.5, 1.5); } break;
      default: break;
    }
  },

  /* ---------- LIGHT AND ATMOSPHERE (screen space, over the darkness layer) ---------- */
  glows(ctx, w, X, Y) {
    if (!rich()) return;
    const L = w.L, t = Game.time, z = w.cam.zoom, run = w.run, bulbs = !(run.mods.blackout || w.o.blackout);
    ctx.save();
    const halo = (x, y, r, a) => { if (x < -r || x > W + r || y < -r || y > H + r) return; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, grey(255, a)); g.addColorStop(0.35, grey(255, a * 0.3)); g.addColorStop(1, grey(255, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
    // #63 bloom around every working bulb and #64 a dusty light shaft beneath it
    for (const li of L.lights) {
      if (li.on === false || (li.bulb && !bulbs && w.night)) continue;
      const by = L.home ? w.floorY(li.f) - 66 : w.floorY(li.f) - 74, x = X(li.x), y = Y(by), fl = li.flick && Math.sin(t * 19 + li.x) > 0.9 ? 0.3 : 1;
      halo(x, y, 26 * z, 0.32 * fl);
      if (w.night || L.site) { const gy = Y(w.floorY(li.f)), sg = ctx.createLinearGradient(0, y, 0, gy); sg.addColorStop(0, grey(255, 0.08 * fl)); sg.addColorStop(1, grey(255, 0)); ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(x - 4 * z, y); ctx.lineTo(x + 4 * z, y); ctx.lineTo(x + 60 * z, gy); ctx.lineTo(x - 60 * z, gy); ctx.fill(); }
    }
    // #65 a visible flashlight beam with floating dust in it
    for (const s of w.surv) {
      if (!s.light || s.hidden) continue;
      const sy = w.entY(s) - 32, dir = s.face, len = CFG.light.cone * 0.9, x0 = X(s.x + dir * 8), y0 = Y(sy), x1 = X(s.x + dir * len), sp = Math.tan(CFG.light.half) * len * z;
      const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, grey(255, 0.12)); g.addColorStop(1, grey(255, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, y0 - 2); ctx.lineTo(x1, y0 - sp * 0.8); ctx.lineTo(x1, y0 + sp * 0.8); ctx.lineTo(x0, y0 + 2); ctx.fill();
      halo(x0, y0, 9 * z, 0.5);
      if (!calm()) for (let i = 0; i < 14; i++) { const k = ((PH(i, 101) + t * 0.05 * (0.5 + PH(i, 102))) % 1), dx = k * len * z * dir, spread = (PH(i, 103) - 0.5) * sp * 1.4 * k + Math.sin(t + i) * 3; ctx.fillStyle = grey(255, 0.35 * (1 - k)); ctx.fillRect(x0 + dx, y0 + spread, 1.3, 1.3); }
    }
    // #66 warm halo around the candle, fire barrel and lanterns
    if (L.home) for (const o of L.objs) { const oy = w.floorY(o.f); if (o.type === 'candle' && (run.candleLit || (w.candle && w.candle.lit))) halo(X(o.x), Y(oy - 36), 30 * z, 0.18); if (o.type === 'firebarrel' && (run.barrelLit || o.lit)) halo(X(o.x), Y(oy - 34), 50 * z, 0.16); }
    for (const s of w.surv) if (s.lantern) halo(X(s.x + s.face * 11), Y(w.entY(s) - 22), 40 * z, 0.2);
    ctx.restore();
  },

  /* ---------- SCREEN EFFECTS ---------- */
  post(ctx, o) {
    const t = Game.time, run = Game.run, dt = Game.rdt || 0.016, s = Save.s;
    // #67 lightning flicker during night rain
    const sw = Game.scene && Game.scene.w;
    if (run && run.weather === 'rain' && sw && sw.night && !s.reduce) {
      this.boltT -= dt; if (this.boltT <= 0) { this.boltT = 8 + Math.random() * 14; this.bolt = 1; Snd.sfx('rumble', { d: 2.2, v: 0.45 }); }
      if (this.bolt > 0) { this.bolt -= dt * 2.4; const a = this.bolt > 0.7 ? 0.16 : this.bolt > 0.45 ? 0.02 : this.bolt > 0.3 ? 0.1 : 0; if (a) { ctx.fillStyle = grey(255, a); ctx.fillRect(0, 0, W, H); } }
    }
    if (s.lowfx || s.quality === 'low') return;
    // #68 old-film scratches and specks, very faint
    if (!s.reduce && Math.random() < 0.08) { ctx.strokeStyle = grey(255, 0.06); ctx.lineWidth = 1; const sx = Math.random() * W; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + (Math.random() - 0.5) * 8, H); ctx.stroke(); }
    if (!s.reduce) { ctx.fillStyle = grey(0, 0.25); for (let i = 0; i < 3; i++) if (Math.random() < 0.3) ctx.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1 + Math.random() * 2); }
    void t;
  },
  /* ---------- THE BUILDING FROM OUTSIDE (title, credits, endings) ---------- */
  buildingRoof(ctx, t, bx, by, bw, bh, night) {
    // #98 brick courses on the facade
    ctx.fillStyle = grey(night ? 34 : 62, 0.6); for (let yy = by + 4; yy < by + bh; yy += 9) ctx.fillRect(bx, yy, bw, 0.8);
    // #99 a chimney with a lazy curl of smoke, a TV aerial and a water tank on the roof
    const cx = bx + 46; ctx.fillStyle = grey(night ? 30 : 56); ctx.fillRect(cx, by - 40, 22, 32); ctx.fillStyle = grey(night ? 22 : 44); ctx.fillRect(cx - 3, by - 44, 28, 6);
    if (!calm()) for (let i = 0; i < 7; i++) { const k = ((t * 0.12 + i / 7) % 1), sx = cx + 11 + Math.sin(k * 5 + t * 0.6) * 8 * k + k * 30, sy = by - 48 - k * 90; ctx.fillStyle = grey(night ? 70 : 150, 0.22 * (1 - k)); ctx.beginPath(); ctx.arc(sx, sy, 6 + k * 16, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = grey(night ? 22 : 40); ctx.lineWidth = 1.6; const ax = bx + 120; ctx.beginPath(); ctx.moveTo(ax, by - 8); ctx.lineTo(ax + 2, by - 54); for (let i = 0; i < 3; i++) { ctx.moveTo(ax - 10 + i * 2, by - 50 + i * 8); ctx.lineTo(ax + 12 - i * 2, by - 48 + i * 8); } ctx.stroke();
    ctx.fillStyle = grey(night ? 26 : 50); ctx.fillRect(bx + 170, by - 44, 34, 26); ctx.fillRect(bx + 172, by - 18, 3, 10); ctx.fillRect(bx + 199, by - 18, 3, 10); ctx.beginPath(); ctx.moveTo(bx + 168, by - 44); ctx.lineTo(bx + 187, by - 54); ctx.lineTo(bx + 206, by - 44); ctx.fill();
  },
  litWindow(ctx, t, wx, wy, k, night) {
    // #100 lit windows get curtains, a glowing sill and light spilling down the wall
    ctx.fillStyle = grey(night ? 40 : 70, 0.85); ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + 9, wy); ctx.quadraticCurveTo(wx + 5, wy + 20, wx + 3, wy + 40); ctx.lineTo(wx, wy + 40); ctx.fill();
    ctx.beginPath(); ctx.moveTo(wx + 44, wy); ctx.lineTo(wx + 35, wy); ctx.quadraticCurveTo(wx + 39, wy + 20, wx + 41, wy + 40); ctx.lineTo(wx + 44, wy + 40); ctx.fill();
    ctx.fillStyle = grey(night ? 54 : 90); ctx.fillRect(wx, wy, 44, 3);
    if (night) { const g = ctx.createLinearGradient(0, wy + 40, 0, wy + 70); g.addColorStop(0, grey(210, 0.16 + 0.04 * Math.sin(t * 2 + k))); g.addColorStop(1, grey(210, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(wx - 2, wy + 40); ctx.lineTo(wx + 46, wy + 40); ctx.lineTo(wx + 56, wy + 70); ctx.lineTo(wx - 12, wy + 70); ctx.fill(); }
  },
  /* #69 letterbox bars that slide in for cutscenes */
  letterbox(ctx, k) { const h = 22 * clamp(k, 0, 1); ctx.fillStyle = G.black; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h); }
};
