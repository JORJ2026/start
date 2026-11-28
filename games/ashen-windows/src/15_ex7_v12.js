/* ==========================================================================
   SECTION 27: RELEASE 1.2 - story, atmosphere, sound and taller buildings
   - Illustrated cutscene panels (CUT_ART) and the Field Guide: who you are
     hiding from.
   - Weather over the maps: layered rain and snow, passing showers, lightning.
   - Fog banks that roll in at times (and hide you), and ambient smoke.
   - Unsettling shadows: scenery only. They never touch the game state.
   - Sound: room reverb per location, richer effects, distant ambience.
   - Gameplay: 3 to 4 floors per site, holes you can drop through, patrols
     that change floors, richer upper floors, a floor plan on the HUD.
   Same rules as before: greys in the world layer, colour only for people,
   motion eased under Reduce motion, heavy effects off on Low quality.
   ========================================================================== */

/* ---------- small drawing helpers ---------- */
/* A tall, too-thin figure. Used for the shadows only. */
function shadowFig(c, x, y, h, a, t, o) {
  o = o || {}; const sw = o.still ? 0 : Math.sin(t * 1.3) * h * 0.012, tilt = o.tilt || 0;
  c.save(); c.translate(x, y); c.fillStyle = grey(o.g == null ? 4 : o.g, a);
  c.beginPath();
  c.moveTo(-h * 0.03, 0); c.lineTo(-h * 0.05, -h * 0.3); c.lineTo(-h * 0.15 + sw, -h * 0.34); c.lineTo(-h * 0.1 + sw, -h * 0.8); c.lineTo(-h * 0.05, -h * 0.84);
  c.lineTo(h * 0.05, -h * 0.84); c.lineTo(h * 0.1 + sw, -h * 0.8); c.lineTo(h * 0.15 + sw, -h * 0.34); c.lineTo(h * 0.05, -h * 0.3); c.lineTo(h * 0.03, 0); c.lineTo(h * 0.01, -h * 0.28); c.lineTo(-h * 0.01, -h * 0.28); c.closePath(); c.fill();
  // long arms that hang past the knees
  c.strokeStyle = grey(o.g == null ? 4 : o.g, a); c.lineWidth = h * 0.025; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-h * 0.09, -h * 0.78); c.quadraticCurveTo(-h * 0.17, -h * 0.5, -h * 0.15 + sw * 2, -h * 0.2); c.moveTo(h * 0.09, -h * 0.78); c.quadraticCurveTo(h * 0.17, -h * 0.5, h * 0.15 + sw * 2, -h * 0.2); c.stroke();
  c.save(); c.translate(0, -h * 0.9); c.rotate(tilt); c.beginPath(); c.ellipse(0, 0, h * 0.045, h * 0.065, 0, 0, TAU); c.fill(); c.restore();
  c.restore();
}
/* Soft puffs along a bending column: smoke that rises, then spreads under a ceiling (or into the sky). */
function smokeColumn(c, x, y, t, o) {
  o = o || {}; const n = o.n || 12, top = o.top == null ? -9999 : o.top, sc = o.sc || 1, wind = o.wind == null ? 1 : o.wind, rise = o.rise || 220;
  for (let j = 0; j < n; j++) {
    const a = (((t * (o.rate || 0.1) + j / n) % 1) + 1) % 1, up = a * rise * sc;
    let py = y - up, px = x + wind * a * a * 120 * sc + Math.sin(t * 0.7 + j * 1.7) * 5 * a * sc;
    if (py < top) { const over = top - py; py = top + Math.sin(j + t) * 3; px += wind * over * 0.9 + (j % 2 ? 1 : -1) * over * 0.4; }
    const r = (5 + a * 34) * sc, al = (o.al || 0.16) * (1 - a) * Math.min(1, a * 6);
    c.fillStyle = grey(o.g || 150, al); c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
  }
}

/* ---------- cutscene art: every panel is drawn in code, in panel space (-334..334, -154..76) ---------- */
const CUT_ART = {
  sky(c, top, bot) { const g = c.createLinearGradient(0, -154, 0, 60); g.addColorStop(0, grey(top)); g.addColorStop(1, grey(bot)); c.fillStyle = g; c.fillRect(-380, -170, 780, 260); },
  flakes(c, t, n, al) { if (Save.s.reduce) t *= 0.3; c.fillStyle = grey(230, al || 0.7); for (let k = 0; k < n; k++) { const y = ((PH(k, 31) * 240 + t * (14 + PH(k, 32) * 20)) % 240) - 160, x = PH(k, 33) * 720 - 360 + Math.sin(t * 0.8 + k) * 8; const r = 0.8 + PH(k, 34) * 1.6; c.fillRect(x, y, r, r); } },
  city(c, t) {
    this.sky(c, 40, 92);
    const fl = Math.max(0, Math.sin(t * 1.3) + Math.sin(t * 2.9 + 1) - 1.3);
    if (fl > 0 && !Save.s.reduce) { const g = c.createRadialGradient(-60, 30, 0, -60, 30, 220); g.addColorStop(0, grey(230, 0.35 * fl)); g.addColorStop(1, grey(230, 0)); c.fillStyle = g; c.fillRect(-300, -190, 480, 260); }
    for (let k = 0; k < 2; k++) { const ang = Math.sin(t * 0.35 + k * 2) * 0.5, bx = k ? 190 : -230; c.save(); c.translate(bx, 40); c.rotate(ang); c.fillStyle = grey(210, 0.07); c.beginPath(); c.moveTo(-3, 0); c.lineTo(-40, -300); c.lineTo(40, -300); c.lineTo(3, 0); c.fill(); c.restore(); }
    smokeColumn(c, -120, 0, t, { rise: 200, al: 0.22, g: 90, wind: 0.8 }); smokeColumn(c, 170, 10, t + 3, { rise: 180, al: 0.2, g: 80, wind: 1.1 });
    for (let L = 0; L < 2; L++) for (let k = 0; k < 16; k++) {
      const bw = 50, x = -380 + k * bw - (L ? t * 3 : t * 1.4) % bw, h = 40 + PH(k, 11 + L) * (L ? 70 : 110), by = L ? 52 : 40;
      c.fillStyle = grey(L ? 24 : 54); c.fillRect(x, by - h, bw - 3, h + 40);
      if (PH(k, 15 + L) < 0.5) { c.beginPath(); c.moveTo(x, by - h); c.lineTo(x + bw * 0.3, by - h - 10); c.lineTo(x + bw * 0.5, by - h + 4); c.lineTo(x + bw * 0.8, by - h - 6); c.lineTo(x + bw - 3, by - h); c.fill(); }
      if (L && PH(k, 19) < 0.25) { c.fillStyle = grey(170 + Math.sin(t * 3 + k) * 20); c.fillRect(x + 14, by - h + 18, 6, 7); }
    }
    if (fl > 0 && !Save.s.reduce) { c.fillStyle = grey(220, 0.5 * fl); c.fillRect(-90, 26, 50, 4); }
  },
  river(c, t) {
    this.sky(c, 12, 36);
    const g = c.createRadialGradient(200, -100, 10, 200, -100, 90); g.addColorStop(0, grey(220, 0.25)); g.addColorStop(1, grey(200, 0)); c.fillStyle = g; c.fillRect(100, -200, 200, 200); c.fillStyle = grey(210); c.beginPath(); c.arc(200, -100, 14, 0, TAU); c.fill();
    for (let k = 0; k < 18; k++) { const x = -380 + k * 44, h = 16 + PH(k, 41) * 40; c.fillStyle = grey(28); c.fillRect(x, -30 - h, 42, h); }
    for (let k = 0; k < 4; k++) { const on = Math.sin(t * 1.7 + k * 2.1) > 0.93; if (!on) continue; const gx = -250 + k * 170 + PH(k, 42) * 40, gy = -36 - PH(k, 43) * 20; const gg = c.createRadialGradient(gx, gy, 0, gx, gy, 14); gg.addColorStop(0, grey(255, 0.8)); gg.addColorStop(1, grey(255, 0)); c.fillStyle = gg; c.fillRect(gx - 14, gy - 14, 28, 28); c.strokeStyle = grey(255, 0.9); c.lineWidth = 1; c.beginPath(); c.moveTo(gx - 6, gy); c.lineTo(gx + 6, gy); c.moveTo(gx, gy - 6); c.lineTo(gx, gy + 6); c.stroke(); }
    c.fillStyle = grey(20); c.fillRect(-380, -30, 780, 120);
    c.strokeStyle = grey(80, 0.5); c.lineWidth = 1; for (let k = 0; k < 26; k++) { const y = -24 + (k % 9) * 11, x = ((k * 83 + t * 12) % 760) - 380; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 20 + (k % 3) * 10, y); c.stroke(); }
    c.fillStyle = grey(190, 0.35); for (let k = 0; k < 8; k++) c.fillRect(200 - 8 + Math.sin(t * 2 + k) * 4, -22 + k * 11, 16 - k, 1.5);
    c.fillStyle = grey(44); c.fillRect(-380, -12, 410, 10); c.fillStyle = grey(34); for (let x = -360; x < 20; x += 120) { c.beginPath(); c.arc(x + 60, 76, 60, Math.PI, 0); c.lineTo(x + 120, -2); c.lineTo(x, -2); c.fill(); }
    c.fillStyle = grey(44); c.beginPath(); c.moveTo(30, -12); c.lineTo(46, -8); c.lineTo(36, -2); c.lineTo(52, 4); c.lineTo(30, -2); c.fill();
    c.strokeStyle = grey(60); c.lineWidth = 1.2; c.beginPath(); for (let k = 0; k < 4; k++) { c.moveTo(20 + k * 6, -2); c.lineTo(24 + k * 7 + Math.sin(t + k) * 1.5, 18 + k * 5); } c.stroke();
    c.strokeStyle = grey(56); c.beginPath(); for (let x = -380; x < 30; x += 14) { c.moveTo(x, -12); c.lineTo(x, -24); } c.moveTo(-380, -24); c.lineTo(28, -24); c.stroke();
  },
  coats(c, t) {
    c.fillStyle = grey(40); c.fillRect(-380, -170, 780, 220); c.fillStyle = grey(46); for (let y = -160; y < 40; y += 14) for (let x = -380 + ((y / 14) % 2) * 20; x < 400; x += 40) c.fillRect(x, y, 38, 12);
    c.save(); c.translate(-210, -60); c.rotate(-0.04); c.fillStyle = grey(160); c.fillRect(-34, -46, 68, 90); c.fillStyle = grey(30); c.fillRect(-30, -40, 60, 14); txt(c, 'CURFEW', 0, -29, 9, G.bone, 'center', { outline: false, fixed: true }); c.fillStyle = grey(70); for (let k = 0; k < 6; k++) c.fillRect(-26, -18 + k * 9, 30 + PH(k, 51) * 22, 3); c.restore();
    c.fillStyle = grey(28); c.fillRect(-380, 40, 780, 50); c.fillStyle = grey(70); c.fillRect(-380, 40, 780, 2);
    const lx = 70; c.fillStyle = grey(22); c.fillRect(lx - 3, -130, 6, 170); c.fillRect(lx - 3, -130, 30, 5); c.fillStyle = grey(210); c.fillRect(lx + 20, -126, 10, 8);
    const cone = c.createLinearGradient(0, -120, 0, 40); cone.addColorStop(0, grey(230, 0.2)); cone.addColorStop(1, grey(230, 0.05)); c.fillStyle = cone; c.beginPath(); c.moveTo(lx + 20, -118); c.lineTo(lx + 30, -118); c.lineTo(lx + 100, 40); c.lineTo(lx - 50, 40); c.fill();
    c.fillStyle = grey(200, 0.12); c.beginPath(); c.ellipse(lx + 25, 42, 80, 8, 0, 0, TAU); c.fill();
    for (let i = 0; i < 3; i++) {
      const x = ((t * 26 + i * 120) % 900) - 450, n = { type: 'patrol', T: NPCT.patrol, face: 1, vx: 40, ph: t * 5 + i * 2, st: 'patrol', aw: 0, x: i * 50 };
      const away = x - (lx + 25); c.fillStyle = grey(0, 0.35); c.beginPath(); c.moveTo(x - 8, 41); c.lineTo(x + 8, 41); c.lineTo(x + 8 + away * 0.9, 46); c.lineTo(x - 8 + away * 0.9, 46); c.fill();
      c.save(); c.translate(x, 40); c.scale(1.7, 1.7); Rig.drawNPC(c, n, 0, 0, 1); c.restore();
      const hx = x + 22, hy = -12, lg = c.createRadialGradient(hx, hy, 0, hx, hy, 40); lg.addColorStop(0, grey(235, 0.35)); lg.addColorStop(1, grey(235, 0)); c.fillStyle = lg; c.fillRect(hx - 40, hy - 40, 80, 80);
    }
  },
  list(c, t) {
    for (let x = -380; x < 400; x += 26) { c.fillStyle = grey((x / 26) % 2 ? 40 : 46); c.fillRect(x, -170, 25, 260); }
    const fl = Save.s.reduce ? 0 : Math.sin(t * 7) * 0.04 + Math.sin(t * 13) * 0.03;
    c.save(); c.translate(0, -40); c.rotate(-0.025);
    c.fillStyle = grey(0, 0.3); c.fillRect(-92, -96, 190, 196); c.fillStyle = grey(196); c.fillRect(-96, -100, 190, 196);
    txt(c, 'BY ORDER OF THE CIVIC WATCH', -1, -84, 7.5, G.ink, 'center', { outline: false, fixed: true }); txt(c, 'CURFEW AND REGISTER', -1, -70, 11, G.ink, 'center', { outline: false, fixed: true, serif: true });
    c.fillStyle = grey(70); for (let k = 0; k < 12; k++) { const w = 60 + PH(k, 61) * 80; c.fillRect(-80, -54 + k * 11, w, 2.5); if (k === 7) { c.fillStyle = grey(20); c.fillRect(-84, -54 + k * 11 + 0.5, w + 10, 1.5); c.fillStyle = grey(70); } }
    c.strokeStyle = grey(90, 0.7); c.lineWidth = 2; c.beginPath(); c.arc(56, 70, 16, 0, TAU); c.stroke(); txt(c, 'W', 56, 75, 12, grey(90, 0.7), 'center', { outline: false, fixed: true });
    const cf = Save.s.reduce ? 0 : Math.sin(t * 3) * 6; c.fillStyle = grey(170); c.beginPath(); c.moveTo(94, 96); c.lineTo(94 - 18, 96); c.lineTo(94, 96 - 18 - cf); c.fill();
    c.fillStyle = grey(30); c.beginPath(); c.arc(-86, -90, 3, 0, TAU); c.arc(84, -90, 3, 0, TAU); c.fill();
    c.restore();
    const g = c.createRadialGradient(0, -20, 60, 0, -20, 360); g.addColorStop(0, grey(0, 0)); g.addColorStop(1, grey(0, 0.6 + fl)); c.fillStyle = g; c.fillRect(-380, -170, 780, 260);
  },
  magpies(c, t) {
    c.fillStyle = grey(30); c.fillRect(-380, -170, 780, 260);
    c.fillStyle = grey(44); c.beginPath(); c.moveTo(-380, -170); c.lineTo(-120, -110); c.lineTo(-120, 40); c.lineTo(-380, 90); c.fill(); c.beginPath(); c.moveTo(400, -170); c.lineTo(140, -110); c.lineTo(140, 40); c.lineTo(400, 90); c.fill();
    c.fillStyle = grey(22); c.fillRect(-120, -110, 260, 150);
    c.save(); c.translate(-250, -60); c.rotate(0.1); c.fillStyle = grey(200, 0.8); c.beginPath(); c.ellipse(0, 0, 22, 12, 0, 0, TAU); c.fill(); c.fillStyle = grey(15); c.beginPath(); c.arc(-18, -8, 9, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-26, -8); c.lineTo(-36, -6); c.lineTo(-26, -4); c.fill(); c.beginPath(); c.moveTo(16, -4); c.lineTo(60, -14); c.lineTo(60, -4); c.lineTo(16, 6); c.fill(); c.fillStyle = grey(15); c.beginPath(); c.moveTo(-4, -6); c.lineTo(16, -18); c.lineTo(10, 2); c.fill(); c.restore();
    c.fillStyle = grey(26); c.beginPath(); c.moveTo(-380, 90); c.lineTo(-120, 40); c.lineTo(140, 40); c.lineTo(400, 90); c.fill();
    for (let i = 0; i < 2; i++) { const x = -40 + i * 90, n = { type: 'scav', T: NPCT.scav, face: i ? -1 : 1, vx: 0, ph: 0, st: 'patrol', aw: 0, x }; c.save(); c.translate(x, 46); c.scale(1.5, 1.5 - (Save.s.reduce ? 0 : Math.abs(Math.sin(t * 2 + i)) * 0.06)); Rig.drawNPC(c, n, 0, 0, 1); c.restore(); c.fillStyle = grey(60); c.beginPath(); c.ellipse(x + (i ? -26 : 26), 40, 14, 10, 0, 0, TAU); c.fill(); }
    if (Math.sin(t * 2.3) > 0.9) { c.fillStyle = grey(255, 0.9); c.fillRect(30, 18, 2, 2); }
    c.strokeStyle = grey(160, 0.25); c.lineWidth = 1; c.beginPath(); for (let k = 0; k < 30; k++) { const x = PH(k, 71) * 760 - 380, y = ((PH(k, 72) * 260 + t * 240) % 260) - 170; c.moveTo(x, y); c.lineTo(x - 3, y + 12); } c.stroke();
  },
  building(c, t) {
    this.sky(c, 16, 40);
    c.fillStyle = grey(38); c.fillRect(-150, -150, 300, 230); c.fillStyle = grey(26); c.fillRect(-158, -156, 316, 8);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) {
      const x = -130 + k * 70, y = -126 + r * 70, lit = r === 1 && k === 2;
      c.fillStyle = grey(52); c.fillRect(x - 4, y + 44, 52, 4);
      if (lit) { const f = Save.s.reduce ? 0 : Math.sin(t * 9) * 0.05 + Math.sin(t * 4.3) * 0.05; c.fillStyle = 'hsla(38,85%,' + (44 + f * 40) + '%,0.95)'; c.fillRect(x, y, 44, 40); const g = c.createRadialGradient(x + 22, y + 22, 2, x + 22, y + 22, 90); g.addColorStop(0, 'hsla(40,90%,60%,0.25)'); g.addColorStop(1, 'hsla(40,90%,60%,0)'); c.fillStyle = g; c.fillRect(x - 70, y - 70, 184, 180); c.fillStyle = grey(30); c.fillRect(x + 21, y, 2, 40); }
      else { c.fillStyle = grey(10); c.fillRect(x, y, 44, 40); }
    }
    c.fillStyle = grey(14); c.fillRect(-380, 60, 780, 30);
    this.flakes(c, t, 60, 0.7);
  },
  candle(c, t) {
    c.fillStyle = grey(8); c.fillRect(-380, -170, 780, 260);
    const f = Save.s.reduce ? 0 : Math.sin(t * 11) * 0.06 + Math.sin(t * 5.3) * 0.08;
    const g = c.createRadialGradient(0, -30, 4, 0, -30, 230 * (1 + f)); g.addColorStop(0, 'hsla(40,90%,60%,0.35)'); g.addColorStop(1, 'hsla(40,90%,60%,0)'); c.fillStyle = g; c.fillRect(-380, -260, 780, 400);
    c.fillStyle = grey(34); c.fillRect(-380, 30, 780, 60); c.fillStyle = grey(60); c.fillRect(-380, 30, 780, 2);
    c.fillStyle = grey(210); c.fillRect(-9, -14, 18, 46); c.fillStyle = grey(240); c.fillRect(-9, -14, 18, 3); c.fillStyle = grey(30); c.fillRect(-1, -22, 2, 8);
    c.save(); c.translate(0, -24); c.scale(1 + f, 1 - f * 0.5); c.fillStyle = 'hsla(44,95%,70%,0.95)'; c.beginPath(); c.moveTo(0, -24); c.quadraticCurveTo(9, -6, 0, 2); c.quadraticCurveTo(-9, -6, 0, -24); c.fill(); c.fillStyle = 'hsla(50,100%,92%,0.95)'; c.beginPath(); c.ellipse(0, -4, 2.5, 5, 0, 0, TAU); c.fill(); c.restore();
    const hm = Save.s.reduce ? 0 : Math.sin(t * 0.8) * 4;
    for (const d of [-1, 1]) { c.fillStyle = grey(16); c.beginPath(); c.moveTo(d * 380, 10); c.quadraticCurveTo(d * 120, -10 + hm, d * 46, -28 + hm); c.quadraticCurveTo(d * 30, -16 + hm, d * 40, 0); c.quadraticCurveTo(d * 120, 20, d * 380, 50); c.fill(); }
  },
  snow(c, t) { c.save(); c.translate(-480, -250); Render.backdrop(c, 400 + t * 8, true, { noWindow: true }); c.restore(); c.fillStyle = grey(220, 0.12); c.fillRect(-380, -170, 780, 260); this.flakes(c, t * 1.6, 140, 0.85); },
  thaw(c, t) {
    c.save(); c.translate(-480, -250); Render.backdrop(c, 400 + t * 4, false, { noWindow: true }); c.restore();
    const g = c.createRadialGradient(220, -120, 10, 220, -120, 220); g.addColorStop(0, grey(250, 0.5)); g.addColorStop(1, grey(250, 0)); c.fillStyle = g; c.fillRect(-20, -360, 480, 480);
    c.fillStyle = grey(200); for (let k = 0; k < 18; k++) { const x = -340 + k * 40, l = 8 + PH(k, 81) * 22; c.beginPath(); c.moveTo(x - 4, -154); c.lineTo(x + 4, -154); c.lineTo(x, -154 + l); c.fill(); const d = ((t * 0.7 + PH(k, 82)) % 1); c.fillRect(x - 0.8, -154 + l + d * 220, 1.6, 4); }
  },
  landing(c, t, i) {
    c.fillStyle = grey(52); c.fillRect(-334, -154, 668, 230); c.fillStyle = grey(62); for (let x = -330; x < 334; x += 16) c.fillRect(x, -154, 2, 200);
    c.fillStyle = grey(86); c.fillRect(-334, 46, 668, 30); c.fillStyle = grey(30); c.fillRect(160, -110, 70, 90); c.fillStyle = grey(110); c.fillRect(166, -104, 58, 78);
    c.save(); c.beginPath(); c.rect(166, -104, 58, 78); c.clip(); c.fillStyle = grey(235, 0.8); for (let k = 0; k < 16; k++) { const y = ((PH(k, 91) * 90 + t * (12 + PH(k, 92) * 14)) % 90) - 106, x = 166 + PH(k, 93) * 58 + Math.sin(t + k) * 3; c.fillRect(x, y, 1.6, 1.6); } c.restore();
    c.fillStyle = grey(30); c.fillRect(193, -104, 2, 78); c.fillRect(166, -66, 58, 2);
    c.fillStyle = grey(40); c.fillRect(-300, -110, 60, 156); c.fillStyle = grey(70); c.beginPath(); c.arc(-250, -30, 3, 0, TAU); c.fill();
    const f = Save.s.reduce ? 0 : Math.sin(t * 10) * 0.08; c.fillStyle = grey(70); c.fillRect(250, 20, 50, 6); c.fillStyle = grey(210); c.fillRect(270, 4, 8, 16); c.fillStyle = 'hsla(44,95%,68%,0.95)'; c.beginPath(); c.ellipse(274, 0, 3 * (1 + f), 6, 0, 0, TAU); c.fill();
    const g = c.createRadialGradient(274, 0, 2, 274, 0, 70); g.addColorStop(0, 'hsla(40,90%,60%,0.22)'); g.addColorStop(1, 'hsla(40,90%,60%,0)'); c.fillStyle = g; c.fillRect(204, -70, 140, 140);
  }
};

/* ---------- Field Guide: who is out there ---------- */
const FIELD = {
  patrol: { n: 'The Grey Coats', tag: 'Curfew wardens', d: 'The city\'s curfew wardens. Long coats, armbands, hand lamps after dark. They walk set rounds and now change floors on the way. Anyone out after six goes on a list, and the lists go to the work brigades.', tip: 'Watch the lamp and the cone. They are slow to turn around. A closed door breaks their line of sight.', first: 'A Grey Coat. Curfew warden. Keep out of the lamp and the cone, and they will walk on by.' },
  scav: { n: 'The Magpies', tag: 'Scavenger gangs', d: 'Gangs who strip empty buildings, and full ones if the door is weak. They hear well and want what is in your pack more than they want you.', tip: 'They wander. A thrown bottle sends them the wrong way. If one grabs at you, keep the pack moving.', first: 'A Magpie. Gang scavenger. They want your pack. A thrown bottle sends them the wrong way.' },
  raider: { n: 'Magpie raiders', tag: 'At the door', d: 'On the worst nights the Magpies come to the shelter itself. They test the door, the windows, your nerve.', tip: 'Barricades, banging pots, and a held door. Sometimes a bargain.', first: 'Magpie raiders, at the door.' },
  dog: { n: 'Strays', tag: 'Hungry dogs', d: 'Dogs that used to belong to someone. They cannot see far, but they hear everything and they are fast.', tip: 'Crouch and keep still. Food can buy you a friend.', first: 'A stray. Dogs hear everything. Crouch, and keep still.' },
  sniper: { n: 'The long guns', tag: 'Over the river', d: 'Snipers on the far bank. They watch the bridges, open squares and lit windows. They do not miss twice.', tip: 'A long gun shows its glint before it fires. Cross in the gaps between glances.', first: '' },
  census: { n: 'List-keepers', tag: 'Census night', d: 'Grey Coats with clipboards. They knock on every door and write down every name they find.', tip: 'Be in a different room. Hide, and keep the children quiet.', first: 'A list-keeper. Every name they find goes on the list.' },
  civ: { n: 'Strangers', tag: 'Not enemies', d: 'Other people getting through the winter. Some trade, some beg, some are hurt. None of them are a threat unless you make them one.', tip: 'Talk to them. Kindness is remembered.', first: '' },
  cold: { n: 'The cold', tag: 'Everyone\'s enemy', d: 'It gets into the walls and then into people. It takes the old and the small first.', tip: 'Fuel, blankets, warm food, and everyone in one room on the worst nights.', first: '' }
};
const FIELD_ORDER = ['patrol', 'scav', 'raider', 'dog', 'sniper', 'census', 'civ', 'cold'];
class FieldGuideScene {
  enter(p) {
    this.p = p || {}; this.t = 0; Snd.setTrack('menu');
    this.menu = new Menu({ x: 30, y: 60, w: 300, key: 'field', title: 'Who is out there', maxRows: 9, rowH: 34, noSub: true, items: FIELD_ORDER.map(k => ({ label: FIELD[k].n, right: () => FIELD[k].tag, act: () => Snd.sfx('page') })), onBack: () => Game.go(this.p.back || 'Title', {}, 'tear') });
  }
  update(dt) { this.t += dt; menuWeather(dt); this.menu.update(dt); }
  render(ctx) {
    const t = this.t; Render.backdrop(ctx, 300 + t * 5, true, {}); this.menu.render(ctx);
    const vis = this.menu.vis(), it = vis[this.menu.sel], idx = it && !it.back ? FIELD_ORDER[this.menu.items.indexOf(it)] : null, e = idx ? FIELD[idx] : null;
    UI.paper(ctx, 370, 40, 560, 450, { seed: 120, rot: 0.004 });
    if (!e) { txtWrap(ctx, 'We are not soldiers. We are neighbours. Everything out there is bigger than us, so we learned to be small.', 400, 110, 500, 14, G.ink, { outline: false, serif: true, normal: true, lh: 1.5 }); return Render.post(ctx, {}); }
    txt(ctx, e.n, 400, 84, 24, G.ink, 'left', { outline: false, serif: true }); txt(ctx, e.tag.toUpperCase(), 402, 104, 9, G.iron, 'left', { outline: false, fixed: true });
    ctx.save(); ctx.beginPath(); ctx.rect(400, 120, 500, 170); ctx.clip(); ctx.fillStyle = grey(40); ctx.fillRect(400, 120, 500, 170); ctx.fillStyle = grey(58); ctx.fillRect(400, 262, 500, 28);
    if (NPCT[idx]) { const n = { type: idx, T: NPCT[idx], face: Math.sin(t * 0.25) > 0 ? 1 : -1, vx: 40, ph: t * 5, st: 'patrol', aw: 0, x: 0 }; const x = 650 + Math.sin(t * 0.25) * -150 * 0; ctx.save(); ctx.translate(x, 262); ctx.scale(2.2, 2.2); Rig.drawNPC(ctx, n, 0, 0, 1); ctx.restore(); }
    else if (idx === 'sniper') { CUT_ART.river.call(CUT_ART, (ctx.save(), ctx.translate(650, 210), ctx.scale(0.75, 0.75), ctx), t, 0); ctx.restore(); }
    else { CUT_ART.snow.call(CUT_ART, (ctx.save(), ctx.translate(650, 210), ctx.scale(0.75, 0.75), ctx), t, 0); ctx.restore(); }
    ctx.restore(); ctx.strokeStyle = G.ink; ctx.lineWidth = 1.5; ctx.strokeRect(400, 120, 500, 170);
    const h = txtWrap(ctx, e.d, 400, 316, 500, 12.5, G.coal, { outline: false, serif: true, normal: true, lh: 1.45 });
    UI.icon(ctx, 'warn', 408, 330 + h, 11, G.ink); txtWrap(ctx, e.tip, 422, 334 + h, 478, 11.5, G.ink, { outline: false, lh: 1.35 });
    Render.post(ctx, {});
  }
}

/* ---------- the 1.2 world layer ---------- */
const V12 = {
  lastW: null,
  sState(w) {
    if (w.v12) return w.v12;
    const L = w.L, run = w.run, r = new RNG(((L.seed || run.day * 977 + 13) ^ 0x5bd1) >>> 0), nF = L.floors.length, S = w.v12 = {
      banks: [], smoke: [], seen: new Set(), r,
      fog: { k: 0, tgt: 0, timer: 12 + r.r(0, 40) },
      wx: { kind: null, k: 0, tgt: 0, timer: 25 + r.r(0, 60), squall: false, flash: 0, boltT: 6 + r.r(0, 10), thunderT: 0 },
      sh: { cur: null, cool: 9 + r.r(0, 12) }
    };
    for (let k = 0; k < 7; k++) S.banks.push({ f: r.i(0, nF - 1), x: r.r(0, L.w), len: r.r(280, 640), sp: r.r(6, 18) * (r.chance(0.5) ? 1 : -1), ph: r.r(0, 6) });
    if (L.site) { const n = 2 + r.i(0, 2); for (let k = 0; k < n; k++) { const f = r.i(0, nF - 1), fl = L.floors[f]; if (fl.x1 - fl.x0 < 400) continue; S.smoke.push({ f, x: r.r(Math.max(fl.x0 + 160, 260), fl.x1 - 140), ph: r.r(0, 9) }); } }
    return S;
  },
  activeS(w) { return w.surv.find(s => s.active && !s.down) || w.surv.find(s => !s.down) || w.surv[0]; },
  fogAt(w, x, f) {
    const S = w.v12; if (!S || S.fog.k < 0.02) return 0; let d = 0;
    for (const b of S.banks) if (b.f === f) d = Math.max(d, 1 - Math.abs(x - b.x) / (b.len / 2));
    return clamp(S.fog.k * (0.25 + d), 0, 1);
  },
  tick(w, dt) {
    const S = this.sState(w), L = w.L, run = w.run, nF = L.floors.length, r = S.r, a = this.activeS(w), site = !!L.site;
    // fog: steady in foggy weather, otherwise it rolls in at times
    const F = S.fog, baseFog = (run.weather === 'fog' || run.mods.fog) ? 0.8 : 0;
    F.timer -= dt; if (F.timer <= 0) { if (F.tgt > 0) { F.tgt = 0; F.timer = 50 + r.r(0, 70); } else { F.tgt = 0.45 + r.r(0, 0.35); F.timer = 30 + r.r(0, 30); if (site && F.k < 0.1) note('Fog is rolling in. It will hide you, a little.', 4); } }
    F.k += (Math.max(baseFog, F.tgt) - F.k) * Math.min(1, dt * 0.15);
    for (const b of S.banks) { b.x += b.sp * dt; if (b.x > L.w + b.len) b.x = -b.len; if (b.x < -b.len) b.x = L.w + b.len; }
    // rain and snow: the day's weather, plus passing showers
    const X = S.wx, wetKind = run.weather === 'rain' ? 'rain' : (run.weather === 'snow' || run.weather === 'coldsnap' || run.mods.snow) ? 'snow' : null;
    if (wetKind) { X.kind = wetKind; X.tgt = 1; }
    else if (site || w.night) {
      X.timer -= dt;
      if (X.timer <= 0) {
        if (!X.squall) { X.squall = true; X.kind = run.temp <= 0 ? 'snow' : 'rain'; X.tgt = 0.55 + r.r(0, 0.45); X.timer = 35 + r.r(0, 45); if (site) note(X.kind === 'rain' ? 'Rain is coming in. It covers your footsteps a little.' : 'Snow is starting. It muffles everything.', 4); }
        else { X.squall = false; X.tgt = 0; X.timer = 70 + r.r(0, 90); }
      }
    }
    X.k += (X.tgt - X.k) * Math.min(1, dt * 0.22);
    const fac = L.bg === 'open' ? 1 : L.home ? 0.6 : 0.55;
    if (X.kind === 'rain') Snd.amb.rain = X.k * 0.7 * fac;
    if (X.kind === 'rain' && X.k > 0.6 && w.night) { X.boltT -= dt; if (X.boltT <= 0) { X.boltT = 10 + r.r(0, 16); X.flash = 1; X.thunderT = 0.6 + r.r(0, 2.2); } }
    X.flash = Math.max(0, X.flash - dt * 3);
    if (X.thunderT > 0) { X.thunderT -= dt; if (X.thunderT <= 0) Snd.sfx('thunder', { v: 0.6 + r.r(0, 0.4) }); }
    if (!a) return;
    // what you have seen, for the floor plan
    if (site && L.conts) for (const c of L.conts) if (c.f === w.entF(a) && Math.abs(c.x - a.x) < 380) S.seen.add(c);
    // the first time you meet each kind of hostile, the Field Guide says a word
    if (site) for (const n of w.npcs) {
      if (!n.T.hostile || !FIELD[n.type] || !FIELD[n.type].first || n.f !== w.entF(a) || Math.abs(n.x - a.x) > 420) continue;
      const sf = Save.data.seenFoes || (Save.data.seenFoes = {}); if (sf[n.type]) continue; sf[n.type] = 1; Save.write(); note(FIELD[n.type].first, 6);
    }
    // shadows: scenery only
    const H2 = S.sh;
    if (H2.cur) { const c = H2.cur; c.t += dt; if (c.type === 'watcher' && c.f === w.entF(a) && Math.abs(c.x - a.x) < 200 && !c.leave) c.leave = c.t; if (c.t > c.dur || (c.leave && c.t > c.leave + 0.8)) { H2.cur = null; H2.cool = (calm() ? 30 : 15) + r.r(0, 22); } }
    else if (Save.s.shadows !== false && (site || w.night)) {
      H2.cool -= dt;
      if (H2.cool <= 0) {
        const types = ['watcher', 'watcher', 'eyes', 'eyes'].concat(calm() ? [] : ['passer', 'passer', 'crawl'], w.night && !calm() ? ['hands', 'hands'] : []);
        const type = types[Math.floor(r.r(0, types.length))], vis = W / 2 / w.cam.zoom - 50;
        let f = w.entF(a); if (r.chance(0.4) && nF > 1) f = clamp(f + (r.chance(0.5) ? 1 : -1), 0, nF - 1);
        const fl = L.floors[f], side = r.chance(0.5) ? 1 : -1;
        let x = clamp(a.x + side * r.r(240, 420), w.cam.x - vis, w.cam.x + vis); x = clamp(x, fl.x0 + 30, fl.x1 - 30);
        if (w.npcs.some(n => n.f === f && Math.abs(n.x - x) < 140)) H2.cool = 3;
        else {
          H2.cur = { type, f, x, side, t: 0, dur: { watcher: 7, eyes: 3.6, passer: 1.8, crawl: 4.5, hands: 4.2 }[type], y: r.r(0.25, 0.75) };
          if (r.chance(0.4)) Snd.sfx(r.chance(0.5) ? 'whisper' : 'breath', { v: 0.6 });
        }
      }
    }
  },

  /* world layer: rubble under smoke, holes in floors, floor numbers at the stairs */
  siteBack(c, w) {
    const L = w.L, nF = L.floors.length; if (nF < 2) return;
    const lab = f => { const n = nF - 1 - f; return n === 0 ? 'G' : String(n); };
    for (const l of L.ladders) for (const [f, x] of [[l.fa, l.xa], [l.fb, l.xb]]) { const y = w.floorY(f); c.fillStyle = grey(30); c.fillRect(x + 18, y - 76, 20, 22); c.fillStyle = grey(84); c.fillRect(x + 19, y - 75, 18, 20); txt(c, lab(f), x + 28, y - 60, 12, grey(30), 'center', { outline: false, fixed: true }); }
  },
  siteFront(c, w) {
    const S = this.sState(w), t = Game.time;
    for (const s of S.smoke) { const y = w.floorY(s.f), x = s.x; c.fillStyle = grey(44); c.beginPath(); c.moveTo(x - 26, y); c.lineTo(x - 14, y - 10); c.lineTo(x - 2, y - 7); c.lineTo(x + 10, y - 13); c.lineTo(x + 26, y); c.fill(); c.fillStyle = grey(70); c.fillRect(x - 12, y - 9, 10, 3); c.fillRect(x + 4, y - 11, 9, 3); }
  },
  obj(c, w, o) {
    if (o.type !== 'hole') return;
    const y = w.floorY(o.f), x = o.x, t = Game.time, yb = w.floorY(o.f + 1);
    c.fillStyle = grey(6); c.beginPath(); c.moveTo(x - 24, y - 1); for (let k = 0; k <= 8; k++) c.lineTo(x - 24 + k * 6, y + (k % 2 ? 4 : -1)); c.lineTo(x + 24, y + 13); for (let k = 8; k >= 0; k--) c.lineTo(x - 24 + k * 6, y + 13 - (k % 2 ? 4 : 0)); c.fill();
    c.fillStyle = grey(96); c.save(); c.translate(x - 22, y + 2); c.rotate(0.5); c.fillRect(0, 0, 14, 3); c.restore(); c.save(); c.translate(x + 18, y + 1); c.rotate(-0.6); c.fillRect(0, 0, 12, 3); c.restore();
    if (!calm()) { const d = (t * 0.9) % 1; c.fillStyle = grey(150, 0.6 * (1 - d)); c.fillRect(x - 6 + Math.sin(t * 3) * 6, y + 14 + d * (yb - y - 14), 1.5, 1.5); }
    c.fillStyle = grey(60); c.beginPath(); c.moveTo(x - 30, yb); c.lineTo(x - 12, yb - 8); c.lineTo(x + 2, yb - 5); c.lineTo(x + 16, yb - 9); c.lineTo(x + 30, yb); c.fill(); c.fillStyle = grey(96); c.fillRect(x - 10, yb - 7, 14, 2);
  },

  /* screen layer, after the darkness: smoke and the shadows */
  glows(ctx, w, X, Y) {
    const S = w.v12; if (!S) return; const t = Game.time, z = w.cam.zoom, L = w.L;
    if (rich()) for (const s of S.smoke) {
      const fl = L.floors[s.f], sx = X(s.x); if (sx < -200 || sx > W + 200) continue; const y = Y(fl.y);
      const eg = ctx.createRadialGradient(sx, y - 4, 0, sx, y - 4, 30 * z); eg.addColorStop(0, 'hsla(20,90%,50%,' + (0.18 + 0.08 * Math.sin(t * 5 + s.ph)) + ')'); eg.addColorStop(1, 'hsla(20,90%,50%,0)'); ctx.fillStyle = eg; ctx.fillRect(sx - 30 * z, y - 34 * z, 60 * z, 40 * z);
      const top = L.bg === 'open' && s.f === 0 ? -9999 : y - 92 * z;
      smokeColumn(ctx, sx, y - 8 * z, t + s.ph, { sc: z, top, rise: 260, al: 0.13, g: 160, n: 12, wind: 0.6 });
    }
    const c = S.sh.cur; if (!c || c.type === 'hands') return;
    const fy = Y(L.floors[c.f].y), sx = X(c.x), fadeIn = clamp(c.t / 1.2, 0, 1), fadeOut = clamp((c.dur - c.t) / 0.8, 0, 1), lv = c.leave ? clamp(1 - (c.t - c.leave) / 0.8, 0, 1) : 1, a = fadeIn * fadeOut * lv;
    if (c.type === 'watcher') {
      const hz = ctx.createRadialGradient(sx, fy - 50 * z, 4, sx, fy - 50 * z, 90 * z); hz.addColorStop(0, grey(150, 0.16 * a)); hz.addColorStop(1, grey(150, 0)); ctx.fillStyle = hz; ctx.fillRect(sx - 90 * z, fy - 140 * z, 180 * z, 150 * z);
      shadowFig(ctx, sx, fy, 92 * z, 0.85 * a, t, { tilt: c.t > 3 ? Math.min(0.35, (c.t - 3) * 0.3) : 0, still: true });
    } else if (c.type === 'eyes') {
      const blink = (c.t > 1.2 && c.t < 1.35) || (c.t > 2.4 && c.t < 2.55); if (blink) return;
      const ey = fy - 62 * z; for (const d of [-1, 1]) { const g = ctx.createRadialGradient(sx + d * 5 * z, ey, 0, sx + d * 5 * z, ey, 6 * z); g.addColorStop(0, grey(235, 0.9 * a)); g.addColorStop(1, grey(235, 0)); ctx.fillStyle = g; ctx.fillRect(sx + d * 5 * z - 6 * z, ey - 6 * z, 12 * z, 12 * z); ctx.fillStyle = grey(250, a); ctx.fillRect(sx + d * 5 * z - 1, ey - 0.8, 2, 1.6); }
    } else if (c.type === 'passer') {
      const k = c.t / c.dur, px = sx + (k - 0.5) * 520 * z * c.side;
      ctx.save(); ctx.translate(px, fy); ctx.transform(1, 0, -0.5 * c.side, 1, 0, 0); ctx.scale(1.6, 1.15); shadowFig(ctx, 0, 0, 80 * z, 0.45 * Math.sin(k * Math.PI), t, {}); ctx.restore();
    } else if (c.type === 'crawl') {
      const ceil = c.f > 0 ? Y(L.floors[c.f - 1].y + 12) : fy - 96 * z, k = c.t / c.dur, px = sx + c.side * (k < 0.7 ? k * 60 : 42 + (k - 0.7) * 900) * z, ph = t * (k < 0.7 ? 4 : 18);
      ctx.fillStyle = grey(4, 0.8 * a); ctx.strokeStyle = grey(4, 0.8 * a); ctx.lineWidth = 1.6 * z;
      ctx.beginPath(); ctx.ellipse(px, ceil + 6 * z, 16 * z, 5 * z, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const lx = px + (i - 2.5) * 6 * z, sw = Math.sin(ph + i * 1.4) * 5 * z; ctx.moveTo(lx, ceil + 6 * z); ctx.lineTo(lx + sw + (i - 2.5) * 4 * z, ceil + 16 * z); ctx.lineTo(lx + sw * 1.4 + (i - 2.5) * 7 * z, ceil + 4 * z); } ctx.stroke();
    }
  },

  /* screen layer, over everything in the world: fog banks, rain, snow, lightning */
  over(ctx, w) {
    const S = w.v12; if (!S) return; const L = w.L, t = Game.time, z = w.cam.zoom, X = x => w.sx(x), Y = y => w.sy(y), lo = !rich();
    const F = S.fog;
    if (F.k > 0.02) {
      for (const b of S.banks) {
        const fl = L.floors[b.f], cx = X(b.x), half = b.len / 2 * z; if (cx + half < -50 || cx - half > W + 50) continue;
        const cy = Y(fl.y) - 30 * z;
        for (let j = 0; j < (lo ? 1 : 3); j++) {
          const ox = Math.sin(t * 0.15 + b.ph + j * 2) * 60 * z + (j - 1) * half * 0.5, oy = Math.sin(t * 0.2 + j + b.ph) * 8 * z, rx = half * (0.7 + j * 0.15);
          ctx.save(); ctx.translate(cx + ox, cy + oy); ctx.scale(1, 0.28); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, grey(185, 0.24 * F.k)); g.addColorStop(1, grey(185, 0)); ctx.fillStyle = g; ctx.fillRect(-rx, -rx, rx * 2, rx * 2); ctx.restore();
        }
      }
      ctx.fillStyle = grey(170, 0.06 * F.k); ctx.fillRect(0, 0, W, H);
      if (!lo) { ctx.strokeStyle = grey(200, 0.12 * F.k); ctx.lineWidth = 2; for (let k = 0; k < 6; k++) { const y = H * 0.35 + k * 46, x = ((t * (10 + k * 3) + PH(k, 3) * W) % (W + 400)) - 200; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 60, y - 6, x + 120, y + 6, x + 200, y); ctx.stroke(); } }
    }
    const R = S.wx; if (R.k > 0.03 && R.kind) {
      const fac = (L.bg === 'open' ? 1 : L.home ? 0.6 : 0.55) * R.k, sh = (w.cam.x * 0.3) % W;
      if (R.kind === 'rain') {
        const layers = [[70, 0.1, 700, 9, 0.6], [44, 0.18, 950, 15, 0.9], [18, 0.28, 1250, 24, 1.4]];
        for (let li = 0; li < layers.length; li++) {
          if (lo && li === 0) continue; const [n, al, sp, len, lw] = layers[li], cnt = Math.round(n * fac); ctx.strokeStyle = grey(215, al); ctx.lineWidth = lw; ctx.beginPath();
          for (let i = 0; i < cnt; i++) { const p = (t * sp / (H + 60) + PH(i, 200 + li)) % 1, y = p * (H + 60) - 30, x = ((PH(i, 210 + li) * (W + 120) - sh * (li + 1) * 0.3 + y * 0.18) % (W + 120) + W + 120) % (W + 120) - 60; ctx.moveTo(x, y); ctx.lineTo(x - len * 0.18, y + len); }
          ctx.stroke();
        }
        if (L.bg === 'open' || L.home) {
          ctx.strokeStyle = grey(220, 0.35 * R.k); ctx.lineWidth = 0.8; const slot = Math.floor(t * 10);
          for (let f = 0; f < L.floors.length; f++) { if (L.home && f > 0) continue; const fl = L.floors[f], y = Y(fl.y); if (y < 0 || y > H) continue;
            for (let j = 0; j < 10; j++) { const q = PH(slot * 17 + j, f + 300), x = X(fl.x0 + q * (fl.x1 - fl.x0)); if (x < 0 || x > W) continue; const age = (t * 10) % 1; ctx.beginPath(); ctx.ellipse(x, y - 1, 2 + age * 5, 0.8 + age * 1.2, 0, Math.PI, TAU); ctx.stroke(); } }
        }
        if (R.flash > 0 && !calm()) { ctx.fillStyle = grey(255, R.flash * 0.22 * fac); ctx.fillRect(0, 0, W, H); }
      } else {
        const layers = [[60, 0.35, 18, 1.1], [40, 0.55, 30, 1.8], [14, 0.7, 48, 2.8]], tt = calm() ? t * 0.5 : t;
        for (let li = 0; li < layers.length; li++) {
          if (lo && li === 0) continue; const [n, al, sp, sz] = layers[li], cnt = Math.round(n * fac); ctx.fillStyle = grey(235, al); ctx.beginPath();
          for (let i = 0; i < cnt; i++) { const p = (tt * sp / (H + 20) + PH(i, 220 + li)) % 1, y = p * (H + 20) - 10, x = ((PH(i, 230 + li) * (W + 60) + Math.sin(tt * 0.8 + i) * 14 - sh * (li + 1) * 0.3) % (W + 60) + W + 60) % (W + 60) - 30; ctx.moveTo(x + sz, y); ctx.arc(x, y, sz, 0, TAU); }
          ctx.fill();
        }
      }
    }
  },
  /* screen layer: long fingers at the edge of the screen */
  post(ctx) {
    const sc = Game.scene, w = sc && sc.w; if (!w || w !== this.lastW || !w.v12) return; const c = w.v12.sh.cur; if (!c || c.type !== 'hands') return;
    const k = c.t / c.dur, reach = Math.sin(Math.min(1, k * 1.25) * Math.PI) * 120, x0 = c.side > 0 ? W : 0, d = -c.side, y0 = H * c.y;
    ctx.strokeStyle = grey(0, 0.75); ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const yy = y0 + (i - 1.5) * 16, wig = Math.sin(Game.time * 3 + i) * 6, len = reach * (0.8 + i * 0.08);
      ctx.lineWidth = 5 - i * 0.6; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.quadraticCurveTo(x0 + d * len * 0.5, yy + wig - 10, x0 + d * len, yy + wig + (i - 1.5) * 6); ctx.stroke();
    }
    const g = ctx.createRadialGradient(x0, y0, 0, x0, y0, 120); g.addColorStop(0, grey(0, 0.5 * Math.sin(k * Math.PI))); g.addColorStop(1, grey(0, 0)); ctx.fillStyle = g; ctx.fillRect(x0 - 120, y0 - 120, 240, 240);
  },
  /* distant smoke columns behind the skyline */
  skySmoke(c, camX, night, t) {
    if (!rich()) return;
    for (let i = 0; i < 3; i++) { const x = ((i * 830 + 300 - camX * 0.06) % 2400 + 2400) % 2400 - 200; if (x < -150 || x > W + 150) continue; smokeColumn(c, x, 330, t * 0.6 + i * 3, { rise: 300, al: night ? 0.12 : 0.18, g: night ? 70 : 120, sc: 1.4, wind: 1.3, n: 14 }); }
  },
  /* the floor plan on the sortie HUD */
  floorPlan(ctx, sc) {
    const w = sc.w; if (!w || !w.L.site || w.L.floors.length < 2) return; const L = w.L, nF = L.floors.length, a = this.activeS(w); if (!a) return;
    const S = this.sState(w), cur = w.entF(a), x = 14, bh = 15, y0 = 440 - nF * (bh + 3);
    ctx.fillStyle = grey(0, 0.35); rrect(ctx, x - 6, y0 - 20, 64, nF * (bh + 3) + 24, 6); ctx.fill();
    txt(ctx, 'FLOOR', x, y0 - 8, 7.5, G.fog, 'left', { outline: false, fixed: true });
    for (let f = 0; f < nF; f++) {
      const y = y0 + f * (bh + 3), on = f === cur, n = nF - 1 - f;
      ctx.fillStyle = on ? G.bone : grey(90, 0.7); rrect(ctx, x, y, 52, bh, 3); ctx.fill();
      txt(ctx, n === 0 ? 'G' : String(n), x + 8, y + 11, 9, on ? G.ink : G.bone, 'center', { outline: false, fixed: true });
      let k = 0; for (const c of S.seen) if (c.f === f && c.items.length) k++;
      for (let i = 0; i < Math.min(4, k); i++) { ctx.fillStyle = on ? G.ink : G.bone; ctx.beginPath(); ctx.arc(x + 22 + i * 7, y + bh / 2, 2.2, 0, TAU); ctx.fill(); }
      if (L.objs.some(o => o.type === 'hole' && o.f === f)) { ctx.fillStyle = on ? G.ink : G.bone; ctx.beginPath(); ctx.moveTo(x + 46, y + 4); ctx.lineTo(x + 50, y + 4); ctx.lineTo(x + 48, y + 11); ctx.fill(); }
    }
  },
  /* credits: smoke drifting past, birds at dawn */
  creditsFx(ctx, t) {
    if (calm()) return;
    smokeColumn(ctx, 140, 520, t, { rise: 420, al: 0.1, g: 200, sc: 1.6, wind: 1.4, n: 14 });
    ctx.strokeStyle = grey(30, 0.8); ctx.lineWidth = 1.5; for (let i = 0; i < 5; i++) { const x = ((t * (30 + i * 4) + i * 140) % 1200) - 100, y = 80 + i * 18 + Math.sin(t + i) * 6, fl = Math.sin(t * 8 + i) * 4; ctx.beginPath(); ctx.moveTo(x - 7, y - fl); ctx.lineTo(x, y); ctx.lineTo(x + 7, y - fl); ctx.stroke(); }
  }
};

/* ---------- sound: rooms, richer effects, distant ambience ---------- */
const V12A = {
  ambT: 12, room: '', irs: null,
  setup() {
    const S = Snd; if (!S.ok || S.v12) return; const c = S.ctx;
    try {
      const mk = (sec, dec) => { const n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, dec); } return b; };
      this.irs = { small: mk(0.5, 4), room: mk(1.1, 3.6), hall: mk(2.2, 3), tunnel: mk(3.4, 2.2), open: mk(0.9, 5), church: mk(3.8, 2.4) };
      const muff = c.createBiquadFilter(); muff.type = 'lowpass'; muff.frequency.value = 18000; S.master.disconnect(); S.master.connect(muff); muff.connect(c.destination);
      const cv = c.createConvolver(); cv.buffer = this.irs.room; const send = c.createGain(); send.gain.value = 0.18; const rlp = c.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 3200;
      S.sfxG.connect(send); send.connect(cv); cv.connect(rlp); rlp.connect(S.master);
      const dl = c.createDelay(1); dl.delayTime.value = 0.31; const fb = c.createGain(); fb.gain.value = 0.3; const eg = c.createGain(); eg.gain.value = 0; const elp = c.createBiquadFilter(); elp.type = 'lowpass'; elp.frequency.value = 1800;
      S.sfxG.connect(eg); eg.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(elp); elp.connect(S.master);
      S.v12 = { muff, cv, send, eg };
    } catch (e) { S.v12 = null; }
  },
  setRoom(name) {
    const S = Snd; if (!S.v12 || this.room === name) return; this.room = name;
    const P = { small: [0.12, 0], room: [0.18, 0], hall: [0.26, 0.04], tunnel: [0.32, 0.22], open: [0.08, 0], church: [0.36, 0.06] }[name] || [0.18, 0];
    try { S.v12.cv.buffer = this.irs[name] || this.irs.room; const now = S.ctx.currentTime; S.v12.send.gain.setTargetAtTime(P[0], now, 0.3); S.v12.eg.gain.setTargetAtTime(P[1], now, 0.3); } catch (e) { /* ignore */ }
  },
  update(dt) {
    const S = Snd; if (!S.ok) return; if (!S.v12) this.setup(); if (!S.v12) return;
    const sc = Game.scene, w = sc && sc.w, L = w && w.L, nm = Game.name;
    this.setRoom(L ? (L.home ? 'room' : L.bg === 'tunnel' ? 'tunnel' : L.bg === 'nave' ? 'church' : L.bg === 'open' ? 'open' : L.bg === 'hall' ? 'hall' : 'room') : 'small');
    const fog = w && w.v12 ? w.v12.fog.k : 0; S.v12.muff.frequency.setTargetAtTime(fog > 0.3 ? 18000 - fog * 13000 : 18000, S.ctx.currentTime, 0.5);
    if (!w || !/NightSortie|NightHome|HomeDay/.test(nm)) return;
    this.ambT -= dt; if (this.ambT > 0) return;
    const night = w.night, r = Math.random();
    this.ambT = 14 + Math.random() * 26;
    if (L.bg === 'tunnel' && r < 0.5) { S.sfx('drip', { v: 0.7 }); this.ambT = 4 + Math.random() * 6; return; }
    if (L.bg === 'nave' && r < 0.3) { S.sfx('creak', { v: 0.5 }); return; }
    if (night) { if (r < 0.55) S.sfx('boom', { v: 0.35 + Math.random() * 0.4 }); else if (r < 0.72) S.sfx('howl', { v: 0.8 }); else if (r < 0.85) S.sfx('farbark'); else S.sfx('crow', { v: 0.5 }); }
    else { if (r < 0.4) S.sfx('crow', { v: 0.7 }); else if (r < 0.6) S.sfx('boom', { v: 0.25 }); }
  }
};
/* Richer effects. Return false to fall through to the original sound (and layer on top of it). */
const V12S = {
  step(a, pv) {
    const s = a.surf || 'wood', v = a.v == null ? 1 : a.v;
    if (s === 'wood') { this.nz(0.035, 0.11 * v, 'bandpass', 260 * pv, 1.4); this.nz(0.04, 0.07 * v, 'bandpass', 430 * pv, 1.6, { when: 0.05 }); this.tn(88 * pv, 0.07, 'sine', 0.07 * v); if (Math.random() < 0.12) this.tn(380 * pv, 0.18, 'sawtooth', 0.016 * v, { slide: 300, lp: 900, when: 0.04 }); return; }
    if (s === 'stone') { this.nz(0.03, 0.09 * v, 'highpass', 1900 * pv, 0.8); this.nz(0.05, 0.1 * v, 'lowpass', 380 * pv, 1); return; }
    if (s === 'water') { this.nz(0.12, 0.12 * v, 'bandpass', 600 * pv, 1.2, { slide: 1500 }); this.tn(900 * pv, 0.06, 'sine', 0.03 * v, { slide: 1500, when: 0.03 }); return; }
    if (s === 'snow') { for (let i = 0; i < 3; i++) this.nz(0.025, 0.06 * v, 'bandpass', 1800 + Math.random() * 1600, 3, { when: i * 0.018 }); this.nz(0.09, 0.05 * v, 'lowpass', 700, 1); return; }
    return false;
  },
  door(a, pv) { this.tn(1900 * pv, 0.02, 'square', 0.03); this.nz(0.02, 0.08, 'bandpass', 3000, 4); this.tn(300 * pv, 0.45, 'sawtooth', 0.028, { slide: 520 * pv, lp: 1400, when: 0.04 }); this.nz(0.2, 0.15, 'lowpass', 380 * pv, 1, { when: 0.3 }); this.tn(110 * pv, 0.25, 'sine', 0.13, { slide: 70, when: 0.3 }); },
  creak(a, pv) { const v = a.v == null ? 1 : a.v; this.tn(380 * pv, 0.55, 'sawtooth', 0.03 * v, { slide: 260 * pv, lp: 1100 }); this.tn(760 * pv, 0.5, 'square', 0.008 * v, { slide: 540 * pv, lp: 1600 }); this.nz(0.4, 0.025 * v, 'bandpass', 900, 6, { slide: 600 }); },
  thud(a, pv) { const v = a.v == null ? 1 : a.v; this.tn(68 * pv, 0.35, 'sine', 0.36 * v, { slide: 36 }); this.nz(0.15, 0.12 * v, 'lowpass', 260, 1); for (let i = 0; i < 3; i++) this.nz(0.03, 0.04 * v, 'bandpass', 1500 + Math.random() * 1500, 3, { when: 0.08 + i * 0.05 }); },
  hit(a, pv) { this.tn(110 * pv, 0.16, 'sine', 0.4, { slide: 48 }); this.nz(0.06, 0.22, 'bandpass', 1200, 1); this.nz(0.14, 0.14, 'lowpass', 380, 1, { when: 0.02 }); },
  match(a, pv) { this.nz(0.12, 0.15, 'bandpass', 2600 * pv, 2, { slide: 4200 }); this.nz(0.35, 0.13, 'lowpass', 900, 0.8, { when: 0.1, attack: 0.03, slide: 500 }); for (let i = 0; i < 3; i++) this.nz(0.02, 0.06, 'bandpass', 2000 + Math.random() * 2000, 5, { when: 0.2 + Math.random() * 0.3 }); },
  knock(a, pv) { [0, 0.2, 0.4].forEach(w => { this.tn(150 * pv, 0.12, 'sine', 0.3, { slide: 85, when: w }); this.tn(420 * pv, 0.05, 'triangle', 0.07, { when: w }); this.nz(0.05, 0.11, 'bandpass', 900, 2, { when: w }); }); },
  drip(a, pv) { const v = a.v == null ? 1 : a.v; this.tn(1300 * pv, 0.06, 'sine', 0.08 * v, { slide: 2200 }); this.tn(2600 * pv, 0.04, 'sine', 0.02 * v, { when: 0.02 }); this.tn(1300 * pv, 0.06, 'sine', 0.025 * v, { slide: 2200, when: 0.22 }); },
  splash(a, pv) { this.nz(0.35, 0.15, 'bandpass', 800 * pv, 0.8, { slide: 350 }); this.nz(0.2, 0.07, 'highpass', 3000, 1, { when: 0.05 }); for (let i = 0; i < 3; i++) this.tn(1400 + Math.random() * 900, 0.05, 'sine', 0.03, { when: 0.1 + i * 0.07, slide: 2400 }); },
  bark(a, pv) { [0, 0.17].forEach(w => { this.nz(0.09, 0.16, 'bandpass', 700 * pv, 3, { slide: 450, when: w }); this.tn(330 * pv, 0.1, 'sawtooth', 0.07, { slide: 200, lp: 1400, when: w }); }); },
  farbark(a, pv) { [0, 0.22, 0.5].forEach(w => this.nz(0.08, 0.05, 'bandpass', 600 * pv, 4, { slide: 420, when: w })); },
  page(a, pv) { this.nz(0.18, 0.08, 'bandpass', 2400 * pv, 1.2, { attack: 0.04, slide: 5000 }); this.nz(0.08, 0.04, 'highpass', 4000, 1, { when: 0.12 }); },
  type(a, pv) { this.tn(1800 * pv, 0.012, 'square', 0.014); this.nz(0.02, 0.04, 'bandpass', 2600 * pv, 3); this.tn((a.f || 520) * pv * 0.5, 0.04, 'triangle', 0.02); },
  move(a, pv) { this.tn(700 * pv, 0.04, 'sine', 0.04); this.nz(0.015, 0.03, 'bandpass', 2400, 4); },
  select(a, pv) { this.tn(523 * pv, 0.08, 'triangle', 0.06); this.tn(784 * pv, 0.14, 'sine', 0.05, { when: 0.05 }); this.nz(0.02, 0.035, 'bandpass', 3000, 3); },
  pickup(a, pv) { this.nz(0.12, 0.05, 'bandpass', 3000, 1.5); return false; },
  shatter(a, pv) { for (let i = 0; i < 5; i++) this.tn(2600 + Math.random() * 3000, 0.12, 'sine', 0.025, { when: 0.06 + i * 0.05 }); return false; },
  rumble(a, pv) { for (let i = 0; i < 4; i++) this.nz(0.04, 0.05, 'bandpass', 1200 + Math.random() * 1600, 4, { when: 0.4 + Math.random() * 1.8 }); return false; },
  bell(a, pv) { [[0.5, 3.4, 0.08], [1, 3, 0.16], [1.19, 2.2, 0.06], [1.5, 2, 0.05], [2, 1.6, 0.06], [2.74, 1.2, 0.04], [3.76, 0.8, 0.03]].forEach(([m, d, v]) => this.tn(196 * m, d, 'sine', v)); this.nz(0.05, 0.06, 'bandpass', 2500, 2); },
  whoosh() { this.nz(0.3, 0.11, 'bandpass', 400, 1.2, { slide: 2200, attack: 0.08 }); },
  boom(a) { const v = a.v == null ? 0.5 : a.v; this.tn(46, 2.2, 'sine', 0.3 * v, { slide: 30 }); this.nz(1.8, 0.2 * v, 'lowpass', 160, 0.8, { attack: 0.02 }); this.nz(2.6, 0.04 * v, 'bandpass', 600, 1, { when: 0.3, attack: 0.4 }); },
  thunder(a) { const v = a.v == null ? 0.7 : a.v; this.nz(0.5, 0.16 * v, 'lowpass', 900, 1); this.nz(3.5, 0.26 * v, 'lowpass', 220, 0.7, { attack: 0.15 }); this.tn(40, 3, 'sine', 0.18 * v, { attack: 0.3 }); },
  howl(a) { const v = a.v == null ? 1 : a.v; this.nz(3, 0.07 * v, 'bandpass', 500, 6, { slide: 900, attack: 1 }); },
  crow(a, pv) { const v = a.v == null ? 1 : a.v; [0, 0.3].forEach(w => this.tn(520 * pv, 0.18, 'sawtooth', 0.04 * v, { slide: 420, lp: 1800, when: w })); },
  whisper(a) { const v = a.v == null ? 1 : a.v; this.nz(1.4, 0.03 * v, 'bandpass', 2400, 2.5, { attack: 0.4, slide: 1600 }); this.nz(1, 0.018 * v, 'bandpass', 1200, 3, { when: 0.5, attack: 0.3 }); },
  breath(a) { const v = a.v == null ? 1 : a.v; this.nz(1.2, 0.035 * v, 'bandpass', 600, 1.5, { attack: 0.5 }); },
  land() { this.tn(70, 0.3, 'sine', 0.34, { slide: 38 }); this.nz(0.3, 0.12, 'lowpass', 600, 1); for (let i = 0; i < 4; i++) this.nz(0.03, 0.05, 'bandpass', 1400 + Math.random() * 1800, 3, { when: 0.06 + i * 0.05 }); }
};

/* ---------- gameplay: holes, richer upper floors, roaming patrols, fog cover ---------- */
OBJDEF.hole = { r: 22, act(w, s, o) { return { label: 'Drop through the broken floor', hold: 0.35, fn() { const below = o.f + 1, fl = w.L.floors[below]; if (!fl) return; w.place(s, clamp(o.x, fl.x0 + 8, fl.x1 - 8), below); s.land = 1; if (s.carry) { s.carry.f = below; s.carry.x = s.x; } Snd.sfx('land'); Parts.emit('dust', s.x, w.floorY(below) - 2, 8, { sx: 18 }); w.impact && w.impact(s.x, w.floorY(below) - 20, 0.3); w.noise(s.x, below, 175, s); } }; } };

(function () {
  const wrap = (obj, key, after, before) => { const f = obj[key]; if (!f) return; obj[key] = function () { if (before) before.apply(V12, arguments); const r = f.apply(this, arguments); if (after) after.apply(V12, arguments); return r; }; };
  // sites: holes in upper floors, and the top floors are less picked over
  const _build = buildSite;
  buildSite = function (id, seed, o) {
    const L = _build(id, seed, o), r = new RNG(((seed | 0) ^ 0x2c1b) >>> 0), nF = L.floors.length, loc = LOCS[id];
    if (nF >= 3 && loc && L.conts) for (const c of L.conts) if (c.f <= nF - 3 && !c.story && r.chance(0.5)) { c.items.push(r.w(loc.loot)); c.rich = true; }
    for (let f = 0; f < nF - 1; f++) {
      if (!r.chance(0.75)) continue; const a = L.floors[f], b = L.floors[f + 1], lo = Math.max(a.x0, b.x0) + 200, hi = Math.min(a.x1, b.x1) - 120; if (hi <= lo) continue;
      for (let k = 0; k < 20; k++) {
        const x = Math.round(r.r(lo, hi));
        if (L.ladders.some(l => Math.abs(l.xa - x) < 70 || Math.abs(l.xb - x) < 70)) continue;
        if (L.objs.some(q => (q.f === f || q.f === f + 1) && Math.abs(q.x - x) < 50)) continue;
        if (L.blockers.some(q => (q.f === f || q.f === f + 1) && Math.abs(q.x - x) < 50)) continue;
        L.objs.push({ type: 'hole', x, f }); break;
      }
    }
    return L;
  };
  // patrols and Magpies change floors on their rounds
  const _nu = NPC.prototype.update;
  NPC.prototype.update = function (w, dt) {
    if (w.L.site && (this.type === 'patrol' || this.type === 'scav') && !this.mode && this.st === 'patrol' && w.L.floors.length >= 3) {
      if (this.roamT == null) this.roamT = 18 + Math.random() * 22;
      this.roamT -= dt;
      if (this.roamT <= 0) {
        this.roamT = 25 + Math.random() * 25; const nF = w.L.floors.length, nf = clamp(this.homeF + (Math.random() < 0.5 ? 1 : -1), 0, nF - 1);
        if (nf !== this.homeF && w.pathLadder(this.f, nf, this.x)) { const fl = w.L.floors[nf], x = clamp(this.x + (Math.random() - 0.5) * 400, fl.x0 + 140, fl.x1 - 140); this.homeF = nf; this.p0 = Math.max(fl.x0 + 30, x - 180); this.p1 = Math.min(fl.x1 - 30, x + 180); if (Math.random() < 0.5) this.say('roam'); }
      }
    }
    return _nu.call(this, w, dt);
  };
  // fog hides you; rain and snow cover small sounds
  const _expo = World.prototype.expo;
  World.prototype.expo = function (s) { const e = _expo.call(this, s); return this.L.site ? e * (1 - 0.35 * V12.fogAt(this, s.x, this.entF(s))) : e; };
  const _noise = World.prototype.noise;
  World.prototype.noise = function (x, f, r, src) { const S = this.v12; if (S && this.L.site && S.wx.kind && S.wx.k > 0.3 && r < 300) r *= 1 - 0.15 * S.wx.k; return _noise.call(this, x, f, r, src); };
  const _wu = World.prototype.update;
  World.prototype.update = function (dt, ctl) { const r = _wu.call(this, dt, ctl); try { V12.tick(this, dt); } catch (e) { if (DEBUG) console.warn(e); } return r; };
  // drawing hooks
  wrap(Render, 'world', function (ctx, w) { this.lastW = w; this.over(ctx, w); });
  wrap(Polish, 'siteBack', function (c, w) { this.siteBack(c, w); });
  wrap(Polish, 'siteFront', function (c, w) { this.siteFront(c, w); });
  wrap(Polish, 'obj', function (c, w, o) { this.obj(c, w, o); });
  wrap(Polish, 'glows', function (ctx, w, X, Y) { this.glows(ctx, w, X, Y); });
  wrap(Polish, 'post', function (ctx) { this.post(ctx); });
  wrap(Polish, 'sky', function (c, camX, night, t) { this.skySmoke(c, camX, night, t); });
  wrap(SortieScene.prototype, 'render', function (ctx) { V12.floorPlan(ctx, Game.scene); });
  // sound
  const _sfx = Snd.sfx;
  Snd.sfx = function (n, a) { if (!this.ok) return; a = a || {}; const f = V12S[n]; if (f && f.call(this, a, 0.94 + Math.random() * 0.12) !== false) return; return _sfx.call(this, n, a); };
  const _su = Snd.update;
  Snd.update = function (dt) { _su.call(this, dt); try { V12A.update(dt); } catch (e) { if (DEBUG) console.warn(e); } };
  // transitions: a soft edge on the iris, a shadow under the paper tear, light between the blinds
  const _tr = Render.transition;
  Render.transition = function (ctx, type, p, fx, fy) {
    _tr.call(this, ctx, type, p, fx, fy); if (p <= 0 || p >= 1) return;
    if (type === 'iris') { const R = Math.hypot(W, H) * (1 - p); ctx.strokeStyle = grey(0, 0.5); ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(fx == null ? W / 2 : fx, fy == null ? H / 2 : fy, Math.max(0, R + 9), 0, TAU); ctx.stroke(); }
    else if (type === 'blinds') { const n = 10, bh = H / n; ctx.fillStyle = grey(120, 0.25); for (let i = 0; i < n; i++) ctx.fillRect(0, i * bh + bh * p - 1, W, 1.5); }
    else if (type === 'tear') { const x = (W + 80) * p; const g = ctx.createLinearGradient(x, 0, x + 40, 0); g.addColorStop(0, grey(0, 0.35)); g.addColorStop(1, grey(0, 0)); ctx.fillStyle = g; ctx.fillRect(x, 0, 40, H); }
  };
  // endings: birds at dawn, snow on the hard ones
  wrap(EndingScene.prototype, 'render', function (ctx) {
    const sc = Game.scene; if (!sc || calm()) return; const t = sc.t;
    if (sc.p.win) { ctx.strokeStyle = grey(30, 0.8); ctx.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const x = ((t * (34 + i * 5) + i * 160) % 1200) - 100, y = 70 + i * 20 + Math.sin(t + i) * 6, fl = Math.sin(t * 8 + i) * 4; ctx.beginPath(); ctx.moveTo(x - 7, y - fl); ctx.lineTo(x, y); ctx.lineTo(x + 7, y - fl); ctx.stroke(); } }
    else CUT_ART.flakes.call(CUT_ART, (ctx.save(), ctx.translate(W / 2, H / 2 + 60), ctx.scale(1.4, 2.3), ctx), t, 80, 0.6), ctx.restore();
  });
})();
