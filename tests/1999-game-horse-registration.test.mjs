import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD_SCHEMA,createGameRun,dispatchGameCommand,exportGameSave,importGameSave,getStableView,getRegisteredHorseDirectory} from '../src/game/index.js';

function world(){return {
 schema:WORLD_SCHEMA,authority:{snapshot_id:'WTW-CLEAN-TEST',source:'TEST ONLY',sha256:'a'.repeat(64)},
 start_date:'1999-01-01',entities:{
  horses:[{id:'H-FOUNDING-SIRE',name:'Historical Champion'}],
  people:[{id:'P-TRAINER-A',name:'Approved Trainer'}],
  organizations:[{id:'O-OWNER-A',name:'Approved Owner'},{id:'O-BREEDER-A',name:'Approved Breeder'}],
  tracks:[{id:'T-TRACK-A',name:'Approved Track'}]
 }}}
const run=w=>createGameRun({world:w,runId:'WTW-RUN-HORSETEST',seed:1999,
 player:{role:'owner',involvement:'balanced',operation_id:'O-OWNER-A'}});
const dispatch=(s,w,id,type,payload,actor='system')=>dispatchGameCommand({state:s,world:w,command:{id,type,payload,actor}});
const accepted={
 release_id:'NAME-RELEASE-TEST-1',status:'ACCEPTED',
 candidates:[{candidate_id:'CAND-1',name:'Fresh January Runner',status:'ACCEPTED'}],
 reserved_names:{version:'RESERVED-TEST-1',names:['Historical Champion','Reserved Racing Name']}
};
const horse={
 horse_id:'H-GAME-1999-0001',registration_receipt_id:'REG-TEST-1',
 name_candidate_id:'CAND-1',registered_name:'Fresh January Runner',sex:'COLT',
 foaling_year:1996,birth_date:'1996-04-16',
 owner_organization_id:'O-OWNER-A',breeder_organization_id:'O-BREEDER-A',
 sire_id:null,dam_id:null,foaling_location_id:'LOC-TEST-KENTUCKY',
 current_residence_id:'F-RUN-FAC-OFFER-TEST',racing_barn_id:'F-RUN-FAC-OFFER-TEST',
 trainer_id:'P-TRAINER-A',status:'IN_TRAINING'
};
const payload=(changes={},release=accepted)=>({horse:{...horse,...changes},naming_release:release});
function staffed(s){
 s.runtime.facilities.offers['FAC-OFFER-TEST']={id:'FAC-OFFER-TEST',type:'RACING_STABLE',acquired_by:'O-OWNER-A'};
 s.runtime.facilities.sites['F-RUN-FAC-OFFER-TEST']={
  id:'F-RUN-FAC-OFFER-TEST',offer_id:'FAC-OFFER-TEST',owner_id:'O-OWNER-A',
  type:'RACING_STABLE',status:'ACTIVE',open_date:'1999-01-01',
  stalls:2,max_stalls:2,quality:70,staff_required:1,staff_count:1,
  contracts:[],maintenance_policy:'STANDARD'
 };
 return s;
}
test('clean founding career stays empty until an accepted registration command',()=>{
 const w=world(),s=run(w);
 assert.equal(getRegisteredHorseDirectory(s,w).length,0);
 assert.equal(getStableView(s,w).length,0);
 assert.equal(Object.keys(s.runtime.facilities.sites).length,0);
 assert.equal(w.entities.horses.length,1);
 assert.throws(()=>dispatch(s,w,'reg:no-home','REGISTER_GAME_HORSE',payload()),e=>e.code==='UNREGISTERED_BARN');
 assert.equal(getRegisteredHorseDirectory(s,w).length,0);
});
test('accepted 3yo registration has stable ID, immutable canon and idempotent journal receipt',()=>{
 const w=world(),initial=staffed(run(w)),before=JSON.stringify(w);
 const commandId='reg:first';
 const once=dispatch(initial,w,commandId,'REGISTER_GAME_HORSE',payload());
 const s=once.state;
 assert.equal(getRegisteredHorseDirectory(s,w).length,1);
 assert.equal(getStableView(s,w)[0].id,horse.horse_id);
 assert.equal(getStableView(s,w)[0].current_owner_id,'O-OWNER-A');
 assert.equal(getRegisteredHorseDirectory(s,w)[0].racing_age_1999,3);
 assert.equal(JSON.stringify(w),before);
 assert.equal(once.events[0].kind,'GAME_HORSE_REGISTERED');
 const replay=dispatch(s,w,commandId,'REGISTER_GAME_HORSE',payload());
 assert.equal(replay.duplicate,true);
 assert.strictEqual(replay.state,s);
 assert.deepEqual(importGameSave(exportGameSave(s,w),w),s);
 assert.equal(getRegisteredHorseDirectory(run(w),w).length,0,'new career must be empty');
 assert.throws(()=>dispatch(s,w,'reg:again','REGISTER_GAME_HORSE',payload()),e=>e.code==='DUPLICATE_HORSE_ID');
});
test('reject unauthorized actors, unaccepted names, collisions and youngstock',()=>{
 const w=world(),s=staffed(run(w));
 const before=JSON.stringify(s);
 assert.throws(()=>dispatch(s,w,'reg:player','REGISTER_GAME_HORSE',payload(),'player'),e=>e.code==='UNAUTHORIZED_COMMAND');
 assert.throws(()=>dispatch(s,w,'reg:unknown','REGISTER_GAME_HORSE',payload({registered_name:'Unreleased Name'})),e=>e.code==='UNACCEPTED_HORSE_NAME');
 assert.throws(()=>dispatch(s,w,'reg:young','REGISTER_GAME_HORSE',payload({foaling_year:1997,birth_date:'1997-05-01'})),e=>e.code==='HORSE_AGE');
 assert.throws(()=>dispatch(s,w,'reg:lineage','REGISTER_GAME_HORSE',payload({sire_id:'H-FOUNDING-SIRE'})),e=>e.code==='LINEAGE_NOT_RELEASED');
 assert.throws(()=>dispatch(s,w,'reg:reserved','REGISTER_GAME_HORSE',
  payload({registered_name:'Historical Champion'},{
   ...accepted,candidates:[{candidate_id:'CAND-1',name:'Historical Champion',status:'ACCEPTED'}]
  })),e=>e.code==='DUPLICATE_HORSE_NAME');
 assert.equal(JSON.stringify(s),before,'rejected commands must not mutate original state');
});
