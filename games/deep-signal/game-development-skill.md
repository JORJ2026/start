# Portable Skill: Small Web Game Studio

Use this workflow to ship a compact, polished browser game in a static-file workspace. Keep the playable entrypoint real (index.html), split markup/style/logic into separate files, and avoid unnecessary build systems.

## 1. Choose a concept

- Generate several ideas privately; compare originality, player-facing hook, input clarity, systemic depth, scope risk, and whether a complete ending can fit the time budget.
- Choose one central verb and one memorable tension. Avoid feature lists that do not reinforce it.
- Define a complete loop: goal → action → feedback → pressure/choice → reward → next goal → loss/win → replay.
- State hard boundaries early: session length, input devices, asset budget, external dependencies, and what will be cut.

## 2. Choose the architecture

- Prefer canvas for a custom game field, semantic HTML for menus/HUD, and standalone CSS/JS for static deployment.
- Keep simulation state separate from rendering. Use a clamped delta-time update loop and a requestAnimationFrame renderer.
- Use deterministic seeded randomness when generated content must be reproducible or serializable.
- Keep entity and map schemas plain-data/JSON where possible so saves are straightforward.
- Avoid frameworks, remote APIs, bundlers, service workers, and network assets unless they materially improve the game.

## 3. Build the minimum complete loop first

1. Implement map/world creation and player spawn.
2. Add movement, collision, and camera.
3. Add objective objects, win gate, resource pressure, and explicit loss state.
4. Add one opponent behavior with a simple, explainable response to player actions.
5. Add progression and restart before decorative polish.
6. Add HTML title/pause/end/settings screens and keyboard/touch controls.
7. Persist only useful, versioned, JSON-safe state; catch malformed saves and provide a clean restart.

## 4. Generate and integrate assets

- Establish a compact palette, shape language, lighting model, and interface typography before filling the screen.
- Use platform asset-generation tools for shipped raster art; crop/resize generated raster assets off-page with image tooling. Procedural canvas geometry is appropriate for dynamic game geometry and UI-like marks.
- Keep asset paths relative and test missing assets. If generation or quota is unavailable, make a deliberate asset-light art direction and disclose omitted audio/art rather than faking an asset.
- Do not claim audio or other systems that do not exist. Respect licenses and list provenance.

## 5. Make the play readable

- Put the current objective, vital resource, and progression state in one unobtrusive HUD.
- Tie player actions to instant visual/audio feedback; make danger legible before it becomes lethal.
- Teach through the first encounter; put a concise reference behind a controls button.
- Support focus states, touch hit areas, reduced motion, and contrast preferences when practical.
- Keep mobile controls from covering the playfield or blocking menus.

## 6. Test in three passes

### Functional
- Open the actual entry URL; start and restart; test every input; collide with boundaries; activate each mechanic; verify save/continue, pause, loss, progression, and ending conditions.
- Inspect console/network failures; distinguish game errors from platform/asset failures.

### Player experience
- Assess whether the objective is discoverable, feedback is clear, resources are fair, difficulty escalates, and controls feel responsive.
- Test narrow and short viewports; use contrast/reduced-motion preferences.
- Remove dead UI, false promises, and unhelpful copy.

### Release
- Confirm static entrypoint, explicit local paths, no accidental external runtime requirement, sane responsive behavior, and safe persistence.
- Create a source archive and a README with play instructions, controls, credits, licensing, release notes, limitations, and actual test results.
- Never present untested paths as verified; state what was actually exercised.

## 7. Performance and balancing

- Clamp large frame deltas after tab suspension; avoid per-frame allocations where they matter.
- Bound path searches and update AI at a lower cadence than rendering; use grid navigation for maze-like maps.
- Tune resource budgets against expected travel time and recovery placements. Make exits and objectives reachable by construction.
- Test generated content across multiple seeds when feasible; add fallbacks for placement failure.

## Lessons from Deep Signal

- A single action can carry both information and risk: sonar reveals space but gives the pursuer a destination.
- Persistent visibility and temporary visibility make exploration legible without a permanent minimap.
- A small count of connected systems (air, cores, sonar, flare, hunter) is deeper than adding unrelated upgrades.
- Asset quota failure should reduce scope honestly, not be hidden behind synthetic placeholder audio.
