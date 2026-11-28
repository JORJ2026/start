// ---------- story: The Colony's Song — eight chapters, six lost kin, three endings ----------
// Lines are [speaker, text] or [speaker, text, condition(run)].
const SPEAKERS = {
  n: { name: '', col: [222, 233, 228] },
  sable: { name: 'Sable', col: [255, 204, 112] },
  you: { name: 'Quill', col: [190, 225, 255] },
  mute: { name: 'The Mute', col: [230, 90, 85] },
  verse: { name: 'A lost verse', col: [255, 228, 240] },
  thistle: { name: 'Thistle', col: [255, 196, 170] }, hob: { name: 'Old Hob', col: [255, 196, 170] },
  rook: { name: 'Rook', col: [255, 196, 170] }, rue: { name: 'Rue', col: [255, 196, 170] },
  marrow: { name: 'Marrow', col: [255, 196, 170] }, lark: { name: 'Lark', col: [255, 196, 170] }, ash: { name: 'Ash', col: [255, 196, 170] }
};
const KIN = [
  { name: 'Thistle', chapter: 2 }, { name: 'Old Hob', chapter: 3 }, { name: 'Rook and Rue', chapter: 4 },
  { name: 'Marrow', chapter: 5 }, { name: 'Lark', chapter: 6 }, { name: 'Ash', chapter: 7 }
];
const KIN_AT = { 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5 };
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const hasKin = i => !!(Store.data.story && Store.data.story.found.kin[i]);
const kinFound = () => KIN.filter((_, i) => hasKin(i)).length;

const PROLOGUE = [
  'The water came up through the floor of the world, and the colony’s song went quiet.',
  'Those who could fly fled to the high roost. Those who could not, the water kept.',
  'Old Sable counted who was left, three times, and stopped.'
];

const STORY = [null,
  { title: 'Last Light', intro: ['The mouth of the cave is still dry, for now.', 'Below it, nothing has answered a call in three nights.'],
    beats: {
      start: [['sable', 'Quill. You still call. Then you are the one who goes down.'], ['sable', 'Call, and listen. The stone will tell you its shape.']],
      firstCall: [['n', 'The walls come back to you in pieces, like a word half remembered.']],
      firstShard: [['sable', 'Song-glass. The elders grew it to hold their voices. The way down opens only to a full chord.']],
      hunter: [['n', 'Something answers that is not stone.']],
      gate: [['sable', 'Hear that hum? Follow it down.']]
    },
    roost: [['sable', 'You came back. Most do not, the first time.'], ['you', 'Something down there heard me.'], ['sable', 'Everything down there hears you. That is the price of seeing. Rest, and I will teach you what I can.']] },
  { title: 'Where the Water Speaks', intro: ['Water ticks from the ceiling here, every drop a small, bright echo.', 'Somewhere in the gallery, a young voice is still calling for its mother.'],
    beats: {
      start: [['n', 'Listen between the drips. One of the small sounds is not water.']],
      kinHeard: [['thistle', 'Who’s there? Please. I can’t see. I can’t see anything.']],
      kinFound: [['thistle', 'You found me by sound? Teach me later. Right now I just want up.'], ['n', 'Thistle beats upward, toward the roost, toward a dark that is only dark.']],
      verse: [['n', 'Carved into the wall where no one would think to look: a line of the old song.']],
      gate: [['sable', 'If you find them, bring them home, Quill. Every one.']]
    },
    roost: [['thistle', 'Sable says you went down alone. On purpose.'], ['you', 'Somebody has to call first.'], ['sable', 'The elders said the same thing, once.']] },
  { title: 'The Roots Remember', intro: ['Roots from a forest no one here has ever seen push through the ceiling.', 'Bellflowers grow in their shade. The elders planted them to sing back.'],
    beats: {
      start: [['sable', 'If a bellflower hears you, it rings. Whatever hunts will go to it instead of you.']],
      bell: [['n', 'The flower rings like a struck cup, and far off, something turns toward it.']],
      kinHeard: [['hob', 'Ha. A voice. I’d stopped believing my own.']],
      kinFound: [['hob', 'Old Hob doesn’t need saving. Old Hob needs his wings back. Lead on, little caller.']],
      gate: [['n', 'The roots part around a door of humming dark.']]
    },
    roost: [['hob', 'Sable sent the elders down. Did she tell you that?', r => hasKin(1)], ['sable', 'Rest, Quill.'], ['you', 'Sable?'], ['sable', 'Not yet. Rest.']] },
  { title: 'The Choir Below', intro: ['This is where the colony sang, before the flood. The stone still holds the shape of it.', 'Two voices answer each other somewhere ahead, too frightened to stop.'],
    beats: {
      start: [['n', 'Every hollow here was tuned by wings and breath. Your call comes back sweeter than it went.']],
      kinHeard: [['rook', 'Rue, be quiet—'], ['rue', 'No, listen. That’s a real voice!']],
      kinFound: [['rue', 'We sang to each other so we’d know we were still here.'], ['rook', 'It worked. Mostly.']],
      verse: [['n', 'Another verse, scratched beside a perch worn smooth by a thousand claws.']],
      hunter: [['n', 'The spined things here move as if they remember being something else.']]
    },
    roost: [['sable', 'I will tell you now. When the water rose, the elders went down to sing it back. I told them to.'], ['you', 'And they didn’t come back.'], ['sable', 'Something came back. Something that only listens.']] },
  { title: 'Salt and Silence', intro: ['When the water drew back, it left salt on everything. Salt carries sound like a scream.', 'Fly gently here.'],
    beats: {
      start: [['n', 'Salt crusts every surface. Even your wingbeats come back too loud.']],
      kinHeard: [['marrow', 'Stop calling. Stop. They’ll hear.']],
      kinFound: [['marrow', 'They took my brother because he wouldn’t stop singing. Don’t make me watch it again.'], ['n', 'Marrow goes up quietly. You hope that is enough.']],
      verse: [['n', 'The third verse, half buried in salt, as if someone wanted it found only by the patient.']],
      lowWings: [['sable', 'Moths, Quill. Eat. You are no good to anyone hollow.']]
    },
    roost: [['marrow', 'Why do they hunt sound?', r => hasKin(3)], ['sable', 'Because sound is all they have left of themselves.'], ['you', 'Then they’re not monsters.'], ['sable', 'They are hungry. Those can be the same thing.']] },
  { title: 'The Bone Garden', intro: ['Old bones, laid out with care. Somebody tended this place.', 'The lurkers sleep in its corners. Do not wake them.'],
    beats: {
      start: [['sable', 'Slowly here. The jawed ones only stir for hurried wings.']],
      kinHeard: [['lark', 'Is it morning? I’ve been counting drips. I lost count somewhere past a thousand.']],
      kinFound: [['lark', 'You smell like the roost. Like dust and sky. Take me there.']],
      gate: [['n', 'Below the garden the air grows heavy, the way it does before someone speaks.']]
    },
    roost: [['lark', 'Sable’s son went down with the elders. Ash. Did you know?', r => hasKin(4)], ['you', 'No.'], ['sable', 'He was the best singer the colony ever had. I would have gone in his place, if he had let me.']] },
  { title: 'The Long Throat', intro: ['A single passage, long and narrow, falling toward the bottom of everything.', 'Something enormous is breathing at the end of it.'],
    beats: {
      start: [['n', 'Every call you make runs ahead of you down the throat, and not all of it comes back.']],
      deep: [['mute', '…who… calls…']],
      kinHeard: [['ash', 'Mother? No. You’re not her. But you sound like home.']],
      kinFound: [['ash', 'I ran when the others stopped singing. I’ve been ashamed in the dark so long.'], ['ash', 'Tell my mother I’m coming. Tell her I’m sorry.']],
      verse: [['n', 'The fourth verse. You know the whole song now. The rest is the singing.']]
    },
    roost: [['sable', 'He came back. He came back to me.', r => hasKin(5)], ['sable', 'You did not find him. That is all right. You are still here.', r => !hasKin(5)],
      ['sable', 'The bottom is below you, Quill. Whatever the elders became is waiting there.'],
      ['sable', 'If you know all four verses, you could sing to it. Or take the shards and run. Both are brave.']] },
  { title: 'The Hollow Heart', intro: ['The bottom of the world is one vast room, and it is not empty.', 'The Mute drifts through stone. It swallows every echo it touches.'],
    beats: {
      start: [['n', 'It hears everything. It answers nothing.'],
        ['n', 'The four verses ache in your throat. Hold a full call close to it, and sing.', r => versesKnown(r) >= 4],
        ['n', 'You do not know the whole song. Gather the shards and slip past it.', r => versesKnown(r) < 4]],
      muteNear: [['mute', '…we… sang… and the water… did not… listen…']],
      sang: [['mute', '…Quill… we… remember…']],
      gate: [['n', 'The way up hums.']]
    },
    roost: [] }
];

const STORY_ENDINGS = {
  return: { title: 'The Return', lines: () => [
    'You rise with the shards ringing in your teeth and the Mute’s silence at your back.',
    kinFound() ? `At the roost, ${plural(kinFound(), 'lost voice')} you found are waiting. Sable counts them twice.` : 'At the roost, Sable is waiting. She counts you once, and holds on.',
    'Below, the elders keep listening. Someday someone will have to sing to them.'] },
  chorus: { title: 'Chorus', lines: () => [
    'You sing the four verses into the Hollow Heart.',
    'The Mute falters. Then it answers in every voice it swallowed, and the elders are elders again for as long as the song lasts.',
    `You rise through a cave full of singing. ${kinFound() ? plural(kinFound(), 'lost voice') + ' wait at the roost; the rest, the dark still keeps.' : 'The roost is quiet. The dark still keeps the others.'}`] },
  homecoming: { title: 'Homecoming', lines: () => [
    'You sing, and the elders answer.',
    'When you reach the roost, everyone is there. Thistle. Old Hob. Rook and Rue. Marrow. Lark. And Ash, last of all, with his mother’s wing around him.',
    'The colony sings that night for the first time since the water. You call first. They all answer.'] }
};
const EPILOGUE = [
  'The water never went all the way down. It never will.',
  'But the cave is not silent any more. In the deep places, something old hums along when the colony sings.',
  'And every night, before the others wake, Quill flies to the mouth of the cave and calls into the dark, just to hear it answer.'
];
function versesKnown(r) {
  if (!r) return 0;
  if (r.mode !== 'story') return r.songs.length;
  const s = new Set(r.songs); for (const k in Store.data.story.found.verses) s.add(+k);
  return s.size;
}
