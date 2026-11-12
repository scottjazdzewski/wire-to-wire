/*
 * Accepted January 1 1999 production read-model, source-only.
 * Directly imports accepted P2500, P5000 and P10000-01..08 partitions.
 * This is NOT a generated-horse replacement by implication: the 267 featured
 * 1999 anchors and any source overlaps must be reconciled before activation.
 * No screens, transactions, future results, stud fees, or 1999 outcomes.
 */
import {records as identity0,partitionId as partition0} from './P2500-01.mjs';
import {records as observed0} from './P2500-01.observable.mjs';
import {records as identity1,partitionId as partition1} from './P5000-01.mjs';
import {records as observed1} from './P5000-01.observable.mjs';
import {records as identity2,partitionId as partition2} from './P10000-01.mjs';
import {records as observed2} from './P10000-01.observable.mjs';
import {records as identity3,partitionId as partition3} from './P10000-02.mjs';
import {records as observed3} from './P10000-02.observable.mjs';
import {records as identity4,partitionId as partition4} from './P10000-03.mjs';
import {records as observed4} from './P10000-03.observable.mjs';
import {records as identity5,partitionId as partition5} from './P10000-04.mjs';
import {records as observed5} from './P10000-04.observable.mjs';
import {records as identity6,partitionId as partition6} from './P10000-05.mjs';
import {records as observed6} from './P10000-05.observable.mjs';
import {records as identity7,partitionId as partition7} from './P10000-06.mjs';
import {records as observed7} from './P10000-06.observable.mjs';
import {records as identity8,partitionId as partition8} from './P10000-07.mjs';
import {records as observed8} from './P10000-07.observable.mjs';
import {records as identity9,partitionId as partition9} from './P10000-08.mjs';
import {records as observed9} from './P10000-08.observable.mjs';
import {participantById,productionParticipantSummary} from './participant-readmodel.mjs';
import {openingWorld1999 as featured} from '../engine/canon-mini.mjs';
const foundationOwners=new Map(featured.organizations.map(x=>[x.id,x]));
const foundationPeople=new Map(featured.people.map(x=>[x.id,x]));
const parts=[{id:partition0,identities:identity0,observations:observed0},{id:partition1,identities:identity1,observations:observed1},{id:partition2,identities:identity2,observations:observed2},{id:partition3,identities:identity3,observations:observed3},{id:partition4,identities:identity4,observations:observed4},{id:partition5,identities:identity5,observations:observed5},{id:partition6,identities:identity6,observations:observed6},{id:partition7,identities:identity7,observations:observed7},{id:partition8,identities:identity8,observations:observed8},{id:partition9,identities:identity9,observations:observed9}];
export const PRODUCTION_COUNT=87500;
const all=[],byId=new Map(),byOwner=new Map(),byTrainer=new Map();
const truth=new Map(),rawParentNames=new Map();
const append=(map,key,index)=>{if(!key)return;const arr=map.get(key);if(arr)arr.push(index);else map.set(key,[index]);};
for(const p of parts){
 if(p.observations.length!==p.identities.length)throw Error(p.id+' opening-observable count mismatch');
 for(const o of p.observations){
  if(truth.has(o[0]))throw Error('Duplicate observed horse ID '+o[0]);
  truth.set(o[0],o);
 }
 for(const r of p.identities){
  const [id,name,foalYear,sex,circuit,trainerId,ownerId,sireId,sireName,damId,damName,status]=r;
  if(!id||!name||!/CANONICAL/.test(String(status)))throw Error(p.id+' unapproved identity '+id);
  if(byId.has(id))throw Error('Duplicate immutable production horse ID '+id);
  if(!ownerId||!trainerId||!sireId||!damId||sireId===id||damId===id||sireId===damId)throw Error('Unlinked/invalid source pedigree or participant '+id);
  const age=1999-Number(foalYear);
  if(!Number.isInteger(age)||age<0||age>35)throw Error('Opening foal-year inconsistency '+id);
  const index=all.length;all.push({row:r,partition:p.id,observation:null});
  byId.set(id,index);append(byOwner,ownerId,index);append(byTrainer,trainerId,index);
  if(sireName&&!rawParentNames.has(sireId))rawParentNames.set(sireId,sireName);
  if(damName&&!rawParentNames.has(damId))rawParentNames.set(damId,damName);
 }
}
if(all.length!==PRODUCTION_COUNT||truth.size!==PRODUCTION_COUNT)throw Error('Accepted opening production count mismatch');
for(const r of all){const o=truth.get(r.row[0]);if(!o)throw Error('Missing opening observable '+r.row[0]);
 if(!/CANONICAL/.test(String(o[12])))throw Error('Unaccepted observable '+o[0]);
 const [id,starts,wins,seconds,thirds]=o;
 const nums=[starts,wins,seconds,thirds].map(Number);
 if(!nums.every(Number.isInteger)||nums.some(x=>x<0)||nums[1]+nums[2]+nums[3]>nums[0])throw Error('Invalid source career summary '+id);
 r.observation=o;
}
export const sourcePartitionCounts=Object.freeze(parts.map(x=>({partitionId:x.id,horses:x.identities.length,openingObservables:x.observations.length})));
export const sourceIds=Object.freeze([...byId.keys()]);
export const ownerIds=Object.freeze([...byOwner.keys()]);
export const trainerIds=Object.freeze([...byTrainer.keys()]);
export function productionHorseAt(i){
 const v=all[i];if(!v)return null;
 const r=v.row,o=v.observation;
 return {id:r[0],name:r[1],foalYear:Number(r[2]),ageAtOpening:1999-Number(r[2]),
  sex:r[3],homeCircuit:r[4],trainerId:r[5],ownerId:r[6],
  ownerName:foundationOwners.get(r[6])?.name||participantById(r[6])?.name||null,
  trainerName:foundationPeople.get(r[5])?.name||participantById(r[5])?.name||null,
  ownerNameBasis:foundationOwners.has(r[6])?'1999_FOUNDATION_SOURCE':participantById(r[6])?'ACCEPTED_PRODUCTION_PARTICIPANT':'UNRESOLVED_SOURCE_OWNER_ID',
  trainerNameBasis:foundationPeople.has(r[5])?'1999_FOUNDATION_SOURCE':participantById(r[5])?'ACCEPTED_PRODUCTION_PARTICIPANT':'UNRESOLVED_SOURCE_TRAINER_ID',
  sireId:r[7],sireName:r[8],damId:r[9],damName:r[10],
  sourcePartitionId:v.partition,sourceStatus:'CANONICAL_ACCEPTED_OPENING_PRODUCTION',
  nameStatus:'CANON_LOCKED',locationStatus:'CIRCUIT_ONLY_EXACT_BARN_NOT_IN_IDENTITY_PARTITION',
  career:{starts:Number(o[1]),wins:Number(o[2]),seconds:Number(o[3]),thirds:Number(o[4]),
    observedClass:o[5],surfaceExposure:o[6],distanceExposure:o[7],
    availability:o[8],confidence:o[9],recentForm:o[10],earningsBand:o[11],
    provenance:'CANONICAL_PRE1999_OPENING_OBSERVABLE_NO_FUTURE_1999_RESULTS'},
  no1999Results:true,attributesProvenance:'NO_PROTECTED_ABILITY_EXPORTED'};
}
export function productionHorseById(id){const i=byId.get(id);return i===undefined?null:productionHorseAt(i);}
export function productionHorsesForOwner(id){return byOwner.get(id)||[];}
export function productionHorsesForTrainer(id){return byTrainer.get(id)||[];}
export function productionPedigree(id,depth=4){
 const seen=new Set();
 function walk(horseId,level,label=null){
  if(!horseId||seen.has(horseId))return null;
  const h=productionHorseById(horseId);
  if(!h)return {id:horseId,name:label||rawParentNames.get(horseId)||null,
    source:'PARENT_REFERENCE_ONLY__FULL_PEDIGREE_NOT_YET_JOINED',missingFromOpeningRunners:true};
  seen.add(horseId);
  return {id:h.id,name:h.name,foalYear:h.foalYear,
   source:h.sourcePartitionId,...(level>0?{sire:walk(h.sireId,level-1,h.sireName),dam:walk(h.damId,level-1,h.damName)}:{})};
 }
 return walk(id,Math.min(5,Math.max(0,Number(depth)||0)));
}
export function productionIndexSummary(){
 return {asOf:'1999-01-01',population:all.length,partitions:sourcePartitionCounts,
  ownerIds:byOwner.size,trainerIds:byTrainer.size,
  coveredOwnerIdentities:[...byOwner.keys()].filter(id=>foundationOwners.has(id)||participantById(id)).length,
  coveredTrainerIdentities:[...byTrainer.keys()].filter(id=>foundationPeople.has(id)||participantById(id)).length,
  sourceFeaturedOpeningHorses:featured.horses.length,
  featuredIdOverlaps:featured.horses.filter(h=>byId.has(h.id)).map(h=>h.id),
  distinctCombinedOpeningHorseIds:PRODUCTION_COUNT+featured.horses.filter(h=>!byId.has(h.id)).length,
  sourceParticipantNameSummary:productionParticipantSummary(),
  provenance:'TEN_ACCEPTED_BULK_PARTITIONS__CANONICAL_IDENTITY_AND_OPENING_OBSERVABLE',
  financialOrPhysicalBarnCertification:false,sourceFeatured267Reconciliation:'NOT_YET_PROMOTED_TO_ACTIVE_WORLD',
  immutableHistoricalOutcomes:true,post1999ResultsCommitted:0};
}
