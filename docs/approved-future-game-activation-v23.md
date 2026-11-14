# WIRE TO WIRE — V23 Approved Future Identities in Actual Game Saves

## Mission and distinction from V22

V22 proved that the real game clock could consult the already certified fictional naming/continuity authority but intentionally stopped short of gameplay activation. **V23 creates actual game-run activation** for approved people and businesses inside the *existing* `WTW_GAME_RUN_V1` state, using the regular kernel, command receipts, event journal, and `WTW_GAME_SAVE_V1` save/load operations.

This is an optional future-year capability. It **never** changes the canonical January 1, 1999 source, edits existing pedigree, alters initial farms or people, replaces the UI, automatically generates game-world businesses, or activates on daily rollover. All new records come from a previously approved V12 name and a valid V17 permanent continuity record, passed through the explicit V22 authority binding.

## Versioned gameplay overlay

`state.runtime.future_industry` is absent until the first successful activation. Its model is `WTW_GAME_APPROVED_FUTURE_INDUSTRY_V23`, with one fixed `industry_world_id`, the precise original world snapshot ID and SHA-256, and indexed `people` and `organizations` by permanent approved IDs.

This is a **sparse game-run overlay**, not a second world snapshot. Original `world.entities` arrays and `state.world_ref` never change. Old `WTW_GAME_RUN_V1` saves missing this optional overlay continue to import and export unchanged; no legacy save migration is necessary.

The kernel accepts three identity admission/update operations, exclusively for trusted `actor:'system'` gameplay orchestration:

- `ACTIVATE_APPROVED_FUTURE_PERSON`: saves approved ID, name, profession, primary surname and birth year.
- `ACTIVATE_APPROVED_FUTURE_ORGANIZATION`: saves original approved organization ID, kind, name, recorded principal/trainer/managers, location, registration year and status.
- `SYNC_APPROVED_FUTURE_PERSON` / `SYNC_APPROVED_FUTURE_ORGANIZATION`: explicitly refreshes retirement/availability or business closure/leadership using a strictly newer V17 continuity revision. A succession never renames or re-IDs the original business.

The existing `src/game/future-industry-v22.js` service provides `activateApprovedPerson`, `activateApprovedOrganization`, `synchronizeApprovedPerson`, and `synchronizeApprovedOrganization` methods. They check both V12 approved identity and V17 registered existence, bind to the actual game date (2000–2099), and dispatch **one conventional kernel command**. A gateway is single-use for game-state-changing activations; reopen it with the returned new state before the next command, avoiding accidental stale-state writes.

**An approved person is not automatically a jockey booking or licensed race trainer.** V23 exposes their permanent identity and a player-safe profile; their abilities, contracts, reputation and employment must be determined by separate gameplay and recorded game evidence. A farm or stable organization has a permanent saved identity but does not silently gain a racing barn, staffed stalls, horse assignments or a bank balance.

## Actual playable owner integration

For `OWNER` operations only, the existing `ASSIGN_HORSE_OWNER`, `REQUEST_HORSE_TRANSFER`, `COMMIT_HORSE_TRANSFER` and `getOwnerPortfolioView` now resolve the approved saved V23 owner **in addition** to the canonical 1999 world organizations.

- Before V23 activation, a V12/V17-only company is still an unknown owner and cannot receive a horse.
- Following V23 activation, a future owner with active approved leadership can accept an unowned source horse assignment by the system, or receive a horse from a player under the same standard gift/sale transfer process.
- **Sales are not free:** the existing matching, posted finance-ledger settlement is still mandatory; V23 never manufactures an account, bank balance or contract.
- A successful game transfer changes a sparse owner delta in the same original career save and original ownership source remains frozen. The approved future owner's roster reconstructs after save/load.
- A V17 company closure, leader change, or retirement must be synchronized through the explicitly invoked service. Once closed, the business retains existing property/identity records but cannot receive new horse assignments; no horses are magically sold or transferred.
- V22 owner reuse now counts activated businesses against actual saved horse ownership and V20 horse-slot planning; merely V12/V17-named firms remain excluded.

This stage does not automate owner contract negotiations, future births, or a new `REGISTER_GAME_HORSE` horse-age rule. A 2005 racehorse and its parentage must be introduced by a separately approved gameplay/historical horse system, not by weakening the founding-1999 horse registration restrictions.

## Provenance and transactions

The gateway fetches source identity **directly** from V12/V17; callers cannot supply an arbitrary business name or age through its activation interface. The kernel persists the resulting identity, an `ACTIVATED` event with immutable source fields, and its command receipt in **one ordinary game-state transition**. `validateGameRun` checks the fixed world binding, duplicate/canonical ID collisions, name/role provenance, chronology, leader references, and matching event-journal fields. The extra identity validation indexes the saved event journal in one pass rather than repeatedly scanning it per person/company.

The state/save checksum is existing FNV-32 for accidental-corruption detection and is **not cryptographic tamper protection**. As with other game commands, `actor:'system'` is a trusted game-orchestration boundary, not a security boundary against a hostile browser running its own JavaScript. V23 does not claim that a locally fabricated system command can be authenticated without a trusted server. User/player commands cannot directly activate future identities.

V12 naming, V17 organizational continuity, and career Save/Load remain **three distinct durable authorities**. There is no fictitious distributed transaction between browser IndexedDB stores and the game save. The gateway only activates an identity after its naming and continuity registration are already durably accepted; interrupted game-save persistence is recovered by reloading the last valid save and replaying its explicit unique system command.

## Use

```js
import {createFutureIndustryGameGatewayV22,exportGameSave}
 from './src/game/index.js';

const gateway=createFutureIndustryGameGatewayV22({
 state:currentGameRun,world:approvedWorld,
 industry:existingApprovedV18Bridge,
 authorityBinding:{
  worldSnapshotId:approvedWorld.authority.snapshot_id,
  worldSha256:approvedWorld.authority.sha256,
  industryWorldId:existingApprovedV18Bridge.worldId
 }
});

// Already registered in V12 and V17 by separate approved business decision.
// A principal/person must be game activated BEFORE their company:
const result=gateway.activateApprovedPerson({
 personId:approvedPrincipalId,commandId:'UNIQUE-PERSON-ACTIVATION'
});
currentGameRun=result.state;
// Create a NEW gateway using currentGameRun before activating the business.
// Persist normally using the existing exportGameSave/Save APIs.
```

Test with `node --test tests/1999-future-industry-career-activation-v23.test.mjs`, `node scripts/sync-1999-browser-gameplay.mjs --check` and full `npm test`.

The V23 synthetic integration tests cover exact permanent identity, inherited 1999 source protection, admission collisions, no automatic profile ratings, real gifts, rejected unpaid sales, unowned horse assignment, missing approval rejection, status synchronization, leadership eligibility, ordinary save/load and tamper/incomplete-record detection. Both Node and browser game code remain locked to a single canonical engine.
