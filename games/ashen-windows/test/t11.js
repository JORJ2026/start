const { open } = require('./lib');
(async () => {
  const T = await open();
  await T.ev(() => window.__ashen.Flow.start('endless', {})); await T.wait(2000);
  await T.ev(() => { const A = window.__ashen, G = A.Game; while (G.ov.length) G.pop(); const s = A.Run.present(G.run); s[0].sick = true; s[2].hunger = 20; G.push(A.adviceOverlay(G.run)); }); await T.wait(1200); await T.shot('advice');
  await T.key('Enter', 80); await T.wait(300);
  // force a music station
  const tr = await T.ev(() => { const A = window.__ashen, G = A.Game, sc = G.scene; for (let d = 2; d < 60; d++) { G.run.day = d; G.run.daily = {}; A.Bus.emit('radioScan', { s: A.Run.present(G.run)[0] }); if (sc.radioMusicT > 0) return d + ':' + A.Snd.track; } return 'none:' + A.Snd.track; });
  console.log('radio music', tr, JSON.stringify(await T.state()));
  await T.done();
})();
