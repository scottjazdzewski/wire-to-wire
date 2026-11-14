import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,createGameRun,dispatchGameCommand,exportGameSave,importGameSave} from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';
import {model1999StartingHorseAttributes} from '../src/game/horse-starting-attributes.js';
import {createHorseTrainingRecord} from '../public/1999/engine/horse-development.mjs';
const load=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const source=load('../public/data/wtw-1999-founding-directory-v1.json');
const trainerRoster=load('../public/data/wtw-1999-trainer-pilot-v1.json');
const manifest=load('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...source.people,...trainerRoster.trainers.filter(t=>!source.people.some(p=>p.id===t.id))];
const authorityBytes=JSON.stringify({sourceVersion:source.schema,sourcePeople:source.people.map(p=>p.id),
 trainers:trainerRoster.trainers.map(p=>p.id),sourceHorses:source.horses.map(h=>h.id)});
const world={schema:WORLD_SCHEMA,
 authority:{snapshot_id:'TEST-1999-ISOLATED-FOUNDING-PILOT',source:'ISOLATED_TEST_FIXTURE_FROM_FOUNDING_DIRECTORY_NOT_CANON',
 sha256:createHash('sha256').update(authorityBytes).digest('hex')},
 start_date:'1999-01-01',
 entities:{horses:source.horses,people,organizations:source.organizations,tracks:source.tracks}};
test('clean founding game world still begins with exactly zero racers and zero physical barns',()=>{
 const fresh=createGameRun({world,runId:'WTW-RUN-CLEAN-ISOLATED',seed:19990101,
  player:{role:'owner',involvement:'balanced',operation_id:'O-FOUNDING-1999-007'}});
 assert.equal(Object.keys(fresh.runtime.registered_horses.by_id).length,0);
 assert.equal(Object.keys(fresh.runtime.facilities.sites).length,0);
 assert.equal(fresh.stable_horse_ids.length,0);
 assert.equal(source.counts.openingHorses,0);
});
test('exact 38-horse test cohort has frozen abilities, 8 real registered residences, and zero overbooking',()=>{
 const state=build1999PilotGameRun({world,manifest});
 const horses=Object.values(state.runtime.registered_horses.by_id);
 const sites=Object.values(state.runtime.facilities.sites);
 assert.equal(horses.length,38);assert.equal(sites.length,8);
 assert.equal(new Set(horses.map(h=>h.name)).size,38);
 assert.equal(new Set(horses.map(h=>h.horse_id)).size,38);
 assert.equal(new Set(horses.map(h=>h.current_residence_id)).size,8);
 assert.equal(new Set(horses.map(h=>h.trainer_id)).size,6);
 assert.equal(horses.filter(h=>h.host_track_id!==null).length,30);
 assert.equal(horses.filter(h=>h.residence_kind==='ORGANIZATION_HOME_SITE').length,8);
 for(const h of horses){
  const site=state.runtime.facilities.sites[h.current_residence_id];
  assert.ok(site);assert.equal(site.status,'ACTIVE');
  assert.ok(h.starting_attributes);
  assert.equal(h.starting_attributes.schema,'WTW_1999_GAME_HORSE_ATTRIBUTES_V1');
  assert.deepEqual(h.starting_attributes,model1999StartingHorseAttributes({
   horse_id:h.horse_id,seed:manifest.seed,foaling_year:h.foaling_year,sex:h.sex
  }));
  if(site.host_track_id)assert.equal(site.head_trainer_person_id,h.trainer_id);
  const training=createHorseTrainingRecord({
   id:h.id,name:h.name,trainerId:h.trainer_id,attributes:h.starting_attributes
  },'1999-01-01');
  assert.equal(training.horseId,h.id);
  assert.equal(training.fitness,h.starting_attributes.fitness);
 }
 for(const site of sites)
  assert.ok(horses.filter(h=>h.current_residence_id===site.id).length<=site.stalls);
 const saved=exportGameSave(state,world);
 assert.deepEqual(importGameSave(saved,world),state);
 assert.deepEqual(build1999PilotGameRun({world,manifest}),state);
 const tomorrow=dispatchGameCommand({state,world,
  command:{id:'test:day:2',type:'ADVANCE_DAY',actor:'system',payload:{}}}).state;
 assert.equal(tomorrow.clock.date,'1999-01-02');
 assert.equal(tomorrow.runtime.finances.ledger.filter(x=>x.kind==='FACILITY_TRACK_RENT').length,6);
 assert.deepEqual(importGameSave(exportGameSave(tomorrow,world),world),tomorrow);
});
test('cohort assignment cannot overfill a physical site or drift a recorded attribute',()=>{
 const full=structuredClone(manifest);
 full.sites[0].stalls_total=4;
 assert.throws(()=>build1999PilotGameRun({world,manifest:full}),e=>e.code==='PILOT_SCENARIO');
 const drift=structuredClone(manifest);
 drift.assignments[0].starting_attributes.raw_speed=.999;
 assert.throws(()=>build1999PilotGameRun({world,manifest:drift}),e=>e.code==='PILOT_SCENARIO');
});
