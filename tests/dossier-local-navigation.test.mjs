import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const js=read('public/next/next.js');
const css=read('public/next/next.css');
const browser=read('scripts/1999-full-screen-controls-cdp.mjs');
const standard=read('docs/design/WTW_UNIFIED_SCREEN_INTERACTION_LOCK_2026-11-13.md');
const start=js.indexOf('const tabs=(isHorse?');
const end=js.indexOf(' const factsBlock=',start);
assert.ok(start>0&&end>start);
const controls=js.slice(start,end);

test('one shared dossier toolbar has genuine Previous / Next directly beside Overview for every profile family',()=>{
 assert.match(controls,/const tabbar=\(isTrack\|\|isFarm\|\|isPerson\|\|isHorse\)/);
 assert.match(controls,/data-ng="detailtab" data-val="Overview"/);
 const overview=controls.indexOf('data-ng="detailtab" data-val="Overview"');
 const pager=controls.indexOf('class="ng-profile-stepper"');
 const history=controls.indexOf('data-ng="detailtab" data-val="History"');
 const records=controls.indexOf('data-ng-select="profile-record"');
 assert.ok(overview>0&&overview<pager&&pager<history&&history<records,
  'Toolbar order must be Overview, compact local arrows, History, More Records');
 assert.equal((controls.match(/data-ng="profile-step"/g)||[]).length,2);
 assert.match(controls,/data-val="-1" aria-label="Previous dossier view:/);
 assert.match(controls,/data-val="1" aria-label="Next dossier view:/);
 assert.match(controls,/const dossierPrev=tabs\[\(dossierPageIndex-1\+tabs.length\)%tabs.length\]/);
 assert.match(controls,/const dossierNext=tabs\[\(dossierPageIndex\+1\)%tabs.length\]/);
 assert.match(controls,/\['Overview','Career Record','Pedigree','Achievements','Connections','History'\]/);
 assert.match(controls,/\['Overview','Connected Horses','Operations','Connections','History'\]/);
 assert.match(controls,/\['Overview','Meet Schedule','Major Races','Connections','History'\]/);
});

test('Arrow clicks change the true active dossier tab, cycle existing source sections and never call browser history',()=>{
 const start=js.indexOf("if(key==='profile-step')");
 const end=js.indexOf("if(key==='detailtab')",start);
 assert.ok(start>0&&end>start);
 const handler=js.slice(start,end);
 assert.match(handler,/closest\('\.ng-person-dossierbar'\)/);
 assert.match(handler,/select\[data-ng-select="profile-record"\]/);
 assert.match(handler,/const pages=\['Overview',\.\.\.\[/);
 assert.match(handler,/,'History'\]/);
 assert.match(handler,/APP\.detailTab=pages\[\(\(at<0\?0:at\)\+step\+pages.length\)%pages.length\]/);
 assert.match(handler,/return paint\(\)/);
 assert.doesNotMatch(handler,/history\.back|history\.forward|pushState|ADVANCE_DAY/);
});

test('Pager is compact, visibly interactive, accessible, and style-scoped to the existing shared toolbar',()=>{
 assert.match(css,/\.ng-person-dossieractions \.ng-profile-stepper\{display:inline-flex/);
 assert.match(css,/\.ng-person-dossieractions button\.ng-profile-step\{display:grid/);
 assert.match(css,/\.ng-person-dossieractions button\.ng-profile-step:focus-visible\{outline:/);
 assert.match(controls,/role="group" aria-label="Previous and next dossier views"/);
 assert.match(controls,/title="Previous:/);
 assert.match(controls,/title="Next:/);
 assert.match(standard,/local previous\/next dossier controls/i);
});

test('Chromium checks arrow movement and the approved layout on five real source-linked profile families',()=>{
 for(const family of ['TRACK','PERSON','OWNER','FARM','HORSE'])
  assert.ok(browser.includes("family:'"+family+"'"),family+' audit missing');
 assert.match(browser,/await stepProfile\('1'\)/);
 assert.match(browser,/await stepProfile\('-1'\)/);
 assert.match(browser,/wrap to History/);
 assert.match(browser,/wrap to Overview/);
 assert.match(browser,/arrowNext\.identity,original\.identity/);
 assert.match(browser,/arrowRestored\.date,baseline\.date/);
 assert.match(browser,/restored\.hasStakes&&restored\.hasMeet&&restored\.hasTrackHistory/);
});
