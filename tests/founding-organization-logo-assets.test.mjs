import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson=path=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
const index=readJson('public/assets/office/founding-organization-logo-index.json');
const roster=readJson('public/data/wtw-1999-founding-directory-v1.json');
const current=new Set(roster.organizations.map(row=>row.id));
const approved=new Set(index.approvedOrganizationIds);
const revised=new Set(index.latestApprovedLogoIds);

test('1999 approved logos match the 37 exact opening organization IDs',()=>{
 assert.equal(current.size,37);
 assert.equal(approved.size,37);
 assert.deepEqual([...current].sort(),[...approved].sort());
 assert.equal(index.publishedCount,Object.keys(index.organizations).length);
 assert.equal(index.remainingWithoutMatchedLogo,current.size-index.publishedCount);
 assert.equal(index.audit.notPublished.length,index.remainingWithoutMatchedLogo);
 assert.equal(index.audit.published.length,index.publishedCount);
 for(const {id,name,path} of index.audit.published){
  assert.ok(current.has(id), 'not in founding world: '+id);
  const actual=roster.organizations.find(x=>x.id===id);
  assert.equal(name,actual.name,'name mismatch '+id);
  assert.equal(index.organizations['organization:'+id],path);
  assert.ok(path.startsWith('/assets/office/'));
  assert.ok(existsSync(resolve(root,'public'+path)), 'missing approved asset '+id);
 }
});
test('newly installed approved organization logos are all exact 256-square PNGs',()=>{
 assert.equal(revised.size,Object.values(index.organizations).filter(path=>path.startsWith('/assets/office/founding-organization-logos/')).length);
 for(const id of revised){
  assert.ok(current.has(id),'not current '+id);
  const path=index.organizations['organization:'+id];
  assert.equal(path,'/assets/office/founding-organization-logos/'+id+'.png');
  const bytes=readFileSync(resolve(root,'public'+path));
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a','bad PNG '+id);
  assert.equal(bytes.readUInt32BE(16),256,'wrong width '+id);
  assert.equal(bytes.readUInt32BE(20),256,'wrong height '+id);
 }
});
test('No stale legacy identity substitutions in active 1999 logo index',()=>{
 for(const [key,path] of Object.entries(index.organizations)){
  assert.doesNotMatch(path,/owner-logos|_v1_64/,'pixelated owner fallback is retired');
  assert.match(key,/^organization:O-(?:\d{6}|FOUNDING-1999-\d{3})$/);
  assert.ok(current.has(key.slice('organization:'.length)),'unknown organization '+key);
  assert.ok(!/state[-_]?flag|states\//i.test(path),'state/flag logo substituted for owner '+key);
 }
 for(const p of index.audit.notPublished)assert.ok(!index.organizations['organization:'+p.id],'unapproved replacement '+p.id);
});

test('Mar Azul uses an opaque 256x256 exact-ID badge rather than an old horse or state flag',()=>{
 const id='O-FOUNDING-1999-009';
 const org=roster.organizations.find(x=>x.id===id);
 assert.equal(org.name,'Mar Azul Racing');
 const path=index.organizations['organization:'+id];
 assert.equal(path,'/assets/office/founding-organization-logos/'+id+'.png');
 const bytes=readFileSync(resolve(root,'public'+path));
 assert.equal(bytes.readUInt32BE(16),256);
 assert.equal(bytes.readUInt32BE(20),256);
 assert.equal(bytes[25],2,'Approved Mar Azul file must be opaque truecolor RGB');
 assert.ok(index.audit.published.some(x=>x.id===id&&x.name==='Mar Azul Racing'));
});

test('Ledbetter Calder approved LC logo is 256px opaque RGB and keyed by immutable O-ID',()=>{
 const id='O-006905',org=roster.organizations.find(x=>x.id===id);
 assert.equal(org.name,'Ledbetter Calder Stables');
 const path=index.organizations['organization:'+id];
 assert.equal(path,'/assets/office/founding-organization-logos/'+id+'.png');
 const bytes=readFileSync(resolve(root,'public'+path));
 assert.equal(bytes.readUInt32BE(16),256);
 assert.equal(bytes.readUInt32BE(20),256);
 assert.equal(bytes[25],2,'The approved LC badge is RGB with opaque purple corners');
 assert.ok(index.audit.published.some(x=>x.id===id&&x.name==='Ledbetter Calder Stables'));
 assert.ok(!index.audit.notPublished.some(x=>x.id===id));
});
