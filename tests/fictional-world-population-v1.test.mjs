import test from 'node:test';
import assert from 'node:assert/strict';
import {assembleFictional1999Industry} from '../public/1999/engine/fictional-world-population-v1.mjs';
import {validateWorld} from '../public/1999/game/contracts.js';
import {createGameRun,validateGameRun} from '../public/1999/game/state.js';
import attributeCatalog from '../public/1999/engine/attribute-catalog.mjs';
const tracks=[
 {id:'T-1001',name:'Test Valley Downs',playableIn1999:true,trackOperating:'OPEN_1999'},
 {id:'T-1002',name:'Test Coastal Park',playableIn1999:true,trackOperating:'OPEN_1999'},
 {id:'T-1003',name:'Historic Test Park',playableIn1999:false,trackOperating:'HISTORICAL_ONLY'}
];
const foundation=[
 {id:'H-1980-0001',name:'Foundation Sire',sex:'HORSE',foalYear:1980},
 {id:'H-1981-0002',name:'Foundation Dam',sex:'MARE',foalYear:1981}
];
const make=seed=>assembleFictional1999Industry({seed,worldId:'WTWTestWorld',
 tracks,foundationHorses:foundation,horseNames:Array.from({length:32},(_,i)=>'Test Name '+String(i+1).padStart(2,'0'))});
test('1999 industry creates a real, linked snapshot from existing name/ratings engines',async()=>{
 const world=await make(19990101);
 assert.equal(validateWorld(world),world);
 assert.equal(world.manifest.generatedHorses,32);
 assert.equal(world.manifest.activeTracks,2);
 assert.equal(world.manifest.archivedTracks,1);
 assert.equal(world.entities.horses.length,34);
 assert.ok(world.entities.people.length>=12);
 assert.ok(world.entities.organizations.length>=20);
 const byId=new Map(world.entities.horses.map(h=>[h.id,h]));
 const org=new Set(world.entities.organizations.map(o=>o.id));
 const person=new Set(world.entities.people.map(p=>p.id));
 for(const h of world.entities.horses.slice(2)){
  assert.ok(byId.has(h.sireId)&&byId.has(h.damId));
  assert.ok(org.has(h.ownerId)&&org.has(h.breederId)&&org.has(h.stableId));
  assert.ok(person.has(h.trainerId));
  assert.ok(['T-1001','T-1002'].includes(h.homeTrackId));
  assert.ok(h.ratings.current_ability>=1&&h.ratings.potential_ability<=99);
  assert.match(h.birth_date,/^19\d\d-\d\d-\d\d$/);
 }
 for(const p of world.entities.people){
  assert.match(p.date_of_birth,/^\d{4}-\d\d-\d\d$/);
  assert.ok(p.birthplace.city&&p.birthplace.region&&p.birthplace.country_code);
  assert.ok(p.work_location);
 }
 const run=createGameRun({world,runId:'WTW-RUN-1999-INDUSTRY-TEST',seed:19990101,
  player:{role:'owner',involvement:'balanced',operation_id:world.entities.organizations[0].id},
  stableHorseIds:[world.entities.horses[2].id],personGenerationCatalog:attributeCatalog});
 assert.equal(Object.keys(run.runtime.people).length,world.entities.people.length);
 assert.equal(validateGameRun(run,world),run);
 assert.equal(JSON.parse(JSON.stringify(world)).authority.sha256,world.authority.sha256);
});
test('seed freezes identities and rejects missing, duplicate or unapproved horse names',async()=>{
 const a=await make(19990101),b=await make(19990101),c=await make(19990102);
 assert.deepEqual(a,b);
 assert.notEqual(a.authority.sha256,c.authority.sha256);
 await assert.rejects(assembleFictional1999Industry({tracks,foundationHorses:foundation,
  horseCount:2,horseNames:['Only One']}),/Exactly 2 accepted horse names/);
 await assert.rejects(assembleFictional1999Industry({tracks,foundationHorses:foundation,
  horseNames:['Same Name','Same Name']}),/Duplicate/);
});
