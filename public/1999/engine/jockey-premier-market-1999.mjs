/**
 * WTW 1999 modeled premier jockey marketplace, real signed ride economics.
 * A rival trainer may OFFER, not magically book. This pure policy does not
 * mutate a state, invent bids or infer future winners.
 */
export const JOCKEY_PREMIER_MARKET_SCHEMA='WTW_1999_PREMIER_JOCKEY_OFFERS_V1';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const between=(n,a,b)=>Math.min(b,Math.max(a,n));
export const premierMarketRace=(race,jockey)=>
 Boolean(race&&race.stake_id&&race.canonical===false&&
  Number.isSafeInteger(race.purse_minor)&&race.purse_minor>=10000000&&
  jockey?.tier==='ELITE');
/** Bounded up-front proposed signing premium; no debit occurs on an offer. */
export function premierBonusCap(quote){
 const mount=quote?.mountMinor;
 return Number.isSafeInteger(mount)&&mount>0?
  Math.min(250000,Math.max(30000,mount*3)):0;
}
/**
 * Competitive choice values the horse and genuine trainer history more than
 * money. A well-funded rival can improve their offer, but cannot buy 100%
 * guaranteed acceptance from a superior partner and better horse.
 */
export function scorePremierJockeyOffer({horse,jockey,race,partnership,quote,
 bonus_minor=0}={}){
 if(!horse?.starting_attributes||!jockey||!race||!partnership||
  !Number.isSafeInteger(bonus_minor)||bonus_minor<0||
  bonus_minor>premierBonusCap(quote))
  throw Error('Invalid eligible premier ride offer');
 const attrs=horse.starting_attributes;
 const ability=between((finite(attrs.current_ability)?attrs.current_ability:50)/100,0,1);
 const potential=between((finite(attrs.potential_ability)?attrs.potential_ability:50)/100,0,1);
 const aptitude=race.surface==='TURF'?attrs.turf_aptitude:attrs.dirt_aptitude;
 const raceFit=between(finite(aptitude)?aptitude:.5,0,1);
 const rider=between((jockey.skills?.judgment??.5)*.5+
  (jockey.skills?.horse_handling??.5)*.5,0,1);
 const standing=between(jockey.game_reputation??.5,0,1);
 const history=between((partnership.trainerBond??0)*.7+
  (partnership.ownerBond??0)*.3,0,1);
 const premium=bonus_minor/Math.max(1,premierBonusCap(quote));
 // Favor established winning connections, talented horses, and better pay.
 // All information is available pre-race; no hidden results or fixed RNG.
 const score=ability*.315+raceFit*.145+potential*.055+
  rider*.085+standing*.05+history*.205+premium*.145;
 return {score:Math.round(score*1000000)/1000000,
  horseQuality:Math.round((ability*.64+raceFit*.36)*1000)/1000,
  relationshipIndex:Math.round(history*1000)/1000,
  bonusMinor:bonus_minor,maximumBonusMinor:premierBonusCap(quote),
  source:'MODELED_PRE_RACE_HORSE_FIT_PARTNERSHIP_AND_OFFER_NOT_RESULTS'};
}
export function premierOfferId(raceId,horseId,jockeyId){
 if(![raceId,horseId,jockeyId].every(s=>typeof s==='string'&&
  /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(s)))
  throw Error('Permanent race, horse and jockey IDs required');
 return raceId+':'+horseId+':'+jockeyId;
}
