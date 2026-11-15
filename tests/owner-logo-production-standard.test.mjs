import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const registry=JSON.parse(readFileSync(new URL('../public/assets/office/founding-organization-logo-index.json',import.meta.url)));
const evidence=JSON.parse(readFileSync(new URL('../ops/owner-logo-frame-v1.json',import.meta.url)));
const lock=JSON.parse(readFileSync(new URL('../ops/approved-visual-assets.lock.json',import.meta.url)));

test('all 31 approved founding logo PNGs have identical reproducible frame geometry',()=>{
 assert.equal(evidence.schema,'WTW_APPROVED_OWNER_FRAME_V1');
 assert.equal(evidence.canvas_px,256);
 assert.equal(evidence.radius_px,28);
 assert.equal(evidence.border_px,5);
 assert.deepEqual(evidence.border_rgb,[244,237,222]);
 assert.deepEqual(evidence.outer_corners_rgb,[6,7,9]);
 assert.equal(evidence.approved_logo_count,registry.publishedCount);
 const indexed=new Set(Object.values(registry.organizations).map(p=>'public'+p));
 assert.equal(indexed.size,31);
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