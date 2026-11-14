import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
const ctx={access:{getIdentity:async()=>({email:'admin@example.com'})}};
const request=(path,method='POST')=>new Request('https://wtw.example'+path,{
 method,headers:{'Content-Type':'application/json'},...(method==='POST'?{body:'{}'}:{})});
test('all former AI naming endpoints are retired, even when obsolete flags and AI bindings are injected',async()=>{
 let calls=0;
 const env={ADMIN_EMAIL:'admin@example.com',NAMING_AI_PREVIEW_ENABLED:'true',
  NAMING_AI_POPULATION_ENABLED:'true',AI:{run:async()=>{calls++;throw Error('AI called')}}};
 for(const path of ['/api/naming/preview','/api/naming/population/submit',
  '/api/naming/population/poll','/api/naming/population/job?jobId=TEST']){
  const r=await worker.fetch(request(path),env,ctx);
  assert.equal(r.status,410,path);
  assert.equal((await r.json()).mode,'ON_DEVICE_ONLY');
 }
 assert.equal(calls,0);
});
test('status confirms local naming, zero AI and no daily credit ceiling',async()=>{
 const env={ADMIN_EMAIL:'admin@example.com',AI:{run:async()=>{throw Error('Forbidden')}}};
 const r=await worker.fetch(request('/api/naming/status','GET'),env,ctx);
 assert.equal(r.status,200);
 const status=await r.json();
 assert.equal(status.mode,'ON_DEVICE_ONLY');
 assert.equal(status.previewEnabled,false);
 assert.equal(status.populationEnabled,false);
 assert.equal(status.aiBound,false);
 assert.equal(status.requestsPerName,0);
 assert.equal(status.creditsUsed,0);
 assert.equal(status.dailyNamingQuota,null);
});
test('unauthorized callers still cannot access legacy endpoints',async()=>{
 const env={ADMIN_EMAIL:'admin@example.com'};
 const visitor={access:{getIdentity:async()=>({email:'stranger@example.com'})}};
 assert.equal((await worker.fetch(request('/api/naming/preview'),env,visitor)).status,403);
});
