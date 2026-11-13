# Wire to Wire — V10 Fictional Identity Naming Quality and Scale

## Purpose

V10 protects the **capability to generate convincing people, farms, stables and ownership organizations on demand**. It does not populate the playable 1999 world, invent horse identities or touch horses, history, racecards, UI, or saves.

The V8 name generator and V9 owner/trainer capacity planners remain authoritative. V10 adds read-only naming quality diagnostics, a reproducible disposable stress-test command, and an indexed protected-organization-name collision guard.

## Protected organization roots: a real scaling bottleneck

Previously `createOrganizationNameRoster` checked every new name against every protected historic organization root:

`protectedRoots.some(old => (root.startsWith(old) || old.startsWith(root)) && Math.min(root.length, old.length) >= 7)`

With growing histories this is O(candidate attempts × protected organizations), and it runs during every naming batch. V10 indexes the protected roots in a Set and a sorted prefix search. The rule is **semantically identical**: after normalization, one root must be a prefix of the other and both share at least seven characters. The implementation scans only the candidate's own prefixes and makes a binary search for longer protected prefixes. It is **not** a fuzzy-name or external-business-registry clearance algorithm.

The new exported `createProtectedOrganizationRootGuard(roots)` has regression coverage comparing the indexed answer with the prior linear reference for 12,000 roots and more than 2,000 probes.

## Automated plausibility and integrity checks

`public/1999/engine/fictional-name-quality-audit.mjs` exports two **read-only** functions:

- `auditFictionalIdentityNaming(world)`: normalized collisions among people and among organizations; collisions with supplied protected canon; malformed personal names; unnatural stacked organization terms; owner/principal and trainer/stable reciprocal links; incorrect farm/stud/nursery/bloodstock suffixes; ownership archetype proportions; naming-region and role diversity.
- `auditFictionalOnDemandNameState({state,batch,previousState})`: duplicate or empty issued names; repeated owner IDs; missing partnership parent entities; partnership-cap violations; shrinking registries; rewritten previous owner IDs; non-sequential batches.

An individual sole-owner business may intentionally have the same visible name as its named principal. That is allowed because it is one person plus their legal ownership entry, *not* two independently generated persons. The audit deliberately keeps person-name and organization-name uniqueness checks separate.

The quality report is bounded to at most 40 example issues. Counts are exact and generated in O(persons + organizations), without comparing every person against every other person.

**Limitations:** these checks can identify malformed or repetitive patterns, but they cannot certify that a name is historically attested, culturally perfect, free of defamation/trademark issues, or available through a horse-registration authority. Naming culture weights are synthetic editorial gameplay parameters, not historical migration or naming-frequency measurements.

## Reproducible disposable stress testing

Run:

```bash
npm run bench:names
npm run bench:names -- --worlds 16 --batches 15 --owners 90 --trainers 60 --jockeys 50
```

This exercises real `generateOnDemandFictionalNames` calls, not a mock generator. Each world advances through a real `nextState` checkpoint, enforcing protected names, group caps, origin mix, ownership archetypes and person/organization links. The output is JSON *statistics only*: counts, archetype mix, batch p95/max latency and serialized checkpoint size. It is safe to run repeatedly and does not write any game data.

Defaults use six independent worlds and eight sequential naming requests each. The CLI accepts additional worlds, batches and owner/trainer/jockey counts within safe bounds. These are **disposable in-memory fictional identities**; the benchmark results are *not* a 1999 game-world population and not claims about the number of real racing businesses.

Test coverage: `tests/1999-fictional-name-quality-v10.test.mjs` checks 12,000 protected roots for prefix-rule equivalence; a 12,000-name historic protected catalog in the organization engine; multiple full-size fictional naming worlds; corrupted identities and facility types; on-demand continuity across 12 successive batches; and a CLI smoke test.

## Next engineering boundaries

The existing V8 `nextState` contains all issued names and owner entities, so serialized checkpoints continue to grow with the number of names issued. V10 **measures** that growth but does not yet claim a constant-size or production-ready append-only database registry. Before integrating tens of thousands of sequential generation requests into game saves, a future persistence coordinator should implement transactional, indexed registries and prevent concurrent calls from accepting the same stale `nextState`.

No existing historical records, canonical horses, player finances, playable-world identities, or UI layouts are changed.
