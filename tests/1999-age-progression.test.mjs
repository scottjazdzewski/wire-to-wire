import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {create1999Universe} from '../src/1999/full-world-generator.mjs';
import {readFull1999TestWorld} from '../src/1999/full-world-readmodel.mjs';
import {readLocal1999World} from '../public/1999/engine/local-api.mjs';
import {createClean1999Clock,advance1999Clock} from '../public/1999/test-clock.mjs';
import {evaluateAgeAbility,careerAgeAtDate,project1999CareerEntity} from '../public/1999/engine/age-ability.mjs';

const world=create1999Universe(),seed=19990101;
const remote=path=>readFull1999TestWorld(new URL('https://wtw.invalid'+path));

test('calendar drives individual aging without rewriting original horse and jockey identities',()=>{
 const h=world.horseAt(274),j=world.personAt(4202);
 const horseBaseline=JSON.stringify(h),jockeyBaseline=JSON.stringify(j);
 const newHorse=world.projectAtDate(h,'2000-01-01'),olderJockey=world.projectAtDate(j,'2008-07-01');
 assert.equal(newHorse.id,h.id);assert.equal(newHorse.foalYear,h.foalYear);
 assert.equal(newHorse.sireId,h.sireId);assert.equal(newHorse.damId,h.damId);
 assert.equal(newHorse.ageAtOpening,h.ageAtOpening);
 assert.equal(newHorse.ageAtDate,h.ageAtOpening+1);
 assert.equal(newHorse.ability.peakAge,h.ability.peakAge);
 assert.equal(newHorse.ability.peakCeiling,h.ability.peakCeiling);
 assert.equal(newHorse.ability.pedigreeMaturity.sireId,h.ability.pedigreeMaturity.sireId);
 assert.equal(newHorse.ability.pedigreeMaturity.damId,h.ability.pedigreeMaturity.damId);
 assert.equal(newHorse.ability.asOf,'2000-01-01');
 assert.equal(newHorse.ability.current,evaluateAgeAbility(h.ability,careerAgeAtDate(h.ageAtOpening,'2000-01-01')).current);
 assert.equal(olderJockey.id,j.id);
 assert.equal(olderJockey.age,j.age+9);
 assert.equal(olderJockey.ability.peakAge,j.ability.peakAge);
 assert.equal(olderJockey.ability.peakCeiling,j.ability.peakCeiling);
 assert.equal(JSON.stringify(h),horseBaseline,'Original 1999 source cannot change');
 assert.equal(JSON.stringify(j),jockeyBaseline,'Original person cannot change');
 assert.deepEqual(world.projectAtDate(h,'2000-01-01'),newHorse);
});

test('yearly and monthly ability moves follow the SAME curve rather than random redraws',()=>{
 const h=world.horseAt(274),jan=world.projectAtDate(h,'2001-01-01'),
  jun=world.projectAtDate(h,'2001-06-30'),dec=world.projectAtDate(h,'2001-12-31');
 assert.equal(jan.ageAtDate,jun.ageAtDate);
 assert.equal(jan.ageAtDate,dec.ageAtDate);
 assert.ok(jan.ability.age<=jun.ability.age&&jun.ability.age<=dec.ability.age);
 assert.equal(jan.ability.peakAge,dec.ability.peakAge);
 assert.equal(jan.attributes.maturation_curve,dec.attributes.maturation_curve);
 assert.equal(jan.attributes.dirt_aptitude,dec.attributes.dirt_aptitude);
 assert.equal(jan.attributes.soundness_risk,dec.attributes.soundness_risk);
 assert.equal(jan.attributes.fitness,dec.attributes.fitness,'Aging does not invent training/health changes');
 assert.equal(jan.career?.starts,h.career?.starts,'Aging does not invent race results');
});

test('late-career jockeys have no unrealized future ability after their actual peak',()=>{
 let checked=0;
 for(let i=4200;i<6000;i+=9){
  const p=world.personAt(i);
  if(p.role!=='jockey')continue;
  const fiftyDate=(1999+50-p.age)+'-01-01';
  const projected=world.projectAtDate(p,fiftyDate);
  assert.equal(projected.age,50);
  assert.equal(projected.ability.current,projected.ability.potential);
  assert.equal(projected.ability.currentStars,projected.ability.potentialStars);
  checked++;
 }
 assert.ok(checked>=100);
});

test('owner principal, source person and parent horse use one deterministic as-of projection',()=>{
 const owner=world.ownerAt(500),principal=world.projectAtDate(owner,'2006-01-01');
 assert.equal(principal.id,owner.id);
 assert.equal(principal.principalOwnerId,owner.principalOwnerId);
 assert.equal(principal.principalAgeAtDate,owner.principalAge+7);
 assert.equal(principal.principalAbility.peakCeiling,owner.principalAbility.peakCeiling);
 const source=world.sourcePersonAt(0),projected=world.projectAtDate(source,'2002-01-01');
 assert.equal(source.id,projected.id);assert.equal(projected.age,source.age+3);
 const parent=world.parentAt(0,'SIRE'),parentOlder=world.projectAtDate(parent,'2001-01-01');
 assert.equal(parentOlder.ability.peakCeiling,parent.ability.peakCeiling);
 assert.equal(parentOlder.foalYear,parent.foalYear);
});

test('browser + server read models agree on annual game date and preserve opening truth',()=>{
 const date='2002-05-01',query='?offset=275&limit=3&date='+date;
 const browser=readLocal1999World('/api/1999/sim/horses'+query);
 const server=remote('/api/1999/sim/horses'+query);
 assert.equal(server.status,200);
 assert.equal(server.data.asOf,date);
 assert.equal(browser.items.length,3);
 for(let i=0;i<3;i++){
  assert.equal(browser.items[i].ability.current,server.data.items[i].ability.current);
  assert.equal(browser.items[i].ability.potential,server.data.items[i].ability.potential);
  assert.equal(browser.items[i].ageAtDate,server.data.items[i].ageAtDate);
  assert.equal(browser.items[i].id,server.data.items[i].id);
 }
 const people=readLocal1999World('/api/1999/sim/people?offset=4201&limit=5&date='+date);
 assert.ok(people.items.every(x=>x.ability.asOf===date&&x.gameDate===date));
 const owner=readLocal1999World('/api/1999/sim/owners?offset=500&limit=1&date='+date).items[0];
 assert.equal(owner.principalAgeAtDate,world.ownerAt(500).principalAge+3);
 const baseline=readLocal1999World('/api/1999/sim/horses?offset=275&limit=3').items[0];
 assert.equal(baseline.ability.asOf,'1999-01-01');
 assert.equal(baseline.ability.current,world.horseAt(275).ability.current);
});

test('advancing the actual 1999 test clock reaches the new age-projected population',()=>{
 let clock=createClean1999Clock(seed);
 for(let i=0;i<12;i++)clock=advance1999Clock(clock,30);
 const data=readLocal1999World('/api/1999/sim/horses?offset=280&limit=2&date='+clock.currentDate);
 assert.equal(data.items[0].gameDate,clock.currentDate);
 assert.equal(data.items[0].ability.asOf,clock.currentDate);
 assert.equal(data.items[0].ability.peakAge,world.horseAt(280).ability.peakAge);
});

test('invalid future game dates fail rather than inventing a different timeline',()=>{
 for(const date of ['1998-12-31','2001-02-29','2081-01-01','nonsense']){
  assert.throws(()=>project1999CareerEntity(world.horseAt(275),date));
  assert.equal(remote('/api/1999/sim/horses?date='+encodeURIComponent(date)).status,400);
  assert.throws(()=>readLocal1999World('/api/1999/sim/horses?date='+encodeURIComponent(date)));
 }
});

test('premium management adapter and test clock both request dated root projections',()=>{
 const app=readFileSync(new URL('../public/1999/app.mjs',import.meta.url),'utf8');
 const adapter=readFileSync(new URL('../public/next/1999-ui-source.mjs',import.meta.url),'utf8');
 const next=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');
 assert.match(app,/date:clock.currentDate/);
 assert.match(adapter,/function setGameDate\(date\)/);
 assert.match(adapter,/records.clear\(\);departmentCache.clear\(\)/);
 assert.match(next,/setGameDate\?\.\(depGameDay\(\)\)/);
});
