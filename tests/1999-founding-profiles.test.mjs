import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const directory=JSON.parse(read('public/data/wtw-1999-founding-directory-v1.json'));
const geography=JSON.parse(read('public/data/track-geography-v33.json'));
const office=read('public/next/next.js');
const adapter=read('public/next/1999-restored-profiles.js');
const source=read('public/next/1999-ui-source.mjs');
const html=read('public/next/index.html');

test('one REAL approved renderer serves Track-style facilities and Horse-style founding personnel',()=>{
 assert.match(office,/return restored1999Profile\(kind==='person'\?'person':'farm'/);
 assert.match(office,/return x\?profileDetail\(x.route,x.node\):null/);
 assert.match(office,/function profileDetail\(route,sourceOverride=null\)/);
 assert.match(office,/isFarm\?'ng-profile-farm ng-profile-track'/);
 assert.match(office,/isPerson\?'ng-profile-person ng-profile-horse'/);
 assert.match(office,/ng-track-workspace/);
 assert.match(office,/ng-horse-dossier ng-person-horse-dossier/);
 assert.match(office,/founderAffiliationRows\(\)/);
 assert.match(office,/founderPersonLinks\(\)/);
 assert.match(office,/founderHistoryRows\(\)/);
 assert.match(adapter,/kind==='farm'/);
 assert.match(adapter,/kicker:kind==='horse'\?'Horse Profile':kind==='person'\?'People Profile':kind==='farm'\?'Farm Profile':'Track Profile'/);
 assert.ok(html.includes('1999-restored-profiles.js'));
 assert.ok(!html.includes('1999-founding-profiles.js'));
});

test('all person roles use the exact complete Horse layout, with blank role attributes',()=>{
 assert.match(office,/data-template="horse-overview"/);
 assert.match(office,/const groupSizes=\[9,15,12,10\]/);
 assert.match(office,/ng-horse-mgr-four/);
 assert.match(office,/ng-horse-condition-strip/);
 assert.match(office,/ng-horse-mgr-five/);
 assert.match(office,/ng-horse-mgr-bottom/);
 assert.match(office,/ng-horse-mgr-summary/);
 assert.match(office,/0 OF 46 ROLE-SPECIFIC SLOTS DEFINED/);
 assert.match(office,/attribute.*slot/i);
 assert.doesNotMatch(html,/1999-founding-profiles\.js/);
});

test('one O-ID image route controls both founder page logos and future horse-owner chips',()=>{
 assert.match(office,/\['organization:'\+approvedOrg\.id\]/);
 assert.match(office,/organizationLogoMarkup\(owner\.id,owner\.name,'organization'/);
 assert.match(office,/ownerOrganizationId/);
 assert.match(office,/ownershipOrganizationId/);
 assert.match(office,/isFarm\?\s*approvedIdentityAsset\('organization',source\.dataset\.organizationId\|\|''/);
 assert.match(office,/imageSlotRequired=isFarm\|\|portraitRequired/);
 assert.match(office,/ng-profile-portrait/);
 assert.match(office,/ng-profile-facility-logo/);
 const manifest=JSON.parse(read('public/assets/office/founding-organization-logo-index.json'));
 assert.equal(manifest.approvedOrganizationIds.length,37);
 assert.equal(Object.keys(manifest.organizations).length,21);
 assert.equal(manifest.remainingWithoutMatchedLogo,16);
 assert.ok(!manifest.organizations['organization:O-000002']);
 assert.ok(!manifest.organizations['organization:O-000056']);
});

test('37 approved ownership organizations, 41 EXACT approved people, no unrelated or generated workforce',()=>{
 const orgs=directory.organizations,persons=directory.people;
 assert.equal(orgs.length,37);
 assert.equal(persons.length,41);
 assert.equal(directory.counts.generatedTrainingCenters,0);
 assert.equal(directory.counts.generatedBarns,0);
 assert.equal(directory.counts.generatedProfessionals,0);
 assert.equal(directory.counts.approvedOpeningPhysicalFacilities,0);
 const orgIds=new Set(orgs.map(o=>o.id)),personIds=new Set(persons.map(p=>p.id));
 assert.equal(orgIds.size,37);assert.equal(personIds.size,41);
 for(const p of persons){
  assert.ok(orgIds.has(p.operatingOrganizationId),p.name+' missing approved institution');
  assert.ok(!p.id.startsWith('P-FOUNDING-STAFF-'));
 }
 const groups=source.match(/if\(section==='Personnel'&&page==='Principals'\)/g)||[];
 assert.equal(groups.length,1);
 assert.match(source,/return srcPeople\.map\(p=>\(/);
 assert.match(office,/Personnel:\['Overview','Trainers','Jockeys','Owners','Principals','Staff'\]/);
 assert.match(office,/PersonnelPrincipals:\[\['name','PERSON'/);
 assert.match(office,/\['operation','OWNERSHIP \/ FACILITY ENTITY'/);
});

test('all approved people resolve by exact ownership ID, including investor-only Magic Johnson',()=>{
 const orgIds=new Set(directory.organizations.map(o=>o.id));
 const assigned=new Set();
 for(const p of directory.people){
  assert.ok(orgIds.has(p.operatingOrganizationId),p.name);
  const org=directory.organizations.find(o=>o.id===p.operatingOrganizationId);
  assert.ok(org);
  assert.ok(org.principalOwnerId===p.id||org.publicPrincipalId===p.id||
   org.publicInvestorId===p.id||(org.leadershipPeopleIds||[]).includes(p.id),p.name);
  assigned.add(p.id);
 }
 assert.equal(assigned.size,41);
 const investor=directory.people.find(p=>p.id==='P-910018');
 const led=directory.organizations.find(o=>o.id==='O-006905');
 assert.equal(investor.name,'Magic Johnson');
 assert.equal(investor.relationshipType,'MAJOR_INVESTOR_NON_OPERATING');
 assert.equal(investor.hasManagementAuthority,false);
 assert.equal(led.publicInvestorId,investor.id);
 assert.equal(led.principalOwnerId,null);
 const bloodstock=directory.organizations.find(o=>o.id==='O-000014');
 assert.equal(bloodstock.principalOwnerId,'P-000018');
 assert.equal(bloodstock.name,'Argosy Bloodstock');
 for(const id of ['O-000002','O-000064','O-000057','O-006905']){
  assert.equal(directory.organizations.find(o=>o.id===id).principalOwnerId,null);
 }
});

test('118 North American incl. Cuba and 16 historical closures visible; ZERO international in game site directory',()=>{
 const domestic=geography.tracks.filter(t=>t.registry==='NORTH_AMERICA');
 const intl=geography.tracks.filter(t=>t.registry==='INTERNATIONAL');
 assert.equal(domestic.length,118);
 assert.equal(intl.length,16);
 assert.equal(directory.tracks.length,102);
 assert.equal(domestic.filter(t=>t.opening_state==='CLOSED_PRE_1999').length,16);
 assert.ok(domestic.some(t=>t.name==='Oriental Park'&&t.country==='Cuba'));
 const names=new Set(domestic.map(t=>t.id));
 assert.ok(directory.tracks.every(t=>names.has(t.id)));
 assert.match(office,/data=\{\.\.\.data,tracks:\[\.\.\.data\.tracks,\.\.\.missing\.map\(t=>\(\{/);
 assert.match(office,/geo\.tracks\.filter\(t=>t\.registry==='NORTH_AMERICA'\)/);
 assert.match(office,/permittedTracks\.has\(t\.id\)/);
 assert.match(office,/HISTORICAL · CLOSED BEFORE 1999/);
 assert.doesNotMatch(office,/registry==='INTERNATIONAL'/);
});

test('1999 founder facility references are exactly 30, NOT independent buildings',()=>{
 assert.equal(directory.counts.institutionalFacilityReferences,30);
 const types=directory.organizations.map(o=>o.facilityDisplayCategory);
 assert.equal(types.filter(t=>t==='STUD_FARM').length,5);
 assert.equal(types.filter(t=>t==='FARM').length,15);
 assert.equal(types.filter(t=>t==='RACING_STABLE_ORGANIZATION').length,10);
 assert.equal(types.filter(t=>t==='ORGANIZATION_ONLY').length,7);
 assert.match(office,/\['CAPACITY','NOT RECORDED'\]/);
 assert.match(office,/data-template="track-overview"/);
 assert.match(office,/founderStockRows\(\)/);
});
