# Deep Signal

A compact, original browser game about exploring a drowned city by sonar. Recover three signal cores on each depth, keep your air above zero, and return to the open hatch while the hunter follows your pings.

## Play

Open index.html in a modern browser (or serve this folder as static files). No build step, server, account, or network connection is required. The current expedition is saved in local browser storage and can be continued from the title screen.

### Controls

- WASD / arrow keys: move
- Space: send a sonar pulse; lights nearby corridors but attracts the hunter
- F: deploy a flare; stuns the hunter and sends it away (recharges after 9 seconds)
- Escape: pause / resume
- Touch: directional pad and on-screen sonar/flare buttons on narrow/coarse-pointer devices

## Included

- index.html — entry page
- style.css — responsive interface and visual styling
- game.js — procedural map generation, collision, AI/pathfinding, progression, rendering, controls, and save system
- favicon.svg — original lightweight project mark
- game-development-skill.md — portable reusable development workflow

## Credits and limitations

Game design, visuals (procedural Canvas drawing), code, and interface are original. No third-party art, music, or runtime library is bundled. This release has no audio: the platform's sound-generation quota was unavailable during development, so gameplay feedback is conveyed visually; the settings panel does not pretend otherwise.

The downloadable release is the source folder; there is no native executable or installer because this is a static web game. Use a current Chromium, Firefox, or Safari browser. Saves are local to the browser/device and do not sync.

## Release notes — 1.0

- Three increasingly air-starved, procedurally generated depths
- Fog-of-war exploration, sonar reveal/attraction, a roaming pathfinding hunter, one flare per cooldown, air recovery, core collection, and hatch escape
- Persistent in-progress expedition, pause/resume, restart, settings, keyboard and touch controls
- Reduced-motion and high-contrast preferences

## QA performed

- Loaded the project in the headless preview and visually inspected the title screen.
- Started a dive and verified the depth/air/core HUD appears.
- Sent sonar with Space and verified the in-game sonar feedback appeared.
- Paused with Escape and verified the pause/resume and abandon controls.
- Checked browser console during that play session: no JavaScript errors or warnings.
- After adding the local favicon and removing remote font dependencies, ran a final preview page check: no console output or errors.

These are the tests actually performed; they are not a claim of exhaustive completion of every route or ending.
