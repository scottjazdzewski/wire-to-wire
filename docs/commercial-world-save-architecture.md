# WIRE TO WIRE — Commercial World and Save Architecture
## Authority established November 12, 2026

**Goal:** single-player careers with realistic populations from 10,000 to 325,000 horses and decades of permanent racing history WITHOUT per-player population snapshots, paid cloud storage, or gigabytes of routine local saves.

### Current implemented boundaries

- World size and source selection: `public/1999/engine/world-profiles.mjs` and `public/next/1999-commercial-config.js`.
- Presets: 25,000 / 75,000 / 150,000 / 325,000 horses; custom 10,000–325,000. Two source modes: historical foundation and fictional TEST population. The world remains deterministic from seed, mode, size and generator revision.
- Existing 87,500-horse opening source/model IDs are **unchanged**. Smaller World scopes select deterministic distinct source-cohort IDs; they do not clone or rename records. Preserve the first 267 real opening records in historical mode.
- The World directory, paged API, global sorting and worker honor the chosen profile. The world-profile wrapper scales directory cohorts and breeding projections.
- **Scope limitation:** The native 1999 race scheduler, stable player ownership and personnel still operate on their original wider opening simulation. Smaller presets must **not** be advertised as completely scaled active economies until scheduler, track count, barn capacity and AI runner allocations use the same profile.
- Browser UI: existing Save & Load now opens the compact local manager first. It creates a fresh profile ONLY after confirming and successfully storing a pre-new-world backup. Existing browser saves and native save schema remain untouched. Legacy named saves can be COPIED into compact storage.
- Portable saves: `public/1999/engine/compact-career.mjs` stores world seed/mode/population plus nested deltas from the clean Jan 1999 game state; gzip if the browser supports it; mandatory checksum. Portable `.wtwsave` is a versioned binary file. IDB stores metadata and binary payloads separately and atomically. There are no generated 325k full-horse records in the career save.
- Save budget guard: 64 MiB maximum per portable career; 60 local slots to avoid uncontrolled growth. These are **protective limits, not promised real-career sizes**. Storage is local to the player's browser. Private/incognito browser data or cleared site data can be lost; advise portable backups.
- Completed race RESULT facts: `public/1999/engine/compact-race-results.mjs` is a dedicated lossless, dictionary-indexed **monthly archive format**. Every starter's exact horse, trainer, jockey, finishing position and earnings remains stored; optional narrative is capped. It is not a re-simulation of a prior race.
- **Scope limitation:** The race-result archive format is implemented and separately tested, but the live 1999 race engine does **not yet commit completed races to these monthly archives**. The current V1 portable `.wtwsave` contains the native game's state delta, not detached monthly race archives. Before enabling the permanent archive writer in gameplay, implement an atomic race-commit transaction AND a portable backup bundle including both active career and archive blocks.

### Commercial data design

1. **Immutable world genesis:** world profile + stable historical canon + versioned deterministic generator. Never regenerate a prior career with a different algorithm under the same generator version.
2. **Mutable career state:** owner/trainer assignments, developing condition, health, contracts, finances, training plans and active entries. Persist only changes, not all unchanged horse profiles.
3. **Permanent event/result facts:** born/deceased, ownership transfer, breeding match, foaling, injuries, completed race results and player decisions. Store once with a stable immutable ID, replay without changing finishes.
4. **Archive closed months:** compress complete race-result rows into month partitions with dictionary indexes. Keep only recent/live months readily active; decompress old periods only when the user opens them.
5. **Multi-year saves:** versioned snapshots plus append-only event segments. Reconstruct from latest snapshot and events, verify checksum and date. Do not serialize an entire 25-year world into browser `localStorage`.
6. **Portability and backups:** player can download/import an entire career as portable file(s), including every result partition. Use IndexedDB for active local storage; optional cloud sync is a separate service and must never be mandatory or required for playing.

### Engineering benchmarks and acceptance tests

- `npm run bench:world`: full 325k identity enumeration, uniqueness, reverse lookup, memory.
- `npm run bench:saves`: sparse changed-career file and twelve months of synthetic lossless race archives; prints measured bytes, never a blanket guarantee.
- `tests/1999-world-profiles.test.mjs`: all population presets and source modes.
- `tests/1999-compact-career.test.mjs`: exact state restoration, Unicode, deletion handling, corruption rejection and sparse file size.
- `tests/1999-compact-race-results.test.mjs`: all runner finish and payout facts roundtrip.
- `tests/1999-commercial-career-wiring.test.mjs`: approved UI routing, world source and game seed are aligned.
- Browser QA still required: Chrome, Firefox, Safari, laptop and mobile; real storage quota tests; export/re-import in different browser; save migration; a ten-year simulated career.

### Next work to make commercially COMPLETE (not yet claimed finished)

1. Reconcile small-world active **race/breeding/AI economics** to directory population: track counts, active runners, crop size and staffing.
2. Integrate the transactionally persistent race ledger into the actual race-finishing and advancement loop; prevent duplicate or retroactively changed results.
3. Add monthly event/season archives to the portable save bundle, and a safe compacted daily checkpoint so browser `localStorage` stops growing with the career.
4. Ensure 1999 + subsequent foal crops create stable persistent IDs, unique parentage and valid age cohorts. New horses should be sparse newborn rows plus immutable birth events.
5. Freeze generator version per career, implement schema upgrades/migrations rather than rewriting historical identities.
6. Run ten-, twenty- and fifty-season benchmarks measuring *real* save sizes, compression/recovery time, UI responsiveness and browser storage eviction.

**Do not delete source-locked history or replace the approved management UI to implement any of these tasks.**
