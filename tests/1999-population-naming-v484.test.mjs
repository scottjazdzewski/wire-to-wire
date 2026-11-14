import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {foalingEventNamingBrief,planPopulationNamingCohorts,auditPopulationNamingResults}
 from '../src/game/horse-naming-population-planner.js';
import {POPULATION_NAMING_BATCH_SIZE,POPULATION_NAMING_SCHEMA,
 buildPopulationModelRequests,validatePopulationRequest,unpackPopulationResponses,
 submitPopulationNamingBatch,getPopulationNamingBatch,pollPopulationNamingBatch}
 from '../src/horse-naming-population-service.js';

const exampleStory='The farm lost electricity in a spring thunderstorm and the night groom followed the mare’s quiet breathing to her newborn foal.';
const brief=(i=1,year=2041)=>foalingEventNamingBrief({horseId:`H-FUTURE-FOAL-${year}-${i}`,
 foalingYear:year,owner:{id:'O-FUTURE-OWNER',name:'Gray Oak Stable'},
 breeder:{id:'O-FUTURE-BREEDER',name:'Cumberland Breeding'},
 event:{kind:'FOALING_EVENT',eventId:`EVENT-FOAL-${year}-${i}`,
 horseId:`H-FUTURE-FOAL-${year}-${i}`,naming_narrative:exampleStory}});
const request=(items=[{brief:brief(1)}],jobId='wtw_POPTEST_2041_000000',year=2041)=>({
 schema:POPULATION_NAMING_SCHEMA,year,jobId,items,recentNames:[]});
const idea=(name='Quiet Breathing')=>({name,evidenceId:'GAME_EVENT:EVENT-FOAL-2041-1',
 evidenceQuote:'the mare’s quiet breathing',
 explanation:'The groom found the mare by following her quiet breathing during the loss of electrical power.'});

class FakeD1{
 constructor(){this.jobs=new Map();this.days=new Map();this.sql=[]}
 prepare(sql){
  const db=this;db.sql.push(sql);
  return {bind(...args){
   return {
    async first(){
     if(sql.startsWith('SELECT * FROM wtw_naming_population_jobs'))return db.jobs.get(args[0])||null;
     if(sql.startsWith('INSERT INTO wtw_naming_ai_daily_usage')){
      const [day,n,cap]=args,old=db.days.get(day)||0;
      if(old+n>cap)return null;
      db.days.set(day,old+n);return {inference_count:old+n};
     }
     throw Error('Unexpected .first query: '+sql);
    },
    async run(){
     if(sql.startsWith('INSERT INTO wtw_naming_population_jobs')){
      const [id,hash,year,count,ids,status]=args;
      if(db.jobs.has(id))throw Error('UNIQUE constraint failed');
      db.jobs.set(id,{job_id:id,payload_sha256:hash,target_year:year,
       requested_count:count,horse_ids_json:ids,status,request_id:null,results_json:null,
       created_at:'2026-11-14 12:00:00'});
      return {success:true};
     }
     if(sql.startsWith('UPDATE wtw_naming_population_jobs')){
      const [status,requestId,results,id]=args,row=db.jobs.get(id);
      if(!row)throw Error('Missing job');
      row.status=status;row.request_id=requestId||row.request_id;
      row.results_json=results||row.results_json;return {success:true};
     }
     throw Error('Unexpected .run query: '+sql);
    }
   };
  }};
 }
}
function setup(model,cap='128'){
 const DB=new FakeD1(),calls=[];
 const AI={run:async(m,p,opts)=>{calls.push({m,p,opts});return model({m,p,opts,calls})}};
 return {DB,AI,calls,NAMING_AI_POPULATION_ENABLED:'true',NAMING_AI_POPULATION_DAILY_CAP:cap};
}

test('requires a source-traceable foaling event; never invents pedigree',()=>{
 const b=brief();assert.equal(b.status,'READY_FOR_ORIGINAL_NAME_WRITING');
 assert.equal(b.namingAuthority,'PROPOSED_FROM_SOURCE_GAME_EVENT_NOT_A_REGISTRATION');
 assert.equal(b.evidence[0].sourceDetails.naming_narrative,exampleStory);
 assert.throws(()=>foalingEventNamingBrief({horseId:b.horseId,foalingYear:2041,owner:b.owner,breeder:b.breeder}),/real foaling record/);
});
test('55,000 game-born foals become 3,438 bounded, deterministic jobs with no model spend',()=>{
 function* population(){for(let i=1;i<=55000;i++)yield brief(i)}
 const batches=planPopulationNamingCohorts(population(),{runId:'RUNNAMING2099',year:2041});
 let count=0,foals=0,first,last;
 for(const job of batches){count++;foals+=job.items.length;
  if(count===1)first=job.jobId;
  last=job;
  assert.ok(job.items.length<=POPULATION_NAMING_BATCH_SIZE);
 }
 assert.equal(count,3438);assert.equal(foals,55000);
 assert.equal(first,'wtw_RUNNAMING2099_2041_000000');
 assert.equal(last.items.length,8);
 assert.equal(last.jobId,'wtw_RUNNAMING2099_2041_003437');
});
test('validates individual source meaning and bounded, duplicate-free batch prompts',()=>{
 const p=request([{brief:brief(1)},{brief:brief(2)}]);
 assert.equal(validatePopulationRequest(p).length,2);
 assert.equal(buildPopulationModelRequests(p).length,2);
 assert.throws(()=>validatePopulationRequest({...p,items:[{brief:brief(1)},{brief:brief(1)}]}),/unique/);
 assert.throws(()=>validatePopulationRequest({...p,year:2042}),/foaling record/);
 assert.throws(()=>validatePopulationRequest({...p,items:Array(17).fill({brief:brief()})}),/1–16/);
});
test('Cloudflare batch result mapping rejects owner-rated and duplicate names',()=>{
 const v={responses:[
  {id:0,success:true,result:{response:JSON.stringify({ideas:[idea('Quiet Breathing'),idea('Mulligan')]})}},
  {id:1,success:true,result:{response:JSON.stringify({ideas:[idea('Quiet Breathing'),idea('Night Watchman')]})}}
 ]};
 const out=unpackPopulationResponses(v,['H-ONE','H-TWO']);
 assert.equal(out.length,2);assert.deepEqual(out.map(x=>x.candidateCount),[1,1]);
 assert.equal(out[0].candidates[0].name,'Quiet Breathing');
 assert.equal(out[1].candidates[0].name,'Night Watchman');
 assert.equal(out[0].approvedForRegistration,false);
});
test('durable idempotency ensures duplicate submit never pays for second model call',async()=>{
 const env=setup(()=>({status:'queued',request_id:'abc-request-001'}));
 const body=request();
 const first=await submitPopulationNamingBatch({env,body});
 assert.equal(first.status,202);assert.equal(first.payload.status,'QUEUED');
 assert.equal(env.calls.length,1);
 const again=await submitPopulationNamingBatch({env,body});
 assert.equal(again.status,202);assert.equal(env.calls.length,1);
 const conflict=await submitPopulationNamingBatch({env,body:{...body,items:[{brief:brief(2)}]}});
 assert.equal(conflict.status,409);assert.equal(env.calls.length,1);
 assert.equal(env.DB.days.size,1);
});
test('budget blocks spending, missing bindings deny, disabled flag denies',async()=>{
 const body=request([{brief:brief(1)},{brief:brief(2)}]);
 const env=setup(()=>({status:'queued',request_id:'next'}),'1');
 const blocked=await submitPopulationNamingBatch({env,body});
 assert.equal(blocked.status,429);assert.equal(env.calls.length,0);
 const off=await submitPopulationNamingBatch({env:{...env,NAMING_AI_POPULATION_ENABLED:'false'},body});
 assert.equal(off.status,503);
 const missing=await submitPopulationNamingBatch({env:{NAMING_AI_POPULATION_ENABLED:'true'},body});
 assert.equal(missing.status,503);
});
test('poll queued then ready; resuming and rereading never reruns AI inference',async()=>{
 let completed=false;
 const env=setup(({p,opts})=>{
  if(opts?.queueRequest)return {request_id:'request-2041'};
  if(!completed){completed=true;return {status:'running'}};
  return {responses:[{id:0,success:true,result:{response:JSON.stringify({ideas:[idea()]})}}]};
 });
 const body=request();
 await submitPopulationNamingBatch({env,body});
 assert.equal((await pollPopulationNamingBatch({env,jobId:body.jobId})).payload.status,'RUNNING');
 const done=await pollPopulationNamingBatch({env,jobId:body.jobId});
 assert.equal(done.status,200);assert.equal(done.payload.results[0].candidates[0].name,'Quiet Breathing');
 assert.equal(done.payload.approvedForRegistration,false);
 assert.equal((await getPopulationNamingBatch({env,jobId:body.jobId})).payload.status,'READY');
 const times=env.calls.length;
 assert.equal((await pollPopulationNamingBatch({env,jobId:body.jobId})).status,200);
 assert.equal(env.calls.length,times);
 assert.ok(env.DB.sql.every(s=>!/(?:UPDATE|INSERT INTO)\s+(?:horses|races|pedigree|registered_horses)/i.test(s)));
});
test('model results can only be held or sent for editor, never registered or auto-issued',()=>{
 const b=brief();const row={horseId:b.horseId,candidates:[idea('Quiet Breathing'),idea('Mulligan')]};
 const qa=auditPopulationNamingResults({results:[row],briefs:[b],existingNames:['Shadow Trail']});
 assert.equal(qa.readyForIndependentEditor,1);
 assert.equal(qa.held,1);assert.equal(qa.approvedForRegistration,false);
 assert.equal(qa.gameWrites,0);
});
test('D1 checkpoint migration is bounded and only creates new naming tables',async()=>{
 const sql=await readFile(new URL('../migrations/0007_population_naming_jobs.sql',import.meta.url),'utf8');
 assert.match(sql,/wtw_naming_population_jobs/);
 assert.match(sql,/wtw_naming_ai_daily_usage/);
 assert.doesNotMatch(sql,/\b(?:DROP|ALTER)\b/i);
 assert.match(sql,/CHECK\(requested_count BETWEEN 1 AND 16\)/);
});