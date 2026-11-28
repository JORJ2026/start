
/* ==========================================================================
   SECTION 24: EXPANSION III - three more winters
   Snowbound (keep everyone warm through a blizzard night, at home),
   Night Market (buttons, prams and fair-ish prices, as a table game),
   Courier Night (Ines carries the building's letters across three nights).
   ========================================================================== */
MODES.push(
  { id: 'snow', n: 'Snowbound', d: 'A blizzard night. One heater, a little wood, everyone home. Keep them warm until dawn.', kind: 'homenight', coop: 2, more: true,
    setup(run) { run.up.heater = 1; run.stock.wood = 5; run.stock.fuel = 1; run.stock.blanket = 2; run.stock.cloth = 1; run.barricade = 1; } },
  { id: 'market', n: 'Night Market', d: 'Six nights of stalls and whispers. Trade your way to a fuller pantry.', kind: 'scene', scene: 'Market', coop: 1, more: true },
  { id: 'courier', n: 'Courier Night', d: 'Three nights, three neighborhoods, a bag of undelivered letters.', kind: 'chain', coop: 1, more: true, group: ['ines', 'marta'] }
);
MODES.forEach(m => { MODE_BY_ID[m.id] = m; });

/* --- Snowbound --- */
Object.assign(OBJDEF, {
  blanketpile: { r: 26, always: true, act(w, s) { const run = w.run; if (s.blanket) return { label: 'Wrapped in a blanket', dis: 'Already wrapped.', fn() {} };
    return { label: 'Wrap up in a blanket', dis: Run.count(run, 'blanket') > 0 ? null : 'None left. Sew one from 2 cloth at the workbench.', hold: 0.8, sfx: 'page', fn() { Run.add(run, 'blanket', -1); s.blanket = true; s.addMorale(3); Bus.emit('blanketOn', { s }); } }; } },
  mailbox: { r: 24, always: true, act(w, s, o) { if (o.done) return null; return { label: 'Deliver the letter', hold: 0.7, sfx: 'page', fn() { o.done = true; Snd.sfx('chime'); Parts.emit('glint', o.x, w.floorY(o.f) - 34, 4, { sx: 10, sy: 8 }); Bus.emit('letterDelivered', { s, o }); } }; } }
});
Object.assign(OBJ_DRAW, {
  blanketpile(c, w, o, x, y, t, run, B) { const n = Math.min(4, Run.count(run, 'blanket')); for (let k = 0; k < n; k++) { B(-16 + (k % 2) * 3, -6 - k * 6, 32, 6, 150 + k * 18); B(-16 + (k % 2) * 3, -6 - k * 6, 32, 1.5, 90); } if (!n) B(-14, -3, 28, 3, 60); },
  mailbox(c, w, o, x, y, t, run, B) { B(-2, -40, 4, 40, 70); B(-12, -58, 24, 18, o.done ? 140 : 100); B(-9, -50, 18, 2, 30); if (o.done) { B(10, -68, 2, 12, 200); B(10, -68, 8, 5, 220); }
    else { c.strokeStyle = grey(240, 0.45 + 0.4 * Math.sin(t * 4)); c.lineWidth = 1.5; c.setLineDash([4, 3]); c.strokeRect(x - 15, y - 61, 30, 24); c.setLineDash([]); UI.icon(c, 'star', x, y - 70, 7, G.white); } }
});
NIGHT_RULES.snow = { coop: 2, quit: true, ai: 'still', label: 'BLIZZARD', dark: 0.7, opts: { drafts: true },
  init(sc) {
    const w = sc.w, run = sc.run, st = sc.st, D = w.diff;
    w.L.objs.push({ type: 'blanketpile', x: 470, f: 3 });
    st.len = (run.diff === 'gentle' ? 160 : run.diff === 'harsh' ? 230 : 195) / (run.mods.double ? 2 : 1); st.heat = 40; st.gustT = 22; st.gust = null; st.freeze = 0; st.lit = true; st.wood0 = Run.count(run, 'wood');
    for (const s of w.surv) { s.cold = 62; s.blanket = false; }
    run.heaterOn = true; Snd.amb.wind = 0.9; Snd.setTrack('snow'); run.weather = 'snow';
    w.o.heaterAct = (ww, s) => ({ label: 'Feed the heater (' + Math.round(st.heat) + '%)', dis: Run.count(run, 'fuel') > 0 || Run.count(run, 'wood') > 0 ? (st.heat > 92 ? 'It is full.' : null) : 'Nothing left to burn. Board windows, huddle, wrap up.', hold: 0.9, sfx: 'crackle',
      fn() { if (Run.count(run, 'fuel') > 0) { Run.add(run, 'fuel', -1); st.heat = Math.min(100, st.heat + 60); } else { Run.add(run, 'wood', -1); st.heat = Math.min(100, st.heat + 34); } Parts.emit('ember', 680, ww.floorY(3) - 30, 6, {}); Bus.emit('heaterFed', { s }); } });
    sc.objective = 'Blizzard. Bring everyone to the heater, keep it fed, board the windows, share the blankets. Switch with ' + Input.glyph('sw') + '.';
    note('Snow against the boards. The heater is in the kitchen. Everybody should be near it before the cold finds them.', 6);
  },
  clock(sc) { return clamp(sc.t / sc.st.len, 0, 1); },
  update(sc, dt) {
    const st = sc.st, w = sc.w, run = sc.run, D = w.diff;
    st.heat = Math.max(0, st.heat - dt * 1.9 * D.dmg); run.heaterOn = st.heat > 0;
    if (st.heat <= 0 && st.lit) { st.lit = false; Game.banner('The heater has gone out. Feed it!', 'warn', 4); Snd.sfx('tick'); } else if (st.heat > 0) st.lit = true;
    if (st.heat < 18 && st.heat > 0 && Run.once(run, 'lowheat' + Math.floor(sc.t / 30))) Game.banner('The heater is burning low.', 'warn', 3);
    // gusts are telegraphed: a rising tone and rattling boards, then cold for anyone far from the heater
    st.gustT -= dt;
    if (st.gust) { st.gust.t -= dt; if (st.gust.t <= 0) { Snd.sfx('gust', { d: 2 }); for (const s of w.surv) { const near = s.f === 3 && Math.abs(s.x - 680) < 170 && st.heat > 0; if (!near) { s.cold = clamp(s.cold - (s.blanket ? 6 : 13) * D.dmg, 0, 100); s.act('shiver', 1); } } w.shake(3); st.gust = null; st.gustT = 20 + Math.random() * 12; } }
    else if (st.gustT <= 0) { st.gust = { t: 4 * D.warn }; Snd.sfx('rise', { d: 2.5 }); Game.banner('The wind is rising. Get close to the heater!', 'warn', 4); Bus.emit('hazardWarning', { type: 'gust' }); for (const o of w.L.objs) if (o.type === 'window' && !o.boarded) o.rattle = true; }
    if (!st.gust) for (const o of w.L.objs) if (o.type === 'window') o.rattle = false;
    // warmth: the heater, each other, blankets; drafts from unboarded windows
    let coldest = null;
    for (const s of w.surv) {
      let d = -1.0 * D.dmg;
      if (st.heat > 0 && s.f === 3) d += 1.6 * clamp(1 - Math.abs(s.x - 680) / 300, 0, 1) * (0.5 + st.heat / 200);
      const huddle = w.surv.filter(p => p !== s && p.f === s.f && Math.abs(p.x - s.x) < 90).length; d += Math.min(3, huddle) * 0.28;
      if (s.blanket) d += 0.55;
      d -= w.L.objs.filter(o => o.type === 'window' && !o.boarded && o.f === s.f).length * 0.35;
      s.cold = clamp(s.cold + d * dt, 0, 100);
      if (s.cold < 22) { s.coughT = Math.max(s.coughT, 0); if (Math.random() < dt * 0.3) Parts.emit('breath', s.x + s.face * 6, w.entY(s) - 40, 1, {}); }
      if (!coldest || s.cold < coldest.cold) coldest = s;
    }
    st.coldest = coldest;
    if (coldest && coldest.cold <= 0) { st.freeze += dt; st.tension = 0.9; if (Run.once(run, 'frz' + Math.floor(st.freeze / 4))) Game.banner(coldest.name + ' is freezing! Bring them to the heater.', 'warn', 3); } else { st.freeze = Math.max(0, st.freeze - dt * 0.5); st.tension = coldest && coldest.cold < 25 ? 0.5 : 0.1; }
    if (st.freeze >= 12) { sc.finish({ win: false, lines: [coldest.name + ' got too cold. You wrap them up and wait for the morning together.', 'The night lasted ' + Math.round(sc.t) + 's of ' + Math.round(st.len) + 's.'], score: Math.round(sc.t * 2) }); return; }
    if (sc.t >= st.len) { const avg = w.surv.reduce((a, s) => a + s.cold, 0) / w.surv.length;
      sc.finish({ win: true, lines: ['Dawn, and the snow has stopped. Everyone is here, and warm enough.', 'Average warmth: ' + Math.round(avg) + '%', 'Wood left: ' + Run.count(run, 'wood') + '   Blankets shared: ' + w.surv.filter(s => s.blanket).length], score: 500 + Math.round(avg * 6) + Run.count(run, 'wood') * 40, ach: 'snowbound' }); }
  },
  hud(ctx, sc) { const st = sc.st; hudBox(ctx, ['Heater: ' + (st.heat > 0 ? Math.round(st.heat) + '%' : 'OUT'), 'Wood ' + Run.count(sc.run, 'wood') + '  Fuel ' + Run.count(sc.run, 'fuel') + '  Blankets ' + Run.count(sc.run, 'blanket'), st.coldest ? 'Coldest: ' + st.coldest.name + ' (' + Math.round(st.coldest.cold) + '%)' : '', st.gust ? 'Wind rising!' : 'Dawn in ' + Math.max(0, Math.ceil(st.len - sc.t)) + 's']); }
};

/* --- Courier Night --- */
CHAINS.courier = {
  init(run) { return { n: 0, sent: 0, total: 0, tries: run.diff === 'gentle' ? 2 : 1 }; },
  next(run, st) {
    const legs = [{ loc: 'apartments', mail: 3, t: 210, name: 'The collapsed block' }, { loc: 'market', mail: 4, t: 230, name: 'Market Square' }, { loc: 'school', mail: 5, t: 250, name: 'The school streets' }], L = legs[st.n];
    run.day = st.n + 1; let got = 0;
    Game.go('NightSortie', { loc: L.loc, track: 'courier', scouts: [run.surv[0].id], pack: { bottle: 1, clatter: 1 }, battery: 1, time: L.t, n: st.n * 3 + st.tries, lv: { mail: L.mail, cont: 3 },
      objFn: () => 'Night ' + (st.n + 1) + ' of 3: deliver the letters (' + got + '/' + L.mail + '). Then home by the street door.',
      onEvent: (sc, ev) => { if (ev === 'letterDelivered') { got++; Floaters.add(got + ' / ' + L.mail, sc.w.surv[0].x, sc.w.entY(sc.w.surv[0]) - 80, {}); if (got === L.mail) Game.banner('Every letter delivered. Head home.', 'star', 4); } },
      onDone: res => {
        if (res.failed || res.late) { st.tries--; if (st.tries < 0) { Flow.modeResult('courier', { win: st.sent > 0 && st.sent >= Math.ceil(st.total * 0.6), score: st.sent * 120, lines: [res.failed ? 'Caught on night ' + (st.n + 1) + '. The bag comes home with you.' : 'Dawn caught the route.', 'Letters delivered: ' + st.sent + ' of ' + (st.total + L.mail)] }); return; }
          Game.go('Interlude', { title: 'The bag comes home', lines: ['Same streets tomorrow night.', 'Retries left: ' + st.tries], opts: [{ l: 'Try again', fn: () => CHAINS.courier.next(run, st) }] }, 'tear'); return; }
        st.sent += got; st.total += L.mail; st.n++; run.surv[0].health = clamp(run.surv[0].health + 20, 0, 100);
        if (st.n >= 3) { const all = st.sent >= st.total; Flow.modeResult('courier', { win: st.sent >= Math.ceil(st.total * 0.6), ach: all ? 'courier' : null, score: st.sent * 120 + (all ? 400 : 0), lines: ['Three nights, three neighborhoods.', 'Letters delivered: ' + st.sent + ' of ' + st.total, all ? 'Not one letter left in the bag.' : 'A few still wait in the bag. Next winter.'] }); }
        else Game.go('Interlude', { title: L.name + ': ' + got + ' of ' + L.mail + ' delivered', lines: ['Doors opened a crack, then all the way.', 'Next: ' + legs[st.n].name + '.'], opts: [{ l: 'Next night', fn: () => CHAINS.courier.next(run, st) }] }, 'tear');
      } }, 'iris');
  }
};

/* --- Night Market: a table game of buttons and barter --- */
const MKT_GOODS = ['can', 'bread', 'flour', 'salt', 'cloth', 'wood', 'candle', 'meds', 'coffee', 'blanket'];
const MKT_BASE = { can: 4, bread: 5, flour: 4, salt: 3, cloth: 3, wood: 2, candle: 3, meds: 9, coffee: 6, blanket: 7 };
const MKT_STALLS = [{ n: 'The pram lady', likes: ['cloth', 'candle', 'blanket'] }, { n: 'A man with a jerrycan', likes: ['wood', 'coffee', 'can'] }, { n: 'The baker\'s cousin', likes: ['flour', 'salt', 'bread'] },
  { n: 'A nurse off shift', likes: ['meds', 'coffee', 'blanket'] }, { n: 'Two quiet brothers', likes: ['can', 'salt', 'wood'] }, { n: 'The violinist, moonlighting', likes: ['candle', 'bread', 'cloth'] }];
const MKT_EVENTS = [{ t: 'A patrol light sweeps the square. Stalls pack up early: one less deal tonight.', fx: 'short' }, { t: 'Rumor: a convoy is late. Food prices climb tomorrow.', fx: 'food' },
  { t: 'Rumor: someone found a warehouse of cloth. Cloth will be cheap tomorrow.', fx: 'cloth' }, { t: 'Cold snap coming. Blankets and wood will be dear.', fx: 'cold' }, { t: 'A quiet night. Prices hold.', fx: '' }, { t: 'A pickpocket works the crowd. Hold your button jar tight.', fx: 'thief' }];
class MarketScene {
  enter(p) {
    const run = this.run = Game.run; this.t = 0; this.night = 1; this.nights = 6; this.msg = ''; this.r = new RNG(run.seed + 77);
    this.buttons = 12; this.bag = { can: 3, cloth: 3, wood: 4, candle: 1 }; this.cap = 16; this.deals = 0; this.yara = run.surv.some(s => s.id === 'yara'); this.trend = {};
    for (const s of run.surv) { s.resetRuntime(); s.morale = 60; s.hunger = 70; }
    this.start = this.value(); this.thr = run.diff === 'gentle' ? 1.25 : run.diff === 'harsh' ? 1.6 : 1.4;
    Snd.setTrack('market'); Snd.tension = 0; this.open();
  }
  price(id) { return Math.max(1, Math.round(MKT_BASE[id] * (this.mult[id] || 1))); }
  value() { let v = this.buttons; for (const k in this.bag) v += (MKT_BASE[k] || 1) * this.bag[k]; return v; }
  held() { let n = 0; for (const k in this.bag) n += this.bag[k]; return n; }
  open() {
    const r = this.r; this.mult = {}; for (const k of MKT_GOODS) this.mult[k] = (0.75 + r.f() * 0.6) * (this.trend[k] || 1);
    this.trend = {}; this.ev = r.pick(MKT_EVENTS); this.dealsLeft = this.ev.fx === 'short' ? 5 : 6;
    if (this.ev.fx === 'food') ['can', 'bread', 'flour'].forEach(k => { this.trend[k] = 1.45; });
    if (this.ev.fx === 'cloth') this.trend.cloth = 0.55; if (this.ev.fx === 'cold') { this.trend.blanket = 1.6; this.trend.wood = 1.7; }
    if (this.ev.fx === 'thief' && this.buttons > 3 && r.chance(0.5)) { const n = Math.min(3, this.buttons); this.buttons -= n; this.msg = 'The jar is lighter by ' + n + ' buttons. Somebody has quick fingers.'; } else this.msg = '';
    this.stalls = r.shuffle ? r.shuffle(MKT_STALLS.slice()).slice(0, 3) : MKT_STALLS.slice().sort(() => r.f() - 0.5).slice(0, 3);
    this.build();
  }
  build() {
    const items = [];
    this.stalls.forEach(st => {
      items.push({ type: 'head', label: st.n.toUpperCase() });
      st.likes.forEach(k => {
        const sell = this.price(k) + (this.yara ? 1 : 0), buy = Math.max(1, Math.round(this.price(k) * 1.25));
        items.push({ label: 'Sell ' + ITEMS[k].n, right: () => '+' + sell, sub: 'You have ' + (this.bag[k] || 0) + '. Usually worth ' + MKT_BASE[k] + '.' + (this.yara ? ' Yara adds a button.' : ''),
          dis: () => (this.dealsLeft <= 0 ? 'The stalls are packing up.' : (this.bag[k] || 0) > 0 ? false : 'You have none.'), act: () => { this.bag[k]--; this.buttons += sell; this.deal(); } });
        items.push({ label: 'Buy ' + ITEMS[k].n, right: () => '-' + buy, sub: 'Bag ' + this.held() + '/' + this.cap + '.',
          dis: () => (this.dealsLeft <= 0 ? 'The stalls are packing up.' : this.buttons < buy ? 'Not enough buttons.' : this.held() >= this.cap ? 'The bag is full.' : false), act: () => { this.buttons -= buy; this.bag[k] = (this.bag[k] || 0) + 1; this.deal(); } });
      });
    });
    items.push({ type: 'head', label: 'HOME' }, { label: () => (this.night >= this.nights ? 'Go home for good' : 'Go home for the night'), sub: 'Somebody has to eat: one food from the bag, or morale suffers.', act: () => this.endNight() },
      { label: 'Leave the market', back: true, act: () => Game.go('Title', {}, 'flicker') });
    const sel = this.menu ? this.menu.sel : 1;
    this.menu = new Menu({ x: 30, y: 60, w: 440, key: '', maxRows: 13, title: 'Night Market: night ' + this.night + ' of ' + this.nights, items, noBackItem: true, onBack: () => Game.go('Title', {}, 'flicker') });
    this.menu.sel = clamp(sel, 0, this.menu.vis().length - 1); this.menu.fix(1);
  }
  deal() { this.deals++; this.dealsLeft--; Snd.sfx('pickup'); if (this.dealsLeft <= 0) this.msg = 'The stalls are packing up. Time to go home.'; this.build(); }
  endNight() {
    const run = this.run, food = ['bread', 'can', 'flour'].find(k => (this.bag[k] || 0) > 0);
    if (food) { this.bag[food]--; for (const s of run.surv) s.addMorale(2, true); } else for (const s of run.surv) s.addMorale(-12, true);
    Snd.sfx('door', {});
    if (this.night >= this.nights || run.surv.every(s => s.morale <= 5)) {
      const v = this.value(), ratio = v / this.start, win = ratio >= this.thr && run.surv.some(s => s.morale > 5);
      Flow.modeResult('market', { win, ach: win ? 'market' : null, score: Math.round(v * 10), lines: ['Six nights at the market.', 'Started with goods worth ' + this.start + ', finished with ' + v + ' (x' + ratio.toFixed(2) + ', needed x' + this.thr + ')', 'Deals struck: ' + this.deals, 'Buttons in the jar: ' + this.buttons] }); return;
    }
    this.night++; this.open();
    this.msg = (food ? 'Supper from the bag: ' + ITEMS[food].n.toLowerCase() + '. ' : 'Nothing to eat tonight. Spirits sag. ') + this.msg;
  }
  update(dt) { this.t += dt; for (const s of this.run.surv) Rig.update(s, dt, this.t); this.menu.update(dt); }
  render(ctx) {
    const t = Game.time;
    Render.backdrop(ctx, 200 + this.t * 4, true, {});
    ctx.fillStyle = grey(20, 0.55); ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) { const x = 520 + i * 108; ctx.fillStyle = grey(70 + i * 6); ctx.fillRect(x, 330, 92, 8); ctx.fillStyle = grey(50); ctx.fillRect(x + 6, 338, 5, 70); ctx.fillRect(x + 81, 338, 5, 70);
      ctx.fillStyle = grey(110 + i * 10); ctx.beginPath(); ctx.moveTo(x - 6, 300); ctx.lineTo(x + 98, 300); ctx.lineTo(x + 86, 322); ctx.lineTo(x + 6, 322); ctx.fill();
      const g = ctx.createRadialGradient(x + 46, 316, 0, x + 46, 316, 70); g.addColorStop(0, grey(255, 0.18 + 0.05 * Math.sin(t * 3 + i))); g.addColorStop(1, grey(255, 0)); ctx.fillStyle = g; ctx.fillRect(x - 30, 250, 150, 140); }
    this.run.surv.slice(0, 3).forEach((s, i) => { s.face = -1; Rig.draw(ctx, s, 560 + i * 70, 470, { scale: 1.5 }); });
    UI.paper(ctx, 500, 40, 430, 220, { seed: 31, rot: 0.006 });
    txt(ctx, 'The button jar: ' + this.buttons, 520, 70, 15, G.ink, 'left', { outline: false, serif: true });
    txt(ctx, 'Bag ' + this.held() + '/' + this.cap + '   Deals left tonight: ' + Math.max(0, this.dealsLeft), 520, 92, 10.5, G.coal, 'left', { outline: false });
    let i = 0; for (const k in this.bag) { if (!this.bag[k]) continue; txt(ctx, this.bag[k] + '  ' + ITEMS[k].n, 520 + (i % 3) * 132, 114 + Math.floor(i / 3) * 16, 10, G.coal, 'left', { outline: false, normal: true }); i++; }
    txtWrap(ctx, this.ev.t, 520, 182, 390, 10, G.iron, { outline: false, normal: true });
    txt(ctx, 'Worth now: ' + this.value() + '  (goal ' + Math.ceil(this.start * this.thr) + ')', 520, 240, 11, G.ink, 'left', { outline: false });
    if (this.msg) { UI.paper(ctx, 500, 270, 430, 36, { seed: 32, plain: true }); txtWrap(ctx, this.msg, 514, 288, 400, 10, G.ink, { outline: false, normal: true }); }
    this.menu.render(ctx); Render.post(ctx, {});
  }
}
