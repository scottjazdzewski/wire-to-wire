import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const js=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/next/next.css',import.meta.url),'utf8');
const start=js.indexOf('function profileRecordSection(');
const end=js.indexOf('function pilotHorseDetail(',start);
const panel=js.slice(start,end);
test('track records are compact expandable sections using source meet/stakes and exact-ID barn assignments',()=>{
 assert.ok(start>0&&end>start);
 assert.match(panel,/<details class="ng-connected-drop"/);
 assert.match(panel,/profileRecordSection\('MEETS'/);
 assert.match(panel,/profileRecordSection\('STAKES RACES'/);
 assert.match(panel,/profileRecordSection\('TRAINERS & BARNS'/);
 assert.match(panel,/profileRecordSection\('HORSES CURRENTLY ON SITE'/);
 assert.match(panel,/trackProgramById\?\.\(id\)/);
 assert.match(js,/const stakesTable=\(limit=100\)=>\{/);
 assert.match(js,/return profileRecordSection\('STAKES RACES'/);
 assert.equal((panel.match(/profileRecordSection\('STAKES RACES'/g)||[]).length,0,
  'Track pilot panels must not duplicate the main stakes roster');
 assert.match(panel,/sites\.filter\(s=>s\.host_track_id===id\)/);
 assert.match(panel,/pilotHorseLinksFor\(kind,id\)/);
});
test('trainer records have individual attributes, barn, horse, entry and result dropdowns with no invented race outcomes',()=>{
 for(const label of ['TRAINER ATTRIBUTES','BARNS & FACILITIES','HORSES IN TRAINING','UPCOMING ENTRIES','RACE RESULTS'])
  assert.ok(panel.includes("profileRecordSection('"+label+"'"),label);
 assert.match(panel,/data-ng="detailtab" data-val="Attributes"/);
 assert.match(panel,/No confirmed entries have been recorded/);
 assert.match(panel,/No completed race results have been recorded/);
 assert.match(panel,/data-ng="pilot-horse"/);
 assert.match(panel,/data-ng="pilot-connection"/);
});
test('dropdowns use standard profile font tokens and avoid oversize global roster rules',()=>{
 assert.match(css,/#wtwNextgen \.ng-connected-drop>summary/);
 assert.match(css,/font-size:var\(--wtw-ui-profile-tab/);
 assert.match(css,/#wtwNextgen \.ng-connected-table th,#wtwNextgen \.ng-connected-table td/);
 assert.match(css,/font-size:var\(--wtw-ui-list-text/);
 assert.doesNotMatch(panel,/ng-rs-table ng-dpt-table/);
});
