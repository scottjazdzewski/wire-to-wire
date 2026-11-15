import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createLocalStoryIdeas,generateLocalPopulationNamingBatch,
 LOCAL_HORSE_NAMING_ALGORITHM_REVISION}
 from '../src/game/horse-naming-local-v485.js';
import {createLocalStoryIdeas as browserIdeas,generateLocalPopulationNamingBatch as browserBatch}
 from '../public/1999/game/horse-naming-local-v485.js';
import {foalingEventNamingBrief,planPopulationNamingCohorts}
 from '../src/game/horse-naming-population-planner.js';
import {OWNER_REVIEWED_NAME_KEYS_V478}
 from '../src/game/horse-naming-owner-review-v478.js';

const story='The quiet mare gave birth in a dark barn during a thunderstorm. '+
 'Rain fell on the paddock gate while the old bell rang. The night groom '+
 'could hear her steady breathing after the power outage.';
const norm=x=>String(x).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const foal=i=>{
 const horseId='HORSE-V488-2041-'+String(i).padStart(6,'0');
 return foalingEventNamingBrief({horseId,foalingYear:2041,
  owner:{id:'OWNER-V488',name:'Quality Test Stable'},
  breeder:{id:'BREEDER-V488',name:'Quality Test Farm'},
  event:{kind:'FOALING_EVENT',eventId:'FOALING-V488-'+String(i).padStart(6,'0'),
   horseId,naming_narrative:story}
 });
};
const batches=briefs=>[...planPopulationNamingCohorts(briefs,{runId:'V488-TEST-RUN',year:2041})];

test('V488 authored catalogue has 600 normalized whole names; all fit game length',async()=>{
 const source=await readFile(new URL('../src/game/horse-naming-local-v485.js',import.meta.url),'utf8');
 const mirror=await readFile(new URL('../public/1999/game/horse-naming-local-v485.js',import.meta.url),'utf8');
 assert.equal(source,mirror);
 const names=[...source.matchAll(/(?:names:\[|"[a-z]+": \[)([^\]]*)\]/g)]
  .flatMap(m=>[...m[1].matchAll(/(?:'([^']+)'|"([^"]+)")/g)]
   .map(n=>n[1]||n[2]));
 assert.equal(names.length,601,'241 prior whole-name slots plus 360 new reviewed slots');
 const keys=new Set(names.map(norm));
 assert.equal(keys.size,601,'all authored names must be distinct');
 assert.ok(names.every(x=>x.length>0&&x.length<=18&&!/\d/.test(x)));
 const rated=new Set(OWNER_REVIEWED_NAME_KEYS_V478);
 assert.equal([...keys].filter(x=>rated.has(x)).length,0,'never offer a prior owner-reviewed name');
 assert.equal(keys.size-[...keys].filter(x=>rated.has(x)).length,601);
});

test('V488 retains bounded Naming Desk previews but scans every authored name for foaling',()=>{
 const brief=foal(0);
 const preview=createLocalStoryIdeas(brief,{count:8,attempt:0});
 const all=createLocalStoryIdeas(brief,{count:8,attempt:0,scanAll:true});
 assert.ok(preview.suggestions.length<=24);
 assert.ok(all.suggestions.length>preview.suggestions.length);
 assert.deepEqual(all,browserIdeas(brief,{count:8,attempt:0,scanAll:true}));
 assert.deepEqual(all,createLocalStoryIdeas(brief,{count:8,attempt:0,scanAll:true}));
 assert.equal(new Set(all.suggestions.map(s=>norm(s.name))).size,all.suggestions.length);
 assert.ok(all.suggestions.every(s=>s.name.length<=18));
 assert.ok(all.suggestions.every(s=>s.explanation.length>=35));
 assert.ok(all.suggestions.every(s=>story.toLowerCase().includes(s.evidenceQuote.toLowerCase())));
 assert.equal(LOCAL_HORSE_NAMING_ALGORITHM_REVISION,'WTW_LOCAL_NAMING_RULES_V488');
 assert.throws(()=>createLocalStoryIdeas(brief,{scanAll:'yes'}),/Invalid trusted/);
});

test('V488 foal can use candidate number 25 and beyond when early pool is reserved',()=>{
 const brief=foal(1),[batch]=batches([brief]);
 const preview=createLocalStoryIdeas(brief,{count:8,attempt:0});
 const reserved=preview.suggestions.map(s=>s.name);
 assert.equal(reserved.length,24);
 const out=generateLocalPopulationNamingBatch({batch,existingNames:reserved});
 assert.equal(out.readyForIndependentEditor,2);
 assert.equal(out.exhaustedFoals,0);
 assert.ok(out.screened[0].proposals.every(x=>!reserved.includes(x.name)));
 assert.deepEqual(out,browserBatch({batch,existingNames:reserved}));
 assert.equal(out.newCandidateNameKeys.length,2);
 assert.equal(out.algorithmRevision,LOCAL_HORSE_NAMING_ALGORITHM_REVISION);
 assert.equal(out.writesToGame,false);
});

test('V488 multiple foal cohorts preserve all-time uniqueness with the full registry',()=>{
 const source=Array.from({length:48},(_,i)=>foal(i+100));
 const issued=new Set(),list=batches(source);
 let held=0,ready=0;
 for(const batch of list){
  const out=generateLocalPopulationNamingBatch({batch,existingNames:[...issued]});
  assert.equal(out.remoteRequests,0);
  assert.equal(out.creditsUsed,0);
  assert.equal(out.approvedForRegistration,false);
  assert.ok(out.nextRecentNames.length<=60);
  for(const k of out.newCandidateNameKeys){
   assert.ok(!issued.has(k),'reserved names must not repeat between cohorts');
   issued.add(k);
  }
  ready+=out.readyForIndependentEditor;
  held+=out.exhaustedFoals;
 }
 assert.ok(ready>48,'more than one distinct name per foal for most of the series');
 assert.equal(issued.size,ready);
 assert.equal(held,0,'48 shared-story foals should not exhaust the expanded library');
});

test('V488 no full-foal-pool random joins or external services',async()=>{
 const code=await readFile(new URL('../src/game/horse-naming-local-v485.js',import.meta.url),'utf8');
 assert.match(code,/V488_WHOLE_NAMES/);
 assert.doesNotMatch(code,/\b(?:fetch|XMLHttpRequest|WebSocket|localStorage|indexedDB)\s*\(/);
 const old=globalThis.fetch;
 globalThis.fetch=()=>{throw Error('No network in local naming')};
 try{
  const [batch]=batches([foal(88)]);
  const result=generateLocalPopulationNamingBatch({batch});
  assert.ok(result.readyForIndependentEditor>0);
 }finally{globalThis.fetch=old}
});
