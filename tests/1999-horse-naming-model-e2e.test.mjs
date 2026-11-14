import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD_SCHEMA,createGameRun,dispatchGameCommand,
 exportGameSave,importGameSave,buildGameHorseNamingBrief,
 writeStoryFirstHorseNames,recordGameNameEditorialDecision}
 from '../src/game/index.js';
import {buildStoryFirstWritingRequest as browserCreativeBrief,
 screenStoryFirstIdeas as browserScreen} from '../public/1999/game/horse-naming-model-creator.js';

const world={schema:WORLD_SCHEMA,
 authority:{snapshot_id:'WTW-STORY-FIRST-1999-TEST',source:'TEST ONLY',sha256:'c'.repeat(64)},
 start_date:'1999-01-01',entities:{
  horses:[{id:'H-HISTORY',name:'Protected History'}],people:[],
  organizations:[{id:'O-OWNER',name:'Harrowgate Farm'},
   {id:'O-BREEDER',name:'Blue Ribbon Breeding'}],tracks:[{id:'T-TEST',name:'Test Course'}]
 }};
const horse={horse_id:'H-GAME-1999-TESTCREATOR',foaling_year:1996,
 owner_organization_id:'O-OWNER',breeder_organization_id:'O-BREEDER',
 sire_id:null,dam_id:null,foaling_location_id:'LOC-KY-1'};
const story='When the foal was born the lights failed during a summer storm; the owner remembers finding the mare by the sound of her breathing.';
const command={id:'origin:horse:1999:test',type:'RECORD_HORSE_NAMING_STORY',actor:'player',
 payload:{horse,story_id:'FARM-ORIGIN-101',story}};
const make=()=>createGameRun({world,runId:'WTW-RUN-STORY-CREATOR',seed:1999,
 player:{role:'owner',involvement:'balanced',operation_id:'O-OWNER'}});
const idea={name:'Breath in Dark',evidenceId:'OWNER_STORY:FARM-ORIGIN-101',
 evidenceQuote:'by the sound of her breathing',
 explanation:'The owner remembers the mare and foal through her breathing during the farm blackout, not their appearance.'};

test('real game action -> save -> AI name -> independent editorial hold, no registration',async()=>{
 const start=make(),canon=JSON.stringify(world);
 const after=dispatchGameCommand({world,state:start,command});
 const saved=exportGameSave(after.state,world),reloaded=importGameSave(saved,world);
 const brief=buildGameHorseNamingBrief({world,state:reloaded,horse});
 assert.equal(brief.status,'READY_FOR_ORIGINAL_NAME_WRITING');
 let times=0;const created=await writeStoryFirstHorseNames({world,state:reloaded,horse,brief,
  infer:async spec=>{times++;assert.ok(spec.system.includes('origin'));
   return {response:JSON.stringify({ideas:[idea]})}}
 });
 assert.equal(times,1);assert.equal(created.readyForIndependentEditor,1);
 assert.equal(created.screened[0].name,'Breath in Dark');
 assert.equal(created.screened[0].registrationStatus,'NOT_RELEASED');
 const editor=recordGameNameEditorialDecision(created.screened[0],{
  editorId:'INDEPENDENT-EDITOR',verdict:'SEND_TO_OWNER',
  notes:'This name is rooted in the verified farm night and has an individual emotional point of view.'});
 assert.equal(editor.status,'PENDING_OWNER_REVIEW');
 assert.equal(editor.registrationStatus,'NOT_RELEASED');
 assert.equal(Object.keys(reloaded.runtime.registered_horses.by_id).length,0);
 assert.equal(JSON.stringify(start.runtime.horse_naming.stories_by_id),'{}');
 assert.equal(JSON.stringify(world),canon);
});

test('browser game and server modules share exact screened candidate behavior',()=>{
 const state=dispatchGameCommand({world,state:make(),command}).state;
 const brief=buildGameHorseNamingBrief({world,state,horse});
 const browser=browserScreen({world,state,brief,rawIdeas:[idea]});
 assert.equal(browser.readyForIndependentEditor,1);
 assert.equal(browserCreativeBrief(brief).evidenceIds[0],'OWNER_STORY:FARM-ORIGIN-101');
});