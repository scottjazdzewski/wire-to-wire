import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ui=read('public/next/next.js');
const css=read('public/next/next.css');
const palettes=JSON.parse(read('public/assets/identity/visual-themes-v1.json'));
const stakes=ui.slice(ui.indexOf('const stakesTable=(limit=100)=>{'),
 ui.indexOf('\n const entityPhotoKind=',ui.indexOf('const stakesTable=(limit=100)=>{')));
const trackStart=ui.indexOf('}else if(isTrack){\n   left=');
const trackOverview=ui.slice(trackStart,ui.indexOf("}else{\n   left=",trackStart));

test('approved track overview is ONE two-column stadium workspace, not a generic expandable record page',()=>{
 assert.ok(trackStart>0,'Must preserve the one approved real 1999 track layout');
 assert.match(trackOverview,/ng-track-workspace/);
 assert.match(trackOverview,/ng-track-stakes/);
 assert.match(trackOverview,/MAJOR RACES & STAKES/);
 assert.match(trackOverview,/ng-track-info-stack/);
 assert.match(trackOverview,/MEET & CONDITIONS/);
 assert.match(trackOverview,/trackConfigMarkup/);
 assert.match(trackOverview,/trackMeetFacts/);
 assert.match(trackOverview,/trackHistoryPanel\(\)/);
 assert.match(trackOverview,/stakesTable\(100\)/);
 assert.doesNotMatch(trackOverview,/ng-connected|profileRecordSection|1999 TEST COHORT/);
 assert.match(css,/\.ng-track-workspace\{display:grid!important;grid-template-columns:minmax\(0,1\.23fr\) minmax\(285px,\.77fr\)/);
 assert.match(css,/\.ng-track-info-stack\{display:grid;grid-template-columns:minmax\(0,1fr\)/);
});

test('full stakes roster is visible by default with sortable columns, race links and tiny real G1/G2/G3 trophies',()=>{
 assert.match(stakes,/ng-stakes-table/);
 assert.match(stakes,/ng-stakes-head/);
 assert.match(stakes,/ng-stakes-data/);
 assert.match(stakes,/data-ng="stake-sort"/);
 assert.match(stakes,/APP\.stakeSortDesc/);
 assert.match(stakes,/data-ng="1999-stake"/);
 assert.match(stakes,/approved-grade-/);
 assert.match(stakes,/ng-stakes-trophy/);
 assert.doesNotMatch(stakes,/<details|profileRecordSection|ng-connected-drop/);
 assert.match(ui,/if\(key==='stake-sort'\)/);
 assert.match(css,/\.ng-track-stakes \.ng-stakes-table\{[^}]*overflow-y:auto/);
});

test('real track brand colors are derived from logo-matched canonical ID and control the actual hero',()=>{
 const belmont=palettes.tracks['T-0002'];
 assert.equal(belmont.name,'Belmont Park');
 assert.equal(belmont.base.toUpperCase(),'#0C603C');
 assert.equal(belmont.highlight.toUpperCase(),'#F0FFF5');
 assert.match(css,/#wtwNextgen\[data-wtw-identity\] \.ng-route-profile \.ng-profile-view\.ng-profile-track > \.ng-profile-intro\{/);
 assert.match(css,/#wtwNextgen\[data-wtw-identity\] \.ng-route-profile \.ng-track-stakes \.ng-stakes-head\{/);
 assert.match(css,/--wtw-id-base/);
 assert.match(css,/\.ng-profile-view\.ng-profile-track:not\(\.ng-profile-farm\) \.ng-profile-badgeframe\{/);
 assert.match(css,/wtw_badge_track\.png/);
 assert.match(css,/\.ng-profile-badgeframe img\{\s*visibility:hidden!important/);
});

test('track presentation preserves action buttons, identity metadata and history independently of its logo',()=>{
 assert.match(ui,/const tabbar=\(isTrack\|\|isFarm\|\|isPerson\|\|isHorse\)/);
 assert.match(ui,/TRACK DOSSIER/);
 assert.match(ui,/aria-current=/);
 assert.match(trackOverview,/trackOfficeContext/);
 assert.match(trackOverview,/trackOperatingNotes/);
 assert.match(css,/grid-template-areas:"badge identity mark" "badge tools mark"/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
