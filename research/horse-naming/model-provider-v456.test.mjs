import test from 'node:test';import assert from 'node:assert/strict';
import {createResponsesNamingProvider} from './model-provider-v456.mjs';
test('requires 2 distinct server models and a key; never sends until called',()=>{
 let called=0;const f=async()=>{called++;throw Error('SHOULD_NOT_CALL')};
 assert.throws(()=>createResponsesNamingProvider({creativeModel:'a',reviewModel:'b'}),/KEY/);
 assert.throws(()=>createResponsesNamingProvider({apiKey:'123456789012345',creativeModel:'a',reviewModel:'a'}),/DIFFER/);
 createResponsesNamingProvider({apiKey:'123456789012345',creativeModel:'a',reviewModel:'b',fetchImpl:f});assert.equal(called,0);
});
test('independent creation and review calls have structured JSON and distinct model IDs',async()=>{
 const requests=[];const f=async(url,opts)=>{const p=JSON.parse(opts.body);requests.push({url,opts,p});
  const isReview=p.model==='independent-critic';const items=JSON.parse(p.input).items;
  const results=items.map(x=>isReview?{horseId:x.brief.horseId,name:x.proposal.name,score:5,grammarNatural:true,humanBelievable:true,originalEnough:true,eraAppropriate:true,reason:'FIXTURE'}:{horseId:x.horseId,name:'Quiet Bell',styleDomain:x.sourceDomain,sourceYear:1999});
  return {ok:true,status:200,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({results})}]}]})};};
 const api=createResponsesNamingProvider({apiKey:'123456789012345',creativeModel:'creative-model',reviewModel:'independent-critic',fetchImpl:f,maxNamesPerRequest:2});
 const input=Array.from({length:3},(_,i)=>({horseId:'H'+i,namingYear:2000,sourceDomain:'spoken_expression'}));
 const proposals=await api.proposer(input);assert.equal(proposals.length,3);
 const reviews=await api.reviewer(input.map((b,i)=>({brief:b,proposal:proposals[i]})));assert.equal(reviews.length,3);
 assert.deepEqual(requests.map(x=>x.p.model),['creative-model','creative-model','independent-critic','independent-critic']);
 assert.ok(requests.every(x=>x.p.text.format.strict===true&&x.p.store===false));
 assert.ok(requests.every(x=>x.opts.headers.Authorization.startsWith('Bearer ')));
});
test('incomplete provider outputs fail closed',async()=>{const api=createResponsesNamingProvider({apiKey:'123456789012345',creativeModel:'x',reviewModel:'y',fetchImpl:async()=>({ok:true,json:async()=>({status:'incomplete',output:[]})})});await assert.rejects(api.proposer([{horseId:'H'}]),/NOT_COMPLETED/);});