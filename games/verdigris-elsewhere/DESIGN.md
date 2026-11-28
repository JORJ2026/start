# Game design — Verdigris Elsewhere

## Identity and premise
A philosophical Art Nouveau detective adventure in the post-industrial societies of interstellar colonization. The landing generation inherits a living frontier whose plants, civic records and abandoned machinery preserve competing accounts of the past. The player is the field investigator at an expanding settlement: gather traces, weigh interpretations, and decide what the shared archive will remember.

## Recorded random draw
Seed: 18240392166084411876 (OS-backed random seed; Python random.Random for independent integer draws). Category indices and selections: A 28 — Detective adventure; B 10 — Interstellar colonization; C 9 — Art Nouveau; D 11 — Genetics and inheritance; E 6 — Expanding frontier; F 2 — Philosophical. No reroll.

## Player goals and loops
Short horizon: choose a trace, spend insight, inspect evidence, decide whether another observation is worth the cost. Medium horizon: resolve a case with a supported theory or wait for all three observations and record shared testimony. Long horizon: open each landing, survey distinct environments, keep the colony viable, develop inherited traits and arrive at Far Witness with an archive that can hold disagreement.

Core loop: chart → investigate (two or three observations) → interpret → consequences → resource cycle → expand / survey / research / recover → next mystery. Secondary loops are route logistics, resource recovery and upkeep, inherited-trait discovery/cultivation, hybrid lineage, three research branches, communal trust and milestone pursuit.

## World and authored content
Ten hand-designed regions, each with location, biome, hazard, benefit, coordinates, and two investigations: Glass Orchard, Cinder Quay, Listening Fold, Morrow Steppe, Aster Vault, Sable Aerie, Blue Meridian, Nacre Commons, Rootglass, Far Witness. Twenty authored mysteries each have a unique premise, question, three distinct evidence descriptions and tags, three competing interpretations, a named witness and a thematic conclusion. This yields sixty distinct usable observations. Ten distinct named inherited traits and ten concrete effects. Three branches with four distinct authored progression perks apiece. Thirty named milestone conditions and rewards.

## Systems and consequences
1. Evidence inspection with an insight cost. 2. Tag-overlap inference. 3. Correct/contested conclusions. 4. Shared testimony requiring every trace. 5. Civic trust. 6. Ecological health. 7. Population and crowding. 8. Food production, upkeep and shortage. 9. Water production, upkeep and shortage. 10. Power production, upkeep and shortage. 11. Materials and recovery. 12. Cycle events and bounded stats. 13. Frontier expansion and case access. 14. Regional surveys. 15. Supply route network. 16. Trait discovery/cultivation. 17. Trait-modified production and evidence costs. 18. Hybrid lineage. 19. Fieldcraft/Civic Weave/Living Science research. 20. Five condition-driven autonomous colony agents. 21. Milestones and rewards. 22. Persistent archive and save export. These are connected through player actions and cycle transitions rather than isolated menu counters.

Correct evidence-supported interpretation rewards insight/materials and raises ecology/lineage/trust. A contested interpretation remains playable but damages trust/ecology/habitat. Communal resolution costs an extra clue, raises trust/population and provides food, but is more expensive in time and evidence. Routes provide deliveries and also increase food upkeep as frontier length grows. Poor stores reduce habitat health; low ecology threatens health; trust and traits can support populations or production. Five autonomous agents react to state: mediator responds to low trust; root network propagates in high ecology; conservator trades power/food for water in a shortage; dispatcher diverts convoy goods when food is low; residents react to high population plus low trust. Their effects are called in the live cycle transition.

## Strategies
Efficient inference: two observations and evidence-driven case conclusion, emphasizing field research and low insight costs. Civic: three traces, shared record, civic research, trust and population. Ecological: survey and cultivate lineage, raise ecosystem yields. Logistics: invest in routes, reconciling deliveries with higher upkeep. Each can be mixed and all compete for cycles/resources.

## Campaign, challenge and replay
Twenty cases across ten regions. One landing opens after every two conclusions; case content is authored per region, and Far Witness houses the final investigation. Three difficulty profiles alter evidence cost and upkeep burden while keeping story content intact. There is no hard game-over; shortfalls reduce health and can reduce population, but recovery actions remain available. Final narrative varies with civic trust and ecology. Replays differ by evidence choice, communal/efficient resolution, route choices, branch order, traits and difficulty. Designed for an extended 60-minute-plus campaign with all authored cases, recovery, surveys and progression; actual play duration depends on reading and experimentation.

## Adaptation / limitations
The required six random axes were preserved. A continuously controlled character, combat encounters, tactical squad simulation and pathfinding are not appropriate to an evidence-driven detective adventure; environmental investigation and inference are the genre-equivalent challenge. Autonomous behaviors and simulation are colony agents, not combat enemies. There is no server-side cross-device save or import UI. This is a static web release rather than native desktop binaries.
