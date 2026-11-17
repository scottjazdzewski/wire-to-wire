/**
 * Offline-first, resumable 1999 whole-industry genesis.
 * Each batch and its progress checkpoint commit in ONE IndexedDB transaction.
 * A world is visible to the game only after its COMPLETE manifest is written.
 * Never changes the legacy founding-world career store.
 */
import {plan1999Ecosystem,planAnnualBroodmareTurnover,
 planAnnualStallionTurnover,planAnnual1999BreedingMarket,
 planAnnualYoungHorseAttrition,seeded1999Unit}
 from './fictional-industry-ecosystem-1999.mjs';
import {plan1999JuvenileDebut,plan1999MatureHorseYear}
 from './fictional-industry-mature-lifecycle-1999.mjs';
import {generate1999IndustryRegistryBatches,count1999Registry,
 create1999SeasonalFoal,project1999HorseForYear}
 from './fictional-industry-registry-1999.mjs';
import {plan1999IndustryStaffing,generate1999StaffingBatches,
 INDUSTRY_PERSON_BIOGRAPHY_REVISION}
 from './fictional-industry-staffing-1999.mjs';
import {createPersonnelNameRoster} from './personnel-name-engine.mjs';
import {LOCAL_HORSE_NAMING_ALGORITHM_REVISION} from '../game/horse-naming-local-v485.js';
import {connect1999Horse,connect1999Person,connect1999DirectoryEntity,
 validate1999GraphBatch,validate1999IndustryReferences,INDUSTRY_GRAPH_SCHEMA}
 from './fictional-industry-graph-1999.mjs';
import {generate1999CoveringLedger,BREEDING_BOOK_1999_SCHEMA}
 from './fictional-industry-breeding-book-1999.mjs';
import {generate1999SeasonFoalingForecasts,resolve1999FoalBirth}
 from './fictional-industry-breeding-book-1999.mjs';
import {buildFictional1999RaceCalendar,FICTIONAL_1999_CALENDAR_SCHEMA}
 from './fictional-world-calendar-v1.mjs';
export const PERSISTENT_INDUSTRY_SCHEMA='WTW_PERSISTENT_INDUSTRY_1999_V1';
export const PERSISTENT_INDUSTRY_DB='WireToWireFictionalIndustry1999V1';
export const PERSISTENT_INDUSTRY_COMPRESSION_SCHEMA='WTW_INDUSTRY_GZIP_JSON_V1';
const compressibleStores=new Set(['horseBatches','personBatches','directory',
 'coveringBatches','calendarBatches']);
const stores=['manifests','horseBatches','personBatches','horseEdits','careerRuns',
 'directory','coveringBatches','calendarBatches','industryLifecycle'];
function request(req){return new Promise((resolve,reject)=>{
 req.onsuccess=()=>resolve(req.result);
 req.onerror=()=>reject(req.error||Error('IndexedDB request failed'));
})}
export async function encodePersistent1999StoredValue(value){
 const json=JSON.stringify(value);
 if(typeof json!=='string'||json.length<1024||
  typeof CompressionStream!=='function'||typeof DecompressionStream!=='function')return value;
 const raw=new TextEncoder().encode(json);
 const stream=new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'));
 const compressed=new Uint8Array(await new Response(stream).arrayBuffer());
 if(compressed.byteLength+64>=raw.byteLength)return value;
 return {schema:PERSISTENT_INDUSTRY_COMPRESSION_SCHEMA,encoding:'gzip',
  rawBytes:raw.byteLength,data:compressed};
}
export async function decodePersistent1999StoredValue(value){
 if(value?.schema!==PERSISTENT_INDUSTRY_COMPRESSION_SCHEMA)return value;
 if(value.encoding!=='gzip'||!(value.data instanceof Uint8Array))
  throw Error('Invalid compressed 1999 industry storage record');
 const stream=new Blob([value.data]).stream().pipeThrough(new DecompressionStream('gzip'));
 const raw=new Uint8Array(await new Response(stream).arrayBuffer());
 if(Number.isSafeInteger(value.rawBytes)&&raw.byteLength!==value.rawBytes)
  throw Error('Compressed 1999 industry record length mismatch');
 return JSON.parse(new TextDecoder().decode(raw));
}
export async function open1999IndustryDatabase(indexedDB=globalThis.indexedDB){
 if(!indexedDB?.open)throw Error('IndexedDB is required for offline industry persistence');
 const db=await new Promise((resolve,reject)=>{
  const req=indexedDB.open(PERSISTENT_INDUSTRY_DB,5);
  req.onupgradeneeded=()=>{
   for(const name of stores)
    if(!req.result.objectStoreNames.contains(name))
     req.result.createObjectStore(name);
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error('Industry database open failed'));
 });
 const writeStored=async(store,key,value)=>new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readwrite');
  tx.objectStore(store).put(value,key);
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error||Error('Industry record compaction failed'));
  tx.onabort=()=>reject(tx.error||Error('Industry record compaction aborted'));
 });
 return {
  async get(store,key){
   if(!stores.includes(store))throw Error('Unknown industry store');
   const stored=await request(db.transaction(store,'readonly').objectStore(store).get(key));
   if(stored?.schema===PERSISTENT_INDUSTRY_COMPRESSION_SCHEMA)
    return decodePersistent1999StoredValue(stored);
   if(stored!==undefined&&compressibleStores.has(store)){
    const compact=await encodePersistent1999StoredValue(stored);
    if(compact!==stored){
     // Rewrite old raw values in place as they are read. The transaction is
     // atomic, so an interrupted upgrade leaves the original record readable.
     try{await writeStored(store,key,compact)}catch{}
    }
   }
   return stored;
  },
  async commitDirectory(worldId,manifest,records){
   const compact=await encodePersistent1999StoredValue(records);
   return new Promise((resolve,reject)=>{
    const tx=db.transaction(['manifests','directory'],'readwrite');
    tx.objectStore('directory').put(compact,worldId);
    tx.objectStore('manifests').put(manifest,worldId);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error||Error('Industry directory commit failed'));
    tx.onabort=()=>reject(tx.error||Error('Industry directory commit aborted'));
   });
  },
  async commitBatch({worldId,manifest,kind,index,records}){
   if(!['horseBatches','personBatches','coveringBatches','calendarBatches'].includes(kind)||
    !Number.isInteger(index)||index<0||!Array.isArray(records)||!records.length)
    throw Error('Invalid industry batch');
   const compact=await encodePersistent1999StoredValue(records);
   return new Promise((resolve,reject)=>{
    const tx=db.transaction(['manifests',kind],'readwrite');
    tx.objectStore(kind).put(compact,worldId+':'+index);
    tx.objectStore('manifests').put(manifest,worldId);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error||Error('Industry batch commit failed'));
    tx.onabort=()=>reject(tx.error||Error('Industry batch aborted'));
   });
  },
  async putCareerRun(worldId,runId,record){
   return new Promise((resolve,reject)=>{
    const tx=db.transaction(['manifests','careerRuns'],'readwrite');
    const manifestReq=tx.objectStore('manifests').get(worldId);
    manifestReq.onsuccess=()=>{
     const manifest=manifestReq.result;
     if(manifest?.status!=='COMPLETE'){
      tx.abort();return;
     }
     tx.objectStore('careerRuns').put(record,worldId+':'+runId);
    };
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error||Error('Career run commit failed'));
    tx.onabort=()=>reject(Error('World incomplete or career run transaction aborted'));
   });
  },
  async commitLifecycleRun({worldKey,runId,record,checkpoint,horseUpdates=[],
   eventWrites=[],dataWrites=[]}){
   if(!worldKey||!runId||!record||!checkpoint||
    !Array.isArray(horseUpdates)||!Array.isArray(eventWrites)||!Array.isArray(dataWrites))
    throw Error('Invalid lifecycle save transaction');
   const runKey=worldKey+':'+runId;
   return new Promise((resolve,reject)=>{
    const tx=db.transaction(['manifests','careerRuns','industryLifecycle'],'readwrite');
    const manifestReq=tx.objectStore('manifests').get(worldKey);
    manifestReq.onsuccess=()=>{
     if(manifestReq.result?.status!=='COMPLETE'){tx.abort();return}
     const lifecycle=tx.objectStore('industryLifecycle');
     const checkpointReq=lifecycle.get(runKey+':checkpoint');
     checkpointReq.onsuccess=()=>{
      const current=checkpointReq.result;
      if(current?.lastDate>checkpoint.lastDate||
       current&&record.gameDate<current.lastDate){tx.abort();return}
      tx.objectStore('careerRuns').put(record,worldKey+':'+runId);
      lifecycle.put(checkpoint,runKey+':checkpoint');
      for(const update of horseUpdates)lifecycle.put(update,runKey+':horse:'+update.id);
      for(const write of eventWrites)lifecycle.put(write.value,write.key);
      for(const write of dataWrites)lifecycle.put(write.value,write.key);
     };
    };
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error||Error('Lifecycle save transaction failed'));
    tx.onabort=()=>reject(tx.error||Error('Lifecycle save transaction aborted'));
   });
  },
  async putHorseEdit(worldId,horseId,edit){
   return request(db.transaction('horseEdits','readwrite')
    .objectStore('horseEdits').put(edit,worldId+':'+horseId));
  },
  async commitManifest(worldId,manifest){
   return new Promise((resolve,reject)=>{
    const tx=db.transaction('manifests','readwrite');
    tx.objectStore('manifests').put(manifest,worldId);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error||Error('Manifest commit failed'));
    tx.onabort=()=>reject(tx.error||Error('Manifest commit aborted'));
   });
  },
  close(){db.close()}
 };
}
const keyOf=(seed,worldId)=>worldId+':'+seed;
function directorySignature(directories){
 let h=2166136261;
 for(const directory of directories){
  for(const entity of directory){
   const value=JSON.stringify(entity);
   for(let i=0;i<value.length;i++){
    h^=value.charCodeAt(i);h=Math.imul(h,16777619);
   }
  }
  h^=directory.length;h=Math.imul(h,16777619);
 }
 return (h>>>0).toString(16).padStart(8,'0');
}
export async function createPersistent1999Industry({
 store,seed=19990101,worldId='WTW1999FullIndustry',targetOpeningHorses=null,
 farms,tracks,owners,batchSize=1000,onProgress=()=>{},yieldControl=async()=>{}
}={}){
 if(!store?.get||!store?.commitBatch||!store?.commitManifest||
  !Number.isSafeInteger(seed)||seed<1||!worldId||
  !Array.isArray(farms)||!farms.length||
  !Array.isArray(tracks)||!tracks.length||
  !Array.isArray(owners)||!owners.length)
  throw Error('Invalid persistent industry genesis request');
 const id=keyOf(seed,worldId);
 const directoryHash=directorySignature([farms,tracks,owners]);
 const existing=await store.get('manifests',id);
 // Reject a changed opening specification before deriving workforce from it.
 // Otherwise an invalid replacement track can hide the more important fact
 // that the caller is trying to reuse an immutable world key for new inputs.
 if(existing&&(existing.schema!==PERSISTENT_INDUSTRY_SCHEMA||
  existing.seed!==seed||existing.worldId!==worldId||existing.batchSize!==batchSize||
  (existing.targetOpeningHorses??null)!==targetOpeningHorses||
  existing.directoryHash!==directoryHash))
  throw Error('Persistent industry generation parameters conflict');
 let plan=plan1999Ecosystem({seed,targetOpeningHorses});
 const purseRatings=tracks.map(track=>connect1999DirectoryEntity(track,{seed,
  type:'track'}).ratings.purseStrength);
 const openingMarket=planAnnual1999BreedingMarket({seed,year:2000,
  averagePurseStrength:purseRatings.reduce((sum,value)=>sum+value,0)/purseRatings.length,
  broodmares:plan.counts.broodmares,stallions:plan.counts.stallions,
  racingPopulation:plan.potentialRacingPopulation,previousLiveFoals:0,
  referenceBroodmares:plan.counts.broodmares});
 plan={...plan,nextSeasonMarketConditions:openingMarket,
  nextSeasonMareTurnover:planAnnualBroodmareTurnover({seed,year:2000,
   broodmares:plan.counts.broodmares,
   eligibleFemalePopulation:plan.nextSeasonMareTurnover.eligibleFemalePopulation,
   marketIndex:openingMarket.marketIndex})};
 const ensureCircuitCoverage=targetOpeningHorses!==null;
 const coverageTracks=ensureCircuitCoverage?tracks.length:0;
 const currentStaffing=plan1999IndustryStaffing({seed,ecosystem:plan,
  minimumRacingTracks:coverageTracks,minimumJockeysPerTrack:2,
  tracks:ensureCircuitCoverage?tracks:null,
  courseDemandTargets:ensureCircuitCoverage});
 // The previous real worlds have one- or two-jockey minimum coverage.
 // Retain their already assigned permanent P-IDs, biography roster and
 // place-of-employment even when new custom worlds use demand-based
 // 16-25 jockey track pools. This also preserves an interrupted genesis.
 const legacyStaffing=plan1999IndustryStaffing({seed,ecosystem:plan,
  minimumRacingTracks:coverageTracks,minimumJockeysPerTrack:1});
 const intermediateStaffing=plan1999IndustryStaffing({seed,ecosystem:plan,
  minimumRacingTracks:coverageTracks,minimumJockeysPerTrack:2});
 const exactCounts=(a,b)=>Object.keys(b).every(role=>
  Number.isSafeInteger(a?.[role])&&a[role]===b[role])&&
  Object.keys(a||{}).length===Object.keys(b).length;
 const storedCounts=existing?.staffing?.counts;
 const legacyCompatible=existing&&exactCounts(storedCounts,legacyStaffing.counts)&&
  (existing.staffing.minimumJockeysPerTrack===undefined||
   existing.staffing.minimumJockeysPerTrack===1);
 const intermediateCompatible=existing&&!existing.staffing.trackJockeyTargets&&
  exactCounts(storedCounts,intermediateStaffing.counts)&&
  existing.staffing.minimumJockeysPerTrack===2;
 const currentCompatible=existing&&exactCounts(storedCounts,currentStaffing.counts)&&
  existing.staffing.minimumJockeysPerTrack===currentStaffing.minimumJockeysPerTrack&&
  JSON.stringify(existing.staffing.trackJockeyTargets??null)===
   JSON.stringify(currentStaffing.trackJockeyTargets??null);
 if(existing&&!legacyCompatible&&!intermediateCompatible&&!currentCompatible)
  throw Error('Existing industry has an unrecognized personnel staffing plan');
 const staffing=existing?existing.staffing:currentStaffing;
 const totalHorses=count1999Registry(plan);
 if(targetOpeningHorses!==null&&totalHorses!==targetOpeningHorses)
  throw Error('Persistent industry size differs from selected world size');
 const horseNamingRevision=LOCAL_HORSE_NAMING_ALGORITHM_REVISION+':OPENING_INDUSTRY_V1';
 const totalPeople=Object.values(staffing.counts).reduce((a,b)=>a+b,0);
 if(existing){
  if(existing.schema!==PERSISTENT_INDUSTRY_SCHEMA||
   existing.seed!==seed||existing.worldId!==worldId||
   existing.batchSize!==batchSize||
   (existing.targetOpeningHorses??null)!==targetOpeningHorses||
   existing.directoryHash!==directoryHash||
   existing.horseCount!==totalHorses||
   existing.personCount!==totalPeople||
   existing.graphSchema!==INDUSTRY_GRAPH_SCHEMA||
   existing.breedingSchema!==BREEDING_BOOK_1999_SCHEMA||
   existing.coveringCount!==plan.minimumCoversForTargetFoals||
   existing.calendarSchema!==FICTIONAL_1999_CALENDAR_SCHEMA||
   existing.horseNamingRevision!==horseNamingRevision||
   existing.personBiographyRevision!==INDUSTRY_PERSON_BIOGRAPHY_REVISION||
   Boolean(existing.ensureCircuitCoverage)!==ensureCircuitCoverage)
   throw Error('Existing industry identity or generation parameters conflict');
  if(existing.status==='COMPLETE')return existing;
 }
 // Generate one deterministic name roster matching the exact chosen staffing
 // plan (including an old saved plan in the middle of resumable genesis).
 const roleCounts=Object.entries(staffing.counts);
 const personnelNames=createPersonnelNameRoster(seed,totalPeople,index=>{
  let offset=index;
  for(const [role,count] of roleCounts){
   if(offset<count)return role;
   offset-=count;
  }
  throw Error('Personnel name index outside opening workforce');
 },[],{normalizeNamesForAccent:true});
 let manifest=existing??{
  schema:PERSISTENT_INDUSTRY_SCHEMA,worldId,seed,batchSize,directoryHash,
  targetOpeningHorses,ensureCircuitCoverage,status:'GENERATING',
  horseCount:totalHorses,personCount:totalPeople,
  horseBatchesCommitted:0,personBatchesCommitted:0,
  directoryCommitted:false,graphSchema:INDUSTRY_GRAPH_SCHEMA,
  horseNamingRevision,personBiographyRevision:INDUSTRY_PERSON_BIOGRAPHY_REVISION,
  breedingSchema:BREEDING_BOOK_1999_SCHEMA,
  coveringCount:plan.minimumCoversForTargetFoals,coveringBatchesCommitted:0,
  calendarSchema:FICTIONAL_1999_CALENDAR_SCHEMA,calendarBatchesCommitted:0,
  scheduledCards:0,scheduledRaces:0,
  plan,staffing,source:'DETERMINISTIC_OFFLINE_1999'
 };
 if(!manifest.directoryCommitted){
  const records=[
   ...tracks.map(t=>connect1999DirectoryEntity(t,{seed,type:'track'})),
   ...farms.map(f=>connect1999DirectoryEntity(f,{seed,type:'farm',
    homeTrackId:tracks.find(t=>f.id.includes(t.id))?.id??null})),
   ...owners.map(o=>connect1999DirectoryEntity(o,{seed,type:'owner',
    homeTrackId:tracks.find(t=>o.id.includes(t.id))?.id??null}))
  ];
  const ids=new Set([...tracks,...farms,...owners].map(e=>e.id));
  const audit=validate1999GraphBatch(records,ids);
  if(!audit.valid)throw Error('Industry directory has broken graph references');
  const next={...manifest,directoryCommitted:true};
  if(!store.commitDirectory)throw Error('Durable directory store unavailable');
  await store.commitDirectory(id,next,records);
  manifest=next;
 }
 // The racing labor market is indexed before horse allocation, so every
 // training/jockey link is a geographically coherent workplace relationship.
 const staffByTrack={trainer:new Map(),jockey:new Map()};
 for(const staffBatch of generate1999StaffingBatches({
  seed,staffing,tracks,farms,batchSize,nameRoster:personnelNames,
  ensureCircuitCoverage
 })){
  for(const person of staffBatch.records){
   if(!['trainer','jockey'].includes(person.role))continue;
   const byTrack=staffByTrack[person.role];
   if(!byTrack.has(person.workplaceId))byTrack.set(person.workplaceId,[]);
   byTrack.get(person.workplaceId).push(person.id);
  }
 }
 for(const track of tracks){
  if(!staffByTrack.trainer.get(track.id)?.length||
   !staffByTrack.jockey.get(track.id)?.length)
   throw Error('Opening circuit lacks a trainer or jockey workforce: '+track.id);
 }
 for(const [kind,generator] of [
  ['horseBatches',generate1999IndustryRegistryBatches({
   seed,plan,farms,tracks,owners,batchSize,emitNames:true})],
  ['personBatches',generate1999StaffingBatches({
   seed,staffing,tracks,farms,batchSize,nameRoster:personnelNames,
   ensureCircuitCoverage})]
 ]){
  const progressKey=kind==='horseBatches'?'horseBatchesCommitted':'personBatchesCommitted';
  let index=0;
  for(const batch of generator){
   if(index<manifest[progressKey]){index++;continue}
   const next={...manifest,[progressKey]:index+1};
   const records=kind==='horseBatches'?
    batch.records.map(h=>connect1999Horse(h,{seed,
     trainerCount:staffing.counts.trainer,jockeyCount:staffing.counts.jockey,
     staffByTrack})):
    batch.records.map(p=>connect1999Person(p,{seed}));
   const audit=validate1999IndustryReferences(records,{
    plan,staffing,tracks,farms,owners});
   if(!audit.valid)throw Error('Broken 1999 industry entity relationships: '+
    JSON.stringify(audit.problems.slice(0,5)));
   await store.commitBatch({worldId:id,manifest:next,kind,index,records});
   manifest=next;index++;
   onProgress({kind,completed:index,totalRecords:kind==='horseBatches'?
    totalHorses:totalPeople});
   if(index%8===0)await yieldControl();
  }
 }
 let coveringIndex=0,coveringsChecked=0;
 for(const batch of generate1999CoveringLedger({
  seed,broodmares:plan.counts.broodmares,stallions:plan.counts.stallions,
  targetCovers:plan.minimumCoversForTargetFoals,batchSize
 })){
  if(coveringIndex<manifest.coveringBatchesCommitted){
   coveringsChecked+=batch.records.length;coveringIndex++;continue;
  }
  for(const cover of batch.records){
   const mare=/^H-FICTIONAL-1999-BROODMARES-(\d{7})$/.exec(cover.mareId);
   const stallion=/^H-FICTIONAL-1999-STALLIONS-(\d{7})$/.exec(cover.stallionId);
   if(!mare||Number(mare[1])>plan.counts.broodmares||
    !stallion||Number(stallion[1])>plan.counts.stallions||
    cover.status!=='COVERING_BOOKED'||cover.liveFoalId!==null)
    throw Error('Invalid 1999 covering relationship '+cover.id);
  }
  const next={...manifest,coveringBatchesCommitted:coveringIndex+1};
  await store.commitBatch({worldId:id,manifest:next,
   kind:'coveringBatches',index:coveringIndex,records:batch.records});
  manifest=next;
  coveringsChecked+=batch.records.length;coveringIndex++;
  onProgress({kind:'coveringBatches',completed:coveringIndex,
   totalRecords:plan.minimumCoversForTargetFoals});
  if(coveringIndex%8===0)await yieldControl();
 }
 if(coveringsChecked!==plan.minimumCoversForTargetFoals)
  throw Error('1999 covering ledger did not reconcile to planned bookings');
 const calendar=buildFictional1999RaceCalendar(tracks,{seed});
 if(calendar.unprogrammedTrackIds.length)
  throw Error('Tracks missing approved 1999 racing programs: '+
   calendar.unprogrammedTrackIds.join(', '));
 if(!calendar.summary.raceDays||!calendar.summary.scheduledRaces)
  throw Error('Opening 1999 world has no race opportunities');
 const calendarBatchSize=100;
 for(let i=0;i<calendar.cards.length;i+=calendarBatchSize){
  const index=Math.floor(i/calendarBatchSize);
  if(index<manifest.calendarBatchesCommitted)continue;
  const cards=calendar.cards.slice(i,i+calendarBatchSize);
  for(const card of cards){
   if(!tracks.some(t=>t.id===card.trackId)||card.races.length===0||
    card.races.some(r=>r.status!=='SCHEDULED'||r.winnerId!==null||
     r.fieldHorseIds.length!==0))
    throw Error('Invalid unopened 1999 race card '+card.id);
  }
  const next={...manifest,calendarBatchesCommitted:index+1,
   scheduledCards:calendar.summary.raceDays,
   scheduledRaces:calendar.summary.scheduledRaces,
   tracksWithCards:calendar.summary.tracksWithCards};
  await store.commitBatch({worldId:id,manifest:next,kind:'calendarBatches',
   index,records:cards});
  manifest=next;
  onProgress({kind:'calendarBatches',completed:index+1,
   totalRecords:calendar.summary.raceDays});
  if((index+1)%8===0)await yieldControl();
 }
 manifest={...manifest,status:'COMPLETE'};
 await store.commitManifest(id,manifest);
 return manifest;
}
export async function readPersistent1999IndustryBatch(store,manifest,kind,index){
 if(manifest?.schema!==PERSISTENT_INDUSTRY_SCHEMA||
  manifest.status!=='COMPLETE'||
  !['horseBatches','personBatches','coveringBatches','calendarBatches'].includes(kind)||
  !Number.isInteger(index)||index<0||
  index>=(kind==='horseBatches'?manifest.horseBatchesCommitted:
   kind==='personBatches'?manifest.personBatchesCommitted:
   kind==='coveringBatches'?manifest.coveringBatchesCommitted:
   manifest.calendarBatchesCommitted))
  throw Error('Industry is not complete or batch is unavailable');
 const records=await store.get(kind,keyOf(manifest.seed,manifest.worldId)+':'+index);
 if(!records)throw Error('Industry batch missing from durable storage');
 return records;
}

/**
 * O(1) indexed lookup of a permanent horse identity. Reads exactly one
 * persisted batch; never rebuilds the 200k+ horse population to open a profile.
 */
export async function findPersistent1999Horse(store,manifest,horseId){
 if(manifest?.status!=='COMPLETE'||typeof horseId!=='string')
  throw Error('Completed world and horse ID required');
 const match=/^H-FICTIONAL-1999-(BROODMARES|STALLIONS|YEARLINGS|TWOYEAROLDPROSPECTS|THREEYEAROLDRUNNERS|FOURYEAROLDRUNNERS|FIVEPLUSRUNNERS)-(\d{7})$/.exec(horseId);
 if(!match)return null;
 const names=['broodmares','stallions','yearlings','twoYearOldProspects',
  'threeYearOldRunners','fourYearOldRunners','fivePlusRunners'];
 const tokens=['BROODMARES','STALLIONS','YEARLINGS','TWOYEAROLDPROSPECTS',
  'THREEYEAROLDRUNNERS','FOURYEAROLDRUNNERS','FIVEPLUSRUNNERS'];
 const position=tokens.indexOf(match[1]);
 const index=Number(match[2])-1;
 if(index<0||index>=manifest.plan.counts[names[position]])return null;
 let global=index;
 for(let i=0;i<position;i++)global+=manifest.plan.counts[names[i]];
 const batchIndex=Math.floor(global/manifest.batchSize);
 const records=await readPersistent1999IndustryBatch(store,manifest,'horseBatches',batchIndex);
 return records[global%manifest.batchSize]?.id===horseId?
  records[global%manifest.batchSize]:null;
}

/** Player-owned changes are stored separately; regeneration cannot overwrite them. */
export async function updatePersistent1999Horse(store,manifest,horseId,edit){
 const horse=await findPersistent1999Horse(store,manifest,horseId);
 if(!horse)throw Error('Unknown persistent horse');
 if(!store.putHorseEdit)throw Error('Persistent horse edits are unavailable');
 if(!edit||typeof edit!=='object'||Array.isArray(edit)||
  Object.keys(edit).some(key=>!['name','ownerId','trainerId','status'].includes(key)))
  throw Error('Horse edit contains immutable or unsupported fields');
 if('name'in edit&&(typeof edit.name!=='string'||!edit.name.trim()||
  edit.name.length>36))throw Error('Invalid horse name');
 await store.putHorseEdit(keyOf(manifest.seed,manifest.worldId),horseId,edit);
 return {...horse,...edit};
}
export async function readPersistent1999HorseProfile(store,manifest,horseId,{runId=null}={}){
 const canonicalRunId=runId??('WTW-RUN-1999-'+manifest.seed+'-SIZE-'+
  (manifest.targetOpeningHorses??manifest.horseCount));
 const checkpoint=await store.get('industryLifecycle',lifecycleKey(
  lifecycleRunKey(manifest,canonicalRunId),'checkpoint'));
 const horse=checkpoint?await readPersistent1999LifecycleHorse(store,manifest,
  canonicalRunId,horseId):await findPersistent1999Horse(store,manifest,horseId);
 if(!horse)return null;
 const edit=await store.get('horseEdits',keyOf(manifest.seed,manifest.worldId)+':'+horseId);
 return {...horse,...(edit||{})};
}

/**
 * Career runtime is an independent, mutable checkpoint referencing the
 * immutable COMPLETE industry manifest. Saving does not rewrite horse batches.
 */
export async function savePersistent1999CareerRun(store,manifest,{
 runId,gameDate='1999-01-01',player,changes={},version=1
}={}){
 if(manifest?.schema!==PERSISTENT_INDUSTRY_SCHEMA||
  manifest.status!=='COMPLETE'||!store?.commitLifecycleRun||
  typeof runId!=='string'||!/^[-A-Za-z0-9_]{1,80}$/.test(runId)||
  !validCalendarDate(gameDate)||
  !player||typeof player!=='object'||Array.isArray(player)||
  !changes||typeof changes!=='object'||Array.isArray(changes)||
  !Number.isSafeInteger(version)||version<1)
  throw Error('Invalid persistent industry career run');
 const existing=await loadPersistent1999CareerRun(store,manifest,runId);
 if(existing&&validCalendarDate(existing.gameDate)&&gameDate<existing.gameDate)
  throw Error('Career run date cannot move backward');
 const lifecycle=await advancePersistent1999IndustryLifecycle(store,manifest,
  {runId,gameDate});
 const record={schema:'WTW_INDUSTRY_CAREER_RUN_V1',
  worldId:manifest.worldId,worldSeed:manifest.seed,
  worldSchema:manifest.schema,runId,gameDate,
  player:structuredClone(player),changes:structuredClone(changes),version,
  lifecycle:structuredClone(lifecycle.checkpoint)};
 await store.commitLifecycleRun({worldKey:keyOf(manifest.seed,manifest.worldId),
  runId,record,checkpoint:lifecycle.checkpoint,
  horseUpdates:lifecycle.horseUpdates,eventWrites:lifecycle.eventWrites,
  dataWrites:lifecycle.dataWrites});
 return record;
}
export async function loadPersistent1999CareerRun(store,manifest,runId){
 if(manifest?.status!=='COMPLETE'||typeof runId!=='string')
  throw Error('Completed world and run ID required');
 const record=await store.get('careerRuns',
  keyOf(manifest.seed,manifest.worldId)+':'+runId);
 if(!record)return null;
 if(record.schema!=='WTW_INDUSTRY_CAREER_RUN_V1'||
  record.worldId!==manifest.worldId||record.worldSeed!==manifest.seed||
  record.worldSchema!==manifest.schema)
  throw Error('Career run references a different world');
 const checkpoint=await store.get('industryLifecycle',
  lifecycleKey(lifecycleRunKey(manifest,runId),'checkpoint'));
 if(checkpoint&&(!record.lifecycle||checkpoint.lastDate!==record.lifecycle.lastDate||
  checkpoint.seasonYear!==record.lifecycle.seasonYear))
  throw Error('Career save and industry lifecycle checkpoint disagree');
 if(!checkpoint&&record.lifecycle)
  throw Error('Career lifecycle checkpoint is missing from durable storage');
 return {...record,lifecycle:checkpoint??record.lifecycle??null};
}

/** Effective per-career horse record; births and status changes survive reopen. */
export async function readPersistent1999LifecycleHorse(store,manifest,runId,horseId){
 if(manifest?.status!=='COMPLETE'||typeof runId!=='string'||typeof horseId!=='string')
  throw Error('Completed world, career and horse identity required');
 const runKey=lifecycleRunKey(manifest,runId);
 const checkpoint=await store.get('industryLifecycle',lifecycleKey(runKey,'checkpoint'));
 const state=await store.get('industryLifecycle',lifecycleHorseKey(runKey,horseId));
 const base=state?.kind==='BORN'?null:await findPersistent1999Horse(store,manifest,horseId);
 const horse=statusPatch(base,state);
 if(!horse)return null;
 return project1999HorseForYear(horse,checkpoint?.seasonYear??1999);
}

/** Read unborn foal forecasts separately from the living horse registry. */
export async function readPersistent1999FoalForecasts(store,manifest,runId,year,date=null){
 if(manifest?.status!=='COMPLETE'||typeof runId!=='string'||
  !Number.isInteger(year)||year<1999||year>9998||
  (date!==null&&(!validCalendarDate(date)||Number(date.slice(0,4))!==year)))
  throw Error('Invalid lifecycle foaling forecast lookup');
 const runKey=lifecycleRunKey(manifest,runId),records=[];
 if(date!==null){
  const rows=await store.get('industryLifecycle',lifecycleForecastKey(runKey,year,date))||[];
  const events=await store.get('industryLifecycle',lifecycleKey(runKey,'events:'+date))||[];
  const resolved=new Set(events.filter(event=>
   ['FOAL_BORN','PREGNANCY_LOSS'].includes(event.type))
   .map(event=>event.coveringId));
  for(const forecast of rows){
   const born=await store.get('industryLifecycle',lifecycleHorseKey(runKey,forecast.foalId));
   records.push({...forecast,resolved:resolved.has(forecast.coveringId),
    materialized:born?.kind==='BORN'});
  }
  return records;
 }
 // Forecast dates are bounded to February through July; query the calendar
 // instead of loading the entire world or treating these rows as horse records.
 const first=Date.UTC(year,1,1),last=Date.UTC(year,7,1);
 for(let time=first;time<last;time+=86400000){
  const day=new Date(time).toISOString().slice(0,10);
  const rows=await store.get('industryLifecycle',lifecycleForecastKey(runKey,year,day))||[];
  const events=await store.get('industryLifecycle',lifecycleKey(runKey,'events:'+day))||[];
  const resolved=new Set(events.filter(event=>
   ['FOAL_BORN','PREGNANCY_LOSS'].includes(event.type))
   .map(event=>event.coveringId));
  for(const forecast of rows){
   const born=await store.get('industryLifecycle',lifecycleHorseKey(runKey,forecast.foalId));
   records.push({...forecast,resolved:resolved.has(forecast.coveringId),
    materialized:born?.kind==='BORN'});
  }
 }
 return records;
}

export async function readPersistent1999LifecycleEvents(store,manifest,runId,date){
 if(manifest?.status!=='COMPLETE'||typeof runId!=='string'||!validCalendarDate(date))
  throw Error('Invalid lifecycle event lookup');
 return await store.get('industryLifecycle',lifecycleKey(
  lifecycleRunKey(manifest,runId),'events:'+date))||[];
}


/** Lookup a persistent person directly by role and permanent ordinal ID. */
export async function findPersistent1999Person(store,manifest,personId){
 if(manifest?.status!=='COMPLETE'||typeof personId!=='string')
  throw Error('Completed world and person ID required');
 const match=/^P-FICTIONAL-1999-([A-Z-]+)-(\d{7})$/.exec(personId);
 if(!match)return null;
 const roles=Object.keys(manifest.staffing?.counts||{});
 const token=match[1],position=roles.findIndex(r=>
  r.toUpperCase().replaceAll('_','-')===token);
 if(position<0)return null;
 const ordinal=Number(match[2]);
 if(ordinal<1||ordinal>manifest.staffing.counts[roles[position]])return null;
 let global=ordinal-1;
 for(let i=0;i<position;i++)global+=manifest.staffing.counts[roles[i]];
 const batchIndex=Math.floor(global/manifest.batchSize);
 const records=await readPersistent1999IndustryBatch(store,manifest,'personBatches',batchIndex);
 const person=records[global%manifest.batchSize];
 return person?.id===personId?person:null;
}
export async function readPersistent1999Directory(store,manifest){
 if(manifest?.status!=='COMPLETE'||!manifest.directoryCommitted)
  throw Error('Industry directory is incomplete');
 const directory=await store.get('directory',keyOf(manifest.seed,manifest.worldId));
 if(!Array.isArray(directory))throw Error('Industry directory missing');
 return directory;
}

const lifecycleRunKey=(manifest,runId)=>keyOf(manifest.seed,manifest.worldId)+':'+runId;
const lifecycleKey=(runKey,suffix)=>runKey+':'+suffix;
const lifecycleHorseKey=(runKey,id)=>lifecycleKey(runKey,'horse:'+id);
const lifecycleForecastKey=(runKey,year,date)=>
 lifecycleKey(runKey,'forecast:'+year+':'+date);
const lifecyclePoolKey=(runKey,year)=>lifecycleKey(runKey,'breeding-pool:'+year);
const lifecycleStallionPoolKey=(runKey,year)=>lifecycleKey(runKey,'stallion-pool:'+year);
const BASE_COHORT_ORDER=['broodmares','stallions','yearlings','twoYearOldProspects',
 'threeYearOldRunners','fourYearOldRunners','fivePlusRunners'];
function cohortRange(manifest,cohort){
 let start=0;
 for(const name of BASE_COHORT_ORDER){
  const count=manifest.plan.counts[name]||0;
  if(name===cohort)return {start,count};
  start+=count;
 }
 throw Error('Unknown opening horse cohort '+cohort);
}
async function readBaseCohort(store,manifest,cohort){
 const {start,count}=cohortRange(manifest,cohort),records=[];
 for(let position=start;position<start+count;){
  const batchIndex=Math.floor(position/manifest.batchSize);
  const batch=await readPersistent1999IndustryBatch(store,manifest,'horseBatches',batchIndex);
  const from=position-batchIndex*manifest.batchSize;
  const take=Math.min(start+count-position,batch.length-from);
  records.push(...batch.slice(from,from+take));position+=take;
 }
 return records;
}
function validCalendarDate(date){
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const parsed=new Date(date+'T00:00:00.000Z');
 return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===date;
}
function nextCalendarDate(date){
 return new Date(Date.parse(date+'T00:00:00.000Z')+86400000)
  .toISOString().slice(0,10);
}
function birthYearCohort(year){
 return ({1998:'yearlings',1997:'twoYearOldProspects',
  1996:'threeYearOldRunners',1995:'fourYearOldRunners'})[year]||null;
}
function statusPatch(base,state){
 if(state?.kind==='BORN')return {...state.horse,...(state.patch||{})};
 return state?.patch?{...(base||{}),...state.patch}:base;
}
function statusUpdate(horse,patch){
 if(horse.registryProvenance==='MODELED_SEASONAL_BIRTH')
  return {id:horse.id,kind:'BORN',horse:{...horse,...patch}};
 // Each sidecar replaces the previous sidecar, not merges with it. Carry
 // committed development, debut and breeding history across later transitions.
 // STATUS sidecars replace prior STATUS sidecars. Carry the effective status
 // itself as well as supporting attributes or a later development update can
 // silently undo a saved juvenile debut or retirement.
 const keys=['status','cohort','sex','development','racingDebutDate',
  'racingReadiness',
  'lastReadinessReview','nextReadinessReview','developmentYear',
  'progressionYear','lastProgressionStage','homeTrackId',
  'trainerId','relationships',
  'retirementYear','retirementReason','graduatedYear','breedingStatus'];
 const carried=Object.fromEntries(keys.filter(key=>horse[key]!==undefined)
  .map(key=>[key,horse[key]]));
 return {id:horse.id,kind:'STATUS',patch:{...carried,...patch}};
}
async function readPoolRecords(store,manifest,runKey,year,overrideMap=new Map(),
 poolOverride=null,graduatedYears=new Map()){
 if(poolOverride)return poolOverride;
 const ids=await store.get('industryLifecycle',lifecyclePoolKey(runKey,year));
 if(!Array.isArray(ids))throw Error('Lifecycle breeding pool is missing');
 const base=await readBaseCohort(store,manifest,'broodmares');
 const byId=new Map(base.map(h=>[h.id,h])),records=[];
 for(const id of ids){
  let stored=byId.get(id)||null;
  let state=overrideMap.get(id)||null;
  // An opening broodmare still present in the persisted active pool has not
  // retired. Avoid one IndexedDB transaction per mare; graduates remain in
  // the separate history set and are loaded from their sidecar when needed.
  if(!state&&(!stored||graduatedYears.has(id)))
   state=await store.get('industryLifecycle',lifecycleHorseKey(runKey,id));
  if(!stored&&state?.kind!=='BORN')stored=await findPersistent1999Horse(store,
   manifest,id);
  const horse=statusPatch(stored,state);
  if(!horse||horse.status!=='BROODMARE')
   throw Error('Lifecycle breeding pool contains a missing or inactive mare: '+id);
  records.push(horse);
 }
 return records;
}
async function readStallionPoolRecords(store,manifest,runKey,year,
 overrideMap=new Map(),poolOverride=null){
 if(poolOverride)return poolOverride;
 const ids=await store.get('industryLifecycle',lifecycleStallionPoolKey(runKey,year));
 if(!Array.isArray(ids)){
  const priorEvent=await store.get('industryLifecycle',
   lifecycleKey(runKey,'events:'+year+'-01-01'))||[];
  if(priorEvent.some(event=>event.type==='STALLION_TURNOVER'))
   throw Error('Lifecycle stallion pool is missing after a committed turnover');
  // Older careers predate individual stallion transitions. Their valid
  // opening stallions remain the current active pool until the next rollover.
  return (await readBaseCohort(store,manifest,'stallions'))
   .map(h=>project1999HorseForYear(h,year));
 }
 const base=await readBaseCohort(store,manifest,'stallions');
 const byId=new Map(base.map(h=>[h.id,h])),records=[];
 for(const id of ids){
  let stored=byId.get(id)||null;
  let state=overrideMap.get(id)||null;
  if(!state&&(!stored||stored.registryProvenance==='MODELED_SEASONAL_BIRTH'))
   state=await store.get('industryLifecycle',lifecycleHorseKey(runKey,id));
  if(!stored&&state?.kind!=='BORN')stored=await findPersistent1999Horse(store,
   manifest,id);
  const horse=statusPatch(stored,state);
  if(!horse||horse.status!=='STALLION')
   throw Error('Lifecycle stallion pool contains a missing or inactive horse: '+id);
  records.push(project1999HorseForYear(horse,year));
 }
 if(new Set(records.map(h=>h.id)).size!==records.length)
  throw Error('Lifecycle stallion pool contains duplicate identities');
 return records;
}
async function readEligibleFemaleCandidates(store,manifest,runKey,nextYear,
 overrideMap=new Map(),birthCohortCache=new Map(),graduatedYears=new Map()){
 const priorYear=nextYear-1,candidates=[],seen=new Set();
 for(const year of [priorYear-3,priorYear-4]){
  const cohort=birthYearCohort(year);
  const baseById=new Map();
  if(cohort){
   for(const base of await readBaseCohort(store,manifest,cohort)){
    baseById.set(base.id,base);
    if(base.foalYear!==year||graduatedYears.has(base.id))continue;
    const state=overrideMap.get(base.id);
    const projected=project1999HorseForYear(state?statusPatch(base,state):base,priorYear);
    if(projected.sex==='MARE'&&projected.status==='RACING'&&!seen.has(base.id)){
     seen.add(base.id);candidates.push(projected);
    }
   }
  }
  const storedIds=birthCohortCache.has(year)?birthCohortCache.get(year):
   await store.get('industryLifecycle',lifecycleKey(runKey,'foal-cohort:'+year))||[];
  const bornIds=storedIds instanceof Set?storedIds:new Set(storedIds);
  for(const id of bornIds){
   if(graduatedYears.has(id))continue;
   const base=baseById.get(id)||null;
   let state=overrideMap.get(id)||null;
   if(!state&&(!base||graduatedYears.has(id)))state=
    await store.get('industryLifecycle',lifecycleHorseKey(runKey,id));
   const horse=statusPatch(base,state);
   const projected=horse?.foalYear===year?project1999HorseForYear(horse,priorYear):null;
   if(projected?.sex==='MARE'&&projected.status==='RACING'&&!seen.has(id)){
    seen.add(id);candidates.push(projected);
   }
  }
 }
 return candidates;
}
async function readEligibleStallionCandidates(store,manifest,runKey,nextYear,
 overrideMap=new Map(),birthCohortCache=new Map(),graduatedYears=new Map()){
 const priorYear=nextYear-1,candidates=[],seen=new Set();
 const eligibleMale=horse=>horse&&horse.status==='RACING'&&
  ['COLT','HORSE'].includes(horse.sex);
 for(const year of [priorYear-3,priorYear-4]){
  const cohort=birthYearCohort(year),baseById=new Map();
  if(cohort){
   for(const base of await readBaseCohort(store,manifest,cohort)){
    baseById.set(base.id,base);
    if(base.foalYear!==year||graduatedYears.has(base.id))continue;
    const state=overrideMap.get(base.id);
    const projected=project1999HorseForYear(state?statusPatch(base,state):base,priorYear);
    if(eligibleMale(projected)&&!seen.has(base.id)){
     seen.add(base.id);candidates.push(projected)}
   }
  }
  const storedIds=birthCohortCache.has(year)?birthCohortCache.get(year):
   await store.get('industryLifecycle',lifecycleKey(runKey,'foal-cohort:'+year))||[];
  const bornIds=storedIds instanceof Set?storedIds:new Set(storedIds);
  for(const id of bornIds){
   if(graduatedYears.has(id))continue;
   const base=baseById.get(id)||null;
   let state=overrideMap.get(id)||null;
   if(!state)state=await store.get('industryLifecycle',lifecycleHorseKey(runKey,id));
   const horse=statusPatch(base,state);
   const projected=horse?.foalYear===year?
    project1999HorseForYear(horse,priorYear):null;
   if(eligibleMale(projected)&&!seen.has(id)){
    seen.add(id);candidates.push(projected);
   }
  }
 }
 return candidates;
}
function makeBirthForecastPlan({seed,year,coverings,mareById,runKey,plannedFoals}){
 const byDate=new Map();
 let total=0;
 for(const batch of generate1999SeasonFoalingForecasts({seed,year,coverings,
  mareById,batchSize:4000}))for(const forecast of batch.records){
  if(!forecast.ownerId||!forecast.foalingFarmId)
   throw Error('Foaling forecast has no owner or foaling location');
  if(!byDate.has(forecast.birthDate))byDate.set(forecast.birthDate,[]);
  byDate.get(forecast.birthDate).push(forecast);total++;
 }
 const dataWrites=[...byDate].map(([date,records])=>({
  key:lifecycleForecastKey(runKey,year,date),value:records}));
 return {dataWrites,pregnancyForecastCount:total};
}
function marketPlanForSeason(manifest,directory,{year,broodmares,stallions,
 racingPopulation,previousLiveFoals,initial=false}={}){
 const strengths=directory.filter(entity=>entity.id?.startsWith('T-'))
  .map(entity=>entity.ratings?.purseStrength).filter(Number.isFinite);
 const averagePurseStrength=strengths.length?
  strengths.reduce((sum,value)=>sum+value,0)/strengths.length:50;
 const market=planAnnual1999BreedingMarket({seed:manifest.seed,year,
  averagePurseStrength,broodmares,stallions,racingPopulation,
  previousLiveFoals,referenceBroodmares:manifest.plan.counts.broodmares});
 const basePlan=initial?manifest.plan:plan1999Ecosystem({seed:manifest.seed,year,
  previousBroodmares:broodmares,worldScale:manifest.plan.worldScale??1});
 const requestedFoals=Math.max(1,Math.round(basePlan.counts.annualFoals*
  market.marketIndex));
 const requestedCovers=Math.ceil(Math.ceil(requestedFoals/.96)/.90);
 const serviceCapacity=Math.min(broodmares,stallions*220,
  initial?manifest.coveringCount:Number.MAX_SAFE_INTEGER);
 const targetCovers=Math.min(serviceCapacity,requestedCovers);
 const plannedFoals=targetCovers<requestedCovers?
  Math.min(requestedFoals,basePlan.counts.annualFoals):requestedFoals;
 return {...market,basePlannedFoals:basePlan.counts.annualFoals,
  requestedFoals,plannedFoals,targetCovers,
  constrainedByBreedingCapacity:plannedFoals<requestedFoals};
}
async function prepareLifecycleSeason(store,manifest,runKey,{year,mareRecords,
 stallionRecords,market,initial=false}={}){
 if(!Array.isArray(mareRecords)||!mareRecords.length)
  throw Error('A seasonal breeding plan needs at least one active broodmare');
 if(!Array.isArray(stallionRecords)||!stallionRecords.length)
  throw Error('A seasonal breeding plan needs at least one active stallion');
 const mareById=new Map(mareRecords.map(h=>[h.id,h]));
 if(mareById.size!==mareRecords.length||mareRecords.some(h=>h.status!=='BROODMARE'))
  throw Error('Seasonal breeding pool has duplicate or inactive mares');
 const stallionById=new Map(stallionRecords.map(h=>[h.id,h]));
 if(stallionById.size!==stallionRecords.length||
  stallionRecords.some(h=>h.status!=='STALLION'))
  throw Error('Seasonal stallion pool has duplicate or inactive horses');
 let coverings=[],coverWrites=[];
 const plannedFoals=market.plannedFoals;
 if(initial){
  for(let i=0;i<manifest.coveringBatchesCommitted;i++)
   coverings.push(...await readPersistent1999IndustryBatch(store,manifest,
    'coveringBatches',i));
  // Scale the persisted 1999 book evenly across stallions and mares when
  // purse and supply conditions call for a smaller crop.
  if(market.targetCovers<coverings.length){
   const source=coverings,target=[];
   for(let i=0;i<market.targetCovers;i++)
    target.push(source[Math.floor(i*source.length/market.targetCovers)]);
   coverings=target;
  }
 }else{
  const stallionIds=stallionRecords.map(h=>h.id);
  let index=0;
  for(const batch of generate1999CoveringLedger({seed:manifest.seed,year,
   broodmares:mareRecords.length,stallions:stallionIds.length,
   targetCovers:market.targetCovers,
   mareIds:mareRecords.map(h=>h.id),stallionIds,batchSize:manifest.batchSize})){
   coverings.push(...batch.records);
   coverWrites.push({key:lifecycleKey(runKey,'coverings:'+year+':'+index),
    value:batch.records});index++;
  }
 }
 const farms=await readPersistent1999Directory(store,manifest);
 const farmById=new Map(farms.map(f=>[f.id,f]));
 const forecast=makeBirthForecastPlan({seed:manifest.seed,year,coverings,
  mareById,runKey,plannedFoals});
 const dataWrites=[...coverWrites,...forecast.dataWrites,
  {key:lifecyclePoolKey(runKey,year),value:mareRecords.map(h=>h.id)},
  {key:lifecycleStallionPoolKey(runKey,year),
   value:stallionRecords.map(h=>h.id)},
  {key:lifecycleKey(runKey,'market:'+year),value:market},
  {key:lifecycleKey(runKey,'season:'+year),value:{year,
   coveringCount:coverings.length,pregnancyForecastCount:forecast.pregnancyForecastCount,
   plannedFoals,marketIndex:market.marketIndex,marketConditions:market,
   provenance:'MARKET_ADJUSTED_SEASONAL_FOAL_FORECAST'}}];
 return {dataWrites,coveringCount:coverings.length,
  pregnancyForecastCount:forecast.pregnancyForecastCount,plannedFoals,farmById};
}
async function turnoverForYear(store,manifest,runKey,year,horseUpdates,
 {overrideMap=new Map(),poolCache=new Map(),stallionPoolCache=new Map(),
  maturePoolCache=new Map(),birthCohortCache=new Map(),graduatedYears=new Map(),
  graduatedStallionYears=new Map(),directory,racingPopulation,
  previousLiveFoals=0}={}){
 const openingMares=await readPoolRecords(store,manifest,runKey,year-1,
  overrideMap,poolCache.get(year-1)||null,graduatedYears);
 const openingStallions=(await readStallionPoolRecords(store,manifest,runKey,
  year-1,overrideMap,stallionPoolCache.get(year-1)||null))
  .map(h=>project1999HorseForYear(h,year));
 // Opening census rows never mutate. A retired or deceased runner must
 // not be selected again merely because its immutable 1999 row says RACING.
 const priorMatureLedger=year===2000?null:
  (maturePoolCache.get(year-1)||await store.get('industryLifecycle',
   lifecycleKey(runKey,'mature-pool:'+(year-1))));
 const activeRacingIds=Array.isArray(priorMatureLedger)?
  new Set(priorMatureLedger.filter(h=>h.status==='RACING').map(h=>h.id)):null;
 const stillRacing=horse=>!activeRacingIds||activeRacingIds.has(horse.id);
 const eligible=(await readEligibleFemaleCandidates(store,manifest,runKey,year,
  overrideMap,birthCohortCache,graduatedYears)).filter(stillRacing);
 const eligibleMales=(await readEligibleStallionCandidates(store,manifest,runKey,
  year,overrideMap,birthCohortCache,graduatedStallionYears)).filter(stillRacing);
 const market=marketPlanForSeason(manifest,directory,{year,
  broodmares:openingMares.length,stallions:openingStallions.length,
  racingPopulation,previousLiveFoals});
 const turnover=planAnnualBroodmareTurnover({seed:manifest.seed,year,
  broodmares:openingMares.length,eligibleFemalePopulation:eligible.length,
  marketIndex:market.marketIndex});
 const rank=(type,h)=>seeded1999Unit(manifest.seed,type+':'+year+':'+h.id);
 // Market turnover is a floor on retirements: no 40-year-old broodmares.
 const forcedMareRetireIds=openingMares.filter(h=>year-Number(h.foalYear)>=26)
  .map(h=>h.id);
 const retireIds=new Set([...forcedMareRetireIds,
  ...[...openingMares].sort((a,b)=>rank('retire',a)-rank('retire',b)||
   a.id.localeCompare(b.id)).slice(0,Math.max(0,turnover.retired-
    forcedMareRetireIds.length)).map(h=>h.id)]);
 const mareGraduates=[...eligible].sort((a,b)=>rank('graduate',a)-rank('graduate',b)||
  a.id.localeCompare(b.id)).slice(0,turnover.graduatedIntoBreeding);
 for(const mare of openingMares)if(retireIds.has(mare.id)){
  const update=statusUpdate(mare,{status:'RETIRED_BROODMARE',
   cohort:'retiredBroodmares',breedingStatus:'RETIRED',retirementYear:year});
  horseUpdates.push(update);overrideMap.set(mare.id,update);
 }
 for(const mare of mareGraduates){
  const update=statusUpdate(mare,{status:'BROODMARE',cohort:'broodmares',
   breedingStatus:'ACTIVE',graduatedYear:year});
  horseUpdates.push(update);overrideMap.set(mare.id,update);
 }
 const nextPool=openingMares.filter(h=>!retireIds.has(h.id))
  .concat(mareGraduates.map(h=>({...h,status:'BROODMARE',cohort:'broodmares',
   breedingStatus:'ACTIVE',graduatedYear:year})));
 if(new Set(nextPool.map(h=>h.id)).size!==nextPool.length)
  throw Error('Broodmare turnover produced duplicate identities');
 poolCache.set(year,nextPool);
 const stallionPlan=planAnnualStallionTurnover({seed:manifest.seed,year,
  stallions:openingStallions.length,eligibleMalePopulation:eligibleMales.length,
  targetCovers:market.targetCovers,marketIndex:market.marketIndex});
 const rankedForRetirement=[...openingStallions].sort((a,b)=>{
  const score=h=>(h.age||0)*5-(h.ratings?.breedingValue||50)*.12+
   rank('stallion-retire',h)*8;
  return score(b)-score(a)||a.id.localeCompare(b.id);
 });
 const overAge=rankedForRetirement.filter(h=>(h.age||0)>=24)
  .map(h=>h.id);
 const overAgeSet=new Set(overAge);
 const stallionRetireCount=Math.min(openingStallions.length,
  Math.max(overAge.length,stallionPlan.marketRetirements));
 const retiredStallionIds=new Set([
  ...overAge,...rankedForRetirement.filter(h=>!overAgeSet.has(h.id))
   .slice(0,Math.max(0,stallionRetireCount-overAge.length)).map(h=>h.id)
 ]);
 for(const stallion of openingStallions)if(retiredStallionIds.has(stallion.id)){
  const update=statusUpdate(stallion,{status:'RETIRED_STALLION',
   cohort:'retiredStallions',breedingStatus:'RETIRED',retirementYear:year});
  horseUpdates.push(update);overrideMap.set(stallion.id,update);
 }
 const vacancies=Math.max(0,stallionPlan.targetActiveStallions-
  (openingStallions.length-retiredStallionIds.size));
 const stallionGraduates=[...eligibleMales].sort((a,b)=>{
  const quality=h=>(h.ratings?.breedingValue||50)*.45+
   (h.development?.potential||50)*.35+(h.ratings?.class||50)*.2+
   rank('stallion-graduate',h)*4;
  return quality(b)-quality(a)||a.id.localeCompare(b.id);
 }).slice(0,Math.min(vacancies,eligibleMales.length));
 for(const horse of stallionGraduates){
  const update=statusUpdate(horse,{status:'STALLION',cohort:'stallions',
   breedingStatus:'ACTIVE',graduatedYear:year});
  horseUpdates.push(update);overrideMap.set(horse.id,update);
  graduatedStallionYears.set(horse.id,year);
 }
 const nextStallionPool=openingStallions
  .filter(h=>!retiredStallionIds.has(h.id))
  .concat(stallionGraduates.map(h=>({...h,status:'STALLION',cohort:'stallions',
   breedingStatus:'ACTIVE',graduatedYear:year,age:year-Number(h.foalYear)})));
 if(!nextStallionPool.length||new Set(nextStallionPool.map(h=>h.id)).size!==
  nextStallionPool.length)
  throw Error('Stallion turnover produced an empty or duplicate active pool');
 stallionPoolCache.set(year,nextStallionPool);
 // The annual market was forecast from the *opening* breeding pool.
 // Individual age retirements can leave fewer mares or stallions available
 // on the actual covering date. Never book more mares than still exist.
 const rolloverServiceCapacity=Math.min(nextPool.length,
  nextStallionPool.length*220);
 const executableCovers=Math.min(market.targetCovers,rolloverServiceCapacity);
 const seasonMarket={...market,targetCovers:executableCovers,
  plannedFoals:Math.min(market.plannedFoals,
   Math.floor(executableCovers*.90*.96)),
  constrainedByBreedingCapacity:market.constrainedByBreedingCapacity||
   executableCovers<market.targetCovers,
  rolloverServiceCapacity,preTurnoverTargetCovers:market.targetCovers};
 if(executableCovers>nextPool.length)
  throw Error('Seasonal covering demand exceeds actual live broodmares');
 const result=planAnnualBroodmareTurnover({seed:manifest.seed,year,
  broodmares:openingMares.length,eligibleFemalePopulation:eligible.length,
  marketIndex:market.marketIndex});
 const entry={date:year+'-01-01',type:'BROODMARE_TURNOVER',year,
  openingBroodmares:openingMares.length,eligibleFillies:eligible.length,
  retired:retireIds.size,graduated:mareGraduates.length,
  forcedAgeRetirements:forcedMareRetireIds.length,
  closingBroodmares:nextPool.length,provenance:result.provenance,
  marketIndex:market.marketIndex,
  retiredHorseIds:[...retireIds],graduatedHorseIds:mareGraduates.map(h=>h.id)};
 const stallionEvent={date:year+'-01-01',type:'STALLION_TURNOVER',year,
  openingStallions:openingStallions.length,eligibleColts:eligibleMales.length,
  targetActiveStallions:stallionPlan.targetActiveStallions,
  retired:retiredStallionIds.size,graduated:stallionGraduates.length,
  closingStallions:nextStallionPool.length,
  retiredHorseIds:[...retiredStallionIds],
  graduatedHorseIds:stallionGraduates.map(h=>h.id),
  marketIndex:market.marketIndex,provenance:stallionPlan.provenance};
 return {turnover:entry,stallionTurnover:stallionEvent,nextPool,
  nextStallions:nextStallionPool,eligible,eligibleMales,retireIds,
  mareGraduates,stallionGraduates,market:seasonMarket};
}


/**
 * An adult ledger is a compact saved index of living non-breeding horses.
 * It avoids scanning every career horse and doing an IndexedDB get per living
 * adult on each future January 1. Breeders are managed in their active pools;
 * their retired members join this ledger and eventually die.
 *
 * Legacy careers without an adult ledger are bootstrapped from immutable
 * opening records and their already committed sidecars, without renumbering,
 * regenerating, or changing any historical race result.
 */
function compactMatureHorse(horse,year){
 const projected=project1999HorseForYear(horse,year);
 return {id:horse.id,foalYear:horse.foalYear,sex:projected.sex,
  status:projected.status,development:projected.development||{},
  registryProvenance:horse.registryProvenance};
}
async function bootstrapMaturePool(store,manifest,runKey,year,overrideMap,
 graduatedYears,graduatedStallionYears){
 const byId=new Map();
 const add=horse=>{
  if(!horse||year-Number(horse.foalYear)<3||horse.status==='DECEASED'||
   horse.status==='BROODMARE'||horse.status==='STALLION')return;
  byId.set(horse.id,compactMatureHorse(horse,year-1));
 };
 for(const cohort of ['threeYearOldRunners','fourYearOldRunners','fivePlusRunners',
  'twoYearOldProspects','yearlings']){
  for(const base of await readBaseCohort(store,manifest,cohort)){
   if(year-Number(base.foalYear)<4&&cohort!=='threeYearOldRunners'&&
    cohort!=='fourYearOldRunners'&&cohort!=='fivePlusRunners')continue;
   // A brand-new 2000 rollover has no mature-horse sidecars yet.
   // Avoid one IndexedDB transaction per opening adult at 300k scale.
   const horse=year===2000?base:
    await effectiveLifecycleHorse(store,manifest,runKey,base.id,overrideMap);
   add(horse);
  }
 }
 for(let birthYear=1999;birthYear<=year-4;birthYear++){
  const ids=await store.get('industryLifecycle',lifecycleKey(runKey,
   'foal-cohort:'+birthYear))||[];
  for(const id of ids)add(await effectiveLifecycleHorse(store,manifest,runKey,id,
   overrideMap));
 }
 // The active breeder pools live outside this ledger. Restore their retired
 // members from committed turnover events when migrating a pre-ledger save.
 for(let season=2000;season<year;season++){
  const events=await store.get('industryLifecycle',lifecycleKey(runKey,
   'events:'+season+'-01-01'))||[];
  for(const event of events.filter(x=>['BROODMARE_TURNOVER',
   'STALLION_TURNOVER'].includes(x.type)))
   for(const id of event.retiredHorseIds||[])
    add(await effectiveLifecycleHorse(store,manifest,runKey,id,overrideMap));
 }
 return [...byId.values()];
}
async function existingTrackTrainers(store,manifest,rosterCache){
 if(rosterCache.trainers)return rosterCache.trainers;
 const grouped=new Map();
 for(let index=0;index<manifest.personBatchesCommitted;index++){
  const batch=await readPersistent1999IndustryBatch(store,manifest,
   'personBatches',index);
  for(const person of batch)if(person.role==='trainer'){
   if(!grouped.has(person.workplaceId))grouped.set(person.workplaceId,[]);
   grouped.get(person.workplaceId).push(person.id);
  }
 }
 rosterCache.trainers=grouped;
 return grouped;
}
/** Assign only existing, permanent personnel and owner-track IDs. */
async function assignRacingHome(horse,patch,{store,manifest,directoryById,
 rosterCache}={}){
 if(patch.status!=='RACING')return patch;
 const owner=directoryById.get(horse.ownerId);
 // Some legacy/save-compatible owners have no explicit homeTrackId.
 // Use the existing local track directory deterministically in that case;
 // never fabricate a track or change the immutable owner's source record.
 const existingTracks=rosterCache.existingTracks||(
  rosterCache.existingTracks=[...directoryById.values()].filter(entity=>
   entity.id?.startsWith('T-')).sort((a,b)=>a.id.localeCompare(b.id)));
 const fallbackIndex=Math.floor(seeded1999Unit(manifest.seed,
  'owner-circuit:'+horse.ownerId)*existingTracks.length);
 const trackId=horse.homeTrackId||owner?.homeTrackId||
  owner?.relationships?.find(edge=>edge.type==='REGIONAL_CIRCUIT')?.toId||
  existingTracks[fallbackIndex]?.id;
 if(!trackId||!directoryById.get(trackId)?.id?.startsWith('T-'))
  throw Error('Racing transition has no valid owner home circuit '+horse.id);
 let trainerId=horse.trainerId;
 if(!trainerId){
  const trainers=(await existingTrackTrainers(store,manifest,rosterCache))
   .get(trackId)||[];
  if(!trainers.length)
   throw Error('Racing transition lacks a real resident trainer at '+trackId);
  trainerId=trainers[Math.floor(seeded1999Unit(manifest.seed,
   'seasonal-trainer:'+horse.id)*trainers.length)];
 }
 const relationships=[...(horse.relationships||[])];
 for(const [type,toId] of [['HOME_TRACK',trackId],['TRAINED_BY',trainerId]])
  if(!relationships.some(edge=>edge.type===type&&edge.toId===toId))
   relationships.push({type,fromId:horse.id,toId,
    provenance:'MODELED_SEASONAL_TRAINING_ASSIGNMENT'});
 return {...patch,homeTrackId:trackId,trainerId,relationships};
}
async function matureHorseRolloverForYear(store,manifest,runKey,year,horseUpdates,{
 overrideMap,addEvent,maturePoolCache,birthCohortCache,turnover,graduatedYears,
 graduatedStallionYears,directoryById,rosterCache}={}){
 let previous=maturePoolCache.get(year-1);
 if(!previous){
  previous=await store.get('industryLifecycle',lifecycleKey(runKey,
   'mature-pool:'+(year-1)));
  if(!Array.isArray(previous))
   previous=await bootstrapMaturePool(store,manifest,runKey,year,overrideMap,
    graduatedYears,graduatedStallionYears);
 }
 const graduated=new Set([...turnover.turnover.graduatedHorseIds,
  ...turnover.stallionTurnover.graduatedHorseIds]);
 const active=new Map(previous.filter(entry=>!graduated.has(entry.id))
  .map(entry=>[entry.id,entry]));
 const entrants=[];
 const origin=birthYearCohort(year-3);
 if(origin){
  for(const horse of await readBaseCohort(store,manifest,origin))
   if(horse.foalYear===year-3)entrants.push(horse.id);
 }else{
  // A multi-year date advance may already have formed this cohort in the
  // current transaction. Read the in-flight cache before durable prior saves.
  const cached=birthCohortCache.get(year-3);
  const ids=cached??(await store.get('industryLifecycle',lifecycleKey(runKey,
   'foal-cohort:'+(year-3)))||[]);
  entrants.push(...ids);
 }
 const entrantSet=new Set(entrants);
 if(entrantSet.size!==entrants.length)
  throw Error('Mature entrant cohort contains duplicate permanent IDs');
 for(const id of entrants){
  if(active.has(id)||graduated.has(id))continue;
  const base=await effectiveLifecycleHorse(store,manifest,runKey,id,overrideMap);
  if(!base||base.status==='DECEASED'||base.status==='BROODMARE'||
   base.status==='STALLION')continue;
  const previousSeason=project1999HorseForYear(base,year-1);
  active.set(id,{...compactMatureHorse(base,year),
   priorRacing:previousSeason.status==='RACING',newEntrant:true});
 }
 for(const id of [...turnover.turnover.retiredHorseIds,
  ...turnover.stallionTurnover.retiredHorseIds]){
  if(active.has(id))continue;
  const horse=await effectiveLifecycleHorse(store,manifest,runKey,id,overrideMap);
  if(horse&&horse.status!=='DECEASED')
   active.set(id,{...compactMatureHorse(horse,year),newlyRetired:true});
 }
 const deaths=[],retired=[],developed=[],started=[];
 let racingDelta=0;
 for(const [id,entry] of active){
  const before=entry.status;
  // Retirement happens at the start of the year; do not immediately kill
  // the same horse on that retirement date.
  const plan=entry.newlyRetired?{decision:'UNCHANGED',patch:null}:
   plan1999MatureHorseYear({seed:manifest.seed,year,horse:entry});
  const nextStatus=plan.patch?.status||before;
  if(entry.newEntrant&&!entry.priorRacing&&nextStatus==='RACING')racingDelta++;
  if((!entry.newEntrant||entry.priorRacing)&&before==='RACING'&&
   nextStatus!=='RACING')racingDelta--;
  if(plan.patch||entry.newEntrant&&nextStatus==='RACING'&&
   !entry.priorRacing){
   const horse=await effectiveLifecycleHorse(store,manifest,runKey,id,overrideMap);
   if(!horse)throw Error('Mature lifecycle lost permanent horse identity '+id);
   const patch=plan.patch?{...plan.patch}:{};
   if(entry.newEntrant&&!entry.priorRacing&&nextStatus==='RACING'){
    patch.status='RACING';
    patch.racingDebutDate=patch.racingDebutDate||year+'-01-01';
    patch.racingReadiness='CLEARED';
   }
   const assigned=await assignRacingHome(horse,patch,{store,manifest,
    directoryById,rosterCache});
   const update=statusUpdate(horse,assigned);
   horseUpdates.push(update);overrideMap.set(id,update);
  }
  if(plan.decision==='DECEASED'){deaths.push(id);active.delete(id);continue}
  if(plan.decision==='RETIRED')retired.push(id);
  if(plan.decision==='DEVELOPED')developed.push(id);
  if(entry.newEntrant&&nextStatus==='RACING')started.push(id);
  active.set(id,{...entry,status:nextStatus,
   development:plan.patch?.development||entry.development,
   newEntrant:undefined,priorRacing:undefined,newlyRetired:undefined});
 }
 const members=[...active.values()];
 if(new Set(members.map(x=>x.id)).size!==members.length)
  throw Error('Mature lifecycle ledger contains duplicate horse IDs');
 maturePoolCache.set(year,members);
 addEvent(year+'-01-01',{type:'MATURE_HORSE_LIFECYCLE',year,
  openingPopulation:previous.length,entrants:entrants.length,
  activeAfterRollover:members.length,deaths:deaths.length,
  retired:retired.length,developed:developed.length,started:started.length,
  racingPopulationDelta:racingDelta,deathHorseIds:deaths,
  retiredHorseIds:retired,startedHorseIds:started,
  provenance:'SEEDED_PERSISTED_INDIVIDUAL_MATURE_TRANSITIONS'});
 return {deaths:deaths.length,retired:retired.length,developed:developed.length,
  started:started.length,racingDelta,members};
}
async function juvenileDebutsForDate(store,manifest,runKey,date,horseUpdates,{
 overrideMap,birthCohortCache,addEvent,directoryById,rosterCache}={}){
 const year=Number(date.slice(0,4)),birthYear=year-2;
 const openingCohort=birthYearCohort(birthYear);
 const ids=openingCohort?
  (await readBaseCohort(store,manifest,openingCohort))
   .filter(h=>h.foalYear===birthYear).map(h=>h.id):
  (birthCohortCache.get(birthYear)||await store.get('industryLifecycle',
   lifecycleKey(runKey,'foal-cohort:'+birthYear))||[]);
 const unique=[...new Set(ids)],started=[],delayed=[];
 for(const id of unique){
  const horse=await effectiveLifecycleHorse(store,manifest,runKey,id,overrideMap);
  if(!horse||horse.status==='DECEASED'||horse.status==='RACING')continue;
  const plan=plan1999JuvenileDebut({seed:manifest.seed,year,date,
   horse:project1999HorseForYear(horse,year)});
  if(!plan.patch)continue;
  const assigned=await assignRacingHome(horse,plan.patch,{store,manifest,
   directoryById,rosterCache});
  const update=statusUpdate(horse,assigned);
  horseUpdates.push(update);overrideMap.set(id,update);
  if(plan.decision==='RACING')started.push(id);else delayed.push(id);
 }
 addEvent(date,{type:'JUVENILE_RACING_READINESS',year,
  started:started.length,delayed:delayed.length,
  startedHorseIds:started,provenance:'SEEDED_DATED_INDIVIDUAL_DEBUTS'});
 return {started:started.length,delayed:delayed.length};
}

async function youngHorseAttritionForYear(store,manifest,runKey,year,horseUpdates,
 {overrideMap=new Map(),birthCohortCache=new Map(),addEvent=()=>{}}={}){
 const stages=[
  {birthYear:year-1,stage:'FOAL_TO_YEARLING',deathAge:1},
  {birthYear:year-2,stage:'YEARLING_TO_TWO_YEAR_OLD',deathAge:2}
 ];
 const deathsByStage={},survivorsByStage={};let deaths=0;
 for(const transition of stages){
  let ids=birthCohortCache.get(transition.birthYear);
  if(!ids){
   const saved=await store.get('industryLifecycle',lifecycleKey(runKey,
    'foal-cohort:'+transition.birthYear));
   if(saved!==undefined)ids=new Set(saved);
   else if(transition.birthYear===1998){
    const openingYearlings=await readBaseCohort(store,manifest,'yearlings');
    ids=new Set(openingYearlings.filter(h=>h.foalYear===1998).map(h=>h.id));
   }else ids=new Set();
   birthCohortCache.set(transition.birthYear,ids);
  }
  if(!(ids instanceof Set)){
   const values=ids;
   ids=new Set(values);
   if(ids.size!==values.length)throw Error('Young-horse cohort contains duplicate identities');
   birthCohortCache.set(transition.birthYear,ids);
  }
  const plan=planAnnualYoungHorseAttrition({seed:manifest.seed,year,
   stage:transition.stage,candidateCount:ids.size});
  const ranked=[...ids].map(id=>({id,rank:seeded1999Unit(manifest.seed,
   'young-horse-death:'+year+':'+transition.stage+':'+id)}));
  ranked.sort((a,b)=>a.rank-b.rank||a.id.localeCompare(b.id));
  const deceased=ranked.slice(0,plan.deaths).map(x=>x.id);
  const survivors=new Set(ids);
  for(const id of deceased){
   const horse=await effectiveLifecycleHorse(store,manifest,runKey,id,overrideMap);
   if(!horse||horse.foalYear!==transition.birthYear||horse.status==='DECEASED')
    throw Error('Young-horse attrition selected a missing, aged, or deceased record: '+id);
   const update=statusUpdate(horse,{status:'DECEASED',cohort:'deceased',
    deathDate:year+'-01-01',deathYear:year,deathAge:transition.deathAge,
    deathStage:transition.stage,deathCause:'DEVELOPMENTAL_ATTRITION',
    mortalityRate:plan.mortalityRate,
    provenance:'MODELED_SEEDED_YOUNGSTOCK_ATTRITION'});
   horseUpdates.push(update);overrideMap.set(id,update);survivors.delete(id);
  }
  // Commit actual youngstock status/cohort changes; age projections alone
  // must not masquerade as persistent developmental transitions.
  const stageStatus=transition.stage==='FOAL_TO_YEARLING'?'YEARLING':
   'TWO_YEAR_OLD_PROSPECT';
  const stageCohort=transition.stage==='FOAL_TO_YEARLING'?'yearlings':
   'twoYearOldProspects';
  for(const id of survivors){
   const horse=await effectiveLifecycleHorse(store,manifest,runKey,id,overrideMap);
   if(!horse||horse.foalYear!==transition.birthYear||horse.status==='DECEASED')
    throw Error('Youngstock progression lost a living horse '+id);
   const update=statusUpdate(horse,{status:stageStatus,cohort:stageCohort,
    progressionYear:year,lastProgressionStage:transition.stage});
   horseUpdates.push(update);overrideMap.set(id,update);
  }
  birthCohortCache.set(transition.birthYear,survivors);
  deathsByStage[transition.stage]=deceased.length;deaths+=deceased.length;
  survivorsByStage[transition.stage]=survivors.size;
  addEvent(year+'-01-01',{type:'YOUNGSTOCK_ATTRITION',year,
   stage:transition.stage,birthYear:transition.birthYear,
   openingCohortSize:ids.size,deaths:deceased.length,
   closingCohortSize:survivors.size,mortalityRate:plan.mortalityRate,
   deathHorseIds:deceased,provenance:plan.provenance});
 }
 return {deaths,deathsByStage,survivorsByStage};
}

async function effectiveLifecycleHorse(store,manifest,runKey,id,overrideMap){
 const state=overrideMap.get(id)||await store.get('industryLifecycle',
  lifecycleHorseKey(runKey,id));
 if(state?.kind==='BORN')return statusPatch(null,state);
 const base=await findPersistent1999Horse(store,manifest,id);
 return statusPatch(base,state);
}

/**
 * Commit date-accurate births and year-end industry transitions for one career.
 * Forecasts are stored separately from the living horse set and materialize
 * only on their modeled foaling date.
 */
async function advancePersistent1999IndustryLifecycle(store,manifest,{
 runId,gameDate
}={}){
 if(manifest?.status!=='COMPLETE'||typeof runId!=='string'||!runId||
  !validCalendarDate(gameDate)||!store?.commitLifecycleRun)
  throw Error('Invalid persistent industry lifecycle advance');
 const runKey=lifecycleRunKey(manifest,runId),horseUpdates=[],dataWrites=[];
 // Cache immutable batch reads and read-only lifecycle keys for this advance.
 // Full-world crops can contain tens of thousands of foals; repeatedly
 // opening the same IndexedDB batch for every dam used to turn a rollover
 // into hundreds of thousands of redundant transactions.
 const readCache=new Map(),lifecycleStore=Object.create(store);
 lifecycleStore.get=async(name,key)=>{
  const cacheKey=name+'\u0000'+key;
  if(!readCache.has(cacheKey))readCache.set(cacheKey,Promise.resolve(store.get(name,key)));
  return readCache.get(cacheKey);
 };
 const eventByDate=new Map(),overrideMap=new Map(),poolCache=new Map(),
  stallionPoolCache=new Map();
 const birthCohortCache=new Map(),forecastCache=new Map(),farmCache=new Map(),
  maturePoolCache=new Map();
 const rosterCache={};
 const graduatedYears=new Map(),graduatedStallionYears=new Map(),
  activeMaresById=new Map(),activeStallionsById=new Map();
 const directory=await readPersistent1999Directory(lifecycleStore,manifest);
 const directoryById=new Map(directory.map(entity=>[entity.id,entity]));
 const addEvent=(date,event)=>{
  if(!eventByDate.has(date))eventByDate.set(date,[]);
  eventByDate.get(date).push(event);
 };
 const addData=write=>{
  dataWrites.push(write);
  if(/:forecast:\d{4}:\d{4}-\d{2}-\d{2}$/.test(write.key))
   forecastCache.set(write.key,write.value);
 };
 let checkpoint=await lifecycleStore.get('industryLifecycle',lifecycleKey(runKey,'checkpoint'));
 if(!checkpoint){
  if(gameDate<'1999-01-01')throw Error('Industry lifecycle cannot precede 1999');
  const mares=await readBaseCohort(lifecycleStore,manifest,'broodmares');
  const pool=mares.map(h=>h.id),records=mares.map(h=>({...h,status:'BROODMARE'}));
  const openingStallions=await readBaseCohort(lifecycleStore,manifest,'stallions');
  const stallionPool=openingStallions.map(h=>h.id);
  const stallionRecords=openingStallions.map(h=>project1999HorseForYear(h,1999));
  poolCache.set(1999,records);
  stallionPoolCache.set(1999,stallionRecords);
  for(const mare of records)activeMaresById.set(mare.id,mare);
  for(const stallion of stallionRecords)activeStallionsById.set(stallion.id,stallion);
  const market=marketPlanForSeason(manifest,directory,{year:1999,
   broodmares:records.length,stallions:stallionRecords.length,
   racingPopulation:manifest.plan.potentialRacingPopulation,previousLiveFoals:0,
   initial:true});
  const schedule=await prepareLifecycleSeason(lifecycleStore,manifest,runKey,{
   year:1999,mareRecords:records,stallionRecords,market,initial:true});
  schedule.dataWrites.forEach(addData);
  checkpoint={schema:'WTW_INDUSTRY_LIFECYCLE_V1',runId,
   openingHorseCount:manifest.horseCount,population:manifest.horseCount,
   seasonYear:1999,lastDate:'1999-01-01',activeBroodmares:pool.length,
   activeStallions:stallionPool.length,retiredBroodmares:0,graduatedFillies:0,
   retiredStallions:0,graduatedStallions:0,
   racingPopulation:manifest.plan.activeRunnersExcludingTwoYearOlds,
   matureHorseDeaths:0,retiredRacehorses:0,juvenileDebuts:0,
   foalsBorn:0,foalLosses:0,
   horseDeaths:0,birthsByYear:{},lossesByYear:{},deathsByYear:{},
   deathsByStage:{FOAL_TO_YEARLING:{},YEARLING_TO_TWO_YEAR_OLD:{}},
   provenance:'SEEDED_PERSISTENT_SEASONAL_LIFECYCLE'};
  addData({key:lifecyclePoolKey(runKey,1999),value:pool});
  addData({key:lifecycleStallionPoolKey(runKey,1999),value:stallionPool});
 }
 if(checkpoint.schema!=='WTW_INDUSTRY_LIFECYCLE_V1'||checkpoint.runId!==runId||
  checkpoint.openingHorseCount!==manifest.horseCount||!validCalendarDate(checkpoint.lastDate))
  throw Error('Persistent lifecycle checkpoint is invalid');
 const savedStageDeaths=checkpoint.deathsByStage||{};
 checkpoint={...checkpoint,horseDeaths:checkpoint.horseDeaths||0,
  matureHorseDeaths:checkpoint.matureHorseDeaths||0,
  retiredRacehorses:checkpoint.retiredRacehorses||0,
  juvenileDebuts:checkpoint.juvenileDebuts||0,
  activeStallions:checkpoint.activeStallions??manifest.plan.counts.stallions,
  retiredStallions:checkpoint.retiredStallions||0,
  graduatedStallions:checkpoint.graduatedStallions||0,
  racingPopulation:checkpoint.racingPopulation??manifest.plan.potentialRacingPopulation,
  deathsByYear:checkpoint.deathsByYear||{},
  deathsByStage:{FOAL_TO_YEARLING:savedStageDeaths.FOAL_TO_YEARLING||{},
   YEARLING_TO_TWO_YEAR_OLD:savedStageDeaths.YEARLING_TO_TWO_YEAR_OLD||{}}};
 for(let year=2000;year<=checkpoint.seasonYear;year++){
  const events=await lifecycleStore.get('industryLifecycle',
   lifecycleKey(runKey,'events:'+year+'-01-01'))||[];
  const turnover=events.find(event=>event.type==='BROODMARE_TURNOVER');
  for(const id of turnover?.graduatedHorseIds||[])graduatedYears.set(id,year);
  const stallionTurnover=events.find(event=>event.type==='STALLION_TURNOVER');
  for(const id of stallionTurnover?.graduatedHorseIds||[])
   graduatedStallionYears.set(id,year);
 }
 if(!activeMaresById.size){
  const activeMares=await readPoolRecords(lifecycleStore,manifest,runKey,
   checkpoint.seasonYear,overrideMap,null,graduatedYears);
  poolCache.set(checkpoint.seasonYear,activeMares);
  for(const mare of activeMares)activeMaresById.set(mare.id,mare);
 }
 if(!activeStallionsById.size){
  const activeStallions=await readStallionPoolRecords(lifecycleStore,manifest,
   runKey,checkpoint.seasonYear,overrideMap,stallionPoolCache.get(checkpoint.seasonYear)||null);
  stallionPoolCache.set(checkpoint.seasonYear,activeStallions);
  for(const stallion of activeStallions)activeStallionsById.set(stallion.id,stallion);
 }
 if(gameDate<checkpoint.lastDate)throw Error('Industry lifecycle date cannot move backward');
 let current=checkpoint;
 for(let date=nextCalendarDate(current.lastDate);date<=gameDate;date=nextCalendarDate(date)){
  const year=Number(date.slice(0,4));
  if(date.endsWith('-01-01')&&year>current.seasonYear){
   const attrition=await youngHorseAttritionForYear(lifecycleStore,manifest,
    runKey,year,horseUpdates,{overrideMap,birthCohortCache,addEvent});
   const turnover=await turnoverForYear(lifecycleStore,manifest,runKey,year,horseUpdates,
    {overrideMap,poolCache,stallionPoolCache,maturePoolCache,
     birthCohortCache,graduatedYears,graduatedStallionYears,directory,
     racingPopulation:current.racingPopulation,
     previousLiveFoals:current.birthsByYear[year-1]||0});
   for(const update of horseUpdates)overrideMap.set(update.id,update);
   const mature=await matureHorseRolloverForYear(lifecycleStore,manifest,
    runKey,year,horseUpdates,{overrideMap,addEvent,maturePoolCache,
     birthCohortCache,turnover,graduatedYears,graduatedStallionYears,
     directoryById,rosterCache});
   addData({key:lifecycleKey(runKey,'mature-pool:'+year),value:mature.members});
   const schedule=await prepareLifecycleSeason(lifecycleStore,manifest,runKey,{
    year,mareRecords:turnover.nextPool,stallionRecords:turnover.nextStallions,
    market:turnover.market});
   schedule.dataWrites.forEach(addData);
   const event=turnover.turnover;
   addEvent(date,event);
   addEvent(date,turnover.stallionTurnover);
   for(const id of event.graduatedHorseIds)graduatedYears.set(id,year);
   activeMaresById.clear();
   for(const mare of turnover.nextPool)activeMaresById.set(mare.id,mare);
   activeStallionsById.clear();
   for(const stallion of turnover.nextStallions)
    activeStallionsById.set(stallion.id,stallion);
   const deathsByStage={...current.deathsByStage};
   for(const [stage,count] of Object.entries(attrition.deathsByStage))
    deathsByStage[stage]={...deathsByStage[stage],[year]:count};
   current={...current,seasonYear:year,activeBroodmares:turnover.nextPool.length,
    activeStallions:turnover.nextStallions.length,
    retiredBroodmares:current.retiredBroodmares+event.retired,
    graduatedFillies:current.graduatedFillies+event.graduated,
    retiredStallions:current.retiredStallions+turnover.stallionTurnover.retired,
    graduatedStallions:current.graduatedStallions+
     turnover.stallionTurnover.graduated,
    racingPopulation:Math.max(0,current.racingPopulation+
     mature.racingDelta-event.graduated-
     turnover.stallionTurnover.graduated),
    population:current.population-attrition.deaths-mature.deaths,
    horseDeaths:current.horseDeaths+attrition.deaths+mature.deaths,
    matureHorseDeaths:current.matureHorseDeaths+mature.deaths,
    retiredRacehorses:current.retiredRacehorses+mature.retired,
    deathsByYear:{...current.deathsByYear,[year]:
     attrition.deaths+mature.deaths},
    deathsByStage};
  }
  if(date.endsWith('-04-01')||date.endsWith('-09-01')){
   const juveniles=await juvenileDebutsForDate(lifecycleStore,manifest,
    runKey,date,horseUpdates,{overrideMap,birthCohortCache,addEvent,
     directoryById,rosterCache});
   current={...current,
    juvenileDebuts:current.juvenileDebuts+juveniles.started,
    racingPopulation:current.racingPopulation+juveniles.started};
  }
  const forecastKey=lifecycleForecastKey(runKey,year,date);
  const forecasts=forecastCache.has(forecastKey)?forecastCache.get(forecastKey):
   await lifecycleStore.get('industryLifecycle',forecastKey)||[];
  if(!Array.isArray(forecasts))throw Error('Malformed persisted foaling forecast');
  for(const forecast of forecasts){
   if(forecast.status!=='PROJECTED_NOT_YET_BORN'||forecast.birthDate!==date)
    throw Error('Invalid unborn foal forecast');
   const live=resolve1999FoalBirth({seed:manifest.seed,forecast});
   if(!live){
    current={...current,foalLosses:current.foalLosses+1,
     lossesByYear:{...current.lossesByYear,[year]:
      (current.lossesByYear[year]||0)+1}};
    addEvent(date,{type:'PREGNANCY_LOSS',year,coveringId:forecast.coveringId,
     damId:forecast.damId,sireId:forecast.sireId,
     provenance:'MODELED_LIVE_FOAL_RATE'});
    continue;
   }
   if(!birthCohortCache.has(year)){
    birthCohortCache.set(year,new Set(await lifecycleStore.get('industryLifecycle',
     lifecycleKey(runKey,'foal-cohort:'+year))||[]));
   }
   if(overrideMap.has(forecast.foalId)||birthCohortCache.get(year).has(forecast.foalId))
    throw Error('Duplicate seasonal foal identity '+forecast.foalId);
   const dam=activeMaresById.get(forecast.damId)||await effectiveLifecycleHorse(
    lifecycleStore,manifest,runKey,forecast.damId,overrideMap);
   const farm=farmCache.get(forecast.foalingFarmId)||
    directoryById.get(forecast.foalingFarmId);
   if(!dam||dam.status!=='BROODMARE'||dam.ownerId!==forecast.ownerId||
    dam.foalingFarmId!==forecast.foalingFarmId||!farm)
    throw Error('Seasonal foal has an orphaned parent, owner, or foaling farm');
   farmCache.set(farm.id,farm);
   const sire=activeStallionsById.get(forecast.sireId)||
    await effectiveLifecycleHorse(lifecycleStore,manifest,runKey,
     forecast.sireId,overrideMap);
   if(!sire||sire.status!=='STALLION')
    throw Error('Seasonal foal has a missing or inactive sire');
   const foal=create1999SeasonalFoal({seed:manifest.seed,year,
    dateOfBirth:date,id:forecast.foalId,dam,sire,farm});
   if(foal.sireId===foal.damId||foal.ownerId!==forecast.ownerId||
    foal.birthplace.farmId!==foal.foalingFarmId)
    throw Error('Seasonal foal pedigree or ownership failed validation');
   const born={id:foal.id,kind:'BORN',horse:foal};
   horseUpdates.push(born);overrideMap.set(foal.id,born);
   birthCohortCache.get(year).add(foal.id);
   current={...current,population:current.population+1,
    foalsBorn:current.foalsBorn+1,
    birthsByYear:{...current.birthsByYear,[year]:
     (current.birthsByYear[year]||0)+1}};
   addEvent(date,{type:'FOAL_BORN',year,horseId:foal.id,
    coveringId:forecast.coveringId,damId:foal.damId,sireId:foal.sireId,
    ownerId:foal.ownerId,foalingFarmId:foal.foalingFarmId,
    provenance:'MODELED_LIVE_BIRTH'});
  }
  current={...current,lastDate:date};
 }
 for(const [year,ids] of birthCohortCache)
  addData({key:lifecycleKey(runKey,'foal-cohort:'+year),value:[...ids]});
 const eventWrites=[...eventByDate].map(([date,events])=>({
  key:lifecycleKey(runKey,'events:'+date),value:events}));
 return {checkpoint:current,horseUpdates,eventWrites,dataWrites};
}

/**
 * Lightweight reopen certificate. Verifies all population checkpoint counts,
 * directory presence, and the first/last committed batch of each store.
 * Full semantic validation happens during generation, before each commit.
 */
export async function verifyPersistent1999WorldOpen(store,manifest){
 if(manifest?.schema!==PERSISTENT_INDUSTRY_SCHEMA||
  manifest.status!=='COMPLETE'||!manifest.directoryCommitted)
  throw Error('1999 world is not complete');
 const counts=[
  ['horseBatches',manifest.horseCount,manifest.batchSize,
   manifest.horseBatchesCommitted],
  ['personBatches',manifest.personCount,manifest.batchSize,
   manifest.personBatchesCommitted],
  ['coveringBatches',manifest.coveringCount,manifest.batchSize,
   manifest.coveringBatchesCommitted],
  ['calendarBatches',manifest.scheduledCards,100,
   manifest.calendarBatchesCommitted]
 ];
 for(const [kind,total,size,committed] of counts){
  if(!Number.isSafeInteger(total)||total<1||
   !Number.isSafeInteger(size)||size<1||
   committed!==Math.ceil(total/size))
   throw Error('1999 world '+kind+' checkpoint count mismatch');
  const first=await readPersistent1999IndustryBatch(store,manifest,kind,0);
  const last=await readPersistent1999IndustryBatch(store,manifest,kind,committed-1);
  if(first.length!==Math.min(total,size)||
   last.length!==total-(committed-1)*size)
   throw Error('1999 world '+kind+' has incomplete persisted records');
 }
 const directory=await readPersistent1999Directory(store,manifest);
 if(!directory.length||directory.some(x=>!x.id||!x.ratings||
  !Array.isArray(x.relationships)))
  throw Error('1999 world directory is incomplete');
 return {status:'OPEN_VERIFIED',worldId:manifest.worldId,
  seed:manifest.seed,horses:manifest.horseCount,people:manifest.personCount,
  coverings:manifest.coveringCount,raceDays:manifest.scheduledCards,
  scheduledRaces:manifest.scheduledRaces,directoryEntities:directory.length};
}

/**
 * Reopen the existing opening-world snapshot without rerunning population
 * generation. An incomplete manifest is never exposed as a playable world.
 */
export async function reopenPersistent1999Industry(store,{
 seed=19990101,worldId='WTW1999FullIndustry'
}={}){
 if(!store?.get||!Number.isSafeInteger(seed)||seed<1||!worldId)
  throw Error('Invalid 1999 world reopen request');
 const manifest=await store.get('manifests',keyOf(seed,worldId));
 if(!manifest)return null;
 if(manifest.schema!==PERSISTENT_INDUSTRY_SCHEMA)
  throw Error('Unsupported 1999 industry schema');
 if(manifest.status!=='COMPLETE')return {status:'GENERATING',manifest};
 const certificate=await verifyPersistent1999WorldOpen(store,manifest);
 return {status:'READY',manifest,certificate};
}
