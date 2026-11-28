# Autonomous Indie Game Development Skill

A reusable process for taking a one-shot prompt to a self-contained, verifiable game release.

## Randomize first
Use an execution-tool cryptographic RNG to create a seed, then a deterministic PRNG from it to select each requested entry. Record seed, method, index and exact label before design. Never reroll for convenience.

## Integrate the concept
Make one premise that respects every random axis; turn conflicts into constraints. Define core loop and short/medium/long goals before coding. Count authored content honestly and connect systems so choices have consequences.

## Select architecture
Choose a launchable stack. Separate entry markup, styles, runtime, content and documentation. Define state ownership, persistence, random inputs, rendering, controls and save boundaries. Implement at least five real domain algorithms (for example pathfinding, visibility, procedural generation, autonomous behavior and deterministic simulation), not just names in a document.

## Build the core loop
Make title → new/continue → onboarding → playable encounter → progression → save/resume work early. Every control must do something. Model outcomes so encounter choices change later play. Combine curated content with generated environments, and validate navigation/objective access.

## Produce original assets
Use the image tool for shipped raster art and Pillow to resize/crop. Prefer generated bundled audio; if unavailable, disclose that or deliberately create original procedural sound design, not fake beeps. Bundle media; avoid remote fonts/CDNs/APIs in offline products.

## Balance and optimize
Check resource input/output against campaign length; include recovery from soft locks. Give every branch measurable effects and enemies/objectives mechanical distinctions. Bound simulation cost, avoid unnecessary animation loops and redraw static scenes only when state changes.

## Test honestly
Do startup and input-driven browser workflows when requested. Exercise representative mechanics and save/continue. Separate direct test results from source inspection and untested claims. Keep a matrix of requirements, method, outcome, limitation and severity. Check mobile/offline dependencies; never claim a full run, performance profile or compatibility matrix without executing it.

## Package
Include direct-launch entrypoint, source, assets, docs, controls, save behavior, release notes and limitations. Produce a complete playable archive and a source archive. Verify all paths exist. A finished archive is not proof that all campaign content was playtested.

## Anti-lightweight gate
Reject builds whose only loop repeats one action, whose systems do not interact, whose progress is only larger numbers, whose AI is trivial, whose environments feel identical, whose decisions do not matter, whose content exhausts in minutes, or whose interface is only a dashboard. Improve the weakest mechanical link before decorative polish.
