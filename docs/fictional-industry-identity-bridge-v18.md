# WIRE TO WIRE — V18 approved-person / organization identity integration

## Purpose and authority

V18 joins two existing *detached, opt-in* systems without populating the January 1, 1999 playable universe.

- V11/V12 naming is the sole issuer and durable authority for **new** fictional people. A person’s original ID, name, role, primary surname and birth year are copied from the committed naming record, never regenerated or accepted as user-supplied replacements.
- V16/V17 is the sole authority for organizational appointments, management changes, retirement, moves, closures, recorded family links and append-only operational history. It continues to preserve existing organization IDs and names.
- V18 is an integration facade, not another registry, naming engine or gameplay service.

Files:
- `public/1999/engine/fictional-industry-identity-bridge-v18.mjs`
- `public/1999/engine/durable-fictional-name-service.mjs` (backward-compatible optional V18 identity metadata for future approvals)
- `tests/1999-fictional-industry-identity-bridge-v18.test.mjs`

## Contract

```js
import {createIndexedDBFictionalNamingStore}
 from './public/1999/engine/indexeddb-fictional-naming-store.mjs';
import {createIndexedDBOrganizationContinuityStore}
 from './public/1999/engine/indexeddb-organization-continuity-v17.mjs';
import {openFictionalIndustryIdentityBridge}
 from './public/1999/engine/fictional-industry-identity-bridge-v18.mjs';

// Two existing independent stores; never use the active career-save store.
const namingStorage=createIndexedDBFictionalNamingStore();
const continuityStorage=createIndexedDBOrganizationContinuityStore();
const bridge=await openFictionalIndustryIdentityBridge({
 namingStorage,continuityStorage,
 worldId:'A-DETACHED-FICTIONAL-TEST-NAMESPACE',seed:19990101,
 source:alreadyApprovedSyntheticContinuityFoundation,
 familyLinkLookup:record=>isExplicitlyVerifiedFamilyLink(record)
});

// After a separate naming service has already GENERATED and DURABLY APPROVED
// the person (not during world startup):
await bridge.registerApprovedPerson({
 personId:'V12-PERMANENT-PERSON-ID',eventId:'UNIQUE-SIM-REGISTRATION',
 sourceId:'NAMING-APPROVAL-RECEIPT',year:2030
});
// Succession uses the exact same permanent ID, not a new synthetic person.
await bridge.applyTransition({event:{
 type:'CHANGE_STABLE_TRAINER',eventId:'UNIQUE-SIM-APPOINTMENT',
 sourceId:'APPROVED-SIMULATED-DECISION',year:2031,
 organizationId:'EXISTING-PERMANENT-STABLE-ID',
 toPersonId:'V12-PERMANENT-PERSON-ID'
}});
const identity=bridge.getPersonIdentity('V12-PERMANENT-PERSON-ID');
const stable=bridge.getOrganization('EXISTING-PERMANENT-STABLE-ID');
```

On restart omit `source` and reopen the same two namespaces. The facade calls `naming.refresh()` before registering a new person, so a successful approval from another tab is visible and a failed/uncommitted proposal is not. V17 revision compare-and-swap rejects stale concurrent appointments. After an ambiguous V17 commit error, call `bridge.refresh()` before retrying: the event may already be durable, in which case reuse is rejected and the first result remains the authority.

V18 `applyTransition` rejects direct `REGISTER_APPROVED_PERSON` events. Only `registerApprovedPerson` may submit those records, and it constructs the entire person payload from V12—not the caller. V16 then checks the exact approved identity, professional role, age, documented family relationship, closed status and existing organization. Existing V16/V17 direct APIs are retained for backward compatibility, not automatically rewritten or hidden.

## Cultural identity and migration boundary

New V12 naming batches may include `people[].identityMetadataV18` (model `WTW_APPROVED_PERSON_NAMING_METADATA_V18`). This append-only, optional field preserves the original generated `birthCountry`, name structure/style, naming origin, culture and cohort evidence when supplied by the naming engine. It does **not** assert legal nationality/citizenship or familial relationships.

`getApprovedPersonIdentity(id)` and `bridge.getPersonIdentity(id).namingMetadata` expose this durable record, including after recovery or portable restoration. The underlying V11 lookup and the original V12 field set remain unchanged. V12 batches created **before V18** lack these facts: the metadata is explicitly `null` until an independently authenticated source exists. V18 will not guess them from a surname, region, address or later generation.

No destructive migration or new IndexedDB schema is necessary: this is a versioned, additive optional property within the existing append-only V12 batch event. Older batches, old compact cursors, existing names and 1999 output remain exactly as they were. Reversible recovery is via the existing V12 signed portable naming bundle plus V17 continuity archive, restored independently into an empty namespace. Back up **both** archives together; they are separate transaction domains.

## Transaction boundary and safety

The two IndexedDB databases are intentionally isolated. There is no pretend cross-database atomic commit. A name is approved and reserved by the naming transaction *first*. A later failed continuity registration leaves that approval valid but creates **no phantom staff member or organization relationship**. Continuity events are persisted in their own V17 transaction before in-memory application. A failed write or cross-tab conflict triggers an explicit continuity refresh. Repeat event IDs and repeated person registrations are rejected; a caller should inspect state after ambiguous failures, not create a second identity.

Owner principals, stables and farm managers reuse permanent person IDs. Roles must be eligible, and successions never mint businesses, syndicates, owners or horses. A family operation cannot change principal based solely on a shared last name: V16 still requires a separately verified explicit family-link event.

The facade does not persist a second person index or reread all history on every registration. V12 uses its existing compact cursor and indexed approval lookup. V17 retains an append-only event journal and compact revision; its projection is hydrated on open/refresh. This model allows large horse populations to share relatively few organizations and personnel rather than using one owner/trainer per horse.

## Tests and deployment guard

Run:

```sh
node --test tests/1999-fictional-industry-identity-bridge-v18.test.mjs
node --test tests/1999-fictional-durable-naming-v12.test.mjs
node --test tests/1999-fictional-organization-continuity-v16.test.mjs
node --test tests/1999-fictional-durable-continuity-v17.test.mjs tests/1999-fictional-durable-continuity-v17-safety.test.mjs
npm test
```

The test uses disposable synthetic people and organizations only. It exercises registration, ownership/stable/farm transfers, retirement, family evidence, duplicate IDs, role rejection, stale tabs, transaction rollback, ambiguous writes, restart, paired archive recovery and immutable 1999 isolation. No V18 import has been added to the game bootstrap, saves, UI or historical identity files.

**No live activation is implied by merging this capability:** gameplay may eventually opt in after its own separate integration review.
