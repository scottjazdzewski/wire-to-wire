# WIRE TO WIRE — V9 owner portfolio scale and game-kernel ownership

## Authority and founding-world boundary

The current FOUNDING_1999 scenario has **zero active racing horses** until
accepted historical runners or newly approved fictional runners enter it.
The separate CANON_ANCHORED_TEST 87,500-racer / 325,000-world directory is
a benchmark, not approved live-game content. Never import those synthetic
horses or overwrite source owner or horse identities to populate the game.

V9 adds two linked but separate capabilities:
1. A pure owner-portfolio allocation planner for **approved** horses and
   already-known owner organization IDs, optimized for 100,000+ horses.
2. Actual player/system ownership commands in the preexisting
   WTW_GAME_RUN_V1 game kernel, with sparse run-state ownership deltas,
   approved ID checks, unique command receipts and portable saves.

The game action modules do not change the approved Office UI shell, source
snapshots, track data, historical results or real owner organizations.

## Long-tailed ownership instead of a partnership for each horse

File: public/1999/engine/fictional-owner-portfolio-planner.mjs

Fictional editorial portfolio tiers (NOT historic percentages):
- HANDFUL: 57% of owner IDs have suggested 1–5 training horses.
- SMALL: 24% have 6–25.
- REGIONAL: 12% have 26–75.
- MAJOR: 6% have 76–200.
- ELITE: 1% have 201–900.

A major owner can be one named individual; a small owner can be an existing
partnership. The naming archetype does NOT determine portfolio scale.

assessFictionalOwnerCapacity reports the shortfall before allocation;
planFictionalOwnerPortfolios assigns horses to known owner IDs while locking
existing accepted assignments, refusing unsupported capacities and never
generating a new company. Indexed reverse lookup pages each owner's horses.
exportFictionalOwnerPortfolioState and importFictionalOwnerPortfolioState
provide a compact JSON-safe checkpoint containing owner IDs plus one integer
per horse, guarded by a non-cryptographic corruption checksum.

Example test seed 19990101 with 100,000 synthetic racing horses and 8,000
owner IDs: 5,085 owners with 1–5 horses, 54 owners with 200+ horses,
largest stable 456, top 1% owned 20.402%, all 100,000 assigned. These are
model test results, not real industry counts. A separate 325,000-horse test
and a 100,000 to 130,000 expansion preserve all existing horse-owner links.

## Playable ownership transaction slice

File: src/game/ownership.js, wired through the existing
src/game/kernel.js, src/game/state.js, src/game/selectors.js and
src/game/index.js.

Commands:
- ASSIGN_HORSE_OWNER — game system may assign a formerly unowned
  **accepted** horse to an existing approved organization. Source-locked
  ownership cannot be replaced by this command.
- REQUEST_HORSE_TRANSFER — the player acting as an OWNER of the horse
  may propose a GIFT or SALE to another approved organization. Ownership
  does NOT change until approved.
- CANCEL_HORSE_TRANSFER — requesting owner or system cancels a pending
  request without transferring anything.
- COMMIT_HORSE_TRANSFER — **system only**. Validates original owner,
  writes a sparse game-run ownership delta and event-log receipt.
  SALES require an existing matching POSTED financial ledger item; the
  ownership system NEVER manufactures settlement or money.

The owner portfolio selector combines immutable world ownership and the
game run's changed-owner entries. The Stable and Office selectors expose
current owner, portfolio total and pending transfers. The kernel's existing
command-id replay guard, atomic validation and save/load machinery apply.

A system-approved gift transfer is a working end-to-end gameplay action
in a WTW_WORLD_SNAPSHOT_V1 test fixture. Financially settled sales await
the separate financial posting system. The original source never mutates.

## Playability limitations and next integration

This is **not** a claim that the live Office UI already supports these
commands. The clean founding scenario still needs accepted, assigned new
racehorse identities and a game-owned authoritative world-snapshot adapter.
The UI/gameplay transport owner must then connect existing buttons to the
game-kernel command interface; do not create another separate roster.

For large careers the baseline planner checkpoint belongs in a separate,
versioned save section or authoritative world-generation version, not as
100,000 individual owner objects in the WTW_GAME_RUN_V1 command journal.
The current kernel still has finite full-save and journal caps; full
decades-long transactional persistence and race-results remain separate
engineering work.

Tests: tests/1999-fictional-owner-portfolio-v9.test.mjs and
tests/gameplay-ownership-v9.test.mjs cover scale, locks, growth, buyer/seller
authorization, missing finance refusal, safe save/reload, duplicate commands
and 100,000-horse paged ownership views.
