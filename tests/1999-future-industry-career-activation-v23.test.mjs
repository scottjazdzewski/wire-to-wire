import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 WORLD_SCHEMA,createGameRun,dispatchGameCommand,exportGameSave,
 importGameSave,getOwnerPortfolioView,getPersonView,getPeopleDirectory,
 getGameIndustryOrganizationView,getOfficeView,
 createFutureIndustryGameGatewayV22,gameFutureOrganization,
 gameFuturePerson,eligibleFutureOwner
} from '../src/game/index.js';
import {openDurableFictionalNameService}
 from '../public/1999/engine/durable-fictional-name-service.mjs';
import {openFictionalIndustryIdentityBridge}
 from '../public/1999/engine/fictional-industry-identity-bridge-v18.mjs';

const WORLD_ID='V23-DISPOSABLE-GAME-IDENTITY',SEED=19990101;
const copy=x=>JSON.parse(JSON.stringify(x));
function makeMemory(kind){
 const rows=new Map();
 return {
  async read({worldId,seed}){return copy(rows.get(kind==='naming'?worldId+':'+seed:worldId)??null)},
  async initialize(meta){
   const key=kind==='naming'?meta.worldId+':'+meta.seed:meta.worldId;
   if(rows.has(key))throw Error('Cannot reinitialize disposable identity namespace');
   rows.set(key,{meta:copy(meta),[kind==='naming'?'batches':'events']:[]});
  },
  async append({worldId,seed,expectedRevision,batch,event,cursor}){
   const key=kind==='naming'?worldId+':'+seed:worldId,row=rows.get(key);
   if(!row||row.meta.revision!==expectedRevision)
    throw Error('Stale disposable '+kind+' revision');
   if(kind==='naming')row.batches.push(copy(batch));
   else row.events.push(copy(event));
   row.meta.revision=cursor.revision;row.meta.cursor=copy(cursor);
  },
  async restore({meta,batches,events}){
   const key=kind==='naming'?meta.worldId+':'+meta.seed:meta.worldId;
   if(rows.has(key))throw Error('Refusing to overwrite durable identity archive');
   rows.set(key,copy({meta,[kind==='naming'?'batches':'events']:
    kind==='naming'?batches:events}));
  }
 };
}
const gameWorld=()=>({
 schema:WORLD_SCHEMA,
 authority:{snapshot_id:'V23-APPROVED-FIXTURE-1999',
  sha256:'c'.repeat(64),source:'TEST_ONLY_1999_IMMUTABLE_WORLD'},
 start_date:'1999-01-01',
 entities:{
  horses:[
   {id:'H-1999-01',name:'Cedar Lane',ownerId:'O-BASE-OWNER'},
   {id:'H-1999-02',name:'Split Horizon',ownerId:'O-BASE-OWNER'},
   {id:'H-1999-03',name:'Stillwater Runner'}
  ],
  people:[{id:'P-BASE-OWNER',name:'Morgan Beck'}],
  organizations:[{id:'O-BASE-OWNER',name:'Blue Vale Racing'}],
  tracks:[{id:'T-TEST-TRACK',name:'Fictional Training Track'}]
 }
});
const founding=()=>({
 worldId:WORLD_ID,foundingYear:1999,
 people:[{id:'P-BASE-OWNER',name:'Morgan Beck',
  role:'owner',primarySurname:'Beck',birthYear:1971}],
 owners:[{id:'O-BASE-OWNER',name:'Blue Vale Racing',
  principalId:'P-BASE-OWNER',namingRegion:'KENTUCKY',
  ownershipArchetype:'RACING_COMPANY'}],
 stables:[],farms:[],trainingCenters:[]
});
const run=(world,date='2002-07-01')=>createGameRun({
 world,runId:'WTW-RUN-V23-APPROVED-CONTINUITY',seed:SEED,
 player:{role:'owner',involvement:'balanced',
  operation_id:'O-BASE-OWNER'},
 stableHorseIds:['H-1999-01','H-1999-02'],startDate:date
});
const event=(id,type,year,rest={})=>({
 eventId:id,type,sourceId:'V23_DISPOSABLE_APPROVAL',year,...rest
});
const gateway=(state,world,industry)=>createFutureIndustryGameGatewayV22({
 state,world,industry,authorityBinding:{
  worldSnapshotId:world.authority.snapshot_id,
  worldSha256:world.authority.sha256,industryWorldId:industry.worldId
 }
});
const cmd=(id,type,payload,actor='player')=>({id,type,payload,actor});
async function setup(){
 const names=makeMemory('naming'),orgs=makeMemory('continuity');
 const industry=await openFictionalIndustryIdentityBridge({
  namingStorage:names,continuityStorage:orgs,
  worldId:WORLD_ID,seed:SEED,source:founding()
 });
 const naming=await openDurableFictionalNameService({
  storage:names,worldId:WORLD_ID,seed:SEED
 });
 const batch=await naming.generate({
  year:2001,roles:{trainer:2,farm_manager:1},owners:2,
  facilities:{generalFarms:1},maxPartnershipGroups:8
 });
 const w=gameWorld();
 let state=run(w);
 const gw=gateway(state,w,industry);
 for(const person of batch.people)
  await gw.registerApprovedPerson({
   personId:person.id,eventId:'ADMIT-P-'+person.id,
   sourceId:'V23_APPROVED_PERSONNEL'
  });
 for(const org of [...batch.owners,...batch.farms])
  await gw.registerApprovedOrganization({
   organizationId:org.id,eventId:'ADMIT-O-'+org.id,
   sourceId:'V23_APPROVED_BUSINESS'
  });
 const owner=batch.owners[0],farm=batch.farms[0];
 await industry.applyTransition({event:event(
  'CAP-'+owner.id,'SET_OPERATING_CAPACITY',2002,{
   organizationId:owner.id,horseSlots:40
  })});
 return {names,orgs,industry,batch,owner,farm,w,state};
}
function activate(state,w,industry,personIds,organizationIds){
 for(const personId of personIds)
  state=gateway(state,w,industry).activateApprovedPerson({
   personId,commandId:'V23:GAME:PERSON:'+personId
  }).state;
 for(const organizationId of organizationIds)
  state=gateway(state,w,industry).activateApprovedOrganization({
   organizationId,commandId:'V23:GAME:ORG:'+organizationId
  }).state;
 return state;
}
test('V23 activates V12/V17 approved owner and people into existing run, with exact save/load and no source mutation',async()=>{
 const {industry,batch,owner,w}=await setup();
 let state=run(w);const frozenWorld=JSON.stringify(w);
 const sourceSave=exportGameSave(state,w);
 assert.equal(state.runtime.future_industry,undefined);
 assert.deepEqual(importGameSave(sourceSave,w),state);
 const principal=batch.people.find(p=>p.id===owner.principalId);
 state=activate(state,w,industry,[principal.id],[owner.id]);
 const op=gameFutureOrganization(state,w,owner.id);
 assert.equal(op.name,owner.name);
 assert.equal(op.principalId,principal.id);
 assert.equal(op.kind,'OWNER');
 assert.equal(op.status,'ACTIVE');
 assert.equal(gameFuturePerson(state,w,principal.id).name,principal.name);
 assert.equal(eligibleFutureOwner(state,w,owner.id),true);
 const view=getGameIndustryOrganizationView(state,w,owner.id);
 assert.equal(view.source_status,'APPROVED_FUTURE_V12_V17_GAME_IDENTITY');
 assert.equal(view.name,owner.name);
 const person=getPersonView(state,w,principal.id,null);
 assert.equal(person.name,principal.name);
 assert.equal(person.reputation,null);
 assert.deepEqual(person.attributes,[]);
 assert.equal(person.source_status,'APPROVED_FUTURE_V12_V17_GAME_IDENTITY');
 assert.equal(getOfficeView(state,w).future_approved_person_count,1);
 assert.equal(getOfficeView(state,w).future_approved_organization_count,1);
 assert.equal(JSON.stringify(w),frozenWorld);
 assert.equal(worldIdentityIdAvailable(w,owner.id),false);
 const loaded=importGameSave(exportGameSave(state,w),w);
 assert.deepEqual(loaded,state);
 assert.equal(loaded.runtime.future_industry.organizations[owner.id].name,owner.name);
});
function worldIdentityIdAvailable(world,id){
 return world.entities.organizations.some(o=>o.id===id);
}
test('V23 actual existing ownership gift and unowned horse assignment recognize activated owner, not unapproved IDs',async()=>{
 const {industry,batch,owner,w}=await setup();
 let state=run(w),principal=batch.people.find(p=>p.id===owner.principalId);
 const before=JSON.stringify(w);
 assert.throws(()=>dispatchGameCommand({state,world:w,
  command:cmd('V23:UNAPPROVED','ASSIGN_HORSE_OWNER',{
   horse_id:'H-1999-03',owner_id:owner.id
  },'system')}),e=>e.code==='UNKNOWN_OWNER');
 state=activate(state,w,industry,[principal.id],[owner.id]);
 const beforePort=getOwnerPortfolioView(state,w,owner.id);
 assert.equal(beforePort.total,0);
 state=dispatchGameCommand({state,world:w,
  command:cmd('V23:REQUEST-GIFT','REQUEST_HORSE_TRANSFER',{
   request_id:'V23-GIFT-001',horse_id:'H-1999-01',
   to_owner_id:owner.id,transfer_type:'GIFT'
  })}).state;
 state=dispatchGameCommand({state,world:w,
  command:cmd('V23:COMMIT-GIFT','COMMIT_HORSE_TRANSFER',{
   request_id:'V23-GIFT-001'
  },'system')}).state;
 state=dispatchGameCommand({state,world:w,
  command:cmd('V23:ASSIGN-UNOWNED','ASSIGN_HORSE_OWNER',{
   horse_id:'H-1999-03',owner_id:owner.id
  },'system')}).state;
 const portfolio=getOwnerPortfolioView(state,w,owner.id);
 assert.equal(portfolio.total,2);
 assert.deepEqual(new Set(portfolio.items.map(h=>h.id)),
  new Set(['H-1999-01','H-1999-03']));
 assert.equal(getOwnerPortfolioView(state,w,'O-BASE-OWNER').total,1);
 assert.equal(w.entities.horses[0].ownerId,'O-BASE-OWNER');
 assert.equal(JSON.stringify(w),before);
 const quote=gateway(state,w,industry).quoteOwnerReuse({
  kind:'OWNER',region:null,slots:1
 });
 assert.equal(quote.detachedBusinessesExcluded,1,
  'unactivated second approved owner remains excluded');
 const candidate=quote.candidates.find(x=>x.id===owner.id);
 assert.ok(candidate,'activated owner with real saved horses can be reused');
 assert.equal(candidate.occupied,2);
 assert.equal(candidate.available,38);
 const restored=importGameSave(exportGameSave(state,w),w);
 assert.deepEqual(getOwnerPortfolioView(restored,w,owner.id),portfolio);
});
test('V23 sales to future owners still require a posted exact matching settlement; player cannot forge activation',async()=>{
 const {industry,batch,owner,w}=await setup();
 let state=run(w),principal=batch.people.find(p=>p.id===owner.principalId);
 state=activate(state,w,industry,[principal.id],[owner.id]);
 assert.throws(()=>dispatchGameCommand({state,world:w,
  command:cmd('V23:PLAYER-FORGE','ACTIVATE_APPROVED_FUTURE_PERSON',{
   industry_world_id:industry.worldId,
   world_snapshot_id:w.authority.snapshot_id,
   world_sha256:w.authority.sha256,
   identity:{id:'FAKE'}
  })}),e=>e.code==='FUTURE_IDENTITY_PERMISSION');
 state=dispatchGameCommand({state,world:w,
  command:cmd('V23:REQUEST-SALE','REQUEST_HORSE_TRANSFER',{
   request_id:'V23-SALE-001',horse_id:'H-1999-02',
   to_owner_id:owner.id,transfer_type:'SALE'
  })}).state;
 const before=exportGameSave(state,w);
 assert.throws(()=>dispatchGameCommand({state,world:w,
  command:cmd('V23:COMMIT-UNPAID','COMMIT_HORSE_TRANSFER',{
   request_id:'V23-SALE-001',finance_ledger_id:'FAKE-SETTLEMENT'
  },'system')}),e=>e.code==='FINANCE_NOT_SETTLED');
 assert.equal(exportGameSave(state,w),before);
 assert.equal(getOwnerPortfolioView(state,w,owner.id).total,0);
});
test('V23 closing a permanent owner syncs status but preserves historical ownership and prohibits new transfers',async()=>{
 const {industry,batch,owner,w}=await setup();
 let state=run(w),principal=batch.people.find(p=>p.id===owner.principalId);
 state=activate(state,w,industry,[principal.id],[owner.id]);
 state=dispatchGameCommand({state,world:w,
  command:cmd('V23:ASSIGN-ONE','ASSIGN_HORSE_OWNER',{
   horse_id:'H-1999-03',owner_id:owner.id
  },'system')}).state;
 await industry.applyTransition({event:event(
  'V23:CLOSE-OWNER','CLOSE_ORGANIZATION',2002,
  {organizationId:owner.id})});
 state=gateway(state,w,industry).synchronizeApprovedOrganization({
  organizationId:owner.id,commandId:'V23:SYNC-CLOSED'
 }).state;
 assert.equal(gameFutureOrganization(state,w,owner.id).status,'CLOSED');
 assert.equal(getOwnerPortfolioView(state,w,owner.id).total,1);
 assert.equal(eligibleFutureOwner(state,w,owner.id),false);
 assert.throws(()=>dispatchGameCommand({state,world:w,
  command:cmd('V23:ASSIGN-CLOSED','ASSIGN_HORSE_OWNER',{
   horse_id:'H-1999-02',owner_id:owner.id
  },'system')}),e=>e.code==='HORSE_ALREADY_OWNED'||e.code==='INACTIVE_FUTURE_OWNER');
 assert.deepEqual(importGameSave(exportGameSave(state,w),w),state);
});
test('V23 people availability synchronization disables future business when approved principal is unavailable',async()=>{
 const {industry,batch,owner,w}=await setup();
 let state=run(w),principal=batch.people.find(p=>p.id===owner.principalId);
 state=activate(state,w,industry,[principal.id],[owner.id]);
 // The owner principal must transfer their active office before taking leave;
 // a separate approved trainer with no management duty can go on leave.
 const trainer=batch.people.find(p=>p.role==='trainer');
 state=gateway(state,w,industry).activateApprovedPerson({
  personId:trainer.id,commandId:'V23:ACTIVATE-TRAINER'
 }).state;
 await industry.applyTransition({event:event('V23:TRAINER-LEAVE',
  'SET_PERSON_AVAILABILITY',2002,{
   personId:trainer.id,availability:'ON_LEAVE'
  })});
 state=gateway(state,w,industry).synchronizeApprovedPerson({
  personId:trainer.id,commandId:'V23:SYNC-TRAINER'
 }).state;
 assert.equal(gameFuturePerson(state,w,trainer.id).availability,'ON_LEAVE');
 assert.deepEqual(importGameSave(exportGameSave(state,w),w),state);
 assert.equal(gameFutureOrganization(state,w,owner.id).status,'ACTIVE');
 assert.equal(getPersonView(state,w,trainer.id,null).name,trainer.name);
});
test('V23 existing 1999 runs and old saves stay unchanged; direct retroactive activation cannot touch founding world',async()=>{
 const {industry,batch,owner,w}=await setup();
 const opening=run(w,'1999-01-01'),before=JSON.stringify(opening);
 assert.equal(opening.runtime.future_industry,undefined);
 assert.throws(()=>dispatchGameCommand({state:opening,world:w,command:
  cmd('V23:RETRO','ACTIVATE_APPROVED_FUTURE_ORGANIZATION',{
   industry_world_id:industry.worldId,
   world_snapshot_id:w.authority.snapshot_id,
   world_sha256:w.authority.sha256,
   identity:{id:owner.id}
  },'system')
 }),e=>e.code==='FUTURE_IDENTITY_YEAR');
 assert.equal(JSON.stringify(opening),before);
 assert.deepEqual(importGameSave(exportGameSave(opening,w),w),opening);
});
test('V23 corrupted identity save entries fail on load even with recomputed weak checksum',async()=>{
 const {industry,batch,owner,w}=await setup();
 let state=run(w),principal=batch.people.find(p=>p.id===owner.principalId);
 state=activate(state,w,industry,[principal.id],[owner.id]);
 const save=JSON.parse(exportGameSave(state,w));
 const {checksum32}=await import('../src/game/persistence.js');
 save.state.runtime.future_industry.organizations[owner.id].name='Forgery Racing';
 // Even if an attacker recalculates the accidental-corruption checksum,
 // immutable identity's activation record cannot be silently rewritten.
 save.checksum32=checksum32(JSON.stringify(save.state));
 assert.throws(()=>importGameSave(JSON.stringify(save),w));
});
test('V23 module stays synchronized between Node and browser, with no new save schema or bootstrap',()=>{
 const node=readFileSync(new URL(
  '../src/game/future-industry-activation-v23.js',import.meta.url),'utf8');
 const browser=readFileSync(new URL(
  '../public/1999/game/future-industry-activation-v23.js',import.meta.url),'utf8');
 assert.equal(browser,node);
 const kernel=readFileSync(new URL(
  '../src/game/kernel.js',import.meta.url),'utf8');
 assert.match(kernel,/ACTIVATE_APPROVED_FUTURE_PERSON|FUTURE_INDUSTRY_COMMANDS_V23/);
 assert.doesNotMatch(node,/\b(?:indexedDB|localStorage|writeFile|fetch)\s*\(/);
 assert.doesNotMatch(node,/\.generate\s*\(/);
});
