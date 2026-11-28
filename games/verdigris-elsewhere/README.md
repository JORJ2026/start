# Verdigris Elsewhere — Field Edition

A local-first browser detective adventure. The live Websim project opens directly. For the portable ZIP, extract the folder and serve it with any static HTTP server; for example, run `python3 -m http.server 8000` from the extracted directory and visit `http://localhost:8000`. Modern browsers may block ES modules opened from a `file://` URL. No build step, account, package manager, application server or external game runtime is required. Google Fonts are optional; local system fallbacks work offline. The illustration and generated ambience are local assets.

## Controls
- Mouse/touch: chart regions, inspect evidence, choose interpretations, manage the colony.
- Keyboard: Tab / Shift+Tab to move, Enter/Space to activate, Escape to pause.
- Save: automatic in localStorage. Archive → Export save downloads a JSON backup.
- Sound & controls is available from title, pause, and archive screens.

## Files
index.html, style.css, app.js, assets/verdigris-frontier.png, assets/field-ambience.wav, DESIGN.md, ARCHITECTURE.md, TESTS.md, RELEASE_NOTES.md, SKILL.md.

## Audio
The loop is an original local procedural soundscape; interface and discovery tones are synthesized with Web Audio after interaction. No external stream is used. Audio generation service was unavailable, so no generated SFX clips are claimed.
