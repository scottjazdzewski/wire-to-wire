/**
 * Deterministic opening breeding-season booking ledger.
 * Allocates one mare to at most one stallion and enforces service-book limits.
 * These are COVERINGS, not pregnancies or guaranteed live foals.
 */
import {assignStallionServiceBooks,seeded1999Unit}
 from './fictional-industry-ecosystem-1999.mjs';
export const BREEDING_BOOK_1999_SCHEMA='WTW_BREEDING_BOOK_1999_V1';
const hash=(seed,key)=>Math.floor(seeded1999Unit(seed,key)*4294967296)>>>0;
const pad=n=>String(n).padStart(7,'0');
export function* generate1999CoveringLedger({
 seed=19990101,broodmares=63000,stallions=7000,targetCovers=59000,
 batchSize=1000,year=1999,mareIds=null,stallionIds=null
}={}){
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295||
  !Number.isInteger(year)||year<1900||year>9998||
  !Number.isInteger(batchSize)||batchSize<1||batchSize>5000)
  throw Error('Invalid covering ledger request');
 if(mareIds!==null&&(!Array.isArray(mareIds)||mareIds.length!==broodmares||
  new Set(mareIds).size!==mareIds.length||mareIds.some(id=>typeof id!=='string'||!id)))
  throw Error('Invalid annual broodmare identities');
 if(stallionIds!==null&&(!Array.isArray(stallionIds)||stallionIds.length!==stallions||
  new Set(stallionIds).size!==stallionIds.length||stallionIds.some(id=>typeof id!=='string'||!id)))
  throw Error('Invalid annual stallion identities');
 const stableSeed=year===1999?seed:hash(seed,'covering-book:'+year)||1;
 const service=assignStallionServiceBooks({seed:stableSeed,broodmares,stallions,targetCovers});
 const multiplier=broodmares>1?broodmares-1:1;
 // A coprime step traverses the mare population without duplicates.
 let step=2*Math.floor(multiplier/3)+1;
 const gcd=(a,b)=>b?gcd(b,a%b):a;
 while(gcd(step,broodmares)!==1)step+=2;
 let offset=0,batch=[];
 for(let stallion=0;stallion<stallions;stallion++){
  for(let n=0;n<service.books[stallion];n++){
   const mareIndex=(offset*step+stableSeed)%broodmares;
   batch.push({
    id:'COVER-'+year+'-'+pad(offset+1),
    mareId:mareIds?.[mareIndex]??'H-FICTIONAL-1999-BROODMARES-'+pad(mareIndex+1),
    stallionId:stallionIds?.[stallion]??'H-FICTIONAL-1999-STALLIONS-'+pad(stallion+1),
    status:'COVERING_BOOKED',pregnancy:null,liveFoalId:null,
    breedingYear:year,
    provenance:'MODELED_SEEDED_COVERING_NOT_CONFIRMED_BIRTH'
   });
   offset++;
   if(batch.length===batchSize){
    yield {schema:BREEDING_BOOK_1999_SCHEMA,records:batch,
     completedCoverings:offset};
    batch=[];
   }
  }
 }
 if(batch.length)yield {schema:BREEDING_BOOK_1999_SCHEMA,records:batch,
  completedCoverings:offset};
}

/** Forecast only confirmed conceptions; no horse record exists before its due date. */
export function* generate1999SeasonFoalingForecasts({seed,year,coverings,
 mareById,foalingFarmIdByMareId=null,batchSize=1000}={}){
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295||
  !Number.isInteger(year)||year<1900||year>9998||
  !Array.isArray(coverings)||!(mareById instanceof Map)||
  (foalingFarmIdByMareId!==null&&!(foalingFarmIdByMareId instanceof Map))||
  !Number.isInteger(batchSize)||batchSize<1||batchSize>5000)
  throw Error('Invalid seasonal foaling forecast');
 const conceptionRate=.73+seeded1999Unit(seed,'conception-rate:'+year)*.17;
 const forecasts=[];
 for(const cover of coverings){
  const mare=mareById.get(cover.mareId);
  if(!mare||!cover?.id||!cover.stallionId||cover.breedingYear!==year&&year!==1999)
   throw Error('Foaling forecast has an orphan covering');
  if(seeded1999Unit(seed,'conception:'+year+':'+cover.id)>=conceptionRate)continue;
  const day=1+hash(seed,'foaling-date:'+year+':'+cover.id)%181;
  const birthDate=new Date(Date.UTC(year,1,day)).toISOString().slice(0,10);
  forecasts.push({id:'FOAL-FORECAST-'+year+'-'+cover.id,foalId:
   'H-FICTIONAL-1999-FOALS-'+year+'-'+pad(Number(/(\d{7})$/.exec(cover.id)?.[1]||0)),
   coveringId:cover.id,breedingYear:year,birthDate,damId:mare.id,
   sireId:cover.stallionId,ownerId:mare.ownerId,
   foalingFarmId:foalingFarmIdByMareId?.get(mare.id)??
    mare.careFacilityId??mare.foalingFarmId,
   status:'PROJECTED_NOT_YET_BORN',
   provenance:'MODELED_CONFIRMED_PREGNANCY_FORECAST'});
  if(forecasts.length===batchSize){
   yield {year,records:[...forecasts]};forecasts.length=0;
  }
 }
 if(forecasts.length)yield {year,records:[...forecasts]};
}

/** Resolve only when the forecast date is reached. */
export function resolve1999FoalBirth({seed,forecast,youngstockQuality=.55}={}){
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295||
  !Number.isFinite(youngstockQuality)||youngstockQuality<.01||youngstockQuality>.99||
  !forecast?.coveringId||!Number.isInteger(forecast.breedingYear)||
  !/^\d{4}-\d{2}-\d{2}$/.test(forecast.birthDate))
  throw Error('Invalid due foaling forecast');
 // A sound foaling farm and its resident breeding staff improve care odds,
 // while the shared year draw and per-covering lottery preserve crop variance.
 const rate=Math.max(.01,Math.min(.995,.88+
  seeded1999Unit(seed,'live-foal-rate:'+forecast.breedingYear)*.08+
  (youngstockQuality-.55)*.04));
 return seeded1999Unit(seed,'live-foal:'+forecast.breedingYear+':'+
  forecast.coveringId)<rate;
}
