# Lanternwake

A self-contained browser game about guiding a skiff through a drowned archive. Find three memory echoes in each of four sectors, then use their resonance to locate the gate home. Sonar reveals the dark—but the things in it hear you too.

## Play
Open index.html in a modern browser, or serve this folder over HTTP. No build step, account, or runtime API is required. Progress and audio preferences are stored locally in the browser.

## Controls
- WASD / arrow keys: steer
- Space / E: sonar pulse (recharges in 2.25 seconds)
- Esc: pause / resume
- Touch: on-screen directional pad and Pulse button

Collect the three diamond echoes and reach the ring gate. Currents speed your skiff but tug it off course. A pulse reveals a wide area and draws nearby listeners toward its source. Hull integrity is limited to three strikes; recovered memories persist through a dive.

## Package contents
index.html, style.css, and game.js are the launchable source; audio/ holds original audio; GAME_DEV_SKILL.md is a portable reusable workflow. release.zip bundles the release files.

## Credits & licensing
Game design, writing, procedural Canvas 2D artwork, code, and synthesized audio are original for this project. The stylesheet references DM Mono and Manrope from Google Fonts when online; system font fallbacks are included. No external game engine, image, or API is required.

## Release notes
Four sectors with procedural layouts, sonar mapping and enemy lure, currents, collectible story fragments, integrity, save/continue, pause, settings, and touch controls. Canvas 2D scales to the viewport; save and audio preferences use localStorage.

## Known limitations
Keyboard controls are best for desktop; touch uses discrete directional buttons rather than a virtual analog stick. Sound and interface remain functional if browser autoplay is restricted (audio begins after the first user action). Font delivery can fall back to system fonts when offline.
