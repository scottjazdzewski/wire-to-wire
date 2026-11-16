import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TRACK_PROGRAM_1999,trackMeetOpen1999,scheduledRaceDays1999,
 trackPhysicalVenueId1999} from '../public/next/1999-track-program.mjs';
import {buildFictional1999RaceCalendar}
 from '../public/1999/engine/fictional-world-calendar-v1.mjs';
import {modeledShippingRoute} from '../public/1999/game/shipping-1999.js';
import {APPROVED_NEW_TRACK_IDS_1999,ARCHIVED_TRACK_IDS_1999}
 from '../public/next/approved-track-expansion-1999.mjs';

const geo=JSON.parse(readFileSync(new URL('../public/data/track-geography-v33.json',
 import.meta.url),'utf8'));
const active=Object.values(TRACK_PROGRAM_1999)
 .filter(t=>t.trackOperating==='OPEN_1999'&&t.playableIn1999===true);
const locations=new Map(geo.tracks.map(x=>[x.id,x]));
const site=t=>{
 const x=locations.get(t.id);
 assert.ok(x?.city_locality&&x?.state_province_region&&x?.country,
  'missing 1999 track travel node '+t.id);
 return {id:t.id,location:{city:x.city_locality,
  state:x.state_province_region,country:x.country}};
};
test('all 107 approved 1999 racing venues have geographic nodes and distinct active identities',()=>{
 assert.equal(active.length,107);
 assert.equal(new Set(active.map(x=>x.id)).size,107);
 assert.equal(Object.keys(TRACK_PROGRAM_1999).length,124);
 assert.equal(ARCHIVED_TRACK_IDS_1999.filter(id=>
  TRACK_PROGRAM_1999[id].playableIn1999).length,0);
 assert.deepEqual(APPROVED_NEW_TRACK_IDS_1999,
  ['T-0119','T-0120','T-0121','T-0122','T-0123','T-0124']);
 for(const track of active){
  site(track);
  assert.ok(track.meets.length>0,track.id+' no meet');
  assert.ok(track.surfaces.includes('Dirt')||track.surfaces.includes('Turf'),
   track.id+' no supported racing surface');
  assert.ok(scheduledRaceDays1999(track.id)>0,track.id+' no racing days');
 }
 assert.equal(trackPhysicalVenueId1999('T-0075'),'T-0032',
  'San Mateo County Fair shares Bay Meadows physical facility');
});
test('every 1999 calendar card across all tracks remains unopened and matches its actual modeled meet',()=>{
 const calendar=buildFictional1999RaceCalendar(active,{seed:19990101});
 assert.deepEqual(calendar.unprogrammedTrackIds,[]);
 assert.equal(calendar.summary.tracksWithCards,107);
 assert.ok(calendar.summary.scheduledRaces>50000);
 const dates=new Map(active.map(t=>[t.id,new Set()]));
 const cards=new Set(),races=new Set();
 let count=0;
 for(const c of calendar.cards){
  assert.ok(!cards.has(c.id),'duplicate card '+c.id);cards.add(c.id);
  assert.equal(trackMeetOpen1999(c.trackId,c.date),true,
   'out-of-meet card '+c.id);
  dates.get(c.trackId).add(c.date);
  assert.ok(c.races.length>0,c.id+' empty card');
  const p=TRACK_PROGRAM_1999[c.trackId];
  for(const [index,r] of c.races.entries()){
   count++;
   assert.ok(!races.has(r.id),'duplicate race '+r.id);races.add(r.id);
   assert.equal(r.raceNumber,index+1);
   assert.equal(r.status,'SCHEDULED');
   assert.deepEqual(r.fieldHorseIds,[]);
   assert.equal(r.winnerId,null);
   assert.ok(r.purse_minor>0&&Number.isSafeInteger(r.purse_minor));
   assert.ok(p.surfaces.includes(r.surface==='TURF'?'Turf':'Dirt'),
    r.id+' surface does not exist at '+c.trackId);
  }
 }
 assert.equal(count,calendar.summary.scheduledRaces);
 for(const track of active)
  assert.equal(dates.get(track.id).size,scheduledRaceDays1999(track.id),
   track.name+' missing or extra racing dates');
 const expected={ 'T-0119':78,'T-0120':56,'T-0121':44,
  'T-0122':30,'T-0123':30,'T-0124':63 };
 for(const [id,n] of Object.entries(expected))
  assert.equal(dates.get(id).size,n,'owner-approved expansion '+id);
});
test('all mainland US 1999 track-pair shipping quotes are symmetric with real modeled costs and durations',()=>{
 const usSites=active.map(site).filter(x=>x.location.country==='USA');
 const offshore=usSites.filter(x=>x.location.state==='Puerto Rico');
 const domestic=usSites.filter(x=>x.location.state!=='Puerto Rico');
 assert.ok(domestic.length>=95,'unexpectedly low continental circuit coverage');
 assert.equal(offshore.length,1,'El Comandante is an offshore Puerto Rico operation');
 for(const destination of offshore){
  for(const origin of [domestic[0],domestic.at(-1)]){
   assert.equal(modeledShippingRoute(origin,destination).supported,false,
    'do not invent a mainland road route to Puerto Rico');
   assert.equal(modeledShippingRoute(destination,origin).supported,false,
    'offshore return shipping requires a separate modeled air/sea carrier');
  }
 }
 let examined=0,crossCountry=0,regional=0;
 for(let i=0;i<domestic.length;i++){
  for(let j=i+1;j<domestic.length;j++){
   const from=domestic[i],to=domestic[j];
   const forward=modeledShippingRoute(from,to);
   const reverse=modeledShippingRoute(to,from);
   assert.equal(forward.supported,true,from.id+' to '+to.id);
   assert.equal(reverse.supported,true,to.id+' to '+from.id);
   assert.equal(forward.band,reverse.band);
   assert.equal(forward.days,reverse.days);
   assert.equal(forward.cost_minor,reverse.cost_minor);
   assert.ok(Number.isInteger(forward.days)&&forward.days>=1&&
    Number.isSafeInteger(forward.cost_minor)&&forward.cost_minor>0);
   assert.equal('miles' in forward,false,'model cannot fabricate exact road miles');
   examined++;
   if(forward.band==='CROSS_COUNTRY')crossCountry++;
   if(forward.band==='REGIONAL')regional++;
  }
 }
 assert.ok(examined>4000&&crossCountry>0&&regional>0);
 console.info('WTW_1999_ROUTE_MATRIX',JSON.stringify({
  mainlandPairs:examined,offshoreRequiringAirSeaCarrier:offshore.length,
  crossCountry,regional}));
});
test('cross-track schedules leave time for modeled physical shipping and two-day arrival buffer',()=>{
 const west=site(TRACK_PROGRAM_1999['T-0017']);
 const east=site(TRACK_PROGRAM_1999['T-0001']);
 const coast=modeledShippingRoute(west,east);
 assert.equal(coast.supported,true);
 const shippingDate='1999-01-01';
 const earliest=new Date(Date.parse(shippingDate+'T12:00:00Z')+
  (coast.days+2)*86400000).toISOString().slice(0,10);
 const valid=Array.from({length:365},(_,i)=>
  new Date(Date.UTC(1999,0,1+i)).toISOString().slice(0,10))
  .find(day=>day>=earliest&&trackMeetOpen1999(east.id,day));
 assert.ok(valid,'Aqueduct has no race date after transit + acclimation');
 const tooSoon=new Date(Date.parse(shippingDate+'T12:00:00Z')+
  (coast.days+1)*86400000).toISOString().slice(0,10);
 assert.ok(tooSoon<earliest,'pre-race two-day arrival interval must be enforced');
 const canada={location:{city:'Toronto',state:'Ontario',country:'Canada'}};
 assert.equal(modeledShippingRoute(east,canada).supported,false,
  'unsupported cross-border route must fail closed');
});
