# WIRE TO WIRE — V11 compact indexed identity naming

## Why

The prior V8 on-demand nextState repeated complete mintedNames, ownerEntities, and ownerGroupRecords on every request. At large scale that made checkpoints and normalization work grow with the entire generated history.

**V11 uses a small cursor and a separate indexed name registry.** It does not populate the playable 1999 world, name horses, alter historical records, or change the UI. V8 stays backward-compatible, but V11 is the preferred naming interface for new integrations.

Module: public/1999/engine/indexed-fictional-name-registry.mjs

## Usage

```js
import {createIndexedFictionalNameRegistry,generateIndexedFictionalNames}
 from './public/1999/engine/indexed-fictional-name-registry.mjs';

const registry=createIndexedFictionalNameRegistry({
 worldId:'My-Fictional-World',seed:19990101,
 protectedPeople:['Existing Person'],
 protectedOrganizations:['Approved Farm']
});
const first=generateIndexedFictionalNames({
 registry,worldId:'My-Fictional-World',seed:19990101,
 roles:{trainer:25,jockey:20},owners:60,
 facilities:{generalFarms:2,studFarms:1},
 maxPartnershipGroups:128
});
const cursor=first.nextCursor; // fixed-size counts, NOT names
const second=generateIndexedFictionalNames({
 registry,worldId:'My-Fictional-World',seed:19990101,cursor,
 roles:{trainer:10},owners:20
});
const existingOwners=registry.listOwners({limit:50});
const existingGroups=registry.listGroups({limit:50});
```

## What the registry stores

- Exact names in a Unicode/accent/case/punctuation-normalized Set, protecting prior people, owners, barns and farms.
- A root-prefix trie indexing already-issued organization names. A protected Kingsmere Farm can block Kingsmere Racing without rescanning a long historical list.
- Stable person/organization IDs and reusable ownership-organization records.
- A cumulative formal partnership/syndicate creation count. One group can be reused for many horses; no new partnership is needed for each horse.

The small cursor stores model, world ID, seed, era, revision, next batch number, partnership cap/count, individual-owner mix and cumulative count totals. It NEVER includes full previous name or owner arrays.

## Atomicity, replay and recovery

- Every batch is validated against the external index before a single commit. The in-memory reference adapter advances a revision once per successful batch.
- Requests with stale cursors fail. A caller must serialize competing submissions or provide a durable transaction that atomically compares and updates revision.
- A separate explicit registry.snapshot() produces a full JSON-serializable backup only on demand, not per naming request. A snapshot can be restored when the naming process restarts; its checksum detects accidental corruption, not malicious tampering.
- Production durability requires an indexed database or explicit backup/restore coordinated by the host. The reference adapter is in-memory and does not promise distributed locks, cloud persistence or background writes.
- The old V8 API remains supported for callers that have not migrated. The new V11 path no longer copies the complete name history through protectedNames.

## Testing

```bash
node --test tests/1999-fictional-compact-name-registry-v11.test.mjs
npm run bench:names:indexed
npm run bench:names:indexed -- --batches 250 --owners 50 --trainers 25 --jockeys 15 --historic 12000
```

Coverage includes 65 sequential batches and over 12,000 protected organization names, stable checkpoint size, exact and root-based collision rejection, transactional rollback, unchanged business/jockey naming models, owner-group caps, and deterministic restart from a separately persisted snapshot.

All generated names in these tests are disposable proposals. No game population or horse assignment occurs. Name uniqueness is not an external registry clearance or proof of legal company registration.
