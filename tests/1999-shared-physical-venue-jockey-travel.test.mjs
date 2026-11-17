import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {unpackShared1999Career}
 from '../public/1999/engine/shared-1999-career-package.mjs';
import {buildConditionBook1999}
 from '../public/next/1999-condition-book-engine.mjs';
import {assessJockeySchedule,jockeyTransferDays}
 from '../public/1999/engine/jockey-engagements-1999.mjs';

globalThis.crypto??=webcrypto;
const career=new URL('../public/assets/careers/WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer.gz',
 import.meta.url);
const track=(id,name,city,state)=>({
 id,name,playableIn1999:true,
 location:{city,state,country:'USA'}
});
const bay=track('T-0032','Bay Meadows','San Mateo','California');
const fair=track('T-0075','San Mateo County Fair','San Mateo','California');
const golden=track('T-0031','Golden Gate Fields','Albany','California');
const world={entities:{tracks:[bay,fair,golden]}};
const fairRaces=buildConditionBook1999({date:'1999-08-14',track:fair,
 trackIndex:74,seed:19990101,includeKnownStakes:false});
assert.ok(fairRaces.length>0,'approved August fair meet must have existing condition book');
const entryRace={id:fairRaces[0].id,track_id:'T-0075',
 date:fairRaces[0].date,conditions:fairRaces[0].conditions,
 purse_minor:Math.round(fairRaces[0].purse*100)};

test('canonical 300k saved jockey has no imaginary journey or travel charge between Bay and fair',async()=>{
 const checkpoint=await unpackShared1999Career(gunzipSync(readFileSync(career)));
 assert.equal(checkpoint.world.horseCount,300000);
 assert.equal(checkpoint.careerRecord.runId,'WTW-RUN-1999-19990101-SIZE-300000');
 const run=checkpoint.careerRecord.changes.canonicalRun;
 const original=Object.values(run.runtime.racing.jockeys)[0];
 assert.ok(original,'real career must have an activated professional');
 const j={...original,home_track_id:'T-0032'};
 const state={clock:{date:'1999-08-10'},runtime:{entries:{},races:{}}};
 assert.equal(jockeyTransferDays(bay,fair),0);
 assert.equal(jockeyTransferDays(fair,bay),0);
 const schedule=assessJockeySchedule(state,world,j,entryRace);
 assert.equal(schedule.allowed,true,JSON.stringify(schedule));
 assert.equal(schedule.away,false);
 assert.equal(schedule.additionalTravel,false);
 assert.equal(schedule.homeTripDays,0);
 assert.equal(original.home_track_id,run.runtime.racing.jockeys[original.id].home_track_id,
  'in-memory test must not alter saved jockey identity');
});

test('real other California facility still requires a geographically plausible professional trip',()=>{
 const j={id:'P-L5-REGIONAL-TEST',home_track_id:'T-0031',tier:'REGIONAL'};
 const state={clock:{date:'1999-08-10'},runtime:{entries:{},races:{}}};
 assert.equal(jockeyTransferDays(golden,fair),1);
 const available=assessJockeySchedule(state,world,j,entryRace);
 assert.equal(available.allowed,true);
 assert.equal(available.away,true);
 assert.equal(available.additionalTravel,true);
 assert.equal(available.homeTripDays,1);
 state.runtime.entries.e1={id:'e1',jockey_id:j.id,
  race_id:'R-SCHEDULE-OTHER-TRACK',status:'BOOKED'};
 state.runtime.races['R-SCHEDULE-OTHER-TRACK']={id:'R-SCHEDULE-OTHER-TRACK',
  track_id:golden.id,date:entryRace.date};
 const blocked=assessJockeySchedule(state,world,j,entryRace);
 assert.equal(blocked.allowed,false);
 assert.equal(blocked.reason,'JOCKEY_LOCATION');
});
