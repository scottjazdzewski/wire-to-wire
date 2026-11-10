/**
 * WTW professional standing: reputation is a consequence of recorded career
 * evidence and relationships, never a substitute for personal skill.
 * Pure, deterministic functions; no private canon mutations and no random data.
 */
import {ensure, isObject, validDate, strictJSON} from './contracts.js';

export const REPUTATION_SCHEMA='WTW_PERSON_REPUTATION_V1';
const MIN=0, MAX=100;
const inRange=n=>typeof n==='number'&&Number.isFinite(n)&&n>=MIN&&n<=MAX;
const clamp=n=>Math.max(MIN,Math.min(MAX,Math.round(n*100)/100));
const refsOK=refs=>Array.isArray(refs)&&refs.length>0&&refs.every(x=>typeof x==='string'&&x.length>0&&x.length<=250);
const coreProfile=record=>record&&isObject(record)&&record.schema===REPUTATION_SCHEMA&&isObject(record.scores)&&Array.isArray(record.history);

export function validateReputationCatalog(catalog) {
 const r=catalog?.reputation;
 ensure(r?.schema===REPUTATION_SCHEMA,'REPUTATION_SCHEMA','Missing approved reputation catalog');
 ensure(r?.scale?.min===MIN&&r?.scale?.max===MAX,'REPUTATION_SCALE','Reputation scale must be 0–100');
 const axes=r.axes.map(x=>x.key);
 ensure(new Set(axes).size===axes.length&&axes.includes('overall'),'REPUTATION_AXES','Unique axes including overall required');
 for(const [kind,effect] of Object.entries(r.effects||{})){
  ensure(effect.reputation_weight>=0&&effect.reputation_weight<=0.3&&effect.nonreputation_weight===1-effect.reputation_weight,
    'REPUTATION_EFFECT','Reputation cannot outweigh primary practical fit for '+kind);
  ensure(effect.audiences.every(x=>axes.includes(x)),'REPUTATION_AXES','Opportunity audiences must be defined');
 }
 for(const [signal,deltas] of Object.entries(r.signals||{}))
  for(const [key,delta] of Object.entries(deltas))
   ensure(axes.includes(key)&&Number.isInteger(delta)&&Math.abs(delta)<=5,'REPUTATION_SIGNAL','Out-of-range event '+signal);
 return r;
}

export function makeReputationBaseline({catalog,scores,circuit_id=null,date,source_kind,source_refs}={}){
 const r=validateReputationCatalog(catalog);
 ensure(validDate(date),'INVALID_DATE','Baseline date required');
 ensure(['CANON_EVIDENCE','GENERATED_GAME'].includes(source_kind),'REPUTATION_SOURCE','Baseline must be sourced or produced by approved character generation');
 ensure(refsOK(source_refs),'REPUTATION_EVIDENCE','Baseline must include provenance');
 ensure(isObject(scores)&&inRange(scores.overall),'REPUTATION_SCORE','Overall standing requires a source-backed numeric score');
 const allowed=new Set(r.axes.map(x=>x.key));
 for(const [key,n] of Object.entries(scores))
  ensure(allowed.has(key)&&inRange(n),'REPUTATION_SCORE','Unknown or out-of-range reputation axis '+key);
 ensure(circuit_id===null||typeof circuit_id==='string','REPUTATION_CIRCUIT','Circuit ID must be a string or null');
 return strictJSON({schema:REPUTATION_SCHEMA,scores:{...scores},
  circuit_id,as_of:date,source:{kind:source_kind,refs:[...source_refs]},history:[]});
}
export function applyReputationSignal({catalog,profile,signal,date,source_refs,event_id}={}){
 const r=validateReputationCatalog(catalog);
 ensure(coreProfile(profile),'REPUTATION_BASELINE','No accepted person reputation baseline');
 ensure(validDate(date)&&date>=profile.as_of,'INVALID_DATE','Reputation event cannot precede the previous observation');
 ensure(typeof event_id==='string'&&event_id.trim(),'REPUTATION_EVENT','Event ID required');
 ensure(refsOK(source_refs),'REPUTATION_EVIDENCE','Event must have a source reference');
 const change=r.signals[signal];
 ensure(change&&isObject(change),'REPUTATION_SIGNAL','Unknown reputation signal');
 ensure(!profile.history.some(x=>x.id===event_id),'DUPLICATE_REPUTATION','Reputation event already recorded');
 const next=strictJSON(profile),before={...next.scores};
 for(const [axis,delta] of Object.entries(change)){
   // Facets not previously scored remain unknown until a sourced baseline.
   if(inRange(next.scores[axis]))next.scores[axis]=clamp(next.scores[axis]+delta);
 }
 next.as_of=date;
 next.history.push({id:event_id,date,signal,source_refs:[...source_refs],before,after:{...next.scores}});
 return strictJSON(next);
}
export function personReputationView(profile,catalog){
 const r=validateReputationCatalog(catalog);
 if(!profile)return {score:null,label:'Unrated',origin:null,axes:r.axes.map(a=>({key:a.key,label:a.label,score:null})),as_of:null,events:0};
 ensure(coreProfile(profile),'REPUTATION_SCHEMA','Invalid reputation profile');
 const score=profile.scores.overall??null;
 const label=score===null?'Unrated':score<25?'Emerging':score<50?'Developing':score<75?'Established':score<90?'Highly regarded':'Elite';
 return {score,label,origin:profile.source?.kind||null,axes:r.axes.map(a=>({key:a.key,label:a.label,score:profile.scores[a.key]??null})),
  as_of:profile.as_of,events:profile.history.length};
}
/**
 * A reputation score has a meaningful but bounded influence on opportunities.
 * This is a deterministic ranking adapter — it does not book rides, assign a
 * horse, buy an animal or bypass calendars, eligibility, budgets or contracts.
 *
 * All candidate signals are caller-authorized 0..1 *game estimates*; they are
 * not exposed as hidden true abilities on public profiles.
 */
export function rankProfessionalCandidates({catalog,world,state,opportunity,candidates}={}){
 const r=validateReputationCatalog(catalog);
 ensure(isObject(opportunity)&&isObject(r.effects[opportunity.type]),'REPUTATION_OPPORTUNITY','Unknown opportunity type');
 ensure(Array.isArray(candidates),'REPUTATION_CANDIDATES','Candidate list required');
 const config=r.effects[opportunity.type];
 const people=new Set(world.entities.people.map(p=>p.id));
 const score=n=>n===null||n===undefined?0.5:n;
 const fitOK=v=>v===null||v===undefined||typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1;
 return candidates.filter(c=>{
  ensure(isObject(c)&&people.has(c.person_id),'UNKNOWN_PERSON','Candidate must match an approved world person');
  for(const key of ['ability_fit','relationship_fit','logistics_fit'])ensure(fitOK(c[key]),'CANDIDATE_FIT','Fit must be 0..1');
  return c.available!==false&&c.eligible!==false;
 }).map(c=>{
  const practical=(0.45*score(c.ability_fit)+0.3*score(c.relationship_fit)+0.25*score(c.logistics_fit));
  const rep=state.runtime.people[c.person_id]?.reputation;
  const available=config.audiences.map(a=>rep?.scores?.[a]).filter(inRange);
  const standing=available.length?available.reduce((x,y)=>x+y,0)/available.length/100:null;
  const ranking=(config.nonreputation_weight*practical)+(config.reputation_weight*(standing??practical));
  return {person_id:c.person_id,fit_score:Math.round(ranking*10000)/10000,
    reputation_contributed:standing!==null,opportunity:opportunity.type};
 }).sort((a,b)=>b.fit_score-a.fit_score||a.person_id.localeCompare(b.person_id));
}
export function auditPeopleReputationCoverage(state,world,catalog){
 validateReputationCatalog(catalog);
 const missing=[],invalid=[];
 for(const person of world.entities.people){
  const profile=state.runtime.people[person.id]?.reputation;
  if(!profile){missing.push(person.id);continue;}
  if(!coreProfile(profile)||!inRange(profile.scores.overall)||!refsOK(profile.source?.refs))invalid.push(person.id);
 }
 return {ok:!missing.length&&!invalid.length,total:world.entities.people.length,missing,invalid};
}
