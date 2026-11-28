// World themes (same monochrome mood, different look per overworld),
// parallax backdrops, random weather (rain, snow, fog, smoke + lightning,
// drifting dust), film grain and vignette.
(function (H) {
  'use strict';
  const VW = 960, VH = 540;

  const THEMES = {
    forest:  { sky: ['#dedfd8', '#9d9e96'], ground: '#1b1c1a', edge: '#2f312c', far: 'rgba(60,62,56,.28)', near: 'rgba(30,31,28,.55)', shape: 'trees',   weather: ['rain', 'fog', 'none', 'rain', 'smoke'] },
    caves:   { sky: ['#55554f', '#1c1c1a'], ground: '#0c0c0b', edge: '#262622', far: 'rgba(20,20,18,.45)',  near: 'rgba(8,8,7,.7)',      shape: 'stalactites', weather: ['fog', 'smoke', 'none', 'fog'] },
    ruins:   { sky: ['#ddd3c0', '#8c8270'], ground: '#1f1b15', edge: '#3a3328', far: 'rgba(80,70,55,.25)',  near: 'rgba(40,34,26,.55)',  shape: 'columns', weather: ['fog', 'smoke', 'rain', 'none'] },
    factory: { sky: ['#c4c9ce', '#6f767d'], ground: '#14171a', edge: '#30363c', far: 'rgba(50,56,62,.3)',   near: 'rgba(22,25,28,.6)',   shape: 'chimneys', weather: ['smoke', 'rain', 'smoke', 'fog'] },
    peaks:   { sky: ['#f3f5f7', '#b3bcc6'], ground: '#20252b', edge: '#e8eef4', far: 'rgba(120,130,142,.35)', near: 'rgba(50,58,68,.55)', shape: 'mountains', weather: ['snow', 'snow', 'fog', 'none'] },
  };
  H.THEMES = THEMES;
  H.theme = (world) => THEMES[(world && world.level.world) || 'forest'] || THEMES.forest;

  function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  // ---------------- backdrop ----------------
  function drawBackdrop(ctx, theme, camX, camY, time) {
    for (const [layer, k, col] of [[0, 0.15, theme.far], [1, 0.4, theme.near]]) {
      ctx.fillStyle = col;
      const span = layer ? 150 : 230;
      const off = camX * k;
      const i0 = Math.floor(off / span) - 1, i1 = i0 + Math.ceil(VW / span) + 3;
      const base = VH * (layer ? 0.78 : 0.66) - camY * k * 0.3;
      for (let i = i0; i <= i1; i++) {
        const x = i * span - off + hash(i + layer * 99) * span * 0.6;
        const h = 0.5 + hash(i * 3.3 + layer) * 0.8;
        ctx.beginPath();
        switch (theme.shape) {
          case 'trees': {
            const w = 8 + h * 10 * (layer + 1), top = base - h * 260;
            ctx.rect(x - w / 2, top, w, VH);
            for (let b = 0; b < 3; b++) {
              const by = top + 40 + b * 50 * h, dir = b % 2 ? 1 : -1;
              ctx.moveTo(x, by); ctx.lineTo(x + dir * 50 * h, by - 30); ctx.lineTo(x + dir * 52 * h, by - 26); ctx.lineTo(x, by + 8);
            }
            break;
          }
          case 'stalactites': {
            const w = 20 + h * 40, len = 60 + h * 180;
            ctx.moveTo(x - w, -camY * k * 0.3 - 20); ctx.lineTo(x, len - camY * k * 0.3); ctx.lineTo(x + w, -camY * k * 0.3 - 20);
            ctx.moveTo(x + 40 - w, VH + 10); ctx.lineTo(x + 40, base + 60 - len * 0.5); ctx.lineTo(x + 40 + w, VH + 10);
            break;
          }
          case 'columns': {
            const w = 22 + 10 * layer, top = base - h * 200;
            ctx.rect(x - w / 2, top, w, VH);
            ctx.rect(x - w / 2 - 6, top - 10, w + 12, 10);
            if (hash(i * 7.7) > 0.5) { ctx.rect(x + w / 2, top + 10, span * 0.5, 14); }
            break;
          }
          case 'chimneys': {
            const w = 26 + 12 * layer, top = base - h * 280;
            ctx.rect(x - w / 2, top, w, VH);
            ctx.rect(x - w, base - 60 * h, w * 3, VH);
            break;
          }
          case 'mountains': {
            const w = 180 + h * 160, top = base - h * 230;
            ctx.moveTo(x - w, VH); ctx.lineTo(x, top); ctx.lineTo(x + w, VH);
            break;
          }
        }
        ctx.fill();
        if (theme.shape === 'chimneys' && layer === 0) {
          const top = base - h * 280;
          ctx.fillStyle = 'rgba(70,74,80,.16)';
          for (let pf = 0; pf < 4; pf++) {
            const t = (time * 0.25 + pf / 4 + hash(i)) % 1;
            ctx.beginPath(); ctx.arc(x + t * 60, top - 20 - t * 140, 14 + t * 40, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = col;
        }
        if (theme.shape === 'mountains' && layer === 0) {
          const top = base - h * 230, w = 180 + h * 160;
          ctx.fillStyle = 'rgba(255,255,255,.55)';
          ctx.beginPath(); ctx.moveTo(x - w * 0.18, top + 0.18 * (VH - top) * 0.4); ctx.lineTo(x, top); ctx.lineTo(x + w * 0.18, top + 0.18 * (VH - top) * 0.4); ctx.fill();
          ctx.fillStyle = col;
        }
      }
    }
  }


  // Abstract art layer: floating geometric shapes, rings, arcs, spirals and
  // shards behind the world, tinted per theme. Purely decorative.
  function drawAbstract(ctx, theme, camX, camY, time) {
    const ink = theme.near, k = 0.25, span = 170, off = camX * k;
    const i0 = Math.floor(off / span) - 2, i1 = i0 + Math.ceil(VW / span) + 4;
    ctx.save();
    ctx.strokeStyle = theme.far; ctx.fillStyle = theme.far; ctx.lineWidth = 2;
    for (let i = i0; i <= i1; i++) {
      const h = hash(i * 5.17 + 3), h2 = hash(i * 9.71 + 1);
      const x = i * span - off + h * 120 + Math.sin(time * 0.21 + i * 1.7) * 14, y = 40 + h2 * (VH * 0.55) - camY * k * 0.3 + Math.sin(time * 0.45 + i) * 12;
      const r = (14 + hash(i * 2.3) * 46) * (1 + 0.09 * Math.sin(time * 1.1 + i * 2.1)), rot = time * (h - 0.5) * 0.9 + h * 6;
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(time * 0.7 + i * 0.9);
      ctx.beginPath();
      switch (Math.floor(hash(i * 1.9) * 7)) {
        case 0: ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, Math.PI * 2); ctx.stroke(); break;
        case 1: for (let j = 0; j < 3; j++) { const a = rot + j * 2.094; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); break;
        case 2: ctx.arc(x, y, r, rot, rot + Math.PI * 1.2); ctx.stroke(); break;
        case 3: for (let j = 0; j < 40; j++) { const a = rot + j * 0.35, rr = j * r / 40; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.stroke(); break;
        case 4: ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillRect(-r * 0.15, -r, r * 0.3, r * 2); ctx.fillRect(-r, -r * 0.15, r * 2, r * 0.3); ctx.restore(); break;
        case 5: for (let j = 0; j < 5; j++) { ctx.moveTo(x - r, y + j * 9); ctx.lineTo(x + r, y + j * 9 - r * 0.4); } ctx.stroke(); break;
        default: { ctx.fillStyle = ink; ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.3, y); ctx.lineTo(x, y + r * 1.4); ctx.lineTo(x - r * 0.3, y); ctx.closePath(); ctx.fill(); ctx.fillStyle = theme.far; }
      }
    }
    ctx.restore();
  }

  // Second abstract layer: bold Bauhaus-style compositions (overlapping discs, half-moons, bars,
  // nested squares, dotted grids) on two parallax depths. Every shape drifts, turns or breathes slowly.
  function drawAbstract2(ctx, theme, camX, camY, time) {
    ctx.save();
    for (let layer = 0; layer < 2; layer++) {
      const k = layer ? 0.42 : 0.14, span = layer ? 330 : 470, off = camX * k, i0 = Math.floor(off / span) - 1;
      ctx.fillStyle = layer ? theme.near : theme.far; ctx.strokeStyle = layer ? theme.near : theme.far; ctx.lineWidth = layer ? 2.5 : 2;
      for (let i = i0; i <= i0 + Math.ceil(VW / span) + 2; i++) {
        const h = hash(i * 3.31 + layer * 17), h2 = hash(i * 7.77 + layer * 5);
        const x = i * span - off + h * 90 + Math.sin(time * 0.17 + i + layer) * 18;
        const y = 60 + h2 * (VH * 0.5) - camY * k * 0.2 + Math.sin(time * 0.33 + i * 1.3) * 10;
        const r = (30 + hash(i * 1.17 + layer) * 70) * (1 + 0.06 * Math.sin(time * 0.8 + i)), rot = time * (h - 0.5) * 0.35;
        ctx.globalAlpha = layer ? 0.55 : 0.8;
        switch (Math.floor(hash(i * 2.9 + layer * 3) * 6)) {
          case 0: ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.globalAlpha *= 0.6; ctx.beginPath(); ctx.arc(x + r * 0.6 + Math.sin(time * 0.4 + i) * 8, y + r * 0.2, r * 0.7, 0, 6.283); ctx.fill(); break;
          case 1: ctx.beginPath(); ctx.arc(x, y, r, rot, rot + Math.PI); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(x, y, r * 1.4, rot + Math.PI, rot + Math.PI * 2); ctx.stroke(); break;
          case 2: ctx.save(); ctx.translate(x, y); ctx.rotate(rot); for (let j = 0; j < 4; j++) ctx.strokeRect(-r + j * r * 0.28, -r + j * r * 0.28, (r - j * r * 0.28) * 2, (r - j * r * 0.28) * 2); ctx.restore(); break;
          case 3: for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) { ctx.beginPath(); ctx.arc(x + a * 16, y + b * 16, 2.5 + 1.6 * Math.sin(time * 1.4 + a + b * 0.7 + i), 0, 6.283); ctx.fill(); } break;
          case 4: ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5 + Math.sin(time * 0.25 + i) * 0.15); ctx.fillRect(-r * 1.6, -5, r * 3.2, 10); ctx.fillRect(-r * 1.1, 16, r * 2.2, 5); ctx.fillRect(-r * 0.6, 32, r * 1.2, 3); ctx.restore(); break;
          default: ctx.save(); ctx.translate(x, y); ctx.rotate(rot * 1.5); ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.9, r * 0.6); ctx.lineTo(-r * 0.9, r * 0.6); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, r * 0.05, r * 0.28, 0, 6.283); ctx.fill(); ctx.restore();
        }
      }
    }
    ctx.restore();
  }

  // Claustrophobic framing: a jagged overhang pressing down from the top,
  // dark encroaching shapes at the screen edges, drawn over the world.
  function drawEnclosure(ctx, theme, camX, camY, time) {
    ctx.save();
    ctx.fillStyle = 'rgba(8,8,8,.82)';
    const off = camX * 1.15, span = 48;
    ctx.beginPath(); ctx.moveTo(0, 0);
    const i0 = Math.floor(off / span) - 1;
    for (let i = i0; i <= i0 + Math.ceil(VW / span) + 2; i++) {
      const x = i * span - off, h = hash(i * 4.4 + 7);
      const d = (18 + h * 42 + (hash(i * 0.37) > 0.82 ? 70 * hash(i) : 0)) * (1 + 0.06 * Math.sin(time * 0.9 + i * 0.6));
      ctx.lineTo(x, d); ctx.lineTo(x + span * 0.5, d * (0.55 + 0.3 * hash(i + 2)));
    }
    ctx.lineTo(VW, 0); ctx.closePath(); ctx.fill();
    // hanging roots / cables / icicles
    ctx.strokeStyle = 'rgba(8,8,8,.75)'; ctx.lineWidth = 2;
    for (let i = i0; i <= i0 + Math.ceil(VW / span) + 2; i++) {
      if (hash(i * 2.71) < 0.6) continue;
      const x = i * span - off + 20, len = (40 + hash(i * 6.1) * 110) * (1 + 0.05 * Math.sin(time * 0.6 + i)), sw = Math.sin(time * 1.1 + i) * 9;
      ctx.beginPath(); ctx.moveTo(x, 20); ctx.quadraticCurveTo(x + sw, len * 0.6, x + sw * 1.5, len); ctx.stroke();
    }
    // side walls closing in
    const g1 = ctx.createLinearGradient(0, 0, 120, 0); g1.addColorStop(0, 'rgba(5,5,5,.85)'); g1.addColorStop(1, 'rgba(5,5,5,0)');
    const wb = 1 + 0.12 * Math.sin(time * 0.5);
    ctx.save(); ctx.scale(wb, 1); ctx.fillStyle = g1; ctx.fillRect(0, 0, 120, VH); ctx.restore();
    const g2 = ctx.createLinearGradient(VW, 0, VW - 120, 0); g2.addColorStop(0, 'rgba(5,5,5,.85)'); g2.addColorStop(1, 'rgba(5,5,5,0)');
    ctx.fillStyle = g2; ctx.fillRect(VW - 120, 0, 120, VH);
    // foreground silhouettes drifting past (fast parallax)
    ctx.fillStyle = 'rgba(4,4,4,.5)';
    const fo = camX * 1.6, fs = 700;
    for (let i = Math.floor(fo / fs) - 1; i <= Math.floor(fo / fs) + 2; i++) {
      if (hash(i * 3.9) < 0.45) continue;
      const x = i * fs - fo + hash(i) * 300 + Math.sin(time * 0.7 + i) * 6, w = (30 + hash(i * 8.8) * 50) * (1 + 0.05 * Math.sin(time * 1.3 + i));
      ctx.beginPath(); ctx.moveTo(x - w, VH); ctx.lineTo(x - w * 0.3, VH * (0.25 + hash(i * 1.3) * 0.3)); ctx.lineTo(x + w * 0.2, VH * 0.2); ctx.lineTo(x + w, VH); ctx.fill();
    }
    ctx.restore();
  }

  // ---------------- weather ----------------
  class Weather {
    constructor(theme, seed) {
      this.theme = theme;
      this.rng = seed || 1;
      this.type = 'none'; this.amount = 0;
      this.next = 'none'; this.timer = 3 + this.rand() * 6;
      this.parts = [];
      this.flash = 0; this.flashT = 4;
      this.grainSeed = 0;
      this.dust = Array.from({ length: 26 }, () => ({ x: this.rand() * VW, y: this.rand() * VH, s: this.rand() }));
      this.pick();
    }
    rand() { this.rng = (this.rng * 16807) % 2147483647; return (this.rng - 1) / 2147483646; }
    pick() {
      const opts = this.theme.weather;
      this.next = opts[Math.floor(this.rand() * opts.length)];
      this.timer = 15 + this.rand() * 25;
    }
    update(dt, camDX) {
      this.timer -= dt;
      if (this.timer <= 0) this.pick();
      if (this.type !== this.next) {
        this.amount -= dt * 0.5;
        if (this.amount <= 0) { this.amount = 0; this.type = this.next; this.parts = []; }
      } else this.amount = Math.min(1, this.amount + dt * 0.35);

      const want = { rain: 220, snow: 160, smoke: 22, fog: 9, none: 0 }[this.type] * this.amount;
      while (this.parts.length < want) this.parts.push(this.spawn(true));
      if (this.parts.length > want + 2) this.parts.length = Math.floor(want);
      for (const p of this.parts) {
        p.x += (p.vx * dt) - camDX * p.z; p.y += p.vy * dt; p.t += dt;
        if (this.type === 'snow') p.x += Math.sin(p.t * 1.7 + p.ph) * 20 * dt;
        if (p.y > VH + 40 || p.x < -260 || p.x > VW + 260 || p.y < -300) Object.assign(p, this.spawn(false));
      }
      for (const d of this.dust) { d.x -= camDX * (0.3 + d.s * 0.5) - Math.sin(d.y * 0.01) * 6 * dt; d.y -= (4 + d.s * 6) * dt; if (d.y < -5) d.y = VH + 5; d.x = ((d.x % VW) + VW) % VW; }
      if (this.type === 'rain' && this.amount > 0.6) {
        this.flashT -= dt;
        if (this.flashT <= 0) { this.flash = 1; this.flashT = 7 + this.rand() * 14; }
      }
      this.flash = Math.max(0, this.flash - dt * 2.5);
      this.grainSeed = (this.grainSeed + 1) % 8;
    }
    spawn(anywhere) {
      const r = () => this.rand();
      const y = anywhere ? r() * VH : -20;
      switch (this.type) {
        case 'rain': return { x: r() * (VW + 200) - 100, y, vx: -90, vy: 900 + r() * 300, z: 0.9, t: 0, len: 10 + r() * 14, ph: 0 };
        case 'snow': return { x: r() * (VW + 200) - 100, y, vx: -20, vy: 40 + r() * 50, z: 0.6 + r() * 0.5, t: 0, size: 1 + r() * 2.4, ph: r() * 6 };
        case 'smoke': return { x: anywhere ? r() * VW : VW + 150, y: VH * (0.3 + r() * 0.7), vx: -25 - r() * 30, vy: -8 - r() * 10, z: 0.5, t: 0, size: 80 + r() * 140, ph: 0 };
        case 'fog': return { x: anywhere ? r() * VW : VW + 250, y: VH * (0.4 + r() * 0.6), vx: -12 - r() * 14, vy: 0, z: 0.3, t: 0, size: 200 + r() * 200, ph: 0 };
        default: return { x: 0, y: VH + 100, vx: 0, vy: 0, z: 0, t: 0 };
      }
    }
    draw(ctx, opts) {
      const a = this.amount;
      if (this.type === 'rain') {
        ctx.strokeStyle = `rgba(40,42,44,${0.35 * a})`; ctx.lineWidth = 1;
        ctx.beginPath();
        for (const p of this.parts) { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.len * 0.1, p.y - p.len); }
        ctx.stroke();
        ctx.fillStyle = `rgba(60,62,64,${0.08 * a})`; ctx.fillRect(0, 0, VW, VH);
      } else if (this.type === 'snow') {
        ctx.fillStyle = `rgba(255,255,255,${0.85 * a})`;
        ctx.beginPath();
        for (const p of this.parts) { ctx.moveTo(p.x + p.size, p.y); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); }
        ctx.fill();
      } else if (this.type === 'smoke' || this.type === 'fog') {
        const col = this.type === 'fog' ? '235,235,230' : '60,60,58';
        for (const p of this.parts) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          const al = (this.type === 'fog' ? 0.22 : 0.18) * a * Math.min(1, p.t / 2);
          g.addColorStop(0, `rgba(${col},${al})`); g.addColorStop(1, `rgba(${col},0)`);
          ctx.fillStyle = g; ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        }
        if (this.type === 'fog') { ctx.fillStyle = `rgba(230,230,226,${0.12 * a})`; ctx.fillRect(0, 0, VW, VH); }
      }
      // drifting dust motes (always)
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      for (const d of this.dust) ctx.fillRect(d.x, d.y, 1 + d.s * 1.5, 1 + d.s * 1.5);
      if (this.flash > 0 && !opts.reducedFlashing) { ctx.fillStyle = `rgba(255,255,255,${0.45 * this.flash * this.flash})`; ctx.fillRect(0, 0, VW, VH); }
    }
  }

  // ---------------- VHS + heavy grain (optional, off by default) ----------------
  let vhsCanvas = null;
  function vhs(ctx, t) {
    const cv = ctx.canvas;
    if (!vhsCanvas) vhsCanvas = document.createElement('canvas');
    if (vhsCanvas.width !== cv.width || vhsCanvas.height !== cv.height) { vhsCanvas.width = cv.width; vhsCanvas.height = cv.height; }
    const g = vhsCanvas.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(cv, 0, 0);
    grain(ctx, Math.floor(t * 30) % 8, 1.0);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const w = cv.width, h = cv.height, s = w / 960;
    // colour-fringe ghosting
    ctx.globalAlpha = 0.2; ctx.drawImage(vhsCanvas, 3 * s, 0); ctx.globalAlpha = 0.14; ctx.drawImage(vhsCanvas, -3 * s, 0); ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(40,6,10,0.05)'; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'source-over';
    // rolling tracking band
    const by = ((t * 70) % (h / s + 120) - 60) * s, bh = 26 * s;
    ctx.drawImage(vhsCanvas, 0, by, w, bh, Math.sin(t * 37) * 9 * s, by, w, bh);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(0, by, w, bh);
    // occasional tear
    if ((t % 5) < 0.25) { const ty = ((t * 311) % 1) * h * 0.8, th = 8 * s; ctx.drawImage(vhsCanvas, 0, ty, w, th, 24 * s * Math.sin(t * 90), ty, w, th); }
    // scanlines + flicker
    ctx.fillStyle = 'rgba(0,0,0,0.17)'; for (let y = 0; y < h; y += 3 * s) ctx.fillRect(0, y, w, 1.2 * s);
    ctx.fillStyle = `rgba(255,255,255,${0.012 + 0.012 * Math.sin(t * 61)})`; ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // ---------------- grain + vignette overlay ----------------
  let grainCanvases = null;
  function grain(ctx, seed, strength) {
    if (!grainCanvases && typeof document !== 'undefined') {
      grainCanvases = [];
      for (let i = 0; i < 8; i++) {
        const c = document.createElement('canvas'); c.width = 240; c.height = 135;
        const g = c.getContext('2d'), img = g.createImageData(240, 135);
        for (let j = 0; j < img.data.length; j += 4) { const v = Math.random() * 255; img.data[j] = img.data[j + 1] = img.data[j + 2] = v; img.data[j + 3] = 26; }
        g.putImageData(img, 0, 0); grainCanvases.push(c);
      }
    }
    if (!grainCanvases) return;
    ctx.globalAlpha = strength;
    ctx.drawImage(grainCanvases[seed % 8], 0, 0, VW, VH);
    ctx.globalAlpha = 1;
    const v = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.35, VW / 2, VH / 2, VW * 0.65);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.72)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, VW, VH);
  }

  H.fx = { drawAbstract, drawAbstract2, drawEnclosure, drawBackdrop, Weather, grain, vhs, hash };
})(globalThis.Hollow = globalThis.Hollow || {});
