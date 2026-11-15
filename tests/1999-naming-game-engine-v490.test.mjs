import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WORLD_SCHEMA,createGameRun,dispatchGameCommand,validateGameRun,
 exportGameSave,importGameSave} from '../src/game/index.js';
import {createNamingFeedback,recordNamingFeedback} from '../src/game/horse-naming-feedback-v489.js';
import {createNamingDeskController} from '../public/next/1999-naming-desk.mjs';

const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'WTW-FEEDBACK-V490-TEST',source:'TEST ONLY',sha256:'b'.repeat(64)},
 entities:{horses:[{id:'H-CANON-1',name:'Historic Ace',owner_organization_id:'O-OWNER-A'}],
 people:[],tracks:[],organizations:[
 {id:'O-OWNER-A',name:'Owner A'},{id:'O-OWNER-B',name:'Owner B'}]}};
const make=()=>createGameRun({world,runId:'WTW-RUN-NAMING-V490',seed:1999,
 player:{role:'owner',involvement:'balanced',operation_id:'O-OWNER-A'},
 stableHorseIds:['H-CANON-1']});
const command=(id,name,decision,horse_id='')=>({id,type:'OWNER_SET_HORSE_NAMING_PREFERENCE',
 actor:'player',payload:{name,decision,motif_id:'story-memory',
 prompt:'short, interesting, and understated',horse_id}});
const apply=(state,c)=>dispatchGameCommand({world,state,command:c});
test('V490 naming preferences are official deterministic game commands with durable save and journal',()=>{
 const original=make(),snapshot=JSON.stringify(world);
 const keep=apply(original,command('NAME:001','Blue Hour','KEEP'));
 assert.equal(keep.events[0].kind,'HORSE_NAMING_PREFERENCE_RECORDED');
 assert.equal(keep.events[0].details.registration_status,'NOT_RELEASED');
 assert.equal(keep.state.runtime.horse_naming.feedback.revision,1);
 assert.equal(original.runtime.horse_naming.feedback.revision,0,'immutable original');
 const reject=apply(keep.state,command('NAME:002','Unwanted Bell','REJECT'));
 const choose=apply(reject.state,command('NAME:003','North Window','CHOOSE','H-CANON-1'));
 assert.equal(choose.state.runtime.horse_naming.feedback.revision,3);
 assert.deepEqual(Object.values(choose.state.runtime.horse_naming.feedback.decisions)
  .map(x=>x.decision),['KEEP','REJECT','CHOOSE']);
 assert.equal(choose.state.runtime.horse_naming.feedback.decisions.northwindow.horseId,'H-CANON-1');
 assert.equal(choose.state.runtime.horse_naming.feedback.decisions.northwindow.name,'North Window');
 assert.equal(choose.state.runtime.registered_horses.by_id['H-CANON-1'],undefined);
 assert.equal(world.entities.horses[0].name,'Historic Ace','protected world never rewritten');
 validateGameRun(choose.state,world);
 assert.deepEqual(importGameSave(exportGameSave(choose.state,world),world),choose.state);
 assert.deepEqual(apply(choose.state,command('NAME:003','North Window','CHOOSE','H-CANON-1')).state,choose.state);
 assert.equal(JSON.stringify(world),snapshot);
});
test('owner authorization, cross-owner, collision and permanently rejected names fail closed',()=>{
 const start=make();
 assert.throws(()=>apply(start,{...command('NAME:010','Blue Hour','KEEP'),actor:'system'}),e=>e.code==='NAMING_FEEDBACK_AUTH');
 assert.throws(()=>apply(start,command('NAME:011','North Window','CHOOSE','H-OTHER')),e=>e.code==='NAMING_FEEDBACK_HORSE');
 assert.throws(()=>apply(start,command('NAME:012','Historic Ace','CHOOSE','H-CANON-1')),e=>e.code==='NAMING_FEEDBACK_COLLISION');
 assert.throws(()=>apply(start,command('NAME:012B','Historic Ace','KEEP')),e=>e.code==='NAMING_FEEDBACK_COLLISION');
 assert.throws(()=>apply(start,command('NAME:013','Blue Hour','KEEP','H-CANON-1')),e=>e.code==='NAMING_FEEDBACK_HORSE');
 const rejected=apply(start,command('NAME:014','Blue Hour','REJECT')).state;
 assert.throws(()=>apply(rejected,command('NAME:015','Blue Hour','KEEP')),/permanently rejected/i);
 const chosen=apply(start,command('NAME:016','North Window','CHOOSE','H-CANON-1')).state;
 assert.throws(()=>apply(chosen,command('NAME:017','Fresh Echo','CHOOSE','H-CANON-1')),/already has a selected name/);
 assert.equal(start.event_log.length,0);
});
test('tampered saved preferences fail full game-run validation; old game saves without feedback remain readable',()=>{
 const state=make(),old=structuredClone(state);delete old.runtime.horse_naming.feedback;
 validateGameRun(old,world);
 const bad=structuredClone(state);bad.runtime.horse_naming.feedback.revision=9;
 assert.throws(()=>validateGameRun(bad,world),/Invalid saved naming preference history/);
});
test('game core and bundled desktop module pairs are byte-identical',()=>{
 for(const path of ['kernel.js','horse-naming-bridge.js']){
  const source=readFileSync(new URL('../src/game/'+path,import.meta.url),'utf8');
  const browser=readFileSync(new URL('../public/1999/game/'+path,import.meta.url),'utf8');
  assert.equal(source,browser,path);
 }
});
test('Naming Desk waits until real async career commit before showing success',async()=>{
 let ledger=createNamingFeedback(),release;
 const gate=new Promise(resolve=>{release=resolve});
 const desk=createNamingDeskController({
  loadFeedback:()=>ledger,
  gameplayActive:()=>true,
  commitGameplay:async payload=>{
   await gate;
   ledger=recordNamingFeedback(ledger,{name:payload.name,decision:payload.decision,
    motifId:payload.motif_id,horseId:payload.horse_id,prompt:payload.prompt});
  },
  getTargets:()=>[{id:'H-CANON-1',name:'Historic Ace'}]
 });
 for(const [field,value] of Object.entries({ownerName:'Owner A',breederName:'Breeder B',
  foalingYear:'1996',story:'The farm lost electric power during a violent storm. The owner found the mare by listening to her calm, steady breathing in the dark barn.'}))
  desk.setField(field,value);
 assert.equal(desk.generate(),true);
 const name=desk.snapshot().results[0].name;
 const pending=desk.action('naming-keep',name);
 assert.equal(ledger.revision,0);
 assert.doesNotMatch(desk.snapshot().notice,/saved to the game/);
 release();
 assert.equal(await pending,true);
 assert.equal(ledger.revision,1);
 assert.match(desk.snapshot().notice,/saved to the game/);
});
