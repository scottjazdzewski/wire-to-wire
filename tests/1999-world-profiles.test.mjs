import test from 'node:test';
import assert from 'node:assert/strict';
import {create1999Universe} from '../public/1999/engine/full-world-generator.mjs';
import {readLocal1999World} from '../public/1999/engine/local-api.mjs';
import {WORLD_SIZE_PRESETS,WORLD_POPULATION_LIMITS,normalizeWorldProfile,scopeWorldPopulation,
 worldPopulationPlan} from '../public/1999/engine/world-profiles.mjs';

const base=create1999Universe({seed:19990101,mode:'CANON_ANCHORED_TEST'});
const sizes=[10000,25000,75000,150000,325000];

test('each commercial population has a deterministic, gapless, unique directory',()=>{
 for(const population of sizes){
  const w=scopeWorldPopulation(base,{population,seed:19990101,mode:'CANON_ANCHORED_TEST'});
  assert.equal(w.counts.worldHorses,population);
  assert.equal(w.counts.horses,87500,'Original 1999 registered IDs must not change');
  assert.equal(Object.values(w.counts.populationGroups).reduce((a,b)=>a+b,0),population);
  const indices=[0,1,266,267,population-1,Math.floor(population/2)];
  for(const i of indices){
   const row=w.worldHorseDirectoryAt(i);
   assert.equal(row.index,i);
   assert.equal(w.worldIndexByHorseId(row.id),i);
   assert.equal(w.worldHorseAt(i).id,row.id);
   assert.equal(w.worldHorseAttributeAt(i,'raw_speed'),
    w.worldHorseAt(i).attributes.raw_speed);
  }
  assert.equal(w.worldHorseDirectoryAt(0).id,base.worldHorseDirectoryAt(0).id);
  assert.equal(w.worldHorseDirectoryAt(266).id,base.worldHorseDirectoryAt(266).id);
  assert.throws(()=>w.worldHorseDirectoryAt(population),/outside selected population|outside 1999 registry/);
 }
});
test('fictional and historical modes use separate deterministic world authorities',()=>{
 for(const mode of ['CANON_ANCHORED_TEST','FULLY_FICTIONAL_TEST']){
  const world=create1999Universe({seed:123456789,mode});
  const sized=scopeWorldPopulation(world,{population:25000,mode,seed:123456789});
  assert.equal(sized.worldProfile.mode,mode);
  assert.equal(sized.counts.worldHorses,25000);
  for(let i=0;i<200;i++){
   const row=sized.worldHorseDirectoryAt(i);
   assert.equal(sized.worldIndexByHorseId(row.id),i);
  }
 }
});
test('world presets never snapshot a larger world or change historic source IDs',()=>{
 assert.equal(WORLD_SIZE_PRESETS.length,4);
 assert.equal(WORLD_POPULATION_LIMITS.max,325000);
 const plan=worldPopulationPlan({population:25000,seed:19990101,mode:'CANON_ANCHORED_TEST'});
 assert.equal(plan.groups.reduce((n,x)=>n+x.count,0),25000);
 assert.equal(plan.groups[0].count>267,true);
 assert.equal(normalizeWorldProfile({population:325000}).population,325000);
 assert.throws(()=>normalizeWorldProfile({population:9000}));
 assert.throws(()=>normalizeWorldProfile({population:500000}));
 assert.throws(()=>normalizeWorldProfile({mode:'NONSENSE'}));
});
test('read-only 1999 API pages the selected world and preserves exact horse IDs',()=>{
 const q='?seed=19990101&mode=CANON_ANCHORED_TEST&population=25000';
 const overview=readLocal1999World('/api/1999/sim/overview'+q);
 assert.equal(overview.counts.worldHorses,25000);
 assert.equal(overview.worldProfile.population,25000);
 const page=readLocal1999World('/api/1999/sim/world-horse-directory'+q+'&offset=24998&limit=100');
 assert.equal(page.items.length,2);
 assert.equal(page.total,25000);
 const horse=readLocal1999World('/api/1999/sim/world-horse-profile'+q+'&id='+encodeURIComponent(page.items[0].id));
 assert.equal(horse.index,24998);
 assert.equal(horse.horse.id,page.items[0].id);
 const trait=readLocal1999World('/api/1999/sim/world-horse-attribute'+q+'&key=raw_speed&offset=24998&limit=1');
 assert.equal(trait.items[0].value,horse.horse.attributes.raw_speed);
});
