# Deep Current

A self-contained underwater exploration game. Recover three signal fragments in each of four dives, manage oxygen, avoid the hunter, and choose one vessel adaptation between depths.

## Play

- **Websim:** open the project preview; no install or account is required.
- **Local:** extract the release archive and serve this folder with any static web server. For example, run `python3 -m http.server 8000` here, then open `http://localhost:8000`. This avoids browser restrictions on JavaScript modules opened directly from `file://`.
- Works in current desktop and mobile browsers. It has no runtime network dependencies; typography falls back to system sans-serif and monospace fonts.

## Controls

| Input | Action |
|---|---|
| WASD or arrow keys | Pilot |
| Space or click/tap the playfield | Sonar pulse (reveals the trench and draws the hunter) |
| Esc or the pause button | Pause / resume |
| Mobile on-screen pad and PING button | Pilot / sonar |

Recover three signal fragments to activate the exit. Air canisters refill oxygen. Colliding with the hunter costs oxygen. A dive can be retried without losing earned adaptations. Progress and sound preferences are saved in local storage.

## Release contents

- `index.html` — launch page
- `style.css` — layout and interface
- `game.js` — simulation, rendering, audio, saves
- `PORTABLE_GAME_SKILL.md` — reusable development workflow

## Credits & licensing

Original game concept, code, procedural canvas art, and Web Audio soundscape created for this project. No third-party art, music, libraries, or fonts are bundled. The project is provided as source; all included work may be reused and modified.

## Release notes

**1.0 — Deep Current**
- Four authored-by-seed trench dives, a sonar-seeking hunter, currents, collisions, oxygen, salvage, and three collectible signals per dive.
- Three post-dive adaptation choices, retry, pause, title, settings, credits, and a complete ending.
- Responsive touch controls, local save/continue, and locally generated ambient/effect audio with volume and mute controls.
