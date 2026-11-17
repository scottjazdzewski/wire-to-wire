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
  to_owner_id:'O-1999-002',transfer_type:'SALE',price_minor:50000
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
 // Even two correctly signed old ledger legs are not reusable for a new
 // sale request; each posted payment must bind its own request ID.
 for(const [operation,kind,amount] of [
  ['O-1999-002','HORSE_SALE_BUYER_PAYMENT',-50000],
  ['O-1999-001','HORSE_SALE_SELLER_RECEIPT',50000]
 ])passed.runtime.finances.ledger.push({
  transaction_id:'OLD-SALE',request_id:'ANOTHER-SALE',
  horse_id:'H-1999-000002',from_owner_id:'O-1999-001',to_owner_id:'O-1999-002',
  kind,operation_id:operation,amount_minor:amount,settlement_status:'POSTED'
 });
 assert.throws(()=>send(world,passed,cmd('system:post','COMMIT_HORSE_TRANSFER',{
  request_id:'SALE-TEST-1',finance_ledger_id:'POSTED-LEDGER-1'
 },'system')),e=>e.code==='FINANCE_NOT_SETTLED',
 'One posted-looking row cannot pay for the horse');
 assert.equal(currentHorseOwnerId(passed,world,'H-1999-000002'),'O-1999-001');
 assert.throws(()=>send(world,passed,cmd('system:old-settlement','COMMIT_HORSE_TRANSFER',{
  request_id:'SALE-TEST-1',finance_ledger_id:'OLD-SALE'
 },'system')),e=>e.code==='FINANCE_NOT_SETTLED');
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

test('seller-approved sale posts exact buyer debit and seller receipt before permanent ownership transfer',()=>{
 const world=w();let s=run(world);
 for(const [id,amount] of [['O-1999-001',100000],['O-1999-002',90000]])
  s=send(world,s,cmd('sale:seed:'+id,'FACILITY_SEED_FUNDS',{
   operation_id:id,balance_minor:amount,source_kind:'SIMULATED_TEST',
   source_ref:'two-party business payment fixture'},'system')).state;
 assert.throws(()=>send(world,s,cmd('sale:unpriced','REQUEST_HORSE_TRANSFER',{
  request_id:'UNPRICED-1999',horse_id:'H-1999-000001',
  to_owner_id:'O-1999-002',transfer_type:'SALE'
 })),e=>e.code==='HORSE_SALE_PRICE');
 s=send(world,s,cmd('sale:request','REQUEST_HORSE_TRANSFER',{
  request_id:'SALE-PAID-1999',horse_id:'H-1999-000001',
  to_owner_id:'O-1999-002',transfer_type:'SALE',price_minor:50000
 })).state;
 const buyerPoor=structuredClone(s);
 buyerPoor.runtime.finances.operation_balances_minor['O-1999-002']=49999;
 assert.throws(()=>send(world,buyerPoor,cmd('sale:poor','SETTLE_HORSE_SALE',{
  request_id:'SALE-PAID-1999',settlement_id:'PAID-1999'
 },'system')),e=>e.code==='HORSE_SALE_FUNDS');
 assert.equal(currentHorseOwnerId(buyerPoor,world,'H-1999-000001'),'O-1999-001');
 const result=send(world,s,cmd('sale:settle','SETTLE_HORSE_SALE',{
  request_id:'SALE-PAID-1999',settlement_id:'PAID-1999'
 },'system'));
 s=result.state;
 const entries=s.runtime.finances.ledger.filter(x=>x.transaction_id==='HORSE_SALE:PAID-1999');
 assert.equal(entries.length,2);
 assert.equal(entries.reduce((sum,x)=>sum+x.amount_minor,0),0);
 assert.equal(entries.find(x=>x.kind==='HORSE_SALE_BUYER_PAYMENT').amount_minor,-50000);
 assert.equal(entries.find(x=>x.kind==='HORSE_SALE_SELLER_RECEIPT').amount_minor,50000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-1999-002'],40000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-1999-001'],150000);
 assert.equal(s.runtime.finances.balance_minor,150000);
 assert.equal(currentHorseOwnerId(s,world,'H-1999-000001'),'O-1999-002');
 assert.equal(getOwnerPortfolioView(s,world,'O-1999-002').total,2);
 assert.equal(getOfficeView(s,world).player_owner_horse_count,1);
 assert.ok(result.events.some(e=>e.kind==='HORSE_SALE_CASH_SETTLED'));
 assert.ok(result.events.some(e=>e.kind==='HORSE_OWNERSHIP_TRANSFERRED'));
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
 const replay=send(world,s,cmd('sale:settle','SETTLE_HORSE_SALE',{
  request_id:'SALE-PAID-1999',settlement_id:'PAID-1999'
 },'system'));
 assert.equal(replay.duplicate,true);assert.equal(replay.state,s);
 assert.equal(world.entities.horses[0].ownerId,'O-1999-001');
});
test('separate horse sales in 1999 and 2000 preserve earlier payments across the save',()=>{
 const world=w();let s=run(world);
 for(const [id,amount] of [['O-1999-001',100000],['O-1999-002',200000]])
  s=send(world,s,cmd('annual:fund:'+id,'FACILITY_SEED_FUNDS',{
   operation_id:id,balance_minor:amount,source_kind:'SIMULATED_TEST',
   source_ref:'multi-year sale test'},'system')).state;
 const sell=(id,horse,price)=>{
  s=send(world,s,cmd('annual:req:'+id,'REQUEST_HORSE_TRANSFER',{
   request_id:id,horse_id:horse,to_owner_id:'O-1999-002',
   transfer_type:'SALE',price_minor:price})).state;
  s=send(world,s,cmd('annual:pay:'+id,'SETTLE_HORSE_SALE',{
   request_id:id,settlement_id:id},'system')).state;
 };
 sell('SALE-1999-A','H-1999-000001',40000);
 for(let i=0;i<366;i++)s=send(world,s,cmd('annual:day:'+i,'ADVANCE_DAY',{})).state;
 assert.equal(s.clock.date,'2000-01-02');
 sell('SALE-2000-B','H-1999-000002',60000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-1999-001'],200000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-1999-002'],100000);
 assert.equal(s.stable_horse_ids.length,0);
 assert.equal(s.runtime.finances.ledger.filter(x=>x.kind==='HORSE_SALE_BUYER_PAYMENT').length,2);
 assert.equal(s.runtime.finances.ledger.filter(x=>x.kind==='HORSE_SALE_SELLER_RECEIPT').length,2);
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});

test('actual registered 1999 horse sale changes saved owner, cash, trainer client and stable with no duplicate horse',async()=>{
 const {readFileSync}=await import('node:fs');
 const {createHash}=await import('node:crypto');
 const {build1999PilotGameRun}=await import('../src/game/1999-pilot-fixture.js');
 const source=JSON.parse(readFileSync(new URL('../public/data/wtw-1999-founding-directory-v1.json',import.meta.url),'utf8'));
 const trainers=JSON.parse(readFileSync(new URL('../public/data/wtw-1999-trainer-pilot-v1.json',import.meta.url),'utf8'));
 const manifest=JSON.parse(readFileSync(new URL('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json',import.meta.url),'utf8'));
 const people=new Map([...source.people,...trainers.trainers].map(x=>[x.id,x]));
 const cw={schema:WORLD_SCHEMA,start_date:'1999-01-01',
  authority:{snapshot_id:'WTW-REGISTERED-SALE-38',source:'TEST_PILOT_NOT_HISTORICAL',
   sha256:createHash('sha256').update('registered-sale/1999').digest('hex')},
  entities:{horses:source.horses,organizations:source.organizations,tracks:source.tracks,
   people:[...people.values()]}};
 let s=build1999PilotGameRun({world:cw,manifest}),originalWorld=JSON.stringify(cw);
 // Before any race is booked: a transfer must not cancel an accepted entry.
 const h=Object.values(s.runtime.registered_horses.by_id).
  find(x=>x.owner_organization_id===s.player.operation_id);
 assert.ok(h);
 const buyer=Object.values(s.runtime.registered_horses.by_id).
  find(x=>x.owner_organization_id!==s.player.operation_id).owner_organization_id;
 const oldOwner=h.owner_organization_id,oldTrainer=h.trainer_id,oldBarn=h.current_residence_id;
 const oldHorse=structuredClone(h),oldCare=structuredClone(s.runtime.horse[h.horse_id]);
 const oldStable=getStableView(s,cw).length;
 const oldPortfolio=getOwnerPortfolioView(s,cw,oldOwner,{limit:0}).total;
 const newPortfolio=getOwnerPortfolioView(s,cw,buyer,{limit:0}).total;
 const beforeBuyer=s.runtime.finances.operation_balances_minor[buyer];
 const beforeSeller=s.runtime.finances.operation_balances_minor[oldOwner];
 const issue=(id,type,payload,actor='player')=>{
  s=dispatchGameCommand({world:cw,state:s,command:{id,type,payload,actor}}).state;
 };
 issue('pilot:sale:request','REQUEST_HORSE_TRANSFER',{
  request_id:'PILOT-CAREER-SALE',horse_id:h.horse_id,
  to_owner_id:buyer,transfer_type:'SALE',price_minor:125000});
 issue('pilot:sale:settle','SETTLE_HORSE_SALE',{
  request_id:'PILOT-CAREER-SALE',settlement_id:'PILOT-CAREER-SALE'},'system');
 const sold=s.runtime.registered_horses.by_id[h.horse_id];
 assert.equal(sold.owner_organization_id,buyer);
 assert.equal(sold.trainer_id,oldTrainer);
 assert.equal(sold.current_residence_id,oldBarn);
 assert.equal(sold.racing_barn_id,oldBarn);
 assert.equal(sold.registration_receipt_id,oldHorse.registration_receipt_id);
 assert.deepEqual(sold.career,oldHorse.career);
 assert.equal(s.runtime.horse[h.horse_id].finance.spent_minor,0);
 assert.equal(s.runtime.horse[h.horse_id].finance.lifetime_minor,
  oldCare.finance.lifetime_minor);
 assert.equal(s.runtime.finances.operation_balances_minor[buyer],beforeBuyer-125000);
 assert.equal(s.runtime.finances.operation_balances_minor[oldOwner],beforeSeller+125000);
 assert.equal(getStableView(s,cw).length,oldStable-1);
 assert.equal(getOwnerPortfolioView(s,cw,oldOwner,{limit:0}).total,oldPortfolio-1);
 assert.equal(getOwnerPortfolioView(s,cw,buyer,{limit:0}).total,newPortfolio+1);
 assert.deepEqual(importGameSave(exportGameSave(s,cw),cw),s);
 assert.equal(JSON.stringify(cw),originalWorld);
 issue('pilot:sale:next','ADVANCE_DAY',{},'system');
 const latest=s.runtime.finances.ledger.filter(x=>
  x.kind==='HORSE_CARE_OWNER_PAYMENT'&&x.horse_id===h.horse_id);
 assert.ok(latest.length>=1,'Horse remains in a live care program after transfer');
 assert.equal(latest.at(-1).operation_id,buyer,'New owner pays the next daily care bill');
 assert.deepEqual(importGameSave(exportGameSave(s,cw),cw),s);
});

test('source-backed registered horse replaces its source identity in paged owner portfolios',()=>{
 const world=w(),state=run(world);
 const id='H-GAME-1999-REGISTERED-SOURCE-MIRROR';
 // Read projection only: this compact fixture intentionally avoids inventing
 // an entire registered career record to satisfy the full admission schema.
 state.runtime.registered_horses.by_id[id]={
  horse_id:id,id,name:'First Fictional Runner',registered_name:'First Fictional Runner',
  world_source_horse_id:'H-1999-000001',owner_organization_id:'O-1999-001'
 };
 const page=getOwnerPortfolioView(state,world,'O-1999-001',{limit:20});
 assert.equal(page.total,2);
 assert.ok(page.items.some(h=>h.id===id));
 assert.ok(!page.items.some(h=>h.id==='H-1999-000001'),
  'One source-linked animal cannot appear twice as distinct owned horses');
 assert.equal(world.entities.horses[0].ownerId,'O-1999-001');
});

test('real booked race cannot be sold out from under trainer, jockey and buyer; funds remain untouched',async()=>{
 const {readFileSync}=await import('node:fs');
 const {createHash}=await import('node:crypto');
 const {build1999PilotGameRun}=await import('../src/game/1999-pilot-fixture.js');
 const {get1999HorseRaceOpportunities}=await import('../src/game/index.js');
 const load=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
 const d=load('../public/data/wtw-1999-founding-directory-v1.json');
 const t=load('../public/data/wtw-1999-trainer-pilot-v1.json');
 const j=load('../public/data/wtw-1999-jockey-pilot-v1.json');
 const cohort=load('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
 const people=[...new Map([...d.people,...t.trainers,...j.jockeys].map(x=>[x.id,x])).values()];
 const cw={schema:WORLD_SCHEMA,start_date:'1999-01-01',
  authority:{snapshot_id:'WTW-REGISTERED-SALE-ENTRY-GATE',
   source:'TEST_NOT_HISTORICAL',sha256:createHash('sha256').
    update('registered-sale-race-commitment-gate').digest('hex')},
  entities:{horses:d.horses,people,organizations:d.organizations,tracks:d.tracks}};
 let s=build1999PilotGameRun({world:cw,manifest:cohort,jockeys:j.jockeys});
 const call=(id,type,payload={},actor='system')=>{
  s=dispatchGameCommand({state:s,world:cw,
   command:{id,type,payload,actor}}).state;
 };
 call('sale:gate:day','ADVANCE_DAY',{});
 const h=Object.values(s.runtime.registered_horses.by_id).
  find(x=>x.owner_organization_id===s.player.operation_id&&x.host_track_id==='T-0017');
 assert.ok(h);
 const available=get1999HorseRaceOpportunities(s,cw,h.horse_id,{
  includeProposals:false}).rows.find(x=>x.status==='PLAYER_CAN_ENTER'&&x.track_id===h.host_track_id);
 assert.ok(available,'Existing game should expose actual open race for the player');
 call('sale:gate:enter','ENTER_1999_RACE',{
  race_id:available.race_id,horse_id:h.horse_id},'player');
 const newOwner=Object.values(s.runtime.registered_horses.by_id).
  find(x=>x.owner_organization_id!==h.owner_organization_id).owner_organization_id;
 call('sale:gate:request','REQUEST_HORSE_TRANSFER',{
  request_id:'SALE-WITH-ENTRY',horse_id:h.horse_id,to_owner_id:newOwner,
  transfer_type:'SALE',price_minor:125000},'player');
 const prior=structuredClone(s);
 assert.throws(()=>dispatchGameCommand({state:s,world:cw,command:{
  id:'sale:gate:blocked','SETTLE_HORSE_SALE',actor:'system',
  payload:{request_id:'SALE-WITH-ENTRY',settlement_id:'SALE-WITH-ENTRY'}}}),
  e=>e.code==='HORSE_TRANSFER_RACE_ENTRY');
 assert.deepEqual(s,prior,'Rejected sale cannot debit or alter the prior saved run');
 assert.equal(s.runtime.registered_horses.by_id[h.horse_id].owner_organization_id,
  prior.player.operation_id);
 assert.deepEqual(importGameSave(exportGameSave(s,cw),cw),s);
});
