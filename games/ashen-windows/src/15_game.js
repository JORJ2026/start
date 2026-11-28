
/* ==========================================================================
   SECTION 22: THE GAME OBJECT - scene state machine, overlays, common UI
   Owns the scene manager, event bus wiring, unified input, audio, save,
   RNG and config. Systems talk through the bus and the shared tables.
   ========================================================================== */
const SCENES = { Boot: BootScene, Title: TitleScene, ModeSelect: ModeSelectScene, CharacterPrep: CharacterPrepScene, Cutscene: CutsceneScene, HomeDay: HomeScene,
  NightSortie: SortieScene, NightHome: NightHome, DawnReport: DawnReportScene, Results: ResultsScene, StoryMap: StoryMapScene, Settings: SettingsScene,
  Credits: CreditsScene, Wardrobe: WardrobeScene, Profile: ProfileScene, Ending: EndingScene, Interlude: InterludeScene, Panel: PanelScene, Splash: SplashScene, Listen: ListenScene, Market: MarketScene, After: AfterScene, FieldGuide: FieldGuideScene, WalkMenu: WalkMenuScene, Walk: WalkScene, WalkInterlude: WalkInterludeScene, Unlocked: UnlockedScene };

const Game = {
  time: 0, alpha: 1, scene: null, name: '', run: null, ov: [], toasts: [], noteS: null, bannerS: null, players: [{ dev: 'main', sid: null }], padOwner: {}, p1Dev: 'main',
  trans: null, debug: DEBUG, fps: 60, ms: 16, iris: null, crashed: false, lowT: 0, padLostT: 0, toyNight: false, chimeT: 0, bus: Bus, input: Input, audio: Snd, save: Save, cfg: CFG,
  /* Scene change with a transition: tear, blinds, iris, or lamp flicker. */
  go(name, p, type) {
    if (!SCENES[name]) return;
    const fx = this.scene && this.scene.activeS && this.scene.w ? (this.scene.activeS(0) || {}).sx : null, fy = this.scene && this.scene.activeS && this.scene.w ? ((this.scene.activeS(0) || {}).sy || 300) - 24 : null;
    this.trans = { type: type || 'flicker', t: 0, dur: 0.34, phase: 'out', name, p: p || {}, fx, fy };
    Snd.sfx(type === 'tear' ? 'tear' : 'page');
  },
  switchTo(name, p) {
    if (this.scene && this.scene.exit) this.scene.exit();
    this.ov.length = 0; this.noteS = null; this.bannerS = null; Input.wantControls = false; Input.capture = null;
    this.scene = new SCENES[name](); this.name = name; this.scene.enter(p || {});
  },
  push(o) { this.bannerS = null; this.ov.push(o); }, pop() { this.ov.pop(); },
  toast(title, sub, icon) { if (this.toasts.length > 4) this.toasts.shift(); this.toasts.push({ title, sub: sub || '', icon: icon || 'star', t: 0 }); },
  note(text, dur) { this.noteS = { text, t: 0, max: dur || 4.5, st: { n: 0 } }; },
  banner(text, icon, dur) { this.bannerS = text ? { text, icon: icon || 'warn', t: dur || 4 } : null; },
  onBlur() { Input.clearAll(); if (this.scene instanceof PlayScene && !this.ov.length && !this.trans) this.scene.openPause(); },
  update(dt) {
    Input.beginStep(); this.time += dt;
    Tw.update(dt); Parts.update(dt); Floaters.update(dt);
    for (const sp of Render.laundry) { if (Math.random() < dt * 0.15) sp.kick(FX.r(-30, 30)); sp.step(dt); }
    const tr = this.trans;
    if (tr) { tr.t += dt; if (tr.phase === 'out' && tr.t >= tr.dur) { this.switchTo(tr.name, tr.p); if (this.trans === tr) { tr.phase = 'in'; tr.t = 0; } } else if (tr.phase === 'in' && tr.t >= tr.dur) this.trans = null; }
    if (!(this.trans && this.trans.phase === 'out')) {
      if (this.ov.length) this.ov[this.ov.length - 1].update(dt); else if (this.scene) this.scene.update(dt);
    }
    for (let i = this.toasts.length - 1; i >= 0; i--) { this.toasts[i].t += dt; if (this.toasts[i].t > 3.8) this.toasts.splice(i, 1); }
    if (this.noteS) { const n = this.noteS; n.t += dt; typeOut(n.st, n.text, dt, 50); if (n.t > n.max) this.noteS = null; }
    if (this.bannerS) { this.bannerS.t -= dt; if (this.bannerS.t <= 0) this.bannerS = null; }
    Snd.hope = this.run && /Home|Sortie|Panel|Dawn/.test(this.name) ? Run.avgMorale(this.run) / 100 : this.name === 'Ending' || this.name === 'Credits' ? 0.9 : 0.55;
    if (this.iris) { this.iris.t -= dt; if (this.iris.t <= 0) this.iris = null; }
    this.padLostT = Math.max(0, this.padLostT - dt); this.chimeT -= dt;
    Snd.update(dt);
  },
  render() {
    const ctx = Render.ctx, S = Render.S; ctx.setTransform(S, 0, 0, S, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = G.ink; ctx.fillRect(0, 0, W, H);
    if (this.scene) this.scene.render(ctx);
    for (const o of this.ov) o.render(ctx);
    this.renderCommon(ctx);
    const tr = this.trans; if (tr) Render.transition(ctx, tr.type, tr.phase === 'out' ? Ease.inOutQuad(clamp(tr.t / tr.dur, 0, 1)) : 1 - Ease.inOutQuad(clamp(tr.t / tr.dur, 0, 1)), tr.fx, tr.fy);
    Filters.post(ctx);
    if (this.debug) this.renderDebug(ctx);
  },
  /* Notes (subtitles), hazard banners, keepsake toasts, device hints. Shared by every scene. */
  renderCommon(ctx) {
    const t = this.time;
    if (this.iris) { const k = 1 - this.iris.t / 0.35; ctx.strokeStyle = grey(255, 1 - k); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(this.iris.x, this.iris.y, 70 * (1 - k) + 16, 0, TAU); ctx.stroke(); }
    const b = this.bannerS;
    if (b) { setFont(ctx, 12); const tw = Math.min(620, ctx.measureText(b.text).width + 54), x = W / 2 - tw / 2, y = 92, pulse = 0.5 + 0.5 * Math.sin(t * TAU * 2), a = clamp(b.t * 3, 0, 1);
      ctx.globalAlpha = a; ctx.fillStyle = grey(0, 0.8); rrect(ctx, x, y, tw, 28, 6); ctx.fill(); ctx.strokeStyle = grey(255, 0.45 + pulse * 0.5); ctx.lineWidth = 1.5 + pulse; ctx.setLineDash([7, 5]); ctx.stroke(); ctx.setLineDash([]);
      UI.icon(ctx, b.icon, x + 18, y + 14, 13, G.white); txt(ctx, b.text, x + 34, y + 18, 12, G.white, 'left', { outline: false }); ctx.globalAlpha = 1; }
    const n = this.noteS;
    if (n && Save.s.subtitles) { const shown = n.text.slice(0, n.st.n), lines = wrapText(ctx, n.text, 560, 11.5), h = lines.length * 16 * textScale() + 14, x = 330, y = (Input.touch && Input.last === 'touch' && Input.wantControls) ? 124 : H - 6 - h, a = clamp(Math.min(n.t * 5, (n.max - n.t) * 3), 0, 1);
      ctx.globalAlpha = a; UI.paper(ctx, x, y, 592, h, { seed: 17, jit: 2, plain: true, rot: -0.002 }); txtWrap(ctx, shown, x + 16, y + 20, 560, 11.5, G.ink, { outline: false, lh: 1.38 }); if (shown.length < n.text.length && Math.sin(t * 16) > 0) { ctx.fillStyle = G.ink; ctx.fillRect(x + 578, y + h - 12, 5, 2); } ctx.globalAlpha = 1; }
    this.toasts.forEach((to, i) => { const k = Ease.outBack(clamp(to.t / 0.3, 0, 1)) * clamp((3.8 - to.t) / 0.3, 0, 1), x = W - 250 * k - 6, y = 74 + i * 46;
      UI.paper(ctx, x, y, 244, 40, { seed: 23 + i, jit: 2, plain: true, rot: 0.01 }); if (!Save.s.reduce && to.t < 1.2) { const sx = x - 40 + to.t / 1.2 * 330; ctx.save(); ctx.beginPath(); ctx.rect(x, y, 244, 40); ctx.clip(); const sg = ctx.createLinearGradient(sx - 30, 0, sx + 30, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.55)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sg; ctx.fillRect(sx - 30, y, 60, 40); ctx.restore(); } UI.icon(ctx, to.icon, x + 18, y + 20, 13 * (1 + 0.4 * Math.max(0, 1 - to.t * 3)), G.ink); txt(ctx, to.title, x + 34, y + 17, 11, G.ink, 'left', { outline: false }); if (to.sub) txt(ctx, to.sub.slice(0, 40), x + 34, y + 31, 8.5, G.iron, 'left', { outline: false, normal: true }); });
    if (this.padLostT > 0) { UI.paper(ctx, W / 2 - 230, 200, 460, 60, { seed: 33 }); txt(ctx, 'A hand let go of the controller. Pick it up again?', W / 2, 236, 13, G.ink, 'center', { outline: false }); }
    if (Render.portrait) { UI.paper(ctx, W / 2 - 170, 6, 340, 26, { seed: 34, plain: true, jit: 1.5 }); txt(ctx, 'Rotate your phone for a wider view', W / 2, 24, 11, G.ink, 'center', { outline: false }); }
    if (Save.s.mute) txt(ctx, 'muted (M)', W - 8, 76, 9, G.fog, 'right', { normal: true });
  },
  renderDebug(ctx) {
    const sc = this.scene, w = sc && sc.w, lines = ['FPS ' + Math.round(this.fps) + '  ' + this.ms.toFixed(1) + 'ms  scale ' + Render.S.toFixed(2) + '  q ' + Parts.quality.toFixed(2), 'scene ' + this.name + '  overlays ' + this.ov.length + '  particles ' + Parts.live, 'entities ' + (w ? w.surv.length + w.npcs.length : 0) + '  input ' + Input.last + '  players ' + this.players.length];
    if (w) { for (const s of w.surv) lines.push(s.id + ': ' + s.anim + ' f' + s.f + ' x' + Math.round(s.x) + (s.pl >= 0 ? ' P' + (s.pl + 1) : '')); for (const n of w.npcs.slice(0, 8)) lines.push(n.type + '#' + n.id + ': ' + n.st + ' aw ' + n.aw.toFixed(2)); lines.push('tension ' + num(w.tension).toFixed(2) + '  noise ' + Math.round(w.noiseLvl)); }
    ctx.fillStyle = grey(0, 0.7); ctx.fillRect(W - 250, 120, 244, lines.length * 12 + 10);
    lines.forEach((l, i) => txt(ctx, l, W - 244, 134 + i * 12, 9, G.bone, 'left', { outline: false, normal: true, fixed: true }));
  }
};

/* ==========================================================================
   SECTION 23: EVENT BUS WIRING - audio, UI, achievements, narrator, Director
   ========================================================================== */
function wire() {
  Bus.on('firstInput', () => { Snd.init(); Snd.resume(); });
  Bus.on('toggleMute', () => { Save.s.mute = !Save.s.mute; Snd.applyVol(); Save.write(); });
  Bus.on('toggleDebug', () => { Game.debug = !Game.debug; });
  Bus.on('keyR', () => { if (Game.crashed) location.reload(); });
  Bus.on('note', d => Game.note(d.text, d.dur));
  Bus.on('uiTap', d => Parts.emit('spark', d.x, d.y, 4, { screen: true }));
  // scene-directed events are forwarded to whichever scene is live
  ['openCraft', 'openJournal', 'openCode', 'memory', 'radioScan', 'cardGame', 'catAdopted', 'hazardWarning', 'hazardFixed', 'craftComplete', 'needCritical', 'sortieExit', 'hit', 'goalReached',
    'keepsakeFound', 'survivorDown', 'catPet', 'setpieceDone', 'spotted', 'talkCiv', 'openTuner', 'signalChoice', 'raidLoot', 'censusFound'].forEach(ev => Bus.on(ev, d => { const s = Game.scene; if (s && s.on) s.on(ev, d); }));
  // audio and feel
  Bus.on('itemPickup', d => { Snd.sfx('pickup'); const w = Game.scene && Game.scene.w; if (w && d.s) { Parts.emit('glint', d.s.x, w.entY(d.s) - 44, 2, { sx: 14 }); if (d.s.jz <= 0 && !d.s.cl) { d.s.jv = 70; d.s.jz = 0.1; } } Save.data.stats.loot += d.n || 1; });
  Bus.on('moraleChange', d => { const w = Game.scene && Game.scene.w; if (d.v >= 3 && w && w.surv.indexOf(d.s) >= 0) { Parts.emit('ripple', d.s.x, w.entY(d.s) - 24, 1, { col: d.s.hueC() }); if (Game.chimeT <= 0) { Game.chimeT = 1.5; Snd.sfx('chime'); } } });
  Bus.on('hazardWarning', d => { Snd.sfx('rise', { d: 1.2 }); Snd.sting('warn'); Snd.duck(1.5); if (d.text) Game.banner(d.text, 'warn', 5); if (Game.run) Game.run.threats = num(Game.run.threats) + 1; });
  Bus.on('hazardImpact', d => { Input.rumble(0.7, 300); Input.haptic(40); if (Game.run && d.type && Run.once(Game.run, 'log' + d.type)) Run.log(Game.run, { tremor: 'Shelling close enough to rearrange the furniture.', fire: 'A fire. We are learning what we own by what we carried out.', flood: 'The cellar took on water.', gas: 'The stove gave us a fright.', stair: 'A stair gave way.', sniper: 'The watched street nearly kept one of us.', collapse: 'The platform went into the water behind us.', disease: 'Fever in the flat.', draft: 'The wind tried the flame.' }[d.type] || 'A bad moment.'); });
  Bus.on('spotted', () => { Snd.sting('warn'); Input.rumble(0.5, 200); if (Game.run) Game.run.threats = num(Game.run.threats) + 1; });
  Bus.on('closeCall', () => { Snd.sfx('heart'); });
  Bus.on('heartbeat', d => { Input.rumble(0.25 * d.t, 90); Input.haptic(12); });
  Bus.on('raiderWarning', () => { Snd.sting('warn'); Input.rumble(0.3, 500); });
  Bus.on('raiderImpact', () => { Input.rumble(0.5, 120); if (Game.run) Game.run.threats = num(Game.run.threats) + 1; });
  Bus.on('dayStart', () => { Snd.sfx('page'); });
  Bus.on('dawnStart', () => { Snd.sting('dawn'); Snd.toy = false; });
  Bus.on('nightStart', () => { if (Game.toyNight) { Snd.toy = true; Game.toyNight = false; } });
  Bus.on('weatherChange', d => { Snd.amb.rain = d.weather === 'rain' ? 0.6 : 0; });
  Bus.on('survivorDown', () => { Snd.sting('bad'); Snd.duck(3); });
  Bus.on('survivorLeaves', () => { Snd.sting('bad'); });
  Bus.on('survivorReturns', () => { Snd.sting('good'); });
  Bus.on('ceasefireRumor', () => { Snd.sting('good'); Snd.duck(2); });
  Bus.on('endingTriggered', () => { Snd.duck(3); });
  Bus.on('relationshipChange', d => { const w = Game.scene && Game.scene.w; if (w && d.v > 0 && w.surv.indexOf(d.a) >= 0) Floaters.add('trust', d.a.x, w.entY(d.a) - 66, { life: 1.4 }); });
  Bus.on('choiceMade', () => { Snd.sfx('page'); });
  Bus.on('achievementUnlocked', d => { Snd.sfx('unlock'); Game.toast('Keepsake: ' + ACH[d.id].n, ACH[d.id].d, 'star'); Save.write(); });
  Bus.on('padLost', d => {
    const i = Game.padOwner[d.dev];
    if (i != null) { Game.players.splice(i, 1); Game.padOwner = {}; Game.players.forEach((p, k) => { if (k > 0) Game.padOwner[p.dev] = k; }); if (Game.scene && Game.scene.markActive && Game.scene.w) Game.scene.markActive(); }
    if (i != null || Game.p1Dev === d.dev) { Game.padLostT = 6; if (Game.scene instanceof PlayScene && !Game.ov.length) Game.scene.openPause(); }
  });
  Bus.on('padFound', () => { Game.padLostT = 0; });
  // achievements, shown as Keepsakes
  Bus.on('sortieDone', d => { if (!d.failed && !d.spotted && d.loot > 0) unlock('quiethands'); if (d.full) unlock('spoons'); });
  Bus.on('helped', () => { unlock('neighbor'); Save.data.stats.kind++; });
  Bus.on('catAdopted', () => unlock('whiskers'));
  Bus.on('plantBloom', () => unlock('bloom'));
  Bus.on('musicBox', () => unlock('tune'));
  Bus.on('easter', d => { if (d.id === 'sandwich') unlock('sandwich'); });
  Bus.on('candleLit', () => { if (Game.run && Game.run.mode !== 'candle' && Run.phase(Game.run) >= 1) unlock('lastcandle'); });
  // narrator: small things worth a line in the diary
  Bus.on('theft', () => { if (Game.run) Run.tag(Game.run, 'theft'); });
  Bus.on('distraction', () => { Floaters.add('they went to look', W / 2, 120, { screen: true, life: 1.6 }); });
  Bus.on('lockpicked', () => Snd.sfx('unlock'));
}

/* ==========================================================================
   SECTION 24: MAIN LOOP - fixed 60 Hz update, interpolated render, delta cap,
   auto-pause on blur, adaptive quality, friendly failure screen
   ========================================================================== */
function crash(e) {
  if (Game.crashed) return; Game.crashed = true;
  try { const el = document.getElementById('err'); el.style.display = 'flex'; document.getElementById('errmsg').textContent = DEBUG && e ? String(e && e.stack || e) : ''; el.addEventListener('pointerdown', () => location.reload()); } catch (x) { /* nothing more to do */ }
  if (DEBUG && e) console.error(e);
}
function boot() {
  const canvas = document.getElementById('c');
  Save.load(); Parts.init(); Floaters.init(); Input.init(canvas); Render.init(canvas); wire();
  window.addEventListener('resize', () => Render.resize());
  window.addEventListener('orientationchange', () => setTimeout(() => Render.resize(), 200));
  window.addEventListener('blur', () => Game.onBlur());
  document.addEventListener('visibilitychange', () => { if (document.hidden) Game.onBlur(); });
  window.onerror = (msg, src, line, col, err) => { crash(err || msg); return false; };
  window.addEventListener('unhandledrejection', () => { /* audio resume promises may reject harmlessly */ });
  Game.switchTo('Splash', {});
  try { canvas.focus({ preventScroll: true }); } catch (e) { /* focus is optional */ }
  if (DEBUG) window.__ashen = { Game, Save, Input, Flow, Run, Render, Bus, Snd, Parts, adviceOverlay, bondsOverlay, adviceFor, MODES, Director, THREADS, momentDialog, useItem, supplyOverlay, craftOverlay, RECIPES, UPGRADES, Polish, Rig, UI, CUTS, V12, LOCS, buildSite: (...a) => buildSite(...a), walkLevel, WALK_STORY, ITEMS, FOES, NPCT, OBJDEF, SaveIO, FREE, itemPicker, TRAIT_NAME, HAZ, settingsItems, KEY_DEFAULT, Glow, SPRITE_LOG, SURVIVORS, CHAPTERS, HAZARDS, ENDINGS: typeof ENDINGS !== "undefined" ? ENDINGS : null };
  const STEP = 1 / CFG.stepHz; let last = 0, acc = 0, fpsAcc = 0, fpsN = 0;
  function frame(now) {
    if (Game.crashed) return;
    requestAnimationFrame(frame);
    try {
      if (!last) last = now;
      let dt = (now - last) / 1000; last = now;
      if (!Number.isFinite(dt) || dt < 0) dt = 0;
      if (dt > CFG.maxDelta) dt = CFG.maxDelta;                 // cap delta after a stall or a hidden tab
      Game.rdt = dt; fpsAcc += dt; fpsN++;
      if (fpsAcc >= 0.5) {
        Game.fps = fpsN / fpsAcc; Game.ms = fpsAcc / fpsN * 1000; fpsAcc = 0; fpsN = 0;
        // adaptive quality: step down if we stay under 45 FPS
        if (Game.fps < 45) { Game.lowT += 0.5; if (Game.lowT >= 3 && (!Render.cheap || Render.resScale > 0.62 || Parts.quality > 0.4)) { Game.lowT = 0; if (!Render.cheap) Render.cheap = true; else { Render.resScale = Math.max(0.6, Render.resScale - 0.15); Parts.quality = Math.max(0.35, Parts.quality - 0.25); Render.resize(); } } } else Game.lowT = Math.max(0, Game.lowT - 0.25);
      }
      Input.pollPads(dt);
      acc += dt; let steps = 0;
      while (acc >= STEP && steps < 6) { Game.update(STEP); acc -= STEP; steps++; }
      if (steps >= 6) acc = 0;
      Game.alpha = (Game.ov.length || Game.trans) ? 1 : clamp(acc / STEP, 0, 1);
      Game.render();
    } catch (e) { crash(e); }
  }
  requestAnimationFrame(frame);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

})();
