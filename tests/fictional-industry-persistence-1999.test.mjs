import test from 'node:test';
import assert from 'node:assert/strict';
import {createPersistent1999Industry,readPersistent1999IndustryBatch,findPersistent1999Horse,
 updatePersistent1999Horse,readPersistent1999HorseProfile,
 savePersistent1999CareerRun,loadPersistent1999CareerRun,
 readPersistent1999Directory}
 from '../public/1999/engine/fictional-industry-persistence-1999.mjs';
function memoryStore(){
 const data={manifests:new Map(),horseBatches:new Map(),personBatches:new Map(),horseEdits:new Map(),careerRuns:new Map(),directory:new Map()};
 return {get:async(s,k)=>data[s].get(k),
  commitDirectory:async(id,manifest,records)=>{
   data.directory.set(id,structuredClone(records));
   data.manifests.set(id,structuredClone(manifest));
  },
  commitBatch:async({worldId,manifest,kind,index,records})=>{
   data[kind].set(worldId+':'+index,structuredClone(records));
   data.manifests.set(worldId,structuredClone(manifest));
  },
  commitManifest:async(id,m)=>{data.manifests.set(id,structuredClone(m))},
  putHorseEdit:async(id,horseId,edit)=>{data.horseEdits.set(id+':'+horseId,structuredClone(edit))},
  putCareerRun:async(id,runId,record)=>{
   if(data.manifests.get(id)?.status!=='COMPLETE')throw Error('World incomplete');
   data.careerRuns.set(id+':'+runId,structuredClone(record));
  }};
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
 assert.ok(first[0].ratings.speed>=15);
 assert.ok(first[0].relationships.some(e=>e.type==='OWNED_BY'));
 const directory=await readPersistent1999Directory(store,a);
 assert.equal(directory.length,3);
 assert.ok(directory.every(e=>e.ratings&&Array.isArray(e.relationships)));
 const b=await createPersistent1999Industry(params);
 assert.deepEqual(b,a);
 await assert.rejects(createPersistent1999Industry({...params,
  tracks:[{id:'T-DIFFERENT'}]}),/generation parameters conflict/);
 assert.deepEqual(await readPersistent1999IndustryBatch(store,b,'horseBatches',0),first);
 assert.deepEqual(await findPersistent1999Horse(store,b,first[0].id),first[0]);
 assert.equal(await findPersistent1999Horse(store,b,'H-FICTIONAL-1999-BROODMARES-9999999'),null);
 await updatePersistent1999Horse(store,b,first[0].id,{name:'Copper Horizon'});
 const edited=await readPersistent1999HorseProfile(store,b,first[0].id);
 assert.equal(edited.name,'Copper Horizon');
 assert.equal((await findPersistent1999Horse(store,b,first[0].id)).name,null);
 const run=await savePersistent1999CareerRun(store,b,{runId:'career-1',
  player:{role:'owner',organizationId:'O-OWNER-1'},
  changes:{balanceMinor:123456},gameDate:'1999-02-01'});
 assert.deepEqual(await loadPersistent1999CareerRun(store,b,'career-1'),run);
 assert.equal((await readPersistent1999HorseProfile(store,b,first[0].id)).name,'Copper Horizon');
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

test('incomplete worlds cannot receive playable career runs',async()=>{
 const store=memoryStore();
 const incomplete={schema:'WTW_PERSISTENT_INDUSTRY_1999_V1',
  worldId:'Incomplete',seed:19990101,status:'GENERATING'};
 await assert.rejects(savePersistent1999CareerRun(store,incomplete,{
  runId:'bad',player:{role:'owner'}}),/Invalid persistent industry career run/);
});
