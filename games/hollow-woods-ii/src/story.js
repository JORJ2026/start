// Story mode cutscenes: wordless, fully procedural animations.
//  0 intro      - the hero wakes in the dark and a light falls from the sky and leads the way
//  1..4 between overworlds - the hero follows the light while a growing shadow chases (a different
//               shadow for every overworld), leaps a gap and is swallowed by the light
//  5 finale     - at the summit the hero and the light become one and everything dissolves into dawn
(function (H) {
  'use strict';
  const W = 960, VH = 540, GY = 400;
  const DUR = { 0: 12, 1: 9, 2: 9, 3: 9, 4: 9, 5: 14 };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const sm = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const seg = (t, a, b) => sm((t - a) / (b - a));
  const lerp = (a, b, k) => a + (b - a) * k;
  const WORLD_IDS = ['forest', 'caves', 'ruins', 'factory', 'peaks'];

  function glowStroke(ctx, k, f) {
    ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 8 + 8 * k; ctx.strokeStyle = `rgba(255,255,255,${0.6 + 0.4 * k})`; ctx.lineWidth = 1.6; f(); ctx.restore();
  }

  // the hero: small silhouette with a trailing scarf
  function hero(ctx, x, y, t, o) {
    o = o || {};
    const sc = o.scale || 1, walk = o.walk == null ? 1 : o.walk, f = o.face || 1, air = o.air || 0, lie = o.lie || 0, look = o.look || 0, reach = o.reach || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc * f, sc);
    ctx.fillStyle = '#0b0b0b'; ctx.strokeStyle = '#0b0b0b'; ctx.lineCap = 'round'; ctx.lineWidth = 4;
    if (lie > 0.02) ctx.rotate(-lie * 1.5);
    const ph = t * 9 * (0.6 + walk), sw = Math.sin(ph) * 7 * walk * (1 - air);
    const bob = Math.abs(Math.cos(ph)) * 2 * walk * (1 - air);
    ctx.beginPath(); ctx.moveTo(-2, -14); ctx.lineTo(-2 - sw - air * 5, 0); ctx.moveTo(2, -14); ctx.lineTo(2 + sw + air * 6, 0 - air * 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, -14 - bob); ctx.lineTo(5, -14 - bob); ctx.lineTo(3, -29 - bob); ctx.lineTo(-3, -29 - bob); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -27 - bob);
    if (reach > 0) ctx.lineTo(8 + reach * 8, -27 - bob - reach * 14); else ctx.lineTo(5 - sw * 0.5, -17 - bob);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(look * 2, -35 - bob, 6, 0, 6.283); ctx.fill();
    // scarf
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-2, -30 - bob);
    const wob = Math.sin(t * 6) * 3;
    ctx.bezierCurveTo(-12, -31 - bob + wob, -20 - walk * 8, -27 - bob - wob, -30 - walk * 14, -30 - bob + wob * 1.5); ctx.stroke();
    ctx.restore();
  }

  function orb(ctx, x, y, t, r, bright) {
    const k = 0.5 + 0.5 * Math.sin(t * 3.3);
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5 * bright);
    g.addColorStop(0, `rgba(255,255,255,${0.9 * bright})`); g.addColorStop(0.25, `rgba(255,255,255,${0.35 * bright})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r * 6, y - r * 6, r * 12, r * 12);
    ctx.shadowColor = '#fff'; ctx.shadowBlur = 14 + 10 * k; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r * (0.8 + 0.12 * k), 0, 6.283); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) { const a = t * (0.8 + i * 0.3) + i * 2.1; ctx.beginPath(); ctx.ellipse(x, y, r * 1.9, r * 0.7, a, 0, 6.283); ctx.stroke(); }
    ctx.restore();
  }

  function ground(ctx, th, camX, t) {
    ctx.fillStyle = th.ground; ctx.beginPath(); ctx.moveTo(0, VH);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, GY + Math.sin((x + camX) * 0.011) * 8 + Math.sin((x + camX) * 0.027) * 4);
    ctx.lineTo(W, VH); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = th.edge; ctx.lineWidth = 2; ctx.stroke();
  }
  const gy = (x, camX) => GY + Math.sin((x + camX) * 0.011) * 8 + Math.sin((x + camX) * 0.027) * 4;

  function scenery(ctx, th, camX, t, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, VH);
    ctx.save(); ctx.translate(0, 70); H.fx.drawAbstract(ctx, th, camX, 0, t); H.fx.drawBackdrop(ctx, th, camX, 0, t); ctx.restore();
    ground(ctx, th, camX, t);
    ctx.restore();
  }

  // the chasing shadow, one per overworld
  function shadow(ctx, kind, x, size, t) {
    const k = 0.5 + 0.5 * Math.sin(t * 5);
    ctx.save(); ctx.translate(x, GY - 4); ctx.fillStyle = '#050505';
    const outline = (f) => glowStroke(ctx, k, f);
    if (kind === 0) {        // many-legged thing
      const R = 60 * size;
      ctx.beginPath(); ctx.ellipse(0, -R * 0.8, R, R * 0.75, 0, 0, 6.283); ctx.fill();
      for (let i = 0; i < 7; i++) { const a = -2.6 + i * 0.75, lx = Math.cos(a) * R * 1.1, step = Math.sin(t * 6 + i * 1.3) * 10 * size; ctx.lineWidth = 5 * size; ctx.strokeStyle = '#050505'; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * 0.6, -R * 0.9); ctx.lineTo(lx, -R * 0.4 - 8 * size); ctx.lineTo(lx + step, 0); ctx.stroke(); }
      outline(() => { ctx.beginPath(); ctx.ellipse(0, -R * 0.8, R, R * 0.75, 0, 0, 6.283); ctx.stroke(); });
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(R * 0.35, -R * 0.95, 6 * size, 0, 6.283); ctx.arc(R * 0.62, -R * 0.85, 5 * size, 0, 6.283); ctx.fill();
    } else if (kind === 1) { // bat swarm
      for (let i = 0; i < 14; i++) {
        const bx = -i * 26 * size + Math.sin(t * 2 + i) * 14, by = -90 * size - Math.abs(Math.sin(i * 1.7)) * 120 * size + Math.sin(t * 3 + i * 2) * 16, fl = Math.sin(t * 14 + i) * 9 * size, s = (0.7 + (i % 3) * 0.25) * size;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx - 14 * s, by - 12 * s - fl, bx - 28 * s, by + 2 * s); ctx.quadraticCurveTo(bx - 14 * s, by + 4 * s, bx, by + 7 * s); ctx.quadraticCurveTo(bx + 14 * s, by + 4 * s, bx + 28 * s, by + 2 * s); ctx.quadraticCurveTo(bx + 14 * s, by - 12 * s - fl, bx, by); ctx.fill();
        if (i % 2 === 0) outline(() => { ctx.beginPath(); ctx.moveTo(bx - 28 * s, by + 2 * s); ctx.quadraticCurveTo(bx - 14 * s, by - 12 * s - fl, bx, by); ctx.quadraticCurveTo(bx + 14 * s, by - 12 * s - fl, bx + 28 * s, by + 2 * s); ctx.stroke(); });
      }
    } else if (kind === 2) { // walking pillars
      for (let i = 0; i < 3; i++) { const px = -i * 90 * size, h = (200 - i * 30) * size, lean = Math.sin(t * 2.4 + i) * 0.05; ctx.save(); ctx.translate(px, 0); ctx.rotate(lean); ctx.fillRect(-26 * size, -h, 52 * size, h); ctx.fillRect(-34 * size, -h - 14 * size, 68 * size, 16 * size); outline(() => ctx.strokeRect(-26 * size, -h, 52 * size, h)); ctx.fillStyle = '#fff'; ctx.fillRect(-10 * size, -h + 30 * size, 7 * size, 7 * size); ctx.fillRect(6 * size, -h + 30 * size, 7 * size, 7 * size); ctx.fillStyle = '#050505'; ctx.restore(); }
    } else if (kind === 3) { // grinding gear
      const R = 110 * size; ctx.translate(0, -R + 6); ctx.rotate(-t * 1.6);
      ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); ctx.lineTo(Math.cos(a + 0.2) * R * 1.18, Math.sin(a + 0.2) * R * 1.18); ctx.lineTo(Math.cos(a + 0.4) * R * 1.18, Math.sin(a + 0.4) * R * 1.18); ctx.lineTo(Math.cos(a + 0.55) * R, Math.sin(a + 0.55) * R); } ctx.closePath(); ctx.fill();
      outline(() => { ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, R * 0.35, 0, 6.283); ctx.stroke(); });
    } else {                 // avalanche of shards
      for (let i = 0; i < 18; i++) { const sx = -i * 24 * size + Math.sin(i * 3.1) * 12, sh = (70 + (i % 5) * 34) * size, sw = (26 + (i % 3) * 12) * size, rr = Math.sin(t * 3 + i) * 0.06; ctx.save(); ctx.translate(sx, 0); ctx.rotate(rr); ctx.beginPath(); ctx.moveTo(-sw, 0); ctx.lineTo(0, -sh); ctx.lineTo(sw, 0); ctx.closePath(); ctx.fill(); if (i % 3 === 0) outline(() => { ctx.beginPath(); ctx.moveTo(-sw, 0); ctx.lineTo(0, -sh); ctx.lineTo(sw, 0); ctx.stroke(); }); ctx.restore(); }
    }
    ctx.restore();
  }

  function fade(ctx, a, color) { if (a > 0.002) { ctx.fillStyle = color || '#000'; ctx.globalAlpha = clamp(a, 0, 1); ctx.fillRect(0, 0, W, VH); ctx.globalAlpha = 1; } }

  // ---------- scenes ----------
  function intro(ctx, t) {
    const th = H.THEMES.forest;
    // dark night version of the forest
    scenery(ctx, th, t * 18, t, 1);
    ctx.fillStyle = `rgba(4,6,14,${0.86 - seg(t, 7, 12) * 0.5})`; ctx.fillRect(0, 0, W, VH);
    // stars
    for (let i = 0; i < 70; i++) { const sx = (i * 137.5) % W, sy = (i * 71.3) % 260; ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.35 * Math.sin(t * 2 + i)})`; ctx.fillRect(sx, sy, 2, 2); }
    // the light falls from the sky
    const fall = seg(t, 1.2, 4.6), ox = lerp(700, 430, fall) + Math.sin(t * 2) * 6, oy = lerp(-40, 330, fall) + (fall >= 1 ? Math.sin(t * 2.6) * 8 : 0);
    if (t > 1) { const trail = ctx.createLinearGradient(ox, oy, ox + 160, oy - 380); trail.addColorStop(0, 'rgba(255,255,255,.5)'); trail.addColorStop(1, 'rgba(255,255,255,0)'); ctx.strokeStyle = trail; ctx.lineWidth = 6 * (1 - fall * 0.8); ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + 160 * (1 - fall * 0.2), oy - 380 * (1 - fall * 0.3)); ctx.stroke(); }
    const wake = seg(t, 4.8, 6.6), stand = seg(t, 6.4, 7.6), walkK = seg(t, 7.8, 8.6);
    const hx = 300 + walkK * (t - 7.8) * 60;
    hero(ctx, hx, gy(hx, t * 18) + 2, t, { lie: 1 - wake, walk: walkK, reach: wake * (1 - walkK) * (stand > 0.2 ? 1 : 0), scale: 1.5 });
    // the light drifts ahead, hero follows
    let lx = ox, ly = oy;
    if (t > 6.4) { lx = lerp(ox, 640 + (t - 7) * 40, seg(t, 6.4, 8.4)); ly = lerp(oy, 300 + Math.sin(t * 2) * 12, seg(t, 6.4, 8.4)); }
    orb(ctx, lx, ly, t, 9, 1);
    // rings radiate when the light lands
    if (t > 4.4 && t < 7) { const r = (t - 4.4) * 130; ctx.strokeStyle = `rgba(255,255,255,${0.7 - (t - 4.4) * 0.27})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(430, 380, r, r * 0.25, 0, 0, 6.283); ctx.stroke(); }
    fade(ctx, 1 - t / 1.5); fade(ctx, seg(t, 11, 12));
  }

  function journey(ctx, t, n) {
    const D = DUR[n], A = H.THEMES[WORLD_IDS[n - 1]], B = H.THEMES[WORLD_IDS[n]];
    const cross = seg(t, D * 0.55, D * 0.9), camX = t * 70;
    scenery(ctx, A, camX, t, 1); if (cross > 0) scenery(ctx, B, camX, t, cross);
    // the light leads
    const hx0 = 280, lead = seg(t, 0, 1.5);
    const chase = seg(t, 2.4, 5.2), run = chase, jumpT = seg(t, 5.8, 7.0);
    const air = jumpT > 0 && jumpT < 1 ? Math.sin(jumpT * Math.PI) : 0;
    const hx = hx0 + jumpT * 180 + (t > 7 ? (t - 7) * 30 : 0), hy = gy(hx, camX) + 2 - air * 95;
    const ox = hx + 190 + 40 * Math.sin(t * 1.4) + jumpT * 120, oy = 300 - air * 60 + Math.sin(t * 2.3) * 14;
    // chasing shadow
    const sz = 0.5 + chase * 0.9, sx = lerp(-260, 120, chase) + (jumpT > 0 ? jumpT * 40 : 0);
    if (t > 2) { ctx.save(); ctx.globalAlpha = Math.min(1, (t - 2) * 0.9); shadow(ctx, n - 1, sx, sz, t); ctx.restore(); }
    // gap the hero leaps over
    if (t > 4.6 && t < 8.5) { const gxp = 560 - camX * 0 + (t - 4.6) * -0; ctx.fillStyle = '#000'; ctx.fillRect(gxp, GY - 6, 90, 140); }
    hero(ctx, hx, hy, t, { walk: 0.6 + run * 1.3, air, look: -run * 1, scale: 1.5 });
    orb(ctx, ox, oy, t, 8 + jumpT * 6, lead);
    // the light blooms and swallows the scene
    const bloom = seg(t, 7.2, D - 0.3);
    if (bloom > 0) { const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, 80 + bloom * 900); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.6, `rgba(255,255,255,${bloom})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, VH); }
    fade(ctx, 1 - t / 0.8); fade(ctx, seg(t, D - 0.5, D), '#fff');
  }

  function finale(ctx, t) {
    const D = DUR[5], th = H.THEMES.peaks;
    const dawn = seg(t, 7, 13);
    scenery(ctx, th, t * 20, t, 1);
    // rising sun made of rings
    const sunY = lerp(560, 230, dawn), sunR = 70 + dawn * 30;
    for (let i = 0; i < 6; i++) { ctx.strokeStyle = `rgba(255,255,255,${(0.5 - i * 0.07) * dawn})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(480, sunY, sunR + i * 26 + Math.sin(t * 1.5 + i) * 4, 0, 6.283); ctx.stroke(); }
    ctx.fillStyle = `rgba(255,255,255,${0.9 * dawn})`; ctx.beginPath(); ctx.arc(480, sunY, sunR, 0, 6.283); ctx.fill();
    // hero climbs to the summit and meets the light
    const walkK = 1 - seg(t, 4, 5), hx = lerp(150, 430, seg(t, 0.5, 5)), hyy = gy(hx, t * 20) + 2;
    const merge = seg(t, 5.2, 8);
    ctx.save(); ctx.globalAlpha = 1 - merge;
    hero(ctx, hx, hyy, t, { walk: walkK, reach: seg(t, 4.2, 5.2) * (1 - merge), scale: 1.5 });
    ctx.restore();
    // dissolve into particles
    if (merge > 0) for (let i = 0; i < 90; i++) { const a = i * 2.4 + t * 0.5, d = merge * (30 + (i % 9) * 22), px = hx + Math.cos(a) * d * 0.5, py = hyy - 40 - merge * 80 - Math.abs(Math.sin(a)) * d, s = 2.5 * (1 - merge * 0.6); ctx.fillStyle = `rgba(255,255,255,${(1 - merge) * 0.9})`; ctx.fillRect(px, py, s, s); }
    const lx = lerp(640, 460, seg(t, 2, 5.2)), ly = lerp(190, 330, seg(t, 2, 5.2)) + Math.sin(t * 2) * 6;
    orb(ctx, lx + merge * 20, ly - merge * 160, t, 9 + merge * 12, 1);
    // shapes converge, then bloom
    const bloom = seg(t, 9.5, 13);
    if (bloom > 0) { ctx.fillStyle = `rgba(255,255,255,${bloom})`; ctx.fillRect(0, 0, W, VH); }
    fade(ctx, 1 - t / 1.2); fade(ctx, seg(t, 13.1, 14));
    if (t > 13.1) { ctx.fillStyle = `rgba(0,0,0,${seg(t, 13.1, 14)})`; ctx.fillRect(0, 0, W, VH); }
  }

  H.story = {
    DURATION: DUR,
    draw(ctx, id, t) {
      ctx.save(); ctx.setTransform(ctx.getTransform()); // keep renderer scale
      if (id === 0) intro(ctx, t); else if (id === 5) finale(ctx, t); else journey(ctx, t, id);
      ctx.restore();
    },
  };
})(globalThis.Hollow = globalThis.Hollow || {});
