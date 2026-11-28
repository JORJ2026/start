const { open } = require('./lib');
(async () => {
  const T = await open();
  await T.ev(() => window.__ashen.Flow.start('endless', {})); await T.wait(2000);
  await T.ev(() => { const A = window.__ashen, G = A.Game, run = G.run; while (G.ov.length) G.pop(); const s = A.Run.present(run); s[0].sick = true; s[1].morale = 20; s[2].hunger = 20; run.threads = { marta: 2, dov: 3 }; run.flags.ep_dov = 'good'; s[0].trust[s[1].id] = 90; s[1].trust[s[0].id] = 85; s[2].trust[s[3].id] = 20; s[3].trust[s[2].id] = 25; });
  await T.key('KeyJ', 80); await T.wait(700); await T.shot('journal2');
  await T.ev(() => { const A = window.__ashen, G = A.Game; while (G.ov.length) G.pop(); G.push(A.adviceOverlay(G.run)); }); await T.wait(900); await T.shot('advice');
  await T.ev(() => { const A = window.__ashen, G = A.Game; while (G.ov.length) G.pop(); G.push(A.bondsOverlay(G.run)); }); await T.wait(900); await T.shot('bonds');
  await T.ev(() => { const A = window.__ashen, G = A.Game; while (G.ov.length) G.pop(); A.Bus.emit('radioScan', { s: A.Run.present(G.run)[0] }); }); await T.wait(300);
  console.log('track after radio:', await T.ev(() => window.__ashen.Snd.track));
  // sortie pointer near dawn
  await T.ev(() => window.__ashen.Flow.start('scav', {})); await T.wait(2500);
  await T.ev(() => { const sc = window.__ashen.Game.scene; sc.timeLeft = sc.total * 0.2; const s = sc.w.surv[0]; sc.w.place(s, sc.w.L.w - 300, sc.w.L.floors.length - 1); }); await T.wait(900); await T.shot('pointer');
  // afterwards
  await T.ev(() => window.__ashen.Flow.start('endless', {})); await T.wait(1500);
  await T.ev(() => { const run = window.__ashen.Game.run; run.flags.ep_marta = 'good'; run.surv[2].gone = true; window.__ashen.Flow.endRun('win'); }); await T.wait(4000);
  for (let i = 0; i < 3 && (await T.state()).scene === 'Ending'; i++) { await T.key('Enter', 80); await T.wait(900); }
  await T.wait(5500); await T.shot('after'); console.log(JSON.stringify(await T.state()));
  await T.key('Enter', 80); await T.wait(2500); console.log(JSON.stringify(await T.state()));
  await T.done();
})();
