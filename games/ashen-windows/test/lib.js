// Shared helpers for browser tests.
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const GAME = 'file://' + path.resolve(__dirname, '..', 'index.html');
const LAUNCH = { executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] };
async function open(opts) {
  opts = opts || {};
  const browser = await chromium.launch(LAUNCH);
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 720 } }, opts.ctx || {}));
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));
  await page.goto(GAME + '?debug' + (opts.q || ''));
  await page.waitForTimeout(1700);
  const T = {
    browser, page, errs,
    wait: ms => page.waitForTimeout(ms),
    shot: n => page.screenshot({ path: __dirname + '/' + n + '.png' }),
    ev: (fn, arg) => page.evaluate(fn, arg),
    key: async (k, ms) => { await page.keyboard.down(k); await page.waitForTimeout(ms || 60); await page.keyboard.up(k); await page.waitForTimeout(40); },
    state: () => page.evaluate(() => { const G = window.__ashen.Game; return { scene: G.name, ov: G.ov.length, crashed: G.crashed, fps: Math.round(G.fps), day: G.run && G.run.day, mode: G.run && G.run.mode }; }),
    done: async () => { console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors'); await browser.close(); }
  };
  return T;
}
module.exports = { open };
