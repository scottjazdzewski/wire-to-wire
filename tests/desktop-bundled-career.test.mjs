import test from 'node:test';
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {readFileSync} from 'node:fs';
import {unpackShared1999Career} from '../public/1999/engine/shared-1999-career-package.mjs';

const asset=new URL('../public/assets/careers/WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer.gz',import.meta.url);
const manager=readFileSync(new URL('../public/next/1999-commercial-career-manager.mjs',import.meta.url),'utf8');
const preload=readFileSync(new URL('../desktop/preload.cjs',import.meta.url),'utf8');
const desktopSmoke=readFileSync(new URL('../scripts/windows-desktop-smoke.ps1',import.meta.url),'utf8');
const fullWorldSmoke=readFileSync(new URL('../scripts/1999-full-world-browser-cdp.mjs',import.meta.url),'utf8');

test('the desktop bundles the checksummed shared 300k May 1999 career compactly',async()=>{
 const compressed=readFileSync(asset);
 assert.ok(compressed.byteLength<600_000,'Bundled checkpoint should stay under 600 KB');
 const checkpoint=await unpackShared1999Career(gunzipSync(compressed));
 assert.equal(checkpoint.world.worldId,'WTW1999FullIndustry-COHORTS-V2-H300000');
 assert.equal(checkpoint.world.seed,19990101);
 assert.equal(checkpoint.world.horseCount,300000);
 assert.equal(checkpoint.world.personCount,75724);
 assert.equal(checkpoint.careerRecord.runId,'WTW-RUN-1999-19990101-SIZE-300000');
 assert.equal(checkpoint.careerRecord.gameDate,'1999-05-29');
 assert.ok(checkpoint.careerRecord.changes.canonicalRun.stable_horse_ids.length>=2);
});

test('desktop startup auto-loads the bundle while smoke runs can invoke it deterministically',()=>{
 assert.match(manager,/bootstrapBundledCareer\(\)\.catch/);
 assert.match(manager,/window\.WTWDesktop\?\.runtime==='windows-desktop'&&!window\.WTWDesktop\.smokeMode/);
 assert.match(manager,/importSharedCareerFile\(file,\{preserveExistingProgress:true\}\)/);
 assert.match(manager,/sameShared1999WorldManifest\(fullIndustryManifest,expected\)/);
 assert.match(manager,/wtw-shared-career-manifest-canonical-v1/);
 assert.match(manager,/Existing local progress kept/);
 assert.match(preload,/smokeMode/);
 assert.match(desktopSmoke,/IncludeCareerBootstrap/);
 assert.match(desktopSmoke,/career-read/);
 assert.match(fullWorldSmoke,/WTW_BUNDLED_CAREER_CHECKPOINT_REOPEN_PASS/);
});
