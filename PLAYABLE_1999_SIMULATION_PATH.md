# WIRE TO WIRE — AUTHORITATIVE PATH FROM OFFICE BUILD TO RACING SIMULATION

> **User-approved sequencing update — November 9, 2026:** SITE LAYOUT AND FEEL FIRST. The other window owns the canonical Office/UI build. The active layout must feel like a racing simulation before further gameplay is added. Approved badge authority is Google Drive `03_REFERENCE/WTW_PROFILE_BADGES` (four actual PNG files); DO NOT regenerate or reinterpret them, and store every newly approved badge in that same folder. The single actionable handoff is https://docs.google.com/document/d/1EqAlS-wB1s-FVx1SRFNZc4cUYTLX3gbWM8Q-m8dG8f8/edit. The badge names Pedigree, Career Record, Achievements, Reputation, Meet Schedule, Major Races, Connections and History/Archive are proposed future categories, not permission to generate unapproved designs. The engineering kernel stays intact; do not overwrite the UI window's active HTML or create a parallel visual canonical build.

> **Engineering status — November 9, 2026:** Framework V1 is now IMPLEMENTED and passed GitHub CI. Modules `src/game/contracts.js`, `state.js`, `kernel.js`, `rng.js`, `persistence.js`, `selectors.js`, and `index.js` provide a source-bound `WTW_WORLD_SNAPSHOT_V1` → `WTW_GAME_RUN_V1` state, unique command receipt/replay protection, validated decisions, one-day clock and due-event delivery, deterministic seed, save/reload and Office/Stable read selectors. Tests: `tests/simulation-framework.test.mjs`; documented contract: `docs/SIMULATION_FRAMEWORK_V1.md`. **No training/race/AI outcome rules installed, no 1999 roster silently imported, no canonical Office UI modification, no remote game-run persistence or new D1 gameplay database.** Next framework work: approved world-snapshot adapter and durable game-run save adapter; only then domain mechanics and UI wiring.


**Date:** 2026-11-09  
**Scope:** Engineering delivery sequence; no parallel registry, redesign, or false completed-status claim.  
**Product objective:** A believable 1999 Thoroughbred racing-management world in which the player acts, time advances, horses and people change, complete races are run, and competing operations act independently.

## Current verified starting point (do not confuse status levels)

| Layer | What we have | Missing for gameplay |
| --- | --- | --- |
| Player-facing Office | Google Drive `WIRE_TO_WIRE_UI_CURRENT/01_CURRENT_BUILD/index.html`, canonical Office FM Track Profile Foundation **v30** per `00_START_HERE/CURRENT_STATE.md` and engineering handoff. Its v29 decision outcomes, date-driven follow-ups, race calendar, horse/people/farm profiles and new initial track profiles are supported. A separate game-first v32/v33/v34 review design exists but is **not** automatically promoted to canonical. | A complete state-aware Stable route, real daily operations, field-level entries, race-day simulation and an integrated game-first navigation model. |
| Legacy mechanics | User-supplied v0.18 ZIP has actually executed decision, calendar, race and narrative code. It can save/reload and avoid duplicate results, but its 2014 demo data, bespoke stories and code have no 1999 canon authority. | Repair invalid inbox options and premature race execution; adapt modular logic to canonical IDs and a deterministic game run. |
| Historical and 1999 truth | v3.3 canon registry and production partitions; 118 North American tracks + 16 international geographic records; Horse IDs and 1999 barns; deeper historical archive. | Build a bounded **certified game-input slice**: exact selected horse IDs and cards, current locations, trainers, owners, condition-book races and complete fields. Do not infer missing data. |
| Read-model/site | GitHub `scottjazdzewski/wire-to-wire`: track directory, 8,465 geography records staged, schema/import compiler/Access-protected API. Offline CI passed. | Authenticated remote D1 geography import was not confirmed as executed; the site read model and latest Office build are not yet one integrated playing application. |
| Model quality | Legacy v0.18 race scorer is a plausible demonstration with pace, class, readiness, distance and rider factors. | Independent simulation calibration and plausible results, reliability, race shape, track/surface effects and AI fairness tests. It is **not** an approved final race engine. |

## Hard boundaries — one source of truth per layer

1. **Frozen history** (1864–1998 and source-certified factual 1999 inputs) is read-only. Do not script historical outcomes into fictional future races.
2. **Canonical identities/geography** come from the accepted WTW Drive registries, with source status and fictional canon explicitly separated. Do not invent or reassign immutable Horse_ID, Track_ID, Person_ID, or Organization_ID to make the simulation compile.
3. **A single mutable game state** is namespaced by `game_run_id`, date, deterministic PRNG seed, player role/operation, horse conditions, entries, staff, finances, relationship statuses, and event log. It is separate from the source archive and from UI-only preferences.
4. **A single event pipeline** advances date and triggers training, recovery, stable decisions, shipping, entry deadlines, race cards, races, finances and inbox. No extra independent roster/calendar/database created for each screen.
5. **The approved Office layout belongs to the existing UI window.** Gameplay work exposes a narrow state/action contract to it. Do not overwrite `01_CURRENT_BUILD/index.html` from a different window or accidentally promote unapproved v34 review artifacts.
6. **Editable profiles are a controlled administrative feature**, accessed from inside a horse/person/farm/track/race profile, with auditable drafts/preview/version/revert; no list-row pencils and no silent rewrite of canon. Gameplay buttons (train/ship/enter) are distinct from administrator editing.

## Seven staged delivery milestones with strict gates

### M0 — Freeze a bounded playable fixture; stop chasing every source gap

- Select **six approved starting horses** already on the Office Stable Board: Powerline, The Last Match, Iron Harbor, Pieta, Bellarmine and Hardtack. Verify canonical game/registry references before promoting any name or Horse_ID; **do not assume the v0.18 Powerline is the same identity**.
- Locate the corresponding trainer/owner and physical barn, an eligible 1999 meet, entry conditions, seven-day start window and a **complete authentic or explicitly fictional game-generated field**; its participant identities must be accepted WTW IDs.
- Load only the data needed for this bounded fixture: horse attributes (measured vs estimated), trainer/owner/jockey, track, surface/distance/class, shipping geography and race day. If an input is unknown, block or label the approximation, never misrepresent it as certified.
- **Gate:** one reproducible manifest of exact source IDs, approved provenance/status, one player starting operation, at least one eligible race. No new master ledger; the fixture is a versioned input to the game.

### M1 — Canonical game state and action dispatcher

- Implement pure `createGameRun(sourceSnapshot, seed)`, `applyAction(state, action)`, `advanceDay(state)`, `saveGame(state)`, and `loadGame(save)`; use action validity schemas and a monotonic event log.
- Use v0.18 `state.js` and `decisionEngine.js` as **reference implementations**, not unquestioned replacements. Every mutation must be atomic, auditable and idempotent where appropriate.
- Give the player a primary role and independent involvement level (hands-on, balanced, executive). These alter access/automation of decisions, not the underlying horse physics.
- **Gate:** invalid action has zero state change; same seed + action sequence reproduces same state; reload reproduces date, horse condition, finances and all pending decisions; historical tables unchanged.

### M2 — Stable-to-Office-to-calendar loop

- The UI window provides the state-aware six-horse Stable route and profile routing using approved Office state—**not a second roster store**.
- Player can assign light/standard/hard work, rest, veterinary observation or entry preparation to a chosen horse. Work changes fatigue, fitness, soundness risk or race readiness by **bounded tunable rules**, not instant magical improvement.
- `advanceDay` processes workout effects, recovery, health alerts, staff availability, stable costs, owner/trainer updates, fresh mail and time-sensitive entry obligations.
- **Gate:** seven consecutive game days, two meaningful independent choices, at least one missed deadline or schedule consequence, one recovery cycle, all reflected in Office/Stable/Calendar and after save/reload. Zero table lookup is required to play.

### M3 — Racing secretary, race book, fields and geography

- Generate or load race conditions and meet schedules only for approved eligible venues/operating dates. Preserve explicit historical/simulated race provenance.
- Entry checks: age, sex, surface, distance, class/condition, horse racing status, rest, barn/travel location, closing time, capacity, jockey/weight if supported, scratches and race-day availability.
- Travel calculator uses actual canonical travel nodes and approximate realistic shipping time/cost; horse moves through transit/arrival/acclimation rather than teleporting to every race. Provide clear guardrails for short-turnaround shipping, not simplistic all-era prohibitions.
- AI competes for slots using the same eligibility rules as a player. Build a **complete field**, not only the player's runner or top-three historical finishers.
- **Gate:** one valid entry; one refused ineligible or late entry; one shipped runner with cost and arrival; complete field and declared scratches. Cannot start any race before its date.

### M4 — Race engine and broadcast-quality result

- Adapt v0.18 race engine as a **candidate**: raw ability/speed, class, distance and surface affinity, fitness and soundness, post/draw, pace pressure/early vs late energy, running style, jockey skill and tactics, trip variability, going/weather and field interaction.
- Run every entry through one internally consistent stochastic model with seeded draws; calculate full finish order, time/margins when supportable, runner trips, a dynamic race call and proper result audit. Separate pace/visual narration from the scoring result; never decide a winner based on a scripted paragraph.
- Race runs **exactly once** per eligible event and respects scratches, entry eligibility and temporal order. Finish updates winnings/purse accounting, fatigue/fitness, health risk, career record, connections and the next inbox briefing.
- **Gate:** full race day from arrival to published results; save/reload keeps the identical finish; duplicate trigger does not rerun; invalid early run refuses. Check field/results are complete and no horse appears twice.

### M5 — First complete PLAYABLE week (vertical-slice acceptance)

**Player journey:** Open Racing Office → choose a horse → inspect profile and barn → choose a training/rest plan → consult race book → enter or decline → organize shipping/jockey → advance dated calendar → handle scratches and race day → watch race call → receive results, expenses, relationship changes and tomorrow's inbox.

**Pass checklist:**
- Seven or more consecutive dates with no temporal contradictions.
- Six real starting stable identities and one full believable race field.
- Player decision, AI decision, rest/health, shipping, entry, scratching, official race result and financial effect each appear at least once.
- Source records are immutable; simulation produces `game_run_id` results distinct from the historical vault.
- Save/reload identical with deterministic replay and regression checks; errors show actionable messages instead of silently forcing an outcome.
- The player does not need to browse administrative data tables at any step.

**THIS is the first actual PLAYABLE milestone.** Treat it as the main release gate and stop adding new site sections until demonstrated.

### M6 — Believable independent racing universe

- Expand accepted roster and meet/condition book gradually from the staged 2,500/5,000/10,000-horse partitions, after per-partition source acceptance. The main 2,991 registry is not the population ceiling.
- AI trainers assign work, target races by horse profile/circuit/fitness/purse, balance rest and shipping, make jockey bookings, enter/scratch horses and budget resources autonomously using the **same engine rules** as the player.
- Populate racing office news, agents, owners, backstretch conversations, race calendars, meet standings, injuries/layoffs, career changes, reputations and money without flooding the user with irrelevant decisions.
- **Gate:** unattended 30-day simulated world produces viable complete cards, no duplicate race results, no impossible travel, no blank mandatory fields, bounded economics and consistent horse career chronology. Role-based access works for owner/trainer/farm/breeder/jockey lenses without rewriting core mechanics.

### M7 — Full management simulation (post-gameplay scope)

Only after M5+M6: start-of-career choices and operation sizes, breeding cycles and sire/mare contracts, auctions/claims/private sales, staff hiring/firing, facility building, medical/vet depth, loans/operating costs, purses/bonuses, long-term seasons, reputations, international racing, and multi-year genealogies. Expand one subsystem at a time and prove it can persist across seasons. Never gate the whole first playable week on finishing these.

## Race-engine verification gates (nonnegotiable)

- **Logic:** no race before scheduled start; no horse in two simultaneous events; only eligible entrants; complete field; one result per scheduled race; scratch/cancellation handled; no 2014 legacy identities leaking into the 1999 world.
- **Statistics:** run seeded thousands-race simulations with known horse profiles; check modeled favorites win more often than longshots *in aggregate* without deterministic wins, pace styles behave realistically, field size and class alter outcome, jockey and surface effects are bounded, no systematic impossible margins/times, stable fairness across AI and player.
- **Persistence:** exact reproducibility for the same game state/seed/action event log; updates are transactionally consistent; migration safe when adding later seasons.
- **Experience:** a race call matches the actual structured running order and finish. Upcoming races and consequences surface through the in-world Office and horse profiles instead of raw database rows.

## Implementation seams (responsibility split)

| Stream | Owner / integration rule |
| --- | --- |
| Game state + AI + racing mechanics | Engineering lane: develop and test **pure functions**, an isolated `game_run_id` save model, event/outcome schemas and API adapters. Do not alter Office HTML without the UI owner's promoted authority. |
| Office / Stable / Race Day presentation | UI/layout lane: consume game state/actions and preserve approved visual decisions. No hardcoded duplicate horse world state. |
| Horse, track, breeding, race source coverage | Canon-data lane: continue v3.3 reconciliation and historical exact-date audits **independently**, promote only verified inputs needed by play; no blocking on all 1973–1998 date research. |
| Protected history/geography site API | Cloudflare integration lane: read canonical and source-status geography through Access-protected API after explicit D1 import, without treating staged GitHub data as already deployed. |

## Next three engineering actions

1. **M0 input fixture contract:** identify six current Stable Board identity IDs and choose one suitable 1999 meeting/race/field from accepted canon; record exact source references and state gaps. Do this before choosing winners or creating fictional horses.
2. **M1 state kernel from v0.18:** implement `game_run_id`, deterministic event reducer, valid action dispatch, 1999 clock, save/load and regression tests for the two reproduced legacy bugs.
3. **M2 integration contract:** feed one live horse and one real decision into the current Office state-aware Stable screen, then advance a day and make the outcome visible in the Office, Stable and Calendar.

**Explicit non-goals for the next milestone:** a complete 1999 horse population on all tracks, verified exact dates for every historical stakes edition, full bloodstock economics, polished cinematic race graphics, perfect global handicap calibration, and a full player-profile editor. These can follow M5; none should prevent the first functional week.
