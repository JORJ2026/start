# Builds QA_REPORT.md from qa/results.json and qa/audio-check.json (run after tools/qa.mjs and tools/audio-check.mjs)
import json
r = json.load(open('qa/results.json'))
a = json.load(open('qa/audio-check.json'))
npass = sum(x['pass'] for x in r)
rows = '\n'.join(f"| {'Pass' if x['pass'] else 'FAIL'} | {x['name']} | {x['info'].replace('|', '/')} |" for x in r)
aud = '\n'.join(f"| {k} | {v} |" for k, v in a['sounds'].items())
music = ', '.join(f"{k} {v}" for k, v in a['music'].items())
get = lambda pre: next((x['info'] for x in r if x['name'].startswith(pre)), '')
rep = f"""# QA report: The Listening Dark 1.2.0

Every result below comes from tests actually run on the final build (`dist/index.html`, 2026-11-27), using headless Google Chrome driven by Playwright. You can reproduce them with `node tools/qa.mjs` and `node tools/audio-check.mjs`; `python3 tools/report.py` rebuilds this file from the results. Raw output is in `qa/`.

**Result: {npass} of {len(r)} automated checks pass. The audio check {'passes' if a['pass'] else 'FAILS'}.**

## What was tested

- **Functional:**
  - load screen and audio start
  - 308 generated caves checked for reachability and fit
  - menus by real keyboard
  - collision soak
  - calls, hearing, objectives, all depths, both Descent endings
  - save, reload and continue; pause; damage, healing and death
  - Daily and Endless modes
- **Controller:** a simulated standard-mapping gamepad, injected into the page, plays the game end to end:
  - load screen, menu focus and held-direction repeat
  - flight, dead zone, glide, all three ways to call, dart
  - vibration, and the setting that turns it off
  - pause, settings sections, sliders with repeat, back out
  - roost choice
  - PlayStation hot-swap and glyph change
  - disconnect pausing play
- **Story:**
  - the Return ending without verses
  - a full playthrough through the real menus: prologue, eight chapter cards, arrival lines in every chapter, roost conversations, all six lost found, all four verses, singing to the Mute, the Homecoming ending and the epilogue
  - chapter select replay in its own slot
  - death keeping the chapter, and retry
- **Robustness:**
  - double presses
  - a bat inside rock
  - a hunter with invalid coordinates
  - endless depth 40
  - an exhausted boon pool
  - migrating a version 1 save
  - hostile save values
  - a corrupt save restored from its backup
  - another day's daily run
  - another tab writing the save
- **Experience:**
  - balance soak: {get('stealth matters')}
  - lurker and bellflower behaviour, and boon effects
  - settings persistence, text size, quality switch, keyboard menu navigation
- **Release:**
  - performance with and without glow
  - the slow-device glow guard
  - memory across rebuilds
  - emulated phone with real touch events
  - blocked storage
  - fully offline

## Defects found and fixed while building 1.1 and 1.2
1. **Audio never started on 44.1 kHz devices.** The reverb impulse was built at 48 kHz and the convolver rejected it. Buffers are now resampled to the device rate.
2. **Mono audio could play from one speaker only.** It now folds at the master and is spread to both channels explicitly; the check confirms equal left and right levels.
3. **Music did not fully stop or duck.** Notes already scheduled bypassed the music fader. All music voices now pass through it, and silent mode measures 0.001.
4. **On touch, the tap that dismissed the load screen also pressed a title menu item.** The load screen now stays in front until it is gone.
5. **A double-click on a boon could apply it twice and start two levels.** Scene changes now lock until the next screen appears, and boons are refused outside the roost.
6. **Xbox controllers were identified as PlayStation** (both report "Wireless Controller"). Now matched by Sony's vendor ID.
7. **The glow pass costs about 3.5 ms per frame in software rendering.** It now refreshes every other frame, and a slow-device guard turns it off, with a message, if the frame rate can't hold.
8. **A stray border showed from the hidden toast; the HUD showed under pause submenus; labels overlapped on phones.** All fixed.
9. **The old balance test measured the wrong thing.** A blind, slow bot was hit more than a careless one: silence hides you, but you must still call to see. It was replaced by an informed bot that only uses what its own echoes reveal. That bot is hit within a minute in far fewer trials, which shows the intended skill is rewarded.

## Automated results (final run)

| Result | Check | Measured |
|---|---|---|
{rows}

## Audio output (peak amplitude after the master stage)

Device rate {a['sampleRate']} Hz.
- Stereo (hard-panned click), left / right: {a['stereoLeftRight']}
- Mono, left / right: {a['monoLeftRight']}
- Pause muffle cutoff: {a['muffleCutoffHz']} Hz
- Music by mode: {music}
- Ambience: {a['ambience']}
- Click 5,000 px away: {a['clickFarAway']}
- Muted: {a['muted']}

| Sound | Peak |
|---|---|
{aud}

## Not tested
- Real phones and tablets, Firefox and Safari, and physical controllers. Controller tests use a simulated standard-mapping pad; non-standard mappings may label buttons differently.
- Human playtesting. Difficulty, pacing and story length come from bots and reasoning, not from players.
- Frame rate on real GPUs. The figures are CPU time under headless software rendering, where frame scheduling is coarser than on real hardware.
"""
open('QA_REPORT.md', 'w').write(rep)
print('QA_REPORT.md written', npass, len(r))
