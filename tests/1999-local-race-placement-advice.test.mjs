import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 get1999RacePlacementAdvice,get1999HorseRaceOpportunities,
 quote1999PlayerRacePlan,RACE_PLACEMENT_ADVICE_SCHEMA,
 importGameSave,exportGameSave,dispatchGameCommand
} from '../src/game/index.js';
import {createPlaytestCareer} from '../public/1999/game/playtest-service.mjs';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const fixtures={
 directory:read('../public/data/wtw-1999-founding-directory-v1.json'),
 trainers:read('../public/data/wtw-1999-trainer-pilot-v1.json'),
 jockeys:read('../public/data/wtw-1999-jockey-pilot-v1.json'),
 cohort:read('../public/data/wtw-1999-playtest-cohort-38-v1.json')
};
const started=async()=>{
 const engine=await createPlaytestCareer(fixtures);
 engine.advanceDay();
 return {engine,state:engine.state,world:engine.world};
};
const ownerHorse=state=>Object.values(state.runtime.registered_horses.by_id)
 .find(h=>h.owner_organization_id===state.player.operation_id&&h.host_track_id==='T-0017');

test('local horse placement is side-effect-free and ranks real available race entries with real confirmed booking quotes',async()=>{
 const {engine,state,world}=await started(),horse=ownerHorse(state);
 assert.ok(horse);
 const snapshot=structuredClone(state);
 const board=get1999RacePlacementAdvice(state,world,horse.horse_id);
 assert.equal(board.schema,RACE_PLACEMENT_ADVICE_SCHEMA);
 assert.equal(board.as_of,state.clock.date);
 assert.equal(board.expected_revision,state.revision);
 assert.equal(board.horse_id,horse.horse_id);
 assert.ok(board.rows.length>0);
 assert.equal(board.rows.every(r=>r.game_result_predicted===false),true);
 assert.ok(board.rows.every(r=>r.suitability_index>=0&&r.suitability_index<=1&&
  r.aptitude_fit_index>=0&&r.aptitude_fit_index<=1&&
  r.readiness_index>=0&&r.readiness_index<=1));
 assert.equal(board.rows.every(r=>r.source_status==='ACTUAL_GAME_RACE_ENTRIES_OPEN'),true);
 assert.equal(new Set(board.rows.map(r=>r.race_id)).size,board.rows.length);
 const confirmed=board.rows.find(r=>r.can_confirm_now);
 assert.ok(confirmed,'At least one source-open race must have a real funded confirmation quote');
 assert.equal(confirmed.actionable_plan.horse_id,horse.horse_id);
 assert.equal(confirmed.actionable_plan.race_id,confirmed.race_id);
 assert.equal(confirmed.actionable_plan.expected_revision,state.revision);
 const quote=quote1999PlayerRacePlan(state,world,confirmed.actionable_plan);
 assert.equal(quote.can_confirm,true);
 assert.equal(quote.immediate_total_minor,confirmed.actionable_plan.maximum_total_minor);
 assert.deepEqual(get1999RacePlacementAdvice(state,world,horse.horse_id),board);
 assert.deepEqual(engine.getRacePlacementAdvice(horse.horse_id),board);
 assert.deepEqual(state,snapshot,'Scouting cannot spend cash, enter a horse, or create a fictional result');
});

test('recommended confirmation is identical to the authoritative entry/jockey/shipping command',async()=>{
 const {state,world}=await started();
 let choice=null;
 for(const horse of Object.values(state.runtime.registered_horses.by_id).
  filter(h=>h.owner_organization_id===state.player.operation_id)){
  const board=get1999RacePlacementAdvice(state,world,horse.horse_id);
  choice=board.rows.find(r=>r.trainer_recommends_entry&&r.can_confirm_now);
  if(choice)break;
 }
 assert.ok(choice,'The real career must contain an actionable suited entry');
 const previous=structuredClone(state);
 const result=dispatchGameCommand({state,world,
  command:{id:'placement:confirm:1',actor:'player',
   type:'CONFIRM_1999_RACE_PLAN',payload:choice.actionable_plan}});
 const s=result.state,entry=s.runtime.entries[choice.race_id+':'+choice.horse_id];
 assert.equal(entry.status,'BOOKED');
 assert.equal(entry.jockey_id,choice.actionable_plan.jockey_id);
 assert.ok(result.events.some(e=>e.kind==='PLAYER_RACE_PLAN_CONFIRMED'));
 assert.deepEqual(state,previous,'Authoritative command must not mutate old player save');
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
 const after=get1999RacePlacementAdvice(s,world,choice.horse_id,{includeProposals:false});
 assert.ok(after.rows.some(r=>r.race_id===choice.race_id&&r.tier==='ALREADY_BOOKED'));
 assert.ok(after.rows.some(r=>r.race_id===choice.race_id&&!r.actionable_plan));
});

test('unopened condition-book proposals remain clearly hypothetical, with no phantom jockey or confirmable plan',async()=>{
 const {engine,world}=await (async()=>{
  const service=await createPlaytestCareer(fixtures);
  return {engine:service,world:service.world};
 })();
 const state=engine.state,horse=ownerHorse(state);
 const before=structuredClone(state);
 const board=get1999RacePlacementAdvice(state,world,horse.horse_id,{
  horizonDays:14,includeProposals:true,limit:50});
 assert.ok(board.rows.length>0);
 assert.ok(board.rows.every(r=>r.source_status==='MODELED_SOURCE_CONDITION_BOOK_PROPOSAL'));
 assert.ok(board.rows.every(r=>r.tier==='PROPOSAL_NOT_OPEN'&&
  r.can_confirm_now===false&&r.actionable_plan===null&&
  r.recommendations.includes('PROPOSED_RACE_NOT_OPEN_FOR_ENTRY')));
 assert.deepEqual(state,before);
});

test('recovery and high modeled risk cannot be reported as a trainer-approved race even when source entry would otherwise be possible',async()=>{
 const {state,world}=await started(),horse=ownerHorse(state);
 const original=get1999RacePlacementAdvice(state,world,horse.horse_id);
 assert.ok(original.rows.some(r=>r.can_confirm_now));
 // Isolated read-only scenario: no fictitious ledger or live save is published.
 const highRisk=structuredClone(state);
 const training=highRisk.runtime.horse[horse.horse_id].training;
 training.currentRisk=.78;training.fatigue=.69;
 const view=get1999RacePlacementAdvice(highRisk,world,horse.horse_id);
 assert.ok(view.rows.every(r=>!r.trainer_recommends_entry));
 assert.ok(view.rows.some(r=>r.recommendations.includes('CONDITION_REQUIRES_RECOVERY_OR_BETTER_FITNESS')));
 assert.deepEqual(get1999RacePlacementAdvice(state,world,horse.horse_id),original);
});

test('owner authorization and invalid options reject without leaking other stables or changing the save',async()=>{
 const {state,world}=await started(),horse=ownerHorse(state),before=structuredClone(state);
 const other=Object.values(state.runtime.registered_horses.by_id).
  find(h=>h.owner_organization_id!==state.player.operation_id);
 assert.ok(other);
 assert.throws(()=>get1999RacePlacementAdvice(state,world,other.horse_id),
  e=>e.code==='RACE_PLACEMENT_PERMISSION');
 assert.throws(()=>get1999RacePlacementAdvice(state,world,horse.horse_id,{limit:1000}),
  e=>e.code==='RACE_PLACEMENT_QUERY');
 assert.throws(()=>get1999RacePlacementAdvice(state,world,horse.horse_id,{horizonDays:200}),
  e=>e.code==='RACE_OPPORTUNITY_QUERY');
 assert.deepEqual(state,before);
});
