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
| Farm | breeding, youngstockCare, facilities, management, reputation | Persisted in source; must connect to fertility, foal/youngstock development, daily care and operating expenses for actual farm staff and horses—not just owner-runner bonuses |
| Track | surfaceQuality, safety, purseStrength, prestige, facilities | **Integration PR #330:** exact saved T-ID ratings drive opening barn facilities (15% track facilities weight), jockey mount acceptance (prestige coefficient 0.08), horse/track surface-performance interaction (coefficient 0.35, bounded ±0.07), and post-race recovery risk (safety multiplier 0.6–1.4). `purseStrength` already feeds the annual breeding-market index. Still needs distribution calibration, full condition-book/fiscal validation, and Windows acceptance |
| Groom | horseCare, observation, reliability, experience | Persisted; must connect real care-staff P-ID to condition/injury detection and actual wage/scheduling ledger |
| Exercise rider | horsemanship, feedback, fitness, reliability | Persisted; must connect assigned rider P-ID to training accuracy, pace works and payroll |
| Veterinarian | diagnostics, treatment, prevention, reliability | Persisted; must connect vet P-ID to actual injury prevention/treatment and fees without creating fictitious recoveries |
| Farrier | hoofCare, correctiveSkill, reliability | Persisted; must connect farrier P-ID to soundness care, downtime and paid work |
| Farm manager | operations, breeding, staffManagement, reliability | Persisted; must connect farm decision authority, staff capacity, breeding efficiency and payroll |
| Breeding attendant | horseHandling, reproduction, reliability | Persisted; must connect valid live covering/foaling care and staff payroll without double-counting foals |

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

`WTW_1999_SOURCE_PERSONNEL_GAMEPLAY_V1` connects exact saved trainer and jockey P-IDs to the current care, fee, booking, tactic and race-result model. `WTW_1999_SOURCE_OWNER_GAMEPLAY_V1` maps all five saved owner O-ID values into existing AI care/investment choices and owner/trainer contract decisions. `WTW_1999_SOURCE_TRACK_GAMEPLAY_V1` connects exact saved track T-IDs to opening care-site quality, jockey acceptance, surface match and post-race recovery. The values and consumers are locally computed from the saved world; no name joins or separate ratings database are used. Existing played skills remain unchanged. New owner and track effects are modeled starting rules and still require wider calibration before release certification.

## Suggested calibration evidence per category

- Horses: opening speed/quality/potential by barn tier, age, sex, track, 5f/route, turf/dirt; winner probability and form/residual calibration after races.
- Trainers: fitness change per 30 days, injury/downtime, race-placement suitability, care costs vs skill and workload.
- Jockeys: finishing residual controlling for horse ability and race field, tactical suitability, trip/distance, realistic booking and fee distribution.
- Owners: actual cash runway, sale/buy behavior, risk decisions, elite/resource variation and financially failing farms.
- Farms, vets, staff: foal survival/rearing, youngstock development, welfare, expense distributions, staffing load.
- Tracks: surface effects, purse economics, safety and running-style effects without predetermining winners.

## Ownership between windows

- Integration window owns source trait API, save/runtime consistency, causal tests, baseline fingerprint compatibility, Windows EXE and final merges.
- The dedicated **Entity Ratings Desk** owns proposing/reviewing concrete roles, mapping weights, units and calibration ranges for owners, farms, tracks, grooms, exercise riders, vets, farriers, managers and breeding attendants. Use THIS matrix, review code and propose one focused reviewed spec PR, without a duplicate world or own EXE.
- Lane 1 owns race engine consumption; Lane 2 owns horse/farm breeding and lifecycle; Lane 3 owns employee skills and staff decisions; Lane 4 owns owner/farm money; Lane 6 owns established in-game UI. Pictures untouched.

**Do not label fully integrated until all required slots have a real audited consumer, non-player industry coverage and both standard source/Windows acceptance tests.**
