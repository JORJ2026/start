// Smoke test: load the game in headless Chrome, capture console errors, take screenshots.
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const GAME = 'file://' + path.resolve(__dirname, '..', 'index.html');
const LAUNCH = { executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] };
(async () => {
  const browser = await chromium.launch(LAUNCH);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));
  await page.goto(GAME + '?debug');
  await page.waitForTimeout(1800);
  await page.screenshot({ path: __dirname + '/shot_title.png' });
  const info = await page.evaluate(() => ({ scene: window.__ashen.Game.name, crashed: window.__ashen.Game.crashed, fps: window.__ashen.Game.fps }));
  console.log(JSON.stringify(info)); console.log(errs.join('\n') || 'no console errors');
  await browser.close();
})().catch(e => { console.error('TEST FAIL', e); process.exit(1); });
