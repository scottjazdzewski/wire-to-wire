import test from 'node:test';
import assert from 'node:assert/strict';
import {openingWorld1999 as canon} from '../public/1999/engine/canon-mini.mjs';
import {createFounding1999Universe,FOUNDING_WORLD_MODE}
 from '../public/1999/engine/founding-world-1999.mjs';
import {readLocal1999World} from '../public/1999/engine/local-api.mjs';

const founding=createFounding1999Universe({seed:19990101});
const api=(path)=>readLocal1999World(path+(path.includes('?')?'&':'?')+
  'mode=FOUNDING_1999&seed=19990101&population=112');

test('Jan 1 founding scenario replaces 325k visible TEST world but preserves historical source archive',()=>{
 assert.equal(founding.mode,FOUNDING_WORLD_MODE);
 assert.equal(founding.startDate,'1999-01-01');
 assert.equal(founding.counts.horses,39);
 assert.equal(founding.counts.worldHorses,112);
 assert.equal(founding.counts.breedingMares,55);
 assert.equal(founding.counts.breedingStallions,18);
 assert.equal(founding.counts.generatedHorses,0);
 assert.equal(founding.counts.owners,37);
 assert.equal(canon.horses.length,267);
 assert.equal(canon.organizations.length,108);
 assert.ok(canon.pedigreeNodes.length>2000);
 assert.ok(founding.counts.people<100);
});

test('every founding racing horse has canonical immutable horse ID and original owner, trainer, and pedigree',()=>{
 const source=new Map(canon.horses.map(h=>[h.id,h]));
 for(let i=0;i<founding.counts.horses;i++){
  const horse=founding.horseAt(i),old=source.get(horse.id);
  assert.ok(old,horse.id+' must be source-confirmed');
  assert.equal(horse.name,old.name);
  assert.equal(horse.ownerId,old.ownerId);
  assert.equal(horse.trainerId,old.trainerId);
  assert.equal(horse.sireId,old.sireId);
  assert.equal(horse.damId,old.damId);
  assert.equal(founding.worldIndexByHorseId(horse.id),i);
  assert.equal(founding.worldHorseDirectoryAt(i).name,old.name);
  assert.equal(founding.worldHorseDirectoryAt(i).canonical,true);
 }
 assert.equal(founding.worldIndexByHorseId('H-NOT-IN-WORLD'),-1);
});

test('founding operations carry approved names under existing owner IDs, never duplicate their owners',()=>{
 const orgs=founding.sourceOrganizations;
 assert.equal(new Set(orgs.map(o=>o.id)).size,orgs.length);
 assert.equal(new Set(orgs.map(o=>o.name.toLowerCase())).size,orgs.length);
 const look=id=>orgs.find(o=>o.id===id);
 assert.equal(look('O-000002').name,'Harrowgate Farm');
 assert.equal(look('O-000002').principalOwner,null);
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
 assert.ok(!founding.ownerAt(founding.sourceOrganizations.findIndex(o=>o.id==='O-000002')).principalOwner);
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
 assert.equal(overview.counts.worldHorses,112);
 assert.equal(overview.counts.horses,39);
 assert.equal(overview.mode,'FOUNDING_1999');
 assert.equal(api('/api/1999/organizations').total,37);
 assert.equal(api('/api/1999/horses').total,39);
 assert.equal(api('/api/1999/sim/owners').total,37);
 assert.equal(api('/api/1999/sim/world-horse-directory?limit=100').total,112);
 assert.equal(api('/api/1999/stallions').active.length,18);
 const sample=api('/api/1999/sim/owner-horses?ownerId=O-000011');
 assert.equal(sample.total,10);
 assert.ok(sample.items.every(h=>h.ownerId==='O-000011'));
});

test('founding roster is seed-deterministic and rejects out-of-range index access',()=>{
 const another=createFounding1999Universe({seed:19990101});
 assert.deepEqual(another.counts,founding.counts);
 assert.deepEqual(another.sourceOrganizations,founding.sourceOrganizations);
 assert.equal(another.horseAt(0).name,founding.horseAt(0).name);
 assert.throws(()=>founding.horseAt(39),/Founder horse index/);
 assert.throws(()=>founding.ownerAt(37),/Founder owner index/);
});
