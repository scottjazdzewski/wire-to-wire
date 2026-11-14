import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
import {POPULATION_NAMING_SCHEMA} from '../src/horse-naming-population-service.js';
const ctx={access:{getIdentity:async()=>({email:'admin@example.com'})}};
const env={ADMIN_EMAIL:'admin@example.com',AI:{run:async()=>{throw Error('AI must not be invoked')}}};
const input={schema:POPULATION_NAMING_SCHEMA,jobId:'wtw_ACCOUNT_2040_000001',year:2040,
 items:[{brief:{horseId:'H-FUTURE-TEST-01'}}],recentNames:[]};
const req=(path,method='POST',body=input,headers={})=>new Request(`https://wtw.example/api/naming/population/${path}`,{
 method,headers:{'Content-Type':'application/json',...headers},
 ...(method==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});

test('the protected population API denies strangers before any Cloudflare AI call',async()=>{
 const visitor={access:{getIdentity:async()=>({email:'stranger@example.com'})}};
 const r=await worker.fetch(req('submit'),env,visitor);
 assert.equal(r.status,403);
});
test('strict POST JSON and same-origin requirements prevent cross-site batches',async()=>{
 assert.equal((await worker.fetch(req('submit','POST',input,{Origin:'https://evil.example'}),env,ctx)).status,403);
 assert.equal((await worker.fetch(req('submit','POST','{oops'),env,ctx)).status,400);
 assert.equal((await worker.fetch(req('submit','GET'),env,ctx)).status,405);
});
test('population submission fails closed without the bound D1 checkpoint store',async()=>{
 const r=await worker.fetch(req('submit'),env,ctx);
 assert.equal(r.status,503);
 const b=await r.json();assert.match(b.error,/binding/i);
});
test('population status is a read-only endpoint; it rejects malformed IDs',async()=>{
 const r=await worker.fetch(req('job?jobId=..','GET'),env,ctx);
 assert.equal(r.status,400);
});
test('preview opt-in is ON for an authenticated bound AI, with explicit kill-switch',async()=>{
 const f=await import('../src/game/horse-naming-bridge.js');
 const g=await import('../src/game/horse-naming-model-creator.js');
 const brief={schema:f.GAME_NAMING_BRIDGE_SCHEMA,horseId:'H-GAME-1999-TEST-ENABLE',foalingYear:1996,
 owner:{id:'O-A',name:'Story Owner'},breeder:{id:'O-B',name:'Breeder'},
 status:'READY_FOR_ORIGINAL_NAME_WRITING',evidence:[{id:'OWNER_STORY:EVIDENCE-01',kind:'OWNER_ATTESTED',
 sourceRef:'owner_story:EVIDENCE-01',detail:'The old stable door made three soft knocks after midnight and the owner never forgot the sound.'}]};
 let calls=0;const model={run:async()=>{calls++;return {response:JSON.stringify({ideas:[]})}}};
 const response=await worker.fetch(new Request('https://wtw.example/api/naming/preview',{
  method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({brief,writtenSpec:g.HORSE_NAME_CREATOR_SCHEMA,recentNames:[]})}),
  {...env,AI:model},ctx);
 assert.equal(response.status,200);assert.equal(calls,1);
 const off=await worker.fetch(new Request('https://wtw.example/api/naming/preview',{
  method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({brief,writtenSpec:g.HORSE_NAME_CREATOR_SCHEMA,recentNames:[]})}),
  {...env,AI:model,NAMING_AI_PREVIEW_ENABLED:'false'},ctx);
 assert.equal(off.status,503);assert.equal(calls,1);
});