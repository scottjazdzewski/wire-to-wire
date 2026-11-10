import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const get=p=>fs.readFileSync(path.join(root,p),'utf8');
const approved={
  "achievements": "6b3f52a45cee26f28dc55b69495e4714add085f2",
  "career_record": "1b9aab87f290d0c44b55af32d172eca72fd0d174",
  "connections": "92a0d4d0b2b9216ed1b70d49a3f2948c86cca926",
  "farm_stable": "f6f081da922ce00927740049e698410d76561518",
  "history": "b02aaeee7460fc3d55f39feb6e6722cee3ba9ced",
  "horse": "e56c15eca3a72ec412de6845bab0def9c351f933",
  "major_races": "9333d7100167c6c47e41882f439edd9914c9639c",
  "meet_schedule": "da36c1f3099575a0460adb3d1ba8028550ec0c52",
  "pedigree": "2dbc9c036b8e0c20b9ab5e0e4f9a62911a63280b",
  "people": "a534d62ee042f4a17cb2250cab0657a1f556e379",
  "reputation": "bf281b0a2a32d0e09893e1dbf164778523259e80",
  "track": "7bfafd3e47e52638e9d9fcc7dd2e99ba8a16624a"
};

test('all twelve repaired individually isolated v2 shields retain correct transparent PNG format and verified byte hashes',()=>{
 const base=path.join(root,'public/assets/profile-badges/v2');
 const files=fs.readdirSync(base).filter(x=>x.toLowerCase().endsWith('.png')).sort();
 const names=Object.keys(approved).map(kind=>'wtw_badge_'+kind+'.png').sort();
 assert.deepEqual(files,names,'Unexpected or retired PNGs have been substituted');
 for(const [kind,sha] of Object.entries(approved)){
   const p=path.join(base,'wtw_badge_'+kind+'.png');
   const b=fs.readFileSync(p);
   assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a',kind+' must be PNG');
   assert.equal(b.readUInt32BE(16),512,kind+' approved width');
   assert.equal(b.readUInt32BE(20),512,kind+' approved height');
   assert.equal(b.readUInt8(25),6,kind+' approved PNG has an RGBA channel');
   const gitBlob=crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
   assert.equal(gitBlob,sha,kind+' repaired shield bytes have changed');
 }
});

test('every Office badge uses readable shield viewport, correct source path, and a failure indicator',()=>{
 const html=get('public/index.html'),review=get('public/next/index.html');
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 for(const h of [html,review]){
   const links=[...h.matchAll(/rel="stylesheet" href="([^"]+)"/g)].map(x=>x[1]);
   assert.deepEqual(links,['/next/next.css']);
   assert.ok(h.includes('src="/next/next.js"'));
 }
 assert.ok(js.includes('const approvedBadgeKinds=new Set('));
 for(const kind of Object.keys(approved))assert.ok(js.includes('"'+kind+'"'),'Missing approved badge kind '+kind);
 assert.ok(js.includes("approvedBadgeKinds.has(kind)?kind:'history'"));
 assert.ok(js.includes('class="ng-badge-slot"'));
 assert.ok(js.includes('class="ng-route-badge-slot"'));
 assert.ok(js.includes('root.addEventListener(\'error\''));
 assert.ok(css.includes('.ng-badge-slot>.ng-headicon'));
 assert.ok(css.includes('.ng-route-badge-slot>.ng-routebadge'));
 assert.ok(css.includes('.ng-profile-badgeframe img'));
 assert.ok(css.includes('.wtw-badge-missing>img'));
 assert.ok(!css.includes('@import'));
 for(const legacy of ['horse_profile.png','people_profile.png','farm_profile.png','track_profile.png']){
   assert.ok(!js.includes(legacy),'Retired badge path '+legacy);
 }
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});

test('repaired shield paths are cache-busted and rectangular frames are removed',()=>{const css=get('public/next/next.css'),js=get('public/next/next.js');assert.ok(js.includes('png?shield=20261110'));assert.ok(css.includes('Individually extracted shield assets'));assert.ok(css.includes('.ng-profile-badgeframe{background:transparent!important'));assert.ok(css.includes('.ng-route-badge-slot{width:48px!important'));});
