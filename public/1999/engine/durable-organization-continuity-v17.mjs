/**
 * WTW V17 — detached durable organization continuity journal.
 *
 * Storage retains the approved founding directory ONCE, followed by one
 * immutable event per transition. Save the event with a revision-guarded
 * transaction BEFORE applying it to the in-memory V16 projection.
 *
 * No active world, horses, UI, existing save format or real historical
 * organization records are mutated by this opt-in capability.
 */
import {
 createFictionalOrganizationContinuityRegistry,
 sealFictionalOrganizationContinuitySnapshot,
 FICTIONAL_ORGANIZATION_CONTINUITY_MODEL
} from './fictional-organization-continuity-v16.mjs';

export const DURABLE_ORGANIZATION_CONTINUITY_MODEL='WTW_DURABLE_ORGANIZATION_CONTINUITY_V17';
export const PORTABLE_ORGANIZATION_CONTINUITY_MODEL='WTW_ORGANIZATION_CONTINUITY_ARCHIVE_V17';
const clone=x=>JSON.parse(JSON.stringify(x));
function validateStorage(storage){
 if(!storage||!['read','initialize','append','restore'].every(
  method=>typeof storage[method]==='function'))
  throw Error('Durable continuity requires a transaction-capable storage adapter');
}
function hydrate(data,options={}){
 if(!data||data.meta?.model!==DURABLE_ORGANIZATION_CONTINUITY_MODEL||
  !data.meta.original||!Array.isArray(data.events)||
  !Number.isInteger(data.meta.revision)||data.meta.revision<0||
  data.meta.revision!==data.events.length)
  throw Error('Invalid durable continuity journal');
 // Restore through V16's full event validator: malformed or contradictory
 // transactions cannot be silently repaired by the persistence layer.
 const snapshot=sealFictionalOrganizationContinuitySnapshot({
  original:data.meta.original,events:data.events
 });
 const registry=createFictionalOrganizationContinuityRegistry({
  snapshot,...options
 });
 const current=registry.cursor;
 if(current.revision!==data.meta.revision||
  current.worldId!==data.meta.worldId||
  JSON.stringify(current)!==JSON.stringify(data.meta.cursor))
  throw Error('Durable continuity cursor and event journal disagree');
 return registry;
}
export async function openDurableOrganizationContinuityService({
 storage,worldId,source=null,approvedPersonLookup=null,familyLinkLookup=null,
 approvedOrganizationLookup=null
}={}){
 validateStorage(storage);
 if(typeof worldId!=='string'||!worldId.trim())
  throw Error('Explicit continuity world ID required');
 const validators={approvedPersonLookup,familyLinkLookup,approvedOrganizationLookup};
 let data=await storage.read({worldId});
 if(!data){
  if(!source)throw Error('Opening a new continuity journal needs an approved founding directory');
  if(source.worldId!==worldId)
   throw Error('Founding organization world ID mismatch');
  const proposed=createFictionalOrganizationContinuityRegistry({source,...validators});
  const original=proposed.exportSnapshot().original;
  const meta={model:DURABLE_ORGANIZATION_CONTINUITY_MODEL,
   worldId,revision:0,cursor:proposed.cursor,original};
  try{await storage.initialize(meta)}catch(error){
   const concurrent=await storage.read({worldId});
   if(!concurrent)throw error;
   // Never accept simultaneous initialization against an incompatible
   // pre-existing founding directory.
   if(JSON.stringify(concurrent.meta.original)!==JSON.stringify(original))
    throw Error('Concurrent continuity foundation differs');
  }
  data=await storage.read({worldId});
 }else if(source){
  const candidate=createFictionalOrganizationContinuityRegistry({source}).exportSnapshot().original;
  if(JSON.stringify(candidate)!==JSON.stringify(data.meta.original))
   throw Error('Continuity founding identities cannot be silently replaced');
 }
 let registry=hydrate(data,validators),needsRefresh=false;
 async function refresh(){
  const latest=await storage.read({worldId});
  registry=hydrate(latest,validators);
  needsRefresh=false;
  return registry.cursor;
 }
 async function apply({expectedRevision,event}={}){
  if(needsRefresh)throw Error('Durable continuity requires a refresh');
  if(expectedRevision!==registry.revision)
   throw Error('Stale continuity service cursor');
  // Preview validates the SAME V16 transition in place, without mutation.
  const proposal=registry.preview({expectedRevision,event});
  const recorded=clone({...event,revision:proposal.revision});
  try{
   await storage.append({worldId,expectedRevision,event:recorded,cursor:proposal});
  }catch(error){
   needsRefresh=true; // disk may have advanced in another tab
   throw error;
  }
  try{
   const committed=registry.apply({expectedRevision,event});
   if(JSON.stringify(committed)!==JSON.stringify(proposal))
    throw Error('Continuity disk and projection cursors disagree');
   return committed;
  }catch(error){
   needsRefresh=true;
   throw Error('Continuity committed to disk; refresh required: '+error.message);
  }
 }
 async function exportArchive(){
  const latest=await storage.read({worldId});
  const validated=hydrate(latest,validators);
  const snapshot=validated.exportSnapshot();
  return Object.freeze({
   model:PORTABLE_ORGANIZATION_CONTINUITY_MODEL,worldId,
   snapshot,revision:validated.revision
  });
 }
 return Object.freeze({
  model:DURABLE_ORGANIZATION_CONTINUITY_MODEL,worldId,
  get cursor(){return registry.cursor},
  get revision(){return registry.revision},
  get eventCount(){return registry.eventCount},
  get organizationCount(){return registry.organizationCount},
  getOrganization:(...a)=>registry.getOrganization(...a),
  getPerson:(...a)=>registry.getPerson(...a),
  getHistory:(...a)=>registry.getHistory(...a),
  listOrganizations:(...a)=>registry.listOrganizations(...a),
  apply,refresh,exportArchive
 });
}
/**
 * Import a portable V16/V17 archive ONLY into a new namespace. All events
 * are validated before the first store write; the adapter must restore
 * foundation and journal atomically and refuse to replace existing data.
 */
export async function restoreDurableOrganizationContinuityArchive({
 storage,archive
}={}){
 validateStorage(storage);
 if(!archive||archive.model!==PORTABLE_ORGANIZATION_CONTINUITY_MODEL||
  !archive.snapshot||archive.worldId!==archive.snapshot.original?.worldId)
  throw Error('Invalid durable continuity archive');
 const verified=createFictionalOrganizationContinuityRegistry({
  snapshot:archive.snapshot
 });
 if(verified.revision!==archive.revision)
  throw Error('Durable continuity archive revision mismatch');
 const meta={model:DURABLE_ORGANIZATION_CONTINUITY_MODEL,
  worldId:archive.worldId,revision:verified.revision,
  cursor:verified.cursor,original:clone(archive.snapshot.original)};
 const events=clone(archive.snapshot.events);
 await storage.restore({meta,events});
 return openDurableOrganizationContinuityService({
  storage,worldId:archive.worldId
 });
}
