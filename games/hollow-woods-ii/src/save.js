// Save system: 3 slots + settings + key bindings in localStorage.
// Writes are atomic (temp key -> verify -> main key, previous kept as .bak),
// every record carries a checksum, and "Export all / Import all" moves the
// whole save between browsers as one .json file (or a pasted text code).
(function (H) {
  'use strict';

  const KEY = 'hollow.save.v1';
  const FORMAT = 'hollow-save';
  const VERSION = 1;
  const SLOT_COUNT = 3;

  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, '0');
  }

  // Stable stringify so the checksum doesn't depend on key order.
  function stable(v) {
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
    return JSON.stringify(v);
  }

  function defaultData() {
    return {
      slots: Array.from({ length: SLOT_COUNT }, () => null),
      activeSlot: 0,
      settings: { master: 0.8, sfx: 1, ambience: 0.8, grain: 0.6, brightness: 1, reducedFlashing: false, allUnlocked: false, muted: false, vhs: false, runnerBest: 0 },
      bindings: null,
    };
  }

  function wrap(data) {
    return { format: FORMAT, version: VERSION, savedAt: new Date().toISOString(), data, checksum: fnv1a(stable(data)) };
  }

  const num = (v) => typeof v === 'number' && Number.isFinite(v);

  function validSlot(s) {
    if (s === null) return true;
    return !!(s && typeof s === 'object' && typeof s.level === 'string' && s.level.length < 64 &&
      Number.isInteger(s.cpIndex) && s.cpIndex >= 0 && Number.isInteger(s.deaths) && s.deaths >= 0 &&
      num(s.playTime) && s.playTime >= 0 && (s.snapshot === undefined || (s.snapshot && typeof s.snapshot === 'object')) &&
      typeof s.finished === 'boolean' && (s.unlocked === undefined || (Number.isInteger(s.unlocked) && s.unlocked >= 0 && s.unlocked <= 1000)));
  }

  // Returns {ok, data, error}. Never throws.
  function unwrap(obj) {
    try {
      if (!obj || typeof obj !== 'object') return { ok: false, error: 'Not a save file.' };
      if (obj.format !== FORMAT) return { ok: false, error: 'This file is not a Hollow save.' };
      if (!Number.isInteger(obj.version) || obj.version > VERSION) return { ok: false, error: 'This save is from a newer version of Hollow.' };
      const d = obj.data;
      if (!d || typeof d !== 'object') return { ok: false, error: 'The save is missing its data.' };
      if (fnv1a(stable(d)) !== obj.checksum) return { ok: false, error: 'The save is damaged (checksum mismatch).' };
      if (!Array.isArray(d.slots) || d.slots.length !== SLOT_COUNT || !d.slots.every(validSlot)) return { ok: false, error: 'The save slots are invalid.' };
      if (!Number.isInteger(d.activeSlot) || d.activeSlot < 0 || d.activeSlot >= SLOT_COUNT) return { ok: false, error: 'The active slot is invalid.' };
      if (!d.settings || typeof d.settings !== 'object') return { ok: false, error: 'The settings are invalid.' };
      const base = defaultData();
      const settings = Object.assign({}, base.settings);
      for (const k of Object.keys(base.settings)) {
        if (typeof d.settings[k] === typeof base.settings[k]) settings[k] = d.settings[k];
      }
      return { ok: true, data: { slots: d.slots, activeSlot: d.activeSlot, settings, bindings: d.bindings || null } };
    } catch (e) {
      return { ok: false, error: 'The save could not be read.' };
    }
  }

  function storage() {
    try { return globalThis.localStorage || null; } catch (e) { return null; }
  }

  class SaveStore {
    constructor() {
      this.data = defaultData();
      this.persistent = !!storage();
      this.load();
    }

    load() {
      const ls = storage();
      if (!ls) return;
      for (const key of [KEY, KEY + '.bak']) {
        try {
          const raw = ls.getItem(key);
          if (!raw) continue;
          const res = unwrap(JSON.parse(raw));
          if (res.ok) { this.data = res.data; return; }
        } catch (e) { /* try the backup */ }
      }
    }

    write() {
      const ls = storage();
      if (!ls) return false;
      try {
        const text = JSON.stringify(wrap(this.data));
        ls.setItem(KEY + '.tmp', text);
        if (ls.getItem(KEY + '.tmp') !== text) return false;
        const prev = ls.getItem(KEY);
        if (prev) ls.setItem(KEY + '.bak', prev);
        ls.setItem(KEY, text);
        ls.removeItem(KEY + '.tmp');
        return true;
      } catch (e) {
        return false;
      }
    }

    slot(i) { return this.data.slots[i]; }
    get active() { return this.data.activeSlot; }
    set active(i) { this.data.activeSlot = i; this.write(); }

    saveSlot(i, record) { this.data.slots[i] = record; this.data.activeSlot = i; this.write(); }
    clearSlot(i) { this.data.slots[i] = null; this.write(); }
    setSettings(s) { Object.assign(this.data.settings, s); this.write(); }
    setBindings(b) { this.data.bindings = b; this.write(); }

    // ---------- export / import (move saves between browsers) ----------
    exportText() { return JSON.stringify(wrap(this.data), null, 2); }

    exportFileName() {
      const d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      return `hollow-save-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
    }

    // Validate first; only replace live data if the whole file is good.
    importText(text) {
      let obj;
      try { obj = JSON.parse(String(text).trim()); } catch (e) { return { ok: false, error: 'That is not valid save data (could not parse JSON).' }; }
      const res = unwrap(obj);
      if (!res.ok) return res;
      const before = this.data;
      this.data = res.data;
      if (this.persistent && !this.write()) { this.data = before; return { ok: false, error: 'Could not write to browser storage.' }; }
      return { ok: true };
    }
  }

  H.SaveStore = SaveStore;
  H.save = { fnv1a, stable, wrap, unwrap, SLOT_COUNT };
})(globalThis.Hollow = globalThis.Hollow || {});
