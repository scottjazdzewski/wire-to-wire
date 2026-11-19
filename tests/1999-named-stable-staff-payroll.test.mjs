import test from 'node:test';
import assert from 'node:assert/strict';
import {createFacilityState,advanceFacilities,facilityAction,
 validateFacilityState,facilityFinancialReport}
 from '../src/game/facility-operations.js';

const owner='O-000061',groom='P-GROOM-001',trainer='P-TRAINER-001',
 track='T-0001',site='F-1999-OPENING-T-0001-P-TRAINER-001';
const world={entities:{
 organizations:[{id:owner,name:'Kingsmere Farm'}],
 tracks:[{id:track,name:'Keeneland'}],
 people:[{id:groom,role:'groom',workplaceId:track,
  ratings:{horseCare:75}},{id:trainer,role:'trainer',workplaceId:track}]
}};
function fixture(){
 const barn={id:site,offer_id:null,owner_id:owner,
  operator_organization_id:owner,
  name:'Kingsmere Farm — Keeneland Barn — Trainer',
  type:'RACING_STABLE',residence_kind:'TRACK_TRAINER_BARN',
  host_track_id:track,head_trainer_person_id:trainer,
  location:{city:'Lexington',state:'Kentucky',country:'USA'},
  source_kind:'MODELED_1999_GAME_SITE',source_ref:'TEST_EXISTING_INDUSTRY',
  acquired_date:'1999-01-01',open_date:'1999-01-01',status:'ACTIVE',
  stalls:60,max_stalls:60,quality:80,daily_upkeep_minor:0,
  daily_boarding_minor:0,staff_required:1,staff_count:1,
  staff_wage_daily_minor:9000,track_rent_daily_minor:0,
  maintenance_daily_minor:0,maintenance_policy:'STANDARD',
  contracts:[],upgrade:null,land_acres:0,
  payroll_staff:[{person_id:groom,role:'groom',
   daily_wage_minor:9000,started_on:'1999-01-01',status:'ACTIVE',
   source:'MODELED_EMPLOYMENT_FROM_PERSISTED_LOCAL_PERSON'}]};
 const facilities=createFacilityState();
 facilities.sites[site]=barn;
 return {clock:{date:'1999-01-02'},
  player:{role:'owner',operation_id:owner},
  runtime:{facilities,people:{},
   finances:{operation_balances_minor:{[owner]:1200000},
    balance_minor:1200000,ledger:[]}}};
}
test('Kingsmere pays an actual same-track worker once per day and keeps both sides in canonical receipts',()=>{
 const state=fixture(),events=[];
 validateFacilityState(state,world);
 const advance=()=>advanceFacilities({state,world,
  emit:(kind,details)=>events.push({kind,details})});
 advance();
 assert.equal(state.runtime.finances.balance_minor,1191000);
 assert.equal(state.runtime.finances.operation_balances_minor[owner],1191000);
 assert.equal(state.runtime.people[groom].stable_payroll_earned_minor,9000);
 assert.equal(state.runtime.people[groom].stable_employer_operation_id,owner);
 assert.equal(state.runtime.people[groom].stable_employer_site_id,site);
 assert.equal(state.runtime.people[groom].last_pay_date,'1999-01-02');
 assert.equal(state.runtime.finances.ledger.length,2);
 const [debit,receipt]=state.runtime.finances.ledger;
 assert.equal(debit.kind,'FACILITY_STAFF_PAYROLL');
 assert.equal(debit.operation_id,owner);
 assert.equal(debit.amount_minor,-9000);
 assert.equal(receipt.kind,'FACILITY_NAMED_EMPLOYEE_RECEIPT');
 assert.equal(receipt.person_id,groom);
 assert.equal(receipt.amount_minor,9000);
 assert.equal(receipt.employer_operation_id,owner);
 assert.equal(debit.transaction_id,receipt.transaction_id);
 assert.equal(state.runtime.finances.ledger.reduce((sum,e)=>sum+e.amount_minor,0),0);
 assert.equal(events.filter(e=>e.kind==='FACILITY_EMPLOYEE_PAID').length,1);
 validateFacilityState(state,world);
 const copy=JSON.parse(JSON.stringify(state));
 assert.deepEqual(copy,state,'employee bank and receipts must survive JSON save/reopen');
 advance();
 assert.deepEqual(state,copy,'same saved game day never debits or credits payroll twice');
 state.clock.date='1999-01-03';
 advance();
 assert.equal(state.runtime.people[groom].stable_payroll_earned_minor,18000);
 assert.equal(state.runtime.finances.ledger.length,4);
 assert.equal(state.runtime.finances.balance_minor,1182000);
 assert.equal(events.filter(e=>e.kind==='FACILITY_EMPLOYEE_PAID').length,2);
 const report=facilityFinancialReport(state,world,owner,{
  from:'1999-01-02',to:'1999-01-03'});
 assert.equal(report.payroll_minor,18000);
 assert.equal(report.cash_minor,1182000);
});
test('staff count zero pauses named payroll without creating a phantom second employee',()=>{
 const state=fixture(),events=[];
 facilityAction({state,world,command:{type:'FACILITY_SET_STAFFING',actor:'player',
  payload:{site_id:site,operation_id:owner,staff_count:0}},
  emit:(kind,details)=>events.push({kind,details})});
 assert.equal(state.runtime.facilities.sites[site].staff_count,0);
 assert.throws(()=>facilityAction({state,world,command:{
  type:'FACILITY_SET_STAFFING',actor:'player',
  payload:{site_id:site,operation_id:owner,staff_count:2}},emit:()=>{}}),
  e=>e.code==='FACILITY_STAFFING_PERSONNEL');
 advanceFacilities({state,world,emit:()=>{}});
 assert.equal(state.runtime.facilities.sites[site].status,'UNDERSTAFFED');
 assert.equal(state.runtime.finances.balance_minor,1200000);
 assert.equal(state.runtime.finances.ledger.length,0);
 assert.equal(state.runtime.people[groom],undefined);
 validateFacilityState(state,world);
});
test('wrong operation, nonexistent worker, other track and duplicate personnel cannot pass saved employment validation',()=>{
 for(const broken of [
  {person_id:'P-NOT-REAL'},
  {person_id:trainer,role:'groom'},
  {person_id:groom,daily_wage_minor:500000},
  {person_id:groom,status:'RETIRED'}
 ]){
  const state=fixture();
  Object.assign(state.runtime.facilities.sites[site].payroll_staff[0],broken);
  assert.throws(()=>validateFacilityState(state,world),
   e=>e.code==='FACILITY_STAFF_ASSIGNMENTS');
 }
 const state=fixture();
 const second='F-1999-OPENING-T-0001-P-TRAINER-002';
 state.runtime.facilities.sites[second]={...structuredClone(
  state.runtime.facilities.sites[site]),id:second};
 assert.throws(()=>validateFacilityState(state,world),
  e=>e.code==='FACILITY_STAFF_ASSIGNMENTS');
 const elsewhere=structuredClone(world);
 elsewhere.entities.people[0].workplaceId='T-0028';
 assert.throws(()=>validateFacilityState(fixture(),elsewhere),
  e=>e.code==='FACILITY_STAFF_ASSIGNMENTS');
});
test('old aggregate-only stable payroll keeps existing debit and no fake named person receipt',()=>{
 const state=fixture();
 delete state.runtime.facilities.sites[site].payroll_staff;
 validateFacilityState(state,world);
 advanceFacilities({state,world,emit:()=>{}});
 assert.equal(state.runtime.finances.ledger.length,1);
 assert.equal(state.runtime.finances.ledger[0].kind,'FACILITY_STAFF_PAYROLL');
 assert.equal(state.runtime.finances.ledger[0].amount_minor,-9000);
 assert.equal(state.runtime.people[groom],undefined);
 assert.equal(state.runtime.finances.balance_minor,1191000);
});

test('signed local Kingsmere groom contract, change of wages and employment termination post real money, not fake headcount',()=>{
 const state=fixture(),existing=state.runtime.facilities.sites[site],
  other='P-GROOM-002',staffWorld=structuredClone(world);
 staffWorld.entities.people.push({id:other,role:'groom',workplaceId:track,
  ratings:{horseCare:70}});
 const fire=(type,payload,actor='player')=>facilityAction({
  state,world:staffWorld,command:{type,actor,payload:{
   operation_id:owner,site_id:site,person_id:other,...payload}},
  emit:()=>{}});
 const before=state.runtime.finances.balance_minor;
 fire('FACILITY_EMPLOY_NAMED_PERSON',{daily_wage_minor:8800});
 assert.equal(existing.payroll_staff.length,2);
 assert.equal(existing.staff_count,2);
 assert.equal(state.runtime.people[other].stable_employer_operation_id,owner);
 assert.equal(state.runtime.people[other].stable_employer_site_id,site);
 assert.equal(state.runtime.finances.balance_minor,before,
  'No retroactive wage paid on signature');
 validateFacilityState(state,staffWorld);
 assert.throws(()=>fire('FACILITY_EMPLOY_NAMED_PERSON',{daily_wage_minor:8800}),
  e=>e.code==='FACILITY_EMPLOYEE_EXCLUSIVE');
 fire('FACILITY_SET_PERSON_WAGE',{daily_wage_minor:9700});
 assert.equal(existing.payroll_staff[1].daily_wage_minor,9700);
 assert.equal(existing.staff_wage_daily_minor,9350);
 advanceFacilities({state,world:staffWorld,emit:()=>{}});
 assert.equal(state.runtime.finances.balance_minor,before-18700);
 assert.equal(state.runtime.people[other].stable_payroll_earned_minor,9700);
 assert.equal(state.runtime.finances.ledger.length,4);
 assert.equal(state.runtime.finances.ledger.reduce((sum,x)=>sum+x.amount_minor,0),0);
 state.clock.date='1999-01-03';
 fire('FACILITY_TERMINATE_NAMED_PERSON',{});
 assert.equal(existing.payroll_staff.length,1);
 assert.equal(existing.staff_count,1);
 assert.equal(existing.staff_history.length,1);
 assert.equal(existing.staff_history[0].person_id,other);
 assert.equal(existing.staff_history[0].status,'ENDED');
 assert.equal(state.runtime.people[other].stable_employer_site_id,undefined);
 assert.equal(state.runtime.people[other].stable_payroll_earned_minor,9700,
  'Employee keeps previously earned and actually paid wages after termination');
 assert.throws(()=>fire('FACILITY_TERMINATE_NAMED_PERSON',{}),
  e=>e.code==='FACILITY_EMPLOYEE_TERMS');
 advanceFacilities({state,world:staffWorld,emit:()=>{}});
 assert.equal(state.runtime.finances.balance_minor,before-18700-9000);
 assert.equal(state.runtime.people[other].stable_payroll_earned_minor,9700,
  'Terminated worker cannot receive a subsequent wage');
 validateFacilityState(state,staffWorld);
 assert.deepEqual(JSON.parse(JSON.stringify(state)),state);
});
test('wrong employer, nonlocal employee, underfunded and legacy anonymous sites cannot invent a paid hire',()=>{
 const s=fixture(),another='P-GROOM-LOCAL-3',w=structuredClone(world);
 w.entities.people.push({id:another,role:'groom',workplaceId:track});
 const cmd=(actor,person,fee=7500)=>facilityAction({state:s,world:w,
  command:{actor,type:'FACILITY_EMPLOY_NAMED_PERSON',payload:{
   site_id:site,operation_id:owner,person_id:person,daily_wage_minor:fee}},
  emit:()=>{}});
 assert.throws(()=>cmd('system',another),
  e=>e.code==='FACILITY_EMPLOYEE_PERMISSION');
 assert.throws(()=>cmd('player',trainer),
  e=>e.code==='FACILITY_EMPLOYEE_LOCATION');
 assert.throws(()=>cmd('player','P-FAKE'),
  e=>e.code==='FACILITY_EMPLOYEE_LOCATION');
 assert.throws(()=>cmd('player',another,300000),
  e=>e.code==='FACILITY_EMPLOYEE_WAGE');
 s.runtime.finances.operation_balances_minor[owner]=0;
 assert.throws(()=>cmd('player',another),
  e=>e.code==='FACILITY_EMPLOYEE_FUNDS');
 const legacy=fixture();
 delete legacy.runtime.facilities.sites[site].payroll_staff;
 w.entities.people[2].id=another;
 assert.throws(()=>facilityAction({state:legacy,world:w,
  command:{type:'FACILITY_EMPLOY_NAMED_PERSON',actor:'player',
   payload:{site_id:site,operation_id:owner,person_id:another,
    daily_wage_minor:7500}},emit:()=>{}}),
  e=>e.code==='FACILITY_EMPLOYEE_LEGACY');
});

test('unfunded Kingsmere salary is a real dated obligation, NOT a fabricated staff cash receipt',()=>{
 const s=fixture(),barn=s.runtime.facilities.sites[site];
 s.runtime.finances.operation_balances_minor[owner]=0;
 s.runtime.finances.balance_minor=0;
 const events=[];
 const day=()=>advanceFacilities({state:s,world,emit:(kind,details)=>
  events.push({kind,details})});
 day();
 assert.equal(s.runtime.finances.balance_minor,0);
 assert.deepEqual(s.runtime.finances.ledger,[],
  'Employee cannot receive cash that does not exist');
 assert.equal(s.runtime.people[groom],undefined);
 assert.equal(barn.staff_wage_arrears[groom].owed_minor,9000);
 assert.equal(barn.staff_wage_arrears[groom].due_days,1);
 assert.equal(barn.staff_wage_arrears[groom].first_unpaid_on,'1999-01-02');
 assert.equal(barn.staff_wage_arrears[groom].last_unpaid_on,'1999-01-02');
 assert.ok(events.some(x=>x.kind==='FACILITY_EMPLOYEE_WAGE_UNFUNDED'&&
  x.details.no_cash_receipt===true));
 validateFacilityState(s,world);
 const snapshot=JSON.parse(JSON.stringify(s));
 day();
 assert.deepEqual(JSON.parse(JSON.stringify(s)),snapshot,
  'a repeated game day cannot double-count unpaid promises');
 s.clock.date='1999-01-03';
 s.runtime.finances.operation_balances_minor[owner]=18000;
 s.runtime.finances.balance_minor=18000;
 day();
 assert.equal(s.runtime.finances.balance_minor,0);
 assert.equal(barn.staff_wage_arrears,undefined);
 assert.equal(s.runtime.people[groom].stable_payroll_earned_minor,18000);
 const pairs=new Map();
 for(const e of s.runtime.finances.ledger){
  const rows=pairs.get(e.transaction_id)||[];rows.push(e);
  pairs.set(e.transaction_id,rows);
 }
 assert.equal(pairs.size,2);
 for(const rows of pairs.values()){
  assert.equal(rows.length,2);
  assert.equal(rows.reduce((x,e)=>x+e.amount_minor,0),0);
 }
 assert.ok(events.some(x=>x.kind==='FACILITY_EMPLOYEE_BACKPAY_SETTLED'&&
  x.details.amount_minor===9000));
 assert.equal(s.runtime.finances.ledger.filter(e=>
  e.kind==='FACILITY_NAMED_EMPLOYEE_RECEIPT').length,2);
 assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
 validateFacilityState(s,world);
});
test('termination retains unpaid employee wages and pays them without falsely re-hiring the former worker',()=>{
 const s=fixture(),barn=s.runtime.facilities.sites[site];
 s.runtime.finances.balance_minor=0;
 s.runtime.finances.operation_balances_minor[owner]=0;
 advanceFacilities({state:s,world,emit:()=>{}});
 assert.equal(barn.staff_wage_arrears[groom].owed_minor,9000);
 s.clock.date='1999-01-03';
 facilityAction({state:s,world,command:{
  actor:'player',type:'FACILITY_TERMINATE_NAMED_PERSON',
  payload:{site_id:site,operation_id:owner,person_id:groom}},emit:()=>{}});
 assert.equal(barn.payroll_staff,undefined);
 assert.equal(barn.staff_count,0);
 assert.equal(barn.staff_history[0].person_id,groom);
 s.runtime.finances.balance_minor=10000;
 s.runtime.finances.operation_balances_minor[owner]=10000;
 advanceFacilities({state:s,world,emit:()=>{}});
 assert.equal(barn.status,'UNDERSTAFFED');
 assert.equal(s.runtime.finances.balance_minor,1000);
 assert.equal(s.runtime.people[groom].stable_payroll_earned_minor,9000);
 assert.equal(s.runtime.people[groom].stable_employer_site_id,undefined);
 assert.equal(s.runtime.people[groom].stable_employer_operation_id,undefined);
 assert.equal(barn.staff_wage_arrears,undefined);
 assert.equal(s.runtime.finances.ledger.length,2);
 assert.equal(s.runtime.finances.ledger[0].amount_minor,-9000);
 assert.equal(s.runtime.finances.ledger[1].amount_minor,9000);
 assert.equal(s.runtime.finances.ledger[1].source,
  'PAID_PREVIOUSLY_UNFUNDED_LOCAL_STABLE_WAGE');
 validateFacilityState(s,world);
 const reopened=JSON.parse(JSON.stringify(s));
 assert.deepEqual(reopened,s);
});
test('unpaid staff debt must belong to a real same-course source employee and legitimate saved game dates',()=>{
 const mutate=modify=>{
  const s=fixture();s.runtime.facilities.sites[site].staff_wage_arrears={
   [groom]:{person_id:groom,owed_minor:9000,due_days:1,
    first_unpaid_on:'1999-01-01',last_unpaid_on:'1999-01-01'}};
  modify(s);
  assert.throws(()=>validateFacilityState(s,world),
   e=>e.code==='FACILITY_STAFF_ARREARS');
 };
 mutate(s=>{s.runtime.facilities.sites[site].staff_wage_arrears[groom].owed_minor=-9000});
 mutate(s=>{s.runtime.facilities.sites[site].staff_wage_arrears[groom].due_days=0});
 mutate(s=>{s.runtime.facilities.sites[site].staff_wage_arrears[groom].last_unpaid_on='2000-01-01'});
 mutate(s=>{s.runtime.facilities.sites[site].staff_wage_arrears[groom].person_id='P-OTHER'});
});
