/** Private, opt-in Cloudflare Workers AI creative-preview adapter.
 * Uses the SAME authorized Worker. No registration, D1 or saved-game writes.
 * User-supplied briefs are untrusted until screened by the local game world.
 */
import {buildStoryFirstWritingRequest,parseCreativeModelOutput,
 HORSE_NAME_CREATOR_SCHEMA}
 from './game/horse-naming-model-creator.js';
import {OWNER_REVIEWED_NAME_KEYS_V478}
 from './game/horse-naming-owner-review-v478.js';

const MODEL='@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const KEY=x=>String(x||'').normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g,'');
const known=new Set(OWNER_REVIEWED_NAME_KEYS_V478);
const fail=(status,error)=>({status,payload:{error}});
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);

/** The calling game must re-screen every generated idea against its actual save. */
export async function makePrivateHorseNamePreview({env,body}={}){
 // Authenticated on-demand previews are enabled unless the operator uses the kill switch.
 if(env?.NAMING_AI_PREVIEW_ENABLED==='false')return fail(503,'Naming model preview disabled by administrator');
 if(typeof env?.AI?.run!=='function')return fail(503,'Workers AI binding missing');
 if(!isObj(body)||!isObj(body.brief)||body.writtenSpec!==HORSE_NAME_CREATOR_SCHEMA)
  return fail(400,'Invalid name-writing request');
 if(!Array.isArray(body.recentNames)||body.recentNames.length>60||
  !body.recentNames.every(n=>typeof n==='string'&&n.length<=100))
  return fail(400,'Invalid naming-cohort history');
 const brief=body.brief;
 if(typeof brief.horseId!=='string'||brief.horseId.length>90||
  !Array.isArray(brief.evidence)||brief.evidence.length>16||
  JSON.stringify(brief).length>14000)
  return fail(400,'Invalid or oversized naming brief');
 let spec;
 try{spec=buildStoryFirstWritingRequest(brief,{recentNames:body.recentNames})}
 catch{return fail(400,'Meaningful horse-specific name origin required')}
 let raw;
 try{
  raw=await env.AI.run(MODEL,{messages:[
   {role:'system',content:spec.system},
   {role:'user',content:spec.user}],max_tokens:1800,temperature:0.95});
 }catch{return fail(502,'Naming inference failed')}
 const parsed=parseCreativeModelOutput(raw);
 if(parsed.error)return fail(502,'Naming model response was not valid JSON');
 const seen=new Set(),ideas=[];
 for(const idea of parsed.ideas){
  const name=typeof idea.name==='string'?idea.name.trim():'';
  const key=KEY(name);
  if(!key||known.has(key)||seen.has(key)||name.length>18)continue;
  seen.add(key);
  ideas.push({name,evidenceId:idea.evidenceId,evidenceQuote:idea.evidenceQuote,
   explanation:idea.explanation});
 }
 return {status:200,payload:{schema:HORSE_NAME_CREATOR_SCHEMA,ideas,
  authoringModel:MODEL,origin:'UNTRUSTED_MODEL_PREVIEW',
  requiresGameWorldScreen:true,requiresIndependentEditor:true,
  approvedForRegistration:false,gameWrites:0}};
}