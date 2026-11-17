/**
 * WTW 1999 — authoritative game-run race entry, jockey booking and result settlement.
 * Schedule comes from the EXISTING 1999 track condition-book generator. All
 * results and professional ratings here are GAME-MODELED, never historic facts.
 */
import {ensure,isObject,worldIdentity,nextDate,validDate} from './contracts.js';
import {buildConditionBook1999} from '../../public/next/1999-condition-book-engine.mjs';
import {getGameHorsePerformance,modelHorsePostRaceResponse} from './horse-care.js';
import {applyRaceAgentFeedback} from './daily-agents.js';
import {registerPostRaceCampaigns} from './post-race-campaign-1999.js';
import {horseTravelStatus,effectiveHorseTrack,validate1999HorseShipping} from './shipping-1999.js';
import {assessJockeySchedule,quoteJockeyMount,jockeyRaceImportance,
 jockeyTierFromPerson}
 from '../../public/1999/engine/jockey-engagements-1999.mjs';

import {get1999JockeyPartnership} from '../../public/1999/engine/jockey-partnerships-1999.mjs';

import {premierMarketRace,scorePremierJockeyOffer,premierBonusCap,premierOfferId}
 from '../../public/1999/engine/jockey-premier-market-1999.mjs';

import {apply1999JockeyPostRaceConsequences}
 from '../../public/1999/engine/jockey-incidents-1999.mjs';

export const GAME_RACING_SCHEMA='WTW_1999_CAREER_RACING_V1';
export const RACING_COMMANDS=Object.freeze(['ACTIVATE_JOCKEY_COLONY','OPEN_1999_RACE','ENTER_1999_RACE',
 'BOOK_1999_JOCKEY','OFFER_1999_PREMIER_JOCKEY','SET_1999_RACE_TACTICS','SETTLE_1999_RACE']);
export const RACE_TACTICS=Object.freeze(['AUTO','LEAD','PRESS','STALK','CLOSE']);
export const RACE_TACTICS_PREVIEW_SCHEMA='WTW_1999_RACE_TACTICS_PREVIEW_V1';
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
 premier_offers:{},horse_travel:{},
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
 // Bookings are the source of truth: a professional can ride 8+ different
 // races on one card, but not two horses in the same race or at two tracks.
 const schedule=assessJockeySchedule(state,world,j,race);
 if(!schedule.allowed)return {accept:false,reason:schedule.reason,schedule};
 const away=schedule.away,lead=dayGap(state.clock.date,race.date);
 const quote=quoteJockeyMount(j,race,{additionalTravel:schedule.additionalTravel});
 const importance=jockeyRaceImportance(race);
 const relationship=get1999JockeyPartnership(state,{
  trainerId:horse.trainer_id,ownerId:horse.owner_organization_id,jockeyId:j.id});
 const personal=j.skills,horseState=getGameHorsePerformance(state,world,horse.horse_id);
 const h=horse.starting_attributes,standing=j.game_reputation??.5;
 const suited=rating(personal.horse_handling*.38+personal.composure*.17+
  h.temperament*.18+horseState.race_performance_index*.27);
 // National stars pursue important, well-paid mounts; they can ride the
 // undercard at the same meeting without a second travel charge.
 const elite=j.tier==='ELITE',established=j.tier==='ESTABLISHED';
 const prestige=importance.nationalFeature?.095:importance.significance===2?.035:0;
 const required=(away?.37+standing*.13:.26+standing*.08)+
  (elite&&!importance.stakes?.055:0)-(elite||established?prestige:prestige*.35)-
  relationship.trainerBond*.075-relationship.ownerBond*.035;
 const favor=(frac(state.rng.seed,j.id+':'+race.id+':'+horse.horse_id+':mount')-.5)*.09;
 const accept=suited+favor>=required;
 return {accept,reason:accept?(away?'JOCKEY_ACCEPTS_PAID_TRAVEL':'JOCKEY_ACCEPTS_LOCAL_MOUNT'):
   'JOCKEY_DECLINES_UNSUITABLE_MOUNT',suited_index:suited,
   threshold:rating(required),away,lead_days:lead,
   jockey_reputation:standing,relationship,schedule,quote,
   race_importance:importance.significance};
}
/**
 * Resolve genuine rival proposals on the four-day major-meet booking date.
 * Offers are NOT a paid/signed mount until this step. For same-day
 * competing venues, weigh race grade/purse AND the strongest genuinely
 * fundable offer (horse merit, real partnership, negotiated premium), rather
 * than locking a national jockey to the highest purse before rival bids are
 * compared. Use ONLY pre-race known inputs.
 * The canonical booking action signs and debits the winning offer exactly
 * once; a jockey remains free to ride different races on the same card.
 */
export function resolve1999PremierJockeyOffers({state,world,emit}){
 const rt=root(state),offers=rt.premier_offers??{};
 const pending=Object.values(offers).filter(o=>o.status==='PENDING'&&
  (!state.runtime.races?.[o.race_id]||
   dayGap(state.clock.date,state.runtime.races[o.race_id].date)<=4));
 if(!pending.length)return {signed:0,declined:0,pending:Object.values(offers).filter(o=>o.status==='PENDING').length};
 const done=(offer,reason,winner=null,winnerRace=null)=>{
  offer.status='DECLINED';offer.resolved_date=state.clock.date;
  offer.reason=reason;
  if(winner)offer.winning_horse_id=winner;
  if(winnerRace)offer.winning_race_id=winnerRace;
  emit('JOCKEY_PREMIER_OFFER_DECLINED',{
   offer_id:offer.id,race_id:offer.race_id,
   horse_id:offer.horse_id,jockey_id:offer.jockey_id,
   reason,winning_horse_id:winner,winning_race_id:winnerRace,
   charged_minor:0});
 };
 // The same jockey/race is a single contract market. Different races on
 // that same card may still be ridden by that professional.
 const groups=new Map();
 for(const o of pending){
  const key=o.race_id+'|'+o.jockey_id;
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(o);
 }
 // The professional's venue preference is a fair comparison of the
 // strongest ACTUALLY AVAILABLE bid and the graded/purse importance of that
 // race. No offer is debited merely to rank it. Sorting is deterministic
 // across saves and independent of offer insertion order.
 const gradedImportance=r=>{
  const grade=String(r?.stakes_grade||'').toUpperCase();
  const gradeWeight=/^(G1|GRADE ?1)$/.test(grade)?.11:
   /^(G2|GRADE ?2)$/.test(grade)?.075:
   /^(G3|GRADE ?3)$/.test(grade)?.045:.02;
  const purse=Math.max(0,r?.purse_minor??0);
  return gradeWeight+Math.min(.14,Math.log1p(purse/10000000)*.055);
 };
 const availableCandidates=(group,race,jockey)=>{
  if(!race||race.status!=='ENTRIES_OPEN'||!premierMarketRace(race,jockey))
   return [];
  return group.map(o=>{
   const horse=state.runtime.registered_horses?.by_id?.[o.horse_id],
    entry=state.runtime.entries?.[o.race_id+':'+o.horse_id];
   if(!horse||!entry||entry.status!=='ENTERED')return null;
   if(!raceEligibility(state,horse,race).eligible)return null;
   const decision=jockeyBookingDecision(state,world,race,horse,jockey);
   if(!decision.accept)return null;
   const price=decision.quote.feeMinor+o.bonus_minor;
   if(!cents(price)||price>o.maximum_jockey_fee_minor||
    !cents(state.runtime.finances.operation_balances_minor?.[o.owner_id])||
    state.runtime.finances.operation_balances_minor[o.owner_id]<price)return null;
   const bond=get1999JockeyPartnership(state,{
    trainerId:horse.trainer_id,ownerId:horse.owner_organization_id,
    jockeyId:jockey.id});
   return {offer:o,score:scorePremierJockeyOffer({
    horse,jockey,race,partnership:bond,quote:decision.quote,
    bonus_minor:o.bonus_minor}).score};
  }).filter(Boolean).sort((a,b)=>b.score-a.score||
   b.offer.bonus_minor-a.offer.bonus_minor||
   a.offer.id.localeCompare(b.offer.id));
 };
 const sorted=[...groups.values()].map(group=>{
  const race=state.runtime.races?.[group[0].race_id],
   jockey=rt.jockeys?.[group[0].jockey_id],
   best=availableCandidates(group,race,jockey)[0];
  return {group,race,priority:best?
   best.score+gradedImportance(race):-Infinity};
 }).sort((a,b)=>b.priority-a.priority||
  (b.race?.purse_minor??0)-(a.race?.purse_minor??0)||
  a.group[0].race_id.localeCompare(b.group[0].race_id)||
  a.group[0].jockey_id.localeCompare(b.group[0].jockey_id));
 let signed=0,declined=0;
 for(const {group,race} of sorted){
  const jockey=rt.jockeys?.[group[0].jockey_id];
  if(!race||race.status!=='ENTRIES_OPEN'||!premierMarketRace(race,jockey)){
   for(const o of group){done(o,'RACE_OR_PREMIER_RIDER_NO_LONGER_AVAILABLE');declined++}
   continue;
  }
  // Re-evaluate after earlier awards: a rider can work several races at
  // one course that day, never switch venues after a signed commitment.
  const candidates=availableCandidates(group,race,jockey);
  let winner=null;
  for(const c of candidates){
   const offer=c.offer,horse=state.runtime.registered_horses.by_id[offer.horse_id];
   const entry=state.runtime.entries[offer.race_id+':'+offer.horse_id];
   // A competing professional can already have signed another race/date.
   // Recheck the actual authoritative schedule and owner funds right now.
   const decision=jockeyBookingDecision(state,world,race,horse,jockey);
   if(!decision.accept||entry.status!=='ENTERED'||
    decision.quote.feeMinor+offer.bonus_minor>offer.maximum_jockey_fee_minor||
    state.runtime.finances.operation_balances_minor[offer.owner_id]<
     decision.quote.feeMinor+offer.bonus_minor)continue;
   racingAction({state,world,command:{actor:'system',
    type:'BOOK_1999_JOCKEY',payload:{
     race_id:race.id,horse_id:horse.horse_id,jockey_id:jockey.id,
     market_offer_id:offer.id,market_bonus_minor:offer.bonus_minor}},emit});
   offer.status='SIGNED';offer.resolved_date=state.clock.date;
   offer.final_fee_minor=state.runtime.entries[entry.id].fee_minor;
   offer.score=c.score;winner=offer;
   emit('JOCKEY_PREMIER_OFFER_SIGNED',{
    offer_id:offer.id,race_id:race.id,jockey_id:jockey.id,
    horse_id:horse.horse_id,owner_id:offer.owner_id,
    trainer_id:offer.trainer_id,score:c.score,
    signing_bonus_minor:offer.bonus_minor,
    paid_minor:offer.final_fee_minor,
    competitors:group.length,source:'MODELED_REAL_SIGNED_PREMIER_MOUNT'});
   signed++;break;
  }
  const committedElsewhere=Object.values(state.runtime.entries||{}).
   find(e=>e.jockey_id===jockey.id&&['BOOKED','RESULTED'].includes(e.status)&&
    state.runtime.races?.[e.race_id]?.date===race.date&&
    state.runtime.races[e.race_id].track_id!==race.track_id);
  for(const o of group){
   if(o===winner)continue;
   done(o,winner?'RIVAL_HORSE_WON_PREMIER_RIDE':
    committedElsewhere?'JOCKEY_SIGNED_ANOTHER_RACECOURSE':
    'NO_ELIGIBLE_AFFORDABLE_ACCEPTED_RIDE',
    winner?.horse_id??committedElsewhere?.horse_id??null,
    winner?race.id:committedElsewhere?.race_id??null);
   declined++;
  }
 }
 return {signed,declined,pending:Object.values(offers).filter(o=>
  o.status==='PENDING').length};
}
/**
 * Keep large saved careers bounded. An accepted mount's permanent entry,
 * rider/owner ledger and race result ARE the contract record. Old declined
 * market bids need not stay in the live offer table for decades, since their
 * outcome is already recorded in the game event journal.
 */
export function compact1999PremierJockeyOffers({state,emit}){
 const offers=state.runtime.racing?.premier_offers;
 if(!offers)return {removed:0,retained:0};
 const completed=Object.values(offers).filter(o=>o.status!=='PENDING').
  sort((a,b)=>(b.resolved_date??b.offered_date).
    localeCompare(a.resolved_date??a.offered_date)||a.id.localeCompare(b.id));
 const keep=new Set(completed.filter((o,i)=>i<2000&&
  dayGap(o.resolved_date??o.offered_date,state.clock.date)<=120).map(o=>o.id));
 let removed=0;
 for(const o of completed)if(!keep.has(o.id)){delete offers[o.id];removed++}
 if(removed&&emit)emit('JOCKEY_PREMIER_OFFER_ARCHIVE_COMPACTED',{
  removed,retained:Object.keys(offers).length,retention_days:120,
  active_offers_preserved:true,
  signed_mount_ledger_retained:true,
  result:'DETAILED_SOURCE_EVENT_LOG_AND_SIGNED_ENTRIES_RETAINED'});
 return {removed,retained:Object.keys(offers).length};
}
export function modeledJockeySkills(id,seed,identity=null){
 ensure(/^P-[A-Za-z0-9-]+$/.test(id),'JOCKEY_ID','Permanent selected jockey ID required');
 const baseline={rating_source:'1999_MODELED_GAME_SCORING_NOT_CANONICAL',
  judgment:rating(.38+.56*frac(seed,id+':judgment')),
  pace:rating(.36+.58*frac(seed,id+':pace')),
  finish:rating(.34+.6*frac(seed,id+':finish')),
  composure:rating(.38+.54*frac(seed,id+':composure')),
  horse_handling:rating(.38+.54*frac(seed,id+':handling'))};
 // Real persisted rider ability and standing inform NEW careers. Existing
 // saved ratings remain untouched. Source identities are the authority.
 if(!Number.isFinite(identity?.ratings?.ability))return baseline;
 const ability=identity.ratings.ability/100;
 const bonus={ELITE:.13,ESTABLISHED:.065,REGIONAL:0,DEVELOPING:-.025}
  [identity.tier]??0;
 return Object.fromEntries(Object.entries(baseline).map(([key,value])=>
  [key,key==='rating_source'?
   'MODELED_FROM_PERSISTED_JOCKEY_1999_ABILITIES':
   rating(value*.65+ability*.35+bonus)]));
}
export function gameRaceProgram(state,world,trackId,date){
 const track=trackFor(world,trackId);
 if(!track||!validDate(date)||!date.startsWith('1999-'))return [];
 const ix=world.entities.tracks.findIndex(t=>t.id===trackId);
 return buildConditionBook1999({date,track,trackIndex:ix,seed:state.rng.seed,
  sourceStakes:[],includeKnownStakes:true});
}
/** Only races with fully modeled entry conditions may open for gameplay.
 * Claiming transfers, starter qualification, weights and stakes nominations
 * remain proposals, not quietly accepted as ordinary allowance races. */
export function supported1999RaceClass(race){
 const maiden=typeof race?.maiden==='boolean'?race.maiden:race?.maidenOnly;
 const maxWins=race?.max_wins??race?.maxCareerWins;
 if(race?.stakeId||race?.stake_id){
  const modeled=race?.canonical===false&&Boolean(race?.stakeSourceStatus||
   race?.stake_source_status);
  const purseMinor=race?.purse_minor??Math.round(Number(race?.purse)*100);
  return Boolean(modeled&&['2YO','3YO','3YO+','4YO+'].includes(race.age||
    race.ageRequirement)&&['OPEN','FILLIES_AND_MARES'].includes(race.sex||
    race.sexRestriction)&&['DIRT','TURF'].includes(race.surface)&&
    Number.isFinite(race.distance_furlongs??race.distanceFurlongs)&&
    cents(purseMinor)&&purseMinor>0);
 }
 if(race?.conditions==='Maiden Special Weight')
  return maiden===true&&maxWins==null;
 if(race?.conditions==='Allowance')
  return maiden===false&&[1,2].includes(maxWins);
 return false;
}
function raceShape(book){
 return {id:book.id,track_id:book.trackId,date:book.date,number:book.number,
  name:book.name,conditions:book.conditions,age:book.ageRequirement,
  sex:book.sexRestriction,surface:book.surface,distance_furlongs:book.distanceFurlongs,
  stake_id:book.stakeId||null,stake_name:book.stakeName||null,
  stake_source_status:book.stakeSourceStatus||null,
  stakes_grade:book.stakesGrade||null,canonical:book.canonical===true,
  max_wins:book.maxCareerWins,maiden:book.maidenOnly,
  win_restriction:book.winRestriction,full_conditions:book.fullConditions,
  field_capacity:book.fieldCapacity,purse_minor:Math.round(book.purse*100),
  source:'WTW_1999_TRACK_SPECIFIC_MEET_PROGRESSION',
  status:'ENTRIES_OPEN',field:[],results:null,escrow_minor:Math.round(book.purse*100)};
}
export function raceEligibility(state,horse,race){
 const reasons=[],care=state.runtime.horse?.[horse.horse_id],site=state.runtime.facilities?.sites?.[horse.current_residence_id];
 const age=1999-horse.foaling_year;
 if(race.age==='3YO'&&age!==3||race.age==='2YO'&&age!==2||
   race.age==='3YO+'&&age<3||race.age==='4YO+'&&age<4)
  reasons.push('AGE_RESTRICTION');
 if(race.sex==='FILLIES_AND_MARES'&&!['FILLY','MARE'].includes(horse.sex))
  reasons.push('SEX_RESTRICTION');
 if(!supported1999RaceClass(race))
  reasons.push('CLASS_CONDITIONS_NOT_YET_MODELED');
 if(race.conditions==='Maiden Special Weight'&&horse.career.wins>0)
  reasons.push('MAIDEN_RESTRICTION');
 if(race.conditions==='Allowance'&&horse.career.wins<1)
  reasons.push('ALLOWANCE_REQUIRES_MAIDEN_VICTORY');
 const maxWins=race.max_wins??race.maxCareerWins;
 if(Number.isInteger(maxWins)&&horse.career.wins>maxWins)
  reasons.push('CAREER_WIN_LIMIT');
 const trip=horseTravelStatus(state,horse.horse_id);
 const arrivalConfirmed=trip?.status==='OUTBOUND'&&trip.destination_track_id===race.track_id&&
  dayGap(trip.arrival_date,race.date)>=2;
 if(!site||effectiveHorseTrack(state,horse)!==race.track_id&&!arrivalConfirmed)
  reasons.push('NOT_PHYSICALLY_AT_TRACK_OR_CONFIRMED_TO_ARRIVE');
 if(trip?.status==='AT_DESTINATION'&&trip.destination_track_id===race.track_id&&
  dayGap(trip.arrival_date,race.date)<2)reasons.push('SHIPPING_ACCLIMATION_WINDOW');
 if(!care||care.training.sorenessDays>0||care.training.currentRisk>=.78||
  care.training.readiness<.43||care.history.at(-1)?.unfunded===true)
  reasons.push('CONDITION_NOT_CLEARED');
 if(dayGap(state.clock.date,race.date)<1)reasons.push('ENTRY_DEADLINE');
 if(dayGap(state.clock.date,race.date)>28)reasons.push('ENTRY_TOO_EARLY');
 const history=Object.values(state.runtime.races||{}).
  filter(r=>r.status==='OFFICIAL_SIM_RESULT'&&r.results?.some(row=>row.horse_id===horse.horse_id))
  .sort((a,b)=>b.date.localeCompare(a.date));
 if(history.length&&dayGap(history[0].date,race.date)<12)reasons.push('INSUFFICIENT_RECOVERY_SPACING');
 const planned=Object.values(state.runtime.entries||{}).filter(e=>
  e.horse_id===horse.horse_id&&e.race_id!==race.id&&
  ['ENTERED','BOOKED'].includes(e.status)).map(e=>state.runtime.races?.[e.race_id]).
  filter(r=>r?.status==='ENTRIES_OPEN');
 if(planned.some(r=>r.date===race.date))reasons.push('CONFLICTING_ENTRY');
 else if(planned.some(r=>Math.abs(dayGap(r.date,race.date))<12))
  reasons.push('CONFLICTING_CAMPAIGN_SPACING');
 return {eligible:reasons.length===0,reasons};
}
/**
 * Racing instructions belong to an actual booked runner; these estimates use
 * only known competitor horse attributes, the chosen jockey, the existing
 * training record, and the exact source condition-book race.
 *
 * AUTO preserves the pre-tactics simulation byte-for-byte, so loading an
 * older career cannot silently change its future results.
 */
function fieldPace(state,race,horseId){
 const rivals=race.field.map(id=>state.runtime.entries[id]).
  filter(e=>e&&e.horse_id!==horseId&&['ENTERED','BOOKED'].includes(e.status)).
  map(e=>({horse:state.runtime.registered_horses?.by_id?.[e.horse_id],entry:e})).
  filter(e=>Boolean(e.horse?.starting_attributes));
 const front=rivals.filter(({horse,entry})=>
  horse.starting_attributes.early_pace>=.67||
  ['LEAD','PRESS'].includes(entry.race_tactic)).length;
 const mean=rivals.length?rivals.reduce((n,{horse,entry})=>
  n+bound(horse.starting_attributes.early_pace+
   (entry.race_tactic==='LEAD'?.12:entry.race_tactic==='PRESS'?.065:0)),0)/rivals.length:.5;
 const pressure=rating(bound(.68*mean+.32*(rivals.length?front/rivals.length:.35)));
 return {pressure,front_runners:front,rival_count:rivals.length};
}
function tacticalFit(state,race,entry,tactic){
 const horse=state.runtime.registered_horses?.by_id?.[entry.horse_id],
  j=state.runtime.racing?.jockeys?.[entry.jockey_id]?.skills,
  training=state.runtime.horse?.[entry.horse_id]?.training,
  pace=fieldPace(state,race,entry.horse_id);
 if(!horse?.starting_attributes||!j||!training)
  return {...pace,tactic,adjustment:0,reason:'RIDER_OR_CONDITION_NOT_YET_AVAILABLE'};
 const a=horse.starting_attributes,f=bound(training.fitness),
  long=race.distance_furlongs>=8?1:.38;
 let effect=0,reason='AUTOMATIC_BASELINE_PRESERVED';
 if(tactic==='LEAD'){
  effect=.093*(a.early_pace-.5)+.045*(a.acceleration-.5)+
   .034*(j.pace-.5)+.072*(.5-pace.pressure)-
   .034*long*(1-a.stamina)-.021*(1-f);
  reason=pace.pressure>=.62?'EARLY_SPEED_CONTEST_AND_DISTANCE_COST':
   'EARLY_SPEED_AGAINST_KNOWN_FIELD';
 }else if(tactic==='PRESS'){
  effect=.070*(a.early_pace-.5)+.044*(a.stamina-.5)+
   .034*(j.pace-.5)+.035*(.5-pace.pressure)-
   .017*long*(1-f);
  reason='PRESS_THE_EARLY_PACE_WITH_STAMINA';
 }else if(tactic==='STALK'){
  effect=.057*(a.consistency-.5)+.048*(a.finishing_kick-.5)+
   .036*(j.judgment-.5)-.019*Math.abs(pace.pressure-.5);
  reason='TRACK_THE_PACE_AND_RESERVE_A_FINISH';
 }else if(tactic==='CLOSE'){
  effect=.096*(a.finishing_kick-.5)+.055*(a.stamina-.5)+
   .039*(j.finish-.5)+.078*(pace.pressure-.5)-
   .025*long*(1-f);
  reason=pace.pressure>=.62?'HOT_PACE_BENEFITS_LATE_RUN':
   'LATE_RUN_MUST_OVERCOME_EXPECTED_PACE';
 }
 return {...pace,tactic,adjustment:Math.round(Math.max(-.085,Math.min(.085,effect))*1000)/1000,reason};
}
/** Read-only race-day outlook, never the hidden deterministic finishing order. */
export function get1999RaceTacticsPreview(state,world,{race_id,horse_id}={}){
 const race=state.runtime.races?.[race_id],
  horse=state.runtime.registered_horses?.by_id?.[horse_id],
  entry=state.runtime.entries?.[race_id+':'+horse_id];
 ensure(race&&race.source==='WTW_1999_TRACK_SPECIFIC_MEET_PROGRESSION'&&
  race.status==='ENTRIES_OPEN'&&race.date>=state.clock.date&&
  horse&&state.player.role==='owner'&&
  state.player.operation_id===horse.owner_organization_id&&
  entry?.status==='BOOKED'&&entry.jockey_id&&
  entry.owner_id===horse.owner_organization_id&&entry.trainer_id===horse.trainer_id&&
  Boolean(state.runtime.racing?.jockeys?.[entry.jockey_id]),
  'RACE_TACTICS_PREVIEW','Choose an actually booked horse owned by the player before race settlement');
 const field=fieldPace(state,race,horse_id);
 return structuredClone({
  schema:RACE_TACTICS_PREVIEW_SCHEMA,as_of:state.clock.date,
  expected_revision:state.revision,horse_id,race_id,track_id:race.track_id,
  race_date:race.date,jockey_id:entry.jockey_id,
  current_tactic:entry.race_tactic??'AUTO',
  field_pressure_index:field.pressure,known_rivals:field.rival_count,
  known_front_runners:field.front_runners,
  options:RACE_TACTICS.map(t=>({tactic:t,...tacticalFit(state,race,entry,t)})),
  source:'LOCAL_GAME_HORSES_BOOKED_JOCKEY_AND_RACE_CARD_NOT_PREDICTED_RESULT',
  historical_result_claimed:false});
}
/** Owner-issued jockey instruction, immutable once the race is official. */
function setRaceTactics({state,world,command,emit}){
 const p=command.payload;
 ensure(command.actor==='player'&&state.player.role==='owner',
  'RACE_TACTICS_PERMISSION','Only the actual owner may direct a booked mount');
 ensure(isObject(p)&&typeof p.race_id==='string'&&
  typeof p.horse_id==='string'&&RACE_TACTICS.includes(p.tactic),
  'RACE_TACTICS_CHOICE','Choose an actual race, horse and supported tactical direction');
 ensure(Number.isSafeInteger(p.expected_revision)&&
  p.expected_revision===state.revision,
  'RACE_TACTICS_STALE','The game changed since the race outlook was read');
 const preview=get1999RaceTacticsPreview(state,world,p);
 const entry=state.runtime.entries[p.race_id+':'+p.horse_id];
 const before=entry.race_tactic??'AUTO';
 if(p.tactic==='AUTO')delete entry.race_tactic;
 else entry.race_tactic=p.tactic;
 const selected=preview.options.find(x=>x.tactic===p.tactic);
 emit('PLAYER_RACE_TACTICS_INSTRUCTED',{race_id:p.race_id,horse_id:p.horse_id,
  owner_id:entry.owner_id,trainer_id:entry.trainer_id,
  jockey_id:entry.jockey_id,previous_tactic:before,
  selected_tactic:p.tactic,pressure_index:selected.pressure,
  projected_adjustment:selected.adjustment,reason:selected.reason,
  factual_race_result_known:false,finance_changed:false});
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
   const identity=world.entities.people.find(p=>p.id===j.id);
   // Selected legacy 1999 elite identities have user-approved travel
   // standing but NO sourced performance rating. Their game tier must
   // follow that identity flag, never erase it with a REGIONAL fallback.
   const contractedTier=jockeyTierFromPerson(identity);
   const baseReputation=identity?.ratings?.ability?
    rating(.34+.28*identity.ratings.ability/100+
     (identity.tier==='ELITE'?.12:identity.tier==='ESTABLISHED'?.06:0)):.5;
   rt.jockeys[j.id]={id:j.id,home_track_id:j.home_track_id,
    tier:contractedTier,
    skills:modeledJockeySkills(j.id,state.rng.seed,identity),
    source:'SELECTED_1999_JOCKEY_IDENTITY_GAME_MODEL',starts:0,wins:0,
    game_reputation:baseReputation,last_track_id:j.home_track_id};
   rt.jockey_finances_minor[j.id]=0;
  }
  emit('JOCKEY_COLONY_ACTIVATED',{jockeys:unique.size,ratings:'MODELED_NOT_SOURCE_CERTIFIED'});
 }else if(type==='OPEN_1999_RACE'){
  ensure(command.actor==='system'&&trackFor(world,p.track_id)&&validDate(p.date)&&
   dayGap(state.clock.date,p.date)>=2&&dayGap(state.clock.date,p.date)<=28,
   'RACE_PROGRAM','Only legal future 1999 race cards may open');
  const book=gameRaceProgram(state,world,p.track_id,p.date).find(x=>x.id===p.race_id);
  ensure(book&&!state.runtime.races[p.race_id]&&(!book.stakeId||book.canonical===false),
   'RACE_PROGRAM','Race ID must match an ordinary or locally modeled noncanonical condition book');
  ensure(supported1999RaceClass(book),
   'RACE_CLASS_UNMODELED','Only modeled maiden special weight and NW2/NW3 allowance conditions may be entered');
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
 }else if(type==='OFFER_1999_PREMIER_JOCKEY'){
  const race=state.runtime.races?.[p.race_id],
   horse=state.runtime.registered_horses?.by_id?.[p.horse_id],
   entry=state.runtime.entries?.[p.race_id+':'+p.horse_id],
   jockey=rt.jockeys?.[p.jockey_id];
  ensure(race&&horse&&jockey&&entry&&entry.status==='ENTERED'&&
   race.status==='ENTRIES_OPEN'&&premierMarketRace(race,jockey),
   'PREMIER_OFFER_ELIGIBILITY','Only entered horses can offer for an elite major-stakes mount');
  ensure(command.actor==='system'||command.actor==='player'&&
   horse.owner_organization_id===state.player.operation_id,
   'PREMIER_OFFER_PERMISSION','Only the owning operation may propose a rider');
  ensure(dayGap(state.clock.date,race.date)>=5,
   'PREMIER_OFFER_DEADLINE','Premier offers must arrive before the four-day decision');
  ensure(cents(p.bonus_minor)&&p.bonus_minor<=250000,
   'PREMIER_OFFER_BONUS','Premier signing premium must be modeled integer cents');
  const decision=jockeyBookingDecision(state,world,race,horse,jockey);
  ensure(decision.accept,'PREMIER_OFFER_DECLINED',decision.reason);
  ensure(p.bonus_minor<=premierBonusCap(decision.quote),
   'PREMIER_OFFER_BONUS','Signing premium exceeds the modeled rider limit');
  const cost=decision.quote.feeMinor+p.bonus_minor,
   authorized=p.maximum_jockey_fee_minor??cost;
  ensure(cents(authorized)&&authorized>=cost&&authorized<=10000000,
   'PREMIER_OFFER_AUTHORIZATION','No premier mount may exceed owner-authorized rider compensation');
  ensure(cents(state.runtime.finances.operation_balances_minor?.[horse.owner_organization_id])&&
   state.runtime.finances.operation_balances_minor[horse.owner_organization_id]>=cost,
   'PREMIER_OFFER_CASH','Owner cannot cover quoted winning mount and signing premium');
  const offers=rt.premier_offers??(rt.premier_offers={});
  const id=premierOfferId(race.id,horse.horse_id,jockey.id),prior=offers[id];
  ensure(!prior||prior.status==='PENDING'&&p.bonus_minor>prior.bonus_minor,
   'PREMIER_OFFER_EXISTS','Only a larger pending offer may replace a proposal');
  ensure(Object.keys(offers).length<5000||prior,
   'PREMIER_OFFER_LIMIT','Too many unresolved race offers');
  offers[id]={id,race_id:race.id,horse_id:horse.horse_id,
   jockey_id:jockey.id,trainer_id:horse.trainer_id,
   owner_id:horse.owner_organization_id,
   bonus_minor:p.bonus_minor,quoted_base_minor:decision.quote.feeMinor,
   maximum_jockey_fee_minor:authorized,
   offered_date:state.clock.date,status:'PENDING'};
  emit(prior?'JOCKEY_PREMIER_OFFER_RAISED':'JOCKEY_PREMIER_OFFER_SUBMITTED',{
   offer_id:id,race_id:race.id,horse_id:horse.horse_id,
   jockey_id:jockey.id,owner_id:horse.owner_organization_id,
   trainer_id:horse.trainer_id,bonus_minor:p.bonus_minor,
   maximum_possible_payment_minor:authorized,owner_debited:false,
   decision_due_date:new Date(Date.parse(race.date+'T12:00:00Z')-
    4*86400000).toISOString().slice(0,10)});
 }else if(type==='BOOK_1999_JOCKEY'){
  const race=state.runtime.races[p.race_id],entry=state.runtime.entries[p.race_id+':'+p.horse_id],
   horse=state.runtime.registered_horses?.by_id?.[p.horse_id],j=rt.jockeys[p.jockey_id];
  ensure(race&&entry&&horse&&j&&entry.status==='ENTERED'&&!entry.jockey_id&&
   race.status==='ENTRIES_OPEN','JOCKEY_BOOKING','Selected jockey and unbooked entry required');
  ensure(command.actor==='system'||(command.actor==='player'&&
   state.player.operation_id===horse.owner_organization_id),
   'RACE_PERMISSION','Player cannot book another owner’s mount');
  if(premierMarketRace(race,j)){
   const id=premierOfferId(race.id,horse.horse_id,j.id);
   ensure(command.actor==='system'&&p.market_offer_id===id&&
    rt.premier_offers?.[id]?.status==='PENDING'&&
    p.market_bonus_minor===rt.premier_offers[id].bonus_minor&&
    dayGap(state.clock.date,race.date)<=4,
    'PREMIER_OFFER_REQUIRED','Elite major-stakes rides must win a competing offer before signing');
  }
  const schedule=assessJockeySchedule(state,world,j,race);
  ensure(schedule.allowed,'JOCKEY_SCHEDULE',schedule.reason);
  const decision=jockeyBookingDecision(state,world,race,horse,j);
  ensure(decision.accept,'JOCKEY_DECLINED',decision.reason);
  const quote=decision.quote,travel=schedule.away,
   bonus=Number.isSafeInteger(p.market_bonus_minor)?p.market_bonus_minor:0;
  ensure(bonus===0||premierMarketRace(race,j)&&
   p.market_offer_id===premierOfferId(race.id,horse.horse_id,j.id)&&
   rt.premier_offers?.[p.market_offer_id]?.bonus_minor===bonus,
   'PREMIER_OFFER_BONUS','Only signed market winners may pay a negotiated premium');
  const fee=quote.feeMinor+bonus;
  if(p.market_offer_id)ensure(fee<=rt.premier_offers[p.market_offer_id].maximum_jockey_fee_minor,
   'PREMIER_OFFER_AUTHORIZATION','Signed mount exceeds authorized maximum jockey cost');
  charge(state,horse.owner_organization_id,fee,'JOCKEY_MOUNT_AND_TRAVEL_FEE',race,horse,j.id);
  rt.jockey_finances_minor[j.id]+=fee;
  state.runtime.finances.ledger.push({date:state.clock.date,kind:'JOCKEY_FEE_RECEIVED',
   operation_id:null,person_id:j.id,amount_minor:fee,race_id:race.id,horse_id:horse.horse_id});
  entry.jockey_id=j.id;entry.status='BOOKED';entry.fee_minor=fee;entry.travel=travel;
  entry.mount_fee_minor=quote.mountMinor+bonus;entry.travel_fee_minor=quote.travelMinor;
  entry.premier_signing_bonus_minor=bonus;
  emit('JOCKEY_MOUNT_BOOKED',{race_id:race.id,horse_id:horse.horse_id,jockey_id:j.id,
   trainer_id:horse.trainer_id,booked_track_id:race.track_id,
   home_track_id:j.home_track_id,away_travel:travel,fee_minor:fee,
   mount_fee_minor:quote.mountMinor+bonus,travel_fee_minor:quote.travelMinor,
   premier_signing_bonus_minor:bonus,market_offer_id:p.market_offer_id??null,
   jockey_tier:j.tier,race_importance:decision.race_importance,
   trainer_partnership_mounts:decision.relationship.trainerMounts,
   owner_partnership_mounts:decision.relationship.ownerMounts,
   card_mount_number:schedule.sameCardCount+1,
   reason:decision.reason,acceptance:decision.suited_index,threshold:decision.threshold});
 }else if(type==='SET_1999_RACE_TACTICS'){
  setRaceTactics({state,world,command,emit});
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
 const instruction=entry.race_tactic??'AUTO';
 const tactical=tacticalFit(state,race,entry,instruction);
 const composite=now.race_performance_index*.49+surface*.14+distance*.14+
  pace*.09+rider*.10+j.composure*.04+variation+tactical.adjustment;
 return {entry,horse,composite:rating(composite),rider,
  tactical:instruction==='AUTO'?null:tactical};
}
const SHARES=[.6,.2,.11,.06,.03];
function settle1999Race({state,world,race_id,emit}){
 const race=state.runtime.races[race_id],rt=root(state);
 ensure(Boolean(race)&&race.status==='ENTRIES_OPEN'&&race.date===state.clock.date,
  'RACE_DATE','A race can only be settled on its scheduled game day');
 const entries=race.field.map(id=>state.runtime.entries[id]);
 ensure(entries.length>=2&&entries.length<=race.field_capacity&&entries.every(e=>
  e&&e.status==='BOOKED'&&rt.jockeys[e.jockey_id]&&
   effectiveHorseTrack(state,state.runtime.registered_horses.by_id[e.horse_id])===race.track_id),
  'RACE_FIELD','A valid field requires at least two fully booked runners');
 const horseSet=new Set(entries.map(e=>e.horse_id));
 ensure(horseSet.size===entries.length,'RACE_FIELD','Duplicate horse in race field');
 ensure(new Set(entries.map(e=>e.jockey_id)).size===entries.length,
  'RACE_FIELD','One jockey may not ride multiple starters in one race');
 const scored=entries.map(e=>performance(state,world,race,e)).
  sort((a,b)=>b.composite-a.composite||a.horse.horse_id.localeCompare(b.horse.horse_id));
 for(const row of scored)if(row.tactical)emit('RACE_TACTICAL_EXECUTION',{
  race_id:race.id,horse_id:row.horse.horse_id,jockey_id:row.entry.jockey_id,
  tactic:row.tactical.tactic,pressure_index:row.tactical.pressure,
  adjustment_index:row.tactical.adjustment,reason:row.tactical.reason,
  modeled:true});
 const paidPlaces=Math.min(scored.length,5),shares=SHARES.slice(0,paidPlaces);
 const weight=shares.reduce((a,b)=>a+b,0),awards=scored.map(()=>0);
 let remainder=race.purse_minor;
 for(let i=0;i<paidPlaces-1;i++){
  awards[i]=Math.floor(race.purse_minor*shares[i]/weight);remainder-=awards[i];
 }
 awards[paidPlaces-1]=remainder;
 const results=scored.map(({horse,entry,composite,rider,tactical},i)=>{
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
  const firstCareerWin=i===0&&horse.career.wins===0;
  horse.career.starts++;if(i===0)horse.career.wins++;
  if(firstCareerWin){
   emit('HORSE_MAIDEN_GRADUATED',{horse_id:horse.horse_id,race_id:race.id,
    owner_id:owner,trainer_id:horse.trainer_id,jockey_id:jockey,
    date:race.date,wins:horse.career.wins,
    next_step:'ALLOWANCE_NW2_OR_NW3_IF_ELIGIBLE',
    authority:'MODELED_1999_GAME_CAREER_NOT_HISTORICAL'});
  }
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
   performance_index:composite,rider_index:rider,
   ...(tactical?{race_tactic:tactical.tactic,
    field_pressure_index:tactical.pressure,
    tactical_adjustment_index:tactical.adjustment,
    tactical_reason:tactical.reason}:{})};
 });
 applyRaceAgentFeedback({state,world,race,results,emit});
 registerPostRaceCampaigns({state,world,race,results,emit});
 race.results=results;race.status='OFFICIAL_SIM_RESULT';race.settled_date=state.clock.date;
 race.escrow_minor=0;race.result_provenance='DETERMINISTIC_1999_GAME_SIMULATION';
 // Sponsor escrow is a modeled external event budget, not new owner or jockey
 // money; this one recorded credit offsets exactly the paid purse amounts.
 state.runtime.finances.ledger.push({date:state.clock.date,
  kind:'RACE_MODELED_SPONSOR_ESCROW_RELEASE',operation_id:null,
  amount_minor:-race.purse_minor,race_id:race.id,
  provenance:'MODELED_GAME_PURSE_NOT_HISTORICAL'});
 apply1999JockeyPostRaceConsequences({state,race,results,emit});
 emit('RACE_SETTLED',{race_id:race.id,track_id:race.track_id,
  date:race.date,starters:results.length,winner_horse_id:results[0].horse_id,
  purse_minor:race.purse_minor,modeled:true});
}
export function validateRacingRuntime(state,world){
 const rt=state.runtime.racing;
 validate1999HorseShipping(state,world);
 if(!rt)return;
 ensure(rt.schema===GAME_RACING_SCHEMA&&isObject(rt.jockeys)&&
  isObject(rt.jockey_finances_minor)&&isObject(rt.trainer_finances_minor)&&
  Number.isSafeInteger(rt.selection_count),
  'RACE_SAVE','Invalid race subsystem');
 for(const j of Object.values(rt.jockeys))
  ensure(person(world,j.id)&&Boolean(trackFor(world,j.home_track_id))&&
   cents(rt.jockey_finances_minor[j.id])&&cents(j.starts)&&cents(j.wins)&&j.wins<=j.starts,
   'RACE_SAVE','Unknown or invalid jockey agent');
 for(const j of Object.values(rt.jockeys))if(j.availability!==undefined){
  const a=j.availability;
  ensure(isObject(a)&&['INJURY','SUSPENSION'].includes(a.kind)&&
   validDate(a.start_date)&&validDate(a.through_date)&&
   a.through_date>=a.start_date&&validDate(a.reported_date)&&
   a.reported_date<=state.clock.date&&typeof a.source_race_id==='string',
   'JOCKEY_SAVE','Invalid dated jockey absence');
 }
 // Optional on older completed careers: do not mutate historical saves to
 // add an empty offer table. Validate the new contracts when present.
 if(rt.premier_offers!==undefined){
  ensure(isObject(rt.premier_offers)&&Object.keys(rt.premier_offers).length<=5000,
   'PREMIER_SAVE','Invalid premier-offer table');
  for(const [id,o] of Object.entries(rt.premier_offers)){
   const race=state.runtime.races?.[o?.race_id],
    horse=state.runtime.registered_horses?.by_id?.[o?.horse_id],
    jockey=rt.jockeys[o?.jockey_id];
   ensure(o?.id===id&&
    id===premierOfferId(o.race_id,o.horse_id,o.jockey_id)&&
    Boolean(race)&&Boolean(horse)&&Boolean(jockey)&&
    horse.owner_organization_id===o.owner_id&&
    horse.trainer_id===o.trainer_id&&premierMarketRace(race,jockey)&&
    ['PENDING','SIGNED','DECLINED','CANCELLED'].includes(o.status)&&
    validDate(o.offered_date)&&o.offered_date<=state.clock.date&&
    cents(o.bonus_minor)&&o.bonus_minor<=250000&&
    cents(o.quoted_base_minor)&&cents(o.maximum_jockey_fee_minor)&&
    o.maximum_jockey_fee_minor>=o.quoted_base_minor+o.bonus_minor,
    'PREMIER_SAVE','Invalid race, rider, or audited offer source');
   if(o.status==='SIGNED'){
    const entry=state.runtime.entries?.[o.race_id+':'+o.horse_id];
    ensure(entry?.jockey_id===o.jockey_id&&
     ['BOOKED','RESULTED','SCRATCHED'].includes(entry?.status)&&
     entry.premier_signing_bonus_minor===o.bonus_minor&&
     entry.fee_minor===o.final_fee_minor,
     'PREMIER_SAVE','Signed premier mount must match the paid permanent race entry');
   }
   if(o.status==='CANCELLED'){
    const entry=state.runtime.entries?.[o.race_id+':'+o.horse_id];
    ensure(['ENTERED','BOOKED','RESULTED','SCRATCHED'].includes(entry?.status)&&
     entry.cancelled_jockey_id===o.jockey_id&&
     validDate(o.cancelled_date)&&o.reason==='SIGNED_RIDER_BECAME_UNAVAILABLE'&&
     o.refunded_minor===o.final_fee_minor,
     'PREMIER_SAVE','Cancelled signed premier mount must retain full refund');
   }
   if(o.status==='DECLINED')ensure(typeof o.reason==='string'&&
    validDate(o.resolved_date),'PREMIER_SAVE','Declined offer must retain resolution');
  }
 }
 for(const [trainerId,earnedMinor] of Object.entries(rt.trainer_finances_minor))
  ensure(person(world,trainerId)&&cents(earnedMinor),
   'RACE_SAVE','Trainer earned fees and purses must resolve to an approved person and integer cents');
 for(const [id,r] of Object.entries(state.runtime.races||{})){
  if(!r.source||r.source!=='WTW_1999_TRACK_SPECIFIC_MEET_PROGRESSION')continue;
  ensure(r.id===id&&trackFor(world,r.track_id)&&validDate(r.date)&&
   supported1999RaceClass(r)&&
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
   if(e.race_tactic!==undefined)
    ensure(e.status==='BOOKED'||e.status==='RESULTED','RACE_TACTICS_SAVE',
     'Only a booked/resulted mount may retain a tactic');
   ensure(e.race_tactic===undefined||RACE_TACTICS.includes(e.race_tactic)&&e.race_tactic!=='AUTO',
    'RACE_TACTICS_SAVE','Unknown or unsupported saved jockey instruction');
  }
  if(r.status==='OFFICIAL_SIM_RESULT'){
   ensure(Array.isArray(r.results)&&r.results.length===r.field.length&&
    r.results.reduce((x,y)=>x+y.earnings_minor,0)===r.purse_minor&&
    new Set(r.results.map(x=>x.finish)).size===r.field.length,
    'RACE_SAVE','Settlement must reconcile purse and full finishing order');
   const resultHorseIds=new Set();
   for(let i=0;i<r.results.length;i++){
    const result=r.results[i],entryId=`${id}:${result?.horse_id}`,
     entry=state.runtime.entries?.[entryId];
    ensure(typeof result?.horse_id==='string'&&
     !resultHorseIds.has(result.horse_id)&&r.field.includes(entryId)&&
     entry?.status==='RESULTED'&&entry.finish===i+1&&result.finish===i+1,
     'RACE_SAVE','Official results must match each starter once in finish order');
    resultHorseIds.add(result.horse_id);
   }
   for(const result of r.results){
    if(result.race_tactic===undefined)continue; // Old saves and AUTO are unchanged.
    const e=state.runtime.entries[r.id+':'+result.horse_id];
    ensure(RACE_TACTICS.includes(result.race_tactic)&&
     result.race_tactic!=='AUTO'&&e?.race_tactic===result.race_tactic&&
     Number.isFinite(result.field_pressure_index)&&
     result.field_pressure_index>=0&&result.field_pressure_index<=1&&
     Number.isFinite(result.tactical_adjustment_index)&&
     Math.abs(result.tactical_adjustment_index)<=.085&&
     typeof result.tactical_reason==='string',
     'RACE_TACTICS_SAVE','Race tactics result must be linked to booked owner instruction');
   }
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
