# WIRE TO WIRE — V9 regional training capacity for 100,000+ horses

## Purpose and scope

This module supplies the **training side** of population scale alongside the already-merged V9 owner portfolio planner. It does **not** generate new horse, trainer, stable, owner or farm identities. It assigns stable indexes from an **existing**, caller-supplied horse directory to stable trainer IDs and optional one-to-one stable IDs.

**Why this matters:** a racing world may have 100,000 horses in active training but need only a few thousand trainers and existing race barns. A major owner can have horses with several trainers, and a popular trainer can work for many different owners. The new trainer assignment must never accidentally create a new owner, syndicate, farm or trainer for every horse.

The model is `WTW_FICTIONAL_TRAINER_BARNS_V9`, located at:

`public/1999/engine/fictional-training-capacity-planner.mjs`

It sits **beside** `fictional-owner-portfolio-planner.mjs`. The prior ownership V9 implementation remains authoritative and unchanged.

## Stable IDs, operating regions and capacity

Inputs:
- `horseCount`: a stable numeric count of existing horse-directory indexes (not newly generated horses).
- `trainers`: records `{id, stableId?, baseRegion?, barnTier?, maxHorses?}`; real-world records and historic relationships are supplied by the caller.
- Optional `horseRegions`: one canonical **training-base region** string per horse. When supplied, each horse is assigned only to a trainer with the exact matching `baseRegion`; cross-region default shipping is **not** invented.
- `lockedAssignments`: historical or manually approved `{horseIndex, trainerId}` links.
- `existingPlan`: prior training plan (or imported checkpoint) for append-only growth. Prior horse-to-trainer assignments and existing trainer ID indexes remain unchanged.

Tier labels are an **editorial simulation default**, not measured historic proportions or strict employment classes:

| Barn tier | Synthetic weighting | Horse capacity range |
| --- | ---: | ---: |
| Small yard | 40% | 4–14 |
| Regional barn | 35% | 15–35 |
| Established stable | 18% | 36–80 |
| Large stable | 6% | 81–170 |
| National operation | 1% | 171–320 |

The caller may override an individual trainer's maximum capacity with `maxHorses`. A shortage is an **error**, never an implicit trainer hire, invented stable, reassigned canon horse, or unauthorized cross-region shipment. An existing assignment above a *synthetic* default capacity is honored; an existing assignment above an **explicit** configured barn maximum fails validation rather than being rewritten.

`assessFictionalTrainingCapacity` gives region-by-region preflight capacities and shortfalls. The game can decide whether to add authentic new trainer identities via the naming service, reassign appropriately, or wait until facilities expand, and then rerun the plan. The capacity planner itself never adds people or buildings.

## Scaling and queries

`planFictionalTrainingAssignments({ seed,trainers,horseCount,horseRegions,lockedAssignments,existingPlan })` returns:

- `trainerIndexForHorse`: one Uint32 trainer index per horse.
- `trainerHorseOffsets` and `horseIndexesByTrainer`: compact sparse row (CSR) reverse index, enabling trainer portfolio paging without rescanning 100,000 horses for each query.
- `trainerIdAtHorse(index)`, `stableIdAtHorse(index)`, and `trainerHorses(trainerId,{offset,limit})`.
- `trainerIds`, `stableIds`, capacity tiers, counts and explicit regional summary.

Time: **O(horses + trainers log trainers)**; space: **O(horses + trainers)**. Memory-bound arrays use four bytes per index (typed arrays). No generated name strings are copied per horse.

`exportFictionalTrainingAssignmentState` produces JSON-safe indexed checkpoint data with a non-cryptographic integrity checksum; `importFictionalTrainingAssignmentState` validates it and restores typed arrays. Checksums catch accidental storage damage, not malicious tampering. A save coordinator must handle transactional writes and concurrency; this pure module does not touch storage, network or game state.

## Owner–trainer cross-check

`auditFictionalOwnerTrainerNetwork({ownerPlan,trainingPlan})` reads the existing **owner** assignment plan and new **trainer** plan, and measures how many owners use multiple trainers and how many trainers serve multiple owners. The plans stay independent: ownership archetype never implies trainer employment or a fixed geographical stable location. This avoids the unrealistic one-owner/one-trainer assumption.

## Reproducibility and tests

Run:

`node --test tests/1999-fictional-training-capacity-v9.test.mjs`

The test set validates:

- 100,000 training horses with 4,200 regional trainers and one stable per trainer.
- Full 100,000-horse owner/trainer network cross-check with 8,000 distinct owners.
- Locked historical trainer assignments, JSON checkpoint and subsequent 130,000-horse expansion **without moving an existing horse**.
- Regional shortages, over-capacity protections and invalid locked assignments.
- 325,000-horse training scale and linear typed-array storage footprint.
- No modifications to the current game world, source data, horse generator, UI, saves, or personnel names.

**Integration boundary:** Neither the owner nor trainer planning module automatically writes to the January 1999 playable world. Linking actual generated horse IDs, transfer finance, shipping decisions, training stables and save-state transactions remains separate game-engine work. This prevents the naming/scaling workstream from overwriting the historical world or the approved Office UI.
