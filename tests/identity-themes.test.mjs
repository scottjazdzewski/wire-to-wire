import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveIdentity,housePalette,paletteFor} from '../public/next/identity-themes.mjs';

const registry=JSON.parse(readFileSync(new URL('../public/assets/identity/visual-themes-v1.json',import.meta.url),'utf8'));
const styles=readFileSync(new URL('../public/next/next.css',import.meta.url),'utf8').split('/* ===== BEGIN folded source: public/next/identity-themes.css ===== */')[1].split('/* ===== END folded source: public/next/identity-themes.css ===== */')[0];

test('three official-track test pages resolve by stable canonical ID',()=>{
  for(const id of ['T-0002','T-0013','T-0017']){
    assert.deepEqual(resolveIdentity('WorldRecord:'+encodeURIComponent('track:'+id)),{kind:'track',id});
    assert.equal(paletteFor({kind:'track',id},registry).source,'curated');
  }
});
test('existing native Track Profile routes are supported without renaming identities',()=>{
  assert.deepEqual(resolveIdentity('',{kicker:'Track Profile',id:'T-0094'}),{kind:'track',id:'T-0094'});
  assert.equal(resolveIdentity('',{kicker:'Track Profile',id:''}),null);
});
test('ownership and facility pages share one canonical organization palette',()=>{
  for(const kind of ['ownership','facility']){
    assert.deepEqual(resolveIdentity('FoundingProfile:'+kind+':O-000061'),{kind:'organization',id:'O-000061'});
  }
  assert.deepEqual(resolveIdentity('WorldRecord:farm:O-000062'),{kind:'organization',id:'O-000062'});
});
test('uncurated entities get deterministic, accessible dark-house palettes',()=>{
  const ctx={kind:'track',id:'T-0118'};
  assert.deepEqual(housePalette(ctx),housePalette(ctx));
  assert.equal(paletteFor(ctx,registry).source,'wtw-house');
  assert.match(housePalette(ctx).deep,/^#[0-9A-Fa-f]{6}$/);
});
test('no themes leak into unrelated or unknown profile routes',()=>{
  for(const route of ['','Preview:person:Jane','WorldRecord:horse:H-000001','WorldRecord:track:unknown']){
    assert.equal(resolveIdentity(route),null);
  }
  assert.equal(paletteFor({kind:'person',id:'P-00001'},registry),null);
  assert.equal(resolveIdentity('',{kicker:'Horse Profile',id:'T-0002'}),null);
});
test('invalid palette colors cannot inject arbitrary inline CSS',()=>{
  const malicious={tracks:{'T-0002':{deep:'url(javascript:alert(1))',base:'#111111',bright:'#ffffff',highlight:'#eeeeee'}}};
  assert.equal(paletteFor({kind:'track',id:'T-0002'},malicious).source,'wtw-house');
});
test('theme styling stays under the identified UI and does not recolor warnings',()=>{
  assert.match(styles,/#wtwNextgen\[data-wtw-identity\]/);
  assert.doesNotMatch(styles,/\.ng-global-continue\s*\{/);
  assert.doesNotMatch(styles,/\.ng-msgtag\.urgent\s*\{/);
});

test('Aqueduct, Keeneland, Santa Anita and Del Mar have distinct approved-for-UI art-direction palettes',()=>{
 const ids=['T-0001','T-0014','T-0028','T-0030'];
 const choices=ids.map(id=>paletteFor({kind:'track',id},registry));
 assert.ok(choices.every(p=>p?.source==='curated'));
 assert.equal(new Set(choices.map(p=>p.base)).size,ids.length);
 assert.equal(registry.tracks['T-0001'].name,'Aqueduct');
 // These are UI color directions, not a representation of official brand guides.
 assert.match(registry.palette_status,/not verified official/);
});
test('entity visual-depth v2 remains strictly scoped to the current shared profile',()=>{
 const css=readFileSync(new URL('../public/next/next.css',import.meta.url),'utf8');
 const start=css.indexOf('/* WTW ENTITY ATMOSPHERE v2');
 const end=css.indexOf('/* ===== END folded source: public/next/identity-themes.css ===== */',start);
 assert.ok(start>0&&end>start);
 const own=css.slice(start,end);
 assert.match(own,/#wtwNextgen\[data-wtw-identity\] \.ng-route-profile \.ng-profile-intro/);
 assert.match(own,/#wtwNextgen\[data-wtw-identity\] \.ng-route-profile \.ng-profile-tools button/);
 assert.match(own,/#wtwNextgen\[data-wtw-identity\] \.ng-route-profile \.ng-detailcard/);
 assert.match(own,/#wtwNextgen\[data-wtw-identity\] \.ng-route-profile \.ng-person-dossierbar/);
 assert.doesNotMatch(own,/\.ng-global-continue|\.ng-msgtag\.urgent|\.ng-status-pills|\.ng-injury|\.ng-eligibility/);
 assert.doesNotMatch(own,/grid-template|position\s*:|width\s*:|height\s*:|display\s*:none/);
});

test('new themes are cache-busted coherently without a second stylesheet',()=>{
 const page=readFileSync(new URL('../public/next/index.html',import.meta.url),'utf8');
 const module=readFileSync(new URL('../public/next/identity-themes.mjs',import.meta.url),'utf8');
 assert.match(page,/identity-themes\.mjs\?rev=wtw-track-identity-locked-20261114/);
 assert.match(module,/visual-themes-v1\.json\?v=20261114c-track-restore/);
 assert.match(page,/next\.css\?rev=wtw-track-profile-permanent-20261114/);
 assert.equal((page.match(/rel="stylesheet"/g)||[]).length,1);
});

test('approved source-backed stakes table and meet/history panels share the canonical track palette',()=>{
 const css=readFileSync(new URL('../public/next/next.css',import.meta.url),'utf8');
 const start=css.indexOf('/* WTW ENTITY ATMOSPHERE v2');
 const end=css.indexOf('/* ===== END folded source: public/next/identity-themes.css ===== */',start);
 const own=css.slice(start,end);
 for(const selector of [
  '.ng-profile-view.ng-profile-track > .ng-profile-intro',
  '.ng-track-workspace .ng-track-stakes > header',
  '.ng-track-workspace .ng-track-history-card > header',
  '.ng-track-stakes .ng-stakes-head',
  '.ng-track-stakes .ng-stakes-data:hover'
 ])assert.ok(own.includes(selector),selector+' must inherit the canonical palette');
 assert.equal(registry.tracks['T-0002'].base.toUpperCase(),'#0C603C');
 assert.doesNotMatch(own,/ng-connected|\.ng-global-continue|\.ng-msgtag\.urgent|\.ng-status-pills/);
});
