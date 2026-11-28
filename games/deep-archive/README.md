# The Deep Archive

A self-contained browser game about a drifting light finding its way through three drowned maze halls. Canvas 2D, plain JavaScript/CSS, locally bundled artwork and original generated audio. No account, server, build step, game library, or network dependency is needed to play.

## Play

Open the project preview, or extract the release and serve its folder over HTTP: run **python3 -m http.server 8000** in the game directory, then visit http://localhost:8000. ES modules and audio work best over HTTP rather than file://.

## Controls

- **Keyboard:** WASD or arrow keys to move; Space or Shift to pulse; Esc or P to pause. In menus, Up/Down changes focus, Enter/Space activates, and Esc goes back.
- **Standard Gamepad:** left stick or D-pad to move; A / Cross to confirm; B / Circle to back or resume; X / Square or right bumper to pulse; Start/Menu to pause or confirm. The settings panel reports connection state. Standard browser Gamepad API mapping is used; exact labels depend on the controller.
- **Touchscreen:** hold the four-way compass to move, and tap the star button to pulse. The touch controls appear on touch-capable/coarse-pointer devices.

Collect three fragments to open each hall's exit. Wraith contact costs a heart and returns you to the entrance. Pulse temporarily reveals unseen corridors and stuns threats. Complete three progressively more populated procedural halls. Continue progress, fragments, and audio preferences are saved locally.

## Menus & sound

The boot screen preloads the local cover and audio before opening the title menu. The title offers Begin, Continue (when a save exists), and Settings. The pause menu has Resume, Settings, Restart this hall, and Leave the dive. Settings provides independent Music and Sound Effects sliders, a master mute switch, fullscreen, and all input mappings. Audio starts after the first user interaction and degrades gracefully if autoplay is denied.

## Files

- index.html — launch/loading/menu markup
- game.js — game rules, controller and keyboard input, touch input, settings, save, and renderer
- style.css — responsive visual system and menu layouts
- assets/archive-cover.jpg — original generated key art
- audio/archive-score.wav — original loopable score
- audio/star-chime.wav, audio/light-pulse.wav, audio/wraith-hit.wav, audio/menu-tick.wav — original feedback effects
- audio/make_audio.py — reproducible procedural audio source (Python 3 + NumPy)
- SKILL.md — portable game-development workflow

## Credits & licensing

Design, writing, code, procedural game visuals, and audio composition are original for this project. The cover illustration was generated specifically for the game; in-game stonework, diver, wraiths, fragments, and lighting are rendered in Canvas 2D. Audio assets were synthesized specifically for this release; the included script regenerates them using NumPy. No third-party game art, game engine, or music is bundled. Fonts use system sans-serif/monospace stacks. The cover is bundled locally, so play does not require a remote service.
