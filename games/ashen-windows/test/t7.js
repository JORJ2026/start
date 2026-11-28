const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const GAME = 'file://' + path.resolve(__dirname, '..', 'index.html');
const LAUNCH = { executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] };
(async () => {
  const b = await chromium.launch(LAUNCH);
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(GAME + '?debug');
  await p.waitForTimeout(700); await p.screenshot({ path: __dirname + '/splash1.png' });
  await p.waitForTimeout(1500); await p.screenshot({ path: __dirname + '/splash2.png' });
  await p.waitForTimeout(3500); console.log(await p.evaluate(() => window.__ashen.Game.name)); await p.screenshot({ path: __dirname + '/title.png' });
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
