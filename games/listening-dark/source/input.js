// ---------- input: keyboard, mouse, touch and gamepad, with device-aware prompts ----------
const Input = {
  keys: {}, state: { mx: 0, my: 0, ping: false, hush: false, dash: false }, mouse: false, tCall: false, pingLatch: false,
  stick: { id: null, ox: 0, oy: 0, x: 0, y: 0 }, device: 'kb', padStyle: 'xbox', padObj: null, prev: [], pad: { mx: 0, my: 0, ping: false, hush: false },
  rep: { dir: null, t: 0 }, idle: 0, touchVisible: false,
  init() {
    addEventListener('keydown', e => this.onKey(e));
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; this.mouse = false; this.tCall = false; this.stick.id = null; this.drawStick(); if (G.state === 'play') pauseGame(); });
    addEventListener('mousemove', () => { if (this.device !== 'touch') this.setDevice('kb'); this.idle = 0; document.body.classList.remove('nocursor'); });
    const cv = document.getElementById('cv');
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') {
        this.setDevice('touch');
        if (G.state === 'play' && this.stick.id === null) { this.stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); this.drawStick(); }
        return;
      }
      this.setDevice('kb');
      if (G.state !== 'play') return;
      if (e.button === 0) { this.mouse = true; this.pingLatch = true; }
      if (e.button === 2) this.state.dash = true;
    });
    cv.addEventListener('pointermove', e => { if (e.pointerId === this.stick.id) { this.stick.x = e.clientX; this.stick.y = e.clientY; this.drawStick(); } });
    const end = e => { if (e.pointerId === this.stick.id) { this.stick.id = null; this.drawStick(); } if (e.pointerType !== 'touch' && e.button === 0) this.mouse = false; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    addEventListener('pointerup', e => { if (e.pointerType !== 'touch' && e.button === 0) this.mouse = false; });
    const tc = document.getElementById('tCall'), td = document.getElementById('tDash');
    tc.addEventListener('pointerdown', e => { e.preventDefault(); this.tCall = true; this.pingLatch = true; this.setDevice('touch'); tc.setPointerCapture(e.pointerId); tc.classList.add('on'); });
    const tcu = () => { this.tCall = false; tc.classList.remove('on'); };
    tc.addEventListener('pointerup', tcu); tc.addEventListener('pointercancel', tcu);
    td.addEventListener('pointerdown', e => { e.preventDefault(); this.state.dash = true; this.setDevice('touch'); });
    addEventListener('touchstart', () => this.setDevice('touch'), { passive: true });
    addEventListener('gamepadconnected', e => { const g = e.gamepad; this.padStyle = this.styleOf(g && g.id); UI.toast('Controller connected', this.padStyle === 'ps' ? 'PlayStation layout' : 'Xbox layout'); this.setDevice('pad'); });
    addEventListener('gamepaddisconnected', () => { UI.toast('Controller disconnected', ''); if (G.state === 'play') pauseGame(); this.padObj = null; this.setDevice('kb'); });
    this.coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
    if (this.coarse) this.device = 'touch';
  },
  styleOf(id) { id = (id || '').toLowerCase(); return /054c|playstation|dualsense|dualshock|ps4|ps5/.test(id) ? 'ps' : 'xbox'; },
  setDevice(d) {
    if (d === this.device) return;
    this.device = d;
    document.body.dataset.device = d;
    UI.onDevice(); this.syncTouch();
  },
  glyphSet() {
    const p = Store.data.settings.prompts;
    if (p === 'keyboard') return 'kb';
    if (p === 'xbox' || p === 'ps') return p;
    return this.device === 'pad' ? this.padStyle : this.device === 'touch' ? 'touch' : 'kb';
  },
  glyph(a) { return GLYPHS[this.glyphSet()][a] || a; },
  touchMode() { const s = Store.data.settings.touch; return s === 'on' || (s === 'auto' && this.device === 'touch'); },
  onKey(e) {
    if (Boot.waiting) { if (!e.repeat) Boot.go(); e.preventDefault(); return; }
    if (this.device !== 'kb') this.setDevice('kb');
    this.idle = 0;
    if (G.state === 'play') {
      if (e.code === 'Escape' || e.code === 'KeyP') { pauseGame(); e.preventDefault(); return; }
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if ((e.code === 'KeyE' || e.code === 'KeyX' || e.code === 'KeyK') && !e.repeat) this.state.dash = true;
      if (e.code === 'Space' && !e.repeat) this.pingLatch = true;
      this.keys[e.code] = true;
      return;
    }
    this.keys[e.code] = true;
    if (!UI.open()) return;
    const map = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Escape: 'back', Backspace: 'back', KeyQ: 'tabPrev', KeyE: 'tabNext', PageUp: 'tabPrev', PageDown: 'tabNext' };
    if (e.code === 'Tab' && UI.screen === 'settings') { e.preventDefault(); UI.nav(e.shiftKey ? 'tabPrev' : 'tabNext'); return; }
    if (/^Digit[1-9]$/.test(e.code)) { UI.nav('digit' + e.code.slice(5)); return; }
    const a = map[e.code];
    if (a) { e.preventDefault(); UI.nav(a); }
  },
  // polled once per rendered frame: gamepad edges, menu repeat, cursor hiding
  frame(dt) {
    this.idle += dt;
    if (this.idle > 2.5 && G.state === 'play') document.body.classList.add('nocursor');
    const gps = navigator.getGamepads ? navigator.getGamepads() : null;
    let gp = null;
    if (gps) for (const g of gps) if (g && g.connected) { gp = g; break; }
    this.padObj = gp;
    if (!gp) { this.pad = { mx: 0, my: 0, ping: false, hush: false }; return; }
    const b = i => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5));
    const val = i => (gp.buttons[i] ? gp.buttons[i].value || (gp.buttons[i].pressed ? 1 : 0) : 0);
    const cur = gp.buttons.map((_, i) => b(i)), edge = i => cur[i] && !this.prev[i];
    let ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    const dz = Store.data.settings.deadzone, m = hyp(ax, ay);
    if (m < dz) { ax = 0; ay = 0; } else { const k = Math.min(1, (m - dz) / (1 - dz)) / m; ax *= k; ay *= k; }
    const any = cur.some(x => x) || ax || ay;
    if (any) { if (this.device !== 'pad') { this.padStyle = this.styleOf(gp.id); this.setDevice('pad'); } this.idle = 0; }
    if (Boot.waiting) { if (cur.some((x, i) => x && !this.prev[i])) Boot.go(); this.prev = cur; return; }
    if (G.state === 'play') {
      this.pad = { mx: ax, my: ay, ping: b(0) || val(7) > 0.35, hush: b(4) || val(6) > 0.35 };
      if (edge(0) || (val(7) > 0.35 && !this.prevRT)) this.pingLatch = true;
      if (edge(1) || edge(2) || edge(5)) this.state.dash = true;
      if (edge(9) || edge(8)) pauseGame();
    } else {
      this.pad = { mx: 0, my: 0, ping: false, hush: false };
      if (UI.open()) {
        const dir = (cur[12] || ay < -0.5) ? 'up' : (cur[13] || ay > 0.5) ? 'down' : (cur[14] || ax < -0.5) ? 'left' : (cur[15] || ax > 0.5) ? 'right' : null;
        if (dir) {
          if (this.rep.dir !== dir) { this.rep = { dir, t: 0.38 }; UI.nav(dir); }
          else { this.rep.t -= dt; if (this.rep.t <= 0) { this.rep.t = 0.11; UI.nav(dir); } }
        } else this.rep.dir = null;
        if (edge(0)) UI.nav('confirm');
        if (edge(1)) UI.nav('back');
        if (edge(4)) UI.nav('tabPrev');
        if (edge(5)) UI.nav('tabNext');
        if (edge(9)) UI.nav(UI.screen === 'pause' ? 'back' : 'confirm');
      }
    }
    this.prevRT = val(7) > 0.35;
    this.prev = cur;
  },
  // polled once per simulation tick
  poll() {
    const k = this.keys, st = this.state;
    let mx = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
    let my = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
    if (mx && my) { mx *= 0.7071; my *= 0.7071; }
    if (this.stick.id !== null) { const dx = this.stick.x - this.stick.ox, dy = this.stick.y - this.stick.oy, d = hyp(dx, dy); if (d > 6) { const m = Math.min(1, d / 56); mx = dx / d * m; my = dy / d * m; } }
    if (this.pad.mx || this.pad.my) { mx = this.pad.mx; my = this.pad.my; }
    st.mx = mx; st.my = my;
    st.ping = !!(k.Space || this.mouse || this.tCall || this.pingLatch || this.pad.ping);
    st.hush = !!(k.ShiftLeft || k.ShiftRight || this.pad.hush);
    this.pingLatch = false;
  },
  rumble(ms, strong, weak) {
    if (!Store.data.settings.vibration || !this.padObj) return;
    const a = this.padObj.vibrationActuator;
    try { if (a && a.playEffect) a.playEffect('dual-rumble', { startDelay: 0, duration: ms, strongMagnitude: strong, weakMagnitude: weak }).catch(() => {}); } catch (e) {}
  },
  showTouch(on) { this.touchVisible = on; this.syncTouch(); },
  syncTouch() {
    const el = document.getElementById('touch'), pb = document.getElementById('pauseBtn');
    const vis = this.touchVisible && G.state === 'play';
    el.style.display = vis && this.touchMode() ? 'block' : 'none';
    pb.style.display = vis && this.device !== 'pad' ? 'block' : 'none';
  },
  drawStick() {
    const s = document.getElementById('stick'), k = document.getElementById('knob');
    if (this.stick.id === null) { s.style.opacity = 0; return; }
    s.style.opacity = 1; s.style.left = this.stick.ox + 'px'; s.style.top = this.stick.oy + 'px';
    let dx = this.stick.x - this.stick.ox, dy = this.stick.y - this.stick.oy; const d = hyp(dx, dy), m = 56;
    if (d > m) { dx = dx / d * m; dy = dy / d * m; }
    k.style.transform = `translate(${dx}px,${dy}px)`;
  }
};
