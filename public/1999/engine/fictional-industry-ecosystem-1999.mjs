/**
 * Fictional 1999 ecosystem demographic and hierarchy planner.
 * Numbers are bounded outcomes, never fixed annual quotas. Horse records,
 * pregnancies, personnel and finances are materialized by downstream engines.
 */
export const INDUSTRY_ECOSYSTEM_1999_SCHEMA='WTW_INDUSTRY_ECOSYSTEM_1999_V1';
export const INDUSTRY_ECOSYSTEM_1999=Object.freeze({
 schema:INDUSTRY_ECOSYSTEM_1999_SCHEMA,year:1999,
 ranges:{
  broodmares:[60000,65000],stallions:[6500,7500],
  annualFoals:[48000,52000],yearlings:[45000,50000],
  twoYearOldProspects:[35000,40000],
  threeYearOldRunners:[28000,30000],fourYearOldRunners:[22000,25000],
  fivePlusRunners:[13000,21000]
 },
 biological:{maxCoversPerStallion:220,minimumBroodmareAge:3,
  conceptionRate:[.73,.90],liveFoalRate:[.88,.96]},
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
const hash=(seed,key)=>{let h=(2166136261^(seed>>>0))>>>0;
 for(let i=0;i<key.length;i++){h^=key.charCodeAt(i);h=Math.imul(h,16777619)}
 return (h>>>0)/4294967296};
const bounded=(seed,key,[min,max])=>Math.floor(min+hash(seed,key)*(max-min+1));
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
 seed=19990101,settings=INDUSTRY_ECOSYSTEM_1999,targetOpeningHorses=null
}={}){
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295||
  settings?.schema!==INDUSTRY_ECOSYSTEM_1999_SCHEMA)
  throw Error('Invalid 1999 ecosystem seed or schema');
 for(const [key,range] of Object.entries(settings.ranges))
  if(!Array.isArray(range)||range.length!==2||!range.every(Number.isSafeInteger)||
   range[0]<0||range[1]<range[0])throw Error('Invalid ecosystem range '+key);
 if(targetOpeningHorses!==null&&(!Number.isSafeInteger(targetOpeningHorses)||
  targetOpeningHorses<OPENING_WORLD_SIZE_1999.min||
  targetOpeningHorses>OPENING_WORLD_SIZE_1999.max))
  throw Error('Opening world size must be 10000–325000 horses');
 const sampled=Object.fromEntries(Object.entries(settings.ranges)
  .map(([key,range])=>[key,bounded(seed,'cohort:'+key,range)]));
 const openingSampled=Object.entries(sampled).filter(([key])=>key!=='annualFoals')
  .reduce((sum,[,count])=>sum+count,0);
 const relativeScale=targetOpeningHorses===null?1:targetOpeningHorses/openingSampled;
 const maxFor=key=>Math.ceil(settings.ranges[key][1]*relativeScale);
 const counts=targetOpeningHorses===null?sampled:
  scaleOpeningCohorts(sampled,targetOpeningHorses,settings.biological);
 const {broodmares,stallions,annualFoals,yearlings,twoYearOldProspects,
  threeYearOldRunners,fourYearOldRunners,fivePlusRunners}=counts;
 if(yearlings>maxFor('annualFoals')||
  twoYearOldProspects>maxFor('yearlings')||
  threeYearOldRunners>maxFor('twoYearOldProspects')||
  fourYearOldRunners>maxFor('threeYearOldRunners'))
  throw Error('Opening cohorts cannot reconcile across adjacent historical crops');
 // Cohorts represent different birth years: no invalid direct subtraction.
 // Fertility is a probability, not a guarantee of an annual foal count.
 const pregnanciesRequired=Math.ceil(annualFoals/settings.biological.liveFoalRate[1]);
 const coversRequired=Math.ceil(pregnanciesRequired/settings.biological.conceptionRate[1]);
 const maxCovers=stallions*settings.biological.maxCoversPerStallion;
 if(coversRequired>broodmares||coversRequired>maxCovers)
  throw Error('Foal crop exceeds breeding capacity');
 const activeRunners=threeYearOldRunners+fourYearOldRunners+fivePlusRunners;
 const openingRegistryHorses=broodmares+stallions+yearlings+
  twoYearOldProspects+activeRunners;
 if(targetOpeningHorses!==null&&openingRegistryHorses!==targetOpeningHorses)
  throw Error('Opening registry did not match the chosen world size');
 return {schema:INDUSTRY_ECOSYSTEM_1999_SCHEMA,seed,counts,
  requestedOpeningHorses:targetOpeningHorses,openingRegistryHorses,
  activeRunnersExcludingTwoYearOlds:activeRunners,
  potentialRacingPopulation:activeRunners+twoYearOldProspects,
  breedingStock:broodmares+stallions,
  modeledLivingPopulation:broodmares+stallions+annualFoals+yearlings+
   twoYearOldProspects+activeRunners,
  minimumCoversForTargetFoals:coversRequired,
  minimumPregnanciesForTargetFoals:pregnanciesRequired,
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
