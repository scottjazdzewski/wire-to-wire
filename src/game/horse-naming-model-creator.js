/**
 * WIRE TO WIRE — story-first creative name generation.
 * The writer composes proposals; this module NEVER registers or approves a horse.
 * A brief must originate from buildGameHorseNamingBrief (saved owner / journal).
 * No live inference is performed in the game kernel. The optional authenticated
 * server adapter is the only network integration.
 */
import {ensure} from './contracts.js';
import {GAME_NAMING_BRIDGE_SCHEMA,screenGameHorseName,buildGameHorseNamingBrief}
 from './horse-naming-bridge.js';
import {OWNER_REVIEWED_NAME_KEYS_V478} from './horse-naming-owner-review-v478.js';

export const HORSE_NAME_CREATOR_SCHEMA='WTW_GAME_STORY_FIRST_NAME_CREATOR_V1';
export const GAME_NAME_WRITER_ID='CLOUDFLARE_WORKERS_AI_CREATOR_V1';
const norm=s=>String(s??'').normalize('NFKC').toLocaleLowerCase('en-US')
 .replace(/[\u2018\u2019]/g,"'").replace(/[^a-z0-9]+/g,'');
const str=s=>typeof s==='string'?s.trim():'';
const stop=new Set(['the','and','this','that','from','with','into','there','what','just','have','been','will','more','than','when','then','your']);
const meaningfulWords=name=>(name.toLocaleLowerCase('en-US').match(/[a-z]{4,}/g)||[])
 .filter(word=>!stop.has(word));

function anchorNarrative(anchor){
 return anchor.kind==='OWNER_ATTESTED'?str(anchor.detail):
  anchor.kind==='GAME_EVENT'?str(anchor.sourceDetails?.naming_narrative):'';
}
export function authoringEvidence(brief){
 ensure(brief?.schema===GAME_NAMING_BRIDGE_SCHEMA&&
  brief.status==='READY_FOR_ORIGINAL_NAME_WRITING',
  'NAMING_ORIGIN_REQUIRED','Cannot creatively write for a horse without an attested origin');
 const evidence=(brief.evidence||[])
  .map(e=>({...e,narrative:anchorNarrative(e)}))
  .filter(e=>e.narrative.length>=24);
 ensure(evidence.length>0,'NAMING_ORIGIN_REQUIRED','No meaningful origin narrative');
 return evidence;
}

/** Prompt is a literary brief, not two-word templates or a stock name library. */
export function buildStoryFirstWritingRequest(brief,{recentNames=[]}={}){
 const anchors=authoringEvidence(brief);
 ensure(Array.isArray(recentNames),'NAMING_COHORT','Invalid recent-name history');
 const input={
  horseId:brief.horseId,foalingYear:brief.foalingYear,
  owner:brief.owner,breeder:brief.breeder,
  birthplace:brief.foalingLocationId||null,
  originEvidence:anchors.map(e=>({evidenceId:e.id,sourceRef:e.sourceRef,narrative:e.narrative})),
  recentNames:recentNames.slice(-60).map(v=>typeof v==='string'?v:v.name).filter(Boolean)
 };
 const system=[
  'You are a human-quality thoroughbred naming writer. Create actual individual names, not lists of word pairings.',
  'The game is an alternate horse-racing universe beginning in 1999. Use only the supplied horse-specific, attested origin evidence.',
  'Make names that different real owners might plausibly choose: an odd memory, an intimate joke, a musical or cultural allusion, a meaningful place, a remembered phrase, a striking one-word identity.',
  'Not every name has to expose the origin literally. An indirect metaphor is welcome IF explainable from the supplied story.',
  'Never make up a sire, dam, pedigree, family member, birthplace, historic event or personal relationship.',
  'AVOID patterned adjective-noun combinations, repeated grammatical openings, ubiquitous finance or banking terms, generic nature phrases, and arbitrary dictionary pairings.',
  'No forced balance of one/two/three-word names. Do not pad a weak batch. Return zero ideas if none is compelling.',
  'No exact known real racehorse names. Maximum 18 displayed characters including spaces. Avoid abusive or trademark-copying names.',
  'For EACH idea provide name, matching evidenceId, a verbatim evidenceQuote of 12 or more characters, and a concrete explanation of HOW the name is derived from that quote (not why it merely sounds nice).',
  'Respond ONLY with JSON: {"ideas":[{"name":"...","evidenceId":"...","evidenceQuote":"...","explanation":"..."}]}. Maximum eight ideas.',
  'Be imaginatively surprising, culturally literate and rooted in this particular horse. Authenticity matters more than quantity.'
 ].join('\n');
 return {schema:HORSE_NAME_CREATOR_SCHEMA,system,user:JSON.stringify(input),
  evidenceIds:anchors.map(e=>e.id)};
}

export function parseCreativeModelOutput(output){
 let data=output;
 if(typeof output==='object'&&output!==null&&typeof output.response==='string')data=output.response;
 if(typeof data==='string'){
  let s=data.trim();
  if(s.startsWith('```'))s=s.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  try{data=JSON.parse(s)}catch{return {ideas:[],error:'INVALID_MODEL_JSON'}}
 }
 if(!data||typeof data!=='object'||!Array.isArray(data.ideas))return {ideas:[],error:'INVALID_MODEL_SHAPE'};
 // Hard bounds: never trust raw language-model output.
 return {ideas:data.ideas.slice(0,8).filter(v=>v&&typeof v==='object')};
}

/**
 * Local validation must also run after network preview. Writers and editors
 * cannot auto-accept a candidate into the game registration gate.
 */
export function screenStoryFirstIdeas({world,state,brief,rawIdeas,
 reservedNames=[],issuedNames=[],recentNames=[],additionalReviewedNames=[]}={}){
 const anchors=authoringEvidence(brief);
 ensure(Array.isArray(rawIdeas)&&Array.isArray(reservedNames)&&
  Array.isArray(issuedNames)&&Array.isArray(recentNames)&&
  Array.isArray(additionalReviewedNames),
  'NAMING_INPUT','Naming inputs must be lists');
 const result=[],seen=new Set();
 const priorReviewed=[...OWNER_REVIEWED_NAME_KEYS_V478,...additionalReviewedNames];
 const recent=recentNames.slice(-40).map(r=>typeof r==='string'?r:r.name).filter(Boolean);
 for(const idea of rawIdeas.slice(0,8)){
  if(!idea||typeof idea!=='object')continue;
  const name=str(idea.name),evidenceId=str(idea.evidenceId);
  const origin=anchors.find(a=>a.id===evidenceId);
  const evidenceQuote=str(idea.evidenceQuote),reasons=[];
  if(!origin||evidenceQuote.length<12||
   !origin.narrative.toLocaleLowerCase('en-US').includes(evidenceQuote.toLocaleLowerCase('en-US')))
   reasons.push('NO_EXACT_STORY_EVIDENCE');
  const explanation=str(idea.explanation);
  if(explanation.length<35||/sounds? (?:nice|like a horse|good|cool)|random words?|because it is (?:cool|catchy)/i.test(explanation))
   reasons.push('NO_CONCRETE_NAMING_REASON');
  const n=norm(name);
  if(!n||seen.has(n))reasons.push('INTRA_BATCH_REPEAT');
  seen.add(n);
  if(recent.some(v=>norm(v)===n))reasons.push('RECENT_NAME_REPEAT');
  const words=new Set(meaningfulWords(name));
  if([...words].some(w=>recent.filter(v=>meaningfulWords(v).includes(w)).length>=3))
   reasons.push('RECENT_CONTENT_WORD_FATIGUE');
  const first=name.split(/\s+/)[0].toLowerCase();
  if(first.length>=4&&recent.filter(v=>v.split(/\s+/)[0].toLowerCase()===first).length>=3)
   reasons.push('RECENT_OPENING_FATIGUE');
  const screened=screenGameHorseName({world,state,brief,
   proposal:{name:idea.name,evidenceId,explanation,writer_id:GAME_NAME_WRITER_ID},
   reviewedNames:priorReviewed,reservedNames,issuedNames});
  const all=[...new Set([...screened.reasons,...reasons])];
  result.push({...screened,creatorSchema:HORSE_NAME_CREATOR_SCHEMA,
   evidenceQuote,sourceRef:origin?.sourceRef||null,
   reasons:all,status:all.length?'HELD':'AWAITING_INDEPENDENT_EDITOR',
   registrationStatus:'NOT_RELEASED',gameWrites:0});
 }
 return {schema:HORSE_NAME_CREATOR_SCHEMA,
  horseId:brief.horseId,received:rawIdeas.length,screened:result,
  readyForIndependentEditor:result.filter(r=>r.status==='AWAITING_INDEPENDENT_EDITOR').length,
  held:result.filter(r=>r.status==='HELD').length,
  registrationStatus:'NOT_RELEASED',gameWrites:0};
}

/** Rebuild from the actual game run; never let a caller invent an origin. */
export function verifyNamingBriefAgainstGame({world,state,horse,brief}={}){
 const verified=buildGameHorseNamingBrief({world,state,horse});
 ensure(brief?.horseId===verified.horseId&&
  brief.owner?.id===verified.owner?.id&&
  brief.breeder?.id===verified.breeder?.id&&
  JSON.stringify(brief.evidence)===JSON.stringify(verified.evidence)&&
  brief.status===verified.status,
  'NAMING_BRIEF_FORGED','Creative brief does not match the current game save');
 return verified;
}

/** Bring your own authenticated creative inference. A mock can test all rules. */
export async function writeStoryFirstHorseNames({world,state,horse,brief,infer,
 reservedNames=[],issuedNames=[],recentNames=[],additionalReviewedNames=[]}={}){
 ensure(typeof infer==='function','NAMING_MODEL_UNAVAILABLE','Creative inference provider not configured');
 const verified=verifyNamingBriefAgainstGame({world,state,horse,brief});
 const writing=buildStoryFirstWritingRequest(verified,{recentNames});
 const output=await infer({system:writing.system,user:writing.user});
 const parsed=parseCreativeModelOutput(output);
 return {...screenStoryFirstIdeas({world,state,brief,rawIdeas:parsed.ideas,
  reservedNames,issuedNames,recentNames,additionalReviewedNames}),
  modelError:parsed.error||null};
}

/** Calls the private SAME-ORIGIN preview route. Caller re-screens its output. */
export async function previewStoryFirstHorseNames({world,state,horse,brief,
 fetchImpl=fetch,recentNames=[],reservedNames=[],issuedNames=[],additionalReviewedNames=[]}={}){
 const verified=verifyNamingBriefAgainstGame({world,state,horse,brief});
 const writing=buildStoryFirstWritingRequest(verified,{recentNames});
 ensure(typeof fetchImpl==='function','NAMING_FETCH','Browser fetch required');
 const response=await fetchImpl('/api/naming/preview',{
  method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({brief,writtenSpec:writing.schema,
   recentNames:recentNames.slice(-60).map(v=>typeof v==='string'?v:v.name)})
 });
 ensure(response?.ok===true,'NAMING_PREVIEW_UNAVAILABLE','Authenticated creative service unavailable');
 const data=await response.json();
 ensure(data?.schema===HORSE_NAME_CREATOR_SCHEMA&&Array.isArray(data.ideas),
  'NAMING_MODEL_RESPONSE','Invalid creative preview response');
 return screenStoryFirstIdeas({world,state,brief,rawIdeas:data.ideas,
  recentNames,reservedNames,issuedNames,additionalReviewedNames});
}