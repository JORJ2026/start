// ---------- audio: synthesis, spatial voices, stone reverb, ambience, scheduled generative score ----------
const AE = {
  ctx: null, ok: false, buses: {}, listener: { x: 0, y: 0 }, hum: null, chg: null, pre: null,
  // heavy buffers are computed during the load screen, before any audio context exists
  prepare() {
    const sr = 48000, len = Math.floor(sr * 3.8);
    const verb = [new Float32Array(len), new Float32Array(len)];
    for (let ch = 0; ch < 2; ch++) {
      const d = verb[ch]; let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const early = (t < 0.12 && ((i * (ch ? 7 : 5)) % 2203) < 4) ? 0.9 : 0;
        lp += ((Math.random() * 2 - 1) - lp) * (0.55 - t * 0.4); // the tail darkens as it decays, like stone
        d[i] = (lp * 1.4 + early) * Math.pow(1 - t, 2.6);
      }
    }
    const noise = new Float32Array(sr * 2); for (let i = 0; i < noise.length; i++) noise[i] = Math.random() * 2 - 1;
    const brown = new Float32Array(sr * 6); let b = 0;
    for (let i = 0; i < brown.length; i++) { b = (b + 0.02 * (Math.random() * 2 - 1)) / 1.02; brown[i] = b * 3.5; }
    this.pre = { sr, verb, noise, brown };
  },
  // buffers must match the device's sample rate (a ConvolverNode rejects anything else), so resample
  buf(chs) {
    const c = this.ctx, sr = this.pre.sr, cr = c.sampleRate, k = sr / cr;
    const len = Math.max(1, Math.round(chs[0].length / k)), b = c.createBuffer(chs.length, len, cr);
    chs.forEach((d, ch) => {
      const o = b.getChannelData(ch);
      if (cr === sr) o.set(d); else for (let i = 0; i < len; i++) { const x = i * k, j = x | 0, f = x - j; o[i] = d[j] + ((d[j + 1] || 0) - d[j]) * f; }
    });
    return b;
  },
  init() {
    if (this.ctx) { if (this.ctx.state !== 'running' && this.ctx.state !== 'closed') this.ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      if (!this.pre) this.prepare();
      const c = this.ctx = new AC({ latencyHint: 'interactive' });
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.2;
      comp.connect(c.destination);
      this.muf = c.createBiquadFilter(); this.muf.type = 'lowpass'; this.muf.frequency.value = 20000; this.muf.Q.value = 0.6;
      // mono folds at the master; this stage spreads it back to both speakers explicitly
      this.muf.channelCount = 2; this.muf.channelCountMode = 'explicit'; this.muf.channelInterpretation = 'speakers'; this.muf.connect(comp);
      this.master = c.createGain(); this.master.channelCountMode = 'explicit'; this.master.channelInterpretation = 'speakers'; this.master.connect(this.muf);
      this.verb = c.createConvolver(); this.verb.buffer = this.buf(this.pre.verb);
      this.verbOut = c.createGain(); this.verbOut.gain.value = 0.55; this.verb.connect(this.verbOut); this.verbOut.connect(this.master);
      for (const k of ['sfx', 'music', 'amb', 'ui']) {
        const dry = c.createGain(), wet = c.createGain();
        dry.connect(this.master); wet.connect(this.verb);
        this.buses[k] = { dry, wet };
      }
      this.noiseBuf = this.buf([this.pre.noise]); this.brownBuf = this.buf([this.pre.brown]);
      this.ok = true; this.applyVolumes();
      if (c.state === 'suspended') c.resume().catch(() => {});
      Music.start(); this.ambStart();
    } catch (e) { this.ok = false; console.warn('Audio unavailable:', e); }
  },
  applyVolumes() {
    if (!this.ok) return;
    const s = Store.data.settings, t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.master, t, 0.03);
    this.master.channelCount = s.mono ? 1 : 2;
    for (const [k, v] of [['sfx', s.sfx], ['music', s.music * 0.62], ['amb', s.amb * 0.8], ['ui', s.uiVol * 0.85]]) {
      this.buses[k].dry.gain.setTargetAtTime(v, t, 0.03); this.buses[k].wet.gain.setTargetAtTime(v, t, 0.03);
    }
  },
  suspend(on) { if (!this.ok) return; (on ? this.ctx.suspend() : this.ctx.resume()).catch(() => {}); },
  muffle(on) {
    if (!this.ok) return;
    const t = this.ctx.currentTime;
    this.muf.frequency.cancelScheduledValues(t);
    this.muf.frequency.setTargetAtTime(on ? 650 : 20000, t, on ? 0.07 : 0.2);
    Music.duck(on);
  },
  spatial(x, y, range) {
    const dx = x - this.listener.x, dy = y - this.listener.y, d = hyp(dx, dy) / T;
    const mono = Store.data.settings.mono;
    return { g: Math.pow(clamp(1 - d / range, 0, 1), 1.6), pan: mono ? 0 : clamp(dx / (T * 12), -1, 1) * 0.85, lp: clamp(16000 / (1 + d * 0.35), 700, 16000), d };
  },
  chain(o) {
    const c = this.ctx; let vol = o.vol == null ? 1 : o.vol, pan = o.pan || 0, lp = 0;
    if (o.x != null) { const s = this.spatial(o.x, o.y, o.range || 30); if (s.g <= 0.002) return null; vol *= s.g; pan = s.pan; lp = s.lp; }
    const g = c.createGain(); g.gain.value = vol; let tail = g;
    if (lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; tail.connect(f); tail = f; }
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; tail.connect(p); tail = p; }
    if (o.dest) { tail.connect(o.dest); return g; } // music voices go through the score's own fader
    const bus = this.buses[o.bus || 'sfx'];
    tail.connect(bus.dry);
    const w = c.createGain(); w.gain.value = o.wet == null ? 0.3 : o.wet; tail.connect(w); w.connect(bus.wet);
    return g;
  },
  env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, a + 0.01));
  },
  tone(f, dur, o = {}) {
    if (!this.ok) return;
    const c = this.ctx, t = (o.at || c.currentTime) + (o.delay || 0), head = this.chain(o);
    if (!head) return;
    const osc = c.createOscillator(); osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.slide || dur));
    if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vibRate || 5.5; lg.gain.value = f * o.vib; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + 0.1); }
    const env = c.createGain(); this.env(env, t, o.attack || 0.005, o.peak || 0.3, dur);
    let src = osc;
    if (o.lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; osc.connect(fl); src = fl; }
    src.connect(env); env.connect(head);
    osc.start(t); osc.stop(t + dur + 0.05);
    osc.onended = () => { try { head.disconnect(); } catch (e) {} };
  },
  // two-operator FM: a bright, animal-sounding voice
  fm(f, ratio, index, dur, o = {}) {
    if (!this.ok) return;
    const c = this.ctx, t = (o.at || c.currentTime) + (o.delay || 0), head = this.chain(o);
    if (!head) return;
    const car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain();
    car.frequency.setValueAtTime(f, t); mod.frequency.setValueAtTime(f * ratio, t);
    mg.gain.setValueAtTime(f * index, t);
    if (o.to) { car.frequency.exponentialRampToValueAtTime(o.to, t + dur); mod.frequency.exponentialRampToValueAtTime(o.to * ratio, t + dur); mg.gain.exponentialRampToValueAtTime(Math.max(1, o.to * index * 0.3), t + dur); }
    mod.connect(mg); mg.connect(car.frequency);
    const env = c.createGain(); this.env(env, t, o.attack || 0.004, o.peak || 0.2, dur);
    car.connect(env); env.connect(head);
    car.start(t); mod.start(t); car.stop(t + dur + 0.05); mod.stop(t + dur + 0.05);
    car.onended = () => { try { head.disconnect(); } catch (e) {} };
  },
  noise(dur, o = {}) {
    if (!this.ok) return;
    const c = this.ctx, t = (o.at || c.currentTime) + (o.delay || 0), head = this.chain(o);
    if (!head) return;
    const src = c.createBufferSource(); src.buffer = o.brown ? this.brownBuf : this.noiseBuf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = o.ft || 'bandpass';
    f.frequency.setValueAtTime(o.f || 1000, t);
    if (o.fto) f.frequency.exponentialRampToValueAtTime(o.fto, t + dur);
    f.Q.value = o.q || 1;
    const env = c.createGain(); this.env(env, t, o.attack || 0.003, o.peak || 0.3, dur);
    src.connect(f); f.connect(env); env.connect(head);
    src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
    src.onended = () => { try { head.disconnect(); } catch (e) {} };
  },

  // ---- the bat ----
  chirp() {
    this.fm(3300, 1.5, 0.6, 0.075, { to: 1700, peak: 0.13, wet: 0.55 });
    this.noise(0.03, { f: 6000, q: 2, peak: 0.04, wet: 0.4 });
  },
  call(c) {
    const b = 1900 - c * 1000, d = 0.2 + c * 0.38;
    this.fm(b, 1.5, 0.8 + c, d, { to: b * 0.5, peak: 0.15 + c * 0.08, wet: 0.9 });
    this.tone(b * 0.5, d * 1.2, { to: b * 0.3, peak: 0.07 + c * 0.05, wet: 1, type: 'triangle' });
    this.noise(0.12 + c * 0.1, { f: 3000, fto: 1200, q: 0.8, peak: 0.05 + c * 0.04, wet: 0.7 });
  },
  chargeStart() {
    if (!this.ok || this.chg) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), am = c.createOscillator(), ag = c.createGain();
    o.type = 'triangle'; o.frequency.value = 260; g.gain.value = 0;
    am.frequency.value = 9; ag.gain.value = 0; am.connect(ag); ag.connect(g.gain);
    o.connect(g); g.connect(this.buses.sfx.dry); o.start(); am.start();
    this.chg = { o, g, am, ag };
  },
  chargeUpdate(v) {
    if (!this.chg) return;
    const t = this.ctx.currentTime;
    this.chg.o.frequency.setTargetAtTime(260 + v * 520, t, 0.05);
    this.chg.g.gain.setTargetAtTime(0.012 + v * 0.035, t, 0.05);
    this.chg.ag.gain.setTargetAtTime(v >= 1 ? 0.02 : 0, t, 0.05);
  },
  chargeStop() {
    if (!this.chg) return;
    const h = this.chg, t = this.ctx.currentTime; this.chg = null;
    h.g.gain.cancelScheduledValues(t); h.g.gain.setTargetAtTime(0, t, 0.02); h.o.stop(t + 0.15); h.am.stop(t + 0.15);
  },
  // echo returns land when the wavefront reaches the wall, from that wall's direction
  echoTick(x, y, delay, vol) { this.tone(2300 + Math.random() * 500, 0.05, { x, y, range: 34, delay, peak: 0.06 * vol, wet: 0.8, to: 1500 }); },
  flap(v) { this.noise(0.07, { f: 520, fto: 260, q: 0.9, peak: 0.02 + v * 0.05, wet: 0.15 }); },
  dash() { this.noise(0.24, { f: 600, fto: 3400, q: 0.9, peak: 0.22, wet: 0.3 }); this.noise(0.16, { f: 2400, fto: 700, q: 1.5, peak: 0.08, wet: 0.2, delay: 0.08 }); },
  hurt() { this.noise(0.4, { f: 800, fto: 140, q: 1, peak: 0.5, wet: 0.35 }); this.tone(95, 0.45, { to: 38, peak: 0.42, type: 'square', lp: 420 }); this.tone(1500, 0.3, { to: 700, peak: 0.06, type: 'sawtooth', lp: 2500 }); },
  heal() { [0, 7, 12, 16].forEach((s, i) => this.tone(659 * Math.pow(2, s / 12), 0.8, { peak: 0.07, delay: i * 0.07, wet: 0.9, type: 'triangle' })); },
  death() { this.tone(220, 2.8, { to: 50, peak: 0.25, type: 'triangle', wet: 1.2 }); this.noise(1.8, { f: 500, fto: 70, q: 1, peak: 0.3, wet: 1 }); this.fm(800, 1.41, 2, 1.2, { to: 120, peak: 0.07, wet: 1.2, delay: 0.2 }); },
  descend() { this.noise(1.1, { f: 2400, fto: 160, q: 1.2, peak: 0.2, wet: 0.8, attack: 0.15 }); this.tone(220, 1.2, { to: 55, peak: 0.16, wet: 1, attack: 0.1, type: 'triangle' }); },
  // ---- the cave ----
  moth(n) {
    const sc = [0, 2, 4, 7, 9], f = 784 * Math.pow(2, (sc[n % 5] + 12 * Math.floor(n / 5)) / 12);
    this.tone(f, 0.7, { peak: 0.09, wet: 0.8, type: 'triangle' }); this.tone(f * 2.01, 0.35, { peak: 0.03, wet: 0.8 });
  },
  shard(k) { const base = 440 * Math.pow(2, [0, 3, 5, 7, 10, 12][k % 6] / 12); [0, 4, 7, 12].forEach((s, i) => this.tone(base * Math.pow(2, s / 12), 1.6, { peak: 0.08, wet: 1, delay: i * 0.055, type: 'triangle' })); },
  shardPing(x, y, v = 1) { this.tone(1046.5, 1, { x, y, range: 34, peak: 0.06 * v, wet: 1.1, type: 'triangle' }); this.tone(1568, 0.6, { x, y, range: 34, peak: 0.02 * v, wet: 1.1 }); },
  gateOpen() { this.tone(73.4, 3, { peak: 0.3, attack: 0.7, wet: 0.9, type: 'triangle' }); this.tone(110, 3, { peak: 0.2, attack: 0.9, wet: 0.9 }); this.tone(146.8, 2.6, { peak: 0.12, attack: 1.1, wet: 1.1 }); Music.motifNow(3); },
  bell(x, y) { [1, 2.76, 5.4, 8.93].forEach((m, i) => this.tone(392 * m, 2.4 / (1 + i * 0.6), { x, y, range: 44, peak: 0.12 / (1 + i), wet: 1.1, vib: 0.003 })); },
  drip(x, y) { const f = 1100 + Math.random() * 900; this.tone(f, 0.09, { x, y, range: 24, to: f * 0.45, peak: 0.09, wet: 1.1 }); this.noise(0.02, { x, y, range: 24, f: 5000, q: 3, peak: 0.03, wet: 0.8, delay: 0.005 }); },
  rumble(x, y) { this.noise(3.5, { x, y, range: 90, brown: true, ft: 'lowpass', f: 140, q: 0.7, peak: 0.5, attack: 1.2, wet: 0.6 }); },
  song() { Music.motifNow(4); },
  kinChirp(x, y) { this.fm(2500, 1.5, 0.5, 0.11, { x, y, range: 30, to: 1800, peak: 0.09, wet: 0.8 }); this.fm(2900, 1.5, 0.5, 0.09, { x, y, range: 30, to: 2100, peak: 0.07, wet: 0.8, delay: 0.16 }); },
  kinFound() { [0, 5, 9, 12].forEach((s, i) => this.tone(587 * Math.pow(2, s / 12), 1.1, { peak: 0.07, delay: i * 0.09, wet: 1, type: 'triangle' })); this.fm(2600, 1.5, 0.6, 0.3, { to: 3400, peak: 0.06, wet: 1, delay: 0.3 }); },
  storySting() { this.tone(146.8, 3, { peak: 0.12, attack: 0.8, wet: 1.2, type: 'triangle', bus: 'ui' }); this.tone(220, 3, { peak: 0.06, attack: 1, wet: 1.3, bus: 'ui' }); },
  chorus() { Music.motifNow(8, true); [0, 4, 7, 11, 14, 19].forEach((s, i) => this.tone(196 * Math.pow(2, s / 12), 6, { peak: 0.05, attack: 1, delay: i * 0.4, wet: 1.5, type: 'triangle', dest: Music.out })); },
  // ---- the hunters ----
  click(x, y) { for (let i = 0; i < 3; i++) this.noise(0.022, { x, y, range: 28, f: 3300 + i * 200, q: 8, peak: 0.42, delay: i * 0.075, wet: 0.45 }); },
  growl(x, y) { this.tone(72, 0.75, { x, y, range: 26, type: 'sawtooth', to: 46, peak: 0.2, wet: 0.4, lp: 440, vib: 0.04, vibRate: 11 }); this.noise(0.6, { x, y, range: 26, f: 620, fto: 380, q: 4, peak: 0.16 }); },
  breath(x, y) { this.noise(1.2, { x, y, range: 12, f: 520, fto: 260, q: 1.2, peak: 0.32, attack: 0.45, wet: 0.25 }); },
  lunge(x, y) { this.noise(0.3, { x, y, range: 22, f: 1200, fto: 200, q: 3, peak: 0.42 }); this.tone(115, 0.32, { x, y, range: 22, type: 'sawtooth', to: 55, peak: 0.16, lp: 650 }); },
  stun(x, y) { this.noise(0.32, { x, y, range: 30, f: 2400, fto: 400, q: 4, peak: 0.25 }); this.tone(700, 0.4, { x, y, range: 30, to: 200, peak: 0.06, type: 'square', lp: 1500 }); },
  mutePulse(x, y) { this.tone(41, 2, { x, y, range: 70, peak: 0.45, wet: 0.7, attack: 0.35 }); this.tone(43.6, 2, { x, y, range: 70, peak: 0.22, wet: 0.7, attack: 0.35 }); this.noise(1.6, { x, y, range: 70, brown: true, ft: 'lowpass', f: 200, peak: 0.2, attack: 0.6 }); },
  // ---- interface ----
  uiMove() { this.tone(1850, 0.035, { peak: 0.045, wet: 0.15, bus: 'ui' }); this.noise(0.012, { f: 5200, q: 2, peak: 0.02, bus: 'ui', wet: 0 }); },
  uiConfirm() { this.tone(660, 0.12, { peak: 0.06, bus: 'ui', wet: 0.5, type: 'triangle' }); this.tone(990, 0.2, { peak: 0.06, bus: 'ui', wet: 0.6, delay: 0.06, type: 'triangle' }); },
  uiBack() { this.tone(880, 0.1, { peak: 0.05, bus: 'ui', wet: 0.4, type: 'triangle' }); this.tone(587, 0.16, { peak: 0.05, bus: 'ui', wet: 0.4, delay: 0.05, type: 'triangle' }); },
  uiToggle(on) { const a = on ? 740 : 1109, b = on ? 1109 : 740; this.tone(a, 0.06, { peak: 0.05, bus: 'ui', wet: 0.2 }); this.tone(b, 0.1, { peak: 0.05, bus: 'ui', wet: 0.2, delay: 0.05 }); },
  uiSlide(v) { this.tone(360 + v * 900, 0.045, { peak: 0.05, bus: 'ui', wet: 0.2, type: 'triangle' }); },
  uiTab() { this.noise(0.16, { f: 900, fto: 3200, q: 0.9, peak: 0.14, bus: 'ui', wet: 0.3 }); },
  uiError() { this.tone(130, 0.18, { peak: 0.12, type: 'square', lp: 420, bus: 'ui', wet: 0.2 }); },
  uiStart() { this.noise(1.4, { f: 300, fto: 2600, q: 0.8, peak: 0.12, attack: 0.5, bus: 'ui', wet: 1 }); this.fm(1400, 1.5, 0.7, 0.5, { to: 700, peak: 0.12, wet: 1.2, delay: 0.55, bus: 'ui' }); },
  pauseIn() { this.noise(0.3, { f: 2400, fto: 400, q: 1, peak: 0.07, bus: 'ui', wet: 0.4 }); },
  pauseOut() { this.noise(0.3, { f: 400, fto: 2400, q: 1, peak: 0.07, bus: 'ui', wet: 0.4 }); },
  achieve() { [0, 4, 7, 12, 16].forEach((s, i) => this.tone(880 * Math.pow(2, s / 12), 0.6, { peak: 0.045, delay: i * 0.06, bus: 'ui', wet: 0.8, type: 'triangle' })); },

  // looping spatial hum from the way down: navigate by ear
  humStart() {
    if (!this.ok || this.hum) return;
    const c = this.ctx, g = c.createGain(); g.gain.value = 0;
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
    const o1 = c.createOscillator(), o2 = c.createOscillator(), o3 = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain();
    o1.type = 'triangle'; o1.frequency.value = 110; o2.frequency.value = 165.4; o3.frequency.value = 220.6; o3.type = 'sine';
    lfo.frequency.value = 0.35; lg.gain.value = 0.35; lfo.connect(lg);
    const am = c.createGain(); am.gain.value = 0.65; lg.connect(am.gain);
    o1.connect(f); o2.connect(f); o3.connect(f); f.connect(am); am.connect(g);
    let tail = g; if (p) { g.connect(p); tail = p; }
    tail.connect(this.buses.sfx.dry);
    const w = c.createGain(); w.gain.value = 0.6; tail.connect(w); w.connect(this.buses.sfx.wet);
    for (const o of [o1, o2, o3, lfo]) o.start();
    this.hum = { g, p, f, o: [o1, o2, o3, lfo] };
  },
  humUpdate(x, y, open) {
    if (!this.hum) return;
    const s = this.spatial(x, y, open ? 80 : 26), t = this.ctx.currentTime;
    this.hum.g.gain.setTargetAtTime(s.g * (open ? 0.2 : 0.05), t, 0.1);
    if (this.hum.p) this.hum.p.pan.setTargetAtTime(s.pan, t, 0.1);
    this.hum.f.frequency.setTargetAtTime(open ? s.lp : 380, t, 0.2);
  },
  humStop() {
    if (!this.hum) return;
    const h = this.hum; this.hum = null;
    const t = this.ctx.currentTime;
    h.g.gain.setTargetAtTime(0, t, 0.1);
    for (const o of h.o) o.stop(t + 0.6);
  },
  // the room tone of a flooded cave: slow brown-noise water and a high, thin air
  ambStart() {
    if (!this.ok || this.amb) return;
    const c = this.ctx, bus = this.buses.amb;
    const src = c.createBufferSource(); src.buffer = this.brownBuf; src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 340;
    const g = c.createGain(); g.gain.value = 0.35;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 0.18; lfo.connect(lg); lg.connect(g.gain);
    src.connect(lp); lp.connect(g); g.connect(bus.dry);
    const air = c.createBufferSource(); air.buffer = this.noiseBuf; air.loop = true;
    const hp = c.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 5200; hp.Q.value = 0.6;
    const ag = c.createGain(); ag.gain.value = 0.012; air.connect(hp); hp.connect(ag); ag.connect(bus.dry);
    const w = c.createGain(); w.gain.value = 0.4; g.connect(w); w.connect(bus.wet);
    src.start(); air.start(); lfo.start();
    this.amb = { lp, g };
  },
  ambDepth(d) {
    if (!this.amb) return;
    const t = this.ctx.currentTime;
    this.amb.lp.frequency.setTargetAtTime(380 - Math.min(d, 10) * 18, t, 1);
    this.verbOut.gain.setTargetAtTime(0.5 + Math.min(d, 10) * 0.025, t, 1);
  }
};

// Scheduled generative score: pads on a slow minor progression, falling bell notes, the colony's motif,
// and a heartbeat that rises with danger. Timed on the audio clock, independent of frame rate.
const Music = {
  on: false, mode: 'silent', base: 50, root: 50, tension: 0, verses: 0, bpm: 54, step: 0, next: 0, cfg: null, motifQ: 0, ducked: false,
  PROG: [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]],
  PROG_MAJ: [[0, 4, 7], [5, 9, 12], [-3, 0, 4], [7, 11, 14]],
  MOTIF: [[7, 2], [10, 1], [12, 1], [10, 2], [7, 2], [5, 1], [3, 1], [5, 4]],
  MODES: {
    silent: { out: 0 },
    title: { out: 1, drone: 0.09, pad: 0.9, bell: 0.3, motif: 8, bright: 1.2 },
    game: { out: 0.85, drone: 0.12, pad: 0.42, bell: 0.1, motif: 16 },
    final: { out: 0.85, drone: 0.16, pad: 0.36, bell: 0.06, motif: 16, cluster: 0.05, rootShift: -1 },
    chorus: { out: 1, drone: 0.08, pad: 0.8, bell: 0.35, motif: 4, major: true, bright: 1.5 },
    over: { out: 0.7, drone: 0.1, pad: 0.5, bell: 0.05 },
    interlude: { out: 0.85, drone: 0.08, pad: 0.75, bell: 0.16, motif: 8 },
    ending_return: { out: 0.9, drone: 0.08, pad: 0.8, bell: 0.2, motif: 8 },
    ending_chorus: { out: 1, drone: 0.06, pad: 0.9, bell: 0.4, motif: 4, major: true, bright: 1.6 }
  },
  m2f: n => 440 * Math.pow(2, (n - 69) / 12),
  start() {
    if (!AE.ok || this.on) return;
    const c = AE.ctx, bus = AE.buses.music;
    this.out = c.createGain(); this.out.gain.value = 0; this.out.connect(bus.dry);
    const w = c.createGain(); w.gain.value = 0.85; this.out.connect(w); w.connect(bus.wet);
    this.dF = c.createBiquadFilter(); this.dF.type = 'lowpass'; this.dF.frequency.value = 320; this.dF.Q.value = 1.5;
    this.dG = c.createGain(); this.dG.gain.value = 0; this.dF.connect(this.dG); this.dG.connect(this.out);
    this.dr = [];
    for (const [iv, det, type, v] of [[-12, 0, 'sine', 1], [-12, 5, 'sine', 0.7], [-5, -3, 'sine', 0.35], [0, 0, 'triangle', 0.22]]) {
      const o = c.createOscillator(), g = c.createGain(); o.type = type; o.detune.value = det; g.gain.value = v;
      o.connect(g); g.connect(this.dF); o.start(); this.dr.push([o, iv]);
    }
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.04; lg.gain.value = 160; lfo.connect(lg); lg.connect(this.dF.frequency); lfo.start();
    // danger: a minor-second cluster with tremolo
    this.tF = c.createBiquadFilter(); this.tF.type = 'lowpass'; this.tF.frequency.value = 520;
    this.tG = c.createGain(); this.tG.gain.value = 0; this.tF.connect(this.tG); this.tG.connect(this.out);
    this.tv = [];
    for (const iv of [-11, -6, 1]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.connect(this.tF); o.start(); this.tv.push([o, iv]); }
    const trem = c.createOscillator(), tg = c.createGain(); trem.frequency.value = 7; tg.gain.value = 0.5;
    const tam = c.createGain(); tam.gain.value = 0.5; trem.connect(tg); tg.connect(tam.gain); this.tF.disconnect(); this.tF.connect(tam); tam.connect(this.tG); trem.start();
    this.on = true; this.next = c.currentTime + 0.2;
    this.retune(0.01); this.setMode(this.mode);
    this.timer = setInterval(() => this.sched(), 50);
  },
  retune(tc = 1.2) {
    if (!this.on) return;
    const t = AE.ctx.currentTime, r = this.root;
    for (const [o, iv] of this.dr) o.frequency.setTargetAtTime(this.m2f(r + iv), t, tc);
    for (const [o, iv] of this.tv) o.frequency.setTargetAtTime(this.m2f(r + iv), t, tc);
  },
  setDepth(d) { this.base = 50 - [0, 0, 0, 2, 2, 3, 5, 5, 7][Math.min(d, 8)] - (d > 8 ? (d - 8) % 5 : 0); this.root = this.base + ((this.MODES[this.mode] || {}).rootShift || 0); this.retune(); },
  setMode(mode) {
    if (!this.MODES[mode]) mode = 'game';
    this.mode = mode; this.cfg = this.MODES[mode];
    if (mode === 'title' || mode.startsWith('ending')) this.base = 50;
    this.root = this.base + (this.cfg.rootShift || 0);
    if (!this.on) return;
    const t = AE.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setTargetAtTime((this.cfg.out || 0) * (this.ducked ? 0.35 : 1), t, mode === 'silent' ? 0.3 : 1.2);
    this.dG.gain.setTargetAtTime(this.cfg.drone || 0, t, 1.5);
    this.retune();
  },
  duck(on) { this.ducked = on; if (!this.on) return; const t = AE.ctx.currentTime; this.out.gain.setTargetAtTime((this.cfg.out || 0) * (on ? 0.35 : 1), t, 0.25); },
  motifNow(n, harm) { this.motifQ = n; this.motifHarm = !!harm; },
  sched() {
    if (!AE.ok || AE.ctx.state !== 'running') return;
    const c = AE.ctx;
    if (this.next < c.currentTime - 0.4) this.next = c.currentTime + 0.05;
    const t = c.currentTime;
    this.tG.gain.setTargetAtTime(Math.max(0, this.tension - 0.2) * 0.05 + (this.cfg.cluster || 0) * 0.5, t, 0.6);
    while (this.next < c.currentTime + 0.3) { this.tick(this.next, this.step); this.next += 30 / this.bpm; this.step++; }
  },
  tick(t, s) {
    const cfg = this.cfg; if (!cfg || !cfg.out) return;
    const e8 = 30 / this.bpm, bar = Math.floor(s / 8), pos = s % 8;
    const prog = cfg.major ? this.PROG_MAJ : this.PROG, ch = prog[Math.floor(bar / 2) % 4];
    if (s % 16 === 0 && cfg.pad) this.pad(ch, t, e8 * 16, cfg.pad, cfg.bright || 1);
    if (cfg.bell && Math.random() < cfg.bell * (pos % 2 ? 0.45 : 1)) {
      const n = this.root + 12 + ch[Math.floor(Math.random() * 3)] + (Math.random() < 0.45 ? 12 : 0);
      this.bellNote(n, t, 0.05 + Math.random() * 0.03);
    }
    if (pos === 0) {
      let n = 0;
      if (this.motifQ) { n = this.motifQ; this.motifQ = 0; }
      else if (cfg.motif && bar % cfg.motif === cfg.motif - 1) n = this.mode === 'game' || this.mode === 'final' ? Math.min(8, this.verses * 2) : 8;
      if (n) this.motif(t, n, this.motifHarm || !!cfg.major);
    }
    if (this.tension > 0.35 && pos % 4 === 0) {
      AE.tone(56, 0.22, { at: t, dest: this.out, peak: 0.3 * this.tension, wet: 0.2, to: 40 });
      AE.tone(56, 0.2, { at: t + 0.24, dest: this.out, peak: 0.18 * this.tension, wet: 0.2, to: 40 });
    }
  },
  pad(ch, t, dur, vol, bright) {
    const c = AE.ctx, f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'lowpass'; f.Q.value = 0.8;
    f.frequency.setValueAtTime(360, t); f.frequency.linearRampToValueAtTime(950 * bright, t + dur * 0.5); f.frequency.linearRampToValueAtTime(360, t + dur + 2);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.035 * vol, t + 2.4);
    g.gain.setValueAtTime(0.035 * vol, t + dur - 1); g.gain.linearRampToValueAtTime(0.0001, t + dur + 2.6);
    f.connect(g); g.connect(this.out);
    let last;
    for (const iv of ch) for (const det of [-9, 9]) {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = this.m2f(this.root + iv); o.detune.value = det;
      o.connect(f); o.start(t); o.stop(t + dur + 2.7); last = o;
    }
    last.onended = () => { try { g.disconnect(); } catch (e) {} };
  },
  bellNote(n, t, v) {
    const f = this.m2f(n);
    AE.tone(f, 3.2, { at: t, dest: this.out, type: 'triangle', peak: v, attack: 0.015, wet: 1.2 });
    AE.tone(f * 2.76, 0.9, { at: t, dest: this.out, peak: v * 0.18, wet: 1.2 });
  },
  motif(t, n, harm) {
    let at = t; const e8 = 30 / this.bpm;
    this.MOTIF.slice(0, n).forEach(([iv, d]) => {
      const f = this.m2f(this.root + 12 + iv);
      AE.tone(f, d * e8 * 1.6, { at, dest: this.out, type: 'triangle', peak: 0.06, attack: 0.04, wet: 1.3, vib: 0.006, vibRate: 5 });
      AE.tone(f * 2, d * e8, { at, dest: this.out, peak: 0.015, attack: 0.04, wet: 1.3 });
      if (harm) AE.tone(f * Math.pow(2, (iv % 12 === 7 ? 4 : 3) / 12), d * e8 * 1.6, { at, dest: this.out, type: 'triangle', peak: 0.035, attack: 0.05, wet: 1.4 });
      at += d * e8;
    });
  }
};
