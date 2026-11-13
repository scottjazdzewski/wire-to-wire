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
 assert.equal(ui.counts.horses,0);
 assert.equal(ui.counts.worldHorses,73);
 assert.equal(ui.counts.owners,37);
 assert.ok(ui.counts.tracks>=50&&ui.counts.tracks<=118);
 assert.ok(ui.counts.people<150);
 assert.ok(!ui.generatedStaffRoles?.includes('groom'));
});

test('new founding stable must not display inherited B01 generated horses as owned entries',()=>{
 assert.equal(ui.stableHorses.length,0);
 assert.equal(ui.counts.horses,0);
 assert.ok(ui.departmentRows('Personnel','Owners').length===37);
 assert.ok(!ui.worldHorsePage(0,73).items.some(x=>x._id==='H-1997-030039'));
});

test('founding Office clearly separates the 24 proposed principals from the 13 established links',()=>{
 const owners=ui.departmentRows('Personnel','Owners');
 assert.equal(owners.length,37);
 assert.equal(owners.filter(o=>o.status==='PROPOSED PRINCIPAL · NOT APPROVED').length,4);
 assert.equal(owners.filter(o=>o.status==='ESTABLISHED PRINCIPAL').length,12);
 assert.equal(owners.filter(o=>o.status==='APPROVED PRINCIPAL').length,21);
 assert.equal(owners.find(o=>o._id==='O-000002').status,'PROPOSED PRINCIPAL · NOT APPROVED');
 assert.equal(owners.find(o=>o._id==='O-000002').principal,'Not recorded');
 assert.equal(owners.find(o=>o._id==='O-000061').status,'ESTABLISHED PRINCIPAL');
 assert.match(js,/LEADERSHIP APPROVAL/);
 assert.match(js,/PROPOSED — AWAITING USER APPROVAL/);
 assert.match(js,/PROPOSED · REVIEW/);
});

test('person identity is source-only with NO generated skills, and opening racehorses remain empty',()=>{
 const worldParams='?mode=FOUNDING_1999&population=73&seed=19990101';
 const person=readLocal1999World('/api/1999/people'+worldParams+'&limit=1').items[0];
 const personModel=ui.sourcePersonModel(person.id);
 assert.equal(personModel.id,person.id);
 assert.equal(personModel.ability,null);
 assert.equal(personModel.roleAttributes,null);
 assert.equal(readLocal1999World('/api/1999/horses'+worldParams).total,0);
 assert.equal(ui.sourceHorseModel('H-NOT-REGISTERED'),null);
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

test('no generated staff, jockeys, contracts or trainers enter the approved-only founding world',()=>{
 assert.equal(ui.departmentRows('Personnel','Jockeys').length,0);
 assert.equal(ui.departmentRows('Personnel','Staff').length,0);
 assert.equal(ui.departmentRows('Personnel','Trainers').length,0);
 assert.equal(ui.departmentRows('Personnel','Ownership Groups').length,0);
 assert.equal(ui.departmentRows('Personnel','Owners').length,37);
 assert.equal(ui.generatedStaffRoles.length,0);
 assert.equal(ui.counts.people,41);
});

test('Facilities uses the same FULL-WIDTH sortable roster and VIEW dropdown as Personnel/Sales, with no side inspector',()=>{
 assert.match(js,/Facilities:\['Overview','Stud Farms','Training Centers','Breaking Facilities','Racing Stables','Farms','Trainer Barns'\]/);
 assert.match(js,/ng-functional ng-stable-roster-v2 ng-dept-roster/);
 assert.match(js,/data-ng-select="department-tab"/);
 assert.match(js,/ng-rs-roster/);
 assert.match(js,/ng-rs-scroll/);
 assert.match(js,/DEP_COLUMNS=\{/);
 assert.match(js,/Facilities:\[\['name','FACILITY'/);
 assert.match(source,/page==='Trainer Barns'/);
 assert.equal(ui.departmentRows('Facilities','Trainer Barns').length,0);
 assert.equal(ui.departmentRows('Facilities','Overview').length,30);
});
test('the small founding facility, finance, and sale directories show no phantom catalogs',()=>{
 assert.equal(ui.auctionList().length,0);
 const owners=ui.departmentRows('Personnel','Owners');
 assert.ok(owners.some(o=>o.name==='Midway'));
 assert.ok(owners.some(o=>o.name==='Harrowgate Farm'));
 assert.ok(!owners.some(o=>['Barlow Stable','Lattice Farm'].includes(o.name)));
 const facilities=ui.departmentRows('Facilities','Overview');
 assert.equal(facilities.length,ui.counts.facilities);
 assert.ok(facilities.every(f=>Boolean(f._id)));
 assert.equal(facilities.length,30);
 assert.equal(ui.departmentRows('Facilities','Stud Farms').length,5);
 assert.equal(ui.departmentRows('Facilities','Farms').length,15);
 assert.equal(ui.departmentRows('Facilities','Racing Stables').length,10);
 assert.equal(ui.departmentRows('Facilities','Training Centers').length,0);
 assert.equal(ui.departmentRows('Facilities','Breaking Facilities').length,0);
 assert.equal(ui.departmentRows('Breeding','Stud Farms').length,5);
 assert.ok(facilities.every(f=>!f.capacity&&!f.cost&&!f._testGenerated));
 const finance=ui.departmentRows('Finances','Overview');
 assert.ok(finance.every(row=>row.source==='FOUNDING_FINANCE_NOT_CERTIFIED__NO_SETTLEMENT_AUTHORITY'&&row.income==='—'&&row.expense==='—'));
});

test('global World browser pages only the 73 connected breeding animals, never B01 or the 325k world',()=>{
 const first=ui.worldHorsePage(0,18);
 const last=ui.worldHorsePage(55,18);
 assert.equal(first.total,73);
 assert.equal(last.total,73);
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
