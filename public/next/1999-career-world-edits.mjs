/**
 * Career-owned, immutable-ID customization overlay over ONE hydrated fictional
 * industry. Base generated records stay untouched on disk. The save transaction
 * stores edits alongside the authoritative canonical run, not in localStorage.
 */
export const CAREER_WORLD_EDITS_SCHEMA='WTW_CAREER_WORLD_EDITS_V1';
const KINDS=Object.freeze({horse:'horses',person:'people',
 organization:'organizations',track:'tracks'});
const FIELD_LIMITS=Object.freeze({
 horse:{name:36,biography:800,ownerId:120,trainerId:120,homeTrackId:120},
 person:{name:90,biography:800},
 organization:{name:100,biography:800},
 track:{name:90,biography:800}
});
export function careerWorldEntity(world,kind,id){
 const bucket=KINDS[kind];
 if(!bucket||typeof id!=='string'||!id)return null;
 return (world?.entities?.[bucket]||[]).find(e=>e.id===id)||null;
}
function validateSingle(world,kind,id,patch,{run=null}={}){
 const entity=careerWorldEntity(world,kind,id);
 if(!entity)throw Error('Unknown '+kind+' immutable ID');
 if(!patch||typeof patch!=='object'||Array.isArray(patch)||!Object.keys(patch).length)
  throw Error('No changes to save');
 const allowed=FIELD_LIMITS[kind];
 for(const [key,value] of Object.entries(patch)){
  if(!Object.hasOwn(allowed,key)||typeof value!=='string'||value.length>allowed[key])
   throw Error('Unsupported '+kind+' editable field: '+key);
  if(key==='name'&&(!value.trim()||/[\x00-\x1F\x7F]/.test(value)))
   throw Error('Name must be visible text');
  if(key==='name'&&value.trim().toLocaleLowerCase('en-US')!==
      entity.name.toLocaleLowerCase('en-US')&&
      world.entities[{horse:'horses',person:'people',organization:'organizations',track:'tracks'}[kind]]
       .some(other=>other.id!==id&&String(other.name||'').toLocaleLowerCase('en-US')===
        value.trim().toLocaleLowerCase('en-US')))
   throw Error('Another '+kind+' already has that name');
  if(key==='biography'&&/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(value))
   throw Error('Biography contains invalid characters');
  if(['ownerId','trainerId','homeTrackId'].includes(key)){
   const records=key==='ownerId'?world.entities.organizations:
    key==='trainerId'?world.entities.people:world.entities.tracks;
   const target=records.find(x=>x.id===value);
   if(!target)throw Error('Unknown '+key+' relationship ID');
   if(key==='trainerId'&&target.role!=='trainer')throw Error('Trainer ID is not a trainer');
   // Physical relocation, ownership transfer and staff contracts require
   // the actual racing/economic game commands for active player runners.
   if(run?.stable_horse_ids?.some(rid=>
      run.runtime?.registered_horses?.by_id?.[rid]?.world_source_horse_id===id))
    throw Error('Active stable relationships must change through gameplay commands');
  }
 }
 return entity;
}
export function validateCareerWorldEdit(world,kind,id,patch,options={}){
 validateSingle(world,kind,id,patch,options);
 return Object.fromEntries(Object.entries(patch).map(([key,value])=>
  [key,key==='name'?value.trim():value]));
}
export function applyCareerWorldEdits(world,edits,{run=null}={}){
 if(edits==null)return {applied:0};
 if(edits.schema!==CAREER_WORLD_EDITS_SCHEMA||!edits.byId||
  typeof edits.byId!=='object'||Array.isArray(edits.byId))
  throw Error('Incompatible saved career customization schema');
 let applied=0;
 for(const [ref,patch] of Object.entries(edits.byId)){
  const separator=ref.indexOf(':');
  if(separator<1)throw Error('Malformed world edit record');
  const kind=ref.slice(0,separator),id=ref.slice(separator+1);
  const entity=validateSingle(world,kind,id,patch,{run});
  Object.assign(entity,patch);
  if(kind==='horse'&&'name'in patch&&run?.runtime?.registered_horses?.by_id){
   for(const h of Object.values(run.runtime.registered_horses.by_id)){
    if(h.world_source_horse_id===id){
     h.name=patch.name;h.registered_name=patch.name;
    }
   }
  }
  applied++;
 }
 return {applied};
}
export function createCareerWorldEdits(){return {schema:CAREER_WORLD_EDITS_SCHEMA,byId:{}}}
export function addCareerWorldEdit(edits,world,kind,id,patch,{run=null}={}){
 const clean=validateCareerWorldEdit(world,kind,id,patch,{run});
 const current=edits==null?createCareerWorldEdits():edits;
 if(current.schema!==CAREER_WORLD_EDITS_SCHEMA||!current.byId)
  throw Error('Incompatible saved career customization schema');
 const ref=kind+':'+id;
 const next={schema:CAREER_WORLD_EDITS_SCHEMA,byId:{
  ...current.byId,[ref]:{...(current.byId[ref]||{}),...clean}
 }};
 // Fail before writing if the merged record is invalid.
 validateSingle(world,kind,id,next.byId[ref],{run});
 return next;
}
