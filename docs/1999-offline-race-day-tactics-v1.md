# WIRE TO WIRE — Offline Race-Day Riding Instructions (1999 Game V1)

## Desktop compatibility assessment

**Delivery target:** The one installed, offline-first Windows game. This feature resides exclusively in the canonical JavaScript racing engine shared by the existing management UI and desktop runtime. It does **not** add an Electron main process, launch executable, hosted service, Cloudflare route, internet call, browser-origin save store or alternate game UI.

- **What operates locally:** deterministic field-pace analysis, same-track real owner horse and booked jockey authorization, tactic selection and journal receipts, live-race tactical scoring, final full-field order, purse reconciliation, and versioned game-save roundtrips. Everything uses the existing in-memory career state, locally versioned 1999 condition-book generator, frozen game horse attributes and approved jockey/source identities.
- **Source data:** same 1999 approved people/organizations/tracks and explicitly isolated provisional 38-horse game cohort. The old career source IDs and all original horse/performance records remain stable. No historical race outcomes are claimed.
- **Required network:** **none** for tactical decisions/scoring. Browser preview currently loads the existing cohort/directory JSON via local-path fetch and persists its existing IndexedDB save; those are inherited application adapter dependencies, not new tactical rules.
- **Save compatibility:** `race_tactic` is an optional saved field on a canonical `BOOKED`/`RESULTED` entry. Older saved entries lacking this field retain `AUTO` and reproduce their existing composite scoring and race outcomes. New results store optional, bounded tactical attribution only when that rider was explicitly instructed. The existing one authoritative command receipt, game journal, portable `.wtwsave` save/export and browser save-reopen path are unchanged. A malformed tactic or mismatch between a result and its booked entry is rejected by validation; no new save schema requiring a speculative migration was introduced.
- **Desktop migration still required:** the dedicated desktop team owns packaged local content snapshot, desktop-owned save/backup directory, browser IndexedDB migration, local static asset protocol and final install/reboot tests. Source-backed UI History/D1 reads remain a larger product migration; this racing feature adds no such dependency.
- **Windows packaged test:** **NOT YET DESKTOP CERTIFIED.** No actual installed Windows EXE, offline launch, app-data persistence or installer upgrade test is claimed by this gameplay PR.

## The one engine-owned feature

The existing `src/game/racing-1999.js` (mirrored exactly into `public/1999/game/racing-1999.js`) owns both the command and settlement; no separate race simulator or UI decision ledger exists.

### Read-only preview

`get1999RaceTacticsPreview(state,world,{race_id,horse_id})`

Requires the actual player owner, a currently booked selected jockey, a still-open game race and a real horse. Returns:
- Source race ID/date/track, actual booked jockey, and current instruction.
- Known number of entered rival runners and their early-pace pressure estimated from game horse attributes and any explicit rival instructions.
- `AUTO`, `LEAD`, `PRESS`, `STALK` and `CLOSE` options, their bounded *modeled* adjustment from known horse abilities, current training and jockey skills, and their tactical rationale.
- Current game revision for a stale-write check.

This **does not** reveal the hidden deterministic variation, a fabricated betting market, an invented probability of victory or a future finish before settlement. Changing the field or horse conditioning changes the actual race-day adjustment.

### Authorized command

`SET_1999_RACE_TACTICS`, actor `player`, payload:

```json
{
  "race_id": "EXACT-OPEN-GAME-RACE",
  "horse_id": "EXACT-PLAYER-REGISTERED-HORSE",
  "tactic": "STALK",
  "expected_revision": 123
}
```

Only an existing player-controlled horse with a booked jockey may receive the instruction, up through its real scheduled game day **before** official settlement. Missing race, other owner's horse, unbooked mount, unsupported tactic, stale revision and already resulted/canceled race fail closed. The command uses the single canonical game state and existing idempotent command receipts. `AUTO` clears the optional field; merely changing tactics does **not** charge a fictional fee, alter owner cash or rewrite the source jockey.

### Race execution

During the one existing authoritative `SETTLE_1999_RACE` path, the horse's tactical adjustment is calculated against actual contemporary rival early speed, front runners, the specific distance, stamina, finishing kick, horse condition, and booked jockey abilities. A strategy may help **or hurt** depending on fit: an aggressive front-runner can be penalized in a congested pace duel; a genuine closer may benefit from such a pace. The bounded adjustment is included in the same existing composite score used for the final order. The original purse split, race settlement, identity/finance ledger and postrace horse recovery remain authoritative, and `RACE_TACTICAL_EXECUTION` records the instruction's modeled consequence. No tactics apply if no owner instruction was given; historical saves and untouched AI/autonomous races follow the exact prior baseline.

The current UI workstream can surface this engine-owned preview and command in the approved racing view; this PR does not create a new UI route or CSS skin.

## Test and rollback contract

- New: `node --test tests/1999-offline-race-day-tactics.test.mjs`.
- Existing: `npm test`, `node scripts/sync-1999-browser-gameplay.mjs --check`, January 1999 source integration, management browser, naming/continuity, product-wide release integrity and Chromium process restart.
- Verify owner permission, real booking prerequisite, stale/duplicate command handling, nonmutating preview, result attribution, bounded field-aware tactical effect, identical purse settlement, save/reopen and old-`AUTO` behavior.
- Rollback: revert this PR's racing-module, index-export, service-selector and new test/doc commits; preserve every existing player save and original source pack. No visual asset or asset-lock change is required.

**Caution:** Browser smoke checks and even 10,000 exact kernel save/reopens do *not* prove that the actual signed, installed Windows app works offline. That requires dedicated desktop certification.
