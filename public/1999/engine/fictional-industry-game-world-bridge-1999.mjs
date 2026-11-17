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
export const PERSISTED_1999_OPENING_BARN_NAMING_MODEL='WTW_1999_OWNER_TRACK_BARN_V1';

/**
 * Display identity for a NEW, owner-operated racing barn. The operation and
 * venue are both canonical ID-addressed records. Do not invent a new owner,
 * trainer or facility identity, and do not rename an existing saved site.
 * The durable run owns the resulting name after opening.
 */
export function format1999OpeningBarnName(operation,track){
 if(typeof operation?.id!=='string'||!operation.id||
  typeof track?.id!=='string'||!track.id||
  typeof operation.name!=='string'||!operation.name.trim()||
  typeof track.name!=='string'||!track.name.trim())
  throw Error('Opening barn requires a real named owner and track');
 const owner=operation.name.trim().replace(/\s+/g,' ');
 const venue=track.name.trim().replace(/\s+/g,' ');
 return owner+' — '+venue+' Barn';
}

/**
 * Select a finite active booking board from the real persisted professionals.
 * A multi-track player stable must see local riders at EACH home circuit,
 * not just the home track of its first horse. Identities are never invented.
 * The full world directory and all other jockeys remain intact.
 */
export function select1999CareerJockeyColony(people,trackIds,{limit=120}={}){
 if(!Array.isArray(people)||!Array.isArray(trackIds)||
  !Number.isSafeInteger(limit)||limit<2||limit>120)
  throw Error('Invalid live jockey colony selection');
 const localsByTrack=new Map();
 for(const trackId of [...new Set(trackIds)].sort()){
  localsByTrack.set(trackId,people.filter(p=>
   p.role==='jockey'&&p.workplaceId===trackId).
   sort((a,b)=>(b.ratings?.ability??0)-(a.ratings?.ability??0)||
    a.id.localeCompare(b.id)));
 }
 const selected=[],ids=new Set(),push=p=>{
  if(!p||ids.has(p.id)||selected.length>=limit)return false;
  selected.push({id:p.id,home_track_id:p.workplaceId});ids.add(p.id);
  return true;
 };
 const tracks=[...localsByTrack.keys()];
 // Two locally based riders for every active player barn before paying for
 // wider options; then round-robin the remaining local budget fairly.
 const localBudget=Math.min(limit,Math.max(tracks.length*2,
  Math.min(80,limit-20)));
 for(let round=0;round<25&&selected.length<localBudget;round++){
  let added=0;
  for(const trackId of tracks){
   if(selected.length>=localBudget)break;
   if(push(localsByTrack.get(trackId)[round]))added++;
  }
  if(!added)break;
 }
 const elsewhere=people.filter(p=>p.role==='jockey'&&!ids.has(p.id));
 for(const tier of ['ELITE','ESTABLISHED']){
  for(const p of elsewhere.filter(x=>x.tier===tier).sort((a,b)=>
   (b.ratings?.ability??0)-(a.ratings?.ability??0)||a.id.localeCompare(b.id))){
   if(selected.length>=limit)break;
   push(p);
  }
 }
 // When a saved older world has no high-tier visitors available, use other
 // real professionals rather than inventing a roster or forfeiting slots.
 for(const p of elsewhere.filter(x=>!ids.has(x.id)).sort((a,b)=>
  (b.ratings?.ability??0)-(a.ratings?.ability??0)||a.id.localeCompare(b.id))){
  if(selected.length>=limit)break;
  push(p);
 }
 return selected;
}

const TRACK_ID=/^(?:T|IT)-[A-Za-z0-9-]+$/;
async function digest(value){
 const bytes=new TextEncoder().encode(JSON.stringify(value));
 const result=new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes));
 return [...result].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function digestRecords(label,records){
 const chunkSize=1000,parallelChunks=16,hashes=[];
 for(let start=0;start<records.length;start+=chunkSize*parallelChunks){
  const pending=[];
  for(let offset=start;offset<Math.min(records.length,start+chunkSize*parallelChunks);
   offset+=chunkSize)
   pending.push(digest(records.slice(offset,offset+chunkSize)));
  hashes.push(...await Promise.all(pending));
 }
 return digest({schema:'WTW_PERSISTED_1999_RECORD_SEQUENCE_SHA256_V1',
  label,count:records.length,chunkSize,hashes});
}
export async function digestPersistent1999GameSnapshot({manifest,entities,cards}){
 const openingHorseCount=manifest?.targetOpeningHorses??manifest?.horseCount??
  entities?.horses?.length??0;
 // Keep the original digest for the previously supported 10k career saves.
 if(openingHorseCount<=10000)return digest({manifest,entities,cards});
 const [manifestHash,horsesHash,peopleHash,organizationsHash,tracksHash,cardsHash]=
  await Promise.all([digest(manifest),digestRecords('horses',entities.horses),
   digestRecords('people',entities.people),
   digestRecords('organizations',entities.organizations),
   digestRecords('tracks',entities.tracks),digestRecords('cards',cards)]);
 return digest({schema:'WTW_PERSISTED_1999_GAME_SNAPSHOT_SHA256_V2',
  manifestHash,entities:{horsesHash,peopleHash,organizationsHash,tracksHash},cardsHash});
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
  (manifest?.targetOpeningHorses??manifest?.horseCount),
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
   manifest.worldId+'-'+(manifest.targetOpeningHorses??manifest.horseCount),
   source:'PERSISTED_FICTIONAL_1999_INDUSTRY',
   sha256:await digestPersistent1999GameSnapshot({manifest,
    entities:{horses,people,organizations,tracks},cards})},
  entities:{horses,people,organizations,tracks},
  calendar:{schema:manifest.calendarSchema,year:1999,cards,
   summary:{raceDays:manifest.scheduledCards,
    scheduledRaces:manifest.scheduledRaces}},
  manifest:{schema:PERSISTED_1999_GAME_BRIDGE_SCHEMA,
   sourceManifest:manifest.schema,worldId:manifest.worldId,
   targetOpeningHorses:manifest.targetOpeningHorses??manifest.horseCount,
   census:{horses:horses.length,people:people.length,
    organizations:organizations.length,tracks:tracks.length},
   scheduledCards:manifest.scheduledCards,scheduledRaces:manifest.scheduledRaces,
   horseNamingRevision:manifest.horseNamingRevision}};
 validateWorld(world);
 const ownerGroups=new Map();
 const operationHorses=new Map();
 for(const h of horses){
  for(const operationId of new Set([h.ownerId,h.managementOrganizationId].filter(Boolean))){
   if(!operationHorses.has(operationId))operationHorses.set(operationId,[]);
   operationHorses.get(operationId).push(h);
  }
 }
 for(const h of horses)if(['RACING','TWO_YEAR_OLD_PROSPECT'].includes(h.status)&&h.ownerId){
  if(!ownerGroups.has(h.ownerId))ownerGroups.set(h.ownerId,[]);
  ownerGroups.get(h.ownerId).push(h);
 }
 const operation=operationId?organizations.find(x=>x.id===operationId):
  organizations.filter(x=>x.id.startsWith('O-FICTIONAL-OWNER-'))
   .sort((a,b)=>(ownerGroups.get(b.id)?.length||0)-(ownerGroups.get(a.id)?.length||0)||
    a.id.localeCompare(b.id))[0];
 if(!operation)throw Error('Selected player operation does not exist in this world');
 // The selected operator's stable is the full canonical racing string. The
 // previous 30-horse slice made the saved 300k census appear complete while
 // silently omitting most horses from playable career records.
 const openingInventory=operationHorses.get(operation.id)||[];
 const openingRoster=ownerGroups.get(operation.id)||[];
 if(!openingRoster.length)throw Error('Selected operation needs an opening runner or training prospect');
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
  const tierBonus={HANDFUL:0,SMALL:3,REGIONAL:7,MAJOR:12,ELITE:18}[
   operation.portfolioTier]??0;
  const resources=operation.ratings?.resources??55;
  const ambition=operation.ratings?.ambition??55;
  const facilityQuality=Math.max(35,Math.min(95,
   Math.round(.62*resources+.23*ambition+.15*55+tierBonus)));
  run.runtime.facilities.sites[siteId]={id:siteId,offer_id:null,
   owner_id:operation.id,operator_organization_id:operation.id,
   name:format1999OpeningBarnName(operation,track),type:'RACING_STABLE',
   residence_kind:'TRACK_TRAINER_BARN',host_track_id:trackId,
   head_trainer_person_id:trainer.id,
   location:{city:loc.city||loc.locality||track.name,
    state:loc.region||loc.state||'Unknown',country:loc.country||'USA'},
   source_kind:'MODELED_1999_GAME_SITE',
   source_ref:'PERSISTED_FICTIONAL_1999_OPENING_WORLD',status:'ACTIVE',
   acquired_date:run.clock.date,open_date:run.clock.date,
   stalls:Math.max(60,group.length),max_stalls:Math.max(60,group.length),
   quality:facilityQuality,daily_upkeep_minor:0,daily_boarding_minor:0,
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
   care_facility_organization_id:source.careFacilityId,
   training_barn_organization_id:source.trainingBarnId,
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
 // Breeding stock and youngstock remain their original canonical world
 // records in the same career database. Put them on the operation roster so
 // the player sees every owned horse, while the racing engine continues to
 // operate only on registered racehorses with game attributes.
 const activeSourceIds=new Set(openingRoster.map(source=>source.id));
 const nonRunners=openingInventory.filter(source=>!activeSourceIds.has(source.id));
 for(const source of nonRunners)run.stable_horse_ids.push(source.id);
 const homeTrack=openingRoster[0].homeTrackId;
 // Selection covers ALL player's actual barn circuits, then adds national
 // available jockeys. Scheduling still controls every signed mount.
 const openingJockeys=select1999CareerJockeyColony(
  people,[...trackGroups.keys()]);
 if(openingJockeys.length>=2){
  const result=dispatchGameCommand({state:run,world,command:{id:'opening-jockey-colony',
   type:'ACTIVATE_JOCKEY_COLONY',actor:'system',
   payload:{jockeys:openingJockeys}}});
  Object.assign(run,result.state);
 }
 validateGameRun(run,world);
 return {schema:PERSISTED_1999_GAME_BRIDGE_SCHEMA,world,run,
  operation,certificate,playableHorseCount:activeIds.length,
  operationInventoryCount:openingInventory.length,
  operationInventoryByStatus:Object.fromEntries([...openingInventory.reduce((counts,h)=>
   counts.set(h.status,(counts.get(h.status)||0)+1),new Map())].sort(([a],[b])=>a.localeCompare(b))),
  openingJockeyCount:openingJockeys.length,
  homeTrackId:homeTrack};
}
