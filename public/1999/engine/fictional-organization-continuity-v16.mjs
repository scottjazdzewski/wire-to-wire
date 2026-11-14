/**
 * WTW V16 — opt-in organization continuity journal.
 * Permanent entity IDs and approved names outlive managers, trainers,
 * company principals, farm premises and operational status changes.
 *
 * Does not create people, companies, family links, horse assignments, game
 * saves or historical records. All successors must already exist in the
 * supplied fictional person directory.
 */
export const FICTIONAL_ORGANIZATION_CONTINUITY_MODEL='WTW_ORGANIZATION_CONTINUITY_V16';
export const FICTIONAL_ORGANIZATION_CONTINUITY_SNAPSHOT='WTW_ORGANIZATION_CONTINUITY_SNAPSHOT_V16';
export const CONTINUITY_EVENT_TYPES=Object.freeze([
 'CHANGE_OWNER_PRINCIPAL','CHANGE_STABLE_TRAINER','REPLACE_FARM_MANAGERS',
 'REPLACE_CENTER_MANAGERS','RELOCATE_ORGANIZATION','CLOSE_ORGANIZATION',
 'REOPEN_ORGANIZATION','RETIRE_PERSON',
 'REGISTER_APPROVED_PERSON','REGISTER_DOCUMENTED_FAMILY_LINK',
 'REGISTER_APPROVED_ORGANIZATION'
]);
const KINSHIP=new Set(['PARENT_CHILD','SIBLING','SPOUSE','DOCUMENTED_RELATIVE']);
const OPERATIONS=new Set(['OWNER','STABLE','FARM','TRAINING_CENTER']);
const key=x=>String(x??'').normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');
const clone=x=>JSON.parse(JSON.stringify(x));
const immutable=x=>Object.freeze(clone(x));
function checkId(x,label){
 if(typeof x!=='string'||!x.trim()||x.length>300)
  throw Error('Invalid '+label);
 return x;
}
function checkYear(year,min=1999){
 if(!Number.isInteger(year)||year<min||year>2099)
  throw Error('Continuity year must be '+min+'–2099');
}
function hash(data){
 // FNV integrity check against accidental corruption, not tamper evidence.
 let h=2166136261;
 for(const ch of JSON.stringify(data)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
 return 'fnv32-'+(h>>>0).toString(16).padStart(8,'0');
}
/**
 * Seal an explicit founding-directory + append-only event archive.
 * Called at backup/recovery boundaries, not on normal event writes.
 */
export function sealFictionalOrganizationContinuitySnapshot({original,events}={}){
 if(!original||!Array.isArray(events))
  throw Error('Continuity archive requires founding directory and events');
 const data={schema:FICTIONAL_ORGANIZATION_CONTINUITY_SNAPSHOT,
  original:clone(original),events:clone(events)};
 return Object.freeze({...data,checksum:hash(data)});
}
function canonicalSeed(input){
 if(!input||typeof input!=='object'||
  !Array.isArray(input.people)||!Array.isArray(input.owners)||
  !Array.isArray(input.stables)||!Array.isArray(input.farms)||
  !Array.isArray(input.trainingCenters))
  throw Error('Continuity needs a complete approved fictional organization directory');
 const worldId=checkId(input.worldId,'continuity world ID');
 const foundingYear=input.foundingYear??input.manifest?.year??1999;
 checkYear(foundingYear);
 const people=new Map(),organizations=new Map(),registeredNames=new Set();
 for(const person of input.people){
  checkId(person?.id,'existing person ID');
  checkId(person?.name,'existing person name');
  if(people.has(person.id))throw Error('Duplicate existing person ID');
  people.set(person.id,{id:person.id,name:person.name,
   role:person.role??null,primarySurname:person.primarySurname??null,
   birthYear:Number.isInteger(person.birthYear)?person.birthYear:null,
   retired:false});
 }
 for(const [kind,rows] of [['OWNER',input.owners],['STABLE',input.stables],
  ['FARM',input.farms],['TRAINING_CENTER',input.trainingCenters]]){
  for(const entity of rows){
   checkId(entity?.id,'existing organization ID');
   checkId(entity?.name,'existing organization name');
   const nameKey=key(entity.name);
   if(organizations.has(entity.id)||people.has(entity.id))
    throw Error('Repeated person or organization identity ID');
   if(registeredNames.has(nameKey))
    throw Error('Duplicated approved organization name');
   registeredNames.add(nameKey);
   const leaders=kind==='OWNER'?[entity.principalId]:
    kind==='STABLE'?[entity.trainerId]:
    Array.isArray(entity.managerIds)?[...entity.managerIds]:
    kind==='TRAINING_CENTER'?[]:null;
   if(!Array.isArray(leaders)||leaders.some(p=>!people.has(p))||
    new Set(leaders).size!==leaders.length)
    throw Error('Original organization has missing or repeated personnel');
   if(kind==='STABLE'&&people.get(leaders[0]).role!=='trainer')
    throw Error('A racing stable must have an established trainer');
   if(['FARM','TRAINING_CENTER'].includes(kind)&&
    leaders.some(id=>people.get(id).role!=='farm_manager'))
    throw Error('Facility manager must have an established farm-manager role');
   organizations.set(entity.id,{
    id:entity.id,name:entity.name,originalName:entity.name,kind,
    archetype:kind==='OWNER'?entity.ownershipArchetype??null:null,
    familyName:kind==='OWNER'?entity.familyName??null:null,
    principalId:kind==='OWNER'?leaders[0]:null,
    trainerId:kind==='STABLE'?leaders[0]:null,
    managerIds:['FARM','TRAINING_CENTER'].includes(kind)?leaders:[],
    location:entity.location??null,namingRegion:entity.namingRegion??null,
    status:'ACTIVE',foundedInRegistryYear:foundingYear,revision:0
   });
  }
 }
 const familyLinks=[],familyKeys=new Set();
 for(const relation of input.familyLinks??[]){
  if(!relation||!KINSHIP.has(relation.kind)||
   !people.has(relation.personAId)||!people.has(relation.personBId)||
   relation.personAId===relation.personBId)
   throw Error('Family succession requires real supplied relationship records');
  checkId(relation.sourceId,'family relationship provenance');
  const pair=[relation.personAId,relation.personBId].sort().join('|');
  if(familyKeys.has(pair))throw Error('Repeated family link');
  familyKeys.add(pair);
  familyLinks.push({
   kind:relation.kind,personAId:relation.personAId,
   personBId:relation.personBId,sourceId:relation.sourceId
  });
 }
 const original={worldId,foundingYear,
  people:[...people.values()].map(p=>({
   id:p.id,name:p.name,role:p.role,primarySurname:p.primarySurname,
   birthYear:p.birthYear
  })),
  owners:[],stables:[],farms:[],trainingCenters:[],
  familyLinks};
 for(const entity of organizations.values()){
  const initial={id:entity.id,name:entity.originalName,
   namingRegion:entity.namingRegion,location:entity.location};
  if(entity.kind==='OWNER')original.owners.push({...initial,
   ownershipArchetype:entity.archetype,familyName:entity.familyName,
   principalId:entity.principalId});
  if(entity.kind==='STABLE')original.stables.push({...initial,
   trainerId:entity.trainerId});
  if(entity.kind==='FARM')original.farms.push({...initial,
   managerIds:entity.managerIds});
  if(entity.kind==='TRAINING_CENTER')original.trainingCenters.push({...initial,
   managerIds:entity.managerIds});
 }
 return {worldId,foundingYear,people,organizations,familyKeys,original};
}
export function createFictionalOrganizationContinuityRegistry({
 source,snapshot=null,approvedPersonLookup=null,familyLinkLookup=null,
 approvedOrganizationLookup=null
}={}){
 if(approvedPersonLookup!==null&&typeof approvedPersonLookup!=='function')
  throw Error('Invalid approved person index lookup');
 if(familyLinkLookup!==null&&typeof familyLinkLookup!=='function')
  throw Error('Invalid documented family relationship lookup');
 if(approvedOrganizationLookup!==null&&typeof approvedOrganizationLookup!=='function')
  throw Error('Invalid approved organization index lookup');
 if(snapshot!==null){
  if(source!==undefined&&source!==null)
   throw Error('Do not overwrite a restored continuity snapshot');
  if(!snapshot||snapshot.schema!==FICTIONAL_ORGANIZATION_CONTINUITY_SNAPSHOT||
   !snapshot.original||!Array.isArray(snapshot.events)||snapshot.checksum!==
   hash({schema:snapshot.schema,original:snapshot.original,events:snapshot.events}))
   throw Error('Invalid or damaged organization continuity snapshot');
  source=snapshot.original;
 }
 const seed=canonicalSeed(source);
 const people=new Map([...seed.people].map(([id,p])=>[id,{...p}]));
 const firms=new Map([...seed.organizations].map(([id,o])=>[id,{...o}]));
 const familyPairs=seed.familyKeys,events=[],eventIds=new Set(),byFirm=new Map();
 const peopleNameKeys=new Set([...people.values()].map(p=>key(p.name)));
 const organizationNameKeys=new Set([...firms.values()].map(o=>key(o.name)));
 let revision=0,year=seed.foundingYear,replaying=false;
 const cursor=()=>Object.freeze({
  model:FICTIONAL_ORGANIZATION_CONTINUITY_MODEL,
  worldId:seed.worldId,revision,year,organizationCount:firms.size,
  knownPeople:people.size,eventCount:events.length
 });
 const activePerson=(id,role=null,atYear=year)=>{
  checkId(id,'explicit successor ID');
  const person=people.get(id);
  if(!person||person.retired)throw Error('Successor must be an existing active person');
  if(role!==null&&person.role!==role)
   throw Error('Successor has an incompatible professional role');
  if(Number.isInteger(person.birthYear)&&
   (atYear-person.birthYear<18||atYear-person.birthYear>100))
   throw Error('Successor has an implausible active-career age');
  return person;
 };
 const hasDuties=id=>[...firms.values()].some(op=>op.status==='ACTIVE'&&
  (op.principalId===id||op.trainerId===id||op.managerIds.includes(id)));
 const validateLocation=location=>{
  if(!location||typeof location!=='object'||Array.isArray(location)||
   typeof location.city!=='string'||!location.city.trim()||
   typeof location.region!=='string'||!location.region.trim()||
   typeof location.countryCode!=='string'||!/^[A-Z]{2}$/.test(location.countryCode))
   throw Error('Relocation needs an explicit city, region and two-letter country code');
  return clone(location);
 };
 function apply({expectedRevision,event,dryRun=false}={}){
  if(typeof dryRun!=='boolean')throw Error('Invalid continuity validation mode');
  if(expectedRevision!==revision)throw Error('Stale organizational continuity cursor');
  if(!event||typeof event!=='object')throw Error('Explicit continuity event required');
  checkId(event.eventId,'continuity event ID');
  checkId(event.sourceId,'continuity evidence source ID');
  checkId(event.organizationId??event.personId??event.person?.id??
   event.personAId??event.organization?.id,'continuity subject ID');
  checkYear(event.year,year);
  if(eventIds.has(event.eventId))throw Error('Repeated continuity event ID');
  if(!CONTINUITY_EVENT_TYPES.includes(event.type))
   throw Error('Unsupported organizational continuity event');
  // Validate event serialization before any operation mutates the projection.
  const recorded=immutable({...event,revision:revision+1});
  const op=firms.get(event.organizationId);
  const person=people.get(event.personId);
  let commit=()=>{};
  let addedPerson=false,addedOrganization=false;
  if(event.type==='REGISTER_APPROVED_PERSON'){
   const candidate=event.person;
   checkId(candidate?.id,'new approved person ID');
   checkId(candidate?.name,'new approved person name');
   checkId(candidate?.primarySurname,'new approved person surname');
   if(typeof candidate.role!=='string'||!candidate.role||
    !Number.isInteger(candidate.birthYear)||candidate.birthYear<1910||
    candidate.birthYear>2089||event.year-candidate.birthYear<18||
    event.year-candidate.birthYear>100||
    people.has(candidate.id)||firms.has(candidate.id)||
    peopleNameKeys.has(key(candidate.name)))
    throw Error('Invalid or duplicated accepted new person identity');
   if(!replaying){
    if(!approvedPersonLookup)throw Error('New people require existing naming-registry identity approval');
    const existing=approvedPersonLookup(candidate.id);
    if(!existing||['id','name','role','primarySurname','birthYear'].some(k=>
     existing[k]!==candidate[k]))
     throw Error('New person does not match the approved naming registry');
   }
   addedPerson=true;
   commit=()=>{
    people.set(candidate.id,{
     id:candidate.id,name:candidate.name,role:candidate.role,
     primarySurname:candidate.primarySurname,birthYear:candidate.birthYear,
     retired:false
    });
    peopleNameKeys.add(key(candidate.name));
   };
  }else if(event.type==='REGISTER_APPROVED_ORGANIZATION'){
   // The actual business ID/name and initial operational roles must originate
   // in one committed V12 approval, NOT an invented gameplay relationship.
   const candidate=event.organization,registration=candidate?.registration;
   checkId(candidate?.id,'approved new organization ID');
   checkId(candidate?.name,'approved new organization name');
   if(event.organizationId!==undefined&&event.organizationId!==candidate.id)
    throw Error('Organization registration history subject ID mismatch');
   if(!registration||!['OWNER','STABLE','FARM','TRAINING_CENTER'].includes(
    registration.kind)||!Number.isInteger(registration.approvedYear)||
    registration.approvedYear<1999||registration.approvedYear>event.year||
    typeof registration.namingRegion!=='string'||!registration.namingRegion.trim()||
    !registration.location||typeof registration.location!=='object'||
    Array.isArray(registration.location)||
    firms.has(candidate.id)||people.has(candidate.id)||
    organizationNameKeys.has(key(candidate.name)))
    throw Error('Invalid, duplicate or prematurely registered approved organization');
   if(!replaying){
    if(!approvedOrganizationLookup)
     throw Error('New businesses require durable naming-registry approval');
    const approved=approvedOrganizationLookup(candidate.id);
    if(!approved||JSON.stringify(approved)!==JSON.stringify(candidate))
     throw Error('Organization does not match the approved naming registry');
   }
   const kind=registration.kind;
   const principalId=kind==='OWNER'?registration.principalId:null;
   const trainerId=kind==='STABLE'?registration.trainerId:null;
   const managerIds=['FARM','TRAINING_CENTER'].includes(kind)?
    registration.managerIds:null;
   if(kind==='OWNER'){
    if(typeof registration.ownershipArchetype!=='string'||
     !registration.ownershipArchetype.trim())
     throw Error('Approved owner archetype missing');
    const principal=activePerson(principalId,'owner',event.year);
    if(registration.ownershipArchetype==='FAMILY_OPERATION'&&
     (!registration.familyName||
      key(registration.familyName)!==key(principal.primarySurname)))
     throw Error('Named family principal does not match approved surname');
   }
   if(kind==='STABLE')activePerson(trainerId,'trainer',event.year);
   if(['FARM','TRAINING_CENTER'].includes(kind)){
    if(!Array.isArray(managerIds)||new Set(managerIds).size!==managerIds.length)
     throw Error('Approved organization has invalid manager list');
    for(const id of managerIds)activePerson(id,'farm_manager',event.year);
   }
   const next={
    id:candidate.id,name:candidate.name,originalName:candidate.name,kind,
    archetype:kind==='OWNER'?registration.ownershipArchetype:null,
    familyName:kind==='OWNER'?registration.familyName??null:null,
    principalId,trainerId,managerIds:managerIds?[...managerIds]:[],
    location:clone(registration.location),
    namingRegion:registration.namingRegion,
    ...(registration.facilityKind?{facilityKind:registration.facilityKind}:{}),
    status:'ACTIVE',foundedInRegistryYear:event.year,revision:0
   };
   addedOrganization=true;
   commit=()=>{
    firms.set(candidate.id,next);
    organizationNameKeys.add(key(candidate.name));
   };
  }else if(event.type==='REGISTER_DOCUMENTED_FAMILY_LINK'){
   const a=event.personAId,b=event.personBId;
   if(!people.has(a)||!people.has(b)||a===b||
    !KINSHIP.has(event.relationshipKind))
    throw Error('Explicit documented family link needs known people');
   const pair=[a,b].sort().join('|');
   if(familyPairs.has(pair))throw Error('Family relationship already recorded');
   if(!replaying&&(!familyLinkLookup||
    familyLinkLookup({personAId:a,personBId:b,kind:event.relationshipKind,
     sourceId:event.sourceId})!==true))
    throw Error('Family relationship has not been approved by family history');
   commit=()=>familyPairs.add(pair);
  }else if(event.type==='RETIRE_PERSON'){
   if(!person||person.retired)throw Error('Cannot retire an unknown or retired person');
   if(hasDuties(person.id))
    throw Error('Transfer all active organization responsibilities before retirement');
   commit=()=>people.set(person.id,{...person,retired:true});
  }else{
   if(!op)throw Error('Unknown organization ID; V16 never invents businesses');
   if(op.status==='CLOSED'&&event.type!=='REOPEN_ORGANIZATION')
    throw Error('A closed operation cannot change leadership or premises');
   const next={...op,revision:op.revision+1};
   switch(event.type){
    case 'CHANGE_OWNER_PRINCIPAL':
     if(op.kind!=='OWNER')throw Error('Only an ownership business has a principal');
     if(op.archetype==='INDIVIDUAL_OWNER')
      throw Error('A sole person is not a transferable business identity');
     activePerson(event.toPersonId,null,event.year);
     if(op.principalId===event.toPersonId)
      throw Error('Existing owner principal is unchanged');
     if(op.archetype==='FAMILY_OPERATION'&&
      !familyPairs.has([op.principalId,event.toPersonId].sort().join('|')))
      throw Error('Family succession requires an explicit family relationship');
     next.principalId=event.toPersonId;
     break;
    case 'CHANGE_STABLE_TRAINER':
     if(op.kind!=='STABLE')throw Error('Only a racing stable can change trainers');
     activePerson(event.toPersonId,'trainer',event.year);
     if(op.trainerId===event.toPersonId)
      throw Error('Existing stable trainer is unchanged');
     next.trainerId=event.toPersonId;
     break;
    case 'REPLACE_FARM_MANAGERS':
    case 'REPLACE_CENTER_MANAGERS':{
     const category=event.type==='REPLACE_FARM_MANAGERS'?'FARM':'TRAINING_CENTER';
     if(op.kind!==category)throw Error('Wrong facility type for manager transition');
     if(!Array.isArray(event.toPersonIds)||
      new Set(event.toPersonIds).size!==event.toPersonIds.length)
      throw Error('Manager list must contain unique explicit people');
     for(const id of event.toPersonIds)activePerson(id,'farm_manager',event.year);
     next.managerIds=[...event.toPersonIds];
     break;
    }
    case 'RELOCATE_ORGANIZATION':
     next.location=validateLocation(event.location);
     checkId(event.namingRegion,'new organization naming-region ID');
     next.namingRegion=event.namingRegion;
     break;
    case 'CLOSE_ORGANIZATION':
     next.status='CLOSED';
     break;
    case 'REOPEN_ORGANIZATION':
     if(op.status!=='CLOSED')throw Error('Only closed operations can reopen');
     for(const id of [op.principalId,op.trainerId,...op.managerIds].filter(Boolean))
      activePerson(id,null,event.year);
     next.status='ACTIVE';
     break;
   }
   commit=()=>firms.set(op.id,next);
  }
  if(dryRun)return Object.freeze({
   model:FICTIONAL_ORGANIZATION_CONTINUITY_MODEL,
   worldId:seed.worldId,revision:revision+1,year:event.year,
   organizationCount:firms.size+(addedOrganization?1:0),
   knownPeople:people.size+(addedPerson?1:0),
   eventCount:events.length+1
  });
  commit();
  events.push(recorded);eventIds.add(event.eventId);
  const historyFirmId=event.organizationId??(
   event.type==='REGISTER_APPROVED_ORGANIZATION'?event.organization?.id:null);
  if(historyFirmId){
   if(!byFirm.has(historyFirmId))byFirm.set(historyFirmId,[]);
   byFirm.get(historyFirmId).push(recorded);
  }
  revision++;year=event.year;
  return cursor();
 }
 if(snapshot){
  replaying=true;
  for(const recorded of snapshot.events){
   const event={...recorded};
   delete event.revision;
   if(apply({expectedRevision:revision,event}).revision!==recorded.revision)
    throw Error('Continuity event replay revision mismatch');
  }
  replaying=false;
 }
 function getOrganization(id,{withHistory=false}={}){
  const op=firms.get(id);
  return op?immutable({...op,...(withHistory?{history:byFirm.get(id)??[]}:{})}):null;
 }
 function getPerson(id){return people.has(id)?immutable(people.get(id)):null}
 function getHistory(id){
  if(!firms.has(id))throw Error('Unknown organization history');
  return immutable(byFirm.get(id)??[]);
 }
 function listOrganizations({kind=null,status=null,offset=0,limit=50}={}){
  if(kind!==null&&!OPERATIONS.has(kind))throw Error('Invalid operation type');
  if(status!==null&&!['ACTIVE','CLOSED'].includes(status))
   throw Error('Invalid operation status');
  if(!Number.isSafeInteger(offset)||offset<0||
   !Number.isInteger(limit)||limit<1||limit>1000)
   throw Error('Invalid continuity directory page');
  const list=[];let skipped=0;
  for(const op of firms.values()){
   if(kind!==null&&op.kind!==kind)continue;
   if(status!==null&&op.status!==status)continue;
   if(skipped++<offset)continue;
   list.push(immutable(op));if(list.length>=limit)break;
  }
  return Object.freeze(list);
 }
 function exportSnapshot(){
  return sealFictionalOrganizationContinuitySnapshot({
   original:seed.original,events
  });
 }
 return Object.freeze({
  model:FICTIONAL_ORGANIZATION_CONTINUITY_MODEL,
  worldId:seed.worldId,
  get revision(){return revision},
  get year(){return year},
  get organizationCount(){return firms.size},
  get eventCount(){return events.length},
  get cursor(){return cursor()},
  apply,
  preview:({expectedRevision,event}={})=>apply({expectedRevision,event,dryRun:true}),
  getOrganization,getPerson,getHistory,listOrganizations,exportSnapshot
 });
}
