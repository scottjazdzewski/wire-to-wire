/**
 * Name-market assignment for NEW, explicitly versioned 1999 industries.
 *
 * The real 1999 worker supplies its playable track directory and ordered
 * owner/farm slots. Unlike V10's sampled-market naming, these market IDs
 * refer to each organization's actual destination track. No saved names,
 * approved founding organizations, personnel IDs or horses are changed.
 */
export const DESTINATION_NAMING_MARKET_MODEL_1999=
 'WTW_1999_DESTINATION_TRACK_ORGANIZATION_NAMING_V12';

const countryCodes=Object.freeze({
 'USA':'US','US':'US','United States':'US',
 'Canada':'CA','CA':'CA',
 'Cuba':'CU','CU':'CU'
});

function locationMarket(track){
 if(!track||typeof track.id!=='string'||!/^T-[0-9]{4}$/.test(track.id)||
  !track.location||typeof track.location!=='object')
  throw Error('Destination naming requires an approved track and geographic location');
 const {city,region,country}=track.location;
 if([city,region,country].some(x=>typeof x!=='string'||!x.trim()))
  throw Error('Destination naming track has incomplete geography: '+track.id);
 const code=countryCodes[country];
 if(!code)throw Error('Destination naming has unrecognized country: '+country);
 return Object.freeze({id:'track-'+track.id.toLowerCase(),
  city,region,country,code,weight:1,breeding:true,racing:true});
}

/**
 * Returns exactly ordered market IDs for the owning and foaling facilities
 * that are materialized by the same game worker. The mapping is not a second
 * world/organization registry, and a market is only a geographic context.
 */
export function create1999DestinationNamingMarkets({
 tracks,ownerCountByTrack,farmsPerTrack=4
}={}){
 if(!Array.isArray(tracks)||!tracks.length||tracks.length>500||
  !Array.isArray(ownerCountByTrack)||ownerCountByTrack.length!==tracks.length||
  !Number.isInteger(farmsPerTrack)||farmsPerTrack<0||farmsPerTrack>30)
  throw Error('Invalid destination naming track/owner/farm plan');
 const ids=new Set();
 const markets=tracks.map(t=>{
  const market=locationMarket(t);
  if(ids.has(market.id))throw Error('Repeated destination naming track ID: '+t.id);
  ids.add(market.id);return market;
 });
 if(ownerCountByTrack.some(n=>!Number.isSafeInteger(n)||n<0||n>29000))
  throw Error('Invalid destination owner counts');
 const ownerMarketIds=Object.freeze(markets.flatMap((market,index)=>
  Array(ownerCountByTrack[index]).fill(market.id)));
 const farmMarketIds=Object.freeze(markets.flatMap(market=>
  Array(farmsPerTrack).fill(market.id)));
 if(ownerMarketIds.length>29000)
  throw Error('Destination owner census exceeds naming engine capacity');
 return Object.freeze({schema:DESTINATION_NAMING_MARKET_MODEL_1999,
  markets:Object.freeze(markets),
  ownerMarketIds,farmMarketIds});
}
