/**
 * WTW 1999 MODELED TRAINER SERVICE CONTRACTS — owner/trainer pairs.
 *
 * An owner may make an offer, but the trainer independently decides whether
 * to accept based on ability, workload, standing, trust and the real wage.
 * Contracts set actual billed daily training fees through the existing
 * horse-care ledger. There is no contract-based horse reassignment here.
 * Source trainer P-IDs and owner O-IDs are never mutated.
 */
import {ensure,isObject,validDate,worldIdentity,nextDate} from './contracts.js';
import {workingRelationshipProfile} from './working-relationship-1999.js';
import {getOwnerTrainerMandate} from './owner-trainer-career-1999.js';
import {project1999OwnerSourceGameplay,source1999OwnerReputationContractOffset}
 from '../engine/source-personnel-gameplay-1999.mjs';

export const TRAINER_CONTRACT_SCHEMA='WTW_1999_TRAINER_SERVICE_AGREEMENTS_V1';
export const TRAINER_CONTRACT_COMMANDS=Object.freeze(['OFFER_TRAINER_SERVICE_TERMS']);
const integer=Number.isSafeInteger;
const rounded=x=>Math.round(Math.max(0,Math.min(1,x))*10000)/10000;
const pair=(owner,trainer)=>owner+'|'+trainer;
const activeHorses=state=>Object.values(state.runtime.registered_horses?.by_id||{}).
 filter(h=>Boolean(h.starting_attributes));
const ownersHorses=(state,owner,trainer)=>activeHorses(state).
 filter(h=>h.owner_organization_id===owner&&h.trainer_id===trainer);
const personSkills=(state,id)=>state.runtime.people[id]?.game_training_skills;
const peopleSource=(world,id)=>worldIdentity(world,'people',id);
function addDays(date,n){for(let i=0;i<n;i++)date=nextDate(date);return date}
export const createTrainerContractRuntime=()=>({
 schema:TRAINER_CONTRACT_SCHEMA,by_pair:{},last_review_date:null,
 totals:{initial_signings:0,offers:0,accepted:0,declined:0,ai_reviews:0}
});
const root=state=>state.runtime.trainer_contracts??
 (state.runtime.trainer_contracts=createTrainerContractRuntime());
export function baselineTrainerDailyFee(skills){
 const ability=skills?.roleAttributes?.conditioning;
 ensure(typeof ability==='number'&&Number.isFinite(ability)&&ability>=0&&ability<=1,
  'TRAINER_CONTRACT','Modeled trainer conditioning ability is required for baseline compensation');
 // Only newly sourced canonical trainers carry this explicit reputation
 // index. Existing negotiated contracts and older careers are unchanged.
 const standing=skills?.source_reputation_index;
 const premium=Number.isFinite(standing)?
  Math.round(900*(standing-.5)):0;
 return Math.round(4000+4500*ability)+premium;
}
function trainerLoad(state,trainerId){
 const current=activeHorses(state).filter(h=>h.trainer_id===trainerId).length;
 const skills=personSkills(state,trainerId);
 // The trained capacity is not the physical stall capacity. Too many
 // concurrent horses raises the price of scarce personal oversight.
 const capacity=Math.max(5,Math.round(5+10*(skills?.roleAttributes?.workout_design??.5)));
 return {horses:current,capacity,pressure:rounded(current/Math.max(1,capacity))};
}
export function trainerContractQuote(state,world,ownerId,trainerId){
 ensure(Boolean(worldIdentity(world,'organizations',ownerId))&&
  Boolean(peopleSource(world,trainerId))&&ownersHorses(state,ownerId,trainerId).length>0,
  'TRAINER_CONTRACT','Trainer and owner must already share registered game horses');
 const skills=personSkills(state,trainerId);
 ensure(Boolean(skills),'TRAINER_CONTRACT','Existing trainer must have a modeled role skill record');
 const base=baselineTrainerDailyFee(skills);
 const load=trainerLoad(state,trainerId);
 const relation=state.runtime.agents?.relationships?.[pair(ownerId,trainerId)];
 const trust=relation?.trainer_support??.5;
 const ownerSource=project1999OwnerSourceGameplay(
  worldIdentity(world,'organizations',ownerId));
 const working=workingRelationshipProfile(state,ownerId,trainerId,
  worldIdentity(world,'organizations',ownerId));
 const gameStanding=state.runtime.people[trainerId]?.game_race_record?.professional_standing??.5;
 // An impatient trainer in a strained partnership demands more for scarce
 // oversight; patient trainers with strong relationships can tolerate less.
 // Avoid changing source salary facts: these are modeled contract quotes.
 const threshold=.74+load.pressure*.16+(1-trust)*.16+gameStanding*.10+
  (.5-working.trainer_patience)*.10+
  (.5-working.working_relationship_strength)*.07-
  source1999OwnerReputationContractOffset(ownerSource);
 const min= Math.round(base*threshold);
 const contract=state.runtime.trainer_contracts?.by_pair?.[pair(ownerId,trainerId)]??null;
 const balance=state.runtime.finances?.operation_balances_minor?.[ownerId];
 const horses=ownersHorses(state,ownerId,trainerId).length;
 return {owner_id:ownerId,trainer_id:trainerId,horse_count:horses,
  modeled_base_fee_minor:base,minimum_acceptable_minor:min,
  trainer_horses:load.horses,trainer_capacity:load.capacity,
  trainer_load_ratio:load.pressure,owner_trust:trust,professional_standing:gameStanding,
  owner_source_rating_model:ownerSource?.schema??null,
  owner_source_reputation:ownerSource?.reputation??null,
  trainer_patience:working.trainer_patience,
  working_relationship_strength:working.working_relationship_strength,
  owner_cash_minor:integer(balance)&&balance>=0?balance:null,
  current_daily_fee_minor:contract?.daily_fee_minor??base,
  next_terms:contract?.pending??null,
  next_review_date:contract?.review_on??null,
  authority:'MODELED_GAME_SERVICE_TERMS_NOT_HISTORICAL_CONTRACT'};
}
function startAgreement(state,world,owner,trainer,emit){
 const rt=root(state),k=pair(owner,trainer);
 if(rt.by_pair[k])return rt.by_pair[k];
 const quote=trainerContractQuote(state,world,owner,trainer);
 const agreement={owner_id:owner,trainer_id:trainer,
  daily_fee_minor:quote.modeled_base_fee_minor,
  signed_on:state.clock.date,effective_on:state.clock.date,
  review_on:addDays(state.clock.date,28),revision:1,
  status:'ACTIVE',provenance:'MODELED_EXISTING_GAME_TRAINING_SERVICE',
  pending:null,last_review_reason:'INITIAL_GAME_SERVICE_TERMS'};
 rt.by_pair[k]=agreement;rt.totals.initial_signings++;
 emit?.('TRAINER_SERVICE_AGREEMENT_STARTED',{owner_id:owner,trainer_id:trainer,
  horse_count:quote.horse_count,daily_fee_minor:agreement.daily_fee_minor,
  trainer_capacity:quote.trainer_capacity,provenance:agreement.provenance});
 return agreement;
}
/**
 * An accepted trainer-market move is not a speculative contract quotation.
 * Activate the signed service fee only after the horse and actual racing
 * barn have changed, and terminate the prior owner's service ONLY if that
 * trainer no longer has any horses for that owner.
 */
export function completeTrainerEmploymentAgreement({state,world,item,emit}){
 const rt=root(state),owner=item.owner_id,previous=item.from_trainer_id,
  incoming=item.to_trainer_id,oldKey=pair(owner,previous),
  newKey=pair(owner,incoming);
 const other=ownersHorses(state,owner,incoming).length;
 ensure(other>0,'TRAINER_HIRE_CONTRACT','Accepted trainer must hold the transferred horse');
 const existing=rt.by_pair[newKey]??null;
 if(existing?.status==='ACTIVE'){
  ensure(existing.daily_fee_minor===item.daily_fee_minor,
   'TRAINER_HIRE_CONTRACT','Existing client terms cannot change through a horse move');
 }else{
  const prior=existing?.status==='TERMINATED'?{
   signed_on:existing.signed_on,ended_on:existing.ended_on,
   daily_fee_minor:existing.daily_fee_minor,
   revision:existing.revision,reason:existing.last_review_reason}:null;
  if(prior)delete rt.by_pair[newKey];
  const agreement=startAgreement(state,world,owner,incoming,emit);
  agreement.daily_fee_minor=item.daily_fee_minor;
  agreement.provenance='MODELED_ACCEPTED_TRAINER_HIRING_OFFER';
  agreement.last_review_reason='SAME_TRACK_HIRING_TERMS_ACTIVATED';
  if(prior)agreement.previous_employment=[
   ...(existing.previous_employment||[]),prior].slice(-8);
  emit('TRAINER_EMPLOYMENT_AGREEMENT_SIGNED',{
   owner_id:owner,trainer_id:incoming,horse_id:item.horse_id,
   daily_fee_minor:item.daily_fee_minor,
   previous_relationship_reopened:Boolean(prior)});
 }
 const departing=rt.by_pair[oldKey];
 if(!ownersHorses(state,owner,previous).length&&departing?.status==='ACTIVE'){
  departing.status='TERMINATED';departing.ended_on=state.clock.date;
  departing.pending=null;
  departing.last_review_reason='LAST_OWNER_HORSE_TRANSFERRED';
  emit('TRAINER_SERVICE_RELATIONSHIP_ENDED',{
   owner_id:owner,trainer_id:previous,
   horse_id:item.horse_id,ended_on:state.clock.date,
   reason:'LAST_OWNER_HORSE_TRANSFERRED',
   other_owners_unaffected:true});
 }
}

export function trainerDailyFee(state,horse,skills){
 const existing=state.runtime.trainer_contracts?.by_pair?.[
  pair(horse.owner_organization_id,horse.trainer_id)];
 return existing?.status==='ACTIVE'?existing.daily_fee_minor:baselineTrainerDailyFee(skills);
}
export function offerTrainerServiceTerms({state,world,command,emit}){
 const p=command.payload;
 ensure(isObject(p)&&integer(p.daily_fee_minor)&&
  p.daily_fee_minor>=3000&&p.daily_fee_minor<=25000,
  'TRAINER_OFFER','Proposed modeled trainer daily fee must be between $30 and $250');
 const owner=p.owner_id,trainer=p.trainer_id;
 const quote=trainerContractQuote(state,world,owner,trainer);
 ensure((command.actor==='system'&&owner!==state.player.operation_id)||
  (command.actor==='player'&&state.player.role==='owner'&&
   state.player.operation_id===owner),
  'TRAINER_PERMISSION','Player-controlled service terms require an authorized player command');
 const account=quote.owner_cash_minor;
 ensure(account!==null&&account>=p.daily_fee_minor*quote.horse_count*7,
  'TRAINER_FUNDS','Owner needs seven days of proposed trainer fees in available cash');
 const rt=root(state),current=startAgreement(state,world,owner,trainer,emit);
 ensure(current.status==='ACTIVE'&&!current.pending,
  'TRAINER_OFFER_PENDING','Existing trainer terms must activate before another offer');
 rt.totals.offers++;
 const accepted=p.daily_fee_minor>=quote.minimum_acceptable_minor;
 const relationship=state.runtime.agents?.relationships?.[pair(owner,trainer)];
 if(!accepted){
  rt.totals.declined++;
  if(relationship)relationship.trainer_support=rounded(relationship.trainer_support-.007);
  emit('TRAINER_SERVICE_OFFER_DECLINED',{owner_id:owner,trainer_id:trainer,
   offered_minor:p.daily_fee_minor,minimum_acceptable_minor:quote.minimum_acceptable_minor,
   current_daily_fee_minor:current.daily_fee_minor,reason:'TRAINER_WAGE_AND_WORKLOAD_EXPECTATIONS',
   trainer_capacity:quote.trainer_capacity,trainer_horses:quote.trainer_horses});
  return {accepted:false};
 }
 const effective_on=nextDate(state.clock.date);
 current.pending={daily_fee_minor:p.daily_fee_minor,effective_on,
  provenance:command.actor==='player'?'PLAYER_OWNER_APPROVED_GAME_TERMS':
   'AI_OWNER_TRAINER_NEGOTIATED_GAME_TERMS'};
 rt.totals.accepted++;
 emit('TRAINER_SERVICE_OFFER_ACCEPTED',{owner_id:owner,trainer_id:trainer,
  offered_minor:p.daily_fee_minor,previous_minor:current.daily_fee_minor,
  effective_on,horse_count:quote.horse_count,modeled:true});
 return {accepted:true};
}
/** Apply the existing agreement before owner funding and horse workout choices.
 * AI reviews only on the agreement's scheduled review date and never changes
 * player-owned terms without an actual player command. */
export function advanceTrainerContracts({state,world,emit}){
 const rt=root(state),day=state.clock.date;
 if(rt.last_review_date===day)return;
 const seen=new Map();
 for(const h of activeHorses(state)){
  const k=pair(h.owner_organization_id,h.trainer_id);
  if(!seen.has(k))seen.set(k,{owner:h.owner_organization_id,trainer:h.trainer_id});
 }
 for(const [id,{owner,trainer}] of [...seen].sort((a,b)=>a[0].localeCompare(b[0]))){
  const a=startAgreement(state,world,owner,trainer,emit);
  if(a.pending&&a.pending.effective_on<=day){
   const previous=a.daily_fee_minor;
   a.daily_fee_minor=a.pending.daily_fee_minor;
   a.effective_on=day;a.provenance=a.pending.provenance;a.pending=null;
   a.revision++;a.review_on=addDays(day,28);
   a.last_review_reason='SIGNED_TERMS_ACTIVATED';
   emit('TRAINER_SERVICE_TERMS_EFFECTIVE',{owner_id:owner,trainer_id:trainer,
    daily_fee_minor:a.daily_fee_minor,previous_minor:previous,
    revision:a.revision,reason:'OWNER_TRAINER_ACCEPTED_OFFER'});
  }
  if(a.review_on>day||a.pending)continue;
  rt.totals.ai_reviews++;
  const quote=trainerContractQuote(state,world,owner,trainer);
  if(owner===state.player.operation_id&&state.player.role==='owner'){
   a.review_on=addDays(day,28);a.last_review_reason='AWAIT_PLAYER_DECISION';
   emit('TRAINER_SERVICE_REVIEW_DUE',{owner_id:owner,trainer_id:trainer,
    quote_minor:quote.minimum_acceptable_minor,
    current_minor:a.daily_fee_minor,reason:'PLAYER_OWNER_RETAINS_CONTRACT_AUTHORITY'});
   continue;
  }
  const cash=quote.owner_cash_minor??0;
  const mandate=getOwnerTrainerMandate(state,owner,trainer);
  const record=state.runtime.owner_trainer_reviews?.by_pair?.[id]?.evidence;
  const observedStarts=record?.decision_sample_starts??record?.starts??0;
  const observedForm=record?.decision_form??record?.average_relative_form??0;
  const strongSupport=mandate==='SUPPORT'&&
   observedStarts>=5&&observedForm>.20;
  const improvementHold=mandate==='IMPROVEMENT_PLAN'&&
   observedStarts>=4&&observedForm<-.20&&
   quote.professional_standing<.8;
  const target=strongSupport?
   Math.round(quote.minimum_acceptable_minor*1.03):quote.minimum_acceptable_minor;
  const canPay=cash>=target*quote.horse_count*14;
  const shouldRaise=!improvementHold&&a.daily_fee_minor<target&&canPay;
  if(shouldRaise){
   a.pending={daily_fee_minor:target,
    effective_on:nextDate(day),provenance:strongSupport?
     'AI_OWNER_SUSTAINED_FORM_CONTRACT_BACKING':'AI_TRAINER_MARKET_RENEGOTIATION'};
   rt.totals.offers++;rt.totals.accepted++;
   emit('AI_TRAINER_SERVICE_RENEGOTIATED',{owner_id:owner,trainer_id:trainer,
    old_daily_fee_minor:a.daily_fee_minor,new_daily_fee_minor:target,
    effective_on:a.pending.effective_on,
    reason:strongSupport?'SUSTAINED_FORM_EARNED_COMPENSATION_PREMIUM':
     'TRAINER_MARKET_FEE_AND_OWNER_LIQUIDITY'});
  }else{
   a.last_review_reason=improvementHold?
    'OWNER_IMPROVEMENT_PLAN_DEFERS_OPTIONAL_RAISE':
    canPay?'CURRENT_TERMS_COMPETITIVE':'OWNER_CASH_RUNWAY_CONSTRAINT';
   emit('TRAINER_SERVICE_REVIEWED',{owner_id:owner,trainer_id:trainer,
    daily_fee_minor:a.daily_fee_minor,reason:a.last_review_reason});
  }
  a.review_on=addDays(day,28);
 }
 rt.last_review_date=day;
}
export function validateTrainerContracts(state,world){
 const rt=state.runtime.trainer_contracts;
 if(rt===undefined)return; // Existing valid saves may predate this feature.
 ensure(isObject(rt)&&rt.schema===TRAINER_CONTRACT_SCHEMA&&isObject(rt.by_pair)&&
  isObject(rt.totals)&&(rt.last_review_date===null||
  validDate(rt.last_review_date)&&rt.last_review_date<=state.clock.date),
  'TRAINER_CONTRACT_SAVE','Malformed trainer agreement store');
 for(const v of Object.values(rt.totals))
  ensure(integer(v)&&v>=0,'TRAINER_CONTRACT_SAVE','Invalid agreement counts');
 for(const [k,a] of Object.entries(rt.by_pair)){
  ensure(isObject(a)&&pair(a.owner_id,a.trainer_id)===k&&
   Boolean(worldIdentity(world,'organizations',a.owner_id))&&
   Boolean(peopleSource(world,a.trainer_id))&&
   ['ACTIVE','TERMINATED'].includes(a.status)&&
   (a.status==='ACTIVE'?a.ended_on===undefined:
    validDate(a.ended_on)&&a.ended_on<=state.clock.date&&
    !ownersHorses(state,a.owner_id,a.trainer_id).length&&a.pending===null)&&
   (a.previous_employment===undefined||Array.isArray(a.previous_employment)&&
    a.previous_employment.length<=8&&a.previous_employment.every(x=>
     validDate(x.signed_on)&&validDate(x.ended_on)&&
     integer(x.daily_fee_minor)&&x.daily_fee_minor>=3000&&
     x.daily_fee_minor<=25000))&&
   integer(a.revision)&&a.revision>=1&&
   integer(a.daily_fee_minor)&&a.daily_fee_minor>=3000&&a.daily_fee_minor<=25000&&
   validDate(a.signed_on)&&a.signed_on<=state.clock.date&&
   validDate(a.effective_on)&&a.effective_on<=state.clock.date&&
   validDate(a.review_on)&&typeof a.provenance==='string'&&
   typeof a.last_review_reason==='string'&&
   (a.pending===null||isObject(a.pending)&&
    integer(a.pending.daily_fee_minor)&&a.pending.daily_fee_minor>=3000&&
    a.pending.daily_fee_minor<=25000&&validDate(a.pending.effective_on)&&
    a.pending.effective_on>state.clock.date&&typeof a.pending.provenance==='string'),
   'TRAINER_CONTRACT_SAVE','Invalid owner/trainer agreement identity, money or dates');
 }
}
export function getTrainerContract(state,world,ownerId,trainerId){
 const quote=trainerContractQuote(state,world,ownerId,trainerId);
 const a=state.runtime.trainer_contracts?.by_pair?.[pair(ownerId,trainerId)];
 return structuredClone({schema:TRAINER_CONTRACT_SCHEMA,...quote,
  agreement:a?structuredClone(a):null});
}
