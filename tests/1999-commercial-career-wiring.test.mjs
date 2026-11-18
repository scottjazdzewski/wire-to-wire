import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=p=>new URL('../'+p,import.meta.url);
const read=p=>readFileSync(file(p),'utf8');
const html=read('public/next/index.html');
const ui=read('public/next/next.js');
const manager=read('public/next/1999-commercial-career-manager.mjs');
const industryWorker=read('public/next/1999-industry-bootstrap-worker.mjs');
const css=read('public/next/next.css');

test('approved UI loads the local career manager after the shared game interface',()=>{
 const config=html.indexOf('/next/1999-commercial-config.js');
 const bootstrap=html.indexOf('/next/1999-bootstrap.js');
 const uiIndex=html.indexOf('/next/next.js?rev=');
 const managerIndex=html.indexOf('/next/1999-commercial-career-manager.mjs?rev=');
 assert.ok(config>=0&&bootstrap>config&&uiIndex>bootstrap&&managerIndex>uiIndex);
 assert.match(html,/1999-commercial-career-manager\.mjs\?rev=wtw-world-builder-worker-v1/);
 assert.match(html,/href="\/next\/next\.css\?rev=/);
 assert.match(css,/\.wtw-cc-backdrop\[hidden\]\{display:none!important\}/);
 assert.match(ui,/if\(key==='save-open'\)/);
 assert.match(ui,/window\.WTWCompactCareerManager\?\.open/);
});

test('compact career saves remain local and the manager adds no hosted runtime dependency',()=>{
 assert.match(manager,/indexedDB\.open\(DB_NAME,1\)/);
 assert.match(manager,/encodeCareerSave\(game,baseline,profile\)/);
 assert.match(manager,/packCareerFile\(record\)/);
 assert.match(manager,/WireToWireClean1999CareersV2/);
 assert.match(manager,/No account, monthly fee or cloud storage required/);
 assert.ok(!manager.includes("fetch('http")&&!manager.includes('fetch("http')&&
  !manager.includes("fetch('/api/"));
 assert.ok(industryWorker.includes("fetch('/data/track-geography-v33.json')"),
  'Track geography must come from a bundled local file');
 assert.match(industryWorker,/industryDirectories\(seed,targetOpeningHorses=null\)/);
 assert.match(industryWorker,/industryDirectories\(request\.seed,\s*request\.targetOpeningHorses\?\?null\)/);
 const directoryBuilder=industryWorker.slice(industryWorker.indexOf('async function industryDirectories'),
  industryWorker.indexOf("self.addEventListener('message'"));
 assert.doesNotMatch(directoryBuilder,/request\.targetOpeningHorses/,
  'the worker message must pass requested size into the directory builder explicitly');
 assert.match(directoryBuilder,/fetch\('\/data\/horse-foaling-registry-projection-v33\.json'\)/,
  'approved founder foaling evidence must load separately from standing farms');
 assert.match(directoryBuilder,/foalingFarmId:h\.foalingFarmId\|\|null/,
  'a current standing farm must not be substituted as an unverified birthplace farm');
 assert.match(directoryBuilder,/careFacilityId,/,
  'the approved standing farm remains a distinct physical-care relationship');
});

test('custom-size worlds connect to the canonical playable race career',()=>{
 assert.match(manager,/data-cc="industry-size" type="number" min="10000" max="325000"/);
 assert.match(manager,/targetOpeningHorses:horseCount/);
 assert.match(manager,/worldId:new1999WorldIdForApprovedRelease\(\{seed,horseCount\}\)/,
  'new 1999 careers must use the versioned approved source pack when provided');
 assert.match(manager,/worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H'\+selectedIndustryHorses/);
 assert.match(manager,/worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V9-NAMES-V8-H'\+selectedIndustryHorses/,
  'expanded owner names preserve the original V8 careers');
 assert.match(manager,/worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V9-NAMES-V7-H'\+selectedIndustryHorses/,
  'archival owner-name expansion preserves the partnership-rich prior world');
 assert.match(manager,/worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V9-NAMES-V6-H'\+selectedIndustryHorses/,
  'the prior Census-only naming revision remains available to its saved careers');
 assert.match(manager,/worldId:'WTW1999FullIndustry-COHORTS-V3-OWNER-V9-H'\+selectedIndustryHorses/,
  'previous V3 allocations remain discoverable after the naming engine revision');
 assert.match(manager,/worldId:'WTW1999FullIndustry-COHORTS-V2-H'\+selectedIndustryHorses/,
  'legacy V2 worlds remain discoverable without rewriting their manifests');
 assert.match(manager,/START TEST CAREER/);
 assert.match(manager,/OPEN NEXT TEST RACE \/ ENTER TWO/);
 assert.match(manager,/ADVANCE ONE GAME DAY/);
 assert.match(manager,/openPersistent1999GameCareer/);
 assert.match(manager,/savePersistent1999CareerRun/);
 assert.match(manager,/gameRaceProgram/);
 assert.match(manager,/fullIndustryManifest\?'<p>WORLD STORED/);
 assert.doesNotMatch(manager,/NEW CAREER \/ START FROM SCRATCH|data-cc="population"|data-cc="new-name"|action==='new-world'/);
});
test('the actual full-world bootstrap uses source-backed 1999 racing-owner surnames',()=>{
 assert.match(industryWorker,/ownerNameSourceModel:'ARCHIVAL_1999_RACING_OWNERS'/);
});
