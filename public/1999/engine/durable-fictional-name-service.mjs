/**
 * Wire to Wire V12 — durable, append-only naming service (no world mutation).
 *
 * On a new request, V11 builds a pure naming PROPOSAL against an indexed,
 * reconstructed registry. The underlying storage commits an incremental
 * batch + compact cursor in one revision-guarded transaction. Only after
 * that commit completes is the in-memory index advanced.
 *
 * This creates no horses, active-world population, gameplay relationships,
 * saves or user-interface changes. Durable naming data is kept separate.
 */
import {
 createIndexedFictionalNameRegistry,prepareIndexedFictionalNameBatch,
 commitPreparedIndexedFictionalNameBatch,
 COMPACT_FICTIONAL_NAME_CURSOR_MODEL,
 INDEXED_FICTIONAL_NAME_REGISTRY_MODEL
} from './indexed-fictional-name-registry.mjs';

export const DURABLE_FICTIONAL_NAMING_MODEL='WTW_DURABLE_FICTIONAL_NAMES_V12';
export const DURABLE_NAMING_BUNDLE_MODEL='WTW_NAMING_ARCHIVE_V12';
const safeNames=(names,label)=>{
 if(!Array.isArray(names)||names.some(n=>typeof n!=='string'||!n.trim()))
  throw Error('Invalid '+label);
 return [...names];
};
const clone=value=>JSON.parse(JSON.stringify(value));
function validateWorld(worldId,seed){
 if(typeof worldId!=='string'||!/^[a-zA-Z][a-zA-Z0-9-]{1,47}$/.test(worldId))
  throw Error('Invalid durable world ID');
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295)
  throw Error('Invalid durable world seed');
}
const compact=(prepared,registry)=>Object.freeze({
 model:COMPACT_FICTIONAL_NAME_CURSOR_MODEL,
 worldId:prepared.worldId,seed:prepared.seed,year:prepared.year,
 revision:prepared.expectedRevision+1,nextBatch:prepared.batchIndex+1,
 maxPartnershipGroups:prepared.limit,
 partnershipsIssued:registry.formalGroupsIssued+prepared.groups.length,
 soleOwnerPercent:prepared.soleOwnerPercent,
 namesIssued:registry.namesIssued+prepared.batch.people.length+
  prepared.organizations.length,
 ownersIssued:registry.ownerCount+prepared.batch.owners.length
});
function batchRecord(prepared){
 const people=prepared.batch.people.map(x=>({id:x.id,name:x.name,
  role:x.role,primarySurname:x.primarySurname,birthYear:x.birthYear}));
 const owners=prepared.batch.owners.map(x=>({
  id:x.id,name:x.name,namingRegion:x.namingRegion,
  ownershipArchetype:x.ownershipArchetype,principalId:x.principalId
 }));
 // Only owner organizations need principal/sole-name metadata for V11
 // replay validation. Non-owner stable/farm names remain distinct entities.
 const organizations=prepared.organizations.map(x=>({
  id:x.id,name:x.name,principalId:x.principalId??null,
  ownershipArchetype:x.ownershipArchetype??null
 }));
 return Object.freeze({
  expectedRevision:prepared.expectedRevision,
  revision:prepared.expectedRevision+1,batchIndex:prepared.batchIndex,
  people,organizations,owners
 });
}
function ensureStoredData(data,worldId,seed){
 if(!data||!data.meta||!Array.isArray(data.batches)||
  data.meta.worldId!==worldId||data.meta.seed!==seed||
  data.meta.model!==DURABLE_FICTIONAL_NAMING_MODEL)
  throw Error('Missing or incompatible durable naming data');
}
function hydrate(data){
 const meta=data.meta;
 const registry=createIndexedFictionalNameRegistry({
  worldId:meta.worldId,seed:meta.seed,
  protectedPeople:meta.protectedPeople,
  protectedOrganizations:meta.protectedOrganizations
 });
 const sorted=[...data.batches].sort((a,b)=>a.revision-b.revision);
 for(const row of sorted){
  if(row.expectedRevision!==registry.revision||
   row.revision!==registry.revision+1||!Number.isSafeInteger(row.batchIndex)||
   !Array.isArray(row.people)||!Array.isArray(row.organizations)||
   !Array.isArray(row.owners))
   throw Error('Broken naming-registry event sequence');
  registry.commit({
   expectedRevision:row.expectedRevision,batchIndex:row.batchIndex,
   people:row.people,organizations:row.organizations,owners:row.owners
  });
 }
 if(registry.revision!==meta.revision)
  throw Error('Durable registry and cursor revisions disagree');
 const cursor=meta.cursor??null;
 if(cursor!==null&&(
  cursor.model!==COMPACT_FICTIONAL_NAME_CURSOR_MODEL||
  cursor.revision!==registry.revision||cursor.worldId!==meta.worldId||
  cursor.seed!==meta.seed||cursor.partnershipsIssued!==registry.formalGroupsIssued||
  cursor.namesIssued!==registry.namesIssued||
  cursor.ownersIssued!==registry.ownerCount
 ))throw Error('Durable naming cursor failed identity reconciliation');
 if(meta.revision>0&&!cursor)throw Error('Committed naming registry has no cursor');
 return {registry,cursor};
}
function assertStorage(storage){
 if(!storage||typeof storage.read!=='function'||
  typeof storage.initialize!=='function'||
  typeof storage.append!=='function')
  throw Error('Durable naming requires an atomic storage adapter');
}
async function checksumText(value){
 const text=JSON.stringify(value);
 const bytes=new TextEncoder().encode(text);
 if(globalThis.crypto?.subtle){
  const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return 'sha256-'+Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
 }
 // Fallback detects accidental bit rot; it is NOT a cryptographic signature.
 let h=2166136261;
 for(const b of bytes){h^=b;h=Math.imul(h,16777619)}
 return 'fnv32-'+(h>>>0).toString(16).padStart(8,'0');
}
export async function signDurableNamingBundle(data){
 const payload=clone(data);
 if(payload?.integrity!==undefined)delete payload.integrity;
 return Object.freeze({...payload,integrity:await checksumText(payload)});
}
export async function verifyDurableNamingBundle(bundle){
 if(!bundle||bundle.schema!==DURABLE_NAMING_BUNDLE_MODEL||
  typeof bundle.integrity!=='string')
  throw Error('Invalid portable naming-registry bundle');
 const content={...bundle};
 delete content.integrity;
 if(await checksumText(content)!==bundle.integrity)
  throw Error('Portable naming-registry bundle checksum mismatch');
 return clone(content);
}
/**
 * Restore one explicitly exported naming archive into a NEW registry
 * namespace. The restore adapter must be all-or-nothing and must REFUSE
 * replacing any existing world. Never import into the active career state.
 */
export async function restoreDurableFictionalNamingBundle({storage,bundle}={}){
 assertStorage(storage);
 if(typeof storage.restore!=='function')
  throw Error('Naming storage cannot atomically restore a backup');
 const payload=await verifyDurableNamingBundle(bundle);
 if(payload.worldId!==payload.meta?.worldId||
  payload.seed!==payload.meta?.seed)
  throw Error('Portable naming archive identity mismatch');
 validateWorld(payload.worldId,payload.seed);
 // Check the entire journal BEFORE touching persistent IndexedDB.
 hydrate({meta:payload.meta,batches:payload.batches});
 await storage.restore({meta:payload.meta,batches:payload.batches});
 return openDurableFictionalNameService({
  storage,worldId:payload.worldId,seed:payload.seed
 });
}

/**
 * Explicitly turn a complete VERIFIED V11 snapshot into a V12 portable
 * archive. One historical baseline event keeps its original names/IDs and
 * continues numbering future batches from the V11 cursor. Source records
 * must include the V11 person, organization and owner arrays.
 *
 * Not a best-effort conversion of V8 mintedNames alone: those names lack
 * enough relationship records to reconstruct the old world safely.
 */
export async function bundleLegacyV11NamingSnapshot({
 snapshot,cursor,maxPartnershipGroups=null
}={}){
 if(!snapshot||snapshot.model!==INDEXED_FICTIONAL_NAME_REGISTRY_MODEL||
  !cursor||cursor.model!==COMPACT_FICTIONAL_NAME_CURSOR_MODEL||
  snapshot.worldId!==cursor.worldId||snapshot.seed!==cursor.seed)
  throw Error('V11 naming migration needs matching full snapshot and cursor');
 const source=createIndexedFictionalNameRegistry({
  worldId:snapshot.worldId,seed:snapshot.seed,snapshot
 });
 if(source.revision!==cursor.revision||
  source.namesIssued!==cursor.namesIssued||
  source.ownerCount!==cursor.ownersIssued||
  source.formalGroupsIssued!==cursor.partnershipsIssued)
  throw Error('Legacy V11 naming checkpoint and snapshot disagree');
 const rev=source.namesIssued?1:0;
 if(rev===0&&cursor.revision!==0)
  throw Error('Legacy snapshot has revisions without issued identities');
 const oldOwnerById=new Map(snapshot.ownerEntities.map(owner=>[owner.id,owner]));
 const batch=rev===1?{
  expectedRevision:0,revision:1,batchIndex:cursor.nextBatch-1,
  people:clone(snapshot.issuedPeople),
  organizations:snapshot.issuedOrganizations.map(org=>{
   const owner=oldOwnerById.get(org.id);
   return {...org,principalId:owner?.principalId??null,
    ownershipArchetype:owner?.archetype??null};
  }),
  owners:snapshot.ownerEntities.map(o=>({
   id:o.id,name:o.name,namingRegion:o.region,
   ownershipArchetype:o.archetype,principalId:o.principalId
  }))
 }:null;
 const upgradedCursor=rev===1?{
  ...cursor,revision:1,nextBatch:cursor.nextBatch,
  maxPartnershipGroups:maxPartnershipGroups??cursor.maxPartnershipGroups
 }:null;
 const meta={
  model:DURABLE_FICTIONAL_NAMING_MODEL,
  worldId:snapshot.worldId,seed:snapshot.seed,
  protectedPeople:clone(snapshot.protectedPeople),
  protectedOrganizations:clone(snapshot.protectedOrganizations),
  revision:rev,cursor:upgradedCursor
 };
 const batches=batch?[batch]:[];
 hydrate({meta,batches});
 return signDurableNamingBundle({
  schema:DURABLE_NAMING_BUNDLE_MODEL,
  worldId:meta.worldId,seed:meta.seed,meta,batches
 });
}
/**
 * Opens a detached naming namespace. Storage is supplied by a browser
 * IndexedDB or a deterministic persistence test adapter. A full registry is
 * read ONCE at open/recovery, not recopied for every name request.
 *
 * Concurrent browser tabs are protected by adapter-side revision CAS.
 */
export async function openDurableFictionalNameService({
 storage,worldId,seed,protectedPeople=[],protectedOrganizations=[]
}={}){
 assertStorage(storage);validateWorld(worldId,seed);
 safeNames(protectedPeople,'protected people');safeNames(protectedOrganizations,'protected organizations');
 let data=await storage.read({worldId,seed});
 if(!data){
  try{
   await storage.initialize({
    model:DURABLE_FICTIONAL_NAMING_MODEL,worldId,seed,revision:0,cursor:null,
    protectedPeople:clone(protectedPeople),protectedOrganizations:clone(protectedOrganizations)
   });
  }catch(error){
   // Two tabs may race to open the same empty registry. An atomic IDB
   // key collision means the other tab probably initialized it. Re-read
   // and VERIFY the same protected identity foundations before proceeding.
   data=await storage.read({worldId,seed});
   if(!data)throw error;
  }
  if(!data)data=await storage.read({worldId,seed});
 }
 ensureStoredData(data,worldId,seed);
 if((protectedPeople.length||protectedOrganizations.length)&&(
  JSON.stringify(data.meta.protectedPeople)!==JSON.stringify(protectedPeople)||
  JSON.stringify(data.meta.protectedOrganizations)!==JSON.stringify(protectedOrganizations)))
  throw Error('Existing naming registry has different protected identities');
 let {registry,cursor}=hydrate(data);
 let unusable=false;
 async function refresh(){
  const latest=await storage.read({worldId,seed});
  ensureStoredData(latest,worldId,seed);
  ({registry,cursor}=hydrate(latest));
  unusable=false;
  return cursor;
 }
 async function generate({
  year=cursor?.year??1999,
  roles={},owners=0,facilities={},maxPartnershipGroups=null,
  soleOwnerPercent=cursor?.soleOwnerPercent??23,
  markets,originWeightsByRole,jockeyOriginWeightsByColony
 }={}){
  if(unusable)throw Error('Naming service requires refresh after a failed commit');
  const prepared=prepareIndexedFictionalNameBatch({
   registry,worldId,seed,cursor,year,roles,owners,facilities,
   maxPartnershipGroups,soleOwnerPercent,markets,
   originWeightsByRole,jockeyOriginWeightsByColony
  });
  const nextCursor=compact(prepared,registry);
  const record=batchRecord(prepared);
  // Atomic durable append FIRST. If this rejects, in-memory identities
  // remain entirely unmodified; the returned cursor never advances.
  await storage.append({worldId,seed,expectedRevision:prepared.expectedRevision,
   batch:record,cursor:nextCursor});
  try {
   const result=commitPreparedIndexedFictionalNameBatch(prepared);
   if(JSON.stringify(result.nextCursor)!==JSON.stringify(nextCursor))
    throw Error('Durable and memory naming cursors diverged');
   cursor=result.nextCursor;
   return Object.freeze({...result,storageModel:DURABLE_FICTIONAL_NAMING_MODEL});
  }catch(error){
   // Persistence succeeded. Never continue using a potentially stale
   // local registry; explicitly refresh from the durable journal.
   unusable=true;
   throw Error('Committed naming batch requires registry recovery: '+error.message);
  }
 }
 async function exportBundle(){
  const latest=await storage.read({worldId,seed});
  ensureStoredData(latest,worldId,seed);
  return signDurableNamingBundle({
   schema:DURABLE_NAMING_BUNDLE_MODEL,worldId,seed,
   meta:latest.meta,batches:latest.batches
  });
 }
 return Object.freeze({
  model:DURABLE_FICTIONAL_NAMING_MODEL,
  worldId,seed,get cursor(){return cursor},
  get revision(){return registry.revision},
  get namesIssued(){return registry.namesIssued},
  get ownerCount(){return registry.ownerCount},
  get partnershipGroupsIssued(){return registry.formalGroupsIssued},
  generate,refresh,exportBundle,
  listOwners:(options)=>registry.listOwners(options),
  listGroups:(options)=>registry.listGroups(options),
  hasName:(name)=>registry.hasAnyName(name),
  getApprovedPerson:(id)=>registry.getApprovedPerson(id)
 });
}
