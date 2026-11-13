/**
 * Fictional 1999 jockey-colony naming profile.
 * These are period-informed EDITORIAL weights, not observed 1999 census
 * measurements or nationality/ethnicity claims about real jockeys.
 *
 * A racing colony is the rider's operating circuit, not their birthplace.
 * In particular, Puerto Rico is a U.S. territory; PR here is a geographic
 * naming-pool code, never an assertion of immigration status.
 */
export const JOCKEY_COLONY_NAME_MODEL='WTW_1999_EDITORIAL_JOCKEY_COLONY_V1';
export const JOCKEY_COLONIES=Object.freeze([
 'NEW_YORK','SOUTH_FLORIDA','SOUTHERN_CALIFORNIA','KENTUCKY',
 'MID_ATLANTIC','LOUISIANA','ONTARIO','OTHER_US','OTHER_CANADA','OTHER_INTERNATIONAL'
]);
export const JOCKEY_LATIN_AMERICAN_CARIBBEAN_ORIGINS=Object.freeze([
 'PR','PA','VE','MX','CL','PE','CO','DO','AR','BR','UY'
]);
// The mix reflects the strong Latin American and Caribbean pipeline in
// 1990s North American racing, particularly NY / South FL / Southern CA.
// Percentages are modeling choices, NOT track-level historical observations.
const profile=(...pairs)=>Object.freeze(pairs.map(x=>Object.freeze(x)));
export const DEFAULT_JOCKEY_COLONY_ORIGIN_WEIGHTS=Object.freeze({
 NEW_YORK:profile(['US',37],['PR',15],['UY',1],['PA',10],['VE',9],['MX',9],['CO',5],['DO',4],['PE',2],['CL',2],['AR',2],['BR',1],['CA',2],['GB',1]),
 SOUTH_FLORIDA:profile(['US',30],['PR',15],['PA',13],['VE',11],['UY',1],['MX',8],['CO',5],['DO',6],['PE',2],['CL',2],['AR',2],['BR',2],['CA',2],['GB',1]),
 SOUTHERN_CALIFORNIA:profile(['US',35],['PR',9],['PA',11],['VE',7],['MX',16],['UY',1],['CO',4],['DO',4],['PE',3],['CL',3],['AR',2],['BR',1],['CA',2],['GB',2]),
 KENTUCKY:profile(['US',43],['PR',13],['PA',10],['VE',7],['UY',1],['MX',10],['CO',4],['DO',3],['PE',2],['CL',2],['AR',1],['BR',1],['CA',2],['GB',1]),
 MID_ATLANTIC:profile(['US',46],['PR',14],['PA',9],['VE',8],['MX',9],['CO',3],['DO',4],['PE',2],['CL',1],['AR',1],['CA',2],['GB',1]),
 LOUISIANA:profile(['US',51],['PR',10],['PA',7],['VE',6],['MX',14],['CO',3],['DO',3],['PE',2],['CL',1],['CA',2],['GB',1]),
 ONTARIO:profile(['CA',42],['US',22],['PR',9],['PA',5],['VE',4],['MX',7],['CO',4],['DO',2],['PE',1],['CL',1],['AR',1],['GB',2]),
 OTHER_US:profile(['US',49],['PR',11],['PA',8],['VE',7],['MX',11],['CO',4],['DO',3],['PE',2],['CL',1],['AR',1],['BR',1],['CA',1],['GB',1]),
 OTHER_CANADA:profile(['CA',48],['US',24],['PR',7],['PA',4],['VE',3],['MX',5],['CO',3],['DO',2],['PE',1],['CL',1],['AR',1],['GB',1]),
 OTHER_INTERNATIONAL:profile(['GB',46],['IE',23],['US',13],['CA',3],['PR',3],['PA',2],['VE',2],['MX',3],['AR',2],['BR',2],['UY',1])
});
function hash(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const char of String(key)){h^=char.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;return h>>>0;
}
export function inferJockeyColony(market){
 if(market.jockeyColony)return market.jockeyColony;
 const region=market.region.toLowerCase(),city=market.city.toLowerCase();
 if(market.code==='CA')return region.includes('ontario')?'ONTARIO':'OTHER_CANADA';
 if(region.includes('new york'))return 'NEW_YORK';
 if(region.includes('florida')){
  if(['hallandale beach','miami','aventura','hollywood','hialeah','pembroke pines'].includes(city))
   return 'SOUTH_FLORIDA';
  return 'OTHER_US';
 }
 if(region.includes('california')){
  if(['arcadia','del mar','inglewood','san diego','los angeles','santa anita'].includes(city))
   return 'SOUTHERN_CALIFORNIA';
  return 'OTHER_US';
 }
 if(region.includes('kentucky'))return 'KENTUCKY';
 if(['maryland','virginia','pennsylvania','new jersey','delaware','west virginia'].includes(region))
  return 'MID_ATLANTIC';
 if(region.includes('louisiana'))return 'LOUISIANA';
 return market.code==='US'?'OTHER_US':'OTHER_INTERNATIONAL';
}
export function chooseJockeyColonyOrigin(seed,index,colony,weights=DEFAULT_JOCKEY_COLONY_ORIGIN_WEIGHTS){
 const mix=weights[colony];
 if(!mix?.length)throw Error('Missing jockey-colony origin mix '+colony);
 const total=mix.reduce((n,x)=>n+x[1],0);
 let roll=hash(seed,'jockey-colony:'+index+':'+colony)%total;
 for(const [code,weight] of mix){roll-=weight;if(roll<0)return code}
 return mix.at(-1)[0];
}
