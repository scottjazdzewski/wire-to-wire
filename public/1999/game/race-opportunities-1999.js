/**
 * WTW 1999 — READ-ONLY career horse race opportunity projection.
 *
 * No entry, fee, jockey booking, horse shipping or historical race creation
 * occurs here. Only source-derived condition-book proposals and already-open
 * actual game races may appear. It is safe to call on any UI render.
 */
import {ensure} from './contracts.js';
import {gameRaceProgram,raceEligibility,jockeyBookingDecision,supported1999RaceClass}
 from './racing-1999.js';
import {shippingAssessment,effectiveHorseTrack} from './shipping-1999.js';

import {premierMarketRace,premierBonusCap} from '../engine/jockey-premier-market-1999.mjs';

export const RACE_OPPORTUNITY_SCHEMA='WTW_1999_HORSE_RACE_OPPORTUNITIES_V1';
const DAY_MS=86400000;
const nextDay=(date,days)=>new Date(Date.parse(date+'T12:00:00Z')+days*DAY_MS).
 toISOString().slice(0,10);
const lead=(date,target)=>(Date.parse(target+'T12:00:00Z')-
 Date.parse(date+'T12:00:00Z'))/DAY_MS;
const money=amt=>Number.isSafeInteger(amt)&&amt>=0;
const raceClass=book=>({
 id:book.id,track_id:book.track_id??book.trackId,date:book.date,
 number:book.number,name:book.name,conditions:book.conditions,
 age:book.age??book.ageRequirement,sex:book.sex??book.sexRestriction,
 maiden:book.maiden??book.maidenOnly,max_wins:book.max_wins??book.maxCareerWins,
 surface:book.surface,distance_furlongs:book.distance_furlongs??book.distanceFurlongs,
 field_capacity:book.field_capacity??book.fieldCapacity,
 stake_id:book.stake_id??book.stakeId??null,
 stakes_grade:book.stakes_grade??book.stakesGrade??null,
 purse_minor:book.purse_minor??Math.round(book.purse*100),
 status:book.status,source:book.source??book.conditionBookBasis,
 field:book.field??[]
});
function optionJockeys(state,world,horse,race){
 const jockeys=Object.values(state.runtime.racing?.jockeys||{});
 const account=state.runtime.finances.operation_balances_minor[horse.owner_organization_id];
 const options=[];
 for(const j of jockeys){
  const sameDay=Object.values(state.runtime.entries||{}).filter(e=>
   e.jockey_id===j.id&&['ENTERED','BOOKED'].includes(e.status)&&
   state.runtime.races[e.race_id]?.date===race.date);
  if(sameDay.some(e=>e.race_id===race.id||
   state.runtime.races[e.race_id]?.track_id!==race.track_id))continue;
  const quote=jockeyBookingDecision(state,world,race,horse,j);
  if(!quote.accept)continue;
  const fee=quote.quote.feeMinor;
  options.push({
   jockey_id:j.id,home_track_id:j.home_track_id,
   jockey_tier:j.tier??'REGIONAL',
   premier_offer_required:premierMarketRace(race,j),
   maximum_signing_bonus_minor:premierMarketRace(race,j)?
    premierBonusCap(quote.quote):0,
   paid_on_offer:false,
   away_travel:quote.away,fee_minor:fee,
   mount_fee_minor:quote.quote.mountMinor,
   travel_fee_minor:quote.quote.travelMinor,
   previous_mounts_at_same_track_that_day:quote.schedule.sameCardCount,
   race_importance:quote.race_importance,
   acceptance_reason:quote.reason,suited_index:quote.suited_index,
   trainer_partnership_mounts:quote.relationship.trainerMounts,
   trainer_partnership_wins:quote.relationship.trainerWins,
   owner_partnership_mounts:quote.relationship.ownerMounts,
   trainer_relationship_index:quote.relationship.trainerBond,
   owner_relationship_index:quote.relationship.ownerBond,
   owner_can_pay:money(account)&&account>=fee,
   recommendation_index:Math.round(1000*(quote.suited_index*.61+
    quote.relationship.trainerBond*.1+quote.relationship.ownerBond*.04+
    (j.game_reputation??.5)*.16+
    ((j.tier==='ELITE'?.16:j.tier==='ESTABLISHED'?.09:0)*
     (quote.race_importance>=2?1:.25))-
    fee/Math.max(750000,race.purse_minor)*.045))/1000,
   source:'MODELED_AVAILABLE_JOCKEY_AGENT_NOT_HISTORICAL_CONTRACT'
  });
 }
 // The visible trainer recommendation is quality-aware. Expensive stars
 // outrank low-fee journeymen on important features, but owners still choose.
 return options.sort((a,b)=>b.recommendation_index-a.recommendation_index||
  a.fee_minor-b.fee_minor||a.jockey_id.localeCompare(b.jockey_id));
}
function travelOptions(state,world,horse,race){
 const sites=Object.values(state.runtime.facilities?.sites||{}).
  filter(s=>s.type==='RACING_STABLE'&&s.host_track_id===race.track_id).
  sort((a,b)=>a.id.localeCompare(b.id));
 const result=[];
 for(const site of sites){
  const quote=shippingAssessment(state,world,horse.horse_id,site.id,{
   targetRaceId:race.status==='ENTRIES_OPEN'?race.id:null});
  if(!quote.route?.supported&&quote.route==null)continue;
  if(lead(state.clock.date,race.date)<quote.route.days+2)continue;
  result.push({destination_site_id:site.id,destination_track_id:race.track_id,
   route_band:quote.route.band,travel_days:quote.route.days,
   shipping_minor:quote.route.cost_minor,
   stalls_available:quote.available_stalls,
   allowed:quote.allowed,blockers:quote.reasons,
   provenance:quote.route.provenance});
 }
 return result.sort((a,b)=>Number(b.allowed)-Number(a.allowed)||
  a.shipping_minor-b.shipping_minor||
  a.destination_site_id.localeCompare(b.destination_site_id));
}
function fit(horse,race){
 const a=horse.starting_attributes;
 const surface=race.surface==='TURF'?a.turf_aptitude:a.dirt_aptitude;
 const distance=race.distance_furlongs<8?a.sprint_aptitude:a.route_aptitude;
 return Math.round((.56*surface+.44*distance)*1000)/1000;
}
function raceSelection(state,world,horse,race,bookOpen){
 const normalized=raceClass(race);
 const sourceOpen=bookOpen===true;
 const check=raceEligibility(state,horse,normalized);
 const entry=state.runtime.entries?.[normalized.id+':'+horse.horse_id]??null;
 const currentPremierOffers=Object.values(state.runtime.racing?.premier_offers||{}).
  filter(o=>o.race_id===normalized.id&&o.horse_id===horse.horse_id);
 const pendingPremierOffers=currentPremierOffers.filter(o=>o.status==='PENDING');
 const playerOwns=state.player.role==='owner'&&
  state.player.operation_id===horse.owner_organization_id;
 const current=effectiveHorseTrack(state,horse);
 const needsShip=current!==normalized.track_id;
 const shipping=needsShip?travelOptions(state,world,horse,normalized):[];
 const jockeys=sourceOpen?optionJockeys(state,world,horse,normalized):[];
 const fundedJockey=jockeys.find(j=>j.owner_can_pay);
 const ownerCash=state.runtime.finances.operation_balances_minor?.[horse.owner_organization_id];
 const fieldFull=sourceOpen&&normalized.field.length>=normalized.field_capacity;
 const reason=[...check.reasons];
 if(fieldFull&&!entry)reason.push('RACE_FULL');
 if(sourceOpen&&!entry&&!jockeys.length)reason.push('NO_ACCEPTING_AVAILABLE_JOCKEY');
 if(sourceOpen&&!entry&&jockeys.length&&!fundedJockey)reason.push('OWNER_CANNOT_PAY_JOCKEY_BOOKING');
 const shippingQuote=shipping.find(s=>s.allowed);
 if(needsShip&&!shippingQuote)reason.push('NO_FUNDED_RECEIVING_BARN_OR_TRAVEL_WINDOW');
 const exclusive=reason.filter(r=>r!=='NOT_PHYSICALLY_AT_TRACK_OR_CONFIRMED_TO_ARRIVE');
 const possibleAfterShip=needsShip&&Boolean(shippingQuote)&&
  exclusive.every(r=>r!=='RACE_FULL'&&r!=='ALLOWANCE_REQUIRES_MAIDEN_VICTORY'&&
   r!=='CAREER_WIN_LIMIT'&&r!=='MAIDEN_RESTRICTION'&&
   r!=='CLASS_CONDITIONS_NOT_YET_MODELED'&&r!=='AGE_RESTRICTION'&&
   r!=='SEX_RESTRICTION'&&r!=='CONFLICTING_CAMPAIGN_SPACING'&&
   r!=='CONFLICTING_ENTRY'&&r!=='CONDITION_NOT_CLEARED'&&
   r!=='INSUFFICIENT_RECOVERY_SPACING'&&
   r!=='NO_ACCEPTING_AVAILABLE_JOCKEY');
 let status='BLOCKED';
 if(entry&&pendingPremierOffers.length&&!entry.jockey_id)
  status='PREMIER_OFFER_PENDING';
 else if(entry)status='ALREADY_ENTERED';
 else if(!sourceOpen)status='CONDITION_BOOK_PROPOSAL_NOT_ENTERABLE';
 else if(!needsShip&&check.eligible&&!fieldFull&&fundedJockey&&playerOwns)
  status='PLAYER_CAN_ENTER';
 else if(possibleAfterShip&&fundedJockey&&playerOwns){
  const balance=ownerCash??0;
  const base=shippingQuote.shipping_minor+fundedJockey.fee_minor;
  const careReserve=Math.ceil((state.runtime.horse[horse.horse_id]?.policy?.monthly_budget_minor??0)/30*7);
  if(balance>=base+careReserve)status='SHIPPING_REQUIRED';
  else reason.push('COMBINED_SHIPPING_JOCKEY_AND_CARE_RESERVE_UNFUNDED');
 }
 return {
  race_id:normalized.id,horse_id:horse.horse_id,date:normalized.date,
  track_id:normalized.track_id,number:normalized.number,
  conditions:normalized.conditions,age:normalized.age,sex:normalized.sex,
  max_career_wins:normalized.max_wins,maiden:normalized.maiden,
  surface:normalized.surface,distance_furlongs:normalized.distance_furlongs,
  purse_minor:normalized.purse_minor,
  capacity:normalized.field_capacity,entries:normalized.field.length,
  source_status:sourceOpen?'ACTUAL_GAME_RACE_ENTRIES_OPEN':
   'MODELED_SOURCE_CONDITION_BOOK_PROPOSAL',
  status,eligibility_reasons:[...new Set(reason)],
  next_required_action:status==='PLAYER_CAN_ENTER'?
    (fundedJockey?.premier_offer_required?'OFFER_1999_PREMIER_JOCKEY':'ENTER_1999_RACE'):
   status==='SHIPPING_REQUIRED'?'SHIP_1999_HORSE':
   status==='PREMIER_OFFER_PENDING'?'WAIT_FOR_PREMIER_DECISION':
   status==='ALREADY_ENTERED'?entry.jockey_id?'NONE_BOOKED':'BOOK_1999_JOCKEY':
   status==='CONDITION_BOOK_PROPOSAL_NOT_ENTERABLE'?'WAIT_FOR_RACE_SECRETARY_OPENING':
   'RESOLVE_ELIGIBILITY_OR_FINANCING',
  class_fit:fit(horse,normalized),owner_cash_minor:money(ownerCash)?ownerCash:null,
  player_controls_horse:playerOwns,
  booked_entry_id:entry?.id??null,booked_jockey_id:entry?.jockey_id??null,
  pending_premier_offers:pendingPremierOffers.map(o=>({
   jockey_id:o.jockey_id,bonus_minor:o.bonus_minor,
   maximum_jockey_fee_minor:o.maximum_jockey_fee_minor,
   offered_date:o.offered_date,owner_paid:false})),
  resolved_premier_offers:currentPremierOffers.filter(o=>o.status!=='PENDING').
   map(o=>({jockey_id:o.jockey_id,status:o.status,
    reason:o.reason??null,winning_horse_id:o.winning_horse_id??null})),
  available_jockeys:jockeys,receiving_barn_options:shipping,
  historical_results_claimed:false,
  provenance:'SOURCE_MODELED_1999_PROGRAM_AND_SAVED_CAREER_STATE'
 };
}
/** Read-only, exact-ID list. Includes real opened races at any circuit and
 * optional proposals at the horse's CURRENT physical track only. */
export function get1999HorseRaceOpportunities(state,world,horseId,{
 horizonDays=21,includeProposals=true,limit=60}={}){
 ensure(Number.isInteger(horizonDays)&&horizonDays>=1&&horizonDays<=28&&
  Number.isInteger(limit)&&limit>=1&&limit<=200,
  'RACE_OPPORTUNITY_QUERY','Supported future 1999 horizon/row limit required');
 const horse=state.runtime.registered_horses?.by_id?.[horseId];
 ensure(Boolean(horse)&&Boolean(horse.starting_attributes),'RACE_OPPORTUNITY_QUERY',
  'Only an actual registered game horse has career opportunities');
 const maxDate=nextDay(state.clock.date,horizonDays);
 const open=Object.values(state.runtime.races||{}).filter(r=>
  r.status==='ENTRIES_OPEN'&&r.date>=state.clock.date&&r.date<=maxDate&&
  supported1999RaceClass(r)).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
 const rows=open.map(r=>raceSelection(state,world,horse,r,true));
 if(includeProposals){
  const trackId=effectiveHorseTrack(state,horse)||horse.host_track_id;
  const known=new Set(open.map(x=>x.id));
  if(trackId){
   for(let i=2;i<=horizonDays;i++){
    const date=nextDay(state.clock.date,i);
    for(const book of gameRaceProgram(state,world,trackId,date)){
     if(!supported1999RaceClass(book)||known.has(book.id))continue;
     rows.push(raceSelection(state,world,horse,book,false));
    }
   }
  }
 }
 rows.sort((a,b)=>{
  const rank=s=>s==='PLAYER_CAN_ENTER'?0:s==='SHIPPING_REQUIRED'?1:
   s==='ALREADY_ENTERED'?2:s==='BLOCKED'?3:4;
  return rank(a.status)-rank(b.status)||
   a.date.localeCompare(b.date)||
   b.class_fit-a.class_fit||a.race_id.localeCompare(b.race_id);
 });
 return {schema:RACE_OPPORTUNITY_SCHEMA,horse_id:horse.horse_id,
  owner_id:horse.owner_organization_id,trainer_id:horse.trainer_id,
  as_of:state.clock.date,horizon_days:horizonDays,
  total:rows.length,rows:rows.slice(0,limit),
  notes:'OPEN_GAME_RACES_ARE_ACTUAL;CONDITION_BOOK_PROPOSALS_ARE_NOT_ENTERABLE'};
}
