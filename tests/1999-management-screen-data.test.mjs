import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {readLocal1999World} from '../public/1999/engine/local-api.mjs';
const source=readFileSync('public/next/1999-ui-source.mjs','utf8');
const js=readFileSync('public/next/next.js','utf8');
const html=readFileSync('public/next/index.html','utf8');
const context={window:{__WTW_NEXT__:{paint(){}}},readLocal1999World};
vm.runInNewContext(source.replace(/^import\s+\{readLocal1999World\}\s+from\s+'\/1999\/engine\/local-api.mjs(?:\?[^']+)?';\s*$/m,''),context,{timeout:20000});
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
  assert.ok(facts&&['1999_CANON_LOCKED','1999_TEST_GENERATED'].includes(facts.source));
  assert.equal(facts.source,h.tag.startsWith('CANON')?'1999_CANON_LOCKED':'1999_TEST_GENERATED');
  assert.ok(ui.ownerFor(h.name));
 }
 assert.ok(ui.sourceOwnerName);
 assert.match(js,/stableDemo:!window.__WTW_1999_MANAGEMENT__/);
});
test('all department rosters have usable test records on original screens',()=>{
 assert.equal(ui.departmentRows('Breeding','Stallions').length,31);
 assert.equal(ui.departmentRows('Breeding','Broodmares').length,2036);
 assert.equal(ui.departmentRows('Personnel','Ownership Groups').length,0);
 assert.equal(ui.departmentRows('Personnel','Owners').length,3308);
  assert.ok(ui.departmentRows('Personnel','Owners').every(x=>x.principal&&x._testAttrs));
 assert.equal(ui.departmentRows('Personnel','Trainers').length,4200);
 assert.equal(ui.departmentRows('Personnel','Jockeys').length,1800);
 const jockeys=ui.departmentRows('Personnel','Jockeys');
 assert.ok(jockeys.every(p=>p._testAbility&&p.ca===String(p._testAbility.currentStars)&&p.pa===String(p._testAbility.potentialStars)));
 assert.ok(jockeys.filter(p=>Number(p.age)>=32&&Number(p.age)<=40).every(p=>Number(p.pa)-Number(p.ca)<=1));
 assert.ok(ui.departmentRows('Personnel','Staff').length>=1000);
  assert.ok(ui.departmentRows('Personnel','Staff').every(x=>!['groom','exercise_rider'].includes(x.role)));
 assert.equal(ui.departmentRows('Facilities','Overview').length,5234);
  assert.ok(ui.departmentRows('Facilities','Overview').every(x=>Object.keys(x._testAttrs||{}).length>=4));
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
test('Racing screen uses source stakes and dated test condition books instead of the old 2014 fixture targets',()=>{
 assert.deepEqual(Array.from(ui.departmentRows('Racing','Entries',{date:'1999-01-01'})),[]);
 assert.deepEqual(Array.from(ui.departmentRows('Racing','Results',{date:'1999-01-01'})),[]);
 const stakes=ui.departmentRows('Racing','Stakes',{date:'1999-01-01'});
 assert.equal(stakes.length,93);
 assert.ok(stakes.every(r=>r._iso.startsWith('1999-')&&r.status.includes('NOT ENTERED')));
 const card=ui.departmentRows('Racing','Race Planning',{date:'1999-01-01'});
 assert.ok(card.length>=40);
 assert.ok(card.every(r=>r.date==='1999-01-01'&&r.status.includes('NOT ENTERED')&&r.horse===''));
 assert.match(js,/const racingRows=\(\)=>window.__WTW_1999_MANAGEMENT__\?\[\]/);
});
test('original World roster can inspect all 87500 names by virtual page without loading 87500 trait objects',()=>{
 assert.equal(typeof ui.worldHorsePage,'function');
 const first=ui.worldHorsePage(0,18);
 const synthetic=ui.worldHorsePage(300,18);
 const last=ui.worldHorsePage(87482,18);
 assert.equal(first.total,87500);
 assert.equal(last.total,87500);
 assert.equal(first.items.length,18);
 assert.equal(synthetic.items.length,18);
 assert.equal(last.items.length,18);
 assert.ok(first.items.every(x=>x._worldKey?.startsWith('horse:')));
 assert.ok(synthetic.items.every(x=>x._testGenerated&&!x._worldKey));
 assert.ok(synthetic.items.every(x=>Object.keys(x._testAttrs).length===53));
 assert.ok(synthetic.items.every(x=>x.owner&&x.trainer&&x.sire&&x.dam&&x.location));
 assert.match(js,/worldHorsePage/);
 assert.match(js,/totalRecords=pageData\?pageData.total:rows.length/);
});
test('large rosters are cached so native UI pagination does not regenerate all records on every paint',()=>{
 const a=ui.departmentRows('Personnel','Staff');
 const b=ui.departmentRows('Personnel','Staff');
 assert.equal(a,b);
 const farms=ui.departmentRows('Facilities','Overview');
 assert.equal(farms,ui.departmentRows('Facilities','Overview'));
});
