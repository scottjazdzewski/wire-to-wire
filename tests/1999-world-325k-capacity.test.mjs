import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {create1999Universe,HORSE_POPULATION,WORLD_HORSE_POPULATION,FULL_WORLD_SCHEMA} from '../public/1999/engine/full-world-generator.mjs';
import {readLocal1999World} from '../public/1999/engine/local-api.mjs';

const world=create1999Universe({seed:19990101,mode:'CANON_ANCHORED_TEST'});
const overview=readLocal1999World('/api/1999/sim/overview');
const get=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('325k World registry composes disjoint population groups without moving original 87.5k ids',()=>{
 assert.equal(WORLD_HORSE_POPULATION,325000);
 assert.equal(HORSE_POPULATION,87500);
 assert.equal(world.counts.worldHorses,325000);
 assert.deepEqual(world.counts.populationGroups,{
  registered:87500,broodmares:60000,stallions:1400,additional:176100
 });
 assert.equal(Object.values(world.counts.populationGroups).reduce((a,b)=>a+b,0),325000);
 assert.equal(overview.counts.worldHorses,325000);
 assert.equal(FULL_WORLD_SCHEMA,'WTW_1999_FULL_SCALE_TEST_V1');
});
test('all partition boundaries are stable, unique and exactly reversible by horse id',()=>{
 const boundaries=[0,266,267,87499,87500,147499,147500,148899,148900,
  185149,185150,221399,221400,291399,291400,324999];
 const ids=new Set();
 for(const index of boundaries){
  const horse=world.worldHorseDirectoryAt(index);
  assert.ok(horse.id&&horse.name);
  assert.equal(horse.index,index);
  assert.equal(world.worldIndexByHorseId(horse.id),index);
  assert.equal(ids.has(horse.id),false,'Duplicate distinct horse ID '+horse.id);
  ids.add(horse.id);
 }
 assert.equal(world.worldHorseDirectoryAt(87500).registryGroup,'BROODMARE');
 assert.equal(world.worldHorseDirectoryAt(147500).registryGroup,'STALLION');
 assert.equal(world.worldHorseDirectoryAt(148900).registryGroup,'YEARLING');
 assert.equal(world.worldHorseDirectoryAt(185150).registryGroup,'TWO_YEAR_OLD');
 assert.equal(world.worldHorseDirectoryAt(221400).registryGroup,'RACING_AGE');
 assert.equal(world.worldHorseDirectoryAt(291400).registryGroup,'RETIRED');
 assert.throws(()=>world.worldHorseDirectoryAt(325000));
});
test('globally sorted attribute values are identical to each horse full profile',()=>{
 const chosen=[0,87499,87500,147499,147500,148899,148900,185149,185150,221400,291400,324999];
 for(const index of chosen){
  const profile=world.worldHorseAt(index),directory=world.worldHorseDirectoryAt(index);
  assert.equal(profile.id,directory.id);
  assert.equal(profile.attributes.raw_speed,world.worldHorseAttributeAt(index,'raw_speed'));
 }
});
test('global API returns paged directory and exact ID-backed details',()=>{
 const page=readLocal1999World('/api/1999/sim/world-horse-directory?offset=324995&limit=100');
 assert.equal(page.total,325000);
 assert.equal(page.items.length,5);
 const picked=page.items[0];
 const profile=readLocal1999World('/api/1999/sim/world-horse-profile?id='+encodeURIComponent(picked.id));
 assert.equal(profile.horse.id,picked.id);
 assert.equal(profile.index,324995);
 const values=readLocal1999World('/api/1999/sim/world-horse-attribute?key=raw_speed&offset=324995&limit=2');
 assert.equal(values.items.length,2);
 assert.equal(values.items[0].value,profile.horse.attributes.raw_speed);
});
test('full horse caches are bounded even when browsing widely',()=>{
 for(let index=0;index<560;index++)world.horseAt(index);
 for(let index=148900;index<149185;index++)world.worldHorseAt(index);
 const stats=world.populationCacheStats();
 assert.ok(stats.legacyFullProfiles<=512);
 assert.ok(stats.additionalFullProfiles<=256);
 assert.equal(stats.worldDirectoryEntries,325000);
});
test('worker owns full-world sorting and UI does not serialize the population',()=>{
 const worker=get('public/next/1999-world-index.worker.mjs');
 const adapter=get('public/next/1999-ui-source.mjs');
 const ui=get('public/next/next.js');
 assert.match(worker,/function resultPage\(query\)/);
 assert.match(worker,/function filterRow\(row,needle,filters\)/);
 assert.match(worker,/cachedTraits\.size>=2/);
 assert.match(worker,/self\.postMessage\(\{type:'result'/);
 assert.match(adapter,/function workerWorldBrowse\(query\)/);
 assert.match(adapter,/worldHorseById/);
 assert.match(ui,/worldHorses\|\|87500/);
 assert.doesNotMatch(worker,/localStorage\./);
});
