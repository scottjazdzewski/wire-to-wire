import test from 'node:test';
import assert from 'node:assert/strict';
import {generateProvisional1999HorseNames,
 generateProvisional1999IndustryNameRoster}
 from '../public/1999/game/horse-naming-local-v485.js';

test('opening 1999 industry names exceed 150,000 without collision',()=>{
 const cohort=generateProvisional1999IndustryNameRoster({
  seed:19990101,horseCount:165000
 });
 assert.equal(cohort.names.length,165000);
 assert.equal(new Set(cohort.names.map(x=>x.normalize('NFKD')
  .replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,''))).size,165000);
 assert.ok(cohort.names.every(x=>x.length<=18));
 assert.equal(cohort.provisional,true);
 assert.equal(cohort.editable,true);
 assert.equal(cohort.approvedForRegistration,false);
 assert.match(cohort.algorithmRevision,/OPENING_INDUSTRY_V1/);
});
test('existing small-cohort writer retains the same generated names',()=>{
 const input={seed:19990101,horseCount:80,protectedNames:['Sea Biscuit']};
 const original=generateProvisional1999HorseNames(input);
 const extended=generateProvisional1999IndustryNameRoster(input);
 assert.deepEqual(extended.names,original.names);
 assert.ok(!extended.names.includes('Sea Biscuit'));
});
