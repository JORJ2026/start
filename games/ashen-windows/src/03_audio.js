
/* ==========================================================================
   SECTION 6: AUDIO (Web Audio only; every sound is synthesized)
   One key (A minor), one slow tempo family. Starts after first user input.
   ========================================================================== */
const SCALE = [0, 2, 3, 5, 7, 8, 10];
const _ = null;
/* Tracks are written as text: one token per eighth-note step, "." is a rest, "|" marks a bar (16 steps).
   chords = one root (scale degree) per bar; bass is written relative to the current root.
   Voices: pluck (piano-like), box (music box), bass, pad (soft chord), cello (bowed, long), bell. */
const SQ = str => str.split(/\s+/).filter(x => x && x !== '|').map(x => (x === '.' ? null : +x));
const TRACKS = {
  menu: { bpm: 52, drone: 0, chords: [0, 5, 2, 4],
    pluck: SQ('0 . 4 . 2 . . . 5 . 4 . . . 2 . | 0 . 4 . 2 . . . 3 . 2 . 1 . . . | 5 . 4 . 2 . 4 . 7 . 6 . 4 . . . | 3 . 2 . 1 . 0 . . . . . . . . .'),
    box: SQ('. . . 7 . . 9 . . . . 8 . . . . | . . . 7 . . 9 . . . . 11 . . 9 . | . . . . 9 . . . 11 . . . 9 . . . | . . 8 . . . 7 . . . . . . . . .'),
    bass: SQ('0 . . . . . . . 4 . . . . . . .') },
  homeDay: { bpm: 56, drone: 0, chords: [0, 2, 5, 4],
    pluck: SQ('0 . 2 . 4 . . 2 3 . . . 4 . . . | 2 . 4 . 7 . . 6 4 . . . 2 . . . | 5 . 4 . 3 . . 2 0 . . . 2 . . . | 4 . 3 . 1 . . . -1 . . . . . . .'),
    box: SQ('. . . . 9 . . . . . 7 . . . 8 . | . . . . 11 . . . . . 9 . . . . . | . . . . 7 . . . . . 9 . . . 8 . | . . . . 6 . . . . . . . . . . .'),
    bass: SQ('0 . . . 4 . . . 0 . . . 4 . . .') },
  homeNight: { bpm: 46, drone: 3, chords: [0, 5, 3, 4], tense: true,
    pluck: SQ('0 . . . 2 . . . . . 4 . . . . . | -2 . . . 0 . . . . . 2 . . . . . | 3 . . . 2 . . . . . 0 . . . . . | 1 . . . -1 . . . . . . . . . . .'),
    box: SQ('. . 7 . . . . . . . . . 9 . . . | . . . . . . 5 . . . . . . . . . | . . 7 . . . . . . . 8 . . . . . | . . . . . . . . . . . . . . . .'),
    cello: SQ('0 . . . . . . . . . . . . . . . | -2 . . . . . . . . . . . . . . . | -4 . . . . . . . -2 . . . . . . . | -3 . . . . . . . . . . . . . . .'),
    bass: SQ('0 . . . . . . . . . . . . . . .') },
  sortie: { bpm: 50, drone: 0, chords: [0, 0, 5, 4], tense: true,
    pluck: SQ('0 . . . . . 3 . . . . . 2 . . . | 0 . . . . . 3 . . . . . 4 . . . | -2 . . . . . 0 . . . . . 2 . . . | 1 . . . . . 0 . . . . . -1 . . .'),
    box: SQ('. . . . . . . . 7 . . . . . . . | . . . . . . . . . . . . . . . . | . . . . . . . . 5 . . . . . . . | . . . . . . . . . . . . . . . .'),
    bass: SQ('0 . . . . . . . 0 . . . . . . .') },
  danger: { bpm: 66, drone: 0, chords: [0, 0, 5, 4], tense: true, base: 0.6,
    pluck: SQ('0 . 0 . 1 . 0 . 0 . 0 . 3 . 1 .'), bass: SQ('0 . 0 . 0 . 0 . 0 . 0 . 0 . 0 .') },
  ending: { bpm: 54, drone: 2, chords: [2, 6, 5, 0],
    pluck: SQ('2 . 4 . 6 . 4 . 7 . 6 . 4 . 2 . | 6 . 8 . 10 . 8 . 9 . 8 . 6 . 4 . | 5 . 7 . 9 . 7 . 8 . 7 . 5 . 4 . | 7 . 6 . 4 . 2 . 4 . . . . . . .'),
    box: SQ('9 . . . 11 . . . 9 . . . 7 . . . | 13 . . . 11 . . . 10 . . . 8 . . . | 12 . . . 11 . . . 9 . . . 7 . . . | 11 . . . 9 . . . 7 . . . . . . .'),
    cello: SQ('2 . . . . . . . . . . . . . . . | -1 . . . . . . . . . . . . . . . | -2 . . . . . . . . . . . . . . . | 0 . . . . . . . . . . . . . . .'),
    bell: SQ('. . . . . . . . . . . . . . . . | . . . . . . . . . . . . . . . . | . . . . . . . . . . . . . . . . | 14 . . . . . . . . . . . . . . .'),
    bass: SQ('0 . . . 4 . . . 7 . . . 4 . . .') },
  defeat: { bpm: 40, drone: 0, chords: [0, 5, 3, 4],
    pluck: SQ('4 . . . 3 . . . 2 . . . 0 . . .'), cello: SQ('0 . . . . . . . . . . . . . . . | -2 . . . . . . . . . . . . . . .') },
  ch1: { bpm: 54, drone: 0, chords: [0, 5, 2, 4],
    pluck: SQ('0 . 4 . 2 . 4 . 0 . 4 . 2 . . . | -2 . 2 . 0 . 2 . -2 . 2 . 3 . . . | 2 . 4 . 7 . 4 . 6 . 4 . 2 . . . | 1 . 2 . 4 . 2 . 1 . . . . . . .'),
    box: SQ('. . . . . . . . 9 . . . 11 . 9 . | . . . . . . . . 7 . . . 9 . 8 . | . . . . . . . . 11 . . . 9 . 7 . | . . . . 8 . . . 6 . . . . . . .'),
    bass: SQ('0 . . . . . . . 4 . . . . . . .') },
  ch2: { bpm: 58, drone: 0, chords: [0, 3, 5, 4],
    pluck: SQ('0 . . 2 . . 4 . . 2 . . 0 . . . | 3 . . 2 . . 0 . . -1 . . 0 . . . | 5 . . 4 . . 2 . . 4 . . 5 . . . | 4 . . 2 . . 1 . . -1 . . . . . .'),
    box: SQ('. . . . . . . . . 7 . . . . . . | . . . . . . . . . 5 . . . . . . | . . . . . . . . . 9 . . . . . . | . . . . . . 8 . . . . . . . . .'),
    bass: SQ('0 . . . . . 4 . . . . . 0 . . .') },
  ch3: { bpm: 44, drone: 0, chords: [0, 5, 3, 0], tense: true,
    pluck: SQ('0 . . . . . . . 2 . . . . . . . | -2 . . . . . . . 0 . . . . . . . | 3 . . . . . . . 2 . . . . . . . | 1 . . . . . . . -1 . . . . . . .'),
    cello: SQ('0 . . . . . . . . . . . . . . . | 0 . . . . . . . -2 . . . . . . . | -4 . . . . . . . . . . . . . . . | -3 . . . . . . . . . . . . . . .'),
    bell: SQ('. . . . 11 . . . . . . . . . . . | . . . . . . . . . . . . 9 . . . | . . . . 12 . . . . . . . . . . . | . . . . . . . . 7 . . . . . . .'),
    bass: SQ('0 . . . . . . . . . . . . . . .') },
  ch4: { bpm: 48, drone: 0, chords: [0, 5, 1, 4], tense: true,
    pluck: SQ('0 . 0 . . . 1 . 0 . . . -1 . . . | 0 . 0 . . . 2 . 1 . . . 0 . . . | -2 . -2 . . . -1 . -2 . . . -3 . . . | -1 . . . 0 . . . 1 . . . . . . .'),
    box: SQ('. . . . . . . . . . . . 7 . . . | . . . . . . . . . . . . 8 . . . | . . . . . . . . . . . . 5 . . . | . . . . . . . . 6 . . . . . . .'),
    cello: SQ('0 . . . . . . . . . . . . . . . | -2 . . . . . . . . . . . . . . . | -6 . . . . . . . . . . . . . . . | -3 . . . . . . . . . . . . . . .') },
  ch5: { bpm: 58, drone: 2, chords: [2, 6, 5, 2],
    pluck: SQ('2 . 4 . 6 . 7 . 6 . 4 . 2 . 4 . | 6 . 8 . 9 . 8 . 6 . 4 . 6 . . . | 5 . 7 . 9 . 10 . 9 . 7 . 5 . 7 . | 9 . 8 . 6 . 4 . 2 . . . . . . .'),
    box: SQ('. . . . 11 . . . . . . . 9 . . . | . . . . 13 . . . . . . . 11 . . . | . . . . 12 . . . . . . . 14 . . . | . . . . 11 . . . 9 . . . . . . .'),
    bell: SQ('. . . . . . . . . . . . . . . . | . . . . . . . . . . . . . . . . | . . . . . . . . . . . . . . . . | . . . . . . . . 16 . . . . . . .'),
    bass: SQ('0 . . . 4 . . . 0 . . . 4 . . .') },
  market: { bpm: 60, drone: 0, chords: [0, 3, 4, 0],
    pluck: SQ('0 . 2 0 4 . 2 . 0 . 2 0 4 . . . | 3 . 5 3 7 . 5 . 3 . 2 . 1 . . . | 4 . 6 4 8 . 6 . 4 . 3 . 1 . . . | 0 . 2 . 4 . 2 . 0 . . . . . . .'),
    box: SQ('. . . . . . . . 9 . . . . . . . | . . . . . . . . 10 . . . . . . . | . . . . . . . . 11 . . . . . . . | . . . . 9 . . . 7 . . . . . . .'),
    bass: SQ('0 . . . 4 . . . 0 . . . 4 . . .') },
  snow: { bpm: 42, drone: 3, chords: [0, 3, 5, 4], tense: true,
    pluck: SQ('0 . . . . . . . . . . . 2 . . . | -1 . . . . . . . . . . . 0 . . . | 3 . . . . . . . . . . . 2 . . . | -1 . . . . . . . . . . . . . . .'),
    cello: SQ('0 . . . . . . . . . . . . . . . | -4 . . . . . . . . . . . . . . . | -2 . . . . . . . . . . . . . . . | -3 . . . . . . . . . . . . . . .'),
    bell: SQ('. . . . . . 12 . . . . . . . . . | . . . . . . . . . . 11 . . . . . | . . . . . . 9 . . . . . . . . . | . . . . . . . . . . . . . . . .') },
  courier: { bpm: 62, drone: 0, chords: [0, 5, 3, 4], tense: true,
    pluck: SQ('0 . . 0 . . 2 . 0 . . 0 . . 3 . | -2 . . -2 . . 0 . -2 . . -2 . . 2 . | 3 . . 3 . . 4 . 3 . . 2 . . 0 . | 1 . . 1 . . 2 . -1 . . . . . . .'),
    box: SQ('. . . . . . . . . . . . . . . . | . . . . . . . . . . . . 9 . . . | . . . . . . . . . . . . . . . . | . . . . . . . . 8 . . . . . . .'),
    bass: SQ('0 . 0 . . . 0 . 0 . 0 . . . 0 .') },
  lullaby: { bpm: 44, drone: 0, chords: [0, 2, 5, 4],
    box: SQ('7 . 9 . 11 . 9 . 7 . . . 4 . . . | 7 . 9 . 11 . 12 . 11 . . . 9 . . . | 12 . 11 . 9 . 7 . 9 . . . 8 . . . | 7 . . . 6 . . . 4 . . . . . . .'),
    pluck: SQ('0 . . . . . . . 2 . . . . . . . | 2 . . . . . . . 4 . . . . . . . | 5 . . . . . . . 3 . . . . . . . | 4 . . . . . . . -1 . . . . . . .') }
};
/* For the Listening Room (Profile). A track is unlocked once it has been heard. */
const TRACK_INFO = [['menu', 'Ashen Windows', 'The title. A lit window, seen from the street.'], ['ch1', 'The First Candle', 'Chapter one. Learning the stairs.'], ['homeDay', 'Day, on the Landing', 'Jobs, soup, the radio.'],
  ['homeNight', 'Night, on the Landing', 'Somebody is always awake.'], ['sortie', 'The Night Road', 'Flashlight off. Count your steps.'], ['danger', 'Boots on the Stairs', 'When the cones turn to you.'],
  ['ch2', 'Thin Soup', 'Chapter two. A table, set anyway.'], ['market', 'Night Market', 'Prams, whispers, fair prices. Mostly.'], ['ch3', 'The Long Cold', 'Chapter three. Frost on the inside.'],
  ['snow', 'Snowbound', 'Everyone in one room, and the heater ticking.'], ['ch4', 'Quiet Hands', 'Chapter four. Knocks on other doors.'], ['courier', 'Letters After Dark', 'Ines, running.'],
  ['ch5', 'The Thaw', 'Chapter five. Something like spring.'], ['lullaby', 'Lullaby with Missing Notes', 'From the radio, around midnight.'], ['ending', 'Ceasefire Morning', 'The windows, lighting one by one.'], ['defeat', 'The Landing Falls Quiet', 'For those who were kind here.']];
const BOX_TUNE = [7, 9, 11, 9, 12, 11, 9, 7, 8, 9, 7, 4];      // the music box's own little phrase (original)

const Snd = {
  ctx: null, ok: false, track: 'menu', step: 0, hope: 0.5, hopeV: 0.5, nextT: 0, tension: 0, duckT: 0, toy: false, amb: { wind: 0, rain: 0 }, heartT: 0,
  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const c = this.ctx = new AC();
      this.master = c.createGain(); this.master.connect(c.destination);
      this.mus = c.createGain(); this.mus.connect(this.master);
      // a small, dark room: generated impulse, so the music sits in the same space as the sound effects
      this.musIn = c.createGain(); this.musIn.connect(this.mus);
      try { const rl = Math.floor(c.sampleRate * 2.4), ir = c.createBuffer(2, rl, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const dd = ir.getChannelData(ch); for (let i = 0; i < rl; i++) dd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 3.2); }
        const cv = c.createConvolver(); cv.buffer = ir; const rs = c.createGain(); rs.gain.value = 0.34; const rlp = c.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 2400; this.musIn.connect(rs); rs.connect(cv); cv.connect(rlp); rlp.connect(this.mus); } catch (e) { /* no reverb */ }
      this.sfxG = c.createGain(); this.sfxG.connect(this.master);
      const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
      // drone: two detuned saws through a low filter
      this.droneG = c.createGain(); this.droneG.gain.value = 0.0; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 170;
      this.dr = [c.createOscillator(), c.createOscillator()];
      this.dr.forEach((o, i) => { o.type = 'sawtooth'; o.frequency.value = 55; o.detune.value = i ? 7 : -7; o.connect(lp); o.start(); });
      lp.connect(this.droneG); this.droneG.connect(this.mus);
      // tension shimmer: a tight minor second, faded in by the Director's tension value
      this.tenG = c.createGain(); this.tenG.gain.value = 0; this.tenG.connect(this.mus);
      [880, 932.3].forEach(f => { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(this.tenG); o.start(); });
      // ambience loops: wind and rain from filtered noise
      this.windG = this.loopNoise('bandpass', 380, 0.7); this.rainG = this.loopNoise('highpass', 2600, 0.5);
      this.ok = true; this.nextT = c.currentTime + 0.1; this.applyVol();
    } catch (e) { this.ok = false; }
  },
  loopNoise(type, freq, q) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(this.sfxG); s.start(); return g;
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') { try { this.ctx.resume(); } catch (e) { /* ignore */ } } },
  applyVol() {
    if (!this.ok) return; const s = Save.s;
    this.master.gain.value = s.mute ? 0 : 1; this.sfxG.gain.value = clamp(num(s.sfx, 0.8), 0, 1);
  },
  nf(deg, oct) { const n = SCALE.length, o = Math.floor(deg / n), d = ((deg % n) + n) % n; return 110 * Math.pow(2, (SCALE[d] + 12 * (o + (oct || 0))) / 12); },
  /* tone and noise primitives; every call takes a slightly random pitch from its caller */
  tn(freq, dur, type, vol, o) {
    if (!this.ok) return; o = o || {};
    const c = this.ctx, t = c.currentTime + (o.when || 0), os = c.createOscillator(), g = c.createGain();
    os.type = type || 'sine'; os.frequency.setValueAtTime(Math.max(20, freq), t);
    if (o.slide) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + dur);
    const at = o.attack || 0.005;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, vol), t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, at + 0.01));
    let node = os;
    if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; os.connect(f); node = f; }
    node.connect(g); g.connect(o.dest || this.sfxG); os.start(t); os.stop(t + dur + 0.05);
  },
  nz(dur, vol, ftype, freq, q, o) {
    if (!this.ok) return; o = o || {};
    const c = this.ctx, t = c.currentTime + (o.when || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; s.loop = true; f.type = ftype || 'lowpass'; f.frequency.setValueAtTime(Math.max(30, freq || 800), t); f.Q.value = q || 1;
    if (o.slide) f.frequency.exponentialRampToValueAtTime(Math.max(30, o.slide), t + dur);
    const at = o.attack || 0.004;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, vol), t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, at + 0.01));
    s.connect(f); f.connect(g); g.connect(o.dest || this.sfxG); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  },
  sfx(n, a) {
    if (!this.ok) return; a = a || {};
    const pv = 0.94 + Math.random() * 0.12, v = a.v == null ? 1 : a.v;
    switch (n) {
      case 'step': { const s = a.surf || 'wood', f = s === 'wood' ? 190 : s === 'stone' ? 330 : s === 'water' ? 700 : s === 'snow' ? 1000 : 260;
        this.nz(0.05, 0.13 * v, s === 'water' ? 'bandpass' : 'lowpass', f * pv, 1.2); if (s === 'wood') this.tn(92 * pv, 0.05, 'sine', 0.06 * v); break; }
      case 'door': this.nz(0.18, 0.2, 'lowpass', 520 * pv, 1); this.tn(140 * pv, 0.2, 'triangle', 0.1, { slide: 90 }); break;
      case 'creak': this.tn(410 * pv, 0.4, 'sawtooth', 0.045 * v, { slide: 290 * pv, lp: 900 }); break;
      case 'thud': this.tn(72 * pv, 0.3, 'sine', 0.38 * v, { slide: 40 }); this.nz(0.12, 0.1 * v, 'lowpass', 210, 1); break;
      case 'hit': this.tn(96 * pv, 0.18, 'sine', 0.4, { slide: 46 }); this.nz(0.1, 0.2, 'lowpass', 420, 1); break;
      case 'rumble': this.nz(a.d || 2.6, 0.4 * v, 'lowpass', 95, 1, { attack: 0.8 }); this.tn(38, a.d || 2.6, 'sine', 0.26 * v, { attack: 0.8 }); break;
      case 'match': this.nz(0.26, 0.18, 'highpass', 3200 * pv, 1, { attack: 0.02 }); break;
      case 'can': this.tn(900 * pv, 0.05, 'square', 0.04); this.tn(1300 * pv, 0.06, 'square', 0.03, { when: 0.09 }); this.nz(0.2, 0.07, 'bandpass', 2500, 3, { when: 0.05 }); break;
      case 'static': this.nz(a.d || 0.6, 0.12, 'bandpass', 1800 * pv, 0.6); this.tn(600 * pv, a.d || 0.5, 'sine', 0.025, { slide: 1400 * pv }); break;
      case 'cough': this.nz(0.09, 0.2, 'bandpass', 700 * pv, 2); this.nz(0.11, 0.18, 'bandpass', 600 * pv, 2, { when: 0.16 }); break;
      case 'heart': this.tn(58, 0.12, 'sine', 0.42 * v, { slide: 44 }); this.tn(52, 0.14, 'sine', 0.3 * v, { slide: 40, when: 0.2 }); break;
      case 'chime': [7, 9, 11].forEach((d, i) => this.tn(this.nf(d, 1) * pv, 1.0, 'sine', 0.1, { when: i * 0.1 })); break;
      case 'pickup': this.tn(this.nf(4, 2) * pv, 0.25, 'sine', 0.12); this.tn(this.nf(7, 2) * pv, 0.35, 'sine', 0.09, { when: 0.07 }); break;
      case 'rise': this.tn(220, a.d || 1.5, 'triangle', 0.1 * v, { slide: 520, attack: 0.2 }); break;
      case 'bark': this.tn(300 * pv, 0.09, 'sawtooth', 0.16, { slide: 180, lp: 1200 }); this.tn(280 * pv, 0.09, 'sawtooth', 0.14, { slide: 170, lp: 1200, when: 0.16 }); break;
      case 'meow': this.tn(640 * pv, 0.32, 'triangle', 0.09, { slide: 470 * pv }); break;
      case 'purr': this.tn(46, 0.8, 'sawtooth', 0.07, { lp: 200 }); break;
      case 'knock': [0, 0.18, 0.36].forEach(w => { this.tn(120 * pv, 0.1, 'sine', 0.3, { slide: 70, when: w }); this.nz(0.05, 0.12, 'lowpass', 600, 1, { when: w }); }); break;
      case 'drip': this.tn(1200 * pv, 0.08, 'sine', 0.08, { slide: 1900 }); break;
      case 'clatter': for (let i = 0; i < 5; i++) { this.tn((700 + Math.random() * 900), 0.09, 'square', 0.06, { when: i * 0.07, lp: 3000 }); this.nz(0.05, 0.1, 'bandpass', 2400, 3, { when: i * 0.07 }); } break;
      case 'shatter': this.nz(0.3, 0.22, 'highpass', 3500, 1); for (let i = 0; i < 4; i++) this.tn(2000 + Math.random() * 2500, 0.08, 'sine', 0.04, { when: i * 0.04 }); break;
      case 'splash': this.nz(0.3, 0.16, 'bandpass', 900 * pv, 0.8, { slide: 400 }); break;
      case 'whoosh': this.nz(0.22, 0.1, 'bandpass', 600, 1, { slide: 1800 }); break;
      case 'gust': this.nz(a.d || 1.6, 0.26, 'bandpass', 300, 0.8, { slide: 900, attack: 0.5 }); break;
      case 'type': this.tn((a.f || 520) * pv, 0.045, 'triangle', 0.045); break;
      case 'tick': this.tn(1500, 0.02, 'square', 0.025 * v); break;
      case 'page': this.nz(0.16, 0.09, 'highpass', 1500, 1, { attack: 0.05 }); break;
      case 'tear': this.nz(0.45, 0.14, 'bandpass', 1400, 0.7, { slide: 3200, attack: 0.03 }); break;
      case 'squeak': this.tn(900 * pv, 0.18, 'sawtooth', 0.05, { slide: 1300 * pv, lp: 2600 }); break;
      case 'pan': this.tn(520 * pv, 0.4, 'square', 0.09, { lp: 1800 }); this.tn(790 * pv, 0.35, 'triangle', 0.09); this.nz(0.06, 0.15, 'bandpass', 1500, 2); break;
      case 'bell': [1, 2.0, 2.76, 4.1].forEach((m, i) => this.tn(196 * m, 2.6 - i * 0.4, 'sine', 0.16 / (i + 1))); break;
      case 'crank': for (let i = 0; i < 4; i++) this.nz(0.04, 0.1, 'bandpass', 900 + i * 120, 4, { when: i * 0.09 }); break;
      case 'unlock': this.tn(1100, 0.03, 'square', 0.05); this.tn(1500, 0.04, 'square', 0.05, { when: 0.08 }); [7, 11, 14].forEach((d, i) => this.tn(this.nf(d, 1), 0.9, 'sine', 0.09, { when: 0.16 + i * 0.09 })); break;
      case 'select': this.tn(660 * pv, 0.06, 'triangle', 0.07); this.tn(880 * pv, 0.08, 'sine', 0.05, { when: 0.04 }); break;
      case 'move': this.tn(440 * pv, 0.03, 'triangle', 0.045); break;
      case 'back': this.tn(330, 0.07, 'triangle', 0.055, { slide: 250 }); break;
      case 'deny': this.tn(160, 0.12, 'square', 0.05, { lp: 600 }); break;
      case 'sizzle': this.nz(0.5, 0.07, 'highpass', 4200, 1, { attack: 0.1 }); break;
      case 'hiss': this.nz(a.d || 0.8, 0.07 * v, 'highpass', 5200, 1, { attack: 0.2 }); break;
      case 'crackle': for (let i = 0; i < 4; i++) this.nz(0.03, 0.12, 'bandpass', 1400 + Math.random() * 1800, 5, { when: Math.random() * 0.4 }); break;
      case 'wind': this.sfx('gust', a); break;
      case 'coo': this.tn(360 * pv, 0.22, 'sine', 0.06, { slide: 300 }); this.tn(340 * pv, 0.25, 'sine', 0.06, { slide: 290, when: 0.26 }); break;
      case 'snip': this.tn(2000, 0.03, 'square', 0.03); this.tn(2300, 0.03, 'square', 0.03, { when: 0.1 }); break;
      case 'box': BOX_TUNE.forEach((d, i) => this.tn(this.nf(d, 1) * (this.toy ? 2 : 1), 0.7, 'sine', 0.1, { when: i * 0.24 })); break;
      case 'tune': this.tn(a.f || 440, 0.25, 'sine', 0.08); break;
      case 'harp': [4, 7, 9].forEach((d, i) => this.tn(this.nf(d, 1) * pv, 0.42, 'sawtooth', 0.035, { when: i * 0.2, lp: 1400, attack: 0.05 })); break;
      case 'sip': this.nz(0.2, 0.05, 'bandpass', 900, 3, { slide: 1400 }); break;
      default: break;
    }
  },
  /* Short layered stingers on top of the loop */
  sting(kind) {
    if (!this.ok) return;
    const seqs = { warn: [[0, 0], [1, 0.14]], good: [[4, 0], [7, 0.14], [9, 0.3]], bad: [[3, 0], [1, 0.2], [0, 0.44]], dawn: [[0, 0], [4, 0.2], [7, 0.4], [11, 0.65]], unlock: [[7, 0], [9, 0.1], [11, 0.2], [14, 0.34]] };
    (seqs[kind] || []).forEach(p => this.tn(this.nf(p[0], 1), 1.2, kind === 'warn' ? 'triangle' : 'sine', 0.09, { when: p[1], dest: this.mus }));
  },
  duck(sec) { this.duckT = Math.max(this.duckT, sec || 2.5); },
  setTrack(name) { if (TRACKS[name] && this.track !== name) { this.track = name; this.step = 0; if (Save.data && Save.data.heard && !Save.data.heard[name]) { Save.data.heard[name] = 1; Save.write(); } } },
  /* A short melodic phrase on the piano voice: [[degree, beat], ...] */
  phrase(ph, oct) { if (!this.ok) return; for (const [d, b] of ph) { const f = this.nf(d, oct == null ? 1 : oct); this.tn(f, 1.4, 'triangle', 0.09, { when: b * 0.3, dest: this.musIn, lp: 2200 }); this.tn(f * 2, 0.8, 'sine', 0.03, { when: b * 0.3, dest: this.musIn }); } },
  /* Step sequencer, scheduled slightly ahead of the audio clock. */
  update(dt) {
    if (!this.ok) return;
    const c = this.ctx, s = Save.s, tr = TRACKS[this.track] || TRACKS.menu;
    this.duckT = Math.max(0, this.duckT - dt);
    const mv = clamp(num(s.music, 0.6), 0, 1) * (this.duckT > 0 ? 0.35 : 1);
    this.mus.gain.value += (mv - this.mus.gain.value) * Math.min(1, dt * 4);
    const ten = clamp((tr.tense ? num(this.tension) : 0) + (tr.base || 0), 0, 1) * (s.reduce ? 0.35 : 1);
    this.tenG.gain.value += (ten * 0.022 - this.tenG.gain.value) * Math.min(1, dt * 2);
    this.droneG.gain.value += (0.05 - this.droneG.gain.value) * Math.min(1, dt);
    const df = this.nf(tr.drone, -1); this.dr.forEach(o => { o.frequency.value += (df - o.frequency.value) * Math.min(1, dt * 2); });
    this.windG.gain.value += (clamp(this.amb.wind, 0, 1) * 0.12 - this.windG.gain.value) * Math.min(1, dt * 2);
    this.rainG.gain.value += (clamp(this.amb.rain, 0, 1) * 0.09 - this.rainG.gain.value) * Math.min(1, dt * 2);
    if (ten > 0.55) { this.heartT -= dt; if (this.heartT <= 0) { this.heartT = 1.15 - ten * 0.45; this.sfx('heart', { v: ten * 0.7 }); Bus.emit('heartbeat', { t: ten }); } }
    const stepLen = 60 / tr.bpm / 2;
    if (this.nextT < c.currentTime - 0.5) this.nextT = c.currentTime + 0.05;       // tab was asleep: resync
    this.hopeV += (clamp(this.hope, 0, 1) - this.hopeV) * Math.min(1, dt * 0.5);
    const hp = this.hopeV, D = this.musIn || this.mus, toy = this.toy;
    while (this.nextT < c.currentTime + 0.15) {
      const st = this.step, i = st % 16, when = Math.max(0, this.nextT - c.currentTime), bar = Math.floor(st / 16);
      const at = a => (a && a.length ? a[st % a.length] : null), root = tr.chords ? tr.chords[bar % tr.chords.length] : 0;
      const p = at(tr.pluck), b = at(tr.box), bs = at(tr.bass), ce = at(tr.cello), be = at(tr.bell);
      if (p != null) { const f = this.nf(p, toy ? 2 : 0); this.tn(f, toy ? 0.35 : 1.6, toy ? 'square' : 'triangle', toy ? 0.035 : 0.1, { when, dest: D, lp: toy ? 3000 : 900 + hp * 1100 }); if (!toy) this.tn(f * 2, 0.9, 'sine', 0.02 + hp * 0.02, { when, dest: D }); }
      if (b != null) this.tn(this.nf(b, toy ? 2 : 1), toy ? 0.3 : 1.1, toy ? 'square' : 'sine', (toy ? 0.02 : 0.045) * (0.35 + hp * 0.65), { when, dest: D, lp: 4000 });
      if (bs != null) { const f = this.nf(root + bs, -1); this.tn(f, 1.1, 'sine', 0.085, { when, dest: D }); this.tn(f * 2, 0.4, 'triangle', 0.018, { when, dest: D, lp: 500 }); }
      if (ce != null) { const f = this.nf(ce, 0), d = stepLen * 7; [-6, 6].forEach(dt2 => this.tn(f * Math.pow(2, dt2 / 1200), d, 'sawtooth', 0.016, { when, dest: D, lp: 900, attack: 0.45 })); }
      if (be != null) [1, 2.76, 5.4].forEach((m, k) => this.tn(this.nf(be, 1) * m, 2.4 - k * 0.6, 'sine', 0.03 / (k + 1), { when, dest: D }));
      if (i === 0 && tr.chords && !toy) [0, 2, 4].forEach(o => this.tn(this.nf(root + o, 0), stepLen * 15, 'triangle', 0.012 + hp * 0.012, { when, dest: D, lp: 600 + hp * 500, attack: 1.2 }));
      if (hp > 0.72 && b == null && p != null && i % 4 === 2) this.tn(this.nf(p + 7, 1), 0.9, 'sine', 0.018, { when, dest: D });
      if (ten > 0.3 && i % 4 === 0) this.tn(55, 0.3, 'sine', 0.12 * ten, { when, slide: 44, dest: this.mus });
      this.step++; this.nextT += stepLen;
    }
  }
};
