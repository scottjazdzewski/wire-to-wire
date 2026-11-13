import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 FICTIONAL_TRAINING_CAPACITY_MODEL,TRAINING_BARN_TIERS,
 assessFictionalTrainingCapacity,planFictionalTrainingAssignments,
 exportFictionalTrainingAssignmentState,importFictionalTrainingAssignmentState,
 auditFictionalOwnerTrainerNetwork
} from '../public/1999/engine/fictional-training-capacity-planner.mjs';
import {planFictionalOwnerPortfolios}
 from '../public/1999/engine/fictional-owner-portfolio-planner.mjs';

const regions=['Kentucky','Florida','New York','California','Maryland','Ontario','Louisiana'];
const weights=[25,20,16,15,12,8,4]; // synthetic regional split, NOT track statistics
const weightedRegion=i=>{
 const roll=i%100;let total=0;
 for(let k=0;k<regions.length;k++){
  total+=weights[k];
  if(roll<total)return regions[k];
 }
 return regions.at(-1);
};
const makeTrainers=n=>Array.from({length:n},(_,i)=>({
 id:'TRAINER-1999-'+String(i+1).padStart(7,'0'),
 stableId:'RACING-STABLE-1999-'+String(i+1).padStart(7,'0'),
 baseRegion:weightedRegion(i)
}));
const makeHorses=n=>Array.from({length:n},(_,i)=>weightedRegion(i));
const makeOwners=n=>Array.from({length:n},(_,i)=>({
 id:'OWNER-1999-'+String(i+1).padStart(7,'0')
}));
const trainers=makeTrainers(4200),horses=makeHorses(100000);

test('trainer capacity tiers represent editorial ranges, independent of ownership/company type',()=>{
 assert.match(FICTIONAL_TRAINING_CAPACITY_MODEL,/TRAINER_BARNS_V9/);
 assert.deepEqual(TRAINING_BARN_TIERS.map(x=>x.id),
  ['SMALL_YARD','REGIONAL_BARN','ESTABLISHED_STABLE','LARGE_STABLE','NATIONAL_OPERATION']);
 assert.equal(TRAINING_BARN_TIERS.reduce((a,t)=>a+t.weight,0),100);
 assert.ok(TRAINING_BARN_TIERS.every(t=>t.min>0&&t.max>=t.min));
});
test('100,000 horses share 4,200 existing trainers and barns without impossible regional shipping',()=>{
 const preflight=assessFictionalTrainingCapacity({
  seed:19990101,trainers,horseCount:100000,horseRegions:horses
 });
 assert.equal(preflight.shortfall,0);
 assert.equal(preflight.trainerCount,4200);
 assert.ok(preflight.availableSlots>100000);
 const t=planFictionalTrainingAssignments({
  seed:19990101,trainers,horseCount:100000,horseRegions:horses
 });
 assert.equal(t.schema,FICTIONAL_TRAINING_CAPACITY_MODEL);
 assert.equal(t.horseCount,100000);
 assert.equal(t.summary.unassignedHorses,0);
 assert.equal(t.summary.trainerCount,4200);
 assert.equal(t.summary.idleTrainers,0);
 assert.equal(t.trainerIndexForHorse.length,100000);
 assert.equal(t.horseIndexesByTrainer.length,100000);
 assert.equal(t.trainerHorseOffsets.length,4201);
 assert.equal(t.trainerHorseOffsets.at(-1),100000);
 assert.equal(t.horseCountsByTrainer.reduce((a,b)=>a+b,0),100000);
 assert.ok(t.summary.trainersWithOneToTenHorses>500);
 assert.ok(t.summary.trainersWithHundredPlusHorses>50);
 assert.ok(t.summary.largestBarn>=100);
 for(let h=0;h<100000;h++){
  const trainerIndex=t.trainerIndexForHorse[h];
  assert.equal(trainers[trainerIndex].baseRegion,horses[h],'horse region mismatch '+h);
  if(h%107===0){
   assert.equal(t.trainerIdAtHorse(h),trainers[trainerIndex].id);
   assert.equal(t.stableIdAtHorse(h),trainers[trainerIndex].stableId);
   const page=t.trainerHorses(trainers[trainerIndex].id,{limit:350});
   assert.ok(page.horseIndexes.includes(h));
   assert.equal(page.count,t.horseCountsByTrainer[trainerIndex]);
  }
 }
 assert.deepEqual(
  planFictionalTrainingAssignments({seed:19990101,trainers,horseCount:100000,horseRegions:horses}).trainerIndexForHorse,
  t.trainerIndexForHorse
 );
 const selected=trainers[106];
 const first=t.trainerHorses(selected.id,{offset:0,limit:25});
 const second=t.trainerHorses(selected.id,{offset:25,limit:25});
 assert.equal(first.stableId,selected.stableId);
 assert.equal(first.count,t.horseCountsByTrainer[106]);
 assert.equal(new Set([...first.horseIndexes,...second.horseIndexes]).size,
  first.horseIndexes.length+second.horseIndexes.length);
 assert.throws(()=>t.trainerHorses('UNKNOWN'),/Unknown trainer/);
 assert.throws(()=>t.trainerIdAtHorse(-1),/Invalid training horse index/);
});
test('one major owner may spread across trainers, and barns service numerous distinct owners',()=>{
 const owners=planFictionalOwnerPortfolios({
  seed:19990101,owners:makeOwners(8000),horseCount:100000
 });
 const trainersPlan=planFictionalTrainingAssignments({
  seed:19990101,trainers,horseCount:100000,horseRegions:horses
 });
 const network=auditFictionalOwnerTrainerNetwork({
  ownerPlan:owners,trainingPlan:trainersPlan
 });
 assert.equal(network.horseCount,100000);
 assert.equal(network.distinctOwners,8000);
 assert.equal(network.distinctTrainers,4200);
 assert.ok(network.ownersWithMultipleTrainers>2500);
 assert.ok(network.trainersWithMultipleOwners>2500);
 assert.ok(network.maxTrainersPerOwner>80,
  'some substantial owners should work with multiple independent barns');
 assert.ok(network.maxOwnersPerTrainer>50,
  'large trainers should be handling horses for many ownership accounts');
});
test('locked historical assignments are never rewritten, including on growth or import',()=>{
 const locked=[
  {horseIndex:0,trainerId:trainers[0].id},
  {horseIndex:1,trainerId:trainers[1].id},
  {horseIndex:99999,trainerId:trainers[4199].id}
 ];
 // All three specific locked trainers must serve the actual horse's region.
 assert.equal(horses[0],trainers[0].baseRegion);
 assert.equal(horses[1],trainers[1].baseRegion);
 assert.equal(horses[99999],trainers[4199].baseRegion);
 const initial=planFictionalTrainingAssignments({
  seed:20600101,trainers,horseCount:100000,horseRegions:horses,
  lockedAssignments:locked
 });
 assert.equal(initial.summary.lockedHorseCount,3);
 for(const pair of locked)assert.equal(initial.trainerIdAtHorse(pair.horseIndex),pair.trainerId);
 const serialized=exportFictionalTrainingAssignmentState(initial);
 assert.equal(serialized.trainerIndexes.length,100000);
 assert.equal(serialized.horseRegions.length,100000);
 const restored=importFictionalTrainingAssignmentState(
  JSON.parse(JSON.stringify(serialized))
 );
 assert.deepEqual(restored.trainerIndexForHorse,initial.trainerIndexForHorse);
 const broken=JSON.parse(JSON.stringify(serialized));
 broken.trainerIndexes[7]=(broken.trainerIndexes[7]+1)%trainers.length;
 assert.throws(()=>importFictionalTrainingAssignmentState(broken),/corrupt/);
 const expandedTrainers=makeTrainers(5500),expandedRegions=makeHorses(130000);
 const expanded=planFictionalTrainingAssignments({
  seed:20600101,trainers:expandedTrainers,horseCount:130000,
  horseRegions:expandedRegions,existingPlan:restored
 });
 assert.equal(expanded.horseCount,130000);
 assert.equal(expanded.summary.previousHorseCount,100000);
 assert.equal(expanded.summary.unassignedHorses,0);
 for(let h=0;h<100000;h++)
  assert.equal(expanded.trainerIndexForHorse[h],initial.trainerIndexForHorse[h],
   'previous training stable was overwritten at '+h);
 assert.throws(()=>planFictionalTrainingAssignments({
  seed:20600101,trainers:[...trainers].reverse(),horseCount:100000,
  horseRegions:horses,existingPlan:restored
 }),/Incompatible previous training assignments/);
 assert.throws(()=>planFictionalTrainingAssignments({
  seed:20600101,trainers,horseCount:100000,horseRegions:horses,
  existingPlan:initial,
  lockedAssignments:[{horseIndex:0,trainerId:trainers[100].id}]
 }),/Historical trainer assignment conflicts/);
});
test('regional shortages are reported instead of inventing trainers or shipping across the country',()=>{
 const tooFew=makeTrainers(750);
 const forecast=assessFictionalTrainingCapacity({
  seed:19990101,trainers:tooFew,horseCount:100000,horseRegions:horses
 });
 assert.ok(forecast.shortfall>0);
 assert.ok(forecast.byRegion.Kentucky.shortfall>0);
 assert.throws(()=>planFictionalTrainingAssignments({
  seed:19990101,trainers:tooFew,horseCount:100000,horseRegions:horses
 }),/Insufficient training capacity/);
 const short=[
  {id:'T-1',stableId:'S-1',baseRegion:'Kentucky',maxHorses:1},
  {id:'T-2',stableId:'S-2',baseRegion:'Kentucky',maxHorses:500}
 ];
 const p=planFictionalTrainingAssignments({
  seed:21,trainers:short,horseCount:300,
  horseRegions:Array(300).fill('Kentucky')
 });
 assert.equal(p.trainerHorses('T-1').count,1);
 assert.equal(p.trainerHorses('T-2').count,299);
 assert.throws(()=>planFictionalTrainingAssignments({
  seed:21,trainers:short,horseCount:502,
  horseRegions:Array(502).fill('Kentucky')
 }),/Insufficient training capacity/);
 assert.throws(()=>planFictionalTrainingAssignments({
  seed:21,trainers:short,horseCount:3,
  horseRegions:['Kentucky','Florida','Kentucky']
 }),/Insufficient training capacity in Florida/);
 assert.throws(()=>planFictionalTrainingAssignments({
  seed:21,trainers:short,horseCount:3,
  horseRegions:['Kentucky','Kentucky','Kentucky'],
  lockedAssignments:[{horseIndex:1,trainerId:'BOGUS'}]
 }),/Invalid or duplicated/);
 assert.throws(()=>planFictionalTrainingAssignments({
  seed:21,trainers:short,horseCount:3,
  horseRegions:['Kentucky','Kentucky','Florida'],
  lockedAssignments:[{horseIndex:2,trainerId:'T-1'}]
 }),/location mismatch/);
});
test('325,000-horse training population keeps typed-array storage linear',()=>{
 const bigger=makeTrainers(15000),largeRegions=makeHorses(325000);
 const p=planFictionalTrainingAssignments({
  seed:19990101,trainers:bigger,horseCount:325000,
  horseRegions:largeRegions
 });
 assert.equal(p.horseCount,325000);
 assert.equal(p.summary.unassignedHorses,0);
 assert.equal(p.trainerIndexForHorse.byteLength,325000*4);
 assert.equal(p.horseIndexesByTrainer.byteLength,325000*4);
 assert.equal(p.trainerHorseOffsets.byteLength,(bigger.length+1)*4);
 assert.ok(p.summary.trainersWithHundredPlusHorses>50);
 assert.ok(p.trainerIdAtHorse(324999));
});
test('planning cannot change the existing horse identity, horse ownership, world or UI engine',()=>{
 const source=readFileSync(new URL('../public/1999/engine/fictional-training-capacity-planner.mjs',import.meta.url),'utf8');
 const world=readFileSync(new URL('../public/1999/engine/full-world-generator.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/\b(?:fetch|localStorage|indexedDB|writeFile|setItem)\s*\(/);
 assert.doesNotMatch(world,/fictional-training-capacity-planner/);
 assert.doesNotMatch(world,/planFictionalTrainingAssignments/);
});
