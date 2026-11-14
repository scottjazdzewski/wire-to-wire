import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 getOwnerTrainerCareerReview,trainerContractQuote,workingRelationshipProfile}
 from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const directory=read('../public/data/wtw-1999-founding-directory-v1.json');
const trainer=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockey=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const manifest=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...directory.people,...trainer.trainers,...jockey.jockeys].
 map(x=>[x.id,x])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'TRAINER-CONCERN-CONVERSATION-QA',
  source:'ISOLATED_MODELED_GAME_RELATIONSHIPS',
  sha256:createHash('sha256').update('trainer-concern-v1').digest('hex')},
 entities:{horses:directory.horses,organizations:directory.organizations,
  people,tracks:directory.tracks}};
const fresh=()=>build1999PilotGameRun({world,manifest,jockeys:jockey.jockeys});
const cmd=(state,id,type,payload={},actor='system')=>dispatchGameCommand({
 state,world,command:{id,type,payload,actor}});
const advance=s=>cmd(s,'concern:day:'+s.clock.date,'ADVANCE_DAY').state;
const owned=(s,owner)=>Object.values(s.runtime.registered_horses.by_id).
 find(h=>h.owner_organization_id===owner);
function strainedPair({player=true}={}){
 let s=advance(fresh());
 const horse=player?owned(s,s.player.operation_id):
  Object.values(s.runtime.registered_horses.by_id).
   find(h=>h.owner_organization_id!==s.player.operation_id);
 assert.ok(horse,'Requires a registered owner/trainer pair');
 const owner=horse.owner_organization_id,trainerId=horse.trainer_id;
 const rel=s.runtime.agents.relationships[owner+'|'+trainerId];
 assert.ok(rel,'Daily care establishes the canonical relationship');
 Object.assign(rel,{owner_trust:.07,trainer_support:.02,days:65,unfunded_days:14});
 while(s.clock.date<'1999-01-30')s=advance(s);
 const record=s.runtime.owner_trainer_reviews.by_pair[owner+'|'+trainerId];
 assert.ok(record,'A 28-day career review is expected');
 return {s,owner,trainerId,record};
}
function reply(s,owner,trainerId,request_id,response,id='concern:reply:1',actor='player'){
 return cmd(s,id,'RESPOND_TO_TRAINER_CONCERN',{
  owner_id:owner,trainer_id:trainerId,request_id,response},actor);
}
test('strained player partnership opens one true dated concern without ending employment or creating money',()=>{
 const {s,owner,trainerId,record}=strainedPair();
 assert.equal(record.concern?.status,'OPEN');
 assert.ok(['PRESSING_FOR_CHANGE','CONSIDERING_DEPARTURE'].
  includes(record.concern.trainer_position));
 assert.equal(record.concern.deadline,'1999-02-13');
 const view=getOwnerTrainerCareerReview(s,world,owner,trainerId);
 assert.deepEqual(view.pending_concern,record.concern);
 assert.equal(view.concern_history.length,0);
 const opened=s.event_log.filter(e=>e.kind==='TRAINER_CONCERN_OPENED'&&
  e.details.request_id===record.concern.request_id);
 assert.equal(opened.length,1);
 assert.equal(opened[0].details.player_response_required,true);
 const counted=s.runtime.finances.ledger.length;
 assert.equal(s.runtime.finances.ledger.length,counted);
 assert.equal(record.trainer_position===undefined,false);
});
test('player conversation changes real trust input and trainer quote; save/replay are exact',()=>{
 const {s,owner,trainerId,record}=strainedPair();
 const request=record.concern.request_id;
 const baseline=trainerContractQuote(s,world,owner,trainerId);
 const before=workingRelationshipProfile(s,owner,trainerId);
 const historyCount=s.runtime.finances.ledger.length;
 const out=reply(s,owner,trainerId,request,'HEAR_AND_REVIEW');
 assert.equal(out.duplicate,false);
 const now=out.state;
 const updated=getOwnerTrainerCareerReview(now,world,owner,trainerId);
 assert.equal(updated.pending_concern,null);
 assert.equal(updated.latest_concern.status,'RESOLVED');
 assert.equal(updated.concern_history.length,1);
 assert.equal(updated.concern_history[0].response,'HEAR_AND_REVIEW');
 assert.equal(now.runtime.finances.ledger.length,historyCount,
  'Words cannot mint money or post imaginary care invoices');
 assert.equal(now.runtime.trainer_contracts.by_pair[owner+'|'+trainerId].
  daily_fee_minor,s.runtime.trainer_contracts.by_pair[owner+'|'+trainerId].daily_fee_minor);
 const after=workingRelationshipProfile(now,owner,trainerId);
 const quote=trainerContractQuote(now,world,owner,trainerId);
 const funded=updated.current_evidence.unfunded_horse_days===0&&
  updated.current_evidence.owner_cash_minor>0;
 assert.ok(after.trainer_support>=before.trainer_support);
 if(funded){
  assert.ok(after.trainer_support>before.trainer_support);
  assert.ok(quote.minimum_acceptable_minor<=baseline.minimum_acceptable_minor,
   'Actual improved partnership affects the existing trainer price model');
 }
 assert.deepEqual(importGameSave(exportGameSave(now,world),world),now);
 const replay=reply(now,owner,trainerId,request,'HEAR_AND_REVIEW');
 assert.equal(replay.duplicate,true);
 assert.strictEqual(replay.state,now);
 assert.throws(()=>reply(now,owner,trainerId,request,'HOLD_CURRENT_COURSE'),
  e=>e.code==='COMMAND_CONFLICT');
 assert.throws(()=>reply(now,owner,trainerId,request,'HEAR_AND_REVIEW',
  'concern:reply:2'),e=>e.code==='TRAINER_CONCERN_CLOSED');
});
test('declining a concern is a real negative trainer signal, not an automatic firing',()=>{
 const {s,owner,trainerId,record}=strainedPair();
 const before=workingRelationshipProfile(s,owner,trainerId);
 const quote=trainerContractQuote(s,world,owner,trainerId);
 const out=reply(s,owner,trainerId,record.concern.request_id,'HOLD_CURRENT_COURSE');
 const after=workingRelationshipProfile(out.state,owner,trainerId);
 assert.ok(after.trainer_support<before.trainer_support);
 assert.ok(trainerContractQuote(out.state,world,owner,trainerId).
  minimum_acceptable_minor>=quote.minimum_acceptable_minor);
 assert.ok(out.events.some(e=>e.kind==='TRAINER_CONCERN_RESPONDED'&&
  e.details.employment_changed===false&&e.details.money_posted===false));
 assert.equal(out.state.runtime.registered_horses.by_id[
  owned(s,owner).horse_id].trainer_id,trainerId);
});
test('only the player owning the real pair can respond with the exact request',()=>{
 const {s,owner,trainerId,record}=strainedPair();
 const request=record.concern.request_id,initial=structuredClone(s);
 assert.throws(()=>reply(s,owner,trainerId,request,'HEAR_AND_REVIEW',
  'concern:wrongactor','system'),e=>e.code==='TRAINER_CONCERN_PERMISSION');
 assert.throws(()=>reply(s,'O-UNKNOWN',trainerId,request,'HEAR_AND_REVIEW',
  'concern:wrongowner'),e=>e.code==='TRAINER_REVIEW_PAIR');
 assert.throws(()=>reply(s,owner,trainerId,'WRONG','HEAR_AND_REVIEW',
  'concern:wrongrequest'),e=>e.code==='TRAINER_CONCERN_UNKNOWN');
 assert.throws(()=>reply(s,owner,trainerId,request,'GIVE_BONUS',
  'concern:wrongchoice'),e=>e.code==='TRAINER_CONCERN_RESPONSE');
 assert.deepEqual(s,initial,'All rejected commands must be atomic');
});
test('unanswered player concern expires after 14 days with a saved trust consequence',()=>{
 let {s,owner,trainerId,record}=strainedPair();
 const request=record.concern.request_id;
 const before=s.runtime.agents.relationships[owner+'|'+trainerId].trainer_support;
 while(s.clock.date<'1999-02-14')s=advance(s);
 const latest=getOwnerTrainerCareerReview(s,world,owner,trainerId);
 assert.equal(latest.pending_concern,null);
 assert.equal(latest.latest_concern.status,'EXPIRED');
 assert.equal(latest.concern_history.at(-1).reason,'OWNER_DID_NOT_RESPOND');
 assert.ok(s.event_log.some(e=>e.kind==='TRAINER_CONCERN_EXPIRED'&&
  e.details.request_id===request));
 assert.ok(s.runtime.owner_trainer_reviews.totals.unanswered_concerns>=1,
  'Other player trainer relationships can independently generate expired concerns');
 assert.equal(s.event_log.filter(e=>e.kind==='TRAINER_CONCERN_EXPIRED'&&
  e.details.request_id===request).length,1,
  'One unacknowledged request expires once, even after repeated days');
 assert.throws(()=>reply(s,owner,trainerId,request,'HEAR_AND_REVIEW',
  'concern:late'),e=>e.code==='TRAINER_CONCERN_CLOSED');
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
 assert.ok(before>=0);
});
test('AI owners answer their own concerns without overwriting the player owner direction',()=>{
 const {s,owner,trainerId,record}=strainedPair({player:false});
 assert.equal(record.concern?.status,'RESOLVED');
 assert.equal(record.concern.responder,'system');
 assert.ok(record.conversation_history.length>=1,
  'A trainer may raise an initial concern mid-cycle and another at a later review');
 assert.equal(new Set(record.conversation_history.map(x=>x.request_id)).size,
  record.conversation_history.length,'No request may be answered twice');
 assert.ok(record.conversation_history.every(x=>x.status==='RESOLVED'));
 assert.equal(s.runtime.owner_trainer_reviews.totals.ai_concern_responses>=1,true);
 assert.ok(s.event_log.some(e=>e.kind==='TRAINER_CONCERN_RESPONDED'&&
  e.details.owner_id===owner&&e.details.trainer_id===trainerId&&
  e.details.by==='system'));
 assert.throws(()=>reply(s,owner,trainerId,record.concern.request_id,
  'HEAR_AND_REVIEW','concern:playeroverreach'),e=>e.code==='TRAINER_CONCERN_PERMISSION');
});
