# Technical Architecture

## Runtime and modules
Pure ES modules, Canvas 2D, CSS; index.html is the served entrypoint. No libraries, remote fonts, server, build stage or API are needed.
- content.js: authored operations, regions, specialists, adversaries, doctrine, relics and milestones.
- engine.js: seeded PRNG, map construction, weighted movement, line of sight, A* routing, combat, objectives, skills, enemy decisions and round transitions.
- app.js: campaign orchestration, event delegation, save state, UI, canvas and audio.
- styles.css: responsive visual system.
- assets/ and audio/: generated local raster art and bundled WAVs.

## Implemented algorithms
1. Seeded procedural generation: integer PRNG derives from authored operation and campaign seeds; generates rocks, wrecks, water, mud and ruins, then repairs deployment/objective lanes for traversability.
2. Weighted Dijkstra reachability: priority-ordered frontier returns valid move tiles within current AP. Mud costs two; obstacles and occupied cells are excluded.
3. A* hostile routing: four-neighbor search toward a firing/objective-adjacent tile; terrain costs and occupied cells affect route, utility selects a next step.
4. Bresenham-style grid line traversal: hard rock blocks attacks.
5. Utility-based agent behavior: five roles score attack, objective pressure, flanking, allied support, disruption, wounded-target pursuit and cover.
6. Deterministic combat rolls: seeded pseudorandom hit/miss uses range, aim, cover, doctrine and difficulty.
7. Persistent structured state: campaign, resource, injury, unlock, map and turn state serialized to versioned localStorage keys.

## State and performance
Campaign holds durable resources, selected roster, wounds, records, milestones, doctrine, statistics, route and seed. Tactical game state contains grid, AP, positions, objectives, logs and phase. Successful extraction commits rewards once per operation ID; withdrawal doesn't complete it. Reload restores the tactical encounter.

Canvas is capped at device pixel ratio 2 and redraws on state changes only. The 12 × 9 grid and at most seven hostile agents bound computation. No idle animation loop. Responsive layout collapses on narrow screens.

## Offline audio
Bundled WAVs use shaped stochastic noise for ocean/wind/hull ambience and a short noise-driven mechanical transient. Audio begins after user input and respects local volume/mute settings. No remote media or synthesized oscillator beeps.
