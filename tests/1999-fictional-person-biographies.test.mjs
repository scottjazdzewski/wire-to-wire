import test from 'node:test';
import assert from 'node:assert/strict';
import {completeFictionalPersonBiographiesV1,
 auditFictionalPersonBiographiesV1} from '../public/1999/engine/fictional-person-biographies-v1.mjs';

const source=[
 {id:'WTWFI-TRAINER-1',name:'Marisol Vega',role:'Trainer',birthYear:1960,
  ageAtOpening:38,birthCountry:'CU',location:{city:'Miami',state:'Florida',countryCode:'US'}},
 {id:'WTWFI-JOCKEY-1',name:'Helen Carter',role:'Jockey',birthYear:1972,
  ageAtOpening:26,birthCountry:'US',date_of_birth:'1972-03-04',
  birthplace:{city:'Lexington',region:'Kentucky',country_code:'US'},
  location:{city:'Saratoga Springs',state:'New York',countryCode:'US'}}
];

test('fictional people receive deterministic full birthdays, birthplaces and separate work bases',()=>{
 const people=completeFictionalPersonBiographiesV1({people:source,seed:19990101});
 const repeat=completeFictionalPersonBiographiesV1({people:source,seed:19990101});
 assert.deepEqual(people,repeat);
 assert.match(people[0].date_of_birth,/^\d{4}-\d{2}-\d{2}$/);
 assert.equal(people[0].biography.age_at_opening,38);
 assert.equal(people[0].birthplace.country_code,'CU');
 assert.deepEqual(people[0].work_location,source[0].location);
 assert.equal(people[1].date_of_birth,'1972-03-04');
 assert.equal(people[1].birthplace.city,'Lexington');
 assert.equal(people[1].biography.age_at_opening,26);
 assert.deepEqual(auditFictionalPersonBiographiesV1({people}),
  {schema:'WTW_FICTIONAL_PERSON_BIOGRAPHIES_V1',valid:true,total:2,issues:[]});
});

test('biography generation rejects duplicate IDs and unsupported origin codes',()=>{
 assert.throws(()=>completeFictionalPersonBiographiesV1({people:[source[0],source[0]],seed:1}),/Duplicate fictional person/);
 assert.throws(()=>completeFictionalPersonBiographiesV1({people:[{...source[0],birthCountry:'XX'}],seed:1}),/No locally modeled birthplace/);
});
