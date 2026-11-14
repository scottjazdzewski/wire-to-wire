/**
 * WIRE TO WIRE V484 — asynchronous, resumable population naming jobs.
 * This uses the existing authenticated WTW Worker and existing D1 binding.
 * It neither registers horses nor alters source history, save games or AI-owned foals.
 * Input comes from the game after birth; model output is NEVER name clearance.
 */
import {buildStoryFirstWritingRequest,parseCreativeModelOutput,HORSE_NAME_CREATOR_SCHEMA}
 from './game/horse-naming-model-creator.js';
import {OWNER_REVIEWED_NAME_KEYS_V478} from './game/horse-naming-owner-review-v478.js';
import {POPULATION_NAMING_BATCH_SIZE,POPULATION_NAMING_SCHEMA}
 from './game/horse-naming-population-planner.js';
export {POPULATION_NAMING_BATCH_SIZE,POPULATION_NAMING_SCHEMA};

export const POPULATION_NAMING_MODEL='@cf/meta/llama-3.3-70b-instruct-fp8-fast';
export const POPULATION_NAMING_TARGET_PER_YEAR=55000;
const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{7,95}$/;
const NK=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g,'');
const rated=new Set(OWNER_REVIEWED_NAME_KEYS_V478);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const str=x=>typeof x==='string'?x.trim():'';
const fail=(status,error,extra={})=>({status,payload:{error,...extra}});
const boundedCap=(input,fallback,max)=>{
 const n=Number(input);
 return Number.isSafeInteger(n)&&n>=1&&n<=max?n:fallback;
};
const stageId=x=>str(x).slice(0,95);
const stateView=r=>({schema:POPULATION_NAMING_SCHEMA,jobId:r.job_id,
 status:r.status,year:r.target_year,requested:r.requested_count,
 providerRequestId:r.request_id||null,createdAt:r.created_at,
 results:r.status==='READY'?JSON.parse(r.results_json||'[]'):null,
 approvedForRegistration:false,requiresGameWorldScreen:true,
 requiresIndependentEditor:true,gameWrites:0});
const DB_REQUIRED='Naming batch store has not been migrated in the existing WTW D1 database';

/** Validate every source-bound horse. No generic word-grid or storyless fallback. */
export function buildPopulationModelRequests({items,recentNames=[]}={}){
 if(!Array.isArray(items)||items.length<1||items.length>POPULATION_NAMING_BATCH_SIZE)
  throw Error('Population batch must contain 1–16 horses');
 if(!Array.isArray(recentNames)||recentNames.length>60||
  !recentNames.every(x=>typeof x==='string'&&x.length<=100))
  throw Error('Invalid prior-cohort history');
 const seen=new Set(),requests=[];
 for(const item of items){
  if(!obj(item)||!obj(item.brief)||!str(item.brief.horseId)||
   str(item.brief.horseId).length>96||seen.has(item.brief.horseId))
   throw Error('Each foal must have a unique stable source identity');
  seen.add(item.brief.horseId);
  const spec=buildStoryFirstWritingRequest(item.brief,{recentNames});
  requests.push({messages:[{role:'system',content:spec.system+'\nPOPULATION MODE: Give up to TWO independent, strong ideas for this one foal. Never force an answer if the story is weak. Output only the same JSON schema.'},
   {role:'user',content:spec.user}],temperature:0.95,max_tokens:550});
 }
 return requests;
}

/** No large model payloads, no guessed annual horse population, no AI spend without budget. */
export function validatePopulationRequest(body){
 if(!obj(body)||body.schema!==POPULATION_NAMING_SCHEMA||!ID.test(str(body.jobId))||
  !Number.isSafeInteger(body.year)||body.year<1999||body.year>2099)
  throw Error('Invalid population naming job contract');
 const requests=buildPopulationModelRequests(body);
 if(body.items.some(x=>x.brief?.foalingYear!==body.year))
  throw Error('Every foaling record must match the named year');
 if(JSON.stringify(body).length>180000)throw Error('Population request too large');
 return requests;
}

/** Model output gets a SECOND screen in the game against canonical and pending names. */
export function unpackPopulationResponses(response,horseIds,seenNames=[]){
 if(!Array.isArray(horseIds)||horseIds.length<1||horseIds.length>POPULATION_NAMING_BATCH_SIZE||
  !Array.isArray(seenNames))throw Error('Invalid population response mapping');
 if(!obj(response)||!Array.isArray(response.responses))throw Error('Unsupported AI batch response');
 const seen=new Set([...rated,...seenNames.map(NK)]),got=new Set(),output=[];
 for(const entry of response.responses){
  const idx=entry?.id;
  if(!Number.isInteger(idx)||idx<0||idx>=horseIds.length||got.has(idx))continue;
  got.add(idx);
  const parsed=entry.success===true?parseCreativeModelOutput(entry.result):{ideas:[],error:'INFERENCE_FAILED'};
  const proposals=[];
  for(const idea of parsed.ideas.slice(0,2)){
   if(!obj(idea))continue;
   const name=str(idea.name),key=NK(name),quote=str(idea.evidenceQuote),explanation=str(idea.explanation);
   if(!key||seen.has(key)||name.length>18||quote.length<12||explanation.length<35||
    !str(idea.evidenceId))continue;
   seen.add(key);proposals.push({name,evidenceId:idea.evidenceId,
    evidenceQuote:quote,explanation,origin:'UNTRUSTED_CLOUDFLARE_MODEL',
    status:'NEEDS_GAME_SCREEN_AND_INDEPENDENT_EDITOR'});
  }
  output.push({horseId:horseIds[idx],candidateCount:proposals.length,candidates:proposals,
   error:parsed.error||null,approvedForRegistration:false});
 }
 return horseIds.map(horseId=>output.find(r=>r.horseId===horseId)||
  {horseId,candidateCount:0,candidates:[],error:'MISSING_MODEL_RESULT',approvedForRegistration:false});
}

async function digest(body){
 const content=JSON.stringify({schema:body.schema,jobId:body.jobId,year:body.year,items:body.items,recentNames:body.recentNames||[]});
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(content));
 return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
const readJob=(db,id)=>db.prepare('SELECT * FROM wtw_naming_population_jobs WHERE job_id=?').bind(id).first();
async function saveJob(db,id,status,requestId=null,results=null){
 await db.prepare('UPDATE wtw_naming_population_jobs SET status=?,request_id=COALESCE(?,request_id),results_json=COALESCE(?,results_json),updated_at=CURRENT_TIMESTAMP WHERE job_id=?')
  .bind(status,requestId,results===null?null:JSON.stringify(results),id).run();
}
const databaseAvailable=env=>typeof env?.DB?.prepare==='function';
const providerAvailable=env=>typeof env?.AI?.run==='function';

export async function submitPopulationNamingBatch({env,body}={}){
 if(env?.NAMING_AI_POPULATION_ENABLED==='false')return fail(503,'Population naming is not enabled');
 if(!providerAvailable(env)||!databaseAvailable(env))return fail(503,'AI and existing WTW D1 binding both required');
 let requests;
 try{requests=validatePopulationRequest(body)}catch(e){return fail(400,String(e?.message||e))}
 const id=stageId(body.jobId),jobDigest=await digest(body),horseIds=body.items.map(x=>x.brief.horseId);
 let existing;
 try{existing=await readJob(env.DB,id)}catch{return fail(503,DB_REQUIRED)}
 if(existing){
  if(existing.payload_sha256!==jobDigest)return fail(409,'Job ID already belongs to another input');
  return {status:202,payload:stateView(existing)}; // No second AI request, ever.
 }
 try{
  await env.DB.prepare('INSERT INTO wtw_naming_population_jobs (job_id,payload_sha256,target_year,requested_count,horse_ids_json,status) VALUES (?,?,?,?,?,?)')
   .bind(id,jobDigest,body.year,requests.length,JSON.stringify(horseIds),'RESERVING').run();
 }catch{
  const other=await readJob(env.DB,id).catch(()=>null);
  if(other&&other.payload_sha256===jobDigest)return {status:202,payload:stateView(other)};
  return fail(409,other?'Job ID already belongs to another input':DB_REQUIRED);
 }
 const cap=boundedCap(env.NAMING_AI_POPULATION_DAILY_CAP,128,100000);
 if(requests.length>cap){await saveJob(env.DB,id,'BUDGET_BLOCKED');return fail(429,'Daily AI budget too small for this batch',{jobId:id})}
 const day=new Date().toISOString().slice(0,10);
 let granted;
 try{
  granted=await env.DB.prepare('INSERT INTO wtw_naming_ai_daily_usage (day,inference_count) VALUES (?,?) ON CONFLICT(day) DO UPDATE SET inference_count=inference_count+excluded.inference_count WHERE inference_count + excluded.inference_count <= ? RETURNING inference_count')
   .bind(day,requests.length,cap).first();
 }catch{await saveJob(env.DB,id,'SCHEMA_REQUIRED').catch(()=>{});return fail(503,DB_REQUIRED)}
 if(!granted){await saveJob(env.DB,id,'BUDGET_BLOCKED');return fail(429,'Daily naming inference limit reached',{jobId:id,limit:cap})}
 let result;
 try{result=await env.AI.run(POPULATION_NAMING_MODEL,{requests},{queueRequest:true})}
 catch{await saveJob(env.DB,id,'SUBMISSION_FAILED').catch(()=>{});
  return fail(502,'Model could not queue batch; job will not be automatically reissued',{jobId:id})}
 if(!obj(result)||!str(result.request_id)||str(result.request_id).length>160){
  await saveJob(env.DB,id,'SUBMISSION_UNCONFIRMED').catch(()=>{});
  return fail(502,'Model submission could not be confirmed; manual review required',{jobId:id});
 }
 await saveJob(env.DB,id,'QUEUED',result.request_id);
 const saved=await readJob(env.DB,id);
 return {status:202,payload:stateView(saved)};
}

export async function getPopulationNamingBatch({env,jobId}={}){
 if(!ID.test(str(jobId)))return fail(400,'Invalid job ID');
 if(!databaseAvailable(env))return fail(503,'Existing WTW D1 binding required');
 let row;
 try{row=await readJob(env.DB,jobId)}catch{return fail(503,DB_REQUIRED)}
 return row?{status:200,payload:stateView(row)}:fail(404,'Naming job not found');
}

export async function pollPopulationNamingBatch({env,jobId}={}){
 if(env?.NAMING_AI_POPULATION_ENABLED==='false')return fail(503,'Population naming is not enabled');
 if(!ID.test(str(jobId)))return fail(400,'Invalid job ID');
 if(!databaseAvailable(env)||!providerAvailable(env))return fail(503,'AI and WTW D1 binding both required');
 let row;
 try{row=await readJob(env.DB,jobId)}catch{return fail(503,DB_REQUIRED)}
 if(!row)return fail(404,'Naming job not found');
 if(row.status==='READY')return {status:200,payload:stateView(row)};
 if(!['QUEUED','RUNNING'].includes(row.status))return {status:202,payload:stateView(row)};
 let output;
 try{output=await env.AI.run(POPULATION_NAMING_MODEL,{request_id:row.request_id})}
 catch{return fail(502,'Batch status could not be retrieved; retry polling same job')}
 if(['queued','running'].includes(output?.status)){
  if(output.status==='running')await saveJob(env.DB,jobId,'RUNNING');
  return {status:202,payload:stateView(await readJob(env.DB,jobId))};
 }
 let names;
 try{names=unpackPopulationResponses(output,JSON.parse(row.horse_ids_json))}
 catch{await saveJob(env.DB,jobId,'UNSUPPORTED_RESULT');return fail(502,'AI result format requires manual review',{jobId})}
 await saveJob(env.DB,jobId,'READY',null,names);
 return {status:200,payload:stateView(await readJob(env.DB,jobId))};
}