
/* ==========================================================================
   SECTION 19: GAME STATE MANAGER - run flow, play modes, achievements
   ========================================================================== */
const SAVEABLE = { story: 1, endless: 1, custom: 1, quick: 1 };
MODE_BY_ID.quick = { id: 'quick', n: 'A Short Winter', d: 'Seven days to the ceasefire.', kind: 'campaign', coop: 2 };

function unlock(id) { if (!ACH[id] || Save.data.ach[id]) return; Save.data.ach[id] = 1; Save.data.embers += 5; Bus.emit('achievementUnlocked', { id }); }
function dateKey() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function lootValue(loot) { let v = 0; for (const k in loot) v += (ITEMS[k] ? ITEMS[k].v : 1) * loot[k]; return v; }

const Flow = {
  last: null, chain: null,
  /* Entry point for every mode on the menu. */
  start(mode, o) {
    o = o || {}; this.last = { mode, o }; this.chain = null;
    Game.players.length = 1; Game.padOwner = {}; Save.data.stats.runs++;
    const M = MODE_BY_ID[mode];
    if (mode === 'story') {
      if (o.cont && Save.data.story) { Game.run = Run.restore(Save.data.story); this.day(); return; }
      const run = Game.run = Run.create('story', {});
      const first = (run.surv.find(s => s.id === 'marta') || run.surv[0]).id;
      const tut = () => Game.go('NightSortie', { loc: 'pharmacy', scouts: [first], pack: {}, battery: 1, tutorial: true, time: 320, onDone: res => { Save.data.tutorialDone = true; unlock('firstnight'); Flow.dawn(res); } }, 'iris');
      const next = (!Save.data.tutorialDone || o.tutorial) ? tut : () => Flow.day();
      Game.go('Cutscene', { script: CUTS.intro, title: 'Ashen Windows', next }, 'flicker'); return;
    }
    if (M && M.kind === 'campaign') {
      let run;
      if (mode === 'quick') run = Run.create('quick', { ceasefire: 7, sites: LOC_ORDER.slice(0, 4) });
      else if (mode === 'endless') run = Run.create('endless', { ceasefire: null });
      else if (mode === 'daily') { const seed = hashStr('daily:' + dateKey()), r = new RNG(seed), a = r.pick(MOD_ORDER); let b = r.pick(MOD_ORDER); if (b === a) b = MOD_ORDER[(MOD_ORDER.indexOf(a) + 3) % MOD_ORDER.length]; run = Run.create('daily', { seed, ceasefire: 7, mods: [a, b], group: DEFAULT_GROUP, diff: 'normal', gentle: false, sites: LOC_ORDER.slice(0, 5) }); run.opt.title = MODS[a].n + ' + ' + MODS[b].n; }
      else run = Run.create('custom', o);
      Game.run = run; this.day(); return;
    }
    if (mode === 'workshop') { const run = Game.run = Run.create('workshop', { ceasefire: null }); for (const k of ['can', 'raw', 'water', 'wood', 'parts', 'cloth', 'fuel']) Run.add(run, k, 6); for (const id of ['radio', 'cards', 'heater', 'filter']) run.up[id] = 1; Game.go('HomeDay', {}, 'tear'); return; }
    if (M && M.kind === 'homenight') {
      const run = Game.run = Run.create(mode, { ceasefire: null, count: 4 }); Run.add(run, 'wood', 4); Run.add(run, 'pan', 1); run.barricade = 2;
      if (mode === 'door') run.traps = 1; if (M.setup) M.setup(run);
      Game.go('NightHome', { rules: mode, onDone: res => Flow.modeResult(mode, res) }, 'blinds'); return;
    }
    if (M && M.kind === 'scene') { Game.run = Run.create(mode, { ceasefire: null, count: 4, group: M.group }); Game.go(M.scene, { mode }, 'tear'); return; }
    if (M && M.kind === 'panel') { Game.run = Run.create(mode, { ceasefire: null, count: 4 }); Game.go('Panel', { mode }, 'tear'); return; }
    if (M && M.kind === 'chain') { Game.run = Run.create(mode, { ceasefire: null, count: mode === 'watch' ? 4 : 2, group: M.group }); this.chain = CHAINS[mode]; this.chain.st = this.chain.init(Game.run); this.chain.next(Game.run, this.chain.st); return; }
  },
  /* Start of a campaign day: chapter cutscene first, when a new chapter begins. */
  day() {
    const run = Game.run;
    if (run.mode === 'story') {
      const ci = CHAPTERS.findIndex(c => run.day >= c.days[0] && run.day <= c.days[1]);
      if (ci >= 0 && run.chapter < ci + 1) {
        run.chapter = ci + 1; const ch = CHAPTERS[ci]; for (const s of ch.sites) if (run.sites.indexOf(s) < 0) run.sites.push(s);
        Run.log(run, 'Chapter ' + ch.id + ': ' + ch.t + '. ' + ch.blurb);
        Game.go('Cutscene', { script: CUTS[ch.cut], title: 'Chapter ' + ch.id + ': ' + ch.t, next: () => Game.go('HomeDay', {}, 'tear') }, 'flicker'); return;
      }
    }
    Game.go('HomeDay', {}, 'tear');
  },
  dawn(sortie) {
    const run = Game.run; Bus.emit('dawnStart', {});
    const rep = Run.dawn(run, sortie);
    if (run.mode === 'endless' && (run.day - 1) % 5 === 0) { Save.data.embers += 15; rep.lines.push('Milestone: ' + (run.day - 1) + ' days. +15 Embers.'); rep.embers += 15; }
    if (run.stats.soupMeals >= 6) unlock('soup6');
    if (SAVEABLE[run.mode] && !run.free) { Save.data.story = run.ended ? null : Run.serialize(run); if (run.mode === 'story') Save.data.storyBest = Math.max(Save.data.storyBest, run.day); }
    Save.write();
    Game.go('DawnReport', { rep }, 'flicker');
  },
  afterDawn(journal) { const run = Game.run; if (run.ended) this.endRun(run.ended); else if (journal) Game.go('HomeDay', { journal: true }, 'tear'); else this.day(); },
  endRun(kind) {
    const run = Game.run, alive = Run.alive(run).length, total = run.surv.length, win = kind === 'win';
    if (SAVEABLE[run.mode] && !run.free) Save.data.story = null;
    let ending = null;
    if (kind === 'collapse') ending = 'collapse';
    else if (win) ending = (alive === total && run.betrayals === 0 && run.humanity >= 50) ? 'everyone' : alive <= 1 ? 'alone' : alive <= total / 2 ? 'few' : run.signal === 'signal' ? 'signal' : run.humanity < 35 ? 'cold' : 'silence';
    const days = run.day - 1, score = days * 100 + alive * 150 + Math.round(run.humanity) * 2 + Run.food(run) * 5;
    if (win) { unlock('thaw'); Save.data.stats.wins++; Save.data.embers += CFG.embers.win; if (ending === 'everyone') unlock('everyone'); if (run.mode === 'story' && !Save.data.unlocks.lamp) { Save.data.unlocks.lamp = true; unlock('lamplighter'); } }
    if (run.mode === 'daily') { const k = dateKey(), b = Save.data.daily[k]; if (!b || b.score < score) Save.data.daily[k] = { score, days }; }
    const best = Save.score(run.mode, score); Save.write(); Bus.emit('endingTriggered', { ending });
    const pts = run.points.filter((p, i) => run.points.indexOf(p) === i);
    const res = { win, mode: run.mode, title: ending ? ENDINGS[ending].t : 'The winter, so far', score, best, replay: run.replay, points: pts, embers: run.embers + (win ? CFG.embers.win : 0), surv: run.surv,
      lines: ['Days survived: ' + days, 'Still together: ' + alive + ' of ' + total, 'Kind choices: ' + run.stats.kind + '   Hard ones: ' + run.stats.hard, 'Nights out: ' + run.stats.nights + '   Unseen: ' + run.stats.quiet, run.mode === 'daily' ? 'Daily modifiers: ' + run.opt.title : 'Raids weathered: ' + run.stats.raids] };
    if (ending) Game.go('Ending', { ending, win, next: () => { if (win && run.mode === 'story') Game.go('Credits', { next: () => Game.go('Cutscene', { script: CUTS.stinger, title: 'After', next: () => Flow.results(res) }, 'flicker') }, 'flicker'); else Flow.results(res); } }, 'flicker');
    else this.results(res);
  },
  modeResult(mode, res) {
    const M = MODE_BY_ID[mode]; if (res.ach && res.win) unlock(res.ach);
    const best = Save.score(mode, num(res.score)); Save.data.embers += res.win ? 20 : 8; if (res.win) Save.data.stats.wins++; Save.write();
    this.results({ win: !!res.win, mode, title: M.n + (res.win ? '' : res.quit ? ': given up' : ': not this time'), lines: res.lines || [], score: num(res.score), best, replay: Game.run && Game.run.replay, embers: res.win ? 20 : 8, surv: Game.run ? Game.run.surv : [] });
  },
  results(o) { Game.go('Results', o, 'tear'); },
  again() { if (this.last) this.start(this.last.mode, Object.assign({}, this.last.o, { cont: false })); else Game.go('Title', {}, 'flicker'); }
};

/* --- Sortie chains: Scavenger Run, Co-op Night Watch, Silent Run, Signal Run --- */
const CHAINS = {
  scav: {
    init() { return { n: 0, score: 0 }; },
    next(run, st) {
      const r = new RNG(run.seed + st.n * 17), loc = r.pick(LOC_ORDER.slice(0, Math.min(8, 3 + st.n * 2))), ids = run.surv.slice(0, Math.max(1, Math.min(2, Game.players.length))).map(s => s.id);
      run.day = st.n + 1;
      Game.go('NightSortie', { loc, scouts: ids, pack: { bottle: 1 }, battery: 1, time: 200 - st.n * 10, n: st.n, lv: { extraNpc: st.n * 0.6 }, scarce: st.n * 0.08, objective: 'Run ' + (st.n + 1) + ' of 5: fill the pack, then back to the street door.',
        onDone: res => {
          const v = lootValue(res.loot);
          if (res.failed || res.late) { Flow.modeResult('scav', { win: false, score: st.score + Math.round(v / 2), lines: [res.failed ? 'Caught on run ' + (st.n + 1) + '.' : 'Dawn caught you on run ' + (st.n + 1) + '.', 'Runs banked: ' + st.n, 'Haul value: ' + st.score] }); return; }
          st.score += v; st.n++; for (const s of run.surv) { s.health = clamp(s.health + 15, 0, 100); }
          if (res.loot && lootCount(res.loot) >= CFG.pack) unlock('spoons');
          if (st.n >= 5) Flow.modeResult('scav', { win: true, score: st.score, lines: ['Five runs, five dawns beaten.', 'Total haul value: ' + st.score] });
          else Game.go('Interlude', { title: 'Run ' + st.n + ' banked', lines: ['This haul: ' + v + '   Total: ' + st.score, 'The next street is busier.'], opts: [{ l: 'Next run', fn: () => CHAINS.scav.next(run, st) }, { l: 'Bank it and finish', fn: () => Flow.modeResult('scav', { win: true, score: st.score, lines: ['Banked after ' + st.n + ' runs.', 'Total haul value: ' + st.score] }) }] }, 'tear');
        } }, 'iris');
    }
  },
  watch: {
    init() { return { need: 4 }; },
    next(run, st) {
      const r = new RNG(run.seed), loc = r.pick(['market', 'school', 'apartments', 'metro']);
      Game.go('NightSortie', { loc, scouts: run.surv.map(s => s.id), pack: { bottle: 2, bandage: 1 }, battery: 2, time: 260, lv: { crates: st.need },
        objFn: sc => 'Night Watch: bring back the marked crates (' + (sc.w.crates || 0) + '/' + st.need + '). Carry the fallen. Switch with ' + Input.glyph('sw') + '.',
        canLeave: w => ((w.crates || 0) >= st.need ? true : 'Crates: ' + (w.crates || 0) + '/' + st.need),
        onDone: res => { const win = !res.failed && !res.late && res.crates >= st.need; Flow.modeResult('watch', { win, score: res.crates * 150 + (win ? 400 : 0) + res.carried * 100 - res.down.length * 50, lines: ['Crates home: ' + res.crates + ' of ' + st.need, 'Carried home: ' + res.carried, res.failed ? 'Everyone went down.' : res.late ? 'Dawn caught the watch.' : 'Everyone made the door.', 'Times spotted: ' + res.spotted] }); } }, 'iris');
    }
  },
  silent: {
    init() { return { i: 0, tries: 3, levels: ['pharmacy', 'school', 'hospital'] }; },
    next(run, st) {
      run.day = st.i + 1;
      Game.go('NightSortie', { loc: st.levels[st.i], scouts: [run.surv[0].id], pack: {}, battery: 1, noTools: true, time: 240, n: st.i + st.tries * 7, lv: { goal: true, cont: 2 }, objective: 'Course ' + (st.i + 1) + ' of 3: take the ledger page from the top floor, then leave. No tools. Tries left: ' + st.tries,
        canLeave: w => (w.goalDone ? true : 'Find the ledger page first'), onHit: sc => { sc.finish({ failed: true }); },
        onDone: res => {
          if (res.failed || res.late) { st.tries--; if (st.tries <= 0) Flow.modeResult('silent', { win: false, score: st.i * 300, lines: ['Out of tries on course ' + (st.i + 1) + '.', 'Courses cleared: ' + st.i + ' of 3'] }); else Game.go('Interlude', { title: res.late ? 'Too slow' : 'Caught', lines: ['Tries left: ' + st.tries, 'Same course, new patrol timings.'], opts: [{ l: 'Try again', fn: () => CHAINS.silent.next(run, st) }, { l: 'Give up', fn: () => Flow.modeResult('silent', { win: false, quit: true, score: st.i * 300, lines: ['Courses cleared: ' + st.i + ' of 3'] }) }] }, 'tear'); return; }
          st.i++; if (!res.spotted) unlock('quiethands');
          if (st.i >= 3) Flow.modeResult('silent', { win: true, score: 900 + st.tries * 200, lines: ['All three courses, without a tool in hand.', 'Tries left: ' + st.tries] });
          else Game.go('Interlude', { title: 'Course ' + st.i + ' cleared', lines: ['Tries left: ' + st.tries], opts: [{ l: 'Next course', fn: () => CHAINS.silent.next(run, st) }] }, 'tear');
        } }, 'iris');
    }
  },
  signal: {
    init(run) { return { stage: 0, retries: run.diff === 'gentle' ? 3 : 2, used: 0, supply: 2, acc: 0 }; },
    next(run, st) {
      const names = ['The bridge deck', 'The bell tower', 'The radio on the roof'], base = { scouts: [run.surv[0].id], pack: { bottle: 1 }, battery: Math.max(0, st.supply), time: 200, n: st.stage + st.used * 5, onGoal: sc => sc.finish({}),
        onDone: res => {
          if (res.failed || res.late || !res.goal) {
            st.retries--; st.used++; st.supply--;
            if (st.retries < 0) Flow.modeResult('signal', { win: false, score: st.stage * 300, lines: ['The signal was never sent.', 'Stages cleared: ' + st.stage + ' of 3', 'Retries used: ' + (st.used - 1)] });
            else Game.go('Interlude', { title: 'Sent home', lines: ['Tomorrow night, the same stage, with one less battery.', 'Retries left: ' + st.retries], opts: [{ l: 'Try again', fn: () => CHAINS.signal.next(run, st) }, { l: 'Give up', fn: () => Flow.modeResult('signal', { win: false, quit: true, score: st.stage * 300, lines: ['Stages cleared: ' + st.stage + ' of 3'] }) }] }, 'tear');
            return;
          }
          if (st.stage === 2) st.acc = res.tuneAcc;
          st.stage++; run.surv[0].health = clamp(run.surv[0].health + 25, 0, 100);
          if (st.stage >= 3) Flow.modeResult('signal', { win: true, ach: st.used === 0 ? 'clearsignal' : null, score: 900 + Math.round(st.acc * 300) - st.used * 150, lines: ['The signal went out.', 'Stages cleared: 3 of 3', 'Retries used: ' + st.used, 'Signal strength: ' + Math.round(40 + st.acc * 60) + '%'] });
          else Game.go('Interlude', { title: names[st.stage - 1] + ': done', lines: ['Next: ' + names[st.stage] + '.'], opts: [{ l: 'Next night', fn: () => CHAINS.signal.next(run, st) }] }, 'tear');
        } };
      run.day = st.stage + 1 + st.used;
      if (st.stage === 0) Game.go('NightSortie', Object.assign(base, { loc: 'bridge', lv: { snipers: 3, goal: true, goalGround: true, cont: 3 }, objective: 'Stage 1: cross the bridge between the watcher\'s glances. Reach the far end.' }), 'iris');
      else if (st.stage === 1) Game.go('NightSortie', Object.assign(base, { loc: 'church', level: (seed, D) => buildTower(seed, D), objective: 'Stage 2: climb to the bell. When the wind rises, hold still on the ladder.' }), 'iris');
      else Game.go('NightSortie', Object.assign(base, { loc: 'church', lv: { w: 1400, floors: 2, cont: 2, npcs: ['patrol'], noDoors: true, tuner: true }, objective: 'Stage 3: tune the radio at the far end and hold the signal.' }), 'iris');
    }
  }
};
function lootCount(l) { let n = 0; for (const k in l) n += l[k]; return n; }

/* ==========================================================================
   SECTION 20: PANEL MODES (Hot Meal, Ledger Winter) - the same needs and
   morale language, played as a kitchen table and an account book
   ========================================================================== */
const MEALS = [
  { l: 'Thin soup', cost: { raw: 1, water: 2 }, hun: 18, mor: -2, d: 'Mostly water. Mostly warm.' }, { l: 'Proper soup', cost: { raw: 2, water: 2, herbs: 1 }, hun: 30, mor: 4, d: 'A soup with opinions.' },
  { l: 'Tins for all', cost: { can: 2 }, hun: 34, mor: 1, d: 'Reliable. Joyless.' }, { l: 'Egg and greens', cost: { egg: 2, raw: 1 }, hun: 26, mor: 5, d: 'Sunday food.' },
  { l: 'Tea and stories', cost: { herbs: 1, water: 1 }, hun: 4, mor: 7, d: 'Feeds something else.' }, { l: 'Skip the meal', cost: {}, hun: 0, mor: -8, d: 'Save it all for tomorrow.' }
];
const MEAL_EVENTS = ['A guest from 4C stays for supper. The pot must stretch (morale +3, portions thinner).', 'Someone finds a forgotten tin behind the stove (+1 tin).', 'A jar of water is knocked over (-2 water).', 'It rains; the pots on the sill fill (+3 water).', 'Quiet day. Nothing extra, nothing lost.'];
const DEALS = [
  { t: 'A trader with a pram: "Buying tins. Selling blankets."', o: [{ l: 'Sell some tins', led: 5, mor: -4 }, { l: 'Buy blankets', led: -4, mor: 6 }, { l: 'Pass', led: 0, mor: 0 }] },
  { t: 'The neighbor from 6A: "Could you spare something? I will pay it back."', o: [{ l: 'Give freely', led: -3, mor: 6 }, { l: 'Lend it', led: -2, mor: 2, later: { d: 2, led: 4 } }, { l: 'Refuse', led: 0, mor: -5 }] },
  { t: 'A man with a jerrycan: "Fuel, cheap. Do not ask."', o: [{ l: 'Buy the fuel', led: -2, mor: 1, fuel: 3 }, { l: 'Decline', led: 0, mor: 0 }] },
  { t: 'A violinist, three strings: "An evening of music, for supper?"', o: [{ l: 'Hire him for the evening', led: -2, mor: 8 }, { l: 'Not tonight', led: 0, mor: -1 }] },
  { t: 'A quiet man in a good coat: "I lend. Six now. You pay seven, soon."', o: [{ l: 'Borrow six', led: 6, mor: 0, debt: 6 }, { l: 'No debts', led: 0, mor: 1 }] },
  { t: 'Downstairs needs a door mended. "We can pay in tins."', o: [{ l: 'Send someone to fix it', led: 4, mor: -2 }, { l: 'We are too tired', led: 0, mor: 1 }] },
  { t: 'A child selling matches, one box at a time.', o: [{ l: 'Buy a box, and overpay', led: -2, mor: 5 }, { l: 'Buy a box', led: -1, mor: 2 }, { l: 'Shake your head', led: 0, mor: -3 }] },
  { t: 'Someone offers a fair price for the good chair.', o: [{ l: 'Sell the chair', led: 5, mor: -5 }, { l: 'A person should be able to sit', led: 0, mor: 2 }] }
];
class PanelScene {
  enter(p) {
    this.mode = p.mode; const run = this.run = Game.run, D = DIFF[run.diff] || DIFF.normal; this.t = 0; this.msg = ''; this.st0 = { n: 0 };
    this.granny = run.surv.some(s => s.id === 'bea'); this.yara = run.surv.some(s => s.id === 'yara');
    for (const s of run.surv) { s.resetRuntime(); s.morale = 58; s.hunger = 70; }
    if (this.mode === 'meal') { this.day = 1; this.days = 5; this.pan = { raw: 6, can: 3, herbs: 2, water: 9, egg: 2 }; if (D.scarcity > 1) { this.pan.raw += 2; this.pan.can++; } if (D.scarcity < 1) { this.pan.raw--; this.pan.water -= 2; } this.thr = run.diff === 'gentle' ? 40 : run.diff === 'harsh' ? 58 : 50; }
    else { this.day = 1; this.days = 14; this.led = 6; this.debt = 0; this.debtAge = 0; this.neg = 0; this.fuelCover = 0; this.later = []; this.deals = 0; this.settled = 0; this.thr = run.diff === 'gentle' ? 38 : run.diff === 'harsh' ? 55 : 46; this.stretch = false; }
    Snd.setTrack('homeDay'); Snd.tension = 0; this.build();
  }
  avg() { const r = this.run.surv; return r.reduce((a, s) => a + s.morale, 0) / r.length; }
  all(v) { for (const s of this.run.surv) s.addMorale(v, true); if (v > 2) Snd.sfx('chime'); }
  finish(win, lines, score, ach) { Flow.modeResult(this.mode, { win, lines, score, ach }); }
  build() {
    const run = this.run; let items = [], title = '';
    if (this.mode === 'meal') {
      const r = new RNG(run.seed + this.day * 13); this.ev = MEAL_EVENTS[r.i(0, MEAL_EVENTS.length - 1)]; const k = MEAL_EVENTS.indexOf(this.ev);
      if (!this.evDone) { this.evDone = true; if (k === 0) { this.all(3); this.guest = true; } else this.guest = false; if (k === 1) this.pan.can++; if (k === 2) this.pan.water = Math.max(0, this.pan.water - 2); if (k === 3) this.pan.water += 3; }
      title = 'Hot Meal: day ' + this.day + ' of ' + this.days;
      items = MEALS.map(m => ({ label: m.l, right: () => (Object.keys(m.cost).length ? Run.costText(m.cost) : 'free'), sub: m.d + '  Hunger +' + (m.hun + (this.granny && m.hun ? 6 : 0) - (this.guest && m.hun ? 5 : 0)) + ', morale ' + (m.mor >= 0 ? '+' : '') + m.mor + '.', dis: () => { for (const c in m.cost) if ((this.pan[c] || 0) < m.cost[c]) return 'Not enough in the pantry.'; return false; }, act: () => {
        for (const c in m.cost) this.pan[c] -= m.cost[c];
        for (const s of run.surv) { s.hunger = clamp(s.hunger + m.hun + (this.granny && m.hun ? 6 : 0) - (this.guest && m.hun ? 5 : 0) - 28, 0, 100); s.addMorale(m.mor - (s.hunger < 35 ? 6 : 0), true); s.act('eat', 1.4); }
        Snd.sfx(m.hun ? 'sizzle' : 'page'); if (m.mor > 2) Snd.sfx('chime');
        this.msg = this.granny && m.hun ? "Granny names it '" + SOUPS[(this.day * 5) % SOUPS.length] + "'." : m.d;
        if (run.surv.some(s => s.hunger <= 0)) { this.finish(false, ['Someone went to bed with nothing at all.', 'Days served: ' + this.day + ' of ' + this.days, 'Average morale: ' + Math.round(this.avg())], this.day * 100); return; }
        this.day++; this.evDone = false;
        if (this.day > this.days) { const a = this.avg(); this.finish(a >= this.thr, ['Five days at the table.', 'Average morale: ' + Math.round(a) + ' (needed ' + this.thr + ')', 'Left in the pantry: ' + lootCount(this.pan) + ' things'], Math.round(a * 10 + lootCount(this.pan) * 10)); return; }
        this.build();
      } }));
    } else {
      const r = new RNG(run.seed + this.day * 29), deal = DEALS[(r.i(0, 99) + this.day) % DEALS.length]; title = 'Ledger Winter: day ' + this.day + ' of ' + this.days;
      if (!this.dayOpen) {
        this.dayOpen = true; this.stretch = false; this.income = r.i(3, 6) + (this.run.diff === 'gentle' ? 1 : 0); this.upkeep = 4 + (this.day > 5 && this.fuelCover <= 0 ? 2 : 0) + (this.day % 4 === 0 ? 1 : 0);
        if (this.fuelCover > 0) this.fuelCover--;
        this.msg = ''; for (let i = this.later.length - 1; i >= 0; i--) if (this.later[i].d <= this.day) { this.led += this.later[i].led; this.msg += 'A loan comes home (+' + this.later[i].led + '). '; this.later.splice(i, 1); }
        if (this.debt > 0) { this.debtAge++; this.debt = Math.ceil(this.debt * (this.run.diff === 'harsh' ? 1.25 : 1.15)); if (this.debtAge > 3) { this.led -= 8; this.all(-10); this.debt = 0; this.debtAge = 0; this.msg += 'The lender came with friends. They took what they liked (-8). '; Snd.sfx('knock'); Bus.emit('raiderImpact', {}); } }
        this.deal = deal;
      }
      const dl = this.deal; items = [{ type: 'head', label: "TODAY'S VISITOR" }];
      dl.o.forEach((o, i) => { const bonus = this.yara && o.led > 0 ? 1 : 0; items.push({ label: o.l, right: () => (o.led + bonus > 0 ? '+' : '') + (o.led + bonus) + ' ledger, ' + (o.mor >= 0 ? '+' : '') + o.mor + ' morale', sub: (this.run.diff === 'gentle' && i === this.suggest(dl) ? 'Suggested. ' : '') + (o.debt ? 'A debt grows every day and must be paid within three.' : o.later ? 'It comes back in a couple of days.' : bonus ? "Yara's charm adds one." : ''), act: () => {
        this.led += o.led + bonus; this.all(o.mor); if (o.debt) { this.debt += o.debt; this.debtAge = 0; } if (o.later) this.later.push({ d: this.day + o.later.d, led: o.later.led }); if (o.fuel) this.fuelCover = o.fuel; this.deals++; Snd.sfx('page'); this.close();
      } }); });
      items.push({ type: 'head', label: 'THE BOOK' },
        { label: 'Granny stretches the pot', hidden: () => !this.granny || this.stretch, sub: 'Once a day: one less ration of upkeep.', act: () => { this.stretch = true; this.upkeep = Math.max(0, this.upkeep - 1); Snd.sfx('sizzle'); this.build(); } },
        { label: () => 'Pay the debt (' + this.debt + ')', hidden: () => this.debt <= 0, dis: () => (this.led >= this.debt ? false : 'Not enough in the book.'), sub: 'Clear it before the third day.', act: () => { this.led -= this.debt; this.debt = 0; this.debtAge = 0; this.settled++; Snd.sfx('unlock'); this.build(); } });
    }
    items.push({ label: 'Leave the table', back: true, act: () => Game.go('Title', {}, 'flicker') });
    const sel = this.menu ? this.menu.sel : 0;
    this.menu = new Menu({ x: 30, y: 120, w: 440, key: '', maxRows: 10, title, items, noBackItem: true, onBack: () => Game.go('Title', {}, 'flicker') }); this.menu.sel = clamp(sel, 0, this.menu.vis().length - 1); this.menu.fix(1);
  }
  suggest(dl) { let b = 0, bs = -99; dl.o.forEach((o, i) => { const v = o.led * (this.led < 4 ? 2 : 1) + o.mor * (this.avg() < this.thr + 6 ? 1.5 : 0.6) - (o.debt ? 6 : 0); if (v > bs) { bs = v; b = i; } }); return b; }
  /* End of a ledger day: book the income and the upkeep. */
  close() {
    this.led += this.income - this.upkeep; this.dayOpen = false;
    for (const s of this.run.surv) s.addMorale(this.led < 0 ? -4 : -1, true);
    this.neg = this.led < 0 ? this.neg + 1 : 0;
    if (this.neg >= 2 || this.avg() <= 2) { this.finish(false, ['The book stayed in the red two days running.', 'Days kept: ' + this.day + ' of ' + this.days, 'Deals made: ' + this.deals], this.day * 50); return; }
    this.day++;
    if (this.day > this.days) { const a = this.avg(), win = this.led > 0 && a >= this.thr && this.debt <= 0; this.finish(win, ['Final ledger: ' + (this.led > 0 ? '+' : '') + this.led + (this.debt ? ' (debt outstanding: ' + this.debt + ')' : ''), 'Average morale: ' + Math.round(a) + ' (needed ' + this.thr + ')', 'Deals made: ' + this.deals + '   Debts settled: ' + this.settled, 'Best deal award: Keeper of Spoons'], Math.round(this.led * 20 + a * 5), 'ledger'); return; }
    this.build();
  }
  update(dt) { this.t += dt; for (const s of this.run.surv) Rig.update(s, dt, this.t); this.menu.update(dt); }
  render(ctx) {
    const run = this.run, t = Game.time;
    ctx.fillStyle = grey(30); ctx.fillRect(0, 0, W, H); ctx.fillStyle = grey(36); for (let x = 8; x < W; x += 15) ctx.fillRect(x, 0, 2, 330); ctx.fillStyle = grey(22); ctx.fillRect(0, 330, W, 6); ctx.fillStyle = grey(58); ctx.fillRect(0, 336, W, 204);
    ctx.fillStyle = grey(80); ctx.fillRect(520, 300, 400, 12); ctx.fillStyle = grey(50); ctx.fillRect(540, 312, 10, 60); ctx.fillRect(890, 312, 10, 60);
    run.surv.forEach((s, i) => { const x = 570 + i * 100; s.face = i < 2 ? 1 : -1; Rig.draw(ctx, s, x, 372, { scale: 2 }); txt(ctx, s.name, x, 392, 11, G.bone, 'center'); UI.icon(ctx, 'morale', x - 26, 404, 9, G.bone); UI.bar(ctx, x - 18, 400, 44, 6, s.morale); if (this.mode === 'meal') { UI.icon(ctx, 'hunger', x - 26, 418, 9, G.bone); UI.bar(ctx, x - 18, 414, 44, 6, s.hunger); } });
    ctx.fillStyle = grey(120); ctx.beginPath(); ctx.ellipse(720, 296, 26, 7, 0, 0, TAU); ctx.fill(); if (Math.random() < 0.05) Parts.emit('smoke', 720, 288, 1, { screen: true, v: 150 });
    UI.paper(ctx, 500, 30, 430, 190, { seed: 21, rot: 0.006 });
    if (this.mode === 'meal') {
      txt(ctx, 'The pantry', 520, 60, 15, G.ink, 'left', { outline: false, serif: true }); let i = 0; for (const k in this.pan) { txt(ctx, this.pan[k] + '  ' + ITEMS[k].n, 520 + (i % 2) * 190, 84 + Math.floor(i / 2) * 18, 11, G.coal, 'left', { outline: false, normal: true }); i++; }
      txtWrap(ctx, 'Today: ' + this.ev, 520, 150, 390, 10, G.iron, { outline: false, normal: true });
      txt(ctx, 'Average morale ' + Math.round(this.avg()) + ' / needed ' + this.thr, 520, 206, 11, G.ink, 'left', { outline: false });
    } else {
      txt(ctx, 'The ledger', 520, 60, 15, G.ink, 'left', { outline: false, serif: true });
      const rows = [['Balance', (this.led > 0 ? '+' : '') + this.led], ['Income today', '+' + this.income], ['Upkeep today (food, fuel, care)', '-' + this.upkeep], ['Debt', this.debt ? this.debt + ' (day ' + this.debtAge + ' of 3)' : 'none'], ['Average morale', Math.round(this.avg()) + ' / needed ' + this.thr]];
      rows.forEach((r, i) => { txt(ctx, r[0], 520, 84 + i * 18, 11, G.coal, 'left', { outline: false, normal: true }); txt(ctx, r[1], 900, 84 + i * 18, 11, i === 0 && this.led < 0 ? G.ink : G.coal, 'right', { outline: false }); ctx.fillStyle = grey(120); ctx.fillRect(520, 88 + i * 18, 380, 1); });
      if (this.deal) txtWrap(ctx, this.deal.t, 520, 188, 390, 10, G.iron, { outline: false, normal: true });
    }
    if (this.msg) { UI.paper(ctx, 500, 232, 430, 40, { seed: 22, plain: true }); txtWrap(ctx, this.msg, 514, 250, 400, 10, G.ink, { outline: false, normal: true }); }
    this.menu.render(ctx); Render.post(ctx, {});
  }
}
