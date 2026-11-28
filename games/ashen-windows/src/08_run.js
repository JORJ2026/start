
/* ==========================================================================
   SECTION 11: HOME SIMULATION - run state, needs, meals, nights, dawn
   ========================================================================== */
const Run = {
  create(mode, o) {
    o = o || {}; const d = Save.data, seed = (o.seed || ((Date.now() ^ (Math.random() * 1e9)) >>> 0)) >>> 0;
    const run = {
      mode, seed, day: o.day || 1, diff: o.diff || d.settings.diff, mods: {}, ceasefire: o.ceasefire === undefined ? 30 : o.ceasefire,
      gentle: o.gentle != null ? o.gentle : d.settings.gentle, surv: [], stock: Object.assign({}, START_STOCK), up: {}, barricade: 1, traps: 0,
      broken: { rooms: {}, ladders: {} }, humanity: 50, flags: {}, journal: [], daily: {}, tags: [],
      stats: { nights: 0, loot: 0, spotted: 0, close: 0, kind: 0, hard: 0, lost: 0, raids: 0, soups: 0, soupMeals: 0, distract: 0, quiet: 0, days: 0 },
      sites: ['pharmacy'], weather: 'clear', temp: 3, plant: 0.2, plantWater: 0, cat: false, musicbox: false, chapter: 0, callbacks: [],
      embers: 0, points: [], ration: 'full', heaterOn: false, candleLit: false, barrelLit: false, gardenT: 0, coopT: 0, flood: 0, gas: null, fire: null,
      raidTonight: null, lastRaid: -9, events: [], lossCount: 0, betrayals: 0, signal: null, hint: null, inesIdle: 0,
      opt: { eventFreq: o.eventFreq || 1, raidFreq: o.raidFreq || 1, winter: o.winter || 1, title: o.title || '' }, replay: null, ended: null
    };
    (o.mods || []).forEach(m => { run.mods[m] = true; });
    for (const id in UPGRADES) if (UPGRADES[id].start) run.up[id] = 1;
    let ids = (o.group || d.group).filter(id => SURVIVORS[id] && (id !== 'lamp' || d.unlocks.lamp));
    if (ids.length < 1) ids = DEFAULT_GROUP.slice();
    ids = ids.slice(0, clamp(o.count || 4, 1, 5));
    const r = new RNG(seed);
    ids.forEach((id, i) => {
      const s = new Survivor(id); s.variant = d.equip.variant[id] || 0; s.job = ['guard', 'repair', 'rest', 'play', 'cook'][i % 5];
      if (id === 'bea') s.job = 'cook'; if (id === 'toby') s.job = 'play'; if (id === 'pavel') s.job = 'guard'; if (id === 'dov') s.job = 'repair'; if (id === 'marta') s.job = 'tend';
      if (id === 'lamp') { const ks = ['spd', 'str', 'stl', 'luck', 'cook', 'med', 'res']; s.odd = {}; s.odd[r.pick(ks)] = 2; s.odd[r.pick(ks)] = 2; s.odd.noise = r.pick([-2, 2]); s.odd[r.pick(ks)] = -2; }
      run.surv.push(s);
    });
    (d.equip.perks || []).forEach(p => { if (p === 'pantry') run.stock.can += 3; if (p === 'kindling') run.stock.wood += 4; if (p === 'kit') { run.stock.meds = 1; run.stock.bandage += 2; } if (p === 'catfriend') run.cat = true; });
    if (o.supplies) for (const k in run.stock) run.stock[k] = Math.max(0, Math.round(run.stock[k] * o.supplies));
    if (mode !== 'story') run.sites = (o.sites || LOC_ORDER.slice(0, 3)).slice();
    return run;
  },
  serialize(run) { const o = JSON.parse(JSON.stringify(run, (k, v) => (k === 'replay' ? null : v))); return o; },
  restore(o) { const run = JSON.parse(JSON.stringify(o)); run.surv = run.surv.map(s => new Survivor(s.id, s)); run.daily = run.daily || {}; run.tags = run.tags || []; return run; },
  count(run, id) { return num(run.stock[id]); },
  add(run, id, n) { run.stock[id] = Math.max(0, num(run.stock[id]) + n); },
  has(run, cost) { for (const k in cost) if (num(run.stock[k]) < cost[k]) return false; return true; },
  pay(run, cost) { if (!this.has(run, cost)) return false; for (const k in cost) run.stock[k] -= cost[k]; return true; },
  costText(cost) { const a = []; for (const k in cost) a.push(cost[k] + ' ' + ITEMS[k].n); return a.join(', '); },
  log(run, text) { run.journal.push({ day: run.day, text }); if (run.journal.length > 60) run.journal.shift(); },
  present(run) { return run.surv.filter(s => s.present); },
  alive(run) { return run.surv.filter(s => !s.gone); },
  food(run) { return this.count(run, 'can') + this.count(run, 'raw') + this.count(run, 'soup') + this.count(run, 'egg') + this.count(run, 'bread') + this.count(run, 'jam'); },
  avgMorale(run) { const p = this.present(run); if (!p.length) return 0; return p.reduce((a, s) => a + s.morale, 0) / p.length; },
  allMorale(run, v) { for (const s of this.present(run)) s.addMorale(v); },
  trust(run, a, b, v) { if (!a || !b || a === b) return; a.trust[b.id] = clamp(num(a.trust[b.id], 50) + v, 0, 100); b.trust[a.id] = clamp(num(b.trust[a.id], 50) + v, 0, 100); if (Math.abs(v) >= 4) Bus.emit('relationshipChange', { a, b, v }); },
  once(run, key) { if (run.daily[key]) return false; run.daily[key] = true; return true; },
  tag(run, t) { if (run.tags.indexOf(t) < 0) run.tags.push(t); },
  humanity(run, v) { run.humanity = clamp(run.humanity + v, 0, 100); if (v > 0) { run.stats.kind++; this.tag(run, 'kind'); } else if (v < 0) { run.stats.hard++; this.tag(run, 'hard'); } },
  /* Campaign phase: The First Week, The Long Cold, The Breaking Point, The Thaw */
  phase(run) {
    if (run.mode === 'endless' || !run.ceasefire) { if (run.day <= 7) return 0; return Math.floor((run.day - 8) / 8) % 2 ? 2 : 1; }
    const f = (run.day - 1) / Math.max(4, run.ceasefire);
    let p = f < 0.25 ? 0 : f < 0.5 ? 1 : f < 0.84 ? 2 : 3;
    if (run.mods.winter && p === 3 && run.day < run.ceasefire - 1) p = 2;
    return p;
  },
  warmth(run) { const fuelOk = this.count(run, 'fuel') > 0 || this.count(run, 'wood') > 1; return 2 + (run.heaterOn && fuelOk ? 13 : 0) + run.barricade * 1.2 + (this.count(run, 'cloth') >= 2 ? 2 : 0) + (run.candleLit ? 1 : 0) + Math.min(this.count(run, 'blanket'), this.present(run).length) * 1.5 + num(run.drafts) * 1.2; },
  /* Advance everyone's needs by a fraction of a day. Critical crossings emit clear warnings. */
  tick(run, frac, world) {
    const pres = this.present(run), toby = pres.some(s => s.id === 'toby'), warmth = this.warmth(run);
    const suffering = pres.filter(s => s.sick || s.wound || s.hunger < 25).length;
    for (const s of pres) {
      const before = { hunger: s.hunger, fatigue: s.fatigue, cold: s.cold, health: s.health, morale: s.morale };
      s.hunger -= CFG.needs.hungerDay * frac;
      if (s.sleeping) s.fatigue += 95 * frac * (s.bed ? 1.25 : 0.9); else s.fatigue -= CFG.needs.fatigueDay * frac * (s.id === 'bea' ? 1.5 : 1) * (s.working ? 1.3 : 1);
      const eff = run.temp + warmth + (s.coat ? 6 : 0) + s.coldRes * 0.5 + (s.wears('cold') ? 2 : 0) - (world && s.f === 0 ? 6 : 0) + (run.barrelLit && world && s.f === 0 ? 12 : 0);
      if (eff >= 8) s.cold += 50 * frac; else s.cold -= (8 - eff) * 4.2 * frac * run.opt.winter;
      let dh = 0;
      if (s.hunger <= 0) dh -= 14; if (s.cold <= 0) dh -= 12; if (s.sick) dh -= 10 * (pres.some(p => p.job === 'tend' && p !== s) ? 0.6 : 1); if (s.wound) dh -= 7;
      if (dh === 0 && s.hunger > 40 && s.cold > 35) dh = s.sleeping ? 11 : 7;
      s.health += dh * frac;
      let target = 22 + 0.3 * (s.hunger + s.cold + s.fatigue) / 3 + (toby && s.id !== 'toby' ? 7 : 0) + (run.plant >= 1 ? 4 : 0) + (run.cat ? 4 : 0) + (run.candleLit ? 2 : 0)
        - s.guilt * 0.25 - run.lossCount * 6 - (s.id === 'ines' && run.inesIdle >= 2 ? 10 : 0) - (s.id === 'marta' ? Math.max(0, suffering - (s.sick || s.wound ? 1 : 0)) * 4 : 0) - (s.sick ? 6 : 0);
      let dm = (clamp(target, 0, 100) - s.morale) * 0.5 * frac; if (dm < 0) dm *= (1.3 - s.st.res * 0.1);
      s.morale += dm;
      s.guilt = Math.max(0, s.guilt - (pres.some(p => p.id === 'bea' && p !== s) ? 10 : 6) * frac);
      for (const k of ['hunger', 'fatigue', 'cold', 'health', 'morale']) {
        s[k] = clamp(num(s[k], 50), 0, 100);
        if (before[k] >= CFG.needs.critical && s[k] < CFG.needs.critical) Bus.emit('needCritical', { s, need: k });
      }
      if (s.health > 15) s.crit = 0;
    }
  },
  /* The shared midday meal. Returns a one-line summary. */
  meal(run) {
    const pres = this.present(run).sort((a, b) => a.hunger - b.hunger); if (!pres.length || run.ration === 'none') { for (const s of pres) s.addMorale(-3, true); return 'No meal today. The table is set anyway.'; }
    let soup = 0, fed = 0, missed = 0;
    for (const s of pres) {
      if (run.ration === 'half' && s.hunger > 55) continue;
      if (this.count(run, 'soup') > 0) { this.add(run, 'soup', -1); s.hunger += 46; soup++; fed++; s.addMorale(2, true); }
      else if (this.count(run, 'can') > 0) { this.add(run, 'can', -1); s.hunger += CFG.needs.mealFull; fed++; }
      else if (this.count(run, 'bread') > 0) { this.add(run, 'bread', -1); s.hunger += 38; fed++; s.addMorale(1, true); }
      else if (this.count(run, 'jam') > 0) { this.add(run, 'jam', -1); s.hunger += 26; fed++; s.addMorale(2, true); }
      else if (this.count(run, 'egg') > 0) { this.add(run, 'egg', -1); s.hunger += 30; fed++; }
      else if (this.count(run, 'raw') > 0) { this.add(run, 'raw', -1); s.hunger += CFG.needs.mealRaw; fed++; s.addMorale(-2, true); }
      else { missed++; s.addMorale(-5, true); }
      s.hunger = clamp(s.hunger, 0, 100);
      // water with the meal: clean if possible, rain water at a risk
      if (this.count(run, 'water') > 0) this.add(run, 'water', -1);
      else if (this.count(run, 'dirty') > 0) { this.add(run, 'dirty', -1); s.badWater = true; }
      else { s.health = clamp(s.health - 6, 0, 100); s.addMorale(-3, true); }
    }
    if (this.count(run, 'tea') > 0 && fed) { this.add(run, 'tea', -1); for (const s of pres) s.addMorale(3, true); }
    if (fed >= 2) for (let i = 0; i < pres.length - 1; i++) this.trust(run, pres[i], pres[i + 1], 2);          // eating together builds trust
    if (soup >= 2) { run.stats.soupMeals++; this.tag(run, 'soup'); }
    if (missed) this.tag(run, 'hungry');
    Bus.emit('mealShared', { fed, soup, missed });
    return missed ? (fed ? 'A thin meal. ' + missed + ' went without.' : 'Nothing to eat today.') : soup >= 2 ? "Soup for everyone: '" + (run.soupName || SOUPS[run.day % SOUPS.length]) + "'." : 'Everyone ate something.';
  },
  /* Resolve the night at home (while a scout is out) and everything that changes at dawn. */
  dawn(run, sortie) {
    const r = new RNG(run.seed + run.day * 104729), rep = { lines: [], loot: {}, lost: [], left: [], back: [], awards: [], embers: 0, diary: '', day: run.day, sortie };
    const scouts = sortie ? sortie.scouts : [], pres = this.present(run), homeTeam = pres.filter(s => scouts.indexOf(s.id) < 0);
    run.stats.days++;
    if (sortie) {
      run.stats.nights++; let n = 0;
      for (const k in sortie.loot) { if (sortie.loot[k] > 0 && k !== 'keepsake') { this.add(run, k, sortie.loot[k]); rep.loot[k] = sortie.loot[k]; n += sortie.loot[k]; } }
      run.stats.loot += n; run.stats.spotted += sortie.spotted || 0; run.stats.close += sortie.close || 0; run.stats.distract += sortie.distract || 0;
      if (!sortie.spotted) { run.stats.quiet++; run.points.push('QUIET NIGHT'); }
      if (sortie.distract) run.points.push('CLEVER DISTRACTION');
      for (const s of pres) if (scouts.indexOf(s.id) >= 0) { s.fatigue = clamp(s.fatigue - 30, 0, 100); s.hunger = clamp(s.hunger - 6, 0, 100); if (!s.coat) s.cold = clamp(s.cold - Math.max(0, 8 - run.temp) * 1.3, 0, 100); if (sortie.down.indexOf(s.id) >= 0) { s.wound = true; s.health = Math.max(s.health, 12); } }
      rep.lines.push(n ? 'The pack came home with ' + n + ' thing' + (n === 1 ? '' : 's') + ' from ' + LOCS[sortie.loc].n + '.' : 'The pack came home empty from ' + LOCS[sortie.loc].n + '.');
      if (sortie.late) rep.lines.push('Dawn caught the road home. Some of the load was dropped in the hurry.');
      run.inesIdle = scouts.indexOf('ines') >= 0 ? 0 : run.inesIdle + 1;
    } else { rep.lines.push('Nobody went out. The night passed at its own pace.'); run.inesIdle++; }
    // the night at home
    const beds = (run.up.bed1 ? 1 : 0) + (run.up.bed2 ? 1 : 0); let bi = 0;
    const guards = homeTeam.filter(s => NIGHT_AI[s.job] && s.health > 20);
    for (const s of homeTeam) { if (guards.indexOf(s) >= 0) s.fatigue = clamp(s.fatigue - 12, 0, 100); else { s.fatigue = clamp(s.fatigue + 42 + (bi++ < beds ? 16 : 0), 0, 100); } s.sleeping = false; s.bed = null; }
    if (run.heaterOn) { if (this.count(run, 'fuel') > 0) this.add(run, 'fuel', -1); else if (this.count(run, 'wood') > 1) this.add(run, 'wood', -2); else { run.heaterOn = false; rep.lines.push('The heater went out in the night. Nothing left to burn.'); this.tag(run, 'cold'); } }
    if (run.candleLit) { for (const s of homeTeam) s.addMorale(2, true); if (r.chance(0.5)) { this.add(run, 'candle', -1); if (this.count(run, 'candle') <= 0) { run.candleLit = false; rep.lines.push('The candle burned down to the saucer.'); } } }
    if (run.setHomeFire) {                                            // chapter 3 set-piece: a night-long fire while the scout is out
      run.setHomeFire = false; const water = this.count(run, 'water') + this.count(run, 'dirty'), hands = homeTeam.filter(s => s.health > 25).length;
      const need = 4; this.tag(run, 'fire'); Bus.emit('hazardImpact', { type: 'fire' });
      if (water >= need && hands >= 1) { let left = need; for (const k of ['dirty', 'water']) { const u = Math.min(left, this.count(run, k)); this.add(run, k, -u); left -= u; } rep.lines.push('Fire in the night. Those at home passed pots hand to hand until it was only smoke. ' + need + ' water gone, nothing else.'); for (const s of homeTeam) { s.addMorale(4, true); s.fatigue = clamp(s.fatigue - 20, 0, 100); } }
      else { const rm = HOME_ROOMS[4 + r.i(0, 5)]; run.broken.rooms[rm.id] = 1; const burn = Math.min(3, this.count(run, 'wood')); this.add(run, 'wood', -burn); this.add(run, 'cloth', -Math.min(2, this.count(run, 'cloth'))); rep.lines.push('Fire in the night, and not enough water to meet it. A room is blackened; wood and cloth are gone. Everyone got out.'); for (const s of homeTeam) { s.addMorale(-6, true); s.health = clamp(s.health - 8, 1, 100); } }
      Bus.emit('setpieceDone', { id: 'homefire' });
    }
    if (run.raidTonight && !run.raidHandled) {
      const raid = run.raidTonight; run.lastRaid = run.day; run.stats.raids++; this.tag(run, 'raid');
      let def = run.barricade * 2 + Math.min(run.traps, 2) * 1.5;
      for (const s of guards) def += 2 + s.st.str * 0.6 + (s.id === 'pavel' ? 2 : 0) - (s.id === 'yara' && !guards.some(g => g.id === 'pavel') ? 1.5 : 0);
      if (homeTeam.some(s => s.job === 'watch')) def += 1.5;
      const atk = raid.str * DIFF[run.diff].dmg;
      if (run.traps > 0) run.traps--;
      if (def >= atk + 2) { rep.lines.push('Raiders tried the door. The barricade and a calm voice behind it were enough.'); for (const s of homeTeam) s.addMorale(3, true); }
      else if (def >= atk - 1.5) { rep.lines.push('Raiders at the door until nearly dawn. It held, barely.'); run.barricade = Math.max(0, run.barricade - 1); const g = guards[0] || homeTeam[0]; if (g && r.chance(0.4)) { g.wound = true; g.health = clamp(g.health - 12, 5, 100); rep.lines.push(g.name + ' took a blow in the scuffle. A bandage would help.'); } }
      else { let taken = 0; for (const k of ['can', 'raw', 'soup', 'meds', 'fuel', 'water']) { const t = Math.ceil(this.count(run, k) * r.r(0.25, 0.4)); this.add(run, k, -t); taken += t; } run.barricade = Math.max(0, run.barricade - 1); rep.lines.push('They got in. ' + taken + ' things are gone from the shelves. Nobody was badly hurt.'); for (const s of homeTeam) s.addMorale(-8, true); this.tag(run, 'theft'); const g = homeTeam[0]; if (g) { g.health = clamp(g.health - 10, 5, 100); } }
      Bus.emit('raiderImpact', { resolved: true });
    }
    run.raidTonight = null; run.raidHandled = false; run.barrelLit = false;
    this.tick(run, 0.45, null);
    // illness
    for (const s of pres) {
      if (s.sick) continue;
      const cl = this.count(run, 'soap') > 0 ? 0.5 : 1;
      if ((s.cold <= 5 && r.chance(0.35 * cl)) || (s.badWater && r.chance(0.3 * cl)) || (s.wound && r.chance(0.2 * cl)) || (run.flood > 0.3 && r.chance(0.18 * cl))) { s.sick = true; rep.lines.push(s.name + ' woke with a fever' + (s.badWater ? ' (the rain water, probably).' : s.wound ? ' (the wound needs cleaning).' : '.')); this.tag(run, 'sick'); Bus.emit('hazardImpact', { type: 'disease', s }); }
      s.badWater = false;
    }
    run.flood = Math.max(0, run.flood - 0.3);
    // the two slow dangers: failing health and failing spirit. Always one warning dawn first.
    for (const s of pres) {
      if (s.health <= 0) {
        s.crit++;
        if (s.crit >= 2) { if (run.gentle) { s.away = run.day + 4; s.crit = 0; rep.left.push(s); rep.lines.push(s.name + ' was carried to the aid post across the river. They will send word.'); Bus.emit('survivorLeaves', { s }); } else { s.gone = true; run.lossCount++; run.stats.lost++; rep.lost.push(s); rep.lines.push(s.name + ' did not wake this morning.'); this.tag(run, 'loss'); Bus.emit('survivorDown', { s }); } }
        else rep.lines.push('WARNING: ' + s.name + ' is fading. Food, warmth, medicine: today.');
      }
      if (!s.gone && !s.away && s.morale <= 4) {
        s.low++;
        if (s.low >= 2) { if (run.gentle || r.chance(0.6)) { s.away = run.day + 3; rep.lines.push(s.name + ' left before light, with a note: "I need to walk. I will come back."'); } else { s.gone = true; run.lossCount++; run.stats.lost++; rep.lines.push(s.name + ' left before light. The note only says "Sorry."'); } s.low = 0; rep.left.push(s); this.tag(run, 'leave'); Bus.emit('survivorLeaves', { s }); }
        else rep.lines.push('WARNING: ' + s.name + ' has gone very quiet. Company, a tune, a warm meal.');
      } else s.low = 0;
    }
    for (const s of run.surv) if (s.away && run.day + 1 >= s.away && !s.gone) {
      s.away = 0; s.hunger = 55; s.health = Math.max(s.health, 50); s.morale = Math.max(s.morale, 46); s.sick = false; s.fatigue = 50; s.cold = 60; this.add(run, 'can', 1);
      rep.back.push(s); rep.lines.push(s.name + ' is back, with a tin and news: "' + r.pick(['The east bridge is quiet.', 'They are queuing for bread on Mill Street.', 'I heard a date. An actual date.', 'Someone asked after us. By name.']) + '"'); this.tag(run, 'ret'); Bus.emit('survivorReturns', { s });
    }
    // slow producers
    const wet = run.weather === 'rain' || run.weather === 'snow';
    if (run.up.raincatcher && wet) { const n = Math.max(1, Math.round((3 + (run.mods.snow ? 1 : 0)) * (run.mods.water ? 0.5 : 1))); this.add(run, 'dirty', n); rep.lines.push('The rain catcher filled: +' + n + ' rain water.'); }
    if (run.up.coop) run.coopT++; if (run.up.garden) run.gardenT++;
    const am = this.avgMorale(run);
    if (run.plantWater > 0 && am >= 48) run.plant = Math.min(1.2, run.plant + 0.17); else if (am < 28) run.plant = Math.max(0, run.plant - 0.06);
    run.plantWater = 0;
    if (run.plant >= 1 && !run.flags.bloom) { run.flags.bloom = true; rep.lines.push('The plant on the sill has flowered.'); Bus.emit('plantBloom', {}); }
    if (run.mode !== 'story') { const want = Math.min(LOC_ORDER.length, 3 + Math.floor(run.day / 3)); for (let i = 0; i < want; i++) if (run.sites.indexOf(LOC_ORDER[i]) < 0) { run.sites.push(LOC_ORDER[i]); rep.lines.push('New place marked on the map: ' + LOCS[LOC_ORDER[i]].n + '.'); } }
    // awards, embers, diary
    const p2 = this.present(run);
    p2.forEach((s, i) => rep.awards.push({ s, a: AWARDS[(r.i(0, 99) + i * 5) % AWARDS.length] }));
    rep.embers = CFG.embers.day + (sortie ? CFG.embers.night : 0) + Math.min(8, run.stats.kind) + (sortie && !sortie.spotted ? 3 : 0);
    run.embers += rep.embers; Save.data.embers += rep.embers; Save.data.stats.days++; if (sortie) Save.data.stats.nights++;
    rep.diary = Narrator.pick(run, r, sortie); this.log(run, rep.diary);
    run.tags = []; run.daily = {};
    run.day++;
    if (!this.present(run).length && !run.surv.some(s => s.away && !s.gone)) run.ended = 'collapse';
    else if (run.ceasefire && run.day > run.ceasefire) run.ended = 'win';
    rep.phase = this.phase(run);
    return rep;
  }
};

/* The narrator: picks one diary line per dawn from the day's context tags. */
const Narrator = {
  pick(run, r, sortie) {
    const order = ['loss', 'leave', 'fire', 'theft', 'raid', 'hard', 'kind', 'ret', 'sick', 'hungry', 'cold', 'soup'];
    let tag = null; for (const t of order) if (run.tags.indexOf(t) >= 0) { tag = t; break; }
    if (!tag) {
      if (run.day === 1) tag = 'first'; else if (run.flags.rumorToday) { tag = 'rumor'; run.flags.rumorToday = false; }
      else if (Run.phase(run) === 3 && r.chance(0.5)) tag = 'thaw'; else if (run.weather === 'snow' && r.chance(0.4)) tag = 'snow';
      else if (run.cat && r.chance(0.2)) tag = 'cat'; else if (Run.present(run).some(s => s.id === 'toby') && r.chance(0.2)) tag = 'toby';
      else if ((!sortie || !sortie.spotted) && r.chance(0.45)) tag = 'quiet'; else tag = 'generic';
    }
    const pool = DIARY[tag] || DIARY.generic; run.flags.diaryN = (run.flags.diaryN || 0) + 1;
    return pool[(r.i(0, 50) + run.flags.diaryN) % pool.length];
  }
};

/* ==========================================================================
   SECTION 12: THE DIRECTOR - pacing, weather, visitors, hazards, rubber-banding
   ========================================================================== */
const Director = {
  /* 0 = calm and well, 1 = the group is in real trouble */
  tension(run) {
    const p = Run.present(run); if (!p.length) return 1;
    const am = Run.avgMorale(run), food = Run.food(run) / p.length, healthy = p.filter(s => s.health > 50 && !s.sick).length / p.length;
    return clamp(0.45 * (1 - am / 100) + 0.3 * (food < 1 ? 1 : food < 2 ? 0.5 : 0) + 0.25 * (1 - healthy), 0, 1);
  },
  struggling(run) { return this.tension(run) > 0.52 || Run.food(run) < Run.present(run).length; },
  planDay(run) {
    const r = new RNG(run.seed + run.day * 7919), ph = Run.phase(run), D = DIFF[run.diff] || DIFF.normal, strug = this.struggling(run);
    const calm = num(run.threats) >= 3 ? 0.5 : 1; run.threats = 0;          // tension tracking: after a rough day, ease off
    const freq = D.events * run.opt.eventFreq * calm;
    const wt = [{ clear: 4, rain: 3, fog: 2, snow: 1 }, { snow: 5, clear: 2, fog: 2, coldsnap: 2 }, { snow: 3, clear: 2, rain: 2, fog: 3, coldsnap: 1 }, { rain: 4, clear: 4, fog: 2 }][ph];
    const ww = Object.assign({}, wt); if (run.mods.snow) ww.snow = (ww.snow || 0) + 5; if (strug && ww.coldsnap) ww.coldsnap = 0.3;
    run.weather = run.day === 1 ? 'clear' : r.w(ww);
    run.temp = Math.round([4, -6, -3, 5][ph] + ({ snow: -4, coldsnap: -9, clear: 1, rain: -1, fog: -1 }[run.weather] || 0) + (run.mods.snow ? -3 : 0) + r.r(-2, 2));
    if (run.weather === 'coldsnap') Bus.emit('hazardWarning', { type: 'coldsnap', text: 'Cold snap. Fuel and blankets today, or shivering tonight.' });
    const ev = [];
    const due = run.callbacks.filter(c => c.day <= run.day);
    if (due.length) { ev.push({ t: 0.2, type: 'visitor', id: due[0].id }); run.callbacks.splice(run.callbacks.indexOf(due[0]), 1); }
    else if (run.day === 2 || r.chance(clamp((0.5 + (run.mods.friends ? 0.3 : 0)) * freq, 0, 0.95))) ev.push({ t: r.r(0.14, 0.42), type: 'visitor', id: this.pickVisitor(run, r, strug) });
    if (run.day >= 3 && r.chance([0.14, 0.3, 0.44, 0.3][ph] * freq * (strug ? 0.5 : 1))) {
      const hw = { tremor: 3, fire: 2, gas: 2, stair: 2 }; if (run.weather === 'rain' || run.weather === 'snow') hw.flood = 3; if (run.fire) hw.fire = 0; if (run.gas) hw.gas = 0;
      ev.push({ t: r.r(0.5, 0.82), type: 'hazard', id: r.w(hw) });
    }
    const rp = ([0.08, 0.25, 0.5, 0.3][ph] * run.opt.raidFreq * D.events * calm * (strug ? 0.6 : 1)) + (run.barrelLit ? 0.12 : 0);
    run.raidTonight = (run.day >= 4 && run.day - run.lastRaid > 1 && r.chance(rp)) ? { str: 2 + ph * 1.5 + r.r(0, 3) } : null;
    run.lucky = strug && r.chance(0.6);                                  // quiet help for a struggling group
    if (run.mode === 'story' && !run.flags.rumor && run.day >= 14) ev.push({ t: 0.6, type: 'rumor' });
    run.events = ev.sort((a, b) => a.t - b.t);
    Bus.emit('weatherChange', { weather: run.weather, temp: run.temp }); Bus.emit('dayStart', { day: run.day, phase: ph });
  },
  pickVisitor(run, r, strug) {
    if (strug && r.chance(0.45)) return 'donation';
    const w = { beggar: 3, trader: 4, neighbor: 3, child: 2, thief: 2, musician: 2, medic: 1.5, soldier: 1.5 };
    if (run.mods.friends) { w.donation = 3; w.medic = 3; }
    if (run.day >= 4) w.thug = 2 + Run.phase(run);
    if (!run.cat && run.day >= 3) w.catArrives = 2.5;
    if (run.day === 2) return 'beggar';                                   // the first hard choice arrives early
    for (const k in w) if (run.flags['v_' + k] && k !== 'trader' && k !== 'neighbor') w[k] *= 0.25;
    const id = r.w(w); run.flags['v_' + id] = true; return id;
  }
};

/* --- Visitors at the door. Each option's fn(run, active) applies consequences and returns a result line. --- */
function cb(run, id, lo, hi) { run.callbacks.push({ id, day: run.day + lo + Math.floor(Math.random() * (hi - lo + 1)) }); }
const TRADES = [[{ cloth: 2 }, { meds: 1 }], [{ wood: 3 }, { can: 1 }], [{ parts: 2 }, { fuel: 2 }], [{ can: 1 }, { bandage: 2 }], [{ fuel: 1 }, { raw: 2 }],
  [{ book: 1 }, { can: 1 }], [{ toy: 1 }, { meds: 1 }], [{ candle: 1 }, { matches: 2 }], [{ water: 2 }, { raw: 2 }], [{ raw: 2 }, { battery: 1 }], [{ bottle: 2 }, { water: 1 }], [{ matches: 2 }, { cloth: 1 }]];
const VISITORS = {
  beggar: { who: 'civ', title: 'Three soft raps at the door.', text: 'A thin stranger stands on the landing, hat in both hands. "Anything. Please. I have a daughter downstairs."',
    opts: [{ l: 'Give a tin of food', need: { can: 1 }, fn(run) { Run.pay(run, { can: 1 }); Run.humanity(run, 6); Run.allMorale(run, 3); cb(run, 'beggarBack', 5, 8); Bus.emit('helped', {}); return 'They hold the tin like a lamp. "I will not forget this floor."'; } },
           { l: 'Give a bowl of soup', need: { soup: 1 }, fn(run) { Run.pay(run, { soup: 1 }); Run.humanity(run, 5); Run.allMorale(run, 3); cb(run, 'beggarBack', 6, 9); Bus.emit('helped', {}); return 'They drink it standing up, and thank the pot as well as you.'; } },
           { l: 'Say there is nothing to spare', fn(run, a) { Run.humanity(run, -4); if (a) a.guilt += 22; const m = run.surv.find(s => s.id === 'marta' && s.present); if (m) m.addMorale(-4); return 'The footsteps go down slowly. They stop on each landing.'; } }] },
  trader: { who: 'civ', title: 'A cheerful double knock.', text: 'A woman with a pram full of oddments. "I trade fair. Mostly."', trade: true, opts: [] },
  neighbor: { who: 'civ', title: 'A dressing gown at the door.', text: 'Old Mr. Halloran from 5B. "Weather report: overcast, with a chance of overcast." He lowers his voice. "Also: boots on our street last night."',
    opts: [{ l: 'Thank him', fn(run) { Run.allMorale(run, 2); return run.raidTonight ? '"Bar the door tonight," he adds, and shuffles off.' : '"Probably nothing," he adds. It probably is.'; } },
           { l: 'Invite him in for tea', need: { tea: 1 }, fn(run) { Run.pay(run, { tea: 1 }); Run.allMorale(run, 5); Run.humanity(run, 2); cb(run, 'neighborGift', 3, 6); Bus.emit('helped', {}); return 'He tells the story about the tram and the goose. Again. It is still good.'; } }] },
  thug: { who: 'raider', title: 'A fist on the door.', text: '"Toll for the stairwell. Three tins, and we keep walking."',
    opts: [{ l: 'Pay the toll (3 tins)', need: { can: 3 }, fn(run) { Run.pay(run, { can: 3 }); Run.allMorale(run, -3); run.raidTonight = null; Run.tag(run, 'theft'); return 'They count the tins twice and leave. The stairwell is quiet tonight.'; } },
           { l: 'Refuse through the door', fn(run) { const strong = run.barricade >= 3 || run.surv.some(s => s.id === 'pavel' && s.present); if (strong) { Run.allMorale(run, 4); return 'A long pause. "Not this door," someone mutters. Boots, going down.'; } run.raidTonight = { str: 6 + Run.phase(run) * 1.5 }; Run.tag(run, 'hard'); return '"Tonight, then." They mean it. Bar the door and set a guard.'; } },
           { l: 'Let Yara talk to them', req: 'yara', fn(run) { if (Math.random() < 0.7) { const n = Math.min(1, Run.count(run, 'can')); Run.add(run, 'can', -n); run.raidTonight = null; return 'Ten minutes of radio voice through a closed door. They settle for one tin and a joke.'; } run.raidTonight = { str: 5 }; return 'She almost had them. "Tonight," one says, less sure than before.'; } }] },
  child: { who: 'civ', small: true, title: 'A very small knock.', text: 'A girl of about ten. "My brother is hot and he will not wake up properly. Do you have medicine?"',
    opts: [{ l: 'Give medicine', need: { meds: 1 }, fn(run) { Run.pay(run, { meds: 1 }); Run.humanity(run, 10); Run.allMorale(run, 5); const t = run.surv.find(s => s.id === 'toby' && s.present); if (t) t.addMorale(8); cb(run, 'childBack', 4, 7); Bus.emit('helped', {}); return 'She runs. You hear her feet all the way down, fast, the way children run toward things.'; } },
           { l: 'Give cough syrup', need: { syrup: 1 }, fn(run) { Run.pay(run, { syrup: 1 }); Run.humanity(run, 5); Run.allMorale(run, 2); Bus.emit('helped', {}); return '"Thank you," she says, very formally, and carries it in both hands.'; } },
           { l: 'Say you have none', fn(run, a) { Run.humanity(run, -6); if (a) a.guilt += 30; const t = run.surv.find(s => s.id === 'toby' && s.present); if (t) t.addMorale(-10); return 'She nods as if she expected it. That is the part that stays.'; } }] },
  thief: { who: 'civ', title: 'A sound from the pantry.', text: 'The neighbor from 6A, with two of your tins under her coat. She does not run. "I have three at home," she says.',
    opts: [{ l: 'Let her keep them', fn(run) { Run.add(run, 'can', -Math.min(2, Run.count(run, 'can'))); Run.humanity(run, 6); cb(run, 'thiefBack', 3, 6); Bus.emit('helped', {}); return 'She cannot look at you. At the door she says, "I will make this right."'; } },
           { l: 'Take them back, say nothing', fn(run) { Run.humanity(run, -1); return 'She puts them on the table herself, squares them neatly, and goes.'; } },
           { l: 'Take them back and bar the door to her', fn(run, a) { Run.humanity(run, -5); if (a) a.guilt += 18; run.betrayals++; return 'The bolt is loud. Everyone in the flat heard it. So did 6A.'; } }] },
  donation: { who: 'none', title: 'Nobody at the door.', text: 'On the mat: a parcel in newspaper. A note: "From 4C. We had extra. (We did not, but you know.)"',
    opts: [{ l: 'Take it in', fn(run) { Run.add(run, 'can', 2); Run.add(run, 'water', 2); Run.add(run, 'bandage', 1); Run.allMorale(run, 5); return 'Two tins, two bottles of water, a rolled bandage. Somebody downstairs is counting on you too.'; } }] },
  medic: { who: 'civ', title: 'A quick, practised knock.', text: 'A tired man with an armband cut from a sock. "I can look at your sick. I need bandages for the next house."',
    opts: [{ l: 'Give a bandage, let him work', need: { bandage: 1 }, fn(run) { Run.pay(run, { bandage: 1 }); let n = 0; for (const s of Run.present(run)) { if (s.sick || s.wound) { s.sick = false; s.wound = false; s.health = clamp(s.health + 15, 0, 100); n++; } } Run.humanity(run, 3); return n ? 'He works without talking. ' + n + ' of you will sleep easier.' : 'He checks every pulse anyway. "Keep it that way."'; } },
           { l: 'Nothing to give', fn() { return 'He nods and is already on the stairs.'; } }] },
  musician: { who: 'civ', title: 'Something like tuning, outside.', text: 'A man with a violin missing a string. "A tune for a cup of water?"',
    opts: [{ l: 'A cup of water for a tune', need: { water: 1 }, fn(run) { Run.pay(run, { water: 1 }); Run.allMorale(run, 7); Run.humanity(run, 2); Bus.emit('helped', {}); Snd.sfx('box'); return 'Three strings turn out to be plenty. Granny conducts with her spoon.'; } },
           { l: 'Not today', fn() { return 'He plays on the next landing instead. You can hear most of it.'; } }] },
  soldier: { who: 'patrol', title: 'A shape on the stairs.', text: 'Slumped against the wall, a silhouette in a long coat. A uniform, though you could not say whose. Breathing badly.',
    opts: [{ l: 'Bandage and water', need: { bandage: 1, water: 1 }, fn(run) { Run.pay(run, { bandage: 1, water: 1 }); Run.humanity(run, 8); cb(run, 'soldierBack', 6, 12); Bus.emit('helped', {}); return 'By morning the stairs are empty. The bandage wrapper is folded very small on the step.'; } },
           { l: 'Help them down to the street door', fn(run) { Run.humanity(run, 1); return 'Heavy, and silent, and gone by the time you look back.'; } },
           { l: 'Take the coat and go', fn(run, a) { Run.add(run, 'coat', 1); Run.humanity(run, -10); if (a) a.guilt += 40; run.betrayals++; return 'It is a good coat. It is warm. Nobody asks where it came from.'; } }] },
  catArrives: { who: 'cat', title: 'A grey shape on the landing.', text: 'A cat sits outside the door as if it has an appointment.',
    opts: [{ l: 'Let it in', fn(run) { run.cat = true; Run.allMorale(run, 5); Bus.emit('catAdopted', {}); return 'It inspects every room, rejects the best chair, and falls asleep on the worst one.'; } },
           { l: 'Not another mouth', fn() { return 'It blinks slowly, unoffended, and stays exactly where it is.'; } }] },
  beggarBack: { who: 'civ', title: 'A knock you know.', text: 'The stranger from before. Thinner, smiling. "The depot on Mill Street was unlocked. I thought of this floor."',
    opts: [{ l: 'Thank them', fn(run) { Run.add(run, 'can', 3); Run.add(run, 'fuel', 2); Run.allMorale(run, 6); return 'Three tins and a jerrycan. Kindness, it turns out, keeps a ledger too.'; } }] },
  childBack: { who: 'civ', title: 'A very small knock, and a larger one.', text: 'The girl, and her mother. "He is sitting up," the mother says. "He asked for bread. So I made some."',
    opts: [{ l: 'Take the bread', fn(run) { Run.add(run, 'can', 3); Run.add(run, 'coat', 1); Run.allMorale(run, 8); return 'A loaf, still warm, and a knitted jumper "that he has grown out of".'; } }] },
  thiefBack: { who: 'civ', title: 'A knock from 6A.', text: 'She has an armful of chair legs. "From my own table. I said I would make it right." Then, quieter: "They are coming up this stair tomorrow night."',
    opts: [{ l: 'Take the wood, and the warning', fn(run) { Run.add(run, 'wood', 4); run.barricade = Math.min(BARRICADE_MAX, run.barricade + 1); Run.allMorale(run, 3); return 'You board the door together. She is good with a hammer.'; } }] },
  neighborGift: { who: 'civ', title: 'A dressing gown at the door.', text: 'Mr. Halloran again, holding a jar. "Honey. From before. For the tea next time." He taps the barometer in his pocket. "Overcast."',
    opts: [{ l: 'Accept the honey', fn(run) { Run.add(run, 'tea', 2); Run.add(run, 'herbs', 1); Run.allMorale(run, 4); return 'With a chance of overcast, you agree.'; } }] },
  soldierBack: { who: 'patrol', title: 'Boots on the landing. One pair.', text: 'The long coat, upright now. No words. A crate is set down, a hand touches a cap, and the boots go away again.',
    opts: [{ l: 'Open the crate', fn(run) { Run.add(run, 'meds', 2); Run.add(run, 'can', 4); Run.add(run, 'battery', 2); run.flags.pass = true; Run.allMorale(run, 5); return 'Medicine, tins, batteries. And chalked inside the lid: the hours the east patrols change.'; } }] }
};
function visitorDialog(run, id, active) {
  const v = VISITORS[id]; if (!v) return null;
  let opts = v.opts.map(o => ({ l: o.l, need: o.need, req: o.req, fn: o.fn }));
  if (v.trade) {
    const yara = run.surv.some(s => s.id === 'yara' && s.present), r = new RNG(run.seed + run.day * 31);
    const pool = TRADES.slice().sort(() => r.f() - 0.5).sort((a, b) => (Run.has(run, b[0]) ? 1 : 0) - (Run.has(run, a[0]) ? 1 : 0)).slice(0, 3);
    opts = pool.map(t => { const get = Object.assign({}, t[1]); if (yara) { const k = Object.keys(get)[0]; get[k] += 1; }
      return { l: 'Trade ' + Run.costText(t[0]) + ' for ' + Run.costText(get), need: t[0], fn(rn) { Run.pay(rn, t[0]); for (const k in get) Run.add(rn, k, get[k]); Snd.sfx('pickup'); return yara ? 'Yara talks her up by one. The pram rattles off happy anyway.' : 'A fair swap. She tips an imaginary hat.'; } }; });
    opts.push({ l: 'No thank you', fn() { return '"Next week, then." The pram squeaks away down the landing.'; } });
  }
  return { title: v.title, text: v.text, who: v.who, small: v.small, opts, active };
}
