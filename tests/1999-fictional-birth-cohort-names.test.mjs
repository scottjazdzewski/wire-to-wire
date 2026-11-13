import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 US_BIRTH_COHORT_NAME_MODEL,US_COHORT_GIVEN_NAMES,
 usBirthCohortGivenPool,drawUSBirthCohortName
} from '../public/1999/engine/person-birth-cohort-names.mjs';
import {createFictionalWorldNameEngine} from '../public/1999/engine/fictional-world-name-engine.mjs';

const YEARS=[1915,1926,1935,1945,1956,1965,1976,1982];
test('US SSA ranked first-name lists cover every plausible adult birth decade in January 1999',()=>{
 assert.match(US_BIRTH_COHORT_NAME_MODEL,/SSA_US_1910S_1980S_TOP30/);
 assert.deepEqual(Object.keys(US_COHORT_GIVEN_NAMES).map(Number),
  [1910,1920,1930,1940,1950,1960,1970,1980]);
 for(const year of YEARS)for(const feminine of [true,false]){
  const pool=usBirthCohortGivenPool(year,feminine);
  assert.equal(pool.length,30);
  assert.equal(new Set(pool).size,30);
  assert.ok(pool.every(x=>/^[A-Z][A-Za-z]+$/.test(x)));
  for(let index=0;index<100;index++){
   const name=drawUSBirthCohortName(19990101,index,year,feminine,index%9);
   assert.ok(pool.includes(name),year+' returned unknown SSA cohort name: '+name);
   assert.equal(drawUSBirthCohortName(19990101,index,year,feminine,index%9),name);
  }
 }
 assert.equal(usBirthCohortGivenPool(1936,false)[0],'Robert');
 assert.equal(usBirthCohortGivenPool(1976,false)[0],'Michael');
 assert.equal(usBirthCohortGivenPool(1976,true)[0],'Jennifer');
 assert.equal(usBirthCohortGivenPool(1945,true)[0],'Mary');
 assert.throws(()=>usBirthCohortGivenPool(1909,false),/1910/);
 assert.throws(()=>usBirthCohortGivenPool(1999,true),/1989/);
});
test('period name rank draw favors top-decile names without odd hash streaks',()=>{
 for(const year of [1916,1936,1946,1955,1966,1975,1982]){
  const pool=usBirthCohortGivenPool(year,false),hits=new Map();
  for(let i=0;i<4000;i++){
   const name=drawUSBirthCohortName(919999,i,year,false);
   hits.set(name,(hits.get(name)||0)+1);
  }
  const firstFive=pool.slice(0,5).reduce((n,p)=>n+(hits.get(p)||0),0);
  const lastFive=pool.slice(-5).reduce((n,p)=>n+(hits.get(p)||0),0);
  assert.ok(firstFive>lastFive*3,'cohort hash draw should respect rank '+year);
  assert.ok((hits.get(pool[0])||0)>(hits.get(pool[29])||0)*3);
 }
});
test('new fictional US identities use the modeled birth decade, never the 1999 newborn cohort',()=>{
 const w=createFictionalWorldNameEngine({worldId:'Decade-Authenticity',seed:19990101});
 assert.match(w.manifest.usBirthCohortNameModel,/SSA_US_1910S_1980S_TOP30/);
 const americans=w.people.filter(p=>p.birthCountry==='US');
 assert.ok(americans.length>6000,'1999 fictional world should still contain a large US cohort after international expansion');
 for(const person of americans){
  assert.equal(person.givenNameDecade,Math.floor(person.birthYear/10)*10);
  assert.equal(person.birthYear+person.ageAtOpening,1999);
  assert.equal(person.nameOrigin,'SSA_US_BIRTH_COHORT_TOP30_RANK_BIASED_EDITORIAL_DRAW');
  const name=person.name.replace(/^Dr\.\s+/,'').split(/\s+/)[0];
  const sourceNames=[...usBirthCohortGivenPool(person.birthYear,true),
   ...usBirthCohortGivenPool(person.birthYear,false)];
  assert.ok(sourceNames.includes(name),
   person.name+' '+person.birthYear+' not in the correct decade');
 }
 for(const person of w.people.filter(p=>p.birthCountry!=='US')){
  assert.equal(person.givenNameDecade,null);
  assert.notEqual(person.nameOrigin,'SSA_US_BIRTH_COHORT_TOP30_RANK_BIASED_EDITORIAL_DRAW');
 }
 const old=americans.filter(p=>p.birthYear>=1930&&p.birthYear<1940);
 const young=americans.filter(p=>p.birthYear>=1970&&p.birthYear<1980);
 assert.ok(old.length>1000&&young.length>400);
 const firstName=p=>p.name.replace(/^Dr\.\s+/,'').split(/\s+/)[0];
 assert.equal(old.filter(p=>firstName(p)==='Jason').length,0);
 assert.ok(young.some(p=>firstName(p)==='Jason'));
 assert.ok(young.some(p=>firstName(p)==='Jennifer'));
});
test('custom fictional world roles retain ages and country mixes with cohorts enabled',()=>{
 const spec={worldId:'Mixed-Racing-01',seed:220044,roles:{
  trainer:150,jockey:160,veterinarian:70,bloodstock_agent:80,
 },owners:100,facilities:{
  generalFarms:20,studFarms:13,nurseries:8,bloodstockFarms:5,breakingTraining:6
 },originWeightsByRole:{
  trainer:[['US',100]],jockey:[['PR',60],['US',40]]
 }};
 const w=createFictionalWorldNameEngine(spec);
 assert.deepEqual(w,createFictionalWorldNameEngine(spec));
 assert.equal(w.people.length,560);
 assert.equal(w.stables.length,150);
 assert.ok(w.people.filter(p=>p.role==='trainer').every(p=>p.birthCountry==='US'));
 assert.ok(w.people.filter(p=>p.role==='trainer').every(p=>p.givenNameDecade));
 assert.ok(w.people.filter(p=>p.role==='jockey').some(p=>p.birthCountry==='PR'));
 assert.ok(w.people.filter(p=>p.role==='jockey').some(p=>p.birthCountry==='US'));
 assert.ok(w.people.every(p=>p.birthYear+ p.ageAtOpening===1999));
});
test('cohort engine has no writes and game generator does not opt in or import new name model',()=>{
 const cohortSource=readFileSync(new URL('../public/1999/engine/person-birth-cohort-names.mjs',import.meta.url),'utf8');
 const gameSource=readFileSync(new URL('../public/1999/engine/founding-world-1999.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(cohortSource,/\b(?:fetch|localStorage|writeFile|indexedDB|setItem)\s*\(/);
 assert.doesNotMatch(gameSource,/person-birth-cohort-names/);
 assert.doesNotMatch(gameSource,/givenPoolAt|givenNameAt/);
});
