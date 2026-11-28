// ---------- core: constants, rng, data tables, persistence ----------
const T = 16, TAU = Math.PI * 2, STEP = 1 / 60;
const ECHO_SPEED = 26 * T;          // px per second
const FINAL_DEPTH = 8;
const VERSION = '1.2.0';
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const hyp = Math.hypot;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
class RNG {
  constructor(seed) { this.r = mulberry32(seed >>> 0); }
  next() { return this.r(); }
  range(a, b) { return a + (b - a) * this.r(); }
  int(a, b) { return a + Math.floor(this.r() * (b - a + 1)); }
  pick(a) { return a[Math.floor(this.r() * a.length)]; }
}
function todayStr() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const DEPTH_NAMES = ['', 'The Mouth', 'Dripping Gallery', 'Root Hollows', 'The Drowned Choir', 'Saltworks', 'Bone Garden', 'The Long Throat', 'The Hollow Heart'];
const depthName = (r) => (r.mode !== 'endless' && r.depth <= FINAL_DEPTH) ? DEPTH_NAMES[r.depth] : (r.depth <= FINAL_DEPTH ? DEPTH_NAMES[r.depth] : 'Below Below');

// depth -> lost song index
const SONG_DEPTHS = { 2: 0, 4: 1, 5: 2, 7: 3 };
const SONG_TEXT = [
  'Before the water, we sang the walls into being.',
  'Every voice was a lantern. Every answer was a door.',
  'The deep did not steal our song. It listened, and it learned.',
  'Sing back to what listens, and it will remember it was once us.'
];

const COL = {
  enemy: [255, 88, 64], moth: [255, 204, 112], shard: [190, 164, 255], bell: [112, 232, 214],
  song: [255, 228, 240], kin: [255, 196, 170], mute: [170, 40, 48], danger: [255, 70, 50]
};
const PALETTES = {
  bone: { name: 'Bone', c: [222, 233, 228], req: 0 },
  ember: { name: 'Ember', c: [255, 186, 120], req: 150 },
  verdigris: { name: 'Verdigris', c: [128, 232, 190], req: 400 },
  frost: { name: 'Frost', c: [156, 204, 255], req: 800 },
  chorus: { name: 'Chorus', c: [255, 238, 196], ending: 'chorus' }
};
const DIFFS = {
  gentle: { name: 'Gentle', hearts: 4, enemySpeed: 0.82, hearMul: 0.8, enemyCount: 0.7, desc: 'Four wings. Slower, duller hunters.' },
  standard: { name: 'Standard', hearts: 3, enemySpeed: 1, hearMul: 1, enemyCount: 1, desc: 'Three wings. The dark as intended.' },
  cruel: { name: 'Cruel', hearts: 2, enemySpeed: 1.16, hearMul: 1.25, enemyCount: 1.35, noHint: true, desc: 'Two wings. Sharper ears. No guiding mark.' }
};
const BOONS = [
  { id: 'far_call', name: 'Far Call', desc: 'Your calls reach a quarter farther.', max: 2 },
  { id: 'soft_wings', name: 'Soft Wings', desc: 'Flying makes a third less noise.', max: 2 },
  { id: 'long_memory', name: 'Long Memory', desc: 'Echoes and remembered walls linger twice as long.', max: 1 },
  { id: 'quick_throat', name: 'Quick Throat', desc: 'Call again sooner.', max: 2 },
  { id: 'deep_breath', name: 'Deep Breath', desc: 'Held calls charge much faster.', max: 1 },
  { id: 'thick_hide', name: 'Thick Hide', desc: 'One more wing, and it arrives whole.', max: 2 },
  { id: 'mending', name: 'Mending', desc: 'Every wing restored, now.', max: 99, cond: r => r.hearts < r.maxHearts },
  { id: 'moth_lure', name: 'Moth Lure', desc: 'Moths drift toward you instead of away.', max: 1 },
  { id: 'sharp_ear', name: 'Sharp Ear', desc: 'A hunter that clicks shows where it is.', max: 1 },
  { id: 'ghost_dash', name: 'Ghost Dart', desc: 'Darting is silent and recovers sooner.', max: 1 },
  { id: 'shard_sense', name: 'Shard Sense', desc: 'Unclaimed shards hum on their own.', max: 1 },
  { id: 'shriek', name: 'Shriek', desc: 'A fully held call stuns hunters close by.', max: 1 }
];
const ACH = [
  { id: 'first_light', name: 'First Light', desc: 'Clear the first depth.' },
  { id: 'halfway', name: 'Halfway Down', desc: 'Clear depth four.' },
  { id: 'return', name: 'The Return', desc: 'Escape the Hollow Heart.' },
  { id: 'chorus', name: 'Chorus', desc: 'Sing to what listens.' },
  { id: 'verse', name: 'A Verse Remembered', desc: 'Find a lost song.' },
  { id: 'all_verses', name: 'Every Verse', desc: 'Carry all four lost songs in one descent.' },
  { id: 'untouched', name: 'Untouched', desc: 'Clear a depth without being hurt.' },
  { id: 'whisper', name: 'Whisper', desc: 'Clear a depth with five calls or fewer.' },
  { id: 'swift', name: 'Swift Descent', desc: 'Clear a depth in under 75 seconds.' },
  { id: 'close_call', name: 'By a Wing', desc: 'Clear a depth with one wing left.' },
  { id: 'glutton', name: 'Moth Feast', desc: 'Gather 40 moths in one descent.' },
  { id: 'shriek3', name: 'Shriek', desc: 'Stun three hunters with one call.' },
  { id: 'decoy', name: 'Decoy', desc: 'Send a hunter after a bellflower.' },
  { id: 'abyss', name: 'Below Below', desc: 'Reach depth 12 in the endless deep.' },
  { id: 'cruel', name: 'Unkind Dark', desc: 'Escape on Cruel.' },
  { id: 'kin6', name: 'Nobody Left Behind', desc: 'Find all six of the colony\u2019s lost.' },
  { id: 'homecoming', name: 'Homecoming', desc: 'Bring everyone home, and sing.' }
];

const SAVE_KEY = 'listening-dark-save-v1', BAK_KEY = SAVE_KEY + '-bak';
const MODES = ['story', 'descent', 'daily', 'endless'];
const int = (v, d = 0) => Number.isFinite(+v) ? Math.floor(+v) : d;
// Every run that comes out of storage is checked and repaired, so a bad save can never crash a level.
function validRun(r) {
  if (!r || typeof r !== 'object' || !MODES.includes(r.mode) || !DIFFS[r.diff]) return null;
  const out = {
    v: 2, mode: r.mode, diff: r.diff, seed: int(r.seed) >>> 0, replay: !!r.replay,
    depth: clamp(int(r.depth, 1), 1, r.mode === 'endless' ? 999 : FINAL_DEPTH),
    maxHearts: clamp(int(r.maxHearts, DIFFS[r.diff].hearts), 1, 9), hearts: 1,
    boons: {}, moths: Math.max(0, int(r.moths)), mothMeter: clamp(int(r.mothMeter), 0, 12),
    songs: [...new Set((Array.isArray(r.songs) ? r.songs : []).map(x => int(x, -1)).filter(x => x >= 0 && x < 4))],
    kin: [...new Set((Array.isArray(r.kin) ? r.kin : []).map(x => int(x, -1)).filter(x => x >= 0 && x < 6))],
    sang: !!r.sang, date: typeof r.date === 'string' ? r.date.slice(0, 10) : todayStr(),
    stats: { pings: Math.max(0, int(r.stats && r.stats.pings)), time: Math.max(0, +(r.stats && r.stats.time) || 0), stuns: Math.max(0, int(r.stats && r.stats.stuns)), hurt: Math.max(0, int(r.stats && r.stats.hurt)) }
  };
  out.hearts = clamp(int(r.hearts, out.maxHearts), 1, out.maxHearts);
  if (r.boons && typeof r.boons === 'object') for (const b of BOONS) { const n = int(r.boons[b.id]); if (n > 0 && b.id !== 'mending') out.boons[b.id] = Math.min(n, b.max); }
  return out;
}
const Store = {
  data: null, persistent: true, recovered: false,
  defaults() {
    return {
      v: 2,
      settings: {
        master: 0.8, music: 0.6, sfx: 0.85, amb: 0.7, uiVol: 0.6, muted: false, mono: false,
        palette: 'bone', quality: 'high', bloom: true, grain: true, shake: true, reduceFlash: false, uiScale: 1, fps: false,
        hints: true, captions: true, exitHint: true,
        vibration: true, deadzone: 0.18, prompts: 'auto', touch: 'auto'
      },
      meta: { lifetimeMoths: 0, bestDepth: 0, endings: {}, ach: {}, endlessBest: 0, runs: 0, dailyBest: {}, verses: {} },
      story: { chapters: 1, found: { kin: {}, verses: {} }, endings: {} },
      runs: { story: null, descent: null, daily: null, endless: null, replay: null }, last: null
    };
  },
  parse(str) { try { const d = JSON.parse(str); return d && typeof d === 'object' && !Array.isArray(d) ? d : null; } catch (e) { return null; } },
  load() {
    let d = null, raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); d = raw ? this.parse(raw) : null;
      if (raw && !d) { const b = localStorage.getItem(BAK_KEY); d = b ? this.parse(b) : null; this.recovered = !!d; }
    } catch (e) { this.persistent = false; d = null; }
    this.data = this.normalize(d);
  },
  normalize(d) {
    const def = this.defaults();
    if (!d) return def;
    const S = def.settings, ins = d.settings && typeof d.settings === 'object' ? d.settings : {};
    for (const k in S) if (k in ins && typeof ins[k] === typeof S[k]) S[k] = ins[k];
    for (const k of ['master', 'music', 'sfx', 'amb', 'uiVol']) S[k] = clamp(+S[k] || 0, 0, 1);
    S.deadzone = clamp(+S.deadzone || 0.18, 0.05, 0.4);
    if (![0.9, 1, 1.15, 1.3].includes(S.uiScale)) S.uiScale = 1;
    if (!PALETTES[S.palette]) S.palette = 'bone';
    for (const [k, o] of [['quality', ['high', 'low']], ['prompts', ['auto', 'xbox', 'ps', 'keyboard']], ['touch', ['auto', 'on', 'off']]]) if (!o.includes(S[k])) S[k] = o[0];
    const M = def.meta, inm = d.meta && typeof d.meta === 'object' ? d.meta : {};
    for (const k of ['lifetimeMoths', 'bestDepth', 'endlessBest', 'runs']) M[k] = Math.max(0, int(inm[k]));
    for (const k of ['endings', 'ach', 'dailyBest', 'verses']) if (inm[k] && typeof inm[k] === 'object' && !Array.isArray(inm[k])) M[k] = inm[k];
    const st = d.story && typeof d.story === 'object' ? d.story : {};
    def.story.chapters = clamp(int(st.chapters, 1), 1, FINAL_DEPTH);
    if (st.found) for (const k of ['kin', 'verses']) if (st.found[k] && typeof st.found[k] === 'object') def.story.found[k] = st.found[k];
    if (st.endings && typeof st.endings === 'object') def.story.endings = st.endings;
    // version 1 kept a single run; move it into its mode's slot
    if (d.run) { const r = validRun(d.run); if (r) { def.runs[r.mode] = r; def.last = r.mode; } }
    if (d.runs && typeof d.runs === 'object') for (const k of Object.keys(def.runs)) def.runs[k] = validRun(d.runs[k]);
    if (def.runs.replay) def.runs.replay.replay = true;
    def.last = typeof d.last === 'string' && def.runs[d.last] ? d.last : (def.last && def.runs[def.last] ? def.last : null);
    return def;
  },
  save() {
    try {
      const prev = localStorage.getItem(SAVE_KEY);
      if (prev && this.parse(prev)) localStorage.setItem(BAK_KEY, prev);
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); return true;
    } catch (e) { this.persistent = false; return false; }
  }
};
function paletteUnlocked(id) {
  const p = PALETTES[id], m = Store.data.meta;
  return p.ending ? !!m.endings[p.ending] : m.lifetimeMoths >= p.req;
}

// device-aware button prompts
const GLYPHS = {
  kb: { call: 'Space', dart: 'E', glide: 'Shift', pause: 'Esc', move: 'WASD', confirm: 'Enter', back: 'Esc', tab: 'Q E', adjust: '← →', nav: '↑ ↓', any: 'any key' },
  xbox: { call: 'A', dart: 'B', glide: 'LB', pause: 'Menu', move: 'L stick', confirm: 'A', back: 'B', tab: 'LB RB', adjust: 'D-pad ← →', nav: 'D-pad', any: 'A' },
  ps: { call: '✕', dart: '○', glide: 'L1', pause: 'Options', move: 'L stick', confirm: '✕', back: '○', tab: 'L1 R1', adjust: 'D-pad ← →', nav: 'D-pad', any: '✕' },
  touch: { call: 'CALL', dart: 'DART', glide: 'light touch', pause: 'II', move: 'left side', confirm: 'Tap', back: 'Back', tab: 'Tap', adjust: 'Tap', nav: 'Tap', any: 'Tap' }
};
// settings menu model
const pct = v => Math.round(v * 100) + '%';
const SETTINGS = [
  { id: 'sound', name: 'Sound', rows: [
    { k: 'master', type: 'slider', label: 'Master volume', min: 0, max: 1, step: 0.05, fmt: pct },
    { k: 'music', type: 'slider', label: 'Music', min: 0, max: 1, step: 0.05, fmt: pct },
    { k: 'sfx', type: 'slider', label: 'Effects', min: 0, max: 1, step: 0.05, fmt: pct },
    { k: 'amb', type: 'slider', label: 'Cave ambience', min: 0, max: 1, step: 0.05, fmt: pct },
    { k: 'uiVol', type: 'slider', label: 'Interface', min: 0, max: 1, step: 0.05, fmt: pct },
    { k: 'muted', type: 'toggle', label: 'Mute everything' },
    { k: 'mono', type: 'toggle', label: 'Mono audio', note: 'For one ear or one speaker. Sound cues still show direction on screen.' }
  ] },
  { id: 'display', name: 'Display', rows: [
    { k: 'palette', type: 'choice', label: 'Echo colour', opts: () => Object.keys(PALETTES).filter(paletteUnlocked), fmt: v => PALETTES[v].name },
    { k: 'quality', type: 'choice', label: 'Quality', opts: () => ['high', 'low'], fmt: v => v === 'high' ? 'High' : 'Low, for slower devices' },
    { k: 'bloom', type: 'toggle', label: 'Glow' },
    { k: 'grain', type: 'toggle', label: 'Film grain' },
    { k: 'shake', type: 'toggle', label: 'Screen shake' },
    { k: 'reduceFlash', type: 'toggle', label: 'Soften flashes' },
    { k: 'uiScale', type: 'choice', label: 'Text size', opts: () => [0.9, 1, 1.15, 1.3], fmt: pct },
    { k: 'fps', type: 'toggle', label: 'Frame counter' }
  ] },
  { id: 'play', name: 'Play', rows: [
    { k: 'hints', type: 'toggle', label: 'First-time hints' },
    { k: 'captions', type: 'toggle', label: 'Show sounds on screen', note: 'Arcs around the bat point to every sound you hear.' },
    { k: 'exitHint', type: 'toggle', label: 'Point toward the open way', note: 'Never shown on Cruel.' },
    { k: 'erase', type: 'action', label: 'Erase all progress', danger: true }
  ] },
  { id: 'controls', name: 'Controls', rows: [
    { k: 'vibration', type: 'toggle', label: 'Controller vibration' },
    { k: 'deadzone', type: 'slider', label: 'Stick dead zone', min: 0.05, max: 0.4, step: 0.01, fmt: pct },
    { k: 'prompts', type: 'choice', label: 'Button prompts', opts: () => ['auto', 'xbox', 'ps', 'keyboard'], fmt: v => ({ auto: 'Match my device', xbox: 'Xbox', ps: 'PlayStation', keyboard: 'Keyboard' })[v] },
    { k: 'touch', type: 'choice', label: 'Touch controls', opts: () => ['auto', 'on', 'off'], fmt: v => ({ auto: 'Automatic', on: 'Always', off: 'Never' })[v] }
  ] }
];
