// Audio: everything is synthesized with the Web Audio API (no audio files).
//  - ambient beds per overworld (forest, caves, ruins, factory, peaks) + map/title
//  - weather loops (rain, snow hush, smoke/fog rumble) and thunder
//  - positional sound effects (volume and stereo pan follow distance to the player)
//  - loops that follow the world: moving lifts/gates, saw blades, rolling boulders, crate scraping
(function (H) {
  'use strict';
  if (typeof window === 'undefined') return;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);

  class GameAudio {
    constructor(store) {
      this.store = store;
      this.ctx = null; this.ready = false;
      this.listener = { x: 0, y: 0 };
      this.bedId = null; this.bed = null; this.timers = [];
      this.theme = 'forest'; this.wasFlash = false; this.ropeT = 0;
    }
    get settings() { return this.store.data.settings; }

    unlock() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      let C;
      try { C = new AC(); } catch (e) { return; }
      this.ctx = C;
      const master = C.createGain(), comp = C.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      master.connect(comp); comp.connect(C.destination);
      this.analyser = C.createAnalyser(); this.analyser.fftSize = 2048; master.connect(this.analyser);
      this.master = master;
      this.sfx = C.createGain(); this.amb = C.createGain();
      this.sfx.connect(master); this.amb.connect(master);
      this.rev = C.createConvolver(); this.rev.buffer = this.impulse(1.8);
      this.revSend = C.createGain(); this.revSend.gain.value = 0.5;
      this.revSend.connect(this.rev); this.rev.connect(master);
      this.white = this.noiseBuffer(false); this.brown = this.noiseBuffer(true);
      this.initLoops();
      this.applyVolumes(true);
      this.ready = true;
      if (C.state === 'suspended') C.resume().catch(() => {});
    }

    // ---------- building blocks ----------
    impulse(sec) {
      const C = this.ctx, n = Math.floor(C.sampleRate * sec), b = C.createBuffer(2, n, C.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.5); }
      return b;
    }
    noiseBuffer(brown) {
      const C = this.ctx, n = C.sampleRate * 3, b = C.createBuffer(1, n, C.sampleRate), d = b.getChannelData(0);
      let last = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
      }
      return b;
    }
    loopNoise(buf, type, freq, q) {
      const C = this.ctx, src = C.createBufferSource();
      src.buffer = buf; src.loop = true;
      const f = C.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 0.7;
      const g = C.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); src.start(0, Math.random() * 2);
      return { src, f, g };
    }
    tone(dest, o) {
      const C = this.ctx, t = C.currentTime + (o.at || 0), dur = o.dur || 0.1;
      const osc = C.createOscillator(); osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(o.f, t);
      if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t + dur);
      const g = C.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain || 0.1), t + (o.a || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(dest);
      if (o.rv) g.connect(this.revSend);
      osc.start(t); osc.stop(t + dur + 0.05);
    }
    burst(dest, o) {
      const C = this.ctx, t = C.currentTime + (o.at || 0), dur = o.dur || 0.1;
      const src = C.createBufferSource(); src.buffer = o.brown ? this.brown : this.white;
      const f = C.createBiquadFilter(); f.type = o.type || 'lowpass'; f.Q.value = o.q || 0.8;
      f.frequency.setValueAtTime(o.f || 800, t);
      if (o.f2) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + dur);
      const g = C.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain || 0.1), t + (o.a || 0.004));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(dest);
      if (o.rv) g.connect(this.revSend);
      src.start(t, Math.random() * 2); src.stop(t + dur + 0.05);
    }
    sfxOut(vol, pan) {
      const C = this.ctx, g = C.createGain(); g.gain.value = vol;
      if (C.createStereoPanner) { const p = C.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(this.sfx); } else g.connect(this.sfx);
      return g;
    }

    initLoops() {
      const C = this.ctx, L = this.L = {};
      const wire = (l, bus, pan) => { if (pan && C.createStereoPanner) { l.pan = C.createStereoPanner(); l.g.connect(l.pan); l.pan.connect(bus); } else l.g.connect(bus); return l; };
      L.rain = wire(this.loopNoise(this.white, 'highpass', 1500, 0.5), this.amb);
      L.hush = wire(this.loopNoise(this.white, 'bandpass', 900, 0.4), this.amb);
      L.rumble = wire(this.loopNoise(this.brown, 'lowpass', 170, 0.7), this.amb);
      L.motor = wire(this.loopNoise(this.brown, 'bandpass', 115, 2), this.sfx, true);
      const mo = C.createOscillator(); mo.type = 'sawtooth'; mo.frequency.value = 47;
      const mg = C.createGain(); mg.gain.value = 0.3; mo.connect(mg); mg.connect(L.motor.g); mo.start();
      L.saw = wire(this.loopNoise(this.white, 'bandpass', 2600, 1.6), this.sfx, true);
      const so = C.createOscillator(); so.type = 'sawtooth'; so.frequency.value = 165;
      const sg = C.createGain(); sg.gain.value = 0.25; so.connect(sg); sg.connect(L.saw.g); so.start();
      L.boulder = wire(this.loopNoise(this.brown, 'lowpass', 260, 0.7), this.sfx, true);
      L.scrape = wire(this.loopNoise(this.white, 'bandpass', 700, 1.2), this.sfx);
    }
    setLoop(name, target, pan) {
      const l = this.L[name], t = this.ctx.currentTime;
      l.g.gain.setTargetAtTime(target, t, 0.08);
      if (l.pan && pan !== undefined) l.pan.pan.setTargetAtTime(pan, t, 0.1);
    }

    applyVolumes(now) {
      const s = this.settings, t = this.ctx.currentTime, k = now ? 0.001 : 0.06;
      this.master.gain.setTargetAtTime(s.muted ? 0 : s.master * 0.75, t, k);
      this.sfx.gain.setTargetAtTime(s.sfx, t, k);
      this.amb.gain.setTargetAtTime(s.ambience * (this.ducked ? 0.35 : 1), t, 0.15);
    }

    // ---------- ambient beds ----------
    makeBed(id) {
      const C = this.ctx, g = C.createGain(); g.gain.value = 0; g.connect(this.amb);
      const nodes = [], evts = [];
      const noise = (buf, type, f, q, gain) => { const l = this.loopNoise(buf, type, f, q); l.g.gain.value = gain; l.g.connect(g); nodes.push(l.src); return l; };
      const osc = (type, freq, gain) => { const o = C.createOscillator(); o.type = type; o.frequency.value = freq; const og = C.createGain(); og.gain.value = gain; o.connect(og); og.connect(g); o.start(); nodes.push(o); return { o, og }; };
      const lfo = (param, rate, depth) => { const o = C.createOscillator(); o.frequency.value = rate; const d = C.createGain(); d.gain.value = depth; o.connect(d); d.connect(param); o.start(); nodes.push(o); };
      const ev = (a, b, fn) => evts.push({ every: [a, b], t: rnd(a * 0.4, b), fn });
      switch (id) {
        case 'forest': {
          const w = noise(this.brown, 'lowpass', 520, 0.6, 0.5); lfo(w.g.gain, 0.11, 0.22);
          noise(this.white, 'bandpass', 3200, 1.2, 0.018);
          const c = osc('sine', 4300, 0.012); lfo(c.og.gain, 26, 0.012); lfo(c.og.gain, 0.23, 0.01);
          ev(9, 22, () => this.owl(g)); ev(4, 9, () => this.rustle(g)); break;
        }
        case 'caves': {
          osc('sine', 55, 0.1); osc('sine', 55.7, 0.07); const d = osc('sine', 82.4, 0.03); lfo(d.og.gain, 0.08, 0.02);
          noise(this.brown, 'lowpass', 130, 0.7, 0.3); noise(this.white, 'bandpass', 420, 1, 0.05);
          ev(2, 6, () => this.drip(g)); ev(18, 35, () => this.rockfall(g)); break;
        }
        case 'ruins': {
          const h = noise(this.white, 'bandpass', 650, 7, 0.14); lfo(h.f.frequency, 0.07, 260); lfo(h.g.gain, 0.05, 0.07);
          noise(this.brown, 'lowpass', 240, 0.7, 0.22);
          ev(10, 24, () => this.chime(g)); ev(4, 10, () => this.pebble(g)); break;
        }
        case 'factory': {
          const hm = osc('sine', 50, 0.14); osc('sine', 100, 0.07); osc('sine', 150, 0.03); lfo(hm.og.gain, 0.2, 0.03);
          noise(this.brown, 'lowpass', 220, 0.7, 0.24);
          ev(3.5, 8, () => this.clank(g)); ev(6, 14, () => this.steam(g)); break;
        }
        case 'peaks': {
          const w = noise(this.white, 'bandpass', 500, 1.2, 0.26); lfo(w.f.frequency, 0.09, 300); lfo(w.g.gain, 0.06, 0.1);
          const b = noise(this.brown, 'lowpass', 300, 0.7, 0.4); lfo(b.g.gain, 0.05, 0.15);
          ev(8, 20, () => this.iceCrack(g)); break;
        }
        default: {
          noise(this.brown, 'lowpass', 200, 0.7, 0.22); osc('sine', 55, 0.04);
          ev(8, 16, () => this.chime(g));
        }
      }
      return { g, nodes, evts };
    }

    switchBed(id) {
      const C = this.ctx, t = C.currentTime;
      if (this.bed) {
        const old = this.bed;
        old.g.gain.cancelScheduledValues(t); old.g.gain.setTargetAtTime(0, t, 0.35);
        setTimeout(() => { for (const n of old.nodes) { try { n.stop(); } catch (e) { /* already stopped */ } } try { old.g.disconnect(); } catch (e) { /* ok */ } }, 2500);
      }
      this.bedId = id;
      this.bed = this.makeBed(id);
      this.bed.g.gain.setTargetAtTime(1, t, 0.7);
      this.timers = this.bed.evts;
    }

    // ambient one-shots (connected to the bed so they fade with it)
    owl(d) { this.tone(d, { f: 330, f2: 300, dur: 0.45, gain: 0.07, a: 0.08, rv: 1 }); this.tone(d, { f: 290, f2: 250, dur: 0.7, gain: 0.07, a: 0.08, at: 0.55, rv: 1 }); }
    rustle(d) { this.burst(d, { type: 'bandpass', f: rnd(2500, 4000), q: 1, dur: rnd(0.3, 0.7), gain: 0.04, a: 0.15 }); }
    drip(d) { const f = rnd(1300, 2300); for (let i = 0; i < 3; i++) this.tone(d, { f, f2: f * 0.6, dur: 0.14, gain: 0.11 / (i + 1), at: i * 0.23, rv: 1 }); }
    rockfall(d) { this.burst(d, { brown: 1, type: 'lowpass', f: 420, dur: 1.1, gain: 0.09, a: 0.2, rv: 1 }); for (let i = 0; i < 5; i++) this.burst(d, { type: 'bandpass', f: rnd(900, 2200), dur: 0.03, gain: 0.05, at: rnd(0.1, 1) }); }
    chime(d) { const f = [523, 659, 784, 392][Math.floor(Math.random() * 4)]; this.tone(d, { f, dur: 3.5, gain: 0.05, a: 0.02, rv: 1 }); this.tone(d, { f: f * 2.01, dur: 2.5, gain: 0.015, a: 0.02, rv: 1 }); }
    pebble(d) { this.burst(d, { type: 'bandpass', f: rnd(1800, 3000), q: 2, dur: 0.03, gain: 0.04 }); }
    clank(d) { this.burst(d, { type: 'bandpass', f: 900, q: 2, dur: 0.14, gain: 0.1, rv: 1 }); this.tone(d, { f: 170, f2: 140, dur: 0.4, gain: 0.06, rv: 1 }); }
    steam(d) { this.burst(d, { type: 'highpass', f: 4200, dur: 1.1, gain: 0.08, a: 0.15 }); }
    iceCrack(d) { this.tone(d, { f: 3200, f2: 600, dur: 0.09, gain: 0.05 }); this.tone(d, { f: 2600, f2: 500, dur: 0.12, gain: 0.04, at: 0.1 }); this.burst(d, { type: 'highpass', f: 3000, dur: 0.1, gain: 0.04, rv: 1 }); }
    thunder() {
      if (!this.ready || this.settings.muted) return;
      const d = this.sfxOut(0.9, 0), at = rnd(0.5, 1.4);
      this.burst(d, { brown: 1, type: 'lowpass', f: 220, f2: 60, dur: 3.2, gain: 0.5, a: 0.3, at, rv: 1 });
      this.tone(d, { f: 52, f2: 30, dur: 2.5, gain: 0.3, a: 0.3, at });
    }

    // ---------- sound effects ----------
    play(type, x, y, v, extra) {
      if (!this.ready || this.settings.muted || this.ctx.state !== 'running') return;
      v = v == null ? 1 : v;
      let vol = v, pan = 0;
      if (typeof x === 'number') {
        const dx = x - this.listener.x, dy = (y || 0) - this.listener.y;
        vol *= Math.pow(clamp(1 - Math.hypot(dx, dy) / 760, 0, 1), 1.4);
        pan = clamp(dx / 420, -0.9, 0.9);
        if (vol < 0.01) return;
      }
      const o = this.sfxOut(vol, pan);
      const T = (p) => this.tone(o, p), B = (p) => this.burst(o, p);
      switch (type) {
        case 'step': {
          const k = rnd(0.85, 1.2), s = 0.6 + 0.4 * v;
          switch (this.theme) {
            case 'caves': B({ type: 'bandpass', f: 1600 * k, dur: 0.05, gain: 0.09 * s }); T({ f: 120 * k, f2: 70, dur: 0.06, gain: 0.05 * s }); break;
            case 'ruins': B({ type: 'bandpass', f: 2400 * k, q: 2, dur: 0.04, gain: 0.1 * s }); B({ f: 400, dur: 0.06, gain: 0.08 * s }); break;
            case 'factory': T({ f: 300 * k, f2: 200, dur: 0.05, gain: 0.05 * s }); B({ type: 'highpass', f: 3000, dur: 0.03, gain: 0.07 * s }); break;
            case 'peaks': B({ type: 'bandpass', f: 3600 * k, q: 0.7, dur: 0.1, gain: 0.1 * s }); B({ type: 'bandpass', f: 1800, dur: 0.08, gain: 0.06 * s }); break;
            default: B({ f: 700 * k, dur: 0.07, gain: 0.12 * s }); B({ type: 'bandpass', f: 2600, dur: 0.04, gain: 0.03 * s });
          }
          break;
        }
        case 'jump': B({ type: 'bandpass', f: 500, f2: 1400, q: 0.8, dur: 0.16, gain: 0.07 }); break;
        case 'land': T({ f: 110, f2: 45, dur: 0.18, gain: 0.3 * v }); B({ f: 600, dur: 0.12, gain: 0.18 * v }); break;
        case 'crateLand': T({ f: 80, f2: 40, dur: 0.22, gain: 0.3 }); B({ type: 'bandpass', f: 1100, dur: 0.08, gain: 0.12 }); break;
        case 'lever': B({ type: 'bandpass', f: 1400, dur: 0.03, gain: 0.15 }); T({ f: 700, f2: 300, type: 'square', dur: 0.05, gain: 0.05 }); T({ f: 90, f2: 60, dur: 0.12, gain: 0.12, at: 0.05 }); break;
        case 'plate': T({ f: 180, f2: 90, dur: 0.1, gain: 0.15 }); B({ f: 500, dur: 0.08, gain: 0.1 }); break;
        case 'plateUp': T({ f: 120, f2: 160, dur: 0.08, gain: 0.06 }); break;
        case 'crush': T({ f: 70, f2: 30, dur: 0.5, gain: 0.45 }); B({ brown: 1, f: 350, dur: 0.4, gain: 0.35 }); B({ type: 'highpass', f: 2500, dur: 0.06, gain: 0.12 }); break;
        case 'pickup': T({ f: 660, f2: 990, type: 'triangle', dur: 0.18, gain: 0.12 }); T({ f: 1320, f2: 1760, type: 'sine', dur: 0.25, gain: 0.07, at: 0.07, rv: 1 }); break;
        case 'shieldBreak': B({ type: 'highpass', f: 2500, dur: 0.18, gain: 0.25 }); T({ f: 900, f2: 200, type: 'triangle', dur: 0.3, gain: 0.15, rv: 1 }); break;
        case 'growl': T({ f: 95, f2: 55, type: 'sawtooth', dur: 0.45, gain: 0.16 }); B({ brown: 1, f: 300, dur: 0.4, gain: 0.12 }); break;
        case 'screech': T({ f: 2400, f2: 3400, type: 'square', dur: 0.12, gain: 0.04 }); T({ f: 3100, f2: 2200, type: 'square', dur: 0.14, gain: 0.035, at: 0.08 }); B({ type: 'highpass', f: 4000, dur: 0.15, gain: 0.07 }); break;
        case 'trap': B({ type: 'highpass', f: 3500, dur: 0.05, gain: 0.2 }); T({ f: 1300, f2: 700, type: 'square', dur: 0.03, gain: 0.08 }); T({ f: 160, f2: 90, dur: 0.15, gain: 0.2, at: 0.02 }); break;
        case 'plank': for (let i = 0; i < 3; i++) B({ type: 'bandpass', f: 1500 + rnd(0, 700), q: 1.5, dur: 0.05, gain: 0.18, at: i * 0.06 }); T({ f: 110, f2: 70, dur: 0.2, gain: 0.15 }); break;
        case 'ladder': B({ type: 'bandpass', f: 900, dur: 0.04, gain: 0.1 }); T({ f: 200, f2: 160, dur: 0.04, gain: 0.04 }); break;
        case 'rope': T({ f: 190, f2: 160, type: 'triangle', dur: 0.35, gain: 0.05 }); B({ type: 'bandpass', f: 700, dur: 0.3, gain: 0.03 }); break;
        case 'death': {
          const c = extra || '';
          B({ f: 900, f2: 120, dur: 0.5, gain: 0.35 }); T({ f: 70, f2: 28, dur: 0.8, gain: 0.4, rv: 1 });
          T({ f: 880, f2: 660, dur: 0.25, gain: 0.06 }); T({ f: 932, f2: 700, dur: 0.25, gain: 0.05, at: 0.02 });
          if (c === 'crushed' || c === 'boulder') T({ f: 55, f2: 25, dur: 0.6, gain: 0.5 });
          if (c === 'saw') B({ type: 'highpass', f: 4000, dur: 0.3, gain: 0.15 });
          if (c === 'fell' || c === 'fall') T({ f: 600, f2: 90, dur: 0.9, gain: 0.15 });
          break;
        }
        case 'checkpoint': T({ f: 523, dur: 0.9, gain: 0.06, rv: 1 }); T({ f: 784, dur: 0.9, gain: 0.05, at: 0.12, rv: 1 }); break;
        case 'finish': [392, 523, 659, 784].forEach((f, i) => T({ f, dur: 1.2, gain: 0.08, at: i * 0.16, a: 0.02, rv: 1 })); break;
        case 'uiMove': T({ f: 520, dur: 0.05, gain: 0.05 }); break;
        case 'uiSelect': T({ f: 440, f2: 660, dur: 0.09, gain: 0.07 }); T({ f: 880, dur: 0.1, gain: 0.04, at: 0.05 }); break;
      }
    }

    // ---------- per-frame update ----------
    update(game, dt) {
      if (!this.ready) return;
      const st = game.state, w = game.world;
      const inWorld = !!w && (st === 'play' || st === 'pause' || st === 'levelEnd');
      const want = inWorld ? w.level.world : 'map';
      if (inWorld) this.theme = want;
      if (want !== this.bedId) this.switchBed(want);
      this.ducked = st === 'pause';
      this.applyVolumes(false);
      for (const e of this.timers) { e.t -= dt; if (e.t <= 0) { e.fn(); e.t = rnd(e.every[0], e.every[1]); } }
      if (inWorld) this.updateWorld(w, game.weather, dt, st === 'pause');
      else for (const k of Object.keys(this.L)) this.setLoop(k, 0);
    }

    updateWorld(w, weather, dt, paused) {
      const p = w.player, cx = p.x + p.w / 2, cy = p.y + p.h / 2;
      this.listener.x = cx; this.listener.y = cy;
      const prox = (x, y) => Math.pow(clamp(1 - Math.hypot(x - cx, y - cy) / 650, 0, 1), 1.3);
      const pn = (x) => clamp((x - cx) / 400, -0.9, 0.9);
      if (paused) { for (const k of ['motor', 'saw', 'boulder', 'scrape']) this.setLoop(k, 0); return; }

      if (weather) {
        const a = weather.amount, ty = weather.type;
        this.setLoop('rain', ty === 'rain' ? 0.2 * a : 0);
        this.setLoop('hush', ty === 'snow' ? 0.06 * a : (ty === 'fog' ? 0.03 * a : 0));
        this.setLoop('rumble', ty === 'smoke' ? 0.13 * a : (ty === 'fog' ? 0.07 * a : 0));
        if (weather.flash > 0.95 && !this.wasFlash) this.thunder();
        this.wasFlash = weather.flash > 0.5;
      }
      let mv = 0, mx = cx;
      for (const m of w.movers) if (m.moving) { const k = prox(m.x + m.w / 2, m.y + m.h / 2); if (k > mv) { mv = k; mx = m.x + m.w / 2; } }
      this.setLoop('motor', 0.22 * mv, pn(mx));
      let sv = 0, sx = cx;
      for (const s of w.saws) if (s.retract < 0.6) { const k = prox(s.cx, s.cy); if (k > sv) { sv = k; sx = s.cx; } }
      this.setLoop('saw', 0.17 * sv, pn(sx));
      let bv = 0, bx = cx;
      for (const b of w.bodies) if (b.kind === 'boulder' && b.grounded && Math.abs(b.vx) > 50) { const k = prox(b.x, b.y) * Math.min(1, Math.abs(b.vx) / 250); if (k > bv) { bv = k; bx = b.x; } }
      this.setLoop('boulder', 0.35 * bv, pn(bx));
      this.setLoop('scrape', p.pushing && Math.abs(p.vx) > 10 ? 0.12 : 0);
      if (p.state === 'rope' && p.rope && Math.abs(p.rope.omega) > 0.8) {
        this.ropeT -= dt;
        if (this.ropeT <= 0) { this.play('rope', undefined, undefined, 0.8); this.ropeT = 0.9; }
      }
    }

    // RMS of the master output (used by tests to confirm sound is produced)
    level() {
      if (!this.ready) return 0;
      const d = new Float32Array(this.analyser.fftSize); this.analyser.getFloatTimeDomainData(d);
      let s = 0; for (let i = 0; i < d.length; i++) s += d[i] * d[i];
      return Math.sqrt(s / d.length);
    }
  }

  H.GameAudio = GameAudio;
})(globalThis.Hollow = globalThis.Hollow || {});
