import test from 'node:test';
import assert from 'node:assert/strict';
import {openingWorld1999 as w} from '../src/1999/opening-world.v1.mjs';
import {readOpeningWorld1999} from '../src/1999/opening-readmodel.mjs';
const ids=rows=>new Set(rows.map(x=>x.id));
const get=url=>readOpeningWorld1999('https://wtw.invalid'+url);

test('source-verified 1999 featured opening joins are unique and complete',()=>{
 assert.equal(w.schema,'WTW_1999_FOUNDATION_OPENING_READ_MODEL_V1');
 assert.equal(w.effectiveDate,'1999-01-01');
 assert.equal(w.horses.length,267);
 assert.equal(w.organizations.length,108);
 assert.equal(w.people.length,154);
 assert.equal(w.stakes1999.length,93);
 assert.equal(w.openingEventQueue1999.length,38);
 assert.equal(ids(w.openingEventQueue1999).size,38);
 assert.ok(w.openingEventQueue1999.every(e=>e.noHiddenTruth&&e.noPlayerFavoritism&&!e.eventExecutedInThisBundle));
 assert.equal(w.historicalYearbook.length,49);
 assert.equal(ids(w.horses).size,267);
 assert.equal(ids(w.organizations).size,108);
 assert.equal(ids(w.people).size,154);
 const owners=ids(w.organizations),trainers=ids(w.people),tracks=ids(w.tracks),ancestors=ids(w.pedigreeNodes);
 for(const h of w.horses){
  assert.equal(h.ageAtOpening,1999-h.foalYear,h.id);
  assert.ok(owners.has(h.ownerId),h.id+' owner');
  assert.ok(trainers.has(h.trainerId),h.id+' trainer');
  assert.ok(tracks.has(h.openingStable.trackId),h.id+' track');
  assert.ok(ancestors.has(h.sireId)&&ancestors.has(h.damId),h.id+' parents');
  assert.equal(h.no1999Results,true);
  assert.equal(h.entryGuard,'RUNTIME_CONDITION_ELIGIBILITY_FINANCE_AND_PLAYER_AI_PARITY_REQUIRED');
  assert.ok(h.sourceRecordedStakesSeasons.every(s=>s.year<=1998));
 }
});
test('no 1999 protected future truth or unauthorized farm origins',()=>{
 assert.equal(w.sourceGovernance.protectedFutureTruth,false);
 assert.match(w.gameplayStatus,/NOT_EXECUTABLE/);
 assert.equal(w.organizations.filter(x=>Boolean(x.approvedOrigin)).length,10);
 assert.equal(w.organizations.filter(x=>!x.approvedOrigin).length,98);
 for(const org of w.organizations)if(org.publicationTier==='IDENTITY_AND_RECORD_EVIDENCE_ONLY'){
  assert.equal(org.approvedOrigin,null,org.id);
  assert.equal(org.approvedPrincipals,null,org.id);
 }
});
test('pedigree is referenced by immutable identity, not display name',()=>{
 const nodes=new Map(w.pedigreeNodes.map(x=>[x.id,x]));
 for(const h of w.horses){
  const root=nodes.get(h.id);
  assert.equal(root.name,h.name);
  assert.equal(root.sireId,h.sireId);
  assert.equal(root.damId,h.damId);
  assert.notEqual(h.sireId,h.damId);
  for(const [id,role] of [[h.sireId,'sire'],[h.damId,'dam']]){
   const p=nodes.get(id);assert.ok(p,h.id+' missing '+role);
   assert.ok(h.foalYear-p.foalYear>=2,h.id+' unrealistic '+role);
  }
 }
});
test('active stallions are unique; pending stallion is not bookable',()=>{
 assert.equal(w.activeStallions1999.length,31);
 assert.equal(ids(w.activeStallions1999).size,31);
 assert.equal(w.pendingNotBookableStallions.length,1);
 assert.equal(w.foundationalBroodmares1999.length,20);
 assert.equal(ids(w.foundationalBroodmares1999).size,20);
 assert.ok(w.activeStallions1999.every(s=>s.standingFarm1999.farmOrganizationId));
 assert.ok(w.foundationalBroodmares1999.every(s=>s.standingFarm1999.farmOrganizationId));
 assert.ok(w.foundationalBroodmares1999.every(m=>m.pregnancyStatus==='UNOBSERVED_DO_NOT_ASSUME'));
 assert.equal(w.activeStallions1999.filter(s=>s.id==='H-1990-000001').length,1);
 assert.equal(w.activeStallions1999.filter(s=>s.id==='H-1990-000002').length,1);
 assert.equal(w.pendingNotBookableStallions[0].status,'NOT_ACTIVE_PENDING_CANON');
 assert.ok(!ids(w.activeStallions1999).has(w.pendingNotBookableStallions[0].id));
});
test('no future 1999 racing result is preloaded into the stakes calendar',()=>{
 assert.equal(ids(w.stakes1999).size,93);
 for(const race of w.stakes1999){assert.match(race.localDate,/^1999-\d\d-\d\d$/);assert.ok(ids(w.tracks).has(race.trackId));assert.equal(race.entryGuard,'NO_AUTOMATIC_1999_START_OR_RESULT');assert.equal(typeof race.winner,'undefined');}
});
test('source-protected API lists and details answer without mutating state',()=>{
 assert.equal(get('/api/1999/overview').status,200);
 assert.equal(get('/api/1999/overview').data.gameplayReady,false);
 assert.equal(get('/api/1999/horses?limit=10').data.items.length,10);
 assert.equal(get('/api/1999/organizations?limit=5').data.items.length,5);
 assert.equal(get('/api/1999/calendar').data.total,93);
 assert.equal(get('/api/1999/events').data.total,38);
 assert.equal(get('/api/1999/events').data.execution,'NOT_STARTED_FROM_THIS_PROJECTION');
 const h=w.horses[0],detail=get('/api/1999/horses/'+h.id);
 assert.equal(detail.status,200);assert.equal(detail.data.horse.id,h.id);
 assert.equal(detail.data.pedigree.id,h.id);
 assert.equal(get('/api/1999/horses/H-9999-NOPE').status,404);
 assert.equal(get('/api/1999/stallions').data.active.length,31);
 assert.equal(get('/api/1999/broodmares').data.foundation.length,20);
});
