/**
 * WIRE TO WIRE — standalone fictional-world identity generation.
 *
 * A factory, NOT an importer: no game-save, source-canon, history, D1, UI,
 * network or filesystem dependencies. Call once at creation time with the
 * world seed and spec, then commit the returned identities through the game's
 * separate world-creation transaction when that feature is ready.
 *
 * Horses and racecourses belong to their own world-generation workstreams.
 */
import {createPersonnelNameRoster,PERSONNEL_NAME_MODEL} from './personnel-name-engine.mjs';
import {roleOrigin,GEO_NAME_MODEL} from './geographic-names.mjs';
import {createOrganizationNameRoster,ORGANIZATION_NAME_MODEL} from './organization-name-engine.mjs';
import {
 JOCKEY_COLONIES,JOCKEY_COLONY_NAME_MODEL,
 DEFAULT_JOCKEY_COLONY_ORIGIN_WEIGHTS,inferJockeyColony,chooseJockeyColonyOrigin
} from './jockey-colony-names.mjs';

export const FICTIONAL_WORLD_NAME_ENGINE='WTW_FICTIONAL_WORLD_IDENTITIES_V3';
export const SUPPORTED_NAME_ERA=1999;
export const SUPPORTED_ORIGINS=Object.freeze(['US','CA','GB','IE','PR','PA','VE','MX','CL','PE','CO','DO','AR','BR','UY']);
export const DEFAULT_WORLD_ROLE_COUNTS=Object.freeze({
 trainer:4200,jockey:1800,farm_manager:550,veterinarian:430,
 farrier:420,bloodstock_agent:360,racing_secretary:134
});
export const DEFAULT_WORLD_FACILITY_COUNTS=Object.freeze({
 generalFarms:490,studFarms:240,nurseries:105,bloodstockFarms:65,
 breakingTraining:0
});
// These are real geographic markets, not named racecourses or fictional
// assertions that a specific horse/person/business already operates here.
const DEFAULT_MARKETS=Object.freeze([
 {id:'lexington-ky',city:'Lexington',region:'Kentucky',country:'United States',code:'US',weight:14,breeding:true},
 {id:'versailles-ky',city:'Versailles',region:'Kentucky',country:'United States',code:'US',weight:9,breeding:true,racing:false},
 {id:'paris-ky',city:'Paris',region:'Kentucky',country:'United States',code:'US',weight:6,breeding:true,racing:false},
 {id:'ocala-fl',city:'Ocala',region:'Florida',country:'United States',code:'US',weight:11,breeding:true,racing:false},
 {id:'saratoga-ny',city:'Saratoga Springs',region:'New York',country:'United States',code:'US',weight:8,breeding:true},
 {id:'millbrook-ny',city:'Millbrook',region:'New York',country:'United States',code:'US',weight:4,breeding:true,racing:false},
 {id:'laurel-md',city:'Laurel',region:'Maryland',country:'United States',code:'US',weight:6,breeding:false},
 {id:'middleburg-va',city:'Middleburg',region:'Virginia',country:'United States',code:'US',weight:5,breeding:true,racing:false},
 {id:'arcadia-ca',city:'Arcadia',region:'California',country:'United States',code:'US',weight:8,breeding:false},
 {id:'santa-ynez-ca',city:'Santa Ynez',region:'California',country:'United States',code:'US',weight:5,breeding:true,racing:false},
 {id:'louisville-ky',city:'Louisville',region:'Kentucky',country:'United States',code:'US',weight:8,breeding:false},
 {id:'toronto-on',city:'Toronto',region:'Ontario',country:'Canada',code:'CA',weight:8,breeding:false},
 {id:'georgetown-on',city:'Georgetown',region:'Ontario',country:'Canada',code:'CA',weight:4,breeding:true,racing:false},
 {id:'new-orleans-la',city:'New Orleans',region:'Louisiana',country:'United States',code:'US',weight:5,breeding:false},
 // Explicit 1999 circuit hubs so jockeys do not live in every breeding town.
 {id:'hallandale-beach-fl',city:'Hallandale Beach',region:'Florida',country:'United States',code:'US',weight:12,breeding:false,racing:true},
 {id:'miami-fl',city:'Miami',region:'Florida',country:'United States',code:'US',weight:6,breeding:false,racing:true},
 {id:'elmont-ny',city:'Elmont',region:'New York',country:'United States',code:'US',weight:10,breeding:false,racing:true},
 {id:'del-mar-ca',city:'Del Mar',region:'California',country:'United States',code:'US',weight:7,breeding:false,racing:true},
 {id:'oceanport-nj',city:'Oceanport',region:'New Jersey',country:'United States',code:'US',weight:5,breeding:false,racing:true},
 {id:'chicago-il',city:'Chicago',region:'Illinois',country:'United States',code:'US',weight:5,breeding:false,racing:true}
]);
const ROLE_AGES=Object.freeze({
 trainer:[26,75],jockey:[18,58],owner:[29,83],
 farm_manager:[24,72],veterinarian:[27,72],farrier:[20,69],
 bloodstock_agent:[24,75],racing_secretary:[27,73],
 assistant_trainer:[21,67],jockey_agent:[25,73],
 exercise_rider:[17,56],groom:[18,68]
});
const FARM_KEYS=Object.freeze([
 ['FARM','generalFarms'],['STUD_FARM','studFarms'],
 ['THOROUGHBRED_NURSERY','nurseries'],['BLOODSTOCK_FARM','bloodstockFarms']
]);
const MAX_NAME_RECORDS=30000;
const ROLE_ORDER=Object.freeze(Object.keys(ROLE_AGES).filter(x=>x!=='owner'));
const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');
const frozen=record=>Object.freeze(record);
function hash(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const c of String(key)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;return h>>>0;
}
function count(n,kind){
 if(!Number.isInteger(n)||n<0||n>MAX_NAME_RECORDS)
  throw Error('Invalid '+kind+' count: expected integer from 0 to '+MAX_NAME_RECORDS);
 return n;
}
function cleanWorldId(value){
 if(typeof value!=='string'||! /^[a-zA-Z][a-zA-Z0-9-]{1,47}$/.test(value))
  throw Error('World ID must be 2–48 letters, digits or hyphens, beginning with a letter');
 return value;
}
function marketList(input){
 const raw=input??DEFAULT_MARKETS;
 if(!Array.isArray(raw)||raw.length===0||raw.length>500)throw Error('World requires 1–500 geographic markets');
 const keys=new Set();
 return Object.freeze(raw.map((m,i)=>{
  if(!m||typeof m!=='object')throw Error('Invalid geographic market '+i);
  for(const k of ['id','city','region','country','code'])
   if(typeof m[k]!=='string'||!m[k].trim())throw Error('Market missing '+k+' at '+i);
  if(!/^[a-z0-9-]{2,64}$/.test(m.id)||keys.has(m.id))throw Error('Duplicate or invalid market ID '+m.id);
  if(!/^[A-Z]{2}$/.test(m.code))throw Error('Invalid market country code '+m.code);
  keys.add(m.id);
  const weight=m.weight??1;
  if(!Number.isInteger(weight)||weight<1||weight>1000)throw Error('Invalid market weight '+m.id);
  if(m.jockeyColony!==undefined&&!JOCKEY_COLONIES.includes(m.jockeyColony))
   throw Error('Unknown jockey colony for market '+m.id);
  if(m.racing!==undefined&&typeof m.racing!=='boolean')
   throw Error('Invalid racing market flag for '+m.id);
  return frozen({id:m.id,city:m.city,region:m.region,country:m.country,
   code:m.code,weight,breeding:Boolean(m.breeding),racing:m.racing!==false,
   jockeyColony:m.jockeyColony??inferJockeyColony(m)});

 }));
}
function weightedPick(seed,key,options){
 if(!options.length)throw Error('No eligible geographic markets');
 const total=options.reduce((n,m)=>n+m.weight,0);
 let draw=hash(seed,key)%total;
 for(const m of options){draw-=m.weight;if(draw<0)return m}
 return options.at(-1);
}
function birthplaceCountry(seed,index,role,weights){
 const mix=weights[role];
 if(!mix)return roleOrigin(seed,index,role);
 const total=mix.reduce((n,entry)=>n+entry[1],0);
 let x=hash(seed,'origin:'+index+':'+role)%total;
 for(const [country,weight] of mix){x-=weight;if(x<0)return country}
 return mix.at(-1)[0];
}
function validatedCountryWeights(input){
 if(input==null)return frozen({});
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid origin mixes');
 const out={};
 for(const [role,list] of Object.entries(input)){
  if(!ROLE_AGES[role]||!Array.isArray(list)||!list.length)throw Error('Invalid country mix for '+role);
  const seen=new Set();
  out[role]=Object.freeze(list.map(pair=>{
   if(!Array.isArray(pair)||pair.length!==2||!SUPPORTED_ORIGINS.includes(pair[0])||
    !Number.isInteger(pair[1])||pair[1]<1||pair[1]>1000||seen.has(pair[0]))
    throw Error('Unsupported country or weight in '+role);
   seen.add(pair[0]);return Object.freeze([...pair]);
  }));
 }
 return frozen(out);
}
function farmKindOrder(seed,facilities){
 // Exact caller-requested purpose counts, shuffled deterministically so
 // farms and studs are interleaved rather than sorted into artificial blocks.
 const values=[];
 for(const [kind,key] of FARM_KEYS)for(let i=0;i<facilities[key];i++)values.push(kind);
 for(let i=values.length-1;i>0;i--){
  const j=hash(seed,'farm-purpose:'+i)%(i+1);
  [values[i],values[j]]=[values[j],values[i]];
 }
 return Object.freeze(values);
}
function makeId(worldId,kind,index){
 return 'WTWFI-'+worldId+'-'+kind+'-'+String(index+1).padStart(6,'0');
}
const loc=m=>frozen({marketId:m.id,city:m.city,region:m.region,country:m.country,countryCode:m.code});
function validateNameRecord(name,id){
 if(!name||/\b\d+\b/.test(name)||/\b[A-Z]\.\s+[A-Z]\.\s/.test(name))
  throw Error('Invalid generated person name for '+id+': '+name);
}
function ageAtOpening(seed,id,role){
 const [min,max]=ROLE_AGES[role]||ROLE_AGES.owner;
 return min+hash(seed,'age:'+id)%(max-min+1);
}
export function normalizeFictionalWorldNamingSpec(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('World naming specification must be an object');
 const worldId=cleanWorldId(input.worldId);
 const seed=input.seed??19990101;
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295)throw Error('World seed must be a positive 32-bit integer');
 const year=input.year??1999;
 if(year!==SUPPORTED_NAME_ERA)throw Error('Name corpus currently supports the 1999 opening era only');
 const roleInput=input.roles??DEFAULT_WORLD_ROLE_COUNTS;
 if(!roleInput||typeof roleInput!=='object'||Array.isArray(roleInput))throw Error('Invalid role counts');
 const roles={};
 for(const role of Object.keys(roleInput))
  if(!ROLE_ORDER.includes(role))throw Error('Unsupported role '+role+'; owner principals use owners');
 // Canonical order: equivalent JSON role maps produce identical identities.
 for(const role of ROLE_ORDER)if(Object.hasOwn(roleInput,role))
  roles[role]=count(roleInput[role],role);
 const owners=count(input.owners??3308,'owners');
 const facInput=input.facilities??DEFAULT_WORLD_FACILITY_COUNTS;
 if(!facInput||typeof facInput!=='object'||Array.isArray(facInput))throw Error('Invalid facility counts');
 const facilities={};
 const facilityKeys=[...FARM_KEYS.map(x=>x[1]),'breakingTraining'];
 for(const key of Object.keys(facInput))
  if(!facilityKeys.includes(key))throw Error('Unsupported facility purpose '+key);
 for(const key of facilityKeys)
  facilities[key]=count(facInput[key]??0,key);
 const farmCount=FARM_KEYS.reduce((n,[,key])=>n+facilities[key],0);
 const staff=Object.values(roles).reduce((a,b)=>a+b,0);
 if(staff+owners>MAX_NAME_RECORDS)throw Error('Too many people in one naming batch');
 if(owners+(roles.trainer??0)+farmCount+facilities.breakingTraining>MAX_NAME_RECORDS)
  throw Error('Too many organizations in one naming batch');
 const reservedNames=input.protectedNames??[];
 if(!Array.isArray(reservedNames)||reservedNames.some(x=>typeof x!=='string'||!x.trim()))
  throw Error('Protected names must be an array of nonempty strings');
 const markets=marketList(input.markets);
 const originWeights=validatedCountryWeights(input.originWeightsByRole);
 return frozen({worldId,year,seed,owners,roles:frozen(roles),facilities:frozen(facilities),
  farmCount,staff,protectedNames:frozen([...reservedNames]),markets,originWeights});
}
/**
 * Pure deterministic naming factory. Returns an IN-MEMORY identity proposal,
 * not a saved world or a promise to modify the existing 1999 game.
 */
export function createFictionalWorldNameEngine(input){
 const spec=normalizeFictionalWorldNamingSpec(input);
 const {seed,worldId,year,roles,owners,staff,facilities,markets,farmCount}=spec;
 const sections=Object.entries(roles);
 const indexes={};let position=0;
 for(const [role,n] of sections){indexes[role]=position;position+=n}
 indexes.owner=position;
 const roleAt=index=>{
  if(index>=staff)return 'owner';
  for(const [role,n] of sections){
   if(index<indexes[role]+n&&index>=indexes[role])return role;
  }
  throw Error('Missing role at index '+index);
 };
 const personNames=createPersonnelNameRoster(seed,staff+owners,roleAt,spec.protectedNames,{
  countryAt:(index,role)=>birthplaceCountry(seed,index,role,spec.originWeights),
  maxBaseNameUses:2,avoidIdenticalGivenSurname:true
 });
 const countrySet=new Set(SUPPORTED_ORIGINS);
 const basePeople=Object.freeze(personNames.map((p,i)=>{
  const role=roleAt(i),ordinal=i-indexes[role],id=makeId(worldId,'PERSON-'+role.toUpperCase(),ordinal);
  validateNameRecord(p.name,id);
  if(!countrySet.has(p.birthCountry))throw Error('Unsupported birth country '+p.birthCountry);
  const market=weightedPick(seed,'person-market:'+role+':'+ordinal,markets);
  const age=ageAtOpening(seed,id,role);
  return frozen({id,worldId,role,name:p.name,nameStyle:p.nameStyle,
   birthCountry:p.birthCountry,ageAtOpening:age,birthYear:year-age,
   location:loc(market),nameOrigin:p.source,source:'FICTIONAL_WORLD_ENGINE'});
 }));
 const trainers=Object.freeze(basePeople.slice(indexes.trainer??0,(indexes.trainer??0)+(roles.trainer??0)));
 const principalPeople=basePeople.slice(staff);
 const org=createOrganizationNameRoster({
  seed,ownerCount:owners,barnCount:trainers.length,farmCount,
  breakingCount:facilities.breakingTraining,
  protectedNames:[...spec.protectedNames,...basePeople.map(p=>p.name)],
  principalNames:principalPeople.map(p=>p.name),
  trainerNames:trainers.map(p=>p.name),
  farmKindPlan:farmKindOrder(seed,facilities),
  alignPrincipalSurnames:true
 });
 const owningOrganizations=Object.freeze(org.owners.map((name,i)=>{
  const id=makeId(worldId,'OWNER',i),principal=principalPeople[i];
  const principalFamily=principal.name.trim().split(/\s+/).at(-1);
  const familyNamed=name.includes(' Family ');
  if(familyNamed&&norm(name.split(' Family ')[0])!==norm(principalFamily))
   throw Error('Family business has no matching principal family: '+id);
  return frozen({id,worldId,name,kind:i%11===0?'SOLE_OWNER':'RACING_OWNER',
   principalId:principal.id,principalName:principal.name,
   principalRelationship:familyNamed?'NAMED_FAMILY_PRINCIPAL':'DESIGNATED_PRINCIPAL',
   familyName:familyNamed?principalFamily:null,
   location:principal.location,source:'FICTIONAL_WORLD_ENGINE'});
 }));
 const stables=Object.freeze(org.barns.map((name,i)=>{
  const trainer=trainers[i];
  return frozen({id:makeId(worldId,'RACING-STABLE',i),worldId,name,
   kind:'RACING_STABLE',trainerId:trainer.id,trainerName:trainer.name,
   location:trainer.location,source:'FICTIONAL_WORLD_ENGINE'});
 }));
 const breeders=markets.filter(m=>m.breeding),farmMarkets=breeders.length?breeders:markets;
 const farmManagers=basePeople.slice(indexes.farm_manager??0,(indexes.farm_manager??0)+(roles.farm_manager??0));
 const managerIdsByFarm=Array.from({length:org.farms.length},()=>[]);
 const farmByManagerId=new Map();
 // Managers have one operational farm each; a farm may have co-managers.
 if(org.farms.length){
  const start=hash(seed,'farm-manager-allocation')%org.farms.length;
  farmManagers.forEach((manager,i)=>{
   const farmIndex=(start+i)%org.farms.length;
   managerIdsByFarm[farmIndex].push(manager.id);
   farmByManagerId.set(manager.id,farmIndex);
  });
 }
 const farms=Object.freeze(org.farms.map((name,i)=>{
  const market=weightedPick(seed,'farm-market:'+i,farmMarkets);
  return frozen({id:makeId(worldId,'FARM',i),worldId,name,kind:org.farmKinds[i],
   managerIds:Object.freeze(managerIdsByFarm[i]),
   location:loc(market),source:'FICTIONAL_WORLD_ENGINE'});
 }));
 const trainingCenters=Object.freeze(org.breakingCenters.map((name,i)=>{
  const market=weightedPick(seed,'breaking-market:'+i,markets);
  return frozen({id:makeId(worldId,'TRAINING-CENTER',i),worldId,name,
   kind:'BREAKING_AND_TRAINING',location:loc(market),source:'FICTIONAL_WORLD_ENGINE'});
 }));
 const people=Object.freeze(basePeople.map(person=>{
  if(person.role==='trainer'){
   const ordinal=Number(person.id.split('-').at(-1))-1;
   return frozen({...person,stableId:stables[ordinal].id});
  }
  if(person.role==='owner'){
   const ordinal=Number(person.id.split('-').at(-1))-1;
   return frozen({...person,organizationId:owningOrganizations[ordinal].id});
  }
  if(person.role==='farm_manager'){
   const farmIndex=farmByManagerId.get(person.id);
   const farm=farmIndex===undefined?null:farms[farmIndex];
   return frozen({...person,farmId:farm?.id??null,
    location:farm?farm.location:person.location});
  }
  return person;
 }));
 const orgRows=[...owningOrganizations,...stables,...farms,...trainingCenters];
 const checkUnique=(items,label)=>{
  const used=new Set();
  for(const item of items){
   const key=norm(item.name);
   if(used.has(key))throw Error('Duplicate '+label+' name: '+item.name);
   used.add(key);
  }
 };
 checkUnique(people,'person');checkUnique(orgRows,'organization');
 const personIds=new Set(people.map(x=>x.id));
 if(personIds.size!==people.length)throw Error('Duplicated person identity key');
 if(!owningOrganizations.every(o=>personIds.has(o.principalId)))throw Error('Owner principal integrity failure');
 if(!stables.every(s=>personIds.has(s.trainerId)))throw Error('Stable trainer integrity failure');
 const personById=new Map(people.map(p=>[p.id,p]));
 if(!owningOrganizations.every(o=>personById.get(o.principalId)?.organizationId===o.id))
  throw Error('Owner-principal reciprocal link failure');
 if(!stables.every(s=>personById.get(s.trainerId)?.stableId===s.id))
  throw Error('Trainer-stable reciprocal link failure');
 if(!farms.every(f=>f.managerIds.every(id=>personById.get(id)?.farmId===f.id&&
  personById.get(id)?.location.marketId===f.location.marketId)))
  throw Error('Farm-manager reciprocal link or base failure');
 const counts=frozen({people:people.length,owners:owningOrganizations.length,
  stables:stables.length,farms:farms.length,trainingCenters:trainingCenters.length,
  assignedFarmManagers:farmByManagerId.size,unassignedFarmManagers:farmManagers.length-farmByManagerId.size,
  byRole:frozen({...roles,owner:owners}),
  byFarmKind:frozen(Object.fromEntries(FARM_KEYS.map(([kind])=>[kind,farms.filter(f=>f.kind===kind).length])))});
 const specFingerprint=hash(seed,JSON.stringify({worldId,year,roles,owners,facilities,
  markets:markets.map(m=>[m.id,m.city,m.region,m.country,m.code,m.weight,m.breeding]),originWeights:spec.originWeights,
  reserved:spec.protectedNames})).toString(16).padStart(8,'0');
 const manifest=frozen({schema:FICTIONAL_WORLD_NAME_ENGINE,worldId,seed,year,
  fingerprint:specFingerprint,personNameModel:PERSONNEL_NAME_MODEL,
  countryNameModel:GEO_NAME_MODEL,organizationNameModel:ORGANIZATION_NAME_MODEL,
  authoritative:false,sourceCanonIncluded:false,
  horseNamesIncluded:false,tracksIncluded:false,committedToGame:false,counts});
 return frozen({manifest,people,owners:owningOrganizations,stables,farms,trainingCenters});
}
