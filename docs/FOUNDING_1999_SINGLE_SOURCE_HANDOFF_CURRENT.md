# WIRE TO WIRE — CURRENT GAMEPLAY HANDOFF
## Horse generation → first playable January 1999 race → initial testing

**Authoritative for the next GAMEPLAY / production-engineering window.** Updated **November 13, 2026**. Replaces the older, contradictory 1999 handoff instructions; do **not** follow earlier 112/267/87,500/325,000 horse totals, B01 records, generated opening finances or old staff populations.

**Repository:** https://github.com/scottjazdzewski/wire-to-wire (branch `main`)  
**Current inspected baseline:** `2cc95ef9fad8564a8a96d52f8d6d748b9d9383d8` — re-fetch current main before changing anything; concurrent windows work in this repository.  
**Player site:** https://wire-to-wire.pages.dev/next/?world=1999  
**UI owner:** *a different window*. **THIS window is gameplay only**: horse admissions, immutable identities, trainer/rider/barn contracts, eligibility, simulation, finance, game days, save integrity, and integration. Don't redesign screens, move components or change the approved Football Manager/OOTP full-width roster appearance. The duplicate horizontal department menus have already been removed: retain the `VIEW` dropdowns.  
**Horse naming:** *another window is building/refining it*. Consume that window's accepted name release; **do not create a competing horse-name engine**.

### 0 — Actual opening inventory, not a proposed population

| Existing record | Status in the CURRENT January 1, 1999 opening |
| --- | --- |
| 37 founding organizations | Approved game identities, exact O-IDs. Some principal slots still deliberately unresolved |
| 41 founding leadership/person identities | Preserved; not equivalent to an employed jockey/trainer pool |
| 26 jockeys | Explicitly user-selected identity roster in `public/data/wtw-1999-jockey-pilot-v1.json`. Their mounts, skill ratings, age verification and employment are **not** yet game-authorized |
| 20 trainers | Existing-ID identity roster in `public/data/wtw-1999-trainer-pilot-v1.json`. No live horses, assignments, certified contracts or staff salaries |
| 73 living breeding animals | **18 stallions + 55 broodmares**, exact source H-IDs, existing history/pedigree preserved |
| Registered racing horses | **ZERO**; deliberately empty Stable |
| 30 institutional facility references | 5 stud operations, 15 farms, 10 racing stables; **ZERO certified physical barns, training centers, or new properties** |
| Racecourses | **118 in the current North American / Caribbean / Cuba directory**, including **16 closed historical tracks** that remain visible but must not be given 1999 meets. No international track injection |
| Active sales catalogs, race entries/results, newly funded owner accounts | **ZERO** until properly created in the live game |
| Founder logos | 21 approved mapped organization marks on site; other window owns graphics |

**Important distinction:** 37 organizations are *not* 37 buildings. A breeding farm reference, physical registered facility, track-owned stable, and trainer-operated track barn are different entities. A horse owner can be entirely different from the owner/operator of the barn where the horse lives. The **1999 source opening remains empty** even after a later test-career registration creates new user-authorized animals: do not rewrite the source catalog to make old fake horses look historical.

The latest inspected commit had **all four workflows passing** (1999 source integration, Canon Desk, horse development, Desktop Visual Audit). Recheck *the actual new HEAD* after work; don't claim deployment or gameplay playability simply because source-level UI tests passed.

### 1 — FIRST: receive horse-name candidates, choose a genuinely small cohort

**Work immediately on this; do not go back into another global audit.**

1. Locate the latest accepted horse-name-generator output from its owner, **not** the personnel/organization generator. Record its release/version, collision rules and reserved-names source. If no accepted release exists, prepare the intake/validator and a candidate manifest **without inventing replacement names**.
2. Stage a **candidate** list of approximately **24–40 newly fictional 1999 racing horses** (NOT 400 automatically registered runners). This is an engineering target for the *first few sample races*, not authority to insert unapproved entities into the game.
3. Prioritize horses capable of racing in January/February 1999: principally 3-year-olds and older, plausible sex/class/surface/distance combinations. Under North American racing age rules, a horse born in 1996 is 3 on January 1, 1999. Younger 1997/98 stock belong to a **separate, optional later breeding/youngstock exercise** and are not automatically race-ready.
4. Check prospective names against all accepted living/historical source names and other reserved new names. No duplicates, recycled prestigious champions or unapproved old cohort names. Record the *version of the naming release* that supplied each selected name. Preserve a reviewable name candidate log; no invisible mass registration.
5. Start with **one real 1999 winter meet** (Gulfstream Park is a practical first suggestion), and only then a second distinct circuit (Aqueduct is a practical suggested comparison). Track choice and precise dates must be checked against `public/next/1999-track-program.mjs`, `public/next/1999-condition-book-engine.mjs` and the approved 1999 calendar. Do not assume an invented race date or take a closed historical track.

**Authorization gate:** do not resurrect or inject the old B01/325k/87.5k test animals, the previously proposed 84 uncommitted youngstock or the unauthorized 400-runner experiment. Any newly named, registered group must be *the explicitly accepted new test-world cohort*, using exact persistent IDs and a versioned registration manifest. The user wants progress without micro-managing every minor engineering detail, but that is **not blanket permission** to import an unseen synthetic population.

**Deliverable:** one reviewed, deduplicated horse-name/cohort manifest with proposed ages, racing program and origin of the naming release, **before** admitting any horse to the game.

### 2 — SECOND: create one canonical game horse-registration path

**Do not create a second shadow horse table, World directory or alternative UI model.** Extend the one authoritative gameplay/run state and publish its read projection using immutable IDs.

Each horse registered into a new *fictional game career* needs, at minimum:

- `horse_id`: permanent newly allocated ID, globally collision checked against historical and accepted game IDs; `registered_name` from accepted name release; `sex`; `foaling_year` and an internally plausible birth date; January 1 racing age.
- `sire_id` and `dam_id` where genuinely supported by the approved fictional lineage record; source animal IDs may be used as parents **only if reproductive age, timing and genealogy make sense**. Do not silently assert a real historical mating. If an ancestor is not yet established, keep that link explicitly unknown rather than attaching a convenient source mare/stallion.
- `breeder_organization_id`, `owner_organization_id` and a distinct credible `foaling_location_id`; owner and breeder are not necessarily the same.
- `current_residence_id` (real registered physical site), `trainer_id` and `racing_barn_id` for race-training animals. Those are distinct from source foaling place and owner headquarters. For non-training youngstock, no fictional trainer is required.
- Racing status, surface/distance preferences, current fitness/health/fatigue, age-appropriate current and potential ability, training configuration and game-fictitious starting career statistics. **No fabricated historical stakes wins or starts.** All opening-game facts are marked `NEW_1999_GAME_FICTION`, not certified historical source.
- Registration receipt/event ID, authority/version, seed (if any), creation/game date, opening-world version, data/provenance checks and an idempotency key: running creation twice cannot duplicate the horse.

**Implementation target:** after authorized registration, `horse_id` resolves to the **same game entity** in Stable, World horse directory, owner portfolio, pedigree, trainer roster, race entry, jockey booking, race result and finance ledger. The existing 73 breeding horses and historical IDs are immutable. Source-only APIs may remain read-only, but the player/game-facing projection must expose the newly registered animals; don't leave `/api/1999/sim/horses` permanently zero in a genuinely populated career.

### 3 — THIRD: use the 26 jockeys and 20 trainers already chosen

The game must consume the selected identity rosters, **not generate fresh professionals** just because roster/ratings/contract cells are blank:

- Jockeys: `public/data/wtw-1999-jockey-pilot-v1.json` → 26 selected. Paloma Reyes is **male**, Simonne Beaulieu is **male** and primarily Woodbine/Ontario with **selected major New York stakes opportunities**, and Owen LeBlanc is from **Louisiana**. Preserve existing P-IDs. Country/background diversity has already been selected.
- Trainers: `public/data/wtw-1999-trainer-pilot-v1.json` → 20 existing P-IDs. Keep established names and operating bases; use the geography in these records for realism.
- Contract/rating assignments are gameplay release work; assign individually, store separately from immutable identity metadata, and label modeled 1999 values as **game parameters**, not historical facts. One jockey cannot ride two horses in the same race or incompatible overlapping races; rider travel and availability must be plausible.
- **No grooms or exercise riders as player-facing personnel.** Keep AI bound to the same booking, entry, financial and fatigue rules as the player.

**Deliverable:** selected trainers and jockeys are real, available in the gameplay registry with career/save state, and can be assigned to newly registered horses and races. Their old identity-only directory should not be mistaken for a populated racing workforce.

### 4 — FOURTH: create the MINIMUM genuine places the horses live

There are presently **ZERO physical facilities**. Do **not** treat the 30 approved institutional references as ready-to-use licensed properties, nor let owning an organization automatically conjure a stable.

- First register the **smallest number of actual locations needed** for the accepted horses (a few owner farms / trainer track barns, as justified by geography). Each gets its own F-ID, operator O-ID/P-ID, site/city/state, type, track host T-ID when applicable, occupancy and stall capacity. Do not create 28 or 37 buildings merely to fill a list.
- A trainer can have stalls at a racetrack; horse X owned by O-A may live in a barn operated by trainer P-B at track T-C. The horse's actual `current_residence_id`, `trainer_id`, `owner_organization_id`, `breeder_organization_id` and `foaling_location_id` must stay distinct.
- Each operating facility is an independent income/cost center. Model upkeep, fees, staffing, quality/condition and capacity as **fictional game economics**; do not use imaginary values masquerading as certified source finances. Horse wellbeing/training effects should be modest, bounded, deterministic/testable and derived from the real facility attributes, **not reputation alone**.
- Use `src/game/facility-operations.js` as the existing rule foundation where it fits. **Do not seed from `src/game/facility-market-1999.js` without replacing its old `CANON_ANCHORED_TEST` / `F-TEST-FARM-*` assumptions**—those represent the retired generated world.

**Deliverable:** every admitted racing horse has one real, staffed, geographically possible current home, with capacity/owner/trainer validation. Operating costs post through the same save ledger as all other transactions.

### 5 — FIFTH: make ONE genuine race enterable and finishable

This is the first **real gameplay** acceptance milestone, before adding hundreds more animals.

1. Select an actual 1999 open-track race / supported condition-book event, correct meet date, surface, distance, class, purse and age/sex conditions. A test field of **about 8–12 eligible horses** is enough to validate the first race; this is a test target, not a pretend historical running.
2. Bind eligibility to the **newly registered game-horse roster**. `src/1999/entry-gate.mjs` currently builds horse/race maps from `src/1999/opening-world.v1.mjs` (the source archive), **not the new live registered cohort**. Refactor that boundary rather than letting an old archive horse appear as a playable entry. Require owner consent/authority, medical and training readiness, class/conditions, rest, horse location/ship time, jockey availability, stall capacity and cash.
3. Create actual player AND AI entries through one validation/commit command; return precise rejection reasons, don't silently “enter” an ineligible animal. Avoid duplicate entries, rider overlaps and impossible same-day travel.
4. Use one deterministic, reproducible race-resolution service against the actual admitted runners. Don't just invent a winner on the UI. Archive exact starting field, finishing order, trainer/rider IDs, race time/date, scratches (if applicable), purse distribution, and physical changes (fatigue/recovery). `public/1999/engine/compact-race-results.mjs` already offers an immutable monthly results archive; it is **not** by itself the race simulator.
5. Post purse earnings, entry/shipping/training/boarding/riding expenses, horse and personnel career records to the **same authoritative game journal** with one transaction/event ID. Enforce balanced accounts and no double posting after refresh/replay.
6. Advance the in-game date, observe recovery and changed eligibility, then run a second race on a later valid date. `public/1999/engine/horse-development.mjs` exists for workouts/recovery; integrate it, don't clone a new training engine.

**Engine architecture to reuse:** `src/game/state.js` and `src/game/kernel.js` provide run validation, clock/commands and event journal, but current kernel documentation says **race effects are not implemented yet**. `src/game/ownership.js` provides sparse ownership transactions. `public/next/1999-canonical-gameplay-bridge.mjs` is a **proposed, not live** UI command/projection bridge; its older world-kind vocabulary must be reconciled to the clean `FOUNDING_1999` before activation. Extend one state model rather than adding a second payouts ledger or a UI-owned simulator.

### 6 — SIXTH: persist and connect the game state

- A brand-new clean January 1999 career must start at zero registered racers and then contain **exactly the cohort the user admitted**. Save/reload must preserve every new horse ID and name, owner, trainer, jockey booking, residence, workouts, injuries, entries, results, money postings, game date and AI state. Creating a new clean career must not inherit the previous career's horse registrations.
- Existing browser save roots: `wtw1999FoundingStateV1` (current Office state) and `WireToWireClean1999CareersV2` (compact career IndexedDB); coordinate with `public/next/1999-commercial-career-manager.mjs`. Do not import retired named saves or old population modes. Choose an explicit, versioned migration for newly supported gameplay entities.
- All player views remain the **existing approved `/next/` pages**. Route gameplay state/commands through one engine-owned projection/receipt boundary. A record clicked in one view must open the **same exact-ID profile** elsewhere. Coordinate any necessary UI bindings with the separate UI window; **no redesign**.
- There must be one truth for the game clock, race results and finances. No false “race entered” confirmation when only a display preview exists.

### 7 — Test gates and expanding population (in order)

| Gate | Required measurable proof |
| --- | --- |
| **A. Empty-source regression** | New untouched game: 37 founding orgs, 41 principal people, 26 jockey + 20 trainer chosen IDs, 18/55 protected breeders, 118 domestic/Cuba tracks; **zero racers, physical barns, generated workers and active entries**; historical references unchanged; retired generators still deleted |
| **B. Horse creation** | First approved new cohort 100% unique IDs/names; accepted lineage/ages, true owners and residences; idempotent creation; no source animal mutated |
| **C. Workable barn/people** | 100% of race-training horses have valid trainer and actual physical space; rider and trainer identities resolve; no automatically invented personnel/capacity/money |
| **D. First race** | One complete 8–12-horse-ish live test race: every entry passes eligibility, actual finishing order exists, result and purse ledger reconcile, all horse/rider/trainer career records update |
| **E. Career continuation** | Save → close → reload → advance days → later race. No duplicate event, lost records, ghost horse, duplicate winnings, incompatible booking or impossible travel |
| **F. First playable card** | Expand only enough to fill a plausible complete card at first pilot track, then test second geographic circuit. Do not seed 400 horses by default. |
| **G. Release to separate testing window** | Exact Git commit, opening snapshot version, registered-horse and barn counts, seed, completed race ID/date/field, screenshots on approved UI, exported importable save, CI and any known limitations |

Run `node --test tests/1999-approved-only-world.test.mjs`, `node --test tests/1999-founding-world.test.mjs`, `node --test tests/1999-horse-development.test.mjs`, `node --test tests/1999-entry-gate.test.mjs` and `npm test`; add **new** tests for registration/booking/racing/finance/save. Execute the repository's Chromium browser smoke (`scripts/1999-management-browser-smoke.sh` through its GitHub workflow) and Desktop Visual Audit. The immutable clean-source zero-horse test must still pass even when a **separate test career** legitimately has registered racing horses.

**Stop point for handing the game to the test window:** user can launch a fresh 1999 career, see admitted horses in Stable, train one, enter one with a booked jockey, watch an AI field compete under the same rules, settle an actual race, see finances/records change, save/reload, and continue to a second day without contradictions. **Anything short of this is foundation work, not “gameplay testing ready.”**

### 8 — Exactly what the NEXT window should do on its first turn

1. Open **this file** and fetch latest `main`. Confirm all four GitHub workflows on the inspected exact SHA. Do not repeat the old global audit or rebuild the UI.
2. Request/intake the horse-name generator's **accepted release** and build the deduplicated **24–40 candidate horse-cohort manifest**, preserving the unchanged zero-runner source until the new cohort is authorized.
3. Commit one canonical, reversible **game horse-registration command + validator** with a minimal admissible first group and integration tests. No bulk seeding. Wire the gameplay owner's versioned state as the only live source.
4. Close the minimum real trainer/rider/barn links, then one race, its ledger postings, and saved career replay. Work in short, meaningful commits and report exact horse/field counts—not “progress” without actual code.
5. Once the first end-to-end race works, hand an actual importable testing save to the separate testing window; **then** expand to a full card / extra meets in measured cohorts.

**Strict prohibitions:** NO B01/39 runners, old 267 opening horses, 84 uncommitted youngstock, 87.5k/325k synthetic world, fabricated historical results or balances, generated 28-stable pilot, 37 phantom buildings, international tracks, silent aliasing of people/horse IDs, unrelated graphics/UI redesigns, fake race completion, unapproved mass horse registration, or a parallel game engine. Other windows own graphics and the naming engine. This gameplay window builds the working simulation.

**Historical/identity references that remain relevant:** `public/data/wtw-1999-founding-directory-v1.json`, `docs/1999-founding-leadership-roster.md`, `public/1999/engine/founding-world-1999.mjs`, `public/1999/engine/local-api.mjs`, `public/next/1999-ui-source.mjs`, `public/next/1999-track-program.mjs`, `docs/1999-founding-gameplay-integration-contract.md` (use its stable identity guidance only; where older world counts conflict, THIS document wins). Long-standing fictional institutional histories belong in the protected World Bible, not in generated game-economy records.
