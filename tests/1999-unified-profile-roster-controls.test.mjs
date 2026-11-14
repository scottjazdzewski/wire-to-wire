import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const js=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/next/next.css',import.meta.url),'utf8');
const section=js.slice(js.indexOf('function connectedTableState('),js.indexOf('function pilotHorseConnectionsPanel('));
test('all profile dropdown records share one sorting, search, column filter and quick view renderer',()=>{
 assert.match(section,/function connectedTableState\(key\)/);
 assert.match(section,/const scope=APP\.custom\|\|APP\.routeId\|\|'Profile'/);
 assert.match(section,/const filtered=items\.filter\(item=>/);
 assert.match(section,/if\(ctrl\.sort\)filtered\.sort\(compare\)/);
 for(const selector of ['connected-sort','connected-search','connected-column','connected-contains','connected-clear','connected-mode'])
  assert.ok(section.includes(selector),selector);
 assert.match(section,/ALL COLUMNS/);
 assert.match(section,/QUICK VIEW/);
 assert.match(section,/aria-sort=/);
 assert.match(section,/role="region" tabindex="0"/);
});
test('sort and filter state are scoped to particular person, owner or track and survive dropdown repaint',()=>{
 assert.match(js,/connectedTables:\{\}/);
 assert.match(js,/if\(!Object\.hasOwn\(ctrl,'initialized'\)\)/);
 assert.match(js,/root\.addEventListener\('toggle'/);
 assert.match(js,/ctrl\.open=target\.open/);
 assert.match(js,/if\(key==='connected-sort'\)/);
 assert.match(js,/if\(key==='connected-clear'\)/);
 assert.match(js,/if\(key==='connected-mode'\)/);
 assert.match(js,/select\[data-ng-select="connected-column"\]/);
 assert.match(js,/input\[data-ng-input="connected-search"\]/);
 assert.match(js,/input\[data-ng-input="connected-search"\], input\[data-ng-input="connected-contains"\]/);
});
test('all track, trainer, and owner panels still call the same dropdown renderer, no separate table design',()=>{
 for(const label of ['MEETS','STAKES RACES','TRAINERS & BARNS','HORSES CURRENTLY ON SITE',
  'TRAINER ATTRIBUTES','BARNS & FACILITIES','HORSES IN TRAINING','UPCOMING ENTRIES','RACE RESULTS','OWNED HORSES'])
  assert.ok(js.includes("profileRecordSection('"+label+"'"),label);
 assert.match(css,/#wtwNextgen \.ng-connected-tools/);
 assert.match(css,/#wtwNextgen \.ng-connected-scroll/);
 assert.match(css,/overflow:auto!important/);
 assert.match(css,/\.ng-connected-table\.compact \.ng-connected-optional/);
 assert.match(css,/font-size:var\(--wtw-roster-head/);
});
