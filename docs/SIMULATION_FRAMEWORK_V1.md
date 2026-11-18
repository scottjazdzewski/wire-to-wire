# WIRE TO WIRE — Simulation Framework V1

**Status: framework infrastructure only, not playable racing.** Implemented as independent, testable ES modules in `src/game/`. The approved Drive v3.3 canon and Office v30+ layout remain unchanged; GitHub historical D1 stays a read-only source view.

## One world, one run, one event stream

A versioned read-only `WTW_WORLD_SNAPSHOT_V1` is exported from existing *approved* canon sources (not a new master database). It includes an authoritative snapshot ID, SHA-256 digest, `start_date`, and explicit `horses`, `people`, `organizations`, and `tracks` groups. No horse, track, trainer, ownership, ability, financial or location information is invented to fill gaps. The game save stores the snapshot ID/digest and entity-ID references, not another pedigree/track/horse registry.

`WTW_GAME_RUN_V1` stores a namespaced `WTW-RUN-*` ID, exact game date, day count, deterministic random seed, player role/involvement and operation reference, stable Horse_ID references, empty mutable state slots, decision queue, scheduled events, command receipts and an append-only ordered event log. Every transition validates the world digest and prior run state. All commands have unique IDs and are atomic and idempotent, or rejected.

## Implemented modules

| Code | Responsibility |
|---|---|
| `src/game/contracts.js` | Source and save schema gates; immutable IDs, real calendar dates and safe JSON payloads |
| `src/game/state.js` | Create and validate a single isolated game run |
| `src/game/kernel.js` | Validated commands, decisions, one-day clock, due-event delivery, event journal |
| `src/game/rng.js` | Seeded reproducible random-number stream (no race logic) |
| `src/game/persistence.js` | Save/reload, source digest binding and accidental-corruption checksum |
| `src/game/selectors.js` | UI-neutral, read-only Office and Stable views |
| `src/game/index.js` | Stable public import surface |
| `tests/simulation-framework.test.mjs` | New-run, illegal inputs, old v0.18 bugs, scheduler, duplicate commands, save/load, seed, UTC dates, Office read models |

### Framework commands available now

- `SCHEDULE_EVENT` — trusted system can register a **future** dated event; rejects duplicate IDs.
- `ADVANCE_DAY` — one date at a time, emits a dated journal entry and once-only due-event notifications.
- `QUEUE_DECISION` — trusted system adds explicitly valid choice IDs for a pending message/decision.
- `ANSWER_DECISION` — player can resolve only an existing decision with a listed choice. An invalid option does **not** mark the message answered.

**No other command exists yet.** In particular, `SIMULATE_RACE` is unsupported, so the legacy v0.18 bug allowing a race to run before its date cannot occur here. Recording a decision does not secretly alter horse fitness, money, or finishing positions. Those are later domain modules.

## Integration contract for the separate Office UI window

```js
import { createGameRun, dispatchGameCommand, getOfficeView,
         getStableView, exportGameSave, importGameSave } from './src/game/index.js';
```

The UI should consume the engine's read-only selectors, dispatch *validated* player commands, render errors, and persist the `game_run_id` game state independently from historical records. It must not create a second stable registry or overwrite the current approved `01_CURRENT_BUILD/index.html`. No UI integration or Cloudflare save endpoint has been made by this framework-only milestone.

The `actor: 'system'` marker is **not** server authentication. In production, an authorized server must enforce who is permitted to issue system commands; do not expose an unrestricted client-controlled system API. The eight-character checksum in local saves is only for accidental corruption, **not cryptographic authenticity**.

## Future framework modules, before gameplay tuning

1. **Authoritative world-snapshot adapter.** Read the exact six approved 1999 horses, ID-matched trainers/owners, farms/barns, tracks, racing conditions, source-status fields and approved calendar into a versioned, hashed view. It must fail on duplicate or conflicting Horse_ID/Track_ID claims; leave unsupported fields null instead of inventing them.
2. **Durable save adapter.** Versioned game-run storage with optimistic concurrency, ownership checks, restart/replay, and schema migration; never use the historical archive's tables as mutable game state.
3. **Domain boundaries.** Pure, independently tested interfaces for training, entry eligibility, shipping, finance, AI, and race outcomes. These will emit valid events through the same command/event pipeline. No parallel ledger, no duplicated clock or roster.
4. **Office bridge.** Feed the current Office/Stable/Calendar presentation from the same run and digest, without redesigning the other window's layout.
5. **Then gameplay.** Start with one legitimate eligible 1999 week, complete field, race-day processing and consequences. Do not require every 1864–1998 exact-date uncertainty to be solved first.

## Acceptance tests

Run `npm test` in the existing GitHub repository. It includes `tests/simulation-framework.test.mjs`. A clean GitHub Actions check is the build gate. The test-world's single synthetic label is **TEST ONLY** and is not part of accepted WTW racing canon.

**This is the framework finish line:** the game has a stable source boundary, dated state and event contracts, deterministic save/reload and read-only Office-facing views, without pretending a training algorithm, racing engine or 1999 starting field exists.
