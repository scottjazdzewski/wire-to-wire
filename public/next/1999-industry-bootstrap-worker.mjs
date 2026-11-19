/**
 * Keeps full-world materialization off the interactive Electron renderer.
 * This worker owns only generation work; the existing IndexedDB schema and
 * canonical world engine remain unchanged.
 */
import {open1999IndustryDatabase,createPersistent1999Industry}
 from '/1999/engine/fictional-industry-persistence-1999.mjs';
import {TRACK_PROGRAM_1999} from '/next/1999-track-program.mjs';
import {createFictionalWorldNameEngine}
 from '/1999/engine/fictional-world-name-engine.mjs';
import {plan1999Ecosystem} from '/1999/engine/fictional-industry-ecosystem-1999.mjs';
import {assessFictionalOwnerCapacity,fictionalOwnerPortfolioTier}
 from '/1999/engine/fictional-owner-portfolio-planner.mjs';

async function industryDirectories(seed,targetOpeningHorses=null){
 const [geoResponse,foundingResponse,foalingResponse]=await Promise.all([
  fetch('/data/track-geography-v33.json'),
  fetch('/data/wtw-1999-founding-directory-v1.json'),
  fetch('/data/horse-foaling-registry-projection-v33.json')]);
 if(!geoResponse.ok)throw Error('Bundled 1999 track geography unavailable');
 if(!foundingResponse.ok)throw Error('Bundled approved 1999 organization directory unavailable');
 if(!foalingResponse.ok)throw Error('Bundled approved horse foaling records unavailable');
 const [geo,founding,foaling]=await Promise.all([
  geoResponse.json(),foundingResponse.json(),foalingResponse.json()]);
 const geoById=new Map((geo.tracks||[]).map(g=>[g.id,g]));
 const tracks=Object.values(TRACK_PROGRAM_1999)
  .filter(t=>t.playableIn1999!==false&&t.trackOperating==='OPEN_1999')
  .map(t=>{
   const g=geoById.get(t.id);
   if(!g?.city_locality||!g?.state_province_region||!g?.country)
    throw Error('Missing local foaling/racing geography for '+t.id);
   return {id:t.id,name:t.name,location:{city:g.city_locality,
    region:g.state_province_region,country:g.country,
    metro:g.metro_or_subregion||null,circuit:g.macro_circuit||null},
    physicalTrackId:t.physicalTrackId||t.id,
    venueType:t.venueType||'PHYSICAL_RACECOURSE',
    physicalFacilityStatus:t.physicalFacilityStatus||'STANDALONE_FACILITY',
    geographyProvenance:g.geography_status};
  });
 if(!tracks.length)throw Error('No approved operating 1999 tracks');
 const requestedSize=targetOpeningHorses??
  plan1999Ecosystem({seed,targetOpeningHorses:null}).openingRegistryHorses;
 const canonicalOrganizations=founding.organizations||[];
 const canonicalOwners=canonicalOrganizations.filter(o=>
  ['FARM','STUD_FARM','RACING_STABLE_ORGANIZATION'].includes(o.facilityDisplayCategory)||
  /OWNERSHIP|RACING STABLE/.test(o.type||''));
 const canonicalFarms=canonicalOrganizations.filter(o=>
  ['FARM','STUD_FARM'].includes(o.facilityDisplayCategory));
 const canonicalTrainingBarns=canonicalOrganizations.filter(o=>
  ['RACING_STABLE','TRAINING_CENTER','RACING_STABLE_ORGANIZATION'].
   includes(o.facilityDisplayCategory));
 // Keep owner-directory size proportional to the horse census. A fixed
 // ten-owner-per-track floor made small scale runs incapable of meeting the
 // documented tier minimums, even when the full world was well balanced.
 let ownerCount=Math.max(1,Math.ceil(requestedSize/18));
 const ownerIdAt=index=>'O-FICTIONAL-OWNER-'+String(index+1).padStart(6,'0');
 let capacity=assessFictionalOwnerCapacity({seed,horseCount:requestedSize,
  owners:Array.from({length:ownerCount},(_,i)=>({id:ownerIdAt(i)}))});
 while(capacity.capacityShortfall&&ownerCount<29000){
  ownerCount=Math.min(29000,ownerCount+Math.max(128,Math.ceil(ownerCount*.03)));
  capacity=assessFictionalOwnerCapacity({seed,horseCount:requestedSize,
   owners:Array.from({length:ownerCount},(_,i)=>({id:ownerIdAt(i)}))});
 }
 if(capacity.capacityShortfall)
  throw Error('The requested world size exceeds approved owner-portfolio capacity');
 const ownerCountByCircuit=Array.from({length:tracks.length},(_,i)=>
  Math.floor(ownerCount/tracks.length)+(i<ownerCount%tracks.length?1:0));
 const farmCount=tracks.length*4;
 const generated=createFictionalWorldNameEngine({
  worldId:'WTW1999IndustryDirectory',seed,year:1999,roles:{},owners:ownerCount,
  facilities:{generalFarms:farmCount,studFarms:0,nurseries:0,
   bloodstockFarms:0,breakingTraining:0},
  protectedNames:[...tracks.map(t=>t.name),
   ...canonicalOrganizations.map(o=>o.name).filter(Boolean)],
  ownerNameSourceModel:'ARCHIVAL_1999_RACING_OWNERS'
 });
 if(generated.owners.length!==ownerCount||generated.farms.length!==farmCount)
  throw Error('1999 approved organization name generator returned an incomplete directory');
 const farms=tracks.flatMap((t,trackIndex)=>Array.from({length:4},(_,i)=>{
  const named=generated.farms[trackIndex*4+i];
  const trainingFacility=i>=2;
  return {id:'O-FICTIONAL-FARM-'+t.id+'-'+String(i+1).padStart(2,'0'),
   name:named.name,location:t.location,
   homeTrackId:t.id,
   operatingRoles:trainingFacility?
    ['RACING_STABLE','TRAINING_BARN','BOARDING_FACILITY']:
    ['BREEDER','FOALING_FARM','BOARDING_FACILITY'],
   facilityKind:trainingFacility?'RACING_STABLE_AND_TRAINING_BARN':
    'COMMERCIAL_BREEDING_AND_CARE',
   namingStatus:'GENERATED_1999_ORGANIZATION_ENGINE',
   namingSourceId:named.id,
   geographyStatus:t.location?.region?'REGION_PROVIDED':'LOCATION_REVIEW_REQUIRED'};
 }));
 const locationFor=org=>{
  const source=(org.geographyRecords||[]).find(x=>x.locality&&x.region)||
   (org.geographyRecords||[]).find(x=>x.region)||{};
  return {city:source.locality||null,region:source.region||null,
   country:source.country||(/\b(UK|England)\b/.test(org.locationLabel||'')?
    'United Kingdom':/Canada/.test(org.locationLabel||'')?'Canada':'USA'),
   locationLabel:org.locationLabel||null,
   geographyProvenance:source.basis||org.locationGranularity||'APPROVED_FOUNDING_DIRECTORY'};
 };
 const homeTrackFor=org=>{
  const location=locationFor(org);
  return tracks.find(t=>location.region&&
   String(t.location?.region||'').toLowerCase().includes(
    String(location.region).split('/')[0].trim().toLowerCase()))?.id||
   tracks[parseInt(String(org.id).replace(/\D/g,''),10)%tracks.length].id;
 };
 const majorPortfolio={
  'O-000061':{portfolioTier:'ELITE',maxHorses:850,operationStyle:'KENTUCKY_BREED_TO_RACE_CLASSIC'},
  'O-000001':{portfolioTier:'ELITE',maxHorses:720,operationStyle:'RETAINED_FEMALE_FAMILIES'},
  'O-000003':{portfolioTier:'MAJOR',maxHorses:195,operationStyle:'MID_ATLANTIC_BREED_TO_RACE'},
  'O-000062':{portfolioTier:'MAJOR',maxHorses:175,operationStyle:'COMMERCIAL_NURSERY_AND_RACING'},
  'O-000066':{portfolioTier:'MAJOR',maxHorses:185,operationStyle:'INTEGRATED_BLOODSTOCK_STUD'},
  'O-FOUNDING-1999-001':{portfolioTier:'MAJOR',maxHorses:180,operationStyle:'NORTHEAST_BREED_TO_RACE'},
  'O-FOUNDING-1999-004':{portfolioTier:'MAJOR',maxHorses:155,operationStyle:'KENTUCKY_BREED_TO_RACE'}
 };
 const farmsWithCanon=[...canonicalFarms.map(org=>({
  id:org.id,name:org.name,location:locationFor(org),
  homeTrackId:homeTrackFor(org),organizationType:org.type,
  operatingRoles:['BREEDER','FOALING_FARM','BOARDING_FACILITY'],
  sourceSchema:founding.schema,sourcePublicationTier:org.publicationTier,
  approvedOrigin:org.approvedOrigin||null,historicalEvidence:org.historicalEvidence||null,
  principalOwnerId:org.principalOwnerId||null,
  leadershipPeopleIds:org.leadershipPeopleIds||[],sourceStatus:org.displayNameStatus||null
 })),...canonicalTrainingBarns.map(org=>({
  id:org.id,name:org.name,location:locationFor(org),
  homeTrackId:homeTrackFor(org),organizationType:org.type,
  operatingRoles:['RACING_STABLE','TRAINING_BARN','BOARDING_FACILITY'],
  sourceSchema:founding.schema,sourcePublicationTier:org.publicationTier,
  approvedOrigin:org.approvedOrigin||null,historicalEvidence:org.historicalEvidence||null,
  principalOwnerId:org.principalOwnerId||null,
  leadershipPeopleIds:org.leadershipPeopleIds||[],sourceStatus:org.displayNameStatus||null
 })),...farms];
const ownerCircuitOffsets=ownerCountByCircuit.map((_,index)=>
  ownerCountByCircuit.slice(0,index).reduce((sum,count)=>sum+count,0));
 const generatedOwners=tracks.flatMap((t,trackIndex)=>Array.from(
  {length:ownerCountByCircuit[trackIndex]},(_,i)=>{
  const globalIndex=ownerCircuitOffsets[trackIndex]+i;
  const named=generated.owners[globalIndex];
  return {id:ownerIdAt(globalIndex),name:named.name,location:t.location,
   homeTrackId:t.id,portfolioTier:fictionalOwnerPortfolioTier(seed,ownerIdAt(globalIndex)),
  portfolioModel:'WTW_FICTIONAL_OWNER_PORTFOLIOS_V10',
   operatingRoles:['LEGAL_OWNER',named.ownershipArchetype||'PRIVATE_OWNER'],
   ownershipArchetype:named.ownershipArchetype,
   namingStatus:'GENERATED_1999_ORGANIZATION_ENGINE',
   namingSourceId:named.id,
   geographyStatus:t.location?.region?'REGION_PROVIDED':'LOCATION_REVIEW_REQUIRED'};
 }));
 const owners=[...generatedOwners,...canonicalOwners.map(org=>{
  const location=locationFor(org),profile=majorPortfolio[org.id]||{};
  return {id:org.id,name:org.name,location,homeTrackId:homeTrackFor(org),
   portfolioTier:profile.portfolioTier,
   maxHorses:profile.maxHorses,
   portfolioModel:'WTW_FICTIONAL_OWNER_PORTFOLIOS_V10',
   operationStyle:profile.operationStyle||null,
   ownershipArchetype:org.type,
   operatingRoles:[org.facilityDisplayCategory||'LEGAL_OWNER'],
   sourceSchema:founding.schema,sourcePublicationTier:org.publicationTier,
   approvedOrigin:org.approvedOrigin||null,historicalEvidence:org.historicalEvidence||null,
   approvedPrincipals:org.approvedPrincipals||null,
   principalOwner:org.principalOwner||null,principalOwnerId:org.principalOwnerId||null,
   publicPrincipal:org.publicPrincipal||null,
   leadershipPeopleIds:org.leadershipPeopleIds||[],
   leadershipStatus:org.leadershipStatus||null,sourceStatus:org.displayNameStatus||null};
 })];
 const foundingHorses=(founding.horses||[]).map(h=>{
  const resident=h.standingFarm1999||h.boardingFarm1999||null;
  const careFacilityId=resident?.farmOrganizationId||h.farmOrganizationId||null;
  const foalingSource=foaling.records?.[h.id]||null;
  const birthplace=h.birthplace|| (foalingSource?{
   city:foalingSource.locality||null,
   region:foalingSource.region||foalingSource.breedingJurisdiction||null,
   country:foalingSource.foalingCountry||null,
   farmId:h.foalingFarmId||null,
   provenance:foalingSource.jurisdictionIsNotExactFoalingPlace?
    'APPROVED_SOURCE_JURISDICTION_NOT_EXACT_FARM':'APPROVED_SOURCE_FOALING_RECORD'
  }:null);
  const status=h._role==='stallion'?'STALLION':h._role==='broodmare'?'BROODMARE':null;
  if(!/^H-[A-Za-z0-9-]+$/.test(h.id||'')||!h.name||!status||!careFacilityId||
   !farmsWithCanon.some(f=>f.id===careFacilityId))
   throw Error('Approved founding horse has no valid identity, life stage, or resident facility: '+(h.id||'unknown'));
  return {id:h.id,name:h.name,status,cohort:h._role,
   sex:h.sex||(h._role==='broodmare'?'MARE':'HORSE'),foalYear:h.foalYear||null,
   ownerId:h.ownerId||null,breederId:h.breederOrganizationId||null,
   foalingFarmId:h.foalingFarmId||null,birthplace,careFacilityId,
   managementOrganizationId:careFacilityId,
   sourcePedigree:{sireId:h.sireId||null,damId:h.damId||null},
   sourceStatus:h.status||'APPROVED_FOUNDING_SOURCE',
   sourceEvidence:h.evidenceStatus||h.population||'APPROVED_FOUNDING_DIRECTORY',
   sourceRevision:founding.schema,sourceRecord:h};
 });
 return {tracks,farms:farmsWithCanon,owners,foundingHorses,requestedSize};
}

self.addEventListener('message',async event=>{
 const request=event.data||{};
 if(request.type!=='CREATE_1999_INDUSTRY')return;
 const id=request.id;
 const send=(type,data={})=>self.postMessage({id,type,...data});
 let store;
 try{
  send('STAGE',{message:'Loading the bundled 1999 geography and racecourse directory…'});
  const directories=await industryDirectories(request.seed,
   request.targetOpeningHorses??null);
  send('STAGE',{message:'Preparing the opening population and personnel in the background…'});
  store=await open1999IndustryDatabase();
  const manifest=await createPersistent1999Industry({
   ...directories,store,seed:request.seed,worldId:request.worldId,
   targetOpeningHorses:request.targetOpeningHorses??directories.requestedSize,
   batchSize:request.batchSize,
   yieldControl:()=>new Promise(resolve=>setTimeout(resolve,0)),
   onProgress:progress=>send('PROGRESS',progress)
  });
  send('COMPLETE',{manifest});
 }catch(error){
  send('ERROR',{message:String(error?.message||error),
   stack:String(error?.stack||'')});
 }finally{
  try{store?.close()}catch{}
 }
});
