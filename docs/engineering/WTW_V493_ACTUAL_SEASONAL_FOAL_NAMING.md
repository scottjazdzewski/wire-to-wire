# WIRE TO WIRE — V493 saved-seasonal-foal naming

## Actual game change

This is a **newborn horse naming transaction for real born foals**, not a
demonstration foal, a separate database or a regenerated opening world.

It extends the existing **Lane 2 saved-foal integration, PR #307**, which
provides `readPersistent1999CareerFoals` and the existing **MY FOALS /
BORN THIS YEAR** view in the single V10 commercial career manager.

On that screen the player now sees a **FOALING YEAR** selector and an
inline **NAME YOUR BORN FOAL** form for current-page **player-owned,
actually born, still unnamed** foals, including older saved yearlings from
prior game seasons.
The player supplies a distinct name and an owner story. The game writes
the source horse's **actual `industryLifecycle` BORN record** with:

- Existing immutable horse ID, sire, dam, foaling farm, owner and birth date
- Owner-selected name, `PLAYER_NAMED_PENDING_REGISTRAR` status
- Revision `WTW_SAVED_CAREER_FOAL_NAME_V1`

**At the same time**, in one IndexedDB readwrite transaction across the
existing `careerRuns` and `industryLifecycle` stores, it commits:

- The existing V489 naming-feedback CHOOSE event for that exact foal ID
- `changes.namingOriginStories[foalId]` with the actual owner-written story
- `changes.namedSeasonalFoals[foalId]` as an indexed all-time career
  reservation and a readable name provenance record
- The saved career version increment under optimistic concurrency control

No second game kernel or mutable world database is introduced. The baseline
1999 300,000 horse source and frozen opening-name revision never change.

## Release and safety constraints

A request is rejected when the foal is not actually born, belongs to a rival,
has no verified saved sire/dam/farm, has died, is already named, or is not
present in this exact career. A naming write cannot move to another save slot.

The name must be 1–18 characters, pass the in-game Unicode format, not match
any of 520 owner-reviewed exclusions, any name in all stored opening world
batches (including their immutable IDs), any saved opening-horse rename,
any actively registered career runner, or any previously named foal in
the same career (normalized punctuation/case folded).

A stale career version, date conflict, or removed foal causes the single
transaction to abort **without a partial horse-only or feedback-only write**.
The transaction then rereads both the renamed actual foal sidecar and the
saved game naming ledger before acknowledging success.

There is no external Jockey Club registration claim. As with other game
owner display names, full independent creative approval remains a separate
policy gate. The inline owner entry is **not** a claim that an automated
generator created or independently editor-approved that name.

## Offline scale guard

Immutable opening-world name keys are built from the original generated
horse batches once per hydrated manifest and retained in a WeakMap while
that world remains open. Subsequent born-foal owner selections reuse that
canonical normalized Set instead of decompressing 300,000 source names per
foal. Career-specific renamed opening horses and named seasonal foals are
rechecked from the latest saved run on every submission; the IndexedDB
transaction still revalidates career version, owner and date atomically.

## Desktop compatibility assessment

**Local runtime and data:** The same `WireToWireFictionalIndustry1999V1`
IndexedDB, same born-foal lifecycle sidecars, same saved V10 owner career,
same `/next/` commercial career manager; no extra world, UI screen,
file format, server or remote name service.

**Network dependencies:** None. The entire transaction and its name
collision scan operate on already installed local data.

**Save compatibility:** Only optional career fields are added; historic
V488 opening names, old V489 choices, old saves and canonical 300k records
remain immutable. The actual already-born seasonal foal sidecar is
updated per-career, never cross-career. Existing year-end foal-to-yearling
progression takes the same BORN sidecar forward.

**Offline verification:** Pure-memory regression exercises the actual
per-run foal sidecar and normalized collisions, permanent identity, readback,
owner exclusion and stale revision. Exact-head Node, Chromium, Windows
packaging and release-integrity CI must pass before merge. An installed
Windows EXE offline restart test has **not** been separately completed
for V493.

**UI/assets:** Extends the current PR #307 foal browser with a small
inline name/story form. No hero, badges, other game screens, CSS,
images, asset locks or UI architecture are changed.

**Rollback:** Revert this dependent PR, leaving the PR #307 saved-foal
reader and all immutable 1999 world records intact. Saved optional
name history will remain in the game career and actual per-run sidecars;
old clients may ignore display fields but must not overwrite them.

## Open production requirements

This PR supplies an owner-selected *actual game foal name*, not 55,000
quality-approved autonomous names/year, or a 90% blind-rated creative
library. It is dependent on **PR #307 being integrated**. The existing MY FOALS view can show current or earlier saved foaling years;
a fully source-grounded automated creative Naming Desk flow for foals
(instead of manual owner entry) is a separate follow-up task. Do not close capacity issue #207 on this basis.
