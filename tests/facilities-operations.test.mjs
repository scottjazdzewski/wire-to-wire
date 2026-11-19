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
const offer=(w,s,id,type='FARM',mode='PURCHASE',price=100000000,extra={})=>apply(w,s,'offer-'+id,
 'FACILITY_LIST_PROPERTY',{offer_id:'FAC-OFFER-'+id,name:'Test '+id,
 type,mode,location:{city:'Paris',state:'KY',country:'USA'},
 price_minor:price,stalls:20,max_stalls:80,
 daily_upkeep_minor:12000,daily_boarding_minor:5000,
 land_acres:80,opening_days:mode==='NEW_BUILD'?3:0,quality:80,
 source_kind:'SIMULATED_TEST',source_ref:'test market offer',...extra},'system');
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

test('facility payroll, utilities, repairs, property purchase and renovation post balanced external payee receipts',()=>{
 const w=world();let s=game(w);
 s=funded(w,s,'O-PLAYER',500000000);
 s=offer(w,s,'LEDGER','FARM','PURCHASE',100000000,{
  staff_required:2,staff_wage_daily_minor:7500,maintenance_daily_minor:3000});
 s=apply(w,s,'ledger:buy','FACILITY_ACQUIRE',{
  offer_id:'FAC-OFFER-LEDGER',operation_id:'O-PLAYER'});
 const site='F-RUN-FAC-OFFER-LEDGER';
 s=apply(w,s,'ledger:day','ADVANCE_DAY',{});
 s=apply(w,s,'ledger:upgrade','FACILITY_UPGRADE',{
  site_id:site,operation_id:'O-PLAYER',improvement:'CARE_SYSTEM'});
 const transactions=new Map();
 for(const entry of s.runtime.finances.ledger){
  if(!entry.transaction_id?.startsWith('FACILITY_OUTFLOW:'))continue;
  if(!transactions.has(entry.transaction_id))transactions.set(entry.transaction_id,[]);
  transactions.get(entry.transaction_id).push(entry);
 }
 const expected=['FACILITY_PURCHASE','FACILITY_UPGRADE','FACILITY_DAILY_OPERATIONS',
  'FACILITY_STAFF_PAYROLL','FACILITY_MAINTENANCE'];
 assert.equal(transactions.size,expected.length);
 for(const kind of expected){
  const group=[...transactions.values()].find(rows=>rows.some(x=>x.kind===kind));
  assert.ok(group,'missing '+kind);
  assert.equal(group.length,2);
  assert.equal(group.reduce((n,x)=>n+x.amount_minor,0),0);
  const business=group.find(x=>x.kind===kind),outside=group.find(x=>x.kind==='FACILITY_EXTERNAL_RECEIPT');
  assert.ok(business.amount_minor<0&&outside.amount_minor>0);
  assert.equal(business.operation_id,'O-PLAYER');
  assert.equal(outside.operation_id,null);
  assert.equal(outside.person_id,null);
  assert.equal(outside.receipt_for_kind,kind);
  assert.equal(outside.counterparty_scope,'MODELED_OUTSIDE_ECONOMY_NO_IDENTITY_CLAIM');
 }
 const report=getFacilityFinancialReport(s,w,'O-PLAYER');
 assert.equal(report.payroll_minor,15000);
 assert.equal(report.maintenance_minor,3000);
 assert.equal(report.overhead_minor,12000);
 assert.equal(report.capital_investment_minor,108500000);
 assert.equal(report.cash_minor,500000000-108500000-30000);
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
});
test('multi-season facility payroll and upkeep preserve exact payee balances, operator cash and idempotency',()=>{
 const w=world();let s=game(w);
 s=funded(w,s,'O-PLAYER',500000000);
 s=offer(w,s,'SEASONS','FARM','PURCHASE',100000000,{
  staff_required:3,staff_wage_daily_minor:5000,maintenance_daily_minor:2500});
 s=apply(w,s,'season:buy','FACILITY_ACQUIRE',{
  offer_id:'FAC-OFFER-SEASONS',operation_id:'O-PLAYER'});
 for(let d=0;d<370;d++)s=apply(w,s,'season:day:'+d,'ADVANCE_DAY',{});
 assert.equal(s.clock.date,'2000-01-06');
 const o=s.runtime.finances.ledger.filter(x=>x.kind==='FACILITY_EXTERNAL_RECEIPT');
 const wages=o.filter(x=>x.receipt_for_kind==='FACILITY_STAFF_PAYROLL');
 const upkeep=o.filter(x=>x.receipt_for_kind==='FACILITY_DAILY_OPERATIONS');
 const upkeepTotal=370*12000,wageTotal=370*3*5000,repairTotal=370*2500;
 assert.equal(wages.length,370);assert.equal(upkeep.length,370);
 assert.equal(wages.reduce((n,x)=>n+x.amount_minor,0),wageTotal);
 assert.equal(o.filter(x=>x.receipt_for_kind==='FACILITY_MAINTENANCE')
  .reduce((n,x)=>n+x.amount_minor,0),repairTotal);
 assert.equal(upkeep.reduce((n,x)=>n+x.amount_minor,0),upkeepTotal);
 assert.equal(s.runtime.finances.operation_balances_minor['O-PLAYER'],
  500000000-100000000-upkeepTotal-wageTotal-repairTotal);
 assert.equal(s.runtime.finances.balance_minor,
  s.runtime.finances.operation_balances_minor['O-PLAYER']);
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
 assert.deepEqual(apply(w,s,'season:day:369','ADVANCE_DAY',{}),s);
});

test('struggling farm stops unpaid payroll without overdraft and reopens only after real paid boarding cash settles arrears',()=>{
 const w=world();let s=game(w);
 s=funded(w,s,'O-PLAYER',111000000);
 s=funded(w,s,'O-RIVAL',100000000);
 s=offer(w,s,'INSOLVENT','FARM','PURCHASE',100000000,{
  staff_required:2,staff_wage_daily_minor:500000,maintenance_daily_minor:12000000});
 s=apply(w,s,'insolvent:buy','FACILITY_ACQUIRE',{
  offer_id:'FAC-OFFER-INSOLVENT',operation_id:'O-PLAYER'});
 const farm='F-RUN-FAC-OFFER-INSOLVENT';
 assert.equal(s.runtime.finances.operation_balances_minor['O-PLAYER'],11000000);
 // A separate already-established stable operated by the same company earns
 // a genuinely funded third-party boarding fee. No invented new payer cash.
 s=apply(w,s,'insolvent:existing-site','FACILITY_REGISTER_RACING_SITE',{
  site_id:'F-1999-SUPPORT-BARN',site_type:'RACING_STABLE',
  operator_organization_id:'O-PLAYER',facility_owner_organization_id:'O-PLAYER',
  residence_kind:'ORGANIZATION_HOME_SITE',name:'Existing supporting barn',
  location:{city:'Paris',state:'KY',country:'USA'},host_track_id:null,
  stalls_total:2,staff_required:1,staff_present:1,quality:70,
  daily_upkeep_minor:0,daily_boarding_minor:10000000,
  staff_wage_daily_minor:0,source_kind:'MODELED_1999_GAME_SITE',
  source_ref:'ISOLATED_SAVED_OPERATING_STABLE_TEST'},'system');
 s=apply(w,s,'insolvent:external-board','FACILITY_BOARDING_CONTRACT',{
  site_id:'F-1999-SUPPORT-BARN',contract_id:'FAC-CONTRACT-SUPPORT-1',
  payer_organization_id:'O-RIVAL',stalls:1,duration_days:4,
  daily_rate_minor:10000000},'system');
 const before=w.entities.horses.length;
 s=apply(w,s,'insolvent:day:1','ADVANCE_DAY',{});
 assert.equal(s.runtime.facilities.sites[farm].status,'INSOLVENT');
 assert.equal(s.runtime.facilities.sites[farm].unpaid_liability_minor,13012000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-PLAYER'],21000000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-RIVAL'],90000000);
 const accrual=s.runtime.finances.ledger.filter(x=>x.kind==='FACILITY_UNPAID_OPERATING_OBLIGATION');
 assert.equal(accrual.length,1);
 assert.equal(accrual[0].amount_minor,0,'Accrual is not falsely recorded as paid cash');
 assert.equal(accrual[0].obligation_minor,13012000);
 assert.equal(accrual[0].wages_unpaid_minor,1000000);
 assert.equal(s.runtime.finances.ledger.filter(x=>x.site_id===farm&&
  x.kind==='FACILITY_STAFF_PAYROLL').length,0,'No false paid employee wages');
 assert.throws(()=>apply(w,s,'insolvent:blocked-board','FACILITY_BOARDING_CONTRACT',{
  site_id:farm,contract_id:'FAC-CONTRACT-UNFUNDED',
  payer_organization_id:'O-RIVAL',stalls:1,duration_days:3},'system'),
  e=>e.code==='FACILITY_PROPERTY','Closed farm cannot book new clients');
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
 s=apply(w,s,'insolvent:day:2','ADVANCE_DAY',{});
 assert.equal(s.runtime.facilities.sites[farm].status,'INSOLVENT',
  'Legal boarding-rate cap requires an additional funded day to cover arrears');
 assert.equal(s.runtime.finances.operation_balances_minor['O-PLAYER'],31000000);
 s=apply(w,s,'insolvent:day:3','ADVANCE_DAY',{});
 assert.equal(s.runtime.facilities.sites[farm].status,'ACTIVE');
 assert.equal(s.runtime.facilities.sites[farm].unpaid_liability_minor,0);
 assert.equal(s.runtime.facilities.sites[farm].insolvent_since,null);
 const arrears=s.runtime.finances.ledger.filter(x=>x.site_id===farm&&
  x.kind==='FACILITY_ARREARS_SETTLED');
 assert.equal(arrears.length,1);
 assert.equal(arrears[0].amount_minor,-13012000);
 const payee=s.runtime.finances.ledger.find(x=>
  x.transaction_id===arrears[0].transaction_id&&
  x.kind==='FACILITY_EXTERNAL_RECEIPT');
 assert.ok(payee);
 assert.equal(payee.amount_minor,13012000);
 assert.equal(payee.operation_id,null);
 const report=getFacilityFinancialReport(s,w,'O-PLAYER');
 assert.equal(report.currently_unpaid_liabilities_minor,0);
 assert.equal(report.previously_unpaid_obligations_settled_minor,13012000);
 assert.equal(report.cash_minor,s.runtime.finances.operation_balances_minor['O-PLAYER']);
 assert.ok(report.cash_minor>=0,'Recovery cannot require an overdraft');
 assert.equal(w.entities.horses.length,before,'Financial rescue cannot create fictitious horses');
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
});

test('actual named groom and breeding attendant wages settle by permanent P-ID and match operator payroll',()=>{
 const w=world();
 w.entities.people.push(
  {id:'P-EMPLOYEE-GROOM',name:'Mae Harris',role:'groom',workplaceId:'O-PLAYER'},
  {id:'P-EMPLOYEE-BREED',name:'Edith Green',role:'breeding_attendant',workplaceId:'O-PLAYER'},
  {id:'P-UNRELATED',name:'Wrong Site Groom',role:'groom',workplaceId:'O-RIVAL'});
 let s=game(w);
 s=funded(w,s,'O-PLAYER',500000000);
 s=offer(w,s,'NAMED','FARM','PURCHASE',100000000,{
  staff_required:2,staff_wage_daily_minor:5000,maintenance_daily_minor:3000});
 s=apply(w,s,'named:buy','FACILITY_ACQUIRE',{
  offer_id:'FAC-OFFER-NAMED',operation_id:'O-PLAYER'});
 const farm='F-RUN-FAC-OFFER-NAMED';
 const assign=(id,wage)=>apply(w,s,'named:assign:'+id,'FACILITY_ASSIGN_NAMED_STAFF',{
  site_id:farm,person_id:id,daily_wage_minor:wage});
 assert.throws(()=>assign('P-UNRELATED',7000),e=>e.code==='FACILITY_NAMED_STAFF');
 s=assign('P-EMPLOYEE-GROOM',8000);
 s=assign('P-EMPLOYEE-BREED',9000);
 assert.throws(()=>apply(w,s,'named:reduce','FACILITY_SET_STAFFING',{
  operation_id:'O-PLAYER',site_id:farm,staff_count:1}),e=>e.code==='FACILITY_NAMED_STAFF');
 const names=getFacilityPortfolio(s,w,'O-PLAYER').sites[0].named_employee_directory.
  map(x=>x.name).sort();
 assert.deepEqual(names,['Edith Green','Mae Harris']);
 s=apply(w,s,'named:first-day','ADVANCE_DAY',{});
 const day=s.clock.date,tx='FACILITY_OUTFLOW:'+day+':'+farm+':FACILITY_STAFF_PAYROLL';
 const entries=s.runtime.finances.ledger.filter(x=>x.transaction_id===tx);
 assert.equal(entries.length,3);
 assert.equal(entries.reduce((n,x)=>n+x.amount_minor,0),0);
 assert.equal(entries.find(x=>x.kind==='FACILITY_STAFF_PAYROLL').amount_minor,-17000);
 assert.deepEqual(entries.filter(x=>x.kind==='FACILITY_STAFF_WAGE_RECEIPT').
  map(x=>[x.person_id,x.amount_minor]).sort((a,b)=>a[0].localeCompare(b[0])),[
  ['P-EMPLOYEE-BREED',9000],['P-EMPLOYEE-GROOM',8000]]);
 assert.equal(s.runtime.people['P-EMPLOYEE-GROOM'].wages_paid_minor,8000);
 assert.equal(s.runtime.people['P-EMPLOYEE-BREED'].wages_paid_minor,9000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-PLAYER'],
  500000000-100000000-12000-17000-3000);
 const report=getFacilityFinancialReport(s,w,'O-PLAYER');
 assert.equal(report.payroll_minor,17000);
 assert.equal(report.named_employee_wages_paid_minor,17000);
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
 s=apply(w,s,'named:release','FACILITY_RELEASE_NAMED_STAFF',{
  site_id:farm,person_id:'P-EMPLOYEE-GROOM'});
 s=apply(w,s,'named:second-day','ADVANCE_DAY',{});
 const second='FACILITY_OUTFLOW:'+s.clock.date+':'+farm+':FACILITY_STAFF_PAYROLL';
 const secondEntries=s.runtime.finances.ledger.filter(x=>x.transaction_id===second);
 assert.equal(secondEntries.reduce((n,x)=>n+x.amount_minor,0),0);
 assert.equal(secondEntries.find(x=>x.kind==='FACILITY_STAFF_PAYROLL').amount_minor,-14000);
 assert.equal(secondEntries.find(x=>x.kind==='FACILITY_STAFF_WAGE_RECEIPT').amount_minor,9000);
 assert.equal(secondEntries.find(x=>x.kind==='FACILITY_EXTERNAL_RECEIPT').amount_minor,5000,
  'Unassigned position remains a namedly anonymous modeled wage pool');
 assert.equal(s.runtime.people['P-EMPLOYEE-GROOM'].wages_paid_minor,8000);
 assert.equal(s.runtime.people['P-EMPLOYEE-BREED'].wages_paid_minor,18000);
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
});


test('unpaid identified employee wages become a named claim and later settle once with the outside arrears',()=>{
 const w=world();
 w.entities.people.push({id:'P-GROOM-CLAIM',name:'Robin Ellis',
  role:'groom',workplaceId:'O-PLAYER'});
 let s=game(w);
 s=funded(w,s,'O-PLAYER',110000000);
 s=funded(w,s,'O-RIVAL',200000000);
 s=offer(w,s,'CLAIMS','FARM','PURCHASE',100000000,{
  staff_required:1,staff_wage_daily_minor:100000,
  maintenance_daily_minor:10000000});
 s=apply(w,s,'claim:acquire','FACILITY_ACQUIRE',{
  offer_id:'FAC-OFFER-CLAIMS',operation_id:'O-PLAYER'});
 const farm='F-RUN-FAC-OFFER-CLAIMS';
 s=apply(w,s,'claim:worker','FACILITY_ASSIGN_NAMED_STAFF',{
  site_id:farm,person_id:'P-GROOM-CLAIM',daily_wage_minor:250000});
 s=apply(w,s,'claim:unfunded','ADVANCE_DAY',{});
 assert.equal(s.runtime.facilities.sites[farm].status,'INSOLVENT');
 assert.equal(s.runtime.facilities.sites[farm].unpaid_liability_minor,10262000);
 assert.equal(s.runtime.facilities.sites[farm].
  unpaid_named_wages_minor['P-GROOM-CLAIM'],250000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-PLAYER'],10000000);
 assert.equal(s.runtime.people['P-GROOM-CLAIM'],undefined,
  'Unpaid P-ID is not credited as if it received a salary');
 s=apply(w,s,'claim:unfunded-day','ADVANCE_DAY',{});
 assert.equal(s.runtime.facilities.sites[farm].unpaid_liability_minor,10262000,
  'Closed site cannot silently book more payable day expenses');
 s=apply(w,s,'claim:cash-site','FACILITY_REGISTER_RACING_SITE',{
  site_id:'F-1999-CLAIMS-BARN',site_type:'RACING_STABLE',
  operator_organization_id:'O-PLAYER',facility_owner_organization_id:'O-PLAYER',
  residence_kind:'ORGANIZATION_HOME_SITE',name:'Claim rescue barn',
  location:{city:'Paris',state:'KY',country:'USA'},host_track_id:null,
  stalls_total:2,staff_required:1,staff_present:1,quality:70,
  daily_upkeep_minor:0,daily_boarding_minor:10000000,
  staff_wage_daily_minor:0,source_kind:'MODELED_1999_GAME_SITE',
  source_ref:'NARROW_BUSINESS_CASH_RECOVERY_TEST'},'system');
 s=apply(w,s,'claim:outside-booking','FACILITY_BOARDING_CONTRACT',{
  site_id:'F-1999-CLAIMS-BARN',contract_id:'FAC-CONTRACT-CLAIM-RESCUE',
  payer_organization_id:'O-RIVAL',stalls:1,
  duration_days:3,daily_rate_minor:10000000},'system');
 s=apply(w,s,'claim:rescue-first-day','ADVANCE_DAY',{});
 assert.equal(s.runtime.facilities.sites[farm].status,'INSOLVENT');
 assert.equal(s.runtime.finances.operation_balances_minor['O-PLAYER'],20000000);
 s=apply(w,s,'claim:rescue-second-day','ADVANCE_DAY',{});
 assert.equal(s.runtime.facilities.sites[farm].status,'INSOLVENT',
  'The first two legal-rate receipts do not yet cover arrears plus normal payroll');
 assert.equal(s.runtime.finances.operation_balances_minor['O-PLAYER'],30000000);
 s=apply(w,s,'claim:rescue-third-day','ADVANCE_DAY',{});
 assert.equal(s.runtime.facilities.sites[farm].status,'ACTIVE');
 const named=s.runtime.finances.ledger.filter(x=>
  x.person_id==='P-GROOM-CLAIM'&&x.kind==='FACILITY_STAFF_WAGE_RECEIPT');
 assert.equal(named.length,2,'One delayed wage receipt and one current payroll');
 assert.equal(named.reduce((sum,x)=>sum+x.amount_minor,0),500000);
 assert.equal(s.runtime.people['P-GROOM-CLAIM'].wages_paid_minor,500000);
 const arrears=s.runtime.finances.ledger.filter(x=>
  x.site_id===farm&&x.kind==='FACILITY_ARREARS_SETTLED');
 assert.equal(arrears.length,1);
 assert.equal(arrears[0].amount_minor,-10262000);
 const legs=s.runtime.finances.ledger.filter(x=>
  x.transaction_id===arrears[0].transaction_id);
 assert.equal(legs.length,3);
 assert.equal(legs.reduce((sum,x)=>sum+x.amount_minor,0),0);
 assert.equal(legs.find(x=>x.kind==='FACILITY_STAFF_WAGE_RECEIPT').amount_minor,250000);
 assert.equal(legs.find(x=>x.kind==='FACILITY_EXTERNAL_RECEIPT').amount_minor,10012000);
 assert.equal(s.runtime.facilities.sites[farm].unpaid_liability_minor,0);
 const view=getFacilityFinancialReport(s,w,'O-PLAYER',{from:'1999-01-01'});
 assert.equal(view.currently_unpaid_liabilities_minor,0);
 assert.equal(view.named_employee_wages_paid_minor,500000);
 assert.equal(view.previously_unpaid_obligations_settled_minor,10262000);
 assert.ok(view.cash_minor>0);
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
 assert.deepEqual(apply(w,s,'claim:rescue-third-day','ADVANCE_DAY',{}),s,
  'Replaying the same day receipt cannot pay employee claims a second time');
});

test('distinct legal property owner and operating stable pay separate capital and labor bills without title confusion',()=>{
 const w=world();let s=game(w);
 s=funded(w,s,'O-PLAYER',100000000);
 s=funded(w,s,'O-RIVAL',100000000);
 s=apply(w,s,'tenant:register','FACILITY_REGISTER_RACING_SITE',{
  site_id:'F-1999-TENANT-BARN',site_type:'RACING_STABLE',
  operator_organization_id:'O-RIVAL',facility_owner_organization_id:'O-PLAYER',
  residence_kind:'ORGANIZATION_HOME_SITE',name:'Tenant training barn',
  location:{city:'Paris',state:'KY',country:'USA'},host_track_id:null,
  stalls_total:10,staff_required:2,staff_present:1,quality:70,
  daily_upkeep_minor:5000,daily_boarding_minor:1000,
  staff_wage_daily_minor:1000,source_kind:'MODELED_1999_GAME_SITE',
  source_ref:'SCOPED_TENANT_PROPERTY_TEST'},'system');
 const site='F-1999-TENANT-BARN';
 const owner=getFacilityPortfolio(s,w,'O-PLAYER');
 const tenant=getFacilityPortfolio(s,w,'O-RIVAL');
 assert.equal(owner.owned_sites,1);
 assert.equal(owner.operated_sites,0);
 assert.equal(owner.sites[0].legal_title_held,true);
 assert.equal(owner.sites[0].operating_control_held,false);
 assert.equal(tenant.owned_sites,0);
 assert.equal(tenant.operated_sites,1);
 assert.equal(tenant.sites[0].legal_title_held,false);
 assert.equal(tenant.sites[0].operating_control_held,true);
 assert.throws(()=>apply(w,s,'tenant:owner-overreach','FACILITY_SET_STAFFING',{
  operation_id:'O-PLAYER',site_id:site,staff_count:2}),
  e=>e.code==='FACILITY_PROPERTY','Legal landlord cannot staff another business');
 assert.throws(()=>apply(w,s,'tenant:owner-maintenance','FACILITY_SET_MAINTENANCE',{
  operation_id:'O-PLAYER',site_id:site,policy:'PREMIUM'}),
  e=>e.code==='FACILITY_PROPERTY','Landlord cannot dictate tenant operating spending');
 s=apply(w,s,'tenant:staff','FACILITY_SET_STAFFING',{
  operation_id:'O-RIVAL',site_id:site,staff_count:2},'system');
 s=apply(w,s,'tenant:maintain','FACILITY_SET_MAINTENANCE',{
  operation_id:'O-RIVAL',site_id:site,policy:'PREMIUM'},'system');
 s=apply(w,s,'tenant:operate-day','ADVANCE_DAY',{});
 assert.equal(s.runtime.facilities.sites[site].status,'ACTIVE');
 assert.equal(s.runtime.finances.operation_balances_minor['O-RIVAL'],100000000-7000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-PLAYER'],100000000);
 assert.equal(getFacilityFinancialReport(s,w,'O-RIVAL').payroll_minor,2000);
 assert.equal(getFacilityFinancialReport(s,w,'O-PLAYER').payroll_minor,0);
 assert.throws(()=>apply(w,s,'tenant:operator-capital','FACILITY_UPGRADE',{
  operation_id:'O-RIVAL',site_id:site,improvement:'CARE_SYSTEM'},'system'),
  e=>e.code==='FACILITY_PROPERTY','Tenant cannot spend landlord capital as owner');
 s=apply(w,s,'tenant:landlord-upgrade','FACILITY_UPGRADE',{
  operation_id:'O-PLAYER',site_id:site,improvement:'CARE_SYSTEM'});
 assert.equal(s.runtime.finances.operation_balances_minor['O-PLAYER'],
  100000000-8500000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-RIVAL'],
  100000000-7000);
 assert.equal(getFacilityFinancialReport(s,w,'O-PLAYER',{
  from:'1999-01-01'}).capital_investment_minor,8500000);
 assert.equal(getFacilityFinancialReport(s,w,'O-RIVAL').capital_investment_minor,0);
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
});
