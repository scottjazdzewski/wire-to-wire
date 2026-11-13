import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createFounding1999Universe} from '../public/1999/engine/founding-world-1999.mjs';
import {createFoundingLeadership1999,FOUNDING_LEADERSHIP_SCHEMA}
 from '../public/1999/engine/founding-leadership-1999.mjs';
import {readLocal1999World} from '../public/1999/engine/local-api.mjs';

const world=createFounding1999Universe({seed:19990101});
const byOrg=new Map(world.sourceOrganizations.map(o=>[o.id,o]));
const known=new Set(['O-000001','O-000003','O-000014','O-000056','O-000061','O-000066',
 'O-005910','O-005919','O-005794','O-006905',
 'O-FOUNDING-1999-011','O-FOUNDING-1999-012','O-FOUNDING-1999-014']);

test('every one of the 37 founding operations has a named, linked principal',()=>{
 assert.equal(world.counts.owners,37);
 assert.equal(world.sourceOrganizations.length,37);
 assert.equal(world.audit.foundingOrganizationsWithoutLeader,0);
 assert.equal(world.audit.newlyAssignedOrganizationPrincipals,24);
 assert.equal(world.audit.proposedLeadershipPeople,30);
 assert.equal(world.audit.leadershipSchema,FOUNDING_LEADERSHIP_SCHEMA);
 const ids=new Set(world.sourcePeople.map(x=>x.id));
 assert.equal(ids.size,world.sourcePeople.length);
 for(const o of world.sourceOrganizations){
  assert.ok(o.principalOwner&&o.principalOwnerId,o.name);
  assert.ok(ids.has(o.principalOwnerId),o.name+' cannot reference unknown person');
  const leader=world.sourcePeople.find(p=>p.id===o.principalOwnerId);
  assert.equal(leader.operatingOrganizationId,o.id,o.name+' incorrect institution');
  assert.ok(Array.isArray(o.leadershipPeopleIds)&&o.leadershipPeopleIds.length>=1);
  assert.ok(o.leadershipPeopleIds.every(x=>ids.has(x)),o.name+' secondary leadership ID');
 }
 assert.equal(world.sourcePeople.length,52);
 assert.equal(world.counts.people,120); // 52 recorded/proposed identities + 68 unrelated staff prospects.
});

test('known 1999 founders/public people stay in place; proposals do not become historical proof',()=>{
 const exact={
  'O-000001':['Charles Wetherby IV','P-000001'],
  'O-000003':['Nathaniel “Nate” Quill','P-000003'],
  'O-000014':['Julian Voss','P-000018'],
  'O-000056':['Vince Bellini','P-FOUNDING-1999-001'],
  'O-000061':['Carolina Kingsley','P-FOUNDING-1999-004'],
  'O-000066':['David Carlin and Elliot Kessler','P-FOUNDING-1999-005'],
  'O-005910':['Mike Ditka','P-910023'],
  'O-005919':['Bob Knight','P-910024'],
  'O-005794':['Pat Buchanan','P-910028'],
  'O-006905':['Magic Johnson','P-910018'],
  'O-FOUNDING-1999-011':['Dr. Everett Raines','P-FOUNDING-1999-002'],
  'O-FOUNDING-1999-012':['Rafael Cienfuegos','P-FOUNDING-1999-003'],
  'O-FOUNDING-1999-014':['Miriam Vale','P-000002']
 };
 for(const [org,[name,id]] of Object.entries(exact)){
  assert.equal(byOrg.get(org).principalOwner,name);
  assert.equal(byOrg.get(org).principalOwnerId,id);
 }
 const proposed=world.sourceOrganizations.filter(o=>!known.has(o.id));
 assert.equal(proposed.length,24);
 assert.ok(proposed.every(o=>o.leadershipStatus.includes('PROVISIONAL')));
 assert.ok(proposed.every(o=>o.principalOwnerId.startsWith('P-FOUNDING-LEADER-')));
 assert.equal(byOrg.get('O-000063').principalOwnerId!=='P-000069',true,
  'Ray Sutter is not Ironweed owner');
 assert.equal(byOrg.get('O-000002').principalOwnerId!=='P-000002',true,
  'Miriam Vale belongs to Ashby Vale, not Harrowgate');
});

test('all leadership people have unique names/IDs, real geographic bases, age curves and no invented contracts',()=>{
 const people=world.foundingLeadership;
 assert.equal(people.length,30);
 assert.equal(people.filter(x=>x.isPrimary).length,24);
 assert.equal(new Set(people.map(x=>x.name.toLowerCase())).size,30);
 assert.equal(new Set(people.map(x=>x.id)).size,30);
 assert.ok(people.every(p=>p.source==='WTW_1999_FICTIONAL_LEADERSHIP_PROPOSAL_NOT_HISTORICAL_EVIDENCE'));
 for(const p of people){
  assert.ok(byOrg.has(p.organizationId),p.name);
  assert.ok(p.birthplace?.locality&&p.birthplace?.region&&p.birthplace?.country,p.name);
  assert.ok(p.base?.locality&&p.base?.country,p.name);
  assert.ok(p.age>=30&&p.age<=70,p.name);
  assert.equal(p.age,p.ability.age);
  assert.ok(p.ability.potential>=p.ability.current,p.name);
  assert.ok(Object.keys(p.attributes).length>=10,p.name);
  assert.equal(p.contractedAtOpening,false);
  assert.equal(p.payrollAnnual,null);
  assert.equal(p.no1999RaceResultClaim,true);
  assert.ok(p.leadershipStatus.includes('PENDING_USER_REVIEW'));
 }
 assert.ok(people.find(p=>p.name==='Charles Buckley').familyRelationshipIds.includes(
  people.find(p=>p.name==='Andrew Buckley').id));
 assert.ok(people.find(p=>p.name==='Hiroshi Takamori').familyRelationshipIds.includes(
  people.find(p=>p.name==='Akira Takamori').id));
 assert.equal(people.filter(x=>x.organizationId==='O-000047').length,3);
 assert.equal(people.filter(x=>x.organizationId==='O-FOUNDING-1999-005').length,2);
 assert.equal(people.filter(x=>x.organizationId==='O-FOUNDING-1999-013').length,2);
});

test('World Registrar and exact-ID API both resolve all designated names',()=>{
 const file=JSON.parse(readFileSync(new URL('../public/data/wtw-1999-founding-directory-v1.json',
  import.meta.url),'utf8'));
 assert.equal(file.counts.organizationsWithDesignatedPrincipal,37);
 assert.equal(file.counts.organizationPrincipalGaps,0);
 assert.equal(file.counts.people,52);
 assert.equal(file.leadershipAssignments.length,30);
 assert.deepEqual(file.organizations.map(x=>[x.id,x.principalOwner,x.principalOwnerId]),
  world.sourceOrganizations.map(x=>[x.id,x.principalOwner,x.principalOwnerId]));
 assert.deepEqual(file.people.map(x=>[x.id,x.name]),
  world.sourcePeople.map(x=>[x.id,x.name]));
 const listing=readLocal1999World('/api/1999/people?offset=22&limit=30');
 assert.equal(listing.total,52);
 assert.equal(listing.items.length,30);
 assert.equal(listing.items[0].id,'P-FOUNDING-LEADER-001');
 const modeled=readLocal1999World('/api/1999/sim/source-people?offset=22&limit=1');
 assert.equal(modeled.items[0].id,'P-FOUNDING-LEADER-001');
 assert.ok(modeled.items[0].ability?.current>=1);
 assert.equal(modeled.items[0].source,'WTW_1999_FICTIONAL_LEADERSHIP_PROPOSAL_NOT_HISTORICAL_EVIDENCE');
});

test('personnel creation remains independent from leader selection, all 1999 horses unchanged',()=>{
 assert.deepEqual(createFoundingLeadership1999({seed:19990101}),world.foundingLeadership);
 assert.deepEqual(createFoundingLeadership1999({seed:19990102}).map(p=>p.id),
  world.foundingLeadership.map(p=>p.id));
 assert.equal(world.counts.horses,39);
 assert.equal(world.counts.worldHorses,112);
 assert.equal(world.counts.generatedHorses,0);
 assert.ok(world.sourceHorses.every(x=>!x.id.startsWith('H-TEST-')));
 assert.ok(world.foundingLeadership.every(x=>!['trainer','jockey'].includes(x.role)));
});
