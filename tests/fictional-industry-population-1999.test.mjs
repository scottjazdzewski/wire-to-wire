import test from 'node:test';
import assert from 'node:assert/strict';
import {INDUSTRY_POPULATION_1999,calculate1999IndustryPopulation,
 validate1999IndustryPopulation} from '../public/1999/engine/fictional-industry-population-1999.mjs';
test('1999 industry accounts for 248,000 horses without double-counting age cohorts',()=>{
 validate1999IndustryPopulation();
 const p=calculate1999IndustryPopulation();
 assert.equal(p.breeding,55000);
 assert.equal(p.youngstock,118000);
 assert.equal(p.older,75000);
 assert.equal(p.total,248000);
 assert.equal(p.twoYearOldRetention,.95);
 assert.equal(INDUSTRY_POPULATION_1999.naming.youngstock,'ID_ONLY_UNTIL_RACING_NAME_REQUEST');
});
test('industry population rejects impossible same-cohort births without migration',()=>{
 assert.throws(()=>validate1999IndustryPopulation({
  ...INDUSTRY_POPULATION_1999,
  youngstock:{...INDUSTRY_POPULATION_1999.youngstock,twoYearOlds:50000}
 }),/Cohort exceeds/);
});
