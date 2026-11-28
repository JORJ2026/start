
/* ==========================================================================
   SECTION 21: MENU AND STORY SCENES
   Boot, Title, StoryMap, ModeSelect, CharacterPrep, Wardrobe, Profile,
   Settings, Cutscene, DawnReport, Results, Ending, Credits, Interlude
   ========================================================================== */
function fsAvailable() { const e = document.documentElement; return !!(e.requestFullscreen || e.webkitRequestFullscreen); }
function goFullscreen() { const e = document.documentElement; try { (e.requestFullscreen || e.webkitRequestFullscreen).call(e); } catch (err) { /* optional */ } }
function menuWeather(dt) { if (Math.random() < dt * 14) Parts.emit('snow', Math.random() * (W + 60), -6, 1, { screen: true }); if (Math.random() < dt * 5) Parts.emit('ash', Math.random() * W, -6, 1, { screen: true }); }
function tipOfTheDay() { return TIPS[Math.floor(Math.random() * TIPS.length)]; }
function drawTip(ctx, tip, y) { txt(ctx, 'Tip: ' + tip, W / 2, y, 10, G.pewter, 'center', { normal: true }); }

class BootScene {
  enter() { this.t = 0; }
  update(dt) { this.t += dt; if (this.t > 1.0 || (this.t > 0.3 && Input.menu.any)) { Game.go('Title', {}, 'flicker'); this.t = -99; } }
  render(ctx) {
    ctx.fillStyle = G.ink; ctx.fillRect(0, 0, W, H); const t = Math.max(0, this.t);
    for (let i = 0; i < 5; i++) { const on = t > 0.12 + i * 0.16, x = 320 + i * 80; ctx.strokeStyle = G.iron; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, 190); ctx.lineTo(x, 236); ctx.stroke(); if (on) { const g = ctx.createRadialGradient(x, 244, 0, x, 244, 60); g.addColorStop(0, grey(255, 0.35)); g.addColorStop(1, grey(255, 0)); ctx.fillStyle = g; ctx.fillRect(x - 60, 184, 120, 120); } ctx.fillStyle = on ? G.bone : G.iron; ctx.beginPath(); ctx.arc(x, 244, 7, 0, TAU); ctx.fill(); }
    txt(ctx, 'Lighting the lamps...', W / 2, 330, 14, G.paper, 'center', { rot: -0.01 });
  }
}

class TitleScene {
  enter() {
    Snd.setTrack('menu'); Snd.tension = 0; Snd.amb.wind = 0.3; Snd.amb.rain = 0; this.t = 0; this.taps = 0; this.tapT = 0; this.tip = tipOfTheDay(); Parts.clear(); Floaters.clear();
    const s = Save.data;
    this.menu = new Menu({ x: 612, y: 176, w: 300, key: 'title', maxRows: 9, rowH: 30, items: [
      { label: 'Begin', sub: () => (s.tutorialDone ? 'A short winter: seven days to the ceasefire.' : 'Your first night out. You will learn by doing.'), act: () => (s.tutorialDone ? Flow.start('quick') : Flow.start('story', { tutorial: true })) },
      { label: 'Continue', hidden: () => !s.story, sub: () => (s.story ? (MODE_BY_ID[s.story.mode] || { n: 'Run' }).n + ', day ' + s.story.day + '.' : ''), act: () => { Flow.last = { mode: s.story.mode, o: {} }; Game.players.length = 1; Game.padOwner = {}; Game.run = Run.restore(s.story); Flow.day(); } },
      { label: 'Story', sub: 'Five chapters, thirty days.', act: () => Game.go('StoryMap', {}, 'tear') },
      { label: 'The Story So Far', sub: 'Who you are, and who you are hiding from.', act: () => Game.go('Cutscene', { script: CUTS.intro.slice(0, -1), title: 'The Story So Far', next: () => Game.go('FieldGuide', {}, 'tear') }, 'flicker') },
      { label: 'Modes', sub: 'Twenty-one ways to spend a winter.', act: () => Game.go('ModeSelect', {}, 'tear') },
      { label: 'Survivors', sub: 'Choose who shares the landing.', act: () => Game.go('CharacterPrep', {}, 'tear') },
      { label: 'Wardrobe', sub: 'Clothing, shelter looks, starting perks.', act: () => Game.go('Wardrobe', {}, 'tear') },
      { label: 'The Long Walk', sub: 'A new journey: fifty levels through the dark, home.', act: () => Game.go('WalkMenu', {}, 'flicker') },
      { label: 'All Unlocked', sub: 'Any level, site, chapter, mode or item. Never touches your saves.', act: () => Game.go('Unlocked', {}, 'tear') },
      { label: 'Settings', sub: 'Sound, controls, comfort, accessibility.', act: () => Game.go('Settings', {}, 'blinds') },
      { label: "Player's Guide", sub: 'Opens the PDF guide in a new tab.', act: () => openGuide() },
      { label: 'Profile', sub: 'Keepsakes, records, credits.', act: () => Game.go('Profile', {}, 'tear') },
      { label: 'Go Fullscreen', hidden: () => !(Input.touch && fsAvailable() && !document.fullscreenElement), act: goFullscreen }
    ] });
  }
  egg() { Game.toyNight = true; unlock('toypiano'); Game.toast('A toy piano, somewhere', "Tonight's music will be smaller.", 'star'); Snd.sfx('box'); }
  update(dt) {
    this.t += dt; this.tapT -= dt; menuWeather(dt);
    if (Input.konami) { Input.konami = false; this.egg(); }
    const p = Input.ptr; if (p.click && p.x < 560 && p.y < 150) { this.taps = this.tapT > 0 ? this.taps + 1 : 1; this.tapT = 0.6; if (this.taps >= 7) { this.taps = 0; this.egg(); } }
    this.menu.update(dt);
  }
  render(ctx) {
    const t = this.t; Render.building(ctx, t, { x: 120 });
    const tg = ctx.createRadialGradient(740, 90, 10, 740, 90, 260); tg.addColorStop(0, 'rgba(0,0,0,0.55)'); tg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = tg; ctx.fillRect(480, -170, 520, 520);   // a dark pool so the title reads over the skyline
    ctx.save(); ctx.translate(588, 84); ctx.rotate(-0.025);
    const word = (s, y, size) => { let x = 0; setFont(ctx, size, { serif: true, fixed: true }); for (let i = 0; i < s.length; i++) { const k = Ease.outBack(clamp((t - i * 0.05) / 0.4, 0, 1)), cw = ctx.measureText(s[i]).width; const sway = Save.s.reduce ? 0 : Math.sin(t * 1.3 + i * 0.7 + y) * 1.2; txt(ctx, s[i], x + 3, y + Math.sin(i * 2.1) * 2 + (1 - k) * -20 + sway + 4, size, 'rgba(0,0,0,0.5)', 'left', { serif: true, fixed: true, outline: false }); txt(ctx, s[i], x, y + Math.sin(i * 2.1) * 2 + (1 - k) * -20 + sway, size, G.bone, 'left', { serif: true, fixed: true, lw: 5 }); x += cw + 2; } };
    word('ASHEN', 0, 50); word('WINDOWS', 48, 50); ctx.restore();
    txt(ctx, 'a quiet winter in Greywater', 600, 160, 12, G.pewter, 'left', { normal: true, rot: -0.02 });
    this.menu.render(ctx);
    drawTip(ctx, this.tip, H - 30);
    ctx.save(); ctx.translate(W - 52, H - 18); ctx.rotate(-0.04); UI.paper(ctx, -40, -11, 80, 20, { seed: 61, jit: 1, plain: true }); ctx.fillStyle = G.ink; ctx.beginPath(); ctx.arc(-32, -1, 2, 0, TAU); ctx.fill(); txt(ctx, 'v' + VERSION, 4, 3, 10, G.ink, 'center', { outline: false, fixed: true }); ctx.restore();
    ctx.save(); ctx.translate(872, 150); ctx.rotate(0.08 + (Save.s.reduce ? 0 : Math.sin(t * 2) * 0.02)); ctx.fillStyle = G.bone; ctx.beginPath(); ctx.moveTo(-40, -9); ctx.lineTo(28, -9); ctx.lineTo(34, 0); ctx.lineTo(28, 9); ctx.lineTo(-40, 9); ctx.closePath(); ctx.fill(); ctx.fillStyle = G.ink; ctx.beginPath(); ctx.arc(24, 0, 2, 0, TAU); ctx.fill(); txt(ctx, 'NEW IN 1.4', -8, 3.5, 8.5, G.ink, 'center', { outline: false, fixed: true }); ctx.restore();   // a swing tag for the update
    if (!Save.ok) txt(ctx, 'playing without storage', W - 100, H - 10, 9, G.fog, 'right', { normal: true });
    UI.icon(ctx, 'ember', 20, H - 14, 10, G.chalk); txt(ctx, 'Embers ' + Save.data.embers, 30, H - 10, 10, G.pewter, 'left');
    Render.post(ctx, {});
  }
}

class StoryMapScene {
  enter() {
    const s = Save.data; this.t = 0;
    this.menu = new Menu({ x: 610, y: 300, w: 310, key: 'storymap', items: [
      { label: 'Continue the story', hidden: () => !(s.story && s.story.mode === 'story'), sub: () => (s.story ? 'Day ' + s.story.day + '.' : ''), act: () => Flow.start('story', { cont: true }) },
      { label: 'New story', sub: 'Thirty days from the first candle. Replaces the saved run.', act: () => Flow.start('story', {}) },
      { label: 'Replay the first night', sub: 'The tutorial sortie, then the story.', act: () => Flow.start('story', { tutorial: true }) }
    ], onBack: () => Game.go('Title', {}, 'tear') });
  }
  update(dt) { this.t += dt; menuWeather(dt); this.menu.update(dt); }
  render(ctx) {
    Render.backdrop(ctx, 400 + this.t * 3, true, {}); const s = Save.data, cur = s.story && s.story.mode === 'story' ? s.story.day : 0;
    UI.paper(ctx, 30, 30, 560, 480, { seed: 31, rot: -0.004 }); txt(ctx, 'The story of the landing', 56, 70, 20, G.ink, 'left', { outline: false, serif: true });
    CHAPTERS.forEach((c, i) => {
      const y = 104 + i * 78, done = s.storyBest > c.days[1], here = cur >= c.days[0] && cur <= c.days[1], k = Ease.outCubic(clamp((this.t - i * 0.08) / 0.3, 0, 1));
      ctx.globalAlpha = k; ctx.strokeStyle = G.iron; ctx.lineWidth = 2; if (i < 4) { ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(76, y + 16); ctx.lineTo(76, y + 78); ctx.stroke(); ctx.setLineDash([]); }
      ctx.fillStyle = done ? G.ink : here ? G.iron : G.pewter; ctx.beginPath(); ctx.arc(76, y, 12, 0, TAU); ctx.fill(); txt(ctx, done ? 'x' : String(c.id), 76, y + 4, 12, G.bone, 'center', { outline: false, fixed: true });
      txt(ctx, c.t, 104, y - 2, 15, G.ink, 'left', { outline: false, serif: true }); txt(ctx, 'Days ' + c.days[0] + ' to ' + c.days[1] + (here ? '   (you are here)' : done ? '   (told)' : ''), 104, y + 14, 10, G.iron, 'left', { outline: false });
      txtWrap(ctx, c.blurb, 104, y + 30, 460, 10, G.coal, { outline: false, normal: true }); ctx.globalAlpha = 1;
    });
    this.menu.render(ctx); Render.post(ctx, {});
  }
}

class ModeSelectScene {
  enter() {
    this.t = 0; const s = Save.s;
    const items = [{ type: 'choice', label: 'Difficulty', choices: ['gentle', 'normal', 'harsh'], get: () => s.diff, set: v => { s.diff = v; Save.write(); }, fmt: v => DIFF[v].name, sub: 'Changes reaction time, vision range, patrol density, scarcity and event frequency. Nothing else.' }];
    MODES.forEach((m, i) => { if (m.more && !MODES[i - 1].more) items.push({ type: 'head', label: 'MORE WINTERS' }); items.push({ label: m.n, mode: m, right: () => (Save.data.scores[m.id] != null ? 'best ' + Save.data.scores[m.id] : ''), sub: m.d, act: () => { if (m.id === 'custom') Game.push(customOverlay()); else Flow.start(m.id); } }); });
    this.menu = new Menu({ x: 30, y: 30, w: 440, key: 'modes', title: 'Modes', maxRows: 13, items, onBack: () => Game.go('Title', {}, 'tear') });
  }
  update(dt) { this.t += dt; menuWeather(dt); this.menu.update(dt); }
  render(ctx) {
    Render.building(ctx, this.t, { x: 600 }); this.menu.render(ctx);
    const it = this.menu.cur(), m = it && it.mode;
    if (m) { UI.paper(ctx, 500, 40, 430, 130, { seed: 41, rot: 0.005 }); txt(ctx, m.n, 520, 72, 18, G.ink, 'left', { outline: false, serif: true }); txtWrap(ctx, m.d, 520, 94, 390, 11, G.coal, { outline: false, normal: true });
    if (m) { const ic = { campaign: 'book', chain: 'moon', homenight: 'door', panel: 'food', sandbox: 'gear', scene: 'map' }[m.kind] || 'star'; ctx.fillStyle = G.iron; ctx.beginPath(); ctx.arc(900, 70, 15, 0, TAU); ctx.fill(); UI.icon(ctx, ic, 900, 70, 14, G.bone);   // a badge for the kind of mode, and one pip per player
      for (let i = 0; i < 4; i++) { ctx.fillStyle = i < m.coop ? G.ink : grey(150); ctx.beginPath(); ctx.arc(860 + i * 14, 146, 4.5, 0, TAU); ctx.fill(); } if (Save.data.scores[m.id] != null) { ctx.save(); ctx.translate(800, 112); ctx.rotate(-0.08); ctx.strokeStyle = G.iron; ctx.lineWidth = 1.5; ctx.strokeRect(-36, -11, 92, 20); txt(ctx, 'BEST ' + Save.data.scores[m.id], 10, 4, 10, G.iron, 'center', { outline: false, fixed: true }); ctx.restore(); } }
      txt(ctx, (m.coop > 1 ? 'Up to ' + m.coop + ' players, local co-op.' : 'One player.') + (m.id === 'daily' ? '  Today: ' + dateKey() : ''), 520, 150, 10, G.iron, 'left', { outline: false }); }
    Render.post(ctx, {});
  }
}
function customOverlay() {
  const c = { count: 4, supplies: 1, winter: 1, raidFreq: 1, eventFreq: 1, ceasefire: 20, gentle: Save.s.gentle, diff: Save.s.diff, mods: {} };
  const lvl = v => (v < 0.9 ? 'Low' : v > 1.1 ? 'High' : 'Normal');
  const items = [
    { type: 'slider', label: 'Survivors', min: 1, max: 5, step: 1, get: () => c.count, set: v => { c.count = v; }, sub: () => c.count + ' on the landing (from your chosen group, in order).' },
    { type: 'choice', label: 'Starting supplies', choices: [0.6, 1, 1.5], get: () => c.supplies, set: v => { c.supplies = v; }, fmt: lvl }, { type: 'choice', label: 'Winter severity', choices: [0.7, 1, 1.4], get: () => c.winter, set: v => { c.winter = v; }, fmt: lvl },
    { type: 'choice', label: 'Raid frequency', choices: [0.5, 1, 1.6], get: () => c.raidFreq, set: v => { c.raidFreq = v; }, fmt: lvl }, { type: 'choice', label: 'Event frequency', choices: [0.6, 1, 1.5], get: () => c.eventFreq, set: v => { c.eventFreq = v; }, fmt: lvl },
    { type: 'choice', label: 'Ceasefire day', choices: [10, 20, 30, 45], get: () => c.ceasefire, set: v => { c.ceasefire = v; } }, { type: 'choice', label: 'AI difficulty', choices: ['gentle', 'normal', 'harsh'], get: () => c.diff, set: v => { c.diff = v; }, fmt: v => DIFF[v].name },
    { type: 'toggle', label: 'Gentle Story', get: () => c.gentle, set: v => { c.gentle = v; }, sub: 'Nobody is lost for good. They leave, and come back with news.' }, { type: 'head', label: 'MODIFIERS (stackable)' }];
  MOD_ORDER.forEach(id => items.push({ type: 'toggle', label: MODS[id].n, get: () => !!c.mods[id], set: v => { c.mods[id] = v; }, sub: MODS[id].d }));
  items.push({ label: 'Begin this winter', act: () => { Game.pop(); Flow.start('custom', { count: c.count, supplies: c.supplies, winter: c.winter, raidFreq: c.raidFreq, eventFreq: c.eventFreq, ceasefire: c.ceasefire, gentle: c.gentle, diff: c.diff, mods: MOD_ORDER.filter(id => c.mods[id]) }); } });
  return menuOverlay({ title: 'Custom Scenario', key: 'custom', w: 460, y: 40, maxRows: 13, items, onBack: () => Game.pop() });
}

/* Survivors: pick the group, preview a move demo, stats, bio and palette. */
const DEMO = ['idle', 'walk', 'sneak', 'run', 'interact', 'comforted', 'victory'];
class CharacterPrepScene {
  enter() {
    this.t = 0; const d = Save.data; this.pre = {}; for (const id of SURV_ORDER) { const s = new Survivor(id); s.morale = 78; this.pre[id] = s; }
    const inG = id => d.group.indexOf(id) >= 0;
    const items = SURV_ORDER.map(id => ({ sid: id, label: () => (inG(id) ? '[x] ' : '[ ] ') + SURVIVORS[id].short, right: () => (id === 'lamp' && !d.unlocks.lamp ? 'locked' : SURVIVORS[id].skill.split(':')[0].slice(0, 22)), dis: () => (id === 'lamp' && !d.unlocks.lamp ? 'Finish the story once to meet them.' : false),
      sub: 'Press to add or remove from the group (1 to 5).', act: () => { if (inG(id)) { if (d.group.length > 1) d.group.splice(d.group.indexOf(id), 1); } else if (d.group.length < 5) d.group.push(id); else Game.toast('The landing is full', 'Five at most.', 'warn'); Save.write(); this.pre[id].gestureT = 1; } }));
    items.push({ type: 'choice', label: 'Palette', choices: [0, 1, 2, 3], get: () => d.equip.variant[this.cur] || 0, set: v => { const key = this.cur + ':' + v, own = v === 0 || d.unlocks.variants[key]; if (!own) { if (d.embers >= VARIANT_COST[v]) { d.embers -= VARIANT_COST[v]; d.unlocks.variants[key] = 1; Snd.sfx('unlock'); } else { Game.toast('Not enough Embers', 'This palette costs ' + VARIANT_COST[v] + '.', 'warn'); return; } } d.equip.variant[this.cur] = v; this.pre[this.cur].variant = v; Save.write(); }, fmt: v => ['Signature', 'Dusk', 'Morning', 'Festival'][v] + (v && !d.unlocks.variants[this.cur + ':' + v] ? ' (' + VARIANT_COST[v] + ' Embers)' : ''), sub: 'Four color schemes each. The world stays grey either way.' });
    this.cur = d.group[0] || 'marta';
    this.menu = new Menu({ x: 24, y: 24, w: 330, key: 'prep', title: 'Survivors', maxRows: 12, rowH: 27, items, onBack: () => Game.go('Title', {}, 'tear') });
  }
  update(dt) { this.t += dt; const it = this.menu.cur(); if (it && it.sid) this.cur = it.sid; this.menu.update(dt);
    const demo = DEMO[Math.floor(this.t / 1.5) % DEMO.length];
    for (const id in this.pre) { const s = this.pre[id]; if (id === this.cur) { s.special = demo === 'idle' ? '' : demo; s.vx = demo === 'walk' || demo === 'sneak' ? 40 : demo === 'run' ? 150 : 0; s.ph += dt * (demo === 'run' ? 14 : 7); s.sprint = demo === 'run'; } else { s.special = ''; s.vx = 0; s.sprint = false; } Rig.update(s, dt, this.t); }
  }
  render(ctx) {
    const d = Save.data; ctx.fillStyle = grey(26); ctx.fillRect(0, 0, W, H);
    // a strip of the cutaway home with everyone idling in it
    ctx.fillStyle = grey(38); ctx.fillRect(370, 20, 570, 150); ctx.fillStyle = grey(46); for (let x = 378; x < 940; x += 15) ctx.fillRect(x, 20, 2, 150); ctx.fillStyle = grey(66); ctx.fillRect(370, 150, 570, 10); ctx.fillStyle = grey(20); ctx.fillRect(366, 16, 4, 148); ctx.fillRect(940, 16, 4, 148);
    SURV_ORDER.forEach((id, i) => { const s = this.pre[id], lock = id === 'lamp' && !d.unlocks.lamp; s.face = i % 2 ? -1 : 1; Rig.draw(ctx, s, 404 + i * 62, 150, { scale: id === this.cur ? 1.5 : 1.2, mono: lock, alpha: lock ? 0.4 : 1 }); if (d.group.indexOf(id) >= 0) { ctx.fillStyle = G.bone; ctx.fillRect(396 + i * 62, 163, 16, 2); } });
    const sv = SURVIVORS[this.cur], s = this.pre[this.cur], lock = this.cur === 'lamp' && !d.unlocks.lamp;
    UI.paper(ctx, 370, 180, 570, 336, { seed: 51, rot: 0.003 });
    ctx.fillStyle = G.chalk; rrect(ctx, 388, 198, 130, 160, 6); ctx.fill(); ctx.fillStyle = G.dust; ctx.fillRect(388, 338, 130, 20);
    const face = s.face; s.face = 1; Rig.draw(ctx, s, 452, 342, { scale: 2.6, mono: lock }); s.face = face;
    txt(ctx, lock ? '(not yet met)' : 'now: ' + DEMO[Math.floor(this.t / 1.5) % DEMO.length], 453, 374, 9, G.iron, 'center', { outline: false });
    txt(ctx, sv.name, 536, 218, 16, G.ink, 'left', { outline: false, serif: true }); txt(ctx, (sv.age ? sv.age + ', ' : '') + sv.role, 536, 236, 10, G.iron, 'left', { outline: false });
    let y = 254; y += txtWrap(ctx, sv.bio, 536, y, 384, 10.5, G.coal, { outline: false, normal: true }) + 8;
    [['Skill', sv.skill], ['Trait', sv.trait], ['Flaw', sv.flaw], ['Tool', sv.tool]].forEach(r => { txt(ctx, r[0], 536, y, 10, G.ink, 'left', { outline: false }); y += txtWrap(ctx, r[1], 580, y, 340, 10, G.coal, { outline: false, normal: true }) + 3; });
    const names = { spd: 'Speed', str: 'Strength', stl: 'Stealth', luck: 'Luck', cook: 'Cooking', med: 'Medicine', res: 'Resilience', noise: 'Noise' }; let i = 0;
    for (const k in names) { const bx = 388 + (i % 4) * 138, by = 404 + Math.floor(i / 4) * 44; txt(ctx, names[k], bx, by, 10, G.ink, 'left', { outline: false }); for (let j = 0; j < 5; j++) { ctx.fillStyle = j < sv.st[k] ? G.ink : G.pewter; ctx.fillRect(bx + j * 22, by + 6, 19, 9); } i++; }
    txt(ctx, 'Group: ' + d.group.map(id => SURVIVORS[id].short).join(', '), 388, 500, 10, G.iron, 'left', { outline: false });
    this.menu.render(ctx); Render.post(ctx, {});
  }
}

class WardrobeScene {
  enter() {
    this.t = 0; const d = Save.data; this.who = d.group[0] || 'marta'; this.pre = {}; for (const id of SURV_ORDER) { const s = new Survivor(id); s.morale = 80; s.variant = d.equip.variant[id] || 0; this.pre[id] = s; }
    const buy = (list, id, cost) => { if (list.indexOf(id) >= 0) return true; if (d.embers >= cost) { d.embers -= cost; list.push(id); Snd.sfx('unlock'); Save.write(); return true; } Game.toast('Not enough Embers', 'This costs ' + cost + '.', 'warn'); return false; };
    const items = [{ type: 'choice', label: 'Dress', choices: SURV_ORDER.filter(id => id !== 'lamp' || d.unlocks.lamp), get: () => this.who, set: v => { this.who = v; }, fmt: v => SURVIVORS[v].short }, { type: 'head', label: 'CLOTHING AND KEEPSAKES' }];
    for (const id in CLOTHES) { const c = CLOTHES[id]; items.push({ label: c.n, right: () => (d.equip.clothes[this.who] === id ? 'wearing' : d.unlocks.clothes.indexOf(id) >= 0 ? 'owned' : c.cost + ' Embers'), sub: c.d, act: () => { if (buy(d.unlocks.clothes, id, c.cost)) { d.equip.clothes[this.who] = d.equip.clothes[this.who] === id ? null : id; Save.write(); } } }); }
    items.push({ type: 'head', label: 'SHELTER' });
    for (const id in SKINS) { const k = SKINS[id]; items.push({ label: k.n, right: () => (d.equip.skin === id ? 'in use' : d.unlocks.skins.indexOf(id) >= 0 ? 'owned' : k.cost + ' Embers'), sub: 'A different wallpaper and mood for the cutaway home.', act: () => { if (buy(d.unlocks.skins, id, k.cost)) { d.equip.skin = id; Save.write(); } } }); }
    items.push({ type: 'head', label: 'STARTING PERKS (two at most)' });
    for (const id in PERKS) { const k = PERKS[id]; items.push({ label: k.n, right: () => (d.equip.perks.indexOf(id) >= 0 ? 'active' : d.unlocks.perks.indexOf(id) >= 0 ? 'owned' : k.cost + ' Embers'), sub: k.d, act: () => { if (buy(d.unlocks.perks, id, k.cost)) { const i = d.equip.perks.indexOf(id); if (i >= 0) d.equip.perks.splice(i, 1); else if (d.equip.perks.length < 2) d.equip.perks.push(id); else Game.toast('Two perks at most', '', 'warn'); Save.write(); } } }); }
    this.menu = new Menu({ x: 24, y: 24, w: 420, key: 'wardrobe', title: 'Wardrobe', maxRows: 13, rowH: 27, items, onBack: () => Game.go('Title', {}, 'tear') });
  }
  update(dt) { this.t += dt; this.menu.update(dt); Rig.update(this.pre[this.who], dt, this.t); }
  render(ctx) {
    const d = Save.data, pat = (SKINS[d.equip.skin] || SKINS.plain).pat; ctx.fillStyle = grey(26); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = grey(36); ctx.fillRect(470, 40, 460, 300); ctx.fillStyle = grey(46);
    if (pat === 0) for (let x = 478; x < 930; x += 15) ctx.fillRect(x, 40, 2, 300); else if (pat === 1) { for (let y = 50; y < 330; y += 14) for (let x = 476 + (y % 28 ? 6 : 14); x < 930; x += 18) ctx.fillRect(x, y, 2, 2); } else if (pat === 2) { for (let y = 46; y < 340; y += 12) for (let x = 470 + ((y / 12) % 2 ? 0 : 14); x < 926; x += 28) ctx.fillRect(x, y, 26, 1); } else if (pat === 3) { ctx.strokeStyle = grey(46); for (let x = 300; x < 930; x += 22) { ctx.beginPath(); ctx.moveTo(Math.max(470, x), 340); ctx.lineTo(Math.min(930, x + 300), 40); ctx.stroke(); } } else { for (let y = 56; y < 340; y += 20) { ctx.fillRect(470, y, 460, 2); for (let x = 476; x < 926; x += 9) ctx.fillRect(x, y - 12 + (x % 4), 5, 12 - (x % 4)); } }
    ctx.fillStyle = grey(66); ctx.fillRect(470, 320, 460, 20);
    const s = this.pre[this.who]; s.face = 1; Rig.draw(ctx, s, 700, 322, { scale: 4.2 });
    UI.paper(ctx, 470, 360, 460, 120, { seed: 61 }); txt(ctx, SURVIVORS[this.who].name, 490, 390, 15, G.ink, 'left', { outline: false, serif: true });
    const cl = d.equip.clothes[this.who]; txt(ctx, 'Wearing: ' + (cl ? CLOTHES[cl].n + '. ' + CLOTHES[cl].d : 'only what they came with.'), 490, 410, 10.5, G.coal, 'left', { outline: false, normal: true });
    txt(ctx, 'Shelter: ' + (SKINS[d.equip.skin] || SKINS.plain).n + '    Perks: ' + (d.equip.perks.map(p => PERKS[p].n).join(', ') || 'none'), 490, 430, 10.5, G.coal, 'left', { outline: false, normal: true });
    UI.icon(ctx, 'ember', 496, 456, 14, G.ink); txt(ctx, Save.data.embers + ' Embers', 510, 461, 13, G.ink, 'left', { outline: false });
    this.menu.render(ctx); Render.post(ctx, {});
  }
}

class ProfileScene {
  enter() { this.t = 0; this.menu = new Menu({ x: 30, y: 420, w: 300, key: 'profile', items: [{ label: 'Listening Room', sub: 'Every tune you have heard so far.', act: () => Game.go('Listen', {}, 'tear') }, { label: 'Credits', act: () => Game.go('Credits', { next: () => Game.go('Profile', {}, 'tear') }, 'flicker') }], onBack: () => Game.go('Title', {}, 'tear') }); }
  update(dt) { this.t += dt; this.menu.update(dt); }
  render(ctx) {
    const d = Save.data, st = d.stats; Render.backdrop(ctx, 300 + this.t * 3, true, {});
    UI.paper(ctx, 30, 24, 300, 380, { seed: 71, rot: -0.005 }); txt(ctx, 'Profile', 50, 58, 18, G.ink, 'left', { outline: false, serif: true });
    const rows = [['Runs begun', st.runs], ['Ceasefires reached', st.wins], ['Dawns seen', st.days], ['Nights out', st.nights], ['Kindnesses', st.kind], ['Close calls', st.close], ['Times spotted', st.spotted], ['Embers', d.embers], ['Story, furthest day', d.storyBest]];
    rows.forEach((r, i) => { txt(ctx, r[0], 50, 84 + i * 17, 11, G.coal, 'left', { outline: false, normal: true }); txt(ctx, String(r[1]), 310, 84 + i * 17, 11, G.ink, 'right', { outline: false }); });
    txt(ctx, 'Best scores', 50, 250, 13, G.ink, 'left', { outline: false, serif: true }); let n = 0;
    for (const m of MODES) if (d.scores[m.id] != null && n < 7) { txt(ctx, m.n, 50, 268 + n * 15, 10, G.coal, 'left', { outline: false, normal: true }); txt(ctx, String(d.scores[m.id]), 310, 268 + n * 15, 10, G.ink, 'right', { outline: false }); n++; }
    if (!n) txt(ctx, 'Nothing yet. The winter is young.', 50, 268, 10, G.iron, 'left', { outline: false, normal: true });
    UI.paper(ctx, 350, 24, 580, 250, { seed: 72, rot: 0.004 }); txt(ctx, 'Keepsakes', 370, 58, 18, G.ink, 'left', { outline: false, serif: true });
    Object.keys(ACH).forEach((id, i) => { const got = !!d.ach[id], x = 366 + (i % 5) * 112, y = 80 + Math.floor(i / 5) * 29; UI.icon(ctx, 'star', x + 6, y, 10, got ? G.ink : G.pewter); txt(ctx, got ? ACH[id].n : '? ? ?', x + 18, y + 3, 9, got ? G.ink : G.dust, 'left', { outline: false }); if (got) txt(ctx, ACH[id].d.slice(0, 21), x + 18, y + 13, 7, G.iron, 'left', { outline: false, normal: true }); });
    UI.paper(ctx, 350, 290, 580, 216, { seed: 73 }); txt(ctx, 'Daily Winter board', 370, 320, 14, G.ink, 'left', { outline: false, serif: true });
    const days = Object.keys(d.daily).sort((a, b) => d.daily[b].score - d.daily[a].score).slice(0, 5);
    if (!days.length) txt(ctx, 'No daily runs yet.', 370, 340, 10, G.iron, 'left', { outline: false, normal: true });
    days.forEach((k, i) => txt(ctx, (i + 1) + '.  ' + k + '    ' + d.daily[k].days + ' days    ' + d.daily[k].score, 370, 340 + i * 15, 10, G.coal, 'left', { outline: false, normal: true }));
    txt(ctx, 'Memory album  ' + d.album.length + '/9', 650, 320, 14, G.ink, 'left', { outline: false, serif: true });
    if (d.album.length) txtWrap(ctx, KEEPSAKES[d.album[Math.floor(this.t / 4) % d.album.length]], 650, 340, 262, 10, G.coal, { outline: false, normal: true }); else txt(ctx, 'Empty. Try Keepsake Hunt.', 650, 340, 10, G.iron, 'left', { outline: false, normal: true });
    this.menu.render(ctx); Render.post(ctx, {});
  }
}

/* Settings: every option persists. Used as a scene from the title and as an overlay from pause. */
function settingsItems() {
  const s = Save.s, sv = () => { Save.write(); Snd.applyVol(); };
  const tg = (label, key, sub, after) => ({ type: 'toggle', label, get: () => !!s[key], set: v => { s[key] = v; sv(); if (after) after(); }, sub });
  return [
    { type: 'slider', label: 'Music volume', get: () => s.music, set: v => { s.music = v; sv(); } }, { type: 'slider', label: 'Sound volume', get: () => s.sfx, set: v => { s.sfx = v; sv(); Snd.sfx('pickup'); } },
    tg('Mute (M)', 'mute'), { type: 'head', label: 'COMFORT AND ACCESSIBILITY' },
    tg('Reduce Intensity', 'reduce', 'Less screen shake, flashing, zoom and tension audio. Nothing is removed.'), tg('Gentle Story', 'gentle', 'Nobody is lost for good. They leave, and return with news. Applies to new runs.'),
    tg('Glowing outlines', 'outlines', 'A soft white glow around enemies, obstacles and hazards, so they read in the dark.'), tg('Unsettling shadows', 'shadows', 'Shapes at the edge of the light. Only scenery: they never hurt or chase you.'), tg('High contrast', 'contrast', 'Starker panels and outlined attention cones.'), tg('Colorblind-safe indicators', 'colorblind', 'Adds tick patterns, outlines and name tags. Nothing relies on color alone.'),
    { type: 'slider', label: 'Text size', min: 0.85, max: 1.3, step: 0.05, get: () => s.text, set: v => { s.text = v; sv(); } }, tg('Subtitles and diary text', 'subtitles', 'Spoken and narrated lines shown as text.'),
    tg('Hold-to-toggle', 'holdToggle', 'Crouch toggles, and held actions (searching, cranking) continue without holding.'), tg('Auto-interact when near', 'autoInteract', 'Stand still beside a cabinet and the search starts by itself.'),
    { type: 'head', label: 'SCREEN FILTERS' }, ...filterItems(),
    { type: 'head', label: 'PERFORMANCE' }, { type: 'choice', label: 'Quality', choices: ['high', 'medium', 'low'], get: () => s.quality, set: v => { s.quality = v; sv(); Render.resize(); }, fmt: v => v[0].toUpperCase() + v.slice(1), sub: 'Also steps down by itself if the frame rate drops.' }, tg('Low-FX', 'lowfx', 'Fewer particles, no grain or fog, cheaper lighting.', () => Render.resize()),
    { type: 'head', label: 'CONTROLS' }, tg('Controller rumble', 'rumble'), tg('Touch haptics', 'haptics'),
    { type: 'slider', label: 'Touch button size', min: 0.7, max: 1.5, step: 0.1, get: () => s.btnSize, set: v => { s.btnSize = v; sv(); Input.layoutTouch(); } }, { type: 'slider', label: 'Touch button opacity', min: 0.2, max: 1, step: 0.1, get: () => s.btnOpacity, set: v => { s.btnOpacity = v; sv(); } },
    { label: 'Remap keyboard controls', act: () => Game.push(remapOverlay()) }, { label: 'Go Fullscreen', hidden: () => !fsAvailable(), act: goFullscreen },
    { type: 'head', label: 'SAVE DATA (CARRY YOUR GAME TO ANOTHER BROWSER)' },
    { label: 'Save all to a file', sub: 'Downloads one file with everything: settings, unlocks, keepsakes, saved runs, scores and Long Walk progress.', act: () => SaveIO.exportAll() },
    { label: 'Import all from a file', sub: 'Pick a save file made with "Save all". It replaces the progress in this browser.', act: () => SaveIO.importAll() },
    { label: 'Import from the clipboard', sub: '"Save all" also copies the save as text. Paste it here on another browser.', act: () => SaveIO.fromClipboard() },
    { label: 'Erase all saved data', sub: 'Unlocks, keepsakes, the story so far. Press twice.', act: it => { if (it.armed) { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* no storage */ } Save.load(); Game.toast('Saved data erased', '', 'warn'); Game.ov.length = 0; Game.go('Title', {}, 'flicker'); } else { it.armed = true; Game.toast('Press again to erase everything', '', 'warn'); } } }
  ];
}
function settingsOverlay() { return menuOverlay({ title: 'Settings', key: 'settings', w: 470, y: 30, maxRows: 14, rowH: 27, items: settingsItems(), onBack: () => Game.pop() }); }
function remapOverlay() {
  const s = Save.s; let waiting = '';
  const items = ACTIONS.map(a => ({ label: ACTION_NAMES[a], right: () => (waiting === a ? 'press a key...' : (s.keys[a] || []).join(' / ').replace(/Key|Arrow|Digit/g, '')), act: () => { waiting = a; Input.capture = code => { if (code !== 'Escape') { s.keys[a] = [code]; Save.write(); } waiting = ''; }; } }));
  items.push({ label: 'Reset to defaults', act: () => { s.keys = JSON.parse(JSON.stringify(KEY_DEFAULT)); Save.write(); } });
  return menuOverlay({ title: 'Keyboard controls', key: 'remap', w: 420, y: 40, maxRows: 14, items, onBack: () => { Input.capture = null; Game.pop(); } });
}
class SettingsScene {
  enter() { this.t = 0; this.menu = new Menu({ x: W / 2 - 235, y: 30, w: 470, key: 'settings', title: 'Settings', maxRows: 14, rowH: 27, items: settingsItems(), onBack: () => Game.go('Title', {}, 'blinds') }); }
  update(dt) { this.t += dt; this.menu.update(dt); }
  render(ctx) { Render.backdrop(ctx, 500 + this.t * 3, true, {}); this.menu.render(ctx); Render.post(ctx, {}); }
}

/* Comic-panel cutscenes: illustrated grey panels, colored people, typewriter text.
   1.2: nothing advances on its own. Confirm finishes the line, then turns the page;
   Left goes back a panel; Esc / B skips the whole scene. */
class CutsceneScene {
  enter(p) { this.p = p; this.i = 0; this.st = { n: 0 }; this.t = 0; this.total = 0; this.tt = 9; this.prevI = -1; this.act = {}; Snd.duck(2); Snd.setTrack(p.track || 'menu'); }
  finish() { if (this.done) return; this.done = true; this.p.next(); }
  turn(d) {
    const sc = this.p.script, ni = this.i + d; if (ni < 0) return;
    if (ni >= sc.length) { this.finish(); return; }
    this.prevI = this.i; this.i = ni; this.tt = 0; this.t = 0; this.st = { n: d < 0 ? sc[ni][1].length : 0 }; Snd.sfx('page');
  }
  update(dt) {
    if (this.done) return; this.t += dt; this.total += dt; this.tt += dt; const sc = this.p.script, line = sc[this.i][1], M = Input.menu;
    if (this.tt > 0.3) typeOut(this.st, line, dt, 34);
    for (const k in this.act) Rig.update(this.act[k], dt, this.t);
    if (M.back || M.pauseBtn) { this.finish(); return; }
    if (M.left && this.i > 0 && this.total > 0.3) { this.turn(-1); return; }
    if ((M.ok || M.right || Input.ptr.click) && this.total > 0.3) { if (this.st.n < line.length) this.st.n = line.length; else this.turn(1); }
  }
  panel(ctx, i, out, k) {
    const sc = this.p.script, who = sc[i][0], line = sc[i][1], key = sc[i][2] || (who === 'narr' ? '' : 'landing'), cur = i === this.i && !out;
    const tp = cur ? this.t : 3 + this.tt, dir = this.prevI > this.i ? -1 : 1;
    ctx.save(); ctx.translate(W / 2, 270);
    if (out) { ctx.translate(-dir * k * 160, k * 14); ctx.rotate(-dir * k * 0.06); ctx.globalAlpha = 1 - k; }
    else { const e = Ease.outBack(k); ctx.translate(dir * (1 - k) * 180, 0); ctx.rotate(dir * (1 - k) * 0.05); ctx.scale(0.94 + 0.06 * e, 0.94 + 0.06 * e); ctx.globalAlpha = clamp(k * 1.6, 0, 1); }
    ctx.rotate((i % 2 ? 1 : -1) * 0.008);
    ctx.fillStyle = grey(0, 0.35); ctx.fillRect(-344, -160, 700, 352);
    UI.paper(ctx, -350, -170, 700, 340, { seed: 80 + i });
    ctx.save(); ctx.beginPath(); ctx.rect(-334, -154, 668, 230); ctx.clip();
    const kb = Save.s.reduce ? 1 : 1 + Math.min(0.05, tp * 0.005); ctx.translate(Save.s.reduce ? 0 : -Math.min(tp * 1.4, 24), 0); ctx.scale(kb, kb);
    if (CUT_ART[key]) CUT_ART[key](ctx, tp, i);
    else { ctx.translate(-480, -270 + 20); Render.backdrop(ctx, 300 + i * 180 + tp * 6, true, { noWindow: true }); ctx.fillStyle = grey(16); ctx.fillRect(420 + (i * 60) % 200, 150, 150, 240); ctx.fillStyle = grey(170); ctx.fillRect(470 + (i * 60) % 200, 210, 22, 26); }
    ctx.restore();
    if (who !== 'narr') {
      ctx.save(); ctx.beginPath(); ctx.rect(-334, -154, 668, 230); ctx.clip();
      const s = this.act[who] || (this.act[who] = Object.assign(new Survivor(who), { morale: 74 })), wk = Save.s.reduce ? 1 : clamp(tp / 0.8, 0, 1);
      s.special = cur && this.st.n < line.length && wk >= 1 ? 'gesture' : ''; s.face = 1; s.vx = wk < 1 ? 70 : 0; s.anim = wk < 1 ? 'walk' : s.anim; if (wk < 1) s.ph = tp * 9;
      Rig.draw(ctx, s, -290 + 140 * Ease.outCubic(wk), 56, { scale: 4 });
      ctx.restore();
    }
    const shown = cur ? line.slice(0, this.st.n) : line, done = !cur || this.st.n >= line.length, bob = Save.s.reduce ? 0 : Math.abs(Math.sin(this.total * 4)) * 4;
    if (who === 'narr') {
      ctx.fillStyle = G.bone; ctx.fillRect(-320, 88, 640, 70); ctx.strokeStyle = G.ink; ctx.lineWidth = 1.5; ctx.strokeRect(-320, 88, 640, 70);
      txtWrap(ctx, shown, -306, 110, 600, 13, G.ink, { outline: false, serif: true, normal: true, lh: 1.35 });
      if (cur && done) { ctx.fillStyle = G.ink; ctx.beginPath(); ctx.moveTo(296, 140 + bob); ctx.lineTo(310, 140 + bob); ctx.lineTo(303, 148 + bob); ctx.fill(); }
    } else {
      ctx.fillStyle = grey(0, 0.25); rrect(ctx, -56, -136, 380, 118, 14); ctx.fill();
      ctx.fillStyle = G.bone; rrect(ctx, -60, -140, 380, 118, 14); ctx.fill(); ctx.strokeStyle = G.ink; ctx.lineWidth = 1.5; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-40, -70); ctx.lineTo(-84, -40); ctx.lineTo(-44, -50); ctx.fillStyle = G.bone; ctx.fill();
      const sv = SURVIVORS[who]; ctx.fillStyle = hsl(sv.hue, 1, 0); ctx.fillRect(-44, -128, 4, 12);
      txt(ctx, sv.short, -36, -118, 10, G.iron, 'left', { outline: false }); txtWrap(ctx, shown, -44, -98, 348, 13, G.ink, { outline: false });
      if (cur && done) { ctx.fillStyle = G.ink; ctx.beginPath(); ctx.moveTo(292, -40 + bob); ctx.lineTo(306, -40 + bob); ctx.lineTo(299, -32 + bob); ctx.fill(); }
    }
    ctx.restore();
  }
  render(ctx) {
    const sc = this.p.script, line = sc[this.i][1], tk = Save.s.reduce ? 1 : Ease.outCubic(clamp(this.total / 0.9, 0, 1));
    ctx.fillStyle = G.ink; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, 270, 60, W / 2, 270, 560); g.addColorStop(0, grey(40)); g.addColorStop(1, grey(6)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (!Save.s.reduce) for (let k = 0; k < 40; k++) { const y = ((PH(k, 7) * H + this.total * (8 + PH(k, 8) * 14)) % H), x = PH(k, 9) * W + Math.sin(this.total * 0.7 + k) * 10; ctx.fillStyle = grey(200, 0.08 + PH(k, 3) * 0.12); ctx.fillRect(x, y, 1.6, 1.6); }
    ctx.save(); ctx.beginPath(); ctx.rect(W / 2 - 300 * tk, 30, 600 * tk, 36); ctx.clip(); txt(ctx, this.p.title || '', W / 2, 54, 20, G.bone, 'center', { serif: true, rot: -0.01 }); ctx.restore();
    ctx.fillStyle = grey(150, 0.6); ctx.fillRect(W / 2 - 110 * tk, 66, 220 * tk, 1.5);
    if (this.prevI >= 0 && this.tt < 0.45) this.panel(ctx, this.prevI, true, Ease.inCubic(clamp(this.tt / 0.45, 0, 1)));
    this.panel(ctx, this.i, false, this.tt < 0.45 ? Ease.outCubic(clamp(this.tt / 0.45, 0, 1)) : 1);
    for (let i = 0; i < sc.length; i++) { ctx.fillStyle = i === this.i ? G.bone : i < this.i ? G.ash : G.iron; ctx.fillRect(W / 2 - sc.length * 9 + i * 18, 470, 12, i === this.i ? 5 : 3); }
    const ready = this.st.n >= line.length;
    ctx.globalAlpha = ready ? 1 : 0.45; UI.prompt(ctx, 'interact', this.i === sc.length - 1 ? 'Continue' : 'Next page', W / 2 - 150, 506); ctx.globalAlpha = 1;
    txt(ctx, (this.i > 0 ? 'Left: back   ' : '') + 'Esc / B: skip', W / 2 + 40, 506, 10, G.fog, 'left', { normal: true });
    Render.post(ctx, {}); Polish.letterbox(ctx, this.total / 0.6);
  }
}

/* Dawn: what the night did, the diary, small awards, and one press to carry on. */
class DawnReportScene {
  enter(p) {
    this.rep = p.rep; this.t = 0; this.st = { n: 0 }; this.run = Game.run; this.tip = tipOfTheDay(); Snd.setTrack('homeDay'); Snd.tension = 0; Snd.amb.wind = 0.2; Snd.duck(4); Parts.clear();
    const ended = this.run.ended;
    this.menu = new Menu({ x: 610, y: 396, w: 320, key: '', bare: false, noSub: true, items: ended ? [{ label: ended === 'win' ? 'The guns are quiet...' : 'The landing is quiet...', act: () => Flow.afterDawn() }] : [
      { label: 'Continue', act: () => Flow.afterDawn() }, { label: 'Change Plan', act: () => Flow.afterDawn(true) }, { label: 'Menu', act: () => Game.go('Title', {}, 'flicker') }] });
    for (const a of this.rep.awards) { a.s.resetRuntime(); a.s.special = 'comforted'; }
  }
  update(dt) { this.t += dt; if (this.t > 0.9) typeOut(this.st, this.rep.diary, dt, 34); for (const a of this.rep.awards) Rig.update(a.s, dt, this.t); this.menu.update(dt); }
  render(ctx) {
    const rep = this.rep, run = this.run, t = this.t; Render.backdrop(ctx, 200 + t * 5, false, {});
    UI.paper(ctx, 30, 24, 560, 492, { seed: 90, rot: -0.004 });
    const flip = clamp((t - 0.2) / 0.5, 0, 1), dn = flip < 0.5 ? rep.day : rep.day + 1;
    ctx.save(); ctx.translate(540, 62); ctx.scale(1, Math.abs(Math.cos(flip * Math.PI))); ctx.fillStyle = G.bone; ctx.fillRect(-24, -26, 48, 52); ctx.strokeStyle = G.ink; ctx.lineWidth = 1.5; ctx.strokeRect(-24, -26, 48, 52); ctx.fillStyle = G.iron; ctx.fillRect(-24, -26, 48, 12); txt(ctx, 'DAY', 0, -17, 7, G.bone, 'center', { outline: false, fixed: true }); txt(ctx, String(dn), 0, 18, 24, G.ink, 'center', { outline: false, serif: true, fixed: true }); ctx.restore();
    txt(ctx, 'Dawn', 54, 62, 22, G.ink, 'left', { outline: false, serif: true }); txt(ctx, CFG.phases[rep.phase] + (run.ceasefire && run.flags.rumor && !run.ended ? '   ' + Math.max(0, run.ceasefire - run.day + 1) + ' days to the ceasefire' : ''), 54, 80, 10, G.iron, 'left', { outline: false });
    let y = 104;
    rep.lines.slice(0, 9).forEach((l, i) => { const k = clamp((t - 0.3 - i * 0.18) / 0.3, 0, 1); if (k <= 0) return; ctx.globalAlpha = k; const warn = /^WARNING/.test(l); if (warn) UI.icon(ctx, 'warn', 60, y - 3, 11, G.ink); y += txtWrap(ctx, l, warn ? 72 : 54, y, warn ? 490 : 508, 10.5, G.coal, { outline: false, normal: !warn, lh: 1.3 }) + 4; ctx.globalAlpha = 1; });
    const lk = Object.keys(rep.loot); if (lk.length) { y += 2; txt(ctx, 'Brought home:', 54, y, 10, G.ink, 'left', { outline: false }); y += 4; y += txtWrap(ctx, lk.map(k => rep.loot[k] + ' ' + ITEMS[k].n).join(',  '), 54, y + 10, 508, 10, G.coal, { outline: false, normal: true }) + 14; }
    y = Math.max(y + 4, 330);
    ctx.strokeStyle = G.ash; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(54, y - 10); ctx.lineTo(566, y - 10); ctx.stroke(); ctx.setLineDash([]);
    txt(ctx, 'From the diary', 54, y + 6, 10, G.iron, 'left', { outline: false }); txtWrap(ctx, rep.diary.slice(0, this.st.n), 54, y + 26, 500, 13, G.ink, { outline: false, serif: true, normal: true, lh: 1.4 });
    rep.awards.slice(0, 5).forEach((a, i) => { const x = 70 + i * 104, yy = 482; a.s.face = 1; Rig.draw(ctx, a.s, x, yy, { scale: 1.1 }); txt(ctx, a.a, x + 14, yy - 22, 7.5, G.iron, 'left', { outline: false, normal: true }); txt(ctx, a.s.name, x + 14, yy - 8, 9, G.ink, 'left', { outline: false }); });
    UI.paper(ctx, 610, 24, 320, 356, { seed: 91, rot: 0.005 }); txt(ctx, 'The landing this morning', 630, 54, 14, G.ink, 'left', { outline: false, serif: true });
    run.surv.forEach((s, i) => { const cy = 80 + i * 44; txt(ctx, s.name + (s.gone ? ' (gone)' : s.away ? ' (away)' : ''), 630, cy, 11, G.ink, 'left', { outline: false }); if (!s.present) return; ['hunger', 'fatigue', 'cold', 'health', 'morale'].forEach((n, j) => { UI.icon(ctx, n, 634 + j * 56, cy + 14, 8, G.coal); UI.bar(ctx, 642 + j * 56, cy + 11, 36, 5, s[n], { col: G.iron }); }); const stt = s.statuses(); if (stt.length) txt(ctx, stt.join(', '), 630, cy + 30, 8.5, G.iron, 'left', { outline: false, normal: true }); });
    txt(ctx, 'Food ' + Run.food(run) + '   Water ' + Run.count(run, 'water') + '   Fuel ' + Run.count(run, 'fuel') + '   Wood ' + Run.count(run, 'wood'), 630, 322, 10, G.coal, 'left', { outline: false });
    UI.icon(ctx, 'ember', 636, 346, 12, G.ink); txt(ctx, '+' + rep.embers + ' Embers', 648, 350, 11, G.ink, 'left', { outline: false });
    if (SAVEABLE[run.mode] && !run.ended) { ctx.save(); ctx.translate(880, 346); ctx.rotate(-0.12); ctx.strokeStyle = G.iron; ctx.lineWidth = 1.5; ctx.strokeRect(-30, -11, 60, 20); txt(ctx, 'SAVED', 0, 4, 11, G.iron, 'center', { outline: false, fixed: true }); ctx.restore(); }
    this.menu.render(ctx); drawTip(ctx, this.tip, H - 8); Render.post(ctx, {});
  }
}

class ResultsScene {
  enter(o) {
    this.o = o; this.t = 0; this.tip = tipOfTheDay(); Snd.setTrack(o.win ? 'ending' : 'defeat'); Snd.tension = 0; Snd.sting(o.win ? 'good' : 'bad'); Parts.clear(); Floaters.clear();
    this.surv = (o.surv || []).filter(s => !s.gone); for (const s of this.surv) { s.resetRuntime(); s.special = o.win ? 'victory' : 'defeat'; s.away = 0; }
    this.menu = new Menu({ x: 40, y: 400, w: 300, key: '', noSub: true, items: [{ label: 'Play again', act: () => Flow.again() }, { label: 'Menu', act: () => Game.go('Title', {}, 'flicker') }] });
  }
  update(dt) { this.t += dt; for (const s of this.surv) Rig.update(s, dt, this.t); this.menu.update(dt); if (this.o.win) menuWeather(dt * 0.4); }
  render(ctx) {
    const o = this.o, t = this.t; Render.backdrop(ctx, 300 + t * 4, !o.win, {});
    UI.paper(ctx, 40, 30, 500, 350, { seed: 95, rot: -0.005 });
    txt(ctx, o.title || 'Results', 64, 70, 22, G.ink, 'left', { outline: false, serif: true });
    ctx.save(); ctx.translate(470, 64); ctx.rotate(0.1); ctx.strokeStyle = G.iron; ctx.lineWidth = 2; ctx.strokeRect(-52, -14, 104, 26); txt(ctx, o.win ? 'CAME THROUGH' : 'NOT THIS TIME', 0, 4, 10, G.iron, 'center', { outline: false, fixed: true }); ctx.restore();
    let y = 102; (o.lines || []).forEach((l, i) => { ctx.globalAlpha = clamp((t - 0.2 - i * 0.15) / 0.3, 0, 1); y += txtWrap(ctx, l, 64, y, 450, 12, G.coal, { outline: false, normal: true }) + 5; ctx.globalAlpha = 1; });
    if (o.score != null) { y += 10; txt(ctx, 'Score  ' + o.score + (o.best ? '   new best' : ''), 64, y, 15, G.ink, 'left', { outline: false }); y += 22; }
    if (o.embers) { UI.icon(ctx, 'ember', 70, y - 4, 12, G.ink); txt(ctx, '+' + o.embers + ' Embers', 84, y, 11, G.ink, 'left', { outline: false }); y += 20; }
    (o.points || []).slice(0, 4).forEach((p, i) => { ctx.save(); ctx.translate(120 + i * 150 - (i > 2 ? 450 : 0), y + 8 + (i > 2 ? 26 : 0)); ctx.rotate((i % 2 ? 1 : -1) * 0.04); ctx.fillStyle = G.ink; ctx.fillRect(-60, -11, 124, 20); txt(ctx, p, 2, 3, 8.5, G.bone, 'center', { outline: false, fixed: true }); ctx.restore(); });
    if (o.replay) Render.replay(ctx, o.replay, t, 570, 40, 350, 210);
    else { UI.paper(ctx, 570, 40, 350, 210, { seed: 96, dark: true }); txtWrap(ctx, o.win ? 'A quiet night, well kept. Nothing happened that needs remembering twice.' : 'Some nights are only for getting through.', 592, 130, 306, 12, G.paper, { outline: false, normal: true }); }
    this.surv.forEach((s, i) => { s.face = i % 2 ? -1 : 1; Rig.draw(ctx, s, 600 + i * 70, 470, { scale: 2 }); });
    if (o.win && this.surv.length > 1 && t > 1) txt(ctx, 'a cup of tea, passed along', 600 + (this.surv.length - 1) * 35, 494, 10, G.paper, 'center', { normal: true });
    this.menu.render(ctx); drawTip(ctx, this.tip, H - 10); Render.post(ctx, {});
  }
}

class EndingScene {
  enter(p) { this.p = p; this.t = 0; this.st = { n: 0 }; const e = ENDINGS[p.ending]; this.e = e; Snd.setTrack(p.win ? 'ending' : 'defeat'); Snd.duck(3); Snd.sting(p.win ? 'dawn' : 'bad'); Parts.clear();
    this.surv = Game.run ? Game.run.surv.filter(s => !s.gone) : []; for (const s of this.surv) { s.resetRuntime(); s.special = p.win ? 'victory' : 'defeat'; s.morale = p.win ? Math.max(s.morale, 80) : s.morale; } }
  update(dt) { this.t += dt; if (this.t > 1) typeOut(this.st, this.e.d, dt, 30); for (const s of this.surv) Rig.update(s, dt, this.t);
    if (this.t > 1.5 && (Input.menu.ok || Input.ptr.click || Input.menu.back)) { if (this.st.n < this.e.d.length) this.st.n = this.e.d.length; else if (!this.done) { this.done = true; if (this.p.win && Game.run && Game.run.surv.length) Game.go('After', { next: this.p.next }, 'blinds'); else this.p.next(); } } }
  render(ctx) {
    const t = this.t, every = this.p.ending === 'everyone';
    Render.building(ctx, t, { x: 330, dawn: this.p.win, color: every && t > 2.5, group: this.surv.map(s => s.id) });
    if (this.p.win) this.surv.forEach((s, i) => { s.face = i % 2 ? -1 : 1; Rig.draw(ctx, s, 80 + i * 46, 516, { scale: 1.5 }); });
    else { ctx.fillStyle = grey(200); ctx.fillRect(150, 496, 6, 20); const g = ctx.createRadialGradient(153, 490, 0, 153, 490, 40); g.addColorStop(0, 'hsla(46,95%,62%,' + (0.25 * Math.max(0, 1 - t / 8)) + ')'); g.addColorStop(1, 'hsla(46,95%,62%,0)'); ctx.fillStyle = g; ctx.fillRect(110, 450, 86, 80); }
    const k = Ease.outCubic(clamp(t / 0.8, 0, 1)); ctx.globalAlpha = k; UI.paper(ctx, 650, 120, 280, 270, { seed: 99, rot: 0.01 });
    txt(ctx, this.e.t, 670, 158, 19, G.ink, 'left', { outline: false, serif: true }); txtWrap(ctx, this.e.d.slice(0, this.st.n), 670, 186, 244, 12, G.coal, { outline: false, serif: true, normal: true, lh: 1.45 }); ctx.globalAlpha = 1;
    if (this.st.n >= this.e.d.length) UI.prompt(ctx, 'interact', 'Continue', 790, 420);
    Render.post(ctx, {});
  }
}

const CREDITS = ['JORJ', 'presents', '', 'ASHEN WINDOWS', '', 'a quiet winter in Greywater', '', 'Everything here is drawn and sounded in code:', 'the city, the people, the music box.', '', 'The survivors', 'Marta, Dov, Ines, Toby, Granny Beatrix,', 'Ravi, Yara, Pavel, and one Lamplighter', '', 'Also appearing', 'Mr. Halloran of 5B (weather)', 'the neighbor from 6A', 'a grey cat (unpaid)', 'a mouse (signage)', '', 'No dogs, cats, pigeons or mice were harmed.', 'The Grey Coats, the Magpies and the long guns are invented.', 'No real places, people or conflicts are depicted.', '', 'For everyone who kept a small light going', 'for somebody else.', '', 'Release ' + VERSION, 'Free to play in any browser, offline too.'];
class CreditsScene {
  enter(p) { this.p = p; this.t = 0; Snd.setTrack('ending'); Snd.tension = 0; }
  update(dt) { this.t += dt; if (!this.done && this.t > 0.6 && (Input.menu.ok || Input.menu.back || Input.ptr.click)) { this.done = true; this.p.next(); } }   // 1.2: waits for the player at the end
  render(ctx) {
    Render.building(ctx, this.t, { x: 80, dawn: true, color: true });
    ctx.fillStyle = grey(0, 0.45); ctx.fillRect(470, 0, 440, H);
    CREDITS.forEach((l, i) => { const y = H + 20 + i * 26 - this.t * 26; if (y < -20 || y > H + 20) return; txt(ctx, l, 690, y, i === 0 ? 22 : 12, G.bone, 'center', { serif: i === 0, normal: i !== 0 && l !== 'The survivors' && l !== 'Also appearing' }); });
    const end = this.t > CREDITS.length * 1.05 + 4; if (end) { ctx.globalAlpha = clamp((this.t - CREDITS.length * 1.05 - 4) / 1, 0, 1); txt(ctx, 'The end. Thank you for keeping the candle lit.', 690, H / 2, 14, G.bone, 'center', { serif: true }); ctx.globalAlpha = 1; } UI.prompt(ctx, 'interact', end ? 'Continue' : 'Skip', 880, 520); V12.creditsFx(ctx, this.t); Render.post(ctx, {});
  }
}

class InterludeScene {
  enter(p) { this.p = p; this.t = 0; this.tip = tipOfTheDay(); Snd.setTrack('menu'); Snd.tension = 0; this.menu = new Menu({ x: W / 2 - 180, y: 300, w: 360, key: '', noSub: true, items: p.opts.map(o => ({ label: o.l, act: o.fn })) }); }
  update(dt) { this.t += dt; menuWeather(dt); this.menu.update(dt); }
  render(ctx) { Render.backdrop(ctx, 300 + this.t * 6, true, {}); UI.paper(ctx, W / 2 - 240, 90, 480, 180, { seed: 97, rot: -0.006 }); txt(ctx, this.p.title, W / 2, 138, 22, G.ink, 'center', { outline: false, serif: true }); (this.p.lines || []).forEach((l, i) => txt(ctx, l, W / 2, 174 + i * 22, 12, G.coal, 'center', { outline: false, normal: true })); this.menu.render(ctx); drawTip(ctx, this.tip, H - 20); Render.post(ctx, {}); }
}
