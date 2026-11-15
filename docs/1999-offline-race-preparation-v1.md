# WIRE TO WIRE — Offline Booked-Race Conditioning & Welfare Taper (1999 V1)

## Scope and owner

This is the existing 1999 gameplay workstream: **horse fitness, workouts, race readiness and recovery**, not an alternate game, UI redesign or second training simulation. It uses `src/game/horse-care.js` and the same `public/1999/engine/horse-development.mjs` weekday/day-charge model; the canonical save/finance/journal and actual clock remain authoritative.

### Gameplay rules

A player owner may select `BALANCED`, `SHARPEN`, or `CONSERVE` training for a specific actual BOOKED horse and OPEN 1999 condition-book race **2–28 days before post time**. The revision-gated `SET_1999_RACE_PREPARATION` command records an optional `race_preparation` schedule on that horse's existing care record. `CANCEL` or changing the underlying training policy revokes it; feed/care or owner funding changes do not silently revoke a valid booking.

The read-only `get1999RacePreparation(state,world,{horse_id,race_id})` returns the booked race, date, trainer, jockey, current conditioning, available approaches, next workout and modeled welfare constraints. It provides **no predicted race result**, false training completion or source-historical claim.

On the one canonical **daily care day**, the approved schedule suggests workouts by distance to race:
- Foundation: balanced conditioning, a limited `SPEED` interval when suitable, or gentle work for conservative plans;
- Final week: `PREP` alternating with `LIGHT` (more conservative plans only `LIGHT`);
- Last 3–2 days: `LIGHT`;
- The day before and race day: `REST` to taper into the actual start;
- The original trainer algorithm's weekly rest day or safer lighter workload always overrides a targeted owner instruction;
- Soreness, excessive fatigue or risk: `REST` or `LIGHT` regardless of the chosen owner strategy;
- Shipping/returning: the **existing carrier-rest workflow** remains authoritative; track arrival always forces rest.

These are exclusively preexisting `TRAINING_PLANS` and `advanceHorseTrainingDay` exercises. Each real workout uses the actual trainer, stable staff, nutritional welfare, current horse condition, paid daily fees, supplies and one horse's owner budget. Unfunded work records an unfunded REST day with its consequences, **not** a phantom paid training benefit. Record stores the actual work, health/risk, paid cents, prep race and phase in its bounded existing training journal. No artificial speed/ability bonuses, fee waivers, fictitious veterinary findings or race wins are created.

After the official race is settled or a booking disappears, the schedule closes with an explicit reason on the following game day; the ordinary selected training policy remains intact and resumes in the same trainer/care model. Results, race purses, starting attributes, all approved ID links, and historic racing remain unchanged. This system is not permission to run unsafe race entries; `raceEligibility` and same-track physical shipping remain unchanged.

### Save and offline compatibility

- **Local runtime and data:** all logic executes in one deterministic local JavaScript engine from bundled source identities and actual state. No remote data, Cloudflare, D1, AI, HTTP, or third-party API is required.
- **Save compatibility:** `race_preparation` is an *optional* field on the existing `HORSE_CARE_SCHEMA` record. Older .wtwsave saves lacking the field continue exactly the prior trainer-directed care loop, with no conversion, replay drift, policy reset or auto-created preparation. New saves receive strict status/race/owner validation; commands use existing idempotent receipts. No new save store is introduced.
- **Browser preview:** the existing internal `/next/?playtest=38` adapter loads the existing local JSON assets over a browser path and currently persists IndexedDB. The gameplay calculations are not tied to that adapter.
- **Commercial migration remaining:** dedicated desktop workstream owns the installed Electron shell, bundled approved historical data, desktop app-data save and import from IndexedDB and portable .wtwsave, recovery/backups and final offline Windows installed-app QA. This feature does not modify `desktop/`.
- **Windows packaged test:** **NOT YET DESKTOP CERTIFIED** unless a separate CI actually installs, runs, closes and reopens the relevant build with networking disabled. Node/Chromium and artifact packaging alone are not equivalent to that proof.
- **UI / visual assets:** No new screen, CSS, badges, artwork or changes to approved asset hash lock.

### Verification

`node --test tests/1999-offline-race-preparation-workouts.test.mjs` tests booked race authority, revision/idempotent receipts, real one-writer payment and care records, rest/taper, race settlement, retirement, budgeting and portable save consistency. Existing `npm test`, mirrored engine source check, January 1999 integration, real browser restart and release desktop policy gates remain mandatory. Before merge, reconcile latest `main` without overwriting other workstreams and require every applicable CI gate green.

**Rollback:** revert the engine/career-service/export/test/doc change; historical source, active race archive, existing owner training policy, and previously saved results are not altered or deleted.
