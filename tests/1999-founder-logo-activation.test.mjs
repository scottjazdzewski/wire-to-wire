import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const exists=p=>existsSync(new URL('../'+p.replace(/^\//,''),import.meta.url));
const manifest=JSON.parse(read('public/assets/office/founding-organization-logo-index.json'));
const legacy=JSON.parse(read('public/assets/office/organization-logo-index.json'));
const directory=JSON.parse(read('public/data/wtw-1999-founding-directory-v1.json'));
const photo=JSON.parse(read('public/assets/office/decision-photo-index.json'));
const ui=read('public/next/next.js');
const adapter=read('public/next/1999-restored-profiles.js');
const html=read('public/next/index.html');

test('available ownership logos are published only for exact 1999 founding names AND immutable organization IDs',()=>{
 assert.equal(directory.organizations.length,37);
 assert.equal(manifest.approvedOrganizationIds.length,37);
 assert.equal(manifest.publishedCount,Object.keys(manifest.organizations).length);
 assert.equal(manifest.remainingWithoutMatchedLogo,directory.organizations.length-manifest.publishedCount);
 assert.deepEqual(legacy.organizations,{},'retired 108-owner index must not serve pixelated imagery');
 const entries=Object.entries(manifest.organizations);
 assert.equal(entries.length,manifest.publishedCount);
 const allowed=new Set(directory.organizations.map(o=>o.id));
 for(const [key,path] of entries){
  assert.match(key,/^organization:O-[\w-]+$/);
  const id=key.slice('organization:'.length);
  assert.ok(allowed.has(id),id);
  assert.ok(exists('public'+path),path);
  const org=directory.organizations.find(o=>o.id===id);
  assert.equal(path,'/assets/office/founding-organization-logos/'+id+'.png',id);
  assert.doesNotMatch(path,/owner-logos|_v1_64/,'retired low-resolution generated crest cannot be active');
 }
 assert.equal(manifest.organizations['organization:O-000002'],'/assets/office/founding-organization-logos/O-000002.png','Harrowgate must use its NEW approved artwork');
 assert.equal(manifest.organizations['organization:O-000056'],'/assets/office/founding-organization-logos/O-000056.png','Quickfire must use its NEW approved artwork');
 assert.equal(manifest.organizations['organization:O-FOUNDING-1999-005'],'/assets/office/founding-organization-logos/O-FOUNDING-1999-005.png','Use the approved All The Colors logo');
 assert.equal(Object.keys(manifest.organizations).length+manifest.remainingWithoutMatchedLogo,37);
});

test('existing approved track logos, badge set and selected ID-verified portraits remain available',()=>{
 const fs=Object.keys(photo.entities).filter(k=>/^track:T-\d{4}$/.test(k));
 assert.equal(fs.length,24);
 for(const key of fs)assert.ok(exists('public'+photo.entities[key]),key);
 const approvedPeople=new Set(directory.people.map(p=>p.id));
 const personImages=Object.entries(photo.entities).filter(([k,path])=>
  k.startsWith('person:P-')&&approvedPeople.has(k.slice('person:'.length))&&exists('public'+path));
 assert.equal(personImages.length,3);
 const approvedBadgeNames=['achievements','career_record','connections','farm_stable','history','horse',
  'major_races','meet_schedule','pedigree','people','reputation','track'];
 for(const name of approvedBadgeNames)
  assert.ok(exists('public/assets/profile-badges/v2/wtw_badge_'+name+'.png'));
 assert.match(adapter,/node\.dataset\.trackId=d\.id/);
 assert.match(ui,/approvedIdentityAsset\('track',source\.dataset\.trackId/);
 assert.match(ui,/approvedIdentityAsset\('person',source\.dataset\.personId/);
});

test('the clean Office loads only the founder manifest, without silently reviving legacy organizations',()=>{
 assert.match(ui,/founding-organization-logo-index\.json\?rev=founder-approved-31-20261114/);
 assert.match(ui,/const approvedOrg=isClean1999\(\)\?/);
 assert.match(ui,/approvedOrg\?\['organization:'\+approvedOrg\.id\]/);
 assert.match(ui,/const allowed=\(world1999Data\?\.organizations\|\|\[\]\)\.some\(o=>o\.id===id\)/);
 assert.match(html,/\/next\/next\.js\?rev=wtw1999-/);
 assert.match(html,/\/next\/1999-restored-profiles\.js\?rev=wtw1999-/);
 assert.equal(directory.counts.organizations,37);
 assert.equal(directory.counts.generatedProfessionals,0);
 assert.equal(directory.counts.generatedTrainingCenters,0);
});
