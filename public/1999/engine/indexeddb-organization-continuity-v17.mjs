/**
 * WTW V17 independent IndexedDB adapter for fictional organization changes.
 *
 * Does not share career Save/Load, canonical history, or V12 naming DB.
 * Each revision is one atomic IndexedDB transaction touching:
 *   worlds (current compact cursor), events (immutable append-only journal)
 *   and eventIds (unique normalized event IDs).
 */
export const INDEXEDDB_ORGANIZATION_CONTINUITY_DB='WireToWireFictionalContinuityV17';
export const INDEXEDDB_ORGANIZATION_CONTINUITY_MODEL='WTW_INDEXEDDB_CONTINUITY_V17';
const DB_VERSION=1;
const ref=(worldId,item)=>worldId+'|'+item;
const get=request=>new Promise((resolve,reject)=>{
 request.onsuccess=()=>resolve(request.result);
 request.onerror=()=>reject(request.error||Error('IndexedDB continuity request failed'));
});
const complete=tx=>new Promise((resolve,reject)=>{
 tx.oncomplete=()=>resolve();
 tx.onabort=()=>reject(tx.error||Error('Continuity transaction rolled back'));
 tx.onerror=()=>reject(tx.error||Error('Continuity transaction failed'));
});
const validMeta=meta=>meta&&typeof meta.worldId==='string'&&
 typeof meta.model==='string'&&Number.isInteger(meta.revision)&&meta.revision>=0&&
 meta.cursor?.revision===meta.revision&&meta.cursor?.worldId===meta.worldId&&
 meta.original?.worldId===meta.worldId;
const validateEvent=(event,expectedRevision,cursor,worldId)=>{
 if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0||
  !event||typeof event.eventId!=='string'||!event.eventId.trim()||
  event.revision!==expectedRevision+1||cursor?.revision!==event.revision||
  cursor.worldId!==worldId||cursor.eventCount!==cursor.revision)
  throw Error('Invalid revision-guarded continuity event');
};
export function createIndexedDBOrganizationContinuityStore({
 indexedDBFactory=globalThis.indexedDB,
 databaseName=INDEXEDDB_ORGANIZATION_CONTINUITY_DB
}={}){
 if(!indexedDBFactory||typeof indexedDBFactory.open!=='function')
  throw Error('IndexedDB unavailable for organizational continuity');
 if(typeof databaseName!=='string'||!databaseName)
  throw Error('Invalid continuity database name');
 let pending=null;
 const database=async()=>{
  if(pending)return pending;
  pending=new Promise((resolve,reject)=>{
   const request=indexedDBFactory.open(databaseName,DB_VERSION);
   request.onupgradeneeded=()=>{
    const db=request.result;
    if(!db.objectStoreNames.contains('worlds'))
     db.createObjectStore('worlds',{keyPath:'id'});
    if(!db.objectStoreNames.contains('events')){
     const events=db.createObjectStore('events',{keyPath:'id'});
     events.createIndex('byWorld','worldId',{unique:false});
    }
    if(!db.objectStoreNames.contains('eventIds'))
     db.createObjectStore('eventIds',{keyPath:'id'});
   };
   request.onerror=()=>reject(request.error||Error('Continuity database open failed'));
   request.onblocked=()=>reject(Error('Continuity database upgrade blocked'));
   request.onsuccess=()=>{
    const db=request.result;
    db.onversionchange=()=>db.close();
    resolve(db);
   };
  }).catch(e=>{pending=null;throw e});
  return pending;
 };
 async function read({worldId}={}){
  if(!worldId)throw Error('Continuity world ID required');
  const db=await database(),tx=db.transaction(['worlds','events'],'readonly');
  const done=complete(tx);
  const [meta,rows]=await Promise.all([
   get(tx.objectStore('worlds').get(worldId)),
   get(tx.objectStore('events').index('byWorld').getAll(worldId))
  ]);
  await done;
  if(!meta)return null;
  return {meta,events:rows.map(r=>r.event).sort((a,b)=>a.revision-b.revision)};
 }
 async function initialize(meta){
  if(!validMeta(meta)||meta.revision!==0)
   throw Error('Invalid initial organization continuity foundation');
  const db=await database(),tx=db.transaction('worlds','readwrite');
  const done=complete(tx);
  tx.objectStore('worlds').add({...meta,id:meta.worldId});
  await done;
 }
 async function append({worldId,expectedRevision,event,cursor}={}){
  validateEvent(event,expectedRevision,cursor,worldId);
  const db=await database(),
   tx=db.transaction(['worlds','events','eventIds'],'readwrite'),
   done=complete(tx);
  let failed=null;
  tx.objectStore('worlds').get(worldId).onsuccess=e=>{
   try{
    const current=e.target.result;
    if(!current||current.revision!==expectedRevision)
     throw Error('Stale persisted organizational continuity revision');
    // Event ID cannot be reused even if the user changes a revision/year.
    tx.objectStore('eventIds').add({
     id:ref(worldId,event.eventId),worldId,eventId:event.eventId
    });
    tx.objectStore('events').add({
     id:ref(worldId,String(event.revision).padStart(10,'0')),
     worldId,revision:event.revision,event
    });
    tx.objectStore('worlds').put({...current,revision:cursor.revision,cursor});
   }catch(e){failed=e;tx.abort()}
  };
  try{await done}catch(error){throw failed||error}
 }
 async function restore({meta,events}={}){
  if(!validMeta(meta)||!Array.isArray(events)||
   meta.revision!==events.length)
   throw Error('Invalid continuity archive foundation or journal');
  let year=meta.original.foundingYear;
  const eventIds=new Set();
  for(let i=0;i<events.length;i++){
   const row=events[i];
   if(row.revision!==i+1||eventIds.has(row.eventId)||
    !Number.isInteger(row.year)||row.year<year)
    throw Error('Corrupt continuity journal order or repeated event ID');
   eventIds.add(row.eventId);year=row.year;
  }
  const db=await database(),
   tx=db.transaction(['worlds','events','eventIds'],'readwrite'),
   done=complete(tx);
  try {
   // add (never put) refuses an implicit overwrite in the same DB.
   tx.objectStore('worlds').add({...meta,id:meta.worldId});
   for(const row of events){
    tx.objectStore('eventIds').add({
     id:ref(meta.worldId,row.eventId),
     worldId:meta.worldId,eventId:row.eventId
    });
    tx.objectStore('events').add({
     id:ref(meta.worldId,String(row.revision).padStart(10,'0')),
     worldId:meta.worldId,revision:row.revision,event:row
    });
   }
  }catch(error){tx.abort();await done.catch(()=>{});throw error}
  await done;
 }
 return Object.freeze({
  model:INDEXEDDB_ORGANIZATION_CONTINUITY_MODEL,
  read,initialize,append,restore,
  async close(){if(pending){(await pending).close();pending=null}}
 });
}
