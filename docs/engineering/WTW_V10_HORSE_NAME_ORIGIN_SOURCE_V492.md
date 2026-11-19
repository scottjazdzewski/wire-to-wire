# WTW Lane 7 V492 — source-backed, actual V10 owner horse naming

## Problem solved in the current real game

The 1999 Naming Desk's original authoring form invented a disposable
`H-GAME-1999-NAMINGLAB1` identity and placeholder owner/breeder. PR #302
previously allowed CHOOSE to update an actual player-owned horse, but
its *suggestions* still came from that disposable lab horse and user-entered
fake names. This separated naming inspiration from the real saved career.

## New player feature

When the real V10 300,000-horse saved career is open, the Naming Desk now:

1. Requires an actually **player-owned source horse** from the saved career's
   authoritative roster. It cannot generate for a different owner, managed-
   only barn horse, or a nonexistent ID.
2. Looks up that horse's actual **immutable source ID**, **owner**, **breeder**,
   and **foaling year** in the *same* active source-world and career run. The
   test-lab owner, breeder and foaling-year inputs are hidden in V10 mode.
3. Accepts a horse-specific story written by that player (35–1,000
   characters). The preview explicitly calls it an **owner draft**, never a
   previously verified historical event. No fictional parent, birthplace,
   relationship or owner motivation is introduced.
4. Calls the already-shipping, **offline V491 complete-name author** and
   the existing `screenStoryFirstIdeas` editorial gate. Candidate names are
   screened against the actual 300k horse roster, registered horses, owner-
   rejected choices, source quotes, grammatical format, and explanation.
   No web service, API, LLM credits, name-salad template or independent
   parallel generator is introduced.
5. Uses the real owner's V489 saved taste history for candidate ranking.
   Changing horses or changing the source story clears *only* the
   temporary proposal list, not previous keep/reject/choose decisions.
6. On CHOOSE, the original V10 `savePersistent1999CareerRun` transaction now
   persists a `changes.namingOriginStories[horseId]` owner-authored record
   in the **same transaction** as naming feedback and horse-name edit. The
   source-world horse record, sire/dam links, race results, owner, rating,
   and canonical V488 opening name revision remain untouched.

A failed write is not shown as success. Actual CHOOSE changes the horse's
name in the live game career; it is **not** external Jockey Club registration.
Legacy direct 1999 world-edit calls with no story remain compatible, but
cannot claim to have saved an attested owner-origin story.

## Actual code

- `public/next/1999-saved-career-horse-naming.mjs`: source-bound brief,
  use of the same V491 author and editorial screens, and validated,
  player-attributed story record in saved naming plan
- `public/next/1999-commercial-career-manager.mjs`: protected sync
  game-owned preview and one career transaction with source record read-back
- `public/next/1999-naming-desk.mjs`: real source-bound preview path,
  real owned horse selector, editor mode display and safe target/story
  reset while leaving founding lab untouched
- `tests/1999-v10-naming-desk-career-commit.test.mjs`: real-source
  authorization, creative output, stable IDs, per-target previews and
  owner-story persistence assertions
- `scripts/1999-full-world-browser-cdp.mjs`: full 300k
  player-owner CHOOSE, save, one-day advance, Chromium exit/reopen, and
  persisted story verification

## Desktop compatibility assessment

**Local runtime and data:** The same single game-owned V10 career,
unchanged generated opening 300,000-horse world, existing read model,
bundled ES modules and local IndexedDB. The original lab remains available
only outside active V10 play and is never written into the live source.

**Network dependencies:** None. The V491 whole-name library runs offline.
No API, AI inference, Cloudflare, D1 or external account is added.

**Save compatibility:** No genesis naming or manifest revision changes.
`changes.namingOriginStories` is an OPTIONAL plain-object field in the
existing career `changes`. Older saves without it load as empty; old
CHOICE and worldEdit fields retain their original meaning and authority.
It is preserved during game-day advances by existing
`changes:{...prior.changes}` save propagation.

**Offline verification:** Full source/Chromium/Windows checks must be
green for this PR head before merge. Separately, the installed Windows
binary must complete an offline save/reopen test before calling the
product **DESKTOP CERTIFIED**. A green CI build alone is not that claim.

**Visual/assets:** No changed logos, imagery, asset-lock metadata,
stylesheet, game navigation layout, or alternate screens. The existing
Naming Desk form dynamically removes the lab-only owner/breeder/year
inputs while a V10 career is active.

**Rollback:** Revert this PR. The previous career naming and world
overlays are unchanged; the optional source-story field does not
alter the frozen world, old game runs or registration data.

## Remaining quality limits

A source-backed player story is not the same as 55,000 NEW natural horse
names each season. The offline V491 writer has only **961 entire authored
names**, and should fail closed rather than manufacture repetitive word-grid
names. Creative believability has not been independently certified at 90%.
Future foals are still a separate lifecycle registry and are not yet
automatically exposed as selectable owned runners by this V10 opening-
horse Naming Desk. That integration is outstanding.

## 300,000-horse preview efficiency and parity

The canonical `screenGameHorseName` and `screenStoryFirstIdeas` now
accept an **optional, already-built, normalized** `registeredNameKeys`
Set. The full V10 saved-career manager builds it from its live
300,000-horse source and active registered horses once per world/run
revision, then shares it with every subsequent preview. The default
screening API still scans the actual source world when no index was
supplied, so older naming callers behave exactly as before.

The independent gate still checks each actual horse, editor evidence
quote, name format, existing owner-reviewed exclusions, previously
chosen/rejected names, repeated word openings and the external
registration-not-approved status. The final durable CHOOSE commit still
runs its own exhaustive source/registered-name collision check; the
optimized preview index is **not a substitute for authority**.

Tests directly compare indexed and ordinary canonical screening
results for occupied and available names, verify both source/browser
code mirrors remain identical and reject an invalid index type.
