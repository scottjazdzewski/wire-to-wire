import test from 'node:test';
import assert from 'node:assert/strict';
import {plan1999Ecosystem,assignStallionServiceBooks}
 from '../public/1999/engine/fictional-industry-ecosystem-1999.mjs';
test('1999 ecosystem produces bounded non-identical cohort populations',()=>{
 const a=plan1999Ecosystem({seed:19990101});
 const b=plan1999Ecosystem({seed:19990102});
 assert.deepEqual(a,plan1999Ecosystem({seed:19990101}));
 assert.notDeepEqual(a.counts,b.counts);
 assert.ok(a.counts.broodmares>=60000&&a.counts.broodmares<=65000);
 assert.ok(a.counts.stallions>=6500&&a.counts.stallions<=7500);
 assert.ok(a.counts.annualFoals>=48000&&a.counts.annualFoals<=52000);
 assert.ok(a.activeRunnersExcludingTwoYearOlds>=63000);
 assert.ok(a.modeledLivingPopulation>220000);
 assert.ok(a.minimumCoversForTargetFoals<=a.counts.broodmares);
});
test('world size scales every opening cohort without changing identity rules',()=>{
 const small=plan1999Ecosystem({seed:19990101,worldSizePercent:10});
 const full=plan1999Ecosystem({seed:19990101,worldSizePercent:100});
 assert.equal(small.worldSizePercent,10);
 assert.equal(full.worldSizePercent,100);
 const massive=plan1999Ecosystem({seed:19990101,worldSizePercent:121});
 assert.equal(massive.worldSizePercent,121);
 assert.ok(massive.modeledLivingPopulation>320000);
 for(const key of Object.keys(full.counts)){
  assert.ok(small.counts[key]>0);
  assert.ok(small.counts[key]<full.counts[key],key+' should scale down');
 }
 assert.throws(()=>plan1999Ecosystem({worldSizePercent:0}),/Invalid 1999 ecosystem/);
 assert.throws(()=>plan1999Ecosystem({worldSizePercent:122}),/Invalid 1999 ecosystem/);
});
test('stallion books vary including zero covers and large commercial books',()=>{
 const books=assignStallionServiceBooks({
  seed:19990101,stallions:7000,broodmares:63000,targetCovers:59000
 });
 assert.equal(books.books.reduce((a,b)=>a+b,0),59000);
 assert.ok(books.idleStallions>100);
 assert.ok(books.largestBook>=150);
 assert.ok(books.books.every(n=>n>=0&&n<=220));
});
