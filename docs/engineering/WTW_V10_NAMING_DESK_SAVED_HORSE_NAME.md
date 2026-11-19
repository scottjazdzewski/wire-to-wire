# WTW Lane 7 — game-owned Naming Desk → actual V10 saved horse names

## User-visible behavior

The previous Naming Desk `KEEP`, `REJECT`, `CHOOSE` commands survived its original founding-career save. They did **not** update a horse's visible name in the new 300,000-horse industry career.

This update connects the existing single Naming Desk to the **existing** V10
`WTWCompactCareerManager` when a full-world owner career is open.

- Naming Desk targets come from the real saved V10 career's `horseRows` and
  are limited to source-linked, player-**OWNED** horses. Managed, boarded,
  trained and rival-owned horses cannot be selected as if the player owned them.
- `KEEP` and `REJECT` are saved in the actual V10 career's
  `changes.namingFeedback`, not localStorage or a second database.
- `CHOOSE` validates the horse's immutable source ID, current player
  ownership, source-world registered names, active registered horses, the 520
  protected prior-reviewed name keys, and the validated owner feedback
  rules. It then writes both `changes.namingFeedback` and the horse's
  `changes.worldEdits.byId['horse:<immutable ID>'].name` **in one**
  `savePersistent1999CareerRun` IndexedDB commit.
- The existing read model and profile directory are refreshed **only after
  durable read-back**. The updated horse display name remains available when
  the real career is reopened. No external registration is claimed.
- The original founding/playtest career Naming Desk commands remain intact.

## Save consistency

The built V10 industry population is immutable. Career-owned overlays take
priority in the active run and source-backed dossier. The previous
`applyCareerWorldEdits` already updated a registered horse's display
name in the in-memory career run, but some reopen paths validated that
updated run against the **unmodified** world base. That could reject a
properly saved rename.

`validateRunWithSavedWorldEdits` now validates loaded career runs against
the same approved overlay they were saved with. It uses a shallow
copy-on-write directory of just the edited entities, **not a deep copy
of 300,000 horses**, and never mutates the underlying source pack or the
input run. All existing opening-world manifests remain revision-frozen.

This does not change `HORSE_ID`, sire, dam, birth record, owner identity,
trainer assignments, race outcomes or the financial ledger. A naming
decision alone never grants a horse the legal clearance of a racing
registrar. Old V488/V489 saves lacking the new V10 feedback field load
with a valid empty ledger.

## Files

- `public/next/1999-saved-career-horse-naming.mjs`: pure owner and whole-world
  name gates, repeatable feedback/overlay planning and reopen-safe projection
- `public/next/1999-commercial-career-manager.mjs`: single IndexedDB
  transaction, read-back verification, existing overlays, game read-model
  publication, and saved-world validation
- `public/next/1999-naming-desk.mjs`: actual V10 player targets, a
  V10-aware same-game save callback, accurate user confirmation
- `tests/1999-v10-naming-desk-career-commit.test.mjs`: owner, normalized
  collisions, protected review names, immutable pedigree, source/registered
  name projection, actual Name Desk callback and source integration guard

## Desktop compatibility assessment

**Local runtime and data:** Existing bundled `/next/` and `/1999/`
modules, the existing V10 game career with immutable world source data,
and the current `WireToWireFictionalIndustry1999V1` IndexedDB store.
No external login, AI service, remote database, API or Cloudflare request
is needed. No new EXE, alternative UI, data store or world generator.

**Network dependencies:** None introduced. This path works entirely
through the existing one local game engine and its saved world.

**Save compatibility:** No schema-breaking migration. The optional
`changes.namingFeedback` is per career and defaults to an empty validated
V489 ledger for older saved careers. Existing player world overlays, IDs,
registered names and V488 opening-world revision are preserved.
World/registered-name validation uses an edited projection without
mutating or resetting source content.

**Offline verification:** New pure planning/authorization, visual notice,
source-API and reopen validators have Node regression tests. Full source,
V10 world, desktop package, Chromium acceptance and CI status are
required on this exact PR head. No installed Windows offline
save/reopen claim is made without a green installed-app test.

**Assets/UI:** No logos, icons, asset locks, CSS, or approved page layouts
changed. Existing Naming Desk target choices gain the real V10 saved
operation inventory.

**Rollback:** Revert this PR. Because optional feedback uses the existing
career `changes` structure, the prior game can ignore those fields; the
underlying generated-world horse identities and data are untouched.

## Remaining production limits

This is a **real saved-horse naming integration**, not 55,000 new
names/year or 90% creative-quality certification. The curated writer's
finite catalog (V491 is developed separately) cannot supply millions of
unique owner-believable names over a century. Inadequate unique, verified
name proposals must remain on hold until that content/quality constraint
is solved. Legal racehorse registry clearance is not asserted.
