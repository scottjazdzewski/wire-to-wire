/** One canonical 1999 game kernel; no implicit save writes. */
import {assembleFictional1999Industry} from './fictional-world-population-v1.mjs';
import attributeCatalog from './attribute-catalog.mjs';
import {createGameRun,validateGameRun} from '../game/state.js';
export const FICTIONAL_1999_CAREER_BRIDGE_SCHEMA='WTW_FICTIONAL_1999_CAREER_BRIDGE_V1';
export async function createFictional1999GameRun({
 seed=19990101,worldId='WTW1999Industry',tracks,foundationHorses=[],
 horseCount=20000,trainersPerTrack=4,jockeysPerTrack=3,ownersPerTrack=8,
 playerRole='owner',involvement='balanced',
 horseNameProvider,personOrganizationNameProvider
}={}){
 const opts={seed,worldId,tracks,foundationHorses,horseCount,
  trainersPerTrack,jockeysPerTrack,ownersPerTrack};
 if(horseNameProvider)opts.horseNameProvider=horseNameProvider;
 if(personOrganizationNameProvider)opts.personOrganizationNameProvider=personOrganizationNameProvider;
 const world=await assembleFictional1999Industry(opts);
 const operation=world.entities.organizations.find(x=>x.kind==='RACING_OWNER')||
  world.entities.organizations[0];
 if(!operation)throw Error('Generated industry has no playable operation');
 const run=createGameRun({world,runId:'WTW-RUN-FICTIONAL-1999-'+seed+'-'+worldId,
  seed,player:{role:playerRole,involvement,operation_id:operation.id},
  stableHorseIds:world.entities.horses.filter(h=>h.ownerId===operation.id)
   .slice(0,30).map(h=>h.id),personGenerationCatalog:attributeCatalog});
 validateGameRun(run,world);
 return {schema:FICTIONAL_1999_CAREER_BRIDGE_SCHEMA,world,run,
  saveContract:'ATOMIC_WORLD_AND_RUN_REQUIRED',namingPolicy:'PROVISIONAL_NAMES_PLAYER_EDITABLE'};
}
