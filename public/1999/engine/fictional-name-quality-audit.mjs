/**
 * WTW V10 — read-only synthetic-person and organization naming QA.
 *
 * This module NEVER creates game entities, changes names, or writes a save.
 * It summarizes failures and diversity in disposable naming simulations.
 * It does not certify generated names against an external business/horse
 * registry, and it does not infer demographic truth from name patterns.
 */
export const FICTIONAL_NAME_QUALITY_MODEL='WTW_FICTIONAL_NAME_QUALITY_V10';
const MAX_ISSUES=40;
const normalize=s=>String(s??'').normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,'and')
 .replace(/[^a-z0-9]+/g,'');
const disallowedWords=/\b([a-z]+)\s+\1\b|\b(?:Equine|Thoroughbreds|Bloodstock)\s+(?:Farmstead|Acres|Stallion|Stud|Nursery)\b|\b(?:Farm|Farms|Stud|Nursery)\s+(?:Farm|Farms|Stud|Nursery)\b/i;
const byCount=entries=>Object.freeze(
 Object.fromEntries([...entries].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
 ));
const inc=(map,key)=>map.set(key,(map.get(key)||0)+1);
function insertName(map,value,type,id,issues,counts){
 const key=normalize(value);
 if(!key){counts.missingNames++;if(issues.length<MAX_ISSUES)issues.push({code:'MISSING_NAME',type,id});return}
 if(map.has(key)){
  counts.duplicateNames++;
  if(issues.length<MAX_ISSUES)issues.push({
   code:'DUPLICATE_NAME',type,id,name:value,previousId:map.get(key)
  });
 }else map.set(key,id);
 if(/\b\d+\b/.test(value)||/\b[A-Z]\.\s+[A-Z]\.\s/.test(value)){
  counts.invalidHumanFormatting+=+(type==='PERSON');
  if(type==='PERSON'&&issues.length<MAX_ISSUES)
   issues.push({code:'PERSON_NAME_FORMAT',id,name:value});
 }
 if(type==='ORGANIZATION'&&disallowedWords.test(value)){
  counts.unnaturalOrganizationPhrases++;
  if(issues.length<MAX_ISSUES)issues.push({
   code:'UNNATURAL_ORGANIZATION_PHRASE',id,name:value
  });
 }
}
/**
 * Diagnostics for one disposable fictional identity population. The method
 * is O(P+O+F), using maps and bounded issue reports, and is safe to call for
 * many seeds and multi-thousand-entity stress samples.
 *
 * "INDIVIDUAL_OWNER" is allowed to share its principal person's legal name:
 * that is NOT a duplicate organization, and never a second fictional person.
 */
export function auditFictionalIdentityNaming({
 people=[],owners=[],stables=[],farms=[],trainingCenters=[],
 protectedNames=[]
}={}){
 for(const [label,rows] of Object.entries({people,owners,stables,farms,trainingCenters}))
  if(!Array.isArray(rows))throw Error('Invalid naming QA '+label);
 if(!Array.isArray(protectedNames)||protectedNames.some(n=>typeof n!=='string'||!n.trim()))
  throw Error('Invalid protected name QA set');
 const issues=[],personNames=new Map(),organizationNames=new Map(),
  personById=new Map(),protectedKeys=new Set(protectedNames.map(normalize));
 const counts={duplicateNames:0,missingNames:0,invalidHumanFormatting:0,
  unnaturalOrganizationPhrases:0,protectedCollisions:0,missingPeopleLinks:0,
  missingTrainerLinks:0,wrongFacilityCategory:0,missingPrimarySurname:0,
  ownerPrincipalNameViolations:0};
 const ownerTypes=new Map(),regions=new Map(),peopleRoles=new Map();
 for(const p of people){
  if(!p||typeof p!=='object')throw Error('Invalid fictional person QA record');
  insertName(personNames,p.name,'PERSON',p.id,issues,counts);
  if(p.id)personById.set(p.id,p);
  inc(peopleRoles,p.role||'UNKNOWN');
  if(!p.primarySurname)counts.missingPrimarySurname++;
 }
 const organizations=[...owners,...stables,...farms,...trainingCenters];
 for(const o of organizations){
  if(!o||typeof o!=='object')throw Error('Invalid fictional organization QA record');
  insertName(organizationNames,o.name,'ORGANIZATION',o.id,issues,counts);
  if(protectedKeys.has(normalize(o.name))){
   counts.protectedCollisions++;
   if(issues.length<MAX_ISSUES)issues.push({
    code:'PROTECTED_NAME_COLLISION',id:o.id,name:o.name
   });
  }
  inc(regions,o.namingRegion||o.location?.region||'UNKNOWN');
 }
 for(const p of people)if(protectedKeys.has(normalize(p.name))){
  counts.protectedCollisions++;
  if(issues.length<MAX_ISSUES)issues.push({
   code:'PROTECTED_PERSON_COLLISION',id:p.id,name:p.name
  });
 }
 for(const owner of owners){
  inc(ownerTypes,owner.ownershipArchetype??'UNCLASSIFIED');
  const principal=personById.get(owner.principalId);
  if(!principal||principal.organizationId!==owner.id){
   counts.missingPeopleLinks++;
   if(issues.length<MAX_ISSUES)issues.push({
    code:'OWNER_PRINCIPAL_LINK',id:owner.id,name:owner.name
   });
  }
  if(owner.familyName&&principal&&owner.familyName!==principal.primarySurname){
   counts.ownerPrincipalNameViolations++;
   if(issues.length<MAX_ISSUES)issues.push({
    code:'OWNER_PRIMARY_SURNAME',id:owner.id,name:owner.name
   });
  }
 }
 for(const stable of stables){
  const trainer=personById.get(stable.trainerId);
  if(!trainer||trainer.stableId!==stable.id){
   counts.missingTrainerLinks++;
   if(issues.length<MAX_ISSUES)issues.push({
    code:'STABLE_TRAINER_LINK',id:stable.id,name:stable.name
   });
  }
 }
 for(const farm of farms){
  const match=farm.kind==='STUD_FARM'?/\b(Stud|Stallion)\b/i:
   farm.kind==='THOROUGHBRED_NURSERY'?/\bNursery\b/i:
   farm.kind==='BLOODSTOCK_FARM'?/\b(Bloodstock|Thoroughbreds)\b/i:
   farm.kind==='FARM'?/\b(Farm|Farms|Farmstead|Acres|Thoroughbreds)\b/i:
   null;
  if(!match||!match.test(farm.name)){
   counts.wrongFacilityCategory++;
   if(issues.length<MAX_ISSUES)issues.push({
    code:'FACILITY_PURPOSE_MISMATCH',id:farm.id,name:farm.name,kind:farm.kind
   });
  }
 }
 const totalOwners=owners.length;
 const formalGroups=ownerTypes.get('PARTNERSHIP_OR_SYNDICATE')||0;
 const errors=Object.values(counts).reduce((a,b)=>a+b,0);
 return Object.freeze({
  model:FICTIONAL_NAME_QUALITY_MODEL,
  pass:errors===0,
  totalErrors:errors,
  people:people.length,organizations:organizations.length,
  ownerCount:totalOwners,formalGroups,
  formalGroupShare:totalOwners?formalGroups/totalOwners:0,
  ownerArchetypes:byCount(ownerTypes),roleCounts:byCount(peopleRoles),
  namingRegions:byCount(regions),
  errorCounts:Object.freeze({...counts}),
  issues:Object.freeze(issues.map(i=>Object.freeze(i)))
 });
}
/**
 * Read-only continuity guard for on-demand sessions. It never mutates or
 * reissues previously accepted names. The receipt is deterministic and
 * intentionally limited to normalized identity/collision invariants.
 */
export function auditFictionalOnDemandNameState({state,batch,previousState=null}={}){
 if(!state||!batch||!Array.isArray(state.mintedNames)||
  !Array.isArray(state.ownerEntities)||!Array.isArray(state.ownerGroupRecords)||
  !Number.isInteger(state.partnershipsIssued))
  throw Error('Invalid on-demand naming QA state');
 const errors=[],keys=new Set(),ownerIds=new Set();
 for(const n of state.mintedNames){
  const key=normalize(n);
  if(!key||keys.has(key)){errors.push('DUPLICATE_OR_EMPTY_MINTED_NAME');break}
  keys.add(key);
 }
 for(const record of state.ownerEntities){
  if(!record||!record.id||ownerIds.has(record.id)){
   errors.push('DUPLICATE_OR_EMPTY_OWNER_ID');break;
  }
  ownerIds.add(record.id);
 }
 if(state.ownerGroupRecords.length!==state.partnershipsIssued)
  errors.push('PARTNERSHIP_COUNT_MISMATCH');
 if(state.partnershipsIssued>state.maxPartnershipGroups)
  errors.push('PARTNERSHIP_CAP_EXCEEDED');
 for(const group of state.ownerGroupRecords)
  if(!ownerIds.has(group.id)){errors.push('GROUP_NOT_AN_OWNER');break}
 if(previousState){
  if(state.nextBatch!==previousState.nextBatch+1)
   errors.push('NON_SEQUENTIAL_BATCH');
  if(state.ownerEntities.length<previousState.ownerEntities.length)
   errors.push('OWNER_REGISTRY_SHRANK');
  if(state.mintedNames.length<previousState.mintedNames.length)
   errors.push('ISSUED_NAME_REGISTRY_SHRANK');
  if(state.partnershipsIssued<previousState.partnershipsIssued)
   errors.push('PARTNERSHIP_COUNT_REWIND');
  const tail=state.ownerEntities.slice(0,previousState.ownerEntities.length);
  if(tail.some((record,i)=>record.id!==previousState.ownerEntities[i].id))
   errors.push('OWNER_IDENTITY_REWRITTEN');
 }
 if(batch.nextState&&batch.nextState!==state&&
  batch.nextState.nextBatch!==state.nextBatch)errors.push('UNRELATED_BATCH');
 return Object.freeze({model:FICTIONAL_NAME_QUALITY_MODEL,pass:errors.length===0,
  issues:Object.freeze([...new Set(errors)]),namesIssued:state.mintedNames.length,
  ownersIssued:state.ownerEntities.length,formalGroupsIssued:state.partnershipsIssued,
  nextBatch:state.nextBatch});
}
