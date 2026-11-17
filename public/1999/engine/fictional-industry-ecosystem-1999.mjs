/**
 * Fictional 1999 ecosystem demographic and hierarchy planner.
 * Numbers are bounded outcomes, never fixed annual quotas. Horse records,
 * pregnancies, personnel and finances are materialized by downstream engines.
 */
export const INDUSTRY_ECOSYSTEM_1999_SCHEMA='WTW_INDUSTRY_ECOSYSTEM_1999_V2';
export const INDUSTRY_ECOSYSTEM_1999=Object.freeze({
 schema:INDUSTRY_ECOSYSTEM_1999_SCHEMA,year:1999,
 ranges:{
  broodmares:[60000,63000],stallions:[9000,11000],
  annualFoals:[48000,51500],yearlings:[46000,50000],
  twoYearOldProspects:[43000,47000],
  threeYearOldRunners:[38000,42000],fourYearOldRunners:[33000,37000],
  fivePlusRunners:[55000,65000]
 },
 biological:{maxCoversPerStallion:220,minimumBroodmareAge:3,
  conceptionRate:[.73,.90],liveFoalRate:[.88,.96],
  foalToYearlingMortality:[.03,.05],yearlingToTwoYearOldMortality:[.04,.08],
  broodmareRetirementRate:[.04,.08],eligibleMareShare:[.46,.53],
  broodmareGraduationRate:[.09,.13]},
 hierarchy:{
  stallion:{elite:0.015,commercial:0.085,regional:0.25,limited:0.65},
  trainer:{national:0.025,majorCircuit:0.125,regional:0.35,smallBarn:0.50},
  jockey:{elite:0.03,established:0.17,regional:0.35,developing:0.45},
  owner:{major:0.02,established:0.13,regional:0.30,small:0.55},
  farm:{majorStud:0.03,commercial:0.17,regional:0.30,small:0.50}
 },
 naming:{foal:'UNNAMED_PERMANENT_ID',yearling:'UNNAMED_PERMANENT_ID',
  trackReady:'PROVISIONAL_EDITABLE_NAME'},
 provenance:'OWNER_DIRECTION_FICTIONAL_SIMULATION'
});
export const seeded1999Unit=(seed,key)=>{let h=(2166136261^(seed>>>0))>>>0;
 for(let i=0;i<key.length;i++){h^=key.charCodeAt(i);h=Math.imul(h,16777619)}
 return (h>>>0)/4294967296};
const hash=seeded1999Unit;
const bounded=(seed,key,[min,max])=>Math.floor(min+seeded1999Unit(seed,key)*(max-min+1));
/**
 * Forecast next season's broodmare-pool turnover. Retirements leave the
 * breeding population; a variable share of eligible 3YO/4YO fillies graduate
 * from racing into the pool. This is an aggregate planning projection; the
 * career layer must commit individual horse status changes when it simulates
 * that season.
 */
export function planAnnualBroodmareTurnover({seed=19990101,year=2000,
 broodmares,eligibleFemalePopulation,marketIndex=1}={}){
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295||
  !Number.isInteger(year)||year<1900||year>9998||
  !Number.isSafeInteger(broodmares)||broodmares<1||
  !Number.isSafeInteger(eligibleFemalePopulation)||eligibleFemalePopulation<0||
  typeof marketIndex!=='number'||!Number.isFinite(marketIndex)||
  marketIndex<.5||marketIndex>1.5)
  throw Error('Invalid annual broodmare turnover request');
 // Softer commercial demand accelerates exits and slows racing-filly entry;
 // strong demand has the opposite effect. Rates remain bounded biological
 // outcomes, not a fixed annual headcount.
 const retireRate=Math.min(.10,Math.max(.025,.04+
  seeded1999Unit(seed,'mare-retirement-rate:'+year)*.04+(1-marketIndex)*.05));
 const graduationRate=Math.min(.17,Math.max(.05,.09+
  seeded1999Unit(seed,'mare-graduation-rate:'+year)*.04+(marketIndex-1)*.08));
 const retired=Math.min(broodmares,Math.max(1,Math.round(broodmares*retireRate)));
 const entrants=Math.min(eligibleFemalePopulation,
  Math.round(eligibleFemalePopulation*graduationRate));
 return {season:year,openingBroodmares:broodmares,
  eligibleFemalePopulation,retired,graduatedIntoBreeding:entrants,
  closingBroodmares:broodmares-retired+entrants,
  retirementRate:+retireRate.toFixed(4),graduationRate:+graduationRate.toFixed(4),
  provenance:'MODELED_SEEDED_COHORT_TURNOVER'};
}

/** Relative breeding-market conditions from purse strength and horse supply. */
export function planAnnual1999BreedingMarket({seed=19990101,year=1999,
 averagePurseStrength=50,broodmares,stallions,racingPopulation,
 previousLiveFoals=0,referenceBroodmares=broodmares}={}){
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295||
  !Number.isInteger(year)||year<1900||year>9998||
  typeof averagePurseStrength!=='number'||!Number.isFinite(averagePurseStrength)||
  averagePurseStrength<0||averagePurseStrength>100||
  !Number.isSafeInteger(broodmares)||broodmares<1||
  !Number.isSafeInteger(stallions)||stallions<1||
  !Number.isSafeInteger(racingPopulation)||racingPopulation<0||
  !Number.isSafeInteger(previousLiveFoals)||previousLiveFoals<0||
  !Number.isSafeInteger(referenceBroodmares)||referenceBroodmares<1)
  throw Error('Invalid annual breeding-market request');
 const purseDemandIndex=.8+averagePurseStrength*.004;
 const runnersPerMare=racingPopulation/broodmares;
 const expectedRunnerSupply=3.1;
 const racingSupplyIndex=Math.min(1.14,Math.max(.86,
  1-(runnersPerMare/expectedRunnerSupply-1)*.10));
 const expectedFoalsPerMare=.72;
 const priorCropIndex=previousLiveFoals?previousLiveFoals/
  Math.max(1,broodmares*expectedFoalsPerMare):1;
 const cropSupplyIndex=Math.min(1.10,Math.max(.90,
  1-(priorCropIndex-1)*.08));
 const mareSupplyIndex=broodmares/referenceBroodmares;
 const breedingStockIndex=Math.min(1.06,Math.max(.94,
  1-(mareSupplyIndex-1)*.05));
 const stallionsPerMare=stallions/broodmares;
 const stallionSupplyIndex=Math.min(1.06,Math.max(.94,
  1-(stallionsPerMare/.10-1)*.05));
 const marketCycleIndex=.97+seeded1999Unit(seed,'breeding-market-cycle:'+year)*.06;
 const marketIndex=Math.min(1.28,Math.max(.72,purseDemandIndex*
  racingSupplyIndex*cropSupplyIndex*breedingStockIndex*stallionSupplyIndex*
  marketCycleIndex));
 return {year,averagePurseStrength:+averagePurseStrength.toFixed(2),
  purseDemandIndex:+purseDemandIndex.toFixed(4),racingPopulation,
  broodmares,stallions,runnersPerMare:+runnersPerMare.toFixed(4),
  racingSupplyIndex:+racingSupplyIndex.toFixed(4),
  previousLiveFoals,priorCropIndex:+priorCropIndex.toFixed(4),
  cropSupplyIndex:+cropSupplyIndex.toFixed(4),
  breedingStockIndex:+breedingStockIndex.toFixed(4),
  stallionsPerMare:+stallionsPerMare.toFixed(4),
  stallionSupplyIndex:+stallionSupplyIndex.toFixed(4),
  marketCycleIndex:+marketCycleIndex.toFixed(4),
  marketIndex:+marketIndex.toFixed(4),
  provenance:'MODELED_FROM_TRACK_PURSE_STRENGTH_AND_INDUSTRY_SUPPLY'};
}

/** Size the active stallion book to actual service demand, then fill vacancies. */
export function planAnnualStallionTurnover({seed=19990101,year=2000,
 stallions,eligibleMalePopulation,targetCovers,marketIndex=1}={}){
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295||
  !Number.isInteger(year)||year<1900||year>9998||
  !Number.isSafeInteger(stallions)||stallions<1||
  !Number.isSafeInteger(eligibleMalePopulation)||eligibleMalePopulation<0||
  !Number.isSafeInteger(targetCovers)||targetCovers<0||
  typeof marketIndex!=='number'||!Number.isFinite(marketIndex)||
  marketIndex<.5||marketIndex>1.5)
  throw Error('Invalid annual stallion turnover request');
 // Most books are regional or limited; about one active stallion for each
 // twelve annual covers sustains that depth while respecting real demand.
 const targetActiveStallions=Math.max(1,Math.ceil(targetCovers/12));
 const surplus=Math.max(0,stallions-targetActiveStallions);
 const marketExitRate=.035+Math.max(0,1-marketIndex)*.04+
  seeded1999Unit(seed,'stallion-market-exit-rate:'+year)*.02;
 const marketRetirements=Math.min(surplus,surplus?
  Math.max(1,Math.round(surplus*marketExitRate)):0);
 const vacancies=Math.max(0,targetActiveStallions-(stallions-marketRetirements));
 const graduates=Math.min(eligibleMalePopulation,vacancies);
 return {season:year,openingStallions:stallions,eligibleColts:eligibleMalePopulation,
  targetCovers,targetActiveStallions,marketRetirements,retirements:marketRetirements,
  graduates,closingStallions:stallions-marketRetirements+graduates,
  marketExitRate:+marketExitRate.toFixed(4),marketIndex,
  provenance:'MODELED_MARKET_CAPACITY_AND_ELIGIBLE_COLT_TURNOVER'};
}
/** Seeded developmental losses as foals and yearlings move into older cohorts. */
export function planAnnualYoungHorseAttrition({seed=19990101,year=2000,
 stage,candidateCount}={}){
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295||
  !Number.isInteger(year)||year<1900||year>9998||
  !Number.isSafeInteger(candidateCount)||candidateCount<0)
  throw Error('Invalid annual young-horse attrition request');
 const band=stage==='FOAL_TO_YEARLING'?
  INDUSTRY_ECOSYSTEM_1999.biological.foalToYearlingMortality:
  stage==='YEARLING_TO_TWO_YEAR_OLD'?
   INDUSTRY_ECOSYSTEM_1999.biological.yearlingToTwoYearOldMortality:null;
 if(!band)throw Error('Invalid young-horse attrition stage');
 const mortalityRate=band[0]+seeded1999Unit(seed,
  'young-horse-mortality-rate:'+stage+':'+year)*(band[1]-band[0]);
 const deaths=Math.min(candidateCount,Math.round(candidateCount*mortalityRate));
 return {season:year,stage,candidateCount,deaths,survivors:candidateCount-deaths,
  mortalityRate:+mortalityRate.toFixed(4),
  provenance:'MODELED_SEEDED_DEVELOPMENTAL_ATTRITION'};
}
/**
 * January 1 population excludes projected 1999 foals not yet born.
 * Largest-remainder cohort apportionment preserves the precise chosen size.
 */
export const OPENING_WORLD_SIZE_1999=Object.freeze({min:10000,max:325000});
function scaleOpeningCohorts(base,target,biology){
 const keys=Object.keys(base).filter(k=>k!=='annualFoals');
 const total=keys.reduce((n,k)=>n+base[k],0);
 if(!total)throw Error('1999 ecosystem has no living opening cohorts');
 const quotas=keys.map((key,index)=>{
  const exact=base[key]*target/total;
  return {key,index,floor:Math.floor(exact),fraction:exact-Math.floor(exact)};
 });
 const counts=Object.fromEntries(quotas.map(q=>[q.key,q.floor]));
 let remainder=target-quotas.reduce((n,q)=>n+q.floor,0);
 for(const q of [...quotas].sort((a,b)=>b.fraction-a.fraction||a.index-b.index)){
  if(!remainder)break;
  counts[q.key]++;remainder--;
 }
 counts.annualFoals=Math.max(1,Math.min(
  Math.round(base.annualFoals*target/total),
  Math.floor(counts.broodmares*biology.conceptionRate[1]*biology.liveFoalRate[1])
 ));
 return Object.fromEntries(Object.keys(base).map(key=>[key,counts[key]]));
}
export function plan1999Ecosystem({
 seed=19990101,year=1999,settings=INDUSTRY_ECOSYSTEM_1999,
 targetOpeningHorses=null,previousBroodmares=null,worldScale=null
}={}){
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295||
  !Number.isSafeInteger(year)||year<1900||year>9998||
  settings?.schema!==INDUSTRY_ECOSYSTEM_1999_SCHEMA)
  throw Error('Invalid ecosystem seed, year or schema');
 for(const [key,range] of Object.entries(settings.ranges))
  if(!Array.isArray(range)||range.length!==2||!range.every(Number.isSafeInteger)||
   range[0]<0||range[1]<range[0])throw Error('Invalid ecosystem range '+key);
 if(targetOpeningHorses!==null&&(!Number.isSafeInteger(targetOpeningHorses)||
  targetOpeningHorses<OPENING_WORLD_SIZE_1999.min||
  targetOpeningHorses>OPENING_WORLD_SIZE_1999.max))
  throw Error('Opening world size must be 10000–325000 horses');
 if(previousBroodmares!==null&&(!Number.isSafeInteger(previousBroodmares)||
  previousBroodmares<1||targetOpeningHorses!==null))
  throw Error('Prior broodmare stock is only valid for an unscaled annual projection');
 if(worldScale!==null&&(typeof worldScale!=='number'||!Number.isFinite(worldScale)||
  worldScale<=0||worldScale>10))
  throw Error('Invalid annual ecosystem world scale');
 const sampled=Object.fromEntries(Object.entries(settings.ranges)
  .map(([key,range])=>[key,bounded(seed,
   key==='annualFoals'?'annual-foal-crop:'+year:'cohort:'+key,range)]));
 if(previousBroodmares!==null){
  sampled.annualFoals=Math.round(sampled.annualFoals*
   previousBroodmares/sampled.broodmares);
  sampled.broodmares=previousBroodmares;
 }
 const openingSampled=Object.entries(sampled).filter(([key])=>key!=='annualFoals')
  .reduce((sum,[,count])=>sum+count,0);
 const relativeScale=targetOpeningHorses===null?(worldScale??1):
  targetOpeningHorses/openingSampled;
 const maxFor=key=>Math.ceil(settings.ranges[key][1]*relativeScale);
 const counts=targetOpeningHorses===null?sampled:
  scaleOpeningCohorts(sampled,targetOpeningHorses,settings.biological);
 const {broodmares,stallions,annualFoals,yearlings,twoYearOldProspects,
  threeYearOldRunners,fourYearOldRunners,fivePlusRunners}=counts;
 if(previousBroodmares===null&&(yearlings>maxFor('annualFoals')||
  twoYearOldProspects>maxFor('yearlings')||
  threeYearOldRunners>maxFor('twoYearOldProspects')||
  fourYearOldRunners>maxFor('threeYearOldRunners')))
  throw Error('Opening cohorts cannot reconcile across adjacent historical crops');
 // Cohorts represent different birth years: no invalid direct subtraction.
 // Fertility is a probability, not a guarantee of an annual foal count.
 const pregnanciesRequired=Math.ceil(annualFoals/settings.biological.liveFoalRate[1]);
 const coversRequired=Math.ceil(pregnanciesRequired/settings.biological.conceptionRate[1]);
 const maxCovers=stallions*settings.biological.maxCoversPerStallion;
 if(coversRequired>broodmares||coversRequired>maxCovers)
  throw Error('Foal crop exceeds breeding capacity');
 const eligibleScale=targetOpeningHorses===null?(worldScale??1):1;
 const eligibleFemalePopulation=Math.floor(
  (threeYearOldRunners+fourYearOldRunners)*eligibleScale*
  (.46+seeded1999Unit(seed,'eligible-mare-share:'+(year+1))*.07));
 const nextSeasonMareTurnover=planAnnualBroodmareTurnover({
  seed,year:year+1,broodmares,eligibleFemalePopulation
 });
 const activeRunners=threeYearOldRunners+fourYearOldRunners+fivePlusRunners;
 const openingRegistryHorses=broodmares+stallions+yearlings+
  twoYearOldProspects+activeRunners;
 if(targetOpeningHorses!==null&&openingRegistryHorses!==targetOpeningHorses)
  throw Error('Opening registry did not match the chosen world size');
 return {schema:INDUSTRY_ECOSYSTEM_1999_SCHEMA,seed,year,counts,
  worldScale:relativeScale,
  requestedOpeningHorses:targetOpeningHorses,openingRegistryHorses,
  activeRunnersExcludingTwoYearOlds:activeRunners,
  potentialRacingPopulation:activeRunners+twoYearOldProspects,
  breedingStock:broodmares+stallions,
  modeledLivingPopulation:broodmares+stallions+annualFoals+yearlings+
   twoYearOldProspects+activeRunners,
  minimumCoversForTargetFoals:coversRequired,
  minimumPregnanciesForTargetFoals:pregnanciesRequired,
  nextSeasonMareTurnover,
  hierarchy:settings.hierarchy,
  assumptions:{cohorts:'SEPARATE_BIRTH_YEARS',
   twoYearOldProspects:'NOT_ALL_STARTERS',
   fivePlusRunners:'COMBINED_OLDER_AGE_COHORT',
   breedersAndRacehorses:'MUTUALLY_EXCLUSIVE_OPENING_STATES',
   seasonalBirths:'NOT_ALL_FOALS_BORN_ON_JANUARY_1',
   stallionService:'HETEROGENEOUS_INCLUDING_ZERO_COVERS',
   retiredHorses:'ADDITIONAL_INACTIVE_ARCHIVE_NOT_COUNTED'}};
}
export function assignStallionServiceBooks({seed=19990101,stallions,broodmares,
 targetCovers,maxCovers=220}={}){
 if(!Number.isSafeInteger(seed)||seed<1||!Number.isInteger(stallions)||stallions<1||
  !Number.isInteger(broodmares)||broodmares<0||
  !Number.isInteger(targetCovers)||targetCovers<0||
  targetCovers>broodmares||!Number.isInteger(maxCovers)||maxCovers<1)
  throw Error('Invalid stallion book allocation');
 const weights=Array.from({length:stallions},(_,i)=>{
  const q=hash(seed,'stallion-quality:'+i);
  const access=hash(seed,'stallion-access:'+i);
  return access<.17?0:q>.985?200+Math.floor(q*20):
   q>.90?75+Math.floor(q*60):q>.65?15+Math.floor(q*30):
   1+Math.floor(q*10);
 });
 const books=new Array(stallions).fill(0);
 let remaining=targetCovers;
 // Allocate proportionally, with deterministic stable tie breaking and hard cap.
 const weighted=weights.map(w=>w*w);
 const weightTotal=weighted.reduce((a,b)=>a+b,0);
 if(weightTotal===0&&remaining>0)throw Error('No stallion capacity');
 for(let i=0;i<stallions;i++){
  books[i]=Math.min(maxCovers,Math.floor(targetCovers*weighted[i]/weightTotal));
  remaining-=books[i];
 }
 for(let pass=0;remaining>0;pass++){
  let progress=0;
  for(let j=0;j<stallions&&remaining>0;j++){
   const i=(j+seed+pass)%stallions;
   if(weights[i]>0&&books[i]<maxCovers){books[i]++;remaining--;progress++}
  }
  if(!progress)throw Error('Insufficient stallion service capacity');
 }
 return {books,assignedCovers:targetCovers,
  idleStallions:books.filter(x=>x===0).length,
  largestBook:Math.max(...books)};
}
