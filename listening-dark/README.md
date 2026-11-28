# The Listening Dark

*A stealth game played by sound. Version 1.2.0.*

You are Quill, a young bat in a flooded cave, and you cannot see. Each call sends a wavefront across the screen, and the cave appears only where the echo comes back: a scatter of pale points along the rock that fades within seconds. The things that hunt in the dark hear you just as well as you hear them. A quiet chirp lights a small room. A long call shows you the whole cavern, and wakes up everything in it.

## Playing

**Open `index.html` in a browser.** That is the whole installation: one self-contained file, no install, no server, no account, nothing downloaded at runtime. It works offline. When the machine is online it fetches the EB Garamond typeface; offline it falls back to Georgia.

A short load screen prepares the cave reverb and the first cave, then asks for one key, tap or controller button. Browsers only allow sound after that first press. Headphones are strongly recommended, because hunters, water drips, lost voices and the way down are all placed in stereo.

## Modes

- **Story: The Colony's Song.** Eight authored chapters, each with a title card, narration, and conversations at the roost with Sable, the colony's elder. Six of the colony are lost in the dark: each one answers when your call reaches them, and you bring them home by finding them. Four verses of the old song are hidden along the way. There are three endings: *The Return*, *Chorus* and *Homecoming*, plus an epilogue. Dying never loses a chapter, because you retry it from its start. Once you reach a chapter, Chapter select lets you replay it to go back for anyone you missed; the lost you find and the verses you learn stay found.
- **Descent:** eight depths, one life, a roguelite run at Gentle, Standard or Cruel. Two endings.
- **Daily cave:** the same seeded descent for everyone on a given date.
- **Endless deep:** unlocks after depth five or any ending. Depths keep coming; hunters speed up past depth eight, with numbers capped so every depth stays playable.

Each mode keeps its own save slot, so starting a descent never overwrites your story. *Continue* on the title resumes whichever you played last.

## Controls

| Action | Keyboard & mouse | Controller (Xbox / PlayStation) | Touch |
|---|---|---|---|
| Fly | WASD or arrows | Left stick | Drag on the left half |
| Call (chirp) | Tap Space or left click | Tap A / ✕, or RT | Tap CALL |
| Call farther | Hold, then release | Hold A / ✕ | Hold CALL |
| Glide silently | Hold Shift | LB / L1 or LT | Push the stick gently |
| Dart | E (or X, K) or right click | B / ○, X or RB | DART |
| Pause | Esc or P | Menu / Options, or View | II, top right |
| Menus | Arrows or WASD, Enter, Esc | D-pad or stick, A, B; LB / RB switch settings tabs | Tap |
| Settings tabs, values | Q / E or Tab; ← → | LB / RB; D-pad ← → (hold to repeat) | Tap, drag sliders |

On-screen prompts follow the device you last used, and switch between Xbox and PlayStation glyphs automatically. Controllers vibrate on calls, darts, pickups and hits; you can turn that off. Unplugging a controller mid-play pauses the game.

## Settings

- **Sound:** master, music, effects, cave ambience and interface volume; mute; mono audio.
- **Display:** echo colour (five, unlockable); quality (High or Low); glow; film grain; screen shake; soften flashes; text size (90–130%); frame counter.
- **Play:** first-time hints; on-screen sound cues (on by default, so the game is playable without hearing); a pointer to the open way; erase all progress.
- **Controls:** vibration; stick dead zone; button prompt style; touch controls.

Each section has a *Restore defaults* option. If a device can't hold its frame rate with glow on, the game turns glow off by itself and tells you.

## Building from source

```
node tools/build.mjs          # source/*.js + style.css + template.html -> dist/index.html
node tools/qa.mjs             # 109 automated checks in headless Chrome, including a simulated controller
node tools/audio-check.mjs    # measures the real output of every sound, mono, muffle and music mode
node tools/capture.mjs        # screenshots, cover art, gameplay recording
python3 tools/report.py       # writes QA_REPORT.md from the results files
```

The tools import Playwright from `/opt/npm-tools/node_modules/playwright`; change that path (or `npm i playwright`) on your machine. Set `CHROME` to your Chrome binary if it is not `/usr/bin/google-chrome`.

Source layout:
- `core.js`: data, settings model, saves (with validation, migration and backup)
- `story.js`: script, characters and endings
- `audio.js`: synthesis, spatial voices, reverb, ambience and the scheduled score
- `world.js`: cave generation, the smooth wall field, ray marching, A* pathfinding, echoes
- `game.js`: rules, AI, story beats and run flow
- `render.js`: the renderer, glow pass, HUD, and the title drawn in echo points
- `input.js`: keyboard, mouse, touch and gamepad
- `ui.js`: every menu
- `main.js`: load screen, game loop, pause and crash recovery

## Credits and licensing

Design, code, writing, every drawn mark, the sound and the music: Claude (Anthropic).

The package contains no image, audio or third-party code assets. Everything is drawn with Canvas 2D and synthesized with the Web Audio API at runtime.

Typeface: EB Garamond by Georg Duffner and Octavio Pardo, SIL Open Font License 1.1, loaded from Google Fonts when online and not bundled.

Source code: MIT License (see `LICENSE`).

## Known limitations

- Tested only in headless Chrome: desktop, an emulated 390×844 touch phone, and a *simulated* standard-mapping gamepad. Not tested on real phones, in Firefox or Safari, or with a physical controller (non-standard mappings may label buttons differently).
- Performance figures come from headless Chrome with software rendering. Glow costs about 2 ms per frame there (about 0.5 ms with glow off); real GPUs should do better, and the slow-device guard turns glow off if needed.
- Balance was tuned with scripted bots, not human players.
- Quitting mid-level resumes from the start of that depth or chapter.
- If the browser blocks local storage, the game runs but saves nothing, and the title screen says so. Two tabs open at once can overwrite each other's progress if both are mid-run; a tab sitting on the title picks up the other tab's saves.
- The trailer is silent, because the browser recording captures no audio.
- The game depends on sight. On-screen sound cues and mono audio make it playable without full hearing.
