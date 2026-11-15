/**
 * WTW 1999 — saved consequences and future campaign decisions after real races.
 * Records a trainer's assessment and a horse-specific recovery timetable.
 * Uses only committed game results, the registered horse, funded care and
 * modeled trainer skills. Does not mint money, invent injuries or write canon.
 */
import {ensure,isObject,validDate} from './contracts.js';

export const POST_RACE_CAMPAIGN_SCHEMA='WTW_1999_POSTRACE_CAMPAIGN_V1';
export const createPostRaceCampaignRuntime=()=>({
 schema:POST_RACE_CAMPAIGN_SCHEMA,by_horse:{},
 last_review_date:null,totals:{race_reviews:0,phase_changes:0,
 mandatory_rest_days:0,light_rebuild_days:0}
});
const cap=x=>Math.max(0,Math.min(1,x));
const round=x=>Math.round(cap(x)*10000)/10000;
const gap=(a,b)=>(Date.parse(b+'T12:00:00Z')-
 Date.parse(a+'T12:00:00Z'))/86400000;
const plus=(date,days)=>new Date(Date.parse(date+'T12:00:00Z')+
 days*86400000).toISOString().slice(0,10);
const writable=state=>state.runtime.post_race_campaigns??=
 createPostRaceCampaignRuntime();
export const careerRaceClass=wins=>wins===0?'Maiden Special Weight':
 wins===1||wins===2?'Allowance':'CLASS_NOT_YET_MODELED';
function duration(state,horse,training,finish,field){
 const skills=state.runtime.people[horse.trainer_id]?.game_training_skills?.roleAttributes||{};
 const layoff=skills.layoff_management??.5;
 const recoveryPenalty=(training.fatigue>.55?3:training.fatigue>.35?1:0)+
  (training.currentRisk>.64?4:training.currentRisk>.48?2:0)+
  (training.sorenessDays>0?3:0)+(training.stress>.55?1:0);
 const agePenalty=horse.racing_age_1999<=3?1:0;
 const abilityBonus=layoff>.72?-1:0;
 const fieldStress=field>=11&&finish>=field-2?1:0;
 return Math.min(28,Math.max(12,14+recoveryPenalty+agePenalty+fieldStress+abilityBonus));
}
function phaseFor(plan,training,date){
 const days=gap(plan.last_race_date,date);
 if(training?.sorenessDays>0||training?.currentRisk>=.76)
  return 'WELFARE_HOLD';
 if(days<=plan.mandatory_rest_days)return 'RECOVERY_REST';
 if(days<=plan.mandatory_rest_days+plan.light_rebuild_days)
  return 'LIGHT_REINTEGRATION';
 if(date<plan.earliest_next_race_date)return 'CONDITIONING';
 return 'RACE_PREPARATION';
}
function preference(a,race,relative){
 // One performance should not erase a horse's established aptitudes.
 // Under-performance makes the trainer consult the stronger modeled
 // surface/distance when the difference is actually meaningful.
 const surfaceGap=Math.abs(a.turf_aptitude-a.dirt_aptitude);
 const distanceGap=Math.abs(a.sprint_aptitude-a.route_aptitude);
 const surface=relative<-.17&&surfaceGap>=.12?
  (a.turf_aptitude>a.dirt_aptitude?'TURF':'DIRT'):race.surface;
 const distance=relative<-.17&&distanceGap>=.12?
  (a.sprint_aptitude>a.route_aptitude?'SPRINT':'ROUTE'):
  (race.distance_furlongs<8?'SPRINT':'ROUTE');
 return {surface,distance,changed_for_underperformance:relative<-.17&&
  (surface!==race.surface||
   distance!==(race.distance_furlongs<8?'SPRINT':'ROUTE'))};
}
/** Settlement-only; runs after modelHorsePostRaceResponse updates real fatigue.
 * Never makes a race result, never forces a historical identity/financing claim. */
export function registerPostRaceCampaigns({state,world,race,results,emit}){
 ensure(race?.id&&race.date===state.clock.date&&Array.isArray(results)&&
  results.length>=2,'POST_RACE_CAMPAIGN','Only an actual race-day field can be reviewed');
 const runtime=writable(state);
 for(const result of results){
  const horse=state.runtime.registered_horses.by_id[result.horse_id];
  const care=state.runtime.horse[result.horse_id];
  ensure(Boolean(horse)&&Boolean(care?.training)&&
   Number.isInteger(result.finish)&&result.finish>=1&&
   result.finish<=results.length,
   'POST_RACE_CAMPAIGN','Review needs registered horse and actual settled placing');
  const key=horse.horse_id,prior=runtime.by_horse[key]||null;
  ensure(prior?.last_race_id!==race.id,'POST_RACE_DUPLICATE',
   'Horse cannot receive two different reviews for one result');
  const actual=1-(result.finish-1)/Math.max(1,results.length-1);
  const expected=.2+.6*horse.starting_attributes.current_ability/99;
  const relative=actual-expected,t=care.training;
  const earliestDays=duration(state,horse,t,result.finish,results.length);
  const rest=Math.min(6,2+(t.fatigue>.47?1:0)+(t.currentRisk>.57?1:0)+
   (t.sorenessDays>0?1:0));
  const light=Math.min(5,2+(t.fatigue>.38?1:0)+(t.currentRisk>.5?1:0));
  const wanted=preference(horse.starting_attributes,race,relative);
  const record={
   horse_id:key,owner_id:horse.owner_organization_id,
   trainer_id:horse.trainer_id,
   last_race_id:race.id,last_race_date:race.date,
   finish:result.finish,field_size:results.length,
   race_surface:race.surface,race_distance_furlongs:race.distance_furlongs,
   purse_earnings_minor:result.earnings_minor,
   confidence_signal:relative>.17?'EXCEEDED_EXPECTATION':
    relative<-.17?'BELOW_EXPECTATION':'NEAR_EXPECTATION',
   relative_performance:Math.round(relative*10000)/10000,
   mandatory_rest_days:rest,light_rebuild_days:light,
   earliest_next_race_date:plus(race.date,earliestDays),
   proposed_class:careerRaceClass(horse.career.wins),
   preferred_surface:wanted.surface,
   preferred_distance_band:wanted.distance,
   switched_preference:wanted.changed_for_underperformance,
   phase:'RECOVERY_REST',last_review_date:race.date,
   race_risk_at_finish:round(t.currentRisk),
   record_origin:'MODELED_REACTION_TO_OFFICIAL_GAME_RACE_NOT_HISTORICAL',
   previous_race_ids:[...(prior?.previous_race_ids||[]),race.id].slice(-12)
  };
  runtime.by_horse[key]=record;runtime.totals.race_reviews++;
  emit('HORSE_POST_RACE_CAMPAIGN_CREATED',{
   horse_id:key,race_id:race.id,trainer_id:horse.trainer_id,
   owner_id:horse.owner_organization_id,finish:result.finish,
   class_goal:record.proposed_class,
   preferred_surface:record.preferred_surface,
   preferred_distance_band:record.preferred_distance_band,
   earliest_race_date:record.earliest_next_race_date,
   rest_days:rest,light_days:light,
   outcome:record.confidence_signal,
   reason:record.switched_preference?
    'TRAINER_RECONSIDERED_SURFACE_DISTANCE_AFTER_RESULT':
    'TRAINER_RETAINS_ABILITIES_AND_BUILDS_RECOVERY'});
 }
}
/** Daily agent decisions happen on the real saved date, before any work. */
export function advancePostRaceCampaigns({state,emit}){
 const store=state.runtime.post_race_campaigns;
 if(!store||store.last_review_date===state.clock.date)return;
 for(const [id,plan] of Object.entries(store.by_horse).
  sort(([a],[b])=>a.localeCompare(b))){
  const training=state.runtime.horse[id]?.training;
  if(!training)continue;
  const next=phaseFor(plan,training,state.clock.date);
  if(next!==plan.phase){
   const prior=plan.phase;
   plan.phase=next;store.totals.phase_changes++;
   emit('HORSE_CAMPAIGN_PHASE_CHANGED',{
    horse_id:id,trainer_id:plan.trainer_id,
    previous:prior,next,as_of:state.clock.date,
    last_race_id:plan.last_race_id,
    earliest_next_race_date:plan.earliest_next_race_date});
  }
  plan.last_review_date=state.clock.date;
 }
 store.last_review_date=state.clock.date;
}
/** Trainer workout direction is a real choice that impacts next day's care.
 * Mandatory first postrace rest and actual welfare holds outrank every plan.
 * Rebuilding is advisory and a human's non-AUTO order may supersede it. */
export function postRaceWorkoutGuidance(state,horse,date=state.clock.date){
 const plan=state.runtime.post_race_campaigns?.by_horse?.[horse.horse_id];
 const training=state.runtime.horse?.[horse.horse_id]?.training;
 if(!plan||!training||date<plan.last_race_date)return null;
 const phase=phaseFor(plan,training,date);
 if(phase==='WELFARE_HOLD')
  return {workout:'REST',reason:'POST_RACE_WELFARE_HOLD',mandatory:true,phase};
 if(phase==='RECOVERY_REST')
  return {workout:'REST',reason:'POST_RACE_MANDATORY_REST',mandatory:true,phase};
 if(phase==='LIGHT_REINTEGRATION')
  return {workout:'LIGHT',reason:'POST_RACE_LIGHT_REBUILD',mandatory:false,phase};
 return {workout:null,reason:'RESUME_TRAINER_PROGRAM',mandatory:false,phase};
}
/** Postrace owner review sees a dated horse-specific recovery obligation,
 * not a generic owner personality or an invented treatment bill. */
export function postRaceCarePriority(state,horse){
 const plan=state.runtime.post_race_campaigns?.by_horse?.[horse.horse_id];
 if(!plan)return {active:false,first_day:false,days_since: null};
 const days=gap(plan.last_race_date,state.clock.date);
 return {active:days>=1&&days<=6,first_day:days===1,days_since:days,
  phase:plan.phase,last_race_id:plan.last_race_id};
}
/** Race-secretary/trainer AI may not override a recorded recovery campaign.
 * Player entry rights remain with the existing raceEligibility engine. */
export function postRaceAIPlacement(state,horse,race){
 const plan=state.runtime.post_race_campaigns?.by_horse?.[horse.horse_id];
 if(!plan)return {eligible:true,bonus:0,reason:'NO_PRIOR_POSTRACE_CAMPAIGN'};
 if(race.date<plan.earliest_next_race_date)
  return {eligible:false,bonus:0,reason:'RECOVERY_AND_TRAINER_RETURN_DATE'};
 if(plan.proposed_class!==race.conditions)
  return {eligible:false,bonus:0,reason:'TRAINER_CLASS_GOAL_NOT_SUPPORTED'};
 const surface=race.surface===plan.preferred_surface;
 const distance=(race.distance_furlongs<8?'SPRINT':'ROUTE')===plan.preferred_distance_band;
 return {eligible:true,bonus:(surface?.08:-.06)+(distance?.06:-.045),
  reason:surface&&distance?'TRAINER_PREFERRED_COURSE':'TRAINER_COMPARES_ALTERNATE_COURSE'};
}
export const POST_RACE_LIVE_REVIEW_SCHEMA='WTW_1999_DAILY_POSTRACE_REVIEW_V1';
/** One evolving horse review atop its unchanged, official race-day record.
 * All progress comes from today's saved horse condition, calendar and actual
 * settled race. No alternate training simulation or extra save field. */
export function getGamePostRaceCampaign(state,horseId){
 const value=state.runtime.post_race_campaigns?.by_horse?.[horseId];
 if(!value)return null;
 const horse=state.runtime.registered_horses?.by_id?.[horseId],
  training=state.runtime.horse?.[horseId]?.training,
  race=state.runtime.races?.[value.last_race_id],
  result=race?.status==='OFFICIAL_SIM_RESULT'?
   race.results?.find(x=>x.horse_id===horseId):null;
 const asOf=state.clock.date,
  elapsed=Math.max(0,gap(value.last_race_date,asOf)),
  untilReturn=Math.max(0,gap(asOf,value.earliest_next_race_date)),
  phase=phaseFor(value,training,asOf),
  guidance=horse?postRaceWorkoutGuidance(state,horse,asOf):null;
 const live={
  schema:POST_RACE_LIVE_REVIEW_SCHEMA,as_of:asOf,
  horse_id:horseId,last_race_id:value.last_race_id,
  original_race_trainer_id:value.trainer_id,
  current_trainer_id:horse?.trainer_id??null,
  trainer_changed_since_race:Boolean(horse&&horse.trainer_id!==value.trainer_id),
  days_since_race:elapsed,days_until_return_window:untilReturn,
  return_window_open:untilReturn===0,
  phase,trainer_workout:guidance?.workout??null,
  trainer_workout_reason:guidance?.reason??'NO_CURRENT_TRAINING_GUIDANCE',
  welfare_hold:phase==='WELFARE_HOLD'||phase==='RECOVERY_REST',
  fitness:training?.fitness??null,
  readiness:training?.readiness??null,
  fatigue:training?.fatigue??null,
  soundness_risk:training?.currentRisk??null,
  soreness_days:training?.sorenessDays??null,
  risk_change_since_finish:training?
   Math.round((training.currentRisk-value.race_risk_at_finish)*10000)/10000:null,
  official_finish:result?.finish??null,
  official_field_size:race?.status==='OFFICIAL_SIM_RESULT'?
   race.results.length:null,
  official_tactic:result?result.race_tactic??'AUTO':null,
  official_earnings_minor:result?.earnings_minor??null,
  placement_not_automatically_authorized:true,
  origin:'SAVED_OFFICIAL_RACE_CURRENT_HORSE_CONDITION_AND_GAME_CLOCK'
 };
 return {...structuredClone(value),live_assessment:structuredClone(live)};
}
export function validatePostRaceCampaigns(state,world){
 const store=state.runtime.post_race_campaigns;
 if(store===undefined)return;
 ensure(isObject(store)&&store.schema===POST_RACE_CAMPAIGN_SCHEMA&&
  isObject(store.by_horse)&&isObject(store.totals)&&
  (store.last_review_date===null||validDate(store.last_review_date)&&
   store.last_review_date<=state.clock.date),
  'POST_RACE_SAVE','Invalid post-race strategy runtime');
 for(const v of Object.values(store.totals))
  ensure(Number.isSafeInteger(v)&&v>=0,'POST_RACE_SAVE','Invalid review counter');
 for(const [id,p] of Object.entries(store.by_horse)){
  const horse=state.runtime.registered_horses?.by_id?.[id],
   race=state.runtime.races?.[p?.last_race_id],
   entry=state.runtime.entries?.[p?.last_race_id+':'+id];
  // This is the RACE-DAY trainer, not a permanently fixed employee.
  // A later valid local hire must not invalidate an official career result.
  ensure(Boolean(horse)&&isObject(p)&&p.horse_id===id&&
   p.owner_id===horse.owner_organization_id&&
   race?.status==='OFFICIAL_SIM_RESULT'&&
   race.results?.some(row=>row.horse_id===id&&
    row.trainer_id===p.trainer_id&&row.finish===p.finish)&&
   entry?.trainer_id===p.trainer_id&&entry.owner_id===p.owner_id&&
   validDate(p.last_race_date)&&p.last_race_date<=state.clock.date&&
   validDate(p.earliest_next_race_date)&&p.earliest_next_race_date>p.last_race_date&&
   validDate(p.last_review_date)&&p.last_review_date<=state.clock.date&&
   typeof p.last_race_id==='string'&&
   ['DIRT','TURF'].includes(p.preferred_surface)&&
   ['SPRINT','ROUTE'].includes(p.preferred_distance_band)&&
   ['Maiden Special Weight','Allowance','CLASS_NOT_YET_MODELED'].includes(p.proposed_class)&&
   ['RECOVERY_REST','LIGHT_REINTEGRATION','CONDITIONING','WELFARE_HOLD','RACE_PREPARATION'].includes(p.phase)&&
   Number.isInteger(p.mandatory_rest_days)&&p.mandatory_rest_days>=2&&
   p.mandatory_rest_days<=6&&Number.isInteger(p.light_rebuild_days)&&
   p.light_rebuild_days>=2&&p.light_rebuild_days<=5&&
   Number.isInteger(p.finish)&&p.finish>=1&&
   Number.isInteger(p.field_size)&&p.field_size>=p.finish&&
   Number.isSafeInteger(p.purse_earnings_minor)&&p.purse_earnings_minor>=0&&
   Array.isArray(p.previous_race_ids)&&p.previous_race_ids.length>=1&&
   p.previous_race_ids.length<=12&&
   p.previous_race_ids.at(-1)===p.last_race_id,
   'POST_RACE_SAVE','Invalid horse strategy identity, race date, workload or class');
 }
}
