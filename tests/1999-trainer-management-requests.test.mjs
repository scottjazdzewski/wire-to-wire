import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 getTrainerManagementRequests,getTrainerContract,getGameRacingRoster}
 from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const directory=read('../public/data/wtw-1999-founding-directory-v1.json');
const trainers=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockeys=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const manifest=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...directory.people,...trainers.trainers,...jockeys.jockeys].
 map(p=>[p.id,p])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'1999-GAME-TRAINER-MANAGEMENT-REQUEST-QA',
  source:'ISOLATED_GAMEPLAY_TEST_NOT_HISTORICAL',
  sha256:createHash('sha256').update('management-contract-v1').digest('hex')},
 entities:{horses:directory.horses,people,organizations:directory.organizations,
  tracks:directory.tracks}};
const fresh=()=>build1999PilotGameRun({world,manifest,jockeys:jockeys.jockeys});
const act=(s,id,type,payload={},actor='system')=>dispatchGameCommand({
 state:s,world,command:{id,type,payload,actor}});
const day=s=>act(s,'manager:day:'+s.clock.date,'ADVANCE_DAY').state;
const players=s=>Object.values(s.runtime.registered_horses.by_id).
 filter(h=>h.owner_organization_id===s.player.operation_id);
const answer=(s,r,choice,id='trainer:answer:1',actor='player')=>act(s,id,
 'ANSWER_TRAINER_MANAGEMENT_REQUEST',
 {request_id:r.id,owner_id:r.owner_id,trainer_id:r.trainer_id,choice},actor);
function fundablePlayerRequest(){
 let s=day(fresh());
 const horse=players(s)[0];
 assert.ok(horse,'Player has a modeled registered horse');
 const current=s.runtime.horse[horse.horse_id].policy;
 s=act(s,'manager:set:unfunded','SET_HORSE_CARE_POLICY',{
  horse_id:horse.horse_id,policy:{...current,monthly_budget_minor:0}
 },'player').state;
 s=day(s);
 const request=getTrainerManagementRequests(s,s.player.operation_id).pending.
  find(x=>x.horse_id===horse.horse_id);
 assert.ok(request,'A real unfunded-care event triggers a management request');
 assert.equal(request.kind,'CARE_FUNDING');
 const origin=s.event_log.find(e=>e.seq===request.source_event_seq);
 if(origin){
  assert.equal(origin.kind,'HORSE_CARE_UNFUNDED');
  assert.equal(origin.details.horse_id,horse.horse_id);
 }else{
  assert.equal(request.source_evidence.kind,'HORSE_CARE_UNFUNDED');
  assert.equal(request.source_evidence.date,request.opened_on);
  assert.equal(request.source_evidence.details.horse_id,horse.horse_id);
  const summary=s.event_log.find(e=>e.kind==='DAILY_SIMULATION_SUMMARY'&&
   e.date===request.opened_on&&e.seq>request.source_event_seq&&
   e.details?.counts?.HORSE_CARE_UNFUNDED>0);
  assert.ok(summary,'Compacted source event must remain represented in the daily journal');
 }
 return {s,horse,request};
}
test('actual race feedback creates only source-linked AI trainer management interactions',()=>{
 let s=fresh();
 for(let i=0;i<17;i++)s=day(s);
 const races=getGameRacingRoster(s).filter(r=>r.status==='OFFICIAL_SIM_RESULT');
 assert.ok(races.length>=1);
 const all=getTrainerManagementRequests(s),rows=all.recent;
 assert.ok(rows.length>0,'At least one modeled race result or genuine care issue leads to a request');
 assert.ok(rows.some(r=>r.kind==='POST_RACE_RECOVERY'),
  'A below-expectation game race produces a live recovery discussion');
 for(const r of rows){
  const e=s.event_log.find(e=>e.seq===r.source_event_seq);
  assert.ok(e,'Every request must link to a real saved event');
  assert.equal(e.details.horse_id,r.horse_id);
  assert.equal(r.responder,'system');
  assert.equal(r.status,'RESOLVED');
  if(r.race_id){
   const race=s.runtime.races[r.race_id];
   assert.equal(race.status,'OFFICIAL_SIM_RESULT');
   assert.ok(race.results.some(x=>x.horse_id===r.horse_id));
   assert.equal(e.kind,'POST_RACE_PROFESSIONAL_FEEDBACK');
  }
 }
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
 const replay=fresh();let other=replay;
 for(let i=0;i<17;i++)other=day(other);
 assert.deepEqual(s,other,'Game seed and source outcomes reproduce identical trainer negotiations');
});
test('accepting real unfunded care changes authorized policy, but does not invent money',()=>{
 const {s,horse,request}=fundablePlayerRequest();
 const originalBalance=s.runtime.finances.operation_balances_minor[request.owner_id];
 const ledgerCount=s.runtime.finances.ledger.length;
 const before=s.runtime.horse[horse.horse_id].policy;
 const result=answer(s,request,'ACCEPT');
 const next=result.state;
 assert.equal(getTrainerManagementRequests(next,request.owner_id).pending.length,0);
 assert.equal(getTrainerManagementRequests(next,request.owner_id).recent.at(0).response,'ACCEPT');
 assert.equal(next.runtime.horse[horse.horse_id].policy.care,'PROACTIVE');
 assert.ok(next.runtime.horse[horse.horse_id].policy.monthly_budget_minor>
  before.monthly_budget_minor);
 assert.equal(next.runtime.finances.ledger.length,ledgerCount);
 assert.equal(next.runtime.finances.operation_balances_minor[request.owner_id],originalBalance);
 assert.ok(result.events.some(e=>e.kind==='TRAINER_MANAGEMENT_REQUEST_RESOLVED'&&
  e.details.money_posted===false&&e.details.employment_changed===false));
 assert.deepEqual(importGameSave(exportGameSave(next,world),world),next);
 const later=day(next);
 assert.ok(later.runtime.finances.ledger.length>ledgerCount,
  'The following day posts genuine care transactions against the authorized budget');
 assert.ok(later.runtime.horse[horse.horse_id].history.some(x=>
  x.date===later.clock.date&&x.unfunded===false),
  'Actual affordable care can resume after player authorization');
 assert.deepEqual(importGameSave(exportGameSave(later,world),world),later);
});
test('compromise authorizes limited care and decline changes relationship but not spending',()=>{
 const {s,horse,request}=fundablePlayerRequest();
 const policy=s.runtime.horse[horse.horse_id].policy;
 const ledger=s.runtime.finances.ledger.length;
 const compromise=answer(s,request,'COUNTER','trainer:counter:1').state;
 assert.equal(compromise.runtime.horse[horse.horse_id].policy.care,policy.care);
 assert.ok(compromise.runtime.horse[horse.horse_id].policy.monthly_budget_minor>0);
 assert.equal(compromise.runtime.finances.ledger.length,ledger);
 const decline=answer(s,request,'DECLINE','trainer:decline:1').state;
 assert.deepEqual(decline.runtime.horse[horse.horse_id].policy,policy);
 assert.equal(decline.runtime.finances.ledger.length,ledger);
 const id=request.owner_id+'|'+request.trainer_id;
 assert.ok(decline.runtime.agents.relationships[id].trainer_support<=
  s.runtime.agents.relationships[id].trainer_support);
 assert.equal(decline.runtime.trainer_management_requests.totals.player_answers,1);
});
test('owner-only request authority, exact request, safe cash rejection and one-time execution',()=>{
 const {s,request}=fundablePlayerRequest();
 const before=structuredClone(s);
 assert.throws(()=>answer(s,request,'ACCEPT','trainer:wrong:actor','system'),
  e=>e.code==='MANAGEMENT_PERMISSION');
 assert.throws(()=>answer(s,{...request,id:'FAKE-REQUEST'},'ACCEPT','trainer:wrong:id'),
  e=>e.code==='MANAGEMENT_REQUEST_UNKNOWN');
 assert.throws(()=>answer(s,request,'FORCE_TRANSFER','trainer:wrong:choice'),
  e=>e.code==='MANAGEMENT_CHOICE');
 const noCash=structuredClone(s),owner=request.owner_id;
 noCash.runtime.finances.operation_balances_minor[owner]=0;
 if(noCash.player.operation_id===owner)noCash.runtime.finances.balance_minor=0;
 assert.throws(()=>answer(noCash,request,'ACCEPT','trainer:cannot:fund'),
  e=>e.code==='MANAGEMENT_FUNDS');
 assert.deepEqual(s,before,'Rejected actions must not change the original career');
 const applied=answer(s,request,'ACCEPT');
 const duplicate=answer(applied.state,request,'ACCEPT');
 assert.equal(duplicate.duplicate,true);
 assert.strictEqual(duplicate.state,applied.state);
 assert.throws(()=>answer(applied.state,request,'DECLINE','trainer:answer:2'),
  e=>e.code==='MANAGEMENT_REQUEST_UNKNOWN');
 assert.throws(()=>answer(applied.state,request,'DECLINE','trainer:answer:1'),
  e=>e.code==='COMMAND_CONFLICT');
});
test('ignored player requests expire once and preserve contracts and horse ownership',()=>{
 let {s,horse,request}=fundablePlayerRequest();
 const beforeFee=getTrainerContract(s,world,request.owner_id,request.trainer_id).agreement.daily_fee_minor;
 const owner=horse.owner_organization_id;
 while(s.clock.date<='1999-01-11')s=day(s);
 const history=getTrainerManagementRequests(s,owner).recent;
 assert.ok(history.some(r=>r.id===request.id&&r.status==='EXPIRED'));
 assert.equal(s.runtime.registered_horses.by_id[horse.horse_id].owner_organization_id,owner);
 assert.equal(s.runtime.registered_horses.by_id[horse.horse_id].trainer_id,request.trainer_id);
 assert.equal(s.runtime.trainer_contracts.by_pair[owner+'|'+request.trainer_id].daily_fee_minor,beforeFee);
 assert.ok(s.event_log.some(e=>e.kind==='TRAINER_MANAGEMENT_REQUEST_EXPIRED'&&
  e.details.request_id===request.id));
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});

test('temporary postrace workouts act on actual training then expire or yield to newer direction',()=>{
 let s=fresh(),choiceEvent=null;
 for(let i=0;i<20;i++){
  s=day(s);
  choiceEvent=s.event_log.find(e=>e.date===s.clock.date&&
   e.kind==='TRAINER_MANAGEMENT_REQUEST_RESOLVED'&&
   e.details.kind==='POST_RACE_RECOVERY');
  if(choiceEvent)break;
 }
 assert.ok(choiceEvent,'Actual below-form racing must create a trainer strategy choice');
 const horseId=choiceEvent.details.horse_id;
 const order=s.runtime.trainer_management_requests.training_orders[horseId];
 assert.ok(order,'AI trainer recovery request is an actual temporary training order');
 assert.equal(s.runtime.horse[horseId].policy.training_plan,order.training_plan);
 assert.ok(['REST','LIGHT'].includes(order.training_plan));
 assert.ok(s.event_log.some(e=>e.seq===order.applied_event_seq&&
  e.kind==='HORSE_CARE_POLICY_CHANGED'&&e.details.horse_id===horseId));
 const current=order.expires_on;
 while(s.clock.date<=current)s=day(s);
 assert.equal(s.runtime.trainer_management_requests.training_orders[horseId],undefined);
 assert.ok(s.event_log.some(e=>e.details?.request_id===order.request_id&&
  ['TRAINER_TEMPORARY_WORKOUT_RESTORED',
   'TRAINER_TEMPORARY_WORKOUT_SUPERSEDED'].includes(e.kind)),
  'No temporary workout can become permanent by accident');
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});
test('tampered request provenance is rejected on save import',()=>{
 const {s,request}=fundablePlayerRequest();
 const altered=structuredClone(s);
 altered.runtime.trainer_management_requests.by_pair[
  request.owner_id+'|'+request.trainer_id].active.source_event_seq=999999;
 assert.throws(()=>importGameSave(exportGameSave(altered,world),world),
  e=>e.code==='MANAGEMENT_SAVE'||e.code==='SAVE_INVALID');
});
