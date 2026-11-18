import test from 'node:test';
import assert from 'node:assert/strict';
import {
 WORLD_SCHEMA,createGameRun,dispatchGameCommand,
 exportGameSave,importGameSave,getStableView,getOfficeView,
 getOwnerPortfolioView,currentHorseOwnerId
} from '../src/game/index.js';
import {planFictionalOwnerPortfolios} from '../public/1999/engine/fictional-owner-portfolio-planner.mjs';

const w=()=>({
 schema:WORLD_SCHEMA,
 authority:{snapshot_id:'WTW-TEST-V9-OWNERSHIP',source:'TEST APPROVED FIXTURE ONLY',
  sha256:'b'.repeat(64)},
 start_date:'1999-01-01',
 entities:{
  horses:[
   {id:'H-1999-000001',name:'First Fictional Runner',ownerId:'O-1999-001',source_status:'TEST_ONLY'},
   {id:'H-1999-000002',name:'Second Fictional Runner',ownerId:'O-1999-001',source_status:'TEST_ONLY'},
   {id:'H-1999-000003',name:'Third Fictional Runner',source_status:'NEW_FICTION_ACCEPTED'},
   {id:'H-1999-000004',name:'Fourth Fictional Runner',ownerId:'O-1999-002',source_status:'TEST_ONLY'}
  ],
  people:[],
  organizations:[
   {id:'O-1999-001',name:'First Fictional Owner'},
   {id:'O-1999-002',name:'Second Fictional Owner'}
  ],
  tracks:[{id:'T-1999-001',name:'Fictional Test Track'}]
 }
});
const run=(world=w())=>createGameRun({
 world,runId:'WTW-RUN-V9OWNER',seed:19990101,
 player:{role:'owner',involvement:'hands-on',operation_id:'O-1999-001'},
 stableHorseIds:['H-1999-000001','H-1999-000002']
});
const cmd=(id,type,payload,actor='player')=>({id,type,payload,actor});
const send=(world,state,command)=>dispatchGameCommand({world,state,command});

test('owner can request a gift transfer; audited commit changes game run, not source, and follows save/load',()=>{
 const world=w(),sourceBefore=JSON.stringify(world);
 let s=run(world);
 assert.equal(currentHorseOwnerId(s,world,'H-1999-000001'),'O-1999-001');
 assert.equal(getOwnerPortfolioView(s,world,'O-1999-001',{limit:3}).total,2);
 assert.equal(getOfficeView(s,world).player_owner_horse_count,2);
 s=send(world,s,cmd('owner:req:1','REQUEST_HORSE_TRANSFER',{
  request_id:'TRANSFER-TEST-1',horse_id:'H-1999-000001',
  to_owner_id:'O-1999-002',transfer_type:'GIFT'
 })).state;
 assert.equal(getOfficeView(s,world).pending_horse_transfers,1);
 assert.equal(currentHorseOwnerId(s,world,'H-1999-000001'),'O-1999-001');
 assert.equal(getOwnerPortfolioView(s,world,'O-1999-001').total,2);
 const approved=send(world,s,cmd('system:transfer:1','COMMIT_HORSE_TRANSFER',{
  request_id:'TRANSFER-TEST-1'
 },'system'));
 s=approved.state;
 assert.equal(approved.events[0].kind,'HORSE_OWNERSHIP_TRANSFERRED');
 assert.equal(approved.events[0].details.scope,'GAME_RUN_ONLY__CANON_UNCHANGED');
 assert.equal(currentHorseOwnerId(s,world,'H-1999-000001'),'O-1999-002');
 assert.equal(getOwnerPortfolioView(s,world,'O-1999-002').total,2);
 assert.equal(getOwnerPortfolioView(s,world,'O-1999-001').total,1);
 assert.deepEqual(s.stable_horse_ids,['H-1999-000002']);
 assert.equal(getOfficeView(s,world).player_owner_horse_count,1);
 assert.equal(getOfficeView(s,world).pending_horse_transfers,0);
 assert.equal(JSON.stringify(world),sourceBefore,'approved source world cannot mutate');
 assert.equal(world.entities.horses[0].ownerId,'O-1999-001');
 const saved=exportGameSave(s,world);
 const restored=importGameSave(saved,world);
 assert.deepEqual(restored,s);
 assert.equal(getOwnerPortfolioView(restored,world,'O-1999-002').total,2);
 assert.strictEqual(send(world,s,cmd('system:transfer:1','COMMIT_HORSE_TRANSFER',{
  request_id:'TRANSFER-TEST-1'
 },'system')).state,s,'same command ID must replay without a second transfer');
 assert.throws(()=>send(world,s,cmd('system:transfer:1','COMMIT_HORSE_TRANSFER',{
  request_id:'TRANSFER-TEST-2'
 },'system')),e=>e.code==='COMMAND_CONFLICT');
});

test('new accepted unowned horse can be assigned to an existing approved owner, but source owner cannot be replaced',()=>{
 const world=w();let s=run(world);
 assert.throws(()=>send(world,s,cmd('player:assign','ASSIGN_HORSE_OWNER',{
  horse_id:'H-1999-000003',owner_id:'O-1999-001'
 })),e=>e.code==='UNAUTHORIZED_COMMAND');
 const before=JSON.stringify(s);
 assert.throws(()=>send(world,s,cmd('system:bad','ASSIGN_HORSE_OWNER',{
  horse_id:'H-1999-000001',owner_id:'O-1999-002'
 },'system')),e=>e.code==='HORSE_ALREADY_OWNED');
 assert.equal(JSON.stringify(s),before);
 s=send(world,s,cmd('system:assign','ASSIGN_HORSE_OWNER',{
  horse_id:'H-1999-000003',owner_id:'O-1999-001'
 },'system')).state;
 assert.equal(currentHorseOwnerId(s,world,'H-1999-000003'),'O-1999-001');
 assert.ok(s.stable_horse_ids.includes('H-1999-000003'));
 assert.equal(getOwnerPortfolioView(s,world,'O-1999-001').total,3);
 assert.equal(world.entities.horses[2].ownerId,undefined);
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});

test('sale does not change owner until a genuine matching finance ledger record exists',()=>{
 const world=w();let s=run(world);
 s=send(world,s,cmd('owner:sell','REQUEST_HORSE_TRANSFER',{
  request_id:'SALE-TEST-1',horse_id:'H-1999-000002',
  to_owner_id:'O-1999-002',transfer_type:'SALE'
 })).state;
 const before=JSON.stringify(s);
 assert.throws(()=>send(world,s,cmd('system:post','COMMIT_HORSE_TRANSFER',{
  request_id:'SALE-TEST-1'
 },'system')),e=>e.code==='INVALID_FIELD');
 assert.throws(()=>send(world,s,cmd('system:post','COMMIT_HORSE_TRANSFER',{
  request_id:'SALE-TEST-1',finance_ledger_id:'FAKE-POST'
 },'system')),e=>e.code==='FINANCE_NOT_SETTLED');
 assert.equal(JSON.stringify(s),before);
 assert.equal(currentHorseOwnerId(s,world,'H-1999-000002'),'O-1999-001');
 assert.equal(s.runtime.finances.ledger.length,0);
 // The finance system is independent; only a previously posted matching
 // settlement can supply the authoritative event. No fictitious money.
 const passed=structuredClone(s);
 passed.runtime.finances.ledger.push({
  id:'POSTED-LEDGER-1',horse_id:'H-1999-000002',
  from_owner_id:'O-1999-001',to_owner_id:'O-1999-002',
  settlement_status:'POSTED',amount_minor:50000
 });
 s=send(world,passed,cmd('system:post','COMMIT_HORSE_TRANSFER',{
  request_id:'SALE-TEST-1',finance_ledger_id:'POSTED-LEDGER-1'
 },'system')).state;
 assert.equal(currentHorseOwnerId(s,world,'H-1999-000002'),'O-1999-002');
 assert.equal(s.event_log.at(-1).details.finance_ledger_id,'POSTED-LEDGER-1');
});

test('invalid requests cannot transfer another owner horse, invent owner, or bypass one-horse pending rule',()=>{
 const world=w();let s=run(world);
 const original=JSON.stringify(s);
 assert.throws(()=>send(world,s,cmd('owner:steal','REQUEST_HORSE_TRANSFER',{
  request_id:'T-STEAL',horse_id:'H-1999-000004',
  to_owner_id:'O-1999-001',transfer_type:'GIFT'
 })),e=>e.code==='NOT_HORSE_OWNER');
 assert.throws(()=>send(world,s,cmd('owner:fake','REQUEST_HORSE_TRANSFER',{
  request_id:'T-FAKE',horse_id:'H-1999-000001',
  to_owner_id:'O-UNKNOWN',transfer_type:'GIFT'
 })),e=>e.code==='UNKNOWN_OWNER');
 assert.equal(JSON.stringify(s),original);
 s=send(world,s,cmd('owner:req','REQUEST_HORSE_TRANSFER',{
  request_id:'T-ONE',horse_id:'H-1999-000001',
  to_owner_id:'O-1999-002',transfer_type:'GIFT'
 })).state;
 assert.throws(()=>send(world,s,cmd('owner:reserved','REQUEST_HORSE_TRANSFER',{
  request_id:'__proto__',horse_id:'H-1999-000001',
  to_owner_id:'O-1999-002',transfer_type:'GIFT'
 })),e=>e.code==='INVALID_REQUEST_ID');
 assert.throws(()=>send(world,s,cmd('owner:req2','REQUEST_HORSE_TRANSFER',{
  request_id:'T-TWO',horse_id:'H-1999-000001',
  to_owner_id:'O-1999-002',transfer_type:'GIFT'
 })),e=>e.code==='PENDING_TRANSFER');
 assert.throws(()=>send(world,s,cmd('owner:badcancel','CANCEL_HORSE_TRANSFER',{
  request_id:'UNKNOWN'
 })),e=>e.code==='UNKNOWN_TRANSFER');
 s=send(world,s,cmd('owner:cancel','CANCEL_HORSE_TRANSFER',{
  request_id:'T-ONE'
 })).state;
 assert.equal(Object.keys(s.runtime.ownership.pending_transfers).length,0);
 assert.equal(currentHorseOwnerId(s,world,'H-1999-000001'),'O-1999-001');
});

test('planner-generated 100k horse ownership can be paged from the same accepted source snapshot',()=>{
 const ownerCount=8000,horseCount=100000;
 const ownerIds=Array.from({length:ownerCount},(_,i)=>
  'O-TEST-1999-'+String(i+1).padStart(6,'0'));
 const planner=planFictionalOwnerPortfolios({
  seed:19990101,owners:ownerIds.map(id=>({id})),horseCount
 });
 const universe={
  schema:WORLD_SCHEMA,authority:{snapshot_id:'WTW-LARGE-OWNERSHIP-TEST',
   source:'SYNTHETIC SCALING FIXTURE',sha256:'f'.repeat(64)},
  start_date:'1999-01-01',entities:{
   horses:Array.from({length:horseCount},(_,i)=>({
    id:'H-1999-TEST-'+String(i+1).padStart(6,'0'),
    name:'Synthetic Horse '+String(i+1),
    ownerId:planner.ownerIdAtHorse(i)
   })),
   organizations:ownerIds.map((id,i)=>({id,name:'Synthetic Owner '+(i+1)})),
   people:[],tracks:[]
  }
 };
 const snapshot=JSON.stringify(universe.entities.horses.slice(0,25));
 const state={runtime:{ownership:{schema:'WTW_RUN_HORSE_OWNERSHIP_V1',
  owner_overrides:{},pending_transfers:{}}}};
 const chosen=ownerIds[100];
 const page=getOwnerPortfolioView(state,universe,chosen,{limit:30});
 assert.equal(page.total,planner.ownerPortfolio(chosen).count);
 assert.equal(page.items.length,Math.min(30,page.total));
 assert.equal(page.source,'APPROVED_WORLD_PLUS_GAME_RUN_OWNERSHIP_DELTAS');
 assert.equal(JSON.stringify(universe.entities.horses.slice(0,25)),snapshot);
 const after=getOwnerPortfolioView(state,universe,chosen,{offset:30,limit:30});
 assert.equal(after.total,page.total);
 assert.ok(after.items.every(x=>x.owner_id===chosen));
});
