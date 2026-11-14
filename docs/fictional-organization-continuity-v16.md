# WIRE TO WIRE — V16 permanent organization continuity

## Mission

An owner business, farm, breeding operation, training center, or racing stable must remain the **same entity** when its manager, principal, trainer or operating location changes. It should not receive a new name and ID merely because an existing person retires or a successor takes control.

**This is a separate, opt-in organizational continuity capability.** The existing 1999 world, historical entities, horse names, ownership assignments, user save formats and UI are not populated or modified. Everything in the examples is a disposable fictional proposal.

## Model

`public/1999/engine/fictional-organization-continuity-v16.mjs` provides a stable, append-only organizational history registry.

```js
import {createFictionalOrganizationContinuityRegistry}
 from './public/1999/engine/fictional-organization-continuity-v16.mjs';

// directory comes from a pre-existing, approved fictional naming batch.
// Nothing here creates or inserts the directory into playable game data.
const registry=createFictionalOrganizationContinuityRegistry({
 source:{...directory,worldId:'EXAMPLE-FICTIONAL-NAMESPACE'}
});

const cursor=registry.cursor;
const receipt=registry.apply({
 expectedRevision:cursor.revision,
 event:{
  eventId:'SIM-001',sourceId:'SIMULATED-EXPLICIT-TRANSACTION',
  type:'CHANGE_STABLE_TRAINER',year:2030,
  organizationId:'EXISTING-STABLE-ID',toPersonId:'EXISTING-TRAINER-ID'
 }
});
const updated=registry.getOrganization('EXISTING-STABLE-ID',{withHistory:true});
const backup=registry.exportSnapshot();
const restored=createFictionalOrganizationContinuityRegistry({snapshot:backup});
```

`getOrganization`, `getPerson`, `getHistory` and `listOrganizations({kind,status,offset,limit})` provide read-only projections. The continuity cursor includes only world ID, revision, year, operation count and event count, not an expanding history or a full company directory. The append-only event log is exported explicitly as a standalone snapshot.

## Explicit lifecycle events

- CHANGE_OWNER_PRINCIPAL — transfers the designated principal of an existing owner **business** to an already-registered person. The business retains its legal identity and display name. A named individual-owner record cannot be transferred to another person because the individual identity is not a transferable company.
- CHANGE_STABLE_TRAINER — changes the responsible trainer on an established racing stable. The stable's legal name and ID survive the handover; it may continue to have the predecessor's surname as an established trade identity.
- REPLACE_FARM_MANAGERS and REPLACE_CENTER_MANAGERS — explicitly assigns already-known eligible farm managers to a farm or breaking/training center, without creating new employees.
- RELOCATE_ORGANIZATION — records a specific new city, region, two-letter country code and naming-market region without moving any horse or assuming shipping has occurred.
- CLOSE_ORGANIZATION and REOPEN_ORGANIZATION — changes operational status while retaining the same company ID, name and historic events.
- RETIRE_PERSON — retires an existing person only after active organizational positions have been reassigned or closed.

Each event has its own unique ID, monotonic game year, source/provenance ID and expected journal revision. Duplicate IDs, stale revisions, earlier dates, missing successors, incompatible roles and category errors fail without changing the registry.

## Family succession is earned, never invented

A family-labelled owner business can transfer its principal only to a person with an **explicit supplied family relationship** record. The source relationship is stored with two existing person IDs, a relationship kind and a source ID. Matching surnames by themselves do not create a family. Conversely, an explicitly documented successor can carry an established business name even if their personal surname is different.

V16 never invents parents, spouses, children, co-owners, syndicate members, ownership stakes or probate events. This is an identity/organization continuity model, not a family-tree or legal-contract simulator.

## Records and persistence

The existing V11 name index and V12 durable name registry remain authoritative for creating new **approved** fictional people and businesses. V16 reads an already-approved person and organization directory. It deliberately does not mint names, register real legal businesses, or assign any horses.

`registry.exportSnapshot()` is explicit and contains the founding directory plus an append-only event journal and a checksum against accidental corruption. Restoring a snapshot reconstructs the exact same permanent IDs, names, current responsible people, statuses and event histories. Only the compact cursor needs to travel with regular continuity updates.

**Storage limitation:** The core V16 registry is an in-memory reference implementation with an explicit portable snapshot, rather than an automatically saved live game system. A future host adapter must store the founding directory once and append revision-checked events to durable storage before committing to the in-memory projection. The current V12 IndexedDB naming service must not be silently repurposed into a world-population service.

## Verification

Run `node --test tests/1999-fictional-organization-continuity-v16.test.mjs` to check identity and 1999-name preservation, family evidence, retirement, principal/trainer/manager handovers, relocation, closures, stale/invalid events, snapshot replay and 1,000-event continuity scaling.

The core naming windows remain separate from active world generation. No source engine, UI, canonical history file, live horse database or career save is modified by V16.
