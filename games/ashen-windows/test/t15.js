// 1.4: screen filters, All Unlocked (any Long Walk level, any site and person, any chapter, any mode, any item), the slower speed, and the sprite overhaul.
const { open } = require('./lib');
(async () => {
  const T = await open();
  console.log('speed', JSON.stringify(await T.ev(() => { const C = window.__ashen.Game.cfg; return { walk: C.walk, sprint: Math.round(C.walk * C.runMul), timeScale: C.timeScale }; })));
  const log = await T.ev(() => { const L = window.__ashen.SPRITE_LOG(); return { n: L.length, blank: L.filter(e => !e[1] || e[1].length < 8).length, dupes: L.length - new Set(L.map(e => e[1])).size }; });
  console.log('sprites', JSON.stringify(log)); if (log.n !== 1000) console.error('sprite log has ' + log.n + ' entries, expected 1000');
  // the mode screen
  await T.ev(() => window.__ashen.Game.go('Unlocked', {})); await T.wait(900); await T.shot('unlocked');
  // a chest item, then a sortie anywhere with anyone
  console.log('sortie', JSON.stringify(await T.ev(() => { const A = window.__ashen, G = A.Game; G.push(A.itemPicker('chest')); G.pop(); const F = A.FREE.d(); F.chest = { firecracker: 3, bandage: 2 }; F.site = 'church'; F.who = 'lamp'; A.FREE.sortie(); return 1; })));
  await T.wait(2500);
  console.log('packed', JSON.stringify(await T.ev(() => { const G = window.__ashen.Game, w = G.scene.w; return { scene: G.name, free: !!G.run.free, who: w.surv.map(s => s.id), pack: w.pack.items }; })));
  // add any item from the pause menu
  console.log('picker', JSON.stringify(await T.ev(() => { const A = window.__ashen, G = A.Game, sc = G.scene; G.push(A.itemPicker('run', sc)); const ov = G.ov[G.ov.length - 1], m = ov.menu || ov.m; const it = m.vis().find(i => i.label === 'Pebbles'); if (it) it.act(); const r = { rows: m.vis().length, pebbles: sc.w.pack.items.pebble || 0 }; while (G.ov.length) G.pop(); return r; })));
  // every animation draws, for every person
  console.log('anims', JSON.stringify(await T.ev(() => { const A = window.__ashen, w = A.Game.scene.w, s = w.surv[0], bad = []; const L = ['idle', 'walk', 'run', 'sneak', 'climb', 'interact', 'sleep', 'sit', 'hide', 'crouch', 'carry', 'limp', 'coldwalk', 'trudge', 'skid', 'land', 'search', 'heave', 'turn', 'bored']; const keep = s.id; for (const id of Object.keys(A.SURVIVORS)) { s.id = id; s.d = A.SURVIVORS[id]; for (const a of L) { s.special = a; try { A.Rig.update(s, 0.05, 1); A.Rig.draw(A.Render.ctx || document.querySelector('canvas').getContext('2d'), s, 100, 100, {}); } catch (e) { bad.push(id + ':' + a + ':' + e.message); } } } s.id = keep; s.d = A.SURVIVORS[keep]; s.special = ''; return { checked: Object.keys(A.SURVIVORS).length * L.length, bad }; })));
  // a story chapter, a locked mode, a Long Walk level, none of them touching real progress
  console.log('story', JSON.stringify(await T.ev(() => { const A = window.__ashen, G = A.Game; while (G.ov.length) G.pop(); A.FREE.story(4); return { free: !!(G.run && G.run.free), chapterIndex: G.run && G.run.chapter }; })));
  await T.wait(1500); console.log('story scene', await T.ev(() => window.__ashen.Game.name));
  console.log('mode', JSON.stringify(await T.ev(() => { const A = window.__ashen, G = A.Game; while (G.ov.length) G.pop(); A.FREE.mode('census'); return { free: !!(G.run && G.run.free), mode: G.run && G.run.mode }; })));
  await T.wait(1500); console.log('mode scene', await T.ev(() => window.__ashen.Game.name));
  console.log('walk', JSON.stringify(await T.ev(() => { const A = window.__ashen, G = A.Game; while (G.ov.length) G.pop(); const before = (A.Save.data.walk || {}).un || 0; G.go('Walk', { lvl: 37, free: true }); return { before }; })));
  await T.wait(1500); console.log('walk scene', JSON.stringify(await T.ev(() => { const A = window.__ashen; return { scene: A.Game.name, level: A.Game.scene.i + 1, progressKept: (A.Save.data.walk || {}).un || 0 }; }))); await T.shot('walk37');
  // the screen filters: off by default, listed in the pause menu, and each one draws
  console.log('filters', JSON.stringify(await T.ev(() => { const A = window.__ashen, G = A.Game, s = A.Save.s, off = !s.fxBW && !s.fxGrain && !s.fxVHS; G.scene.openPause(); const ov = G.ov[G.ov.length - 1], m = ov.menu || ov.m, labels = m.vis().map(i => typeof i.label === 'function' ? i.label() : i.label); G.pop(); return { offByDefault: off, inPause: ['Black and white', 'Film grain', 'VHS effect'].every(l => labels.includes(l)) }; })));
  await T.ev(() => { const s = window.__ashen.Save.s; s.fxBW = s.fxGrain = s.fxVHS = true; }); await T.wait(800); await T.shot('filters');
  console.log('grey', await T.ev(() => { const c = document.querySelector('canvas'), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data; let col = 0; for (let i = 0; i < d.length; i += 4 * 97) if (Math.abs(d[i] - d[i + 1]) > 6 || Math.abs(d[i + 1] - d[i + 2]) > 6) col++; return col === 0 ? 'no colour left' : col + ' coloured samples'; }));
  await T.ev(() => { const s = window.__ashen.Save.s; s.fxBW = s.fxGrain = s.fxVHS = false; });
  console.log(JSON.stringify(await T.state()));
  await T.done();
})();
