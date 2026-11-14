/**
 * WTW simulation FOUNDATION: canonical game clock, validated decision choices,
 * scheduled event delivery and append-only event journal.
 * Registered-horse care now uses the existing training simulator, funded by
 * the single operation ledger. Race entry and actual result settlement remain future.
 */
import {
  ensure, isObject, requireString, jsonClone, strictJSON, validDate, nextDate
} from './contracts.js';
import { validateGameRun } from './state.js';
import {makeReputationBaseline,applyReputationSignal} from './reputation.js';
import {FACILITY_COMMANDS,facilityAction,advanceFacilities} from './facility-operations.js';
import {OWNERSHIP_COMMANDS,ownershipAction} from './ownership.js';
import {HORSE_REGISTRATION_COMMANDS,registerHorseAction} from './horse-registration.js';
import {HORSE_CARE_COMMANDS,setHorseCarePolicy,initializeGameHorseCare,advanceGameHorseCare} from './horse-care.js';

const COMMANDS = new Set(['SCHEDULE_EVENT', 'ADVANCE_DAY', 'QUEUE_DECISION', 'ANSWER_DECISION', 'SET_PERSON_REPUTATION', 'RECORD_REPUTATION_SIGNAL',...FACILITY_COMMANDS,...OWNERSHIP_COMMANDS,...HORSE_REGISTRATION_COMMANDS,...HORSE_CARE_COMMANDS]);
const MAX_PENDING = 5000;
function appendLog(state, commandId, kind, details) {
  const event = { seq: state.event_log.length + 1, command_id: commandId,
    date: state.clock.date, kind, details: strictJSON(details) };
  state.event_log.push(event);
  return event;
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
  const emit = (kind, details) => output.push(appendLog(next, c.id, kind, details));
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
    ensure(world.entities.people.some(person=>person.id===p.person_id),'UNKNOWN_PERSON','Reputation must reference an approved person ID');
    ensure(!next.runtime.people[p.person_id]?.reputation,'REPUTATION_EXISTS','Cannot replace an established reputation baseline');
    const profile=makeReputationBaseline({catalog,scores:p.scores,date:next.clock.date,
      source_kind:p.source_kind,source_refs:p.source_refs,circuit_id:p.circuit_id??null});
    next.runtime.people[p.person_id]={...(next.runtime.people[p.person_id]||{}),reputation:profile};
    emit('PERSON_REPUTATION_ESTABLISHED',{person_id:p.person_id,source_kind:p.source_kind,baseline:profile.scores,source_refs:p.source_refs});
  } else if (c.type === 'RECORD_REPUTATION_SIGNAL') {
    ensure(c.actor === 'system', 'UNAUTHORIZED_COMMAND', 'Only verified gameplay outcomes can affect professional reputation');
    const p=c.payload;
    requireString(p.person_id,'payload.person_id',128);
    ensure(world.entities.people.some(person=>person.id===p.person_id),'UNKNOWN_PERSON','Unknown person for reputation signal');
    const current=next.runtime.people[p.person_id]?.reputation;
    ensure(Boolean(current),'REPUTATION_BASELINE','Person needs an approved starting reputation');
    const updated=applyReputationSignal({catalog,profile:current,signal:p.signal,
      date:next.clock.date,source_refs:p.source_refs,event_id:c.id});
    next.runtime.people[p.person_id].reputation=updated;
    emit('PERSON_REPUTATION_CHANGED',{person_id:p.person_id,signal:p.signal,
      before:current.scores,after:updated.scores,source_refs:p.source_refs});
  } else if (HORSE_REGISTRATION_COMMANDS.includes(c.type)) {
    registerHorseAction({state:next,world,command:c,emit});
    const horse=next.runtime.registered_horses?.by_id?.[c.payload?.horse?.horse_id];
    if(horse)initializeGameHorseCare(next,horse);
  } else if (HORSE_CARE_COMMANDS.includes(c.type)) {
    setHorseCarePolicy({state:next,world,command:c,emit});
  } else if (OWNERSHIP_COMMANDS.includes(c.type)) {
    ownershipAction({state:next,world,command:c,emit});
  } else if (FACILITY_COMMANDS.includes(c.type)) {
    facilityAction({state:next,world,command:c,emit});
  } else if (c.type === 'ADVANCE_DAY') {
    ensure(Object.keys(c.payload).length === 0, 'INVALID_COMMAND', 'ADVANCE_DAY takes no payload; no silent skips');
    next.clock.date = nextDate(next.clock.date);
    next.clock.days_elapsed += 1;
    emit('DAY_ADVANCED', { date: next.clock.date });
    advanceFacilities({state:next,world,emit});
    advanceGameHorseCare({state:next,world,emit});
    const ready = next.scheduler.pending.filter(x => x.due_date <= next.clock.date);
    next.scheduler.pending = next.scheduler.pending.filter(x => x.due_date > next.clock.date);
    for (const event of ready) {
      next.scheduler.delivered_ids.push(event.id);
      emit('SCHEDULED_EVENT_DUE', { event_id: event.id, kind: event.kind, data: event.payload });
    }
  }
  next.command_receipts[c.id] = fingerprint;
  next.revision += 1;
  validateGameRun(next, world);
  return { state: next, events: output, duplicate: false };
}
