import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 WORLD_SCHEMA,createGameRun,dispatchGameCommand,exportGameSave,importGameSave,
 getPersonView,getPeopleDirectory,getProfessionalOpportunityRanking,auditPeopleReputationCoverage,
 generatePeopleRuntime
} from '../src/game/index.js';

const catalog=JSON.parse(readFileSync(new URL('../public/assets/game/attribute-catalog.v1.json',import.meta.url),'utf8'));
const world=()=>({
 schema:WORLD_SCHEMA,authority:{snapshot_id:'TEST-WTW-1999-REPUTATION',source:'TEST ONLY NOT CANON',sha256:'e'.repeat(64)},
 start_date:'1999-01-01',
 entities:{
  horses:[{id:'H-9999-A',name:'Test Mount'}],
  people:[
   {id:'P-JOCKEY-A',name:'Test Rider A',roles:['jockey']},
   {id:'P-JOCKEY-B',name:'Test Rider B',roles:['jockey']},
   {id:'P-TRAINER-A',name:'Test Trainer',roles:['trainer']},
   {id:'P-BREEDER-A',name:'Test Breeder',roles:['breeder','owner']}
  ],
  organizations:[{id:'O-TEST',name:'Test Stable'}],
  tracks:[{id:'T-TEST',name:'Test Track'}]
 }
});
const initial=()=>createGameRun({world:world(),runId:'WTW-RUN-TEST-REPUTATION',seed:1999,player:{role:'owner',involvement:'balanced',operation_id:'O-TEST'},stableHorseIds:[]});
const send=(s,id,type,payload={},actor='system')=>dispatchGameCommand({
 state:s,world:world(),catalog,command:{id,type,payload,actor}
});
const seed=(s,id,overall,extras={})=>send(s,'base:'+id,'SET_PERSON_REPUTATION',{
 person_id:id,scores:{overall,circuit:overall,owner_trust:overall,professional_trust:overall,market:overall,...extras},
 source_kind:'GENERATED_GAME',source_refs:['TEST_GENERATOR_SEED:1999']
}).state;

test('uninitialized reputation is unknown for every canonical person; no fake starting 50',()=>{
 const s=initial(),records=getPeopleDirectory(s,world(),catalog);
 assert.equal(records.length,4);
 assert.ok(records.every(p=>p.reputation.score===null&&p.reputation.label==='Unrated'));
 assert.equal(records.find(p=>p.id==='P-JOCKEY-A').attributes.find(a=>a.key==='pace_judgment').estimate,null);
 assert.equal(auditPeopleReputationCoverage(s,world(),catalog).ok,false);
 assert.equal(auditPeopleReputationCoverage(s,world(),catalog).missing.length,4);
});

test('only sourced, system-origin baselines can establish profession reputation',()=>{
 const s=initial(),original=JSON.stringify(s);
 assert.throws(()=>send(s,'bad:init','SET_PERSON_REPUTATION',{person_id:'P-JOCKEY-A',scores:{overall:60},source_kind:'GENERATED_GAME',source_refs:['TEST']},'player'),e=>e.code==='UNAUTHORIZED_COMMAND');
 assert.throws(()=>send(s,'bad:unknown','SET_PERSON_REPUTATION',{person_id:'P-NONEXISTENT',scores:{overall:60},source_kind:'GENERATED_GAME',source_refs:['TEST']}),e=>e.code==='UNKNOWN_PERSON');
 assert.throws(()=>send(s,'bad:evidence','SET_PERSON_REPUTATION',{person_id:'P-JOCKEY-A',scores:{overall:60},source_kind:'GENERATED_GAME',source_refs:[]}),e=>e.code==='REPUTATION_EVIDENCE');
 assert.throws(()=>send(s,'bad:score','SET_PERSON_REPUTATION',{person_id:'P-JOCKEY-A',scores:{overall:117},source_kind:'GENERATED_GAME',source_refs:['TEST']}),e=>e.code==='REPUTATION_SCORE');
 assert.equal(JSON.stringify(s),original,'Invalid reputation writes cannot mutate a game save');
});

test('reputation updates follow verified performance, persist and remain idempotent',()=>{
 let s=seed(initial(),'P-JOCKEY-A',60);
 const start=s.runtime.people['P-JOCKEY-A'].reputation.scores.overall;
 const event={person_id:'P-JOCKEY-A',signal:'graded_stakes_win',source_refs:['TEST_RACE_001:OFFICIAL_RESULT']};
 assert.throws(()=>send(s,'rep:bad','RECORD_REPUTATION_SIGNAL',{...event,source_refs:[]}),e=>e.code==='REPUTATION_EVIDENCE');
 const first=send(s,'rep:001','RECORD_REPUTATION_SIGNAL',event);
 assert.equal(first.state.runtime.people['P-JOCKEY-A'].reputation.scores.overall,start+5);
 assert.equal(first.state.runtime.people['P-JOCKEY-A'].reputation.scores.national,undefined,'Unrated axes remain unknown');
 assert.equal(first.events[0].kind,'PERSON_REPUTATION_CHANGED');
 assert.equal(first.state.event_log.at(-1).details.source_refs[0],'TEST_RACE_001:OFFICIAL_RESULT');
 assert.equal(first.state.runtime.people['P-JOCKEY-A'].reputation.history.length,1);
 assert.strictEqual(send(first.state,'rep:001','RECORD_REPUTATION_SIGNAL',event).state,first.state,'Replayed commands cannot double-award reputation');
 const restored=importGameSave(exportGameSave(first.state,world()),world());
 assert.deepEqual(restored,first.state,'Scores and source history survive Save/Load');
});

test('scores contribute to mount, trainer, breeding, sales and buyer rankings but never override eligibility',()=>{
 let s=seed(initial(),'P-JOCKEY-A',70);
 s=seed(s,'P-JOCKEY-B',25);
 s=seed(s,'P-TRAINER-A',65);
 s=seed(s,'P-BREEDER-A',80);
 const jockeyCandidates=[
  {person_id:'P-JOCKEY-A',available:true,eligible:true,ability_fit:.66,relationship_fit:.6,logistics_fit:1},
  {person_id:'P-JOCKEY-B',available:true,eligible:true,ability_fit:.66,relationship_fit:.6,logistics_fit:1}
 ];
 const mounts=getProfessionalOpportunityRanking(s,world(),catalog,{type:'mount'},jockeyCandidates);
 assert.equal(mounts[0].person_id,'P-JOCKEY-A');
 assert.ok(mounts[0].fit_score>mounts[1].fit_score,'A better-known otherwise-equal rider should receive more attention');
 assert.equal(getProfessionalOpportunityRanking(s,world(),catalog,{type:'mount'},jockeyCandidates.map(c=>({...c,available:c.person_id!=='P-JOCKEY-A'})))[0].person_id,'P-JOCKEY-B');
 const betterSkill=getProfessionalOpportunityRanking(s,world(),catalog,{type:'mount'},[
  {...jockeyCandidates[0],ability_fit:.10,relationship_fit:.1,logistics_fit:.1},
  {...jockeyCandidates[1],ability_fit:.99,relationship_fit:.99,logistics_fit:1}
 ]);
 assert.equal(betterSkill[0].person_id,'P-JOCKEY-B','Skills, relationships, geography/availability outweigh fame');
 for(const type of ['training_assignment','mating','sale_consignment','purchase','hiring'])
  assert.ok(getProfessionalOpportunityRanking(s,world(),catalog,{type},[
   {person_id:'P-BREEDER-A',ability_fit:.5,relationship_fit:.5,logistics_fit:.5},
   {person_id:'P-TRAINER-A',ability_fit:.5,relationship_fit:.5,logistics_fit:.5}
  ]).length===2);
 const coverage=auditPeopleReputationCoverage(s,world(),catalog);
 assert.deepEqual(coverage.missing,[]);
 assert.equal(coverage.ok,true);
});

test('person screens show common and role skills without leaking hidden abilities',()=>{
 let s=seed(initial(),'P-JOCKEY-A',47);
 s.runtime.people['P-JOCKEY-A'].latent={pace_judgment:0.95};
 s.runtime.people['P-JOCKEY-A'].observations=[
  {attribute_key:'pace_judgment',status:'estimated',estimate:72,confidence:'medium',evidence_refs:['TEST_RIDE_001']},
  {attribute_key:'traffic_navigation',status:'unassessed'}
 ];
 const view=getPersonView(s,world(),'P-JOCKEY-A',catalog);
 assert.equal(view.reputation.score,47);
 assert.equal(view.reputation.label,'Developing');
 assert.equal(view.attributes.find(x=>x.key==='pace_judgment').estimate,72);
 assert.equal(view.attributes.find(x=>x.key==='traffic_navigation').estimate,null);
 assert.equal(view.attributes.find(x=>x.key==='judgment').estimate,null);
 assert.equal('latent' in view,false);
 assert.equal('pace_judgment' in view,false);
 assert.ok(view.roles.includes('jockey'));
 assert.ok(view.attributes.some(a=>a.label==='Pace Judgment'));
});


test('authorized game creation populates every world person with unique, reproducible skills and reputation',()=>{
 const w=world(),before=JSON.stringify(w);
 const first=createGameRun({world:w,runId:'WTW-RUN-TEST-POP1',seed:2026,
  player:{role:'owner',involvement:'balanced',operation_id:'O-TEST'},
  personGenerationCatalog:catalog});
 const second=createGameRun({world:w,runId:'WTW-RUN-TEST-POP2',seed:117,
  player:{role:'owner',involvement:'balanced',operation_id:'O-TEST'},
  personGenerationCatalog:catalog});
 assert.equal(JSON.stringify(w),before,'Never mutate the immutable canonical world');
 assert.deepEqual(first.runtime.people,second.runtime.people,'World identity determines modeled character, not chosen run seed');
 assert.equal(Object.keys(first.runtime.people).length,w.entities.people.length);
 assert.equal(auditPeopleReputationCoverage(first,w,catalog).ok,true);
 const traits=first.runtime.people['P-JOCKEY-A'].latent;
 assert.equal(typeof traits.pace_judgment,'number');
 assert.ok(traits.pace_judgment>0&&traits.pace_judgment<1);
 assert.equal(first.runtime.people['P-JOCKEY-A'].reputation.source.kind,'GENERATED_GAME');
 assert.equal(first.runtime.people['P-JOCKEY-A'].observations.length,0,'Latent skills remain hidden until observed');
 const people=getPeopleDirectory(first,w,catalog);
 assert.ok(people.every(x=>typeof x.reputation.score==='number'));
 assert.ok(people.every(x=>x.attributes.every(a=>a.estimate===null)),'Players see no fabricated scouting reports');
 assert.equal('latent' in people[0],false);
 const saved=importGameSave(exportGameSave(first,w),w);
 assert.deepEqual(saved.runtime.people,first.runtime.people);
});

test('fictive role-generated people differ in professionalism without conflating initial reputation and skill',()=>{
 const records=generatePeopleRuntime({world:world(),catalog});
 const rider=records['P-JOCKEY-A'],trainer=records['P-TRAINER-A'];
 assert.ok(Object.hasOwn(rider.latent,'traffic_navigation'));
 assert.ok(!Object.hasOwn(trainer.latent,'traffic_navigation'));
 assert.ok(Object.hasOwn(trainer.latent,'conditioning'));
 assert.ok(!Object.hasOwn(rider.latent,'conditioning'));
 assert.equal(rider.reputation.schema,'WTW_PERSON_REPUTATION_V1');
 assert.equal(records['P-BREEDER-A'].roles.includes('owner'),true);
 assert.notDeepEqual(records['P-JOCKEY-A'].latent,records['P-JOCKEY-B'].latent);
 assert.ok(records['P-JOCKEY-A'].reputation.source.refs[0].includes('WTW-GAME-MODEL'));
});
