# WIRE TO WIRE — V22 game-clock industry decision gateway

## What V22 connects

V22 exposes the previously certified V12/V17/V18/V19/V20/V21 fictional industry services to the **existing canonical game-run API**, using the *actual saved game date* and approved snapshot as its authority. It is a deliberate small integration at a service boundary, not a new game, world replacement, independent simulator, automated generator or second career save.

The adapter lives in **both synchronized forms**:
- `src/game/future-industry-v22.js` — canonical Node game engine
- `public/1999/game/future-industry-v22.js` — byte-identical browser gameplay after the standard engine path rewrite

Exported through the existing `src/game/index.js` and `public/1999/game/index.js`. Their mirroring is enforced by `scripts/sync-1999-browser-gameplay.mjs --check`.

## Explicit user-authorized boundaries

A future-industry gateway can be opened only with a currently valid `WTW_GAME_RUN_V1` state, the exact approved world referenced by its save, the real V18 durable industry bridge, and an **explicit snapshot-to-industry authority binding** containing `worldSnapshotId`, `worldSha256`, and `industryWorldId`. An unrelated registry is rejected rather than guessed from a similar organization name. Every decision is anchored to `state.clock.date`, not an arbitrary caller-supplied year.

**1999 is fully disabled for future admissions.** The identity naming horizon also excludes game years after 2099. Merely importing or opening the gateway produces no people, organizations, horses, transactions, extra DBs, or career-save fields.

### Existing-owner reuse quote

`quoteOwnerReuse({region,slots,policy,includeOtherRegions,limit})` computes actual ownership counts from the approved game-world horse IDs and saved game ownership changes, also counting newly registered game horses once by unique ID. It then uses the V20 certified capacity planner and V21 leadership-readiness checks at the **actual game year**.

Crucially, any organization existing *only* in the detached V12/V17 journal is excluded from actionable game-owner options until it has been separately admitted into the **canonical world/game identity rules**. The adapter does not pretend that an unmatched business has zero horses or is a licensed, game-addressable recipient. Quote output reports `detachedBusinessesExcluded` and `gameHorseCount`. No horse changes hands as a result of a quote.

The existing game kernel continues to reject direct horse assignment to a newly registered detached-only owner.

Stable, farm and training-center occupancy are not inferred from trainer names or physical barn nicknames: a single trainer may work across multiple physical sites, and the game records use distinct barn/site IDs. **V22 intentionally provides actionable owner reuse only** until a verified game facility-to-business identity and occupancy mapping is established.

### Explicit future industry approvals

The gateway exposes:
- `registerApprovedPerson({personId,eventId,sourceId})` — calls V18; requires durable V12 person approval, permanent ID and valid age/role.
- `registerApprovedOrganization({organizationId,eventId,sourceId})` — calls V19; requires a durable typed V12 name, already registered eligible principal/trainer/managers and a permanent V17 event.
- `applyPersonnelDecision({type,personId,eventId,sourceId,...})` — delegates approved career, availability, or retirement changes to V16/V17 using the game-year clock.

These methods record **only in the already existing isolated naming/continuity authority**; their results explicitly say `gameSaveChanged:false` and `gameWorldActivated:false`. They do not make newly approved V12 organizations valid targets of `ASSIGN_HORSE_OWNER`, nor do they silently edit the signed canonical world snapshot. This separation is intentional: actual new-world entity activation requires a separately audited gameplay-state schema, identity resolution, and a coordinated persistence design. V12 and V17 use distinct databases and cannot perform a fictional cross-DB atomic commit with the game save.

The public UI does not expose these methods directly to players. Gameplay services must supply a legitimately authorized source event and serialize decisions with their own actual game-run revision. No automatic daily population, cron, or background generator is installed.

## Example

```js
import {createFutureIndustryGameGatewayV22}
 from './src/game/index.js';

const future=createFutureIndustryGameGatewayV22({
 state:theCurrentValidatedGameRun,
 world:theApprovedWorld,
 industry:alreadyOpenedV18Bridge,
 authorityBinding:{
  worldSnapshotId:theApprovedWorld.authority.snapshot_id,
  worldSha256:theApprovedWorld.authority.sha256,
  industryWorldId:alreadyOpenedV18Bridge.worldId
 }
});
const ownerOptions=future.quoteOwnerReuse({
 region:'KENTUCKY',slots:15,policy:'PREFER_ESTABLISHED'
});
// Read-only recommendations, never horse transfers or new owners.

// Only after an authorized game event AND an existing durable V12 approval:
const admission=await future.registerApprovedOrganization({
 organizationId:approvedPermanentV12BusinessId,
 eventId:'UNIQUE-AUTHORIZED-EVENT-ID',
 sourceId:'ENGINE-APPROVED-INDUSTRY-DECISION'
});
// admission.requiresGameplayIdentityActivation===true;
// admission.gameSaveChanged===false;
```

## Verification and next implementation boundary

Run `node --test tests/1999-future-industry-gameplay-gateway-v22.test.mjs` and `npm test`.

The suite uses the real canonical game-run constructor, ownership command dispatch and export/import save paths, plus the actual V18 naming/continuity bridge with disposable memory stores. It tests 1999 disabling, year scoping, world bindings, real game owner occupancy and changes, region/capacity choice, false duplicate population rejection, approved future identities and company admission, staff decisions, no cross-namespace implicit IDs, no direct new-owner horse transfers and exact Node/browser rules parity.

**V22 is a genuine game-engine service/API integration, not an automatically operating new 2000+ world simulation.** Do not describe it as direct gameplay activation or playable population until a future separately tested source/save binding milestone exists.
