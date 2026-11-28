# Hollow Woods II v1.0

Hollow is a monochrome, Limbo-style puzzle-platformer. It runs offline in any current browser. There are no packages, no build step and no external assets.


## Start

```
python3 run.py          # serves http://127.0.0.1:8765 and opens your browser
open index.html         # or just open the file directly
index.html?debug=1      # collision boxes, frame timing, N = jump to next checkpoint
index.html?debug=1&level=caves3   # start a level directly (forest1 … peaks10)
```

## Controls

| Action | Keyboard | Gamepad |
|---|---|---|
| Move | A / D or arrow keys | Left stick / d-pad |
| Jump | Space (W / Up also jumps when you're not at a ladder) | A |
| Climb ladders and ropes | W / S | Stick up / down |
| Crouch | S | Stick down |
| Push | Walk into a crate or boulder | |
| Grab and pull a crate, pull a lever | Shift or E | X |
| Release a rope | Space | A |
| Pause | Esc | Start |

## Saves: moving progress between browsers

- There are three save slots. Progress saves automatically at every checkpoint, when you pause, and when you close the tab.
- Writes are atomic: the save goes to a temporary key, is verified, and only then replaces the main save. The previous good copy is kept as a backup.
- **Export all saves** (on the title screen or the pause menu) downloads one `.json` file. It contains all three slots, each with the exact checkpoint state (crate and boulder positions, levers, broken planks, sprung traps), plus death counts, play time, settings and key bindings. You can also copy the same data as text.
- **Import saves** in any other browser restores everything from that file or from pasted text.
- Every save carries a checksum. A damaged, edited or non-Hollow file is rejected with a clear message, and your current saves are left untouched.

## What's in v1.0

- **Splash screen:** "JORJ presents" when the game starts.
- **5 overworlds with 10 levels each (50 levels):** The Forest, The Caves, The Ruins, The Factory and The Frozen Peaks. They share the same silhouette style, but each has its own sky, ground, parallax backdrop (trees, stalactites, columns, chimneys, mountains), weather mix and set of puzzles. Levels get longer through each world, and clearing a level unlocks the next one on the overworld map.
- **Weather:** rain (with lightning), snow, fog and smoke change at random during play, on top of drifting dust, film grain and a vignette.
- **All Unlocked Mode:** turn it on from the title screen or press R on the overworld map to play any of the 50 levels.
- **Abstract art and tighter spaces:** every map now has floating geometric art (rings, spirals, shards, crosses) behind it, plus a jagged overhang, hanging roots and cables, closing side walls and drifting foreground shapes for a cramped feel. These are decorative only: no level layouts changed.
- **Glowing outlines:** every obstacle and enemy (spikes, bear traps, saw blades, crushers, gates, rolling boulders) has a pulsing white outline.
- **Terrain:** hills, steep 45° inclines, valleys, cliffs and drops throughout.
- **392 interactive items you must use, and 676 obstacles,** across the 50 levels. Each level lists its own counts on the map screen and in `stats`.

## Tests

```
node tests/run-node.js        # headless: the solution bot plays all 50 levels through the real game code
```

The bot finishes all 50 levels with zero deaths. It also checks that the items were actually used and not bypassed: every plank broken, every lever pulled, every plate weighted by a crate or boulder, every lift ridden, every gate and bridge opened, every crate and boulder moved, and every rope swung on.

Node is used only for this check. The game itself needs only a browser. The full browser and Python test suites come in stage 4.

## Layout

```
index.html          entry point, canvas and the save Export/Import dialog
run.py              optional stdlib static server
src/input.js        keyboard + gamepad, latched edges
src/physics.js      swept AABB, slope tiles, step-up, ground sticking
src/world.js        level loading, crates/boulders, plates, levers, lifts/gates/bridges/crushers, ropes, checkpoints
src/hazards.js      spikes, bear traps, saw blades
src/player.js       movement, push/pull, levers, ladders, rope swinging, fall death
src/save.js         slots, atomic writes, checksums, export/import
src/render.js       grey-box renderer + camera
src/main.js         loop, menus, save dialog
levels/*.js         chapter data (generated)
tools/genlevels.py  level generator (segments + bot solution steps)
tests/              solution bot + headless runner
```

## Known limitations

- There's no audio yet, and no settings or rebinding screen. Bindings are already stored in the save.
- Levels are written as `.js` files rather than `.json`, so they also load when you open `index.html` directly from disk, where browsers block reading JSON files.
- Water and swimming aren't built yet.
- Single-player only. Saves live in the browser until you export them.

## Player animation (v1.3)

The character is drawn procedurally with two-segment arms and legs. It has separate poses for idle, running, crouching, pushing, pulling, jumping, falling, ladder, rope, lever and death. It also has squash and stretch on take-off and landing, a forward lean, breathing, blinking, wandering glowing eyes, hair and tunic that trail with movement, a soft ground shadow, and footstep, take-off and landing dust. Run speed is 118 px/s (down from 170), with matching slower crouch, push, pull and climb speeds.

## Sound (v1.4)

All audio is synthesized in the browser, with no audio files.

- **Ambient beds per overworld:** wind, crickets and owls (Forest); a low drone and dripping water (Caves); a howling wind and distant chimes (Ruins); machine hum, clanks and steam (Factory); a strong wind and cracking ice (Peaks); a soft drone on the map and title screens.
- **Weather sound:** rain, a snow hush, smoke and fog rumble, and thunder that follows the lightning flash.
- **Effects:** footsteps change by world surface, plus jump, landing, levers, pressure plates, crates and boulders, planks breaking, crushers, bear traps, saw blades, lifts and gates, ladder rungs, rope creaks, checkpoint and level-complete chimes, menu sounds, and a different death stinger for each cause. Volume and stereo pan follow each object's distance from you.
- **Controls:** **M** mutes, or use "Sound" in the pause menu. Volume levels (master, effects, ambience) are stored in the save file and carried by Export/Import.

## More sprite detail (v1.4)

A cloth scarf with its own physics, spring-driven hair and tunic, belt and folds, hands, rim light, leaning into starts, stops and slopes, teetering at ledges, idle fidgets (stretch, shrug, peek, look around), scared eyes near hazards, a joyful pose when a level is finished, different death animations by cause, snow footprints, and cold breath in the Frozen Peaks.

## Single file

`python3 tools/build_single.py hollow.html` builds one self-contained HTML file.

## v1.5: Endless Runner + VHS
- Title menu -> **Endless Runner**: 25 long procedural maps (5 overworlds x 5 styles), each with exactly 100 monsters (crawler, walker, hopper, bat, charger, burrower) and 100 obstacles (spikes, pits, traps, saws, boulders, walls, hurdles, low roofs) on sloped, stepped and tunnelled terrain. The hero auto-runs; Space jumps, S slides. 5 lives, +1 per finished map, maps chain and speed up each lap. Best distance is saved.
- **Pause menu -> Grain + VHS effect** (off by default).
- Test status: `node tests/gen-check.js` verifies the 100/100 counts. `tests/run-runner.js` is an experimental reactive bot; it does NOT yet clear every map (see notes in the release message), so runner maps are not proven beatable the way the 50 campaign levels are.

## v2.0: Hollow Woods II (story mode)
- Wordless animated cutscenes: intro (new game), a journey scene after each overworld (chased by a different shadow each time) and a finale. Space/Enter skips.
- Shield orbs (soft cyan): collect up to 2; each soaks one hit from spikes, traps, saws, monsters or boulders. Lost on death.
- Grab (Shift/E) now pulls boulders as well as crates.
- A second layer of slowly animated abstract art behind every map.
- Everything that can hurt you has the pulsing white outline.
