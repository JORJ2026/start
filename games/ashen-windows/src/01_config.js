/* ASHEN WINDOWS - a single-file survival drama. Everything below is original, procedural, and offline. */
(function () {
'use strict';

/* ==========================================================================
   SECTION 1: CONSTANTS AND CONFIG
   ========================================================================== */
const VERSION = '1.4.0';
const W = 960, H = 540;                       // logical resolution (16:9)
const DEBUG = /[?&]debug\b/.test(location.search);

/* Charcoal-and-paper palette: 15 named greys plus one tiny alert tint. */
const G = {
  black: '#000000', ink: '#0c0c0c', coal: '#171717', soot: '#232323', slate: '#303030', iron: '#3e3e3e',
  ash: '#4e4e4e', stone: '#646464', fog: '#7c7c7c', dust: '#969696', pewter: '#b0b0b0', chalk: '#c8c8c8',
  paper: '#dddddd', bone: '#eeeeee', white: '#ffffff',
  alert: '#b4504a'                            // the only non-survivor tint: sniper reticle and fire core
};

const CFG = {
  stepHz: 60, maxDelta: 0.1,
  dayLen: 150, nightLen: 240,                 // seconds of real time per phase
  walk: 64, runMul: 2.2, sneakMul: 0.45, climb: 1.3, timeScale: 1.15,   // 1.4: slower on foot; sprint still outruns a patrol, and nights run longer to match
  jumpV: 230, gravity: 760,
  interactR: 30, stepDist: 26,
  noise: { sneak: 16, walk: 62, run: 140, door: 120, loot: 70, pry: 220, throw: 230, swing: 130, clatter: 260, water: 45 },
  light: { cone: 240, half: 0.36, batteryDrain: 0.55 },   // battery % per second while lit
  expo: { dark: 0.5, torch: 0.8, lit: 0.45, crouch: 0.6, run: 1.2 },
  iframe: 1.0, hitStop: 0.045, closeCall: 0.85,
  needs: { hungerDay: 38, fatigueDay: 20, mealFull: 44, mealRaw: 22, critical: 18 },
  pack: 10, cartBonus: 4,
  replaySecs: 6, replayHz: 15,
  particles: { high: 600, medium: 340, low: 140 },
  phases: ['The First Week', 'The Long Cold', 'The Breaking Point', 'The Thaw'],
  fonts: { type: '"Courier New", Courier, "Nimbus Mono PS", "Liberation Mono", monospace',
           serif: 'Georgia, "Times New Roman", "DejaVu Serif", serif' },
  home: { x0: 90, x1: 870, floorsY: [110, 205, 300, 395, 490], camY: 261, zoom: 0.84, doorX: 862, streetX: 950 },
  site: { groundY: 440, floorH: 100 },
  embers: { night: 5, day: 3, win: 60, kind: 4 }
};

const DIFF = {
  gentle: { name: 'Gentle', react: 0.6, vision: 0.8, patrols: 0.6, scarcity: 1.3, events: 0.7, warn: 1.5, dmg: 0.7 },
  normal: { name: 'Normal', react: 1.0, vision: 1.0, patrols: 1.0, scarcity: 1.0, events: 1.0, warn: 1.0, dmg: 1.0 },
  harsh:  { name: 'Harsh',  react: 1.5, vision: 1.2, patrols: 1.5, scarcity: 0.75, events: 1.3, warn: 0.75, dmg: 1.25 }
};

/* ==========================================================================
   SECTION 2: CONTENT DATA TABLES (rebalance here, not in engine code)
   ========================================================================== */

/* --- Survivors. hue = [h, s, l] signature color; st = stats 1..5 --- */
const SURVIVORS = {
  marta: { name: 'Marta "Mouse" Okonkwo-Reyes', short: 'Marta', age: 34, role: 'former school nurse',
    bio: 'Kept a jar of plasters for every scraped knee in the district. Still counts heads at night.',
    hue: [4, 74, 50], skin: [22, 42, 38], hair: 20, skill: 'Medicine', trait: 'Steady hands: heals faster',
    flaw: "Carries everyone's worries", tool: 'First-aid satchel',
    st: { spd: 3, str: 2, stl: 3, luck: 3, cook: 3, med: 5, res: 2, noise: 2 }, b: { h: 1.0, w: 1.0, hair: 'bun', acc: 'scarf' } },
  dov: { name: 'Dov Lindqvist', short: 'Dov', age: 58, role: 'retired carpenter',
    bio: 'Built half the staircases on this street. His knee now complains about every one of them.',
    hue: [44, 78, 50], skin: [26, 36, 62], hair: 70, skill: 'Crafting and repair', trait: 'Sturdy builder: cheaper, stronger work',
    flaw: 'Slow on that knee', tool: 'Hammer and nails',
    st: { spd: 1, str: 4, stl: 2, luck: 2, cook: 2, med: 2, res: 4, noise: 3 }, b: { h: 0.98, w: 1.15, hair: 'cap', acc: 'cardigan' } },
  ines: { name: 'Ines Varga', short: 'Ines', age: 19, role: 'courier and runner',
    bio: 'Knew every shortcut in Greywater before the siege. Knows the new ones too.',
    hue: [176, 70, 42], skin: [28, 44, 66], hair: 14, skill: 'Speed and stealth', trait: 'Light-footed: quiet and quick',
    flaw: 'Reckless: frets when kept inside', tool: 'Lockpick set',
    st: { spd: 5, str: 2, stl: 5, luck: 3, cook: 1, med: 1, res: 2, noise: 1 }, b: { h: 1.0, w: 0.86, hair: 'pony', acc: 'wind' } },
  toby: { name: 'Tobias "Toby" Adeyemi', short: 'Toby', age: 9, role: 'quiet child with a drawing pad',
    bio: 'Draws what he sees, and sometimes what he hopes. The second kind uses more orange.',
    hue: [26, 92, 54], skin: [24, 46, 34], hair: 10, skill: 'Fits through tiny gaps', trait: 'Lifts everyone just by being there',
    flaw: 'Fragile and easily scared', tool: 'Crayons',
    st: { spd: 3, str: 1, stl: 4, luck: 4, cook: 1, med: 1, res: 2, noise: 1 }, b: { h: 0.66, w: 0.78, hair: 'hat', acc: 'hat' } },
  bea: { name: 'Granny Beatrix Holloway', short: 'Granny', age: 76, role: 'sharp-tongued former cook',
    bio: 'Fed a canteen of two hundred on a budget of nothing. Considers the siege a lateral move.',
    hue: [292, 46, 42], skin: [24, 30, 70], hair: 86, skill: 'Cooking: soup from almost anything', trait: "Wise: eases others' guilt",
    flaw: 'Tires quickly', tool: 'Wooden spoon',
    st: { spd: 1, str: 1, stl: 2, luck: 3, cook: 5, med: 3, res: 5, noise: 2 }, b: { h: 0.84, w: 1.05, hair: 'grey', acc: 'shawl' } },
  ravi: { name: 'Ravi Castellanos', short: 'Ravi', age: 41, role: 'former bike mechanic',
    bio: 'Can fix anything with two wheels and most things with none. Prefers to do it tomorrow.',
    hue: [136, 52, 34], skin: [26, 48, 46], hair: 12, skill: 'Scavenging luck and mechanics', trait: 'Finds extra parts',
    flaw: 'Lazy when spirits are low', tool: 'Wrench and a salvaged bicycle',
    st: { spd: 3, str: 3, stl: 3, luck: 5, cook: 2, med: 1, res: 3, noise: 3 }, b: { h: 1.06, w: 0.95, hair: 'beanie', acc: 'jacket' } },
  yara: { name: 'Yara Linde', short: 'Yara', age: 27, role: 'former radio host',
    bio: 'Used to fill three hours of air a night. Now rations her words like tinned peaches.',
    hue: [262, 58, 68], skin: [22, 40, 58], hair: 16, skill: 'Radio and negotiation', trait: 'Charming: better barter prices',
    flaw: 'Anxious: panics in raids', tool: 'Hand-cranked radio',
    st: { spd: 3, str: 2, stl: 3, luck: 3, cook: 2, med: 2, res: 1, noise: 2 }, b: { h: 0.98, w: 0.9, hair: 'bob', acc: 'sweater' } },
  pavel: { name: 'Pavel "Cog" Novak', short: 'Pavel', age: 46, role: 'gentle former factory guard',
    bio: 'Stood at a factory gate for twenty years and never once raised his voice. Has not started now.',
    hue: [218, 78, 46], skin: [20, 32, 60], hair: 30, skill: 'Strength and defense', trait: 'Protective: steadies others in raids',
    flaw: 'Noisy and heavy', tool: 'Iron pipe',
    st: { spd: 2, str: 5, stl: 1, luck: 2, cook: 2, med: 2, res: 4, noise: 5 }, b: { h: 1.16, w: 1.3, hair: 'bald', acc: 'coat' } },
  lamp: { name: 'The Lamplighter', short: 'Lamplighter', age: 0, role: 'a stranger who arrived with a lit wick', locked: true,
    bio: 'Nobody saw which stair they came up. The bulbs flicker politely when they pass.',
    hue: [52, 90, 62], skin: [30, 20, 55], hair: 0, skill: 'Something different every winter', trait: 'Odd gifts, chosen by the night',
    flaw: 'Odd burdens, too', tool: 'A long brass pole',
    st: { spd: 3, str: 3, stl: 3, luck: 3, cook: 3, med: 3, res: 3, noise: 3 }, b: { h: 1.1, w: 0.9, hair: 'hood', acc: 'cloak' } }
};
const SURV_ORDER = ['marta', 'dov', 'ines', 'toby', 'bea', 'ravi', 'yara', 'pavel', 'lamp'];
const VARIANT_SHIFT = [0, -22, 24, 48];       // four palette schemes per survivor (hue offsets)
const VARIANT_COST = [0, 20, 20, 35];
const DEFAULT_GROUP = ['marta', 'dov', 'ines', 'toby'];

/* --- Items: n = name, v = barter value, cat = category, ic = icon key --- */
const ITEMS = {
  can: { n: 'Canned food', v: 6, cat: 'food' }, raw: { n: 'Raw vegetables', v: 3, cat: 'food' },
  soup: { n: 'Soup', v: 4, cat: 'food', home: true }, egg: { n: 'Pigeon egg', v: 3, cat: 'food' },
  water: { n: 'Clean water', v: 3, cat: 'water' }, dirty: { n: 'Rain water', v: 1, cat: 'water' },
  fuel: { n: 'Fuel', v: 5, cat: 'mat' }, wood: { n: 'Wood', v: 2, cat: 'mat' }, parts: { n: 'Parts', v: 4, cat: 'mat' },
  cloth: { n: 'Cloth', v: 3, cat: 'mat' }, herbs: { n: 'Herbs', v: 3, cat: 'food' }, tea: { n: 'Tea', v: 4, cat: 'food' },
  meds: { n: 'Medicine', v: 10, cat: 'med' }, bandage: { n: 'Bandages', v: 6, cat: 'med' },
  antibio: { n: 'Antibiotics', v: 14, cat: 'med' }, syrup: { n: 'Cough syrup', v: 7, cat: 'med' },
  battery: { n: 'Battery', v: 5, cat: 'tool' }, matches: { n: 'Matches', v: 3, cat: 'tool' }, candle: { n: 'Candle', v: 4, cat: 'tool' },
  bottle: { n: 'Empty bottle', v: 1, cat: 'tool', thrown: true }, brick: { n: 'Loose brick', v: 0, cat: 'tool', thrown: true },
  pan: { n: 'Dented pan', v: 3, cat: 'tool' }, book: { n: 'Book', v: 4, cat: 'joy' }, toy: { n: 'Wind-up toy', v: 6, cat: 'joy' },
  coat: { n: 'Warm clothes', v: 9, cat: 'joy' }, musicbox: { n: 'Music box', v: 15, cat: 'joy', unique: true },
  keepsake: { n: 'Keepsake', v: 0, cat: 'joy', unique: true }, crate: { n: 'Supply crate', v: 8, cat: 'mat' }
};
const START_STOCK = { can: 4, raw: 4, water: 6, wood: 5, parts: 2, cloth: 2, fuel: 2, bandage: 1, matches: 3, battery: 2, bottle: 2, candle: 1 };

/* --- Recipes (at: station, cost, out) --- */
const RECIPES = [
  { id: 'soup', n: 'Cook soup', at: 'stove', cost: { raw: 1, water: 1 }, out: { soup: 2 }, d: 'Two bowls. Granny makes three.' },
  { id: 'tea', n: 'Brew tea', at: 'stove', cost: { herbs: 1, water: 1 }, out: { tea: 2 }, d: 'Warm hands, lighter hearts.' },
  { id: 'boil', n: 'Boil rain water', at: 'stove', cost: { dirty: 2, fuel: 1 }, out: { water: 2 }, d: 'Slow, but safe to drink.' },
  { id: 'bandage', n: 'Cut bandages', at: 'workbench', cost: { cloth: 1 }, out: { bandage: 1 }, d: 'Clean strips for wounds.' },
  { id: 'candle', n: 'Pour a candle', at: 'workbench', cost: { cloth: 1, fuel: 1 }, out: { candle: 1 }, d: 'A small light to keep.' },
  { id: 'coat', n: 'Sew warm clothes', at: 'workbench', cost: { cloth: 3 }, out: { coat: 1 }, d: 'Goes to whoever is coldest.' },
  { id: 'battery', n: 'Rebuild a battery', at: 'workbench', cost: { parts: 2 }, out: { battery: 1 }, d: 'Light for the night road.' },
  { id: 'trap', n: 'String tripwire cans', at: 'workbench', cost: { parts: 1 }, out: {}, trap: 1, d: 'A cheap alarm by the door.' }
];

/* --- Shelter upgrades: fixed spot on the cutaway (f = floor index, x) --- */
const UPGRADES = {
  workbench: { n: 'Workbench', f: 3, x: 520, start: true, d: 'Craft and build.' },
  stove: { n: 'Stove', f: 3, x: 360, start: true, d: 'Cook, boil, brew.' },
  bed1: { n: 'Bed', f: 1, x: 190, start: true, d: 'Proper rest.' },
  bed2: { n: 'Second bed', f: 1, x: 280, cost: { wood: 3, cloth: 2 }, d: 'More sleepers rest well.' },
  filter: { n: 'Water filter', f: 4, x: 380, cost: { parts: 2, wood: 1 }, d: 'Cleans rain water, no fuel.' },
  raincatcher: { n: 'Rain catcher', f: 0, x: 200, cost: { wood: 2, cloth: 1 }, d: 'Collects rain and snow.' },
  radio: { n: 'Radio', f: 2, x: 330, cost: { parts: 3 }, d: 'News, rumors, a lullaby.' },
  heater: { n: 'Heater', f: 3, x: 680, cost: { parts: 2, wood: 2 }, d: 'Burns fuel or wood for warmth.' },
  medcorner: { n: 'Medical corner', f: 1, x: 380, cost: { wood: 2, cloth: 2 }, d: 'Treatment works better.' },
  garden: { n: 'Garden box', f: 0, x: 360, cost: { wood: 3 }, d: 'Herbs and greens, slowly.' },
  coop: { n: 'Pigeon coop', f: 0, x: 640, cost: { wood: 2, parts: 1 }, d: 'An egg now and then.' },
  cards: { n: 'Card table', f: 2, x: 430, cost: { wood: 1 }, d: 'An evening of bad bluffs.' },
  firebarrel: { n: 'Fire barrel', f: 0, x: 760, cost: { parts: 1, wood: 1 }, d: 'Warmth on the roof. Draws eyes at night.' }
};
const BARRICADE_COST = { wood: 2 };
const BARRICADE_MAX = 4;

/* --- Scavenging locations --- */
const LOCS = {
  pharmacy: { n: 'Corner Pharmacy', d: 'Shuttered shelves, a patrol that keeps time.', w: 1900, floors: 3, danger: 1, dark: 0.84, cont: 8,
    loot: { meds: 4, bandage: 5, syrup: 3, antibio: 1, cloth: 2, can: 1, battery: 2, bottle: 2 }, npcs: ['patrol'], guarantee: 'bandage', bg: 'shop' },
  market: { n: 'Market Square', d: 'Open stalls under a watched sky. Traders after dark.', w: 2600, floors: 3, danger: 2, dark: 0.8, cont: 10,
    loot: { can: 5, raw: 6, water: 3, herbs: 2, bottle: 2, cloth: 2, matches: 2, pan: 1 }, npcs: ['civ', 'scav', 'dog'], guarantee: 'raw', snipers: 1, bg: 'open' },
  metro: { n: 'Flooded Metro', d: 'Black water on the platforms. Sound carries.', w: 2800, floors: 3, danger: 3, dark: 0.9, cont: 10,
    loot: { parts: 5, battery: 3, fuel: 4, can: 2, wood: 2, bottle: 2, dirty: 2 }, npcs: ['scav', 'scav', 'dog'], guarantee: 'parts', water: true, bg: 'tunnel' },
  school: { n: 'The School', d: 'Small chairs, a cold gym, gaps only a child fits through.', w: 2600, floors: 4, danger: 2, dark: 0.84, cont: 11,
    loot: { book: 3, toy: 2, cloth: 4, wood: 5, can: 2, matches: 2, candle: 2, raw: 1 }, npcs: ['patrol', 'civ'], guarantee: 'wood', gaps: 2, bg: 'hall' },
  apartments: { n: 'Collapsed Block', d: 'Half a building. Somebody else\'s photographs.', w: 2300, floors: 4, danger: 2, dark: 0.84, cont: 11,
    loot: { can: 3, raw: 2, cloth: 3, wood: 3, book: 2, toy: 1, coat: 1, matches: 2, water: 2, pan: 1, bottle: 2 }, npcs: ['scav', 'civ', 'dog'], guarantee: 'can', gaps: 1, partial: true, bg: 'flats' },
  hospital: { n: 'Hospital Wing', d: 'The medicine is real. So are the guards.', w: 3000, floors: 4, danger: 4, dark: 0.86, cont: 12,
    loot: { meds: 5, antibio: 3, bandage: 4, syrup: 3, cloth: 2, battery: 2, water: 2 }, npcs: ['patrol', 'patrol', 'scav'], guarantee: 'meds', bg: 'hall' },
  church: { n: 'Church and Bell Tower', d: 'Wax, wood, and a long ladder to the bell.', w: 2200, floors: 4, danger: 3, dark: 0.86, cont: 9,
    loot: { candle: 5, matches: 4, cloth: 3, wood: 4, can: 2, herbs: 2, book: 1 }, npcs: ['civ', 'patrol'], guarantee: 'candle', tower: true, bg: 'nave' },
  bridge: { n: 'Broken Bridge', d: 'A watched crossing. Count the gaps between glances.', w: 2800, floors: 3, danger: 5, dark: 0.82, cont: 8,
    loot: { fuel: 5, parts: 4, can: 3, battery: 2, wood: 2, coat: 1 }, npcs: ['patrol', 'dog'], guarantee: 'fuel', snipers: 3, bg: 'open' }
};
const LOC_ORDER = ['pharmacy', 'market', 'metro', 'school', 'apartments', 'hospital', 'church', 'bridge'];

/* --- NPC archetypes. Speeds obey the same movement rules as the player. --- */
const NPCT = {
  patrol: { n: 'Grey Coat', spd: 60, chase: 124, vis: 235, hear: 1.0, dmg: 22, hostile: true, nerve: 9, h: 1.08 },
  scav: { n: 'Magpie', spd: 66, chase: 128, vis: 195, hear: 1.1, dmg: 12, hostile: true, nerve: 2, steals: true, h: 1.0 },
  raider: { n: 'Magpie raider', spd: 64, chase: 120, vis: 200, hear: 1.0, dmg: 14, hostile: true, nerve: 3, steals: true, h: 1.04 },
  dog: { n: 'Stray dog', spd: 80, chase: 138, vis: 130, hear: 1.9, dmg: 7, hostile: true, nerve: 1, h: 0.5 },
  civ: { n: 'Stranger', spd: 50, chase: 60, vis: 150, hear: 0.8, dmg: 0, hostile: false, nerve: 0, h: 0.98 },
  cat: { n: 'Stray cat', spd: 92, chase: 92, vis: 0, hear: 0, dmg: 0, hostile: false, nerve: 0, h: 0.3 },
  census: { n: 'List-keeper', spd: 56, chase: 110, vis: 210, hear: 0.8, dmg: 0, hostile: true, nerve: 9, h: 1.06 }
};
const NPC_PERSONA = ['weary', 'jumpy', 'stubborn', 'curious', 'bored'];   // tweaks timers and lines

/* --- Hazards: warn = base telegraph seconds (scaled by difficulty) --- */
const HAZARDS = {
  tremor: { n: 'Shelling tremor', warn: 2.6, dmg: 14, d: 'Dust falls. A room may become unusable.' },
  fire: { n: 'Fire', warn: 3.5, dmg: 10, d: 'Douse it with water before it spreads.' },
  flood: { n: 'Cellar flood', warn: 4, dmg: 0, d: 'Bail the cellar or the damp sets in.' },
  gas: { n: 'Gas leak', warn: 20, dmg: 9, d: 'Fix the stove before anything sparks.' },
  stair: { n: 'Collapsing stair', warn: 3, dmg: 10, d: 'A stair gives way. Repair with wood.' },
  coldsnap: { n: 'Cold snap', warn: 0, dmg: 0, d: 'Fuel and blankets, or shivering.' },
  raid: { n: 'Night raiders', warn: 6, dmg: 14, d: 'Barricade, hide, hold, or bargain.' },
  sniper: { n: 'Sniper corridor', warn: 0.9, dmg: 28, d: 'Cross only in the safe window.' },
  disease: { n: 'Illness', warn: 0, dmg: 8, d: 'Bad water, damp, untreated wounds.' },
  collapse: { n: 'Collapsing platform', warn: 3, dmg: 18, d: 'Run when the floor starts to speak.' },
  draft: { n: 'Draft', warn: 3, dmg: 0, d: 'A gust that hunts small flames.' }
};

/* --- Stackable modifiers --- */
const MODS = {
  snow: { n: 'Heavy Snow', d: 'Colder days, slower roads, more rain water.' },
  fog: { n: 'Fog Night', d: 'Everyone sees less. Including them.' },
  blackout: { n: 'Blackout', d: 'No lit lamps anywhere. Batteries drain faster.' },
  water: { n: 'Scarce Water', d: 'Half the water from every source.' },
  noisy: { n: 'Noisy Floors', d: 'Every step carries further.' },
  sleepers: { n: 'Light Sleepers', d: 'Patrols hear better and wake faster.' },
  double: { n: 'Double Speed', d: 'Days and nights pass twice as fast.' },
  winter: { n: 'Long Winter', d: 'The thaw never quite arrives.' },
  friends: { n: 'Friendly Neighbors', d: 'More visitors bring help.' }
};
const MOD_ORDER = ['snow', 'fog', 'blackout', 'water', 'noisy', 'sleepers', 'double', 'winter', 'friends'];

/* --- Story chapters --- */
const CHAPTERS = [
  { id: 1, t: 'The First Candle', days: [1, 5], sites: ['pharmacy'], set: 'shutter', setSite: 'pharmacy', cut: 'ch1', blurb: 'A stuck shutter, a patrol, a first choice.' },
  { id: 2, t: 'Thin Soup', days: [6, 12], sites: ['market', 'metro'], set: 'platform', setSite: 'metro', cut: 'ch2', blurb: 'Hunger, trade, and a platform that will not hold.' },
  { id: 3, t: 'The Long Cold', days: [13, 19], sites: ['school', 'apartments'], set: 'homefire', setSite: 'school', cut: 'ch3', blurb: 'Winter, a fuel crisis, a fire while you are away.' },
  { id: 4, t: 'Quiet Hands', days: [20, 26], sites: ['hospital'], set: 'search', setSite: null, cut: 'ch4', blurb: 'Illness, and a gang that searches every room.' },
  { id: 5, t: 'The Thaw', days: [27, 30], sites: ['church', 'bridge'], set: 'crossing', setSite: 'bridge', cut: 'ch5', blurb: 'A last crossing. Silence, or a signal.' }
];

/* --- Cutscene scripts: panels of [speaker id or 'narr', line] --- */
const CUTS = {
  ch1: [['narr', 'Greywater. The siege is old enough to have habits.', 'city'], ['narr', 'Curfew at six. The Grey Coats walk the avenues with lamps. The Magpies take the alleys.', 'coats'],
        ['marta', 'Four doors on this landing. One candle. We share both.'],
        ['dov', 'I can board the windows. I cannot board the cold.'], ['toby', '(draws a small orange sun on the wall)']],
  ch2: [['narr', 'The cupboards learned to echo.', 'candle'], ['bea', "Today's soup is called 'Optimism'. It is mostly water."],
        ['ines', 'The market trades after dark. The metro is flooded, not empty.'], ['narr', 'They went down where the trains used to breathe.', 'magpies']],
  ch3: [['narr', 'The cold came in without knocking.', 'snow'], ['dov', 'We burn the chairs last. A person should be able to sit.'],
        ['yara', 'The radio says help is coming. The radio says many things.'], ['narr', 'That night, something at home began to glow.', 'candle']],
  ch4: [['narr', 'Coughing on every floor. Boots on the stairs.', 'coats'], ['narr', 'The Grey Coats are counting again. Every name they find goes on a list.', 'list'],
        ['pavel', 'They will search each room. Stay small. Stay kind.'],
        ['marta', 'Quiet hands, everyone. Quiet hands.'], ['narr', 'The building held its breath with them.', 'building']],
  ch5: [['narr', 'Meltwater in the gutters. A rumor with a date on it.', 'thaw'], ['ravi', 'The bell tower can be seen from the whole east side.'],
        ['ines', 'A signal could bring help. Or eyes.'], ['narr', 'One crossing left. Then the choice.', 'river']],
  /* The prologue: who you are, and who you are hiding from. Also played from "The Story So Far" on the title screen. */
  intro: [['narr', 'Greywater is a river city. Two winters ago an army dug in on the far bank. It has not moved since.', 'city'],
          ['narr', 'The shells come from over the river. So do the long guns: snipers who watch the bridges, and any window that shows a light.', 'river'],
          ['narr', 'On this side, the streets belong to the Grey Coats, the curfew wardens. After six, anyone outside is a looter in their book.', 'coats'],
          ['narr', 'They keep lists. People on the lists are taken to the work brigades. Nobody from the brigades has written home.', 'list'],
          ['narr', 'Then there are the Magpies: gangs who strip empty buildings, and full ones if the door is weak. And there is the cold, which takes anyone.', 'magpies'],
          ['narr', 'We are not soldiers. We are neighbours from the sixth floor of the Ashen Windows building. A nurse, a carpenter, a courier, a boy who draws.', 'building'],
          ['marta', 'So we stay quiet. At night we go out for what we need, we keep out of every light, and we are home before dawn.'],
          ['dov', 'And one candle stays lit on the landing, so whoever is out there can find the way back.'],
          ['narr', 'The ceasefire is a rumour. The winter is not. This is how we got through it.', 'candle'],
          ['marta', 'Stay close to the candle. I am going to the pharmacy.']],
  stinger: [['narr', 'Spring, some weeks later.', 'thaw'], ['toby', '(has drawn every window on the street. Each one is a different color.)'],
            ['bea', "Today's soup is called 'Seconds'."]]
};

/* --- Endings --- */
const ENDINGS = {
  everyone: { t: 'Everyone Home', d: 'The ceasefire holds. Nobody was lost and nobody was left. One by one the windows of the whole building light up, each in its own color.' },
  signal: { t: 'The Signal', d: 'The bell answered across the river. By morning there were lanterns on the far bank, and strangers carrying bread.' },
  silence: { t: 'The Quiet Morning', d: 'They kept the dark and it kept them. At dawn the guns simply did not start. Somebody laughed, then apologized for it.' },
  few: { t: 'Those Who Remain', d: 'The ceasefire arrived to a smaller table. They set every place anyway.' },
  alone: { t: 'One Window', d: 'A single lit window at dawn. It was enough to be seen by.' },
  cold: { t: 'Hard Winter', d: 'They lived, and they know what it cost. The color returns slowly, the way feeling returns to cold hands.' },
  collapse: { t: 'The Landing Falls Quiet', d: 'The candle burned down on an empty landing. Someone will find the drawings on the wall, and know that people were kind here.' }
};

/* --- Wardrobe: clothing and keepsakes (cosmetic, minor stat) --- */
const CLOTHES = {
  wool: { n: 'Wool scarf', cost: 15, fx: 'cold', d: 'Loses warmth more slowly.' },
  coin: { n: 'Lucky coin', cost: 20, fx: 'luck', d: 'A little more luck in drawers.' },
  glasses: { n: 'Mended glasses', cost: 15, fx: 'see', d: 'Spots trouble a moment sooner.' },
  softsoles: { n: 'Felt soles', cost: 25, fx: 'quiet', d: 'Softer steps.' },
  mitts: { n: 'Knitted mittens', cost: 10, fx: 'cold', d: 'Warm hands, steadier work.' },
  ribbon: { n: 'Bright ribbon', cost: 10, fx: 'morale', d: 'A small defiance. Morale sinks more slowly.' }
};
const SKINS = {
  plain: { n: 'Ashen Windows', cost: 0, pat: 0 }, attic: { n: 'Winter Attic', cost: 30, pat: 1 },
  bunker: { n: 'Basement Bunker', cost: 30, pat: 2 }, green: { n: 'Rooftop Greenhouse', cost: 40, pat: 3 }, library: { n: 'Old Library', cost: 40, pat: 4 }
};
const PERKS = {
  pantry: { n: 'Stocked pantry', cost: 25, d: 'Start with 3 extra tins.' },
  kindling: { n: 'Dry kindling', cost: 20, d: 'Start with 4 extra wood.' },
  kit: { n: 'Nurse\'s kit', cost: 30, d: 'Start with medicine and bandages.' },
  catfriend: { n: 'An old friend', cost: 35, d: 'The cat is already on the stairs.' }
};

/* --- Achievements, shown as Keepsakes --- */
const ACH = {
  lastcandle: { n: 'Last Candle', d: 'Keep a flame alive until dawn.' }, soup6: { n: 'Soup for Six', d: 'Serve soup at six shared meals.' },
  quiethands: { n: 'Quiet Hands', d: 'Finish a sortie without being spotted.' }, neighbor: { n: 'Neighbor', d: 'Help someone at the door.' },
  thaw: { n: 'Thaw', d: 'Reach the ceasefire.' }, spoons: { n: 'Keeper of Spoons', d: 'Carry home a full pack.' },
  firstnight: { n: 'First Night', d: 'Come home from the first sortie.' }, everyone: { n: 'Everyone Home', d: 'Reach the ceasefire with nobody lost.' },
  whiskers: { n: 'Whiskers', d: 'Be adopted by a cat.' }, bloom: { n: 'Bloom', d: 'See the window plant flower.' },
  tune: { n: 'Old Tune', d: 'Wind the music box.' }, carried: { n: 'Carried Together', d: 'Finish Lantern Relay without a drop.' },
  clearsignal: { n: 'Clear Signal', d: 'Send the signal without a retry.' }, notlisted: { n: 'Not on the List', d: 'A perfect Census Night.' },
  oldphoto: { n: 'Old Photograph', d: 'Find all nine keepsakes.' }, ledger: { n: 'In the Black', d: 'Balance the Ledger Winter.' },
  toypiano: { n: 'Toy Piano', d: 'Find the hidden tune.' }, sandwich: { n: 'Dancing Sandwich', d: 'Check the fridge. Twice.' },
  doorheld: { n: 'The Door Held', d: 'Survive Hold the Door.' }, lamplighter: { n: 'A Lit Wick', d: 'Someone new on the stairs.' }
};

const AWARDS = ['Most Likely to Hum', 'Keeper of Spoons', 'Softest Footsteps', 'Best Bad Joke', 'Warmest Hands', 'First Awake',
  'Last to Complain', 'Finder of Odd Socks', 'Patron of the Cat', 'Stirrer of Soup', 'Counter of Stairs', 'Mender of Things'];
const SOUPS = ['Optimism', 'Yesterday, Reheated', 'Three Onions and a Rumor', 'Boot Leather Surprise (no boots)', 'Grey Day Broth',
  'Whatever That Was', 'The Good Tin', 'Seconds', 'Patience', 'Carrot, Singular', 'Sunday (on a Tuesday)', 'Stone Soup, Hold the Stone'];

/* --- Diary lines by context tag (the narrator). At least 40, all original. --- */
const DIARY = {
  first: ['First night out. The streets are the same streets. That is the strange part.',
          'We lit one candle and agreed not to call it the last one.'],
  quiet: ['Nothing happened today. We are learning to be grateful for nothing.',
          'A quiet night. Dov snored in three different keys.',
          'Found three spoons. Morale is a spoon-based economy.',
          'The mouse in the cellar has updated its sign. We respect its process.'],
  loss: ['One chair is empty. Nobody moved it. Nobody will.',
         'We said the name out loud at supper. It helped a little. It should not have to.'],
  leave: ['The door closed softly. That is how you know it was not anger.', 'A coat is gone from the hook. The hook looks wrong.'],
  ret: ['A knock we knew. Some news is just a person standing in a doorway.', 'They came back thinner and with a story. We traded soup for it.'],
  kind: ['We gave what we could not spare. The room felt larger afterwards.',
         'Shared the tin. Hunger is lighter when you carry it in a group.',
         'A stranger said thank you like it was a thing they had been saving.'],
  hard: ['We closed the door. The door did nothing wrong. We keep saying that.',
         'There are choices that do not get smaller when you look away.',
         'Nobody argued. That was the worst of it.'],
  theft: ['Things are missing from the shelf. We counted twice, as if counting were a lock.',
          'They took the food and left the photographs. Even thieves have rules.'],
  raid: ['Boots on the stairs last night. The barricade spoke for us.',
         'They rattled the door until dawn got bored of them.'],
  cold: ['Breath shows indoors now. Toby says we are all small chimneys.',
         'The cold has opinions about everything. Mostly about fingers.',
         'We burned a table leg. The table took it well.'],
  hungry: ['Supper was a discussion about supper.', 'Granny salted the water and called it a first course.'],
  sick: ['The cough moves from room to room like a rumor.', 'Fever is a kind of weather. We wait for it to pass.'],
  soup: ["Tonight's soup had a name and very little else.", 'Second bowls for everyone. We behaved as though it were ordinary.'],
  cat: ['The cat has decided we are acceptable. We are trying to deserve it.', 'The cat brought a button. We praised it as if it were bread.'],
  toby: ['Toby drew the stairwell with everyone in it. He used every crayon.', 'There is a new drawing by the stairs. An arrow, a door, a small sun.'],
  fire: ['Smoke in the wallpaper. We saved what we could carry and each other first.'],
  snow: ['Snow on the sills. It makes the ruins look forgiven.', 'The city is very quiet under snow, like a held breath.'],
  rumor: ['The radio says thirty days. The radio has said many things. We wrote the number on the wall anyway.',
          'A date. An actual date. Nobody slept; it was the good kind of not sleeping.'],
  thaw: ['Meltwater in the gutters. It sounds like applause from very far away.', 'Granny opened a window today. On purpose.'],
  win: ['The guns did not start this morning. We waited an hour to be sure, then made tea.'],
  generic: ['Counted the tins. Then counted each other. The second number matters more.',
            'Yara read the weather: overcast, with a chance of overcast.',
            'Dov fixed the third stair. It now creaks in tune.',
            'We played cards for buttons. Pavel is a wealthy man.',
            'Somebody hummed while cooking. Nobody mentioned it, in case it stopped.',
            'The wallpaper has a pattern of small boats. Today that felt like a promise.',
            'Ines says the city sounds different at night now. Like a shop after closing.',
            'Marta checked every forehead twice. It is how she says goodnight.']
};
const RADIO = [
  { t: 'Static. A voice counts something slowly, then stops.', m: -1 },
  { t: 'Weather report: overcast, with a chance of overcast.', m: 2, tag: 'gag' },
  { t: 'A lullaby with half its notes missing. Everyone listens to the gaps.', m: 6 },
  { t: 'Rumor: talks at the river crossing. "Thirty days," someone says.', m: 5, rumor: true },
  { t: 'A list of streets to avoid tonight. Yours is not on it.', m: 3, calm: true },
  { t: 'A list of streets to avoid tonight. Yours is the third.', m: -3, warn: true },
  { t: 'An old dance tune. Granny taps one finger exactly on the beat.', m: 5 },
  { t: 'Someone reads recipes from a peacetime cookbook. It is unbearable and nobody turns it off.', m: 1 },
  { t: 'Cold front tonight. "Wear everything," the voice advises.', m: -1, cold: true },
  { t: 'A child recites the alphabet for a missing-persons hour. Marta closes her eyes.', m: -2 }
];
const TIPS = ['Crouch to soften your steps. The noise meter never lies.', 'A flashlight shows the way. It also shows you.',
  'Thrown bottles are questions. Patrols go to find the answer.', 'Cones of attention glow brighter as suspicion grows.',
  'Color is life. Feed it, warm it, keep it company.', 'Jump over squeaky boards and tripwire cans.',
  'The plant on the sill blooms when the group is well.', 'Granny stretches every pot of soup by one bowl.',
  'A watched door is a stronger door. Assign a guard before dusk.', 'Hide spots hold one person. Choose early.',
  'Dogs want food more than they want you.', 'The red glint counts time. Cross when it looks away.',
  'Rain water must be filtered or boiled before drinking.', 'A hot stove, a card game, a tune: small things carry mornings.'];

/* --- Home chatter by mood (short, original bubbles) --- */
const CHAT = {
  hungry: ['My stomach is writing letters.', 'Is it supper yet? Was it ever?', 'I dreamed of bread. It was rude to wake.'],
  cold: ['I can see my own thoughts.', 'My fingers have resigned.', 'Who left the winter open?'],
  tired: ['Just resting my eyes. For a week.', 'The stairs got longer.'],
  sick: ['*cough* It is nothing. *cough*', 'I am fine. The room is spinning politely.'],
  low: ['What is the point of counting days.', 'I am here. Mostly.'],
  comfort: ['Sit by me a moment.', 'You did well today.', 'We are still here. That counts.', 'Here, take my blanket corner.'],
  idle: ['Overcast, with a chance of overcast.', 'Dov, the stair is singing again.', 'Has anyone seen the good spoon?',
         'Pavel owes me eleven buttons.', 'The mouse changed its sign.', 'I named the draft. It is called Gerald.'],
  hopeful: ['I heard a bird. An actual bird.', 'Thirty days. I can count to thirty.', 'It smells like soup. Real soup.'],
  work: ['Nearly there.', 'Hold this. No, the other this.', 'Measure twice, complain once.']
};
const NPC_LINES = {
  patrolSusp: ['Hm?', 'Who is there?', 'Something moved.', 'Curfew was at six. Who is out?'], patrolLost: ['Rats. Must be.', 'Nothing. Again.', 'Cold makes you hear things.'],
  patrolSee: ['You! Stop!', 'Hey!', 'There!', 'Curfew! Stand still!'], scavSee: ['That pack looks heavy.', 'Drop it!', 'Mine now.', 'Finders keepers.'],
  civBeg: ['Please. Anything to eat?', 'Do you have a bandage?', 'I have not seen bread in a week.'],
  civTrade: ['I trade fair. Mostly.', 'Got tins? I have matches.', 'Looking for cloth.'], dog: ['Wuf.', 'Grrr.', 'Arf!'],
  raider: ['Open up!', 'We know you are in there.', 'Just the food. Nobody gets hurt.'], cat: ['Mrrp.', 'Mew.', 'Prrrr.'],
  roam: ['Next floor.', 'Checking the stairs.', 'Moving on.', 'Upstairs, then.'],
  census: ['Census. Open the door.', 'How many live here?', 'Check the next room.', 'Names. All of them.']
};
const MOUSE_SIGNS = { calm: 'no cats pls', hazard: 'oof', raid: 'eek', good: 'nice', cold: 'brr', hungry: 'crumbs?', cat: 'rude', win: 'hooray' };

/* --- Play modes. kind selects the rule set in the scene manager. --- */
const MODES = [
  { id: 'story', n: 'Story Mode', d: 'Five chapters, thirty days. Autosaves at every dawn.', kind: 'campaign', coop: 2 },
  { id: 'endless', n: 'Endless Winter', d: 'No ceasefire. How many dawns can you count?', kind: 'campaign', coop: 2 },
  { id: 'scav', n: 'Scavenger Run', d: 'Night sorties only. Fill the pack, beat the dawn, go again.', kind: 'chain', coop: 2 },
  { id: 'watch', n: 'Co-op Night Watch', d: '2 to 4 players. Fetch the crates, carry the fallen home.', kind: 'chain', coop: 4 },
  { id: 'door', n: 'Hold the Door', d: 'Five waves of night visitors. Barricade, bargain, bang pots.', kind: 'homenight', coop: 2 },
  { id: 'candle', n: 'The Long Night', d: 'Keep the last candle lit until dawn.', kind: 'homenight', coop: 2 },
  { id: 'meal', n: 'Hot Meal', d: 'Five days, a thin pantry, and morale to feed.', kind: 'panel', coop: 1 },
  { id: 'silent', n: 'Silent Run', d: 'Three stealth courses. No tools at all.', kind: 'chain', coop: 1 },
  { id: 'daily', n: 'Daily Winter', d: "Today's seeded challenge. Same winter for everyone.", kind: 'campaign', coop: 1 },
  { id: 'workshop', n: 'Practice / Workshop', d: 'A sandbox shelter: spawn, trigger, experiment.', kind: 'sandbox', coop: 2 },
  { id: 'custom', n: 'Custom Scenario', d: 'Set the winter yourself.', kind: 'campaign', coop: 2 },
  { id: 'lantern', n: 'Lantern Relay', d: 'One lantern, roof to cellar, hand to hand.', kind: 'homenight', coop: 1, more: true },
  { id: 'ledger', n: 'Ledger Winter', d: 'Fourteen days of deals. Keep the book in the black.', kind: 'panel', coop: 1, more: true },
  { id: 'signal', n: 'Signal Run', d: 'Bridge, bell tower, radio dial. Three nights, one message.', kind: 'chain', coop: 1, more: true },
  { id: 'census', n: 'Census Night', d: 'They knock on every door. Be elsewhere.', kind: 'homenight', coop: 1, more: true },
  { id: 'hunt', n: 'Keepsake Hunt', d: 'Nine small things and the story they keep.', kind: 'homenight', coop: 1, more: true }
];
const MODE_BY_ID = {}; MODES.forEach(m => { MODE_BY_ID[m.id] = m; });

/* --- Keepsake Hunt story fragments --- */
const KEEPSAKES = [
  'A photograph: the building on the day it opened. Every balcony is level.', 'A ticket stub for a film nobody remembers the end of.',
  'A key to flat 6C. The door it fits is gone; the key is not.', "A child's mitten, mended four times in four colors of wool.",
  'A recipe card: "Sunday soup". The quantities are for twelve.', 'A pressed flower from the rooftop garden, labelled in pencil: "first one".',
  'A letter that begins "When this is over" and is otherwise blank.', 'A brass button from a tram conductor\'s coat.',
  'A drawing of the stairwell, signed by every neighbor on the landing.'
];
const RIDDLES = [
  { clue: 'Diary: "The drawer opens for the number of our windows, then stairs, then spoons." (Toby drew 4 windows, 3 stairs, 3 spoons.)', code: [4, 3, 3] },
  { clue: 'Diary: "Granny hides things behind her age, backwards, and one bell." (She is 76.)', code: [6, 7, 1] }
];

/* --- Tutorial steps for "The First Candle" --- */
const TUTORIAL = [
  { id: 'move', t: 'Move with {left}{right}. The street is dark; so are you.' },
  { id: 'light', t: '{light} toggles the flashlight. It helps you see. It helps them, too.' },
  { id: 'loot', t: 'Hold {interact} at a cabinet to search it.' },
  { id: 'climb', t: 'Stand at the stairs and press {up} to climb.' },
  { id: 'crouch', t: 'A patrol. {crouch} to crouch, and {interact} at a wardrobe to hide.' },
  { id: 'home', t: 'Enough for tonight. Go back to the street door and {interact} to head home.' }
];
