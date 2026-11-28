# Plush Valley v1.1.0 "Fresh Fluff"

Everything new lives in one section of `index.html`, **SECTION: POLISH PASS v1.1**, just above the boot code. The engine also got a handful of small inline hooks (marked in the list below).

## Why you got stuck at the shipping bin

Farm School step 5 waited for a `shipped` event that the game never sent, so you couldn't finish it no matter what you put in the bin. Three things made it worse:

- On Day 1 you have nothing to sell yet, because crops take days to grow.
- Items you pick up land in pack slot 11 or later, so you can't select them from the hotbar.
- Pressing **E** at the bin while holding your Turnip Seeds shipped the whole stack, with no confirmation.

**Fixed:** shipping now sends the event, a few wild forage items spawn next to the bin on Day 1, and the bin opens a menu where you pick what to ship.

**What goes in the bin:** anything with a sell price. That includes crops, forage, fish, eggs and milk, artisan goods, minerals, and wood, stone or fiber from clearing debris. You get paid overnight.

---

## Gameplay improvements

1. **Tutorial fixed.** Every step now completes, including the shipping step.
2. **Farm School rebuilt.**
   - Instructions show your real keys.
   - A progress-dot bar tracks the steps.
   - A badge points at the hotbar slot you need.
   - A guide arrow leads you to the forage, the bin and your bed.
   - If something is already in the bin, the shipping step completes on its own.
3. **Day-1 welcome forage:** a few wild goodies spawn beside the shipping bin, so you have something to ship right away.
4. **Safer shipping bin.**
   - Holding produce (crops, forage, fish, animal or artisan goods) ships it instantly.
   - Holding anything else opens a menu. Seeds, tools and story items are never shipped by accident.
5. **New Shipping menu.**
   - **Enter** ships a whole stack and **F** ships one item.
   - Rows show the price per item.
   - Produce sorts first and seeds last.
   - Seeds, placeables, and a Brass Bar you still need are flagged with warnings.
   - When you have nothing to sell, the menu suggests where to get something.
6. **Take back from the bin:** you can pull items back out of the bin before you sleep.
7. **Bug fix:** "shipped today" now resets each night. Before, it added up forever.
8. **"What now?" helper.** Press **H**, or tap the button under the tracker. It reads your farm and suggests up to 5 next steps, such as crops to harvest, thirsty crops, an empty can, seeds to plant, mail, story goals, deliveries and shops.
9. **"Next:" hint** always shown in the quest tracker.
10. **Guide arrow system.** It points to the tutorial target, the chapter star, the festival, or your bed after 10pm. It works across maps by pointing at the right exit or door, and it clamps to the screen edge with a label.
11. **Crop info:** face a growing crop to see its name, days left, a growth bar and whether it's watered.
12. **Tilled soil hint:** facing empty tilled soil tells you to plant seeds there.
13. **Bedtime nudge at 10pm.** On the first days, an evening reminder also tells you to ship produce before bed.
14. **Hold to repeat:** holding Use repeats the hoe, can, axe, pickaxe, scythe and seeds. Food and fishing are excluded, so you can't eat a whole stack by accident.
15. **Bigger pickup magnet:** items get pulled in from almost twice as far away.
16. **Shipping goals show pending gold** ("+92g in bin, paid overnight"), so story progress doesn't look stuck.
17. **Idle nudge:** on early days, standing around for 30s suggests pressing H.
18. **Characters and NPCs are 25% bigger** (player, villagers, minigame racers and the merchant). Speech bubbles, emotes and P1/P2 tags moved up to match. Hitboxes are unchanged, so movement feels the same.

---

## 100 visual improvements

### World and farming (1–40)
1. Shoreline foam drifts along every water edge.
2. Diagonal light bands shimmer across water.
3. Lily pads bob on ponds and rivers, some with pink blossoms (except in winter).
4. Tilled soil has furrow lines.
5. Wet soil has a glossy, shimmering highlight.
6. Soil beds cast a soft drop shadow.
7. Ripe crops glow with a pulsing warm halo.
8. Ripe crops twinkle with star glints.
9. Ripe crops give off floating sparkles.
10. Freshly planted seeds show as a mound with a tiny swaying sprout.
11. Thirsty crops near you show water-drop markers.
12. The tile you're facing gets corner brackets instead of a dashed box.
13. The highlight is colour-coded by action (till, water, chop, mine, plant, harvest).
14. Upgraded hoes and cans preview every tile they'll affect.
15. The highlight also has a soft tinted fill.
16. Hoeing kicks up dirt clods.
17. Watering sends a stream of droplets from the can to the soil.
18. Every watered tile gets a splash ring.
19. Chopping throws wood chips.
20. Mining throws stone shards.
21. Mining sparks flash.
22. Clearing debris sends out a shockwave ring.
23. Broken rocks puff into dust.
24. Felled trees topple over and land with a leaf burst, dust and a small shake.
25. Harvested crops fly into their hotbar slot.
26. Picked-up items fly into their hotbar slot.
27. Hotbar slots pulse gold when an item lands.
28. Shipped items arc into the bin.
29. The bin lid opens when you walk up or ship something.
30. The bin shows a red badge with the number of items queued.
31. A "SHIP" label bobs over the bin on the first days.
32. The mailbox glows when you have mail.
33. Working machines show a progress ring.
34. Finished machines show a bubble with the product bouncing.
35. Animated chevrons point toward map exits.
36. Exits are labelled with where they lead ("Stitchwick Village").
37. The chapter star has a light beacon.
38. Villagers near you show name tags with a 5-heart friendship meter.
39. Villagers you haven't met are tagged "(new!)".
40. A ✓ marks villagers you've already talked to today.

### Characters, effects and weather (41–64)
41. A "!" marker floats over villagers you can deliver a request to.
42. Animals you haven't petted today show a "pet me" heart.
43. A key cap floats over whatever you can interact with.
44. Fireflies have soft glow halos at night.
45. Dropped items bob, with a shadow that shrinks as they rise.
46. Dropped items glint.
47. Valuable and quality items glow.
48. Dropped stacks show their count.
49. Items being pulled in leave a small sparkle trail.
50. Starting to run kicks up a dust burst.
51. Running leaves a trail (grass bits on grass, dust on paths).
52. You sweat droplets when your Fluff is low.
53. Levelling up a skill plays a ring, a star fountain and a "LEVEL UP!" pop.
54. Raindrops splash rings on the ground.
55. Rain streaks vary in opacity for depth.
56. Big snowflakes are spinning star crystals.
57. Fog has two parallax layers.
58. Cloud shadows are soft gradients instead of flat ellipses.
59. Wind streaks sweep across the screen on windy days.
60. Dawn has warm colour grading.
61. Golden hour has warm colour grading.
62. A soft vignette deepens at night and in caves.
63. An on-screen guide arrow bounces over its target, with a pulsing ground ring.
64. An off-screen guide arrow sits at the screen edge with a destination label.

### HUD (65–86)
65. The calendar has an animated season icon (blossom, sun, leaf, snowflake).
66. The clock turns purple at 10pm and pulses red after midnight.
67. The weather is named under its icon.
68. The day phase (calm, busy, festival) shows as a coloured pill.
69. A day dial tracks the time with a dawn-to-night gradient, hour ticks and a sun or moon knob.
70. Wacky weather gets its own chip under the calendar.
71. The money counter rolls up and down smoothly.
72. The wallet flashes green when you gain money and red when you spend it.
73. Coin sparkles burst out of the wallet when you earn.
74. The wallet coin spins, and the Golden Stitch count no longer overlaps its star.
75. A "Bin: +Xg tonight" chip shows what's waiting to be paid.
76. The Fluff meter has a gradient fill with a highlight.
77. When the Fluff meter drops, a ghost bar trails behind it.
78. The Fluff meter has quarter tick marks and a number readout.
79. The Fluff heart beats when you're low.
80. Active buffs and statuses show as badges with timer rings.
81. The selected hotbar slot lifts and glows.
82. Hotbar stacks show their quantity in a pill, and slots have number badges.
83. Upgraded tools get a coloured ring in the hotbar.
84. The watering can has a vertical water gauge that turns red with a "!" when empty.
85. The hotbar turns red and says "Pack full!" when you're out of space.
86. The selected item's name shows in a pill, and prompts look like key caps ("[E] Ship items").

### Tracker, minimap and notifications (87–94)
87. A crop info card shows days left, a growth bar and watered status.
88. The quest tracker was redesigned:
    - chapter-colour header
    - checkboxes, with ✓ for finished goals
    - progress bars only once a goal has started
    - deliveries listed with item icons
89. The minimap got:
    - soil and ripe-crop pixels
    - colour-coded buildings
    - pins for the bin, mailbox and board
    - pulsing exit pins and a guide ring
    - an arrow showing which way you face
    - a night tint and a rounded frame
90. Toasts slide down from the top, with a coloured stripe, an icon badge and a timer bar. On non-world screens they stack at the bottom.
91. The Village Crier box moved to the bottom-left. It slides in, has a name ribbon, and no longer covers your character.
92. Farm School moved to a top panel with an icon, step dots, a slide-in, and a flash when a step completes.
93. Each morning opens with a title card ribbon (for example "Spring 2 · Sunny").
94. Crow raid warnings show as a banner with a flapping crow, and callouts burst out of a rotating sunburst.

### Menus, dialogue and recap (95–100)
95. List menus have a title ribbon, a radial dim behind them, and a key-cap Back button.
96. The menu selection slides between rows, with a bouncing ▶ cursor and a growing, bobbing icon.
97. Menus have a scrollbar, alternating row tints, amber tint on warning rows, and lock icons on unavailable items.
98. Shop tabs: the active tab is raised and outlined.
99. Dialogue got:
    - a name-plate tab in the villager's colour
    - a 10-heart friendship row
    - a portrait that hops on each new line, over animated rings
    - a typewriter cursor and line-progress dots
    - a key-cap continue prompt
    - drifting hearts during heart events
100. Floating text pops in with a soft drop shadow, and the end-of-day recap numbers count up.

---

## Added after v1.1.0: Player's Guide

- **Player's Guide** (new in-game screen, 19 sections, scrollable): covers controls, the day and Fluff, farming, crops by season, seasons and festivals, shipping and shops, cooking and crafting, animals, villagers, exploring and skills, story mode, play modes, wardrobe and stickers, the pause menu, settings, saving, tips and release notes.
- Opened from three places: the **splash screen** (tap or click "a JORJ production" — the JORJ link), the **title menu** ("Player's Guide"), and the **pause menu** (first item under Options).
- The JORJ link opens `JORJ_URL` near the top of the script. It is empty for now, so tapping it shows "JORJ link not set yet" until the URL is filled in.
- Tapping the JORJ link does not skip the splash screen.

---

## v1.2.0 "Odd Jobs"

- **55 Odd Jobs** from all 15 villagers (3-4 each, chained, some seasonal). Each has 2-3 different tasks (harvest, forage, craft, cook, place, visit, pet, ship, bring items). Press **J** to see them; talk to a villager and choose "Odd Jobs" to accept and turn in. Rewards: gold, Golden Stitches, items, and a recipe on 47 of them. New stickers: Odd Jobber, Valley Helper.
- **50 new forageables**: 10 per season plus 10 beach finds (sand tiles). Daily forage spawns raised.
- **50 new buildables** (fences, paths, garden, furniture, lights, farm): lights glow at night, scarecrows have crow radii, paths/rugs are walkable.
- **50 new crafted goods** (teas, pantry, soaps, crafts, bait, mulch, seasonal treats).
- **100 new crafting recipes** (one per new buildable and good), sorted into categories in the Craft tab (left/right). Recipes unlock from the start, skill levels, or Odd Jobs.
- **Backup**: Export ALL saves (3 farms + profile, stickers, wardrobe, settings) to one file and import it in another browser: Settings (top two rows), Load screen, pause menu Options.
- Guide + PDF: new Odd Jobs, Foraging Guide, Crafting Catalog, Backup & Transfer sections; PDF appendices list every forage item, recipe and job.
