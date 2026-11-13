import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 INTERNATIONAL_NAME_CULTURE_MODEL,INTERNATIONAL_NAME_CULTURE_PROFILES,
 supportsInternationalSubculture,chooseInternationalNameCulture,
 culturallyConditionedGivenPool,culturallyConditionedSurnamePool,
 drawCulturallyConditionedGiven,drawCulturallyConditionedSurname
} from '../public/1999/engine/international-name-cultures.mjs';
import {createFictionalWorldNameEngine}
 from '../public/1999/engine/fictional-world-name-engine.mjs';

const folded=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[^a-z0-9]+/g,'');
const zero={generalFarms:0,studFarms:0,nurseries:0,bloodstockFarms:0,breakingTraining:0};
const races=[{id:'lex-ky',city:'Lexington',region:'Kentucky',
 country:'United States',code:'US',weight:1,breeding:true,racing:true}];

test('Canadian and British name-subculture pools are internally consistent and draw deterministically',()=>{
 assert.match(INTERNATIONAL_NAME_CULTURE_MODEL,/CA_GB_PERSON_NAME_CULTURES_V1/);
 assert.equal(supportsInternationalSubculture('CA'),true);
 assert.equal(supportsInternationalSubculture('GB'),true);
 for(const unsupported of ['IE','JP','FR','US','AE','HK'])
  assert.equal(supportsInternationalSubculture(unsupported),false);
 const allowed={CA:['CA_EN','CA_FR'],GB:['GB_EN','GB_SCOT','GB_WALES']};
 for(const [country,cultures] of Object.entries(allowed)){
  for(let i=0;i<200;i++){
   const culture=chooseInternationalNameCulture(19990101,i,country);
   assert.ok(cultures.includes(culture));
   assert.equal(culture,chooseInternationalNameCulture(19990101,i,country));
  }
  for(const culture of cultures){
   const profile=INTERNATIONAL_NAME_CULTURE_PROFILES[culture];
   assert.ok(profile);
   for(const birthYear of [1935,1970])for(const feminine of [false,true]){
    const given=culturallyConditionedGivenPool(country,culture,birthYear,feminine);
    assert.ok(given.length>=7);
    assert.equal(new Set(given.map(folded)).size,given.length);
    for(let i=0;i<25;i++){
     const selected=drawCulturallyConditionedGiven(19990101,i,country,culture,birthYear,feminine,i%3);
     assert.ok(given.includes(selected));
     assert.equal(selected,drawCulturallyConditionedGiven(19990101,i,country,culture,birthYear,feminine,i%3));
    }
   }
   const surnames=culturallyConditionedSurnamePool(country,culture);
   assert.ok(surnames.length>=14);
   assert.equal(new Set(surnames.map(folded)).size,surnames.length);
   for(let i=0;i<25;i++)assert.ok(
    surnames.includes(drawCulturallyConditionedSurname(19990101,i,country,culture,i%4)));
  }
 }
 assert.throws(()=>chooseInternationalNameCulture(1,2,'JP'),/No Canada/);
 assert.throws(()=>culturallyConditionedSurnamePool('CA','GB_SCOT'),/mismatch/);
 assert.throws(()=>culturallyConditionedGivenPool('GB','GB_EN',2005,false),/Unsupported fictional/);
});
test('same fictional person uses one Canadian/British culture for given AND family name',()=>{
 const w=createFictionalWorldNameEngine({worldId:'CA-GB-1999',seed:19990101,
  roles:{trainer:290,bloodstock_agent:280},owners:200,
  facilities:zero,markets:races,
  originWeightsByRole:{
   trainer:[['CA',100]],bloodstock_agent:[['GB',100]],owner:[['CA',100]]
  }});
 assert.equal(w.people.length,770);
 assert.equal(w.manifest.internationalNameCultureModel,INTERNATIONAL_NAME_CULTURE_MODEL);
 const groups={};
 const unique=new Set();
 for(const person of w.people){
  const country=person.birthCountry,culture=person.internationalNameCulture;
  assert.ok(supportsInternationalSubculture(country));
  assert.ok(culture.startsWith(country+'_'));
  groups[culture]=(groups[culture]||0)+1;
  const pool=culturallyConditionedGivenPool(country,culture,person.birthYear,true)
   .concat(culturallyConditionedGivenPool(country,culture,person.birthYear,false));
  const first=person.name.replace(/^Dr\.\s+/,'').split(/\s+/)[0];
  assert.ok(pool.includes(first),'mixed given-name culture: '+person.name+' '+culture);
  assert.ok(culturallyConditionedSurnamePool(country,culture).includes(person.primarySurname),
   'mixed family-name culture: '+person.name+' '+culture);
  const key=folded(person.name);
  assert.ok(!unique.has(key),'duplicate person '+person.name);
  unique.add(key);
 }
 assert.ok(groups.CA_EN>250);
 assert.ok(groups.CA_FR>50);
 assert.ok(groups.GB_EN>180);
 assert.ok(groups.GB_SCOT>10);
 assert.ok(groups.GB_WALES>=3);
 assert.deepEqual(w,createFictionalWorldNameEngine({worldId:'CA-GB-1999',seed:19990101,
  roles:{trainer:290,bloodstock_agent:280},owners:200,
  facilities:zero,markets:races,originWeightsByRole:{
   trainer:[['CA',100]],bloodstock_agent:[['GB',100]],owner:[['CA',100]]
  }}));
});
test('large 1999 population maintains correct owner/stable links and no accent-folded duplicates',()=>{
 const w=createFictionalWorldNameEngine({worldId:'CA-GB-Population',seed:19990101});
 assert.equal(w.people.length,11202);
 assert.equal(w.owners.length,3308);
 assert.equal(w.stables.length,4200);
 assert.equal(new Set(w.people.map(p=>folded(p.name))).size,w.people.length);
 const people=new Map(w.people.map(p=>[p.id,p]));
 const canadian=w.people.filter(p=>p.birthCountry==='CA');
 const british=w.people.filter(p=>p.birthCountry==='GB');
 assert.ok(canadian.some(p=>p.internationalNameCulture==='CA_FR'));
 assert.ok(canadian.some(p=>p.internationalNameCulture==='CA_EN'));
 assert.ok(british.some(p=>p.internationalNameCulture==='GB_SCOT'));
 assert.ok(british.some(p=>p.internationalNameCulture==='GB_WALES'));
 for(const owner of w.owners){
  assert.equal(people.get(owner.principalId)?.organizationId,owner.id);
  if(owner.familyName)assert.equal(owner.familyName,people.get(owner.principalId).primarySurname);
 }
 for(const stable of w.stables)assert.equal(people.get(stable.trainerId)?.stableId,stable.id);
});
test('subculture selector cannot mutate the game or alter existing 1999 population generator',()=>{
 const code=readFileSync(new URL('../public/1999/engine/international-name-cultures.mjs',import.meta.url),'utf8');
 const current=readFileSync(new URL('../public/1999/engine/full-world-generator.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(code,/\b(?:fetch|localStorage|indexedDB|writeFile|setItem)\s*\(/);
 assert.doesNotMatch(current,/international-name-cultures/);
 assert.doesNotMatch(current,/chooseInternationalNameCulture|culturallyConditionedGivenPool/);
});
