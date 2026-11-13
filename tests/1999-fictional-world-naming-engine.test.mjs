import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 FICTIONAL_WORLD_NAME_ENGINE,SUPPORTED_NAME_ERA,
 normalizeFictionalWorldNamingSpec,createFictionalWorldNameEngine
} from '../public/1999/engine/fictional-world-name-engine.mjs';

const norm=x=>String(x).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');
const distinct=(rows,label)=>assert.equal(
 new Set(rows.map(x=>norm(x.name))).size,rows.length,label+' duplicate names'
);
const minimal={
 worldId:'Sandbox-01',seed:101987,
 roles:{trainer:60,jockey:45,farm_manager:15,veterinarian:7},
 owners:55,
 facilities:{generalFarms:17,studFarms:11,nurseries:4,bloodstockFarms:3,breakingTraining:15}
};

test('factory only generates in-memory world identities; never imports 1999 canon, APIs or UI',()=>{
 const code=readFileSync(new URL('../public/1999/engine/fictional-world-name-engine.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(code,/^import.+(?:canon-mini|full-world-generator|local-api|source-principals|cloudflare)/m);
 assert.doesNotMatch(code,/\b(?:fetch|localStorage|indexedDB|writeFile|updateFile|putFile)\s*\(/);
 assert.equal(SUPPORTED_NAME_ERA,1999);
 const w=createFictionalWorldNameEngine(minimal);
 assert.equal(w.manifest.schema,FICTIONAL_WORLD_NAME_ENGINE);
 assert.equal(w.manifest.authoritative,false);
 assert.equal(w.manifest.sourceCanonIncluded,false);
 assert.equal(w.manifest.committedToGame,false);
 assert.equal(w.manifest.horseNamesIncluded,false);
 assert.equal(w.manifest.tracksIncluded,false);
 assert.ok(Object.isFrozen(w));
 assert.ok(Object.isFrozen(w.people));
 assert.ok(Object.isFrozen(w.owners));
 assert.ok(Object.isFrozen(w.stables));
 assert.ok(Object.isFrozen(w.farms));
 assert.ok(Object.isFrozen(w.trainingCenters));
});
test('small fictional world has all requested role, farm-purpose and training counts',()=>{
 const w=createFictionalWorldNameEngine(minimal);
 assert.equal(w.people.length,182);
 assert.equal(w.owners.length,55);
 assert.equal(w.stables.length,60);
 assert.equal(w.farms.length,35);
 assert.equal(w.trainingCenters.length,15);
 assert.deepEqual(w.manifest.counts.byFarmKind,{
  FARM:17,STUD_FARM:11,THOROUGHBRED_NURSERY:4,BLOODSTOCK_FARM:3
 });
 assert.deepEqual(w.manifest.counts.byRole,{
  trainer:60,jockey:45,farm_manager:15,veterinarian:7,owner:55
 });
 assert.ok(w.farms.every(f=>f.kind!=='STUD_FARM'||/\b(Stud|Stallion)\b/i.test(f.name)));
 const peopleById=new Map(w.people.map(p=>[p.id,p]));
 assert.ok(w.owners.every(o=>o.principalName===peopleById.get(o.principalId)?.name));
 assert.ok(w.stables.every(s=>s.trainerName===peopleById.get(s.trainerId)?.name));
 assert.ok(w.stables.every(s=>s.location.marketId===peopleById.get(s.trainerId).location.marketId));
 assert.ok(w.owners.every(o=>o.location.marketId===peopleById.get(o.principalId).location.marketId));
 assert.ok(w.people.every(p=>p.birthYear===1999-p.ageAtOpening));
 assert.ok(w.people.filter(p=>p.role==='jockey').every(p=>p.ageAtOpening>=18&&p.ageAtOpening<=58));
 assert.ok(w.people.every(p=>p.id.startsWith('WTWFI-Sandbox-01-')));
 assert.ok(w.farms.every(f=>f.location.city&&f.location.region&&f.location.country));
 distinct(w.people,'people');
 distinct([...w.owners,...w.stables,...w.farms,...w.trainingCenters],'organizations');
 assert.ok(w.owners.filter((o,i)=>i%11===0).every(o=>o.name===o.principalName),
  'sole-owner personal identity intentionally matches principal');
});
test('same world seed and configuration reproduce every generated name, ID, link and location',()=>{
 const first=createFictionalWorldNameEngine(minimal),again=createFictionalWorldNameEngine(minimal);
 assert.deepEqual(again,first);
 assert.equal(first.manifest.fingerprint,again.manifest.fingerprint);
 const different=createFictionalWorldNameEngine({...minimal,seed:minimal.seed+1});
 assert.notEqual(first.manifest.fingerprint,different.manifest.fingerprint);
 assert.notDeepEqual(first.people.slice(0,10).map(x=>x.name),
  different.people.slice(0,10).map(x=>x.name));
 assert.deepEqual(first.people.map(p=>p.id),different.people.map(p=>p.id),
  'seed changing data does not change entity identity keys within a world ID');
 const renamedWorld=createFictionalWorldNameEngine({...minimal,worldId:'Sandbox-02'});
 assert.notEqual(renamedWorld.people[0].id,first.people[0].id);
 assert.equal(renamedWorld.people[0].name,first.people[0].name,
  'world namespace is separate from chosen random content');
});
test('custom geographic markets and role-specific origin mixes work independently from world UI',()=>{
 const config={worldId:'Regional-world',seed:19990101,
  roles:{trainer:250,jockey:200},owners:120,
  facilities:{generalFarms:60,studFarms:20,nurseries:9,bloodstockFarms:11,breakingTraining:20},
  markets:[
   {id:'middleburg-va',city:'Middleburg',region:'Virginia',country:'United States',code:'US',weight:3,breeding:true},
   {id:'arcadia-ca',city:'Arcadia',region:'California',country:'United States',code:'US',weight:4,breeding:false}
  ],
  originWeightsByRole:{jockey:[['PR',9],['US',1]],trainer:[['US',4],['CA',1]]}
 };
 const w=createFictionalWorldNameEngine(config);
 const markets=new Set(config.markets.map(x=>x.id));
 const jockeys=w.people.filter(x=>x.role==='jockey');
 const trainers=w.people.filter(x=>x.role==='trainer');
 assert.ok(jockeys.every(p=>['PR','US'].includes(p.birthCountry)));
 assert.ok(trainers.every(p=>['US','CA'].includes(p.birthCountry)));
 assert.ok(jockeys.filter(p=>p.birthCountry==='PR').length>120);
 assert.ok([...w.people,...w.farms,...w.trainingCenters].every(x=>markets.has(x.location.marketId)));
 assert.ok(w.farms.every(f=>f.location.marketId==='middleburg-va'));
 assert.equal(w.manifest.counts.people,570);
 assert.equal(w.manifest.counts.farms,100);
});
test('protected identities and brands cannot be minted by a fresh fictional world',()=>{
 const config={...minimal,protectedNames:[
  'Gabe Larkin','Nico Arroyo','Kingsmere Farm','Crescent Mile Stud','Marrowfield Farm'
 ]};
 const w=createFictionalWorldNameEngine(config);
 assert.ok(!w.people.some(x=>['gabelarkin','nicoarroyo'].includes(norm(x.name))));
 assert.ok(![...w.owners,...w.farms,...w.stables,...w.trainingCenters].some(x=>
  /^(Kingsmere|Crescent Mile|Marrowfield)\b/i.test(x.name)));
});
test('many independent seeds cannot yield numeric people, stacked initials or intra-world duplicates',()=>{
 for(const seed of [19990101,19990102,23451233,99911111]){
  const w=createFictionalWorldNameEngine({...minimal,seed});
  distinct(w.people,'people seed '+seed);
  distinct([...w.owners,...w.stables,...w.farms,...w.trainingCenters],'organizations seed '+seed);
  assert.ok(w.people.every(p=>!/\b\d+\b/.test(p.name)));
  assert.ok(w.people.every(p=>!/\b[A-Z]\.\s+[A-Z]\.\s/.test(p.name)));
  assert.ok(w.owners.every(x=>Boolean(x.principalId)));
  assert.ok(w.stables.every(x=>Boolean(x.trainerId)));
 }
});
test('all-zero world allowed; invalid years, categories, locations, seed and mixes rejected',()=>{
 const empty=createFictionalWorldNameEngine({
  worldId:'Empty-01',seed:1,roles:{},owners:0,facilities:{
   generalFarms:0,studFarms:0,nurseries:0,bloodstockFarms:0,breakingTraining:0
  }
 });
 assert.deepEqual(empty.manifest.counts.byFarmKind,{
  FARM:0,STUD_FARM:0,THOROUGHBRED_NURSERY:0,BLOODSTOCK_FARM:0
 });
 assert.equal(empty.people.length,0);
 assert.equal(empty.owners.length,0);
 assert.equal(empty.stables.length,0);
 assert.equal(empty.farms.length,0);
 assert.equal(empty.trainingCenters.length,0);
 assert.throws(()=>normalizeFictionalWorldNamingSpec({...minimal,year:1850}),/1999/);
 assert.throws(()=>normalizeFictionalWorldNamingSpec({...minimal,worldId:'?'}),/World ID/);
 assert.throws(()=>normalizeFictionalWorldNamingSpec({...minimal,seed:0}),/seed/);
 assert.throws(()=>normalizeFictionalWorldNamingSpec({...minimal,roles:{unknown:1}}),/Unsupported role/);
 assert.throws(()=>normalizeFictionalWorldNamingSpec({...minimal,roles:{owner:1}}),/owner/);
 assert.throws(()=>normalizeFictionalWorldNamingSpec({...minimal,owners:-2}),/owners/);
 assert.throws(()=>normalizeFictionalWorldNamingSpec({...minimal,facilities:{studFarms:-1}}),/studFarms/);
 assert.throws(()=>normalizeFictionalWorldNamingSpec({...minimal,protectedNames:[false]}),/Protected names/);
 assert.throws(()=>normalizeFictionalWorldNamingSpec({...minimal,originWeightsByRole:{
  jockey:[['JP',1]]
 }}),/Unsupported country/);
 assert.throws(()=>normalizeFictionalWorldNamingSpec({...minimal,markets:[]}),/geographic markets/);
 assert.throws(()=>normalizeFictionalWorldNamingSpec({...minimal,markets:[
  {id:'duplicate',city:'A',region:'B',country:'C',code:'US',weight:1},
  {id:'duplicate',city:'D',region:'E',country:'F',code:'US',weight:1}
 ]}),/Duplicate/);
});
test('full sized 1999 identity request builds 11,202 people and 8,408 organizations without saving game records',()=>{
 const w=createFictionalWorldNameEngine({worldId:'Fresh-1999',seed:19990101});
 assert.equal(w.manifest.counts.people,11202);
 assert.equal(w.manifest.counts.owners,3308);
 assert.equal(w.manifest.counts.stables,4200);
 assert.equal(w.manifest.counts.farms,900);
 assert.equal(w.manifest.counts.trainingCenters,0);
 assert.equal(w.manifest.counts.byFarmKind.STUD_FARM,240);
 distinct(w.people,'full people');
 distinct([...w.owners,...w.stables,...w.farms],'full organizations');
 assert.ok(w.people.every(p=>!/\b\d+\b/.test(p.name)));
 assert.ok(w.people.every(p=>!/\b[A-Z]\.\s+[A-Z]\.\s/.test(p.name)));
 assert.ok(w.stables.every(s=>s.location.marketId));
 assert.ok(w.owners.every(o=>o.principalId&&o.location.marketId));
});

test('fictional family business names agree with the linked owner principal',()=>{
 for(const seed of [19990101,19990102,23451233]){
  const w=createFictionalWorldNameEngine({worldId:'Family-Integrity',seed});
  const principalById=new Map(w.people.map(p=>[p.id,p]));
  const families=w.owners.filter(x=>x.principalRelationship==='NAMED_FAMILY_PRINCIPAL');
  assert.ok(families.length>50,'expected meaningful sample of family-named businesses');
  for(const owner of w.owners){
   const person=principalById.get(owner.principalId);
   assert.ok(person,'owner principal missing '+owner.id);
   assert.equal(person.organizationId,owner.id);
   assert.equal(person.location.marketId,owner.location.marketId);
   assert.equal(owner.principalName,person.name);
  }
  for(const owner of families){
   const actualSurname=owner.principalName.trim().split(/\s+/).at(-1);
   assert.equal(norm(owner.familyName),norm(actualSurname));
   assert.ok(owner.name.startsWith(owner.familyName+' Family '),owner.name);
  }
 }
});
test('trainer and racing stable links are reciprocal and geography stays consistent',()=>{
 const w=createFictionalWorldNameEngine({worldId:'Stable-Integrity',seed:19990101});
 const byId=new Map(w.people.map(p=>[p.id,p]));
 const stablesById=new Map(w.stables.map(x=>[x.id,x]));
 for(const stable of w.stables){
  const trainer=byId.get(stable.trainerId);
  assert.equal(trainer?.stableId,stable.id);
  assert.equal(trainer?.role,'trainer');
  assert.equal(stable.location.marketId,trainer.location.marketId);
  assert.equal(stablesById.get(trainer.stableId)?.trainerId,trainer.id);
 }
 assert.equal(new Set(w.stables.map(s=>s.trainerId)).size,w.stables.length);
});
test('farm managers are assigned to only one farm; farm and manager location agree',()=>{
 const w=createFictionalWorldNameEngine({worldId:'Farm-Integrity',seed:19990101});
 const people=new Map(w.people.map(p=>[p.id,p]));
 const allManagers=w.people.filter(p=>p.role==='farm_manager');
 const referenced=w.farms.flatMap(f=>f.managerIds.map(id=>({farm:f,id})));
 assert.equal(referenced.length,550);
 assert.equal(new Set(referenced.map(x=>x.id)).size,550);
 assert.equal(w.manifest.counts.assignedFarmManagers,550);
 assert.equal(w.manifest.counts.unassignedFarmManagers,0);
 for(const {farm,id} of referenced){
  const manager=people.get(id);
  assert.equal(manager?.farmId,farm.id);
  assert.equal(manager?.role,'farm_manager');
  assert.equal(manager?.location.marketId,farm.location.marketId);
 }
 assert.ok(allManagers.every(m=>referenced.some(x=>x.id===m.id)));
 const small=createFictionalWorldNameEngine({
  worldId:'No-Farms',seed:12,owners:0,
  roles:{farm_manager:12},facilities:{
   generalFarms:0,studFarms:0,nurseries:0,bloodstockFarms:0,breakingTraining:0
  }
 });
 assert.equal(small.manifest.counts.assignedFarmManagers,0);
 assert.equal(small.manifest.counts.unassignedFarmManagers,12);
 assert.ok(small.people.every(p=>p.farmId===null));
});
test('full fictional name batch is broad, never clamped by middle-initial disguises',()=>{
 const w=createFictionalWorldNameEngine({worldId:'Name-Quality',seed:19990101});
 const repeated=new Map();
 for(const person of w.people){
  const base=person.name.replace(/^Dr\.\s*/,'')
   .replace(/\s+[A-Z]\.\s+/g,' ')
   .replace(/"[^"]+"\s*/g,'').trim();
  repeated.set(norm(base),(repeated.get(norm(base))||0)+1);
 }
 assert.ok([...repeated.values()].every(n=>n<=2),'three or more people share the same first and last name');
 assert.ok(!w.people.some(p=>{
  const bits=p.name.replace(/^Dr\.\s*/,'').trim().split(/\s+/);
  return norm(bits[0])===norm(bits.at(-1));
 }), 'unintentional Thomas Thomas style identities');
});
test('equivalent world role-map order does not change its generated people or IDs',()=>{
 const spec={worldId:'Order-Independent',seed:1000,owners:22,
  roles:{trainer:40,jockey:20,farm_manager:9},
  facilities:{generalFarms:8,studFarms:4,nurseries:2,bloodstockFarms:1,breakingTraining:3}
 };
 const other={...spec,roles:{farm_manager:9,jockey:20,trainer:40}};
 const a=createFictionalWorldNameEngine(spec),b=createFictionalWorldNameEngine(other);
 assert.deepEqual(a,b);
 assert.throws(()=>normalizeFictionalWorldNamingSpec({...spec,facilities:{generalFarms:1,castleFarms:2}}),/Unsupported facility purpose/);
});
