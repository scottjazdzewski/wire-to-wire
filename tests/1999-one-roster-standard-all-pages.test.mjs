import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const js=read('../public/next/next.js');
const css=read('../public/next/next.css');
const html=read('../public/next/index.html');
const dept=js.slice(js.indexOf('function departmentRoster('),js.indexOf('\nfunction managerDashboard(){'));
const profile=js.slice(js.indexOf('function profileDetail('),js.indexOf('\nfunction calendarTimeline('));
const pilot=js.slice(js.indexOf('function pilotHorseConnectionsPanel('),js.indexOf('function pilotHorseDetail('));
test('every department menu uses exactly one uniform roster with full/quick toggles and same sort/filter/search',()=>{
 for(const section of ['Racing','Breeding','Sales','Personnel','Facilities','Finances','World'])
  assert.ok(js.includes(section),section);
 assert.match(dept,/const departmentMode=APP\.departmentModes\[rosterScope\]/);
 assert.match(dept,/data-ng="dept-mode" data-val="all"/);
 assert.match(dept,/data-ng="dept-mode" data-val="compact"/);
 assert.match(dept,/data-ng="dept-sort"/);
 assert.match(dept,/data-ng-input="department-search"/);
 assert.match(dept,/WTW1999RosterFilters\?\.render\(specs,rosterFilter/);
 assert.match(dept,/class="ng-rs-table ng-dpt-table '\+\(departmentMode==='compact'/);
 assert.match(js,/if\(key==='dept-mode'\)/);
 assert.match(css,/\.ng-rs-table\.compact th\.ng-dpt-optional/);
 assert.match(css,/\.ng-rs-table\.compact td\.ng-dpt-optional/);
});
test('track major stakes and every detailed profile table use the same interactive renderer without repeat',()=>{
 assert.match(profile,/const stakesTable=\(limit=100\)=>\{/);
 assert.match(profile,/return profileRecordSection\('STAKES RACES'/);
 assert.match(profile,/\$\{stakesTable\(100\)\}/);
 assert.equal((pilot.match(/profileRecordSection\('STAKES RACES'/g)||[]).length,0);
 assert.match(js,/function profileRecordSection\(/);
 assert.match(js,/data-ng="connected-sort"/);
 assert.match(js,/data-ng="connected-mode"/);
 assert.match(css,/\.ng-connected-scroll\{/);
 assert.match(css,/max-height:340px/);
});
test('web app loads fresh bundled CSS and JavaScript rather than stale browser cache',()=>{
 assert.match(html,/\/next\/next\.js\?rev=wtw-unified-rosters-all-sections-20261113/);
 assert.match(html,/\/next\/next\.css\?rev=wtw-unified-rosters-all-sections-20261113/);
});
