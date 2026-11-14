/**
 * WIRE TO WIRE — dated, physical 1999 racehorse transportation.
 *
 * Game-only modeled hauling bands. These are NOT factual road miles, quoted
 * carrier fares, historical movements, or medical findings. Canonical T/F/H/O
 * identities are retained; the permanent racing barn remains the home site.
 * Visitors require a real active receiving barn and an unoccupied stall.
 */
import {ensure,isObject,validDate,worldIdentity} from './contracts.js';

export const HORSE_SHIPPING_COMMANDS=Object.freeze(['SHIP_1999_HORSE','RETURN_1999_HORSE']);
export const HORSE_SHIPPING_SCHEMA='WTW_1999_PHYSICAL_HORSE_SHIPPING_V1';
const DAY=86400000;
const gap=(a,b)=>Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/DAY);
const plus=(date,days)=>new Date(Date.parse(date+'T12:00:00Z')+days*DAY).toISOString().slice(0,10);
const cap=x=>Math.min(1,Math.max(0,x));
const four=x=>Math.round(cap(x)*10000)/10000;
const cents=x=>Number.isSafeInteger(x)&&x>=0;
const STATE_GROUPS=Object.freeze({
 NORTHEAST:'ME,NH,VT,MA,RI,CT,NY,NJ,PA',
 MIDATLANTIC:'DE,MD,DC,VA,WV,NC',
 SOUTHEAST:'SC,GA,FL,AL,MS,TN,KY',
 MIDWEST:'OH,MI,IN,IL,WI,MN,IA,MO',
 SOUTH_CENTRAL:'AR,LA,OK,TX,KS,NE,SD,ND',
 MOUNTAIN:'MT,WY,ID,UT,CO,NM,AZ,NV',
 PACIFIC:'CA,OR,WA,AK,HI'
});
const STATE_CODES=Object.freeze({
 Alabama:'AL',Alaska:'AK',Arizona:'AZ',Arkansas:'AR',California:'CA',Colorado:'CO',
 Connecticut:'CT',Delaware:'DE',Florida:'FL',Georgia:'GA',Hawaii:'HI',Idaho:'ID',
 Illinois:'IL',Indiana:'IN',Iowa:'IA',Kansas:'KS',Kentucky:'KY',Louisiana:'LA',
 Maine:'ME',Maryland:'MD',Massachusetts:'MA',Michigan:'MI',Minnesota:'MN',
 Mississippi:'MS',Missouri:'MO',Montana:'MT',Nebraska:'NE',Nevada:'NV',
 'New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY',
 'North Carolina':'NC','North Dakota':'ND',Ohio:'OH',Oklahoma:'OK',Oregon:'OR',
 Pennsylvania:'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',
 Tennessee:'TN',Texas:'TX',Utah:'UT',Vermont:'VT',Virginia:'VA',Washington:'WA',
 'West Virginia':'WV',Wisconsin:'WI',Wyoming:'WY','District of Columbia':'DC'
});
const BANDS=Object.freeze({
 SAME_METRO:{days:1,cost_minor:25000,fatigue:.014,stress:.012,readiness:.010},
 SAME_STATE:{days:1,cost_minor:70000,fatigue:.025,stress:.020,readiness:.020},
 REGIONAL:{days:2,cost_minor:145000,fatigue:.043,stress:.035,readiness:.040},
 INTERREGIONAL:{days:3,cost_minor:265000,fatigue:.068,stress:.050,readiness:.060},
 CROSS_COUNTRY:{days:5,cost_minor:590000,fatigue:.105,stress:.082,readiness:.098}
});
const ADJACENT=new Set([
 'NORTHEAST|MIDATLANTIC','MIDATLANTIC|SOUTHEAST','MIDATLANTIC|MIDWEST',
 'SOUTHEAST|MIDWEST','SOUTHEAST|SOUTH_CENTRAL','MIDWEST|SOUTH_CENTRAL',
 'MIDWEST|MOUNTAIN','SOUTH_CENTRAL|MOUNTAIN','MOUNTAIN|PACIFIC'
].map(pair=>pair.split('|').sort().join('|')));
function stateOf(site){
 const code=String(site?.location?.state||'').trim();
 const id=STATE_CODES[code]||code.toUpperCase();
 return Object.values(STATE_GROUPS).some(x=>x.split(',').includes(id))?id:null;
}
function groupFor(code){
 return Object.keys(STATE_GROUPS).find(g=>STATE_GROUPS[g].split(',').includes(code))||null;
}
export function modeledShippingRoute(originSite,destinationSite){
 const a=stateOf(originSite),b=stateOf(destinationSite);
 if(!a||!b||originSite.location?.country!=='USA'||
   destinationSite.location?.country!=='USA')
  return {supported:false,reason:'NO_VALIDATED_DOMESTIC_ROUTE'};
 const ag=groupFor(a),bg=groupFor(b);
 const key=[ag,bg].sort().join('|');
 const band=a===b?
   (String(originSite.location.city).toLowerCase()===
    String(destinationSite.location.city).toLowerCase()?'SAME_METRO':'SAME_STATE'):
   ag===bg||ADJACENT.has(key)?'REGIONAL':
   (ag==='PACIFIC'&&['NORTHEAST','MIDATLANTIC','SOUTHEAST'].includes(bg)||
    bg==='PACIFIC'&&['NORTHEAST','MIDATLANTIC','SOUTHEAST'].includes(ag))?
    'CROSS_COUNTRY':'INTERREGIONAL';
 return {supported:true,band,days:BANDS[band].days,cost_minor:BANDS[band].cost_minor,
  fatigue:BANDS[band].fatigue,stress:BANDS[band].stress,readiness:BANDS[band].readiness,
  provenance:'MODELED_1999_REGIONAL_HAULING_BANDS_NOT_MEASURED_MILES'};
}
const travels=state=>state.runtime.racing?.horse_travel||{};
export function horseTravelStatus(state,horseId){return travels(state)[horseId]||null}
export function effectiveHorseTrack(state,horse){
 const trip=horseTravelStatus(state,horse.horse_id);
 if(trip?.status==='AT_DESTINATION')return trip.destination_track_id;
 if(trip?.status==='OUTBOUND'||trip?.status==='RETURNING')return null;
 return horse.host_track_id??null;
}
export function effectiveHorseCareSite(state,horse){
 const trip=horseTravelStatus(state,horse.horse_id);
 const id=trip?.status==='AT_DESTINATION'?trip.destination_site_id:horse.current_residence_id;
 return state.runtime.facilities?.sites?.[id]||null;
}
export function visitingHorseCount(state,siteId,exceptHorseId=null){
 return Object.values(travels(state)).filter(x=>x.horse_id!==exceptHorseId&&
  x.destination_site_id===siteId&&['OUTBOUND','AT_DESTINATION'].includes(x.status)).length;
}
export function receivingBarnCapacity(state,siteId,exceptHorseId=null){
 const site=state.runtime.facilities?.sites?.[siteId];
 if(!site||site.status!=='ACTIVE'||site.staff_count<site.staff_required||
  !site.host_track_id)return 0;
 const home=Object.values(state.runtime.registered_horses?.by_id||{}).
  filter(h=>h.horse_id!==exceptHorseId&&h.current_residence_id===siteId).length;
 return Math.max(0,site.stalls-home-visitingHorseCount(state,siteId,exceptHorseId)-
  (site.contracts||[]).filter(c=>c.start<=state.clock.date&&c.end>=state.clock.date).
   reduce((n,c)=>n+c.stalls,0));
}
const ownerCash=(state,id)=>state.runtime.finances.operation_balances_minor[id];
const canManage=(state,command,horse)=>
 command.actor==='system'||command.actor==='player'&&
 state.player.role==='owner'&&state.player.operation_id===horse.owner_organization_id;
function recordPayment(state,horse,site,fee,kind,direction,emit){
 const owner=horse.owner_organization_id,accounts=state.runtime.finances.operation_balances_minor;
 ensure(cents(ownerCash(state,owner))&&ownerCash(state,owner)>=fee,
  'SHIP_FINANCE','Owner lacks funded transport payment');
 accounts[owner]-=fee;
 if(owner===state.player.operation_id)state.runtime.finances.balance_minor=accounts[owner];
 state.runtime.finances.ledger.push({date:state.clock.date,kind,
  operation_id:owner,horse_id:horse.horse_id,site_id:site.id,
  amount_minor:-fee,direction,provenance:'MODELED_1999_CARRIER_FEE'});
 state.runtime.finances.ledger.push({date:state.clock.date,
  kind:'MODELED_HORSE_CARRIER_RECEIPT',operation_id:null,
  horse_id:horse.horse_id,site_id:site.id,
  amount_minor:fee,direction,provenance:'EXTERNAL_MODELED_CARRIER'});
 emit('HORSE_TRANSPORT_PAID',{horse_id:horse.horse_id,owner_id:owner,
  amount_minor:fee,direction,site_id:site.id});
}
/** Approval is based on actual owned horse identity, source-locality, money,
 * horse welfare, receiving stalls, and sufficient pre-race acclimation. */
export function shippingAssessment(state,world,horseId,destinationSiteId,{targetRaceId=null}={}){
 const horse=state.runtime.registered_horses?.by_id?.[horseId],reasons=[];
 if(!horse)return {allowed:false,reasons:['UNKNOWN_HORSE']};
 const previous=horseTravelStatus(state,horseId);
 if(previous&&previous.status!=='HOME')reasons.push('ALREADY_TRAVELING_OR_AWAY');
 const origin=state.runtime.facilities?.sites?.[horse.current_residence_id];
 const destination=state.runtime.facilities?.sites?.[destinationSiteId];
 if(!origin||!destination||!worldIdentity(world,'tracks',destination?.host_track_id))
  reasons.push('UNKNOWN_RACECOURSE_BARN');
 if(destinationSiteId===horse.current_residence_id||
  destination?.host_track_id===horse.host_track_id&&horse.host_track_id)
  reasons.push('ALREADY_AT_RACECOURSE');
 if(destination&&receivingBarnCapacity(state,destinationSiteId,horseId)<1)
  reasons.push('NO_RECEIVING_STALL');
 const route=origin&&destination?modeledShippingRoute(origin,destination):
  {supported:false,reason:'NO_ROUTE'};
 if(!route.supported)reasons.push('NO_VERIFIED_DOMESTIC_GEOGRAPHY');
 const condition=state.runtime.horse?.[horseId]?.training;
 if(!condition||condition.sorenessDays>0||condition.currentRisk>=.68||
  condition.readiness<.49)reasons.push('HORSE_NOT_CLEARED_FOR_HAUL');
 const funds=ownerCash(state,horse.owner_organization_id);
 const care=state.runtime.horse?.[horseId],reserve=care?
  Math.ceil(care.policy.monthly_budget_minor/30*14):0;
 if(!cents(funds)||route.supported&&funds<route.cost_minor+reserve)
  reasons.push('OWNER_CANNOT_FUND_HAUL_AND_CARE_RESERVE');
 const conflicting=Object.values(state.runtime.entries||{}).some(e=>
  e.horse_id===horseId&&['ENTERED','BOOKED'].includes(e.status)&&
  state.runtime.races[e.race_id]?.date>=state.clock.date&&
  state.runtime.races[e.race_id]?.track_id!==destination?.host_track_id);
 if(conflicting)reasons.push('CONFLICTING_EXISTING_RACE_BOOKING');
 let race=null;
 if(targetRaceId){
  race=state.runtime.races?.[targetRaceId];
  if(!race||race.track_id!==destination?.host_track_id||
   race.status!=='ENTRIES_OPEN')reasons.push('UNKNOWN_DESTINATION_RACE');
  if(race&&route.supported&&gap(plus(state.clock.date,route.days),race.date)<2)
   reasons.push('INADEQUATE_PRE_RACE_ACCLIMATION');
 }
 return {allowed:reasons.length===0,reasons,
  route:route.supported?route:null,
  horse_id:horseId,source_site_id:horse.current_residence_id,
  destination_site_id:destinationSiteId,
  destination_track_id:destination?.host_track_id||null,
  available_stalls:destination?receivingBarnCapacity(state,destinationSiteId,horseId):0,
  target_race_id:targetRaceId};
}
export function shippingAction({state,world,command,emit}){
 const type=command.type,p=command.payload,
  horse=state.runtime.registered_horses?.by_id?.[p.horse_id];
 ensure(Boolean(horse)&&canManage(state,command,horse),
  'SHIP_PERMISSION','Only the owner or AI may transport a registered horse');
 if(type==='SHIP_1999_HORSE'){
  const assessment=shippingAssessment(state,world,p.horse_id,p.destination_site_id,
   {targetRaceId:p.target_race_id||null});
  ensure(assessment.allowed,'SHIP_BLOCKED',assessment.reasons.join(','));
  const route=assessment.route,site=state.runtime.facilities.sites[p.destination_site_id];
  recordPayment(state,horse,site,route.cost_minor,'HORSE_OUTBOUND_SHIPPING_CHARGE','OUTBOUND',emit);
  state.runtime.racing.horse_travel[p.horse_id]={
   schema:HORSE_SHIPPING_SCHEMA,horse_id:p.horse_id,status:'OUTBOUND',
   home_site_id:horse.current_residence_id,origin_track_id:horse.host_track_id||null,
   destination_site_id:site.id,destination_track_id:site.host_track_id,
   departed_date:state.clock.date,arrival_date:plus(state.clock.date,route.days),
   estimated_days:route.days,route_band:route.band,
   source:'MODELED_1999_SHIPPING_NOT_HISTORICAL',
   target_race_id:p.target_race_id||null,
   outbound_cost_minor:route.cost_minor,return_cost_minor:0,
   history:[{date:state.clock.date,event:'SHIPPED_OUT',destination_site_id:site.id,
    cost_minor:route.cost_minor,route_band:route.band}]
  };
  emit('HORSE_SHIPPING_DEPARTED',{horse_id:p.horse_id,
   owner_id:horse.owner_organization_id,trainer_id:horse.trainer_id,
   home_site_id:horse.current_residence_id,destination_site_id:site.id,
   track_id:site.host_track_id,arrival_date:plus(state.clock.date,route.days),
   route_band:route.band,days:route.days,cost_minor:route.cost_minor,
   historical_result:false});
 }else if(type==='RETURN_1999_HORSE'){
  const trip=horseTravelStatus(state,p.horse_id);
  ensure(trip?.status==='AT_DESTINATION','SHIP_RETURN','Only arrived visitors can return home');
  const future=Object.values(state.runtime.entries||{}).some(e=>
   e.horse_id===p.horse_id&&['ENTERED','BOOKED'].includes(e.status)&&
   state.runtime.races[e.race_id]?.date>=state.clock.date);
  ensure(!future,'SHIP_RETURN','Do not abandon a future confirmed race');
  const origin=state.runtime.facilities.sites[trip.destination_site_id],
   home=state.runtime.facilities.sites[trip.home_site_id],route=modeledShippingRoute(origin,home);
  ensure(route.supported,'SHIP_RETURN','Return route geography must be known');
  recordPayment(state,horse,home,route.cost_minor,
   'HORSE_RETURN_SHIPPING_CHARGE','RETURNING',emit);
  trip.status='RETURNING';trip.departed_date=state.clock.date;
  trip.arrival_date=plus(state.clock.date,route.days);
  trip.return_cost_minor+=route.cost_minor;trip.estimated_days=route.days;
  trip.route_band=route.band;trip.target_race_id=null;
  trip.history.push({date:state.clock.date,event:'SHIPPED_HOME',
   destination_site_id:home.id,cost_minor:route.cost_minor,route_band:route.band});
  emit('HORSE_RETURN_DEPARTED',{horse_id:p.horse_id,return_site_id:home.id,
   arrival_date:trip.arrival_date,days:route.days,cost_minor:route.cost_minor,
   owner_id:horse.owner_organization_id});
 }else ensure(false,'SHIP_COMMAND','Unsupported horse shipping action');
}
/** Arrival happens on the real game clock, never on page render or a timer. */
export function advance1999HorseShipping({state,world,emit}){
 const trips=state.runtime.racing?.horse_travel||{},day=state.clock.date;
 for(const id of Object.keys(trips).sort()){
  const t=trips[id];
  if(!['OUTBOUND','RETURNING'].includes(t.status)||t.arrival_date>day)continue;
  const h=state.runtime.registered_horses.by_id[id],home=state.runtime.facilities.sites[t.home_site_id],
   away=state.runtime.facilities.sites[t.destination_site_id],
   site=t.status==='OUTBOUND'?away:home;
  const route=modeledShippingRoute(t.status==='OUTBOUND'?home:away,site);
  ensure(route.supported,'SHIP_GEOGRAPHY','Missing known hauling route');
  const r=state.runtime.horse[id],train=r.training;
  train.fatigue=four(train.fatigue+route.fatigue);
  train.stress=four(train.stress+route.stress);
  train.readiness=four(train.readiness-route.readiness);
  train.currentRisk=four(train.currentRisk+route.fatigue*.16);
  const outbound=t.status==='OUTBOUND';
  t.status=outbound?'AT_DESTINATION':'HOME';
  t.history.push({date:day,event:outbound?'ARRIVED_AT_TRACK':'RETURNED_HOME',
   site_id:site.id,readiness:train.readiness,fatigue:train.fatigue});
  if(t.history.length>18)t.history.splice(0,t.history.length-18);
  emit(outbound?'HORSE_SHIPPING_ARRIVED':'HORSE_SHIPPING_RETURNED',{
   horse_id:id,site_id:site.id,track_id:outbound?t.destination_track_id:h.host_track_id,
   date:day,readiness:train.readiness,fatigue:train.fatigue,
   welfare_effect:'MODELED_HAULING_STRESS_NOT_DIAGNOSIS'});
 }
}
export function validate1999HorseShipping(state,world){
 const trips=state.runtime.racing?.horse_travel;
 if(trips===undefined)return; // compatible with older saved careers
 ensure(isObject(trips),'SHIP_SAVE','Invalid horse travel registry');
 const reserved={};
 for(const [id,t] of Object.entries(trips)){
  const horse=state.runtime.registered_horses?.by_id?.[id],
   home=state.runtime.facilities?.sites?.[t.home_site_id],
   away=state.runtime.facilities?.sites?.[t.destination_site_id];
  ensure(horse&&t.schema===HORSE_SHIPPING_SCHEMA&&t.horse_id===id&&
   t.source==='MODELED_1999_SHIPPING_NOT_HISTORICAL'&&
   t.home_site_id===horse.current_residence_id&&home&&away&&
   worldIdentity(world,'tracks',t.destination_track_id)&&
   away.host_track_id===t.destination_track_id&&
   ['HOME','OUTBOUND','AT_DESTINATION','RETURNING'].includes(t.status)&&
   validDate(t.departed_date)&&t.departed_date<=state.clock.date&&
   validDate(t.arrival_date)&&
   Array.isArray(t.history)&&t.history.length<=18&&
   cents(t.outbound_cost_minor)&&cents(t.return_cost_minor),
   'SHIP_SAVE','Invalid physical horse route, identity, date, or costs');
  if(['OUTBOUND','AT_DESTINATION'].includes(t.status)){
   reserved[t.destination_site_id]=(reserved[t.destination_site_id]||0)+1;
  }
  if(t.status==='AT_DESTINATION')
   ensure(t.arrival_date<=state.clock.date,'SHIP_SAVE','Horse arrived in the future');
  if(t.status==='OUTBOUND'||t.status==='RETURNING')
   ensure(t.arrival_date>state.clock.date,'SHIP_SAVE','Overdue shipment not advanced');
 }
 for(const [siteId,n] of Object.entries(reserved)){
  const site=state.runtime.facilities.sites[siteId];
  const home=Object.values(state.runtime.registered_horses.by_id).
   filter(h=>h.current_residence_id===siteId).length;
  ensure(home+n<=site.stalls,'SHIP_SAVE','Overbooked host racing barn');
 }
}
