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
