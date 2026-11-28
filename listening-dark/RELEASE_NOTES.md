# Release notes

## 1.2.0: The Colony's Song (2026-11-27)

**Story mode**
- Eight authored chapters with title cards, in-level narration and spoken lines (each speaker in their own colour), and a conversation at the roost after every chapter.
- A cast: Quill (you); Sable, the elder who sent the colony's singers down; six of the lost to find (Thistle, Old Hob, Rook and Rue, Marrow, Lark, Ash); and the Mute, which finally speaks.
- The lost answer when your call reaches them, and call faintly on their own when you are near. Finding one sends them flying home.
- Three endings (The Return, Chorus, Homecoming) depending on the verses you know and who you brought home, then an epilogue.
- A story death never costs progress: retry the chapter from its start. Chapter select replays any chapter you have reached, in its own save slot, and what you find there counts toward the true ending.
- Story caves are fixed (the same for every player), so the chapters can be learned.

**Robustness**
- Separate save slots for story, descent, daily, endless and chapter replays. Version 1 saves migrate automatically.
- Every save is validated on load: impossible values are clamped, unknown runs refused, bad settings reset to defaults.
- A backup copy is kept, and a corrupt save restores from it automatically (the title says so).
- Scene-changing presses are accepted once, so double clicks can no longer take a boon twice or start two runs.
- Boons can only be taken at the roost.
- The bat is pushed back into open air if anything ever leaves it inside rock. Hunters with invalid positions reset.
- Level generation retries nearby seeds instead of failing.
- Endless deep caps hunter numbers and speed, so very deep runs stay playable.
- When every boon is learned, the roost offers *Rest* instead of an empty choice.
- A daily run from another day is labelled and no longer replaces today's cave.
- A tab sitting on the title picks up saves made in another tab.
- Audio resumes after a system interruption on the next input.

## 1.1.0: overhaul (2026-11-27)

- **Visuals:** a glow pass; drifting spores tinted per depth; water drips that light the rock around them; animated hunters; faceted shards; bellflower petals; a spiralling way down; dash trails; a low-health heartbeat vignette; the title drawn in echo points lit by passing wavefronts; fades between scenes.
- **Audio:** a scheduled generative score (slow minor pads, falling bell notes, the colony's motif, which plays more of itself as you find verses, and a danger cluster with a heartbeat). Also: cave ambience on its own bus; echo returns that click from each wall's direction when the wave reaches it; a rising tone while charging; wingbeat flutter; reverb tuned per depth; a muffle while paused; mono audio. Fixed audio failing to start on 44.1 kHz devices.
- **Controller:** full navigation of menus and play, held-direction repeat, LB / RB for settings sections, sliders on the D-pad, vibration, Xbox and PlayStation glyph detection, connect and disconnect toasts, and pause on disconnect.
- **Menus:** a load screen, a rebuilt title, pause with run status and blurred background, tabbed settings (Sound, Display, Play, Controls), How to play with a field guide, a journal with recovered verses, and device-aware button prompts.
- Fixed a tap-through on touch devices where dismissing the load screen also pressed a title menu item.

## 1.0.0: first release (2026-11-27)

- Echolocation stealth across eight procedural depths, three hunter types, bellflower decoys, moths, twelve boons, four lost verses, two endings, Daily and Endless modes, fifteen achievements, keyboard, mouse, touch and gamepad.
