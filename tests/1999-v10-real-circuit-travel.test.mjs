import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TRACK_PROGRAM_1999,trackMeetOpen1999,scheduledRaceDays1999}
 from '../public/next/1999-track-program.mjs';
import {buildConditionBook1999}
 from '../public/next/1999-condition-book-engine.mjs';
import {modeledShippingRoute}
 from '../src/game/shipping-1999.js';
import {assessJockeySchedule,jockeyTransferDays}
 from '../public/1999/engine/jockey-engagements-1999.mjs';

const geography=JSON.parse(readFileSync(new URL(
 '../public/data/track-geography-v33.json',import.meta.url),'utf8'));
const node=new Map(geography.tracks.map(t=>[t.id,t]));
const selected=['T-0001','T-0013','T-0017','T-0028','T-0053','T-0122'];
const venue=id=>{
 const record=node.get(id);
 assert.ok(record,'approved source geography required for '+id);
 assert.equal(TRACK_PROGRAM_1999[id]?.trackOperating,'OPEN_1999');
 return {id,location:{city:record.city_locality,
  state:record.state_province_region,country:record.country}};
};
const venues=Object.fromEntries(selected.map(id=>[id,venue(id)]));
const site=id=>({...venues[id],location:{...venues[id].location}});
const dplus=(date,days)=>
 new Date(Date.parse(date+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);
const race=(id,date)=>{
 const p=TRACK_PROGRAM_1999[id];
 const book=buildConditionBook1999({track:p,
  trackIndex:Number(id.slice(2))-1,date,seed:19990101,
  includeKnownStakes:false});
 assert.ok(book.length>0,'scheduled real 1999 card required '+id+' '+date);
 return {id:book[0].id,track_id:id,date,
  conditions:book[0].conditions,purse_minor:Math.round(book[0].purse*100)};
};
test('V10 domestic horse hauling quotes distinguish NY/KY/FL/CA and small-market geography',()=>{
 const route=(a,b)=>modeledShippingRoute(site(a),site(b));
 const nyKy=route('T-0001','T-0013');
 const kyFl=route('T-0013','T-0017');
 const flCa=route('T-0017','T-0028');
 const nyCa=route('T-0001','T-0028');
 const caIa=route('T-0028','T-0053');
 const kyNd=route('T-0013','T-0122');
 assert.deepEqual([nyKy.band,nyKy.days],['INTERREGIONAL',3]);
 assert.deepEqual([kyFl.band,kyFl.days],['REGIONAL',2]);
 assert.deepEqual([flCa.band,flCa.days],['CROSS_COUNTRY',5]);
 assert.deepEqual([nyCa.band,nyCa.days],['CROSS_COUNTRY',5]);
 assert.deepEqual([caIa.band,caIa.days],['INTERREGIONAL',3]);
 assert.deepEqual([kyNd.band,kyNd.days],['REGIONAL',2]);
 for(const [a,b] of [['T-0001','T-0013'],['T-0013','T-0017'],
  ['T-0017','T-0028'],['T-0028','T-0053'],['T-0013','T-0122']]){
  const out=route(a,b),back=route(b,a);
  assert.equal(out.cost_minor,back.cost_minor);
  assert.equal(out.days,back.days);
  assert.ok(out.cost_minor>0&&out.supported);
 }
});
test('V10 one professional cannot teleport between two actual same-day Florida/California meetings',()=>{
 let date=null;
 for(let i=0;i<110;i++){
  const d=dplus('1999-01-02',i);
  if(trackMeetOpen1999('T-0017',d)&&trackMeetOpen1999('T-0028',d)){
   date=d;break;
  }
 }
 assert.ok(date,'approved Florida and California meets must overlap during winter');
 const florida=race('T-0017',date),california=race('T-0028',date);
 const rider={id:'P-TEST-1999-ELITE-RIDER',home_track_id:'T-0013',tier:'ELITE'};
 const state={clock:{date:'1999-01-01'},runtime:{entries:{},races:{}}};
 assert.equal(jockeyTransferDays(venues['T-0013'],venues['T-0017']),1);
 assert.equal(jockeyTransferDays(venues['T-0017'],venues['T-0028']),2);
 assert.equal(assessJockeySchedule(state,{entities:{tracks:Object.values(venues)}},
  rider,florida).allowed,true);
 state.runtime.races[florida.id]=florida;
 state.runtime.entries['E-FIRST']={id:'E-FIRST',
  race_id:florida.id,jockey_id:rider.id,status:'BOOKED'};
 const blocked=assessJockeySchedule(state,
  {entities:{tracks:Object.values(venues)}},rider,california);
 assert.equal(blocked.allowed,false);
 assert.equal(blocked.reason,'JOCKEY_LOCATION');
});
test('V10 source racecourses never create future-year 1999-named cards or out-of-meet races',()=>{
 for(const id of selected){
  assert.ok(scheduledRaceDays1999(id)>0);
  assert.equal(trackMeetOpen1999(id,'2000-01-01'),false);
  assert.equal(trackMeetOpen1999(id,'1999-02-29'),false);
  assert.equal(trackMeetOpen1999(id,'1999-11-31'),false);
 }
 // Future-year schedules need their own approved seasonal rule set, not
 // fabricated 2000 races labelled with 1999 permanent result IDs.
});
