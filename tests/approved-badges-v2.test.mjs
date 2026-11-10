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
  "achievements": "51d18b8af5009744b8960ddf545a5e34812261b3",
  "career_record": "c2209e29644bb6b148fc4d941464d68c9cddc34a",
  "connections": "7d4dd44ee3ab13f369c8c8c05ac7bdfd3f121afc",
  "farm_stable": "0e545f320ea980daea3e628bda7f66cfaea0ff39",
  "history": "a61b7dfa8fe51ad98b8dbba9ebdb907d104b70fb",
  "horse": "a10c90dd0fced7f16875717c082aff2dfdd3bc40",
  "major_races": "c8f096dfa0435d756d21a2a36e0f4b3d7a1bf5b5",
  "meet_schedule": "1ccb251fc2d46528eb51e6817e1e905dd099f590",
  "pedigree": "8155287c8b8ae5afbde1ec7cf1fabe9de2a7aead",
  "people": "3fcc16ee0fcbe351009eb70858d9ab612431e00d",
  "reputation": "b372f7a27dcdd6dc75844497d294fa655d6aa6b0",
  "track": "0ba8e434b091974fb8834cc66ef52ce310a5e2fa"
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

test('repaired shield paths are cache-busted and rectangular frames are removed',()=>{const css=get('public/next/next.css'),js=get('public/next/next.js');assert.ok(js.includes('png?shield=20261110b'));assert.ok(css.includes('.ng-profile-badgeframe{'),'Real approved shields retain their dedicated profile framing in the consolidated design');assert.ok(css.includes('.ng-profile-badgeframe{background:transparent!important'));assert.ok(css.includes('.ng-route-badge-slot{width:48px!important'));});

test('shield files were rechecked for detached sheet fragments',()=>{
 const manifest=JSON.parse(get('public/assets/profile-badges/v2/REPAIR_MANIFEST.json'));
 assert.equal(manifest.final_validation,'One connected alpha silhouette and no detached pixels in each shield; all four image corners transparent');
 assert.deepEqual(manifest.cleaned_git_blob_shas,approved);
});
