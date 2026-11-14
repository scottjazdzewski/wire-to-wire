import test from 'node:test';
import assert from 'node:assert/strict';
import {buildGameHorseNamingBrief,screenGameHorseName,recordGameNameEditorialDecision,createHorseNamingRuntime,validateHorseNamingRuntime,recordHorseNamingStoryAction} from '../src/game/horse-naming-bridge.js';
const world={entities:{horses:[{id:'H-A',name:'Historical Champion'}],organizations:[
 {id:'O-OWNER',name:'Harrowgate Farm'},{id:'O-BREEDER',name:'Kingsley Farm'}]}};
const horse={horse_id:'H-GAME-1999-TEST001',foaling_year:1996,owner_organization_id:'O-OWNER',breeder_organization_id:'O-BREEDER',sire_id:null,dam_id:null};
const state={event_log:[],runtime:{registered_horses:{by_id:{}}}};
const story={story_id:'HGF-100',owner_id:'O-OWNER',horse_id:horse.horse_id,attested_by:'OWNER',story:'The foal was unusually calm during a violent storm and the farm manager remembered the midnight thunder.'};
const proposal={name:'Midnight Lantern',evidenceId:'OWNER_STORY:HGF-100',explanation:'A quiet light amid the storm that marked this foal\'s early days.',writer_id:'WRITER-A'};
const brief=()=>buildGameHorseNamingBrief({world,state,horse,ownerStories:[story]});
test('does not manufacture a story from owner and breeder names',()=>{
 const b=buildGameHorseNamingBrief({world,state,horse});
 assert.equal(b.status,'NEEDS_A_REAL_HORSE_STORY');
 assert.equal(b.owner.name,'Harrowgate Farm');
 assert.equal(b.evidence.length,0);
});
test('attested story binds to the actual horse and approved owner',()=>{
 const b=brief();assert.equal(b.status,'READY_FOR_ORIGINAL_NAME_WRITING');
 assert.equal(b.evidence[0].sourceRef,'owner_story:HGF-100');
});
test('rejects fabricated owner stories and unreleased pedigree',()=>{
 assert.throws(()=>buildGameHorseNamingBrief({world,state,horse,ownerStories:[{...story,owner_id:'O-FAKE'}]}));
 assert.throws(()=>buildGameHorseNamingBrief({world,state,horse:{...horse,sire_id:'H-A'}}));
});
test('actual journal event must identify THIS horse',()=>{
 const s={...state,event_log:[{seq:1,date:'1999-02-03',kind:'GAME_HORSE_REGISTERED',details:{horse_id:'H-OTHER'}},
  {seq:2,date:'1999-02-04',kind:'RACE_WIN_SETTLED',details:{horse_id:horse.horse_id,race_id:'R-001'}}]};
 const b=buildGameHorseNamingBrief({world,state:s,horse});
 assert.equal(b.evidence.length,1);assert.equal(b.status,'READY_FOR_ORIGINAL_NAME_WRITING');
 assert.equal(b.evidence[0].sourceRef,'event_log:2');
});
test('screens real story proposal without making it a release',()=>{
 const s=screenGameHorseName({world,state,brief:brief(),proposal});
 assert.equal(s.status,'AWAITING_INDEPENDENT_EDITOR');
 assert.equal(s.registrationStatus,'NOT_RELEASED');assert.equal(s.gameWrites,0);
});
test('editor cannot self approve, and approval only reaches owner review',()=>{
 const s=screenGameHorseName({world,state,brief:brief(),proposal});
 assert.throws(()=>recordGameNameEditorialDecision(s,{editorId:'WRITER-A',verdict:'SEND_TO_OWNER',notes:'Good grounded suggestion with story'}));
 const v=recordGameNameEditorialDecision(s,{editorId:'EDITOR-B',verdict:'SEND_TO_OWNER',notes:'The name is genuinely tied to the source story.'});
 assert.equal(v.status,'PENDING_OWNER_REVIEW');assert.equal(v.registrationStatus,'NOT_RELEASED');
});
test('protects historical and previously rated horse identities',()=>{
 const b=brief();
 assert.ok(screenGameHorseName({world,state,brief:b,proposal:{...proposal,name:'Historical Champion'}}).reasons.includes('NAME_ALREADY_USED_OR_REVIEWED'));
 assert.ok(screenGameHorseName({world,state,brief:b,proposal:{...proposal,name:'Midnight Lantern'},reviewedNames:['Midnight Lantern']}).reasons.includes('NAME_ALREADY_USED_OR_REVIEWED'));
});
test('rejects unsupported names, empty explanations and spoofed story source',()=>{
 const b=brief();
 const bad=screenGameHorseName({world,state,brief:b,proposal:{...proposal,name:'X'.repeat(19),evidenceId:'MADEUP',explanation:'y'}});
 assert.ok(bad.reasons.includes('REGISTRATION_NAME_FORMAT'));
 assert.ok(bad.reasons.includes('UNVERIFIED_STORY_ANCHOR'));
 assert.ok(bad.reasons.includes('UNEXPLAINED_NAME'));
});

test('player naming story persists with identity and is used on the next brief',()=>{
 const state2={...state,clock:{date:'1999-01-01'},player:{role:'owner',operation_id:'O-OWNER'},
  runtime:{horse_naming:createHorseNamingRuntime()},event_log:[]};
 let event=null;
 recordHorseNamingStoryAction({state:state2,world,command:{type:'RECORD_HORSE_NAMING_STORY',actor:'player',
  payload:{horse,story_id:'OWNER-STORY-01',story:story.story}},emit:(kind,details)=>{event={kind,details}}});
 assert.equal(event.kind,'HORSE_NAMING_STORY_RECORDED');
 assert.equal(Object.keys(state2.runtime.horse_naming.stories_by_id).length,1);
 assert.equal(buildGameHorseNamingBrief({world,state:state2,horse}).status,'READY_FOR_ORIGINAL_NAME_WRITING');
 validateHorseNamingRuntime(state2,world);
});
test('only the real owner can author a persistent naming story',()=>{
 const state2={...state,clock:{date:'1999-01-01'},player:{role:'owner',operation_id:'O-OTHER'},
  runtime:{horse_naming:createHorseNamingRuntime()},event_log:[]};
 assert.throws(()=>recordHorseNamingStoryAction({state:state2,world,
  command:{type:'RECORD_HORSE_NAMING_STORY',actor:'player',
  payload:{horse,story_id:'OWNER-STORY-01',story:story.story}},emit:()=>{}}));
 assert.equal(Object.keys(state2.runtime.horse_naming.stories_by_id).length,0);
});