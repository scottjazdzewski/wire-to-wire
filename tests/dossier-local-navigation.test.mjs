import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const js=read('public/next/next.js');
const css=read('public/next/next.css');
const browser=read('scripts/1999-full-screen-controls-cdp.mjs');
const standard=read('docs/design/WTW_UNIFIED_SCREEN_INTERACTION_LOCK_2026-11-13.md');
const start=js.indexOf('function dossierEntityCategory(');
const end=js.indexOf('\nfunction openWorld1999Entity(',start);
assert.ok(start>0&&end>start,'The ONE source-backed entity browser must be present');
const helpers=Function(js.slice(start,end)+
 '\nreturn {category:dossierEntityCategory,adjacent:dossierAdjacentRecords};')();
const entry=(kind,id,name,roleOrType)=>({
 kind,canonicalId:id,name,worldKey:kind+':'+id,
 detail:roleOrType,_world:kind==='person'?{role:roleOrType}:{type:roleOrType}
});

test('The shared dossier bar places previous/next ENTITY arrows right beside Overview',()=>{
 const a=js.indexOf('const tabbar=(isTrack||isFarm||isPerson||isHorse)');
 const b=js.indexOf('\n const factsBlock=',a);
 assert.ok(a>0&&b>a);
 const markup=js.slice(a,b);
 const overview=markup.indexOf('data-ng="detailtab" data-val="Overview"');
 const pager=markup.indexOf('class="ng-profile-entity-pager"');
 const history=markup.indexOf('data-ng="detailtab" data-val="History"');
 const deeper=markup.indexOf('data-ng-select="profile-record"');
 assert.ok(overview>=0&&pager>overview&&history>pager&&deeper>history);
 assert.equal((markup.match(/data-ng="dossier-entity-step"/g)||[]).length,2);
 assert.match(markup,/Previous and next \${safe\(adjacent\.family\)} records/);
 assert.match(markup,/Previous '\+adjacent\.family\+': '/);
 assert.match(markup,/Next '\+adjacent\.family\+': '/);
 assert.match(markup,/dossierPrev\?'':'disabled'/);
 assert.match(markup,/dossierNext\?'':'disabled'/);
 assert.doesNotMatch(markup,/data-ng="profile-step"/);
 assert.doesNotMatch(js,/dossierPageIndex|APP\.detailTab=pages\[/);
});

test('Track arrows navigate tracks, trainer arrows trainers, jockey arrows jockeys, and horse arrows horses',()=>{
 const members=[
  entry('track','T-001','Aqueduct',''),
  entry('track','T-002','Belmont Park',''),
  entry('track','T-003','Saratoga',''),
  entry('person','P-001','Darren','TRAINER'),
  entry('person','P-002','Adrian','TRAINER'),
  entry('person','P-003','Jana','JOCKEY'),
  entry('person','P-004','Morgan','JOCKEY'),
  entry('horse','H-002','Second Horse',''),
  entry('horse','H-001','First Horse','')
 ];
 const tr=helpers.adjacent(members[1],members);
 assert.equal(tr.previous.canonicalId,'T-001');
 assert.equal(tr.next.canonicalId,'T-003');
 const trainer=helpers.adjacent(members[3],members);
 assert.equal(trainer.previous.canonicalId,'P-002');
 assert.equal(trainer.next.canonicalId,'P-002');
 assert.equal(helpers.category(trainer.next),'trainer');
 const jockey=helpers.adjacent(members[5],members);
 assert.equal(jockey.next.canonicalId,'P-004');
 const horse=helpers.adjacent(members[7],members);
 assert.equal(horse.next.canonicalId,'H-001');
 const wrap=helpers.adjacent(members[0],members);
 assert.equal(wrap.previous.canonicalId,'T-003','Alpha-first track Previous wraps to final track');
 const before=JSON.stringify(members);
 helpers.adjacent(members[0],members);
 assert.equal(JSON.stringify(members),before,'Navigation is read-only; must not reorder source data');
});

test('Facilities, owners, racing stables and breeders never mix categories',()=>{
 const values=[
  entry('farm','O-001','Alderwick International Stud','INTERNATIONAL STUD'),
  entry('farm','O-002','Bellwether Stud','STALLION / BREEDING OPERATION'),
  entry('farm','O-003','Argosy Bloodstock','BLOODSTOCK AGENCY'),
  entry('farm','O-004','Argosy Racing Partners','OWNERSHIP / INVESTMENT PARTNERSHIP'),
  entry('farm','O-005','Colony Racing','RACING STABLE'),
  entry('farm','O-006','Monarch Racing','RACING STABLE'),
  entry('person','P-007','Emily','RACING OWNER'),
  entry('person','P-008','Arthur','BREEDER / FARM PRINCIPAL'),
  entry('person','P-009','Jeremy','BREEDER')
 ];
 assert.equal(helpers.category(values[0]),'facility');
 assert.equal(helpers.category(values[1]),'facility');
 assert.equal(helpers.category(values[2]),'owner');
 assert.equal(helpers.category(values[3]),'owner');
 assert.equal(helpers.category(values[4]),'racing stable');
 assert.equal(helpers.category(values[6]),'owner');
 assert.equal(helpers.category(values[7]),'breeder');
 assert.equal(helpers.adjacent(values[0],values).next.canonicalId,'O-002');
 assert.equal(helpers.adjacent(values[2],values).next.canonicalId,'O-004');
 assert.equal(helpers.adjacent(values[4],values).next.canonicalId,'O-006');
 assert.equal(helpers.adjacent(values[7],values).next.canonicalId,'P-009');
});

test('Missing or singleton peer rosters disable the arrows rather than switching to a different type',()=>{
 const only=entry('person','P-Z','Only Trainer','TRAINER');
 const other=entry('person','P-Y','Only Jockey','JOCKEY');
 const result=helpers.adjacent(only,[only,other]);
 assert.equal(result.family,'trainer');
 assert.equal(result.previous,null);
 assert.equal(result.next,null);
 assert.equal(helpers.adjacent(only,[]).previous,null);
});

test('Clicking pager opens the actual adjacent world/Office entity, never APP.detailTab or browser history',()=>{
 const handlerStart=js.indexOf("if(key==='dossier-entity-step')");
 const handler=js.slice(handlerStart,js.indexOf("if(key==='detailtab')",handlerStart));
 assert.ok(handlerStart>0);
 assert.match(handler,/dossierOpenAdjacent\(Number\(val\),currentRoute\(\)\)/);
 assert.doesNotMatch(handler,/APP\.detailTab|window\.history\.back|history\.forward|ADVANCE_DAY/);
 const navStart=js.indexOf('function dossierOpenAdjacent(');
 const nav=js.slice(navStart,js.indexOf('\nfunction openWorld1999Entity(',navStart));
 assert.match(nav,/dossierNavigationContext\(route\)/);
 assert.match(nav,/openFounding1999Profile\(kind,next\.canonicalId\)/);
 assert.match(nav,/openWorld1999Entity\(next\.worldKey\)/);
 assert.match(nav,/__wtwOfficeOpenSearchRecord/);
 assert.doesNotMatch(nav,/window\.history\.(?:back|forward)|ADVANCE_DAY/);
});

test('No obsolete section-stepping selectors or operating instructions survive',()=>{
 assert.match(css,/\.ng-person-dossieractions \.ng-profile-entity-pager\{/);
 assert.match(css,/button\.ng-profile-entity-step:focus-visible/);
 assert.match(css,/button\.ng-profile-entity-step:disabled/);
 assert.doesNotMatch(css,/\.ng-profile-stepper|button\.ng-profile-step(?:\{|:)/);
 assert.doesNotMatch(js,/data-ng="profile-step"|class="ng-profile-stepper"/);
 assert.match(standard,/arrows immediately beside OVERVIEW advance to a different entity/);
 assert.match(standard,/trainer.*trainer/i);
 assert.match(standard,/jockeys stay with jockeys/i);
 assert.doesNotMatch(standard,/The arrows cycle through the one existing canonical section list/);
});

test('Chromium acceptance checks source ID changes and same-type role grouping',()=>{
 for(const family of ['TRACK','TRAINER','JOCKEY','OWNER','FACILITY','HORSE'])
  assert.ok(browser.includes("family:'"+family+"'"),family+' real-browser test missing');
 assert.match(browser,/dossier-entity-step/);
 assert.match(browser,/arrowNext\.sourceRecord/);
 assert.match(browser,/arrowNext\.name/);
 assert.match(browser,/sourceRecord,original\.sourceRecord/);
 assert.match(browser,/baseline\.date/);
});
