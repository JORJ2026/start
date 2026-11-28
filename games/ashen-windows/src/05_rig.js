
/* ==========================================================================
   SECTION 8: ENTITIES - Survivor (data + state) and the skeletal-lite Rig
   ========================================================================== */
const COLORED_TORSO = { cardigan: 1, wind: 1, jacket: 1, sweater: 1, coat: 1, cloak: 1 };
const SURV_KEYS = ['id', 'hunger', 'fatigue', 'cold', 'health', 'morale', 'sick', 'wound', 'guilt', 'coat', 'job', 'away', 'gone', 'crit', 'low', 'trust', 'variant', 'odd', 'mem', 'coldRes', 'taken'];

class Survivor {
  constructor(id, saved) {
    this.id = id; this.d = SURVIVORS[id];
    this.hunger = 78; this.fatigue = 80; this.cold = 80; this.health = 92; this.morale = 62;
    this.sick = false; this.wound = false; this.guilt = 0; this.coat = false; this.job = 'rest';
    this.away = 0; this.gone = false; this.crit = 0; this.low = 0; this.trust = {}; this.variant = 0; this.odd = null; this.mem = 0; this.coldRes = 0; this.taken = false;
    if (saved) for (const k of SURV_KEYS) if (saved[k] !== undefined) this[k] = saved[k];
    this.resetRuntime();
  }
  resetRuntime() {
    this.x = 200; this.f = 0; this.vx = 0; this.face = 1; this.cl = null; this.jz = 0; this.jv = 0;
    this.crouch = false; this.sprint = false; this.hidden = null; this.down = false; this.stun = 0; this.prot = 0;
    this.hurtT = 0; this.actT = 0; this.actDur = 0.4; this.actKind = ''; this.comfortT = 0; this.coughT = 0; this.gestureT = 0; this.flare = 0;
    this.ph = 0; this.stepAcc = 0; this.busy = null; this.light = false; this.anim = 'idle'; this.sleeping = false; this.special = '';
    this.pose = { bob: 0, lean: 0, crouch: 0, legA: 0, legB: 0, armA: 0, armB: 0, head: 0, alpha: 1, lie: 0, shake: 0 };
    this.eyes = 'normal'; this.mouth = 'neutral'; this.blink = 2 + Math.random() * 3; this.glance = 0;
    this.sp = { scarf: new Spring(0, 90, 9), hair: new Spring(0, 140, 10), hem: new Spring(0, 110, 10) };
    this.bubble = null; this.sx = 0; this.sy = 0; this.ai = { t: 0, st: 'idle', tx: 0, tf: 0, work: 0, stuck: 0, lx: 0 };
    this.carry = null; this.carriedBy = null; this.cool = 0; this.knocks = 0; this.knockT = 0; this.waterIn = false; this.lastHitT = -99;
  }
  toJSON() { const o = {}; for (const k of SURV_KEYS) o[k] = this[k]; return o; }
  get name() { return this.d.short; }
  get present() { return !this.gone && !this.away && !this.taken; }
  get st() { if (this.odd) { const s = Object.assign({}, this.d.st); for (const k in this.odd) s[k] = clamp(s[k] + this.odd[k], 1, 5); return s; } return this.d.st; }
  hueC() { const c = this.d.hue; return [(c[0] + VARIANT_SHIFT[this.variant || 0] + 360) % 360, c[1], c[2]]; }
  /* Color is life: saturation is a function of morale. */
  sat() { const m = clamp(num(this.morale, 50) / 100, 0, 1); return clamp(lerp(0.06, 1, Math.pow(m, 0.9)) + this.flare * 0.5, 0, 1.25); }
  wears(fx) { const e = Save.data.equip.clothes[this.id]; return !!(e && CLOTHES[e] && CLOTHES[e].fx === fx); }
  statuses() {
    const o = [];
    if (this.hunger < 25) o.push('Hungry'); if (this.cold < 25) o.push('Cold'); if (this.sick) o.push('Sick'); if (this.wound) o.push('Wounded');
    if (this.fatigue < 20) o.push('Exhausted'); if (this.morale < 15) o.push('Withdrawn'); else if (this.morale > 80) o.push('Hopeful'); if (this.guilt > 25) o.push('Guilty');
    return o;
  }
  speedMul() {
    let m = 0.7 + this.st.spd * 0.1;
    if (this.hunger < 25) m *= 0.82; if (this.wound) m *= 0.78; if (this.fatigue < 20) m *= 0.86; if (this.carry) m *= 0.55; if (this.waterIn) m *= 0.62;
    return m;
  }
  noiseMul() { let m = 0.64 + this.st.noise * 0.12; if (this.id === 'ines') m *= 0.7; if (this.wears('quiet')) m *= 0.85; return m; }
  addMorale(v, quiet) {
    if (!Number.isFinite(v) || v === 0) return;
    if (v < 0) { v *= (1.3 - this.st.res * 0.1); if (this.wears('morale')) v *= 0.85; }
    const before = this.morale; this.morale = clamp(this.morale + v, 0, 100);
    if (!quiet && Math.abs(this.morale - before) >= 3) Bus.emit('moraleChange', { s: this, v: this.morale - before });
    if (v >= 4) this.comfortT = 1.6;
  }
  damage(d, src) {
    if (this.prot > 0 || this.down) return false;
    if (this.id === 'toby') d *= 1.25;
    const since = Game.time - this.lastHitT; if (since < 10) d *= 0.5;         // diminishing returns on repeated knockdowns
    this.lastHitT = Game.time;
    this.health = clamp(this.health - d, 0, 100); this.prot = CFG.iframe; this.hurtT = 0.55; this.busy = null; this.hidden = null;
    Bus.emit('hit', { s: this, d, src });
    return true;
  }
  say(text, dur) { this.bubble = { text, t: dur || 3.2, max: dur || 3.2 }; }
  act(kind, dur) { this.actKind = kind; this.actDur = dur || 0.45; this.actT = this.actDur; }
}

const Rig = {
  T: { bob: 0, lean: 0, crouch: 0, legA: 0, legB: 0, armA: 0, armB: 0, head: 0, alpha: 1, lie: 0, shake: 0 },
  /* Decide the animation state from what the survivor is doing. */
  pickAnim(s) {
    if (s.special) return s.special;                               // victory, defeat, gesture set by scenes
    if (s.down) return 'collapse'; if (s.carriedBy) return 'collapse';
    if (s.sleeping) return 'sleep'; if (s.hidden) return 'hide'; if (s.hurtT > 0) return 'hurt';
    if (s.cl) return 'climb'; if (s.jz > 1) return 'jump';
    if (s.actT > 0) return s.actKind || 'interact'; if (s.busy || s.working) return 'interact';
    if (s.coughT > 0) return 'cough'; if (s.comfortT > 0) return 'comforted'; if (s.gestureT > 0) return 'gesture';
    if (Math.abs(s.vx) > 4) return s.crouch ? 'sneak' : s.sprint ? 'run' : 'walk';
    if (s.crouch) return 'crouch'; if (s.cold < 25) return 'shiver';
    return 'idle';
  },
  /* Target pose for an animation; the live pose eases toward it (anticipation and follow-through come from the easing lag). */
  target(s, t) {
    const T = this.T, a = s.anim; T.bob = 0; T.lean = 0; T.crouch = 0; T.legA = 0; T.legB = 0; T.armA = 0; T.armB = 0; T.head = 0; T.alpha = 1; T.lie = 0; T.shake = 0;
    let eyes = 'normal', mouth = 'neutral';
    const ph = s.ph, sw = Math.sin(ph);
    switch (a) {
      case 'walk': T.legA = sw * 0.6; T.legB = -sw * 0.6; T.armA = -sw * 0.5; T.armB = sw * 0.5; T.bob = Math.abs(sw) * 1.2; T.lean = 0.05; if (s.wound) { T.bob += Math.max(0, sw) * 2; T.lean = 0.12; } break;
      case 'sneak': T.crouch = 0.5; T.legA = sw * 0.42; T.legB = -sw * 0.42; T.armA = 0.5 - sw * 0.2; T.armB = 0.4 + sw * 0.2; T.lean = 0.22; eyes = 'wide'; break;
      case 'run': T.legA = sw * 0.95; T.legB = -sw * 0.95; T.armA = -sw * 0.95; T.armB = sw * 0.95; T.bob = Math.abs(sw) * 2.2; T.lean = 0.24; mouth = 'o'; break;
      case 'climb': { const c = Math.sin(t * 9); T.armA = 2.5 + c * 0.4; T.armB = 2.5 - c * 0.4; T.legA = 0.5 + c * 0.4; T.legB = 0.5 - c * 0.4; T.lean = 0.06; break; }
      case 'jump': T.armA = -0.9; T.armB = 1.4; T.legA = 0.7; T.legB = -0.3; T.lean = 0.12; mouth = 'o'; break;
      case 'crouch': T.crouch = 0.55; T.armA = 0.4; T.armB = 0.3; T.lean = 0.15; break;
      case 'hide': T.crouch = 0.4; T.alpha = 0.3; T.armA = 0.8; T.armB = 0.8; eyes = 'wide'; break;
      case 'interact': T.lean = 0.3; T.armA = 1.25 + Math.sin(t * 14) * 0.25; T.armB = 0.9 + Math.cos(t * 14) * 0.2; break;
      case 'use': { const k = 1 - s.actT / s.actDur; T.armA = k < 0.3 ? -1.3 : 1.9; T.lean = k < 0.3 ? -0.18 : 0.3; T.legA = 0.3; mouth = 'grit'; break; }
      case 'throw': { const k = 1 - s.actT / s.actDur; T.armA = k < 0.35 ? -2.4 : 1.6; T.lean = k < 0.35 ? -0.22 : 0.26; mouth = 'grit'; break; }
      case 'eat': T.armA = 2.1 + Math.sin(t * 10) * 0.15; mouth = Math.sin(t * 10) > 0 ? 'o' : 'neutral'; T.head = 0.1; break;
      case 'sleep': T.lie = 1; eyes = 'closed'; break;
      case 'shiver': T.shake = 0.8; T.armA = 1.0; T.armB = 1.0; T.crouch = 0.1; eyes = 'squint'; mouth = 'grit'; break;
      case 'cough': T.lean = 0.25 + Math.abs(Math.sin(t * 16)) * 0.2; T.armA = 2.0; eyes = 'squint'; mouth = 'o'; break;
      case 'hurt': T.lean = -0.32; T.armA = -0.8; T.armB = 1.2; T.legA = -0.3; eyes = 'squint'; mouth = 'grit'; break;
      case 'collapse': T.lie = 0.92; eyes = 'closed'; mouth = 'worried'; break;
      case 'comforted': T.bob = Math.abs(Math.sin(t * 6)) * 1.5; eyes = 'hopeful'; mouth = 'smile'; T.armA = 0.3; T.armB = 0.3; break;
      case 'gesture': T.armA = 2.5 + Math.sin(t * 12) * 0.35; eyes = 'hopeful'; mouth = 'smile'; break;
      case 'victory': T.armA = 1.05; T.armB = 1.05; T.bob = Math.sin(t * 2) * 0.6; eyes = 'hopeful'; mouth = 'smile'; break;
      case 'defeat': T.alpha = 0.25; T.head = 0.4; T.lean = 0.14; eyes = 'closed'; mouth = 'worried'; break;
      case 'sit': T.crouch = 0.75; T.armA = 0.8; T.armB = 0.6; T.legA = 1.2; T.legB = 1.0; mouth = 'smile'; break;
      default: T.bob = Math.sin(t * 1.7 + s.x * 0.01) * 0.6; T.armA = Math.sin(t * 1.7) * 0.04; T.armB = -T.armA; T.head = s.glance * 0.12;
    }
    // mood overrides for the face
    if (eyes === 'normal') {
      if (s.fatigue < 20) eyes = 'tired'; else if (s.morale < 15) eyes = 'teary'; else if (s.morale > 80) eyes = 'hopeful'; else if (s.flare > 0.1) eyes = 'wide';
      if (s.blink < 0.12) eyes = 'closed';
    }
    if (mouth === 'neutral') { if (s.morale > 72) mouth = 'smile'; else if (s.morale < 28 || s.hunger < 20) mouth = 'worried'; }
    s.eyes = eyes; s.mouth = mouth; return T;
  },
  update(s, dt, t) {
    s.anim = this.pickAnim(s);
    const T = this.target(s, t), P = s.pose, k = Math.min(1, dt * 14);
    for (const key in T) P[key] += (T[key] - P[key]) * k;
    s.blink -= dt; if (s.blink < 0) s.blink = 2.5 + Math.random() * 3.5;
    if (Math.random() < dt * 0.25) s.glance = Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? -1 : 1);
    const sp = s.sp, mv = Math.abs(s.vx);
    sp.scarf.t = clamp(mv * 0.075, 0, 10) + Math.sin(t * 2.1 + s.x * 0.02) * 1.2; sp.hair.t = clamp(mv * 0.04, 0, 5); sp.hem.t = clamp(mv * 0.03, 0, 4);
    sp.scarf.step(dt); sp.hair.step(dt); sp.hem.step(dt);
    for (const key of ['hurtT', 'actT', 'comfortT', 'coughT', 'gestureT', 'prot', 'stun', 'cool']) if (s[key] > 0) s[key] = Math.max(0, s[key] - dt);
    s.flare = Math.max(0, s.flare - dt * 0.9);
    if (s.lastFace !== s.face) { if (s.lastFace) s.turnT = 1; s.lastFace = s.face; }
    s.turnT = Math.max(0, num(s.turnT) - dt * 9); s.land = Math.max(0, num(s.land) - dt * 6);
    if (s.bubble) { s.bubble.t -= dt; if (s.bubble.t <= 0) s.bubble = null; }
  },

  /* Draw a survivor in full color at feet position (x, y). o: { scale, alpha, mono } */
  draw(ctx, s, x, y, o) {
    o = o || {}; const P = s.pose, b = s.d.b, sc = o.scale || 1, hh = b.h, bw = b.w, dir = s.face || 1, t = Game.time;
    const sat = o.mono ? 0 : s.sat(), C = s.hueC(), sk = s.d.skin;
    const main = hsl(C, sat), muted = hsl(C, sat * 0.32, -20), dark = hsl(C, sat * 0.85, -15);
    const skinC = hsl(sk, Math.max(0.18, sat) * (s.sick ? 0.5 : 1), (s.sick ? 8 : 0) + (s.cold < 25 ? 5 : 0));
    const hairC = grey(s.d.hair * 2.4 + 10), torsoC = COLORED_TORSO[b.acc] ? main : muted, pants = grey(34), shoe = grey(18);
    const alpha = (o.alpha == null ? 1 : o.alpha) * clamp(P.alpha, 0, 1), clothes = Save.data.equip.clothes[s.id];
    ctx.save(); ctx.translate(x, y);
    // ground shadow, plus the faint second shadow that follows the guilty
    ctx.fillStyle = 'rgba(0,0,0,' + (0.35 * alpha) + ')'; ctx.beginPath(); ctx.ellipse(0, 1, 11 * bw * sc, 2.6 * sc, 0, 0, TAU); ctx.fill();
    if (s.guilt > 25 && !o.mono) { ctx.fillStyle = 'rgba(0,0,0,' + (0.22 * alpha) + ')'; ctx.beginPath(); ctx.ellipse(-dir * 12 * sc, -12 * sc, 8 * sc, 16 * sc, 0, 0, TAU); ctx.fill(); }
    ctx.translate(0, -(s.jz || 0));
    if (!o.mono && (s.morale > 80 || s.flare > 0.05)) {             // hopeful glow / close-call flare
      const r = 30 * sc * (1 + s.flare), g = ctx.createRadialGradient(0, -24 * sc, 2, 0, -24 * sc, r);
      g.addColorStop(0, hsl(C, 1, 12, 0.2 + s.flare * 0.35)); g.addColorStop(1, hsl(C, 1, 12, 0)); ctx.fillStyle = g; ctx.fillRect(-r, -24 * sc - r, r * 2, r * 2);
    }
    ctx.globalAlpha = alpha;
    if (s.sprint && Math.abs(s.vx) > 100 && !Save.s.lowfx) { ctx.globalAlpha = alpha * 0.25; ctx.fillStyle = main; ctx.fillRect(-dir * 20 * sc, -34 * sc * hh, 12 * sc, 22 * sc * hh); ctx.globalAlpha = alpha; }   // smear on fast motion
    // squash on landing, stretch while rising, a quick pinch when turning around, a shudder when hurt
    const sq = Save.s.reduce ? 0 : num(s.land) * 0.16 - (s.jv > 40 ? 0.06 : 0), tn = Save.s.reduce ? 0 : num(s.turnT) * 0.28;
    if (s.hurtT > 0.25 && !Save.s.reduce) ctx.translate(Math.sin(t * 70) * 1.6 * s.hurtT, 0);
    ctx.scale(dir * sc * (1 + sq) * (1 - tn), sc * (1 - sq));
    if (P.lie > 0.02) { ctx.translate(-8 * P.lie, -4 * P.lie); ctx.rotate(-Math.PI / 2 * P.lie * 0.97); }
    if (P.shake > 0.05) ctx.translate(Math.sin(t * 38) * P.shake, 0);
    const legL = 14 * hh * (1 - P.crouch * 0.5), torsoH = 18 * hh * (1 - P.crouch * 0.12) * (1 + (Save.s.reduce || o.mono ? 0 : Math.sin(t * (s.sleeping ? 1.6 : 2.3) + s.x * 0.03) * (s.sleeping ? 0.04 : 0.022))), headR = s.id === 'toby' ? 6.4 : 6.8, hipY = -legL - P.bob, tw = 13 * bw;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const leg = (ang, ox) => {
      const fx = ox + Math.sin(ang) * legL, fy = hipY + Math.cos(ang) * legL;
      ctx.strokeStyle = pants; ctx.lineWidth = 4.6 * Math.min(1.15, bw); ctx.beginPath(); ctx.moveTo(ox, hipY); ctx.lineTo(fx, Math.min(0, fy)); ctx.stroke();
      ctx.fillStyle = shoe; ctx.beginPath(); ctx.ellipse(fx + 1.6, Math.min(0, fy) - 0.6, 3.6, 2, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = clothes === 'softsoles' ? grey(150) : grey(62); ctx.fillRect(fx - 1.8, Math.min(0, fy) + 0.6, 6.8, clothes === 'softsoles' ? 1.4 : 0.8);
    };
    const arm = (ang, front) => {
      const L = 12.5 * hh, sx0 = front ? 1.5 : -1, sy0 = -torsoH + 4, hx = sx0 + Math.sin(ang) * L, hy = sy0 + Math.cos(ang) * L;
      ctx.strokeStyle = front ? torsoC : (COLORED_TORSO[b.acc] ? dark : muted); ctx.lineWidth = 4 * Math.min(1.2, bw); ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.fillStyle = clothes === 'mitts' ? (o.mono ? grey(150) : hsl(C, Math.max(0.4, sat), 6)) : skinC; ctx.beginPath(); ctx.arc(hx, hy, clothes === 'mitts' ? 2.8 : 2.3, 0, TAU); ctx.fill();
      return [hx, hy];
    };
    leg(P.legB, -2.4 * bw);
    ctx.save(); ctx.translate(0, hipY); ctx.rotate(P.lean);
    arm(P.armB, false);
    ctx.restore();
    leg(P.legA, 2.4 * bw);
    ctx.save(); ctx.translate(0, hipY); ctx.rotate(P.lean);
    if (o.pack && P.lie < 0.3) { ctx.fillStyle = grey(58); rrect(ctx, -tw / 2 - 5, -torsoH + 2, 8, 13, 2.5); ctx.fill(); ctx.fillStyle = grey(40); ctx.fillRect(-tw / 2 - 5, -torsoH + 7, 8, 1.4); ctx.strokeStyle = grey(30); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-tw / 2 + 2, -torsoH + 2); ctx.lineTo(tw / 2 - 3, -torsoH + 12); ctx.stroke(); }
    // torso with a spring-lagged hem
    const hem = s.sp.hem.x;
    ctx.fillStyle = torsoC; ctx.beginPath();
    ctx.moveTo(-tw / 2 - hem * 0.6, 2); ctx.lineTo(tw / 2, 1); ctx.lineTo(tw / 2 - 1, -torsoH + 4); ctx.quadraticCurveTo(tw / 2 - 1, -torsoH, tw / 2 - 5, -torsoH);
    ctx.lineTo(-tw / 2 + 5, -torsoH); ctx.quadraticCurveTo(-tw / 2 + 1, -torsoH, -tw / 2 + 1, -torsoH + 4); ctx.closePath(); ctx.fill();
    // ink contour and a shaded back half give the torso volume
    ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,0.17)'; ctx.fillRect(-tw / 2 - 4, -torsoH, tw * 0.36 + 4, torsoH + 4); ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(tw / 2 - 3, -torsoH, 3, torsoH); ctx.restore();
    ctx.strokeStyle = 'rgba(8,8,8,0.42)'; ctx.lineWidth = 0.8; ctx.stroke();
    if (b.acc === 'cardigan') { ctx.strokeStyle = dark; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(2, -torsoH + 2); ctx.lineTo(2, 1); ctx.stroke(); ctx.fillStyle = dark; for (let i = 0; i < 3; i++) ctx.fillRect(3, -torsoH + 6 + i * 4, 1.4, 1.4); }
    if (b.acc === 'coat' || b.acc === 'cloak') { ctx.fillStyle = dark; ctx.fillRect(-tw / 2 + 1, -torsoH, tw - 2, 3); ctx.fillRect(1, -torsoH + 3, 1.5, torsoH - 3); if (b.acc === 'cloak') { ctx.fillStyle = torsoC; ctx.fillRect(-tw / 2 - hem, -2, tw + hem, 6); } }
    if (b.acc === 'wind') { ctx.strokeStyle = grey(235, 0.7); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-tw / 2 + 1, -torsoH + 7); ctx.lineTo(tw / 2 - 1, -torsoH + 7); ctx.stroke(); }
    if (b.acc === 'jacket') { ctx.fillStyle = dark; ctx.fillRect(-tw / 2 + 1, -5, tw - 2, 2); ctx.fillRect(1.5, -torsoH + 2, 1.2, torsoH - 4); }
    if (b.acc === 'sweater') { ctx.strokeStyle = dark; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-tw / 2 + 2, -torsoH + 6 + i * 4); ctx.lineTo(tw / 2 - 2, -torsoH + 6 + i * 4); ctx.stroke(); } ctx.strokeStyle = grey(60); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -torsoH + 1, 5, 0.2, Math.PI - 0.2); ctx.stroke(); }
    if (b.acc === 'shawl') { ctx.fillStyle = main; ctx.beginPath(); ctx.moveTo(-tw / 2 - 2 - hem * 0.5, -torsoH + 11); ctx.lineTo(0, -torsoH - 1); ctx.lineTo(tw / 2 + 2, -torsoH + 9); ctx.lineTo(tw / 2, -torsoH + 3); ctx.lineTo(-tw / 2, -torsoH + 3); ctx.closePath(); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 0.8; ctx.stroke(); }
    if (s.coat) { ctx.strokeStyle = grey(150, 0.8); ctx.lineWidth = 1.2; ctx.strokeRect(-tw / 2 + 1.5, -torsoH + 4, tw - 3, torsoH - 5); }
    // faint colored rim light, always present so identity survives low morale
    if (!o.mono) { ctx.strokeStyle = hsl(C, Math.max(sat, 0.62), 16, 0.55); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(tw / 2, 1); ctx.lineTo(tw / 2 - 1, -torsoH + 4); ctx.quadraticCurveTo(tw / 2 - 1, -torsoH, tw / 2 - 5, -torsoH); ctx.stroke(); }
    // head
    ctx.save(); ctx.translate(1, -torsoH - headR + 1.5); ctx.rotate(P.head);
    const hs = s.sp.hair.x;
    if (b.hair === 'pony') { ctx.strokeStyle = hairC; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-headR + 1, -2); ctx.quadraticCurveTo(-headR - 5 - hs, 0, -headR - 4 - hs * 1.6, 8); ctx.stroke(); }
    if (b.hair === 'bun') { ctx.fillStyle = hairC; ctx.beginPath(); ctx.arc(-headR + 0.5, -headR + 1, 3.2, 0, TAU); ctx.fill(); }
    if (b.hair === 'hood') { ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(-1, 0, headR + 2.5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = skinC; ctx.beginPath(); ctx.arc(0, 0, headR, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(8,8,8,0.35)'; ctx.lineWidth = 0.7; ctx.stroke();
    ctx.fillStyle = skinC; ctx.beginPath(); ctx.arc(headR - 0.3, 0.9, 1.35, -1.2, 1.6); ctx.fill();                                   // nose
    if (s.cold < 25 && !o.mono) { ctx.fillStyle = 'hsla(356,70%,62%,0.55)'; ctx.beginPath(); ctx.arc(headR - 0.1, 1, 1.1, 0, TAU); ctx.fill(); }   // a cold red nose
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.arc(-1.4, 0.8, 1.7, 0, TAU); ctx.fill();                              // ear
    ctx.fillStyle = hairC;
    if (b.hair === 'bun' || b.hair === 'pony' || b.hair === 'bob') { ctx.beginPath(); ctx.arc(0, 0, headR + 0.4, Math.PI * 0.95, Math.PI * 1.95); ctx.lineTo(headR * 0.3, -headR * 0.35); ctx.closePath(); ctx.fill(); if (b.hair === 'bob') ctx.fillRect(-headR - 0.4, -2, 3.4, headR + 2 + hs * 0.3); }
    if (b.hair === 'grey') { ctx.beginPath(); ctx.arc(0, 0, headR + 0.5, Math.PI * 0.9, Math.PI * 1.9); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(-headR * 0.5, -headR, 3, 0, TAU); ctx.fill(); ctx.strokeStyle = grey(30); ctx.lineWidth = 0.7; ctx.strokeRect(1, -2.2, 2.6, 2.4); ctx.strokeRect(4.2, -2.2, 2.2, 2.4); }
    if (b.hair === 'cap') { ctx.beginPath(); ctx.arc(-1.5, 0, headR, Math.PI * 0.75, Math.PI * 1.2); ctx.fill(); ctx.fillStyle = grey(46); ctx.beginPath(); ctx.arc(0, -1.5, headR + 0.5, Math.PI, TAU); ctx.fill(); ctx.fillRect(headR - 2, -2.6, 5.5, 1.8); }
    if (b.hair === 'beanie') { ctx.fillStyle = grey(52); ctx.beginPath(); ctx.arc(0, -1.2, headR + 0.6, Math.PI * 0.98, Math.PI * 2.02); ctx.fill(); ctx.fillStyle = grey(70); ctx.fillRect(-headR - 0.6, -2.4, headR * 2 + 1.2, 2.2); ctx.fillStyle = grey(40, 0.5); ctx.fillRect(1, 2.6, 4.5, 2.6); }
    if (b.hair === 'hat') { ctx.fillStyle = main; ctx.beginPath(); ctx.arc(0, -1.4, headR + 0.9, Math.PI * 0.98, Math.PI * 2.02); ctx.fill(); ctx.fillStyle = dark; ctx.fillRect(-headR - 0.9, -2.6, headR * 2 + 1.8, 2.3); ctx.fillStyle = main; ctx.beginPath(); ctx.arc(-1 - hs * 0.4, -headR - 2.4, 2.4, 0, TAU); ctx.fill(); }
    if (b.hair === 'bald') { ctx.fillStyle = grey(70); ctx.fillRect(2, 2.2, 5, 1.6); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.arc(-1, -3.4, 1.6, 0, TAU); ctx.fill(); }
    if (b.hair === 'bun' || b.hair === 'pony' || b.hair === 'bob' || b.hair === 'grey') { ctx.strokeStyle = 'rgba(255,255,255,0.24)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(0, 0, headR - 1.1, Math.PI * 1.22, Math.PI * 1.5); ctx.stroke(); }   // hair sheen
    // face: eyes, brows, mouth, blush or pallor
    const ex = [headR * 0.18 + s.glance * 0.6, headR * 0.66 + s.glance * 0.6], ey = -0.6, ink = grey(18);
    ctx.fillStyle = ink; ctx.strokeStyle = ink; ctx.lineWidth = 0.9;
    for (let i = 0; i < 2; i++) {
      const X = ex[i];
      if (s.eyes === 'closed') { ctx.beginPath(); ctx.moveTo(X - 1.1, ey); ctx.lineTo(X + 1.1, ey); ctx.stroke(); }
      else if (s.eyes === 'squint') { ctx.beginPath(); ctx.moveTo(X - 1.1, ey - 0.6); ctx.lineTo(X + 1, ey + 0.3); ctx.stroke(); }
      else if (s.eyes === 'wide') { ctx.fillStyle = grey(240); ctx.beginPath(); ctx.arc(X, ey, 1.7, 0, TAU); ctx.fill(); ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(X, ey, 0.9, 0, TAU); ctx.fill(); }
      else {
        ctx.beginPath(); ctx.arc(X, ey, 1.05, 0, TAU); ctx.fill(); ctx.fillStyle = grey(255, 0.85); ctx.fillRect(X + 0.1, ey - 0.75, 0.5, 0.5); ctx.fillStyle = ink;
        if (s.eyes === 'tired') { ctx.beginPath(); ctx.moveTo(X - 1.3, ey - 0.9); ctx.lineTo(X + 1.3, ey - 0.9); ctx.stroke(); ctx.fillStyle = grey(30, 0.3); ctx.fillRect(X - 1.2, ey + 1.2, 2.4, 0.8); ctx.fillStyle = ink; }
        if (s.eyes === 'teary') { ctx.fillStyle = grey(235, 0.9); ctx.beginPath(); ctx.arc(X + 0.4, ey + 2 + (t * 3 % 2), 0.7, 0, TAU); ctx.fill(); ctx.fillStyle = ink; }
        if (s.eyes === 'hopeful') { ctx.fillStyle = grey(255); ctx.fillRect(X + 0.1, ey - 0.8, 0.7, 0.7); ctx.fillStyle = ink; }
      }
    }
    const br = s.eyes === 'hopeful' ? -0.5 : (s.mouth === 'worried' || s.eyes === 'teary') ? 0.6 : s.mouth === 'grit' ? -0.9 : 0;
    ctx.beginPath(); ctx.moveTo(ex[0] - 1.2, ey - 2.6 + br); ctx.lineTo(ex[0] + 1.1, ey - 2.6 - br); ctx.moveTo(ex[1] - 1, ey - 2.6 - br * 0.5); ctx.lineTo(ex[1] + 1.1, ey - 2.6 + br * 0.4); ctx.stroke();
    const mx = headR * 0.42, my = 3;
    ctx.beginPath();
    if (s.mouth === 'smile') ctx.arc(mx, my - 0.8, 1.9, 0.15, Math.PI - 0.15);
    else if (s.mouth === 'worried') ctx.arc(mx, my + 1.4, 1.7, Math.PI + 0.25, TAU - 0.25);
    else if (s.mouth === 'o') ctx.arc(mx, my, 1.1, 0, TAU);
    else if (s.mouth === 'grit') { ctx.moveTo(mx - 1.8, my); ctx.lineTo(mx - 0.6, my + 0.7); ctx.lineTo(mx + 0.6, my - 0.2); ctx.lineTo(mx + 1.8, my + 0.5); }
    else { ctx.moveTo(mx - 1.4, my); ctx.lineTo(mx + 1.4, my); }
    ctx.stroke();
    if (!o.mono && (s.comfortT > 0 || s.morale > 80)) { ctx.fillStyle = hsl([8, 70, 60], sat, 0, 0.4); ctx.beginPath(); ctx.arc(headR * 0.1, 2, 1.5, 0, TAU); ctx.fill(); }
    const cl = Save.data.equip.clothes[s.id];
    if (cl === 'glasses' && b.hair !== 'grey') { ctx.strokeStyle = grey(25); ctx.lineWidth = 0.7; ctx.strokeRect(0.2, -2.2, 2.6, 2.4); ctx.strokeRect(3.6, -2.2, 2.4, 2.4); }
    if (cl === 'ribbon' && !o.mono) { ctx.fillStyle = hsl(C, sat, 10); ctx.beginPath(); ctx.moveTo(-headR + 1, -headR + 1); ctx.lineTo(-headR - 3, -headR - 2); ctx.lineTo(-headR - 3, -headR + 4); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // scarf with trailing spring tail (signature item for scarf-wearers; grey wool scarf from the wardrobe)
    if (b.acc === 'scarf' || cl === 'wool') {
      const sc2 = b.acc === 'scarf' ? main : grey(165), tail = s.sp.scarf.x;
      ctx.fillStyle = sc2; ctx.fillRect(-tw / 2 + 1, -torsoH - 1, tw - 1, 4.2);
      ctx.strokeStyle = sc2; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-tw / 2 + 2, -torsoH + 1); ctx.quadraticCurveTo(-tw / 2 - 3 - tail * 0.6, -torsoH + 3 - tail * 0.2, -tw / 2 - 4 - tail, -torsoH + 10 - tail * 0.5); ctx.stroke();
    }
    if (b.hair === 'bob') { ctx.strokeStyle = grey(70); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, -torsoH + 1.5, 5.2, 0.1, Math.PI - 0.1); ctx.stroke(); }
    const hand = arm(P.armA, true);
    if (s.light && !s.hidden) { ctx.fillStyle = grey(190); ctx.fillRect(hand[0] - 1, hand[1] - 1.5, 6, 3); ctx.fillStyle = grey(255); ctx.fillRect(hand[0] + 4.4, hand[1] - 2, 1.4, 4); }
    if ((s.anim === 'use') && (s.id === 'pavel' || s.hasPan)) { ctx.strokeStyle = grey(120); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(hand[0], hand[1]); ctx.lineTo(hand[0] + Math.sin(P.armA) * 13, hand[1] + Math.cos(P.armA) * 13); ctx.stroke(); }
    ctx.restore();
    // one-second protection after a hit: a blinking outline (kept at 3 Hz)
    if (s.prot > 0 && Math.sin(t * TAU * 3) > 0) { ctx.strokeStyle = grey(255, 0.8); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, hipY - torsoH * 0.5, tw * 0.9, legL + torsoH * 0.7, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
  },

  /* Greyscale silhouettes for everyone who is not a survivor. */
  drawNPC(ctx, n, x, y, a) {
    const T = n.T, dir = n.face || 1, t = Game.time, mv = Math.abs(n.vx) > 3, sw = mv ? Math.sin(n.ph) : 0;
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a == null ? 1 : a;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 1, 10 * T.h, 2.4, 0, 0, TAU); ctx.fill();
    ctx.scale(dir, 1); ctx.lineCap = 'round';
    if (n.st === 'stun') ctx.rotate(Math.sin(t * 20) * 0.06);
    const breathe = mv || Save.s.reduce ? 0 : Math.sin(t * 2 + n.x * 0.1) * 0.6;
    if (n.type === 'dog' || n.type === 'cat') {
      const s = n.type === 'cat' ? 0.62 : 1, col = n.type === 'cat' ? grey(92) : grey(58), bob = mv ? Math.abs(sw) * 1.5 : 0;
      ctx.scale(s, s); ctx.strokeStyle = col; ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) { const lx = -9 + i * 6, la = (i % 2 ? sw : -sw) * 0.5; ctx.beginPath(); ctx.moveTo(lx, -11 - bob); ctx.lineTo(lx + Math.sin(la) * 10, -1); ctx.stroke(); }
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -14 - bob, 13, 6, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(13, -19 - bob, 5.2, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(10, -23 - bob); ctx.lineTo(11.5, -28 - bob); ctx.lineTo(14, -23 - bob); ctx.moveTo(14, -23 - bob); ctx.lineTo(16.5, -28 - bob); ctx.lineTo(17.5, -22 - bob); ctx.fill();
      ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-12, -16 - bob); ctx.quadraticCurveTo(-18, -22 - bob + Math.sin(t * (n.st === 'chase' ? 14 : 4)) * 3, -19, -27 - bob + Math.sin(t * 5) * 2); ctx.stroke();
      ctx.fillStyle = grey(225); ctx.fillRect(15, -20.5 - bob, 1.6, 1.6);
      if (n.type === 'dog') { ctx.fillStyle = col; ctx.fillRect(16, -18 - bob, 5, 3.4); ctx.strokeStyle = grey(150); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(11, -18 - bob, 4.6, -0.3, 1.9); ctx.stroke();   // collar
        if (n.st === 'chase' || n.st === 'hostile') { ctx.fillStyle = grey(170); ctx.fillRect(18.5, -14.8 - bob, 2, 3 + Math.abs(Math.sin(t * 12)) * 1.5); }                  // panting tongue
        if (n.aw > 0.3) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(10, -23 - bob); ctx.lineTo(10.5, -31 - bob); ctx.lineTo(13, -23 - bob); ctx.fill(); } }             // ears up
      if (n.type === 'cat') { ctx.fillStyle = grey(235); ctx.beginPath(); ctx.arc(15.8, -19.7 - bob, 1.4, 0, TAU); ctx.fill(); ctx.fillStyle = grey(200); ctx.fillRect(-20, -28 - bob + Math.sin(t * 5) * 2, 3, 2); }   // bright eyes, pale tail tip
      ctx.restore(); return;
    }
    const H = 46 * T.h, legL = 15 * T.h, body = n.type === 'patrol' ? grey(30) : n.type === 'civ' ? grey(86) : n.type === 'census' ? grey(38) : grey(48);
    ctx.strokeStyle = grey(22); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-2.5, -legL); ctx.lineTo(-2.5 - Math.sin(sw * 0.6) * legL, -1); ctx.moveTo(2.5, -legL); ctx.lineTo(2.5 + Math.sin(sw * 0.6) * legL, -1); ctx.stroke();
    ctx.fillStyle = grey(12); for (const lx of [-2.5 - Math.sin(sw * 0.6) * legL, 2.5 + Math.sin(sw * 0.6) * legL]) { ctx.beginPath(); ctx.ellipse(lx + 1.8, -1.2, 3.8, 2.1, 0, 0, TAU); ctx.fill(); }   // boots
    const lean = n.st === 'chase' ? 0.18 : n.st === 'hostile' ? 0.3 : 0;
    ctx.save(); ctx.translate(0, -legL); ctx.rotate(lean);
    ctx.translate(0, -breathe * 0.4);
    if (n.type === 'patrol') { ctx.strokeStyle = grey(16); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-9, -(H - legL - 8)); ctx.lineTo(-3, 2); ctx.stroke(); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-7, -(H - legL - 10)); ctx.lineTo(5, -4); ctx.stroke(); }   // rifle on the back
    if (n.type === 'scav' || n.type === 'raider') { ctx.fillStyle = grey(70); ctx.beginPath(); ctx.ellipse(-8, -(H - legL) * 0.45, 5.5, 8, -0.2, 0, TAU); ctx.fill(); ctx.strokeStyle = grey(40); ctx.lineWidth = 0.8; ctx.stroke(); }   // stuffed sack
    if (n.type === 'civ') { ctx.fillStyle = grey(130); rrect(ctx, 5, -10, 9, 8, 2); ctx.fill(); }                                                                      // bundle
    ctx.fillStyle = body; rrect(ctx, -7.5, -(H - legL - 12), 15, H - legL - 9, 4); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 0.8; ctx.stroke();
    if (n.type === 'patrol' || n.type === 'census') { ctx.fillStyle = grey(14); ctx.fillRect(-7.5, -8, 15, 2.2); ctx.fillStyle = grey(110); ctx.fillRect(2.5, -8, 2, 2.2); for (let i = 0; i < 3; i++) ctx.fillRect(4.5, -(H - legL - 15) + i * 6, 1.2, 1.2); }   // belt, buckle, buttons
    if (n.type === 'census') { ctx.fillStyle = grey(170); ctx.fillRect(-7.5, -(H - legL - 18), 3, 5); }                                                     // armband
    if (n.type === 'patrol' || n.type === 'census') { ctx.fillRect(-8.5, -4, 17, 9); }                        // long coat
    const armA = n.st === 'hostile' ? 1.9 : n.st === 'chase' ? 1.2 : -sw * 0.5;
    ctx.strokeStyle = body; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(1, -(H - legL - 15)); ctx.lineTo(1 + Math.sin(armA) * 13, -(H - legL - 15) + Math.cos(armA) * 13); ctx.stroke();
    const hy = -(H - legL - 6);
    ctx.fillStyle = n.type === 'civ' ? grey(120) : grey(60); ctx.beginPath(); ctx.arc(1, hy, 6.6, 0, TAU); ctx.fill();
    if (n.type === 'patrol') { ctx.fillStyle = grey(24); ctx.beginPath(); ctx.arc(1, hy - 1, 7.6, Math.PI, TAU); ctx.fill(); ctx.fillRect(-7, hy - 1.6, 16, 2); ctx.strokeStyle = grey(16); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-3, hy); ctx.quadraticCurveTo(0, hy + 7, 5, hy + 5); ctx.stroke(); ctx.fillStyle = grey(70, 0.6); ctx.fillRect(-3, hy - 7, 6, 1); }   // chin strap, helmet shine
    else if (n.type === 'scav' || n.type === 'raider') { ctx.fillStyle = grey(34); ctx.beginPath(); ctx.arc(0, hy, 7.8, Math.PI * 0.6, Math.PI * 1.9); ctx.fill(); }
    else if (n.type === 'census') { ctx.fillStyle = grey(24); ctx.fillRect(-6, hy - 8, 14, 4); ctx.fillRect(-8, hy - 4.6, 18, 1.6); ctx.fillStyle = grey(200); ctx.fillRect(8, -(H - legL - 22), 6, 8); }
    else { ctx.fillStyle = grey(70); ctx.beginPath(); ctx.arc(1, hy - 0.5, 7, Math.PI, TAU); ctx.fill(); if (n.type === 'civ') { ctx.beginPath(); ctx.moveTo(-6, hy - 1); ctx.lineTo(-9, hy + 7); ctx.lineTo(-3, hy + 4); ctx.fill(); } }   // headscarf tail
    ctx.fillStyle = grey(n.aw > 0.5 ? 255 : 200); ctx.fillRect(3.4, hy - 1.2, 1.5, 1.5); ctx.fillRect(6, hy - 1.2, 1.3, 1.5);
    ctx.restore(); ctx.restore();
  }
};
