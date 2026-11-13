/**
 * WTW V12 local-first naming storage adapter.
 *
 * This is an isolated IndexedDB database for FICTIONAL naming capabilities,
 * not Canon Desk D1 and not the production January 1999 career Save/Load DB.
 * Only explicit calls open or write it.
 *
 * Every newly issued batch is appended once, in a single transaction with
 * revision cursor, normalized unique-name keys and stable entity IDs.
 * Previously issued names are NEVER rewritten on subsequent batch requests.
 */
export const INDEXEDDB_FICTIONAL_NAMING_MODEL='WTW_IDB_FICTIONAL_NAMING_V12';
export const INDEXEDDB_FICTIONAL_NAMING_DB='WireToWireFictionalNamesV12';
const VERSION=1;
const worldKey=(worldId,seed)=>worldId+':'+seed;
const normalize=name=>String(name??'').normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');
const req=(request)=>new Promise((resolve,reject)=>{
 request.onsuccess=()=>resolve(request.result);
 request.onerror=()=>reject(request.error||Error('IndexedDB request failed'));
});
const idFor=(worldKey,child)=>worldKey+'|'+child;
function transactionDone(tx){
 return new Promise((resolve,reject)=>{
  tx.oncomplete=()=>resolve();
  tx.onabort=()=>reject(tx.error||Error('Naming transaction was rolled back'));
  tx.onerror=()=>reject(tx.error||Error('Naming transaction failed'));
 });
}
function checkMeta(meta){
 if(!meta||typeof meta.worldId!=='string'||
  !Number.isInteger(meta.seed)||!Array.isArray(meta.protectedPeople)||
  !Array.isArray(meta.protectedOrganizations)||meta.revision!==0||
  meta.cursor!==null)
  throw Error('Invalid naming registry creation');
}
function putProtectedNameKeys(store,wKey,meta){
 const seen=new Set();
 for(const name of [...meta.protectedPeople,...meta.protectedOrganizations]){
  const normal=normalize(name);
  if(!normal)throw Error('Cannot protect an empty name');
  if(seen.has(normal))continue;
  seen.add(normal);
  store.add({id:idFor(wKey,normal),worldKey:wKey,normalizedName:normal});
 }
}
function validateAppend({expectedRevision,batch,cursor}){
 if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0||
  !batch||batch.expectedRevision!==expectedRevision||
  batch.revision!==expectedRevision+1||
  !Array.isArray(batch.people)||!Array.isArray(batch.organizations)||
  !Array.isArray(batch.owners)||!Number.isSafeInteger(batch.batchIndex)||
  !cursor||cursor.revision!==expectedRevision+1||
  cursor.nextBatch!==batch.batchIndex+1)
  throw Error('Invalid durable naming batch transaction');
}
function persistBatch(tx,wKey,batch,cursor){
 const batches=tx.objectStore('batches'),
  keys=tx.objectStore('nameKeys'),
  entities=tx.objectStore('entities'),
  owners=tx.objectStore('owners');
 const seen=new Map();
 const peopleById=new Map(batch.people.map(x=>[x.id,x]));
 for(const person of batch.people){
  const normalized=normalize(person.name);
  if(!person.id||!normalized||seen.has(normalized))
   throw Error('Duplicate name in a new person batch');
  seen.set(normalized,{kind:'PERSON',id:person.id});
  entities.add({id:idFor(wKey,person.id),worldKey:wKey,
   entityId:person.id,kind:'PERSON',name:person.name});
 }
 for(const org of batch.organizations){
  const normalized=normalize(org.name);
  if(!org.id||!normalized)throw Error('Invalid new fictional organization');
  const existing=seen.get(normalized);
  if(existing&&!(org.ownershipArchetype==='INDIVIDUAL_OWNER'&&
   org.principalId===existing.id&&
   normalize(peopleById.get(existing.id)?.name)===normalized))
   throw Error('Duplicate cross-category name in batch');
  if(!existing)seen.set(normalized,{kind:'ORGANIZATION',id:org.id});
  entities.add({id:idFor(wKey,org.id),worldKey:wKey,
   entityId:org.id,kind:'ORGANIZATION',name:org.name});
 }
 for(const [normalized,record] of seen)
  keys.add({id:idFor(wKey,normalized),worldKey:wKey,
   normalizedName:normalized,kind:record.kind});
 for(const owner of batch.owners){
  if(!owner.id||!owner.principalId||!owner.name)
   throw Error('Owner batch is missing its established principal');
  owners.add({id:idFor(wKey,owner.id),worldKey:wKey,
   ownerId:owner.id,name:owner.name,
   archetype:owner.ownershipArchetype??'UNCLASSIFIED',
   region:owner.namingRegion??null,principalId:owner.principalId,
   batchIndex:batch.batchIndex});
 }
 batches.add({id:idFor(wKey,String(batch.revision).padStart(10,'0')),
  worldKey:wKey,revision:batch.revision,batch});
}
/**
 * Open an adapter. The factory may be injected for testing, but defaults to
 * the browser's native IndexedDB. No database writes occur merely by import.
 */
export function createIndexedDBFictionalNamingStore({
 indexedDBFactory=globalThis.indexedDB,
 keyRangeFactory=globalThis.IDBKeyRange,
 databaseName=INDEXEDDB_FICTIONAL_NAMING_DB
}={}){
 if(!indexedDBFactory||typeof indexedDBFactory.open!=='function')
  throw Error('IndexedDB is not available for the fictional naming registry');
 if(typeof databaseName!=='string'||!databaseName)
  throw Error('Invalid fictional naming database');
 let dbPromise=null;
 async function db(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
   const request=indexedDBFactory.open(databaseName,VERSION);
   request.onupgradeneeded=()=>{
    const database=request.result;
    if(!database.objectStoreNames.contains('worlds'))
     database.createObjectStore('worlds',{keyPath:'id'});
    if(!database.objectStoreNames.contains('batches')){
     const store=database.createObjectStore('batches',{keyPath:'id'});
     store.createIndex('byWorld','worldKey',{unique:false});
    }
    if(!database.objectStoreNames.contains('nameKeys'))
     database.createObjectStore('nameKeys',{keyPath:'id'});
    if(!database.objectStoreNames.contains('entities'))
     database.createObjectStore('entities',{keyPath:'id'});
    if(!database.objectStoreNames.contains('owners')){
     const store=database.createObjectStore('owners',{keyPath:'id'});
     store.createIndex('byWorld','worldKey',{unique:false});
     store.createIndex('byWorldRegion',['worldKey','region'],{unique:false});
     store.createIndex('byWorldArchetype',['worldKey','archetype'],{unique:false});
     store.createIndex('byWorldRegionArchetype',
      ['worldKey','region','archetype'],{unique:false});
    }
   };
   request.onerror=()=>reject(request.error||Error('Could not open fictional name storage'));
   request.onblocked=()=>reject(Error('Fictional naming storage upgrade is blocked'));
   request.onsuccess=()=>{
    const database=request.result;
    database.onversionchange=()=>database.close();
    resolve(database);
   };
  }).catch(error=>{dbPromise=null;throw error});
  return dbPromise;
 }
 async function read({worldId,seed}){
  const database=await db(),key=worldKey(worldId,seed);
  const tx=database.transaction(['worlds','batches'],'readonly');
  const finished=transactionDone(tx);
  const metaPromise=req(tx.objectStore('worlds').get(key));
  const batchesPromise=req(tx.objectStore('batches').index('byWorld').getAll(key));
  const [meta,rows]=await Promise.all([metaPromise,batchesPromise]);
  await finished;
  return meta?{meta,batches:rows.map(row=>row.batch)}:null;
 }
 async function initialize(meta){
  checkMeta(meta);
  const database=await db(),wKey=worldKey(meta.worldId,meta.seed);
  const tx=database.transaction(['worlds','nameKeys'],'readwrite');
  const finished=transactionDone(tx);
  try {
   tx.objectStore('worlds').add({...meta,id:wKey});
   putProtectedNameKeys(tx.objectStore('nameKeys'),wKey,meta);
  }catch(error){tx.abort();await finished.catch(()=>{});throw error}
  await finished;
 }
 async function append({worldId,seed,expectedRevision,batch,cursor}){
  validateAppend({expectedRevision,batch,cursor});
  const database=await db(),wKey=worldKey(worldId,seed);
  const tx=database.transaction(
   ['worlds','batches','nameKeys','entities','owners'],'readwrite');
  const finished=transactionDone(tx);
  let failure=null;
  tx.objectStore('worlds').get(wKey).onsuccess=event=>{
   try {
    const old=event.target.result;
    if(!old||old.revision!==expectedRevision)
     throw Error('Stale persisted fictional naming revision');
    if(cursor.worldId!==worldId||cursor.seed!==seed)
     throw Error('Cross-world fictional naming transaction rejected');
    persistBatch(tx,wKey,batch,cursor);
    tx.objectStore('worlds').put({...old,revision:cursor.revision,
     cursor});
   }catch(error){
    failure=error;
    tx.abort();
   }
  };
  try{await finished}catch(error){throw failure||error}
 }
 /**
  * Backup import is all-or-nothing. No existing world may be replaced
  * implicitly by an imported bundle. Protects against accidental overwrite.
  */
 async function restore({meta,batches}){
  if(!meta||!Array.isArray(batches))throw Error('Invalid registry restore');
  const database=await db(),wKey=worldKey(meta.worldId,meta.seed);
  const tx=database.transaction(
   ['worlds','batches','nameKeys','entities','owners'],'readwrite');
  const finished=transactionDone(tx);
  try {
   tx.objectStore('worlds').add({...meta,id:wKey});
   putProtectedNameKeys(tx.objectStore('nameKeys'),wKey,meta);
   let rev=0;
   for(const batch of batches){
    if(batch.expectedRevision!==rev||batch.revision!==rev+1)
     throw Error('Invalid portable registry revision chain');
    // We only write batch indexes and entries; the final cursor is
    // preserved by the world metadata stored above.
    persistBatch(tx,wKey,batch,meta.cursor);
    rev++;
   }
   if(rev!==meta.revision)throw Error('Portable registry revision mismatch');
  }catch(error){tx.abort();await finished.catch(()=>{});throw error}
  await finished;
 }
 async function findOwners({worldId,seed,region=null,archetype=null,offset=0,limit=50}={}){
  if(!Number.isSafeInteger(offset)||offset<0||!Number.isInteger(limit)||
   limit<1||limit>1000)throw Error('Invalid owner directory page');
  if(!keyRangeFactory||typeof keyRangeFactory.only!=='function')
   throw Error('IndexedDB key ranges unavailable');
  const database=await db(),wKey=worldKey(worldId,seed);
  const tx=database.transaction('owners','readonly'),finished=transactionDone(tx);
  const store=tx.objectStore('owners');
  const index=region!==null&&archetype!==null?
   store.index('byWorldRegionArchetype'):
   region!==null?store.index('byWorldRegion'):
   archetype!==null?store.index('byWorldArchetype'):
   store.index('byWorld');
  const query=region!==null&&archetype!==null?[wKey,region,archetype]:
   region!==null?[wKey,region]:archetype!==null?[wKey,archetype]:wKey;
  const results=[];
  await new Promise((resolve,reject)=>{
   let remainingSkip=offset;
   const request=index.openCursor(keyRangeFactory.only(query));
   request.onerror=()=>reject(request.error||Error('Owner lookup failed'));
   request.onsuccess=()=>{
    const cursor=request.result;
    if(!cursor||results.length>=limit){resolve();return}
    if(remainingSkip-->0){cursor.continue();return}
    const x=cursor.value;
    results.push({id:x.ownerId,name:x.name,region:x.region,
     archetype:x.archetype,principalId:x.principalId,batchIndex:x.batchIndex});
    cursor.continue();
   };
  });
  await finished;
  return Object.freeze(results.map(x=>Object.freeze(x)));
 }
 return Object.freeze({
  model:INDEXEDDB_FICTIONAL_NAMING_MODEL,
  read,initialize,append,restore,findOwners,
  async close(){if(dbPromise){const database=await dbPromise;database.close();dbPromise=null}}
 });
}
