import test from 'node:test';
import assert from 'node:assert/strict';
import {createFoundingSourceBase1999} from '../public/1999/engine/founding-source-base-1999.mjs';
import {createFounding1999Universe} from '../public/1999/engine/founding-world-1999.mjs';
import {trackConditionProfile1999} from '../public/next/1999-condition-book-engine.mjs';
import {openingWorld1999 as source} from '../src/1999/opening-world.v1.mjs';

const browser=createFounding1999Universe({seed:19990101});
const server=createFoundingSourceBase1999({seed:19990101});
function card(world,sourceId,date){
 const index=Array.from({length:world.counts.tracks},(_,i)=>world.trackAt(i)).findIndex(t=>t.sourceTrackId===sourceId);
 assert.ok(index>=0,'track missing: '+sourceId);
 return world.conditionBook(date,index);
}
const summary=r=>({date:r.date,trackId:r.trackId,number:r.number,name:r.name,purse:r.purse,
 surface:r.surface,distanceFurlongs:r.distanceFurlongs,stakeId:r.stakeId||null});

test('all 118 playable tracks have tiered class/purse and volume profiles',()=>{
 assert.equal(browser.counts.tracks,118);
 const premier=trackConditionProfile1999('T-0013'),local=trackConditionProfile1999('T-0048'),
 fair=trackConditionProfile1999('T-0042'),fiction=trackConditionProfile1999('T-0094');
 assert.equal(premier.tier,'PREMIER');
 assert.equal(local.tier,'LOCAL');
 assert.equal(fair.tier,'FAIR');
 assert.equal(fiction.tier,'GROWTH');
 assert.ok(premier.purses.msw>local.purses.msw*2);
 assert.ok(local.purses.msw>fair.purses.msw);
 assert.ok(premier.typicalRaces>local.typicalRaces);
 assert.ok(local.typicalRaces>=fair.typicalRaces);
 for(let i=0;i<browser.counts.tracks;i++){
  const track=browser.trackAt(i),p=trackConditionProfile1999(track.sourceTrackId);
  assert.ok(p,'no racing identity: '+track.id);
  assert.equal(track.racing.programTier,p.tier);
  assert.ok(p.purses.msw>p.purses.mdn);
 }
});
test('distinct 1999 course cards have consecutive race numbers and no manufactured results',()=>{
 for(const [id,day] of [['T-0013','1999-05-01'],['T-0001','1999-01-01'],
  ['T-0048','1999-01-02'],['T-0021','1999-04-10'],
  ['T-0046','1999-09-11'],['T-0094','1999-04-10'],['T-0102','1999-02-06']]){
  const races=card(browser,id,day);
  assert.ok(races.length>=6,id+' no 1999 racing on '+day);
  assert.deepEqual(races.map(x=>x.number),Array.from({length:races.length},(_,i)=>i+1));
  assert.equal(new Set(races.map(x=>x.id)).size,races.length);
  for(const r of races){
   assert.ok(r.purse>0);
   assert.ok(r.fieldCapacity>=8&&r.fieldCapacity<=14);
   assert.ok(r.fullConditions);
   assert.equal(r.status,'CONDITION_BOOK_PROPOSAL_NOT_RUN');
   assert.deepEqual(r.currentEntries,[]);
   assert.deepEqual(r.results,[]);
  }
  assert.deepEqual(races.map(summary),card(server,id,day).map(summary),'browser/server drift '+id);
 }
});
test('historical stakes and WTW features take one numbered race slot, not an extra card',()=>{
 const derby=card(browser,'T-0013','1999-05-01');
 const race=derby.find(r=>r.stakeId==='STK-0001');
 assert.ok(race,'Kentucky Derby not in 1999-05-01 Churchill card');
 assert.equal(race.stakeName,'Kentucky Derby');
 assert.equal(race.purse,1250000);
 assert.ok(race.number>=1&&race.number<=derby.length);
 assert.equal(derby.filter(r=>r.stakeId==='STK-0001').length,1);
 assert.equal(card(browser,'T-0014','1999-04-18').filter(r=>r.stakeId==='STK-0015').length,1);
 assert.equal(card(browser,'T-0102','1999-02-06').filter(r=>r.stakeId==='STK-0093').length,1);
 assert.equal(source.stakes1999.find(r=>r.id==='STK-0001').localDate,'1999-05-01');
});
test('racing only on meet days, and only on available course surfaces',()=>{
 assert.deepEqual(card(browser,'T-0021','1999-01-01'),[]);
 assert.deepEqual(card(browser,'T-0014','1999-04-04'),[]);
 assert.ok(card(browser,'T-0021','1999-04-10').every(x=>x.surface==='DIRT'));
 assert.ok(card(browser,'T-0046','1999-09-11').every(x=>x.surface==='TURF'));
 assert.deepEqual(card(browser,'T-0013','1999-05-01').map(summary),
  card(browser,'T-0013','1999-05-01').map(summary),'repeat seed drift');
});
test('fully fictional mode has no canonical/source stakes on its test cards',()=>{
 const w=browserUniverse({seed:19990101,mode:'FULLY_FICTIONAL_TEST'});
 const races=card(w,'T-0013','1999-05-01');
 assert.ok(races.length>=6);
 assert.equal(races.filter(x=>x.stakeId).length,0);
});
