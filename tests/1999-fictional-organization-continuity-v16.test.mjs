import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createFictionalWorldNameEngine}
 from '../public/1999/engine/fictional-world-name-engine.mjs';
import {createIndexedFictionalNameRegistry,generateIndexedFictionalNames}
 from '../public/1999/engine/indexed-fictional-name-registry.mjs';
import {
 createFictionalOrganizationContinuityRegistry,
 FICTIONAL_ORGANIZATION_CONTINUITY_MODEL,
 FICTIONAL_ORGANIZATION_CONTINUITY_SNAPSHOT,CONTINUITY_EVENT_TYPES
} from '../public/1999/engine/fictional-organization-continuity-v16.mjs';

const config={worldId:'V16-CONTINUITY-TEST',seed:19990101,year:1999,
 roles:{trainer:50,jockey:30,farm_manager:15,bloodstock_agent:5},owners:80,
 facilities:{generalFarms:6,studFarms:4,nurseries:2,
  bloodstockFarms:1,breakingTraining:2},
 ownerNamingPolicy:{partnershipLimit:8,soleOwnerPercent:25}};
function testWorld(){
 return createFictionalWorldNameEngine(config);
}
function origin(world,links=[]){
 return {...world,worldId:config.worldId,familyLinks:links};
}
const ev=(eventId,type,organizationId,year=2020,extra={})=>({
 eventId,type,organizationId,year,sourceId:'SIMULATED_GAME_EVENT_'+eventId,...extra
});
const norm=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[^a-z0-9]+/g,'');

test('V16 establishes read-only continuity indexes without changing existing 1999 names',()=>{
 const world=testWorld(),unchanged=JSON.stringify(world);
 const reg=createFictionalOrganizationContinuityRegistry({source:origin(world)});
 const expectedCount=world.owners.length+world.stables.length+
  world.farms.length+world.trainingCenters.length;
 assert.equal(reg.model,FICTIONAL_ORGANIZATION_CONTINUITY_MODEL);
 assert.equal(reg.revision,0);
 assert.equal(reg.year,1999);
 assert.equal(reg.organizationCount,expectedCount);
 assert.equal(reg.eventCount,0);
 assert.ok(JSON.stringify(reg.cursor).length<300);
 assert.deepEqual(reg.listOrganizations({kind:'OWNER',limit:200}).map(o=>o.name),
  world.owners.map(o=>o.name));
 assert.equal(JSON.stringify(world),unchanged);
 const stable=reg.getOrganization(world.stables[0].id);
 assert.equal(stable.name,world.stables[0].name);
 assert.equal(stable.trainerId,world.stables[0].trainerId);
 assert.equal(stable.originalName,world.stables[0].name);
 assert.ok(Object.isFrozen(stable));
 assert.ok(Object.isFrozen(reg.getHistory(stable.id)));
});
test('ownership succession, trainer replacement and manager changes retain permanent organization identity',()=>{
 const world=testWorld();
 const owner=world.owners.find(o=>o.ownershipArchetype==='PRIVATE_RACING_OPERATION'),
  oldOwner=world.people.find(p=>p.id===owner.principalId),
  newOwner=world.people.find(p=>p.role==='owner'&&p.id!==oldOwner.id);
 const stable=world.stables[0],
  newTrainer=world.people.find(p=>p.role==='trainer'&&p.id!==stable.trainerId);
 const farm=world.farms.find(f=>f.managerIds.length>0),
  oldManager=farm.managerIds[0],
  manager=world.people.find(p=>p.role==='farm_manager'&&p.id!==oldManager);
 assert.ok(owner&&stable&&farm&&newOwner&&newTrainer&&manager);
 const reg=createFictionalOrganizationContinuityRegistry({source:origin(world)});
 let next=reg.apply({expectedRevision:0,event:ev(
  'E1','CHANGE_OWNER_PRINCIPAL',owner.id,2015,{toPersonId:newOwner.id}
 )});
 assert.equal(next.revision,1);
 next=reg.apply({expectedRevision:1,event:ev(
  'E2','CHANGE_STABLE_TRAINER',stable.id,2016,{toPersonId:newTrainer.id}
 )});
 next=reg.apply({expectedRevision:2,event:ev(
  'E3','REPLACE_FARM_MANAGERS',farm.id,2017,{toPersonIds:[manager.id]}
 )});
 assert.equal(next.revision,3);
 assert.equal(reg.organizationCount,world.owners.length+world.stables.length+
  world.farms.length+world.trainingCenters.length);
 const nowOwner=reg.getOrganization(owner.id,{withHistory:true});
 assert.equal(nowOwner.id,owner.id);
 assert.equal(nowOwner.name,owner.name);
 assert.equal(nowOwner.principalId,newOwner.id);
 assert.equal(nowOwner.history.length,1);
 assert.equal(nowOwner.history[0].sourceId,'SIMULATED_GAME_EVENT_E1');
 assert.equal(reg.getOrganization(stable.id).id,stable.id);
 assert.equal(reg.getOrganization(stable.id).name,stable.name);
 assert.equal(reg.getOrganization(stable.id).trainerId,newTrainer.id);
 assert.deepEqual(reg.getOrganization(farm.id).managerIds,[manager.id]);
 assert.equal(reg.getOrganization(farm.id).name,farm.name);
 // Only after the stable and farm responsibilities moved may the former
 // employees retire. If a former manager serves a second active farm, the
 // registry must refuse to retire that person prematurely.
 if(!reg.listOrganizations({kind:'STABLE',limit:100}).some(
  x=>x.trainerId===stable.trainerId&&x.status==='ACTIVE')){
  reg.apply({expectedRevision:reg.revision,event:{
   type:'RETIRE_PERSON',personId:stable.trainerId,year:2018,
   sourceId:'SIM_RETIRE_TRAINER',eventId:'E4'
  }});
  assert.equal(reg.getPerson(stable.trainerId).retired,true);
 }
 assert.equal(JSON.stringify(world),JSON.stringify(testWorld()));
});
test('family succession requires explicitly supplied family evidence; individual owner cannot transfer',()=>{
 const world=testWorld(),fam=world.owners.find(o=>
  o.ownershipArchetype==='FAMILY_OPERATION'&&o.familyName);
 assert.ok(fam);
 const newPrincipal=world.people.find(p=>p.role==='owner'&&p.id!==fam.principalId);
 assert.ok(newPrincipal);
 const familyLinks=[{
  kind:'PARENT_CHILD',personAId:fam.principalId,
  personBId:newPrincipal.id,sourceId:'DECLARED_SIMULATED_RELATIONSHIP'
 }];
 const strict=createFictionalOrganizationContinuityRegistry({source:origin(world)});
 const transition=ev('F1','CHANGE_OWNER_PRINCIPAL',fam.id,2030,{
  toPersonId:newPrincipal.id
 });
 assert.throws(()=>strict.apply({expectedRevision:0,event:transition}),
  /explicit family relationship/);
 assert.equal(strict.revision,0);
 const proven=createFictionalOrganizationContinuityRegistry({
  source:origin(world,familyLinks)
 });
 proven.apply({expectedRevision:0,event:transition});
 const business=proven.getOrganization(fam.id);
 assert.equal(business.id,fam.id);
 assert.equal(business.name,fam.name);
 assert.equal(business.principalId,newPrincipal.id);
 assert.equal(business.familyName,fam.familyName);
 // Different surnames do not erase an existing established family brand.
 assert.ok(typeof business.familyName==='string');
 const individual=world.owners.find(o=>o.ownershipArchetype==='INDIVIDUAL_OWNER');
 assert.ok(individual);
 assert.throws(()=>proven.apply({expectedRevision:1,event:ev(
  'F2','CHANGE_OWNER_PRINCIPAL',individual.id,2031,
  {toPersonId:newPrincipal.id}
 )}),/sole person/);
 assert.equal(proven.revision,1);
});
test('invalid people, duplicate events, non-chronological changes and wrong roles cannot corrupt the registry',()=>{
 const world=testWorld(),reg=createFictionalOrganizationContinuityRegistry({
  source:origin(world)
 });
 const stable=world.stables[0],owner=world.owners.find(o=>
  o.ownershipArchetype==='PRIVATE_RACING_OPERATION');
 const unknown=ev('BAD1','CHANGE_STABLE_TRAINER',stable.id,2005,{
  toPersonId:'PERSON-WHO-DOES-NOT-EXIST'
 });
 assert.throws(()=>reg.apply({expectedRevision:0,event:unknown}),
  /existing active person/);
 assert.throws(()=>reg.apply({expectedRevision:0,event:ev(
  'BAD2','CHANGE_STABLE_TRAINER',stable.id,2005,{toPersonId:owner.principalId}
 )}),/professional role/);
 assert.throws(()=>reg.apply({expectedRevision:0,event:ev(
  'BAD3','CHANGE_OWNER_PRINCIPAL',owner.id,2005,
  {toPersonId:owner.principalId}
 )}),/unchanged/);
 assert.equal(reg.revision,0);
 const trainer=world.people.find(p=>p.role==='trainer'&&p.id!==stable.trainerId);
 reg.apply({expectedRevision:0,event:ev(
  'PASS1','CHANGE_STABLE_TRAINER',stable.id,2006,{toPersonId:trainer.id}
 )});
 assert.throws(()=>reg.apply({expectedRevision:0,event:ev(
  'PASS2','CHANGE_STABLE_TRAINER',stable.id,2007,
  {toPersonId:stable.trainerId}
 )}),/Stale/);
 assert.throws(()=>reg.apply({expectedRevision:1,event:ev(
  'PASS1','CLOSE_ORGANIZATION',stable.id,2008
 )}),/Repeated continuity event/);
 assert.throws(()=>reg.apply({expectedRevision:1,event:ev(
  'BAD4','CLOSE_ORGANIZATION',stable.id,2000
 )}),/Continuity year/);
 assert.throws(()=>reg.apply({expectedRevision:1,event:ev(
  'BAD5','RETIRE_PERSON',null,2009,{personId:trainer.id}
 )}),/Transfer all active/);
 assert.equal(reg.revision,1);
 assert.equal(reg.getOrganization(stable.id).trainerId,trainer.id);
 assert.equal(reg.getHistory(stable.id).length,1);
});
test('closed facilities reopen with same ID, original name and explicit geographic history',()=>{
 const world=testWorld(),farm=world.farms[0];
 const reg=createFictionalOrganizationContinuityRegistry({source:origin(world)});
 const original=farm.name;
 reg.apply({expectedRevision:0,event:ev(
  'L1','RELOCATE_ORGANIZATION',farm.id,2021,
  {location:{city:'Paris',region:'Kentucky',countryCode:'US'},
   namingRegion:'KENTUCKY'}
 )});
 assert.equal(reg.getOrganization(farm.id).location.city,'Paris');
 assert.throws(()=>reg.apply({expectedRevision:1,event:ev(
  'BADLOC','RELOCATE_ORGANIZATION',farm.id,2022,
  {location:{city:'Unknown'},namingRegion:'KENTUCKY'}
 )}),/explicit city/);
 reg.apply({expectedRevision:1,event:ev(
  'L2','CLOSE_ORGANIZATION',farm.id,2024
 )});
 assert.equal(reg.getOrganization(farm.id).status,'CLOSED');
 assert.throws(()=>reg.apply({expectedRevision:2,event:ev(
  'BAD-CLOSED','REPLACE_FARM_MANAGERS',farm.id,2025,{toPersonIds:[]}
 )}),/closed operation/i);
 reg.apply({expectedRevision:2,event:ev(
  'L3','REOPEN_ORGANIZATION',farm.id,2027
 )});
 const restored=reg.getOrganization(farm.id,{withHistory:true});
 assert.equal(restored.id,farm.id);
 assert.equal(restored.name,original);
 assert.equal(restored.location.city,'Paris');
 assert.equal(restored.status,'ACTIVE');
 assert.equal(restored.history.length,3);
 assert.equal(reg.listOrganizations({status:'CLOSED',limit:100}).length,0);
});
test('portable continuity archive fully restores and rejects any modified event or original name',()=>{
 const world=testWorld(),stable=world.stables[1],
  trainer=world.people.find(p=>p.role==='trainer'&&p.id!==stable.trainerId);
 const reg=createFictionalOrganizationContinuityRegistry({source:origin(world)});
 reg.apply({expectedRevision:0,event:ev(
  'P1','CHANGE_STABLE_TRAINER',stable.id,2010,{toPersonId:trainer.id}
 )});
 reg.apply({expectedRevision:1,event:ev(
  'P2','CLOSE_ORGANIZATION',stable.id,2020
 )});
 const snapshot=JSON.parse(JSON.stringify(reg.exportSnapshot()));
 assert.equal(snapshot.schema,FICTIONAL_ORGANIZATION_CONTINUITY_SNAPSHOT);
 const fromDisk=createFictionalOrganizationContinuityRegistry({snapshot});
 assert.equal(fromDisk.revision,2);
 assert.deepEqual(fromDisk.cursor,reg.cursor);
 assert.deepEqual(fromDisk.getOrganization(stable.id,{withHistory:true}),
  reg.getOrganization(stable.id,{withHistory:true}));
 assert.equal(fromDisk.getOrganization(stable.id).name,stable.name);
 const original=JSON.stringify(snapshot);
 const bad=JSON.parse(original);
 bad.events[0].toPersonId='TAMPERED_NONEXISTENT_PERSON_ID';
 assert.throws(()=>createFictionalOrganizationContinuityRegistry({snapshot:bad}),
  /damaged/);
 const rewritten=JSON.parse(original);
 rewritten.original.stables[1].name='Rebranded With No Evidence';
 assert.throws(()=>createFictionalOrganizationContinuityRegistry({
  snapshot:rewritten
 }),/damaged/);
 const truncated=JSON.parse(original);
 truncated.events[0].revision=111;
 assert.throws(()=>createFictionalOrganizationContinuityRegistry({
  snapshot:truncated
 }),/damaged/);
 assert.throws(()=>createFictionalOrganizationContinuityRegistry({
  source:origin(world),snapshot
 }),/Do not overwrite/);
});
test('1,000 scripted management changes have small cursor and append-only replay history',()=>{
 const world=testWorld(),reg=createFictionalOrganizationContinuityRegistry({
  source:origin(world)
 });
 const stable=world.stables[0],initial=stable.trainerId,
  alt=world.people.find(p=>p.role==='trainer'&&p.id!==initial).id;
 const beforeCount=reg.organizationCount;
 let firstSize=0;
 for(let i=0;i<1000;i++){
  const event=ev('M'+i,'CHANGE_STABLE_TRAINER',stable.id,
   2000+Math.floor(i/50),{toPersonId:i%2===0?alt:initial});
  const cursor=reg.apply({expectedRevision:i,event});
  const size=JSON.stringify(cursor).length;
  if(i===0)firstSize=size;
  assert.ok(size<260);
  assert.ok(size-firstSize<20);
 }
 assert.equal(reg.revision,1000);
 assert.equal(reg.eventCount,1000);
 assert.equal(reg.organizationCount,beforeCount);
 assert.equal(reg.getHistory(stable.id).length,1000);
 assert.equal(reg.getOrganization(stable.id).trainerId,initial);
 const snapshot=reg.exportSnapshot();
 assert.ok(JSON.stringify(snapshot).length>JSON.stringify(reg.cursor).length*100);
 const recovered=createFictionalOrganizationContinuityRegistry({snapshot});
 assert.equal(recovered.revision,1000);
 assert.equal(recovered.getOrganization(stable.id).name,stable.name);
 assert.equal(recovered.getOrganization(stable.id).trainerId,initial);
});
test('future successor is accepted only after separate naming-registry identity approval',()=>{
 const world=testWorld(),seed=19990101,worldId=config.worldId;
 const protectedOrganizations=[...world.owners,...world.stables,
  ...world.farms,...world.trainingCenters].map(x=>x.name);
 const names=createIndexedFictionalNameRegistry({
  worldId,seed,protectedPeople:world.people.map(x=>x.name),
  protectedOrganizations
 });
 const batch=generateIndexedFictionalNames({
  registry:names,worldId,seed,year:2030,roles:{trainer:4,farm_manager:3},
  owners:6,facilities:{generalFarms:1},maxPartnershipGroups:2
 });
 const newPerson=batch.people.find(p=>p.role==='owner'),
  futureTrainer=batch.people.find(p=>p.role==='trainer');
 assert.ok(newPerson&&futureTrainer);
 const accepted=names.getApprovedPerson(newPerson.id);
 assert.deepEqual(accepted,{
  id:newPerson.id,name:newPerson.name,role:'owner',
  primarySurname:newPerson.primarySurname,birthYear:newPerson.birthYear
 });
 const owner=world.owners.find(o=>o.ownershipArchetype==='PRIVATE_RACING_OPERATION'),
  stable=world.stables[0],reg=createFictionalOrganizationContinuityRegistry({
   source:origin(world),approvedPersonLookup:id=>names.getApprovedPerson(id)
  });
 const payload={
  id:newPerson.id,name:newPerson.name,role:newPerson.role,
  primarySurname:newPerson.primarySurname,birthYear:newPerson.birthYear
 };
 const proposed={type:'REGISTER_APPROVED_PERSON',person:{...payload},
  eventId:'NEW1',sourceId:'ACCEPTED_NAME_BATCH_2030',year:2030};
 const forged={...proposed,eventId:'FORGED',
  person:{...payload,name:'Invented Replacement'}};
 assert.throws(()=>reg.apply({expectedRevision:0,event:forged}),
  /does not match the approved naming registry/);
 assert.equal(reg.revision,0);
 reg.apply({expectedRevision:0,event:proposed});
 assert.equal(reg.getPerson(newPerson.id).name,newPerson.name);
 const trainerPayload={
  id:futureTrainer.id,name:futureTrainer.name,role:futureTrainer.role,
  primarySurname:futureTrainer.primarySurname,birthYear:futureTrainer.birthYear
 };
 reg.apply({expectedRevision:1,event:{
  type:'REGISTER_APPROVED_PERSON',person:trainerPayload,
  eventId:'NEW2',sourceId:'ACCEPTED_NAME_BATCH_2030',year:2030
 }});
 reg.apply({expectedRevision:2,event:ev(
  'SUCC1','CHANGE_OWNER_PRINCIPAL',owner.id,2031,{toPersonId:newPerson.id}
 )});
 reg.apply({expectedRevision:3,event:ev(
  'SUCC2','CHANGE_STABLE_TRAINER',stable.id,2031,{toPersonId:futureTrainer.id}
 )});
 assert.equal(reg.getOrganization(owner.id).name,owner.name);
 assert.equal(reg.getOrganization(owner.id).principalId,newPerson.id);
 assert.equal(reg.getOrganization(stable.id).name,stable.name);
 assert.equal(reg.getOrganization(stable.id).trainerId,futureTrainer.id);
 const restored=createFictionalOrganizationContinuityRegistry({
  snapshot:JSON.parse(JSON.stringify(reg.exportSnapshot()))
 });
 assert.equal(restored.revision,4);
 assert.equal(restored.getPerson(newPerson.id).name,newPerson.name);
 assert.equal(restored.getOrganization(owner.id).principalId,newPerson.id);
 assert.equal(restored.getOrganization(stable.id).trainerId,futureTrainer.id);
});
test('new family relationships require supplied verified lineage rather than equal surnames',()=>{
 const world=testWorld(),family=world.owners.find(x=>
  x.ownershipArchetype==='FAMILY_OPERATION');
 const incoming=world.people.find(p=>p.role==='owner'&&p.id!==family.principalId);
 assert.ok(family&&incoming);
 const relation={type:'REGISTER_DOCUMENTED_FAMILY_LINK',
  eventId:'LINK-1',sourceId:'EXPLICIT_FAMILY_GENEALOGY_RECORD',
  personAId:family.principalId,personBId:incoming.id,
  relationshipKind:'PARENT_CHILD',year:2028};
 const reg=createFictionalOrganizationContinuityRegistry({
  source:origin(world),
  familyLinkLookup:record=>record.sourceId==='EXPLICIT_FAMILY_GENEALOGY_RECORD'
 });
 assert.throws(()=>createFictionalOrganizationContinuityRegistry({
  source:origin(world)
 }).apply({expectedRevision:0,event:relation}),/not been approved/);
 reg.apply({expectedRevision:0,event:relation});
 reg.apply({expectedRevision:1,event:ev(
  'SUCC-FAMILY','CHANGE_OWNER_PRINCIPAL',family.id,2029,{
   toPersonId:incoming.id
  }
 )});
 assert.equal(reg.getOrganization(family.id).name,family.name);
 const restored=createFictionalOrganizationContinuityRegistry({
  snapshot:reg.exportSnapshot()
 });
 assert.equal(restored.getOrganization(family.id).principalId,incoming.id);
 assert.equal(restored.revision,2);
 assert.equal(restored.getOrganization(family.id).familyName,family.familyName);
});
test('V16 creates no world entities, horse names, save writes or UI changes',()=>{
 const code=readFileSync(new URL(
  '../public/1999/engine/fictional-organization-continuity-v16.mjs',
  import.meta.url),'utf8');
 const founding=readFileSync(new URL(
  '../public/1999/engine/founding-world-1999.mjs',
  import.meta.url),'utf8');
 assert.ok(CONTINUITY_EVENT_TYPES.includes('CHANGE_OWNER_PRINCIPAL'));
 assert.ok(!CONTINUITY_EVENT_TYPES.includes('CREATE_ORGANIZATION'));
 assert.doesNotMatch(code,/\b(?:fetch|localStorage|indexedDB|writeFile|setItem)\s*\(/);
 assert.doesNotMatch(founding,/fictional-organization-continuity-v16/);
});
