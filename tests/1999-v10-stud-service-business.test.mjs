import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameRun,dispatchGameCommand,exportGameSave,importGameSave,
 getStudServiceBusinessView,getStudServiceOfferMarket,
 validateGameRun} from '../src/game/index.js';
import {WORLD_SCHEMA} from '../src/game/contracts.js';

const orgs=[
 ['O-KINGSMERE','Kingsmere Farm'],['O-SMALL','Hill County Racing'],
 ['O-STUD','Commercial Bloodstock Farm'],['O-MIX','Training and Breeding Partnership']
].map(([id,name])=>({id,name}));
const horses=[
 {id:'H-MARE-ELITE',name:'Blue Ink',status:'BROODMARE',ownerId:'O-KINGSMERE',
  managementOrganizationId:'O-MIX',careFacilityId:'O-STUD'},
 {id:'H-MARE-SMALL',name:'Quiet Bay',status:'BROODMARE',ownerId:'O-SMALL',
  managementOrganizationId:'O-KINGSMERE',careFacilityId:'O-STUD'},
 {id:'H-MARE-MIX',name:'Backstretch Dawn',status:'BROODMARE',ownerId:'O-MIX',
  managementOrganizationId:'O-STUD',careFacilityId:'O-MIX'},
 {id:'H-STALLION-ELITE',name:'Crown Minister',status:'STALLION',
  ownerId:'O-KINGSMERE',careFacilityId:'O-STUD',serviceBookLimit:2},
 {id:'H-STALLION-MIX',name:'West Barn',status:'STALLION',
  ownerId:'O-MIX',careFacilityId:'O-MIX'}
];
const world=()=>({schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'WTW-LANE4-COMMERCE-BOOKING-V10',source:'ISOLATED_LEDGER_TEST_NO_HISTORY',
  sha256:'d'.repeat(64)},
 entities:{horses:structuredClone(horses),people:[],tracks:[],organizations:structuredClone(orgs)}});
const create=(w,operation='O-SMALL')=>createGameRun({
 world:w,runId:'WTW-RUN-V10-PAID-STUD-SERVICES',seed:19990101,
 player:{role:'owner',involvement:'hands-on',operation_id:operation}});
const call=(w,s,id,type,payload,actor='system')=>
 dispatchGameCommand({world:w,state:s,command:{id,type,payload,actor}});
const seed=(w,s,operation,amount)=>call(w,s,'fund:'+operation,'FACILITY_SEED_FUNDS',{
 operation_id:operation,balance_minor:amount,source_kind:'SIMULATED_TEST',
 source_ref:'Game finance scenario, not historical cash'},'system').state;
const initial=w=>{
 let s=create(w);
 for(const [id,minor] of [['O-KINGSMERE',10000000],['O-SMALL',25000],
  ['O-STUD',500000],['O-MIX',700000]])
  s=seed(w,s,id,minor);
 return s;
};
const book=(w,s,id,mare,stallion,recipient,fee,actor='system',terms={})=>
 call(w,s,'book:'+id,'BOOK_PAID_STUD_SERVICE',{
  booking_id:id,mare_id:mare,stallion_id:stallion,
  fee_recipient_organization_id:recipient,fee_minor:fee,...terms},actor);

test('wealthy legal mare owner pays an independent commercial stud, both accounts settle and no source horse changes',()=>{
 const w=world(),original=JSON.stringify(w);let s=initial(w);
 const settled=book(w,s,'1999-KING-01','H-MARE-ELITE','H-STALLION-ELITE','O-STUD',350000);
 s=settled.state;
 const items=s.runtime.finances.ledger.filter(x=>x.transaction_id==='STUD_SERVICE:1999-KING-01');
 assert.equal(items.length,2);
 assert.deepEqual(items.map(x=>x.amount_minor).sort((a,b)=>a-b),[-350000,350000]);
 assert.deepEqual(new Set(items.map(x=>x.operation_id)),new Set(['O-KINGSMERE','O-STUD']));
 assert.ok(items.every(x=>x.provenance==='MODELED_LIVE_GAME_SERVICE_NOT_BIRTH'));
 assert.equal(s.runtime.finances.operation_balances_minor['O-KINGSMERE'],9650000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-STUD'],850000);
 const major=getStudServiceBusinessView(s,w,'O-KINGSMERE');
 const stud=getStudServiceBusinessView(s,w,'O-STUD');
 assert.equal(major.stud_fees_paid_minor,350000);
 assert.equal(stud.stud_fees_received_minor,350000);
 assert.equal(stud.net_stud_cash_minor,350000);
 assert.equal(s.runtime.stud_services.by_id['1999-KING-01'].status,'COVERING_SERVICE_BOOKED');
 assert.equal(JSON.stringify(w),original,'Source owner, manager, parents and standing site remain unchanged');
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
 const replay=book(w,s,'1999-KING-01','H-MARE-ELITE','H-STALLION-ELITE','O-STUD',350000);
 assert.equal(replay.duplicate,true);
 assert.equal(replay.state,s);
});
test('struggling small owner cannot book an unaffordable service; low-price service still works without subsidy',()=>{
 const w=world();let s=initial(w);
 s=call(w,s,'quote:high','PUBLISH_STUD_SERVICE_OFFER',{
  offer_id:'SMALL-QUOTE-HIGH',stallion_id:'H-STALLION-ELITE',
  stallion_owner_organization_id:'O-KINGSMERE',
  fee_recipient_organization_id:'O-STUD',fee_minor:150000,
  expires_on:'1999-12-31'},'system').state;
 const before=structuredClone(s);
 assert.throws(()=>book(w,s,'1999-SMALL-FAIL','H-MARE-SMALL',
  'H-STALLION-ELITE','O-STUD',150000,'player',{
   offer_id:'SMALL-QUOTE-HIGH'}),
  e=>e.code==='STUD_INSUFFICIENT_FUNDS');
 assert.deepEqual(s,before,'Rejected debt cannot mutate real account or sire/dam');
 assert.equal(getStudServiceBusinessView(s,w,'O-SMALL').bookings_count,0);
 s=call(w,s,'quote:withdraw','WITHDRAW_STUD_SERVICE_OFFER',{
  offer_id:'SMALL-QUOTE-HIGH'},'system').state;
 s=call(w,s,'quote:discount','PUBLISH_STUD_SERVICE_OFFER',{
  offer_id:'SMALL-QUOTE-DISCOUNT',stallion_id:'H-STALLION-ELITE',
  stallion_owner_organization_id:'O-KINGSMERE',
  fee_recipient_organization_id:'O-STUD',fee_minor:10000,
  expires_on:'1999-12-31'},'system').state;
 s=book(w,s,'1999-SMALL-CASH','H-MARE-SMALL',
  'H-STALLION-ELITE','O-STUD',10000,'player',{
   offer_id:'SMALL-QUOTE-DISCOUNT'}).state;
 assert.equal(s.runtime.finances.balance_minor,15000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-STUD'],510000);
 const m=getStudServiceBusinessView(s,w,'O-SMALL');
 assert.equal(m.stud_fees_paid_minor,10000);
 assert.equal(m.operation_cash_minor,15000);
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
});
test('Kingsmere may manage but cannot claim a separately legally owned mare',()=>{
 const w=world();let s=create(w,'O-KINGSMERE');
 for(const [id,minor] of [['O-KINGSMERE',5000000],['O-STUD',100000]])
  s=seed(w,s,id,minor);
 const original=structuredClone(s);
 assert.throws(()=>book(w,s,'1999-ILLEGAL','H-MARE-SMALL','H-STALLION-ELITE',
  'O-STUD',10000,'player'),e=>e.code==='STUD_LEGAL_OWNER');
 assert.deepEqual(s,original);
 assert.equal(w.entities.horses.find(h=>h.id==='H-MARE-SMALL').managementOrganizationId,
  'O-KINGSMERE','Managed inventory is not legal property');
});
test('mixed owned breeding/training operation books its own stock without fake payment',()=>{
 const w=world();let s=initial(w);
 s=book(w,s,'1999-OWN-STOCK','H-MARE-MIX','H-STALLION-MIX','O-MIX',0).state;
 assert.equal(s.runtime.finances.operation_balances_minor['O-MIX'],700000);
 assert.equal(s.runtime.finances.ledger.filter(x=>x.booking_id==='1999-OWN-STOCK').length,0);
 assert.equal(getStudServiceBusinessView(s,w,'O-MIX').bookings_count,1);
 assert.equal(getStudServiceBusinessView(s,w,'O-MIX').net_stud_cash_minor,0);
 assert.throws(()=>book(w,s,'1999-PRETEND-SELF','H-MARE-MIX','H-STALLION-MIX',
  'O-MIX',1000),e=>e.code==='STUD_SELF_SETTLEMENT');
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
});
test('invalid recipients, double mare covers and cap violation never change owner finances',()=>{
 const w=world();let s=initial(w);
 assert.throws(()=>book(w,s,'FAKE-RECIPIENT','H-MARE-ELITE','H-STALLION-ELITE',
  'O-SMALL',15000),e=>e.code==='STUD_RECIPIENT');
 s=book(w,s,'FIRST-COVER','H-MARE-ELITE','H-STALLION-ELITE','O-STUD',15000).state;
 const before=structuredClone(s);
 assert.throws(()=>book(w,s,'ANOTHER-SIRE','H-MARE-ELITE','H-STALLION-MIX',
  'O-MIX',10000),e=>e.code==='STUD_MARE_BOOKED');
 assert.deepEqual(s,before);
 s=book(w,s,'SECOND-COVER','H-MARE-SMALL','H-STALLION-ELITE','O-STUD',10000).state;
 const denied=structuredClone(s);
 assert.throws(()=>book(w,s,'THIRD-INVALID','H-MARE-MIX','H-STALLION-ELITE',
  'O-STUD',10000),e=>e.code==='STUD_BOOK_FULL');
 assert.deepEqual(s,denied);
});
test('1999 and 2000 services survive daily simulation and reopening with independent annual limits',()=>{
 const w=world();let s=initial(w);
 s=book(w,s,'KING-1999','H-MARE-ELITE','H-STALLION-ELITE','O-STUD',40000).state;
 for(let day=0;day<366;day++)s=call(w,s,'day:'+day,'ADVANCE_DAY',{}).state;
 assert.equal(s.clock.date,'2000-01-02');
 s=book(w,s,'KING-2000','H-MARE-ELITE','H-STALLION-ELITE','O-STUD',60000).state;
 const all=s.runtime.finances.ledger.filter(x=>
  x.kind==='STUD_SERVICE_FEE_PAYMENT'||x.kind==='STUD_SERVICE_FEE_INCOME');
 assert.equal(all.length,4);
 assert.equal(all.reduce((n,x)=>n+x.amount_minor,0),0);
 assert.equal(getStudServiceBusinessView(s,w,'O-STUD').stud_fees_received_minor,100000);
 assert.equal(getStudServiceBusinessView(s,w,'O-KINGSMERE').stud_fees_paid_minor,100000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-KINGSMERE'],9900000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-STUD'],600000);
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
});

test('reopening cannot accept forged fee receipts or changed stud service capacity',()=>{
 const w=world();let s=initial(w);
 s=book(w,s,'PAID-WITH-RECEIPT','H-MARE-ELITE','H-STALLION-ELITE',
  'O-STUD',75000).state;
 const forged=structuredClone(s);
 forged.runtime.finances.ledger=forged.runtime.finances.ledger.filter(x=>
  !(x.transaction_id==='STUD_SERVICE:PAID-WITH-RECEIPT'&&
   x.kind==='STUD_SERVICE_FEE_INCOME'));
 assert.throws(()=>validateGameRun(forged,w),e=>e.code==='STUD_SAVE');
 const changed=structuredClone(s);
 changed.runtime.stud_services.by_id['PAID-WITH-RECEIPT'].fee_minor=90000;
 assert.throws(()=>validateGameRun(changed,w),e=>e.code==='STUD_SAVE');
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
});

test('player-paid stud fees require legal stallion-owner approval and can split the commercial farm income',()=>{
 const w=world();let s=initial(w);
 assert.throws(()=>book(w,s,'ONE-DOLLAR-CHEAT','H-MARE-SMALL',
  'H-STALLION-ELITE','O-STUD',1,'player'),
  e=>e.code==='STUD_OFFER_REQUIRED',
  'Mare owner cannot choose an arbitrary fee without legal stallion-owner offer');
 assert.throws(()=>call(w,s,'quote:impersonate','PUBLISH_STUD_SERVICE_OFFER',{
  offer_id:'FAKE-QUOTE',stallion_id:'H-STALLION-ELITE',
  stallion_owner_organization_id:'O-KINGSMERE',
  fee_recipient_organization_id:'O-STUD',
  fee_minor:20000,owner_share_minor:15000,expires_on:'1999-12-31'},'player'),
  e=>e.code==='STUD_OFFER_AUTHORITY');
 assert.equal(Object.keys(s.runtime.stud_services.offers).length,0);
 s=call(w,s,'quote:approved','PUBLISH_STUD_SERVICE_OFFER',{
  offer_id:'APPROVED-OWNER-1999',stallion_id:'H-STALLION-ELITE',
  stallion_owner_organization_id:'O-KINGSMERE',
  fee_recipient_organization_id:'O-STUD',fee_minor:20000,
  owner_share_minor:15000,expires_on:'1999-12-31'},'system').state;
 const quotes=getStudServiceOfferMarket(s,w);
 assert.equal(quotes.total,1);
 assert.equal(quotes.items[0].owner_share_minor,15000);
 assert.equal(quotes.items[0].fee_recipient_organization_id,'O-STUD');
 const untouched=structuredClone(s);
 assert.throws(()=>book(w,s,'HIDDEN-DISCOUNT','H-MARE-SMALL',
  'H-STALLION-ELITE','O-STUD',100,'player',{
   offer_id:'APPROVED-OWNER-1999',owner_share_minor:15000}),
  e=>e.code==='STUD_REVENUE_SPLIT'||e.code==='STUD_OFFER_TERMS');
 assert.deepEqual(s,untouched);
 s=book(w,s,'SPLIT-1999-001','H-MARE-SMALL',
  'H-STALLION-ELITE','O-STUD',20000,'player',{
   offer_id:'APPROVED-OWNER-1999',owner_share_minor:15000}).state;
 assert.equal(s.runtime.finances.operation_balances_minor['O-SMALL'],5000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-STUD'],505000);
 assert.equal(s.runtime.finances.operation_balances_minor['O-KINGSMERE'],10015000);
 const rows=s.runtime.finances.ledger.filter(x=>
  x.transaction_id==='STUD_SERVICE:SPLIT-1999-001');
 assert.equal(rows.length,3);
 assert.equal(rows.reduce((n,x)=>n+x.amount_minor,0),0);
 assert.deepEqual(rows.map(x=>[x.operation_id,x.amount_minor]),[
  ['O-SMALL',-20000],['O-STUD',5000],['O-KINGSMERE',15000]]);
 assert.equal(rows[2].kind,'STUD_SERVICE_STALLION_OWNER_ROYALTY');
 assert.equal(s.runtime.stud_services.by_id['SPLIT-1999-001'].offer_id,
  'APPROVED-OWNER-1999');
 const owner=getStudServiceBusinessView(s,w,'O-KINGSMERE');
 const farm=getStudServiceBusinessView(s,w,'O-STUD');
 assert.equal(owner.stallion_legal_owner_royalty_minor,15000);
 assert.equal(owner.net_stud_cash_minor,15000);
 assert.equal(farm.stud_facility_income_minor,5000);
 assert.equal(farm.net_stud_cash_minor,5000);
 assert.equal(getStudServiceBusinessView(s,w,'O-SMALL').stud_fees_paid_minor,20000);
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
});
test('signed stud offers cannot be silently repriced or retrospectively orphan three-way receipts',()=>{
 const w=world();let s=initial(w);
 s=call(w,s,'quote:multilateral','PUBLISH_STUD_SERVICE_OFFER',{
  offer_id:'SIGNED-MULTILATERAL',stallion_id:'H-STALLION-ELITE',
  stallion_owner_organization_id:'O-KINGSMERE',
  fee_recipient_organization_id:'O-STUD',fee_minor:20000,
  owner_share_minor:12000,expires_on:'1999-12-31'},'system').state;
 assert.throws(()=>book(w,s,'INVALID-SIGNATURE','H-MARE-SMALL',
  'H-STALLION-ELITE','O-STUD',20000,'player',{
   offer_id:'SIGNED-MULTILATERAL',owner_share_minor:11000}),
  e=>e.code==='STUD_OFFER_TERMS');
 s=book(w,s,'SIGNED-SETTLEMENT','H-MARE-SMALL',
  'H-STALLION-ELITE','O-STUD',20000,'player',{
   offer_id:'SIGNED-MULTILATERAL',owner_share_minor:12000}).state;
 const amended=structuredClone(s);
 amended.runtime.stud_services.offers['SIGNED-MULTILATERAL'].fee_minor=19000;
 assert.throws(()=>validateGameRun(amended,w),e=>e.code==='STUD_SAVE');
 const missing=structuredClone(s);
 missing.runtime.finances.ledger=missing.runtime.finances.ledger.filter(x=>
  !(x.kind==='STUD_SERVICE_STALLION_OWNER_ROYALTY'&&
   x.transaction_id==='STUD_SERVICE:SIGNED-SETTLEMENT'));
 assert.throws(()=>validateGameRun(missing,w),e=>e.code==='STUD_SAVE');
 const after=importGameSave(exportGameSave(s,w),w);
 assert.deepEqual(after,s);
 assert.equal(getStudServiceOfferMarket(after,w).total,1);
});
