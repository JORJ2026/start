# Pelagic

**PELAGIC — The sea remembers what the light forgets.** A compact, original, browser-native night-sea expedition.

## Play
Open index.html in a modern desktop or mobile browser, or serve this folder with any static web server. There is no build step, installer, backend, account, API key, or runtime dependency. Keep the audio/ folder beside the page so the bundled soundscape loads.

Desktop: move with **WASD** or **arrow keys**, send a sonar pulse with **Space**, pause with **Esc**. Controller: move with the **left stick** or **D-pad**, pulse with **A** or **RT**, pause with **Start**; D-pad/left stick navigate menus, **A** confirms and **B** goes back. Touch devices: drag the left virtual stick and tap **PING**. Audio begins after the first interaction.

## The voyage
Recover four memory fragments on each of three increasingly dangerous depths, then reach the signal gate. A pulse briefly lights a broad ring and stuns nearby creatures; its charge returns over time. Rocks block movement. Stalkers close in, while drifters wander across your path. At the boundary between depths, choose one of three upgrades. Your hull, upgrades, and current map are saved locally; best completion time is stored on the same device.

## Release contents
- index.html — launch page
- style.css, game.js — interface, simulation and rendering
- audio/abyss.wav, audio/ping.wav, audio/shard.wav — original bundled procedural audio
- skills/indie-game-dev/SKILL.md — portable reusable development workflow

## Credits & rights
Game concept, text, code, canvas illustrations, and audio waveforms are original for this release. The audio is procedurally synthesized and bundled as WAV. No third-party art, music, fonts, libraries, or external runtime are used. The work may be reused and modified; attribution to the original project is appreciated but not required.

## Release notes · 1.1
- Standard Gamepad API support: analog stick/D-pad movement, A/RT sonar, Start pause, and A/B plus directional menu navigation.
- Three freshly composed expedition depths per run.
- Sonar exploration, collectible fragments, reactive threats, collision, hull damage, upgrade decisions, local saves, pause, completion, and replay.
- Responsive keyboard and touch input; separate ambience and effect levels, plus global mute.
- No known blockers. See the release summary for QA notes.
