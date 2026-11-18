import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD_SCHEMA,createGameRun,dispatchGameCommand,exportGameSave,importGameSave,
 makeOwnerApprovedHorseNamingRelease,buildGameHorseNamingBrief,getRegisteredHorseDirectory}
 from '../src/game/index.js';

const world={schema:WORLD_SCHEMA,
 authority:{snapshot_id:'WTW-OWNER-NAME-E2E',source:'TEST ONLY',sha256:'a'.repeat(64)},
 start_date:'1999-01-01',entities:{
 horses:[{id:'H-CANON',name:'Historical Champion'}],
 people:[{id:'P-TRAINER',name:'Approved Trainer'}],
 organizations:[{id:'O-OWNER',name:'Approved Racing Owner'},
  {id:'O-BREEDER',name:'Approved Farm'},{id:'O-OTHER',name:'Other Racing Owner'}],
 tracks:[{id:'T-A',name:'Approved Track'}]}}
const namingHorse={horse_id:'H-GAME-1999-TEST001',foaling_year:1996,
 owner_organization_id:'O-OWNER',breeder_organization_id:'O-BREEDER',
 sire_id:null,dam_id:null,foaling_location_id:'LOC-TEST-KENTUCKY'};
const name='Breath in Dark';
const story='The foal was born on the night the lights failed during a summer storm, and the owner found the mare by the sound of her breathing.';
const idea={name,evidenceId:'OWNER_STORY:FOAL-ORIGIN-100',
 evidenceQuote:'by the sound of her breathing',
 explanation:'The owner found the mare through her breathing in the dark when the power failed on foaling night.'};
const editor={editor_id:'INDEPENDENT-EDITOR-TEST',verdict:'SEND_TO_OWNER',
 notes:'Distinctly tied to the real owner memory, not a generic racehorse phrase.'};
const candidate_id='NAME-CAND-0001';
const run=()=>createGameRun({world,runId:'WTW-RUN-OWNER-NAMING-TEST',seed:1999,
 player:{role:'owner',involvement:'balanced',operation_id:'O-OWNER'}});
const send=(state,id,type,payload,actor='system')=>dispatchGameCommand({world,state,
 command:{id,type,payload,actor}});
function staffed(state){
 state.runtime.facilities.offers['FAC-OFFER-TEST']={id:'FAC-OFFER-TEST',type:'RACING_STABLE',acquired_by:'O-OWNER'};
 state.runtime.facilities.sites['F-RUN-FAC-OFFER-TEST']={
  id:'F-RUN-FAC-OFFER-TEST',offer_id:'FAC-OFFER-TEST',owner_id:'O-OWNER',
  type:'RACING_STABLE',status:'ACTIVE',open_date:'1999-01-01',
  stalls:2,max_stalls:2,quality:70,staff_required:1,staff_count:1,
  contracts:[],maintenance_policy:'STANDARD'};
 return state;
}
const horseRegistration={...namingHorse,
 registration_receipt_id:'REG-APPROVED-001',name_candidate_id:candidate_id,
 registered_name:name,sex:'COLT',birth_date:'1996-04-16',
 current_residence_id:'F-RUN-FAC-OFFER-TEST',racing_barn_id:'F-RUN-FAC-OFFER-TEST',
 trainer_id:'P-TRAINER',status:'IN_TRAINING'};
function staging(){
 let s=staffed(run());
 s=send(s,'naming:origin-001','RECORD_HORSE_NAMING_STORY',{
  horse:namingHorse,story_id:'FOAL-ORIGIN-100',story},'player').state;
 assert.equal(buildGameHorseNamingBrief({world,state:s,horse:namingHorse}).status,'READY_FOR_ORIGINAL_NAME_WRITING');
 s=send(s,'naming:stage-001','STAGE_STORY_HORSE_NAME',{
  horse:namingHorse,idea,editor,candidate_id}).state;
 return s;
}

test('actual owner command -> editorial review -> approved release -> registry -> save restored',()=>{
 const canon=JSON.stringify(world),pending=staging();
 assert.equal(getRegisteredHorseDirectory(pending,world).length,0);
 assert.throws(()=>makeOwnerApprovedHorseNamingRelease({world,state:pending,
  horse_id:namingHorse.horse_id,candidate_id,release_id:'NAME-RELEASE-001'}),
  e=>e.code==='NAME_RELEASE_NOT_APPROVED');
 const s=send(pending,'naming:owner-accept-001','OWNER_ACCEPT_STORY_HORSE_NAME',
  {candidate_id},'player').state;
 const release=makeOwnerApprovedHorseNamingRelease({world,state:s,
  horse_id:namingHorse.horse_id,candidate_id,release_id:'NAME-RELEASE-001'});
 const registration=send(s,'naming:registration-001','REGISTER_GAME_HORSE',{
  horse:horseRegistration,naming_release:release});
 const completed=registration.state;
 assert.equal(registration.events[0].kind,'GAME_HORSE_REGISTERED');
 assert.equal(getRegisteredHorseDirectory(completed,world)[0].registered_name,name);
 assert.equal(getRegisteredHorseDirectory(completed,world)[0].naming.candidate_id,candidate_id);
 assert.deepEqual(importGameSave(exportGameSave(completed,world),world),completed);
 assert.equal(JSON.stringify(world),canon);
 const replay=send(completed,'naming:registration-001','REGISTER_GAME_HORSE',{
  horse:horseRegistration,naming_release:release});
 assert.equal(replay.duplicate,true);
});
test('approved name cannot be registered with a forged release or substituted candidate',()=>{
 const pending=staging(),s=send(pending,'naming:owner-accept-001','OWNER_ACCEPT_STORY_HORSE_NAME',
  {candidate_id},'player').state;
 const release=makeOwnerApprovedHorseNamingRelease({world,state:s,
  horse_id:namingHorse.horse_id,candidate_id,release_id:'NAME-RELEASE-001'});
 assert.throws(()=>send(s,'naming:forged-001','REGISTER_GAME_HORSE',{
  horse:horseRegistration,naming_release:{...release,candidates:release.candidates.map(x=>({...x,approval_proof:{...x.approval_proof,owner_organization_id:'O-OTHER'}}))}}),
  e=>e.code==='NAME_RELEASE_PROOF');
 assert.throws(()=>send(s,'naming:legacy-bypass','REGISTER_GAME_HORSE',{
  horse:horseRegistration,naming_release:Object.fromEntries(Object.entries(release).filter(([k])=>k!=='schema'))}),
  e=>e.code==='NAME_OWNER_RELEASE_REQUIRED');
});
test('owner rejection cannot enter the horse registry',()=>{
 const pending=staging(),s=send(pending,'naming:reject-001','OWNER_REJECT_STORY_HORSE_NAME',
  {candidate_id},'player').state;
 assert.throws(()=>makeOwnerApprovedHorseNamingRelease({world,state:s,
  horse_id:namingHorse.horse_id,candidate_id,release_id:'NAME-RELEASE-001'}),
  e=>e.code==='NAME_RELEASE_NOT_APPROVED');
 assert.equal(getRegisteredHorseDirectory(s,world).length,0);
});