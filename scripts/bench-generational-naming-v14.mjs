#!/usr/bin/env node
/**
 * Disposable 1999–2099 multi-decade name QA and endurance benchmark.
 *
 * No game population, D1/IndexedDB writes, horses, history mutation or UI.
 * All identities live only in a throwaway in-memory indexed naming registry.
 */
import {performance} from 'node:perf_hooks';
import {
 createIndexedFictionalNameRegistry,generateIndexedFictionalNames
} from '../public/1999/engine/indexed-fictional-name-registry.mjs';
import {auditFictionalIdentityNaming}
 from '../public/1999/engine/fictional-name-quality-audit.mjs';
import {auditFictionalGenerationalNameQuality}
 from '../public/1999/engine/generational-name-quality-v14.mjs';

const opts={batches:100,owners:40,trainers:30,jockeys:25,
 farms:5,historic:12000,seed:19990101,start:1999,end:2099};
const caps={batches:2000,owners:250,trainers:250,jockeys:250,
 farms:50,historic:100000,seed:4294967295,start:2099,end:2099};
for(let i=2;i<process.argv.length;i+=2){
 const key=process.argv[i]?.startsWith('--')?process.argv[i].slice(2):null;
 const value=Number(process.argv[i+1]);
 if(!Object.hasOwn(opts,key)||!Number.isSafeInteger(value)||
  value<0||value>caps[key]||(key==='batches'&&value===0)||
  (key==='seed'&&value===0)){
  console.error('Invalid generational benchmark option '+process.argv[i]);
  process.exit(2);
 }
 opts[key]=value;
}
if(opts.start<1999||opts.end<opts.start)
 throw Error('Naming benchmark needs forward years 1999–2099');
const protectedOrgs=Array.from({length:opts.historic},(_,i)=>
 'Historical Protected '+String(i).padStart(6,'0')+' Farm');
const registry=createIndexedFictionalNameRegistry({
 worldId:'DISPOSABLE-GENERATIONS-V14',seed:opts.seed,
 protectedPeople:['Historical Person Protected'],
 protectedOrganizations:protectedOrgs
});
const t0=performance.now(),latencies=[],counts={people:0,organizations:0,
 modern:0,future:0,issues:0},byYear={};
let cursor=null,earlyCursorBytes=0;
for(let i=0;i<opts.batches;i++){
 const year=opts.start+Math.floor((i*(opts.end-opts.start))/Math.max(1,opts.batches-1));
 const t=performance.now();
 const result=generateIndexedFictionalNames({
  registry,worldId:'DISPOSABLE-GENERATIONS-V14',seed:opts.seed,cursor,year,
  roles:{trainer:opts.trainers,jockey:opts.jockeys,
   farrier:Math.max(1,Math.floor(opts.trainers/6))},
  owners:opts.owners,
  facilities:{generalFarms:Math.max(0,opts.farms-2),
   studFarms:opts.farms>0?1:0,nurseries:opts.farms>1?1:0},
  maxPartnershipGroups:128,soleOwnerPercent:23
 });
 const cohort=auditFictionalGenerationalNameQuality({
  manifest:result.manifest,people:result.people
 },{expectedYear:year});
 const quality=auditFictionalIdentityNaming({...result,
  // The indexed registry already validates the full protected historic set.
  // The read-only quality audit checks representative protected identity only,
  // rather than copying thousands of historic names into EVERY benchmark call.
  protectedNames:['Historical Person Protected']});
 if(!cohort.pass||!quality.pass){
  console.error(JSON.stringify({batchIndex:i,year,cohortIssues:cohort.issues,
   cohortCounts:cohort.issueCounts,identityIssues:quality.issues}));
  process.exit(1);
 }
 cursor=result.nextCursor;
 const organizations=result.owners.length+result.stables.length+
  result.farms.length+result.trainingCenters.length;
 counts.people+=result.people.length;
 counts.organizations+=organizations;
 counts.modern+=cohort.birthYearAfter1989;
 counts.future+=cohort.birthYearAfter2025;
 counts.issues+=cohort.issueTotal+quality.totalErrors;
 const era=year<2020?'1999–2019':year<2050?'2020–2049':
  year<2080?'2050–2079':'2080–2099';
 byYear[era]=(byYear[era]||0)+result.people.length;
 const elapsed=performance.now()-t;
 latencies.push(elapsed);
 if(!earlyCursorBytes)
  earlyCursorBytes=Buffer.byteLength(JSON.stringify(cursor),'utf8');
}
latencies.sort((a,b)=>a-b);
const lateCursorBytes=Buffer.byteLength(JSON.stringify(cursor),'utf8');
console.log(JSON.stringify({
 benchmark:'WTW-GENERATIONAL-NAMING-V14',
 disposable:true,playableWorldModified:false,
 options:opts,issuedNames:registry.namesIssued,
 owners:registry.ownerCount,partnershipGroups:registry.formalGroupsIssued,
 counts,byEra:byYear,
 firstCursorBytes:earlyCursorBytes,finalCursorBytes:lateCursorBytes,
 cursorGrowthBytes:lateCursorBytes-earlyCursorBytes,
 p95BatchMs:+(latencies[Math.ceil(latencies.length*.95)-1]||0).toFixed(2),
 maxBatchMs:+(latencies.at(-1)||0).toFixed(2),
 totalMs:Math.round(performance.now()-t0),
 note:'Synthetic in-memory stress test; no save, horses or world data written'
},null,2));
