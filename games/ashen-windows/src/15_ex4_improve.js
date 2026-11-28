
/* ==========================================================================
   SECTION 25: EXPANSION IV - five improvements
   1. Afterwards: a page of its own after a win, one survivor at a time.
   2. "What should we do?": the journal reads the room and suggests next steps.
   3. Bonds and stories: who trusts whom, and how far each personal story has gone.
   4. The way home: edge-of-screen pointers to the street door (and letters) at night.
   5. The radio plays music: some stations change the soundtrack for a while.
   ========================================================================== */

/* --- 1. Afterwards --- */
class AfterScene {
  enter(p) {
    this.p = p; this.t = 0; this.shown = 0; this.next = 0.6; this.done = false; const run = Game.run;
    this.rows = run.surv.map(s => ({ s, gone: s.gone, line: s.gone ? s.name + ' is remembered, every time somebody lights a candle.' : (EPILOGUES[s.id] || EPILOGUES.lamp)[run.flags['ep_' + s.id] === 'good' ? 0 : 1], good: run.flags['ep_' + s.id] === 'good' }));
    for (const r of this.rows) { r.s.resetRuntime(); r.s.special = r.gone ? 'defeat' : 'victory'; if (!r.gone) r.s.morale = Math.max(r.s.morale, r.good ? 95 : 75); }
    Snd.setTrack('ending'); Snd.tension = 0;
  }
  update(dt) {
    this.t += dt; for (const r of this.rows) Rig.update(r.s, dt, this.t);
    if (this.shown < this.rows.length) { this.next -= dt; if (this.next <= 0) { this.shown++; this.next = 1.1; Snd.sfx('chime'); const r = this.rows[this.shown - 1]; if (!r.gone) r.s.flare = 0.8; } }
    if (this.t > 0.5 && (Input.menu.ok || Input.ptr.click || Input.menu.back)) { if (this.shown < this.rows.length) this.shown = this.rows.length; else if (!this.done) { this.done = true; this.p.next(); } }
  }
  render(ctx) {
    Render.building(ctx, this.t, { x: 760, dawn: true, color: this.t > 2 });
    ctx.fillStyle = grey(0, 0.35); ctx.fillRect(0, 0, W, H);
    UI.paper(ctx, 30, 24, 640, 492, { seed: 61, rot: -0.003 });
    txt(ctx, 'Afterwards', 56, 62, 20, G.ink, 'left', { outline: false, serif: true });
    const rh = Math.min(84, 420 / Math.max(1, this.rows.length));
    this.rows.forEach((r, i) => {
      if (i >= this.shown) return; const y = 84 + i * rh, a = clamp((i === this.shown - 1 ? 1.1 - this.next : 1) / 0.5, 0, 1);
      if (a < 0.2) return; r.s.face = 1; Rig.draw(ctx, r.s, 86, y + rh - 14, { scale: Math.min(1.2, rh / 70) }); ctx.globalAlpha = a;
      txt(ctx, r.s.d.name || r.s.name, 130, y + 22, 13, G.ink, 'left', { outline: false, serif: true });
      txtWrap(ctx, r.line, 130, y + 42, 520, 10.5, r.gone ? G.iron : G.coal, { outline: false, normal: true });
      ctx.fillStyle = grey(150, 0.5); ctx.fillRect(56, y + rh - 4, 588, 1); ctx.globalAlpha = 1;
    });
    if (this.shown >= this.rows.length) UI.prompt(ctx, 'interact', 'Continue', 560, 500);
    Render.post(ctx, {});
  }
}

/* --- 2. What should we do? Ordered by urgency; every line names a concrete action. --- */
function adviceFor(run) {
  const out = [], P = Run.present(run), has = k => Run.count(run, k) > 0, add = (pri, t) => out.push({ pri, t });
  for (const s of P) {
    if (s.sick) add(10, has('antibio') || has('meds') || has('syrup') ? s.name + ' has a fever. Give medicine: Journal > Hand out supplies.' : s.name + ' has a fever and there is no medicine. Herb broth at the stove helps; the pharmacy and hospital have the real thing.');
    if (s.wound) add(9, has('bandage') ? s.name + ' is wounded. A bandage closes it: Hand out supplies, or the first-aid shelf.' : has('cloth') ? s.name + ' is wounded. Cut bandages from cloth at the workbench.' : s.name + ' is wounded and there is nothing to dress it with. Find cloth or bandages tonight.');
    if (s.hunger < 30) add(8, s.name + ' is hungry. Let them eat at the pantry, or hand them something.');
    if (s.cold < 30) add(8, s.name + ' is cold. ' + (run.up.heater ? (run.heaterOn ? 'Coffee or tea warms; a blanket keeps it.' : 'Light the heater in the kitchen.') : 'Build a heater at the workbench, or sew a quilt.'));
    if (s.fatigue < 22) add(6, s.name + ' is exhausted. Set their job to Rest, and do not send them out tonight.');
    if (s.morale < 28) add(7, s.name + ' is losing heart. ' + (has('choc') ? 'A square of chocolate would help. ' : '') + (run.up.piano ? 'Play the piano. ' : '') + (run.musicbox ? 'Wind the music box. ' : '') + 'Company and a hot meal help too.');
    if (s.guilt > 30) add(4, s.name + ' feels guilty. ' + (run.up.bookshelf ? 'Reading aloud eases it.' : 'Granny\'s company eases it, and kind choices do too.'));
  }
  const food = Run.food(run); if (food < P.length * 2) add(7, 'Food is low (' + food + ' for ' + P.length + '). The market and the collapsed block have tins and vegetables.' + (has('flour') ? ' You have flour: bake bread.' : ''));
  if (Run.count(run, 'water') < 3) add(6, has('dirty') ? 'Clean water is short. Boil rain water at the stove' + (run.up.filter ? ' or use the filter in the cellar.' : '.') : 'Water is short. A rain catcher on the roof fills the cellar barrel.');
  if (run.raidKnown && run.raidTonight) add(9, 'Raiders are expected tonight. Reinforce the door (' + run.barricade + '/' + BARRICADE_MAX + '), leave a guard, and keep the pans handy.');
  if (run.temp < 0 && Run.count(run, 'fuel') + Run.count(run, 'wood') < 3) add(7, 'It is freezing and the fuel is nearly gone. Wood and fuel are at the metro and the bridge; draft snakes and quilts help without burning anything.');
  if (run.fire) add(10, 'Fire! Fetch water to it, now.'); if (run.gas) add(10, 'Gas leak at the stove. Fix it before it finds a spark.'); if (run.flood > 0) add(9, 'Water in the cellar. Bail it at the barrel.');
  const cook = [['bread', 'Bake bread'], ['stew', 'Make a stew'], ['tea', 'Brew tea']].find(([id]) => { const r = RECIPES.find(q => q.id === id); return r && Run.has(run, r.cost) && (!RECIPE_GATE[id] || RECIPE_GATE[id](run)); });
  if (cook) add(3, 'You have everything to ' + cook[1].toLowerCase() + ' at the stove.');
  const up = Object.keys(UPGRADES).find(id => { const u = UPGRADES[id]; return !u.start && !run.up[id] && (!u.req || run.up[u.req]) && Run.has(run, u.cost); });
  if (up) add(2, 'You could build the ' + UPGRADES[up].n.toLowerCase() + ' at the workbench. ' + UPGRADES[up].d);
  const th = P.find(s => THREADS[s.id] && num((run.threads || {})[s.id]) < 3); if (th) add(1, th.name + ' seems to have something on their mind. Quiet days bring these things out.');
  if (!run.flags.drawer && run.flags.clue0) add(1, 'The locked drawer: Toby\'s drawing has the numbers.');
  if (!out.length) add(0, 'Things are steady. Keep everyone fed and warm, and plan the night at the front door when dusk comes.');
  return out.sort((a, b) => b.pri - a.pri).slice(0, 6).map(o => o.t);
}
function adviceOverlay(run) {
  const lines = adviceFor(run); let t = 0; Snd.sfx('page');
  return {
    update(dt) { t += dt; if (t > 0.3 && (Input.menu.back || Input.menu.ok || Input.ptr.click)) { Game.pop(); Snd.sfx('back'); } },
    render(ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
      UI.paper(ctx, 60, 50, 640, 420, { seed: 57, rot: -0.004 });
      txt(ctx, 'What should we do?', 86, 88, 18, G.ink, 'left', { outline: false, serif: true });
      txt(ctx, 'Granny reads the room. Most urgent first.', 86, 108, 9.5, G.iron, 'left', { outline: false, normal: true });
      let y = 140; lines.forEach((l, i) => { const k = clamp((t - i * 0.12) / 0.3, 0, 1); ctx.globalAlpha = k; UI.icon(ctx, i === 0 ? 'warn' : 'star', 96, y - 4, 9, i === 0 ? G.ink : G.iron);
        y += txtWrap(ctx, l, 114, y, 560, 11, i === 0 ? G.ink : G.coal, { outline: false, normal: i > 0 }) + 16; ctx.globalAlpha = 1; });
      UI.prompt(ctx, 'interact', 'Got it', 600, 452);
    }
  };
}

/* --- 3. Bonds and stories --- */
function bondsOverlay(run) {
  const P = run.surv.filter(s => !s.gone), cx = 300, cy = 290, R = 150; let t = 0;
  const pos = P.map((s, i) => { const a = -Math.PI / 2 + i * TAU / Math.max(1, P.length); return { s, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R * 0.78 }; });
  Snd.sfx('page');
  return {
    update(dt) { t += dt; for (const p of pos) Rig.update(p.s, dt, t); if (t > 0.3 && (Input.menu.back || Input.menu.ok || Input.ptr.click)) { Game.pop(); Snd.sfx('back'); } },
    render(ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, W, H);
      UI.paper(ctx, 30, 30, 900, 480, { seed: 88, rot: 0.002 });
      txt(ctx, 'Bonds and stories', 56, 66, 18, G.ink, 'left', { outline: false, serif: true });
      txt(ctx, 'Thicker line: more trust. Dashed: strained. Eating, working and kind choices build it.', 56, 88, 9.5, G.iron, 'left', { outline: false, normal: true });
      for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
        const a = pos[i], b = pos[j], tr = (num(a.s.trust[b.s.id], 50) + num(b.s.trust[a.s.id], 50)) / 2;
        ctx.strokeStyle = grey(tr >= 50 ? 40 : 110, 0.35 + tr / 200); ctx.lineWidth = 0.6 + Math.max(0, tr - 30) / 14; if (tr < 40) ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y - 20); ctx.lineTo(b.x, b.y - 20); ctx.stroke(); ctx.setLineDash([]);
      }
      for (const p of pos) { p.s.face = p.x < cx ? 1 : -1; Rig.draw(ctx, p.s, p.x, p.y + 12, { scale: 0.9 }); txt(ctx, p.s.name, p.x, p.y + 28, 10.5, G.ink, 'center', { outline: false }); }
      let y = 120; txt(ctx, 'Their stories', 560, y, 13, G.ink, 'left', { outline: false, serif: true }); y += 22;
      for (const s of run.surv) {
        const n = num((run.threads || {})[s.id]), T = THREADS[s.id];
        const line = s.gone ? 'Gone. Remembered.' : !T ? 'Keeps their own counsel.' : n >= 3 ? 'Told: "' + T[2].title + '"' + (run.flags['ep_' + s.id] === 'good' ? ' (a kind ending)' : '') : n ? 'Chapter ' + n + ' of 3: "' + T[n - 1].title + '". More to come.' : 'Has not opened up yet.';
        ctx.fillStyle = hsl(s.hueC(), Math.max(0.15, s.sat())); ctx.fillRect(560, y - 9, 10, 10);
        txt(ctx, s.name, 578, y, 11, G.ink, 'left', { outline: false }); txtWrap(ctx, line, 640, y, 270, 9.5, G.coal, { outline: false, normal: true }); y += 34;
      }
      UI.prompt(ctx, 'pause', 'Close', 840, 490);
    }
  };
}

/* --- 5. Radio music --- */
RADIO.forEach(q => { if (/lullaby/i.test(q.t)) q.music = 'lullaby'; });
RADIO.push({ t: 'A dance band, very far away, playing as if nobody told them anything.', m: 5, music: 'market' }, { t: 'A choir in a cold church, recorded on a borrowed tape machine.', m: 6, music: 'ch5' });

/* --- 4. The way home: edge pointers for things off screen. The door pointer grows urgent near dawn. --- */
function wayPointers(ctx, sc) {
  const w = sc.w, s = w.surv.find(q => q.active) || w.surv[0]; if (!s || sc.tut) return;
  const late = sc.timeLeft / sc.total < 0.3, t = Game.time, marks = [];
  const ex = w.L.objs.find(o => o.type === 'exit'); if (ex) marks.push({ o: ex, label: 'street door', home: true });
  for (const o of w.L.objs) if (o.type === 'mailbox' && !o.done) marks.push({ o, label: 'letter' });
  for (const m of marks) {
    const sx = w.sx(m.o.x), sy = w.sy(w.floorY(m.o.f) - 30); if (sx > 30 && sx < W - 30 && sy > 60 && sy < H - 40) continue;
    if (m.home && !late && w.packCount() < w.pack.cap) continue;                                        // quiet until it matters: dawn is near, or the pack is full
    const x = clamp(sx, 26, W - 26), y = clamp(sy, 110, H - 120), left = sx < W / 2, pulse = m.home && late ? 0.55 + 0.45 * Math.sin(t * 5) : 0.75;
    ctx.save(); ctx.globalAlpha = pulse; ctx.translate(x, y); ctx.fillStyle = grey(0, 0.8); rrect(ctx, left ? 6 : -84, -12, 78, 24, 6); ctx.fill(); ctx.strokeStyle = grey(220, 0.7); ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = G.bone; ctx.beginPath(); if (left) { ctx.moveTo(-4, 0); ctx.lineTo(6, -8); ctx.lineTo(6, 8); } else { ctx.moveTo(4, 0); ctx.lineTo(-6, -8); ctx.lineTo(-6, 8); } ctx.fill();
    const dist = Math.round(Math.abs(m.o.x - s.x) / 10);
    txt(ctx, m.label + ' ' + dist + 'm', left ? 45 : -45, 4, 9, G.white, 'center', { outline: false }); ctx.restore();
  }
}
