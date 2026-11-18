import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TRACK_PROGRAM_1999,trackMeetOpen1999}
 from '../public/next/1999-track-program.mjs';
import {buildConditionBook1999}
 from '../public/next/1999-condition-book-engine.mjs';
import {assessJockeySchedule,quoteJockeyMount,jockeyTransferDays,
 jockeyRaceImportance,jockeyTierFromPerson}
 from '../public/1999/engine/jockey-engagements-1999.mjs';

const geo=JSON.parse(readFileSync(new URL(
 '../public/data/track-geography-v33.json',import.meta.url),'utf8'));
const loc=new Map(geo.tracks.map(t=>[t.id,t]));
const tracks=Object.values(TRACK_PROGRAM_1999).filter(t=>
 t.trackOperating==='OPEN_1999'&&t.playableIn1999===true).map(t=>{
 const p=loc.get(t.id);
 assert.ok(p,'missing venue '+t.id);
 return {id:t.id,location:{city:p.city_locality,
  state:p.state_province_region,country:p.country}};
});
const world={entities:{tracks}};
const track=(id)=>world.entities.tracks.find(t=>t.id===id);
const jockey=(i,home='T-0001',tier='REGIONAL')=>({
 id:'P-FICTIONAL-1999-JOCKEY-'+String(i).padStart(7,'0'),
 home_track_id:home,tier
});
const state=()=>({clock:{date:'1999-01-01'},runtime:{races:{},entries:{}}});
function commit(s,race,j,horseId){
 const verdict=assessJockeySchedule(s,world,j,race);
 assert.equal(verdict.allowed,true,JSON.stringify(verdict));
 const id=race.id+':'+horseId;
 s.runtime.races[race.id]=race;
 s.runtime.entries[id]={id,race_id:race.id,horse_id:horseId,
  jockey_id:j.id,status:'BOOKED'};
 return verdict;
}
test('approved elite source riders qualify for national bookings with NO fictional historical ability values',()=>{
 const source=JSON.parse(readFileSync(new URL(
  '../public/data/wtw-1999-jockey-pilot-v1.json',import.meta.url),'utf8'));
 assert.equal(source.jockeys.length,26);
 const elite=source.jockeys.filter(p=>p.eliteFirstPriority===true);
 assert.ok(elite.length>=4);
 assert.ok(elite.every(p=>p.performanceRatings===null));
 assert.ok(elite.every(p=>jockeyTierFromPerson(p)==='ELITE'));
 assert.equal(jockeyTierFromPerson({
  tier:'ESTABLISHED',eliteFirstPriority:true}),'ESTABLISHED',
  'Explicit persisted tier takes precedence over legacy elite-source flag');
 const rider=elite.find(p=>p.homeTrackId==='T-0039');
 assert.ok(rider,'Approved Woodbine-based Canadian elite visitor remains sourced');
 const j={id:rider.id,home_track_id:rider.homeTrackId,
  tier:jockeyTierFromPerson(rider)};
 const spring={id:'GAME-MODELED-INVITATION',track_id:'T-0001',
  date:'1999-01-20',purse_minor:50000000,stake_id:'WTW-FEATURE',stakes_grade:'G1'};
 const result=assessJockeySchedule(state(),world,j,spring);
 assert.equal(result.allowed,true,JSON.stringify(result));
 assert.equal(result.nationalSchedule,true);
});
test('107 true operating venues remain available for national jockey schedules',()=>{
 assert.equal(tracks.length,107);
 assert.equal(new Set(tracks.map(t=>t.id)).size,107);
 assert.ok(trackMeetOpen1999('T-0001','1999-01-03'));
});
test('one jockey can ride every race on a ten-race source card; ten jockeys can cover 100 mounts, not 100 distinct jockeys',()=>{
 const s=state(),id='T-0001',date='1999-01-03',p=TRACK_PROGRAM_1999[id];
 const races=buildConditionBook1999({track:p,trackIndex:0,date,seed:19990101,
  includeKnownStakes:false}).slice(0,10).map(r=>({
   id:r.id,track_id:id,date,purse_minor:r.purse*100,conditions:r.conditions,
   stake_id:r.stakeId??null
  }));
 assert.equal(races.length,10,'full-sized Aqueduct card should provide 10 source races');
 const riders=Array.from({length:10},(_,i)=>jockey(i+1));
 for(const race of races){
  for(let i=0;i<10;i++)commit(s,race,riders[i],'H-MODELED-ENTRY-'+race.id+'-'+i);
 }
 assert.equal(Object.keys(s.runtime.entries).length,100);
 assert.equal(new Set(Object.values(s.runtime.entries).map(e=>e.jockey_id)).size,10);
 for(const rider of riders){
  const booked=Object.values(s.runtime.entries).filter(e=>e.jockey_id===rider.id);
  assert.equal(booked.length,10);
  assert.equal(assessJockeySchedule(s,world,rider,races[0]).reason,'JOCKEY_DOUBLE_BOOK');
 }
 assert.deepEqual(assessJockeySchedule(JSON.parse(JSON.stringify(s)),world,riders[0],races[0]),
  assessJockeySchedule(s,world,riders[0],races[0]),
  'jockey commitments must survive JSON save/reopen');
});
test('archived string-based racecourses retain NY/FL regional and Canadian geography',()=>{
 const snap={entities:{tracks:[
  {id:'T-0001',location:'South Ozone Park, New York, USA'},
  {id:'T-0017',location:'Hallandale Beach, Florida, USA'},
  {id:'T-0028',location:'Arcadia, California, USA'},
  {id:'T-0039',location:'Toronto, Ontario, Canada'}
 ]}};
 const s=state(),winter=jockey(1,'T-0001','REGIONAL');
 const easy={id:'R-FL-WINTER',track_id:'T-0017',date:'1999-01-14',
  purse_minor:2000000,conditions:'Allowance'};
 assert.equal(jockeyTransferDays(snap.entities.tracks[0],snap.entities.tracks[1]),2);
 assert.equal(jockeyTransferDays(snap.entities.tracks[0],snap.entities.tracks[3]),3);
 const season=assessJockeySchedule(s,snap,winter,easy);
 assert.equal(season.allowed,true,JSON.stringify(season));
 assert.equal(season.seasonalCircuit,true);
 assert.equal(assessJockeySchedule(s,snap,winter,
  {...easy,id:'R-LOW-CA',track_id:'T-0028'}).reason,
  'LOCAL_JOCKEY_DECLINES_LOW_VALUE_AWAY_TRIP');
});
test('same-day different tracks and impossible next-day national flight are rejected',()=>{
 const s=state(),national=jockey(1,'T-0001','ELITE');
 const ny={id:'R-NY',track_id:'T-0001',date:'1999-01-10',
  purse_minor:16000000,conditions:'Allowance'};
 const ca={id:'R-CA',track_id:'T-0028',date:'1999-01-10',
  purse_minor:40000000,stake_id:'WTW-STAKE',stakes_grade:'G1'};
 const caNext={...ca,id:'R-CA-NEXT',date:'1999-01-11'};
 const caLater={...ca,id:'R-CA-LATER',date:'1999-01-12'};
 commit(s,ny,national,'H-NY');
 assert.equal(jockeyTransferDays(track('T-0001'),track('T-0028')),2);
 assert.equal(assessJockeySchedule(s,world,national,ca).reason,'JOCKEY_LOCATION');
 assert.equal(assessJockeySchedule(s,world,national,caNext).reason,
  'JOCKEY_INFEASIBLE_TRAVEL');
 assert.equal(assessJockeySchedule(s,world,national,caLater).allowed,true);
});
test('elite rider earns a larger premium for major stakes, with one air-travel allowance per visiting card',()=>{
 const s=state(),elite=jockey(1,'T-0001','ELITE');
 const major={id:'R-G1',track_id:'T-0028',date:'1999-01-15',
  purse_minor:50000000,stake_id:'WTW-MODELED-STAKES',stakes_grade:'G1'};
 const second={...major,id:'R-UNDERCARD',purse_minor:1800000,
  stake_id:null,stakes_grade:null,conditions:'Maiden Special Weight'};
 const oldLocal={...elite,tier:'DEVELOPING'};
 const eliteQuote=quoteJockeyMount(elite,major,{additionalTravel:true});
 const developing=quoteJockeyMount(oldLocal,major,{additionalTravel:true});
 const modest=quoteJockeyMount(elite,second);
 assert.ok(eliteQuote.mountMinor>developing.mountMinor);
 assert.ok(eliteQuote.feeMinor>modest.feeMinor);
 assert.equal(jockeyRaceImportance(major).nationalFeature,true);
 const first=commit(s,major,elite,'H-FEATURE');
 assert.equal(first.additionalTravel,true);
 const next=assessJockeySchedule(s,world,elite,second);
 assert.equal(next.allowed,true);
 assert.equal(next.additionalTravel,false);
 assert.equal(quoteJockeyMount(elite,second,{additionalTravel:next.additionalTravel}).travelMinor,0);
});
test('visiting jockey is charged for one continuous meeting trip, not every race day, with real save continuity',()=>{
 const s=state(),rider=jockey(51,'T-0001','ELITE');
 const visit={id:'R-CA-G1-OPEN',track_id:'T-0028',date:'1999-01-12',
  purse_minor:48000000,stake_id:'WTW-FEATURE',stakes_grade:'G1'};
 const during={id:'R-CA-THURSDAY',track_id:'T-0028',date:'1999-01-14',
  purse_minor:2800000,conditions:'Allowance'};
 const separate={id:'R-CA-TWO-WEEKS',track_id:'T-0028',date:'1999-01-25',
  purse_minor:48000000,stake_id:'WTW-FEATURE-2'};
 const first=commit(s,visit,rider,'H-ONE');
 assert.equal(first.additionalTravel,true);
 assert.ok(quoteJockeyMount(rider,visit,{additionalTravel:first.additionalTravel}).travelMinor>0);
 const continuation=assessJockeySchedule(s,world,rider,during);
 assert.equal(continuation.allowed,true,JSON.stringify(continuation));
 assert.equal(continuation.existingVisitingMeet,true);
 assert.equal(continuation.additionalTravel,false,'A real rider cannot collect the same visit travel twice');
 commit(s,during,rider,'H-TWO');
 assert.equal(quoteJockeyMount(rider,during,{
  additionalTravel:continuation.additionalTravel}).travelMinor,0);
 const anotherTrip=assessJockeySchedule(s,world,rider,separate);
 assert.equal(anotherTrip.additionalTravel,true,'A distinct later visiting meet needs a newly funded trip');
 const saved=JSON.parse(JSON.stringify(s));
 assert.deepEqual(assessJockeySchedule(saved,world,rider,separate),anotherTrip);
});
test('regional home jockey will not be teleported for an ordinary low-purse cross-country ride',()=>{
 const s=state(),local=jockey(2,'T-0001','REGIONAL');
 const far={id:'R-LOW',track_id:'T-0028',date:'1999-01-15',
  purse_minor:1500000,conditions:'Claiming'};
 assert.equal(assessJockeySchedule(s,world,local,far).reason,
  'LOCAL_JOCKEY_DECLINES_LOW_VALUE_AWAY_TRIP');
});
