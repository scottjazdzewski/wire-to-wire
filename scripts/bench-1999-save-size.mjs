/**
 * Repeatable local-first save-size benchmark:
 * npm run bench:saves
 * This is a benchmark of the proposed compact format, NOT a completed season
 * simulation. No giant horse catalog, paid cloud API, or user file is needed.
 */
import {performance} from 'node:perf_hooks';
import {encodeCareerSave,packCareerFile} from '../public/1999/engine/compact-career.mjs';
import {encodeRaceMonth,decodeRaceMonth} from '../public/1999/engine/compact-race-results.mjs';

const world={schema:'WTW_WORLD_PROFILE_V1',population:325000,seed:19990101,
 mode:'CANON_ANCHORED_TEST',generator:'WTW_1999_FULL_SCALE_TEST_V1'};
const initial={
 version:'WTW_1999_CLEAN_CAREER_V3',schema:'WTW_1999_CLEAN_CAREER_V3',date:'1999-01-01',
 worldAnchor:{schema:'WTW_1999_CLEAN_CAREER_V3',startDate:'1999-01-01',
  seed:world.seed,mode:world.mode,population:world.population,worldProfile:world},
 currentCase:'opening-stable',turn:0,horseState:{},ownerState:{},staffState:{},
 calendarState:{},finances:{},decisionLog:[],followUps:[]
};
const played=structuredClone(initial);
played.date='2000-01-01';played.turn=365;
for(let i=0;i<1000;i++)played.horseState['H-TEST-1999-'+String(i+1).padStart(6,'0')]={
 health:78+i%21,trainer:'T-TEST-'+i%130,fitness:42+i%30};
for(let i=0;i<1500;i++)played.decisionLog.push({
 id:'action-'+i,day:'1999-01-'+String(i%28+1).padStart(2,'0'),
 type:i%3?'TRAINING':'ENTRY',horseId:'H-TEST-1999-'+String(i%1000+1).padStart(6,'0')
});
const t0=performance.now();
const saved=await encodeCareerSave(played,initial,world);
const currentBytes=packCareerFile(saved).length;
const months=[],firstResult=[];
for(let month=1;month<=12;month++){
 const ym='1999-'+String(month).padStart(2,'0');
 const data=Array.from({length:1000},(_,i)=>({
  id:'R-'+ym+'-'+String(i+1).padStart(4,'0'),
  date:ym+'-'+String(i%28+1).padStart(2,'0'),
  trackId:'T-'+i%130,
  surface:i%6===0?'TURF':'DIRT',distanceYards:1100+i%7*220,
  purseCents:2400000,conditionsId:'ALLOWANCE-'+i%5,
  starters:Array.from({length:10},(_,j)=>({
   horseId:'H-TEST-1999-'+String((i*13+j)%87500+1).padStart(6,'0'),
   trainerId:'T-TEST-'+(i+j)%300,jockeyId:'J-TEST-'+(i+j)%200,
   finish:j+1,earningsCents:j===0?1300000:j===1?500000:j===2?250000:0
  }))
 }));
 const packed=await encodeRaceMonth(ym,data);
 if(month===1){
  const restored=await decodeRaceMonth(packed);
  if(restored[4].id!==data[4].id||restored[4].starters.length!==10)
   throw Error('Race archive replay mismatch');
 }
 months.push({month:ym,races:packed.metadata.races,
  starters:packed.metadata.starters,compressedBytes:packed.metadata.bytes,
  rawBytes:packed.metadata.rawBytes,encoding:packed.metadata.encoding});
}
const total=months.reduce((a,m)=>a+m.compressedBytes,0);
console.log(JSON.stringify({
 result:'SYNTHETIC_FORMAT_BENCHMARK_NOT_SIMULATION_RESULTS',
 worldHorses:world.population,
 mutableCareer:{changedHorses:1000,decisions:1500,bytes:currentBytes,
  compression:saved.header.encoding},
 archiveSample:{races:12000,starters:120000,bytes:total,
  bytesPerRace:Math.round(total/12000)},
 approximate100kRaceYearBytes:Math.round(total/12000*100000),
 elapsedMs:Math.round(performance.now()-t0),
 warning:'Actual season data, optional full-detail stakes, metadata, backup overhead and browser quotas must be separately measured'
},null,2));
