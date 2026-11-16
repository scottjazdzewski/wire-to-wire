import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {packShared1999Career,unpackShared1999Career}
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
