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
 assert.ok(plan.counts.breeding_attendant>6000);
 const ids=new Set();let total=0;
 for(const batch of generate1999StaffingBatches({staffing:plan,
  tracks:[{id:'T-0001',location:{region:'New York'}}],
  farms:[{id:'O-FARM-1',location:{region:'Kentucky'}}],batchSize:3000})){
  for(const person of batch.records){
   assert.ok(!ids.has(person.id));ids.add(person.id);total++;
   assert.ok(person.ratings.ability>=20&&person.ratings.ability<=99);
   assert.ok(person.workplaceId);
   assert.match(person.dateOfBirth,/^\d{4}-\d{2}-\d{2}$/);
   assert.ok(person.birthplace?.city&&person.birthplace?.region);
   assert.ok(person.birthplace.countryCode===person.birthCountryCode);
   assert.ok(person.ageAtOpening>=16&&person.ageAtOpening<=70);
   assert.ok(typeof person.name==='string'&&person.name.trim().length>2);
   assert.equal(person.namingStatus,'GENERATED_1999_PERSONNEL_ENGINE');
  }
 }
 assert.equal(total,Object.values(plan.counts).reduce((a,b)=>a+b,0));
});

test('personnel naming retains deterministic stable IDs and geographic workplace',()=>{
 const staffing={counts:{trainer:2,jockey:2,groom:2,exercise_rider:1,
  veterinarian:1,farrier:1,farm_manager:1,breeding_attendant:1}};
 const args={seed:19990101,staffing,
  tracks:[{id:'T-0001',location:{region:'New York'}}],
  farms:[{id:'F-0001',location:{region:'Kentucky'}}],batchSize:3};
 const one=[...generate1999StaffingBatches(args)].flatMap(x=>x.records);
 const two=[...generate1999StaffingBatches(args)].flatMap(x=>x.records);
 assert.deepEqual(one,two);
 assert.equal(new Set(one.map(x=>x.id)).size,one.length);
 assert.equal(new Set(one.map(x=>x.name.toLowerCase())).size,one.length);
 for(const person of one){
  assert.ok(person.name);
  assert.ok(person.nameModel);
  assert.ok(person.biographyRevision==='WTW_1999_PERSONNEL_BIO_V1');
  assert.equal(person.workplaceId,
   ['farm_manager','breeding_attendant'].includes(person.role)?'F-0001':'T-0001');
 }
});
