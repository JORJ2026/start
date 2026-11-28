
/* ==========================================================================
   SECTION 10: AI - readable state machines for NPCs, enemies, and home jobs
   States: idle, patrol, investigate, search, chase, retreat, flee, beg, trade,
   hostile, ally, stun. NPCs use the same move/nav rules as the player.
   ========================================================================== */
let NPC_ID = 1;
class NPC {
  constructor(type, x, f, o) {
    this.id = NPC_ID++; this.type = type; this.T = NPCT[type]; this.x = x; this.f = f; this.vx = 0; this.face = o.face || -1;
    this.p0 = o.p0 != null ? o.p0 : x - 140; this.p1 = o.p1 != null ? o.p1 : x + 140; this.homeF = f; this.pdir = -1;
    this.mode = o.mode || ''; this.st = type === 'civ' ? (this.mode === 'wounded' ? 'beg' : (this.id % 2 ? 'trade' : 'beg')) : type === 'cat' ? 'idle' : (this.mode === 'raid' ? 'approach' : 'patrol');
    this.aw = 0; this.peak = 0; this.t = 0; this.ph = 0; this.cl = null; this.jz = 0; this.wait = o.late ? 9999 : 0; this.late = !!o.late; if (this.late) this.st = 'idle';
    this.persona = NPC_PERSONA[this.id % NPC_PERSONA.length]; this.nerve = this.T.nerve + (o.nerve || 0); this.stunN = 0;
    this.bubble = null; this.stuck = 0; this.lx = x; this.last = null; this.tg = null; this.tgt = null; this.seeT = 9; this.carry = 0; this.barkT = 0; this.hitCool = 0; this.gone = false;
  }
  say(key, text) { const l = NPC_LINES[key]; this.bubble = { text: text || (l ? l[Math.floor(Math.random() * l.length)] : key), t: 2.4 }; }
  sees(w, s) {
    if (s.hidden || s.down || s.carriedBy || this.cl) return 0;
    if (w.entF(s) !== this.f) return 0;
    const dx = s.x - this.x, d = Math.abs(dx);
    if (this.type !== 'dog' && dx * this.face < 0 && d > 24) return 0;
    const range = this.T.vis * w.diff.vision * w.expo(s) * (w.run.mods.sleepers ? 1.1 : 1);
    if (d > range || w.wallBetween(this.f, this.x, s.x)) return 0;
    return 1 - d / range;
  }
  hear(w, x, f, r, src) {
    if (!this.T.hostile || this.gone || src === this || this.tame) return;
    if (this.mode === 'raid') { if (src === 'pots' && Math.abs(f - this.f) <= 1) { this.nerve -= 1; this.say('raider', 'What is that racket?'); } return; }
    if (this.st === 'stun' || this.st === 'flee' || this.st === 'chase' || this.st === 'hostile' || this.st === 'retreat' || this.mode === 'route' || this.late) return;
    const df = Math.abs(f - this.f); if (df > 1) return;
    const rr = r * this.T.hear * (w.run.mods.sleepers ? 1.3 : 1) * (df ? 0.5 : 1);
    if (Math.abs(x - this.x) > rr) return;
    this.tgt = { x, f }; if (this.st !== 'investigate') this.say(this.type === 'dog' ? 'dog' : 'patrolSusp');
    this.st = 'investigate'; this.aw = Math.max(this.aw, 0.3);
    if (this.type === 'dog') this.bark(w);
  }
  bark(w) { if (this.barkT > 0) return; this.barkT = 4; Snd.sfx('bark'); w.noise(this.x, this.f, 250, this); }
  perceive(w, dt) {
    let best = 0, who = null;
    for (const s of w.surv) { const v = this.sees(w, s); if (v > best) { best = v; who = s; } }
    if (who) {
      const rate = w.diff.react * (0.55 + best * 1.7) * (this.persona === 'jumpy' ? 1.25 : this.persona === 'bored' ? 0.8 : 1) * (who.wears('see') ? 0.9 : 1);
      this.aw = Math.min(1, this.aw + dt * rate); this.last = { x: who.x, f: w.entF(who) }; this.tg = who; this.seeT = 0; this.peak = Math.max(this.peak, this.aw);
    } else {
      if (this.tg && this.tg.hidden && this.seeT < 0.25 && Math.abs(this.tg.x - this.x) < 130 && this.st === 'chase') this.sawHide = this.tg;
      this.seeT += dt; this.aw = Math.max(0, this.aw - dt * 0.3);
      if (this.peak > CFG.closeCall && this.aw < 0.35 && this.st !== 'chase' && this.st !== 'hostile') { if (this.tg && this.peak < 1) w.closeCall(this.tg); this.peak = 0; }
    }
    if (this.aw >= 1 && this.st !== 'chase' && this.st !== 'hostile') {
      this.st = 'chase'; this.sawHide = null; this.say(this.type === 'patrol' ? 'patrolSee' : this.type === 'dog' ? 'dog' : this.type === 'census' ? 'census' : 'scavSee');
      w.spotted++; Bus.emit('spotted', { n: this, s: who || this.tg }); if (this.type === 'dog') this.bark(w);
    } else if (this.aw > 0.4 && (this.st === 'patrol' || this.st === 'idle') && this.last && !this.late) { this.st = 'investigate'; this.tgt = { x: this.last.x, f: this.last.f }; this.say('patrolSusp'); }
  }
  update(w, dt) {
    this.t += dt; this.barkT -= dt; this.hitCool -= dt; this.vx = 0;
    if (this.bubble) { this.bubble.t -= dt; if (this.bubble.t <= 0) this.bubble = null; }
    const T = this.T, spd = T.spd * (this.persona === 'jumpy' ? 1.1 : this.persona === 'weary' ? 0.9 : 1);
    if (this.type === 'cat') { this.updCat(w, dt); this.post(dt); return; }
    if (this.type === 'civ') { this.updCiv(w, dt, spd); this.post(dt); return; }
    if (this.mode === 'raid') { this.updRaid(w, dt); this.post(dt); return; }
    if (this.late) { if (w.tutorialWake) { this.late = false; this.wait = 0; this.st = 'patrol'; } return; }
    if (this.mode === 'route') {
      if (this.st === 'patrol' || this.st === 'idle' || this.st === 'search' || this.st === 'investigate') this.st = 'route';
      if (this.st === 'route') { this.perceive(w, dt); if (this.st === 'investigate') this.st = 'route'; if (this.st === 'route') { this.arr = this.tgt ? w.nav(this, this.tgt.x, this.tgt.f, dt, spd) : 'arrived'; this.post(dt); return; } }
    }
    if (!this.tame && this.st !== 'stun' && this.st !== 'flee' && this.st !== 'retreat') this.perceive(w, dt);
    switch (this.st) {
      case 'idle':
        this.wait -= dt; if (this.wait < 0.9 && !this.glanced) { this.face *= -1; this.glanced = true; }
        if (this.wait <= 0) { this.glanced = false; this.st = 'patrol'; }
        break;
      case 'patrol': {
        const r = w.nav(this, this.pdir > 0 ? this.p1 : this.p0, this.homeF, dt, spd);
        if (r !== 'moving') { this.pdir *= -1; this.st = 'idle'; this.wait = (1 + Math.random() * 2) * (this.persona === 'bored' ? 1.6 : 1); }
        break; }
      case 'investigate': {
        if (!this.tgt) { this.st = 'patrol'; break; }
        const r = w.nav(this, this.tgt.x, this.tgt.f, dt, spd * 1.25);
        if (r !== 'moving') { this.st = 'search'; this.wait = this.persona === 'stubborn' ? 6 : 4; this.sT = 0; }
        break; }
      case 'search': {
        this.wait -= dt; this.sT = (this.sT || 0) + dt; if (this.sT > 1.1) { this.sT = 0; this.face *= -1; }
        for (const o of w.L.objs) if (o.type === 'hide' && o.occ && o.f === this.f && Math.abs(o.x - this.x) < 30 && Math.random() < dt * 0.1 * w.diff.react) { const s = o.occ; o.occ = null; s.hidden = null; this.tg = s; this.st = 'hostile'; this.wait = 0.5; Snd.sfx('door'); this.say('patrolSee'); }
        if (this.wait <= 0 && this.st === 'search') { this.say(this.type === 'dog' ? 'dog' : 'patrolLost'); this.st = 'patrol'; Bus.emit('lostThem', { n: this }); }
        break; }
      case 'chase': {
        const tg = this.tg; if (!tg || tg.down) { this.st = 'search'; this.wait = 3; break; }
        const tx = this.last ? this.last.x : tg.x, tf = this.last ? this.last.f : this.f;
        const r = w.nav(this, tx, tf, dt, T.chase * (this.tame ? 0 : 1));
        if (!tg.hidden && !tg.cl && w.entF(tg) === this.f && Math.abs(tg.x - this.x) < 26) { this.st = 'hostile'; this.wait = 0.42; break; }
        if (r !== 'moving') {
          if (this.sawHide === tg && tg.hidden && Math.abs(tg.x - this.x) < 34) { this.w2 = (this.w2 || 0) + dt; if (this.w2 > 1.1) { this.w2 = 0; tg.hidden.occ = null; tg.hidden = null; this.st = 'hostile'; this.wait = 0.35; Snd.sfx('door'); } }
          else if (this.seeT > 1.2) { this.st = 'search'; this.wait = this.persona === 'stubborn' ? 6.5 : 4.2; this.aw = 0.6; }
        }
        if (this.seeT > 4.5) { this.st = 'search'; this.wait = 4; this.aw = 0.5; }
        break; }
      case 'hostile': {
        this.wait -= dt; if (this.wait > 0) break;
        const tg = this.tg;
        if (tg && !tg.hidden && !tg.down && w.entF(tg) === this.f && Math.abs(tg.x - this.x) < 38) {
          this.face = sgn(tg.x - this.x) || this.face;
          if (this.type === 'census') { Bus.emit('censusFound', { s: tg, n: this }); this.st = 'retreat'; this.wait = 2.2; this.aw = 0; break; }
          if (tg.damage(T.dmg * w.diff.dmg, this)) {
            const fl = w.L.floors[tg.f]; w.impact(tg.x, w.entY(tg) - 26, this.type === 'dog' ? 0.5 : 1); tg.stun = 0.45; tg.x = clamp(tg.x + this.face * 16, fl.x0 + 8, fl.x1 - 8); w.mark(6, 'Caught');
            if (T.steals) { const k = stealFrom(w, 1 + (w.rng.chance(0.4) ? 1 : 0)); if (k) { this.carry += k; this.st = 'flee'; this.wait = 7; this.despawn = true; this.say('scavSee', 'Mine now.'); Bus.emit('theft', { n: this, k }); break; } }
          }
          this.st = 'retreat'; this.wait = 2.8; this.aw = 0; this.peak = 0;
        } else this.st = 'chase';
        break; }
      case 'retreat':
        this.wait -= dt; w.nav(this, (this.p0 + this.p1) / 2, this.homeF, dt, spd);
        if (this.wait <= 0) this.st = 'patrol';
        break;
      case 'flee': {
        this.wait -= dt; const fl = w.L.floors[this.f], dir = this.tg ? (sgn(this.x - this.tg.x) || 1) : 1;
        const r = w.nav(this, dir > 0 ? fl.x1 - 10 : fl.x0 + 10, this.f, dt, T.chase);
        if (r !== 'moving' || this.wait <= 0) { if (this.despawn) this.gone = true; else { this.st = 'patrol'; this.aw = 0; } }
        break; }
      case 'stun':
        this.wait -= dt; if (this.wait <= 0) { if (this.nerve <= 0) { this.st = 'flee'; this.wait = 6; this.despawn = true; } else { this.st = 'retreat'; this.wait = 1.6; } }
        break;
      default: this.st = 'patrol';
    }
    this.post(dt);
  }
  /* Walk cycle and anti-stuck: if a moving NPC makes no progress, send it home; as a last resort, reset it. */
  post(dt) {
    this.ph += Math.abs(this.vx) * dt * 0.17;
    const moving = this.st === 'patrol' || this.st === 'investigate' || this.st === 'chase' || this.st === 'flee' || this.st === 'approach' || this.st === 'loot';
    if (moving && !this.cl && Math.abs(this.x - this.lx) < 0.4) this.stuck += dt; else this.stuck = 0;
    this.lx = this.x;
    if (this.stuck > 2.5 && this.mode !== 'raid') { if (this.st === 'patrol') this.pdir *= -1; else { this.st = 'retreat'; this.wait = 1.5; } }
    if (this.stuck > 6) { this.stuck = 0; if (this.mode === 'raid') this.st = 'flee'; else { this.st = 'idle'; this.wait = 1; } }
  }
  updCiv(w, dt, spd) {
    let near = null; for (const s of w.surv) if (!s.hidden && w.entF(s) === this.f && Math.abs(s.x - this.x) < 110) near = s;
    if (this.st === 'ally') {
      const o = this.owner; if (!o) { this.st = 'idle'; return; }
      if (w.entF(o) !== this.f || Math.abs(o.x - this.x) > 70) w.nav(this, o.x - o.face * 44, w.entF(o), dt, spd * 1.5);
      this.cough = (this.cough || 6) - dt;
      if (this.cough <= 0) { this.cough = 8; const h = w.npcs.find(n => n.T.hostile && n.st === 'investigate' && Math.abs(n.x - o.x) < 260); if (h) { h.tgt = { x: this.x, f: this.f }; this.say('', '*cough*'); Snd.sfx('cough'); } }
      return;
    }
    if (near) { this.face = sgn(near.x - this.x) || this.face; this.talkT = (this.talkT || 0) - dt; if (this.talkT <= 0 && !this.talked) { this.talkT = 7; this.say(this.mode === 'wounded' ? '' : this.st === 'trade' ? 'civTrade' : 'civBeg', this.mode === 'wounded' ? 'Please... a bandage...' : null); } }
    else if (this.p0 !== this.p1 && !this.talked) { const r = w.nav(this, this.pdir > 0 ? this.p1 : this.p0, this.homeF, dt, spd * 0.6); if (r !== 'moving') this.pdir *= -1; }
  }
  updCat(w, dt) {
    const o = this.owner, spd = this.T.spd;
    if (!o) { this.wait -= dt; if (this.wait <= 0) { const r = w.nav(this, this.pdir > 0 ? this.p1 : this.p0, this.homeF, dt, spd * 0.5); if (r !== 'moving') { this.pdir *= -1; this.wait = 2 + Math.random() * 3; } } return; }
    this.leadT = (this.leadT == null ? 10 : this.leadT) - dt;
    if (this.lead) {
      const r = w.nav(this, this.lead.x - 14, this.lead.f, dt, spd);
      if (r !== 'moving') { this.wait -= dt; if (!this.bubble) { this.say('cat', 'Mrrp!'); Snd.sfx('meow'); } if (this.wait <= 0 || !this.lead.items.length) this.lead = null; }
      return;
    }
    if (this.leadT <= 0 && w.L.conts) { this.leadT = 14; const c = w.L.conts.find(q => q.rich && q.items.length && q.f === this.f && Math.abs(q.x - this.x) < 520); if (c && w.rng.chance(0.6)) { this.lead = c; this.wait = 6; Bus.emit('catLeads', {}); return; } }
    const of = w.entF(o), tx = o.x - o.face * 30;
    if (of !== this.f || Math.abs(tx - this.x) > 26) w.nav(this, tx, of, dt, o.sprint ? spd * 1.6 : spd);
  }
  /* Home raiders: approach the door, bang on the barricade, slip in, take something, leave. */
  updRaid(w, dt) {
    const T = this.T, Hc = CFG.home, door = w.L.blockers.find(b => b.id === 'frontdoor');
    if (this.st === 'stun') { this.wait -= dt; if (this.wait <= 0) this.st = this.nerve <= 0 ? 'flee' : (door.open ? 'loot' : 'approach'); return; }
    if (this.nerve <= 0 && this.st !== 'flee') { this.st = 'flee'; this.say('raider', 'Forget it. Not worth it.'); }
    if (this.st === 'approach') { if (door.open) { this.st = 'loot'; return; } const r = w.nav(this, Hc.doorX + 24 + (this.id % 3) * 14, 3, dt, T.spd); if (r !== 'moving') { this.st = 'bang'; this.wait = 0.4; this.say('raider'); } }
    else if (this.st === 'bang') {
      if (door.open) { this.st = 'loot'; return; }
      this.face = -1; this.wait -= dt;
      if (this.wait <= 0) {
        this.wait = 0.95; Snd.sfx('knock'); door.hp -= 7 * w.diff.dmg; door.hitT = 0.3; w.shake(2, 0.25); Parts.emit('dust', door.x, w.floorY(3) - 50, 4, { sx: 10 });
        Bus.emit('raiderImpact', { n: this, hp: door.hp });
        if (door.hp <= 0) { door.open = true; Snd.sfx('door'); w.impact(door.x, w.floorY(3) - 30, 0.8); Bus.emit('doorBroken', {}); }
      }
    } else if (this.st === 'loot') {
      for (const s of w.surv) {
        if (s.hidden || s.down || w.entF(s) !== this.f) continue; const d = Math.abs(s.x - this.x);
        if (d < 60 && (s.x - this.x) * this.face > 0) this.nerve -= dt * 0.1 * (s.st.str / 3) * (s.id === 'pavel' ? 2 : 1);     // someone holding the stairwell
        if (d < 24 && this.hitCool <= 0) { this.hitCool = 2.6; if (s.damage(T.dmg * w.diff.dmg, this)) { w.impact(s.x, w.entY(s) - 26, 0.8); s.stun = 0.4; s.x = clamp(s.x + this.face * 14, Hc.x0 + 8, Hc.x1 - 8); w.mark(6, 'At the door'); } }
      }
      const tg = w.o.raidTarget ? w.o.raidTarget(w, this) : { x: 440, f: 3 };
      const r = w.nav(this, tg.x, tg.f, dt, T.spd * 1.15);
      if (r === 'arrived') { this.w2 = (this.w2 || 0) + dt; if (this.w2 > 2.2) { this.w2 = 0; this.carry = 1; Bus.emit('raidLoot', { n: this }); this.st = 'flee'; } }
      else if (r === 'blocked') this.st = 'flee';
    } else if (this.st === 'flee') {
      const r = w.nav(this, Hc.streetX - 8, 3, dt, T.chase);
      if (r !== 'moving') { this.gone = true; Bus.emit('raiderGone', { n: this, carry: this.carry }); }
    } else this.st = 'approach';
  }
}
function stealFrom(w, n) {
  let k = 0; const src = w.L.home ? w.run.stock : w.pack.items;
  for (let i = 0; i < n; i++) { const ids = Object.keys(src).filter(id => src[id] > 0 && id !== 'keepsake'); if (!ids.length) break; const id = w.rng.pick(ids); src[id]--; k++; }
  return k;
}

/* What a survivor can do with an NPC: pet, talk, bargain. Never harm the animals. */
function npcAct(w, s, n) {
  if (n.type === 'cat') return { label: n.owner ? 'Pet the cat' : 'Offer a hand to the cat', pri: 6, fn() { n.owner = s; Snd.sfx('purr'); if (w.t - (n.petT || -99) > 20) { n.petT = w.t; s.addMorale(4); } Bus.emit('catPet', { s, n }); } };
  if (n.type === 'civ') { if (n.talked) return null; return { label: 'Talk', pri: 6, fn() { Bus.emit('talkCiv', { s, n }); } }; }
  if (n.st === 'stun' || n.tame) return null;
  const food = ['can', 'raw', 'soup', 'egg'].find(k => (w.L.home ? Run.count(w.run, k) : (w.pack.items[k] || 0)) > 0);
  if (n.type === 'dog') { if (!food) return null; return { label: 'Toss it some food', pri: 12, fn() { if (w.L.home) Run.add(w.run, food, -1); else w.pack.items[food]--; n.tame = true; n.st = 'idle'; n.wait = 99; n.aw = 0; n.say('dog', '*wag*'); Snd.sfx('bark'); s.addMorale(2); Bus.emit('dogFed', { s }); } }; }
  if (n.type === 'scav' || n.type === 'raider') {
    if (s.id === 'yara' && !n.talkedDown) return { label: 'Talk them down', pri: 12, hold: 0.7, fn() { n.talkedDown = true; if (w.rng.chance(0.7)) { n.nerve = 0; n.st = 'flee'; n.wait = 6; n.despawn = true; n.say('', 'Fine. Fine. Keep it.'); Bus.emit('talkedDown', { s }); } else n.say('', 'Nice voice. Still hungry.'); } };
    if (food) return { label: 'Offer food and back away', pri: 12, fn() { if (w.L.home) Run.add(w.run, food, -1); else w.pack.items[food]--; n.nerve = 0; n.st = 'flee'; n.wait = 6; n.despawn = true; n.carry++; n.say('', 'Smart.'); Bus.emit('bargained', { s }); } };
  }
  return null;
}

/* --- Home job AI: a priority queue. Needs first, then the assigned job. --- */
const JOBS = {
  rest: { n: 'Rest', d: 'Sleep and recover.' }, cook: { n: 'Cook', d: 'Turn raw food and water into soup.' },
  repair: { n: 'Repair', d: 'Fix damage, then strengthen the door.' }, guard: { n: 'Guard', d: 'Stand by the door. Counts at night.' },
  tend: { n: 'Tend', d: 'Treat the sick, comfort the low.' }, play: { n: 'Read and play', d: 'Keep spirits up.' },
  watch: { n: 'Keep watch', d: 'Roof lookout. Early warnings.' }, water: { n: 'Filter water', d: 'Clean the rain water.' }
};
const JOB_ORDER = ['rest', 'cook', 'repair', 'guard', 'tend', 'play', 'watch', 'water'];
const NIGHT_AI = { guard: 1, watch: 1 };

function homeAI(w, s, dt) {
  const run = w.run, ai = s.ai; s.working = false; s.vx = 0;
  if (s.down || s.stun > 0 || s.hidden && w.o.homeAI !== 'defense') return;
  if (s.special === 'sit') return;
  const go = (x, f) => { if (s.sleeping) w.wake(s); const r = w.nav(s, x, f, dt, CFG.walk * s.speedMul() * 0.85); s.ph += Math.abs(s.vx) * dt * 0.17; s.stepAcc += Math.abs(s.vx) * dt; if (s.stepAcc > CFG.stepDist * 1.2) { s.stepAcc = 0; if (w.night) w.footstep(s, 0.6); } return r; };
  const obj = (type, pred) => w.L.objs.find(o => o.type === type && (!pred || pred(o)));
  const rate = (s.id === 'ravi' && s.morale < 40 ? 0.5 : 1) * (s.fatigue < 20 ? 0.7 : 1);
  if (w.o.homeAI === 'still') return;
  if (w.o.homeAI === 'defense') return defenseAI(w, s, dt, go, obj);
  // needs first
  let job = s.job || 'rest';
  if (s.health < 25 || s.fatigue < 16 || (s.sick && s.fatigue < 55)) job = 'rest';
  else if (s.hunger < 14 && ['soup', 'can', 'egg', 'raw'].some(k => Run.count(run, k) > 0) && w.t - (ai.ateT || -99) > 30) job = 'snack';
  if (job !== 'rest' && s.sleeping) w.wake(s);
  ai.work += dt * rate;
  switch (job) {
    case 'snack': if (go(440, 3) === 'arrived') { eatBest(w, s); ai.ateT = w.t; } break;
    case 'rest': {
      if (s.sleeping) break;
      const bed = obj('bed', o => !o.occ || o.occ === s), tx = bed ? bed.x : 240 + (s.d.age % 5) * 16;
      if (go(tx, 1) !== 'moving') { s.sleeping = true; s.x = tx; if (bed) { bed.occ = s; s.bed = bed; } }
      break; }
    case 'cook': {
      if (run.gas) { s.working = false; if (go(300, 3) === 'arrived' && Math.random() < dt * 0.1) s.say('I can smell gas. Not touching that stove.'); break; }
      if (go(UPGRADES.stove.x + 14, 3) === 'arrived') {
        s.working = true; s.face = -1;
        if (ai.work > 14 / (0.6 + s.st.cook * 0.15)) {
          ai.work = 0; const n = Run.present(run).length;
          if (Run.count(run, 'raw') > 0 && Run.count(run, 'water') > 0 && Run.count(run, 'soup') < n + 1) { Run.pay(run, { raw: 1, water: 1 }); Run.add(run, 'soup', s.id === 'bea' ? 3 : 2); Snd.sfx('sizzle'); run.soupName = SOUPS[(run.day * 3 + run.stats.soups) % SOUPS.length]; run.stats.soups++; s.say(s.id === 'bea' ? "Soup's on. I call it '" + run.soupName + "'." : 'Soup is ready.'); Bus.emit('craftComplete', { id: 'soup', s }); }
          else if (Run.count(run, 'herbs') > 0 && Run.count(run, 'water') > 1 && Run.count(run, 'tea') < 2) { Run.pay(run, { herbs: 1, water: 1 }); Run.add(run, 'tea', 2); Snd.sfx('sizzle'); }
          else if (!run.up.filter && Run.count(run, 'dirty') > 1 && Run.count(run, 'fuel') > 1 && Run.count(run, 'water') < 4) { Run.pay(run, { dirty: 2, fuel: 1 }); Run.add(run, 'water', 2); }
          else s.working = false;
        }
        if (s.working && Math.random() < dt * 0.6) Parts.emit('smoke', UPGRADES.stove.x, w.floorY(3) - 44, 1, {});
      }
      break; }
    case 'repair': {
      const fix = obj('fire') || obj('stairfix', o => Run.count(run, 'wood') > 1) || obj('rubble', () => Run.count(run, 'wood') > 0) || (run.flood > 0 ? obj('barrel') : null) || (run.gas && (s.id === 'dov' || s.id === 'ravi' || Run.count(run, 'parts') > 0) ? obj('stove') : null);
      if (fix) {
        const r = go(fix.x + (fix.type === 'fire' ? -34 : 0), fix.f);
        if (r === 'arrived') { s.working = true; if (ai.work > 3) { ai.work = 0; const a = OBJDEF[fix.type].act(w, s, fix); if (a && !a.dis) a.fn(); } }
        else if (r === 'blocked' && ai.work > 5) { ai.work = 0; s.say('I cannot reach it from here.'); }
      } else if (go(820, 3) === 'arrived') {
        if (run.barricade < BARRICADE_MAX && Run.count(run, 'wood') >= 4) { s.working = true; s.face = 1; if (ai.work > (s.id === 'dov' ? 12 : 20)) { ai.work = 0; Run.pay(run, BARRICADE_COST); run.barricade++; Snd.sfx('thud'); s.say(CHAT.work[run.barricade % CHAT.work.length]); Bus.emit('craftComplete', { id: 'barricade', s }); } }
        else if (s.id === 'ravi' && ai.work > 25 && Run.once(run, 'raviparts')) { Run.add(run, 'parts', 1); s.say('Found a spare part in the junk drawer.'); }
      }
      break; }
    case 'guard': if (go(826, 3) === 'arrived') { s.face = 1; } break;
    case 'watch': if (go(560, 0) === 'arrived') { s.face = 1; s.cold = Math.max(0, s.cold - dt * 0.03); } break;
    case 'tend': {
      const b = pickPatient(w, s);
      if (b) { if (go(380, 1) === 'arrived') { s.working = true; if (ai.work > 5 / (0.5 + s.st.med * 0.2)) { ai.work = 0; treat(w, s, b.p, b.need); s.say('Hold still. There.'); } } }
      else {
        let low = null; for (const p of w.surv) if (p !== s && p.present && !p.sleeping && (!low || p.morale < low.morale)) low = p;
        if (low && low.morale < 60) { const r = go(low.x - 26, w.entF(low)); if (r === 'arrived' && ai.work > 10) { ai.work = 0; low.addMorale(3 + (s.id === 'bea' ? 2 : 0)); if (s.id === 'bea') low.guilt = Math.max(0, low.guilt - 12); Run.trust(run, s, low, 2); s.say(CHAT.comfort[Math.floor(Math.random() * CHAT.comfort.length)]); } }
        else go(420, 1);
      }
      break; }
    case 'play': {
      const t = obj('cards') || obj('photo') || obj('drawing');
      if (t && go(t.x + (s.d.age % 3 - 1) * 22, t.f) === 'arrived') { s.working = t.type === 'cards'; if (ai.work > 10) { ai.work = 0; s.addMorale(2.2, true); const mate = w.surv.find(p => p !== s && p.job === 'play' && Math.abs(p.x - s.x) < 60 && p.f === s.f); if (mate) { mate.addMorale(1, true); Run.trust(run, s, mate, 1); } } }
      break; }
    case 'water': {
      const f = obj('filter');
      if (f && Run.count(run, 'dirty') > 0) { if (go(f.x + 12, f.f) === 'arrived') { s.working = true; if (ai.work > 8) { ai.work = 0; Run.add(run, 'dirty', -1); Run.add(run, 'water', 1); f.drip = 2; Snd.sfx('drip'); } } }
      else go(470, 4);
      break; }
    default: break;
  }
}
/* Night defense roles for survivors the player is not holding. */
function defenseAI(w, s, dt, go, obj) {
  const raider = w.npcs.find(n => n.mode === 'raid' && !n.gone), door = w.L.blockers.find(b => b.id === 'frontdoor'), ai = s.ai;
  const pavelNear = w.surv.some(p => p.id === 'pavel' && !p.down && Math.abs(p.f - s.f) <= 1);
  const scared = s.id === 'toby' || (s.id === 'yara' && !pavelNear) || s.health < 30;
  if (s.hidden) { if (!raider && !scared) { s.hidden.occ = null; s.hidden = null; } return; }
  if (!raider) { if (NIGHT_AI[s.job]) go(826, 3); return; }
  if (scared) { const h = w.L.objs.filter(o => o.type === 'hide' && !o.occ).sort((a, b) => Math.abs(a.f - s.f) - Math.abs(b.f - s.f))[0]; if (h) { if (go(h.x, h.f) === 'arrived') { s.hidden = h; h.occ = s; s.x = h.x; Bus.emit('hidden', { s }); } } return; }
  if (NIGHT_AI[s.job] || s.st.str >= 4) {
    const inside = w.npcs.find(n => n.mode === 'raid' && n.st === 'loot' && !n.gone);
    if (inside) {
      const r = go(inside.x - sgn(inside.x - s.x) * 30, inside.f); s.face = sgn(inside.x - s.x) || s.face;
      if (inside.f === s.f && Math.abs(inside.x - s.x) < 46 && s.cool <= 0) { s.hasPan = s.id !== 'pavel'; s.act('use', 0.42); s.cool = 2.2; Snd.sfx('pan'); inside.stunN++; inside.st = 'stun'; inside.wait = 1.4 / inside.stunN; inside.x += s.face * 20; inside.nerve -= 1; w.impact(inside.x, w.floorY(inside.f) - 28, 0.4); }
      return r;
    }
    if (go(830, 3) === 'arrived') { s.face = 1; s.working = true; if (!door.open) door.hp = Math.min(door.max, door.hp + dt * (s.id === 'dov' ? 4.5 : 3)); }
    return;
  }
  const pots = obj('potrack');
  if (pots) { if (go(pots.x - 16, pots.f) === 'arrived') { s.working = true; ai.work += dt; if (ai.work > 5) { ai.work = 0; OBJDEF.potrack.act(w, s).fn(); } } }
}
