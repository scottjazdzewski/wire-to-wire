import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD_SCHEMA,createGameRun,dispatchGameCommand,
 getOperationFinanceView,operationRelationshipCounts,
 getFacilityFinancialReport,getFacilityPortfolio,getOwnerPortfolioView,
 exportGameSave,importGameSave} from '../src/game/index.js';

const world=()=>({schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'WTW-LANE4-V10-ONE-LEDGER',
  source:'ISOLATED_NAMED_OPERATIONS_TEST',sha256:'a'.repeat(64)},
 entities:{horses:[
  {id:'H-K-001',name:'Kingsmere Blue',ownerId:'O-KINGSMERE',
   managementOrganizationId:'O-MIX',careFacilityId:'O-STUD',
   trainingBarnId:'O-MIX',breederId:'O-KINGSMERE',foalingFarmId:'O-STUD'},
  {id:'H-S-001',name:'Small Town Mare',ownerId:'O-SMALL',
   managementOrganizationId:'O-KINGSMERE',careFacilityId:'O-STUD',
   trainingBarnId:'O-MIX',breederId:'O-SMALL',foalingFarmId:'O-STUD'},
  {id:'H-K-002',name:'Kingsmere Foal',ownerId:'O-KINGSMERE',
   managementOrganizationId:'O-KINGSMERE',careFacilityId:'O-STUD',
   breederId:'O-KINGSMERE',foalingFarmId:'O-STUD'},
  {id:'H-M-001',name:'Mixed Stable Runner',ownerId:'O-MIX',
   managementOrganizationId:'O-MIX',careFacilityId:'O-STUD',
   trainingBarnId:'O-MIX',breederId:'O-MIX',foalingFarmId:'O-MIX'}],
 people:[],tracks:[],organizations:[
  {id:'O-KINGSMERE',name:'Kingsmere Farm'},
  {id:'O-SMALL',name:'Small Town Racing'},
  {id:'O-STUD',name:'Commercial Bluegrass Stud'},
  {id:'O-MIX',name:'Mixed Ownership and Training'}]}});
const send=(w,s,id,type,payload,actor='system')=>
 dispatchGameCommand({world:w,state:s,command:{id,type,payload,actor}}).state;
const setup=w=>{
 let s=createGameRun({world:w,runId:'WTW-RUN-FINANCE-V10',
  seed:19990101,player:{role:'owner',involvement:'hands-on',
  operation_id:'O-KINGSMERE'},stableHorseIds:['H-K-001','H-K-002','H-S-001']});
 for(const [id,cash] of [['O-KINGSMERE',500000000],['O-SMALL',12000],
  ['O-STUD',9000000],['O-MIX',30000000]]){
  s=send(w,s,'fund:'+id,'FACILITY_SEED_FUNDS',{
   operation_id:id,balance_minor:cash,
   source_kind:'SIMULATED_TEST',source_ref:'1999 V10 separated business opening cash'});
 }
 return s;
};
const openStud=(w,s)=>{
 s=send(w,s,'site:offer','FACILITY_LIST_PROPERTY',{
  offer_id:'FAC-OFFER-REAL-STUD',name:'Real Commercial Stud',
  type:'STUD_FARM',mode:'PURCHASE',location:{city:'Lexington',state:'KY',country:'USA'},
  price_minor:1000000,stalls:20,max_stalls:40,
  daily_upkeep_minor:1000,daily_boarding_minor:10000,
  land_acres:80,opening_days:0,quality:72,
  source_kind:'SIMULATED_TEST',source_ref:'Named commercial farm purchase fixture'});
 return send(w,s,'site:buy','FACILITY_ACQUIRE',{
  offer_id:'FAC-OFFER-REAL-STUD',operation_id:'O-STUD'});
};

test('one business ledger reconciles small, wealthy, stud and mixed legal-versus-managed operations',()=>{
 const w=world();let s=setup(w);const frozenSource=JSON.stringify(w);
 s=openStud(w,s);
 const site='F-RUN-FAC-OFFER-REAL-STUD';
 s=send(w,s,'contract:funded','FACILITY_BOARDING_CONTRACT',{
  site_id:site,contract_id:'FAC-CONTRACT-NAMED-OWNER',
  payer_organization_id:'O-KINGSMERE',
  stalls:1,duration_days:2,daily_rate_minor:10000},'system');
 s=send(w,s,'operating:day1','ADVANCE_DAY',{});
 const k=getOperationFinanceView(s,w,'O-KINGSMERE',{from:'1999-01-01'});
 const b=getOperationFinanceView(s,w,'O-STUD',{from:'1999-01-01'});
 const small=getOperationFinanceView(s,w,'O-SMALL',{from:'1999-01-01'});
 const mixed=getOperationFinanceView(s,w,'O-MIX',{from:'1999-01-01'});
 for(const view of [k,b,small,mixed]){
  assert.equal(view.cash_reconciliation_status,'RECONCILED');
  assert.equal(view.cash_discrepancy_minor,0);
  assert.equal(view.current_cash_minor,
   view.opening_cash_minor+view.lifetime_ledger_net_minor);
 }
 assert.equal(k.current_cash_minor,500000000-10000);
 assert.equal(b.current_cash_minor,9000000-1000000+10000-1000);
 assert.equal(k.period_cash.outgoing_minor,10000);
 assert.equal(k.category_cash.FACILITY_OPERATIONS.net_minor,-10000);
 assert.equal(b.category_cash.FACILITY_OPERATIONS.net_minor,9000);
 assert.equal(b.category_cash.FACILITY_CAPITAL.net_minor,-1000000);
 assert.equal(b.period_cash.net_minor,-991000);
 assert.equal(getFacilityFinancialReport(s,w,'O-STUD',{
  from:'1999-01-01'}).operating_profit_minor,9000);
 assert.equal(getFacilityFinancialReport(s,w,'O-STUD',{
  from:'1999-01-01'}).cash_minor,b.current_cash_minor);
 assert.equal(getFacilityPortfolio(s,w,'O-STUD').cash_minor,b.current_cash_minor);
 assert.equal(k.legal_vs_managed.legally_owned,2);
 assert.equal(k.legal_vs_managed.managed,2);
 assert.equal(k.legal_vs_managed.managed_non_owned,1);
 assert.equal(k.legal_vs_managed.physically_boarded,0);
 assert.equal(getOwnerPortfolioView(s,w,'O-KINGSMERE',{limit:0}).total,2);
 assert.equal(b.legal_vs_managed.physically_boarded,4);
 assert.equal(b.legal_vs_managed.legally_owned,0);
 assert.equal(small.legal_vs_managed.legally_owned,1);
 assert.equal(small.current_cash_minor,12000);
 assert.equal(mixed.legal_vs_managed.legally_owned,1);
 assert.equal(mixed.legal_vs_managed.managed,2);
 assert.equal(JSON.stringify(w),frozenSource,
  'Owner finances cannot rewrite source ownership or invent horses');
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
});

test('cash tampering is visible as an actual discrepancy, not a fabricated healthy balance',()=>{
 const w=world();let s=setup(w);
 const original=getOperationFinanceView(s,w,'O-KINGSMERE');
 assert.equal(original.cash_reconciliation_status,'RECONCILED');
 const changed=structuredClone(s);
 changed.runtime.finances.operation_balances_minor['O-KINGSMERE']+=5000;
 changed.runtime.finances.balance_minor+=5000;
 const view=getOperationFinanceView(changed,w,'O-KINGSMERE');
 assert.equal(view.cash_reconciliation_status,'DISCREPANCY');
 assert.equal(view.cash_discrepancy_minor,5000);
 assert.equal(view.expected_cash_minor,500000000);
 const unknown=structuredClone(s);
 unknown.event_log=unknown.event_log.filter(x=>
  !(x.kind==='FACILITY_FUNDS_ESTABLISHED'&&
   x.details.operation_id==='O-KINGSMERE'));
 const unverified=getOperationFinanceView(unknown,w,'O-KINGSMERE');
 assert.equal(unverified.cash_reconciliation_status,'UNKNOWN_BASELINE_OR_CASH');
 assert.equal(unverified.opening_cash_minor,null);
 assert.equal(unverified.cash_discrepancy_minor,null);
 const forged=structuredClone(s);
 forged.runtime.finances.ledger.push({date:'1999-01-01',
  kind:'UNSUPPORTED_FUTURE_GAME_PAYMENT',operation_id:'O-KINGSMERE',
  amount_minor:-7000});
 const projection=getOperationFinanceView(forged,w,'O-KINGSMERE');
 assert.equal(projection.category_cash.OTHER.outgoing_minor,7000,
  'Unrecognized future finance kinds must still be included in the cash audit');
 assert.equal(projection.cash_discrepancy_minor,7000);
});

test('reopening after 1999 and 2000 operating days retains an exact book of all cash and real roles',()=>{
 const w=world();let s=setup(w);
 s=openStud(w,s);
 s=send(w,s,'contract:2-years','FACILITY_BOARDING_CONTRACT',{
  site_id:'F-RUN-FAC-OFFER-REAL-STUD',
  contract_id:'FAC-CONTRACT-1999-PAID',
  payer_organization_id:'O-KINGSMERE',stalls:1,
  start_date:'1999-01-02',duration_days:2,daily_rate_minor:10000},'system');
 for(let n=0;n<366;n++)s=send(w,s,'day:1999:'+n,'ADVANCE_DAY',{});
 assert.equal(s.clock.date,'2000-01-02');
 const reopened=importGameSave(exportGameSave(s,w),w);
 assert.deepEqual(reopened,s);
 const stud=getOperationFinanceView(reopened,w,'O-STUD',{
  from:'1999-01-01'});
 const owner=getOperationFinanceView(reopened,w,'O-KINGSMERE',{
  from:'1999-01-01'});
 assert.equal(stud.cash_reconciliation_status,'RECONCILED');
 assert.equal(owner.cash_reconciliation_status,'RECONCILED');
 assert.equal(stud.current_cash_minor,9000000-1000000+20000-366*1000);
 assert.equal(owner.current_cash_minor,500000000-20000);
 assert.equal(stud.legal_vs_managed.physically_boarded,4);
 assert.equal(stud.lifetime_ledger_net_minor,-1000000+20000-366*1000);
 assert.equal(owner.lifetime_ledger_net_minor,-20000);
 assert.equal(operationRelationshipCounts(s,w,'O-KINGSMERE').managed_non_owned,1);
 assert.equal(stud.as_of,reopened.clock.date);
 assert.equal(stud.period_cash.net_minor,stud.lifetime_ledger_net_minor);
});
