import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const manager=read('public/next/1999-commercial-career-manager.mjs');
const next=read('public/next/next.js');
const engine=read('public/1999/engine/fictional-industry-game-world-bridge-1999.mjs');
const html=read('public/next/index.html');

test('Windows production starts the bundled playable 1999 industry automatically',()=>{
 assert.match(manager,/if\(window\.WTWDesktop\?\.runtime==='windows-desktop'&&!window\.WTWDesktop\.smokeMode\)/);
 assert.match(manager,/window\.WTWDesktopCareerBootstrapPromise=bootstrapBundledCareer\(\)/);
 assert.match(manager,/WTW_1999_FULL_WORLD_SHARED_CAREER_V10\.wtwcareer\.gz/);
 assert.match(manager,/importSharedCareerFile\(file,\{preserveExistingProgress:true\}\)/);
 assert.match(manager,/fullIndustryManifest\?\.horseCount!==300000/);
 assert.match(manager,/startCanonicalRun\('O-000061'\)/);
 assert.match(manager,/operationRunId\(fullIndustryManifest,'O-000061'\)/);
 assert.match(engine,/start_date:'1999-01-01'/);
 assert.match(html,/1999-commercial-career-manager\.mjs/);
});

test('Normal Windows launch NEVER presents world creation or test-career wizard before the game',()=>{
 assert.match(manager,/const directToGame=!window\.WTWDesktop\.smokeMode;/);
 assert.match(manager,/silentDesktopStartup=directToGame/);
 assert.match(manager,/if\(silentDesktopStartup&&root\.hidden\)return/);
 assert.match(manager,/silentDesktopStartup=false;\s*modal\(\)\.hidden=true/);
 assert.match(next,/Loading your January 1, 1999 Kingsmere career and the full 300,000-horse industry/);
 assert.match(next,/window\.__WTW_DESKTOP_FULL_WORLD_BOOTING__/);
 assert.match(manager,/window\.__WTW_NEXT__\?\.paint\?\.\(\)/);
});

test('Old career progress is not erased by automatic startup',()=>{
 assert.match(manager,/\{preserveExistingProgress:true\}/);
 assert.match(manager,/const preservedRun=preservedRecord\?\.changes\?\.canonicalRun\|\|null/);
 assert.match(manager,/if\(saved\?\.changes\?\.canonicalRun\)/);
 assert.match(manager,/activeWorldCareer\.run=saved\.changes\.canonicalRun/);
 assert.match(manager,/const chosenId=operationId&&featuredOperations\(\)\.some/);
 assert.match(manager,/return canonicalRunId\(manifest\)\+'-OP-'\+operationId/);
});

test('Failure retains explicit recovery options, and desktop smoke tests retain their controls',()=>{
 assert.match(manager,/if\(directToGame\)window\.__WTW_DESKTOP_FULL_WORLD_BOOTING__=true/);
 assert.match(manager,/JANUARY 1999 AUTO-LOAD FAILED/);
 assert.match(manager,/Your existing careers are unchanged/);
 assert.match(manager,/else await refresh\(\)/);
 assert.match(manager,/if\(action==='open-existing-industry'\)/);
 assert.match(manager,/if\(action==='advance-test-day'\)/);
});
