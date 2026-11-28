// 1.3: items, crafting, enemy variants, site hazards, glowing outlines, Save all / Import all (including a real download).
const { open } = require('./lib');
(async () => {
  const T = await open({ ctx: { acceptDownloads: true } });
  console.log('content', JSON.stringify(await T.ev(() => { const A = window.__ashen; return { items: Object.keys(A.ITEMS).length, newItems: Object.values(A.ITEMS).filter(i => i.v13).length, recipes: A.RECIPES.length, foes: A.FOES.length }; })));
  await T.ev(() => window.__ashen.Flow.start('endless', {})); await T.wait(1500);
  console.log('craft', JSON.stringify(await T.ev(() => { const A = window.__ashen, G = A.Game, sc = G.scene, run = G.run; while (G.ov.length) G.pop(); Object.assign(run.stock, { cloth: 3, wood: 4, nails: 4 }); const s = run.surv[0]; G.push(A.craftOverlay(sc, 'workbench', s)); const ov = G.ov[G.ov.length - 1], m = ov.menu || ov.m; const before = run.stock.bandage || 0; const it = m && m.vis().find(i => /bandage/i.test(typeof i.label === 'function' ? i.label() : i.label)); if (it) it.act(); const r = { rows: m ? m.vis().length : -1, bandagesMade: (run.stock.bandage || 0) - before }; while (G.ov.length) G.pop(); return r; })));
  // a sortie with variants and hazards
  await T.ev(LOC => { const G = window.__ashen.Game; G.go('NightSortie', { loc: LOC, scouts: [G.run.surv[0].id], pack: {}, battery: 1, time: 320, onDone: () => {} }); }, process.env.LOC || 'school'); await T.wait(2500);
  const r = await T.ev(() => {
    const A = window.__ashen, G = A.Game, w = G.scene.w, s = w.surv[0], hz = w.L.objs.filter(o => o.haz), out = { npcs: w.npcs.filter(n => n.T.hostile).map(n => n.F ? n.F.n : n.type), hazards: hz.map(o => o.type + '@' + o.f) };
    const nails = hz.find(o => o.type === 'nails') || hz.find(o => o.type === 'glass'); if (nails) { w.npcs.forEach(n => { n.x = -9999; }); s.prot = 0; s.lastHitT = -99; s.crouch = false; const hp = s.health; w.place(s, nails.x, nails.f); s.jz = 0; return Object.assign(out, { test: nails.type, hp }); }
    return out;
  });
  await T.wait(700);
  r.hpAfter = await T.ev(() => Math.round(window.__ashen.Game.scene.w.surv[0].health));
  const weak = await T.ev(() => { const w = window.__ashen.Game.scene.w, s = w.surv[0], o = w.L.objs.find(o => o.type === 'weak'); if (!o) return 'none'; s.prot = 0; s.lastHitT = -99; w.place(s, o.x, o.f); s.jz = 0; return o.f; });
  await T.wait(1600);
  r.weak = weak === 'none' ? 'none on this map' : await T.ev(f => { const w = window.__ashen.Game.scene.w, s = w.surv[0]; return 'from floor ' + f + ' to ' + s.f; }, weak);
  console.log('sortie', JSON.stringify(r));
  await T.key('F3'); await T.shot('hazards');
  await T.ev(() => { window.__ashen.Save.s.outlines = false; }); await T.wait(300); await T.ev(() => { window.__ashen.Save.s.outlines = true; });
  // save all, then import it back
  const [dl] = await Promise.all([T.page.waitForEvent('download'), T.ev(() => window.__ashen.SaveIO.exportAll())]);
  const fs = require('fs'), p = await dl.path(), text = fs.readFileSync(p, 'utf8');
  console.log('download', dl.suggestedFilename(), text.length, 'bytes');
  console.log('import', JSON.stringify(await T.ev(t => { const A = window.__ashen; A.Save.data.walk = { un: 0 }; const err = A.SaveIO.apply(t); return { err, walkKept: !!A.Save.data.settings, bad: A.SaveIO.apply('{"nope":1}') }; }, text)));
  console.log(JSON.stringify(await T.state()));
  await T.done();
})();
