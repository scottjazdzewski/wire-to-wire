#!/usr/bin/env node
/**
 * Disposable V11 benchmark: 100+ sequential naming batches without
 * serializing the issued-name directory in the returned cursor.
 *
 * Only reports metrics. Does not write any game records or save files.
 */
import {performance} from 'node:perf_hooks';
import {
 createIndexedFictionalNameRegistry,generateIndexedFictionalNames
} from '../public/1999/engine/indexed-fictional-name-registry.mjs';
const options={batches:100,owners:30,trainers:16,jockeys:12,historic:12000};
const max={batches:1500,owners:350,trainers:350,jockeys:350,historic:100000};
for(let i=2;i<process.argv.length;i+=2){
 const arg=process.argv[i];
 const key=arg?.startsWith('--')?arg.slice(2):null;
 const value=Number(process.argv[i+1]);
 if(!Object.hasOwn(options,key)||!Number.isSafeInteger(value)||
  value<0||value>max[key]||(key==='batches'&&value===0)){
  console.error('Invalid indexed naming benchmark argument '+arg);
  process.exit(2);
 }
 options[key]=value;
}
const started=performance.now(),worldId='DISPOSABLE-V11-QA',seed=19990101;
const registry=createIndexedFictionalNameRegistry({
 worldId,seed,protectedPeople:['Historic Canon Owner'],
 protectedOrganizations:Array.from({length:options.historic},(_,i)=>
  'Historical Protected '+String(i).padStart(6,'0')+' Farm')
});
let cursor=null,firstBytes=0;
const latencies=[],counts={owners:0,trainers:0,jockeys:0,partnerships:0};
for(let batchIndex=0;batchIndex<options.batches;batchIndex++){
 const t=performance.now();
 const b=generateIndexedFictionalNames({
  registry,worldId,seed,cursor,roles:{trainer:options.trainers,jockey:options.jockeys},
  owners:options.owners,
  facilities:{generalFarms:2,studFarms:1},
  maxPartnershipGroups:35,soleOwnerPercent:23
 });
 latencies.push(performance.now()-t);
 counts.owners+=b.owners.length;
 counts.trainers+=options.trainers;
 counts.jockeys+=options.jockeys;
 counts.partnerships+=b.ownership.newPartnershipGroups.length;
 cursor=b.nextCursor;
 if(!firstBytes)firstBytes=Buffer.byteLength(JSON.stringify(cursor),'utf8');
}
latencies.sort((a,b)=>a-b);
const size=Buffer.byteLength(JSON.stringify(cursor),'utf8');
console.log(JSON.stringify({
 benchmark:'WTW-V11-COMPACT-INDEXED-NAME-REGISTRY',
 createsPlayableWorld:false,createsHorseEntities:false,
 options,issuedNames:registry.namesIssued,issuedOwnerEntities:registry.ownerCount,
 partnershipGroups:registry.formalGroupsIssued,issuedCounts:counts,
 firstCheckpointBytes:firstBytes,finalCheckpointBytes:size,
 bytesGrowth:size-firstBytes,
 p95BatchMs:+(latencies[Math.ceil(latencies.length*.95)-1]||0).toFixed(2),
 totalMs:Math.round(performance.now()-started),
 note:'The full registry is held separately; durable DB persistence is a calling-system integration.'
},null,2));
