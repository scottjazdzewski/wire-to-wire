import test from 'node:test';
import assert from 'node:assert/strict';
import {plan1999Ecosystem} from '../public/1999/engine/fictional-industry-ecosystem-1999.mjs';
import {generate1999IndustryRegistryBatches,count1999Registry,
 project1999HorseForYear}
 from '../public/1999/engine/fictional-industry-registry-1999.mjs';
import {planFictionalOwnerPortfolios}
 from '../public/1999/engine/fictional-owner-portfolio-planner.mjs';
const dirs={farms:[{id:'O-FARM-1',location:{city:'Lexington',region:'Kentucky',country:'USA'}}],
 tracks:[{id:'T-0001'}],owners:[{id:'O-OWNER-1',maxHorses:1000000}]};
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
   if(h.cohort==='fivePlusRunners')assert.ok(h.foalYear<=1994);
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

test('opening registry consumes the V9 long-tail owner plan exactly once per horse',()=>{
 const seed=19990101,plan=plan1999Ecosystem({seed,targetOpeningHorses:300000});
 const owners=Array.from({length:16000},(_,i)=>({
  id:'O-PORTFOLIO-'+String(i+1).padStart(6,'0')}));
 const planned=planFictionalOwnerPortfolios({seed,plan,owners,
  horseCount:300000});
 const expectedTier=new Map(owners.map((owner,i)=>[owner.id,planned.ownerTier[i]]));
 const counts=new Map(),byTier={};let total=0;
 for(const batch of generate1999IndustryRegistryBatches({seed,plan,...dirs,
  owners,batchSize:5000}))for(const horse of batch.records){
  total++;counts.set(horse.ownerId,(counts.get(horse.ownerId)||0)+1);
  assert.equal(horse.ownerPortfolioTier,expectedTier.get(horse.ownerId));
  byTier[horse.ownerPortfolioTier]=(byTier[horse.ownerPortfolioTier]||0)+1;
  assert.ok(['HANDFUL','SMALL','REGIONAL','MAJOR','ELITE'].includes(
   horse.ownerPortfolioTier));
 }
 assert.equal(total,300000);
 assert.equal([...counts.values()].reduce((a,b)=>a+b,0),300000);
 assert.ok(counts.size>10000,'the full census should use a broad owner base');
 assert.ok(Object.keys(byTier).length===5,'all five operating tiers receive horses');
 assert.throws(()=>[...generate1999IndustryRegistryBatches({seed,plan,...dirs,
  owners:owners.slice(0,10),batchSize:5000})],/Insufficient owner capacity/);
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
   assert.match(h.forecastBirthDate,/^1999-0[2-7]-\d{2}$/);
  }
 }
 assert.equal(projected,plan.counts.annualFoals);
 assert.equal(count1999Registry(plan,{includeProjectedFoals:true}),
  count1999Registry(plan)+projected);
});

test('small, 300,000, and maximum registries keep exact size, unique IDs, and valid pedigrees through aging',()=>{
 for(const size of [10000,300000,325000]){
  const seed=19991116,plan=plan1999Ecosystem({seed,targetOpeningHorses:size});
  const ids=new Set();let count=0;const aged={};
  for(const batch of generate1999IndustryRegistryBatches({seed,plan,...dirs,
   batchSize:5000,emitNames:false}))for(const horse of batch.records){
   assert.ok(!ids.has(horse.id));ids.add(horse.id);count++;
   const projected=project1999HorseForYear(horse,2000);
   aged[projected.cohort]=(aged[projected.cohort]||0)+1;
   assert.ok(!['PROJECTED_NOT_YET_BORN','FOAL'].includes(projected.status));
   if(horse.sireId){
    const sire=/^H-FICTIONAL-1999-STALLIONS-(\d{7})$/.exec(horse.sireId);
    const dam=/^H-FICTIONAL-1999-BROODMARES-(\d{7})$/.exec(horse.damId);
    assert.ok(sire&&Number(sire[1])<=plan.counts.stallions);
    assert.ok(dam&&Number(dam[1])<=plan.counts.broodmares);
   }
  }
  assert.equal(count,size);
  assert.equal(ids.size,size);
  assert.equal(Object.values(aged).reduce((sum,n)=>sum+n,0),size);
 }
});
