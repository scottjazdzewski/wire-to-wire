import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD_SCHEMA,createGameRun,dispatchGameCommand,exportGameSave,
 importGameSave,getFacilityPortfolio,getFacilityMarket} from '../src/game/index.js';
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
 s=apply(w,s,'contract','FACILITY_BOARDING_CONTRACT',{
  site_id:site,contract_id:'FAC-CONTRACT-FIRST',stalls:5,duration_days:10},'system');
 assert.throws(()=>apply(w,s,'over','FACILITY_BOARDING_CONTRACT',{
  site_id:site,contract_id:'FAC-CONTRACT-OVER',stalls:16,duration_days:10},'system'),e=>e.code==='FACILITY_OVERBOOKED');
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
