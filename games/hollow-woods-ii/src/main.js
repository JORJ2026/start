// Game shell: fixed-timestep loop, state machine (title / play / pause / level
// end / game end), save slots, and the Export / Import save dialog.
(function (H) {
  'use strict';
  if (typeof document === 'undefined') return;

  const STEP = H.PHYS.STEP;
  const params = new URLSearchParams(location.search);
  const DEBUG = params.get('debug') === '1';

  class Game {
    constructor() {
      this.canvas = document.getElementById('game');
      this.renderer = new H.Renderer(this.canvas);
      this.input = new H.Input();
      this.input.attach(window);
      this.store = new H.SaveStore();
      if (this.store.data.bindings) this.input.setBindings(this.store.data.bindings);
      this.camera = new H.Camera();
      this.audio = new H.GameAudio(this.store);
      const unlock = () => { this.audio.unlock(); };
      window.addEventListener('keydown', unlock); window.addEventListener('pointerdown', unlock);
      this.state = 'splash'; this.splashT = 0;
      this.sel = this.store.active;
      this.mapSel = 0;
      this.pauseSel = 0;
      this.world = null;
      this.run = null; this.rSel = 0;
      this.slot = 0;
      this.levelIndex = 0;
      this.playBase = 0;
      this.banner = null;
      this.message = this.store.persistent ? '' : 'Browser storage is unavailable: progress lasts only until you close the tab. Use Export to keep it.';
      this.eraseArm = -1;
      this.menuRects = [];
      this.fps = 0; this.frameMs = 0;
      this.modal = new SaveDialog(this);

      window.addEventListener('resize', () => this.renderer.resize());
      this.canvas.addEventListener('mousemove', (e) => this.hover(e));
      this.canvas.addEventListener('click', (e) => this.click(e));
      window.addEventListener('beforeunload', () => this.persist());
      document.addEventListener('visibilitychange', () => { if (document.hidden) { this.persist(); if (this.state === 'play') this.state = 'pause'; } });

      const lv = params.get('level');
      if (DEBUG && lv && H.levels[lv]) { this.slot = this.store.active; this.loadLevel(H.LEVEL_ORDER.indexOf(lv), null, 0); }

      const rn = params.get('runner');
      if (DEBUG && rn) { this.startRunner(Math.max(0, Math.min(24, +rn - 1)), 0, 3, 0); if (params.get('vhs')) this.store.setSettings({ vhs: true }); }

      this.last = performance.now(); this.acc = 0;
      requestAnimationFrame((t) => this.frame(t));
    }

    // ---------------- loop ----------------
    frame(now) {
      const dt = Math.min(0.25, (now - this.last) / 1000);
      this.last = now;
      this.fps += ((dt > 0 ? 1 / dt : 60) - this.fps) * 0.05;
      this.acc += dt;
      const t0 = performance.now();
      while (this.acc >= STEP) { this.step(STEP); this.acc -= STEP; }
      this.frameMs += ((performance.now() - t0) - this.frameMs) * 0.1;
      this.draw(this.acc / STEP);
      requestAnimationFrame((t) => this.frame(t));
    }

    step(dt) {
      const inp = this.input;
      inp.poll();
      if (inp.pressed('mute') && !this.modal.open) this.toggleMute();
      if (!this.modal.open && (this.state === 'title' || this.state === 'map' || this.state === 'rmap' || this.state === 'pause' || this.state === 'runOver')) {
        if (inp.pressed('up') || inp.pressed('down') || inp.pressed('left') || inp.pressed('right')) this.audio.play('uiMove');
        if (inp.pressed('confirm') || inp.pressed('jump')) this.audio.play('uiSelect');
      }
      this.audio.update(this, dt);
      if (this.modal.open) return;
      if (this.banner) { this.banner.t += dt; if (this.banner.t > this.banner.dur) this.banner = null; }
      switch (this.state) {
        case 'splash':
          this.splashT += dt;
          if (this.splashT > 3.6 || (this.splashT > 0.4 && (inp.pressed('confirm') || inp.pressed('jump') || inp.pressed('pause')))) this.state = 'title';
          return;
        case 'cutscene': return this.stepCutscene(dt);
        case 'map': return this.stepMap();
        case 'rmap': return this.stepRMap();
        case 'runOver': return this.stepRunOver();
        case 'title': return this.stepTitle();
        case 'pause': return this.stepPause();
        case 'play': return this.stepPlay(dt);
        case 'levelEnd':
          this.endT += dt;
          if (this.endT > 2.2) this.nextLevel();
          return;
        case 'gameEnd':
          if (inp.pressed('confirm') || inp.pressed('pause')) { this.state = 'title'; this.sel = this.slot; }
          return;
      }
    }

    // ---------------- title ----------------
    titleItems() {
      const items = [];
      for (let i = 0; i < H.save.SLOT_COUNT; i++) {
        const s = this.store.slot(i);
        if (!s) items.push({ label: `Slot ${i + 1}  —  new game`, sub: 'empty' });
        else {
          const name = H.levels[s.level] ? H.levels[s.level].name : s.level;
          const mins = Math.floor(s.playTime / 60), secs = Math.floor(s.playTime % 60);
          items.push({
            label: `Slot ${i + 1}  —  ${s.finished ? 'all 50 levels complete' : name}`,
            sub: `${Math.min(50, s.unlocked || 0)}/50 levels cleared  ·  ${s.deaths} deaths  ·  ${mins}:${String(secs).padStart(2, '0')}` +
              (this.eraseArm === i ? '  ·  press Delete again to erase' : ''),
          });
        }
      }
      items.push({ label: `All Unlocked Mode: ${this.store.data.settings.allUnlocked ? 'ON' : 'OFF'}`, sub: 'pick any level from the map' });
      items.push({ label: 'Export all saves' });
      items.push({ label: 'Import saves' });
      items.push({ label: 'Endless Runner', sub: `25 long maps · 100 monsters + 100 obstacles each · best ${Math.round(this.store.data.settings.runnerBest || 0)} m` });
      return items;
    }

    stepTitle() {
      const inp = this.input, n = H.save.SLOT_COUNT + 4;
      if (inp.pressed('up')) { this.sel = (this.sel + n - 1) % n; this.eraseArm = -1; }
      if (inp.pressed('down')) { this.sel = (this.sel + 1) % n; this.eraseArm = -1; }
      if (inp.pressed('confirm') || inp.pressed('jump')) this.activateTitle(this.sel);
    }

    activateTitle(i) {
      if (i < H.save.SLOT_COUNT) return this.startSlot(i);
      if (i === H.save.SLOT_COUNT) return this.toggleAll();
      if (i === H.save.SLOT_COUNT + 1) return this.modal.showExport();
      if (i === H.save.SLOT_COUNT + 3) { this.state = 'rmap'; return; }
      return this.modal.showImport();
    }

    eraseSelected() {
      const i = this.sel;
      if (this.state !== 'title' || i >= H.save.SLOT_COUNT || !this.store.slot(i)) return;
      if (this.eraseArm === i) { this.store.clearSlot(i); this.eraseArm = -1; this.message = `Slot ${i + 1} erased.`; }
      else this.eraseArm = i;
    }

    startSlot(i) {
      this.slot = i;
      this.store.active = i;
      let s = this.store.slot(i);
      let fresh = false;
      if (!s) { fresh = true; s = { level: H.LEVEL_ORDER[0], cpIndex: 0, deaths: 0, playTime: 0, finished: false, unlocked: 0 }; this.store.saveSlot(i, s); }
      this.mapSel = Math.max(0, Math.min(this.unlocked(), H.LEVEL_ORDER.indexOf(s.level)));
      this.state = 'map'; this.world = null;
      if (fresh) this.startCutscene(0, () => { this.state = 'map'; });
    }

    startCutscene(id, after) { this.cut = { id, t: 0, after }; this.state = 'cutscene'; this.world = null; }

    stepCutscene(dt) {
      const c = this.cut, inp = this.input; c.t += dt;
      if ((c.t > 0.7 && (inp.pressed('confirm') || inp.pressed('jump') || inp.pressed('pause'))) || c.t >= H.story.DURATION[c.id]) { const f = c.after; this.cut = null; if (f) f(); }
    }

    drawCutscene() {
      const R = this.renderer, c = this.cut; if (!c) return;
      H.story.draw(R.ctx, c.id, c.t);
      if (c.t > 1.5 && c.t < 4.5) R.text('Space / Enter to skip', H.VIEW.W - 12, H.VIEW.H - 14, 11, 'right', 'rgba(255,255,255,.35)', 'system-ui, sans-serif');
    }

    unlocked() { if (this.store.data.settings.allUnlocked) return H.LEVEL_ORDER.length - 1; const s = this.store.slot(this.slot); return Math.min(H.LEVEL_ORDER.length - 1, (s && s.unlocked) || 0); }

    toggleAll() { this.store.setSettings({ allUnlocked: !this.store.data.settings.allUnlocked }); this.message = `All Unlocked Mode ${this.store.data.settings.allUnlocked ? 'on: every level is open' : 'off'}.`; }

    stepMap() {
      if (this.input.pressed('restart')) this.toggleAll();
      const inp = this.input, max = this.unlocked();
      let m = this.mapSel;
      if (inp.pressed('left')) m--;
      if (inp.pressed('right')) m++;
      if (inp.pressed('up')) m -= 10;
      if (inp.pressed('down')) m += 10;
      if (m !== this.mapSel) this.mapSel = Math.max(0, Math.min(max, m));
      if (inp.pressed('confirm') || inp.pressed('jump')) this.playLevel(this.mapSel);
      if (inp.pressed('pause')) { this.state = 'title'; this.sel = this.slot; }
    }

    playLevel(idx) {
      const s = this.store.slot(this.slot) || {};
      const id = H.LEVEL_ORDER[idx];
      this.loadLevel(idx, s.level === id ? s.snapshot : null, s.deaths || 0, s.playTime || 0);
    }

    loadLevel(idx, snapshot, deaths, playTime) {
      this.run = null; this.input.autoRun = false;
      this.levelIndex = idx;
      const lvl = H.levels[H.LEVEL_ORDER[idx]];
      const w = new H.World(lvl);
      if (snapshot && w.validSnapshot(snapshot)) w.restore(snapshot);
      w.deaths = deaths || 0;
      this.playBase = playTime || 0;
      w.onCheckpoint = () => { this.persist(); this.audio.play('checkpoint'); };
      w.onSound = (t, x, y, v) => this.audio.play(t, x, y, v);
      w.onDeath = (ww, cause) => this.audio.play('death', undefined, undefined, 1, cause);
      w.onFinish = () => { this.audio.play('finish'); this.state = 'levelEnd'; this.endT = 0; this.persist(true); };
      this.world = w;
      this.camera.snap(w);
      this.state = 'play';
      this.message = '';
      this.weather = new H.fx.Weather(H.theme(w), idx * 7919 + 17);
      const wi = H.WORLDS.findIndex((x) => x.id === lvl.world);
      this.banner = { text: `Overworld ${wi + 1}  ·  Level ${lvl.index + 1}`, sub: lvl.name, t: 0, dur: 3.2 };
      this.persist();
    }

    nextLevel() {
      const w = this.world;
      const deaths = w.deaths, time = this.playBase + w.time;
      if (this.levelIndex + 1 < H.LEVEL_ORDER.length) {
        this.mapSel = this.levelIndex + 1; this.state = 'map'; this.world = null;
        if ((this.levelIndex + 1) % 10 === 0) this.startCutscene((this.levelIndex + 1) / 10, () => { this.state = 'map'; });
      } else {
        this.store.saveSlot(this.slot, { level: H.LEVEL_ORDER[this.levelIndex], cpIndex: 0, deaths, playTime: time, finished: true, unlocked: H.LEVEL_ORDER.length });
        this.finalStats = { deaths, time };
        this.state = 'gameEnd'; this.world = null;
        this.startCutscene(5, () => { this.state = 'gameEnd'; });
      }
    }

    // Write the current run into its slot (checkpoint state, not mid-air state).
    persist(levelDone) {
      const w = this.world;
      if (this.run) { this.saveRunnerBest(); return; }
      if (!w || this.state === 'title' || this.state === 'gameEnd' || this.state === 'map') return;
      const prev = this.store.slot(this.slot) || {};
      let unlocked = prev.unlocked || 0;
      if (levelDone) unlocked = Math.max(unlocked, this.levelIndex + 1);
      let level = H.LEVEL_ORDER[this.levelIndex], snap = w.snap, cp = w.cpIndex;
      if (levelDone && this.levelIndex + 1 < H.LEVEL_ORDER.length) { level = H.LEVEL_ORDER[this.levelIndex + 1]; snap = undefined; cp = 0; }
      const rec = { level, cpIndex: cp, deaths: w.deaths, playTime: Math.round((this.playBase + w.time) * 10) / 10, finished: false, unlocked };
      if (snap) rec.snapshot = snap;
      this.store.saveSlot(this.slot, rec);
    }

    // ---------------- play / pause ----------------
    stepPlay(dt) {
      const inp = this.input, w = this.world;
      if (this.run) {
        const r = this.run; r.dist = Math.max(r.dist, r.base + w.player.x / 32);
        if (r.dying && w.deathT >= 1.0) { this.saveRunnerBest(); this.state = 'runOver'; this.overSel = 0; return; }
      }
      if (inp.pressed('pause')) { this.state = 'pause'; this.pauseSel = 0; this.persist(); return; }
      if (DEBUG && inp.pressed('debugSkip')) w.skipToNextCheckpoint();
      w.step(dt, inp);
      this.camera.update(w, dt);
      this.weather.update(dt, this.camera.x - this.camera.prevX);
    }

    pauseItems() {
      const vhs = `Grain + VHS effect: ${this.store.data.settings.vhs ? 'ON' : 'OFF'}`, snd = `Mute all sounds & noises: ${this.store.data.settings.muted ? 'ON' : 'OFF'}`;
      if (this.run) return [{ label: 'Resume', id: 'resume' }, { label: 'Restart from checkpoint', id: 'restart' }, { label: vhs, id: 'vhs' }, { label: snd, id: 'sound' }, { label: 'Export all saves', id: 'export' }, { label: 'Import saves', id: 'import' }, { label: 'Quit to title', id: 'quit' }];
      return [{ label: 'Resume', id: 'resume' }, { label: 'Restart from checkpoint', id: 'restart' }, { label: vhs, id: 'vhs' }, { label: 'Export all saves', id: 'export' }, { label: 'Import saves', id: 'import' }, { label: 'Overworld map', id: 'map' }, { label: 'Quit to title', id: 'quit' }, { label: snd, id: 'sound' }];
    }

    stepPause() {
      const inp = this.input, n = this.pauseItems().length;
      if (inp.pressed('pause')) { this.state = 'play'; return; }
      if (inp.pressed('restart')) return this.activatePause(1);
      if (inp.pressed('up')) this.pauseSel = (this.pauseSel + n - 1) % n;
      if (inp.pressed('down')) this.pauseSel = (this.pauseSel + 1) % n;
      if (inp.pressed('confirm') || inp.pressed('jump')) this.activatePause(this.pauseSel);
    }

    activatePause(i) {
      const it = this.pauseItems()[i]; if (!it) return;
      switch (it.id) {
        case 'resume': this.state = 'play'; break;
        case 'restart': this.world.respawn(); this.camera.snap(this.world); this.state = 'play'; break;
        case 'vhs': this.store.setSettings({ vhs: !this.store.data.settings.vhs }); break;
        case 'export': this.persist(); this.modal.showExport(); break;
        case 'import': this.persist(); this.modal.showImport(); break;
        case 'map': this.persist(); this.state = 'map'; this.mapSel = this.levelIndex; this.world = null; break;
        case 'quit': { const wasRun = !!this.run; this.persist(); this.run = null; this.input.autoRun = false; this.world = null; this.state = 'title'; this.sel = wasRun ? H.save.SLOT_COUNT + 3 : this.slot; break; }
        case 'sound': this.toggleMute(); break;
      }
    }

    // ---------------- Endless Runner ----------------
    saveRunnerBest() {
      const r = this.run; if (!r) return;
      if (r.dist > (this.store.data.settings.runnerBest || 0)) this.store.setSettings({ runnerBest: Math.round(r.dist) });
    }

    stepRMap() {
      const inp = this.input; let m = this.rSel;
      if (inp.pressed('left')) m--; if (inp.pressed('right')) m++; if (inp.pressed('up')) m -= 5; if (inp.pressed('down')) m += 5;
      this.rSel = Math.max(0, Math.min(24, m));
      if (inp.pressed('confirm') || inp.pressed('jump')) this.startRunner(this.rSel, 0, 3, 0);
      if (inp.pressed('pause')) { this.state = 'title'; this.sel = H.save.SLOT_COUNT + 3; }
    }

    startRunner(idx, lap, lives, base) {
      this.run = { idx, lap, lives, base, dist: base, dying: false };
      const lvl = H.runner.generate(idx), w = new H.World(lvl);
      this.input.autoRun = true;
      w.player.runScale = H.runner.speedScale(idx, lap);
      w.onCheckpoint = () => this.audio.play('checkpoint');
      w.onSound = (t, x, y, v) => this.audio.play(t, x, y, v);
      w.onDeath = (ww, cause) => { this.audio.play('death', undefined, undefined, 1, cause); const r = this.run; if (r && !r.dying && !this.store.data.settings.allUnlocked) { r.lives--; if (r.lives <= 0) r.dying = true; } };
      w.onFinish = () => {
        this.audio.play('finish');
        const r = this.run, cols = lvl.stats.columns;
        let ni = r.idx + 1, nl = r.lap; if (ni >= 25) { ni = 0; nl++; }
        this.startRunner(ni, nl, Math.min(3, r.lives + 1), r.base + cols);
      };
      this.world = w; this.camera.snap(w); this.state = 'play'; this.message = '';
      this.weather = new H.fx.Weather(H.theme(w), idx * 7919 + 17 + lap * 31);
      this.banner = { text: `Endless Runner  ·  Map ${idx + 1} of 25${lap ? '  ·  Lap ' + (lap + 1) : ''}`, sub: lvl.name, t: 0, dur: 3.2 };
    }

    stepRunOver() {
      const inp = this.input;
      if (inp.pressed('up')) this.overSel = (this.overSel + 2) % 3;
      if (inp.pressed('down')) this.overSel = (this.overSel + 1) % 3;
      if (inp.pressed('confirm') || inp.pressed('jump')) this.activateRunOver(this.overSel);
    }

    activateRunOver(i) {
      const r = this.run;
      if (i === 0) this.startRunner(r.idx, r.lap, 3, r.base);
      else if (i === 1) { this.run = null; this.input.autoRun = false; this.world = null; this.state = 'rmap'; }
      else { this.run = null; this.input.autoRun = false; this.world = null; this.state = 'title'; this.sel = H.save.SLOT_COUNT + 3; }
    }

    drawRunHud(w) {
      const R = this.renderer, V = H.VIEW, r = this.run, ctx = R.ctx;
      const cols = w.level.stats.columns, prog = Math.max(0, Math.min(1, w.player.x / 32 / cols));
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(14, 12, 270, 56); ctx.restore();
      R.text(`${r.idx + 1}/25  ${w.level.name}${r.lap ? '  ·  lap ' + (r.lap + 1) : ''}`, 24, 26, 12.5, 'left', '#ddd', 'system-ui, sans-serif');
      R.text(`${this.store.data.settings.allUnlocked ? '♥ ∞' : '♥'.repeat(Math.max(0, r.lives))}   ${Math.round(r.dist)} m`, 24, 46, 14, 'left', '#fff', 'system-ui, sans-serif');
      ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(24, 58, 250, 4); ctx.fillStyle = '#fff'; ctx.fillRect(24, 58, 250 * prog, 4); ctx.restore();
    }

    drawRMap() {
      const R = this.renderer, ctx = R.ctx, V = H.VIEW, now = performance.now() / 1000;
      ctx.fillStyle = '#0b0b0b'; ctx.fillRect(0, 0, V.W, V.H);
      R.text('Endless Runner', V.W / 2, 40, 32, 'center', '#e8e8e2');
      R.text('You run on your own. Jump with Space, slide with S. 3 lives (infinite in All Unlocked Mode); finish a map to earn one back.', V.W / 2, 70, 13, 'center', '#888', 'system-ui, sans-serif');
      for (let wi = 0; wi < 5; wi++) {
        const wd = H.WORLDS[wi], th = H.THEMES[wd.id], y = 92 + wi * 70;
        const g = ctx.createLinearGradient(0, y, 0, y + 60); g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
        ctx.fillStyle = g; ctx.fillRect(60, y, V.W - 120, 60);
        R.text(wd.name, 72, y + 12, 13, 'left', wd.id === 'caves' ? '#ddd' : '#151515', 'system-ui, sans-serif');
        for (let k = 0; k < 5; k++) {
          const idx = wi * 5 + k, x = 250 + k * 120, cy = y + 36, sel = idx === this.rSel;
          ctx.save(); if (sel) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 12 + 6 * Math.sin(now * 4); }
          ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x, cy, sel ? 17 : 13, 0, 6.283); ctx.fill();
          if (sel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
          ctx.restore(); R.text(String(idx + 1), x, cy + 1, 12, 'center', '#eee', 'system-ui, sans-serif');
        }
      }
      R.text(H.runner.mapName(this.rSel) + `  ·  100 monsters  ·  100 obstacles  ·  best ${Math.round(this.store.data.settings.runnerBest || 0)} m`, V.W / 2, V.H - 30, 14, 'center', '#bbb', 'system-ui, sans-serif');
      R.text('Arrows choose · Space/Enter run · Esc back', V.W / 2, V.H - 11, 11.5, 'center', '#666', 'system-ui, sans-serif');
    }

    toggleMute() {
      this.audio.unlock();
      this.store.setSettings({ muted: !this.store.data.settings.muted });
      this.message = `Sound ${this.store.data.settings.muted ? 'off' : 'on'}.`;
    }

    // After a successful import, reload everything from the store.
    afterImport() {
      if (this.store.data.bindings) this.input.setBindings(this.store.data.bindings);
      this.world = null;
      this.state = 'splash'; this.splashT = 0;
      this.sel = this.store.active;
      this.mapSel = 0;
      this.message = 'Saves imported.';
    }

    drawSplash() {
      const R = this.renderer, ctx = R.ctx, V = H.VIEW, t = this.splashT;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, V.W, V.H);
      const a = Math.max(0, Math.min(1, t / 0.9, (3.6 - t) / 0.7));
      ctx.save();
      ctx.shadowColor = `rgba(255,255,255,${0.6 * a})`; ctx.shadowBlur = 24 + 8 * Math.sin(t * 3);
      R.text('JORJ', V.W / 2, V.H / 2 - 10, 96, 'center', `rgba(240,240,235,${a})`);
      ctx.restore();
      R.text('presents', V.W / 2, V.H / 2 + 62, 15, 'center', `rgba(150,150,145,${a})`, 'system-ui, sans-serif');
      H.fx.grain(ctx, Math.floor(t * 24), 0.8);
    }

    drawMap() {
      const R = this.renderer, ctx = R.ctx, V = H.VIEW;
      ctx.fillStyle = '#0b0b0b'; ctx.fillRect(0, 0, V.W, V.H);
      R.text('Overworlds', V.W / 2, 40, 32, 'center', '#e8e8e2');
      const max = this.unlocked(), rowH = 84, top = 76;
      const now = performance.now() / 1000;
      H.WORLDS.forEach((wd, wi) => {
        const th = H.THEMES[wd.id], y = top + wi * rowH;
        ctx.save(); ctx.beginPath(); ctx.rect(60, y, V.W - 120, rowH - 10); ctx.clip();
        const g = ctx.createLinearGradient(0, y, 0, y + rowH - 10);
        g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
        ctx.fillStyle = g; ctx.fillRect(60, y, V.W - 120, rowH - 10);
        ctx.translate(0, y - 300); H.fx.drawAbstract(ctx, th, wi * 400 + now * 8, 0, now); H.fx.drawBackdrop(ctx, th, wi * 400 + now * 8, 0, now);
        ctx.restore();
        ctx.fillStyle = th.ground; ctx.fillRect(60, y + rowH - 24, V.W - 120, 14);
        R.text(`${wi + 1}. ${wd.name}`, 72, y + 14, 14, 'left', wd.id === 'caves' ? '#ddd' : '#151515', 'system-ui, sans-serif');
        for (let li = 0; li < 10; li++) {
          const idx = wi * 10 + li, x = 160 + li * 72, cy = y + 42;
          const locked = idx > max, sel = idx === this.mapSel;
          ctx.save();
          if (sel) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 12 + 6 * Math.sin(now * 4); }
          ctx.fillStyle = locked ? 'rgba(30,30,30,.4)' : (idx < max ? '#111' : '#333');
          ctx.beginPath(); ctx.arc(x, cy, sel ? 15 : 12, 0, Math.PI * 2); ctx.fill();
          if (sel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
          ctx.restore();
          R.text(locked ? '·' : String(li + 1), x, cy + 1, 12, 'center', locked ? '#888' : '#eee', 'system-ui, sans-serif');
        }
      });
      const lvl = H.levels[H.LEVEL_ORDER[this.mapSel]];
      R.text(`${lvl.name}  ·  ${lvl.stats.interactiveTotal} items to use  ·  ${lvl.stats.obstacleTotal} obstacles`, V.W / 2, V.H - 30, 14, 'center', '#bbb', 'system-ui, sans-serif');
      R.text(this.store.data.settings.allUnlocked ? 'ALL UNLOCKED MODE · R to turn off · Arrows choose · Space/Enter play · Esc back' : 'Arrows choose · Space/Enter play · Esc back · R: All Unlocked Mode', V.W / 2, V.H - 11, 11.5, 'center', '#666', 'system-ui, sans-serif');
    }

    // ---------------- mouse ----------------
    hitIndex(e) {
      const p = this.renderer.toView(e.clientX, e.clientY);
      return this.menuRects.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
    }
    hover(e) {
      if (this.modal.open) return;
      const i = this.hitIndex(e);
      if (i < 0) return;
      if (this.state === 'title') this.sel = i; else if (this.state === 'pause') this.pauseSel = i;
    }
    click(e) {
      if (this.modal.open) return;
      const i = this.hitIndex(e);
      if (i < 0) return;
      if (this.state === 'title') this.activateTitle(i);
      else if (this.state === 'pause') this.activatePause(i);
      else if (this.state === 'runOver') this.activateRunOver(i);
    }

    // ---------------- draw ----------------
    draw(alpha) {
      const R = this.renderer, V = H.VIEW;
      this.menuRects = [];
      if (this.state === 'splash') return this.drawSplash();
      if (this.state === 'cutscene') return this.drawCutscene();
      if (this.state === 'map') return this.drawMap();
      if (this.state === 'rmap') return this.drawRMap();
      if (this.state === 'title') {
        this.menuRects = R.drawMenu('Hollow Woods II', 'v2.0', this.titleItems(), this.sel, {
          solid: true, top: 100,
          footer: 'Arrows / W S to choose · Space or Enter to start · Delete erases a slot · M mutes · Esc pauses',
          message: this.message,
        });
        R.text('Move A/D · Jump Space/W · Grab, push, pull & levers Shift/E · Climb W/S · Crouch S', V.W / 2, V.H - 80, 12.5, 'center', '#555', 'system-ui, sans-serif');
        return;
      }
      const w = this.world;
      R.drawWorld(w, this.camera, alpha, DEBUG, this.weather, this.store.data.settings);
      if (this.store.data.settings.vhs) H.fx.vhs(R.ctx, performance.now() / 1000);
      if (this.run) this.drawRunHud(w);
      if (this.banner) {
        const b = this.banner, k = Math.min(1, b.t / 0.6, (b.dur - b.t) / 0.8);
        R.text(b.text, V.W / 2, V.H * 0.32, 15, 'center', `rgba(20,20,20,${0.75 * k})`, 'system-ui, sans-serif');
        R.text(b.sub, V.W / 2, V.H * 0.32 + 34, 34, 'center', `rgba(15,15,15,${0.85 * k})`);
      }
      if (this.state === 'pause') {
        this.menuRects = R.drawMenu('Paused', this.run ? `Endless Runner: ${w.level.name}` : `Chapter ${this.levelIndex + 1}: ${w.level.name}`, this.pauseItems(), this.pauseSel, { footer: 'Esc resume · R restart from checkpoint · M mutes' });
      } else if (this.state === 'runOver') {
        const r = this.run;
        this.menuRects = R.drawMenu('Out of lives', `${Math.round(r.dist)} m run  ·  best ${Math.round(this.store.data.settings.runnerBest || 0)} m`, [{ label: 'Try this map again' }, { label: 'Choose another map' }, { label: 'Quit to title' }], this.overSel, { solid: true, top: 190 });
      } else if (this.state === 'levelEnd') {
        const k = Math.min(1, this.endT / 0.8);
        R.ctx.fillStyle = `rgba(0,0,0,${k})`; R.ctx.fillRect(0, 0, V.W, V.H);
        R.text(`${w.level.name} — complete`, V.W / 2, V.H / 2, 30, 'center', `rgba(230,230,225,${k})`);
      } else if (this.state === 'gameEnd') {
        const s = this.finalStats || { deaths: 0, time: 0 };
        R.drawMenu('The End', `All 5 overworlds · ${H.LEVEL_ORDER.length} levels · ${s.deaths} deaths · ${Math.floor(s.time / 60)} min`, [{ label: 'Back to title' }], 0, { solid: true, top: 190 });
      }
      if (DEBUG && w) {
        const p = w.player, st = w.level.stats;
        R.drawDebugHud([
          `fps ${this.fps.toFixed(0)}  sim ${this.frameMs.toFixed(2)} ms`,
          `level ${w.id}  cp ${w.cpIndex}/${w.checkpoints.length - 1}  deaths ${w.deaths}`,
          `pos ${(p.x / 32).toFixed(1)}, ${(p.y / 32).toFixed(1)}  ${p.state}${p.grab ? ' grab' : ''}${p.pushing ? ' push' : ''}`,
          `vel ${p.vx.toFixed(0)}, ${p.vy.toFixed(0)}`,
          `items ${st.interactiveTotal}  obstacles ${st.obstacleTotal}`,
          'N: next checkpoint',
        ]);
      }
    }
  }

  // ---------------- Export / Import dialog (DOM) ----------------
  class SaveDialog {
    constructor(game) {
      this.game = game;
      this.open = false;
      this.el = document.getElementById('modal');
      this.title = this.el.querySelector('.m-title');
      this.desc = this.el.querySelector('.m-desc');
      this.text = this.el.querySelector('textarea');
      this.msg = this.el.querySelector('.m-msg');
      this.file = this.el.querySelector('input[type=file]');
      this.btn = {
        download: this.el.querySelector('[data-act=download]'),
        copy: this.el.querySelector('[data-act=copy]'),
        choose: this.el.querySelector('[data-act=choose]'),
        doImport: this.el.querySelector('[data-act=import]'),
        close: this.el.querySelector('[data-act=close]'),
      };
      this.btn.close.onclick = () => this.hide();
      this.btn.download.onclick = () => this.download();
      this.btn.copy.onclick = () => this.copy();
      this.btn.choose.onclick = () => this.file.click();
      this.btn.doImport.onclick = () => this.importText(this.text.value);
      this.file.onchange = () => {
        const f = this.file.files && this.file.files[0];
        if (!f) return;
        if (f.size > 2 * 1024 * 1024) { this.say('That file is too large to be a Hollow save.', true); return; }
        f.text().then((t) => { this.text.value = t; this.importText(t); }).catch(() => this.say('Could not read that file.', true));
        this.file.value = '';
      };
      this.el.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); this.hide(); } e.stopPropagation(); });
    }

    show(mode) {
      this.open = true; this.mode = mode;
      this.game.input.enabled = false; this.game.input.keys.clear();
      this.el.hidden = false;
      this.say('');
      const exp = mode === 'export';
      this.btn.download.hidden = !exp; this.btn.copy.hidden = !exp;
      this.btn.choose.hidden = exp; this.btn.doImport.hidden = exp;
      this.text.readOnly = exp;
    }
    hide() {
      this.open = false; this.el.hidden = true;
      this.game.input.enabled = true; this.game.input.keys.clear();
      this.game.canvas.focus();
    }
    say(t, bad) { this.msg.textContent = t; this.msg.className = 'm-msg' + (bad ? ' bad' : t ? ' good' : ''); }

    showExport() {
      this.show('export');
      this.title.textContent = 'Export all saves';
      this.desc.textContent = 'This file holds all three save slots, your settings and key bindings. Download it (or copy the text), then use Import saves in any other browser to carry on where you left off.';
      this.text.value = this.game.store.exportText();
      let framed = false;
      try { framed = window.top !== window.self; } catch (e) { framed = true; }
      if (framed) this.desc.textContent += ' (This preview may block downloads. If so, use Copy text and save it as a .json file.)';
      this.btn.download.focus();
    }
    showImport() {
      this.show('import');
      this.title.textContent = 'Import saves';
      this.desc.textContent = 'Choose a Hollow save file, or paste its text below. The file is checked before anything is replaced; importing overwrites all three slots in this browser.';
      this.text.value = '';
      this.text.focus();
    }

    download() {
      const store = this.game.store;
      try {
        const blob = new Blob([store.exportText()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = store.exportFileName();
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        this.say(`Downloaded ${a.download}. If nothing downloaded, use Copy instead.`);
      } catch (e) {
        this.say('Download was blocked here. Use Copy and paste the text into a file.', true);
      }
    }
    copy() {
      const t = this.text.value;
      const ok = () => this.say('Copied. Paste it into Import saves in the other browser.');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, () => this.copyFallback(ok));
      else this.copyFallback(ok);
    }
    copyFallback(ok) {
      this.text.readOnly = false; this.text.select();
      try { document.execCommand('copy'); ok(); } catch (e) { this.say('Select the text and copy it manually (Ctrl/Cmd+C).', true); }
      this.text.readOnly = true;
    }
    importText(t) {
      if (!t || !t.trim()) { this.say('Choose a file or paste save text first.', true); return; }
      const res = this.game.store.importText(t);
      if (!res.ok) { this.say(res.error + ' Nothing was changed.', true); return; }
      this.game.afterImport();
      this.say('Imported. All slots, settings and key bindings were restored.');
      setTimeout(() => this.hide(), 900);
    }
  }

  window.addEventListener('keydown', (e) => {
    if ((e.code === 'Delete' || e.code === 'Backspace') && H.game && !H.game.modal.open) { e.preventDefault(); H.game.eraseSelected(); }
  });
  window.addEventListener('DOMContentLoaded', () => { H.game = new Game(); });
})(globalThis.Hollow = globalThis.Hollow || {});
