import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=p=>new URL('../'+p,import.meta.url);
const read=p=>readFileSync(file(p),'utf8');
const html=read('public/next/index.html');
const ui=read('public/next/next.js');
const manager=read('public/next/1999-commercial-career-manager.mjs');
const css=read('public/next/next.css');

test('approved UI loads the local career manager after the shared game interface',()=>{
 const config=html.indexOf('/next/1999-commercial-config.js');
 const bootstrap=html.indexOf('/next/1999-bootstrap.js');
 const uiIndex=html.indexOf('/next/next.js?rev=');
 const managerIndex=html.indexOf('/next/1999-commercial-career-manager.mjs?rev=');
 assert.ok(config>=0&&bootstrap>config&&uiIndex>bootstrap&&managerIndex>uiIndex);
 assert.match(html,/1999-commercial-career-manager\.mjs\?rev=wtw-custom-world-cohort-v3/);
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
 assert.ok(manager.includes("fetch('/data/track-geography-v33.json')"),
  'Track geography must come from a bundled local file');
});

test('custom-size worlds connect to the canonical playable race career',()=>{
 assert.match(manager,/data-cc="industry-size" type="number" min="10000" max="325000"/);
 assert.match(manager,/targetOpeningHorses:horseCount/);
 assert.match(manager,/worldId:'WTW1999FullIndustry-COHORTS-V2-H'\+horseCount/);
 assert.match(manager,/worldId:'WTW1999FullIndustry-COHORTS-V2-H'\+selectedIndustryHorses/);
 assert.match(manager,/START TEST CAREER/);
 assert.match(manager,/OPEN NEXT TEST RACE \/ ENTER TWO/);
 assert.match(manager,/ADVANCE ONE GAME DAY/);
 assert.match(manager,/openPersistent1999GameCareer/);
 assert.match(manager,/savePersistent1999CareerRun/);
 assert.match(manager,/gameRaceProgram/);
 assert.match(manager,/fullIndustryManifest\?'<p>WORLD STORED/);
 assert.doesNotMatch(manager,/NEW CAREER \/ START FROM SCRATCH|data-cc="population"|data-cc="new-name"|action==='new-world'/);
});
