// ---------- main: load screen, fixed-step loop, pause, error recovery ----------
function pauseGame() {
  if (G.state !== 'play') return;
  G.state = 'paused'; Input.keys = {}; Input.mouse = false; Input.tCall = false;
  if (G.L && G.L.player) { G.L.player.charging = false; G.L.player.charge = 0; }
  AE.chargeStop(); AE.pauseIn(); AE.muffle(true);
  Input.showTouch(false); UI.pause();
}
function resumeGame() {
  if (G.state !== 'paused') return;
  UI.hide(); G.state = 'play'; Input.showTouch(true);
  Input.keys = {}; Input.pingLatch = false; Input.state.dash = false;
  AE.pauseOut(); AE.muffle(false);
}
let crashCount = 0;
function crash(err) {
  console.error(err);
  crashCount++;
  const box = document.getElementById('err');
  box.textContent = 'Something in the cave broke (' + (err && err.message ? err.message : err) + '). Your descent is kept at the start of the current depth.';
  box.style.display = 'block'; setTimeout(() => { box.style.display = 'none'; }, 7000);
  try { AE.humStop(); AE.chargeStop(); } catch (e) {}
  G.L = null; G.demo = null;
  try { UI.title(); } catch (e) {}
}
function update(dt) {
  Input.poll();
  if (G.state === 'play') updatePlay(dt);
  else if (G.state === 'dying') {
    const L = G.L; L.time += dt;
    const due = L.events.filter(e => e.at <= L.time); L.events = L.events.filter(e => e.at > L.time); for (const e of due) e.fn();
    G.dieT -= dt;
    if (G.dieT <= 0) { G.state = 'over'; UI.gameover(); }
  } else if (G.state === 'title' || G.state === 'boot') updateDemo(dt);
}
let last = performance.now(), acc = 0;
function frame(t) {
  let dt = (t - last) / 1000; last = t;
  if (!(dt >= 0)) dt = 0;
  if (dt > 0.25) dt = 0.25;
  acc += dt;
  try {
    Input.frame(dt);
    let n = 0;
    while (acc >= STEP && n < 8) { update(STEP); acc -= STEP; n++; }
    if (n >= 8) acc = 0;
    R.draw(dt);
  } catch (e) { crash(e); }
  requestAnimationFrame(frame);
}

// The load screen does real work (font, reverb impulse, noise beds, glow sprites, first cave),
// then waits for one key, tap or button: browsers only allow sound after a gesture.
const Boot = {
  waiting: false,
  prompt() {
    const set = Input.device === 'pad' ? Input.padStyle : Input.device === 'touch' ? 'touch' : 'kb';
    return set === 'touch' ? 'Tap to begin' : set === 'kb' ? 'Press any key to begin' : `Press <kbd class="k k-${set} round">${GLYPHS[set].confirm}</kbd> to begin`;
  },
  async run() {
    const fill = document.getElementById('bootFill'), msg = document.getElementById('bootMsg');
    const tips = ['Headphones help: hunters, drips and the way down are all placed in stereo.', 'A quiet chirp shows you the next room. A long call shows you everything, and shows everything you.', 'Bellflowers ring when called. Whatever hears them goes to them.', 'Lurkers ignore what drifts past them slowly.', 'Echoes show where a hunter was, not where it is.'];
    document.getElementById('bootTip').textContent = tips[Math.floor(Math.random() * tips.length)];
    const steps = [
      ['Listening for the typeface', () => Promise.race([document.fonts ? document.fonts.load('500 40px "EB Garamond"').catch(() => {}) : 0, new Promise(r => setTimeout(r, 1600))])],
      ['Shaping the cave reverb', () => AE.prepare()],
      ['Teaching the moths to glow', () => { R.init(); R.prewarm(); }],
      ['Carving the first cave', () => makeDemo()],
      ['Waking the colony', () => new Promise(r => setTimeout(r, 250))]
    ];
    const t0 = performance.now();
    for (let i = 0; i < steps.length; i++) {
      msg.textContent = steps[i][0];
      await new Promise(r => requestAnimationFrame(() => r()));
      await steps[i][1]();
      fill.style.transform = `scaleX(${(i + 1) / steps.length})`;
      if (i === 2) requestAnimationFrame(tt => { last = tt; frame(tt); });
    }
    const waitMore = 900 - (performance.now() - t0); if (waitMore > 0) await new Promise(r => setTimeout(r, waitMore));
    msg.textContent = 'Ready';
    const p = document.getElementById('bootPrompt'); p.innerHTML = this.prompt(); p.hidden = false;
    document.getElementById('boot').classList.add('ready');
    this.waiting = true;
    const go = () => this.go();
    document.getElementById('boot').addEventListener('pointerdown', go, { once: true });
  },
  go() {
    if (!this.waiting) return;
    this.waiting = false;
    AE.init(); AE.uiStart();
    const b = document.getElementById('boot'); b.classList.add('out');
    setTimeout(() => b.remove(), 900);
    UI.title();
  }
};
function boot() {
  Store.load(); Echo.init();
  document.documentElement.style.setProperty('--ui', Store.data.settings.uiScale);
  Input.init(); UI.init();
  document.body.dataset.device = Input.device;
  document.getElementById('pauseBtn').addEventListener('click', () => pauseGame());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pauseGame(); AE.suspend(true); } else AE.suspend(false);
  });
  addEventListener('error', e => { if (crashCount < 5) crash(e.error || e.message); });
  addEventListener('unhandledrejection', e => console.warn('unhandled', e.reason));
  // another tab saved: pick it up if we're idle on the title, so neither tab overwrites the other's progress
  addEventListener('storage', e => { if (e.key === SAVE_KEY && G.state === 'title') { Store.load(); applySettings(); UI.title(true); } });
  // audio can be suspended or interrupted by the system (calls, other apps); any input brings it back
  const wake = () => { if (!Boot.waiting && AE.ctx && AE.ctx.state !== 'running' && !document.hidden) AE.init(); };
  addEventListener('pointerdown', wake, true); addEventListener('keydown', wake, true);
  G.state = 'boot';
  Boot.run().catch(e => { console.error(e); crash(e); });
}
window.__TLD = { G, Store, Input, AE, Music, R, UI, Echo, Boot, genCave, buildLevel, newRun, startDepth, completeDepth, emitPing, castRay, los, takeBoon, loadRun, update, depthConfig, pauseGame, resumeGame, restartDepth, score, hurt, STEP, applySettings, clearRun, slotOf, saveRun, beat, versesKnown, kinFound, validRun, buildSafe, unstick, STORY, KIN,
  __hits: hitsWall, __noise: noiseEvent, __ring: ringBell, __lurk: (L, e, dt, p) => updLurker(L, e, dt, p, DIFFS[G.run.diff]) };
boot();
