# Ashen Windows

*A quiet winter in Greywater.*

Ashen Windows is a small survival drama about neighbours who share one landing of a lopsided apartment block through a long, cold siege. By day you keep the shelter going: you cook, mend, comfort and decide who does what. By night someone slips out to scavenge through buildings three and four floors tall, avoiding the Grey Coats (the curfew wardens), the Magpie gangs, stray dogs and the snipers across the river, and tries to be home before dawn. Choose **The Story So Far** on the title screen for the backstory and a field guide to who is out there.

There is also a second game inside: **The Long Walk**, a side-scrolling puzzle platformer in silhouette. Toby walks home alone across the dark city through fifty levels in five chapters, following the paper stars, with an animated interlude after every level.

The world is drawn in charcoal greys. Colour belongs to people: each survivor's colour brightens as their spirits rise and fades as they fall.

Everything (art, animation, music and sound) is generated in code. The game is one self-contained `index.html` with no downloads, no network requests and no tracking. It runs offline and in any modern browser, on desktop or mobile.

**Version 1.4.0.** See [CHANGELOG.md](CHANGELOG.md) for what is new.

**Player's Guide:** [Ashen-Windows-Players-Guide.pdf](Ashen-Windows-Players-Guide.pdf) covers controls, modes, settings, every recipe, item, enemy and hazard, the site layouts, a story walkthrough, all 50 Long Walk levels and the release notes. The game links to it from the JORJ splash screen, the title menu and the pause menu.

## Play

- **Online:** once GitHub Pages is enabled (see below), the game is at `https://<your-user>.github.io/<repo-name>/`.
- **Locally:** download the repository and open `index.html` in a browser. No server is needed.
- **Debug mode:** add `?debug` to the URL to unlock everything and show the performance overlay. F3 toggles the overlay.

## Controls

| Action | Keyboard | Gamepad | Touch |
| --- | --- | --- | --- |
| Move | A / D or arrow keys | Left stick or D-pad | Left side: floating stick |
| Climb, jump | W or Up (Space jumps) | Up | Push the stick up |
| Interact, search, hold to work | E or Enter | A | HAND |
| Use or throw | F or X | X | USE |
| Crouch, hide | C or Ctrl | B | DUCK |
| Flashlight | Q or L | LT | LAMP |
| Sprint | Shift | RT | Push the stick all the way |
| Switch survivor | Tab | RB | SWAP |
| Journal | I or J | Y | BOOK |
| Pause | Esc or P | Start | II |
| Mute | M | | |

Keyboard keys can be remapped in **Settings > Remap keyboard controls**. Up to four players can share a screen in the co-op modes: press A on another gamepad to join.

## Modes

Story Mode (five chapters, thirty days), **The Long Walk** (a 50-level puzzle platformer), Endless Winter, Scavenger Run, Co-op Night Watch, Hold the Door, The Long Night, Hot Meal, Silent Run, Daily Winter, Practice / Workshop and Custom Scenario. There are more to unlock: Lantern Relay, Ledger Winter, Signal Run, Census Night, Keepsake Hunt, Snowbound, Night Market and Courier Night.

**All Unlocked** (new in 1.4) is a sandbox where everything is open: play any of the 50 Long Walk levels, send anyone on a sortie to any site, start any story chapter or any mode, and add any item to a chest that every game started from there begins with. Games started from All Unlocked also get **Add any item** in the pause menu. Nothing done there touches your real saves.

## Accessibility and comfort

The Settings menu has text size, high contrast, colourblind-safe indicators (every need has its own shape, never colour alone), subtitles, hold-to-toggle, auto-interact, adjustable touch buttons, a Gentle Story option, a **Glowing outlines** switch (the soft white outline around enemies, obstacles and hazards), an **Unsettling shadows** switch for the purely decorative shadow figures, **Screen filters** (black and white, film grain and a VHS look, all off by default and also in the pause menu), and **Reduce motion**, which removes flashes, shakes and decorative motion. On slow devices the game lowers its resolution and effects automatically to keep the frame rate up.

## Publish on GitHub Pages

1. Create a new repository on GitHub and push the contents of this folder to its root. `index.html` must sit at the top level.
2. In the repository, open **Settings > Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*. Choose the `main` branch and the `/ (root)` folder, then save.
4. After a minute the site is live at `https://<your-user>.github.io/<repo-name>/`.

The game uses only relative paths and has no build step on the server. The `.nojekyll` file tells Pages to serve the files exactly as they are.

## Project layout

```
index.html        the whole game, built from src/ (this is what Pages serves)
Ashen-Windows-Players-Guide.pdf   the Player's Guide, opened from the game
src/              the source, split into numbered parts that are joined in order
  00_head.html    page shell, styles, meta tags
  01_config.js    constants and every content table (survivors, items, sites, modes, text)
  02_core.js      utilities, seeded RNG, event bus, save system, tweens, input
  03_audio.js     procedural music and sound effects (Web Audio)
  04_fx.js        particles, floating text, text helpers
  05_rig.js       survivors and the animated character rig
  06_world.js     level builders and the world simulation
  07_ai.js        NPC behaviour and home jobs
  08_run.js       a run's state, the day/night economy, the Director
  09_ui.js        paper panels, icons, menus, dialogs
  10_render.js    world, lighting and the colour layer
  11_play.js      shared play scene and HUD
  12_scenes_play.js, 13_flow.js, 14_menus.js, 15_*.js   scenes, modes and extras
  15_ex5_polish.js the 1.0 visual polish layer
  15_ex6_polish11.js the 1.1 visual polish layer
  15_ex7_v12.js   1.2: cutscene art, field guide, fog, smoke, rain, snow, shadows, sound, floors
  15_ex8_v13.js   1.3: 75 items, crafting, 75 enemy variants and their AI, save files, guide link
  15_ex9_walk.js  1.3: The Long Walk (levels, play scene, menu, interludes, story)
  15_ex9b_hazards.js 1.3: site hazards (glass, nails, wires, rotten floors) and glowing outlines
  15_exA_sprites.js 1.4: 1000 sprite and animation improvements (jointed rig, new animations, moods, costumes)
  15_exB_unlocked.js 1.4: the All Unlocked mode and the any-item picker
  15_exC_filters.js 1.4: black and white, film grain and VHS screen filters
  99_tail.html    closes the page
build.sh          rebuilds index.html from src/ and syntax-checks it
test/             Playwright smoke tests
```

## Build

You need [Node.js](https://nodejs.org) for the syntax check.

```
./build.sh
```

This joins `src/` into `build/all.js`, checks it with `node --check` and writes `index.html`. Commit the rebuilt `index.html` so GitHub Pages serves the latest version.

## Test

```
npm i -D playwright
npx playwright install chromium
node test/t1.js     # boot and splash
node test/t6.js     # starts every mode
node test/t12.js    # The Long Walk: checks all 50 levels, a bot plays the simple ones
node test/t13.js    # The Long Walk: a bot clears each puzzle piece
node test/t14.js    # 1.3: items, crafting, enemy variants, hazards, outlines, save/import
node test/t15.js    # 1.4: screen filters, All Unlocked, the item picker, 1000 sprite changes, the new animations
```

Each script prints `no console errors` when it passes. See [test/README.md](test/README.md) for options.

## Saves

Progress, settings and unlocks are kept in the browser's `localStorage` under the key `ashen-windows-v1`. If storage is blocked, the game still runs and says so on the title screen.

To carry your game to another browser or computer, use **Settings > Save data > Save all to a file**, then **Import all from a file** on the other side (or **Import from the clipboard**). The file holds everything: settings, the story save, The Long Walk, scores and unlocks.

## Credits

A JORJ game. Made with nothing but code: the city, the people and the music box.

No real places, people or conflicts are depicted.
