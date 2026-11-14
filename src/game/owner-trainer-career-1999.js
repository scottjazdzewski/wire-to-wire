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
export const OWNER_TRAINER_REVIEW_COMMANDS=Object.freeze(['SET_OWNER_TRAINER_MANDATE']);
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
  evidence_insufficient:0,trainer_form_updates:0}
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
/** Called every real game day, BEFORE owner funding and contract renewal.
 * One 28-day decision per pair, persisted with evidence and exact reasons. */
export function advanceOwnerTrainerReviews({state,world,emit}){
 const rt=root(state),today=state.clock.date;
 if(rt.last_day===today)return;
 for(const [id,{owner,trainer}] of pairs(state)){
  authorizedPair(state,world,owner,trainer);
  const item=initialize(state,owner,trainer);
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
 return structuredClone({schema:OWNER_TRAINER_REVIEW_SCHEMA,
  mandate:saved?.mandate||'NORMAL',authority:saved?.authority||'INITIAL_PENDING',
  next_review_date:saved?.next_review_date||null,
  last_review_date:saved?.last_review_date||null,reason:saved?.reason||null,
  reviews:saved?.history||[],
  trainer_position:saved?.trainer_position||'COMMITTED',
  trainer_position_reason:saved?.trainer_position_reason||'INITIAL_RELATIONSHIP',
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
