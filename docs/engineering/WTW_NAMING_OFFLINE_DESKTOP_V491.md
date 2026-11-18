# WTW V491 — deeper curated horse-name pool for future foals

## Previous milestone preserved

V485–V490 remains the single offline, story-backed horse naming writer and
career-owned Naming Desk. PR #232 delivered actual persisted KEEP, REJECT and
CHOOSE decisions. The January 1999 world still uses a **frozen V488 opening
identity revision**; player renames, existing horse IDs, pedigrees, name edits,
save overrides and opening-world labels must never change on a naming update.

## Implemented gameplay behavior

The existing `createLocalStoryIdeas` writer now considers **360 additional
original, explicitly authored complete horse names** (12 in each of the same
30 genuine narrative motifs). Existing V488 entries remain intact. The
screened whole-name candidate universe increases from **601 to 961 distinct
normalized choices**, before existing registered/reserved names, the 520
previously owner-reviewed exclusions, feedback rejections, and remaining
context/independent-editor gates. All added names are at most 18 characters,
contain no numeric identifiers and have zero intersection with those two
existing exclusion sets. A suggestion only surfaces for a matched narrative
cue in an owner-attested or game-foaling source; this is not random keyword
concatenation.

The **actual** `generateLocalStoryFirstHorseNames` and
`generateLocalPopulationNamingBatch` now see these new names through their
existing `createLocalStoryIdeas` path, which also serves the live Naming Desk.
The algorithm marker advances from V489 to **V491** for *future* suggestions
only. It does not register, save or rename an existing horse.

## Explicit non-changes and limits

- No alteration to either `generateProvisional1999HorseNames` or
  `generateProvisional1999IndustryNameRoster`. Those methods intentionally
  still build the existing 1999 opening world with frozen V488 revision and
  identical seed behavior; this PR does not regenerate 300,000 names.
- No source-horse, owner, trainer, entity ID, foaling location, pedigree,
  UI layout, stylesheet, asset, record schema, game save or network dependency
  changes.
- No automatic official racing-name registration; owner and registrar review
  remains in force. Previously chosen/rejected decisions remain saved.
- **961 unique whole names does not meet 55,000 fresh names annually.**
  Without a larger safe source-backed supply, the engine must HOLD rather than
  generate word salad or duplicate registered names.
- Automatic count, length, uniqueness and source-cue checks are **not a 90%
  creative-believability or real-world name availability rating.** Owner-blind
  editorial quality reviews and multi-year production integration remain
  outstanding. Do not reinterpret the 360 names as owner-approved ratings.

## Verification

`tests/1999-local-naming-curated-v491.test.mjs` validates source/browser
module parity; exact 30 motifs / 360 new names / 961 total unique normalized
names; absence from old author catalog and the 520 review exclusions; actual
event-backed story matching for all 30 motifs; new candidate availability even
after all 601 older names are globally reserved; offline behavior; and
unchanged V488 opening industry naming revision and deterministic roster.
Older naming tests retain the same invariant expectations and now assert
V491 only where they test *new* story/editor suggestions.

## Desktop compatibility assessment

**Local runtime and data:** bundled ES modules, deterministic local story
matching, existing game authoritative records and IndexedDB career feedback.
No hosted runtime, LLM, AI credits, D1/Worker/API, CDN or required network.

**Save compatibility:** no migration. Existing opening 1999 worlds retain
their original V488 manifest revision, names and IDs. New story-only ideas
carry V491 revision and are not written to persistent horse identities.
The career feedback engine from PR #232 stays authoritative.

**Offline verification:** source, mirror, foal candidate, naming desk and
regression tests in the repository, plus exact PR-head GitHub CI. Until
verified, tests are **PENDING**. A green web check/Windows build without
installed offline save/reopen is **NOT YET DESKTOP CERTIFIED**.

**Rollback:** revert this PR; the prior 601-entry story library and V489
candidate selector remain, no player careers or generated world need changes.
