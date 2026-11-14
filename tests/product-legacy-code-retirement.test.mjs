import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const exists=p=>existsSync(new URL('../'+p,import.meta.url));
const js=read('public/next/next.js');
const css=read('public/next/next.css');
const html=read('public/next/index.html');
const policy=read('docs/engineering/PRODUCT_WIDE_RELEASE_CONTRACT.md');
const ledger=read('docs/engineering/WTW_DEAD_CODE_RETIREMENT_LEDGER.md');
const standard=read('docs/design/WTW_UNIFIED_SCREEN_INTERACTION_LOCK_2026-11-13.md');

test('Previously retired source and legacy CSS cannot be physically restored',()=>{
 const forbiddenFiles=[
  'public/manager/manager.js','public/manager/manager.css',
  'public/office-v30-2.js','public/office-v30-3.js',
  'public/office/office-core.js','public/office/office-nav.js',
  'public/office/office-pager.js','public/office/office-routes.js',
  'public/office/office.css','public/office-v30.css',
  'public/office-compact-v31.css','public/office-visual-system-v38.css',
  'public/next/1999-commercial-career.css',
  'public/next/identity-themes.css',
  'public/next/profile-hero-v2.css'
 ];
 for(const file of forbiddenFiles)assert.equal(exists(file),false,'Retired software file returned: '+file);
 assert.doesNotMatch(js,/\b(?:function|const)\s+(?:officeMenu|menuIcon|depCurrentMeetRows|depTrackRaceRows|pilotHorseConnectionsPanel|pilotHorseLinksFor|profileRecordSection|connectedTableState)\b/,
  'Physically deleted menu, demo renderer or profile overlay returned');
 assert.doesNotMatch(js,/ng-connected-profile|ng-connected-drop|ng-connected-table/);
 assert.doesNotMatch(css,/\.ng-connected-profile|\.ng-connected-drop|\.ng-connected-table/);
});

test('The old Office remains only a live hidden gameplay compatibility bridge, never an alternate screen',()=>{
 const loaded=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
 const required=['/office-v30-1.js','/office-v30-4.js','/office-fm-v32.js',
  '/office-fm-v34.js','/office-fm-v35.js','/office-fm-v36.js','/office-fm-v37.js'];
 for(const path of required){
  assert.ok(loaded.includes(path),'Deleting a live compatibility module needs verified parity first: '+path);
  assert.ok(exists('public'+path),'Loaded gameplay dependency missing: '+path);
 }
 assert.match(html,/<body class="wtw-next-active">/);
 assert.match(html,/data-wtw-layout="legacy-data-bridge" aria-hidden="true" hidden/);
 assert.match(js,/root\.id='wtwNextgen'/);
 assert.equal((js.match(/function profileDetail\(/g)||[]).length,1);
 assert.equal((js.match(/function restored1999Profile\(/g)||[]).length,1);
});

test('Every window must delete superseded implementations, track live compatibility and keep the governing UI standard current',()=>{
 assert.match(policy,/Mandatory physical removal of superseded code/);
 assert.match(policy,/same verified PR/);
 assert.match(policy,/Physically delete/i);
 assert.match(policy,/save compatibility/i);
 assert.match(ledger,/Live transitional dependencies/);
 assert.match(ledger,/officeMenu/);
 assert.match(standard,/physically retired/i);
 assert.doesNotMatch(standard,/^- Shared connected-record controls:/m,
  'Do not instruct UI windows to restore retired connected-table infrastructure');
 const template=read('.github/pull_request_template.md');
 assert.match(template,/obsolete implementation/i);
 assert.match(template,/screenshots/i);
 assert.match(template,/save\/load/i);
});
