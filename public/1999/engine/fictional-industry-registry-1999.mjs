/**
 * Bounded deterministic opening-industry registry materializer.
 * Produces genuine individual horse records in small batches, not one giant
 * in-memory snapshot. Does not assign invented racing names or results.
 * Consumers must durably commit each batch and its cursor before advancing.
 * The January 1 opening registry excludes 1999 foals not yet born. An optional
 * forecast mode emits projected records with null DOB/sex, never live horses.
 */
import {plan1999Ecosystem} from './fictional-industry-ecosystem-1999.mjs';
import {generateProvisional1999IndustryNameRoster} from '../game/horse-naming-local-v485.js';
import {connect1999Horse} from './fictional-industry-graph-1999.mjs';
import {planFictionalOwnerPortfolios} from './fictional-owner-portfolio-planner.mjs';
export const INDUSTRY_REGISTRY_1999_SCHEMA='WTW_INDUSTRY_REGISTRY_1999_V1';
const cohorts=[
 ['broodmares','BROODMARE',1985],['stallions','STALLION',1984],
 ['annualFoals','FOAL',1999],['yearlings','YEARLING',1998],
 ['twoYearOldProspects','TWO_YEAR_OLD_PROSPECT',1997],
 ['threeYearOldRunners','RACING',1996],
 ['fourYearOldRunners','RACING',1995],
 ['fivePlusRunners','RACING',1994]
];
function hash(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(let i=0;i<key.length;i++){h^=key.charCodeAt(i);h=Math.imul(h,16777619)}
 return h>>>0;
}
function choose(seed,key,n){return hash(seed,key)%n}
function isoBirthForecast(seed,id,year){
 // The modeled season is spread across a broad North American foaling window.
 const day=1+choose(seed,id+':foaling-day:'+year,181);
 return new Date(Date.UTC(year,1,day)).toISOString().slice(0,10);
}
function ref(kind,ordinal){return 'H-FICTIONAL-1999-'+kind.toUpperCase()+'-'+String(ordinal+1).padStart(7,'0')}
function validateRefs(label,items){
 if(!Array.isArray(items)||!items.length||
  items.some(x=>typeof x?.id!=='string'||!x.id))
  throw Error('Missing opening industry '+label+' directory');
 return items;
}
export function* generate1999IndustryRegistryBatches({
 seed=19990101,plan=plan1999Ecosystem({seed}),
 farms,tracks,owners,batchSize=1000,includeProjectedFoals=false,
 emitNames=false,protectedHorseNames=[],ownerPortfolioPlan=null,
 foundingHorses=[],careFacilityIds=null
}={}){
 if(!Number.isSafeInteger(seed)||seed<1||!plan?.counts||
  !Number.isInteger(batchSize)||batchSize<1||batchSize>5000)
  throw Error('Invalid opening industry batch request');
 validateRefs('farms',farms);validateRefs('tracks',tracks);
 validateRefs('owners',owners);
 if(!Array.isArray(foundingHorses)||new Set(foundingHorses.map(h=>h?.id)).size!==foundingHorses.length)
  throw Error('Approved founding horse list must have unique permanent IDs');
 const counts=plan.counts,broodmareCount=counts.broodmares,stallionCount=counts.stallions;
 const openingHorseCount=count1999Registry(plan);
 const populationHorseCount=openingHorseCount+foundingHorses.length;
 const ownership=ownerPortfolioPlan??planFictionalOwnerPortfolios({
  seed,owners,horseCount:populationHorseCount
 });
 if(ownership.seed!==seed||ownership.horseCount!==populationHorseCount||
  ownership.ownerIds.length!==owners.length||
  ownership.ownerIds.some((id,index)=>id!==owners[index].id))
  throw Error('Owner portfolio plan does not match the opening horse census and directory');
 const regionKey=value=>String(value||'').trim().toLowerCase().replace(/[^a-z]/g,'');
 const facilityPoolByTrack=(role,track)=>{
  const candidates=farms.filter(f=>f.operatingRoles?.includes(role));
  const pool=candidates.length?candidates:farms;
  const sameRegion=pool.filter(f=>regionKey(f.location?.region)===
   regionKey(track.location?.region));
  const sameCountry=pool.filter(f=>f.location?.country&&
   f.location.country===track.location?.country);
  return sameRegion.length?sameRegion:sameCountry.length?sameCountry:pool;
 };
 const farmPoolByTrack=new Map(tracks.map(track=>[track.id,
  facilityPoolByTrack('FOALING_FARM',track)]));
 const staffedCareIds=Array.isArray(careFacilityIds)?new Set(careFacilityIds):null;
 const carePoolByTrack=new Map(tracks.map(track=>{
  const boardingFacilities=farms.filter(f=>
   f.operatingRoles?.includes('BOARDING_FACILITY'));
  const pool=(boardingFacilities.length?boardingFacilities:farms).filter(f=>
   (!staffedCareIds||staffedCareIds.has(f.id)));
  if(!pool.length)throw Error('No physically staffed boarding facility near '+track.id);
  const sameRegion=pool.filter(f=>regionKey(f.location?.region)===
   regionKey(track.location?.region));
  const sameCountry=pool.filter(f=>f.location?.country&&
   f.location.country===track.location?.country);
  return [track.id,sameRegion.length?sameRegion:sameCountry.length?
   sameCountry:pool];
 }));
 const trainingPoolByTrack=new Map(tracks.map(track=>[track.id,
  facilityPoolByTrack('TRAINING_BARN',track)]));
 // Every horse that exists on January 1 needs a stable display identity before
 // the census can be adapted to the canonical game world. Projected foals are
 // forecasts, not entities, and deliberately remain unnamed until birth.
 const registeredCohorts=new Set(['broodmares','stallions','yearlings',
  'twoYearOldProspects','threeYearOldRunners','fourYearOldRunners','fivePlusRunners']);
 const nameCount=cohorts.reduce((n,[cohort])=>
  n+(registeredCohorts.has(cohort)?counts[cohort]:0),0);
 const naming=emitNames?generateProvisional1999IndustryNameRoster({
  seed,horseCount:nameCount,protectedNames:protectedHorseNames}):null;
 let namingIndex=0,horseIndex=0;
 let batch=[],offset=0;
 for(const [cohort,status,year] of cohorts){
  if(cohort==='annualFoals'&&!includeProjectedFoals)continue;
  const count=counts[cohort];
  if(!Number.isSafeInteger(count)||count<0)throw Error('Invalid registry cohort '+cohort);
  for(let i=0;i<count;i++){
   const id=ref(cohort,i);
   const projected=cohort==='annualFoals';
   const ownerIndex=projected?
    ownership.ownerIndexForHorse[choose(seed,id+':dam',broodmareCount)]:
    ownership.ownerIndexForHorse[horseIndex++];
   const owner=owners[ownerIndex];
   // Keep each operation's opening horses at its directory home circuit.
   // This gives a player a coherent local stable for the existing race engine
   // and avoids assigning horses randomly across every track in the country.
   const track=tracks.find(x=>x.id===owner.homeTrackId||owner.id.includes(x.id))||
    tracks[choose(seed,id+':track',tracks.length)];
   const farmPool=farmPoolByTrack.get(track.id)||farms;
   const farm=farmPool[choose(seed,id+':farm',farmPool.length)];
   const racing=status==='RACING';
   const inTraining=racing||status==='TWO_YEAR_OLD_PROSPECT';
   const trainingPool=trainingPoolByTrack.get(track.id)||farms;
   const trainingBarn=inTraining?trainingPool[
    choose(seed,id+':training-barn',trainingPool.length)]:null;
   const carePool=carePoolByTrack.get(track.id)||farms;
   const careOptions=carePool.filter(x=>x.id!==farm.id&&x.id!==trainingBarn?.id);
   const careFacility=(careOptions.length?careOptions:carePool)[
    choose(seed,id+':care-facility',careOptions.length||carePool.length)];
   const breeder=status==='BROODMARE'||status==='STALLION';
   const sex=status==='BROODMARE'?'MARE':status==='STALLION'?'HORSE':
    racing?(choose(seed,id+':sex',2)===0?
     (choose(seed,id+':gelding',4)===0?'HORSE':'GELDING'):'MARE'):
    choose(seed,id+':sex',2)===0?'COLT':'FILLY';
   const born=year-(breeder?choose(seed,id+':age',11):
    cohort==='fivePlusRunners'?choose(seed,id+':older',6):0);
   const sireId=breeder?null:ref('stallions',choose(seed,id+':sire',stallionCount));
   const damId=breeder?null:ref('broodmares',choose(seed,id+':dam',broodmareCount));
   const assignedName=emitNames&&registeredCohorts.has(cohort)&&!projected?
    naming.names[namingIndex++]:null;
   const horse={
    id,cohort,status:projected?'PROJECTED_NOT_YET_BORN':status,
    sex:projected?null:sex,foalYear:born,
    dateOfBirth:projected?null:String(born)+'-'+String(2+choose(seed,id+':month',5)).padStart(2,'0')+
     '-'+String(1+choose(seed,id+':day',28)).padStart(2,'0'),
    forecastBirthDate:projected?isoBirthForecast(seed,id,born):null,
    name:assignedName,
    namingStatus:assignedName?'PROVISIONAL_EDITABLE_1999_OPENING':'UNNAMED_PERMANENT_ID',
    namingRevision:assignedName?naming.algorithmRevision:null,
    sireId,damId,ownerId:owner.id,ownerPortfolioTier:ownership.ownerTier[ownerIndex],
    breederId:farm.id,foalingFarmId:farm.id,
    careFacilityId:careFacility.id,trainingBarnId:trainingBarn?.id??null,
    birthplace:{city:farm.location?.city??null,region:farm.location?.region??null,
     country:farm.location?.country??null,farmId:farm.id,
     provenance:'MODELED_FOALING_FARM'},
    homeTrackId:inTraining?track.id:null,
    development:{readiness:choose(seed,id+':readiness',101),
     soundness:choose(seed,id+':soundness',101),
     potential:1+choose(seed,id+':potential',99)},
    registryProvenance:'FICTIONAL_1999_DETERMINISTIC_V1'
   };
   batch.push(horse);
   if(batch.length===batchSize){
    yield {schema:INDUSTRY_REGISTRY_1999_SCHEMA,seed,offset,
     records:batch,continuation:cohort+':'+(i+1)};
    offset+=batch.length;batch=[];
   }
  }
 }
 for(let i=0;i<foundingHorses.length;i++){
  const source=foundingHorses[i],ownerIndex=ownership.ownerIndexForHorse[horseIndex++],
   owner=owners[ownerIndex];
  if(!/^H-[A-Za-z0-9-]+$/.test(source.id||'')||!source.name||
   !['BROODMARE','STALLION'].includes(source.status)||!source.careFacilityId)
   throw Error('Invalid approved founding horse '+String(source?.id||''));
  const sourceSire=source.sourcePedigree?.sireId,sourceDam=source.sourcePedigree?.damId;
  const horse={...source,
   cohort:source.cohort||source.status.toLowerCase(),
   ownerId:source.ownerId||owner.id,
   sourcePedigree:{sireId:sourceSire||null,damId:sourceDam||null},
   sireId:sourceSire&&foundingHorses.some(x=>x.id===sourceSire)?sourceSire:null,
   damId:sourceDam&&foundingHorses.some(x=>x.id===sourceDam)?sourceDam:null,
   foalingFarmId:source.foalingFarmId||null,breederId:source.breederId||null,
   birthplace:source.birthplace||{city:null,region:null,country:null,
    farmId:null,provenance:'SOURCE_NOT_RECORDED'},
   homeTrackId:null,trainerId:null,jockeyId:null,
   ownerPortfolioTier:ownership.ownerTier[ownerIndex],
   registryProvenance:'APPROVED_FOUNDING_1999_SOURCE',
   foundingSource:source.sourceRecord||null};
  batch.push(horse);
  if(batch.length===batchSize){
   yield {schema:INDUSTRY_REGISTRY_1999_SCHEMA,seed,offset,
    records:batch,continuation:'approvedFoundingHorses:'+(i+1)};
   offset+=batch.length;batch=[];
  }
 }
 if(batch.length)yield {schema:INDUSTRY_REGISTRY_1999_SCHEMA,seed,offset,
  records:batch,continuation:null};
}

/** Materialize one seasonal foal only after its modeled birth date. */
export function create1999SeasonalFoal({seed,year,dateOfBirth,id,dam,sire,farm}={}){
 if(!Number.isSafeInteger(seed)||seed<1||!Number.isInteger(year)||year<1900||
  year>9998||typeof id!=='string'||!/^H-FICTIONAL-1999-FOALS-\d{4}-\d{7}$/.test(id)||
  typeof dateOfBirth!=='string'||!new RegExp('^'+year+'-\\d{2}-\\d{2}$').test(dateOfBirth)||
  !dam?.id||!sire?.id||!dam.ownerId||!dam.foalingFarmId||
  farm?.id!==dam.foalingFarmId)
  throw Error('Invalid seasonal foal identity or parent records');
 const sex=hash(seed,id+':sex')%2?'FILLY':'COLT';
 const horse={id,cohort:'foals',status:'FOAL',sex,foalYear:year,dateOfBirth,
  forecastBirthDate:null,name:null,namingStatus:'UNNAMED_PERMANENT_ID',
  namingRevision:null,sireId:sire.id,damId:dam.id,ownerId:dam.ownerId,
  foalingFarmId:dam.foalingFarmId,
  birthplace:{city:farm.location?.city??null,region:farm.location?.region??null,
   country:farm.location?.country??null,farmId:farm.id,
   provenance:'MODELED_SEASONAL_FOALING_FARM'},
  homeTrackId:null,development:{readiness:hash(seed,id+':readiness')%101,
   soundness:hash(seed,id+':soundness')%101,
   potential:1+hash(seed,id+':potential')%99},
  registryProvenance:'MODELED_SEASONAL_BIRTH'};
 return connect1999Horse(horse,{seed});
}

/** Current-season view: age is calendar-derived; breeder transitions are stored overrides. */
export function project1999HorseForYear(horse,year){
 if(!horse||!Number.isInteger(year)||year<1900||year>9998)
  throw Error('Invalid horse year projection');
 const age=Math.max(0,year-Number(horse.foalYear));
 if(horse.status==='DECEASED')return {...horse,
  age:horse.deathAge??age,cohort:'deceased'};
 if(horse.status==='BROODMARE')return {...horse,age,cohort:'broodmares'};
 if(horse.status==='STALLION')return {...horse,age,cohort:'stallions'};
 if(horse.status==='RETIRED_BROODMARE')
  return {...horse,age,cohort:'retiredBroodmares'};
 if(horse.status==='RETIRED_STALLION')
  return {...horse,age,cohort:'retiredStallions'};
 const cohort=age<=0?'foals':age===1?'yearlings':age===2?
  'twoYearOldProspects':age===3?'threeYearOldRunners':age===4?
  'fourYearOldRunners':'fivePlusRunners';
 const status=age<=0?'FOAL':age===1?'YEARLING':age===2?
  'TWO_YEAR_OLD_PROSPECT':'RACING';
 const sex=horse.sex==='FILLY'&&age>=3?'MARE':
  horse.sex==='COLT'&&age>=3?'HORSE':horse.sex;
 return {...horse,age,sex,cohort,status};
}
export function count1999Registry(plan,{includeProjectedFoals=false}={}){
 return Object.entries(plan.counts).reduce((sum,[cohort,n])=>
  sum+(cohort==='annualFoals'&&!includeProjectedFoals?0:n),0);
}
