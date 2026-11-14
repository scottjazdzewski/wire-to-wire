# WIRE TO WIRE — V14: multi-decade fictional naming quality gate

## Scope

This is a quality and scalability layer for on-demand names, NOT a populated game world. It never creates or modifies playable horse, jockey, trainer, owner, stud or farm records. The existing 1999 identity outputs, V11 compact naming index, V12 persistent registry, and V13 birth-cohort naming model remain unchanged.

The engine may be asked to generate tens of thousands of different people and racing organizations across decades. The critical guarantee is not that every future given name will be forecast accurately; it is that names are drawn from appropriate supported country/culture pools, they are connected to plausible birth cohorts, existing IDs are protected, and the engine can continue issuing names without a growing per-request checkpoint.

## Read-only cohort audit

`public/1999/engine/generational-name-quality-v14.mjs` provides `auditFictionalGenerationalNameQuality(world,{expectedYear})`. It checks each generated person against their country, international naming culture, modeled birth cohort, age in the named year, selected given-name pool and available country/culture-specific family-name pool.

The audit also validates that U.S. names with SSA-observed cohort evidence are not falsely described as future predictions, and that births after the official observed 2020–2025 interval are labeled EDITORIAL_FUTURE rather than an observed birth record. A 1999 generated person must not inherit new V13 metadata or be renamed.

The audit summarizes country, decade, source-evidence and given/family-name diversity in O(persons), caching each required country/cohort pool. It produces bounded example issues on failure. Like the older V10 checker, it is not a legal-name lookup, a real person's nationality inference or evidence of actual names used by racing professionals.

U.S. source data are SSA top-name rankings for 1990–1999, 2000–2009, 2010–2019 and the partial 2020–2025 period, as linked in `fictional-generational-naming-v13.md`. The lists are used as ranked editorial generation inputs rather than claimed racing-industry frequency measurements. Names after the data's cutoff are synthetic editorial projections.

## Repeatable disposable stress benchmark

Run:

```bash
npm run bench:names:generations
npm run bench:names:generations -- --batches 150 --owners 40 --trainers 30 --jockeys 25 --farms 5 --historic 12000 --start 1999 --end 2099
```

The benchmark constructs an independent in-memory V11 indexed registry, primes up to 100,000 protected historic business names, then repeatedly calls the REAL on-demand generator over a forward-only naming clock. Each batch is assessed with V10 identity/organization quality and V14 cohort/culture source quality. No output is committed to the playable game, browser storage, database, or other world.

JSON results include the actual number of newly indexed people and organizations, compact cursor size at the first and last batch, the number of controlled reusable partnerships, generation p95 and maximum batch time, counts of modern/projection births and any quality failures. The program exits unsuccessfully on a failed QA gate.

Separate CI smoke tests cover 1999, 2030, 2050 and 2099 world proposals, deliberate bad names, bad cultural surnames, fabricated SSA claims, 16 successive naming batches, partnership cap protection and CLI execution.

## Verified initial larger sample

Before making the benchmark reproducible, a standalone in-memory test ran 150 successive synthetic naming batches from 1999 to 2099. It issued 27,000 names into its independent index with zero reported V10 naming-quality failures and a 256-byte last cursor; no pool exhaustion or partnership-cap violation occurred. This is a synthetic test result, NOT a claim that the playable world already contains 27,000 identities or that quality is guaranteed for every possible seed.

## Future engineering limitations

- This does not expand future real-world name data beyond the 2020–2025 partial SSA ranking; country inventories and far-future names still need periodic editorial revision.
- Country, birthplace and naming-culture choices are synthetic and should never be used to infer demographic probabilities from a real person.
- Family relations, ownership transactions, trainer staffing, horse assignments and game population belong to separate game systems.
- Production IndexedDB and distributed persistence guarantees remain the responsibility of the existing V12 naming service and host integrations; the benchmark intentionally uses only disposable in-memory data.
