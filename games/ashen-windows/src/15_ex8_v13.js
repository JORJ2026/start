/* ==========================================================================
   SECTION 28: RELEASE 1.3 - forage, crafting, enemies, AI, the player's guide
   - 75 new items to find, each placed in the loot tables of the sites.
   - 32 new recipes, tools that are kept (needle, scissors, knife, lighter,
     crowbar), a clearer workbench: makeable first, "x N" counts, and only
     the missing ingredients listed.
   - 75 named enemy variants built on the five hostile bodies, each with its
     own look and traits, and smarter shared AI: calls for help, searches
     that sweep, memory after losing you, glances back, scent tracking and
     learning to ignore thrown distractions.
   ========================================================================== */

/* ---------- 75 new items ---------- */
const NEW_ITEMS = {
  // food (20)
  rice: ['Rice', 4, 'food'], beans: ['Dried beans', 4, 'food'], oats: ['Oats', 3, 'food'], potato: ['Potatoes', 3, 'food'], onion: ['Onions', 2, 'food'],
  carrot: ['Carrots', 2, 'food'], apple: ['Wrinkled apples', 3, 'food'], honey: ['Honey', 7, 'food'], sugar: ['Sugar', 5, 'food'], lard: ['Lard', 4, 'food'],
  sardines: ['Sardines', 6, 'food'], crackers: ['Crackers', 4, 'food'], biscuit: ['Biscuits', 5, 'food'], driedfruit: ['Dried fruit', 6, 'food'], cheese: ['Hard cheese', 8, 'food'],
  sausage: ['Smoked sausage', 8, 'food'], milk: ['Condensed milk', 7, 'food'], cocoa: ['Cocoa powder', 7, 'food'], stockcube: ['Stock cubes', 4, 'food'], mushroom: ['Cellar mushrooms', 3, 'food'],
  // medicine (10)
  iodine: ['Iodine', 7, 'med'], gauze: ['Gauze', 5, 'med'], splint: ['Splint', 6, 'med'], aspirin: ['Aspirin', 7, 'med'], salve: ['Herbal salve', 5, 'med'],
  suture: ['Suture kit', 11, 'med'], spirit: ['Surgical spirit', 6, 'med'], lozenge: ['Throat lozenges', 4, 'med'], thermo: ['Thermometer', 6, 'med'], eyedrops: ['Eye drops', 5, 'med'],
  // materials (25)
  nails: ['Nails', 2, 'mat'], screws: ['Screws', 2, 'mat'], wire: ['Wire', 3, 'mat'], tape: ['Tape', 3, 'mat'], glue: ['Glue', 3, 'mat'],
  tinsheet: ['Tin sheet', 3, 'mat'], pipe: ['Pipe', 3, 'mat'], spring: ['Springs', 2, 'mat'], cog: ['Clock cogs', 2, 'mat'], glass: ['Glass pane', 3, 'mat'],
  leather: ['Leather', 5, 'mat'], wool: ['Wool', 4, 'mat'], twine: ['Twine', 2, 'mat'], canvas: ['Canvas', 4, 'mat'], plank: ['Plank', 2, 'mat'],
  coal: ['Coal', 4, 'mat'], charcoal: ['Charcoal', 3, 'mat'], wax: ['Wax', 3, 'mat'], paraffin: ['Paraffin', 5, 'mat'], lampoil: ['Lamp oil', 5, 'mat'],
  sand: ['Sand', 1, 'mat'], tarp: ['Tarpaulin', 5, 'mat'], chain: ['Chain', 3, 'mat'], hinge: ['Hinges', 2, 'mat'], bucket: ['Bucket', 3, 'mat'],
  // tools (10)
  firecracker: ['Firecracker', 5, 'tool'], pebble: ['Pebbles', 0, 'tool'], lighter: ['Lighter', 8, 'tool'], flint: ['Flint and steel', 6, 'tool'], penknife: ['Penknife', 7, 'tool'],
  scissors: ['Scissors', 5, 'tool'], needle: ['Sewing needle', 4, 'tool'], crowbar: ['Crowbar', 8, 'tool'], lantern: ['Storm lantern', 9, 'tool'], bulb: ['Light bulb', 3, 'tool'],
  // comforts (10)
  deck: ['Deck of cards', 4, 'joy'], dice: ['Dice', 2, 'joy'], postcard: ['Postcard', 2, 'joy'], photo: ['Family photo', 3, 'joy'], comic: ['Comic', 4, 'joy'],
  marbles: ['Marbles', 3, 'joy'], chess: ['Pocket chess', 6, 'joy'], crayons: ['Crayons', 4, 'joy'], record: ['Gramophone record', 7, 'joy'], perfume: ['Perfume', 9, 'joy']
};
for (const k in NEW_ITEMS) { const [n, v, cat] = NEW_ITEMS[k]; ITEMS[k] = { n, v, cat, v13: true }; }
ITEMS.firecracker.thrown = true; ITEMS.pebble.thrown = true;
const TOOLS_KEPT = ['needle', 'scissors', 'penknife', 'lighter', 'crowbar', 'flint', 'thermo'];

Object.assign(ITEM_USE, {
  rice: { hunger: 22, sfx: 'sip', anim: 'eat', d: 'A handful, soaked. Better cooked.' }, beans: { hunger: 20, sfx: 'sip', anim: 'eat', d: 'Soaked overnight, chewed for a long time.' },
  oats: { hunger: 18, sfx: 'sip', anim: 'eat', d: 'Dry oats. Porridge would be kinder.' }, potato: { hunger: 22, sfx: 'sip', anim: 'eat', d: 'Cold boiled potato. Filling.' },
  onion: { hunger: 8, morale: -1, sfx: 'sip', anim: 'eat', d: 'Eaten like an apple. Eyes water.' }, carrot: { hunger: 12, sfx: 'sip', anim: 'eat', d: 'Crunchy and almost sweet.' },
  apple: { hunger: 14, morale: 3, sfx: 'sip', anim: 'eat', d: 'Wrinkled, but an apple.' }, honey: { hunger: 10, morale: 6, health: 3, sfx: 'sip', anim: 'eat', d: 'A spoonful. Good for a cough too.' },
  sugar: { hunger: 8, morale: 3, fatigue: 6, sfx: 'sip', anim: 'eat', d: 'Sweet energy for a cold night.' }, lard: { hunger: 16, cold: 6, sfx: 'sip', anim: 'eat', d: 'On bread it would be a feast.' },
  sardines: { hunger: 36, morale: 2, sfx: 'can', anim: 'eat', d: 'A tin of silver. Somebody hums.' }, crackers: { hunger: 18, sfx: 'page', anim: 'eat', d: 'Crumbs everywhere. Worth it.' },
  biscuit: { hunger: 14, morale: 6, sfx: 'page', anim: 'eat', d: 'With tea, a small celebration.' }, driedfruit: { hunger: 16, morale: 5, sfx: 'sip', anim: 'eat', d: 'Summer, shrunk and kept.' },
  cheese: { hunger: 30, morale: 5, sfx: 'sip', anim: 'eat', d: 'Hard, sharp, shared in thin slices.' }, sausage: { hunger: 40, morale: 6, sfx: 'sip', anim: 'eat', flare: true, d: 'The whole floor can smell it.' },
  milk: { hunger: 20, morale: 8, sfx: 'sip', anim: 'eat', d: 'Sweet and thick. Toby licks the lid.' }, cocoa: { morale: 9, cold: 10, sfx: 'sip', anim: 'eat', d: 'Hot cocoa. People sit closer.' },
  stockcube: { hunger: 10, cold: 6, sfx: 'sip', anim: 'eat', d: 'Dissolved in hot water, it tastes like a meal.' }, mushroom: { hunger: 12, sfx: 'sip', anim: 'eat', d: 'From the cellar. Ines swears they are the safe kind.' },
  iodine: { health: 10, cure: 'wound', sfx: 'hiss', anim: 'use', d: 'Stings, then helps.' }, gauze: { health: 12, cure: 'wound', sfx: 'snip', anim: 'use', d: 'Clean gauze for a wound.' },
  splint: { health: 16, sfx: 'thud', anim: 'use', d: 'Holds a bad limb still so it can mend.' }, aspirin: { health: 8, morale: 2, cure: 'sick', sfx: 'sip', anim: 'use', d: 'Brings a fever down a little.' },
  salve: { health: 8, cold: 4, sfx: 'sip', anim: 'use', d: 'For chapped hands and small cuts.' }, suture: { health: 26, cure: 'wound', sfx: 'snip', anim: 'use', d: 'Marta closes it properly.' },
  spirit: { health: 6, clean: true, sfx: 'hiss', anim: 'use', d: 'Cleans a wound before it festers.' }, lozenge: { health: 5, cure: 'sick', sfx: 'sip', anim: 'use', d: 'For a cough that keeps everyone awake.' },
  eyedrops: { health: 4, morale: 2, fatigue: 4, sfx: 'drip', anim: 'use', d: 'For eyes tired from candle smoke.' },
  deck: { morale: 5, group: true, keep: true, sfx: 'page', anim: 'use', d: 'Rummy by candlelight. Dov cheats, badly.' }, dice: { morale: 3, group: true, keep: true, sfx: 'clatter', anim: 'use', d: 'A game with rules nobody agrees on.' },
  postcard: { morale: 4, sfx: 'page', anim: 'use', d: 'A sunny seafront. Everyone picks a window in the hotel.' }, photo: { morale: 6, keep: true, sfx: 'page', anim: 'use', d: 'Somebody\'s wedding. We decided they were happy.' },
  comic: { morale: 6, keep: true, toby: 10, sfx: 'page', anim: 'use', d: 'A detective with a dog. Toby reads it to the cat.' }, marbles: { morale: 4, keep: true, toby: 8, sfx: 'clatter', anim: 'use', d: 'Rolling down the hall. Loud, so only by day.' },
  chess: { morale: 5, keep: true, sfx: 'tick', anim: 'use', d: 'A long game, paused whenever the guns start.' }, crayons: { morale: 4, keep: true, toby: 9, sfx: 'page', anim: 'use', d: 'More suns on the wall.' },
  record: { morale: 7, group: true, keep: true, sfx: 'box', anim: 'use', d: 'No gramophone. Granny hums it from the label.' }, perfume: { morale: 9, sfx: 'hiss', anim: 'use', d: 'One spray each. The landing smells of somewhere else.' }
});

/* where each new item can be found (weights are small so the old staples stay common) */
(function () {
  const add = (id, o) => { for (const k in o) LOCS[id].loot[k] = (LOCS[id].loot[k] || 0) + o[k]; };
  add('pharmacy', { iodine: 1, gauze: 1.2, aspirin: 1.2, salve: 0.6, suture: 0.4, spirit: 0.8, lozenge: 1, thermo: 0.4, eyedrops: 0.6, perfume: 0.4, sugar: 0.4, honey: 0.3, scissors: 0.4, bulb: 0.4 });
  add('market', { rice: 1, beans: 1, oats: 0.8, potato: 1.2, onion: 1.2, carrot: 1, apple: 1, honey: 0.4, sugar: 0.5, lard: 0.6, sardines: 0.5, cheese: 0.4, sausage: 0.3, driedfruit: 0.5, canvas: 0.6, twine: 0.8, bucket: 0.5, tarp: 0.4, dice: 0.5, deck: 0.5 });
  add('metro', { wire: 1, pipe: 1, chain: 0.8, coal: 1.2, lampoil: 0.6, paraffin: 0.5, tinsheet: 0.8, bulb: 0.6, crowbar: 0.3, lantern: 0.3, mushroom: 1, pebble: 1 });
  add('school', { crayons: 1, comic: 0.8, marbles: 0.8, chess: 0.5, glue: 1, tape: 1, scissors: 0.6, biscuit: 0.6, milk: 0.4, wool: 0.6, plank: 0.8, postcard: 0.6 });
  add('apartments', { photo: 1, postcard: 0.8, record: 0.5, needle: 0.6, wool: 0.8, hinge: 1, screws: 1, nails: 1, glass: 0.8, crackers: 0.8, cocoa: 0.4, stockcube: 0.7, plank: 1, lighter: 0.3, deck: 0.4 });
  add('hospital', { gauze: 1.2, iodine: 1, suture: 0.7, splint: 0.8, spirit: 1, thermo: 0.6, eyedrops: 0.6, aspirin: 0.8, scissors: 0.5, lozenge: 0.6, milk: 0.4 });
  add('church', { wax: 1.4, twine: 0.8, flint: 0.5, honey: 0.5, driedfruit: 0.4, record: 0.3, canvas: 0.5, lantern: 0.4, penknife: 0.4, charcoal: 0.6, sand: 0.6 });
  add('bridge', { chain: 1, pipe: 0.8, spring: 1, cog: 0.8, sand: 1.2, tarp: 0.8, firecracker: 0.6, paraffin: 0.6, coal: 0.8, crowbar: 0.4, sardines: 0.5, pebble: 1 });
  add('school', { spring: 0.5, cog: 0.6 }); add('apartments', { cog: 0.6, spring: 0.5, leather: 0.6 }); add('market', { leather: 0.6, firecracker: 0.3 });
  TRADES.push([{ sausage: 1 }, { meds: 1 }], [{ honey: 1 }, { syrup: 2 }], [{ perfume: 1 }, { antibio: 1 }], [{ coal: 2 }, { flour: 1 }], [{ nails: 3 }, { parts: 1 }], [{ crayons: 1 }, { biscuit: 2 }], [{ tarp: 1 }, { cloth: 2 }], [{ wire: 2 }, { battery: 1 }]);
})();

/* ---------- 32 new recipes ---------- */
RECIPES.push(
  { id: 'porridge', n: 'Cook porridge', at: 'stove', cost: { oats: 1, water: 1 }, out: { soup: 2 }, d: 'Thick, plain, warm all the way down.' },
  { id: 'roast', n: 'Potato and onion roast', at: 'stove', cost: { potato: 2, onion: 1, fuel: 1 }, out: { soup: 3 }, d: 'Charred edges. Nobody complains.' },
  { id: 'fishsoup', n: 'Sardine soup', at: 'stove', cost: { sardines: 1, onion: 1, water: 1 }, out: { soup: 3 }, d: 'Silver tins into a pot that feeds three.' },
  { id: 'ricepot', n: 'Rice and beans', at: 'stove', cost: { rice: 1, beans: 1, water: 1 }, out: { soup: 4 }, d: 'A pot that keeps giving.' },
  { id: 'mushbroth', n: 'Mushroom broth', at: 'stove', cost: { mushroom: 2, stockcube: 1, water: 1 }, out: { soup: 3 }, d: 'Earthy, salty, honest.' },
  { id: 'cocoacup', n: 'Hot cocoa', at: 'stove', cost: { cocoa: 1, milk: 1, water: 1 }, out: { tea: 3 }, d: 'Three cups. The landing goes quiet for a while.' },
  { id: 'honeytea', n: 'Honey and herb tea', at: 'stove', cost: { honey: 1, herbs: 1, water: 1 }, out: { tea: 2, syrup: 1 }, d: 'For warmth, and for the cough.' },
  { id: 'applejam', n: 'Apple preserves', at: 'stove', cost: { apple: 2, sugar: 1 }, out: { jam: 3 }, d: 'Jars on the sill, glowing.' },
  { id: 'bakebisc', n: 'Bake biscuits', at: 'stove', cost: { flour: 1, sugar: 1, lard: 1, fuel: 1 }, out: { biscuit: 4 }, d: 'Bea\'s recipe. She will not say what the secret is.' },
  { id: 'crackbake', n: 'Bake crackers', at: 'stove', cost: { flour: 1, salt: 1, fuel: 1 }, out: { crackers: 3 }, d: 'Dry, keeps forever, good for the night road.' },
  { id: 'fudge', n: 'Boil fudge', at: 'stove', cost: { sugar: 1, milk: 1 }, out: { choc: 1 }, d: 'Not chocolate. Close enough to cry over.' },
  { id: 'cure', n: 'Smoke sausage', at: 'stove', cost: { raw: 2, salt: 1, charcoal: 1 }, out: { sausage: 1 }, d: 'Hung over the stove for a day. Worth the wait.' },
  { id: 'char', n: 'Make charcoal', at: 'stove', cost: { wood: 2 }, out: { charcoal: 2 }, d: 'Burns hotter and with less smoke.' },
  { id: 'coalfuel', n: 'Bank coal for fuel', at: 'stove', cost: { coal: 1 }, out: { fuel: 2 }, d: 'A lump of coal is two nights of heat.' },
  { id: 'oilfuel', n: 'Decant lamp oil', at: 'workbench', cost: { lampoil: 1 }, out: { fuel: 2 }, d: 'For the heater and the stove.' },
  { id: 'bottleboil', n: 'Boil and bottle water', at: 'stove', cost: { dirty: 2, bottle: 1, charcoal: 1 }, out: { water: 3 }, d: 'Charcoal-filtered and sealed.' },
  { id: 'gauzecut', n: 'Sterile gauze', at: 'workbench', cost: { cloth: 1, spirit: 1 }, out: { gauze: 3 }, tool: 'scissors', d: 'Boiled, cut and folded.' },
  { id: 'salvebatch', n: 'Herbal salve', at: 'stove', cost: { wax: 1, herbs: 1 }, out: { salve: 2 }, d: 'Wax and thyme, for hands and small cuts.' },
  { id: 'splintmake', n: 'Make a splint', at: 'workbench', cost: { plank: 1, tape: 1 }, out: { splint: 1 }, tool: 'penknife', d: 'Smooth edges. Marta checks it.' },
  { id: 'waxcandle', n: 'Dip candles', at: 'workbench', cost: { wax: 1, twine: 1 }, out: { candle: 2 }, d: 'Two good candles from one lump of wax.' },
  { id: 'lanternmake', n: 'Build a storm lantern', at: 'workbench', cost: { tinsheet: 1, glass: 1, wire: 1 }, out: { lantern: 1 }, d: 'It will not blow out.' },
  { id: 'firecrack', n: 'Pack firecrackers', at: 'workbench', cost: { paraffin: 1, matches: 1, tape: 1 }, out: { firecracker: 2 }, d: 'Thrown, it bangs and sends every guard running to look.' },
  { id: 'sandbags', n: 'Fill sandbags', at: 'workbench', cost: { sand: 2, canvas: 1 }, out: {}, fx: 'sandbag', d: 'Stacked against the door. One more layer of barricade.' },
  { id: 'insulate', n: 'Line the walls', at: 'workbench', cost: { wool: 2, tarp: 1 }, out: {}, fx: 'drafts', max: 3, d: 'Wool behind tarpaulin. The cold has to work harder.' },
  { id: 'jumper', n: 'Knit a jumper', at: 'workbench', cost: { wool: 3 }, out: { coat: 1 }, tool: 'needle', d: 'Lumpy, warm, loved.' },
  { id: 'satchel', n: 'Sew a satchel', at: 'workbench', cost: { leather: 2, twine: 1 }, out: {}, fx: 'satchel', max: 2, tool: 'needle', d: 'Scouts carry one more thing home. Two satchels at most.' },
  { id: 'braid', n: 'Twine into rope', at: 'workbench', cost: { twine: 3 }, out: { rope: 1 }, d: 'Three strands become one.' },
  { id: 'chessmake', n: 'Carve a chess set', at: 'workbench', cost: { plank: 1, crayons: 1 }, out: { chess: 1 }, tool: 'penknife', d: 'The knights look like dogs. Everyone agrees this is better.' },
  { id: 'scrapjar', n: 'Sort the screw jar', at: 'workbench', cost: { screws: 2, nails: 2 }, out: { parts: 1 }, d: 'An evening of sorting. One useful handful.' },
  { id: 'clockparts', n: 'Strip clockwork', at: 'workbench', cost: { cog: 2, spring: 1 }, out: { parts: 2 }, d: 'Tiny parts, big uses.' },
  { id: 'hingeparts', n: 'Salvage hinges and pipe', at: 'workbench', cost: { hinge: 2, pipe: 1 }, out: { parts: 1, nails: 2 }, d: 'Nothing goes to waste here.' },
  { id: 'pryboards', n: 'Pry up old floorboards', at: 'workbench', cost: {}, out: { wood: 2, nails: 2 }, tool: 'crowbar', daily: true, d: 'Once a day. The empty flat below will not miss them.' }
);
RECIPE_FX.sandbag = run => { run.barricade = Math.min(BARRICADE_MAX, run.barricade + 1); return 'Sandbags against the door. It will hold longer now.'; };
RECIPE_FX.satchel = run => { run.satchel = Math.min(2, num(run.satchel) + 1); return 'A new satchel. Scouts can carry ' + run.satchel + ' more.'; };
/* helpers for the workbench */
function craftCount(run, r) { let n = 99; for (const k in r.cost) n = Math.min(n, Math.floor(num(run.stock[k]) / r.cost[k])); if (r.tool && Run.count(run, r.tool) < 1) n = 0; if (r.daily && run.daily && run.daily['rc_' + r.id]) n = 0; if (r.max && num(run[r.fx]) >= r.max) n = 0; return n === 99 ? 9 : n; }
function craftMissing(run, r) {
  if (r.max && num(run[r.fx]) >= r.max) return 'Already done.';
  if (r.daily && run.daily && run.daily['rc_' + r.id]) return 'Done for today.';
  const m = []; for (const k in r.cost) { const lack = r.cost[k] - num(run.stock[k]); if (lack > 0) m.push(lack + ' ' + ITEMS[k].n); }
  if (r.tool && Run.count(run, r.tool) < 1) m.push('a ' + ITEMS[r.tool].n.toLowerCase() + ' (kept)');
  return m.length ? 'Missing: ' + m.join(', ') : false;
}
function craftList(run, at) { return RECIPES.filter(r => r.at === at && (!RECIPE_GATE[r.id] || RECIPE_GATE[r.id](run))).sort((a, b) => (craftCount(run, b) > 0) - (craftCount(run, a) > 0)); }
function craftSub(r) { const c = Run.costText(r.cost); return (c ? 'Uses ' + c : 'Uses nothing') + (r.tool ? ', with a ' + ITEMS[r.tool].n.toLowerCase() + ' (kept)' : '') + '. ' + r.d; }
function craftBonus(run, r, s) {
  const extra = {}; if (r.tool === 'scissors' || (r.id === 'bandage' && Run.count(run, 'scissors') > 0)) extra.bandage = r.id === 'bandage' ? 1 : 0;
  if (r.daily) { run.daily = run.daily || {}; run.daily['rc_' + r.id] = 1; }
  if (s && (s.id === 'dov' || s.id === 'ravi') && r.at === 'workbench' && Math.random() < 0.25) { for (const k in r.out) { Run.add(run, k, 1); note(s.name + ' gets an extra ' + ITEMS[k].n.toLowerCase() + ' out of it.'); break; } }
  for (const k in extra) if (extra[k]) Run.add(run, k, extra[k]);
}

/* ---------- 75 enemy variants ---------- */
/* [id, base, name, tier 1-5, traits, look, description] */
const FOES = [
  ['gc_recruit', 'patrol', 'Grey Coat recruit', 1, 'myopic slow', 'cap', 'New to the coat. Looks at the floor more than the shadows.'],
  ['gc_warden', 'patrol', 'Curfew warden', 1, '', 'armband', 'The ordinary kind. Walks the round, checks the doors.'],
  ['gc_lamp', 'patrol', 'Lamp warden', 2, 'lamp', 'lantern', 'Carries a big lamp. Sees far, and is easy to see coming.'],
  ['gc_sergeant', 'patrol', 'Grey Coat sergeant', 3, 'keen caller', 'peak', 'Shouts for the others the moment anything moves.'],
  ['gc_whistler', 'patrol', 'Whistle warden', 2, 'caller', 'whistle', 'Blows a whistle when alarmed. Every Grey Coat nearby comes.'],
  ['gc_sleepy', 'patrol', 'Night-shift warden', 1, 'sleepy deaf', 'scarf', 'Three shifts in a row. Stops to rest his eyes.'],
  ['gc_veteran', 'patrol', 'Old warden', 3, 'stubborn keen', 'fur', 'Searches longer than anyone. Remembers every hiding place.'],
  ['gc_runner', 'patrol', 'Messenger', 2, 'swift myopic', 'cap', 'Runs between posts. Fast, but in a hurry.'],
  ['gc_brute', 'patrol', 'Doorbreaker', 3, 'brute slow', 'helmet2', 'Kicks doors in for a living. Hits hard.'],
  ['gc_sweeper', 'patrol', 'Stairwell guard', 2, 'sweeper', 'armband', 'Keeps turning around. Never trusts an empty corridor.'],
  ['gc_listener', 'patrol', 'Listening post', 3, 'sharp sentry', 'headphones', 'Stands still with an ear to the dark.'],
  ['gc_masked', 'patrol', 'Gas-mask warden', 3, 'myopic sharp', 'gasmask', 'The mask narrows his eyes but not his ears.'],
  ['gc_clerk', 'patrol', 'Register clerk', 2, 'caller slow', 'peak', 'Would rather write you down than chase you.'],
  ['gc_hunter', 'patrol', 'Curfew hunter', 4, 'keen swift stubborn', 'fur', 'Hunts curfew breakers for a bonus.'],
  ['gc_captain', 'patrol', 'Grey Coat captain', 5, 'keen caller brute', 'peak', 'Every warden in the building answers to her.'],
  ['gc_rookie', 'patrol', 'Shaking recruit', 1, 'coward', 'cap', 'More scared of you than you are of him. Nearly.'],
  ['gc_tracker', 'patrol', 'Footprint man', 4, 'tracker', 'goggles', 'Follows your trail through dust and snow.'],
  ['gc_lantern2', 'patrol', 'Searchlight crew', 4, 'lamp keen', 'lantern', 'Off the searchlight for the night, lamp still in hand.'],
  ['gc_drunk', 'patrol', 'Warden on brandy', 1, 'myopic deaf sleepy', 'scarf', 'Hums to himself. You can hear him three rooms off.'],
  ['gc_wise', 'patrol', 'Patient warden', 3, 'wise', 'armband', 'Will not chase a thrown bottle twice.'],
  ['gc_twin', 'patrol', 'The Pell twins', 3, 'caller sweeper', 'helmet2', 'They always patrol in pairs and talk across rooms.'],
  ['gc_nightowl', 'patrol', 'Night owl', 4, 'keen sharp', 'goggles', 'Sees better in the dark than anyone should.'],
  ['gc_cook', 'patrol', 'Mess-hall warden', 1, 'slow', 'scarf', 'Thinking about soup. Like everyone.'],
  ['gc_engineer', 'patrol', 'Field engineer', 2, 'deaf', 'headphones', 'Deafened by years of generators.'],
  ['gc_inspector', 'patrol', 'Inspector Varga', 5, 'keen stubborn wise caller', 'peak', 'The one everyone warns you about.'],
  ['mg_picker', 'scav', 'Magpie picker', 1, '', 'hood', 'Goes through drawers. Mostly looking down.'],
  ['mg_lookout', 'scav', 'Magpie lookout', 2, 'keen caller', 'bandana', 'Watches while the others pick.'],
  ['mg_runner', 'scav', 'Magpie runner', 2, 'swift', 'beanie', 'Grabs and runs. Hard to shake off.'],
  ['mg_bruiser', 'scav', 'Magpie bruiser', 3, 'brute slow', 'beanie', 'Big hands. Wants your pack.'],
  ['mg_kid', 'scav', 'Magpie kid', 1, 'coward swift', 'beanie', 'Too young for this. Runs if you face him.'],
  ['mg_boss', 'scav', 'Magpie boss', 4, 'caller keen brute', 'feather', 'Wears a black and white feather. Gives the orders.'],
  ['mg_sneak', 'scav', 'Magpie sneak', 3, 'sharp thief', 'hood', 'Steals from your pack before you notice.'],
  ['mg_hoarder', 'scav', 'Hoarder', 2, 'slow stubborn', 'sack', 'Too much in the sack to move quickly.'],
  ['mg_twitchy', 'scav', 'Twitchy Magpie', 2, 'sweeper sharp', 'bandana', 'Jumps at every sound.'],
  ['mg_lamplifter', 'scav', 'Lamp-lifter', 2, 'lamp', 'lantern', 'Steals lamps, then uses them. Easy to see.'],
  ['mg_scrap', 'scav', 'Scrap-man', 1, 'deaf', 'goggles', 'Ears full of rust.'],
  ['mg_widow', 'scav', 'The Widow', 4, 'wise stubborn', 'hood', 'Patient, quiet, and not fooled by bottles.'],
  ['mg_dogman', 'scav', 'Dog-man', 3, 'tracker', 'fur', 'Learned to follow a trail from his dogs.'],
  ['mg_mute', 'scav', 'Silent Magpie', 3, 'sharp', 'bandana', 'Never speaks. Never stops listening.'],
  ['mg_glass', 'scav', 'Glass-eye', 2, 'myopic brute', 'beanie', 'One good eye, two heavy fists.'],
  ['mg_singer', 'scav', 'Singing Magpie', 1, 'deaf slow', 'scarf', 'Sings while he works. You will hear him first.'],
  ['mg_fox', 'scav', 'Fox', 4, 'swift keen', 'feather', 'The fastest of them. Wears a fox-fur collar.'],
  ['mg_twins', 'scav', 'Magpie sisters', 3, 'caller sweeper', 'hood', 'One watches the door, one the stairs.'],
  ['mg_gambler', 'scav', 'Gambler', 2, 'sleepy', 'cap', 'Would rather be playing cards.'],
  ['mg_queen', 'scav', 'The Magpie Queen', 5, 'keen caller wise thief', 'crown', 'Old, sharp, and owner of half the city\'s stolen silver.'],
  ['dg_mutt', 'dog', 'Mutt', 1, '', 'spots', 'Hungry and nervous.'],
  ['dg_hound', 'dog', 'Hound', 3, 'sharp tracker', 'collar', 'Follows your scent across floors.'],
  ['dg_greyhound', 'dog', 'Greyhound', 3, 'swift', 'lean', 'You cannot outrun her. Do not try.'],
  ['dg_old', 'dog', 'Old dog', 1, 'deaf slow sleepy', 'grey', 'Sleeps through almost anything.'],
  ['dg_guard', 'dog', 'Guard dog', 4, 'brute sharp caller', 'spikes', 'Barks the whole building awake.'],
  ['dg_pup', 'dog', 'Stray pup', 1, 'coward', 'spots', 'Mostly curious. Food makes a friend.'],
  ['dg_shepherd', 'dog', 'Shepherd', 3, 'keen stubborn', 'collar', 'Trained once. Still remembers how to search.'],
  ['dg_terrier', 'dog', 'Terrier', 2, 'sharp sweeper', 'spots', 'Small, loud, everywhere.'],
  ['dg_mastiff', 'dog', 'Mastiff', 4, 'brute slow', 'spikes', 'Slow to start. Do not let it finish.'],
  ['dg_pack', 'dog', 'Pack leader', 5, 'caller tracker swift', 'torn', 'Where she goes, the others follow.'],
  ['dg_lame', 'dog', 'Three-legged dog', 1, 'slow', 'torn', 'Limps after you, barking.'],
  ['dg_muzzled', 'dog', 'Muzzled dog', 2, 'tracker', 'muzzle', 'Cannot bite, can still bark you into trouble.'],
  ['rd_thug', 'raider', 'Raider', 2, '', 'beanie', 'Bangs on doors. Wants food.'],
  ['rd_axe', 'raider', 'Raider with an axe', 3, 'brute', 'hood', 'The door will not hold long against him.'],
  ['rd_talker', 'raider', 'Smooth talker', 2, 'coward', 'cap', 'Tries to talk his way in first.'],
  ['rd_leader', 'raider', 'Raid leader', 4, 'caller brute', 'feather', 'Keeps the others brave. Scare her and they scatter.'],
  ['rd_youth', 'raider', 'Young raider', 1, 'coward swift', 'beanie', 'Will run at the first pot banged.'],
  ['rd_vet', 'raider', 'Hardened raider', 4, 'stubborn wise', 'fur', 'Has heard every pot banged in the city.'],
  ['rd_crowbar', 'raider', 'Crowbar man', 3, 'brute slow', 'goggles', 'Brings his own way in.'],
  ['ce_clerk', 'census', 'List-keeper', 1, '', 'clipboard', 'Knocks, writes, moves on.'],
  ['ce_senior', 'census', 'Senior list-keeper', 3, 'keen stubborn', 'peak', 'Checks under the beds.'],
  ['ce_counter', 'census', 'Head-counter', 2, 'sharp', 'clipboard', 'Counts breaths through doors.'],
  ['ce_lamp', 'census', 'Census lamp-bearer', 2, 'lamp', 'lantern', 'Holds the light for the others.'],
  ['ce_tired', 'census', 'Tired list-keeper', 1, 'sleepy myopic', 'scarf', 'Last building of a long night.'],
  ['ce_chief', 'census', 'Registrar', 5, 'keen wise caller', 'peak', 'Signs every list. Remembers every name.'],
  ['gc_rain', 'patrol', 'Oilskin warden', 2, 'myopic', 'hood', 'Hood pulled low against the rain.'],
  ['mg_rat', 'scav', 'Rat-catcher', 2, 'sharp tracker', 'goggles', 'Catches rats for the market. Good at corners.'],
  ['dg_black', 'dog', 'Black dog', 3, 'keen swift', 'lean', 'Invisible in the dark until it is not.'],
  ['gc_bell', 'patrol', 'Bell-ringer', 3, 'caller', 'helmet2', 'Rings the alarm bell. The whole block wakes.'],
  ['mg_ghost', 'scav', 'The Quiet One', 4, 'sharp swift wise', 'hood', 'Nobody has seen her face. Many have lost their packs.']
];
const FOE = {}; FOES.forEach(f => { FOE[f[0]] = { id: f[0], base: f[1], n: f[2], tier: f[3], traits: f[4] ? f[4].split(' ') : [], look: f[5], d: f[6] }; });
const TRAIT_FX = {
  keen: T => { T.vis *= 1.25; }, myopic: T => { T.vis *= 0.75; }, sharp: T => { T.hear *= 1.4; }, deaf: T => { T.hear *= 0.6; },
  swift: T => { T.spd *= 1.12; T.chase *= 1.12; }, slow: T => { T.spd *= 0.86; T.chase *= 0.88; }, brute: T => { T.dmg *= 1.4; T.nerve += 3; },
  lamp: T => { T.vis *= 1.15; }, coward: T => { T.nerve = Math.max(0, T.nerve - 2); }, stubborn: () => {}, caller: () => {}, sweeper: () => {}, sleepy: T => { T.vis *= 0.9; },
  tracker: () => {}, sentry: T => { T.spd *= 0.5; }, wise: () => {}, thief: () => {}
};
const TRAIT_NAME = { keen: 'sharp-eyed', myopic: 'short-sighted', sharp: 'sharp-eared', deaf: 'hard of hearing', swift: 'fast', slow: 'slow', brute: 'hits hard', lamp: 'carries a lamp', coward: 'easily scared', stubborn: 'searches longer', caller: 'calls for help', sweeper: 'keeps turning round', sleepy: 'dozes off', tracker: 'follows your trail', sentry: 'stands guard', wise: 'ignores thrown things', thief: 'steals from your pack' };
function foeApply(n, id) {
  const F = FOE[id]; if (!F) return; const T = Object.assign({}, NPCT[n.type]); for (const tr of F.traits) if (TRAIT_FX[tr]) TRAIT_FX[tr](T);
  if (F.look === 'lean') T.h *= 0.95; T.n = F.n; n.T = T; n.var = id; n.F = F; n.baseT = Object.assign({}, T);
}
/* small accessories drawn on top of the shared bodies (head at y - (46h - 6)) */
function foeLook(ctx, n, x, y) {
  const F = n.F; if (!F) return; const L = F.look, h = n.T.h, dir = n.face || 1, t = Game.time;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  if (n.type === 'dog') {
    const bob = Math.abs(n.vx) > 3 ? Math.abs(Math.sin(n.ph)) * 1.5 : 0;
    if (L === 'spots') { ctx.fillStyle = grey(96); ctx.beginPath(); ctx.arc(-4, -16 - bob, 2.6, 0, TAU); ctx.arc(4, -13 - bob, 2, 0, TAU); ctx.fill(); }
    else if (L === 'spikes' || L === 'collar') { ctx.fillStyle = grey(170); for (let i = 0; i < (L === 'spikes' ? 4 : 1); i++) { ctx.beginPath(); ctx.moveTo(8 + i * 2, -22 - bob); ctx.lineTo(9 + i * 2, -25.5 - bob); ctx.lineTo(10 + i * 2, -22 - bob); ctx.fill(); } if (L === 'collar') ctx.fillRect(10, -15 - bob, 2, 3); }
    else if (L === 'muzzle') { ctx.strokeStyle = grey(150); ctx.lineWidth = 1; ctx.strokeRect(15, -20 - bob, 7, 5); }
    else if (L === 'torn') { ctx.fillStyle = grey(30); ctx.fillRect(15, -29 - bob, 3, 3); }
    else if (L === 'grey') { ctx.fillStyle = grey(150, 0.6); ctx.beginPath(); ctx.arc(14, -18 - bob, 3, 0, TAU); ctx.fill(); }
    else if (L === 'lean') { ctx.strokeStyle = grey(20, 0.6); ctx.lineWidth = 0.8; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-4 + i * 3, -19 - bob); ctx.lineTo(-4 + i * 3, -11 - bob); ctx.stroke(); } }
    ctx.restore(); return;
  }
  const H = 46 * h, hy = -(H - 6), lean = n.st === 'chase' ? 0.18 : n.st === 'hostile' ? 0.3 : 0;
  ctx.translate(0, -15 * h); ctx.rotate(lean); ctx.translate(0, 15 * h);
  const hat = (g, f) => { ctx.fillStyle = grey(g); f(); };
  switch (L) {
    case 'cap': hat(26, () => { ctx.fillRect(-6, hy - 8, 14, 5); ctx.fillRect(3, hy - 4, 9, 2); }); break;
    case 'peak': hat(18, () => { ctx.fillRect(-7, hy - 10, 16, 6); ctx.fillRect(-4, hy - 4.5, 15, 2.2); ctx.fillStyle = grey(190); ctx.fillRect(0, hy - 8.5, 3, 2); }); break;
    case 'fur': hat(70, () => { rrect(ctx, -8, hy - 11, 18, 8, 3); ctx.fill(); ctx.fillRect(-8, hy - 4, 4, 8); }); break;
    case 'helmet2': hat(40, () => { ctx.beginPath(); ctx.arc(1, hy - 2, 8.6, Math.PI, TAU); ctx.fill(); ctx.fillStyle = grey(90); ctx.fillRect(-3, hy - 9, 8, 1.2); }); break;
    case 'hood': hat(36, () => { ctx.beginPath(); ctx.arc(0, hy, 8.4, Math.PI * 0.5, Math.PI * 1.95); ctx.fill(); }); break;
    case 'beanie': hat(52, () => { ctx.beginPath(); ctx.arc(1, hy - 2, 7, Math.PI, TAU); ctx.fill(); ctx.fillRect(-6, hy - 3, 14, 2.4); ctx.beginPath(); ctx.arc(1, hy - 10, 2, 0, TAU); ctx.fill(); }); break;
    case 'bandana': hat(80, () => { ctx.fillRect(-2, hy + 1, 10, 4); }); break;
    case 'scarf': hat(90, () => { ctx.fillRect(-6, hy + 5, 14, 3); ctx.fillRect(-7, hy + 6, 3, 8); }); break;
    case 'armband': hat(180, () => { ctx.fillRect(-1, -(H - 15 * h - 15) - 15 * h + 4, 5, 3); }); break;
    case 'gasmask': hat(28, () => { ctx.beginPath(); ctx.arc(6, hy + 2, 3.6, 0, TAU); ctx.fill(); ctx.fillStyle = grey(200); ctx.fillRect(3, hy - 2, 2.4, 2); ctx.fillRect(6.5, hy - 2, 2.4, 2); }); break;
    case 'goggles': hat(160, () => { ctx.fillRect(1, hy - 3, 8, 3); ctx.fillStyle = grey(30); ctx.fillRect(-6, hy - 2.5, 7, 1.4); }); break;
    case 'headphones': hat(30, () => { ctx.lineWidth = 1.6; ctx.strokeStyle = grey(30); ctx.beginPath(); ctx.arc(1, hy, 8, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.fillRect(-2, hy - 2, 3, 5); }); break;
    case 'feather': hat(220, () => { ctx.save(); ctx.translate(-4, hy - 7); ctx.rotate(-0.6 + Math.sin(t * 3) * 0.08); ctx.fillRect(0, -9, 2, 9); ctx.fillStyle = grey(10); ctx.fillRect(0, -9, 2, 4); ctx.restore(); }); break;
    case 'crown': hat(200, () => { ctx.beginPath(); ctx.moveTo(-5, hy - 7); ctx.lineTo(-4, hy - 12); ctx.lineTo(-1, hy - 9); ctx.lineTo(1, hy - 13); ctx.lineTo(3, hy - 9); ctx.lineTo(6, hy - 12); ctx.lineTo(7, hy - 7); ctx.fill(); }); break;
    case 'whistle': hat(200, () => { ctx.fillRect(7, hy + 2, 4, 1.6); }); break;
    case 'sack': hat(82, () => { ctx.beginPath(); ctx.ellipse(-10, -24 * h, 8, 11, -0.2, 0, TAU); ctx.fill(); }); break;
    case 'clipboard': hat(210, () => { ctx.fillRect(9, -26 * h, 6, 9); }); break;
    case 'lantern': {
      const ly = -22 * h; ctx.fillStyle = grey(60); ctx.fillRect(10, ly - 1, 5, 7); ctx.fillStyle = grey(240); ctx.fillRect(11, ly + 1, 3, 3);
      const g = ctx.createRadialGradient(12.5, ly + 2, 0, 12.5, ly + 2, 26); g.addColorStop(0, grey(240, 0.35)); g.addColorStop(1, grey(240, 0)); ctx.fillStyle = g; ctx.fillRect(-14, ly - 24, 54, 52); break; }
    default: break;
  }
  ctx.restore();
}

/* ---------- smarter shared AI ---------- */
const V13AI = {
  call(w, n, s) {
    const r = n.F && n.F.traits.indexOf('caller') >= 0 ? 760 : 380; let k = 0;
    for (const m of w.npcs) { if (m === n || !m.T.hostile || m.tame || m.gone || m.st === 'chase' || m.st === 'hostile' || m.mode === 'raid' || m.mode === 'route' || m.late) continue; const df = Math.abs(m.f - n.f); if (df > 1 || Math.abs(m.x - n.x) > r / (df + 1)) continue; m.st = 'investigate'; m.tgt = { x: s.x, f: w.entF(s) }; m.aw = Math.max(m.aw, 0.6); k++; }
    if (k) { n.say('', n.type === 'dog' ? 'WOOF! WOOF!' : n.type === 'scav' ? 'Over here!' : 'Here! On me!'); if (n.F && n.F.look === 'whistle' || (n.F && n.F.id === 'gc_bell')) Snd.sfx('squeak', { v: 1 }); Bus.emit('foeCalled', { n, k }); }
  }
};
(function () {
  // every hostile gets its own stats object, and a named variant suited to the place and the night
  const _sp = World.prototype.spawnNPC;
  World.prototype.spawnNPC = function (type, x, f, o) {
    const n = _sp.call(this, type, x, f, o); o = o || {};
    if (n.T && n.T.hostile) {
      let id = o.var;
      if (!id) { const tier = (this.L.loc ? this.L.loc.danger : 2) + Math.floor(num(this.run.day) / 8), pool = FOES.filter(q => q[1] === type && q[3] <= tier + 1); if (pool.length) id = pool[Math.floor(this.rng.r(0, pool.length))][0]; }
      if (id) foeApply(n, id); else n.T = Object.assign({}, n.T);
    }
    return n;
  };
  const _nu = NPC.prototype.update;
  NPC.prototype.update = function (w, dt) {
    const before = this.st, F = this.F, tr = F ? F.traits : [];
    // memory: on edge for a while after losing someone
    if (this.edge > 0 && this.baseT) { this.edge -= dt; const k = this.edge > 0 ? 1.22 : 1; this.T.vis = this.baseT.vis * k; this.T.spd = this.baseT.spd * (this.edge > 0 ? 1.08 : 1); }
    // glance back on the round (sweepers more often), sentries turn on the spot
    if (this.st === 'patrol' && this.T.hostile && !this.mode && this.type !== 'dog') {
      this.glT = (this.glT == null ? 6 + Math.random() * 8 : this.glT) - dt;
      if (this.glT <= 0) { this.glT = (tr.indexOf('sweeper') >= 0 ? 4 : 9) + Math.random() * 8; this.face *= -1; this.st = 'idle'; this.wait = 1.1; this.glanced = true; }
      if (tr.indexOf('sleepy') >= 0 && Math.random() < dt * 0.03) { this.st = 'idle'; this.wait = 4 + Math.random() * 3; this.dozing = this.wait; }
      if (tr.indexOf('sentry') >= 0) { this.st = 'idle'; this.wait = 2.5; }
    }
    if (this.dozing > 0) { this.dozing -= dt; if (Math.random() < dt * 0.4) Parts.emit('zzz', this.x + 6, w.entY(this) - 50, 1, {}); }
    // tracking by scent: trackers head for where you are, not where you were
    if (tr.indexOf('tracker') >= 0 && (this.st === 'investigate' || this.st === 'search')) { const s = w.surv.find(q => !q.hidden && !q.down && w.entF(q) === this.f && Math.abs(q.x - this.x) < 320); if (s) this.tgt = { x: s.x, f: this.f }; }
    const r = _nu.call(this, w, dt);
    // a search that sweeps the room instead of standing still
    if (this.st === 'search' && this.tgt && !this.cl) { this.sT = num(this.sT) + dt; const sx = this.tgt.x + Math.sin(this.sT * 1.4) * 90; if (this.tgt.f === this.f) w.nav(this, sx, this.f, dt, this.T.spd * 0.6); }
    if (before !== 'chase' && this.st === 'chase' && this.T.hostile) { const s = w.surv.find(q => !q.down && !q.hidden) || w.surv[0]; if (s) V13AI.call(w, this, s); if (this.F && !this.named) { this.named = true; Floaters.add(this.F.n, this.x, w.entY(this) - 70, {}); } }
    if ((before === 'search' || before === 'investigate') && this.st === 'patrol') { this.edge = tr.indexOf('stubborn') >= 0 ? 40 : 25; }
    if (tr.indexOf('stubborn') >= 0 && this.st === 'search' && before !== 'search') this.wait = num(this.wait) + 3;
    return r;
  };
  // learning: after being fooled twice, wise ones (and the rest, half the time) ignore thrown things
  const _hear = NPC.prototype.hear;
  NPC.prototype.hear = function (w, x, f, r, src) {
    if (src === 'throw' && this.T && this.T.hostile) {
      const wise = this.F && this.F.traits.indexOf('wise') >= 0, fooled = num(this.fooled);
      if ((wise && fooled >= 1) || fooled >= 3 || (fooled >= 2 && Math.random() < 0.5)) { if (!this.toldOff) { this.toldOff = true; this.say('', 'Not falling for that again.'); } return; }
      const b = this.st; _hear.call(this, w, x, f, r, src); if (b !== this.st && this.st === 'investigate') this.fooled = fooled + 1; return;
    }
    return _hear.call(this, w, x, f, r, src);
  };
  const _dn = Rig.drawNPC;
  Rig.drawNPC = function (ctx, n, x, y, a) { const r = _dn.apply(this, arguments); if (n.F) { ctx.save(); ctx.globalAlpha = a == null ? 1 : a; foeLook(ctx, n, x, y); ctx.restore(); } return r; };
  // the field guide remembers every face you have met
  const _wu = World.prototype.update;
  World.prototype.update = function (dt, ctl) {
    const r = _wu.call(this, dt, ctl);
    if (this.L.site) { const a = this.surv.find(s => s.active) || this.surv[0]; if (a) for (const n of this.npcs) if (n.var && n.f === this.entF(a) && Math.abs(n.x - a.x) < 420) { const sv = Save.data.seenVars || (Save.data.seenVars = {}); if (!sv[n.var]) { sv[n.var] = 1; Save.write(); } } }
    return r;
  };
  // satchels: scouts carry more
  const _se = SortieScene.prototype.enter;
  SortieScene.prototype.enter = function (p) { const r = _se.call(this, p); if (this.w && Game.run) this.w.pack.cap += num(Game.run.satchel); return r; };
})();

/* ---------- the player's guide ---------- */
const GUIDE_URL = 'Ashen-Windows-Players-Guide.pdf';
function openGuide() {
  Snd.sfx('page');
  let ok = false; try { const w = window.open(GUIDE_URL, '_blank', 'noopener'); ok = !!w; } catch (e) { ok = false; }
  if (!ok) { try { const a = document.createElement('a'); a.href = GUIDE_URL; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { /* ignore */ } }
  Game.note('The Player\'s Guide opens in a new tab: ' + GUIDE_URL, 5);
}

/* ---------- Save all / Import all: the whole game in one file ---------- */
const SaveIO = {
  pack() { return JSON.stringify({ game: 'ashen-windows', format: 1, version: VERSION, saved: new Date().toISOString(), data: Save.data }); },
  exportAll() {
    Save.write(); const text = this.pack(), name = 'ashen-windows-save-' + new Date().toISOString().slice(0, 10) + '.json';
    let ok = false;
    try { const blob = new Blob([text], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); ok = true; } catch (e) { ok = false; }
    try { if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {}); } catch (e) { /* ignore */ }
    Snd.sfx('chime'); Game.note(ok ? 'Saved everything to ' + name + ' (also copied to the clipboard).' : 'Your browser blocked the download. The save was copied to the clipboard instead.', 6);
  },
  /* accepts the file text, or the bare save object */
  apply(text) {
    let o; try { o = JSON.parse(text); } catch (e) { return 'That file is not an Ashen Windows save.'; }
    const d = o && o.game === 'ashen-windows' ? o.data : o;
    if (!d || d.v !== 1 || typeof d.settings !== 'object') return 'That file is not an Ashen Windows save.';
    Save.data = deepMerge(Save.defaults(), d); Save.write(); Snd.applyVol(); return null;
  },
  importAll() {
    try {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json'; inp.style.display = 'none';
      inp.onchange = () => { const f = inp.files && inp.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => this.finish(String(rd.result)); rd.readAsText(f); inp.remove(); };
      document.body.appendChild(inp); inp.click();
    } catch (e) { this.fromClipboard(); }
  },
  fromClipboard() {
    try { navigator.clipboard.readText().then(t => this.finish(t), () => Game.note('Could not read the clipboard. Use Import all and pick the save file.', 5)); } catch (e) { Game.note('Could not read the clipboard.', 4); }
  },
  finish(text) {
    const err = this.apply(text);
    if (err) { Snd.sfx('deny'); Game.note(err, 5); return; }
    Snd.sfx('unlock'); Game.ov.length = 0; Game.go('Title', {}, 'flicker'); setTimeout(() => Game.note('Imported. Your settings, unlocks, keepsakes, saved runs and Long Walk progress are back.', 6), 700);
  }
};
