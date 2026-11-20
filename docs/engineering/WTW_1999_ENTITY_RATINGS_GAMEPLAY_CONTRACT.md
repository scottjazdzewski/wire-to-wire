# WIRE TO WIRE — Canonical 1999 Entity Ratings / Gameplay Connection Matrix

**Purpose:** The user needs ONE playable January 1, 1999 world, not just records with 1–99 fields. Every entity's permanent rating values must influence some intended decision/outcome and support calibration. Ratings remain fictional modeled attributes, not claims about actual historical talent. Source IDs and saved careers are immutable.

## Already persisted in the actual V10 opening source

These slots are defined by `rate1999Entity` in `public/1999/engine/fictional-industry-graph-1999.mjs`. **Do not create a competing player/person/horse universe.** Current generated source range: 15–95, stored as actual integer ratings. The population has a different rating for each role.

| Entity | Current saved source rating slots | In-game consumption / exact next gate |
| --- | --- | --- |
| Horse | speed, stamina, acceleration, class, consistency, soundness, temperament, surfaceDirt, surfaceTurf, breedingValue | Registration constructs `starting_attributes`; active-race care and racing use game traits. Full non-player 300k lifecycle and quality calibration still NOT verified |
| Trainer | conditioning, placement, development, raceStrategy, horseCare, reputation, integrity | **This PR:** map saved exact P-ID to six existing `game_training_skills.roleAttributes`; care, wages/fees, condition, performance, race placement are current consumers. Test one-rating counterfactual |
| Jockey | tactics, paceJudgment, finishing, gateSkill, versatility, fitness, reputation | **This PR:** map exact P-ID to ride judgments, pace, finish, composure, handling; selected-colony bookings and official race performance consume them. Test same-seed counterfactual |
| Owner | resources, ambition, patience, riskTolerance, reputation | **Integration PR #330:** resources/ambition drive opening barn and working capital; all five O-ID values now seed the actual AI owner care/investment policy, source-backed patience in trainer reviews/negotiations, and owner-standing effects on trainer contract thresholds. Still needs broad portfolio and #317 budget calibration |
| Farm | breeding, youngstockCare, facilities, management, reputation | **This integration:** exact farm ratings and its workplace-linked manager/attendant affect opening readiness, seasonal live-foal odds, and born-foal readiness/soundness. Farm operating economics remain open |
| Track | surfaceQuality, safety, purseStrength, prestige, facilities | **Integration PR #330:** exact saved T-ID ratings drive opening barn facilities (15% track facilities weight), jockey mount acceptance (prestige coefficient 0.08), horse/track surface-performance interaction (coefficient 0.35, bounded ±0.07), and post-race recovery risk (safety multiplier 0.6–1.4). `purseStrength` already feeds the annual breeding-market index. Still needs distribution calibration, full condition-book/fiscal validation, and Windows acceptance |
| Groom | horseCare, observation, reliability, experience | **This integration:** deterministic exact P-ID selection at the horse's saved track workplace. Care and observation ratings affect the existing daily supervision and modeled risk inputs. Explicit employment contracts/payroll remain open |
| Exercise rider | horsemanship, feedback, fitness, reliability | **This integration:** exact workplace P-ID ratings affect the existing daily training response. Explicit employment contracts/payroll remain open |
| Veterinarian | diagnostics, treatment, prevention, reliability | **This integration:** exact workplace P-ID ratings affect daily modeled prevention risk and recovery. This is not a medical diagnosis or a claim of treatment; explicit consult fees/payroll remain open |
| Farrier | hoofCare, correctiveSkill, reliability | **This integration:** exact workplace P-ID ratings affect daily modeled soundness risk. Explicit work orders/payroll remain open |
| Farm manager | operations, breeding, staffManagement, reliability | **This integration:** exact farm-workplace P-ID rating affects opening and seasonal young-horse readiness and live-foal care. Farm decision authority, staffing capacity and payroll remain open |
| Breeding attendant | horseHandling, reproduction, reliability | **This integration:** exact farm-workplace P-ID rating affects opening readiness, seasonal foaling care, and foal rearing quality. Explicit labor contracts remain open |

## Non-negotiable implementation contract

1. **Source → actual game:** `world.entities.{horses,people,organizations,tracks}` is the only canonical opening record. Map by immutable ID, role and exact saved `ratings` keys. No new random gameplay skills for a person who already has the canonical V10 role ratings. Never use display names as joins.
2. **Versioned trait contract:** declare documented weights, units, bounds, source provenance and output consumers for EACH role. Each gameplay dependency has a unit test; future calibration can change coefficients only as a source/game-rule version, preserving old saves.
3. **Persisted run state:** once a gameplay trait advances, do not overwrite saved skills when a user renames an entity, restarts, changes screens, or loads a new source code version. Do not silently create duplicate personnel or fill missing canonical values with a hash.
4. **Actual causal proof:** hold saved world/seed/input decision constant; raise one role rating while holding other ratings constant, and verify a chosen gameplay outcome changes in the intended direction. Record source attribute, exact consumer function, before/after, and save/reopen behavior. Merely displaying the numeric rating does not count.
5. **World reach:** measure coverage of all 300,000 horses and all 75,000+ people, then separately measure how many participate in daily game simulation. Registered racehorses are NOT the full industry. Non-player breeding, care, race entry, staff and money need their own engine-level lifecycle.
6. **Credible balance:** owner tiers explain a *tendency* toward higher resources, facility quality, and training opportunity, not guaranteed elite genetic talent. Document histograms/percentiles and exceptions, not ad hoc boosts to particular winners.
7. **Money/safety:** owner resources are not free recurring cash; staff/vet/transport/farm expense effects must be backed by valid ledgers and labor relationships. Injury, mortality and breeding events must respect existing game rules and actual life status.
8. **Official 1999 release:** source rebalance or user's exported edits go only through a versioned starting-world release, no mutation of frozen May 29 reference or existing careers. New world cannot replace the 73-record historical research index.

## Current cross-system bridge in PR #330

`WTW_1999_SOURCE_PERSONNEL_GAMEPLAY_V1` connects trainer and jockey P-IDs to the current care, fee, booking, tactic and race-result model. `WTW_1999_SOURCE_SUPPORT_STAFF_GAMEPLAY_V1` connects groom, exercise rider, veterinarian and farrier P-IDs through their existing `WORKS_AT` track assignments to daily care/training inputs. `WTW_1999_SOURCE_FARM_GAMEPLAY_V1` combines the exact care farm and its workplace-linked farm manager/breeding attendant into opening readiness. `WTW_1999_SOURCE_OWNER_GAMEPLAY_V1` maps all five saved owner O-ID values into existing AI care/investment choices and owner/trainer contract decisions. `WTW_1999_SOURCE_TRACK_GAMEPLAY_V1` connects exact saved track T-IDs to opening care-site quality, jockey acceptance, surface match and post-race recovery. Values and consumers are computed from saved source records; no name joins or separate ratings database are used. Existing played skills remain unchanged. New owner, track, farm and support-staff effects are modeled starting rules and still require wider calibration before release certification.

### Added farm weights in `WTW_1999_SOURCE_FARM_GAMEPLAY_V1`

- Farm youngstock environment: `youngstockCare .35 + facilities .20 + management .20 + breeding .15 + reputation .10`.
- Farm breeding operations: `breeding .50 + management .20 + facilities .15 + reputation .15`.
- Farm manager operations: `operations .40 + staffManagement .30 + reliability .20 + breeding .10`; manager breeding operations: `breeding .55 + operations .20 + staffManagement .15 + reliability .10`.
- Breeding attendant handling: `horseHandling .55 + reliability .25 + reproduction .20`; attendant reproduction: `reproduction .60 + horseHandling .20 + reliability .20`.
- Opening care quality combines farm environment `.70`, manager composite `.18`, and attendant composite `.12`; it shifts source-derived readiness by `.06 × (quality − .55)` before normal game training begins.
- Seasonal rearing uses the same exact-worksite `.70/.18/.12` composite. For due foaling forecasts, `liveFoalRate = clamp(.88 + seededYearRate(.00–.08) + .04 × (quality − .55), .01, .995)`. The same seeded covering lottery remains, so quality moves outcomes monotonically without changing the crop seed or guaranteeing births.
- Born foals record the rearing farm and selected resident manager/attendant IDs. Rearing quality shifts readiness by `12 × (quality − .55)` and soundness by `8 × (quality − .55)` on the 0–100 developmental scale; it never changes inherited genetic potential.

### Added professional weights in `WTW_1999_SOURCE_SUPPORT_STAFF_GAMEPLAY_V1`

- Groom care: `horseCare .45 + observation .25 + reliability .20 + experience .10`; groom observation: `observation .55 + experience .25 + reliability .20`.
- Exercise-rider training response: `horsemanship .45 + feedback .30 + fitness .15 + reliability .10`; pace work: `horsemanship .35 + feedback .35 + fitness .20 + reliability .10`. The two outputs combine `.60/.40` in the training-response factor.
- Veterinary prevention: `prevention .45 + diagnostics .25 + reliability .20 + treatment .10`; treatment/recovery: `treatment .55 + diagnostics .25 + reliability .20`.
- Farrier hoof care: `hoofCare .60 + correctiveSkill .25 + reliability .15`.
- Support staff are selected deterministically by exact role/workplace and horse ID; source staff IDs are recorded and validated in daily care history. No new salary or work-order transaction is inferred by these quality effects.

## Suggested calibration evidence per category

- Horses: opening speed/quality/potential by barn tier, age, sex, track, 5f/route, turf/dirt; winner probability and form/residual calibration after races.
- Trainers: fitness change per 30 days, injury/downtime, race-placement suitability, care costs vs skill and workload.
- Jockeys: finishing residual controlling for horse ability and race field, tactical suitability, trip/distance, realistic booking and fee distribution.
- Owners: actual cash runway, sale/buy behavior, risk decisions, elite/resource variation and financially failing farms.
- Farms, vets, staff: seasonal foal survival/rearing and youngstock development now consume farm/resident-staff quality; welfare, expense distributions, staffing load and broader calibration remain to measure.
- Tracks: surface effects, purse economics, safety and running-style effects without predetermining winners.

## Ownership between windows

- Integration window owns source trait API, save/runtime consistency, causal tests, baseline fingerprint compatibility, Windows EXE and final merges.
- The dedicated **Entity Ratings Desk** owns proposing/reviewing concrete roles, mapping weights, units and calibration ranges for owners, farms, tracks, grooms, exercise riders, vets, farriers, managers and breeding attendants. Use THIS matrix, review code and propose one focused reviewed spec PR, without a duplicate world or own EXE.
- Lane 1 owns race engine consumption; Lane 2 owns horse/farm breeding and lifecycle; Lane 3 owns employee skills and staff decisions; Lane 4 owns owner/farm money; Lane 6 owns established in-game UI. Pictures untouched.

**Do not label fully integrated until all required slots have a real audited consumer, non-player industry coverage and both standard source/Windows acceptance tests.**
