
/* ==========================================================================
   SECTION 3: UTILITIES, SEEDED RNG, EVENT BUS, SAVE SYSTEM
   ========================================================================== */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const num = (v, d) => (Number.isFinite(v) ? v : (d || 0));       // NaN guard
const sgn = v => (v > 0 ? 1 : v < 0 ? -1 : 0);
const TAU = Math.PI * 2;

/* mulberry32: small seeded PRNG used for levels, events, replays, and Daily Winter */
class RNG {
  constructor(seed) { this.s = (seed >>> 0) || 1; }
  f() { let t = (this.s += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  r(a, b) { return a + (b - a) * this.f(); }
  i(a, b) { return a + Math.floor(this.f() * (b - a + 1)); }
  pick(arr) { return arr[Math.floor(this.f() * arr.length) % arr.length]; }
  chance(p) { return this.f() < p; }
  w(obj) { let tot = 0; for (const k in obj) tot += obj[k]; let x = this.f() * tot; for (const k in obj) { x -= obj[k]; if (x <= 0) return k; } return Object.keys(obj)[0]; }
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const FX = new RNG(12345);                      // cosmetic randomness only (never affects seeded outcomes)

/* Survivor color: saturation scales with morale. c = [h, s, l]. */
function hsl(c, sat, dl, a) {
  return 'hsla(' + c[0] + ',' + clamp(c[1] * (sat == null ? 1 : sat), 0, 100).toFixed(1) + '%,' + clamp(c[2] + (dl || 0), 0, 100).toFixed(1) + '%,' + (a == null ? 1 : a) + ')';
}
function grey(v, a) { v = clamp(Math.round(v), 0, 255); return 'rgba(' + v + ',' + v + ',' + v + ',' + (a == null ? 1 : a) + ')'; }

/* Central event bus: gameplay, audio, UI, achievements, narrator and Director only talk through this. */
const Bus = {
  m: {},
  on(ev, fn) { (this.m[ev] || (this.m[ev] = [])).push(fn); },
  emit(ev, d) { const l = this.m[ev]; if (!l) return; for (let i = 0; i < l.length; i++) { try { l[i](d || {}); } catch (e) { if (DEBUG) console.warn('bus', ev, e); } } }
};

function deepMerge(base, over) {
  if (!over || typeof over !== 'object') return base;
  for (const k in over) {
    if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && over[k] && typeof over[k] === 'object' && !Array.isArray(over[k])) deepMerge(base[k], over[k]);
    else base[k] = over[k];
  }
  return base;
}

const KEY_DEFAULT = {
  left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
  interact: ['KeyE', 'Enter'], use: ['KeyF', 'KeyX'], crouch: ['KeyC', 'ControlLeft'], light: ['KeyQ', 'KeyL'],
  sprint: ['ShiftLeft', 'ShiftRight'], sw: ['Tab'], inv: ['KeyI', 'KeyJ'], pause: ['Escape', 'KeyP'], jump: ['Space']
};
const ACTION_NAMES = { left: 'Move left', right: 'Move right', up: 'Climb / up', down: 'Down', interact: 'Interact', use: 'Use / throw',
  crouch: 'Crouch / hide', light: 'Flashlight', sprint: 'Sprint', sw: 'Switch survivor', inv: 'Journal', pause: 'Pause', jump: 'Jump' };

const SAVE_KEY = 'ashen-windows-v1';
const Save = {
  data: null, ok: true,
  defaults() {
    return {
      v: 1,
      settings: { music: 0.6, sfx: 0.8, mute: false, quality: 'high', lowfx: false, reduce: false, gentle: false, contrast: false,
        text: 1, colorblind: false, rumble: true, haptics: true, autoInteract: false, btnSize: 1, btnOpacity: 0.7, holdToggle: false,
        diff: 'normal', subtitles: true, shadows: true, outlines: true, fxBW: false, fxGrain: false, fxVHS: false, keys: JSON.parse(JSON.stringify(KEY_DEFAULT)) },
      unlocks: { clothes: [], skins: ['plain'], perks: [], variants: {}, lamp: false },
      equip: { clothes: {}, skin: 'plain', perks: [], variant: {} },
      group: DEFAULT_GROUP.slice(),
      ach: {}, embers: 0, tutorialDone: false, story: null, storyBest: 0,
      stats: { nights: 0, days: 0, runs: 0, wins: 0, kind: 0, spotted: 0, loot: 0, close: 0 },
      scores: {}, daily: {}, album: [], last: {}, heard: { menu: 1 }
    };
  },
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { this.ok = false; }
    this.data = deepMerge(this.defaults(), d && d.v === 1 ? d : null);
    if (DEBUG) { this.data.unlocks.lamp = true; this.data.embers = Math.max(this.data.embers, 999); this.data.tutorialDone = true; }
  },
  write() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { this.ok = false; } },
  get s() { return this.data.settings; },
  score(mode, v) { const s = this.data.scores; if (!(s[mode] >= v)) { s[mode] = v; return true; } return false; }
};

/* ==========================================================================
   SECTION 4: ANIMATION TOOLKIT (easing, tween manager with chaining, springs)
   ========================================================================== */
const Ease = {
  linear: t => t,
  inOutQuad: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outCubic: t => 1 - Math.pow(1 - t, 3), inCubic: t => t * t * t,
  outBack: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  outElastic: t => (t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1),
  bounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; }
};
const Tw = {
  list: [],
  /* Tw.add(obj, 'prop', to, seconds, ease, callback).then(...) chains another tween after it. */
  add(o, p, to, dur, ease, cb) {
    const t = this._mk(o, p, to, dur, ease, cb); t.from = num(o[p]); this.list.push(t); return t;
  },
  _mk(o, p, to, dur, ease, cb) {
    const self = this;
    return { o, p, from: 0, to, dur: Math.max(0.001, dur), t: 0, ease: ease || Ease.inOutQuad, cb, next: null,
      then(o2, p2, to2, d2, e2, cb2) { this.next = self._mk(o2, p2, to2, d2, e2, cb2); return this.next; } };
  },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const t = this.list[i]; t.t += dt; const k = clamp(t.t / t.dur, 0, 1);
      t.o[t.p] = t.from + (t.to - t.from) * t.ease(k);
      if (k >= 1) { this.list.splice(i, 1); if (t.cb) t.cb(); if (t.next) { t.next.from = num(t.next.o[t.next.p]); this.list.push(t.next); } }
    }
  },
  kill(o) { this.list = this.list.filter(t => t.o !== o); }
};
/* Damped spring for floppy parts: scarves, hair, coat hems, laundry, lamp shades, UI wobble. */
class Spring {
  constructor(x, k, d) { this.x = x || 0; this.v = 0; this.t = x || 0; this.k = k || 120; this.d = d || 12; }
  step(dt) { const a = -this.k * (this.x - this.t) - this.d * this.v; this.v += a * dt; this.x += this.v * dt; if (!Number.isFinite(this.x)) { this.x = this.t; this.v = 0; } return this.x; }
  kick(v) { this.v += v; }
}

/* ==========================================================================
   SECTION 5: INPUT (keyboard, gamepad, touch unified into abstract actions)
   ========================================================================== */
const ACTIONS = ['left', 'right', 'up', 'down', 'interact', 'use', 'crouch', 'light', 'sprint', 'sw', 'inv', 'pause', 'jump'];
const PAD_BTN = { interact: 0, crouch: 1, use: 2, inv: 3, swPrev: 4, sw: 5, light: 6, sprint: 7, pause: 9 };
const PAD_GLYPH = { interact: 'A', crouch: 'B', use: 'X', inv: 'Y', sw: 'RB', light: 'LT', sprint: 'RT', pause: 'Start', left: 'L-stick', right: 'L-stick', up: 'Up', down: 'Down', jump: 'Up' };
const TOUCH_GLYPH = { interact: 'HAND', crouch: 'DUCK', use: 'USE', inv: 'BOOK', sw: 'SWAP', light: 'LAMP', sprint: 'push far', pause: 'II', left: 'stick', right: 'stick', up: 'stick up', down: 'stick down', jump: 'stick up' };
const KONAMI = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right'];

const Input = {
  dev: {}, keys: {}, last: 'kb', lastDev: 'main', touch: false,
  ptr: { x: 0, y: 0, down: false, click: false, clickBuf: false, moved: false },
  menu: { up: false, down: false, left: false, right: false, ok: false, back: false, any: false }, menuBuf: {},
  numBuf: 0, num: 0, capture: null, seq: [], konami: false,
  joy: { id: -1, ox: 0, oy: 0, x: 0, y: 0, on: false }, tbtn: [], tHeld: {}, tPtr: {}, tAnim: {},
  wantControls: false, padRepeat: [0, 0, 0, 0], padPrev: [{}, {}, {}, {}],
  mkDev() { return { mx: 0, my: 0, held: {}, press: {}, buf: {}, conn: false }; },

  init(canvas) {
    this.canvas = canvas;
    this.dev.main = this.mkDev(); this.dev.main.conn = true;
    for (let i = 0; i < 4; i++) this.dev['pad' + i] = this.mkDev();
    try { if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) this.touch = true; } catch (e) { /* no matchMedia */ }
    window.addEventListener('keydown', e => this.onKey(e, true));
    window.addEventListener('keyup', e => this.onKey(e, false));
    window.addEventListener('blur', () => this.clearAll());
    canvas.addEventListener('pointerdown', e => this.onPtr(e, 0));
    canvas.addEventListener('pointermove', e => this.onPtr(e, 1));
    canvas.addEventListener('pointerup', e => this.onPtr(e, 2));
    canvas.addEventListener('pointercancel', e => this.onPtr(e, 2));
    window.addEventListener('touchcancel', () => this.clearTouch());
    const stop = e => { e.preventDefault(); };
    canvas.addEventListener('contextmenu', stop);
    document.addEventListener('gesturestart', stop);
    document.addEventListener('touchmove', stop, { passive: false });
    document.addEventListener('dblclick', stop);
    window.addEventListener('gamepaddisconnected', e => { const d = this.dev['pad' + e.gamepad.index]; if (d) { d.conn = false; Bus.emit('padLost', { dev: 'pad' + e.gamepad.index }); } });
    this.layoutTouch();
  },
  clearAll() {
    this.keys = {};
    for (const k in this.dev) { const d = this.dev[k]; d.mx = d.my = 0; d.held = {}; d.buf = {}; d.press = {}; }
    this.clearTouch();
  },
  clearTouch() { this.joy.on = false; this.joy.id = -1; this.joy.x = this.joy.y = 0; this.tHeld = {}; this.tPtr = {}; this.ptr.down = false; },

  onKey(e, down) {
    const code = e.code || '';
    if (down && this.capture) { e.preventDefault(); const c = this.capture; this.capture = null; c(code); return; }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'Backspace'].indexOf(code) >= 0 || code === 'F3') e.preventDefault();
    if (down) {
      this.last = 'kb'; this.lastDev = 'main'; this.menuBuf.any = true;
      Bus.emit('firstInput');
      if (!e.repeat) {
        if (code === 'KeyM') Bus.emit('toggleMute');
        if (code === 'F3') Bus.emit('toggleDebug');
        if (code === 'KeyR') Bus.emit('keyR');
        if (/^Digit[1-9]$/.test(code)) this.numBuf = +code.slice(5);
      }
      // menu navigation (arrow keys repeat naturally)
      if (code === 'ArrowUp' || code === 'KeyW') this.menuPush('up');
      if (code === 'ArrowDown' || code === 'KeyS') this.menuPush('down');
      if (code === 'ArrowLeft' || code === 'KeyA') this.menuPush('left');
      if (code === 'ArrowRight' || code === 'KeyD') this.menuPush('right');
      if (!e.repeat && (code === 'Enter' || code === 'Space' || code === 'KeyE' || code === 'NumpadEnter')) this.menuBuf.ok = true;
      if (!e.repeat && (code === 'Escape' || code === 'Backspace')) this.menuBuf.back = true;
    }
    const keys = Save.s.keys;
    for (const a in keys) {
      if (keys[a].indexOf(code) >= 0) {
        if (down && !this.keys[code]) this.dev.main.buf[a] = true;
      }
    }
    this.keys[code] = down;
  },
  menuPush(dir) { this.menuBuf[dir] = true; this.seq.push(dir); if (this.seq.length > 8) this.seq.shift(); if (this.seq.join() === KONAMI.join()) { this.konami = true; this.seq = []; } },

  /* --- touch layout: thumb arc on the right, floating stick on the left --- */
  layoutTouch() {
    const k = clamp(num(Save.data ? Save.s.btnSize : 1, 1), 0.7, 1.5);
    const bx = W - 62, by = H - 74;
    this.tbtn = [
      { id: 'interact', x: bx, y: by, r: 42 * k, label: 'HAND' },
      { id: 'use', x: bx - 96 * k, y: by + 26, r: 34 * k, label: 'USE' },
      { id: 'crouch', x: bx - 78 * k, y: by - 62 * k, r: 34 * k, label: 'DUCK' },
      { id: 'light', x: bx + 6, y: by - 98 * k, r: 34 * k, label: 'LAMP' },
      { id: 'sw', x: bx - 150 * k, y: by - 34 * k, r: 24 * k, label: 'SWAP', small: true },
      { id: 'inv', x: bx - 62 * k, y: by - 132 * k, r: 24 * k, label: 'BOOK', small: true },
      { id: 'pause', x: W - 30, y: 30, r: 20, label: 'II', small: true }
    ];
  },
  toLogical(e) { const r = this.canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / Math.max(1, r.width), y: (e.clientY - r.top) * H / Math.max(1, r.height) }; },
  onPtr(e, phase) {
    if (e.cancelable) e.preventDefault();
    const p = this.toLogical(e), isTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
    Bus.emit('firstInput');
    if (phase === 0) {
      if (isTouch) { if (!this.touch) this.layoutTouch(); this.touch = true; this.last = 'touch'; } else if (this.last === 'touch') this.last = 'kb';
      this.lastDev = 'main'; this.menuBuf.any = true;
      try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* capture is optional */ }
      try { if (document.activeElement !== this.canvas) this.canvas.focus({ preventScroll: true }); } catch (err) { /* focus is optional */ }   // keyboard works after a click when embedded in a page
      // gameplay touch controls take priority when the scene asks for them
      if (this.wantControls && (isTouch || this.touch)) {
        for (const b of this.tbtn) {
          if (Math.hypot(p.x - b.x, p.y - b.y) <= b.r + 6) {
            this.tPtr[e.pointerId] = b.id; this.tHeld[b.id] = true; this.dev.main.buf[b.id] = true; this.tAnim[b.id] = 1;
            Bus.emit('uiTap', { x: b.x, y: b.y }); return;
          }
        }
        if (isTouch && p.x < W * 0.45 && p.y > 70 && this.joy.id < 0) { this.joy.id = e.pointerId; this.joy.on = true; this.joy.ox = p.x; this.joy.oy = p.y; this.joy.x = this.joy.y = 0; return; }
      }
      this.ptr.x = p.x; this.ptr.y = p.y; this.ptr.down = true; this.ptr.clickBuf = true;
    } else if (phase === 1) {
      if (e.pointerId === this.joy.id) {
        let dx = p.x - this.joy.ox, dy = p.y - this.joy.oy; const m = Math.hypot(dx, dy), R = 46;
        if (m > R) { this.joy.ox += dx * (1 - R / m) * 0.5; this.joy.oy += dy * (1 - R / m) * 0.5; dx = p.x - this.joy.ox; dy = p.y - this.joy.oy; }
        this.joy.x = clamp(dx / R, -1, 1); this.joy.y = clamp(dy / R, -1, 1); return;
      }
      if (this.tPtr[e.pointerId]) return;
      this.ptr.x = p.x; this.ptr.y = p.y; this.ptr.moved = true;
    } else {
      if (e.pointerId === this.joy.id) { this.joy.id = -1; this.joy.on = false; this.joy.x = this.joy.y = 0; return; }
      const b = this.tPtr[e.pointerId];
      if (b) { delete this.tPtr[e.pointerId]; let still = false; for (const k in this.tPtr) if (this.tPtr[k] === b) still = true; if (!still) this.tHeld[b] = false; return; }
      this.ptr.down = false;
    }
  },

  /* --- gamepads: polled every frame, up to 4, hot-plug safe --- */
  pollPads(dt) {
    let pads = [];
    try { pads = navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) { pads = []; }
    for (let i = 0; i < 4; i++) {
      const p = pads && pads[i], d = this.dev['pad' + i];
      if (!p || !p.connected) { if (d.conn) { d.conn = false; d.mx = d.my = 0; d.held = {}; Bus.emit('padLost', { dev: 'pad' + i }); } continue; }
      if (!d.conn) { d.conn = true; Bus.emit('padFound', { dev: 'pad' + i }); }
      const prev = this.padPrev[i], b = p.buttons || [], ax = p.axes || [];
      let x = num(ax[0]), y = num(ax[1]); const m = Math.hypot(x, y);
      if (m < 0.2) { x = 0; y = 0; } else { const k = Math.pow(clamp((m - 0.2) / 0.8, 0, 1), 1.25) / m; x *= k; y *= k; }   // radial deadzone with smooth ramp
      const bp = n => !!(b[n] && (b[n].pressed || b[n].value > 0.5));
      if (bp(14)) x = -1; if (bp(15)) x = 1; if (bp(12)) y = -1; if (bp(13)) y = 1;
      d.mx = x; d.my = y;
      let active = m >= 0.5;
      for (const a in PAD_BTN) {
        const on = bp(PAD_BTN[a]);
        if (on && !prev[a]) { d.buf[a] = true; active = true; }
        d.held[a] = on; prev[a] = on;
      }
      // menu flags with repeat
      const dirs = { up: y < -0.5, down: y > 0.5, left: x < -0.5, right: x > 0.5 };
      let anyDir = false;
      for (const k in dirs) {
        if (dirs[k]) { anyDir = true; if (!prev['m' + k]) { this.menuPush(k); this.padRepeat[i] = 0.38; d.buf[k] = true; } else if (this.padRepeat[i] <= 0) { this.menuBuf[k] = true; this.padRepeat[i] = 0.13; } }
        prev['m' + k] = dirs[k];
      }
      if (anyDir) this.padRepeat[i] -= dt;
      if (d.buf.interact) this.menuBuf.ok = true;
      if (d.buf.crouch) this.menuBuf.back = true;
      if (d.buf.pause) this.menuBuf.pauseBtn = true;
      if (active) { this.last = 'pad'; this.lastDev = 'pad' + i; this.menuBuf.any = this.menuBuf.any || !!Object.keys(d.buf).length; Bus.emit('firstInput'); }
    }
  },

  /* Called at the start of each fixed update step: latches "pressed this step" edges. */
  beginStep() {
    const m = this.dev.main, keys = Save.s.keys;
    for (const a of ACTIONS) { let h = false; const ks = keys[a] || []; for (let i = 0; i < ks.length; i++) if (this.keys[ks[i]]) h = true; m.held[a] = h || !!this.tHeld[a]; }
    let mx = (m.held.right ? 1 : 0) - (m.held.left ? 1 : 0), my = (m.held.down ? 1 : 0) - (m.held.up ? 1 : 0);
    if (this.joy.on) { if (Math.abs(this.joy.x) > 0.22) mx = this.joy.x; if (Math.abs(this.joy.y) > 0.5) my = this.joy.y; m.held.sprint = m.held.sprint || Math.abs(this.joy.x) > 0.93; }
    m.mx = mx; m.my = my;
    const ju = this.joy.on && this.joy.y < -0.6; if (ju && !this.joyUp) m.buf.up = true; this.joyUp = ju;   // stick-up edge (jump / climb)
    for (const k in this.dev) { const d = this.dev[k]; d.press = d.buf; d.buf = {}; }
    this.menu = this.menuBuf; this.menuBuf = {};
    this.ptr.click = this.ptr.clickBuf; this.ptr.clickBuf = false;
    this.num = this.numBuf; this.numBuf = 0;
    for (const k in this.tAnim) this.tAnim[k] = Math.max(0, this.tAnim[k] - 0.08);
  },

  /* Merged view of the devices a player owns. p = { devs: ['main','pad0'] } */
  state(devs) {
    const out = { mx: 0, my: 0, held: {}, press: {} };
    for (let i = 0; i < devs.length; i++) {
      const d = this.dev[devs[i]]; if (!d || !d.conn) continue;
      if (Math.abs(d.mx) > Math.abs(out.mx)) out.mx = d.mx;
      if (Math.abs(d.my) > Math.abs(out.my)) out.my = d.my;
      for (const a in d.held) if (d.held[a]) out.held[a] = true;
      for (const a in d.press) if (d.press[a]) out.press[a] = true;
    }
    return out;
  },
  glyph(a) {
    if (this.last === 'pad') return PAD_GLYPH[a] || a;
    if (this.last === 'touch') return TOUCH_GLYPH[a] || a;
    const k = (Save.s.keys[a] || [''])[0];
    return k.replace('Key', '').replace('Arrow', '').replace('Digit', '').replace('ControlLeft', 'Ctrl').replace('ShiftLeft', 'Shift').replace('Escape', 'Esc');
  },
  /* Replace {action} tokens in tutorial text with the current device's glyphs. */
  fmt(s) { return s.replace(/\{(\w+)\}/g, (m, a) => '[' + this.glyph(a) + ']'); },
  rumble(strong, ms, dev) {
    if (!Save.s.rumble || Save.s.reduce && strong < 0.5) return;
    let pads = []; try { pads = navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) { return; }
    for (let i = 0; i < 4; i++) {
      const p = pads && pads[i]; if (!p || (dev && dev !== 'pad' + i)) continue;
      try { if (p.vibrationActuator && p.vibrationActuator.playEffect) p.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: clamp(strong, 0, 1), weakMagnitude: clamp(strong * 0.6, 0, 1) }).catch(() => {}); } catch (e) { /* rumble is optional */ }
    }
  },
  haptic(ms) { if (this.last !== 'touch' || !Save.s.haptics) return; try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* optional */ } }
};
