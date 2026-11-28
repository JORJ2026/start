# Game Design Document — Tide of Cinders

## Identity and premise
A monochrome, industrial tactical squad campaign about the human cost of making a home on a drowned colony world. The interstellar migration ship Asterion broke apart above Pelagos. The surviving landing crew must chart island chains, reconnect stranded people and equipment, and decide how much of the expedition's limited stock to spend on survival versus settlement.

Player role: field commander and expedition quartermaster. Tone: industrial, gritty, salt-stained, cautiously humane. Visual direction: atmospheric monochrome cut by warm brass objectives and muted red threats.

## Randomized concept record
A cryptographically generated seed, followed by a seeded pseudorandom generator, selected six indexes in order. No rerolls.
- Seed: 16424559674544855344
- A / 25 — Tactical squad management
- B / 10 — Interstellar colonization
- C / 24 — Atmospheric monochromatic
- D / 11 — Supply chain management
- E / 14 — Oceanic island network
- F / 11 — Industrial and gritty

## Objectives and loops
The fleet is still in orbit, but a narrow departure window and failing shore network make rescue uncertain. Over twenty field operations, secure viable landing sites, preserve specialist expertise, build a chain of powered signals, and prepare a place worth returning to. Short term: survive an operation. Medium term: keep routes fed, heal critical specialists, uncover records, invest doctrine. Long term: light the departure chain and bring the fleet through.

1. Campaign/quartermaster: read site and weather, inspect vitality, choose four of eight specialists, pack kit and treatment, then pay a ration and charged cell to launch.
2. Field tactics: assess terrain, visibility, threat roles and objectives; spend two AP per specialist on movement, fire, interaction, role skill or guard; end the round for enemy response.
3. Extraction/consequence: meet the distinct condition (salvage, rescue, hold, sabotage or neutralization), return a survivor to the landing flare, and extract. Wounds persist. Success yields resources and a recovered coastal record; failure consumes provisions and leaves route progress unchanged.
4. Long arc: spend Intel on Fieldcraft, Logistics or Signals. These branches change durability, enemy accuracy, launch costs, salvage yield, accuracy and range.

## World and content
Ten named shores form an oceanic migration route. Two authored operation briefs occupy each region. Tactical terrain is deterministically generated from mission and campaign seeds around repaired deployment/objective lanes. Ten unique weather/terrain signatures distinguish regional conditions. The campaign persists locally.

Twenty authored operations span five objective conditions and ten regional identities. Five enemy archetypes behave differently: flankers seek exposed angles; anchors prefer hard cover; disruptors jam unfinished objectives; hunters favor wounded targets; command units cluster with allies. Eight named specialists have distinct health, aim, range, role and field-skill rules. Field Notes contain 12 named recovered records, 12 named relic/salvage references, ten facilities, ten regions, five enemy profiles, and 30 milestones. These are 52+ named content records before counting the twenty missions.

## Mechanics and interaction
- Four-neighbor grid movement. Mud costs extra AP, water blocks routes, hard rock blocks line of sight, cover affects shot probability and enemy positioning.
- Operators have vitality, ammunition, range, aim and two AP. Seeded combat resolves hit/miss. Enemy fire may injure or down a specialist; guard reduces damage.
- Objective interactions require adjacency. Hold takes three interactions. Rescue/salvage sites are separate tasks. Eliminate missions require the specified hostiles removed. All operation conditions require a return to the west flare.
- Enemy turns combine five-role utility logic with A* route choice. Tech disrupts a nearby enemy; Heavy suppresses nearby hostiles; Medic heals an adjacent ally; other roles take a guarded tidewise position.
- Scrap can become rations or a power cell. Rations and cells are launch supplies. A packed field kit gives the lead specialist extra ammunition. Medical supplies restore persistent wounds. Mission rewards and doctrine alter the supply loop.
- Three doctrine branches each contain ten ordered nodes, gated by Intel earned through operations and milestones.

## Challenge, progression and endgame
Twenty-operation route escalates hostile count, mixed profiles, regional conditions and objective requirements. Standard, Hard and Sheltered change combat probabilities. Operation 20, Last Light, is the final departure chain. Completion creates a local record and permits a fresh expedition. New seeds, three difficulties, roster alternatives, branch investments and tactical risk support replay.

A withdrawal consumes provisions and permits retry. Downed specialists accrue persistent injury; med supplies restore vitality. Two salvage can become a cell; two salvage can become two rations. At least three specialists must be selected; no permanent death.

Designed duration is approximately 3–6 minutes per operation plus planning: 60–120 minutes for a full run is a design estimate, not measured playtime.

## Technical scope and boundaries
Static offline web game. Authored briefs/content combined with seeded tactical terrain. No multiplayer, native executable, voice acting or external API. See verification matrix for untested full-campaign/device coverage.
