import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 GENERATIONAL_PERSON_NAME_MODEL,GENERATIONAL_NAME_YEAR_RANGE,
 US_MODERN_SSA_GIVEN_NAMES,MODERN_EDITORIAL_ORIGIN_GIVEN_NAMES,
 validateGenerationalNamingYear,generationalGivenNameEvidence,
 generationalGivenPool,drawGenerationalGiven
} from '../public/1999/engine/generational-person-names-v13.mjs';
import {
 createFictionalWorldNameEngine,normalizeFictionalWorldNamingSpec,
 SUPPORTED_NAME_ERA,SUPPORTED_NAME_YEAR_RANGE
} from '../public/1999/engine/fictional-world-name-engine.mjs';
import {regionalSurnamePool,isLatinCaribbeanNamingOrigin}
 from '../public/1999/engine/latin-caribbean-person-names.mjs';
import {internationalSurnamePool,isInternationalProfessionalNamingOrigin}
 from '../public/1999/engine/international-professional-names.mjs';
import {
 supportsInternationalSubculture,culturallyConditionedSurnamePool
} from '../public/1999/engine/international-name-cultures.mjs';
import {
 generateOnDemandFictionalNames
} from '../public/1999/engine/on-demand-fictional-name-batches.mjs';
import {
 createIndexedFictionalNameRegistry,generateIndexedFictionalNames
} from '../public/1999/engine/indexed-fictional-name-registry.mjs';
import {openDurableFictionalNameService}
 from '../public/1999/engine/durable-fictional-name-service.mjs';
const normalize=x=>String(x).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');

const spec={worldId:'V13-Years-Test',seed:19990101,
 roles:{trainer:200,jockey:120,bloodstock_agent:45,farrier:45},
 owners:150,facilities:{generalFarms:8,studFarms:5,nurseries:2},
 ownerNamingPolicy:{partnershipLimit:15,soleOwnerPercent:23}};

test('US historical 1990-2019 top-30 lists and partial 2020-2025 official rankings are accurately labeled',()=>{
 assert.match(GENERATIONAL_PERSON_NAME_MODEL,/V13/);
 assert.deepEqual(GENERATIONAL_NAME_YEAR_RANGE,{min:1999,max:2099});
 assert.equal(SUPPORTED_NAME_ERA,1999);
 assert.deepEqual(SUPPORTED_NAME_YEAR_RANGE,GENERATIONAL_NAME_YEAR_RANGE);
 const expected={
  1990:{masculine:'Michael',feminine:'Jessica'},
  2000:{masculine:'Jacob',feminine:'Emily'},
  2010:{masculine:'Noah',feminine:'Emma'},
  2020:{masculine:'Liam',feminine:'Olivia'}
 };
 for(const [year,top] of Object.entries(expected)){
  const profile=US_MODERN_SSA_GIVEN_NAMES[Number(year)];
  assert.ok(profile);
  for(const category of ['masculine','feminine']){
   assert.equal(profile[category].length,30,'SSA ranked top 30 of '+year);
   assert.equal(new Set(profile[category]).size,30);
   assert.equal(profile[category][0],top[category]);
  }
 }
 assert.equal(generationalGivenNameEvidence('US',2012),
  'SSA_US_DECADE_TOP30_RANK_EDITORIAL_DRAW');
 assert.equal(generationalGivenNameEvidence('US',2023),
  'SSA_US_PARTIAL_2020_2025_TOP30_EDITORIAL_DRAW');
 assert.equal(generationalGivenNameEvidence('US',2028),
  'EDITORIAL_FUTURE_US_NOT_OBSERVED');
 assert.equal(generationalGivenNameEvidence('JP',2036),
  'EDITORIAL_FUTURE_COUNTRY_CULTURE_NOT_OBSERVED');
 assert.throws(()=>validateGenerationalNamingYear(1998),/1999/);
 assert.throws(()=>validateGenerationalNamingYear(2100),/2099/);
 assert.throws(()=>generationalGivenPool('US',null,2090,false),/birth year/);
});
test('every international naming country retains its own contemporary given pool, with accents and stable cultural subprofiles',()=>{
 for(const [country,culture] of Object.entries({
  PR:null,PA:null,VE:null,MX:null,CL:null,PE:null,CO:null,DO:null,
  AR:null,UY:null,BR:null,IE:null,FR:null,DE:null,JP:null,AU:null,
  NZ:null,AE:null,HK:null,CA:'CA_FR',GB:'GB_WALES'
 })){
  const key=culture||country;
  assert.ok(MODERN_EDITORIAL_ORIGIN_GIVEN_NAMES[key],key);
  for(const birthYear of [1997,2010,2022,2045,2080]){
   for(const feminine of [false,true]){
    const pool=generationalGivenPool(country,culture,birthYear,feminine);
    assert.ok(pool.length>=10);
    assert.ok(new Set(pool).size===pool.length);
    for(let i=0;i<80;i++){
     const n=drawGenerationalGiven(19990101,i,country,culture,birthYear,feminine);
     assert.ok(pool.includes(n),country+' '+birthYear+' '+n);
    }
   }
  }
 }
 for(const culture of ['CA_EN','CA_FR','GB_EN','GB_SCOT','GB_WALES']){
  const country=culture.startsWith('CA')?'CA':'GB';
  assert.ok(MODERN_EDITORIAL_ORIGIN_GIVEN_NAMES[culture]);
  const pool=generationalGivenPool(country,culture,2005,true);
  assert.ok(pool.length>=10);
 }
 assert.notDeepEqual(generationalGivenPool('CA','CA_EN',2004,false),
  generationalGivenPool('CA','CA_FR',2004,false));
 assert.notDeepEqual(generationalGivenPool('GB','GB_SCOT',2015,true),
  generationalGivenPool('GB','GB_WALES',2015,true));
 assert.ok(generationalGivenPool('AE',null,2023,true).includes('Noura'));
 assert.ok(generationalGivenPool('HK',null,2017,false).some(x=>x.includes('-')));
});
test('frozen 1999 population remains byte-for-byte named and fingerprinted as before V13',()=>{
 const w=createFictionalWorldNameEngine({
  worldId:'Eras-Compatibility',seed:19990101,year:1999,
  roles:{trainer:200,jockey:80,farrier:15,bloodstock_agent:20},
  owners:130,facilities:{generalFarms:12,studFarms:7,nurseries:3}
 });
 assert.equal(w.manifest.schema,'WTW_FICTIONAL_WORLD_IDENTITIES_V7');
 assert.equal(w.manifest.fingerprint,'64afc00b');
 assert.equal(w.people.length,445);
 assert.equal(w.owners.length+w.stables.length+w.farms.length+w.trainingCenters.length,352);
 assert.deepEqual(w.people.slice(0,14).map(x=>x.name),[
  'William Gallagher','Thomas Becker','Michelle Carroll','Patricia Jones',
  'David Baker','Peter Y. Smith','Joshua Davis','Jeffrey Williams',
  'Ángel Ramírez','Kenneth Porter','Alain Lachance','Daniela Schäfer',
  'Lucía Rodríguez Medina','James Smith'
 ]);
 assert.ok(!Object.hasOwn(w.manifest,'generationalNameModel'));
 assert.ok(w.people.every(x=>!Object.hasOwn(x,'generationalNameEvidence')));
});
test('later worlds derive birth-year cohorts, honest source labels, and culturally consistent surnames',()=>{
 const worlds=[];
 for(const year of [2010,2030,2050,2099]){
  const w=createFictionalWorldNameEngine({...spec,year});
  assert.equal(w.manifest.schema,'WTW_FICTIONAL_WORLD_IDENTITIES_V13');
  assert.equal(w.manifest.generationalNameModel,GENERATIONAL_PERSON_NAME_MODEL);
  assert.ok(w.people.length===560);
  assert.ok(w.owners.length===150&&w.stables.length===200);
  assert.ok(w.people.every(p=>p.birthYear+p.ageAtOpening===year));
  assert.ok(w.people.every(p=>p.ageAtOpening>=18&&p.ageAtOpening<=90));
  assert.equal(w.manifest.counts.people,w.people.length);
  const modern=w.people.filter(p=>p.birthYear>=1990);
  assert.ok(modern.length>(year===2010?0:year===2030?125:year===2050?275:500));
  for(const person of modern){
   assert.equal(person.nameOrigin,
    generationalGivenNameEvidence(person.birthCountry,person.birthYear));
   assert.equal(person.generationalNameEvidence,person.nameOrigin);
   if(supportsInternationalSubculture(person.birthCountry)){
    const family=culturallyConditionedSurnamePool(
     person.birthCountry,person.internationalNameCulture);
    assert.ok(family.includes(person.primarySurname),person.name);
   }else if(isLatinCaribbeanNamingOrigin(person.birthCountry)){
    assert.ok(regionalSurnamePool(person.birthCountry).includes(person.primarySurname),
     person.name);
   }else if(isInternationalProfessionalNamingOrigin(person.birthCountry)){
    assert.ok(internationalSurnamePool(person.birthCountry).includes(person.primarySurname),
     person.name);
   }
   const firstName=person.name.replace(/^Dr\.\s+/,'').split(/\s+/)[0];
   const pool=generationalGivenPool(person.birthCountry,
    person.internationalNameCulture,person.birthYear,true);
   const poolM=generationalGivenPool(person.birthCountry,
    person.internationalNameCulture,person.birthYear,false);
   assert.ok(pool.includes(firstName)||poolM.includes(firstName),
    'not in correct future cohort '+person.name+' '+person.birthYear);
  }
  assert.deepEqual(w,createFictionalWorldNameEngine({...spec,year}));
  worlds.push(w);
 }
 assert.notEqual(worlds[0].manifest.fingerprint,worlds[1].manifest.fingerprint);
 assert.notEqual(worlds[1].manifest.fingerprint,worlds[2].manifest.fingerprint);
 assert.notEqual(worlds[2].manifest.fingerprint,worlds[3].manifest.fingerprint);
 const futureUS=worlds.at(-1).people.filter(p=>p.birthCountry==='US'&&p.birthYear>=2026);
 assert.ok(futureUS.length>140);
 assert.ok(futureUS.every(p=>p.nameOrigin==='EDITORIAL_FUTURE_US_NOT_OBSERVED'));
});
test('legacy V8 on-demand sessions advance to later eras without rewriting prior issued people or owners',()=>{
 const args={worldId:'V13-Legacy-Demand',seed:19990101,
  roles:{trainer:16,jockey:12},owners:20,facilities:{generalFarms:2},
  maxPartnershipGroups:6};
 const first=generateOnDemandFictionalNames({...args,year:1999});
 const second=generateOnDemandFictionalNames({...args,state:first.nextState,year:2030});
 const third=generateOnDemandFictionalNames({...args,state:second.nextState,year:2060});
 assert.equal(first.nextState.year,1999);
 assert.equal(second.nextState.year,2030);
 assert.equal(third.nextState.year,2060);
 assert.equal(third.nextState.nextBatch,3);
 assert.equal(third.nextState.ownerEntities.length,60);
 assert.ok(third.nextState.partnershipsIssued<=6);
 assert.deepEqual(first.people,generateOnDemandFictionalNames({...args,year:1999}).people);
 assert.ok(first.nextState.ownerEntities.every(x=>third.nextState.ownerEntities.some(y=>
  x.id===y.id&&x.name===y.name)));
 assert.throws(()=>generateOnDemandFictionalNames({...args,
  state:third.nextState,year:2010}),/Incompatible/);
});
test('V11 compact indexed sessions move from 1999 through 2050 without changing old identities',()=>{
 const worldId='V13-Long-Career',seed=880030;
 const registry=createIndexedFictionalNameRegistry({worldId,seed,
  protectedPeople:['Jean-Pierre Gagnon'],protectedOrganizations:['Historical Stud']});
 const args={registry,worldId,seed,roles:{trainer:18,jockey:12},
  owners:25,facilities:{generalFarms:2,studFarms:1},
  maxPartnershipGroups:7};
 const generations=[1999,2010,2030,2050,2099];
 let cursor=null,first=null;
 const recordedOwners=new Map();
 for(const year of generations){
  const result=generateIndexedFictionalNames({...args,cursor,year});
  if(!first)first=result;
  assert.equal(result.nextCursor.year,year);
  for(const o of result.owners)recordedOwners.set(o.id,o.name);
  cursor=result.nextCursor;
 }
 assert.equal(cursor.revision,5);
 assert.equal(cursor.nextBatch,5);
 assert.ok(cursor.partnershipsIssued<=7);
 assert.equal(registry.ownerCount,125);
 assert.ok(JSON.stringify(cursor).length<350);
 for(const row of registry.listOwners({limit:150}))
  assert.equal(row.name,recordedOwners.get(row.id));
 assert.throws(()=>generateIndexedFictionalNames({...args,cursor,year:2040}),
  /Stale or incompatible/);
 assert.equal(registry.revision,5);
 assert.ok(registry.hasAnyName(first.people[0].name));
});
function tinyStore(){
 const rows=new Map(),copy=x=>JSON.parse(JSON.stringify(x));
 const key=(id,seed)=>id+':'+seed;
 return {
  async read({worldId,seed}){return copy(rows.get(key(worldId,seed))??null)},
  async initialize(meta){const k=key(meta.worldId,meta.seed);
   if(rows.has(k))throw Error('exists');
   rows.set(k,{meta:copy(meta),batches:[]});},
  async append({worldId,seed,expectedRevision,batch,cursor}){
   const d=rows.get(key(worldId,seed));
   if(!d||d.meta.revision!==expectedRevision)throw Error('Stale revision');
   d.batches.push(copy(batch));d.meta.revision=cursor.revision;d.meta.cursor=copy(cursor);
  }
 };
}
test('V12 durable registry survives time advancement and restart with no 1999 record rewrites',async()=>{
 const storage=tinyStore(),worldId='V13-Durable',seed=19990101;
 const args={storage,worldId,seed};
 let service=await openDurableFictionalNameService({...args,
  protectedPeople:['Protected Historical Person']});
 const q={roles:{trainer:15,jockey:9},owners:25,
  facilities:{generalFarms:2},maxPartnershipGroups:6};
 const first=await service.generate({...q,year:1999});
 const oldId=first.owners[0].id,oldName=first.owners[0].name;
 for(const year of [2010,2030,2050]){
  const out=await service.generate({...q,year});
  assert.equal(out.nextCursor.year,year);
 }
 assert.equal(service.cursor.nextBatch,4);
 const oldNames=service.listOwners({limit:100});
 assert.ok(oldNames.some(x=>x.id===oldId&&x.name===oldName));
 service=await openDurableFictionalNameService(args);
 assert.equal(service.cursor.year,2050);
 const result=await service.generate(q); // defaults to the last year
 assert.equal(result.nextCursor.year,2050);
 const future=await service.generate({...q,year:2099});
 assert.equal(future.nextCursor.year,2099);
 assert.equal(service.revision,6);
 await assert.rejects(()=>service.generate({...q,year:2030}),
  /Stale or incompatible/);
 assert.ok(service.listOwners({limit:200}).some(x=>x.id===oldId&&x.name===oldName));
 assert.equal(service.partnershipGroupsIssued<=6,true);
});
test('V13 naming module is isolated from game population, horses, pedigrees and UI',()=>{
 const v13=readFileSync(new URL('../public/1999/engine/generational-person-names-v13.mjs',
  import.meta.url),'utf8');
 const live=readFileSync(new URL('../public/1999/engine/full-world-generator.mjs',
  import.meta.url),'utf8');
 assert.doesNotMatch(v13,/\b(?:fetch|localStorage|indexedDB|writeFile|setItem)\s*\(/);
 assert.doesNotMatch(live,/generational-person-names-v13/);
 assert.doesNotMatch(live,/validateGenerationalNamingYear/);
 assert.throws(()=>normalizeFictionalWorldNamingSpec({...spec,year:1998}),/1999/);
 assert.throws(()=>normalizeFictionalWorldNamingSpec({...spec,year:2100}),/2099/);
});
