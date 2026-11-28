# Autonomous Indie Game Development Skill

A reusable workflow for producing an honest, playable indie game from a randomized prompt.

## Random concept generation
Use an OS-backed random seed through an execution tool before creative decisions. Independently draw every requested category. Record seed, number and literal chosen item. Never reroll. Reconcile unusual combinations by preserving the defining mechanics and theme of every selection.

## Design and architecture
Read the existing project before touching files. Draft a concise GDD with role, premise, campaign, player loops, short/medium/long goals, mechanics, interactions, progression, authored content, challenges, replay, endgame and technical requirements. Make a requirements-to-source matrix. Choose architecture because it serves the actual mechanics, not because it is easiest. Keep entrypoint and assets self-contained and obey the host's static files/build conventions.

## Complex systems
Define one authoritative state model, valid preconditions, mutation order, resource bounds and persistence. Build at least five working techniques (such as inference scoring, graph progression, cycle simulation, behavior/utility agents, state machines, deterministic procedural generation, pathfinding or physics), then exercise those techniques in player actions. Establish at least three viable strategies, cascading consequences, understandable recovery and a complete ending. Do not claim enemy AI or pathfinding when the game's genre does not use them; substitute domain-relevant agents and document the adaptation.

## Original content and art
Create distinct, authored places, characters, evidence, objects, events, choices, milestones and consequences. Meet counts through differentiated content, not renamed copies. Generate original raster art through the approved asset generator and use the project image processing tools for edits. Use local sound assets when available; if generation quota is unavailable, disclose it and use honest local synthesis or silence with real mute controls. Avoid streaming/external gameplay dependencies. Match the randomized art direction throughout interface, scene art, type and effects.

## Implement, integrate, package
1. Inspect existing workspace.
2. Randomize all dimensions and log outputs.
3. Write GDD, scope and test plan.
4. Create separate entry, stylesheet, game module and asset directories.
5. Implement state transitions and authored data.
6. Wire all mechanics to player-visible consequences.
7. Add saving, new/continue, options, controls, pause, completion and replay.
8. Integrate original assets and local audio.
9. Verify source syntax, paths, counts, transition gates and basic responsiveness.
10. Run first-build screenshot and page check once; repair observed issues.
11. Make an archive/package only when it actually exists; include source, assets, docs, controls and launch instructions.
12. State clearly what was and was not interactively tested.

## Three QA passes
Functional: controls, every action, simulation order, AI behaviors, progression, saving, transitions and ending. Experience/content: strategy diversity, difficulty, distinct locations/cases, readability, feedback, art/audio, mobile accessibility and replay. Release: clean startup, local paths, browser compatibility, performance, save integrity, complete workflow and package contents. Separate static inspection from executed tests. Never fabricate checks; repair discovered defects and rerun the affected test.

## Anti-lightweight release gate
Reject a build whose loop is one repetitive action, systems are disconnected, content exhausts quickly, only numbers progress, agents are trivial, locations are interchangeable, decisions do not persist, visuals are placeholders, or the product resembles a tutorial. Add interconnected content/mechanics rather than filler text. For limits that remain, document the substitution and do not claim unsupported functionality.
