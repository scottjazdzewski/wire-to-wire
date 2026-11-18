import test from 'node:test';
import assert from 'node:assert/strict';
import {rate1999Entity,connect1999Horse,connect1999Person,
 connect1999DirectoryEntity,validate1999GraphBatch,
 validate1999IndustryReferences}
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
test('horse graph connects pedigree, owner, care facility, training circuit and staff by IDs',()=>{
 const horse=connect1999Horse({id:'H-1',status:'RACING',ownerId:'O-1',
  foalingFarmId:'O-2',sireId:'H-SIRE',damId:'H-DAM',homeTrackId:'T-1'},
 {seed:19990101,trainerCount:100,jockeyCount:50});
 const targets=new Set(['H-1','O-1','O-2','H-SIRE','H-DAM','T-1',
  horse.trainerId,horse.jockeyId]);
 assert.equal(validate1999GraphBatch([horse],targets).valid,true);
 assert.equal(horse.relationships.length,9);
 assert.equal(horse.careFacilityId,'O-2');
 assert.equal(horse.trainingBarnId,'T-1');
 assert.equal(horse.ratingsProvenance,'MODELED_1999_UNCALIBRATED');
 assert.equal(validate1999GraphBatch([horse],new Set(['H-1'])).valid,false);
});
test('physical care staff is selected deterministically from farm assignments',()=>{
 const staffByFarm=new Map([['O-2',{breeding_attendant:['P-CARE-1']}],
  ['*',{farm_manager:['P-MANAGER-1']}]]);
 const horse=connect1999Horse({id:'H-2',status:'BROODMARE',ownerId:'O-1',
  foalingFarmId:'O-2'},{seed:19990101,staffByFarm});
 assert.equal(horse.careFacilityId,'O-2');
 assert.ok(['P-CARE-1','P-MANAGER-1'].includes(horse.careStaffId));
 assert.ok(horse.relationships.some(edge=>edge.type==='CARED_AT'&&edge.toId==='O-2'));
 assert.ok(horse.relationships.some(edge=>edge.type==='CARED_BY'&&edge.toId===horse.careStaffId));
 assert.equal(horse.trainerId,null);
});
test('person and directory entities have typed edges and modeled ratings',()=>{
 const person=connect1999Person({id:'P-1',role:'trainer',workplaceId:'T-1'},
  {seed:19990101});
 const owner=connect1999DirectoryEntity({id:'O-1'},{seed:19990101,
  type:'owner',homeTrackId:'T-1'});
 assert.equal(validate1999GraphBatch([person,owner],
  new Set(['P-1','O-1','T-1'])).valid,true);
});

test('worldwide census audit resolves cross-batch parents and staff and rejects bad IDs',()=>{
 const census={plan:{counts:{broodmares:2,stallions:2,yearlings:1,
  twoYearOldProspects:1,threeYearOldRunners:1,fourYearOldRunners:1,
  fivePlusRunners:1}},
  staffing:{counts:{trainer:2,jockey:2,groom:1}},
  tracks:[{id:'T-1'}],farms:[{id:'O-F-1'}],owners:[{id:'O-O-1'}]};
 const h=connect1999Horse({id:'H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000001',
  status:'RACING',cohort:'threeYearOldRunners',foalYear:1996,
  birthplace:{farmId:'O-F-1'},ownerId:'O-O-1',breederId:'O-F-1',foalingFarmId:'O-F-1',
  sireId:'H-FICTIONAL-1999-STALLIONS-0000002',
  damId:'H-FICTIONAL-1999-BROODMARES-0000002',
  homeTrackId:'T-1'},{seed:19990101,trainerCount:2,jockeyCount:2});
 assert.equal(validate1999IndustryReferences([h],census).valid,true);
 const broken={...h,relationships:[...h.relationships,
  {type:'OWNED_BY',fromId:h.id,toId:'O-NOT-REGISTERED'}]};
 const audit=validate1999IndustryReferences([broken],census);
 assert.equal(audit.valid,false);
 assert.ok(audit.problems.some(p=>p.reason==='BROKEN_REFERENCE'));
});

test('world audit rejects impossible opening ages and mismatched foaling farms',()=>{
 const census={plan:{counts:{broodmares:1,stallions:1,yearlings:1,
  twoYearOldProspects:1,threeYearOldRunners:1,fourYearOldRunners:1,
  fivePlusRunners:1}},staffing:{counts:{trainer:1,jockey:1}},
  tracks:[{id:'T-1'}],farms:[{id:'O-F-1'}],owners:[{id:'O-O-1'}]};
 const h=connect1999Horse({id:'H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000001',
  cohort:'threeYearOldRunners',foalYear:1997,status:'RACING',
  ownerId:'O-O-1',foalingFarmId:'O-F-1',birthplace:{farmId:'O-WRONG'},
  homeTrackId:'T-1'},{seed:19990101,trainerCount:1,jockeyCount:1});
 const reasons=validate1999IndustryReferences([h],census).problems.map(x=>x.reason);
 assert.ok(reasons.includes('INVALID_FOAL_YEAR'));
 assert.ok(reasons.includes('BIRTHPLACE_FARM_MISMATCH'));
});
