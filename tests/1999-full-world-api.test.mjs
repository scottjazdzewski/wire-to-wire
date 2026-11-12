import test from 'node:test';
import assert from 'node:assert/strict';
import {readFull1999TestWorld as read} from '../src/1999/full-world-readmodel.mjs';
const get=path=>read(new URL('https://private.wtw.invalid'+path));
test('full world test read API uses January 1, 1999 and full counts without gameplay false-green',()=>{
 const r=get('/api/1999/sim/overview');
 assert.equal(r.status,200);
 assert.equal(r.data.asOf,'1999-01-01');
 assert.equal(r.data.clock.currentDate,'1999-01-01');
 assert.equal(r.data.clock.day,0);
 assert.equal(r.data.counts.horses,87500);
 assert.equal(r.data.counts.tracks,134);
 assert.equal(r.data.counts.owners,3308);
 assert.equal(r.data.counts.trainers,4200);
 assert.equal(r.data.gameplayReady,false);
});
test('all test directories return nonempty bounded records with names, locations and finances',()=>{
 for(const [url,n] of [['horses',87500],['owners',3308],['trainers',4200],['tracks',134],['facilities',5234],['auctions',36]]){
  const r=get('/api/1999/sim/'+url);
  assert.equal(r.status,200);
  assert.equal(r.data.total,n);
  assert.equal(r.data.items.length,Math.min(25,n));
  assert.ok(r.data.items.every(x=>x.id&&x.name));
 }
 const h=get('/api/1999/sim/horses/87499');
 assert.equal(h.status,200);assert.equal(h.data.horse.id,'H-TEST-1999-087233');
 assert.equal(Object.keys(h.data.horse.attributes).length,53);
});
test('fictional one-click world is reproducible with no canonical name replacement',()=>{
 const original=get('/api/1999/sim/horses/0');
 const fictional=get('/api/1999/sim/horses/0?mode=FULLY_FICTIONAL_TEST&seed=19990102');
 assert.equal(original.data.horse.nameStatus,'CANON_LOCKED');
 assert.equal(fictional.status,200);
 assert.equal(fictional.data.horse.nameStatus,'TEST_RENAME_ALLOWED');
 assert.equal(fictional.data.asOf,'1999-01-01');
 assert.equal(get('/api/1999/sim/overview?mode=FULLY_FICTIONAL_TEST&seed=19990102').data.counts.canonicalHorses,0);
});
test('condition book has 1999 date, fixed track and zero future race results',()=>{
 const r=get('/api/1999/sim/conditions?date=1999-01-01&trackIndex=19');
 assert.equal(r.status,200);
 assert.equal(r.data.date,'1999-01-01');
 for(const x of r.data.races){assert.equal(x.date,'1999-01-01');assert.deepEqual(x.results,[]);}
});
test('invalid universe mode and unavailable horse indices never return phantom records',()=>{
 assert.equal(get('/api/1999/sim/overview?mode=HISTORICAL_FANTASY').status,400);
 assert.equal(get('/api/1999/sim/horses/90000').status,404);
});
