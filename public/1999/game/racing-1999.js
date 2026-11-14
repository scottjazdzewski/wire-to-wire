/**
 * WTW 1999 — authoritative game-run race entry, jockey booking and result settlement.
 * Schedule comes from the EXISTING 1999 track condition-book generator. All
 * results and professional ratings here are GAME-MODELED, never historic facts.
 */
import {ensure,isObject,worldIdentity,nextDate,validDate} from './contracts.js';
import {buildConditionBook1999} from '../../next/1999-condition-book-engine.mjs';
import {getGameHorsePerformance,modelHorsePostRaceResponse} from './horse-care.js';
import {applyRaceAgentFeedback} from './daily-agents.js';

export const GAME_RACING_SCHEMA='WTW_1999_CAREER_RACING_V1';
export const RACING_COMMANDS=Object.freeze(['ACTIVATE_JOCKEY_COLONY','OPEN_1999_RACE','ENTER_1999_RACE',
 'BOOK_1999_JOCKEY','SETTLE_1999_RACE']);
const cents=x=>Number.isSafeInteger(x)&&x>=0;
const dayGap=(a,b)=>(Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000;
const bound=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const rating=v=>Math.round(bound(v)*1000)/1000;
const frac=(seed,key)=>{let n=(2166136261^(seed>>>0))>>>0;
 for(const c of key){n^=c.charCodeAt(0);n=Math.imul(n,16777619)}
 n^=n>>>16;n=Math.imul(n,2246822507);n^=n>>>13;
 return (n>>>0)/4294967296};
export const createRacingRuntime=()=>({
 schema:GAME_RACING_SCHEMA,jockeys:{},jockey_finances_minor:{},trainer_finances_minor:{},
 last_selection_date:null,last_settlement_date:null,selection_count:0
});
const root=state=>state.runtime.racing??(state.runtime.racing=createRacingRuntime());
const candidate=state=>Object.values(state.runtime.registered_horses?.by_id||{}).
 filter(h=>!!h.starting_attributes).sort((a,b)=>a.horse_id.localeCompare(b.horse_id));
const trackFor=(world,id)=>world.entities.tracks.find(x=>x.id===id)||null;
const person=(world,id)=>Boolean(worldIdentity(world,'people',id));
/** Jockey choice is bilateral: a system booking must be accepted by the
 * actual rider agent. Reputation, suitability, expenses and travel matter.
 * Seeded tie-breaking is fixed by J/P/H/R IDs, never the hidden race result.
 */
export function jockeyBookingDecision(state,world,race,horse,jockey){
 const rt=root(state),j=typeof jockey==='string'?rt.jockeys[jockey]:jockey;
 if(!j||!race||!horse)return {accept:false,reason:'UNKNOWN_BOOKING_PARTIES'};
 const away=j.home_track_id!==race.track_id,lead=dayGap(state.clock.date,race.date);
 if(lead<1||away&&lead<4)return {accept:false,reason:'INSUFFICIENT_TRAVEL_LEAD'};
 const personal=j.skills,horseState=getGameHorsePerformance(state,world,horse.horse_id);
 const h=horse.starting_attributes,standing=j.game_reputation??.5;
 const suited=rating(personal.horse_handling*.38+personal.composure*.17+
  h.temperament*.18+horseState.race_performance_index*.27);
 const required=away?.37+standing*.13:.26+standing*.08;
 const favor=(frac(state.rng.seed,j.id+':'+race.id+':'+horse.horse_id+':mount')-.5)*.09;
 const accept=suited+favor>=required;
 return {accept,reason:accept?(away?'JOCKEY_ACCEPTS_PAID_TRAVEL':'JOCKEY_ACCEPTS_LOCAL_MOUNT'):
   'JOCKEY_DECLINES_UNSUITABLE_MOUNT',suited_index:suited,
   threshold:rating(required),away,lead_days:lead,
   jockey_reputation:standing};
}
export function modeledJockeySkills(id,seed){
 ensure(/^P-[A-Za-z0-9-]+$/.test(id),'JOCKEY_ID','Permanent selected jockey ID required');
 return {rating_source:'1999_MODELED_GAME_SCORING_NOT_CANONICAL',
  judgment:rating(.38+.56*frac(seed,id+':judgment')),
  pace:rating(.36+.58*frac(seed,id+':pace')),
  finish:rating(.34+.6*frac(seed,id+':finish')),
  composure:rating(.38+.54*frac(seed,id+':composure')),
  horse_handling:rating(.38+.54*frac(seed,id+':handling'))};
}
export function gameRaceProgram(state,world,trackId,date){
 const track=trackFor(world,trackId);
 if(!track||!validDate(date)||!date.startsWith('1999-'))return [];
 const ix=world.entities.tracks.findIndex(t=>t.id===trackId);
 return buildConditionBook1999({date,track,trackIndex:ix,seed:state.rng.seed,
  sourceStakes:[],includeKnownStakes:false});
}
function raceShape(book){
 return {id:book.id,track_id:book.trackId,date:book.date,number:book.number,
  name:book.name,conditions:book.conditions,age:book.ageRequirement,
  sex:book.sexRestriction,surface:book.surface,distance_furlongs:book.distanceFurlongs,
  max_wins:book.maxCareerWins,maiden:book.maidenOnly,
  field_capacity:book.fieldCapacity,purse_minor:Math.round(book.purse*100),
  source:'WTW_1999_TRACK_SPECIFIC_MEET_PROGRESSION',
  status:'ENTRIES_OPEN',field:[],results:null,escrow_minor:Math.round(book.purse*100)};
}
export function raceEligibility(state,horse,race){
 const reasons=[],care=state.runtime.horse?.[horse.horse_id],site=state.runtime.facilities?.sites?.[horse.current_residence_id];
 const age=1999-horse.foaling_year;
 if(race.age==='3YO'&&age!==3||race.age==='2YO'&&age!==2||
   race.age==='3YO+'&&age<3)reasons.push('AGE_RESTRICTION');
 if(race.sex==='FILLIES_AND_MARES'&&!['FILLY','MARE'].includes(horse.sex))
  reasons.push('SEX_RESTRICTION');
 if(race.conditions!=='Maiden Special Weight')
  reasons.push('CLASS_CONDITIONS_NOT_YET_MODELED');
 if(race.maiden&&horse.career.wins>0)reasons.push('MAIDEN_RESTRICTION');
 if(race.max_wins!==null&&race.max_wins!==undefined&&horse.career.wins>race.max_wins)
  reasons.push('CAREER_WIN_LIMIT');
 if(!site||site.host_track_id!==race.track_id)reasons.push('NOT_STABLED_AT_TRACK');
 if(!care||care.training.sorenessDays>0||care.training.currentRisk>=.78||
  care.training.readiness<.43||care.history.at(-1)?.unfunded===true)
  reasons.push('CONDITION_NOT_CLEARED');
 if(dayGap(state.clock.date,race.date)<1)reasons.push('ENTRY_DEADLINE');
 if(dayGap(state.clock.date,race.date)>28)reasons.push('ENTRY_TOO_EARLY');
 const history=Object.values(state.runtime.races||{}).
  filter(r=>r.status==='OFFICIAL_SIM_RESULT'&&r.results?.some(row=>row.horse_id===horse.horse_id))
  .sort((a,b)=>b.date.localeCompare(a.date));
 if(history.length&&dayGap(history[0].date,race.date)<12)reasons.push('INSUFFICIENT_RECOVERY_SPACING');
 const other=Object.values(state.runtime.entries||{}).some(e=>e.horse_id===horse.horse_id&&
  e.race_id!==race.id&&state.runtime.races?.[e.race_id]?.date===race.date&&
  e.status!=='SCRATCHED');
 if(other)reasons.push('CONFLICTING_ENTRY');
 return {eligible:reasons.length===0,reasons};
}
function charge(state,owner,amount,kind,race,h,jockeyId){
 const money=state.runtime.finances.operation_balances_minor;
 ensure(cents(money[owner])&&money[owner]>=amount,'RACE_FINANCE','Owner cannot afford race booking');
 money[owner]-=amount;
 if(state.player.operation_id===owner)state.runtime.finances.balance_minor=money[owner];
 state.runtime.finances.ledger.push({date:state.clock.date,kind,operation_id:owner,
  amount_minor:-amount,race_id:race.id,horse_id:h.horse_id,jockey_id:jockeyId});
}
export function racingAction({state,world,command,emit}){
 const p=command.payload,rt=root(state),type=command.type;
 if(type==='ACTIVATE_JOCKEY_COLONY'){
  ensure(command.actor==='system'&&Array.isArray(p.jockeys)&&p.jockeys.length<=120&&p.jockeys.length>=2&&
   Object.keys(rt.jockeys).length===0,'JOCKEY_COLONY','Selected jockey colony is a one-time authorized source release');
  const unique=new Set();
  for(const j of p.jockeys){
   ensure(isObject(j)&&person(world,j.id)&&trackFor(world,j.home_track_id)&&!unique.has(j.id),
    'JOCKEY_COLONY','Selected jockey needs an approved P-ID and home-track T-ID');
   unique.add(j.id);
   rt.jockeys[j.id]={id:j.id,home_track_id:j.home_track_id,skills:modeledJockeySkills(j.id,state.rng.seed),
    source:'SELECTED_1999_JOCKEY_IDENTITY_GAME_MODEL',starts:0,wins:0,game_reputation:.5,last_track_id:j.home_track_id};
   rt.jockey_finances_minor[j.id]=0;
  }
  emit('JOCKEY_COLONY_ACTIVATED',{jockeys:unique.size,ratings:'MODELED_NOT_SOURCE_CERTIFIED'});
 }else if(type==='OPEN_1999_RACE'){
  ensure(command.actor==='system'&&trackFor(world,p.track_id)&&validDate(p.date)&&
   dayGap(state.clock.date,p.date)>=2&&dayGap(state.clock.date,p.date)<=28,
   'RACE_PROGRAM','Only legal future 1999 race cards may open');
  const book=gameRaceProgram(state,world,p.track_id,p.date).find(x=>x.id===p.race_id);
  ensure(book&&!state.runtime.races[p.race_id]&&!book.stakeId,
   'RACE_PROGRAM','Race ID must match an ordinary modeled source condition book');
  state.runtime.races[book.id]=raceShape(book);
  emit('RACE_PROGRAM_OPENED',{race_id:book.id,date:book.date,track_id:book.trackId,
   surface:book.surface,distance_furlongs:book.distanceFurlongs,
   field_capacity:book.fieldCapacity,purse_minor:Math.round(book.purse*100),
   authority:'MODELED_1999_CONDITION_BOOK'});
 }else if(type==='ENTER_1999_RACE'){
  const race=state.runtime.races[p.race_id],horse=state.runtime.registered_horses?.by_id?.[p.horse_id];
  ensure(race&&horse&&race.status==='ENTRIES_OPEN','RACE_ENTRY','Open race and registered horse required');
  ensure(command.actor==='system'||(command.actor==='player'&&state.player.operation_id===horse.owner_organization_id),
   'RACE_PERMISSION','Only the horse owner or AI may enter this runner');
  ensure(race.field.length<race.field_capacity&&!state.runtime.entries[race.id+':'+horse.horse_id],
   'RACE_FULL_OR_DUPLICATE','Race is full or horse already entered');
  const check=raceEligibility(state,horse,race);
  ensure(check.eligible,'RACE_INELIGIBLE',check.reasons.join(','));
  const id=race.id+':'+horse.horse_id,entry={id,race_id:race.id,horse_id:horse.horse_id,
   trainer_id:horse.trainer_id,owner_id:horse.owner_organization_id,
   jockey_id:null,status:'ENTERED',decision:command.actor==='player'?'PLAYER_ENTRY':'AI_TRAINER_NOMINATION',
   entered_date:state.clock.date};
  state.runtime.entries[id]=entry;race.field.push(id);
  emit('RACE_ENTRY_CONFIRMED',{race_id:race.id,horse_id:horse.horse_id,
   trainer_id:horse.trainer_id,owner_id:horse.owner_organization_id,
   decision:entry.decision});
 }else if(type==='BOOK_1999_JOCKEY'){
  const race=state.runtime.races[p.race_id],entry=state.runtime.entries[p.race_id+':'+p.horse_id],
   horse=state.runtime.registered_horses?.by_id?.[p.horse_id],j=rt.jockeys[p.jockey_id];
  ensure(race&&entry&&horse&&j&&entry.status==='ENTERED'&&!entry.jockey_id&&
   race.status==='ENTRIES_OPEN','JOCKEY_BOOKING','Selected jockey and unbooked entry required');
  ensure(command.actor==='system'||(command.actor==='player'&&
   state.player.operation_id===horse.owner_organization_id),
   'RACE_PERMISSION','Player cannot book another owner’s mount');
  const gap=dayGap(state.clock.date,race.date),travel=j.home_track_id!==race.track_id;
  ensure(gap>=1&&(!travel||gap>=4),'JOCKEY_TRAVEL','Away-colony jockey requires four days to arrange travel');
  const conflicts=Object.values(state.runtime.entries).filter(e=>e.jockey_id===j.id&&
   state.runtime.races[e.race_id]?.date===race.date&&e.status!=='SCRATCHED');
  ensure(!conflicts.some(e=>e.race_id===race.id),'JOCKEY_DOUBLE_BOOK','One jockey cannot ride two horses in a race');
  ensure(conflicts.every(e=>state.runtime.races[e.race_id].track_id===race.track_id),
   'JOCKEY_LOCATION','One jockey cannot ride at separate tracks on the same date');
  const decision=jockeyBookingDecision(state,world,race,horse,j);
  ensure(decision.accept,'JOCKEY_DECLINED',decision.reason);
  const base=6000,travelMinor=travel?18000:0,fee=base+travelMinor;
  charge(state,horse.owner_organization_id,fee,'JOCKEY_MOUNT_AND_TRAVEL_FEE',race,horse,j.id);
  rt.jockey_finances_minor[j.id]+=fee;
  state.runtime.finances.ledger.push({date:state.clock.date,kind:'JOCKEY_FEE_RECEIVED',
   operation_id:null,person_id:j.id,amount_minor:fee,race_id:race.id,horse_id:horse.horse_id});
  entry.jockey_id=j.id;entry.status='BOOKED';entry.fee_minor=fee;entry.travel=travel;
  emit('JOCKEY_MOUNT_BOOKED',{race_id:race.id,horse_id:horse.horse_id,jockey_id:j.id,
   booked_track_id:race.track_id,home_track_id:j.home_track_id,away_travel:travel,
   fee_minor:fee,reason:decision.reason,acceptance:decision.suited_index,threshold:decision.threshold});
 }else if(type==='SETTLE_1999_RACE'){
  ensure(command.actor==='system','RACE_PERMISSION','Only game race controller settles races');
  settle1999Race({state,world,race_id:p.race_id,emit});
 }else ensure(false,'RACE_COMMAND','Unknown race action');
}
function performance(state,world,race,entry){
 const horse=state.runtime.registered_horses.by_id[entry.horse_id],
  a=horse.starting_attributes,j=root(state).jockeys[entry.jockey_id].skills,
  now=getGameHorsePerformance(state,world,entry.horse_id);
 const sprint=race.distance_furlongs<8;
 const surface=race.surface==='TURF'?a.turf_aptitude:a.dirt_aptitude;
 const distance=sprint?a.sprint_aptitude:a.route_aptitude;
 const pace=rating((a.early_pace+a.finishing_kick+a.acceleration)/3);
 const rider=rating(j.judgment*.24+j.pace*.28+j.finish*.26+j.horse_handling*.22);
 const variation=(frac(state.rng.seed,entry.horse_id+':'+race.id+':race')-.5)*.11*
  (1.3-.6*a.consistency);
 const composite=now.race_performance_index*.49+surface*.14+distance*.14+
  pace*.09+rider*.10+j.composure*.04+variation;
 return {entry,horse,composite:rating(composite),rider};
}
const SHARES=[.6,.2,.11,.06,.03];
function settle1999Race({state,world,race_id,emit}){
 const race=state.runtime.races[race_id],rt=root(state);
 ensure(Boolean(race)&&race.status==='ENTRIES_OPEN'&&race.date===state.clock.date,
  'RACE_DATE','A race can only be settled on its scheduled game day');
 const entries=race.field.map(id=>state.runtime.entries[id]);
 ensure(entries.length>=2&&entries.length<=race.field_capacity&&entries.every(e=>
  e&&e.status==='BOOKED'&&rt.jockeys[e.jockey_id]),
  'RACE_FIELD','A valid field requires at least two fully booked runners');
 const horseSet=new Set(entries.map(e=>e.horse_id));
 ensure(horseSet.size===entries.length,'RACE_FIELD','Duplicate horse in race field');
 const scored=entries.map(e=>performance(state,world,race,e)).
  sort((a,b)=>b.composite-a.composite||a.horse.horse_id.localeCompare(b.horse.horse_id));
 const paidPlaces=Math.min(scored.length,5),shares=SHARES.slice(0,paidPlaces);
 const weight=shares.reduce((a,b)=>a+b,0),awards=scored.map(()=>0);
 let remainder=race.purse_minor;
 for(let i=0;i<paidPlaces-1;i++){
  awards[i]=Math.floor(race.purse_minor*shares[i]/weight);remainder-=awards[i];
 }
 awards[paidPlaces-1]=remainder;
 const results=scored.map(({horse,entry,composite,rider},i)=>{
  const awarded=awards[i];
  const jockeyShare=Math.round(awarded*.1),trainerShare=Math.round(awarded*.1),
   ownerShare=awarded-jockeyShare-trainerShare;
  const owner=horse.owner_organization_id,jockey=entry.jockey_id;
  const money=state.runtime.finances.operation_balances_minor;
  ensure(cents(money[owner]),'RACE_FINANCE','Owner account must exist to settle race');
  money[owner]+=ownerShare;
  if(owner===state.player.operation_id)state.runtime.finances.balance_minor=money[owner];
  rt.jockey_finances_minor[jockey]+=jockeyShare;
  rt.trainer_finances_minor[horse.trainer_id]=(rt.trainer_finances_minor[horse.trainer_id]||0)+trainerShare;
  state.runtime.finances.ledger.push(
   {date:state.clock.date,kind:'RACE_PURSE_OWNER_CREDIT',operation_id:owner,
    amount_minor:ownerShare,race_id:race.id,horse_id:horse.horse_id},
   {date:state.clock.date,kind:'RACE_PURSE_JOCKEY_CREDIT',operation_id:null,person_id:jockey,
    amount_minor:jockeyShare,race_id:race.id,horse_id:horse.horse_id},
   {date:state.clock.date,kind:'RACE_PURSE_TRAINER_CREDIT',operation_id:null,person_id:horse.trainer_id,
    amount_minor:trainerShare,race_id:race.id,horse_id:horse.horse_id});
  horse.career.starts++;if(i===0)horse.career.wins++;
  horse.career.earnings_minor+=awarded;
  const j=rt.jockeys[jockey];j.starts++;if(i===0)j.wins++;
  const outcome=1-i/Math.max(1,scored.length-1);
  j.game_reputation=rating((j.game_reputation??.5)+(outcome-.5)*.014);
  state.runtime.horse[horse.horse_id]=modelHorsePostRaceResponse(
   state.runtime.horse[horse.horse_id],horse,{
    race_id:race.id,finish:i+1,field_size:scored.length,
    distance_furlongs:race.distance_furlongs},state.rng.seed);
  entry.status='RESULTED';entry.finish=i+1;
  return {horse_id:horse.horse_id,owner_id:owner,trainer_id:horse.trainer_id,
   jockey_id:jockey,finish:i+1,earnings_minor:awarded,
   owner_share_minor:ownerShare,jockey_share_minor:jockeyShare,
   trainer_share_minor:trainerShare,
   performance_index:composite,rider_index:rider};
 });
 applyRaceAgentFeedback({state,world,race,results,emit});
 race.results=results;race.status='OFFICIAL_SIM_RESULT';race.settled_date=state.clock.date;
 race.escrow_minor=0;race.result_provenance='DETERMINISTIC_1999_GAME_SIMULATION';
 // Sponsor escrow is a modeled external event budget, not new owner or jockey
 // money; this one recorded credit offsets exactly the paid purse amounts.
 state.runtime.finances.ledger.push({date:state.clock.date,
  kind:'RACE_MODELED_SPONSOR_ESCROW_RELEASE',operation_id:null,
  amount_minor:-race.purse_minor,race_id:race.id,
  provenance:'MODELED_GAME_PURSE_NOT_HISTORICAL'});
 emit('RACE_SETTLED',{race_id:race.id,track_id:race.track_id,
  date:race.date,starters:results.length,winner_horse_id:results[0].horse_id,
  purse_minor:race.purse_minor,modeled:true});
}
export function validateRacingRuntime(state,world){
 const rt=state.runtime.racing;
 if(!rt)return;
 ensure(rt.schema===GAME_RACING_SCHEMA&&isObject(rt.jockeys)&&
  isObject(rt.jockey_finances_minor)&&isObject(rt.trainer_finances_minor)&&
  Number.isSafeInteger(rt.selection_count),
  'RACE_SAVE','Invalid race subsystem');
 for(const j of Object.values(rt.jockeys))
  ensure(person(world,j.id)&&Boolean(trackFor(world,j.home_track_id))&&
   cents(rt.jockey_finances_minor[j.id])&&cents(j.starts)&&cents(j.wins)&&j.wins<=j.starts,
   'RACE_SAVE','Unknown or invalid jockey agent');
 for(const [id,r] of Object.entries(state.runtime.races||{})){
  if(!r.source||r.source!=='WTW_1999_TRACK_SPECIFIC_MEET_PROGRESSION')continue;
  ensure(r.id===id&&trackFor(world,r.track_id)&&validDate(r.date)&&
   ['ENTRIES_OPEN','OFFICIAL_SIM_RESULT','CANCELLED_INSUFFICIENT_FIELD'].includes(r.status)&&
   Array.isArray(r.field)&&r.field.length<=r.field_capacity&&
   cents(r.purse_minor)&&cents(r.escrow_minor)&&
   r.escrow_minor===(r.status==='OFFICIAL_SIM_RESULT'?0:r.purse_minor),
   'RACE_SAVE','Invalid scheduled race');
  for(const entryId of r.field){
   const e=state.runtime.entries[entryId];
   ensure(e&&e.race_id===id&&state.runtime.registered_horses?.by_id?.[e.horse_id]&&
    e.id===entryId,'RACE_SAVE','Missing runner or horse reference');
   if(e.jockey_id)ensure(Boolean(rt.jockeys[e.jockey_id]),'RACE_SAVE','Missing booked jockey');
  }
  if(r.status==='OFFICIAL_SIM_RESULT'){
   ensure(Array.isArray(r.results)&&r.results.length===r.field.length&&
    r.results.reduce((x,y)=>x+y.earnings_minor,0)===r.purse_minor&&
    new Set(r.results.map(x=>x.finish)).size===r.field.length,
    'RACE_SAVE','Settlement must reconcile purse and full finishing order');
  }
 }
}
export function getGameRacingRoster(state,trackId=null){
 return Object.values(state.runtime.races||{}).
  filter(r=>r.source==='WTW_1999_TRACK_SPECIFIC_MEET_PROGRESSION'&&
   (!trackId||r.track_id===trackId)).
  sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)).
  map(r=>structuredClone(r));
}
