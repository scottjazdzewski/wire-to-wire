import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 getGamePostRaceCampaign,postRaceWorkoutGuidance,postRaceCarePriority,
 postRaceAIPlacement,get1999HorseRaceOpportunities,quote1999PlayerRacePlan}
 from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';
import {createPlaytestCareer} from '../public/1999/game/playtest-service.mjs';

const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const directory=load('../public/data/wtw-1999-founding-directory-v1.json');
const trainers=load('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockeys=load('../public/data/wtw-1999-jockey-pilot-v1.json');
const cohort=load('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...directory.people,...trainers.trainers,...jockeys.jockeys].
 map(p=>[p.id,p])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'1999-POSTRACE-AGENT-CAREER-QA',
  source:'ISOLATED_MODELED_GAME_TEST_NOT_HISTORICAL',
  sha256:createHash('sha256').update('postrace-campaign-day-choice-v1').digest('hex')},
 entities:{horses:directory.horses,organizations:directory.organizations,
  people,tracks:directory.tracks}};
const fresh=()=>build1999PilotGameRun({world,manifest:cohort,jockeys:jockeys.jockeys});
const command=(state,id,type,payload={},actor='system')=>
 dispatchGameCommand({state,world,command:{id,type,payload,actor}}).state;
const day=state=>command(state,'postrace:test:day:'+state.clock.date,'ADVANCE_DAY');
const resultRaces=state=>Object.values(state.runtime.races).
 filter(r=>r.status==='OFFICIAL_SIM_RESULT');
const through=date=>{let s=fresh();while(s.clock.date<date)s=day(s);return s};
test('every actual starter receives one dated, persistent result-linked trainer campaign, never a fabricated result',()=>{
 const state=through('1999-01-09');
 const races=resultRaces(state);
 assert.equal(races.length,3);
 const source=JSON.stringify(world);
 const plans=state.runtime.post_race_campaigns;
 assert.equal(plans.schema,'WTW_1999_POSTRACE_CAMPAIGN_V1');
 assert.equal(plans.totals.race_reviews,27);
 assert.equal(Object.keys(plans.by_horse).length,27);
 assert.equal(state.event_log.filter(e=>e.kind==='HORSE_POST_RACE_CAMPAIGN_CREATED').length,27);
 for(const race of races){
  for(const result of race.results){
   const p=getGamePostRaceCampaign(state,result.horse_id);
   const horse=state.runtime.registered_horses.by_id[result.horse_id];
   assert.ok(p);
   assert.equal(p.last_race_id,race.id);
   assert.equal(p.last_race_date,race.date);
   assert.equal(p.finish,result.finish);
   assert.equal(p.purse_earnings_minor,result.earnings_minor);
   assert.equal(p.proposed_class,horse.career.wins===0?'Maiden Special Weight':
    horse.career.wins<=2?'Allowance':'CLASS_NOT_YET_MODELED');
   const days=(Date.parse(p.earliest_next_race_date)-Date.parse(p.last_race_date))/86400000;
   assert.ok(days>=12&&days<=28);
   assert.ok(p.mandatory_rest_days>=2&&p.mandatory_rest_days<=6);
   assert.ok(p.light_rebuild_days>=2&&p.light_rebuild_days<=5);
   assert.ok(p.previous_race_ids.includes(race.id));
   assert.equal(p.record_origin,'MODELED_REACTION_TO_OFFICIAL_GAME_RACE_NOT_HISTORICAL');
  }
 }
 assert.equal(JSON.stringify(world),source);
 assert.deepEqual(importGameSave(exportGameSave(state,world),world),state);
 let repeat=fresh();for(let i=0;i<8;i++)repeat=day(repeat);
 assert.deepEqual(repeat,state,'Same seed, actual careers and daily AI produce identical strategy');
});
test('the trainer performs real mandatory rest and later light reintegration rather than ignoring postrace fatigue',()=>{
 let state=through('1999-01-07');
 const race=resultRaces(state).find(x=>x.date==='1999-01-07');
 assert.ok(race&&race.results.length>=2);
 const runner=race.results.find(r=>{
  const h=state.runtime.registered_horses.by_id[r.horse_id];
  return !state.runtime.racing.horse_travel[h.horse_id];
 })||race.results[0];
 const h=state.runtime.registered_horses.by_id[runner.horse_id];
 const plan=getGamePostRaceCampaign(state,h.horse_id);
 assert.equal(plan.phase,'RECOVERY_REST');
 const before=structuredClone(state.runtime.horse[h.horse_id].training);
 const first=day(state),care=first.runtime.horse[h.horse_id];
 assert.equal(care.agent.workout,'REST');
 assert.equal(care.agent.reason,'POST_RACE_MANDATORY_REST');
 assert.equal(care.history.at(-1).work,'REST');
 assert.ok(care.training.fatigue<before.fatigue||care.training.readiness>before.readiness);
 assert.ok(first.event_log.some(x=>x.kind==='TRAINER_DAILY_DECISIONS'&&
  x.details.decisions.some(d=>d.horse_id===h.horse_id&&
   d.reason==='POST_RACE_MANDATORY_REST')));
 let next=first;
 for(let i=0;i<4;i++)next=day(next);
 const lightEvent=next.event_log.filter(e=>e.kind==='TRAINER_DAILY_DECISIONS').
  some(e=>e.details.decisions.some(d=>d.horse_id===h.horse_id&&
   d.reason==='POST_RACE_LIGHT_REBUILD'));
 assert.ok(lightEvent||next.runtime.horse[h.horse_id].training.sorenessDays>0,
  'Trainer must resume with light work when risk permits, or honor a welfare hold');
 assert.deepEqual(importGameSave(exportGameSave(next,world),world),next);
});
test('autonomous owner funds postrace care, while cash and actual horse-care invoices still constrain the decision',()=>{
 const start=through('1999-01-07');
 const race=resultRaces(start).find(x=>x.date==='1999-01-07');
 const result=race.results.find(x=>start.runtime.registered_horses.by_id[x.horse_id].
  owner_organization_id!==start.player.operation_id);
 const h=start.runtime.registered_horses.by_id[result.horse_id],owner=h.owner_organization_id;
 const recent=postRaceCarePriority({...start,clock:{...start.clock,date:'1999-01-08'}},h);
 assert.equal(recent.active,true);assert.equal(recent.first_day,true);
 const scenario=structuredClone(start);
 scenario.runtime.agents.owners[owner].welfare_priority=.65;
 scenario.runtime.agents.owners[owner].investment_appetite=.45;
 scenario.runtime.finances.operation_balances_minor[owner]=90000000;
 const care=scenario.runtime.horse[h.horse_id];
 care.training.currentRisk=.25;care.training.sorenessDays=0;care.training.fatigue=.22;
 care.policy.care='BASIC';care.policy.feed='STANDARD';
 care.policy.source='AI_GAMEPLAY_DECISION';
 const noCampaign=structuredClone(scenario);
 delete noCampaign.runtime.post_race_campaigns.by_horse[h.horse_id];
 const invested=day(scenario),ordinary=day(noCampaign);
 assert.equal(invested.runtime.horse[h.horse_id].policy.care,'PROACTIVE');
 assert.equal(ordinary.runtime.horse[h.horse_id].policy.care,'BASIC');
 assert.ok(invested.event_log.some(x=>x.kind==='OWNER_DAILY_STRATEGY'&&
  x.details.owner_id===owner&&x.details.decisions.some(d=>
   d.horse_id===h.horse_id&&d.reason==='POST_RACE_CARE_INVESTMENT')));
 assert.ok(invested.runtime.finances.ledger.some(e=>
  e.horse_id===h.horse_id&&e.date==='1999-01-08'&&
  e.kind==='HORSE_CARE_OWNER_PAYMENT'));
 const ownerDayFlow=invested.runtime.finances.ledger.filter(e=>
  e.date==='1999-01-08'&&e.operation_id===owner).
  reduce((total,e)=>total+e.amount_minor,0);
 assert.equal(invested.runtime.finances.operation_balances_minor[owner],
  90000000+ownerDayFlow,
  'Owner cash must reconcile to both care expenses AND legitimate racing/barn income');
 assert.ok(invested.runtime.finances.ledger.some(e=>
  e.date==='1999-01-08'&&e.horse_id===h.horse_id&&
  e.kind==='HORSE_CARE_OWNER_PAYMENT'&&e.amount_minor<0),
  'Recovery care must charge a real negative owner invoice');
 const unfunded=structuredClone(scenario);
 unfunded.runtime.finances.operation_balances_minor[owner]=0;
 const blocked=day(unfunded);
 // Separate barn payroll and upkeep can create real operating debt in
 // existing facility accounting. Never mistake that debt for paid horse care.
 assert.ok(Number.isSafeInteger(blocked.runtime.finances.operation_balances_minor[owner]));
 assert.ok(blocked.event_log.some(e=>e.kind==='HORSE_CARE_UNFUNDED'&&
  e.details.owner_id===owner&&e.details.horse_id===h.horse_id));
 assert.equal(blocked.runtime.finances.ledger.filter(e=>
  e.date==='1999-01-08'&&e.horse_id===h.horse_id&&
  e.kind==='HORSE_CARE_OWNER_PAYMENT').length,0,
  'An insolvent operation cannot post fictional paid care to the horse');
});
test('AI trainer waits for real dated recovery and changes future race fit by trained preferences',()=>{
 const state=through('1999-01-07');
 const race=resultRaces(state).find(x=>x.date==='1999-01-07');
 const r=race.results.find(x=>state.runtime.registered_horses.by_id[x.horse_id].
  owner_organization_id!==state.player.operation_id);
 const h=state.runtime.registered_horses.by_id[r.horse_id],plan=getGamePostRaceCampaign(state,h.horse_id);
 const check={
  id:'SYNTHETIC-UNBOOKED-ONLY-TEST',date:'1999-01-13',
  conditions:plan.proposed_class,surface:plan.preferred_surface,
  distance_furlongs:plan.preferred_distance_band==='SPRINT'?6:9
 };
 const early=postRaceAIPlacement(state,h,check);
 assert.equal(early.eligible,false);
 assert.equal(early.reason,'RECOVERY_AND_TRAINER_RETURN_DATE');
 const ready={...check,date:plan.earliest_next_race_date};
 const preferred=postRaceAIPlacement(state,h,ready);
 const other=postRaceAIPlacement(state,h,{...ready,
  surface:ready.surface==='TURF'?'DIRT':'TURF',
  distance_furlongs:plan.preferred_distance_band==='SPRINT'?9:6});
 assert.equal(preferred.eligible,true);
 assert.ok(preferred.bonus>other.bonus);
 assert.equal(postRaceAIPlacement(state,h,{...ready,conditions:'Claiming'}).eligible,false);
 const playerHorse=Object.values(state.runtime.registered_horses.by_id).
  find(x=>x.owner_organization_id===state.player.operation_id);
 assert.equal(postRaceAIPlacement(state,playerHorse,check).reason,
  'NO_PRIOR_POSTRACE_CAMPAIGN');
 assert.equal(state.runtime.races['SYNTHETIC-UNBOOKED-ONLY-TEST'],undefined,
  'Advisory tests must not open or invent real race records');
});
test('player-directed workouts are only overridden for compulsory postrace welfare rest',()=>{
 let state=through('1999-01-02');
 let choice=null;
 for(const h of Object.values(state.runtime.registered_horses.by_id).
  filter(x=>x.owner_organization_id===state.player.operation_id)){
  const candidates=get1999HorseRaceOpportunities(state,world,h.horse_id,{includeProposals:false}).rows;
  for(const r of candidates.filter(x=>x.status==='PLAYER_CAN_ENTER')){
   for(const j of r.available_jockeys.filter(x=>x.owner_can_pay)){
    const payload={horse_id:h.horse_id,race_id:r.race_id,jockey_id:j.jockey_id};
    const q=quote1999PlayerRacePlan(state,world,payload);
    if(q.can_confirm){choice={horse:h,payload,quote:q};break}
   }
   if(choice)break;
  }
  if(choice)break;
 }
 assert.ok(choice,'Pilot player owner must have an actual entry and jockey option');
 state=command(state,'postrace:player:entry','CONFIRM_1999_RACE_PLAN',{
  ...choice.payload,expected_revision:choice.quote.expected_revision,
  maximum_total_minor:choice.quote.immediate_total_minor},'player');
 const raceId=choice.payload.race_id;
 while(state.clock.date<state.runtime.races[raceId].date)state=day(state);
 const h=state.runtime.registered_horses.by_id[choice.horse.horse_id];
 const race=state.runtime.races[raceId];
 assert.equal(race.status,'OFFICIAL_SIM_RESULT');
 assert.ok(race.results.some(r=>r.horse_id===h.horse_id));
 const p=getGamePostRaceCampaign(state,h.horse_id);
 assert.ok(p);
 const care=state.runtime.horse[h.horse_id];
 state=command(state,'postrace:player:speed','SET_HORSE_CARE_POLICY',{
  horse_id:h.horse_id,policy:{...care.policy,training_plan:'SPEED'}},'player');
 const first=day(state),today=first.runtime.horse[h.horse_id];
 assert.equal(today.agent.reason,'POST_RACE_MANDATORY_REST');
 assert.equal(today.agent.workout,'REST');
 assert.equal(today.history.at(-1).work,'REST');
 // Once the mandatory rest interval ends, the owner's explicit speed plan
 // remains the authority unless a real welfare guard again requires rest.
 let next=first;
 while(next.clock.date<=p.earliest_next_race_date&&
  next.clock.date<'1999-02-08')next=day(next);
 const final=next.runtime.horse[h.horse_id];
 assert.equal(final.policy.source,'PLAYER_DECISION');
 assert.equal(final.policy.training_plan,'SPEED');
 assert.deepEqual(importGameSave(exportGameSave(next,world),world),next);
});
test('browser service reads exactly the same saved review without an independent strategy store',async()=>{
 const service=await createPlaytestCareer({directory,trainers,jockeys,cohort});
 service.advanceTo('1999-01-09');
 const race=service.view().races.find(r=>r.status==='OFFICIAL_SIM_RESULT');
 assert.ok(race);
 const id=race.results[0].horse_id;
 const before=service.getSave(),record=service.getPostRaceCampaign(id);
 assert.ok(record);
 assert.deepEqual(record,getGamePostRaceCampaign(service.state,id));
 assert.equal(service.getSave(),before,'Read-only review must not modify IndexedDB payload');
 const restored=await createPlaytestCareer({directory,trainers,jockeys,cohort,save:before});
 assert.deepEqual(restored.getPostRaceCampaign(id),record);
});
