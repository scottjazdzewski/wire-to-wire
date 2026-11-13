/**
 * WIRE TO WIRE — creation-time, on-demand fictional racing-world names.
 *
 * This API is a thin, replayable, PURE session wrapper around the existing
 * createFictionalWorldNameEngine. There is no second generation algorithm.
 *
 * Callers MUST save the returned nextState alongside their world/save data;
 * passing the same state + spec returns the same batch and does not reserve
 * anything in a database. To advance, pass nextState to the following call.
 */
import {createFictionalWorldNameEngine} from './fictional-world-name-engine.mjs';
import {formatRacingProgramName} from './racing-program-name-format.mjs';

export const ON_DEMAND_NAMING_MODEL='WTW_FICTIONAL_NAMES_ON_DEMAND_SESSION_V1';
const normalize=x=>String(x||'').normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');
const noFacilities=Object.freeze({
 generalFarms:0,studFarms:0,nurseries:0,bloodstockFarms:0,breakingTraining:0
});
function hash(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const c of String(key)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;
 h=Math.imul(h,0x846ca68b);h^=h>>>16;return h>>>0;
}
function validateStringNames(value,label){
 if(!Array.isArray(value)||value.some(x=>typeof x!=='string'||!x.trim()))
  throw Error(label+' must be an array of nonempty strings');
}
function uniqueNames(names){
 const map=new Map();
 for(const name of names){
  const key=normalize(name);
  if(key&&!map.has(key))map.set(key,name);
 }
 return Object.freeze([...map.values()]);
}
function validWorldId(worldId){
 if(typeof worldId!=='string'||!/^[a-zA-Z][a-zA-Z0-9-]{1,47}$/.test(worldId))
  throw Error('Invalid on-demand world ID');
 return worldId;
}
function validateSeed(seed){
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295)
  throw Error('On-demand naming seed must be a positive 32-bit integer');
}
function childWorldId(worldId,batchIndex){
 const prefix=worldId.slice(0,33);
 const identity=(hash(1899,'world:'+worldId)>>>0).toString(16).padStart(8,'0').slice(0,6);
 return prefix+'-'+identity+'-b'+String(batchIndex).padStart(6,'0');
}
function collectNames(batch){
 return uniqueNames([
  ...batch.people.map(x=>x.name),
  ...batch.owners.map(x=>x.name),
  ...batch.stables.map(x=>x.name),
  ...batch.farms.map(x=>x.name),
  ...batch.trainingCenters.map(x=>x.name)
 ]);
}
function assertNonemptyRequest(roles,owners,facilities){
 if(!Object.values(roles).some(n=>n>0)&&owners===0&&!Object.values(facilities).some(n=>n>0))
  throw Error('On-demand naming batch is empty');
}
/**
 * First call: state omitted. Subsequent calls: pass nextState verbatim.
 *
 * WorldId and seed are the parent namespace. A fresh derived batch ID and
 * seed isolate new names and IDs, while the historical and prior-generated
 * names provide collision protection.
 *
 * protectedNames can include historic owner, trainer, jockey and facility
 * names. They are never treated as a source of fictional identities.
 */
export function generateOnDemandFictionalNames({
 worldId,seed,year=1999,state=null,roles={},owners=0,facilities={},
 maxPartnershipGroups=null,soleOwnerPercent=23,
 protectedNames=[],markets,originWeightsByRole,jockeyOriginWeightsByColony
}={}){
 validWorldId(worldId);validateSeed(seed);
 if(year!==1999)throw Error('On-demand naming currently supports the 1999 opening era only');
 validateStringNames(protectedNames,'Protected names');
 if(!roles||typeof roles!=='object'||Array.isArray(roles))throw Error('Invalid on-demand roles');
 if(!facilities||typeof facilities!=='object'||Array.isArray(facilities))
  throw Error('Invalid on-demand facilities');
 if(maxPartnershipGroups!==null&&(!Number.isInteger(maxPartnershipGroups)||
  maxPartnershipGroups<0||maxPartnershipGroups>30000))
  throw Error('Invalid maximum partnership groups');
 if(!Number.isInteger(soleOwnerPercent)||soleOwnerPercent<0||soleOwnerPercent>100)
  throw Error('Invalid on-demand sole owner percentage');
 const actualFacilities={...noFacilities,...facilities};
 assertNonemptyRequest(roles,owners,actualFacilities);
 const initial=state==null;
 if(!initial){
  if(!state||typeof state!=='object'||Array.isArray(state)||
   state.model!==ON_DEMAND_NAMING_MODEL||
   state.parentWorldId!==worldId||state.seed!==seed||state.year!==year||
   !Number.isSafeInteger(state.nextBatch)||state.nextBatch<0||state.nextBatch>999999||
   !Number.isInteger(state.maxPartnershipGroups)||state.maxPartnershipGroups<0||
   state.maxPartnershipGroups>30000||
   !Number.isInteger(state.partnershipsIssued)||state.partnershipsIssued<0||
   state.partnershipsIssued>state.maxPartnershipGroups||
   !Array.isArray(state.ownerGroupRecords)||
   state.ownerGroupRecords.length!==state.partnershipsIssued||
   (maxPartnershipGroups!==null&&maxPartnershipGroups!==state.maxPartnershipGroups))
   throw Error('Incompatible or malformed on-demand naming state');
  validateStringNames(state.mintedNames,'Minted names');
 }
 const batchIndex=initial?0:state.nextBatch;
 if(batchIndex>999998)throw Error('On-demand naming batch sequence exhausted');
 const previous=initial?[]:state.mintedNames;
 const partnershipBudget=initial?(maxPartnershipGroups??128):state.maxPartnershipGroups;
 const alreadyIssued=initial?0:state.partnershipsIssued;
 const remainingPartnershipSlots=partnershipBudget-alreadyIssued;
 const reserved=uniqueNames([...protectedNames,...previous]);
 const effectiveSeed=(hash(seed,'on-demand-name-batch:'+batchIndex)||1)>>>0;
 const batch=createFictionalWorldNameEngine({
  worldId:childWorldId(worldId,batchIndex),seed:effectiveSeed,year,
  roles,owners,facilities:actualFacilities,
  protectedNames:reserved,
  ownerNamingPolicy:{
   partnershipLimit:remainingPartnershipSlots,soleOwnerPercent
  },
  ...(markets===undefined?{}:{markets}),
  ...(originWeightsByRole===undefined?{}:{originWeightsByRole}),
  ...(jockeyOriginWeightsByColony===undefined?{}:{jockeyOriginWeightsByColony})
 });
 const minted=collectNames(batch),reservedKeys=new Set(reserved.map(normalize));
 for(const name of minted)if(reservedKeys.has(normalize(name)))
  throw Error('Generated name collided with historic or prior batch name: '+name);
 const newPartnerships=batch.owners.filter(x=>x.ownershipArchetype==='PARTNERSHIP_OR_SYNDICATE')
  .map(x=>Object.freeze({
   id:x.id,name:x.name,region:x.namingRegion,
   archetype:x.ownershipArchetype,batchIndex
  }));
 if(newPartnerships.length>remainingPartnershipSlots)
  throw Error('On-demand partnership budget was exceeded');
 const ownerGroupRecords=Object.freeze([
  ...(initial?[]:state.ownerGroupRecords),...newPartnerships
 ]);
 const partnershipIssuedAfter=alreadyIssued+newPartnerships.length;
 const nextState=Object.freeze({
  model:ON_DEMAND_NAMING_MODEL,parentWorldId:worldId,seed,year,
  nextBatch:batchIndex+1,
  maxPartnershipGroups:partnershipBudget,
  partnershipsIssued:partnershipIssuedAfter,
  ownerGroupRecords,
  mintedNames:uniqueNames([...previous,...minted])
 });
 const programNames=Object.freeze(batch.people.filter(x=>
  x.role==='jockey'||x.role==='trainer').map(x=>Object.freeze({
   id:x.id,role:x.role,fullName:x.name,
   programName:formatRacingProgramName(x)
  })));
 return Object.freeze({
  model:ON_DEMAND_NAMING_MODEL,
  manifest:Object.freeze({
   ...batch.manifest,parentWorldId:worldId,batchIndex,effectiveSeed,
   mintedInBatch:minted.length,
   cumulativeReservedNames:nextState.mintedNames.length,
   writtenToGame:false
  }),
  people:batch.people,owners:batch.owners,stables:batch.stables,
  farms:batch.farms,trainingCenters:batch.trainingCenters,
  programNames,names:minted,
  ownership:Object.freeze({
   newPartnershipGroups:newPartnerships,
   reusablePartnershipGroups:ownerGroupRecords,
   maxPartnershipGroups:partnershipBudget,
   partnershipsIssued:partnershipIssuedAfter,
   remainingNewPartnershipSlots:partnershipBudget-partnershipIssuedAfter,
   archetypeCounts:Object.freeze(batch.owners.reduce((a,x)=>{
    a[x.ownershipArchetype]=(a[x.ownershipArchetype]||0)+1;return a;
   },{}))
  }),
  nextState
 });
}


/**
 * Reuse a previously minted ownership group by its stable identifier. This
 * NEVER creates a new group, asserts co-owner relationships, or mutates a save.
 * The calling game decides whether an existing group enters a new horse.
 */
export function listReusableFictionalOwnershipGroups(state,{region=null}={}){
 if(!state||state.model!==ON_DEMAND_NAMING_MODEL||
  !Array.isArray(state.ownerGroupRecords))
  throw Error('Invalid on-demand ownership registry');
 return Object.freeze(state.ownerGroupRecords.filter(record=>
  region===null||record.region===region));
}
