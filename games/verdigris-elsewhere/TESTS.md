# Verification and QA record

## Source/content inspection
- Static entry is index.html; it links separate style.css and app.js. No build, package manifest, server, or runtime dependency.
- Authored-data shape is 10 regions, 20 case records (two per region), 60 unique evidence descriptions, 3 hypotheses per case, 10 traits, 3 research branches × 4 distinct perk descriptions, 30 milestone records, and 3 difficulty profiles.
- Checked persistence guards, enabled/disabled conditions, resource bounds, campaign progression and conclusion scoring by source inspection.
- Five autonomous agents are implemented in the cycle function: mediator, root network, water conservator, convoy dispatcher and resident council response.
- Original game illustration and locally generated ambient WAV are included; interface/discovery cues are Web Audio synthesized. SFX generation service was unavailable, and no generated SFX files are claimed.

## Runtime checks
The required first-version screenshot and preview page check were run after implementation. See delivery summary for the report. A full 20-case interactive human playthrough, persistence reload, resource/crisis edge-case suite, and cross-browser package test have NOT been run. No fake playtest results are asserted. This is source inspection plus a one-load static preview validation, not a complete functional test pass.

## Verification matrix
- Title/new/continue/difficulty/pause/settings: implemented; title and preview launch verified; buttons have not all been clicked in a playtest.
- 20-case investigation, 3 clues, inference, communal conclusion: implemented; author data source-reviewed; full progression not interactively played through.
- Region unlock/survey: implemented; source-reviewed; not end-to-end browser-playtested.
- Five colony behaviors, route, recovery, cycle upkeep, traits, hybrid and research: implemented; source-reviewed; numeric simulation not formally balance-tested.
- Local persistence/export: implemented with guarded JSON storage; export/reload not end-to-end tested.
- Campaign endings and milestones: implemented; source-reviewed; full ending not runtime-tested.
- Visual identity/responsive layout/local audio: first view screenshot verified; responsive and audio controls not comprehensively tested.
- Offline: gameplay and art files are local; Google Fonts is optional. Audio file is local.

## Known validation gaps
There is no automated test harness or native installer. This static web release has no save import UI, and no cross-device/server persistence. Advanced accessibility, low-end device performance, and balance remain areas for manual testing.
