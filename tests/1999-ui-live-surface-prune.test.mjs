import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const get=path=>readFileSync(resolve(root,path),'utf8');
const js=get('public/next/next.js'),css=get('public/next/next.css'),html=get('public/next/index.html');

test('every loaded Office/FM script still exists; UI never creates a shadow page or missing dependency',()=>{
 const scripts=[...html.matchAll(/<script[^>]+src="(\/[^"]+)"/g)].map(x=>x[1].split('?')[0]);
 assert.ok(scripts.length>=12);
 assert.equal(scripts.length,new Set(scripts).size,'Do not load duplicate JS assets under different cache names');
 for(const src of scripts)assert.ok(existsSync(resolve(root,'public'+src)),src+' is a live script and may not be deleted');
 assert.ok(scripts.includes('/next/1999-restored-profiles.js'),'Single detailed horse/person dossier adapter retained');
 assert.ok(scripts.includes('/next/1999-ui-source.mjs'),'Actual opening-world source adapter retained');
 assert.ok(scripts.includes('/office-v30-4.js'),'Legacy Office dependency remains until engine hands over authority');
});

test('previous fake racing screens and uncalled prototype page functions are removed',()=>{
 assert.doesNotMatch(js,/function depTrackRaceRows\(/);
 assert.doesNotMatch(js,/function depCurrentMeetRows\(/);
 assert.doesNotMatch(js,/function menuIcon\(/);
 assert.doesNotMatch(js,/Preview Race ['"]\s*\+/);
 assert.doesNotMatch(js,/DEMO CARD['"]/);
 assert.match(js,/function profileDetail\(route,sourceOverride=null\)/);
 assert.match(js,/if\(kind==='horse'\|\|kind==='person'\|\|kind==='track'\)return restored1999Profile/);
});

test('retired page styles are gone while approved FM attributes and rosters remain',()=>{
 for(const selector of ['.ng-brand{','.ng-athlete-group-heading{','.ng-stable-workspace{',
  '.ng-search-results{','.ng-person-career-top{','.ng-horse-careercard{']){
  assert.ok(!css.includes(selector),'Unused stylesheet block reintroduced: '+selector);
 }
 for(const essential of ['.ng-horse-rating-row','.ng-person-attribute','.ng-horse-dossier',
  '.ng-person-workspace','.ng-dept-roster','.ng-profile-view','.ng-racing-day-summary']){
  assert.ok(css.includes(essential),'Live screen styling must remain: '+essential);
 }
 // The former career, entity-theme, and hero CSS are now physically folded
 // into this one file. Compare against the complete former FOUR-file budget,
 // not the old next.css-only byte limit.
 assert.ok(Buffer.byteLength(css,'utf8')<315000,'Consolidated design CSS unexpectedly exceeds the former combined budget');
 for(const source of ['1999-commercial-career.css','identity-themes.css','profile-hero-v2.css'])
  assert.ok(css.includes('BEGIN folded source: public/next/'+source),'Approved UI declarations must stay in the one live stylesheet');
});

test('one detailed attribute dossier remains reachable from Stable, Personnel and the World directory',()=>{
 const profile=js.slice(js.indexOf('function world1999Profile(){'),js.indexOf('function world1999Linked('));
 assert.match(profile,/if\(kind==='horse'\|\|kind==='person'\|\|kind==='track'\)return restored1999Profile/);
 assert.match(profile,/const display='ORGANIZATION'/);
 assert.doesNotMatch(profile,/add\('HORSE ID'/);
 assert.match(js,/if\(kind==='person'\)return restored1999Profile\('person'/);
 assert.match(js,/if\(kind==='horse'\)return restored1999Profile\('horse'/);
 assert.match(js,/const athleteOverview=\(\)=>/);
 assert.match(js,/const personWork=\(\)=>/);
});
