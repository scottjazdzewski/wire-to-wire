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
  assert.equal(names.summary.maxDistinctiveRootUses,6);
  assert.ok(names.summary.highestDistinctiveRootUse<=6,
   'a distinctive business name family was overused');
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


test('role-conditioned professions have a wide mix of name structures without fake family suffixes',()=>{
 const seeded=createPersonnelNameRoster(19990101,STAFF_COUNT+3308,roleAt,['Gabe Larkin','Nico Arroyo']);
 const byStyle=seeded.reduce((out,p)=>(out[p.nameStyle]=(out[p.nameStyle]||0)+1,out),{});
 assert.ok((byStyle.MIDDLE_INITIAL||0)>500,'middle-name diversity collapsed');
 assert.ok((byStyle.TWO_SURNAMES||0)>100,'international naming variety collapsed');
 assert.ok((byStyle.COMPOUND_GIVEN_NAME||0)>40,'compound names not represented');
 assert.ok((byStyle.PROFESSIONAL_TITLE||0)>50,'professional naming patterns missing');
 assert.ok((byStyle.COMMON_NICKNAME||0)>20,'rider/farrier nickname patterns missing');
 assert.ok(!seeded.some(p=>/\s(?:Jr\.?|III|IV)$/i.test(p.name)),'fictional family claims should not be fabricated');
 assert.ok(seeded.filter(p=>p.nameStyle==='TWO_SURNAMES').every(p=>['PR','PA','VE','MX','CL','PE','CO','DO'].includes(p.birthCountry)));
 assert.ok(seeded.filter(p=>p.nameStyle==='PROFESSIONAL_TITLE').every(p=>p.role==='veterinarian'));
});
test('900 distinct farm identities have their own commercial purpose, without cloning historical farm brands',()=>{
 const seed=19990101,staff=createPersonnelNameRoster(seed,STAFF_COUNT+3308,roleAt);
 const sources=['Kingsmere Farm','Crescent Mile Stud','Blue Lantern Racing','Marrowfield Farm'];
 const o=createOrganizationNameRoster({seed,ownerCount:3308,barnCount:4200,farmCount:900,breakingCount:400,
  protectedNames:[...sources,'Gabe Larkin','Nico Arroyo'],
  sourceOwnerNames:sources,
  principalNames:staff.slice(STAFF_COUNT).map(p=>p.name),
  trainerNames:staff.slice(0,4200).map(p=>p.name)});
 const names=[...o.owners,...o.barns,...o.farms,...o.breakingCenters];
 assertNoDuplicates(names,'full generated business directory contains collisions');
 const sourceBrandRoots=sources.map(s=>normalized(s.replace(/\b(Farm|Stud|Racing)\b/gi,''))).filter(x=>x.length>=7);
 assert.ok(names.slice(sources.length).every(n=>!sourceBrandRoots.some(root=>normalized(n).startsWith(root))),
  'generated brand illegally clones a protected historic brand');
 assert.equal(o.breakingCenters.length,400);
 // Exact-duplicate screening is insufficient. Swapping Racing, Stud and Farm
 // after the same landmark repeatedly still looks like a duplicated business.
 const distinctiveRoots=['Union Hill','River City','Trade Wind','Iron Gate',
  'Old Dominion','Highpoint','Landmark','Westline','Redline','Stonefield'];
 for(const root of distinctiveRoots){
  const rootPrefix=root.toLowerCase()+' ';
  const repeated=names.filter(s=>s.replace(/^The\\s+/i,'').toLowerCase().startsWith(rootPrefix));
  assert.ok(repeated.length<=6,
   root+' was reused '+repeated.length+' times in the 1999 business population');
 }
 assert.equal(o.summary.maxDistinctiveRootUses,6);
 assert.ok(o.summary.highestDistinctiveRootUse<=6);
 assert.ok(o.summary.retries>=0);
 assert.ok(o.farms.every((name,i)=>{
  const k=o.farmKinds[i];
  if(k==='STUD_FARM')return /\b(?:Stud|Stallion)\b/i.test(name);
  if(k==='THOROUGHBRED_NURSERY')return /\bNursery\b/i.test(name);
  if(k==='BLOODSTOCK_FARM')return /\b(?:Bloodstock|Thoroughbreds)\b/i.test(name);
  return /\b(?:Farm|Farms|Farmstead)\b/i.test(name);
 }));
 assert.ok(!names.some(s=>/Three Chimneys|Farm Farm|Stud Stud|Stud Farm Stud/i.test(s)),'unwanted brand or malformed suffix');
 assert.ok(o.barns.every((name,i)=>name.toLowerCase().includes(staff[i].name.split(/\s+/).at(-1).toLowerCase())),
  'trainer-led racing stables must keep their trainer name');
 assert.deepEqual(createOrganizationNameRoster({seed,ownerCount:3308,barnCount:4200,farmCount:900,breakingCount:400,
  protectedNames:[...sources,'Gabe Larkin','Nico Arroyo'],sourceOwnerNames:sources,
  principalNames:staff.slice(STAFF_COUNT).map(p=>p.name),
  trainerNames:staff.slice(0,4200).map(p=>p.name)}).farms,o.farms);
});
