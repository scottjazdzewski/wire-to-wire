import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
const ctx={access:{getIdentity:async()=>({email:'admin@example.com'})}};
const req=(path,method='POST')=>new Request('https://wtw.example/api/naming/population/'+path,{
 method,headers:{'Content-Type':'application/json'},...(method==='POST'?{body:'{}'}:{})});
test('population naming is local-only, not a paid Cloudflare Worker queue',async()=>{
 let calls=0;
 const env={ADMIN_EMAIL:'admin@example.com',NAMING_AI_POPULATION_ENABLED:'true',
  AI:{run:async()=>{calls++;throw Error('AI call should never happen')}}};
 for(const path of ['submit','poll','job?jobId=TEST']){
  const r=await worker.fetch(req(path),env,ctx);
  assert.equal(r.status,410);
  assert.equal((await r.json()).aiRequestsMade,0);
 }
 assert.equal(calls,0);
});
test('population naming API remains unavailable without a Cloudflare quota',async()=>{
 const env={ADMIN_EMAIL:'admin@example.com',AI:{run:async()=>{throw Error('No AI')}}};
 const status=await worker.fetch(new Request('https://wtw.example/api/naming/status'),env,ctx);
 assert.equal(status.status,200);
 const body=await status.json();
 assert.equal(body.populationEnabled,false);
 assert.equal(body.dailyNamingQuota,null);
 assert.equal(body.creditsUsed,0);
 assert.equal(body.nameRegistrationEnabled,false);
});
test('protected Worker access remains in place for retired routes',async()=>{
 const env={ADMIN_EMAIL:'admin@example.com'};
 const intruder={access:{getIdentity:async()=>({email:'unapproved@example.com'})}};
 assert.equal((await worker.fetch(req('submit'),env,intruder)).status,403);
});
