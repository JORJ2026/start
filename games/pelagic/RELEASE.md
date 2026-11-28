# Pelagic · release 1.1

A static, self-contained browser game. Launch index.html directly, or serve the project directory with a static file server. No installation or compilation is required. See README.md for the control reference and game rules.

## QA record
- Headless preview load after the final UI update: passed; document title was Pelagic; no console errors or failed network requests were reported.
- Browser session: opened the title, started a dive, confirmed the stage-one objective/HUD, sent movement and sonar keyboard input, opened and resumed pause, returned to title, confirmed Continue voyage appeared, and opened the sound settings showing two separate sliders and global mute. Browser console had no errors or warnings.
- Controller support was added in release 1.1 using the standard browser Gamepad API: left-stick/D-pad movement, A/RT sonar, Start pause, and directional/A/B menu navigation. The mapping was code-reviewed but not tested on a physical controller.
- Source inspection: verified the implemented pickup count gates the exit; completing depths advances into an upgrade selection; hull damage reaches a loss state; completing depth three stores best time and presents a replay; run state is stored and restored locally; sound preferences are persisted. These paths were inspected in code, not all driven to completion in a full playthrough.
- Packaging: archive contents are checked against the listed entry point, source, audio, documentation and portable skill.

## Known QA limits
A complete three-depth run, a deliberate game-over, mobile touch interaction, physical-controller input, and sound output on physical speakers were not driven end-to-end during this pass. No frame-rate or device performance benchmark was measured. The procedural world is replayable, but its random placement is not seeded and strict pathfinding reachability is not formally guaranteed.

## Credits and licensing
All included art, code, writing, and WAV audio are original for Pelagic. Audio is synthesized procedurally; the sound generator was unavailable during development, so no generated third-party asset is included. There are no third-party libraries or fonts. You may reuse and modify the work; attribution is appreciated.
