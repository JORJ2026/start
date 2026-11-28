# Portable Skill: Small Indie Game Delivery

Use this as a repeatable workflow for finishing a compact browser game in a static-file workspace.

## 1. Concept selection

- List several distinct loops before coding: what the player does every 5 seconds, what changes over a minute, and what closes a run.
- Choose a concept with one legible verb, one meaningful resource, one pressure source, and a naturally bounded ending.
- Avoid a feature list as a substitute for a distinctive interaction. Make each upgrade or collectible change how the loop is played.
- Write a one-sentence promise and a 4–6 bullet mechanic spec. Scope the content to the time available.

## 2. Architecture selection

- Prefer the least complex runtime that serves the game: DOM for text/puzzle games, Canvas 2D for bespoke moving worlds, WebGL only when 3D materially improves play.
- Keep an explicit entry document plus separate CSS and JavaScript modules. Use relative paths and no build step.
- Separate simulation, rendering, interface state, input, save data, and audio. Keep world coordinates independent of viewport size.
- Use a fixed simulation step with a capped frame delta; render on requestAnimationFrame. Resize the canvas for device pixel ratio, with a practical upper bound.
- Make the core loop offline-capable. Bundle dependencies or remove them; do not require API keys.

## 3. Implementation procedure

1. Build one playable room and movement first.
2. Add collision and bounds before adding more content.
3. Implement the objective and a win condition, then a failure/retry condition.
4. Add pressure and resource feedback, with adjustable values centralized in code.
5. Add procedural or hand-authored content only after a whole loop works.
6. Add a title, pause, controls, settings, progression choice, and ending as explicit states.
7. Save only the small durable state; validate parsed local storage and provide a fresh-start path.
8. Add touch controls if the game is expected to run on phones.

## 4. Asset and audio workflow

- Establish a palette, shape language, and contrast rules before producing many assets.
- For shipped raster art, generate an original image asset, then crop/resize it with Pillow; avoid page-side spritesheet slicing.
- For procedural visuals, use a small consistent vocabulary of shapes and keep per-frame allocations bounded.
- Prefer original audio assets or local procedural noise/audio synthesis. Do not use copyrighted music or random hotlinks. Start audio only after a user gesture, expose volume/mute, and degrade gracefully if Web Audio is unavailable.
- Credit the assets actually included; do not imply generated audio or art exists when it does not.

## 5. Gameplay integration and balance

- Integrate mechanics in the playable loop, not as disconnected menus.
- Model player movement with delta time, collision response, explicit invulnerability windows, and visible damage feedback.
- Make objectives readable in both world-space and HUD. Prevent procedural spawns from overlapping blockers or each other; bound retries when searching for valid positions.
- Tune resource time against likely travel time. Ensure recovery items, safe routes, and upgrades can counter pressure without making it irrelevant.
- Keep upgrades mutually distinct and cap them so later choices remain useful.

## 6. Automated and manual QA

- Load the entry page in a headless page check. Fix JavaScript exceptions, missing assets, and avoidable network failures.
- Use one visual screenshot for first-pass composition; compare menu and gameplay separately when possible.
- In a short browser session, test: start, movement, one signature ability, pause/resume, controls, one objective, failure/retry, progression, restart, and save/continue.
- Check the console after interactions. Close the browser when done to stop loops and timers.
- Do not claim a full workflow if the run did not reach it. Log what was actually tested and list unverified paths.

## 7. Performance and release

- Keep simulation and render responsibilities separate; cap delta after tab stalls and use a fixed step for collision-sensitive motion.
- Avoid creating large arrays or canvases every frame; reuse offscreen surfaces and cap device pixel ratio.
- Test responsive sizing, readable contrast, keyboard focus/labels, and touch pointer cancellation.
- Deliver launch instructions, a control table, credits/licensing, release notes, all source/assets, and a portable archive. Verify archive contents and ensure its entry file is at the expected root.

## Lessons from Deep Current

- Sonar is strongest when it is both information and risk: each reveal helps navigation while giving the hunter a place to investigate.
- Resource values must be paced against traversal: roughly one oxygen unit per second makes a dive legible without an abrupt timer.
- A separate offscreen darkness mask is required to reveal a world beneath fog; erasing the main canvas only exposes the page background.
- A generator should reject candidate objectives that overlap obstacles, and sonar clicks need a cooldown to protect both pacing and performance.
