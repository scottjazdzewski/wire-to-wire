import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ui=read('public/next/next.js');
const css=read('public/next/next.css');
const site=read('public/next/index.html');
const source=read('public/next/1999-ui-source.mjs');
const profiles=read('public/next/1999-restored-profiles.js');

test('1999 Racing menu and calendar never depend on the old Office demo route',()=>{
 assert.match(ui,/if\(section==='Racing'\)return openCustomView\('Racing — Overview','Racing','Overview'\)/);
 assert.match(ui,/if\(s==='Racing'\)return openCustomView\('Racing — '\+name,'Racing',name\)/);
 assert.match(ui,/if\(name==='Calendar'\)return openMenu\('Racing'\)/);
 assert.doesNotMatch(ui,/if\(s==='Racing'&&name==='Overview'\).*bridgeNode/);
});

test('all department rosters scroll indefinitely and preserve sorting',()=>{
 assert.match(ui,/\.ng-dept-roster \.ng-rs-scroll/);
 assert.match(ui,/APP\.departmentScrollLimit=Math\.min\(total,APP\.departmentScrollLimit\+160\)/);
 assert.match(ui,/data-ng="dept-sort"/);
 assert.doesNotMatch(ui,/data-ng="dept-page"/);
 assert.match(ui,/virtualData\.push\(/);
 assert.match(css,/#wtwNextgen \.ng-stable-roster-v2 \.ng-rs-scroll\{/);
 assert.match(css,/#wtwNextgen \.ng-stable-roster-v2 \.ng-rs-table thead\{/);
});

test('1999 horse opening remains source-backed and survives refresh',()=>{
 assert.match(ui,/stableHorsePreview\?\.\(name\)/);
 assert.match(ui,/ng-horse-biography/);
 assert.match(ui,/horseFoalingDisplay/);
 assert.match(profiles,/SIMULATED_1999_TEST_BIRTHPLACE/);
 assert.match(source,/dateOfBirth:h\.dateOfBirth/);
});

test('a single cache-fresh approved UI shell loads the race and profile adapters',()=>{
 assert.match(site,/1999-restored-profiles\.js\?rev=/);
 assert.match(site,/1999-race-conditions\.js\?rev=/);
 assert.match(site,/next\.js\?rev=/);
});
