import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORLD_SCHEMA, RUN_SCHEMA, createGameRun, dispatchGameCommand, exportGameSave,
  importGameSave, getStableView, getOfficeView, nextRandom, nextDate, validateWorld
} from '../src/game/index.js';

// TEST FIXTURE ONLY. These test identities are NOT promoted into the 1999 canon.
function world() {
  return {schema:WORLD_SCHEMA,authority:{snapshot_id:'WTW-TEST-1999-0001',source:'TEST FIXTURE (not canon)',sha256:'a'.repeat(64)},
    start_date:'1999-01-01',
    entities:{horses:[{id:'H-1997-030001',name:'Test Horse (not canonical)',source_status:'TEST_ONLY'}],
      people:[],organizations:[{id:'O-000070',name:'Test Operation (not canonical)'}],
      tracks:[{id:'T-0001',name:'Test Track (not canonical)'}]}};
}
function run(w=world()) {
  return createGameRun({world:w,runId:'WTW-RUN-TEST001',seed:1741,
    player:{role:'trainer',involvement:'hands-on',operation_id:'O-000070'},
    stableHorseIds:['H-1997-030001']});
}
const cmd=(id,type,payload={},actor='player')=>({id,type,payload,actor});
const send=(s,c,w=world())=>dispatchGameCommand({state:s,world:w,command:c});

test('new run stores source IDs only with no invented state, cash or race outcomes',()=>{
  const w=world(),s=run(w);
  assert.equal(s.schema,RUN_SCHEMA);
  assert.deepEqual(s.stable_horse_ids,['H-1997-030001']);
  assert.deepEqual(s.runtime.horse,{});
  assert.deepEqual(s.runtime.races,{});
  assert.deepEqual(s.runtime.entries,{});
  assert.equal(s.runtime.finances.balance_minor,null);
  assert.equal(s.clock.date,'1999-01-01');
  assert.equal(s.world_ref.sha256,w.authority.sha256);
});
test('world authority, unique source ID and real calendar date are mandatory',()=>{
  const bad=world();bad.authority.sha256='NOT_HASH';
  assert.throws(()=>validateWorld(bad),e=>e.code==='WORLD_DIGEST');
  const dup=world();dup.entities.horses.push({...dup.entities.horses[0]});
  assert.throws(()=>validateWorld(dup),e=>e.code==='DUPLICATE_ID');
  const date=world();date.start_date='1999-02-30';
  assert.throws(()=>validateWorld(date),e=>e.code==='INVALID_DATE');
});
test('unknown stable identity, operation and pre-1999 launch are rejected',()=>{
  const w=world(),p={role:'trainer',involvement:'balanced'};
  const mk=(extras={})=>createGameRun({world:w,runId:'WTW-RUN-A',seed:1,player:p,...extras});
  assert.throws(()=>mk({stableHorseIds:['H-UNKNOWN']}),e=>e.code==='UNKNOWN_HORSE');
  assert.throws(()=>mk({player:{...p,operation_id:'O-UNKNOWN'}}),e=>e.code==='UNKNOWN_OPERATION');
  assert.throws(()=>mk({startDate:'1998-12-31'}),e=>e.code==='INVALID_DATE');
});
test('unimplemented race engine cannot be accidentally invoked',()=>{
  const s=run();
  assert.throws(()=>send(s,cmd('simulate:001','SIMULATE_RACE',{race_id:'R-TEST'})),e=>e.code==='UNSUPPORTED_COMMAND');
  assert.equal(s.event_log.length,0);
});
test('invalid inbox option is rejected and leaves old state unchanged',()=>{
  const w=world();
  const queued=send(run(w),cmd('sys:1','QUEUE_DECISION',{decision_id:'D-0001',option_ids:['rest','work'],
    horse_id:'H-1997-030001'},'system'),w).state;
  const before=JSON.stringify(queued);
  assert.throws(()=>send(queued,cmd('player:1','ANSWER_DECISION',{decision_id:'D-0001',option_id:'invalid_choice'}),w),
    e=>e.code==='INVALID_CHOICE');
  assert.equal(JSON.stringify(queued),before);
  assert.equal(queued.decisions.resolved['D-0001'],undefined);
});
test('valid decision records chosen option but never fabricates training effects',()=>{
  const w=world();
  let s=send(run(w),cmd('sys:1','QUEUE_DECISION',{decision_id:'D1',option_ids:['rest','work']},'system'),w).state;
  s=send(s,cmd('player:1','ANSWER_DECISION',{decision_id:'D1',option_id:'rest'}),w).state;
  assert.equal(s.decisions.resolved.D1.option_id,'rest');
  assert.deepEqual(s.runtime.horse,{});
  assert.throws(()=>send(s,cmd('player:2','ANSWER_DECISION',{decision_id:'D1',option_id:'work'}),w),
    e=>e.code==='UNKNOWN_OR_RESOLVED_DECISION');
});
test('only system can schedule future events and duplicate event IDs are rejected',()=>{
  let s=run();
  const ev={event_id:'EV-1',kind:'ENTRY_DEADLINE',due_date:'1999-01-03',data:{}};
  assert.throws(()=>send(s,cmd('player:1','SCHEDULE_EVENT',ev)),e=>e.code==='UNAUTHORIZED_COMMAND');
  assert.throws(()=>send(s,cmd('sys:old','SCHEDULE_EVENT',{...ev,due_date:'1999-01-01'},'system')),
    e=>e.code==='INVALID_EVENT_DATE');
  s=send(s,cmd('sys:1','SCHEDULE_EVENT',ev,'system')).state;
  assert.throws(()=>send(s,cmd('sys:2','SCHEDULE_EVENT',ev,'system')),e=>e.code==='DUPLICATE_EVENT');
});
test('UTC game clock delivers scheduled events exactly once with ordered journal',()=>{
  let s=run();
  s=send(s,cmd('sys:1','SCHEDULE_EVENT',{event_id:'EV-1',kind:'ENTRY_DEADLINE',due_date:'1999-01-03',data:{}},'system')).state;
  s=send(s,cmd('sys:2','SCHEDULE_EVENT',{event_id:'EV-2',kind:'LETTER',due_date:'1999-01-02',data:{}},'system')).state;
  const first=send(s,cmd('clock:1','ADVANCE_DAY'));
  assert.equal(first.state.clock.date,'1999-01-02');
  assert.deepEqual(first.state.scheduler.delivered_ids,['EV-2']);
  s=send(first.state,cmd('clock:2','ADVANCE_DAY')).state;
  assert.equal(s.clock.date,'1999-01-03');
  assert.deepEqual(s.scheduler.delivered_ids,['EV-2','EV-1']);
  assert.deepEqual(s.event_log.map(x=>x.seq),[1,2,3,4,5,6]);
  assert.strictEqual(send(s,cmd('clock:2','ADVANCE_DAY')).state,s);
});
test('reusing command ID for different content is forbidden',()=>{
  let s=run();s=send(s,cmd('sys:1','QUEUE_DECISION',{decision_id:'D1',option_ids:['a','b']},'system')).state;
  assert.throws(()=>send(s,cmd('sys:1','QUEUE_DECISION',{decision_id:'D2',option_ids:['a','b']},'system')),
    e=>e.code==='COMMAND_CONFLICT');
});
test('save restores exactly and refuses corruption or a different canon snapshot',()=>{
  const w=world();let s=run(w);s=send(s,cmd('clock:1','ADVANCE_DAY'),w).state;
  const saved=exportGameSave(s,w);
  assert.deepEqual(importGameSave(saved,w),s);
  const changed=JSON.parse(saved);changed.state.clock.date='2099-01-01';
  assert.throws(()=>importGameSave(JSON.stringify(changed),w),e=>e.code==='SAVE_CORRUPTED');
  const other=world();other.authority.sha256='b'.repeat(64);
  assert.throws(()=>importGameSave(saved,other),e=>e.code==='WORLD_MISMATCH');
});
test('Office/Stable selectors are read-only views of the same game run',()=>{
  const w=world(),s=run(w),before=JSON.stringify(s);
  assert.deepEqual(getStableView(s,w).map(x=>x.id),['H-1997-030001']);
  const office=getOfficeView(s,w);assert.equal(office.game_date,'1999-01-01');
  office.stable[0].name='UI-only change';
  assert.equal(w.entities.horses[0].name,'Test Horse (not canonical)');
  assert.equal(JSON.stringify(s),before);
});
test('random stream and dates are deterministic, with no simulated wins yet',()=>{
  assert.deepEqual(nextRandom(1999),nextRandom(1999));
  assert.equal(nextDate('2000-02-28'),'2000-02-29');
  assert.equal(nextDate('1999-12-31'),'2000-01-01');
});
