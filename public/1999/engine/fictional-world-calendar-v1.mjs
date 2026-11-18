/**
 * Deterministic 1999 racing opportunities from the EXISTING condition-book
 * engine and local meet program. Never invents entries, winners or results.
 */
import {trackProgram1999,trackMeetOpen1999}
 from '../../next/1999-track-program.mjs';
import {buildConditionBook1999}
 from '../../next/1999-condition-book-engine.mjs';
export const FICTIONAL_1999_CALENDAR_SCHEMA='WTW_FICTIONAL_1999_RACE_OPPORTUNITIES_V1';
export function buildFictional1999RaceCalendar(tracks,{seed=19990101}={}){
 if(!Array.isArray(tracks)||!Number.isSafeInteger(seed)||seed<1)
  throw Error('Invalid 1999 racing calendar settings');
 const cards=[],unprogrammed=[];
 const start=Date.UTC(1999,0,1),day=86400000;
 for(const [trackIndex,track] of tracks.entries()){
  if(track.playableIn1999===false||track.trackOperating==='HISTORICAL_ONLY'||
   track.operating==='HISTORICAL_ONLY'||track.status==='HISTORICAL_ONLY')continue;
  const program=trackProgram1999(track.id);
  if(!program){unprogrammed.push(track.id);continue}
  for(let d=0;d<365;d++){
   const date=new Date(start+d*day).toISOString().slice(0,10);
   if(!trackMeetOpen1999(track.id,date))continue;
   const book=buildConditionBook1999({date,track,trackIndex,seed,
    sourceStakes:[],includeKnownStakes:false});
   if(!book.length)throw Error('Scheduled meet day has no condition book '+track.id+' '+date);
   const races=book.map(r=>({
    id:r.id,raceNumber:r.number,condition:r.conditions,
    age:r.ageRequirement,sex:r.sexRestriction,surface:r.surface,
    distance_furlongs:r.distanceFurlongs,fieldCapacity:r.fieldCapacity,
    purse_minor:Math.round(r.purse*100),
    status:'SCHEDULED',fieldHorseIds:[],winnerId:null
   }));
   cards.push({id:'CARD-'+track.id+'-'+date,trackId:track.id,date,
    basis:program.basis??'WTW_GAME_MODELED',races});
  }
 }
 cards.sort((a,b)=>a.date.localeCompare(b.date)||a.trackId.localeCompare(b.trackId));
 return {schema:FICTIONAL_1999_CALENDAR_SCHEMA,year:1999,cards,
  unprogrammedTrackIds:unprogrammed,
  summary:{raceDays:cards.length,
   scheduledRaces:cards.reduce((n,c)=>n+c.races.length,0),
   tracksWithCards:new Set(cards.map(c=>c.trackId)).size}};
}
