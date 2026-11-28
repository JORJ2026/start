# Release Verification Matrix — 1.0.0

Pass means directly exercised. Static means source/content inspection only. Not run means no result claimed. Full twenty-operation completion was not played during packaging.

| ID | Requirement | Location | Status / method | Limitation / readiness |
|---|---|---|---|---|
| R01 | Actual seeded randomization | game-design.md | Pass: Python secrets.randbits(64) seed; seeded PRNG chose six indexes | No reroll; exact set recorded |
| R02 | Direct HTML/CSS/JS entrypoint | index.html, styles.css, app.js | Pass: static page check loaded title | No build step |
| R03 | 20 operations / 10 regions | content.js | Static: authored array inspected | Full campaign not completed |
| R04 | Tactical movement/fire/objectives/extraction | engine.js, app.js | Pass in bounded scope: browser reached first tactical field; after an end-round browser timeout was traced to A* path reconstruction and fixed, a Node harness passed movement and two AI rounds on all 20 maps | Browser workflow not rerun after fix; every scenario not exhaustively played |
| R05 | AI / five algorithms | engine.js, tests/smoke.mjs | Pass: 2,000 generated maps checked for objective accessibility; all 20 operation maps ran two AI rounds in the smoke suite; algorithms inspected | Long-session balance not measured |
| R06 | Roster, persistent injuries, save | app.js, engine.js | Pass: save/continue workflow exercised | Cross-browser storage not tested |
| R07 | Supplies and 3 × 10 doctrines | app.js, content.js | Static: resource conversion and core bonus effects inspected | Every unlock sequence not tested |
| R08 | Three difficulty configurations | app.js, engine.js | Static: combat probability branches inspected | Extended balance not measured |
| R09 | Original art/audio | assets/, audio/ | Pass: local assets bundled and page loaded | Physical speaker/listening QA not performed |
| R10 | Local save/reload | app.js | Static plus Node JSON serialization checks; deployment wrote autosave state | Browser reload/continue was not exercised; clearing site data deletes save |
| R11 | Campaign completion/replay | app.js | Static: final operation and replay handlers inspected | Full 20-operation workflow not run |
| R12 | Offline operation | all runtime/assets | Pass: external font removed, no network API/dependency | Clean second-device ZIP launch not run |
| R13 | Responsive layout | styles.css | Static: 900/680/420 px breakpoints inspected | Device matrix not run |
| R14 | Startup/runtime errors | project | Pass: websim_check_page loaded the current page with no console errors after favicon/offline changes; later milestone label/condition edits were syntax-checked by workspace tooling but not page-checked again (check allowance exhausted) | No non-Websim browser matrix run |
| R15 | Full 60+ minute run | campaign | Not run | Campaign pacing and endgame balance remain unverified |

## Five QA passes
A Functional: first operation was deployed; the browser rendered tactical UI. An end-round browser click timed out due to a non-terminating A* reconstruction loop, which was repaired. A Node harness then passed generated maps, movement, two AI rounds and serialization for all 20 operations. B Integration: save, roster, resource and doctrine wiring inspected; not a full-campaign regression. C Experience: typography, concise controls and responsive breakpoints inspected; physical audio/accessibility audits incomplete. D Technical: assets, offline references, canvas sizing and save serialization inspected; no device profiling. E Release: static archive and launch instructions prepared; extraction/launch on a second clean machine not run.

No P0/P1 defect was observed in tested paths. A separate 100-seed × 20-operation flood-fill audit found no unreachable field objectives. Full campaign, browser reload after the fix, device compatibility and long-session balance remain unverified. Do not interpret source inspection as end-to-end pass.
