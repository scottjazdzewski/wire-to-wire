import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {WORLD_SCHEMA,dispatchGameCommand,importGameSave,exportGameSave,
 getTrainerManagementRequests} from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';

const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const read=p=>JSON.parse(file(p));
const directory=read('public/data/wtw-1999-founding-directory-v1.json');
const trainers=read('public/data/wtw-1999-trainer-pilot-v1.json');
const jockeys=read('public/data/wtw-1999-jockey-pilot-v1.json');
const cohort=read('data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...directory.people,...trainers.trainers,...jockeys.jockeys].
 map(p=>[p.id,p])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'TRAINER-MANAGEMENT-DESK-BRIDGE-QA',
  source:'ISOLATED_GAMEPLAY_UI_BRIDGE_NOT_HISTORICAL',
  sha256:createHash('sha256').update('trainer-desk-v1').digest('hex')},
 entities:{horses:directory.horses,organizations:directory.organizations,
  people,tracks:directory.tracks}};
const fresh=()=>build1999PilotGameRun({world,manifest:cohort,jockeys:jockeys.jockeys});
const command=(state,id,type,payload={},actor='system')=>dispatchGameCommand({
 state,world,command:{id,type,payload,actor}});
const day=s=>command(s,'desk:day:'+s.clock.date,'ADVANCE_DAY').state;
const sourceRead=file('public/next/office-direct-read.js');
const sourceCmd=file('public/next/office-direct-command.js');
const sourceUI=file('public/next/next.js');
const sourcePlaytest=file('public/1999/game/playtest-service.mjs');
function ui(){
 const window={__WTW_1999_MANAGEMENT__:{mode:'FOUNDING_1999'},location:{search:'?playtest=38'}};
 const module={exports:{}};
 const vmContext={window,module,Promise,Error,String,Number,Object,Date,URLSearchParams};
 vm.runInNewContext(sourceRead,vmContext,{filename:'office-direct-read.js'});
 const readAPI=module.exports;
 module.exports={};
 vm.runInNewContext(sourceCmd,vmContext,{filename:'office-direct-command.js'});
 return {window,readAPI,commands:module.exports};
}
function careRequest(){
 let s=day(fresh());
 const h=Object.values(s.runtime.registered_horses.by_id).find(h=>
  h.owner_organization_id===s.player.operation_id);
 assert.ok(h);
 const old=s.runtime.horse[h.horse_id].policy;
 s=command(s,'desk:budget:zero','SET_HORSE_CARE_POLICY',{
  horse_id:h.horse_id,policy:{...old,monthly_budget_minor:0}},'player').state;
 s=day(s);
 const projection=getTrainerManagementRequests(s,s.player.operation_id);
 const request=projection.pending.find(x=>x.horse_id===h.horse_id);
 assert.ok(request,'Source-unfunded care must create an actual player request');
 return {s,h,request};
}
test('playtest service exposes the canonical read-only request selector with durable submit',()=>{
 assert.match(sourcePlaytest,/getTrainerManagementRequests/);
 assert.match(sourcePlaytest,/getTrainerManagementRequests\(state,/);
 assert.match(sourcePlaytest,/getTrainerManagementRequests\(\)\{return engine\.getTrainerManagementRequests\(\)\}/);
 assert.match(sourcePlaytest,/await transact\(db,'readwrite',engine\.getSave\(\)\)/);
 assert.match(sourceUI,/__WTW_OFFICE_DIRECT_READ__\.trainerRequests\(game,requests\)/);
 assert.match(sourceUI,/data-ng="answer-trainer-request"/);
 assert.match(sourceUI,/ANSWER_TRAINER_MANAGEMENT_REQUEST/);
 assert.doesNotMatch(sourceRead,/\bdocument\b|\blocalStorage\b|\bfetch\s*\(|\.innerHTML\b/);
 assert.doesNotMatch(sourceCmd,/\bdocument\b|\blocalStorage\b|\bindexedDB\b|\.click\s*\(/);
});
test('actual player care request is a live Inbox/Desk case with exact owner, horse and choices',()=>{
 const {s,h,request}=careRequest(),{readAPI}=ui();
 const saved=JSON.stringify(s);
 const projected=readAPI.trainerRequests(s,getTrainerManagementRequests(s,s.player.operation_id));
 assert.equal(projected.length,1);
 const file=projected[0];
 assert.equal(file.message.case,request.id);
 assert.equal(file.message.urgent,true);
 assert.equal(file.message.resolved,false);
 assert.ok(file.message.title.includes(h.registered_name));
 assert.equal(file.desk.type,'TRAINER MANAGEMENT REQUEST');
 assert.deepEqual(JSON.parse(JSON.stringify(file.desk.moves.map(x=>[x.optionId,x.requestId]))),
  [['ACCEPT',request.id],['COUNTER',request.id],['DECLINE',request.id]]);
 assert.match(file.desk.summary,/unfunded care/i);
 assert.equal(JSON.stringify(s),saved,'UI projection must not mutate the real engine state');
 assert.equal(readAPI.trainerRequests(undefined,undefined).length,0);
 const opponent=getTrainerManagementRequests(s,'O-FAKE');
 assert.equal(readAPI.trainerRequests(s,opponent).length,0,
  'No non-player-owner request can leak into the player\'s Desk');
});
test('a valid owner action runs the canonical command, updates the Desk and round-trips the career save',async()=>{
 const {s,request}=careRequest(),{window,readAPI,commands}=ui();
 let state=s,calls=0;
 window.__WTW_1999_UI_DATA__={gameplayService:{
  get state(){return state},
  submit(type,payload,actor){
   calls++;
   const out=command(state,'desk:owner:'+calls,type,payload,actor);
   state=out.state;return Promise.resolve(out);
  }
 }};
 const files=readAPI.trainerRequests(state,getTrainerManagementRequests(state,state.player.operation_id));
 assert.equal(files.length,1);
 const result=await commands.dispatch('ANSWER_TRAINER_MANAGEMENT_REQUEST',{
  request_id:request.id,choice:'ACCEPT'});
 assert.equal(result.duplicate,false);
 assert.equal(calls,1);
 const resolved=readAPI.trainerRequests(state,
  getTrainerManagementRequests(state,state.player.operation_id));
 assert.equal(resolved.length,1);
 assert.equal(resolved[0].message.resolved,true);
 assert.equal(resolved[0].desk.moves.length,0);
 assert.match(resolved[0].desk.receipt.choiceTitle,/enhanced funded care/i);
 assert.deepEqual(importGameSave(exportGameSave(state,world),world),state);
 assert.throws(()=>commands.dispatch('ANSWER_TRAINER_MANAGEMENT_REQUEST',{
  request_id:request.id,choice:'DECLINE'}),/no longer available/i);
});
test('trainer management command rejects forged authority, stale requests and concurrent responses',async()=>{
 const {s,request}=careRequest(),{window,commands}=ui();
 let finish,calls=0;
 window.__WTW_1999_UI_DATA__={gameplayService:{state:s,submit:()=>{
  calls++;return new Promise(resolve=>finish=resolve);
 }}};
 assert.throws(()=>commands.dispatch('ANSWER_TRAINER_MANAGEMENT_REQUEST',{
  request_id:request.id,choice:'GIVE_BONUS'}),/Invalid trainer management decision/);
 assert.throws(()=>commands.dispatch('ANSWER_TRAINER_MANAGEMENT_REQUEST',{
  request_id:'__proto__',choice:'ACCEPT'}),/no longer available/i);
 const first=commands.dispatch('ANSWER_TRAINER_MANAGEMENT_REQUEST',{
  request_id:request.id,choice:'COUNTER'});
 assert.throws(()=>commands.dispatch('ANSWER_TRAINER_MANAGEMENT_REQUEST',{
  request_id:request.id,choice:'DECLINE'}),/already being saved/i);
 assert.equal(calls,1);
 finish('persisted');
 assert.equal(await first,'persisted');
 const empty=ui().commands;
 assert.throws(()=>empty.dispatch('ANSWER_TRAINER_MANAGEMENT_REQUEST',{
  request_id:request.id,choice:'ACCEPT'}),/require an active playable 1999 career/i);
 const wrong=ui(),fake=structuredClone(s);
 fake.player.operation_id='O-OTHER';
 wrong.window.__WTW_1999_UI_DATA__={gameplayService:{state:fake}};
 assert.throws(()=>wrong.commands.dispatch('ANSWER_TRAINER_MANAGEMENT_REQUEST',{
  request_id:request.id,choice:'ACCEPT'}),/no longer available/i);
});

test('failed persistence unlocks the trainer request for a safe retry',async()=>{
 const {s,request}=careRequest(),{window,commands}=ui();
 let attempts=0;
 window.__WTW_1999_UI_DATA__={gameplayService:{state:s,submit:()=>{
  attempts++;
  return attempts===1?Promise.reject(Error('IndexedDB transaction failed')):
   Promise.resolve('saved');
 }}};
 await assert.rejects(commands.dispatch('ANSWER_TRAINER_MANAGEMENT_REQUEST',{
  request_id:request.id,choice:'ACCEPT'}),/IndexedDB transaction failed/);
 assert.equal(await commands.dispatch('ANSWER_TRAINER_MANAGEMENT_REQUEST',{
  request_id:request.id,choice:'ACCEPT'}),'saved');
 assert.equal(attempts,2);
});
