/** WIRE TO WIRE V484 — zero-write, deterministic 1999–2099 foal-naming job planner.
 * 55,000/year is a throughput TARGET, not an instruction to populate the game.
 * Only the actual game's certified foaling records should feed these briefs.
 */
import {GAME_NAMING_BRIDGE_SCHEMA} from './horse-naming-bridge.js';
export const POPULATION_NAMING_SCHEMA='WTW_POPULATION_NAMING_BATCH_V1';
export const POPULATION_NAMING_BATCH_SIZE=16;
import {OWNER_REVIEWED_NAME_KEYS_V478} from './horse-naming-owner-review-v478.js';

const id=/^[A-Za-z0-9][A-Za-z0-9_-]{7,95}$/;
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g,'');
const rated=new Set(OWNER_REVIEWED_NAME_KEYS_V478);

/** Records existing in a future game world must be passed by their real identity. */
export function foalingEventNamingBrief({horseId,foalingYear,owner,breeder,event}={}){
 if(typeof horseId!=='string'||horseId.length>96||!id.test(horseId)||
  !Number.isInteger(foalingYear)||foalingYear<1999||foalingYear>2099||
  typeof owner?.id!=='string'||typeof owner?.name!=='string'||
  typeof breeder?.id!=='string'||typeof breeder?.name!=='string'||
  event?.kind!=='FOALING_EVENT'||event.horseId!==horseId||
  typeof event.eventId!=='string'||!id.test(event.eventId)||
  typeof event.naming_narrative!=='string'||event.naming_narrative.trim().length<35||
  event.naming_narrative.length>1000)
  throw Error('Future horse requires real foaling record and meaningful source event');
 return {schema:GAME_NAMING_BRIDGE_SCHEMA,horseId,foalingYear,owner,breeder,
  foalingLocationId:event.foalingLocationId||null,status:'READY_FOR_ORIGINAL_NAME_WRITING',
  evidence:[{id:'GAME_EVENT:'+event.eventId,kind:'GAME_EVENT',sourceRef:'foaling_event:'+event.eventId,
   sourceDetails:{naming_narrative:event.naming_narrative},detail:event.naming_narrative}],
  namingAuthority:'PROPOSED_FROM_SOURCE_GAME_EVENT_NOT_A_REGISTRATION'};
}

/** Cursor-like generator: creates <=16 prompts at a time, not 55k AI calls in one request. */
export function* planPopulationNamingCohorts(foalBriefs,{runId,year,recentNames=[]}={}){
 if(!id.test(String(runId||''))||!Number.isInteger(year)||year<1999||year>2099)
  throw Error('Valid game-run and 1999–2099 foaling year required');
 if(!Array.isArray(recentNames)||recentNames.length>60)throw Error('Invalid cohort context');
 const seen=new Set();let group=[],index=0;
 for(const brief of foalBriefs){
  if(brief?.schema!==GAME_NAMING_BRIDGE_SCHEMA||brief.status!=='READY_FOR_ORIGINAL_NAME_WRITING'||
   !id.test(brief.horseId||'')||brief.foalingYear!==year||seen.has(brief.horseId))
   throw Error('Missing, duplicate, or mismatched future foal naming record');
  seen.add(brief.horseId);group.push({brief});
  if(group.length===POPULATION_NAMING_BATCH_SIZE){
   yield {schema:POPULATION_NAMING_SCHEMA,jobId:`wtw_${runId}_${year}_${String(index++).padStart(6,'0')}`,
    year,items:group,recentNames:recentNames.slice(-60)};
   group=[];
  }
 }
 if(group.length)yield {schema:POPULATION_NAMING_SCHEMA,
  jobId:`wtw_${runId}_${year}_${String(index).padStart(6,'0')}`,
  year,items:group,recentNames:recentNames.slice(-60)};
}

/** This is a hold/review ledger, NOT name issuance or official registry clearance. */
export function auditPopulationNamingResults({results=[],briefs=[],existingNames=[]}={}){
 if(!Array.isArray(results)||!Array.isArray(briefs)||!Array.isArray(existingNames))
  throw Error('Invalid naming audit input');
 const briefMap=new Map(briefs.map(b=>[b.horseId,b]));
 const used=new Set([...rated,...existingNames.map(norm)]),out=[];
 let held=0,review=0;
 for(const row of results){
  const brief=briefMap.get(row?.horseId);
  const proposals=[];
  for(const p of row?.candidates||[]){
   const key=norm(p.name),evidence=(brief?.evidence||[]).find(e=>e.id===p.evidenceId);
   const narrative=evidence?.kind==='OWNER_ATTESTED'?evidence.detail:
    evidence?.kind==='GAME_EVENT'?evidence.sourceDetails?.naming_narrative:'';
   const reason=[];
   if(!brief||!evidence||!String(narrative||'').toLowerCase().includes(String(p.evidenceQuote||'').trim().toLowerCase())||
    String(p.evidenceQuote||'').trim().length<12)reason.push('NOT_SOURCE_VERIFIED');
   if(!key||String(p.name||'').length>18||used.has(key))reason.push('KNOWN_OR_RESERVED_NAME');
   if(String(p.explanation||'').trim().length<35)reason.push('WEAK_NAME_ORIGIN');
   if(!reason.length)used.add(key);
   proposals.push({name:p.name,status:reason.length?'HELD':'READY_FOR_INDEPENDENT_EDITOR',reasons:reason,
    horseId:row.horseId,registered:false,gameWrites:0});
   if(reason.length)held++;else review++;
  }
  out.push({horseId:row.horseId,proposals});
 }
 return {totalProposals:held+review,held,readyForIndependentEditor:review,
  screened:out,approvedForRegistration:false,gameWrites:0,
  note:'Name proposals remain held until source verification, editor review and owner approval.'};
}