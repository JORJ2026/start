// Measures real output: every synthesized sound, distance falloff, mute, mono fold-down, the pause muffle,
// and each music mode. Usage: node tools/audio-check.mjs [path/to/index.html]
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import path from 'node:path';
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.route(/fonts\./, r => r.abort());
await p.goto('file://' + path.resolve(process.argv[2] || 'dist/index.html'));
await p.waitForSelector('#bootPrompt:not([hidden])'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
const r = await p.evaluate(async () => {
  const T = __TLD, A = T.AE, S = T.Store.data.settings; await A.ctx.resume();
  T.G.state = 'ending'; A.listener.x = 0; A.listener.y = 0; // freeze the attract-mode camera so it doesn't move the listener
  const an = A.ctx.createAnalyser(); an.fftSize = 2048; A.muf.connect(an);
  const buf = new Float32Array(2048);
  const peak = async (ms) => { let m = 0; const end = performance.now() + ms; while (performance.now() < end) { an.getFloatTimeDomainData(buf); for (const v of buf) m = Math.max(m, Math.abs(v)); await new Promise(r => setTimeout(r, 15)); } return +m.toFixed(3); };
  S.music = 0; S.amb = 0; A.applyVolumes(); await peak(600);
  const out = { sampleRate: A.ctx.sampleRate, sounds: {} };
  const one = { chirp: [], call: [1], moth: [5], shard: [2], hurt: [], dash: [], heal: [], death: [], descend: [], gateOpen: [], flap: [1], uiMove: [], uiConfirm: [], uiBack: [], uiToggle: [true], uiSlide: [0.5], uiTab: [], uiError: [], uiStart: [], pauseIn: [], achieve: [] };
  for (const [n, a] of Object.entries(one)) { A[n](...a); out.sounds[n] = await peak(900); await peak(450); }
  A.listener.x = 0; A.listener.y = 0;
  for (const n of ['click', 'growl', 'bell', 'lunge', 'stun', 'mutePulse', 'breath', 'drip', 'rumble', 'shardPing']) { A[n](40, 0); out.sounds[n] = await peak(1200); await peak(500); }
  A.echoTick(40, 0, 0, 1); out.sounds.echoTick = await peak(300);
  A.chargeStart(); A.chargeUpdate(1); out.sounds.chargeHold = await peak(400); A.chargeStop(); await peak(300);
  A.click(5000, 0); out.clickFarAway = await peak(400);
  // mono: a hard-panned sound must reach both channels equally
  const split = A.ctx.createChannelSplitter(2), aL = A.ctx.createAnalyser(), aR = A.ctx.createAnalyser(); A.muf.connect(split); split.connect(aL, 0); split.connect(aR, 1);
  const lr = async () => { const l = new Float32Array(2048), r = new Float32Array(2048); let ml = 0, mr = 0; const end = performance.now() + 500; while (performance.now() < end) { aL.getFloatTimeDomainData(l); aR.getFloatTimeDomainData(r); for (const v of l) ml = Math.max(ml, Math.abs(v)); for (const v of r) mr = Math.max(mr, Math.abs(v)); await new Promise(r => setTimeout(r, 15)); } return [+ml.toFixed(3), +mr.toFixed(3)]; };
  A.verbOut.gain.value = 0;
  A.click(160, 0); out.stereoLeftRight = await lr(); await peak(400);
  S.mono = true; A.applyVolumes(); await peak(100); A.click(160, 0); out.monoLeftRight = await lr(); S.mono = false; A.applyVolumes(); await peak(400);
  A.verbOut.gain.value = 0.55;
  // pause muffle: a bright sound loses its highs
  A.muffle(true); await peak(300); out.muffleCutoffHz = Math.round(A.muf.frequency.value); A.muffle(false); await peak(600);
  // music modes
  S.music = 0.7; A.applyVolumes(); out.music = {};
  for (const m of ['title', 'game', 'final', 'chorus']) { T.Music.setMode(m); T.Music.motifNow(8); await peak(1500); out.music[m] = await peak(3500); }
  T.Music.setMode('silent'); await peak(2500); out.music.silent = await peak(800);
  S.amb = 0.8; A.applyVolumes(); out.ambience = await peak(1500);
  S.muted = true; A.applyVolumes(); await peak(400); A.shard(1); out.muted = await peak(500);
  return { ok: A.ok, state: A.ctx.state, ...out };
});
const silent = Object.entries(r.sounds).filter(([, v]) => !(v > 0.005)).map(([k]) => k);
const pass = r.ok && silent.length === 0 && r.muted === 0 && r.clickFarAway < 0.01 && Math.abs(r.monoLeftRight[0] - r.monoLeftRight[1]) < 0.02 && r.stereoLeftRight[1] > r.stereoLeftRight[0] * 1.5 && Object.entries(r.music).every(([k, v]) => k === 'silent' ? v < 0.01 : v > 0.01) && r.ambience > 0.005 && r.muffleCutoffHz < 1500 && !errs.length;
console.log(JSON.stringify({ pass, silentSounds: silent, ...r, pageErrors: errs }, null, 1));
await b.close();
process.exit(pass ? 0 : 1);
