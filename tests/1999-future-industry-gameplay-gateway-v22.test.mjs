import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 WORLD_SCHEMA,createGameRun,dispatchGameCommand,
 exportGameSave,importGameSave,
 GAME_INDUSTRY_GATEWAY_MODEL_V22,createFutureIndustryGameGatewayV22
} from '../src/game/index.js';
import {openDurableFictionalNameService}
 from '../public/1999/engine/durable-fictional-name-service.mjs';
import {openFictionalIndustryIdentityBridge}
 from '../public/1999/engine/fictional-industry-identity-bridge-v18.mjs';

const clone=x=>JSON.parse(JSON.stringify(x));
const WORLD_ID='V22-DISPOSABLE-REAL-GAME-GATEWAY',SEED=19990101;
const world=()=>({
 schema:WORLD_SCHEMA,authority:{
  snapshot_id:'V22-DISPOSABLE-APPROVED-WORLD',
  sha256:'c'.repeat(64),source:'SYNTHETIC_V22_APPROVED_GAME_TEST'
 },
 start_date:'1999-01-01',
 entities:{
  horses:[
   {id:'H-TEST-001',name:'Paper Bay',ownerId:'O-TEST-A'},
   {id:'H-TEST-002',name:'Cedar Cross',ownerId:'O-TEST-A'},
   {id:'H-TEST-003',name:'Vale Current',ownerId:'O-TEST-B'},
   {id:'H-TEST-004',name:'Unowned Test Runner'}
  ],
  people:[
   {id:'P-TEST-A',name:'Mona Porter'},
   {id:'P-TEST-B',name:'Erin Stone'}
  ],
  organizations:[
   {id:'O-TEST-A',name:'Western Kentucky Racing'},
   {id:'O-TEST-B',name:'South Florida Racing'}
  ],
  tracks:[{id:'T-TEST-001',name:'Synthetic Test Racecourse'}]
 }
});
const source=()=>({
 worldId:WORLD_ID,foundingYear:1999,
 people:[
  {id:'P-TEST-A',name:'Mona Porter',role:'owner',primarySurname:'Porter',
   birthYear:1977},
  {id:'P-TEST-B',name:'Erin Stone',role:'owner',primarySurname:'Stone',
   birthYear:1975}
 ],
 owners:[
  {id:'O-TEST-A',name:'Western Kentucky Racing',principalId:'P-TEST-A',
   namingRegion:'KENTUCKY',ownershipArchetype:'RACING_COMPANY'},
  {id:'O-TEST-B',name:'South Florida Racing',principalId:'P-TEST-B',
   namingRegion:'FLORIDA',ownershipArchetype:'PRIVATE_RACING_OPERATION'}
 ],
 stables:[],farms:[],trainingCenters:[]
});
const memoryNaming=()=>{
 const rows=new Map();
 const id=(w,s)=>w+'|'+s;
 return {
  async read({worldId,seed}){return clone(rows.get(id(worldId,seed))??null)},
  async initialize(meta){
   const k=id(meta.worldId,meta.seed);
   if(rows.has(k))throw Error('Existing naming test namespace');
   rows.set(k,{meta:clone(meta),batches:[]});
  },
  async append({worldId,seed,expectedRevision,batch,cursor}){
   const x=rows.get(id(worldId,seed));
   if(x.meta.revision!==expectedRevision)throw Error('Stale naming CAS');
   x.batches.push(clone(batch));x.meta.revision=cursor.revision;
   x.meta.cursor=clone(cursor);
  }
 };
};
const memoryContinuity=()=>{
 const rows=new Map();
 return {
  async read({worldId}){return clone(rows.get(worldId)??null)},
  async initialize(meta){
   if(rows.has(meta.worldId))throw Error('Existing continuity test namespace');
   rows.set(meta.worldId,{meta:clone(meta),events:[]});
  },
  async append({worldId,expectedRevision,event,cursor}){
   const x=rows.get(worldId);
   if(x.meta.revision!==expectedRevision)
    throw Error('Stale continuity CAS');
   x.events.push(clone(event));x.meta.revision=cursor.revision;
   x.meta.cursor=clone(cursor);
  }
 };
};
const makeRun=(w,date='2000-04-06')=>createGameRun({
 world:w,runId:'WTW-RUN-V22-CONTINUITY',seed:SEED,
 player:{role:'owner',involvement:'balanced',
  operation_id:'O-TEST-A'},
 stableHorseIds:['H-TEST-001','H-TEST-002'],
 startDate:date
});
const openGateway=(state,gameWorld,industry)=>createFutureIndustryGameGatewayV22({
 state,world:gameWorld,industry,
 authorityBinding:{
  worldSnapshotId:gameWorld.authority.snapshot_id,
  worldSha256:gameWorld.authority.sha256,
  industryWorldId:industry.worldId
 }
});
const event=(id,type,year,fields={})=>({
 eventId:id,sourceId:'SYNTHETIC_V22_EVIDENCE',type,year,...fields
});
async function setup(){
 const names=memoryNaming(),orgs=memoryContinuity();
 const bridge=await openFictionalIndustryIdentityBridge({
  worldId:WORLD_ID,seed:SEED,
  namingStorage:names,continuityStorage:orgs,source:source()
 });
 await bridge.applyTransition({event:event('V22-A-CAP','SET_OPERATING_CAPACITY',
  2000,{organizationId:'O-TEST-A',horseSlots:10})});
 await bridge.applyTransition({event:event('V22-B-CAP','SET_OPERATING_CAPACITY',
  2000,{organizationId:'O-TEST-B',horseSlots:100})});
 return {names,orgs,bridge};
}
test('V22 game owner reuse reads REAL approved world and game save occupancy rather than creating new owner per horse',async()=>{
 const {bridge}=await setup(),w=world(),state=makeRun(w);
 const beforeWorld=JSON.stringify(w),beforeSave=exportGameSave(state,w);
 const gateway=openGateway(state,w,bridge);
 const quote=gateway.quoteOwnerReuse({
  region:'KENTUCKY',slots:5
 });
 assert.equal(gateway.model,GAME_INDUSTRY_GATEWAY_MODEL_V22);
 assert.equal(quote.type,'READ_ONLY_GAME_OWNER_REUSE');
 assert.equal(quote.gameDate,'2000-04-06');
 assert.equal(quote.gameHorseCount,4);
 assert.equal(quote.unownedHorseCount,1);
 assert.equal(quote.candidates.length,1);
 assert.equal(quote.candidates[0].id,'O-TEST-A');
 assert.equal(quote.candidates[0].occupied,2);
 assert.equal(quote.candidates[0].available,8);
 assert.equal(quote.makesHorseAssignments,false);
 assert.equal(quote.mintsOrganizations,false);
 assert.equal(quote.detachedBusinessesExcluded,0);
 assert.equal(gateway.quoteOwnerReuse({
  region:'FLORIDA',slots:1
 }).candidates[0].id,'O-TEST-B');
 assert.equal(gateway.quoteOwnerReuse({
  region:'KENTUCKY',slots:9
 }).candidates.length,0);
 assert.equal(gateway.quoteOwnerReuse({
  region:'KENTUCKY',slots:9,includeOtherRegions:true
 }).candidates[0].id,'O-TEST-B');
 assert.equal(JSON.stringify(w),beforeWorld);
 assert.equal(exportGameSave(state,w),beforeSave);
 assert.deepEqual(importGameSave(beforeSave,w),state);
});
test('V22 cannot activate future industry on Jan 1999 or after the supported 2099 identity horizon',async()=>{
 const {bridge}=await setup(),w=world();
 const opening=makeRun(w,'1999-01-01');
 const gw=openGateway(opening,w,bridge);
 assert.throws(()=>gw.quoteOwnerReuse({region:'KENTUCKY'}),
  /disabled in the founding 1999 career/);
 await assert.rejects(()=>gw.registerApprovedOrganization({
  organizationId:'NOT-APPROVED',eventId:'EVENT',sourceId:'SIM'
 }),/disabled in the founding 1999 career/);
 const far=makeRun(w,'2100-01-01');
 const later=openGateway(far,w,bridge);
 assert.throws(()=>later.quoteOwnerReuse({region:'KENTUCKY'}),
  /disabled in the founding 1999 career/);
 assert.equal(opening.revision,0);
 assert.equal(far.revision,0);
 assert.equal(bridge.continuityRevision,2);
});
test('V22 real game transfer changes owner occupancy while preserving historical source owner and save/load',async()=>{
 const {bridge}=await setup(),w=world();
 let state=makeRun(w);
 const transfer=(id,type,payload,actor='player')=>
  ({id,type,payload,actor});
 state=dispatchGameCommand({state,world:w,command:transfer(
  'V22:REQUEST','REQUEST_HORSE_TRANSFER',{
   request_id:'V22-TRANSFER',horse_id:'H-TEST-001',
   to_owner_id:'O-TEST-B',transfer_type:'GIFT'
  })}).state;
 state=dispatchGameCommand({state,world:w,command:transfer(
  'V22:COMMIT','COMMIT_HORSE_TRANSFER',{
   request_id:'V22-TRANSFER'
  },'system')}).state;
 const gw=openGateway(state,w,bridge);
 const local=gw.quoteOwnerReuse({region:'KENTUCKY',slots:1});
 const florida=gw.quoteOwnerReuse({region:'FLORIDA',slots:1});
 assert.equal(local.candidates[0].occupied,1);
 assert.equal(florida.candidates[0].occupied,2);
 assert.equal(w.entities.horses[0].ownerId,'O-TEST-A');
 assert.deepEqual(importGameSave(exportGameSave(state,w),w),state);
});
test('V22 explicitly approved FUTURE person and business events enter V17, not an unapproved 1999 game save',async()=>{
 const {names,bridge}=await setup(),w=world();
 const state=makeRun(w,'2001-07-01');
 const gameBefore=exportGameSave(state,w),worldBefore=JSON.stringify(w);
 const namer=await openDurableFictionalNameService({
  storage:names,worldId:WORLD_ID,seed:SEED
 });
 const fresh=await namer.generate({
  year:2001,roles:{trainer:1,farm_manager:1},owners:1,
  facilities:{generalFarms:1},maxPartnershipGroups:5
 });
 const gw=openGateway(state,w,bridge);
 await assert.rejects(()=>gw.registerApprovedPerson({
  personId:'INVENTED-PERSON',eventId:'UNAUTH',sourceId:'SIM'
 }),/durably approved/);
 for(const person of fresh.people){
  const receipt=await gw.registerApprovedPerson({
   personId:person.id,eventId:'V22-PERSON-'+person.id,sourceId:'ENGINE_DECISION'
  });
  assert.equal(receipt.year,2001);
  assert.equal(receipt.gameWorldActivated,false);
  assert.equal(receipt.gameSaveChanged,false);
 }
 const firm=fresh.owners[0],initialRevision=bridge.continuityRevision;
 const receipt=await gw.registerApprovedOrganization({
  organizationId:firm.id,eventId:'V22-COMPANY-'+firm.id,
  sourceId:'ENGINE_APPROVED_NEW_BUSINESS'
 });
 assert.equal(bridge.continuityRevision,initialRevision+1);
 assert.equal(receipt.continuityRegistered,true);
 assert.equal(receipt.requiresGameplayIdentityActivation,true);
 assert.equal(receipt.gameSaveChanged,false);
 assert.equal(bridge.getOrganization(firm.id).name,firm.name);
 assert.equal(bridge.getHistory(firm.id).length,1);
 const reuse=gw.quoteOwnerReuse({region:'KENTUCKY',slots:1});
 assert.ok(!reuse.candidates.some(x=>x.id===firm.id));
 assert.equal(reuse.detachedBusinessesExcluded,1);
 assert.throws(()=>dispatchGameCommand({
  state,world:w,
  command:{id:'V22:UNAPPROVED_ASSIGN',
   actor:'system',type:'ASSIGN_HORSE_OWNER',
   payload:{horse_id:'H-TEST-004',owner_id:firm.id}}
 }),error=>error.code==='UNKNOWN_OWNER');
 assert.equal(exportGameSave(state,w),gameBefore);
 assert.equal(JSON.stringify(w),worldBefore);
});
test('V22 game-clock approved personnel events obey V17 succession and retirement guards',async()=>{
 const {bridge}=await setup(),w=world(),state=makeRun(w,'2001-09-13');
 const gw=openGateway(state,w,bridge);
 await gw.applyPersonnelDecision({eventId:'CAREER-A',
  sourceId:'SIM_CAREER_EVIDENCE',personId:'P-TEST-A',
  type:'RECORD_PERSON_CAREER',careerStartYear:1995,stage:'EMERGING'});
 assert.equal(bridge.getPersonIdentity('P-TEST-A').career.stage,'EMERGING');
 await assert.rejects(()=>gw.applyPersonnelDecision({eventId:'LEAVE-A',
  sourceId:'SIM',personId:'P-TEST-A',
  type:'SET_PERSON_AVAILABILITY',availability:'ON_LEAVE'}),
 /Transfer active duties/);
 await assert.rejects(()=>gw.applyPersonnelDecision({eventId:'RETIRE-A',
  sourceId:'SIM',personId:'P-TEST-A',type:'RETIRE_PERSON'}),
 /Transfer all active/);
 assert.equal(bridge.getOrganization('O-TEST-A').principalId,'P-TEST-A');
 assert.equal(state.revision,0);
});
test('V22 rejects missing or mismatched canonical-to-industry world authority bindings',async()=>{
 const {bridge}=await setup(),w=world(),state=makeRun(w);
 assert.throws(()=>createFutureIndustryGameGatewayV22({
  state,world:w,industry:bridge
 }),/not explicitly bound/);
 assert.throws(()=>createFutureIndustryGameGatewayV22({
  state,world:w,industry:bridge,authorityBinding:{
   worldSnapshotId:w.authority.snapshot_id,
   worldSha256:'a'.repeat(64),
   industryWorldId:bridge.worldId
  }
 }),/not explicitly bound/);
 assert.throws(()=>createFutureIndustryGameGatewayV22({
  state,world:w,industry:bridge,authorityBinding:{
   worldSnapshotId:w.authority.snapshot_id,
   worldSha256:w.authority.sha256,
   industryWorldId:'WRONG-NAMESPACE'
  }
 }),/not explicitly bound/);
 assert.equal(openGateway(state,w,bridge).runId,state.run_id);
});
test('V22 source mirror and existing 1999 gameplay API remain exact, no second game or dynamic world mutation',()=>{
 const node=readFileSync(new URL(
  '../src/game/future-industry-v22.js',import.meta.url),'utf8');
 const browser=readFileSync(new URL(
  '../public/1999/game/future-industry-v22.js',import.meta.url),'utf8');
 assert.equal(browser,node.replaceAll(
  '../../public/1999/engine/','../engine/'));
 assert.doesNotMatch(node,/\b(?:localStorage|indexedDB|writeFile|fetch)\s*\(/);
 assert.doesNotMatch(node,/\.generate\s*\(/);
 const kernel=readFileSync(new URL(
  '../src/game/kernel.js',import.meta.url),'utf8');
 assert.doesNotMatch(kernel,/future-industry-v22|REGISTER_APPROVED_ORGANIZATION/);
});
