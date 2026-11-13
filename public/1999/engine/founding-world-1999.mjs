/**
 * Wire to Wire — isolated founding-world January 1999 test scenario.
 * The historical canon-mini archive is read-only and NEVER truncated or rewritten.
 * This scenario contains only selected user-directed institutions, their actual
 * canon opening horses, geographically real tracks, and sourced breeding animals.
 * Provisional operation IDs are scenario-only and may NOT be promoted to history.
 */
import {openingWorld1999 as canon} from './canon-mini.mjs';
import {create1999Universe} from './full-world-generator.mjs';
import attributeCatalog from './attribute-catalog.mjs';

export const FOUNDING_WORLD_MODE='FOUNDING_1999';
export const FOUNDING_WORLD_SCHEMA='WTW_1999_FOUNDING_WORLD_V1';
const NAME_OVERRIDES=Object.freeze({
 'O-000002':'Harrowgate Farm',
 'O-000056':'Quickfire Racing',
 'O-005910':'Midway',
 'O-005919':'Knight’s Way',
 'O-005794':'Potomac Heritage Stable'
});
const INSTITUTION_PROFILES=Object.freeze({
 'O-000001':{principalOwner:'Charles Wetherby IV',principalOwnerId:'P-000001'},
 'O-000002':{approvedPrincipals:'1999 principal unresolved; earlier Miriam Vale assignment superseded',
  principalOwner:null,principalOwnerId:null,approvedOrigin:'Founded 1958 near Paris, Kentucky. Elite commercial nursery and yearling sales business, historically associated with Paper Tiger descendants.'},
 'O-000003':{principalOwner:'Nathaniel “Nate” Quill',principalOwnerId:'P-000003'},
 'O-000056':{principalOwner:'Vince Bellini',principalOwnerId:'P-FOUNDING-1999-001'},
 'O-000061':{principalOwner:'Carolina Kingsley',principalOwnerId:'P-FOUNDING-1999-004'},
 'O-000062':{approvedOrigin:'Major Kentucky breed-to-race farm. Retained and raced homebreds Who Knows and Saint Nobody per 2026-11-12 user-approved history; older separate-owner credits require reconciliation.'},
 'O-000066':{principalOwner:'David Carlin and Elliot Kessler',principalOwnerId:'P-FOUNDING-1999-005'}
});
const PERSON_PROPOSALS=Object.freeze([
 {id:'P-FOUNDING-1999-001',name:'Vince Bellini',role:'RACING OWNER',operatingOrganizationId:'O-000056',status:'USER_APPROVED_NAME__PROVISIONAL_ID'},
 {id:'P-FOUNDING-1999-002',name:'Dr. Everett Raines',role:'BREEDER / FARM PRINCIPAL',operatingOrganizationId:'O-FOUNDING-1999-011',status:'USER_APPROVED_NAME__PROVISIONAL_ID'},
 {id:'P-FOUNDING-1999-003',name:'Rafael Cienfuegos',role:'FICTIONAL PRESIDENT OF CUBA / RACING OWNER',operatingOrganizationId:'O-FOUNDING-1999-012',status:'USER_APPROVED_NAME__PROVISIONAL_ID'},
 {id:'P-FOUNDING-1999-004',name:'Carolina Kingsley',role:'FARM FAMILY LEADERSHIP',operatingOrganizationId:'O-000061',status:'USER_APPROVED_NAME__PROVISIONAL_ID'},
 {id:'P-FOUNDING-1999-005',name:'David Carlin',role:'STUD COFOUNDER',operatingOrganizationId:'O-000066',status:'USER_APPROVED_NAME__PROVISIONAL_ID'},
 {id:'P-FOUNDING-1999-006',name:'Elliot Kessler',role:'STUD COFOUNDER',operatingOrganizationId:'O-000066',status:'USER_APPROVED_NAME__PROVISIONAL_ID'}
]);
const EXISTING_IDS=Object.freeze([
 'O-000001','O-000002','O-000003','O-000011','O-000014','O-000037',
 'O-000045','O-000047','O-000056','O-000057','O-000059','O-000061',
 'O-000062','O-000063','O-000064','O-000066','O-000067','O-000068',
 'O-000071'
]);
const PUBLIC_FIGURE_OWNERS=Object.freeze([
 {id:'O-005910',name:'Midway',legacyName:'Barlow Stable',type:'RACING STABLE',locationLabel:'Arlington Heights, Illinois, USA',publicPrincipal:'Mike Ditka',publicPrincipalId:'P-910023'},
 {id:'O-005919',name:'Knight’s Way',legacyName:'Avery Morning Racing LLC',type:'SELECTIVE RACING STABLE AND FARM',locationLabel:'Bloomington, Indiana, USA',publicPrincipal:'Bob Knight',publicPrincipalId:'P-910024'},
 {id:'O-005794',name:'Potomac Heritage Stable',legacyName:'Cobb Syndicate',type:'RACING PARTNERSHIP',locationLabel:'Mid-Atlantic, USA',publicPrincipal:'Pat Buchanan',publicPrincipalId:'P-910028'},
 {id:'O-006905',name:'Ledbetter Calder Stables',type:'RACING STABLE',locationLabel:'Los Angeles, California, USA',publicPrincipal:'Magic Johnson',publicPrincipalId:'P-910018'}
]);
// Unassigned names are DESIGN/SCENARIO identities, not historical owner IDs.
// The numbering intentionally never overlaps O-000xxx or O-00xxxx IDs.
const PROVISIONAL=Object.freeze([
 ['001','Davenport Hall Farm','Litchfield County, Connecticut, USA','FARM / BREED-TO-RACE'],
 ['002','Takamori Stud — Pacific Division','Rancho Santa Fe, California, USA / Japan','INTERNATIONAL STUD AND RACING'],
 ['003','Buckley Oaks Farm','Shelby County, Kentucky, USA','FARM / BREED-TO-RACE'],
 ['004','Split Rail Farm','Shelby County, Kentucky, USA','FARM / BREED-TO-RACE'],
 ['005','All The Colors','Del Mar, California, USA','RACING PARTNERSHIP'],
 ['006','Samuels Family Racing','Loretto, Kentucky, USA','RACING PARTNERSHIP'],
 ['007','Velvet Key Racing','Miami Beach, Florida, USA','RACING STABLE'],
 ['008','Vesper Brook Racing','Saratoga Springs, New York, USA','RACING STABLE'],
 ['009','Mar Azul Racing','Havana, Cuba','RACING STABLE'],
 ['010','Caney Fork Farm','Middle Tennessee, USA','FARM / BREED-TO-RACE'],
 ['011','Longleaf Farm','Statesville, North Carolina, USA','FARM / BREED-TO-RACE'],
 ['012','Palma Real Stable','Havana, Cuba','RACING STABLE'],
 ['013','Alderwick International Stud','Newmarket, England, UK / Lexington, Kentucky, USA','INTERNATIONAL STUD'],
 ['014','Ashby Vale Farm','Virginia, USA','FARM / BREED-TO-RACE']
]);
const HISTORICAL_ANCHORS=Object.freeze([
 {organizationId:'O-000061',horseId:'H-1991-000006',horse:'Heyday',role:'BREEDER',status:'SOURCE_VERIFIED'},
 {organizationId:'O-000037',horseId:'H-1991-000006',horse:'Heyday',role:'RACING_OWNER',status:'SOURCE_VERIFIED'},
 {organizationId:'O-000062',horseId:'H-1985-000003',horse:'Who Knows',role:'BREEDER',status:'SOURCE_VERIFIED'},
 {organizationId:'O-000062',horseId:'H-1985-000003',horse:'Who Knows',role:'RETAINED_RACING_OWNER',status:'USER_APPROVED_NEEDS_OWNER_LEDGER_JOIN'},
 {organizationId:'O-000062',horseId:'H-1987-000001',horse:'Saint Nobody',role:'BREEDER',status:'SOURCE_VERIFIED'},
 {organizationId:'O-000062',horseId:'H-1987-000001',horse:'Saint Nobody',role:'RETAINED_RACING_OWNER',status:'USER_APPROVED_NEEDS_OWNER_LEDGER_JOIN'},
 {organizationId:'O-000067',horse:'Gospel Truth',role:'HISTORICAL_BLOODLINE',status:'LEGACY_BRIDGE'},
 {organizationId:'O-000068',horse:'Ask Me Tomorrow',role:'HISTORICAL_BLOODLINE',status:'LEGACY_BRIDGE'},
 {organizationId:'O-000064',horse:'Tin Roof Sunday',role:'HISTORICAL_BLOODLINE',status:'LEGACY_BRIDGE'},
 {organizationId:'O-000003',horse:'After You',role:'HISTORICAL_BLOODLINE',status:'WORLD_BIBLE'},
 {organizationId:'O-000063',horse:'The Whole Point',role:'HISTORICAL_BLOODLINE',status:'WORLD_BIBLE'},
 {organizationId:'O-000063',horse:'Widowmaker’s Moon',role:'HISTORICAL_BLOODLINE',status:'WORLD_BIBLE'},
 {organizationId:'O-FOUNDING-1999-014',horse:'Dominion Nails',role:'HISTORICAL_BLOODLINE',status:'HISTORICAL_BREEDER_HP-B-01-004-3'},
 {organizationId:'O-000002',horse:'Paper Tiger',role:'FEMALE_FAMILY_ASSOCIATION',status:'WORLD_BIBLE'}
]);
const nameStatus=id=>NAME_OVERRIDES[id]?'USER_APPROVED_PENDING_MASTER_PROPAGATION':'EXISTING_CANON';
const loc=label=>{
 const first=String(label||'').split(' / ')[0].trim();
 const parts=first.split(',').map(s=>s.trim()).filter(Boolean);
 if(parts.length>=3)return {city:parts[0],state:parts[1],country:parts.slice(2).join(', ')};
 if(parts.length===2){
  const country=/^(USA|US|UK|Cuba|Canada|Japan|England)$/i.test(parts[1]);
  if(country){
   const region=/^(Virginia|California|Tennessee|Kentucky|Pennsylvania)$/i.test(parts[0]);
   return {city:region?'':parts[0],state:region?parts[0]:'',country:parts[1]};
  }
  return {city:parts[0],state:parts[1],country:'USA'};
 }
 return {city:'',state:'',country:parts[0]||'USA'};
};
const sourceOwnerId=id=>EXISTING_IDS.includes(id)||PUBLIC_FIGURE_OWNERS.some(o=>o.id===id);
function validateScenario(orgs,horses,stallions,mares) {
 const ids=new Set(),names=new Set();
 for(const o of orgs){
  if(ids.has(o.id))throw Error('Duplicate founding organization '+o.id);
  ids.add(o.id);
  if(names.has(o.name.toLowerCase()))throw Error('Duplicate founding organization name '+o.name);
  names.add(o.name.toLowerCase());
 }
 const horseIds=new Set();
 for(const h of [...horses,...stallions,...mares]){
  if(horseIds.has(h.id))throw Error('Duplicate founding horse '+h.id);
  horseIds.add(h.id);
 }
 for(const h of horses)if(!ids.has(h.ownerId))throw Error('Opening horse has missing founder owner: '+h.id);
 if(!horses.length)throw Error('Founding scenario has no sourced active horses');
}
export function createFounding1999Universe({seed=19990101}={}) {
 if(!Number.isSafeInteger(seed)||seed<1)throw Error('Invalid world seed');
 // Use legacy deterministic trait and racing models WITHOUT exposing their
 // unselected 325,000 synthetic horses or 3,308 autogenerated owner roster.
 const base=create1999Universe({seed,mode:'CANON_ANCHORED_TEST'});
 const originalOrgById=new Map(canon.organizations.map((o,i)=>[o.id,{org:o,index:i}]));
 const sourceOrganizations=EXISTING_IDS.map(id=>{
  const entry=originalOrgById.get(id);
  if(!entry)throw Error('Canonical owner missing '+id);
  return {...entry.org,...(INSTITUTION_PROFILES[id]||{}),name:NAME_OVERRIDES[id]||entry.org.name,
   legacyName:NAME_OVERRIDES[id]?entry.org.name:null,
   displayNameStatus:nameStatus(id),scenarioScope:'FOUNDING_WORLD'};
 }).concat(PUBLIC_FIGURE_OWNERS.map(o=>({...o,displayNameStatus:NAME_OVERRIDES[o.id]?
  'USER_APPROVED_PENDING_MASTER_PROPAGATION':'EXISTING_1999_PUBLIC_FIGURE_LINK',
  scenarioScope:'FOUNDING_WORLD'})),
 PROVISIONAL.map(([suffix,name,locationLabel,type])=>({
  id:'O-FOUNDING-1999-'+suffix,name,type,locationLabel,
  ...(suffix==='014'?{principalOwner:'Miriam Vale',principalOwnerId:'P-000002'}:{}),
  ...(suffix==='011'?{principalOwner:'Dr. Everett Raines',principalOwnerId:'P-FOUNDING-1999-002'}:{}),
  ...(suffix==='012'?{principalOwner:'Rafael Cienfuegos',principalOwnerId:'P-FOUNDING-1999-003'}:{}),
  publicationTier:'SCENARIO_PROVISIONAL__NOT_HISTORICAL_ID',
  displayNameStatus:'CONCEPT_REVIEW_OR_APPROVED_NAME__ID_PENDING',
  scenarioScope:'FOUNDING_WORLD',gameRule:'NO_HORSE_TRANSFER_WITHOUT_SOURCE'
 })));
 const canonicalIdSet=new Set(sourceOrganizations.map(o=>o.id));
 const sourceHorses=canon.horses.filter(h=>canonicalIdSet.has(h.ownerId));
 const sourceHorseIndex=new Map(canon.horses.map((h,i)=>[h.id,i]));
 const horseIndexes=sourceHorses.map(h=>sourceHorseIndex.get(h.id));
 const pedigreeById=new Map(canon.pedigreeNodes.map(h=>[h.id,h]));
 const withPedigree=h=>{
  const source=pedigreeById.get(h.id);
  const inferredYear=/^H-(\d{4})-/.exec(h.id)?.[1];
  return {...h,foalYear:source?.foalYear??(inferredYear?Number(inferredYear):null),
   foalYearBasis:source?.foalYear?'PEDIGREE_SOURCE':'HORSE_ID_YEAR_UNVERIFIED',
   sireId:h.sireId||source?.sireId||null,damId:h.damId||source?.damId||null};
 };
 const withApprovedFarmName=h=>{
  const standing=h.standingFarm1999,boarding=h.boardingFarm1999;
  if(standing&&NAME_OVERRIDES[standing.farmOrganizationId])
   return {...h,standingFarm1999:{...standing,farmName:NAME_OVERRIDES[standing.farmOrganizationId],legacyFarmName:standing.farmName}};
  if(boarding&&NAME_OVERRIDES[boarding.farmOrganizationId])
   return {...h,boardingFarm1999:{...boarding,farmName:NAME_OVERRIDES[boarding.farmOrganizationId],legacyFarmName:boarding.farmName}};
  return h;
 };
 const sourceStallions=canon.activeStallions1999.filter(h=>canonicalIdSet.has(h.standingFarm1999?.farmOrganizationId)).map(withPedigree).map(withApprovedFarmName);
 const sourceBroodmares=canon.foundationalBroodmares1999.filter(h=>canonicalIdSet.has(h.standingFarm1999?.farmOrganizationId)).map(withPedigree).map(withApprovedFarmName);
 const sourceBoarding=canon.productionBroodmareBoarding1999.filter(h=>canonicalIdSet.has(h.boardingFarm1999?.farmOrganizationId));
 // Keep the opening test small: a sourced, deterministic selection of the
 // full broodmare archive (no invented pregnancies or mare transactions).
 const boardingByFarm=new Map(),sampleBoarding=[];
 for(const mare of sourceBoarding) {
  const id=mare.boardingFarm1999.farmOrganizationId,n=boardingByFarm.get(id)||0;
  if(n>=4)continue;
  boardingByFarm.set(id,n+1);sampleBoarding.push(withApprovedFarmName(withPedigree(mare)));
 }
 const breedingMares=sourceBroodmares.concat(sampleBoarding);
 validateScenario(sourceOrganizations,sourceHorses,sourceStallions,breedingMares);
 const trainerIds=new Set(sourceHorses.map(h=>h.trainerId).filter(Boolean));
 for(const id of ['P-000069','P-000077'])trainerIds.add(id);
 const canonTrainers=canon.people.filter(p=>String(p.role||'').toLowerCase().includes('trainer'));
 const trainerOriginalIndex=new Map(canonTrainers.map((p,i)=>[p.id,i]));
 const trainingPeople=canonTrainers.filter(p=>trainerIds.has(p.id));
 const principalIds=new Set(['P-000001','P-000002','P-000003','P-000018','P-000069','P-000077']);
 for(const h of sourceHorses)if(h.trainerId)principalIds.add(h.trainerId);
 const sourcePeople=canon.people.filter(p=>principalIds.has(p.id)).map(p=>
  p.id==='P-000002'?{...p,base:{locality:'Virginia',region:'Virginia',country:'USA',
   basis:'USER_APPROVED_ASHBY_VALE_1999'},operatingOrganizationId:'O-FOUNDING-1999-014',
   sourceOriginalBase:p.base,geographyJoinStatus:'APPROVED_PENDING_PERSON_REGISTRY'}:p
 ).concat(PUBLIC_FIGURE_OWNERS.map(o=>({id:o.publicPrincipalId,name:o.publicPrincipal,
   role:'RACING OWNER',status:'CANONICAL_1999_PUBLIC_FIGURE_OWNER',
   operatingOrganizationId:o.id,base:loc(o.locationLabel)})),PERSON_PROPOSALS);
 const ownerOriginalIndex=new Map(canon.organizations.map((o,i)=>[o.id,i]));
 const horseById=new Map(sourceHorses.map((h,i)=>[h.id,i]));
 const trainerList=trainingPeople.map(p=>p.id);
 const trainerById=new Map(trainingPeople.map((p,i)=>[p.id,i]));
 const ownerHorseMap=new Map(sourceOrganizations.map(o=>[o.id,[]]));
 sourceHorses.forEach((h,i)=>ownerHorseMap.get(h.ownerId).push(i));
 const stock=[...breedingMares,...sourceStallions],allHorseIds=new Set(sourceHorses.map(h=>h.id));
 for(const h of stock)if(allHorseIds.has(h.id))throw Error('Horse appears in active and breeding registry: '+h.id);
 const indexById=new Map(sourceHorses.map((h,i)=>[h.id,i]));
 stock.forEach((h,i)=>indexById.set(h.id,sourceHorses.length+i));
 const facilities=sourceOrganizations.filter(o=>/FARM|STUD|NURSERY|BLOODSTOCK/.test(String(o.type).toUpperCase()));
 const staffIndices=[...Array.from({length:18},(_,i)=>4200+i),
  ...Array.from({length:7},(_,i)=>6000+i),
  ...Array.from({length:5},(_,i)=>6550+i),
  ...Array.from({length:4},(_,i)=>6980+i),
  ...Array.from({length:4},(_,i)=>7400+i),
  ...Array.from({length:2},(_,i)=>7760+i)];
 const trackCount=base.counts.tracks;
 function ownerAt(i) {
  if(!Number.isInteger(i)||i<0||i>=sourceOrganizations.length)throw Error('Founder owner index');
  const source=sourceOrganizations[i],idx=ownerOriginalIndex.get(source.id);
  const baseRecord=idx===undefined?null:base.ownerAt(idx),horses=ownerHorseMap.get(source.id)||[];
  const principal=PUBLIC_FIGURE_OWNERS.find(o=>o.id===source.id);
  const cityRecord=source.geographyRecords?.find(g=>g.locality);
  const location=cityRecord?
    {city:cityRecord.locality,state:cityRecord.region,country:cityRecord.country}:
    loc(source.locationLabel||'Unknown');
  return {...(baseRecord||{}),id:source.id,name:source.name,legacyName:source.legacyName||null,
   nameStatus:source.displayNameStatus,type:source.type,
   location,
   principalOwner:principal?.publicPrincipal||source.principalOwner||null,
   principalOwnerId:principal?.publicPrincipalId||source.principalOwnerId||null,
   scenarioProvisional:source.publicationTier==='SCENARIO_PROVISIONAL__NOT_HISTORICAL_ID',
   portfolio:{generatedHorseSlots:0,sourceHorseCount:horses.length,
    tier:horses.length>=8?'regional':horses.length>0?'small':'breeding_or_preopening'},
   finances:baseRecord?.finances||{cash:0,annualHorseOperatingBudget:0,propertyAndEquineAssets:0,
    debt:0,monthlyFixedOverhead:0,currency:'USD',basis:'FOUNDING_SCENARIO_UNMODELED'},
   authority:'1999_FOUNDING_SCENARIO__SOURCE_HORSES_ONLY'};
 }
 function trainerAt(i) {
  if(!Number.isInteger(i)||i<0||i>=trainerList.length)throw Error('Founder trainer index');
  const original=trainerOriginalIndex.get(trainerList[i]);
  const t=base.trainerAt(original);
  const actual=sourceHorses.filter(h=>h.trainerId===t.id).length;
  return {...t,generatedRunners:0,sourceRunners:actual,
   barnCapacity:Math.max(8,Math.ceil(actual*1.3)),authority:'CANON_TRAINER__SMALL_SCENARIO'};
 }
 function horseAt(i) {
  if(!Number.isInteger(i)||i<0||i>=sourceHorses.length)throw Error('Founder horse index');
  return base.horseAt(horseIndexes[i]);
 }
 function horseDirectoryAt(i) {
  if(!Number.isInteger(i)||i<0||i>=sourceHorses.length)throw Error('Founder horse directory');
  return {...base.horseDirectoryAt(horseIndexes[i]),index:i};
 }
 function worldHorseDirectoryAt(i) {
  if(!Number.isInteger(i)||i<0||i>=sourceHorses.length+stock.length)throw Error('Founder world horse index');
  if(i<sourceHorses.length)return {...horseDirectoryAt(i),index:i,registryGroup:'REGISTERED'};
  const h=stock[i-sourceHorses.length],sire=i-sourceHorses.length>=breedingMares.length;
  const identifiedCrescentStar=h.id==='H-1985-000003'||h.id==='H-1987-000001';
  return {id:h.id,index:i,name:h.name,foalYear:h.foalYear||null,
   foalYearBasis:h.foalYearBasis||'SOURCE_RECORD',
   age:h.foalYear?1999-h.foalYear:null,sex:sire?'STALLION':'MARE',
   status:sire?'AT_STUD':'BROODMARE',
   ownerId:identifiedCrescentStar?'O-000062':'',
   breederId:identifiedCrescentStar?'O-000062':'',
   ownershipBasis:identifiedCrescentStar?'USER_APPROVED_NEEDS_RACING_OWNER_LEDGER_JOINS':'UNVERIFIED',
   trainerId:'',sireId:h.sireId||'',damId:h.damId||'',
   farmId:h.standingFarm1999?.farmOrganizationId||h.boardingFarm1999?.farmOrganizationId||'',
   canonical:true,registryGroup:sire?'STALLION':'BROODMARE'};
 }
 function worldHorseAt(i) {
  if(i<sourceHorses.length)return horseAt(i);
  const h=worldHorseDirectoryAt(i),source=stock[i-sourceHorses.length];
  return {...source,...h,ageAtOpening:h.age,racingStatus1999:h.status,
   authority:'SOURCE_BREEDING_STOCK__NO_1999_PREGNANCY_OR_RACING_RESULT'};
 }
 function worldHorseAttributeAt(i,key){
  if(i<sourceHorses.length)return horseAttributeAt(i,key);
  if(!Object.values(attributeCatalog.horse_categories).flat().some(d=>d.key===key))
   throw Error('Unknown world horse attribute '+key);
  return 0.5; // neutral UNASSESSED signal, NOT a historical performance claim
 }
 function horseAttributeAt(i,key){return base.horseAttributeAt(horseIndexes[i],key)}
 function parentAt(i,sex) {
  const list=sex==='SIRE'?sourceStallions:breedingMares;
  if(!Number.isInteger(i)||i<0||i>=list.length)throw Error('Founding breeding index');
  const h=list[i];
  return {...h,sex:sex==='SIRE'?'STALLION':'MARE',
   age:h.foalYear?1999-h.foalYear:null,status:sex==='SIRE'?'AT_STUD':'BROODMARE',
   source:'APPROVED_1999_BREEDING_ROSTER'};
 }
 function mareDirectoryAt(i){const h=parentAt(i,'DAM');return {
  ...h,index:i,foalingDecision:'NOT_COMMITTED',
  sire:h.sireId||'',dam:h.damId||'',
  farm:h.standingFarm1999?.farmName||h.boardingFarm1999?.farmName||'',
  status:'BREEDING_MARE_UNASSESSED',bookings:false,foals:false,
  pregnancyStatus:'UNOBSERVED',source:'1999_FOUNDING_CANON_BROODMARE'};}
 function facilityAt(i){
  if(!Number.isInteger(i)||i<0||i>=trainerList.length+facilities.length+trackCount)
   throw Error('Founding facility index');
  if(i<trainerList.length){
   const t=trainerAt(i);return {id:'F-FOUNDING-BARN-'+t.id,name:t.name+' Racing Barn',
    type:'RACE_BARN',facilityClass:'RACING_STABLE',location:t.location,
    trainerId:t.id,trackId:t.homeTrackId,capacity:t.barnCapacity,occupied:t.sourceRunners,
    source:'FOUNDING_BARN__CAPACITY_TEST'};
  }
  const j=i-trainerList.length;
  if(j<facilities.length){
   const f=facilities[j],geo=loc(f.locationLabel);
   return {id:'F-FOUNDING-FARM-'+f.id,name:f.name,
    type:'BREEDING_FARM',facilityClass:f.type,organizationId:f.id,location:geo,
    capacity:0,occupied:breedingMares.filter(h=>
     (h.standingFarm1999?.farmOrganizationId||h.boardingFarm1999?.farmOrganizationId)===f.id).length,
    capacityBasis:'NOT_YET_MODELED__DO_NOT_ASSUME_ACREAGE_OR_CAPACITY',source:'CANON_OR_PROVISIONAL_FARM_NODE'};
  }
  const t=base.trackAt(j-facilities.length);
  return {id:'F-FOUNDING-TRACK-'+t.id,name:t.name+' Training Center',
   type:'TRAINING_CENTER',location:t.location,trackId:t.id,
   capacity:0,occupied:0,source:'1999_TRACK_PLACEHOLDER'};
 }
 function sourcePersonAt(i) {
  if(!Number.isInteger(i)||i<0||i>=sourcePeople.length)throw Error('Founder source person');
  const p=sourcePeople[i],ix=canon.people.findIndex(x=>x.id===p.id);
  return ix<0?p:{...base.sourcePersonAt(ix),...p};
 }
 function annualFoalingForecast(){return {season:1999,mares:breedingMares.length,
  activeMares:0,projectedCoverings:0,projectedLiveFoals:0,annualFoalCropTarget:0,
  healthyRange:{min:0,max:0},stallionPopulation:sourceStallions.length,
  basis:'FOUNDING_SCENARIO_NO_PREGNANCIES_OR_FOALS_PREDETERMINED'};}
 const counts={
  horses:sourceHorses.length,worldHorses:sourceHorses.length+stock.length,
  canonicalHorses:sourceHorses.length,generatedHorses:0,owners:sourceOrganizations.length,
  trainers:trainingPeople.length,people:sourcePeople.length+staffIndices.length,
  tracks:trackCount,nonPlayableInternationalTracks:canon.tracks.length-trackCount,
  facilities:trainerList.length+facilities.length+trackCount,breedingFarms:facilities.length,
  breedingMares:breedingMares.length,breedingStallions:sourceStallions.length,auctions:12,
  sourceStallions:sourceStallions.length,sourceBroodmareLocations:sourceBoarding.length,
  populationAdditional:0,populationGroups:{registered:sourceHorses.length,
   broodmares:breedingMares.length,stallions:sourceStallions.length,additional:0}
 };
 return {schema:FOUNDING_WORLD_SCHEMA,seed,mode:FOUNDING_WORLD_MODE,
  startDate:'1999-01-01',currentDate:'1999-01-01',worldProfile:{
   schema:'WTW_WORLD_PROFILE_V1',mode:FOUNDING_WORLD_MODE,seed,population:counts.worldHorses,
   generator:FOUNDING_WORLD_SCHEMA},canonProtected:true,
  identityLayer:'SOURCE_SELECTED_PLUS_PROVISIONAL_FOUNDER_OPERATIONS',
  counts,ownerAt,trainerAt,trackAt:i=>base.trackAt(i),horseAt,horseDirectoryAt,
  horseAttributeAt,worldHorseAt,worldHorseDirectoryAt,worldHorseAttributeAt,
  worldIndexByHorseId:id=>indexById.get(id)??-1,
  worldPartition:i=>i<sourceHorses.length?{kind:'REGISTERED',offset:i}:
    i<sourceHorses.length+breedingMares.length?
    {kind:'BROODMARE',offset:i-sourceHorses.length}:
    {kind:'STALLION',offset:i-sourceHorses.length-breedingMares.length},
  populationCacheStats:()=>({foundingWorldProfiles:sourceHorses.length,
   historicalArchivePreserved:true}),
  personAt:i=>base.personAt(staffIndices[i]),
  jockeyBookingMarket:base.jockeyBookingMarket,sourcePersonAt,
  projectAtDate:base.projectAtDate,auctionAt:i=>base.auctionAt(i),
  facilityAt,conditionBook:base.conditionBook,
  ownedHorseIndexes:id=>(ownerHorseMap.get(id)||[]).slice(),
  horseNameStatus:'CANON_NAMES_SOURCE_LOCKED__NO_GENERATED_OPENING_HORSES',
  parentAt,mareDirectoryAt,annualFoalingForecast,
  attributeCatalog,sourceStakes:base.sourceStakes,
  sourceOrganizations,sourcePeople,sourceHorses,sourceStallions,
  sourceBroodmares:breedingMares,sourceBroodmareBoarding:sampleBoarding,
  historicalAnchors:HISTORICAL_ANCHORS,
  excludedActiveStaffRoles:['groom','exercise_rider'],
  audit:{sourceOpeningHorses:sourceHorses.length,sourceOwnersWithRunners:
   [...ownerHorseMap.values()].filter(a=>a.length).length,
   canonicalOwnerIds:EXISTING_IDS.length+PUBLIC_FIGURE_OWNERS.length,
   provisionalOrganizations:PROVISIONAL.length,
   historicalAnchorRecords:HISTORICAL_ANCHORS.length,
   currentBreedingMares:breedingMares.length,currentStallions:sourceStallions.length,
   sourceBoardingMaresAvailable:sourceBoarding.length,
   historyArchiveImmutable:true,provisionalOwnerIdsNotPermanent:true}
 };
}
