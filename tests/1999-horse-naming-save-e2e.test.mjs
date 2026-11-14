import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD_SCHEMA,createGameRun,dispatchGameCommand,exportGameSave,importGameSave,
 buildGameHorseNamingBrief} from '../src/game/index.js';

const world={
 schema:WORLD_SCHEMA,
 authority:{snapshot_id:'WTW-NAMING-E2E-TEST',source:'TEST ONLY',sha256:'a'.repeat(64)},
 start_date:'1999-01-01',entities:{
  horses:[{id:'H-CANON-1',name:'Protected Historical Horse'}],
  people:[{id:'P-OWNER-1',name:'Real Test Owner'}],
  organizations:[{id:'O-OWNER-A',name:'Test Racing Family'},
   {id:'O-BREEDER-A',name:'Test Breeder Farm'}],
  tracks:[{id:'T-TEST-A',name:'Test Track'}]
 }
};
const horse={horse_id:'H-GAME-1999-NEW-001',foaling_year:1996,
 owner_organization_id:'O-OWNER-A',breeder_organization_id:'O-BREEDER-A',
 sire_id:null,dam_id:null};
const command={id:'naming:owner-story-001',type:'RECORD_HORSE_NAMING_STORY',actor:'player',
 payload:{horse,story_id:'owner-story-001',story:'This foal was born during a thunderstorm, and the owner distinctly remembers the power going out.'}};
const newRun=()=>createGameRun({world,runId:'WTW-RUN-NAMESTORY',seed:1999,
 player:{role:'owner',involvement:'balanced',operation_id:'O-OWNER-A'}});

test('name origin travels through command journal, game save, and restored game',()=>{
 const start=newRun(),snapshot=JSON.stringify(world);
 const applied=dispatchGameCommand({world,state:start,command});
 assert.equal(applied.duplicate,false);
 assert.equal(applied.events[0].kind,'HORSE_NAMING_STORY_RECORDED');
 assert.equal(start.runtime.horse_naming.stories_by_id['owner-story-001'],undefined);
 const brief=buildGameHorseNamingBrief({world,state:applied.state,horse});
 assert.equal(brief.status,'READY_FOR_ORIGINAL_NAME_WRITING');
 assert.equal(brief.evidence[0].sourceRef,'owner_story:owner-story-001');
 assert.deepEqual(importGameSave(exportGameSave(applied.state,world),world),applied.state);
 const replay=dispatchGameCommand({world,state:applied.state,command});
 assert.equal(replay.duplicate,true);
 assert.equal(JSON.stringify(world),snapshot);
});

test('horse owner mismatch cannot create game naming origin',()=>{
 const state=newRun(),bad={...command,id:'naming:wrong-owner-001',payload:{...command.payload,
  horse:{...horse,owner_organization_id:'O-BREEDER-A'}}};
 assert.throws(()=>dispatchGameCommand({world,state,command:bad}),e=>e.code==='NAMING_OWNER');
 assert.deepEqual(state.runtime.horse_naming.stories_by_id,{});
});