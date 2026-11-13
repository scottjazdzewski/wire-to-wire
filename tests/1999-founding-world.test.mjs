import test from 'node:test';
import assert from 'node:assert/strict';
import {openingWorld1999 as canon} from '../public/1999/engine/canon-mini.mjs';
import {createFounding1999Universe,FOUNDING_WORLD_MODE}
 from '../public/1999/engine/founding-world-1999.mjs';
import {readLocal1999World} from '../public/1999/engine/local-api.mjs';

const founding=createFounding1999Universe({seed:19990101});
const api=(path)=>readLocal1999World(path+(path.includes('?')?'&':'?')+
  'mode=FOUNDING_1999&seed=19990101&population=73');

test('Jan 1 founding scenario replaces 325k visible TEST world but preserves historical source archive',()=>{
 assert.equal(founding.mode,FOUNDING_WORLD_MODE);
 assert.equal(founding.startDate,'1999-01-01');
 assert.equal(founding.counts.horses,0);
 assert.equal(founding.counts.worldHorses,73);
 assert.equal(founding.counts.breedingMares,55);
 assert.equal(founding.counts.breedingStallions,18);
 assert.equal(founding.counts.generatedHorses,0);
 assert.equal(founding.counts.owners,37);
 assert.equal(canon.horses.length,267);
 assert.equal(canon.organizations.length,108);
 assert.ok(canon.pedigreeNodes.length>2000);
 assert.equal(founding.counts.people,114); // 16 source-linked people + 30 proposed leaders + 68 fresh professionals
});

test('the old 39 generated B01 horses are archived, never carried into a clean founding world',()=>{
 assert.equal(founding.sourceHorses.length,0);
 assert.equal(founding.counts.horses,0);
 assert.equal(founding.audit.quarantinedOldB01OpeningRunners,39);
 assert.equal(founding.worldIndexByHorseId('H-1997-030039'),-1);
 assert.ok(canon.horses.some(h=>h.sourceBoundary==='B01_APPROVED_1999_GENERATED_OPENING__NOT_1998_RACER'));
 assert.ok(founding.sourceStallions.every(h=>founding.worldIndexByHorseId(h.id)>=0));
 assert.ok(founding.sourceBroodmares.every(h=>founding.worldIndexByHorseId(h.id)>=0));
 assert.throws(()=>founding.horseAt(0),/Founder horse index/);
});

test('founding operations carry approved names under existing owner IDs, never duplicate their owners',()=>{
 const orgs=founding.sourceOrganizations;
 assert.equal(new Set(orgs.map(o=>o.id)).size,orgs.length);
 assert.equal(new Set(orgs.map(o=>o.name.toLowerCase())).size,orgs.length);
 const look=id=>orgs.find(o=>o.id===id);
 assert.equal(look('O-000002').name,'Harrowgate Farm');
 assert.equal(look('O-000002').principalOwner,'Margot Kincaid');
 assert.equal(look('O-000002').leadershipStatus,'WTW_PROVISIONAL_1999_OPERATOR_PENDING_USER_REVIEW');
 assert.equal(look('O-000056').name,'Quickfire Racing');
 assert.equal(look('O-005910').name,'Midway');
 assert.equal(look('O-005919').name,'Knight’s Way');
 assert.equal(look('O-005794').name,'Potomac Heritage Stable');
 assert.equal(look('O-FOUNDING-1999-005').name,'All The Colors');
 assert.equal(look('O-FOUNDING-1999-007').name,'Velvet Key Racing');
 assert.equal(look('O-FOUNDING-1999-011').name,'Longleaf Farm');
 assert.equal(look('O-FOUNDING-1999-012').name,'Palma Real Stable');
 for(const o of orgs){
  assert.ok(o.id&&o.name);
  assert.ok(['FOUNDING_WORLD'].includes(o.scenarioScope));
 }
 const midway=founding.ownerAt(orgs.findIndex(o=>o.id==='O-005910'));
 assert.equal(midway.principalOwner,'Mike Ditka');
 assert.equal(midway.portfolio.generatedHorseSlots,0);
});

test('Miriam Vale now operates Ashby Vale in Virginia and does not run Harrowgate',()=>{
 const m=founding.sourcePeople.find(p=>p.id==='P-000002');
 assert.equal(m.name,'Miriam Vale');
 assert.equal(m.base.region,'Virginia');
 assert.equal(m.operatingOrganizationId,'O-FOUNDING-1999-014');
 assert.equal(founding.ownerAt(founding.sourceOrganizations.findIndex(o=>o.id==='O-000002')).principalOwner,'Margot Kincaid');
 assert.notEqual(founding.ownerAt(founding.sourceOrganizations.findIndex(o=>o.id==='O-000002')).principalOwnerId,m.id);
 assert.ok(founding.sourcePeople.some(p=>p.name==='Vince Bellini'));
 assert.ok(founding.sourcePeople.some(p=>p.name==='Dr. Everett Raines'));
 assert.ok(founding.sourcePeople.some(p=>p.name==='Rafael Cienfuegos'));
});

test('breeding source retains standing farms with no simulated pregnancies or invented sales',()=>{
 assert.equal(founding.sourceStallions.length,18);
 assert.ok(founding.sourceStallions.every(s=>
  founding.sourceOrganizations.some(o=>o.id===s.standingFarm1999.farmOrganizationId)));
 assert.ok(founding.sourceBroodmares.every(m=>
  ['UNOBSERVED_DO_NOT_ASSUME','UNOBSERVED',undefined].includes(m.pregnancyStatus)));
 assert.equal(founding.annualFoalingForecast().projectedLiveFoals,0);
 assert.ok(founding.historicalAnchors.some(a=>a.horse==='Who Knows'&&
  a.role==='RETAINED_RACING_OWNER'&&a.status==='USER_APPROVED_NEEDS_OWNER_LEDGER_JOIN'));
 for(let i=0;i<founding.counts.worldHorses;i++)
  assert.equal(founding.worldIndexByHorseId(founding.worldHorseDirectoryAt(i).id),i);
});

test('browser management API has exactly the founding roster, not 325k synthetic identities',()=>{
 const overview=api('/api/1999/sim/overview');
 assert.equal(overview.counts.worldHorses,73);
 assert.equal(overview.counts.horses,0);
 assert.equal(overview.mode,'FOUNDING_1999');
 assert.equal(api('/api/1999/organizations').total,37);
 assert.equal(api('/api/1999/horses').total,0);
 assert.equal(api('/api/1999/sim/owners').total,37);
 assert.equal(api('/api/1999/sim/world-horse-directory?limit=100').total,73);
 assert.equal(api('/api/1999/stallions').active.length,18);
 const sample=api('/api/1999/sim/owner-horses?ownerId=O-000011');
 assert.equal(sample.total,0);
 assert.ok(sample.items.every(h=>h.ownerId==='O-000011'));
});

test('founding roster is seed-deterministic and rejects out-of-range index access',()=>{
 const another=createFounding1999Universe({seed:19990101});
 assert.deepEqual(another.counts,founding.counts);
 assert.deepEqual(another.sourceOrganizations,founding.sourceOrganizations);
 assert.equal(another.audit.quarantinedOldB01OpeningRunners,39);
 assert.throws(()=>founding.horseAt(0),/Founder horse index/);
 assert.throws(()=>founding.ownerAt(37),/Founder owner index/);
});


test('World Registrar founding JSON matches the active scenario instead of legacy v3.3 owners and horses',async()=>{
 const {readFileSync}=await import('node:fs');
 const data=JSON.parse(readFileSync(new URL('../public/data/wtw-1999-founding-directory-v1.json',import.meta.url),'utf8'));
 assert.equal(data.schema,'WTW_1999_WORLD_DIRECTORY_V1');
 assert.equal(data.scenario,'FOUNDING_1999');
 assert.equal(data.counts.organizations,founding.counts.owners);
 assert.equal(data.counts.openingHorses,founding.counts.horses);
 assert.equal(data.counts.stallions,founding.counts.breedingStallions);
 assert.equal(data.counts.broodmares,founding.counts.breedingMares);
 assert.equal(data.counts.totalHorses,founding.counts.worldHorses);
 assert.equal(data.historicalAnchors.length,founding.historicalAnchors.length);
 assert.deepEqual(data.organizations.map(o=>[o.id,o.name]),
  founding.sourceOrganizations.map(o=>[o.id,o.name]));
 assert.equal(new Set(data.horses.map(h=>h.id)).size,73);
 assert.equal(data.horses.filter(h=>h._role==='opening').length,0);
 assert.equal(data.horses.filter(h=>h._role==='stallion').length,18);
 assert.equal(data.horses.filter(h=>h._role==='broodmare').length,55);
 assert.ok(data.organizations.some(o=>o.name==='Ashby Vale Farm'&&o.publicPrincipal==='Miriam Vale'));
 assert.ok(!data.organizations.some(o=>['Lattice Farm','Marcus Vale','Cobb Syndicate','Barlow Stable'].includes(o.name)));
 assert.ok(data.horses.filter(h=>h.standingFarm1999?.farmOrganizationId==='O-000002')
  .every(h=>h.standingFarm1999.farmName==='Harrowgate Farm'));
 assert.ok(data.horses.filter(h=>h.boardingFarm1999?.farmOrganizationId==='O-000002')
  .every(h=>h.boardingFarm1999.farmName==='Harrowgate Farm'));
});

test('full founding history bridge links source horse-years without importing dead horses into 1999',async()=>{
 const archive=founding.historicalAnchors;
 const names=founding.historicalHorses;
 assert.equal(archive.length,67);
 assert.equal(names.length,61);
 assert.equal(founding.audit.historicalAnchorRecords,archive.length);
 assert.equal(founding.audit.linkedHistoricalHorses,names.length);
 assert.equal(new Set(names.map(h=>h.id)).size,names.length);
 assert.equal(founding.counts.worldHorses,73);
 assert.ok(archive.every(a=>founding.sourceOrganizations.some(o=>o.id===a.organizationId)));
 for(const a of archive.filter(a=>a.role==='HISTORICAL_STAKES_ASSOCIATION_ROLE_UNVERIFIED')){
  assert.ok(a.horseId?.startsWith('H-'),a.horse);
  assert.equal(a.status,'ORGANIZATION_YEARBOOK_SOURCE_NOT_RACEDAY_CREDIT');
  assert.ok(a.recordedStakesYears.every(y=>y>=1800&&y<=1998));
 }
 const how=archive.find(a=>a.organizationId==='O-000001'&&a.horse==='Sundown Joe');
 assert.deepEqual(how.recordedStakesYears,[1939,1940,1941]);
 const king=archive.find(a=>a.organizationId==='O-000061'&&a.horse==='Heyday');
 const whit=archive.find(a=>a.organizationId==='O-000037'&&a.horse==='Heyday');
 assert.equal(king.role,'BREEDER');
 assert.equal(whit.role,'RACING_OWNER');
 const cres=archive.filter(a=>a.organizationId==='O-000062'&&a.horse==='Who Knows');
 assert.ok(cres.some(a=>a.role==='BREEDER'));
 assert.ok(cres.some(a=>a.role==='RETAINED_RACING_OWNER'&&a.status.includes('NEEDS_OWNER_LEDGER_JOIN')));
 const historic=names.find(h=>h.name==='Gospel Truth');
 assert.equal(historic.id,'H-1970-000001');
 assert.equal(historic.foalYear,1970);
 assert.equal(founding.worldIndexByHorseId(historic.id),-1);
 const {readFileSync}=await import('node:fs');
 const live=JSON.parse(readFileSync(new URL('../public/data/wtw-1999-founding-directory-v1.json',import.meta.url),'utf8'));
 assert.deepEqual(live.historicalAnchors,archive);
 assert.deepEqual(live.historicalHorses,names);
 assert.equal(live.horses.length,73);
});

test('founding ancillary markets do not summon old 3,308-owner rivals or phantom sale lots',()=>{
 const jockeys=Array.from({length:40},(_,i)=>founding.personAt(i)).filter(p=>p.role==='jockey');
 assert.ok(jockeys.length>0);
 for(const j of jockeys){
  assert.equal(j.employmentStatus,'AVAILABLE_UNCONTRACTED');
  assert.equal(j.employerOrganizationId,null);
  assert.equal(j.bookingMarket?.competingBarns?.length,0);
  assert.equal(j.bookingMarket?.status,'FOUNDING_BOOKING_MARKET_NOT_YET_POPULATED');
 }
 const scenarioBid=founding.jockeyBookingMarket(jockeys[0],'O-005910');
 assert.equal(scenarioBid.competingBarns.length,0);
 assert.throws(()=>founding.jockeyBookingMarket(jockeys[0],'O-TEST-1999-000001'),/outside founding world/);
 const auctions=Array.from({length:founding.counts.auctions},(_,i)=>founding.auctionAt(i));
 assert.equal(auctions.length,12);
 assert.ok(auctions.every(a=>a.catalogLots===0&&a.availableLots===0&&
  a.status==='PLANNED_NO_FOUNDING_LOTS_ENTERED'&&a.outcomes.length===0));
});
test('previously recorded farm principals and Argosy founder retain their exact 1999 person IDs',()=>{
 const look=id=>founding.sourcePeople.find(p=>p.id===id);
 const org=id=>founding.sourceOrganizations.find(o=>o.id===id);
 assert.equal(look('P-000001').operatingOrganizationId,'O-000001');
 assert.equal(look('P-000003').operatingOrganizationId,'O-000003');
 assert.equal(look('P-000018').operatingOrganizationId,'O-000014');
 assert.equal(org('O-000014').principalOwnerId,'P-000018');
 assert.equal(org('O-000014').principalOwner,'Julian Voss');
 assert.equal(look('P-000069').professionalAffinities[0],'O-000063');
 assert.notEqual(look('P-000069').operatingOrganizationId,'O-000063',
  'Ray Sutter is not automatically the Ironweed owner');
});
