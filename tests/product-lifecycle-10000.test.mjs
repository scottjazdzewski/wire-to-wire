import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,createGameRun,exportGameSave,importGameSave} from '../src/game/index.js';

const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'WTW-COMMERCIAL-REOPEN-ENDURANCE-V1',
  source:'EXPLICIT_TEST_ONLY_NOT_HISTORICAL',
  sha256:createHash('sha256').update('wtw-product-lifecycle-endurance-v1').digest('hex')},
 entities:{horses:[],people:[],organizations:[],tracks:[]}};

test('10,000 exact kernel close/reopens keep the career byte-for-byte identical',()=>{
 const initial=createGameRun({world,runId:'WTW-RUN-COMMERCIAL-REOPEN-ENDURANCE',seed:19990101,
  player:{role:'owner',involvement:'balanced',operation_id:null}});
 const frozen=exportGameSave(initial,world);
 let reopened=initial;
 for(let cycle=1;cycle<=10000;cycle++){
  const saved=exportGameSave(reopened,world);
  assert.equal(saved,frozen,'Save bytes drift at reopen '+cycle);
  reopened=importGameSave(saved,world);
  assert.equal(reopened.run_id,initial.run_id,'Wrong run at reopen '+cycle);
  assert.equal(reopened.clock.date,initial.clock.date,'Wrong date at reopen '+cycle);
  assert.equal(reopened.revision,initial.revision,'Wrong revision at reopen '+cycle);
  assert.equal(reopened.event_log.length,initial.event_log.length,'Wrong journal at reopen '+cycle);
 }
 assert.deepEqual(reopened,initial);
 const corrupted=frozen.replace('WTW-RUN-COMMERCIAL-REOPEN-ENDURANCE','WTW-RUN-COMMERCIAL-REOPEN-ENDURANCA');
 assert.throws(()=>importGameSave(corrupted,world),/checksum|corrupt/i);
});
