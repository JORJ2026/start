const { open } = require('./lib');
(async () => {
  const T = await open();
  await T.ev(() => window.__ashen.Flow.start('endless', {})); await T.wait(1500);
  await T.ev(() => { const run = window.__ashen.Game.run; run.flags.ep_marta = 'good'; run.flags.ep_dov = 'plain'; window.__ashen.Flow.endRun('win'); });
  await T.wait(4500); await T.shot('epilogue'); console.log(JSON.stringify(await T.state()));
  await T.ev(() => window.__ashen.Game.go('Listen', {}, 'tear')); await T.wait(1500); await T.shot('listen'); console.log(JSON.stringify(await T.state()));
  await T.ev(() => window.__ashen.Flow.start('courier', {})); await T.wait(2500);
  const n = await T.ev(() => { const sc = window.__ashen.Game.scene, w = sc.w, s = w.surv[0]; const boxes = w.L.objs.filter(o => o.type === 'mailbox'); for (const o of boxes) { const a = window.__ashen && null; } return boxes.map(o => o.f + ':' + o.x).join(' '); });
  console.log('mailboxes', n);
  await T.ev(() => { const A = window.__ashen, sc = A.Game.scene, w = sc.w, s = w.surv[0]; const b = w.L.objs.find(o => o.type === 'mailbox'); w.place(s, b.x - 10, b.f); });
  await T.wait(500); await T.shot('courier');
  await T.ev(() => { const A = window.__ashen, sc = A.Game.scene; for (const o of sc.w.L.objs) if (o.type === 'mailbox') { o.done = true; A.Bus.emit('letterDelivered', { s: sc.w.surv[0], o }); } sc.finish({}); });
  await T.wait(2500); console.log(JSON.stringify(await T.state()));
  await T.done();
})();
