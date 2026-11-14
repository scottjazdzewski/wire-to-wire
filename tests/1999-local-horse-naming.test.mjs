import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildNamingLabScenario,createNamingDeskController} from '../public/next/1999-naming-desk.mjs';
import {generateLocalStoryFirstHorseNames,LOCAL_HORSE_NAMING_SCHEMA}
 from '../public/1999/game/horse-naming-local-v485.js';
import {auditHorseNamingCohort} from '../public/1999/game/horse-naming-cohort-audit-v482.js';

const story='During a fierce thunderstorm the electricity failed. In the dark barn, the owner found the mare by hearing her calm, steady breathing. The old bell rang when the night groom reached the gate.';
const fields={ownerName:'Test Farm Owner',breederName:'Foaling Farm',foalingYear:1996,story};
const ctx=()=>buildNamingLabScenario(fields);

test('local naming reuses exact horse story, editorial gate and no registration',()=>{
 const c=ctx(),original=JSON.stringify(c);
 const r=generateLocalStoryFirstHorseNames({...c,attempt:0,count:8});
 assert.equal(r.schema,LOCAL_HORSE_NAMING_SCHEMA);
 assert.equal(r.status,'LOCAL_IDEAS_READY_FOR_EDITOR');
 assert.ok(r.readyForIndependentEditor>=2);
 assert.ok(r.readyForIndependentEditor<=8);
 assert.ok(r.screened.every(x=>x.status==='AWAITING_INDEPENDENT_EDITOR'));
 assert.ok(r.screened.every(x=>x.registrationStatus==='NOT_RELEASED'&&x.gameWrites===0));
 assert.equal(r.requestCount,0);assert.equal(r.creditsUsed,0);assert.equal(r.gameWrites,0);
 assert.equal(JSON.stringify(c),original);
});

test('same horse and seed return same names; a later attempt changes choices',()=>{
 const c=ctx(),first=generateLocalStoryFirstHorseNames({...c,attempt:0}),again=generateLocalStoryFirstHorseNames({...c,attempt:0});
 assert.deepEqual(first,again);
 const second=generateLocalStoryFirstHorseNames({...c,attempt:2});
 assert.notDeepEqual(first.screened.map(x=>x.name),second.screened.map(x=>x.name));
});

test('previously owner-reviewed names cannot pass local screen, all candidates are whole names',()=>{
 const c=ctx(),r=generateLocalStoryFirstHorseNames({...c,attempt:3,count:8});
 const reviewed=['Midnight Rambler','Mulligan','Wild Geese','County Line'];
 assert.ok(r.screened.every(x=>!reviewed.includes(x.name)));
 assert.ok(r.screened.every(x=>x.name.length<=18));
 const audit=auditHorseNamingCohort({names:r.screened.map(x=>x.name)});
 assert.equal(audit.duplicateNames.length,0);
});

test('unrecognizable horse story yields a hold instead of fake context',()=>{
 const c=buildNamingLabScenario({...fields,story:'A very mysterious thing happened, but there are no concrete details or specific memories in this account.'});
 const r=generateLocalStoryFirstHorseNames({...c});
 assert.match(r.status,/^HOLD_/);
 assert.equal(r.creditsUsed,0);
 assert.deepEqual(r.screened,[]);
});

test('benchmarks many local calls without any inference/network calls',()=>{
 const c=ctx();
 const saved=globalThis.fetch;
 let calls=0;
 globalThis.fetch=()=>{calls++;throw Error('NETWORK CALL FROM LOCAL NAMING')};
 try{
  for(let i=0;i<1000;i++){
   const r=generateLocalStoryFirstHorseNames({...c,attempt:i,count:3});
   assert.equal(r.creditsUsed,0);assert.equal(r.requestCount,0);
  }
 }finally{globalThis.fetch=saved}
 assert.equal(calls,0);
});

test('Naming Desk operates from local engine and never calls Worker API',()=>{
 const oldFetch=globalThis.fetch;
 let calls=0;
 globalThis.fetch=()=>{calls++;throw Error('UI FETCH FOR NAME')};
 try{
  const desk=createNamingDeskController();
  for(const [k,v] of Object.entries(fields))desk.setField(k,String(v));
  assert.equal(desk.generate(),true);
  const first=desk.snapshot();
  assert.ok(first.results.length>0);
  assert.equal(first.results[0].registrationStatus,'NOT_RELEASED');
  assert.ok(desk.render().includes('ON-DEVICE'));
  assert.ok(desk.mark(first.results[0].name));
  assert.ok(desk.reject(first.results[0].name));
  assert.equal(desk.snapshot().shortlist.length,0);
  assert.ok(desk.clear());
  assert.equal(calls,0);
 }finally{globalThis.fetch=oldFetch}
});

test('Wrangler has no AI binding and the Worker closes all old remote naming routes',async()=>{
 const w=await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8');
 const worker=await readFile(new URL('../src/worker.js',import.meta.url),'utf8');
 const ui=await readFile(new URL('../public/next/1999-naming-desk.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(w,/"ai"\s*:\s*\{/);
 assert.doesNotMatch(w,/256/);
 assert.match(worker,/Remote AI naming retired/);
 assert.doesNotMatch(ui,/fetch\(|\/api\/naming\/preview|Cloudflare AI preview/);
});