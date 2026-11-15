# WTW V488 — offline authored-depth milestone

**Starting main:** `0fa9223df0556df30f0686a24c8654d4bdfab4f6`. **One naming writer:** `src/game/horse-naming-local-v485.js` with byte-identical `public/1999/game/horse-naming-local-v485.js` mirror.

## Concrete behavior changed

The original 30 motif voices contained 241 authored slots, 240 distinct normalized full names. V488 adds 360 individually written whole-name alternatives tied to the same verified motif categories. There are now **601 slots / 600 distinct normalized names** in total, including one pre-existing cross-motif duplicate. Of these, 14 occur in the original 520 owner-reviewed exclusion keys, leaving an absolute **upper bound of 586** before protected historical records and existing issued or reserved names. These numbers are mechanical availability, **not** creative-quality certification.

**Naming Desk:** The existing single-horse interface still screens no more than 24 authored possibilities, shows at most eight editorial-screened suggestions and never grants a registration.

**Future foal cohorts:** The exact same on-device writer now uses an exhaustive, deterministic, seed/horse/motif-stable traversal of every authored name under each verified foaling story motif. It no longer checks only 24 early proposals before declaring that name pool exhausted. Each whole name remains hand-authored, with no arbitrary adjective/noun joins. A name is still ignored if it is already in the all-time reserved ledger or the 520 rated exclusions; the V487 independent editor gate still runs before selecting at most two candidates and adding keys to reservation deltas. Nothing is auto registered.

## Invariants and limitations

- Every candidate must have a real owner-attested or authentic foaling-event story. No invented owner, breeder, historical race, origin or geography.
- 18-character cap, historical/registered name exclusion, owner-reviewed names, name collision and source/independent-editor gates all remain.
- **This is a depth/selection improvement, not a 55,000/year scale or 90% owner-acceptance certification.** The catalogue remains finite; an identical generic source repeated across a huge population still exhausts. Deficient contexts remain explicit holds, not fabricated winners or placeholders.
- Version marker `WTW_LOCAL_NAMING_RULES_V488` distinguishes outputs. No old registered horse names should ever be regenerated on revision upgrade.
- The canonical historical corpus, world records, naming decisions, approved art, approved one game UI and career/save format are unchanged.

## Desktop compatibility assessment

**Local runtime and data:** The curated pool, deterministic iteration, full registry caller input and reviewer-exclusion data are all bundled pure JavaScript. No HTTP/Worker/D1/AI, CDN or cloud storage is required for newly changed code. Source and browser mirrors are exact.

**Save compatibility:** No save structure is changed or written to in this PR. A separate single-writer gameplay/save integration must durably persist all pending/issued keys and the pinned name algorithm version before a production 1999–2099 career can auto-name large foaling populations.

**Offline verification:** V488 tests exercise entire source-backed pool enumeration, 600 distinct authored names, 14 owner-reviewed collisions, upper bound, desk limit, fallback after 24 early reservations, consecutive cohort uniqueness and source/browser parity with fetch disabled; the repository's full source, integrity and desktop pipelines must pass before merge.

**Windows certification:** **NOT YET DESKTOP CERTIFIED** for installed offline name issuance, owner decisions and save/reopen. An executable build alone does not establish naming-gameplay persistence.

**Rollback:** Revert the isolated V488 PR if needed; no data migration, assets, source IDs or saved names touched.

**Next structural blocker:** Issue #207 — this finite anthology remains unsuitable for 55k/year. Future work must add authentic context-rich, source-backed naming variability and independently owner-rated quality, never artificial numbered suffixes or generic permutations.
