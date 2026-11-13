import test from 'node:test';
import assert from 'node:assert/strict';
import {createFounding1999Universe} from '../public/1999/engine/founding-world-1999.mjs';
import {proposeFoundingYoungstock1999,FOUNDING_YOUNGSTOCK_CANDIDATE_SCHEMA}
 from '../public/1999/engine/founding-youngstock-candidates-1999.mjs';
import {readLocal1999World} from '../public/1999/engine/local-api.mjs';

const world=createFounding1999Universe({seed:19990101});
const proposal=world.proposedYoungstock;
const yearMare=new Set();
const mareIds=new Set(world.sourceBroodmares.map(x=>x.id));
const sireIds=new Set(world.sourceStallions.map(x=>x.id));
const orgIds=new Set(world.sourceOrganizations.map(x=>x.id));

test('new 1997–98 candidates draw from exact retained sire and dam IDs only',()=>{
 assert.equal(proposal.schema,FOUNDING_YOUNGSTOCK_CANDIDATE_SCHEMA);
 assert.ok(proposal.horses.length>=45&&proposal.horses.length<=110);
 assert.equal(proposal.audit.candidateCount,proposal.horses.length);
 assert.equal(proposal.audit.distinctIds,proposal.horses.length);
 assert.ok(proposal.audit.uniqueMaresPerYear);
 assert.equal(proposal.audit.namedCount,0);
 assert.equal(proposal.audit.liveGameEntriesCreated,0);
 assert.equal(proposal.audit.ownerTransactionsCreated,0);
 assert.equal(proposal.audit.farmTransfersCreated,0);
 assert.equal(world.audit.quarantinedOldB01OpeningRunners,39);
 for(const h of proposal.horses){
  assert.ok(h.id.startsWith('H-FNEW-'));
  assert.ok([1997,1998].includes(h.foalYear));
  assert.equal(h.ageAtOpening,1999-h.foalYear);
  assert.ok(['COLT','FILLY'].includes(h.sex));
  assert.ok(mareIds.has(h.damId)&&sireIds.has(h.sireId));
  assert.equal(h.registeredName,null);
  assert.equal(h.canonical,false);
  assert.equal(h.eligibleForRacing,false);
  assert.equal(h.eligibleForSales,false);
  assert.equal(h.racingOwnerOrganizationId,null);
  assert.equal(h.breederOrganizationId,null);
  assert.equal(h.foalingFarmId,null);
  assert.equal(h.foalingLocation,null);
  assert.equal(h.racingTrainerId,null);
  assert.equal(h.racingBarnId,null);
  assert.ok(orgIds.has(h.candidateFarmReferenceId));
  assert.ok(h.displayLabel.includes(h.damName)&&h.displayLabel.includes(h.sireName));
  const key=h.foalYear+':'+h.damId;
  assert.ok(!yearMare.has(key),'Mare cannot have twin foals in this annual cohort');
  yearMare.add(key);
 }
 assert.equal(world.counts.worldHorses,73);
 assert.equal(world.counts.horses,0);
 assert.equal(world.audit.sourceOpeningHorses,0);
});

test('proposals are deterministic and remain outside live state and historical pedigrees',()=>{
 const again=proposeFoundingYoungstock1999({
  seed:19990101,mares:world.sourceBroodmares,
  stallions:world.sourceStallions,organizations:world.sourceOrganizations});
 assert.deepEqual(proposal,again);
 const living=new Set(Array.from({length:world.counts.worldHorses},(_,i)=>world.worldHorseAt(i).id));
 assert.ok(proposal.horses.every(h=>!living.has(h.id)));
 assert.ok(proposal.horses.every(h=>!world.foundingAncestry.records.some(p=>p.id===h.id)));
 assert.equal(world.counts.generatedHorses,0);
 const page=readLocal1999World('/api/1999/sim/new-youngstock-proposals?limit=100');
 assert.equal(page.total,proposal.horses.length);
 assert.equal(page.items.length,proposal.horses.length);
 assert.equal(page.registeredNames,0);
 assert.equal(page.playableEntriesCreated,0);
 assert.match(page.status,/NOT_ACTIVE_GAME_STATE/);
 assert.equal(readLocal1999World('/api/1999/horses').total,0);
 assert.throws(()=>proposeFoundingYoungstock1999({mares:[],stallions:[]}),/Known founding/);
});
