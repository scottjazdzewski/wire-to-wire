import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPersistedIndustryHorseDirectory}
 from '../public/next/1999-persisted-world-directory.mjs';

const fixture=()=>{
 const name='Kingsmere';
 const world={entities:{
  horses:[
   {id:'H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000001',name:'First Track',
    ownerId:'O-KINGSMERE',trainerId:'P-KINGSMERE',homeTrackId:'T-1',foalYear:1996},
   {id:'H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000002',name:'Rival Owner',
    ownerId:'O-OTHER',trainerId:'P-KINGSMERE',homeTrackId:'T-1',foalYear:1996},
   {id:'H-FICTIONAL-1999-FOURYEAROLDRUNNERS-0000001',name:'First Track',
    ownerId:'O-KINGSMERE',trainerId:'P-OTHER',homeTrackId:'T-2',foalYear:1995}
  ],organizations:[{id:'O-KINGSMERE',name},{id:'O-OTHER',name:'Other Stable'}],
  people:[{id:'P-KINGSMERE',name:'Kingsmere Trainer',role:'trainer'},
   {id:'P-OTHER',name:'Other Trainer',role:'trainer'}],
  tracks:[{id:'T-1',name:'Test Track 1'},{id:'T-2',name:'Test Track 2'}]
 }};
 return {world,manifest:{worldId:'FICTIONAL-1999-SAVED',horseCount:3}};
};
test('Kingsmere owner-roster fetch uses permanent ownerId and preserves duplicate horse names',()=>{
 const dir=createPersistedIndustryHorseDirectory(fixture());
 const result=dir.browse({filters:{ownerId:'O-KINGSMERE'},limit:160});
 assert.equal(result.total,2);
 assert.deepEqual(result.items.map(h=>h._id),
  ['H-FICTIONAL-1999-FOURYEAROLDRUNNERS-0000001',
   'H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000001']);
 assert.equal(result.items[0].owner,'Kingsmere');
 assert.equal(dir.browse({filters:{ownerId:'O-OTHER'}}).total,1);
});
test('Trainer affiliation is distinct from owner, track and foaling farm',()=>{
 const dir=createPersistedIndustryHorseDirectory(fixture());
 const results=dir.browse({filters:{trainerId:'P-KINGSMERE'}});
 assert.equal(results.total,2);
 assert.equal(results.items[0].owner,'Kingsmere');
 assert.equal(results.items[1].owner,'Other Stable');
 assert.equal(dir.browse({filters:{ownerId:'O-KINGSMERE',
   trainerId:'P-KINGSMERE'}}).total,1);
 assert.equal(dir.browse({filters:{homeTrackId:'T-2'}}).total,1);
 assert.equal(dir.browse({filters:{foalingFarmId:'O-KINGSMERE'}}).total,0);
});
test('Stable UI clearly distinguishes full saved ownership/training rosters from active test runners',()=>{
 const ui=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');
 assert.match(ui,/function savedWorldAffiliationStableView\(\)/);
 assert.match(ui,/APP\.savedStableAffiliation/);
 assert.match(ui,/saved-stable-find/);
 assert.match(ui,/saved-stable-choose/);
 assert.match(ui,/saved-stable-horse/);
 assert.match(ui,/filters:criterion/);
 assert.match(ui,/OWNED BY THIS ORGANIZATION/);
 assert.match(ui,/ACTIVE RACING TEST HORSES/);
 assert.match(ui,/not the separate 30-runner game test/);
 assert.match(ui,/barn housing are different records/);
 assert.match(ui,/saved-world-related-horses/);
 assert.match(ui,/VIEW LINKED HORSES IN STABLE/);
 assert.match(ui,/HORSES BASED AT THIS RACECOURSE/);
});
