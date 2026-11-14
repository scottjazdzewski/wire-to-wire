/**
 * Reproducible *fictional* 1999 opening attributes.
 * No canonical horse value or veterinary finding is inferred.
 * Same seed + immutable ID + year/sex => identical attributes in every run.
 */
import {ensure} from './contracts.js';
import {HORSE_STARTING_ATTRIBUTES_SCHEMA,validateHorseStartingAttributes} from './horse-registration.js';
const cap=(x,lo=0,hi=1)=>Math.min(hi,Math.max(lo,x));
const round=v=>Math.round(cap(v)*1000)/1000;
function draw(seed,horseId,channel){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const c of horseId+':'+channel){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;
 return (h>>>0)/4294967296;
}
export function model1999StartingHorseAttributes({horse_id,seed=19990101,foaling_year,sex}={}){
 ensure(typeof horse_id==='string'&&/^H-GAME-1999-[A-Za-z0-9-]+$/.test(horse_id),
  'HORSE_ATTRIBUTES','Permanent test horse ID required');
 ensure(Number.isSafeInteger(seed)&&seed>0&&seed<=4294967295,
  'HORSE_ATTRIBUTES','Positive 32-bit model seed required');
 ensure(Number.isInteger(foaling_year)&&foaling_year>=1980&&foaling_year<=1996,
  'HORSE_ATTRIBUTES','1999 racing-age birth year required');
 ensure(['COLT','FILLY','HORSE','MARE','GELDING'].includes(sex),
  'HORSE_ATTRIBUTES','Invalid racing sex');
 const r=key=>draw(seed,horse_id,key);
 const base=.31+.56*r('talent');
 const sprint=round(.26+.68*r('sprint'));
 const route=round(cap(.33+.62*r('route')-.14*Math.max(0,sprint-.65)));
 const dirt=round(.26+.70*r('dirt'));
 const turf=round(.26+.70*r('turf'));
 const potential=Math.min(99,Math.max(30,Math.round(43+53*r('ceiling'))));
 const age=1999-foaling_year;
 const current=Math.min(potential,Math.max(25,Math.round(
   potential*(age===3?.68+.16*r('development'):.79+.13*r('development')))));
 const rating={
  schema:HORSE_STARTING_ATTRIBUTES_SCHEMA,provenance:'MODELED_1999_GAMEPLAY_NOT_HISTORICAL',
  current_ability:current,potential_ability:potential,
  preferred_surface:Math.abs(dirt-turf)<.09?'DUAL':dirt>turf?'DIRT':'TURF',
  preferred_distance:sprint>route+.1?'SPRINT':route>sprint+.1?'ROUTE':'MIDDLE',
  raw_speed:round(base*.65+.35*r('speed')),stamina:round(base*.52+.48*r('stamina')),
  acceleration:round(base*.42+.58*r('burst')),early_pace:round(base*.45+.55*r('early')),
  finishing_kick:round(base*.45+.55*r('kick')),
  dirt_aptitude:dirt,turf_aptitude:turf,wet_track_aptitude:round(.22+.73*r('wet')),
  sprint_aptitude:sprint,route_aptitude:route,
  consistency:round(.33+.60*r('consistency')),
  gate_composure:round(.28+.65*r('gate')),
  temperament:round(.28+.66*r('temperament')),
  training_focus:round(.32+.62*r('focus')),
  fitness:round(.49+.31*r('fitness')),fatigue:round(.04+.19*r('fatigue')),
  confidence:round(.38+.48*r('confidence')),stress:round(.07+.19*r('stress')),
  soundness_risk:round(.07+.29*r('injury'))
 };
 return Object.freeze(validateHorseStartingAttributes(rating));
}
