const { open } = require('./lib');
(async () => {
  const T = await open();
  // Home day
  await T.ev(() => { window.__ashen.Flow.start('quick'); });
  await T.wait(1500); console.log(JSON.stringify(await T.state()));
  await T.shot('home1');
  await T.key('KeyD', 900); await T.key('KeyA', 400);
  await T.ev(() => { const G = window.__ashen.Game; G.run.candleLit = true; G.run.plant = 1.1; G.run.flags.balloon = true; G.run.surv[1].morale = 5; G.run.surv[2].morale = 100; });
  await T.wait(1200); await T.shot('home2');
  await T.key('KeyI'); await T.wait(500); await T.shot('journal'); await T.key('Escape'); await T.wait(300);
  console.log(JSON.stringify(await T.state()));
  await T.done();
})().catch(e => { console.error('TEST FAIL', e); process.exit(1); });
