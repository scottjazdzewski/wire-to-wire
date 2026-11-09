/** Read-only adapters for the Office/Stable UI; never create a competing roster. */
import { validateGameRun } from './state.js';
import { worldIdentity, ensure } from './contracts.js';

export function getStableView(state, world) {
  validateGameRun(state, world);
  return state.stable_horse_ids.map(id => {
    const canonical = worldIdentity(world, 'horses', id);
    return { id, name: canonical.name, source_status: canonical.source_status || 'UNSPECIFIED',
      runtime: structuredClone(state.runtime.horse[id] || {}),
      pending_decision_ids: Object.values(state.decisions.pending).filter(d => d.horse_id === id).map(d => d.id) };
  });
}
export function getOfficeView(state, world) {
  validateGameRun(state, world);
  return {
    run_id: state.run_id,
    game_date: state.clock.date,
    days_elapsed: state.clock.days_elapsed,
    player: structuredClone(state.player),
    stable: getStableView(state, world),
    pending_decisions: structuredClone(Object.values(state.decisions.pending)),
    upcoming_events: structuredClone(state.scheduler.pending),
    last_events: structuredClone(state.event_log.slice(-20)),
    state_revision: state.revision
  };
}
export function getCanonicalProfile(world, group, entityId) {
  const entity = worldIdentity(world, group, entityId);
  ensure(Boolean(entity), 'UNKNOWN_ENTITY', 'Unknown canonical entity '+entityId);
  return structuredClone(entity);
}
