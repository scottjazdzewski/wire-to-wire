import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 FICTIONAL_PORTFOLIO_MODEL,PORTFOLIO_TIERS,
 assessFictionalOwnerCapacity,planFictionalOwnerPortfolios,
 exportFictionalOwnerPortfolioState,importFictionalOwnerPortfolioState
} from '../public/1999/engine/fictional-owner-portfolio-planner.mjs';
import {generateOnDemandFictionalNames}
 from '../public/1999/engine/on-demand-fictional-name-batches.mjs';

const ownerIds=n=>Array.from({length:n},(_,i)=>({id:'FICTIONAL-OWNER-'+String(i+1).padStart(7,'0')}));
const smallOwners=ownerIds(8000);

test('V9 portfolio tiers are explicit fictional modeling weights, not assumed ownership-company types',()=>{
 assert.equal(FICTIONAL_PORTFOLIO_MODEL,'WTW_FICTIONAL_OWNER_PORTFOLIOS_V9');
 assert.deepEqual(PORTFOLIO_TIERS.map(t=>t.id),
  ['HANDFUL','SMALL','REGIONAL','MAJOR','ELITE']);
 assert.equal(PORTFOLIO_TIERS.reduce((sum,t)=>sum+t.weight,0),100);
 for(const tier of PORTFOLIO_TIERS){
  assert.ok(tier.min>=1&&tier.max>=tier.min);
  assert.ok(tier.weight>0);
 }
});
test('100k training horses use a long-tailed distribution with hundreds under a few owners',()=>{
 const t=planFictionalOwnerPortfolios({
  seed:19990101,owners:smallOwners,horseCount:100000
 });
 assert.equal(t.schema,FICTIONAL_PORTFOLIO_MODEL);
 assert.equal(t.horseCount,100000);
 assert.equal(t.summary.ownerCount,8000);
 assert.equal(t.summary.unownedHorses,0);
 assert.equal(t.summary.inactiveOwners,0);
 assert.equal(t.ownerIndexForHorse.length,100000);
 assert.equal(t.horseIndexesByOwner.length,100000);
 assert.equal(t.ownerHorseOffsets.length,8001);
 assert.equal(t.ownerHorseOffsets.at(-1),100000);
 assert.equal(t.horseCounts.reduce((sum,n)=>sum+n,0),100000);
 assert.ok(t.summary.ownersWithExactlyOne>500);
 assert.ok(t.summary.ownersWithOneToFive>4000,
  'most names should be small ownership holdings');
 assert.ok(t.summary.ownersWithAtLeastTwoHundred>20,
  'select elite operations should control hundreds of horses');
 assert.ok(t.summary.largestPortfolio>=250);
 assert.ok(t.summary.largestPortfolio<=900);
 assert.ok(t.summary.topOnePercentHorseShare>.13);
 assert.ok(t.summary.topOnePercentHorseShare<.35);
 assert.ok(t.summary.byTier.HANDFUL.owners>4000);
 assert.ok(t.summary.byTier.ELITE.owners>=40);
 // All horses are assigned to a stable owner ID, and the reverse portfolio
 // index returns the exact same horse indexes without scanning the full world.
 for(let i=0;i<100000;i+=997){
  const owner=t.ownerIdAtHorse(i);
  assert.ok(owner.startsWith('FICTIONAL-OWNER-'));
  const page=t.ownerPortfolio(owner,{limit:1000});
  assert.equal(page.count,t.horseCounts[t.ownerIds.indexOf(owner)]);
  assert.ok(page.horseIndexes.includes(i));
 }
 for(const id of [t.ownerIds[0],t.ownerIds[500],t.ownerIds[3999],t.ownerIds[7999]]){
  const p=t.ownerPortfolio(id,{offset:0,limit:30});
  const p2=t.ownerPortfolio(id,{offset:30,limit:30});
  assert.equal(p.ownerId,id);
  assert.ok(p.horseIndexes.length<=30&&p2.horseIndexes.length<=30);
  assert.equal(new Set([...p.horseIndexes,...p2.horseIndexes]).size,
   p.horseIndexes.length+p2.horseIndexes.length);
 }
 const second=planFictionalOwnerPortfolios({seed:19990101,owners:smallOwners,horseCount:100000});
 assert.deepEqual(second.ownerIndexForHorse,t.ownerIndexForHorse);
 assert.deepEqual(second.horseCounts,t.horseCounts);
 assert.deepEqual(second.summary,t.summary);
});
test('real historical locked horse ownership is never relocated by the allocation planner',()=>{
 const locks=[
  {horseIndex:0,ownerId:smallOwners[0].id},
  {horseIndex:1,ownerId:smallOwners[0].id},
  {horseIndex:2,ownerId:smallOwners[55].id},
  {horseIndex:99999,ownerId:smallOwners[0].id}
 ];
 const p=planFictionalOwnerPortfolios({
  seed:19990101,owners:smallOwners,horseCount:100000,lockedAssignments:locks
 });
 for(const lock of locks)assert.equal(p.ownerIdAtHorse(lock.horseIndex),lock.ownerId);
 assert.equal(p.summary.lockedHorseCount,4);
 assert.equal(p.summary.unownedHorses,0);
 assert.throws(()=>planFictionalOwnerPortfolios({
  seed:19990101,owners:smallOwners,horseCount:100000,
  existingPlan:p,lockedAssignments:[{horseIndex:0,ownerId:smallOwners[1].id}]
 }),/conflicts with existing plan/);
 assert.throws(()=>planFictionalOwnerPortfolios({
  seed:19990101,owners:smallOwners,horseCount:100000,
  lockedAssignments:[{horseIndex:0,ownerId:smallOwners[0].id},
   {horseIndex:0,ownerId:smallOwners[0].id}]
 }),/repeated locked/);
});
test('a 100k-horse world can grow to 130k while preserving every previously assigned horse',()=>{
 const initial=planFictionalOwnerPortfolios({
  seed:20700101,owners:smallOwners,horseCount:100000
 });
 const enlarged=ownerIds(11000);
 const serialized=exportFictionalOwnerPortfolioState(initial);
 assert.equal(serialized.ownerIndexes.length,100000);
 assert.equal(serialized.ownerIds.length,8000);
 const restored=importFictionalOwnerPortfolioState(
  JSON.parse(JSON.stringify(serialized)));
 assert.deepEqual(restored.ownerIndexForHorse,initial.ownerIndexForHorse);
 const broken=JSON.parse(JSON.stringify(serialized));
 broken.ownerIndexes[14]=(broken.ownerIndexes[14]+1)%8000;
 assert.throws(()=>importFictionalOwnerPortfolioState(broken),/corrupt/);
 const expanded=planFictionalOwnerPortfolios({
  seed:20700101,owners:enlarged,horseCount:130000,
  existingPlan:restored
 });
 assert.equal(expanded.horseCount,130000);
 assert.equal(expanded.ownerIds.length,11000);
 assert.equal(expanded.summary.priorHorseCount,100000);
 assert.equal(expanded.ownerHorseOffsets.at(-1),130000);
 assert.equal(expanded.horseCounts.reduce((sum,n)=>sum+n,0),130000);
 for(let i=0;i<100000;i++)assert.equal(
  expanded.ownerIndexForHorse[i],initial.ownerIndexForHorse[i],
  'an established horse moved to a different owner at '+i);
 assert.throws(()=>planFictionalOwnerPortfolios({
  seed:20700101,owners:[...smallOwners].reverse(),horseCount:130000,
  existingPlan:initial
 }),/owner IDs\/order cannot be changed/);
 assert.throws(()=>planFictionalOwnerPortfolios({
  seed:20700102,owners:enlarged,horseCount:130000,
  existingPlan:initial
 }),/Incompatible existing portfolio plan/);
});
test('325k-wide world can be allocated with O(horses+owners) typed indexes',()=>{
 const owners=ownerIds(22000);
 const p=planFictionalOwnerPortfolios({seed:19990101,owners,horseCount:325000});
 assert.equal(p.summary.horseCount,325000);
 assert.equal(p.summary.unownedHorses,0);
 assert.equal(p.summary.ownerCount,22000);
 assert.equal(p.horseIndexesByOwner.byteLength,325000*4);
 assert.equal(p.ownerIndexForHorse.byteLength,325000*4);
 assert.equal(p.ownerHorseOffsets.byteLength,(owners.length+1)*4);
 assert.ok(p.summary.ownersWithAtLeastTwoHundred>50);
 const last=p.ownerIdAtHorse(324999);
 assert.ok(owners.some(x=>x.id===last));
});
test('never silently exceed ownership capacity or generate extra owner identities',()=>{
 const tooFew=ownerIds(3500),forecast=assessFictionalOwnerCapacity({
  seed:19990101,owners:tooFew,horseCount:100000
 });
 assert.equal(forecast.ownerCount,3500);
 assert.ok(forecast.capacityShortfall>0);
 assert.equal(forecast.availableSlots+forecast.capacityShortfall,100000);
 assert.throws(()=>planFictionalOwnerPortfolios({
  seed:19990101,owners:tooFew,horseCount:100000
 }),/Insufficient owner capacity/);
 const explicit=[
  {id:'One Horse Owner',portfolioTier:'HANDFUL',maxHorses:1},
  {id:'Private Major Owner',portfolioTier:'ELITE',maxHorses:500}
 ];
 const p=planFictionalOwnerPortfolios({
  seed:99,owners:explicit,horseCount:300
 });
 assert.equal(p.ownerPortfolio('One Horse Owner').count,1);
 assert.equal(p.ownerPortfolio('Private Major Owner').count,299);
 assert.equal(p.ownerPortfolio('One Horse Owner').capacity,1);
 assert.throws(()=>planFictionalOwnerPortfolios({
  seed:99,owners:explicit,horseCount:510
 }),/Insufficient owner capacity/);
 assert.throws(()=>planFictionalOwnerPortfolios({
  seed:99,owners:[...explicit,{id:'One Horse Owner'}],horseCount:30
 }),/Duplicate or missing owner ID/);
 assert.throws(()=>planFictionalOwnerPortfolios({
  seed:99,owners:[{id:12}],horseCount:10
 }),/Owner ID must be a string/);
});
test('V8 names may be reused in the V9 portfolio planner without creating any additional group',()=>{
 const batch=generateOnDemandFictionalNames({
  worldId:'OwnerScale-Lab',seed:19990101,roles:{},owners:120,
  maxPartnershipGroups:8,soleOwnerPercent:24
 });
 assert.equal(batch.owners.length,120);
 const owners=batch.owners.map(x=>({id:x.id}));
 const plan=planFictionalOwnerPortfolios({
  seed:19990101,owners,horseCount:1200
 });
 assert.equal(plan.ownerIds.length,120);
 assert.equal(plan.horseCounts.reduce((sum,n)=>sum+n,0),1200);
 assert.ok(batch.ownership.newPartnershipGroups.length<=8);
 assert.equal(batch.nextState.ownerEntities.length,120);
 for(const item of batch.ownership.newPartnershipGroups){
  assert.ok(plan.ownerIds.includes(item.id));
 }
 // A racing-company name and a sole-person name are NOT automatically given
 // different owner tiers: money, experience and active holdings are separate.
 assert.ok(batch.owners.some(x=>x.ownershipArchetype==='INDIVIDUAL_OWNER'));
 assert.ok(batch.owners.some(x=>x.ownershipArchetype==='PRIVATE_RACING_OPERATION'));
});
test('ownership planner never mutates existing horse-generation, save, or UI files',()=>{
 const planner=readFileSync(new URL('../public/1999/engine/fictional-owner-portfolio-planner.mjs',import.meta.url),'utf8');
 const old=readFileSync(new URL('../public/1999/engine/full-world-generator.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(planner,/\b(?:fetch|localStorage|indexedDB|writeFile|setItem)\s*\(/);
 assert.doesNotMatch(old,/fictional-owner-portfolio-planner/);
 assert.doesNotMatch(old,/planFictionalOwnerPortfolios/);
});
