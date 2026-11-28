# Tide of Cinders — Field Edition 1.0.0

An offline, browser-playable tactical colony campaign. Choose four specialists from an eight-person roster and deploy across twenty linked operations on Pelagos, a hostile ocean world. Tactical outcomes change crew condition, salvage, routes, doctrine, and available supplies.

## Launch
Serve this folder with a static HTTP server (ES modules are blocked by browsers when opened as file://). For example, run python3 -m http.server 8000 in the project folder, then open http://localhost:8000. On Windows, py -m http.server 8000 works with the Python launcher. Alternatively open the hosted Websim project directly. No build tools, package manager, network connection, API key or account is required; media and dependencies are local. Campaign and settings use browser localStorage on this device.

## Controls
- Click an operator to select; click a reachable tile to move.
- Select Fire, then click a visible enemy. Clicking a visible enemy directly also fires.
- Interact beside an objective; Field Skill invokes the selected role's ability.
- Brace spends remaining action points to guard. End Round lets enemies act and refreshes the squad.
- Complete operation conditions, then return a living specialist to the gold western flare and choose Extract.
- M selects movement, F selects fire, Enter ends a round, Esc opens pause/settings.

Strategic actions include four-person team selection, medical treatment, a one-use ammunition kit, salvage exchanges for rations or a charged cell, and three sequential doctrine branches.

## Contents
index.html, styles.css, app.js, engine.js, content.js are the runtime. assets contains generated original cover and icon art. audio contains local procedural WAV audio. docs has design, architecture, verification and release notes. SKILL.md documents a reusable development process.

No telemetry, remote service, external font, CDN, or online runtime dependency is used. Clear this site's local storage to delete the campaign. Run the no-dependency smoke test with Node.js 22+: node tests/smoke.mjs. See docs/verification-matrix.md for tests and limitations.
