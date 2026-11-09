# WIRE TO WIRE — v0.18 Game Engine Recovery (2026-11-09)

## What this is

The owner provided the original `WTW.zip` (4.1 MB compressed, 72 ZIP entries) as an **earlier rudimentary playable prototype**. Its main app lives under `wire_to_wire_manager_v0_18/app/`, and a standalone v0.18 HTML also exists in `current_build/`. **It is reference source code, not the current 1999 canon or the approved live Office layout.** Preserve the upload intact. No legacy seed or original save should be loaded as the active 1999 game.

Current canonical UI ownership is **Office FM Profile Foundation v29** in the Google Drive `WIRE_TO_WIRE_UI_CURRENT` package, managed by a separate UI window; the current GitHub site is a separate deployment/read-model bridge. Historical/horse/track identity authority is the locked WTW v3.3 master in Drive. Do not overwrite either for legacy compatibility.

## Recovered modules

| Legacy file | Content | Recovery priority |
| --- | --- | --- |
| `app/js/state.js` | Seed/load/save/export, stable ID lookups, state normalization, diagnostics, event log | HIGH: adapt as isolated game-run save/state |
| `app/js/decisionEngine.js` | Inbox choice effects, owner/trainer trust, horse condition, extra-work requests | HIGH: generalize rule dispatch, remove name-specific branches |
| `app/js/calendarEngine.js` | Date advance, calendar-event firing, missed deadlines, world pulse, barn messages | HIGH: anchor around authoritative 1999 game clock and track calendar |
| `app/js/raceEngine.js` | Pace, early/late form, distance, class, readiness, reliability, rider, public odds, structured trip, all-field finish order | HIGH: research/test as candidate simulation engine only; NOT certified historical model |
| `app/js/narrativeEngine.js` | Full race call, runner snapshot and outcome-driven follow-up messages | MEDIUM: make dynamic, prevent hardcoded names and fixed winner narratives |
| `app/js/ui.js` / CSS | Old dashboard, inbox, horse profiles, race-book interaction, active screen state | REFERENCE ONLY: do not graft onto v29 layout |
| `app/js/data.js` / `data/starter_world*.json` | 2014 fictional demo horses, tracks, people and race | TEST FIXTURE ONLY; never promote into 1999 v3.3 canon |

Other useful source files: `PROTOTYPE_BIBLE_v0_4.md`, `CODEX_HANDOFF.md`, `REGRESSION_CHECKLIST.md`, `BUILD_NOTES_v0_18.md`, and saved previous exports in `save_data/`. These express intent and regression requirements, **not automatic approval** of legacy identities.

## Actual execution smoke test (headless Node VM from the user-provided ZIP)

Executed `data.js`, `state.js`, `decisionEngine.js`, `calendarEngine.js`, `raceEngine.js`, `narrativeEngine.js` together with an in-memory localStorage stub, using **unmodified** code.

- Created fresh demo state: `worldVersion=0.18.0`, date **2014-07-15**, **16 horses, 1 explicit scheduled race, 3 inbox messages, 53 track seeds, 8 world-news items**.
- `RR.State.diagnostics()`: **PASS**, no errors/warnings before or after test.
- Player decision `enter_powerline`: marked race entered, owner satisfaction **50 -> 58**, trainer trust **55 -> 54**, added a confirmed-entry inbox message, horse trainer notes and timeline events.
- Advanced to **2014-07-19**: fired **1** calendar event and recorded **1** missed deadline elsewhere in the demo inbox; world news grew to **11**.
- `RR.RaceEngine.simulateRace`: returned a complete **7-horse** finish order, pace/trip detail, an attached race result and a **999-character** full narrative call.
- A second call to the same race returned `alreadyRun=true` rather than duplicating the result.
- Save and reload preserved the date and race result.

These are **runtime smoke checks only**, not a comprehensive statistical calibration, 1999 replay, UI acceptance test, or guarantee that the user-facing HTML behaves correctly.

## Two directly reproduced critical legacy bugs

1. `RR.State.answerMessage(state, existingMessageId, 'not_a_real_option')` returned `ok=true` **and marked the real message answered**, even though the choice was invalid. Must reject unknown choice IDs and leave state unchanged.
2. `RR.RaceEngine.simulateRace(state, raceId)` succeeded on **2014-07-15** for a race scheduled for **2014-07-19**. Must validate date/time, approved entries, scratches, official field, and game-run state BEFORE simulation.

Additional issues to handle before gameplay:
- Legacy `horse_2012_*`, `race_2014_*`, `person_*` IDs differ from 1999 canonical `H-*`, `P-*`, `O-*`, `T-*`. **Do not treat string matching as identity proof.** Use authoritative ID joins and a separately namespaced `game_run_id` for simulation events.
- Calendar and decision stories are **scripted around Powerline/Varnish and old characters**, not autonomous AI activity. Generalize rule data and NPC behavior.
- Engine creates plausible demonstration outcomes but is **not historically validated or calibrated** as a universal race model. Retain its modular concepts, test outcomes and consistency independently.
- No verified production finance, true transport logistics, full day-by-day recovery model, or seven-day career regression is established by this archive.
- Old export is dated July 2014, whereas playable WTW begins January 1999. It cannot be imported unchanged; old race and horse records cannot override locked historical canon.

## Integration contract for the current UI window

Keep the user's approved Office v29 and its six starting horses. Do not restore the v0.18 dashboard, list tables, logos or profile styling.

- The first game-week slice should be **Office -> Inbox -> Horse Profile/Stable -> Training or Entry Decision -> Advance Day -> Race Book -> Race Day -> Structured Result -> Full Race Call -> Aftermath Inbox**.
- Decisions must alter a persistent `game_run_id` state and change real readiness, owner/trainer relationship, time, entries, financial ledger, shipping/rest or next instructions. A visual click without state change does not count.
- The `Racecourses` and associated travel logic use **118 North American + 16 international** canonical v3.3 track IDs and their geography; display approved fictitious venues with game context, not as DB rows.
- Every person, horse, farm, owner, race and track should open a true **profile**; **one** authorized **Edit Profile** action appears in that profile only. Remove row-by-row pencils on player-facing views. Canon-preserving edit overlays/audit remain separate from simulation actions.
- The original v0.18 engine is a **candidate implementation**, and every reused method must pass modern gates: valid actions, no early race, entry eligibility, realistic rest/shipping, consistent outcome, idempotence, persistent state, stable IDs, and isolated source data.

## Concrete next bounded engineering ticket

**`WTW-GAME-001 — 1999 seven-day vertical slice`:** Extract reusable state/decision/calendar concepts into a pure module behind the existing Office v29 interface and canonical six-horse stable. Begin with one horse, one meaningful message, one real race-date/track choice, and a progression through a week. Do **not** wire the old v0.18 UI and do **not** copy the 2014 starter world into production. Pass a replayable regression test demonstrating both valid and invalid choices, no pre-date race, save/reload, one result, and an after-race consequence.

**Status:** Recovery audit and isolated legacy smoke test **COMPLETE**; no active game engine replacement or site layout change has been made by this note.
