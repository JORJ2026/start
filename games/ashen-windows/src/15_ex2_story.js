
/* ==========================================================================
   SECTION 23: EXPANSION II - personal threads, new neighbors, epilogues
   Each survivor carries a small story in three beats. A beat arrives as a
   quiet moment during the day (no knock, just a person and a choice), and
   the last beat decides the line they get when the winter ends.
   ========================================================================== */
const THREADS = {
  marta: [
    { title: 'The satchel', text: 'Marta tips out the first-aid satchel and counts. Under the gauze: a crayon drawing of a plaster, signed by a whole class. "Year three," she says. "They gave it to me when I left."',
      opts: [{ l: 'Ask her about them', fn: (run, s) => { s.addMorale(7); return 'Twenty-six names. She remembers every knee. By the end she is laughing.'; } }, { l: 'Help her repack in silence', fn: (run, s) => { s.addMorale(3); return 'You fold gauze together. It is a kind of conversation.'; } }] },
    { title: 'A list of names', text: 'Marta is writing names in the margin of the diary: the children from her school she has not heard from. "If I write them down," she says, "someone is still keeping count."',
      opts: [{ l: 'Give her a candle to write by', need: { candle: 1 }, fn: (run, s) => { Run.pay(run, { candle: 1 }); s.addMorale(8); Run.humanity(run, 2); run.flags.martaList = true; return 'She writes late. In the morning the list is longer, and every name has a small tick of hope.'; } }, { l: 'Tell her to rest', fn: (run, s) => { s.fatigue = clamp(s.fatigue + 20, 0, 100); return 'She sleeps with the pencil in her hand.'; } }] },
    { title: 'Rounds', text: 'Marta stands at the door with her satchel. "Two floors down there is an old man with a cough, and a baby with a rash. I could do rounds. If we can spare anything."',
      opts: [{ l: 'Send medicine with her', need: { meds: 1 }, fn: (run, s) => { Run.pay(run, { meds: 1 }); Run.humanity(run, 7); s.addMorale(10); cb(run, 'martaThanks', 3, 5); return 'She is gone two hours. She comes back lighter, which is not about the satchel.'; }, ep: 'good' },
             { l: 'Send bandages with her', need: { bandage: 2 }, fn: (run, s) => { Run.pay(run, { bandage: 2 }); Run.humanity(run, 5); s.addMorale(8); cb(run, 'martaThanks', 3, 5); return 'Bandages and her good manner. It turns out the manner was most of it.'; }, ep: 'good' },
             { l: 'We need everything here', fn: (run, s) => { s.addMorale(-6); s.guilt += 15; return 'She nods, and hangs the satchel back on its hook, very carefully.'; }, ep: 'plain' }] }
  ],
  dov: [
    { title: 'The third tread', text: 'Dov is on his knees on the stairs, running a thumb under the third tread. "D.L., nineteen-something," he reads. "I built these stairs. I was younger than Ines."',
      opts: [{ l: 'Ask him how', fn: (run, s) => { s.addMorale(8); return 'Oak, from a barn, carried up six floors on a borrowed cart. He tells it twice. Both times are good.'; } }, { l: 'Tell him they held', fn: (run, s) => { s.addMorale(5); return '"They did," he says, patting the step like a dog.'; } }] },
    { title: 'A cradle', text: 'Dov has been measuring things with his hands. "4C is expecting. In this. A baby should have something made for it, not found."',
      opts: [{ l: 'Give him the wood (3)', need: { wood: 3 }, fn: (run, s) => { Run.pay(run, { wood: 3 }); s.addMorale(10); Run.humanity(run, 3); run.flags.cradle = true; return 'Sawdust on the landing for days. He hums in three different keys.'; } }, { l: 'We need the wood for heat', fn: (run, s) => { s.addMorale(-3); return '"Of course," he says. "Of course." He carves a spoon from a chair leg instead.'; } }] },
    { title: 'Delivery', text: 'Dov stands back from his work. "Well," he says, to nobody. "It is done. Somebody should carry it down."',
      opts: [{ l: 'Carry it down together', can: run => (run.flags.cradle ? null : 'There is only a spoon.'), fn: (run, s) => { Run.humanity(run, 6); Run.allMorale(run, 5); s.addMorale(12); cb(run, 'dovBaby', 4, 7); return 'The mother in 4C cries, which Dov had not planned for. He stands very still and lets her.'; }, ep: 'good' },
             { l: 'Admire the spoon', fn: (run, s) => { s.addMorale(4); return 'It is a fine spoon. Granny commandeers it at once.'; }, ep: 'plain' }] }
  ],
  ines: [
    { title: 'The map on the wall', text: 'Ines has drawn the city on the wallpaper in pencil: every street she ever ran. "Shortcuts," she says. "Courtyards. Which fences have holes."',
      opts: [{ l: 'Copy it into the journal', fn: (run, s) => { run.hint = run.sites[Math.floor(Math.random() * run.sites.length)]; s.addMorale(6); return 'She circles ' + LOCS[run.hint].n + ' twice. "Back way in. Trust me."'; } }, { l: 'Ask about her fastest run', fn: (run, s) => { s.addMorale(8); return 'Eleven minutes, river to station, with a wedding cake. It survived. Mostly.'; } }] },
    { title: 'The depot', text: 'Ines is pacing. "The courier depot is three streets away. My locker. My things. I could be there and back before anyone notices."',
      opts: [{ l: 'Let her go, carefully', fn: (run, s) => { s.addMorale(10); run.inesIdle = 0; s.fatigue = clamp(s.fatigue - 15, 0, 100); run.flags.depot = true; return 'Back in forty minutes, breathless and grinning, with a canvas bag held like treasure.'; } }, { l: 'Too dangerous in daylight', fn: (run, s) => { s.addMorale(-5); return 'She sits on the stairs with her knees bouncing for an hour.'; } }] },
    { title: 'Letters', text: run => (run.flags.depot ? 'The canvas bag is full of letters, sealed, never delivered. "Some are for this street," Ines says. "Some are for this building."' : 'Ines has been reading old envelopes she found under the doormat. "Nobody delivers anything anymore," she says. "Somebody should."'),
      opts: [{ l: 'Deliver the ones for this building', fn: (run, s) => { Run.humanity(run, 5); Run.allMorale(run, 4); s.addMorale(10); return 'Doors open all the way down the stairwell. People read standing up, in their doorways, not caring who sees.'; }, ep: 'good' },
             { l: 'Keep them safe for after', fn: (run, s) => { s.addMorale(3); return 'She ties the bundle with string and puts it under her pillow.'; }, ep: 'plain' }] }
  ],
  toby: [
    { title: 'Everyone, in color', text: 'Toby is drawing the group. He holds up the crayon box. "What color are you? Everybody has one. I can tell."',
      opts: [{ l: 'Tell him', fn: run => { Run.allMorale(run, 3); return 'He gets every one right without being told. Nobody asks how.'; } }, { l: 'Ask him to guess yours', fn: (run, s) => { s.addMorale(5); return 'He considers you for a long time and picks the brightest crayon in the box.'; } }] },
    { title: 'The orange crayon', text: 'The orange crayon has snapped in two. Toby is trying very hard not to mind. "It is fine," he says. "Orange is mostly for suns."',
      opts: [{ l: 'Melt a candle into a new one', need: { candle: 1 }, fn: (run, s) => { Run.pay(run, { candle: 1 }); s.addMorale(14); s.flare = 1; return 'Wax and the two halves, warmed on the stove. It comes out lumpy and perfect.'; } }, { l: 'Tape it back together', fn: (run, s) => { s.addMorale(4); return 'It wobbles when he draws. He says that makes the suns look warmer.'; } }] },
    { title: 'The window', text: 'Toby has drawn a sun with all of you underneath it. "Can it go in the window? So the street can see we are here?"',
      opts: [{ l: 'Tape it to the glass', fn: (run, s) => { Run.humanity(run, 4); Run.allMorale(run, 6); s.addMorale(10); return 'By evening two more windows across the street have drawings in them. By the week, eleven.'; }, ep: 'good' },
             { l: 'Keep it inside, for now', fn: (run, s) => { s.addMorale(2); return 'It goes over his bed instead. He checks on it every morning.'; }, ep: 'plain' }] }
  ],
  bea: [
    { title: 'The soup book', text: 'Granny has a notebook. Every soup she has named this winter is in it, with a star rating. Most have one star. "Honesty," she says, "is the last spice."',
      opts: [{ l: 'Ask for the five-star soup', fn: (run, s) => { s.addMorale(6); return '"There is no five-star soup. There is the soup you are given." She gives it four, anyway.'; } }, { l: 'Suggest a name', fn: (run, s) => { s.addMorale(4); SOUPS.push('Your Suggestion, Overruled'); return 'She writes it down as "Your Suggestion, Overruled". It is on the menu tomorrow.'; } }] },
    { title: "Mother's bread", text: 'Granny turns the pages of a cookbook she does not need. "My mother\'s bread. Flour, salt, and a story told while it rises. We have the story."',
      opts: [{ l: 'Bake it together', need: { flour: 1, salt: 1 }, fn: (run, s) => { Run.pay(run, { flour: 1, salt: 1 }); Run.add(run, 'bread', 3); Run.allMorale(run, 6); return 'The story is about a goat and a mayor. The bread is better than the story. The story is very good.'; } }, { l: 'Another day', fn: (run, s) => { s.addMorale(-2); return '"Another day," she agrees. "I have several."'; } }] },
    { title: 'The ladle', text: 'Granny holds out her wooden ladle. "Somebody should learn properly. I will not be stirring forever, whatever Dov says."',
      opts: [{ l: 'Accept the ladle', fn: (run, s) => { run.flags.rc_stew = true; Run.allMorale(run, 5); s.addMorale(10); return 'The first lesson is mostly about not lifting the lid. The second is about patience. There are many lessons.'; }, ep: 'good' },
             { l: '"You will stir forever"', fn: (run, s) => { s.addMorale(6); return '"Flatterer," she says, and keeps the ladle, pleased.'; }, ep: 'plain' }] }
  ],
  ravi: [
    { title: 'The bicycle', text: 'Ravi has the bicycle upside down on the landing and is spinning the wheel, listening. "It is telling me something. I think it is telling me to oil it."',
      opts: [{ l: 'Hold the wheel for him', fn: (run, s) => { s.addMorale(6); return 'Two hours of happy muttering. The bicycle is now, he claims, "faster than before the war".'; } }, { l: 'Ask what it says now', fn: (run, s) => { s.addMorale(4); return '"It says thank you," he says, completely serious.'; } }] },
    { title: 'A dynamo', text: 'Ravi sketches on a paper bag. "Wheel, belt, a little dynamo. Someone pedals, we charge batteries. Nobody walks in the dark."',
      opts: [{ l: 'Give him the parts (2)', need: { parts: 2 }, fn: (run, s) => { Run.pay(run, { parts: 2 }); run.flags.dynamo = true; Run.add(run, 'battery', 1); s.addMorale(10); return 'It works on the third try. Toby pedals for an hour and declares himself a power station.'; } }, { l: 'Parts are too precious', fn: (run, s) => { s.addMorale(-3); return 'He folds the paper bag into his pocket. "Later, then."'; } }] },
    { title: 'Oranges', text: 'Ravi is quiet for once. "When this ends I will open the shop again. Bicycles and oranges. People always laughed. They always came back."',
      opts: [{ l: 'Paint the shop sign together', fn: (run, s) => { Run.allMorale(run, 4); s.addMorale(12); return 'On a board from the cellar: RAVI\'S - BICYCLES & ORANGES. Toby adds a sun. It hangs by the door until spring.'; }, ep: 'good' },
             { l: '"Save me an orange"', fn: (run, s) => { s.addMorale(6); return '"The first one," he promises.'; }, ep: 'plain' }] }
  ],
  yara: [
    { title: 'Dead air', text: 'Yara is talking to the wall in her radio voice. "...and that was the weather, which was overcast..." She stops. "I just need an audience. Even a small one."',
      opts: [{ l: 'Be her audience', fn: (run, s) => { s.addMorale(9); return 'She does twenty minutes, with requests. You request "something cheerful". She plays the kettle.'; } }, { l: 'Fetch the others', fn: run => { Run.allMorale(run, 4); return 'Everyone on the stairs, wrapped in blankets. She does not stammer once.'; } }] },
    { title: 'A broadcast', text: 'Yara has opened the back of the radio. "If it can listen, it can almost talk. A small broadcast. Just for this building. Just so people know someone is awake."',
      opts: [{ l: 'Help her rig it', need: { parts: 1 }, fn: (run, s) => { Run.pay(run, { parts: 1 }); Run.humanity(run, 4); s.addMorale(10); run.flags.broadcast = true; cb(run, 'neighborGift', 2, 4); return 'Her voice comes out of every radio in the stairwell. Mr. Halloran calls in the weather. Overcast.'; } }, { l: 'It might draw attention', fn: (run, s) => { s.addMorale(-4); return 'She closes the back of the radio. "You are probably right," she says, which is worse.'; } }] },
    { title: 'Sign-off', text: 'Yara wants to do one full show, beginning to end, the way she used to. "Opening music, news, a story, sign-off. Will you all listen?"',
      opts: [{ l: 'Everyone listens', fn: (run, s) => { Run.allMorale(run, 8); s.addMorale(12); s.flare = 1; Snd.sfx('box'); return '"This is Yara Linde, and you are still here." Nobody claps, because it is radio. Everybody claps.'; }, ep: 'good' },
             { l: 'Maybe tomorrow', fn: (run, s) => { s.addMorale(-2); return '"Tomorrow, then. Same time, same station."'; }, ep: 'plain' }] }
  ],
  pavel: [
    { title: 'The pipe', text: 'Pavel turns his iron pipe over in his big hands. "I should say. In eleven years at the factory gate, I never hit anyone. Not once. I just stood there being large."',
      opts: [{ l: '"That is a skill"', fn: (run, s) => { s.addMorale(8); return 'He thinks about it and decides you are right. He stands a little larger.'; } }, { l: 'Ask what he would rather do', fn: (run, s) => { s.addMorale(5); return '"Carve things," he says, embarrassed. "Small things."'; } }] },
    { title: 'The drill', text: 'Pavel wants to teach everyone to brace the door properly. "Feet here. Shoulder here. Do not push. Lean. Let the floor do the work."',
      opts: [{ l: 'Run the drill', fn: (run, s) => { run.barricade = Math.min(BARRICADE_MAX, run.barricade + 1); for (const p of Run.present(run)) p.fatigue = clamp(p.fatigue - 8, 0, 100); s.addMorale(6); return 'Everyone leans on the door at once. It feels, for a moment, like the strongest thing in the city.'; } }, { l: 'Everyone is too tired', fn: (run, s) => { s.addMorale(-2); return '"Tomorrow," he rumbles. "Doors are patient."'; } }] },
    { title: 'Small animals', text: 'Pavel has a pocket full of carved animals: a cat, a pigeon, a mouse holding a sign. "For the children on the stairs. If that is not foolish."',
      opts: [{ l: 'Hand them out together', fn: (run, s) => { Run.humanity(run, 5); Run.allMorale(run, 4); s.addMorale(12); return 'A small boy on the fourth floor gets the mouse and refuses, ever, to put it down.'; }, ep: 'good' },
             { l: 'Give one to Toby', fn: (run, s) => { const t = run.surv.find(q => q.id === 'toby' && q.present); if (t) t.addMorale(10); s.addMorale(6); return t ? 'Toby gets the cat. It sleeps on his pillow beside the real one.' : 'He keeps the rest on the windowsill, in a row, keeping watch.'; }, ep: 'plain' }] }
  ]
};
/* Where everyone is afterwards: [good thread ending, plain ending] */
const EPILOGUES = {
  marta: ['Marta went back to the school in spring. Every name on her list had a tick by summer.', 'Marta keeps the satchel packed by the door, just in case.'],
  dov: ['Dov built a second cradle, and then a table, and then a bench for the courtyard.', 'Dov fixed every stair in the building, slowly, one tread at a time.'],
  ines: ['Ines delivered letters for a year, for free, and never ran out of breath.', 'Ines still runs at dawn, river to station, timing herself.'],
  toby: ['Toby\'s window sun was the first thing the relief trucks saw. A driver waved at it.', 'Toby filled three drawing pads by spring. Everyone in them is in color.'],
  bea: ['Granny Beatrix taught soup to half the street. The other half bought it.', 'Granny named one last soup "Ceasefire". It got two stars.'],
  ravi: ['RAVI\'S - BICYCLES & ORANGES opened in April. The first orange was saved for you.', 'Ravi fixed bicycles on the pavement until he had a shop again.'],
  yara: ['Yara\'s show went out every night after. The weather was always overcast.', 'Yara talks a little less now, and listens a little more.'],
  pavel: ['Pavel carved an animal for every child in the building. There were forty-one.', 'Pavel stood at the building door for a year, being large, and kind.'],
  lamp: ['The Lamplighter left one morning. Every candle in the flat was lit.', 'The Lamplighter left one morning. Every candle in the flat was lit.']
};
/* A beat is due when its owner is home, rested from the last beat, and the day is right. */
function threadDue(run) {
  if (!run.threads) run.threads = {}; if (!run.threadDay) run.threadDay = {};
  if (run.mode !== 'story' && run.mode !== 'endless' && run.mode !== 'custom' && run.mode !== 'quick' && run.mode !== 'daily') return null;
  const c = Run.present(run).filter(s => THREADS[s.id] && num(run.threads[s.id]) < 3 && run.day >= 2 + num(run.threads[s.id]) * 3 && run.day - num(run.threadDay[s.id], -9) >= 3);
  if (!c.length) return null; c.sort((a, b) => num(run.threads[a.id]) - num(run.threads[b.id]) || (run.day + a.id.length) % 3 - (run.day + b.id.length) % 3); return c[0].id;
}
function momentDialog(run, id, onDone) {
  const s = run.surv.find(q => q.id === id), n = num(run.threads[id]), B = THREADS[id][n]; if (!s || !B) return null;
  const text = typeof B.text === 'function' ? B.text(run) : B.text;
  return dialogOverlay({ id: 'th_' + id, who: 'none', surv: s, title: s.name + ': ' + B.title, text, opts: B.opts.map(o => ({ l: o.l, need: o.need, can: o.can ? () => o.can(run) : null,
    fn: () => { const r = o.fn(run, s); run.threads[id] = n + 1; run.threadDay[id] = run.day; if (o.ep) run.flags['ep_' + id] = o.ep; Run.log(run, s.name + ': ' + B.title + '. ' + r); Bus.emit('threadBeat', { id, n: n + 1, ep: o.ep }); return r; } })) }, run, onDone);
}

/* --- New neighbors and callbacks --- */
Object.assign(VISITORS, {
  clockmaker: { who: 'civ', title: 'A precise little knock.', text: 'An old man with a jeweller\'s loupe on a string. "I mend things. Clocks, radios, flashlights. I take payment in tins or conversation."',
    opts: [{ l: 'A tin for a mended battery', need: { can: 1 }, fn(run) { Run.pay(run, { can: 1 }); Run.add(run, 'battery', 2); return 'He works at your table, humming, and leaves two batteries and a clock that now runs exactly four minutes fast. "On purpose," he says.'; } },
           { l: 'Offer conversation', fn(run) { Run.allMorale(run, 4); Run.humanity(run, 1); return 'He talks about springs and escapements for an hour. It is oddly restful.'; } }] },
  choir: { who: 'civ', title: 'Several voices on the landing.', text: 'Four people from the church choir, scarves up to their noses. "We sing on every floor that will have us. We are short of candles."',
    opts: [{ l: 'Give a candle', need: { candle: 1 }, fn(run) { Run.pay(run, { candle: 1 }); Run.humanity(run, 4); Run.allMorale(run, 5); cb(run, 'choirBack', 5, 8); Bus.emit('helped', {}); return 'They sing one verse there and then, quietly. The stairwell carries it all the way down.'; } },
           { l: 'Listen, but keep the candles', fn(run) { Run.allMorale(run, 2); return 'They sing anyway, more quietly, and move on.'; } }] },
  choirBack: { who: 'civ', title: 'Singing, getting closer.', text: 'The choir, all twelve of them this time, filling the landing. They have learned a new song. They say it is for this floor.',
    opts: [{ l: 'Open the door wide', fn(run) { Run.allMorale(run, 10); Run.add(run, 'candle', 2); Snd.sfx('box'); return 'Nobody on the floor stays inside. Afterwards there are two candles on the mat, "for the next floor that needs them".'; } }] },
  baker: { who: 'civ', title: 'A floury knock.', text: 'A woman with flour to her elbows. "I have an oven and no salt. You have salt, I hear. Bread for salt?"',
    opts: [{ l: 'Trade a salt for three loaves', need: { salt: 1 }, fn(run) { Run.pay(run, { salt: 1 }); Run.add(run, 'bread', 3); Run.allMorale(run, 3); return 'Three loaves, still warm, and the address of an oven.'; } },
           { l: 'Give salt, take nothing', need: { salt: 1 }, fn(run) { Run.pay(run, { salt: 1 }); Run.humanity(run, 4); cb(run, 'bakerBack', 4, 6); Bus.emit('helped', {}); return '"Then I owe you," she says, as if writing it in a book.'; } },
           { l: 'No salt to spare', fn() { return 'She nods and dusts her hands. A small cloud of flour hangs in the hall for a while.'; } }] },
  bakerBack: { who: 'civ', title: 'A floury knock, again.', text: 'The baker, with a sack over her shoulder. "Paid in full," she says. "With interest."',
    opts: [{ l: 'Thank her', fn(run) { Run.add(run, 'flour', 3); Run.add(run, 'bread', 2); Run.allMorale(run, 5); return 'Three bags of flour and two loaves. The interest rate was generous.'; } }] },
  twins: { who: 'civ', small: true, title: 'Two knocks, at once.', text: 'Twins, maybe seven, identical down to the missing tooth. "We are playing hide and seek. Can we hide in your flat? Mama said ask."',
    opts: [{ l: 'Let them hide', fn(run) { Run.allMorale(run, 6); const t = run.surv.find(s => s.id === 'toby' && s.present); if (t) t.addMorale(10); cb(run, 'twinsBack', 3, 6); return 'They hide in the wardrobe for forty minutes. Nobody finds them, including their mother. Toby is in awe.'; } },
           { l: 'Not today', fn() { return 'They hide on the stairs instead, very badly, giggling.'; } }] },
  twinsBack: { who: 'civ', small: true, title: 'Two knocks, at once.', text: 'The twins again, solemn as owls. "Mama says thank you. Also we found these. Also we are not supposed to tell you where."',
    opts: [{ l: 'Accept with solemnity', fn(run) { Run.add(run, 'choc', 1); Run.add(run, 'seeds', 1); Run.allMorale(run, 4); return 'A whole bar of chocolate and a packet of seeds. They bow, both at once, and run.'; } }] },
  martaThanks: { who: 'civ', title: 'A knock from downstairs.', text: 'The old man from two floors down, standing straight. "Your nurse. She saved my cough, and the baby\'s rash. The building took a collection."',
    opts: [{ l: 'Accept it, for Marta', fn(run) { Run.add(run, 'bandage', 2); Run.add(run, 'vitamins', 1); Run.add(run, 'can', 2); Run.allMorale(run, 6); const m = run.surv.find(s => s.id === 'marta'); if (m) m.addMorale(8); return 'Bandages, vitamins, two tins, and a card signed by eleven people.'; } }] },
  dovBaby: { who: 'civ', title: 'A careful knock from 4C.', text: 'The father from 4C, holding a very small bundle. "She sleeps in it every night. We wanted you to meet her."',
    opts: [{ l: 'Meet her', fn(run) { Run.allMorale(run, 10); Run.humanity(run, 3); const d = run.surv.find(s => s.id === 'dov'); if (d) { d.addMorale(15); d.flare = 1; } return 'Her name is Dova. Dov has to sit down.'; } }] }
});

/* --- More words for the diary, the radio, the soup pot, and the loading screens --- */
DIARY.generic.push('Granny says soup is a verb. Nobody has argued.', 'We have started saying "good night" to the plant. It has not said it back. Yet.',
  'Somebody hummed at breakfast and three people joined in without meaning to.', 'Counted the windows lit across the street: nine. Yesterday, eight.',
  'The stairwell smells of candle wax and wet wool. Home, in other words.', 'Found a button that matches nothing. Kept it anyway. That is the rule now.');
DIARY.quiet.push('A whole day with no knock at the door. We played cards until the cards gave up.', 'The quiet has a sound, it turns out. It sounds like the kettle.');
DIARY.kind.push('We gave something away today and the flat felt bigger afterwards.', 'Kindness is a very small coin. It still spends.');
DIARY.cold.push('Frost on the inside of the windows, in ferns. Toby says it is drawing too.', 'Everyone slept in one room. Dov snored for the whole building.');
if (DIARY.hungry) DIARY.hungry.push('We split one tin six ways and called it a feast. It was not. We said it anyway.');
if (DIARY.thaw) DIARY.thaw.push('Water running in the gutters, not frozen. Somebody cried, and blamed the onions. There were no onions.');
RADIO.push({ t: 'A man reads the names of streets that still have water. Ours is one. Everyone cheers, quietly.', m: 5 }, { t: 'A children\'s story, told in three voices by one tired woman.', m: 5 },
  { t: 'Two stations, playing the same song, half a beat apart. It sounds like an echo from somewhere better.', m: 3 }, { t: 'Static, and under it, someone tuning a piano, very slowly.', m: 2 },
  { t: 'A broadcast about bread queues. Times, places, "bring your own bag".', m: 2 }, { t: 'Somebody\'s grandmother, reading a recipe for a cake nobody can make. Lovely anyway.', m: 4 });
SOUPS.push('The Ladle Remembers', 'Seventeen Peas', 'Soup Formerly Known as Stew', 'Tuesday (It Is Not Tuesday)', 'Hope, Thinly Sliced', 'The Baker\'s Envy');
TIPS.push('Hand out supplies from the journal: coffee for the tired, chocolate for the withdrawn.', 'The bookshelf can teach recipes. Read aloud once a day.',
  'A clatter jar rattles for seconds. Throw it, then move the other way.', 'Blankets and draft snakes keep the cold out without burning fuel.',
  'Everyone has a story. Give them a quiet day and they may tell it.', 'The roof lookout gives earlier warnings, and a look at the street.');

Object.assign(ACH, {
  baker: { n: 'Warm Loaf', d: 'Bake bread.' }, concert: { n: 'Upright', d: 'Play the piano three times.' },
  thread: { n: 'Their Own Story', d: 'Finish a personal story.' }, threads4: { n: 'Everyone\'s Story', d: 'Finish four personal stories.' },
  snowbound: { n: 'Snowbound', d: 'Keep everyone warm through Snowbound.' }, market: { n: 'Fair Prices', d: 'Profit at the Night Market.' },
  courier: { n: 'Delivered', d: 'Deliver every letter in Courier Night.' }, listener: { n: 'Every Tune', d: 'Hear every track.' }
});
Bus.on('baked', () => unlock('baker'));
Bus.on('pianoPlayed', d => { if (d.n >= 3) unlock('concert'); });
Bus.on('threadBeat', d => { if (d.n >= 3) { unlock('thread'); Save.data.threadsDone = (Save.data.threadsDone || 0) + 1; if (Save.data.threadsDone >= 4) unlock('threads4'); Save.write(); } });

/* --- Hooks: daily upgrade effects at dawn, and beats in the day plan --- */
(function () {
  const dawn0 = Run.dawn;
  Run.dawn = function (run, sortie) {
    const rep = dawn0.call(this, run, sortie);
    try {
      if (run.up.greenhouse && run.up.garden && (run.gardenT || 0) < 3) run.gardenT++;
      if (run.up.clothesline) { run.lineT = num(run.lineT) + (run.weather === 'rain' ? 0 : 1); if (run.lineT >= 3) { run.lineT = 0; Run.add(run, 'cloth', 1); rep.lines.push('Rags off the line, dry and usable: +1 cloth.'); } }
      if (Run.count(run, 'soap') > 0 && run.day % 3 === 0) Run.add(run, 'soap', -1);
      if (run.flags.dynamo && run.day % 3 === 0) { Run.add(run, 'battery', 1); rep.lines.push('Somebody pedalled the dynamo all evening: +1 battery.'); }
      if (Run.count(run, 'blanket') > 0 && run.temp < 0 && Run.once(run, 'blanketline')) rep.lines.push('Blankets on every bed. Nobody woke up shivering.');
    } catch (e) { if (DEBUG) console.warn(e); }
    return rep;
  };
  const plan0 = Director.planDay;
  Director.planDay = function (run) {
    plan0.call(this, run);
    const id = threadDue(run), r = new RNG(run.seed + run.day * 101);
    if (id && r.chance(run.mode === 'story' ? 0.75 : 0.55)) { run.events.push({ t: r.r(0.28, 0.66), type: 'moment', id }); run.events.sort((a, b) => a.t - b.t); }
  };
  const pick0 = Director.pickVisitor;
  Director.pickVisitor = function (run, r, strug) {
    const fresh = ['clockmaker', 'choir', 'baker', 'twins'].filter(k => !run.flags['v_' + k]);
    if (run.day > 2 && fresh.length && r.chance(0.3)) { const id = r.pick(fresh); run.flags['v_' + id] = true; return id; }
    return pick0.call(this, run, r, strug);
  };
})();
