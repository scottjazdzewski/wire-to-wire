# WIRE TO WIRE — V17 durable organizational continuity

## Mission

An existing fictional farm, stud, racing stable or ownership business must retain its exact permanent entity ID and approved organization name across generations of managers and principals. V16 already records these explicit lifecycle transitions. V17 makes the independent continuity journal durable without rewriting the complete history on each event.

**Boundary:** This is an opt-in naming/identity capability. It does not create or populate people, farms, trainers, horses, racing entries, pedigrees, game rosters, real historical records, UI components or career saves.

## Architecture

- `fictional-organization-continuity-v16.mjs` now exposes a non-mutating `preview({expectedRevision,event})` that applies every existing validation rule, including documented family evidence and approved-person lookup, and returns the exact proposed compact cursor without changing any records. `apply` is backward compatible.
- `durable-organization-continuity-v17.mjs` takes a V16 preview, persists the explicit event with the expected revision, and only then commits it to the V16 in-memory projection. On a failed or possibly competing disk transaction, the caller must refresh rather than mint phantom transitions.
- `indexeddb-organization-continuity-v17.mjs` uses the dedicated browser database `WireToWireFictionalContinuityV17`. It is independent of the V12 name index, live Office UI, Canon Desk D1 and existing user career save database.

Three IndexedDB stores are used: `worlds` contains the founding directory only once, the current revision and compact cursor; `events` stores only one append-only event for each new change; `eventIds` rejects duplicate IDs independently of revision numbers. A single IndexedDB read-write transaction checks the expected revision and writes all three parts atomically.

## Usage (only for pre-existing approved fictional organizations)

```js
import {createIndexedDBOrganizationContinuityStore}
 from './public/1999/engine/indexeddb-organization-continuity-v17.mjs';
import {openDurableOrganizationContinuityService}
 from './public/1999/engine/durable-organization-continuity-v17.mjs';

const storage=createIndexedDBOrganizationContinuityStore();
const service=await openDurableOrganizationContinuityService({
 storage,worldId:'A-SEPARATE-FICTIONAL-NAMESPACE',
 source:alreadyApprovedOrganizationDirectory,
 approvedPersonLookup:id=>approvedNameRegistry.getApprovedPerson(id),
 familyLinkLookup:record=>existingFamilyProvenance.has(record.sourceId)
});

const nextCursor=await service.apply({
 expectedRevision:service.revision,
 event:{eventId:'APPROVED-SIM-1',sourceId:'DOCUMENTED-GAME-EVENT',
  type:'CHANGE_STABLE_TRAINER',organizationId:'KNOWN-STABLE-ID',
  toPersonId:'KNOWN-TRAINER-ID',year:2031}
});

const stable=service.getOrganization('KNOWN-STABLE-ID');
const archive=await service.exportArchive();
await storage.close();
```

Restarts use `openDurableOrganizationContinuityService({storage,worldId})` without replaying the entire event history in every generation call. Historical events are reconstructed from the separately indexed journal only on open/refresh.

## Safety and concurrency

- No new organization is minted by a succession. The existing name and ID never change.
- Successors must be existing approved people, and family transfers must be backed by explicit documented relationships. A shared surname is not evidence.
- Stale browser tabs cannot commit competing changes: the IndexedDB transaction rejects a revision mismatch.
- A failed disk write leaves the in-memory registry unchanged. The service requires refresh after ambiguous disk failures; if persistence succeeds but local projection diverges it is recovered from disk.
- Archive restore validates the complete V16 event journal and checksum **before** any writes. It imports the entire organization foundation and event history in a single transaction, refusing to overwrite an existing namespace.

IndexedDB is local to a single browser origin/profile and is not a cross-device database or distributed lock. Browser data can be cleared. Explicit backups are required for portable continuity. This adapter is not automatically connected to gameplay saves, and nothing in this naming-only work automatically changes established game data.

## Verification

`node --test tests/1999-fictional-durable-continuity-v17.test.mjs` checks read-only previews, permanent identities, explicit succession, restarts, stale concurrent requests, failed writes, approved new staff, checksum-verified backup, no overwrite and a 1,000-event endurance sample. Tests use disposable synthetic identities only.

The existing V16 tests must stay green. The same 1999 immutable naming outputs, original historical sources, playable world, user UI and existing career saves must remain untouched.
