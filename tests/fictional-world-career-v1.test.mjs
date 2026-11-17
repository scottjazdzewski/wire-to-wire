import test from 'node:test';
import assert from 'node:assert/strict';
import {createFictional1999GameRun} from '../public/1999/engine/fictional-world-career-v1.mjs';
import {validateGameRun} from '../public/1999/game/state.js';
test('full 1999 industry enters the canonical game run with editable names',async()=>{
 const career=await createFictional1999GameRun({
  seed:19990101,worldId:'CareerBridgeTest',
  tracks:[{id:'T-9001',name:'Test Racing Downs',trackOperating:'OPEN_1999'}],
  foundationHorses:[{id:'H-1980-0001',name:'Old Sire',sex:'HORSE',foalYear:1980},
   {id:'H-1981-0002',name:'Old Mare',sex:'MARE',foalYear:1981}],horseCount:24
 });
 assert.equal(career.world.manifest.generatedHorses,24);
 assert.equal(career.world.manifest.horseNaming,'PROVISIONAL_EDITABLE');
 assert.equal(validateGameRun(career.run,career.world),career.run);
 assert.equal(career.run.world_ref.sha256,career.world.authority.sha256);
 assert.ok(career.run.player.operation_id);
});
