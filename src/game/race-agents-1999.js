/**
 * Daily trainer/jockey/race-secretary agents. Game program is sourced from
 * approved 1999 modeled meet/calendar; no ghost results or artificial jockeys.
 */
import {gameRaceProgram,raceEligibility,racingAction,jockeyBookingDecision,
 resolve1999PremierJockeyOffers,compact1999PremierJockeyOffers,
 supported1999RaceClass} from './racing-1999.js';
import {postRaceAIPlacement} from './post-race-campaign-1999.js';
import {shippingAssessment,shippingAction,horseTravelStatus,effectiveHorseTrack} from './shipping-1999.js';
import {get1999JockeyPartnership} from '../../public/1999/engine/jockey-partnerships-1999.mjs';
import {premierMarketRace,premierBonusCap} from '../../public/1999/engine/jockey-premier-market-1999.mjs';
import {quote1999JockeyRetainer,jockeyRetainerAction}
 from '../../public/1999/engine/jockey-retainers-1999.mjs';
const diff=(a,b)=>(Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000;
const plus=(date,n)=>new Date(Date.parse(date+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
const horses=state=>Object.values(state.runtime.registered_horses?.by_id||{}).
 filter(h=>Boolean(h.starting_attributes)&&h.host_track_id).
 sort((a,b)=>a.horse_id.localeCompare(b.horse_id));
const stable=(state,trackId)=>horses(state).filter(h=>h.host_track_id===trackId);
const money=(state,owner)=>state.runtime.finances.operation_balances_minor[owner]??0;
// Booking decisions read the complete dated itinerary, not one horse per day.
// Stable trainer-rider familiarity helps contract a mount, but never overrides
// a jockey's actual schedule, finances, race fitness or acceptance.
const jockeyChoiceScore=(state,h,j,decision,race)=>{
 const reputation=j.game_reputation??.5;
 const prestige=race.stake_id||race.purse_minor>=10000000?1:0;
 const bond=get1999JockeyPartnership(state,{
  trainerId:h.trainer_id,ownerId:h.owner_organization_id,jockeyId:j.id});
 return decision.suited_index*.5+j.skills.judgment*.18+
  reputation*.13+bond.trainerBond*.1+bond.ownerBond*.045+
  (j.tier==='ELITE'?prestige*.11:0)+
  (j.home_track_id===race.track_id?.05:0)-
  decision.quote.feeMinor/Math.max(750000,race.purse_minor)*.06;
};
/** Each trainer compares an actual open future race with the horse's ability,
 * surface, distance, welfare, home location, available jockey and owner's cash.
 * No AI enters or ships a player-owned horse.
 */
function raceFit(h,race){
 const a=h.starting_attributes;
 const surface=race.surface==='TURF'?a.turf_aptitude:a.dirt_aptitude;
 const distance=race.distance_furlongs<8?a.sprint_aptitude:a.route_aptitude;
 return .47*surface+.39*distance+.14*(a.current_ability/99);
}
function hasFutureEntry(state,h){
 return Object.values(state.runtime.entries||{}).some(e=>e.horse_id===h.horse_id&&
  ['ENTERED','BOOKED'].includes(e.status)&&
  state.runtime.races[e.race_id]?.date>=state.clock.date);
}
function autonomousAwayTravel({state,world,emit}){
 const day=state.clock.date,rt=state.runtime.racing;
 // Let the opening maiden campaigns establish honest form before trainers
 // consider shipping. Later choices are weekly, keyed to the one game clock.
 if(state.clock.days_elapsed<22||state.clock.days_elapsed%7!==1)return;
 let shipped=0,evaluated=0,declined=0;
 const cards=Object.values(state.runtime.races||{}).
  filter(r=>r.status==='ENTRIES_OPEN'&&r.field.length>=2&&
   r.field.length<r.field_capacity&&supported1999RaceClass(r)&&
   r.age==='3YO+'&&r.sex==='OPEN'&&diff(day,r.date)>=6).
  sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
 for(const h of horses(state).filter(h=>h.owner_organization_id!==state.player.operation_id)){
  if(shipped>=2)break;
  if(!h.host_track_id||horseTravelStatus(state,h.horse_id)?.status!=='HOME'&&
   horseTravelStatus(state,h.horse_id)||hasFutureEntry(state,h))continue;
  const care=state.runtime.horse[h.horse_id];
  if(!care||care.training.readiness<.56||care.training.currentRisk>=.64||
   care.training.sorenessDays>0)continue;
  evaluated++;
  const options=[];
  for(const race of cards){
   if(race.track_id===h.host_track_id)continue;
   const check=raceEligibility(state,h,race);
   if(check.reasons.some(x=>x!=='NOT_PHYSICALLY_AT_TRACK_OR_CONFIRMED_TO_ARRIVE'))continue;
   const sites=Object.values(state.runtime.facilities.sites).
    filter(site=>site.host_track_id===race.track_id&&site.type==='RACING_STABLE').
    sort((x,y)=>x.id.localeCompare(y.id));
   for(const site of sites){
    const quote=shippingAssessment(state,world,h.horse_id,site.id,{targetRaceId:race.id});
    if(!quote.allowed)continue;
    const match=raceFit(h,race),available=money(state,h.owner_organization_id);
    const jockey=Object.values(rt.jockeys).
     filter(j=>j.home_track_id===race.track_id&&
      jockeyBookingDecision(state,world,race,h,j).accept).
     sort((a,b)=>jockeyChoiceScore(state,h,b,jockeyBookingDecision(state,world,race,h,b),race)-
      jockeyChoiceScore(state,h,a,jockeyBookingDecision(state,world,race,h,a),race)||
      a.id.localeCompare(b.id))[0];
    if(!jockey)continue;
    const expectedOwnerPurse=Math.round(race.purse_minor*.23*match*.8),
     haulRoundTrip=2*quote.route.cost_minor,
     bookFee=jockeyBookingDecision(state,world,race,h,jockey).quote.feeMinor,
     boardingReserve=Math.ceil(care.policy.monthly_budget_minor/30*14);
    const score=expectedOwnerPurse-haulRoundTrip-bookFee;
    if(score<=0||available<haulRoundTrip+boardingReserve+bookFee)continue;
    options.push({race,site,quote,jockey,match,score,expectedOwnerPurse,
     haulRoundTrip,bookFee});
   }
  }
  options.sort((a,b)=>b.score-a.score||a.race.date.localeCompare(b.race.date)||
   a.site.id.localeCompare(b.site.id));
  const choice=options[0];
  if(!choice){declined++;continue}
  shippingAction({state,world,command:{actor:'system',type:'SHIP_1999_HORSE',
   payload:{horse_id:h.horse_id,destination_site_id:choice.site.id,
    target_race_id:choice.race.id}},emit});
  racingAction({state,world,command:{actor:'system',type:'ENTER_1999_RACE',
   payload:{race_id:choice.race.id,horse_id:h.horse_id}},emit});
  racingAction({state,world,command:{actor:'system',type:'BOOK_1999_JOCKEY',
   payload:{race_id:choice.race.id,horse_id:h.horse_id,jockey_id:choice.jockey.id}},emit});
  shipped++;
  emit('AI_TRAINER_AWAY_CAMPAIGN',{date:day,horse_id:h.horse_id,
   trainer_id:h.trainer_id,owner_id:h.owner_organization_id,
   target_race_id:choice.race.id,destination_site_id:choice.site.id,
   jockey_id:choice.jockey.id,fit:Math.round(choice.match*1000)/1000,
   expected_owner_purse_minor:choice.expectedOwnerPurse,
   return_haul_budget_minor:choice.haulRoundTrip,
   net_opportunity_minor:choice.score,
   reason:'FUNDED_SURFACE_DISTANCE_AND_CLASS_OPPORTUNITY'});
 }
 emit('AI_TRAINER_SHIPPING_REVIEW',{date:day,candidates_evaluated:evaluated,
  shipped,declined,reason:'EXPECTED_VALUE_WELFARE_STALLS_AND_RACE_CONDITIONS'});
}
function autonomousReturnTravel({state,world,emit}){
 const trips=state.runtime.racing?.horse_travel||{},day=state.clock.date;
 for(const id of Object.keys(trips).sort()){
  const t=trips[id],h=state.runtime.registered_horses.by_id[id];
  if(t.status!=='AT_DESTINATION'||!h||h.owner_organization_id===state.player.operation_id||
   hasFutureEntry(state,h))continue;
  // Leave recovery time at the host before booking a homeward carrier.
  const last=Object.values(state.runtime.races).filter(r=>r.results?.some(x=>x.horse_id===id)).
   sort((a,b)=>b.date.localeCompare(a.date))[0];
  if(!last||diff(last.date,day)<3)continue;
  const care=state.runtime.horse[id];
  if(!care||care.training.sorenessDays>0||care.training.currentRisk>.7)continue;
  const from=state.runtime.facilities.sites[t.destination_site_id],
   home=state.runtime.facilities.sites[t.home_site_id];
  const available=money(state,h.owner_organization_id);
  if(available<t.outbound_cost_minor+Math.ceil(care.policy.monthly_budget_minor/30*7))continue;
  shippingAction({state,world,command:{actor:'system',type:'RETURN_1999_HORSE',
   payload:{horse_id:id}},emit});
  emit('AI_TRAINER_RETURN_CAMPAIGN',{horse_id:id,trainer_id:h.trainer_id,
   from_site_id:from.id,home_site_id:home.id,
   reason:'POSTRACE_RECOVERY_COMPLETE_NO_FUTURE_BOOKING'});
 }
}
/**
 * A declined premier offer does not itself secure a replacement rider.
 * After the market closes, AI trainers may sign a genuine, affordable
 * non-elite jockey for the same eligible horse. Never auto-book the
 * player's horse, invent paid mounts or override already signed rides.
 */
export function book1999LostPremierFallbacks({state,world,emit}){
 const rt=state.runtime.racing,all=Object.values(rt?.premier_offers||{});
 const lost=new Map();
 for(const o of all){
  if(o.status!=='DECLINED'||o.resolved_date!==state.clock.date)continue;
  const key=o.race_id+':'+o.horse_id;
  if(!lost.has(key))lost.set(key,o);
 }
 let booked=0,unavailable=0,playerDecisions=0;
 for(const key of [...lost.keys()].sort()){
  const lostOffer=lost.get(key),raceId=lostOffer.race_id,
   horseId=lostOffer.horse_id;
  const entry=state.runtime.entries?.[key],
   race=state.runtime.races?.[raceId],
   horse=state.runtime.registered_horses?.by_id?.[horseId];
  if(!race||race.status!=='ENTRIES_OPEN'||!horse||!entry||
   entry.status!=='ENTERED'||entry.jockey_id)continue;
  const competing=all.filter(o=>o.race_id===raceId&&o.horse_id===horseId);
  if(competing.some(o=>['PENDING','SIGNED'].includes(o.status)))continue;
  if(horse.owner_organization_id===state.player.operation_id){
   playerDecisions++;
   emit('PLAYER_PREMIER_FALLBACK_AVAILABLE',{race_id:raceId,
    horse_id:horseId,
    decision:'OWNER_SELECTS_REAL_ALTERNATIVE_NO_AUTOMATIC_PAYMENT'});
   continue;
  }
  if(!raceEligibility(state,horse,race).eligible)continue;
  const affordable=Object.values(rt.jockeys).filter(j=>
   !premierMarketRace(race,j)).map(j=>({
    jockey:j,decision:jockeyBookingDecision(state,world,race,horse,j)
   })).filter(row=>row.decision.accept&&
    money(state,horse.owner_organization_id)>=row.decision.quote.feeMinor).
   sort((a,b)=>jockeyChoiceScore(state,horse,b.jockey,b.decision,race)-
    jockeyChoiceScore(state,horse,a.jockey,a.decision,race)||
    a.jockey.id.localeCompare(b.jockey.id));
  if(!affordable.length){
   unavailable++;
   emit('AI_PREMIER_FALLBACK_UNAVAILABLE',{race_id:raceId,
    horse_id:horseId,owner_id:horse.owner_organization_id,
    trainer_id:horse.trainer_id,
    reason:'NO_AVAILABLE_ACCEPTING_FUNDED_ALTERNATIVE'});
   continue;
  }
  const selected=affordable[0];
  racingAction({state,world,command:{actor:'system',
   type:'BOOK_1999_JOCKEY',payload:{race_id:raceId,horse_id:horseId,
    jockey_id:selected.jockey.id}},emit});
  booked++;
  emit('AI_PREMIER_FALLBACK_BOOKED',{race_id:raceId,horse_id:horseId,
   trainer_id:horse.trainer_id,owner_id:horse.owner_organization_id,
   jockey_id:selected.jockey.id,fee_minor:entry.fee_minor,
   source:'REAL_DECLINED_PREMIER_BIDS'});
 }
 return {booked,unavailable,playerDecisions};
}
/**
 * Rider health/stewards findings really void future paid mounts. Repair AI
 * bookings in the existing race entry rather than leaving an unusable ghost
 * jockey until the horse is scratched on race day. Player owners retain full
 * authority: notify without signing an unwanted replacement contract.
 */
export function book1999UnavailableJockeyReplacements({state,world,emit}){
 const rt=state.runtime.racing,day=state.clock.date;
 if(!rt)return {booked:0,player_decisions:0,unavailable:0};
 let booked=0,player_decisions=0,unavailable=0;
 const refunded=Object.values(state.runtime.entries||{}).
  filter(e=>e.status==='ENTERED'&&!e.jockey_id&&e.cancelled_jockey_id&&
   e.cancellation_reason?.startsWith('JOCKEY_')).
  sort((a,b)=>a.race_id.localeCompare(b.race_id)||
   a.horse_id.localeCompare(b.horse_id));
 for(const entry of refunded){
  const race=state.runtime.races?.[entry.race_id];
  const horse=state.runtime.registered_horses?.by_id?.[entry.horse_id];
  if(!race||race.status!=='ENTRIES_OPEN'||!horse||
   diff(day,race.date)<1)continue;
  if(horse.owner_organization_id===state.player.operation_id){
   player_decisions++;
   if(!entry.replacement_notice_date){
    entry.replacement_notice_date=day;
    emit('PLAYER_JOCKEY_REPLACEMENT_REQUIRED',{
     race_id:race.id,horse_id:horse.horse_id,
     cancelled_jockey_id:entry.cancelled_jockey_id,
     decision:'SELECT_AVAILABLE_REAL_REPLACEMENT_RIDER'});
   }
   continue;
  }
  // No paid second rider without a real quote, acceptance, eligibility
  // and funds; premier elite stars must still use their genuine auction.
  const candidates=Object.values(rt.jockeys).filter(j=>
   j.id!==entry.cancelled_jockey_id&&
   !premierMarketRace(race,j)).map(j=>({
    jockey:j,decision:jockeyBookingDecision(state,world,race,horse,j)
   })).filter(x=>x.decision.accept&&
    money(state,horse.owner_organization_id)>=x.decision.quote.feeMinor).
   sort((a,b)=>jockeyChoiceScore(state,horse,b.jockey,b.decision,race)-
    jockeyChoiceScore(state,horse,a.jockey,a.decision,race)||
    a.jockey.id.localeCompare(b.jockey.id));
  if(!candidates.length){
   unavailable++;
   if(entry.replacement_review_date!==day){
    entry.replacement_review_date=day;
    emit('AI_JOCKEY_REPLACEMENT_UNAVAILABLE',{
     race_id:race.id,horse_id:horse.horse_id,
     owner_id:horse.owner_organization_id,
     cancelled_jockey_id:entry.cancelled_jockey_id,
     reason:'NO_FUNDED_AVAILABLE_ACCEPTING_RIDER'});
   }
   continue;
  }
  const chosen=candidates[0];
  racingAction({state,world,command:{actor:'system',
   type:'BOOK_1999_JOCKEY',payload:{
    race_id:race.id,horse_id:horse.horse_id,
    jockey_id:chosen.jockey.id}},emit});
  booked++;
  emit('AI_JOCKEY_REPLACEMENT_BOOKED',{
   race_id:race.id,horse_id:horse.horse_id,
   owner_id:horse.owner_organization_id,
   cancelled_jockey_id:entry.cancelled_jockey_id,
   new_jockey_id:chosen.jockey.id,
   replacement_fee_minor:entry.fee_minor,
   source:'PAID_ORIGINAL_RIDER_UNAVAILABLE'});
 }
 return {booked,player_decisions,unavailable};
}
/**
 * Real AI owners may pursue paid rider continuity, never player funds.
 * The auction itself remains the one retainer module: this merely submits
 * genuine financed proposals from active horses/owners in the saved career.
 */
export function propose1999AIRiderRetainers({state,world,emit}){
 const day=state.clock.date,rt=state.runtime.racing;
 if(!rt||!day.startsWith('1999-'))return {offered:0,evaluated:0};
 const start=plus(day,5),end=plus(day,18);
 const selected=new Map();
 for(const h of horses(state)){
  if(h.owner_organization_id===state.player.operation_id||
   !h.trainer_id||!h.host_track_id)continue;
  if(!selected.has(h.owner_organization_id))
   selected.set(h.owner_organization_id,h);
 }
 let offered=0,evaluated=0;
 for(const [owner,h] of [...selected].sort((a,b)=>a[0].localeCompare(b[0]))){
  if(offered>=4)break;
  evaluated++;
  const riders=Object.values(rt.jockeys).filter(j=>
   j.career_status!=='RETIRED'&&j.home_track_id===h.host_track_id&&
   !(j.availability&&j.availability.start_date<=end&&
    j.availability.through_date>=start)).
   sort((a,b)=>(b.skills?.judgment??0)-(a.skills?.judgment??0)||
    (b.game_reputation??0)-(a.game_reputation??0)||
    a.id.localeCompare(b.id));
  const jockey=riders[0];
  if(!jockey)continue;
  const quote=quote1999JockeyRetainer(state,{
   jockeyId:jockey.id,startDate:start,endDate:end});
  const fee=Math.round(quote.minimum_fee_minor*
   (1.08+Math.min(.16,(h.career?.starts??0)*.012)));
  const account=money(state,owner);
  // Conservative AI retainers are a strategic expense, not a payroll tax
  // on every owner. Keep ample care and race-entry cash available.
  if(account<fee*20)continue;
  const already=Object.values(rt.retainers?.offers||{}).some(o=>
   o.owner_id===owner&&o.jockey_id===jockey.id&&
   o.start_date===start);
  const reserved=Object.values(rt.retainers?.contracts||{}).some(c=>
   c.jockey_id===jockey.id&&c.status==='ACTIVE'&&
   c.start_date<=end&&c.end_date>=start);
  if(already||reserved)continue;
  jockeyRetainerAction({state,world,command:{actor:'system',
   type:'OFFER_1999_JOCKEY_RETAINER',payload:{
    owner_id:owner,trainer_id:h.trainer_id,jockey_id:jockey.id,
    start_date:start,end_date:end,total_fee_minor:fee}},emit});
  offered++;
  emit('AI_OWNER_JOCKEY_RETAINER_PROPOSED',{
   owner_id:owner,trainer_id:h.trainer_id,jockey_id:jockey.id,
   start_date:start,end_date:end,total_fee_minor:fee,
   actual_owner_balance_minor:account,
   reason:'MODELED_FUNDED_LOCAL_JOCKEY_CONTINUITY_NOT_ASSUMED_HIRING'});
 }
 emit('AI_JOCKEY_RETAINER_MARKET_REVIEW',{date:day,
  evaluated_owners:evaluated,submitted:offered,
  player_funds_reserved:false,contracts_signed_immediately:false});
 return {offered,evaluated};
}
export function run1999RacingAgents({state,world,emit}){
 const rt=state.runtime.racing;
 if(!rt||Object.keys(rt.jockeys).length<2)return;
 const day=state.clock.date;
 // Funded AI owner proposals use the same real competitive rider market.
 if(state.clock.days_elapsed%28===7)
  propose1999AIRiderRetainers({state,world,emit});
 // Prune only resolved old bids before any new submissions this week.
 // Pending offers, signed entries and credited earnings remain untouched.
 compact1999PremierJockeyOffers({state,emit});
 // Secretary and trainers plan a week's targets on the opening/weekly review,
 // without silently entering player-controlled runners.
 if(state.clock.days_elapsed%7===1&&rt.last_selection_date!==day){
  const tracks=[...new Set(horses(state).map(h=>h.host_track_id))].sort();
  for(const trackId of tracks){
   const local=stable(state,trackId).filter(h=>
    h.owner_organization_id!==state.player.operation_id);
   if(local.length<2)continue;
   // One open race per modeled class per circuit. Allowance fields should
   // never replace maiden races, and maiden winners cannot enter both.
   for(const racingClass of ['Maiden Special Weight','Allowance','FEATURE']){
    if(Object.values(state.runtime.races).some(r=>r.track_id===trackId&&
     r.status==='ENTRIES_OPEN'&&r.date>=day&&
     (racingClass==='FEATURE'?Boolean(r.stake_id):r.conditions===racingClass)))
     continue;
    const eligibleAtHome=local.filter(h=>
     racingClass==='FEATURE'?h.career.starts>=1:
     racingClass==='Allowance'?h.career.wins>=1:h.career.wins===0);
    if(eligibleAtHome.length<2){
     if(racingClass==='Allowance'&&eligibleAtHome.length){
      emit('TRAINER_ALLOWANCE_CAMPAIGN_REVIEW',{date:day,track_id:trackId,
       qualified_horses:eligibleAtHome.length,
       decision:'AWAIT_SECOND_ELIGIBLE_RUNNER',
       source:'MODELED_GAME_TRAINER_RACE_PLACEMENT'});
     }
     continue;
    }
    const plans=[];
    for(let offset=5;offset<=12;offset++){
     const raceDay=plus(day,offset);
     for(const race of gameRaceProgram(state,world,trackId,raceDay)){
      const gameModeledFeature=racingClass==='FEATURE'&&
       Boolean(race.stakeId)&&race.canonical===false;
      if(!(gameModeledFeature||!race.stakeId&&
        racingClass!=='FEATURE'&&race.conditions===racingClass)||
       race.sexRestriction!=='OPEN'||race.ageRequirement!=='3YO+'||
       !supported1999RaceClass(race))continue;
      const record={id:race.id,track_id:race.trackId,date:race.date,
       age:race.ageRequirement,sex:race.sexRestriction,
       conditions:race.conditions,maiden:race.maidenOnly,max_wins:race.maxCareerWins,
       stake_id:race.stakeId||null,
       stake_source_status:race.stakeSourceStatus||null,
       stakes_grade:race.stakesGrade||null,canonical:race.canonical,
       purse_minor:Math.round(race.purse*100),
       surface:race.surface,distance_furlongs:race.distanceFurlongs,
       field_capacity:race.fieldCapacity};
      const eligible=eligibleAtHome.filter(h=>
       !hasFutureEntry(state,h)&&raceEligibility(state,h,record).eligible&&
       postRaceAIPlacement(state,h,record).eligible);
      if(eligible.length<2)continue;
      const averageFit=eligible.reduce((n,h)=>
       n+raceFit(h,record)+postRaceAIPlacement(state,h,record).bonus,0)/eligible.length;
      const condition=eligible.reduce((n,h)=>
       n+state.runtime.horse[h.horse_id].training.readiness,0)/eligible.length;
      // Entries and talent matter, but do not override medical eligibility,
      // known class rules, or the horse's required race spacing.
      const score=eligible.length*100+averageFit*26+condition*14-
       offset*2-Math.abs(race.distanceFurlongs-8)*3+
       (gameModeledFeature?Math.round(Math.min(80,race.purse/5000)):0);
      plans.push({race,eligible,score,averageFit});
     }
    }
    plans.sort((a,b)=>b.score-a.score||a.race.id.localeCompare(b.race.id));
    const chosen=plans[0];
    if(!chosen){
     if(racingClass==='Allowance')emit('TRAINER_ALLOWANCE_CAMPAIGN_REVIEW',{
      date:day,track_id:trackId,qualified_horses:eligibleAtHome.length,
      decision:'NO_SUITABLE_DATE_FIT_OR_RECOVERY',
      source:'MODELED_GAME_TRAINER_RACE_PLACEMENT'});
     continue;
    }
    const r=chosen.race;
    racingAction({state,world,command:{actor:'system',type:'OPEN_1999_RACE',
     payload:{track_id:trackId,date:r.date,race_id:r.id}},emit});
    const confirmed=state.runtime.races[r.id];
    // AI trainers may not consume every starter and rider slot before a
    // player-owned eligible home runner can be booked. A real available
    // jockey is still required: we reserve opportunity, not invent mounts.
    // Player-owned horses can target legitimate AWAY opportunities too.
    // Protecting only local horses would let AI consume the host track's
    // entire rider colony even when the player can fund/complete shipping.
    const receivingSites=Object.values(state.runtime.facilities?.sites||{}).
     filter(site=>site.type==='RACING_STABLE'&&site.host_track_id===trackId);
    const playerCandidates=horses(state).filter(h=>{
     if(h.owner_organization_id!==state.player.operation_id||
      hasFutureEntry(state,h))return false;
     const eligibility=raceEligibility(state,h,confirmed);
     if(eligibility.eligible)return true;
     if(eligibility.reasons.length!==1||
      eligibility.reasons[0]!=='NOT_PHYSICALLY_AT_TRACK_OR_CONFIRMED_TO_ARRIVE')
      return false;
     return receivingSites.some(site=>{
      const shipping=shippingAssessment(state,world,h.horse_id,site.id,
       {targetRaceId:confirmed.id});
      return shipping.allowed;
     });
    });
    const playerReserve=playerCandidates.length?
     Math.min(playerCandidates.length,2,Math.max(0,confirmed.field_capacity-2)):0;
    const maxAiBookings=Math.max(2,confirmed.field_capacity-playerReserve);
    // Preserve a REAL accepting, funded jockey for each potential player
    // mount, not just an empty field slot. AI cannot take every rider before
    // the owner can exercise their own booking choice.
    const playerJockeyOptions=new Set();
    // On a major feature, player and rival owners compete for the best
    // riders through the SAME open, unpaid offer market. Do not secretly
    // assign the best elite jockey to the player before offers are judged.
    for(const playerHorse of (racingClass==='FEATURE'?[]:
      playerCandidates.slice(0,playerReserve))){
     const candidates=Object.values(rt.jockeys).filter(j=>{
      if(playerJockeyOptions.has(j.id))return false;
      const decision=jockeyBookingDecision(state,world,confirmed,playerHorse,j);
      return decision.accept&&money(state,playerHorse.owner_organization_id)>=
       decision.quote.feeMinor;
     }).sort((a,b)=>
      (a.home_track_id===trackId?-1:1)-(b.home_track_id===trackId?-1:1)||
      jockeyChoiceScore(state,playerHorse,b,
       jockeyBookingDecision(state,world,confirmed,playerHorse,b),confirmed)-
      jockeyChoiceScore(state,playerHorse,a,
       jockeyBookingDecision(state,world,confirmed,playerHorse,a),confirmed)||
      a.id.localeCompare(b.id));
     if(candidates[0])playerJockeyOptions.add(candidates[0].id);
    }
    let accepted=0,booked=0,offered=0;
    for(const h of chosen.eligible.slice(0,maxAiBookings)){
     const jockeys=Object.values(rt.jockeys).filter(j=>{
      if(playerJockeyOptions.has(j.id))return false;
      const decision=jockeyBookingDecision(state,world,confirmed,h,j);
      return decision.accept&&money(state,h.owner_organization_id)>=
       decision.quote.feeMinor;
     }).sort((a,b)=>{
      const qa=jockeyBookingDecision(state,world,confirmed,h,a);
      const qb=jockeyBookingDecision(state,world,confirmed,h,b);
      return jockeyChoiceScore(state,h,b,qb,confirmed)-
       jockeyChoiceScore(state,h,a,qa,confirmed)||a.id.localeCompare(b.id);
     });
     if(!jockeys.length)continue;
     const eliteBids=jockeys.filter(j=>premierMarketRace(confirmed,j)).
      slice(0,3);
     // Only actual elite national-feature mounts use competitive proposals.
     // A trainer can inquire about two or three stars, but cannot sign two
     // riders: the first winning offer locks the horse and voids the others.
     if(eliteBids.length){
      racingAction({state,world,command:{actor:'system',type:'ENTER_1999_RACE',
       payload:{race_id:r.id,horse_id:h.horse_id}},emit});
      accepted++;
      for(const rider of eliteBids){
       const decision=jockeyBookingDecision(state,world,confirmed,h,rider);
       const remaining=money(state,h.owner_organization_id)-
        decision.quote.feeMinor;
       const ceiling=Math.max(0,Math.min(
        premierBonusCap(decision.quote),remaining));
       const strength=h.starting_attributes.current_ability/100;
       const bonus=Math.max(0,Math.floor(ceiling*(.2+.38*strength)));
       racingAction({state,world,command:{actor:'system',
        type:'OFFER_1999_PREMIER_JOCKEY',payload:{
         race_id:r.id,horse_id:h.horse_id,jockey_id:rider.id,
         bonus_minor:bonus}},emit});
       offered++;
      }
     }else{
      racingAction({state,world,command:{actor:'system',type:'ENTER_1999_RACE',
       payload:{race_id:r.id,horse_id:h.horse_id}},emit});
      racingAction({state,world,command:{actor:'system',type:'BOOK_1999_JOCKEY',
       payload:{race_id:r.id,horse_id:h.horse_id,jockey_id:jockeys[0].id}},emit});
      accepted++;booked++;
     }
    }
    rt.selection_count++;
    emit('RACE_SECRETARY_AND_TRAINER_PLAN',{track_id:trackId,race_id:r.id,
     date:r.date,conditions:racingClass==='FEATURE'?r.conditions:racingClass,
     modeled_feature:racingClass==='FEATURE',
     max_career_wins:r.maxCareerWins??null,
     eligible_horses:chosen.eligible.length,accepted_starters:accepted,
     jockey_bookings:booked,premier_unpaid_offers:offered,
     average_surface_distance_fit:Math.round(chosen.averageFit*1000)/1000,
     reason:racingClass==='FEATURE'?
      'FUNDED_GAME_MODELED_STAKES_WITH_REAL_AVAILABLE_RIDERS':
      racingClass==='Allowance'?
      'MAIDEN_GRADUATES_ENTER_SOURCE_CONDITIONED_NW_ALLOWANCE':
      'MAIDEN_FIELD_SURFACE_DISTANCE_AND_JOCKEY_AVAILABILITY',
     player_horses_entered_automatically:false});
   }
  }
  rt.last_selection_date=day;
 }
 // Award elite rides at the four-day deadline. The losing AI owner
 // may then hire an actual available rider; player decisions remain manual.
 resolve1999PremierJockeyOffers({state,world,emit});
 book1999LostPremierFallbacks({state,world,emit});
 book1999UnavailableJockeyReplacements({state,world,emit});
 autonomousAwayTravel({state,world,emit});
 // Today's race is not automatically a real result unless at least two
 // medically cleared runners and confirmed jockeys are in the valid field.
 for(const race of Object.values(state.runtime.races||{}).
  filter(r=>r.source==='WTW_1999_TRACK_SPECIFIC_MEET_PROGRESSION'&&
   r.date===day&&r.status==='ENTRIES_OPEN').sort((a,b)=>a.id.localeCompare(b.id))){
  for(const id of [...race.field]){
   const e=state.runtime.entries[id],h=state.runtime.registered_horses.by_id[e.horse_id],
    care=state.runtime.horse[h.horse_id];
   if(e.status!=='BOOKED'||effectiveHorseTrack(state,h)!==race.track_id||
    !care||care.training.sorenessDays>0||
    care.training.currentRisk>=.78||care.training.readiness<.38||
    care.history.at(-1)?.unfunded===true){
    e.status='SCRATCHED';e.scratch_reason='RACE_DAY_WELFARE_OR_BOOKING';
    race.field=race.field.filter(x=>x!==id);
    emit('RACE_DAY_SCRATCH',{race_id:race.id,horse_id:e.horse_id,
     reason:e.scratch_reason,health_risk:care?.training.currentRisk??null});
   }
  }
  if(race.field.length>=2){
   racingAction({state,world,command:{actor:'system',type:'SETTLE_1999_RACE',
    payload:{race_id:race.id}},emit});
  }else{
   race.status='CANCELLED_INSUFFICIENT_FIELD';
   emit('RACE_CANCELLED',{race_id:race.id,track_id:race.track_id,
    reasons:['INSUFFICIENT_CLEARED_AND_BOOKED_STARTERS'],starters:race.field.length});
  }
 }
 autonomousReturnTravel({state,world,emit});
 rt.last_settlement_date=day;
}
