import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const js=read('../public/next/next.js');
const css=read('../public/next/next.css');
const html=read('../public/next/index.html');
const dept=js.slice(js.indexOf('function departmentRoster('),js.indexOf('\nfunction managerDashboard(){'));
const profile=js.slice(js.indexOf('function profileDetail('),js.indexOf('\nfunction calendarTimeline('));
test('every department menu uses exactly one uniform roster with full/quick toggles and same sort/filter/search',()=>{
 for(const section of ['Racing','Breeding','Sales','Personnel','Facilities','Finances','World'])
  assert.ok(js.includes(section),section);
 assert.match(dept,/const departmentMode=APP\.departmentModes\[rosterScope\]/);
 assert.match(dept,/rosterDensityControls\('department',departmentMode\)/);
 assert.match(js,/function rosterDensityControls\(scope,activeMode\)/);
 assert.match(js,/data-ng="'\+action\+'" data-val="'\+value/);
 assert.match(dept,/data-ng="dept-sort"/);
 assert.match(dept,/data-ng-input="department-search"/);
 assert.match(dept,/WTW1999RosterFilters\?\.render\(specs,rosterFilter/);
 assert.match(dept,/class="ng-rs-table ng-dpt-table '\+\(departmentMode==='compact'/);
 assert.match(js,/if\(key==='dept-mode'\)/);
 assert.match(css,/\.ng-rs-table\.compact th\.ng-dpt-optional/);
 assert.match(css,/\.ng-rs-table\.compact td\.ng-dpt-optional/);
});
test('all real track profiles retain the one approved full stakes and two-column stadium layout',()=>{
 assert.match(profile,/const stakesTable=\(limit=100\)=>\{/);
 assert.match(profile,/ng-stakes-table/);
 assert.match(profile,/ng-stakes-head/);
 assert.match(profile,/ng-stakes-trophy/);
 assert.match(profile,/data-ng="stake-sort"/);
 assert.match(profile,/data-ng="1999-stake"/);
 assert.match(profile,/\$\{stakesTable\(100\)\}/);
 assert.match(profile,/ng-track-workspace/);
 assert.match(profile,/MEET & CONDITIONS/);
 assert.match(profile,/trackHistoryPanel\(\)/);
 assert.doesNotMatch(profile,/profileRecordSection|pilotHorseConnectionsPanel|ng-connected/);
 assert.doesNotMatch(css,/ng-connected-profile|ng-connected-drop/);
 assert.match(css,/\.ng-track-stakes \.ng-stakes-table\{[^}]*overflow-y:auto/);
});

test('web app loads fresh bundled CSS and JavaScript rather than stale browser cache',()=>{
 assert.match(html,/\/next\/next\.js\?rev=wtw1999-whitcombe-argosy-approved-20261115/);
 assert.match(html,/\/next\/next\.css\?rev=wtw-logo-pixel-depth-20261115/);
 assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1,'One authoritative management CSS');
});
