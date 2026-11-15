/**
 * Offline 1999 horse-specific race placement recommendations.
 *
 * One read-only decision layer over the actual career race-opportunity
 * list, confirmed trainer/horse conditioning, postrace recovery and
 * authoritative race-plan quote. No independent entry/finances/AI rules.
 */
import {ensure} from './contracts.js';
import {get1999HorseRaceOpportunities} from './race-opportunities-1999.js';
import {quote1999PlayerRacePlan} from './player-race-plan-1999.js';
import {getGameHorsePerformance} from './horse-care.js';
import {getGamePostRaceCampaign} from './post-race-campaign-1999.js';
import {effectiveHorseTrack} from './shipping-1999.js';

export const RACE_PLACEMENT_ADVICE_SCHEMA='WTW_1999_OWNER_RACE_PLACEMENT_ADVICE_V1';
const round=x=>Math.round(x*1000)/1000;
const clamp=x=>Math.max(0,Math.min(1,x));
const dates=(a,b)=>(Date.parse(b+'T12:00:00Z')-
 Date.parse(a+'T12:00:00Z'))/86400000;
const grade=row=>row.tier==='HIGH_MATCH'?0:
 row.tier==='VIABLE'?1:row.tier==='CAUTION'?2:
 row.tier==='ALREADY_BOOKED'?3:row.tier==='RECOVERY_HOLD'?4:
 row.tier==='NOT_ENTERABLE'?5:6;
const match=arr=>arr?.length?arr[0]:null;
const priorRaceFit=(state,horse,row)=>{
 const plan=getGamePostRaceCampaign(state,horse.horse_id);
 if(!plan)return {campaign: null, recovery_hold:false,
  surface_preferred:null,distance_preferred:null,class_preferred:null};
 const band=row.distance_furlongs<8?'SPRINT':'ROUTE';
 return {
  campaign:{last_race_id:plan.last_race_id,last_race_date:plan.last_race_date,
   earliest_next_race_date:plan.earliest_next_race_date,
   preferred_surface:plan.preferred_surface,
   preferred_distance_band:plan.preferred_distance_band,
   proposed_class:plan.proposed_class,phase:plan.phase},
  recovery_hold:row.date<plan.earliest_next_race_date,
  surface_preferred:plan.preferred_surface===row.surface,
  distance_preferred:plan.preferred_distance_band===band,
  class_preferred:plan.proposed_class===row.conditions
 };
};
function rivals(state,row,horseId){
 const race=state.runtime.races?.[row.race_id];
 if(!race)return {count:0,mean_ability:null};
 const rated=(race.field||[]).map(id=>state.runtime.entries?.[id])
  .filter(e=>e&&e.horse_id!==horseId)
  .map(e=>state.runtime.registered_horses?.by_id?.[e.horse_id]?.starting_attributes?.current_ability)
  .filter(n=>Number.isFinite(n)&&n>=1&&n<=99);
 return {count:rated.length,
  mean_ability:rated.length?round(rated.reduce((a,b)=>a+b,0)/rated.length/99):null};
}
/** Candidate combination is never authorized by a score alone:
 * only a real, currently acceptable quote can produce a confirmation.
 * Spend limits and travel are still enforced by the engine's original writer.
 */
function executableQuote(state,world,horseId,row){
 if(!['PLAYER_CAN_ENTER','SHIPPING_REQUIRED'].includes(row.status))return null;
 const jockeys=[...row.available_jockeys].filter(j=>j.owner_can_pay)
  .sort((a,b)=>b.suited_index-a.suited_index||
   a.fee_minor-b.fee_minor||a.jockey_id.localeCompare(b.jockey_id)).slice(0,4);
 const destinations=row.status==='SHIPPING_REQUIRED'?
  [...row.receiving_barn_options].filter(s=>s.allowed).sort((a,b)=>
   a.shipping_minor-b.shipping_minor||
   a.destination_site_id.localeCompare(b.destination_site_id)).slice(0,3):[null];
 const accepted=[];
 for(const j of jockeys)for(const site of destinations){
  const request={horse_id:horseId,race_id:row.race_id,
   jockey_id:j.jockey_id,destination_site_id:site?.destination_site_id??null};
  const quote=quote1999PlayerRacePlan(state,world,request);
  if(quote.can_confirm)accepted.push({request,quote,
   jockey_suitability:j.suited_index});
 }
 accepted.sort((a,b)=>b.jockey_suitability-a.jockey_suitability||
  a.quote.immediate_total_minor-b.quote.immediate_total_minor||
  a.request.jockey_id.localeCompare(b.request.jockey_id)||
  (a.request.destination_site_id??'').localeCompare(b.request.destination_site_id??''));
 return match(accepted);
}
/** No invented win percentages. This ranks only known local game options
 * with a documented, modeled fit index and exact idempotent booking quote.
 */
export function get1999RacePlacementAdvice(state,world,horseId,{
 horizonDays=21,includeProposals=false,limit=30}={}){
 ensure(state.player?.role==='owner'&&
  state.runtime.registered_horses?.by_id?.[horseId]?.owner_organization_id===
   state.player.operation_id,
  'RACE_PLACEMENT_PERMISSION','Only the current player owner may request a horse placement board');
 ensure(Number.isInteger(limit)&&limit>=1&&limit<=60,
  'RACE_PLACEMENT_QUERY','Use a supported ranked result limit');
 const opportunities=get1999HorseRaceOpportunities(state,world,horseId,{
  horizonDays,includeProposals,limit:200});
 const horse=state.runtime.registered_horses.by_id[horseId],
  condition=getGameHorsePerformance(state,world,horseId),
  trainerSkill=condition.trainer_gameplay_skills?.race_placement??.5;
 const rows=opportunities.rows.map(row=>{
  const trackLocal=effectiveHorseTrack(state,horse)===row.track_id,
   proposed=row.source_status!=='ACTUAL_GAME_RACE_ENTRIES_OPEN',
   booking=proposed?null:executableQuote(state,world,horseId,row),
   post=priorRaceFit(state,horse,row),field=rivals(state,row,horseId),
   gap=dates(state.clock.date,row.date);
  const risk=Math.max(condition.soundness_risk,condition.fatigue),
   conditionReady=condition.soreness_days===0&&risk<.58&&
    condition.readiness>=.51;
  const recommendations=[];
  if(post.recovery_hold)recommendations.push('TRAINER_RECOVERY_RETURN_DATE_NOT_REACHED');
  if(!conditionReady)recommendations.push('CONDITION_REQUIRES_RECOVERY_OR_BETTER_FITNESS');
  if(!trackLocal)recommendations.push('TRAVEL_AND_RECEIVING_BARN_REQUIRED');
  if(row.class_fit<.48)recommendations.push('WEAK_SURFACE_DISTANCE_MATCH');
  if(post.campaign&&(!post.surface_preferred||!post.distance_preferred))
   recommendations.push('DIFFERS_FROM_POSTRACE_TRAINER_PREFERENCE');
  if(row.eligibility_reasons.length)recommendations.push(...row.eligibility_reasons);
  if(!proposed&&!booking&&['PLAYER_CAN_ENTER','SHIPPING_REQUIRED'].includes(row.status))
   recommendations.push('NO_ACTUAL_CONFIRMABLE_PLAN_AT_CURRENT_COST_OR_CAPACITY');
  if(proposed)recommendations.push('PROPOSED_RACE_NOT_OPEN_FOR_ENTRY');
  const rivalPenalty=field.mean_ability===null?0:
   Math.max(0,field.mean_ability-horse.starting_attributes.current_ability/99)*.09;
  const travelPenalty=trackLocal?0:.035;
  const trainerPenalty=post.campaign&&!post.class_preferred ? .025 : 0;
  const suitability=round(clamp(
   row.class_fit*.51+condition.readiness*.19+condition.fitness*.11+
   (1-condition.soundness_risk)*.09+trainerSkill*.10-
   rivalPenalty-travelPenalty-trainerPenalty));
  const currentBooking=row.status==='ALREADY_ENTERED';
  const blocked=proposed||!booking;
  const hold=post.recovery_hold||!conditionReady;
  let tier=proposed?'PROPOSAL_NOT_OPEN':currentBooking?'ALREADY_BOOKED':
   blocked?'NOT_ENTERABLE':hold?'RECOVERY_HOLD':
   suitability>=.67?'HIGH_MATCH':suitability>=.53?'VIABLE':'CAUTION';
  if(tier==='CAUTION')recommendations.push('LOW_COMBINED_FIT_USE_TRAINER_DISCRETION');
  if(!recommendations.length)recommendations.push('CURRENTLY_SUITABLE_BOOKED_RACE_AND_WORKABLE_JOCKEY');
  return {
   race_id:row.race_id,horse_id:horseId,date:row.date,
   track_id:row.track_id,conditions:row.conditions,
   surface:row.surface,distance_furlongs:row.distance_furlongs,
   purse_minor:row.purse_minor,source_status:row.source_status,
   opportunity_status:row.status,tier,
   suitability_index:suitability,aptitude_fit_index:row.class_fit,
   condition_as_of:condition.as_of,readiness_index:condition.readiness,
   fatigue_index:condition.fatigue,risk_index:condition.soundness_risk,
   modeled_rival_count:field.count,
   known_rival_mean_current_ability:field.mean_ability,
   days_to_race:gap,postrace_campaign:post.campaign,
   trainer_recommends_entry:!blocked&&!hold&&
    (tier==='HIGH_MATCH'||tier==='VIABLE'),
   recommendations:[...new Set(recommendations)],
   // These values are the canonical *actual quote*; they are not a booking.
   actionable_plan:booking?{
    ...booking.request,
    expected_revision:booking.quote.expected_revision,
    maximum_total_minor:booking.quote.immediate_total_minor,
    jockey_suitability:booking.jockey_suitability,
    estimated_return_shipping_minor:booking.quote.estimated_return_shipping_minor,
    reserved_care_minor:booking.quote.reserved_care_minor
   }:null,
   can_confirm_now:Boolean(booking),
   game_result_predicted:false
  };
 });
 rows.sort((a,b)=>grade(a)-grade(b)||
  b.suitability_index-a.suitability_index||
  a.date.localeCompare(b.date)||a.race_id.localeCompare(b.race_id));
 return structuredClone({schema:RACE_PLACEMENT_ADVICE_SCHEMA,
  horse_id:horseId,owner_id:horse.owner_organization_id,
  trainer_id:horse.trainer_id,as_of:state.clock.date,
  expected_revision:state.revision,horizon_days:horizonDays,
  total:rows.length,rows:rows.slice(0,limit),
  source:'CURRENT_LOCAL_GAME_RACE_CARE_BOOKINGS_AND_QUOTES_NOT_HISTORICAL_RESULTS',
  note:'RANKING_IS_MODELED_HORSE_RACE_FIT_NOT_WIN_PROBABILITY_OR_AUTO_ENTRY'});
}
