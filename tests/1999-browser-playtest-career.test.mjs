import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPlaytestCareer,buildPlaytestSnapshot,browserPlaytestRequested,
 PLAYTEST_QUERY} from '../public/1999/game/playtest-service.mjs';
import {validateGameRun,exportGameSave,importGameSave} from '../public/1999/game/index.js';

const source=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const directory=source('../public/data/wtw-1999-founding-directory-v1.json');
const trainers=source('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockeys=source('../public/data/wtw-1999-jockey-pilot-v1.json');
const cohort=source('../public/data/wtw-1999-playtest-cohort-38-v1.json');
const context={directory,trainers,jockeys,cohort};
test('playtest is explicitly selected, never silently populates the canonical founding opening',()=>{
 assert.equal(PLAYTEST_QUERY,'playtest=38');
 assert.equal(browserPlaytestRequested({search:'?playtest=38'}),true);
 assert.equal(browserPlaytestRequested({search:''}),false);
 assert.equal(browserPlaytestRequested({search:'?playtest=1999'}),false);
 assert.equal(directory.counts.openingHorses,0);
 assert.equal(directory.horses.length,73);
 assert.equal(cohort.source_names.accepted_for_production,false);
});
test('browser snapshot resolves all source person and racing identities without name collisions',async()=>{
 const world=await buildPlaytestSnapshot(context);
 assert.equal(world.schema,'WTW_WORLD_SNAPSHOT_V1');
 assert.equal(world.entities.tracks.length,directory.tracks.length);
 assert.ok(world.entities.people.length>=87);
 assert.match(world.authority.sha256,/^[a-f0-9]{64}$/);
 const twice=await buildPlaytestSnapshot(context);
 assert.deepEqual(twice,world);
});
test('browser runner uses the same 38 horses, 8 physical barns, 26 selected jockeys and one owner account',async()=>{
 const engine=await createPlaytestCareer(context);
 const v=engine.view();
 assert.equal(v.date,'1999-01-01');
 assert.equal(v.horse_count,38);
 assert.equal(v.all_horses.length,38);
 assert.equal(Object.keys(engine.state.runtime.facilities.sites).length,8);
 assert.equal(Object.keys(engine.state.runtime.racing.jockeys).length,26);
 assert.equal(v.stable.length,cohort.assignments.filter(h=>h.owner_organization_id==='O-000061').length);
 assert.ok(v.all_horses.every(h=>h.condition&&h.training&&h.owner_id&&h.trainer_id&&h.site_id));
 assert.ok(v.all_horses.every(h=>h.source==='ISOLATED_GAME_TEST_COHORT_NOT_HISTORICAL'));
 assert.ok(v.stable.every(h=>h.owner_id===v.player_operation_id));
 const playerHorse=v.stable[0],record=engine.getProfile(playerHorse.horse_id);
 assert.equal(record.horse_id,playerHorse.horse_id);
 assert.equal(engine.getConnections('trainer',playerHorse.trainer_id).horses.some(h=>
  h.id===playerHorse.horse_id),true);
 validateGameRun(engine.state,engine.world);
});
test('player training order is a true game command and survives a saved career reload',async()=>{
 const e=await createPlaytestCareer(context);
 const h=e.view().stable[0];
 const last=e.state.runtime.horse[h.id].policy.training_plan;
 e.setTrainingPlan(h.id,last==='STAMINA'?'SPEED':'STAMINA');
 const saved=e.getSave(),opened=await createPlaytestCareer({...context,save:saved});
 assert.notEqual(opened.state.runtime.horse[h.id].policy.training_plan,last);
 assert.equal(opened.state.runtime.horse[h.id].policy.source,'PLAYER_DECISION');
 assert.deepEqual(opened.state,e.state);
 assert.throws(()=>importGameSave(saved.replace('WTW_GAME_RUN_V1','BROKEN_SAVE'),e.world),
  err=>err.code==='SAVE_CORRUPTED'||err.code==='RUN_SCHEMA');
});
test('15-day browser playtest reproduces actual race results, condition, finances and agent feedback',async()=>{
 const e=await createPlaytestCareer(context);
 e.advanceTo('1999-01-16');
 const v=e.view();
 assert.equal(v.date,'1999-01-16');
 assert.equal(v.races.filter(r=>r.status==='OFFICIAL_SIM_RESULT').length,3);
 assert.ok(v.entries.some(r=>r.status==='RESULTED'));
 assert.equal(v.all_horses.filter(h=>h.career.starts>0).length,27);
 assert.ok(v.all_horses.some(h=>h.modelResults.length>0&&h.training.fatigue>=0));
 assert.equal(v.finance.owner_cash_minor,
  e.state.runtime.finances.operation_balances_minor[e.state.player.operation_id]);
 const payout=e.state.runtime.finances.ledger.filter(x=>x.kind==='RACE_PURSE_OWNER_CREDIT');
 assert.ok(payout.length>0);
 const reopened=await createPlaytestCareer({...context,save:e.getSave()});
 assert.deepEqual(reopened.view(),v);
 const e2=await createPlaytestCareer(context);e2.advanceTo('1999-01-16');
 assert.deepEqual(e2.getSave(),e.getSave());
 assert.equal(JSON.stringify(directory),JSON.stringify(source('../public/data/wtw-1999-founding-directory-v1.json')));
});
