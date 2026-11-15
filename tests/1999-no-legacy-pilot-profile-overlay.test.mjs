import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ui=read('public/next/next.js');
const css=read('public/next/next.css');
const markers=[
 'pilotHorseConnectionsPanel(', 'pilotHorseLinksFor(', 'profileRecordSection(',
 'connectedTableState(', 'APP.connectedTables', 'connectedTables:{}',
 'ng-connected-profile', 'ng-connected-drop', 'ng-connected-tools',
 'ng-connected-table', 'ng-connected-view', 'ng-connected-scroll'
];

test('retired 38-horse pilot overlay and all its duplicate profile controls are physically removed',()=>{
 for(const obsolete of markers){
  assert.equal(ui.includes(obsolete),false,'Forbidden old layout JS resurrected: '+obsolete);
  assert.equal(css.includes(obsolete),false,'Forbidden old layout CSS resurrected: '+obsolete);
 }
 assert.doesNotMatch(ui,/1999 TEST COHORT · NOT LIVE CAREER/);
 assert.doesNotMatch(ui,/RACING OPERATIONS · PROFILE RECORDS/);
});

test('real 1999 track/owner/trainer screens render one dossier and no appended pilot panel',()=>{
 const start=ui.lastIndexOf(' const actions=',ui.indexOf('\nfunction calendarTimeline('));
 const end=ui.indexOf('\nfunction calendarTimeline(',start);
 assert.ok(start>0&&end>start);
 const final=ui.slice(start,end);
 assert.match(final,/ng-profile-view/);
 assert.match(final,/\$\{identity\}\$\{tabbar\}<div class="ng-detail-cols/);
 assert.match(final,/\$\{left\}\$\{right\}\$\{footer\}<\/div>/);
 assert.doesNotMatch(final,/pilotPanel|pilotKind|pilotID|pilotHorseConnectionsPanel/);
});

test('the isolated PilotHorse tester is preserved without appearing on canonical profiles',()=>{
 assert.match(ui,/function loadPilotRelationships\(\)/);
 assert.match(ui,/function pilotHorseDetail\(id\)/);
 assert.match(ui,/APP\.custom\.startsWith\('PilotHorse:'\)/);
 assert.match(ui,/pilotHorseDetail\(decodeURIComponent/);
 assert.match(ui,/if\(key==='pilot-connection'\)/);
 assert.doesNotMatch(ui,/pilotHorseConnectionsPanel|pilotHorseLinksFor/);
});

test('source-backed history, meets and stakes belong to the approved track workspace',()=>{
 const start=ui.indexOf("}else if(isTrack){\n   left=");
 const end=ui.indexOf("}else if(APP.detailTab==='Career Record')",start);
 assert.ok(start>0&&end>start);
 const track=ui.slice(start,end);
 assert.match(track,/ng-track-workspace/);
 assert.match(track,/entityDossierCard/);
 assert.match(ui,/if\(isTrack&&APP\.detailTab==='History'\)\{\s*left=trackHistoryFull\(\)/);
 assert.match(track,/trackMeetFacts/);
 assert.match(track,/stakesTable\(100\)/);
 assert.doesNotMatch(track,/38-horse|TEST COHORT|ng-connected/);
 assert.doesNotMatch(css,/\.ng-profile-view:has\(\.ng-connected-profile\)/);
});
