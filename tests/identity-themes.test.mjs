import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveIdentity,housePalette,paletteFor} from '../public/next/identity-themes.mjs';

const registry=JSON.parse(readFileSync(new URL('../public/assets/identity/visual-themes-v1.json',import.meta.url),'utf8'));
const styles=readFileSync(new URL('../public/next/identity-themes.css',import.meta.url),'utf8');

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
