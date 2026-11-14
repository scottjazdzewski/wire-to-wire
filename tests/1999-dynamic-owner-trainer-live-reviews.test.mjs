import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,importGameSave,exportGameSave,
 ownerTrainerLiveAssessment,getOwnerTrainerCareerReview}
 from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const directory=read('../public/data/wtw-1999-founding-directory-v1.json');
const trainer=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockey=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const cohort=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...directory.people,...trainer.trainers,...jockey.jockeys].
 map(x=>[x.id,x])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'LIVE-1999-OWNER-TRAINER-REVIEW-TEST',
  source:'ISOLATED_GAMEPLAY_NOT_HISTORICAL_PROFESSIONAL_ASSESSMENT',
  sha256:createHash('sha256').update('live-relationship-v1').digest('hex')},
 entities:{horses:directory.horses,people,organizations:directory.organizations,
  tracks:directory.tracks}};
const fresh=()=>build1999PilotGameRun({world,manifest:cohort,jockeys:jockey.jockeys});
const command=(s,id,type,payload={},actor='system')=>
 dispatchGameCommand({state:s,world,command:{id,type,payload,actor}});
const day=s=>command(s,'pulse:day:'+s.clock.date,'ADVANCE_DAY').state;
const pairs=s=>[...new Map(Object.values(s.runtime.registered_horses.by_id).
 map(h=>[h.owner_organization_id+'|'+h.trainer_id,{
  owner:h.owner_organization_id,trainer:h.trainer_id}])).values()];
const get=(s,p)=>getOwnerTrainerCareerReview(s,world,p.owner,p.trainer);

test('daily assessments update before the first formal 28-day review',()=>{
 let s=day(fresh()),p=pairs(s)[0],view=get(s,p);
 assert.equal(s.clock.date,'1999-01-02');
 assert.equal(view.last_review_date,null);
 assert.equal(view.live_assessment.date,'1999-01-02');
 assert.equal(view.live_history.length,1);
 assert.equal(view.live_history[0].date,'1999-01-02');
 assert.equal(view.trainer_position,view.live_assessment.trainer_position);
 assert.equal(view.live_assessment.formal_mandate,view.mandate);
 assert.ok(view.live_assessment.owner_confidence>=0&&
  view.live_assessment.owner_confidence<=1);
 const before=structuredClone(s);
 assert.deepEqual(ownerTrainerLiveAssessment(s,world,p.owner,p.trainer),
  view.live_assessment&&(({trigger,...x})=>x)(view.live_assessment));
 assert.deepEqual(s,before,'Reading live assessments must never change the save');
 s=day(s);
 const next=get(s,p);
 assert.equal(next.live_assessment.date,'1999-01-03');
 assert.equal(next.live_history.length,2);
 assert.equal(next.last_review_date,null);
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});

test('actual settled race updates the same-day live review with exact race ID and no forced firing',()=>{
 let s=fresh(),found=null;
 for(let i=0;i<20;i++){
  const prev=s;s=day(s);
  const result=s.event_log.filter(e=>e.kind==='RACE_SETTLED'&&
   e.date===s.clock.date);
  if(result.length){found=result[0];break}
  assert.equal(Object.keys(s.runtime.races).length>=0,true);
 }
 assert.ok(found,'The authentic simulated 1999 condition book should run a race');
 const race=s.runtime.races[found.details.race_id];
 assert.equal(race.status,'OFFICIAL_SIM_RESULT');
 for(const result of race.results){
  const p={owner:result.owner_id,trainer:result.trainer_id};
  const view=get(s,p);
  assert.equal(view.live_assessment.date,s.clock.date);
  assert.equal(view.live_assessment.last_race.race_id,race.id);
  assert.equal(view.live_assessment.last_race.date,race.date);
  assert.equal(view.live_history.at(-1).last_race_id,race.id);
  assert.equal(view.live_history.at(-1).trigger,'AFTER_RACE');
  assert.equal(view.trainer_position,view.live_assessment.trainer_position);
  assert.equal(s.runtime.registered_horses.by_id[result.horse_id].trainer_id,
   result.trainer_id,'Race results must not silently dismiss or reassign a trainer');
  assert.ok(s.event_log.some(e=>e.kind==='OWNER_TRAINER_LIVE_STATUS'&&
   e.date===s.clock.date&&e.details.owner_id===p.owner&&
   e.details.trainer_id===p.trainer&&e.details.trigger==='AFTER_RACE'));
 }
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});

test('a new deterioration can prompt the player before 28 days; response refreshes on the same date',()=>{
 let s=day(fresh());
 const p=pairs(s).find(x=>x.owner===s.player.operation_id);
 assert.ok(p);
 const key=p.owner+'|'+p.trainer;
 const rel=s.runtime.agents.relationships[key];
 assert.ok(rel);
 const prior=get(s,p);
 Object.assign(rel,{owner_trust:.05,trainer_support:.01,days:70,
  unfunded_days:12});
 const afterDay=day(s);
 const view=get(afterDay,p);
 assert.equal(view.last_review_date,null);
 assert.ok(['PRESSING_FOR_CHANGE','CONSIDERING_DEPARTURE'].
  includes(view.trainer_position));
 assert.ok(view.live_assessment.owner_confidence<prior.live_assessment.owner_confidence);
 assert.ok(afterDay.event_log.some(e=>e.kind==='OWNER_TRAINER_LIVE_STATUS'&&
  e.details.owner_id===p.owner&&e.details.trainer_id===p.trainer));
 assert.ok(view.pending_concern,'A material escalation prompts an immediate request');
 const request=view.pending_concern.request_id;
 assert.equal(view.pending_concern.opened_on,'1999-01-03');
 assert.equal(view.pending_concern.deadline,'1999-01-17');
 const oldSupport=afterDay.runtime.agents.relationships[key].trainer_support;
 const ledgerCount=afterDay.runtime.finances.ledger.length;
 const out=command(afterDay,'pulse:decision:1','RESPOND_TO_TRAINER_CONCERN',{
  owner_id:p.owner,trainer_id:p.trainer,request_id:request,
  response:'HOLD_CURRENT_COURSE'},'player');
 const updated=get(out.state,p);
 assert.equal(updated.pending_concern,null);
 assert.equal(updated.latest_concern.status,'RESOLVED');
 assert.equal(updated.live_assessment.date,afterDay.clock.date);
 assert.equal(out.state.runtime.finances.ledger.length,ledgerCount);
 assert.ok(out.state.runtime.agents.relationships[key].trainer_support<oldSupport);
 assert.deepEqual(importGameSave(exportGameSave(out.state,world),world),out.state);
 const replay=command(out.state,'pulse:decision:1','RESPOND_TO_TRAINER_CONCERN',{
  owner_id:p.owner,trainer_id:p.trainer,request_id:request,
  response:'HOLD_CURRENT_COURSE'},'player');
 assert.equal(replay.duplicate,true);
});
