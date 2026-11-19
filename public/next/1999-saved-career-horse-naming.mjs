/**
 * WTW Lane 7 — pure V10 saved-career horse-name transaction planner.
 *
 * This does NOT write a second database, register a name externally, or
 * regenerate immutable world identities. The existing commercial career
 * manager must commit both the feedback and the career name override in ONE
 * savePersistent1999CareerRun transaction before reporting success.
 */
import {createCareerWorldEdits,addCareerWorldEdit,applyCareerWorldEdits}
 from './1999-career-world-edits.mjs';
import {createNamingFeedback,validateNamingFeedback,recordNamingFeedback,
 nameFeedbackKey}
 from '../1999/game/horse-naming-feedback-v489.js';
import {OWNER_REVIEWED_NAME_KEYS_V478}
 from '../1999/game/horse-naming-owner-review-v478.js';
import {createLocalStoryIdeas,LOCAL_HORSE_NAMING_ALGORITHM_REVISION}
 from '../1999/game/horse-naming-local-v485.js';
import {screenStoryFirstIdeas}
 from '../1999/game/horse-naming-model-creator.js';
import {rankNamingCandidates,excludedNamingFeedbackNames}
 from '../1999/game/horse-naming-feedback-v489.js';

/**
 * Saved careers may contain an edited registered display name for an opening
 * horse. Validate against a projection with those same approved career edits,
 * NEVER against the unedited immutable base. Neither input is mutated.
 */
export function validateRunWithSavedWorldEdits(world,run,edits,validator){
 if(typeof validator!=='function')throw Error('A game validation service is required');
 // Never deep-copy the 300,000-horse immutable world to validate a handful
 // of player edits. Copy the directory arrays and ONLY the edited records.
 const changes=edits??createCareerWorldEdits();
 const ids=Object.entries(changes.byId||{}).reduce((acc,[ref])=>{
  const point=ref.indexOf(':');
  if(point>0){
   const kind=ref.slice(0,point);
   const bucket=kind==='horse'?'horses':kind==='person'?'people':
    kind==='organization'?'organizations':kind==='track'?'tracks':null;
   if(bucket){if(!acc[bucket])acc[bucket]=new Set();acc[bucket].add(ref.slice(point+1));}
  }
  return acc;
 },{});
 const validationWorld={...world,entities:Object.fromEntries(
  Object.entries(world.entities||{}).map(([bucket,records])=>[
   bucket,Array.isArray(records)?records.map(record=>
    ids[bucket]?.has(record.id)?{...record}:record):records
  ])
 )};
 const validationRun=structuredClone(run);
 applyCareerWorldEdits(validationWorld,changes,{run:validationRun});
 validator(validationRun,validationWorld);
 return true;
}

const blocked=new Set(OWNER_REVIEWED_NAME_KEYS_V478);
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);

/**
 * Source-backed story for a specific 300k-world horse, NOT the fictional
 * Naming Lab dummy horse. The story is supplied by the CURRENT player owner.
 * A preview is a draft; CHOOSE persists the owner text with the horse ID.
 */
export function buildV10OwnerHorseNamingBrief({world,run,horseId,story}={}){
 if(run?.player?.role!=='owner'||!run.player.operation_id||
  typeof horseId!=='string')throw Error('A real saved owner horse is required');
 const horse=world?.entities?.horses?.find(h=>h.id===horseId);
 if(!horse||(horse.ownerId??horse.owner_organization_id)!==
   run.player.operation_id)throw Error('That horse is not owned by the current player');
 if(typeof story!=='string'||story.trim().length<35||story.length>1000)
  throw Error('Write a horse-specific owner story of 35–1,000 characters');
 const owner=world.entities.organizations.find(o=>o.id===run.player.operation_id);
 const breederId=horse.breederId||horse.foalingFarmId;
 const breeder=world.entities.organizations.find(o=>o.id===breederId);
 if(!owner?.name||!breeder?.name||!Number.isInteger(horse.foalYear))
  throw Error('Selected horse lacks its real owner, breeder or foaling record');
 return {schema:'WTW_GAME_NAME_ORIGIN_BRIDGE_V1',horseId,
  foalingYear:horse.foalYear,
  owner:{id:owner.id,name:owner.name},
  breeder:{id:breeder.id,name:breeder.name},
  foalingLocationId:horse.foalingFarmId||null,
  evidence:[{id:'V10_OWNER_DRAFT:'+horseId,kind:'OWNER_ATTESTED',
   sourceRef:'v10_owner_story_draft:'+horseId,detail:story.trim()}],
  status:'READY_FOR_ORIGINAL_NAME_WRITING',
  namingAuthority:'OWNER_SUBMITTED_STORY_NOT_REGISTERED'};
}

/** Game's exact same local whole-name writer and independent screen, but
 * grounded in the actual saved 300k horse, owner and source-world ledger.
 * This is an editorial preview; no source or career writes are possible.
 */
export function previewV10OwnerHorseNames({world,run,horseId,story,count=8,
 attempt=0,recentNames=[],additionalReviewedNames=[],
 nameFeedback=null,direction=''}={}){
 if(!Number.isSafeInteger(count)||count<1||count>8||
  !Number.isSafeInteger(attempt)||attempt<0||attempt>1000000||
  !Array.isArray(recentNames)||!Array.isArray(additionalReviewedNames))
  throw Error('Invalid V10 horse naming preview controls');
 const brief=buildV10OwnerHorseNamingBrief({world,run,horseId,story});
 const feedback=validateNamingFeedback(nameFeedback??createNamingFeedback());
 const excluded=excludedNamingFeedbackNames(feedback);
 const {suggestions,hits}=createLocalStoryIdeas(brief,{count,attempt});
 const screened=[],already=new Set([...recentNames,...additionalReviewedNames,
  ...excluded].map(nameFeedbackKey));
 let held=0;
 for(let i=0;i<suggestions.length;i+=8){
  const result=screenStoryFirstIdeas({
   world,state:run,brief,rawIdeas:suggestions.slice(i,i+8),
   recentNames:recentNames.slice(-60),
   additionalReviewedNames:[...additionalReviewedNames,...excluded]
  });
  held+=result.held;
  for(const row of result.screened){
   if(row.status!=='AWAITING_INDEPENDENT_EDITOR')continue;
   const key=nameFeedbackKey(row.name);
   if(already.has(key))continue;
   const source=suggestions.find(s=>s.name===row.name);
   screened.push({...row,originMotif:source?.motifId||'other',
    origin:'SAVED_OWNER_HORSE_STORY',horseId});
   already.add(key);
  }
 }
 const ranked=rankNamingCandidates(screened,feedback,{direction});
 return {screened:ranked.slice(0,count),held,
  horseId,ownerId:brief.owner.id,breederId:brief.breeder.id,
  namingRevision:LOCAL_HORSE_NAMING_ALGORITHM_REVISION,
  status:ranked.length?'AWAITING_INDEPENDENT_EDITOR':'HOLD_NO_AVAILABLE_SOURCE_NAME',
  approvedForRegistration:false,gameWrites:0,requestCount:0};
}

/**
 * Fully pure. Candidate names are owner-provided via the existing screened
 * Naming Desk; neither candidate screening nor raw user input alone can
 * bypass ownership, format, source-world, and whole-world name collision gates.
 */
export function planV10SavedHorseNamingDecision({
 world,run,worldEdits=null,namingFeedback=null,payload
}={}){
 if(!world?.entities?.horses||!isObject(run)||!isObject(payload)||
  run.player?.role!=='owner'||typeof run.player.operation_id!=='string'||
  !run.player.operation_id)throw Error('An active owner career is required for a saved horse name');
 const {name,decision,motif_id,horse_id,prompt}=payload;
 if(!['KEEP','REJECT','CHOOSE'].includes(decision)||
  typeof name!=='string'||typeof motif_id!=='string'||
  typeof horse_id!=='string'||typeof prompt!=='string')
  throw Error('An exact Naming Desk owner decision is required');
 const horseId=decision==='CHOOSE'?horse_id:'';
 if(decision==='CHOOSE'&&!horseId)throw Error('Choose requires a saved horse ID');
 if(decision!=='CHOOSE'&&horse_id)throw Error('Only Choose may identify a horse');

 const current=namingFeedback===null?createNamingFeedback():
  validateNamingFeedback(namingFeedback);
 const target=horseId?world.entities.horses.find(h=>h.id===horseId):null;
 if(decision==='CHOOSE'&&(!target||
  (target.ownerId??target.owner_organization_id)!==run.player.operation_id))
  throw Error('Choose requires a real horse owned by the current player');
 if(decision!=='REJECT'){
  const key=nameFeedbackKey(name);
  if(blocked.has(key))throw Error('Previously owner-reviewed names cannot be reused');
  for(const h of world.entities.horses){
   if(h.id!==horseId&&nameFeedbackKey(h.name)===key)
    throw Error('Horse name conflicts with an existing world horse');
  }
  for(const h of Object.values(run.runtime?.registered_horses?.by_id||{})){
   if(h.world_source_horse_id===horseId||h.horse_id===horseId)continue;
   if(nameFeedbackKey(h.registered_name||h.name)===key)
    throw Error('Horse name conflicts with an existing registered horse');
  }
 }
 const feedback=recordNamingFeedback(current,{
  name,decision,motifId:motif_id,horseId,prompt
 });
 const edits=decision==='CHOOSE'?
  addCareerWorldEdit(worldEdits??createCareerWorldEdits(),world,
   'horse',horseId,{name},{run}):
  (worldEdits??createCareerWorldEdits());
 return {feedback,edits,horseId,
  identityUpdated:decision==='CHOOSE',decision,
  feedbackRevision:feedback.revision,
  // Legal racing registration remains separate from this game display rename.
  externalRegistrationApproved:false};
}
