import test from 'node:test';
import assert from 'node:assert/strict';
import {createHorseNamingRuntime,buildGameHorseNamingBrief} from '../src/game/horse-naming-bridge.js';
import {stageStoryHorseNameAction,ownerDecidesHorseNameAction,
 makeOwnerApprovedHorseNamingRelease,validateOwnerApprovalInRelease,
 validateHorseNameCandidates,HORSE_NAME_OWNER_RELEASE_SCHEMA} from '../src/game/horse-name-owner-release.js';

const world={entities:{horses:[{id:'H-CANON',name:'Historical Champion'}],people:[],tracks:[],
 organizations:[{id:'O-W',name:'Harrowgate Farm'},{id:'O-B',name:'Bluebird Breeding'},{id:'O-OTHER',name:'Other Stable'}]}};
const horse={horse_id:'H-GAME-1999-000100',foaling_year:1996,owner_organization_id:'O-W',breeder_organization_id:'O-B',foaling_location_id:'KY-1',sire_id:null,dam_id:null};
const story='The night the foal arrived, a power outage left the stable silent and the owner found the mare by the sound of her breathing.';
const idea={name:'Breath in Dark',evidenceId:'OWNER_STORY:OWNER-001',evidenceQuote:'by the sound of her breathing',
 explanation:'The mare was found in the dark by her breathing; the name preserves a specific moment from the foaling.'};
const editor={editor_id:'EDITOR-LLM-2',verdict:'SEND_TO_OWNER',notes:'Tied clearly to the one verified event, avoids a templated construction.'};
function make(){let e=[];let rt=createHorseNamingRuntime();rt.stories_by_id['OWNER-001']={story_id:'OWNER-001',horse_id:horse.horse_id,owner_id:'O-W',breeder_id:'O-B',foaling_year:1996,attested_by:'OWNER',story,date:'1999-01-01'};
return {state:{clock:{date:'1999-01-01'},player:{role:'owner',operation_id:'O-W'},runtime:{horse_naming:rt,registered_horses:{by_id:{}}},event_log:[]},e};}
const command={type:'STAGE_STORY_HORSE_NAME',actor:'system',payload:{horse,idea,editor,candidate_id:'NAME-CAND-001'}};
const apply=(state,command)=>{const ev=[];const emit=(kind,payload)=>ev.push({kind,payload}); if(command.type==='STAGE_STORY_HORSE_NAME')stageStoryHorseNameAction({state,world,command,emit});else ownerDecidesHorseNameAction({state,world,command,emit});return ev;};

test('owner stage requires actual attested story and distinct independent editor',()=>{
 const {state}=make();const event=apply(state,command);
 assert.equal(event[0].kind,'HORSE_NAME_STAGED_FOR_OWNER');
 assert.equal(state.runtime.horse_naming.candidates_by_id['NAME-CAND-001'].status,'PENDING_OWNER_REVIEW');
 validateHorseNameCandidates(state,world);
 assert.equal(buildGameHorseNamingBrief({world,state,horse}).status,'READY_FOR_ORIGINAL_NAME_WRITING');
});
test('unauthorized actor cannot stage name, nor a self-editing model',()=>{
 const {state}=make();assert.throws(()=>apply(state,{...command,actor:'player'}),e=>e.code==='NAME_STAGE_AUTH');
 assert.throws(()=>apply(state,{...command,payload:{...command.payload,editor:{...editor,editor_id:'CLOUDFLARE_WORKERS_AI_CREATOR_V1'}}}),e=>e.code==='NAMING_INDEPENDENCE');
});
test('stage refuses previously rated, protected, or made-up story names',()=>{
 const {state}=make();
 for(const testName of ['Midnight Rambler','Historical Champion'])assert.throws(()=>apply(state,{...command,payload:{...command.payload,idea:{...idea,name:testName}}}),e=>e.code==='NAME_STAGE_SCREEN');
 assert.throws(()=>apply(state,{...command,payload:{...command.payload,idea:{...idea,evidenceQuote:'complete fiction not present'}}}),e=>e.code==='NAME_STAGE_SCREEN');
 assert.equal(Object.keys(state.runtime.horse_naming.candidates_by_id).length,0);
});
test('no release exists until explicit player-owner acceptance',()=>{
 const {state}=make();apply(state,command);
 assert.throws(()=>makeOwnerApprovedHorseNamingRelease({state,world,horse_id:horse.horse_id,candidate_id:'NAME-CAND-001',release_id:'NAME-RELEASE-001'}),e=>e.code==='NAME_RELEASE_NOT_APPROVED');
});
test('owner approves and pure release references actual saved decision',()=>{
 const {state}=make();apply(state,command);
 apply(state,{type:'OWNER_ACCEPT_STORY_HORSE_NAME',actor:'player',payload:{candidate_id:'NAME-CAND-001'}});
 validateHorseNameCandidates(state,world);
 const release=makeOwnerApprovedHorseNamingRelease({state,world,horse_id:horse.horse_id,candidate_id:'NAME-CAND-001',release_id:'NAME-RELEASE-001'});
 assert.equal(release.schema,HORSE_NAME_OWNER_RELEASE_SCHEMA);
 assert.equal(release.candidates[0].name,'Breath in Dark');
 assert.equal(release.candidates[0].status,'ACCEPTED');
 validateOwnerApprovalInRelease({state,horse:{...horse,registered_name:idea.name},release,candidate:release.candidates[0]});
 assert.throws(()=>validateOwnerApprovalInRelease({state,horse:{...horse,registered_name:'Forgery'},release,candidate:release.candidates[0]}),e=>e.code==='NAME_RELEASE_PROOF');
 assert.throws(()=>makeOwnerApprovedHorseNamingRelease({state,world,horse_id:horse.horse_id,candidate_id:'NAME-CAND-001',release_id:'NAME-RELEASE-001',reserved_names:['Breath in Dark']}),e=>e.code==='NAME_RELEASE_COLLISION');
});
test('owner reject cannot make accepted release',()=>{
 const {state}=make();apply(state,command);
 apply(state,{type:'OWNER_REJECT_STORY_HORSE_NAME',actor:'player',payload:{candidate_id:'NAME-CAND-001'}});
 assert.equal(state.runtime.horse_naming.candidates_by_id['NAME-CAND-001'].status,'OWNER_REJECTED');
 assert.throws(()=>makeOwnerApprovedHorseNamingRelease({state,world,horse_id:horse.horse_id,candidate_id:'NAME-CAND-001',release_id:'NAME-RELEASE-001'}),e=>e.code==='NAME_RELEASE_NOT_APPROVED');
});
test('other owner cannot accept horse name',()=>{
 const {state}=make();apply(state,command);state.player.operation_id='O-OTHER';
 assert.throws(()=>apply(state,{type:'OWNER_ACCEPT_STORY_HORSE_NAME',actor:'player',payload:{candidate_id:'NAME-CAND-001'}}),e=>e.code==='NAME_OWNER_MISMATCH');
});
test('same name cannot be staged twice even under different IDs',()=>{
 const {state}=make();apply(state,command);
 assert.throws(()=>apply(state,{...command,payload:{...command.payload,candidate_id:'NAME-CAND-002'}}),e=>e.code==='NAME_STAGE_SCREEN');
});
test('approval proof cannot be fabricated or moved to another horse',()=>{
 const {state}=make();apply(state,command);
 apply(state,{type:'OWNER_ACCEPT_STORY_HORSE_NAME',actor:'player',payload:{candidate_id:'NAME-CAND-001'}});
 const r=makeOwnerApprovedHorseNamingRelease({state,world,horse_id:horse.horse_id,candidate_id:'NAME-CAND-001',release_id:'NAME-RELEASE-001'});
 assert.throws(()=>validateOwnerApprovalInRelease({state,horse:{...horse,registered_name:idea.name},release:r,candidate:{...r.candidates[0],approval_proof:{...r.candidates[0].approval_proof,approved_date:'1997-01-01'}}}),e=>e.code==='NAME_RELEASE_PROOF');
});