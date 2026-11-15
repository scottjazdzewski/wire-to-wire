import test from 'node:test';
import assert from 'node:assert/strict';
import {plan1999Ecosystem} from '../public/1999/engine/fictional-industry-ecosystem-1999.mjs';
import {plan1999IndustryStaffing,generate1999StaffingBatches}
 from '../public/1999/engine/fictional-industry-staffing-1999.mjs';
test('opening staffing reflects full racing and breeding ecosystem',()=>{
 const ecosystem=plan1999Ecosystem();
 const plan=plan1999IndustryStaffing({ecosystem});
 assert.ok(plan.counts.trainer>3000);
 assert.ok(plan.counts.jockey>2000);
 assert.ok(plan.counts.groom>15000);
 assert.ok(plan.counts.breeding_attendant>9000);
 const ids=new Set();let total=0;
 for(const batch of generate1999StaffingBatches({staffing:plan,
  tracks:[{id:'T-0001',location:{region:'New York'}}],
  farms:[{id:'O-FARM-1',location:{region:'Kentucky'}}],batchSize:3000})){
  for(const person of batch.records){
   assert.ok(!ids.has(person.id));ids.add(person.id);total++;
   assert.ok(person.ratings.ability>=20&&person.ratings.ability<=99);
   assert.ok(person.workplaceId);
  }
 }
 assert.equal(total,Object.values(plan.counts).reduce((a,b)=>a+b,0));
});
