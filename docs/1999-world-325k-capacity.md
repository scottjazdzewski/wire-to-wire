# Wire to Wire — January 1999 World Population Capacity

**Release authority:** existing `public/1999/engine/full-world-generator.mjs` and existing 1999 management UI. This document defines population scale and guards against an accidental duplicate ledger or reversion to the old World roster.

## One identity per horse

The opening World registry contains **325,000 distinct identities**. The original `HORSE_POPULATION=87500` registered racehorse index and its source-locked IDs **never change**. The new `WORLD_HORSE_POPULATION=325000` is inclusive of those 87,500, not in addition to them.

| Mutually exclusive registry partition | Opening entries |
|---|---:|
| Existing registered racehorse universe | 87,500 |
| Existing breeding mares `H-TEST-DAM-*` | 60,000 |
| Existing breeding sires `H-TEST-SIRE-*` | 1,400 |
| Additional yearlings (1998 foals) | 36,250 |
| Additional two-year-olds (1997 foals) | 36,250 |
| Additional racing-age horses | 70,000 |
| Additional retired horses | 33,600 |
| **Total** | **325,000** |

Additional horses use stable `H-TEST-WORLD-1999-######` IDs. Exact global indices are invertible via `worldIndexByHorseId`. Generated records are explicitly TEST, never mistaken for verified historic horses.

The forecast annual **45,000** live foals (40,000–50,000 design band) belongs to the future 1999 breeding pipeline. Those foals have **not** been born on the opening date and must **not** be counted twice by inserting them into the January 1 registry.

## Performance and save isolation

- Existing gameplay/save schema `WTW_1999_FULL_SCALE_TEST_V1` and the original 87,500-horse endpoints remain intact.
- Full registered-horse profiles use a **512-entry LRU** cache; additional full profiles use a **256-entry LRU** cache. Mares/sires are materialized on demand.
- `/api/1999/sim/world-horse-directory` pages the full 325k index in batches of at most 100. `world-horse-profile` resolves a specific ID or index; `world-horse-attribute` returns only the selected trait.
- `public/next/1999-world-index.worker.mjs` performs global index construction, search, sorting, filtering, and trait indexing OFF the UI thread. It posts at most the requested visible page back. The legacy incremental scan is a compatibility fallback only.
- The worker retains one current sorted candidate array and at most two selected trait arrays. Do **not** write a 325k entity snapshot to localStorage.
- Horse profile URLs use stable IDs for the expanded population; refresh resolves the same entity from the single deterministic model.
- Day-to-day race simulation remains on the existing active horse/gameplay scope. There is **no** claim that all 325k horses are running race files every day.

## Verification

- `npm test`: includes `tests/1999-world-325k-capacity.test.mjs` and `tests/1999-world-325k-worker.test.mjs`.
- `npm run bench:world`: enumerates the full 325k without full-profile materialization, verifies global ID uniqueness and reverse lookup, and reports 100k/200k/325k timing and process RSS.
- Confirm deployed Chromium sorting/filtering, worker availability, and responsive scrolling separately. Node timing is **not** browser page-load performance.

## Explicit next engine work (not yet represented as complete)

1. Daily/monthly lifecycle transitions must retain each horse's **existing** ID as it moves from youngstock to training, breeding, or retirement.
2. Future 1999 foals should be born into a persisted game-state delta with stable IDs and biologically possible parentage, not into a second generated registry.
3. Expanded racing-age horses need trainer decisions, medical/race eligibility and race-history integration before they participate in the active race scheduler.
4. Production performance should be verified in live browsers, including lower-memory devices, and worker indexing should be benchmarked separately from the identity enumeration.

Do not replace or rearrange the approved Tier One horse, track, racing, or Stable screens to implement scale.
