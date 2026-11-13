import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 openDurableFictionalNameService,restoreDurableFictionalNamingBundle,
 verifyDurableNamingBundle,bundleLegacyV11NamingSnapshot,
 DURABLE_FICTIONAL_NAMING_MODEL,DURABLE_NAMING_BUNDLE_MODEL
} from '../public/1999/engine/durable-fictional-name-service.mjs';
import {
 createIndexedFictionalNameRegistry,generateIndexedFictionalNames
} from '../public/1999/engine/indexed-fictional-name-registry.mjs';
import {
 createIndexedDBFictionalNamingStore,INDEXEDDB_FICTIONAL_NAMING_DB
} from '../public/1999/engine/indexeddb-fictional-naming-store.mjs';
const clone=x=>structuredClone(x);
function memoryDurableStore(){
 const worlds=new Map();
 let blocked=false;
 const key=(worldId,seed)=>worldId+':'+seed;
 return {
  failNext(){blocked=true},
  async read({worldId,seed}){const x=worlds.get(key(worldId,seed));return x?clone(x):null},
  async initialize(meta){
   const id=key(meta.worldId,meta.seed);
   if(worlds.has(id))throw Error('Already initialized');
   worlds.set(id,{meta:clone(meta),batches:[]});
  },
  async append({worldId,seed,expectedRevision,batch,cursor}){
   if(blocked){blocked=false;throw Error('Simulated durable transaction rollback')}
   const w=worlds.get(key(worldId,seed));
   if(!w||w.meta.revision!==expectedRevision)
    throw Error('Stale persisted fictional naming revision');
   if(cursor.revision!==expectedRevision+1)
    throw Error('Invalid committed naming revision');
   w.batches.push(clone(batch));
   w.meta.revision=cursor.revision;
   w.meta.cursor=clone(cursor);
  },
  async restore({meta,batches}){
   const id=key(meta.worldId,meta.seed);
   if(worlds.has(id))throw Error('Refusing to overwrite existing naming namespace');
   worlds.set(id,clone({meta,batches}));
  }
 };
}
const params={roles:{trainer:10,jockey:7,bloodstock_agent:3},owners:30,
 facilities:{generalFarms:2,studFarms:1},maxPartnershipGroups:8};
test('durable V12 naming writes append-only batches, not full previous name arrays',async()=>{
 const storage=memoryDurableStore(),worldId='Durable-V12-Lifetime',seed=19990101;
 const service=await openDurableFictionalNameService({storage,worldId,seed,
  protectedPeople:['José García'],protectedOrganizations:['Kingsmere Farm']});
 const cursorLengths=[];
 let people=0,owners=0;
 for(let i=0;i<60;i++){
  const next=await service.generate(params);
  people+=next.people.length;owners+=next.owners.length;
  const size=JSON.stringify(next.nextCursor).length;
  cursorLengths.push(size);
  assert.equal(next.manifest.writtenToGame,false);
  assert.equal(next.storageModel,DURABLE_FICTIONAL_NAMING_MODEL);
  assert.ok(!('mintedNames' in next.nextCursor));
  assert.ok(!('ownerEntities' in next.nextCursor));
  assert.ok(service.partnershipGroupsIssued<=8);
 }
 assert.equal(service.revision,60);
 assert.equal(service.ownerCount,owners);
 assert.equal(service.namesIssued,people+owners+60*(10+3));
 assert.ok(Math.max(...cursorLengths)-Math.min(...cursorLengths)<12);
 assert.ok(Math.max(...cursorLengths)<350);
 const stored=await storage.read({worldId,seed});
 assert.equal(stored.batches.length,60);
 assert.ok(stored.batches.every((b,i)=>
  b.revision===i+1&&b.expectedRevision===i));
 assert.ok(stored.batches.every(b=>!('previousNames' in b)&&!('snapshot' in b)));
 assert.equal(stored.meta.cursor.revision,60);
 const reopened=await openDurableFictionalNameService({storage,worldId,seed});
 assert.deepEqual(reopened.cursor,service.cursor);
 assert.equal(reopened.namesIssued,service.namesIssued);
 assert.equal(reopened.ownerCount,service.ownerCount);
 assert.ok(reopened.hasName('José García'));
 assert.ok(reopened.listOwners({limit:30}).length===30);
 assert.equal(reopened.listGroups({limit:100}).length,service.partnershipGroupsIssued);
 const next=await reopened.generate(params);
 assert.equal(next.nextCursor.revision,61);
 assert.equal(next.ownership.partnershipsIssued,8);
});
test('two simultaneous initializations share one protected foundation and reject changes',async()=>{
 const storage=memoryDurableStore(),worldId='Parallel-First-Open',seed=123456;
 const config={storage,worldId,seed,
  protectedPeople:['Raúl García'],protectedOrganizations:['Kingsmere Stud']};
 const [a,b]=await Promise.all([
  openDurableFictionalNameService(config),
  openDurableFictionalNameService(config)
 ]);
 assert.equal(a.revision,0);
 assert.equal(b.revision,0);
 assert.equal((await storage.read({worldId,seed})).batches.length,0);
 await assert.rejects(()=>openDurableFictionalNameService({
  ...config,protectedPeople:['Rewritten Person']
 }),/different protected identities/);
 const first=await a.generate(params);
 assert.equal(first.nextCursor.revision,1);
 await assert.rejects(()=>b.generate(params),/Stale persisted/);
 await b.refresh();
 assert.equal(b.revision,1);
});
test('rejected durable append never mutates local registry, and stale tabs must refresh',async()=>{
 const storage=memoryDurableStore(),worldId='Two-Tabs-V12',seed=91001;
 const first=await openDurableFictionalNameService({storage,worldId,seed});
 const second=await openDurableFictionalNameService({storage,worldId,seed});
 const a=await first.generate(params);
 assert.equal(first.revision,1);
 const countBefore=second.namesIssued;
 await assert.rejects(()=>second.generate(params),/Stale persisted/);
 assert.equal(second.revision,0);
 assert.equal(second.namesIssued,countBefore);
 await second.refresh();
 assert.equal(second.revision,1);
 const b=await second.generate(params);
 assert.equal(b.nextCursor.revision,2);
 await first.refresh();
 storage.failNext();
 const before=first.namesIssued;
 await assert.rejects(()=>first.generate(params),/Simulated durable transaction rollback/);
 assert.equal(first.namesIssued,before);
 assert.equal(first.revision,2);
 const recovered=await first.generate(params);
 assert.equal(recovered.nextCursor.revision,3);
});
test('explicit named registry archive signs, restores, validates and refuses overwrite',async()=>{
 const storage=memoryDurableStore(),worldId='Portable-Naming-V12',seed=9341;
 const service=await openDurableFictionalNameService({storage,worldId,seed,
  protectedOrganizations:['Stone Orchard Stud']});
 for(let i=0;i<6;i++)await service.generate(params);
 const bundle=await service.exportBundle();
 assert.equal(bundle.schema,DURABLE_NAMING_BUNDLE_MODEL);
 assert.equal(bundle.batches.length,6);
 assert.match(bundle.integrity,/^(sha256|fnv32)-/);
 const clean=await verifyDurableNamingBundle(JSON.parse(JSON.stringify(bundle)));
 assert.deepEqual(clean.batches,bundle.batches);
 const corrupted=clone(bundle);
 corrupted.batches[1].people[0].name='Unverified Replacement';
 await assert.rejects(()=>verifyDurableNamingBundle(corrupted),/checksum mismatch/);
 const destination=memoryDurableStore();
 const imported=await restoreDurableFictionalNamingBundle({storage:destination,bundle});
 assert.equal(imported.revision,6);
 assert.equal(imported.ownerCount,180);
 assert.equal(imported.namesIssued,service.namesIssued);
 assert.deepEqual(imported.cursor,service.cursor);
 await assert.rejects(()=>restoreDurableFictionalNamingBundle({
  storage:destination,bundle
 }),/overwrite existing/);
 const nextA=await service.generate(params),nextB=await imported.generate(params);
 assert.deepEqual(nextA.people.map(x=>x.name),nextB.people.map(x=>x.name));
 assert.deepEqual(nextA.owners.map(x=>x.name),nextB.owners.map(x=>x.name));
 assert.deepEqual(nextA.nextCursor,nextB.nextCursor);
});
test('complete verified V11 naming history migrates without renaming any identity',async()=>{
 const worldId='Migrated-Registry',seed=19990101;
 const legacy=createIndexedFictionalNameRegistry({worldId,seed,
  protectedPeople:['Jean François'],protectedOrganizations:['Approved Stud']});
 let cursor=null;
 for(let i=0;i<4;i++)
  cursor=generateIndexedFictionalNames({...params,registry:legacy,worldId,seed,cursor}).nextCursor;
 const snapshot=legacy.snapshot();
 const archive=await bundleLegacyV11NamingSnapshot({snapshot,cursor});
 assert.equal(archive.schema,DURABLE_NAMING_BUNDLE_MODEL);
 const storage=memoryDurableStore();
 const restored=await restoreDurableFictionalNamingBundle({storage,bundle:archive});
 assert.equal(restored.ownerCount,legacy.ownerCount);
 assert.equal(restored.namesIssued,legacy.namesIssued);
 assert.equal(restored.partnershipGroupsIssued,legacy.formalGroupsIssued);
 assert.equal(restored.cursor.nextBatch,cursor.nextBatch);
 assert.ok(restored.hasName(snapshot.issuedPeople[0].name));
 assert.ok(restored.hasName(snapshot.issuedOrganizations[0].name));
 const next=await restored.generate(params);
 assert.equal(next.nextCursor.nextBatch,cursor.nextBatch+1);
 assert.equal(restored.partnershipGroupsIssued<=8,true);
 await assert.rejects(()=>bundleLegacyV11NamingSnapshot({
  snapshot:{...snapshot,issuedPeople:[]},cursor
 }),/snapshot|invalid|integrity|corrupt|mismatch/i);
 await assert.rejects(()=>bundleLegacyV11NamingSnapshot({
  snapshot:{mintedNames:['A Fake Owner']},cursor
 }),/matching full snapshot/);
});
test('production storage adapter never writes Canon Desk D1, horses, or the existing local career save',()=>{
 const source=readFileSync(new URL('../public/1999/engine/indexeddb-fictional-naming-store.mjs',import.meta.url),'utf8');
 const core=readFileSync(new URL('../public/1999/engine/durable-fictional-name-service.mjs',import.meta.url),'utf8');
 const career=readFileSync(new URL('../public/next/1999-commercial-career-manager.mjs',import.meta.url),'utf8');
 assert.equal(INDEXEDDB_FICTIONAL_NAMING_DB,'WireToWireFictionalNamesV12');
 assert.match(source,/transaction\(\s*\['worlds','batches','nameKeys','entities','owners'\],'readwrite'\)/);
 assert.doesNotMatch(career,/WireToWireFictionalNamesV12|durable-fictional-name-service/);
 assert.doesNotMatch(source+core,/\b(?:fetch|localStorage|writeFile|setItem)\s*\(/);
 assert.doesNotMatch(core,/createNewHorse|horseOwnerTransfer|insertHorse/);
 assert.throws(()=>createIndexedDBFictionalNamingStore({indexedDBFactory:null}),
  /IndexedDB is not available/);
});
