/** Server-only OpenAI Responses API provider (injected fetch for testability).
 * NO client bundle, token storage, game writes or default API key.
 * No network request is made unless both a configured API key and model names
 * are supplied AND the caller invokes one of the returned callbacks.
 */
import {GENERATOR_INSTRUCTIONS,REVIEW_INSTRUCTIONS} from './semantic-horse-names.mjs';
const endpoint='https://api.openai.com/v1/responses';
const schema=({name,properties,required})=>({type:'json_schema',name,strict:true,
 schema:{type:'object',additionalProperties:false,required:['results'],properties:{results:{type:'array',items:{type:'object',additionalProperties:false,properties,required}}}}});
const GENERATE_FORMAT=schema({name:'wtw_horse_names',properties:{horseId:{type:'string'},name:{type:'string'},styleDomain:{type:'string'},sourceYear:{type:'integer'}},required:['horseId','name','styleDomain','sourceYear']});
const REVIEW_FORMAT=schema({name:'wtw_horse_name_review',properties:{horseId:{type:'string'},name:{type:'string'},score:{type:'integer'},grammarNatural:{type:'boolean'},humanBelievable:{type:'boolean'},originalEnough:{type:'boolean'},eraAppropriate:{type:'boolean'},reason:{type:'string'}},required:['horseId','name','score','grammarNatural','humanBelievable','originalEnough','eraAppropriate','reason']});
function fromResponse(body){
 if(body.status!=='completed')throw Error('MODEL_RESPONSE_NOT_COMPLETED');
 const text=body.output_text??(body.output||[]).filter(x=>x.type==='message').flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('');
 if(!text)throw Error('MODEL_OUTPUT_MISSING');
 const r=JSON.parse(text);if(!Array.isArray(r?.results))throw Error('MODEL_RESULTS_INVALID');
 return r.results;
}
export function createResponsesNamingProvider({apiKey,creativeModel,reviewModel,fetchImpl=fetch,maxNamesPerRequest=25}={}){
 if(typeof apiKey!=='string'||apiKey.length<12)throw Error('SERVER_API_KEY_REQUIRED');
 if(typeof creativeModel!=='string'||!creativeModel||typeof reviewModel!=='string'||!reviewModel)throw Error('TWO_MODEL_NAMES_REQUIRED');
 if(creativeModel===reviewModel)throw Error('CREATIVE_AND_CRITIC_MODELS_MUST_DIFFER');
 if(typeof fetchImpl!=='function'||!Number.isInteger(maxNamesPerRequest)||maxNamesPerRequest<1||maxNamesPerRequest>50)
   throw Error('INVALID_NAMING_PROVIDER_CONFIGURATION');
 async function invoke(model,instructions,items,format){
  const response=await fetchImpl(endpoint,{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model,instructions,input:JSON.stringify({items}),store:false,text:{format}})});
  if(!response.ok)throw Error(`NAMING_MODEL_HTTP_${response.status}`);
  return fromResponse(await response.json());
 }
 const inChunks=async (items,task)=>{const out=[];for(let i=0;i<items.length;i+=maxNamesPerRequest)out.push(...await task(items.slice(i,i+maxNamesPerRequest)));return out;};
 const proposer=async briefs=>inChunks(briefs,items=>invoke(creativeModel,GENERATOR_INSTRUCTIONS,items,GENERATE_FORMAT));
 const reviewer=async items=>inChunks(items,part=>invoke(reviewModel,REVIEW_INSTRUCTIONS,part,REVIEW_FORMAT));
 return Object.freeze({proposer,reviewer,provider:'OPENAI_RESPONSES_SERVER_ONLY',creativeModel,reviewModel,maxNamesPerRequest});
}