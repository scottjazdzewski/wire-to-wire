/**
 * Wire to Wire V20 — detached, read-only industry capacity/reuse planning.
 *
 * This is NOT an allocation ledger: occupancy arrives as already established
 * counts from the caller, and all returned placements are proposals only.
 * Nothing creates horses, people, organizations, saves or financial contracts.
 *
 * One indexed scan builds small per-kind buckets; proposals do not walk all
 * historical events or copy the 1999 world per horse.
 */
import {FICTIONAL_INDUSTRY_SLOT_LIMITS_V20}
 from './fictional-organization-continuity-v16.mjs';

export const FICTIONAL_INDUSTRY_OPERATIONS_MODEL_V20='WTW_FICTIONAL_INDUSTRY_OPERATIONS_V20';
export const FICTIONAL_INDUSTRY_REUSE_POLICIES_V20=Object.freeze([
 'PREFER_ESTABLISHED','BALANCE_LOAD'
]);
const KINDS=new Set(Object.keys(FICTIONAL_INDUSTRY_SLOT_LIMITS_V20));
const freezeRow=x=>Object.freeze({...x});
function checkKind(kind){
 if(!KINDS.has(kind))throw Error('Unknown industry organization type');
}
function checkCount(value,label,{min=0,max=100000000}={}){
 if(!Number.isSafeInteger(value)||value<min||value>max)
  throw Error('Invalid '+label);
 return value;
}
function occupancyValue(usage,id){
 const value=usage instanceof Map?usage.get(id):
  Object.prototype.hasOwnProperty.call(usage,id)?usage[id]:undefined;
 return checkCount(value??0,'observed occupancy for '+id);
}
function revisionOf(continuity){
 const revision=continuity?.continuityRevision??continuity?.revision;
 if(!Number.isSafeInteger(revision)||revision<0)
  throw Error('Continuity registry must expose a current revision');
 return revision;
}
function verifyRegion(region){
 if(region!==null&&(typeof region!=='string'||!region.trim()))
  throw Error('Requested naming region must be a nonempty string or null');
}
function checkRequest({kind,region,policy,includeOtherRegions}){
 checkKind(kind);verifyRegion(region);
 if(!FICTIONAL_INDUSTRY_REUSE_POLICIES_V20.includes(policy))
  throw Error('Unknown industry reuse policy');
 if(typeof includeOtherRegions!=='boolean')
  throw Error('Cross-region capacity fallback must be explicit');
}
const compareStable=(a,b)=>a.id.localeCompare(b.id,'en');
function sortCandidates(rows,{region,policy}){
 return rows.sort((a,b)=>{
  // Region is a business-locality constraint, not a travel-time estimate.
  if(region!==null){
   const localA=a.namingRegion===region,localB=b.namingRegion===region;
   if(localA!==localB)return localA?-1:1;
  }
  if(policy==='PREFER_ESTABLISHED'){
   if((a.occupied>0)!==(b.occupied>0))return a.occupied>0?-1:1;
   if(a.occupied!==b.occupied)return b.occupied-a.occupied;
   if(a.available!==b.available)return b.available-a.available;
  }else{
   const fractionA=a.occupied/a.capacity,fractionB=b.occupied/b.capacity;
   if(fractionA!==fractionB)return fractionA-fractionB;
   if(a.available!==b.available)return b.available-a.available;
  }
  return compareStable(a,b);
 });
}
/**
 * Build an ephemeral capacity index from one V16/V17/V18 continuity revision.
 *
 * Usage is an existing aggregate count per established organization ID:
 *  - OWNER: owned-horse portfolio
 *  - STABLE: horses currently in training
 *  - FARM: resident horses
 *  - TRAINING_CENTER: horses in development
 *
 * These are independent ledgers supplied by gameplay; no horse IDs or
 * ownership assignments are held, inferred, moved or persisted here.
 */
export function createFictionalIndustryReuseIndexV20({
 continuity,usageByOrganizationId={}
}={}){
 if(!continuity||typeof continuity.iterateOrganizations!=='function')
  throw Error('Industry reuse requires the existing continuity organization index');
 if(!(usageByOrganizationId instanceof Map)&&
  (!usageByOrganizationId||typeof usageByOrganizationId!=='object'||
   Array.isArray(usageByOrganizationId)))
  throw Error('Occupancy requires a Map or keyed record');
 const capturedRevision=revisionOf(continuity);
 const rowsByKind=new Map([...KINDS].map(k=>[k,[]]));
 const countsByKind=new Map([...KINDS].map(k=>[k,{
  activeOrganizations:0,configuredOrganizations:0,unconfiguredOrganizations:0,
  capacitySlots:0,occupiedSlots:0,freeSlots:0,overCapacityOrganizations:0
 }]));
 const seen=new Set();
 for(const op of continuity.iterateOrganizations({status:'ACTIVE'})){
  checkKind(op.kind);
  if(seen.has(op.id))throw Error('Duplicate permanent organization ID in continuity scan');
  seen.add(op.id);
  const stats=countsByKind.get(op.kind);
  stats.activeOrganizations++;
  const config=op.operatingCapacity;
  if(config===undefined||config===null){
   stats.unconfiguredOrganizations++;
   continue;
  }
  const policy=FICTIONAL_INDUSTRY_SLOT_LIMITS_V20[op.kind];
  if(!Number.isSafeInteger(config.horseSlots)||config.horseSlots<1||
   config.horseSlots>policy.max||config.slotType!==policy.slotType)
   throw Error('Corrupt kind-specific operating capacity for '+op.id);
  const used=occupancyValue(usageByOrganizationId,op.id);
  const available=Math.max(0,config.horseSlots-used);
  stats.configuredOrganizations++;
  stats.capacitySlots+=config.horseSlots;
  stats.occupiedSlots+=used;
  stats.freeSlots+=available;
  if(used>config.horseSlots)stats.overCapacityOrganizations++;
  rowsByKind.get(op.kind).push(freezeRow({
   id:op.id,name:op.name,kind:op.kind,namingRegion:op.namingRegion,
   capacity:config.horseSlots,slotType:config.slotType,
   occupied:used,available,
   capacityUpdatedYear:config.updatedYear,
   overCapacity:used>config.horseSlots
  }));
 }
 function assertFresh(){
  if(revisionOf(continuity)!==capturedRevision)
   throw Error('Industry reuse index is stale; rebuild from current continuity');
 }
 function filterSorted({kind,region=null,policy='PREFER_ESTABLISHED',
  includeOtherRegions=false,minSlots=1}={}){
  assertFresh();
  checkRequest({kind,region,policy,includeOtherRegions});
  checkCount(minSlots,'required free horse slots',{min:1,max:100000000});
  return sortCandidates(rowsByKind.get(kind).filter(row=>
   row.available>=minSlots&&
   (region===null||includeOtherRegions||row.namingRegion===region)
  ),{region,policy});
 }
 function findReusable({
  kind,region=null,slots=1,policy='PREFER_ESTABLISHED',
  includeOtherRegions=false,limit=25
 }={}){
  checkCount(limit,'candidate page size',{min:1,max:250});
  const rows=filterSorted({kind,region,policy,includeOtherRegions,
   minSlots:slots}).slice(0,limit);
  return Object.freeze({
   model:FICTIONAL_INDUSTRY_OPERATIONS_MODEL_V20,
   type:'READ_ONLY_REUSE_OPTIONS',revision:capturedRevision,kind,region,
   requiredSlots:slots,
   candidates:Object.freeze(rows),
   needsAdditionalCapacity:rows.length===0,
   makesAssignments:false
  });
 }
 function planAggregateDemand({
  kind,region=null,horseCount,policy='PREFER_ESTABLISHED',
  includeOtherRegions=false
 }={}){
  checkCount(horseCount,'aggregate horse demand',{min:1,max:10000000});
  const candidates=filterSorted({kind,region,policy,includeOtherRegions,
   minSlots:1});
  let remaining=horseCount;
  const allocations=[];
  for(const row of candidates){
   if(remaining===0)break;
   const slots=Math.min(remaining,row.available);
   if(slots===0)continue;
   allocations.push(freezeRow({
    organizationId:row.id,organizationName:row.name,
    namingRegion:row.namingRegion,slotType:row.slotType,
    proposedHorseSlots:slots,alreadyOccupied:row.occupied,
    capacity:row.capacity
   }));
   remaining-=slots;
  }
  return Object.freeze({
   model:FICTIONAL_INDUSTRY_OPERATIONS_MODEL_V20,
   type:'READ_ONLY_AGGREGATE_DEMAND_PLAN',
   revision:capturedRevision,kind,region,
   requestedHorseSlots:horseCount,proposedHorseSlots:horseCount-remaining,
   unplacedHorseSlots:remaining,
   requiresAdditionalCapacity:remaining>0,
   makesAssignments:false,
   allocations:Object.freeze(allocations)
  });
 }
 function getSummary({kind=null}={}){
  assertFresh();
  if(kind!==null)checkKind(kind);
  const kinds=kind===null?[...KINDS]:[kind],sums={};
  for(const selected of kinds)sums[selected]=freezeRow(countsByKind.get(selected));
  return Object.freeze({
   model:FICTIONAL_INDUSTRY_OPERATIONS_MODEL_V20,
   revision:capturedRevision,
   byKind:Object.freeze(sums)
  });
 }
 return Object.freeze({
  model:FICTIONAL_INDUSTRY_OPERATIONS_MODEL_V20,
  revision:capturedRevision,
  findReusable,planAggregateDemand,getSummary
 });
}
