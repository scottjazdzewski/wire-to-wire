import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 getGamePostRaceCampaign,postRaceWorkoutGuidance}
 from '../src/game/index.js';
import {validatePostRaceCampaigns} from '../src/game/post-race-campaign-1999.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';
import {createPlaytestCareer} from '../public/1999/game/playtest-service.mjs';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const directory=read('../public/data/wtw-1999-founding-directory-v1.json');
const trainers=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockeys=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const cohort=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...directory.people,...trainers.trainers,...jockeys.jockeys].
 map(p=>[p.id,p])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'1999-DAILY-POSTRACE-REVIEW-QA',
  source:'ISOLATED_GAME_REVIEW_NOT_HISTORICAL',
  sha256:createHash('sha256').update('postrace-live-daily-v1').digest('hex')},
 entities:{horses:directory.horses,organizations:directory.organizations,
  people,tracks:directory.tracks}};
const fresh=()=>build1999PilotGameRun({world,manifest:cohort,jockeys:jockeys.jockeys});
const day=state=>dispatchGameCommand({state,world,command:{
 id:'live-review:day:'+state.clock.date,type:'ADVANCE_DAY',actor:'system',payload:{}}}).state;
const through=date=>{let state=fresh();while(state.clock.date<date)state=day(state);return state};
function firstOfficial(state){
 const options=Object.values(state.runtime.races).filter(r=>
  r.status==='OFFICIAL_SIM_RESULT').sort((a,b)=>b.date.localeCompare(a.date));
 const race=options.find(r=>r.date===state.clock.date)??options[0];
 assert.ok(race?.results?.length>1,'Expected a real settled 1999 race');
 return {race,result:race.results[0],horse:state.runtime.registered_horses.by_id[race.results[0].horse_id]};
}

test('postrace review is a pure live view of real results, horse condition and game date',()=>{
 let state=through('1999-01-07');
 const {race,result,horse}=firstOfficial(state);
 const saved=exportGameSave(state,world);
 const record=state.runtime.post_race_campaigns.by_horse[horse.horse_id];
 const review=getGamePostRaceCampaign(state,horse.horse_id);
 const live=review.live_assessment;
 assert.equal(live.schema,'WTW_1999_DAILY_POSTRACE_REVIEW_V1');
 assert.equal(live.as_of,state.clock.date);
 assert.equal(live.days_since_race,0);
 assert.equal(live.last_race_id,race.id);
 assert.equal(live.official_finish,result.finish);
 assert.equal(live.official_field_size,race.results.length);
 assert.equal(live.official_earnings_minor,result.earnings_minor);
 assert.equal(live.official_tactic,result.race_tactic??'AUTO');
 assert.equal(live.original_race_trainer_id,result.trainer_id);
 assert.equal(live.current_trainer_id,horse.trainer_id);
 assert.equal(live.trainer_changed_since_race,false);
 assert.equal(live.fitness,state.runtime.horse[horse.horse_id].training.fitness);
 assert.equal(live.phase,review.phase);
 assert.equal(live.placement_not_automatically_authorized,true);
 assert.equal(live.origin,'SAVED_OFFICIAL_RACE_CURRENT_HORSE_CONDITION_AND_GAME_CLOCK');
 assert.equal(JSON.stringify(state.runtime.post_race_campaigns.by_horse[horse.horse_id]),
  JSON.stringify(record),'Live assessment must not become a second saved model');
 assert.equal(exportGameSave(state,world),saved,'Read-only review must not write game state');
 state=day(state);
 const next=getGamePostRaceCampaign(state,horse.horse_id);
 assert.equal(next.last_race_id,race.id);
 assert.equal(next.live_assessment.days_since_race,1);
 assert.equal(next.live_assessment.as_of,'1999-01-08');
 assert.equal(next.live_assessment.days_until_return_window,
  Math.max(0,(Date.parse(next.earliest_next_race_date)-
   Date.parse(state.clock.date))/86400000));
 const guidance=postRaceWorkoutGuidance(state,horse);
 assert.equal(next.live_assessment.trainer_workout,guidance.workout);
 assert.equal(next.live_assessment.trainer_workout_reason,guidance.reason);
 assert.equal(next.live_assessment.soundness_risk,
  state.runtime.horse[horse.horse_id].training.currentRisk);
 assert.deepEqual(importGameSave(exportGameSave(state,world),world),state);
});

test('review visibly changes as the recovery calendar advances without inventing a future entry',()=>{
 let state=through('1999-01-07');
 const {race,horse}=firstOfficial(state),id=horse.horse_id;
 const initial=getGamePostRaceCampaign(state,id);
 let a=initial,b;
 for(let i=0;i<6;i++)state=day(state);
 b=getGamePostRaceCampaign(state,id);
 assert.equal(b.last_race_id,race.id,'Calendar passage does not invent another race result');
 assert.equal(b.live_assessment.days_since_race,a.live_assessment.days_since_race+6);
 assert.ok(b.live_assessment.days_until_return_window<=
  a.live_assessment.days_until_return_window);
 assert.equal(b.live_assessment.return_window_open,false);
 assert.equal(b.live_assessment.current_trainer_id,horse.trainer_id);
 assert.ok(['RECOVERY_REST','LIGHT_REINTEGRATION','CONDITIONING','WELFARE_HOLD','RACE_PREPARATION'].
  includes(b.live_assessment.phase));
 assert.equal(b.live_assessment.placement_not_automatically_authorized,true);
 assert.ok(Number.isFinite(b.live_assessment.risk_change_since_finish));
 assert.deepEqual(importGameSave(exportGameSave(state,world),world),state);
 const unraced=Object.keys(state.runtime.registered_horses.by_id).
  find(x=>!state.runtime.post_race_campaigns.by_horse[x]);
 if(unraced)assert.equal(getGamePostRaceCampaign(state,unraced),null);
});

test('official historical race trainer is preserved if a later active trainer changes',()=>{
 const state=through('1999-01-09');
 const {race,result,horse}=firstOfficial(state),id=horse.horse_id;
 const copy=structuredClone(state);
 const replacement=Object.values(copy.runtime.registered_horses.by_id).
  find(h=>h.trainer_id!==result.trainer_id)?.trainer_id;
 assert.ok(replacement,'Pilot career contains more than one approved trainer');
 // Simulate the identity-relevant portion of a completed legitimate
 // trainer move. Full money, barn and employment gates have their own tests.
 copy.runtime.registered_horses.by_id[id].trainer_id=replacement;
 copy.runtime.horse[id].training.trainerId=replacement;
 assert.doesNotThrow(()=>validatePostRaceCampaigns(copy,world),
  'A changed CURRENT trainer must not rewrite or invalidate a settled race');
 const view=getGamePostRaceCampaign(copy,id);
 assert.equal(view.trainer_id,result.trainer_id);
 assert.equal(view.live_assessment.original_race_trainer_id,result.trainer_id);
 assert.equal(view.live_assessment.current_trainer_id,replacement);
 assert.equal(view.live_assessment.trainer_changed_since_race,true);
 assert.equal(view.live_assessment.official_finish,result.finish);
 assert.equal(copy.runtime.entries[race.id+':'+id].trainer_id,result.trainer_id,
  'Historical entry attribution must remain exact');
 assert.equal(state.runtime.registered_horses.by_id[id].trainer_id,result.trainer_id);
});

test('the existing local career service reports the same evolving review through save/reopen',async()=>{
 const service=await createPlaytestCareer({directory,trainers,jockeys,cohort});
 service.advanceTo('1999-01-09');
 const race=service.view().races.find(r=>r.status==='OFFICIAL_SIM_RESULT');
 assert.ok(race);
 const id=race.results[0].horse_id;
 const saved=service.getSave(),review=service.getPostRaceCampaign(id);
 assert.equal(review.live_assessment.as_of,service.state.clock.date);
 assert.deepEqual(review,getGamePostRaceCampaign(service.state,id));
 assert.equal(service.getSave(),saved);
 const restored=await createPlaytestCareer({directory,trainers,jockeys,cohort,save:saved});
 assert.deepEqual(restored.getPostRaceCampaign(id),review);
 restored.advanceDay();
 const tomorrow=restored.getPostRaceCampaign(id);
 assert.equal(tomorrow.live_assessment.days_since_race,
  review.live_assessment.days_since_race+1);
 assert.equal(tomorrow.last_race_id,review.last_race_id);
});
