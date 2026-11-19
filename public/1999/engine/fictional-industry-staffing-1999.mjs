/**
 * Opening 1999 labor market: capacity-derived staffing, not fixed quotas.
 * Creates role- and circuit-linked personnel identities for a populated world.
 * Names and individual biographies are supplied by the independent naming desk.
 */
import {createPersonnelNameRoster,PERSONNEL_NAME_MODEL}
 from './personnel-name-engine.mjs';
import {trackConditionProfile1999} from '../../next/1999-condition-book-engine.mjs';
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
export const INDUSTRY_PERSON_BIOGRAPHY_REVISION='WTW_1999_PERSONNEL_BIO_V1';
// Geographical birth places are authored fictional starting assumptions;
// they do not imply that birthplace, nationality, and workplace are identical.
export const FICTIONAL_BIRTHPLACES=Object.freeze({
 US:[['Lexington','Kentucky'],['Ocala','Florida'],['New York','New York'],['Baltimore','Maryland'],['Louisville','Kentucky'],['Chicago','Illinois'],['Memphis','Tennessee'],['Los Angeles','California'],['New Orleans','Louisiana']],
 CA:[['Toronto','Ontario'],['Vancouver','British Columbia'],['Montreal','Quebec'],['Calgary','Alberta']],
 GB:[['Newmarket','Suffolk'],['London','England'],['Manchester','Greater Manchester']],
 IE:[['Dublin','Leinster'],['Naas','County Kildare'],['Cork','County Cork']],
 PR:[['San Juan','Puerto Rico'],['Ponce','Puerto Rico']],
 PA:[['Panama City','Panama'],['David','Chiriquí']],
 VE:[['Caracas','Capital District'],['Maracay','Aragua']],
 MX:[['Mexico City','Mexico City'],['Guadalajara','Jalisco']],
 CL:[['Santiago','Santiago Metropolitan'],['Valparaíso','Valparaíso']],
 PE:[['Lima','Lima'],['Arequipa','Arequipa']],
 CO:[['Bogotá','Bogotá'],['Medellín','Antioquia']],
 DO:[['Santo Domingo','Distrito Nacional'],['Santiago','Santiago']],
 AR:[['Buenos Aires','Buenos Aires'],['La Plata','Buenos Aires Province']],
 BR:[['São Paulo','São Paulo'],['Rio de Janeiro','Rio de Janeiro']],
 UY:[['Montevideo','Montevideo']],
 FR:[['Paris','Île-de-France'],['Chantilly','Oise']],
 DE:[['Berlin','Berlin'],['Cologne','North Rhine-Westphalia']],
 JP:[['Tokyo','Tokyo'],['Osaka','Osaka']],
 AU:[['Sydney','New South Wales'],['Melbourne','Victoria']],
 NZ:[['Auckland','Auckland'],['Christchurch','Canterbury']],
 AE:[['Dubai','Dubai'],['Abu Dhabi','Abu Dhabi']],
 HK:[['Hong Kong','Hong Kong']]
});
const ROLE_BIRTH_YEARS=Object.freeze({
 trainer:[1938,1970],jockey:[1957,1982],groom:[1944,1981],
 exercise_rider:[1951,1981],veterinarian:[1942,1973],
 farrier:[1940,1977],farm_manager:[1938,1970],
 breeding_attendant:[1945,1980]
});
function hash(seed,s){let h=(2166136261^(seed>>>0))>>>0;
 for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
 return h>>>0}
export function plan1999IndustryStaffing({
 seed=19990101,ecosystem,minimumRacingTracks=0,minimumJockeysPerTrack=2,
 tracks=null,courseDemandTargets=false
}={}){
 if(!ecosystem?.counts||!Number.isSafeInteger(seed)||seed<1||
  !Number.isSafeInteger(minimumRacingTracks)||minimumRacingTracks<0||
  ![1,2].includes(minimumJockeysPerTrack)||
  (courseDemandTargets&&(!Array.isArray(tracks)||
   tracks.length!==minimumRacingTracks||
   new Set(tracks.map(t=>t.id)).size!==tracks.length)))

  throw Error('Invalid opening industry staffing plan');
 const c=ecosystem.counts;
 const racing=c.twoYearOldProspects+c.threeYearOldRunners+
  c.fourYearOldRunners+c.fivePlusRunners;
 // January 1 staffing excludes the projected foal crop, not yet born.
 const breeding=c.broodmares+c.stallions+c.yearlings;
 // A full track card needs a reusable colony of perhaps 16–25 riders,
 // not a distinct jockey for each mount on each race. Program tiers drive
 // that standing pool; national stars can still ride important away meets.
 const trackJockeyTargets=courseDemandTargets?Object.fromEntries(tracks.map(t=>{
  const program=trackConditionProfile1999(t.id,seed);
  if(!program)throw Error('No 1999 race program to size jockey colony '+t.id);
  const factor=program.tier==='PREMIER'?2.1:
   program.tier==='MAJOR'?2:program.tier==='REGIONAL'?1.85:1.7;
  return [t.id,Math.max(16,Math.min(25,Math.ceil(program.racesMax*factor)))];
 })):null;
 const requiredJockeys=trackJockeyTargets?
  Object.values(trackJockeyTargets).reduce((n,v)=>n+v,0):0;
 const counts={};
 for(const [role,rule] of Object.entries(roles)){
  const population=['farm_manager','breeding_attendant'].includes(role)?
   breeding:racing;
  counts[role]=Math.max(Math.ceil(population/rule.horsesPerPerson),
   role==='trainer'?minimumRacingTracks:
   role==='jockey'?Math.max(minimumRacingTracks*minimumJockeysPerTrack,
    requiredJockeys):0);
 }
 return {schema:INDUSTRY_STAFFING_1999_SCHEMA,seed,racingPopulation:racing,
  breedingAndYoungstockPopulation:breeding,counts,
  minimumJockeysPerTrack:minimumRacingTracks?minimumJockeysPerTrack:0,
  ...(trackJockeyTargets?{trackJockeyTargets,
   policy:'COURSE_SPECIFIC_REUSABLE_JOCKEY_POOLS_1999_V2'}:{}),
  note:'MODELED_LABOR_MARKET_NOT_EMPLOYMENT_CONTRACTS'};
}
export function* generate1999StaffingBatches({
 seed=19990101,staffing,tracks,farms,batchSize=1000,nameRoster=null,
 ensureCircuitCoverage=false
}={}){
 if(!staffing?.counts||!Array.isArray(tracks)||!tracks.length||
  !Array.isArray(farms)||!farms.length||typeof ensureCircuitCoverage!=='boolean'||
  (ensureCircuitCoverage&&(
   staffing.counts.trainer<tracks.length||
   staffing.counts.jockey<tracks.length*(staffing.minimumJockeysPerTrack??1)))||
  !Number.isInteger(batchSize)||
  batchSize<1||batchSize>5000)throw Error('Invalid staffing materialization');
 const fullTargets=staffing.trackJockeyTargets;
 if(fullTargets&&(
  Object.keys(fullTargets).length!==tracks.length||
  tracks.some(t=>!Number.isSafeInteger(fullTargets[t.id])||
   fullTargets[t.id]<2||fullTargets[t.id]>25)||
  Object.values(fullTargets).reduce((n,v)=>n+v,0)>staffing.counts.jockey))
  throw Error('Invalid persisted course-specific jockey workforce');
 const guaranteedJockeyTracks=fullTargets?
  tracks.flatMap(t=>Array(fullTargets[t.id]).fill(t)):
  Array.from({length:tracks.length*(staffing.minimumJockeysPerTrack??1)},
   (_,i)=>tracks[i%tracks.length]);
 const total=Object.values(staffing.counts).reduce((n,v)=>n+v,0);
 const roleOrder=Object.keys(roles);
 const generatedNames=nameRoster??createPersonnelNameRoster(seed,total,index=>{
  let n=index;
  for(const role of roleOrder){
   if(n<staffing.counts[role])return role;
   n-=staffing.counts[role];
  }
  throw Error('Personnel name index exceeds staffing plan');
 },[],{normalizeNamesForAccent:true});
 if(generatedNames.length!==total)throw Error('Incomplete personnel name roster');
 let batch=[],offset=0,nameIndex=0;
 for(const [role,rule] of Object.entries(roles)){
  for(let i=0;i<staffing.counts[role];i++){
   const id='P-FICTIONAL-1999-'+role.toUpperCase().replaceAll('_','-')+'-'+
    String(i+1).padStart(7,'0');
   // Two genuine, stable local jockey identities per active course for newly
   // generated full worlds. Existing saved rosters without the field retain
   // their original one-per-course layout and permanent IDs.
   const base=['farm_manager','breeding_attendant'].includes(role)?
    farms[i%farms.length]:
    ensureCircuitCoverage&&role==='trainer'&&i<tracks.length?
     tracks[i]:
    ensureCircuitCoverage&&role==='jockey'&&i<guaranteedJockeyTracks.length?
     guaranteedJockeyTracks[i]:
     tracks[hash(seed,id+':track')%tracks.length];
   const tierRoll=hash(seed,id+':tier')%1000;
   const tier=rule.tiers[Math.min(rule.tiers.length-1,
    tierRoll<25?0:tierRoll<170?1:tierRoll<530?2:3)];
   const named=generatedNames[nameIndex++];
   const country=named.birthCountry||'US';
   const cities=FICTIONAL_BIRTHPLACES[country];
   if(!cities?.length)throw Error('Unmodeled 1999 birth country '+country);
   const [city,region]=cities[hash(seed,id+':birthplace')%cities.length];
   const [minYear,maxYear]=ROLE_BIRTH_YEARS[role]||[1945,1980];
   const birthYear=minYear+hash(seed,id+':birthYear')%(maxYear-minYear+1);
   const month=1+hash(seed,id+':birthMonth')%12;
   const day=1+hash(seed,id+':birthDay')%28;
   const dateOfBirth=String(birthYear)+'-'+String(month).padStart(2,'0')+
    '-'+String(day).padStart(2,'0');
   batch.push({id,role,tier,workplaceId:base.id,
    dateOfBirth,ageAtOpening:1999-birthYear-(month>1||month===1&&day>1?1:0),
    birthplace:{city,region,countryCode:country,provenance:'MODELED_FICTIONAL_1999'},
    birthCountryCode:country,nationalityCode:country,
    biographyRevision:INDUSTRY_PERSON_BIOGRAPHY_REVISION,
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
