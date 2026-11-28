
/* ==========================================================================
   SECTION 16: HOME DAY SCENE (shelter phase) with telegraphed home hazards
   ========================================================================== */
function emitWeather(run, dt, k) {
  const wth = run.weather, n = Save.s.lowfx ? 0.4 : 1;
  if (wth === 'rain' && Math.random() < dt * 90 * n * k) Parts.emit('rain', Math.random() * (W + 80), -10, 2, { screen: true });
  if ((wth === 'snow' || wth === 'coldsnap' || run.mods.snow) && Math.random() < dt * 26 * n * k) Parts.emit('snow', Math.random() * (W + 60), -6, 1, { screen: true });
  if (Math.random() < dt * 5 * n) Parts.emit('ash', Math.random() * W, -6, 1, { screen: true });
}
class HomeScene extends PlayScene {
  enter(p) {
    p = p || {}; const run = this.run = Game.run; this.sandbox = run.mode === 'workshop';
    this.maxPlayers = Math.min((MODE_BY_ID[run.mode] || { coop: 2 }).coop, 2, Math.max(1, Run.present(run).length));
    if (run.plannedDay !== run.day) { Director.planDay(run); run.plannedDay = run.day; run.raidKnown = false; }
    this.dayT = 0; this.evIdx = 0; this.mealDone = false; this.visitor = null; this.hz = []; this.chatT = 5; this.knockT = 0; this.planOpen = false; this.calFlip = 1; this.catT = 30;
    for (const s of run.surv) s.resetRuntime();
    this.build(true);
    Snd.setTrack(homeTrack(run)); Snd.amb.wind = 0.25; Snd.amb.rain = run.weather === 'rain' ? 0.6 : 0; Snd.tension = 0;
    if (run.day <= 2 && !this.sandbox) note(run.day === 1 ? 'Morning on the landing. Walk about; every station does something. The front door, bottom right, is where the night begins.' : 'A new day. Check the journal for jobs, cook if you can, and listen for the door.', 7);
    if (p.journal) this.openJournal();
  }
  build(place) {
    const run = this.run, L = buildHome(run, false);
    for (const id in run.broken.rooms) { const rm = HOME_ROOMS.find(r => r.id === id); if (rm) L.objs.push({ type: 'rubble', x: (rm.x0 + rm.x1) / 2, f: rm.f, room: id }); }
    for (const l of L.ladders) if (l.broken) L.objs.push({ type: 'stairfix', x: l.xa + (l.stairs ? sgn(l.xa - l.xb) * 30 : 30), f: l.fa, lad: l }, { type: 'stairfix', x: l.xb + (l.stairs ? -sgn(l.xa - l.xb) * 30 : 30), f: l.fb, lad: l });
    if (run.fire && run.fire.type === 'fire') L.objs.push(run.fire);
    const w = new World(L, run, { homeAI: 'day', doorAct: (ww, s) => this.doorAct(s) });
    w.surv = Run.present(run);
    w.surv.forEach((s, i) => { s.bed = null; s.hidden = null; if (place) { const spots = [[440, 3], [520, 3], [330, 2], [560, 1], [700, 3]]; w.place(s, spots[i % 5][0] + i * 6, spots[i % 5][1]); } });
    if (run.cat) { const c = w.spawnNPC('cat', 640, 3, { p0: 300, p1: 800 }); c.owner = w.surv[run.day % Math.max(1, w.surv.length)] || null; }
    const prev = Game.players.map(pl => pl.sid);
    this.setupWorld(w);
    if (!place) { Game.players.forEach((pl, i) => { if (prev[i] && w.surv.some(s => s.id === prev[i])) pl.sid = prev[i]; }); this.markActive(); }
    this.mouse = L.objs.find(o => o.type === 'mouse');
  }
  rebuildHome() { this.build(false); }
  doorAct(s) {
    if (this.visitor) return { label: 'Answer the door', fn: () => this.answer(s) };
    if (this.sandbox) return { label: 'Workshop tools', fn: () => this.openTools() };
    return { label: 'Plan the night', hold: 0.5, fn: () => { Game.push(planOverlay(this, false)); } };
  }
  answer(s) {
    const run = this.run, id = this.visitor.id, d = visitorDialog(run, id, s); this.visitor = null; if (!d) return;
    d.id = id; Game.banner(null);
    Game.push(dialogOverlay(d, run, () => {
      if (id === 'neighbor' || id === 'thiefBack') run.raidKnown = true;
      if (id === 'childBack') run.flags.balloon = true;
      if (id === 'catArrives' && run.cat && !this.w.npcs.some(n => n.type === 'cat')) { const c = this.w.spawnNPC('cat', 820, 3, { p0: 300, p1: 800 }); c.owner = s; }
      Run.log(run, VISITORS[id].title + ' ' + (run.tags.indexOf('kind') >= 0 ? 'We helped.' : run.tags.indexOf('hard') >= 0 ? 'We did not.' : ''));
    }));
  }
  startNight(P, setp) {
    const run = this.run; run.plan = P; this.done = true; Bus.emit('nightStart', {});
    if (setp === 'homefire') run.setHomeFire = true;
    const scouts = [P.scout, P.scout2].filter(id => id && id !== 'none');
    if (setp === 'search') { Game.go('NightHome', { rules: 'search', onDone: () => Flow.dawn(null) }, 'blinds'); return; }
    if (!scouts.length) { if (run.raidTonight) { run.raidHandled = true; Game.go('NightHome', { rules: 'raid1', onDone: () => Flow.dawn(null) }, 'blinds'); } else Flow.dawn(null); return; }
    const pack = {};
    const take = (id, n) => { n = Math.min(n, Run.count(run, id)); if (n > 0) { Run.add(run, id, -n); pack[id] = n; } };
    take('bottle', P.bottles); take('clatter', num(P.clatter)); take('can', P.food); take('bandage', P.bandage); if (P.pan) take('pan', 1);
    const bat = Math.min(P.battery, Run.count(run, 'battery')); Run.add(run, 'battery', -bat);
    Game.go('NightSortie', { loc: P.loc, scouts, pack, battery: bat, cart: P.cart, set: setp, onDone: res => Flow.dawn(res) }, 'iris');
  }
  /* Scene-directed bus events */
  on(ev, d) {
    const run = this.run, w = this.w;
    if (ev === 'openCraft') Game.push(craftOverlay(this, d.at, d.s));
    else if (ev === 'openJournal') this.openJournal();
    else if (ev === 'openCode') Game.push(codeOverlay(run, d.idx, () => {
      if (d.idx === 0) { run.flags.drawer = true; Run.add(run, 'meds', 1); Run.add(run, 'toy', 1); note('Inside: a strip of tablets, a wind-up toy, and a lot of dust. Toby is given the toy without discussion.'); Run.allMorale(run, 3); }
      else { run.flags.safe = true; Run.add(run, 'fuel', 2); Run.add(run, 'can', 2); Run.add(run, 'battery', 1); note("The safe swings open. Somebody's rainy-day shelf: fuel, tins, a battery."); }
    }));
    else if (ev === 'memory') { if (!d.s.mem) { d.s.mem = 1; Game.push(memoryOverlay(d.s, MEMORIES[d.s.id] || MEMORIES.marta)); } else note(d.s.name + ' looks at it for a while, then sets it down carefully.'); }
    else if (ev === 'radioScan') {
      const o = w.L.objs.find(q => q.type === 'radio'); if (o) o.waveT = 2.5; Snd.sfx('static', { d: 1 });
      if (!Run.once(run, 'radio')) { note('Static. You have heard what there is to hear today.'); return; }
      const r = new RNG(run.seed + run.day * 53); let line;
      if (!run.flags.rumor && run.ceasefire && run.day >= Math.floor(run.ceasefire * 0.4)) { line = RADIO.find(q => q.rumor); this.rumor(); }
      else if (run.raidTonight) { line = RADIO.find(q => q.warn); run.raidKnown = true; }
      else line = r.pick(RADIO.filter(q => !q.rumor && !q.warn));
      const k = d.s && d.s.id === 'yara' ? 1.5 : 1; Run.allMorale(run, line.m * k); note('Radio: ' + line.t, 6); Snd.duck(3);
      if (line.music) { Snd.setTrack(line.music); this.radioMusicT = 45; }
    }
    else if (ev === 'cardGame') {
      const sit = w.surv.filter(s => !s.sleeping && Math.abs(s.f - d.s.f) <= 1);
      sit.forEach((s, i) => { s.special = 'sit'; s.specialT = 5; if (s.pl < 0 && s.f === d.s.f) s.x = d.s.x + (i - sit.length / 2) * 22; for (const o of sit) Run.trust(run, s, o, 1); });
      Run.allMorale(run, 6); note('Cards, played for buttons. Pavel wins again and apologizes again.', 5); Snd.sfx('chime');
    }
    else if (ev === 'catAdopted') { if (!w.npcs.some(n => n.type === 'cat')) w.spawnNPC('cat', 820, 3, { p0: 300, p1: 800 }); if (this.mouse) { this.mouse.mood = 'cat'; this.mouse.moodT = 40; } }
    else if (ev === 'hazardWarning') { if (this.mouse) { this.mouse.mood = 'hazard'; this.mouse.moodT = 30; } }
    else if (ev === 'hazardFixed' || (ev === 'craftComplete' && d.upgrade)) {
      // a quiet victory: those nearby share a small gesture
      const s0 = d.s; if (!s0) return; let n = 0;
      for (const s of w.surv) if (Math.abs(s.f - s0.f) <= 1 && !s.sleeping) { s.special = 'victory'; s.specialT = 2.4; s.addMorale(2, true); n++; }
      Snd.sfx('chime'); if (this.mouse) { this.mouse.mood = 'good'; this.mouse.moodT = 20; }
      if (n > 1) Floaters.add('a shared cup of tea', s0.x, w.entY(s0) - 70, { life: 2.4 });
    }
    else if (ev === 'needCritical') { const names = { hunger: 'is very hungry', fatigue: 'is exhausted', cold: 'is dangerously cold', health: 'is in a bad way', morale: 'is losing heart' }; Game.banner(d.s.name + ' ' + names[d.need] + '.', 'warn', 5); d.s.say(CHAT[{ hunger: 'hungry', fatigue: 'tired', cold: 'cold', health: 'sick', morale: 'low' }[d.need]][0]); }
  }
  rumor() { const run = this.run; if (run.flags.rumor) return; run.flags.rumor = true; run.flags.rumorToday = true; Run.allMorale(run, 6); Run.log(run, 'A rumor with a date: ceasefire on Day ' + run.ceasefire + '.'); Bus.emit('ceasefireRumor', { day: run.ceasefire }); Game.banner('A rumor: ceasefire on Day ' + run.ceasefire + '.', 'star', 6); }
  fire(ev) {
    const run = this.run;
    if (ev.type === 'visitor') { this.visitor = { id: ev.id, t: 0 }; this.knockT = 0; Bus.emit('visitorArrives', { id: ev.id }); Game.banner('Someone is at the door.', 'raid', 6); }
    else if (ev.type === 'moment') { const s = run.surv.find(q => q.id === ev.id); if (s && s.present && !this.visitor) { const d = momentDialog(run, ev.id, null); if (d) { s.flare = 0.6; Snd.sfx('chime'); Game.push(d); } } }
    else if (ev.type === 'hazard') this.startHazard(ev.id);
    else if (ev.type === 'rumor') { note(run.up.radio ? 'The radio crackles on by itself: "...talks at the river... thirty days..."' : 'Mr. Halloran shouts up the stairwell: "They are saying thirty days! Thirty!"', 6); this.rumor(); }
  }
  /* Every hazard is telegraphed: rising tone, pulsing outline, banner. Then it lands. */
  startHazard(id) {
    const w = this.w, run = this.run, D = w.diff, r = w.rng, fy = CFG.home.floorsY, warn = HAZARDS[id].warn * D.warn;
    const rect = rm => ({ x: rm.x0, y: fy[rm.f - 1] + 10, w: rm.x1 - rm.x0, h: fy[rm.f] - fy[rm.f - 1] - 10 });
    if (id === 'tremor' || id === 'fire') {
      const rooms = HOME_ROOMS.filter(q => q.f <= 3 && !run.broken.rooms[q.id] && !(q.f === 3 && q.z === 2)); if (!rooms.length) return;
      const rm = id === 'fire' && !run.fire ? (r.chance(0.5) ? HOME_ROOMS.find(q => q.id === '3-1') : r.pick(rooms)) : r.pick(rooms);
      if (id === 'fire' && run.fire) return;
      const h = { id, t: warn, rm, tele: rect(rm) }; this.hz.push(h);
      if (id === 'tremor') { Snd.sfx('rumble', { d: warn + 0.5 }); Input.rumble(0.35, warn * 1000); Bus.emit('hazardWarning', { type: id, text: 'Shelling close by. Get out from under the falling dust!' }); }
      else { h.smoke = { type: 'smoke', x: (rm.x0 + rm.x1) / 2, f: rm.f }; w.L.objs.push(h.smoke); Snd.sfx('crackle'); Bus.emit('hazardWarning', { type: id, text: 'Smoke. Something is catching. Fetch water!' }); }
    } else if (id === 'flood') { this.hz.push({ id, t: warn, rise: 0, tele: { x: 90, y: fy[3] + 10, w: 780, h: fy[4] - fy[3] - 10 } }); Snd.sfx('drip'); Bus.emit('hazardWarning', { type: id, text: 'Water is coming into the cellar. Bail it at the barrel.' }); }
    else if (id === 'gas') { if (run.gas) return; run.gas = { t: warn, blown: false }; Snd.sfx('hiss', { d: 1.5 }); Bus.emit('hazardWarning', { type: id, text: 'A hiss from the stove. Gas. Fix it before it finds a spark.' }); }
    else if (id === 'stair') {
      const c = w.L.ladders.filter(l => !l.broken); if (!c.length) return; const lad = r.pick(c), ya = w.floorY(lad.fa), yb = w.floorY(lad.fb);
      this.hz.push({ id, t: warn, lad, tele: { x: Math.min(lad.xa, lad.xb) - 16, y: ya - 10, w: Math.abs(lad.xa - lad.xb) + 32, h: yb - ya + 14 } }); Snd.sfx('creak'); Snd.sfx('creak', {});
      Bus.emit('hazardWarning', { type: id, text: 'A stair is groaning. Step off it!' });
    }
  }
  updateHazards(dt) {
    const w = this.w, run = this.run, D = w.diff;
    w.tele = [];
    for (let i = this.hz.length - 1; i >= 0; i--) {
      const h = this.hz[i]; h.t -= dt;
      if (h.t > 0) { if (h.tele) w.tele.push(h.tele); if (h.id === 'tremor' && Math.random() < dt * 30) Parts.emit('dust', FX.r(h.rm.x0, h.rm.x1), h.tele.y + 4, 1, {}); if (h.id === 'tremor') w.shake(1.2); continue; }
      if (h.id === 'tremor') {
        w.shake(9, 0.8); Snd.sfx('thud'); Snd.sfx('hit'); Parts.emit('dust', (h.rm.x0 + h.rm.x1) / 2, h.tele.y + 20, 40, { sx: 240, sy: 30 }); Parts.emit('puff', (h.rm.x0 + h.rm.x1) / 2, w.floorY(h.rm.f) - 20, 10, { sx: 200 });
        for (const s of w.surv) if (w.entF(s) === h.rm.f && s.x >= h.rm.x0 && s.x < h.rm.x1) { if (s.damage(HAZARDS.tremor.dmg * D.dmg, 'tremor')) w.impact(s.x, w.entY(s) - 26, 1); }
        run.broken.rooms[h.rm.id] = 1; w.L.objs.push({ type: 'rubble', x: (h.rm.x0 + h.rm.x1) / 2, f: h.rm.f, room: h.rm.id });
        Bus.emit('hazardImpact', { type: 'tremor' }); note('The room is a mess of plaster and lath. It will need wood to make it usable again.');
      } else if (h.id === 'fire') {
        if (h.smoke) h.smoke.type = 'gone';
        run.fire = { type: 'fire', x: (h.rm.x0 + h.rm.x1) / 2, f: h.rm.f, hp: D === DIFF.harsh ? 3 : 2, t: 0, room: h.rm.id, burnT: 10 }; w.L.objs.push(run.fire); Snd.sfx('crackle'); Bus.emit('hazardImpact', { type: 'fire' });
      } else if (h.id === 'flood') {
        if (h.rise < 1) { h.rise += dt / 14; run.flood = Math.max(run.flood, clamp(h.rise, 0, 1)); h.t = 0.001; if (Math.random() < dt * 4) Snd.sfx('drip'); if (h.rise < 1) continue; }
        Bus.emit('hazardImpact', { type: 'flood' });
      } else if (h.id === 'stair') {
        const l = h.lad; l.broken = true; run.broken.ladders[l.id] = 1; Snd.sfx('thud'); Snd.sfx('creak'); w.shake(5, 0.5);
        for (const s of w.surv) if (s.cl && s.cl.lad === l) { s.cl = null; s.f = l.fb; s.x = l.xb; if (s.damage(HAZARDS.stair.dmg * D.dmg, 'stair')) w.impact(s.x, w.entY(s) - 26, 0.8); }
        w.L.objs.push({ type: 'stairfix', x: l.xa + (l.stairs ? sgn(l.xa - l.xb) * 30 : 30), f: l.fa, lad: l }, { type: 'stairfix', x: l.xb + (l.stairs ? -sgn(l.xa - l.xb) * 30 : 30), f: l.fb, lad: l });
        Bus.emit('hazardImpact', { type: 'stair' }); note('The stair has gone. Two planks of wood would mend it.');
      }
      this.hz.splice(i, 1);
    }
    const f = run.fire;
    if (f && f.type === 'fire') {
      f.t += dt; f.burnT -= dt;
      if (Math.random() < dt * 1.5) Snd.sfx('crackle');
      for (const s of w.surv) if (w.entF(s) === f.f && Math.abs(s.x - f.x) < 30 && !s.busy) { if (s.damage(HAZARDS.fire.dmg * D.dmg * 0.6, 'fire')) w.impact(s.x, w.entY(s) - 26, 0.5); }
      if (f.burnT <= 0) { f.burnT = 11; const k = ['wood', 'cloth', 'raw', 'book'].find(q => Run.count(run, q) > 0); if (k) { Run.add(run, k, -1); note('The fire takes some ' + ITEMS[k].n.toLowerCase() + '. Water, quickly!'); } }
      if (f.t > 48) { f.type = 'gone'; run.fire = null; run.broken.rooms[f.room] = 1; w.L.objs.push({ type: 'rubble', x: f.x, f: f.f, room: f.room }); note('The fire burns itself out. The room is black to the ceiling.'); Run.allMorale(run, -5); Run.tag(run, 'fire'); }
    }
    const g = run.gas;
    if (g && !g.blown) {
      g.t -= dt; if (Math.random() < dt * 0.7) Snd.sfx('hiss', { v: 0.6 });
      if (g.t <= 0) { g.blown = true; w.shake(8, 0.7); Snd.sfx('thud'); Parts.emit('puff', UPGRADES.stove.x, w.floorY(3) - 30, 16, { sx: 80, sy: 40 }); for (const s of w.surv) if (w.entF(s) === 3) { if (s.damage(HAZARDS.gas.dmg * D.dmg, 'gas')) w.impact(s.x, w.entY(s) - 26, 0.8); s.addMorale(-4); } Bus.emit('hazardImpact', { type: 'gas' }); note('A dull thump from the stove. Nobody is badly hurt. It still needs fixing before anyone cooks.'); }
    }
  }
  chatter(dt) {
    const w = this.w, run = this.run; this.chatT -= dt; this.catT -= dt;
    if (this.catT <= 0 && run.cat && Run.once(run, 'catgag')) { this.catT = 60; note('The cat has knocked a spoon off the table. It maintains eye contact.'); Run.allMorale(run, 2); Snd.sfx('clatter'); }
    if (this.chatT > 0) return; this.chatT = 8 + Math.random() * 7;
    const list = w.surv.filter(s => s.pl < 0 && !s.sleeping && !s.hidden && !s.bubble); if (!list.length) return;
    const s = list[Math.floor(Math.random() * list.length)], low = w.surv.find(p => p !== s && p.morale < 35 && Math.abs(p.x - s.x) < 150 && p.f === s.f);
    const key = s.hunger < 25 ? 'hungry' : s.cold < 25 ? 'cold' : s.sick ? 'sick' : s.fatigue < 20 ? 'tired' : s.morale < 20 ? 'low' : low ? 'comfort' : s.morale > 78 ? 'hopeful' : s.working ? 'work' : 'idle';
    if (key === 'comfort' && low) { low.addMorale(2.5); Run.trust(run, s, low, 1.5); }
    if (key === 'sick') { s.coughT = 1; Snd.sfx('cough'); }
    const pool = CHAT[key]; s.say(pool[Math.floor(Math.random() * pool.length)]);
  }
  openTools() {
    const run = this.run, items = [{ type: 'head', label: 'SPAWN' },
      { label: '+5 food and water', act: () => { Run.add(run, 'can', 3); Run.add(run, 'raw', 2); Run.add(run, 'water', 5); } }, { label: '+6 wood, parts, cloth', act: () => { Run.add(run, 'wood', 6); Run.add(run, 'parts', 6); Run.add(run, 'cloth', 6); Run.add(run, 'fuel', 3); } },
      { label: '+ medicine kit', act: () => { Run.add(run, 'meds', 2); Run.add(run, 'bandage', 2); Run.add(run, 'matches', 3); Run.add(run, 'candle', 2); } },
      { label: 'Music box and cat', act: () => { run.musicbox = true; run.cat = true; this.rebuildHome(); } }, { type: 'head', label: 'TRIGGER' }];
    for (const id of ['tremor', 'fire', 'flood', 'gas', 'stair']) items.push({ label: 'Hazard: ' + HAZARDS[id].n, act: () => { Game.pop(); this.startHazard(id); } });
    for (const id of ['beggar', 'trader', 'child', 'thug', 'soldier', 'catArrives']) items.push({ label: 'Visitor: ' + VISITORS[id].title, act: () => { Game.pop(); this.fire({ type: 'visitor', id }); } });
    items.push({ label: 'Morale +25 (watch the color)', act: () => Run.allMorale(run, 25) }, { label: 'Morale -25', act: () => Run.allMorale(run, -25) },
      { label: 'Night raid with NPC dummies', act: () => { Game.pop(); Game.go('NightHome', { rules: 'raid1', onDone: () => Game.go('HomeDay', {}, 'blinds') }, 'blinds'); } },
      { label: 'Stealth test course', act: () => { Game.pop(); const ids = Run.present(run).slice(0, 1).map(s => s.id); Game.go('NightSortie', { loc: 'pharmacy', scouts: ids, pack: { bottle: 3 }, battery: 2, time: 600, onDone: () => Game.go('HomeDay', {}, 'blinds') }, 'iris'); } },
      { label: 'Leave the workshop', act: () => { Game.pop(); Flow.results({ win: true, title: 'Workshop closed', lines: ['Everything is back in its drawer.'], score: 0 }); } });
    Game.push(menuOverlay({ title: 'Workshop tools', key: 'tools', w: 420, y: 50, maxRows: 13, items, onBack: () => Game.pop() }));
  }
  pauseExtra(items) { if (this.run.mode === 'endless' && this.run.day > 1) items.push({ label: 'End the winter here', sub: 'Bank your days and see the results.', act: () => { Game.ov.length = 0; Flow.endRun('bank'); } }); if (this.sandbox) items.push({ label: 'Workshop tools', act: () => { Game.pop(); this.openTools(); } }); }
  update(dt) {
    const run = this.run, w = this.w; if (this.done) return;
    if (this.radioMusicT > 0) { this.radioMusicT -= dt; if (this.radioMusicT <= 0) Snd.setTrack(homeTrack(run)); }
    const dd = dt * (run.mods.double ? 2 : 1) / CFG.dayLen;
    if (!this.sandbox) this.dayT += dd;
    Run.tick(run, dd * 0.55 * (this.sandbox ? 0.25 : 1), w);
    while (this.evIdx < run.events.length && run.events[this.evIdx].t <= this.dayT) this.fire(run.events[this.evIdx++]);
    if (!this.mealDone && this.dayT >= 0.5) { this.mealDone = true; note(Run.meal(run), 5); for (const s of w.surv) if (!s.sleeping) s.act('eat', 1.4); Snd.sfx('can'); }
    this.updateHazards(dt); this.chatter(dt);
    if (this.visitor) {
      this.visitor.t += dt; this.knockT -= dt;
      if (this.knockT <= 0) { this.knockT = 3.4; Snd.sfx('knock'); const d = w.L.blockers[0]; if (d) d.hitT = 0.25; }
      if (this.visitor.t > 30) { const id = this.visitor.id; if (/Back$|Gift$/.test(id)) run.callbacks.push({ id, day: run.day + 1 }); this.visitor = null; note('Whoever it was has gone back down the stairs.'); }
    }
    emitWeather(run, dt, 0.5);
    if (Math.random() < dt * 2 && !Save.s.lowfx) Parts.emit('mote', FX.r(110, 250), FX.r(150, 290), 1, {});
    Snd.tension = (this.hz.length || run.fire || (run.gas && !run.gas.blown)) ? 0.6 : 0;
    this.objective = this.visitor ? 'Someone is knocking. Answer the door (ground floor, right).' : run.fire ? 'Fire! Douse it with water.' : (run.gas && !run.gas.blown) ? 'Gas leak. Fix the stove.' : run.flood > 0.2 ? 'The cellar is flooding. Bail at the barrel.'
      : this.sandbox ? 'Workshop: the front door opens the tools.' : this.dayT > 0.78 ? 'Dusk is close. Plan the night at the door.' : 'Day ' + run.day + '  ' + CFG.phases[Run.phase(run)] + (run.ceasefire && run.flags.rumor ? '  (' + Math.max(0, run.ceasefire - run.day + 1) + ' to go)' : '');
    if (this.dayT >= 1 && !this.planOpen) { this.planOpen = true; Bus.emit('lastLight', {}); Bus.emit('duskStart', {}); Snd.sting('dawn'); Game.push(planOverlay(this, true)); return; }
    this.updatePlay(dt);
  }
  render(ctx) { Render.world(ctx, this.w); Render.post(ctx, { fog: this.run.weather === 'fog', flash: this.w.flash }); this.renderHUD(ctx, { clock: this.sandbox ? 0 : this.dayT, rations: true }); }
}

/* ==========================================================================
   SECTION 17: NIGHT SORTIE SCENE (scavenging levels)
   ========================================================================== */
class SortieScene extends PlayScene {
  enter(p) {
    this.p = p; const run = this.run = Game.run, D = DIFF[run.diff] || DIFF.normal;
    this.maxPlayers = Math.max(1, Math.min(p.scouts.length, (MODE_BY_ID[run.mode] || { coop: 2 }).coop));
    const seed = (run.seed ^ hashStr(p.loc + ':' + run.day + ':' + (p.n || 0))) >>> 0, r0 = new RNG(seed + 9);
    const o = Object.assign({ diff: D, blackout: !!run.mods.blackout, luck: !!(run.lucky || run.hint === p.loc), rare: (!run.musicbox && run.day >= 3 && r0.chance(0.3)) ? 'musicbox' : null, cat: !run.cat && run.day >= 2 && r0.chance(0.22), scarce: p.scarce || (run.mode === 'endless' ? Math.min(0.6, run.day * 0.02) : 0) }, p.lv || {});
    if (p.set === 'shutter') o.shutter = true; if (p.set === 'platform') o.collapse = true; if (p.set === 'crossing') o.signal = true;
    const L = p.level ? p.level(seed, D) : p.tutorial ? buildTutorial() : buildSite(p.loc, seed, o);
    const w = new World(L, run, { night: true, noTools: !!p.noTools, cart: !!p.cart, canLeave: () => this.canLeave() });
    w.surv = p.scouts.map(id => run.surv.find(s => s.id === id)).filter(Boolean);
    w.surv.forEach((s, i) => { s.resetRuntime(); w.place(s, L.spawn.x + i * 22, L.spawn.f); s.face = 1; });
    w.battery = (p.battery || 0) * 100; w.pack.items = Object.assign({}, p.pack || {});
    w.pack.cap = CFG.pack + (p.cart ? CFG.cartBonus : 0) + (w.surv.some(s => s.st.str >= 5) ? 2 : 0);
    w.cam.x = clamp(L.spawn.x, W / 2, Math.max(W / 2, L.w - W / 2));
    this.setupWorld(w);
    this.timeLeft = (p.time || CFG.nightLen) * (CFG.timeScale || 1) / (run.mods.double ? 2 : 1); this.total = this.timeLeft; this.over = false; this.hits = 0; this.warned = 0; this.downT = 0;
    this.tut = p.tutorial ? { i: 0, t: 0 } : null; this.calFlip = 1;
    Snd.setTrack(p.track || 'sortie'); Snd.amb.wind = 0.5; Snd.amb.rain = run.weather === 'rain' ? 0.7 : 0;
    this.baseObj = p.objective || (p.set === 'shutter' ? 'The medicine is behind the stuck shutter. Crank it between patrols.' : p.set === 'platform' ? 'The far end of the platform has the parts. Be ready to run.' : p.set === 'crossing' ? 'Cross the bridge. Decide at the lamp.' : 'Search for supplies. Be home before dawn.');
    if (!this.tut) note(LOCS[p.loc].n + '. ' + LOCS[p.loc].d, 4.5);
  }
  canLeave() {
    const w = this.w, ex = w.L.objs.find(o => o.type === 'exit');
    if (this.p.canLeave) { const r = this.p.canLeave(w, this); if (r !== true) return r; }
    if (ex && w.surv.some(s => !s.down && !s.carriedBy && Math.abs(s.x - ex.x) > 240)) return 'Wait for the others';
    return true;
  }
  on(ev, d) {
    const w = this.w, run = this.run; if (this.p.onEvent) this.p.onEvent(this, ev, d);
    if (ev === 'sortieExit') this.finish({});
    else if (ev === 'hit') { this.hits++; if (this.p.onHit) this.p.onHit(this, d); }
    else if (ev === 'goalReached') { if (this.p.onGoal) this.p.onGoal(this); }
    else if (ev === 'keepsakeFound') { if (this.p.onKeep) this.p.onKeep(this, d); }
    else if (ev === 'survivorDown' && d.sortie) Game.banner(d.s.name + ' is down.' + (w.surv.length > 1 ? ' Hold ' + Input.glyph('interact') + ' beside them to carry them home.' : ''), 'warn', 5);
    else if (ev === 'catPet' && !run.cat) { run.cat = true; note('The cat has decided to come home with you. You were not consulted.'); Bus.emit('catAdopted', {}); }
    else if (ev === 'setpieceDone' && d.id === 'shutter') note('The shutter gives. Behind it: shelves nobody has touched.');
    else if (ev === 'spotted' && !this.sawSpot) { this.sawSpot = true; Game.banner('Spotted! Break the line of sight, then hide.', 'warn', 4); }
    else if (ev === 'hazardWarning') Game.banner(d.text, 'warn', 4);
    else if (ev === 'talkCiv') this.talk(d.s, d.n);
    else if (ev === 'openTuner') Game.push(tunerOverlay(w.diff, run.diff === 'gentle', (ok, acc, wrong) => { if (ok) { d.o.done = true; w.goalDone = true; this.tuneAcc = acc; Bus.emit('goalReached', { s: d.s }); } else { Snd.sfx('static'); w.noise(d.o.x, d.o.f, 320, 'tuner'); const fl = w.L.floors[d.o.f]; w.spawnNPC('raider', fl.x1 - 30, d.o.f, { p0: d.o.x - 200, p1: d.o.x + 200 }).st = 'investigate'; w.npcs[w.npcs.length - 1].tgt = { x: d.o.x, f: d.o.f }; if (run.diff === 'harsh') w.spawnNPC('raider', fl.x0 + 30, d.o.f, { p0: d.o.x - 200, p1: d.o.x + 200 }); this.wrongTunes = (this.wrongTunes || 0) + 1; Game.banner('Static howls across the roof. Someone heard that.', 'warn', 4); } }));
    else if (ev === 'signalChoice') {
      Game.push(dialogOverlay({ id: 'signal', who: 'none', title: 'The signal lamp', text: 'An old railway lamp on a tripod, aimed across the river. One match would be seen from the whole east side. By everyone.', opts: [
        { l: 'Light it. Let them know people are alive here.', fn: () => { run.signal = 'signal'; d.o.done = 'signal'; Run.humanity(run, 6); Snd.sfx('match'); for (const n of w.npcs) if (n.T.hostile) { n.tgt = { x: d.o.x, f: d.o.f }; n.st = 'investigate'; } return 'The flame catches. Far away, after a long moment, another light answers. So do boots, much nearer.'; } },
        { l: 'Leave it dark. Bring everyone home quietly.', fn: () => { run.signal = 'silence'; d.o.done = 'dark'; return 'You put the matches away. The river goes on saying nothing.'; } }] }, run, () => { Bus.emit('setpieceDone', { id: 'crossing' }); }));
    }
  }
  /* People you meet out there: beg, trade, or a harder choice. */
  talk(s, n) {
    const w = this.w, run = this.run, P = w.pack.items, has = k => (P[k] || 0) > 0, food = ['can', 'raw'].find(has);
    n.talked = true; let d;
    if (n.mode === 'wounded') d = { id: 'wounded', who: 'patrol', title: 'A shape in the stairwell.', text: 'A long coat, a uniform you could not name, a dark sleeve held tight. "Bandage," the silhouette says. "Please. I will not make a sound."', opts: [
      { l: 'Bandage the arm', can: () => (has('bandage') ? null : 'No bandage in the pack.'), fn: () => { P.bandage--; Run.humanity(run, 8); n.st = 'ally'; n.owner = s; n.mode = ''; run.callbacks.push({ id: 'soldierBack', day: run.day + 6 }); Bus.emit('helped', {}); return 'They breathe out. "I will watch the stairs for you." And they do.'; } },
      { l: 'Promise to come back', fn: () => { n.talked = false; return 'A nod. Neither of you is sure.'; } },
      { l: 'Take what they carry', fn: () => { w.give('meds', 1, s); Run.humanity(run, -8); s.guilt += 35; run.betrayals++; return 'A strip of tablets from a breast pocket. They do not resist. That is worse.'; } }] };
    else if (n.st === 'trade') d = { id: 'trade', who: 'civ', title: 'A stranger with a bundle.', text: '"I trade fair. Mostly. What have you got?"', opts: [
      { l: 'A tin for two bandages', can: () => (has('can') ? null : 'No tin to trade.'), fn: () => { P.can--; w.give('bandage', 2, s); return 'Done. They check the tin for dents, out of habit.'; } },
      { l: 'Cloth for matches and a candle', can: () => (has('cloth') ? null : 'No cloth to trade.'), fn: () => { P.cloth--; w.give('matches', 1, s); w.give('candle', 1, s); return '"Warm hands or warm light. Never both." They seem pleased.'; } },
      { l: 'Nothing tonight', fn: () => { n.talked = false; return '"Then walk quietly. They are jumpy on the upper floor."'; } }] };
    else d = { id: 'beg', who: 'civ', title: 'Someone in the dark.', text: '"Please. Anything to eat? I can tell you where the good cupboard is."', opts: [
      { l: 'Share some food', can: () => (food ? null : 'No food in the pack.'), fn: () => { P[food]--; Run.humanity(run, 5); s.addMorale(4); const c = (w.L.conts || []).filter(q => q.items.length).sort((a, b) => b.items.length - a.items.length)[0]; if (c) { c.hint = true; c.items.push(w.L.loc.guarantee); } Bus.emit('helped', {}); return '"Second floor, behind the door that sticks. I never had the nerve." They mark it on your hand with a fingertip.'; } },
      { l: 'Shake your head', fn: () => { Run.humanity(run, -2); s.guilt += 10; return 'They fold back into the dark. No anger. Just less of them.'; } }] };
    Game.push(dialogOverlay(d, run, null));
  }
  finish(o) {
    if (this.over) return; this.over = true; const w = this.w, run = this.run;
    const downIds = w.surv.filter(s => s.down).map(s => s.id), carried = w.surv.filter(s => s.down && s.carriedBy).length;
    const loot = Object.assign({}, w.pack.items);
    if (o.late || o.failed) { const frac = o.failed ? 0.5 : 0.34; for (const k in loot) { let lose = 0; for (let i = 0; i < loot[k]; i++) if (w.rng.chance(frac)) lose++; loot[k] -= lose; } }
    if (w.battery >= 100) loot.battery = (loot.battery || 0) + Math.floor(w.battery / 100);
    for (const s of w.surv) { s.light = false; if (s.hidden) s.hidden.occ = null; s.hidden = null; s.carry = null; s.carriedBy = null; s.crouch = false; s.busy = null; if (s.down) { s.down = false; s.health = Math.max(s.health, 10); } }
    if (w.replay && w.replayScore >= num(run.replayScore)) { run.replay = w.replay; run.replayScore = w.replayScore; }
    if (carried) run.points.push('NO ONE LEFT BEHIND');
    Save.data.stats.spotted += w.spotted; Save.data.stats.close += w.closeCalls;
    Bus.emit('sortieDone', { spotted: w.spotted, loot: w.packCount(), full: w.packCount() >= w.pack.cap, failed: !!o.failed });
    this.p.onDone({ scouts: this.p.scouts, loot, loc: this.p.loc, spotted: w.spotted, close: w.closeCalls, distract: w.distractions, down: downIds, late: !!o.late, failed: !!o.failed, carried, crates: w.crates || 0, goal: !!w.goalDone, hits: this.hits, time: this.total - this.timeLeft, abort: !!o.abort, tuneAcc: this.tuneAcc || 0, wrong: this.wrongTunes || 0 });
  }
  pauseExtra(items) { if (this.tut) items.push({ label: 'Skip the tutorial', act: () => { Game.pop(); this.finish({ abort: true }); } }); else items.push({ label: 'Give up and go home', sub: 'Counts as being caught by daylight.', act: () => { Game.pop(); this.finish({ late: true }); } }); }
  update(dt) {
    if (this.over) return; const w = this.w, run = this.run;
    this.timeLeft -= dt;
    if (this.timeLeft < 60 && this.warned < 1) { this.warned = 1; Game.banner('The sky is paling. One minute to dawn.', 'warn', 5); Snd.sting('warn'); }
    if (this.timeLeft < 20 && this.warned < 2) { this.warned = 2; Game.banner('Dawn! Get to the street door!', 'warn', 5); Snd.sting('warn'); }
    if (this.timeLeft <= 0) { this.finish({ late: true }); return; }
    if (w.surv.length && w.surv.every(s => s.down)) { this.downT += dt; if (this.downT > 1.8) { this.finish({ failed: true }); return; } }
    if (this.tut) {
      const T = TUTORIAL[this.tut.i], s = w.surv[0]; this.tut.t += dt; let ok = false;
      if (T.id === 'move') ok = s.x > 170; else if (T.id === 'light') ok = s.light || this.tut.t > 12; else if (T.id === 'loot') ok = (w.looted || 0) > 0; else if (T.id === 'climb') ok = s.f === 0 && !s.cl;
      else if (T.id === 'crouch') { w.tutorialWake = true; ok = !!s.hidden || this.tut.t > 16; }
      if (ok && this.tut.i < TUTORIAL.length - 1) { this.tut.i++; this.tut.t = 0; Snd.sfx('chime'); }
      this.objective = Input.fmt(TUTORIAL[this.tut.i].t);
    } else this.objective = this.p.objFn ? this.p.objFn(this) : this.baseObj;
    emitWeather(run, dt, w.L.bg === 'open' ? 1 : 0.3);
    Snd.tension = Math.max(num(w.tension), this.timeLeft < 25 ? 0.6 : 0, w.L.collapse && w.L.collapse.active && !w.L.collapse.done ? 0.9 : 0);
    if (this.p.tick) this.p.tick(this, dt);
    if (this.over) return;
    this.updatePlay(dt);
  }
  render(ctx) {
    Render.world(ctx, this.w); Render.post(ctx, { fog: this.run.weather === 'fog' || this.run.mods.fog, flash: this.w.flash, close: this.w.slowT });
    this.renderHUD(ctx, { clock: 1 - this.timeLeft / this.total, clockLabel: 'NIGHT', stealth: true, extra: this.p.hud ? c => this.p.hud(c, this) : null });
    wayPointers(ctx, this);
  }
}

/* The radio dial for Signal Run: match three static patterns, then hold the signal. */
function tunerOverlay(diff, guide, onDone) {
  let round = 0, dial = 50, target = 20 + Math.random() * 60, wrong = 0, acc = 0, hold = 0, phase = 'tune', t = 0, st = 0; const tol = 5 * diff.warn;
  return {
    update(dt) {
      t += dt; const M = Input.menu, mx = Input.state(['main', 'pad0', 'pad1', 'pad2', 'pad3']).mx, p = Input.ptr;
      let d = Math.abs(mx) > 0.15 ? mx : 0; if (p.down && p.y > 150 && p.y < 330) d = p.x < W / 2 ? -1 : 1;
      dial = clamp(dial + d * 34 * dt, 0, 100); const err = Math.abs(dial - target);
      st -= dt; if (st <= 0) { st = 0.16; Snd.sfx('tune', { f: 300 + (1 - clamp(err / 50, 0, 1)) * 500 }); if (err > tol * 2) Snd.sfx('static', { d: 0.15 }); }
      let ok = M.ok; if (p.click && p.y > 350 && p.y < 400 && p.x > 400 && p.x < 560) ok = true;
      if (phase === 'tune') {
        if (ok) { if (err < tol) { round++; acc += 1 - err / tol; Snd.sfx('chime'); if (round >= 3) { phase = 'hold'; hold = 0; } else target = 10 + Math.random() * 80; } else { wrong++; Snd.sfx('deny'); Game.pop(); onDone(false, 0, wrong); return; } }
        if (M.back) Game.pop();
      } else {
        target = clamp(target + Math.sin(t * 1.3) * 16 * dt + Math.sin(t * 3.1) * 7 * dt, 6, 94);
        if (err < tol * 1.7) hold += dt; else hold = Math.max(0, hold - dt * 2);
        if (hold >= 10) { Game.pop(); Snd.sfx('unlock'); onDone(true, acc / 3, wrong); }
      }
    },
    render(ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H); UI.paper(ctx, 200, 90, 560, 340, { seed: 14 });
      txt(ctx, phase === 'tune' ? 'Find the signal  ' + (round + 1) + '/3' : 'Hold the signal', 480, 126, 16, G.ink, 'center', { outline: false, serif: true });
      const err = Math.abs(dial - target), cl = 1 - clamp(err / 40, 0, 1);
      ctx.fillStyle = G.soot; ctx.fillRect(230, 150, 500, 110); ctx.strokeStyle = G.bone; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = 0; i <= 100; i++) { const x = 230 + i * 5, y = 205 + Math.sin(i * 0.5 + t * 6) * 34 * cl + (Math.random() - 0.5) * 70 * (1 - cl); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
      ctx.fillStyle = G.iron; ctx.fillRect(230, 290, 500, 8); for (let i = 0; i <= 10; i++) ctx.fillRect(230 + i * 50 - 1, 284, 2, 20);
      if (guide || phase === 'hold') { ctx.strokeStyle = G.ink; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5; ctx.strokeRect(230 + (target - tol) * 5, 280, tol * 10, 28); ctx.setLineDash([]); }
      ctx.fillStyle = G.ink; ctx.beginPath(); ctx.moveTo(230 + dial * 5, 278); ctx.lineTo(224 + dial * 5, 262); ctx.lineTo(236 + dial * 5, 262); ctx.fill(); ctx.fillRect(229 + dial * 5, 278, 2, 30);
      if (phase === 'hold') { ctx.fillStyle = G.pewter; ctx.fillRect(330, 356, 300, 12); ctx.fillStyle = G.ink; ctx.fillRect(330, 356, 300 * hold / 10, 12); txt(ctx, 'Keep the needle on the signal for ten seconds.', 480, 394, 11, G.iron, 'center', { outline: false }); }
      else { txt(ctx, '[ Lock it in ]', 480, 380, 14, G.ink, 'center', { outline: false }); txt(ctx, 'Left / right to turn the dial. The line grows calm when you are close. A wrong lock is loud.', 480, 412, 10, G.iron, 'center', { outline: false, normal: true }); }
    }
  };
}

/* ==========================================================================
   SECTION 18: HOME AT NIGHT - one scene, several rule sets
   (raid, Hold the Door, The Long Night, Lantern Relay, Census Night,
    Keepsake Hunt, and the chapter 4 search)
   ========================================================================== */
class NightHome extends PlayScene {
  enter(p) {
    this.p = p; const run = this.run = Game.run, R = this.rules = NIGHT_RULES[p.rules];
    this.maxPlayers = Math.min(R.coop || 1, Math.max(1, Run.present(run).length)); this.t = 0; this.over = false; this.st = {}; this.calFlip = 1;
    const L = buildHome(run, true); L.dark = R.dark != null ? R.dark : 0.8;
    L.objs.push({ type: 'potrack', x: 310, f: 3 });
    for (const id in run.broken.rooms) { const rm = HOME_ROOMS.find(r => r.id === id); if (rm) L.objs.push({ type: 'rubble', x: (rm.x0 + rm.x1) / 2, f: rm.f, room: id }); }
    const w = new World(L, run, Object.assign({ night: true, homeAI: R.ai || 'defense', doorAct: (ww, s) => (R.doorAct ? R.doorAct(this, s) : null), pans: true }, R.opts || {}));
    w.surv = Run.present(run); w.battery = null;
    for (const s of w.surv) s.resetRuntime();
    w.surv.forEach((s, i) => { const spots = [[760, 3], [520, 3], [430, 2], [560, 1], [640, 3]]; w.place(s, spots[i % 5][0], spots[i % 5][1]); s.face = 1; });
    this.setupWorld(w);
    Snd.setTrack('homeNight'); Snd.amb.wind = 0.45; Snd.amb.rain = run.weather === 'rain' ? 0.6 : 0;
    this.door = L.blockers.find(b => b.id === 'frontdoor');
    R.init(this);
  }
  /* Raiders are always announced: a banner, a rising tone, and the tripwire cans if you set them. */
  warnRaid(n, nerve, delay) {
    const w = this.w, run = this.run, lead = (delay || HAZARDS.raid.warn) * w.diff.warn + (run.traps > 0 ? 3 : 0) + (run.up.lookout ? 3 : 0);
    Game.banner(run.traps > 0 ? 'The tripwire cans rattle. Boots on the stairs!' : 'Boots on the stairs. They are coming to the door.', 'raid', lead); Snd.sfx('rise', { d: Math.min(3, lead) }); if (run.traps > 0) Snd.sfx('clatter');
    Bus.emit('raiderWarning', { n }); if (this.mouse) { this.mouse.mood = 'raid'; this.mouse.moodT = 30; }
    this.st.pending = { t: lead, n, nerve: nerve || 0 };
  }
  tickRaid(dt) {
    const p = this.st.pending; if (!p) return;
    p.t -= dt; if (p.t > 0) return; this.st.pending = null;
    for (let i = 0; i < p.n; i++) { const n = this.w.spawnNPC('raider', CFG.home.streetX - 10 - i * 16, 3, { mode: 'raid', nerve: p.nerve - (this.run.traps > 0 && i === 0 ? 1 : 0) }); n.face = -1; }
    this.st.spawned = (this.st.spawned || 0) + p.n;
  }
  raiders() { return this.w.npcs.filter(n => n.mode === 'raid' && !n.gone); }
  on(ev, d) { if (this.rules.on) this.rules.on(this, ev, d); if (ev === 'hazardWarning' && d.text) Game.banner(d.text, 'warn', 4); if (ev === 'openCode' && this.rules.code) this.rules.code(this, d); }
  finish(res) { if (this.over) return; this.over = true; const w = this.w; for (const s of w.surv) { s.hidden = null; s.lantern = null; s.bundle = false; s.down = false; s.crouch = false; s.busy = null; if (s.health <= 0) s.health = 8; } if (w.replay && w.replayScore >= num(this.run.replayScore)) { this.run.replay = w.replay; this.run.replayScore = w.replayScore; } this.p.onDone(res || {}); }
  pauseExtra(items) { if (this.rules.quit) items.push({ label: 'Give up the night', act: () => { Game.pop(); this.finish({ win: false, quit: true }); } }); }
  update(dt) {
    if (this.over) return; const w = this.w; this.t += dt;
    for (const s of w.surv) if (s.health <= 0 && !s.down) { s.down = true; Bus.emit('survivorDown', { s }); }
    this.rules.update(this, dt); if (this.over) return;
    this.tickRaid(dt);
    emitWeather(this.run, dt, 0.4);
    Snd.tension = Math.max(num(w.tension), this.raiders().length ? 0.7 : 0, this.st.pending ? 0.4 : 0, this.st.tension || 0);
    this.updatePlay(dt);
  }
  render(ctx) {
    Render.world(ctx, this.w); Render.post(ctx, { fog: this.run.weather === 'fog', flash: this.w.flash, close: this.w.slowT });
    const R = this.rules; this.renderHUD(ctx, { clock: R.clock ? R.clock(this) : 0, clockLabel: R.label || 'NIGHT', day: R.dayNum ? R.dayNum(this) : this.run.day, extra: R.hud ? c => R.hud(c, this) : null });
    if (this.door && !this.door.open && this.raiders().length) { const x = this.w.sx(this.door.x), y = this.w.sy(this.w.floorY(3)) - 96; txt(ctx, 'door', x, y - 4, 8, G.bone, 'center'); UI.bar(ctx, x - 24, y, 48, 5, this.door.hp / this.door.max * 100); }
  }
}
function hudBox(ctx, lines) { const y0 = 92; ctx.fillStyle = grey(0, 0.6); rrect(ctx, 8, y0, 230, 14 + lines.length * 15, 6); ctx.fill(); lines.forEach((l, i) => txt(ctx, l, 16, y0 + 17 + i * 15, 10.5, G.bone, 'left', { outline: false })); }
function bargainDialog(sc, s, onGive) {
  const run = sc.run, yara = sc.w.surv.some(q => q.id === 'yara' && !q.down);
  return dialogOverlay({ id: 'bargain', who: 'raider', title: 'A voice through the door.', text: '"Open up. We only want what is on your shelves."', opts: [
    { l: 'Pass something out through the gap', fn: () => { onGive(); for (const n of sc.raiders()) { n.nerve = 0; n.st = 'flee'; n.carry = 1; } return 'A hand takes it. A pause. Then boots, going down.'; } },
    { l: yara ? 'Let Yara talk them down' : 'Try to talk them down', can: () => (sc.st.talked ? 'They have stopped listening.' : null), fn: () => { sc.st.talked = true; if (Math.random() < (yara ? 0.75 : 0.35)) { for (const n of sc.raiders()) { n.nerve = 0; n.st = 'flee'; } Bus.emit('talkedDown', { s }); return yara ? 'Three hours of late-night radio in one minute. Somebody outside actually laughs. They go.' : 'You talk about nothing: the cold, the stairs. Somehow it is enough.'; } for (const n of sc.raiders()) n.nerve += 1; return 'A silence. Then the banging starts again, harder.'; } },
    { l: 'Say nothing. Hold the door.', fn: () => 'You put your shoulder to the boards and breathe quietly.' }] }, run, null);
}
const NIGHT_RULES = {
  /* A single raid during a campaign night when nobody went out. */
  raid1: { coop: 2, quit: false, label: 'RAID',
    init(sc) { const r = sc.run.raidTonight || { str: 4 }; sc.objective = 'Raiders tonight. Brace the door, bang the pots, hide the frightened.'; sc.warnRaid(clamp(Math.round(r.str / 3), 1, 3), 0, 5); sc.st.stolen = 0; },
    doorAct(sc, s) { if (sc.raiders().some(n => n.st === 'bang')) return { label: 'Bargain through the door', fn: () => Game.push(bargainDialog(sc, s, () => { stealFrom(sc.w, 2); })) }; if (sc.door.open) return null; return { label: 'Brace the door', hold: 1.1, sfx: 'thud', fn: () => { sc.door.hp = Math.min(sc.door.max, sc.door.hp + (s.id === 'dov' ? 22 : 14)); } }; },
    on(sc, ev) { if (ev === 'raidLoot') { sc.st.stolen += stealFrom(sc.w, 2 + (sc.w.rng.chance(0.5) ? 1 : 0)); Run.tag(sc.run, 'theft'); } },
    clock(sc) { return clamp(sc.t / 70, 0, 1); },
    update(sc) { if (!sc.st.pending && sc.st.spawned && !sc.raiders().length) { sc.st.endT = (sc.st.endT || 0) + 1 / 60; if (sc.st.endT > 2) { const run = sc.run; run.lastRaid = run.day; run.stats.raids++; Run.tag(run, 'raid'); if (sc.door.open) run.barricade = Math.max(0, run.barricade - 1); if (run.traps > 0) run.traps--; Run.log(run, sc.st.stolen ? 'Raiders got in and took ' + sc.st.stolen + ' things.' : 'Raiders came. The door held.'); if (!sc.st.stolen) Run.allMorale(run, 4); sc.finish({}); } } },
    hud(ctx, sc) { hudBox(ctx, ['Raiders: ' + sc.raiders().length + (sc.st.pending ? ' (coming)' : ''), 'Taken: ' + sc.st.stolen]); } },

  /* Hold the Door: five waves. */
  door: { coop: 2, quit: true, label: 'WAVE', dayNum: sc => Math.min(5, sc.st.wave || 1),
    init(sc) { sc.st.wave = 0; sc.st.bundles = 6; sc.st.gap = 4; sc.st.talks = 0; sc.objective = 'Hold the door through five waves. Protect the supply bundles.'; sc.w.stashState = null; },
    doorAct(sc, s) { if (sc.raiders().some(n => n.st === 'bang')) return { label: 'Bargain through the door', fn: () => Game.push(bargainDialog(sc, s, () => { sc.st.bundles = Math.max(0, sc.st.bundles - 1); })) }; if (sc.door.open) return { label: 'Prop the door back up', hold: 2.4, sfx: 'thud', fn: () => { if (!sc.raiders().some(n => n.st === 'loot')) { sc.door.open = false; sc.door.hp = 30; } } }; return { label: 'Brace the door', hold: 1.1, sfx: 'thud', fn: () => { sc.door.hp = Math.min(sc.door.max, sc.door.hp + (s.id === 'dov' ? 22 : 14)); } }; },
    on(sc, ev) { if (ev === 'raidLoot') { sc.st.bundles = Math.max(0, sc.st.bundles - 1); Game.banner('A bundle is gone. ' + sc.st.bundles + ' left.', 'warn', 3); } },
    clock(sc) { return clamp((sc.st.wave - 1 + (sc.raiders().length ? 0.5 : 1)) / 5, 0, 1); },
    update(sc, dt) {
      const st = sc.st, w = sc.w;
      if (st.bundles <= 0 || w.surv.every(s => s.down)) { sc.finish({ win: false, lines: ['The shelves are empty.', 'Waves held: ' + Math.max(0, st.wave - 1) + ' of 5'], score: Math.max(0, st.wave - 1) * 100 }); return; }
      if (!st.pending && !sc.raiders().length) {
        st.gap -= dt; for (const s of w.surv) if (s.down) { s.down = false; s.health = 25; }
        if (st.gap <= 0) { if (st.wave >= 5) { sc.finish({ win: true, lines: ['Five waves. The door held.', 'Bundles kept: ' + st.bundles + ' of 6'], score: 500 + st.bundles * 100 + Math.round(sc.door.hp), ach: 'doorheld' }); return; } st.wave++; st.gap = 9; st.talked = false; sc.warnRaid(1 + Math.floor(st.wave / 2) + (sc.run.diff === 'harsh' ? 1 : 0), st.wave * 0.5 - (sc.run.diff === 'gentle' ? 1 : 0), 5); }
      }
    },
    hud(ctx, sc) { hudBox(ctx, ['Wave ' + Math.max(1, sc.st.wave) + ' of 5', 'Supply bundles: ' + sc.st.bundles, sc.raiders().length ? 'At the door: ' + sc.raiders().length : sc.st.pending ? 'They are coming...' : 'A breath between waves']); } },

  /* The Long Night: keep the last candle lit until dawn. */
  candle: { coop: 2, quit: true, label: 'NIGHT', opts: { lastCandle: true, drafts: true, raidTarget: () => ({ x: 590, f: 2 }) },
    init(sc) { const w = sc.w; w.candle = { lit: true, str: 100, matches: sc.run.diff === 'harsh' ? 2 : 3, outT: 0, outs: 0, shield: 0 }; sc.st.len = 180 / (sc.run.mods.double ? 2 : 1); sc.st.draftT = 12; sc.st.raids = [55, 115]; sc.objective = 'Keep the last candle lit until dawn. Shield it from drafts; board the windows.'; Run.add(sc.run, 'wood', Math.max(0, 2 - Run.count(sc.run, 'wood'))); },
    doorAct(sc, s) { if (sc.door.open) return null; return { label: 'Brace the door', hold: 1.1, sfx: 'thud', fn: () => { sc.door.hp = Math.min(sc.door.max, sc.door.hp + 14); } }; },
    on(sc, ev) { if (ev === 'raidLoot') { const c = sc.w.candle; c.lit = false; c.str = 0; c.outs++; Snd.sfx('sip'); Game.banner('They snuffed the candle! Relight it.', 'warn', 4); } },
    clock(sc) { return clamp(sc.t / sc.st.len, 0, 1); },
    update(sc, dt) {
      const st = sc.st, w = sc.w, c = w.candle, D = w.diff;
      c.shield = Math.max(0, c.shield - dt);
      if (c.lit) { c.str = Math.min(100, c.str + dt * 4); c.outT = 0; } else { c.outT += dt; st.tension = 0.8; if (c.outT > 12 || c.matches <= 0) { sc.finish({ win: false, lines: ['The candle went out, and stayed out.', 'It lasted ' + Math.round(sc.t) + ' seconds of ' + Math.round(st.len) + '.'], score: Math.round(sc.t) }); return; } }
      if (c.lit) st.tension = 0;
      st.draftT -= dt;
      if (st.draft) {
        st.draft.t -= dt;
        if (st.draft.t <= 0) { const o = st.draft.o; o.rattle = false; Snd.sfx('gust'); const boarded = o.boarded; let loss = boarded ? 8 : 45 * D.dmg; if (c.shield > 0) loss *= 0.2; if (c.lit) { c.str -= loss; if (c.str <= 0) { c.lit = false; c.str = 0; c.outs++; Game.banner('The draft took the flame. Relight it!', 'warn', 4); Bus.emit('hazardImpact', { type: 'draft' }); } } st.draft = null; st.draftT = 13 + Math.random() * 9; }
      } else if (st.draftT <= 0) { const wins = w.L.objs.filter(o => o.type === 'window'); const o = wins[Math.floor(Math.random() * wins.length)]; if (o) { o.rattle = true; st.draft = { o, t: HAZARDS.draft.warn * D.warn }; Snd.sfx('rise', { d: 2 }); Game.banner(o.boarded ? 'A gust rattles the boards.' : 'A window rattles. Shield the flame!', 'warn', 3); Bus.emit('hazardWarning', { type: 'draft' }); } else st.draftT = 10; }
      if (st.raids.length && sc.t > st.raids[0]) { st.raids.shift(); sc.warnRaid(sc.run.diff === 'gentle' ? 1 : 2, 0, 6); }
      if (sc.t >= st.len) sc.finish({ win: true, lines: ['Dawn. The flame is still there.', 'Times it went out: ' + c.outs, 'Matches left: ' + c.matches], score: 1000 - c.outs * 200 + c.matches * 50, ach: 'lastcandle' });
    },
    hud(ctx, sc) { const c = sc.w.candle; hudBox(ctx, ['Flame: ' + (c.lit ? Math.round(c.str) + '%' : 'OUT (' + Math.ceil(12 - c.outT) + 's)'), 'Matches: ' + c.matches, sc.st.draft ? 'Draft coming!' : 'Still air']); } },

  /* Lantern Relay: roof to cellar, hand to hand. */
  lantern: { coop: 1, quit: true, ai: 'still', label: 'RELAY', dark: 0.88,
    init(sc) {
      const w = sc.w, L = w.L, D = w.diff, st = sc.st; sc.lockSwitch = true;
      st.points = [{ x: 480, f: 1 }, { x: 680, f: 2 }, { x: 280, f: 3 }, { x: 470, f: 4 }];
      st.points.forEach((p, i) => L.objs.push({ type: 'handoff', x: p.x + (i === 3 ? 0 : 24), f: p.f, idx: i }));
      const order = w.surv.slice(0, 4); st.order = order; st.leg = 0; st.handoffs = 0; st.drops = 0; st.window = 30 * D.warn; st.legT = st.window; st.battery = 100; st.candleT = 40;
      w.place(order[0], 300, 0); for (let i = 1; i < order.length; i++) w.place(order[i], st.points[i - 1].x + 40, st.points[i - 1].f);
      order[0].lantern = { dim: false }; Game.players[0].sid = order[0].id; sc.markActive();
      w.spawnNPC('raider', 420, 2, { p0: 240, p1: 620 }); w.spawnNPC('raider', 600, 3, { p0: 380, p1: 800 }); if (D.patrols > 1) w.spawnNPC('raider', 300, 1, { p0: 150, p1: 430 });
      w.o.handoffAct = (ww, s, o) => { if (!s.lantern || o.idx !== st.leg) return null; const last = o.idx === 3, next = st.order[(st.leg + 1) % st.order.length]; return { label: last ? 'Set the lantern down' : 'Hand the lantern to ' + (st.order.length > st.leg + 1 ? next.name : 'yourself, and breathe'), hold: 0.7, fn: () => { st.handoffs++; Snd.sfx('chime'); if (last) { st.done = true; return; } st.leg++; st.legT = st.window; const lan = s.lantern; if (st.order.length > st.leg) { s.lantern = null; next.lantern = lan; Game.players[0].sid = next.id; sc.markActive(); next.flare = 0.6; Parts.emit('ripple', next.x, ww.entY(next) - 24, 1, { col: next.hueC() }); } } }; };
      w.o.lanternAct = (ww, s, o) => ({ label: 'Pick up the lantern', hold: 0.5, fn: () => { o.type = 'gone'; s.lantern = { dim: st.dim }; Snd.sfx('pickup'); } });
      sc.objective = 'Carry the lantern from the roof to the cellar. Hand it on at each chalk mark.';
    },
    on(sc, ev, d) {
      if (ev === 'hit' && d.s.lantern) { const w = sc.w, s = d.s; s.lantern = null; sc.st.drops++; w.L.objs.push({ type: 'lantern', x: s.x, f: w.entF(s), lit: true }); Snd.sfx('clatter'); w.noise(s.x, w.entF(s), CFG.noise.clatter, 'lantern'); Game.banner('The lantern is dropped! Pick it up.', 'warn', 4); if (w.npcs.length < 4) w.spawnNPC('raider', s.x > 480 ? 160 : 800, w.entF(s), { p0: s.x - 160, p1: s.x + 160 }); }
    },
    clock(sc) { return clamp(sc.st.leg / 4 + (1 - sc.st.legT / sc.st.window) / 4, 0, 1); },
    update(sc, dt) {
      const st = sc.st, w = sc.w, car = w.surv.find(s => s.lantern);
      if (st.done) { sc.finish({ win: true, lines: ['The lantern is in the cellar, still lit.', 'Handoffs: ' + st.handoffs, 'Drops: ' + st.drops, 'Time: ' + Math.round(sc.t) + 's'], score: Math.max(100, 1200 - Math.round(sc.t) * 3 - st.drops * 150), ach: st.drops === 0 ? 'carried' : null }); return; }
      if (car) { st.battery = Math.max(0, st.battery - dt * (car.sprint ? 3.2 : 2.0) * (sc.run.temp < 0 ? 1.25 : 1) * w.diff.dmg); st.legT -= dt; }
      if ((st.battery <= 0 || st.legT <= 0) && !st.dim) { st.dim = true; if (car) car.lantern.dim = true; Game.banner(st.legT <= 0 ? 'Too slow. The lantern gutters to a candle.' : 'The battery is gone. Only the candle stub now.', 'warn', 4); Snd.sfx('tick'); }
      if (st.dim) { st.candleT -= dt; st.tension = 0.7; if (st.candleT <= 0) { sc.finish({ win: false, lines: ['The light went out on the stairs.', 'Handoffs: ' + st.handoffs, 'Drops: ' + st.drops], score: st.handoffs * 100 }); return; } }
      if (w.surv.every(s => s.down)) sc.finish({ win: false, lines: ['Every carrier fell.', 'Handoffs: ' + st.handoffs], score: st.handoffs * 100 });
    },
    hud(ctx, sc) { const st = sc.st; hudBox(ctx, ['Leg ' + (st.leg + 1) + ' of 4', st.dim ? 'Candle: ' + Math.ceil(st.candleT) + 's' : 'Battery: ' + Math.round(st.battery) + '%', 'Handoff window: ' + Math.max(0, Math.ceil(st.legT)) + 's', 'Drops: ' + st.drops]); } },

  /* Census Night, and the chapter 4 "Quiet Hands" search (a shorter, story version). */
  census: { coop: 1, quit: true, ai: 'still', label: 'CENSUS', opts: { stash: true },
    init(sc) { censusInit(sc, false); }, on(sc, ev, d) { censusOn(sc, ev, d); }, clock(sc) { return clamp(sc.st.ri / sc.st.rooms.length, 0, 1); }, update(sc, dt) { censusUpdate(sc, dt); }, hud(ctx, sc) { censusHud(ctx, sc); } },
  search: { coop: 2, quit: false, ai: 'still', label: 'SEARCH',
    init(sc) { censusInit(sc, true); }, on(sc, ev, d) { censusOn(sc, ev, d); }, clock(sc) { return clamp(sc.st.ri / sc.st.rooms.length, 0, 1); }, update(sc, dt) { censusUpdate(sc, dt); }, hud(ctx, sc) { censusHud(ctx, sc); } },

  /* Keepsake Hunt: nine small things, no combat, a little time pressure. */
  hunt: { coop: 1, quit: true, ai: 'still', label: 'HUNT', dark: 0.5,
    init(sc) {
      const w = sc.w, L = w.L, run = sc.run, H = run.hunt || (run.hunt = { found: [], t: 0, len: run.diff === 'harsh' ? 300 : 420, site: false });
      const spots = [{ x: 640, f: 1, c: 'Behind the photograph on the shelf.' }, { x: 130, f: 3, c: 'Where the plums wait for a good day.' }, { x: 786, f: 4, c: 'Under four hundred and six buttons.' }, { x: 834, f: 2, c: 'The stern lady keeps a secret behind her frame.' }, { x: 770, f: 2, code: 0, c: 'The locked drawer. Toby drew the numbers.' }, { x: 200, f: 4, code: 1, c: 'The old safe in the cellar.' }];
      spots.forEach((s, i) => L.objs.push({ type: 'keepspot', x: s.x + 12, f: s.f, idx: i, code: s.code }));
      if (!H.logged) { H.logged = true; Run.log(run, 'Nine keepsakes. Six are somewhere in this flat:'); spots.forEach(s => Run.log(run, s.c)); Run.log(run, RIDDLES[0].clue); Run.log(run, RIDDLES[1].clue); Run.log(run, 'Three more are next door, in the collapsed flat. Go by the front door.'); run.flags.clue0 = run.flags.clue1 = true; }
      w.o.keepAct = (ww, s, o) => { if (H.found.indexOf(o.idx) >= 0) return null; if (o.code != null) return { label: o.code ? 'Try the old safe' : 'Try the locked drawer', fn: () => Game.push(codeOverlay(run, o.code, () => Bus.emit('keepsakeFound', { idx: o.idx, s }))) }; return { label: 'Search here', hold: 1.2, sfx: 'page', fn: () => Bus.emit('keepsakeFound', { idx: o.idx, s }) }; };
      const pt = w.spawnNPC('raider', 700, 2, { p0: 240, p1: 800 }); pt.T = Object.assign({}, NPCT.raider, { spd: run.diff === 'harsh' ? 62 : 40, chase: run.diff === 'harsh' ? 110 : 84, steals: false, dmg: 6 }); pt.mode = '';
      sc.objective = 'Find the keepsakes. The diary has the clues. Three more are next door.'; note('The flat is quiet. Somewhere in it: six small things worth more than tins. Read the diary for clues.', 6);
    },
    doorAct(sc, s) { const H = sc.run.hunt; if (H.site) return { label: 'Next door has been searched', dis: 'Nothing left there.', fn() {} }; return { label: 'Go next door (the collapsed flat)', hold: 0.8, fn: () => { sc.over = true; const run = sc.run, ids = [s.id]; Game.go('NightSortie', { loc: 'apartments', scouts: ids, pack: {}, battery: 2, time: Math.max(60, H.len - H.t), lv: { keeps: 3, keepBase: 6, npcs: ['scav'], cont: 3 }, objective: 'Three keepsakes are somewhere in this flat. Then back to the street door.', onKeep: (ss, d) => huntFound(run, d, ss.w), tick: (ss, dt) => { H.t += dt; }, onDone: () => { H.site = true; Game.go('NightHome', { rules: 'hunt', onDone: sc.p.onDone }, 'blinds'); } }, 'iris'); } }; },
    on(sc, ev, d) { if (ev === 'keepsakeFound') huntFound(sc.run, d, sc.w); if (ev === 'hit') { sc.run.hunt.t += 20; Game.banner('Twenty seconds lost getting your breath back.', 'warn', 3); } },
    clock(sc) { return clamp(sc.run.hunt.t / sc.run.hunt.len, 0, 1); },
    update(sc, dt) {
      const H = sc.run.hunt, w = sc.w; H.t += dt;
      if (sc.run.diff === 'gentle') for (const o of w.L.objs) if (o.type === 'keepspot') o.glow = H.found.indexOf(o.idx) < 0 && w.surv.some(s => s.f === o.f && Math.abs(s.x - o.x) < 130);
      if (!sc.st.warned && H.t > H.len * 0.5) { sc.st.warned = true; Game.banner('Banging at the street door. It passes. Half the evening is gone.', 'raid', 5); Snd.sfx('knock'); Bus.emit('raiderWarning', {}); }
      const n = H.found.length;
      if (n >= 9) sc.finish({ win: true, lines: ['All nine keepsakes are home.', 'The album is in your profile.'], score: 900 + Math.round(H.len - H.t), ach: 'oldphoto' });
      else if (H.t >= H.len) sc.finish({ win: n >= 5, lines: [n + ' of 9 keepsakes found.', n >= 5 ? 'Enough to tell most of the story.' : 'Too few to piece the story together.'], score: n * 100 });
    },
    hud(ctx, sc) { const H = sc.run.hunt; hudBox(ctx, ['Keepsakes: ' + H.found.length + ' of 9', 'Time left: ' + Math.max(0, Math.ceil(H.len - H.t)) + 's', H.site ? 'Next door: searched' : 'Next door: 3 to find']); } }
};
function huntFound(run, d, w) {
  const H = run.hunt; if (H.found.indexOf(d.idx) >= 0) return; H.found.push(d.idx);
  if (Save.data.album.indexOf(d.idx) < 0) Save.data.album.push(d.idx);
  for (const s of w.surv) { s.addMorale(6); Parts.emit('ripple', s.x, w.entY(s) - 24, 1, { col: s.hueC() }); }
  Snd.sfx('pickup'); Game.push(memoryOverlay(d.s || w.surv[0], KEEPSAKES[d.idx]));
}
/* --- census helpers: a scripted route of rooms, each with a knock, a question, a check --- */
function censusInit(sc, story) {
  const w = sc.w, L = w.L, st = sc.st, run = sc.run, D = w.diff; st.story = story;
  const order = story ? ['3-2', '3-1', '3-0', '2-0', '2-1', '2-2'] : ['3-2', '3-1', '3-0', '2-0', '2-1', '2-2', '1-2', '1-1', '1-0', '4-2', '4-1', '4-0'];
  st.rooms = order.map(id => HOME_ROOMS.find(r => r.id === id)); st.ri = 0; st.phase = 'wait'; st.t = 6 * D.warn; st.found = 0; st.cleared = 0;
  L.objs.push({ type: 'hide', kind: 'rubble', x: 250, f: 2 }, { type: 'hide', kind: 'wardrobe', x: 470, f: 4 }, { type: 'hide', kind: 'stairs', x: 250, f: 1 });
  if (!story) { w.stashState = st.stash = { pantry: 5, hidden: 0, total: 5, lost: 0 }; L.objs.push({ type: 'stash', x: 250, f: 4 }, { type: 'stash', x: 660, f: 1 }, { type: 'stash', x: 150, f: 2 }); }
  st.gang = [w.spawnNPC('census', CFG.home.streetX - 20, 3, { mode: 'route' }), w.spawnNPC('census', CFG.home.streetX - 4, 3, { mode: 'route' })]; st.gang.forEach(n => { n.face = -1; n.tgt = { x: n.x, f: 3 }; });
  sc.door.open = true; st.distract = 0; st.toby = w.surv.some(s => s.id === 'toby'); st.mouse = true;
  w.extraActs = (s, consider, fy) => {
    if (st.toby && s.id === 'toby' && !st.drawn) consider({ label: 'Draw a dog on the wall (distraction)', hold: 1.2, pri: -6, fn: () => { st.drawn = true; st.distract = 8; st.dx = s.x; st.df = s.f; Snd.sfx('page'); note('Toby draws a very good dog. The census takers go to look at it.'); Bus.emit('tobyDraws', { s }); } }, s.x, fy - 70);
    const m = L.objs.find(o => o.type === 'mouse'); if (m && st.mouse && s.f === m.f && Math.abs(s.x - m.x) < 26) consider({ label: 'Ask the mouse for a false alarm', pri: 30, fn: () => { st.mouse = false; st.distract = 8; st.dx = 700; st.df = 4; m.mood = 'raid'; m.moodT = 10; Snd.sfx('squeak'); Snd.sfx('clatter'); note('A tiny sign reads "eek". Something clatters in the far corner of the cellar.'); } }, m.x, fy - 40);
  };
  sc.objective = story ? 'They search every room. Keep everyone out of sight. Rooms already checked are safe.' : 'Hide your people. Stash the bundles. Rooms already checked are safe.';
  Game.banner(story ? 'A gang is searching the building, room by room.' : 'Census takers on the stairs. They will check every room.', 'raid', 6); Snd.sfx('knock'); Bus.emit('raiderWarning', {});
}
function censusOn(sc, ev, d) {
  if (ev !== 'censusFound') return; const st = sc.st, s = d.s, w = sc.w, run = sc.run;
  st.found++; w.impact(s.x, w.entY(s) - 26, 0.6); w.mark(8, s.name + ' is found');
  if (st.story) { s.wound = true; s.health = clamp(s.health - 14, 6, 100); stealFrom(w, 3); Run.tag(run, 'theft'); Game.banner(s.name + ' is found and shoved aside. They take what they can carry.', 'warn', 5); s.prot = 3; if (s.hidden) { s.hidden.occ = null; s.hidden = null; } }
  else { s.taken = true; w.surv.splice(w.surv.indexOf(s), 1); Game.banner(s.name + ' is found and taken to the registry.', 'warn', 5); sc.markActive(); if (!run.gentle) { sc.finish({ win: false, lines: [s.name + ' was found.', 'Rooms cleared: ' + st.cleared + ' of ' + st.rooms.length], score: st.cleared * 50 }); } }
}
function censusUpdate(sc, dt) {
  const st = sc.st, w = sc.w, D = w.diff, fy = CFG.home.floorsY; w.tele = [];
  if (st.distract > 0) { st.distract -= dt; st.gang.forEach((n, i) => { n.tgt = { x: st.dx + i * 18, f: st.df }; }); return; }
  const rm = st.rooms[st.ri];
  if (!rm) { for (const s of w.surv) s.taken = false; const stash = st.stash; const ok = !stash || stash.hidden >= 4; if (st.story) { Run.log(sc.run, st.found ? 'They searched the flat and found ' + st.found + ' of us.' : 'They searched every room and found nobody. Quiet hands.'); if (!st.found) Run.allMorale(sc.run, 6); Bus.emit('setpieceDone', { id: 'search' }); sc.finish({}); } else sc.finish({ win: ok && (st.found === 0 || sc.run.gentle), lines: ['Rooms cleared: ' + st.cleared + ' of ' + st.rooms.length, 'People found: ' + st.found, 'Bundles saved: ' + stash.hidden + ' of ' + stash.total], score: st.cleared * 50 + stash.hidden * 100 - st.found * 200, ach: st.found === 0 && stash.hidden >= 5 ? 'notlisted' : null }); return; }
  const cx = (rm.x0 + rm.x1) / 2, rect = { x: rm.x0, y: fy[rm.f - 1] + 10, w: rm.x1 - rm.x0, h: fy[rm.f] - fy[rm.f - 1] - 10 };
  st.gang.forEach((n, i) => { n.tgt = { x: cx - 20 + i * 40, f: rm.f }; });
  const there = st.gang.every(n => n.st !== 'route' ? false : (n.f === rm.f && Math.abs(n.x - (cx - 20 + st.gang.indexOf(n) * 40)) < 12));
  if (st.phase === 'wait') { st.t -= dt; if (st.t <= 0) st.phase = 'walk'; else st.gang.forEach(n => { n.tgt = { x: n.x, f: n.f }; }); }
  else if (st.phase === 'walk') { w.tele.push(rect); if (there) { st.phase = 'knock'; st.t = 2.2 * D.warn; Snd.sfx('knock'); st.gang[0].say('census'); } }
  else if (st.phase === 'knock') { w.tele.push(rect); st.t -= dt; if (st.t <= 0) { st.phase = 'check'; st.t = 3; st.hide = null; const hides = w.L.objs.filter(o => o.type === 'hide' && o.f === rm.f && o.x >= rm.x0 && o.x < rm.x1 + (rm.z === 2 ? 90 : 0)); if (hides.length && w.rng.chance(sc.run.diff === 'gentle' ? 0.2 : sc.run.diff === 'harsh' ? 0.5 : 0.35)) { st.hide = w.rng.pick(hides); st.gang[1].say('census', 'Check the ' + (st.hide.kind === 'wardrobe' ? 'wardrobe' : st.hide.kind === 'coats' ? 'coat rack' : 'corner') + '.'); Snd.sfx('rise', { d: 2 }); } } }
  else if (st.phase === 'check') {
    st.t -= dt; w.tele.push(rect); if (st.hide) w.tele.push({ x: st.hide.x - 22, y: w.floorY(st.hide.f) - 70, w: 44, h: 72 });
    if (st.stash && rm.id === '3-1' && st.stash.pantry > 0) { st.stash.lost += st.stash.pantry; st.stash.pantry = 0; Game.banner('They take the bundles left in the pantry.', 'warn', 3); }
    for (const s of w.surv.slice()) if (!s.hidden && !s.down && w.entF(s) === rm.f && s.x >= rm.x0 && s.x < rm.x1 && s.prot <= 0) Bus.emit('censusFound', { s, n: st.gang[0] });
    if (sc.over) return;
    if (st.t <= 0) { if (st.hide && st.hide.occ) { const s = st.hide.occ; st.hide.occ = null; s.hidden = null; Snd.sfx('door'); Bus.emit('censusFound', { s, n: st.gang[1] }); if (sc.over) return; } st.cleared++; st.ri++; st.phase = 'walk'; if (st.stash && st.stash.lost >= st.stash.total) sc.finish({ win: false, lines: ['Every bundle was taken.'], score: st.cleared * 50 }); }
  }
}
function censusHud(ctx, sc) { const st = sc.st, rm = st.rooms[st.ri], names = { 1: 'bedrooms', 2: 'sitting room', 3: 'kitchen', 4: 'cellar' }; const lines = ['Rooms checked: ' + st.cleared + ' of ' + st.rooms.length, rm ? 'Next: ' + names[rm.f] + ', ' + ['left', 'middle', 'right'][rm.z] : 'Leaving...']; if (st.stash) lines.push('Bundles hidden: ' + st.stash.hidden + ' of ' + st.stash.total + (st.stash.pantry ? ' (' + st.stash.pantry + ' in pantry)' : '')); if (st.distract > 0) lines.push('Distracted: ' + Math.ceil(st.distract) + 's'); hudBox(ctx, lines); }
