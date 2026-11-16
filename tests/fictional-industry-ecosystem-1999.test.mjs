import test from 'node:test';
import assert from 'node:assert/strict';
import {plan1999Ecosystem,assignStallionServiceBooks,
 planAnnualYoungHorseAttrition,planAnnualBroodmareTurnover,
 planAnnualStallionTurnover,planAnnual1999BreedingMarket}
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
test('young-horse attrition varies by seed and season within survival bands',()=>{
 for(const [stage,cohortSize,min,max] of [
  ['FOAL_TO_YEARLING',50000,.03,.05],
  ['YEARLING_TO_TWO_YEAR_OLD',48000,.04,.08]
 ]){
  const first=planAnnualYoungHorseAttrition({seed:19990101,year:2000,
   stage,candidateCount:cohortSize});
  const next=planAnnualYoungHorseAttrition({seed:19990101,year:2001,
   stage,candidateCount:cohortSize});
  const otherSeed=planAnnualYoungHorseAttrition({seed:19990102,year:2000,
   stage,candidateCount:cohortSize});
  assert.deepEqual(first,planAnnualYoungHorseAttrition({seed:19990101,
   year:2000,stage,candidateCount:cohortSize}));
  for(const result of [first,next,otherSeed]){
   assert.ok(result.mortalityRate>=min&&result.mortalityRate<=max);
   assert.equal(result.deaths+result.survivors,cohortSize);
   assert.ok(result.deaths>0&&result.survivors>0);
  }
  assert.notEqual(first.deaths,next.deaths,'seasonal losses should vary');
  assert.notEqual(first.deaths,otherSeed.deaths,'seeded losses should vary');
 }
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

test('breeding totals and turnover respond to purse demand and horse supply',()=>{
 const strong=planAnnual1999BreedingMarket({seed:19990101,year:2008,
  averagePurseStrength:90,broodmares:2000,stallions:250,
  racingPopulation:5000,previousLiveFoals:1000,referenceBroodmares:2000});
 const soft=planAnnual1999BreedingMarket({seed:19990101,year:2008,
  averagePurseStrength:20,broodmares:2400,stallions:400,
  racingPopulation:9000,previousLiveFoals:1900,referenceBroodmares:2000});
 assert.ok(strong.marketIndex>soft.marketIndex);
 assert.ok(strong.provenance.includes('TRACK_PURSE_STRENGTH'));
 const strongMares=planAnnualBroodmareTurnover({seed:19990101,year:2008,
  broodmares:2000,eligibleFemalePopulation:1000,marketIndex:strong.marketIndex});
 const softMares=planAnnualBroodmareTurnover({seed:19990101,year:2008,
  broodmares:2000,eligibleFemalePopulation:1000,marketIndex:soft.marketIndex});
 assert.ok(strongMares.graduationRate>softMares.graduationRate);
 assert.ok(strongMares.retirementRate<softMares.retirementRate);
 const strongStallions=planAnnualStallionTurnover({seed:19990101,year:2008,
  stallions:220,eligibleMalePopulation:500,targetCovers:2200,
  marketIndex:strong.marketIndex});
 const softStallions=planAnnualStallionTurnover({seed:19990101,year:2008,
  stallions:220,eligibleMalePopulation:500,targetCovers:2200,
  marketIndex:soft.marketIndex});
 assert.ok(softStallions.marketRetirements>strongStallions.marketRetirements);
 assert.notEqual(strongStallions.targetActiveStallions,
  planAnnualStallionTurnover({seed:19990101,year:2008,stallions:220,
   eligibleMalePopulation:500,targetCovers:1600,
   marketIndex:strong.marketIndex}).targetActiveStallions);
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

test('seeded foal forecasts vary by world and season at small, default, and maximum sizes',()=>{
 for(const size of [10000,300000,325000]){
  const crops=[];
  const bySeed=new Map(),byYear=new Map();
  for(const seed of [19990101,19990102,20371109])for(const year of [1999,2000,2001]){
   const plan=plan1999Ecosystem({seed,year,targetOpeningHorses:size});
   assert.equal(plan.openingRegistryHorses,size);
   assert.equal(plan.requestedOpeningHorses,size);
   assert.equal(plan.counts.annualFoals,
    plan1999Ecosystem({seed,year,targetOpeningHorses:size}).counts.annualFoals);
   assert.ok(plan.nextSeasonMareTurnover.retired>0);
   assert.ok(plan.nextSeasonMareTurnover.graduatedIntoBreeding>0);
   assert.equal(plan.nextSeasonMareTurnover.closingBroodmares,
    plan.nextSeasonMareTurnover.openingBroodmares-
    plan.nextSeasonMareTurnover.retired+
    plan.nextSeasonMareTurnover.graduatedIntoBreeding);
   crops.push(plan.counts.annualFoals);
   if(!bySeed.has(seed))bySeed.set(seed,[]);
   bySeed.get(seed).push(plan.counts.annualFoals);
   if(!byYear.has(year))byYear.set(year,[]);
   byYear.get(year).push(plan.counts.annualFoals);
  }
  const opening=plan1999Ecosystem({seed:19990111,year:1999,
   targetOpeningHorses:size});
  const nextSeason=plan1999Ecosystem({seed:19990111,year:2000,
   previousBroodmares:opening.nextSeasonMareTurnover.closingBroodmares,
   worldScale:opening.worldScale});
  assert.equal(nextSeason.counts.broodmares,
   opening.nextSeasonMareTurnover.closingBroodmares);
  assert.ok(nextSeason.counts.annualFoals>0);
  assert.ok(nextSeason.nextSeasonMareTurnover.graduatedIntoBreeding>0);
  assert.ok(nextSeason.nextSeasonMareTurnover.graduatedIntoBreeding<
   nextSeason.counts.annualFoals);
  assert.ok([...bySeed.values()].every(values=>new Set(values).size>1),
   `annual foal forecast must vary by year for ${size}-horse world`);
  assert.ok([...byYear.values()].every(values=>new Set(values).size>1),
   `annual foal forecast must vary by seed for ${size}-horse world`);
  assert.ok(crops.every(count=>count>0));
 }
});
