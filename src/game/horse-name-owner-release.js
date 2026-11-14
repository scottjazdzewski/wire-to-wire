/**
 * Wire to Wire — human owner-approval bridge to existing 1999 horse registrar.
 * This module NEVER assigns a name automatically. It cannot approve its writer.
 * Stage: trusted game system, independent editorial check; decide: owner; release:
 * immutable approved manifest that the existing registrar can consume.
 */
import {ensure,worldIdentity} from './contracts.js';
import {buildGameHorseNamingBrief,recordGameNameEditorialDecision}
 from './horse-naming-bridge.js';
import {screenStoryFirstIdeas,GAME_NAME_WRITER_ID}
 from './horse-naming-model-creator.js';
import {OWNER_REVIEWED_NAME_KEYS_V478} from './horse-naming-owner-review-v478.js';

export const HORSE_NAME_OWNER_RELEASE_SCHEMA='WTW_1999_STORY_NAME_OWNER_RELEASE_V1';
export const HORSE_NAME_OWNER_COMMANDS=Object.freeze([
 'STAGE_STORY_HORSE_NAME','OWNER_ACCEPT_STORY_HORSE_NAME','OWNER_REJECT_STORY_HORSE_NAME'
]);
const idPattern=/^[A-Za-z0-9][A-Za-z0-9_:-]{3,127}$/;
const text=x=>typeof x==='string'?x.trim():'';
const obj=x=>Boolean(x)&&typeof x==='object'&&!Array.isArray(x);
const key=x=>String(x||'').normalize('NFKC').toLowerCase().replace(/[\u2018\u2019]/g,"'").replace(/[^a-z0-9]/g,'');
const goodDate=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x);
const candidateDir=state=>state.runtime.horse_naming?.candidates_by_id||{};

export function ensureHorseNameCandidateDirectory(state){
 ensure(obj(state?.runtime?.horse_naming),'NAME_CANDIDATES','Horse naming runtime unavailable');
 const rt=state.runtime.horse_naming;
 if(rt.candidates_by_id===undefined)rt.candidates_by_id={}; // older saves
 ensure(obj(rt.candidates_by_id),'NAME_CANDIDATES','Invalid naming-candidate directory');
 return rt.candidates_by_id;
}

export function validateHorseNameCandidates(state,world){
 const dir=candidateDir(state),approvedHorses=new Set(),acceptedNames=new Set();
 ensure(obj(dir),'NAME_CANDIDATES','Invalid naming-candidate directory');
 for(const [id,c] of Object.entries(dir)){
  ensure(obj(c)&&c.candidate_id===id&&idPattern.test(id)&&
   /^H-GAME-1999-[A-Za-z0-9-]{1,64}$/.test(c.horse_id)&&
   typeof c.name==='string'&&c.name.trim()===c.name&&c.name.length>0&&c.name.length<=18&&
   ['PENDING_OWNER_REVIEW','OWNER_APPROVED','OWNER_REJECTED'].includes(c.status)&&
   goodDate(c.created_date)&&c.created_date<=state.clock.date&&
   worldIdentity(world,'organizations',c.owner_organization_id)&&
   worldIdentity(world,'organizations',c.breeder_organization_id)&&
   Number.isInteger(c.foaling_year)&&c.foaling_year>=1980&&c.foaling_year<=1996&&
   text(c.story_id)&&text(c.evidence_id)&&text(c.explanation).length>=35&&
   c.writer_id===GAME_NAME_WRITER_ID&&text(c.editor_id)&&c.editor_id!==c.writer_id&&
   text(c.editor_notes).length>=20,
   'NAME_CANDIDATE_INVALID','Invalid saved owner-reviewed naming candidate');
  const story=state.runtime.horse_naming?.stories_by_id?.[c.story_id];
  ensure(story&&story.horse_id===c.horse_id&&story.owner_id===c.owner_organization_id&&
   story.breeder_id===c.breeder_organization_id&&story.foaling_year===c.foaling_year&&
   c.evidence_id===`OWNER_STORY:${c.story_id}`,
   'NAME_CANDIDATE_ORIGIN','Candidate does not match its owner-attested story');
  if(c.status==='OWNER_APPROVED'){
   ensure(goodDate(c.decided_date)&&c.decided_date>=c.created_date&&
    c.decided_date<=state.clock.date,'NAME_CANDIDATE_DECISION','Invalid owner-approval timestamp');
   ensure(!approvedHorses.has(c.horse_id),'NAME_CANDIDATE_DUPLICATE_APPROVAL','Horse has more than one approved name');
   approvedHorses.add(c.horse_id);
  }
  if(c.status==='OWNER_REJECTED')ensure(goodDate(c.decided_date),'NAME_CANDIDATE_DECISION','Rejected proposal needs a date');
  if(c.status==='PENDING_OWNER_REVIEW')ensure(c.decided_date===null,'NAME_CANDIDATE_DECISION','Pending candidate cannot have a decision date');
  ensure(!acceptedNames.has(key(c.name)),'NAME_CANDIDATE_REUSE','Same name in multiple owner review records');
  acceptedNames.add(key(c.name));
 }
}

/** Only the trusted game system stages ideas that a separate editor sent to owner. */
export function stageStoryHorseNameAction({state,world,command,emit}){
 ensure(command.type==='STAGE_STORY_HORSE_NAME'&&command.actor==='system',
  'NAME_STAGE_AUTH','Only the registered game naming system can stage a candidate');
 const p=command.payload;
 ensure(obj(p)&&obj(p.horse)&&obj(p.idea)&&obj(p.editor),'NAME_STAGE_INPUT','Expected origin-bound horse, idea and independent editor');
 const candidateId=text(p.candidate_id);
 ensure(idPattern.test(candidateId),'NAME_STAGE_ID','Stable candidate ID required');
 const dir=ensureHorseNameCandidateDirectory(state);
 ensure(!dir[candidateId],'NAME_STAGE_DUPLICATE','Name candidate ID already exists');
 const brief=buildGameHorseNamingBrief({world,state,horse:p.horse});
 const storyId=String(p.idea.evidenceId||'').startsWith('OWNER_STORY:')?
  p.idea.evidenceId.slice('OWNER_STORY:'.length):null;
 ensure(storyId&&state.runtime.horse_naming.stories_by_id?.[storyId],
  'NAME_STAGE_STORY','A saved, owner-attested horse story is required');
 const already=Object.values(dir).map(x=>x.name);
 const screened=screenStoryFirstIdeas({world,state,brief,rawIdeas:[p.idea],
  issuedNames:already,reservedNames:p.reserved_names||[]});
 ensure(screened.readyForIndependentEditor===1,
  'NAME_STAGE_SCREEN','Candidate failed story, registered-name, format or previously reviewed-name screening');
 const editorial=recordGameNameEditorialDecision(screened.screened[0],{
  editorId:p.editor.editor_id,verdict:p.editor.verdict,notes:p.editor.notes
 });
 ensure(editorial.status==='PENDING_OWNER_REVIEW','NAME_STAGE_EDITOR','Independent editor must send proposal to owner');
 const story=state.runtime.horse_naming.stories_by_id[storyId];
 const record={schema:HORSE_NAME_OWNER_RELEASE_SCHEMA,
  candidate_id:candidateId,horse_id:p.horse.horse_id,name:screened.screened[0].name,
  owner_organization_id:brief.owner.id,breeder_organization_id:brief.breeder.id,
  foaling_year:p.horse.foaling_year,story_id:storyId,evidence_id:p.idea.evidenceId,
  evidence_quote:p.idea.evidenceQuote,explanation:screened.screened[0].explanation,
  writer_id:screened.screened[0].writerId,editor_id:p.editor.editor_id,
  editor_notes:text(p.editor.notes),status:'PENDING_OWNER_REVIEW',
  created_date:state.clock.date,decided_date:null};
 ensure(story.owner_id===record.owner_organization_id&&story.horse_id===record.horse_id,
  'NAME_STAGE_STORY','Attested story mismatches proposal owner');
 dir[candidateId]=record;
 emit('HORSE_NAME_STAGED_FOR_OWNER',{horse_id:record.horse_id,candidate_id:candidateId,name:record.name});
}

/** The actual player-owner must decide; no model can self-approve a horse name. */
export function ownerDecidesHorseNameAction({state,world,command,emit}){
 ensure(['OWNER_ACCEPT_STORY_HORSE_NAME','OWNER_REJECT_STORY_HORSE_NAME'].includes(command.type)&&
  command.actor==='player'&&state.player?.role==='owner',
  'NAME_OWNER_AUTH','Only the game player-owner can decide a name');
 const id=text(command.payload?.candidate_id),c=candidateDir(state)[id];
 ensure(c&&c.status==='PENDING_OWNER_REVIEW','NAME_OWNER_PENDING','Candidate is not awaiting owner decision');
 ensure(state.player.operation_id===c.owner_organization_id,
  'NAME_OWNER_MISMATCH','Player cannot approve another owner’s horse');
 if(command.type==='OWNER_ACCEPT_STORY_HORSE_NAME'){
  ensure(!Object.values(candidateDir(state)).some(x=>x.horse_id===c.horse_id&&x.status==='OWNER_APPROVED'),
   'NAME_OWNER_ALREADY_APPROVED','Another name for this horse was already approved');
  ensure(!OWNER_REVIEWED_NAME_KEYS_V478.includes(key(c.name))&&
   !world.entities.horses.some(x=>key(x.name)===key(c.name))&&
   !Object.values(state.runtime.registered_horses?.by_id||{}).some(x=>key(x.registered_name)===key(c.name)),
   'NAME_OWNER_COLLISION','Name was used, reviewed, or registered while pending');
 }
 c.status=command.type==='OWNER_ACCEPT_STORY_HORSE_NAME'?'OWNER_APPROVED':'OWNER_REJECTED';
 c.decided_date=state.clock.date;
 emit('HORSE_NAME_OWNER_DECISION',{horse_id:c.horse_id,candidate_id:id,
  decision:c.status,name:c.name,source:'EXPLICIT_PLAYER_OWNER'});
}

/** Deterministic official registrar payload only after owner has accepted. */
export function makeOwnerApprovedHorseNamingRelease({state,world,horse_id,candidate_id,release_id,reserved_names=[]}={}){
 ensure(obj(state)&&obj(world)&&typeof horse_id==='string'&&
  idPattern.test(candidate_id||'')&&idPattern.test(release_id||'')&&
  Array.isArray(reserved_names),'NAME_RELEASE_INPUT','Valid explicit release request required');
 const c=candidateDir(state)[candidate_id];
 ensure(c&&c.horse_id===horse_id&&c.status==='OWNER_APPROVED'&&
  worldIdentity(world,'organizations',c.owner_organization_id),
  'NAME_RELEASE_NOT_APPROVED','Explicit game-owner approval required');
 const others=[...world.entities.horses.map(h=>h.name),
  ...Object.values(state.runtime.registered_horses?.by_id||{}).map(h=>h.registered_name),
  ...reserved_names];
 ensure(!others.some(name=>key(name)===key(c.name)),
  'NAME_RELEASE_COLLISION','Approved name collides with racehorse name registry');
 ensure(!OWNER_REVIEWED_NAME_KEYS_V478.includes(key(c.name)),
  'NAME_RELEASE_REVIEWED','Never recycle a name already rated by the owner');
 const proof={schema:HORSE_NAME_OWNER_RELEASE_SCHEMA,horse_id:c.horse_id,
  candidate_id:c.candidate_id,owner_organization_id:c.owner_organization_id,
  approved_date:c.decided_date};
 return {schema:HORSE_NAME_OWNER_RELEASE_SCHEMA,release_id,
  status:'ACCEPTED',candidates:[{candidate_id:c.candidate_id,
    name:c.name,status:'ACCEPTED',approval_proof:proof}],
  reserved_names:{version:`OWNER-RELEASE:${release_id}`,names:[...reserved_names]},
  authority:'EXPLICIT_GAME_OWNER_APPROVAL_NOT_OFFICIAL_REAL_WORLD_NAME_CLEARANCE'};
}

/** Require that owner approval has not been forged inside a registrar manifest. */
export function validateOwnerApprovalInRelease({state,horse,release,candidate}){
 if(release?.schema!==HORSE_NAME_OWNER_RELEASE_SCHEMA)return; // preexisting registrar manifests
 const c=candidateDir(state)[candidate?.candidate_id];
 const p=candidate?.approval_proof;
 ensure(c&&c.status==='OWNER_APPROVED'&&c.horse_id===horse.horse_id&&
  c.name===horse.registered_name&&c.owner_organization_id===horse.owner_organization_id&&
  c.breeder_organization_id===horse.breeder_organization_id&&
  c.foaling_year===horse.foaling_year&&
  obj(p)&&p.schema===HORSE_NAME_OWNER_RELEASE_SCHEMA&&p.horse_id===c.horse_id&&
  p.candidate_id===c.candidate_id&&p.owner_organization_id===c.owner_organization_id&&
  p.approved_date===c.decided_date,
  'NAME_RELEASE_PROOF','Candidate name release needs actual stored player-owner approval');
}