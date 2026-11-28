
/* ==========================================================================
   SECTION 13: UI TOOLKIT - paper panels, icons, menus, dialogs, toasts
   Everything is drawn on the canvas in the shared charcoal-and-paper style.
   ========================================================================== */
const UI = {
  /* Torn-paper panel with a stitched inner border. Edges are jittered from a stable hash. */
  paper(ctx, x, y, w, h, o) {
    o = o || {}; const r = new RNG(hashStr(Math.round(w) + ':' + Math.round(h) + ':' + (o.seed || 1))), j = o.jit == null ? 3 : o.jit;
    ctx.save();
    if (o.rot) { ctx.translate(x + w / 2, y + h / 2); ctx.rotate(o.rot); ctx.translate(-x - w / 2, -y - h / 2); }
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x + 4, y + 5, w, h);
    ctx.beginPath();
    const step = 26; let first = true;
    const pt = (px, py) => { if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py); };
    for (let i = 0; i <= w; i += step) pt(x + Math.min(i, w), y + r.r(-j, j) * 0.6);
    for (let i = step; i <= h; i += step) pt(x + w + r.r(-j, j) * 0.5, y + Math.min(i, h));
    for (let i = w; i >= 0; i -= step) pt(x + Math.max(i, 0), y + h + r.r(-j, j) * 0.6);
    for (let i = h - step; i >= 0; i -= step) pt(x + r.r(-j, j) * 0.5, y + Math.max(i, 0));
    ctx.closePath();
    const hc = Save.s.contrast;
    ctx.fillStyle = o.dark ? (hc ? G.black : G.soot) : (hc ? G.white : G.paper); ctx.fill();
    if (!hc && w * h > 2400) {                                   // paper fibre and a soft light falloff, clipped to the torn edge
      ctx.save(); ctx.clip(); const tex = UI.fibre(o.dark); if (tex) { ctx.fillStyle = tex; ctx.fillRect(x, y, w, h); }
      const lg = ctx.createLinearGradient(x, y, x, y + h); lg.addColorStop(0, o.dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.18)'); lg.addColorStop(1, 'rgba(0,0,0,' + (o.dark ? 0.18 : 0.08) + ')'); ctx.fillStyle = lg; ctx.fillRect(x, y, w, h); ctx.restore();
    }
    ctx.strokeStyle = o.dark ? G.stone : G.ash; ctx.lineWidth = 1; ctx.stroke();
    if (!o.dark && !o.plain && w > 160 && h > 80) {               // two strips of masking tape hold the sheet up
      for (const [tx, rot] of [[x + 22, -0.5], [x + w - 22, 0.5]]) { ctx.save(); ctx.translate(tx, y + 2); ctx.rotate(rot); ctx.fillStyle = 'rgba(232,228,214,0.78)'; ctx.fillRect(-16, -6, 32, 12); ctx.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = -14; i < 16; i += 4) ctx.fillRect(i, -6, 1, 12); ctx.restore(); }
    }
    if (!o.plain) { ctx.setLineDash([5, 4]); ctx.strokeStyle = o.dark ? grey(120, 0.5) : grey(60, 0.45); ctx.strokeRect(x + 6, y + 6, w - 12, h - 12); ctx.setLineDash([]); }
    ctx.restore();
  },
  /* Cached paper-fibre patterns (light and dark), built once. */
  fibre(dark) {
    const k = dark ? '_fd' : '_fl'; if (this[k] !== undefined) return this[k];
    try {
      const cv = document.createElement('canvas'); cv.width = cv.height = 96; const g = cv.getContext('2d'), r = new RNG(dark ? 7 : 3);
      for (let i = 0; i < 260; i++) { g.fillStyle = dark ? 'rgba(255,255,255,' + r.r(0.01, 0.05) + ')' : 'rgba(0,0,0,' + r.r(0.015, 0.06) + ')'; g.save(); g.translate(r.r(0, 96), r.r(0, 96)); g.rotate(r.r(0, TAU)); g.fillRect(0, 0, r.r(2, 9), 0.7); g.restore(); }
      this[k] = Render.ctx.createPattern(cv, 'repeat');
    } catch (e) { this[k] = null; }
    return this[k];
  },
  /* Small stitched-style icons. Each need has its own shape, so nothing relies on color. */
  icon(ctx, kind, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 10, s / 10); ctx.strokeStyle = col || G.bone; ctx.fillStyle = col || G.bone; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    switch (kind) {
      case 'hunger': ctx.arc(0, -1, 5, 0, Math.PI); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-2, -4); ctx.lineTo(-2, -7); ctx.moveTo(2, -4); ctx.lineTo(2, -7); ctx.stroke(); break;
      case 'fatigue': ctx.arc(0, 0, 5, 0.6, Math.PI * 1.9); ctx.arc(2.4, -1.6, 4.2, Math.PI * 1.72, 0.8, true); ctx.closePath(); ctx.fill(); break;
      case 'cold': for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.moveTo(Math.cos(a) * 5.5, Math.sin(a) * 5.5); ctx.lineTo(-Math.cos(a) * 5.5, -Math.sin(a) * 5.5); } ctx.stroke(); break;
      case 'health': ctx.rect(-1.8, -5.5, 3.6, 11); ctx.rect(-5.5, -1.8, 11, 3.6); ctx.fill(); break;
      case 'morale': ctx.moveTo(0, 5.5); ctx.bezierCurveTo(-7, 0, -5, -6, 0, -2.5); ctx.bezierCurveTo(5, -6, 7, 0, 0, 5.5); ctx.fill(); break;
      case 'warn': ctx.moveTo(0, -6); ctx.lineTo(6.5, 5); ctx.lineTo(-6.5, 5); ctx.closePath(); ctx.stroke(); ctx.fillRect(-0.8, -2.5, 1.6, 4); ctx.fillRect(-0.8, 2.6, 1.6, 1.4); break;
      case 'noise': ctx.arc(-4, 0, 2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(-4, 0, 5, -0.7, 0.7); ctx.stroke(); ctx.beginPath(); ctx.arc(-4, 0, 8.5, -0.7, 0.7); ctx.stroke(); break;
      case 'light': ctx.ellipse(0, 0, 6.5, 3.6, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 1.8, 0, TAU); ctx.fill(); break;
      case 'battery': ctx.strokeRect(-6, -3.5, 11, 7); ctx.fillRect(5, -1.5, 2, 3); break;
      case 'pack': ctx.strokeRect(-5, -4, 10, 9.5); ctx.arc(0, -4, 3, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke(); break;
      case 'clock': ctx.arc(0, 0, 6, 0, TAU); ctx.stroke(); break;
      case 'temp': ctx.arc(0, 4, 2.6, 0, TAU); ctx.fill(); ctx.fillRect(-1, -6, 2, 9); break;
      case 'raid': ctx.strokeRect(-4, -6, 8, 12); ctx.fillRect(1.4, -0.8, 1.6, 1.6); break;
      case 'star': for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; ctx.lineTo(Math.cos(a) * 6, Math.sin(a) * 6); ctx.lineTo(Math.cos(a + TAU / 10) * 2.6, Math.sin(a + TAU / 10) * 2.6); } ctx.closePath(); ctx.fill(); break;
      case 'ember': ctx.moveTo(0, -6); ctx.quadraticCurveTo(5, -1, 3, 4); ctx.quadraticCurveTo(0, 7, -3, 4); ctx.quadraticCurveTo(-5, -1, 0, -6); ctx.fill(); break;
      case 'food': ctx.strokeRect(-4, -5, 8, 10); ctx.moveTo(-4, -2); ctx.lineTo(4, -2); ctx.stroke(); break;
      case 'water': ctx.moveTo(0, -6); ctx.quadraticCurveTo(6, 2, 0, 6); ctx.quadraticCurveTo(-6, 2, 0, -6); ctx.stroke(); break;
      case 'gear': for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.moveTo(Math.cos(a) * 4.5, Math.sin(a) * 4.5); ctx.lineTo(Math.cos(a) * 6.5, Math.sin(a) * 6.5); } ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, TAU); ctx.fill(); break;
      case 'book': ctx.moveTo(0, -4); ctx.quadraticCurveTo(-3, -6, -6.5, -5); ctx.lineTo(-6.5, 5); ctx.quadraticCurveTo(-3, 4, 0, 6); ctx.quadraticCurveTo(3, 4, 6.5, 5); ctx.lineTo(6.5, -5); ctx.quadraticCurveTo(3, -6, 0, -4); ctx.lineTo(0, 6); ctx.stroke(); break;
      case 'door': ctx.strokeRect(-4.5, -6.5, 9, 13); ctx.fillRect(1.5, -0.5, 1.6, 1.6); break;
      case 'people': ctx.arc(-3, -3, 2.3, 0, TAU); ctx.moveTo(5.3, -3); ctx.arc(3, -3, 2.3, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(-3, 5, 4, Math.PI, TAU); ctx.arc(3, 5, 4, Math.PI, TAU); ctx.fill(); break;
      case 'hanger': ctx.moveTo(0, -3); ctx.quadraticCurveTo(0, -7, 2.5, -6); ctx.moveTo(0, -3); ctx.lineTo(-7, 4); ctx.lineTo(7, 4); ctx.closePath(); ctx.stroke(); break;
      case 'grid': ctx.rect(-6, -6, 5, 5); ctx.rect(1, -6, 5, 5); ctx.rect(-6, 1, 5, 5); ctx.rect(1, 1, 5, 5); ctx.stroke(); break;
      case 'play': ctx.moveTo(-3.5, -6); ctx.lineTo(6, 0); ctx.lineTo(-3.5, 6); ctx.closePath(); ctx.fill(); break;
      case 'expand': ctx.moveTo(-6, -2); ctx.lineTo(-6, -6); ctx.lineTo(-2, -6); ctx.moveTo(2, -6); ctx.lineTo(6, -6); ctx.lineTo(6, -2); ctx.moveTo(6, 2); ctx.lineTo(6, 6); ctx.lineTo(2, 6); ctx.moveTo(-2, 6); ctx.lineTo(-6, 6); ctx.lineTo(-6, 2); ctx.stroke(); break;
      case 'sun': ctx.arc(0, 0, 3, 0, TAU); ctx.fill(); ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.moveTo(Math.cos(a) * 4.6, Math.sin(a) * 4.6); ctx.lineTo(Math.cos(a) * 6.6, Math.sin(a) * 6.6); } ctx.stroke(); break;
      case 'moon': ctx.arc(0, 0, 5.5, 0.9, Math.PI * 1.75); ctx.arc(2.6, -1.6, 4.4, Math.PI * 1.6, 0.95, true); ctx.closePath(); ctx.fill(); break;
      case 'map': ctx.moveTo(-6.5, -4.5); ctx.lineTo(-2, -6); ctx.lineTo(2, -4.5); ctx.lineTo(6.5, -6); ctx.lineTo(6.5, 4.5); ctx.lineTo(2, 6); ctx.lineTo(-2, 4.5); ctx.lineTo(-6.5, 6); ctx.closePath(); ctx.moveTo(-2, -6); ctx.lineTo(-2, 4.5); ctx.moveTo(2, -4.5); ctx.lineTo(2, 6); ctx.stroke(); break;
      case 'rain': ctx.arc(0, -2, 4.5, Math.PI, 0); ctx.arc(4, -1, 2.5, -Math.PI / 2, Math.PI / 2); ctx.lineTo(-5, 1.5); ctx.arc(-4.5, -1, 2.5, Math.PI / 2, -Math.PI / 2); ctx.fill(); ctx.beginPath(); for (let i = 0; i < 3; i++) { ctx.moveTo(-3 + i * 3, 4); ctx.lineTo(-4 + i * 3, 7); } ctx.stroke(); break;
      case 'snow': for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6); ctx.lineTo(-Math.cos(a) * 6, -Math.sin(a) * 6); } ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, TAU); ctx.fill(); break;
      case 'fog': for (let i = 0; i < 3; i++) { ctx.moveTo(-6 + (i % 2) * 2, -4 + i * 4); ctx.lineTo(6 - (i % 2) * 2, -4 + i * 4); } ctx.stroke(); break;
      case 'back': ctx.moveTo(5, 0); ctx.lineTo(-5, 0); ctx.moveTo(-1, -4); ctx.lineTo(-5, 0); ctx.lineTo(-1, 4); ctx.stroke(); break;
      default: ctx.arc(0, 0, 4, 0, TAU); ctx.fill();
    }
    ctx.restore();
  },
  /* A need bar with a shape-coded icon and a wobble spring when it changes. */
  bar(ctx, x, y, w, h, v, o) {
    o = o || {}; v = clamp(num(v) / 100, 0, 1);
    const rr = Math.min(h / 2, 3); ctx.fillStyle = o.col ? G.pewter : grey(20, 0.8); rrect(ctx, x, y, w, h, rr); ctx.fill();
    if (v > 0.01) { ctx.fillStyle = o.col ? o.col : (v < 0.2 ? G.white : G.chalk); rrect(ctx, x, y, Math.max(rr * 2, w * v), h, rr); ctx.fill(); if (h >= 4 && !o.col) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 1, y + 0.5, Math.max(0, w * v - 2), 1); } }
    if (v < 0.2 && Math.sin(Game.time * TAU * 1.5) > 0) { ctx.strokeStyle = o.col ? G.ink : G.white; ctx.lineWidth = 1; ctx.strokeRect(x - 1, y - 1, w + 2, h + 2); }
    if (Save.s.colorblind || o.ticks) { ctx.fillStyle = grey(20, 0.9); for (let i = 1; i < 4; i++) ctx.fillRect(x + w * i / 4, y, 1, h); }
  },
  /* Keycap-style glyph for an action on the current device. Returns the drawn width. */
  key(ctx, action, x, y, size) {
    const g = Input.glyph(action); size = size || 11; setFont(ctx, size); const w = Math.max(16, ctx.measureText(g).width + 10), h = size * textScale() + 8;
    const kr = Input.last === 'pad' ? h / 2 : 4; ctx.fillStyle = G.stone; rrect(ctx, x, y - h + 6, w, h, kr); ctx.fill();
    ctx.fillStyle = G.bone; rrect(ctx, x, y - h + 4, w, h, kr); ctx.fill(); ctx.strokeStyle = G.ink; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x + 3, y - h + 5.5, w - 6, 1);
    txt(ctx, g, x + w / 2, y - 1, size, G.ink, 'center', { outline: false });
    return w;
  },
  prompt(ctx, action, label, x, y, o) {
    o = o || {}; setFont(ctx, 11); const tw = ctx.measureText(label).width, g = Input.glyph(action); const kw = Math.max(16, ctx.measureText(g).width + 10), tot = kw + 6 + tw;
    const x0 = clamp(x - tot / 2, 6, W - tot - 6);
    ctx.fillStyle = grey(0, 0.6); rrect(ctx, x0 - 5, y - 15, tot + 10, 22, 5); ctx.fill();
    this.key(ctx, action, x0, y, 11); txt(ctx, label, x0 + kw + 6, y, 11, o.dis ? G.dust : G.bone, 'left');
  },
  bubble(ctx, text, x, y, a) {
    setFont(ctx, 10); const lines = wrapText(ctx, text, 150, 10), lh = 12 * textScale(); let w = 0; for (const l of lines) w = Math.max(w, ctx.measureText(l).width);
    const h = lines.length * lh + 8, bx = clamp(x - w / 2 - 6, 4, W - w - 16), by = y - h;
    const pop = Save.s.reduce ? 1 : 0.82 + 0.18 * Ease.outBack(clamp(a, 0, 1)); ctx.save(); ctx.translate(x, by + h); ctx.scale(pop, pop); ctx.translate(-x, -(by + h));
    ctx.globalAlpha = a; ctx.fillStyle = 'rgba(0,0,0,0.35)'; rrect(ctx, bx + 2, by + 3, w + 12, h, 6); ctx.fill(); ctx.fillStyle = G.bone; rrect(ctx, bx, by, w + 12, h, 6); ctx.fill(); ctx.strokeStyle = G.ink; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 4, by + h - 0.5); ctx.lineTo(x, by + h + 6); ctx.lineTo(x + 4, by + h - 0.5); ctx.fillStyle = G.bone; ctx.fill();
    lines.forEach((l, i) => txt(ctx, l, bx + 6, by + 5 + (i + 0.8) * lh, 10, G.ink, 'left', { outline: false }));
    ctx.globalAlpha = 1; ctx.restore();
  }
};

/* Icons shown beside common menu labels */
const MENU_ICONS = { 'Begin': 'play', 'The Story So Far': 'moon', 'The Long Walk': 'map', 'All Unlocked': 'star', 'Add any item': 'star', "Player's Guide": 'book', "Player's Guide (PDF)": 'book', 'Continue': 'clock', 'Story': 'book', 'Modes': 'grid', 'Survivors': 'people', 'Wardrobe': 'hanger', 'Settings': 'gear', 'Profile': 'star', 'Go Fullscreen': 'expand', 'Back': 'back', 'Resume': 'play', 'Journal and jobs': 'book', 'How to play': 'map', 'Quit to menu': 'door', 'Continue the story': 'clock', 'New story': 'book', 'Replay the first night': 'moon' };

/* --- Menu widget: keyboard, gamepad, mouse and touch all drive the same list --- */
class Menu {
  constructor(o) {
    this.o = o; this.items = o.items.slice(); this.x = o.x; this.y = o.y; this.w = o.w; this.title = o.title || ''; this.sub = o.sub || '';
    this.onBack = o.onBack || null; this.key = o.key || ''; this.cols = o.cols || 1; this.rowH = o.rowH || 28; this.maxRows = o.maxRows || 12; this.t = 0; this.scroll = 0;
    if (this.onBack && !o.noBackItem) this.items.push({ label: o.backLabel || 'Back', back: true, act: this.onBack });
    this.sel = clamp(num(Save.data.last[this.key], o.sel || 0), 0, Math.max(0, this.vis().length - 1)); this.rects = [];
    this.fix(1);
  }
  vis() { return this.items.filter(i => !(i.hidden && i.hidden())); }
  selectable(it) { return it && it.type !== 'head' && it.type !== 'text'; }
  fix(dir) { const v = this.vis(); if (!v.length) return; let n = 0; this.sel = clamp(this.sel, 0, v.length - 1); while (!this.selectable(v[this.sel]) && n++ < v.length) this.sel = (this.sel + dir + v.length) % v.length; }
  cur() { return this.vis()[this.sel]; }
  moveSel(d) { const v = this.vis(); if (!v.length) return; let n = 0; do { this.sel = (this.sel + d + v.length * 4) % v.length; } while (!this.selectable(v[this.sel]) && n++ < v.length); Snd.sfx('move'); if (this.key) Save.data.last[this.key] = this.sel; }
  adjust(it, d) {
    if (it.type === 'slider') { const st = it.step || 0.1; it.set(clamp(Math.round((it.get() + d * st) / st) * st, it.min == null ? 0 : it.min, it.max == null ? 1 : it.max)); Snd.sfx('move'); return true; }
    if (it.type === 'choice') { const c = it.choices, i = c.indexOf(it.get()); it.set(c[(i + d + c.length) % c.length]); Snd.sfx('move'); return true; }
    if (it.type === 'toggle') { it.set(!it.get()); Snd.sfx('move'); return true; }
    return false;
  }
  activate(it, r) {
    if (!it) return;
    const why = it.dis && it.dis(); if (why) { Snd.sfx('deny'); Game.toast(typeof why === 'string' ? why : 'Not available', '', 'warn'); return; }
    if (r) Parts.emit('spark', r.x + r.w / 2, r.y + r.h / 2, 6, { screen: true });
    if (it.type === 'toggle' || it.type === 'choice') { this.adjust(it, 1); return; }
    if (it.type === 'slider') return;
    Snd.sfx(it.back ? 'back' : 'select'); if (it.act) it.act(it);
  }
  update(dt) {
    this.t += dt; const M = Input.menu, v = this.vis(), it = v[this.sel];
    if (this.cols > 1) { if (M.left) this.moveSel(-1); if (M.right) this.moveSel(1); if (M.up) this.moveSel(-this.cols); if (M.down) this.moveSel(this.cols); }
    else { if (M.up) this.moveSel(-1); if (M.down) this.moveSel(1); if (it && M.left) this.adjust(it, -1); if (it && M.right) this.adjust(it, 1); }
    if (M.ok) this.activate(this.cur(), this.rects[this.sel]);
    if (M.back && this.onBack) { Snd.sfx('back'); this.onBack(); return; }
    const p = Input.ptr;
    for (let i = 0; i < this.rects.length; i++) {
      const r = this.rects[i]; if (!r || !this.selectable(v[i])) continue;
      if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
        if ((p.moved || p.click) && this.sel !== i) { this.sel = i; if (this.key) Save.data.last[this.key] = i; }
        if (p.click || (p.down && v[i].type === 'slider')) {
          if (v[i].type === 'slider') { const k = clamp((p.x - (r.x + r.w * 0.55)) / (r.w * 0.4), 0, 1), mn = v[i].min == null ? 0 : v[i].min, mx = v[i].max == null ? 1 : v[i].max, st = v[i].step || 0.1; v[i].set(clamp(Math.round((mn + k * (mx - mn)) / st) * st, mn, mx)); }
          else if (p.click) this.activate(v[i], r);
        }
      }
    }
    p.moved = false;
    const rows = Math.ceil(v.length / this.cols), selRow = Math.floor(this.sel / this.cols);
    if (selRow < this.scroll) this.scroll = selRow; if (selRow >= this.scroll + this.maxRows) this.scroll = selRow - this.maxRows + 1;
    this.scroll = clamp(this.scroll, 0, Math.max(0, rows - this.maxRows));
  }
  height() { const rows = Math.min(this.maxRows, Math.ceil(this.vis().length / this.cols)); return (this.title ? 40 : 14) + rows * this.rowH * textScale() + 14; }
  render(ctx) {
    const v = this.vis(), rh = this.rowH * textScale(), h = this.height(), x = this.x, y = this.y, w = this.w;
    if (!this.o.bare) UI.paper(ctx, x, y, w, h, { dark: true, seed: this.key.length + 3 });
    if (this.title) txt(ctx, this.title, x + 18, y + 27, 17, G.bone, 'left', { serif: true, rot: -0.008 });
    const y0 = y + (this.title ? 40 : 14), cw = (w - 20) / this.cols; this.rects = [];
    for (let i = 0; i < v.length; i++) {
      const row = Math.floor(i / this.cols) - this.scroll, col = i % this.cols; if (row < 0 || row >= this.maxRows) { this.rects[i] = null; continue; }
      const it = v[i], k = Ease.outCubic(clamp((this.t - row * 0.03) / 0.22, 0, 1)), rx = x + 10 + col * cw - (1 - k) * 24, ry = y0 + row * rh, selected = i === this.sel;
      this.rects[i] = { x: x + 10 + col * cw, y: ry, w: cw - 4, h: rh - 2 };
      ctx.globalAlpha = k;
      const label = typeof it.label === 'function' ? it.label() : it.label, dis = it.dis && it.dis();
      if (it.type === 'head') { ctx.fillStyle = G.dust; ctx.save(); ctx.translate(rx + 8, ry + rh * 0.6); ctx.rotate(Math.PI / 4); ctx.fillRect(-2.5, -2.5, 5, 5); ctx.restore(); txt(ctx, label, rx + 16, ry + rh * 0.72, 11, G.dust, 'left'); const hg = ctx.createLinearGradient(rx + 4, 0, rx + cw - 12, 0); hg.addColorStop(0, G.stone); hg.addColorStop(1, 'rgba(100,100,100,0)'); ctx.fillStyle = hg; ctx.fillRect(rx + 4, ry + rh - 3, cw - 16, 1); ctx.globalAlpha = 1; continue; }
      if (it.type === 'text') { txt(ctx, label, rx + 4, ry + rh * 0.7, 11, G.pewter, 'left', { normal: true }); ctx.globalAlpha = 1; continue; }
      if (selected) {                                              // the highlight glides between rows instead of jumping
        if (this.hy == null || Save.s.reduce || this.cols > 1) this.hy = ry; else this.hy += (ry - this.hy) * Math.min(1, (Game.rdt || 0.016) * 18);
        const pulse = 0.5 + 0.5 * Math.sin(Game.time * 3), hy = Math.abs(this.hy - ry) < 0.5 ? ry : this.hy;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(ctx, rx + 2, hy + 3, cw - 4, rh - 4, 4); ctx.fill();
        ctx.fillStyle = G.bone; rrect(ctx, rx, hy + 1, cw - 4, rh - 4, 4); ctx.fill(); ctx.strokeStyle = grey(255, 0.4 + pulse * 0.4); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = G.ink; ctx.fillRect(rx + 3, hy + 5, 3, rh - 12);
      }
      const fg = selected ? G.ink : dis ? G.stone : G.paper, ic = it.icon || MENU_ICONS[label];
      if (ic) UI.icon(ctx, ic, rx + 18, ry + rh * 0.5 - 1, 10, fg);
      txt(ctx, (selected && !ic ? '> ' : '  ') + label, rx + (ic ? 22 : 6), ry + rh * 0.7, 13, fg, 'left', { outline: false });
      const vx = rx + cw - 14;
      if (it.type === 'toggle') {                                    // a pill switch whose knob slides across
        const on = it.get(), key = '_k' + i; this[key] = this[key] == null || Save.s.reduce ? (on ? 1 : 0) : this[key] + ((on ? 1 : 0) - this[key]) * Math.min(1, (Game.rdt || 0.016) * 14); const kk = this[key], sx = vx - 26, sy = ry + rh / 2 - 7;
        ctx.fillStyle = on ? (selected ? G.ink : G.chalk) : (selected ? G.dust : G.iron); rrect(ctx, sx, sy, 26, 13, 6.5); ctx.fill(); ctx.strokeStyle = fg; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = on ? (selected ? G.bone : G.ink) : G.paper; ctx.beginPath(); ctx.arc(sx + 6.5 + kk * 13, sy + 6.5, 4.6, 0, TAU); ctx.fill();
        txt(ctx, on ? 'on' : 'off', sx - 5, ry + rh * 0.68, 9, selected ? G.iron : G.dust, 'right', { outline: false, normal: true });
      }
      else if (it.type === 'slider') { const mn = it.min == null ? 0 : it.min, mx = it.max == null ? 1 : it.max, kk = clamp((it.get() - mn) / (mx - mn), 0, 1), bx = rx + cw * 0.55, bw = cw * 0.4; ctx.fillStyle = selected ? G.ash : G.iron; rrect(ctx, bx, ry + rh / 2 - 3, bw, 5, 2.5); ctx.fill(); ctx.fillStyle = fg; rrect(ctx, bx, ry + rh / 2 - 3, Math.max(5, bw * kk), 5, 2.5); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(bx + bw * kk + 1, ry + rh / 2 + 1, 6, 0, TAU); ctx.fill(); ctx.fillStyle = selected ? G.ink : G.bone; ctx.beginPath(); ctx.arc(bx + bw * kk, ry + rh / 2 - 0.5, 6, 0, TAU); ctx.fill(); ctx.strokeStyle = selected ? G.bone : G.ink; ctx.lineWidth = 1; ctx.stroke(); txt(ctx, Math.round(kk * 100) + '%', bx - 6, ry + rh * 0.68, 9, selected ? G.iron : G.dust, 'right', { outline: false, normal: true }); }
      else if (it.type === 'choice') { const val = it.fmt ? it.fmt(it.get()) : String(it.get()); setFont(ctx, 12); const vw = ctx.measureText(val).width, nud = selected && !Save.s.reduce ? Math.sin(Game.time * 5) * 1.5 : 0; txt(ctx, val, vx - 12, ry + rh * 0.7, 12, fg, 'right', { outline: false }); ctx.fillStyle = fg; const cy = ry + rh / 2 - 1; ctx.beginPath(); ctx.moveTo(vx - 2 + nud, cy); ctx.lineTo(vx - 7 + nud, cy - 4); ctx.lineTo(vx - 7 + nud, cy + 4); ctx.fill(); ctx.beginPath(); ctx.moveTo(vx - vw - 22 - nud, cy); ctx.lineTo(vx - vw - 17 - nud, cy - 4); ctx.lineTo(vx - vw - 17 - nud, cy + 4); ctx.fill(); }
      else if (it.right) { const rv = typeof it.right === 'function' ? it.right() : it.right; txt(ctx, rv, vx, ry + rh * 0.7, 11, selected ? G.iron : G.dust, 'right', { outline: false }); }
      ctx.globalAlpha = 1;
    }
    const rows = Math.ceil(v.length / this.cols);
    if (rows > this.maxRows) { const sh = h - 60, k0 = this.scroll / rows, k1 = this.maxRows / rows; ctx.fillStyle = G.iron; rrect(ctx, x + w - 8, y + 44, 4, sh, 2); ctx.fill(); ctx.fillStyle = G.chalk; rrect(ctx, x + w - 8, y + 44 + sh * k0, 4, Math.max(8, sh * k1), 2); ctx.fill();
      if (this.scroll > 0) { const g = ctx.createLinearGradient(0, y0, 0, y0 + 14); g.addColorStop(0, 'rgba(35,35,35,0.9)'); g.addColorStop(1, 'rgba(35,35,35,0)'); ctx.fillStyle = g; ctx.fillRect(x + 8, y0, w - 18, 14); }
      if (this.scroll + this.maxRows < rows) { const yb = y0 + this.maxRows * rh, g = ctx.createLinearGradient(0, yb - 14, 0, yb); g.addColorStop(0, 'rgba(35,35,35,0)'); g.addColorStop(1, 'rgba(35,35,35,0.9)'); ctx.fillStyle = g; ctx.fillRect(x + 8, yb - 14, w - 18, 14); } }
    const it = v[this.sel], sub = it && (typeof it.sub === 'function' ? it.sub() : it.sub);
    if (sub && !this.o.noSub) { if (this.subFor !== sub) { this.subFor = sub; this.subT = 0; } this.subT = Math.min(1, num(this.subT) + (Game.rdt || 0.016) * 6); const kk = Save.s.reduce ? 1 : Ease.outCubic(this.subT), sy = y + h + 6 - (1 - kk) * 6; ctx.globalAlpha = 0.4 + 0.6 * kk; UI.paper(ctx, x, sy, w, 34 * textScale() + 6, { seed: 9, plain: true }); UI.icon(ctx, 'book', x + 14, sy + 13, 8, G.iron); txtWrap(ctx, sub, x + 24, sy + 16, w - 36, 11, G.ink, { outline: false, normal: true }); ctx.globalAlpha = 1; }
  }
}

/* --- Overlays: stacked panels that pause the scene beneath them --- */
function menuOverlay(o) {
  const m = new Menu(Object.assign({ x: W / 2 - (o.w || 380) / 2, y: o.y || 90, w: o.w || 380 }, o));
  return { menu: m, dim: o.dim == null ? 0.55 : o.dim, update(dt) { m.update(dt); }, render(ctx) { ctx.fillStyle = 'rgba(0,0,0,' + this.dim + ')'; ctx.fillRect(0, 0, W, H); ctx.drawImage(Render.vig, -W * 0.15, -H * 0.15, W * 1.3, H * 1.3); m.render(ctx); if (o.extra) o.extra(ctx, m); } };
}
/* Typewriter text with a soft voice; returns shown string. */
function typeOut(state, text, dt, cps) {
  if (state.n >= text.length) return text;
  state.acc = (state.acc || 0) + dt * (cps || 46);
  while (state.acc >= 1 && state.n < text.length) { state.acc -= 1; state.n++; if (state.n % 3 === 0 && text[state.n - 1] !== ' ') Snd.sfx('type', { f: 420 + (text.charCodeAt(state.n - 1) % 7) * 30 }); }
  return text.slice(0, state.n);
}
/* A visitor or encounter with choices. Consequences speak for themselves. */
function dialogOverlay(d, run, onDone) {
  const st = { n: 0 }, fake = { type: d.who === 'raider' || d.who === 'patrol' || d.who === 'cat' ? d.who : 'civ', T: NPCT[d.who] || NPCT.civ, face: -1, vx: 0, ph: 0, st: 'idle', aw: 0 };
  let phase = 0, result = '', menu = null, t = 0;
  const mk = () => new Menu({ x: 250, y: 300, w: 560, key: '', maxRows: 5, bare: true, noSub: true, items: d.opts.map((o, i) => ({
    label: o.l, dis: () => (o.can ? (o.can() || false) : o.need && !Run.has(run, o.need) ? 'Need: ' + Run.costText(o.need) : (o.req && !run.surv.some(s => s.id === o.req && s.present) ? 'Needs ' + SURVIVORS[o.req].short : false)),
    right: () => (o.need ? Run.costText(o.need) : ''),
    act() { result = o.fn(run, d.active) || ''; phase = 2; st.n = 0; t = 0; Bus.emit('choiceMade', { id: d.id, opt: i }); } })) });
  Snd.duck(3);
  return {
    update(dt) {
      t += dt;
      if (phase === 0) { typeOut(st, d.text, dt); if (st.n >= d.text.length || ((Input.menu.ok || Input.ptr.click) && t > 0.25)) { st.n = d.text.length; phase = 1; menu = mk(); } }
      else if (phase === 1) menu.update(dt);
      else { typeOut(st, result, dt); if ((Input.menu.ok || Input.ptr.click || Input.menu.back) && t > 0.3) { if (st.n < result.length) st.n = result.length; else { Game.pop(); if (onDone) onDone(); } } }
    },
    render(ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
      UI.paper(ctx, 130, 110, 700, 330, { seed: 4, rot: -0.004 });
      ctx.fillStyle = G.soot; rrect(ctx, 150, 130, 86, 120, 6); ctx.fill();
      if (d.surv) { ctx.save(); d.surv.special = ''; Rig.draw(ctx, d.surv, 193, 236, { scale: 1.6 }); ctx.restore(); }
      else if (d.who !== 'none') { ctx.save(); ctx.translate(193, 240); ctx.scale(d.small ? 1.3 : 1.9, d.small ? 1.3 : 1.9); Rig.drawNPC(ctx, fake, 0, 0, 1); ctx.restore(); }
      txt(ctx, d.title, 252, 152, 16, G.ink, 'left', { outline: false, serif: true });
      txtWrap(ctx, phase < 2 ? d.text.slice(0, st.n) : result.slice(0, st.n), 252, 178, 550, 12, G.coal, { outline: false, normal: phase < 2 });
      if (phase === 1 && menu) { ctx.save(); menu.render(ctx); ctx.restore(); }
      if (phase === 2 && st.n >= result.length) UI.prompt(ctx, 'interact', 'Continue', 480, 420);
    }
  };
}
/* Three-digit puzzle for the locked drawer and the safe. Clues live in the diary. */
function codeOverlay(run, idx, onOpen) {
  const rd = RIDDLES[idx], dig = [0, 0, 0]; let pos = 0, msg = '';
  return {
    update() {
      const M = Input.menu;
      if (M.left) { pos = (pos + 2) % 3; Snd.sfx('move'); } if (M.right) { pos = (pos + 1) % 3; Snd.sfx('move'); }
      if (M.up) { dig[pos] = (dig[pos] + 1) % 10; Snd.sfx('tick', { v: 2 }); } if (M.down) { dig[pos] = (dig[pos] + 9) % 10; Snd.sfx('tick', { v: 2 }); }
      const p = Input.ptr;
      if (p.click) { for (let i = 0; i < 3; i++) { const x = 400 + i * 60; if (p.x > x && p.x < x + 50) { pos = i; if (p.y > 180 && p.y < 250) { dig[i] = (dig[i] + 1) % 10; Snd.sfx('tick', { v: 2 }); } else if (p.y >= 250 && p.y < 320) { dig[i] = (dig[i] + 9) % 10; Snd.sfx('tick', { v: 2 }); } } } if (p.y > 340 && p.y < 380 && p.x > 380 && p.x < 480) M.ok = true; if (p.y > 340 && p.y < 380 && p.x >= 480 && p.x < 600) M.back = true; }
      if (M.ok) { if (dig.join() === rd.code.join()) { Snd.sfx('unlock'); Game.pop(); onOpen(); } else { msg = 'It does not budge.'; Snd.sfx('deny'); } }
      if (M.back) Game.pop();
    },
    render(ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H); UI.paper(ctx, 250, 110, 460, 300, { seed: 7 });
      txt(ctx, idx ? 'The old safe' : 'The locked drawer', 480, 146, 16, G.ink, 'center', { outline: false, serif: true });
      txtWrap(ctx, run.flags['clue' + idx] ? rd.clue : 'Three small wheels. There may be a clue somewhere in the flat.', 274, 166, 412, 10, G.iron, { outline: false, normal: true, lh: 1.25 });
      for (let i = 0; i < 3; i++) { const x = 400 + i * 60; ctx.fillStyle = i === pos ? G.ink : G.ash; rrect(ctx, x, 222, 50, 62, 6); ctx.fill(); txt(ctx, String(dig[i]), x + 25, 266, 34, G.bone, 'center', { outline: false, fixed: true }); txt(ctx, '^', x + 25, 218, 12, G.iron, 'center', { outline: false }); txt(ctx, 'v', x + 25, 298, 12, G.iron, 'center', { outline: false }); }
      txt(ctx, '[ Try ]', 430, 365, 13, G.ink, 'center', { outline: false }); txt(ctx, '[ Leave ]', 540, 365, 13, G.ink, 'center', { outline: false });
      if (msg) txt(ctx, msg, 480, 394, 11, G.iron, 'center', { outline: false });
    }
  };
}
/* A memory: a small comic panel in grey, with only the remembering survivor in color. */
function memoryOverlay(s, text) {
  let t = 0; const st = { n: 0 };
  Snd.duck(3); Snd.sfx('chime');
  return {
    update(dt) { t += dt; typeOut(st, text, dt, 34); if (t > 0.6 && (Input.menu.ok || Input.ptr.click || Input.menu.back) || t > 7) Game.pop(); },
    render(ctx) {
      const k = Ease.outBack(clamp(t / 0.35, 0, 1)); ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(480, 250); ctx.scale(k, k); ctx.rotate(-0.02);
      UI.paper(ctx, -210, -130, 420, 260, { seed: 11 });
      ctx.fillStyle = G.stone; ctx.fillRect(-190, -110, 380, 150); ctx.fillStyle = G.fog; ctx.fillRect(-190, 10, 380, 30);
      ctx.fillStyle = G.dust; ctx.fillRect(-150, -90, 60, 80); ctx.fillRect(60, -100, 90, 60); ctx.fillStyle = G.pewter; ctx.beginPath(); ctx.arc(110, -70, 16, 0, TAU); ctx.fill();
      const fake = { type: 'civ', T: NPCT.civ, face: -1, vx: 0, ph: 0, st: 'idle', aw: 0 }; Rig.drawNPC(ctx, fake, 70, 12, 0.6);
      ctx.save(); ctx.scale(1.5, 1.5); Rig.draw(ctx, s, -20, 8, { alpha: 1 }); ctx.restore();
      txtWrap(ctx, text.slice(0, st.n), -190, 66, 380, 11, G.ink, { outline: false });
      txt(ctx, s.name + ' remembers', -190, -116, 10, G.iron, 'left', { outline: false });
      ctx.restore();
    }
  };
}
const MEMORIES = {
  marta: 'A school corridor, a queue of scraped knees. "One plaster each. Two if you are brave."', dov: 'Sawdust in sunlight. A staircase with his initials under the third tread.',
  ines: 'The whole city from a bicycle, downhill, no hands, one summer.', toby: 'A kitchen table. Somebody saying, "Draw me something with a sun in it."',
  bea: 'Two hundred bowls, a ladle, and a line that went out of the door.', ravi: 'A shop that smelled of oil and oranges. A bell on the door.',
  yara: 'A red light that meant: you are on the air. Say something kind.', pavel: 'A gate, a thermos, and twenty years of people saying good morning.',
  lamp: 'A street where every lamp came on at once, as if they had agreed to.'
};
