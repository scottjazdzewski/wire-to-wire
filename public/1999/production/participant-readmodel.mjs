/*
 * Immutable-ID participant lookup shared by the accepted 1999 production
 * partitions. No fabricated names, bases, pay or contracts.
 * P10000-02 TEMP participant scaffold is deliberately not promoted.
 */
import {records as participants0,partitionId as part0} from './P5000-01.participants.mjs';
import {records as participants1,partitionId as part1} from './P10000-01.participants.mjs';
import {records as participants2,partitionId as part2} from './P10000-03.participants.mjs';
import {records as participants3,partitionId as part3} from './P10000-04.participants.mjs';
import {records as participants4,partitionId as part4} from './P10000-05.participants.mjs';
import {records as participants5,partitionId as part5} from './P10000-06.participants.mjs';
import {records as participants6,partitionId as part6} from './P10000-07.participants.mjs';
import {records as participants7,partitionId as part7} from './P10000-08.participants.mjs';
const sources=[[part0,participants0],[part1,participants1],[part2,participants2],[part3,participants3],[part4,participants4],[part5,participants5],[part6,participants6],[part7,participants7]];
const byId=new Map(),variants=new Map();
const batches=[];
for(const [partition,records] of sources){
 batches.push({partition,rows:records.length});
 for(const r of records){
  const [id,name,role,circuit,financeClass,portfolioArchetype,capacityCeiling,sourceStatus]=r;
  if(!id||!name||!['OWNER','TRAINER'].includes(role))throw Error('Incomplete participant scaffold '+partition+': '+id);
  const prior=byId.get(id);
  if(prior&&prior.name!==name){
   const names=variants.get(id)||new Set([prior.name]);names.add(name);variants.set(id,names);
  }
  const cap=Number(capacityCeiling);
  byId.set(id,{id,name,role,circuit,financeClass:financeClass||null,portfolioArchetype:portfolioArchetype||null,
   capacityCeiling:Number.isFinite(cap)&&cap>=0?cap:null,sourceStatus,sourcePartition:partition,
   identityBasis:'RETAINED_ACCEPTED_PRODUCTION_PARTICIPANT_SCAFFOLD__NOT_SEASON_CONTRACT'});
 }
}
export const productionParticipantBatches=Object.freeze(batches);
export function participantById(id){return byId.get(id)||null;}
export function productionParticipantSummary(){
 let owners=0,trainers=0;
 for(const p of byId.values())if(p.role==='OWNER')owners++;else trainers++;
 return {participantIds:byId.size,owners,trainers,
  historicalNameConflicts:[...variants].map(([id,names])=>({id,names:[...names]})),
  sourceBatches:batches,p10000_02TemporaryExcluded:true,
  roleSeasonNotRaceDayContract:true,financialValuesNotHistoricallyCertified:true};
}
export function ownersWithSourceNames(){return [...byId.values()].filter(x=>x.role==='OWNER');}
export function trainersWithSourceNames(){return [...byId.values()].filter(x=>x.role==='TRAINER');}
