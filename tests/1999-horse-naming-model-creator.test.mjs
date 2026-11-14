import test from 'node:test';
import assert from 'node:assert/strict';
import {buildGameHorseNamingBrief,createHorseNamingRuntime,recordHorseNamingStoryAction}
 from '../src/game/horse-naming-bridge.js';
import {buildStoryFirstWritingRequest,parseCreativeModelOutput,
 screenStoryFirstIdeas,writeStoryFirstHorseNames,previewStoryFirstHorseNames,
 HORSE_NAME_CREATOR_SCHEMA,verifyNamingBriefAgainstGame} from '../src/game/horse-naming-model-creator.js';
import {OWNER_REVIEWED_NAME_KEYS_V478} from '../src/game/horse-naming-owner-review-v478.js';
import {makePrivateHorseNamePreview} from '../src/horse-naming-ai-service.js';

const world={entities:{horses:[{id:'H-SOURCE',name:'Historical Champion'}],organizations:[
 {id:'O-OWNER',name:'Harrowgate'},{id:'O-BREEDER',name:'Kingsley'}]}};
const horse={horse_id:'H-GAME-1999-NEW100',foaling_year:1996,owner_organization_id:'O-OWNER',
 breeder_organization_id:'O-BREEDER',sire_id:null,dam_id:null};
const state={clock:{date:'1999-01-01'},player:{role:'owner',operation_id:'O-OWNER'},
 event_log:[],runtime:{horse_naming:createHorseNamingRuntime(),registered_horses:{by_id:{}}}};
const story='The foal was so calm during a violent thunderstorm that the owner remembered the night the power went out at the old farm.';
recordHorseNamingStoryAction({world,state,command:{type:'RECORD_HORSE_NAMING_STORY',actor:'player',payload:{horse,
 story_id:'story-001',story}},emit:()=>{}});
const brief=buildGameHorseNamingBrief({world,state,horse});
const good={name:'Blackout',evidenceId:'OWNER_STORY:story-001',evidenceQuote:'the power went out',
 explanation:'An affectionate reminder of the evening the farm lost electricity during the foal’s first thunderstorm.'};
const call=ideas=>({ideas});

test('builds a specific, non-template literary brief with exact source',()=>{
 const spec=buildStoryFirstWritingRequest(brief,{recentNames:['The Old Mill']});
 assert.equal(spec.schema,HORSE_NAME_CREATOR_SCHEMA);
 assert.ok(spec.user.includes('the power went out'));
 assert.ok(spec.system.includes('human-quality'));
 assert.ok(spec.system.includes('Never make up a sire'));
 assert.equal(spec.evidenceIds[0],'OWNER_STORY:story-001');
});
test('rejects storyless generation and does not infer pedigree',()=>{
 const none=buildGameHorseNamingBrief({world,state:{...state,runtime:{horse_naming:createHorseNamingRuntime()},event_log:[]},horse});
 assert.throws(()=>buildStoryFirstWritingRequest(none),e=>e.code==='NAMING_ORIGIN_REQUIRED');
});
test('parses model JSON without treating prose as a release',()=>{
 assert.deepEqual(parseCreativeModelOutput('not json').ideas,[]);
 assert.equal(parseCreativeModelOutput('```json\n{"ideas":[]}\n```').ideas.length,0);
 assert.equal(parseCreativeModelOutput(call([good])).ideas.length,1);
 assert.equal(parseCreativeModelOutput({response:JSON.stringify(call([good]))}).ideas.length,1);
 assert.equal(parseCreativeModelOutput({ideas:[good,...Array.from({length:10},()=>good)]}).ideas.length,8);
});
test('model creates a source-referenced name but cannot register it',async()=>{
 let called=0;const result=await writeStoryFirstHorseNames({world,state,horse,brief,infer:async messages=>{
  called++;assert.ok(messages.user.includes('H-GAME-1999-NEW100'));return {response:JSON.stringify(call([good]))}
 }});
 assert.equal(called,1);assert.equal(result.readyForIndependentEditor,1);
 assert.equal(result.screened[0].name,'Blackout');
 assert.equal(result.screened[0].registrationStatus,'NOT_RELEASED');
 assert.equal(result.gameWrites,0);
});
test('repeats and unverifiable evidence are held rather than papered over',()=>{
 const screened=screenStoryFirstIdeas({world,state,brief,rawIdeas:[good,good,
  {...good,name:'Midnight Rambler'},
  {...good,name:'Weather Boss',evidenceQuote:'invented evidence'},
  {...good,name:'Stormer',explanation:'It sounds like a racehorse'}]});
 assert.equal(screened.readyForIndependentEditor,1);
 assert.equal(screened.held,4);
 assert.ok(screened.screened[1].reasons.includes('INTRA_BATCH_REPEAT'));
 assert.ok(screened.screened[2].reasons.includes('NAME_ALREADY_USED_OR_REVIEWED'));
 assert.ok(screened.screened[3].reasons.includes('NO_EXACT_STORY_EVIDENCE'));
 assert.ok(screened.screened[4].reasons.includes('NO_CONCRETE_NAMING_REASON'));
});
test('recent whole-name, reused content word and opener fatigue are detected',()=>{
 const recent=['Blackout','Last Blackout','Second Blackout','Third Blackout'];
 const data=screenStoryFirstIdeas({world,state,brief,rawIdeas:[good],recentNames:recent});
 assert.ok(data.screened[0].reasons.includes('RECENT_NAME_REPEAT'));
 assert.ok(data.screened[0].reasons.includes('RECENT_CONTENT_WORD_FATIGUE'));
});
test('all 520 previously owner-rated names are reserved from new rounds',()=>{
 assert.equal(OWNER_REVIEWED_NAME_KEYS_V478.length,520);
 for(const name of ['midnightrambler','wildgeese','mulligan','chapelroad'])assert.ok(OWNER_REVIEWED_NAME_KEYS_V478.includes(name));
});
test('AI preview requires explicit authorization and bound model',async()=>{
 let calls=0;const env={AI:{run:async()=>{calls++;return call([good])}}};
 const body={brief,writtenSpec:HORSE_NAME_CREATOR_SCHEMA,recentNames:[]};
 const disabled=await makePrivateHorseNamePreview({env,body});
 assert.equal(disabled.status,503);assert.equal(calls,0);
 env.NAMING_AI_PREVIEW_ENABLED='true';
 const ready=await makePrivateHorseNamePreview({env,body});
 assert.equal(ready.status,200);assert.equal(calls,1);
 assert.equal(ready.payload.ideas.length,1);
 assert.equal(ready.payload.approvedForRegistration,false);
 assert.equal(ready.payload.gameWrites,0);
});
test('model output cannot revive an owner-reviewed name at the server',async()=>{
 const env={NAMING_AI_PREVIEW_ENABLED:'true',AI:{run:async()=>call([{...good,name:'Mulligan'},good])}};
 const result=await makePrivateHorseNamePreview({env,body:{brief,writtenSpec:HORSE_NAME_CREATOR_SCHEMA,recentNames:[]}});
 assert.equal(result.payload.ideas.length,1);
 assert.equal(result.payload.ideas[0].name,'Blackout');
});
test('bad AI JSON, missing origin and oversized requests fail closed',async()=>{
 const env={NAMING_AI_PREVIEW_ENABLED:'true',AI:{run:async()=>({response:'blah'})}};
 const base={brief,writtenSpec:HORSE_NAME_CREATOR_SCHEMA,recentNames:[]};
 assert.equal((await makePrivateHorseNamePreview({env,body:base})).status,502);
 assert.equal((await makePrivateHorseNamePreview({env,body:{...base,recentNames:Array(61).fill('x')}})).status,400);
 assert.equal((await makePrivateHorseNamePreview({env,body:{...base,brief:{...brief,status:'NEEDS_A_REAL_HORSE_STORY'}}})).status,400);
});
test('client preview still screens returned model text with source game',async()=>{
 const response=await previewStoryFirstHorseNames({world,state,horse,brief,fetchImpl:async(url,options)=>{
  assert.equal(url,'/api/naming/preview');assert.equal(options.method,'POST');
  return {ok:true,json:async()=>({schema:HORSE_NAME_CREATOR_SCHEMA,ideas:[good]})};
 }});
 assert.equal(response.readyForIndependentEditor,1);
 assert.equal(response.screened[0].status,'AWAITING_INDEPENDENT_EDITOR');
});

test('forged brief cannot be submitted to active game model route',async()=>{
 const forged={...brief,owner:{id:'O-SPOOF',name:'Imposter'}};
 assert.throws(()=>verifyNamingBriefAgainstGame({world,state,horse,brief:forged}),e=>e.code==='NAMING_BRIEF_FORGED');
 await assert.rejects(()=>writeStoryFirstHorseNames({world,state,horse,brief:forged,infer:async()=>call([good])}),
  e=>e.code==='NAMING_BRIEF_FORGED');
});