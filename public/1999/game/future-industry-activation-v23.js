/**
 * WTW V23 — immutable, approved future identities inside the EXISTING run.
 * Runtime-only overlay; no edit to signed world, new save format or DB.
 * Admission payloads are prepared by the V22 gateway after real V12/V17
 * lookups. The existing "system" kernel actor is a trusted game authority;
 * the game's FNV save checksum is not a cryptographic authenticity proof.
 */
import {ensure,isObject,requireString,validDate,worldIdentity} from './contracts.js';

export const FUTURE_GAME_INDUSTRY_SCHEMA_V23='WTW_GAME_APPROVED_FUTURE_INDUSTRY_V23';
export const FUTURE_INDUSTRY_COMMANDS_V23=Object.freeze([
 'ACTIVATE_APPROVED_FUTURE_PERSON','ACTIVATE_APPROVED_FUTURE_ORGANIZATION',
 'SYNC_APPROVED_FUTURE_PERSON','SYNC_APPROVED_FUTURE_ORGANIZATION'
]);
const KINDS=new Set(['OWNER','STABLE','FARM','TRAINING_CENTER']);
const ROLES=Object.freeze({
 OWNER:'owner',STABLE:'trainer',FARM:'farm_manager',
 TRAINING_CENTER:'farm_manager'
});
const ID=/^[A-Za-z0-9][A-Za-z0-9:_.-]{1,127}$/;
const reserved=new Set(['__proto__','constructor','prototype']);
const norm=x=>String(x??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');
const json=x=>JSON.parse(JSON.stringify(x));
function id(x,label){
 ensure(typeof x==='string'&&ID.test(x)&&!reserved.has(x),
  'FUTURE_IDENTITY_ID','Invalid permanent '+label+' ID');
 return x;
}
function establishedYear(state){
 const year=Number(state.clock.date.slice(0,4));
 ensure(year>=2000&&year<=2099,'FUTURE_IDENTITY_YEAR',
  'Future activation never applies to the 1999 founding year or after 2099');
 return year;
}
export function gameFutureIndustry(state){
 return state.runtime.future_industry??null;
}
export function gameFuturePerson(state,world,personId){
 return worldIdentity(world,'people',personId)||
  gameFutureIndustry(state)?.people?.[personId]||null;
}
export function gameFutureOrganization(state,world,organizationId){
 return worldIdentity(world,'organizations',organizationId)||
  gameFutureIndustry(state)?.organizations?.[organizationId]||null;
}
export function eligibleFutureOwner(state,world,organizationId){
 const op=gameFutureIndustry(state)?.organizations?.[organizationId];
 if(!op)return Boolean(worldIdentity(world,'organizations',organizationId));
 if(op.kind!=='OWNER'||op.status!=='ACTIVE')return false;
 const person=gameFuturePerson(state,world,op.principalId),year=Number(state.clock.date.slice(0,4));
 return Boolean(person&&person.role==='owner'&&!person.retired&&
  person.availability!=='ON_LEAVE'&&
  Number.isInteger(person.birthYear)&&year-person.birthYear>=18&&
  year-person.birthYear<=100);
}
function createRoot(state,world,industryWorldId){
 id(industryWorldId,'fictional industry world');
 let root=state.runtime.future_industry;
 if(!root){
  root={
   schema:FUTURE_GAME_INDUSTRY_SCHEMA_V23,
   industry_world_id:industryWorldId,
   world_snapshot_id:world.authority.snapshot_id,
   world_sha256:world.authority.sha256,
   people:{},organizations:{}
  };
  state.runtime.future_industry=root;
 }
 ensure(root.industry_world_id===industryWorldId,
  'FUTURE_IDENTITY_WORLD','Game career cannot switch fictional industry namespaces');
 return root;
}
function personRecord(record,state,world,command){
 ensure(isObject(record)&&!worldIdentity(world,'people',record.id)&&
  !worldIdentity(world,'organizations',record.id),
  'FUTURE_PERSON_COLLISION','Approved future person must not replace canonical source identity');
 id(record.id,'person');requireString(record.name,'person name',200);
 requireString(record.primarySurname,'person surname',100);
 ensure(['owner','trainer','farm_manager','jockey','farrier','bloodstock_agent'].
  includes(record.role),'FUTURE_PERSON_ROLE','Unsupported approved professional role');
 ensure(Number.isInteger(record.birthYear)&&record.birthYear>=1900&&
  record.birthYear<=establishedYear(state)-18,
  'FUTURE_PERSON_AGE','Future person requires plausible approved birth year');
 ensure(record.registrationStatus==='APPROVED_V12_REGISTERED_V17'&&
  Number.isSafeInteger(record.namingRevision)&&record.namingRevision>0&&
  Number.isSafeInteger(record.continuityRevision)&&record.continuityRevision>0,
  'FUTURE_PERSON_PROVENANCE','Future person needs both committed approval authorities');
 return {
  id:record.id,name:record.name,role:record.role,
  primarySurname:record.primarySurname,birthYear:record.birthYear,
  retired:false,availability:'AVAILABLE',
  activated_on:state.clock.date,
  activation_command_id:command.id,
  origin:'V12_V17_APPROVED_FUTURE_GAME_PERSON',
  naming_revision:record.namingRevision,
  continuity_revision:record.continuityRevision
 };
}
function validateMember(person,role,state){
 ensure(person&&person.role===role&&!person.retired&&
  person.availability!=='ON_LEAVE'&&
  Number.isInteger(person.birthYear)&&
  Number(state.clock.date.slice(0,4))-person.birthYear>=18&&
  Number(state.clock.date.slice(0,4))-person.birthYear<=100,
  'FUTURE_ORGANIZATION_STAFF','Future business requires registered age-eligible leaders');
}
function organizationRecord(record,state,world,command,root){
 ensure(isObject(record)&&!worldIdentity(world,'organizations',record.id)&&
  !worldIdentity(world,'people',record.id),
  'FUTURE_ORGANIZATION_COLLISION','Approved business cannot replace founding identity');
 id(record.id,'organization');requireString(record.name,'organization name',220);
 ensure(KINDS.has(record.kind)&&record.registrationStatus==='APPROVED_V12_REGISTERED_V17'&&
  Number.isSafeInteger(record.namingRevision)&&record.namingRevision>0&&
  Number.isSafeInteger(record.continuityRevision)&&record.continuityRevision>0,
  'FUTURE_ORGANIZATION_PROVENANCE','Business requires typed V12 approval and V17 registration');
 ensure(Number.isInteger(record.registeredYear)&&record.registeredYear>=2000&&
  record.registeredYear<=establishedYear(state),
  'FUTURE_ORGANIZATION_YEAR','Cannot activate a business before its approved registration');
 ensure(record.status==='ACTIVE','FUTURE_ORGANIZATION_STATUS',
  'Only an active approved business can enter game operations');
 ensure(typeof record.namingRegion==='string'&&record.namingRegion.trim()&&
  isObject(record.location),
  'FUTURE_ORGANIZATION_REGION','Approved business requires sourced operating geography');
 ensure(![...world.entities.organizations,
  ...Object.values(root.organizations)].some(o=>norm(o.name)===norm(record.name)),
  'FUTURE_ORGANIZATION_NAME','Future business name duplicates a known game operation');
 const managerIds=record.managerIds??[];
 ensure(Array.isArray(managerIds)&&new Set(managerIds).size===managerIds.length,
  'FUTURE_ORGANIZATION_STAFF','Manager IDs must be distinct');
 let leaderIds=[];
 if(record.kind==='OWNER')leaderIds=[record.principalId];
 else if(record.kind==='STABLE')leaderIds=[record.trainerId];
 else leaderIds=managerIds;
 ensure((record.kind!=='OWNER'||typeof record.principalId==='string')&&
  (record.kind!=='STABLE'||typeof record.trainerId==='string'),
  'FUTURE_ORGANIZATION_STAFF','Approved owner/trainer role cannot be omitted');
 for(const personId of leaderIds){
  id(personId,'organization leader');
  validateMember(gameFuturePerson(state,world,personId),ROLES[record.kind],state);
 }
 const base={
  id:record.id,name:record.name,kind:record.kind,
  status:'ACTIVE',principalId:record.kind==='OWNER'?record.principalId:null,
  trainerId:record.kind==='STABLE'?record.trainerId:null,
  managerIds:['FARM','TRAINING_CENTER'].includes(record.kind)?[...managerIds]:[],
  location:json(record.location),namingRegion:record.namingRegion,
  registered_year:record.registeredYear,
  activated_on:state.clock.date,activation_command_id:command.id,
  origin:'V12_V17_APPROVED_FUTURE_GAME_ORGANIZATION',
  naming_revision:record.namingRevision,
  continuity_revision:record.continuityRevision
 };
 return base;
}
export function applyFutureIndustryGameAction({state,world,command,emit}){
 const {type,actor,payload}=command;
 ensure(FUTURE_INDUSTRY_COMMANDS_V23.includes(type)&&actor==='system',
  'FUTURE_IDENTITY_PERMISSION','Only trusted game integration may activate future identities');
 establishedYear(state);
 ensure(isObject(payload)&&isObject(payload.identity)&&
  typeof payload.industry_world_id==='string'&&
  payload.world_snapshot_id===world.authority.snapshot_id&&
  payload.world_sha256===world.authority.sha256,
  'FUTURE_IDENTITY_AUTHORITY','Identity activation must bind to the approved world snapshot');
 const root=createRoot(state,world,payload.industry_world_id),record=payload.identity;
 if(type==='ACTIVATE_APPROVED_FUTURE_PERSON'){
  ensure(!root.people[record.id]&&!root.organizations[record.id],
   'FUTURE_PERSON_DUPLICATE','Person already activated in this game run');
  const person=personRecord(record,state,world,command);
  root.people[person.id]=person;
  emit('FUTURE_PERSON_ACTIVATED',{person_id:person.id,
   name:person.name,role:person.role,
   primary_surname:person.primarySurname,birth_year:person.birthYear,
   naming_revision:person.naming_revision,
   industry_world_id:root.industry_world_id,source:'V12_V17_APPROVED_FUTURE_PERSON'});
 }else if(type==='SYNC_APPROVED_FUTURE_PERSON'){
  id(record.id,'person');
  const person=root.people[record.id];
  ensure(person&&record.name===person.name&&record.role===person.role&&
   typeof record.retired==='boolean'&&
   ['AVAILABLE','ON_LEAVE'].includes(record.availability)&&
   Number.isSafeInteger(record.continuityRevision)&&
   record.continuityRevision>person.continuity_revision,
   'FUTURE_PERSON_SYNC','Personnel sync must match immutable approved ID and advance revision');
  person.retired=record.retired;
  person.availability=record.availability;
  person.continuity_revision=record.continuityRevision;
  emit('FUTURE_PERSON_SYNCED',{person_id:person.id,
   retired:person.retired,availability:person.availability,
   continuity_revision:person.continuity_revision,
   source:'CURRENT_V17_CONTINUITY'});
 }else if(type==='ACTIVATE_APPROVED_FUTURE_ORGANIZATION'){
  ensure(!root.organizations[record.id]&&!root.people[record.id],
   'FUTURE_ORGANIZATION_DUPLICATE','Business already activated in this game run');
  const op=organizationRecord(record,state,world,command,root);
  root.organizations[op.id]=op;
  emit('FUTURE_ORGANIZATION_ACTIVATED',{organization_id:op.id,kind:op.kind,
   name:op.name,registered_year:op.registered_year,
   naming_region:op.namingRegion,location:op.location,
   naming_revision:op.naming_revision,
   industry_world_id:root.industry_world_id,source:'V12_V17_APPROVED_FUTURE_ORGANIZATION'});
 }else{
  id(record.id,'organization');
  const op=root.organizations[record.id];
  ensure(op&&typeof record.status==='string'&&
   ['ACTIVE','CLOSED'].includes(record.status),
   'FUTURE_ORGANIZATION_SYNC','Only an already activated business may be synchronized');
  ensure(record.name===op.name&&record.kind===op.kind&&
   Number.isSafeInteger(record.continuityRevision)&&
   record.continuityRevision>op.continuity_revision,
   'FUTURE_ORGANIZATION_SYNC','Sync cannot change approved business identity or roll back revision');
  const newPrincipal=op.kind==='OWNER'?record.principalId:op.principalId;
  const newTrainer=op.kind==='STABLE'?record.trainerId:op.trainerId;
  const newManagers=['FARM','TRAINING_CENTER'].includes(op.kind)?
   record.managerIds:op.managerIds;
  ensure(Array.isArray(newManagers)&&new Set(newManagers).size===newManagers.length,
   'FUTURE_ORGANIZATION_SYNC','Invalid replacement managers');
  const leaders=op.kind==='OWNER'?[newPrincipal]:
   op.kind==='STABLE'?[newTrainer]:newManagers;
  if(record.status==='ACTIVE')for(const personId of leaders)
   validateMember(gameFuturePerson(state,world,personId),ROLES[op.kind],state);
  Object.assign(op,{status:record.status,principalId:newPrincipal,
   trainerId:newTrainer,managerIds:[...newManagers],
   continuity_revision:record.continuityRevision});
  emit('FUTURE_ORGANIZATION_SYNCED',{organization_id:op.id,status:op.status,
   principal_id:op.principalId,trainer_id:op.trainerId,
   manager_ids:op.managerIds,continuity_revision:op.continuity_revision,
   source:'CURRENT_V17_CONTINUITY'});
 }
}
function ensureReceipt(state,record,kind,key){
 const logged=state.event_log.find(e=>e.command_id===record.activation_command_id&&
  e.kind===kind&&e.details?.[key]===record.id);
 ensure(logged&&typeof state.command_receipts[record.activation_command_id]==='string',
  'FUTURE_IDENTITY_AUDIT','Activated identity must have a recorded game command receipt');
 return logged.details;
}
export function validateFutureIndustryGameRuntime(state,world){
 const root=gameFutureIndustry(state);
 if(root===null||root===undefined)return; // Older WTW_GAME_RUN_V1 saves unchanged.
 ensure(isObject(root)&&root.schema===FUTURE_GAME_INDUSTRY_SCHEMA_V23&&
  isObject(root.people)&&isObject(root.organizations)&&
  root.world_snapshot_id===world.authority.snapshot_id&&
  root.world_sha256===world.authority.sha256&&
  typeof root.industry_world_id==='string'&&root.industry_world_id.trim(),
  'FUTURE_IDENTITY_SAVE','Malformed or mismatched approved future industry overlay');
 ensure(Number(state.clock.date.slice(0,4))>=2000,
  'FUTURE_IDENTITY_SAVE','1999 cannot carry future industry activations');
 const names=new Set(world.entities.organizations.map(o=>norm(o.name)));
 for(const [personId,p] of Object.entries(root.people)){
  ensure(isObject(p)&&p.id===personId&&!worldIdentity(world,'people',personId)&&
   !worldIdentity(world,'organizations',personId)&&ID.test(personId)&&
   typeof p.name==='string'&&p.name.trim()&&
   typeof p.primarySurname==='string'&&p.primarySurname.trim()&&
   typeof p.role==='string'&&Number.isInteger(p.birthYear)&&
   typeof p.retired==='boolean'&&
   ['AVAILABLE','ON_LEAVE'].includes(p.availability)&&
   p.origin==='V12_V17_APPROVED_FUTURE_GAME_PERSON'&&
   Number.isSafeInteger(p.naming_revision)&&p.naming_revision>0&&
   Number.isSafeInteger(p.continuity_revision)&&p.continuity_revision>0&&
   validDate(p.activated_on)&&p.activated_on>=world.start_date&&
   p.activated_on<=state.clock.date,
   'FUTURE_IDENTITY_SAVE','Invalid or colliding future personnel save record');
  const source=ensureReceipt(state,p,'FUTURE_PERSON_ACTIVATED','person_id');
  ensure(source.name===p.name&&source.role===p.role&&
   source.primary_surname===p.primarySurname&&
   source.birth_year===p.birthYear&&source.naming_revision===p.naming_revision,
   'FUTURE_IDENTITY_AUDIT','Personnel identity differs from its game admission journal');
  const syncEvents=state.event_log.filter(e=>
   e.kind==='FUTURE_PERSON_SYNCED'&&e.details?.person_id===personId);
  if(syncEvents.length){
   const last=syncEvents[syncEvents.length-1].details;
   ensure(last.retired===p.retired&&last.availability===p.availability&&
    last.continuity_revision===p.continuity_revision,
    'FUTURE_IDENTITY_AUDIT','Personnel status differs from its latest game sync event');
  }
 }
 for(const [opId,op] of Object.entries(root.organizations)){
  ensure(isObject(op)&&op.id===opId&&ID.test(opId)&&
   !worldIdentity(world,'organizations',opId)&&
   !worldIdentity(world,'people',opId)&&!root.people[opId]&&
   KINDS.has(op.kind)&&['ACTIVE','CLOSED'].includes(op.status)&&
   op.origin==='V12_V17_APPROVED_FUTURE_GAME_ORGANIZATION'&&
   Number.isSafeInteger(op.registered_year)&&op.registered_year>=2000&&
   Number.isSafeInteger(op.continuity_revision)&&op.continuity_revision>0&&
   Number.isSafeInteger(op.naming_revision)&&op.naming_revision>0&&
   validDate(op.activated_on)&&op.activated_on<=state.clock.date&&
   typeof op.name==='string'&&op.name.trim()&&isObject(op.location)&&
   typeof op.namingRegion==='string'&&op.namingRegion.trim()&&
   Array.isArray(op.managerIds)&&new Set(op.managerIds).size===op.managerIds.length&&
   !names.has(norm(op.name)),
   'FUTURE_IDENTITY_SAVE','Invalid, renamed or colliding future business record');
  names.add(norm(op.name));
  const source=ensureReceipt(state,op,'FUTURE_ORGANIZATION_ACTIVATED','organization_id');
  ensure(source.name===op.name&&source.kind===op.kind&&
   source.registered_year===op.registered_year&&
   source.naming_region===op.namingRegion&&
   source.naming_revision===op.naming_revision&&
   JSON.stringify(source.location)===JSON.stringify(op.location),
   'FUTURE_IDENTITY_AUDIT','Business identity differs from its original game admission');
  const syncEvents=state.event_log.filter(e=>
   e.kind==='FUTURE_ORGANIZATION_SYNCED'&&
   e.details?.organization_id===opId);
  if(syncEvents.length){
   const last=syncEvents[syncEvents.length-1].details;
   ensure(last.status===op.status&&last.principal_id===op.principalId&&
    last.trainer_id===op.trainerId&&
    JSON.stringify(last.manager_ids)===JSON.stringify(op.managerIds)&&
    last.continuity_revision===op.continuity_revision,
    'FUTURE_IDENTITY_AUDIT','Business status must match its latest game sync event');
  }
  const leaders=op.kind==='OWNER'?[op.principalId]:
   op.kind==='STABLE'?[op.trainerId]:op.managerIds;
  for(const personId of leaders)
   ensure(typeof personId==='string'&&!!gameFuturePerson(state,world,personId),
    'FUTURE_IDENTITY_SAVE','Future business has an unregistered operating leader');
 }
}
