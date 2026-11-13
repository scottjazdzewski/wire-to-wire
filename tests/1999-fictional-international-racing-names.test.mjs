import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 INTERNATIONAL_RACING_NAME_MODEL,INTERNATIONAL_NAMING_ORIGINS,
 INTERNATIONAL_CULTURE_PROFILES,INTERNATIONAL_ROLE_ORIGIN_MIXES,
 internationalCulture,internationalGivenPool,internationalSurnamePool,
 drawInternationalGiven,drawInternationalSurname,internationalProfessionOrigin,
 internationalNameDisplayConvention
} from '../public/1999/engine/international-racing-person-names.mjs';
import {createFictionalWorldNameEngine,normalizeFictionalWorldNamingSpec}
 from '../public/1999/engine/fictional-world-name-engine.mjs';

const folded=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[^a-z0-9]+/g,'');
const zero={generalFarms:0,studFarms:0,nurseries:0,bloodstockFarms:0,breakingTraining:0};
const singleMarket=[{id:'single-race-market',city:'Lexington',region:'Kentucky',
 country:'United States',code:'US',weight:1,racing:true,breeding:true}];
const supportedCulture=(country,cultureKey)=>
 country===cultureKey||
 country==='CA'&&['CA_EN','CA_FR'].includes(cultureKey)||
 country==='GB'&&['GB_EN','GB_SCOT','GB_WALES'].includes(cultureKey);

test('all curated international culture profiles are usable, cohort-aware and nonempty',()=>{
 assert.match(INTERNATIONAL_RACING_NAME_MODEL,/INTERNATIONAL_PROFESSION_NAMES/);
 assert.deepEqual([...INTERNATIONAL_NAMING_ORIGINS],
  ['CA','GB','IE','FR','DE','AU','NZ','JP','AE','SA']);
 for(const [cultureKey,p] of Object.entries(INTERNATIONAL_CULTURE_PROFILES)){
  assert.ok(p.oldM.length>=9,cultureKey+' older male pool');
  assert.ok(p.youngM.length>=9,cultureKey+' younger male pool');
  assert.ok(p.oldF.length>=7,cultureKey+' older female pool');
  assert.ok(p.youngF.length>=7,cultureKey+' younger female pool');
  assert.ok(p.families.length>=12,cultureKey+' family pool');
  for(const list of [p.oldM,p.youngM,p.oldF,p.youngF,p.families]){
   assert.equal(new Set(list.map(folded)).size,list.length,
    cultureKey+' duplicated spellings inside a single pool');
  }
 }
 for(const country of INTERNATIONAL_NAMING_ORIGINS){
  const cultureKey=internationalCulture(19,10,country);
  assert.ok(supportedCulture(country,cultureKey));
  const surnames=internationalSurnamePool(country,cultureKey);
  assert.ok(surnames.length>=12);
  for(const ageYear of [1937,1978])for(const feminine of [false,true]){
   const pool=internationalGivenPool(country,cultureKey,ageYear,feminine);
   assert.ok(pool.length>=7);
   for(let i=0;i<40;i++){
    const name=drawInternationalGiven(18,i,country,cultureKey,ageYear,feminine,i%5);
    assert.ok(pool.includes(name),country+' not in compatible given pool '+name);
    assert.equal(name,drawInternationalGiven(18,i,country,cultureKey,ageYear,feminine,i%5));
   }
  }
  for(let i=0;i<20;i++)
   assert.ok(surnames.includes(drawInternationalSurname(44,i,country,cultureKey,i%5)));
 }
 assert.throws(()=>internationalCulture(1,1,'ZZ'),/Unsupported/);
 assert.throws(()=>internationalGivenPool('CA','JP',1947,false),/mismatch/);
 assert.throws(()=>internationalSurnamePool('GB','CA_FR'),/Unsupported/);
 assert.throws(()=>internationalGivenPool('IE','IE',1904,false),/Unsupported/);
});

test('international profession weights preserve an international bloodstock trade without pretending to be census',()=>{
 for(const role of ['trainer','owner','bloodstock_agent']){
  const mix=INTERNATIONAL_ROLE_ORIGIN_MIXES[role];
  assert.equal(mix.reduce((n,p)=>n+p[1],0),100,role);
  assert.equal(new Set(mix.map(x=>x[0])).size,mix.length,role+' duplicate origin');
  assert.ok(mix.some(p=>p[0]==='US'));
  for(let i=0;i<100;i++){
   const c=internationalProfessionOrigin(19990101,i,role);
   assert.ok(mix.some(pair=>pair[0]===c));
   assert.equal(c,internationalProfessionOrigin(19990101,i,role));
  }
 }
 assert.equal(internationalProfessionOrigin(12,1,'groom'),null);
 const britishIrish=mix=>mix.filter(([code])=>['GB','IE'].includes(code))
  .reduce((n,[,weight])=>n+weight,0);
 assert.ok(britishIrish(INTERNATIONAL_ROLE_ORIGIN_MIXES.bloodstock_agent)>=
  britishIrish(INTERNATIONAL_ROLE_ORIGIN_MIXES.trainer)*2);
 assert.ok(INTERNATIONAL_ROLE_ORIGIN_MIXES.owner.some(([country])=>country==='AE'));
 assert.ok(INTERNATIONAL_ROLE_ORIGIN_MIXES.owner.some(([country])=>country==='JP'));
 assert.equal(internationalNameDisplayConvention('JP'),'GIVEN_FAMILY_ROMANIZED_NA_DIRECTORY');
 assert.equal(internationalNameDisplayConvention('AE'),'GIVEN_FAMILY_ARABIC_TRANSLITERATION');
});

test('full-size fictional world gives profession-specific international diversity without breaking earlier naming populations',()=>{
 const w=createFictionalWorldNameEngine({worldId:'InternationalNames',seed:19990101});
 assert.match(w.manifest.schema,/V6$/);
 assert.equal(w.manifest.internationalProfessionNameModel,INTERNATIONAL_RACING_NAME_MODEL);
 assert.equal(w.people.length,11202);
 assert.equal(w.owners.length,3308);
 assert.equal(w.stables.length,4200);
 const names=new Set(),byId=new Map(w.people.map(p=>[p.id,p]));
 const intern=w.people.filter(p=>INTERNATIONAL_NAMING_ORIGINS.includes(p.birthCountry));
 assert.ok(intern.length>1300,'expected significant international personnel representation');
 for(const p of w.people){
  const key=folded(p.name);
  assert.ok(!names.has(key),'accent-normalized duplicate '+p.name);
  names.add(key);
  assert.ok(p.primarySurname);
  assert.equal(p.birthYear+p.ageAtOpening,1999);
 }
 const ca=intern.filter(p=>p.birthCountry==='CA'),ire=intern.filter(p=>p.birthCountry==='IE');
 assert.ok(ca.length>400);
 assert.ok(ire.length>200);
 assert.ok(ca.some(p=>p.internationalNameCulture==='CA_FR'));
 assert.ok(ca.some(p=>p.internationalNameCulture==='CA_EN'));
 assert.ok(ire.some(p=>p.primarySurname.includes("'")));
 for(const p of intern){
  assert.ok(supportedCulture(p.birthCountry,p.internationalNameCulture));
  assert.equal(p.nameOrigin,'CURATED_INTERNATIONAL_1999_COUNTRY_CULTURE_PERIOD_NAMES_NOT_CENSUS');
  assert.equal(p.internationalNamingCohort,p.birthYear<1960?'OLDER_BIRTH_COHORT':'YOUNGER_BIRTH_COHORT');
  assert.equal(p.givenNameDecade,null);
  assert.ok(internationalSurnamePool(p.birthCountry,p.internationalNameCulture).includes(p.primarySurname));
  assert.ok(internationalGivenPool(p.birthCountry,p.internationalNameCulture,p.birthYear,true)
   .concat(internationalGivenPool(p.birthCountry,p.internationalNameCulture,p.birthYear,false))
   .includes(p.name.replace(/^Dr\.\s+/,'').split(/\s+/)[0]));
 }
 for(const org of w.owners){
  const person=byId.get(org.principalId);
  assert.equal(person.organizationId,org.id);
  assert.equal(org.familyName??person.primarySurname,person.primarySurname);
 }
 for(const stable of w.stables)assert.equal(byId.get(stable.trainerId)?.stableId,stable.id);
 const owners=w.people.filter(p=>p.role==='owner'),
       bloodstock=w.people.filter(p=>p.role==='bloodstock_agent'),
       trainers=w.people.filter(p=>p.role==='trainer');
 assert.ok(owners.some(p=>p.birthCountry==='JP'));
 assert.ok(owners.some(p=>p.birthCountry==='AE'));
 assert.ok(owners.some(p=>p.birthCountry==='SA'));
 assert.ok(bloodstock.some(p=>p.birthCountry==='GB'));
 assert.ok(bloodstock.some(p=>p.birthCountry==='IE'));
 assert.ok(trainers.some(p=>p.birthCountry==='FR'));
 assert.ok(w.people.filter(p=>['PR','PA','VE','MX','CL','PE','CO','DO','AR','UY','BR'].includes(p.birthCountry)).length>1300);
});

test('forced international owner/trainer/bloodstock names remain culturally coherent across all countries',()=>{
 for(const country of INTERNATIONAL_NAMING_ORIGINS){
  const config={worldId:'Intl-'+country,seed:42718,roles:{trainer:35,bloodstock_agent:75},
   owners:55,facilities:zero,markets:singleMarket,
   originWeightsByRole:{trainer:[[country,100]],bloodstock_agent:[[country,100]],
    owner:[[country,100]]}};
  const w=createFictionalWorldNameEngine(config);
  assert.deepEqual(w,createFictionalWorldNameEngine(config),'non-deterministic '+country);
  assert.equal(w.people.length,165);
  const peopleById=new Map(w.people.map(p=>[p.id,p]));
  for(const p of w.people){
   assert.equal(p.birthCountry,country);
   assert.ok(supportedCulture(country,p.internationalNameCulture));
   assert.ok(internationalSurnamePool(country,p.internationalNameCulture).includes(p.primarySurname));
   assert.equal(p.nameOrigin,'CURATED_INTERNATIONAL_1999_COUNTRY_CULTURE_PERIOD_NAMES_NOT_CENSUS');
   assert.ok(!p.regionalNamingCohort);
   assert.equal(p.internationalNamingCohort,p.birthYear<1960?'OLDER_BIRTH_COHORT':'YOUNGER_BIRTH_COHORT');
  }
  for(const org of w.owners){
   const person=peopleById.get(org.principalId);
   assert.equal(person.organizationId,org.id);
   if(org.familyName)assert.equal(folded(org.familyName),folded(person.primarySurname));
  }
  for(const stable of w.stables)assert.equal(
   peopleById.get(stable.trainerId)?.stableId,stable.id);
 }
});

test('country overrides remain authoritative and current game generators remain independent',()=>{
 const spec={worldId:'No-Countries',seed:77272,roles:{trainer:50,bloodstock_agent:30},
  owners:20,facilities:zero,markets:singleMarket,
  originWeightsByRole:{trainer:[['US',100]],owner:[['US',100]],
   bloodstock_agent:[['US',100]]}};
 const w=createFictionalWorldNameEngine(spec);
 assert.ok(w.people.every(p=>p.birthCountry==='US'));
 assert.ok(w.people.every(p=>!p.internationalNameCulture));
 assert.throws(()=>normalizeFictionalWorldNamingSpec({...spec,originWeightsByRole:{
  trainer:[['ZZ',100]]
 }}),/Unsupported country/);
 const old=readFileSync(new URL('../public/1999/engine/full-world-generator.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(old,/international-racing-person-names/);
 assert.doesNotMatch(old,/internationalProfessionOrigin|internationalCulture/);
 const src=readFileSync(new URL('../public/1999/engine/international-racing-person-names.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(src,/\b(?:fetch|localStorage|indexedDB|writeFile|setItem)\s*\(/);
});
