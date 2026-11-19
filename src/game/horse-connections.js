/** Identity-based connections for the active GAME RUN.
 * One horse may be owned by O-ID A, trained by P-ID B, and housed at
 * F-ID C on T-ID D. Never infer any of these from a display name.
 */
import {validateGameRun} from './state.js';
import {ensure,worldIdentity} from './contracts.js';
import {currentHorseOwnerId} from './ownership.js';
export function getCareerHorseConnections(state,world,{kind,id}={}){
 validateGameRun(state,world);
 ensure(['owner','trainer','track','site','care_facility','training_barn'].includes(kind)&&
  typeof id==='string'&&id,
  'HORSE_CONNECTIONS','Expected owner, trainer, track, site, care-facility or training-barn identity');
 if(['owner','care_facility','training_barn'].includes(kind))ensure(
  Boolean(worldIdentity(world,'organizations',id)),
  'HORSE_CONNECTIONS','Unknown owner O-ID');
 if(kind==='trainer')ensure(Boolean(worldIdentity(world,'people',id)),
  'HORSE_CONNECTIONS','Unknown trainer P-ID');
 if(kind==='track')ensure(Boolean(worldIdentity(world,'tracks',id)),
  'HORSE_CONNECTIONS','Unknown track T-ID');
 if(kind==='site')ensure(Boolean(state.runtime.facilities?.sites?.[id]),
  'HORSE_CONNECTIONS','Unknown residence F-ID');
 const representedSourceIds=new Set(Object.values(state.runtime.registered_horses?.by_id||{}).
  map(h=>h.world_source_horse_id).filter(Boolean));
 // A registered H-GAME horse and its immutable H-FICTIONAL source represent
 // one animal. Ownership, trainer, care and barn views must never double count.
 const source=world.entities.horses.filter(h=>!representedSourceIds.has(h.id)).map(h=>({
  id:h.id,name:h.name,origin:'SOURCE_CANON',
  owner_organization_id:currentHorseOwnerId(state,world,h.id),
  trainer_id:h.trainerId||h.trainer_id||null,
  care_facility_organization_id:h.careFacilityId||h.care_facility_organization_id||null,
  training_barn_organization_id:h.trainingBarnId||h.training_barn_organization_id||null,
  current_residence_id:h.current_residence_id||h.racing_barn_id||null,
  host_track_id:h.trackId||h.track_id||null
 }));
 const registered=Object.values(state.runtime.registered_horses?.by_id||{}).map(h=>({
  id:h.horse_id,name:h.registered_name,origin:h.provenance,
  owner_organization_id:h.owner_organization_id,trainer_id:h.trainer_id,
  care_facility_organization_id:h.care_facility_organization_id||null,
  training_barn_organization_id:h.training_barn_organization_id||null,
  current_residence_id:h.current_residence_id,host_track_id:h.host_track_id
 }));
 const roster=[...source,...registered].filter(h=>kind==='owner'?h.owner_organization_id===id:
  kind==='trainer'?h.trainer_id===id:kind==='site'?h.current_residence_id===id:
  kind==='care_facility'?h.care_facility_organization_id===id:
  kind==='training_barn'?h.training_barn_organization_id===id:h.host_track_id===id);
 roster.sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
 return {kind,id,as_of:state.clock.date,total:roster.length,
  horses:roster.map(h=>({...h,site_name:state.runtime.facilities?.sites?.[h.current_residence_id]?.name||null}))};
}
