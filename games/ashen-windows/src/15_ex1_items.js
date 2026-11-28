
/* ==========================================================================
   SECTION 22: EXPANSION I - pantry, medicine chest, crafting, shelter
   New items share one data-driven "use" table, so the pack, the journal,
   the meal and the pantry all speak the same language.
   ========================================================================== */
Object.assign(ITEMS, {
  flour: { n: 'Flour', v: 4, cat: 'food' }, bread: { n: 'Bread', v: 5, cat: 'food', home: true }, salt: { n: 'Salt', v: 3, cat: 'mat' },
  jam: { n: 'Preserves', v: 5, cat: 'food' }, coffee: { n: 'Coffee', v: 6, cat: 'food' }, choc: { n: 'Chocolate', v: 9, cat: 'joy' },
  soap: { n: 'Soap', v: 4, cat: 'med' }, painkill: { n: 'Painkillers', v: 8, cat: 'med' }, vitamins: { n: 'Vitamins', v: 7, cat: 'med' },
  blanket: { n: 'Blanket', v: 7, cat: 'mat' }, clatter: { n: 'Clatter jar', v: 2, cat: 'tool', thrown: true }, rope: { n: 'Rope', v: 4, cat: 'mat' },
  seeds: { n: 'Seeds', v: 5, cat: 'mat' }, harmonica: { n: 'Harmonica', v: 10, cat: 'joy' }
});
Object.assign(START_STOCK, { flour: 1, salt: 1 });

/* What an item does when someone uses it. hunger/fatigue/cold/health/morale are added; cure clears a status;
   group affects everyone nearby; keep means the item is not used up (once per day instead). */
const ITEM_USE = {
  soup: { hunger: 46, morale: 2, cold: 6, sfx: 'sip', anim: 'eat', d: 'Hot, and nearly a meal.' },
  can: { hunger: 42, sfx: 'can', anim: 'eat', d: 'Cold beans. Calories are calories.' },
  bread: { hunger: 34, morale: 2, sfx: 'sip', anim: 'eat', d: 'Real bread. People go quiet over it.' },
  jam: { hunger: 18, morale: 4, sfx: 'can', anim: 'eat', d: 'A spoonful of somebody else\'s summer.' },
  egg: { hunger: 30, sfx: 'sip', anim: 'eat', d: 'A pigeon egg, boiled.' },
  raw: { hunger: 20, morale: -2, sfx: 'sip', anim: 'eat', d: 'Raw. Crunchy. Not a meal.' },
  tea: { morale: 5, cold: 8, sfx: 'sip', anim: 'eat', d: 'Warm hands, lighter hearts.' },
  coffee: { morale: 4, fatigue: 18, cold: 6, sfx: 'sip', anim: 'eat', d: 'Bitter, and wonderful, and gone too fast.' },
  choc: { morale: 14, hunger: 6, sfx: 'page', anim: 'eat', flare: true, d: 'A whole square. Their color comes back all at once.' },
  water: { morale: 1, sfx: 'sip', anim: 'eat', d: 'Clean water. Small luxury.' },
  bandage: { health: 18, cure: 'wound', sfx: 'snip', anim: 'use', d: 'Closes a wound so it can heal.' },
  meds: { health: 14, cure: 'sick', sfx: 'sip', anim: 'use', d: 'Breaks a fever.' },
  antibio: { health: 22, cure: 'both', sfx: 'sip', anim: 'use', d: 'Clears fever and infection.' },
  syrup: { health: 10, cure: 'sick', sfx: 'sip', anim: 'use', d: 'Soothes a cough. Breaks a light fever.' },
  painkill: { health: 10, morale: 3, fatigue: 6, sfx: 'sip', anim: 'use', d: 'Takes the edge off. Does not mend anything.' },
  vitamins: { health: 12, sfx: 'sip', anim: 'use', d: 'Small and chalky. Somehow helpful.' },
  soap: { health: 4, morale: 2, clean: true, sfx: 'splash', anim: 'use', d: 'A wash. Clean hands catch fewer fevers.' },
  book: { morale: 6, keep: true, sfx: 'page', anim: 'use', d: 'An hour somewhere else.' },
  toy: { morale: 5, keep: true, toby: 9, sfx: 'crank', anim: 'use', d: 'It walks in a circle and falls over. A hit.' },
  harmonica: { morale: 4, group: true, keep: true, sfx: 'harp', anim: 'use', d: 'Three notes and the whole floor hums along.' }
};
/* Apply an item to a survivor. src is the stock (run.stock or a pack's items). Returns a line, or null if it did nothing. */
function useItem(run, s, id, src, w) {
  const U = ITEM_USE[id]; if (!U || !s) return null;
  if (U.keep) { const k = 'use_' + id; if (run.daily[k]) return null; run.daily[k] = true; } else { if (!(src[id] > 0)) return null; src[id]--; }
  const targets = U.group && w ? w.surv.filter(p => p.present && !p.down && p.f === s.f && Math.abs(p.x - s.x) < 260) : [s];
  if (targets.indexOf(s) < 0) targets.push(s);
  for (const p of targets) {
    if (U.hunger) p.hunger = clamp(p.hunger + U.hunger, 0, 100); if (U.fatigue) p.fatigue = clamp(p.fatigue + U.fatigue, 0, 100);
    if (U.cold) p.cold = clamp(p.cold + U.cold, 0, 100); if (U.health) p.health = clamp(p.health + U.health, 0, 100);
    const m = (U.toby && p.id === 'toby' ? U.toby : U.morale) || 0; if (m) p.addMorale(m, p !== s);
    if (U.cure === 'wound' || U.cure === 'both') p.wound = false; if (U.cure === 'sick' || U.cure === 'both') p.sick = false;
    if (U.clean) p.badWater = false; if (U.flare) p.flare = 0.8;
    if (w && m > 3) Parts.emit('ripple', p.x, w.entY(p) - 24, 1, { col: p.hueC() });
  }
  if (s.act) s.act(U.anim || 'use', 1.0); Snd.sfx(U.sfx || 'pickup');
  Bus.emit('itemUsed', { item: id, s });
  return (targets.length > 1 ? s.name + ' and ' + (targets.length - 1) + ' more' : s.name) + ': ' + U.d;
}
/* Journal entry: hand something to someone. Two small menus, one press each. */
function supplyOverlay(scene) {
  const run = scene.run, w = scene.w;
  const items = [];
  for (const id in ITEM_USE) {
    const U = ITEM_USE[id];
    items.push({ label: () => ITEMS[id].n + (U.keep ? '' : ' x' + Run.count(run, id)), hidden: () => Run.count(run, id) <= 0, right: () => (U.keep && run.daily['use_' + id] ? 'tomorrow' : U.group ? 'everyone' : 'give'), sub: U.d,
      dis: () => (U.keep && run.daily['use_' + id] ? 'Once a day.' : false),
      act: () => {
        const who = Run.present(run).map(p => ({ label: p.name + '  ' + (p.statuses().join(', ') || 'well'), sub: 'Hunger ' + Math.round(p.hunger) + '  Cold ' + Math.round(p.cold) + '  Health ' + Math.round(p.health) + '  Morale ' + Math.round(p.morale),
          act: () => { const line = useItem(run, p, id, run.stock, w); Game.pop(); if (line) note(line, 4); } }));
        if (U.group) { const s = scene.activeS ? scene.activeS(0) : Run.present(run)[0]; const line = useItem(run, s, id, run.stock, w); if (line) note(line, 4); return; }
        Game.push(menuOverlay({ title: 'Give ' + ITEMS[id].n + ' to', key: '', x: 60, y: 90, w: 420, maxRows: 7, items: who, onBack: () => Game.pop(), backLabel: 'Back' }));
      } });
  }
  items.push({ type: 'text', label: 'Nothing on the shelves to hand out.', hidden: () => Object.keys(ITEM_USE).some(id => Run.count(run, id) > 0) });
  return menuOverlay({ title: 'Hand out supplies', key: 'supply', x: 30, y: 60, w: 400, maxRows: 11, items, onBack: () => Game.pop(), backLabel: 'Close', extra: ctx => stockPanel(ctx, run, 450, 60) });
}

/* --- Recipes. "fx" recipes do something besides adding stock. --- */
RECIPES.push(
  { id: 'bread', n: 'Bake bread', at: 'stove', cost: { flour: 1, water: 1, fuel: 1 }, out: { bread: 2 }, d: 'Flour, water, patience. The whole stairwell smells of it.' },
  { id: 'stew', n: 'Make a stew', at: 'stove', cost: { can: 1, raw: 1, herbs: 1, water: 1 }, out: { soup: 4 }, d: 'One tin becomes four bowls. Granny would say five.' },
  { id: 'preserve', n: 'Put up preserves', at: 'stove', cost: { raw: 2, salt: 1 }, out: { jam: 2 }, d: 'Salted greens in a jar. They keep, and so do we.' },
  { id: 'broth', n: 'Herb broth for the sick', at: 'stove', cost: { herbs: 1, water: 1 }, out: { syrup: 1 }, d: 'Not medicine. Close enough for a cough.' },
  { id: 'poultice', n: 'Herb poultice', at: 'workbench', cost: { herbs: 1, cloth: 1 }, out: { bandage: 2 }, d: 'Thyme and clean cloth. Marta checks the knot.' },
  { id: 'quilt', n: 'Stitch a quilt', at: 'workbench', cost: { cloth: 2 }, out: { blanket: 1 }, d: 'Every blanket at home keeps one sleeper warmer.' },
  { id: 'soap', n: 'Boil ash soap', at: 'stove', cost: { fuel: 1, herbs: 1 }, out: { soap: 2 }, d: 'Fewer fevers, if everyone washes.' },
  { id: 'clatter', n: 'Fill clatter jars', at: 'workbench', cost: { bottle: 1, parts: 1 }, out: { clatter: 2 }, d: 'Thrown, it rattles for seconds. Very distracting.' },
  { id: 'rope', n: 'Braid rope', at: 'workbench', cost: { cloth: 2 }, out: { rope: 1 }, d: 'Rags into rope. Needed for some building.' },
  { id: 'drafts', n: 'Sew draft snakes', at: 'workbench', cost: { cloth: 1 }, out: {}, fx: 'drafts', max: 3, d: 'A sock of sand for under each door. Keeps the heat in.' },
  { id: 'stars', n: 'Fold paper stars', at: 'workbench', cost: { book: 1 }, out: {}, fx: 'stars', d: 'Toby shows everyone how. They hang on thread all over the flat.' },
  { id: 'kite', n: 'Build a kite', at: 'workbench', cost: { cloth: 1, wood: 1 }, out: { toy: 1 }, d: 'It will never fly. Toby does not mind.' });
/* Recipe side effects; returns a line for the diary. */
const RECIPE_FX = {
  drafts(run) { run.drafts = Math.min(3, num(run.drafts) + 1); return 'A draft snake under the ' + ['front door', 'bedroom door', 'cellar hatch'][run.drafts - 1] + '. Warmer already.'; },
  stars(run) { Run.allMorale(run, 5); run.stars = (run.stars || 0) + 1; const t = run.surv.find(s => s.id === 'toby' && s.present); if (t) t.addMorale(6); return 'Paper stars on threads, turning slowly in the draft. Nobody takes them down.'; },
  sow(run) { run.gardenT = Math.min(3, num(run.gardenT) + 1); return 'Seeds in, a little water, a lot of hope.'; }
};

/* --- New shelter upgrades: each has a drawing, an interaction and an effect. --- */
Object.assign(UPGRADES, {
  piano: { n: 'Old upright piano', f: 2, x: 262, cost: { wood: 3, parts: 2 }, obj: 'piano', d: 'Hauled up from 3B. Most of the keys work. Morale for the whole floor.' },
  bookshelf: { n: 'Bookshelf', f: 1, x: 724, cost: { wood: 3 }, obj: 'bookshelf', d: 'Read aloud once a day. Eases guilt, and sometimes teaches a recipe.' },
  lookout: { n: 'Roof lookout', f: 0, x: 828, cost: { wood: 2, rope: 1 }, obj: 'lookout', d: 'Earlier raid warnings, and a look at the street each day.' },
  greenhouse: { n: 'Garden cold frame', f: 0, x: 360, cost: { wood: 2, parts: 1, cloth: 1 }, obj: 'greenhouse', req: 'garden', d: 'The garden box grows twice as fast, even in snow.' },
  clothesline: { n: 'Clothesline', f: 0, x: 556, cost: { rope: 1, wood: 1 }, obj: 'clothesline', d: 'Rags dry into usable cloth. A little cloth every few days.' }
});

/* Objects for the new upgrades (interaction) */
Object.assign(OBJDEF, {
  piano: { r: 30, act(w, s, o) { const run = w.run; if (run.daily.piano) return { label: 'The piano', fn() { note(PIANO_LINES[(run.day + s.id.length) % PIANO_LINES.length]); } };
    return { label: 'Play the piano', hold: 1.4, sfx: 'page', fn() { run.daily.piano = true; run.pianoN = num(run.pianoN) + 1; o.playT = 6; const ph = PIANO_PHRASES[(run.day + run.pianoN) % PIANO_PHRASES.length]; Snd.phrase(ph); Snd.duck(5);
      const bonus = s.id === 'yara' || s.id === 'toby' ? 3 : 0; for (const p of w.surv) if (p.present && Math.abs(p.f - s.f) <= 1) { p.addMorale(6 + bonus, p !== s); p.comfortT = 1.5; Parts.emit('ripple', p.x, w.entY(p) - 24, 1, { col: p.hueC() }); }
      Run.trust(run, s, w.surv.find(p => p !== s && p.present), 3); Bus.emit('pianoPlayed', { s, n: run.pianoN }); note(s.id === 'toby' ? 'Toby plays one note over and over, very seriously. Everyone claps.' : s.id === 'bea' ? 'Granny plays a waltz with her elbows when the keys stick. It counts.' : s.name + ' plays something slow. The floorboards seem to listen.', 4); } }; } },
  bookshelf: { r: 26, act(w, s) { const run = w.run; if (run.daily.read) return { label: 'The bookshelf', fn() { note('Spines you have read twice. One cookery book, heavily annotated by Granny.'); } };
    return { label: 'Read aloud', hold: 1.8, sfx: 'page', fn() { run.daily.read = true; let n = 0; for (const p of w.surv) if (p.present && p.f === s.f) { p.addMorale(4, p !== s); p.guilt = Math.max(0, p.guilt - 12); n++; }
      const r = w.rng, unknown = ['stew', 'preserve', 'soap', 'quilt'].filter(id => !run.flags['rc_' + id]);
      if (unknown.length && r.chance(0.4)) { const id = r.pick(unknown); run.flags['rc_' + id] = true; Run.log(run, 'From a cookery book margin: "' + RECIPES.find(q => q.id === id).n + '". Granny underlines it twice.'); note('A note in a margin: a recipe for "' + RECIPES.find(q => q.id === id).n.toLowerCase() + '". Into the diary it goes.', 5); }
      else note(READ_LINES[(run.day * 3 + s.id.length) % READ_LINES.length], 5);
      Bus.emit('readAloud', { s, n }); } }; } },
  lookout: { r: 26, act(w, s) { const run = w.run; if (run.daily.look) return { label: 'The lookout', fn() { note(run.raidTonight ? 'Shapes at the corner again. Bar the door tonight.' : 'The street is empty. Overcast, with a chance of overcast.'); } };
    return { label: 'Scan the street', hold: 1.6, sfx: 'creak', fn() { run.daily.look = true; if (run.raidTonight) { run.raidKnown = true; Game.banner('From the lookout: men gathering at the corner. Raiders tonight.', 'raid', 5); }
      else { const site = w.rng.pick(run.sites); run.hint = site; note('From the lookout: no patrol lights near ' + LOCS[site].n + ' tonight.', 5); } s.cold = clamp(s.cold - 4, 0, 100); } }; } },
  greenhouse: { r: 26, act(w, s) { return OBJDEF.garden.act(w, s); } },
  garden: { r: 24, act(w, s) { const run = w.run; if ((run.gardenT || 0) >= 3) return { label: 'Harvest the garden box', hold: 1, fn() { run.gardenT = 0; const big = run.up.greenhouse ? 1 : 0; Run.add(run, 'herbs', 1 + big); Run.add(run, 'raw', 2 + big); Snd.sfx('pickup'); note(big ? 'Under the cold frame, more than you planted. Granny pretends not to be impressed.' : 'Two pale carrots and a fistful of thyme. Granny approves the thyme.'); Bus.emit('harvest', { s }); } };
    if (Run.count(run, 'seeds') > 0 && !run.daily.sow) return { label: 'Sow seeds', hold: 1.2, sfx: 'page', fn() { Run.add(run, 'seeds', -1); run.daily.sow = true; note(RECIPE_FX.sow(run)); s.addMorale(2); } };
    return { label: 'The garden box', fn() { note('Green things, taking their time. Ready in ' + (3 - (run.gardenT || 0)) + ' day(s).'); } }; } },
  clothesline: { r: 26, act(w, s) { const run = w.run; return { label: 'The clothesline', fn() { note('Socks, a tablecloth, someone\'s best shirt. Everything flaps in grey. Cloth in ' + Math.max(0, 3 - num(run.lineT)) + ' day(s).'); } }; } }
});
const PIANO_LINES = ['Middle C sticks. Everyone knows to avoid it.', 'Someone has carved "B.H. 1961" inside the lid. Granny will not discuss it.', 'Dust on the keys, and two clean stripes where somebody played last night.'];
const READ_LINES = ['A chapter about a lighthouse keeper. Toby falls asleep before the storm. Probably for the best.', 'An atlas. Everyone picks a country to go to afterwards. Dov picks "a warm one".',
  'A detective story with the last page missing. Six theories by supper.', 'Poems about the sea. Ravi reads them in a pirate voice, then, quietly, in his own.', 'A seed catalogue from before. Granny reads it like scripture.'];
/* The stove menu also shows recipes the bookshelf has taught; garden recipes live at the garden. */
const RECIPE_GATE = { stew: run => !!(run.flags.rc_stew || run.surv.some(s => s.id === 'bea' && s.present)), preserve: run => !!(run.flags.rc_preserve || Run.count(run, 'salt') > 0),
  soap: run => !!(run.flags.rc_soap || run.surv.some(s => s.id === 'marta' && s.present)), quilt: () => true };

/* Drawings for the new objects, in greys. B(dx,dy,w,h,grey,alpha) draws a box relative to the object's foot. */
const OBJ_DRAW = {
  piano(c, w, o, x, y, t, run, B) { B(-28, -44, 56, 44, 44); B(-30, -46, 60, 4, 70); B(-24, -26, 48, 6, 210); for (let k = 0; k < 12; k++) B(-23 + k * 4, -26, 1, 6, 40); for (let k = 0; k < 8; k++) if (k % 7 !== 2 && k % 7 !== 6) B(-21 + k * 6, -26, 2.4, 3.5, 20);
    B(-26, -20, 4, 20, 60); B(22, -20, 4, 20, 60); B(-12, -40, 24, 10, 90); if (o.playT > 0) { o.playT -= (Game.rdt || 0.016); if (Math.random() < 0.12 * Render.rk()) Floaters.add(['~', '*', '.', '~'][Math.floor(Math.random() * 4)], x + FX.r(-20, 20), y - 56, { life: 1.2 }); } },
  bookshelf(c, w, o, x, y, t, run, B) { B(-18, -74, 36, 74, 54); for (let k = 0; k < 4; k++) { B(-18, -74 + k * 18, 36, 2.5, 90); for (let i = 0; i < 6; i++) B(-15 + i * 5, -70 + k * 18, 4, 14 - ((i * 7 + k) % 4), 100 + ((i * 37 + k * 13) % 90)); } },
  lookout(c, w, o, x, y, t, run, B) { c.strokeStyle = grey(96); c.lineWidth = 3; c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x - 6, y - 70); c.moveTo(x + 14, y); c.lineTo(x + 6, y - 70); c.moveTo(x - 11, y - 24); c.lineTo(x + 11, y - 24); c.moveTo(x - 9, y - 46); c.lineTo(x + 9, y - 46); c.stroke();
    B(-16, -74, 32, 5, 110); c.save(); c.translate(x + 4, y - 82); c.rotate(-0.25 + Math.sin(t * 0.4) * 0.12); c.fillStyle = grey(150); c.fillRect(0, -2.5, 20, 5); c.fillStyle = grey(210); c.fillRect(19, -3, 3, 6); c.restore(); },
  greenhouse(c, w, o, x, y, t, run, B) { c.strokeStyle = grey(200, 0.7); c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 28, y - 12); c.lineTo(x - 28, y - 40); c.lineTo(x, y - 54); c.lineTo(x + 28, y - 40); c.lineTo(x + 28, y - 12); c.moveTo(x, y - 54); c.lineTo(x, y - 14); c.stroke();
    c.fillStyle = grey(230, 0.12 + 0.04 * Math.sin(t)); c.beginPath(); c.moveTo(x - 28, y - 12); c.lineTo(x - 28, y - 40); c.lineTo(x, y - 54); c.lineTo(x + 28, y - 40); c.lineTo(x + 28, y - 12); c.fill(); },
  clothesline(c, w, o, x, y, t, run, B) { B(-46, -62, 3, 62, 80); B(43, -62, 3, 62, 80); c.strokeStyle = grey(150); c.lineWidth = 1; c.beginPath(); c.moveTo(x - 44, y - 60); c.quadraticCurveTo(x, y - 52, x + 44, y - 60); c.stroke();
    for (let k = 0; k < 5; k++) { const px = x - 34 + k * 17, py = y - 58 + Math.abs(k - 2) * -1.5 + 5, sw = Math.sin(t * 1.6 + k * 1.3) * 3 * (run.weather === 'clear' ? 0.6 : 1.4); c.fillStyle = grey(110 + (k * 41) % 110); c.beginPath(); c.moveTo(px - 6, py); c.lineTo(px + 6, py); c.lineTo(px + 6 + sw, py + 14 + (k % 2) * 6); c.lineTo(px - 6 + sw, py + 14 + (k % 2) * 6); c.fill(); } }
};

/* Loot tables and trades now include the new things. Rare things are tied to risk. */
(function () {
  const add = (id, o) => Object.assign(LOCS[id].loot, o);
  add('pharmacy', { painkill: 2, vitamins: 2, soap: 1 }); add('market', { flour: 2, salt: 2, coffee: 1, seeds: 1, jam: 1 });
  add('metro', { rope: 2, clatter: 1 }); add('school', { choc: 1, seeds: 1, harmonica: 0.5 }); add('apartments', { blanket: 2, jam: 2, flour: 1, harmonica: 0.6, soap: 1 });
  add('hospital', { painkill: 3, vitamins: 2, soap: 2, blanket: 1 }); add('church', { flour: 1, salt: 1, blanket: 2, choc: 1 }); add('bridge', { rope: 2, coffee: 1 });
  TRADES.push([{ salt: 1 }, { raw: 3 }], [{ coffee: 1 }, { meds: 1 }], [{ choc: 1 }, { antibio: 1 }], [{ rope: 1 }, { parts: 2 }], [{ wood: 2 }, { flour: 1 }], [{ cloth: 2 }, { blanket: 1 }], [{ can: 2 }, { seeds: 1 }], [{ battery: 1 }, { coffee: 1 }]);
})();
