/**
 * WTW 1999 facility property-market adapter. Uses only the EXISTING generated
 * 1999 test-world farm nodes (F-TEST-FARM-*), with their original coordinates,
 * identities, and capacities. These are modeled opportunities, NOT claims of
 * authenticated historical property listings, prices, or ownership.
 *
 * A barn already operated by a trainer and a track-owned training center are
 * intentionally not silently put up for sale.
 */
import {ensure} from './contracts.js';
export const FACILITY_1999_MARKET_SCHEMA='WTW_FACILITY_MARKET_1999_V1';
const int=Number.isSafeInteger;
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export function make1999FacilityOffers(universe,{limit=12,startIndex=0}={}){
 ensure(universe&&universe.mode==='CANON_ANCHORED_TEST'&&int(universe.seed)&&
  typeof universe.facilityAt==='function'&&int(universe.counts?.trainers)&&
  int(universe.counts?.facilities),'FACILITY_1999_WORLD','Expected existing source-anchored 1999 test universe');
 ensure(int(limit)&&limit>=1&&limit<=24&&int(startIndex)&&startIndex>=0&&
  startIndex+limit<=900,'FACILITY_1999_RANGE','1999 farm opportunities must be a bounded unowned farm slice');
 const offers=[];
 for(let i=startIndex;i<startIndex+limit;i++){
  const origin=universe.facilityAt(universe.counts.trainers+i);
  ensure(origin?.id?.startsWith('F-TEST-FARM-')&&origin.type==='BREEDING_FARM'&&
   origin.source==='TEST_FARM'&&!origin.trainerId&&
   Number(origin.occupied)===0,'FACILITY_1999_UNAVAILABLE',
   'Cannot list a trainer occupied barn, historical site or assigned property');
  const l=origin.location;
  ensure(l&&typeof l.city==='string'&&typeof l.state==='string'&&
   typeof l.country==='string','FACILITY_1999_LOCATION','Source property locality missing');
  const stalls=clamp(Math.floor(Number(origin.capacity)),1,2000);
  const acres=clamp(Math.floor(Number(origin.landAcres)),0,5000);
  const annual=Math.max(30000,Number(origin.annualOperatingCost)||0);
  const quality=clamp(Math.round((Number(origin.equipmentCondition)||.5)*100),0,100);
  const required=clamp(Math.ceil(Number(origin.staffingRequirement)||stalls/25),1,250);
  const siteType=origin.facilityClass==='STUD_FARM'?'STUD_FARM':'FARM';
  // TEST pricing, denominated in integer minor units (cents).
  const price_minor=Math.round((annual*1.2+acres*3500+stalls*8500)*
   (.65+quality*.007)*100);
  const daily_upkeep_minor=Math.round(annual*.5*100/365);
  const maintenance_daily_minor=Math.round(annual*.15*100/365);
  const staff_wage_daily_minor=7000; // Modeled daily wage, not recorded 1999 payroll.
  const daily_boarding_minor=Math.round(
   (daily_upkeep_minor+maintenance_daily_minor+required*staff_wage_daily_minor)*1.25/stalls);
  const max_stalls=clamp(stalls+Math.floor(acres/25)*12,stalls,3000);
  const offer_id='FAC-OFFER-1999-'+origin.id;
  offers.push({offer_id,name:origin.name,type:siteType,mode:'PURCHASE',
   location:{city:l.city,state:l.state,country:l.country},
   price_minor,stalls,max_stalls,daily_upkeep_minor,daily_boarding_minor,
   maintenance_daily_minor,staff_required:required,staff_wage_daily_minor,
   land_acres:acres,opening_days:0,quality,
   source_kind:'SIMULATED_TEST',source_ref:
    'WTW_1999_'+universe.mode+':'+universe.seed+':'+origin.id,
   source_facility_id:origin.id,facility_class:origin.facilityClass||null});
 }
 return offers;
}
export function make1999FacilityMarketCommands(universe,options){
 const offers=make1999FacilityOffers(universe,options);
 return offers.map(offer=>({
  id:'facility1999:list:'+offer.source_facility_id,
  actor:'system',type:'FACILITY_LIST_PROPERTY',payload:offer
 }));
}
