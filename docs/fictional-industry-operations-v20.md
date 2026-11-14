# WIRE TO WIRE — V20 synthetic industry operations and reuse

## Scope: capacity and career **capability**, never automatic world population

V20 adds explicit operating capacity, career progress and leave/return events to the **existing V16/V17 durable organization journal**. It also adds one read-only indexed planner for using established fictional operations before creating new businesses.

**No user career save, 1999 starting world, horse assignment, live financial contract, UI screen or historical identity is changed.** All V20 changes are optional and occur only after a caller supplies explicit synthetic events to the detached continuity namespace.

### Authoritative modules

- `public/1999/engine/fictional-organization-continuity-v16.mjs`: three new event types, with full preflight and existing append-only journal semantics.
- `public/1999/engine/durable-organization-continuity-v17.mjs` and `public/1999/engine/fictional-industry-identity-bridge-v18.mjs`: offer single-pass `iterateOrganizations()` for opt-in reuse analysis; the old `listOrganizations` paging method and V17 persistence remain unchanged.
- `public/1999/engine/fictional-industry-operations-v20.mjs`: `createFictionalIndustryReuseIndexV20`, an ephemeral aggregate planner. It makes **no** horse allocations and carries **no** horse or person arrays into user saves.
- `tests/1999-fictional-industry-operations-v20.test.mjs`: lifecycle, safety, chronology, persistence and 100,000-aggregate-slot tests.

## New explicit continuity events

All events require `eventId`, `sourceId`, nondecreasing `year` (1999–2099) and expected V17 revision:

| Event | Required additional fields | Effect |
| --- | --- | --- |
| `SET_OPERATING_CAPACITY` | `organizationId`, `horseSlots` | Adds/replaces one business's explicit kind-specific *planning ceiling*, preserving ID, name and history |
| `RECORD_PERSON_CAREER` | `personId`, `careerStartYear`, `stage` | Records explicit `EMERGING`, `ESTABLISHED`, or `VETERAN` professional progression; no inferred promotion |
| `SET_PERSON_AVAILABILITY` | `personId`, `availability` = `ON_LEAVE` or `AVAILABLE` | A person must relinquish all active leadership duties before leave; cannot accept appointment while absent |

Retirement is still handled by pre-existing `RETIRE_PERSON`, requires transferred duties, and cannot be reversed. Career progression is monotonic, age- and experience-checked, and requires a documented original start year rather than one inferred from age or surname. A career starts no earlier than age 18. `ESTABLISHED` requires at least five calendar years of recorded career experience, `VETERAN` at least fifteen; rank changes may not skip or regress.

The numeric capacity envelopes in `FICTIONAL_INDUSTRY_SLOT_LIMITS_V20` are **simulation planning limits**, not empirical or historical measurements:

| Organization | Horse slots represent | Maximum configurable |
| --- | --- | ---: |
| OWNER | Owned-horse portfolio | 5,000 |
| STABLE | Horses in training | 350 |
| FARM | Resident horses | 2,000 |
| TRAINING_CENTER | Horses undergoing development | 1,000 |

A small ownership operation can have 4 slots while a major owner may have hundreds. Capacity is explicitly recorded **per established organization**, never inferred from its name or from the number of owners, horses or trainers. Organization closure excludes it from reuse. Staff and operational capacity are distinct: V20 horse slots are not proof that staff, stalls, money, shipping, regulations or feed are available.

## Read-only organization reuse

```js
import {createFictionalIndustryReuseIndexV20}
 from './public/1999/engine/fictional-industry-operations-v20.mjs';

// Requires an existing V16/V17 continuity service or the V18 bridge.
// The caller provides already-confirmed aggregate counts from gameplay.
// No horse IDs, pedigree or ownership rows are loaded or written here.
const index=createFictionalIndustryReuseIndexV20({
 continuity:existingContinuity,
 usageByOrganizationId:{
  'OWNER-WITH-FOUR-SLOTS':3,
  'OWNER-WITH-650-SLOTS':420
 }
});

const options=index.findReusable({
 kind:'OWNER',region:'KENTUCKY',slots:100,
 policy:'PREFER_ESTABLISHED' // or BALANCE_LOAD
});

const capacityPlan=index.planAggregateDemand({
 kind:'STABLE',region:'KENTUCKY',horseCount:100000
});

const summary=index.getSummary();
```

`findReusable` returns existing eligible organization IDs and their configured headroom. `planAggregateDemand` reports compact proposed **counts per business**, not horse assignments. Any unplaced demand is explicit; no new partnership or person is generated to satisfy it. The default requires the *same naming region*. Other regions are only considered if `includeOtherRegions:true` is explicitly requested; this is **not** permission to teleport horses or ignore travel constraints.

`PREFER_ESTABLISHED` favors active businesses already handling horses and enough remaining capacity. `BALANCE_LOAD` offers an alternate load-balancing ordering. Both are deterministic editorial simulation policies, not claims about real ownership demographics or revenues. A business may reappear in multiple proposals, but proposals never reserve slots or change occupation. The gameplay engine must enforce all real allocations atomically in its own system and supply updated counts before making further decisions.

Building the index uses a **single iteration** over existing active organizations, storing compact per-organization capacity/usage summaries. Repeated queries avoid scanning the full V17 event archive. The index captures the continuity revision and refuses to answer after that revision changes; rebuild it after a succession, closure, registration, capacity update or another change.

Old V16/V17 archives without these events remain valid and reconstruct the exact former IDs, names and histories. An unconfigured organization has **unknown** capacity and is excluded from automatic placement rather than being guessed as available.

## Transaction safety, recovery and compatibility

V17's existing preview-then-persist, unique event IDs, revision CAS and single IndexedDB transaction apply to all new V20 events. A rejected preflight adds **no** personnel duty, firm capacity, or career event. A write failure requires a refresh; an ambiguous post-commit failure is resolved by reopening the same durable journal. Recovery uses the original V17 archive into an empty namespace, without replacing existing archives or introducing another database.

No new V12 person or business is minted by V20, and there is no new migration or change to career Save/Load. V19 remains the authority for initial approval and registration of newly named businesses, V18 for matching approved people, and V16/V17 for every subsequent organizational event.

## Verification

```sh
node --test tests/1999-fictional-industry-operations-v20.test.mjs
node --test tests/1999-fictional-organization-continuity-v16.test.mjs
node --test tests/1999-fictional-durable-continuity-v17.test.mjs
node --test tests/1999-fictional-durable-continuity-v17-safety.test.mjs
node --test tests/1999-fictional-controlled-industry-growth-v19.test.mjs
npm test
```

The V20 suite tests synthetic major/small owner capacities, stable/farm/training-center ceilings, sequential career advancement, leave/duty transfers, retirement, bad/duplicate events, preview purity, concurrency, failed and ambiguous writes, deterministic regional selection, stale index invalidation, archive restoration and **100,000 aggregate training-slot demand** against 400 existing synthetic stables. It creates no horse rows and performs no per-horse database writes.

## Workstream next: V21

Certification should exercise decade-scale identity continuity across 1999–2099, repeatable name quality, large historical event journals, recovery, and full compatibility with the approved 1999 world. Actual financial and horse assignment gameplay remains with its separate engineering window.
