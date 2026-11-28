// Captures real in-game screenshots, cover art and a gameplay recording. Usage: node tools/capture.mjs
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const url = 'file://' + path.resolve('dist/index.html');
const out = 'media'; fs.mkdirSync(out + '/shots', { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
await ctx.route(/fonts\./, r => r.abort());
const p = await ctx.newPage();
const shot = n => p.screenshot({ path: `${out}/shots/${n}.png` });
await p.goto(url); await p.waitForSelector('#bootPrompt:not([hidden])'); await shot('01-load-screen');
await p.keyboard.press('Enter'); await p.waitForTimeout(3300); await shot('02-title');
await p.evaluate(() => { const S = __TLD.Store.data.story; S.chapters = 4; S.found.kin = { 0: true, 1: true }; S.found.verses = { 0: true }; __TLD.UI.story(); }); await p.waitForTimeout(400); await shot('03-story-menu');
await p.evaluate(() => { __TLD.newRun('story', 'standard', { chapter: 2 }); __TLD.UI.chapter(); }); await p.waitForTimeout(4800); await shot('04-chapter-card');
// kin answering in chapter II
await p.evaluate(() => { const T = __TLD; T.Store.data.settings.hints = false; T.startDepth(); const L = T.G.L, P = L.player, k = L.kin; T.G.banner = null; for (const e of L.enemies) e.x = -9e4;
  for (let a = 0; a < 6.3; a += .2) { const x = k.x + Math.cos(a) * 80, y = k.y + Math.sin(a) * 80; if (!T.__hits(L, x, y, 5) && T.los(L, x, y, k.x, k.y)) { P.x = x; P.y = y; break; } } T.R.snapCam(P.x, P.y); P.inv = 0; });
await p.waitForTimeout(1500);
await p.evaluate(() => { const T = __TLD; T.G.storyQ.length = 0; T.G.story = null; const P = T.G.L.player; P.pingCd = 0; P.charge = 1; P.charging = true; });
await p.waitForTimeout(1500); await shot('05-a-lost-voice');
// a hunter caught by a full call
await p.evaluate(() => { const T = __TLD; T.newRun('descent', 'standard'); T.G.run.seed = 1234; T.G.run.depth = 4; T.startDepth(); T.G.banner = null; const L = T.G.L, P = L.player; for (const e of L.enemies) e.x = -9e4;
  const st = L.enemies.find(e => e.type === 'stalker'); for (let a = 0; a < 6.3; a += .2) { const x = P.x + Math.cos(a) * 90, y = P.y + Math.sin(a) * 90; if (!T.__hits(L, x, y, 7) && T.los(L, P.x, P.y, x, y)) { st.x = x; st.y = y; st.state = 'search'; st.searchT = 99; break; } } P.inv = 0; });
await p.waitForTimeout(400); await p.evaluate(() => { const P = __TLD.G.L.player; P.pingCd = 0; P.charge = 1; P.charging = true; }); await p.waitForTimeout(560); await shot('06-full-call');
await p.evaluate(() => { const T = __TLD; T.newRun('descent', 'standard'); T.G.run.seed = 77; T.G.run.depth = 5; T.startDepth(); T.G.banner = null; const L = T.G.L, P = L.player, b = L.bells[0]; for (const e of L.enemies) e.x = -9e4;
  for (let a = 0; a < 6.3; a += .3) { const x = b.x + Math.cos(a) * 60, y = b.y + Math.sin(a) * 60; if (!T.__hits(L, x, y, 5) && T.los(L, x, y, b.x, b.y)) { P.x = x; P.y = y; break; } } T.R.snapCam(P.x, P.y); T.G.run.moths = 23; T.G.run.mothMeter = 7; L.shardsGot = 1; P.inv = 0; });
await p.waitForTimeout(300); await p.evaluate(() => { const P = __TLD.G.L.player; P.pingCd = 0; P.charge = 0.05; P.charging = true; }); await p.waitForTimeout(1500); await shot('07-bellflower');
await p.evaluate(() => { const T = __TLD; T.newRun('story', 'standard', { chapter: 8 }); T.Store.data.story.found.verses = { 0: 1, 1: 1, 2: 1, 3: 1 }; T.startDepth(); T.G.banner = null; const L = T.G.L, P = L.player, m = L.mute; for (const e of L.enemies) if (e !== m) e.x = -9e4;
  for (let a = 0; a < 6.3; a += .25) { const x = m.x + Math.cos(a) * 120, y = m.y + Math.sin(a) * 120; if (!T.__hits(L, x, y, 5)) { P.x = x; P.y = y; break; } } T.R.snapCam(P.x, P.y); m.tx = null; P.inv = 0; T.G.storyQ.length = 0; });
await p.waitForTimeout(400); await p.evaluate(() => { const P = __TLD.G.L.player; P.pingCd = 0; P.charge = 1; P.charging = true; __TLD.G.L.mute.tx = null; }); await p.waitForTimeout(650); await shot('08-the-mute');
await p.keyboard.press('Escape'); await p.waitForTimeout(500); await shot('09-pause');
await p.click('[data-act=settings]'); await p.waitForTimeout(300); await shot('10-settings');
await p.keyboard.press('Escape'); await p.click('[data-act=howto]'); await p.waitForTimeout(300); await shot('11-how-to-play');
await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
await p.evaluate(() => { const T = __TLD; T.newRun('story', 'standard', { chapter: 4 }); T.startDepth(); const L = T.G.L, P = L.player; for (const e of L.enemies) e.x = -9e4; if (L.kin) { P.x = L.kin.x; P.y = L.kin.y; T.update(T.STEP); } for (const s of L.shards) { P.x = s.x; P.y = s.y; T.update(T.STEP); } P.x = L.gate.x; P.y = L.gate.y; T.update(T.STEP); T.G.toasts.length = 0; });
await p.waitForTimeout(3600); await shot('12-roost-conversation');
await p.evaluate(() => { const T = __TLD; for (let i = 0; i < 6; i++) T.Store.data.story.found.kin[i] = true; T.G.run.sang = true; T.G.state = 'ending'; T.UI.ending('homecoming'); });
await p.waitForTimeout(6500); await shot('13-ending-homecoming');
await p.evaluate(() => { __TLD.G.L = null; __TLD.UI.title(); __TLD.UI.journal(); }); await p.waitForTimeout(400); await shot('14-journal');
// cover: the game's own renderer in a wide viewport, cropped so the scene sits right of the title
await p.evaluate(() => { __TLD.UI.title(); });
await p.setViewportSize({ width: 2240, height: 900 }); await p.waitForTimeout(200);
await p.evaluate(() => { const T = __TLD; T.Store.data.settings.hints = false; T.newRun('descent', 'standard'); T.G.run.seed = 9001; T.G.run.depth = 6; T.startDepth(); T.G.banner = null; T.G.fade = 0; const L = T.G.L, P = L.player; for (const e of L.enemies) e.x = -9e4; P.inv = 0;
  const st = L.enemies.find(e => e.type === 'stalker'); for (let a = 0; a < 6.3; a += .2) { const x = P.x + Math.cos(a) * 110, y = P.y + Math.sin(a) * 110; if (!T.__hits(L, x, y, 7) && T.los(L, P.x, P.y, x, y)) { st.x = x; st.y = y; st.state = 'search'; st.searchT = 99; break; } } T.G.run.hearts = 99; T.G.run.maxHearts = 0; });
await p.waitForTimeout(200); await p.evaluate(() => { const P = __TLD.G.L.player; P.pingCd = 0; P.charge = 1; P.charging = true; }); await p.waitForTimeout(500);
await p.evaluate(() => { const P = __TLD.G.L.player; P.pingCd = 0; P.charge = 0.05; P.charging = true; }); await p.waitForTimeout(260);
await p.evaluate(() => { __TLD.G.toasts.length = 0; __TLD.G.storyQ.length = 0; __TLD.G.story = null; __TLD.R.hud = () => {}; document.getElementById('pauseBtn').style.display = 'none'; const d = document.createElement('div');
  d.innerHTML = '<div style="position:fixed;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:0 0 90px 110px;font-family:Georgia,serif;color:#dee9e4;pointer-events:none;background:linear-gradient(0deg,rgba(2,4,10,.8),rgba(2,4,10,0) 55%)"><div style="font-size:128px;line-height:.9;text-shadow:0 0 50px rgba(222,233,228,.35)">The Listening<br>Dark</div><div style="font-style:italic;font-size:30px;opacity:.6;margin-top:22px">Call into the dark. Listen to what answers.</div></div>';
  document.body.appendChild(d); });
await p.waitForTimeout(120); await p.screenshot({ path: `${out}/cover.png`, clip: { x: 0, y: 0, width: 1600, height: 900 } });
await ctx.close();
// mobile
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); await m.route(/fonts\./, r => r.abort());
const q = await m.newPage(); await q.goto(url); await q.waitForSelector('#bootPrompt:not([hidden])'); await q.tap('#boot'); await q.waitForTimeout(2600); await q.screenshot({ path: `${out}/shots/15-mobile-title.png` });
await q.evaluate(() => { const T = __TLD; T.newRun('story', 'standard', { chapter: 3 }); T.startDepth(); }); await q.waitForTimeout(2400);
await q.evaluate(() => { const P = __TLD.G.L.player; P.pingCd = 0; P.charge = 1; P.charging = true; }); await q.waitForTimeout(700); await q.screenshot({ path: `${out}/shots/16-mobile-play.png` });
await m.close();
// gameplay recording: a pilot bot plays story chapter II in real time
const vctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: out + '/raw', size: { width: 1280, height: 720 } } });
await vctx.route(/fonts\./, r => r.abort());
const v = await vctx.newPage();
await v.goto(url); await v.waitForSelector('#bootPrompt:not([hidden])'); await v.keyboard.press('Enter'); await v.waitForTimeout(4200);
await v.evaluate(() => { const T = __TLD; T.Store.data.settings.hints = false; T.newRun('story', 'standard', { chapter: 2 }); T.UI.chapter(); });
await v.waitForTimeout(4500);
await v.evaluate(() => { const T = __TLD; T.startDepth(); let path = null, pi = 0, k = 0, tgt = null;
  window.__pilot = setInterval(() => { const L = T.G.L; if (!L || T.G.state !== 'play') { T.Input.keys = {}; return; } const P = L.player; P.inv = Math.max(P.inv, 0.5); k++;
    const goals = [...(L.kin && !L.kin.got ? [L.kin] : []), ...L.shards.filter(s => !s.got)]; const goal = goals.length ? goals.sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))[0] : L.gate;
    if (goal !== tgt || !path || pi >= path.length || k % 60 === 0) { tgt = goal; path = L.path(P.x, P.y, goal.x, goal.y, 20000) || []; pi = 0; }
    const pt = path[pi]; const keys = {}; if (pt) { const dx = pt[0] - P.x, dy = pt[1] - P.y; if (Math.hypot(dx, dy) < 6) pi++; if (dx > 3) keys.KeyD = 1; if (dx < -3) keys.KeyA = 1; if (dy > 3) keys.KeyS = 1; if (dy < -3) keys.KeyW = 1; }
    if (k % 110 < 2) keys.Space = 1; if (k % 330 > 250) keys.Space = 1; if (k % 330 > 170 && k % 330 < 250) keys.ShiftLeft = 1; T.Input.keys = keys; }, 16); });
await v.waitForTimeout(40000);
await v.evaluate(() => clearInterval(window.__pilot)); await vctx.close(); await browser.close();
const raw = fs.readdirSync(out + '/raw').filter(f => f.endsWith('.webm'))[0];
fs.renameSync(`${out}/raw/${raw}`, `${out}/gameplay-raw.webm`); fs.rmSync(out + '/raw', { recursive: true });
console.log('captured');
