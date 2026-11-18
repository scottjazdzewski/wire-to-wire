import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {packShared1999Career,unpackShared1999Career,sameShared1999WorldManifest,
 sameShared1999WorldIdentity,migrateShared1999CareerRunWorldReference}
 from '../public/1999/engine/shared-1999-career-package.mjs';

globalThis.crypto??=webcrypto;
const manifest={schema:'WTW_PERSISTENT_INDUSTRY_1999_V1',status:'COMPLETE',
 seed:19990101,worldId:'WTW1999FullIndustry-COHORTS-V2-H300000',
 targetOpeningHorses:300000,horseCount:300000,personCount:75724,
 batchSize:2000,horseBatchesCommitted:150,personBatchesCommitted:38,
 plan:{modeledLivingPopulation:350000}};
const run={run_id:'WTW-RUN-1999-19990101-SIZE-300000',clock:{date:'1999-05-29'},
 player:{role:'owner',involvement:'balanced',operation_id:'O-FICTIONAL-OWNER-T-0062-08'},
 revision:120,journal:[],runtime:{races:{}}};
const careerRecord={schema:'WTW_INDUSTRY_CAREER_RUN_V1',worldId:manifest.worldId,
 worldSeed:manifest.seed,worldSchema:manifest.schema,runId:run.run_id,
 gameDate:run.clock.date,player:run.player,changes:{canonicalRun:run},version:121};

test('shared 1999 career checkpoint preserves exact deterministic world identity and run',async()=>{
 const bytes=await packShared1999Career({manifest,snapshotSha256:'a'.repeat(64),careerRecord});
 const restored=await unpackShared1999Career(bytes);
 assert.equal(restored.world.worldId,manifest.worldId);
 assert.equal(restored.world.seed,manifest.seed);
 assert.equal(restored.world.targetOpeningHorses,300000);
 assert.equal(restored.world.snapshotSha256,'a'.repeat(64));
 assert.deepEqual(restored.careerRecord,careerRecord);
});

test('shared 1999 career checkpoint rejects changed bytes and mismatched world/run metadata',async()=>{
 const bytes=await packShared1999Career({manifest,snapshotSha256:'b'.repeat(64),careerRecord});
 const damaged=bytes.slice();damaged[damaged.length-3]^=1;
 await assert.rejects(unpackShared1999Career(damaged),/checksum mismatch|valid JSON/);
 await assert.rejects(packShared1999Career({manifest,
  snapshotSha256:'b'.repeat(64),careerRecord:{...careerRecord,gameDate:'1999-05-28'}}),
  /metadata does not match/);
});

test('shared 1999 world manifests ignore key order but reject any changed values',()=>{
 const first={schema:'WTW_PERSISTENT_INDUSTRY_1999_V1',plan:{seed:19990101,counts:{mares:60,stallions:10}},tracks:['T-0001','T-0002']};
 const reordered={tracks:['T-0001','T-0002'],plan:{counts:{stallions:10,mares:60},seed:19990101},schema:'WTW_PERSISTENT_INDUSTRY_1999_V1'};
 assert.equal(sameShared1999WorldManifest(first,reordered),true);
 assert.equal(sameShared1999WorldManifest(first,{...reordered,tracks:['T-0002','T-0001']}),false);
 assert.equal(sameShared1999WorldManifest(first,{...reordered,plan:{...reordered.plan,seed:19990102}}),false);
});

test('world checkpoint identity survives generator metadata updates but rejects census changes',()=>{
 assert.equal(sameShared1999WorldIdentity(manifest,{...manifest,
  plan:{...manifest.plan,modeledLivingPopulation:350254},horseNamingRevision:'V489'}),true);
 assert.equal(sameShared1999WorldIdentity(manifest,{...manifest,seed:19990102}),false);
 assert.equal(sameShared1999WorldIdentity(manifest,{...manifest,personCount:75725}),false);
 assert.equal(sameShared1999WorldIdentity(manifest,{...manifest,targetOpeningHorses:325000}),false);
});


test('legacy shared career run reference advances only after exact snapshot verification',()=>{
 const oldSha='a'.repeat(64),newSha='b'.repeat(64),snapshotId='WTW-PERSISTED-1999-19990101-test-300000';
 const oldRun={...run,world_ref:{snapshot_id:snapshotId,sha256:oldSha}};
 const oldRecord={...careerRecord,changes:{...careerRecord.changes,canonicalRun:oldRun}};
 const migrated=migrateShared1999CareerRunWorldReference(oldRecord,{
  expectedSnapshotSha256:oldSha,currentAuthority:{snapshot_id:snapshotId,sha256:newSha}});
 assert.deepEqual(migrated.changes.canonicalRun.world_ref,
  {snapshot_id:snapshotId,sha256:newSha});
 assert.deepEqual({...migrated.changes.canonicalRun,world_ref:oldRun.world_ref},oldRun);
 assert.equal(oldRecord.changes.canonicalRun.world_ref.sha256,oldSha,
  'source checkpoint remains unchanged');
 assert.throws(()=>migrateShared1999CareerRunWorldReference(oldRecord,{
  expectedSnapshotSha256:'c'.repeat(64),
  currentAuthority:{snapshot_id:snapshotId,sha256:newSha}}),
  /verified legacy snapshot/);
 assert.throws(()=>migrateShared1999CareerRunWorldReference(oldRecord,{
  expectedSnapshotSha256:oldSha,
  currentAuthority:{snapshot_id:'WTW-PERSISTED-1999-OTHER',sha256:newSha}}),
  /snapshot identity changed/);
});
