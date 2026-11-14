import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ui=read('public/next/next.js');
const css=read('public/next/next.css');
const visualAudit=read('scripts/desktop-visual-audit.sh');
const fnStart=ui.indexOf('function rosterDensityControls(');
const fnEnd=ui.indexOf('\nfunction liveStableRosterView(',fnStart);
assert.ok(fnStart>0&&fnEnd>fnStart,'The canonical shared roster mode renderer must exist');
const render=new Function(ui.slice(fnStart,fnEnd)+'\nreturn rosterDensityControls;')();

test('Stable, World Horse and Racing share the exact roster density control pattern',()=>{
 for(const [scope,action] of [['stable','stable-mode'],['directory','directory-mode'],['department','dept-mode']]){
  const full=render(scope,'all'),quick=render(scope,'compact');
  for(const out of [full,quick]){
   assert.match(out,/class="ng-rs-mode(?: ng-dept-view)?"/);
   assert.match(out,/role="group" aria-label="Roster column display"/);
   assert.equal((out.match(/<button type="button"/g)||[]).length,2);
   assert.deepEqual([...out.matchAll(/data-val="(all|compact)"/g)].map(x=>x[1]),['all','compact']);
   assert.ok(out.includes('data-ng="'+action+'"'));
   assert.ok(out.indexOf('ALL COLUMNS')<out.indexOf('QUICK VIEW'));
  }
  assert.match(full,/data-val="all" class="on" aria-pressed="true"/);
  assert.match(full,/data-val="compact" class="" aria-pressed="false"/);
  assert.match(quick,/data-val="all" class="" aria-pressed="false"/);
  assert.match(quick,/data-val="compact" class="on" aria-pressed="true"/);
 }
 assert.match(render('department','all'),/ng-rs-mode ng-dept-view/);
 assert.doesNotMatch(render('stable','all'),/ng-dept-view/);
 assert.doesNotMatch(render('directory','all'),/ng-dept-view/);
});

test('Racing department and Stable/World horse rosters use the same actual control renderer',()=>{
 const stable=ui.slice(ui.indexOf('function liveStableRosterView('),ui.indexOf('\nfunction functionalRoute('));
 const department=ui.slice(ui.indexOf('function departmentRoster('),ui.indexOf('\nfunction managerDashboard('));
 assert.match(stable,/rosterDensityControls\(directory\?'directory':'stable',mode\)/);
 assert.match(department,/rosterDensityControls\('department',departmentMode\)/);
 for(const fragment of [stable,department]){
  assert.doesNotMatch(fragment,/<div class="ng-rs-mode(?: ng-dept-view)?"><button/,
   'No family may reintroduce its own second density switch markup');
  assert.match(fragment,/class="ng-rs-tools"/);
  assert.match(fragment,/class="ng-rs-table/);
  assert.match(fragment,/class="ng-rs-scroll" tabindex="0" role="region"/);
 }
});

test('empty Stable roster is not misrepresented as a search or filtering failure',()=>{
 const stable=ui.slice(ui.indexOf('function liveStableRosterView('),ui.indexOf('\nfunction functionalRoute('));
 assert.match(stable,/const emptyRosterMessage=!all.length\?/);
 assert.match(stable,/No horses are currently listed for this stable/);
 assert.match(stable,/No horses match the current search or filters/);
 assert.match(stable,/safe\(emptyRosterMessage\)/);
 assert.doesNotMatch(stable,/No horses match these filters\./);
});

test('Horse, Person, Track and Farm share real tab states and honest record context',()=>{
 const start=ui.indexOf('const tabbar=(isTrack||isFarm||isPerson||isHorse)');
 const end=ui.indexOf('const factsBlock=',start);
 assert.ok(start>=0&&end>start);
 const nav=ui.slice(start,end);
 assert.match(nav,/ng-person-dossierbar ng-management-dossierbar/);
 assert.match(nav,/safe\(APP\.detailTab\.toUpperCase\(\)\)/);
 assert.doesNotMatch(nav,/ONE-SCREEN OVERVIEW/);
 assert.match(nav,/data-val="Overview" class="[^"]*" aria-current=/);
 assert.match(nav,/data-val="History" class="[^"]*" aria-current=/);
 assert.match(nav,/data-ng-select="profile-record"/);
 assert.match(nav,/MORE RECORDS/);
 assert.match(nav,/type="button"/);
});

test('shared compact roster and dossier controls display keyboard focus without another CSS layer',()=>{
 for(const selector of [
  '.ng-rs-tools button:focus-visible',
  '.ng-rs-tools select:focus-visible',
  '.ng-person-dossieractions button:focus-visible',
  '.ng-person-dossieractions select:focus-visible'
 ])assert.ok(css.includes(selector),selector+' missing');
 assert.match(css,/outline:2px solid #ecd99f!important/);
 assert.equal((ui.match(/function rosterDensityControls\(/g)||[]).length,1);
});


test('desktop visual release audit captures actual Stable and Racing rosters, not only profiles',()=>{
 assert.match(visualAudit,/capture stable-roster .*ng-stable-roster-v2/);
 assert.match(visualAudit,/capture racing-roster .*ng-dept-roster/);
 for(const view of ['stable-roster','racing-roster','laptop-stable-roster','laptop-racing-roster']){
  assert.ok(visualAudit.includes('probe '+view+' '),'Missing direct rendering geometry probe: '+view);
 }
 assert.match(visualAudit,/ROSTER PARITY/);
 assert.match(visualAudit,/sum\(b\['active'\] and b\['pressed'\]=='true'/);
});
