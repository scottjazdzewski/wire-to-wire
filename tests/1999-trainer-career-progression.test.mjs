import test from 'node:test';
import assert from 'node:assert/strict';
import {modeledTrainerSkills}
 from '../src/game/horse-care.js';
import {rate1999Entity}
 from '../public/1999/engine/fictional-industry-graph-1999.mjs';
import {
 TRAINER_CAREER_PROGRESSION_SCHEMA,advance1999TrainerCareerProgression,
 validate1999TrainerCareerProgression
} from '../src/game/trainer-career-progression-1999.js';
const trainer='P-FICTIONAL-1999-TRAINER-0000201';
const owner='O-000061';
const source={id:trainer,name:'Kingsmere Trainer',role:'trainer',
 workplaceId:'T-0001',dateOfBirth:'1975-01-20',
 ratings:rate1999Entity(19990101,'trainer',trainer)};
const world={entities:{people:[source]}};
function fixture(){
 return {clock:{date:'1999-12-31'},rng:{seed:19990101},
  runtime:{people:{
   [trainer]:{game_training_skills:modeledTrainerSkills(trainer,19990101,source)}
  },races:{}}};
}
function official(s,year,raceNo,finish=1){
 const id='R-LOCAL-OFFICIAL-'+year+'-'+raceNo;
 s.runtime.races[id]={id,date:year+'-06-01',
  settled_date:year+'-06-01',status:'OFFICIAL_SIM_RESULT',
  results:[{horse_id:'H-GAME-'+raceNo,owner_id:owner,
   trainer_id:trainer,jockey_id:'P-JOCKEY-A',finish,
   trainer_share_minor:12340}]};
}
const review=s=>advance1999TrainerCareerProgression({state:s,world,emit:()=>{}});
test('actual officially completed races are the ONLY credit for dated trainer experience',()=>{
 const s=fixture(),person=s.runtime.people[trainer];
 const opening=structuredClone(person.game_training_skills);
 for(let i=0;i<8;i++)official(s,1999,i,i<3?1:2);
 s.runtime.races['R-UNPLAYED']={id:'R-UNPLAYED',date:'1999-08-01',
  status:'ENTRIES_OPEN',results:[{trainer_id:trainer,finish:1,trainer_share_minor:999999}]};
 s.runtime.races['R-FUTURE']={id:'R-FUTURE',date:'2000-06-01',
  status:'OFFICIAL_SIM_RESULT',
  results:[{trainer_id:trainer,finish:1,trainer_share_minor:999999}]};
 assert.deepEqual(review(s),{year:1999,reviewed:0,developed:0});
 s.clock.date='2000-01-01';
 const results=review(s),career=person.trainer_career_progression;
 assert.equal(results.reviewed,1);
 assert.equal(career.schema,TRAINER_CAREER_PROGRESSION_SCHEMA);
 assert.equal(career.starts,8);
 assert.equal(career.wins,3);
 assert.equal(career.trainer_purse_minor,98720);
 assert.equal(career.annual[0].age_at_review,24);
 assert.equal(career.annual[0].starts,8);
 assert.equal(career.annual[0].wins,3);
 assert.deepEqual(career.annual[0].skill_before,opening.roleAttributes);
 assert.equal(career.last_review_year,2000);
 assert.equal(person.game_training_skills.ability.potential,opening.ability.potential);
 const copy=JSON.parse(JSON.stringify(s));
 assert.deepEqual(review(s),{year:2000,reviewed:0,developed:0});
 assert.deepEqual(copy,s,'the same Jan 1 cannot post another yearly review');
 validate1999TrainerCareerProgression(s,world);
});
test('zero starts cannot create synthetic trainer victories, purses or skill boosts',()=>{
 const s=fixture(),prior=structuredClone(s.runtime.people[trainer].game_training_skills);
 s.clock.date='2000-01-01';
 const x=review(s),record=s.runtime.people[trainer].trainer_career_progression;
 assert.equal(x.reviewed,1);
 assert.equal(x.developed,0);
 assert.deepEqual(s.runtime.people[trainer].game_training_skills.roleAttributes,
  prior.roleAttributes);
 assert.equal(record.starts,0);assert.equal(record.wins,0);
 assert.equal(record.trainer_purse_minor,0);
 validate1999TrainerCareerProgression(s,world);
});
test('30 seasons, original age, winning money and personnel IDs survive JSON/upgrade reopen',()=>{
 let s=fixture(),age=1975;
 const originalName=source.name,initialRating=source.ratings.conditioning;
 for(let year=1999;year<=2029;year++){
  for(let i=0;i<6;i++)official(s,year,i,i%3===0?1:2);
  s.clock.date=(year+1)+'-01-01';
  const out=review(s);assert.equal(out.reviewed,1);
  const old=JSON.parse(JSON.stringify(s));
  validate1999TrainerCareerProgression(s,world);
  s=JSON.parse(JSON.stringify(s));
  assert.deepEqual(s,old);
  assert.deepEqual(review(s),{year:year+1,reviewed:0,developed:0});
  const career=s.runtime.people[trainer].trainer_career_progression;
  assert.equal(career.starts,(year-1998)*6);
  assert.equal(career.wins,(year-1998)*2);
  assert.equal(career.annual.at(-1).year,year);
  assert.equal(career.annual.at(-1).age_at_review,
   year+1-1975-(year+1===2000?1:1),
   'Jan 1 falls before the source January 20 birthday');
 }
 assert.equal(s.runtime.people[trainer].trainer_career_progression.last_review_year,2030);
 assert.equal(s.runtime.people[trainer].trainer_career_progression.starts,186);
 assert.equal(source.name,originalName,'source names remain immutable');
 assert.equal(source.ratings.conditioning,initialRating);
 assert.equal(s.runtime.people[trainer].game_training_skills.person_id,trainer);
 assert.equal(s.runtime.people[trainer].game_training_skills.biography.date_of_birth,'1975-01-20');
 const damaged=JSON.parse(JSON.stringify(s));
 damaged.runtime.people[trainer].trainer_career_progression.annual.at(-1).wins=9999;
 assert.throws(()=>validate1999TrainerCareerProgression(damaged,world),
  /Invalid actual-race trainer development history/);
});
