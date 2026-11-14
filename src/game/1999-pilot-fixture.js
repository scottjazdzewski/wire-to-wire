/**
 * Explicit isolated 1999 gameplay PILOT only.
 * Uses recorded source identities; creates no historic canon identities.
 * Production careers must NOT call this test fixture helper.
 */
import {ensure} from './contracts.js';
import {createGameRun} from './state.js';
import {dispatchGameCommand} from './kernel.js';
import {model1999StartingHorseAttributes} from './horse-starting-attributes.js';
export const PILOT_SCENARIO_SCHEMA='WTW_1999_TEST_HORSE_START_AND_RESIDENCE_V1';

export function build1999PilotGameRun({world,manifest,playerOperationId,runId='WTW-RUN-TEST-PILOT-38'}={}){
 ensure(manifest?.schema===PILOT_SCENARIO_SCHEMA&&
  manifest.status==='ISOLATED_GAME_TEST_COHORT_NOT_AUTHORITATIVE_OPENING'&&
  Array.isArray(manifest.assignments)&&Array.isArray(manifest.sites),
  'PILOT_SCENARIO','Only explicit non-canonical 1999 test cohort allowed');
 ensure(manifest.horse_count===manifest.assignments.length&&
  manifest.site_count===manifest.sites.length&&
  manifest.source_names?.accepted_for_production===false,
  'PILOT_SCENARIO','Test cohort counts and name provenance must reconcile');
 const ids=new Set(),names=new Set(),capacity=new Map(),accepted=[];
 const siteIds=new Set(manifest.sites.map(s=>s.site_id));
 ensure(siteIds.size===manifest.sites.length,'PILOT_SCENARIO','Duplicate physical site IDs');
 for(const h of manifest.assignments){
  ensure(!ids.has(h.horse_id)&&!names.has(h.name.toLowerCase()),
   'PILOT_SCENARIO','Duplicate horse ID or name');
  ids.add(h.horse_id);names.add(h.name.toLowerCase());
  ensure(siteIds.has(h.current_residence_id)&&h.racing_barn_id===h.current_residence_id,
   'PILOT_SCENARIO','Horse must have one declared physical residence');
  const site=manifest.sites.find(s=>s.site_id===h.current_residence_id);
  ensure(h.trainer_id===site.trainer_id&&h.host_track_id===site.host_track_id,
   'PILOT_SCENARIO','Trainer and host track must match the physical barn');
  ensure(JSON.stringify(model1999StartingHorseAttributes({
   horse_id:h.horse_id,seed:manifest.seed,
   foaling_year:h.foaling_year,sex:h.sex}))===JSON.stringify(h.starting_attributes),
   'PILOT_SCENARIO','Starting attributes do not match frozen deterministic seed');
  capacity.set(site.site_id,(capacity.get(site.site_id)||0)+1);
  accepted.push({candidate_id:h.candidate_id,name:h.name,status:'ACCEPTED'});
 }
 for(const site of manifest.sites)
  ensure((capacity.get(site.site_id)||0)<=site.stalls_total,'PILOT_SCENARIO','Pilot stall over-capacity');
 const firstOwner=playerOperationId||manifest.assignments[0]?.owner_organization_id;
 let state=createGameRun({world,runId,seed:manifest.seed,
  player:{role:'owner',involvement:'balanced',operation_id:firstOwner}});
 const apply=(id,type,payload)=>{state=dispatchGameCommand({world,state,
  command:{id,type,payload,actor:'system'}}).state;};
 const operators=[...new Set(manifest.sites.map(s=>s.operator_organization_id))].sort();
 for(const id of operators)apply('pilot:funds:'+id,'FACILITY_SEED_FUNDS',{
  operation_id:id,balance_minor:25000000,source_kind:'SIMULATED_TEST',
  source_ref:'ISOLATED_1999_PILOT_FINANCE_FIXTURE_NOT_OPENING_CANON'});
 for(const site of manifest.sites){
  apply('pilot:site:'+site.site_id,'FACILITY_REGISTER_RACING_SITE',{
   site_id:site.site_id,operator_organization_id:site.operator_organization_id,
   facility_owner_organization_id:site.facility_owner_organization_id,
   site_type:'RACING_STABLE',residence_kind:site.residence_kind,
   name:site.name,
   location:{city:site.city,state:site.state,country:site.country},
   host_track_id:site.host_track_id,
   head_trainer_person_id:site.residence_kind==='TRACK_TRAINER_BARN'?site.trainer_id:null,
   stalls_total:site.stalls_total,staff_required:site.staff_required,
   staff_present:site.staff_present,quality:site.quality,
   daily_upkeep_minor:site.daily_upkeep_minor,daily_boarding_minor:site.daily_boarding_minor,
   staff_wage_daily_minor:site.staff_wage_daily_minor,
   track_rent_daily_minor:site.track_rent_daily_minor,
   source_kind:site.source_kind,source_ref:site.source_ref
  });
 }
 // Explicitly accepted for this ISOLATED TEST ONLY, never alter the pending
 // editorial source batch or claim approval by external horse-name registry.
 const release={release_id:'TEST-NAMES-1999-PILOT-V1',status:'ACCEPTED',
  candidates:accepted,reserved_names:{version:'TEST-1999-V1',names:[]}};
 for(const h of manifest.assignments){
  apply('pilot:horse:'+h.horse_id,'REGISTER_GAME_HORSE',{
   horse:{
    horse_id:h.horse_id,registration_receipt_id:h.registration_receipt_id,
    name_candidate_id:h.candidate_id,registered_name:h.name,sex:h.sex,
    foaling_year:h.foaling_year,birth_date:h.birth_date,
    owner_organization_id:h.owner_organization_id,
    breeder_organization_id:h.breeder_organization_id,
    foaling_location_id:h.foaling_location_id,
    sire_id:null,dam_id:null,current_residence_id:h.current_residence_id,
    racing_barn_id:h.racing_barn_id,trainer_id:h.trainer_id,
    status:'IN_TRAINING',starting_attributes:h.starting_attributes
   },naming_release:release
  });
 }
 ensure(Object.keys(state.runtime.registered_horses.by_id).length===manifest.horse_count,
  'PILOT_SCENARIO','Not all pilot horses were admitted to test game');
 return state;
}
