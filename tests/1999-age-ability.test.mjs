import test from 'node:test';
import assert from 'node:assert/strict';
import {createAgeAbility,evaluateAgeAbility,supportedAgeRoles,AGE_ABILITY_SCHEMA} from '../public/1999/engine/age-ability.mjs';
import {create1999Universe} from '../src/1999/full-world-generator.mjs';
import {readLocal1999World as read1999Directory} from '../public/1999/engine/local-api.mjs';
// Explicit older full-world benchmark, not the clean founding-game default.
const readLocal1999World=raw=>{
 const url=new URL(raw,'https://wtw.benchmark');
 if(!url.searchParams.has('mode'))url.searchParams.set('mode','CANON_ANCHORED_TEST');
 return read1999Directory(url.pathname+url.search);
};

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

test('individual Thoroughbreds include early champions, 3-year-old, classic and late peaks',()=>{
 const bucket={two:0,three:0,four:0,five:0,later:0};
 for(let i=0;i<16000;i++){
  const p=createAgeAbility({seed,id:'MATURITY-DISTRIBUTION-'+i,role:'horse',age:2});
  assert.ok(p.peakAge>=2.1&&p.peakAge<=7.35);
  if(p.peakAge<3)bucket.two++;
  else if(p.peakAge<4)bucket.three++;
  else if(p.peakAge<4.9)bucket.four++;
  else if(p.peakAge<5.8)bucket.five++;
  else bucket.later++;
 }
 // Broad guardrails, not an invented claim of exact national percentages.
 assert.ok(bucket.two>=200&&bucket.two<=1600,JSON.stringify(bucket));
 assert.ok(bucket.three>=1600&&bucket.four>=3000,JSON.stringify(bucket));
 assert.ok(bucket.five>=1600&&bucket.later>=700,JSON.stringify(bucket));
});

test('sire/dam IDs affect inherited TEST precocity without making siblings identical',()=>{
 const pedigrees=Array.from({length:150},(_,i)=>({
  sireId:'S-MATURITY-'+i,damId:'D-MATURITY-'+i
 }));
 const lookup=pedigrees.map(p=>({
  pedigree:p,index:createAgeAbility({seed,id:'REFERENCE-FOAL',role:'horse',age:2,pedigree:p})
   .pedigreeMaturity.modeledAncestryPrecocity
 })).sort((a,b)=>a.index-b.index);
 const early=lookup[lookup.length-1].pedigree,late=lookup[0].pedigree;
 let earlyAge=0,lateAge=0;
 const siblingPeaks=new Set();
 for(let i=0;i<600;i++){
  const id='TEST-SIBLING-'+i;
  const a=createAgeAbility({seed,id,role:'horse',age:2,pedigree:early});
  const b=createAgeAbility({seed,id,role:'horse',age:2,pedigree:late});
  earlyAge+=a.peakAge;lateAge+=b.peakAge;
  siblingPeaks.add(a.peakAge);
  assert.equal(a.pedigreeMaturity.sireId,early.sireId);
  assert.equal(a.pedigreeMaturity.damId,early.damId);
  assert.ok(valid(a)&&valid(b));
 }
 assert.ok(siblingPeaks.size>100,'Brothers and sisters need distinct maturation schedules');
 assert.ok(earlyAge/600+0.4<lateAge/600,'Early-maturing families should produce earlier-peaking foals on average');
});

test('jockey development spans twenty-something to late thirties without fifty-year-old potential',()=>{
 let peak25=0,peak35=0,peak40=0;
 for(let i=0;i<12000;i++){
  const id='JOCKEY-CAREER-SAMPLE-'+i;
  const a=createAgeAbility({seed,id,role:'jockey',age:18});
  const m=createAgeAbility({seed,id,role:'jockey',age:36});
  const senior=createAgeAbility({seed,id,role:'jockey',age:50});
  if(a.peakAge>=24&&a.peakAge<=26)peak25++;
  if(a.peakAge>=34&&a.peakAge<=37)peak35++;
  if(a.peakAge>=40)peak40++;
  assert.ok(valid(a)&&valid(m)&&valid(senior));
  assert.equal(senior.current,senior.potential);
  assert.equal(senior.currentStars,senior.potentialStars);
  assert.ok(a.peakAge<=42.5);
 }
 assert.ok(peak25>=300&&peak35>=500&&peak40>=100);
});

test('opening-world foals derive maturation traits from source-linked breeding records',()=>{
 for(const i of [267,290,345,500,800,6000,32000,75000,87499]){
  const h=world.horseAt(i);
  assert.equal(h.ability.pedigreeMaturity.sireId,h.sireId);
  assert.equal(h.ability.pedigreeMaturity.damId,h.damId);
  assert.equal(h.ability.modelRevision,'INDIVIDUAL_MATURITY_PEDIGREE_V2');
  assert.ok(Math.abs(h.attributes.maturation_curve-(Math.round(
   Math.min(.99,Math.max(.01,(7.8-h.ability.peakAge)/6))*10000)/10000))<.0001);
  const future=evaluateAgeAbility(h.ability,h.ability.peakAge+1);
  assert.equal(future.peakAge,h.ability.peakAge);
  assert.equal(future.peakCeiling,h.ability.peakCeiling);
 }
});
