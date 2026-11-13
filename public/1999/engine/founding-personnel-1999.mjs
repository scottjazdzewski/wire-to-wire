/**
 * WIRE TO WIRE — newly created 1999 founding-world professional pool.
 *
 * No 325k-era staff IDs, preexisting employment agreements or phantom payroll
 * enter this module. These are deterministic, scenario-only people generated
 * from the already approved geographic/professional naming and age models.
 * Existing historical people are supplied only as reserved names.
 * An uncontracted professional is NOT a trainer/jockey employed by a farm.
 */
import {createPersonnelNameRoster,PERSONNEL_NAME_MODEL} from './personnel-name-engine.mjs';
import {createAgeAbility} from './age-ability.mjs';
import attributeCatalog from './attribute-catalog.mjs';

export const FOUNDING_PERSONNEL_SCHEMA='WTW_1999_NEW_FOUNDING_PROFESSIONALS_V1';
const COUNTS=Object.freeze([
 ['jockey',26],
 ['trainer',10],
 ['farm_manager',8],
 ['bloodstock_agent',6],
 ['veterinarian',4],
 ['farrier',4],
 ['racing_secretary',4],
 ['jockey_agent',6]
]);
export const foundingProfessionalCounts=Object.freeze(Object.fromEntries(COUNTS));
const roles=COUNTS.flatMap(([role,count])=>Array(count).fill(role));
const pad=n=>String(n).padStart(4,'0');
function hash(seed,value){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}
 h^=h>>>16;return h>>>0;
}
const round=n=>Math.round(n*1000)/1000;
const legalRole=r=>r==='jockey_agent'?'bloodstock_agent':r;
const norm=n=>String(n||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
function score(seed,id,key,ability){
 const variance=(hash(seed,id+':skill:'+key)%10001)/10000;
 const weight=ability.current/99;
 return round(Math.max(.07,Math.min(.97,.17+weight*.52+variance*.26)));
}
export function createFoundingProfessionals1999({seed=19990101,protectedNames=[],tracks=[]}={}){
 if(!Number.isSafeInteger(seed)||seed<1)throw Error('Valid founding people seed required');
 if(!Array.isArray(tracks)||!tracks.length)throw Error('Founding world tracks required');
 const names=createPersonnelNameRoster(seed+741,roles.length,i=>roles[i],protectedNames);
 const seen=new Set(protectedNames.map(norm));
 const pool=names.map((record,i)=>{
  const role=roles[i],id='P-FOUNDING-STAFF-'+pad(i+1);
  if(seen.has(norm(record.name)))throw Error('Duplicate founding person '+record.name);
  seen.add(norm(record.name));
  const minMax={jockey:[18,58],trainer:[28,72],farm_manager:[28,67],
   bloodstock_agent:[26,70],veterinarian:[28,68],farrier:[21,66],
   racing_secretary:[30,69],jockey_agent:[26,68]}[role];
  const age=minMax[0]+hash(seed,id+':age')%(minMax[1]-minMax[0]+1);
  const ability=createAgeAbility({seed,id,role:legalRole(role),age});
  const definitions=[...attributeCatalog.person_common,
   ...(attributeCatalog.person_roles[legalRole(role)]||[])];
  const attributes={};
  for(const def of definitions)attributes[def.key]=score(seed,id,def.key,ability);
  const track=tracks[hash(seed,id+':circuit')%tracks.length];
  const demand=role==='jockey'?
   Math.min(95,Math.max(10,Math.round(ability.current*.76+hash(seed,id+':demand')%15))):null;
  const mountFee=role==='jockey'?Math.round(30+ability.current*.65):null;
  return {
   id,name:record.name,role,
   modelRole:legalRole(role),
   nameStatus:'PROVISIONAL_FOUNDING_GAME_PERSON',
   nameOrigin:record.source,
   roleNamingModel:PERSONNEL_NAME_MODEL,
   birthCountry:record.birthCountry,
   age,ageBasis:'DETERMINISTIC_NEW_1999_WORLD_TEST_AGE_NOT_BIOGRAPHY',
   location:track.location,baseTrackId:track.id,
   employerOrganizationId:null,employmentStatus:'AVAILABLE_UNCONTRACTED',
   contractedAtOpening:false,assignedHorseIds:[],
   ability,attributes,roleAttributes:attributes,
   reputation:{overall:Math.round(ability.current*.6+18),
    regional:Math.round(ability.current*.65+15),
    national:Math.round(ability.current*.48+10),
    commercialTrust:Math.round(ability.current*.6+18),
    basis:'NEW_FOUNDING_SCENARIO_TEST_REPUTATION'},
   morale:round(.4+(hash(seed,id+':morale')%550)/1000),
   workload:0,payrollAnnual:0,
   compensation:role==='jockey'?{
    role:'JOCKEY',basis:'1999_PILOT_OFFER_ESTIMATE_ONLY_NOT_PAID',
    mountFee,winShareRate:.1,secondShareRate:.05,thirdShareRate:.05,
    notGuaranteedSalary:true,currency:'USD',projectedAnnualGross:null
   }:null,
   bookingDemand:role==='jockey'?{
    tier:demand>75?'HIGH':demand>50?'COMPETITIVE':'LOCAL',
    baselineDemand:demand,
    market:'UNCONTRACTED_PILOT_INTEREST_ONLY'
   }:null,
   licenseStatus:'PROVISIONAL_TEST_ELIGIBLE_NEEDS_CIRCUIT_VERIFICATION',
   source:'FRESH_FOUNDING_1999_GENERATED_PERSON_NOT_LEGACY_ROSTER',
   attributesProvenance:'ID_DETERMINISTIC_TEST_VALUES_WITH_INDIVIDUAL_AGE_CURVES'
  };
 });
 if(pool.some(p=>['groom','exercise_rider'].includes(p.role)))
  throw Error('Excluded staff role reintroduced');
 return Object.freeze(pool);
}
