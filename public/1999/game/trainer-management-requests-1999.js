/**
 * Wire to Wire 1999: event-sourced trainer management negotiations.
 *
 * One canonical save, one actual game clock, actual settled races and
 * ledger-backed horse care/contract commands. No invented injuries, wages,
 * cash credits, changes to source people, or automatic personnel firing.
 */
import {ensure,isObject,validDate,worldIdentity} from './contracts.js';
import {setHorseCarePolicy} from './horse-care.js';
import {trainerContractQuote,offerTrainerServiceTerms} from './trainer-contracts-1999.js';
import {workingRelationshipProfile} from './working-relationship-1999.js';

export const TRAINER_MANAGEMENT_SCHEMA='WTW_1999_TRAINER_MANAGEMENT_REQUESTS_V1';
export const TRAINER_MANAGEMENT_COMMANDS=Object.freeze(['ANSWER_TRAINER_MANAGEMENT_REQUEST']);
export const TRAINER_MANAGEMENT_CHOICES=Object.freeze(['ACCEPT','COUNTER','DECLINE']);
export const TRAINER_MANAGEMENT_KINDS=Object.freeze([
 'CARE_FUNDING','POST_RACE_RECOVERY','CONTRACT_TERMS']);
const pair=(o,t)=>o+'|'+t;
const rounded=x=>Math.round(Math.max(0,Math.min(1,x))*10000)/10000;
const plus=(d,n)=>new Date(Date.parse(d+'T12:00:00Z')+86400000*n).toISOString().slice(0,10);
const ago=(d,n)=>plus(d,-n);
const money=x=>Number.isSafeInteger(x)&&x>=0;
const horses=s=>Object.values(s.runtime.registered_horses?.by_id||{}).
 filter(h=>Boolean(h.starting_attributes)).sort((a,b)=>a.horse_id.localeCompare(b.horse_id));

export const createTrainerManagementRuntime=()=>({
 schema:TRAINER_MANAGEMENT_SCHEMA,by_pair:{},training_orders:{},last_prepared:null,
 totals:{opened:0,player_answers:0,ai_answers:0,expired:0,
  care_authorizations:0,recovery_orders:0,contract_offers:0}
});
const root=s=>s.runtime.trainer_management_requests??=
 createTrainerManagementRuntime();
function ownerPair(s,o,t){
 return horses(s).some(h=>h.owner_organization_id===o&&h.trainer_id===t);
}
function record(s,o,t){
 const rt=root(s),k=pair(o,t);
 return rt.by_pair[k]??=( {owner_id:o,trainer_id:t,active:null,history:[],last_opened:null} );
}
function cash(s,o){const value=s.runtime.finances?.operation_balances_minor?.[o];return money(value)?value:0}
function requestId(o,t,d,kind,h){return [o,t,d,kind,h].join(':')}
function validEvent(s,event,horse){
 const details=event?.details;
 if(!horse||!details||event.date!==s.clock.date)return false;
 if(event.kind==='HORSE_CARE_UNFUNDED')
  return details.horse_id===horse.horse_id&&details.owner_id===horse.owner_organization_id&&
   details.barn_operational===true&&money(details.needed_minor)&&details.needed_minor>0&&
   s.runtime.horse?.[horse.horse_id]?.history?.at(-1)?.unfunded===true;
 if(event.kind==='POST_RACE_PROFESSIONAL_FEEDBACK'){
  const race=s.runtime.races?.[details.race_id];
  return details.horse_id===horse.horse_id&&details.owner_id===horse.owner_organization_id&&
   details.trainer_id===horse.trainer_id&&
   ['BELOW_FORM_EXPECTATIONS','EXCEEDED_FORM_EXPECTATIONS'].includes(details.reason)&&
   race?.status==='OFFICIAL_SIM_RESULT'&&race.settled_date===s.clock.date&&
   race.results?.some(row=>row.horse_id===horse.horse_id&&row.finish===details.finish);
 }
 return false;
}
function candidate(s,world,event,horse){
 const d=event.details;
 if(event.kind==='HORSE_CARE_UNFUNDED')
  return {kind:'CARE_FUNDING',reason:'DOCUMENTED_UNFUNDED_BARN_CARE',
   needed_minor:d.needed_minor,race_id:null};
 if(d.reason==='BELOW_FORM_EXPECTATIONS')
  return {kind:'POST_RACE_RECOVERY',reason:'RESULT_BELOW_HORSE_EXPECTATIONS',
   needed_minor:null,race_id:d.race_id};
 if(d.reason==='EXCEEDED_FORM_EXPECTATIONS'){
  const trainer=s.runtime.people?.[horse.trainer_id]?.game_race_record;
  if((trainer?.starts??0)<3)return null;
  const quote=trainerContractQuote(s,world,horse.owner_organization_id,horse.trainer_id);
  if(quote.next_terms||quote.minimum_acceptable_minor<=quote.current_daily_fee_minor)return null;
  return {kind:'CONTRACT_TERMS',reason:'TRAINER_RESULTS_AND_MARKET_FEE_LEVERAGE',
   needed_minor:null,race_id:d.race_id};
 }
 return null;
}
function offer(s,world,horse,info,event,emit){
 const o=horse.owner_organization_id,t=horse.trainer_id;
 const row=record(s,o,t),now=s.clock.date,rt=root(s);
 // A single pending request per genuine partnership and a 14-day cooldown
 // stop the daily event stream from turning into constant popup spam.
 if(row.active?.status==='OPEN'||row.last_opened&&row.last_opened>ago(now,14))return;
 const request={
  id:requestId(o,t,now,info.kind,horse.horse_id),
  owner_id:o,trainer_id:t,horse_id:horse.horse_id,kind:info.kind,
  reason:info.reason,source_event_seq:event.seq,
  source_event_kind:event.kind,race_id:info.race_id,
  needed_minor:info.needed_minor,opened_on:now,deadline:plus(now,7),
  status:'OPEN',response:null,responder:null,resolved_on:null,
  outcome:null
 };
 row.active=request;row.last_opened=now;rt.totals.opened++;
 emit('TRAINER_MANAGEMENT_REQUEST_OPENED',{
  request_id:request.id,owner_id:o,trainer_id:t,horse_id:horse.horse_id,
  kind:request.kind,reason:request.reason,deadline:request.deadline,
  source_event_seq:request.source_event_seq,race_id:request.race_id,
  requested_care_minor:request.needed_minor,
  player_response_required:s.player.role==='owner'&&s.player.operation_id===o});
 if(s.player.role==='owner'&&s.player.operation_id===o)return;
 const strength=workingRelationshipProfile(s,o,t);
 let choice='DECLINE';
 if(request.kind==='CARE_FUNDING'){
  if(cash(s,o)>=request.needed_minor*7&&strength.owner_patience>=.35)choice='ACCEPT';
  else if(cash(s,o)>=request.needed_minor*3)choice='COUNTER';
 }else if(request.kind==='POST_RACE_RECOVERY'){
  choice=(s.runtime.horse?.[horse.horse_id]?.training?.currentRisk??0)>.62?
   'ACCEPT':'COUNTER';
 }else{
  const quote=trainerContractQuote(s,world,o,t);
  if(cash(s,o)>=quote.minimum_acceptable_minor*quote.horse_count*7)
   choice=strength.owner_patience>.5?'ACCEPT':'COUNTER';
 }
 resolve({state:s,world,request,choice,actor:'system',emit});
}
function changeCare(s,h,policy,actor,emit){
 setHorseCarePolicy({state:s,world:null,command:{
  type:'SET_HORSE_CARE_POLICY',actor,payload:{horse_id:h.horse_id,policy}
 },emit});
}
function resolve({state:s,world,request:r,choice,actor,emit}){
 ensure(r.status==='OPEN'&&r.deadline>=s.clock.date,
  'MANAGEMENT_REQUEST_CLOSED','Management request has closed');
 const h=s.runtime.registered_horses?.by_id?.[r.horse_id];
 ensure(h&&h.owner_organization_id===r.owner_id&&h.trainer_id===r.trainer_id,
  'MANAGEMENT_REQUEST_PAIR','The horse must still belong to the request owner/trainer');
 const rt=root(s),row=record(s,r.owner_id,r.trainer_id);
 let outcome='OWNER_DECLINED_REQUEST',paid=false;
 if(choice!=='DECLINE'){
  if(r.kind==='CARE_FUNDING'){
   const current=s.runtime.horse?.[h.horse_id];
   ensure(current?.policy,'MANAGEMENT_CARE','Current horse care policy unavailable');
   const estimated=r.needed_minor+(choice==='ACCEPT'&&current.policy.care==='BASIC'?1000:0);
   const days=choice==='ACCEPT'?7:3;
   ensure(money(estimated)&&estimated>0&&cash(s,r.owner_id)>=estimated*days,
    'MANAGEMENT_FUNDS','Available owner cash cannot support the proposed care days');
   const policy={...current.policy,
    care:choice==='ACCEPT'?'PROACTIVE':current.policy.care,
    monthly_budget_minor:Math.max(current.policy.monthly_budget_minor,
     current.finance.spent_minor+estimated*(choice==='ACCEPT'?10:3))};
   changeCare(s,h,policy,actor,emit);
   rt.totals.care_authorizations++;
   outcome=choice==='ACCEPT'?'CARE_BUDGET_AND_SUPERVISION_AUTHORIZED':
    'LIMITED_CARE_BUDGET_AUTHORIZED';
  }else if(r.kind==='POST_RACE_RECOVERY'){
   const current=s.runtime.horse?.[h.horse_id];
   ensure(current?.policy,'MANAGEMENT_RECOVERY','Current horse policy unavailable');
   ensure(!rt.training_orders[h.horse_id],
    'MANAGEMENT_RECOVERY_PENDING','Another agreed temporary workout is active');
   const before={...current.policy},plan=choice==='ACCEPT'?'REST':'LIGHT';
   changeCare(s,h,{...before,training_plan:plan},actor,emit);
   const changed=s.event_log.at(-1);
   ensure(changed?.kind==='HORSE_CARE_POLICY_CHANGED',
    'MANAGEMENT_RECOVERY_EVENT','Temporary training order must be journaled');
   rt.training_orders[h.horse_id]={
    horse_id:h.horse_id,owner_id:r.owner_id,trainer_id:r.trainer_id,
    request_id:r.id,training_plan:plan,previous_plan:before.training_plan,
    source_policy:before.source??'MODELED_GAMEPLAY_DEFAULT',
    applied_event_seq:changed.seq,started_on:s.clock.date,
    expires_on:plus(s.clock.date,choice==='ACCEPT'?6:5)};
   rt.totals.recovery_orders++;
   outcome=choice==='ACCEPT'?'TEMPORARY_REST_ACCEPTED':
    'LIGHT_REBUILD_COMPROMISE';
  }else{
   const q=trainerContractQuote(s,world,r.owner_id,r.trainer_id);
   ensure(!q.next_terms,'MANAGEMENT_CONTRACT_PENDING','Trainer already has pending signed terms');
   const amount=choice==='ACCEPT'?Math.min(25000,
    Math.max(q.minimum_acceptable_minor,Math.round(q.minimum_acceptable_minor*1.03))):
    q.minimum_acceptable_minor;
   ensure(amount>=3000&&amount<=25000,
    'MANAGEMENT_CONTRACT_LIMIT','Trainer quote exceeds supported modeled agreement limits');
   const result=offerTrainerServiceTerms({state:s,world,command:{
    type:'OFFER_TRAINER_SERVICE_TERMS',actor,
    payload:{owner_id:r.owner_id,trainer_id:r.trainer_id,daily_fee_minor:amount}
   },emit});
   ensure(result.accepted,'MANAGEMENT_CONTRACT_DECLINED',
    'Trainer did not accept the modeled contract offer');
   rt.totals.contract_offers++;
   outcome=choice==='ACCEPT'?'TRAINER_SERVICE_PREMIUM_OFFER_ACCEPTED':
    'TRAINER_SERVICE_MARKET_COUNTER_ACCEPTED';
  }
 }
 // A genuine operational concession earns limited trust; merely talking
 // cannot fund care, pay a trainer, cure welfare risk or transfer horses.
 const relation=s.runtime.agents?.relationships?.[pair(r.owner_id,r.trainer_id)];
 const before=relation?.trainer_support??null;
 if(relation)relation.trainer_support=rounded(relation.trainer_support+
  (choice==='ACCEPT'?.028:choice==='COUNTER'?.011:-.024));
 r.status='RESOLVED';r.response=choice;r.responder=actor;
 r.resolved_on=s.clock.date;r.outcome=outcome;
 row.history.push({...r,trainer_support_before:before,
  trainer_support_after:relation?.trainer_support??null});
 if(row.history.length>12)row.history.shift();
 row.active=null;
 rt.totals[actor==='player'?'player_answers':'ai_answers']++;
 emit('TRAINER_MANAGEMENT_REQUEST_RESOLVED',{
  request_id:r.id,owner_id:r.owner_id,trainer_id:r.trainer_id,horse_id:r.horse_id,
  kind:r.kind,choice,by:actor,outcome,
  trainer_support_before:before,trainer_support_after:relation?.trainer_support??null,
  money_posted:paid,employment_changed:false});
}
export function answerTrainerManagementRequest({state,world,command,emit}){
 const p=command.payload;
 ensure(isObject(p)&&TRAINER_MANAGEMENT_CHOICES.includes(p.choice)&&
  typeof p.request_id==='string'&&typeof p.owner_id==='string'&&
  typeof p.trainer_id==='string',
  'MANAGEMENT_CHOICE','Valid request ID, owner/trainer IDs and decision required');
 ensure(command.actor==='player'&&state.player.role==='owner'&&
  state.player.operation_id===p.owner_id,
  'MANAGEMENT_PERMISSION','Only the owning player may answer trainer management requests');
 ensure(Boolean(worldIdentity(world,'organizations',p.owner_id))&&
  Boolean(worldIdentity(world,'people',p.trainer_id))&&
  ownerPair(state,p.owner_id,p.trainer_id),
  'MANAGEMENT_PAIR','Request must refer to an active real owner/trainer partnership');
 const r=root(state).by_pair[pair(p.owner_id,p.trainer_id)]?.active;
 ensure(r?.id===p.request_id,'MANAGEMENT_REQUEST_UNKNOWN','Exact open request ID is required');
 resolve({state,world,request:r,choice:p.choice,actor:'player',emit});
}
/** Pending requests expire only on real game days; a valid earlier response
 * cannot be replayed as a second expenditure or another policy change. */
export function prepareTrainerManagementDay({state:s,emit}){
 const rt=root(s),now=s.clock.date;
 if(rt.last_prepared===now)return;
 for(const row of Object.values(rt.by_pair)){
  const r=row.active;
  if(r?.status!=='OPEN'||r.deadline>=now)continue;
  const rel=s.runtime.agents?.relationships?.[pair(r.owner_id,r.trainer_id)];
  const before=rel?.trainer_support??null;
  if(rel)rel.trainer_support=rounded(rel.trainer_support-.018);
  r.status='EXPIRED';r.resolved_on=now;r.outcome='OWNER_DID_NOT_ANSWER';
  row.history.push({...r,trainer_support_before:before,
   trainer_support_after:rel?.trainer_support??null});
  if(row.history.length>12)row.history.shift();
  row.active=null;rt.totals.expired++;
  emit('TRAINER_MANAGEMENT_REQUEST_EXPIRED',{
   request_id:r.id,owner_id:r.owner_id,trainer_id:r.trainer_id,
   horse_id:r.horse_id,reason:r.outcome,employment_changed:false});
 }
 for(const [id,order] of Object.entries(rt.training_orders)){
  if(order.expires_on>now)continue;
  const h=s.runtime.registered_horses?.by_id?.[id];
  const policy=s.runtime.horse?.[id]?.policy;
  const later=s.event_log.some(e=>e.seq>order.applied_event_seq&&
   e.kind==='HORSE_CARE_POLICY_CHANGED'&&e.details?.horse_id===id);
  if(h&&h.owner_organization_id===order.owner_id&&
    h.trainer_id===order.trainer_id&&policy?.training_plan===order.training_plan&&
    !later){
   const actor=s.player.role==='owner'&&s.player.operation_id===order.owner_id?
    'player':'system';
   changeCare(s,h,{...policy,training_plan:order.previous_plan},actor,emit);
   emit('TRAINER_TEMPORARY_WORKOUT_RESTORED',{
    request_id:order.request_id,horse_id:id,training_plan:order.previous_plan,
    reason:'AGREED_TEMPORARY_WORKOUT_ENDED'});
  }else{
   emit('TRAINER_TEMPORARY_WORKOUT_SUPERSEDED',{
    request_id:order.request_id,horse_id:id,
    reason:'LATER_OWNER_OR_TRAINER_POLICY_TAKES_PRIORITY'});
  }
  delete rt.training_orders[id];
 }
 rt.last_prepared=now;
}
/** Inspects only actual in-command game events after the day's settlement.
 * A customer cannot submit invented injuries/results as decision triggers. */
export function reactToTrainerEvents({state:s,world,events,emit}){
 if(s.clock.days_elapsed===0)return;
 const rt=root(s);
 const current=[...events].filter(e=>[
  'HORSE_CARE_UNFUNDED','POST_RACE_PROFESSIONAL_FEEDBACK'].includes(e.kind)).
  sort((a,b)=>a.seq-b.seq);
 if(!current.length)return;
 const byId=new Map(horses(s).map(h=>[h.horse_id,h]));
 const selected=new Set();
 for(const e of current){
  const h=byId.get(e.details?.horse_id);
  if(!validEvent(s,e,h))continue;
  const k=pair(h.owner_organization_id,h.trainer_id);
  if(selected.has(k))continue;
  const info=candidate(s,world,e,h);
  if(!info)continue;
  selected.add(k);
  offer(s,world,h,info,e,emit);
 }
}
/** Exact read-only requests for the owner/management surface; no game action. */
export function getTrainerManagementRequests(state,ownerId=null){
 const rt=state.runtime.trainer_management_requests;
 const rows=Object.values(rt?.by_pair||{}).
  filter(x=>ownerId===null||x.owner_id===ownerId);
 return structuredClone({
  schema:TRAINER_MANAGEMENT_SCHEMA,
  pending:rows.flatMap(x=>x.active?.status==='OPEN'?[x.active]:[]),
  recent:rows.flatMap(x=>x.history).sort((a,b)=>
   b.resolved_on.localeCompare(a.resolved_on)||a.id.localeCompare(b.id)).slice(0,24),
  training_orders:Object.values(rt?.training_orders||{}).
   filter(x=>ownerId===null||x.owner_id===ownerId),
  totals:rt?.totals??createTrainerManagementRuntime().totals
 });
}
export function validateTrainerManagementRequests(state,world){
 const rt=state.runtime.trainer_management_requests;
 if(rt===undefined)return; // Older serialized careers remain valid.
 ensure(isObject(rt)&&rt.schema===TRAINER_MANAGEMENT_SCHEMA&&
  isObject(rt.by_pair)&&isObject(rt.training_orders)&&isObject(rt.totals)&&
  (rt.last_prepared===null||validDate(rt.last_prepared)&&rt.last_prepared<=state.clock.date),
  'MANAGEMENT_SAVE','Malformed trainer management request store');
 for(const n of Object.values(rt.totals))
  ensure(money(n),'MANAGEMENT_SAVE','Invalid management counter');
 const eventsBySeq=new Map((state.event_log||[]).map(e=>[e.seq,e]));
 const sourceEventValid=(r,o,t)=>{
  const event=eventsBySeq.get(r.source_event_seq),details=event?.details;
  if(event)return event.kind===r.source_event_kind&&event.date===r.opened_on&&
   details?.horse_id===r.horse_id&&details?.owner_id===o&&
   (r.source_event_kind==='HORSE_CARE_UNFUNDED'||details?.trainer_id===t)&&
   (r.race_id===null||details?.race_id===r.race_id);
  if(r.source_event_kind!=='HORSE_CARE_UNFUNDED'||r.race_id!==null)return false;
  const summary=(state.event_log||[]).find(e=>e.kind==='DAILY_SIMULATION_SUMMARY'&&
   e.date===r.opened_on&&e.seq>r.source_event_seq&&
   e.details?.counts?.HORSE_CARE_UNFUNDED>0);
  const horse=state.runtime.registered_horses?.by_id?.[r.horse_id];
  const unpaid=state.runtime.horse?.[r.horse_id]?.history?.some(row=>
   row.date===r.opened_on&&row.unfunded===true);
  return Boolean(summary&&horse?.owner_organization_id===o&&
   horse?.trainer_id===t&&unpaid);
 };
 const validRequest=(r,o,t,closed=false)=>isObject(r)&&
  r.id===requestId(o,t,r.opened_on,r.kind,r.horse_id)&&
  r.owner_id===o&&r.trainer_id===t&&
  TRAINER_MANAGEMENT_KINDS.includes(r.kind)&&
  Boolean(state.runtime.registered_horses?.by_id?.[r.horse_id])&&
  typeof r.reason==='string'&&r.reason.length<150&&
  ['HORSE_CARE_UNFUNDED','POST_RACE_PROFESSIONAL_FEEDBACK'].includes(r.source_event_kind)&&
  Number.isSafeInteger(r.source_event_seq)&&r.source_event_seq>0&&
  sourceEventValid(r,o,t)&&
  (r.race_id===null||typeof r.race_id==='string')&&
  (r.needed_minor===null||money(r.needed_minor))&&
  validDate(r.opened_on)&&r.opened_on<=state.clock.date&&
  validDate(r.deadline)&&r.deadline===plus(r.opened_on,7)&&
  (closed?['RESOLVED','EXPIRED'].includes(r.status)&&validDate(r.resolved_on)&&
   r.resolved_on<=state.clock.date:
   r.status==='OPEN'&&r.response===null&&r.resolved_on===null)&&
  (r.response===null||TRAINER_MANAGEMENT_CHOICES.includes(r.response));
 const requestProblems=(r,o,t,closed=false)=>{
  if(!isObject(r))return ['request-object'];
  const failed=[];
  const horse=state.runtime.registered_horses?.by_id?.[r.horse_id];
  const checks=[
   ['identity',r.id===requestId(o,t,r.opened_on,r.kind,r.horse_id)],
   ['owner',r.owner_id===o],['trainer',r.trainer_id===t],
   ['kind',TRAINER_MANAGEMENT_KINDS.includes(r.kind)],
   ['horse',Boolean(horse)],
   ['reason',typeof r.reason==='string'&&r.reason.length<150],
   ['source-kind',['HORSE_CARE_UNFUNDED','POST_RACE_PROFESSIONAL_FEEDBACK'].includes(r.source_event_kind)],
   ['source-seq',Number.isSafeInteger(r.source_event_seq)&&r.source_event_seq>0],
   ['source-event',sourceEventValid(r,o,t)],
   ['race-id',r.race_id===null||typeof r.race_id==='string'],
   ['needed',r.needed_minor===null||money(r.needed_minor)],
   ['opened-on',validDate(r.opened_on)&&r.opened_on<=state.clock.date],
   ['deadline',validDate(r.deadline)&&r.deadline===plus(r.opened_on,7)],
   ['status',closed?
    ['RESOLVED','EXPIRED'].includes(r.status)&&validDate(r.resolved_on)&&r.resolved_on<=state.clock.date:
    r.status==='OPEN'&&r.response===null&&r.resolved_on===null],
   ['response',r.response===null||TRAINER_MANAGEMENT_CHOICES.includes(r.response)]
  ];
  for(const [name,ok] of checks)if(!ok)failed.push(name);
  return failed;
 };
 for(const [id,row] of Object.entries(rt.by_pair)){
  const failed=[];
  if(!isObject(row))failed.push('row-object');
  else{
   if(id!==pair(row.owner_id,row.trainer_id))failed.push('pair-key');
   if(!worldIdentity(world,'organizations',row.owner_id))failed.push('owner-organization');
   if(!worldIdentity(world,'people',row.trainer_id))failed.push('trainer-person');
   if(!(row.last_opened===null||validDate(row.last_opened)&&row.last_opened<=state.clock.date))
    failed.push('last-opened');
   if(!Array.isArray(row.history))failed.push('history-array');
   else{
    if(row.history.length>12)failed.push('history-cap');
    row.history.forEach((r,index)=>{
     const problems=requestProblems(r,row.owner_id,row.trainer_id,true);
     if(problems.length)failed.push(`history[${index}]:${problems.join(',')}`);
    });
   }
   if(row.active!==null){
    const problems=requestProblems(row.active,row.owner_id,row.trainer_id,false);
    if(problems.length)failed.push(`active:${problems.join(',')}`);
   }
  }
  ensure(failed.length===0,'MANAGEMENT_SAVE',
   `Invalid request identity, action state or history; pair=${id}; failed=${failed.slice(0,8).join('|')}`);
 }
 for(const [id,o] of Object.entries(rt.training_orders)){
  const h=state.runtime.registered_horses?.by_id?.[id];
  ensure(isObject(o)&&o.horse_id===id&&Boolean(h)&&
   o.owner_id===h.owner_organization_id&&o.trainer_id===h.trainer_id&&
   typeof o.request_id==='string'&&
   ['REST','LIGHT'].includes(o.training_plan)&&
   typeof o.previous_plan==='string'&&
   Number.isSafeInteger(o.applied_event_seq)&&o.applied_event_seq>0&&
   validDate(o.started_on)&&validDate(o.expires_on)&&
   o.started_on<=state.clock.date&&o.expires_on>o.started_on&&
   o.expires_on<=plus(o.started_on,6),
   'MANAGEMENT_SAVE','Invalid temporary workout obligation');
 }
}
