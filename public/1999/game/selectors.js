/** Read-only adapters for the Office/Stable UI; never create a competing roster. */
import { validateGameRun } from './state.js';
import { worldIdentity, ensure } from './contracts.js';
import {attributeDefinitions,normalizeObservation} from './attribute-contract.js';
import {personReputationView,rankProfessionalCandidates} from './reputation.js';
import {normalizePersonRoles} from './people-generator.js';
import {currentHorseOwnerId,getOwnerPortfolioView} from './ownership.js';
import {careerHorse,getRegisteredHorseDirectory} from './horse-registration.js';
import {gameFuturePerson,gameFutureOrganization,gameFutureIndustry} from './future-industry-activation-v23.js';

export function getStableView(state, world) {
  validateGameRun(state, world);
  return state.stable_horse_ids.map(id => {
    const canonical = careerHorse(state, world, id);
    return { id, name: canonical.name, source_status: canonical.source_status || canonical.provenance || 'UNSPECIFIED',
      current_owner_id: state.runtime.registered_horses?.by_id?.[id]?.owner_organization_id ?? currentHorseOwnerId(state,world,id),
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
    pending_horse_transfers:Object.values(state.runtime.ownership?.pending_transfers||{}).length,
    player_owner_horse_count:state.player.role==='owner'&&state.player.operation_id?
      getOwnerPortfolioView(state,world,state.player.operation_id,{limit:0}).total:null,
    registered_horse_count:getRegisteredHorseDirectory(state,world).length,
    future_approved_person_count:Object.keys(gameFutureIndustry(state)?.people??{}).length,
    future_approved_organization_count:Object.keys(gameFutureIndustry(state)?.organizations??{}).length,
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
  const canonical=worldIdentity(world,'people',personId);
  const person=canonical??gameFuturePerson(state,world,personId);
  ensure(Boolean(person),'UNKNOWN_PERSON','Unknown person '+personId);
  if(!canonical){
    // A V23 future person is a real saved-game identity, but has no source
    // historical reputation or magically observed abilities. Never invent
    // game-model assessments or infer a full biographical career.
    return {
      id:person.id,name:person.name,roles:[person.role],
      source_status:'APPROVED_FUTURE_V12_V17_GAME_IDENTITY',
      reputation:null,attributes:[],relationships:{},career:{},
      birth_year:person.birthYear,
      future_identity:true,game_date:state.clock.date
    };
  }
  const roles=normalizePersonRoles(person,catalog);
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
  return [...world.entities.people,...Object.values(gameFutureIndustry(state)?.people??{})]
   .map(person=>getPersonView(state,world,person.id,catalog));
}
export function getProfessionalOpportunityRanking(state,world,catalog,opportunity,candidates){
  validateGameRun(state,world);
  return rankProfessionalCandidates({catalog,state,world,opportunity,candidates});
}

/** Real game-run business profile; canonical founding firms remain in world. */
export function getGameIndustryOrganizationView(state,world,organizationId){
  validateGameRun(state,world);
  const company=gameFutureOrganization(state,world,organizationId);
  ensure(Boolean(company),'UNKNOWN_OPERATION','Unknown organization '+organizationId);
  const future=!worldIdentity(world,'organizations',organizationId);
  return future?{
    id:company.id,name:company.name,kind:company.kind,
    status:company.status,principal_id:company.principalId,
    trainer_id:company.trainerId,manager_ids:[...company.managerIds],
    location:structuredClone(company.location),naming_region:company.namingRegion,
    source_status:'APPROVED_FUTURE_V12_V17_GAME_IDENTITY',
    activated_on:company.activated_on,
    provenance:'V12_V17_PERMANENT_IDENTITIES_IN_SAVED_GAME',
    game_date:state.clock.date
  }:{
    ...structuredClone(company),
    source_status:company.source_status??'APPROVED_WORLD_SNAPSHOT',
    game_date:state.clock.date
  };
}
