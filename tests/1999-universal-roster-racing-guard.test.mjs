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

test('1999 track registry and active calendars enforce the U.S./Canada/Cuba boundary',()=>{
 const generator=read('public/1999/engine/full-world-generator.mjs');
 const api=read('public/1999/engine/local-api.mjs');
 assert.match(generator,/const sourceTracks=canon\.tracks\.filter\(t=>trackProgram1999\(t\.id\)\?\.trackOperating==='OPEN_1999'\)/);
 assert.match(generator,/nonPlayableInternationalTracks:canon\.tracks\.length-trackCount/);
 assert.match(api,/canon\.tracks\.filter\(t=>activeIds\.has\(t\.id\)\)/);
 assert.match(api,/w\.sourceStakes/);
 assert.match(ui,/\.filter\(t=>availableIds\.has\(t\.id\)\|\|availableNames\.has\(t\.name\)\)/);
 assert.match(source,/activeTrackNames\.has\(r\.trackName\)/);
});

test('breeder IDs, homebred identity and foaling farm survive the 1999 UI adapters',()=>{
 const generator=read('public/1999/engine/full-world-generator.mjs');
 assert.match(generator,/breederId:breederOwner\.id,breeder:breederOwner\.name/);
 assert.match(generator,/homebred,breederRelationship:homebred\?'OWNER_BRED':'OTHER_BREEDER'/);
 assert.match(generator,/foalingFarm\.location\.city/);
 assert.match(source,/breederId:h\.breederId/);
 assert.match(source,/foalingFarmProfile/);
 assert.match(profiles,/node\.dataset\.breederId/);
 assert.match(profiles,/Breeding relationship/);
 assert.match(ui,/if\(key==='1999-breeder'\)/);
 assert.match(ui,/if\(key==='1999-foaling-farm'\)/);
});
