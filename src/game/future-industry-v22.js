/**
 * WTW V22 — certified future-industry decisions at the actual game-run clock.
 *
 * A narrow adapter between canonical WTW_GAME_RUN_V1 and the detached V12/V17
 * naming and organization continuity services. NO new game world, simulation
 * kernel, UI, browser save field, owner transfer or horse assignment.
 *
 * V12/V17 use independent IndexedDB transaction domains. This adapter never
 * promises to atomically insert a new business into the game save: it reports
 * explicit continuity-only admission and requires a separate, future approved
 * gameplay-identity activation before horses can use that new ID.
 */
import {validateGameRun} from './state.js';
import {currentHorseOwnerId} from './ownership.js';
import {createFictionalIndustryReuseIndexV20}
 from '../../public/1999/engine/fictional-industry-operations-v20.mjs';
import {assessFictionalOrganizationReadinessV21}
 from '../../public/1999/engine/fictional-industry-readiness-v21.mjs';

export const GAME_INDUSTRY_GATEWAY_MODEL_V22='WTW_GAME_FUTURE_INDUSTRY_GATEWAY_V22';
const checked=x=>typeof x==='string'&&x.length>0&&x.length<=128&&
 /^[A-Za-z0-9][A-Za-z0-9:_-]*$/.test(x);
function requireId(value,label){
 if(!checked(value))throw Error('Invalid '+label);
 return value;
}
function identityYear(state){
 const year=Number(state.clock.date.slice(0,4));
 if(year<2000||year>2099)
  throw Error('Future industry decisions are disabled in the founding 1999 career');
 return year;
}
function industryYear(industry){
 const cursor=industry?.continuityCursor??industry?.cursor;
 const year=cursor?.year;
 if(!Number.isInteger(year)||year<1999||year>2099)
  throw Error('Industry continuity cursor requires a valid year');
 return year;
}
function validIndustry(industry){
 if(!industry||industry.model!=='WTW_INDUSTRY_IDENTITY_BRIDGE_V18'||
  typeof industry.getOrganization!=='function'||
  typeof industry.getPersonIdentity!=='function'||
  typeof industry.iterateOrganizations!=='function'||
  typeof industry.registerApprovedPerson!=='function'||
  typeof industry.registerApprovedOrganization!=='function'||
  typeof industry.applyTransition!=='function'||
  typeof industry.getApprovedIdentity!=='function'||
  typeof industry.getApprovedOrganizationIdentity!=='function')
  throw Error('V22 needs the real V18–V21 industry identity bridge');
 return industry;
}
/** Count only real game-run owners from canonical world and registration state.
 * Counting only recognized world organizations is intentional: V12-only newly
 * approved businesses are NOT yet allowed to own horses in the game kernel.
 */
function realOwnerUsage(state,world){
 const worldOwnerIds=new Set(world.entities.organizations.map(o=>o.id));
 const counts=new Map();
 const seen=new Set();
 let unsupportedOwnerRefs=0,unowned=0;
 const tally=(id)=>{
  if(id===null||id===undefined){unowned++;return}
  if(!worldOwnerIds.has(id)){unsupportedOwnerRefs++;return}
  counts.set(id,(counts.get(id)??0)+1);
 };
 for(const horse of world.entities.horses){
  if(seen.has(horse.id))throw Error('Duplicate canonical horse in game-world source');
  seen.add(horse.id);
  tally(currentHorseOwnerId(state,world,horse.id));
 }
 for(const horse of Object.values(state.runtime.registered_horses?.by_id??{})){
  const id=horse.horse_id;
  if(seen.has(id))continue; // avoid counting source horse twice
  seen.add(id);
  tally(horse.owner_organization_id);
 }
 return {counts,horseCount:seen.size,unsupportedOwnerRefs,unowned,
  worldOwnerIds};
}
/**
 * Construct a real-game anchored gateway. It holds one immutable run revision;
 * opening a new quote after advancing a day requires creating a new gateway.
 */
export function createFutureIndustryGameGatewayV22({state,world,industry}={}){
 validateGameRun(state,world);
 validIndustry(industry);
 const runId=state.run_id,revision=state.revision,date=state.clock.date;
 function checkCurrent(){
  validateGameRun(state,world);
  if(state.run_id!==runId||state.revision!==revision||
   state.clock.date!==date)
   throw Error('Stale game industry gateway; reopen for current game revision');
  const year=identityYear(state);
  if(industryYear(industry)>year)
   throw Error('Industry continuity journal is ahead of saved game clock');
  return year;
 }
 function quoteOwnerReuse({region=null,slots=1,policy='PREFER_ESTABLISHED',
  includeOtherRegions=false,limit=25}={}){
  const year=checkCurrent();
  const source=realOwnerUsage(state,world);
  // Include only organizations actually represented in the approved game
  // world: detached continuity business IDs cannot be treated as zero-use.
  const usable=new Set(source.worldOwnerIds);
  const detached=[...industry.iterateOrganizations({kind:'OWNER'})].
   filter(op=>!usable.has(op.id)).map(op=>op.id);
  if(source.unsupportedOwnerRefs)
   throw Error('Game-run owner source has unapproved organization references');
  // Scope V20 BEFORE sorting/paging. Otherwise hundreds of detached-only
  // V12 organizations could crowd out genuinely game-addressable owners.
  const linkedProjection={
   continuityRevision:industry.continuityRevision,
   continuityCursor:industry.continuityCursor,
   getPersonIdentity:id=>industry.getPersonIdentity(id),
   *iterateOrganizations(filter={}){
    for(const op of industry.iterateOrganizations(filter)){
     if(usable.has(op.id))yield op;
    }
   }
  };
  const index=createFictionalIndustryReuseIndexV20({
   continuity:linkedProjection,usageByOrganizationId:source.counts
  });
  const raw=index.findReusable({kind:'OWNER',region,slots,policy,
   includeOtherRegions,limit:250});
  // V21's original planner evaluates the continuity event year. We also
  // evaluate each candidate against the ACTUAL game-clock year, protecting
  // older firms that have not had fresh personnel/succession events.
  const candidates=raw.candidates.filter(candidate=>{
   if(!usable.has(candidate.id))return false;
   const op=industry.getOrganization(candidate.id);
   if(!op)return false;
   return assessFictionalOrganizationReadinessV21({
    organization:op,
    getPerson:id=>industry.getPersonIdentity(id),
    year
   }).ready;
  }).slice(0,limit);
  if(!Number.isSafeInteger(limit)||limit<1||limit>250)
   throw Error('Invalid owner reuse candidate page size');
  return Object.freeze({
   model:GAME_INDUSTRY_GATEWAY_MODEL_V22,type:'READ_ONLY_GAME_OWNER_REUSE',
   runId,gameDate:date,runRevision:revision,industryRevision:industry.continuityRevision,
   source:'APPROVED_WORLD_AND_SAVED_GAME_OWNERSHIP',
   gameHorseCount:source.horseCount,unownedHorseCount:source.unowned,
   unknownGameOwnerRefs:source.unsupportedOwnerRefs,
   detachedBusinessesExcluded:detached.length,
   kind:'OWNER',requiredHorseSlots:slots,
   candidates:Object.freeze(candidates.map(x=>Object.freeze({...x}))),
   needsAdditionalCapacity:candidates.length===0,
   makesHorseAssignments:false,mintsOrganizations:false
  });
 }
 async function registerApprovedPerson({personId,eventId,sourceId}={}){
  const year=checkCurrent();
  requireId(personId,'approved person ID');
  requireId(eventId,'game-approved person event ID');
  requireId(sourceId,'game decision source ID');
  // Registration itself refreshes V12 on an unknown ID, so a newly approved
  // person from another tab is visible without a stale precheck here.
  await industry.registerApprovedPerson({personId,eventId,sourceId,year});
  return Object.freeze({model:GAME_INDUSTRY_GATEWAY_MODEL_V22,
   personId,year,continuityRegistered:true,gameWorldActivated:false,
   gameSaveChanged:false});
 }
 async function registerApprovedOrganization({organizationId,eventId,sourceId}={}){
  const year=checkCurrent();
  requireId(organizationId,'approved future organization ID');
  requireId(eventId,'business admission event ID');
  requireId(sourceId,'game decision source ID');
  // Authoritative V19 registration handles a previously unseen approval by
  // refreshing the V12 naming index; callers never provide the firm payload.
  await industry.registerApprovedOrganization({
   organizationId,eventId,sourceId,year
  });
  return Object.freeze({model:GAME_INDUSTRY_GATEWAY_MODEL_V22,
   organizationId,year,continuityRegistered:true,
   gameWorldActivated:false,gameSaveChanged:false,
   requiresGameplayIdentityActivation:true});
 }
 async function applyPersonnelDecision({eventId,sourceId,type,personId,
  availability=null,careerStartYear=null,stage=null}={}){
  const year=checkCurrent();
  requireId(eventId,'personnel decision event ID');
  requireId(sourceId,'personnel decision source ID');
  requireId(personId,'existing person ID');
  if(!['SET_PERSON_AVAILABILITY','RECORD_PERSON_CAREER','RETIRE_PERSON'].
   includes(type))throw Error('Unsupported future gameplay personnel decision');
  const event={type,eventId,sourceId,personId,year};
  if(type==='SET_PERSON_AVAILABILITY')event.availability=availability;
  if(type==='RECORD_PERSON_CAREER'){
   event.careerStartYear=careerStartYear;event.stage=stage;
  }
  await industry.applyTransition({event});
  return Object.freeze({model:GAME_INDUSTRY_GATEWAY_MODEL_V22,
   personId,type,year,continuityRecorded:true,gameSaveChanged:false});
 }
 return Object.freeze({
  model:GAME_INDUSTRY_GATEWAY_MODEL_V22,
  runId,gameDate:date,runRevision:revision,
  quoteOwnerReuse,registerApprovedPerson,
  registerApprovedOrganization,applyPersonnelDecision
 });
}
