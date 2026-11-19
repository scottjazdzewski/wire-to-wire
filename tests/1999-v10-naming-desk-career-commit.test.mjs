import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planV10SavedHorseNamingDecision,validateRunWithSavedWorldEdits,
 buildV10OwnerHorseNamingBrief,previewV10OwnerHorseNames,
 projectCareerSavedHorseName}
 from '../public/next/1999-saved-career-horse-naming.mjs';
import {createNamingFeedback,nameFeedbackKey} from '../src/game/horse-naming-feedback-v489.js';
import {screenGameHorseName} from '../src/game/horse-naming-bridge.js';
import {createCareerWorldEdits,applyCareerWorldEdits}
 from '../public/next/1999-career-world-edits.mjs';
import {createNamingDeskController}
 from '../public/next/1999-naming-desk.mjs';

const primary='H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000001';
const secondary='H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000002';
function fixture(){
 return {world:{entities:{horses:[
  {id:primary,name:'Old Runner',ownerId:'O-PLAYER',breederId:'O-BREEDER',
   status:'RACING',foalYear:1996,sireId:'S-01',damId:'D-01'},
  {id:secondary,name:'Golden Branch',ownerId:'O-OTHER',breederId:'O-BREEDER',
    status:'RACING',foalYear:1996,sireId:'S-02',damId:'D-02'}
 ],people:[],organizations:[
  {id:'O-PLAYER',name:'Actual Stable'},
  {id:'O-OTHER',name:'Rival Stable'},
  {id:'O-BREEDER',name:'Actual Stud'}],tracks:[]}},run:{
  player:{role:'owner',operation_id:'O-PLAYER'},stable_horse_ids:['REG-01'],
  runtime:{registered_horses:{by_id:{'REG-01':{
   horse_id:'REG-01',world_source_horse_id:primary,name:'Old Runner',
   registered_name:'Old Runner',sire_id:'S-01',dam_id:'D-01'
  }}}}
 }};
}
const payload=(name,decision='KEEP',horseId='')=>({
 name,decision,motif_id:'story-memory',horse_id:horseId,prompt:'subtle, conversational'
});
test('V10 owner Keep, Reject and Choose use a SINGLE saved-career feedback/identity plan',()=>{
 const {world,run}=fixture();
 const before=JSON.stringify({world,run}),empty=createCareerWorldEdits();
 const keep=planV10SavedHorseNamingDecision({
  world,run,worldEdits:empty,namingFeedback:createNamingFeedback(),
  payload:payload('Monday Calling')
 });
 assert.equal(keep.identityUpdated,false);
 assert.equal(keep.feedback.decisions.mondaycalling.decision,'KEEP');
 assert.equal(Object.keys(keep.edits.byId).length,0);
 const reject=planV10SavedHorseNamingDecision({
  world,run,worldEdits:keep.edits,namingFeedback:keep.feedback,
  payload:payload('Plain Traffic','REJECT')
 });
 const chosen=planV10SavedHorseNamingDecision({
  world,run,worldEdits:reject.edits,namingFeedback:reject.feedback,
  payload:payload('Second Wind','CHOOSE',primary)
 });
 assert.equal(chosen.identityUpdated,true);
 assert.equal(chosen.feedback.revision,3);
 assert.equal(chosen.feedback.decisions.secondwind.horseId,primary);
 assert.equal(chosen.edits.byId['horse:'+primary].name,'Second Wind');
 assert.equal(chosen.externalRegistrationApproved,false);
 assert.equal(JSON.stringify({world,run}),before,'planning never alters live game state');
 const replay=fixture();
 assert.equal(applyCareerWorldEdits(replay.world,chosen.edits,{run:replay.run}).applied,1);
 assert.equal(replay.world.entities.horses[0].name,'Second Wind');
 assert.equal(replay.run.runtime.registered_horses.by_id['REG-01'].registered_name,
  'Second Wind');
 assert.equal(replay.world.entities.horses[0].sireId,'S-01');
 assert.equal(replay.world.entities.horses[0].damId,'D-01');
 assert.equal(replay.world.entities.horses[0].ownerId,'O-PLAYER');
});
test('V10 name choice rejects other owners, existing world names, near duplicates, reviewed exclusions',()=>{
 const {world,run}=fixture();
 const make=p=>planV10SavedHorseNamingDecision({
  world,run,worldEdits:createCareerWorldEdits(),
  namingFeedback:createNamingFeedback(),payload:p
 });
 assert.throws(()=>make(payload('Bright Path','CHOOSE',secondary)),
  /owned by the current player/);
 assert.throws(()=>make(payload('Golden-Branch','CHOOSE',primary)),
  /conflicts with an existing world horse/);
 assert.throws(()=>make(payload('Golden Branch','KEEP')),
  /conflicts with an existing world horse/);
 assert.throws(()=>make(payload('Another Epilogue')),
  /Previously owner-reviewed/);
 assert.throws(()=>make(payload('No Permission','CHOOSE','UNKNOWN')),
  /owned by the current player/);
 const denied=fixture();
 denied.run.player={role:'trainer',operation_id:'O-PLAYER'};
 assert.throws(()=>planV10SavedHorseNamingDecision({
  ...denied,payload:payload('Nice Name')
 }),/owner career/);
});
test('V10 validator sees edited run and source without rewriting original 300k directory rows',()=>{
 const {world,run}=fixture(),before=JSON.stringify({world,run});
 const plan=planV10SavedHorseNamingDecision({
  world,run,payload:payload('A Better Story','CHOOSE',primary)
 });
 let called=0;
 assert.equal(validateRunWithSavedWorldEdits(world,run,plan.edits,(actual,source)=>{
  called++;
  assert.equal(actual.runtime.registered_horses.by_id['REG-01'].registered_name,
   'A Better Story');
  assert.equal(source.entities.horses[0].name,'A Better Story');
  assert.equal(source.entities.horses[1],world.entities.horses[1],
   'unchanged 300k source rows must remain shared, not deeply copied');
 }),true);
 assert.equal(called,1);
 assert.equal(JSON.stringify({world,run}),before);
});
test('Naming Desk CHOOSE visibly confirms actual V10 saved horse identity, not only an unregistered preference',async()=>{
 const base=fixture();
 let current=createNamingFeedback(),edits=createCareerWorldEdits();
 const desk=createNamingDeskController({
  loadFeedback:()=>current,gameplayActive:()=>true,
  getTargets:()=>[{id:primary,name:'Old Runner'}],
  commitGameplay:async p=>{
   const next=planV10SavedHorseNamingDecision({
    ...base,worldEdits:edits,namingFeedback:current,payload:p
   });
   current=next.feedback;edits=next.edits;
   return {identityUpdated:next.identityUpdated};
  }
 });
 for(const [key,value] of Object.entries({
  ownerName:'Farm Owner',breederName:'Breeding Farm',foalingYear:'1996',
  story:'On a calm night the mare gave birth during a strong storm while the farm lights failed; the groom remembered every sound.'
 }))desk.setField(key,value);
 assert.equal(desk.generate(),true);
 desk.setField('targetHorseId',primary);
 const chosen=desk.snapshot().results[0].name;
 assert.equal(await desk.action('naming-choose',chosen),true);
 assert.match(desk.snapshot().notice,/now this horse’s name in your saved career/);
 assert.equal(current.decisions[chosen.toLowerCase().replace(/[^a-z0-9]/g,'')].horseId,
  primary);
 assert.equal(edits.byId['horse:'+primary].name,chosen);
});
test('V10 Naming Desk excludes names already assigned in the real 300k world',()=>{
 const story='On a calm night the mare gave birth in a thunderstorm. The groom remembered the rain, the sound of a bell, and a light above the paddock.';
 const fields={ownerName:'Stable Owner',breederName:'Breeding Farm',
  foalingYear:'1996',story};
 const make=options=>{
  const desk=createNamingDeskController(options);
  for(const [key,value] of Object.entries(fields))desk.setField(key,value);
  return desk;
 };
 const before=make();
 assert.equal(before.generate(),true);
 const alreadyNamed=before.snapshot().results[0].name;
 const active=make({nameInUse:name=>name===alreadyNamed});
 assert.equal(active.generate(),true);
 assert.ok(active.snapshot().results.every(x=>x.name!==alreadyNamed),
  'a name used by the 300k opening world must not appear as available');
 assert.ok(active.snapshot().results.length>0);
});

test('Industry inspection and browse show saved name without changing shared source',()=>{
 const source={id:primary,name:'Old Runner',ownerId:'O-PLAYER',
  sireId:'S-01',damId:'D-01',foalYear:1996};
 const saved={schema:'WTW_CAREER_WORLD_EDITS_V1',byId:{
  ['horse:'+primary]:{name:'A Better Story'}
 }};
 const out=projectCareerSavedHorseName(source,saved);
 assert.equal(out.name,'A Better Story');
 assert.equal(out.nameDisplaySource,'SAVED_CAREER_HORSE_NAME_OVERRIDE');
 assert.equal(out.id,primary);
 assert.equal(out.sireId,'S-01');
 assert.equal(out.damId,'D-01');
 assert.equal(out.ownerId,'O-PLAYER');
 assert.equal(source.name,'Old Runner');
 assert.notEqual(source,out,'the base 1999 record may not be edited in place');
 assert.strictEqual(projectCareerSavedHorseName(source,createCareerWorldEdits()),
  source,'without an active career override, return the identical source record');
 assert.equal(projectCareerSavedHorseName(null,saved),null);
 const manager=readFileSync(new URL('../public/next/1999-commercial-career-manager.mjs',
  import.meta.url),'utf8');
 assert.match(manager,/function projectActiveIndustryHorse\(/);
 assert.match(manager,/kind==='horseBatches'\?projectActiveIndustryHorse\(entry\):entry/);
 assert.match(manager,/return projectActiveIndustryHorse\(await readPersistent1999HorseProfile/);
});

test('V10 previews use real player horse, actual owner and breeder, and only authored owner evidence',()=>{
 const {world,run}=fixture();
 const story='On the evening this colt was born a heavy thunderstorm hit the farm. The mare stood calm in the barn while the rain sounded on the roof.';
 const brief=buildV10OwnerHorseNamingBrief({world,run,horseId:primary,story});
 assert.equal(brief.horseId,primary);
 assert.equal(brief.owner.name,'Actual Stable');
 assert.equal(brief.breeder.name,'Actual Stud');
 assert.equal(brief.foalingYear,1996);
 assert.equal(brief.evidence[0].detail,story);
 assert.equal(brief.evidence[0].kind,'OWNER_ATTESTED');
 assert.match(brief.evidence[0].sourceRef,/owner_story_draft/);
 assert.doesNotMatch(JSON.stringify(brief),/NAMINGLAB|FAKE_PARENT|MADE_UP_SIRE/);
 const a=previewV10OwnerHorseNames({world,run,horseId:primary,story,count:8});
 const b=previewV10OwnerHorseNames({world,run,horseId:primary,story,count:8});
 assert.deepEqual(a,b,'the same saved horse and owner story replay deterministically');
 assert.equal(a.horseId,primary);
 assert.equal(a.ownerId,'O-PLAYER');
 assert.equal(a.breederId,'O-BREEDER');
 assert.ok(a.screened.length>0);
 assert.ok(a.screened.every(x=>x.horseId===primary));
 assert.ok(a.screened.every(x=>x.status==='AWAITING_INDEPENDENT_EDITOR'));
 assert.ok(a.screened.every(x=>x.evidenceQuote.length>=12));
 assert.equal(a.approvedForRegistration,false);
 assert.equal(a.gameWrites,0);
 assert.equal(a.requestCount,0);
 assert.throws(()=>buildV10OwnerHorseNamingBrief({world,run,horseId:secondary,story}),
  /not owned by the current player/);
 assert.throws(()=>buildV10OwnerHorseNamingBrief({world,run,horseId:primary,story:'storm'}),
  /35/);
});

test('indexed 300k-world collision screening matches the legacy full-world scan',()=>{
 const {world,run}=fixture();
 const story='The owner watched the mare give birth during a heavy storm. Thunder echoed across the paddock while the calm horse stood in the barn.';
 const brief=buildV10OwnerHorseNamingBrief({world,run,horseId:primary,story});
 const registeredNameKeys=new Set(world.entities.horses.map(h=>
  nameFeedbackKey(h.name)));
 const inputs=['Golden Branch','New Bright Light'];
 for(const name of inputs){
  const args={world,state:run,brief,proposal:{
   name,evidenceId:brief.evidence[0].id,
   explanation:'This name refers to the thunder and the remembered birth in the source barn.',
   writer_id:'V492_TEST_EDITOR'}};
  const old=screenGameHorseName(args);
  const indexed=screenGameHorseName({...args,registeredNameKeys});
  assert.deepEqual(indexed,old,name+' indexed result must be identical');
 }
 assert.throws(()=>screenGameHorseName({
  world,state:run,brief,proposal:{
   name:'Independent Call',evidenceId:brief.evidence[0].id,
   explanation:'The recorded storm anchors the horse-specific name here.',
   writer_id:'V492_TEST_EDITOR'},
  registeredNameKeys:[...registeredNameKeys]
 }),/must be a Set/);
 const plain=previewV10OwnerHorseNames({world,run,horseId:primary,story,count:8});
 const optimized=previewV10OwnerHorseNames({
  world,run,horseId:primary,story,count:8,registeredNameKeys
 });
 assert.deepEqual(optimized,plain,'preview cannot change when indexed');
});

test('V10 naming controller uses a real horse preview instead of the fictional test-horse scenario',()=>{
 const {world,run}=fixture();
 let calls=0;
 const desk=createNamingDeskController({
  savedCareerActive:()=>true,
  getTargets:()=>[{id:primary,name:'Old Runner'}],
  previewSavedCareer:params=>{
   calls++;
   assert.equal(params.horseId,primary);
   return previewV10OwnerHorseNames({...params,world,run});
  }
 });
 desk.setField('targetHorseId',primary);
 desk.setField('story','A violent thunderstorm brought heavy rain as the calm mare delivered the foal in the stable. The owner listened to the rain strike the gate.');
 assert.equal(desk.generate(),true);
 assert.equal(calls,3);
 assert.ok(desk.snapshot().results.every(x=>x.horseId===primary));
 assert.ok(desk.snapshot().allResults.every(x=>x.origin==='SAVED_OWNER_HORSE_STORY'));
 desk.setField('targetHorseId','');
 assert.equal(desk.snapshot().allResults.length,0,
  'switching target must never reuse another horse’s named story');
 assert.equal(desk.generate(),false);
 assert.match(desk.snapshot().error,/Select a horse you own/);
});

test('V10 chosen name carries real owner story alongside persistent horse edit and feedback',()=>{
 const {world,run}=fixture();
 const story='The mare delivered in a thunderstorm as rain swept the quiet barn. The owner stood beside her all evening and remembered the first movement of her foal.';
 const plan=planV10SavedHorseNamingDecision({world,run,payload:{
  ...payload('One More Rain','CHOOSE',primary),story
 }});
 assert.equal(plan.ownerStory.horseId,primary);
 assert.equal(plan.ownerStory.ownerId,'O-PLAYER');
 assert.equal(plan.ownerStory.breederId,'O-BREEDER');
 assert.equal(plan.ownerStory.foalingYear,1996);
 assert.equal(plan.ownerStory.story,story);
 assert.equal(plan.ownerStory.basis,
  'OWNER_AUTHORED_STORY_SUBMITTED_IN_SAVED_CAREER');
 assert.equal(plan.externalRegistrationApproved,false);
 assert.throws(()=>planV10SavedHorseNamingDecision({world,run,payload:{
  ...payload('One More Rain','CHOOSE',primary),story:'not enough'
 }}),/35/);
});

test('V10 commercial manager writes naming feedback and horse edits in one committed save, with read-back',()=>{
 const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const manager=read('public/next/1999-commercial-career-manager.mjs');
 const desk=read('public/next/1999-naming-desk.mjs');
 for(const expected of ['planV10SavedHorseNamingDecision',
  'commitSavedCareerHorseNamingPreference',
  'getSavedCareerNamingFeedback',
  'previewSavedCareerHorseNames',
  'namingOriginStories',
  'isSavedCareerHorseNameInUse',
  'namingFeedback:prepared.feedback',
  'worldEdits:prepared.edits',
  'Horse naming decision did not survive durable read-back',
  'validateRunWithSavedWorldEdits'])
  assert.ok(manager.includes(expected),'missing saved-career naming contract: '+expected);
 assert.match(desk,/savedWorldNaming/);
 assert.match(desk,/commitSavedCareerHorseNamingPreference/);
 assert.match(desk,/sourceHorseId/);
 assert.doesNotMatch(desk,/\/api\/naming\/preview/);
});
