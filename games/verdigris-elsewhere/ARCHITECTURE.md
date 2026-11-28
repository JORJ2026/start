# Technical architecture

Plain static HTML, CSS, and ES module JavaScript; native DOM and browser APIs. No runtime framework, build pipeline, remote backend or game-service dependency. The authored map uses accessible buttons positioned over an SVG route overlay, not a canvas simulation. Game is event-driven: render on state/view transitions and never poll an idle loop.

## Implemented algorithms / architecture
1. Evidence-tag inference: for each interpretation, compute the overlap score against found traces; evaluate selected score against the best current score and threshold to mark supported or contested.
2. Frontier progression graph: ten region nodes connected in authored order; completion count gates successive landing nodes and their associated authored investigations. Supply links are a distinct editable edge set.
3. Fixed-order cycle simulation: production, route deliveries, difficulty-scaled upkeep, shortage damage, five condition-driven agent behaviors, ecological drift, population, timed event, milestones. This is utilized by all time-advancing actions.
4. Campaign state machine: title, map/case/inheritance/supply/archive views; available, locked, active and resolved investigations; campaign completion and two state-dependent endings.
5. Deterministic hybrid inheritance: outcome selection is derived from lineage/cycle/clue state, avoiding random rerolls; trait effects interact with production and clue costs.
6. Versioned local persistence: validate version and shape, guard JSON/localStorage errors, save after actions, export as JSON file.
7. Bounded-resource model: utility clamps bound supplies and social/ecological stats; buttons disable unavailable actions.

## State ownership
One campaign object owns difficulty, cycle, resolved cases, per-case observations, resources, colony stats, opened/surveyed regions, routes, traits, gene discoveries, branch levels, research, projects, event log, milestones, ending and sound settings. Storage key: verdigris-save-v1. View selection and selected interpretation remain transient UI state.

## Runtime and performance
One 456 KB local illustration, 16-bit stereo 12-second ambient WAV, local CSS and JS, no animation loop and no repeated network polling. Page scales to mobile through CSS grid and media queries. Audio begins after a user gesture and can be muted. localStorage failures are guarded. Google Fonts is an optional external typography enhancement; fallback fonts are defined. All game functionality and art work with the local assets, and all forms/buttons are native semantic controls.
