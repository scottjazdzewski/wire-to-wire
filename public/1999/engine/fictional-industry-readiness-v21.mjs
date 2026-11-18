/**
 * Wire to Wire V21 — non-mutating age/role/readiness certification.
 *
 * Identity and career evidence only comes from established V16/V17/V18
 * people and organizations. This module NEVER creates successors, licenses,
 * families, businesses or horse assignments to repair a warning.
 */
export const FICTIONAL_INDUSTRY_READINESS_MODEL_V21='WTW_INDUSTRY_READINESS_V21';

const SLOT_ROLES=Object.freeze({
 OWNER:'owner',STABLE:'trainer',FARM:'farm_manager',
 TRAINING_CENTER:'farm_manager'
});
const cloneFreeze=x=>Object.freeze(JSON.parse(JSON.stringify(x)));
function checkYear(year){
 if(!Number.isInteger(year)||year<1999||year>2099)
  throw Error('Explicit fictional industry readiness year must be 1999–2099');
}
function checkContinuity(continuity){
 if(!continuity||typeof continuity.iterateOrganizations!=='function')
  throw Error('Readiness audit requires existing continuity organization iterator');
 const getPerson=continuity.getPerson??continuity.getPersonIdentity;
 if(typeof getPerson!=='function')
  throw Error('Readiness audit requires the existing approved-person view');
 return id=>getPerson.call(continuity,id);
}
function operationalYear(continuity){
 const value=continuity?.continuityCursor?.year??
  continuity?.cursor?.year??continuity?.year;
 checkYear(value);
 return value;
}
function leadersOf(organization){
 const kind=organization.kind;
 if(!Object.prototype.hasOwnProperty.call(SLOT_ROLES,kind))
  throw Error('Unknown kind for certified operational readiness');
 if(kind==='OWNER')return [{id:organization.principalId,role:'owner'}];
 if(kind==='STABLE')return [{id:organization.trainerId,role:'trainer'}];
 if(!Array.isArray(organization.managerIds))
  throw Error('Facility has invalid personnel directory');
 return organization.managerIds.map(id=>({id,role:'farm_manager'}));
}
/**
 * All risk reasons are derived from existing identity records and an explicit
 * simulation year, not from surname/culture or invented vital statistics.
 */
export function assessFictionalOrganizationReadinessV21({
 organization,getPerson,year
}={}){
 if(!organization||typeof organization.id!=='string'||
  typeof getPerson!=='function')
  throw Error('Readiness needs a known organization and person lookup');
 checkYear(year);
 const issues=[];
 if(organization.status!=='ACTIVE')
  issues.push({code:'CLOSED_OPERATION',personId:null});
 const leaders=leadersOf(organization);
 if(leaders.length===0)
  issues.push({code:'UNSTAFFED_OPERATION',personId:null});
 for(const {id,role} of leaders){
  if(typeof id!=='string'||!id.trim()){
   issues.push({code:'MISSING_LEADER_REFERENCE',personId:null});
   continue;
  }
  const person=getPerson(id);
  if(!person){
   issues.push({code:'MISSING_APPROVED_PERSON',personId:id});
   continue;
  }
  if(person.role!==role)
   issues.push({code:'WRONG_PROFESSIONAL_ROLE',personId:id});
  if(person.retired===true)
   issues.push({code:'RETIRED_LEADER',personId:id});
  if(person.availability==='ON_LEAVE')
   issues.push({code:'UNAVAILABLE_LEADER',personId:id});
  if(!Number.isInteger(person.birthYear))
   issues.push({code:'UNKNOWN_BIRTH_YEAR',personId:id});
  else if(year-person.birthYear<18||year-person.birthYear>100)
   issues.push({code:'IMPLAUSIBLE_ACTIVE_AGE',personId:id});
 }
 return cloneFreeze({
  model:FICTIONAL_INDUSTRY_READINESS_MODEL_V21,
  organizationId:organization.id,year,ready:issues.length===0,issues
 });
}
/**
 * Read-only, bounded-sample scan of a huge detached fictional industry.
 * Does not project an invented replacement person or reset an old firm.
 */
export function auditFictionalIndustryReadinessV21({
 continuity,year=null,kind=null,sampleLimit=50
}={}){
 const getPerson=checkContinuity(continuity);
 const atYear=year??operationalYear(continuity);
 checkYear(atYear);
 if(!Number.isInteger(sampleLimit)||sampleLimit<0||sampleLimit>1000)
  throw Error('Invalid readiness issue sample limit');
 const byCode={};
 let inspected=0,ready=0,needsDecision=0;
 const samples=[];
 for(const op of continuity.iterateOrganizations(
  kind===null?{}:{kind}
 )){
  inspected++;
  const result=assessFictionalOrganizationReadinessV21({
   organization:op,getPerson,year:atYear
  });
  if(result.ready){ready++;continue;}
  needsDecision++;
  for(const issue of result.issues)
   byCode[issue.code]=(byCode[issue.code]??0)+1;
  if(samples.length<sampleLimit)samples.push(result);
 }
 return cloneFreeze({
  model:FICTIONAL_INDUSTRY_READINESS_MODEL_V21,
  year:atYear,inspected,ready,needsDecision,
  byIssueCode:byCode,samples
 });
}
