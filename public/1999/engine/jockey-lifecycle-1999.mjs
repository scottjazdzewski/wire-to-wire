/**
 * Wire to Wire — actual in-game jockey workforce turnover.
 * Opening 1999 identities remain immutable. Every retired rider keeps a
 * permanent record, real results and earnings; new apprentice IDs are bound
 * to a dated modeled career identity, track and usable jockey agent.
 */
import {createPersonnelNameRoster} from './personnel-name-engine.mjs';
import {cancel1999PaidFutureJockeyMounts} from './jockey-incidents-1999.mjs';
export const JOCKEY_WORKFORCE_MODEL='WTW_JOCKEY_WORKFORCE_ANNUAL_V1';
const bound=(n,a,b)=>Math.max(a,Math.min(b,n));
function hash(seed,key){
 let n=(2166136261^(seed>>>0))>>>0;
 for(const c of String(key)){n^=c.charCodeAt(0);n=Math.imul(n,16777619)}
 n^=n>>>16;n=Math.imul(n,2246822507);n^=n>>>13;
 return n>>>0;
}
const rand=(seed,key)=>hash(seed,key)/4294967296;
const rate=n=>Math.round(bound(n,0,1)*1000)/1000;
const fullYear=date=>Number(date.slice(0,4));
function yearOfBirth(identity,id,seed){
 if(/^\d{4}-\d{2}-\d{2}$/.test(identity?.dateOfBirth||''))
  return fullYear(identity.dateOfBirth);
 // Existing named legacy riders may lack a date of birth; do not mutate
 // historical source identities to invent one. Game-only age is stable.
 return 1999-(23+hash(seed,id+':MODELED_OPENING_AGE')%19);
}
function shouldRetire(year,j,identity,seed){
 const age=year-yearOfBirth(identity,j.id,seed),
  mandatory=48+hash(seed,j.id+':RETIREMENT_AGE')%8;
 if(age>=mandatory)return {retire:true,age,reason:'AGE_LIMIT'};
 const chance=age<42?0:Math.min(.3,(age-41)*.023);
 return {retire:chance>0&&
  rand(seed,j.id+':RETIREMENT_DECISION:'+year)<chance,
  age,reason:'ANNUAL_CAREER_REVIEW'};
}
function newApprentice({state,world,year,ordinal,trackId,names}){
 const rt=state.runtime.racing,seed=state.rng.seed;
 const id='P-GAME-JOCKEY-'+year+'-'+String(ordinal).padStart(5,'0');
 if(rt.jockeys[id]||rt.generated_jockeys[id])
  throw Error('Duplicated permanent rookie jockey ID '+id);
 let named=null;
 // Reuse the canonical role- and geographic-conditioned personnel name
 // engine; avoid duplicates against existing source and saved rookie names.
 for(let attempt=0;attempt<18;attempt++){
  const candidate=createPersonnelNameRoster(
   1+hash(seed,id+':NAME:'+attempt)%2147483646,1,()=>'jockey')[0];
  const normalized=candidate?.name?.normalize('NFKD').
   replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  if(normalized&&!names.has(normalized)){
   named=candidate;names.add(normalized);break;
  }
 }
 if(!named)throw Error('No unique permanent rookie name available');
 const born=year-(18+hash(seed,id+':AGE')%6),
  birthMonth=1+hash(seed,id+':MONTH')%12,
  birthDay=1+hash(seed,id+':DAY')%28;
 const sourcePerson={
  id,role:'jockey',name:named.name,tier:'DEVELOPING',workplaceId:trackId,
  dateOfBirth:born+'-'+String(birthMonth).padStart(2,'0')+'-'+
   String(birthDay).padStart(2,'0'),
  nationalityCode:named.birthCountry||'US',
  birthCountryCode:named.birthCountry||'US',
  ratings:{ability:28+hash(seed,id+':ABILITY')%35,
   potential:53+hash(seed,id+':POTENTIAL')%47},
  career_entry_year:year,
  provenance:'MODELED_FUTURE_JOCKEY_NOT_1999_OPENING_PERSON',
  name_model:named.nameModel||null
 };
 const skill=(tag,base,range)=>rate(base+range*rand(seed,id+':'+tag));
 rt.generated_jockeys[id]=sourcePerson;
 rt.jockeys[id]={id,home_track_id:trackId,tier:'DEVELOPING',
  source:'MODELED_FUTURE_JOCKEY_CAREER_ID',
  starts:0,wins:0,career_status:'ACTIVE',career_entry_year:year,
  last_track_id:trackId,game_reputation:skill('REP',.27,.2),
  skills:{rating_source:'MODELED_DATED_ROOKIE_SKILLS',
   judgment:skill('JUDGMENT',.36,.22),pace:skill('PACE',.32,.25),
   finish:skill('FINISH',.32,.23),
   composure:skill('COMPOSURE',.36,.2),
   horse_handling:skill('HANDLING',.35,.25)}};
 rt.jockey_finances_minor[id]=0;
 return sourcePerson;
}
/**
 * Called on each ADVANCE_DAY, but transitions only on January 1. State is
 * persisted by the canonical kernel, no separate time engine or generated
 * 1999 source world. Older careers need no schema migration.
 */
export function advance1999JockeyWorkforce({state,world,emit}){
 const today=state.clock.date,year=fullYear(today);
 if(today.slice(5)!=='01-01'||year<=1999)
  return {year,retired:0,entered:0,changed:false};
 const rt=state.runtime?.racing;
 if(!rt||Object.keys(rt.jockeys||{}).length<2||
  rt.last_workforce_year>=year)
  return {year,retired:0,entered:0,changed:false};
 rt.generated_jockeys??={};
 const source=new Map((world.entities?.people||[]).map(p=>[p.id,p]));
 const all=Object.values(rt.jockeys);
 const retired=[];
 const names=new Set([...source.values(),...Object.values(rt.generated_jockeys)].
  map(p=>p.name?.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').
   toLowerCase().replace(/[^a-z0-9]/g,'')).filter(Boolean));
 for(const j of all.sort((a,b)=>a.id.localeCompare(b.id))){
  if(j.career_status==='RETIRED')continue;
  const identity=source.get(j.id)||rt.generated_jockeys[j.id];
  if(!identity)throw Error('Active rider lacks durable source identity '+j.id);
  const assessment=shouldRetire(year,j,identity,state.rng.seed);
  if(!assessment.retire)continue;
  j.career_status='RETIRED';j.retired_date=today;
  j.retirement_reason=assessment.reason;
  const reversals=cancel1999PaidFutureJockeyMounts(state,j,{
   kind:'RETIREMENT',start_date:today,through_date:'9999-12-31'
  },emit);
  retired.push(j);
  emit('JOCKEY_RETIRED',{
   jockey_id:j.id,track_id:j.home_track_id,
   age:assessment.age,career_starts:j.starts,career_wins:j.wins,
   reason:assessment.reason,
   refunded_mounts:reversals.count,refunded_minor:reversals.total});
 }
 let entered=0;
 // Replace, never endlessly accumulate, active riders. Retired identities
 // remain saved for official results and their historical financial ledger.
 for(const j of retired){
  const rookie=newApprentice({state,world,year,ordinal:entered+1,
   trackId:j.home_track_id,names});
  entered++;
  emit('JOCKEY_APPRENTICE_ENTERED',{
   jockey_id:rookie.id,name:rookie.name,
   home_track_id:rookie.workplaceId,career_entry_year:year,
   replaces_retired_id:j.id,
   identity_source:'MODELED_SEASONAL_JOCKEY_ROOKIE'});
 }
 rt.last_workforce_year=year;
 if(retired.length)emit('JOCKEY_WORKFORCE_ANNUAL_TRANSITION',{
  year,retired:retired.length,entered,active_roster_count:
   Object.values(rt.jockeys).filter(j=>j.career_status!=='RETIRED').length,
  policy:'REPLACEMENT_ONLY_PRESERVE_SOURCE_IDENTITIES_AND_RECORDS'});
 return {year,retired:retired.length,entered,changed:true};
}
/** Ranking is earned and reproducible after JSON save/reopen. */
export function get1999JockeyCareerRankings({state,world,limit=120}){
 if(!Number.isSafeInteger(limit)||limit<1||limit>5000)
  throw Error('Invalid jockey ranking limit');
 const rt=state.runtime.racing;
 const source=new Map((world.entities?.people||[]).map(p=>[p.id,p]));
 return Object.values(rt?.jockeys||{}).map(j=>{
  const person=source.get(j.id)||rt.generated_jockeys?.[j.id];
  return {id:j.id,name:person?.name||j.id,
   tier:j.tier,home_track_id:j.home_track_id,
   career_status:j.career_status||'ACTIVE',
   career_starts:j.starts,career_wins:j.wins,
   win_rate:j.starts?Math.round(j.wins/j.starts*1000)/1000:0,
   career_income_minor:rt.jockey_finances_minor[j.id]||0,
   reputation:j.game_reputation??0,
   rookie_year:person?.career_entry_year??null,
   injured_or_suspended_until:j.availability?.through_date??null};
 }).sort((a,b)=>Number(b.career_status==='ACTIVE')-
   Number(a.career_status==='ACTIVE')||
  b.career_wins-a.career_wins||
  b.win_rate-a.win_rate||
  b.reputation-a.reputation||a.id.localeCompare(b.id)).
 slice(0,limit);
}
