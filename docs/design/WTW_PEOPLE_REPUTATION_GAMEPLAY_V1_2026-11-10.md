# WTW PEOPLE, REPUTATION & OPPORTUNITY ENGINE — V1 IMPLEMENTATION
Date: 2026-11-10
Scope: game-run mechanics + People Profile UI. The **existing canonical people registry is the sole identity authority**.

## What is now implemented
### One shared character catalog
`public/assets/game/attribute-catalog.v1.json` defines common professional skills, job-specific skills, the six reputation axes and the source-backed event types.

Every person in a new authorized playable world can receive one **modeled initial character pack** under their actual canonical Person_ID by passing `personGenerationCatalog` to `createGameRun`. `src/game/people-generator.js` derives reproducible latent skill profiles and game-modeled reputation from the immutable world snapshot digest and Person_ID. Character attributes and reputation remain stable across separate new runs of the **same canonical world**. They do not rewrite birthplaces, names, actual careers, canonical facts or history. All unobserved traits remain hidden from the player.

The initial reputation is deliberately labeled `GENERATED_GAME`, not a verified real-world reputation. This V1 model is a deterministic *gameplay prior*—not a historically sourced career appraisal. An explicitly sourced baseline may also be installed via the kernel, but must carry evidence.

### Reputation dimensions
0–100 scale, with `null` meaning *unrated*, not zero:
- **Overall Standing**: broad recognition
- **Local Circuit**: recognition in the actual circuit, only generated if a source circuit exists
- **National Standing**: broader reputation
- **Owner Trust**: professional confidence of horse owners, not the player's friendship score
- **Professional Trust**: working standing among stable peers
- **Bloodstock Market**: commercial credibility with agents/breeders/sellers/buyers

The game kernel has system-only `SET_PERSON_REPUTATION` and `RECORD_REPUTATION_SIGNAL` commands. Accepted events carry source references and flow through the deterministic journal, save/reload and duplicate command protection. Reputation can rise or fall after meaningful game events such as stakes success, horse development, productive partnerships, bloodstock success, missed commitments and substantiated conduct issues.

### How this influences behavior
`getProfessionalOpportunityRanking()` combines skill/suitability, relationships, practical logistics and reputation as a **weighted, deterministic candidate shortlist** for mount bookings, horse-to-trainer assignment, breeding partnerships, sale consignments, purchases and hiring.

Reputation contributes no more than **20%** of this preliminary V1 ranking. Abilities, professional relationships, availability, eligibility and location matter more. A famous jockey can attract mounts; an unheralded rider can still be the better practical choice.

This is **not** a completed autonomous mount-booking, trainer hiring, mating or auction execution engine. Those are separate future decision actions with contractual and financial checks. The ranking adapter is ready for them; it must never create a phantom assignment or purchase from a mere score.

### People Profile
The deployed People Profile now uses an FM/OOTP-style three-column Overview with:
1. Professional Attributes (shared foundations and role-specific skills)
2. Reputation & Network (overall plus public standing dimensions and separate working relationship trust)
3. Career & Opportunities (source career totals, connected horses and affected opportunity types)

`Attributes` and `Reputation` tabs provide the deeper skills and dated reputation-event history. Unknown skills remain unassessed. Unrated individuals have no fake 50% bar. Modeled reputation is visibly distinguished from evidence-backed reputation.

**2014 Office prototype limitation:** Its three named staff/bloodstock contacts do not yet have certified canonical Person_ID mappings or generated game-run scores. The current page therefore shows **UNRATED** until an authorized score arrives in the preexisting Office `staffState` record. It must never invent values merely to fill the UI. The 1999 game-run selectors use canonical IDs already; the final UI adapter should expose `getPersonView` once the approved playable world is mounted.

### Tests and guardrails
- all generated people in a canonical world have a reputation pack and complete role-appropriate *latent* traits
- same canonical world yields the same individual characters across games
- professional skill packs are not shown in player-facing projections until scouted with evidence
- reputation influences rankings but cannot override explicit ineligibility/unavailability
- journal entries and source refs survive Save/Load and do not duplicate
- unknown/historical claims are not silently replaced with invented career facts
- relationship trust is not industry reputation
- UI and engine use the same shared definition JSON, no second person or horse database

## Next integration gate
When the playable 1999 world adapter is active, pass the approved catalog to `createGameRun`, then supply canonical `getPersonView` results to the People Profile. Integrate ranked candidate lists into the authorized riding/trainer/breeding/market decision systems with the existing geography, rest, eligibility and finance checks. Do not present that later functionality as completed merely because a score is now visible.
