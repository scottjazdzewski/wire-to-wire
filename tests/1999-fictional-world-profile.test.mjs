import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeFictionalWorldProfile,fictionalWorldPreset,
 MAX_FICTIONAL_WORLD_ACTIVE_HORSES} from '../public/1999/engine/fictional-world-profile-1999.mjs';

const tracks=Array.from({length:107},(_,i)=>({id:'T-'+String(i+1).padStart(4,'0'),playableIn1999:true}));

test('1999 world presets scale from quick through the complete 107-track network',()=>{
 const quick=fictionalWorldPreset('QUICK',tracks);
 const regional=fictionalWorldPreset('REGIONAL',tracks);
 const full=fictionalWorldPreset('FULL',tracks);
 assert.deepEqual([quick.trackCount,regional.trackCount,full.trackCount],[12,48,107]);
 assert.equal(full.activeHorses,3083);
 assert.ok(full.counts.trainers>300&&full.counts.grooms>1000);
 assert.ok(full.resourceEstimate.projectedWorldEntities>full.activeHorses);
});

test('custom 1999 worlds retain selected permanent track IDs and user-set horse count',()=>{
 const selected=tracks.slice(0,24).map(track=>track.id);
 const world=normalizeFictionalWorldProfile({preset:'CUSTOM',trackIds:selected,
  activeHorses:500,seed:99199},tracks);
 assert.equal(world.trackCount,24);
 assert.equal(world.activeHorses,500);
 assert.deepEqual(world.selectedTrackIds,selected);
 assert.equal(world.seed,99199);
});

test('world-size guardrails reject impossible or duplicate custom configurations',()=>{
 assert.equal(MAX_FICTIONAL_WORLD_ACTIVE_HORSES,5000);
 assert.throws(()=>normalizeFictionalWorldProfile({trackCount:108},tracks),/racecourses/);
 assert.throws(()=>normalizeFictionalWorldProfile({trackCount:2,activeHorses:7},tracks),/between 40 and/);
 assert.throws(()=>normalizeFictionalWorldProfile({trackIds:['T-0001','T-0001']},tracks),/unique IDs/);
});
