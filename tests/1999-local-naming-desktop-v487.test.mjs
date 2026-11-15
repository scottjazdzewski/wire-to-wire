import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createLocalStoryIdeas,generateLocalPopulationNamingBatch,
 LOCAL_HORSE_NAMING_ALGORITHM_REVISION}
 from '../src/game/horse-naming-local-v485.js';
import {generateLocalPopulationNamingBatch as browserGenerate}
 from '../public/1999/game/horse-naming-local-v485.js';
import {foalingEventNamingBrief,planPopulationNamingCohorts}
 from '../src/game/horse-naming-population-planner.js';
import {OWNER_REVIEWED_NAME_KEYS_V478}
 from '../src/game/horse-naming-owner-review-v478.js';

const story='The thunderstorm caused a power outage while rain fell on the gate. '+
 'The old bell rang as the quiet mare gave birth in the dark barn. '+
 'The night groom could hear her steady breathing beside the paddock.';
const key=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const makeBrief=i=>{
 const horseId='H-V487-FOAL-2041-'+String(i).padStart(4,'0');
 return foalingEventNamingBrief({horseId,foalingYear:2041,
  owner:{id:'O-V487-OWNER',name:'Local Test Owner'},
  breeder:{id:'B-V487-BREEDER',name:'Local Test Breeder'},
  event:{kind:'FOALING_EVENT',eventId:'E-V487-FOAL-'+String(i).padStart(4,'0'),
   horseId,naming_narrative:story}
 });
};
const batchFor=briefs=>[...planPopulationNamingCohorts(briefs,{
 runId:'LOCAL-V487-RUN',year:2041
})][0];

test('V487 screens later authored foal names when earliest two are already registered',()=>{
 const brief=makeBrief(1),batch=batchFor([brief]);
 const authored=createLocalStoryIdeas(brief,{count:8,attempt:0}).suggestions;
 assert.ok(authored.length>8,'exercise more than the first two names');
 const blocked=authored.slice(0,2).map(s=>s.name);
 const input=JSON.stringify(batch);
 const out=generateLocalPopulationNamingBatch({batch,existingNames:blocked,attempt:0});
 const mirror=browserGenerate({batch,existingNames:blocked,attempt:0});
 assert.deepEqual(out,mirror,'live source and browser writer must agree');
 assert.deepEqual(out,generateLocalPopulationNamingBatch({batch,existingNames:blocked,attempt:0}));
 assert.equal(JSON.stringify(batch),input,'naming never mutates the certified foaling record');
 assert.equal(out.algorithmRevision,LOCAL_HORSE_NAMING_ALGORITHM_REVISION);
 assert.equal(out.algorithmRevision,'WTW_LOCAL_NAMING_RULES_V487');
 assert.ok(out.readyForIndependentEditor>0,'later valid names should be offered');
 assert.equal(out.screened[0].proposals.length,out.readyForIndependentEditor);
 assert.ok(out.screened[0].proposals.every(p=>p.status==='READY_FOR_INDEPENDENT_EDITOR'));
 assert.ok(out.screened[0].proposals.every(p=>!blocked.some(n=>key(n)===key(p.name))));
 assert.deepEqual(out.newCandidateNameKeys,
  out.screened[0].proposals.map(p=>key(p.name)).sort());
 assert.equal(out.writesToGame,false);
 assert.equal(out.approvedForRegistration,false);
 assert.equal(out.remoteRequests,0);
});

test('V487 never reserves failed owner-reviewed names and never duplicates within a cohort',()=>{
 const brief1=makeBrief(1),brief2=makeBrief(2);
 const batch=batchFor([brief1,brief2]);
 const out=generateLocalPopulationNamingBatch({batch,existingNames:[]});
 const ready=out.screened.flatMap(r=>r.proposals)
  .filter(p=>p.status==='READY_FOR_INDEPENDENT_EDITOR');
 const readyKeys=ready.map(p=>key(p.name));
 const rated=new Set(OWNER_REVIEWED_NAME_KEYS_V478);
 assert.deepEqual(out.newCandidateNameKeys,[...new Set(readyKeys)].sort());
 assert.equal(new Set(readyKeys).size,readyKeys.length);
 assert.ok(readyKeys.every(n=>!rated.has(n)));
 assert.equal(out.newCandidateNameKeys.length,out.readyForIndependentEditor);
 assert.ok(out.screened.every(r=>r.proposals.length<=2));
 assert.equal(out.exhaustedFoals,out.screened.filter(r=>r.proposals.length===0).length);
});

test('V487 exhausts safely if all authored names are pre-reserved, with empty reservation delta',()=>{
 const brief=makeBrief(3),batch=batchFor([brief]);
 const pool=createLocalStoryIdeas(brief,{count:8,attempt:0}).suggestions.map(s=>s.name);
 assert.ok(pool.length>0);
 const out=generateLocalPopulationNamingBatch({batch,existingNames:pool});
 assert.equal(out.exhaustedFoals,1);
 assert.equal(out.readyForIndependentEditor,0);
 assert.deepEqual(out.newCandidateNameKeys,[]);
 assert.deepEqual(out.screened[0].proposals,[]);
 assert.equal(out.status,'LOCAL_BATCH_COMPLETE_NEEDS_EDITOR');
 assert.equal(out.approvedForRegistration,false);
});

test('V487 exact source/browser module mirror and no cloud naming dependency',async()=>{
 const src=await readFile(new URL('../src/game/horse-naming-local-v485.js',import.meta.url),'utf8');
 const browser=await readFile(new URL('../public/1999/game/horse-naming-local-v485.js',import.meta.url),'utf8');
 assert.equal(src,browser);
 assert.doesNotMatch(src,/\b(?:fetch|XMLHttpRequest|WebSocket|indexedDB|localStorage)\s*\(/);
});
