/**
 * WTW founding January 1999 PLAYABLE TEST cohort.
 * 400 NEW FICTION test runners, 26 explicitly chosen jockeys, 20 existing-ID
 * trainers, 28 physical pilot facilities, 37 preexisting founder organizations,
 * 55 original broodmares and 18 original stallions.
 *
 * This module wraps, NEVER edits, the locked founding archive. Every new
 * horse/facility has a PILOT ID and simulated values; no historic starts,
 * pregnancies, ownership transfers or races are asserted as historical.
 */
import {createAgeAbility} from './age-ability.mjs';
import attributeCatalog from './attribute-catalog.mjs';
export const PLAYABLE_PILOT_SCHEMA='WTW_1999_PLAYABLE_FOUNDING_PILOT_V1';
export const PLAYABLE_PILOT_HORSES=400;
export const PILOT_TRACK_IDS=Object.freeze(['T-0001','T-0017']);
const pad=(v,n=4)=>String(v).padStart(n,'0');
const hash=(seed,key)=>{let h=(2166136261^seed)>>>0;for(const c of String(key)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}h^=h>>>16;return h>>>0};
const unit=(seed,key)=>hash(seed,key)/4294967295;
const place=s=>{const p=String(s||'').split(',').map(x=>x.trim());return {city:p[0]||'',state:p[1]||'',country:p.slice(2).join(', ')||'USA'}};
const trainerSpec=[
 ['P-000023','Gabe Larkin','T-0012','Charles Town, West Virginia, USA'],
 ['P-000040','Dr. Elias Venn','T-0001','South Ozone Park, New York, USA'],
 ['P-000041','Renata Solis','T-0002','Elmont, New York, USA'],
 ['P-000042','Malcolm Pease','T-0049','Cincinnati, Ohio, USA'],
 ['P-000043','Ike Benton','T-0014','Lexington, Kentucky, USA'],
 ['P-000044','Nora Keating','T-0019','Miami Gardens, Florida, USA'],
 ['P-000045','Tomás Alvarado','T-0020','Oldsmar, Florida, USA'],
 ['P-000046','Cassidy Rook','T-0027','Selma, Texas, USA'],
 ['P-000047','Morris "Mo" Danvers','T-0035','Cicero, Illinois, USA'],
 ['P-000048','Shay Nakamura','T-0028','Arcadia, California, USA'],
 ['P-000049','Luis Barragán','T-0031','Albany, California, USA'],
 ['P-000050','Evelyn "Ev" Rourke','T-0065','Auburn, Washington, USA'],
 ['P-000051','Claude Baptiste','T-0023','Bossier City, Louisiana, USA'],
 ['P-000052','Dane Whitlock','T-0039','Toronto, Ontario, Canada'],
 ['P-003134','Adam Walker','T-0017','Hallandale Beach, Florida, USA'],
 ['P-003145','Todd N. Holden','T-0017','Hallandale Beach, Florida, USA'],
 ['P-003395','Edward Sayer','T-0001','South Ozone Park, New York, USA'],
 ['P-003464','Graham Ives','T-0028','Arcadia, California, USA'],
 ['P-000071','Josephine Malloy','T-0007','Baltimore, Maryland, USA'],
 ['P-000069','Ray Sutter','T-0014','Lexington, Kentucky, USA']
];
export const PILOT_TRAINERS=Object.freeze(trainerSpec.map(([id,name,homeTrackId,base])=>Object.freeze({
 id,name,role:'TRAINER',homeTrackId,base,location:place(base),
 roleAttributes:null,contract:null,source:'EXISTING_1999_PERSON_ID__TEST_OPERATION'
})));
const jockeySpec=[
 ['P-000053','Nico Arroyo','US','T-0006','Farmington, New York, USA'],
 ['P-000055','Marcel Dubois','US','T-0049','Cincinnati, Ohio, USA'],
 ['P-000057','Paloma Reyes','PR','T-0017','Hallandale Beach, Florida, USA'],
 ['P-1999-J-000001','Simonne Beaulieu','CA','T-0039','Toronto, Ontario, Canada'],
 ['P-1999-J-000002','Ernesto Valdés','CU','T-0017','Hallandale Beach, Florida, USA'],
 ['P-1999-J-000003','Rafael Tejada','DO','T-0001','South Ozone Park, New York, USA'],
 ['P-000060','Kenji Sato','US','T-0029','Inglewood, California, USA'],
 ['P-000061','Hector Salas','US','T-0031','Albany, California, USA'],
 ['P-000064','Owen LeBlanc','US','T-0056','Carencro, Louisiana, USA'],
 ['P-000083','Dane Mercer','US','T-0059','Phoenix, Arizona, USA'],
 ['P-000088','Arturo Meza','US','T-0059','Phoenix, Arizona, USA'],
 ['P-900010','Damon Grant','US','T-0013','Louisville, Kentucky, USA'],
 ['P-900011','Diego Serrano','US','T-0029','Inglewood, California, USA'],
 ['P-1999-J-000004','Rafael Montalvo','CU','T-0001','South Ozone Park, New York, USA'],
 ['P-1999-J-000005','Orlando Céspedes','CU','T-0019','Miami Gardens, Florida, USA'],
 ['P-1999-J-000006','Mateo Ferrer','CU','T-0020','Oldsmar, Florida, USA'],
 ['P-1999-J-000007','Julio Armenteros','CU','T-0023','Bossier City, Louisiana, USA'],
 ['P-1999-J-000008','Luis Batista','DO','T-0017','Hallandale Beach, Florida, USA'],
 ['P-1999-J-000009','Víctor Peralta','DO','T-0019','Miami Gardens, Florida, USA'],
 ['P-1999-J-000010','Andrés de la Cruz','DO','T-0008','Laurel, Maryland, USA'],
 ['P-1999-J-000011','Eduardo Salcedo','VE','T-0017','Hallandale Beach, Florida, USA'],
 ['P-000085','Javier Negrón','MX','T-0082','Canóvanas, Puerto Rico, USA'],
 ['P-1999-J-000012','Martín Ávila','MX','T-0028','Arcadia, California, USA'],
 ['P-1999-J-000013','Santiago Téllez','MX','T-0059','Phoenix, Arizona, USA'],
 ['P-000063','Julian Velez','PR','T-0065','Auburn, Washington, USA'],
 ['P-000084','Samuel "Sammy" Cardenas','PA','T-0053','Altoona, Iowa, USA']
];
export const PILOT_JOCKEYS=Object.freeze(jockeySpec.map(([id,name,origin,homeTrackId,base])=>Object.freeze({
 id,name,role:'jockey',origin,homeTrackId,base,
 gender:'MALE',status:'TEST_RACE_BOOKABLE',contract:null,
 secondaryCircuit:name==='Simonne Beaulieu'?'NEW_YORK_SELECTED_MAJOR_STAKES_DAYS':null,
 source:id.startsWith('P-1999-')?'USER_SELECTED_FICTIONAL_PILOT':'CANONICAL_1999_ID'
})));
const across=(a,i)=>a[((i%a.length)+a.length)%a.length];
const US_BASIS=new Set(['US','PR']);
function checkOpening(base){
 if(base?.mode!=='FOUNDING_1999'||base.counts?.horses!==0||
  base.sourceOrganizations?.length!==37||
  base.sourceBroodmares?.length!==55||base.sourceStallions?.length!==18)
  throw Error('1999 pilot cannot overwrite a changed historical foundation');
 const ids=new Set([...base.sourcePeople.map(x=>x.id),
  ...PILOT_TRAINERS.map(x=>x.id),...PILOT_JOCKEYS.map(x=>x.id)]);
 if(ids.size!==base.sourcePeople.length+46)throw Error('Pilot professional P-ID collision');
 if(new Set(PILOT_JOCKEYS.map(x=>x.name.toLowerCase())).size!==26)
  throw Error('Duplicate jockey names');
}
export function withPlayable1999Pilot(base,{seed=19990101}={}){
 checkOpening(base);
 const owners=base.sourceOrganizations,mares=base.sourceBroodmares,
  studs=base.sourceStallions,trainerById=new Map(PILOT_TRAINERS.map((p,i)=>[p.id,i]));
 const knownNames=new Set([...base.sourceBroodmares,...base.sourceStallions].map(x=>String(x.name||'').toLowerCase()));
 const facilities=PILOT_TRAINERS.map((p,i)=>({
  id:'F-PILOT-1999-BARN-'+pad(i+1,3),name:p.name+' — Track Barn',
  type:'RACING_STABLE',facilityClass:'TRACK_TRAINER_BARN',
  operatorPersonId:p.id,operatorOrganizationId:owners[i%owners.length].id,
  location:place(p.base),trackId:p.homeTrackId,capacity:26,occupied:0,
  condition:Math.round(65+unit(seed,p.id+'-condition')*27),
  quality:Math.round(60+unit(seed,p.id+'-care')*34),
  staffRequired:5,staffAssigned:5,
  careQuality:Math.round(60+unit(seed,p.id+'-care')*34),
  trainingQuality:Math.round(58+unit(seed,p.id+'-training')*37),
  monthlyRentUSD:2000+Math.floor(unit(seed,p.id+'-rent')*2500),
  monthlyOperatingCostUSD:12000+Math.floor(unit(seed,p.id+'-cost')*11000),
  revenueUSD:0,operatingProfitUSD:0,
  status:'ACTIVE_SIMULATED_TEST_PROPERTY',provenance:'1999_NEW_FICTION_GAME_PROPERTY'
 }));
 const studFarmOrgs=owners.filter(o=>/farm|stud/i.test(String(o.type||'')+' '+o.name));
 for(let i=0;i<8;i++){
  const o=across(studFarmOrgs,i);
  facilities.push({
   id:'F-PILOT-1999-FARM-'+pad(i+1,3),name:o.name+' — Farm Site',
   type:/stud/i.test(o.type+' '+o.name)?'STUD_FARM':'FARM',
   facilityClass:'FARM',operatorOrganizationId:o.id,
   location:place(o.locationLabel||o.location||'Kentucky, USA'),
   trackId:null,capacity:72,occupied:0,
   condition:72,quality:76,staffRequired:5,staffAssigned:5,
   careQuality:76,trainingQuality:null,
   monthlyRentUSD:0,monthlyOperatingCostUSD:29000,revenueUSD:0,
   operatingProfitUSD:0,status:'ACTIVE_SIMULATED_TEST_PROPERTY',
   provenance:'1999_NEW_FICTION_GAME_PROPERTY'
  });
 }
 const usedName=new Set(knownNames),usedMareYear=new Set(),horses=[];
 const centralTrainers=[1,2,5,6,14,15,16,18];
 for(let i=0;i<PLAYABLE_PILOT_HORSES;i++){
  const source=base.pilotHorseCandidateAt(i);
  const id='H-PILOT-1999-'+pad(i+1,4);
  let name=source.name;
  if(usedName.has(String(name).toLowerCase()))name=source.name+' '+pad(i+1,3);
  usedName.add(name.toLowerCase());
  const trainerIndex=i<300?across(centralTrainers,i):((i*7+3)%20);
  const trainer=PILOT_TRAINERS[trainerIndex],barn=facilities[trainerIndex];
  const owner=owners[(i*13+Math.floor(i/37))%owners.length];
  const foalYear=1993+(i%4),age=1999-foalYear;
  const sex=age>=4?(i%5===0?'MARE':i%3===0?'COLT':'GELDING'):(i%2?'FILLY':'COLT');
  const si=studs.filter(x=>Number(x.foalYear)<=foalYear-4);
  const sire=si.length?si[hash(seed,id+':sire')%si.length]:null;
  const dams=mares.filter(x=>Number(x.foalYear)<=foalYear-4&&foalYear-Number(x.foalYear)<=22);
  const start=hash(seed,id+':dam')%Math.max(1,dams.length);
  let dam=null;
  for(let t=0;t<dams.length;t++){
   const candidate=dams[(start+t)%dams.length];
   if(!usedMareYear.has(candidate.id+'|'+foalYear)){
    dam=candidate;usedMareYear.add(candidate.id+'|'+foalYear);break;
   }
  }
  const ability=createAgeAbility({seed,id,role:'horse',age,
    pedigree:{sireId:sire?.id||null,damId:dam?.id||null}});
  const attrs={...source.attributes,
    fitness:.45+unit(seed,id+':fitness')*.22, fatigue:.05+unit(seed,id+':fatigue')*.11,
    gate_composure:.36+unit(seed,id+':gate')*.54,
    confidence:.4+unit(seed,id+':confidence')*.4,
    stress:.08+unit(seed,id+':stress')*.18,
    soundness_risk:.1+unit(seed,id+':soundness')*.42};
  const month=1+hash(seed,id+':month')%5,day=1+hash(seed,id+':day')%27;
  const horse={...source,id,name,foalYear,age,ageAtOpening:age,
   ageAtDate:age,dateOfBirth:foalYear+'-'+pad(month,2)+'-'+pad(day,2),
   sex,ownerId:owner.id,breederId:owners[(i*7)%owners.length].id,
   trainerId:trainer.id,stableTrackId:trainer.homeTrackId,
   currentResidenceId:barn.id,currentRacingBarnId:barn.id,
   openingStable:{locality:barn.location.city,region:barn.location.state,
    country:barn.location.country,trackId:trainer.homeTrackId},
   location:barn.location,
   sireId:sire?.id||'',damId:dam?.id||'',
   sire:sire?.name||'',dam:dam?.name||'',
   pedigreeStatus:dam&&sire?'GAME_FICTION_LINKED_TO_SOURCE_LIVING_PARENTS':
    'GAME_FICTION_PARTIAL_PARENTAGE_TO_COMPLETE',
   foalingGeography:{locality:'',region:barn.location.state,country:barn.location.country,
    authority:'1999_GAME_TEST_FOALING_REGION_ONLY_NOT_CURRENT_BARN'},
   racingStatus1999:'IN_TRAINING',
   trainingStatus:'IN_TRAINING',registeredIn1999Pilot:true,
   openingCondition:null,attributes:attrs,ability,
   finances:{estimatedValue:12000+Math.round(unit(seed,id+':price')*155000),
    monthlyCareCost:1900},
   career:{starts:0,wins:0,seconds:0,thirds:0,earnings:0,raceHistory:[],
    provenance:'1999_PILOT_CAREER_STARTS_AT_ZERO__NO_HISTORICAL_RESULTS'},
   authority:'NEW_FICTION_PLAYABLE_1999_TEST_ID',
   nameStatus:'1999_PILOT_PROVISIONAL_NAME_CHANGE_ONLY_BY_REGISTRATION',
   traitsProvenance:'SIMULATED_GAMEPLAY_VALUES_NOT_HISTORICAL_EVIDENCE'};
  horses.push(horse);
  barn.occupied++;
 }
 const byOwner=new Map(owners.map(o=>[o.id,[]]));
 horses.forEach((h,i)=>byOwner.get(h.ownerId).push(i));
 const indexById=new Map(horses.map((h,i)=>[h.id,i]));
 const foundingOffset=horses.length;
 const horseAt=i=>{
  if(!Number.isInteger(i)||i<0||i>=horses.length)throw Error('Pilot racer index invalid');
  return horses[i];
 };
 const worldHorseDirectoryAt=i=>{
  if(i<foundingOffset)return {index:i,...horses[i],status:horses[i].racingStatus1999,canonical:false};
  return {...base.worldHorseDirectoryAt(i-foundingOffset),index:i};
 };
 const p={...base,
  schema:PLAYABLE_PILOT_SCHEMA,
  worldProfile:{...base.worldProfile,pilot:'PLAYABLE_OPENING_V1'},
  counts:{...base.counts,
   horses:horses.length,worldHorses:horses.length+base.counts.worldHorses,
   generatedHorses:horses.length,owners:37,trainers:20,people:base.sourcePeople.length+26,
   facilities:facilities.length,populationAdditional:horses.length,
   populationGroups:{...base.counts.populationGroups,registered:horses.length,additional:horses.length}},
  horseAt,horseDirectoryAt:i=>({index:i,...horses[i],
   age:horses[i].age,trackId:horses[i].stableTrackId,status:'IN_TRAINING',
   ca:horses[i].ability?.currentStars??null,pa:horses[i].ability?.potentialStars??null,canonical:false}),
  horseAttributeAt:(i,key)=>horseAt(i).attributes?.[key]??.5,
  worldHorseAt:i=>i<foundingOffset?horseAt(i):base.worldHorseAt(i-foundingOffset),
  worldHorseDirectoryAt,
  worldHorseAttributeAt:(i,key)=>i<foundingOffset?horseAt(i).attributes?.[key]??.5:
   base.worldHorseAttributeAt(i-foundingOffset,key),
  worldIndexByHorseId:id=>indexById.has(id)?indexById.get(id):
   base.worldIndexByHorseId(id)<0?-1:foundingOffset+base.worldIndexByHorseId(id),
  worldPartition:i=>i<foundingOffset?{kind:'REGISTERED',offset:i}:
   base.worldPartition(i-foundingOffset),
  ownedHorseIndexes:id=>(byOwner.get(id)||[]).slice(),
  ownerAt:i=>{
   const o=base.ownerAt(i),n=(byOwner.get(o.id)||[]).length;
   return {...o,portfolio:{generatedHorseSlots:n,sourceHorseCount:0,tier:n?'active_racing':'breeding'},
    finances:{cash:950000+Math.round(unit(seed,o.id+':capital')*3050000),
     annualHorseOperatingBudget:n*24000+120000,monthlyFixedOverhead:12000+n*450,
     propertyAndEquineAssets:n*80000+500000,debt:0,currency:'USD',
     basis:'SIMULATED_1999_TEST_OPENING_BALANCE',usableForSettlement:true}};
  },
  trainerAt:i=>{
   const t=PILOT_TRAINERS[i];if(!t)throw Error('Pilot trainer index');
   return {...t,location:place(t.base),barnId:facilities[i].id,barnCapacity:facilities[i].capacity,
    generatedRunners:facilities[i].occupied,sourceRunners:0,
    roleAttributes:null,attributes:{conditioning:.5,workout_design:.5,young_horse_development:.5},
    authority:'EXISTING_CANONICAL_ID__SIMULATED_GAMEPLAY_OPERATION'};
  },
  personAt:i=>{
   const j=PILOT_JOCKEYS[i];if(!j)throw Error('Pilot jockey index');
   return {...j,location:place(j.base),attributes:{},ability:null,
    bookings:[],career:{starts:0,wins:0,earnings:0}};
  },
  facilityAt:i=>{
   const f=facilities[i];if(!f)throw Error('Pilot physical site index');
   return f;
  },
  projectAtDate:(entity,date)=>{
   if(entity?.registeredIn1999Pilot){
    const year=Number(date.slice(0,4));
    return {...entity,ageAtDate:year-entity.foalYear};
   }
   return base.projectAtDate(entity,date);
  },
  sourceOnlyFoundingWorld:base, pilotHorses:horses,pilotFacilities:facilities,
  pilotTrainers:PILOT_TRAINERS,pilotJockeys:PILOT_JOCKEYS,
  audit:{...base.audit,pilotSchema:PLAYABLE_PILOT_SCHEMA,pilotRunners:400,
   pilotTrainers:20,pilotJockeys:26,pilotPhysicalFacilities:28,
   historicalResultClaims:0,openingRaceResults:0},
  pilotStatus:'AUTHORIZED_1999_GAMEPLAY_TEST_NOT_SOURCE_HISTORY'
 };
 if(new Set(horses.map(h=>h.id)).size!==400||
  new Set(horses.map(h=>h.name.toLowerCase())).size!==400||
  horses.some(h=>!byOwner.has(h.ownerId)||!trainerById.has(h.trainerId)||
   !facilities.some(f=>f.id===h.currentResidenceId)))
  throw Error('Pilot 400-runner identity/residence integration failed');
 return p;
}
