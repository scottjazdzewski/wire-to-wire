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

test('Circle B approved concentric B mark is exact-ID, 256-square RGB and protected',()=>{
 const id='O-000059',org=roster.organizations.find(x=>x.id===id);
 assert.equal(org?.name,'Circle B Racing');
 const path=index.organizations['organization:'+id];
 assert.equal(path,'/assets/office/founding-organization-logos/O-000059.png');
 const bytes=readFileSync(resolve(root,'public'+path));
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(bytes.readUInt32BE(16),256);
 assert.equal(bytes.readUInt32BE(20),256);
 assert.equal(bytes[25],2,'Circle B production badge must be RGB with opaque corners');
 assert.ok(index.audit.published.some(x=>x.id===id&&x.name==='Circle B Racing'));
 assert.ok(!index.audit.notPublished.some(x=>x.id===id));
 const frame=readJson('ops/owner-logo-frame-v1.json');
 assert.ok(frame.assets.some(x=>x.path==='public'+path&&x.output_sha256==='6406b49e6f8b2dfaed55ef057703ef419ef2269b4c0e6c0b690517eb02505c31'));
 const ui=readFileSync(resolve(root,'public/next/next.js'),'utf8');
 assert.match(ui,/function organizationLogoMarkup\(id,name,kind=/);
 assert.match(ui,/organizationLogoMarkup\(owner\.id,owner\.name,'organization'/);
 assert.match(ui,/approvedIdentityAsset\('organization',source\.dataset\.organizationId/);
});

test('Northbank approved tree-free bluff mark is exact-ID, RGB and byte-locked',()=>{
 const id='O-000045';
 assert.equal(roster.organizations.find(x=>x.id===id)?.name,'Northbank Racing');
 const path=index.organizations['organization:'+id];
 assert.equal(path,'/assets/office/founding-organization-logos/O-000045.png');
 const bytes=readFileSync(resolve(root,'public'+path));
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(bytes.readUInt32BE(16),256);
 assert.equal(bytes.readUInt32BE(20),256);
 assert.equal(bytes[25],2,'Northbank production badge must be opaque RGB');
 assert.ok(index.audit.published.some(x=>x.id===id&&x.name==='Northbank Racing'));
 assert.ok(!index.audit.notPublished.some(x=>x.id===id));
 const frame=readJson('ops/owner-logo-frame-v1.json');
 assert.ok(frame.assets.some(x=>x.path==='public'+path&&x.output_sha256==='9ad2b8eaeb90f0c0f95d827c35fff02e7ab9e3e6450b40089557c908dae0e966'));
 const ui=readFileSync(resolve(root,'public/next/next.js'),'utf8');
 assert.match(ui,/function organizationLogoMarkup\(id,name,kind=/);
 assert.match(ui,/organizationLogoMarkup\(owner\.id,owner\.name,'organization'/);
 assert.match(ui,/approvedIdentityAsset\('organization',source\.dataset\.organizationId/);
});

test('approved Saint Alloy is an opaque 256-square exact-OID wordmark',()=>{
 const id='O-000011';
 assert.equal(roster.organizations.find(o=>o.id===id)?.name,'St. Alloy Partners');
 const path=index.organizations['organization:'+id];
 assert.equal(path,'/assets/office/founding-organization-logos/O-000011.png');
 const data=readFileSync(resolve(root,'public'+path));
 assert.equal(data.readUInt32BE(16),256);assert.equal(data.readUInt32BE(20),256);assert.equal(data[25],2);
 assert.ok(index.audit.published.some(o=>o.id===id));
 const frame=readJson('ops/owner-logo-frame-v1.json');
 const row=frame.assets.find(a=>a.path==='public'+path);
 assert.equal(row.output_sha256,'1d990b41239e39ca3b9621b385b8b537101a4a46d2deba701eee18d15ee9bf49');
 assert.deepEqual(row.border_rgb,[244,196,27]);
});

test('Whitcombe and Argosy Bloodstock approved sports marks are exact-ID, 256-square and frame SHA-locked',()=>{
 const evidence=readJson('ops/owner-logo-frame-v1.json');
 const lock=readJson('ops/approved-visual-assets.lock.json');
 const cases=[
  {id:'O-000037',name:'Whitcombe Family',sha:'5ecf19bcb6a8ee9f2dccd15882a2fbd5e4a1f1ce3be71f5774fd456309c148f2',border:[244,237,222]},
  {id:'O-000014',name:'Argosy Bloodstock',sha:'225b8d95323e42ddc81329d680d412ca9fce7e8cf8ec62981c8a0e1a14024d3a',border:[215,171,67]},
 ];
 for(const a of cases){
  const org=roster.organizations.find(o=>o.id===a.id);
  assert.equal(org?.name,a.name);
  const path='public/assets/office/founding-organization-logos/'+a.id+'.png';
  assert.equal(index.organizations['organization:'+a.id],'/'+path.replace(/^public\//,''));
  const bytes=readFileSync(resolve(root,path));
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(bytes.readUInt32BE(16),256);
  assert.equal(bytes.readUInt32BE(20),256);
  assert.equal(bytes[25],2,'opaque RGB badge');
  const audit=evidence.assets.find(x=>x.path===path);
  assert.ok(audit,'missing approved artwork evidence');
  assert.equal(audit.output_sha256,a.sha);
  assert.equal(audit.radius_px,28);
  assert.equal(audit.border_inset_px,5);
  assert.equal(audit.border_px,5);
  assert.deepEqual(audit.border_rgb,a.border);
  assert.ok(lock.assets[path],path+' missing canonical visual asset lock');
  assert.ok(index.audit.published.some(x=>x.id===a.id&&x.name===a.name));
  assert.ok(!index.audit.notPublished.some(x=>x.id===a.id));
 }
 assert.equal(index.publishedCount,36);
 assert.deepEqual(index.audit.notPublished.map(x=>x.id),['O-000057']);
});
