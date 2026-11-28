/* ==========================================================================
   SECTION 26: RELEASE 1.1 POLISH
   A second layer of detail on top of Section 25. Each piece wraps an existing
   drawing hook, so the 1.0 drawing still runs first and stays unchanged.
   Same rules: greys in the world layer, colour only for people and small
   "echoes", motion off under Reduce motion, heavy effects off on Low quality.
   Numbers in the comments match CHANGELOG.md (101 to 200).
   ========================================================================== */
const V11 = {
  rats: [], moths: [], leaves: [], shoot: { t: 4, a: 0, x: 0, y: 0 }, frost: 0,
  /* run fn(k, x) for every slot k of a fixed grid that falls in view */
  each(x0, x1, step, off, fn) { for (let k = Math.max(0, Math.floor((x0 - off - 80) / step)); k * step + off < x1 + 80; k++) fn(k, k * step + off); },

  /* ---------- SKY ---------- */
  skyBack(c, camX, night, t) {
    if (night) {
      // #101 a band of lighter sky low on the horizon
      const hb = c.createLinearGradient(0, 220, 0, 360); hb.addColorStop(0, grey(40, 0)); hb.addColorStop(1, grey(60, 0.35)); c.fillStyle = hb; c.fillRect(0, 220, W, 140);
      // #102 the occasional shooting star
      const s = this.shoot; s.t -= Game.rdt || 0.016;
      if (s.t <= 0 && !calm()) { s.t = 9 + Math.random() * 16; s.a = 1; s.x = 100 + Math.random() * 700; s.y = 20 + Math.random() * 90; }
      if (s.a > 0) { s.a -= (Game.rdt || 0.016) * 1.6; const k = 1 - s.a, hx = s.x + k * 160, hy = s.y + k * 60, g = c.createLinearGradient(hx - 60, hy - 22, hx, hy); g.addColorStop(0, grey(255, 0)); g.addColorStop(1, grey(255, 0.7 * Math.max(0, s.a))); c.strokeStyle = g; c.lineWidth = 1.4; c.beginPath(); c.moveTo(hx - 60, hy - 22); c.lineTo(hx, hy); c.stroke(); }
    } else {
      // #103 a pale sun glowing through the overcast
      const sx = 760 - camX * 0.02, g = c.createRadialGradient(sx, 70, 4, sx, 70, 120); g.addColorStop(0, grey(235, 0.55)); g.addColorStop(0.2, grey(220, 0.25)); g.addColorStop(1, grey(200, 0)); c.fillStyle = g; c.fillRect(sx - 120, -50, 240, 240);
    }
    // #104 barrage balloons tethered far off
    for (let i = 0; i < 2; i++) {
      const bx = ((i * 1100 + 600 - camX * 0.07) % 2000 + 2000) % 2000 - 200, by = 150 + i * 30 + (calm() ? 0 : Math.sin(t * 0.4 + i) * 4);
      c.fillStyle = grey(night ? 30 : 92); c.beginPath(); c.ellipse(bx, by, 16, 7, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(bx - 14, by); c.lineTo(bx - 22, by - 6); c.lineTo(bx - 22, by + 6); c.fill();
      c.strokeStyle = grey(night ? 30 : 92, 0.6); c.lineWidth = 0.6; c.beginPath(); c.moveTo(bx, by + 7); c.lineTo(bx + 6, 360); c.stroke();
    }
  },
  skyMid(c, camX, night, t) {
    if (night) {
      // #105 craters on the moon and #106 thin clouds drifting across it
      const mx = 500 - camX * 0.02; c.fillStyle = grey(150, 0.35); for (const [dx, dy, r] of [[-8, -6, 3], [-12, 6, 2.2], [-3, 10, 1.6]]) { c.beginPath(); c.arc(mx + dx, 96 + dy, r, 0, TAU); c.fill(); }
      for (let i = 0; i < 3; i++) { const cx = ((t * (6 + i * 3) + i * 400) % (W + 400)) - 200, cy = 70 + i * 26; c.fillStyle = grey(24, 0.55); c.beginPath(); c.ellipse(cx, cy, 90 - i * 20, 6 + i, 0, 0, TAU); c.fill(); }
      // #107 an aircraft's blinking light crossing the dark
      if (!calm()) { const k = (t * 0.02) % 1, ax = -50 + k * (W + 100), ay = 46 + Math.sin(k * 6) * 6; if (Math.sin(t * 6) > 0.6) { c.fillStyle = grey(255, 0.9); c.fillRect(ax, ay, 2, 2); } }
    }
  },
  roofMore(c, b, x, top, night, col, idx) {
    const k = Math.floor(PH(idx, 211) * 4);
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 1;
    // #108 zig-zag fire escapes on the skyline
    if (k === 0 && b.h > 90) { const fx = x + b.w - 12; for (let y = top + 18; y < top + b.h - 10; y += 22) { c.fillRect(fx - 10, y, 14, 2); c.beginPath(); c.moveTo(fx - 9, y); c.lineTo(fx + 2, y + 22); c.stroke(); } }
    // #109 jagged shell holes in the far walls
    if (k === 1) { c.fillStyle = night ? grey(10) : grey(96); const hx = x + b.w * 0.4, hy = top + 20; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + 9, hy - 4); c.lineTo(hx + 16, hy + 3); c.lineTo(hx + 12, hy + 12); c.lineTo(hx + 2, hy + 10); c.fill(); }
    // #110 a washing line strung between rooftops
    if (k === 2) { c.beginPath(); c.moveTo(x, top - 4); c.quadraticCurveTo(x + b.w / 2, top + 6, x + b.w, top - 4); c.stroke(); for (let i = 1; i < 4; i++) c.fillRect(x + i * b.w / 4 - 3, top + 1, 6, 7); }
  },

  /* ---------- THE SHELTER ---------- */
  homeWalls(c, w) {
    const fy = CFG.home.floorsY, t = Game.time, x0 = CFG.home.x0 - 12, x1 = CFG.home.x1 + 12, run = w.run;
    // #111 cornice moulding along the ceilings and #112 a stencilled frieze in the sitting room
    for (let f = 1; f <= 3; f++) { c.fillStyle = grey(82); c.fillRect(x0, fy[f - 1] + 10, x1 - x0, 3); c.fillStyle = grey(50); c.fillRect(x0, fy[f - 1] + 13, x1 - x0, 1); }
    c.fillStyle = grey(84); for (let x = x0 + 6; x < x1; x += 18) { c.beginPath(); c.arc(x, fy[1] + 20, 3, 0, Math.PI); c.fill(); }
    // #113 light switches and wall sockets
    for (const [sx, f] of [[420, 1], [560, 2], [270, 3]]) { c.fillStyle = grey(170); c.fillRect(sx, fy[f] - 52, 5, 8); c.fillStyle = grey(60); c.fillRect(sx + 2, fy[f] - 50, 1, 4); c.fillStyle = grey(160); c.fillRect(sx + 30, fy[f] - 16, 6, 5); c.fillStyle = grey(50); c.fillRect(sx + 31.5, fy[f] - 14.5, 1, 2); c.fillRect(sx + 33.5, fy[f] - 14.5, 1, 2); }
    // #114 a pendulum swinging under the wall clock
    { const px = 468, py = fy[2] - 58, a = calm() ? 0 : Math.sin(t * Math.PI) * 0.3; c.strokeStyle = grey(80); c.lineWidth = 1; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.sin(a) * 14, py + Math.cos(a) * 14); c.stroke(); c.fillStyle = grey(160); c.beginPath(); c.arc(px + Math.sin(a) * 14, py + Math.cos(a) * 14, 2.2, 0, TAU); c.fill(); }
    // #115 Toby's crayon doodles taped low on the stairwell wall
    if (run.surv.some(s => s.id === 'toby' && !s.gone)) for (let i = 0; i < 3; i++) { const dx = 300 + i * 16, dy = fy[3] - 34 - (i % 2) * 6; c.fillStyle = grey(215); c.fillRect(dx, dy, 12, 10); c.strokeStyle = grey(90); c.lineWidth = 0.8; c.beginPath(); if (i === 0) c.arc(dx + 6, dy + 5, 3, 0, TAU); else if (i === 1) { c.moveTo(dx + 2, dy + 8); c.lineTo(dx + 6, dy + 2); c.lineTo(dx + 10, dy + 8); } else { c.moveTo(dx + 2, dy + 7); c.lineTo(dx + 10, dy + 7); c.moveTo(dx + 4, dy + 7); c.lineTo(dx + 4, dy + 3); } c.stroke(); }
    // #116 a rat-hole in the cellar wall, with eyes that shine at night
    c.fillStyle = grey(12); c.beginPath(); c.arc(150, fy[4], 6, Math.PI, 0); c.fill(); if (w.night && Math.sin(t * 0.7) > 0.3) { c.fillStyle = grey(220); c.fillRect(147, fy[4] - 3, 1.2, 1.2); c.fillRect(151, fy[4] - 3, 1.2, 1.2); }
    // #117 a puddle under the dripping pipe, with rings when a drop lands
    c.fillStyle = grey(60, 0.6); c.beginPath(); c.ellipse(300, fy[4] - 0.5, 16, 2, 0, 0, TAU); c.fill(); if (!calm()) { const k = (t % 1.7) / 1.7; c.strokeStyle = grey(180, 0.5 * (1 - k)); c.lineWidth = 0.7; c.beginPath(); c.ellipse(300, fy[4] - 0.5, 3 + k * 12, 0.6 + k * 1.4, 0, 0, TAU); c.stroke(); }
  },
  homeFront(c, w) {
    const fy = CFG.home.floorsY, t = Game.time, x0 = CFG.home.x0 - 12, x1 = CFG.home.x1 + 12, run = w.run, wind = calm() ? 0 : Math.sin(t * 1.4);
    // #118 a washing line across the roof, shirts and socks on the breeze
    { const ax = 170, bx = 290, y = fy[0] - 34; c.strokeStyle = grey(50); c.lineWidth = 1; c.beginPath(); c.moveTo(ax, y); c.quadraticCurveTo((ax + bx) / 2, y + 8, bx, y); c.stroke(); c.fillRect(ax - 1, y, 2, 34); c.fillRect(bx - 1, y, 2, 34);
      for (let i = 0; i < 4; i++) { const lx = ax + 18 + i * 26, ly = y + 2 + Math.sin((i + 1) / 5 * Math.PI) * 7; c.save(); c.translate(lx, ly); c.rotate(wind * 0.12 + Math.sin(t * 2 + i) * (calm() ? 0 : 0.05)); c.fillStyle = grey(120 + i * 25); if (i % 2) c.fillRect(-4, 0, 8, 11); else { c.fillRect(-7, 0, 14, 12); c.fillRect(-10, 0, 3, 6); c.fillRect(7, 0, 3, 6); } c.restore(); } }
    // #119 pigeons on the parapet, pecking and hopping
    for (let i = 0; i < 3; i++) { const px = 620 + i * 54 + (calm() ? 0 : Math.sin(t * 0.3 + i * 2) * 6), hop = calm() ? 0 : Math.max(0, Math.sin(t * 2.3 + i * 1.7)) ** 8 * 4, peck = !calm() && Math.sin(t * 3 + i) > 0.8 ? 2 : 0, py = fy[0] - 14 - hop;
      c.fillStyle = grey(110 + i * 20); c.beginPath(); c.ellipse(px, py, 4.5, 3, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(px + 4, py - 3 + peck, 2, 0, TAU); c.fill(); c.fillRect(px - 7, py - 1, 3, 2); }
    // #120 a weathervane on the chimney that turns with the wind
    { const vx = 313, vy = fy[0] - 66; c.strokeStyle = grey(30); c.lineWidth = 1.2; c.beginPath(); c.moveTo(vx, vy + 8); c.lineTo(vx, vy - 6); c.stroke(); const d = Math.cos(t * 0.5) * 10; c.beginPath(); c.moveTo(vx - d, vy - 4); c.lineTo(vx + d, vy - 4); c.stroke(); c.fillStyle = grey(30); c.beginPath(); c.moveTo(vx + d, vy - 4); c.lineTo(vx + d - Math.sign(d || 1) * 4, vy - 7); c.lineTo(vx + d - Math.sign(d || 1) * 4, vy - 1); c.fill(); }
    // #121 hairline cracks in the outer brickwork
    c.strokeStyle = grey(18); c.lineWidth = 0.8; for (const [cx, cy] of [[x0 - 8, fy[1] - 20], [x0 - 6, fy[3] - 40], [x1 + 6, fy[1] + 30]]) { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + 3, cy + 8); c.lineTo(cx - 1, cy + 15); c.lineTo(cx + 2, cy + 24); c.stroke(); }
    // #122 window boxes with stubborn plants on the balconies
    for (const [f, len] of [[1, 40], [2, 34]]) { const by = fy[f] - 10; c.fillStyle = grey(62); c.fillRect(x1 + 14, by, len - 4, 6); c.strokeStyle = grey(130); c.lineWidth = 1; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(x1 + 18 + i * 6, by); c.lineTo(x1 + 18 + i * 6 + Math.sin(t + i) * 1.5 * (calm() ? 0 : 1), by - 5 - (i % 2) * 3); c.stroke(); } }
    // #123 a mailbox by the door and #124 a doormat on the step
    c.fillStyle = grey(70); c.fillRect(x1 + 26, fy[3] - 54, 14, 18); c.fillStyle = grey(30); c.fillRect(x1 + 28, fy[3] - 48, 10, 1.6); c.fillStyle = grey(56); c.fillRect(x1 + 2, fy[3] + 6, 40, 4); c.fillStyle = grey(44); for (let i = 0; i < 6; i++) c.fillRect(x1 + 5 + i * 6, fy[3] + 7, 2, 2);
    // #125 a drain grate in the road
    c.fillStyle = grey(10); c.fillRect(980, fy[3] + 12, 26, 5); c.fillStyle = grey(50); for (let i = 0; i < 6; i++) c.fillRect(982 + i * 4, fy[3] + 12, 1, 5);
    // #126 scraps of paper skittering along the street
    if (!calm()) for (let i = 0; i < 3; i++) { const k = ((t * 0.08 + i * 0.37) % 1), lx = 1150 - k * 330, ly = fy[3] + 14 + i * 5 - Math.abs(Math.sin(k * 20 + i)) * 6; c.save(); c.translate(lx, ly); c.rotate(k * 12 + i); c.fillStyle = grey(150, 0.8); c.fillRect(-3, -2, 6, 4); c.restore(); }
    // #127 a bird's nest in the gutter
    c.fillStyle = grey(70); c.beginPath(); c.ellipse(x0 + 20, fy[0] + 2, 9, 3.5, 0, 0, Math.PI); c.fill(); c.strokeStyle = grey(100); c.lineWidth = 0.6; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x0 + 12 + i * 4, fy[0] + 2); c.lineTo(x0 + 16 + i * 4, fy[0] + 4.5); c.stroke(); }
    void run;
  },
  /* #128 a carpet runner and bright nosings on the stairs, #129 worn rungs and a rope tie on ladders */
  ladder(c, w, l) {
    const ya = w.floorY(l.fa), yb = w.floorY(l.fb);
    if (l.broken) return;
    if (l.stairs) { c.strokeStyle = grey(84, 0.9); c.lineWidth = 4; c.beginPath(); c.moveTo(l.xb, yb - 2); c.lineTo(l.xa, ya + 2); c.stroke(); const n = 9, dx = (l.xa - l.xb) / n, dy = (ya - yb) / n; c.fillStyle = grey(190); for (let i = 1; i < n; i++) c.fillRect(Math.min(l.xb + dx * i, l.xb + dx * (i + 1)), yb + dy * (i + 1), Math.abs(dx) + 1, 1); }
    else { c.fillStyle = grey(200, 0.55); for (let y = yb - 8; y > ya; y -= 11) c.fillRect(l.xa - 3, y - 1, 6, 1); c.strokeStyle = grey(120); c.lineWidth = 1.2; c.beginPath(); c.moveTo(l.xa - 9, ya + 14); c.lineTo(l.xa - 5, ya + 18); c.moveTo(l.xa - 9, ya + 18); c.lineTo(l.xa - 5, ya + 14); c.stroke(); }
  },
  /* #130 a knocker, letter plate and spyhole on the front door; #131 architraves round every site door */
  blocker(c, w, b) {
    const y = w.floorY(b.f);
    if (b.type !== 'door' || b.open) return;
    if (b.home) { c.fillStyle = grey(150); c.fillRect(b.x - 3, y - 40, 6, 1.5); c.beginPath(); c.arc(b.x, y - 52, 2.2, 0, TAU); c.fill(); c.fillStyle = grey(20); c.beginPath(); c.arc(b.x, y - 62, 1, 0, TAU); c.fill(); return; }
    c.fillStyle = grey(84); c.fillRect(b.x - 7, y - 80, 14, 4); c.fillRect(b.x - 7, y - 80, 2, 80); c.fillRect(b.x + 5, y - 80, 2, 80); c.fillStyle = grey(140); c.fillRect(b.x + 1, y - 38, 2, 1.4);
  },

  /* ---------- SCAVENGING SITES ---------- */
  siteBack(c, w, x0, x1) {
    const L = w.L, F = L.floors, id = L.id, t = Game.time, bg = L.bg;
    for (let f = 0; f < F.length; f++) {
      const fl = F[f], fy = fl.y, in_ = x => x > fl.x0 + 50 && x < fl.x1 - 50;
      this.each(x0, x1, 330, 120 + f * 47, (k, bx) => {
        if (!in_(bx)) return; const r = PH(k * 5 + f, 300);
        if (r < 0.72) {                     // leave some wall bare
        if (id === 'pharmacy') {            // #132 rows of medicine bottles and #133 a faded opening-hours poster
          if (r < 0.5) { c.fillStyle = grey(66); c.fillRect(bx - 30, fy - 60, 60, 2); c.fillRect(bx - 30, fy - 40, 60, 2); for (let i = 0; i < 8; i++) { c.fillStyle = grey(100 + (i * 37 % 90)); c.fillRect(bx - 28 + i * 7, fy - 60 - 6 - (i % 3), 4, 6 + (i % 3)); c.fillRect(bx - 27 + i * 7, fy - 47, 4, 7); } }
          else { c.fillStyle = grey(150, 0.8); c.fillRect(bx - 10, fy - 78, 20, 28); c.fillStyle = grey(70); for (let i = 0; i < 6; i++) c.fillRect(bx - 7, fy - 72 + i * 4, 10 + (i % 3) * 2, 1); }
        } else if (id === 'market') {       // #134 a hanging scale and #135 stacked crates of cabbages
          if (r < 0.5) { c.strokeStyle = grey(60); c.lineWidth = 1; c.beginPath(); c.moveTo(bx, fy - 96); c.lineTo(bx, fy - 74); c.moveTo(bx - 10, fy - 66); c.lineTo(bx, fy - 74); c.lineTo(bx + 10, fy - 66); c.stroke(); c.fillStyle = grey(90); c.beginPath(); c.arc(bx, fy - 66, 10, 0, Math.PI); c.fill(); c.fillStyle = grey(140); c.beginPath(); c.arc(bx, fy - 78, 4, 0, TAU); c.fill(); }
          else for (let i = 0; i < 3; i++) { const cx = bx - 24 + (i % 2) * 26, cy = fy - 14 - Math.floor(i / 2) * 14; c.fillStyle = grey(76); c.fillRect(cx, cy, 24, 14); c.fillStyle = grey(130); for (let j = 0; j < 3; j++) { c.beginPath(); c.arc(cx + 5 + j * 7, cy, 3.5, Math.PI, 0); c.fill(); } }
        } else if (id === 'metro') {        // #136 signal lamps and cable runs on the tunnel walls
          c.fillStyle = grey(30); c.fillRect(bx - 4, fy - 70, 8, 18); c.fillStyle = grey(r < 0.5 ? 200 : 70); c.beginPath(); c.arc(bx, fy - 65, 2.2, 0, TAU); c.fill(); c.fillStyle = grey(r < 0.5 ? 70 : 200); c.beginPath(); c.arc(bx, fy - 57, 2.2, 0, TAU); c.fill();
          c.strokeStyle = grey(28); c.lineWidth = 1.5; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(bx - 165, fy - 40 + i * 4); c.quadraticCurveTo(bx, fy - 34 + i * 4, bx + 165, fy - 40 + i * 4); c.stroke(); }
        } else if (id === 'school') {       // #137 coat pegs with small coats and #138 an alphabet frieze
          if (r < 0.5) for (let i = 0; i < 5; i++) { const px = bx - 40 + i * 20; c.fillStyle = grey(110); c.fillRect(px, fy - 62, 2, 4); if ((i + k) % 3) { c.fillStyle = grey(60 + i * 18); c.beginPath(); c.moveTo(px - 5, fy - 58); c.lineTo(px + 7, fy - 58); c.lineTo(px + 9, fy - 38); c.lineTo(px - 7, fy - 38); c.fill(); } }
          else { setFont(c, 9, { fixed: true, serif: true }); c.fillStyle = grey(150); c.textAlign = 'center'; const abc = 'ABCDEFGHIJ'; for (let i = 0; i < 8; i++) { c.fillStyle = grey(i % 2 ? 160 : 120); c.fillRect(bx - 64 + i * 16, fy - 92, 13, 13); c.fillStyle = grey(40); c.fillText(abc[(i + k) % 10], bx - 57.5 + i * 16, fy - 82); } c.textAlign = 'left'; }
        } else if (id === 'apartments') {   // #139 a bathtub hanging over the broken edge and #140 crooked family photos
          if (r < 0.4 && fl.x1 < L.w - 10 && Math.abs(bx - fl.x1) < 330) { const ex = fl.x1 - 6; c.fillStyle = grey(150); c.save(); c.translate(ex, fy - 2); c.rotate(0.35); c.fillRect(-30, -12, 40, 12); c.fillStyle = grey(70); c.fillRect(-28, -10, 36, 3); c.restore(); }
          else for (let i = 0; i < 3; i++) { c.save(); c.translate(bx - 20 + i * 18, fy - 70 + (i % 2) * 6); c.rotate((PH(k, i) - 0.5) * 0.5); c.fillStyle = grey(40); c.fillRect(-6, -7, 12, 14); c.fillStyle = grey(130); c.fillRect(-4, -5, 8, 10); c.restore(); }
        } else if (id === 'hospital') {     // #141 a glowing X-ray box and #142 a parked wheelchair
          if (r < 0.5) { c.fillStyle = grey(200); c.fillRect(bx - 16, fy - 80, 32, 24); c.strokeStyle = grey(110); c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(bx - 10, fy - 76 + i * 5); c.quadraticCurveTo(bx, fy - 73 + i * 5, bx + 10, fy - 76 + i * 5); } c.moveTo(bx, fy - 78); c.lineTo(bx, fy - 58); c.stroke(); }
          else { c.strokeStyle = grey(70); c.lineWidth = 1.5; c.beginPath(); c.arc(bx, fy - 9, 9, 0, TAU); c.moveTo(bx - 8, fy - 22); c.lineTo(bx + 4, fy - 22); c.lineTo(bx + 6, fy - 34); c.moveTo(bx - 8, fy - 22); c.lineTo(bx - 8, fy - 12); c.stroke(); c.fillStyle = grey(70); c.beginPath(); c.arc(bx - 12, fy - 3, 3, 0, TAU); c.fill(); }
        } else if (id === 'church') {       // #143 rows of pews and #144 hanging banners
          if (r < 0.55) for (let i = 0; i < 3; i++) { const px = bx - 60 + i * 44; c.fillStyle = grey(60); c.fillRect(px, fy - 14, 36, 3); c.fillRect(px + 30, fy - 30, 3, 30); c.fillRect(px + 2, fy - 11, 2, 11); }
          else { c.fillStyle = grey(70); c.fillRect(bx - 16, fy - 96, 32, 2); c.fillStyle = grey(100); c.beginPath(); c.moveTo(bx - 12, fy - 94); c.lineTo(bx + 12, fy - 94); c.lineTo(bx + 12 + (calm() ? 0 : Math.sin(t + k) * 1.5), fy - 50); c.lineTo(bx, fy - 58); c.lineTo(bx - 12 + (calm() ? 0 : Math.sin(t + k) * 1.5), fy - 50); c.fill(); c.fillStyle = grey(170); c.fillRect(bx - 1.5, fy - 86, 3, 16); c.fillRect(bx - 6, fy - 81, 12, 3); }
        } else if (id === 'bridge') {       // #145 sandbag walls and #146 the bent railing
          if (r < 0.5) for (let i = 0; i < 9; i++) { const sx = bx - 22 + (i % 4) * 12 + (Math.floor(i / 4) % 2) * 6, sy = fy - 6 - Math.floor(i / 4) * 6; if (Math.floor(i / 4) > 2) continue; c.fillStyle = grey(84 + (i % 3) * 8); c.beginPath(); c.ellipse(sx, sy, 6.5, 3.5, 0, 0, TAU); c.fill(); }
          else { c.strokeStyle = grey(60); c.lineWidth = 2; c.beginPath(); c.moveTo(bx - 60, fy - 26); c.lineTo(bx - 10, fy - 26); c.quadraticCurveTo(bx + 10, fy - 26, bx + 20, fy - 10); c.stroke(); }
        } else if (bg === 'open') {         // #147 bare winter trees on open ground
          c.strokeStyle = grey(30); c.lineWidth = 3; c.beginPath(); c.moveTo(bx, fy); c.lineTo(bx + 2, fy - 60); c.stroke(); c.lineWidth = 1.2; for (let i = 0; i < 5; i++) { const by = fy - 30 - i * 7, d = i % 2 ? 1 : -1; c.beginPath(); c.moveTo(bx + 1, by); c.lineTo(bx + d * (12 + i * 2), by - 14); c.stroke(); }
        }
        }
        if (bg !== 'open' && r > 0.82) {     // #148 spray-painted scrawls on site walls
          c.strokeStyle = grey(30, 0.7); c.lineWidth = 2; c.beginPath(); c.moveTo(bx + 40, fy - 40); for (let i = 0; i < 6; i++) c.lineTo(bx + 46 + i * 7, fy - 40 - (i % 2 ? 10 : 0) + PH(k, i + 9) * 4); c.stroke();
        }
      });
    }
    // #149 cobwebs strung in the upper corners of interior sites
    if (bg !== 'open') { c.strokeStyle = grey(140, 0.22); c.lineWidth = 0.6; for (const fl of F) for (const cx of [fl.x0 + 6, fl.x1 - 6]) { if (cx < x0 - 40 || cx > x1 + 40 || cx < 10 || cx > L.w - 10) continue; const d = cx < (fl.x0 + fl.x1) / 2 ? 1 : -1, cy = fl.y - 96; for (let r = 6; r < 24; r += 6) { c.beginPath(); c.arc(cx, cy, r, d > 0 ? 0 : Math.PI / 2, d > 0 ? Math.PI / 2 : Math.PI); c.stroke(); } } }
  },
  siteFront(c, w, x0, x1) {
    const L = w.L, t = Game.time, dt = Game.rdt || 0.016, run = w.run;
    // #150 rats that dart across the floor now and then
    if (!calm() && rich()) {
      if (this.ratW !== w) { this.ratW = w; this.rats = []; }
      if (this.rats.length < 2 && Math.random() < dt * 0.15) { const f = Math.floor(Math.random() * L.floors.length), fl = L.floors[f], d = Math.random() < 0.5 ? 1 : -1, cx = w.cam.x + (Math.random() - 0.5) * 600; if (cx > fl.x0 + 20 && cx < fl.x1 - 20) this.rats.push({ x: cx, f, d, life: 2.2 }); }
      for (let i = this.rats.length - 1; i >= 0; i--) { const r = this.rats[i]; r.life -= dt; r.x += r.d * 150 * dt; const fl = L.floors[r.f]; if (r.life <= 0 || r.x < fl.x0 || r.x > fl.x1) { this.rats.splice(i, 1); continue; } const y = fl.y; c.fillStyle = grey(40); c.beginPath(); c.ellipse(r.x, y - 2.5, 5, 2.5, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(r.x + r.d * 5, y - 3, 1.8, 0, TAU); c.fill(); c.strokeStyle = grey(40); c.lineWidth = 0.7; c.beginPath(); c.moveTo(r.x - r.d * 5, y - 2); c.quadraticCurveTo(r.x - r.d * 10, y - 6 + Math.sin(t * 30) * 1.5, r.x - r.d * 14, y - 1); c.stroke(); }
    }
    // #151 moths circling the working bulbs
    if (!calm()) for (const li of L.lights) { if (li.on === false || li.x < x0 - 40 || li.x > x1 + 40) continue; const ly = w.floorY(li.f) - 74; for (let i = 0; i < 2; i++) { const a = t * (3 + i) + li.x + i * 2, mx = li.x + Math.cos(a) * (8 + i * 5), my = ly + Math.sin(a * 1.3) * 6; c.fillStyle = grey(200); c.fillRect(mx, my, 1.6, 1.2 + Math.abs(Math.sin(t * 40 + i))); } }
    // #152 drips falling from the metro ceiling and #153 sparks from torn wiring in the broken block
    if (!calm() && (L.id === 'metro' || L.id === 'apartments')) this.each(x0, x1, 410, 90, (k, x) => {
      const fl = L.floors[k % L.floors.length]; if (x < fl.x0 + 20 || x > fl.x1 - 20) return;
      if (L.id === 'metro') { const ph = ((t * 0.6 + PH(k, 41)) % 1), dy = fl.y - 96 + ph * 96; c.fillStyle = grey(170, 0.8); c.fillRect(x, dy, 1.2, 3); }
      else { c.strokeStyle = grey(40); c.lineWidth = 1; c.beginPath(); c.moveTo(x, fl.y - 100); c.lineTo(x + 3, fl.y - 84); c.stroke(); if (Math.sin(t * 2.3 + k * 4) > 0.97 && Math.random() < 0.5) Parts.emit('spark', x + 3, fl.y - 84, 3, {}); }
    });
    // #154 rain puddles on open ground that mirror the lamps
    if (run.weather === 'rain' && L.bg === 'open') this.each(x0, x1, 260, 70, (k, x) => { const fl = L.floors[L.floors.length - 1]; c.fillStyle = grey(70, 0.6); c.beginPath(); c.ellipse(x, fl.y - 0.5, 22 + PH(k, 51) * 14, 2.2, 0, 0, TAU); c.fill(); if (!calm()) { const p = (t * 1.3 + PH(k, 52)) % 1; c.strokeStyle = grey(200, 0.4 * (1 - p)); c.lineWidth = 0.6; c.beginPath(); c.ellipse(x + PH(k, 53) * 10, fl.y - 0.5, 2 + p * 8, 0.5 + p, 0, 0, TAU); c.stroke(); } });
    // #155 pigeons stirring in the church rafters
    if (L.id === 'church' && !calm()) this.each(x0, x1, 520, 260, (k, x) => { const fl = L.floors[0]; if (x > fl.x1 || x < fl.x0) return; const fly = Math.sin(t * 0.4 + k) > 0.92; c.fillStyle = grey(120); if (fly) { const fx = x + ((t * 60) % 120), fy2 = fl.y - 92 - Math.sin(t * 3) * 6; c.beginPath(); c.moveTo(fx - 6, fy2 - Math.sin(t * 20) * 3); c.lineTo(fx, fy2); c.lineTo(fx + 6, fy2 - Math.sin(t * 20) * 3); c.lineTo(fx, fy2 + 2); c.fill(); } else { c.beginPath(); c.ellipse(x, fl.y - 94, 4, 3, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(x + 3.5, fl.y - 96.5, 1.8, 0, TAU); c.fill(); } });
  },

  /* ---------- OBJECTS ---------- */
  obj(c, w, o) {
    const y = w.floorY(o.f), x = o.x, t = Game.time, run = w.run;
    switch (o.type) {
      case 'cont': {
        const e = !o.items.length;
        if (e && !o.spill) o.spill = 1;
        if (o.spill) { c.fillStyle = grey(130, 0.8); c.fillRect(x + 15, y - 2, 5, 2); c.fillRect(x - 22, y - 1.5, 3, 1.5); c.save(); c.translate(x + 24, y - 1); c.rotate(0.4); c.fillRect(-3, -1, 6, 2); c.restore(); }   // #156 whatever you didn't take, left on the floor
        if (o.kind === 'crate') { c.fillStyle = grey(30, 0.7); c.fillRect(x - 6, y - 14, 3, 4); c.fillRect(x - 1, y - 14, 3, 4); c.fillRect(x + 4, y - 14, 3, 4); }   // #157 stencilled crate marks
        if (o.kind === 'locker') { c.fillStyle = grey(200, 0.8); c.fillRect(x - 5, y - 52, 8, 3); }                       // #158 name tags on lockers
        if (o.kind === 'shelf' && !e) { c.fillStyle = grey(210); for (let k2 = 0; k2 < 3; k2++) c.fillRect(x - 10 + k2 * 9, y - 48 + k2 * 17, 3, 2); }   // #159 price tags on shelves
        break; }
      case 'hide':
        if (o.kind === 'wardrobe' && o.occ && !calm()) { const k = Math.max(0, Math.sin(t * 1.6)) * 2; c.fillStyle = grey(10); c.fillRect(x - 1, y - 56, 2 + k, 52); }   // #160 the wardrobe door breathes open a crack
        if (o.kind === 'coats' && o.occ && !calm()) { c.fillStyle = grey(70); c.fillRect(x - 14 + Math.sin(t * 2) * 1.5, y - 14, 26, 2); }                  // #161 hanging coats sway over someone hiding
        break;
      case 'bed': if (o.x === 190) { c.fillStyle = grey(150); c.beginPath(); c.arc(x + 16, y - 21, 3, 0, TAU); c.fill(); c.beginPath(); c.arc(x + 16, y - 26, 2.4, 0, TAU); c.fill(); c.beginPath(); c.arc(x + 14, y - 28, 1, 0, TAU); c.arc(x + 18, y - 28, 1, 0, TAU); c.fill(); } c.fillStyle = grey(110); c.beginPath(); c.arc(x - 24, y - 23, 2, 0, TAU); c.arc(x + 24, y - 17, 2, 0, TAU); c.fill(); break;   // #162 a teddy on the bed and knobbed bedposts
      case 'radio': { const on = o.waveT > 0; c.fillStyle = grey(on ? 240 : 110); c.fillRect(x - 9, y - 37 + 9, 10, 1.5); if (on && !calm()) { c.fillStyle = grey(200); c.beginPath(); c.arc(x + 18, y - 68 + Math.sin(t * 9), 1.6, 0, TAU); c.fill(); } break; }   // #163 the dial lights up while it plays
      case 'musicbox': if (o.playT > 0) { const a = t * 6; c.strokeStyle = grey(220); c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 33); c.lineTo(x, y - 41); c.moveTo(x - Math.cos(a) * 3, y - 38); c.lineTo(x + Math.cos(a) * 3, y - 38); c.stroke(); c.fillStyle = grey(220); c.beginPath(); c.arc(x, y - 43, 1.6, 0, TAU); c.fill(); } break;   // #164 a little dancer turns on the music box
      case 'plant': c.fillStyle = grey(80); c.fillRect(x - 7, y - 31, 14, 2); c.fillStyle = grey(40); c.fillRect(x - 5, y - 30, 10, 1); break;   // #165 a pot rim and dark soil
      case 'stove': { const p = 0.5 + 0.5 * Math.sin(t * 5); c.strokeStyle = grey(180, 0.3 + p * 0.3); c.lineWidth = 1; c.beginPath(); c.ellipse(x + 8, y - 33, 5, 1.2, 0, 0, TAU); c.stroke(); c.fillStyle = grey(110); c.beginPath(); c.arc(x + 10, y - 37, 3.5, Math.PI, 0); c.fill(); c.fillRect(x + 13, y - 39, 4, 1.2); break; }   // #166 a burner ring that pulses and a kettle
      case 'pantry': { const n = Math.min(12, Run.food(run)); c.fillStyle = grey(60); for (let k2 = 0; k2 < 3; k2++) for (let i = 0; i < 4; i++) if (k2 * 4 + i < n) c.fillRect(x - 13 + i * 7, y - 45 + k2 * 19, 5, 1.5); break; }   // #167 labels on the tins
      case 'workbench': c.fillStyle = grey(60); c.fillRect(x + 14, y - 30, 6, 6); c.fillRect(x + 16, y - 33, 2, 3); c.fillStyle = grey(170, 0.8); for (let i = 0; i < 5; i++) c.fillRect(x - 18 + i * 9 + PH(i, 61) * 4, y - 1, 2.5, 1); break;   // #168 a vice and wood shavings
      case 'heater': if (run.heaterOn) { c.fillStyle = grey(255); c.beginPath(); c.arc(x - 5, y - 6, 1.2, 0, TAU); c.fill(); } break;   // #169 a pilot light
      case 'fridge': c.fillStyle = grey(220, 0.6); c.fillRect(x - 11, y - 57, 22, 1); c.fillStyle = grey(240); c.fillRect(x + 7.4, y - 51, 0.8, 7); break;   // #170 a shine on the fridge door
      case 'safe': c.fillStyle = grey(210); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; c.fillRect(x + Math.cos(a) * 8 - 0.5, y - 14 + Math.sin(a) * 8 - 0.5, 1, 1); } break;   // #171 numbers round the safe dial
      case 'drawer': c.fillStyle = grey(190); for (let k2 = 0; k2 < 3; k2++) { c.beginPath(); c.arc(x - 8, y - 27 + k2 * 10, 1.2, 0, TAU); c.arc(x + 8, y - 27 + k2 * 10, 1.2, 0, TAU); c.fill(); } break;   // #172 brass drawer knobs
      case 'painting': c.fillStyle = grey(170); for (const [dx, dy] of [[-13, -72], [11, -72], [-13, -42], [11, -42]]) c.fillRect(x + dx, y + dy, 2, 2); break;   // #173 gilt corners on the frame
      case 'candle': c.fillStyle = grey(140); c.beginPath(); c.ellipse(x, y - 22.5, 9, 1.8, 0, 0, TAU); c.fill(); c.fillStyle = grey(40); c.fillRect(x + 6, y - 24, 4, 0.8); c.fillRect(x + 8, y - 25, 0.8, 1.8); break;   // #174 a candle dish and a spent match
      case 'barrel': if (!calm() && Run.count(run, 'dirty') > 0) { c.fillStyle = grey(230, 0.5 + 0.3 * Math.sin(t * 3)); c.fillRect(x - 6 + Math.sin(t) * 3, y - 28, 4, 1); } break;   // #175 light moving on the water in the barrel
      case 'raincatcher': if (run.weather === 'rain' && !calm()) { const p = (t * 2) % 1; c.strokeStyle = grey(220, 0.6 * (1 - p)); c.lineWidth = 0.7; c.beginPath(); c.ellipse(x + (PH(Math.floor(t * 2), 7) - 0.5) * 20, y - 26, 2 + p * 6, 0.6 + p, 0, 0, TAU); c.stroke(); } break;   // #176 raindrops ringing in the rain catcher
      case 'coop': c.fillStyle = grey(150); for (let i = 0; i < 5; i++) c.fillRect(x - 5 + i * 2, y - 9 - (i % 2), 4, 0.8); break;   // #177 straw at the coop door
      case 'firebarrel': if (run.barrelLit || o.lit) { c.fillStyle = grey(200, 0.25 + 0.1 * Math.sin(t * 7)); c.fillRect(x - 11, y - 26, 22, 10); } break;   // #178 the barrel's skin glows with heat
      case 'exit': if (!calm()) { const p = (t % 1.4) / 1.4; c.strokeStyle = grey(210, 1 - p); c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 6 - p * 8, y - 50); c.lineTo(x - 1 - p * 8, y - 55); c.moveTo(x - 6 - p * 8, y - 50); c.lineTo(x - 1 - p * 8, y - 45); c.stroke(); } break;   // #179 the way-out arrow pulses toward the street
      case 'signal': if (o.done === 'signal' && !calm()) { c.strokeStyle = grey(240, 0.35); c.lineWidth = 1; for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + t * 0.6; c.beginPath(); c.moveTo(x + Math.cos(a) * 14, y - 53 + Math.sin(a) * 14); c.lineTo(x + Math.cos(a) * 26, y - 53 + Math.sin(a) * 26); c.stroke(); } } break;   // #180 rays from the lit signal
      case 'squeak': c.strokeStyle = grey(40); c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - 4, y + 0.5); c.lineTo(x, y + 1.5); c.lineTo(x + 3, y + 0.5); c.stroke(); break;   // #181 a split in the squeaky board
      case 'brick': c.fillStyle = grey(150, 0.6); c.fillRect(x - 7, y - 0.5, 3, 0.5); c.fillRect(x + 5, y - 0.5, 2, 0.5); c.strokeStyle = grey(60); c.lineWidth = 0.6; c.beginPath(); c.moveTo(x - 2, y - 5); c.lineTo(x, y - 2); c.stroke(); break;   // #182 crumbs of mortar round loose bricks
      default: break;
    }
  },

  /* ---------- CHARACTERS ---------- */
  npc(ctx, n, x, y) {
    // #183 a hand lamp glowing in a patrol's fist at night
    const sc = Game.scene, w = sc && sc.w;
    if (n.type === 'patrol' && w && w.night && n.st !== 'stun') { const hx = x + n.face * 13, hy = y - 30; ctx.fillStyle = grey(200); ctx.fillRect(hx - 2, hy - 2, 4, 5); const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 14); g.addColorStop(0, grey(255, 0.35)); g.addColorStop(1, grey(255, 0)); ctx.fillStyle = g; ctx.fillRect(hx - 14, hy - 14, 28, 28); }
    // #184 a dog that sits and wags when idle
    if (n.type === 'dog' && Math.abs(n.vx) < 3 && !calm() && n.st !== 'chase') { ctx.strokeStyle = grey(58); ctx.lineWidth = 2.2; const tx = x - n.face * 12, a = Math.sin(Game.time * 12) * 4; ctx.beginPath(); ctx.moveTo(tx, y - 16); ctx.lineTo(tx - n.face * 5 + a, y - 22); ctx.stroke(); }
    // #185 dust kicked up by running NPCs
    if (Math.abs(n.vx) > 90 && !calm() && Math.random() < 0.1 * Render.rk()) Parts.emit('dust', x - n.face * 4, y - 2, 1, { sx: 4 });
  },
  survivor(ctx, s, x, y, o) {
    if (o.mono || !('pack' in o)) return;                          // only survivors walking the world, not portraits or menus
    // #186 speed lines streaming off a sprinting survivor
    if (s.sprint && Math.abs(s.vx) > 100 && !calm()) { ctx.strokeStyle = grey(255, 0.35); ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { const ly = y - 14 - i * 11 - (s.jz || 0), lx = x - s.face * (16 + i * 4); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx - s.face * (14 + (Game.time * 60 + i * 7) % 10), ly); ctx.stroke(); } }
    // #187 a little heart lifts off when someone is comforted
    if (s.comfortT > 1.4 && !calm() && Math.random() < 0.15 * Render.rk()) Floaters.add('♥', x + FX.r(-6, 6), y - 60, { life: 1.1, size: 11, col: hsl(s.hueC(), 1, 10) });
    // #188 the ground shadow shrinks and fades while airborne
    if (s.jz > 2) { const k = clamp(s.jz / 40, 0, 1); ctx.fillStyle = 'rgba(0,0,0,' + (0.25 * (1 - k)) + ')'; ctx.beginPath(); ctx.ellipse(x, y + 1, 11 * (1 - k * 0.5), 2.4, 0, 0, TAU); ctx.fill(); }
  },

  /* ---------- LIGHT AND ATMOSPHERE ---------- */
  glows(ctx, w, X, Y) {
    if (!rich()) return;
    const L = w.L, t = Game.time, z = w.cam.zoom, run = w.run;
    ctx.save();
    if (L.home && !w.night) {
      // #189 dust motes turning in the daylight from the windows
      for (let i = 0; i < 26; i++) { const f = 1 + (i % 2), fy = CFG.home.floorsY[f], px = 90 + (PH(i, 71) * 150 + t * (4 + PH(i, 72) * 6)) % 150, py = fy - 66 + (PH(i, 73) * 60 + Math.sin(t * 0.7 + i) * 4); ctx.fillStyle = grey(255, 0.25 + 0.2 * Math.sin(t * 2 + i)); ctx.fillRect(X(px), Y(py), 1.4, 1.4); }
    }
    if (L.home && w.night && !(run.weather === 'rain' || run.weather === 'fog')) {
      // #190 moonlight falling through the side windows onto the floor
      for (const f of [1, 2]) { const fy = CFG.home.floorsY[f]; ctx.fillStyle = grey(200, 0.06); ctx.beginPath(); ctx.moveTo(X(78), Y(fy - 70)); ctx.lineTo(X(78), Y(fy - 30)); ctx.lineTo(X(190), Y(fy)); ctx.lineTo(X(240), Y(fy)); ctx.fill(); }
    }
    if (L.site && w.night && L.bg !== 'tunnel') {
      // #191 cold moonlight slanting in through the site windows
      for (let k = Math.floor((w.cam.x - 700) / 480); k < (w.cam.x + 700) / 480; k++) { if (k < 0) continue; const fl = L.floors[k % L.floors.length], wx = k * 480 + 77; if (wx < fl.x0 || wx > fl.x1) continue; const g = ctx.createLinearGradient(X(wx), Y(fl.y - 60), X(wx + 70), Y(fl.y)); g.addColorStop(0, grey(220, 0.08)); g.addColorStop(1, grey(220, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X(wx - 17), Y(fl.y - 76)); ctx.lineTo(X(wx + 17), Y(fl.y - 76)); ctx.lineTo(X(wx + 90), Y(fl.y)); ctx.lineTo(X(wx + 40), Y(fl.y)); ctx.fill(); }
    }
    if (L.site && w.night && L.bg === 'open') {
      // #192 low ground fog creeping over open ground
      for (let i = 0; i < 5; i++) { const fx = ((t * (8 + i * 3) + i * 260) % (W + 400)) - 200, fy = Y(L.floors[L.floors.length - 1].y) - 4, g = ctx.createRadialGradient(fx, fy, 4, fx, fy, 160); g.addColorStop(0, grey(200, 0.09)); g.addColorStop(1, grey(200, 0)); ctx.save(); ctx.translate(fx, fy); ctx.scale(1, 0.22); ctx.translate(-fx, -fy); ctx.fillStyle = g; ctx.fillRect(fx - 160, fy - 160, 320, 320); ctx.restore(); }
    }
    // #193 a soft halo on every hostile's alert glyph
    for (const n of w.npcs) { if (!n.T.hostile || !(n.st === 'chase' || n.st === 'hostile')) continue; const g = ctx.createRadialGradient(X(n.x), Y(w.entY(n) - 64), 0, X(n.x), Y(w.entY(n) - 64), 22 * z); g.addColorStop(0, grey(255, 0.3)); g.addColorStop(1, grey(255, 0)); ctx.fillStyle = g; ctx.fillRect(X(n.x) - 22 * z, Y(w.entY(n) - 64) - 22 * z, 44 * z, 44 * z); }
    ctx.restore();
  },
  post(ctx) {
    const run = Game.run, sc = Game.scene, w = sc && sc.w, s = Save.s, dt = Game.rdt || 0.016;
    // #194 frost creeping in at the screen corners when it freezes
    const want = run && w && num(run.temp, 5) <= 0 ? clamp(-num(run.temp, 0) / 10, 0.3, 1) : 0; this.frost += (want - this.frost) * Math.min(1, dt * 0.8);
    if (this.frost > 0.02 && !s.lowfx) { for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H]]) { const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 170 * this.frost + 40); g.addColorStop(0, 'rgba(230,236,240,' + (0.28 * this.frost) + ')'); g.addColorStop(1, 'rgba(230,236,240,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 220, cy - 220, 440, 440); }
      ctx.strokeStyle = 'rgba(240,244,248,' + (0.25 * this.frost) + ')'; ctx.lineWidth = 0.8; for (let i = 0; i < 10; i++) { const cx = i % 2 ? W : 0, cy = i % 4 < 2 ? 0 : H, a = PH(i, 81) * Math.PI / 2, l = (30 + PH(i, 82) * 50) * this.frost, sx = cx ? -1 : 1, sy = cy ? -1 : 1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + sx * Math.cos(a) * l, cy + sy * Math.sin(a) * l); ctx.stroke(); } }
    // #195 a heartbeat pulse at the edges when a chase is on
    if (w && w.L.site && num(w.tension) > 0.6 && !s.reduce) { const p = Math.max(0, Math.sin(Game.time * 7.5)) ** 6 * (w.tension - 0.6) * 2.2; if (p > 0.01) { ctx.globalAlpha = clamp(p, 0, 0.6); ctx.drawImage(Render.vig, -W * 0.1, -H * 0.1, W * 1.2, H * 1.2); ctx.globalAlpha = 1; } }
    // #196 big soft snowflakes drifting past close to the lens
    if (run && (run.weather === 'snow' || run.weather === 'coldsnap') && w && !s.lowfx && !s.reduce) for (let i = 0; i < 7; i++) { const k = ((Game.time * (0.05 + PH(i, 91) * 0.04) + PH(i, 92)) % 1), fx = (PH(i, 93) * W + Math.sin(Game.time * 0.6 + i) * 40 - k * 60 + W) % W, fy = -20 + k * (H + 40); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(fx, fy, 3 + PH(i, 94) * 4, 0, TAU); ctx.fill(); }
  },
  /* the building from outside */
  roof(ctx, t, bx, by, bw, bh, night) {
    // #197 a rooftop washing line and pigeons on the parapet of the title building
    ctx.strokeStyle = grey(night ? 24 : 44); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(bx + 220, by - 8); ctx.quadraticCurveTo(bx + 250, by - 2, bx + 280, by - 14); ctx.stroke(); for (let i = 0; i < 3; i++) { ctx.fillStyle = grey(night ? 60 + i * 20 : 120 + i * 30); ctx.fillRect(bx + 228 + i * 16, by - 6 + (i === 2 ? -4 : 0), 7, 9); }
    for (let i = 0; i < 4; i++) { const px = bx + 20 + i * 70 + (i > 2 ? -40 : 0), hop = calm() ? 0 : Math.max(0, Math.sin(t * 2 + i * 2)) ** 10 * 4; ctx.fillStyle = grey(night ? 40 : 70); ctx.beginPath(); ctx.ellipse(px, by - 12 - hop, 4, 2.8, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(px + 3.5, by - 14.5 - hop, 1.8, 0, TAU); ctx.fill(); }
    // #198 a lamp post outside the building that flickers
    const lx = bx + bw + 40, on = calm() || Math.sin(t * 13) < 0.9; ctx.fillStyle = grey(night ? 26 : 50); ctx.fillRect(lx, by + bh - 150, 4, 150); ctx.fillRect(lx - 10, by + bh - 152, 24, 4); ctx.fillStyle = grey(night && on ? 230 : 110); ctx.fillRect(lx - 8, by + bh - 148, 8, 6);
    if (night && on) { const g = ctx.createRadialGradient(lx - 4, by + bh - 140, 0, lx - 4, by + bh - 140, 90); g.addColorStop(0, grey(220, 0.22)); g.addColorStop(1, grey(220, 0)); ctx.fillStyle = g; ctx.fillRect(lx - 94, by + bh - 230, 180, 180); }
  },
  window(ctx, t, wx, wy, k, night) {
    // #199 shadows of a hand-drawn star taped in some windows, #200 potted plants on lit sills
    if (k % 3 === 0) { ctx.fillStyle = grey(night ? 120 : 160, 0.6); ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.4 : 5.5; ctx.lineTo(wx + 34 + Math.cos(a) * r, wy + 10 + Math.sin(a) * r); } ctx.fill(); }
    if (k % 2 === 1) { ctx.fillStyle = grey(night ? 50 : 80); ctx.fillRect(wx + 4, wy + 34, 7, 6); ctx.strokeStyle = grey(night ? 50 : 80); ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(wx + 7.5, wy + 34); ctx.lineTo(wx + 4 + i * 3.5, wy + 28 - (i % 2) * 2); ctx.stroke(); } }
  }
};

/* --- wire the 1.1 layer onto the existing hooks --- */
(function () {
  const wrap = (obj, key, after, before) => { const f = obj[key]; obj[key] = function () { if (before) before.apply(V11, arguments); const r = f.apply(this, arguments); if (after) after.apply(V11, arguments); return r; }; };
  wrap(Polish, 'sky', function (c, camX, night, t) { this.skyBack(c, camX, night, t); });
  wrap(Polish, 'skyFront', null, function (c, camX, night, t) { this.skyMid(c, camX, night, t); });
  wrap(Polish, 'roof', function (c, b, x, top, night, col, idx) { this.roofMore(c, b, x, top, night, col, idx); });
  wrap(Polish, 'homeWalls', function (c, w) { this.homeWalls(c, w); });
  wrap(Polish, 'homeFront', function (c, w) { this.homeFront(c, w); });
  wrap(Polish, 'siteBack', function (c, w, x0, x1) { this.siteBack(c, w, x0, x1); });
  wrap(Polish, 'siteFront', function (c, w, x0, x1) { this.siteFront(c, w, x0, x1); });
  wrap(Polish, 'obj', function (c, w, o) { this.obj(c, w, o); });
  wrap(Polish, 'glows', function (ctx, w, X, Y) { this.glows(ctx, w, X, Y); });
  wrap(Polish, 'post', function (ctx) { this.post(ctx); });
  wrap(Polish, 'buildingRoof', function (ctx, t, bx, by, bw, bh, night) { this.roof(ctx, t, bx, by, bw, bh, night); });
  wrap(Polish, 'litWindow', function (ctx, t, wx, wy, k, night) { this.window(ctx, t, wx, wy, k, night); });
  wrap(Render, 'ladder', function (c, w, l) { this.ladder(c, w, l); });
  wrap(Render, 'blocker', function (c, w, b) { this.blocker(c, w, b); });
  wrap(Rig, 'drawNPC', function (ctx, n, x, y) { this.npc(ctx, n, x, y); });
  wrap(Rig, 'draw', function (ctx, s, x, y, o) { this.survivor(ctx, s, x, y, o || {}); });
})();
