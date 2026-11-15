import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameRun,dispatchGameCommand,exportGameSave,importGameSave,WORLD_SCHEMA} from '../src/game/index.js';

const world={schema:WORLD_SCHEMA,
 authority:{snapshot_id:'WTW-1999-JOB-PERSPECTIVE-TEST',source:'ISOLATED_TEST_FIXTURE',sha256:'c'.repeat(64)},
 start_date:'1999-01-01',entities:{horses:[],tracks:[],
  organizations:[{id:'O-OWNER-A',name:'Owner A'},{id:'O-FARM-A',name:'Farm A'}],
  people:[{id:'P-TRAINER-A',name:'Trainer A',role:'trainer'},
   {id:'P-JOCKEY-A',name:'Jockey A',role:'jockey'}]}};
const start=()=>createGameRun({world,runId:'WTW-RUN-JOB-VIEW',seed:1999,
 player:{role:'owner',involvement:'balanced',operation_id:'O-OWNER-A'}});
const change=(state,id,role,operation_id,person_id)=>dispatchGameCommand({world,state,
 command:{id,type:'CHANGE_PLAYER_JOB',actor:'player',payload:{role,operation_id,person_id}}});

test('player can switch saved viewpoints among owner, trainer, breeder, farm and jockey jobs',()=>{
 let state=start();
 const initialCash=state.runtime.finances.balance_minor;
 const jobs=[
  ['trainer','O-OWNER-A','P-TRAINER-A'],
  ['breeder','O-FARM-A',null],
  ['farm','O-FARM-A',null],
  ['jockey','O-OWNER-A','P-JOCKEY-A'],
  ['owner','O-OWNER-A',null]
 ];
 for(const [index,[role,operation_id,person_id]] of jobs.entries()){
  const result=change(state,'job:change:'+index,role,operation_id,person_id);
  state=result.state;
  assert.equal(state.player.role,role);
  assert.equal(state.player.operation_id,operation_id);
  assert.equal(state.player.person_id,person_id);
  assert.equal(result.events[0].kind,'PLAYER_JOB_CHANGED');
  assert.equal(result.events[0].details.purpose,'PLAYER_PERSPECTIVE_SWITCH');
 }
 assert.equal(state.runtime.finances.balance_minor,initialCash,'changing viewpoint creates no money');
 assert.deepEqual(importGameSave(exportGameSave(state,world),world),state,
  'the current job viewpoint survives save and load');
});

test('job switching rejects non-player, unsupported roles and unknown world identities without mutation',()=>{
 const state=start(),before=JSON.stringify(state);
 let index=0;
 const send=(actor,payload)=>dispatchGameCommand({world,state,
  command:{id:'job:invalid:'+String(index++),type:'CHANGE_PLAYER_JOB',actor,payload}});
 assert.throws(()=>send('system',{role:'trainer',operation_id:'O-OWNER-A'}),e=>e.code==='UNAUTHORIZED_COMMAND');
 assert.throws(()=>send('player',{role:'media',operation_id:'O-OWNER-A'}),e=>e.code==='INVALID_PLAYER_JOB');
 assert.throws(()=>send('player',{role:'trainer',operation_id:'O-MISSING'}),e=>e.code==='UNKNOWN_OPERATION');
 assert.throws(()=>send('player',{role:'jockey',operation_id:'O-OWNER-A',person_id:'P-MISSING'}),e=>e.code==='UNKNOWN_PERSON');
 assert.equal(JSON.stringify(state),before);
});
