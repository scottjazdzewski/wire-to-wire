import test from 'node:test';
import assert from 'node:assert/strict';
import {readLocal1999World} from '../public/1999/engine/local-api.mjs';
import {PRODUCTION_COUNT,sourcePartitionCounts,sourceIds,
 productionHorseAt,productionHorseById,productionHorsesForOwner,
 productionHorsesForTrainer,productionPedigree,productionIndexSummary} from '../public/1999/production/source-readmodel.mjs';
import {openingWorld1999 as featured} from '../src/1999/opening-world.v1.mjs';

test('all ten accepted, immutable production partitions carry 87,500 unique IDs and matching opening observations',()=>{
 assert.equal(PRODUCTION_COUNT,87500);
 assert.equal(sourcePartitionCounts.length,10);
 assert.equal(sourcePartitionCounts[0].horses,2500);
 assert.equal(sourcePartitionCounts[1].horses,5000);
 assert.ok(sourcePartitionCounts.slice(2).every(p=>p.horses===10000));
 assert.equal(sourcePartitionCounts.reduce((n,p)=>n+p.horses,0),87500);
 assert.ok(sourcePartitionCounts.every(p=>p.horses===p.openingObservables));
 assert.equal(sourceIds.length,87500);
 assert.equal(new Set(sourceIds).size,87500);
 const meta=productionIndexSummary();
 assert.equal(meta.population,87500);
 assert.equal(meta.immutableHistoricalOutcomes,true);
 assert.equal(meta.post1999ResultsCommitted,0);
 assert.equal(meta.financialOrPhysicalBarnCertification,false);
});

test('original identities, owner, trainer, sire, dam and observed career are preserved across early and late production',()=>{
 const cases=[
  ['H-1995-060001','Fox Quarry','O-000066','P-000090','H-1982-040065','H-1985-051732',16,3],
  ['H-1991-090001','Try Sundial Later','O-000682','P-000305','H-1978-040122','H-1977-070001',42,6],
  ['H-1995-140001','Torarrun','O-001028','P-000436','H-1985-110001','H-1989-120010',10,2],
  ['H-1995-153427',null,null,null,null,null,12,1]
 ];
 for(const [id,name,owner,trainer,sire,dam,starts,wins] of cases){
  const h=productionHorseById(id);
  assert.ok(h,'missing '+id);
  if(name)assert.equal(h.name,name);
  if(owner)assert.equal(h.ownerId,owner);
  if(trainer)assert.equal(h.trainerId,trainer);
  if(sire)assert.equal(h.sireId,sire);
  if(dam)assert.equal(h.damId,dam);
  assert.equal(h.career.starts,starts);
  assert.equal(h.career.wins,wins);
  assert.equal(h.nameStatus,'CANON_LOCKED');
  assert.equal(h.no1999Results,true);
  assert.equal(h.sourceStatus,'CANONICAL_ACCEPTED_OPENING_PRODUCTION');
  assert.equal(h.attributesProvenance,'NO_PROTECTED_ABILITY_EXPORTED');
 }
});

test('source-identity stable and trainer roster inverses return the exact same horse',()=>{
 const h=productionHorseById('H-1995-060001');
 const own=productionHorsesForOwner(h.ownerId),trained=productionHorsesForTrainer(h.trainerId);
 assert.ok(own.some(i=>productionHorseAt(i)?.id===h.id));
 assert.ok(trained.some(i=>productionHorseAt(i)?.id===h.id));
 const pedigree=productionPedigree(h.id,3);
 assert.equal(pedigree.id,h.id);
 assert.equal(pedigree.sire.id,h.sireId);
 assert.equal(pedigree.dam.id,h.damId);
 assert.equal(pedigree.sire.name,'Paper Quarry');
 assert.equal(pedigree.dam.name,'At Creek Fan');
 assert.equal(pedigree.sire.missingFromOpeningRunners,true);
});

test('existing 1999 browser adapter exposes source pagers without changing synchronous existing management contract',async()=>{
 const first=await readLocal1999World('/api/1999/production/horses?offset=0&limit=2');
 assert.equal(first.total,87500);assert.equal(first.items.length,2);
 assert.equal(first.items[0].id,'H-1995-060001');
 const owner=await readLocal1999World('/api/1999/production/owner-horses?ownerId=O-000066&offset=0&limit=100');
 assert.ok(owner.total>=1);
 assert.ok(owner.items.every(h=>h.ownerId==='O-000066'));
 assert.ok(owner.items.some(h=>h.id==='H-1995-060001'));
 const trainer=await readLocal1999World('/api/1999/production/trainer-horses?trainerId=P-000090&offset=0&limit=100');
 assert.ok(trainer.items.some(h=>h.id==='H-1995-060001'));
 const one=await readLocal1999World('/api/1999/production/horse/H-1995-060001');
 assert.equal(one.horse.name,'Fox Quarry');
 const pedigree=await readLocal1999World('/api/1999/production/pedigree/H-1995-060001');
 assert.equal(pedigree.pedigree.dam.id,'H-1985-051732');
 assert.equal(readLocal1999World('/api/1999/sim/overview').counts.horses,87500);
});

test('featured opening horses are reconciled as a separate immutable source scope rather than silently overwriting production IDs',()=>{
 const prod=new Set(sourceIds);
 const overlapping=featured.horses.filter(h=>prod.has(h.id));
 assert.equal(featured.horses.length,267);
 const distinct=featured.horses.filter(h=>!prod.has(h.id));
 assert.equal(distinct.length+overlapping.length,267);
 assert.equal(productionIndexSummary().sourceFeatured267Reconciliation,'NOT_YET_PROMOTED_TO_ACTIVE_WORLD');
 for(const h of distinct.slice(0,25))assert.ok(!prod.has(h.id));
});

test('accepted participant source names are linked by permanent IDs and unresolved names stay explicit',async()=>{
 const info=productionIndexSummary();
 assert.ok(info.sourceParticipantNameSummary.owners>1000);
 assert.ok(info.sourceParticipantNameSummary.trainers>500);
 assert.ok(info.coveredOwnerIdentities>1000);
 assert.ok(info.coveredTrainerIdentities>500);
 assert.equal(info.sourceFeaturedOpeningHorses,267);
 assert.equal(info.distinctCombinedOpeningHorseIds,87500+267-info.featuredIdOverlaps.length);
 assert.ok(info.featuredIdOverlaps.length<=267);
 const h=productionHorseById('H-1995-060001');
 assert.ok(h.ownerName&&h.trainerName);
 assert.match(h.trainerName,/./);
 assert.ok(['1999_FOUNDATION_SOURCE','ACCEPTED_PRODUCTION_PARTICIPANT'].includes(h.ownerNameBasis));
 const p=await readLocal1999World('/api/1999/production/participants/P-000043');
 assert.equal(p.participant.name,'Ike Benton');
 const owners=await readLocal1999World('/api/1999/production/participants/owners?limit=12');
 assert.ok(owners.total>1000);
 assert.equal(owners.items.length,12);
 assert.equal(owners.recordsSource,'ACCEPTED_1999_PRODUCTION_PARTICIPANTS');
 console.log('WTW accepted production identity coverage:',JSON.stringify({
  horseRecords:info.population,featureOverlaps:info.featuredIdOverlaps.length,
  distinctOpeningSourceIds:info.distinctCombinedOpeningHorseIds,
  ownerIds:info.ownerIds,coveredOwners:info.coveredOwnerIdentities,
  trainerIds:info.trainerIds,coveredTrainers:info.coveredTrainerIdentities,
  nameConflicts:info.sourceParticipantNameSummary.historicalNameConflicts.length
 }));
});
