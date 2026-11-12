import test from 'node:test';
import assert from 'node:assert/strict';
import {create1999Universe} from '../src/1999/full-world-generator.mjs';
import {create1999Universe as createBrowserWorld} from '../public/1999/engine/full-world-generator.mjs';
import {meetProgramPhase1999,trackConditionProfile1999} from '../public/next/1999-condition-book-engine.mjs';
import {trackMeetOpen1999} from '../public/next/1999-track-program.mjs';

const world=create1999Universe({seed:19990101,mode:'CANON_ANCHORED_TEST'});
const indexes=new Map(Array.from({length:world.counts.tracks},(_,i)=>[world.trackAt(i).sourceTrackId,i]));
const card=(id,date)=>world.conditionBook(date,indexes.get(id));
test('meet planning progresses independently within each meet and resets at the next meet',()=>{
 const early=meetProgramPhase1999('T-0014','1999-04-02');
 const later=meetProgramPhase1999('T-0014','1999-04-23');
 const autumn=meetProgramPhase1999('T-0014','1999-10-09');
 assert.equal(early.meetNumber,1);
 assert.equal(early.meetWeek,undefined);
 assert.equal(early.week,1);
 assert.equal(early.phase,'OPENING');
 assert.equal(later.phase,'CLOSING');
 assert.ok(later.week>early.week);
 assert.equal(autumn.meetNumber,2);
 assert.equal(autumn.week,1);
 assert.equal(autumn.phase,'OPENING');
 assert.equal(meetProgramPhase1999('T-0014','1999-04-04'),null,'dark day cannot gain racing program');
});
test('weekly programs rotate themes and 1999 winter cards have no two-year-old races',()=>{
 const weeks=['1999-04-02','1999-04-09','1999-04-16','1999-04-23'].map(x=>meetProgramPhase1999('T-0014',x));
 assert.deepEqual(weeks.map(x=>x.week),[1,2,3,4]);
 assert.equal(new Set(weeks.map(x=>x.theme)).size,4);
 const jan=card('T-0001','1999-01-01');
 assert.ok(jan.length>0);
 assert.ok(jan.every(r=>r.ageRequirement!=='2YO'));
 const races=['1999-08-07','1999-08-14','1999-08-21'].flatMap(day=>{
  assert.ok(trackMeetOpen1999('T-0003',day));
  return card('T-0003',day);
 });
 const juvenile=races.filter(x=>x.ageRequirement==='2YO'&&!x.stakeId);
 assert.ok(juvenile.length>0,'summer juvenile program should open');
 assert.ok(juvenile.every(x=>x.distanceFurlongs>=5&&x.distanceFurlongs<=8.5));
});
test('condition books carry meet phase, weekly theme and do not infer demand from total horse population',()=>{
 const worldPopulation=createBrowserWorld({seed:19990101,mode:'CANON_ANCHORED_TEST'}).counts;
 assert.ok(worldPopulation.worldHorses>worldPopulation.horses,'world horse population must include non-racing cohorts');
 assert.equal(world.counts.horses,87500);
 assert.equal(world.counts.tracks,118);
 for(const [id,date] of [['T-0014','1999-04-02'],['T-0014','1999-04-23'],
  ['T-0021','1999-04-10'],['T-0003','1999-08-07'],['T-0094','1999-04-10']]){
  const races=card(id,date);
  assert.ok(races.length>=6&&races.length<=16,id+' card volume out of bounds');
  const meet=meetProgramPhase1999(id,date);
  for(const race of races){
   assert.equal(race.meetWeek,meet.week);
   assert.equal(race.meetPhase,meet.phase);
   assert.equal(race.weeklyProgramTheme,meet.theme);
   assert.equal(race.eligibleRunnerDemandStatus,'NOT_CALCULATED_FROM_TOTAL_WORLD_POPULATION');
   assert.equal(race.currentEntries.length,0);
   assert.equal(race.results.length,0);
  }
 }
});
test('meet progression stays within each track purse tier and does not alter named stakes',()=>{
 const id='T-0013',date='1999-05-01';
 const derby=card(id,date).find(r=>r.stakeId==='STK-0001');
 assert.ok(derby);
 assert.equal(derby.purse,1250000);
 assert.equal(derby.name,'Kentucky Derby');
 const profile=trackConditionProfile1999(id);
 assert.equal(profile.tier,'PREMIER');
 const cardRaces=card(id,date);
 assert.ok(cardRaces.some(r=>!r.stakeId&&r.purse<derby.purse));
 assert.deepEqual(cardRaces.map(r=>r.number),cardRaces.map((_,i)=>i+1));
 const fairy=card('T-0046','1999-09-11');
 assert.ok(fairy.every(r=>r.surface==='TURF'));
});
