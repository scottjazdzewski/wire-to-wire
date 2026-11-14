import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createFictionalWorldNameEngine}
 from '../public/1999/engine/fictional-world-name-engine.mjs';
import {createFictionalOrganizationContinuityRegistry,
 sealFictionalOrganizationContinuitySnapshot}
 from '../public/1999/engine/fictional-organization-continuity-v16.mjs';
import {openDurableOrganizationContinuityService,
 restoreDurableOrganizationContinuityArchive,
 DURABLE_ORGANIZATION_CONTINUITY_MODEL}
 from '../public/1999/engine/durable-organization-continuity-v17.mjs';
import {
 createIndexedDBOrganizationContinuityStore,
 INDEXEDDB_ORGANIZATION_CONTINUITY_DB
} from '../public/1999/engine/indexeddb-organization-continuity-v17.mjs';

const copy=x=>JSON.parse(JSON.stringify(x));
const worldId='V17-TEST-INDUSTRY';
const getWorld=()=>createFictionalWorldNameEngine({
 worldId,seed:19990101,year:1999,
 roles:{trainer:35,jockey:18,farm_manager:12},
 owners:50,facilities:{generalFarms:5,studFarms:3,nurseries:2,breakingTraining:2},
 ownerNamingPolicy:{partnershipLimit:7,soleOwnerPercent:23}
});
const founding=world=>({...world,worldId});
const evt=(id,type,organizationId,year,changes={})=>({
 eventId:id,sourceId:'SIMULATED_CONTINUITY_TEST_'+id,
 type,organizationId,year,...changes
});
function memoryStore(){
 const rows=new Map();let fail=false;
 return {
  failOnce(){fail=true},
  async read({worldId}){return copy(rows.get(worldId)??null)},
  async initialize(meta){
   if(rows.has(meta.worldId))throw Error('Already initialized');
   rows.set(meta.worldId,{meta:copy(meta),events:[]});
  },
  async append({worldId,expectedRevision,event,cursor}){
   if(fail){fail=false;throw Error('Simulated interrupted durable commit')}
   const item=rows.get(worldId);
   if(!item||item.meta.revision!==expectedRevision)
    throw Error('Stale persisted organizational continuity revision');
   if(item.events.some(e=>e.eventId===event.eventId))
    throw Error('Duplicated continuity event ID');
   item.events.push(copy(event));
   item.meta.revision=cursor.revision;
   item.meta.cursor=copy(cursor);
  },
  async restore({meta,events}){
   if(rows.has(meta.worldId))
    throw Error('Refusing to overwrite existing organizational journal');
   rows.set(meta.worldId,copy({meta,events}));
  }
 };
}
test('V16 preflight is truly read-only and checks the exact transition before a commit',()=>{
 const world=getWorld(),reg=createFictionalOrganizationContinuityRegistry({
  source:founding(world)
 });
 const stable=world.stables[0],trainer=world.people.find(p=>
  p.role==='trainer'&&p.id!==stable.trainerId);
 const first=evt('P1','CHANGE_STABLE_TRAINER',stable.id,2020,{
  toPersonId:trainer.id
 });
 const before=copy(reg.exportSnapshot()),preview=reg.preview({
  expectedRevision:0,event:first
 });
 assert.equal(preview.revision,1);
 assert.equal(reg.revision,0);
 assert.equal(reg.getOrganization(stable.id).trainerId,stable.trainerId);
 assert.deepEqual(reg.exportSnapshot(),before);
 assert.deepEqual(reg.apply({expectedRevision:0,event:first}),preview);
 assert.equal(reg.getOrganization(stable.id).trainerId,trainer.id);
 assert.throws(()=>reg.preview({expectedRevision:1,event:evt(
  'P2','CHANGE_STABLE_TRAINER',stable.id,2021,{toPersonId:'NOT_A_TRAINER'}
 )}),/existing active person/);
 assert.equal(reg.revision,1);
 assert.equal(reg.eventCount,1);
});
test('durable journal preserves all organization IDs and names across succession, closure and restart',async()=>{
 const world=getWorld(),unmodified=JSON.stringify(world),storage=memoryStore();
 let svc=await openDurableOrganizationContinuityService({
  storage,worldId,source:founding(world)
 });
 const owner=world.owners.find(x=>x.ownershipArchetype==='PRIVATE_RACING_OPERATION'),
  successor=world.people.find(x=>x.role==='owner'&&x.id!==owner.principalId),
  stable=world.stables[0],
  trainer=world.people.find(x=>x.role==='trainer'&&x.id!==stable.trainerId),
  farm=world.farms[0];
 const actions=[
  evt('C1','CHANGE_OWNER_PRINCIPAL',owner.id,2020,{toPersonId:successor.id}),
  evt('C2','CHANGE_STABLE_TRAINER',stable.id,2021,{toPersonId:trainer.id}),
  evt('C3','CLOSE_ORGANIZATION',farm.id,2022),
  evt('C4','REOPEN_ORGANIZATION',farm.id,2025),
  evt('C5','RELOCATE_ORGANIZATION',farm.id,2027,{
   location:{city:'Paris',region:'Kentucky',countryCode:'US'},
   namingRegion:'KENTUCKY'
  })
 ];
 for(const event of actions){
  const previous=svc.revision;
  const cursor=await svc.apply({expectedRevision:previous,event});
  assert.equal(cursor.revision,previous+1);
  assert.ok(JSON.stringify(cursor).length<280);
 }
 const persisted=await storage.read({worldId});
 assert.equal(persisted.events.length,5);
 assert.equal(persisted.meta.revision,5);
 assert.ok(!persisted.events.some(x=>x.previousSnapshot||x.worldState));
 assert.equal(svc.getOrganization(owner.id).id,owner.id);
 assert.equal(svc.getOrganization(owner.id).name,owner.name);
 assert.equal(svc.getOrganization(owner.id).principalId,successor.id);
 assert.equal(svc.getOrganization(stable.id).name,stable.name);
 assert.equal(svc.getOrganization(farm.id).name,farm.name);
 assert.equal(svc.getOrganization(farm.id).location.city,'Paris');
 svc=await openDurableOrganizationContinuityService({storage,worldId});
 assert.equal(svc.revision,5);
 assert.equal(svc.getOrganization(owner.id).principalId,successor.id);
 assert.equal(svc.getOrganization(farm.id).status,'ACTIVE');
 assert.equal(svc.getHistory(farm.id).length,3);
 assert.equal(JSON.stringify(world),unmodified);
});
test('competing sessions cannot commit the same revision; interrupted disk writes mint no phantom event',async()=>{
 const world=getWorld(),storage=memoryStore();
 const a=await openDurableOrganizationContinuityService({
  storage,worldId,source:founding(world)
 });
 const b=await openDurableOrganizationContinuityService({storage,worldId});
 const stable=world.stables[0],trainer=world.people.find(x=>
  x.role==='trainer'&&x.id!==stable.trainerId);
 const one=evt('LOCK1','CHANGE_STABLE_TRAINER',stable.id,2008,{
  toPersonId:trainer.id
 });
 await a.apply({expectedRevision:0,event:one});
 await assert.rejects(()=>b.apply({expectedRevision:0,event:one}),
  /Stale persisted organizational continuity/);
 assert.equal(b.revision,0);
 await assert.rejects(()=>b.apply({expectedRevision:0,event:one}),
  /requires a refresh/);
 await b.refresh();
 assert.equal(b.revision,1);
 storage.failOnce();
 const previous=copy(b.cursor),before=copy(b.getOrganization(stable.id));
 await assert.rejects(()=>b.apply({expectedRevision:1,event:evt(
  'LOCK2','CLOSE_ORGANIZATION',stable.id,2013
 )}),/Simulated interrupted durable/);
 assert.deepEqual(b.cursor,previous);
 assert.deepEqual(b.getOrganization(stable.id),before);
 assert.equal((await storage.read({worldId})).events.length,1);
 await b.refresh();
 await b.apply({expectedRevision:1,event:evt(
  'LOCK3','CLOSE_ORGANIZATION',stable.id,2013
 )});
 assert.equal(b.getOrganization(stable.id).status,'CLOSED');
 assert.equal((await storage.read({worldId})).events.length,2);
});
test('approved new trainer and documented-family changes are validated before durable persistence',async()=>{
 const world=getWorld(),storage=memoryStore(),name={
  id:'P-APPROVED-2030',name:'Rafael Gómez',role:'trainer',
  primarySurname:'Gómez',birthYear:2002
 };
 const svc=await openDurableOrganizationContinuityService({
  storage,worldId,source:founding(world),
  approvedPersonLookup:id=>id===name.id?name:null
 });
 await assert.rejects(()=>svc.apply({expectedRevision:0,event:{
  type:'REGISTER_APPROVED_PERSON',eventId:'APPROVE-FAKE',
  sourceId:'NAMING_SOURCE_2030',year:2030,
  person:{...name,name:'Invented Name'}
 }}),/does not match/);
 assert.equal(svc.revision,0);
 await svc.apply({expectedRevision:0,event:{
  type:'REGISTER_APPROVED_PERSON',eventId:'APPROVED-1',
  sourceId:'NAMING_SOURCE_2030',year:2030,person:name
 }});
 const stable=world.stables[0];
 await svc.apply({expectedRevision:1,event:evt(
  'FUTURE-TRAINER','CHANGE_STABLE_TRAINER',stable.id,2031,{toPersonId:name.id}
 )});
 assert.equal(svc.getOrganization(stable.id).id,stable.id);
 assert.equal(svc.getOrganization(stable.id).trainerId,name.id);
 const restored=await openDurableOrganizationContinuityService({storage,worldId});
 assert.equal(restored.getPerson(name.id).name,name.name);
 assert.equal(restored.getOrganization(stable.id).trainerId,name.id);
 assert.equal(restored.revision,2);
});
test('signed V16 continuity backup imports atomically, refuses overwrite and rejects corruption',async()=>{
 const world=getWorld(),storage=memoryStore();
 const svc=await openDurableOrganizationContinuityService({
  storage,worldId,source:founding(world)
 });
 await svc.apply({expectedRevision:0,event:evt(
  'ARCH1','CLOSE_ORGANIZATION',world.farms[0].id,2020
 )});
 await svc.apply({expectedRevision:1,event:evt(
  'ARCH2','REOPEN_ORGANIZATION',world.farms[0].id,2024
 )});
 const archive=await svc.exportArchive();
 const target=memoryStore();
 const imported=await restoreDurableOrganizationContinuityArchive({
  storage:target,archive
 });
 assert.equal(imported.model,DURABLE_ORGANIZATION_CONTINUITY_MODEL);
 assert.deepEqual(imported.cursor,svc.cursor);
 assert.equal(imported.getOrganization(world.farms[0].id).name,world.farms[0].name);
 await assert.rejects(()=>restoreDurableOrganizationContinuityArchive({
  storage:target,archive
 }),/overwrite existing/);
 const broken=copy(archive);
 broken.snapshot.events[0].organizationId='FAKE-ORG';
 await assert.rejects(()=>restoreDurableOrganizationContinuityArchive({
  storage:memoryStore(),archive:broken
 }),/Invalid or damaged/);
});
test('1000 append-only lifecycle events keep cursor compact and histories in separate storage',async()=>{
 const world=getWorld(),storage=memoryStore();
 const svc=await openDurableOrganizationContinuityService({
  storage,worldId,source:founding(world)
 });
 const farm=world.farms[0];
 for(let i=0;i<1000;i++){
  const rev=svc.revision;
  await svc.apply({expectedRevision:rev,event:evt(
   'LOAD-'+i,i%2===0?'CLOSE_ORGANIZATION':'REOPEN_ORGANIZATION',
   farm.id,1999+Math.floor(i/11)
  )});
 }
 const data=await storage.read({worldId});
 assert.equal(data.events.length,1000);
 assert.equal(data.meta.revision,1000);
 assert.ok(JSON.stringify(svc.cursor).length<280);
 assert.equal(svc.getOrganization(farm.id).status,'ACTIVE');
 assert.equal(svc.getHistory(farm.id).length,1000);
 const reopened=await openDurableOrganizationContinuityService({storage,worldId});
 assert.equal(reopened.revision,1000);
 assert.equal(reopened.getOrganization(farm.id).name,farm.name);
});
test('V17 persistence remains isolated from the active game, founding world, horses and existing career saves',()=>{
 const files=['durable-organization-continuity-v17.mjs',
  'indexeddb-organization-continuity-v17.mjs'];
 const code=files.map(name=>readFileSync(new URL(
  '../public/1999/engine/'+name,import.meta.url),'utf8')).join('\n');
 const founding=readFileSync(new URL(
  '../public/1999/engine/founding-world-1999.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(founding, /fictional-organization-continuity-v16/);
 assert.doesNotMatch(code,/\b(?:fetch|localStorage|setItem|writeFile)\s*\(/);
 assert.equal(INDEXEDDB_ORGANIZATION_CONTINUITY_DB,
  'WireToWireFictionalContinuityV17');
 assert.throws(()=>createIndexedDBOrganizationContinuityStore({
  indexedDBFactory:null
 }),/IndexedDB unavailable/);
});
