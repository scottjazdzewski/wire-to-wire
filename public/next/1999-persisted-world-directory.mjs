/**
 * Bounded, read-only directory of the EXISTING persisted fictional industry.
 * This consumes the exact saved world hydrated by the canonical game bridge.
 * It never generates extra horses, invents finances, or changes immutable IDs.
 */
export const PERSISTED_INDUSTRY_DIRECTORY_SCHEMA='WTW_PERSISTED_INDUSTRY_DIRECTORY_V1';

export function createPersistedIndustryHorseDirectory({world,manifest,year=1999}={}){
 const horses=world?.entities?.horses;
 if(!Array.isArray(horses)||!manifest?.worldId||!Number.isSafeInteger(year)||
    horses.length!==manifest.horseCount)
  throw Error('Full industry horse directory requires the exact saved world census');
 const org=new Map((world.entities.organizations||[]).map(x=>[x.id,x.name]));
 const people=new Map((world.entities.people||[]).map(x=>[x.id,x.name]));
 const tracks=new Map((world.entities.tracks||[]).map(x=>[x.id,x.name]));
 const ids=new Map();
 for(const horse of horses){
  if(!horse?.id||!horse.name||ids.has(horse.id))
   throw Error('Saved industry has missing or duplicate horse identity');
  ids.set(horse.id,horse);
 }
 const text=x=>String(x??'').trim().toLocaleLowerCase('en-US');
 const label=(lookup,id)=>lookup.get(id)||id||'';
 const age=h=>Number.isSafeInteger(h.foalYear)?year-h.foalYear:null;
 const field=(h,key)=>{
  switch(key){
   case 'name':return h.name;
   case 'age':return age(h);
   case 'sex':return h.sex;
   case 'status':return h.status;
   case 'registryGroup':return h.cohort;
   case 'sire':return h.sireId;
   case 'dam':return h.damId;
   case 'owner':return label(org,h.ownerId);
   case 'breeder':return label(org,h.foalingFarmId);
   case 'trainer':return label(people,h.trainerId);
   case 'track':return label(tracks,h.homeTrackId);
   case 'homebred':return h.ownerId&&h.ownerId===h.foalingFarmId?'YES':'NO';
   default:return '';
  }
 };
 const row=h=>({
  _kind:'horse',_name:h.name,_id:h.id,_canonId:h.id,
  _savedWorldId:manifest.worldId,
  name:h.name,biography:h.biography||'',reviewNotes:h.reviewNotes||'',
  age:age(h),sex:h.sex||'',status:h.status||'',
  registryGroup:h.cohort||'',sire:h.sireId||'',dam:h.damId||'',
  owner:label(org,h.ownerId),breeder:label(org,h.foalingFarmId),
  trainer:label(people,h.trainerId),track:label(tracks,h.homeTrackId),
  homebred:field(h,'homebred'),ca:null,pa:null,
  ownerId:h.ownerId||'',foalingFarmId:h.foalingFarmId||'',
  trainerId:h.trainerId||'',homeTrackId:h.homeTrackId||'',
  careFacilityId:h.careFacilityId||'',trainingBarnId:h.trainingBarnId||'',
  managementOrganizationId:h.managementOrganizationId||'',
  sourceHorseId:h.id
 });
 let cachedKey='',cachedRows=null;
 function browse({offset=0,limit=160,search='',sort='name',desc=false,filters={}}={}){
  const where=filters&&typeof filters==='object'?filters:{};
  const key=JSON.stringify([String(search),String(sort),Boolean(desc),where]);
  if(cachedRows===null||cachedKey!==key){
   const needle=text(search),fieldNeedle=text(where.query);
   const min=where.ageMin==null||where.ageMin===''?null:Number(where.ageMin);
   const max=where.ageMax==null||where.ageMax===''?null:Number(where.ageMax);
   const status=text(where.status),sex=text(where.sex);
   // Permanent IDs, never name similarity: owner, trainer, farm and base are
   // DIFFERENT links. Employment alone does not imply barn residency.
   const relations=['ownerId','trainerId','foalingFarmId','careFacilityId','trainingBarnId','managementOrganizationId','homeTrackId'];
   const matched=relations.filter(key=>where[key]!=null&&where[key]!=='');
   cachedRows=horses.filter(h=>{
    if(matched.some(key=>String(h[key]||'')!==String(where[key])))return false;
    const a=age(h);
    if(min!==null&&Number.isFinite(min)&&(a===null||a<min))return false;
    if(max!==null&&Number.isFinite(max)&&(a===null||a>max))return false;
    if(sex&&text(h.sex)!==sex)return false;
    if(status&&!text(h.status).includes(status))return false;
    if(fieldNeedle&&where.field&&!text(field(h,String(where.field))).includes(fieldNeedle))
     return false;
    if(!needle)return true;
    return ['name','sire','dam','owner','breeder','trainer','track','status','registryGroup']
     .some(k=>text(field(h,k)).includes(needle))||text(h.id).includes(needle);
   });
   const allowed=new Set(['name','age','sex','status','registryGroup','sire','dam','owner',
    'breeder','trainer','track','homebred']);
   const column=allowed.has(sort)?sort:'name';
   cachedRows.sort((a,b)=>{
    const av=field(a,column),bv=field(b,column);
    const aMissing=av==null||av==='',bMissing=bv==null||bv==='';
    if(aMissing!==bMissing)return aMissing?1:-1;
    const cmp=column==='age'?Number(av)-Number(bv):
     String(av??'').localeCompare(String(bv??''),undefined,{numeric:true,sensitivity:'base'});
    return (desc?-cmp:cmp)||String(a.id).localeCompare(String(b.id));
   });
   cachedKey=key;
  }
  const start=Math.max(0,Math.trunc(Number(offset)||0));
  const size=Math.min(3000,Math.max(1,Math.trunc(Number(limit)||160)));
  return {indexing:false,total:cachedRows.length,loaded:horses.length,
   progress:horses.length,items:cachedRows.slice(start,start+size).map(row)};
 }
 return Object.freeze({schema:PERSISTED_INDUSTRY_DIRECTORY_SCHEMA,
  size:horses.length,browse,byId:id=>ids.has(id)?row(ids.get(id)):null,
  invalidate:()=>{cachedKey='';cachedRows=null}});
}

/**
 * Native World directories for all other saved entities. The old approved
 * 73-source-horse catalogue is historical context, never the active census.
 */
export function createPersistedIndustryEntityDirectory({world,manifest,kind}={}){
 const mapping={person:'people',organization:'organizations',track:'tracks'};
 const bucket=mapping[kind];
 if(!bucket||!manifest?.worldId||!Array.isArray(world?.entities?.[bucket]))
  throw Error('Unknown or incomplete saved World directory');
 const records=world.entities[bucket],ids=new Map();
 for(const item of records){
  if(!item?.id||!item.name||ids.has(item.id))
   throw Error('Incomplete or duplicated '+kind+' identity');
  ids.set(item.id,item);
 }
 const tracks=new Map((world.entities.tracks||[]).map(e=>[e.id,e.name]));
 const organizations=new Map((world.entities.organizations||[]).map(e=>[e.id,e.name]));
 const place=p=>typeof p==='string'?p:p&&typeof p==='object'?
  [p.city||p.locality,p.region||p.state,p.country].filter(Boolean).join(', '):'';
 const project=item=>{
  const base={_savedWorldId:manifest.worldId,_savedKind:kind,
   _kind:kind==='organization'?'farm':kind,_name:item.name,
   _id:item.id,_canonId:item.id,sourceEntityId:item.id,name:item.name,
   biography:item.biography||'',reviewNotes:item.reviewNotes||''};
  if(kind==='person')return {...base,role:item.role||'',
   base:item.base||tracks.get(item.workplaceId)||organizations.get(item.workplaceId)||
    item.workplaceId||place(item.birthplace)||'',
   operation:organizations.get(item.operatingOrganizationId)||
    item.operatingOrganizationId||''};
  if(kind==='organization')return {...base,type:item.type||item.category||'',
   location:place(item.location),principal:item.principalOwner||'',
   status:item.status||''};
  return {...base,location:place(item.location),
   surfaces:Array.isArray(item.surfaces)?item.surfaces.join(' / '):
    item.surfaces||'',circuit:item.circuit||'',meetWindow:item.meetWindow||'',
   status:item.status||'',raceDays:item.raceDays??'',stakesCount:item.stakesCount??''};
 };
 let cachedKey='',cache=null;
 const browse=({offset=0,limit=160,search='',sort='name',desc=false,filters={}}={})=>{
  const where=filters&&typeof filters==='object'?filters:{};
  const key=JSON.stringify([String(search),String(sort),Boolean(desc),where]);
  if(cachedKey!==key||cache===null){
   const text=v=>String(v??'').toLowerCase();
   const q=text(search).trim(),fq=text(where.query).trim();
   cache=records.map(project).filter(e=>(!q||Object.values(e).some(v=>
    (typeof v==='string'||typeof v==='number')&&text(v).includes(q)))&&
    (!fq||!where.field||text(e[where.field]).includes(fq)));
   const sortBy=['name','role','base','operation','type','location','status',
    'surfaces','circuit','meetWindow','raceDays','stakesCount'].includes(sort)?sort:'name';
   cache.sort((a,b)=>{
    const aa=a[sortBy],bb=b[sortBy],am=aa==null||aa==='',bm=bb==null||bb==='';
    if(am!==bm)return am?1:-1;
    const cmp=typeof aa==='number'&&typeof bb==='number'?aa-bb:
     String(aa??'').localeCompare(String(bb??''),undefined,
      {numeric:true,sensitivity:'base'});
    return (desc?-cmp:cmp)||a._id.localeCompare(b._id);
   });
   cachedKey=key;
  }
  const start=Math.max(0,Math.trunc(Number(offset)||0));
  const size=Math.max(1,Math.min(3000,Math.trunc(Number(limit)||160)));
  return {indexing:false,total:cache.length,loaded:records.length,
   progress:records.length,items:cache.slice(start,start+size)};
 };
 return Object.freeze({size:records.length,browse,byId:id=>ids.has(id)?project(ids.get(id)):null,
  invalidate:()=>{cache=null;cachedKey=''}});
}
