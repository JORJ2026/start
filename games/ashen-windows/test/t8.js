const { open } = require('./lib');
(async () => {
  const T = await open();
  // new modes
  for (const id of ['snow', 'market', 'courier']) {
    await T.ev(i => window.__ashen.Flow.start(i, {}), id); await T.wait(2600);
    await T.shot('m_' + id);
    for (let k = 0; k < 4; k++) { await T.key('ArrowRight', 250); await T.key('Enter', 60); }
    console.log(id, JSON.stringify(await T.state()));
  }
  // market: play to the end by pressing "Go home" repeatedly
  await T.ev(() => window.__ashen.Flow.start('market', {})); await T.wait(1500);
  for (let n = 0; n < 6; n++) { await T.ev(() => { const sc = window.__ashen.Game.scene; if (sc.endNight) sc.endNight(); }); await T.wait(200); }
  await T.wait(1500); console.log('market end', JSON.stringify(await T.state()));
  // snow: fast-forward to dawn
  await T.ev(() => window.__ashen.Flow.start('snow', {})); await T.wait(2500);
  await T.ev(() => { const sc = window.__ashen.Game.scene; sc.t = sc.st.len - 1; for (const s of sc.w.surv) s.cold = 80; }); await T.wait(2500);
  console.log('snow end', JSON.stringify(await T.state()));
  // home: build every new upgrade, hand out supplies, craft recipes, a thread moment
  await T.ev(() => window.__ashen.Flow.start('endless', {})); await T.wait(2200);
  await T.ev(() => { const A = window.__ashen, G = A.Game; while (G.ov.length) G.pop(); const run = G.run; for (const id of ['garden', 'piano', 'bookshelf', 'lookout', 'greenhouse', 'clothesline', 'radio', 'cards']) run.up[id] = 1;
    for (const k of ['flour', 'salt', 'coffee', 'choc', 'blanket', 'seeds', 'harmonica', 'soap', 'painkill', 'herbs', 'cloth', 'bottle', 'parts', 'book']) A.Run.add(run, k, 3); G.scene.rebuildHome(); });
  await T.wait(800); await T.shot('upgrades');
  const r = await T.ev(() => { const A = window.__ashen, G = A.Game, run = G.run, sc = G.scene, out = [];
    const s = A.Run.present(run)[0]; out.push(A.useItem(run, s, 'coffee', run.stock, sc.w)); out.push(A.useItem(run, s, 'harmonica', run.stock, sc.w)); out.push(A.useItem(run, s, 'choc', run.stock, sc.w));
    for (const o of sc.w.L.objs) if (['piano', 'bookshelf', 'lookout', 'garden', 'clothesline'].includes(o.type)) { const a = window.__ashen && sc.w && (sc.w.L.objs, null); }
    out.push('warmth ' + A.Run.warmth(run).toFixed(1));
    G.push(A.supplyOverlay(sc)); out.push('supply ov ' + G.ov.length); G.pop();
    G.push(A.craftOverlay(sc, 'stove', s)); out.push('stove ov'); G.pop(); G.push(A.craftOverlay(sc, 'workbench', s)); G.pop();
    run.day = 5; run.threads = {}; run.threadDay = {}; const d = A.momentDialog(run, s.id, null); if (d) { G.push(d); out.push('moment ' + s.id); }
    return out; });
  console.log(r.join('\n'));
  await T.wait(2500); await T.key('Enter', 80); await T.wait(400); await T.shot('moment'); await T.key('Enter', 80); await T.wait(1500); await T.key('Enter', 80); await T.wait(300);
  console.log('threads', JSON.stringify(await T.ev(() => window.__ashen.Game.run.threads)));
  // planDay with moments, dawn hooks
  console.log(await T.ev(() => { const A = window.__ashen, run = A.Game.run; run.day = 8; A.Director.planDay(run); const ev = run.events.map(e => e.type + ':' + e.id).join(','); const rep = A.Run.dawn(run, null); return ev + ' | ' + rep.lines.slice(-3).join(' / '); }));
  await T.done();
})();
