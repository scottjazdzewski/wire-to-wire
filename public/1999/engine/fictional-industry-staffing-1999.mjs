/**
 * Opening 1999 labor market: capacity-derived staffing, not fixed quotas.
 * Creates role- and circuit-linked personnel identities for a populated world.
 * Names and individual biographies are supplied by the independent naming desk.
 */
import {createPersonnelNameRoster,PERSONNEL_NAME_MODEL}
 from './personnel-name-engine.mjs';
export const INDUSTRY_STAFFING_1999_SCHEMA='WTW_INDUSTRY_STAFFING_1999_V1';
const roles=Object.freeze({
 trainer:{horsesPerPerson:24,tiers:['NATIONAL','MAJOR_CIRCUIT','REGIONAL','SMALL_BARN']},
 jockey:{horsesPerPerson:43,tiers:['ELITE','ESTABLISHED','REGIONAL','DEVELOPING']},
 groom:{horsesPerPerson:5,tiers:['SENIOR','EXPERIENCED','JUNIOR']},
 exercise_rider:{horsesPerPerson:11,tiers:['SENIOR','EXPERIENCED','JUNIOR']},
 veterinarian:{horsesPerPerson:130,tiers:['SPECIALIST','REGIONAL','LOCAL']},
 farrier:{horsesPerPerson:75,tiers:['SPECIALIST','REGIONAL','LOCAL']},
 farm_manager:{horsesPerPerson:230,tiers:['MAJOR','COMMERCIAL','SMALL']},
 breeding_attendant:{horsesPerPerson:17,tiers:['SENIOR','EXPERIENCED','JUNIOR']}
});
function hash(seed,s){let h=(2166136261^(seed>>>0))>>>0;
 for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
 return h>>>0}
export function plan1999IndustryStaffing({seed=19990101,ecosystem}={}){
 if(!ecosystem?.counts||!Number.isSafeInteger(seed)||seed<1)
  throw Error('Invalid opening industry staffing plan');
 const c=ecosystem.counts;
 const racing=c.twoYearOldProspects+c.threeYearOldRunners+
  c.fourYearOldRunners+c.fivePlusRunners;
 // January 1 staffing excludes the projected foal crop, not yet born.
 const breeding=c.broodmares+c.stallions+c.yearlings;
 const counts={};
 for(const [role,rule] of Object.entries(roles)){
  const population=['farm_manager','breeding_attendant'].includes(role)?
   breeding:racing;
  counts[role]=Math.ceil(population/rule.horsesPerPerson);
 }
 return {schema:INDUSTRY_STAFFING_1999_SCHEMA,seed,racingPopulation:racing,
  breedingAndYoungstockPopulation:breeding,counts,
  note:'MODELED_LABOR_MARKET_NOT_EMPLOYMENT_CONTRACTS'};
}
export function* generate1999StaffingBatches({
 seed=19990101,staffing,tracks,farms,batchSize=1000,nameRoster=null
}={}){
 if(!staffing?.counts||!Array.isArray(tracks)||!tracks.length||
  !Array.isArray(farms)||!farms.length||!Number.isInteger(batchSize)||
  batchSize<1||batchSize>5000)throw Error('Invalid staffing materialization');
 const total=Object.values(staffing.counts).reduce((n,v)=>n+v,0);
 const roleOrder=Object.keys(roles);
 const generatedNames=nameRoster??createPersonnelNameRoster(seed,total,index=>{
  let n=index;
  for(const role of roleOrder){
   if(n<staffing.counts[role])return role;
   n-=staffing.counts[role];
  }
  throw Error('Personnel name index exceeds staffing plan');
 });
 if(generatedNames.length!==total)throw Error('Incomplete personnel name roster');
 let batch=[],offset=0,nameIndex=0;
 for(const [role,rule] of Object.entries(roles)){
  for(let i=0;i<staffing.counts[role];i++){
   const id='P-FICTIONAL-1999-'+role.toUpperCase().replaceAll('_','-')+'-'+
    String(i+1).padStart(7,'0');
   const base=['farm_manager','breeding_attendant'].includes(role)?
    farms[hash(seed,id+':farm')%farms.length]:
    tracks[hash(seed,id+':track')%tracks.length];
   const tierRoll=hash(seed,id+':tier')%1000;
   const tier=rule.tiers[Math.min(rule.tiers.length-1,
    tierRoll<25?0:tierRoll<170?1:tierRoll<530?2:3)];
   const named=generatedNames[nameIndex++];
   batch.push({id,role,tier,workplaceId:base.id,
    name:named.name,namingStatus:'GENERATED_1999_PERSONNEL_ENGINE',
    nameModel:PERSONNEL_NAME_MODEL,
    ratings:{ability:20+hash(seed,id+':ability')%80,
     potential:20+hash(seed,id+':potential')%80,
     consistency:20+hash(seed,id+':consistency')%80},
    homeRegion:base.location?.region??null,
    source:'FICTIONAL_1999_LABOR_MARKET'});
   if(batch.length===batchSize){
    yield {schema:INDUSTRY_STAFFING_1999_SCHEMA,offset,records:batch};
    offset+=batch.length;batch=[];
   }
  }
 }
 if(batch.length)yield {schema:INDUSTRY_STAFFING_1999_SCHEMA,offset,records:batch};
}
