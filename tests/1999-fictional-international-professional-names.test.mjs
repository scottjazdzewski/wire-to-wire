import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 INTERNATIONAL_PROFESSIONAL_NAME_MODEL,INTERNATIONAL_NAMING_ORIGINS,
 INTERNATIONAL_NAME_PROFILES,DEFAULT_GLOBAL_PROFESSIONAL_ORIGIN_WEIGHTS,
 internationalGivenPool,internationalSurnamePool,drawInternationalGiven,
 drawInternationalSurname,drawGlobalProfessionalOrigin,validateInternationalNamingProfiles
} from '../public/1999/engine/international-professional-names.mjs';
import {
 createFictionalWorldNameEngine,normalizeFictionalWorldNamingSpec
} from '../public/1999/engine/fictional-world-name-engine.mjs';
import {
 supportsInternationalSubculture,culturallyConditionedSurnamePool
} from '../public/1999/engine/international-name-cultures.mjs';
const norm=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
const zero={generalFarms:0,studFarms:0,nurseries:0,bloodstockFarms:0,breakingTraining:0};
const lex=[{id:'lex-ky',city:'Lexington',region:'Kentucky',country:'United States',code:'US',weight:1,breeding:true}];

test('international name lexicons are distinctive, valid and deterministic across 1999 birth cohorts',()=>{
 assert.match(INTERNATIONAL_PROFESSIONAL_NAME_MODEL,/INTERNATIONAL_PROFESSIONAL_NAMES_V1/);
 assert.deepEqual([...INTERNATIONAL_NAMING_ORIGINS],['CA','GB','IE','FR','DE','JP','AU','NZ','AE','HK']);
 assert.equal(validateInternationalNamingProfiles(),true);
 for(const country of INTERNATIONAL_NAMING_ORIGINS){
  const record=INTERNATIONAL_NAME_PROFILES[country];
  assert.ok(record);
  assert.notDeepEqual(record.oldM,record.youngM);
  for(const birthYear of [1937,1973])for(const feminine of [false,true]){
   const pool=internationalGivenPool(country,birthYear,feminine);
   assert.ok(pool.length>=8,country+' under-sized given name corpus');
   for(let i=0;i<30;i++){
    const chosen=drawInternationalGiven(19990101,i,country,birthYear,feminine,i%4);
    assert.ok(pool.includes(chosen),country+' unexpected given name '+chosen);
    assert.equal(chosen,drawInternationalGiven(19990101,i,country,birthYear,feminine,i%4));
   }
  }
  const surnames=internationalSurnamePool(country);
  for(let i=0;i<30;i++)assert.ok(surnames.includes(drawInternationalSurname(12121,i,country,i%6)));
 }
 assert.ok(internationalGivenPool('JP',1947,false).includes('Hiroshi'));
 assert.ok(!internationalGivenPool('JP',1947,false).includes('Patrick'));
 assert.ok(internationalGivenPool('IE',1973,false).includes('Aidan'));
 assert.ok(internationalGivenPool('FR',1947,false).includes('François'));
 assert.ok(internationalSurnamePool('AE').includes('Al-Mansoori'));
 assert.ok(internationalSurnamePool('HK').includes('Chan'));
 assert.throws(()=>internationalGivenPool('ZZ',1950,false),/Unsupported/);
 assert.throws(()=>internationalGivenPool('GB',1999,false),/Unsupported/);
 assert.throws(()=>internationalSurnamePool('ZZ'),/Unsupported/);
});
test('owner, trainer and bloodstock origin mixes are stable and cover appropriate international naming pools',()=>{
 for(const role of ['trainer','owner','bloodstock_agent']){
  const entries=DEFAULT_GLOBAL_PROFESSIONAL_ORIGIN_WEIGHTS[role];
  assert.equal(entries.reduce((n,e)=>n+e[1],0),100);
  assert.equal(new Set(entries.map(e=>e[0])).size,entries.length);
  const seen=new Set();
  for(let i=0;i<1600;i++){
   const origin=drawGlobalProfessionalOrigin(1011999,i,role);
   assert.ok(entries.some(e=>e[0]===origin));
   seen.add(origin);
  }
  assert.ok(seen.size>=7,role+' did not draw enough international origins');
 }
 assert.throws(()=>drawGlobalProfessionalOrigin(11,2,'jockey'),/No international professional mix/);
});
test('full 11,202-person fictional populations retain global naming variety and cross-links',()=>{
 for(const seed of [19990101,23451233]){
  const w=createFictionalWorldNameEngine({worldId:'IntlProfessional-1999',seed});
  assert.match(w.manifest.schema,/V6$/);
  assert.equal(w.manifest.internationalProfessionalNameModel,INTERNATIONAL_PROFESSIONAL_NAME_MODEL);
  assert.equal(w.people.length,11202);
  assert.equal(w.owners.length,3308);
  assert.equal(w.stables.length,4200);
  const peopleById=new Map(w.people.map(p=>[p.id,p]));
  assert.equal(new Set(w.people.map(p=>norm(p.name))).size,w.people.length);
  for(const role of ['trainer','owner','bloodstock_agent']){
   const group=w.people.filter(p=>p.role===role);
   assert.ok(new Set(group.map(p=>p.birthCountry)).size>=8);
   const international=group.filter(p=>INTERNATIONAL_NAMING_ORIGINS.includes(p.birthCountry));
   assert.ok(international.length>=group.length*.25,role+' lacks enough global variety');
   // Global expansion must not crowd established Latin racing communities out
   // of ownership, training or bloodstock naming.
   const latin=group.filter(p=>['PR','PA','MX','VE'].includes(p.birthCountry));
   assert.ok(latin.length>=group.length*.025,role+' lost Latin American representation');
   assert.ok(group.every(p=>p.professionalOriginModel==='EDITORIAL_1999_INTERNATIONAL_PROFESSIONAL_MIX_NOT_MEASURED'));
  }
  const international=w.people.filter(p=>INTERNATIONAL_NAMING_ORIGINS.includes(p.birthCountry));
  assert.ok(international.length>2500);
  for(const p of international){
   assert.equal(p.nameOrigin,'INTERNATIONAL_1999_CURATED_PROFESSIONAL_COHORT_NOT_CENSUS');
   assert.equal(p.givenNameDecade,null);
   assert.equal(p.internationalNamingCohort,p.birthYear<1960?'OLDER_BIRTH_COHORT':'YOUNGER_BIRTH_COHORT');
   const familyNames=supportsInternationalSubculture(p.birthCountry)?
    culturallyConditionedSurnamePool(p.birthCountry,p.internationalNameCulture):
    internationalSurnamePool(p.birthCountry);
   assert.ok(familyNames.includes(p.primarySurname));
  }
  for(const owner of w.owners){
   const p=peopleById.get(owner.principalId);
   assert.equal(p?.organizationId,owner.id);
   if(owner.familyName)assert.equal(owner.familyName,p.primarySurname);
  }
  for(const stable of w.stables)assert.equal(peopleById.get(stable.trainerId)?.stableId,stable.id);
 }
});
test('explicit role country mixes override all editorial defaults, including foreign owners',()=>{
 for(const country of INTERNATIONAL_NAMING_ORIGINS){
  const spec={
   worldId:'Foreign-'+country,seed:778822,roles:{trainer:32,bloodstock_agent:20},owners:24,
   facilities:zero,markets:lex,
   originWeightsByRole:{trainer:[[country,100]],bloodstock_agent:[[country,100]],owner:[[country,100]]}
  };
  const w=createFictionalWorldNameEngine(spec);
  assert.equal(w.people.length,76);
  assert.ok(w.people.every(p=>p.birthCountry===country));
  assert.ok(w.people.every(p=>p.professionalOriginModel==='CUSTOM_ROLE_NAMING_DISTRIBUTION'));
  assert.ok(w.people.every(p=>p.nameOrigin==='INTERNATIONAL_1999_CURATED_PROFESSIONAL_COHORT_NOT_CENSUS'));
  assert.deepEqual(createFictionalWorldNameEngine(spec),w);
 }
 const mixed=createFictionalWorldNameEngine({
  worldId:'MixedGlobal-1999',seed:1229,roles:{trainer:20,jockey:60,bloodstock_agent:10},
  owners:15,facilities:zero,markets:lex,
  originWeightsByRole:{trainer:[['IE',100]],owner:[['JP',100]],
   bloodstock_agent:[['FR',100]],jockey:[['MX',100]]}
 });
 for(const [role,country] of [['trainer','IE'],['owner','JP'],['bloodstock_agent','FR'],['jockey','MX']])
  assert.ok(mixed.people.filter(p=>p.role===role).every(p=>p.birthCountry===country));
 assert.throws(()=>normalizeFictionalWorldNamingSpec({
  worldId:'InvalidMix-1999',roles:{trainer:5},owners:0,facilities:zero,
  originWeightsByRole:{trainer:[['AQ',100]]}
 }),/Unsupported country or weight/);
});
test('international naming remains a pure offline factory separate from the active 1999 world generator',()=>{
 const file=readFileSync(new URL('../public/1999/engine/international-professional-names.mjs',import.meta.url),'utf8');
 const factory=readFileSync(new URL('../public/1999/engine/fictional-world-name-engine.mjs',import.meta.url),'utf8');
 const game=readFileSync(new URL('../public/1999/engine/full-world-generator.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(file,/\b(?:fetch|localStorage|indexedDB|writeFile|setItem)\s*\(/);
 assert.doesNotMatch(factory,/^import.+(?:canon-mini|full-world-generator|local-api|source-principals|cloudflare)/m);
 assert.doesNotMatch(game,/international-professional-names/);
 assert.doesNotMatch(game,/internationalGivenPool|drawGlobalProfessionalOrigin/);
});
