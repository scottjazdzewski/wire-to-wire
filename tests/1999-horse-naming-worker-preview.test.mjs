import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
import {HORSE_NAME_CREATOR_SCHEMA} from '../src/game/horse-naming-model-creator.js';
import {GAME_NAMING_BRIDGE_SCHEMA} from '../src/game/horse-naming-bridge.js';

const brief={schema:GAME_NAMING_BRIDGE_SCHEMA,horseId:'H-GAME-1999-TEST-WORKER',foalingYear:1996,
 owner:{id:'O-OWNER',name:'Story Owner'},breeder:{id:'O-FARM',name:'Story Breeder'},
 status:'READY_FOR_ORIGINAL_NAME_WRITING',evidence:[{id:'OWNER_STORY:TEST-100',kind:'OWNER_ATTESTED',
 sourceRef:'owner_story:TEST-100',detail:'The owner could identify the colt by the little white star he had on his forehead after the foaling.'}]};
const payload=()=>JSON.stringify({brief,writtenSpec:HORSE_NAME_CREATOR_SCHEMA,recentNames:[]});
const request=(body=payload(),extraHeaders={})=>new Request('https://wtw.example/api/naming/preview',{
 method:'POST',headers:{'Content-Type':'application/json',...extraHeaders},body});
const ctx={access:{getIdentity:async()=>({email:'admin@example.com'})}};
const model={run:async()=>({response:JSON.stringify({ideas:[{
 name:'Little Star',evidenceId:'OWNER_STORY:TEST-100',evidenceQuote:'the little white star',
 explanation:'The barn owner remembers the small star on the foal during his first night.'}]})})};
const base={ADMIN_EMAIL:'admin@example.com',AI:model};

test('authenticated Worker kill switch disables AI preview without a model call',async()=>{
 let count=0;const env={...base,NAMING_AI_PREVIEW_ENABLED:'false',AI:{run:async()=>{count++;return null}}};
 const r=await worker.fetch(request(),env,ctx);
 assert.equal(r.status,503);assert.equal(count,0);
});
test('private Worker names preview invokes AI when explicitly opted in',async()=>{
 const r=await worker.fetch(request(),{...base,NAMING_AI_PREVIEW_ENABLED:'true'},ctx);
 assert.equal(r.status,200);const j=await r.json();
 assert.equal(j.schema,HORSE_NAME_CREATOR_SCHEMA);
 assert.equal(j.ideas[0].name,'Little Star');
 assert.equal(j.approvedForRegistration,false);
 assert.equal(j.gameWrites,0);
 assert.equal(j.requiresGameWorldScreen,true);
});
test('denies unauthorized user before AI invocation',async()=>{
 const unauthorized={access:{getIdentity:async()=>({email:'intruder@example.com'})}};
 const r=await worker.fetch(request(),{...base,NAMING_AI_PREVIEW_ENABLED:'true'},unauthorized);
 assert.equal(r.status,403);
});
test('rejects cross-site origin, invalid JSON and excessive body size',async()=>{
 const env={...base,NAMING_AI_PREVIEW_ENABLED:'true'};
 const cross=await worker.fetch(request(payload(),{Origin:'https://attacker.example'}),env,ctx);
 assert.equal(cross.status,403);
 const invalid=await worker.fetch(request('{bad json'),env,ctx);
 assert.equal(invalid.status,400);
 const excessive=await worker.fetch(request(JSON.stringify({brief,writtenSpec:HORSE_NAME_CREATOR_SCHEMA,recentNames:[],padding:'X'.repeat(20000)})),env,ctx);
 assert.equal(excessive.status,413);
});