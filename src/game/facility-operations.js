/**
 * WTW Facilities Operations V1. One game-run clock, one event journal, one
 * shared finance ledger. Runtime-developed sites never rewrite historical canon.
 * Market offers and prices are modeled game data, not asserted historical facts.
 */
import {ensure,isObject,requireString,validDate,nextDate,worldIdentity} from './contracts.js';
export const FACILITY_SCHEMA='WTW_FACILITY_OPERATIONS_V1';
export const FACILITY_TYPES=Object.freeze(['RACING_STABLE','FARM','STUD_FARM','BREAKING_FACILITY','TRAINING_CENTER']);
export const FACILITY_COMMANDS=Object.freeze(['FACILITY_SEED_FUNDS','FACILITY_LIST_PROPERTY','FACILITY_ACQUIRE','FACILITY_UPGRADE','FACILITY_BOARDING_CONTRACT','FACILITY_AI_CYCLE']);
const IMPROVEMENTS=Object.freeze({
 STALL_BLOCK:{cost_minor:22000000,days:30,stalls:12,quality:0},
 CARE_SYSTEM:{cost_minor:8500000,days:14,stalls:0,quality:10},
 FOALING_WING:{cost_minor:28000000,days:45,stalls:6,quality:6,type:'STUD_FARM'}
});
const integer=Number.isSafeInteger;
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
  daily_boarding_minor:offer.daily_boarding_minor,upgrade:null,contracts:[]};
 emit('FACILITY_ACQUIRED',{site_id:siteId,owner_id:id,type:offer.type,
  mode:offer.mode,price_minor:offer.price_minor,opens:f.sites[siteId].open_date,
  source_kind:offer.source_kind});
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
 number(p.stalls,1,site.stalls,'contract stalls');
 number(p.duration_days,1,365,'contract days');
 const start=p.start_date||state.clock.date;
 ensure(validDate(start)&&start>=state.clock.date&&start>=site.open_date,
  'FACILITY_DATE','Boarding contract cannot start in the past or before opening');
 const end=addDays(start,p.duration_days-1);
 for(let day=start;day<=end;day=nextDate(day)){
  const used=site.contracts.filter(c=>c.start<=day&&c.end>=day).reduce((sum,c)=>sum+c.stalls,0);
  ensure(used+p.stalls<=site.stalls,'FACILITY_OVERBOOKED','Stalls already committed on '+day);
 }
 const price=p.daily_rate_minor??site.daily_boarding_minor;
 number(price,0,10000000,'boarding price');
 site.contracts.push({id:p.contract_id,stalls:p.stalls,start,end,rate_minor:price,
  source_kind:'MODELED_AGGREGATED_BOARDING_DEMAND'});
 emit('FACILITY_BOARDING_BOOKED',{site_id:site.id,contract_id:p.contract_id,
  stalls:p.stalls,start,end,rate_minor:price,
  note:'Aggregate business contract; no imaginary horse IDs or transfers'});
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
 if(command.type==='FACILITY_SEED_FUNDS'){
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
  requireString(p.source_ref,'market provenance',200);
  ensure(['SIMULATED_TEST','SOURCE_RECORDED'].includes(p.source_kind),
   'FACILITY_SOURCE','Source provenance is required');
  f.offers[p.offer_id]={
   id:p.offer_id,name:p.name,type:p.type,mode:p.mode,
   location:{city:p.location.city,state:p.location.state,country:p.location.country},
   price_minor:p.price_minor,stalls:p.stalls,max_stalls:p.max_stalls,
   daily_upkeep_minor:p.daily_upkeep_minor,daily_boarding_minor:p.daily_boarding_minor,
   land_acres:p.land_acres,opening_days:p.opening_days,quality:p.quality,
   source_kind:p.source_kind,source_ref:p.source_ref,acquired_by:null};
  emit('FACILITY_PROPERTY_LISTED',{offer_id:p.offer_id,type:p.type,mode:p.mode,
   source_kind:p.source_kind});
 }else if(command.type==='FACILITY_ACQUIRE')acquire(state,world,p,command,emit);
 else if(command.type==='FACILITY_UPGRADE')improve(state,world,p,command,emit);
 else if(command.type==='FACILITY_BOARDING_CONTRACT')boarding(state,p,command.actor,emit);
 else if(command.type==='FACILITY_AI_CYCLE'){
  ensure(command.actor==='system','FACILITY_PERMISSION','Only game AI executes rival cycle');
  aiCycle(state,world,emit);
 }else ensure(false,'FACILITY_COMMAND','Unknown facility command');
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
  }
  if(site.upgrade&&site.upgrade.finishes<=day){
   const work=IMPROVEMENTS[site.upgrade.kind];
   site.stalls+=work.stalls;site.quality=Math.min(100,site.quality+work.quality);
   emit('FACILITY_UPGRADE_COMPLETED',{site_id:site.id,kind:site.upgrade.kind,
    stalls:site.stalls,quality:site.quality});
   site.upgrade=null;
  }
  if(site.status!=='ACTIVE')continue;
  if(day.slice(8)==='01')site.quality=Math.max(0,site.quality-1);
  const revenue=site.contracts.filter(c=>c.start<=day&&c.end>=day)
   .reduce((sum,c)=>sum+c.stalls*c.rate_minor,0);
  ensure(integer(revenue),'FACILITY_MONEY','Boarding revenue overflow');
  const cost=site.daily_upkeep_minor;
  gross+=revenue;expense+=cost;
  if(revenue)post(state,site.owner_id,revenue,'FACILITY_BOARDING_REVENUE',site.id,null);
  if(cost)post(state,site.owner_id,-cost,'FACILITY_DAILY_OPERATIONS',site.id,null);
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
  ensure(id===site.id&&/^F-RUN-FAC-OFFER-[A-Za-z0-9-]+$/.test(id)&&
   f.offers[site.offer_id]&&f.offers[site.offer_id].acquired_by===site.owner_id,
   'FACILITY_SITE','Invalid property ownership linkage');
  organization(world,site.owner_id);
  number(site.stalls,1,3000,'property stalls');
  number(site.max_stalls,site.stalls,3000,'property maximum stalls');
  number(site.quality,0,100,'quality');
  ensure(validDate(site.open_date)&&
   ['ACTIVE','UNDER_CONSTRUCTION'].includes(site.status)&&
   Array.isArray(site.contracts),'FACILITY_SITE','Invalid property record');
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
