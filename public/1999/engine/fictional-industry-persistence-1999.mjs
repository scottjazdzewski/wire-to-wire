/**
 * Offline-first, resumable 1999 whole-industry genesis.
 * Each batch and its progress checkpoint commit in ONE IndexedDB transaction.
 * A world is visible to the game only after its COMPLETE manifest is written.
 * Never changes the legacy founding-world career store.
 */
import {plan1999Ecosystem} from './fictional-industry-ecosystem-1999.mjs';
import {generate1999IndustryRegistryBatches,count1999Registry}
 from './fictional-industry-registry-1999.mjs';
import {plan1999IndustryStaffing,generate1999StaffingBatches}
 from './fictional-industry-staffing-1999.mjs';
import {connect1999Horse,connect1999Person,connect1999DirectoryEntity,
 validate1999GraphBatch,validate1999IndustryReferences,INDUSTRY_GRAPH_SCHEMA}
 from './fictional-industry-graph-1999.mjs';
export const PERSISTENT_INDUSTRY_SCHEMA='WTW_PERSISTENT_INDUSTRY_1999_V1';
export const PERSISTENT_INDUSTRY_DB='WireToWireFictionalIndustry1999V1';
const stores=['manifests','horseBatches','personBatches','horseEdits','careerRuns','directory'];
function request(req){return new Promise((resolve,reject)=>{
 req.onsuccess=()=>resolve(req.result);
 req.onerror=()=>reject(req.error||Error('IndexedDB request failed'));
})}
export async function open1999IndustryDatabase(indexedDB=globalThis.indexedDB){
 if(!indexedDB?.open)throw Error('IndexedDB is required for offline industry persistence');
 const db=await new Promise((resolve,reject)=>{
  const req=indexedDB.open(PERSISTENT_INDUSTRY_DB,2);
  req.onupgradeneeded=()=>{
   for(const name of stores)
    if(!req.result.objectStoreNames.contains(name))
     req.result.createObjectStore(name);
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error('Industry database open failed'));
 });
 return {
  async get(store,key){
   if(!stores.includes(store))throw Error('Unknown industry store');
   return request(db.transaction(store,'readonly').objectStore(store).get(key));
  },
  async commitDirectory(worldId,manifest,records){
   return new Promise((resolve,reject)=>{
    const tx=db.transaction(['manifests','directory'],'readwrite');
    tx.objectStore('directory').put(records,worldId);
    tx.objectStore('manifests').put(manifest,worldId);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error||Error('Industry directory commit failed'));
    tx.onabort=()=>reject(tx.error||Error('Industry directory commit aborted'));
   });
  },
  async commitBatch({worldId,manifest,kind,index,records}){
   if(!['horseBatches','personBatches'].includes(kind)||
    !Number.isInteger(index)||index<0||!Array.isArray(records)||!records.length)
    throw Error('Invalid industry batch');
   return new Promise((resolve,reject)=>{
    const tx=db.transaction(['manifests',kind],'readwrite');
    tx.objectStore(kind).put(records,worldId+':'+index);
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
   const value=JSON.stringify([entity.id,entity.location??null]);
   for(let i=0;i<value.length;i++){
    h^=value.charCodeAt(i);h=Math.imul(h,16777619);
   }
  }
  h^=directory.length;h=Math.imul(h,16777619);
 }
 return (h>>>0).toString(16).padStart(8,'0');
}
export async function createPersistent1999Industry({
 store,seed=19990101,worldId='WTW1999FullIndustry',
 farms,tracks,owners,batchSize=1000,onProgress=()=>{}
}={}){
 if(!store?.get||!store?.commitBatch||!store?.commitManifest||
  !Number.isSafeInteger(seed)||seed<1||!worldId||
  !Array.isArray(farms)||!farms.length||
  !Array.isArray(tracks)||!tracks.length||
  !Array.isArray(owners)||!owners.length)
  throw Error('Invalid persistent industry genesis request');
 const id=keyOf(seed,worldId);
 const directoryHash=directorySignature([farms,tracks,owners]);
 const plan=plan1999Ecosystem({seed});
 const staffing=plan1999IndustryStaffing({seed,ecosystem:plan});
 const totalHorses=count1999Registry(plan);
 const totalPeople=Object.values(staffing.counts).reduce((a,b)=>a+b,0);
 const existing=await store.get('manifests',id);
 if(existing){
  if(existing.schema!==PERSISTENT_INDUSTRY_SCHEMA||
   existing.seed!==seed||existing.worldId!==worldId||
   existing.batchSize!==batchSize||
   existing.directoryHash!==directoryHash||
   existing.horseCount!==totalHorses||
   existing.personCount!==totalPeople||
   existing.graphSchema!==INDUSTRY_GRAPH_SCHEMA)
   throw Error('Existing industry identity or generation parameters conflict');
  if(existing.status==='COMPLETE')return existing;
 }
 let manifest=existing??{
  schema:PERSISTENT_INDUSTRY_SCHEMA,worldId,seed,batchSize,directoryHash,
  status:'GENERATING',horseCount:totalHorses,personCount:totalPeople,
  horseBatchesCommitted:0,personBatchesCommitted:0,
  directoryCommitted:false,graphSchema:INDUSTRY_GRAPH_SCHEMA,
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
 for(const [kind,generator] of [
  ['horseBatches',generate1999IndustryRegistryBatches({
   seed,plan,farms,tracks,owners,batchSize})],
  ['personBatches',generate1999StaffingBatches({
   seed,staffing,tracks,farms,batchSize})]
 ]){
  const progressKey=kind==='horseBatches'?'horseBatchesCommitted':'personBatchesCommitted';
  let index=0;
  for(const batch of generator){
   if(index<manifest[progressKey]){index++;continue}
   const next={...manifest,[progressKey]:index+1};
   const records=kind==='horseBatches'?
    batch.records.map(h=>connect1999Horse(h,{seed,
     trainerCount:staffing.counts.trainer,jockeyCount:staffing.counts.jockey})):
    batch.records.map(p=>connect1999Person(p,{seed}));
   const audit=validate1999IndustryReferences(records,{
    plan,staffing,tracks,farms,owners});
   if(!audit.valid)throw Error('Broken 1999 industry entity relationships: '+
    JSON.stringify(audit.problems.slice(0,5)));
   await store.commitBatch({worldId:id,manifest:next,kind,index,records});
   manifest=next;index++;
   onProgress({kind,completed:index,totalRecords:kind==='horseBatches'?
    totalHorses:totalPeople});
  }
 }
 manifest={...manifest,status:'COMPLETE'};
 await store.commitManifest(id,manifest);
 return manifest;
}
export async function readPersistent1999IndustryBatch(store,manifest,kind,index){
 if(manifest?.schema!==PERSISTENT_INDUSTRY_SCHEMA||
  manifest.status!=='COMPLETE'||
  !['horseBatches','personBatches'].includes(kind)||
  !Number.isInteger(index)||index<0||
  index>=(kind==='horseBatches'?manifest.horseBatchesCommitted:
   manifest.personBatchesCommitted))
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
export async function readPersistent1999HorseProfile(store,manifest,horseId){
 const horse=await findPersistent1999Horse(store,manifest,horseId);
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
  manifest.status!=='COMPLETE'||!store?.putCareerRun||
  typeof runId!=='string'||!/^[-A-Za-z0-9_]{1,80}$/.test(runId)||
  typeof gameDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(gameDate)||
  !player||typeof player!=='object'||Array.isArray(player)||
  !changes||typeof changes!=='object'||Array.isArray(changes)||
  !Number.isSafeInteger(version)||version<1)
  throw Error('Invalid persistent industry career run');
 const record={schema:'WTW_INDUSTRY_CAREER_RUN_V1',
  worldId:manifest.worldId,worldSeed:manifest.seed,
  worldSchema:manifest.schema,runId,gameDate,
  player:structuredClone(player),changes:structuredClone(changes),version};
 await store.putCareerRun(keyOf(manifest.seed,manifest.worldId),runId,record);
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
 return record;
}

export async function readPersistent1999Directory(store,manifest){
 if(manifest?.status!=='COMPLETE'||!manifest.directoryCommitted)
  throw Error('Industry directory is incomplete');
 const directory=await store.get('directory',keyOf(manifest.seed,manifest.worldId));
 if(!Array.isArray(directory))throw Error('Industry directory missing');
 return directory;
}
