import test from 'node:test';
import assert from 'node:assert/strict';
import {create1999Universe} from '../src/1999/full-world-generator.mjs';
import {WORLD_SCHEMA,createGameRun,dispatchGameCommand,exportGameSave,importGameSave,
 make1999FacilityOffers,make1999FacilityMarketCommands,getFacilityPortfolio,
 getFacilityMarket,getFacilityFinancialReport} from '../src/game/index.js';
const full=create1999Universe({seed:19990101,mode:'CANON_ANCHORED_TEST'});
const world=()=>({schema:WORLD_SCHEMA,authority:{
 snapshot_id:'WTW-1999-FACILITY-MARKET-TEST',source:'TEST_WORLD_ONLY',sha256:'d'.repeat(64)},
 start_date:'1999-01-01',entities:{horses:[],people:[],tracks:[],organizations:[
  {id:'O-PLAYER',name:'Test owner'},{id:'O-AI',name:'Test AI competitor'}]}});
const run=w=>createGameRun({world:w,runId:'WTW-RUN-1999-FACILITY-MARKET',
 seed:19990101,player:{role:'owner',involvement:'hands-on',operation_id:'O-PLAYER'}});
const issue=(s,w,id,type,payload,actor='player')=>dispatchGameCommand({state:s,world:w,
 command:{id,type,payload,actor}}).state;
const funding=(s,w,id,amount)=>issue(s,w,'funds:'+id,'FACILITY_SEED_FUNDS',{
 operation_id:id,balance_minor:amount,source_kind:'SIMULATED_TEST',
 source_ref:'TEST_ONLY_1999_OWNER_CAPITAL'},'system');
test('actual generated 1999 farms become bounded source-linked modeled offers, not synthetic towns',()=>{
 const offers=make1999FacilityOffers(full,{limit:4,startIndex:10});
 assert.equal(offers.length,4);
 assert.equal(new Set(offers.map(x=>x.source_facility_id)).size,4);
 for(let i=0;i<4;i++){
  const src=full.facilityAt(full.counts.trainers+i+10),offer=offers[i];
  assert.equal(offer.source_facility_id,src.id);
  assert.deepEqual(offer.location,src.location);
  assert.equal(offer.name,src.name);
  assert.equal(offer.source_kind,'SIMULATED_TEST');
  assert.equal(offer.mode,'PURCHASE');
  assert.ok(offer.price_minor>0);
  assert.ok(offer.staff_required>0);
 }
 assert.deepEqual(offers,make1999FacilityOffers(full,{limit:4,startIndex:10}));
 const commands=make1999FacilityMarketCommands(full,{limit:2,startIndex:10});
 assert.equal(commands[0].type,'FACILITY_LIST_PROPERTY');
 assert.equal(commands[0].actor,'system');
 assert.equal(commands[0].payload.source_facility_id,offers[0].source_facility_id);
});
test('never sell an already operated race barn or a track training centre through farm market',()=>{
 const swapped={...full,counts:{...full.counts,trainers:0}};
 assert.throws(()=>make1999FacilityOffers(swapped,{limit:1}),e=>e.code==='FACILITY_1999_UNAVAILABLE');
 const stud={...full,facilityAt:index=>({...full.facilityAt(index),facilityClass:'STUD_FARM'})};
 assert.equal(make1999FacilityOffers(stud,{limit:1})[0].type,'STUD_FARM');
});
test('property offer is idempotent and its origin facility cannot be relisted twice',()=>{
 const w=world(),cmd=make1999FacilityMarketCommands(full,{limit:1})[0];
 let s=run(w);s=dispatchGameCommand({state:s,world:w,command:cmd}).state;
 assert.equal(getFacilityMarket(s).length,1);
 const retry=dispatchGameCommand({state:s,world:w,command:cmd});
 assert.equal(retry.duplicate,true);
 assert.throws(()=>issue(s,w,'duplicate:offer','FACILITY_LIST_PROPERTY',{
  ...cmd.payload,offer_id:'FAC-OFFER-SECOND'},'system'),e=>e.code==='FACILITY_SOURCE_DUPLICATE');
});
test('owner acquires 1999-property, staffs it, sets maintenance and earns audited boarding income',()=>{
 const w=world(),origin=full.facilityAt(full.counts.trainers+2);
 const offer=make1999FacilityOffers(full,{limit:1,startIndex:2})[0];
 let s=run(w);s=funding(s,w,'O-PLAYER',10000000000);
 s=issue(s,w,'listing','FACILITY_LIST_PROPERTY',offer,'system');
 const canonical=JSON.stringify(w);
 s=issue(s,w,'purchase','FACILITY_ACQUIRE',{operation_id:'O-PLAYER',offer_id:offer.offer_id});
 const siteId='F-RUN-'+offer.offer_id;
 assert.equal(s.runtime.facilities.sites[siteId].source_facility_id,origin.id);
 assert.equal(s.runtime.facilities.sites[siteId].staff_count,offer.staff_required);
 assert.equal(getFacilityPortfolio(s,w,'O-PLAYER').sites[0].source_facility_id,origin.id);
 assert.equal(JSON.stringify(w),canonical);
 s=issue(s,w,'board','FACILITY_BOARDING_CONTRACT',{
  site_id:siteId,contract_id:'FAC-CONTRACT-1999',stalls:2,duration_days:5},'system');
 const before=JSON.stringify(s);
 assert.throws(()=>issue(s,w,'cut','FACILITY_SET_STAFFING',{
  operation_id:'O-PLAYER',site_id:siteId,staff_count:0}),
 e=>e.code==='FACILITY_STAFFING_CONTRACT');
 assert.equal(JSON.stringify(s),before);
 s=issue(s,w,'premium','FACILITY_SET_MAINTENANCE',{
  operation_id:'O-PLAYER',site_id:siteId,policy:'PREMIUM'});
 const balance=s.runtime.finances.balance_minor;
 s=issue(s,w,'nextday','ADVANCE_DAY',{});
 const maintenance=Math.round(offer.maintenance_daily_minor*1.8);
 const wages=offer.staff_required*offer.staff_wage_daily_minor;
 const expected=2*offer.daily_boarding_minor-offer.daily_upkeep_minor-maintenance-wages;
 assert.equal(s.runtime.finances.balance_minor,balance+expected);
 const report=getFacilityFinancialReport(s,w,'O-PLAYER',{from:'1999-01-01',to:'1999-01-02'});
 assert.equal(report.revenue_minor,2*offer.daily_boarding_minor);
 assert.equal(report.payroll_minor,wages);
 assert.equal(report.maintenance_minor,maintenance);
 assert.equal(report.operating_profit_minor,expected);
 assert.equal(report.capital_investment_minor,offer.price_minor);
 assert.equal(report.net_cash_flow_minor,expected-offer.price_minor);
 assert.equal(report.sites[0].site_id,siteId);
 assert.equal(JSON.stringify(importGameSave(exportGameSave(s,w),w)),JSON.stringify(s));
});
test('understaffing reduces operating capacity until the owner actually hires',()=>{
 const w=world(),offer=make1999FacilityOffers(full,{limit:1,startIndex:5})[0];
 let s=run(w);s=funding(s,w,'O-PLAYER',10000000000);
 s=issue(s,w,'list','FACILITY_LIST_PROPERTY',offer,'system');
 s=issue(s,w,'buy','FACILITY_ACQUIRE',{offer_id:offer.offer_id,operation_id:'O-PLAYER'});
 const id='F-RUN-'+offer.offer_id;
 s=issue(s,w,'zero','FACILITY_SET_STAFFING',{operation_id:'O-PLAYER',site_id:id,staff_count:0});
 assert.throws(()=>issue(s,w,'book','FACILITY_BOARDING_CONTRACT',{
  site_id:id,contract_id:'FAC-CONTRACT-NOSTAFF',stalls:1,duration_days:7},'system'),
 e=>e.code==='FACILITY_INVALID');
 s=issue(s,w,'hire','FACILITY_SET_STAFFING',{
  operation_id:'O-PLAYER',site_id:id,staff_count:offer.staff_required});
 s=issue(s,w,'book2','FACILITY_BOARDING_CONTRACT',{
  site_id:id,contract_id:'FAC-CONTRACT-WITHSTAFF',stalls:1,duration_days:7},'system');
 assert.equal(s.runtime.facilities.sites[id].contracts.length,1);
});
