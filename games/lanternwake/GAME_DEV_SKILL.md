# Reusable Skill: Small-Game Studio Workflow

## Purpose
Ship a cohesive, playable small game rather than a feature list or prototype. Prioritize one signature mechanic, strong feedback, complete state transitions, and a clean release.

## 1. Concept selection
1. Generate several concepts privately; compare identity, minute-to-minute play, mastery, replay value, feasibility, and visual/audio opportunities.
2. Pick the concept with the most distinctive repeatable decision, not the largest scope.
3. Write one sentence for the player fantasy, one for the core loop, and one for the risk/reward trade-off.
4. Reduce scope until a complete beginning, escalation, failure, and ending can be built in the available runtime.

## 2. Architecture selection
1. Inventory actual platform constraints and delivery rules before choosing an engine.
2. For a lightweight 2D web game, use a static entry page, separate CSS and JavaScript modules, Canvas 2D, and browser storage.
3. Keep simulation independent from rendering; clamp frame delta and use a fixed update step.
4. Keep assets local and optional platform dependencies out of the critical path.

## 3. Implementation procedure
1. Establish scene/state transitions and input before adding content.
2. Implement movement, collisions, objective, enemy response, failure, and success using placeholder primitives.
3. Add seeded content generation or authored levels only after the core loop is traversable.
4. Keep state authoritative in one game object; centralize UI/HUD updates and persistence.
5. Make actions legible with visual, audio, and textual feedback; add one accessible explanation in context.
6. Treat keyboard, touch, pause, restart, continue, and reduced-motion behavior as first-class.

## 4. Asset generation
1. Use image-generation tools for shipped raster art, then crop/resize with Pillow when needed; do not hand-draw SVG as raster art.
2. Prefer procedural geometry for deliberately abstract/vector-like Canvas scenes.
3. Generate or compose original sound. Provide independent volume/mute behavior and start playback only after a user gesture.
4. Document original assets, external fonts, and any fallback requirements.

## 5. Gameplay integration
1. Ensure every mechanic supports the core loop.
2. Make each optional risk/reward choice observable and reversible where reasonable.
3. Check reachability of generated objectives and exits; keep a fallback route.
4. Persist only deliberate checkpoints and version saved data.
5. Test loss, recovery, completion, and restart paths, not only the happy path.

## 6. Automated and manual QA
1. Load the real entry page and inspect console/network errors.
2. Use a browser playtest for requested interaction flows; inspect an accessibility snapshot and console.
3. Check narrow/short viewports, keyboard/touch visibility, and focusable controls.
4. Run functional, player-experience, and release-readiness passes.
5. Distinguish observed tests from code review; never claim a workflow was tested unless it was.

## 7. Balancing and optimization
1. Start from movement speed, collision radius, hazard speed, cooldown, and objective spacing; tune them against traversal time.
2. Add complexity by changing pressure or layout, not by adding disconnected systems.
3. Bound delta time, cap device pixel ratio, avoid per-frame DOM updates, and reuse static content where practical.
4. Use cheap local visibility checks before detailed rendering; avoid unnecessary network/API work.

## 8. Release validation and packaging
1. Confirm index.html is the actual entry, not a redirect or loader.
2. Confirm every relative asset path exists and the game runs without API credentials.
3. Include launch instructions, controls, credits/license notes, release notes, and known limitations.
4. Build a ZIP from source/assets; exclude temporary files and QA outputs.
5. Recheck the packaged file list and entry point, then provide the playable preview and source package.

## Lessons from Lanternwake
A single risk/reward action (mapping also attracts danger) creates strategic choice without a large ruleset. Seeded generation varies layouts; validating connectivity matters more than adding random obstacles. Procedural geometry and authored copy create identity without a heavy art pipeline. Browser storage and static assets preserve an offline-capable core loop.
