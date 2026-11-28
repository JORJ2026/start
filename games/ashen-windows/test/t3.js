const { open } = require('./lib');
(async () => {
  const T = await open();
  await T.ev(() => { window.__ashen.Flow.start('quick'); });
  await T.wait(1500); await T.shot('home1');
  // open plan via door interaction path: call scene directly
  await T.ev(() => { const G = window.__ashen.Game; G.scene.dayT = 0.999; });
  await T.wait(600); await T.shot('plan'); console.log(JSON.stringify(await T.state()));
  await T.key('Enter'); await T.wait(1500); console.log(JSON.stringify(await T.state())); await T.shot('sortie1');
  await T.key('KeyQ'); await T.key('KeyD', 1500); await T.wait(300); await T.shot('sortie2');
  await T.key('KeyD', 2500); await T.shot('sortie3');
  await T.ev(() => { const G = window.__ashen.Game, w = G.scene.w; const n = w.npcs.find(q => q.T.hostile); if (n) { const s = w.surv[0]; s.x = n.x - 120; s.f = n.f; n.face = -1; } });
  await T.wait(1500); await T.shot('sortie4'); console.log(JSON.stringify(await T.state()));
  await T.done();
})().catch(e => { console.error('TEST FAIL', e); process.exit(1); });
