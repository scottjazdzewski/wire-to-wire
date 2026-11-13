import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 ON_DEMAND_NAMING_MODEL,generateOnDemandFictionalNames,
 listReusableFictionalOwnershipGroups,listReusableFictionalOwners
} from '../public/1999/engine/on-demand-fictional-name-batches.mjs';
import {formatRacingProgramName}
 from '../public/1999/engine/racing-program-name-format.mjs';
import {
 classifyFictionalOwnerName,OWNERSHIP_ARCHETYPES
} from '../public/1999/engine/organization-name-engine.mjs';
import {
 createFictionalWorldNameEngine,normalizeFictionalWorldNamingSpec
} from '../public/1999/engine/fictional-world-name-engine.mjs';
const folded=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[^a-z0-9]+/g,'');

test('owner categories recognize people, families, private racing firms and limited formal partnerships',()=>{
 assert.equal(classifyFictionalOwnerName('Joan Mercer','Joan Mercer'),'INDIVIDUAL_OWNER');
 assert.equal(classifyFictionalOwnerName('Mercer Family Stables'),'FAMILY_OPERATION');
 assert.equal(classifyFictionalOwnerName('West Creek Racing, LLC'),'RACING_COMPANY');
 assert.equal(classifyFictionalOwnerName('North Bridge Racing Partners'),'PARTNERSHIP_OR_SYNDICATE');
 assert.equal(classifyFictionalOwnerName('South River Racing Syndicate'),'PARTNERSHIP_OR_SYNDICATE');
 assert.equal(classifyFictionalOwnerName('Orchard Racing Club'),'PARTNERSHIP_OR_SYNDICATE');
 assert.equal(classifyFictionalOwnerName('Hickory Farm'),'FARM_OWNERSHIP');
 assert.equal(classifyFictionalOwnerName('Joan Mercer and Peter Ward'),'CO_OWNERS');
 assert.equal(classifyFictionalOwnerName('Oak River Racing'),'PRIVATE_RACING_OPERATION');
 assert.equal(new Set(OWNERSHIP_ARCHETYPES).size,7);
});
test('Timeform-style printed program abbreviation does not alter the full fictional identity',()=>{
 const person={name:'José Luis Rodríguez García',primarySurname:'Rodríguez'};
 assert.equal(formatRacingProgramName(person),'J. Rodríguez');
 assert.equal(person.name,'José Luis Rodríguez García');
 assert.equal(formatRacingProgramName({name:'Dr. Catherine Gray',primarySurname:'Gray'}),'C. Gray');
 assert.equal(formatRacingProgramName({name:'Masaru Sato',primarySurname:'Sato'}),'M. Sato');
 assert.throws(()=>formatRacingProgramName({name:''}),/requires/);
});
test('on-demand naming issues unique fresh names across sessions and enforces bounded partnership creation',()=>{
 const params={worldId:'Racing-1999-Test',seed:19990101,
  roles:{jockey:20,trainer:14,bloodstock_agent:8},
  owners:80,facilities:{generalFarms:2,studFarms:1},
  protectedNames:['Kingsmere Farm','José García','Old Park Racing'],
  maxPartnershipGroups:12,soleOwnerPercent:23};
 const seen=new Set(params.protectedNames.map(folded));
 let state=null,groups=0,totalOwners=0,individuals=0,families=0,companies=0;
 let firstBatch=null;
 for(let batchIndex=0;batchIndex<12;batchIndex++){
  const b=generateOnDemandFictionalNames({...params,state});
  if(batchIndex===0){
   firstBatch=b;
   assert.deepEqual(b,generateOnDemandFictionalNames({...params,state}));
   assert.equal(b.manifest.writtenToGame,false);
   assert.equal(b.model,ON_DEMAND_NAMING_MODEL);
  }
  assert.equal(b.manifest.batchIndex,batchIndex);
  assert.equal(b.people.length,42+80);
  assert.equal(b.owners.length,80);
  assert.equal(b.stables.length,14);
  assert.equal(b.farms.length,3);
  assert.equal(b.programNames.length,34);
  for(const name of b.names){
   const key=folded(name);
   assert.ok(!seen.has(key),'repeated prior/real name '+name);
   seen.add(key);
  }
  groups+=b.ownership.newPartnershipGroups.length;
  totalOwners+=b.owners.length;
  individuals+=(b.ownership.archetypeCounts.INDIVIDUAL_OWNER||0);
  families+=(b.ownership.archetypeCounts.FAMILY_OPERATION||0);
  companies+=(b.ownership.archetypeCounts.RACING_COMPANY||0);
  assert.ok(groups<=params.maxPartnershipGroups);
  assert.equal(b.ownership.partnershipsIssued,groups);
  assert.equal(b.ownership.remainingNewPartnershipSlots,params.maxPartnershipGroups-groups);
  state=b.nextState;
  assert.equal(state.ownerEntities.length,totalOwners);
  assert.equal(state.ownerGroupRecords.length,groups);
 }
 assert.equal(totalOwners,960);
 assert.equal(groups,12,'explicit low ceiling should be respected across batches');
 assert.ok(individuals>120&&individuals<350,'must retain many individual owners');
 assert.ok(families>30,'must retain a meaningful family-owner archetype');
 assert.ok(companies>20,'must retain a genuine variety of company-style names');
 assert.equal(state.partnershipsIssued,12);
 assert.equal(state.nextBatch,12);
 const groupRegistry=listReusableFictionalOwnershipGroups(state);
 assert.equal(groupRegistry.length,12);
 assert.equal(groupRegistry[0].id,firstBatch.ownership.newPartnershipGroups[0].id);
 assert.ok(groupRegistry.every(x=>x.archetype==='PARTNERSHIP_OR_SYNDICATE'));
 assert.ok(groupRegistry.every(x=>state.ownerEntities.some(o=>o.id===x.id)));
 const allOwners=listReusableFictionalOwners(state,{limit:1000});
 assert.equal(allOwners.length,960);
 assert.ok(listReusableFictionalOwners(state,{archetype:'INDIVIDUAL_OWNER'})
  .every(x=>x.archetype==='INDIVIDUAL_OWNER'));
 assert.ok(listReusableFictionalOwnershipGroups(state,{region:'KENTUCKY'})
  .every(x=>x.region==='KENTUCKY'));
 assert.ok([...firstBatch.owners,...firstBatch.stables,...firstBatch.farms]
  .every(x=>x.source==='FICTIONAL_WORLD_ENGINE'));
});
test('world-wide zero-new-partnership policy yields sole and private owners without forcing a syndicate',()=>{
 const params={worldId:'Zero-Partnerships',seed:834221,
  roles:{trainer:40},owners:150,facilities:{generalFarms:5},
  maxPartnershipGroups:0,soleOwnerPercent:30};
 const b=generateOnDemandFictionalNames(params);
 assert.equal(b.ownership.newPartnershipGroups.length,0);
 assert.equal(b.ownership.partnershipsIssued,0);
 assert.equal(b.ownership.remainingNewPartnershipSlots,0);
 assert.ok(b.ownership.archetypeCounts.INDIVIDUAL_OWNER>20);
 assert.ok(b.ownership.archetypeCounts.PRIVATE_RACING_OPERATION>20);
 assert.ok(b.owners.every(x=>x.ownershipArchetype!=='PARTNERSHIP_OR_SYNDICATE'));
 assert.equal(b.nextState.ownerGroupRecords.length,0);
 const second=generateOnDemandFictionalNames({...params,state:b.nextState});
 assert.equal(second.ownership.newPartnershipGroups.length,0);
 assert.ok(second.nextState.ownerEntities.length===300);
});
test('single large naming factory can enforce owner budget but default V7 legacy mix remains available',()=>{
 const spec={worldId:'BoundedFactory',seed:19990101,
  roles:{trainer:300},owners:1100,
  facilities:{generalFarms:15,studFarms:5,nurseries:5,bloodstockFarms:5,breakingTraining:3},
  ownerNamingPolicy:{partnershipLimit:20,soleOwnerPercent:24}};
 const b=createFictionalWorldNameEngine(spec);
 assert.equal(b.owners.length,1100);
 assert.ok(b.manifest.ownershipPartnershipsMinted<=20);
 assert.ok(b.owners.filter(x=>x.ownershipArchetype==='PARTNERSHIP_OR_SYNDICATE').length<=20);
 assert.ok(b.owners.filter(x=>x.ownershipArchetype==='INDIVIDUAL_OWNER').length>180);
 assert.ok(b.farms.length===30&&b.stables.length===300);
 assert.deepEqual(b,createFictionalWorldNameEngine(spec));
 const legacy=createFictionalWorldNameEngine({
  ...spec,ownerNamingPolicy:undefined,owners:130});
 assert.equal(legacy.owners.length,130);
 assert.ok(legacy.owners.every(x=>OWNERSHIP_ARCHETYPES.includes(x.ownershipArchetype)));
 assert.throws(()=>normalizeFictionalWorldNamingSpec({
  ...spec,ownerNamingPolicy:{partnershipLimit:-1}
 }),/Invalid owner naming policy/);
});
test('on-demand model rejects malformed state, cross-world reuse and invalid policy inputs',()=>{
 const base={worldId:'GuardedWorld',seed:1541,roles:{trainer:1},owners:1};
 const a=generateOnDemandFictionalNames(base);
 assert.throws(()=>generateOnDemandFictionalNames({...base,state:a.nextState,worldId:'OtherWorld'}),/Incompatible/);
 assert.throws(()=>generateOnDemandFictionalNames({...base,state:a.nextState,seed:2000}),/Incompatible/);
 assert.throws(()=>generateOnDemandFictionalNames({...base,state:a.nextState,
  maxPartnershipGroups:200}),/Incompatible/);
 assert.throws(()=>generateOnDemandFictionalNames({...base,maxPartnershipGroups:-2}),/Invalid maximum/);
 assert.throws(()=>generateOnDemandFictionalNames({...base,soleOwnerPercent:101}),/Invalid on-demand/);
 assert.throws(()=>generateOnDemandFictionalNames({...base,year:2014}),/1999 opening/);
 assert.throws(()=>generateOnDemandFictionalNames({...base,roles:{},owners:0}),/empty/);
 assert.throws(()=>listReusableFictionalOwners(a.nextState,{limit:0}),/result limit/);
 assert.throws(()=>listReusableFictionalOwnershipGroups({}),/Invalid/);
});
test('name issuance is pure, caller-persisted, and does not modify the active game',()=>{
 const source=readFileSync(new URL('../public/1999/engine/on-demand-fictional-name-batches.mjs',import.meta.url),'utf8');
 const game=readFileSync(new URL('../public/1999/engine/founding-world-1999.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/\b(?:fetch|localStorage|indexedDB|writeFile|setItem)\s*\(/);
 assert.doesNotMatch(game,/on-demand-fictional-name-batches|racing-program-name-format/);
 assert.doesNotMatch(game,/ownerPartnershipLimit|listReusableFictionalOwners/);
});
