/**
 * WTW Facilities Operations V1. One game-run clock, one event journal, one
 * shared finance ledger. Runtime-developed sites never rewrite historical canon.
 * Market offers and prices are modeled game data, not asserted historical facts.
 */
import {ensure,isObject,requireString,validDate,nextDate,worldIdentity} from './contracts.js';
export const FACILITY_SCHEMA='WTW_FACILITY_OPERATIONS_V1';
export const FACILITY_TYPES=Object.freeze(['RACING_STABLE','FARM','STUD_FARM','BREAKING_FACILITY','TRAINING_CENTER']);
export const FACILITY_COMMANDS=Object.freeze(['FACILITY_SEED_FUNDS','FACILITY_LIST_PROPERTY','FACILITY_ACQUIRE','FACILITY_UPGRADE','FACILITY_BOARDING_CONTRACT','FACILITY_AI_CYCLE','FACILITY_SET_STAFFING','FACILITY_SET_MAINTENANCE','FACILITY_REGISTER_RACING_SITE']);
const IMPROVEMENTS=Object.freeze({
 STALL_BLOCK:{cost_minor:22000000,days:30,stalls:12,quality:0},
 CARE_SYSTEM:{cost_minor:8500000,days:14,stalls:0,quality:10},
 FOALING_WING:{cost_minor:28000000,days:45,stalls:6,quality:6,type:'STUD_FARM'}
});
const MAINTENANCE_MULTIPLIER=Object.freeze({ECONOMY:50,STANDARD:100,PREMIUM:180});
const integer=Number.isSafeInteger;
const operationalStalls=s=>s.staff_required>0?Math.floor(s.stalls*Math.min(s.staff_count,s.staff_required)/s.staff_required):s.stalls;
const number=(v,lo,hi,label)=>ensure(integer(v)&&v>=lo&&v<=hi,'FACILITY_INVALID','Invalid '+label);
const addDays=(d,n)=>{for(let i=0;i<n;i++)d=nextDate(d);return d;};
const organization=(world,id)=>{ensure(typeof id==='string'&&!!worldIdentity(world,'organizations',id),
 'FACILITY_OWNER','Facility owner must have a canonical organization ID');return id;};
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
export const createFacilityState=()=>({schema:FACILITY_SCHEMA,offers:{},sites:{},ai_month:{},last_day:null});
function ensureRoot(state){
 if(!state.runtime.facilities)state.runtime.facilities=createFacilityState();
 if(!state.runtime.finances.operation_balances_minor)state.runtime.finances.operation_balances_minor={};
 return state.runtime.facilities;
}
function funds(state,id){return state.runtime.finances.operation_balances_minor[id];}
function post(state,id,minor,kind,siteId,emit){
 const accounts=state.runtime.finances.operation_balances_minor;
 ensure(integer(accounts[id]),'FACILITY_NO_FUNDS','Owner financial baseline not established');
 ensure(integer(minor)&&integer(accounts[id]+minor),'FACILITY_MONEY','Invalid facility accounting value');
 accounts[id]+=minor;
 if(state.player.operation_id===id)state.runtime.finances.balance_minor=accounts[id];
 state.runtime.finances.ledger.push({date:state.clock.date,operation_id:id,
  site_id:siteId||null,amount_minor:minor,kind});
 if(emit)emit('FACILITY_CASH',{operation_id:id,site_id:siteId||null,
  kind,amount_minor:minor,balance_minor:accounts[id]});
}
function permit(state,command,id){
 if(command.actor==='player')ensure(id===state.player.operation_id&&
  ['owner','trainer','farm','breeder'].includes(state.player.role),
  'FACILITY_PERMISSION','Cannot develop property for another organization');
 else ensure(command.actor==='system','FACILITY_PERMISSION','Invalid property manager');
}
function acquire(state,world,p,command,emit){
 const f=ensureRoot(state),id=organization(world,p.operation_id),offer=f.offers[p.offer_id];
 permit(state,command,id);
 ensure(!!offer,'FACILITY_OFFER_MISSING','Property not listed');
 ensure(!offer.acquired_by,'FACILITY_TAKEN','Property already sold');
 const reserve=Math.max(offer.daily_upkeep_minor*30,Math.ceil(offer.price_minor/10));
 ensure(integer(funds(state,id))&&funds(state,id)>=offer.price_minor+reserve,
  'FACILITY_CASH_SHORT','Purchase and operating reserve must be funded');
 const siteId='F-RUN-'+offer.id;
 ensure(!f.sites[siteId],'FACILITY_TAKEN','Site already registered');
 post(state,id,-offer.price_minor,'FACILITY_PURCHASE',siteId,emit);
 offer.acquired_by=id;
 f.sites[siteId]={
  id:siteId,offer_id:offer.id,owner_id:id,name:offer.name,type:offer.type,
  location:{...offer.location},source_kind:offer.source_kind,
  status:offer.mode==='NEW_BUILD'&&offer.opening_days>0?'UNDER_CONSTRUCTION':'ACTIVE',
  acquired_date:state.clock.date,open_date:addDays(state.clock.date,offer.opening_days),
  stalls:offer.stalls,max_stalls:offer.max_stalls,quality:offer.quality,
  land_acres:offer.land_acres,daily_upkeep_minor:offer.daily_upkeep_minor,
  daily_boarding_minor:offer.daily_boarding_minor,upgrade:null,contracts:[],
  source_facility_id:offer.source_facility_id||null,
  staff_required:offer.staff_required??0,
  staff_count:offer.mode==='PURCHASE'?(offer.staff_required??0):0,
  staff_wage_daily_minor:offer.staff_wage_daily_minor??0,
  maintenance_daily_minor:offer.maintenance_daily_minor??0,
  maintenance_policy:'STANDARD'};
 emit('FACILITY_ACQUIRED',{site_id:siteId,owner_id:id,type:offer.type,
  mode:offer.mode,price_minor:offer.price_minor,opens:f.sites[siteId].open_date,
  source_kind:offer.source_kind});
}
/**
 * Admit a specific existing/on-track racing site without buying a fictional
 * property listing. No funds are created and no organization identity changes.
 * The game author supplies physical site evidence and modeled operating inputs.
 */
function registerRacingSite(state,world,p,command,emit){
 ensure(command.actor==='system','FACILITY_PERMISSION','Only the game registration service may register an existing site');
 const f=ensureRoot(state);
 requireString(p.site_id,'site_id',128);
 ensure(/^F-1999-[A-Za-z0-9-]+$/.test(p.site_id)&&!f.sites[p.site_id],
  'FACILITY_SITE','Unique permanent F-1999 site ID required');
 const org=organization(world,p.operator_organization_id);
 const owner=organization(world,p.facility_owner_organization_id);
 ensure(Number.isSafeInteger(funds(state,org)),'FACILITY_NO_FUNDS',
  'Register operational site only after its operator has an established finance account');
 ensure(p.site_type==='RACING_STABLE','FACILITY_TYPE','Racing sites use the existing RACING_STABLE class');
 ensure(['ORGANIZATION_HOME_SITE','TRACK_TRAINER_BARN'].includes(p.residence_kind),
  'FACILITY_RESIDENCE','Unknown racing residence kind');
 requireString(p.name,'name',160);
 ensure(isObject(p.location),'FACILITY_LOCATION','Physical locality required');
 for(const k of ['city','state','country'])requireString(p.location[k],k,100);
 let trackId=null;
 if(p.residence_kind==='TRACK_TRAINER_BARN'){
  requireString(p.host_track_id,'host_track_id',128);
  ensure(Boolean(worldIdentity(world,'tracks',p.host_track_id)),'FACILITY_TRACK','Track barn needs an approved T-ID');
  trackId=p.host_track_id;
  requireString(p.head_trainer_person_id,'head_trainer_person_id',128);
  ensure(Boolean(worldIdentity(world,'people',p.head_trainer_person_id)),'FACILITY_TRAINER','Track barn needs a selected trainer P-ID');
 }else{
  ensure(p.host_track_id==null,'FACILITY_TRACK','Home site must not claim track tenancy');
 }
 number(p.stalls_total,1,500,'stalls_total');
 number(p.staff_required,1,100,'staff_required');
 number(p.staff_present,0,500,'staff_present');
 number(p.quality,0,100,'quality');
 number(p.daily_upkeep_minor,0,100000000,'daily_upkeep_minor');
 number(p.daily_boarding_minor,0,10000000,'daily_boarding_minor');
 number(p.staff_wage_daily_minor,0,1000000,'staff_wage_daily_minor');
 number(p.track_rent_daily_minor??0,0,10000000,'track_rent_daily_minor');
 requireString(p.source_ref,'source_ref',200);
 ensure(p.source_kind==='MODELED_1999_GAME_SITE','FACILITY_SOURCE','Site parameters must be declared as modeled game facts');
 // Site economics are debited only when a real operator account has been
 // initialized; this command never silently invents an operating balance.
 f.sites[p.site_id]={
  id:p.site_id,offer_id:null,owner_id:owner,operator_organization_id:org,
  name:p.name,type:'RACING_STABLE',residence_kind:p.residence_kind,
  host_track_id:trackId,head_trainer_person_id:p.head_trainer_person_id??null,
  location:{city:p.location.city,state:p.location.state,country:p.location.country},
  source_kind:p.source_kind,source_ref:p.source_ref,
  status:p.staff_present>=p.staff_required?'ACTIVE':'UNDERSTAFFED',
  acquired_date:state.clock.date,open_date:state.clock.date,
  stalls:p.stalls_total,max_stalls:p.stalls_total,quality:p.quality,
  daily_upkeep_minor:p.daily_upkeep_minor,daily_boarding_minor:p.daily_boarding_minor,
  staff_required:p.staff_required,staff_count:p.staff_present,
  staff_wage_daily_minor:p.staff_wage_daily_minor,
  track_rent_daily_minor:p.track_rent_daily_minor??0,
  maintenance_daily_minor:0,maintenance_policy:'STANDARD',
  contracts:[],upgrade:null,land_acres:0
 };
 emit('RACING_SITE_REGISTERED',{site_id:p.site_id,owner_id:owner,
  operator_organization_id:org,residence_kind:p.residence_kind,
  host_track_id:trackId,stalls:p.stalls_total,source_kind:p.source_kind});
}
function improve(state,world,p,command,emit){
 const site=ensureRoot(state).sites[p.site_id],id=organization(world,p.operation_id);
 permit(state,command,id);
 ensure(site&&site.owner_id===id,'FACILITY_PROPERTY','Owner does not control this site');
 ensure(site.status==='ACTIVE'&&!site.upgrade,'FACILITY_BUSY','Facility is closed or improving');
 const work=IMPROVEMENTS[p.improvement];
 ensure(!!work&&(!work.type||work.type===site.type),'FACILITY_IMPROVEMENT','Invalid improvement for facility type');
 ensure(site.stalls+work.stalls<=site.max_stalls,'FACILITY_LAND_LIMIT','Development exceeds stall capacity of parcel');
 ensure(!work.quality||site.quality<100,'FACILITY_IMPROVEMENT','Facility quality already at maximum');
 ensure(integer(funds(state,id))&&funds(state,id)>=work.cost_minor+30*site.daily_upkeep_minor,
  'FACILITY_CASH_SHORT','Development needs funding and reserves');
 post(state,id,-work.cost_minor,'FACILITY_UPGRADE',site.id,emit);
 site.upgrade={kind:p.improvement,finishes:addDays(state.clock.date,work.days)};
 emit('FACILITY_UPGRADE_STARTED',{site_id:site.id,kind:p.improvement,
  cost_minor:work.cost_minor,finishes:site.upgrade.finishes});
}
function boarding(state,p,actor,emit){
 ensure(actor==='system','FACILITY_PERMISSION','Only verified simulated demand may book third-party stalls');
 const site=ensureRoot(state).sites[p.site_id];
 ensure(site&&site.status==='ACTIVE','FACILITY_PROPERTY','Site must be open to board horses');
 requireString(p.contract_id,'contract_id',100);
 ensure(/^FAC-CONTRACT-[A-Za-z0-9-]+$/.test(p.contract_id)&&
  !site.contracts.some(c=>c.id===p.contract_id),'FACILITY_CONTRACT','Invalid or duplicate contract');
 number(p.stalls,1,operationalStalls(site),'contract stalls');
 number(p.duration_days,1,365,'contract days');
 const start=p.start_date||state.clock.date;
 ensure(validDate(start)&&start>=state.clock.date&&start>=site.open_date,
  'FACILITY_DATE','Boarding contract cannot start in the past or before opening');
 const end=addDays(start,p.duration_days-1);
 for(let day=start;day<=end;day=nextDate(day)){
  const used=site.contracts.filter(c=>c.start<=day&&c.end>=day).reduce((sum,c)=>sum+c.stalls,0);
  ensure(used+p.stalls<=operationalStalls(site),'FACILITY_OVERBOOKED','Stalls already committed on '+day);
 }
 const price=p.daily_rate_minor??site.daily_boarding_minor;
 number(price,0,10000000,'boarding price');
 site.contracts.push({id:p.contract_id,stalls:p.stalls,start,end,rate_minor:price,
  source_kind:'MODELED_AGGREGATED_BOARDING_DEMAND'});
 emit('FACILITY_BOARDING_BOOKED',{site_id:site.id,contract_id:p.contract_id,
  stalls:p.stalls,start,end,rate_minor:price,
  note:'Aggregate business contract; no imaginary horse IDs or transfers'});
}
function setStaffing(state,world,p,command,emit){
 const site=ensureRoot(state).sites[p.site_id],id=organization(world,p.operation_id);
 permit(state,command,id);
 ensure(site&&site.owner_id===id,'FACILITY_PROPERTY','Not the owner of this property');
 number(p.staff_count,0,500,'staffing headcount');
 const capacity=site.staff_required>0?
  Math.floor(site.stalls*Math.min(p.staff_count,site.staff_required)/site.staff_required):
  site.stalls;
 for(const c of site.contracts){
  if(c.end<state.clock.date)continue;
  for(let day=c.start<state.clock.date?state.clock.date:c.start;day<=c.end;day=nextDate(day)){
   const reserved=site.contracts.filter(x=>x.start<=day&&x.end>=day)
    .reduce((sum,x)=>sum+x.stalls,0);
   ensure(reserved<=capacity,'FACILITY_STAFFING_CONTRACT','Staff reduction would break booked stall contracts');
  }
 }
 site.staff_count=p.staff_count;
 emit('FACILITY_STAFFING_UPDATED',{site_id:site.id,owner_id:id,
  staff_count:site.staff_count,required:site.staff_required,
  daily_payroll_minor:site.staff_count*site.staff_wage_daily_minor});
}
function setMaintenance(state,world,p,command,emit){
 const site=ensureRoot(state).sites[p.site_id],id=organization(world,p.operation_id);
 permit(state,command,id);
 ensure(site&&site.owner_id===id,'FACILITY_PROPERTY','Not the owner of this property');
 ensure(Object.hasOwn(MAINTENANCE_MULTIPLIER,p.policy),
  'FACILITY_MAINTENANCE_POLICY','Invalid maintenance program');
 site.maintenance_policy=p.policy;
 emit('FACILITY_MAINTENANCE_SET',{site_id:site.id,owner_id:id,policy:p.policy});
}
function aiCycle(state,world,emit){
 const f=ensureRoot(state),month=state.clock.date.slice(0,7);
 let acquisitions=0,improvements=0;
 for(const id of Object.keys(state.runtime.finances.operation_balances_minor).sort()){
  if(id===state.player.operation_id||f.ai_month[id]===month)continue;
  organization(world,id);f.ai_month[id]=month;
  const owned=Object.values(f.sites).filter(s=>s.owner_id===id);
  const possible=owned.length>=4?[]:Object.values(f.offers).filter(o=>!o.acquired_by&&
   funds(state,id)>=2*o.price_minor+90*o.daily_upkeep_minor);
  possible.sort((a,b)=>hash(state.rng.seed+month+id+a.id)-
   hash(state.rng.seed+month+id+b.id)||a.id.localeCompare(b.id));
  if(possible.length){
   acquire(state,world,{operation_id:id,offer_id:possible[0].id},
    {actor:'system'},emit);acquisitions++;continue;
  }
  // AI reinvests using the same property upgrade commands and cash limits.
  const candidates=owned.filter(s=>s.status==='ACTIVE'&&!s.upgrade)
   .sort((a,b)=>a.quality-b.quality||a.id.localeCompare(b.id));
  for(const s of candidates){
   const choice=s.quality<75?'CARE_SYSTEM':
    s.stalls+IMPROVEMENTS.STALL_BLOCK.stalls<=s.max_stalls?'STALL_BLOCK':null;
   if(!choice)continue;
   const work=IMPROVEMENTS[choice];
   if(funds(state,id)<work.cost_minor+90*s.daily_upkeep_minor)continue;
   improve(state,world,{operation_id:id,site_id:s.id,improvement:choice},
    {actor:'system'},emit);improvements++;break;
  }
 }
 if(acquisitions||improvements)emit('FACILITY_AI_INVESTMENT',{month,
  acquisitions,improvements,policy:'Same property and development rules as player'});
}
export function facilityAction({state,world,command,emit}){
 const f=ensureRoot(state),p=command.payload;
 if(command.type==='FACILITY_REGISTER_RACING_SITE')registerRacingSite(state,world,p,command,emit);
 else if(command.type==='FACILITY_SEED_FUNDS'){
  ensure(command.actor==='system','FACILITY_PERMISSION','Only approved input can seed funds');
  const id=organization(world,p.operation_id);
  number(p.balance_minor,0,1000000000000,'opening cash');
  requireString(p.source_ref,'source_ref',200);
  ensure(['SOURCE_RECORDED','SIMULATED_TEST'].includes(p.source_kind),
   'FACILITY_SOURCE','Funding source must be stated');
  ensure(!Object.hasOwn(state.runtime.finances.operation_balances_minor,id),
   'FACILITY_FUNDS_FIXED','Cannot reset established cash');
  state.runtime.finances.operation_balances_minor[id]=p.balance_minor;
  if(id===state.player.operation_id)state.runtime.finances.balance_minor=p.balance_minor;
  emit('FACILITY_FUNDS_ESTABLISHED',{operation_id:id,balance_minor:p.balance_minor,
   source_kind:p.source_kind,source_ref:p.source_ref});
 }else if(command.type==='FACILITY_LIST_PROPERTY'){
  ensure(command.actor==='system','FACILITY_PERMISSION','Only approved market may list a property');
  requireString(p.offer_id,'offer_id',100);
  ensure(/^FAC-OFFER-[A-Za-z0-9-]+$/.test(p.offer_id)&&
   !Object.hasOwn(f.offers,p.offer_id),'FACILITY_OFFER','Duplicate or invalid offer');
  requireString(p.name,'name',160);
  ensure(FACILITY_TYPES.includes(p.type),'FACILITY_TYPE','Invalid facility type');
  ensure(['PURCHASE','NEW_BUILD'].includes(p.mode),'FACILITY_MODE','Invalid property mode');
  ensure(isObject(p.location),'FACILITY_LOCATION','Property location required');
  for(const field of ['city','state','country'])requireString(p.location[field],field,100);
  number(p.price_minor,1,1000000000000,'purchase price');
  number(p.stalls,1,2000,'initial stalls');
  number(p.max_stalls,p.stalls,3000,'maximum stalls');
  number(p.daily_upkeep_minor,0,100000000,'daily operating cost');
  number(p.daily_boarding_minor,0,10000000,'daily board per stall');
  number(p.land_acres,0,5000,'acreage');
  number(p.opening_days,0,730,'construction days');
  number(p.quality,0,100,'initial quality');
  if(p.staff_required!==undefined)number(p.staff_required,0,250,'required staff');
  if(p.staff_wage_daily_minor!==undefined)number(p.staff_wage_daily_minor,0,1000000,'daily wage');
  if(p.maintenance_daily_minor!==undefined)number(p.maintenance_daily_minor,0,100000000,'maintenance provision');
  if(p.source_facility_id!==undefined){
   requireString(p.source_facility_id,'source_facility_id',128);
   ensure(!Object.values(f.offers).some(o=>o.source_facility_id===p.source_facility_id),
    'FACILITY_SOURCE_DUPLICATE','Facility cannot have two competing property offers');
  }
  requireString(p.source_ref,'market provenance',200);
  ensure(['SIMULATED_TEST','SOURCE_RECORDED'].includes(p.source_kind),
   'FACILITY_SOURCE','Source provenance is required');
  f.offers[p.offer_id]={
   id:p.offer_id,name:p.name,type:p.type,mode:p.mode,
   location:{city:p.location.city,state:p.location.state,country:p.location.country},
   price_minor:p.price_minor,stalls:p.stalls,max_stalls:p.max_stalls,
   daily_upkeep_minor:p.daily_upkeep_minor,daily_boarding_minor:p.daily_boarding_minor,
   land_acres:p.land_acres,opening_days:p.opening_days,quality:p.quality,
   source_kind:p.source_kind,source_ref:p.source_ref,
   source_facility_id:p.source_facility_id||null,
   staff_required:p.staff_required??0,
   staff_wage_daily_minor:p.staff_wage_daily_minor??0,
   maintenance_daily_minor:p.maintenance_daily_minor??0,
   acquired_by:null};
  emit('FACILITY_PROPERTY_LISTED',{offer_id:p.offer_id,type:p.type,mode:p.mode,
   source_kind:p.source_kind});
 }else if(command.type==='FACILITY_ACQUIRE')acquire(state,world,p,command,emit);
 else if(command.type==='FACILITY_UPGRADE')improve(state,world,p,command,emit);
 else if(command.type==='FACILITY_BOARDING_CONTRACT')boarding(state,p,command.actor,emit);
 else if(command.type==='FACILITY_AI_CYCLE'){
  ensure(command.actor==='system','FACILITY_PERMISSION','Only game AI executes rival cycle');
  aiCycle(state,world,emit);
 }else if(command.type==='FACILITY_SET_STAFFING')setStaffing(state,world,p,command,emit);
 else if(command.type==='FACILITY_SET_MAINTENANCE')setMaintenance(state,world,p,command,emit);
 else ensure(false,'FACILITY_COMMAND','Unknown facility command');
}
export function advanceFacilities({state,world,emit}){
 const f=ensureRoot(state),day=state.clock.date;
 if(f.last_day===day)return;
 ensure(!f.last_day||f.last_day<day,'FACILITY_DATE','Game clock cannot go backwards');
 f.last_day=day;
 let gross=0,expense=0;
 for(const site of Object.values(f.sites)){
  if(site.status==='UNDER_CONSTRUCTION'&&site.open_date<=day){
   site.status='ACTIVE';emit('FACILITY_OPENED',{site_id:site.id,owner_id:site.owner_id});
   if(site.owner_id!==state.player.operation_id&&site.staff_required>0&&
    funds(state,site.owner_id)>=90*site.daily_upkeep_minor+
      30*site.staff_required*site.staff_wage_daily_minor){
    setStaffing(state,world,{site_id:site.id,operation_id:site.owner_id,
     staff_count:site.staff_required},{actor:'system'},emit);
   }
  }
  if(site.upgrade&&site.upgrade.finishes<=day){
   const work=IMPROVEMENTS[site.upgrade.kind];
   site.stalls+=work.stalls;site.quality=Math.min(100,site.quality+work.quality);
   emit('FACILITY_UPGRADE_COMPLETED',{site_id:site.id,kind:site.upgrade.kind,
    stalls:site.stalls,quality:site.quality});
   site.upgrade=null;
  }
  if(site.status==='UNDERSTAFFED'&&site.staff_count>=site.staff_required){site.status='ACTIVE';emit('FACILITY_RESTAFFED',{site_id:site.id});}
  if(site.status==='ACTIVE'&&site.staff_required>site.staff_count)site.status='UNDERSTAFFED';
  if(site.status!=='ACTIVE')continue;
  // Worn buildings, thin staffing and maintenance policy change care quality.
  if(day.slice(8)==='01'){
   const wear=site.maintenance_policy==='ECONOMY'?-3:
    site.maintenance_policy==='PREMIUM'?1:-1;
   const shortage=site.staff_required>site.staff_count?2:0;
   site.quality=Math.max(0,Math.min(100,site.quality+wear-shortage));
  }
  const revenue=site.contracts.filter(c=>c.start<=day&&c.end>=day)
   .reduce((sum,c)=>sum+c.stalls*c.rate_minor,0);
  ensure(integer(revenue),'FACILITY_MONEY','Boarding revenue overflow');
  const cost=site.daily_upkeep_minor;
  const wages=(site.staff_count??0)*(site.staff_wage_daily_minor??0);
  const maintenance=Math.round((site.maintenance_daily_minor??0)*
   MAINTENANCE_MULTIPLIER[site.maintenance_policy||'STANDARD']/100);
  ensure(integer(wages)&&integer(maintenance),'FACILITY_MONEY','Operating expense overflow');
  gross+=revenue;expense+=cost+wages+maintenance;
  const account=site.operator_organization_id||site.owner_id;
  if(revenue)post(state,account,revenue,'FACILITY_BOARDING_REVENUE',site.id,null);
  if(cost)post(state,account,-cost,'FACILITY_DAILY_OPERATIONS',site.id,null);
  if(wages)post(state,account,-wages,'FACILITY_STAFF_PAYROLL',site.id,null);
  if(maintenance)post(state,account,-maintenance,'FACILITY_MAINTENANCE',site.id,null);
 }
 if(gross||expense)emit('FACILITY_OPERATING_DAY',{date:day,
  gross_minor:gross,cost_minor:expense,net_minor:gross-expense});
 if(day.slice(8)==='01')aiCycle(state,world,emit);
}
export function validateFacilityState(state,world){
 const f=state.runtime.facilities;
 if(f===undefined)return;
 ensure(isObject(f)&&f.schema===FACILITY_SCHEMA&&isObject(f.offers)&&
  isObject(f.sites)&&isObject(f.ai_month),'FACILITY_SCHEMA','Invalid facilities game state');
 ensure(f.last_day===null||validDate(f.last_day)&&f.last_day<=state.clock.date,
  'FACILITY_DATE','Invalid property clock');
 const balances=state.runtime.finances.operation_balances_minor||{};
 ensure(isObject(balances),'FACILITY_FINANCES','Invalid operation accounts');
 for(const [id,amount] of Object.entries(balances)){
  organization(world,id);ensure(integer(amount),'FACILITY_FINANCES','Invalid cash balance');
 }
 if(state.player.operation_id&&Object.hasOwn(balances,state.player.operation_id))
  ensure(state.runtime.finances.balance_minor===balances[state.player.operation_id],
   'FACILITY_FINANCES','Player cash is out of sync');
 for(const [id,offer] of Object.entries(f.offers)){
  ensure(offer.id===id&&/^FAC-OFFER-[A-Za-z0-9-]+$/.test(id)&&
   FACILITY_TYPES.includes(offer.type),'FACILITY_OFFER','Broken property listing');
 }
 for(const [id,site] of Object.entries(f.sites)){
  ensure(id===site.id&&(/^F-1999-[A-Za-z0-9-]+$/.test(id)?
   site.offer_id===null&&site.source_kind==='MODELED_1999_GAME_SITE'&&
   ['ORGANIZATION_HOME_SITE','TRACK_TRAINER_BARN'].includes(site.residence_kind):
   /^F-RUN-FAC-OFFER-[A-Za-z0-9-]+$/.test(id)&&
   f.offers[site.offer_id]&&f.offers[site.offer_id].acquired_by===site.owner_id),
   'FACILITY_SITE','Invalid property ownership linkage');
  organization(world,site.owner_id);
  if(site.residence_kind){
   organization(world,site.operator_organization_id);
   ensure(site.type==='RACING_STABLE'&&isObject(site.location),'FACILITY_SITE','Invalid racing site');
   if(site.residence_kind==='TRACK_TRAINER_BARN')ensure(Boolean(worldIdentity(world,'tracks',site.host_track_id))&&
    Boolean(worldIdentity(world,'people',site.head_trainer_person_id)), 'FACILITY_SITE','Invalid trainer-track link');
  }
  number(site.stalls,1,3000,'property stalls');
  number(site.max_stalls,site.stalls,3000,'property maximum stalls');
  number(site.quality,0,100,'quality');
  ensure(validDate(site.open_date)&&
   ['ACTIVE','UNDER_CONSTRUCTION','UNDERSTAFFED'].includes(site.status)&&
   Array.isArray(site.contracts),'FACILITY_SITE','Invalid property record');
  number(site.staff_required??0,0,250,'staff required');
  number(site.staff_count??0,0,500,'current staff');
  number(site.staff_wage_daily_minor??0,0,1000000,'staff wages');
  number(site.maintenance_daily_minor??0,0,100000000,'maintenance cost');
  ensure(site.maintenance_policy===undefined||
   Object.hasOwn(MAINTENANCE_MULTIPLIER,site.maintenance_policy),
   'FACILITY_MAINTENANCE_POLICY','Invalid saved maintenance plan');
  if(site.upgrade)ensure(IMPROVEMENTS[site.upgrade.kind]&&validDate(site.upgrade.finishes),
   'FACILITY_UPGRADE','Invalid ongoing development');
  for(const contract of site.contracts){
   number(contract.stalls,1,site.stalls,'contracted stalls');
   ensure(validDate(contract.start)&&validDate(contract.end)&&
    contract.end>=contract.start,'FACILITY_CONTRACT','Invalid contract dates');
  }
 }
}
export function facilityPortfolio(state,world,operationId){
 organization(world,operationId);
 const f=state.runtime.facilities||createFacilityState();
 const sites=Object.values(f.sites).filter(s=>s.owner_id===operationId).map(s=>({
  ...structuredClone(s),reserved_today:s.contracts.filter(c=>c.start<=state.clock.date&&
   c.end>=state.clock.date).reduce((n,c)=>n+c.stalls,0)
 }));
 return {operation_id:operationId,date:state.clock.date,sites,
  owned_sites:sites.length,business_types:[...new Set(sites.map(s=>s.type))],
  cash_minor:state.runtime.finances.operation_balances_minor?.[operationId]??null};
}
export const facilityMarket=state=>Object.values(
 state.runtime.facilities?.offers||{}).filter(o=>!o.acquired_by).map(o=>structuredClone(o));

/**
 * Facility-only cash and operating P&L. Purchases and renovations are capital
 * cash flows, not expenses in operating profit. Values are integer cents.
 * No fabricated sales, horse ownership, depreciation, or accrual entries.
 */
export function facilityFinancialReport(state,world,operationId,{from,to}={}){
 organization(world,operationId);
 const start=from||state.clock.date.slice(0,7)+'-01',end=to||state.clock.date;
 ensure(validDate(start)&&validDate(end)&&start<=end&&end<=state.clock.date,
  'FACILITY_REPORT_DATES','Report period must be within completed game days');
 const sites=state.runtime.facilities?.sites||{};
 const rows=state.runtime.finances.ledger.filter(e=>e.operation_id===operationId&&
  typeof e.site_id==='string'&&e.date>=start&&e.date<=end);
 const amounts={FACILITY_BOARDING_REVENUE:0,FACILITY_DAILY_OPERATIONS:0,
  FACILITY_STAFF_PAYROLL:0,FACILITY_MAINTENANCE:0,FACILITY_PURCHASE:0,FACILITY_UPGRADE:0};
 const siteMap={};
 for(const e of rows){
  ensure(integer(e.amount_minor)&&Object.hasOwn(amounts,e.kind),
   'FACILITY_REPORT_LEDGER','Invalid posted facility transaction');
  amounts[e.kind]+=e.amount_minor;
  if(!siteMap[e.site_id]){
   const site=sites[e.site_id];
   siteMap[e.site_id]={site_id:e.site_id,site_name:site?.name||e.site_id,
    type:site?.type||'UNKNOWN',revenue_minor:0,operating_cost_minor:0,
    capital_minor:0,net_operating_minor:0};
  }
  const s=siteMap[e.site_id];
  if(e.kind==='FACILITY_BOARDING_REVENUE')s.revenue_minor+=e.amount_minor;
  else if(e.kind==='FACILITY_PURCHASE'||e.kind==='FACILITY_UPGRADE')
   s.capital_minor-=e.amount_minor;
  else s.operating_cost_minor-=e.amount_minor;
  s.net_operating_minor=s.revenue_minor-s.operating_cost_minor;
 }
 const revenue=amounts.FACILITY_BOARDING_REVENUE;
 const costs=-(amounts.FACILITY_DAILY_OPERATIONS+amounts.FACILITY_STAFF_PAYROLL+
  amounts.FACILITY_MAINTENANCE);
 const capex=-(amounts.FACILITY_PURCHASE+amounts.FACILITY_UPGRADE);
 return {operation_id:operationId,from:start,to:end,
  revenue_minor:revenue,operating_cost_minor:costs,
  operating_profit_minor:revenue-costs,
  capital_investment_minor:capex,net_cash_flow_minor:revenue-costs-capex,
  payroll_minor:-amounts.FACILITY_STAFF_PAYROLL,
  maintenance_minor:-amounts.FACILITY_MAINTENANCE,
  overhead_minor:-amounts.FACILITY_DAILY_OPERATIONS,
  cash_minor:state.runtime.finances.operation_balances_minor?.[operationId]??null,
  sites:Object.values(siteMap).sort((a,b)=>a.site_name.localeCompare(b.site_name))};
}
