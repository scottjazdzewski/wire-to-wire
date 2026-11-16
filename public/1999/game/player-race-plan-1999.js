/**
 * A single approved owner command to confirm a 1999 race plan.
 * Every component (shipping, entry, jockey booking) still executes its
 * authoritative existing engine action. The game kernel clones state before
 * calling this module; a failed final step cannot retain earlier debits.
 */
import {ensure,worldIdentity,jsonClone} from './contracts.js';
import {racingAction,jockeyBookingDecision,raceEligibility} from './racing-1999.js';
import {shippingAction,shippingAssessment,effectiveHorseTrack,horseTravelStatus,
 modeledShippingRoute} from './shipping-1999.js';

import {premierMarketRace} from '../engine/jockey-premier-market-1999.mjs';

export const PLAYER_RACE_PLAN_COMMANDS=Object.freeze(['CONFIRM_1999_RACE_PLAN']);
export const PLAYER_RACE_PLAN_QUOTE_SCHEMA='WTW_1999_PLAYER_RACE_PLAN_QUOTE_V1';
const amount=x=>Number.isSafeInteger(x)&&x>=0;
const packet=(state,world,horse,race,jockey,site)=>({
 schema:PLAYER_RACE_PLAN_QUOTE_SCHEMA,
 as_of:state.clock.date,expected_revision:state.revision,
 horse_id:horse?.horse_id||null,race_id:race?.id||null,
 jockey_id:jockey?.id||null,destination_site_id:site||null,
 race_date:race?.date||null,track_id:race?.track_id||null,
 owner_id:horse?.owner_organization_id||null,
 owner_cash_minor:horse?state.runtime.finances.operation_balances_minor[horse.owner_organization_id]??null:null,
 jockey_booking_minor:0,outbound_shipping_minor:0,estimated_return_shipping_minor:0,
 immediate_total_minor:0,reserved_care_minor:0,cash_after_booking_minor:null,
 premier_offer_required:false,offer_bonus_minor:0,
 potential_jockey_if_signed_minor:0,total_if_signed_minor:0,
 premier_decision_due_date:null,
 acceptance:null,needs_shipping:false,can_confirm:false,blockers:[],
 authority:'ACTUAL_GAME_RUN_PLAYER_COMMAND_QUOTE_NOT_HISTORICAL_RESULT'
});
/** Side-effect-free quote. We simulate the exact existing actions on a
 * temporary clone and report the actual player debit; no fake pre-payment
 * or independently reimplemented racing rules exist here. */
export function quote1999PlayerRacePlan(state,world,{
 horse_id,race_id,jockey_id,destination_site_id=null,bonus_minor=0}={}){
 const horse=state.runtime.registered_horses?.by_id?.[horse_id],
  race=state.runtime.races?.[race_id],jockey=state.runtime.racing?.jockeys?.[jockey_id];
 const quote=packet(state,world,horse,race,jockey,destination_site_id);
 const fail=(code,message)=>{quote.blockers.push({code,message});return quote};
 if(!horse)return fail('UNKNOWN_HORSE','Choose a registered game racehorse');
 if(!race||race.status!=='ENTRIES_OPEN')return fail('RACE_NOT_OPEN','Choose an actually open game race');
 if(!jockey)return fail('UNKNOWN_JOCKEY','Choose a selected game jockey');
 if(state.player.role!=='owner'||state.player.operation_id!==horse.owner_organization_id)
  return fail('RACE_PERMISSION','Only the horse owner can approve an entry');
 if(state.runtime.entries?.[race.id+':'+horse.horse_id])
  return fail('RACE_ALREADY_ENTERED','This horse already has an entry in that race');
 const balances=state.runtime.finances.operation_balances_minor,
  previous=balances[horse.owner_organization_id];
 if(!amount(previous))return fail('RACE_FINANCE','Owner account is not established');
 quote.acceptance=jockeyBookingDecision(state,world,race,horse,jockey);
 quote.premier_offer_required=premierMarketRace(race,jockey);
 if(quote.premier_offer_required){
  if(!amount(bonus_minor)||bonus_minor>250000)
   return fail('PREMIER_OFFER_BONUS','Choose a bounded integer-cent signing premium');
  quote.offer_bonus_minor=bonus_minor;
  quote.potential_jockey_if_signed_minor=
   (quote.acceptance.quote?.feeMinor??0)+bonus_minor;
  quote.premier_decision_due_date=new Date(Date.parse(
   race.date+'T12:00:00Z')-4*86400000).toISOString().slice(0,10);
 }
 const transport=horseTravelStatus(state,horse.horse_id);
 const alreadyOutbound=transport?.status==='OUTBOUND'&&transport.destination_track_id===race.track_id;
 quote.needs_shipping=effectiveHorseTrack(state,horse)!==race.track_id&&!alreadyOutbound;
 if(quote.needs_shipping&&!destination_site_id)
  return fail('SELECT_RECEIVING_BARN','Choose a staffed receiving barn before authorizing transport');
 if(!quote.needs_shipping&&destination_site_id)
  return fail('UNNEEDED_TRANSPORT','This horse already has a confirmed route or is at the racecourse');
 const proposed=jsonClone(state);
 const noop=()=>{};
 try{
  if(quote.needs_shipping){
   const assessment=shippingAssessment(proposed,world,horse.horse_id,destination_site_id,
    {targetRaceId:race.id});
   if(!assessment.allowed)
    return fail('SHIP_BLOCKED',assessment.reasons.join(', '));
   quote.outbound_shipping_minor=assessment.route.cost_minor;
   const origin=proposed.runtime.facilities.sites[horse.current_residence_id],
    destination=proposed.runtime.facilities.sites[destination_site_id],
    reverse=modeledShippingRoute(destination,origin);
   quote.estimated_return_shipping_minor=reverse.supported?reverse.cost_minor:0;
   quote.reserved_care_minor=Math.ceil(
    (state.runtime.horse?.[horse.horse_id]?.policy?.monthly_budget_minor??0)/30*14);
   shippingAction({state:proposed,world,command:{
    actor:'player',type:'SHIP_1999_HORSE',
    payload:{horse_id:horse.horse_id,destination_site_id,target_race_id:race.id}
   },emit:noop});
  }
  const afterShip=raceEligibility(proposed,horse,race);
  if(!afterShip.eligible)return fail('RACE_INELIGIBLE',afterShip.reasons.join(', '));
  racingAction({state:proposed,world,command:{actor:'player',
   type:'ENTER_1999_RACE',payload:{horse_id:horse.horse_id,race_id:race.id}},emit:noop});
  const beforeBook=proposed.runtime.finances.operation_balances_minor[horse.owner_organization_id];
  if(quote.premier_offer_required){
   racingAction({state:proposed,world,command:{actor:'player',
    type:'OFFER_1999_PREMIER_JOCKEY',payload:{horse_id:horse.horse_id,
     race_id:race.id,jockey_id:jockey.id,bonus_minor,
     maximum_jockey_fee_minor:quote.potential_jockey_if_signed_minor}},emit:noop});
   // The owner is NOT charged before the premier rider actually signs.
   quote.jockey_booking_minor=0;
  }else{
   racingAction({state:proposed,world,command:{actor:'player',
    type:'BOOK_1999_JOCKEY',payload:{horse_id:horse.horse_id,
     race_id:race.id,jockey_id:jockey.id}},emit:noop});
   quote.jockey_booking_minor=beforeBook-
    proposed.runtime.finances.operation_balances_minor[horse.owner_organization_id];
  }
  quote.immediate_total_minor=previous-
   proposed.runtime.finances.operation_balances_minor[horse.owner_organization_id];
  quote.cash_after_booking_minor=previous-quote.immediate_total_minor;
  quote.total_if_signed_minor=quote.immediate_total_minor+
   quote.potential_jockey_if_signed_minor;
  // A future winning premier offer must ALSO be affordable, even though
  // the wager-free proposal cannot immediately charge the owner.
  if(quote.premier_offer_required&&quote.cash_after_booking_minor<
   quote.potential_jockey_if_signed_minor+quote.reserved_care_minor)
   return fail('PREMIER_OFFER_FUTURE_FUNDS',
    'The owner cannot cover the proposed jockey contract and horse care reserve');
  // A horse still needs ongoing care after signing. Do not present the
  // booking as financially safe when it exhausts the hauling care reserve.
  if(quote.needs_shipping&&quote.cash_after_booking_minor<quote.reserved_care_minor)
   return fail('CARE_RESERVE_UNFUNDED','Booking leaves insufficient owner funds for modeled 14-day care reserve');
  ensure(amount(quote.immediate_total_minor)&&
   quote.immediate_total_minor===quote.outbound_shipping_minor+quote.jockey_booking_minor,
   'RACE_PLAN_FINANCE','Shipping and jockey booking amounts must reconcile');
  quote.can_confirm=true;
  return quote;
 }catch(error){return fail(error.code||'RACE_PLAN_BLOCKED',String(error.message||error))}
}
/** Invoked on kernel's isolated state clone. A thrown error restores every
 * owner balance, registered entry, jockey booking, and horse trip atomically. */
export function confirm1999PlayerRacePlan({state,world,command,emit}){
 const p=command.payload;
 ensure(command.actor==='player'&&state.player.role==='owner',
  'RACE_PLAN_PERMISSION','Only the player owning the horse can confirm this race plan');
 ensure(Number.isSafeInteger(p.expected_revision)&&p.expected_revision===state.revision,
  'RACE_PLAN_STALE','The game changed since the quote; review current fees and eligibility');
 ensure(amount(p.maximum_total_minor),'RACE_PLAN_AUTHORIZATION',
  'Confirm an explicit maximum immediate dollar amount in cents');
 const quote=quote1999PlayerRacePlan(state,world,p);
 ensure(quote.can_confirm,'RACE_PLAN_BLOCKED',
  quote.blockers.map(b=>b.code+': '+b.message).join('; '));
 ensure(quote.total_if_signed_minor<=p.maximum_total_minor,
  'RACE_PLAN_PRICE_CHANGED','Confirmed or potential rider cost exceeds owner maximum');
 const horse=state.runtime.registered_horses.by_id[p.horse_id],
  race=state.runtime.races[p.race_id],cash=quote.owner_cash_minor;
 if(quote.needs_shipping)shippingAction({state,world,command:{
  actor:'player',type:'SHIP_1999_HORSE',payload:{
   horse_id:p.horse_id,destination_site_id:p.destination_site_id,
   target_race_id:p.race_id}},emit});
 racingAction({state,world,command:{actor:'player',type:'ENTER_1999_RACE',
  payload:{horse_id:p.horse_id,race_id:p.race_id}},emit});
 if(quote.premier_offer_required){
  racingAction({state,world,command:{actor:'player',
   type:'OFFER_1999_PREMIER_JOCKEY',payload:{
    horse_id:p.horse_id,race_id:p.race_id,jockey_id:p.jockey_id,
    bonus_minor:quote.offer_bonus_minor,
    maximum_jockey_fee_minor:quote.potential_jockey_if_signed_minor}},emit});
 }else racingAction({state,world,command:{actor:'player',type:'BOOK_1999_JOCKEY',
  payload:{horse_id:p.horse_id,race_id:p.race_id,jockey_id:p.jockey_id}},emit});
 ensure(state.runtime.finances.operation_balances_minor[horse.owner_organization_id]===
  cash-quote.immediate_total_minor,
  'RACE_PLAN_FINANCE','Committed owner debit differs from authorized quote');
 if(quote.premier_offer_required){
  emit('PLAYER_PREMIER_RIDE_OFFER_SUBMITTED',{
   horse_id:horse.horse_id,owner_id:horse.owner_organization_id,
   trainer_id:horse.trainer_id,race_id:race.id,jockey_id:p.jockey_id,
   decision_due_date:quote.premier_decision_due_date,
   proposed_bonus_minor:quote.offer_bonus_minor,
   max_authorized_jockey_minor:quote.potential_jockey_if_signed_minor,
   outbound_shipping_minor:quote.outbound_shipping_minor,
   paid_jockey_fee_minor:0,charged_immediate_minor:quote.immediate_total_minor,
   source:'MODEL_REAL_UNPAID_OFFER_NOT_SIGNED_MOUNT'});
  return;
 }
 emit('PLAYER_RACE_PLAN_CONFIRMED',{horse_id:horse.horse_id,
  owner_id:horse.owner_organization_id,trainer_id:horse.trainer_id,
  race_id:race.id,race_date:race.date,track_id:race.track_id,
  jockey_id:p.jockey_id,destination_site_id:quote.needs_shipping?p.destination_site_id:null,
  outbound_shipping_minor:quote.outbound_shipping_minor,
  jockey_booking_minor:quote.jockey_booking_minor,
  immediate_total_minor:quote.immediate_total_minor,
  estimated_future_return_shipping_minor:quote.estimated_return_shipping_minor,
  quote_revision:p.expected_revision,source:'MODEL_GAME_ACTUAL_OWNER_AUTHORIZED_ACTION'});
}
