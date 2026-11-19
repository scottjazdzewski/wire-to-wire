/**
 * Explicit NEW-world owner-principal personnel materialization.
 * Turns source-naming principals into real P-FICTIONAL person IDs that
 * are stored in the SAME industry personBatches as other people.
 *
 * Does not touch an existing V10 industry or invent a syndicate partner.
 */
import {FICTIONAL_BIRTHPLACES,INDUSTRY_PERSON_BIOGRAPHY_REVISION}
 from './fictional-industry-staffing-1999.mjs';
import {PERSONNEL_NAME_MODEL} from './personnel-name-engine.mjs';

export const OWNER_PRINCIPAL_PERSONNEL_1999_MODEL=
 'WTW_1999_OWNER_PRINCIPALS_PERSISTED_V13';
export const ownerPrincipalPersonId=index=>
 'P-FICTIONAL-1999-OWNER-PRINCIPAL-'+String(index+1).padStart(7,'0');

function hash(seed,s){let h=(2166136261^(seed>>>0))>>>0;
 for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
 return h>>>0;
}
const norm=name=>String(name||'').normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');

export function materialize1999OwnerPrincipalPeople({
 seed,owners,sourceOwners,sourcePeople
}={}){
 if(!Number.isSafeInteger(seed)||seed<1||!Array.isArray(owners)||
  !Array.isArray(sourceOwners)||!Array.isArray(sourcePeople)||
  !owners.length||owners.length!==sourceOwners.length||owners.length>29000)
  throw Error('Invalid versioned owner principal personnel directory');
 const byId=new Map();
 for(const p of sourcePeople){
  if(p?.role!=='owner')continue;
  if(!p.id||byId.has(p.id))throw Error('Duplicate source owner principal ID');
  byId.set(p.id,p);
 }
 if(byId.size!==owners.length)
  throw Error('Every generated owner requires exactly one source principal');
 const seenIds=new Set(),seenOrgIds=new Set();
 return Object.freeze(owners.map((owner,i)=>{
  const sourceOwner=sourceOwners[i];
  const source=byId.get(sourceOwner?.principalId);
  if(!source||source.name!==sourceOwner.principalName||
   !owner?.id||!owner.name||!owner.location?.city||
   !owner.location?.region||!owner.location?.country||
   seenOrgIds.has(owner.id)||!source.location||
   source.location.region!==owner.location.region||
   source.location.city!==owner.location.city)
   throw Error('Owner principal has no real reciprocal destination: '+String(owner?.id));
  const personId=ownerPrincipalPersonId(i);
  if(seenIds.has(personId))throw Error('Duplicate immutable owner principal ID');
  seenIds.add(personId);seenOrgIds.add(owner.id);
  const birthPlaces=FICTIONAL_BIRTHPLACES[source.birthCountry];
  if(!birthPlaces?.length||!Number.isInteger(source.birthYear)||
   source.birthYear<1890||source.birthYear>1998)
   throw Error('Unsupported owner principal birth origin');
  const month=1+hash(seed,personId+':birthMonth')%12;
  const day=1+hash(seed,personId+':birthDay')%28;
  const [city,region]=birthPlaces[hash(seed,personId+':birthplace')%birthPlaces.length];
  const dateOfBirth=String(source.birthYear)+'-'+String(month).padStart(2,'0')+
   '-'+String(day).padStart(2,'0');
  return Object.freeze({
   id:personId,role:'owner_principal',
   name:source.name,primarySurname:source.primarySurname,
   organizationId:owner.id,workplaceId:owner.id,
   sourcePrincipalId:source.id,
   principalRelationship:sourceOwner.principalRelationship,
   sourceOrganizationId:sourceOwner.id,
   nameModel:PERSONNEL_NAME_MODEL,
   personnelModel:OWNER_PRINCIPAL_PERSONNEL_1999_MODEL,
   namingStatus:'GENERATED_1999_OWNER_PRINCIPAL',
   dateOfBirth,birthYear:source.birthYear,
   ageAtOpening:1999-source.birthYear-(month>1||month===1&&day>1?1:0),
   birthplace:{city,region,countryCode:source.birthCountry,
    provenance:'MODELED_FICTIONAL_1999'},
   birthCountryCode:source.birthCountry,nationalityCode:source.birthCountry,
   biographyRevision:INDUSTRY_PERSON_BIOGRAPHY_REVISION,
   homeRegion:owner.location.region,
   source:'FICTIONAL_1999_OWNER_PRINCIPAL'
  });
 }));
}

export function validate1999OwnerPrincipalLinks(owners,principals){
 if(!Array.isArray(owners)||!Array.isArray(principals))return false;
 const personById=new Map(principals.map(p=>[p.id,p]));
 if(personById.size!==principals.length)return false;
 const relevant=owners.filter(o=>o.destinationNamingModel&&o.principalId);
 if(relevant.length!==principals.length)return false;
 return relevant.every(o=>{
  const p=personById.get(o.principalId);
  return p?.organizationId===o.id&&p?.workplaceId===o.id&&
   p?.name===o.principalName&&p?.homeRegion===o.location?.region&&
   norm(p.name)===norm(o.principalName)&&
   p?.personnelModel===OWNER_PRINCIPAL_PERSONNEL_1999_MODEL;
 });
}
