/**
 * WTW 1999 — independent, financially accountable owner/trainer career reviews.
 *
 * Only actual game results, actual care payments, welfare notes, and signed
 * trainer service terms contribute. These are fictional GAME judgments, never
 * ratings or historical contracts of the real people behind approved P-IDs.
 * No dismissal/reassignment, invented cash, new roster, or alternative clock.
 */
import {ensure,isObject,validDate,worldIdentity} from './contracts.js';
import {workingRelationshipProfile} from './working-relationship-1999.js';

export const OWNER_TRAINER_REVIEW_SCHEMA='WTW_1999_OWNER_TRAINER_CAREER_REVIEWS_V1';
export const OWNER_TRAINER_REVIEW_COMMANDS=Object.freeze([
 'SET_OWNER_TRAINER_MANDATE','RESPOND_TO_TRAINER_CONCERN']);
export const TRAINER_CONCERN_RESPONSES=Object.freeze([
 'HEAR_AND_REVIEW','HOLD_CURRENT_COURSE']);
export const OWNER_TRAINER_MANDATES=Object.freeze([
 'NORMAL','SUPPORT','WATCH','IMPROVEMENT_PLAN']);
const pair=(owner,trainer)=>owner+'|'+trainer;
const cap=x=>Math.max(0,Math.min(1,x));
const round=x=>Math.round(x*10000)/10000;
const plus=(date,days)=>new Date(Date.parse(date+'T12:00:00Z')+days*86400000).
 toISOString().slice(0,10);
const ago=(date,days)=>plus(date,-days);
const registered=state=>Object.values(state.runtime.registered_horses?.by_id||{}).
 filter(h=>Boolean(h.starting_attributes));
const pairs=state=>{
 const found=new Map();
 for(const h of registered(state)){
  const k=pair(h.owner_organization_id,h.trainer_id);
  if(!found.has(k))found.set(k,{owner:h.owner_organization_id,trainer:h.trainer_id});
 }
 return [...found].sort(([a],[b])=>a.localeCompare(b));
};
export const createOwnerTrainerReviewRuntime=()=>({
 schema:OWNER_TRAINER_REVIEW_SCHEMA,by_pair:{},last_day:null,
 totals:{scheduled_reviews:0,ai_mandate_changes:0,player_mandate_changes:0,
  evidence_insufficient:0,trainer_form_updates:0,
  concerns_opened:0,player_concern_responses:0,ai_concern_responses:0,
  unanswered_concerns:0,live_pulses:0,live_status_changes:0,
  live_concerns_opened:0}
});
const root=state=>state.runtime.owner_trainer_reviews??=
 createOwnerTrainerReviewRuntime();
const activePair=(state,owner,trainer)=>registered(state).some(h=>
 h.owner_organization_id===owner&&h.trainer_id===trainer);
const authorizedPair=(state,world,owner,trainer)=>{
 ensure(Boolean(worldIdentity(world,'organizations',owner))&&
  Boolean(worldIdentity(world,'people',trainer))&&activePair(state,owner,trainer),
  'TRAINER_REVIEW_PAIR','Review must identify an existing owner/trainer with active game horses');
};
const racesInPeriod=(state,at,days)=>Object.values(state.runtime.races||{}).
 filter(r=>r.status==='OFFICIAL_SIM_RESULT'&&
  r.date>=ago(at,days-1)&&r.date<=at).
 sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
function sampleResults(state,owner,trainer,at,days=56){
 return racesInPeriod(state,at,days).flatMap(r=>r.results.
  filter(result=>(owner===null||result.owner_id===owner)&&
   result.trainer_id===trainer).
  map(result=>({...result,date:r.date,race_id:r.id,field_size:r.results.length})));
}
/** Pure snapshot: no balance, rating, or historical source is ever mutated. */
export function ownerTrainerEvidence(state,world,owner,trainer,{days=56}={}){
 authorizedPair(state,world,owner,trainer);
 ensure(Number.isInteger(days)&&days>=28&&days<=90,'TRAINER_REVIEW_WINDOW',
  'A 28–90 day evaluation window is required');
 const date=state.clock.date,results=sampleResults(state,owner,trainer,date,days);
 const horses=registered(state).filter(h=>h.owner_organization_id===owner&&
  h.trainer_id===trainer),horseIds=new Set(horses.map(h=>h.horse_id));
 const relation=state.runtime.agents?.relationships?.[pair(owner,trainer)]||null;
 const working=workingRelationshipProfile(state,owner,trainer);
 const relative=results.map(x=>{
  const horse=state.runtime.registered_horses.by_id[x.horse_id];
  const expected=.2+.6*(horse?.starting_attributes?.current_ability??55)/99;
  const achieved=1-(x.finish-1)/Math.max(1,x.field_size-1);
  return achieved-expected;
 });
 const form=results.length?round(relative.reduce((n,v)=>n+v,0)/results.length):null;
 // Owners of a one-horse stable cannot rationally judge a trainer from one
 // start. With at least one direct observation, they can also consider five
 // or more settled starts by the same trainer across all current clients.
 const trainerResults=sampleResults(state,null,trainer,date,days);
 const trainerRelative=trainerResults.map(x=>{
  const horse=state.runtime.registered_horses.by_id[x.horse_id];
  return 1-(x.finish-1)/Math.max(1,x.field_size-1)-
   (.2+.6*(horse?.starting_attributes?.current_ability??55)/99);
 });
 const trainerForm=trainerRelative.length?round(trainerRelative.reduce(
  (n,v)=>n+v,0)/trainerRelative.length):null;
 const ownSample=results.length>=3,peerSample=results.length>=1&&trainerResults.length>=5;
 const basis=ownSample?(peerSample?'OWNER_AND_TRAINER_CLIENTS':'OWNER_RESULTS'):
  peerSample?'TRAINER_MULTI_CLIENT_FORM':'INSUFFICIENT';
 const usedForm=ownSample?(peerSample?round(.60*form+.40*trainerForm):form):
  peerSample?trainerForm:null;
 const observedStarts=peerSample?trainerResults.length:results.length;
 const history=horses.flatMap(h=>(state.runtime.horse?.[h.horse_id]?.history||[]).
  filter(x=>x.date>=ago(date,Math.min(45,days)-1)&&x.date<=date));
 const unpaid=history.filter(x=>x.unfunded===true).length;
 const welfareDays=history.filter(x=>typeof x.risk==='number'&&x.risk>.68).length;
 const ledger=state.runtime.finances?.ledger||[];
 const relevant=ledger.filter(x=>x.date>=ago(date,days-1)&&x.date<=date&&
  horseIds.has(x.horse_id));
 const spent= -relevant.filter(x=>x.kind==='HORSE_CARE_OWNER_PAYMENT'&&
  x.operation_id===owner).reduce((n,x)=>n+x.amount_minor,0);
 const jockeyCost=-relevant.filter(x=>x.kind==='JOCKEY_MOUNT_AND_TRAVEL_FEE'&&
  x.operation_id===owner).reduce((n,x)=>n+x.amount_minor,0);
 const transport=-relevant.filter(x=>x.operation_id===owner&&
  ['HORSE_OUTBOUND_SHIPPING_CHARGE','HORSE_RETURN_SHIPPING_CHARGE'].
   includes(x.kind)).reduce((n,x)=>n+x.amount_minor,0);
 const cash=state.runtime.finances?.operation_balances_minor?.[owner];
 return {owner_id:owner,trainer_id:trainer,date,window_days:days,
  horse_count:horses.length,starts:results.length,
  wins:results.filter(x=>x.finish===1).length,
  places:results.filter(x=>x.finish<=3).length,
  win_rate:results.length?round(results.filter(x=>x.finish===1).length/results.length):null,
  average_relative_form:form,
  trainer_multi_client_starts:trainerResults.length,
  trainer_multi_client_wins:trainerResults.filter(x=>x.finish===1).length,
  trainer_multi_client_relative_form:trainerForm,
  last_race:results.length?{race_id:results.at(-1).race_id,
   date:results.at(-1).date,finish:results.at(-1).finish,
   field_size:results.at(-1).field_size}:null,
  decision_form:usedForm,decision_sample_starts:observedStarts,
  decision_sample_basis:basis,
  owner_purse_minor:results.reduce((n,x)=>n+x.owner_share_minor,0),
  care_expense_minor:spent,jockey_expense_minor:jockeyCost,
  shipping_expense_minor:transport,
  net_racing_cash_minor:results.reduce((n,x)=>n+x.owner_share_minor,0)-spent-jockeyCost-transport,
  unfunded_horse_days:unpaid,welfare_risk_horse_days:welfareDays,
  observed_care_days:history.length,
  owner_trust:relation?.owner_trust??.5,
  trainer_support:relation?.trainer_support??.5,
  owner_patience:working.owner_patience,
  trainer_patience:working.trainer_patience,
  working_relationship_strength:working.working_relationship_strength,
  relationship_friction:working.relationship_friction,
  expectation_alignment:working.expectation_alignment,
  shared_working_days:working.shared_working_days,
  owner_cash_minor:Number.isSafeInteger(cash)?cash:null,
  provenance:'ACTUAL_SAVED_GAME_RESULTS_AND_FINANCE_NOT_HISTORICAL_ASSESSMENT'};
}
function initialize(state,owner,trainer){
 const rt=root(state),k=pair(owner,trainer);
 if(!rt.by_pair[k])rt.by_pair[k]={
  owner_id:owner,trainer_id:trainer,mandate:'NORMAL',
  authority:'AI_AUTONOMOUS_INITIAL',next_review_date:plus(state.clock.date,28),
  last_review_date:null,review_count:0,evidence:null,history:[],
  reason:'INITIAL_OWNERSHIP_ASSESSMENT'};
 return rt.by_pair[k];
}
/** Player chooses an owner-management direction; never changes signed wages
 * or an explicit horse care policy. These remain independent commands. */
export function setOwnerTrainerMandate({state,world,command,emit}){
 const p=command.payload;
 ensure(isObject(p)&&OWNER_TRAINER_MANDATES.includes(p.mandate),
  'TRAINER_MANDATE','Choose an existing owner management mandate');
 authorizedPair(state,world,p.owner_id,p.trainer_id);
 ensure(command.actor==='player'&&state.player.role==='owner'&&
  p.owner_id===state.player.operation_id,
  'TRAINER_MANDATE_PERMISSION','Only a player owner can direct their own trainer relationship');
 const rt=root(state),a=initialize(state,p.owner_id,p.trainer_id),old=a.mandate;
 a.mandate=p.mandate;a.authority='PLAYER_OWNER_COMMAND';
 a.reason='EXPLICIT_PLAYER_OWNER_STRATEGY';rt.totals.player_mandate_changes++;
 emit('PLAYER_TRAINER_MANAGEMENT_DIRECTION',{owner_id:p.owner_id,
  trainer_id:p.trainer_id,previous:old,next:p.mandate,
  reason:a.reason,financial_terms_unchanged:true,
  existing_horse_orders_unchanged:true});
}
/**
 * Same objective results can produce different decisions because expectations
 * and patience matter. The relationship buys some grace, but very poor,
 * repeated evidence overrides even strong personal loyalty.
 *
 * Optional new evidence fields default to neutral so older saves/tests remain
 * valid; no decision is ever made from merely a personality rating.
 */
export function selectOwnerTrainerMandate(e,previous,ownerCash){
 const ownerPatience=e.owner_patience??.5;
 const bond=e.working_relationship_strength??.5;
 const sufficient=e.decision_sample_basis?
  e.decision_sample_basis!=='INSUFFICIENT':e.starts>=3;
 const form=e.decision_form??e.average_relative_form;
 const effectiveStarts=e.decision_sample_starts??e.starts;
 const impatientEarly=ownerPatience<.34&&e.starts>=2&&form!==null&&
  Number.isFinite(form);
 if((!sufficient&&!impatientEarly)||
  (ownerPatience>.78&&effectiveStarts<4))
  return {mandate:previous,reason:'WAIT_FOR_SUSTAINED_RACE_SAMPLE'};
 if(e.unfunded_horse_days>0||ownerCash===null||ownerCash<=0)
  return {mandate:previous,reason:'OWNER_FINANCING_PRESSURE_NOT_TRAINER_FAULT'};
 // A patient owner and a trusted, functional partnership both increase the
 // poor-form threshold; negative values mean weaker results are tolerated.
 const poorLimit=-.085-(ownerPatience-.5)*.15-(bond-.5)*.12;
 const severeLimit=-.20-(ownerPatience-.5)*.12-(bond-.5)*.08;
 const relationshipConfidence=.65*e.owner_trust+.35*bond;
 const poor=form<poorLimit&&
  (relationshipConfidence<.63||form<severeLimit-.07);
 if(previous==='WATCH'&&effectiveStarts>=4&&form<severeLimit&&
  (relationshipConfidence<.62||form<-.37))
  return {mandate:'IMPROVEMENT_PLAN',
   reason:'REPEATED_UNDERPERFORMANCE_EXCEEDS_PATIENCE_AND_RELATIONSHIP_GRACE'};
 if(poor)return {mandate:'WATCH',reason:
  ownerPatience<.36?'IMPATIENT_OWNER_REACTS_TO_BELOW_EXPECTED_FORM':
   'SUSTAINED_RESULTS_EXCEED_WORKING_RELATIONSHIP_GRACE'};
 if(form>.065&&e.owner_trust>.44)
  return {mandate:'SUPPORT',reason:'SUSTAINED_OVERPERFORMANCE_EARNS_BACKING'};
 if(previous==='WATCH'&&form<0&&bond>.70&&ownerPatience>.65)
  return {mandate:'NORMAL',reason:'OWNER_GRANTS_RENEWED_CHANCE_TO_TRUSTED_TRAINER'};
 return {mandate:'NORMAL',reason:'STABLE_PERFORMANCE_AND_SUSTAINED_REVIEW'};
}
/** Trainer impatience is independent of the owner's satisfaction. This
 * returns advisory pressure/status, not an invented resignation or firing.
 * Sustained owner underfunding is a valid grievance, not trainer failure. */
export function assessTrainerRelationshipPosition(e,previous='COMMITTED'){
 const patience=e.trainer_patience??.5,trust=e.trainer_support??.5;
 const bond=e.working_relationship_strength??.5;
 const friction=e.relationship_friction??0;
 const service=e.shared_working_days??0;
 const unmet=e.unfunded_horse_days??0;
 const pressure=.55*(1-trust)+.29*(1-bond)+.16*friction+
  Math.min(.28,unmet*.065)+(.5-patience)*.31;
 if(service<14&&unmet===0)return {position:'COMMITTED',
  reason:'EARLY_PARTNERSHIP_TOO_SOON_TO_JUDGE'};
 if(pressure>.81&&service>=28)return {position:'CONSIDERING_DEPARTURE',
  reason:'TRAINER_PATIENCE_EXHAUSTED_BY_RELATIONSHIP_AND_OWNER_SUPPORT'};
 if(pressure>.60)return {position:'PRESSING_FOR_CHANGE',
  reason:unmet>0?'TRAINER_EXPECTS_OWNER_TO_FUND_AGREED_CARE':
   'TRAINER_EXPECTS_BETTER_WORKING_RELATIONSHIP'};
 if(pressure>.43)return {position:'FRUSTRATED',
  reason:'TRAINER_PATIENCE_AND_WORKING_ALIGNMENT_UNDER_STRAIN'};
 return {position:'COMMITTED',reason:'TRAINER_ACCEPTS_CURRENT_PARTNERSHIP'};
}


/**
 * LIVE assessment: computed from the game at READ TIME, so a settled race,
 * care payment, changed workout, contract negotiation, or owner response is
 * immediately reflected even before the next formal 28-day review.
 * Never changes a mandate or silently terminates a working relationship.
 */
export function ownerTrainerLiveAssessment(state,world,owner,trainer){
 const evidence=ownerTrainerEvidence(state,world,owner,trainer);
 const formal=state.runtime.owner_trainer_reviews?.by_pair?.[pair(owner,trainer)];
 const trainerMood=assessTrainerRelationshipPosition(evidence,
  formal?.trainer_position??'COMMITTED');
 const observedForm=evidence.average_relative_form;
 // One race can change sentiment without becoming a premature personnel
 // verdict. Stronger decisions still require the existing sample-aware gate.
 const formSignal=observedForm===null?.5:cap(.5+observedForm);
 const confidence=round(cap(.51*evidence.owner_trust+
  .23*evidence.working_relationship_strength+
  .16*evidence.owner_patience+.10*formSignal));
 const ownerOutlook=confidence>=.65?'CONFIDENT':
  confidence>=.51?'STEADY':confidence>=.35?'WATCHFUL':'ALARMED';
 const preview=selectOwnerTrainerMandate(evidence,
  formal?.mandate??'NORMAL',evidence.owner_cash_minor);
 return {
  date:state.clock.date,owner_id:owner,trainer_id:trainer,
  owner_confidence:confidence,owner_outlook:ownerOutlook,
  trainer_position:trainerMood.position,
  trainer_position_reason:trainerMood.reason,
  trainer_support:evidence.trainer_support,owner_trust:evidence.owner_trust,
  working_relationship_strength:evidence.working_relationship_strength,
  race_starts_56d:evidence.starts,last_race:evidence.last_race,
  last_form:evidence.average_relative_form,
  owner_recommendation:preview.mandate,
  owner_recommendation_reason:preview.reason,
  formal_mandate:formal?.mandate??'NORMAL',
  provenance:'LIVE_ACTUAL_GAME_FACTS_NOT_HISTORICAL_PERSONNEL_ASSESSMENT'
 };
}
const recentConcern=(item,today)=>item.concern&&
 item.concern.opened_on>ago(today,14);
function openDynamicConcern({state,world,item,owner,trainer,live,emit}){
 const c=item.concern;
 // A reaction is allowed after an actual NEW escalation only, never from a
 // perpetual bad relationship on each successive day.
 if(c?.status==='OPEN'||recentConcern(item,state.clock.date))return;
 const reason=live.trainer_position_reason;
 const request_id=concernKey(owner,trainer,state.clock.date);
 item.concern={request_id,opened_on:state.clock.date,
  deadline:plus(state.clock.date,14),status:'OPEN',reason,
  trainer_position:live.trainer_position,resolved_on:null,
  response:null,responder:null,outcome_reason:null};
 const rt=root(state);
 rt.totals.concerns_opened=(rt.totals.concerns_opened??0)+1;
 rt.totals.live_concerns_opened=(rt.totals.live_concerns_opened??0)+1;
 const playerControlled=state.player.role==='owner'&&
  owner===state.player.operation_id;
 emit('TRAINER_CONCERN_OPENED',{owner_id:owner,trainer_id:trainer,
  request_id,deadline:item.concern.deadline,reason,
  trainer_position:live.trainer_position,
  source:'LIVE_RELATIONSHIP_ESCALATION',player_response_required:playerControlled});
 if(!playerControlled){
  const evidence=ownerTrainerEvidence(state,world,owner,trainer);
  const cooperative=evidence.owner_cash_minor>0&&
   evidence.unfunded_horse_days===0&&
   (evidence.owner_patience>=.45||
    evidence.working_relationship_strength>=.48);
  resolveConcern({state,item,owner,trainer,
   choice:cooperative?'HEAR_AND_REVIEW':'HOLD_CURRENT_COURSE',
   actor:'system',evidence,emit});
 }
}
/**
 * Runs after ALL real daily work and race settlements (never before them).
 * Also runs after material player commands. Saves a bounded trend and emits
 * distinct events for actual status changes and races, without faking money.
 */
export function updateOwnerTrainerLiveReviews({state,world,emit,events=[],
 trigger='DAILY'}){
 // Career creation and opening-day setup commands must never bring forward
 // the first 28-day formal review. Day 1 owns initial relationship dating.
 if(state.clock.days_elapsed===0)return;
 const rt=root(state);
 const actualEvents=[...events];
 const rowByHorse=new Map(registered(state).map(h=>[h.horse_id,h]));
 for(const [,ids] of pairs(state)){
  const {owner,trainer}=ids;
  const item=initialize(state,owner,trainer);
  const prior=item.live_assessment??null;
  const live=ownerTrainerLiveAssessment(state,world,owner,trainer);
  const relevant=actualEvents.filter(e=>{
   const d=e.details??{},h=d.horse_id?rowByHorse.get(d.horse_id):null;
   return (d.owner_id===owner&&d.trainer_id===trainer)||
    (h?.owner_organization_id===owner&&h?.trainer_id===trainer);
  });
  const race=relevant.some(e=>e.kind==='POST_RACE_PROFESSIONAL_FEEDBACK');
  const cause=race?'AFTER_RACE':
   relevant.some(e=>e.kind==='TRAINER_CONCERN_RESPONDED')?'AFTER_CONVERSATION':
   relevant.some(e=>e.kind==='TRAINER_SERVICE_OFFER_ACCEPTED'||
    e.kind==='TRAINER_SERVICE_OFFER_DECLINED')?'CONTRACT_DECISION':
   trigger;
  item.live_assessment={...live,trigger:cause};
  item.live_history??=[];
  const sameDate=item.live_history.at(-1)?.date===state.clock.date;
  const trend={date:state.clock.date,trigger:cause,
   owner_confidence:live.owner_confidence,
   owner_outlook:live.owner_outlook,trainer_position:live.trainer_position,
   trainer_support:live.trainer_support,owner_trust:live.owner_trust,
   last_race_id:live.last_race?.race_id??null};
  if(sameDate)item.live_history[item.live_history.length-1]=trend;
  else item.live_history.push(trend);
  if(item.live_history.length>14)item.live_history.shift();
  rt.totals.live_pulses=(rt.totals.live_pulses??0)+1;
  const statusChanged=Boolean(prior)&&(
   prior.owner_outlook!==live.owner_outlook||
   prior.trainer_position!==live.trainer_position);
  if(statusChanged||race){
   rt.totals.live_status_changes=(rt.totals.live_status_changes??0)+1;
   emit('OWNER_TRAINER_LIVE_STATUS',{owner_id:owner,trainer_id:trainer,
    date:state.clock.date,trigger:cause,
    owner_confidence:live.owner_confidence,
    owner_outlook:live.owner_outlook,
    trainer_position:live.trainer_position,
    previous_owner_outlook:prior?.owner_outlook??null,
    previous_trainer_position:prior?.trainer_position??null,
    last_race_id:live.last_race?.race_id??null,
    formal_mandate_unchanged:true});
  }
  const newlyEscalated=prior&&
   !['PRESSING_FOR_CHANGE','CONSIDERING_DEPARTURE'].includes(
    prior.trainer_position)&&
   ['PRESSING_FOR_CHANGE','CONSIDERING_DEPARTURE'].includes(
    live.trainer_position);
  if(newlyEscalated){
   openDynamicConcern({state,world,item,owner,trainer,live,emit});
   // An AI response may change real trainer support immediately; do not
   // leave the same-date saved pulse stale until the following morning.
   const finalLive=ownerTrainerLiveAssessment(state,world,owner,trainer);
   if(finalLive.trainer_support!==live.trainer_support||
    finalLive.owner_confidence!==live.owner_confidence){
    item.live_assessment={...finalLive,trigger:'AFTER_AI_CONVERSATION'};
    item.live_history[item.live_history.length-1]={
     ...trend,trigger:'AFTER_AI_CONVERSATION',
     owner_confidence:finalLive.owner_confidence,
     owner_outlook:finalLive.owner_outlook,
     trainer_position:finalLive.trainer_position,
     trainer_support:finalLive.trainer_support,
     owner_trust:finalLive.owner_trust};
   }
  }
 }
}

const concernKey=(owner,trainer,date)=>owner+'|'+trainer+'|'+date;
const concernHistory=(item,row)=>{
 item.conversation_history??=[];
 item.conversation_history.push(row);
 if(item.conversation_history.length>8)item.conversation_history.shift();
};
function resolveConcern({state,item,owner,trainer,choice,actor,evidence,emit}){
 const c=item.concern,rt=root(state);
 ensure(c?.status==='OPEN'&&c.deadline>=state.clock.date,
  'TRAINER_CONCERN_CLOSED','Trainer concern is already resolved or expired');
 const relation=state.runtime.agents?.relationships?.[pair(owner,trainer)];
 ensure(Boolean(relation),'TRAINER_CONCERN_RELATIONSHIP',
  'Trainer concern requires an actual saved working relationship');
 // Conversation alone never pays invoices, raises wages, changes horses or
 // overrides an explicit player instruction. Unfunded care defeats reassurance.
 const supported=evidence.unfunded_horse_days===0&&
  Number.isSafeInteger(evidence.owner_cash_minor)&&evidence.owner_cash_minor>0;
 const change=choice==='HEAR_AND_REVIEW'?(supported?.028:0):-.025;
 const before=relation.trainer_support;
 relation.trainer_support=round(cap(before+change));
 const reason=choice==='HOLD_CURRENT_COURSE'?'OWNER_MAINTAINS_CURRENT_DIRECTION':
  supported?'FUNDED_CARE_AND_DIALOGUE_REBUILD_CONFIDENCE':
  'DISCUSSION_CANNOT_REPLACE_UNFUNDED_HORSE_CARE';
 c.status='RESOLVED';c.resolved_on=state.clock.date;
 c.response=choice;c.responder=actor;c.outcome_reason=reason;
 concernHistory(item,{request_id:c.request_id,opened_on:c.opened_on,
  closed_on:state.clock.date,status:c.status,response:choice,
  responder:actor,reason,trainer_support_before:before,
  trainer_support_after:relation.trainer_support});
 const metric=actor==='player'?'player_concern_responses':'ai_concern_responses';
 rt.totals[metric]=(rt.totals[metric]??0)+1;
 emit('TRAINER_CONCERN_RESPONDED',{owner_id:owner,trainer_id:trainer,
  request_id:c.request_id,response:choice,by:actor,reason,
  trainer_support_before:before,trainer_support_after:relation.trainer_support,
  money_posted:false,contract_changed:false,employment_changed:false});
}
function expireConcern({state,item,owner,trainer,emit}){
 const c=item.concern;
 if(c?.status!=='OPEN'||c.deadline>=state.clock.date)return;
 const relation=state.runtime.agents?.relationships?.[pair(owner,trainer)];
 ensure(Boolean(relation),'TRAINER_CONCERN_RELATIONSHIP',
  'Pending trainer concern has no saved working relationship');
 const before=relation.trainer_support;
 relation.trainer_support=round(cap(before-.030));
 c.status='EXPIRED';c.resolved_on=state.clock.date;
 c.response=null;c.responder=null;c.outcome_reason='OWNER_DID_NOT_RESPOND';
 concernHistory(item,{request_id:c.request_id,opened_on:c.opened_on,
  closed_on:state.clock.date,status:'EXPIRED',response:null,responder:null,
  reason:c.outcome_reason,trainer_support_before:before,
  trainer_support_after:relation.trainer_support});
 const rt=root(state);
 rt.totals.unanswered_concerns=(rt.totals.unanswered_concerns??0)+1;
 emit('TRAINER_CONCERN_EXPIRED',{owner_id:owner,trainer_id:trainer,
  request_id:c.request_id,reason:c.outcome_reason,
  trainer_support_before:before,trainer_support_after:relation.trainer_support,
  employment_changed:false});
}
/** The player must answer their own trainer; AI owners cannot claim that
 * authority. An existing relationship, open request and exact ID are required. */
export function respondToTrainerConcern({state,world,command,emit}){
 const p=command.payload;
 ensure(isObject(p)&&TRAINER_CONCERN_RESPONSES.includes(p.response),
  'TRAINER_CONCERN_RESPONSE','Choose a valid management response');
 authorizedPair(state,world,p.owner_id,p.trainer_id);
 ensure(command.actor==='player'&&state.player.role==='owner'&&
  state.player.operation_id===p.owner_id,
  'TRAINER_CONCERN_PERMISSION','Only the owning player may answer this concern');
 const item=root(state).by_pair[pair(p.owner_id,p.trainer_id)];
 ensure(item?.concern?.request_id===p.request_id,
  'TRAINER_CONCERN_UNKNOWN','No matching current trainer request');
 resolveConcern({state,item,owner:p.owner_id,trainer:p.trainer_id,
  choice:p.response,actor:'player',
  evidence:ownerTrainerEvidence(state,world,p.owner_id,p.trainer_id),emit});
}

/** Called every real game day, BEFORE owner funding and contract renewal.
 * One 28-day decision per pair, persisted with evidence and exact reasons. */
export function advanceOwnerTrainerReviews({state,world,emit}){
 const rt=root(state),today=state.clock.date;
 if(rt.last_day===today)return;
 for(const [id,{owner,trainer}] of pairs(state)){
  authorizedPair(state,world,owner,trainer);
  const item=initialize(state,owner,trainer);
  expireConcern({state,item,owner,trainer,emit});
  if(item.next_review_date>today)continue;
  const evidence=ownerTrainerEvidence(state,world,owner,trainer);
  const old=item.mandate;
  const trainerBefore=item.trainer_position??'COMMITTED';
  const trainerMood=assessTrainerRelationshipPosition(evidence,trainerBefore);
  item.trainer_position=trainerMood.position;
  item.trainer_position_reason=trainerMood.reason;
  if(trainerMood.position!==trainerBefore)
   emit('TRAINER_WORKING_RELATIONSHIP_SIGNAL',{owner_id:owner,trainer_id:trainer,
    previous:trainerBefore,next:trainerMood.position,
    reason:trainerMood.reason,trainer_patience:evidence.trainer_patience,
    owner_patience:evidence.owner_patience,
    relationship_strength:evidence.working_relationship_strength,
    no_automatic_employment_change:true});
  const playerControlled=state.player.role==='owner'&&owner===state.player.operation_id;
  const choice=playerControlled?
   {mandate:old,reason:'PLAYER_OWNER_RETAINS_DIRECTION'}:
   selectOwnerTrainerMandate(evidence,old,evidence.owner_cash_minor);
  if(!playerControlled&&choice.mandate!==old){
   item.mandate=choice.mandate;item.authority='AI_OWNER_CAREER_REVIEW';
   rt.totals.ai_mandate_changes++;
  }
  if(evidence.starts<3)rt.totals.evidence_insufficient++;
  item.evidence=evidence;item.reason=choice.reason;
  item.last_review_date=today;item.next_review_date=plus(today,28);
  item.review_count++;
  item.history.push({date:today,mandate:item.mandate,previous:old,
   reason:choice.reason,starts:evidence.starts,
   win_rate:evidence.win_rate,average_relative_form:evidence.average_relative_form,
   trainer_starts:evidence.trainer_multi_client_starts,
   decision_form:evidence.decision_form,decision_sample_basis:evidence.decision_sample_basis,
   unfunded_horse_days:evidence.unfunded_horse_days,
   owner_patience:evidence.owner_patience,
   trainer_patience:evidence.trainer_patience,
   working_relationship_strength:evidence.working_relationship_strength,
   trainer_position:item.trainer_position});
  if(item.history.length>8)item.history.splice(0,item.history.length-8);
  rt.totals.scheduled_reviews++;
  emit('OWNER_TRAINER_CAREER_REVIEW',{owner_id:owner,trainer_id:trainer,
   reviewed_date:today,previous:old,mandate:item.mandate,
   reason:choice.reason,starts:evidence.starts,wins:evidence.wins,
   average_relative_form:evidence.average_relative_form,
   trainer_multi_client_starts:evidence.trainer_multi_client_starts,
   decision_form:evidence.decision_form,
   sample_basis:evidence.decision_sample_basis,
   owner_trust:evidence.owner_trust,
   owner_patience:evidence.owner_patience,
   trainer_patience:evidence.trainer_patience,
   relationship_strength:evidence.working_relationship_strength,
   trainer_position:item.trainer_position,
   relationship_friction:evidence.relationship_friction,
   care_spend_minor:evidence.care_expense_minor,
   owner_purse_minor:evidence.owner_purse_minor,
   funding_days_missing:evidence.unfunded_horse_days,
   player_terms_auto_changed:false});
  // Only a newly reviewed, materially strained partnership generates an
  // actionable conversation. One pending request per real owner/trainer pair.
  if(['PRESSING_FOR_CHANGE','CONSIDERING_DEPARTURE'].includes(trainerMood.position)&&
   item.concern?.status!=='OPEN'&&!recentConcern(item,today)){
   const request_id=concernKey(owner,trainer,today);
   item.concern={request_id,opened_on:today,deadline:plus(today,14),
    status:'OPEN',reason:trainerMood.reason,
    trainer_position:trainerMood.position,resolved_on:null,
    response:null,responder:null,outcome_reason:null};
   rt.totals.concerns_opened=(rt.totals.concerns_opened??0)+1;
   emit('TRAINER_CONCERN_OPENED',{owner_id:owner,trainer_id:trainer,
    request_id,deadline:item.concern.deadline,
    trainer_position:trainerMood.position,reason:trainerMood.reason,
    player_response_required:playerControlled});
   if(!playerControlled){
    const cooperative=evidence.owner_cash_minor>0&&
     evidence.unfunded_horse_days===0&&
     (evidence.owner_patience>=.45||evidence.working_relationship_strength>=.48);
    resolveConcern({state,item,owner,trainer,
     choice:cooperative?'HEAR_AND_REVIEW':'HOLD_CURRENT_COURSE',
     actor:'system',evidence,emit});
   }
  }
 }
 // A career-form snapshot is calculated from the trainer's ENTIRE actual
 // stable, across owners, not a single wealthy client's favorable record.
 const trainerIds=[...new Set(pairs(state).map(([,p])=>p.trainer))].sort();
 for(const id of trainerIds){
  const prior=state.runtime.people[id]||{};
  const hasFresh=Object.values(rt.by_pair).some(p=>p.trainer_id===id&&
   p.last_review_date===today);
  if(!hasFresh)continue;
  const sample=sampleResults(state,null,id,today,56);
  const scores=sample.map(x=>{
   const horse=state.runtime.registered_horses.by_id[x.horse_id];
   return 1-(x.finish-1)/Math.max(1,x.field_size-1)-
    (.2+.6*(horse?.starting_attributes?.current_ability??55)/99);
  });
  const form=sample.length?round(scores.reduce((n,v)=>n+v,0)/sample.length):null;
  state.runtime.people[id]={...prior,game_career_form:{
   as_of:today,window_days:56,starts:sample.length,
   wins:sample.filter(x=>x.finish===1).length,
   owners_served:new Set(sample.map(x=>x.owner_id)).size,
   average_relative_form:form,
   gross_purse_minor:sample.reduce((n,x)=>n+x.earnings_minor,0),
   provenance:'MODELED_1999_GAME_RESULTS_NOT_HISTORICAL_PROFESSIONAL_RATING'}};
  rt.totals.trainer_form_updates++;
 }
 rt.last_day=today;
}
export function getOwnerTrainerMandate(state,owner,trainer){
 return state.runtime.owner_trainer_reviews?.by_pair?.[pair(owner,trainer)]?.mandate||'NORMAL';
}
export function getOwnerTrainerCareerReview(state,world,owner,trainer){
 authorizedPair(state,world,owner,trainer);
 const saved=state.runtime.owner_trainer_reviews?.by_pair?.[pair(owner,trainer)]||null;
 const live=ownerTrainerLiveAssessment(state,world,owner,trainer);
 return structuredClone({schema:OWNER_TRAINER_REVIEW_SCHEMA,
  mandate:saved?.mandate||'NORMAL',authority:saved?.authority||'INITIAL_PENDING',
  next_review_date:saved?.next_review_date||null,
  last_review_date:saved?.last_review_date||null,reason:saved?.reason||null,
  reviews:saved?.history||[],
  trainer_position:live.trainer_position,
  trainer_position_reason:live.trainer_position_reason,
  last_formal_trainer_position:saved?.trainer_position||'COMMITTED',
  live_assessment:live,
  live_history:saved?.live_history||[],
  pending_concern:saved?.concern?.status==='OPEN'?saved.concern:null,
  latest_concern:saved?.concern||null,
  concern_history:saved?.conversation_history||[],
  current_evidence:ownerTrainerEvidence(state,world,owner,trainer),
  last_evaluation:saved?.evidence||null});
}
export function getTrainerCareerForm(state,trainer){
 const value=state.runtime.people?.[trainer]?.game_career_form;
 return value?structuredClone(value):null;
}
export function validateOwnerTrainerReviews(state,world){
 const rt=state.runtime.owner_trainer_reviews;
 if(rt===undefined)return; // Legacy saves remain legal until their next day.
 ensure(isObject(rt)&&rt.schema===OWNER_TRAINER_REVIEW_SCHEMA&&
  isObject(rt.by_pair)&&isObject(rt.totals)&&
  (rt.last_day===null||validDate(rt.last_day)&&rt.last_day<=state.clock.date),
  'TRAINER_REVIEW_SAVE','Invalid owner/trainer career-review store');
 for(const v of Object.values(rt.totals))
  ensure(Number.isSafeInteger(v)&&v>=0,'TRAINER_REVIEW_SAVE','Invalid review counter');
 for(const [id,p] of Object.entries(rt.by_pair)){
  ensure(isObject(p)&&id===pair(p.owner_id,p.trainer_id)&&
   Boolean(worldIdentity(world,'organizations',p.owner_id))&&
   Boolean(worldIdentity(world,'people',p.trainer_id))&&
   OWNER_TRAINER_MANDATES.includes(p.mandate)&&
   ['AI_AUTONOMOUS_INITIAL','AI_OWNER_CAREER_REVIEW','PLAYER_OWNER_COMMAND'].
    includes(p.authority)&&
   validDate(p.next_review_date)&&
   (p.last_review_date===null||validDate(p.last_review_date)&&
    p.last_review_date<=state.clock.date)&&
   Number.isSafeInteger(p.review_count)&&p.review_count>=0&&
   typeof p.reason==='string'&&
   (p.trainer_position===undefined||
    ['COMMITTED','FRUSTRATED','PRESSING_FOR_CHANGE','CONSIDERING_DEPARTURE'].
    includes(p.trainer_position))&&
   (p.trainer_position_reason===undefined||typeof p.trainer_position_reason==='string')&&
   (p.live_assessment===undefined||isObject(p.live_assessment)&&
    validDate(p.live_assessment.date)&&p.live_assessment.date<=state.clock.date&&
    p.live_assessment.owner_id===p.owner_id&&
    p.live_assessment.trainer_id===p.trainer_id&&
    Number.isFinite(p.live_assessment.owner_confidence)&&
    p.live_assessment.owner_confidence>=0&&p.live_assessment.owner_confidence<=1&&
    ['CONFIDENT','STEADY','WATCHFUL','ALARMED'].includes(p.live_assessment.owner_outlook)&&
    ['COMMITTED','FRUSTRATED','PRESSING_FOR_CHANGE','CONSIDERING_DEPARTURE'].
     includes(p.live_assessment.trainer_position))&&
   (p.live_history===undefined||Array.isArray(p.live_history)&&
    p.live_history.length<=14&&p.live_history.every(x=>
     isObject(x)&&validDate(x.date)&&x.date<=state.clock.date&&
     Number.isFinite(x.owner_confidence)&&
     x.owner_confidence>=0&&x.owner_confidence<=1))&&
   (p.concern===undefined||isObject(p.concern)&&
    p.concern.request_id===concernKey(p.owner_id,p.trainer_id,p.concern.opened_on)&&
    validDate(p.concern.opened_on)&&p.concern.opened_on<=state.clock.date&&
    validDate(p.concern.deadline)&&p.concern.deadline>=p.concern.opened_on&&
    ['OPEN','RESOLVED','EXPIRED'].includes(p.concern.status)&&
    typeof p.concern.reason==='string'&&
    ['PRESSING_FOR_CHANGE','CONSIDERING_DEPARTURE'].includes(p.concern.trainer_position)&&
    (p.concern.status==='OPEN'?
     p.concern.resolved_on===null&&p.concern.response===null:
     validDate(p.concern.resolved_on)&&p.concern.resolved_on<=state.clock.date&&
     (p.concern.status==='EXPIRED'||TRAINER_CONCERN_RESPONSES.includes(p.concern.response))))&&
   (p.conversation_history===undefined||Array.isArray(p.conversation_history)&&
    p.conversation_history.length<=8&&p.conversation_history.every(h=>
     isObject(h)&&typeof h.request_id==='string'&&
     validDate(h.opened_on)&&validDate(h.closed_on)&&
     h.closed_on<=state.clock.date&&
     ['RESOLVED','EXPIRED'].includes(h.status)&&
     Number.isFinite(h.trainer_support_before)&&
     h.trainer_support_before>=0&&h.trainer_support_before<=1&&
     Number.isFinite(h.trainer_support_after)&&
     h.trainer_support_after>=0&&h.trainer_support_after<=1))&&
   Array.isArray(p.history)&&p.history.length<=8&&
   p.history.every(h=>isObject(h)&&validDate(h.date)&&h.date<=state.clock.date&&
    OWNER_TRAINER_MANDATES.includes(h.mandate)&&
    typeof h.reason==='string'&&Number.isSafeInteger(h.starts)&&h.starts>=0)&&
   (p.evidence===null||isObject(p.evidence)&&p.evidence.owner_id===p.owner_id&&
    p.evidence.trainer_id===p.trainer_id&&validDate(p.evidence.date)),
   'TRAINER_REVIEW_SAVE','Owner/trainer career review has invalid identity or history');
 }
 for(const [id,person] of Object.entries(state.runtime.people||{})){
  const f=person.game_career_form;
  if(!f)continue;
  ensure(Boolean(worldIdentity(world,'people',id))&&isObject(f)&&
   validDate(f.as_of)&&f.as_of<=state.clock.date&&
   Number.isSafeInteger(f.starts)&&f.starts>=0&&
   Number.isSafeInteger(f.wins)&&f.wins>=0&&f.wins<=f.starts&&
   (f.average_relative_form===null||
    Number.isFinite(f.average_relative_form)&&
    f.average_relative_form>=-1&&f.average_relative_form<=1)&&
   f.provenance==='MODELED_1999_GAME_RESULTS_NOT_HISTORICAL_PROFESSIONAL_RATING',
   'TRAINER_REVIEW_SAVE','Invalid game-derived trainer career form');
 }
}
