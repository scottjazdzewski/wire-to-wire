import test from 'node:test';
import assert from 'node:assert/strict';
import {openingWorld1999 as source} from '../src/1999/opening-world.v1.mjs';
import {createFounding1999Universe} from '../public/1999/engine/founding-world-1999.mjs';
import {readLocal1999World} from '../public/1999/engine/local-api.mjs';

const world=createFounding1999Universe({seed:19990101});
const api=path=>readLocal1999World(path+
  (path.includes('?')?'&':'?')+'seed=19990101&mode=FOUNDING_1999&population=73');
const ids=a=>new Set(a.map(x=>x.id));

test('real code has ZERO old synthetic horses, old staff, old organizations or old event queue',()=>{
 assert.equal(source.schema,'WTW_1999_APPROVED_FOUNDING_READ_MODEL_V2');
 assert.equal(source.effectiveDate,'1999-01-01');
 assert.deepEqual(source.horses,[]);
 assert.deepEqual(source.openingEventQueue1999,[]);
 assert.deepEqual(source.pendingNotBookableStallions,[]);
 assert.equal(source.organizations.length,19);
 assert.equal(source.people.length,6);
 assert.equal(source.tracks.length,118);
 assert.equal(source.activeStallions1999.length,18);
 assert.equal(source.foundationalBroodmares1999.length,11);
 assert.equal(source.productionBroodmareBoarding1999.length,44);
 assert.equal(ids(source.organizations).size,19);
 assert.equal(ids(source.people).size,6);
 assert.equal(ids(source.tracks).size,118);
 const serialized=JSON.stringify(source);
 assert.doesNotMatch(serialized,/GENERATED_OPENING|CANON_ANCHORED_TEST|FULLY_FICTIONAL_TEST|B01/);
});
test('only the selected 37 founders, 41 people and 73 breeding horses enter 1999',()=>{
 assert.equal(world.sourceOrganizations.length,37);
 assert.equal(world.sourcePeople.length,41);
 assert.equal(world.sourceHorses.length,0);
 assert.equal(world.counts.horses,0);
 assert.equal(world.counts.worldHorses,73);
 assert.equal(world.counts.breedingStallions,18);
 assert.equal(world.counts.breedingMares,55);
 assert.equal(world.counts.auctions,0);
 assert.equal(world.counts.trainers,0);
 assert.equal(world.counts.facilities,30);
 assert.equal(world.counts.tracks,118);
 const approvedStock=ids([...world.sourceStallions,...world.sourceBroodmares]);
 assert.equal(approvedStock.size,73);
});
test('protected pedigree and 61 linked historical identities survive, with no 1999 race entries',()=>{
 assert.equal(source.historicalHorses.length,61);
 assert.ok(source.pedigreeNodes.length>2000);
 assert.equal(source.stakes1999.length,93);
 assert.equal(source.historicalYearbook.length,49);
 assert.equal(ids(source.stakes1999).size,93);
 const tracks=ids(source.tracks);
 for(const s of source.stakes1999){
  assert.ok(tracks.has(s.trackId),s.id);
  assert.equal(typeof s.winner,'undefined');
 }
 assert.equal(world.historicalHorses.length,61);
 assert.equal(world.counts.worldHorses,73);
});
test('browser API serves approved foundation only and refuses retired generated world modes',()=>{
 const overview=api('/api/1999/sim/overview');
 assert.equal(overview.gameplayReady,false);
 assert.equal(overview.counts.horses,0);
 assert.equal(overview.counts.worldHorses,73);
 assert.equal(api('/api/1999/horses').total,0);
 assert.equal(api('/api/1999/people').total,41);
 assert.equal(api('/api/1999/organizations').total,37);
 assert.equal(api('/api/1999/sim/tracks').total,118);
 assert.equal(api('/api/1999/sim/auctions').total,0);
 assert.equal(api('/api/1999/sim/people').total,0);
 assert.throws(()=>readLocal1999World('/api/1999/sim/overview?mode=CANON_ANCHORED_TEST'));
 assert.throws(()=>readLocal1999World('/api/1999/sim/overview?mode=FULLY_FICTIONAL_TEST'));
 assert.throws(()=>readLocal1999World('/api/1999/sim/overview?population=325000'));
 assert.throws(()=>readLocal1999World('/api/1999/sim/horses?pilot=opening&population=400'));
});
test('source-only horse IDs never quietly become owned running stock',()=>{
 const breeds=api('/api/1999/sim/world-horse-directory?limit=100').items;
 assert.equal(breeds.length,73);
 assert.equal(ids(breeds).size,73);
 assert.equal(api('/api/1999/sim/owner-horses?ownerId=O-000011').total,0);
 assert.deepEqual(world.ownedHorseIndexes('O-000011'),[]);
});
