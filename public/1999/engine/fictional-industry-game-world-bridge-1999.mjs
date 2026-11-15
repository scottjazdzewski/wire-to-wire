/**
 * Adapter from the resumable, persisted 1999 census into the canonical game
 * kernel. It reuses the exact persisted world records; it does not generate a
 * second population or introduce another simulation engine.
 */
import {WORLD_SCHEMA,validateWorld} from '../game/contracts.js';
import {createGameRun,validateGameRun} from '../game/state.js';
import {initializeGameHorseCare} from '../game/horse-care.js';
import {model1999StartingHorseAttributes} from '../game/horse-starting-attributes.js';
import {dispatchGameCommand} from '../game/kernel.js';
import {readPersistent1999Directory,readPersistent1999IndustryBatch,
 verifyPersistent1999WorldOpen} from './fictional-industry-persistence-1999.mjs';

export const PERSISTED_1999_GAME_BRIDGE_SCHEMA='WTW_PERSISTED_1999_GAME_BRIDGE_V1';
const TRACK_ID=/^(?:T|IT)-[A-Za-z0-9-]+$/;
async function digest(value){
 const bytes=new TextEncoder().encode(JSON.stringify(value));
 const result=new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes));
 return [...result].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function readAll(store,manifest,kind,count){
 const batchSize=kind==='calendarBatches'?100:manifest.batchSize;
 const committed=kind==='calendarBatches'?manifest.calendarBatchesCommitted:
  kind==='horseBatches'?manifest.horseBatchesCommitted:manifest.personBatchesCommitted;
 const records=[];
 for(let i=0;i<committed;i++)records.push(...await readPersistent1999IndustryBatch(
  store,manifest,kind,i));
 if(records.length!==count)throw Error('Persisted '+kind+' census count mismatch');
 return records;
}

/**
 * Hydrate a completed world once for the existing kernel, then create a
 * normal canonical run against its immutable snapshot. Large-world callers
 * should invoke this at career start and retain the hydrated world for the
 * session; IndexedDB remains the durable source of truth.
 */
export async function openPersistent1999GameCareer(store,manifest,{
 runId='WTW-RUN-1999-'+manifest?.seed+'-SIZE-'+
  (manifest?.worldSizePercent??100),
 playerRole='owner',involvement='balanced',operationId=null
}={}){
 const certificate=await verifyPersistent1999WorldOpen(store,manifest);
 const [horses,people,directory,cards]=await Promise.all([
  readAll(store,manifest,'horseBatches',manifest.horseCount),
  readAll(store,manifest,'personBatches',manifest.personCount),
  readPersistent1999Directory(store,manifest),
  readAll(store,manifest,'calendarBatches',manifest.scheduledCards)
 ]);
 const tracks=directory.filter(x=>TRACK_ID.test(x.id));
 const organizations=directory.filter(x=>!TRACK_ID.test(x.id));
 if(!tracks.length||!organizations.length)
  throw Error('Persisted world needs tracks and operating organizations');
 const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
  authority:{snapshot_id:'WTW-PERSISTED-1999-'+manifest.seed+'-'+
   manifest.worldId+'-'+(manifest.worldSizePercent??100),
   source:'PERSISTED_FICTIONAL_1999_INDUSTRY',
   sha256:await digest({manifest,entities:{horses,people,organizations,tracks},cards})},
  entities:{horses,people,organizations,tracks},
  calendar:{schema:manifest.calendarSchema,year:1999,cards,
   summary:{raceDays:manifest.scheduledCards,
    scheduledRaces:manifest.scheduledRaces}},
  manifest:{schema:PERSISTED_1999_GAME_BRIDGE_SCHEMA,
   sourceManifest:manifest.schema,worldId:manifest.worldId,
   worldSizePercent:manifest.worldSizePercent??100,
   census:{horses:horses.length,people:people.length,
    organizations:organizations.length,tracks:tracks.length},
   scheduledCards:manifest.scheduledCards,scheduledRaces:manifest.scheduledRaces,
   horseNamingRevision:manifest.horseNamingRevision}};
 validateWorld(world);
 const ownerGroups=new Map();
 for(const h of horses)if(h.status==='RACING'&&h.ownerId){
  if(!ownerGroups.has(h.ownerId))ownerGroups.set(h.ownerId,[]);
  ownerGroups.get(h.ownerId).push(h);
 }
 const operation=operationId?organizations.find(x=>x.id===operationId):
  organizations.filter(x=>x.id.startsWith('O-FICTIONAL-OWNER-'))
   .sort((a,b)=>(ownerGroups.get(b.id)?.length||0)-(ownerGroups.get(a.id)?.length||0)||
    a.id.localeCompare(b.id))[0];
 if(!operation)throw Error('Selected player operation does not exist in this world');
 const openingRoster=(ownerGroups.get(operation.id)||[]).slice(0,30);
 if(openingRoster.length<2)throw Error('Selected operation needs at least two opening runners');
 const run=createGameRun({world,runId,seed:manifest.seed,
  player:{role:playerRole,involvement,operation_id:operation.id},stableHorseIds:[]});
 const trackGroups=new Map();
 for(const source of openingRoster){
  const trackId=source.homeTrackId;
  if(!trackId||!world.entities.tracks.some(t=>t.id===trackId))
   throw Error('Opening runner lacks an active home track: '+source.id);
  if(!trackGroups.has(trackId))trackGroups.set(trackId,[]);
  trackGroups.get(trackId).push(source);
 }
 const trainerForTrack=trackId=>people.find(p=>p.role==='trainer'&&p.workplaceId===trackId);
 for(const [trackId,group] of trackGroups){
  const track=world.entities.tracks.find(t=>t.id===trackId);
  const trainer=trainerForTrack(trackId)||people.find(p=>p.role==='trainer');
  if(!trainer)throw Error('Opening track lacks a playable trainer identity: '+trackId);
  const siteId='F-1999-OPENING-'+trackId;
  const loc=track.location||{};
  run.runtime.facilities.sites[siteId]={id:siteId,offer_id:null,
   owner_id:operation.id,operator_organization_id:operation.id,
   name:operation.name+' Racing Barn',type:'RACING_STABLE',
   residence_kind:'TRACK_TRAINER_BARN',host_track_id:trackId,
   head_trainer_person_id:trainer.id,
   location:{city:loc.city||loc.locality||track.name,
    state:loc.region||loc.state||'Unknown',country:loc.country||'USA'},
   source_kind:'MODELED_1999_GAME_SITE',
   source_ref:'PERSISTED_FICTIONAL_1999_OPENING_WORLD',status:'ACTIVE',
   acquired_date:run.clock.date,open_date:run.clock.date,
   stalls:Math.max(60,group.length),max_stalls:Math.max(60,group.length),
   quality:60,daily_upkeep_minor:0,daily_boarding_minor:0,
   staff_required:1,staff_count:1,staff_wage_daily_minor:0,
   track_rent_daily_minor:0,maintenance_daily_minor:0,
   maintenance_policy:'STANDARD',contracts:[],upgrade:null,land_acres:0};
 }
 run.runtime.finances.operation_balances_minor[operation.id]=250000000;
 run.runtime.finances.balance_minor=250000000;
 const activeIds=[];
 for(const source of openingRoster){
  const id='H-GAME-1999-WORLD-'+source.id.replace(/^H-FICTIONAL-1999-/,'');
  const siteId='F-1999-OPENING-'+source.homeTrackId;
  const h={horse_id:id,id,world_source_horse_id:source.id,
   name:source.name,registered_name:source.name,sex:source.sex,
   foaling_year:source.foalYear,birth_date:source.dateOfBirth,
   racing_age_1999:1999-source.foalYear,
   sire_id:source.sireId,dam_id:source.damId,
   breeder_organization_id:source.foalingFarmId,
   owner_organization_id:source.ownerId,
   foaling_location_id:source.foalingFarmId,
   current_residence_id:siteId,racing_barn_id:siteId,
   trainer_id:source.trainerId,residence_kind:'TRACK_TRAINER_BARN',
   host_track_id:source.homeTrackId,status:'IN_TRAINING',
   provenance:'OPENING_1999_WORLD_CAREER',registration_date:run.clock.date,
   registration_receipt_id:'WORLD_OPENING:'+source.id,
   naming:{status:'PROVISIONAL_EDITABLE',release_id:
    'OPENING_WORLD:'+manifest.worldId,candidate_id:source.id,
    source_horse_id:source.id},
   starting_attributes:model1999StartingHorseAttributes({horse_id:id,
    seed:manifest.seed,foaling_year:source.foalYear,sex:source.sex}),
   career:{starts:0,wins:0,earnings_minor:0}};
  run.runtime.registered_horses.by_id[id]=h;
  run.runtime.registered_horses.by_receipt[h.registration_receipt_id]=id;
  run.stable_horse_ids.push(id);activeIds.push(id);
  initializeGameHorseCare(run,h);
 }
 const homeTrack=openingRoster[0].homeTrackId;
 const openingJockeys=people.filter(p=>p.role==='jockey'&&p.workplaceId===homeTrack)
  .slice(0,120).map(p=>({id:p.id,home_track_id:homeTrack}));
 if(openingJockeys.length>=2){
  const result=dispatchGameCommand({state:run,world,command:{id:'opening-jockey-colony',
   type:'ACTIVATE_JOCKEY_COLONY',actor:'system',
   payload:{jockeys:openingJockeys}}});
  Object.assign(run,result.state);
 }
 validateGameRun(run,world);
 return {schema:PERSISTED_1999_GAME_BRIDGE_SCHEMA,world,run,
  operation,certificate,playableHorseCount:activeIds.length,
  openingJockeyCount:openingJockeys.length,
  homeTrackId:homeTrack};
}
