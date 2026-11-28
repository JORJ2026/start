// Input: keyboard + gamepad, polled once per fixed physics step.
// Edges ("pressed") are latched so a tap shorter than one frame is never lost.
(function (H) {
  'use strict';

  const DEFAULT_BINDINGS = {
    left:    ['ArrowLeft', 'KeyA'],
    right:   ['ArrowRight', 'KeyD'],
    up:      ['ArrowUp', 'KeyW'],
    down:    ['ArrowDown', 'KeyS'],
    jump:    ['Space'],
    grab:    ['ShiftLeft', 'ShiftRight', 'KeyE'],
    pause:   ['Escape', 'KeyP'],
    restart: ['KeyR'],
    confirm: ['Enter', 'Space'],
    debugSkip: ['KeyN'],
    mute:    ['KeyM'],
  };
  const ACTIONS = Object.keys(DEFAULT_BINDINGS);

  class Input {
    constructor() {
      this.bindings = JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
      this.keys = new Set();
      this.latch = new Set();       // actions whose key went down since last poll
      this.held = {};
      this.prev = {};
      this.edge = {};
      this.virtual = null;          // headless/test override: {action: bool}
      this.enabled = true;
      for (const a of ACTIONS) { this.held[a] = this.prev[a] = this.edge[a] = false; }
    }

    attach(target) {
      target.addEventListener('keydown', (e) => {
        if (!this.enabled) return;
        const acts = this.actionsFor(e.code);
        if (acts.length) e.preventDefault();
        if (!e.repeat) for (const a of acts) this.latch.add(a);
        this.keys.add(e.code);
      });
      target.addEventListener('keyup', (e) => { this.keys.delete(e.code); });
      target.addEventListener('blur', () => { this.keys.clear(); });
    }

    actionsFor(code) {
      const out = [];
      for (const a of ACTIONS) if (this.bindings[a] && this.bindings[a].includes(code)) out.push(a);
      return out;
    }

    setBindings(b) {
      const next = JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
      if (b && typeof b === 'object') {
        for (const a of ACTIONS) {
          if (Array.isArray(b[a]) && b[a].every((k) => typeof k === 'string')) next[a] = b[a].slice(0, 4);
        }
      }
      this.bindings = next;
    }

    pollGamepad(cur) {
      // Some embeds (sandboxed iframes) forbid the Gamepad API and throw a SecurityError. Fall back to keyboard only.
      if (this.padBlocked || typeof navigator === 'undefined' || !navigator.getGamepads) return;
      let pads;
      try { pads = navigator.getGamepads(); } catch (e) { this.padBlocked = true; return; }
      for (const p of pads) {
        if (!p || !p.connected) continue;
        const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
        const b = (i) => !!(p.buttons[i] && p.buttons[i].pressed);
        if (ax < -0.4 || b(14)) cur.left = true;
        if (ax > 0.4 || b(15)) cur.right = true;
        if (ay < -0.5 || b(12)) cur.up = true;
        if (ay > 0.5 || b(13)) cur.down = true;
        if (b(0)) { cur.jump = true; cur.confirm = true; }
        if (b(2) || b(5)) cur.grab = true;
        if (b(9)) cur.pause = true;
        if (b(3)) cur.restart = true;
      }
    }

    // Call exactly once at the start of every fixed step.
    poll() {
      const cur = {};
      for (const a of ACTIONS) cur[a] = false;
      if (this.virtual) {
        for (const a of ACTIONS) cur[a] = !!this.virtual[a];
      } else {
        for (const a of ACTIONS) for (const k of this.bindings[a]) if (this.keys.has(k)) cur[a] = true;
        this.pollGamepad(cur);
      }
      if (this.autoRun) { cur.right = true; cur.left = false; }
      for (const a of ACTIONS) {
        this.edge[a] = (cur[a] && !this.prev[a]) || this.latch.has(a);
        this.held[a] = cur[a];
        this.prev[a] = cur[a];
      }
      this.latch.clear();
    }

    isHeld(a) { return this.held[a]; }
    pressed(a) { return this.edge[a]; }
  }

  H.Input = Input;
  H.DEFAULT_BINDINGS = DEFAULT_BINDINGS;
})(globalThis.Hollow = globalThis.Hollow || {});
