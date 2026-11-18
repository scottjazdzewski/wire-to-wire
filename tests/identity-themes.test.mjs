import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveIdentity,paletteFromImageData} from '../public/next/identity-themes.mjs';

const css=readFileSync(new URL('../public/next/next.css',import.meta.url),'utf8');
const styles=css.split('/* ===== BEGIN folded source: public/next/identity-themes.css ===== */')[1]
 .split('/* ===== END folded source: public/next/identity-themes.css ===== */')[0];
const moduleSource=readFileSync(new URL('../public/next/identity-themes.mjs',import.meta.url),'utf8');
const registry=JSON.parse(readFileSync(new URL('../public/assets/identity/visual-themes-v1.json',import.meta.url),'utf8'));

function artwork(colors){
 const data=new Uint8ClampedArray(colors.length*4);
 colors.forEach(([r,g,b,a=255],i)=>data.set([r,g,b,a],i*4));
 return {width:colors.length,height:1,data};
}
test('track profiles still resolve by immutable ID, without inventing a palette',()=>{
 for(const id of ['T-0001','T-0002','T-0013','T-0017','T-0028','T-0030']){
  assert.deepEqual(resolveIdentity('WorldRecord:'+encodeURIComponent('track:'+id)),{kind:'track',id});
 }
 assert.deepEqual(resolveIdentity('',{kicker:'Track Profile',id:'T-0094'}),{kind:'track',id:'T-0094'});
 assert.equal(resolveIdentity('',{kicker:'Track Profile',id:''}),null);
});
test('ownership, farm and facility profiles all retain exact organization identity',()=>{
 for(const kind of ['ownership','facility']){
  assert.deepEqual(resolveIdentity('FoundingProfile:'+kind+':O-000061'),{kind:'organization',id:'O-000061'});
 }
 assert.deepEqual(resolveIdentity('WorldRecord:farm:O-000062'),{kind:'organization',id:'O-000062'});
});
test('dominant identity swatch comes directly from a visible logo pixel',()=>{
 const data=artwork([
  ...Array.from({length:60},()=>[16,96,58]),
  ...Array.from({length:24},()=>[195,164,60]),
  ...Array.from({length:30},()=>[255,255,255]),
  ...Array.from({length:20},()=>[0,0,0,0])
 ]);
 const p=paletteFromImageData(data);
 assert.equal(p?.base,'#10603A');
 assert.equal(p?.bright,'#C3A43C');
 assert.equal(p?.source,'logo-pixels');
});
test('authentic very dark saturated logo ink is retained instead of becoming neutral',()=>{
 const ink=artwork([
  ...Array.from({length:80},()=>[0,57,41]),
  ...Array.from({length:16},()=>[15,231,28]),
  ...Array.from({length:110},()=>[0,0,0,0])
 ]);
 const chosen=paletteFromImageData(ink);
 assert.equal(chosen?.base,'#003929');
 assert.equal(chosen?.bright,'#0FE71C');
});
test('logos with a white matte, monochrome ink or transparent canvas receive no made-up brand',()=>{
 assert.equal(paletteFromImageData(artwork(Array.from({length:40},()=>[255,255,255]))),null);
 assert.equal(paletteFromImageData(artwork(Array.from({length:40},()=>[0,0,0]))),null);
 assert.equal(paletteFromImageData(artwork(Array.from({length:40},()=>[0,0,0,0]))),null);
 assert.equal(paletteFromImageData({width:3,height:4,data:new Uint8ClampedArray(5)}),null);
});
test('no unknown route, horse, person or unrelated Office view gains a fictitious identity',()=>{
 for(const route of ['','Preview:person:Jane','WorldRecord:horse:H-000001','WorldRecord:track:unknown']){
  assert.equal(resolveIdentity(route),null);
 }
 assert.equal(resolveIdentity('',{kicker:'Horse Profile',id:'T-0002'}),null);
});
test('no manually selected or hashed palettes remain in runtime, manifest or CSS',()=>{
 assert.deepEqual(registry.tracks,{});
 assert.deepEqual(registry.organizations,{});
 assert.match(registry.status,/RETIRED/);
 assert.doesNotMatch(moduleSource,/housePalette|\bSWATCHES\b|paletteFor\(/);
 assert.doesNotMatch(moduleSource,/visual-themes-v1\.json/);
 assert.match(moduleSource,/paletteFromImageData\(ctx\.getImageData/);
 assert.match(moduleSource,/data-wtw-identity-source/);
 assert.match(moduleSource,/logo-pixels/);
});
test('all brand-dependent CSS is gated by a verified logo swatch; semantic warnings are untouched',()=>{
 assert.match(styles,/#wtwNextgen\[data-wtw-identity\]\[data-wtw-logo-theme="ready"\]/);
 assert.match(styles,/--wtw-id-deep:color-mix\(in srgb,var\(--wtw-id-base\)/);
 assert.doesNotMatch(styles,/#wtwNextgen\[data-wtw-identity\] \.ng-global/);
 assert.doesNotMatch(styles,/\.ng-global-continue\s*\{/);
 assert.doesNotMatch(styles,/\.ng-msgtag\.urgent\s*\{/);
});
test('premium depth keeps the existing profile geometry, controls and neutral fallback',()=>{
 const start=styles.indexOf('/* WTW ENTITY ATMOSPHERE v2');
 const end=styles.indexOf('/* Track badge never falls back');
 assert.ok(start>=0&&end>start);
 const own=styles.slice(start,end);
 for(const selector of [
  '.ng-route-profile .ng-profile-intro',
  '.ng-route-profile .ng-profile-tools button',
  '.ng-route-profile .ng-detailcard',
  '.ng-route-profile .ng-track-workspace .ng-track-stakes > header',
  '.ng-route-profile .ng-track-workspace .ng-track-history-card > header',
  '.ng-route-profile .ng-track-stakes .ng-stakes-head',
  '.ng-route-profile .ng-track-stakes .ng-stakes-data:hover'
 ])assert.ok(own.includes(selector),selector);
 assert.doesNotMatch(own,/\.ng-global-continue|\.ng-msgtag\.urgent|\.ng-status-pills|\.ng-injury|\.ng-eligibility/);
 assert.doesNotMatch(own,/grid-template|position\s*:|width\s*:|height\s*:|display\s*:none/);
 assert.match(styles,/WTW PROFILE DEPTH/);
 assert.match(styles,/Neutral layering remains when a logo is missing/);
});
test('replacing a logo source triggers new color extraction after every load',()=>{
 const m=moduleSource.slice(moduleSource.indexOf('function startThemes(){'));
 assert.match(m,/if\(!observed\.has\(img\)\)\{/);
 assert.match(m,/img\.addEventListener\("load",apply\);/);
 assert.match(m,/img\.addEventListener\("error",apply\);/);
 assert.doesNotMatch(m,/img\.addEventListener\("load",apply,\{once:true\}\)/);
 assert.match(m,/new MutationObserver\(apply\)\.observe\(shell/);
 assert.match(m,/attributeFilter:\["data-wtw-identity","src"\]/);
});
test('cache busting uses the original one-stylesheet profile architecture',()=>{
 const page=readFileSync(new URL('../public/next/index.html',import.meta.url),'utf8');
 assert.match(page,/identity-themes\.mjs\?rev=wtw-logo-pixel-depth-20261115/);
 assert.match(page,/next\.css\?rev=wtw-logo-pixel-depth-20261115/);
 assert.equal((page.match(/rel="stylesheet"/g)||[]).length,1);
});
