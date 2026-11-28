# Reusable Skill: Small Web Game Production

## 1. Select a concept
- Generate several short pitches privately; compare originality, one-sentence play loop, visual identity, replay value, and finishability.
- Choose one expressive mechanic that can be understood by doing. Make every extra system reinforce it.
- Define the smallest complete arc (start, learn, mastery, ending) before adding content.

## 2. Choose architecture
- For a self-contained browser game, prefer static HTML/CSS/ES modules and Canvas 2D when the artwork is mostly procedural or sprite-based.
- Keep entry markup, responsive styles, and game logic in separate files. Avoid build tooling and remote runtime dependencies.
- Use one simulation update loop with clamped delta time and a separate renderer. Keep save data versioned and defensively parsed.

## 3. Build the playable loop
- Implement input, movement, collision, objectives, fail/recovery, completion, and restart before decoration.
- Make generated levels connected by construction; compute reachable placements with flood-fill/BFS rather than relying on random coordinates.
- Keep interaction feedback legible at a glance. Use brief invulnerability/recovery windows after damage.
- Store only durable progress in local storage; test malformed and missing saves.

## 4. Create coherent assets
- Establish a compact palette, a small set of shapes, and a light/material rule before producing content.
- Use generated images for shipped raster art; use procedural geometry for genuinely dynamic canvas effects.
- Generate original sound assets when available; when a generation service is unavailable, continue without claiming an asset and use only lawful, self-created sound.
- Bundle assets locally and document provenance and licenses.

## 5. Integrate and polish
- Test at desktop and narrow/touch dimensions. Provide equivalent keyboard and touch actions where practical.
- Add onboarding at the moment of need; keep title, HUD, pause, settings, and completion concise.
- Persist volume and progress; make audio start from a user gesture and gracefully handle autoplay rejection.
- Watch for avoidable per-frame DOM writes, unbounded allocations, and frame-rate-dependent movement.

## 6. QA and balancing
- Pass 1 — functional: start, continue, movement, wall collision, interaction cooldown, objective gating, damage/recovery, game over, level transition, win, restart, and save/load.
- Pass 2 — player experience: readability, pacing, fair threat telegraphs, visible feedback, touch reach, and concise controls. Adjust one variable at a time.
- Pass 3 — release: serve from the actual static host, inspect console/network errors, verify every local asset, check responsive layout, and package only required files.
- Report only what was actually exercised; keep untested paths clearly identified.

## 7. Packaging
- Include launch instructions, controls, credits/licensing, release notes, and known limitations beside source and assets.
- Produce a ZIP from the finished workspace and verify its archive listing. Do not describe a web source bundle as a native executable.

## Lessons from The Deep Archive
- A carved maze plus BFS gives generated variety while preserving guaranteed reachability.
- Local visibility and a short global pulse make exploration legible without a minimap.
- HUD text should refresh on a modest timer instead of every frame.
- A persistent save should record collected room objectives as well as the room index, or continue can restore an inconsistent state.
