
/* ==========================================================================
   SECTION 21: SPLASH (JORJ) and the LISTENING ROOM
   The splash plays on load: four charcoal letters, each lit in turn by one
   survivor's color, then the building's name. Any input skips it.
   ========================================================================== */
const SPLASH_HUES = [[4, 72, 52], [176, 62, 44], [24, 92, 56], [268, 42, 66]];      // red scarf, teal windbreaker, orange hat, lavender sweater
const SPLASH_LEN = 3.6;
const SPLASH_GUIDE = { x: 480 - 90, y: 540 - 64, w: 180, h: 26 };   // the guide link under JORJ
class SplashScene {
  enter() { this.t = 0; this.done = false; this.motes = []; for (let i = 0; i < 46; i++) this.motes.push({ x: Math.random() * W, y: Math.random() * H, v: 4 + Math.random() * 10, r: 0.6 + Math.random() * 1.6, p: Math.random() * TAU }); }
  update(dt) {
    this.t += dt;
    for (const m of this.motes) { m.y -= m.v * dt; m.x += Math.sin(this.t * 0.6 + m.p) * 4 * dt; if (m.y < -4) { m.y = H + 4; m.x = Math.random() * W; } }
    const gb = SPLASH_GUIDE, pr = Input.ptr, overG = pr.x > gb.x && pr.x < gb.x + gb.w && pr.y > gb.y && pr.y < gb.y + gb.h;
    this.hov = overG && this.t > 1.6;
    if (this.hov && pr.click) { pr.click = false; openGuide(); this.t = Math.min(this.t, SPLASH_LEN - 1.2); Snd.sfx('page'); return; }   // 1.3: the guide link opens the PDF instead of skipping
    if (this.hov) this.t = Math.min(this.t, SPLASH_LEN - 0.4);
    if (!this.done && (this.t > SPLASH_LEN || (this.t > 0.35 && (Input.menu.any || Input.ptr.click)))) { this.done = true; if (this.t <= SPLASH_LEN) Snd.sfx('chime'); Game.go('Boot', {}, 'flicker'); }
  }
  render(ctx) {
    const t = this.t, cx = W / 2, cy = H / 2 - 22;
    ctx.fillStyle = G.ink; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 420); g.addColorStop(0, grey(48)); g.addColorStop(1, grey(8)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const m of this.motes) { ctx.fillStyle = grey(200, 0.18 + 0.12 * Math.sin(t * 2 + m.p)); ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fill(); }
    const letters = ['J', 'O', 'R', 'J'], step = 104, x0 = cx - step * 1.5;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    letters.forEach((L, i) => {
      const lt = clamp((t - 0.25 - i * 0.28) / 0.5, 0, 1), k = Ease.outBack(lt), x = x0 + i * step, y = cy + (1 - k) * 26;
      if (lt <= 0) return;
      const hue = SPLASH_HUES[i], glow = clamp((t - 0.6 - i * 0.28) / 0.6, 0, 1) * clamp((SPLASH_LEN - t) / 0.7, 0, 1);
      ctx.globalAlpha = lt;
      if (glow > 0) { const rg = ctx.createRadialGradient(x, y, 0, x, y, 78); rg.addColorStop(0, 'hsla(' + hue[0] + ',' + hue[1] + '%,' + hue[2] + '%,' + (0.42 * glow) + ')'); rg.addColorStop(1, 'hsla(' + hue[0] + ',' + hue[1] + '%,' + hue[2] + '%,0)'); ctx.fillStyle = rg; ctx.fillRect(x - 80, y - 80, 160, 160); }
      ctx.save(); ctx.translate(x, y); ctx.rotate((i % 2 ? 0.035 : -0.03) * (1 - glow * 0.5)); ctx.scale(0.8 + k * 0.2, 0.8 + k * 0.2);
      ctx.font = '900 128px Georgia, "Times New Roman", serif';
      ctx.lineWidth = 7; ctx.strokeStyle = grey(10); ctx.strokeText(L, 3, 4);                        // charcoal shadow
      ctx.fillStyle = grey(228); ctx.fillText(L, 0, 0);
      if (glow > 0) { ctx.globalAlpha = lt * glow * 0.85; ctx.fillStyle = 'hsl(' + hue[0] + ',' + hue[1] + '%,' + hue[2] + '%)'; ctx.fillText(L, 0, 0); ctx.globalAlpha = lt; }
      ctx.lineWidth = 1.2; ctx.strokeStyle = grey(60, 0.6); ctx.strokeText(L, 0, 0);
      ctx.restore();
    });
    ctx.restore(); ctx.globalAlpha = 1;
    const a2 = clamp((t - 1.55) / 0.6, 0, 1);
    if (a2 > 0) {
      ctx.globalAlpha = a2; ctx.fillStyle = grey(140); ctx.fillRect(cx - 150 * a2, cy + 82, 300 * a2, 1.5);
      txt(ctx, 'p r e s e n t s', cx, cy + 104, 13, G.bone, 'center', { outline: false });
      txt(ctx, 'ASHEN WINDOWS', cx, cy + 144, 22, G.paper, 'center', { serif: true, rot: -0.01 });
      txt(ctx, 'a quiet winter in Greywater', cx, cy + 168, 11, G.dust, 'center', { outline: false, normal: true });
      ctx.globalAlpha = 1;
    }
    const ga = clamp((t - 1.6) / 0.5, 0, 1) * clamp((SPLASH_LEN - t) / 0.4 + 0.3, 0, 1);
    if (ga > 0) { const b = SPLASH_GUIDE; ctx.globalAlpha = ga; ctx.strokeStyle = this.hov ? grey(230) : grey(120); ctx.lineWidth = 1; rrect(ctx, b.x, b.y, b.w, b.h, 6); ctx.stroke(); if (this.hov) { ctx.fillStyle = grey(255, 0.08); ctx.fill(); }
      txt(ctx, "Player's Guide (PDF)", b.x + b.w / 2, b.y + 17, 11, this.hov ? G.paper : G.bone, 'center', { outline: false }); ctx.globalAlpha = 1; }
    if (t > 0.8) { ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 3); txt(ctx, Input.last === 'touch' ? 'tap to skip' : 'press any key', W - 20, H - 18, 9, G.dust, 'right', { outline: false }); ctx.globalAlpha = 1; }
    Render.post(ctx, {});
  }
}

/* Listening Room: every track heard so far, and a way to play it. */
class ListenScene {
  enter() {
    this.t = 0; const heard = Save.data.heard || {}; if (TRACK_INFO.every(q => heard[q[0]])) unlock('listener');
    const items = TRACK_INFO.map(([id, n, d]) => ({ label: heard[id] ? n : '? ? ?', right: () => (Snd.track === id ? 'playing' : ''), sub: heard[id] ? d : 'Not heard yet. Keep playing.', dis: () => (heard[id] ? false : 'Not heard yet.'), act: () => { Snd.setTrack(id); Snd.sfx('select'); } }));
    items.push({ type: 'toggle', label: 'Toy piano', get: () => Snd.toy, set: v => { Snd.toy = v; }, hidden: () => !Save.data.ach.toypiano, sub: 'The hidden tune, on every track.' });
    this.menu = new Menu({ x: 30, y: 40, w: 420, key: 'listen', title: 'Listening Room', maxRows: 12, items, onBack: () => { Snd.toy = false; Game.go('Profile', {}, 'tear'); } });
  }
  update(dt) { this.t += dt; menuWeather(dt); this.menu.update(dt); }
  render(ctx) {
    Render.building(ctx, this.t, { x: 620 }); this.menu.render(ctx);
    const n = TRACK_INFO.filter(q => (Save.data.heard || {})[q[0]]).length;
    UI.paper(ctx, 520, 360, 410, 120, { seed: 77, rot: 0.006 });
    txt(ctx, 'Now playing', 540, 390, 13, G.ink, 'left', { outline: false, serif: true });
    const cur = TRACK_INFO.find(q => q[0] === Snd.track); txt(ctx, cur ? cur[1] : '...', 540, 412, 15, G.coal, 'left', { outline: false, serif: true });
    for (let i = 0; i < 24; i++) { const h = 4 + Math.abs(Math.sin(this.t * (1.3 + i * 0.21) + i)) * 18 * (Save.s.mute ? 0.1 : 1); ctx.fillStyle = grey(90 + i * 4); ctx.fillRect(540 + i * 15, 462 - h, 9, h); }
    txt(ctx, n + ' of ' + TRACK_INFO.length + ' heard', 910, 390, 10, G.iron, 'right', { outline: false });
    Render.post(ctx, {});
  }
}
/* Which theme plays on the landing: chapters in Story Mode, the season elsewhere. */
function homeTrack(run) {
  if (run.mode === 'story' && run.chapter >= 1) return 'ch' + clamp(run.chapter, 1, 5);
  const ph = Run.phase(run); return ['homeDay', 'ch3', 'ch4', 'ch5'][ph] || 'homeDay';
}
const PIANO_PHRASES = [[[0, 0], [2, 1], [4, 2], [7, 3], [6, 4.5], [4, 5], [2, 6], [4, 7.5]], [[4, 0], [3, 1], [2, 2], [0, 3], [1, 4], [2, 5], [-1, 6.5]],
  [[7, 0], [9, 1], [11, 2], [9, 3], [7, 4], [4, 5.5], [7, 6.5]], [[0, 0], [2, 1], [1, 2], [4, 3], [3, 4.5], [2, 5], [0, 6]]];
