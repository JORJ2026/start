const { open } = require('./lib');
(async () => {
  const T = await open({ ctx: { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true } });
  await T.ev(() => window.__ashen.Flow.start('endless', {})); await T.wait(1500);
  const cdp = await T.page.context().newCDPSession(T.page);
  const tp = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  await tp('touchStart', [{ x: 120, y: 280, id: 1 }, { x: 740, y: 290, id: 2 }]);
  await T.wait(200);
  await tp('touchMove', [{ x: 170, y: 280, id: 1 }, { x: 740, y: 290, id: 2 }]);
  await T.wait(600); await T.shot('touch');
  await tp('touchEnd', []);
  console.log(JSON.stringify(await T.state()), await T.ev(() => [document.documentElement.scrollHeight, innerHeight]));
  await T.done();
})();
