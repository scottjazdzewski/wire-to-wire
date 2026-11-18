import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planV10SavedHorseNamingDecision,validateRunWithSavedWorldEdits}
 from '../public/next/1999-saved-career-horse-naming.mjs';
import {createNamingFeedback} from '../src/game/horse-naming-feedback-v489.js';
import {createCareerWorldEdits,applyCareerWorldEdits}
 from '../public/next/1999-career-world-edits.mjs';
import {createNamingDeskController}
 from '../public/next/1999-naming-desk.mjs';

const primary='H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000001';
const secondary='H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000002';
function fixture(){
 return {world:{entities:{horses:[
  {id:primary,name:'Old Runner',ownerId:'O-PLAYER',status:'RACING',sireId:'S-01',damId:'D-01'},
  {id:secondary,name:'Golden Branch',ownerId:'O-OTHER',status:'RACING',sireId:'S-02',damId:'D-02'}
 ],people:[],organizations:[],tracks:[]}},run:{
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
test('V10 commercial manager writes naming feedback and horse edits in one committed save, with read-back',()=>{
 const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const manager=read('public/next/1999-commercial-career-manager.mjs');
 const desk=read('public/next/1999-naming-desk.mjs');
 for(const expected of ['planV10SavedHorseNamingDecision',
  'commitSavedCareerHorseNamingPreference',
  'getSavedCareerNamingFeedback',
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
