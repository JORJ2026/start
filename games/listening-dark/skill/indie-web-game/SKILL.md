---
name: indie-web-game
description: Build, test and ship a complete original browser game (single self-contained HTML file) end to end: concept, systems, procedural art and synthesized audio, automated QA in headless Chrome, release package.
---

# Shipping a complete indie web game in one session

Use this when asked to make a finished, playable game, not a prototype. The default target is a single self-contained HTML file (Canvas 2D + Web Audio): it runs offline, works on desktop and mobile, publishes as an artifact, and can be tested headlessly.

## 1. Pick the concept (10 minutes, privately)
- Sketch 4–6 ideas. Score each 1–5 on: **one verb nobody has seen used this way**, a visual signature that comes straight out of the mechanic, depth from interacting systems, replayability, and whether it can really be finished.
- Prefer a mechanic that *is* the art direction. In The Listening Dark, sight is a resource: echolocation draws the world as a point cloud, so the look, the stealth loop and the audio design are one idea.
- Write one sentence for the core tension (for example, "every call shows you the cave and tells the cave where you are"). Every system must feed that tension or be cut.

## 2. Architecture
- Write source as plain modules (`core, audio, world, game, render, input, ui, main`), concatenated by a ~15-line `tools/build.mjs` into `dist/index.html`, wrapped in one IIFE with `'use strict'`.
- Use a fixed 60 Hz simulation step, rendering once per rAF. Clamp `dt` to 0.25 s and cap catch-up steps at 8.
- Use a seeded RNG (mulberry32) for everything procedural, so Daily mode equals `hash(date)`.
- Keep one state machine: `title | play | paused | roost | dying | over | ending`.
- Expose `window.__TLD = { G, Store, update, STEP, ...internals }` so tests can step the sim deterministically. It is harmless in release.
- Wrap the loop in try/catch. On a crash, show a small error banner and return to the title, with the save kept at the start of the depth.
- Wrap all `localStorage` access in try/catch and merge loaded data over defaults. A corrupt or blocked store must never break boot; tell the player when saves are off.

## 3. Procedural world
- Cellular-automaton caves (fill about 0.46, 5 passes of the 5/3 rule). Keep the largest 4-connected region and retry with a new seed if it covers under 30% of the map.
- **Avoid tile stair-steps:** treat the grid as a bilinear field over cell centres, plus a ±0.075 sine wobble, with iso 0.5 as the surface. Raymarch it (4 px steps in fully open 2×2 blocks, 1.5 px near rock, then bisect 4 times). Use the same field for circle collision (centre plus 8 ring samples). Keep the wobble small, or 1-cell corridors close for radius-6 bodies.
- Place content with BFS distance from the start: the exit among the farthest roomy cells, objectives by farthest-point sampling (70 random candidates per pick), secrets in nooks (at least 5 wall neighbours), enemies more than 30 cells away.
- Pathfinding: A* (8-way, no corner cutting) with arrays allocated once per level and a generation counter instead of clearing, plus an expansion cap.

## 4. Art without assets
- Choose a committed palette: one ground colour, one "self" colour, one danger colour, and an accent per object class. Draw everything as vector glyphs or point clouds; add a pre-rendered radial glow sprite tinted per colour and cached.
- Batch thousands of points into alpha buckets (about 9 levels × kinds): one `beginPath` and one `fill` per bucket.
- Finish with a vignette (pre-rendered radial) and a grain pattern at about 4.5% alpha, offset randomly each frame.
- Menus are bare type over the live canvas, with no cards. Use a 44 px minimum target and visible focus.

## 5. Audio without samples
- Bus layout: per-bus `dry` and `wet` gains feeding a master gain → compressor → destination. The convolver impulse is shaped noise: `rand * (1-t)^3`, plus sparse early reflections.
- Use a `chain({x, y, range, vol, wet})` helper for spatial voices: distance gain `(1-d/range)^1.6`, stereo pan from dx, low-pass falling with distance. Disconnect the head node on `ended`.
- Generative score: 3–4 detuned drone oscillators through an LFO'd low-pass, sparse modal notes every 2–6 s, and a tension voice plus heartbeat driven by a 0–1 `Music.tension` the game sets.
- Initialize audio on the first pointer or key event (autoplay policy), and suspend it when the tab is hidden.
- **Verify the output, not the calls:** attach an `AnalyserNode` to the master and record each sound's peak (see `tools/audio-check.mjs`). Inaudible sounds are a real bug you only catch this way.

## 6. Gameplay integration checklist
- Teach by doing: queue contextual hints (one at a time, about 5 s) triggered by first-time events, only in the opening levels, and toggleable.
- Every meaningful sound gets an on-screen cue (a directional arc) so the game is playable deaf.
- Quick taps: latch press events between polls, or sub-frame taps are lost.
- Roguelite boons: data table `{id, name, desc, max, cond}`, offer 3, and apply them through getters (`B('far_call')`) rather than mutating base stats.
- Save the run at depth start. Meta-progression (achievements, unlocks, lifetime counters) saves immediately.

## 7. Automated QA in headless Chrome (Playwright)
Launch `/usr/bin/google-chrome` (or `$CHROME`). Use one browser context per scenario, so storage is fresh.
1. **Functional:** boot with no errors; generation fuzz (hundreds of seeds × depths × difficulties checking reachability and body-fit); real keyboard through the menus; collision soak (bat never inside rock); every win and loss transition; save → reload → continue; pause stops time; both endings via scripted teleport and input.
2. **Experience:** a balance soak with two scripted bots (careless versus careful) checking that the core skill is actually rewarded; AI soak for NaN and stuck agents; settings persistence; keyboard menu navigation; corrupt-save recovery; then **look at real screenshots** of staged moments and fix what reads badly.
3. **Release:** performance measured over **real rAF frames** (never draw hundreds of frames in one synchronous evaluate: Chrome queues the draws and later flushes them all at once in one multi-second stall); heap across rebuilds; emulated phone with real CDP touch events; storage blocked via `addInitScript`; `offline: true` context, listing every attempted request.
Report only the checks that ran. Generate the report from `results.json`, not from memory.

## 8. Media and packaging
- Screenshots: stage moments through the debug handle (place the player in line of sight of the subject: check `los`). Abort font requests in capture contexts so a hung request doesn't stall frames.
- Cover: render the game itself in a wider viewport and crop, so the scene sits off-centre under the title. Don't shift the canvas with CSS, because it leaves a seam.
- Trailer: a Playwright `recordVideo` of an A*-driven pilot bot, then ffmpeg: cover intro, concat, fades, `libx264 -preset veryfast -crf 20 -movflags +faststart`. Note that it is silent.
- Package: `index.html` at the top level, plus `source/`, `tools/`, `media/`, `README` (run, controls, credits, licences, known limitations), `RELEASE_NOTES`, `QA_REPORT`, `STORE`, `LICENSE` and this skill.
- Publish `dist/index.html` as a hand-built artifact page. In the artifact sandbox, localStorage may be missing, so the game must say when it isn't saving.

## 9. Controller, story and robustness (added after v1.2)
- **Controller testing without hardware:** in `addInitScript`, replace `navigator.getGamepads` with a function returning a fake standard-mapping pad (`buttons[i].pressed/value`, `axes`, and a `vibrationActuator.playEffect` that records calls). Then drive the whole game by toggling buttons with short waits. Dispatch `gamepadconnected` or `gamepaddisconnected` with a `gamepad` property to test hot-swapping.
- Poll the gamepad once per rendered frame for edges and menu repeat (about 0.38 s first delay, then 0.11 s), and once per simulation tick for play input. Use a radial dead zone with rescaling.
- Identify PlayStation pads by vendor `054c`, never by "Wireless Controller" (Xbox pads report that too).
- One navigation model (`nav('up'|'down'|'left'|'right'|'confirm'|'back'|'tabPrev'|'tabNext')`) fed by keys, pad and pointer. Each screen keeps a `redo` function so prompts re-render, with focus preserved, when the device changes.
- **Audio buffers must match the device sample rate.** A ConvolverNode rejects a 48 kHz impulse on a 44.1 kHz device. Precompute buffers at a known rate and resample when creating them.
- Route every music voice through the score's own fader (`dest: Music.out`), or ducking and silence will leak already-scheduled notes. Fold mono at the master and spread it explicitly to two channels at the next stage.
- **Story on top of a systemic game:** keep the script as data (`[speaker, text, condition]`), with beats that fire once per attempt on events (start, first call, first shard, hunter, gate, low health, near the boss). Add chapter cards, roost conversations, a rescuable character per chapter with persistent found-state, and endings chosen from persistent collectibles, so chapter replays count. A story death retries the chapter; it never wipes progress.
- **Saves:** use one slot per mode; validate every run on load (clamp numbers, drop unknown ids, refuse unknown modes); migrate old versions; keep a backup copy and restore from it automatically; listen for `storage` events from other tabs.
- **Input races:** lock scene-changing actions until the next screen appears, and guard state transitions (`completeDepth` only from play, `takeBoon` only from the roost).
- **Runtime guards:** push the player out of rock, reset NaN agents, retry level generation with nearby seeds, cap enemy counts for endless depth, and handle an exhausted reward pool.
- **Balance bots must play the way a player is meant to.** A blind "careful" bot looked worse than a careless one. Measure an informed bot that only uses what its own echoes reveal, and use time to first hit on fixed seeds; hit counts with refills are too noisy.

## Lessons learned
- Decide the visual identity from the mechanic early; it saves every later art decision.
- Tile-based caves look cheap under point-cloud rendering. Smooth fields fix it for about 20 lines.
- Test staging can lie (for example, a bell behind a wall). When a screenshot shows nothing, check the setup before "fixing" the game.
- Measure audio levels; a sound that plays at 0.01 amplitude is a silent bug.
