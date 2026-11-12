import test from 'node:test';
import assert from 'node:assert/strict';
import {createAgeAbility,evaluateAgeAbility,supportedAgeRoles,AGE_ABILITY_SCHEMA} from '../public/1999/engine/age-ability.mjs';
import {create1999Universe} from '../src/1999/full-world-generator.mjs';
import {readLocal1999World} from '../public/1999/engine/local-api.mjs';

const seed=19990101,world=create1999Universe({seed});
const valid=rating=>Number.isInteger(rating?.current)&&Number.isInteger(rating?.potential)&&
 rating.current>=1&&rating.current<=99&&rating.potential>=rating.current&&rating.potential<=99&&
 Number.isInteger(rating.currentStars)&&Number.isInteger(rating.potentialStars)&&
 rating.currentStars>=1&&rating.potentialStars>=rating.currentStars&&rating.potentialStars<=5;

test('single age-ability model is deterministic and projects aging without rerolling identity',()=>{
 const a=createAgeAbility({seed,id:'P-TEST-123',role:'jockey',age:18});
 const b=createAgeAbility({seed,id:'P-TEST-123',role:'jockey',age:18});
 assert.deepEqual(a,b);
 assert.equal(a.schema,AGE_ABILITY_SCHEMA);
 const later=evaluateAgeAbility(a,36);
 assert.equal(later.peakAge,a.peakAge);
 assert.equal(later.peakCeiling,a.peakCeiling);
 assert.equal(later.age,36);
 assert.ok(later.current>=a.current);
 assert.ok(later.potentialStars-later.currentStars<=1);
 assert.deepEqual(evaluateAgeAbility(a,36),later);
});

test('jockey 18 can be 2-star current / 5-star potential, age 36 cannot be 2/5',()=>{
 let youngExample=0,olderErrors=0;
 for(let i=0;i<7000;i++){
  const id='TEST-JOCKEY-'+i;
  const young=createAgeAbility({seed,id,role:'jockey',age:18});
  const adult=createAgeAbility({seed,id,role:'jockey',age:36});
  assert.ok(valid(young)&&valid(adult));
  if(young.currentStars<=2&&young.potentialStars===5)youngExample++;
  if(adult.currentStars<=2&&adult.potentialStars>=5)olderErrors++;
  assert.ok(adult.potentialStars-adult.currentStars<=1,'36-year-old jockey gets implausible future growth '+id);
 }
 assert.ok(youngExample>=20,'Need some legitimate young elite prospects');
 assert.equal(olderErrors,0);
});

test('all supported professional roles carry realistic individual age curves',()=>{
 for(const role of supportedAgeRoles){
  for(let i=0;i<200;i++){
   const id='ROLE-'+role+'-'+i;
   for(const age of (role==='horse'?[1,2,3,4,5,8,10]:[18,25,36,45,55,65])){
    const ability=createAgeAbility({seed,id,role,age});
    assert.ok(valid(ability),role+':'+age+':'+id);
    if(age>ability.peakAge)assert.equal(ability.potential,ability.current);
   }
  }
 }
});

test('the 1999 horse and people population inherits root ability ratings and preserved canon identity',()=>{
 for(let i=0;i<world.counts.horses;i+=37){
  const h=world.horseAt(i);
  assert.ok(valid(h.ability),h.id);
  assert.equal(h.ability.role,'horse');
  assert.equal(h.ability.age,h.ageAtOpening);
  assert.equal(Object.keys(h.attributes).length,53);
  if(h.ageAtOpening>=8)assert.equal(h.ability.potential,h.ability.current);
 }
 for(let i=0;i<267;i++){
  const h=world.horseAt(i);assert.ok(valid(h.ability),h.id);
  assert.equal(h.nameStatus,'CANON_LOCKED');
 }
 for(let i=0;i<world.counts.people-world.sourcePeople.length;i++){
  const p=world.personAt(i);assert.ok(valid(p.ability),p.id);
  assert.equal(p.age,p.ability.age);
  assert.ok(Object.keys(p.attributes||{}).length>=10,p.id);
  if(p.role==='jockey'&&p.age===36)assert.ok(p.ability.potentialStars-p.ability.currentStars<=1);
 }
 for(let i=0;i<world.sourcePeople.length;i++){
  const p=world.sourcePersonAt(i);
  assert.equal(p.id,world.sourcePeople[i].id);
  assert.equal(p.name,world.sourcePeople[i].name);
  assert.ok(valid(p.ability));
  assert.ok(p.ageBasis);
 }
});

test('source and browser read APIs expose the same normalized ability for every category',()=>{
 const h=readLocal1999World('/api/1999/sim/horses?offset=275&limit=3');
 const people=readLocal1999World('/api/1999/sim/people?offset=4220&limit=3');
 const sourcePeople=readLocal1999World('/api/1999/sim/source-people?offset=0&limit=3');
 for(const rows of [h,people,sourcePeople]){
  assert.ok(rows.items.length>=3);
  assert.ok(rows.items.every(x=>valid(x.ability)));
 }
 assert.equal(h.items[0].ability.current,world.horseAt(275).ability.current);
 assert.equal(sourcePeople.items[0].id,world.sourcePeople[0].id);
});
