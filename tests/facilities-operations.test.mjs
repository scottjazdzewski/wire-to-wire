import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD_SCHEMA,createGameRun,dispatchGameCommand,exportGameSave,
 importGameSave,getFacilityPortfolio,getFacilityMarket,getFacilityFinancialReport} from '../src/game/index.js';
const world=()=>({schema:WORLD_SCHEMA,
 authority:{snapshot_id:'WTW-FACILITIES-TEST',source:'TEST_ONLY',sha256:'e'.repeat(64)},
 start_date:'1999-01-01',
 entities:{horses:[],people:[],tracks:[],organizations:[
  {id:'O-PLAYER',name:'Test owner'},{id:'O-RIVAL',name:'Test rival'}]}});
const game=w=>createGameRun({world:w,runId:'WTW-RUN-FACILITIES-TEST',seed:991,
 player:{role:'owner',involvement:'hands-on',operation_id:'O-PLAYER'}});
const command=(id,type,payload,actor='player')=>({id,type,actor,payload});
const apply=(w,s,id,type,payload,actor)=>dispatchGameCommand({world:w,state:s,
 command:command(id,type,payload,actor)}).state;
const funded=(w,s,id,amount)=>apply(w,s,'seed-'+id,'FACILITY_SEED_FUNDS',{
 operation_id:id,balance_minor:amount,source_kind:'SIMULATED_TEST',source_ref:'1999 test capitalization'},'system');
const offer=(w,s,id,type='FARM',mode='PURCHASE',price=100000000)=>apply(w,s,'offer-'+id,
 'FACILITY_LIST_PROPERTY',{offer_id:'FAC-OFFER-'+id,name:'Test '+id,
 type,mode,location:{city:'Paris',state:'KY',country:'USA'},
 price_minor:price,stalls:20,max_stalls:80,
 daily_upkeep_minor:12000,daily_boarding_minor:5000,
 land_acres:80,opening_days:mode==='NEW_BUILD'?3:0,quality:80,
 source_kind:'SIMULATED_TEST',source_ref:'test market offer'},'system');
test('an individual racing owner can finance and acquire a separate farm',()=>{
 const w=world();let s=game(w);s=funded(w,s,'O-PLAYER',500000000);
 s=offer(w,s,'GENERAL');const before=JSON.stringify(w);
 s=apply(w,s,'buy-1','FACILITY_ACQUIRE',{offer_id:'FAC-OFFER-GENERAL',operation_id:'O-PLAYER'});
 assert.equal(s.player.operation_id,'O-PLAYER');
 assert.equal(getFacilityPortfolio(s,w,'O-PLAYER').owned_sites,1);
 assert.equal(getFacilityPortfolio(s,w,'O-PLAYER').sites[0].type,'FARM');
 assert.equal(s.runtime.finances.balance_minor,400000000);
 assert.equal(JSON.stringify(w),before,'world source remains unchanged');
 assert.equal(getFacilityMarket(s).length,0);
 assert.equal(apply(w,s,'buy-1','FACILITY_ACQUIRE',{offer_id:'FAC-OFFER-GENERAL',operation_id:'O-PLAYER'}).revision,s.revision);
 assert.throws(()=>apply(w,s,'buy-2','FACILITY_ACQUIRE',{offer_id:'FAC-OFFER-GENERAL',operation_id:'O-PLAYER'}),e=>e.code==='FACILITY_TAKEN');
});
test('unfunded, fake-owner, and player-created demand commands are rejected atomically',()=>{
 const w=world();let s=game(w);s=offer(w,s,'STUD','STUD_FARM');
 const before=JSON.stringify(s);
 assert.throws(()=>apply(w,s,'buy','FACILITY_ACQUIRE',{offer_id:'FAC-OFFER-STUD',operation_id:'O-PLAYER'}),e=>e.code==='FACILITY_CASH_SHORT');
 assert.equal(JSON.stringify(s),before);
 s=funded(w,s,'O-PLAYER',500000000);
 assert.throws(()=>apply(w,s,'steal','FACILITY_ACQUIRE',{offer_id:'FAC-OFFER-STUD',operation_id:'O-RIVAL'}),e=>e.code==='FACILITY_PERMISSION');
 assert.throws(()=>apply(w,s,'inject','FACILITY_SEED_FUNDS',{operation_id:'O-RIVAL',balance_minor:900000000}),e=>e.code==='FACILITY_PERMISSION');
 s=apply(w,s,'buy','FACILITY_ACQUIRE',{offer_id:'FAC-OFFER-STUD',operation_id:'O-PLAYER'});
 assert.throws(()=>apply(w,s,'phantom','FACILITY_BOARDING_CONTRACT',
  {site_id:'F-RUN-FAC-OFFER-STUD',contract_id:'FAC-CONTRACT-X',stalls:4,duration_days:10}),e=>e.code==='FACILITY_PERMISSION');
});
test('new stud construction, upgrade limits and contracted boarding settle on game clock',()=>{
 const w=world();let s=game(w);s=funded(w,s,'O-PLAYER',500000000);
 s=offer(w,s,'BARN','STUD_FARM','NEW_BUILD');
 s=apply(w,s,'acq','FACILITY_ACQUIRE',{offer_id:'FAC-OFFER-BARN',operation_id:'O-PLAYER'});
 const site='F-RUN-FAC-OFFER-BARN';
 assert.equal(s.runtime.facilities.sites[site].status,'UNDER_CONSTRUCTION');
 assert.throws(()=>apply(w,s,'early','FACILITY_BOARDING_CONTRACT',{
  site_id:site,contract_id:'FAC-CONTRACT-E',stalls:2,duration_days:4},'system'),e=>e.code==='FACILITY_PROPERTY');
 for(let d=0;d<3;d++)s=apply(w,s,'day-'+d,'ADVANCE_DAY',{});
 assert.equal(s.clock.date,'1999-01-04');
 assert.equal(s.runtime.facilities.sites[site].status,'ACTIVE');
 s=funded(w,s,'O-RIVAL',1000000);
 s=apply(w,s,'contract','FACILITY_BOARDING_CONTRACT',{
  site_id:site,contract_id:'FAC-CONTRACT-FIRST',stalls:5,duration_days:10,
  payer_organization_id:'O-RIVAL'},'system');
 assert.throws(()=>apply(w,s,'over','FACILITY_BOARDING_CONTRACT',{
  site_id:site,contract_id:'FAC-CONTRACT-OVER',stalls:16,duration_days:10,
  payer_organization_id:'O-RIVAL'},'system'),e=>e.code==='FACILITY_OVERBOOKED');
 const before=s.runtime.finances.balance_minor;
 s=apply(w,s,'open-day','ADVANCE_DAY',{});
 assert.equal(s.runtime.finances.balance_minor,before+5*5000-12000);
 s=apply(w,s,'improve','FACILITY_UPGRADE',{
  site_id:site,operation_id:'O-PLAYER',improvement:'FOALING_WING'});
 assert.equal(s.runtime.facilities.sites[site].upgrade.kind,'FOALING_WING');
 assert.equal(JSON.stringify(importGameSave(exportGameSave(s,w),w)),JSON.stringify(s));
});
test('AI rival owners buy properties via same cash reserve and idempotent month policy',()=>{
 const w=world();let s=game(w);s=funded(w,s,'O-PLAYER',500000000);
 s=funded(w,s,'O-RIVAL',900000000);
 s=offer(w,s,'AI-FARM','FARM');
 s=apply(w,s,'ai-tick','FACILITY_AI_CYCLE',{},'system');
 assert.equal(getFacilityPortfolio(s,w,'O-RIVAL').owned_sites,1);
 assert.equal(getFacilityPortfolio(s,w,'O-PLAYER').owned_sites,0);
 const money=s.runtime.finances.operation_balances_minor['O-RIVAL'];
 s=apply(w,s,'ai-tick-other','FACILITY_AI_CYCLE',{},'system');
 assert.equal(s.runtime.finances.operation_balances_minor['O-RIVAL'],money);
 assert.equal(s.runtime.facilities.ai_month['O-RIVAL'],'1999-01');
});
test('business expansion remains a choice; finance, opening and damage never invent race results',()=>{
 const w=world();let s=game(w);s=funded(w,s,'O-PLAYER',500000000);
 s=offer(w,s,'RACE','RACING_STABLE');
 s=apply(w,s,'buy','FACILITY_ACQUIRE',{offer_id:'FAC-OFFER-RACE',operation_id:'O-PLAYER'});
 assert.deepEqual(s.runtime.races,{});
 assert.deepEqual(s.runtime.entries,{});
 assert.equal(s.runtime.facilities.sites['F-RUN-FAC-OFFER-RACE'].contracts.length,0);
 assert.equal(s.event_log.filter(e=>e.kind==='FACILITY_ACQUIRED').length,1);
});

test('AI expands or improves its own facilities without bypassing reserves',()=>{
 const w=world();let s=game(w);
 s=funded(w,s,'O-RIVAL',900000000);
 s=offer(w,s,'GROW','FARM');
 s=apply(w,s,'ai-open','FACILITY_AI_CYCLE',{},'system');
 const site='F-RUN-FAC-OFFER-GROW';
 assert.equal(s.runtime.facilities.sites[site].stalls,20);
 for(let i=0;i<31;i++)s=apply(w,s,'ai-day-'+i,'ADVANCE_DAY',{});
 assert.equal(s.clock.date,'1999-02-01');
 assert.equal(s.runtime.facilities.sites[site].upgrade.kind,'STALL_BLOCK');
 assert.ok(s.runtime.finances.operation_balances_minor['O-RIVAL']<
  900000000-100000000-22000000+1);
 assert.equal(getFacilityPortfolio(s,w,'O-PLAYER').owned_sites,0);
});

test('funded boarding is a balanced payer debit and facility income, including the financial screen',()=>{
 const w=world();let s=game(w);
 s=funded(w,s,'O-PLAYER',500000000);s=funded(w,s,'O-RIVAL',500000);
 s=offer(w,s,'PAID');s=apply(w,s,'paid:buy','FACILITY_ACQUIRE',{
  offer_id:'FAC-OFFER-PAID',operation_id:'O-PLAYER'});
 const site='F-RUN-FAC-OFFER-PAID',contract='FAC-CONTRACT-PAID';
 for(const [id,payer] of [['no-payer',undefined],['self','O-PLAYER'],['unfunded','O-UNSEEN']]){
  assert.throws(()=>apply(w,s,'paid:reject:'+id,'FACILITY_BOARDING_CONTRACT',{
   site_id:site,contract_id:'FAC-CONTRACT-REJECT',stalls:5,
   duration_days:10,payer_organization_id:payer}),e=>Boolean(e.code));
 }
 s=apply(w,s,'paid:book','FACILITY_BOARDING_CONTRACT',{
  site_id:site,contract_id:contract,stalls:5,duration_days:10,
  payer_organization_id:'O-RIVAL'},'system');
 const beforeClient=s.runtime.finances.operation_balances_minor['O-RIVAL'];
 const beforeOperator=s.runtime.finances.operation_balances_minor['O-PLAYER'];
 s=apply(w,s,'paid:day','ADVANCE_DAY',{});
 const tx='FACILITY_BOARD:1999-01-02:'+contract;
 const rows=s.runtime.finances.ledger.filter(x=>x.transaction_id===tx);
 assert.equal(rows.length,2);
 assert.equal(rows.reduce((n,x)=>n+x.amount_minor,0),0);
 assert.deepEqual(new Set(rows.map(x=>x.operation_id)),new Set(['O-PLAYER','O-RIVAL']));
 assert.equal(rows.find(x=>x.kind==='FACILITY_BOARDING_CLIENT_PAYMENT').amount_minor,-25000);
 assert.equal(rows.find(x=>x.kind==='FACILITY_BOARDING_REVENUE').amount_minor,25000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-RIVAL'],beforeClient-25000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-PLAYER'],beforeOperator+25000-12000);
 const operatorReport=getFacilityFinancialReport(s,w,'O-PLAYER');
 const clientReport=getFacilityFinancialReport(s,w,'O-RIVAL');
 assert.equal(operatorReport.revenue_minor,25000);
 assert.equal(operatorReport.operating_profit_minor,13000);
 assert.equal(clientReport.boarding_purchased_minor,25000);
 assert.equal(clientReport.operating_profit_minor,-25000);
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
});
test('client insolvency and legacy anonymous reservations never mint boarding revenue',()=>{
 const w=world();let s=game(w);
 s=funded(w,s,'O-PLAYER',500000000);s=funded(w,s,'O-RIVAL',26000);
 s=offer(w,s,'FAILED');s=apply(w,s,'fail:buy','FACILITY_ACQUIRE',{
  offer_id:'FAC-OFFER-FAILED',operation_id:'O-PLAYER'});
 const site='F-RUN-FAC-OFFER-FAILED';
 assert.throws(()=>apply(w,s,'fail:too-large','FACILITY_BOARDING_CONTRACT',{
  site_id:site,contract_id:'FAC-CONTRACT-TOO-LARGE',stalls:6,duration_days:5,
  payer_organization_id:'O-RIVAL'},'system'),e=>e.code==='FACILITY_CLIENT_CASH');
 s=apply(w,s,'fail:book','FACILITY_BOARDING_CONTRACT',{
  site_id:site,contract_id:'FAC-CONTRACT-FAILED',stalls:5,duration_days:5,
  payer_organization_id:'O-RIVAL'},'system');
 for(let i=0;i<3;i++)s=apply(w,s,'fail:day:'+i,'ADVANCE_DAY',{});
 assert.equal(s.runtime.finances.operation_balances_minor['O-RIVAL'],1000);
 assert.equal(s.runtime.finances.ledger.filter(x=>
  x.kind==='FACILITY_BOARDING_REVENUE'&&x.site_id===site).length,1);
 assert.equal(s.event_log.filter(x=>x.kind==='FACILITY_BOARDING_UNFUNDED').length,2);
 assert.equal(getFacilityFinancialReport(s,w,'O-PLAYER').revenue_minor,25000);
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
 // Older saves still reopen: the original contract remains, but unbacked
 // aggregate demand cannot produce another posted boarding credit.
 let legacy=structuredClone(s);
 delete legacy.runtime.facilities.sites[site].contracts[0].payer_organization_id;
 const prior=legacy.runtime.finances.ledger.filter(x=>x.kind==='FACILITY_BOARDING_REVENUE').length;
 legacy=apply(w,legacy,'fail:legacy-day','ADVANCE_DAY',{});
 assert.equal(legacy.runtime.finances.ledger.filter(x=>x.kind==='FACILITY_BOARDING_REVENUE').length,prior);
 assert.ok(legacy.event_log.some(x=>x.kind==='FACILITY_BOARDING_UNFUNDED'&&
  x.details.reason==='LEGACY_NO_PAYER'));
});
test('two calendar years preserve every paid day and exact balances after save/reopen',()=>{
 const w=world();let s=game(w);
 s=funded(w,s,'O-PLAYER',500000000);s=funded(w,s,'O-RIVAL',10000000);
 s=offer(w,s,'MULTI');s=apply(w,s,'multi:buy','FACILITY_ACQUIRE',{
  offer_id:'FAC-OFFER-MULTI',operation_id:'O-PLAYER'});
 s=apply(w,s,'multi:book','FACILITY_BOARDING_CONTRACT',{
  site_id:'F-RUN-FAC-OFFER-MULTI',contract_id:'FAC-CONTRACT-MULTI',stalls:5,
  start_date:'1999-01-02',duration_days:365,payer_organization_id:'O-RIVAL'},'system');
 for(let i=0;i<370;i++)s=apply(w,s,'multi:day:'+i,'ADVANCE_DAY',{});
 assert.equal(s.clock.date,'2000-01-06');
 const payments=s.runtime.finances.ledger.filter(x=>x.kind==='FACILITY_BOARDING_CLIENT_PAYMENT');
 const receipts=s.runtime.finances.ledger.filter(x=>x.kind==='FACILITY_BOARDING_REVENUE');
 assert.equal(payments.length,365);assert.equal(receipts.length,365);
 assert.ok(payments.some(x=>x.date.startsWith('2000-')));
 assert.equal(payments.reduce((n,x)=>n+x.amount_minor,0),-365*25000);
 assert.equal(receipts.reduce((n,x)=>n+x.amount_minor,0),365*25000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-RIVAL'],10000000-365*25000);
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
 const dupe=apply(w,s,'multi:day:369','ADVANCE_DAY',{});
 assert.deepEqual(dupe,s);
});
