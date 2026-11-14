import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const js=read('public/next/next.js');
const css=read('public/next/next.css');
const html=read('public/next/index.html');
const profile=read('public/next/profile-hero-v2.mjs');
const profileCSS=read('public/next/profile-hero-v2.css');
const themes=read('public/next/identity-themes.mjs');
const audit=read('scripts/desktop-visual-audit.sh');
const standard=read('docs/design/WTW_UNIFIED_SCREEN_INTERACTION_LOCK_2026-11-13.md');
const count=(s,pattern)=>(s.match(pattern)||[]).length;

test('one shared management shell, route entry and department navigation remain authoritative',()=>{
 assert.equal(count(js,/function renderRoute\(\)/g),1,'Never build a second page renderer');
 assert.equal(count(js,/function openMenu\(section\)/g),1,'Global department navigation must be shared');
 assert.equal(count(js,/function pageTab\(name\)/g),1,'Department tab navigation must be shared');
 assert.equal(count(js,/ng-game-rail/g)>=1,true,'Persistent department rail must remain');
 assert.equal(count(js,/ng-global/g)>=1,true,'Game top bar must remain');
 assert.equal(count(js,/ng-manager-stage/g)>=1,true,'One common game stage must remain');
 assert.match(profileCSS,/#wtwNextgen > \.ng-subbar\{display:none!important/,'Redundant top horizontal department strip must stay hidden');
});

test('horse, people, track, stable and farm profiles share one renderer family',()=>{
 assert.equal(count(js,/function profileDetail\(/g),1,'No copied entity profile implementations');
 assert.equal(count(js,/function restored1999Profile\(/g),1,'All canonical records use one restored-profile adapter');
 assert.match(js,/return x\?profileDetail\(x\.route,x\.node\):null/);
 assert.match(js,/if\(kind==='horse'\|\|kind==='person'\|\|kind==='track'\)return restored1999Profile/);
 assert.match(js,/return restored1999Profile\(kind==='person'\?'person':'farm'/);
 assert.match(js,/ng-profile-intro/,'Shared identity row must stay');
 assert.match(js,/ng-profile-identity/,'Shared name and metadata area must stay');
 assert.match(js,/ng-person-dossierbar/,'Horse and people retain local dossier controls');
 assert.match(js,/ng-profiletabs/,'Track and farm retain their local profile records');
 assert.match(js,/data-ng="detailtab"/,'Local sections must remain real navigation actions');
 assert.match(profile,/polishDossierContext\(root\)/,'Dossier header names must not regress to raw routes');
 assert.match(profile,/ensureHeroStage\(profile,kind,name\)/,'Track and farm use one hero stage');
});

test('all profile record lists keep the same sorting/filtering/quick view behavior',()=>{
 assert.equal(count(js,/function connectedTableState\(/g),1);
 assert.equal(count(js,/function profileRecordSection\(/g),1);
 for(const handler of ['connected-sort','connected-search','connected-column',
   'connected-contains','connected-clear','connected-mode']){
  assert.ok(js.includes(handler),handler+' must remain a shared profile-control action');
 }
 for(const section of ['MEETS','STAKES RACES','TRAINERS & BARNS',
  'HORSES CURRENTLY ON SITE','TRAINER ATTRIBUTES','OWNED HORSES']){
  assert.ok(js.includes("profileRecordSection('"+section+"'"),section+' must reuse the same renderer');
 }
 assert.match(js,/aria-sort=/,'Sort state must be communicated consistently');
});

test('entity colors and logos can change, but never create another navigation implementation',()=>{
 assert.match(themes,/paletteFor\(/,'Entity-specific palettes remain presentation-only');
 assert.match(profile,/heroCandidate\(/,'Entity hero marks follow canonical IDs');
 assert.match(profile,/visibleAlphaBounds\(/,'Transparent master logos retain visual fitting');
 assert.match(profileCSS,/grid-template-areas:"badge identity mark" "badge tools mark"/,
  'Track/farm name, controls and logo occupy protected separate grid slots');
 assert.match(profileCSS,/ng-tier1-biography strong/,'Full identity facts remain visible');
 assert.match(profileCSS,/white-space:normal!important/,'Content must wrap instead of vanish');
 assert.match(standard,/status semantics/,'Semantically meaningful status colors must be protected');
});

test('do not add page-specific CSS layers or new style patch stacks',()=>{
 const assets=[...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)]
  .map(m=>m[1].split('?')[0]);
 const allowed=[
  '/next/next.css',
  '/next/1999-commercial-career.css',
  '/next/identity-themes.css',
  '/next/profile-hero-v2.css'
 ];
 assert.deepEqual(assets,allowed,'Unexpected stylesheet: consolidate shared rules instead of adding a fifth override');
 assert.equal(new Set(assets).size,assets.length);
 for(const asset of assets)assert.ok(existsSync(new URL('../public'+asset,import.meta.url)),asset);
 assert.ok(!/\.ng-profile-track-\d+/.test(profileCSS),'Never style individual tracks as bespoke pages');
 assert.match(standard,/technical debt/,'Existing transitional layers must not become the new design authority');
});

test('a screenshot smoke test does not mean FM/OOTP visual approval',()=>{
 for(const view of ['racing-office','global-search','horse-profile','people-profile',
  'founder-owner','founder-facility','personnel','facilities','finances','breeding']){
  assert.ok(audit.includes('capture '+view+' '),'Visual route missing: '+view);
 }
 assert.match(standard,/mark \*\*REJECTED\*\*/,'Weak interfaces must be explicitly rejected');
 assert.match(standard,/A \*\*person\*\* compares screenshots/,'Visual acceptance needs an actual reviewer');
 assert.match(standard,/No CSS patch stacks|No CSS patch stack|do not add a fifth/i);
});
