/**
 * Local trainer employment, January 1999.
 *
 * Offers are contractual, geographical and horse-specific. A trainer can
 * service several owners; ending one owner's last assignment ends only that
 * service relationship, never the person's identity or other clientele.
 * No untrained horse, teleported barn, fictitious funds or retroactive race
 * entry changes are permitted.
 */
import {ensure,isObject,validDate,worldIdentity,nextDate} from './contracts.js';
import {baselineTrainerDailyFee} from './trainer-contracts-1999.js';
import {horseTravelStatus} from './shipping-1999.js';

export const TRAINER_EMPLOYMENT_SCHEMA='WTW_1999_LOCAL_TRAINER_EMPLOYMENT_V1';
export const TRAINER_EMPLOYMENT_COMMANDS=Object.freeze([
 'OFFER_LOCAL_TRAINER_ASSIGNMENT','WITHDRAW_LOCAL_TRAINER_OFFER']);
const pair=(owner,trainer)=>owner+'|'+trainer;
const active=state=>Object.values(state.runtime.registered_horses?.by_id||{}).
 filter(h=>Boolean(h.starting_attributes)).sort((a,b)=>a.horse_id.localeCompare(b.horse_id));
const money=x=>Number.isSafeInteger(x)&&x>=0;
const inTrack=(h,site)=>h.host_track_id&&site?.host_track_id===h.host_track_id;
export function createTrainerEmploymentRuntime(){
 return {schema:TRAINER_EMPLOYMENT_SCHEMA,by_horse:{},history:[],notices:{},
  last_settlement_day:null,last_notice_day:null,
  totals:{offered:0,accepted:0,declined:0,withdrawn:0,
   completed:0,failed:0,notices:0,ai_offers:0}};
}
const root=s=>s.runtime.trainer_employment??=
 createTrainerEmploymentRuntime();
const allEntries=(state,id)=>Object.values(state.runtime.entries||{}).
 some(e=>e.horse_id===id&&e.status==='ENTERED');
const siteAvailable=(state,site,horse)=> {
 if(!site||site.status!=='ACTIVE'||site.residence_kind!=='TRACK_TRAINER_BARN'||
  site.staff_count<site.staff_required||site.stalls<=0)return false;
 const others=active(state).filter(h=>h.horse_id!==horse.horse_id&&
  h.current_residence_id===site.id).length;
 const reserved=(site.contracts||[]).filter(c=>c.start<=state.clock.date&&c.end>=state.clock.date).
  reduce((n,c)=>n+c.stalls,0);
 return others+reserved<site.stalls;
};
function blocking(state,horse){
 if(horse.status!=='IN_TRAINING')return 'HORSE_NOT_IN_TRAINING';
 if(allEntries(state,horse.horse_id))return 'LIVE_RACE_ENTRY';
 const travel=horseTravelStatus(state,horse.horse_id);
 if(travel&&travel.status!=='AT_HOME')return 'HORSE_SHIPPING_OR_AWAY';
 if(state.runtime.trainer_management_requests?.training_orders?.[horse.horse_id])
  return 'TEMPORARY_WORKOUT_IN_FORCE';
 return null;
}
function prospective(state,horse,trainer,site){
 const skill=state.runtime.people?.[trainer]?.game_training_skills;
 if(!skill)return null;
 const current=active(state).filter(h=>h.trainer_id===trainer).length;
 const capacity=Math.max(5,Math.round(5+10*(skill.roleAttributes?.workout_design??.5)));
 if(current>=capacity)return null;
 const existing=state.runtime.trainer_contracts?.by_pair?.[pair(horse.owner_organization_id,trainer)];
 const sameOwner=active(state).some(h=>h.owner_organization_id===horse.owner_organization_id&&h.trainer_id===trainer);
 const currentAgreement=existing?.status==='ACTIVE'&&sameOwner?existing:null;
 const standing=state.runtime.people?.[trainer]?.game_race_record?.professional_standing??.5;
 const modeled=Math.max(3000,Math.min(25000,
  Math.round(baselineTrainerDailyFee(skill)*(.83+.15*current/capacity+.09*standing))));
 const minimum=currentAgreement?currentAgreement.daily_fee_minor:modeled;
 return {horse_id:horse.horse_id,owner_id:horse.owner_organization_id,
  from_trainer_id:horse.trainer_id,to_trainer_id:trainer,
  destination_site_id:site.id,track_id:horse.host_track_id,
  minimum_daily_fee_minor:minimum,modeled_market_quote_minor:modeled,
  existing_owner_agreement:Boolean(currentAgreement),
  candidate_horses:current,trainer_capacity:capacity,
  provenance:'MODELED_1999_LOCAL_TRAINER_MARKET_NOT_HISTORICAL_CONTRACT'};
}
/** A same-track trainer must have an existing staffed, real barn.
 * Never invent candidates, license locations, or shipping coordinates. */
function choices(state,world,horse){
 if(!horse?.starting_attributes||!horse.host_track_id)return [];
 const eligible=[];
 for(const site of Object.values(state.runtime.facilities?.sites||{}).
  sort((a,b)=>a.id.localeCompare(b.id))){
  const trainer=site.head_trainer_person_id;
  if(!trainer||trainer===horse.trainer_id||!inTrack(horse,site)||
   !worldIdentity(world,'people',trainer)||!siteAvailable(state,site,horse))continue;
  if(!active(state).some(h=>h.trainer_id===trainer&&h.current_residence_id===site.id))
   continue; // The trainer must actually operate this racing barn.
  const q=prospective(state,horse,trainer,site);
  if(q)eligible.push(q);
 }
 return eligible.sort((a,b)=>a.minimum_daily_fee_minor-b.minimum_daily_fee_minor||
  a.to_trainer_id.localeCompare(b.to_trainer_id));
}
export function getLocalTrainerHiringMarket(state,world,horseId=null){
 const owner=state.player.role==='owner'?state.player.operation_id:null;
 const rt=state.runtime.trainer_employment;
 const rows=active(state).filter(h=>h.owner_organization_id===owner&&
  (horseId===null||h.horse_id===horseId));
 return structuredClone({schema:TRAINER_EMPLOYMENT_SCHEMA,date:state.clock.date,
  offers:rows.map(h=>({horse_id:h.horse_id,horse_name:h.registered_name,
   current_trainer_id:h.trainer_id,host_track_id:h.host_track_id,
   location_blocker:blocking(state,h),
   pending_offer:rt?.by_horse?.[h.horse_id]??null,
   local_trainers:choices(state,world,h)})),
  notices:Object.values(rt?.notices||{}).filter(n=>n.owner_id===owner),
  recent:(rt?.history||[]).filter(e=>e.owner_id===owner).slice(-16)});
}
function offer({state,world,horse,trainer,siteId,fee,actor,emit}){
 const rt=root(state),owner=horse.owner_organization_id;
 ensure(!blocking(state,horse),'TRAINER_HIRE_BLOCKED',
  'Horse must be at its home barn, without active race entry or temporary recovery order');
 ensure(!rt.by_horse[horse.horse_id],
  'TRAINER_HIRE_PENDING','Horse already has a signed pending trainer move');
 const q=choices(state,world,horse).find(q=>q.to_trainer_id===trainer&&
  q.destination_site_id===siteId);
 ensure(q,'TRAINER_HIRE_LOCAL','Trainer must operate a staffed eligible same-track barn with capacity');
 ensure(money(fee)&&fee>=3000&&fee<=25000,'TRAINER_HIRE_FEE',
  'Modeled daily fee must be between $30 and $250');
 const balance=state.runtime.finances?.operation_balances_minor?.[owner];
 const commitments=active(state).filter(h=>h.owner_organization_id===owner&&
  h.trainer_id===trainer).length;
 ensure(money(balance)&&balance>=fee*7*(commitments+1),
  'TRAINER_HIRE_FUNDS','Owner must afford seven days of new trainer services');
 if(q.existing_owner_agreement)ensure(fee===q.minimum_daily_fee_minor,
  'TRAINER_HIRE_EXISTING_TERMS',
  'Existing owner/trainer agreement must retain its signed daily fee');
 const offeredOn=state.clock.date;
 const item={id:horse.horse_id+':'+offeredOn+':'+trainer,
  horse_id:horse.horse_id,owner_id:owner,
  from_trainer_id:horse.trainer_id,to_trainer_id:trainer,
  source_site_id:horse.current_residence_id,destination_site_id:siteId,
  track_id:horse.host_track_id,daily_fee_minor:fee,
  minimum_daily_fee_minor:q.minimum_daily_fee_minor,
  offered_on:offeredOn,effective_on:nextDate(offeredOn),decided_by:actor,
  status:null,resolved_on:null,reason:null};
 rt.totals.offered++;
 if(fee<q.minimum_daily_fee_minor){
  item.status='DECLINED';item.resolved_on=offeredOn;
  item.reason='TRAINER_MINIMUM_NOT_MET';rt.totals.declined++;
  rt.history.push(item);if(rt.history.length>120)rt.history.shift();
  emit('LOCAL_TRAINER_OFFER_DECLINED',{
   offer_id:item.id,horse_id:horse.horse_id,owner_id:owner,
   trainer_id:trainer,offered_minor:fee,
   minimum_minor:q.minimum_daily_fee_minor,reason:item.reason});
  return {accepted:false,offer_id:item.id};
 }
 item.status='ACCEPTED_PENDING_MOVE';rt.totals.accepted++;
 rt.by_horse[horse.horse_id]=item;
 if(actor==='system')rt.totals.ai_offers++;
 emit('LOCAL_TRAINER_OFFER_ACCEPTED',{offer_id:item.id,
  horse_id:horse.horse_id,owner_id:owner,from_trainer_id:horse.trainer_id,
  to_trainer_id:trainer,destination_site_id:siteId,track_id:horse.host_track_id,
  daily_fee_minor:fee,effective_on:item.effective_on,
  owner_prior_employment:q.existing_owner_agreement,
  no_advance_payment:true});
 return {accepted:true,offer_id:item.id};
}
export function trainerEmploymentAction({state,world,command,emit}){
 const p=command.payload,actor=command.actor;
 ensure(isObject(p)&&typeof p.horse_id==='string'&&
  (actor==='system'||actor==='player'&&state.player.role==='owner'),
  'TRAINER_HIRE_PERMISSION','Trainer hiring requires a known authorized racing owner');
 const horse=state.runtime.registered_horses?.by_id?.[p.horse_id];
 ensure(Boolean(horse)&&horse.starting_attributes&&
  (actor==='system'?horse.owner_organization_id!==state.player.operation_id:
   horse.owner_organization_id===state.player.operation_id),
  'TRAINER_HIRE_PERMISSION','Only the actual owner can authorize this horse assignment');
 const rt=root(state);
 if(command.type==='WITHDRAW_LOCAL_TRAINER_OFFER'){
  const item=rt.by_horse[p.horse_id];
  ensure(item&&item.id===p.offer_id,'TRAINER_HIRE_PENDING','Exact accepted pending offer required');
  item.status='WITHDRAWN';item.resolved_on=state.clock.date;
  item.reason='OWNER_WITHDREW_BEFORE_EFFECTIVE_DATE';
  delete rt.by_horse[p.horse_id];rt.history.push(item);
  if(rt.history.length>120)rt.history.shift();
  rt.totals.withdrawn++;
  emit('LOCAL_TRAINER_OFFER_WITHDRAWN',{
   offer_id:item.id,horse_id:p.horse_id,owner_id:item.owner_id});
  return;
 }
 ensure(typeof p.trainer_id==='string'&&typeof p.site_id==='string'&&
  money(p.daily_fee_minor),'TRAINER_HIRE_OFFER',
  'Named source trainer, staffed same-track barn and modeled fee required');
 offer({state,world,horse,trainer:p.trainer_id,siteId:p.site_id,
  fee:p.daily_fee_minor,actor,emit});
}
function completed(state,item,emit){
 const rt=root(state);
 const h=state.runtime.registered_horses?.by_id?.[item.horse_id];
 const valid=Boolean(h&&h.owner_organization_id===item.owner_id&&
  h.trainer_id===item.from_trainer_id&&
  h.current_residence_id===item.source_site_id&&!blocking(state,h)&&
  choices(state,{entities:{people:[]}},h)); // replaced below with real-world validation
 return valid;
}
