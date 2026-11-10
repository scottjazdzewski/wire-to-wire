# WTW ATHLETES & PEOPLE — ATTRIBUTE CATALOG CONTRACT V1
**Date:** 2026-11-10  
**Scope:** shared attribute vocabulary and generation/observation coverage, not population of actual entities  
**Single machine-readable definition:** `public/assets/game/attribute-catalog.v1.json`  
**Pure code/audit:** `src/game/attribute-contract.js`  
**Source authorities:** accepted WTW world snapshot IDs and breeding/genetics rules; immutable history stays with its approved sources.

## What this means
A horse is an athlete with an individual ability profile, developmental trajectory, health and behavioral state, and career. A trainer or jockey is a person with individual strengths, weaknesses, choices, career and relationships. The same catalog of relevant possible attributes exists for **every** horse or person in a category, while values differ for each individual and may be unknown to the player.

Do not hand-code one trait spreadsheet per horse or per person. Do not create a second horse or people master. Do not grant everyone average stats by default.

## Horse attribute groups
### 1. Speed & Pace (9 definitions)
Raw Speed, Early Speed, Acceleration, Cruising Speed, Late Speed, Pace Resilience, Pace Versatility, Preferred Running Style and Gate Break.

### 2. Surface & Environment (15 definitions)
Dirt, Turf and Synthetic Aptitude; Fast, Good, Muddy and Sloppy Dirt; Firm, Yielding and Soft Turf; Distance Profile; Track Configuration; Kickback Tolerance; Shipping Adaptability and Heat Tolerance.

**Rule:** sloppy dirt, muddy dirt, soft turf and firm turf are distinct observations; never compress every off-track result into a universal wet-track multiplier. Surface and going effects should be correlated, not independent randomly generated bonuses.

### 3. Physical & Biometric (12 definitions)
Stamina, Aerobic Capacity, Muscular Power, Stride Length, Stride Frequency, Stride Efficiency, Balance & Agility, Maturation Curve, Durability, Recovery Capacity, Soundness Vulnerability and Conformation.

**Rule:** actual stride length, frequency and conformation observations require measurements/physical evidence. They must not be portrayed as precise numbers merely because a hidden potential variable exists.

### 4. Mental & Class (10 definitions)
Racing Intelligence, Competitive Desire, Focus, Trainability, Temperament, Courage, Traffic Composure, Gate Composure, Class Adaptability and Consistency.

**Rule:** class performance also depends on opposition, pace, eligibility, current health and previous experience. No standalone magical class-score guarantees results.

### 5. Current Condition (7 definitions; separate from long-term talent)
Fitness, Recent Form, Fatigue, Race Readiness, Health Status, Confidence and Stress.

These move with in-game events and must be dated; a horse can be talented but unfit, or ordinary but currently thriving.

## People attribute groups
Every person receives the universal character/management vocabulary: Communication, Judgment, Adaptability, Work Ethic, Planning, Pressure Handling, Professional Reliability, Learning & Development, Relationships, and dynamic Morale and Workload/Fatigue.

Role-specific extensions apply only to real professional roles associated with that person:
- **Trainer (10):** Conditioning, Race Placement, Distance Assessment, Pace Planning, Young Horse Development, Health Coordination, Layoff Management, Travel Management, Workout Design, Barn Leadership.
- **Jockey (10):** Break Timing, Pace Judgment, Race Positioning, Energy Management, Traffic Navigation, Finishing Timing, Horse Communication, Surface Adaptation, Track Knowledge, Riding Fitness.
- **Owner (6):** Budget Discipline, Risk Tolerance, Patience, Delegation, Stable Strategy, Commercial Judgment.
- **Breeder (6):** Pedigree Evaluation, Physical Matching, Mating Planning, Broodmare Management, Foal Development, Bloodstock Market Reading.
- **Farm Manager (6):** Husbandry, Facility Management, Staff Scheduling, Biosecurity, Young Stock Development, Cost Control.
- **Veterinarian (6):** Diagnostic Skill, Soundness Assessment, Treatment Planning, Preventive Care, Rehabilitation, Risk Communication.
- **Bloodstock Agent (6):** Conformation Assessment, Pedigree Analysis, Market Intelligence, Valuation, Inspection Judgment, Negotiation.
- **Groom (4):** Horse Handling, Observation, Daily Care, Stress Reduction.
- **Farrier (4):** Hoof Assessment, Shoeing, Surface Requirements, Soundness Collaboration.
- **Exercise Rider (4):** Workout Pace, Horse Feedback, Horse Control, Safety.
- **Racing Secretary (3):** Condition Book, Calendar Organization, Eligibility Judgment.

This list deliberately distinguishes **a person's actual skills and tendencies** from their current effectiveness, assigned role, experience and professional relationships. A dual-role trainer/breeder inherits a single common skill set plus both professional sets.

## Creation and development — data flow
1. **Canonical identity:** The accepted WTW master provides immutable ID, name, sex/birth/foaling information, pedigree, historical facts, location and role assignments. Do not regenerate IDs or history.
2. **Character creation:** The authorized horse/people generation pipeline uses these keys, a reproducible seed, role, ancestry and contextual factors to supply individual hidden traits. An immutable accepted historical fact is never replaced by a randomly invented detail.
3. **Genetics:** Hidden horse heritable components determine *distributions* of phenotype with recombination, regression to the population, rarity, environment, maturation and chance. Neither ancestry nor visible pedigree becomes a deterministic ability recipe.
4. **Life & game state:** Training, aging, development, injury, rest, racing, travel, finances and other events adjust dynamic performance, condition, relationships and skills, written only to the authorized game run state.
5. **Observation & scouting:** Players see sourced measurements, experience-based estimates and uncertainty. Different trainers, riders, veterinarians and agents can disagree. Evaluations change with evidence; estimates are not hidden true values.
6. **Identity & persistence:** Only the original canonical entity ID links the latent pack, observations and current runtime. No parallel entity ledger or nickname-based merge.
7. **Coverage gate:** `auditGeneratedAttributeCoverage` verifies latent fields are supplied by the generator for an applicable horse or role combination; it never inserts arbitrary zeros, averages or default ratings.

## What the player sees in the FM/OOTP-style profile
The first desktop screen uses **four primary groups**, not 50 tall rows. The groups show a compact set of the most decision-relevant attributes:
- **Speed & Pace:** Raw, Early, Cruising and Late Speed; Acceleration; Running Style.
- **Surface & Environment:** Dirt, Turf, Synthetic; Going/Off-Track suitability; Distance Profile.
- **Physical & Biometric:** Stamina, Stride Length, Stride Frequency, Recovery, Durability.
- **Mental & Class:** Racing Intelligence, Competitive Desire, Trainability, Gate/Traffic Composure.

A narrow line should also display **Current Condition** (Form, Fitness, Fatigue, Readiness, Health), known scheduled race and current vet restrictions. A fully unassessed trait should render **Unassessed** or an unobtrusive dash, **never** a gray bar that visually implies a 50/100 middle rating. A user may open deeper category panels or an Attributes tab for all definitions.

Useful graphics: horizontal evaluation bands with estimate confidence, a short current-condition history and a race-distance performance curve *only when evidence exists*. No decorative spider chart with fabricated data.

## Attribute value/evidence contract
- **True layer** (simulation-only): `entity_id`, latent trait key/value, version/provenance, creation seed/authority. Never exposed to UI, ordinary scouts or market actors.
- **Observed layer** (actor-specific): `entity_id`, attribute key, optional estimate, confidence, observer ID, observed date, evidence refs and assessment status. Null means truly unknown, not average or zero.
- **Measured layer:** same source fields plus physical units, measurement method and date. The measurement is evidence, not a guessed value.
- **Dynamic layer:** `entity_id`, trait, current game date, actual state and event lineage. No migration of transient status into static historical source.
- **Career record:** starts, times, placings, earnings and opposition are *results*, not permanent attribute scores. They may inform estimates without declaring hidden true talent.

There is no approved public 1–20 or 0–100 player rating scale yet. Final UI representation and calibration require game-engine testing. This catalog defines the **meaning and eligibility** of each attribute first.

## Status and limits
The catalog and pure validation helpers are implemented now. **No fictional horse/person values have been generated, no historical people scored, and no generated values attached to the currently deployed 2014 Office horse records.** All 1999/game-world integration occurs only after the authorized generator exports conforming values and observation state. Historic real people must not receive purportedly factual subjective ratings without an explicit game-fiction boundary.

**This is the attribute foundation for every generated WTW athlete and racing-world character—not a list of hand-entered individual ratings.**
