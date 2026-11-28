# Indie game development skill (portable)

Use this workflow when an agent must deliver a complete, small web game rather than a concept or mockup.

## 1. Select a concept
- Generate several contrasting pitches privately: core verb, player fantasy, repeatable loop, meaningful risk, signature sensory hook.
- Score originality, moment-to-moment fun, depth, legibility, replayability, accessibility, and feasibility in the available runtime.
- Reject concepts whose novelty depends on prose alone. Pick one mechanic that changes decisions every few seconds and let art, sound, and progression reinforce it.
- Define the 30-second loop, failure condition, victory condition, one progression choice, and a realistic content limit before coding.

## 2. Select architecture
- Inspect the existing workspace before modifying it. Preserve unrelated project files.
- For a self-contained browser arcade/exploration game, use static HTML + external CSS + module JavaScript and Canvas 2D. Keep simulation, rendering, UI, and persistence logically separated. Add no build system or external runtime unless the experience truly requires one.
- Use delta time with a capped frame step; keep world coordinates independent of CSS pixels; cap device pixel ratio; make camera and resize behavior explicit.
- Save a versioned, JSON-serializable snapshot and preferences in localStorage. Handle absent or malformed saves; never persist transient DOM state.

## 3. Build the minimum complete loop first
- Implement input, movement, bounds, obstacles, objective state, hazards, health, success/failure, restart, and pause before decorative polish.
- Test every state transition as soon as it exists. Keep one authoritative run state; derive HUD from it.
- Make procedural content obey spawn-clearance and goal-reachability constraints. Keep random generation bounded and deterministic where reproducibility helps testing.
- Make upgrades change real simulation values, and ensure each remains useful when offered (especially health at full health).

## 4. Art and audio pipeline
- Create a compact visual grammar: palette, shape language, lighting rules, animation cadence, type scale, and spacing. Draw procedural vector/canvas art only when it is deliberate, not as placeholder geometry.
- If generated raster assets are needed, use the available image-generation workflow, then crop/resize/split assets offline. Bundle files with relative paths.
- Prefer original bundled audio. When generation services are unavailable, choose silence or carefully designed procedural synthesis—not broken hotlinks. Trigger audio only after a user gesture, gracefully handle autoplay refusal, provide separate levels and mute, and check loops for clicks.
- Credit original/generated work honestly; do not imply external assets or features that are not present.

## 5. Integrate UX
- Include a first-launch entry, new/continue, concise controls, settings, pause, completion/failure, and replay. Explain only what players need at the moment they need it.
- Add touch controls only when appropriate; preserve keyboard operation and accessible button names. Keep menus short and the playfield dominant.
- Make intent visible through movement, light, animation, and sound; do not hide critical progress behind decoration.

## 6. Three-pass QA
**Functional:** check page load, assets, keyboard/touch paths, collisions, cooldowns, pickups, progression, upgrade effects, save/restore, pause/resume, restart, win/loss, and malformed-save recovery. Use page checks for console/network errors; use browser interaction only when requested or when needed to reproduce an interaction bug.

**Experience:** inspect the actual screenshot at desktop and narrow aspect ratios. Check hierarchy, contrast, hit targets, motion, pacing, fairness, and whether the signature mechanic reads instantly. Tune and retest affected paths.

**Release:** verify relative paths, offline/static launch, mobile layout, no unlicensed dependencies, complete source/assets, controls and credits, and a reproducible archive. Report only checks actually run; list remaining limitations.

## 7. Balance and optimize
- Tune around a target session length. Track enemy pressure, resource cadence, error forgiveness, and time-to-understand; avoid adding systems just to inflate scope.
- Avoid per-frame allocations in hot rendering paths; reuse canvases and arrays. Bound entity counts, cap frame delta and pixel ratio, and profile only with real measurements.
- Keep simulation alive independently of rendering where useful; honor reduced-motion preferences where motion is intense.

## 8. Package
- Make index.html the actual entrypoint and provide a short title.
- Include a plain README, launch steps, controls, original-asset credits/licensing, release notes, known limitations, and this portable skill file.
- Create a ZIP containing the complete runnable folder. Validate the archive listing and re-open the live preview after final edits.
- Do not claim an executable, screenshots, tests, or performance numbers that were not actually produced.

## Lessons from Pelagic
- A sonar pulse serves both navigation and threat control, so its cooldown creates a constant, understandable decision.
- Temporary darkness works only when the objective's sound/light language remains distinct from hazards.
- A small three-depth run supports a meaningful upgrade choice without requiring an unfinished content pipeline.
- Reuse the light-mask canvas instead of allocating one per frame; keep save state available across transitions, not only during active play.
