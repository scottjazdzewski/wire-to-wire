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
  "achievements": "05f54934b5e56820626088a1ce0d1907a36f6721",
  "career_record": "2277bbb842f72d0f69f5dabd48515e389d2a5a60",
  "connections": "572474fa16762128ca32cd4bc1836dbb86c10ebb",
  "farm_stable": "1ab3def4b83f3123c4f5f3e9b862ac0cea0ff287",
  "history": "cccca69cc5364da823237e3a49e7d22b7dce9fa8",
  "horse": "49475c936634e65fe03e67dfdcef730b10fb57bc",
  "major_races": "099eef114bcba23f99961eb25ca40db4c2892645",
  "meet_schedule": "9ffce0ef8f0a4900811efd2c7256578a7112ac53",
  "pedigree": "934c7a5132f60b0f006675d5af217aed163ab0dd",
  "people": "1149fa57a6a4e3530cee729b76c37802fb2fcf9c",
  "reputation": "50c16e0fc8ef5d04e91623c2bde258cb8c257c9d",
  "track": "27ee216a057647a4894edeb4517491985874c2d4"
};

test('all twelve APPROVED CURRENT v2 badge files match immutable original bytes and PNG header',()=>{
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
   assert.equal(gitBlob,sha,kind+' approved source pixels have changed');
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
