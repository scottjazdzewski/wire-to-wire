import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 get1999HorseRaceOpportunities,get1999RacePreparation,
 quote1999PlayerRacePlan,getGameRacingRoster,getGameHorsePerformance}
 from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';
import {createPlaytestCareer} from '../public/1999/game/playtest-service.mjs';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const directory=read('../public/data/wtw-1999-founding-directory-v1.json');
const trainers=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockeys=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const manifest=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...directory.people,...trainers.trainers,...jockeys.jockeys]
 .map(p=>[p.id,p])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'OFFLINE-RACE-PREPARATION-QA',
  source:'ISOLATED_1999_GAME_TEST_NOT_HISTORICAL',
  sha256:createHash('sha256').update('race-preparation-qa-v1').digest('hex')},
 entities:{horses:directory.horses,organizations:directory.organizations,
  tracks:directory.tracks,people}};
const fresh=()=>build1999PilotGameRun({world,manifest,jockeys:jockeys.jockeys});
const command=(s,id,type,payload={},actor='system')=>
 dispatchGameCommand({state:s,world,command:{id,type,payload,actor}});
const day=s=>command(s,'preparation:day:'+s.clock.date,'ADVANCE_DAY').state;
function booked(){
 let s=day(fresh());
 const horses=Object.values(s.runtime.registered_horses.by_id)
  .filter(h=>h.owner_organization_id===s.player.operation_id);
 const candidates=[];
 for(const h of horses)for(const option of
  get1999HorseRaceOpportunities(s,world,h.horse_id,{includeProposals:false}).rows){
  if(option.status!=='PLAYER_CAN_ENTER')continue;
  const r=s.runtime.races[option.race_id];
  if(!r||r.field.length<2)continue;
  for(const jockey of option.available_jockeys.filter(j=>j.owner_can_pay)){
   const payload={race_id:r.id,horse_id:h.horse_id,jockey_id:jockey.jockey_id,
    destination_site_id:null};
   const quote=quote1999PlayerRacePlan(s,world,payload);
   if(quote.can_confirm)candidates.push({h,r,payload,quote});
  }
 }
 candidates.sort((a,b)=>b.r.field.length-a.r.field.length||
  a.r.date.localeCompare(b.r.date)||a.h.horse_id.localeCompare(b.h.horse_id));
 const found=candidates[0];
 assert.ok(found,'Need a real local source-conditioned race with an AI field and payable jockey');
 s=command(s,'preparation:book:1','CONFIRM_1999_RACE_PLAN',{
  ...found.payload,expected_revision:found.quote.expected_revision,
  maximum_total_minor:found.quote.immediate_total_minor},'player').state;
 assert.equal(s.runtime.entries[found.r.id+':'+found.h.horse_id].status,'BOOKED');
 return {s,h:found.h,r:found.r};
}
const outlook=(s,h,r)=>get1999RacePreparation(s,world,{
 horse_id:h.horse_id,race_id:r.id});
const set=(s,h,r,approach,id='preparation:select:1',revision=s.revision,actor='player')=>
 command(s,id,'SET_1999_RACE_PREPARATION',{
  horse_id:h.horse_id,race_id:r.id,approach,expected_revision:revision},actor);

test('booked horse has a pure locally computed condition outlook, not an invented training day or race result',()=>{
 const {s,h,r}=booked(),before=structuredClone(s),view=outlook(s,h,r);
 assert.equal(view.schema,'WTW_1999_TARGETED_RACE_PREPARATION_V1');
 assert.equal(view.eligible_to_start,true);
 assert.equal(view.expected_revision,s.revision);
 assert.equal(view.horse_id,h.horse_id);
 assert.equal(view.race_id,r.id);
 assert.equal(view.race_date,r.date);
 assert.deepEqual(view.approaches,['BALANCED','SHARPEN','CONSERVE']);
 assert.equal(view.active_plan,null);
 assert.ok(['FOUNDATION','SHARPENING','TAPER','FINAL_REST'].includes(view.current_workout.phase));
 assert.ok(Number.isFinite(view.horse_condition.readiness));
 assert.equal(view.source,'LOCAL_APPROVED_GAME_CARE_AND_RACE_ENTRY_NO_NETWORK');
 assert.deepEqual(s,before);
});

test('owner-approved race conditioning uses one paid daily training engine and retains portable saves',()=>{
 let {s,h,r}=booked();
 const id=h.horse_id;
 const oldMoney=s.runtime.finances.operation_balances_minor[h.owner_organization_id];
 const oldLedger=s.runtime.finances.ledger.length;
 const originalPlan=s.runtime.horse[id].policy.training_plan;
 const initial=outlook(s,h,r);
 const out=set(s,h,r,'SHARPEN');
 s=out.state;
 assert.equal(s.runtime.finances.operation_balances_minor[h.owner_organization_id],oldMoney);
 assert.equal(s.runtime.finances.ledger.length,oldLedger);
 assert.equal(s.runtime.horse[id].race_preparation.approach,'SHARPEN');
 assert.equal(s.runtime.horse[id].policy.training_plan,originalPlan);
 assert.ok(out.events.some(e=>e.kind==='HORSE_RACE_PREPARATION_SELECTED'&&
  e.details.cash_charged_minor===0));
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
 const replay=set(s,h,r,'SHARPEN','preparation:select:1',initial.expected_revision);
 assert.equal(replay.duplicate,true);
 assert.deepEqual(replay.state,s);
 assert.throws(()=>set(s,h,r,'SHARPEN'),
  e=>e.code==='COMMAND_CONFLICT');
 s=day(s);
 const record=s.runtime.horse[id],worked=record.history.findLast(x=>
  x.date===s.clock.date&&x.preparation_race_id===r.id);
 assert.ok(worked,'Actual target-specific workout must be stored on canonical paid care day');
 assert.equal(record.race_preparation.last_work_date,s.clock.date);
 assert.equal(record.race_preparation.last_workout,worked.work);
 assert.equal(record.last_day,s.clock.date);
 assert.equal(record.training.asOf,s.clock.date);
 assert.ok(s.event_log.some(e=>e.kind==='HORSE_RACE_PREPARATION_WORKOUT'&&
  e.details.horse_id===id&&e.details.race_id===r.id));
 const payment=s.runtime.finances.ledger.find(x=>x.date===s.clock.date&&
  x.horse_id===id&&x.kind==='HORSE_CARE_OWNER_PAYMENT');
 assert.ok(payment,'Training works through the preexisting one-writer care ledger');
 assert.equal(record.policy.training_plan,originalPlan);
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});

test('race-targeted taper protects final days, keeps real purse settlement and expires after official race',()=>{
 let {s,h,r}=booked();s=set(s,h,r,'BALANCED').state;
 while(s.clock.date<=r.date){
  s=day(s);
  const remaining=(Date.parse(r.date+'T12:00:00Z')-
   Date.parse(s.clock.date+'T12:00:00Z'))/86400000;
  if(remaining>=0&&remaining<=1){
   const row=s.runtime.horse[h.horse_id].history.findLast(x=>
    x.date===s.clock.date&&x.preparation_race_id===r.id);
   assert.ok(row,'Final day must remain in actual care history');
   assert.equal(row.work,'REST','Final day must taper rather than prescribe speed intervals');
  }
 }
 const settled=getGameRacingRoster(s).find(x=>x.id===r.id);
 assert.equal(settled.status,'OFFICIAL_SIM_RESULT');
 assert.ok(settled.results.some(x=>x.horse_id===h.horse_id));
 assert.equal(settled.results.reduce((n,x)=>n+x.earnings_minor,0),settled.purse_minor);
 const postRace=s.runtime.horse[h.horse_id].race_preparation;
 assert.equal(postRace.status,'COMPLETED');
 assert.equal(postRace.close_reason,'OFFICIAL_RESULT');
 assert.equal(s.runtime.horse[h.horse_id].policy.training_plan,
  postRace.original_training_plan,'Normal owner training policy must survive race preparation');
 assert.ok(s.event_log.some(e=>e.kind==='HORSE_RACE_PREPARATION_CLOSED'&&
  e.details.race_id===r.id&&e.details.status==='COMPLETED'));
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});

test('invalid authority, stale revisions, unbooked horses and unsupported approaches cannot mutate care or money',()=>{
 const {s,h,r}=booked(),before=structuredClone(s);
 assert.throws(()=>set(s,h,r,'SHARPEN','preparation:system:1',s.revision,'system'),
  e=>e.code==='HORSE_RACE_PREP_PERMISSION');
 assert.throws(()=>set(s,h,r,'INJURE_HORSE','preparation:invalid:1'),
  e=>e.code==='HORSE_RACE_PREP_PERMISSION');
 assert.throws(()=>set(s,h,r,'BALANCED','preparation:stale:1',s.revision-1),
  e=>e.code==='HORSE_RACE_PREP_STALE');
 const other=Object.values(s.runtime.registered_horses.by_id).find(x=>
  x.owner_organization_id!==s.player.operation_id);
 assert.ok(other);
 assert.throws(()=>get1999RacePreparation(s,world,{
  race_id:r.id,horse_id:other.horse_id}),
  e=>e.code==='HORSE_RACE_PREP_BOOKING'||e.code==='HORSE_RACE_PREP_PERMISSION');
 assert.throws(()=>set(s,other,r,'SHARPEN','preparation:other:1'),
  e=>e.code==='HORSE_RACE_PREP_BOOKING'||e.code==='HORSE_RACE_PREP_PERMISSION');
 assert.deepEqual(s,before);
});

test('owner training-policy override cancels a race preparation; funded feed/care changes do not',()=>{
 let {s,h,r}=booked();s=set(s,h,r,'CONSERVE').state;
 const policy=s.runtime.horse[h.horse_id].policy;
 s=command(s,'preparation:feed:1','SET_HORSE_CARE_POLICY',{
  horse_id:h.horse_id,policy:{...policy,care:'PROACTIVE'}},'player').state;
 assert.equal(s.runtime.horse[h.horse_id].race_preparation.status,'ACTIVE');
 s=command(s,'preparation:manual:2','SET_HORSE_CARE_POLICY',{
  horse_id:h.horse_id,policy:{...s.runtime.horse[h.horse_id].policy,training_plan:'REST'}},'player').state;
 assert.equal(s.runtime.horse[h.horse_id].race_preparation.status,'CANCELLED');
 assert.equal(s.runtime.horse[h.horse_id].race_preparation.close_reason,'OWNER_CHANGED_TRAINING_POLICY');
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});

test('cash-constrained owner preparation cannot fabricate a paid workout or ignore a welfare-rest consequence',()=>{
 let {s,h,r}=booked();s=set(s,h,r,'SHARPEN').state;
 const record=s.runtime.horse[h.horse_id];
 s=command(s,'preparation:budget:1','SET_HORSE_CARE_POLICY',{
  horse_id:h.horse_id,policy:{...record.policy,monthly_budget_minor:0}},'player').state;
 assert.equal(s.runtime.horse[h.horse_id].race_preparation.status,'ACTIVE');
 const oldSpent=s.runtime.horse[h.horse_id].finance.lifetime_minor;
 s=day(s);
 const care=s.runtime.horse[h.horse_id];
 const row=care.history.findLast(x=>x.date===s.clock.date&&
  x.preparation_race_id===r.id);
 assert.ok(row);
 assert.equal(row.unfunded,true);
 assert.equal(row.paid_minor,0);
 assert.equal(row.work,'REST');
 assert.equal(care.finance.lifetime_minor,oldSpent);
 assert.ok(s.event_log.some(e=>e.kind==='HORSE_RACE_PREPARATION_WORKOUT'&&
  e.details.horse_id===h.horse_id&&e.details.funded===false));
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});

test('the existing locally instantiated career service exposes the same read-only preparation and commands',async()=>{
 const engine=await createPlaytestCareer({directory,trainers,jockeys,cohort:manifest});
 engine.advanceDay();
 const state=engine.state,owner=state.player.operation_id;
 const choices=[];
 for(const horse of Object.values(state.runtime.registered_horses.by_id)
  .filter(h=>h.owner_organization_id===owner)){
  const options=engine.getRaceOpportunities(horse.horse_id,{includeProposals:false}).rows;
  for(const entry of options.filter(r=>r.status==='PLAYER_CAN_ENTER')){
   for(const j of entry.available_jockeys.filter(j=>j.owner_can_pay)){
    const quote=engine.getRacePlanQuote({horse_id:horse.horse_id,
     race_id:entry.race_id,jockey_id:j.jockey_id,destination_site_id:null});
    if(quote.can_confirm)choices.push({horse,entry,j,quote});
   }
  }
 }
 assert.ok(choices.length,'The browser test fixture has an executable local race booking');
 const c=choices[0];
 engine.command('CONFIRM_1999_RACE_PLAN',{
  horse_id:c.horse.horse_id,race_id:c.entry.race_id,
  jockey_id:c.j.jockey_id,destination_site_id:null,
  expected_revision:c.quote.expected_revision,
  maximum_total_minor:c.quote.immediate_total_minor});
 const view=engine.getRacePreparation({horse_id:c.horse.horse_id,
  race_id:c.entry.race_id});
 assert.equal(view.horse_id,c.horse.horse_id);
 assert.equal(view.active_plan,null);
 engine.command('SET_1999_RACE_PREPARATION',{
  horse_id:c.horse.horse_id,race_id:c.entry.race_id,
  approach:'BALANCED',expected_revision:view.expected_revision});
 assert.equal(engine.getRacePreparation({horse_id:c.horse.horse_id,
  race_id:c.entry.race_id}).active_plan.approach,'BALANCED');
 const saved=engine.getSave();
 assert.deepEqual(importGameSave(saved,engine.world),engine.state);
});
