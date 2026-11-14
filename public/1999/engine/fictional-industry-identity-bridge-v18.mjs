/**
 * WTW V18 — opt-in approved-person / permanent-organization integration.
 *
 * The V12 naming journal is the ONLY authority for newly approved person
 * identities. V17 remains the ONLY authority for organizational membership,
 * family evidence, retirement and succession. No copy of either journal or
 * new identity ledger is created here; the two isolated durable stores retain
 * their original revision-guarded transaction boundaries.
 *
 * Opening and calling this facade never populates the playable 1999 world,
 * touches career saves, or generates a person or organization.
 */
import {openDurableFictionalNameService}
 from './durable-fictional-name-service.mjs';
import {openDurableOrganizationContinuityService}
 from './durable-organization-continuity-v17.mjs';

export const FICTIONAL_INDUSTRY_IDENTITY_BRIDGE_MODEL='WTW_INDUSTRY_IDENTITY_BRIDGE_V18';
const IDENTITY_FIELDS=Object.freeze([
 'id','name','role','primarySurname','birthYear'
]);
const checkId=(id,label)=>{
 if(typeof id!=='string'||!id.trim()||id.length>300)
  throw Error('Invalid '+label);
 return id;
};
/**
 * The caller supplies two existing transaction-capable stores. A continuity
 * founding directory is required only for the first open. Old approved people
 * in the V16 foundation are not retroactively fabricated in V12.
 */
export async function openFictionalIndustryIdentityBridge({
 namingStorage,continuityStorage,worldId,seed,source=null,
 protectedPeople=[],protectedOrganizations=[],familyLinkLookup=null
}={}){
 checkId(worldId,'fictional industry namespace');
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295)
  throw Error('Explicit naming seed required for V18 identity bridge');
 const naming=await openDurableFictionalNameService({
  storage:namingStorage,worldId,seed,protectedPeople,protectedOrganizations
 });
 const continuity=await openDurableOrganizationContinuityService({
  storage:continuityStorage,worldId,source,
  approvedPersonLookup:id=>naming.getApprovedPerson(id),
  familyLinkLookup
 });
 function getApprovedIdentity(personId){
  checkId(personId,'person identity ID');
  return naming.getApprovedPersonIdentity(personId);
 }
 function getPersonIdentity(personId){
  checkId(personId,'person identity ID');
  const linked=continuity.getPerson(personId);
  const approved=getApprovedIdentity(personId);
  if(linked&&approved&&IDENTITY_FIELDS.some(k=>linked[k]!==approved[k]))
   throw Error('Continuity person differs from approved naming identity');
  if(!linked&&!approved)return null;
  return Object.freeze({
   ...(linked??approved),
   namingMetadata:approved?.namingMetadata??null,
   approvedByNamingRegistry:!!approved,
   registeredInContinuity:!!linked
  });
 }
 /**
  * A V12 approval is already durable before this call. This only registers
  * that immutable identity as eligible for V16/V17 leadership assignments.
  * Rejections cannot create a phantom employee or change the naming journal.
  *
  * Two independent IDB databases cannot form one atomic distributed commit:
  * name approval and continuity registration remain explicitly separate.
  */
 async function registerApprovedPerson({
  personId,eventId,sourceId,year,expectedRevision=continuity.revision
 }={}){
  checkId(personId,'approved person ID');
  checkId(eventId,'registration event ID');
  checkId(sourceId,'registration source ID');
  // Refresh the authoritative naming journal to see approvals from other tabs
  // and to reject failed/uncommitted naming proposals.
  await naming.refresh();
  const approved=naming.getApprovedPerson(personId);
  if(!approved)throw Error('Person has not been durably approved by V12 naming');
  if(IDENTITY_FIELDS.some(k=>approved[k]===undefined||approved[k]===null))
   throw Error('Approved person has incomplete identity fields');
  // No caller-provided person name, surname, year or identity metadata accepted.
  return continuity.apply({expectedRevision,event:{
   type:'REGISTER_APPROVED_PERSON',eventId,sourceId,year,person:approved
  }});
 }
 /**
  * All role, age, current employment, documented kinship, operation type and
  * closure checks are enforced by the existing V16 validator BEFORE V17 writes.
  * Registration is deliberately not accepted through this general event path.
  */
 async function applyTransition({expectedRevision=continuity.revision,event}={}){
  if(!event||typeof event!=='object')
   throw Error('Explicit organizational continuity event required');
  if(event.type==='REGISTER_APPROVED_PERSON')
   throw Error('Use registerApprovedPerson to bind a V12-approved identity');
  return continuity.apply({expectedRevision,event});
 }
 async function refresh(){
  await naming.refresh();
  return Object.freeze({
   namingCursor:naming.cursor,
   continuityCursor:await continuity.refresh()
  });
 }
 return Object.freeze({
  model:FICTIONAL_INDUSTRY_IDENTITY_BRIDGE_MODEL,worldId,seed,
  get namingRevision(){return naming.revision},
  get continuityRevision(){return continuity.revision},
  get namingCursor(){return naming.cursor},
  get continuityCursor(){return continuity.cursor},
  getApprovedIdentity,getPersonIdentity,
  getOrganization:(...args)=>continuity.getOrganization(...args),
  getHistory:(...args)=>continuity.getHistory(...args),
  listOrganizations:(...args)=>continuity.listOrganizations(...args),
  registerApprovedPerson,applyTransition,refresh,
  exportNamingBundle:()=>naming.exportBundle(),
  exportContinuityArchive:()=>continuity.exportArchive()
 });
}
