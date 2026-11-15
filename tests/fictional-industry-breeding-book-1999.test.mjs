import test from 'node:test';
import assert from 'node:assert/strict';
import {generate1999CoveringLedger} from '../public/1999/engine/fictional-industry-breeding-book-1999.mjs';
test('opening covering books link distinct mares to bounded stallion services',()=>{
 const mares=new Set(),stallions=new Map();let count=0;
 for(const batch of generate1999CoveringLedger({
  seed:19990101,broodmares:63000,stallions:7000,targetCovers:59000,batchSize:3000
 })){
  for(const cover of batch.records){
   assert.ok(!mares.has(cover.mareId));mares.add(cover.mareId);
   stallions.set(cover.stallionId,(stallions.get(cover.stallionId)||0)+1);
   assert.equal(cover.pregnancy,null);
   count++;
  }
 }
 assert.equal(count,59000);
 assert.equal(mares.size,59000);
 assert.ok([...stallions.values()].every(n=>n<=220));
 assert.ok(stallions.size<7000);
});
