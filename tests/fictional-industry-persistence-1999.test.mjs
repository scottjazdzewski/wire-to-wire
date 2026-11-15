import test from 'node:test';
import assert from 'node:assert/strict';
import {createPersistent1999Industry,readPersistent1999IndustryBatch}
 from '../public/1999/engine/fictional-industry-persistence-1999.mjs';
function memoryStore(){
 const data={manifests:new Map(),horseBatches:new Map(),personBatches:new Map()};
 return {get:async(s,k)=>data[s].get(k),
  commitBatch:async({worldId,manifest,kind,index,records})=>{
   data[kind].set(worldId+':'+index,structuredClone(records));
   data.manifests.set(worldId,structuredClone(manifest));
  },
  commitManifest:async(id,m)=>{data.manifests.set(id,structuredClone(m))}};
}
const dirs={farms:[{id:'O-FARM-1',location:{country:'USA'}}],
 tracks:[{id:'T-0001'}],owners:[{id:'O-OWNER-1'}]};
test('full 1999 industry persists and reopens exactly without regeneration',async()=>{
 const store=memoryStore();
 const params={store,seed:19990101,worldId:'FullTest',...dirs,batchSize:4000};
 const a=await createPersistent1999Industry(params);
 assert.equal(a.status,'COMPLETE');
 assert.ok(a.horseCount>180000);
 assert.ok(a.personCount>30000);
 const first=await readPersistent1999IndustryBatch(store,a,'horseBatches',0);
 assert.equal(first[0].id,'H-FICTIONAL-1999-BROODMARES-0000001');
 const b=await createPersistent1999Industry(params);
 assert.deepEqual(b,a);
 assert.deepEqual(await readPersistent1999IndustryBatch(store,b,'horseBatches',0),first);
});
test('interrupted industry genesis resumes at committed checkpoint',async()=>{
 const store=memoryStore();let writes=0;
 const interrupted={...store,commitBatch:async(args)=>{
  if(++writes===3)throw Error('Simulated crash');
  return store.commitBatch(args);
 }};
 const params={seed:19990102,worldId:'ResumeTest',...dirs,batchSize:5000};
 await assert.rejects(createPersistent1999Industry({...params,store:interrupted}),/Simulated crash/);
 const saved=await store.get('manifests','ResumeTest:19990102');
 assert.equal(saved.status,'GENERATING');
 assert.equal(saved.horseBatchesCommitted,2);
 const done=await createPersistent1999Industry({...params,store});
 assert.equal(done.status,'COMPLETE');
 assert.ok(done.horseBatchesCommitted>2);
});
