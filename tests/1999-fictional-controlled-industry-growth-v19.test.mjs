import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 openDurableFictionalNameService,restoreDurableFictionalNamingBundle,
 APPROVED_ORGANIZATION_REGISTRATION_MODEL
} from '../public/1999/engine/durable-fictional-name-service.mjs';
import {
 openDurableOrganizationContinuityService,
 restoreDurableOrganizationContinuityArchive
} from '../public/1999/engine/durable-organization-continuity-v17.mjs';
import {openFictionalIndustryIdentityBridge}
 from '../public/1999/engine/fictional-industry-identity-bridge-v18.mjs';

const copy=x=>JSON.parse(JSON.stringify(x));
const WORLD='V19-DISPOSABLE-INDUSTRY';
const SEED=19990101;
const founders=[
 {id:'FOUNDER-OWN',name:'Anne Brewer',role:'owner',primarySurname:'Brewer',birthYear:1974},
 {id:'FOUNDER-TRAIN',name:'Walter Brooks',role:'trainer',primarySurname:'Brooks',birthYear:1973},
 {id:'FOUNDER-MGR',name:'Rita Greene',role:'farm_manager',primarySurname:'Greene',birthYear:1972}
];
function founding(){
 return {worldId:WORLD,foundingYear:1999,people:copy(founders),
  owners:[{id:'FOUNDER-COMPANY',name:'Granite Creek Racing',
   ownershipArchetype:'RACING_COMPANY',principalId:'FOUNDER-OWN',
   namingRegion:'KENTUCKY'}],
  stables:[{id:'FOUNDER-STABLE',name:'Stone Creek Racing Stable',
   trainerId:'FOUNDER-TRAIN',namingRegion:'KENTUCKY'}],
  farms:[{id:'FOUNDER-FARM',name:'Cypress Hollow Stud',
   managerIds:['FOUNDER-MGR'],namingRegion:'KENTUCKY'}],
  trainingCenters:[]};
}
function namingMemory(){
 const map=new Map();let failure=null;
 const key=(worldId,seed)=>worldId+':'+seed;
 return {
  failNext(mode='ROLLBACK'){failure=mode},
  async read({worldId,seed}){return copy(map.get(key(worldId,seed))??null)},
  async initialize(meta){
   const k=key(meta.worldId,meta.seed);
   if(map.has(k))throw Error('Naming already initialized');
   map.set(k,{meta:copy(meta),batches:[]});
  },
  async append({worldId,seed,expectedRevision,batch,cursor}){
   const mode=failure;failure=null;
   if(mode==='ROLLBACK')throw Error('Synthetic naming rollback');
   const item=map.get(key(worldId,seed));
   if(!item||item.meta.revision!==expectedRevision)
    throw Error('Stale persisted naming revision');
   item.batches.push(copy(batch));
   item.meta.revision=cursor.revision;
   item.meta.cursor=copy(cursor);
   if(mode==='AMBIGUOUS')throw Error('Synthetic naming uncertain commit');
  },
  async restore({meta,batches}){
   const k=key(meta.worldId,meta.seed);
   if(map.has(k))throw Error('Naming archive overwrite rejected');
   map.set(k,copy({meta,batches}));
  }
 };
}
function continuityMemory(){
 const map=new Map();let failure=null;
 return {
  failNext(mode='ROLLBACK'){failure=mode},
  async read({worldId}){return copy(map.get(worldId)??null)},
  async initialize(meta){
   if(map.has(meta.worldId))throw Error('Continuity already initialized');
   map.set(meta.worldId,{meta:copy(meta),events:[]});
  },
  async append({worldId,expectedRevision,event,cursor}){
   const mode=failure;failure=null;
   if(mode==='ROLLBACK')throw Error('Synthetic continuity rollback');
   const item=map.get(worldId);
   if(!item||item.meta.revision!==expectedRevision)
    throw Error('Stale persisted continuity revision');
   if(item.events.some(x=>x.eventId===event.eventId))
    throw Error('Repeated persisted continuity event');
   item.events.push(copy(event));
   item.meta.revision=cursor.revision;
   item.meta.cursor=copy(cursor);
   if(mode==='AMBIGUOUS')throw Error('Synthetic continuity uncertain commit');
  },
  async restore({meta,events}){
   if(map.has(meta.worldId))throw Error('Continuity archive overwrite rejected');
   map.set(meta.worldId,copy({meta,events}));
  }
 };
}
const namingOpts={worldId:WORLD,seed:SEED};
const newNames=(store,opts={})=>openDurableFictionalNameService({
 storage:store,...namingOpts,...opts
});
const newBridge=(names,orgs,opts={})=>openFictionalIndustryIdentityBridge({
 namingStorage:names,continuityStorage:orgs,...namingOpts,...opts
});
const growSpec=year=>({
 year,roles:{trainer:4,farm_manager:4},owners:8,
 facilities:{generalFarms:2,studFarms:1,nurseries:1,breakingTraining:1}
});
async function setup(){
 const names=namingMemory(),orgs=continuityMemory();
 const naming=await newNames(names,{
  protectedPeople:founders.map(x=>x.name),
  protectedOrganizations:['Granite Creek Racing','Stone Creek Racing Stable','Cypress Hollow Stud']
 });
 const issued=await naming.generate(growSpec(2025));
 const bridge=await newBridge(names,orgs,{source:founding()});
 return {names,orgs,naming,issued,bridge};
}
async function registerPeople(bridge,people,year){
 for(const p of people)await bridge.registerApprovedPerson({
  personId:p.id,eventId:'PERSON-'+p.id,sourceId:'SYNTHETIC_V19_APPROVAL',
  year
 });
}
async function registerOrganizations(bridge,organizations,year){
 for(const organization of organizations)await bridge.registerApprovedOrganization({
  organizationId:organization.id,eventId:'BUSINESS-'+organization.id,
  sourceId:'SYNTHETIC_V19_APPROVAL',year
 });
}
const allFirms=issued=>[
 ...issued.owners,...issued.stables,...issued.farms,...issued.trainingCenters
];
const event=(id,type,organizationId,year,rest={})=>({
 eventId:id,type,organizationId,sourceId:'SYNTHETIC_EVENT_'+id,year,...rest
});
test('V19 permanent approved ownership firms, racing stables, farms and training centers enter only by explicit event',async()=>{
 const {names,orgs,naming,issued,bridge}=await setup();
 const original=founding(),frozen=JSON.stringify(original);
 const firms=allFirms(issued);
 assert.equal(bridge.continuityRevision,0);
 assert.equal(bridge.getOrganization(issued.owners[0].id),null);
 assert.equal(bridge.getApprovedOrganizationIdentity(issued.owners[0].id).registration.kind,'OWNER');
 assert.equal(bridge.getApprovedOrganizationIdentity(issued.stables[0].id).registration.kind,'STABLE');
 assert.equal(bridge.getApprovedOrganizationIdentity(issued.farms[0].id).registration.kind,'FARM');
 assert.equal(bridge.getApprovedOrganizationIdentity(issued.trainingCenters[0].id).registration.kind,'TRAINING_CENTER');
 await assert.rejects(()=>bridge.registerApprovedOrganization({
  organizationId:issued.stables[0].id,eventId:'TOO-SOON',
  sourceId:'SYNTHETIC',year:2025
 }),/existing active person/);
 assert.equal(bridge.continuityRevision,0);
 assert.equal((await orgs.read({worldId:WORLD})).events.length,0);
 await registerPeople(bridge,issued.people,2025);
 const beforeNames=naming.namesIssued;
 await registerOrganizations(bridge,firms,2025);
 assert.equal(naming.namesIssued,beforeNames);
 for(const f of firms){
  const active=bridge.getOrganization(f.id);
  const approval=bridge.getApprovedOrganizationIdentity(f.id);
  assert.equal(active.id,f.id);
  assert.equal(active.name,f.name);
  assert.equal(active.originalName,f.name);
  assert.equal(active.kind,approval.registration.kind);
  assert.equal(active.namingRegion,approval.registration.namingRegion);
  assert.deepEqual(active.location,approval.registration.location);
  assert.equal(active.status,'ACTIVE');
  assert.equal(bridge.getHistory(f.id).length,1);
  assert.equal(bridge.getHistory(f.id)[0].type,'REGISTER_APPROVED_ORGANIZATION');
  assert.equal(bridge.getOrganizationIdentity(f.id).registeredInContinuity,true);
 }
 assert.equal(bridge.getOrganization(issued.owners[0].id).principalId,
  issued.owners[0].principalId);
 assert.equal(bridge.getOrganization(issued.stables[0].id).trainerId,
  issued.stables[0].trainerId);
 assert.deepEqual(bridge.getOrganization(issued.farms[0].id).managerIds,
  issued.farms[0].managerIds);
 assert.equal(bridge.getOrganization(issued.farms[0].id).facilityKind,
  issued.farms[0].kind);
 assert.equal(bridge.getOrganization('FOUNDER-STABLE').name,original.stables[0].name);
 assert.equal(JSON.stringify(original),frozen);
 assert.equal(issued.manifest.writtenToGame,false);
 const row=(await names.read({worldId:WORLD,seed:SEED})).batches[0];
 assert.equal(row.organizations.length,firms.length);
 assert.ok(row.organizations.every(x=>
  x.registrationV19?.model===APPROVED_ORGANIZATION_REGISTRATION_MODEL));
 assert.ok(JSON.stringify(bridge.continuityCursor).length<300);
});
test('V19 cannot register unknown, legacy untyped, forged, duplicate or premature business identities',async()=>{
 const {names,orgs,naming,issued,bridge}=await setup();
 const org=issued.owners[0],approved=bridge.getApprovedOrganizationIdentity(org.id);
 await assert.rejects(()=>bridge.registerApprovedOrganization({
  organizationId:'FAKE-ORG',eventId:'FAKE',sourceId:'SIM',year:2025
 }),/no durable V19 typed naming approval/);
 await assert.rejects(()=>bridge.registerApprovedOrganization({
  organizationId:org.id,eventId:'PREMATURE',sourceId:'SIM',year:2024
 }),/prematurely registered/);
 // Direct callers of V17 are still protected by V16's authoritative lookup.
 const guarded=await openDurableOrganizationContinuityService({
  storage:orgs,worldId:WORLD,
  approvedOrganizationLookup:id=>naming.getApprovedOrganizationIdentity(id)
 });
 await assert.rejects(()=>guarded.apply({expectedRevision:0,event:{
  eventId:'FORGERY',sourceId:'SIM',type:'REGISTER_APPROVED_ORGANIZATION',
  organization:{...approved,name:'Invented Owner Company'},year:2025
 }}),/does not match the approved naming registry/);
 await assert.rejects(()=>bridge.applyTransition({event:{
  eventId:'BYPASS',sourceId:'SIM',type:'REGISTER_APPROVED_ORGANIZATION',
  organization:approved,year:2025
 }}),/Use registerApprovedOrganization/);
 assert.equal((await orgs.read({worldId:WORLD})).events.length,0);
 await registerPeople(bridge,issued.people,2025);
 await bridge.registerApprovedOrganization({organizationId:org.id,
  eventId:'VALID',sourceId:'SIM',year:2025});
 await assert.rejects(()=>bridge.registerApprovedOrganization({organizationId:org.id,
  eventId:'DUPLICATE',sourceId:'SIM',year:2025}),/duplicate/);
 await assert.rejects(()=>bridge.registerApprovedOrganization({organizationId:org.id,
  eventId:'VALID',sourceId:'SIM',year:2025}),/Repeated|duplicate/i);
 assert.equal(bridge.getHistory(org.id).length,1);
 assert.equal(bridge.getOrganization(org.id).name,org.name);
 const legacyData=await names.read({worldId:WORLD,seed:SEED});
 for(const row of legacyData.batches)
  for(const item of row.organizations)delete item.registrationV19;
 const oldStore=namingMemory();
 await oldStore.restore({meta:legacyData.meta,batches:legacyData.batches});
 const older=await newNames(oldStore);
 assert.equal(older.getApprovedOrganizationIdentity(org.id).registration,null);
 const legacyBridge=await newBridge(oldStore,continuityMemory(),{source:founding()});
 await assert.rejects(()=>legacyBridge.registerApprovedOrganization({
  organizationId:org.id,eventId:'LEGACY-UNVERIFIED',sourceId:'SIM',year:2025
 }),/no durable V19 typed naming approval/);
});
test('V19 disk interruptions, stale tabs, restart recovery and exact succession are safe',async()=>{
 const {names,orgs,issued,bridge}=await setup();
 await registerPeople(bridge,issued.people,2025);
 const stable=issued.stables[0],otherTrainer=issued.people.find(x=>
  x.role==='trainer'&&x.id!==stable.trainerId);
 orgs.failNext('ROLLBACK');
 await assert.rejects(()=>bridge.registerApprovedOrganization({
  organizationId:stable.id,eventId:'FAIL',sourceId:'SIM',year:2025
 }),/Synthetic continuity rollback/);
 assert.equal(bridge.getOrganization(stable.id),null);
 assert.equal(bridge.continuityRevision,issued.people.length);
 await assert.rejects(()=>bridge.registerApprovedOrganization({
  organizationId:stable.id,eventId:'BLOCKED',sourceId:'SIM',year:2025
 }),/requires a refresh/);
 await bridge.refresh();
 orgs.failNext('AMBIGUOUS');
 await assert.rejects(()=>bridge.registerApprovedOrganization({
  organizationId:stable.id,eventId:'AMBIG',sourceId:'SIM',year:2025
 }),/Synthetic continuity uncertain commit/);
 assert.equal(bridge.getOrganization(stable.id),null);
 await bridge.refresh();
 assert.equal(bridge.getOrganization(stable.id).name,stable.name);
 assert.equal(bridge.getHistory(stable.id)[0].eventId,'AMBIG');
 const stale=await newBridge(names,orgs);
 const nextFirm=issued.farms[0];
 await bridge.registerApprovedOrganization({organizationId:nextFirm.id,
  eventId:'WINNER',sourceId:'SIM',year:2025});
 await assert.rejects(()=>stale.registerApprovedOrganization({
  organizationId:issued.owners[0].id,eventId:'LOSER',sourceId:'SIM',year:2025
 }),/Stale persisted continuity revision/);
 await stale.refresh();
 assert.equal(stale.getOrganization(nextFirm.id).name,nextFirm.name);
 await stale.applyTransition({event:event('TRAINER-CHANGE','CHANGE_STABLE_TRAINER',
  stable.id,2026,{toPersonId:otherTrainer.id})});
 const result=stale.getOrganization(stable.id);
 assert.equal(result.id,stable.id);
 assert.equal(result.name,stable.name);
 assert.equal(result.trainerId,otherTrainer.id);
 const restarted=await newBridge(names,orgs);
 assert.equal(restarted.getOrganization(stable.id).trainerId,otherTrainer.id);
 assert.equal(restarted.getHistory(stable.id).length,2);
 assert.equal((await orgs.read({worldId:WORLD})).events.length,
  issued.people.length+3);
});
test('V19 paired existing V12 and V17 archives restore added organizations without duplicates',async()=>{
 const {names,orgs,issued,bridge}=await setup();
 await registerPeople(bridge,issued.people,2025);
 const farm=issued.farms[0];
 await bridge.registerApprovedOrganization({
  organizationId:farm.id,eventId:'FARM-ADMIT',sourceId:'SIM',year:2025
 });
 await bridge.applyTransition({event:event('FARM-CLOSE',
  'CLOSE_ORGANIZATION',farm.id,2026)});
 await bridge.applyTransition({event:event('FARM-REOPEN',
  'REOPEN_ORGANIZATION',farm.id,2027)});
 const restoredNames=namingMemory(),restoredOrgs=continuityMemory();
 await restoreDurableFictionalNamingBundle({
  storage:restoredNames,bundle:await bridge.exportNamingBundle()
 });
 const archive=await bridge.exportContinuityArchive();
 await restoreDurableOrganizationContinuityArchive({
  storage:restoredOrgs,archive
 });
 const resumed=await newBridge(restoredNames,restoredOrgs);
 assert.equal(resumed.getOrganization(farm.id).id,farm.id);
 assert.equal(resumed.getOrganization(farm.id).name,farm.name);
 assert.equal(resumed.getOrganization(farm.id).status,'ACTIVE');
 assert.equal(resumed.getOrganizationIdentity(farm.id).registrationMetadata.kind,'FARM');
 assert.equal(resumed.getHistory(farm.id).length,3);
 await assert.rejects(()=>restoreDurableOrganizationContinuityArchive({
  storage:restoredOrgs,archive
 }),/overwrite/);
 assert.equal((await names.read({worldId:WORLD,seed:SEED})).batches.length,1);
 assert.equal((await orgs.read({worldId:WORLD})).events.length,
  issued.people.length+3);
});
test('V19 incremental multiyear admissions preserve organization IDs, 1-per-approved-company journal and compact cursors',async()=>{
 const {names,orgs,naming,issued,bridge}=await setup();
 await registerPeople(bridge,issued.people,2025);
 await registerOrganizations(bridge,allFirms(issued),2025);
 const ids=new Set(allFirms(issued).map(x=>x.id));
 let events=bridge.continuityRevision;
 for(let year=2026;year<=2030;year++){
  const next=await naming.generate({
   year,roles:{trainer:2,farm_manager:2},owners:3,
   facilities:{generalFarms:1,breakingTraining:1}
  });
  await registerPeople(bridge,next.people,year);
  await registerOrganizations(bridge,allFirms(next),year);
  for(const organization of allFirms(next)){
   assert.ok(!ids.has(organization.id),'Permanent business ID collision');
   ids.add(organization.id);
   assert.equal(bridge.getHistory(organization.id).length,1);
  }
  events+=next.people.length+allFirms(next).length;
 }
 assert.equal(bridge.continuityRevision,events);
 assert.equal(bridge.getOrganization('FOUNDER-COMPANY').name,'Granite Creek Racing');
 assert.equal(bridge.getOrganization(issued.stables[0].id).name,issued.stables[0].name);
 assert.ok(JSON.stringify(bridge.continuityCursor).length<300);
 assert.ok(JSON.stringify(bridge.namingCursor).length<350);
 const persisted=await orgs.read({worldId:WORLD});
 assert.equal(persisted.events.length,events);
 assert.ok(persisted.events.every(e=>!e.worldState&&!e.previousSnapshot));
 assert.equal(bridge.getOrganization(issued.owners[0].id).id,issued.owners[0].id);
});
test('V19 remains detached from the founding 1999 world, history, career saves and UI',()=>{
 const active=readFileSync(new URL('../public/1999/engine/founding-world-1999.mjs',
  import.meta.url),'utf8');
 const bridge=readFileSync(new URL('../public/1999/engine/fictional-industry-identity-bridge-v18.mjs',
  import.meta.url),'utf8');
 assert.doesNotMatch(active,/REGISTER_APPROVED_ORGANIZATION|registerApprovedOrganization/);
 assert.doesNotMatch(bridge,/\.generate\s*\(/);
 assert.doesNotMatch(bridge,/\b(?:fetch|localStorage|setItem|writeFile)\s*\(/);
});
