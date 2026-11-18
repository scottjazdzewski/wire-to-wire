import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {V491_WHOLE_NAMES} from '../src/game/horse-naming-author-v491.js';
import {V491_WHOLE_NAMES as browserCatalog}
 from '../public/1999/game/horse-naming-author-v491.js';
import {createLocalStoryIdeas,generateLocalPopulationNamingBatch,
 generateProvisional1999IndustryNameRoster,
 LOCAL_HORSE_NAMING_ALGORITHM_REVISION,
 OPENING_INDUSTRY_HORSE_NAMING_REVISION}
 from '../src/game/horse-naming-local-v485.js';
import {createLocalStoryIdeas as browserIdeas,
 generateLocalPopulationNamingBatch as browserBatch,
 generateProvisional1999IndustryNameRoster as browserOpening}
 from '../public/1999/game/horse-naming-local-v485.js';
import {foalingEventNamingBrief,planPopulationNamingCohorts}
 from '../src/game/horse-naming-population-planner.js';
import {OWNER_REVIEWED_NAME_KEYS_V478} from '../src/game/horse-naming-owner-review-v478.js';

const norm=x=>String(x).normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'')
 .toLowerCase().replace(/[^a-z0-9]/g,'');
const cues={
 storm:'A thunderstorm crossed the paddock at dusk.',
 blackout:'The power outage darkened the old farm lane.',
 breathing:'The mare had a steady heartbeat in the stall.',
 calm:'The mare stayed unbothered during the noisy gathering.',
 bell:'The old bell rang twice near the stable.',
 rain:'Rain arrived before the caretaker opened the gate.',
 sun:'At sunrise the staff gathered by the stall.',
 night:'The new horse arrived late at night.',
 gate:'The gate by the far pasture would not latch.',
 train:'A railway whistle carried across the farm.',
 music:'A piano was playing in the family home.',
 books:'The groom kept a novel and read a page.',
 road:'A long road wound into the farm property.',
 family:'The grandmother kept a photograph of the mare.',
 fire:'A small fire burned in the caretaker hearth.',
 river:'A narrow river ran beyond the lower meadow.',
 orchard:'The orchard nearby was full of apples.',
 foal:'The colt was born in a quiet stable.',
 wildlife:'A fox crossed the field beside the stable.',
 winter:'Snow covered the paddock all winter.',
 summer:'The afternoon was humid and hot in summer.',
 market:'The village fair had a parade nearby.',
 craft:'A blacksmith was working iron in the yard.',
 seaside:'The ocean wind came over the nearby coast.',
 luck:'The owner called the arrival a stroke of luck.',
 personality:'The young filly was stubborn and defiant.',
 door:'The wooden door to the barn was painted red.',
 movement:'The young colt took a leap and quick step.',
 markings:'The mare had a white blaze down its face.',
 whimsy:'The groom laughed at a silly joke that night.'
};
function brief(motif,index=1){
 const horseId='H-V491-'+motif+'-'+index;
 return foalingEventNamingBrief({horseId,foalingYear:2041,
  owner:{id:'O-V491',name:'V491 Test Stable'},
  breeder:{id:'B-V491',name:'V491 Test Farm'},
  event:{kind:'FOALING_EVENT',eventId:'E-V491-'+motif+'-'+index,
   horseId,naming_narrative:'The owner recorded a specific memory from the day: '+
    cues[motif]+' The details were written down at the farm.'}
 });
}
function oldAuthoredNames(source){
 return [...source.matchAll(/(?:names:\\[|"[a-z]+": \\[)([^\\]]*)\\]/g)]
  .flatMap(m=>[...m[1].matchAll(/(?:'([^']+)'|"([^"]+)")/g)]
   .map(n=>n[1]||n[2]));
}

test('V491 adds 360 original whole names, not old rated or already authored words',async()=>{
 const [source,sourceCatalog,browserCatalogSource]=await Promise.all([
  readFile(new URL('../src/game/horse-naming-local-v485.js',import.meta.url),'utf8'),
  readFile(new URL('../src/game/horse-naming-author-v491.js',import.meta.url),'utf8'),
  readFile(new URL('../public/1999/game/horse-naming-author-v491.js',import.meta.url),'utf8')
 ]);
 assert.equal(sourceCatalog,browserCatalogSource);
 assert.deepEqual(V491_WHOLE_NAMES,browserCatalog);
 const motifs=[...source.matchAll(/id:'([^']+)',cue:/g)].map(x=>x[1]).sort();
 assert.equal(motifs.length,30);
 assert.deepEqual(Object.keys(V491_WHOLE_NAMES).sort(),motifs);
 const newNames=Object.values(V491_WHOLE_NAMES).flat();
 const earlier=oldAuthoredNames(source);
 const excluded=new Set(OWNER_REVIEWED_NAME_KEYS_V478);
 const older=new Set(earlier.map(norm)),fresh=new Set(newNames.map(norm));
 assert.equal(earlier.length,601);
 assert.equal(older.size,601);
 assert.equal(newNames.length,360);
 assert.equal(fresh.size,360,'no duplicate name keys across motifs');
 assert.equal(newNames.filter(x=>!x||x.length>18||/\\d/.test(x)).length,0);
 assert.equal(newNames.filter(x=>older.has(norm(x))).length,0);
 assert.equal(newNames.filter(x=>excluded.has(norm(x))).length,0);
 assert.equal(older.size+fresh.size,961);
 assert.equal(LOCAL_HORSE_NAMING_ALGORITHM_REVISION,'WTW_LOCAL_NAMING_RULES_V491');
});

test('all 30 actual narrative voices can reach every added authored name offline',()=>{
 for(const motif of Object.keys(V491_WHOLE_NAMES)){
  const trusted=brief(motif);
  const a=createLocalStoryIdeas(trusted,{count:8,attempt:0,scanAll:true});
  const b=browserIdeas(trusted,{count:8,attempt:0,scanAll:true});
  assert.deepEqual(a,b,motif+' browser/source parity');
  const keys=new Set(a.suggestions.map(x=>norm(x.name)));
  for(const name of V491_WHOLE_NAMES[motif])
   assert.ok(keys.has(norm(name)),motif+' lost '+name);
  assert.ok(a.suggestions.every(x=>x.evidenceQuote.length>=12));
  assert.ok(a.suggestions.every(x=>x.explanation.length>35));
  assert.ok(createLocalStoryIdeas(trusted,{count:8}).suggestions.length<=24);
 }
});

test('V491 genuinely supplies additional foal candidates after all 601 old names are reserved',async()=>{
 const source=await readFile(new URL('../src/game/horse-naming-local-v485.js',import.meta.url),'utf8');
 const before=oldAuthoredNames(source);
 const [batch]=[...planPopulationNamingCohorts([brief('storm',92)],
  {runId:'V491-FOAL-REGISTRY',year:2041})];
 const input={batch,existingNames:before};
 const a=generateLocalPopulationNamingBatch(input);
 assert.deepEqual(a,browserBatch(input));
 assert.equal(a.remoteRequests,0);
 assert.equal(a.writesToGame,false);
 assert.equal(a.approvedForRegistration,false);
 assert.equal(a.algorithmRevision,LOCAL_HORSE_NAMING_ALGORITHM_REVISION);
 assert.ok(a.readyForIndependentEditor>0,'new story names must beat old-catalogue exhaustion');
 const issued=new Set(before.map(norm));
 for(const name of a.screened.flatMap(row=>row.proposals)
  .filter(x=>x.status==='READY_FOR_INDEPENDENT_EDITOR').map(x=>x.name)){
  assert.ok(!issued.has(norm(name)),'do not recycle existing names');
  issued.add(norm(name));
 }
});

test('V491 never changes the 1999 opening-world naming revision or source/browser roster',()=>{
 const opts={seed:19990101,horseCount:150,protectedNames:['Historic Ace']};
 const a=generateProvisional1999IndustryNameRoster(opts);
 const b=browserOpening(opts);
 assert.deepEqual(a,b);
 assert.deepEqual(a,generateProvisional1999IndustryNameRoster(opts));
 assert.equal(OPENING_INDUSTRY_HORSE_NAMING_REVISION,
  'WTW_LOCAL_NAMING_RULES_V488:OPENING_INDUSTRY_V1');
 assert.equal(a.algorithmRevision,OPENING_INDUSTRY_HORSE_NAMING_REVISION);
});
