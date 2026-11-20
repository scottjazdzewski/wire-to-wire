/** Portable checkpoint for one deterministic full-world 1999 test career. */
export const SHARED_1999_CAREER_PACKAGE_SCHEMA='WTW_SHARED_1999_CAREER_V1';
const utf8=new TextEncoder(),text=new TextDecoder();
const MAX_BYTES=64*1024*1024;
function canonicalJsonValue(value){
 if(Array.isArray(value))return value.map(canonicalJsonValue);
 if(value&&Object.getPrototypeOf(value)===Object.prototype){
  const sorted={};
  for(const key of Object.keys(value).sort())sorted[key]=canonicalJsonValue(value[key]);
  return sorted;
 }
 return value;
}
/** Compare a re-opened IndexedDB manifest with its JSON checkpoint form.
 * Structured clone can change object key insertion order; that is not a
 * world change. Array order and every JSON value still have to match. */
export function sameShared1999WorldManifest(a,b){
 return JSON.stringify(canonicalJsonValue(a))===JSON.stringify(canonicalJsonValue(b));
}
/** IndexedDB structured clones may reorder object keys without changing a career record. */
export function sameShared1999CareerRecord(a,b){
 return JSON.stringify(canonicalJsonValue(a))===JSON.stringify(canonicalJsonValue(b));
}
/** Return a bounded set of value paths when a durable career read-back differs. */
export function shared1999CareerRecordDifferencePaths(a,b,limit=12){
 if(!Number.isInteger(limit)||limit<1||limit>100)throw Error('Invalid career diff limit');
 const paths=[];
 const visit=(left,right,path)=>{
  if(paths.length>=limit||Object.is(left,right))return;
  const leftArray=Array.isArray(left),rightArray=Array.isArray(right);
  if(leftArray||rightArray){
   if(!leftArray||!rightArray){paths.push(path||'$');return;}
   if(left.length!==right.length)paths.push((path||'$')+'.length');
   for(let i=0;i<Math.min(left.length,right.length)&&paths.length<limit;i++)
    visit(left[i],right[i],(path||'$')+'['+i+']');
   return;
  }
  const leftObject=left&&typeof left==='object'&&Object.getPrototypeOf(left)===Object.prototype;
  const rightObject=right&&typeof right==='object'&&Object.getPrototypeOf(right)===Object.prototype;
  if(leftObject||rightObject){
   if(!leftObject||!rightObject){paths.push(path||'$');return;}
   const keys=[...new Set([...Object.keys(left),...Object.keys(right)])].sort();
   for(const key of keys){
    if(paths.length>=limit)break;
    if(!Object.hasOwn(left,key)||!Object.hasOwn(right,key))paths.push((path||'$')+'.'+key);
    else visit(left[key],right[key],(path||'$')+'.'+key);
   }
   return;
  }
  paths.push(path||'$');
 };
 visit(a,b,'');return paths;
}
/** Compare immutable census identity before the full-record SHA-256 check.
 * Generator metadata may evolve while a career checkpoint still names the
 * same seed, size and world. Record equality is verified after reopening. */
export function sameShared1999WorldIdentity(a,b){
 return a?.schema===b?.schema&&a?.worldId===b?.worldId&&a?.seed===b?.seed&&
  a?.targetOpeningHorses===b?.targetOpeningHorses&&
  a?.horseCount===b?.horseCount&&a?.personCount===b?.personCount;
}
/**
 * Rebind a portable career run only after the importer has independently
 * verified its exact legacy world projection. The canonical snapshot ID must
 * remain stable; only the verified record fingerprint may advance.
 */
export function migrateShared1999CareerRunWorldReference(careerRecord,{
 expectedSnapshotSha256,currentAuthority
}={}){
 const run=careerRecord?.changes?.canonicalRun;
 if(!run||! /^[a-f0-9]{64}$/.test(expectedSnapshotSha256||'')||
  run.world_ref?.sha256!==expectedSnapshotSha256)
  throw Error('Career run does not reference the verified legacy snapshot');
 if(typeof currentAuthority?.snapshot_id!=='string'||
  !/^[a-f0-9]{64}$/.test(currentAuthority?.sha256||'')||
  run.world_ref.snapshot_id!==currentAuthority.snapshot_id)
  throw Error('Shared career snapshot identity changed; explicit world migration is required');
 const migratedRun={...run,world_ref:{snapshot_id:currentAuthority.snapshot_id,
  sha256:currentAuthority.sha256}};
 return {...careerRecord,changes:{...careerRecord.changes,
  canonicalRun:migratedRun}};
}

/**
 * Advance a saved operation roster to include canonical horses newly linked
 * by a verified world migration. Existing career records stay authoritative;
 * only missing IDs and runtime records for those new IDs are appended.
 */
export function migrateShared1999CareerOperationInventory(careerRecord,openingRun){
 const saved=careerRecord?.changes?.canonicalRun;
 if(!saved||!openingRun||saved.run_id!==openingRun.run_id||
  saved.player?.operation_id!==openingRun.player?.operation_id||
  careerRecord.player?.operation_id!==saved.player?.operation_id||
  !Array.isArray(saved.stable_horse_ids)||
  !Array.isArray(openingRun.stable_horse_ids)||
  !saved.runtime||!openingRun.runtime)
  throw Error('Career operation inventory migration inputs do not match');
 const savedIds=new Set(saved.stable_horse_ids);
 if(savedIds.size!==saved.stable_horse_ids.length||
  new Set(openingRun.stable_horse_ids).size!==openingRun.stable_horse_ids.length)
  throw Error('Career operation inventory migration requires unique horse IDs');
 const addedHorseIds=openingRun.stable_horse_ids.filter(id=>!savedIds.has(id));
 if(!addedHorseIds.length)return {careerRecord,addedHorseIds:[]};
 const migrated=structuredClone(careerRecord);
 const run=migrated.changes.canonicalRun;
 const openingRegistry=openingRun.runtime.registered_horses;
 const registry=run.runtime.registered_horses;
 for(const id of addedHorseIds){
  const openingHorse=openingRegistry?.by_id?.[id];
  if(!openingHorse)continue;
  if(openingHorse.horse_id!==id||!registry?.by_id||!registry?.by_receipt)
   throw Error('New operation runner is missing its canonical registry records');
  if(!registry.by_id[id])registry.by_id[id]=structuredClone(openingHorse);
  const receiptId=openingHorse.registration_receipt_id;
  if(receiptId){
   const existing=registry.by_receipt[receiptId];
   if(existing&&existing!==id)
    throw Error('New operation runner receipt is already linked to another horse');
   registry.by_receipt[receiptId]=id;
  }
  if(openingRun.runtime.horse?.[id]&&!run.runtime.horse?.[id])
   run.runtime.horse[id]=structuredClone(openingRun.runtime.horse[id]);
  const trainerId=openingHorse.trainer_id;
  const openingTrainer=openingRun.runtime.people?.[trainerId];
  if(openingTrainer?.game_training_skills){
   const trainer=run.runtime.people?.[trainerId]||{};
   if(!trainer.game_training_skills)
    run.runtime.people[trainerId]={...trainer,
     game_training_skills:structuredClone(openingTrainer.game_training_skills)};
  }
  const siteId=openingHorse.current_residence_id||openingHorse.racing_barn_id;
  const openingSite=openingRun.runtime.facilities?.sites?.[siteId];
  if(openingSite&&!run.runtime.facilities?.sites?.[siteId]){
   if(!run.runtime.facilities)run.runtime.facilities={sites:{}};
   if(!run.runtime.facilities.sites)run.runtime.facilities.sites={};
   run.runtime.facilities.sites[siteId]=structuredClone(openingSite);
  }
 }
 const previousCount=run.stable_horse_ids.length;
 run.stable_horse_ids.push(...addedHorseIds);
 run.revision++;
 const eventSeq=Math.max(run.event_seq||0,
  ...run.event_log.map(event=>event.seq||0))+1;
 run.event_log.push({seq:eventSeq,
  command_id:'CAREER_MIGRATION:OPERATION_INVENTORY:'+run.run_id+':'+eventSeq,
  date:run.clock.date,kind:'CAREER_OPERATION_INVENTORY_MIGRATED',
  details:{operation_id:run.player.operation_id,
   added_horse_ids:[...addedHorseIds],previous_count:previousCount,
   current_count:run.stable_horse_ids.length}});
 run.event_seq=eventSeq;
 migrated.gameDate=run.clock.date;
 migrated.version=Math.max(1,Number.isSafeInteger(migrated.version)?migrated.version:1)+1;
 return {careerRecord:migrated,addedHorseIds};
}

async function sha256(bytes){
 if(!globalThis.crypto?.subtle)throw Error('Web Crypto is required for career checkpoint integrity');
 const hash=new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes));
 return [...hash].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function assertInputs(manifest,careerRecord){
 if(!['WTW_PERSISTENT_INDUSTRY_1999_V1','WTW_PERSISTENT_INDUSTRY_1999_V2',
   'WTW_PERSISTENT_INDUSTRY_1999_V3']
   .includes(manifest?.schema)||manifest.status!=='COMPLETE'||
  !Number.isSafeInteger(manifest.seed)||typeof manifest.worldId!=='string'||
  !Number.isSafeInteger(manifest.horseCount)||!Number.isSafeInteger(manifest.personCount)||
  !Number.isSafeInteger(manifest.targetOpeningHorses)||
  careerRecord?.schema!=='WTW_INDUSTRY_CAREER_RUN_V1'||
  careerRecord.worldId!==manifest.worldId||careerRecord.worldSeed!==manifest.seed||
  careerRecord.worldSchema!==manifest.schema||
  typeof careerRecord.runId!=='string'||!careerRecord.runId||
  !careerRecord.changes?.canonicalRun)
  throw Error('Full-world career checkpoint is missing its completed world or career record');
 const run=careerRecord.changes.canonicalRun;
 if(run.run_id!==careerRecord.runId||run.clock?.date!==careerRecord.gameDate||
  JSON.stringify(run.player)!==JSON.stringify(careerRecord.player))
  throw Error('Full-world career checkpoint run metadata does not match its saved state');
}
/**
 * Store the frozen manifest and exact canonical career run. The world rows are
 * recreated from this manifest's seed/revisions and verified by snapshot hash
 * at import, keeping the portable file small without weakening identity.
 */
export async function packShared1999Career({manifest,snapshotSha256,careerRecord}={}){
 assertInputs(manifest,careerRecord);
 if(!/^[a-f0-9]{64}$/.test(snapshotSha256||''))
  throw Error('Full-world career checkpoint requires a SHA-256 world snapshot');
 const payload={schema:SHARED_1999_CAREER_PACKAGE_SCHEMA,
  world:{worldId:manifest.worldId,seed:manifest.seed,
   targetOpeningHorses:manifest.targetOpeningHorses,
   horseCount:manifest.horseCount,personCount:manifest.personCount,
   manifest,snapshotSha256},careerRecord};
 const raw=utf8.encode(JSON.stringify(payload));
 if(raw.byteLength>MAX_BYTES)throw Error('Shared career checkpoint exceeds 64 MiB');
 const envelope={schema:SHARED_1999_CAREER_PACKAGE_SCHEMA,
  checksum:await sha256(raw),payload};
 return utf8.encode(JSON.stringify(envelope));
}
export async function unpackShared1999Career(input){
 const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
 if(bytes.byteLength>MAX_BYTES||!bytes.byteLength)
  throw Error('Shared career checkpoint is empty or exceeds 64 MiB');
 let envelope;
 try{envelope=JSON.parse(text.decode(bytes))}
 catch{throw Error('Shared career checkpoint is not valid JSON')}
 if(envelope?.schema!==SHARED_1999_CAREER_PACKAGE_SCHEMA||
  envelope.payload?.schema!==SHARED_1999_CAREER_PACKAGE_SCHEMA)
  throw Error('Unsupported shared full-world career checkpoint');
 const expected=await sha256(utf8.encode(JSON.stringify(envelope.payload)));
 if(envelope.checksum!==expected)throw Error('Shared career checkpoint checksum mismatch');
 const {world,careerRecord}=envelope.payload;
 assertInputs(world?.manifest,careerRecord);
 const manifest=world.manifest;
 if(world.worldId!==manifest.worldId||world.seed!==manifest.seed||
  world.targetOpeningHorses!==manifest.targetOpeningHorses||
  world.horseCount!==manifest.horseCount||world.personCount!==manifest.personCount||
  !/^[a-f0-9]{64}$/.test(world.snapshotSha256||''))
  throw Error('Shared career checkpoint world identity is inconsistent');
 return envelope.payload;
}
