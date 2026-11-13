import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 LATIN_CARIBBEAN_NAME_MODEL,REGIONAL_NAMING_ORIGINS,COUNTRY_NAME_PROFILES,
 regionalGivenPool,regionalSurnamePool,drawRegionalGiven,
 drawRegionalSurname,regionalCompoundGiven
} from '../public/1999/engine/latin-caribbean-person-names.mjs';
import {createFictionalWorldNameEngine}
 from '../public/1999/engine/fictional-world-name-engine.mjs';

const zero={generalFarms:0,studFarms:0,nurseries:0,bloodstockFarms:0,breakingTraining:0};
const folded=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[^a-z0-9]+/g,'');
const oneMarket=[{id:'racing-colony',city:'Elmont',region:'New York',
 country:'United States',code:'US',weight:1,racing:true,breeding:false}];

test('all 11 Latin American and Caribbean origin profiles offer country-specific period inventory',()=>{
 assert.match(LATIN_CARIBBEAN_NAME_MODEL,/LATIN_CARIBBEAN_1999/);
 assert.deepEqual([...REGIONAL_NAMING_ORIGINS],
  ['PR','PA','VE','MX','CL','PE','CO','DO','AR','UY','BR']);
 for(const country of REGIONAL_NAMING_ORIGINS){
  const p=COUNTRY_NAME_PROFILES[country];
  assert.ok(p);
  assert.ok(p.oldM.length>=10&&p.youngM.length>=10&&p.oldF.length>=8&&p.youngF.length>=8);
  assert.ok(p.family.length>=13);
  const old=regionalGivenPool(country,1943,false),
   young=regionalGivenPool(country,1975,false);
  assert.ok(old.length>=12&&young.length>=12);
  assert.ok(old.some(x=>!young.includes(x)),'country '+country+' has no older distinctive names');
  assert.ok(young.some(x=>!old.includes(x)),'country '+country+' has no younger distinctive names');
  for(const year of [1939,1951,1969,1980])for(const feminine of [false,true]){
   const pool=regionalGivenPool(country,year,feminine);
   assert.ok(pool.length>10);
   for(let index=0;index<20;index++){
    const name=drawRegionalGiven(19990101,index,country,year,feminine,index%5);
    assert.ok(pool.includes(name),country+' unexpected first name '+name);
    assert.equal(name,drawRegionalGiven(19990101,index,country,year,feminine,index%5));
   }
  }
  const family=regionalSurnamePool(country);
  assert.ok(family.length>=13);
  for(let i=0;i<25;i++)assert.ok(family.includes(drawRegionalSurname(17,i,country,i%3)));
 }
 assert.throws(()=>regionalGivenPool('XX',1950,false),/Unsupported/);
 assert.throws(()=>regionalSurnamePool('US'),/Unsupported/);
 assert.throws(()=>regionalGivenPool('PR',1999,true),/Unsupported/);
});
test('Portuguese Brazilian first names stay separate from generic Spanish-language pool',()=>{
 const male=regionalGivenPool('BR',1977,false);
 assert.ok(male.includes('João'));
 assert.ok(!male.includes('José María'));
 assert.ok(!male.includes('Ángel'));
 assert.ok(!male.includes('Juan'));
 for(let i=0;i<600;i++){
  assert.ok(male.includes(drawRegionalGiven(19990101,i,'BR',1977,false)));
 }
 const female=regionalGivenPool('BR',1937,true);
 assert.ok(female.includes('Terezinha'));
 assert.ok(!female.includes('Guadalupe'));
 assert.equal(regionalCompoundGiven(12,8,'BR','João',1960)?.startsWith('João '),true);
 assert.equal(regionalCompoundGiven(12,8,'MX','José',1960)?.startsWith('José '),true);
 assert.equal(regionalCompoundGiven(12,8,'PR','Nonsense',1960),null);
});
test('all new origin-based naming rules survive full 11,202-person generation without cloning identities',()=>{
 const w=createFictionalWorldNameEngine({worldId:'LatinNameAudit',seed:19990101});
 assert.match(w.manifest.schema,/V5$/);
 assert.equal(w.manifest.latinCaribbeanNameModel,LATIN_CARIBBEAN_NAME_MODEL);
 assert.equal(w.people.length,11202);
 assert.equal(w.owners.length,3308);
 assert.equal(w.stables.length,4200);
 const peopleById=new Map(w.people.map(p=>[p.id,p]));
 const latin=w.people.filter(p=>REGIONAL_NAMING_ORIGINS.includes(p.birthCountry));
 assert.ok(latin.length>1300);
 const names=new Set(),familyNames=new Set();
 let doubles=0,compounds=0,accents=0;
 for(const person of w.people){
  const n=folded(person.name);
  assert.ok(!names.has(n),'accent-folded person name collision '+person.name);
  names.add(n);
  assert.ok(!/\b\d+\b/.test(person.name));
  assert.ok(person.primarySurname,'missing first family surname');
 }
 for(const person of latin){
  if(person.nameStructure==='TWO_SURNAMES'||person.nameStructure==='COMPOUND_GIVEN_TWO_SURNAMES')
   doubles++;
  if(person.nameStructure==='COMPOUND_GIVEN_NAME'||person.nameStructure==='COMPOUND_GIVEN_TWO_SURNAMES')
   compounds++;
  if(/[áéíóúñãõçÁÉÍÓÚÑÃÕÇ]/.test(person.name))accents++;
  assert.equal(person.nameOrigin,'LATIN_CARIBBEAN_1999_CURATED_COUNTRY_COHORT_NOT_CENSUS');
  assert.equal(person.regionalNamingCohort,person.birthYear<1960?'OLDER_BIRTH_COHORT':'YOUNGER_BIRTH_COHORT');
  assert.equal(person.givenNameDecade,null,'non-US birth names must not claim US SSA cohort');
 }
 assert.ok(doubles>250);
 assert.ok(compounds>50);
 assert.ok(accents>100);
 for(const owner of w.owners){
  const person=peopleById.get(owner.principalId);
  assert.equal(person?.organizationId,owner.id);
  assert.equal(person.primarySurname,owner.familyName??person.primarySurname);
  if(owner.familyName)assert.ok(owner.name.startsWith(owner.familyName+' Family '));
 }
 for(const stable of w.stables)assert.equal(peopleById.get(stable.trainerId)?.stableId,stable.id);
 assert.equal(familyNames.size,0);
});
test('country-forced fictional rider colonies maintain paternal/maternal and Brazilian family order',()=>{
 let spanishDoubles=0,brazilDoubles=0;
 for(const country of REGIONAL_NAMING_ORIGINS){
  const w=createFictionalWorldNameEngine({
   worldId:'Riders-'+country,seed:194577,year:1999,roles:{jockey:220},owners:0,
   facilities:zero,markets:oneMarket,
   originWeightsByRole:{jockey:[[country,100]]}
  });
  assert.equal(w.people.length,220);
  const uniqueNames=new Set();
  for(const p of w.people){
   assert.equal(p.birthCountry,country);
   assert.ok(p.primarySurname);
   assert.equal(p.regionalNamingCohort,p.birthYear<1960?'OLDER_BIRTH_COHORT':'YOUNGER_BIRTH_COHORT');
   const key=folded(p.name);
   assert.ok(!uniqueNames.has(key),country+' duplicate regional rider name '+p.name);
   uniqueNames.add(key);
   if(p.nameStructure==='TWO_SURNAMES'){
    if(country==='BR'){
     brazilDoubles++;
     assert.ok(p.name.endsWith(' '+p.primarySurname),
      'Brazilian primary (paternal) family name must appear last '+p.name);
    }else{
     spanishDoubles++;
     assert.ok(p.name.includes(' '+p.primarySurname+' '),
      'Spanish primary (paternal) family name precedes maternal '+p.name);
    }
   }
   assert.equal(p.riderOriginModel,'CUSTOM_ROLE_NAMING_DISTRIBUTION');
  }
 }
 assert.ok(spanishDoubles>400);
 assert.ok(brazilDoubles>40);
});
test('same configuration is reproducible, protected names normalized, original game generator isolated',()=>{
 const config={worldId:'Unchanged-01',seed:41191,roles:{trainer:150,jockey:150},owners:100,
  facilities:{generalFarms:10,studFarms:5,nurseries:2,bloodstockFarms:1,breakingTraining:3},
  markets:oneMarket,originWeightsByRole:{jockey:[['PR',40],['PA',30],['MX',30]]},
  protectedNames:['Jose Garcia','García Racing','Pérez Family Stables','Kingsmere Farm']};
 const a=createFictionalWorldNameEngine(config),b=createFictionalWorldNameEngine(config);
 assert.deepEqual(a,b);
 assert.ok(!a.people.some(p=>folded(p.name)==='josegarcia'));
 assert.ok(!a.owners.some(p=>folded(p.name)==='garciaracing'));
 assert.ok(!a.farms.some(p=>folded(p.name)==='kingsmerefarm'));
 const game=readFileSync(new URL('../public/1999/engine/full-world-generator.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(game,/latin-caribbean-person-names/);
 assert.doesNotMatch(game,/regionalCompoundAt|regionalSecondarySurnameAt|familyPoolAt/);
 const code=readFileSync(new URL('../public/1999/engine/latin-caribbean-person-names.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(code,/\b(?:fetch|localStorage|indexedDB|writeFile|setItem)\s*\(/);
});
