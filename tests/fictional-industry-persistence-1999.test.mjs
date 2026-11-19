import test from 'node:test';
import assert from 'node:assert/strict';
import {createPersistent1999Industry,readPersistent1999IndustryBatch,findPersistent1999Horse,
 updatePersistent1999Horse,readPersistent1999HorseProfile,
 savePersistent1999CareerRun,loadPersistent1999CareerRun,
 readPersistent1999Directory,findPersistent1999Person,verifyPersistent1999WorldOpen,
 reopenPersistent1999Industry,encodePersistent1999StoredValue,
 decodePersistent1999StoredValue,PERSISTENT_INDUSTRY_COMPRESSION_SCHEMA,
 readPersistent1999LifecycleHorse,readPersistent1999FoalForecasts,
 readPersistent1999LifecycleEvents}
 from '../public/1999/engine/fictional-industry-persistence-1999.mjs';
import {generate1999SeasonFoalingForecasts,resolve1999FoalBirth}
 from '../public/1999/engine/fictional-industry-breeding-book-1999.mjs';
import {create1999SeasonalFoal}
 from '../public/1999/engine/fictional-industry-registry-1999.mjs';
function memoryStore(){
 const data={manifests:new Map(),horseBatches:new Map(),personBatches:new Map(),horseEdits:new Map(),careerRuns:new Map(),directory:new Map(),coveringBatches:new Map(),calendarBatches:new Map()};
 data.industryLifecycle=new Map();
 return {get:async(s,k)=>data[s].get(k),
  commitDirectory:async(id,manifest,records)=>{
   data.directory.set(id,structuredClone(records));
   data.manifests.set(id,structuredClone(manifest));
  },
  commitBatch:async({worldId,manifest,kind,index,records})=>{
   data[kind].set(worldId+':'+index,structuredClone(records));
   data.manifests.set(worldId,structuredClone(manifest));
  },
  commitManifest:async(id,m)=>{data.manifests.set(id,structuredClone(m))},
  putHorseEdit:async(id,horseId,edit)=>{
   const key=id+':'+horseId;
   const prior=data.horseEdits.get(key)||{};
   data.horseEdits.set(key,structuredClone({...prior,...edit}));
  },
  putCareerRun:async(id,runId,record)=>{
   if(data.manifests.get(id)?.status!=='COMPLETE')throw Error('World incomplete');
   data.careerRuns.set(id+':'+runId,structuredClone(record));
  },
  commitLifecycleRun:async({worldKey,runId,record,checkpoint,horseUpdates=[],eventWrites=[],dataWrites=[]})=>{
   if(data.manifests.get(worldKey)?.status!=='COMPLETE')throw Error('World incomplete');
   const runKey=worldKey+':'+runId;
   data.careerRuns.set(worldKey+':'+runId,structuredClone(record));
   data.industryLifecycle.set(runKey+':checkpoint',structuredClone(checkpoint));
   for(const update of horseUpdates)data.industryLifecycle.set(runKey+':horse:'+update.id,structuredClone(update));
   for(const write of [...eventWrites,...dataWrites])data.industryLifecycle.set(write.key,structuredClone(write.value));
  }};
}
const dirs={farms:[{id:'O-FARM-1',location:{country:'USA'}}],
 tracks:[{id:'T-0001'}],owners:[{id:'O-OWNER-1',maxHorses:1000000}]};
test('seasonal foals use the dam current care farm, not an unknown historical birthplace',()=>{
 const seed=19990101,year=2000,stallion={id:'H-STALLION-1'};
 const mare={id:'H-MARE-1',status:'BROODMARE',ownerId:'O-OWNER-1',
  foalingFarmId:null,careFacilityId:'O-FARM-1'};
 const coverings=Array.from({length:200},(_,i)=>({id:'COVER-'+year+'-'+
  String(i+1).padStart(7,'0'),mareId:mare.id,stallionId:stallion.id,
  breedingYear:year}));
 const foalingFarmIdByMareId=new Map([[mare.id,mare.careFacilityId]]);
 const forecasts=[...generate1999SeasonFoalingForecasts({seed,year,coverings,
  mareById:new Map([[mare.id,mare]]),foalingFarmIdByMareId,batchSize:50})]
  .flatMap(batch=>batch.records);
 assert.ok(forecasts.length>0,'seeded conceptions should produce a forecast');
 for(const forecast of forecasts){
  assert.equal(forecast.ownerId,mare.ownerId);
  assert.equal(forecast.foalingFarmId,mare.careFacilityId);
 }
 const forecast=forecasts[0];
 const foal=create1999SeasonalFoal({seed,year,dateOfBirth:forecast.birthDate,
  id:forecast.foalId,dam:mare,sire:stallion,
  farm:{id:mare.careFacilityId,location:{city:'Lexington',region:'Kentucky',country:'USA'}}});
 assert.equal(foal.ownerId,mare.ownerId);
 assert.equal(foal.breederId,mare.ownerId);
 assert.equal(foal.foalingFarmId,mare.careFacilityId);
 assert.equal(foal.careFacilityId,mare.careFacilityId);
 assert.equal(foal.birthplace.farmId,mare.careFacilityId);
});
test('large durable industry batches gzip compact and legacy raw records remain readable',async()=>{
 const batch=Array.from({length:2500},(_,i)=>({
  id:'H-FICTIONAL-1999-THREEYEAROLDRUNNERS-'+String(i+1).padStart(7,'0'),
  name:'Copper Horizon',status:'RACING',sex:i%2?'F':'M',foalYear:1996,
  ownerId:'O-FICTIONAL-OWNER-T-0001-01',homeTrackId:'T-0001',
  ratings:{speed:67,stamina:64,class:62,form:59},
  birthplace:{city:'Lexington',region:'Kentucky',country:'USA'}}));
 const rawBytes=Buffer.byteLength(JSON.stringify(batch));
 const compact=await encodePersistent1999StoredValue(batch);
 assert.equal(compact.schema,PERSISTENT_INDUSTRY_COMPRESSION_SCHEMA);
 assert.equal(compact.rawBytes,rawBytes);
 assert.ok(compact.data.byteLength<rawBytes/4,
  'modeled horse batches should use substantially less durable storage');
 assert.deepEqual(await decodePersistent1999StoredValue(compact),batch);
 assert.equal(await decodePersistent1999StoredValue(batch),batch,
  'legacy structured-clone records should remain readable');
});
// Keep the in-memory persistence fixture bounded. The real Chromium acceptance
// separately generates and reopens the complete 300,000-horse world.
test('full 1999 industry persists and reopens exactly without regeneration',async()=>{
 const store=memoryStore();
 const params={store,seed:19990101,worldId:'FullTest',targetOpeningHorses:12000,
  ...dirs,batchSize:4000};
 assert.equal(await reopenPersistent1999Industry(store,{seed:params.seed,
  worldId:params.worldId}),null);
 const a=await createPersistent1999Industry(params);
 assert.equal(a.status,'COMPLETE');
 const reopened=await reopenPersistent1999Industry(store,{seed:params.seed,
  worldId:params.worldId});
 assert.equal(reopened.status,'READY');
 assert.deepEqual(reopened.manifest,a);
 const certificate=await verifyPersistent1999WorldOpen(store,a);
 assert.equal(certificate.status,'OPEN_VERIFIED');
 assert.equal(certificate.horses,a.horseCount);
 assert.equal(certificate.raceDays,a.scheduledCards);
 assert.equal(certificate.scheduledRaces,a.scheduledRaces);
 const finalCalendar=await readPersistent1999IndustryBatch(store,a,'calendarBatches',
  a.calendarBatchesCommitted-1);
 assert.equal(finalCalendar.length,
  a.scheduledCards-(a.calendarBatchesCommitted-1)*100);

 assert.equal(a.horseCount,12000);
 assert.equal(a.ownerPortfolio.schema,'WTW_FICTIONAL_OWNER_PORTFOLIOS_V10');
 assert.equal(a.personNameRevision,'WTW_1999_PROFESSIONAL_ROLE_NAMES_V5');
 assert.equal(a.ownerPortfolio.capacityShortfall,0);
 assert.equal(Object.values(a.ownerPortfolio.byTier).reduce(
  (sum,tier)=>sum+tier.horses,0),12000);
 assert.equal(a.targetOpeningHorses,12000);
 assert.ok(a.personCount>0);
 assert.ok(a.coveringCount>0);
 assert.ok(a.coveringBatchesCommitted>0);
 assert.ok(a.scheduledCards>0);
 assert.ok(a.scheduledRaces>a.scheduledCards);
 assert.ok(a.calendarBatchesCommitted>0);
 const firstCards=await readPersistent1999IndustryBatch(store,a,'calendarBatches',0);
 assert.ok(firstCards.every(c=>c.races.every(r=>r.winnerId===null&&
  r.fieldHorseIds.length===0&&r.status==='SCHEDULED')));
 const firstCoverings=await readPersistent1999IndustryBatch(store,a,'coveringBatches',0);
 assert.ok(firstCoverings.every(c=>c.mareId.startsWith('H-FICTIONAL-1999-BROODMARES-')&&
  c.stallionId.startsWith('H-FICTIONAL-1999-STALLIONS-')&&
  c.status==='COVERING_BOOKED'&&c.liveFoalId===null));
 const first=await readPersistent1999IndustryBatch(store,a,'horseBatches',0);
 assert.equal(first[0].id,'H-FICTIONAL-1999-BROODMARES-0000001');
 assert.ok(first[0].ratings.speed>=15);
 assert.ok(first[0].name&&first[0].namingStatus==='PROVISIONAL_EDITABLE_1999_OPENING');
 assert.ok(a.horseNamingRevision.includes('OPENING_INDUSTRY_V1'));
 assert.equal(a.horseNamingRevision,'WTW_LOCAL_NAMING_RULES_V488:OPENING_INDUSTRY_V1',
  'an existing V488 career must remain reopenable after naming preferences upgrade');
 const namedAdult=await findPersistent1999Horse(store,a,
  'H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000001');
 assert.ok(namedAdult.name&&namedAdult.namingRevision===a.horseNamingRevision);
 const yearling=await findPersistent1999Horse(store,a,
  'H-FICTIONAL-1999-YEARLINGS-0000001');
 assert.ok(yearling.name&&yearling.namingStatus==='PROVISIONAL_EDITABLE_1999_OPENING');
 assert.equal(yearling.namingRevision,a.horseNamingRevision);
 assert.ok(first[0].relationships.some(e=>e.type==='OWNED_BY'));
 const runner=await findPersistent1999Horse(store,a,
  'H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000001');
 assert.ok(['HANDFUL','SMALL','REGIONAL','MAJOR','ELITE'].includes(
  runner.ownerPortfolioTier));
 assert.ok(runner.trainerId&&runner.jockeyId&&runner.homeTrackId);
 const staff=[];
 for(let i=0;i<a.personBatchesCommitted;i++)
  staff.push(...await readPersistent1999IndustryBatch(store,a,'personBatches',i));
 const trainer=staff.find(p=>p.id===runner.trainerId);
 const trainerLookup=await findPersistent1999Person(store,a,runner.trainerId);
 assert.deepEqual(trainerLookup,trainer);
 assert.ok(trainerLookup.dateOfBirth&&trainerLookup.birthplace.city);
 assert.equal(trainerLookup.birthplace.countryCode,trainerLookup.birthCountryCode);
 const jockey=staff.find(p=>p.id===runner.jockeyId);
 assert.equal(trainer?.workplaceId,runner.homeTrackId);
 assert.equal(jockey?.workplaceId,runner.homeTrackId);
 const directory=await readPersistent1999Directory(store,a);
 assert.equal(directory.length,3);
 assert.ok(directory.every(e=>e.ratings&&Array.isArray(e.relationships)));
 const b=await createPersistent1999Industry(params);
 assert.deepEqual(b,a);
 assert.equal((await verifyPersistent1999WorldOpen(store,b)).status,'OPEN_VERIFIED');
 await assert.rejects(createPersistent1999Industry({...params,
  tracks:[{id:'T-DIFFERENT'}]}),/generation parameters conflict/);
 assert.deepEqual(await readPersistent1999IndustryBatch(store,b,'horseBatches',0),first);
 assert.deepEqual(await findPersistent1999Horse(store,b,first[0].id),first[0]);
 assert.equal(await findPersistent1999Horse(store,b,'H-FICTIONAL-1999-BROODMARES-9999999'),null);
 await updatePersistent1999Horse(store,b,first[0].id,{name:'Copper Horizon'});
 const edited=await readPersistent1999HorseProfile(store,b,first[0].id);
 assert.equal(edited.name,'Copper Horizon');
 assert.equal(edited.id,first[0].id,'the horse ID is immutable under rename');
 // Each later transaction modifies only its selected fields; previous naming
 // edits and subsequent owner/care edits must coexist in the SAME stored row.
 const statusPatch=await updatePersistent1999Horse(store,b,first[0].id,{
  status:'RETIRED_BROODMARE'
 });
 assert.equal(statusPatch.name,'Copper Horizon','status change must not erase name');
 assert.equal(statusPatch.status,'RETIRED_BROODMARE');
 const ownerPatch=await updatePersistent1999Horse(store,b,first[0].id,{
  ownerId:first[0].ownerId
 });
 assert.equal(ownerPatch.name,'Copper Horizon','owner change must not erase name');
 assert.equal(ownerPatch.status,'RETIRED_BROODMARE','owner change must retain status');
 const renamedAgain=await updatePersistent1999Horse(store,b,first[0].id,{
  name:'Copper Afterglow'
 });
 assert.equal(renamedAgain.name,'Copper Afterglow');
 assert.equal(renamedAgain.status,'RETIRED_BROODMARE');
 assert.equal(renamedAgain.sireId,first[0].sireId,'pedigree sire must not change');
 assert.equal(renamedAgain.damId,first[0].damId,'pedigree dam must not change');
 await assert.rejects(updatePersistent1999Horse(store,b,first[0].id,{
  sireId:'H-BAD-PARENT'
 }),/immutable or unsupported/);
 assert.equal((await findPersistent1999Horse(store,b,first[0].id)).name,first[0].name);
 const revised=await readPersistent1999HorseProfile(store,b,first[0].id);
 assert.equal(revised.name,'Copper Afterglow');
 assert.equal(revised.status,'RETIRED_BROODMARE');
 assert.equal(revised.ownerId,first[0].ownerId);
 assert.equal(revised.id,first[0].id);
 const run=await savePersistent1999CareerRun(store,b,{runId:'career-1',
  player:{role:'owner',organizationId:'O-OWNER-1'},
  changes:{balanceMinor:123456},gameDate:'1999-02-01'});
 assert.deepEqual(await loadPersistent1999CareerRun(store,b,'career-1'),run);
 assert.equal((await readPersistent1999HorseProfile(store,b,first[0].id)).name,'Copper Afterglow');
 assert.equal((await readPersistent1999HorseProfile(store,b,first[0].id)).status,'RETIRED_BROODMARE');
});
test('interrupted industry genesis resumes at committed checkpoint',async()=>{
 const store=memoryStore();let writes=0;
 const interrupted={...store,commitBatch:async(args)=>{
  if(++writes===3)throw Error('Simulated crash');
  return store.commitBatch(args);
 }};
 const params={seed:19990102,worldId:'ResumeTest',targetOpeningHorses:12000,
  ...dirs,batchSize:5000};
 await assert.rejects(createPersistent1999Industry({...params,store:interrupted}),/Simulated crash/);
 const saved=await store.get('manifests','ResumeTest:19990102');
 assert.equal(saved.status,'GENERATING');
 assert.equal((await reopenPersistent1999Industry(store,{seed:params.seed,
  worldId:params.worldId})).status,'GENERATING');
 assert.equal(saved.horseBatchesCommitted,2);
 const done=await createPersistent1999Industry({...params,store});
 assert.equal(done.status,'COMPLETE');
 assert.ok(done.horseBatchesCommitted>2);
 assert.ok(done.coveringBatchesCommitted>0);
});

test('a canon organization used as owner and farm stays one permanent directory identity',async()=>{
 const store=memoryStore(),shared={id:'O-000061',name:'Kingsmere Farm',
  location:{city:'Versailles',region:'Kentucky',country:'USA'},
  homeTrackId:'T-0001',operatingRoles:['BREEDER','LEGAL_OWNER'],
  portfolioTier:'ELITE',maxHorses:900};
 const regional={id:'O-TEST-REGIONAL',name:'Regional Partnership',
  type:'RACING PARTNERSHIP',locationLabel:'Lexington, Kentucky, USA',
  geographyRecords:[{locality:'Lexington',region:'Kentucky',country:'USA'}],
  homeTrackId:'T-0001'};
 const owners=[shared,regional,...Array.from({length:11},(_,i)=>({
  id:'O-TEST-ELITE-'+String(i+1).padStart(2,'0'),portfolioTier:'ELITE',
  maxHorses:900,homeTrackId:'T-0001'}))];
 const manifest=await createPersistent1999Industry({store,seed:19990117,
  worldId:'CanonDualRole',targetOpeningHorses:10000,batchSize:5000,
  tracks:[{id:'T-0001',location:{region:'Kentucky',country:'USA'}}],
  farms:[shared],owners});
 const directory=await readPersistent1999Directory(store,manifest);
 const canon=directory.filter(row=>row.id==='O-000061');
 assert.equal(canon.length,1);
 assert.ok(canon[0].operatingRoles.includes('BREEDING_OR_CARE_FACILITY'));
 assert.ok(canon[0].operatingRoles.includes('LEGAL_OWNER'));
 assert.ok(canon[0].roleRatings.owner&&canon[0].roleRatings.farm);
 assert.equal(canon[0].relationships.filter(e=>e.type==='REGIONAL_CIRCUIT').length,1);
 assert.deepEqual(directory.find(row=>row.id===regional.id).location,
  {city:'Lexington',region:'Kentucky',country:'USA'});
 const owned=await readPersistent1999IndustryBatch(store,manifest,'horseBatches',0);
 assert.ok(owned.some(h=>h.ownerId==='O-000061'));
});

test('approved founding breeding residents keep IDs in the exact population and lifecycle',async()=>{
 const store=memoryStore(),source={id:'H-1991-000006',name:'Heyday',
  status:'STALLION',cohort:'stallion',sex:'HORSE',foalYear:1991,
  ownerId:null,breederId:'O-FARM-1',foalingFarmId:'O-FARM-1',
  careFacilityId:'O-FARM-1',managementOrganizationId:'O-OWNER-1',
  sourcePedigree:{sireId:null,damId:null},sourceRecord:{id:'H-1991-000006',
   name:'Heyday',firstBreedingSeason:1996,evidenceStatus:'ACTIVE_UNPROVEN_CLASSIC_SIRE'}};
 const manifest=await createPersistent1999Industry({store,seed:19990131,
  worldId:'ApprovedFoundingResident',targetOpeningHorses:10000,
  foundingHorses:[source],...dirs,batchSize:1000});
 assert.equal(manifest.horseCount,10000);
 assert.equal(manifest.generatedHorseCount,9999);
 assert.equal(manifest.foundingHorseCount,1);
 const preserved=await findPersistent1999Horse(store,manifest,source.id);
 assert.equal(preserved.id,source.id);
 assert.equal(preserved.name,'Heyday');
 assert.equal(preserved.sourceRecord.firstBreedingSeason,1996);
 assert.equal(preserved.careFacilityId,'O-FARM-1');
 const run=await savePersistent1999CareerRun(store,manifest,{runId:'founding-resident',
  gameDate:'1999-01-02',player:{role:'owner',operation_id:'O-OWNER-1'}});
 assert.equal(run.lifecycle.activeStallions,manifest.plan.counts.stallions+1,
  'approved active breeding residents join the same saved-world breeding pool');
});

test('incomplete worlds cannot receive playable career runs',async()=>{
 const store=memoryStore();
 const incomplete={schema:'WTW_PERSISTENT_INDUSTRY_1999_V1',
  worldId:'Incomplete',seed:19990101,status:'GENERATING'};
 await assert.rejects(savePersistent1999CareerRun(store,incomplete,{
  runId:'bad',player:{role:'owner'}}),/Invalid persistent industry career run/);
});

test('opening certificate rejects missing durable race calendar data',async()=>{
 const store=memoryStore();
 const params={store,seed:19990103,worldId:'CalendarCorruption',...dirs,
  targetOpeningHorses:12000,batchSize:5000};
 const world=await createPersistent1999Industry(params);
 const broken={...store,get:async(kind,key)=>{
  if(kind==='calendarBatches')return undefined;
  return store.get(kind,key);
 }};
 await assert.rejects(verifyPersistent1999WorldOpen(broken,world),
  /Industry batch missing from durable storage/);
 await assert.rejects(reopenPersistent1999Industry(broken,{
  seed:params.seed,worldId:params.worldId}),
  /Industry batch missing from durable storage/);
});


test('exact custom industry size persists independently and cannot silently change',async()=>{
 const store=memoryStore(),params={store,seed:19990107,worldId:'Sized12000',
  targetOpeningHorses:12000,...dirs,batchSize:5000};
 const manifest=await createPersistent1999Industry(params);
 assert.equal(manifest.status,'COMPLETE');
 assert.equal(manifest.horseCount,12000);
 assert.equal(manifest.targetOpeningHorses,12000);
 assert.equal((await verifyPersistent1999WorldOpen(store,manifest)).horses,12000);
 assert.deepEqual(await createPersistent1999Industry(params),manifest);
 await assert.rejects(createPersistent1999Industry({...params,targetOpeningHorses:15000}),
  /generation parameters conflict/);
 assert.equal((await reopenPersistent1999Industry(store,{seed:params.seed,
  worldId:params.worldId})).manifest.horseCount,12000);
});

test('career date commits foals only on due dates and persists aging and mare turnover',async()=>{
 const store=memoryStore();
 const manifest=await createPersistent1999Industry({store,seed:19990111,
  worldId:'LifecycleTest',targetOpeningHorses:10000,...dirs,batchSize:1000});
 const runId='WTW-RUN-1999-'+manifest.seed+'-SIZE-10000';
 const player={role:'owner',organizationId:'O-OWNER-1'};
 const opening=await savePersistent1999CareerRun(store,manifest,{runId,
  gameDate:'1999-01-01',player,changes:{},version:1});
 assert.equal(opening.lifecycle.openingHorseCount,10000);
 assert.equal(manifest.horseCount,10000,'unborn foals do not change opening size');
 const forecasts=await readPersistent1999FoalForecasts(store,manifest,runId,1999);
 assert.ok(forecasts.length>100);
 assert.ok(forecasts.every(f=>!f.materialized&&!f.resolved));
 const firstDate=forecasts.map(f=>f.birthDate).sort()[0];
 const firstId=forecasts.find(f=>f.birthDate===firstDate).foalId;
 assert.equal(await readPersistent1999LifecycleHorse(store,manifest,runId,firstId),null,
  'a forecast is not a horse before birth');
 const before=new Date(Date.parse(firstDate+'T00:00:00Z')-86400000)
  .toISOString().slice(0,10);
 await savePersistent1999CareerRun(store,manifest,{runId,gameDate:before,
  player,changes:{},version:2});
 assert.equal(await readPersistent1999LifecycleHorse(store,manifest,runId,firstId),null);
 const liveForecast=forecasts.find(f=>resolve1999FoalBirth({seed:manifest.seed,forecast:f}));
 assert.ok(liveForecast,'seed should produce a live foal');
 await savePersistent1999CareerRun(store,manifest,{runId,
  gameDate:liveForecast.birthDate,player,changes:{},version:3});
 const born=await readPersistent1999LifecycleHorse(store,manifest,runId,liveForecast.foalId);
 assert.equal(born.status,'FOAL');
 assert.equal(born.dateOfBirth,liveForecast.birthDate);
 assert.equal(born.sireId,liveForecast.sireId);
 assert.equal(born.damId,liveForecast.damId);
 assert.equal(born.ownerId,liveForecast.ownerId);
 assert.equal(born.foalingFarmId,liveForecast.foalingFarmId);
 assert.equal((await readPersistent1999HorseProfile(store,manifest,
  liveForecast.foalId,{runId})).dateOfBirth,liveForecast.birthDate);
 assert.equal(await findPersistent1999Horse(store,manifest,liveForecast.foalId),null,
  'a seasonal child remains outside the immutable opening census');
 await savePersistent1999CareerRun(store,manifest,{runId,gameDate:'1999-12-31',
  player,changes:{},version:4});
 const rollover=await savePersistent1999CareerRun(store,manifest,{runId,
  gameDate:'2000-01-01',player,changes:{},version:5});
 assert.equal(manifest.horseCount,10000);
 assert.ok(rollover.lifecycle.population>10000);
 assert.equal(rollover.lifecycle.population,
  10000+rollover.lifecycle.birthsByYear[1999]-
   rollover.lifecycle.deathsByYear[2000]);
 const turnover=await readPersistent1999LifecycleEvents(store,manifest,runId,
  '2000-01-01');
 const change=turnover.find(x=>x.type==='BROODMARE_TURNOVER');
 const stallionChange=turnover.find(x=>x.type==='STALLION_TURNOVER');
 const attrition=turnover.filter(x=>x.type==='YOUNGSTOCK_ATTRITION');
 assert.equal(attrition.length,2);
 const foalLosses=attrition.find(x=>x.stage==='FOAL_TO_YEARLING');
 const yearlingLosses=attrition.find(x=>x.stage==='YEARLING_TO_TWO_YEAR_OLD');
 assert.ok(foalLosses.deaths>0&&foalLosses.closingCohortSize<foalLosses.openingCohortSize);
 assert.ok(yearlingLosses.deaths>0&&yearlingLosses.closingCohortSize<yearlingLosses.openingCohortSize);
 assert.equal(rollover.lifecycle.deathsByYear[2000],
  foalLosses.deaths+yearlingLosses.deaths);
 const deadIds=attrition.flatMap(x=>x.deathHorseIds);
 assert.equal(new Set(deadIds).size,deadIds.length,
  'each horse can die in only one cohort transition');
 const deadFoal=await readPersistent1999LifecycleHorse(store,manifest,runId,
  foalLosses.deathHorseIds[0]);
 assert.equal(deadFoal.status,'DECEASED');
 assert.equal(deadFoal.deathStage,'FOAL_TO_YEARLING');
 assert.equal(deadFoal.deathDate,'2000-01-01');
 assert.equal(deadFoal.damId,forecasts.find(f=>f.foalId===deadFoal.id).damId);
 assert.ok(deadFoal.sireId&&deadFoal.ownerId&&deadFoal.foalingFarmId,
  'a deceased horse retains parentage, ownership, and foaling location');
 assert.ok(change&&change.retired>0&&change.graduated>0);
 assert.ok(stallionChange&&stallionChange.retired>0);
 assert.equal(stallionChange.closingStallions,
  stallionChange.openingStallions-stallionChange.retired+
   stallionChange.graduated);
 assert.equal(stallionChange.retiredHorseIds.length,stallionChange.retired);
 const stallionPool=await store.get('industryLifecycle',manifest.worldId+':'+
  manifest.seed+':'+runId+':stallion-pool:2000');
 assert.equal(stallionPool.length,stallionChange.closingStallions);
 assert.equal(new Set(stallionPool).size,stallionPool.length);
 const retiredStallion=await readPersistent1999LifecycleHorse(store,manifest,
  runId,stallionChange.retiredHorseIds[0]);
 assert.equal(retiredStallion.status,'RETIRED_STALLION');
 assert.equal(retiredStallion.breedingStatus,'RETIRED');
 const season2000=await store.get('industryLifecycle',manifest.worldId+':'+
  manifest.seed+':'+runId+':season:2000');
 assert.ok(season2000.plannedFoals>0&&season2000.marketConditions.marketIndex>0);
 assert.equal(change.closingBroodmares,
  change.openingBroodmares-change.retired+change.graduated);
 const retired=await readPersistent1999LifecycleHorse(store,manifest,runId,
  change.retiredHorseIds[0]);
 const graduate=await readPersistent1999LifecycleHorse(store,manifest,runId,
  change.graduatedHorseIds[0]);
 assert.equal(retired.status,'RETIRED_BROODMARE');
 assert.equal(retired.breedingStatus,'RETIRED');
 assert.equal(graduate.status,'BROODMARE');
 assert.equal(graduate.sex,'MARE');
 assert.equal(graduate.graduatedYear,2000);
 let agedYearling=null;
 for(let i=1;i<=manifest.plan.counts.yearlings&&!agedYearling;i++){
  const horse=await readPersistent1999LifecycleHorse(store,manifest,runId,
   'H-FICTIONAL-1999-YEARLINGS-'+String(i).padStart(7,'0'));
  if(horse?.status==='TWO_YEAR_OLD_PROSPECT')agedYearling=horse;
 }
 assert.ok(agedYearling,'surviving opening yearling should enter the 2YO cohort');
 assert.equal(agedYearling.cohort,'twoYearOldProspects');
 const reopened=await loadPersistent1999CareerRun(store,manifest,runId);
 assert.deepEqual(reopened.lifecycle,rollover.lifecycle);
 assert.equal((await readPersistent1999LifecycleHorse(store,manifest,runId,
  change.retiredHorseIds[0])).status,'RETIRED_BROODMARE');
 assert.equal((await readPersistent1999LifecycleHorse(store,manifest,runId,
  change.graduatedHorseIds[0])).status,'BROODMARE');
 assert.equal((await readPersistent1999LifecycleHorse(store,manifest,runId,
  deadFoal.id)).status,'DECEASED','attrition status survives save/reopen');
 assert.equal((await readPersistent1999HorseProfile(store,manifest,
  change.retiredHorseIds[0])).status,'RETIRED_BROODMARE',
  'canonical profile lookup reads the persisted lifecycle without UI changes');
 await assert.rejects(savePersistent1999CareerRun(store,manifest,{runId,
  gameDate:'1999-12-31',player,changes:{},version:6}),/cannot move backward/);
 const repeated=await savePersistent1999CareerRun(store,manifest,{runId,
  gameDate:'2000-01-01',player,changes:{},version:6});
 assert.deepEqual(repeated.lifecycle,rollover.lifecycle,
  'saving the same rollover twice must not repeat births, deaths, or transitions');
 const reopenedFoal=await readPersistent1999LifecycleHorse(store,manifest,runId,
  liveForecast.foalId);
 assert.ok(['YEARLING','DECEASED'].includes(reopenedFoal.status));
 assert.equal(reopenedFoal.dateOfBirth,born.dateOfBirth);
 await savePersistent1999CareerRun(store,manifest,{runId,gameDate:'2001-01-01',
  player,changes:{},version:6});
 const yearTwo=await loadPersistent1999CareerRun(store,manifest,runId);
 assert.ok(yearTwo.lifecycle.birthsByYear[2000]>0);
 assert.equal(yearTwo.lifecycle.population,10000+
  yearTwo.lifecycle.birthsByYear[1999]+yearTwo.lifecycle.birthsByYear[2000]-
  yearTwo.lifecycle.horseDeaths);
 const yearTwoEvents=await readPersistent1999LifecycleEvents(store,manifest,runId,
  '2001-01-01');
 const yearTwoAttrition=yearTwoEvents.find(x=>x.type==='YOUNGSTOCK_ATTRITION'&&
  x.stage==='YEARLING_TO_TWO_YEAR_OLD');
 assert.ok(yearTwoAttrition?.deaths>0);
 const deadIdSet=new Set([...attrition,...yearTwoEvents.filter(x=>
  x.type==='YOUNGSTOCK_ATTRITION')].flatMap(x=>x.deathHorseIds));
 const agedFirstFoalForecast=forecasts.find(f=>resolve1999FoalBirth({
  seed:manifest.seed,forecast:f})&&!deadIdSet.has(f.foalId));
 assert.ok(agedFirstFoalForecast,'a surviving 1999 foal should enter the 2YO cohort');
 const agedFirstFoal=await readPersistent1999LifecycleHorse(store,manifest,runId,
  agedFirstFoalForecast.foalId);
 assert.equal(agedFirstFoal.status,'TWO_YEAR_OLD_PROSPECT');
 assert.equal(agedFirstFoal.cohort,'twoYearOldProspects');
 assert.equal(agedFirstFoal.age,2);
 assert.equal(agedFirstFoal.dateOfBirth,agedFirstFoalForecast.birthDate);
 const closedCrop=await readPersistent1999FoalForecasts(store,manifest,runId,1999);
 assert.ok(closedCrop.every(f=>f.resolved));
 const liveCrop=closedCrop.filter(f=>f.materialized);
 assert.equal(liveCrop.length,yearTwo.lifecycle.birthsByYear[1999]);
 assert.equal(closedCrop.length,liveCrop.length+
  yearTwo.lifecycle.lossesByYear[1999]);
 assert.equal(new Set(liveCrop.map(f=>f.foalId)).size,liveCrop.length);
 const directory=await readPersistent1999Directory(store,manifest);
 for(const forecast of liveCrop){
  const foal=await readPersistent1999LifecycleHorse(store,manifest,runId,forecast.foalId);
  const dam=await readPersistent1999LifecycleHorse(store,manifest,runId,forecast.damId);
  const sire=await findPersistent1999Horse(store,manifest,forecast.sireId);
  assert.ok(dam&&sire&&directory.some(x=>x.id===forecast.foalingFarmId));
  assert.equal(foal.sireId,sire.id);
  assert.equal(foal.damId,dam.id);
  assert.equal(foal.ownerId,forecast.ownerId);
  assert.equal(foal.birthplace.farmId,forecast.foalingFarmId);
 }
 assert.notEqual(yearTwo.lifecycle.birthsByYear[2000],
  yearTwo.lifecycle.birthsByYear[1999],
  'realized foal totals should vary as the seed and active mare pool change');
 await savePersistent1999CareerRun(store,manifest,{runId,gameDate:'2002-01-01',
  player,changes:{},version:7});
 let eligibleSeasonalFilly=null;
 for(const forecast of forecasts){
  if(deadIdSet.has(forecast.foalId)||!resolve1999FoalBirth({
   seed:manifest.seed,forecast}))continue;
  const horse=await readPersistent1999LifecycleHorse(store,manifest,runId,
   forecast.foalId);
  if(horse?.age===3&&horse.sex==='MARE'&&horse.status==='RACING'){
   eligibleSeasonalFilly=horse;break;
  }
 }
 assert.ok(eligibleSeasonalFilly,
  'a surviving 1999 filly should mature into the eligible 3YO racing cohort');
 await savePersistent1999CareerRun(store,manifest,{runId,gameDate:'2003-01-01',
  player,changes:{},version:8});
 const yearFour=await loadPersistent1999CareerRun(store,manifest,runId);
 const turnover2003=(await readPersistent1999LifecycleEvents(store,manifest,runId,
  '2003-01-01')).find(event=>event.type==='BROODMARE_TURNOVER');
 const seasonalGraduate=turnover2003?.graduatedHorseIds.find(id=>
  id.startsWith('H-FICTIONAL-1999-FOALS-1999-'));
 assert.ok(seasonalGraduate,
  'a surviving seasonal filly should graduate after aging into the eligible racing cohort');
 const graduatedFoal=await readPersistent1999LifecycleHorse(store,manifest,runId,
  seasonalGraduate);
 assert.equal(graduatedFoal.status,'BROODMARE');
 assert.equal(graduatedFoal.cohort,'broodmares');
 assert.equal(graduatedFoal.sex,'MARE');
 assert.equal(graduatedFoal.foalYear,1999);
 assert.equal(graduatedFoal.graduatedYear,2003);
 assert.ok(graduatedFoal.damId&&graduatedFoal.sireId&&graduatedFoal.ownerId&&
  graduatedFoal.foalingFarmId,'graduation preserves the horse record and pedigree');
 const breedingPool=await store.get('industryLifecycle',manifest.worldId+':'+
  manifest.seed+':'+runId+':breeding-pool:2003');
 assert.equal(breedingPool.filter(id=>id===seasonalGraduate).length,1,
  'the graduated filly enters the persisted active breeding pool exactly once');
 assert.ok(yearFour.lifecycle.population===10000+
  Object.values(yearFour.lifecycle.birthsByYear).reduce((sum,n)=>sum+n,0)-
  yearFour.lifecycle.horseDeaths);
 assert.equal((await loadPersistent1999CareerRun(store,manifest,runId)).lifecycle.lastDate,
  '2003-01-01','longer cohort and breeding changes survive reopen');
});

test('small persistent industry keeps births, cohorts, and breeding records coherent for three decades',async()=>{
 const store=memoryStore(),manifest=await createPersistent1999Industry({store,
  seed:19990111,worldId:'LifecycleDecades',targetOpeningHorses:10000,
  ...dirs,batchSize:1000});
 const runId='WTW-RUN-1999-'+manifest.seed+'-SIZE-10000';
 const player={role:'owner',organizationId:'O-OWNER-1'};
 const opening=await savePersistent1999CareerRun(store,manifest,{runId,
  gameDate:'1999-01-01',player,changes:{},version:1});
 assert.equal(opening.lifecycle.openingHorseCount,10000);
 const births=[],populations=[];
 const deathsSeen=new Set(),graduatesSeen=new Set(),retirementsSeen=new Set();
 const directory=await readPersistent1999Directory(store,manifest);
 const directoryIds=new Set(directory.map(entity=>entity.id));
 const stallionsRetiredSeen=new Set(),stallionsGraduatedSeen=new Set();
 const marketIndices=[],plannedFoalCrops=[];
 for(let year=2000;year<=2031;year++){
  const date=year+'-01-01';
  const saved=await savePersistent1999CareerRun(store,manifest,{runId,
   gameDate:date,player,changes:{},version:year-1998});
  const reopened=await loadPersistent1999CareerRun(store,manifest,runId);
  assert.deepEqual(reopened.lifecycle,saved.lifecycle,
   'career checkpoint should be durable after every annual save');
  assert.equal(saved.lifecycle.lastDate,date);
  assert.equal(saved.lifecycle.seasonYear,year);
  assert.equal(saved.lifecycle.openingHorseCount,10000);
  const totalBirths=Object.values(saved.lifecycle.birthsByYear)
   .reduce((sum,count)=>sum+count,0);
  assert.equal(saved.lifecycle.population,10000+totalBirths-saved.lifecycle.horseDeaths,
   'population equals the opening census plus live births minus individual deaths');
  const events=await readPersistent1999LifecycleEvents(store,manifest,runId,date);
  const turnover=events.find(event=>event.type==='BROODMARE_TURNOVER');
  const stallionTurnover=events.find(event=>event.type==='STALLION_TURNOVER');
  const attrition=events.filter(event=>event.type==='YOUNGSTOCK_ATTRITION');
  assert.ok(turnover,'every year commits a broodmare turnover event');
  assert.ok(stallionTurnover,'every year commits a stallion turnover event');
  assert.equal(turnover.retiredHorseIds.length,turnover.retired);
  assert.equal(turnover.graduatedHorseIds.length,turnover.graduated);
  assert.equal(turnover.closingBroodmares,turnover.openingBroodmares-
   turnover.retired+turnover.graduated);
  assert.equal(new Set(turnover.retiredHorseIds).size,turnover.retired);
  assert.equal(new Set(turnover.graduatedHorseIds).size,turnover.graduated);
  assert.equal(stallionTurnover.retiredHorseIds.length,stallionTurnover.retired);
  assert.equal(stallionTurnover.graduatedHorseIds.length,stallionTurnover.graduated);
  assert.equal(stallionTurnover.closingStallions,stallionTurnover.openingStallions-
   stallionTurnover.retired+stallionTurnover.graduated);
  for(const id of stallionTurnover.retiredHorseIds){
   assert.ok(!stallionsRetiredSeen.has(id),'a stallion cannot retire twice');
   stallionsRetiredSeen.add(id);
   assert.equal((await readPersistent1999LifecycleHorse(store,manifest,runId,
    id)).status,'RETIRED_STALLION');
  }
  for(const id of stallionTurnover.graduatedHorseIds){
   assert.ok(!stallionsGraduatedSeen.has(id),'a colt cannot graduate twice');
   stallionsGraduatedSeen.add(id);
   const graduated=await readPersistent1999LifecycleHorse(store,manifest,runId,id);
   assert.equal(graduated.status,'STALLION');
   assert.equal(graduated.sex,'HORSE');
   assert.equal(graduated.graduatedYear,year);
   assert.ok(graduated.sireId&&graduated.damId&&graduated.ownerId&&
    graduated.foalingFarmId&&directoryIds.has(graduated.ownerId)&&
    directoryIds.has(graduated.foalingFarmId),
    'a graduated stallion retains his pedigree, owner and foaling farm');
   assert.ok(await readPersistent1999LifecycleHorse(store,manifest,runId,
    graduated.sireId));
   assert.ok(await readPersistent1999LifecycleHorse(store,manifest,runId,
    graduated.damId));
  }
  const season=await store.get('industryLifecycle',manifest.worldId+':'+
   manifest.seed+':'+runId+':season:'+year);
  assert.ok(season.marketConditions.averagePurseStrength>0);
  assert.ok(season.marketConditions.marketIndex>0);
  assert.equal(season.plannedFoals,season.marketConditions.plannedFoals);
  marketIndices.push(season.marketConditions.marketIndex);
  plannedFoalCrops.push(season.plannedFoals);
  for(const id of turnover.retiredHorseIds){
   assert.ok(!retirementsSeen.has(id),'a broodmare cannot retire twice');
   retirementsSeen.add(id);
  }
  for(const id of turnover.graduatedHorseIds){
   assert.ok(!graduatesSeen.has(id),'a filly cannot graduate twice');
   graduatesSeen.add(id);
  }
  assert.equal(attrition.length,2,'both young-horse cohort transitions are recorded');
  let annualDeaths=0;
  for(const event of attrition){
   assert.ok(event.deaths>0);
   assert.equal(event.deathHorseIds.length,event.deaths);
   assert.equal(event.openingCohortSize,event.closingCohortSize+event.deaths);
   annualDeaths+=event.deaths;
   for(const id of event.deathHorseIds){
    assert.ok(!deathsSeen.has(id),'a horse can be selected for attrition only once');
    deathsSeen.add(id);
    const horse=await readPersistent1999LifecycleHorse(store,manifest,runId,id);
    assert.equal(horse?.status,'DECEASED');
    assert.equal(horse.deathDate,date);
    assert.ok(horse.sireId&&horse.damId&&horse.ownerId&&horse.foalingFarmId);
    assert.notEqual(horse.sireId,horse.damId);
    assert.ok(directoryIds.has(horse.ownerId));
    assert.ok(directoryIds.has(horse.foalingFarmId));
   }
  }
  const adult=events.find(x=>x.type==='MATURE_HORSE_LIFECYCLE');
  assert.ok(adult,'mature horses must have durable annual transitions');
  assert.equal(adult.deathHorseIds.length,adult.deaths);
  for(const id of adult.deathHorseIds){
   assert.ok(!deathsSeen.has(id),'an individual horse cannot die twice');
   deathsSeen.add(id);
   const horse=await readPersistent1999LifecycleHorse(store,manifest,runId,id);
   assert.equal(horse.status,'DECEASED');
  }
  assert.equal(saved.lifecycle.deathsByYear[year],annualDeaths+adult.deaths);
  const developmental=events.filter(x=>x.type==='YOUNGSTOCK_DEVELOPMENT');
  assert.equal(developmental.length,2,
   'foal and yearling progressions must save actual development events');
  for(const progression of developmental){
   assert.equal(progression.injured,progression.injuredHorseIds.length);
   for(const id of progression.injuredHorseIds.slice(0,5)){
    const horse=await readPersistent1999LifecycleHorse(store,manifest,runId,id);
    assert.ok(horse?.development?.latestInjury?.date===date);
    assert.ok(['YEARLING','TWO_YEAR_OLD_PROSPECT','BROODMARE',
     'STALLION','RACING','RETIRED_RACEHORSE'].includes(horse.status),
     'modeled injury preserves permanent horse identity and active lifecycle');
   }
  }
  const breedingPool=await store.get('industryLifecycle',manifest.worldId+':'+
   manifest.seed+':'+runId+':breeding-pool:'+year);
  assert.equal(breedingPool.length,turnover.closingBroodmares);
  assert.equal(new Set(breedingPool).size,breedingPool.length,
   'the active breeding pool contains unique identities each year');
  const activeStallions=await store.get('industryLifecycle',manifest.worldId+':'+
   manifest.seed+':'+runId+':stallion-pool:'+year);
  assert.equal(activeStallions.length,stallionTurnover.closingStallions);
  assert.equal(new Set(activeStallions).size,activeStallions.length,
   'the active stallion pool contains unique identities each year');
  const retired=await readPersistent1999LifecycleHorse(store,manifest,runId,
   turnover.retiredHorseIds[0]);
  assert.equal(retired.status,'RETIRED_BROODMARE');
  if(turnover.graduatedHorseIds.length){
   const graduated=await readPersistent1999LifecycleHorse(store,manifest,runId,
    turnover.graduatedHorseIds[0]);
   assert.equal(graduated.status,'BROODMARE');
   assert.equal(graduated.graduatedYear,year);
  }
  const completedYear=year-1;
  const completedSeason=await store.get('industryLifecycle',manifest.worldId+':'+
   manifest.seed+':'+runId+':season:'+completedYear);
  const completedMares=await store.get('industryLifecycle',manifest.worldId+':'+
   manifest.seed+':'+runId+':breeding-pool:'+completedYear);
  const completedStallions=await store.get('industryLifecycle',manifest.worldId+':'+
   manifest.seed+':'+runId+':stallion-pool:'+completedYear);
  const liveFoals=saved.lifecycle.birthsByYear[completedYear]||0;
  births.push(liveFoals);
  populations.push({year:completedYear,broodmares:completedMares.length,
   stallions:completedStallions.length,plannedFoals:completedSeason.plannedFoals,
   marketIndex:completedSeason.marketConditions.marketIndex,
   liveFoals,populationAtRollover:saved.lifecycle.population,
   deathsAtRollover:annualDeaths});
 }
 assert.ok(new Set(births).size>=10,
  'annual live birth totals should vary across the three-decade run');
 assert.ok(deathsSeen.size>0&&graduatesSeen.size>0&&retirementsSeen.size>0);
 assert.ok(stallionsRetiredSeen.size>0&&stallionsGraduatedSeen.size>0);
 assert.ok(new Set(marketIndices).size>10,
  'purse strength and supply should produce changing market conditions');
 assert.ok(new Set(plannedFoalCrops).size>10,
  'market-adjusted planned foal crops should not use a fixed annual quota');
 const final=await loadPersistent1999CareerRun(store,manifest,runId);
 assert.equal(final.lifecycle.seasonYear,2031);
 assert.equal(final.lifecycle.population,populations.at(-1).populationAtRollover);

 // Once both mortality stages have passed, each birth cohort must partition
 // exactly into its still-active records and its two recorded death groups.
 for(let birthYear=1999;birthYear<=2029;birthYear++){
  const survivors=await store.get('industryLifecycle',manifest.worldId+':'+
   manifest.seed+':'+runId+':foal-cohort:'+birthYear)||[];
  const ids=new Set(survivors);
  assert.equal(ids.size,survivors.length,'a seasonal cohort cannot duplicate a horse ID');
  const firstDeaths=(await readPersistent1999LifecycleEvents(store,manifest,runId,
   (birthYear+1)+'-01-01')).find(event=>event.type==='YOUNGSTOCK_ATTRITION'&&
    event.stage==='FOAL_TO_YEARLING')?.deathHorseIds||[];
  const secondDeaths=(await readPersistent1999LifecycleEvents(store,manifest,runId,
   (birthYear+2)+'-01-01')).find(event=>event.type==='YOUNGSTOCK_ATTRITION'&&
    event.stage==='YEARLING_TO_TWO_YEAR_OLD')?.deathHorseIds||[];
  const all=new Set([...survivors,...firstDeaths,...secondDeaths]);
  assert.equal(all.size,survivors.length+firstDeaths.length+secondDeaths.length,
   'survivors and deaths partition the cohort without duplicate or orphan IDs');
  assert.equal(all.size,final.lifecycle.birthsByYear[birthYear]||0,
   'every live birth remains represented after two cohort transitions');
 }
 const oldCohort=await store.get('industryLifecycle',manifest.worldId+':'+
  manifest.seed+':'+runId+':foal-cohort:2000');
 const longLivedId=oldCohort.find(id=>id.includes('-'));
 const longLived=await readPersistent1999LifecycleHorse(store,manifest,runId,longLivedId);
 assert.ok(longLived.age<=31);
 assert.equal(longLived.status,'DECEASED',
  'a 31-year-old cannot inflate the sustainable living population');
 assert.ok(longLived.sireId&&longLived.damId&&longLived.ownerId&&longLived.foalingFarmId,
  'a 31-year-old seasonal horse retains its permanent record and pedigree');
 assert.equal((await loadPersistent1999CareerRun(store,manifest,runId)).gameDate,
  '2031-01-01','the latest multi-decade career checkpoint reopens cleanly');
 const totalLiveBirths=Object.values(final.lifecycle.birthsByYear)
  .reduce((sum,count)=>sum+count,0);
 const newGenerationBirths=Object.entries(final.lifecycle.birthsByYear)
  .filter(([birthYear])=>Number(birthYear)>=2001)
  .reduce((sum,[,count])=>sum+count,0);
 assert.ok(final.lifecycle.population<=newGenerationBirths,
  'no expired opening/1999/2000 birth remains living in 2031');
 console.log('WTW_INDUSTRY_THREE_DECADES_MEMORY_PASS '+JSON.stringify({
  seed:manifest.seed,openingHorseCount:manifest.horseCount,annual:populations,
  finalPopulation:final.lifecycle.population,liveBirths:totalLiveBirths,
  deaths:final.lifecycle.horseDeaths,retirements:retirementsSeen.size,
  graduations:graduatesSeen.size,stallionRetirements:stallionsRetiredSeen.size,
  stallionGraduations:stallionsGraduatedSeen.size,longLivedHorseId:longLived.id}));
});

test('two seeds persist dated two-year-old debuts and adult retirement through a decade',async()=>{
 for(const seed of [19990111,19990113]){
  const store=memoryStore(),manifest=await createPersistent1999Industry({
   store,seed,worldId:'WTW-V10-MATURE-'+seed,
   targetOpeningHorses:10000,...dirs,batchSize:1000});
  const runId='WTW-RUN-V10-MATURE-'+seed,player={role:'owner',
   organizationId:'O-OWNER-1'};
  await savePersistent1999CareerRun(store,manifest,{runId,
   gameDate:'1999-01-01',player,version:1});
  await savePersistent1999CareerRun(store,manifest,{runId,
   gameDate:'1999-04-01',player,version:2});
  const april=await readPersistent1999LifecycleEvents(store,manifest,runId,
   '1999-04-01');
  const debut=april.find(x=>x.type==='JUVENILE_RACING_READINESS');
  assert.ok(debut&&debut.started>0&&debut.delayed>0,
   'April two-year-old readiness must vary by true horse ability and health');
  const starter=await readPersistent1999LifecycleHorse(store,manifest,
   runId,debut.startedHorseIds[0]);
  assert.equal(starter.status,'RACING');
  assert.equal(starter.racingDebutDate,'1999-04-01');
  assert.ok(starter.trainerId&&starter.homeTrackId);
  await savePersistent1999CareerRun(store,manifest,{runId,
   gameDate:'1999-09-01',player,version:3});
  const september=(await readPersistent1999LifecycleEvents(store,manifest,runId,
   '1999-09-01')).find(x=>x.type==='JUVENILE_RACING_READINESS');
  assert.ok(september&&september.started>0);
  let previous=await loadPersistent1999CareerRun(store,manifest,runId);
  for(let year=2000;year<=2009;year++){
   const saved=await savePersistent1999CareerRun(store,manifest,{
    runId,gameDate:year+'-01-01',player,version:year-1995});
   const adult=(await readPersistent1999LifecycleEvents(store,manifest,runId,
    year+'-01-01')).find(x=>x.type==='MATURE_HORSE_LIFECYCLE');
   assert.ok(adult&&adult.deaths>=0&&adult.retired>=0);
   assert.equal(saved.lifecycle.population,10000+
    Object.values(saved.lifecycle.birthsByYear).reduce((a,b)=>a+b,0)-
    saved.lifecycle.horseDeaths);
   assert.ok(saved.lifecycle.population>0);
   assert.ok(saved.lifecycle.horseDeaths>=previous.lifecycle.horseDeaths);
   previous=saved;
  }
  assert.ok(previous.lifecycle.matureHorseDeaths>0);
  assert.ok(previous.lifecycle.retiredRacehorses>0);
  const afterTenYears=await readPersistent1999LifecycleHorse(store,manifest,
   runId,starter.id);
  assert.equal(afterTenYears.id,starter.id);
  assert.equal(afterTenYears.racingDebutDate,'1999-04-01');
  assert.deepEqual((await loadPersistent1999CareerRun(store,manifest,runId))
   .lifecycle,previous.lifecycle);
 }
});

test('V10 multiyear career outcome is independent of yearly versus single-save cadence',async()=>{
 const store=memoryStore(),seed=19990117,runPrefix='WTW-RUN-CADENCE';
 const manifest=await createPersistent1999Industry({store,seed,
  worldId:'WTW-V10-CADENCE',targetOpeningHorses:10000,
  ...dirs,batchSize:1000});
 const player={role:'owner',organizationId:'O-OWNER-1'};
 const annual=runPrefix+'-ANNUAL',direct=runPrefix+'-SINGLE';
 const save=(runId,date,version)=>savePersistent1999CareerRun(store,manifest,
  {runId,player,gameDate:date,version});
 await save(annual,'1999-01-01',1);
 await save(direct,'1999-01-01',1);
 let byYear;
 for(let year=2000;year<=2005;year++)
  byYear=await save(annual,year+'-01-01',year-1997);
 const once=await save(direct,'2005-01-01',8);
 const fields=['population','horseDeaths','matureHorseDeaths','foalsBorn',
  'foalLosses','birthsByYear','deathsByYear','activeBroodmares',
  'activeStallions','racingPopulation','retiredRacehorses','juvenileDebuts'];
 const changed=Object.fromEntries(fields.filter(key=>
  JSON.stringify(once.lifecycle[key])!==JSON.stringify(byYear.lifecycle[key]))
  .map(key=>[key,{one:once.lifecycle[key],annual:byYear.lifecycle[key]}]));
 if(Object.keys(changed).length)console.log('WTW_V10_LIFECYCLE_CADENCE_DIFF',
  JSON.stringify(changed));
 assert.deepEqual(changed,{},
  'changing save cadence must never change actual horses, deaths or breeding');
 for(const runId of [annual,direct])
  assert.deepEqual((await loadPersistent1999CareerRun(store,manifest,runId))
   .lifecycle,(runId===annual?byYear:once).lifecycle);
});
