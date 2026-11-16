import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const src=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const css=src('public/next/next.css');
const ui=src('public/next/next.js');
const browser=src('scripts/1999-full-screen-controls-cdp.mjs');
const start=ui.indexOf('const tabmap='),end=ui.indexOf('\nconst actions=',start);
assert.ok(start>=0&&end>start,'Canonical section menu must exist');
const tabmap=vm.runInNewContext(ui.slice(start,end)+'\ntabmap;');

test('all registered menu page titles begin with a capital letter',()=>{
 const pages=Object.entries(tabmap).flatMap(([section,values])=>values.map(page=>({section,page})));
 assert.ok(pages.length>=60,'The canonical page registry was unexpectedly reduced');
 for(const {section,page} of pages){
  const firstLetter=page.match(/[a-z]/i)?.[0];
  assert.ok(!firstLetter||firstLetter===firstLetter.toUpperCase(),
   section+' menu title does not capitalize its first word: '+page);
 }
});

test('the one shared VIEW picker is horizontally aligned in every container',()=>{
 assert.match(ui,/function managerRecordViewControl\(/);
 assert.match(ui,/class="ng-manager-view-picker"/);
 assert.match(css,/#wtwNextgen \.ng-manager-view-picker\{display:inline-flex;align-items:center/);
 assert.match(browser,/VIEW label\/dropdown stacked or mismatched/);
 assert.match(browser,/checkLaptopLayout\(section\+' \/ '\+page\)/);
});

test('Due Actions, Racing File and the owner dashboard cannot inherit a half-width route grid',()=>{
 for(const cls of ['ng-org-overview','ng-due-overview','ng-1999-race-file']){
  assert.ok(css.includes('.ng-routeinner:has(.'+cls+')'),
   cls+' must be explicitly handled as full width');
  assert.ok(browser.includes("selector:'."+cls+"'"),
   cls+' must have an actual browser geometry check');
 }
 assert.match(css,/\.ng-routeinner:has\(\.ng-1999-race-file\)\{display:block/);
 assert.match(browser,/is trapped in a half-width route grid/);
});

test('the permanent UI stays within the single-stylesheet size limit',()=>{
 assert.ok(Buffer.byteLength(css,'utf8')<315000,
  'Single compiled CSS must remain under the approved 315 KB budget');
});
