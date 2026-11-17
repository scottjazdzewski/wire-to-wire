import test from 'node:test';
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {readFileSync} from 'node:fs';
import {unpackShared1999Career} from '../public/1999/engine/shared-1999-career-package.mjs';

const asset=new URL('../public/assets/careers/WTW_1999_FULL_WORLD_SHARED_CAREER_V5.wtwcareer.gz',import.meta.url);
const frozenAsset=new URL('../public/assets/careers/WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer.gz',import.meta.url);
const manager=readFileSync(new URL('../public/next/1999-commercial-career-manager.mjs',import.meta.url),'utf8');
const industryWorker=readFileSync(new URL('../public/next/1999-industry-bootstrap-worker.mjs',import.meta.url),'utf8');
const preload=readFileSync(new URL('../desktop/preload.cjs',import.meta.url),'utf8');
const desktopSmoke=readFileSync(new URL('../scripts/windows-desktop-smoke.ps1',import.meta.url),'utf8');
const fullWorldSmoke=readFileSync(new URL('../scripts/1999-full-world-browser-cdp.mjs',import.meta.url),'utf8');

test('the desktop bundles V5 and preserves the frozen May 29 reference career',async()=>{
 const compressed=readFileSync(asset);
 assert.ok(compressed.byteLength<2_000_000,'V5 checkpoint should stay under 2 MB');
 const checkpoint=await unpackShared1999Career(gunzipSync(compressed));
 assert.equal(checkpoint.world.worldId,'WTW1999FullIndustry-COHORTS-V5-OWNER-V9-NAMES-V5-H300000');
 assert.equal(checkpoint.world.seed,19990101);
 assert.equal(checkpoint.world.horseCount,300000);
 assert.equal(checkpoint.world.personCount,75705);
 assert.equal(checkpoint.world.snapshotSha256,'81dcec2885adee8fff388aa5fa8a0bbe812ad8ca53fbaa9ef5186e489492f5e0');
 assert.equal(checkpoint.careerRecord.runId,'WTW-RUN-1999-19990101-SIZE-300000');
 assert.equal(checkpoint.careerRecord.gameDate,'1999-01-22');
 assert.equal(checkpoint.careerRecord.changes.canonicalRun.stable_horse_ids.length,658);
 const officialRaces=Object.values(checkpoint.careerRecord.changes.canonicalRun.runtime.races||{})
  .filter(r=>r.status==='OFFICIAL_SIM_RESULT');
 assert.equal(officialRaces.length,1,'Shared test career should include the 1999 race already settled in acceptance');
 const frozen=await unpackShared1999Career(gunzipSync(readFileSync(frozenAsset)));
 assert.equal(frozen.world.worldId,'WTW1999FullIndustry-COHORTS-V2-H300000');
 assert.equal(frozen.world.snapshotSha256,'027c41916c344dc68a42532f82aff1f006479dc21f0ba587fd20e92e323ce42f');
 assert.equal(frozen.careerRecord.gameDate,'1999-05-29');
 assert.equal(frozen.careerRecord.changes.canonicalRun.stable_horse_ids.length,30);
});

test('desktop startup auto-loads the bundle while smoke runs can invoke it deterministically',()=>{
 assert.match(manager,/bootstrapBundledCareer\(\)\.catch/);
 assert.match(manager,/window\.WTWDesktop\?\.runtime==='windows-desktop'&&!window\.WTWDesktop\.smokeMode/);
 assert.match(manager,/importSharedCareerFile\(file,\{preserveExistingProgress:true\}\)/);
 assert.match(manager,/sameShared1999WorldIdentity\(fullIndustryManifest,expected\)/);
 assert.match(manager,/wtw-shared-career-world-identity-v2/);
 assert.match(manager,/Existing local progress kept/);
 assert.match(manager,/new Worker\('\/next\/1999-industry-bootstrap-worker\.mjs/);
 assert.doesNotMatch(manager,/createPersistent1999Industry/,
  'the interactive renderer must not materialize the entire world');
 assert.match(industryWorker,/createPersistent1999Industry/);
 assert.match(industryWorker,/send\('STAGE'/);
 assert.match(industryWorker,/onProgress:progress=>send\('PROGRESS',progress\)/);
 assert.match(industryWorker,/yieldControl:\(\)=>new Promise/);
 assert.match(preload,/smokeMode/);
 assert.match(desktopSmoke,/IncludeCareerBootstrap/);
 assert.match(desktopSmoke,/career-read/);
 assert.match(fullWorldSmoke,/WTW_BUNDLED_CAREER_CHECKPOINT_REOPEN_PASS/);
});
