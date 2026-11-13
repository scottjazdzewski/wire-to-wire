/**
 * WTW V11 — compact name cursor and indexed external identity registry.
 *
 * Registry contents live OUTSIDE a naming checkpoint. This pure in-memory
 * adapter demonstrates the required transactional indexed-store contract.
 * A game server may persist/export the registry separately. Nothing touches
 * the January 1999 playable world or creates a horse.
 *
 * Core names still come from createFictionalWorldNameEngine, not a second
 * invented-name generator. A compact cursor is fixed-size in names issued.
 */
import {createFictionalWorldNameEngine}
 from './fictional-world-name-engine.mjs';
import {organizationRootOfName,isRecognizedOrganizationName}
 from './organization-name-engine.mjs';
import {formatRacingProgramName}
 from './racing-program-name-format.mjs';

export const INDEXED_FICTIONAL_NAME_REGISTRY_MODEL='WTW_INDEXED_FICTIONAL_NAME_REGISTRY_V11';
export const COMPACT_FICTIONAL_NAME_CURSOR_MODEL='WTW_COMPACT_FICTIONAL_NAME_CURSOR_V11';
const ZERO_FACILITIES=Object.freeze({
 generalFarms:0,studFarms:0,nurseries:0,bloodstockFarms:0,breakingTraining:0
});
const nameKey=x=>String(x??'').normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');
function checkNames(names,label){
 if(!Array.isArray(names)||names.some(v=>typeof v!=='string'||!v.trim()))
  throw Error('Invalid '+label+' name list');
}
function checkId(value,label){
 if(typeof value!=='string'||!value.trim()||value.length>300)
  throw Error('Invalid '+label);
}
function checkSeed(seed){
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295)
  throw Error('Invalid naming registry seed');
}
function hash(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const c of String(key)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;
 h=Math.imul(h,0x846ca68b);h^=h>>>16;return h>>>0;
}
function childWorldId(worldId,batchIndex){
 const prefix=worldId.slice(0,33);
 const identity=(hash(1899,'world:'+worldId)>>>0).toString(16).padStart(8,'0').slice(0,6);
 return prefix+'-'+identity+'-b'+String(batchIndex).padStart(6,'0');
}
function canonicalHash(items){
 let h=0x915ec11;
 for(const item of items)h=hash(h,JSON.stringify(item));
 return h.toString(16).padStart(8,'0');
}
// An incremental prefix trie catches stored root A prefix-of-new root B and
// vice versa in O(root characters), not O(every historic business).
function makeRootIndex(){
 const root={children:new Map(),terminal:false,descendants:0};
 function add(value){
  if(typeof value!=='string'||value.length<7)return;
  let node=root;node.descendants++;
  for(const char of value){
   if(!node.children.has(char))
    node.children.set(char,{children:new Map(),terminal:false,descendants:0});
   node=node.children.get(char);node.descendants++;
  }
  node.terminal=true;
 }
 function conflicts(value){
  if(typeof value!=='string'||value.length<7)return false;
  let node=root;
  for(let i=0;i<value.length;i++){
   node=node.children.get(value[i]);
   if(!node)return false;
   if(i>=6&&node.terminal)return true;
  }
  return node.descendants>0;
 }
 return Object.freeze({add,conflicts});
}
const redactRecord=x=>Object.freeze({
 id:x.id,name:x.name,region:x.namingRegion??x.region??null,
 archetype:x.ownershipArchetype??x.archetype??'UNCLASSIFIED',
 principalId:x.principalId??null,batchIndex:x.batchIndex??null
});
/**
 * In-memory indexed registry/reference adapter. Persist it separately with
 * snapshot() ONLY when explicitly required by the calling persistence layer,
 * never inside every name request's cursor. A durable adapter needs the same
 * atomic revision/commit contract before multi-process production use.
 */
export function createIndexedFictionalNameRegistry({
 worldId,seed,protectedPeople=[],protectedOrganizations=[],snapshot=null
}={}){
 checkId(worldId,'registry worldId');checkSeed(seed);
 checkNames(protectedPeople,'protected person');
 checkNames(protectedOrganizations,'protected organization');
 if(snapshot!==null&&(
  !snapshot||snapshot.model!==INDEXED_FICTIONAL_NAME_REGISTRY_MODEL||
  snapshot.worldId!==worldId||snapshot.seed!==seed||
  !Number.isSafeInteger(snapshot.revision)||snapshot.revision<0||
  !Array.isArray(snapshot.issuedPeople)||!Array.isArray(snapshot.issuedOrganizations)||
  !Array.isArray(snapshot.ownerEntities)||!Array.isArray(snapshot.protectedPeople)||
  !Array.isArray(snapshot.protectedOrganizations)||
  snapshot.integrity!==canonicalHash([
   snapshot.model,snapshot.worldId,snapshot.seed,snapshot.revision,
   snapshot.protectedPeople,snapshot.protectedOrganizations,
   snapshot.issuedPeople,snapshot.issuedOrganizations,snapshot.ownerEntities
  ])
 ))throw Error('Invalid or corrupted indexed name registry snapshot');
 if(snapshot&&(
  JSON.stringify(protectedPeople)!=='[]'||JSON.stringify(protectedOrganizations)!=='[]'))
  throw Error('Cannot simultaneously prime and restore a name registry');
 const existingProtectedPeople=snapshot?.protectedPeople??protectedPeople,
  existingProtectedOrgs=snapshot?.protectedOrganizations??protectedOrganizations,
  issuedPeople=snapshot?.issuedPeople?.map(x=>({...x}))??[],
  issuedOrganizations=snapshot?.issuedOrganizations?.map(x=>({...x}))??[],
  ownerEntities=snapshot?.ownerEntities?.map(x=>Object.freeze({...x}))??[];
 checkNames(existingProtectedPeople,'protected person');
 checkNames(existingProtectedOrgs,'protected organization');
 const exact=new Set(),personKeys=new Set(),orgKeys=new Set(),
  roots=makeRootIndex(),ownerIds=new Set(),entityIds=new Set();
 const addName=(name,keySet)=>{
  const key=nameKey(name);
  if(!key)throw Error('Empty name in index');
  keySet.add(key);exact.add(key);
 };
 for(const name of existingProtectedPeople)addName(name,personKeys);
 for(const name of existingProtectedOrgs){
  addName(name,orgKeys);
  if(isRecognizedOrganizationName(name))roots.add(organizationRootOfName(name));
 }
 for(const item of issuedPeople){
  checkId(item.id,'stored person ID');checkId(item.name,'stored person name');
  const key=nameKey(item.name);
  if(personKeys.has(key)||entityIds.has(item.id))throw Error('Duplicate stored person');
  entityIds.add(item.id);addName(item.name,personKeys);
 }
 for(const item of issuedOrganizations){
  checkId(item.id,'stored organization ID');checkId(item.name,'stored organization name');
  const key=nameKey(item.name);
  if(orgKeys.has(key)||entityIds.has(item.id))throw Error('Duplicate stored organization');
  entityIds.add(item.id);addName(item.name,orgKeys);
  if(isRecognizedOrganizationName(item.name))
   roots.add(organizationRootOfName(item.name));
 }
 const storedOrgIds=new Set(issuedOrganizations.map(o=>o.id));
 for(const owner of ownerEntities){
  checkId(owner.id,'stored owner ID');checkId(owner.name,'stored owner name');
  if(ownerIds.has(owner.id))throw Error('Duplicate stored owner ID');
  ownerIds.add(owner.id);
  if(!storedOrgIds.has(owner.id))
   throw Error('Stored owner missing parent organization');
 }
 let revision=snapshot?.revision??0;
 const groupEntities=ownerEntities.filter(x=>x.archetype==='PARTNERSHIP_OR_SYNDICATE');
 const index=Object.freeze({
  get revision(){return revision},
  hasAnyName:name=>exact.has(nameKey(name)),
  hasOrganizationRootConflict:root=>roots.conflicts(root)
 });
 function listOwners({archetype=null,region=null,offset=0,limit=50}={}){
  if(!Number.isSafeInteger(offset)||offset<0||
   !Number.isInteger(limit)||limit<1||limit>1000)
   throw Error('Invalid indexed owner page');
  let skipped=0;const records=[];
  for(const record of ownerEntities){
   if(archetype!==null&&record.archetype!==archetype)continue;
   if(region!==null&&record.region!==region)continue;
   if(skipped++<offset)continue;
   records.push(record);if(records.length>=limit)break;
  }
  return Object.freeze(records);
 }
 function listGroups({region=null,offset=0,limit=50}={}){
  return Object.freeze(groupEntities.filter(x=>region===null||x.region===region)
   .slice(offset,offset+limit));
 }
 function commit({expectedRevision,people,organizations,owners,batchIndex}={}){
  if(expectedRevision!==revision)throw Error('Stale indexed name registry revision');
  if(!Array.isArray(people)||!Array.isArray(organizations)||!Array.isArray(owners)||
   !Number.isSafeInteger(batchIndex)||batchIndex<0)
   throw Error('Invalid indexed name registry transaction');
  // Check ALL records before modifying ANY index. On conflict, no state moves.
  const newPeople=new Set(),newOrgs=new Set(),newIds=new Set(),newOwnerIds=new Set();
  for(const person of people){
   checkId(person?.id,'new person ID');checkId(person?.name,'new person name');
   const key=nameKey(person.name);
   if(exact.has(key)||newPeople.has(key)||newIds.has(person.id)||entityIds.has(person.id))
    throw Error('Indexed person name or ID collision: '+person.name);
   newPeople.add(key);newIds.add(person.id);
  }
  const personById=new Map(people.map(p=>[p.id,p]));
  for(const org of organizations){
   checkId(org?.id,'new organization ID');checkId(org?.name,'new organization name');
   const key=nameKey(org.name);
   if(exact.has(key)||newOrgs.has(key)||newIds.has(org.id)||entityIds.has(org.id))
    throw Error('Indexed organization name or ID collision: '+org.name);
   if(newPeople.has(key)){
    const principal=personById.get(org.principalId);
    if(org.ownershipArchetype!=='INDIVIDUAL_OWNER'||!principal||
     nameKey(principal.name)!==key)
     throw Error('Indexed person/organization name collision: '+org.name);
   }
   if(isRecognizedOrganizationName(org.name)&&
    roots.conflicts(organizationRootOfName(org.name)))
    throw Error('Indexed organization root collision: '+org.name);
   newOrgs.add(key);newIds.add(org.id);
  }
  const orgById=new Map(organizations.map(o=>[o.id,o]));
  for(const owner of owners){
   checkId(owner?.id,'new owner ID');
   if(ownerIds.has(owner.id)||newOwnerIds.has(owner.id)||!orgById.has(owner.id))
    throw Error('Duplicate or missing ownership organization ID');
   checkId(owner.name,'new owner name');
   const org=orgById.get(owner.id),person=personById.get(owner.principalId);
   if(nameKey(owner.name)!==nameKey(org.name)||!person)
    throw Error('Owner organization or principal identity mismatch');
   newOwnerIds.add(owner.id);
  }
  // The preflight passed. These operations cannot fail on duplicate values.
  for(const person of people){
   issuedPeople.push(Object.freeze({id:person.id,name:person.name}));
   addName(person.name,personKeys);
   entityIds.add(person.id);
  }
  for(const org of organizations){
   issuedOrganizations.push(Object.freeze({id:org.id,name:org.name}));
   addName(org.name,orgKeys);
   entityIds.add(org.id);
   if(isRecognizedOrganizationName(org.name))
    roots.add(organizationRootOfName(org.name));
  }
  for(const owner of owners){
   const row=redactRecord({...owner,batchIndex});
   ownerEntities.push(row);
   if(row.archetype==='PARTNERSHIP_OR_SYNDICATE')groupEntities.push(row);
   ownerIds.add(owner.id);
  }
  revision++;
  return Object.freeze({
   revision,issuedPeople:issuedPeople.length,
   issuedOrganizations:issuedOrganizations.length,
   owners:ownerEntities.length,formalGroups:groupEntities.length
  });
 }
 function snapshotNow(){
  const data={
   model:INDEXED_FICTIONAL_NAME_REGISTRY_MODEL,worldId,seed,revision,
   protectedPeople:[...existingProtectedPeople],
   protectedOrganizations:[...existingProtectedOrgs],
   issuedPeople:issuedPeople.map(x=>({...x})),
   issuedOrganizations:issuedOrganizations.map(x=>({...x})),
   ownerEntities:ownerEntities.map(x=>({...x}))
  };
  return {...data,integrity:canonicalHash([
   data.model,data.worldId,data.seed,data.revision,
   data.protectedPeople,data.protectedOrganizations,
   data.issuedPeople,data.issuedOrganizations,data.ownerEntities
  ])};
 }
 return Object.freeze({
  model:INDEXED_FICTIONAL_NAME_REGISTRY_MODEL,worldId,seed,index,
  get revision(){return revision},
  get namesIssued(){return issuedPeople.length+issuedOrganizations.length},
  get ownerCount(){return ownerEntities.length},
  get formalGroupsIssued(){return groupEntities.length},
  hasAnyName:index.hasAnyName,
  listOwners,listGroups,commit,snapshot:snapshotNow
 });
}
/**
 * Generate new names using the existing V8/V10 naming engine, but query an
 * indexed registry instead of injecting every prior name into protectedNames.
 * State is compact: ONLY cursor/version/counts, not name or owner arrays.
 */
export function prepareIndexedFictionalNameBatch({
 registry,worldId,seed,year=1999,cursor=null,roles={},owners=0,
 facilities={},maxPartnershipGroups=null,soleOwnerPercent=23,
 markets,originWeightsByRole,jockeyOriginWeightsByColony
}={}){
 if(!registry||registry.model!==INDEXED_FICTIONAL_NAME_REGISTRY_MODEL||
  registry.worldId!==worldId||registry.seed!==seed)
  throw Error('Incompatible indexed naming registry');
 if(year!==1999)throw Error('Indexed fictional naming currently supports 1999 only');
 if(!Number.isInteger(soleOwnerPercent)||soleOwnerPercent<0||soleOwnerPercent>100)
  throw Error('Invalid indexed sole-owner percentage');
 const initial=cursor===null;
 if(initial&&registry.revision!==0)
  throw Error('Non-empty registry requires a compact cursor; refusing to restart');
 if(!initial&&(
  !cursor||cursor.model!==COMPACT_FICTIONAL_NAME_CURSOR_MODEL||
  cursor.worldId!==worldId||cursor.seed!==seed||cursor.year!==year||
  !Number.isSafeInteger(cursor.nextBatch)||cursor.nextBatch<1||cursor.nextBatch>999999||
  cursor.revision!==registry.revision||
  !Number.isInteger(cursor.maxPartnershipGroups)||
  !Number.isInteger(cursor.partnershipsIssued)||cursor.partnershipsIssued<0||
  cursor.partnershipsIssued!==registry.formalGroupsIssued||
  cursor.partnershipsIssued>cursor.maxPartnershipGroups||
  cursor.soleOwnerPercent!==soleOwnerPercent||
  cursor.namesIssued!==registry.namesIssued||
  cursor.ownersIssued!==registry.ownerCount
 ))throw Error('Stale or incompatible compact naming cursor');
 const limit=initial?(maxPartnershipGroups??128):cursor.maxPartnershipGroups;
 if(!Number.isInteger(limit)||limit<0||limit>30000||
  (!initial&&maxPartnershipGroups!==null&&limit!==maxPartnershipGroups))
  throw Error('Invalid indexed partnership limit');
 const batchIndex=initial?0:cursor.nextBatch;
 if(batchIndex>=999999)throw Error('Indexed naming batch sequence exhausted');
 const remaining=limit-registry.formalGroupsIssued;
 const worldSeed=(hash(seed,'on-demand-name-batch:'+batchIndex)||1)>>>0;
 const effectiveFacilities={...ZERO_FACILITIES,...facilities};
 const batch=createFictionalWorldNameEngine({
  worldId:childWorldId(worldId,batchIndex),seed:worldSeed,year,
  roles,owners,facilities:effectiveFacilities,
  protectedNames:[],
  externalNameIndex:registry.index,
  ownerNamingPolicy:{partnershipLimit:remaining,soleOwnerPercent},
  ...(markets===undefined?{}:{markets}),
  ...(originWeightsByRole===undefined?{}:{originWeightsByRole}),
  ...(jockeyOriginWeightsByColony===undefined?{}:{jockeyOriginWeightsByColony})
 });
 const organizations=[
  ...batch.owners,...batch.stables,...batch.farms,...batch.trainingCenters
 ];
 const groups=batch.owners.filter(x=>x.ownershipArchetype==='PARTNERSHIP_OR_SYNDICATE');
 if(groups.length>remaining)throw Error('Indexed partnership limit exceeded');
 // Pure preparation: nothing has been committed to either the detached
 // naming registry or durable storage. Callers can validate and atomically
 // persist this specific proposal before updating the read-through indexes.
 return Object.freeze({
  registry,batch,organizations,groups,worldId,seed,year,batchIndex,
  limit,remaining,soleOwnerPercent,expectedRevision:initial?0:cursor.revision
 });
}

/** Finalize an ALREADY durable, revision-checked naming proposal in memory. */
export function commitPreparedIndexedFictionalNameBatch(prepared){
 if(!prepared||!prepared.registry||!prepared.batch||
  !Array.isArray(prepared.organizations)||!Array.isArray(prepared.groups))
  throw Error('Invalid prepared indexed naming batch');
 const {registry,batch,organizations,groups,worldId,seed,year,batchIndex,
  limit,remaining,soleOwnerPercent,expectedRevision}=prepared;
 const receipt=registry.commit({
  expectedRevision,
  people:batch.people,organizations,owners:batch.owners,batchIndex
 });
 const nextCursor=Object.freeze({
  model:COMPACT_FICTIONAL_NAME_CURSOR_MODEL,worldId,seed,year,
  revision:receipt.revision,nextBatch:batchIndex+1,
  maxPartnershipGroups:limit,partnershipsIssued:receipt.formalGroups,
  soleOwnerPercent,namesIssued:registry.namesIssued,ownersIssued:receipt.owners
 });
 const programNames=Object.freeze(batch.people.filter(p=>
  p.role==='jockey'||p.role==='trainer').map(p=>Object.freeze({
   id:p.id,role:p.role,fullName:p.name,programName:formatRacingProgramName(p)
  })));
 return Object.freeze({
  model:COMPACT_FICTIONAL_NAME_CURSOR_MODEL,
  manifest:Object.freeze({...batch.manifest,batchIndex,
   registryRevision:receipt.revision,storedInNamingRegistry:true,
   writtenToGame:false}),
  people:batch.people,owners:batch.owners,stables:batch.stables,
  farms:batch.farms,trainingCenters:batch.trainingCenters,
  programNames,nextCursor,
  ownership:Object.freeze({
   newPartnershipGroups:groups.map(g=>Object.freeze({
    id:g.id,name:g.name,region:g.namingRegion
   })),
   partnershipsIssued:receipt.formalGroups,remainingNewPartnershipSlots:
    limit-receipt.formalGroups,
   availableExistingOwners:receipt.owners
  })
 });
}


/**
 * Historical in-memory V11 entrypoint remains fully compatible: prepare,
 * then commit synchronously. V12 durable storage uses the two steps with a
 * transaction between them so a failed disk write cannot mint phantom names.
 */
export function generateIndexedFictionalNames(options={}){
 return commitPreparedIndexedFictionalNameBatch(
  prepareIndexedFictionalNameBatch(options)
 );
}
