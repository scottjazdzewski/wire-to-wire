import test from 'node:test';
import assert from 'node:assert/strict';
import {plan1999Ecosystem,assignStallionServiceBooks}
 from '../public/1999/engine/fictional-industry-ecosystem-1999.mjs';
test('1999 ecosystem produces bounded non-identical cohort populations',()=>{
 const a=plan1999Ecosystem({seed:19990101});
 const b=plan1999Ecosystem({seed:19990102});
 assert.deepEqual(a,plan1999Ecosystem({seed:19990101}));
 assert.notDeepEqual(a.counts,b.counts);
 assert.ok(a.counts.broodmares>=60000&&a.counts.broodmares<=63000);
 assert.ok(a.counts.stallions>=9000&&a.counts.stallions<=11000);
 assert.ok(a.counts.annualFoals>=48000&&a.counts.annualFoals<=51500);
 assert.ok(a.activeRunnersExcludingTwoYearOlds>=126000);
 assert.ok(a.modeledLivingPopulation>220000);
 assert.ok(a.minimumCoversForTargetFoals<=a.counts.broodmares);
 assert.ok(a.nextSeasonMareTurnover.retired>0);
 assert.ok(a.nextSeasonMareTurnover.graduatedIntoBreeding>0);
 const nextYear=plan1999Ecosystem({seed:19990101,year:2000,
  previousBroodmares:a.nextSeasonMareTurnover.closingBroodmares});
 assert.equal(nextYear.counts.broodmares,
  a.nextSeasonMareTurnover.closingBroodmares);
 assert.notEqual(nextYear.counts.annualFoals,a.counts.annualFoals);
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


test('selected opening worlds scale precisely without counting unborn 1999 foals',()=>{
 for(const size of [10000,25000,87500,150000,325000]){
  const a=plan1999Ecosystem({seed:19990101,targetOpeningHorses:size});
  const b=plan1999Ecosystem({seed:19990101,targetOpeningHorses:size});
  assert.deepEqual(a,b);
  assert.equal(a.openingRegistryHorses,size);
  assert.equal(a.requestedOpeningHorses,size);
  assert.equal(Object.entries(a.counts).filter(([key])=>key!=='annualFoals')
   .reduce((sum,[,count])=>sum+count,0),size);
  assert.ok(Object.entries(a.counts).every(([,n])=>n>0));
  assert.ok(a.minimumCoversForTargetFoals<=a.counts.broodmares);
 }
 assert.throws(()=>plan1999Ecosystem({targetOpeningHorses:73}),/10000–325000/);
 assert.throws(()=>plan1999Ecosystem({targetOpeningHorses:325001}),/10000–325000/);
 assert.throws(()=>plan1999Ecosystem({targetOpeningHorses:20000.5}),/10000–325000/);
});
