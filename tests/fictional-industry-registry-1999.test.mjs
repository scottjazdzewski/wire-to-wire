import test from 'node:test';
import assert from 'node:assert/strict';
import {plan1999Ecosystem} from '../public/1999/engine/fictional-industry-ecosystem-1999.mjs';
import {generate1999IndustryRegistryBatches,count1999Registry}
 from '../public/1999/engine/fictional-industry-registry-1999.mjs';
const dirs={farms:[{id:'O-FARM-1',location:{city:'Lexington',region:'Kentucky',country:'USA'}}],
 tracks:[{id:'T-0001'}],owners:[{id:'O-OWNER-1'}]};
test('streaming opening registry covers every ecosystem cohort with unique permanent IDs',()=>{
 const plan=plan1999Ecosystem({seed:19990101});
 const ids=new Set(),byCohort={};let total=0,batches=0;
 for(const batch of generate1999IndustryRegistryBatches({seed:19990101,plan,...dirs,batchSize:2000})){
  assert.ok(batch.records.length<=2000);assert.equal(batch.offset,total);
  for(const h of batch.records){
   assert.ok(!ids.has(h.id));ids.add(h.id);total++;
   byCohort[h.cohort]=(byCohort[h.cohort]||0)+1;
   assert.equal(h.name,null);
   assert.equal(h.ownerId,'O-OWNER-1');
   assert.equal(h.birthplace.country,'USA');
   if(!['broodmares','stallions'].includes(h.cohort)){
    assert.ok(h.sireId&&h.damId);
   }
  }
  batches++;
 }
 assert.equal(total,count1999Registry(plan));
 assert.ok(total>180000&&batches>30);
 for(const [cohort,count] of Object.entries(plan.counts))
  assert.equal(byCohort[cohort]||0,cohort==='annualFoals'?0:count);
});
test('opening registry records are deterministic across independent batches',()=>{
 const opts={seed:19990101,...dirs,batchSize:17};
 const a=generate1999IndustryRegistryBatches(opts).next().value;
 const b=generate1999IndustryRegistryBatches(opts).next().value;
 assert.deepEqual(a,b);
});

test('1999 unborn foals are forecasts, not living January 1 horses',()=>{
 const plan=plan1999Ecosystem();
 const forecasts=generate1999IndustryRegistryBatches({
  seed:19990101,plan,...dirs,batchSize:1000,includeProjectedFoals:true
 });
 let projected=0;
 for(const batch of forecasts)for(const h of batch.records){
  if(h.cohort==='annualFoals'){
   projected++;assert.equal(h.dateOfBirth,null);
   assert.equal(h.sex,null);assert.equal(h.status,'PROJECTED_NOT_YET_BORN');
  }
 }
 assert.equal(projected,plan.counts.annualFoals);
 assert.equal(count1999Registry(plan,{includeProjectedFoals:true}),
  count1999Registry(plan)+projected);
});
