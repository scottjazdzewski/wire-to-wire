import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  WORLD_SCHEMA, createGameRun, dispatchGameCommand, exportGameSave, importGameSave
} from '../src/game/index.js';

// Nine source IDs/actor keys mirror the WTW Nov 11 game-world join.
// This is a MOCK SNAPSHOT for kernel tests, not a second authoritative
// horse roster, a checked real source digest, or a runtime importer.
const ACTORS = [
  ['H-1996-008006', 'Bell On Tuesday', 'O-006336', 'P-000069', 'T-0014'],
  ['H-1996-008011', 'Monahan Lantern', 'O-006889', 'P-000044', 'T-0017'],
  ['H-1996-008010', 'McRae Lantern', 'O-006875', 'P-000051', 'T-0022'],
  ['H-1996-008009', 'Write Mabel', 'O-006337', 'P-000048', 'T-0028'],
  ['H-1996-008001', 'Take Rita', 'O-000036', 'P-000041', 'T-0001'],
  ['H-1996-008005', 'Apron Later', 'O-000017', 'P-000043', 'T-0014'],
  ['H-1996-008007', 'Ask Later', 'O-000013', 'P-000042', 'T-0015'],
  ['H-1996-008012', 'Pike Curtain', 'O-000021', 'P-000041', 'T-0001'],
  ['H-1996-008008', 'Mind Bessie', 'O-006889', 'P-000069', 'T-0014']
];
function mockWorld() {
  const entities = {
    horses: ACTORS.map(([id, name, owner_id, trainer_id, track_id]) => ({
      id, name, source_status: 'WTW_KERNEL_TEST_SNAPSHOT_ONLY',
      opening_1999: {effective_date:'1999-01-01',owner_id,trainer_id,track_id,
        provenance:'WTW_IN_WORLD_JAN1_SEED'}
    })),
    people: [...new Set(ACTORS.map(x=>x[3]))].map(id=>({id,name:'Test trainer '+id})),
    organizations: [...new Set(ACTORS.map(x=>x[2]))].map(id=>({id,name:'Test organization '+id})),
    tracks: [...new Set(ACTORS.map(x=>x[4]))].map(id=>({id,name:'Test track '+id}))
  };
  return {schema:WORLD_SCHEMA,authority:{snapshot_id:'WTW-TEST-1999-NOT-CANON',
    source:'SIMULATION TEST MOCK - not the real Drive authority/digest',
    sha256:'a'.repeat(64)},start_date:'1999-01-01',entities};
}
function run(world=mockWorld(), role='trainer') {
  return createGameRun({world,runId:'WTW-RUN-TEST-1999-OPENING',seed:1999,
    player:{role,involvement:'balanced',operation_id:ACTORS[0][2]},
    stableHorseIds:[ACTORS[0][0]]});
}
const command=(index, actor='system', horse=ACTORS[index][0], suffix='')=>({
  id:`opening:1999:${index}${suffix}`,actor,type:'ACTIVATE_OPENING_HORSE',
  payload:{horse_id:horse}
});
const send=(state,world,cmd)=>dispatchGameCommand({state,world,command:cmd});

test('the existing kernel initializes all nine January source-bound horses, no fabricated physics',()=>{
  const world=mockWorld();let state=run(world);
  for(let i=0;i<ACTORS.length;i++) state=send(state,world,command(i)).state;
  assert.equal(Object.keys(state.runtime.horse).length,9);
  assert.equal(state.event_log.filter(e=>e.kind==='OPENING_HORSE_ACTIVATED').length,9);
  for(const [id,name,owner,trainer,track] of ACTORS) {
    const record=state.runtime.horse[id];
    assert.equal(record.horse_id,id);
    assert.equal(record.owner_id,owner);
    assert.equal(record.trainer_id,trainer);
    assert.equal(record.current_track_id,track);
    assert.equal(record.home_base_track_id,track);
    assert.equal(record.initialization_provenance,'WTW_IN_WORLD_JAN1_SEED');
    assert.equal(record.condition_status,'UNOBSERVED');
    assert.equal(record.training_status,'ASSESSMENT_QUEUED');
    assert.equal(record.assessment_trigger_id,'TRG-0025');
    assert.equal(record.assessment_status,'PENDING');
    assert.equal(world.entities.horses.find(x=>x.id===id).name,name);
  }
  assert.deepEqual(state.runtime.entries,{});
  assert.deepEqual(state.runtime.races,{});
  assert.equal(state.runtime.finances.balance_minor,null);
  assert.equal(state.scheduler.pending.length,0);
  assert.deepEqual(state.decisions.pending,{});
  assert.equal(state.clock.date,'1999-01-01');
});

test('opening commands require system authorization, immutable source IDs and valid actor/location joins',()=>{
  const world=mockWorld(),state=run(world),prior=JSON.stringify(state);
  assert.throws(()=>send(state,world,command(0,'player')),e=>e.code==='UNAUTHORIZED_COMMAND');
  assert.throws(()=>send(state,world,command(0,'system','H-UNKNOWN')),e=>e.code==='UNKNOWN_HORSE');
  assert.throws(()=>send(state,world,{...command(0),payload:{horse_id:ACTORS[0][0],owner_id:'O-SWAP'}}),e=>e.code==='INVALID_COMMAND');
  const corrupt=mockWorld();corrupt.entities.horses[0].opening_1999.owner_id='O-MISSING';
  assert.throws(()=>send(state,corrupt,command(0)),e=>e.code==='UNKNOWN_OPERATION');
  const wrongTrack=mockWorld();wrongTrack.entities.horses[0].opening_1999.track_id='T-UNKNOWN';
  assert.throws(()=>send(state,wrongTrack,command(0)),e=>e.code==='UNKNOWN_TRACK');
  const unknownTrainer=mockWorld();unknownTrainer.entities.horses[0].opening_1999.trainer_id='P-UNKNOWN';
  assert.throws(()=>send(state,unknownTrainer,command(0)),e=>e.code==='UNKNOWN_PERSON');
  const noSource=mockWorld();delete noSource.entities.horses[0].opening_1999;
  assert.throws(()=>send(state,noSource,command(0)),e=>e.code==='OPENING_SOURCE_REQUIRED');
  const unknownBasis=mockWorld();unknownBasis.entities.horses[0].opening_1999.provenance='VERIFIED_BY_HORSE_NAME_ONLY';
  assert.throws(()=>send(state,unknownBasis,command(0)),e=>e.code==='OPENING_PROVENANCE');
  assert.equal(JSON.stringify(state),prior,'rejected commands are atomic');
});

test('activation is exactly once per source Horse_ID, idempotent receipts cannot silently change owner',()=>{
  const world=mockWorld();
  const first=send(run(world),world,command(0));
  assert.equal(send(first.state,world,command(0)).duplicate,true);
  assert.throws(()=>send(first.state,world,command(0,'system',ACTORS[0][0],':again')),e=>e.code==='OPENING_ALREADY_ACTIVE');
  assert.throws(()=>send(first.state,world,{...command(0),payload:{horse_id:ACTORS[1][0]}}),e=>e.code==='COMMAND_CONFLICT');
  assert.equal(first.state.event_log.length,1);
});

test('activation occurs only at Jan 1 and keeps game date, results, health and money untouched',()=>{
  const world=mockWorld();
  const nextDay=send(run(world),world,{id:'clock:jan2',actor:'system',type:'ADVANCE_DAY',payload:{}}).state;
  assert.throws(()=>send(nextDay,world,command(0)),e=>e.code==='OPENING_DATE');
  const wrongDate=mockWorld();wrongDate.entities.horses[0].opening_1999.effective_date='1999-01-02';
  assert.throws(()=>send(run(wrongDate),wrongDate,command(0)),e=>e.code==='OPENING_DATE');
  assert.deepEqual(nextDay.runtime.horse,{});
});

test('player and AI activation share the same rules, and source-bound state saves and reloads',()=>{
  const world=mockWorld(),player=run(world,'owner'),ai=run(world,'trainer');
  let s=player,a=ai;
  for(let i=0;i<9;i++){s=send(s,world,command(i)).state;a=send(a,world,command(i)).state;}
  assert.deepEqual(s.runtime.horse,a.runtime.horse);
  assert.deepEqual(s.event_log,a.event_log);
  const saved=exportGameSave(s,world);
  assert.deepEqual(importGameSave(saved,world),s);
  const changed=mockWorld();changed.authority.sha256='b'.repeat(64);
  assert.throws(()=>importGameSave(saved,changed),e=>e.code==='WORLD_MISMATCH');
  const progressed=send(s,world,{id:'clock:jan2',actor:'system',type:'ADVANCE_DAY',payload:{}}).state;
  assert.equal(progressed.clock.date,'1999-01-02');
  assert.deepEqual(progressed.runtime.entries,{});
  assert.equal(progressed.event_log.filter(e=>e.kind==='OPENING_HORSE_ACTIVATED').length,9);
});
