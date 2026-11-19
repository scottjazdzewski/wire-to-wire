/**
 * WIRE TO WIRE — active 1999 game naming-origin bridge.
 * Uses actual world identity and journal evidence. Proposals are NOT name releases.
 * Pure ESM: no external dependencies, persistent writes, or secret credentials.
 */
import {ensure, worldIdentity} from './contracts.js';
import {createNamingFeedback,validateNamingFeedback,recordNamingFeedback,nameFeedbackKey} from './horse-naming-feedback-v489.js';
import {OWNER_REVIEWED_NAME_KEYS_V478} from './horse-naming-owner-review-v478.js';

export const GAME_NAMING_BRIDGE_SCHEMA='WTW_GAME_NAME_ORIGIN_BRIDGE_V1';
export const HORSE_NAMING_COMMANDS=Object.freeze(['RECORD_HORSE_NAMING_STORY','OWNER_SET_HORSE_NAMING_PREFERENCE']);
const nameKey=v=>String(v??'').normalize('NFKC').toLocaleLowerCase('en-US')
 .replace(/[\u2018\u2019]/g,"'").replace(/[^a-z0-9]+/g,'');
const safeId=/^H-GAME-1999-[A-Za-z0-9-]{1,64}$/;
const allowedName=/^[\p{L}\p{N} '&\u2019-]+$/u;
const plain=x=>Boolean(x)&&typeof x==='object'&&!Array.isArray(x);
const text=x=>typeof x==='string'?x.trim():'';

function checkHorse(world,horse){
 ensure(plain(horse)&&safeId.test(horse.horse_id||''),
  'NAMING_ID','Requires a future 1999 career horse ID');
 ensure(Number.isInteger(horse.foaling_year)&&horse.foaling_year>=1980&&horse.foaling_year<=1997,
  'NAMING_AGE','Expected a valid 1999 registered horse foaling year');
 const owner=worldIdentity(world,'organizations',horse.owner_organization_id);
 const breeder=worldIdentity(world,'organizations',horse.breeder_organization_id);
 ensure(Boolean(owner)&&Boolean(breeder),'NAMING_PARTIES','Owner and breeder must exist in the current world');
 // The 1999 registrar explicitly forbids inferred sire/dam identities for game horses.
 ensure(!horse.sire_id&&!horse.dam_id,'NAMING_UNRELEASED_PEDIGREE','Game career lineage is not released');
 return {owner,breeder};
}

function eventMentionsHorse(event,horse){
 const d=event?.details;
 return plain(d)&&[d.horse_id,d.foal_id,d.subject_horse_id].includes(horse.horse_id);
}

/** Bind a proposed game horse to ACTUAL owner/breeder and source journal events. */
export function buildGameHorseNamingBrief({world,state,horse,ownerStories=null}={}){
 const {owner,breeder}=checkHorse(world,horse);
 ensure(plain(state)&&Array.isArray(state.event_log),'NAMING_JOURNAL','Current game journal required');
 const savedStories=state.runtime?.horse_naming?.stories_by_id||{};
 const stories=ownerStories??Object.values(savedStories);
 ensure(Array.isArray(stories),'NAMING_STORIES','Owner stories must be a list');
 // A caller cannot impersonate the owner by passing an unattested narrative.
 ensure(stories.every(s=>plain(s)&&savedStories[s.story_id]&&
  savedStories[s.story_id].story===s.story&&
  savedStories[s.story_id].horse_id===s.horse_id&&
  savedStories[s.story_id].owner_id===s.owner_id),
  'NAMING_STORY_UNVERIFIED','Every owner naming story must come from the actual game save');
 const evidence=[];
 for(const e of state.event_log){
  if(!eventMentionsHorse(e,horse))continue;
  if(typeof e.kind!=='string'||!Number.isInteger(e.seq)||!/^\d{4}-\d{2}-\d{2}$/.test(e.date))continue;
  evidence.push({id:`GAME_EVENT:${e.seq}`,kind:'GAME_EVENT',date:e.date,
   sourceRef:`event_log:${e.seq}`,detail:e.kind,
   // Event details are included exactly, not paraphrased into invented stories.
   sourceDetails:JSON.parse(JSON.stringify(e.details))});
 }
 for(const s of stories){
  if(s.horse_id!==horse.horse_id)continue;
  ensure(plain(s)&&text(s.story_id)&&text(s.story).length>=24&&text(s.story).length<=1000,
   'NAMING_STORY','Owner story needs stable ID and useful narrative');
  ensure(s.owner_id===horse.owner_organization_id&&s.horse_id===horse.horse_id&&
   s.attested_by==='OWNER','NAMING_STORY_SOURCE','Story must be explicitly attested for this owner and horse');
  ensure(!evidence.some(e=>e.id===`OWNER_STORY:${s.story_id}`),'NAMING_DUPLICATE_STORY','Duplicate story ID');
  evidence.push({id:`OWNER_STORY:${s.story_id}`,kind:'OWNER_ATTESTED',
   sourceRef:`owner_story:${s.story_id}`,detail:s.story.trim()});
 }
 const seen=new Set();
 ensure(evidence.every(e=>!seen.has(e.id)&&seen.add(e.id)),'NAMING_DUPLICATE_EVIDENCE','Duplicate evidence');
 const directStory=evidence.some(e=>e.kind==='OWNER_ATTESTED');
 // A plain registration event is not enough to supply a meaningful naming story.
 const meaningfulEvent=evidence.some(e=>e.kind==='GAME_EVENT'&&
  typeof e.sourceDetails?.naming_narrative==='string'&&
  e.sourceDetails.naming_narrative.trim().length>=24); 
 return {
  schema:GAME_NAMING_BRIDGE_SCHEMA,horseId:horse.horse_id,foalingYear:horse.foaling_year,
  owner:{id:horse.owner_organization_id,name:owner.name},
  breeder:{id:horse.breeder_organization_id,name:breeder.name},
  foalingLocationId:text(horse.foaling_location_id)||null,
  evidence,
  status:directStory||meaningfulEvent?'READY_FOR_ORIGINAL_NAME_WRITING':'NEEDS_A_REAL_HORSE_STORY',
  instruction:'Create a name tied to this horse and this owner, not a stock phrase. Preserve source evidence. No word-list assembly. No unverified pedigree.'
 };
}

/** A literal candidate + explanation is NOT accepted merely because it passed QA. */
export function screenGameHorseName({world,state,brief,proposal,reviewedNames=[],reservedNames=[],issuedNames=[],
 registeredNameKeys=null}={}){
 ensure(brief?.schema===GAME_NAMING_BRIDGE_SCHEMA,'NAMING_BRIEF','Valid game naming brief required');
 ensure(plain(proposal),'NAMING_PROPOSAL','Proposal required');
 const reasons=[];
 const name=text(proposal.name),normalized=nameKey(name);
 if(!name||name.length>18||!allowedName.test(name)||name!==proposal.name)reasons.push('REGISTRATION_NAME_FORMAT');
 if(brief.status!=='READY_FOR_ORIGINAL_NAME_WRITING')reasons.push('MISSING_MEANINGFUL_ORIGIN');
 const anchor=brief.evidence.find(e=>e.id===proposal.evidenceId);
 if(!anchor)reasons.push('UNVERIFIED_STORY_ANCHOR');
 if(text(proposal.explanation).length<30)reasons.push('UNEXPLAINED_NAME');
 if(!text(proposal.writer_id))reasons.push('MISSING_WRITER_ID');
 // The full 300k-world Naming Desk passes its existing normalized
 // name index, eliminating hundreds of thousands of repeated scans per
 // displayed idea. Without that trusted preview index, preserve the old
 // exhaustive source-world + active-registry collision behavior.
 if(registeredNameKeys!==null&&!(registeredNameKeys instanceof Set))
  throw Error('Name availability index must be a Set');
 const perRequest=[...reviewedNames,...reservedNames,...issuedNames];
 const occupied=registeredNameKeys?
  registeredNameKeys.has(normalized):
  [...(world?.entities?.horses||[]).map(x=>x.name),
   ...Object.values(state?.runtime?.registered_horses?.by_id||{})
    .map(x=>x.registered_name)].some(n=>nameKey(n)===normalized);
 if(normalized&&(occupied||perRequest.some(n=>
  nameKey(typeof n==='string'?n:n?.name)===normalized)))
  reasons.push('NAME_ALREADY_USED_OR_REVIEWED');
 return {schema:GAME_NAMING_BRIDGE_SCHEMA,horseId:brief.horseId,
  name,evidenceId:proposal.evidenceId,origin:anchor?.detail||null,
  explanation:text(proposal.explanation),writerId:text(proposal.writer_id),
  status:reasons.length?'HELD':'AWAITING_INDEPENDENT_EDITOR',reasons,
  // No registration API, accepted release, game save or user-rating impersonation.
  gameWrites:0,registrationStatus:'NOT_RELEASED'};
}

export function recordGameNameEditorialDecision(screened,{editorId,verdict,notes}={}){
 ensure(screened?.status==='AWAITING_INDEPENDENT_EDITOR','NAMING_EDITOR','Only screened proposals can be reviewed');
 ensure(text(editorId)&&editorId!==screened.writerId,'NAMING_INDEPENDENCE','Editor must differ from writer');
 ensure(['SEND_TO_OWNER','REJECT','REVISE'].includes(verdict)&&text(notes).length>=20,
  'NAMING_EDITOR','Explicit editorial verdict and explanation required');
 return {...screened,editorId,editorNotes:text(notes),
  status:verdict==='SEND_TO_OWNER'?'PENDING_OWNER_REVIEW':'HELD_BY_EDITOR',
  registrationStatus:'NOT_RELEASED',gameWrites:0};
}


/** Actual save-backed player-authored stories. No generated name and no accepted release. */
export function createHorseNamingRuntime(){
 return {schema:GAME_NAMING_BRIDGE_SCHEMA,stories_by_id:{},candidates_by_id:{},feedback:createNamingFeedback()};
}
export function validateHorseNamingRuntime(state,world){
 const rt=state.runtime?.horse_naming;
 if(rt===undefined)return; // Old saved careers remain importable.
 ensure(plain(rt)&&rt.schema===GAME_NAMING_BRIDGE_SCHEMA&&plain(rt.stories_by_id),
  'NAMING_RUNTIME','Invalid persisted naming story directory');
 if(rt.feedback!==undefined)validateNamingFeedback(rt.feedback);
 for(const [id,s] of Object.entries(rt.stories_by_id)){
  ensure(plain(s)&&s.story_id===id&&/^[A-Za-z0-9_-]{4,64}$/.test(id),
   'NAMING_STORY_ID','Invalid saved story identity');
  ensure(s.attested_by==='OWNER'&&safeId.test(s.horse_id)&&
   text(s.story).length>=24&&text(s.story).length<=1000&&
   worldIdentity(world,'organizations',s.owner_id)&&
   worldIdentity(world,'organizations',s.breeder_id)&&
   s.date<=state.clock.date,
   'NAMING_STORY','Invalid persisted naming story');
 }
}
export function recordHorseNamingStoryAction({state,world,command,emit}){
 ensure(command.type==='RECORD_HORSE_NAMING_STORY'&&command.actor==='player'&&
  state.player?.role==='owner','NAMING_AUTH','Only the horse owner can attest naming stories');
 const p=command.payload;
 ensure(plain(p)&&plain(p.horse),'NAMING_STORY','Expected horse proposal and story');
 const {owner,breeder}=checkHorse(world,p.horse);
 ensure(state.player.operation_id===p.horse.owner_organization_id,
  'NAMING_OWNER','Cannot attest another owner’s horse story');
 const id=text(p.story_id),story=text(p.story);
 ensure(/^[A-Za-z0-9_-]{4,64}$/.test(id)&&story.length>=24&&story.length<=1000,
  'NAMING_STORY','Invalid ID or story text');
 const rt=state.runtime.horse_naming??(state.runtime.horse_naming=createHorseNamingRuntime());
 ensure(!rt.stories_by_id[id],'NAMING_DUPLICATE_STORY','A story with this ID already exists');
 const record={story_id:id,owner_id:p.horse.owner_organization_id,
  breeder_id:p.horse.breeder_organization_id,horse_id:p.horse.horse_id,
  foaling_year:p.horse.foaling_year,story,attested_by:'OWNER',date:state.clock.date,
  owner_name:owner.name,breeder_name:breeder.name};
 rt.stories_by_id[id]=record;
 emit('HORSE_NAMING_STORY_RECORDED',{
  story_id:id,horse_id:record.horse_id,owner_id:record.owner_id});
}
/** Durable game-owner feedback only. The official horse name registry is
 * unchanged until an independently screened and owner-approved release. */
export function recordHorseNamingPreferenceAction({state,world,command,emit}){
 ensure(command.actor==='player'&&state.player?.role==='owner'&&state.player.operation_id,
  'NAMING_FEEDBACK_AUTH','Only the player owner may choose or review names');
 const p=command.payload||{},horseId=p.horse_id||'';
 ensure(command.type==='OWNER_SET_HORSE_NAMING_PREFERENCE'&&
  ['KEEP','REJECT','CHOOSE'].includes(p.decision)&&
  typeof p.name==='string'&&typeof p.prompt==='string'&&
  typeof p.motif_id==='string'&&typeof horseId==='string',
  'NAMING_FEEDBACK_INPUT','An exact owner naming decision is required');
 if(p.decision==='CHOOSE'){
  const horse=state.runtime.registered_horses?.by_id?.[horseId]||
   world.entities.horses.find(h=>h.id===horseId);
  ensure(horse&&state.stable_horse_ids.includes(horseId)&&
   horse.owner_organization_id===state.player.operation_id,
   'NAMING_FEEDBACK_HORSE','Choose requires a real player-owned horse');
 }else ensure(!horseId,'NAMING_FEEDBACK_HORSE','Only Choose may identify a horse');
 // A kept name promises future availability; never bank or choose names that
 // are already registered or in the protected owner-review exclusion ledger.
 if(p.decision!=='REJECT'){
  const registered=[...world.entities.horses.map(h=>h.name),
   ...Object.values(state.runtime.registered_horses?.by_id||{}).map(h=>h.registered_name),
   ...OWNER_REVIEWED_NAME_KEYS_V478];
  ensure(!registered.some(n=>nameFeedbackKey(n)===nameFeedbackKey(p.name)),
   'NAMING_FEEDBACK_COLLISION','Name is already registered or previously reviewed');
 }
 const rt=state.runtime.horse_naming,prior=rt.feedback??createNamingFeedback();
 const updated=recordNamingFeedback(prior,{name:p.name,decision:p.decision,
  motifId:p.motif_id,horseId,prompt:p.prompt});
 ensure(updated!==prior,'NAMING_FEEDBACK_NO_CHANGE','Identical review already recorded');
 rt.feedback=updated;
 emit('HORSE_NAMING_PREFERENCE_RECORDED',{name:p.name,decision:p.decision,
  horse_id:horseId||null,feedback_revision:updated.revision,
  registration_status:'NOT_RELEASED'});
}
