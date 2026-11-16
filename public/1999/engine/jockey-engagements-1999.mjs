/**
 * Wire to Wire 1999 jockey engagements — one rider, multiple mounts per card.
 *
 * A jockey may book multiple different races at ONE track on the same date.
 * No race has duplicate riders, and same-day conflicting tracks are forbidden.
 * Travel is modeled for jockeys (air/ground), NOT horse shipping.
 * All prices are fictional 1999 game values, never factual quotes.
 */
export const JOCKEY_ENGAGEMENT_MODEL='WTW_1999_JOCKEY_ENGAGEMENT_V1';
const DAY=86400000;
const gap=(a,b)=>Math.round((Date.parse(b+'T12:00:00Z')-
 Date.parse(a+'T12:00:00Z'))/DAY);
const regions={
 NORTHEAST:'ME,NH,VT,MA,RI,CT,NY,NJ,PA',
 MIDATLANTIC:'DE,MD,DC,VA,WV,NC',
 SOUTHEAST:'SC,GA,FL,AL,MS,TN,KY',
 MIDWEST:'OH,MI,IN,IL,WI,MN,IA,MO',
 SOUTH_CENTRAL:'AR,LA,OK,TX,KS,NE,SD,ND',
 MOUNTAIN:'MT,WY,ID,UT,CO,NM,AZ,NV',
 PACIFIC:'CA,OR,WA'
};
const states=[
 'Alabama:AL','Alaska:AK','Arizona:AZ','Arkansas:AR','California:CA',
 'Colorado:CO','Connecticut:CT','Delaware:DE','Florida:FL','Georgia:GA',
 'Hawaii:HI','Idaho:ID','Illinois:IL','Indiana:IN','Iowa:IA','Kansas:KS',
 'Kentucky:KY','Louisiana:LA','Maine:ME','Maryland:MD','Massachusetts:MA',
 'Michigan:MI','Minnesota:MN','Mississippi:MS','Missouri:MO','Montana:MT',
 'Nebraska:NE','Nevada:NV','New Hampshire:NH','New Jersey:NJ',
 'New Mexico:NM','New York:NY','North Carolina:NC','North Dakota:ND',
 'Ohio:OH','Oklahoma:OK','Oregon:OR','Pennsylvania:PA','Rhode Island:RI',
 'South Carolina:SC','South Dakota:SD','Tennessee:TN','Texas:TX',
 'Utah:UT','Vermont:VT','Virginia:VA','Washington:WA',
 'West Virginia:WV','Wisconsin:WI','Wyoming:WY','District of Columbia:DC'
];
const stateCodes=Object.fromEntries(states.map(x=>x.split(':')));
const stateOf=t=>{
 // Older canonical world snapshots store venue location as
 // "City, State, Country"; the generated 300k industry stores an object.
 // Both must have the same geography in real jockey scheduling.
 const loc=t?.location;
 const value=typeof loc==='string'?
  loc.split(',').at(-2)?.trim():
  loc?.state??loc?.region??null;
 if(!value)return null;
 return stateCodes[value]||String(value).toUpperCase();
};
const groupOf=code=>Object.entries(regions).
 find(([,codes])=>codes.split(',').includes(code))?.[0]??null;
const countryOf=t=>{
 const loc=t?.location;
 const country=typeof loc==='string'?loc.split(',').at(-1)?.trim():
  loc?.country;
 return String(country||'USA').toUpperCase();
};
function seasonalRidingCircuit(a,b,date){
 const from=stateOf(a),to=stateOf(b),month=Number(date?.slice(5,7));
 if(!Number.isInteger(month))return false;
 // Winter Florida attracts NY/MD/KY circuit riders; summer NY attracts
 // winter-Florida riders. They still require booked travel and a clear diary.
 return (month>=1&&month<=4&&to==='FL'&&
    ['NY','NJ','PA','MD','DE','VA','KY'].includes(from))||
  (month>=5&&month<=10&&['NY','NJ'].includes(to)&&
    ['FL','KY','MD','VA'].includes(from));
}
/** Modeled time for one professional to change racing venues.
 * Returns 0 only for the same racecourse; 1 for nearby regional movement,
 * 2 for distant domestic air travel, 3 for international air travel.
 */
export function jockeyTransferDays(a,b){
 if(!a||!b)return null;
 if(a.id===b.id)return 0;
 const ca=countryOf(a),cb=countryOf(b);
 if(ca!==cb)return 3;
 if(ca!=='USA'&&ca!=='US')return 2;
 const sa=stateOf(a),sb=stateOf(b);
 if(!sa||!sb)return 2;
 if(['AK','HI','PR'].includes(sa)||['AK','HI','PR'].includes(sb))return 2;
 return sa===sb||groupOf(sa)&&groupOf(sa)===groupOf(sb)?1:2;
}
const tier=j=>['ELITE','ESTABLISHED','REGIONAL','DEVELOPING'].includes(j?.tier)?
 j.tier:'REGIONAL';
export function jockeyRaceImportance(race){
 const purse=Math.max(0,Number(race?.purse_minor??race?.purseMinor??0));
 const graded=String(race?.stakes_grade??race?.stakesGrade??'').toUpperCase();
 const stake=Boolean(race?.stake_id||race?.stakeId);
 return {purseMinor:purse,stakes:stake,graded,
  nationalFeature:stake&&(purse>=10000000||/\bG?I{1,3}\b|GRADE\s*[123]|G[123]/.test(graded)),
  significance:stake?3:purse>=10000000?2:
   race?.conditions==='Allowance'?1:0};
}
/** Pricing is per mount, even for riders who take 8+ mounts on one card.
 * A modeled travel allowance is paid once per track/date engagement.
 */
export function quoteJockeyMount(j,race,{additionalTravel=false}={}){
 const t=tier(j),importance=jockeyRaceImportance(race);
 const base={ELITE:20000,ESTABLISHED:13000,REGIONAL:8500,DEVELOPING:6000}[t];
 const classMult=importance.stakes?2.4:
  importance.significance===2?1.7:importance.significance===1?1.25:1;
 const pursePremium=Math.round(Math.max(0,importance.purseMinor-2000000)*
  (importance.stakes?.0014:.0003)*
  {ELITE:1.4,ESTABLISHED:1.1,REGIONAL:.8,DEVELOPING:.5}[t]);
 const mountMinor=Math.round(base*classMult)+Math.min(150000,pursePremium);
 const travelMinor=additionalTravel?
  importance.nationalFeature?48000:30000:0;
 return {mountMinor,travelMinor,feeMinor:mountMinor+travelMinor,
  tier:t,significance:importance.significance,
  nationalFeature:importance.nationalFeature,modeled:true};
}
/**
 * Pure read-only check of commitments. Existing bookings (including already
 * RESULTED rides) are the actual schedule. Reuses a rider on the same card,
 * never across tracks on the same date, and never teleports them between meets.
 */
export function assessJockeySchedule(state,world,j,race){
 const trips=[];
 if(!j||!race||!world)return {allowed:false,reason:'UNKNOWN_JOCKEY_OR_RACE'};
 const thisTrack=world.entities?.tracks?.find(t=>t.id===race.track_id);
 const home=world.entities?.tracks?.find(t=>t.id===j.home_track_id);
 if(!thisTrack||!home)return {allowed:false,reason:'UNKNOWN_RACECOURSE'};
 const previous=Object.values(state.runtime?.entries||{}).
  filter(e=>e.jockey_id===j.id&&
   ['BOOKED','RESULTED'].includes(e.status)).
  map(e=>state.runtime.races?.[e.race_id]).filter(Boolean);
 let sameCardCount=0;
 for(const reserved of previous){
  if(reserved.id===race.id)return {allowed:false,reason:'JOCKEY_DOUBLE_BOOK'};
  if(reserved.date===race.date){
   if(reserved.track_id!==race.track_id)
    return {allowed:false,reason:'JOCKEY_LOCATION'};
   sameCardCount++;continue;
  }
  const earlier=reserved.date<race.date?reserved:race;
  const later=reserved.date<race.date?race:reserved;
  const from=world.entities.tracks.find(t=>t.id===earlier.track_id);
  const to=world.entities.tracks.find(t=>t.id===later.track_id);
  const needed=jockeyTransferDays(from,to);
  if(needed===null)return {allowed:false,reason:'UNKNOWN_RACECOURSE'};
  if(gap(earlier.date,later.date)<needed)
   return {allowed:false,reason:'JOCKEY_INFEASIBLE_TRAVEL'};
  trips.push({from:earlier.track_id,to:later.track_id,days:needed});
 }
 const away=j.home_track_id!==race.track_id;
 const lead=gap(state.clock.date,race.date);
 if(lead<1)return {allowed:false,reason:'INSUFFICIENT_BOOKING_LEAD'};
 // A new away trip needs advance acceptance and commercial arrangements.
 if(away&&sameCardCount===0&&lead<4)
  return {allowed:false,reason:'INSUFFICIENT_TRAVEL_LEAD'};
 const importance=jockeyRaceImportance(race);
 const national=['ELITE','ESTABLISHED'].includes(tier(j));
 const homeTrip=jockeyTransferDays(home,thisTrack);
 const seasonal=seasonalRidingCircuit(home,thisTrack,race.date);
 // Regional jockeys routinely switch between nearby courses and winter
 // colonies, but do not fly coast-to-coast for an ordinary cheap mount.
 // Elite/established riders may negotiate national engagements.
 if(away&&sameCardCount===0&&!national&&!importance.nationalFeature&&
  importance.purseMinor<7500000&&homeTrip>1&&!seasonal)
  return {allowed:false,reason:'LOCAL_JOCKEY_DECLINES_LOW_VALUE_AWAY_TRIP'};
 return {allowed:true,reason:'AVAILABLE',away,
  sameCardCount,additionalTravel:away&&sameCardCount===0,
  homeTripDays:homeTrip,seasonalCircuit:seasonal,
  bookedDifferentRacesAtTrack:sameCardCount,
  tripChecks:trips.length,nationalSchedule:national,
  raceSignificance:importance.significance};
}
