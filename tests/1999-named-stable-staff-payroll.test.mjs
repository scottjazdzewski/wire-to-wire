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
