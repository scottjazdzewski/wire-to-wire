import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const registry=JSON.parse(readFileSync(new URL('../public/assets/office/founding-organization-logo-index.json',import.meta.url)));
const evidence=JSON.parse(readFileSync(new URL('../ops/owner-logo-frame-v1.json',import.meta.url)));
const lock=JSON.parse(readFileSync(new URL('../ops/approved-visual-assets.lock.json',import.meta.url)));

test('all approved founding logo PNGs have identical reproducible frame geometry',()=>{
 assert.equal(evidence.schema,'WTW_APPROVED_OWNER_FRAME_V1');
 assert.equal(evidence.canvas_px,256);
 assert.equal(evidence.radius_px,28);
 assert.equal(evidence.border_px,5);
 assert.deepEqual(evidence.border_rgb,[244,237,222]);
 assert.deepEqual(evidence.outer_corners_rgb,[6,7,9]);
 assert.equal(evidence.approved_logo_count,registry.publishedCount);
 const indexed=new Set(Object.values(registry.organizations).map(p=>'public'+p));
 assert.equal(indexed.size,registry.publishedCount);
 assert.deepEqual(new Set(evidence.assets.map(a=>a.path)),indexed);
 for(const a of evidence.assets){
  const data=readFileSync(new URL('../'+a.path,import.meta.url));
  assert.equal(data.readUInt32BE(16),256,a.path+' width');
  assert.equal(data.readUInt32BE(20),256,a.path+' height');
  assert.equal(data[25],2,a.path+' RGB opaque PNG mode');
  assert.equal(createHash('sha256').update(data).digest('hex'),a.output_sha256,a.path+' byte-for-byte geometry proof');
  assert.ok(lock.assets[a.path],a.path+' must be in visual-asset lock');
 }
});
test('approved Split Rail and Davenport art uses one exact frame geometry with user-approved red accent',()=>{
 const red=[145,4,23];
 const IDs=['O-FOUNDING-1999-001','O-FOUNDING-1999-004'];
 const shas=['5bfd2481d1bd39ad0caa2d5193b0702cfe18be207dd92ce061c240f62d265c97',
             '9ce639f33f94e21235b17c3161619e85641066dcd6f96b7d8b97a9797d3f8837'];
 IDs.forEach((id,i)=>{
  const path='public/assets/office/founding-organization-logos/'+id+'.png';
  const row=evidence.assets.find(x=>x.path===path);
  assert.ok(row,'identity-specific approved art must remain in audit');
  assert.deepEqual(row.border_rgb,red,id+' exact identity accent');
  assert.equal(row.radius_px,28); assert.equal(row.border_px,5);assert.equal(row.border_inset_px,5);
  assert.equal(row.output_sha256,shas[i],id+' approved frame output');
  const data=readFileSync(new URL('../'+path,import.meta.url));
  assert.equal(createHash('sha256').update(data).digest('hex'),shas[i]);
  assert.equal(data[25],2,'only opaque RGB game output is approved');
 });
});

test('Vesper Brook corrected cream field is the exact approved opaque RGB badge',()=>{
 const path='public/assets/office/founding-organization-logos/O-FOUNDING-1999-008.png';
 const a=evidence.assets.find(row=>row.path===path);
 assert.ok(a,'Vesper Brook O-ID remains published');
 assert.equal(a.output_sha256,'966073b32d469cae0ac6ebcb3b478234187f5a899ea8bb73b6cf4781407acbf6');
 assert.equal(a.radius_px,28);assert.equal(a.border_px,5);assert.equal(a.border_inset_px,5);
 assert.deepEqual(a.border_rgb,[0,48,31]);
 const bytes=readFileSync(new URL('../'+path,import.meta.url));
 assert.equal(bytes.readUInt32BE(16),256);
 assert.equal(bytes.readUInt32BE(20),256);
 assert.equal(bytes[25],2);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),a.output_sha256);
 assert.equal(registry.organizations['organization:O-FOUNDING-1999-008'],'/assets/office/founding-organization-logos/O-FOUNDING-1999-008.png');
});

test('approved gold Saint Alloy logo preserves the shared border dimensions',()=>{
 const path='public/assets/office/founding-organization-logos/O-000011.png';
 const a=evidence.assets.find(row=>row.path===path);
 assert.ok(a);assert.equal(a.radius_px,28);assert.equal(a.border_px,5);assert.equal(a.border_inset_px,5);
 assert.deepEqual(a.border_rgb,[244,196,27]);
 assert.equal(a.output_sha256,'1d990b41239e39ca3b9621b385b8b537101a4a46d2deba701eee18d15ee9bf49');
 assert.equal(createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex'),a.output_sha256);
});
