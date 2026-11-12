/**
 * WTW commercial world-size selection. Immutable Jan 1999 baseline plus
 * proportional disjoint cohorts, never new JSON horse dumps.
 *
 * This wraps the existing population for DIRECTORY and BREEDING scope.
 * The existing 87,500 registered racehorses and their gameplay APIs remain
 * unchanged until the larger race lifecycle is certified.
 */
export const WORLD_PROFILE_SCHEMA='WTW_WORLD_PROFILE_V1';
export const WORLD_POPULATION_LIMITS=Object.freeze({min:10000,max:325000});
export const WORLD_SIZE_PRESETS=Object.freeze([
 Object.freeze({id:'small',label:'Small world',population:25000}),
 Object.freeze({id:'regional',label:'Regional world',population:75000}),
 Object.freeze({id:'national',label:'National world',population:150000}),
 Object.freeze({id:'full',label:'Full 1999 racing world',population:325000})
]);
const BASE=Object.freeze([
 {key:'registered',count:87500,kind:'REGISTERED'},
 {key:'broodmares',count:60000,kind:'BROODMARE'},
 {key:'stallions',count:1400,kind:'STALLION'},
 {key:'yearlings',count:36250,kind:'YEARLING'},
 {key:'twoYearOlds',count:36250,kind:'TWO_YEAR_OLD'},
 {key:'racingAge',count:70000,kind:'RACING_AGE'},
 {key:'retired',count:33600,kind:'RETIRED'}
]);
const FULL=BASE.reduce((n,x)=>n+x.count,0);
if(FULL!==325000)throw Error('Unexpected source cohort allocation');
export function normalizeWorldProfile(input={}){
 const preset=WORLD_SIZE_PRESETS.find(p=>p.id===input?.size);
 const requested=preset?.population??Number(input.population??325000);
 if(!Number.isSafeInteger(requested)||requested<WORLD_POPULATION_LIMITS.min||
    requested>WORLD_POPULATION_LIMITS.max)
  throw Error('Choose a horse population between 10,000 and 325,000');
 const mode=String(input?.mode||'CANON_ANCHORED_TEST');
 if(!['CANON_ANCHORED_TEST','FULLY_FICTIONAL_TEST'].includes(mode))
  throw Error('Unsupported world source mode');
 const seed=Number(input.seed??19990101);
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295)
  throw Error('World seed must be a positive 32-bit integer');
 return Object.freeze({schema:WORLD_PROFILE_SCHEMA,population:requested,mode,seed,
  generator:'WTW_1999_FULL_SCALE_TEST_V1'});
}
export function worldPopulationPlan(input){
 const profile=normalizeWorldProfile(input);
 const exact=BASE.map(b=>({base:b,count:Math.floor(profile.population*b.count/FULL),
  fraction:profile.population*b.count/FULL-Math.floor(profile.population*b.count/FULL)}));
 let remaining=profile.population-exact.reduce((n,x)=>n+x.count,0);
 const priority=[...exact].sort((a,b)=>b.fraction-a.fraction);
 for(let i=0;i<remaining;i++)priority[i%priority.length].count++;
 // Historical source horses are preserved even in the smallest 1999 scenario.
 if(profile.mode==='CANON_ANCHORED_TEST'&&exact[0].count<267)
  throw Error('This world is too small to preserve the historical opening horses');
 const groups=[],counts={};let start=0,baseStart=0;
 for(const x of exact){groups.push(Object.freeze({key:x.base.key,kind:x.base.kind,
   count:x.count,start,baseStart,baseCount:x.base.count}));
  counts[x.base.key]=x.count;start+=x.count;baseStart+=x.base.count;
 }
 if(start!==profile.population||baseStart!==FULL)throw Error('World planning error');
 return Object.freeze({profile,groups:Object.freeze(groups),counts:Object.freeze(counts)});
}
function pickSourceIndex(group,position,mode){
 if(position<0||position>=group.count)throw Error('World population index out of range');
 if(group.key==='registered'&&mode==='CANON_ANCHORED_TEST'&&position<267)
  return position;
 if(group.key==='registered'&&mode==='CANON_ANCHORED_TEST'){
  return 267+Math.floor((position-267)*(group.baseCount-267)/(group.count-267));
 }
 return Math.floor(position*group.baseCount/group.count);
}
/** Scoped world directory with exact, reversible ID selection. */
export function scopeWorldPopulation(base,input={}){
 const plan=worldPopulationPlan(input),{profile,groups,counts}=plan;
 if(profile.population===FULL)return {...base,worldProfile:profile};
 function sourceIndex(index){
  if(!Number.isInteger(index)||index<0||index>=profile.population)
   throw Error('World horse index outside selected population');
  const group=groups.find(x=>index>=x.start&&index<x.start+x.count);
  if(!group)throw Error('World cohort missing');
  return group.baseStart+pickSourceIndex(group,index-group.start,profile.mode);
 }
 function worldIndexByHorseId(id){
  const original=base.worldIndexByHorseId(id);
  if(original<0)return -1;
  const group=groups.find(x=>original>=x.baseStart&&original<x.baseStart+x.baseCount);
  if(!group||group.count===0)return -1;
  const local=original-group.baseStart;
  let lo=0,hi=group.count;
  while(lo<hi){const mid=(lo+hi)>>>1;
   if(pickSourceIndex(group,mid,profile.mode)<local)lo=mid+1;
   else hi=mid;
  }
  return lo<group.count&&pickSourceIndex(group,lo,profile.mode)===local?
   group.start+lo:-1;
 }
 const worldHorseDirectoryAt=i=>{
  const from=sourceIndex(i);
  return {...base.worldHorseDirectoryAt(from),index:i,sourceWorldIndex:from};
 };
 const worldHorseAt=i=>{
  const from=sourceIndex(i);
  return {...base.worldHorseAt(from),worldIndex:i,sourceWorldIndex:from};
 };
 const worldHorseAttributeAt=(i,key)=>base.worldHorseAttributeAt(sourceIndex(i),key);
 function scaledBreederIndex(index,kind){
  const group=groups.find(g=>g.key===kind);
  if(!Number.isInteger(index)||index<0||index>=group.count)
   throw Error('Breeding index outside selected world');
  return pickSourceIndex(group,index,profile.mode);
 }
 const mareDirectoryAt=i=>base.mareDirectoryAt(scaledBreederIndex(i,'broodmares'));
 const parentAt=(i,sex)=>base.parentAt(scaledBreederIndex(i,sex==='SIRE'?'stallions':'broodmares'),sex);
 const annualFoalingForecast=()=>{
  const forecast=base.annualFoalingForecast(),factor=counts.broodmares/60000;
  return {...forecast,mares:counts.broodmares,
   activeMares:Math.round(forecast.activeMares*factor),
   projectedCoverings:Math.round(forecast.projectedCoverings*factor),
   projectedLiveFoals:Math.round(forecast.projectedLiveFoals*factor),
   annualFoalCropTarget:Math.round(forecast.annualFoalCropTarget*factor),
   healthyRange:{min:Math.round(40000*factor),max:Math.round(50000*factor)},
   stallionPopulation:counts.stallions,
   basis:'PROFILE_SCALED_TEST_PROJECTION_NOT_LIVE_BIRTHS'};
 };
 return {...base,worldProfile:profile,worldPopulationPlan:plan,
  counts:{...base.counts,worldHorses:profile.population,
   populationAdditional:counts.yearlings+counts.twoYearOlds+counts.racingAge+counts.retired,
   populationGroups:{registered:counts.registered,broodmares:counts.broodmares,
    stallions:counts.stallions,additional:counts.yearlings+counts.twoYearOlds+counts.racingAge+counts.retired},
   breedingMares:counts.broodmares,breedingStallions:counts.stallions},
  worldHorseDirectoryAt,worldHorseAt,worldHorseAttributeAt,worldIndexByHorseId,
  mareDirectoryAt,parentAt,annualFoalingForecast};
}
