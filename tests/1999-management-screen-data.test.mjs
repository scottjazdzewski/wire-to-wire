import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {readLocal1999World} from '../public/1999/engine/local-api.mjs';
const source=readFileSync('public/next/1999-ui-source.mjs','utf8');
const js=readFileSync('public/next/next.js','utf8');
const html=readFileSync('public/next/index.html','utf8');
const context={window:{__WTW_NEXT__:{paint(){}}},readLocal1999World};
vm.runInNewContext(source.replace(/^import\s+\{readLocal1999World\}\s+from\s+'\/1999\/engine\/local-api.mjs';\s*$/m,''),context,{timeout:20000});
const ui=context.window.__WTW_1999_UI_DATA__;
test('1999 source data is mounted behind unchanged existing management UI',()=>{
 assert.ok(ui);
 assert.match(html,/\/next\/next.css/);
 assert.match(html,/\/next\/next.js/);
 assert.match(html,/\/next\/1999-ui-source.mjs/);
 assert.match(js,/function departmentRoster\(/);
 assert.match(js,/function liveStableRosterView\(/);
 assert.match(js,/function managerSidebar\(/);
 assert.equal(ui.counts.horses,87500);
 assert.equal(ui.counts.tracks,134);
});
test('source horses and owner identities drive existing stable, not 2014 demo',()=>{
 assert.ok(ui.stableHorses.length>=1);
 for(const h of ui.stableHorses){
  assert.match(h.horseId,/^H-/);
  const facts=ui.sourceFacts(h.name);
  assert.ok(facts&&facts.source==='1999_CANON_LOCKED');
  assert.ok(ui.ownerFor(h.name));
 }
 assert.ok(ui.sourceOwnerName);
 assert.match(js,/stableDemo:!window.__WTW_1999_MANAGEMENT__/);
});
test('all department rosters have usable test records on original screens',()=>{
 assert.equal(ui.departmentRows('Breeding','Stallions').length,31);
 assert.equal(ui.departmentRows('Breeding','Broodmares').length,2036);
 assert.equal(ui.departmentRows('Personnel','Ownership Groups').length,3308);
 assert.ok(ui.departmentRows('Personnel','Owners').length>=1);
 assert.equal(ui.departmentRows('Personnel','Trainers').length,4200);
 assert.equal(ui.departmentRows('Personnel','Jockeys').length,1800);
 assert.ok(ui.departmentRows('Personnel','Staff').length>=10000);
 assert.equal(ui.departmentRows('Facilities','Overview').length,5234);
 assert.ok(ui.departmentRows('Finances','Overview').length>=3);
 assert.equal(ui.auctionList().length,36);
 assert.equal(ui.extraTracks().length,134);
});
test('all generated finances, pedigrees, and source boundaries are clearly test/provenance-marked',()=>{
 const rows=ui.departmentRows('Finances','Overview');
 assert.ok(rows.every(x=>x.source==='GENERATED_TEST_BASELINE'));
 assert.ok(ui.departmentRows('Breeding','Stallions').every(x=>x.status.includes('SOURCE')));
 assert.ok(ui.departmentRows('Breeding','Broodmares').every(x=>x.status.includes('NO PREGNANCY ASSUMED')));
 assert.match(ui.bridgeStatus,/NO_1999_OUTCOME_COMMITTED/);
});
test('large rosters are cached so native UI pagination does not regenerate all records on every paint',()=>{
 const a=ui.departmentRows('Personnel','Staff');
 const b=ui.departmentRows('Personnel','Staff');
 assert.equal(a,b);
 const farms=ui.departmentRows('Facilities','Overview');
 assert.equal(farms,ui.departmentRows('Facilities','Overview'));
});
