/**
 * WTW simulation FOUNDATION: canonical game clock, validated decision choices,
 * scheduled event delivery and sequenced event journal.
 * Registered-horse care now uses the existing training simulator, funded by
 * the single operation ledger. Race entry and actual result settlement remain future.
 */
import {
  ensure, isObject, requireString, jsonClone, strictJSON, validDate, nextDate, worldIdentity
} from './contracts.js';
import { validateGameRun } from './state.js';
import {makeReputationBaseline,applyReputationSignal} from './reputation.js';
import {FACILITY_COMMANDS,facilityAction,advanceFacilities} from './facility-operations.js';
import {OWNERSHIP_COMMANDS,ownershipAction} from './ownership.js';
import {HORSE_REGISTRATION_COMMANDS,registerHorseAction} from './horse-registration.js';
import {HORSE_NAMING_COMMANDS,recordHorseNamingStoryAction,recordHorseNamingPreferenceAction} from './horse-naming-bridge.js';
import {HORSE_NAME_OWNER_COMMANDS,stageStoryHorseNameAction,ownerDecidesHorseNameAction} from './horse-name-owner-release.js';
import {HORSE_CARE_COMMANDS,setHorseCarePolicy,set1999RacePreparation,initializeGameHorseCare,advanceGameHorseCare} from './horse-care.js';
import {runAutonomousDay,settleDailyAgentFeedback} from './daily-agents.js';
import {RACING_COMMANDS,racingAction} from './racing-1999.js';
import {run1999RacingAgents} from './race-agents-1999.js';
import {HORSE_SHIPPING_COMMANDS,shippingAction,advance1999HorseShipping} from './shipping-1999.js';
import {TRAINER_CONTRACT_COMMANDS,offerTrainerServiceTerms,advanceTrainerContracts} from './trainer-contracts-1999.js';
import {OWNER_TRAINER_REVIEW_COMMANDS,setOwnerTrainerMandate,respondToTrainerConcern,advanceOwnerTrainerReviews,updateOwnerTrainerLiveReviews} from './owner-trainer-career-1999.js';
import {PLAYER_RACE_PLAN_COMMANDS,confirm1999PlayerRacePlan} from './player-race-plan-1999.js';
import {TRAINER_MANAGEMENT_COMMANDS,answerTrainerManagementRequest,prepareTrainerManagementDay,reactToTrainerEvents} from './trainer-management-requests-1999.js';
import {TRAINER_EMPLOYMENT_COMMANDS,trainerEmploymentAction,advanceTrainerEmployment,considerTrainerEmployment} from './trainer-employment-1999.js';
import {advance1999TrainerCareerProgression} from './trainer-career-progression-1999.js';

const COMMANDS = new Set(['SCHEDULE_EVENT', 'ADVANCE_DAY', 'QUEUE_DECISION', 'ANSWER_DECISION', 'SET_PERSON_REPUTATION', 'RECORD_REPUTATION_SIGNAL',...FACILITY_COMMANDS,...OWNERSHIP_COMMANDS,...HORSE_REGISTRATION_COMMANDS,...HORSE_NAMING_COMMANDS,...HORSE_NAME_OWNER_COMMANDS,...HORSE_CARE_COMMANDS,...RACING_COMMANDS,...HORSE_SHIPPING_COMMANDS,...TRAINER_CONTRACT_COMMANDS,...OWNER_TRAINER_REVIEW_COMMANDS,...TRAINER_MANAGEMENT_COMMANDS,...TRAINER_EMPLOYMENT_COMMANDS,...PLAYER_RACE_PLAN_COMMANDS]);
const MAX_PENDING = 5000;
// Full per-day decision details remain in dispatch output/runtime records.
// The durable journal keeps compact weekly samples plus daily count summaries.
const DAILY_DETAIL_EVENT_KINDS=new Set([
 'OWNER_DAILY_STRATEGY','TRAINER_DAILY_DECISIONS',
 'OWNER_TRAINER_RELATIONSHIP_PRESSURE','HORSE_NEEDS_ATTRIBUTES',
 'HORSE_TRANSIT_CARE_DAY','HORSE_CARE_UNFUNDED','HORSE_CARE_DAY'
]);
const DAILY_COMPACT_EVENT_KINDS=new Set([
 'OWNER_DAILY_STRATEGY','TRAINER_DAILY_DECISIONS',
 'OWNER_TRAINER_RELATIONSHIP_PRESSURE','HORSE_NEEDS_ATTRIBUTES',
 'HORSE_TRANSIT_CARE_DAY','HORSE_CARE_UNFUNDED','HORSE_CARE_DAY'
]);
function compactDailyEventDetails(kind,details){
 if(kind==='TRAINER_DAILY_DECISIONS')
  return {trainer_id:details.trainer_id,count:details.count,reasons:details.reasons,
   decisions:(details.decisions||[]).map(d=>({
    horse_id:d.horse_id,workout:d.workout,reason:d.reason}))};
 if(kind==='OWNER_DAILY_STRATEGY')
  return {owner_id:details.owner_id,style:details.style,
   causal_scope:details.causal_scope,decisions:(details.decisions||[]).map(d=>({
    horse_id:d.horse_id,reason:d.reason,feed:d.feed,care:d.care,
    budget_minor:d.budget_minor}))};
 if(kind==='OWNER_TRAINER_RELATIONSHIP_PRESSURE')
  return {owner_id:details.owner_id,trainer_id:details.trainer_id,
   unpaid_horse_days:details.unpaid_horse_days,
   owner_trust:details.owner_trust,trainer_support:details.trainer_support};
 if(kind==='HORSE_NEEDS_ATTRIBUTES')
  return {horse_id:details.horse_id};
 if(kind==='HORSE_TRANSIT_CARE_DAY')
  return {horse_id:details.horse_id,owner_id:details.owner_id,
   trainer_id:details.trainer_id,status:details.status,site_id:details.site_id,
   paid_minor:details.paid_minor,workout:details.workout};
 if(kind==='HORSE_CARE_UNFUNDED')
  return {horse_id:details.horse_id,owner_id:details.owner_id,
   needed_minor:details.needed_minor,balance_minor:details.balance_minor};
 if(kind==='HORSE_CARE_DAY')
  return {horse_id:details.horse_id,owner_id:details.owner_id,
   trainer_id:details.trainer_id,site_id:details.site_id,
   workout:details.workout,paid_minor:details.paid_minor};
 return details;
}
const CARE_LEDGER_ROLLUP_KINDS=new Set([
 'HORSE_CARE_OWNER_PAYMENT','HORSE_CARE_SITE_AND_TRAINER_INCOME',
 'HORSE_CARE_TRAINER_REMITTANCE','HORSE_CARE_TRAINER_EARNINGS',
 'HORSE_CARE_SUPPLIER_RECEIPT'
]);
function appendLog(state,commandId,kind,details,persist=true){
 const previous=Number.isSafeInteger(state.event_seq)?state.event_seq:
  state.event_log.at(-1)?.seq??0;
 const event={seq:previous+1,command_id:commandId,
  date:state.clock.date,kind,details:strictJSON(details)};
 state.event_seq=event.seq;
 if(persist)state.event_log.push(event);
 return event;
}
const CARE_LEDGER_DETAIL_DAYS=7;
const CARE_LEDGER_DAILY_ROLLUP_DAYS=30;
function financeMonthEnd(period){
 const [year,month]=period.split('-').map(Number);
 return new Date(Date.UTC(year,month,0)).toISOString().slice(0,10);
}
function compactCareFinancialLedger(state){
 const finance=state.runtime.finances,ledger=finance?.ledger;
 if(!Array.isArray(ledger)||!ledger.length)return;
 const today=Date.parse(state.clock.date+'T00:00:00Z');
 const detailCutoff=new Date(today-CARE_LEDGER_DETAIL_DAYS*86400000)
  .toISOString().slice(0,10);
 const dailyCutoff=new Date(today-(CARE_LEDGER_DAILY_ROLLUP_DAYS-1)*86400000)
  .toISOString().slice(0,10);
 const summaries=new Map(),recent=[];
 const dimensions=['operation_id','site_id','person_id','owner_id',
  'operator_id','trainer_id','feed','care','workout'];
 const add=(row,period,monthly=false)=>{
  const values=dimensions.map(key=>row[key]??null);
  const schema=monthly?'WTW_MONTHLY_FINANCE_ROLLUP_V1':
   'WTW_DAILY_FINANCE_ROLLUP_V1';
  const key=JSON.stringify([schema,period,row.kind,...values]);
  let entry=summaries.get(key);
  if(!entry){
   const start=monthly?period+'-01':period;
   const end=monthly?financeMonthEnd(period):period;
   entry={rollup_schema:schema,rollup_period:period,
    period_start:start,period_end:end,date:end,
    transaction_id:(monthly?'MONTHLY_ROLLUP:':'DAILY_ROLLUP:')+key,
    kind:row.kind,amount_minor:0,transaction_count:0,
    source:monthly?'MODELED_MONTHLY_LEDGER_ROLLUP':
     'MODELED_DAILY_LEDGER_ROLLUP'};
   for(let i=0;i<dimensions.length;i++)
    if(values[i]!==null)entry[dimensions[i]]=values[i];
   summaries.set(key,entry);
  }
  const amount=Number(row.amount_minor)||0;
  const count=Number.isSafeInteger(row.transaction_count)?row.transaction_count:1;
  entry.amount_minor+=amount;
  entry.transaction_count+=count;
 };
 const addDailyOrMonthly=(row,date)=>{
  if(date<dailyCutoff)add(row,date.slice(0,7),true);
  else add(row,date,false);
 };
 for(const row of ledger){
  // Merge earlier monthly rollups with this period's newly compacted rows.
  if(row?.rollup_schema==='WTW_MONTHLY_FINANCE_ROLLUP_V1'){
   const period=typeof row.rollup_period==='string'?row.rollup_period.slice(0,7):
    typeof row.period_start==='string'?row.period_start.slice(0,7):
     typeof row.date==='string'?row.date.slice(0,7):'';
   if(/^\d{4}-\d{2}$/.test(period))add(row,period,true);
   else recent.push(row);
   continue;
  }
  if(row?.rollup_schema==='WTW_DAILY_FINANCE_ROLLUP_V1'&&
   typeof row.rollup_period==='string'){
   const date=row.rollup_period.slice(0,10);
   if(/^\d{4}-\d{2}-\d{2}$/.test(date))addDailyOrMonthly(row,date);
   else recent.push(row);
   continue;
  }
  if(CARE_LEDGER_ROLLUP_KINDS.has(row?.kind)&&
   typeof row.date==='string'&&row.date<detailCutoff&&
   Number.isSafeInteger(row.amount_minor)){
   addDailyOrMonthly(row,row.date);continue;
  }
  recent.push(row);
 }
 finance.ledger=[...summaries.values(),...recent];
}
const DAILY_EVENT_DETAIL_RETENTION_DAYS=90;
function compactDailyEventJournal(state){
 if(!Array.isArray(state.event_log)||!state.event_log.length)return;
 const oldestRetained=new Date(Date.parse(state.clock.date+'T00:00:00Z')-
  (DAILY_EVENT_DETAIL_RETENTION_DAYS-1)*86400000).toISOString().slice(0,10);
 // Keep the sampled detail useful for recent review, while exact per-day event
 // daily event counts and monthly finance totals remain durable for the full career history.
 state.event_log=state.event_log.filter(event=>
  !DAILY_COMPACT_EVENT_KINDS.has(event.kind)||event.date>=oldestRetained);
}
function validateCommand(command) {
  ensure(isObject(command), 'INVALID_COMMAND', 'Command must be an object');
  requireString(command.id, 'command.id', 128);
  ensure(/^[A-Za-z0-9][A-Za-z0-9_:-]{1,127}$/.test(command.id), 'INVALID_COMMAND', 'Command ID must be stable and namespaced');
  ensure(COMMANDS.has(command.type), 'UNSUPPORTED_COMMAND', 'No registered kernel command for '+command.type);
  ensure(['player', 'system'].includes(command.actor), 'INVALID_ACTOR', 'Command actor must be player or system');
  ensure(isObject(command.payload), 'INVALID_COMMAND', 'Command payload must be an object');
  return strictJSON(command);
}
export function dispatchGameCommand({ state, world, command, catalog } = {}) {
  validateGameRun(state, world);
  const c = validateCommand(command);
  const fingerprint = JSON.stringify(c);
  const previous = state.command_receipts[c.id];
  if (previous) {
    ensure(previous === fingerprint, 'COMMAND_CONFLICT', 'Command ID '+c.id+' reused with different contents');
    return { state, events: [], duplicate: true };
  }
  const next = jsonClone(state);
  const output = [];
  const dailyEventCounts=Object.create(null);
  const emit = (kind, details) => {
    const summarize=c.type==='ADVANCE_DAY'&&DAILY_DETAIL_EVENT_KINDS.has(kind);
    const event=appendLog(next,c.id,kind,details,false);
    if(!summarize)next.event_log.push(event);
    else{
     dailyEventCounts[kind]=(dailyEventCounts[kind]||0)+1;
     const recoveryDecision=kind==='TRAINER_DAILY_DECISIONS'&&
      (details.decisions||[]).some(d=>
       ['POST_RACE_MANDATORY_REST','POST_RACE_LIGHT_REBUILD'].includes(d.reason));
     const keepCompact=DAILY_COMPACT_EVENT_KINDS.has(kind)&&
      (next.clock.days_elapsed===1||next.clock.days_elapsed%7===0||recoveryDecision);
     if(keepCompact)
      next.event_log.push({...event,details:compactDailyEventDetails(kind,details)});
    }
    output.push(event);
    return event;
  };
  if (c.type === 'SCHEDULE_EVENT') {
    ensure(c.actor === 'system', 'UNAUTHORIZED_COMMAND', 'Only a registered game system can schedule an event');
    const p = c.payload;
    requireString(p.event_id, 'payload.event_id', 128);
    requireString(p.kind, 'payload.kind', 100);
    ensure(validDate(p.due_date) && p.due_date > next.clock.date, 'INVALID_EVENT_DATE', 'Events must be scheduled for a future date');
    ensure(!next.scheduler.pending.some(x => x.id === p.event_id) && !next.scheduler.delivered_ids.includes(p.event_id), 'DUPLICATE_EVENT', 'Event ID already scheduled/delivered');
    ensure(next.scheduler.pending.length < MAX_PENDING, 'SCHEDULER_LIMIT', 'Too many pending events');
    next.scheduler.pending.push({ id: p.event_id, kind: p.kind, due_date: p.due_date, payload: strictJSON(p.data ?? {}) });
    next.scheduler.pending.sort((a, b) => a.due_date.localeCompare(b.due_date) || a.id.localeCompare(b.id));
    emit('EVENT_SCHEDULED', { event_id: p.event_id, due_date: p.due_date, kind: p.kind });
  } else if (c.type === 'QUEUE_DECISION') {
    ensure(c.actor === 'system', 'UNAUTHORIZED_COMMAND', 'Only a registered game system can create decisions');
    const p = c.payload;
    requireString(p.decision_id, 'payload.decision_id', 128);
    ensure(Array.isArray(p.option_ids) && p.option_ids.length >= 2 && p.option_ids.length <= 20, 'INVALID_DECISION', 'Decision must have 2–20 choices');
    for (const id of p.option_ids) requireString(id, 'payload.option_ids', 128);
    ensure(new Set(p.option_ids).size === p.option_ids.length, 'INVALID_DECISION', 'Decision options must be distinct');
    ensure(!next.decisions.pending[p.decision_id] && !next.decisions.resolved[p.decision_id], 'DUPLICATE_DECISION', 'Decision ID already exists');
    if (p.horse_id) ensure(next.stable_horse_ids.includes(p.horse_id), 'UNKNOWN_HORSE', 'Decision horse must be part of current stable');
    next.decisions.pending[p.decision_id] = { id: p.decision_id, option_ids: [...p.option_ids], horse_id: p.horse_id || null,
      created_date: next.clock.date, context: strictJSON(p.context ?? {}) };
    emit('DECISION_QUEUED', { decision_id: p.decision_id, horse_id: p.horse_id || null });
  } else if (c.type === 'ANSWER_DECISION') {
    ensure(c.actor === 'player', 'UNAUTHORIZED_COMMAND', 'Only player can answer player decisions');
    const p = c.payload;
    requireString(p.decision_id, 'payload.decision_id', 128);
    requireString(p.option_id, 'payload.option_id', 128);
    const pending = next.decisions.pending[p.decision_id];
    ensure(Boolean(pending), 'UNKNOWN_OR_RESOLVED_DECISION', 'Decision unavailable or already answered');
    ensure(pending.option_ids.includes(p.option_id), 'INVALID_CHOICE', 'Unknown decision choice; original decision is unchanged');
    next.decisions.resolved[p.decision_id] = { ...pending, option_id: p.option_id, resolved_date: next.clock.date };
    delete next.decisions.pending[p.decision_id];
    emit('DECISION_ANSWERED', { decision_id: p.decision_id, option_id: p.option_id });
  } else if (c.type === 'SET_PERSON_REPUTATION') {
    ensure(c.actor === 'system', 'UNAUTHORIZED_COMMAND', 'Only the audited game generator can establish professional reputation');
    const p=c.payload;
    requireString(p.person_id,'payload.person_id',128);
    ensure(Boolean(worldIdentity(world,'people',p.person_id)),'UNKNOWN_PERSON','Reputation must reference an approved person ID');
    ensure(!next.runtime.people[p.person_id]?.reputation,'REPUTATION_EXISTS','Cannot replace an established reputation baseline');
    const profile=makeReputationBaseline({catalog,scores:p.scores,date:next.clock.date,
      source_kind:p.source_kind,source_refs:p.source_refs,circuit_id:p.circuit_id??null});
    next.runtime.people[p.person_id]={...(next.runtime.people[p.person_id]||{}),reputation:profile};
    emit('PERSON_REPUTATION_ESTABLISHED',{person_id:p.person_id,source_kind:p.source_kind,baseline:profile.scores,source_refs:p.source_refs});
  } else if (c.type === 'RECORD_REPUTATION_SIGNAL') {
    ensure(c.actor === 'system', 'UNAUTHORIZED_COMMAND', 'Only verified gameplay outcomes can affect professional reputation');
    const p=c.payload;
    requireString(p.person_id,'payload.person_id',128);
    ensure(Boolean(worldIdentity(world,'people',p.person_id)),'UNKNOWN_PERSON','Unknown person for reputation signal');
    const current=next.runtime.people[p.person_id]?.reputation;
    ensure(Boolean(current),'REPUTATION_BASELINE','Person needs an approved starting reputation');
    const updated=applyReputationSignal({catalog,profile:current,signal:p.signal,
      date:next.clock.date,source_refs:p.source_refs,event_id:c.id});
    next.runtime.people[p.person_id].reputation=updated;
    emit('PERSON_REPUTATION_CHANGED',{person_id:p.person_id,signal:p.signal,
      before:current.scores,after:updated.scores,source_refs:p.source_refs});
  } else if (HORSE_NAME_OWNER_COMMANDS.includes(c.type)) {
    if(c.type==='STAGE_STORY_HORSE_NAME')stageStoryHorseNameAction({state:next,world,command:c,emit});
    else ownerDecidesHorseNameAction({state:next,world,command:c,emit});
  } else if (HORSE_NAMING_COMMANDS.includes(c.type)) {
    if(c.type==='OWNER_SET_HORSE_NAMING_PREFERENCE')
      recordHorseNamingPreferenceAction({state:next,world,command:c,emit});
    else recordHorseNamingStoryAction({state:next,world,command:c,emit});
  } else if (HORSE_REGISTRATION_COMMANDS.includes(c.type)) {
    registerHorseAction({state:next,world,command:c,emit});
    const horse=next.runtime.registered_horses?.by_id?.[c.payload?.horse?.horse_id];
    if(horse)initializeGameHorseCare(next,horse,world);
  } else if (PLAYER_RACE_PLAN_COMMANDS.includes(c.type)) {
    confirm1999PlayerRacePlan({state:next,world,command:c,emit});
  } else if (HORSE_SHIPPING_COMMANDS.includes(c.type)) {
    shippingAction({state:next,world,command:c,emit});
  } else if (RACING_COMMANDS.includes(c.type)) {
    racingAction({state:next,world,command:c,emit});
  } else if (TRAINER_EMPLOYMENT_COMMANDS.includes(c.type)) {
    trainerEmploymentAction({state:next,world,command:c,emit});
  } else if (TRAINER_MANAGEMENT_COMMANDS.includes(c.type)) {
    answerTrainerManagementRequest({state:next,world,command:c,emit});
  } else if (OWNER_TRAINER_REVIEW_COMMANDS.includes(c.type)) {
    if(c.type==='RESPOND_TO_TRAINER_CONCERN')
      respondToTrainerConcern({state:next,world,command:c,emit});
    else setOwnerTrainerMandate({state:next,world,command:c,emit});
  } else if (TRAINER_CONTRACT_COMMANDS.includes(c.type)) {
    offerTrainerServiceTerms({state:next,world,command:c,emit});
  } else if (HORSE_CARE_COMMANDS.includes(c.type)) {
    if(c.type==='SET_1999_RACE_PREPARATION')
     set1999RacePreparation({state:next,world,command:c,emit});
    else setHorseCarePolicy({state:next,world,command:c,emit});
  } else if (OWNERSHIP_COMMANDS.includes(c.type)) {
    ownershipAction({state:next,world,command:c,emit});
  } else if (FACILITY_COMMANDS.includes(c.type)) {
    facilityAction({state:next,world,command:c,emit});
  } else if (c.type === 'ADVANCE_DAY') {
    ensure(Object.keys(c.payload).length === 0, 'INVALID_COMMAND', 'ADVANCE_DAY takes no payload; no silent skips');
    next.clock.date = nextDate(next.clock.date);
    next.clock.days_elapsed += 1;
    emit('DAY_ADVANCED', { date: next.clock.date });
    // Physical arrivals must resolve before trainers choose the day's work,
    // owners price care, and barn operators assess actual stall occupancy.
    advance1999HorseShipping({state:next,world,emit});
    advanceTrainerEmployment({state:next,world,emit});
    advance1999TrainerCareerProgression({state:next,world,emit});
    prepareTrainerManagementDay({state:next,emit});
    advanceOwnerTrainerReviews({state:next,world,emit});
    advanceTrainerContracts({state:next,world,emit});
    runAutonomousDay({state:next,world,emit});
    advanceFacilities({state:next,world,emit});
    advanceGameHorseCare({state:next,world,emit});
    settleDailyAgentFeedback({state:next,emit});
    run1999RacingAgents({state:next,world,emit});
    // The current review must see today's actual races, paid care and outcomes.
    updateOwnerTrainerLiveReviews({state:next,world,emit,events:output,trigger:'DAILY'});
    reactToTrainerEvents({state:next,world,events:output,emit});
    considerTrainerEmployment({state:next,world,emit});
    const ready = next.scheduler.pending.filter(x => x.due_date <= next.clock.date);
    next.scheduler.pending = next.scheduler.pending.filter(x => x.due_date > next.clock.date);
    for (const event of ready) {
      next.scheduler.delivered_ids.push(event.id);
      emit('SCHEDULED_EVENT_DUE', { event_id: event.id, kind: event.kind, data: event.payload });
    }
    if(Object.keys(dailyEventCounts).length){
      const event=appendLog(next,c.id,'DAILY_SIMULATION_SUMMARY',{
       date:next.clock.date,counts:dailyEventCounts});
      output.push(event);
    }
    compactCareFinancialLedger(next);
    compactDailyEventJournal(next);
  }
  // Non-clock owner actions can also change the relationship immediately.
  // This is a live projection of the existing run, never an alternate clock.
  if(c.type!=='ADVANCE_DAY'&&[
   'RESPOND_TO_TRAINER_CONCERN','ANSWER_TRAINER_MANAGEMENT_REQUEST',
   'OFFER_LOCAL_TRAINER_ASSIGNMENT','WITHDRAW_LOCAL_TRAINER_OFFER',
   'SET_OWNER_TRAINER_MANDATE',
   'OFFER_TRAINER_SERVICE_TERMS','SET_HORSE_CARE_POLICY',
   'CONFIRM_1999_RACE_PLAN','ENTER_1999_RACE',
   'SETTLE_1999_RACE','BOOK_1999_JOCKEY',
   'SHIP_1999_HORSE','RETURN_1999_HORSE'
  ].includes(c.type))
   updateOwnerTrainerLiveReviews({state:next,world,emit,events:output,
    trigger:'OWNER_OR_TRAINER_DECISION'});
  if(c.type==='SETTLE_1999_RACE')
   reactToTrainerEvents({state:next,world,events:output,emit});
  next.command_receipts[c.id] = fingerprint;
  next.revision += 1;
  validateGameRun(next, world);
  return { state: next, events: output, duplicate: false };
}
