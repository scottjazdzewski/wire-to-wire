/**
 * Read-only 1999 world rating projection.
 * Every displayed value comes from the EXACT saved fictional world entity;
 * racing CA/PA is computed by the same opening-game model used to register
 * a player horse. Other statuses use a labeled latent score, not a fake
 * active race registration or an added simulated horse.
 */
import {model1999StartingHorseAttributes}
 from '../1999/game/horse-starting-attributes.js';

export const OPENING_HORSE_RATING_KEYS=Object.freeze([
 'speed','stamina','acceleration','class','consistency','soundness',
 'temperament','surfaceDirt','surfaceTurf','breedingValue'
]);
const cap=x=>Math.max(1,Math.min(99,Math.round(x)));
const numeric=value=>typeof value==='number'&&Number.isFinite(value);
const label=key=>'rating'+key.charAt(0).toUpperCase()+key.slice(1);
const shown=ratings=>Object.fromEntries(Object.entries(ratings||{})
 .filter(([key,value])=>numeric(value)&&/^[A-Za-z][A-Za-z0-9]*$/.test(key))
 .map(([key,value])=>[label(key),value]));

export function project1999SavedHorseRatings(h,{seed=19990101}={}){
 const ratings=h?.ratings||{};
 const missing=OPENING_HORSE_RATING_KEYS.filter(key=>!numeric(ratings[key]));
 const coverage=OPENING_HORSE_RATING_KEYS.length-missing.length;
 const base={ratingCoverage:coverage+'/'+OPENING_HORSE_RATING_KEYS.length,
  ratingSource:h?.ratingsProvenance||'SOURCE_UNVERIFIED',
  ...shown(ratings)};
 if(missing.length)return {...base,ratingDataStatus:'MISSING: '+missing.join(', '),
  ca:null,pa:null,abilityMethod:'UNRATED_SOURCE'};
 const age=Number.isSafeInteger(h.foalYear)?1999-h.foalYear:null;
 const racing=(h.status==='RACING'||h.status==='TWO_YEAR_OLD_PROSPECT')&&
  Number.isSafeInteger(h.foalYear)&&h.foalYear>=1980&&
  h.foalYear<=1997&&['COLT','FILLY','HORSE','MARE','GELDING'].includes(h.sex);
 let gameplay=null;
 if(racing&&typeof h.id==='string'&&h.id.startsWith('H-FICTIONAL-1999-')){
  const id='H-GAME-1999-WORLD-'+h.id.replace(/^H-FICTIONAL-1999-/,'');
  gameplay=model1999StartingHorseAttributes({
   horse_id:id,seed,foaling_year:h.foalYear,sex:h.sex,
   horseRatings:ratings,development:h.development,
   ownerPortfolioTier:h.ownerPortfolioTier
  });
 }
 // Non-runners still have complete source ratings. The derived latent
 // athletic index is not a claimed in-training condition or race result.
 const latent=cap(.32*ratings.speed+.26*ratings.stamina+
  .18*ratings.acceleration+.24*ratings.class);
 const potential=numeric(h?.development?.potential)?
  cap(h.development.potential):null;
 const ca=gameplay?gameplay.current_ability:
  potential===null?latent:Math.min(latent,potential);
 const pa=gameplay?gameplay.potential_ability:potential;
 return {...base,ratingDataStatus:'COMPLETE',ca,pa,
  athleticIndex:latent,modeledPotential:potential,
  abilityMethod:gameplay?'EXACT_GAMEPLAY_STARTING_ATTRIBUTES':
   'MODELED_LATENT_NONRUNNER_NOT_RACE_READY',
  ageForRating:age};
}

export function project1999SavedEntityRatings(entity){
 const raw=entity?.ratings||{};
 const values=Object.values(raw).filter(numeric);
 const overall=values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):null;
 return {ratingCoverage:values.length,
  ratingDataStatus:values.length?'COMPLETE':'MISSING',
  ratingSource:entity?.ratingsProvenance||'SOURCE_UNVERIFIED',
  overallRating:overall,...shown(raw)};
}

export function audit1999SavedWorldRatings(world,{horseCount,personCount}={}){
 const horses=world?.entities?.horses||[],people=world?.entities?.people||[];
 const missingHorses=horses.filter(h=>OPENING_HORSE_RATING_KEYS.some(k=>
  !numeric(h?.ratings?.[k])));
 const missingPeople=people.filter(p=>!p?.ratings||
  !Object.values(p.ratings).some(numeric));
 return {horses:horses.length,people:people.length,
  ratedHorses:horses.length-missingHorses.length,
  ratedPeople:people.length-missingPeople.length,
  expectedHorses:horseCount??null,expectedPeople:personCount??null,
  missingHorseIds:missingHorses.slice(0,10).map(h=>h?.id),
  missingPersonIds:missingPeople.slice(0,10).map(p=>p?.id),
  valid:horses.length===horseCount&&people.length===personCount&&
   !missingHorses.length&&!missingPeople.length};
}
