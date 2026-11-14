import test from 'node:test';
import assert from 'node:assert/strict';
import {createFictionalWorldNameEngine}
 from '../public/1999/engine/fictional-world-name-engine.mjs';
import {createFictionalOrganizationContinuityRegistry}
 from '../public/1999/engine/fictional-organization-continuity-v16.mjs';
import {
 openDurableOrganizationContinuityService,
 restoreDurableOrganizationContinuityArchive,
 PORTABLE_ORGANIZATION_CONTINUITY_MODEL
} from '../public/1999/engine/durable-organization-continuity-v17.mjs';

const clone=x=>structuredClone(x);
function foundation(worldId='V17-QUALITY-NAMESPACE'){
 const world=createFictionalWorldNameEngine({
  worldId,seed:19990101,year:1999,
  roles:{trainer:18,jockey:12,farm_manager:5,bloodstock_agent:4},
  owners:25,facilities:{generalFarms:2,studFarms:1,breakingTraining:1},
  ownerNamingPolicy:{partnershipLimit:4,soleOwnerPercent:24}
 });
 return {...world,worldId};
}
function memoryStore(){
 const journals=new Map();
 let failBefore=false,failAfter=false;
 return {
  failBeforeNext(){failBefore=true},
  failAfterNext(){failAfter=true},
  async read({worldId}){
   return clone(journals.get(worldId)??null);
  },
  async initialize(meta){
   if(journals.has(meta.worldId))throw Error('Duplicate world foundation');
   journals.set(meta.worldId,{meta:clone(meta),events:[]});
  },
  async append({worldId,expectedRevision,event,cursor}){
   if(failBefore){failBefore=false;throw Error('SIMULATED_DURABLE_WRITE_REJECTED')}
   const journal=journals.get(worldId);
   if(!journal||journal.meta.revision!==expectedRevision)
    throw Error('Stale persisted organizational continuity revision');
   if(event.revision!==expectedRevision+1||cursor.revision!==event.revision)
    throw Error('Invalid event revision');
   if(journal.events.some(x=>x.eventId===event.eventId))
    throw Error('Duplicate committed event');
   journal.events.push(clone(event));
   journal.meta={...journal.meta,revision:cursor.revision,cursor:clone(cursor)};
   if(failAfter){failAfter=false;throw Error('SIMULATED_AMBIGUOUS_POST_COMMIT_FAILURE')}
  },
  async restore({meta,events}){
   if(journals.has(meta.worldId))throw Error('Refusing existing continuity world overwrite');
   if(meta.revision!==events.length)throw Error('Invalid restored event count');
   journals.set(meta.worldId,clone({meta,events}));
  }
 };
}
const event=(id,type,organizationId,year,other={})=>({
 eventId:id,type,organizationId,year,
 sourceId:'DISPOSABLE_TEST_EVENT_'+id,...other
});
test('V16 dry-run validates a real transition without committing an event or altering any identity',()=>{
 const world=foundation('V17-PREVIEW-PURITY');
 const reg=createFictionalOrganizationContinuityRegistry({source:world});
 const stable=world.stables[0];
 const newTrainer=world.people.find(x=>x.role==='trainer'&&x.id!==stable.trainerId);
 const before=JSON.stringify(reg.exportSnapshot());
 const submitted=event('PREVIEW-ONLY','CHANGE_STABLE_TRAINER',stable.id,2022,{
  toPersonId:newTrainer.id
 });
 const projection=reg.preview({expectedRevision:0,event:submitted});
 assert.equal(projection.revision,1);
 assert.equal(projection.eventCount,1);
 assert.equal(reg.revision,0);
 assert.equal(reg.getOrganization(stable.id).trainerId,stable.trainerId);
 assert.equal(JSON.stringify(reg.exportSnapshot()),before);
 assert.deepEqual(reg.apply({expectedRevision:0,event:submitted}),projection);
 assert.equal(reg.getOrganization(stable.id).trainerId,newTrainer.id);
 assert.equal(reg.getOrganization(stable.id).name,stable.name);
 assert.equal(reg.getHistory(stable.id).length,1);
 assert.throws(()=>reg.preview({expectedRevision:1,event:event(
  'BAD-NAME','CHANGE_STABLE_TRAINER',stable.id,2023,{toPersonId:'NOT_REAL'}
 )}),/existing active person/);
 assert.equal(reg.eventCount,1);
});
test('durable journal rejects a failed append without minting phantom transitions',async()=>{
 const world=foundation('V17-DURABLE-ROLLBACK'),storage=memoryStore();
 const service=await openDurableOrganizationContinuityService({
  storage,worldId:world.worldId,source:world
 });
 const stable=world.stables[0];
 const alternate=world.people.find(p=>p.role==='trainer'&&p.id!==stable.trainerId);
 const entry=event('WRITE-FAIL','CHANGE_STABLE_TRAINER',stable.id,2020,{
  toPersonId:alternate.id
 });
 const before=JSON.stringify(service.getOrganization(stable.id));
 storage.failBeforeNext();
 await assert.rejects(()=>service.apply({expectedRevision:0,event:entry}),
  /SIMULATED_DURABLE_WRITE_REJECTED/);
 assert.equal(service.revision,0);
 assert.equal(service.eventCount,0);
 assert.equal(JSON.stringify(service.getOrganization(stable.id)),before);
 assert.equal((await storage.read({worldId:world.worldId})).events.length,0);
 await assert.rejects(()=>service.apply({expectedRevision:0,event:entry}),/refresh/);
 await service.refresh();
 const receipt=await service.apply({expectedRevision:0,event:entry});
 assert.equal(receipt.revision,1);
 assert.equal(service.getOrganization(stable.id).name,stable.name);
 assert.equal(service.getOrganization(stable.id).trainerId,alternate.id);
 assert.equal((await storage.read({worldId:world.worldId})).events.length,1);
});
test('ambiguous post-commit failure requires refresh, never retries a committed event ID',async()=>{
 const world=foundation('V17-AMBIGUOUS-WRITE'),storage=memoryStore();
 const service=await openDurableOrganizationContinuityService({
  storage,worldId:world.worldId,source:world
 });
 const stable=world.stables[0],original=stable.trainerId;
 const alt=world.people.find(x=>x.role==='trainer'&&x.id!==original).id;
 const transition=event('COMMITTED-THEN-ERROR','CHANGE_STABLE_TRAINER',
  stable.id,2020,{toPersonId:alt});
 storage.failAfterNext();
 await assert.rejects(()=>service.apply({expectedRevision:0,event:transition}),
  /SIMULATED_AMBIGUOUS_POST_COMMIT_FAILURE/);
 assert.equal(service.revision,0);
 assert.equal((await storage.read({worldId:world.worldId})).events.length,1);
 await service.refresh();
 assert.equal(service.revision,1);
 assert.equal(service.getOrganization(stable.id).trainerId,alt);
 assert.equal(service.getOrganization(stable.id).name,stable.name);
 await assert.rejects(()=>service.apply({expectedRevision:1,event:transition}),
  /Repeated continuity event ID/);
 const back=event('TRANSFER-BACK','CHANGE_STABLE_TRAINER',stable.id,2021,
  {toPersonId:original});
 await service.apply({expectedRevision:1,event:back});
 assert.equal(service.getOrganization(stable.id).trainerId,original);
});
test('two independently opened naming-continuity clients cannot overwrite a newer journal',async()=>{
 const world=foundation('V17-TWO-TABS'),storage=memoryStore();
 const a=await openDurableOrganizationContinuityService({
  storage,worldId:world.worldId,source:world
 });
 const b=await openDurableOrganizationContinuityService({
  storage,worldId:world.worldId
 });
 const stable=world.stables[0],alt=world.people.find(
  x=>x.role==='trainer'&&x.id!==stable.trainerId
 );
 await a.apply({expectedRevision:0,event:event(
  'TAB-A','CHANGE_STABLE_TRAINER',stable.id,2030,{toPersonId:alt.id}
 )});
 await assert.rejects(()=>b.apply({expectedRevision:0,event:event(
  'TAB-B','CLOSE_ORGANIZATION',stable.id,2030
 )}),/Stale persisted organizational continuity revision/);
 assert.equal(b.revision,0);
 assert.equal(b.getOrganization(stable.id).trainerId,stable.trainerId);
 await b.refresh();
 assert.equal(b.revision,1);
 await b.apply({expectedRevision:1,event:event(
  'TAB-B-RECOVERED','CLOSE_ORGANIZATION',stable.id,2031
 )});
 await a.refresh();
 assert.equal(a.revision,2);
 assert.equal(a.getOrganization(stable.id).status,'CLOSED');
 assert.equal(a.getOrganization(stable.id).name,stable.name);
 assert.equal(a.getHistory(stable.id).length,2);
});
test('portable event backup restores the same owners and stables without renaming them',async()=>{
 const world=foundation('V17-PORTABLE-RECOVERY'),storage=memoryStore();
 const original=await openDurableOrganizationContinuityService({
  storage,worldId:world.worldId,source:world
 });
 const stable=world.stables[1],owner=world.owners.find(
  o=>o.ownershipArchetype==='PRIVATE_RACING_OPERATION'
 );
 const trainer=world.people.find(p=>p.role==='trainer'&&p.id!==stable.trainerId);
 const nextOwner=world.people.find(p=>p.role==='owner'&&p.id!==owner.principalId);
 await original.apply({expectedRevision:0,event:event(
  'HANDOVER','CHANGE_OWNER_PRINCIPAL',owner.id,2025,{toPersonId:nextOwner.id}
 )});
 await original.apply({expectedRevision:1,event:event(
  'TRAINER','CHANGE_STABLE_TRAINER',stable.id,2026,{toPersonId:trainer.id}
 )});
 await original.apply({expectedRevision:2,event:event(
  'CLOSED','CLOSE_ORGANIZATION',stable.id,2027
 )});
 const archive=await original.exportArchive();
 assert.equal(archive.model,PORTABLE_ORGANIZATION_CONTINUITY_MODEL);
 assert.equal(archive.revision,3);
 const destination=memoryStore();
 const recovered=await restoreDurableOrganizationContinuityArchive({
  storage:destination,archive
 });
 assert.deepEqual(recovered.cursor,original.cursor);
 assert.deepEqual(recovered.getOrganization(owner.id,{withHistory:true}),
  original.getOrganization(owner.id,{withHistory:true}));
 assert.deepEqual(recovered.getOrganization(stable.id,{withHistory:true}),
  original.getOrganization(stable.id,{withHistory:true}));
 assert.equal(recovered.getOrganization(owner.id).name,owner.name);
 assert.equal(recovered.getOrganization(stable.id).name,stable.name);
 await assert.rejects(()=>restoreDurableOrganizationContinuityArchive({
  storage:destination,archive
 }),/overwrite/);
 const corrupted=clone(archive);
 corrupted.snapshot.events[0].toPersonId='FORGED-SUCCESSOR';
 await assert.rejects(()=>restoreDurableOrganizationContinuityArchive({
  storage:memoryStore(),archive:corrupted
 }),/damaged/);
});
test('long event journal checkpoints stay bounded while original organization and name persist',async()=>{
 const world=foundation('V17-MANY-EVENTS'),storage=memoryStore();
 const reg=await openDurableOrganizationContinuityService({
  storage,worldId:world.worldId,source:world
 });
 const stable=world.stables[0];
 const alt=world.people.find(p=>p.role==='trainer'&&p.id!==stable.trainerId).id;
 let firstBytes=0;
 for(let i=0;i<400;i++){
  const change=event('V17-'+i,'CHANGE_STABLE_TRAINER',stable.id,
   2000+Math.floor(i/20),{toPersonId:i%2===0?alt:stable.trainerId});
  const receipt=await reg.apply({expectedRevision:i,event:change});
  const bytes=JSON.stringify(receipt).length;
  if(!firstBytes)firstBytes=bytes;
  assert.ok(bytes<260);
  assert.ok(bytes-firstBytes<18);
 }
 assert.equal(reg.eventCount,400);
 assert.equal(reg.getHistory(stable.id).length,400);
 assert.equal(reg.getOrganization(stable.id).name,stable.name);
 const resumed=await openDurableOrganizationContinuityService({
  storage,worldId:world.worldId
 });
 assert.equal(resumed.revision,400);
 assert.equal(resumed.getOrganization(stable.id).trainerId,stable.trainerId);
 assert.equal(resumed.getOrganization(stable.id).name,stable.name);
 assert.equal((await storage.read({worldId:world.worldId})).events.length,400);
});
