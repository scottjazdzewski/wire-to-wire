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
