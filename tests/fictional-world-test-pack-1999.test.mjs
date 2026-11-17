import test from 'node:test';
import assert from 'node:assert/strict';
import {fictional1999TrackPack,fictional1999Foundation,
 create1999PopulatedTestWorld} from '../public/1999/engine/fictional-world-test-pack-1999.mjs';
test('1999 test pack has playable tracks and purely fictional founding pedigree',()=>{
 const tracks=fictional1999TrackPack();
 assert.ok(tracks.length>90);
 const foundation=fictional1999Foundation();
 assert.equal(foundation.length,200);
 assert.ok(foundation.every(h=>h.source==='FICTIONAL_GENERATED_PEDIGREE'));
});
test('1999 integrated quick world has horses, personnel, ratings and race dates',async()=>{
 const career=await create1999PopulatedTestWorld({trackLimit:3,horseCount:90});
 assert.equal(career.world.manifest.generatedHorses,90);
 assert.ok(career.world.entities.people.some(p=>p.role==='trainer'));
 assert.ok(career.world.entities.people.some(p=>p.role==='jockey'));
 assert.ok(career.world.calendar.summary.scheduledRaces>100);
 assert.ok(career.world.entities.horses.filter(h=>h.source==='GENERATED_FICTIONAL_1999')
  .every(h=>h.birthplace&&h.ratings&&h.sireId&&h.damId));
 assert.equal(career.run.world_ref.sha256,career.world.authority.sha256);
});

test('20,000-horse full 1999 opening world is populated across the entire active meet circuit',async()=>{
 const career=await create1999PopulatedTestWorld({horseCount:20000});
 const world=career.world;
 assert.equal(world.manifest.generatedHorses,20000);
 assert.ok(world.manifest.activeTracks>=90);
 assert.ok(world.entities.people.filter(p=>p.role==='trainer').length>=300);
 assert.ok(world.entities.people.filter(p=>p.role==='jockey').length>=250);
 assert.ok(world.calendar.summary.raceDays>=3000);
 assert.equal(world.calendar.unprogrammedTrackIds.length,0);
 assert.equal(new Set(world.entities.horses.map(h=>h.id)).size,world.entities.horses.length);
 const racehorses=world.entities.horses.filter(h=>h.source==='GENERATED_FICTIONAL_1999');
 assert.equal(racehorses.length,20000);
 assert.ok(racehorses.every(h=>h.racingStatus1999==='IN_TRAINING'&&
  h.age_at_opening>=3&&h.age_at_opening<=7));
 const distribution=new Map();
 for(const h of racehorses)
  distribution.set(h.homeTrackId,(distribution.get(h.homeTrackId)||0)+1);
 assert.equal(distribution.size,world.manifest.activeTracks);
 assert.ok([...distribution.values()].every(n=>n>=100));
 assert.ok(world.calendar.cards.every(c=>c.races.length>0&&
  c.races.every(r=>r.purse_minor>0&&r.distance_furlongs>0)));
 assert.ok(world.entities.horses.filter(h=>h.source==='GENERATED_FICTIONAL_1999')
  .every(h=>h.birthplace?.country&&h.ratings&&h.ownerId&&h.trainerId));
 assert.equal(career.run.world_ref.sha256,world.authority.sha256);
},{timeout:120000});
