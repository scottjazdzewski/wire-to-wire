import {APPROVED_1999_WORLD_RELEASE as bundledRelease}
 from './approved-1999-world-release-data.mjs';

export const APPROVED_1999_WORLD_RELEASE_SCHEMA='WTW_1999_APPROVED_WORLD_RELEASE_V1';
export const ORIGINAL_1999_WORLD_ID=
 'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H300000';
const ALLOWED_KINDS=new Set(['horse','person','organization','track']);
const NAME_LIMIT=Object.freeze({horse:36,person:90,organization:100,track:90});
const indexCache=new WeakMap();

export function validateApproved1999WorldRelease(release=bundledRelease){
 if(!release||release.schema!==APPROVED_1999_WORLD_RELEASE_SCHEMA||
   release.sourceWorldId!==ORIGINAL_1999_WORLD_ID||
   release.sourceSeed!==19990101||!Array.isArray(release.records)||
   (release.records.length>0&&!/^R[0-9a-f]{12}$/.test(release.revision))||
   (release.records.length===0&&release.revision!=='BASE')||
   (release.records.length>0&&!/^[a-f0-9]{64}$/i.test(release.sourceSnapshotSha256||'')))
  throw Error('Invalid approved 1999 world release identity or source fingerprint');
 const seen=new Set(),names=new Map();
 for(const record of release.records){
  const {kind,id,fields}=record||{};
  if(!ALLOWED_KINDS.has(kind)||typeof id!=='string'||!id||
    !fields||typeof fields!=='object'||Array.isArray(fields)||
    !Object.keys(fields).length||seen.has(kind+':'+id))
   throw Error('Malformed or duplicated approved starting-world entity ID');
  seen.add(kind+':'+id);
  for(const [key,value] of Object.entries(fields)){
   if(!['name','biography'].includes(key)||typeof value!=='string'||
      value.length>(key==='name'?NAME_LIMIT[kind]:800)||
      (key==='name'&&!value.trim())||/[\x00-\x1f\x7f]/.test(value))
    throw Error('Unsafe or unapproved starting-world field '+key+' on '+id);
   if(key==='name'){
    const normalized=value.trim().toLocaleLowerCase('en-US');
    const prior=names.get(kind+':'+normalized);
    if(prior&&prior!==id)throw Error('Duplicate promoted '+kind+' name: '+value);
    names.set(kind+':'+normalized,id);
   }
  }
 }
 return release;
}

export function new1999WorldIdForApprovedRelease(
 {seed,horseCount,release=bundledRelease}={}){
 const base='WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H'+horseCount;
 validateApproved1999WorldRelease(release);
 return seed===release.sourceSeed&&horseCount===300000&&release.records.length?
  base+'-RELEASE-'+release.revision:base;
}

export function releaseFor1999World({seed,horseCount,worldId,release=bundledRelease}={}){
 const expected=new1999WorldIdForApprovedRelease({seed,horseCount,release});
 if(release.records.length&&expected===worldId&&worldId!==release.sourceWorldId)
  return release;
 return null;
}

function indexedRelease(release){
 if(!indexCache.has(release)){
  validateApproved1999WorldRelease(release);
  indexCache.set(release,new Map(release.records.map(e=>[e.kind+':'+e.id,e.fields])));
 }
 return indexCache.get(release);
}

/** Used at industry GENESIS, before the official entity batches are persisted. */
export function applyApproved1999ReleaseRecord(record,kind,release=bundledRelease){
 if(!record?.id||!ALLOWED_KINDS.has(kind))throw Error('Invalid 1999 entity promotion input');
 if(!release)return record;
 const fields=indexedRelease(release).get(kind+':'+record.id);
 return fields?{...record,...fields}:record;
}

export function assertApproved1999ReleaseReferences({
 release=bundledRelease,foundIds=new Set()
}={}){
 if(!release)return {count:0};
 const missing=release.records.filter(row=>!foundIds.has(row.kind+':'+row.id));
 if(missing.length)throw Error('Approved starting-world IDs absent from the actual generated universe: '+
  missing.slice(0,8).map(x=>x.kind+':'+x.id).join(', '));
 return {count:release.records.length};
}

export {bundledRelease as APPROVED_1999_WORLD_RELEASE};
