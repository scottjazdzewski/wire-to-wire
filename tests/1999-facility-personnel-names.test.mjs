import test from 'node:test';
import assert from 'node:assert/strict';
import {createOrganizationNameRoster,createBreakingTrainingNames,ORGANIZATION_NAME_MODEL} from '../public/1999/engine/organization-name-engine.mjs';
import {createPersonnelNameRoster,PERSONNEL_NAME_MODEL} from '../public/1999/engine/personnel-name-engine.mjs';
import {create1999Universe} from '../public/1999/engine/full-world-generator.mjs';

const ROLE_COUNTS=[['trainer',4200],['jockey',1800],['farm_manager',550],['veterinarian',430],['farrier',420],['bloodstock_agent',360],['racing_secretary',134]];
const STAFF_COUNT=ROLE_COUNTS.reduce((n,[,count])=>n+count,0);
const roleAt=i=>{
 if(i>=STAFF_COUNT)return 'owner';
 for(const [role,count] of ROLE_COUNTS){if(i<count)return role;i-=count}
 return 'owner';
};
const normalized=x=>String(x).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
function assertNoDuplicates(names,message){
 const keys=names.map(normalized);
 assert.equal(new Set(keys).size,keys.length,message);
}
test('11,202 profession-specific 1999 test people have unique full names across every role',()=>{
 for(const seed of [19990101,19990102]){
  const staff=createPersonnelNameRoster(seed,STAFF_COUNT+3308,roleAt,['Gabe Larkin','Dr. Elias Venn','Nico Arroyo']);
  assert.equal(staff.length,11202);
  assertNoDuplicates(staff.map(p=>p.name),'duplicate person');
  assert.ok(staff.every((p,i)=>p.name&&p.role===roleAt(i)&&p.nameModel===PERSONNEL_NAME_MODEL));
  assert.ok(staff.every(p=>!['Gabe Larkin','Dr. Elias Venn','Nico Arroyo'].some(n=>normalized(n)===normalized(p.name))));
  assert.ok(staff.slice(4200,6000).every(p=>p.role==='jockey'));
  assert.deepEqual(createPersonnelNameRoster(seed,25,roleAt).map(x=>x.name),
   createPersonnelNameRoster(seed,25,roleAt).map(x=>x.name));
 }
});
test('all 8,408 generated organization/facility names are globally distinct with canon reservations',()=>{
 for(const seed of [19990101,19990102]){
  const people=createPersonnelNameRoster(seed,STAFF_COUNT+3308,roleAt);
  const sourceNames=['Kingsmere Farm','Crescent Mile Stud','Blue Lantern Racing','Marrowfield Farm'];
  const args={seed,ownerCount:3308,barnCount:4200,farmCount:900,
   protectedNames:sourceNames,
   sourceOwnerNames:sourceNames,
   principalNames:people.slice(STAFF_COUNT).map(p=>p.name),
   trainerNames:people.slice(0,4200).map(p=>p.name)};
  const names=createOrganizationNameRoster(args);
  assert.equal(names.model,ORGANIZATION_NAME_MODEL);
  assert.deepEqual(names.owners.slice(0,sourceNames.length),sourceNames);
  assert.equal(names.barns.length,4200);assert.equal(names.farms.length,900);
  assertNoDuplicates([...names.owners,...names.barns,...names.farms],'duplicate organization');
  assert.ok(names.farms.every(name=>!/\bFarm Farm\b|\bFarm Stud\b|\bStud Stud\b/i.test(name)));
  assert.ok(names.farmKinds.some(kind=>kind==='STUD_FARM'));
  assert.ok(names.farmKinds.some(kind=>kind==='FARM'));
  assert.deepEqual(createOrganizationNameRoster(args).farms,names.farms);
 }
});
test('1999 name wiring preserves canonical ownership and consistent farm references',()=>{
 const world=create1999Universe({seed:19990101});
 assert.equal(world.counts.owners,3308);
 assert.equal(world.counts.trainers,4200);
 assert.equal(world.counts.breedingFarms,900);
 assert.equal(world.counts.facilities,4200+900+world.counts.tracks);
 assert.equal(world.organizationNameModel,ORGANIZATION_NAME_MODEL);
 assert.equal(world.nameModel,PERSONNEL_NAME_MODEL);
 const historical=world.sourceOrganizations[0];
 assert.equal(world.ownerAt(0).id,historical.id);
 assert.equal(world.ownerAt(0).name,historical.name);
 const lateOwner=world.ownerAt(3307);
 assert.equal(lateOwner.nameStatus,'TEST_RENAME_ALLOWED');
 assert.equal(lateOwner.name,world.ownerAt(3307).name);
 const trainer=world.trainerAt(4199);
 const barn=world.facilityAt(4199);
 assert.equal(barn.trainerId,trainer.id);
 assert.equal(barn.id,trainer.barnId);
 assert.equal(barn.type,'RACE_BARN');
 assert.equal(barn.facilityClass,'RACING_STABLE');
 const farm=world.facilityAt(4200+217);
 assert.equal(farm.id,'F-TEST-FARM-000218');
 assert.ok(['FARM','STUD_FARM','THOROUGHBRED_NURSERY','BLOODSTOCK_FARM'].includes(farm.facilityClass));
 assert.equal(world.mareDirectoryAt(217).farm,farm.name);
 const trackOwnedCenter=world.facilityAt(4200+900);
 assert.equal(trackOwnedCenter.type,'TRAINING_CENTER');
 assert.ok(trackOwnedCenter.name.endsWith('Training Center'));
});
test('breaking-and-training facility names are separately generated and collision checked',()=>{
 const a=createBreakingTrainingNames(19990101,400,['Highpoint Training Center','Ashbourne Training Farm']);
 assert.equal(a.length,400);
 assertNoDuplicates(a,'duplicate breaking/training operation');
 assert.ok(!a.some(name=>['Highpoint Training Center','Ashbourne Training Farm'].includes(name)));
 assert.deepEqual(createBreakingTrainingNames(19990101,400,['Highpoint Training Center','Ashbourne Training Farm']),a);
});
