
/* ==========================================================================
   SECTION 15: PLAY SCENE BASE - players, co-op join, HUD, touch controls,
   and the shared overlays (journal, craft, plan, pause)
   ========================================================================== */
const EMPTY_INP = { mx: 0, my: 0, held: {}, press: {}, ai: true };
const WAIT_INP = { mx: 0, my: 0, held: { crouch: true }, press: {}, ai: true };

class PlayScene {
  constructor() { this.w = null; this.run = null; this.maxPlayers = 1; this.hudSpring = {}; this.calFlip = 0; this.idleT = 0; this.lockSwitch = false; this.objective = ''; }
  /* Attach a world and hand each joined player a survivor. */
  setupWorld(w) {
    this.w = w; w.scene = this; this.run = w.run;
    Game.players.length = Math.max(1, Math.min(Game.players.length, this.maxPlayers));
    const free = w.surv.slice();
    Game.players.forEach((p, i) => { p.sid = free[i] ? free[i].id : null; });
    this.markActive();
    Input.wantControls = true; Parts.clear(); Floaters.clear();
  }
  markActive() { for (const s of this.w.surv) { s.active = false; s.pl = -1; } Game.players.forEach((p, i) => { const s = this.w.surv.find(q => q.id === p.sid); if (s) { s.active = true; s.pl = i; } }); }
  devsFor(i) { if (i > 0) return [Game.players[i].dev]; const d = ['main']; for (let k = 0; k < 4; k++) if (Game.padOwner['pad' + k] == null) d.push('pad' + k); return d; }
  activeS(i) { const p = Game.players[i || 0]; return p ? this.w.surv.find(s => s.id === p.sid) : null; }
  switchSurvivor(i, toId) {
    if (this.lockSwitch) return; const p = Game.players[i], list = this.w.surv.filter(s => !s.down && !s.taken && (s.pl < 0 || s.pl === i)); if (list.length < 2 && !toId) return;
    let next = toId ? list.find(s => s.id === toId) : null;
    if (!next) { const cur = list.findIndex(s => s.id === p.sid); next = list[(cur + 1) % list.length]; }
    if (!next || next.id === p.sid) return;
    const old = this.activeS(i); if (old) { old.busy = null; }
    p.sid = next.id; this.markActive(); if (next.sleeping) this.w.wake(next); next.flare = 0.5; Snd.sfx('select');
    Game.iris = { x: next.sx, y: next.sy - 24, t: 0.35 };
  }
  /* Input for one survivor: a player's devices, or null when the AI moves them itself. */
  control(s) {
    if (s.pl >= 0) return Input.state(this.devsFor(s.pl));
    if (this.w.L.home) { homeAI(this.w, s, this.stepDt); return null; }
    return WAIT_INP;
  }
  updatePlay(dt) {
    const w = this.w; this.stepDt = dt;
    // co-op: an unassigned controller joins with A
    if (Game.players.length < this.maxPlayers) {
      for (let k = 0; k < 4; k++) {
        const id = 'pad' + k, d = Input.dev[id];
        if (d.conn && Game.padOwner[id] == null && d.press.interact && Game.p1Dev !== id) {
          const free = w.surv.find(s => s.pl < 0 && !s.down); if (!free) continue;
          Game.players.push({ dev: id, sid: free.id }); Game.padOwner[id] = Game.players.length - 1; this.markActive(); d.press.interact = false;
          Game.toast('Player ' + Game.players.length + ' joined', free.name + ' has a second pair of hands.', 'star'); Snd.sfx('chime'); Input.rumble(0.4, 120, id);
        }
      }
    }
    if (Game.padOwner[Input.lastDev] == null) Game.p1Dev = Input.lastDev;
    Game.players.forEach((p, i) => {
      const st = Input.state(this.devsFor(i)); let s = this.activeS(i);
      if (!s || s.down || s.taken) { const alt = w.surv.find(q => q.pl < 0 && !q.down && !q.taken); if (alt) { p.sid = alt.id; this.markActive(); s = alt; } }
      if (st.press.sw || st.press.swPrev) this.switchSurvivor(i);
      if (i === 0 && Input.num) { const t = w.surv[Input.num - 1]; if (t) this.switchSurvivor(0, t.id); }
      if (st.press.pause) this.openPause();
      if (st.press.inv) this.openJournal(0);
    });
    w.update(dt, s => this.control(s));
    // assist: auto-interact when standing still next to a searchable thing
    if (Save.s.autoInteract) { const s = this.activeS(0); if (s && !s.busy && Math.abs(s.vx) < 2) { this.idleT += dt; if (this.idleT > 0.4) { const a = w.bestAct(s); if (a && a.hold && !a.dis && /^(Search$|Take|Pick up|Filter)/.test(a.label)) { w.interact(s); if (s.busy) s.busy.auto = true; } this.idleT = 0; } } else this.idleT = 0; }
    for (const s of w.surv) if (s.specialT > 0) { s.specialT -= dt; if (s.specialT <= 0) s.special = ''; }
    if (this.calFlip > 0) this.calFlip = Math.max(0, this.calFlip - dt * 2);
  }
  openPause() {
    const items = [{ label: 'Resume', act: () => Game.pop() }, { label: 'Journal and jobs', act: () => { Game.pop(); this.openJournal(0); }, hidden: () => !this.w.L.home }, { label: 'Settings', act: () => Game.push(settingsOverlay()) }, { label: 'How to play', act: () => Game.push(howToOverlay()) }, { label: "Player's Guide (PDF)", sub: 'The full guide: walkthrough, maps, recipes, settings, release notes.', act: () => openGuide() }];
    items.push({ label: 'Add any item', sub: 'All Unlocked: put any item in your pack or the shelter.', hidden: () => !(Game.run && Game.run.free), act: () => Game.push(itemPicker('run', this)) });
    items.push({ type: 'head', label: 'SCREEN FILTERS' }, ...filterItems());
    if (this.pauseExtra) this.pauseExtra(items);
    items.push({ label: 'Quit to menu', sub: Game.run && MODE_BY_ID[Game.run.mode] && MODE_BY_ID[Game.run.mode].kind === 'campaign' ? 'Progress is kept from the last dawn.' : 'This run will end.', act: () => { Game.ov.length = 0; Game.go('Title', {}, 'flicker'); } });
    const run = Game.run, info = (run && MODE_BY_ID[run.mode] ? MODE_BY_ID[run.mode].n + '   day ' + run.day + '   ' : '') + 'Ashen Windows v' + VERSION;
    Game.push(menuOverlay({ title: 'Paused', key: 'pause', w: 340, y: 130, items, onBack: () => Game.pop(), noBackItem: true, extra: (ctx, m) => { txt(ctx, info, W / 2, m.y + m.height() + 64, 10, G.dust, 'center', { normal: true }); txt(ctx, Input.glyph('pause') + ' to resume', W / 2, m.y - 10, 10, G.pewter, 'center', { normal: true }); } }));
    Snd.sfx('page');
  }
  /* Journal: jobs, rations, supplies, the group, and the diary so far. */
  openJournal() {
    const run = this.run, w = this.w, home = w.L.home;
    if (!home) return this.openPack();
    const adv = adviceFor(run);
    const items = [{ label: 'What should we do?', sub: adv[0], act: () => Game.push(adviceOverlay(run)) }, { label: 'Bonds and stories', sub: 'Who trusts whom, and how far each personal story has gone.', act: () => Game.push(bondsOverlay(run)) }, { type: 'head', label: 'JOBS (who does what while you are busy)' }];
    for (const s of Run.present(run)) items.push({ type: 'choice', label: s.name, choices: JOB_ORDER, get: () => s.job, set: v => { s.job = v; }, fmt: v => JOBS[v].n, sub: () => JOBS[s.job].d + (s.statuses().length ? '  [' + s.statuses().join(', ') + ']' : '') });
    items.push({ type: 'head', label: 'TABLE' }, { type: 'choice', label: 'Rations', choices: ['full', 'half', 'none'], get: () => run.ration, set: v => { run.ration = v; }, fmt: v => ({ full: 'Everyone eats', half: 'Only the hungry', none: 'Skip the meal' }[v]), sub: 'The shared meal happens at midday. Soup first, then tins, then raw.' },
      { label: 'Hand out supplies', act: () => Game.push(supplyOverlay(this)), sub: 'Food, medicine, small comforts: give something to someone.' },
      { label: 'Read the diary', act: () => Game.push(diaryOverlay(run)), sub: 'The story so far, and any clues you have found.' });
    Game.push(menuOverlay({ title: 'Journal', key: 'journal', x: 30, y: 60, w: 400, maxRows: 11, items, onBack: () => Game.pop(), backLabel: 'Close', extra: ctx => stockPanel(ctx, run, 450, 60) }));
    Snd.sfx('page');
  }
  openPack() {
    const w = this.w, s = this.activeS(0); if (!s) return;
    const mk = () => {
      const items = [];
      for (const id in w.pack.items) { const n = w.pack.items[id]; if (n <= 0) continue; const U = ITEM_USE[id], use = !!U && !U.keep;
        items.push({ label: ITEMS[id].n + ' x' + n, right: use ? 'use' : 'drop', sub: use ? U.d + ' Use it now, on ' + s.name + '.' : 'Leave it here to make room.', act: () => {
          if (use) { const line = useItem(this.run, s, id, w.pack.items, w); if (line) Floaters.add(ITEMS[id].n, s.x, w.entY(s) - 70, {}); } else { w.pack.items[id]--; Snd.sfx('thud', { v: 0.3 }); }
          Game.pop(); this.openPack();
        } }); }
      if (!items.length) items.push({ type: 'text', label: 'The pack is empty.' });
      return items;
    };
    Game.push(menuOverlay({ title: 'Backpack  ' + w.packCount() + '/' + w.pack.cap, key: '', w: 380, y: 110, items: mk(), onBack: () => Game.pop(), backLabel: 'Close' }));
  }
  /* --- HUD: quiet, diegetic, readable --- */
  renderHUD(ctx, o) {
    o = o || {}; const w = this.w, run = this.run, t = Game.time;
    // roster chips: portrait dot, name tag, five shape-coded need bars
    const list = w.surv, cw = 110;
    list.forEach((s, i) => {
      const x = 8 + i * (cw + 4), y = 8, C = s.hueC(), sat = s.sat();
      ctx.globalAlpha = s.down ? 0.5 : 1;
      ctx.fillStyle = grey(0, 0.62); rrect(ctx, x, y, cw, 46, 6); ctx.fill();
      if (s.active) { ctx.fillStyle = hsl(C, Math.max(sat, 0.5)); rrect(ctx, x + 8, y - 1, cw - 16, 3, 1.5); ctx.fill(); }   // a colour tab on the survivor you control
      if (s.active) { ctx.strokeStyle = G.bone; ctx.lineWidth = 2; ctx.stroke(); }
      if (s.pose.lie < 0.3 && !s.hidden) {                       // a live little portrait of the survivor, cropped in a locket
        ctx.save(); ctx.beginPath(); ctx.arc(x + 15, y + 22, 11, 0, TAU); ctx.fillStyle = hsl(C, sat * 0.5, -32); ctx.fill(); ctx.clip();
        const fx = s.face; s.face = 1; Rig.draw(ctx, s, x + 13, y + 22 + 37 * 1.35 * s.d.b.h - 2, { scale: 1.35 }); s.face = fx; ctx.restore();
        ctx.strokeStyle = hsl(C, Math.max(sat, 0.6), 14); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + 15, y + 22, 11, 0, TAU); ctx.stroke();
      } else {
        ctx.fillStyle = hsl(s.d.skin, Math.max(0.2, sat)); ctx.beginPath(); ctx.arc(x + 15, y + 17, 8, 0, TAU); ctx.fill();
        ctx.fillStyle = hsl(C, sat); ctx.fillRect(x + 6, y + 25, 18, 7); ctx.strokeStyle = hsl(C, Math.max(sat, 0.6), 14); ctx.lineWidth = 1; ctx.strokeRect(x + 6, y + 25, 18, 7);
      }
      txt(ctx, (i + 1) + ' ' + s.name, x + 28, y + 12, 10, G.bone, 'left', { outline: false });
      const needs = ['hunger', 'fatigue', 'cold', 'health', 'morale'];
      needs.forEach((k, j) => { const crit = s[k] < CFG.needs.critical && !Save.s.reduce, bx = x + 30 + (j % 3) * 27 + (crit ? Math.sin(t * 40 + j) * 0.8 : 0), by = y + 18 + Math.floor(j / 3) * 11; UI.icon(ctx, k, bx + 3, by + 3, 6, s[k] < CFG.needs.critical ? G.white : G.pewter); UI.bar(ctx, bx + 8, by + 1, 16, 4, s[k]); });
      const st = s.statuses(); if (st.length) txt(ctx, st[0], x + 6, y + 43, 8, G.paper, 'left', { outline: false, normal: true });
      if (s.pl > 0) { ctx.fillStyle = hsl(C, 1); rrect(ctx, x + cw - 22, y + 33, 20, 11, 3); ctx.fill(); txt(ctx, 'P' + (s.pl + 1), x + cw - 12, y + 42, 8, G.ink, 'center', { outline: false, fixed: true }); }
      ctx.globalAlpha = 1;
    });
    if (this.maxPlayers > Game.players.length && w.surv.some(s => s.pl < 0 && !s.down)) { let pads = 0; for (let k = 0; k < 4; k++) if (Input.dev['pad' + k].conn && Game.padOwner['pad' + k] == null && Game.p1Dev !== 'pad' + k) pads++; if (pads) txt(ctx, 'Press A to join!', 10, 68, 10, G.bone, 'left'); }
    // calendar (flips), pocket watch, temperature
    const rx = W - 12 - (Input.touch ? 46 : 0);
    if (o.clock != null) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.moveTo(rx - 44, 54); ctx.lineTo(rx, 54); ctx.lineTo(rx + 2, 46); ctx.fill();   // calendar casts a shadow
      ctx.save(); ctx.translate(rx - 22, 30); ctx.scale(1, 1 - Math.sin(this.calFlip * Math.PI) * 0.9); UI.paper(ctx, -22, -22, 44, 44, { seed: 5, jit: 1.5, plain: true }); ctx.fillStyle = G.iron; ctx.fillRect(-22, -22, 44, 10);
      txt(ctx, o.clockLabel || 'DAY', 0, -14, 7, G.bone, 'center', { outline: false, fixed: true }); txt(ctx, String(o.day != null ? o.day : run.day), 0, 14, 22, G.ink, 'center', { outline: false, serif: true, fixed: true }); ctx.restore();
      const px = rx - 76, py = 30; ctx.fillStyle = G.bone; ctx.beginPath(); ctx.arc(px, py, 18, 0, TAU); ctx.fill(); ctx.strokeStyle = G.iron; ctx.lineWidth = 2.5; ctx.stroke(); ctx.fillStyle = G.iron; ctx.fillRect(px - 3, py - 24, 6, 6);
      ctx.fillStyle = grey(60, 0.35); ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, 15, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(o.clock, 0, 1)); ctx.fill();
      const a = -Math.PI / 2 + TAU * clamp(o.clock, 0, 1); ctx.strokeStyle = G.ink; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * 13, py + Math.sin(a) * 13); ctx.stroke();
      UI.icon(ctx, (o.clockLabel || 'DAY') === 'DAY' ? 'sun' : 'moon', px, py + 8, 7, G.stone);
      if (o.clock > 0.8 && Math.sin(t * TAU * 1.5) > 0) { ctx.strokeStyle = G.white; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, 21, 0, TAU); ctx.stroke(); }
      { const tx = rx - 118, k = clamp((num(run.temp, 0) + 15) / 30, 0.08, 1); ctx.fillStyle = grey(0, 0.5); rrect(ctx, tx - 3, 12, 6, 16, 3); ctx.fill(); ctx.fillStyle = G.bone; ctx.beginPath(); ctx.arc(tx, 30, 4, 0, TAU); ctx.fill(); ctx.fillRect(tx - 1.2, 28 - 15 * k, 2.4, 15 * k); }   // a thermometer whose column follows the temperature
      txt(ctx, (run.temp > 0 ? '+' : '') + run.temp + '°', rx - 118, 46, 10, G.bone, 'center');
      const wi = { clear: 'sun', rain: 'rain', snow: 'snow', fog: 'fog', coldsnap: 'snow' }[run.weather]; if (wi) UI.icon(ctx, wi, rx - 146, 30, 10, G.pewter);
      txt(ctx, { clear: 'clear', rain: 'rain', snow: 'snow', fog: 'fog', coldsnap: 'cold snap' }[run.weather] || '', rx - 118, 57, 8, G.pewter, 'center');
    }
    // objective strip
    if (this.objective) { const ls = wrapText(ctx, this.objective, 470, 11); let tw = 0; for (const l of ls) tw = Math.max(tw, ctx.measureText(l).width); tw += 26; const lh = 15 * textScale(), oh = ls.length * lh + 8, ox = W / 2 - tw / 2, oy = H - 24 - oh - (o.rations ? 0 : 0); UI.paper(ctx, ox, 62, tw, oh, { seed: 2, jit: 1.5, plain: true, rot: -0.003 }); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(ox + 10, 68, 3.5, 0, TAU); ctx.fill(); ctx.fillStyle = G.iron; ctx.beginPath(); ctx.arc(ox + 9, 66.5, 3.5, 0, TAU); ctx.fill(); ctx.fillStyle = G.chalk; ctx.fillRect(ox + 7.5, 65, 1.4, 1.4); ls.forEach((l, i) => txt(ctx, l, W / 2, 62 + 15 + i * lh, 11, G.ink, 'center', { outline: false })); }
    // night instruments: noise, light, battery, backpack grid
    if (o.stealth) {
      const s = this.activeS(0), bx = 14, by = H - 70 - (Input.touch ? 10 : 0);
      ctx.fillStyle = grey(0, 0.55); rrect(ctx, bx - 6, by - 10, 150, 66, 6); ctx.fill();
      UI.icon(ctx, 'noise', bx + 8, by + 2, 11, G.bone); UI.bar(ctx, bx + 22, by - 2, 80, 7, clamp(w.noiseLvl / 2.6, 0, 100), { ticks: true });
      UI.icon(ctx, 'light', bx + 6, by + 18, 11, G.bone); UI.bar(ctx, bx + 22, by + 14, 80, 7, s ? clamp(w.expo(s) / 1.5 * 100, 0, 100) : 0, { ticks: true });
      if (w.battery != null) { UI.icon(ctx, 'battery', bx + 6, by + 34, 11, G.bone); UI.bar(ctx, bx + 22, by + 30, 80, 7, clamp(((w.battery - 0.01) % 100 + 0.01), 0, 100)); if (w.battery > 100) txt(ctx, '+' + Math.floor((w.battery - 0.01) / 100), bx + 108, by + 38, 9, G.bone, 'left'); }
      UI.icon(ctx, 'pack', bx + 6, by + 49, 10, G.bone); const n = w.packCount(); for (let i = 0; i < w.pack.cap; i++) { ctx.fillStyle = i < n ? G.chalk : grey(50); ctx.fillRect(bx + 22 + i * 8.6, by + 45, 7, 7); }
      if (s && s.crouch) txt(ctx, 'crouched', bx + 110, by + 6, 8, G.paper, 'left', { normal: true });
    }
    if (o.rations) {
      const bx = 14, by = H - 34; ctx.fillStyle = grey(0, 0.55); rrect(ctx, bx - 6, by - 12, 286, 28, 6); ctx.fill();
      const cell = (ic, v, i, lab) => { UI.icon(ctx, ic, bx + 8 + i * 70, by + 2, 11, v <= 0 ? G.white : G.bone); txt(ctx, v + ' ' + lab, bx + 18 + i * 70, by + 6, 10, v <= 0 ? G.white : G.paper, 'left', { outline: false }); };
      cell('food', Run.food(run), 0, 'food'); cell('water', Run.count(run, 'water'), 1, 'water'); cell('ember', Run.count(run, 'fuel') + Math.floor(Run.count(run, 'wood') / 2), 2, 'fuel'); cell('health', Run.count(run, 'meds') + Run.count(run, 'bandage') + Run.count(run, 'antibio') + Run.count(run, 'syrup'), 3, 'care');
    }
    // prompts and progress rings for each player's survivor
    Game.players.forEach((p, i) => {
      const s = this.activeS(i); if (!s || s.down) return;
      const px = w.sx(s.x), py = w.sy(w.entY(s));
      if (Game.players.length > 1 || Save.s.colorblind) txt(ctx, (Game.players.length > 1 ? 'P' + (i + 1) + ' ' : '') + s.name, px, py + 14, 9, G.bone, 'center');
      ctx.fillStyle = G.bone; ctx.beginPath(); ctx.moveTo(px - 4, py - 62 * w.cam.zoom * s.d.b.h - 8); ctx.lineTo(px + 4, py - 62 * w.cam.zoom * s.d.b.h - 8); ctx.lineTo(px, py - 62 * w.cam.zoom * s.d.b.h - 3); ctx.fill();
      if (s.busy) { const k = clamp(s.busy.t / s.busy.dur, 0, 1); ctx.strokeStyle = grey(0, 0.6); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(px, py - 80, 11, 0, TAU); ctx.stroke(); ctx.strokeStyle = G.bone; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py - 80, 11, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke(); const ea = -Math.PI / 2 + TAU * k; ctx.fillStyle = G.white; ctx.beginPath(); ctx.arc(px + Math.cos(ea) * 11, py - 80 + Math.sin(ea) * 11, 2.6, 0, TAU); ctx.fill(); txt(ctx, Math.round(k * 100) + '', px, py - 76.5, 7.5, G.bone, 'center', { fixed: true }); return; }
      if (s.hidden) { UI.prompt(ctx, 'interact', 'Come out', px, py - 78); return; }
      if (s.sleeping) { UI.prompt(ctx, 'interact', 'Get up', px, py - 44); return; }
      const a = w.bestAct(s);
      if (a) UI.prompt(ctx, 'interact', a.label, w.sx(a.x), w.sy(a.y) - 8 - (Save.s.reduce ? 0 : Math.abs(Math.sin(t * 2.4)) * 2), { dis: !!a.dis });
      else if (w.ladderNear(s) && !s.cl) UI.prompt(ctx, s.f === w.ladderNear(s).fb ? 'up' : 'down', 'Climb', px, py - 78);
    });
    if (o.extra) o.extra(ctx);
    this.renderTouch(ctx);
  }
  /* Touch controls: floating stick on the left, stitched cloth buttons in a thumb arc on the right. */
  renderTouch(ctx) {
    if (!Input.touch || Input.last !== 'touch' || !Input.wantControls) return;
    const a = clamp(num(Save.s.btnOpacity, 0.7), 0.2, 1), j = Input.joy, s = this.activeS(0);
    ctx.save(); ctx.globalAlpha = a;
    if (j.on) { ctx.strokeStyle = G.paper; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(j.ox, j.oy, 46, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = grey(230, 0.8); ctx.beginPath(); ctx.arc(j.ox + j.x * 46, j.oy + j.y * 46, 20, 0, TAU); ctx.fill(); }
    else { ctx.globalAlpha = a * 0.35; ctx.strokeStyle = G.paper; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(110, H - 100, 46, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = a; }
    for (const b of Input.tbtn) {
      const press = Input.tHeld[b.id] ? 1 : (Input.tAnim[b.id] || 0), r = b.r * (1 - press * 0.1);
      ctx.fillStyle = Input.tHeld[b.id] ? G.bone : grey(210, 0.9); ctx.beginPath(); ctx.arc(b.x, b.y + press * 2, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = G.ink; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.arc(b.x, b.y + press * 2, r - 4, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      txt(ctx, b.label, b.x, b.y + 4 + press * 2, b.small ? 8 : 10, G.ink, 'center', { outline: false, fixed: true });
      if (b.id === 'use' && s && s.cool > 0) { ctx.strokeStyle = G.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(b.x, b.y, r + 3, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - clamp(s.cool / 0.85, 0, 1))); ctx.stroke(); }
      if (b.id === 'interact' && s && s.busy) { ctx.strokeStyle = G.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(b.x, b.y, r + 3, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(s.busy.t / s.busy.dur, 0, 1)); ctx.stroke(); }
    }
    ctx.restore();
  }
  exit() { Input.wantControls = false; }
}

/* Supplies and group panel shown beside the journal. */
function stockPanel(ctx, run, x, y) {
  UI.paper(ctx, x, y, 480, 420, { seed: 3 });
  txt(ctx, 'Supplies', x + 18, y + 28, 15, G.ink, 'left', { outline: false, serif: true });
  let i = 0; for (const id in ITEMS) { const n = Run.count(run, id); if (n <= 0) continue; const cx = x + 20 + (i % 3) * 150, cy = y + 50 + Math.floor(i / 3) * 16; txt(ctx, n + '  ' + ITEMS[id].n, cx, cy, 10, G.coal, 'left', { outline: false, normal: true }); i++; }
  if (!i) txt(ctx, 'The shelves are bare.', x + 20, y + 50, 10, G.iron, 'left', { outline: false });
  const gy = y + 196; txt(ctx, 'The landing', x + 18, gy, 15, G.ink, 'left', { outline: false, serif: true });
  txt(ctx, 'Barricade ' + run.barricade + '/' + BARRICADE_MAX + '   Tripwires ' + run.traps + '   Humanity ' + (run.humanity >= 65 ? 'warm' : run.humanity >= 40 ? 'steady' : 'worn thin'), x + 20, gy + 18, 10, G.coal, 'left', { outline: false, normal: true });
  run.surv.forEach((s, k) => {
    const cy = gy + 44 + k * 34; if (cy > y + 400) return;
    Rig.draw(ctx, s, x + 34, cy + 12, { scale: 0.55, alpha: s.present ? 1 : 0.35 });
    txt(ctx, s.name + (s.gone ? ' (gone)' : s.away ? ' (away)' : ''), x + 56, cy, 11, G.ink, 'left', { outline: false });
    txt(ctx, s.present ? (JOBS[s.job].n + '. ' + (s.statuses().join(', ') || 'Holding up.')) : '', x + 56, cy + 12, 9, G.iron, 'left', { outline: false, normal: true });
    ['hunger', 'fatigue', 'cold', 'health', 'morale'].forEach((n, j) => { UI.icon(ctx, n, x + 300 + j * 34, cy + 2, 7, G.coal); UI.bar(ctx, x + 306 + j * 34, cy, 20, 4, s[n], { col: G.iron }); });
  });
}
function diaryOverlay(run) {
  let scroll = Math.max(0, run.journal.length - 7);
  return { update() { const M = Input.menu; if (M.up) scroll = Math.max(0, scroll - 1); if (M.down) scroll = Math.min(Math.max(0, run.journal.length - 7), scroll + 1); if (M.back || M.ok || Input.ptr.click) Game.pop(); },
    render(ctx) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H); UI.paper(ctx, 160, 50, 640, 440, { seed: 6, rot: 0.004 }); txt(ctx, 'The diary', 190, 86, 18, G.ink, 'left', { outline: false, serif: true });
      let y = 112; if (!run.journal.length) txt(ctx, 'Nothing written yet.', 190, y, 11, G.iron, 'left', { outline: false });
      for (let i = scroll; i < run.journal.length && y < 460; i++) { const e = run.journal[i]; txt(ctx, 'Day ' + e.day, 190, y, 9, G.iron, 'left', { outline: false }); y += 4 + txtWrap(ctx, e.text, 250, y, 520, 11, G.coal, { outline: false, normal: true }) + 6; }
      UI.prompt(ctx, 'interact', 'Close', 480, 478); } };
}
function howToOverlay() {
  const lines = ['DAY: walk the flat, use stations with {interact}. Assign jobs in the journal {inv}. Answer the door.',
    'DUSK: go to the front door to plan. Pick who goes out, where, and what they carry.',
    'NIGHT: {light} flashlight, {crouch} crouch, {sprint} sprint, {jump} hop over creaky boards, {use} throw or swing.',
    'Hold {interact} to search. Hide in wardrobes. Return to the street door before dawn.',
    'Watch the cones. Brighter means more suspicious. "?" is curious, "!" is trouble.',
    'Color is morale. Feed, warm, rest and comfort people and their color returns.', '{sw} or number keys switch survivor. {pause} pauses. M mutes. F3 shows the debug overlay.'];
  return { update() { if (Input.menu.back || Input.menu.ok || Input.ptr.click) Game.pop(); },
    render(ctx) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H); UI.paper(ctx, 140, 70, 680, 400, { seed: 8 }); txt(ctx, 'How to play', 170, 108, 18, G.ink, 'left', { outline: false, serif: true }); let y = 138; for (const l of lines) y += txtWrap(ctx, Input.fmt(l), 170, y, 620, 11, G.coal, { outline: false, normal: true }) + 9; UI.prompt(ctx, 'interact', 'Back', 480, 452); } };
}
/* Crafting and building, at the stove or the workbench. */
function craftOverlay(scene, at, s) {
  const run = scene.run, w = scene.w, dov = s && s.id === 'dov';
  const upCost = id => { const c = Object.assign({}, UPGRADES[id].cost); if (dov && c.wood > 1) c.wood--; return c; };
  const items = [{ type: 'head', label: at === 'stove' ? 'THE STOVE' : 'MAKE' }];
  craftList(run, at).forEach(r => items.push({ label: r.n, right: () => { const n = craftCount(run, r); return n > 0 ? 'x' + n : ''; }, sub: craftSub(r), dis: () => craftMissing(run, r), act() {
    Run.pay(run, r.cost); craftBonus(run, r, s); for (const k in r.out) Run.add(run, k, r.out[k] + (r.id === 'soup' && s && s.id === 'bea' ? 1 : 0));
    if (r.trap) run.traps += r.trap; if (r.fx && RECIPE_FX[r.fx]) note(RECIPE_FX[r.fx](run), 5); if (r.id === 'bread') Bus.emit('baked', { s });
    if (r.id === 'coat') { const cold = Run.present(run).filter(p => !p.coat).sort((a, b) => a.cold - b.cold)[0]; if (cold) { cold.coat = true; Run.add(run, 'coat', -1); cold.addMorale(4); note(cold.name + ' gets the warm clothes. They do not take them off again.'); } }
    if (r.id === 'soup') { run.soupName = SOUPS[(run.day * 3 + run.stats.soups) % SOUPS.length]; run.stats.soups++; if (s && s.id === 'bea') note("Granny tastes it. \"This one is called '" + run.soupName + "'.\""); }
    Snd.sfx(at === 'stove' ? 'sizzle' : 'thud'); if (s) s.act('interact', 0.6); Bus.emit('craftComplete', { id: r.id, s });
  } }));
  if (at === 'workbench') {
    items.push({ type: 'head', label: 'BUILD' });
    for (const id in UPGRADES) { const u = UPGRADES[id]; if (u.start) continue; items.push({ label: u.n, hidden: () => !!run.up[id] || (u.req && !run.up[u.req]), right: () => Run.costText(upCost(id)), sub: u.d + (dov ? ' (Dov builds it for less.)' : ''), dis: () => (Run.has(run, upCost(id)) ? false : 'Need: ' + Run.costText(upCost(id))), act() { Run.pay(run, upCost(id)); run.up[id] = 1; scene.rebuildHome(); Snd.sfx('unlock'); Bus.emit('craftComplete', { id, s, upgrade: true }); Game.pop(); note(u.n + ' built. ' + u.d); } }); }
    items.push({ label: () => 'Reinforce the door (' + run.barricade + '/' + BARRICADE_MAX + ')', right: () => Run.costText(BARRICADE_COST), sub: 'Each layer of boards makes the door hold longer and keeps heat in.', dis: () => (run.barricade >= BARRICADE_MAX ? 'The door is as strong as it gets.' : Run.has(run, BARRICADE_COST) ? false : 'Need: ' + Run.costText(BARRICADE_COST)), act() { Run.pay(run, BARRICADE_COST); run.barricade++; Snd.sfx('thud'); Bus.emit('craftComplete', { id: 'barricade', s }); } });
  }
  return menuOverlay({ title: at === 'stove' ? 'Stove' : 'Workbench', key: 'craft' + at, x: 30, y: 60, w: 400, maxRows: 11, items, onBack: () => Game.pop(), backLabel: 'Close', extra: ctx => stockPanel(ctx, run, 450, 60) });
}
/* Dusk: who goes, where, and with what. "Set out" is the default focus so the night is one press away. */
function planOverlay(scene, forced) {
  const run = scene.run, pres = Run.present(run).filter(s => s.health > 15), coop = Game.players.length > 1;
  const ch = run.mode === 'story' ? CHAPTERS.find(c => run.day === c.days[1]) : null;
  const setp = ch ? ch.set : null, fixedLoc = ch && ch.setSite ? ch.setSite : null, homeNight = setp === 'search';
  const P = { scout: pres[0] ? pres[0].id : 'none', scout2: 'none', loc: fixedLoc || (run.hint && run.sites.indexOf(run.hint) >= 0 ? run.hint : run.sites[run.sites.length - 1]), bottles: Math.min(1, Run.count(run, 'bottle')), clatter: Math.min(1, Run.count(run, 'clatter')), battery: Math.min(1, Run.count(run, 'battery')), food: 0, bandage: 0, cart: false, pan: false };
  const fit = pres.filter(s => s.fatigue > 25 && !s.sick && !s.wound); if (fit.length) P.scout = fit.sort((a, b) => (b.st.stl + b.st.spd) - (a.st.stl + a.st.spd))[0].id;
  if (coop) { const o2 = pres.find(s => s.id !== P.scout); if (o2) P.scout2 = o2.id; }
  const ids = pres.map(s => s.id).concat(homeNight ? [] : ['none']);
  if (homeNight) P.scout = 'none';
  const nm = v => (v === 'none' ? 'Nobody goes' : SURVIVORS[v].short);
  const items = [
    { type: 'choice', label: 'Who goes out', choices: ids.length ? ids : ['none'], get: () => P.scout, set: v => { P.scout = v; if (P.scout2 === v) P.scout2 = 'none'; }, fmt: nm, hidden: () => homeNight, sub: () => { const s = run.surv.find(q => q.id === P.scout); return s ? s.d.skill + '. ' + s.d.flaw + '. ' + (s.fatigue < 25 ? 'Very tired.' : s.wound ? 'Wounded.' : s.sick ? 'Sick.' : 'Ready.') : 'Everyone stays in. Rest, guard, and wait for morning.'; } },
    { type: 'choice', label: 'With them', choices: ['none'].concat(pres.map(s => s.id)), get: () => P.scout2, set: v => { if (v !== P.scout) P.scout2 = v; }, fmt: v => (v === 'none' ? 'Alone' : SURVIVORS[v].short), hidden: () => homeNight || P.scout === 'none' || pres.length < 2, sub: 'A second pair of hands. In co-op, each player takes one.' },
    { type: 'choice', label: 'Where', choices: fixedLoc ? [fixedLoc] : run.sites, get: () => P.loc, set: v => { P.loc = v; }, fmt: v => LOCS[v].n, hidden: () => homeNight || P.scout === 'none', sub: () => LOCS[P.loc].d + '  Danger ' + '#'.repeat(LOCS[P.loc].danger) + (run.hint === P.loc ? '  (Toby drew this one.)' : '') },
    { type: 'slider', label: 'Batteries', min: 0, max: Math.min(2, Run.count(run, 'battery')), step: 1, get: () => P.battery, set: v => { P.battery = v; }, hidden: () => homeNight || P.scout === 'none' || Run.count(run, 'battery') < 1, sub: 'Each battery is a full flashlight charge. None means walking in the dark.' },
    { type: 'slider', label: 'Bottles to throw', min: 0, max: Math.min(3, Run.count(run, 'bottle')), step: 1, get: () => P.bottles, set: v => { P.bottles = v; }, hidden: () => homeNight || P.scout === 'none' || Run.count(run, 'bottle') < 1, sub: 'A thrown bottle makes a noise somewhere you are not.' },
    { type: 'slider', label: 'Clatter jars', min: 0, max: Math.min(2, Run.count(run, 'clatter')), step: 1, get: () => P.clatter, set: v => { P.clatter = v; }, hidden: () => homeNight || P.scout === 'none' || Run.count(run, 'clatter') < 1, sub: 'Thrown, it rattles for seconds. Louder and longer than a bottle.' },
    { type: 'slider', label: 'Food to carry', min: 0, max: Math.min(2, Run.count(run, 'can')), step: 1, get: () => P.food, set: v => { P.food = v; }, hidden: () => homeNight || P.scout === 'none' || Run.count(run, 'can') < 1, sub: 'To eat, to trade, or to give to a dog.' },
    { type: 'slider', label: 'Bandages', min: 0, max: Math.min(1, Run.count(run, 'bandage')), step: 1, get: () => P.bandage, set: v => { P.bandage = v; }, hidden: () => homeNight || P.scout === 'none' || Run.count(run, 'bandage') < 1, sub: 'In case the night bites.' },
    { type: 'toggle', label: 'Take the dented pan', get: () => P.pan, set: v => { P.pan = v; }, hidden: () => homeNight || P.scout === 'none' || Run.count(run, 'pan') < 1, sub: 'A crude swing knocks a threat back for a moment. Loud.' },
    { type: 'toggle', label: "Take Ravi's bicycle", get: () => P.cart, set: v => { P.cart = v; }, hidden: () => homeNight || P.scout === 'none' || !run.surv.some(s => s.id === 'ravi' && s.present), sub: 'Four more pack slots. Every step is louder.' },
    { label: () => (homeNight ? 'Bar the door and wait' : P.scout === 'none' ? 'Stay in tonight' : 'Set out'), act: () => { Game.pop(); scene.startNight(P, setp); }, sub: () => (setp ? 'Tonight matters: ' + ch.blurb : run.raidKnown && run.raidTonight ? 'You were warned: raiders may come tonight. Leave a guard.' : 'The others will guard, sleep, or work until dawn.') }
  ];
  if (!forced) items.push({ label: 'Back to the day', back: true, act: () => { Game.pop(); } });
  const ov = menuOverlay({ title: forced ? 'Last light. Plan the night' : 'Plan the night', key: '', x: 30, y: 56, w: 430, maxRows: 12, items, sel: 99, noBackItem: true, onBack: forced ? null : () => Game.pop(), extra(ctx) {
    UI.paper(ctx, 480, 56, 450, 420, { seed: 12 });
    txt(ctx, 'Day ' + run.day + '   ' + CFG.phases[Run.phase(run)], 500, 84, 14, G.ink, 'left', { outline: false, serif: true });
    let y = 108; const L = (s, c) => { y += txtWrap(ctx, s, 500, y, 410, 10.5, c || G.coal, { outline: false, normal: true }) + 5; };
    L('Outside: ' + run.temp + '°, ' + (run.weather === 'coldsnap' ? 'a cold snap' : run.weather) + '. Inside warmth: ' + (Run.warmth(run) + run.temp >= 8 ? 'bearable' : 'cold') + (run.heaterOn ? ' (heater lit).' : ' (heater unlit).'));
    if (setp) L('TONIGHT: ' + ch.blurb, G.ink);
    if (setp === 'homefire') L('There is a smell of scorched wiring in the stairwell. Leave water at home if you can spare it (4 would be enough).', G.ink);
    if (run.raidTonight && (run.raidKnown || run.traps > 0 || Run.present(run).some(s => s.job === 'watch'))) L('WARNING: boots were seen on the street. Raiders are likely tonight. Barricade ' + run.barricade + '/' + BARRICADE_MAX + '.', G.ink);
    else if (run.raidTonight) L('Shadows at the corner at dusk. It may be nothing. A guard would be wise.', G.ink);
    y += 6; txt(ctx, 'Staying home', 500, y, 12, G.ink, 'left', { outline: false, serif: true }); y += 16;
    for (const s of Run.present(run)) { if (s.id === P.scout || s.id === P.scout2) continue; Rig.draw(ctx, s, 514, y + 14, { scale: 0.5 }); txt(ctx, s.name + ': ' + (NIGHT_AI[s.job] ? 'on guard' : 'asleep') + (s.statuses().length ? '  [' + s.statuses().join(', ') + ']' : ''), 532, y + 6, 10, G.coal, 'left', { outline: false, normal: true }); y += 26; }
    const used = P.bottles + num(P.clatter) + P.food + P.bandage + (P.pan ? 1 : 0), sc = run.surv.find(q => q.id === P.scout), cap = CFG.pack + (P.cart ? CFG.cartBonus : 0) + (sc && sc.st.str >= 5 ? 2 : 0);
    if (P.scout !== 'none' && !homeNight) { y += 8; txt(ctx, 'Backpack: ' + used + ' packed, ' + (cap - used) + ' free', 500, y, 11, G.ink, 'left', { outline: false }); for (let i = 0; i < cap; i++) { ctx.fillStyle = i < used ? G.iron : G.pewter; ctx.fillRect(500 + (i % 7) * 16, y + 8 + Math.floor(i / 7) * 16, 13, 13); } }
  } });
  ov.menu.sel = ov.menu.vis().findIndex(i => i.act && !i.back && !i.type); ov.plan = P;
  return ov;
}
