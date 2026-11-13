import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {readLocal1999World} from '../public/1999/engine/local-api.mjs';
import {trackProgram1999,trackMeetOpen1999} from '../public/next/1999-track-program.mjs';
import {WTW_ALTERNATE_STAKES_1999} from '../public/next/1999-alternate-stakes.mjs';
import {WTW_REGIONAL_STAKES_1999} from '../public/next/1999-regional-stakes.mjs';
import attributeCatalog from '../public/1999/engine/attribute-catalog.mjs';
import {TRAINING_PLANS,createHorseTrainingRecord,horseTrainingSnapshot,
 assignHorseTrainingPlan,simulateStableTrainingThrough,trainingFinancials}
 from '../public/1999/engine/horse-development.mjs';
const source=readFileSync('public/next/1999-ui-source.mjs','utf8');
const js=readFileSync('public/next/next.js','utf8');
const html=readFileSync('public/next/index.html','utf8');
const context={window:{__WTW_NEXT__:{paint(){}}},readLocal1999World,trackProgram1999,trackMeetOpen1999,
 WTW_ALTERNATE_STAKES_1999,WTW_REGIONAL_STAKES_1999,attributeCatalog,
 TRAINING_PLANS,createHorseTrainingRecord,horseTrainingSnapshot,assignHorseTrainingPlan,
 simulateStableTrainingThrough,trainingFinancials};
const browserImports=/^import\s+(?:\{[^}]+\}|attributeCatalog)\s+from\s+'\/(?:1999\/engine\/(?:local-api|attribute-catalog|horse-development)|next\/(?:1999-track-program|1999-alternate-stakes|1999-regional-stakes))\.mjs(?:\?[^']+)?';[ \t]*$/gm;
vm.runInNewContext(source.replace(browserImports,''),context,{timeout:20000});
const ui=context.window.__WTW_1999_UI_DATA__;
test('1999 approved Office shell serves ONLY the isolated founding scenario',()=>{
 assert.ok(ui);
 assert.match(html,/\/next\/next.css/);
 assert.match(html,/\/next\/next.js/);
 assert.match(html,/\/next\/1999-ui-source.mjs/);
 assert.match(js,/function departmentRoster\(/);
 assert.match(js,/function liveStableRosterView\(/);
 assert.equal(ui.counts.horses,39);
 assert.equal(ui.counts.worldHorses,112);
 assert.equal(ui.counts.owners,37);
 assert.ok(ui.counts.tracks>=50&&ui.counts.tracks<118);
 assert.ok(ui.counts.people<150);
 assert.ok(!ui.generatedStaffRoles?.includes('groom'));
});

test('stable only offers source-linked 1999 horses and exact IDs',()=>{
 assert.ok(ui.stableHorses.length>0);
 assert.ok(ui.stableHorses.every(h=>h.horseId?.startsWith('H-')));
 for(const h of ui.stableHorses){
  const fact=ui.sourceFacts(h.name);
  assert.ok(fact&&fact.source==='1999_CANON_LOCKED');
  assert.ok(ui.ownerFor(h.name));
 }
 assert.ok(ui.sourceOwnerId&&ui.sourceOwnerName);
});

test('the same detailed horse and person attributes resolve by immutable source ID',()=>{
 const worldParams='?mode=FOUNDING_1999&population=112&seed=19990101';
 const horse=readLocal1999World('/api/1999/horses'+worldParams+'&limit=1').items[0];
 const person=readLocal1999World('/api/1999/people'+worldParams+'&limit=1').items[0];
 const horseModel=ui.sourceHorseModel(horse.id);
 const personModel=ui.sourcePersonModel(person.id);
 assert.equal(horseModel.id,horse.id);
 assert.equal(personModel.id,person.id);
 assert.equal(Object.keys(horseModel.attributes).length,53);
 assert.ok(Object.keys(personModel.attributes).length>=attributeCatalog.person_common.length);
 assert.equal(ui.sourceHorseAbility(horse.id).current,horseModel.ability.current);
 assert.equal(ui.sourceHorseModel('H-UNKNOWN-777'),null);
 assert.equal(ui.sourcePersonModel('P-UNKNOWN-777'),null);
});

test('no duplicate stallion rows or invented foals enter the founding farm pages',()=>{
 const standing=ui.departmentRows('Breeding','Stallions');
 assert.equal(standing.length,18);
 assert.equal(new Set(standing.map(h=>h._canonId)).size,18);
 assert.ok(standing.every(h=>h.status.includes('SOURCE')&&!h._testGenerated));
 const mares=ui.breedingMarePage(0,20);
 assert.equal(mares.total,55);
 assert.equal(mares.items.length,20);
 const foals=ui.departmentRows('Breeding','Foals');
 assert.equal(foals.length,1);
 assert.match(foals[0].sire,/18/);
 assert.equal(foals[0].foals,'0');
 assert.equal(foals[0].bookings,'0');
});

test('staff roster is freshly generated, role-specific, and never silently employed',()=>{
 const jockeys=ui.departmentRows('Personnel','Jockeys');
 const staff=ui.departmentRows('Personnel','Staff');
 assert.equal(jockeys.length,26);
 assert.ok(jockeys.every(p=>p._id.startsWith('P-FOUNDING-STAFF-')));
 assert.ok(jockeys.every(p=>p._testAbility?.current>=1&&p._testAbility?.potential>=p._testAbility.current));
 assert.ok(jockeys.every(p=>p.contract.includes('UNCONTRACTED')&&p.salary==='—'));
 assert.ok(staff.length>25);
 assert.ok(staff.every(p=>!['groom','exercise_rider'].includes(p.role)));
 assert.ok(staff.every(p=>p.contract.includes('UNCONTRACTED')&&p.salary==='—'));
 assert.ok(jockeys.every(p=>Object.keys(p._testAttrs||{}).length>=10));
 assert.equal(ui.departmentRows('Personnel','Ownership Groups').length,0);
 assert.equal(ui.departmentRows('Personnel','Owners').length,37);
 assert.ok(ui.departmentRows('Personnel','Trainers').length>=12);
});

test('the small founding facility, finance, and sale directories show no phantom catalogs',()=>{
 assert.equal(ui.auctionList().length,12);
 const owners=ui.departmentRows('Personnel','Owners');
 assert.ok(owners.some(o=>o.name==='Midway'));
 assert.ok(owners.some(o=>o.name==='Harrowgate Farm'));
 assert.ok(!owners.some(o=>['Barlow Stable','Lattice Farm'].includes(o.name)));
 const facilities=ui.departmentRows('Facilities','Overview');
 assert.equal(facilities.length,ui.counts.facilities);
 assert.ok(facilities.every(f=>Boolean(f._id)));
 const finance=ui.departmentRows('Finances','Overview');
 assert.ok(finance.every(row=>row.source==='GENERATED_TEST_BASELINE'));
});

test('global World browser pages only the founding 112 horses, never the 325k test population',()=>{
 const first=ui.worldHorsePage(0,18);
 const last=ui.worldHorsePage(94,18);
 assert.equal(first.total,112);
 assert.equal(last.total,112);
 assert.equal(first.items.length,18);
 assert.equal(last.items.length,18);
 assert.ok(first.items.every(x=>x._worldKey?.startsWith('horse:')));
 assert.ok(!last.items.some(x=>x._id?.startsWith('H-TEST-')));
});

test('race-calendar browser remains accessible without assigning entrants or results',()=>{
 assert.deepEqual(Array.from(ui.departmentRows('Racing','Entries',{date:'1999-01-01'})),[]);
 assert.deepEqual(Array.from(ui.departmentRows('Racing','Results',{date:'1999-01-01'})),[]);
 const card=ui.departmentRows('Racing','Race Planning',{date:'1999-01-01'});
 assert.ok(card.length>0);
 assert.ok(card.every(row=>row.horse===''&&row.status.includes('NOT ENTERED')));
 const tracks=ui.extraTracks();
 assert.equal(tracks.length,ui.counts.tracks);
 assert.ok(tracks.some(t=>t.name==='Saratoga'));
 assert.equal(ui.racingDayCards('1999-01-01','Saratoga').length,0);
 assert.match(ui.bridgeStatus,/NO_1999_OUTCOME_COMMITTED/);
});

test('repeated roster reads are cached and use the same existing UI layout',()=>{
 assert.strictEqual(ui.departmentRows('Personnel','Staff'),ui.departmentRows('Personnel','Staff'));
 assert.strictEqual(ui.departmentRows('Facilities','Overview'),ui.departmentRows('Facilities','Overview'));
 assert.match(js,/const totalRecords=globalDirectory\|\|virtualMethod\?virtualTotal:rows.length/);
 assert.match(js,/window\.__WTW_1999_UI_DATA__\[browse\]/);
});
