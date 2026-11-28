/* ==========================================================================
   SECTION 31 (1.4): ALL UNLOCKED
   Every Long Walk level, every site, every story chapter and every mode,
   open from the start, plus a chest where you can add any item.
   Nothing played here touches the story save or Long Walk progress.
   ========================================================================== */
const FREE = {
  d() { const d = Save.data; if (!d.free) d.free = { chest: {}, lvl: 0, site: 'pharmacy', who: 'marta', ch: 1, toRuns: true }; return d.free; },
  chestCount() { let n = 0; const c = this.d().chest; for (const k in c) n += num(c[k]); return n; },
  /* a sandbox group with the chosen neighbour first */
  run(mode, who, o) {
    const ids = [who].concat(DEFAULT_GROUP.filter(id => id !== who)).slice(0, 4), run = Run.create(mode, Object.assign({ ceasefire: null, group: ids, count: 4 }, o || {}));
    if (!run.surv.some(s => s.id === who) && SURVIVORS[who]) { const s = new Survivor(who); s.job = 'rest'; run.surv.unshift(s); }
    run.free = true; return run;
  },
  stock(run) { if (!this.d().toRuns) return; const c = this.d().chest; for (const k in c) if (num(c[k]) > 0 && ITEMS[k]) Run.add(run, k, num(c[k])); },
  back(msg) { Game.ov.length = 0; Game.run = null; Game.go('Unlocked', { msg }, 'tear'); },
  sortie() {
    const F = this.d(), run = Game.run = this.run('endless', F.who); this.stock(run);
    for (const id in UPGRADES) run.up[id] = 1;
    const pack = {}; if (F.toRuns) for (const k in F.chest) if (num(F.chest[k]) > 0) pack[k] = num(F.chest[k]);
    const s = run.surv.find(q => q.id === F.who) || run.surv[0];
    Game.go('NightSortie', { loc: F.site, scouts: [s.id], pack, battery: 1, time: 360, free: true,
      onDone: res => { const got = res && res.loot ? Object.keys(res.loot).length : 0; this.back('Back from ' + LOCS[F.site].n + (res && res.late ? ', late.' : '.') + (got ? ' Found ' + got + ' kinds of things.' : '')); } }, 'iris');
  },
  story(ch) {
    const run = Game.run = this.run('story', 'marta', {}); this.stock(run); const c = CHAPTERS[ch - 1];
    run.day = c.days[0]; run.chapter = ch - 1; for (let i = 0; i < ch; i++) for (const sId of CHAPTERS[i].sites) if (run.sites.indexOf(sId) < 0) run.sites.push(sId);
    Flow.last = { mode: 'story', o: {} }; Flow.chain = null; Flow.day();
  },
  mode(id) { Flow.start(id); if (Game.run) { Game.run.free = true; this.stock(Game.run); } }
};

/* the item picker: adds to the chest, or straight into the game you are playing */
function itemPicker(target, scene) {
  const F = FREE.d(), cats = [['food', 'Food'], ['water', 'Water'], ['med', 'Medicine'], ['mat', 'Materials'], ['tool', 'Tools'], ['joy', 'Comforts'], ['key', 'Keepsakes']];
  const into = target === 'chest' ? 'the chest' : (scene && scene.w && scene.w.L && !scene.w.L.home ? 'your pack' : 'the shelter');
  const add = (k, n) => {
    if (target === 'chest') { F.chest[k] = num(F.chest[k]) + n; Save.write(); }
    else if (scene && scene.w && scene.w.L && !scene.w.L.home) { const s = scene.w.surv[0], got = scene.w.give(k, n, s); if (!got) Game.note('Your pack is full.', 2); }
    else if (Game.run) Run.add(Game.run, k, n);
    Snd.sfx('pickup');
  };
  const have = k => target === 'chest' ? num(F.chest[k]) : (scene && scene.w && scene.w.pack && scene.w.L && !scene.w.L.home ? num(scene.w.pack.items[k]) : Game.run ? num(Game.run.stock[k]) : 0);
  const items = [];
  if (target === 'chest') {
    items.push({ label: 'Five of everything', sub: 'Fills the chest with five of every item.', act: () => { for (const k in ITEMS) F.chest[k] = num(F.chest[k]) + 5; Save.write(); Snd.sfx('unlock'); } });
    items.push({ label: 'Empty the chest', act: () => { F.chest = {}; Save.write(); Snd.sfx('back'); } });
    items.push({ type: 'toggle', label: 'Bring the chest into games', get: () => !!F.toRuns, set: v => { F.toRuns = v; Save.write(); }, sub: 'Free games start with everything in the chest, and sorties pack it.' });
  }
  for (const [c, n] of cats) {
    const ks = Object.keys(ITEMS).filter(k => (ITEMS[k].cat || 'other') === c); if (!ks.length) continue;
    items.push({ type: 'head', label: n.toUpperCase() });
    for (const k of ks) items.push({ label: ITEMS[k].n, right: () => 'x' + have(k), sub: 'Press to add one to ' + into + '. ' + (ITEMS[k].v13 ? 'New in 1.3.' : ''), act: () => add(k, 1) });
  }
  const rest = Object.keys(ITEMS).filter(k => !cats.some(c => c[0] === (ITEMS[k].cat || 'other')));
  if (rest.length) { items.push({ type: 'head', label: 'OTHER' }); for (const k of rest) items.push({ label: ITEMS[k].n, right: () => 'x' + have(k), act: () => add(k, 1) }); }
  return menuOverlay({ title: 'Add any item', key: 'itempick', w: 470, y: 30, maxRows: 14, rowH: 27, items, onBack: () => Game.pop() });
}

class UnlockedScene {
  enter(p) {
    this.t = 0; this.msg = p && p.msg || ''; const F = FREE.d(); Snd.setTrack('menu'); Game.run = null;
    const lvlName = v => (Math.floor(v / 10) + 1) + '-' + (v % 10 + 1) + '  ' + WALK_CH[Math.floor(v / 10)].n;
    const items = [
      { type: 'head', label: 'THE LONG WALK' },
      { type: 'choice', label: 'Level', choices: Array.from({ length: 50 }, (_, i) => i), get: () => F.lvl, set: v => { F.lvl = v; }, fmt: lvlName, sub: 'All fifty levels. Your own progress is not changed.' },
      { label: 'Play this level', act: () => Game.go('Walk', { lvl: F.lvl, free: true }, 'iris') },
      { type: 'head', label: 'NIGHT SORTIES' },
      { type: 'choice', label: 'Site', choices: LOC_ORDER.slice(), get: () => F.site, set: v => { F.site = v; }, fmt: v => LOCS[v].n, sub: () => LOCS[F.site].d + '  ' + LOCS[F.site].floors + ' floors, danger ' + LOCS[F.site].danger + '.' },
      { type: 'choice', label: 'Who goes', choices: SURV_ORDER.slice(), get: () => F.who, set: v => { F.who = v; }, fmt: v => SURVIVORS[v].short, sub: 'Anyone, the Lamplighter included.' },
      { label: 'Go out tonight', sub: 'Packs whatever is in the chest.', act: () => FREE.sortie() },
      { type: 'head', label: 'STORY' },
      { type: 'choice', label: 'Chapter', choices: [1, 2, 3, 4, 5], get: () => F.ch, set: v => { F.ch = v; }, fmt: v => v + '. ' + CHAPTERS[v - 1].t, sub: () => CHAPTERS[F.ch - 1].blurb + ' Not saved over your story.' },
      { label: 'Start the story here', act: () => FREE.story(F.ch) },
      { type: 'head', label: 'EVERY MODE' }
    ];
    for (const m of MODES) if (m.id !== 'unlocked' && m.id !== 'custom') items.push({ label: m.n, sub: m.d, act: () => (m.id === 'longwalk' ? Game.go('WalkMenu', {}, 'flicker') : FREE.mode(m.id)) });
    items.push({ type: 'head', label: 'ITEMS' }, { label: 'Add any item', right: () => FREE.chestCount() + ' in the chest', sub: 'Choose any of the ' + Object.keys(ITEMS).length + ' items. In any free game, the pause menu can add items too.', act: () => Game.push(itemPicker('chest')) });
    this.menu = new Menu({ x: 30, y: 30, w: 450, key: 'unlocked', title: 'All Unlocked', maxRows: 13, items, onBack: () => Game.go('Title', {}, 'tear') });
  }
  update(dt) { this.t += dt; menuWeather(dt); this.menu.update(dt); }
  render(ctx) {
    Render.building(ctx, this.t, { x: 660 }); this.menu.render(ctx);
    UI.paper(ctx, 520, 380, 410, 120, { seed: 51, rot: -0.006 });
    txt(ctx, 'Everything is open', 540, 410, 15, G.ink, 'left', { outline: false, serif: true });
    txtWrap(ctx, this.msg || 'Play any level, site, chapter or mode. Add any item. Games started here never overwrite your saves.', 540, 432, 370, 10.5, G.coal, { normal: true, outline: false });
    Render.post(ctx, {});
  }
}
MODES.splice(2, 0, { id: 'unlocked', n: 'All Unlocked', d: 'Every level, site, chapter, mode and item, open from the start. Never touches your saves.', kind: 'free', coop: 2 });
MODE_BY_ID.unlocked = MODES[2];
(function () { const _st = Flow.start; Flow.start = function (mode, o) { if (mode === 'unlocked') { Game.go('Unlocked', {}, 'tear'); return; } return _st.call(this, mode, o); }; })();
