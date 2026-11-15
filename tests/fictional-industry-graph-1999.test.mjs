import test from 'node:test';
import assert from 'node:assert/strict';
import {rate1999Entity,connect1999Horse,connect1999Person,
 connect1999DirectoryEntity,validate1999GraphBatch}
 from '../public/1999/engine/fictional-industry-graph-1999.mjs';
test('every supported world entity has bounded reproducible ratings',()=>{
 for(const [type,id] of [['horse','H-1'],['trainer','P-1'],['jockey','P-2'],
  ['owner','O-1'],['farm','O-2'],['track','T-1'],['groom','P-3'],
  ['exercise_rider','P-4'],['veterinarian','P-5'],['farrier','P-6'],
  ['farm_manager','P-7'],['breeding_attendant','P-8']]){
  const a=rate1999Entity(19990101,type,id);
  assert.deepEqual(a,rate1999Entity(19990101,type,id));
  assert.ok(Object.keys(a).length>=3);
  assert.ok(Object.values(a).every(v=>v>=15&&v<=95));
 }
});
test('horse graph connects pedigree, owner, farm, trainer and jockey by IDs',()=>{
 const horse=connect1999Horse({id:'H-1',status:'RACING',ownerId:'O-1',
  foalingFarmId:'O-2',sireId:'H-SIRE',damId:'H-DAM',homeTrackId:'T-1'},
 {seed:19990101,trainerCount:100,jockeyCount:50});
 const targets=new Set(['H-1','O-1','O-2','H-SIRE','H-DAM','T-1',
  horse.trainerId,horse.jockeyId]);
 assert.equal(validate1999GraphBatch([horse],targets).valid,true);
 assert.equal(horse.relationships.length,7);
 assert.equal(horse.ratingsProvenance,'MODELED_1999_UNCALIBRATED');
 assert.equal(validate1999GraphBatch([horse],new Set(['H-1'])).valid,false);
});
test('person and directory entities have typed edges and modeled ratings',()=>{
 const person=connect1999Person({id:'P-1',role:'trainer',workplaceId:'T-1'},
  {seed:19990101});
 const owner=connect1999DirectoryEntity({id:'O-1'},{seed:19990101,
  type:'owner',homeTrackId:'T-1'});
 assert.equal(validate1999GraphBatch([person,owner],
  new Set(['P-1','O-1','T-1'])).valid,true);
});
