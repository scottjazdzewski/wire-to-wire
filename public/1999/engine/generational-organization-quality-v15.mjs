/**
 * WTW V15 — read-only, model-specific quality check for fictional
 * farms, trainers' racing stables, owners and training centers.
 *
 * These are disposable generation proposals. This module never writes
 * canonical people, business records, game saves, horses or legal entities.
 */
import {
 GENERATIONAL_ORGANIZATION_NAME_MODEL,
 generationalOrganizationNamingPeriod
} from './organization-naming-styles.mjs';
import {classifyFictionalOwnerName}
 from './organization-name-engine.mjs';

export const GENERATIONAL_ORGANIZATION_QUALITY_MODEL='WTW_GENERATIONAL_ORGANIZATION_QA_V15';
const folded=s=>String(s??'').normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');
const MAX_SAMPLES=35;
const allowedEra=new Set(['HERITAGE','ESTABLISHED','CONTEMPORARY']);
const categoryRows=w=>[
 ['owners',w.owners],['stables',w.stables],
 ['farms',w.farms],['trainingCenters',w.trainingCenters]
];
/**
 * Checks creation-period metadata, family/principal relationships, stable/
 * trainer linkage, and whether partnership issuance reconciles with the
 * ownership archetype classifier and (optional) caller's hard cap.
 *
 * Because family surnames and trainer identity are taken from already named
 * fictional people, the checker never invents a relative or business member.
 */
export function auditGenerationalOrganizationNames(
 world,{expectedYear=null,partnershipLimit=null}={}
){
 if(!world||!world.manifest||!Array.isArray(world.people)||
  categoryRows(world).some(([_,rows])=>!Array.isArray(rows)))
  throw Error('Invalid fictional organization naming proposal');
 const year=world.manifest.year;
 if(!Number.isInteger(year)||year<1999||year>2099||
  expectedYear!==null&&year!==expectedYear)
  throw Error('Organization naming year mismatch');
 if(partnershipLimit!==null&&(!Number.isInteger(partnershipLimit)||
  partnershipLimit<0||partnershipLimit>30000))
  throw Error('Invalid partnership ceiling');
 const errors={INVALID_IDENTITY:0,DUPLICATE_ORGANIZATION:0,
  WRONG_PERIOD:0,WRONG_MODEL:0,UNSUPPORTED_STYLE:0,
  OWNER_PRINCIPAL_MISMATCH:0,OWNER_ARCHETYPE_MISMATCH:0,
  FALSE_FAMILY_NAME:0,STABLE_TRAINER_MISMATCH:0,
  PARTNERSHIP_CAP_EXCEEDED:0,PARTNERSHIP_SUMMARY_MISMATCH:0},
  issues=[],seen=new Set(),peopleById=new Map(world.people.map(p=>[p.id,p])),
  archetypes=new Map(),periods=new Map(),regions=new Map();
 const fail=(code,record,details)=>{
  errors[code]++;
  if(issues.length<MAX_SAMPLES)issues.push(Object.freeze({
   code,entityId:record?.id??null,entityName:record?.name??null,
   ...(details?{details}:{})
  }));
 };
 const expectedPeriod=generationalOrganizationNamingPeriod(year);
 if(year===1999){
  if(Object.hasOwn(world.manifest,'generationalOrganizationNameModel')||
   Object.hasOwn(world.manifest,'generationalOrganizationPeriod'))
   fail('WRONG_MODEL',null,'1999 schema must remain unmodified');
 }else if(world.manifest.generationalOrganizationNameModel!==
  GENERATIONAL_ORGANIZATION_NAME_MODEL||
  world.manifest.generationalOrganizationPeriod!==expectedPeriod)
  fail('WRONG_MODEL',null,'Missing V15 period manifest');
 for(const [kind,records] of categoryRows(world)){
  for(const record of records){
   const name=record?.name,key=folded(name);
   if(!record||typeof record.id!=='string'||!record.id||
    typeof name!=='string'||!name.trim()){
    fail('INVALID_IDENTITY',record);
    continue;
   }
   if(seen.has(key))fail('DUPLICATE_ORGANIZATION',record);
   seen.add(key);
   if(!allowedEra.has(record.namingEraStyle))
    fail('UNSUPPORTED_STYLE',record);
   if(year===1999){
    if(Object.hasOwn(record,'organizationNamingPeriod')||
     Object.hasOwn(record,'organizationNamingModel'))
     fail('WRONG_MODEL',record,'Legacy business metadata altered');
   }else if(record.organizationNamingPeriod!==expectedPeriod)
    fail('WRONG_PERIOD',record);
   else if(record.organizationNamingModel!==GENERATIONAL_ORGANIZATION_NAME_MODEL)
    fail('WRONG_MODEL',record);
   const region=record.namingRegion??'UNSPECIFIED';
   regions.set(region,(regions.get(region)||0)+1);
   periods.set(record.namingEraStyle,(periods.get(record.namingEraStyle)||0)+1);
   if(kind==='owners'){
    const principal=peopleById.get(record.principalId);
    if(!principal||principal.organizationId!==record.id)
     fail('OWNER_PRINCIPAL_MISMATCH',record);
    const expected=classifyFictionalOwnerName(record.name,principal?.name);
    if(record.ownershipArchetype!==expected)
     fail('OWNER_ARCHETYPE_MISMATCH',record,
      'record='+record.ownershipArchetype+' expected='+expected);
    if(record.familyName&&(!principal||folded(record.familyName)!==
     folded(principal.primarySurname)))
     fail('FALSE_FAMILY_NAME',record);
    archetypes.set(expected,(archetypes.get(expected)||0)+1);
   }
   if(kind==='stables'){
    const trainer=peopleById.get(record.trainerId);
    if(!trainer||trainer.stableId!==record.id)
     fail('STABLE_TRAINER_MISMATCH',record);
   }
  }
 }
 const groupCount=archetypes.get('PARTNERSHIP_OR_SYNDICATE')||0;
 if(partnershipLimit!==null&&groupCount>partnershipLimit)
  fail('PARTNERSHIP_CAP_EXCEEDED',null,
   'issued='+groupCount+' cap='+partnershipLimit);
 if(groupCount!==world.manifest.ownershipPartnershipsMinted)
  fail('PARTNERSHIP_SUMMARY_MISMATCH',null,
   'issued='+groupCount+' manifest='+world.manifest.ownershipPartnershipsMinted);
 const issueTotal=Object.values(errors).reduce((a,b)=>a+b,0);
 return Object.freeze({
  model:GENERATIONAL_ORGANIZATION_QUALITY_MODEL,
  pass:issueTotal===0,year,period:expectedPeriod,
  organizations:categoryRows(world).reduce((a,[_,r])=>a+r.length,0),
  ownerCount:world.owners.length,partnershipsIssued:groupCount,
  issueCounts:Object.freeze(errors),issueTotal,
  archetypes:Object.freeze(Object.fromEntries([...archetypes].sort())),
  regions:Object.freeze(Object.fromEntries([...regions].sort())),
  styles:Object.freeze(Object.fromEntries([...periods].sort())),
  issues:Object.freeze(issues)
 });
}
