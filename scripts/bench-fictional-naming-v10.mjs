#!/usr/bin/env node
/**
 * Disposable high-volume QA benchmark. Creates ONLY in-memory fictional
 * identity batches; never writes a game world, a save, or historical records.
 *
 * Example:
 *   node scripts/bench-fictional-naming-v10.mjs --worlds 16 --batches 15 \
 *     --owners 90 --trainers 60 --jockeys 50
 *
 * Prints compact JSON statistics to stdout. The total numbers refer to
 * naming proposals, NOT horse population, Jockey Club registrations or any
 * current playable world.
 */
import {performance} from 'node:perf_hooks';
import {
 generateOnDemandFictionalNames
} from '../public/1999/engine/on-demand-fictional-name-batches.mjs';
import {
 auditFictionalIdentityNaming,auditFictionalOnDemandNameState
} from '../public/1999/engine/fictional-name-quality-audit.mjs';

const defaults={worlds:6,batches:8,owners:80,trainers:48,jockeys:36,seed:19990101};
const options={...defaults};
const limits={worlds:80,batches:200,owners:2500,trainers:2500,jockeys:2500,seed:4294967295};
for(let i=2;i<process.argv.length;i+=2){
 const key=process.argv[i]?.replace(/^--/,'');
 if(!Object.hasOwn(defaults,key)||!process.argv[i].startsWith('--')){
  console.error('Unknown argument '+process.argv[i]);
  process.exitCode=2;break;
 }
 const value=Number(process.argv[i+1]);
 if(!Number.isSafeInteger(value)||value<1||value>limits[key]){
  console.error('Invalid benchmark '+key);
  process.exitCode=2;break;
 }
 options[key]=value;
}
if(!process.exitCode){
 const started=performance.now(),counts={people:0,organizations:0,owners:0,partnerships:0,
  issuedNames:0,issues:0},archetypes=new Map(),latencies=[],worldSummaries=[];
 let maximumCheckpointBytes=0;
 for(let i=0;i<options.worlds;i++){
  const seed=((options.seed+i*2654435761)>>>0)||1;
  const namePrefix='QA-WORLD-'+String(i+1).padStart(4,'0');
  const params={worldId:namePrefix,seed,
   roles:{trainer:options.trainers,jockey:options.jockeys},
   owners:options.owners,
   facilities:{generalFarms:Math.max(2,Math.floor(options.owners/15)),
    studFarms:Math.max(1,Math.floor(options.owners/40)),
    nurseries:Math.max(1,Math.floor(options.owners/55))},
   maxPartnershipGroups:25,soleOwnerPercent:23,
   protectedNames:['Existing Canon Protected Farm','Existing Canon Protected Person']
  };
  let state=null,worldPeople=0,worldOrganizations=0,worldGroups=0;
  for(let batchNumber=0;batchNumber<options.batches;batchNumber++){
   const prev=state,t=performance.now();
   const batch=generateOnDemandFictionalNames({...params,state});
   const elapsed=performance.now()-t;
   latencies.push(elapsed);state=batch.nextState;
   const qa=auditFictionalIdentityNaming({
    people:batch.people,owners:batch.owners,stables:batch.stables,
    farms:batch.farms,trainingCenters:batch.trainingCenters,
    protectedNames:params.protectedNames
   });
   const continuity=auditFictionalOnDemandNameState({state,batch,previousState:prev});
   if(!qa.pass||!continuity.pass){
    console.error(JSON.stringify({world:i,batch:batchNumber,qa,continuity}));
    process.exitCode=1;break;
   }
   counts.people+=qa.people;counts.organizations+=qa.organizations;
   counts.owners+=qa.ownerCount;counts.partnerships+=qa.formalGroups;
   counts.issuedNames+=batch.names.length;
   worldPeople+=qa.people;worldOrganizations+=qa.organizations;
   worldGroups+=qa.formalGroups;
   for(const [key,count] of Object.entries(qa.ownerArchetypes))
    archetypes.set(key,(archetypes.get(key)||0)+count);
  }
  if(process.exitCode)break;
  const stateSize=Buffer.byteLength(JSON.stringify(state),'utf8');
  maximumCheckpointBytes=Math.max(maximumCheckpointBytes,stateSize);
  worldSummaries.push({world:i+1,people:worldPeople,organizations:worldOrganizations,
   groups:worldGroups,checkpointBytes:stateSize});
 }
 latencies.sort((a,b)=>a-b);
 const p95=latencies[Math.min(latencies.length-1,Math.ceil(latencies.length*.95)-1)]||0;
 const totalMs=performance.now()-started;
 console.log(JSON.stringify({
  benchmark:'WTW-FICTIONAL-NAMES-V10',disposable:true,
  currentWorldModified:false,options,totals:counts,
  archetypes:Object.fromEntries(archetypes),
  durationMs:Math.round(totalMs),p95BatchMs:+p95.toFixed(2),
  maxBatchMs:+(latencies.at(-1)||0).toFixed(2),
  maximumCheckpointBytes,worlds:worldSummaries
 },null,2));
}
