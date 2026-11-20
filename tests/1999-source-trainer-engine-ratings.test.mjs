import test from 'node:test';
import assert from 'node:assert/strict';
import {modeledTrainerSkills,initializeGameHorseCare,TRAINER_SKILLS_SCHEMA}
 from '../src/game/horse-care.js';
import {rate1999Entity} from '../public/1999/engine/fictional-industry-graph-1999.mjs';
const id='P-FICTIONAL-1999-TRAINER-0000217';
const original={id,name:'Established Bluegrass Trainer',role:'trainer',
 workplaceId:'T-0001',dateOfBirth:'1962-06-18',ageAtOpening:36,
 ratings:rate1999Entity(19990101,'trainer',id)};
const world={entities:{people:[original]}};
const horse={horse_id:'H-GAME-1999-TRAINER-TEST',
 registered_name:'First Dawn',trainer_id:id,
 racing_age_1999:3,status:'IN_TRAINING',
 starting_attributes:{current_ability:66,potential_ability:90}};
const state=()=>({clock:{date:'1999-01-01'},rng:{seed:19990101},
 runtime:{people:{},horse:{}}});
test('real stored 1999 role attributes, not names or a cosmetic label, determine each playable trainer ability',()=>{
 const skills=modeledTrainerSkills(id,19990101,original);
 assert.equal(skills.schema,TRAINER_SKILLS_SCHEMA);
 assert.equal(skills.source,'MODELED_FROM_PERSISTED_1999_TRAINER_ROLE_RATINGS');
 assert.equal(skills.person_id,id);
 assert.deepEqual(skills.source_role_ratings,original.ratings);
 assert.equal(skills.biography.date_of_birth,'1962-06-18');
 assert.equal(skills.biography.age_at_opening,36);
 assert.equal(skills.biography.home_track_id,'T-0001');
 assert.ok(skills.ability.current>=1&&skills.ability.current<=99);
 assert.ok(skills.ability.potential>=skills.ability.current);
 for(const value of Object.values(skills.roleAttributes))
  assert.ok(value>=0&&value<=1&&Number.isFinite(value));
 const better=structuredClone(original);
 better.ratings.conditioning=100;
 assert.notEqual(modeledTrainerSkills(id,19990101,better).roleAttributes.conditioning,
  skills.roleAttributes.conditioning,
  'the exact saved conditioning score actually changes the engine behavior');
 const renamed={...original,name:'Renamed by owner'};
 assert.deepEqual(modeledTrainerSkills(id,19990101,renamed),skills,
  'display name changes cannot recalculate or reset ratings');
 const copy=JSON.parse(JSON.stringify(skills));
 assert.deepEqual(copy,skills,'role and age records roundtrip without floating drift');
});
test('the canonical horse-care engine stores personnel source ratings once and survives reopening',()=>{
 const s=state(),h=structuredClone(horse);
 initializeGameHorseCare(s,h,world);
 const record=s.runtime.people[id].game_training_skills;
 assert.equal(record.source,'MODELED_FROM_PERSISTED_1999_TRAINER_ROLE_RATINGS');
 assert.equal(record.roleAttributes.young_horse_development,
  modeledTrainerSkills(id,19990101,original).roleAttributes.young_horse_development);
 const before=JSON.parse(JSON.stringify(s));
 const revised=structuredClone(world);
 revised.entities.people[0].ratings.conditioning=20;
 initializeGameHorseCare(s,h,revised);
 assert.deepEqual(s,before,
  'existing saved trainer development must never be silently reset by a source pack update');
 const reopened=JSON.parse(JSON.stringify(s));
 initializeGameHorseCare(reopened,h,world);
 assert.deepEqual(reopened,s);
});
test('unsupported older source people retain their existing modeled rating fallback',()=>{
 const old=modeledTrainerSkills(id,19990101);
 const unsupported=modeledTrainerSkills(id,19990101,{
  id,name:'Legacy',role:'trainer',ratings:{ability:88}});
 assert.deepEqual(old,unsupported);
 assert.equal(old.source,'MODELED_1999_GAMEPLAY_NOT_HISTORICAL');
});
