import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD_SCHEMA,createGameRun,dispatchGameCommand,exportGameSave,importGameSave} from '../src/game/index.js';
const world={
 schema:WORLD_SCHEMA,authority:{snapshot_id:'TEST-FOUNDING-TRACK-BARN',source:'GAME TEST FIXTURE',sha256:'a'.repeat(64)},
 start_date:'1999-01-01',entities:{
  horses:[],organizations:[{id:'O-OWNER',name:'Owner Partners'},{id:'O-OPERATOR',name:'Existing Racing Operation'}],
  people:[{id:'P-TRAINER',name:'Selected Trainer'},{id:'P-OTHER',name:'Other Trainer'}],
  tracks:[{id:'T-GP',name:'Gulfstream Park'}]
 }};
const newRun=()=>createGameRun({world,runId:'WTW-RUN-RESIDENCE',seed:1234,
 player:{role:'owner',involvement:'balanced',operation_id:'O-OWNER'}});
const execute=(state,id,type,payload,actor='system')=>dispatchGameCommand({
 state,world,command:{id,type,payload,actor}
}).state;
const funds=(s,id)=>execute(s,'funds:'+id,'FACILITY_SEED_FUNDS',{
 operation_id:id,balance_minor:30000000,source_ref:'1999_TEST_PROVISION_ONLY',source_kind:'SIMULATED_TEST'});
const site=(kind,id)=>({
 site_id:id,operator_organization_id:'O-OPERATOR',facility_owner_organization_id:'O-OPERATOR',
 site_type:'RACING_STABLE',residence_kind:kind,name:'Existing Operation Racing Site',
 location:{city:'Hallandale Beach',state:'Florida',country:'USA'},
 host_track_id:kind==='TRACK_TRAINER_BARN'?'T-GP':null,
 head_trainer_person_id:kind==='TRACK_TRAINER_BARN'?'P-TRAINER':null,
 stalls_total:4,staff_required:1,staff_present:1,quality:75,
 daily_upkeep_minor:10000,daily_boarding_minor:2500,staff_wage_daily_minor:5000,
 track_rent_daily_minor:kind==='TRACK_TRAINER_BARN'?3000:0,
 source_ref:'1999_TEST_SITE_FIXTURE',source_kind:'MODELED_1999_GAME_SITE'
});
const nameRelease={
 release_id:'RELEASE-TEST',status:'ACCEPTED',
 reserved_names:{version:'R1',names:[]},
 candidates:[{candidate_id:'C1',name:'January Proof',status:'ACCEPTED'}]
};
const horse=(siteId,trainer='P-TRAINER')=>({
 horse_id:'H-GAME-1999-TEST1',registration_receipt_id:'RECEIPT-TEST1',
 name_candidate_id:'C1',registered_name:'January Proof',sex:'COLT',
 foaling_year:1996,birth_date:'1996-05-01',
 breeder_organization_id:'O-OPERATOR',owner_organization_id:'O-OWNER',
 foaling_location_id:'LOC-FL-TEST',sire_id:null,dam_id:null,
 current_residence_id:siteId,racing_barn_id:siteId,trainer_id:trainer,status:'IN_TRAINING'
});
test('existing racing organizations can operate distinct on-site or trainer track facilities without a new O-ID',()=>{
 let s=funds(newRun(),'O-OPERATOR');
 s=execute(s,'site:home','FACILITY_REGISTER_RACING_SITE',
  site('ORGANIZATION_HOME_SITE','F-1999-HOME'));
 s=execute(s,'site:track','FACILITY_REGISTER_RACING_SITE',
  site('TRACK_TRAINER_BARN','F-1999-TRACK'));
 assert.equal(Object.keys(s.runtime.facilities.sites).length,2);
 assert.equal(s.runtime.facilities.sites['F-1999-HOME'].host_track_id,null);
 assert.equal(s.runtime.facilities.sites['F-1999-TRACK'].host_track_id,'T-GP');
 assert.equal(s.runtime.facilities.sites['F-1999-TRACK'].operator_organization_id,'O-OPERATOR');
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});
test('owner may board at an unrelated trainer track barn using actual trainer and F-ID',()=>{
 let s=funds(newRun(),'O-OPERATOR');
 s=execute(s,'site:track','FACILITY_REGISTER_RACING_SITE',
  site('TRACK_TRAINER_BARN','F-1999-TRACK'));
 const original=JSON.stringify(s);
 assert.throws(()=>execute(s,'horse:wrong','REGISTER_GAME_HORSE',{
  horse:horse('F-1999-TRACK','P-OTHER'),naming_release:nameRelease
 }),e=>e.code==='TRAINER_BARN_MISMATCH');
 assert.equal(JSON.stringify(s),original);
 s=execute(s,'horse:valid','REGISTER_GAME_HORSE',{
  horse:horse('F-1999-TRACK'),naming_release:nameRelease
 });
 const h=s.runtime.registered_horses.by_id['H-GAME-1999-TEST1'];
 assert.equal(h.owner_organization_id,'O-OWNER');
 assert.equal(h.trainer_id,'P-TRAINER');
 assert.equal(h.current_residence_id,'F-1999-TRACK');
 assert.equal(h.host_track_id,'T-GP');
 assert.equal(h.residence_kind,'TRACK_TRAINER_BARN');
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});
test('site registration never invents finance account, property identity or track',()=>{
 const s=newRun();
 assert.throws(()=>execute(s,'site:unfunded','FACILITY_REGISTER_RACING_SITE',
  site('ORGANIZATION_HOME_SITE','F-1999-HOME')),e=>e.code==='FACILITY_NO_FUNDS');
 const seeded=funds(s,'O-OPERATOR');
 assert.throws(()=>execute(seeded,'site:badtrack','FACILITY_REGISTER_RACING_SITE',
  {...site('TRACK_TRAINER_BARN','F-1999-TRACK'),host_track_id:'T-UNKNOWN'}),
  e=>e.code==='FACILITY_TRACK');
 assert.equal(Object.keys(s.runtime.facilities.sites).length,0);
});
