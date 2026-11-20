import test from 'node:test';
import assert from 'node:assert/strict';
import {connect1999Person,connect1999Horse}
 from '../public/1999/engine/fictional-industry-graph-1999.mjs';
import {project1999TrainerSourceSkills,project1999JockeySourceSkills,
 source1999RoleCoverage,SOURCE_PERSONNEL_GAMEPLAY_MODEL}
 from '../public/1999/engine/source-personnel-gameplay-1999.mjs';
import {modeledTrainerSkills,initializeGameHorseCare}
 from '../public/1999/game/horse-care.js';
import {baselineTrainerDailyFee}
 from '../public/1999/game/trainer-contracts-1999.js';
import {modeledJockeySkills,jockeyRaceExecutionIndex}
 from '../public/1999/game/racing-1999.js';
import {model1999StartingHorseAttributes}
 from '../public/1999/game/horse-starting-attributes.js';
import {createHorseTrainingRecord,advanceHorseTrainingDay}
 from '../public/1999/engine/horse-development.mjs';

const SEED=19990101;
const trainerId='P-FICTIONAL-1999-TRAINER-0000001';
const jockeyId='P-FICTIONAL-1999-JOCKEY-0000001';
const trainer=connect1999Person({
 id:trainerId,name:'Original Saved Trainer',role:'trainer',workplaceId:'T-0001'
},{seed:SEED});
const jockey=connect1999Person({
 id:jockeyId,name:'Original Saved Jockey',role:'jockey',workplaceId:'T-0001'
},{seed:SEED});
const sourceHorse=connect1999Horse({
 id:'H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000001',
 name:'Canonical Runner',status:'RACING',sex:'GELDING',foalYear:1996,
 ownerId:'O-000061',ownerPortfolioTier:'ELITE',homeTrackId:'T-0001',
 development:{potential:84,readiness:60,soundness:76}
},{seed:SEED,trainerCount:10,jockeyCount:10});
const gameHorseId='H-GAME-1999-WORLD-'+sourceHorse.id.replace(/^H-FICTIONAL-1999-/,'');
const attributes=model1999StartingHorseAttributes({
 horse_id:gameHorseId,seed:SEED,foaling_year:1996,sex:'GELDING',
 horseRatings:sourceHorse.ratings,development:sourceHorse.development,
 ownerPortfolioTier:sourceHorse.ownerPortfolioTier
});
const careHorse={
 id:gameHorseId,horse_id:gameHorseId,name:'Canonical Runner',
 registered_name:'Canonical Runner',trainerId:trainerId,trainer_id:trainerId,
 racing_age_1999:3,ageAtOpening:3,starting_attributes:attributes,
 attributes,owner_organization_id:'O-000061',finances:{monthlyCareCost:2500}
};

test('every source trainer and jockey rating maps by permanent P-ID, not by display name',()=>{
 const t=modeledTrainerSkills(trainerId,SEED,trainer);
 const j=modeledJockeySkills(jockeyId,SEED,jockey);
 assert.equal(t.schema,'WTW_1999_TRAINER_SKILLS_GAME_V1');
 assert.equal(t.person_id,trainerId);
 assert.equal(t.source,SOURCE_PERSONNEL_GAMEPLAY_MODEL);
 assert.deepEqual(t.source_role_ratings,trainer.ratings);
 assert.deepEqual(j.source_role_ratings,jockey.ratings);
 assert.equal(j.rating_source,SOURCE_PERSONNEL_GAMEPLAY_MODEL);
 assert.equal(t.source_workplace_id,'T-0001');
 assert.deepEqual(
  modeledTrainerSkills(trainerId,SEED,{...trainer,name:'Changed Display Name'}),
  t);
 assert.deepEqual(
  modeledJockeySkills(jockeyId,SEED,{...jockey,name:'Changed Display Name'}),
  j);
 const coverage=source1999RoleCoverage([trainer,jockey]);
 assert.equal(coverage.complete,true);
 assert.deepEqual(coverage.counts,{trainer:1,jockey:1});
 assert.deepEqual(coverage.missing,{trainer:[],jockey:[]});
});

test('trainer source CONDITIONING has a causal one-day training effect in real horse engine',()=>{
 const low=structuredClone(trainer),high=structuredClone(trainer);
 low.ratings.conditioning=15;high.ratings.conditioning=95;
 const a=modeledTrainerSkills(trainerId,SEED,low);
 const b=modeledTrainerSkills(trainerId,SEED,high);
 assert.ok(b.roleAttributes.conditioning>a.roleAttributes.conditioning);
 assert.ok(b.ability.current>a.ability.current);
 const record=createHorseTrainingRecord(careHorse,'1999-01-01');
 const context={nutrition:.72,supervision:.77,barnQuality:.82,crowding:.5,
  workout:'BALANCED'};
 const resultLow=advanceHorseTrainingDay(
  structuredClone(record),careHorse,{...a,compensation:{dayRate:65}},
  '1999-01-02',SEED,context);
 const resultHigh=advanceHorseTrainingDay(
  structuredClone(record),careHorse,{...b,compensation:{dayRate:65}},
  '1999-01-02',SEED,context);
 assert.ok(resultHigh.horse.fitness>resultLow.horse.fitness,
  'Changing only canonical trainer conditioning must change actual horse fitness');
 assert.equal(record.asOf,'1999-01-01','Test must not rewrite starting horse');
});

test('trainer public REPUTATION affects actual fee without changing conditioning or negotiated terms',()=>{
 const low=structuredClone(trainer),high=structuredClone(trainer);
 low.ratings.reputation=15;high.ratings.reputation=95;
 const a=modeledTrainerSkills(trainerId,SEED,low);
 const b=modeledTrainerSkills(trainerId,SEED,high);
 assert.deepEqual(a.roleAttributes,b.roleAttributes,
  'Public reputation alone must not fabricate improved training talent');
 assert.ok(b.source_reputation_index>a.source_reputation_index);
 assert.ok(baselineTrainerDailyFee(b)>baselineTrainerDailyFee(a),
  'Source reputation must alter the actual game contract fee');
 const legacy=modeledTrainerSkills(trainerId,SEED);
 assert.equal(baselineTrainerDailyFee(legacy),
  Math.round(4000+4500*legacy.roleAttributes.conditioning),
  'Older careers keep original fee model');
});

test('jockey source FINISHING changes the exact index used by official race engine',()=>{
 const low=structuredClone(jockey),high=structuredClone(jockey);
 low.ratings.finishing=15;high.ratings.finishing=95;
 const a=modeledJockeySkills(jockeyId,SEED,low);
 const b=modeledJockeySkills(jockeyId,SEED,high);
 assert.ok(b.finish>a.finish);
 assert.ok(jockeyRaceExecutionIndex(b)>jockeyRaceExecutionIndex(a));
 assert.equal(a.pace,b.pace,
  'Changing finishing alone must not secretly change a separate pace rating');
 const repeat=modeledJockeySkills(jockeyId,SEED,high);
 assert.deepEqual(repeat,b,'Source-to-gameplay rating mapping must be deterministic');
});

test('actual 1999 career initializes the trainer from canonical source and preserves saved progression',()=>{
 const world={entities:{people:[trainer],horses:[sourceHorse]}};
 const state={clock:{date:'1999-01-01'},rng:{seed:SEED},
  runtime:{horse:{},people:{}}};
 initializeGameHorseCare(state,careHorse,world);
 const original=state.runtime.people[trainerId].game_training_skills;
 assert.deepEqual(original.source_role_ratings,trainer.ratings);
 assert.equal(original.source_person_id,trainerId);
 const disk=structuredClone(state);
 assert.deepEqual(disk.runtime.people[trainerId].game_training_skills,original);
 const changed=structuredClone(world);
 changed.entities.people[0].ratings.conditioning=15;
 initializeGameHorseCare(state,careHorse,changed);
 assert.deepEqual(state.runtime.people[trainerId].game_training_skills,original,
  'An already played career must never lose its developed trainer skills');
});

test('original pilot saves retain fallback, but incomplete canonical source fails closed',()=>{
 assert.deepEqual(modeledTrainerSkills(trainerId,SEED),
  modeledTrainerSkills(trainerId,SEED,{id:trainerId,role:'trainer'}));
 assert.deepEqual(modeledJockeySkills(jockeyId,SEED),
  modeledJockeySkills(jockeyId,SEED,{id:jockeyId,role:'jockey'}));
 const invalid=structuredClone(trainer);
 delete invalid.ratings.conditioning;
 assert.throws(()=>project1999TrainerSourceSkills(invalid),/incomplete source rating/);
 assert.equal(source1999RoleCoverage([invalid,jockey]).complete,false);
 assert.deepEqual(source1999RoleCoverage([invalid,jockey]).missing.trainer,[trainerId]);
 const invalidJockey=structuredClone(jockey);
 delete invalidJockey.ratings.paceJudgment;
 assert.throws(()=>project1999JockeySourceSkills(invalidJockey),/incomplete source rating/);
 assert.throws(()=>modeledTrainerSkills(jockeyId,SEED,trainer),/source ID mismatch/);
});
