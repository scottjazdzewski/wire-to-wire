# Wire to Wire — V12 durable fictional naming machinery

## Scope

V12 makes the V11 compact-cursor naming system durable across browser restarts. This creates NO playable-world people, farms, owners, jockeys, horses, pedigrees, historical records, or UI changes. The current founding-world Save/Load behavior is untouched.

## Modules

- public/1999/engine/indexed-fictional-name-registry.mjs: approved name construction, protected-name checks, compact cursor, and now a separated pure prepare step plus explicit memory commit.
- public/1999/engine/durable-fictional-name-service.mjs: new incremental durable naming coordinator, backup and restore, and verified V11 snapshot migration.
- public/1999/engine/indexeddb-fictional-naming-store.mjs: a separate local-first IndexedDB database named WireToWireFictionalNamesV12, distinct from the production career-save DB (WireToWireClean1999CareersV2) and the historical Cloudflare D1 read model.

The naming store has five object stores: worlds (revision and compact cursor), batches (one append-only issued-name event per request), nameKeys (unique normalized spelling), entities (stable person and business IDs), and owners (indexable reusable owner records and partnerships). The compound owner indexes support region and archetype filtering without scanning the full directory.

## Atomic on-demand generation

1. Generate a proposal with the existing V11/earlier naming engine, checking indexed historical names.
2. Prepare the next tiny cursor without mutating the in-memory index.
3. In a single IndexedDB read-write transaction, compare the expected revision, append the new batch, add unique names and stable IDs, register owners, and update the compact cursor.
4. Commit the in-memory name registry ONLY after the storage transaction completes.

Duplicate names, duplicate IDs or stale concurrent requests abort rather than issue phantom names. A second tab with a stale cursor must refresh before generating again. Simultaneous first-time initialization re-reads the winner's new registry and checks that the protected names match; conflicting historical foundations are rejected.

Only the new batch is appended on each call. Earlier names and owner records are not rewritten or inserted in the cursor. An explicit archive export can create a complete snapshot when needed for portable recovery.

## Service API

Use createIndexedDBFictionalNamingStore() from indexeddb-fictional-naming-store.mjs, then await openDurableFictionalNameService({storage,worldId,seed,protectedPeople,protectedOrganizations}) from durable-fictional-name-service.mjs. The instance offers generate({roles,owners,facilities,maxPartnershipGroups,soleOwnerPercent}), refresh(), exportBundle(), listOwners(), listGroups(), and hasName().

Call generate only when another game subsystem explicitly requests new fictional identities. It does not assign horses, populate the active game, or mutate a career save. New and historical ownership organizations remain reusable. The partnership cap remains enforced across restarts.

## Backup, restore, migration

- naming.exportBundle() produces a portable, checksummed standalone name registry.
- restoreDurableFictionalNamingBundle({storage,bundle}) verifies the integrity and historical sequence, imports in one transaction, and refuses to overwrite an existing world.
- bundleLegacyV11NamingSnapshot({snapshot,cursor}) verifies a full V11 snapshot, preserves its people, organization and owner identifiers, consolidates it to a historical baseline event, and retains the next-batch index.
- V8 name-only checkpoints do not carry sufficient relationship and identity records for safe full restoration. This module does not fabricate missing people or group relationships.

The present .wtwsave career format remains unchanged. A future integration can attach the separate naming archive to a new version of the portable career backup; doing that is outside this naming-only workstream.

## Verification

Run node --test tests/1999-fictional-durable-naming-v12.test.mjs to test sequential issuance, restart, backup, migration, stale tabs, failed writes, and first-open races.
Run bash scripts/1999-naming-indexeddb-smoke.sh to test native Chromium IndexedDB transactions, unique-name rollback, regional owner index queries, backup restoration and deterministic next generation. The isolated naming-v12-indexeddb-browser CI job runs this independently of the game's UI tests.

Production limitations: IndexedDB persists per origin/browser profile, not across devices. Browser storage can be cleared. Portable backups must be explicitly made and restored, and multi-device coordination is not claimed. Names remain fictional editorial proposals, not proof of actual owner/farm legal registrations.
