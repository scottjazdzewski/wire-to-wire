import test from 'node:test';
import assert from 'node:assert/strict';
import {plan1999Ecosystem} from '../public/1999/engine/fictional-industry-ecosystem-1999.mjs';
import {generate1999CoveringLedger,generate1999SeasonFoalingForecasts,
 resolve1999FoalBirth} from '../public/1999/engine/fictional-industry-breeding-book-1999.mjs';
test('opening covering books link distinct mares to bounded stallion services',()=>{
 const mares=new Set(),stallions=new Map();let count=0;
 for(const batch of generate1999CoveringLedger({
  seed:19990101,broodmares:63000,stallions:7000,targetCovers:59000,batchSize:3000
 })){
  for(const cover of batch.records){
   assert.ok(!mares.has(cover.mareId));mares.add(cover.mareId);
   stallions.set(cover.stallionId,(stallions.get(cover.stallionId)||0)+1);
   assert.equal(cover.pregnancy,null);
   count++;
  }
 }
 assert.equal(count,59000);
 assert.equal(mares.size,59000);
 assert.ok([...stallions.values()].every(n=>n<=220));
 assert.ok(stallions.size<7000);
});

test('annual covering books use unique current mare identities and seasonal birth forecasts vary',()=>{
 const mares=Array.from({length:2000},(_,i)=>({id:'H-MARE-'+String(i+1).padStart(7,'0'),
  ownerId:'O-OWNER-1',foalingFarmId:'O-FARM-1',status:'BROODMARE'}));
 const stallions=Array.from({length:100},(_,i)=>'H-STALLION-'+String(i+1).padStart(7,'0'));
 const mareById=new Map(mares.map(h=>[h.id,h]));
 const crops=[];
 for(const [seed,year] of [[19990101,1999],[19990101,2000],
  [19990101,2001],[19990102,2000]]){
  const coverings=[];
  for(const batch of generate1999CoveringLedger({seed,year,broodmares:mares.length,
   stallions:stallions.length,targetCovers:mares.length,mareIds:mares.map(h=>h.id),
   stallionIds:stallions,batchSize:500}))coverings.push(...batch.records);
  assert.equal(coverings.length,mares.length);
  assert.equal(new Set(coverings.map(x=>x.mareId)).size,mares.length);
  assert.ok(coverings.every(x=>stallions.includes(x.stallionId)&&x.breedingYear===year));
  const forecasts=[];
  for(const batch of generate1999SeasonFoalingForecasts({seed,year,coverings,mareById,
   batchSize:500}))forecasts.push(...batch.records);
  assert.ok(forecasts.length>0);
  assert.equal(new Set(forecasts.map(x=>x.foalId)).size,forecasts.length);
  assert.ok(forecasts.every(x=>x.status==='PROJECTED_NOT_YET_BORN'&&
   x.birthDate.startsWith(String(year))&&x.ownerId==='O-OWNER-1'&&
   x.foalingFarmId==='O-FARM-1'));
  crops.push(forecasts.filter(x=>resolve1999FoalBirth({seed,forecast:x})).length);
 }
 assert.ok(new Set(crops).size>1,'live crop outcomes should vary across seeds and seasons');
});

test('realized crops change across 10k, 300k, and 325k worlds as seasons advance',()=>{
 const seed=19990111;
 for(const size of [10000,300000,325000]){
  const opening=plan1999Ecosystem({seed,year:1999,targetOpeningHorses:size});
  let previous=opening;const realized=[];
  for(const year of [1999,2000]){
   const plan=year===1999?opening:plan1999Ecosystem({seed,year,
    previousBroodmares:previous.nextSeasonMareTurnover.closingBroodmares,
    worldScale:opening.worldScale});
   const mares=Array.from({length:plan.counts.broodmares},(_,i)=>({
    id:'H-MODELED-'+year+'-'+String(i+1).padStart(7,'0'),
    ownerId:'O-OWNER-1',foalingFarmId:'O-FARM-1',status:'BROODMARE'}));
   const stallions=Array.from({length:opening.counts.stallions},(_,i)=>
    'H-MODELED-STALLION-'+String(i+1).padStart(7,'0'));
   const coverings=[];
   for(const batch of generate1999CoveringLedger({seed,year,
    broodmares:mares.length,stallions:stallions.length,
    targetCovers:Math.min(mares.length,stallions.length*220,
     plan.minimumCoversForTargetFoals),mareIds:mares.map(h=>h.id),
    stallionIds:stallions,batchSize:5000}))coverings.push(...batch.records);
   const mareById=new Map(mares.map(h=>[h.id,h]));let forecast=0,births=0;
   for(const batch of generate1999SeasonFoalingForecasts({seed,year,coverings,
    mareById,batchSize:5000}))for(const foal of batch.records){
    forecast++;
    if(resolve1999FoalBirth({seed,forecast:foal}))births++;
   }
   assert.ok(forecast>births&&births>0);
   realized.push(births);previous=plan;
  }
  assert.notEqual(realized[0],realized[1],
   `realized crop must change by season in the ${size}-horse world`);
 }
});
