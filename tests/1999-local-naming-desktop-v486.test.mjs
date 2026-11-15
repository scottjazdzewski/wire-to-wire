import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildNamingLabScenario} from '../public/next/1999-naming-desk.mjs';
import {LOCAL_HORSE_NAMING_SCHEMA,LOCAL_HORSE_NAMING_ALGORITHM_REVISION,
 createLocalStoryIdeas,generateLocalStoryFirstHorseNames,generateLocalPopulationNamingBatch}
 from '../src/game/horse-naming-local-v485.js';
import {LOCAL_HORSE_NAMING_ALGORITHM_REVISION as BROWSER_REVISION,
 generateLocalStoryFirstHorseNames as browserGenerate}
 from '../public/1999/game/horse-naming-local-v485.js';
import {foalingEventNamingBrief,planPopulationNamingCohorts}
 from '../src/game/horse-naming-population-planner.js';

const story='The night the colt was born a thunderstorm knocked out the electricity. The rain struck the gate while the old bell rang, and the mare remained quiet in the dark barn.';
const fields={ownerName:'Fictional Test Owner',breederName:'Fictional Test Breeder',foalingYear:1996,story};
const norm=x=>String(x).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');

test('V485 wire schema retained but the V486 deterministic algorithm is clearly revision-pinned',()=>{
 assert.equal(LOCAL_HORSE_NAMING_SCHEMA,'WTW_LOCAL_HORSE_NAMING_V485');
 assert.equal(LOCAL_HORSE_NAMING_ALGORITHM_REVISION,'WTW_LOCAL_NAMING_RULES_V488');
 assert.equal(BROWSER_REVISION,LOCAL_HORSE_NAMING_ALGORITHM_REVISION);
 const scenario=buildNamingLabScenario(fields);
 const original=JSON.stringify(scenario);
 const a=generateLocalStoryFirstHorseNames({...scenario,count:8,attempt:4});
 const b=browserGenerate({...scenario,count:8,attempt:4});
 assert.deepEqual(a,b);
 assert.deepEqual(a,generateLocalStoryFirstHorseNames({...scenario,count:8,attempt:4}));
 assert.equal(a.algorithmRevision,LOCAL_HORSE_NAMING_ALGORITHM_REVISION);
 assert.equal(a.registrationStatus,'NOT_RELEASED');
 assert.equal(a.gameWrites,0);
 assert.equal(JSON.stringify(scenario),original);
});

test('V486 checks later authored names if first eight proposals collide with existing registry',()=>{
 const scenario=buildNamingLabScenario(fields);
 const all=createLocalStoryIdeas(scenario.brief,{count:8,attempt:0});
 assert.ok(all.suggestions.length>8,'test story must produce fallback creative candidates');
 const reservedNames=all.suggestions.slice(0,8).map(x=>x.name);
 const result=generateLocalStoryFirstHorseNames({...scenario,attempt:0,count:8,reservedNames});
 assert.ok(result.candidatesExamined>8,'the entire authored pool was screened');
 assert.ok(result.readyForIndependentEditor>0,'fallback proposals should survive');
 assert.ok(result.screened.every(x=>!reservedNames.includes(x.name)));
 assert.ok(result.screened.every(x=>x.registrationStatus==='NOT_RELEASED'));
});

test('single-horse local writer refuses a silent 16-name request that the editorial screen caps at eight',()=>{
 const scenario=buildNamingLabScenario(fields);
 assert.throws(()=>generateLocalStoryFirstHorseNames({...scenario,count:16}),/Invalid local naming generation controls/);
 assert.throws(()=>createLocalStoryIdeas(scenario.brief,{count:16}),/Invalid trusted local foal naming brief/);
});

test('offline population naming requires a COMPLETE local uniqueness registry, not just the last 60 names',()=>{
 const year=2042;
 const makeFoal=i=>{
  const horseId='H-FUTURE-2042-'+String(i).padStart(5,'0');
  return foalingEventNamingBrief({horseId,foalingYear:year,
   owner:{id:'OWNER-2042',name:'Test Owner'},
   breeder:{id:'BREEDER-2042',name:'Test Breeder'},
   event:{kind:'FOALING_EVENT',eventId:'FOALING-2042-'+String(i).padStart(5,'0'),
    horseId,naming_narrative:story}
  });
 };
 const foals=Array.from({length:128},(_,i)=>makeFoal(i));
 const batches=planPopulationNamingCohorts(foals,{runId:'NAMING-RUN-2042',year});
 const allReserved=new Set();
 let held=0,exhausted=0,total=0,last60=[];
 for(const batch of batches){
  const result=generateLocalPopulationNamingBatch({batch,
   existingNames:[...allReserved],attempt:0});
  assert.equal(result.algorithmRevision,LOCAL_HORSE_NAMING_ALGORITHM_REVISION);
  assert.equal(result.requiresFullLocalNameRegistry,true);
  assert.equal(result.writesToGame,false);
  assert.equal(result.remoteRequests,0);
  assert.equal(result.creditsUsed,0);
  for(const key of result.newCandidateNameKeys){
   assert.ok(!allReserved.has(key),'a local name was reused across cohort boundaries');
   allReserved.add(key);
  }
  assert.ok(result.nextRecentNames.length<=60);
  assert.equal(result.newCandidateNameKeys.length,new Set(result.newCandidateNameKeys).size);
  total+=result.requested;held+=result.held;exhausted+=result.exhaustedFoals;
  last60=result.nextRecentNames;
 }
 assert.equal(total,128);
 assert.ok(allReserved.size>0);
 assert.ok(exhausted>0,'a finite authored catalogue must hold foals rather than invent filler');
 assert.ok(last60.length<=60);
});

test('offline V486 does not require a network, browser origin, or Cloudflare runtime',async()=>{
 const src=await readFile(new URL('../src/game/horse-naming-local-v485.js',import.meta.url),'utf8');
 const mirror=await readFile(new URL('../public/1999/game/horse-naming-local-v485.js',import.meta.url),'utf8');
 const ui=await readFile(new URL('../public/next/1999-naming-desk.mjs',import.meta.url),'utf8');
 assert.equal(src,mirror);
 assert.doesNotMatch(src,/\b(?:fetch|XMLHttpRequest|WebSocket|localStorage|indexedDB|env\.AI)\s*\(/);
 assert.match(ui,/55,000-per-year target is NOT capacity-certified/);
 assert.doesNotMatch(ui,/AI requests are budget-limited/);
 const prior=globalThis.fetch;
 let calls=0;
 globalThis.fetch=()=>{calls++;throw Error('Network disabled')};
 try {
  const scenario=buildNamingLabScenario(fields);
  const out=generateLocalStoryFirstHorseNames({...scenario,attempt:1});
  assert.ok(out.screened.length>0);
  assert.equal(out.requestCount,0);
 }finally{globalThis.fetch=prior}
 assert.equal(calls,0);
});
