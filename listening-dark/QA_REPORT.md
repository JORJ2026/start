# QA report: The Listening Dark 1.2.0

Every result below comes from tests actually run on the final build (`dist/index.html`, 2026-11-27), using headless Google Chrome driven by Playwright. You can reproduce them with `node tools/qa.mjs` and `node tools/audio-check.mjs`; `python3 tools/report.py` rebuilds this file from the results. Raw output is in `qa/`.

**Result: 109 of 109 automated checks pass. The audio check passes.**

## What was tested

- **Functional:**
  - load screen and audio start
  - 308 generated caves checked for reachability and fit
  - menus by real keyboard
  - collision soak
  - calls, hearing, objectives, all depths, both Descent endings
  - save, reload and continue; pause; damage, healing and death
  - Daily and Endless modes
- **Controller:** a simulated standard-mapping gamepad, injected into the page, plays the game end to end:
  - load screen, menu focus and held-direction repeat
  - flight, dead zone, glide, all three ways to call, dart
  - vibration, and the setting that turns it off
  - pause, settings sections, sliders with repeat, back out
  - roost choice
  - PlayStation hot-swap and glyph change
  - disconnect pausing play
- **Story:**
  - the Return ending without verses
  - a full playthrough through the real menus: prologue, eight chapter cards, arrival lines in every chapter, roost conversations, all six lost found, all four verses, singing to the Mute, the Homecoming ending and the epilogue
  - chapter select replay in its own slot
  - death keeping the chapter, and retry
- **Robustness:**
  - double presses
  - a bat inside rock
  - a hunter with invalid coordinates
  - endless depth 40
  - an exhausted boon pool
  - migrating a version 1 save
  - hostile save values
  - a corrupt save restored from its backup
  - another day's daily run
  - another tab writing the save
- **Experience:**
  - balance soak: hit within 60 s: careless 7/24 (mean 52 s), informed 2/24 (mean 58.3 s)
  - lurker and bellflower behaviour, and boon effects
  - settings persistence, text size, quality switch, keyboard menu navigation
- **Release:**
  - performance with and without glow
  - the slow-device glow guard
  - memory across rebuilds
  - emulated phone with real touch events
  - blocked storage
  - fully offline

## Defects found and fixed while building 1.1 and 1.2
1. **Audio never started on 44.1 kHz devices.** The reverb impulse was built at 48 kHz and the convolver rejected it. Buffers are now resampled to the device rate.
2. **Mono audio could play from one speaker only.** It now folds at the master and is spread to both channels explicitly; the check confirms equal left and right levels.
3. **Music did not fully stop or duck.** Notes already scheduled bypassed the music fader. All music voices now pass through it, and silent mode measures 0.001.
4. **On touch, the tap that dismissed the load screen also pressed a title menu item.** The load screen now stays in front until it is gone.
5. **A double-click on a boon could apply it twice and start two levels.** Scene changes now lock until the next screen appears, and boons are refused outside the roost.
6. **Xbox controllers were identified as PlayStation** (both report "Wireless Controller"). Now matched by Sony's vendor ID.
7. **The glow pass costs about 3.5 ms per frame in software rendering.** It now refreshes every other frame, and a slow-device guard turns it off, with a message, if the frame rate can't hold.
8. **A stray border showed from the hidden toast; the HUD showed under pause submenus; labels overlapped on phones.** All fixed.
9. **The old balance test measured the wrong thing.** A blind, slow bot was hit more than a careless one: silence hides you, but you must still call to see. It was replaced by an informed bot that only uses what its own echoes reveal. That bot is hit within a minute in far fewer trials, which shows the intended skill is rewarded.

## Automated results (final run)

| Result | Check | Measured |
|---|---|---|
| Pass | load screen finished and audio started on the first key |  |
| Pass | boots to title with no errors |  |
| Pass | procedural levels valid (308 generated) | avg build 21.6 ms |
| Pass | Descent from the title opens difficulty |  |
| Pass | Standard starts the intro |  |
| Pass | Begin enters depth 1 |  |
| Pass | keyboard moves the bat | moved 63.5 px |
| Pass | bat never ends a tick inside rock (900 ticks) | 0 violations |
| Pass | tap chirp fires once |  |
| Pass | held call reaches farther (>= 20 tiles) | range 26.0 tiles |
| Pass | calls create echo points and wall memory | 1507 points, 93 cells remembered |
| Pass | stalker hunts what it hears |  |
| Pass | collecting every shard opens the way down | 2/2 |
| Pass | entering the way leads to the roost and depth 2 |  |
| Pass | choosing a boon (key 1) starts depth 2 and saves the run |  |
| Pass | achievement First Light unlocked |  |
| Pass | Continue offered after reload |  |
| Pass | Continue resumes at depth 2 |  |
| Pass | Escape pauses and time stops |  |
| Pass | Escape resumes |  |
| Pass | hits cost one wing and grant brief invulnerability |  |
| Pass | twelfth moth mends a wing |  |
| Pass | last wing lost -> death -> game-over screen, run cleared |  |
| Pass | Descend again restarts at depth 1 |  |
| Pass | descent of 8 depths completes with the Return ending | {"state":"ending","screen":"ending","songs":4,"ending":{"return":true},"depth":8} |
| Pass | all four lost songs found on depths 2/4/5/7 | songs before final: 4 |
| Pass | singing all four verses to the Mute calms it and opens the way |  |
| Pass | Chorus ending reached and recorded (Cruel achievement too) | first_light,whisper,swift,untouched,verse,halfway,all_verses,return,chorus,cruel |
| Pass | endless deep unlocks after an ending |  |
| Pass | Chorus echo palette unlocked |  |
| Pass | endless depth 13 builds and plays (no mute, no songs) | 17 hunters |
| Pass | daily cave uses one seed per day at Standard |  |
| Pass | no page errors during functional pass |  |
| Pass | AI soak (48 one-minute trials): no NaN positions; every stalker keeps moving | {"careless":{"trialsHit":7,"meanSecondsToFirstHit":52,"nan":0,"stuck":0,"huntTicks":2550},"informed":{"trialsHit":2,"meanSecondsToFirstHit":58.3,"nan":0,"stuck":0,"huntTicks":298}} |
| Pass | stealth matters: informed play is hit in far fewer trials than careless play | hit within 60 s: careless 7/24 (mean 52 s), informed 2/24 (mean 58.3 s) |
| Pass | careless play draws far more hunting | 2550 vs 298 hunt-ticks |
| Pass | lurker ignores a silent glide but springs at loud flight | {"quiet":"idle","loud":"wind"} |
| Pass | a ringing bellflower lures hunters to it | {"state":"hunt","tx":0,"ty":0,"decoy":true} |
| Pass | Far Call extends range 25% | 26 -> 32.5 |
| Pass | Thick Hide adds a full wing (and boons are refused outside the roost) |  |
| Pass | text size setting rescales the interface | 18px -> 20.7px |
| Pass | quality setting switches renderer to low |  |
| Pass | settings persist across reload (mute, captions, music volume) |  |
| Pass | arrow keys move menu focus | focused: Descent eigh |
| Pass | corrupt save file is recovered from |  |
| Pass | no page errors during experience pass |  |
| Pass | pad: load-screen prompt shows the controller button |  |
| Pass | pad: any button passes the load screen and starts audio |  |
| Pass | pad: device detected, prompts switch to Xbox glyphs |  |
| Pass | pad: D-pad moves menu focus down and up | story -> new -> story |
| Pass | pad: holding the stick repeats menu movement | focus index 4 after a 0.7 s hold |
| Pass | pad: A selects (difficulty screen) |  |
| Pass | pad: B goes back |  |
| Pass | pad: A through difficulty to intro |  |
| Pass | pad: A on Begin enters play |  |
| Pass | pad: left stick flies the bat; small drift is inside the dead zone | moved 38.0 px, drift input 0 |
| Pass | pad: LB glides silently |  |
| Pass | pad: A chirps, held A calls far, RT also calls | 3 calls, longest 26.0 tiles |
| Pass | pad: B darts |  |
| Pass | pad: vibration fires on calls, darts and hits | 2 effects before the hit, 4 after |
| Pass | pad: vibration setting off stops rumble |  |
| Pass | pad: Menu button pauses |  |
| Pass | pad: open Settings from pause |  |
| Pass | pad: RB / LB switch settings sections | tab 1 then 0 |
| Pass | pad: D-pad right/left adjusts a slider, holding repeats | music 0.6 -> 0.65 -> 0.45 |
| Pass | pad: B returns from settings to pause |  |
| Pass | pad: B on pause resumes play (audio unmuffled) |  |
| Pass | pad: hint chips render the pad glyph |  |
| Pass | pad: pick a boon at the roost and descend |  |
| Pass | pad: PlayStation controller recognised, glyphs switch |  |
| Pass | pad: connection toast shown |  |
| Pass | pad: disconnecting mid-play pauses the game |  |
| Pass | pad: no page errors |  |
| Pass | story: escaping the Hollow Heart without the song gives The Return | Ending · The Return |
| Pass | story: Begin the story opens the prologue |  |
| Pass | story: chapter I title card |  |
| Pass | story: every chapter speaks on arrival and the roost talks back | [[2,2,3],[3,1,3],[4,1,4],[5,1,3],[6,1,4],[7,1,3],[8,1,3]] |
| Pass | story: a lost voice hides in chapters II to VII, verses in II, IV, V, VII |  |
| Pass | story: all six kin found, four verses known, eight chapters open | {"kin":6,"verses":4,"chapters":8,"screen":"chapter"} |
| Pass | story: singing to the Mute with everyone home gives Homecoming | Ending · Homecoming |
| Pass | story: a finished story frees its save slot |  |
| Pass | story: epilogue follows the ending |  |
| Pass | story: chapter select lists all eight chapters open |  |
| Pass | slots: a chapter replay, a descent and the story keep separate saves | {"replay":5,"story":null,"descent":"descent","last":"replay","mode":"story","d":5} |
| Pass | story: dying keeps the chapter saved and offers a retry | {"screen":"over","kept":5,"retry":true} |
| Pass | story: retry restarts the same chapter |  |
| Pass | robust: a double-pressed boon is taken once and descends once | {"depth":2,"lvl":1,"id":"moth_lure"} |
| Pass | robust: a double-pressed difficulty starts one run |  |
| Pass | robust: a bat inside rock is moved to open air; a NaN hunter resets | {"was":true,"now":false,"enemyOk":true} |
| Pass | robust: endless depth 40 builds fast with hunters capped | {"st":"play","stalkers":16,"lurkers":10,"ms":34,"speed":1.48} |
| Pass | robust: with nothing left to learn the roost offers Rest and goes on | {"v":"__rest","st":"play","d":2} |
| Pass | robust: a version 1 save migrates into the descent slot; bad settings fall back | {"d":3,"last":"descent","master":0.4,"music":0.6,"pal":"bone","ui":1,"cont":"Continue Descent · depth 3 · Standard"} |
| Pass | robust: the migrated run continues at depth 3 with its boon |  |
| Pass | robust: hostile save values are clamped, unknown runs refused | {"r":{"v":2,"mode":"descent","diff":"standard","seed":0,"replay":false,"depth":8,"maxHearts":3,"hearts":1,"boons":{"far_call":2},"moths":0,"mothMeter":12,"songs":[1],"kin":[2],"sang":false,"date":"2026-11-27","stats":{"pings":0,"time":0,"stuns":0,"hurt":0}},"bad":[null,null,null,null]} |
| Pass | robust: a corrupt save is restored from the backup copy and the title says so | {"runs":77,"rec":true,"note":"Best with headphones\n      v1.2.0 · save restored from backup"} |
| Pass | robust: yesterday's daily is labelled, and Daily cave starts today's | {"label":"Continue Daily cave · depth 4 · from 2020-01-01","depth":1,"date":"2026-11-27"} |
| Pass | robust: a save written by another tab is picked up on the title |  |
| Pass | no page errors during story and robustness checks |  |
| Pass | performance at 1920x1080 without glow: render CPU p95 < 3 ms, 60 fps | render median 0.50 ms, p95 1.70 ms; frame interval median 16.7 ms over 599 frames; 1662 live echo points |
| Pass | performance at 1920x1080 with glow: render CPU p95 < 6 ms (headless software rendering; real GPUs blit this) | render median 2.10 ms, p95 5.10 ms; frame interval median 33.3 ms over 599 frames; 1248 live echo points |
| Pass | slow-device guard turns glow off and tells the player | {"bloom":false,"toast":"Glow turned offto keep play smooth. Turn it back on in Settings, Display."} |
| Pass | no runaway memory across repeated level builds | heap 21 MB -> 21 MB after 6 rebuilds |
| Pass | mobile: touch controls shown in play, no horizontal overflow | {"st":"play","touch":"block","pb":"block","w":390} |
| Pass | mobile: virtual stick flies the bat | moved 79.7 px |
| Pass | mobile: CALL button calls |  |
| Pass | mobile: pause button pauses |  |
| Pass | no page errors on mobile |  |
| Pass | runs with storage unavailable (and says so) | {"st":"play","persistent":false} |
| Pass | fully playable offline (only optional font requests attempted) | https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,500&display=swap |

## Audio output (peak amplitude after the master stage)

Device rate 44100 Hz.
- Stereo (hard-panned click), left / right: [0.009, 0.038]
- Mono, left / right: [0.034, 0.034]
- Pause muffle cutoff: 852 Hz
- Music by mode: title 0.103, game 0.107, final 0.104, chorus 0.114, silent 0.001
- Ambience: 0.203
- Click 5,000 px away: 0.001
- Muted: 0

| Sound | Peak |
|---|---|
| chirp | 0.092 |
| call | 0.232 |
| moth | 0.077 |
| shard | 0.118 |
| hurt | 0.399 |
| dash | 0.042 |
| heal | 0.079 |
| death | 0.192 |
| descend | 0.14 |
| gateOpen | 0.213 |
| flap | 0.048 |
| uiMove | 0.02 |
| uiConfirm | 0.024 |
| uiBack | 0.02 |
| uiToggle | 0.02 |
| uiSlide | 0.019 |
| uiTab | 0.019 |
| uiError | 0.059 |
| uiStart | 0.057 |
| pauseIn | 0.019 |
| achieve | 0.031 |
| click | 0.027 |
| growl | 0.088 |
| bell | 0.111 |
| lunge | 0.075 |
| stun | 0.048 |
| mutePulse | 0.288 |
| breath | 0.028 |
| drip | 0.036 |
| rumble | 0.049 |
| shardPing | 0.039 |
| echoTick | 0.026 |
| chargeHold | 0.045 |

## Not tested
- Real phones and tablets, Firefox and Safari, and physical controllers. Controller tests use a simulated standard-mapping pad; non-standard mappings may label buttons differently.
- Human playtesting. Difficulty, pacing and story length come from bots and reasoning, not from players.
- Frame rate on real GPUs. The figures are CPU time under headless software rendering, where frame scheduling is coarser than on real hardware.
