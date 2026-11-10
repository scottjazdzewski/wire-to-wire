/** Read-only adapters for the Office/Stable UI; never create a competing roster. */
import { validateGameRun } from './state.js';
import { worldIdentity, ensure } from './contracts.js';
import {attributeDefinitions,normalizeObservation} from './attribute-contract.js';
import {personReputationView,rankProfessionalCandidates} from './reputation.js';

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


/**
 * Source-linked person profile for FM/OOTP presentation. Existing canon supplies
 * identity, current game run supplies professional standing and observations.
 * Hidden latent skills are deliberately not exposed to the view.
 */
export function getPersonView(state,world,personId,catalog){
  validateGameRun(state,world);
  const person=worldIdentity(world,'people',personId);
  ensure(Boolean(person),'UNKNOWN_PERSON','Unknown person '+personId);
  const sourceRoles=Array.isArray(person.roles)?person.roles:
    typeof person.role==='string'?[person.role]:[];
  const roles=sourceRoles.filter(role=>Boolean(catalog.person_roles[role]));
  const definitions=attributeDefinitions(catalog,'people',roles);
  const runtime=state.runtime.people[personId]||{};
  const evaluations=Array.isArray(runtime.observations)?runtime.observations:[];
  const reports=new Map(evaluations.filter(record=>record&&typeof record.attribute_key==='string')
    .map(record=>[record.attribute_key,record]));
  const attributes=definitions.map(def=>{
    const data=reports.get(def.key);
    const observation=data?normalizeObservation(data):null;
    const verified=observation&&observation.status!=='unassessed'&&observation.evidence_refs.length>0;
    return {key:def.key,label:def.label,scope:def.scope,
      status:verified?observation.status:'unassessed',
      estimate:verified?observation.estimate:null,
      confidence:verified?observation.confidence:null};
  });
  return {
    id:person.id,name:person.name,roles,
    source_status:person.source_status||'UNSPECIFIED',
    reputation:personReputationView(runtime.reputation||null,catalog),
    attributes,
    relationships:structuredClone(runtime.relationships||{}),
    career:structuredClone(runtime.career||{}),
    // Never include runtime.latent in player-visible views.
    game_date:state.clock.date
  };
}
export function getPeopleDirectory(state,world,catalog){
  validateGameRun(state,world);
  return world.entities.people.map(person=>getPersonView(state,world,person.id,catalog));
}
export function getProfessionalOpportunityRanking(state,world,catalog,opportunity,candidates){
  validateGameRun(state,world);
  return rankProfessionalCandidates({catalog,state,world,opportunity,candidates});
}
