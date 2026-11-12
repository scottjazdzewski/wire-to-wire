import test from 'node:test';
import assert from 'node:assert/strict';
import {create1999Universe,FULL_WORLD_SCHEMA,HORSE_POPULATION} from '../src/1999/full-world-generator.mjs';
import {openingWorld1999 as canon} from '../src/1999/opening-world.v1.mjs';
const world=create1999Universe();
test('1999 full universe starts at Jan 1 with 87500 horses and 118 playable tracks',()=>{
 assert.equal(world.schema,FULL_WORLD_SCHEMA);
 assert.equal(world.startDate,'1999-01-01');
 assert.equal(world.currentDate,'1999-01-01');
 assert.equal(world.counts.horses,87500);
 assert.equal(HORSE_POPULATION,87500);
 assert.equal(world.counts.canonicalHorses,267);
 assert.equal(world.counts.tracks,118);
 assert.ok(world.counts.facilities>5000);
 assert.equal(world.counts.auctions,36);
 assert.equal(world.audit.ownershipSlots,87233);
 assert.equal(world.audit.trainerSlots,87233);
});
test('horse naming engine can later change TEST names without rewriting canonical horses',()=>{
 for(let i=0;i<canon.horses.length;i++){
  const canonical=canon.horses[i],h=world.horseAt(i);
  assert.equal(h.id,canonical.id);
  assert.equal(h.name,canonical.name);
  assert.equal(h.nameStatus,'CANON_LOCKED');
  assert.equal(h.ownerId,canonical.ownerId);
  assert.equal(h.trainerId,canonical.trainerId);
 }
 for(const i of [267,272,9999,30000,70000,87499]){
  const h=world.horseAt(i);
  assert.equal(h.nameStatus,'TEST_RENAME_ALLOWED');
  assert.equal(h.source,'SIMULATED_HORSE_NOT_CANON');
  assert.equal(h.ageAtOpening,1999-h.foalYear);
  assert.match(h.location.city,/./);
  assert.match(h.location.state,/./);
  assert.match(h.location.country,/./);
  assert.equal(Object.keys(h.attributes).length,53);
  assert.ok(Object.values(h.attributes).every(x=>x!==undefined&&x!==null));
  assert.ok(h.pedigree.parentBirthYears.every(y=>y<=h.foalYear-4));
  assert.ok(h.finances.monthlyCareCost>0);
 }
});
test('name generator is bijective across 4500 spaced working horse identities',()=>{
 const seen=new Set();
 for(let i=267;i<87500;i+=19){
  const h=world.horseAt(i);
  assert.ok(!seen.has(h.name),h.id+' duplicate name '+h.name);
  seen.add(h.name);
 }
});
test('ownership economy includes large owners, regional barns and 1–3 horse partnerships',()=>{
 let small=0,major=0,assigned=0,uniqueNames=new Set();
 for(let i=0;i<world.counts.owners;i++){
  const o=world.ownerAt(i);
  assert.ok(o.id&&o.name&&o.location.city&&o.location.state&&o.location.country);
  assert.ok(o.finances.cash>0&&o.finances.annualHorseOperatingBudget>0);
  assert.ok(o.portfolio.generatedHorseSlots>=1);
  assert.ok(o.reputation.overall>=1&&o.reputation.overall<=99);
  assert.ok(!uniqueNames.has(o.name),'duplicate owner name '+o.name);
  uniqueNames.add(o.name);
  assigned+=o.portfolio.generatedHorseSlots;
  if(o.portfolio.generatedHorseSlots<=3)small++;
  if(o.portfolio.generatedHorseSlots>=100)major++;
 }
 assert.equal(assigned,87233);
 assert.ok(small>=1500);
 assert.ok(major>=80);
});
test('all trainer operations have named regional barns, sufficient stalls and finite payroll',()=>{
 let assigned=0;
 for(let i=0;i<world.counts.trainers;i++){
  const t=world.trainerAt(i);
  assert.ok(t.id&&t.name&&t.location.city&&t.location.state&&t.location.country);
  assert.ok(t.generatedRunners>=2);
  assert.ok(t.barnCapacity>=t.generatedRunners);
  assert.ok(t.annualBaseSalary>=28000);
  assigned+=t.generatedRunners;
 }
 assert.equal(assigned,87233);
});
test('track physical stalls cannot undersupply the assigned horse population',()=>{
 let occupied=0,stalls=0;
 for(let i=0;i<world.counts.tracks;i++){
  const t=world.trackAt(i);
  assert.ok(t.id&&t.name&&t.location.city&&t.location.state&&t.location.country);
  assert.ok(t.facility.barnStalls>=t.facility.occupied);
  occupied+=t.facility.occupied;stalls+=t.facility.barnStalls;
 }
 assert.equal(occupied,87500);
 assert.ok(stalls>occupied);
});
test('1999 Jan 1 condition books are generated at actual compatible meets, no duplicate race IDs',()=>{
 let open=0,cards=0;const ids=new Set();
 for(let i=0;i<world.counts.tracks;i++){
  const t=world.trackAt(i),races=world.conditionBook('1999-01-01',i);
  if(races.length)open++;
  for(const r of races){
   assert.equal(r.date,'1999-01-01');
   assert.equal(r.trackId,t.id);
   assert.equal(r.status,'CONDITION_BOOK_PROPOSAL_NOT_RUN');
   assert.ok(r.fieldCapacity>=8&&r.purse>0);
   assert.equal(r.results.length,0);
   assert.ok(!ids.has(r.id));ids.add(r.id);
  }
  cards+=races.length;
 }
 assert.ok(open>=5 && cards>=40);
 assert.ok(!world.conditionBook('1999-01-01',44).length,'Timonium may not have January county fair meets');
});
test('complete personnel traits, testing finances, facilities and 1999 auctions have real slots',()=>{
 const p=world.personAt(world.counts.trainers+17);
 assert.ok(p.name&&p.location.city&&Object.keys(p.attributes).length>=11);
 const f=world.facilityAt(4200);
 assert.equal(f.type,'BREEDING_FARM');
 assert.ok(f.location.city&&f.capacity>0&&f.annualOperatingCost>0);
 for(let i=0;i<36;i++){
  const a=world.auctionAt(i);
  assert.match(a.date,/^1999-\d\d-\d\d$/);
  assert.ok(a.id&&a.name&&a.location.city&&a.catalogLots>0);
  assert.deepEqual(a.outcomes,[]);
 }
});
test('reopening same seed has identical truth, new seed changes only TEST values',()=>{
 const a=create1999Universe({seed:19990101});
 const b=create1999Universe({seed:19990101});
 const c=create1999Universe({seed:19990102});
 assert.deepEqual(a.horseAt(420),b.horseAt(420));
 assert.equal(a.horseAt(0).name,c.horseAt(0).name);
 assert.notEqual(a.horseAt(420).attributes.raw_speed,c.horseAt(420).attributes.raw_speed);
});
test('fully fictional universe keeps all tracks and attributes but no locked source horses',()=>{
 const f=create1999Universe({seed:19990101,mode:'FULLY_FICTIONAL_TEST'});
 assert.equal(f.counts.canonicalHorses,0);
 assert.equal(f.counts.horses,87500);
 assert.equal(f.counts.tracks,118);
 assert.equal(f.horseAt(0).nameStatus,'TEST_RENAME_ALLOWED');
 assert.notEqual(f.trackAt(0).name,canon.tracks[0].name);
 assert.equal(f.startDate,'1999-01-01');
});

test('1999 generated names have unique identities and role-appropriate international jockeys',()=>{
 const w=create1999Universe({seed:19990101}),names=new Set(),countries=new Map();
 for(let i=0;i<w.counts.people-w.sourcePeople.length;i++){
  const p=w.personAt(i);
  assert.ok(p.id&&p.name);
  assert.ok(p.role!=='groom'&&p.role!=='exercise_rider');
  if(p.nameStatus!=='CANON_LOCKED'){
   assert.ok(!names.has(p.name),p.id+' duplicate name '+p.name);
   names.add(p.name);
   assert.ok(p.birthCountry,p.id+' has no origin country');
  }
  if(p.role==='jockey')countries.set(p.birthCountry,(countries.get(p.birthCountry)||0)+1);
 }
 assert.ok(countries.size>=8,'Geographically diverse jockey population');
 const regional=['PR','PA','VE','MX','CL','PE','CO','DO'].reduce((n,c)=>n+(countries.get(c)||0),0);
 assert.ok(regional>=500,'Provisional racing test scenario includes Latin American / Caribbean riders');
 assert.deepEqual(w.excludedActiveStaffRoles,['groom','exercise_rider']);
});
