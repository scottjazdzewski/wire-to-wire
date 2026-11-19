/**
 * Deterministic opening breeding-season booking ledger.
 * Allocates one mare to at most one stallion and enforces service-book limits.
 * These are COVERINGS, not pregnancies or guaranteed live foals.
 */
import {assignStallionServiceBooks,seeded1999Unit}
 from './fictional-industry-ecosystem-1999.mjs';
export const BREEDING_BOOK_1999_SCHEMA='WTW_BREEDING_BOOK_1999_V1';
export const BREEDING_CASHFLOW_SCHEMA='WTW_1999_BREEDING_SETTLEMENT_V1';

/** Deterministic, balanced cashflow receipts for a REAL booked covering.
 * All amounts are integer cents; each transaction debits the mare owner and
 * credits the actual stallion owner and physical foaling-care facility.
 * The annual journal is an auditable operational cashflow, not an invented
 * opening cash balance or a separate world economy.
 */
export function settle1999BookedCoverings({year,coverings,mareById,
 stallionById,farmById}={}){
 if(!Number.isInteger(year)||year<1999||year>9998||
  !Array.isArray(coverings)||!(mareById instanceof Map)||
  !(stallionById instanceof Map)||!(farmById instanceof Map))
  throw Error('Invalid actual covering settlement request');
 const accounts=new Map(),seen=new Set();
 let totalStudFeesMinor=0,totalCareFeesMinor=0;
 const account=id=>{
  if(!accounts.has(id))accounts.set(id,{organizationId:id,debitsMinor:0,
   creditsMinor:0,studFeesPaidMinor:0,studIncomeMinor:0,
   mareCarePaidMinor:0,farmCareIncomeMinor:0,transactions:0});
  return accounts.get(id);
 };
 for(const cover of coverings){
  if(!cover?.id||seen.has(cover.id)||cover.breedingYear!==year)
   throw Error('Duplicate or wrong-year booked covering');
  seen.add(cover.id);
  const mare=mareById.get(cover.mareId);
  const stallion=stallionById.get(cover.stallionId);
  const farmId=mare?.careFacilityId||mare?.foalingFarmId;
  if(!mare||!stallion||mare.status!=='BROODMARE'||
   stallion.status!=='STALLION'||!mare.ownerId||!stallion.ownerId||
   !farmById.has(farmId))
   throw Error('Unsettleable booked covering '+cover.id);
  const sireValue=Math.max(1,Math.min(99,
   Number(stallion.ratings?.breedingValue)||55));
  const sireAge=year-Number(stallion.foalYear||year-8);
  const feeMinor=Math.round((125000+sireValue*sireValue*95)*
   (sireAge>=19?.7:1));
  const careMinor=25000+Math.round(Math.max(0,
   80-Number(mare.development?.soundness??80))*350);
  if(!Number.isSafeInteger(feeMinor)||!Number.isSafeInteger(careMinor))
   throw Error('Breeding charge outside safe integer currency range');
  const payer=account(mare.ownerId),sireOwner=account(stallion.ownerId),
   facility=account(farmId);
  payer.debitsMinor+=feeMinor+careMinor;
  payer.studFeesPaidMinor+=feeMinor;
  payer.mareCarePaidMinor+=careMinor;
  sireOwner.creditsMinor+=feeMinor;sireOwner.studIncomeMinor+=feeMinor;
  facility.creditsMinor+=careMinor;facility.farmCareIncomeMinor+=careMinor;
  payer.transactions++;sireOwner.transactions++;facility.transactions++;
  totalStudFeesMinor+=feeMinor;totalCareFeesMinor+=careMinor;
 }
 const rows=[...accounts.values()].sort((a,b)=>a.organizationId.localeCompare(b.organizationId));
 const sum=key=>rows.reduce((total,row)=>total+row[key],0);
 if(sum('debitsMinor')!==sum('creditsMinor')||
  sum('studFeesPaidMinor')!==sum('studIncomeMinor')||
  sum('mareCarePaidMinor')!==sum('farmCareIncomeMinor'))
  throw Error('Breeding cashflow failed double-entry conservation');
 return {schema:BREEDING_CASHFLOW_SCHEMA,year,bookedCoverings:coverings.length,
  totalStudFeesMinor,totalCareFeesMinor,
  totalDebitsMinor:sum('debitsMinor'),totalCreditsMinor:sum('creditsMinor'),
  organizations:rows,
  provenance:'MODELED_ACTUAL_COVERING_DOUBLE_ENTRY_CASHFLOW'};
}

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
 mareById,foalingFarmIdByMareId=null,stallionById=null,batchSize=1000}={}){
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295||
  !Number.isInteger(year)||year<1900||year>9998||
  !Array.isArray(coverings)||!(mareById instanceof Map)||
  (foalingFarmIdByMareId!==null&&!(foalingFarmIdByMareId instanceof Map))||
  (stallionById!==null&&!(stallionById instanceof Map))||
  !Number.isInteger(batchSize)||batchSize<1||batchSize>5000)
  throw Error('Invalid seasonal foaling forecast');
 const conceptionRate=.73+seeded1999Unit(seed,'conception-rate:'+year)*.17;
 const forecasts=[];
 for(const cover of coverings){
  const mare=mareById.get(cover.mareId);
  if(!mare||!cover?.id||!cover.stallionId||cover.breedingYear!==year&&year!==1999)
   throw Error('Foaling forecast has an orphan covering');
  const stallion=stallionById?.get(cover.stallionId)||null;
  if(stallionById&&(!stallion||stallion.status!=='STALLION'))
   throw Error('Booked covering sire is missing or ineligible');
  if(mare.status&&mare.status!=='BROODMARE')
   throw Error('Booked covering mare is not breeding eligible');
  // Age, mare health and stallion fertility change conception odds. Older
  // breeding stock can remain fertile; no covering promises a pregnancy.
  const mareAge=year-Number(mare.foalYear||year-10);
  const sireAge=stallion?year-Number(stallion.foalYear||year-10):10;
  const mareAgeFactor=mareAge<3?0:mareAge<=14?1:
   mareAge<=19?.88:mareAge<=25?.64:.30;
  const sireAgeFactor=sireAge<3?0:sireAge<=18?1:
   sireAge<=23?.88:.65;
  const soundness=Math.max(0,Math.min(100,
   Number(mare.development?.soundness??mare.ratings?.soundness??75)));
  // The canonical 1999 V10 reference career is already distributed. Its
  // booked pregnancies and May 1999 save fingerprint are locked. Apply richer
  // individual fertility only from the first *new* generation in 2000.
  const conceptionChance=year===1999?conceptionRate:
   Math.max(0,Math.min(.95,
    conceptionRate*mareAgeFactor*sireAgeFactor*(.82+soundness*.002)));
  if(seeded1999Unit(seed,'conception:'+year+':'+cover.id)>=conceptionChance)continue;
  const day=1+hash(seed,'foaling-date:'+year+':'+cover.id)%181;
  const birthDate=new Date(Date.UTC(year,1,day)).toISOString().slice(0,10);
  forecasts.push({id:'FOAL-FORECAST-'+year+'-'+cover.id,foalId:
   'H-FICTIONAL-1999-FOALS-'+year+'-'+pad(Number(/(\d{7})$/.exec(cover.id)?.[1]||0)),
   coveringId:cover.id,breedingYear:year,birthDate,damId:mare.id,
   sireId:cover.stallionId,ownerId:mare.ownerId,
   foalingFarmId:foalingFarmIdByMareId?.get(mare.id)??
    mare.careFacilityId??mare.foalingFarmId,
   status:'PROJECTED_NOT_YET_BORN',conceptionChance,
   provenance:'MODELED_INDIVIDUAL_FERTILITY_PREGNANCY_FORECAST'});
  if(forecasts.length===batchSize){
   yield {year,records:[...forecasts]};forecasts.length=0;
  }
 }
 if(forecasts.length)yield {year,records:[...forecasts]};
}

/** Resolve only when the forecast date is reached. */
export function resolve1999FoalBirth({seed,forecast}={}){
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295||
  !forecast?.coveringId||!Number.isInteger(forecast.breedingYear)||
  !/^\d{4}-\d{2}-\d{2}$/.test(forecast.birthDate))
  throw Error('Invalid due foaling forecast');
 const rate=.88+seeded1999Unit(seed,'live-foal-rate:'+forecast.breedingYear)*.08;
 return seeded1999Unit(seed,'live-foal:'+forecast.breedingYear+':'+
  forecast.coveringId)<rate;
}
