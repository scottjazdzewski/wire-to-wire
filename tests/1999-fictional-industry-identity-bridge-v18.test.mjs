import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 openDurableFictionalNameService,restoreDurableFictionalNamingBundle
} from '../public/1999/engine/durable-fictional-name-service.mjs';
import {
 restoreDurableOrganizationContinuityArchive
} from '../public/1999/engine/durable-organization-continuity-v17.mjs';
import {
 openFictionalIndustryIdentityBridge,FICTIONAL_INDUSTRY_IDENTITY_BRIDGE_MODEL
} from '../public/1999/engine/fictional-industry-identity-bridge-v18.mjs';

const clone=x=>JSON.parse(JSON.stringify(x));
const WORLD='V18-SYNTHETIC-ONLY';
const SEED=19990101;
const founders=[
 {id:'FOUNDER-OWNER',name:'Eliza Clarke',role:'owner',primarySurname:'Clarke',birthYear:1972},
 {id:'FOUNDER-TRAINER',name:'Warren Doyle',role:'trainer',primarySurname:'Doyle',birthYear:1975},
 {id:'FOUNDER-MANAGER',name:'Monica Price',role:'farm_manager',primarySurname:'Price',birthYear:1979}
];
const foundation=()=>({
 worldId:WORLD,foundingYear:1999,people:clone(founders),
 owners:[
  {id:'FOUND-COMPANY',name:'Hickory Ridge Racing',ownershipArchetype:'RACING_COMPANY',
   principalId:'FOUNDER-OWNER',namingRegion:'KENTUCKY'},
  {id:'FOUND-FAMILY',name:'Clarke Family Racing',ownershipArchetype:'FAMILY_OPERATION',
   familyName:'Clarke',principalId:'FOUNDER-OWNER',namingRegion:'KENTUCKY'}
 ],
 stables:[{id:'FOUND-STABLE',name:'Clover Rise Racing Stable',
  trainerId:'FOUNDER-TRAINER',namingRegion:'KENTUCKY'}],
 farms:[{id:'FOUND-FARM',name:'Clover Rise Stud',
  managerIds:['FOUNDER-MANAGER'],namingRegion:'KENTUCKY'}],
 trainingCenters:[]
});
const protectedPeople=founders.map(x=>x.name);
const protectedOrganizations=[
 'Hickory Ridge Racing','Clarke Family Racing','Clover Rise Racing Stable','Clover Rise Stud'
];
function namingMemory(){
 const rows=new Map();let fail=null;
 const key=(worldId,seed)=>worldId+':'+seed;
 return {
  failOnce(mode='ROLLBACK'){fail=mode},
  async read({worldId,seed}){return clone(rows.get(key(worldId,seed))??null)},
  async initialize(meta){
   const id=key(meta.worldId,meta.seed);
   if(rows.has(id))throw Error('Existing naming namespace');
   rows.set(id,{meta:clone(meta),batches:[]});
  },
  async append({worldId,seed,expectedRevision,batch,cursor}){
   const mode=fail;fail=null;
   if(mode==='ROLLBACK')throw Error('Synthetic naming disk rollback');
   const row=rows.get(key(worldId,seed));
   if(!row||row.meta.revision!==expectedRevision)
    throw Error('Stale persisted naming revision');
   row.batches.push(clone(batch));
   row.meta.revision=cursor.revision;
   row.meta.cursor=clone(cursor);
   if(mode==='AMBIGUOUS')throw Error('Synthetic naming post-commit interruption');
  },
  async restore({meta,batches}){
   const id=key(meta.worldId,meta.seed);
   if(rows.has(id))throw Error('Refusing to overwrite naming namespace');
   rows.set(id,clone({meta,batches}));
  }
 };
}
function continuityMemory(){
 const rows=new Map();let fail=null;
 return {
  failOnce(mode='ROLLBACK'){fail=mode},
  async read({worldId}){return clone(rows.get(worldId)??null)},
  async initialize(meta){
   if(rows.has(meta.worldId))throw Error('Existing continuity namespace');
   rows.set(meta.worldId,{meta:clone(meta),events:[]});
  },
  async append({worldId,expectedRevision,event,cursor}){
   const mode=fail;fail=null;
   if(mode==='ROLLBACK')throw Error('Synthetic continuity disk rollback');
   const row=rows.get(worldId);
   if(!row||row.meta.revision!==expectedRevision)
    throw Error('Stale persisted continuity revision');
   if(row.events.some(x=>x.eventId===event.eventId))
    throw Error('Duplicate persisted continuity event ID');
   row.events.push(clone(event));
   row.meta.revision=cursor.revision;
   row.meta.cursor=clone(cursor);
   if(mode==='AMBIGUOUS')throw Error('Synthetic continuity post-commit interruption');
  },
  async restore({meta,events}){
   if(rows.has(meta.worldId))throw Error('Refusing to overwrite continuity namespace');
   rows.set(meta.worldId,clone({meta,events}));
  }
 };
}
const openGenerator=(storage,other={})=>openDurableFictionalNameService({
 storage,worldId:WORLD,seed:SEED,...other
});
const openBridge=(names,continuity,other={})=>openFictionalIndustryIdentityBridge({
 namingStorage:names,continuityStorage:continuity,worldId:WORLD,seed:SEED,
 ...other
});
const ev=(eventId,type,organizationId,year,extra={})=>({
 eventId,sourceId:'SYNTHETIC_DOCUMENT_'+eventId,type,organizationId,year,...extra
});
async function setup(){
 const names=namingMemory(),continuity=continuityMemory();
 const generator=await openGenerator(names,{protectedPeople,protectedOrganizations});
 const issued=await generator.generate({
  year:2025,roles:{trainer:3,farm_manager:2},owners:3
 });
 const trainer=issued.people.find(x=>x.role==='trainer');
 const owner=issued.people.find(x=>x.role==='owner');
 const manager=issued.people.find(x=>x.role==='farm_manager');
 assert.ok(trainer&&owner&&manager);
 const bridge=await openBridge(names,continuity,{source:foundation(),
  familyLinkLookup:record=>record.sourceId==='VERIFIED_FAMILY_LINK'
 });
 return {names,continuity,generator,issued,trainer,owner,manager,bridge};
}
test('V18 registers V12-approved people once and preserves exact immutable identity through role succession',async()=>{
 const {names,continuity,issued,trainer,owner,manager,bridge}=await setup();
 assert.equal(bridge.model,FICTIONAL_INDUSTRY_IDENTITY_BRIDGE_MODEL);
 const original=foundation(),before=JSON.stringify(original);
 for(const person of [trainer,owner,manager]){
  await bridge.registerApprovedPerson({
   personId:person.id,eventId:'REGISTER-'+person.id,
   sourceId:'APPROVED_V12_TEST',year:2025
  });
  const identity=bridge.getPersonIdentity(person.id);
  assert.equal(identity.id,person.id);
  assert.equal(identity.name,person.name);
  assert.equal(identity.primarySurname,person.primarySurname);
  assert.equal(identity.birthYear,person.birthYear);
  assert.equal(identity.namingMetadata.birthCountry,person.birthCountry);
  assert.equal(identity.namingMetadata.nameOrigin,person.nameOrigin);
  assert.equal(identity.approvedByNamingRegistry,true);
  assert.equal(identity.registeredInContinuity,true);
 }
 await bridge.applyTransition({event:ev('TRAINER-SUCC','CHANGE_STABLE_TRAINER',
  'FOUND-STABLE',2026,{toPersonId:trainer.id})});
 await bridge.applyTransition({event:ev('OWNER-SUCC','CHANGE_OWNER_PRINCIPAL',
  'FOUND-COMPANY',2027,{toPersonId:owner.id})});
 await bridge.applyTransition({event:ev('FARM-SUCC','REPLACE_FARM_MANAGERS',
  'FOUND-FARM',2028,{toPersonIds:[manager.id]})});
 await bridge.applyTransition({event:ev('RETIRE-OLD','RETIRE_PERSON',null,2029,
  {personId:'FOUNDER-TRAINER'})});
 assert.equal(bridge.getOrganization('FOUND-STABLE').trainerId,trainer.id);
 assert.equal(bridge.getOrganization('FOUND-COMPANY').principalId,owner.id);
 assert.deepEqual(bridge.getOrganization('FOUND-FARM').managerIds,[manager.id]);
 assert.equal(bridge.getPersonIdentity('FOUNDER-TRAINER').retired,true);
 assert.equal(bridge.getPersonIdentity('FOUNDER-TRAINER').namingMetadata,null);
 assert.equal(bridge.getOrganization('FOUND-STABLE').name,original.stables[0].name);
 assert.equal(bridge.getOrganization('FOUND-FARM').id,original.farms[0].id);
 assert.equal(JSON.stringify(original),before);
 assert.equal((await continuity.read({worldId:WORLD})).events.length,7);
 assert.ok((await names.read({worldId:WORLD,seed:SEED})).batches[0].people.every(
  p=>p.identityMetadataV18?.model==='WTW_APPROVED_PERSON_NAMING_METADATA_V18'
 ));
 // All 1999 founders are separate from future approved naming identities.
 assert.equal(bridge.getPersonIdentity('FOUNDER-OWNER').approvedByNamingRegistry,false);
 assert.equal(issued.manifest.writtenToGame,false);
});
test('unapproved identity, role mismatch, duplicate event and invented family succession never persist',async()=>{
 const {bridge,trainer,owner,continuity}=await setup();
 let rev=bridge.continuityRevision;
 await assert.rejects(()=>bridge.registerApprovedPerson({
  personId:'FICTIONAL-IMPOSTER',eventId:'FAKE',sourceId:'FALSE',year:2025
 }),/not been durably approved/);
 await assert.rejects(()=>bridge.applyTransition({event:{
  type:'REGISTER_APPROVED_PERSON',eventId:'BYPASS',sourceId:'FALSE',
  year:2025,person:trainer
 }}),/Use registerApprovedPerson/);
 assert.equal(bridge.continuityRevision,rev);
 await bridge.registerApprovedPerson({personId:owner.id,
  eventId:'REG-OWNER',sourceId:'V12',year:2025});
 await assert.rejects(()=>bridge.registerApprovedPerson({personId:owner.id,
  eventId:'REG-OWNER',sourceId:'V12',year:2025}),/duplicated|Repeated|Stale/i);
 await assert.rejects(()=>bridge.applyTransition({event:ev('ROLE-MISMATCH',
  'CHANGE_STABLE_TRAINER','FOUND-STABLE',2026,{toPersonId:owner.id})}),
 /incompatible professional role/);
 await assert.rejects(()=>bridge.applyTransition({event:ev('FAMILY-FALSE',
  'CHANGE_OWNER_PRINCIPAL','FOUND-FAMILY',2026,{toPersonId:owner.id})}),
 /explicit family relationship/);
 await assert.rejects(()=>bridge.applyTransition({event:{
  eventId:'FABRICATE-FAMILY',sourceId:'SAME-SURNAME_NOT_EVIDENCE',
  type:'REGISTER_DOCUMENTED_FAMILY_LINK',year:2026,
  personAId:'FOUNDER-OWNER',personBId:owner.id,relationshipKind:'PARENT_CHILD'
 }}),/not been approved/);
 rev=bridge.continuityRevision;
 assert.equal(rev,1);
 assert.equal((await continuity.read({worldId:WORLD})).events.length,1);
 await bridge.applyTransition({event:{
  eventId:'DOC-LINK',sourceId:'VERIFIED_FAMILY_LINK',
  type:'REGISTER_DOCUMENTED_FAMILY_LINK',year:2026,
  personAId:'FOUNDER-OWNER',personBId:owner.id,relationshipKind:'PARENT_CHILD'
 }});
 await bridge.applyTransition({event:ev('FAMILY-VALID','CHANGE_OWNER_PRINCIPAL',
  'FOUND-FAMILY',2027,{toPersonId:owner.id})});
 assert.equal(bridge.getOrganization('FOUND-FAMILY').principalId,owner.id);
});
test('disk rollback, post-commit ambiguity, stale two-tab registration and restart recovery',async()=>{
 const {names,continuity,trainer,owner,bridge}=await setup();
 continuity.failOnce();
 await assert.rejects(()=>bridge.registerApprovedPerson({personId:trainer.id,
  eventId:'REG-FAILED',sourceId:'V12',year:2025}),/disk rollback/);
 assert.equal(bridge.getPersonIdentity(trainer.id).registeredInContinuity,false);
 assert.equal((await continuity.read({worldId:WORLD})).events.length,0);
 await assert.rejects(()=>bridge.registerApprovedPerson({personId:trainer.id,
  eventId:'REG-BLOCKED',sourceId:'V12',year:2025}),/requires a refresh/);
 await bridge.refresh();
 continuity.failOnce('AMBIGUOUS');
 await assert.rejects(()=>bridge.registerApprovedPerson({personId:trainer.id,
  eventId:'REG-AMBIGUOUS',sourceId:'V12',year:2025}),/post-commit interruption/);
 assert.equal(bridge.getPersonIdentity(trainer.id).registeredInContinuity,false);
 await bridge.refresh();
 assert.equal(bridge.getPersonIdentity(trainer.id).registeredInContinuity,true);
 assert.equal(bridge.continuityRevision,1);
 const second=await openBridge(names,continuity);
 await bridge.registerApprovedPerson({personId:owner.id,
  eventId:'REG-OWNER',sourceId:'V12',year:2025});
 await assert.rejects(()=>second.registerApprovedPerson({personId:owner.id,
  eventId:'CONCURRENT-DUP',sourceId:'V12',year:2025}),
  /Stale persisted continuity revision/);
 await second.refresh();
 assert.equal(second.getPersonIdentity(owner.id).registeredInContinuity,true);
 assert.equal((await continuity.read({worldId:WORLD})).events.length,2);
 const restarted=await openBridge(names,continuity);
 assert.equal(restarted.getPersonIdentity(trainer.id).name,trainer.name);
 assert.equal(restarted.getPersonIdentity(owner.id).namingMetadata.birthCountry,
  owner.birthCountry);
 assert.equal(restarted.continuityRevision,2);
});
test('naming rollback has no approved person and legacy V12 metadata stays explicitly unknown',async()=>{
 const names=namingMemory();
 const generator=await openGenerator(names);
 names.failOnce();
 await assert.rejects(()=>generator.generate({year:2026,
  roles:{trainer:1}}),/naming disk rollback/);
 assert.equal(generator.namesIssued,0);
 assert.equal((await names.read({worldId:WORLD,seed:SEED})).batches.length,0);
 await generator.refresh();
 const created=await generator.generate({year:2026,roles:{trainer:1}});
 const trainer=created.people.find(x=>x.role==='trainer');
 assert.equal(generator.getApprovedPersonIdentity(trainer.id).name,trainer.name);
 const record=(await names.read({worldId:WORLD,seed:SEED}));
 delete record.batches[0].people[0].identityMetadataV18;
 const legacy=namingMemory();
 await legacy.restore({meta:record.meta,batches:record.batches});
 const reopened=await openGenerator(legacy);
 assert.equal(reopened.getApprovedPersonIdentity(trainer.id).namingMetadata,null);
 assert.equal(reopened.getApprovedPerson(trainer.id).id,trainer.id);
});
test('paired versioned archive restore preserves identities and never replaces an existing namespace',async()=>{
 const {names,continuity,trainer,bridge}=await setup();
 await bridge.registerApprovedPerson({personId:trainer.id,
  eventId:'ARCH-REG',sourceId:'V12',year:2025});
 await bridge.applyTransition({event:ev('ARCH-TRAINER','CHANGE_STABLE_TRAINER',
  'FOUND-STABLE',2026,{toPersonId:trainer.id})});
 const namingBundle=await bridge.exportNamingBundle();
 const continuityArchive=await bridge.exportContinuityArchive();
 const namesNew=namingMemory(),orgsNew=continuityMemory();
 await restoreDurableFictionalNamingBundle({storage:namesNew,bundle:namingBundle});
 await restoreDurableOrganizationContinuityArchive({
  storage:orgsNew,archive:continuityArchive
 });
 const restored=await openBridge(namesNew,orgsNew);
 assert.equal(restored.getOrganization('FOUND-STABLE').trainerId,trainer.id);
 assert.equal(restored.getPersonIdentity(trainer.id).namingMetadata.birthCountry,
  trainer.birthCountry);
 await assert.rejects(()=>restoreDurableOrganizationContinuityArchive({
  storage:orgsNew,archive:continuityArchive
 }),/overwrite/);
 assert.equal((await names.read({worldId:WORLD,seed:SEED})).batches.length,1);
 assert.equal((await continuity.read({worldId:WORLD})).events.length,2);
});
test('V18 is an isolated opt-in capability; nothing imports it into the 1999 start or career save',()=>{
 const code=readFileSync(new URL('../public/1999/engine/fictional-industry-identity-bridge-v18.mjs',
  import.meta.url),'utf8');
 const active=readFileSync(new URL('../public/1999/engine/founding-world-1999.mjs',
  import.meta.url),'utf8');
 assert.doesNotMatch(active,/fictional-industry-identity-bridge-v18/);
 assert.doesNotMatch(code,/\b(?:fetch|localStorage|setItem|writeFile)\s*\(/);
 assert.doesNotMatch(code,/\.generate\s*\(/);
});
