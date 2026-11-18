import test from 'node:test';
import assert from 'node:assert/strict';
import * as server from '../src/game/horse-name-owner-release.js';
import * as browser from '../public/1999/game/horse-name-owner-release.js';
import {createHorseNamingRuntime} from '../src/game/horse-naming-bridge.js';

const world={entities:{
 horses:[{id:'H-HIST',name:'Permanent Horse'}],people:[],tracks:[],
 organizations:[{id:'O-OWNER',name:'The Owner'},{id:'O-BREEDER',name:'Breeding Farm'}]
}};
const horse={horse_id:'H-GAME-1999-PARITY1',foaling_year:1996,
 owner_organization_id:'O-OWNER',breeder_organization_id:'O-BREEDER',
 sire_id:null,dam_id:null,foaling_location_id:'LOC-KY'};
const story='A foal arrived during a power outage, and the owner identified the mare by the steady sound of her breathing.';
const idea={name:'Breath in Dark',evidenceId:'OWNER_STORY:OWNER-PARITY',
 evidenceQuote:'by the steady sound of her breathing',
 explanation:'The owner recognized the mare in darkness by the sound of her breathing when the farm lights failed.'};
function make(){
 const rt=createHorseNamingRuntime();rt.stories_by_id['OWNER-PARITY']={
  story_id:'OWNER-PARITY',horse_id:horse.horse_id,owner_id:'O-OWNER',
  breeder_id:'O-BREEDER',foaling_year:1996,story,
  date:'1999-01-01',attested_by:'OWNER'
 };
 return {clock:{date:'1999-01-01'},player:{role:'owner',operation_id:'O-OWNER'},
 runtime:{horse_naming:rt,registered_horses:{by_id:{}}},event_log:[]};
}
const stage={type:'STAGE_STORY_HORSE_NAME',actor:'system',
 payload:{candidate_id:'PARITY-CAND-1',horse,idea,
  editor:{editor_id:'SECOND-MODEL',verdict:'SEND_TO_OWNER',
   notes:'Strong memorable association to the actual power outage.'}}};
test('browser and server approval commands and schema remain identical',()=>{
 assert.deepEqual(browser.HORSE_NAME_OWNER_COMMANDS,server.HORSE_NAME_OWNER_COMMANDS);
 assert.equal(browser.HORSE_NAME_OWNER_RELEASE_SCHEMA,server.HORSE_NAME_OWNER_RELEASE_SCHEMA);
});
test('browser and server produce exactly the same owner approval and release',()=>{
 const left=make(),right=make();
 server.stageStoryHorseNameAction({state:left,world,command:stage,emit:()=>{}});
 browser.stageStoryHorseNameAction({state:right,world,command:stage,emit:()=>{}});
 assert.deepEqual(left,right);
 const decision={type:'OWNER_ACCEPT_STORY_HORSE_NAME',actor:'player',
  payload:{candidate_id:'PARITY-CAND-1'}};
 server.ownerDecidesHorseNameAction({state:left,world,command:decision,emit:()=>{}});
 browser.ownerDecidesHorseNameAction({state:right,world,command:decision,emit:()=>{}});
 const args={world,horse_id:horse.horse_id,candidate_id:'PARITY-CAND-1',release_id:'RELEASE-PARITY-1'};
 const a=server.makeOwnerApprovedHorseNamingRelease({...args,state:left});
 const b=browser.makeOwnerApprovedHorseNamingRelease({...args,state:right});
 assert.deepEqual(a,b);
 assert.equal(a.candidates[0].name,idea.name);
});
