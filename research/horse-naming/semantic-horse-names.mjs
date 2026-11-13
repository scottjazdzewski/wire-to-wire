/**
 * WIRE TO WIRE — SEMANTIC HORSE NAME PROPOSAL PIPELINE v1.
 * Quality-first architecture replacing unbounded adjective/noun, arbitrary
 * subject-verb-object and fused sentence factories. No existing WTW horse is
 * renamed or registered by this module. Production requires separately
 * connected creative provider, independent editorial reviewer and registrar.
 *
 * This file deliberately does not import the v4.54 lexical factories.
 */
export const SEMANTIC_NAME_PIPELINE_VERSION='WTW_SEMANTIC_NAME_PROPOSER_V1_NON_DEPLOYED';
export const STYLE_DOMAINS=Object.freeze([
 'everyday_object','spoken_expression','whimsical_wordplay','traditional_virtue',
 'food_and_humor','music_and_story','regional_reference','ordinary_language',
 'nickname_and_character','occupation_and_trade','nature_and_weather',
 'pedigree_echo','coined_word','international_language','racing_reference',
 'family_reference','private_joke','classic_literary','commercial_phrase',
 'unexpected_single_word'
]);
const domains=new Set(STYLE_DOMAINS);
const namePattern=/^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ0-9'’ .-]*$/u;
export const norm=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h>>>0;};
const frozen=r=>Object.freeze(r);
const isOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function assertEvent(event){
 if(!event||typeof event.horseId!=='string'||!event.horseId.trim())throw Error('HORSE_ID_REQUIRED');
 if(!Number.isInteger(event.namingYear)||event.namingYear<1900||event.namingYear>2200)throw Error('NAMING_YEAR_INVALID');
 if(event.foalYear!=null&&(!Number.isInteger(event.foalYear)||event.foalYear>event.namingYear))throw Error('NAMING_CHRONOLOGY_INVALID');
 if(event.nameStatus==='CANON_LOCKED'||event.nameStatus==='REGISTERED'||event.nameStatus==='REGISTERED_LOCKED')return;
 if(!['UNNAMED','TEST_RENAME_ALLOWED','RACE_READY','FIRST_ENTRY_REQUESTED'].includes(event.nameStatus))throw Error('NAME_STATUS_INVALID');
}
/** Indexed exact and one-character-variation guard. Does not imply official
 * Jockey Club registration clearance; official names may not be in the input.
 */
export function createNameExclusionIndex(names=[]){
 const exact=new Set(),dels=new Map();
 function add(name){const n=norm(name);if(!n)return;
  exact.add(n);if(n.length<6)return;
  for(let i=0;i<n.length;i++){const s=n.slice(0,i)+n.slice(i+1);if(!dels.has(s))dels.set(s,new Set());dels.get(s).add(n);}
 }
 function issue(name){const n=norm(name);if(!n)return 'EMPTY';if(exact.has(n))return 'EXACT_REFERENCE_OR_USED';
  if(n.length<6)return null;
  if(dels.has(n))return 'NEAR_REFERENCE_OR_USED';
  for(let i=0;i<n.length;i++){const s=n.slice(0,i)+n.slice(i+1);if(exact.has(s))return 'NEAR_REFERENCE_OR_USED';const a=dels.get(s);if(a&&(a.size>1||!a.has(n)))return 'NEAR_REFERENCE_OR_USED';}
  return null;
 }
 for(const n of names)add(n);
 return frozen({add,issue,size:()=>exact.size});
}
function acceptFormat(name){if(typeof name!=='string'||name!==name.trim())return 'FORMAT';if(name.length<4||name.length>18)return 'LENGTH';if(!namePattern.test(name))return 'CHARACTERS';if(/\s{2,}/.test(name))return 'SPACING';return null;}
/** A fixed creative contract, not a concatenation template. Only supply
 * approved provenance. Don't give the model made-up facts about real owners.
 */
export const GENERATOR_INSTRUCTIONS=`You are writing ORIGINAL COMPLETE registered-style Thoroughbred horse name PROPOSALS for a fictional horse-management game. Each proposal belongs to exactly one provided Horse_ID and naming year. Do not copy source names or make close respellings. A name must be natural to say in a race call, distinctive, and at most 18 characters including spaces. Think of different humans doing the naming: everyday words, witty speech, genuine idioms, affectionate quirks, strange-but-meaningful names, occasional place names only when a real place is provided, natural one-word formations, pedigree references only when parents are provided. Never build arbitrary adjective+noun pairs, unrelated verb+object sentences, nonsensical joined utterances, or an obvious repeated skeleton. Never fabricate an owner's motive, family, birthplace, language or biography. An unspecified naming domain is a FICTIONAL editorial prompt, not an alleged historical fact. Return an array [{horseId,name,styleDomain,sourceYear}]. Avoid generic human first+last names. Do not include legal registration claims.`;
export const REVIEW_INSTRUCTIONS=`Independently judge each WHOLE proposed Thoroughbred name, not the generator's explanation. Return [{horseId,name,score,grammarNatural,humanBelievable,originalEnough,eraAppropriate,reason}]. Score 1–5. Reject random unrelated word pairs; odd but meaningful eccentricity is acceptable. Reject broken subject-verb agreement, robotic sentence-fused spelling, obvious prompt-template repetition, culturally or era-inappropriate language, and fabricated biographical assertions. A real racehorse may have a peculiar name, but an entire batch must not sound machine-generated. No registered-name availability claim.`;
/** Every event receives a deterministic editorial domain. This is NOT
 * evidence that the real owner preferred that domain. Supplied factual
 * ownerStyle or pedigree can override if explicitly provided. */
export function namingBrief(event,{seed='WTW',ownerStyles={}}={}){
 assertEvent(event);
 const owner=event.ownerId&&isOwn(ownerStyles,event.ownerId)?ownerStyles[event.ownerId]:null;
 const sire=event.sireName||null,dam=event.damName||null;
 // If real parent names are unavailable, never fabricate pedigree.
 const parentNames=sire&&dam?frozen({sire,dam}):null;
 const suppliedLocation=event.namingLocation?.name||null;
 const eligible=STYLE_DOMAINS.filter(d=>(d!=='pedigree_echo'||parentNames)&&
   (d!=='family_reference'||owner?.familyName)&&
   (d!=='private_joke'||owner?.explicitPhrase)&&
   (d!=='regional_reference'||suppliedLocation)&&
   (d!=='international_language'||owner?.language));
 if(owner?.domain&&(!domains.has(owner.domain)||!eligible.includes(owner.domain)))
   throw Error('SUPPLIED_STYLE_LACKS_REQUIRED_PROVENANCE');
 const style=owner?.domain||eligible[hash(`${seed}|${event.horseId}|${event.namingYear}|style`)%eligible.length];
 return frozen({horseId:event.horseId,namingYear:event.namingYear,foalYear:event.foalYear??null,
  ownerId:event.ownerId??null,sourceDomain:style,sourceDomainBasis:owner?.domain?'SUPPLIED_OWNER_STYLE':'FICTIONAL_EDITORIAL_VARIETY',
  parentNames,namingLocation:suppliedLocation,ownerLanguage:owner?.language??null,
  familyName:owner?.familyName??null,ownerPhrase:owner?.explicitPhrase??null,
  ownerBiographyAsserted:false,sourceMode:'PROPOSAL_ONLY'});
}
function normalReviewerVerdict(v,p){if(!v||v.horseId!==p.horseId||norm(v.name)!==norm(p.name))return false;
 return Number.isInteger(v.score)&&v.score>=4&&v.score<=5&&v.grammarNatural===true&&v.humanBelievable===true&&v.originalEnough===true&&v.eraAppropriate===true;}
/** Work happens by bounded batches. `proposer` and independent `reviewer`
 * are supplied from the server, NOT the browser. Without a reviewer, NONE
 * can become ready. No silent fallback to legacy random naming.
 * Records are returned, never written to a game DB or registered.
 */
export function createSemanticHorseNamingSession({seed='WTW',protectedNames=[],alreadyUsed=[],ownerStyles={},proposer,reviewer,
  maxRounds=4,reviewMinScore=4,sourceFamilyCeiling=.20}={}){
 if(typeof proposer!=='function')throw Error('CREATIVE_PROPOSER_REQUIRED');
 if(reviewer!=null&&typeof reviewer!=='function')throw Error('INDEPENDENT_REVIEWER_MUST_BE_FUNCTION');
 if(!Array.isArray(protectedNames)||!Array.isArray(alreadyUsed))throw Error('INVALID_REFERENCE_LISTS');
 if(!Number.isInteger(maxRounds)||maxRounds<1||maxRounds>12)throw Error('INVALID_RETRY_LIMIT');
 if(reviewMinScore!==4)throw Error('REVIEW_THRESHOLD_IS_FOUR');
 if(!Number.isFinite(sourceFamilyCeiling)||sourceFamilyCeiling<=0||sourceFamilyCeiling>1)throw Error('INVALID_FAMILY_CEILING');
 const exclusions=createNameExclusionIndex([...protectedNames,...alreadyUsed]);
 const ledger=new Map(),openers=new Map(),stats={seen:0,ready:0,held:0,rejected:{},byDomain:{},reviewed:0,reviewPassed:0};
 const reject=x=>stats.rejected[x]=(stats.rejected[x]||0)+1;
 async function runBatch(events){
  if(!Array.isArray(events)||events.length>500||events.length<1)throw Error('BATCH_RANGE_1_TO_500');
  const ids=new Set();for(const e of events){assertEvent(e);if(ids.has(e.horseId))throw Error('DUPLICATE_HORSE_EVENT');ids.add(e.horseId);}
  const out=new Map(),todo=[];
  for(const e of events.slice().sort((a,b)=>a.namingYear-b.namingYear||a.horseId.localeCompare(b.horseId))){
   stats.seen++;
   if(ledger.has(e.horseId)){out.set(e.horseId,ledger.get(e.horseId));continue;}
   if(['CANON_LOCKED','REGISTERED','REGISTERED_LOCKED'].includes(e.nameStatus)){
     const row=frozen({horseId:e.horseId,namingYear:e.namingYear,name:null,status:'PRESERVED_EXISTING',registrationStatus:'UNCHANGED'});
     ledger.set(e.horseId,row);out.set(e.horseId,row);continue;
   }
   todo.push(namingBrief(e,{seed,ownerStyles}));
  }
  for(let attempt=0;attempt<maxRounds&&todo.length;attempt++){
   // A creative model must write COMPLETE names; never lexical-assemble them.
   const proposals=await proposer(frozen(todo.slice()),frozen({attempt,generatorInstructions:GENERATOR_INSTRUCTIONS}));
   if(!Array.isArray(proposals))throw Error('PROPOSER_MUST_RETURN_ARRAY');
   const proposed=new Map();for(const p of proposals){if(!p||typeof p.horseId!=='string')continue;
     if(proposed.has(p.horseId)){reject('DUPLICATE_PROVIDER_ID');continue;}proposed.set(p.horseId,p);
   }
   const pending=[],reviews=[];
   for(const brief of todo){const p=proposed.get(brief.horseId);
    if(!p){reject('NO_PROVIDER_CANDIDATE');pending.push(brief);continue;}
    if(p.styleDomain!==brief.sourceDomain){reject('STYLE_DOMAIN_MISMATCH');pending.push(brief);continue;}
    const e=acceptFormat(p.name);
    if(e){reject('INVALID_'+e);pending.push(brief);continue;}
    if(p.sourceYear!=null&&(!Number.isInteger(p.sourceYear)||p.sourceYear>brief.namingYear)){
       reject('FUTURE_SOURCE');pending.push(brief);continue;
    }
    const collision=exclusions.issue(p.name);
    if(collision){reject(collision);pending.push(brief);continue;}
    if(!reviewer){reject('REVIEWER_NOT_CONNECTED');pending.push(brief);continue;}
    reviews.push({brief,p});
   }
   if(reviews.length){
     const judgments=await reviewer(frozen(reviews.map(x=>frozen({brief:x.brief,proposal:x.p}))),frozen({attempt,reviewInstructions:REVIEW_INSTRUCTIONS}));
     if(!Array.isArray(judgments))throw Error('REVIEWER_MUST_RETURN_ARRAY');
     const verdicts=new Map(judgments.filter(x=>x&&x.horseId).map(x=>[x.horseId,x]));
     for(const {brief,p} of reviews){stats.reviewed++;
      if(!normalReviewerVerdict(verdicts.get(brief.horseId),p)){reject('EDITORIAL_REJECT');pending.push(brief);continue;}
      // Another item in this very review batch might have been accepted first.
      const c=exclusions.issue(p.name);
      if(c){reject(c);pending.push(brief);continue;}
      // Quality-first early gate: a single editorial recipe may not silently
      // monopolize a large approved population. For small early batches,
      // report rather than mathematically forbid the first samples.
      if(stats.ready>=200 && brief.sourceDomainBasis!=='SUPPLIED_OWNER_STYLE' &&
         ((stats.byDomain[brief.sourceDomain]||0)+1)/(stats.ready+1)>sourceFamilyCeiling){
        reject('STYLE_DOMAIN_CONCENTRATION');pending.push(brief);continue;
      }
      const ws=p.name.toLowerCase().split(/\s+/);
      if(ws.length>=3){
        const prefix=ws.slice(0,2).join(' '),tot=[...openers.values()].reduce((a,b)=>a+b,0);
        if(tot>=100){
          const values=[...openers.entries()].map(([k,n])=>n+(k===prefix?1:0));
          if(!openers.has(prefix))values.push(1);
          const top5=values.sort((a,b)=>b-a).slice(0,5).reduce((a,b)=>a+b,0)/(tot+1);
          if(top5>.08){reject('PHRASE_PREFIX_CONCENTRATION');pending.push(brief);continue;}
        }
        openers.set(prefix,(openers.get(prefix)||0)+1);
      }
      exclusions.add(p.name);stats.reviewPassed++;stats.ready++;
      stats.byDomain[brief.sourceDomain]=(stats.byDomain[brief.sourceDomain]||0)+1;
      const row=frozen({horseId:brief.horseId,namingYear:brief.namingYear,name:p.name,
       status:'PROVISIONAL_QA_PASSED',registrationStatus:'NOT_REGISTERED',
       styleDomain:brief.sourceDomain,sourceDomainBasis:brief.sourceDomainBasis,
       ownerMotive:'NOT_ASSERTED',pedigreeBasis:brief.parentNames?'SUPPLIED_PARENTS':'NONE',
       score:verdicts.get(brief.horseId).score,modelVersion:SEMANTIC_NAME_PIPELINE_VERSION});
      ledger.set(brief.horseId,row);out.set(brief.horseId,row);
     }
   }
   todo.splice(0,todo.length,...pending);
  }
  for(const brief of todo){stats.held++;
   const row=frozen({horseId:brief.horseId,namingYear:brief.namingYear,name:null,status:'HELD_FOR_CREATIVE_AND_EDITORIAL_REVIEW',registrationStatus:'NOT_REGISTERED',reason:'QUALITY_SOURCE_EXHAUSTED'});
   ledger.set(brief.horseId,row);out.set(brief.horseId,row);
  }
  return frozen([...out.values()]);
 }
 // Serialize overlapping async sessions: two simultaneous creative batches
 // cannot both reserve the same string after interleaved model awaits.
 let queue=Promise.resolve();
 function previewBatch(events){
   const result=queue.then(()=>runBatch(events));
   queue=result.then(()=>{},()=>{});
   return result;
 }
 function summary(){return frozen({model:SEMANTIC_NAME_PIPELINE_VERSION,...stats,exclusionCount:exclusions.size(),
   reviewedRate:stats.reviewed?stats.reviewPassed/stats.reviewed:0,
   domainMaxFraction:stats.ready?Math.max(0,...Object.values(stats.byDomain))/stats.ready:0,
   threePlusApproved:[...openers.values()].reduce((a,b)=>a+b,0),
   topFivePhraseOpeners:([...openers.values()].sort((a,b)=>b-a).slice(0,5)),
   sourceFamilyCeiling,sourceFamilyAlarm:stats.ready?Math.max(0,...Object.values(stats.byDomain))/stats.ready>sourceFamilyCeiling:false,
   actualRegistrationApproved:false,productionIntegrated:false});}
 function exportProvisionalLedger(){return frozen([...ledger.values()].filter(x=>x.status==='PROVISIONAL_QA_PASSED').map(x=>frozen({...x})));}
 return frozen({previewBatch,summary,exportProvisionalLedger});
}
/** A synchronous callback compatible with the existing v4.48 preview bridge.
 * This reads proposals from a reviewed/cached ledger only — never calls a live
 * generative model inside the synchronous world-generator render cycle. */
export function createBridgeProposerFromReviewedLedger(rows){
 const byId=new Map();for(const row of rows){if(row.status!=='PROVISIONAL_QA_PASSED'||!row.name)throw Error('LEDGER_ENTRY_NOT_QA_APPROVED');
  if(byId.has(row.horseId))throw Error('DUPLICATE_LEDGER_HORSE');byId.set(row.horseId,row);}
 return frozen(({horseId,namingYear,attempt=0})=>{const row=byId.get(horseId);
  if(!row||row.namingYear!==namingYear||attempt!==0)return null;
  return frozen({name:row.name,method:'v456_semantic_whole_name',family:row.name.split(/\s+/).length===1?'single':row.name.split(/\s+/).length===2?'two':'three_plus',sourceYear:namingYear,provenance:{sourceId:row.modelVersion,styleDomain:row.styleDomain,ownerMotive:'NOT_ASSERTED'},editorialStatus:'PROVISIONAL_QA_PASSED',registrationStatus:'NOT_REGISTERED'});
 });
}