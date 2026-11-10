import {
  RUN_SCHEMA, PLAYER_ROLES, INVOLVEMENT_LEVELS, ensure, validDate,
  requireString, isObject, strictJSON, validateWorld, validateWorldRef, worldIdentity
} from './contracts.js';
import { validateSeed } from './rng.js';

export function createGameRun({ world, runId, seed, player, stableHorseIds = [], startDate } = {}) {
  validateWorld(world);
  requireString(runId, 'runId', 128);
  ensure(/^WTW-RUN-[A-Za-z0-9_-]+$/.test(runId), 'INVALID_RUN_ID', 'Use an explicit namespaced WTW-RUN-* ID');
  validateSeed(seed);
  ensure(isObject(player), 'INVALID_PLAYER', 'Player definition required');
  ensure(PLAYER_ROLES.includes(player.role), 'INVALID_PLAYER', 'Unknown management role');
  ensure(INVOLVEMENT_LEVELS.includes(player.involvement), 'INVALID_PLAYER', 'Unknown involvement level');
  const operationId = player.operation_id || null;
  ensure(!operationId || Boolean(worldIdentity(world, 'organizations', operationId)), 'UNKNOWN_OPERATION', 'Player operation must exist in approved world snapshot');
  ensure(Array.isArray(stableHorseIds) && new Set(stableHorseIds).size === stableHorseIds.length, 'INVALID_STABLE', 'Stable Horse IDs must be unique');
  for (const horseId of stableHorseIds) ensure(Boolean(worldIdentity(world, 'horses', horseId)), 'UNKNOWN_HORSE', 'Horse not in approved world snapshot: '+horseId);
  const date = startDate || world.start_date;
  ensure(validDate(date) && date >= world.start_date, 'INVALID_DATE', 'Run date must be on or after world start_date');
  const state = {
    schema: RUN_SCHEMA,
    run_id: runId,
    world_ref: { snapshot_id: world.authority.snapshot_id, sha256: world.authority.sha256 },
    revision: 0,
    clock: { date, days_elapsed: 0 },
    rng: { seed: seed >>> 0 },
    player: { role: player.role, involvement: player.involvement, operation_id: operationId },
    stable_horse_ids: [...stableHorseIds],
    runtime: { horse: {}, races: {}, entries: {}, people: {}, finances: { balance_minor: null, ledger: [] } },
    decisions: { pending: {}, resolved: {} },
    scheduler: { pending: [], delivered_ids: [] },
    command_receipts: {},
    event_log: []
  };
  return validateGameRun(state, world);
}
export function validateGameRun(state, world) {
  validateWorld(world);
  ensure(isObject(state) && state.schema === RUN_SCHEMA, 'RUN_SCHEMA', 'Expected '+RUN_SCHEMA);
  requireString(state.run_id, 'run_id', 128);
  validateWorldRef(world, state.world_ref);
  ensure(Number.isInteger(state.revision) && state.revision >= 0, 'RUN_REVISION', 'Invalid revision');
  ensure(isObject(state.clock) && validDate(state.clock.date) && state.clock.date >= world.start_date && Number.isInteger(state.clock.days_elapsed) && state.clock.days_elapsed >= 0,
    'RUN_CLOCK', 'Invalid saved game clock');
  ensure(isObject(state.rng), 'RUN_RNG', 'Missing deterministic random seed');
  validateSeed(state.rng.seed);
  ensure(isObject(state.player) && PLAYER_ROLES.includes(state.player.role) && INVOLVEMENT_LEVELS.includes(state.player.involvement), 'RUN_PLAYER', 'Invalid player role');
  ensure(!state.player.operation_id || Boolean(worldIdentity(world, 'organizations', state.player.operation_id)), 'UNKNOWN_OPERATION', 'Player operation ID not found');
  ensure(Array.isArray(state.stable_horse_ids) && new Set(state.stable_horse_ids).size === state.stable_horse_ids.length, 'INVALID_STABLE', 'Invalid stable roster');
  for (const id of state.stable_horse_ids) ensure(Boolean(worldIdentity(world, 'horses', id)), 'UNKNOWN_HORSE', 'Unknown stable horse '+id);
  ensure(isObject(state.runtime) && isObject(state.runtime.horse) && isObject(state.runtime.races) && isObject(state.runtime.entries) && isObject(state.runtime.people)
    && isObject(state.runtime.finances) && Array.isArray(state.runtime.finances.ledger), 'RUN_RUNTIME', 'Invalid runtime shell');
  // Runtime person development is keyed only by canonical person IDs. The
  // accepted starting reputation is never inferred from trust or an unrelated role label.
  for (const [id,person] of Object.entries(state.runtime.people)) {
    ensure(Boolean(worldIdentity(world,'people',id)),'UNKNOWN_PERSON','Unknown saved person '+id);
    ensure(isObject(person),'RUN_PERSON','Invalid person runtime record');
    if(person.reputation){
      const rep=person.reputation;
      ensure(isObject(rep)&&rep.schema==='WTW_PERSON_REPUTATION_V1'&&isObject(rep.scores)&&
        typeof rep.scores.overall==='number'&&Number.isFinite(rep.scores.overall)&&rep.scores.overall>=0&&rep.scores.overall<=100 &&
        Array.isArray(rep.history)&&validDate(rep.as_of)&&rep.as_of<=state.clock.date &&
        isObject(rep.source)&&Array.isArray(rep.source.refs)&&rep.source.refs.length>0,
        'RUN_REPUTATION','Invalid reputation baseline or dated history for '+id);
      for(const v of Object.values(rep.scores))
        ensure(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100,'RUN_REPUTATION','Invalid reputation score');
      for(const ev of rep.history)
        ensure(isObject(ev)&&typeof ev.id==='string'&&validDate(ev.date)&&ev.date<=state.clock.date&&
          typeof ev.signal==='string'&&Array.isArray(ev.source_refs)&&ev.source_refs.length>0,
          'RUN_REPUTATION','Invalid sourced reputation event');
    }
  }
  ensure(isObject(state.decisions) && isObject(state.decisions.pending) && isObject(state.decisions.resolved), 'RUN_DECISIONS', 'Invalid decisions');
  ensure(isObject(state.scheduler) && Array.isArray(state.scheduler.pending) && Array.isArray(state.scheduler.delivered_ids), 'RUN_SCHEDULER', 'Invalid scheduler');
  ensure(isObject(state.command_receipts) && Array.isArray(state.event_log), 'RUN_JOURNAL', 'Invalid journal');
  ensure(new Set(state.scheduler.pending.map(x => x.id)).size === state.scheduler.pending.length, 'RUN_SCHEDULER', 'Duplicate scheduled event ID');
  ensure(new Set(state.scheduler.delivered_ids).size === state.scheduler.delivered_ids.length, 'RUN_SCHEDULER', 'Duplicate delivered event ID');
  for (const e of state.scheduler.pending) ensure(isObject(e) && typeof e.id === 'string' && validDate(e.due_date) && typeof e.kind === 'string', 'RUN_SCHEDULER', 'Invalid scheduled event');
  for (let i = 0; i < state.event_log.length; i++) {
    const event = state.event_log[i];
    ensure(isObject(event) && event.seq === i + 1 && typeof event.kind === 'string' && typeof event.command_id === 'string' && validDate(event.date),
      'RUN_JOURNAL', 'Broken event journal sequence');
  }
  strictJSON(state);
  return state;
}
