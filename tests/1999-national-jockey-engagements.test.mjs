import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TRACK_PROGRAM_1999,trackMeetOpen1999}
 from '../public/next/1999-track-program.mjs';
import {buildConditionBook1999}
 from '../public/next/1999-condition-book-engine.mjs';
import {assessJockeySchedule,quoteJockeyMount,jockeyTransferDays,
 jockeyRaceImportance}
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
test('same-day different tracks and impossible next-day national flight are rejected',()=>{
 const s=state(),national=jockey(1,'T-0001','ELITE');
 const ny={id:'R-NY',track_id:'T-0001',date:'1999-01-10',
  purse_minor:16000000,conditions:'Allowance'};
 const ca={id:'R-CA',track_id:'T-0017',date:'1999-01-10',
  purse_minor:40000000,stake_id:'WTW-STAKE',stakes_grade:'G1'};
 const caNext={...ca,id:'R-CA-NEXT',date:'1999-01-11'};
 const caLater={...ca,id:'R-CA-LATER',date:'1999-01-12'};
 commit(s,ny,national,'H-NY');
 assert.equal(jockeyTransferDays(track('T-0001'),track('T-0017')),2);
 assert.equal(assessJockeySchedule(s,world,national,ca).reason,'JOCKEY_LOCATION');
 assert.equal(assessJockeySchedule(s,world,national,caNext).reason,
  'JOCKEY_INFEASIBLE_TRAVEL');
 assert.equal(assessJockeySchedule(s,world,national,caLater).allowed,true);
});
test('elite rider earns a larger premium for major stakes, with one air-travel allowance per visiting card',()=>{
 const s=state(),elite=jockey(1,'T-0001','ELITE');
 const major={id:'R-G1',track_id:'T-0017',date:'1999-01-15',
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
test('regional home jockey will not be teleported for an ordinary low-purse cross-country ride',()=>{
 const s=state(),local=jockey(2,'T-0001','REGIONAL');
 const far={id:'R-LOW',track_id:'T-0017',date:'1999-01-15',
  purse_minor:1500000,conditions:'Claiming'};
 assert.equal(assessJockeySchedule(s,world,local,far).reason,
  'LOCAL_JOCKEY_DECLINES_LOW_VALUE_AWAY_TRIP');
});
