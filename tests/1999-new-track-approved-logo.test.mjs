import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const index=JSON.parse(readFileSync(new URL('public/assets/identity/hero-art-index-v1.json',root)));
const lock=JSON.parse(readFileSync(new URL('ops/approved-visual-assets.lock.json',root)));
const tracks=[['T-0119','Bluff City Downs'],['T-0120','Lowcountry Racecourse']];
test('owner-approved expansion marks are keyed only by immutable Work-tab track IDs',()=>{
 for(const [id,name] of tracks){
  const file='public/assets/places/track-hero/'+id+'.webp';
  assert.equal(index.tracks[id],'/assets/places/track-hero/'+id+'.webp',name);
  assert.ok(existsSync(new URL(file,root)),name);
  const bytes=readFileSync(new URL(file,root));
  assert.equal(bytes.subarray(0,4).toString(),'RIFF',name+' WebP RIFF');
  assert.equal(bytes.subarray(8,12).toString(),'WEBP',name+' WebP signature');
  const sha=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
  assert.equal(lock.assets[file],sha,name+' exact visual-asset lock');
 }
});
