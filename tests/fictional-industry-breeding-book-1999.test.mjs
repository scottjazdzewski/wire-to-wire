import test from 'node:test';
import assert from 'node:assert/strict';
import {plan1999Ecosystem} from '../public/1999/engine/fictional-industry-ecosystem-1999.mjs';
import {generate1999CoveringLedger,generate1999SeasonFoalingForecasts,
 resolve1999FoalBirth,settle1999BookedCoverings}
 from '../public/1999/engine/fictional-industry-breeding-book-1999.mjs';
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

test('Kingmere-size and small breeder transactions settle exact stud fees and care costs without money creation',()=>{
 const year=2000;
 const mareK={id:'H-KINGSMERE-MARE',status:'BROODMARE',ownerId:'O-000061',
  foalYear:1992,careFacilityId:'O-000061',development:{soundness:80}};
 const mareS={id:'H-SMALL-MARE',status:'BROODMARE',ownerId:'O-SMALL-1',
  foalYear:1991,careFacilityId:'O-BOARDING-1',development:{soundness:65}};
 const stallion={id:'H-KINGSMERE-STUD',status:'STALLION',ownerId:'O-000061',
  foalYear:1990,ratings:{breedingValue:90}};
 const coverings=[mareK,mareS].map((mare,i)=>({
  id:'COVER-2000-'+String(i+1).padStart(7,'0'),
  mareId:mare.id,stallionId:stallion.id,breedingYear:year}));
 const args={year,coverings,
  mareById:new Map([[mareK.id,mareK],[mareS.id,mareS]]),
  stallionById:new Map([[stallion.id,stallion]]),
  farmById:new Map([['O-000061',{id:'O-000061'}],
   ['O-BOARDING-1',{id:'O-BOARDING-1'}]])};
 const first=settle1999BookedCoverings(args),second=settle1999BookedCoverings(args);
 assert.deepEqual(first,second,'fees and accounts must be deterministic');
 assert.equal(first.bookedCoverings,2);
 assert.equal(first.totalDebitsMinor,first.totalCreditsMinor);
 assert.equal(first.totalStudFeesMinor,
  first.organizations.reduce((t,a)=>t+a.studIncomeMinor,0));
 const byId=Object.fromEntries(first.organizations.map(row=>[row.organizationId,row]));
 assert.ok(byId['O-SMALL-1'].debitsMinor>0);
 assert.equal(byId['O-SMALL-1'].creditsMinor,0);
 assert.ok(byId['O-000061'].studIncomeMinor>0);
 assert.ok(byId['O-BOARDING-1'].farmCareIncomeMinor>0);
 assert.ok(byId['O-000061'].debitsMinor>0,
  'shared-owner broodmare still books the service cost, even if internal');
 assert.throws(()=>settle1999BookedCoverings({...args,coverings:[...coverings,coverings[0]]}),
  /Duplicate/);
 assert.throws(()=>settle1999BookedCoverings({...args,
  stallionById:new Map()}),/Unsettleable/);
});

test('real breeding-stock age and soundness change conception probability without guaranteed pregnancy',()=>{
 const year=2000,seed=19990101,stallion={id:'H-STALLION-1',
  status:'STALLION',foalYear:1989};
 const mare={id:'H-MARE-1',status:'BROODMARE',ownerId:'O-KINGSMERE',
  foalingFarmId:'O-FARM-1',foalYear:1990,
  development:{soundness:92}};
 const covers=Array.from({length:900},(_,i)=>({
  id:'COVER-2000-'+String(i+1).padStart(7,'0'),
  mareId:mare.id,stallionId:stallion.id,breedingYear:year}));
 const forecast=m=>[...generate1999SeasonFoalingForecasts({seed,year,
  coverings:covers,mareById:new Map([[mare.id,m]]),
  stallionById:new Map([[stallion.id,stallion]]),batchSize:500})]
  .flatMap(batch=>batch.records);
 const young=forecast(mare),aged=forecast({...mare,foalYear:1977,
  development:{soundness:35}});
 assert.ok(young.length>aged.length+100,
  'old low-soundness mares should produce fewer actual pregnancies');
 assert.ok(aged.length>0,'later breeding eligibility is not automatically zero');
 assert.ok(young.length<covers.length,'a premium mating is not a guaranteed pregnancy');
 assert.ok(young.every(record=>record.conceptionChance>aged[0].conceptionChance));
});

test('frozen 1999 covering outcomes survive V10 fertility upgrades without changing shared May save',()=>{
 const year=1999,seed=19990101;
 const mare={id:'H-V10-BROODMARE',status:'BROODMARE',
  ownerId:'O-000061',foalYear:1977,foalingFarmId:'O-000061',
  development:{soundness:22}};
 const sire={id:'H-V10-SIRE',status:'STALLION',
  ownerId:'O-000061',foalYear:1970};
 const covers=Array.from({length:100},(_,i)=>({
  id:'COVER-1999-'+String(i+1).padStart(7,'0'),mareId:mare.id,
  stallionId:sire.id,breedingYear:year}));
 const mareById=new Map([[mare.id,mare]]);
 const forecast=(stallionById)=>[...generate1999SeasonFoalingForecasts({
  seed,year,coverings:covers,mareById,stallionById,batchSize:50})]
  .flatMap(x=>x.records);
 const legacy=forecast(null),updated=forecast(new Map([[sire.id,sire]]));
 assert.deepEqual(updated,legacy,
  'opening 1999 conception and due-date identities are immutable across upgrades');
 const nextYear=covers.map(c=>({...c,breedingYear:2000,
  id:c.id.replace('1999','2000')}));
 const updated2000=[...generate1999SeasonFoalingForecasts({seed,year:2000,
  coverings:nextYear,mareById,stallionById:new Map([[sire.id,sire]])})]
  .flatMap(x=>x.records);
 assert.ok(updated2000.length<legacy.length,
  'individual fertility must affect subsequent generations, not locked 1999');
});
