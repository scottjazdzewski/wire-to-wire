# WIRE TO WIRE — V19 controlled industry entries (opt-in, no population)

## Outcome

The existing V12 approval service and V16/V17 permanent-organization journal can now recognize *new* fictional owners, racing stables, farms, stud farms, nurseries and training centers as years advance **only after explicit, already-durable naming approval** and an independent, revision-guarded registration event.

Nothing automatically joins the January 1, 1999 playable world. The naming engine does not create real-world organizations, staff assignments or new save-schema records. This feature is a tested capability for the separate future simulation integration to call when appropriate.

## Authoritative code and versioned records

- `indexed-fictional-name-registry.mjs`: V11 permanent name index now also provides `getApprovedOrganization(id)` by immutable ID in constant lookup time; older snapshots, names and cursors are unchanged.
- `durable-fictional-name-service.mjs`: New V12 batch organization rows include optional `registrationV19`, model `WTW_APPROVED_ORGANIZATION_REGISTRATION_V19`. These source-derived approval facts are `kind`, `approvedYear`, `namingRegion`, location, and established principal/trainer/manager references plus facility purpose. They are derived from the **same already approved V8/V15 organization**, not inferred from its name. `getApprovedOrganizationIdentity(id)` returns `{id,name,registration}`.
- `fictional-organization-continuity-v16.mjs`: New `REGISTER_APPROVED_ORGANIZATION` event validates V12 approved identity (via `approvedOrganizationLookup`), immutable name/ID, registration year, business type, existing eligible active personnel, duplicate ID/name, and assigns no invented kinship. An accepted event adds one business to the permanent directory. Its admission and later succession/closure/reopening appear in the same existing per-firm history.
- `durable-organization-continuity-v17.mjs`: Passes the approval lookup through the existing preview-before-atomic-append transaction. Organization revision, staff count, and journal remain under the established cursor/CAS protocol.
- `fictional-industry-identity-bridge-v18.mjs`: Adds `registerApprovedOrganization` and `getApprovedOrganizationIdentity`/`getOrganizationIdentity` as opt-in methods. The existing `applyTransition` now rejects bypass attempts for business registration; direct V17 callers still require an explicit approval lookup.

The implementation does not add another naming service, identity table, brand-name generator, database, career-save field, bootstrap import, or UI.

## Example workflow

```js
// Open two already existing, *separate* fictional naming/continuity stores.
const bridge=await openFictionalIndustryIdentityBridge({
 namingStorage,continuityStorage,worldId,seed,
 source:previouslyApprovedFoundingDirectory  // only on first open
});

// Optional future gameplay engine has already obtained a durable V12 batch.
// Register its required approved principal/trainer/manager as a person FIRST:
await bridge.registerApprovedPerson({
 personId:approvedTrainerId,eventId:'UNIQUE-REGISTRATION-PERSON',
 sourceId:'DOCUMENTED_SIM_DECISION',year:2030
});

// A business ID/name can now be admitted from the same V12 approval:
await bridge.registerApprovedOrganization({
 organizationId:approvedStableId,eventId:'UNIQUE-REGISTRATION-BUSINESS',
 sourceId:'DOCUMENTED_SIM_DECISION',year:2030
});

// Reuse the *same* stable ID through a valid, independent trainer succession:
await bridge.applyTransition({event:{
 type:'CHANGE_STABLE_TRAINER',organizationId:approvedStableId,
 toPersonId:anotherRegisteredTrainerId,
 eventId:'UNIQUE-TRAINER-CHANGE',sourceId:'DOCUMENTED_SIM_DECISION',
 year:2031
}});
```

All IDs must already exist in their respective durable registries. `registerApprovedOrganization` does not accept a caller-defined name, geography, purpose, owner, trainer, or list of managers. Those are read from immutable V12 naming approvals, and V16 requires the people to be explicitly enrolled in continuity before they assume any role. An old *untyped* V12 organization can be read by its original ID/name, but **cannot** be admitted based on guessed classification.

## Safety, chronology, and consistency

- Names, IDs and type evidence come from a committed V12 batch. A failed/rolled-back naming proposal is invisible to V19. No business is admitted because its name merely looks like a stud, stable or family operation.
- A registration with absent staff, wrong staff role, age outside V16 bounds, missing approval, a duplicate business ID/name, or a registration date before the naming approval year is rejected before the V17 write.
- An `INDIVIDUAL_OWNER` is not automatically transferable. Family successor transitions still require approved documented links; identical surnames alone prove nothing.
- Existing ownership operations can be reused without issuing another name or creating more syndicates. V19 registers businesses only on an explicit decision; it never creates one per horse.
- A business cannot be registered twice. V17 atomically commits one event, unique event ID and compact cursor with a revision CAS. If a second tab wins, an outdated tab must `refresh()`.
- Failed V17 writes cannot create phantom businesses. After an ambiguous commit error, use `refresh()` and inspect the business/event ID before proceeding; a durable commit may already exist.
- An already cached, immutable V12 organization approval is reused in O(1) without replaying the complete naming journal per admission. A miss refreshes from durable V12 for cross-session visibility. The existing V17 store remains append-only and recreates in-memory projections only on open/refresh.
- Snapshot restore and portability use **both** existing archives: the signed V12 naming bundle and the V17 continuity archive, restored independently into an EMPTY namespace. This is not a cross-database transaction. V19 organization events are validated through V16 replay when the continuity archive is restored.
- Pre-V19 V12 batches remain byte-for-byte compatible. Their `registration` field is `null` rather than an invented type. V16/V17 snapshots and existing 1999 names, world content and career saves do not migrate.

## Verification

```sh
node --test tests/1999-fictional-controlled-industry-growth-v19.test.mjs
node --test tests/1999-fictional-industry-identity-bridge-v18.test.mjs
node --test tests/1999-fictional-durable-naming-v12.test.mjs
node --test tests/1999-fictional-organization-continuity-v16.test.mjs
node --test tests/1999-fictional-durable-continuity-v17.test.mjs tests/1999-fictional-durable-continuity-v17-safety.test.mjs
npm test
```

The V19 suite uses an entirely disposable test namespace. It verifies all four business categories, initial manager/trainer/principal references, reject-before-persist, duplicate and spoof prevention, failed and ambiguous writes, stale simultaneous tabs, restart, chronology, archival recovery, incremental multiyear admissions, compact cursors, permanent identities and lack of playable-world mutation. Real Chromium persistence is covered by the existing V12/V17 IndexedDB smoke pipelines.

## Next boundary — V20

V19 admits independently approved permanent businesses. It does **not** implement horse-to-owner assignment, stable capacity, financial operating rules, property purchase/sale, staffing market economics, contract negotiation, or live simulation activation. Those are future operational/gameplay responsibilities, not implied by a naming approval.
