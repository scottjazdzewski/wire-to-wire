/**
 * WIRE TO WIRE — 90-day circuit integration gate.
 * Uses the isolated 38-horse pilot only. This does not change the world,
 * simulate extra horses, alter settlement rules or claim historical results.
 * Advances the canonical kernel from Jan 1 to Apr 1, 1999.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 physicalHorseSiteId,effectiveHorseTrack,horseTravelStatus}
 from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const founding=read('../public/data/wtw-1999-founding-directory-v1.json');
const trainers=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockeys=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const manifest=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...founding.people,...trainers.trainers,...jockeys.jockeys].
 map(p=>[p.id,p])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'WTW-90-DAY-CIRCUIT-ISOLATED-1999',
  source:'GAME_REGRESSION_NOT_REAL_RACE_RESULTS',
  sha256:createHash('sha256').update('wtw-window3-90-day-circuit-v1').digest('hex')},
 entities:{horses:founding.horses,organizations:founding.organizations,
  tracks:founding.tracks,people}};
const plus=(date,n)=>new Date(Date.parse(date+'T12:00:00Z')+
 n*86400000).toISOString().slice(0,10);
const fresh=()=>build1999PilotGameRun({world,manifest,jockeys:jockeys.jockeys,
 runId:'WTW-RUN-CIRCUIT-90-DAY-1999'});
const step=s=>dispatchGameCommand({state:s,world,command:{
 id:'window3:circuit:day:'+s.clock.date,type:'ADVANCE_DAY',
 actor:'system',payload:{}}}).state;
const isActive=e=>e.status!=='SCRATCHED'&&Boolean(e.jockey_id);
function checkLedger(state){
 const groups=new Map(),carrier=new Map();
 for(const l of state.runtime.finances.ledger){
  if(String(l.transaction_id||'').startsWith('CARE:')){
   if(!groups.has(l.transaction_id))groups.set(l.transaction_id,[]);
   groups.get(l.transaction_id).push(l);
  }
  if(['HORSE_OUTBOUND_SHIPPING_CHARGE','HORSE_RETURN_SHIPPING_CHARGE',
   'MODELED_HORSE_CARRIER_RECEIPT'].includes(l.kind)){
   const key=[l.date,l.horse_id,l.direction].join('|');
   if(!carrier.has(key))carrier.set(key,[]);
   carrier.get(key).push(l);
  }
 }
 for(const [id,rows] of groups){
  assert.equal(rows.reduce((n,l)=>n+l.amount_minor,0),0,
   'care counterparty imbalance: '+id);
  assert.equal(rows.filter(l=>l.kind==='HORSE_CARE_OWNER_PAYMENT').length,1,
   'duplicate owner care charge: '+id);
 }
 for(const [key,rows] of carrier){
  assert.equal(rows.length,2,'carrier must charge owner and record external receipt: '+key);
  assert.equal(rows.reduce((n,l)=>n+l.amount_minor,0),0,
   'unbalanced carrier charge: '+key);
 }
 return {careTransactions:groups.size,carrierTransactions:carrier.size};
}
function checkCustody(state,starting){
 const horses=state.runtime.registered_horses.by_id,
  travel=state.runtime.racing.horse_travel||{},
  sites=state.runtime.facilities.sites;
 assert.equal(Object.keys(horses).length,starting.size,'phantom or lost horse');
 const occupancy=new Map();
 for(const [id,h] of Object.entries(horses)){
  const first=starting.get(id);
  assert.ok(first,'unknown registered horse '+id);
  assert.equal(h.current_residence_id,first.home,'shipping rewrote permanent residence');
  assert.equal(h.racing_barn_id,first.barn,'shipping rewrote permanent barn');
  assert.ok(sites[first.home]&&sites[h.current_residence_id]);
  assert.ok(state.runtime.horse[id],'lost horse care record');
  const trip=horseTravelStatus(state,id);
  const site=physicalHorseSiteId(state,h),track=effectiveHorseTrack(state,h);
  if(trip?.status==='OUTBOUND'||trip?.status==='RETURNING'){
   assert.equal(site,null,'in-transit horse assigned to barn');
   assert.equal(track,null,'in-transit horse entered physical track');
   assert.ok(trip.arrival_date>state.clock.date,'overdue trip');
  }else if(trip?.status==='AT_DESTINATION'){
   assert.equal(site,trip.destination_site_id);
   assert.equal(track,trip.destination_track_id);
   assert.ok(trip.arrival_date<=state.clock.date,'arrived before departure duration');
   assert.ok(sites[site],'away host barn missing');
   assert.equal(sites[site].host_track_id,track);
  }else{
   assert.ok(!trip||trip.status==='HOME','unrecognized trip status');
   assert.equal(site,first.home);
   assert.equal(track,h.host_track_id??null);
  }
  if(site)occupancy.set(site,(occupancy.get(site)||0)+1);
 }
 // Visitors reserve stalls from departure through the day they return home.
 for(const t of Object.values(travel)){
  if(t.status==='OUTBOUND')
   occupancy.set(t.destination_site_id,(occupancy.get(t.destination_site_id)||0)+1);
 }
 for(const [siteId,n] of occupancy){
  const site=sites[siteId];
  assert.ok(n<=site.stalls,'oversold physical stalls at '+siteId+
   ' on '+state.clock.date+': '+n+' / '+site.stalls);
 }
 return Object.values(travel).filter(t=>t.status==='AT_DESTINATION').length;
}
function checkJockeyLocation(state){
 const assignments=new Map();
 for(const entry of Object.values(state.runtime.entries)){
  if(!isActive(entry))continue;
  const race=state.runtime.races[entry.race_id];
  assert.ok(race,'missing race of jockey booking');
  const key=entry.jockey_id+'|'+race.date,site=assignments.get(key);
  if(site)assert.equal(site,race.track_id,
   'same jockey booked at distant tracks on the same day: '+key);
  else assignments.set(key,race.track_id);
 }
}
test('90 real game days preserve physical custody, circuit bookings and reconciled finances through monthly save/reopen',()=>{
 let state=fresh();
 const starting=new Map(Object.values(state.runtime.registered_horses.by_id).
  map(h=>[h.horse_id,{home:h.current_residence_id,barn:h.racing_barn_id}]));
 assert.equal(starting.size,38);
 const player=state.player.operation_id;
 let maxVisitors=0,saves=0;
 for(let day=1;day<=90;day++){
  const previous=state.clock.date,expected=plus('1999-01-01',day);
  state=step(state);
  assert.equal(state.clock.date,expected);
  assert.equal(state.clock.days_elapsed,day);
  assert.equal(state.event_log.filter(e=>e.kind==='DAY_ADVANCED').length,day);
  maxVisitors=Math.max(maxVisitors,checkCustody(state,starting));
  checkJockeyLocation(state);
  assert.equal(state.runtime.finances.balance_minor,
   state.runtime.finances.operation_balances_minor[player],
   'player owner cash and canonical finances diverged '+expected);
  assert.ok(previous<state.clock.date);
  if(day%30===0){
   const accounting=checkLedger(state);
   assert.ok(accounting.careTransactions>0,'no funded daily horse care');
   const exported=exportGameSave(state,world);
   state=importGameSave(exported,world);
   assert.equal(state.clock.date,expected,'save/reopen shifted time');
   assert.equal(state.clock.days_elapsed,day);
   checkCustody(state,starting);
   saves++;
  }
 }
 assert.equal(state.clock.date,'1999-04-01');
 assert.equal(saves,3);
 const reviews=state.event_log.filter(e=>e.kind==='AI_TRAINER_SHIPPING_REVIEW');
 const away=state.event_log.filter(e=>e.kind==='HORSE_SHIPPING_DEPARTED');
 const returns=state.event_log.filter(e=>e.kind==='HORSE_SHIPPING_RETURNED');
 const resultRaces=Object.values(state.runtime.races).
  filter(r=>r.status==='OFFICIAL_SIM_RESULT');
 assert.ok(reviews.length>=3,'away circuit decisions were not evaluated across season');
 assert.ok(resultRaces.length>=3,'game failed to conduct seasonal race meetings');
 assert.ok(away.every(e=>e.details.owner_id!==player),
  'AI forcibly shipped player-owned horse');
 const accounting=checkLedger(state);
 assert.ok(accounting.carrierTransactions>=away.length,
  'missing carrier receipt for a departure');
 assert.deepEqual(importGameSave(exportGameSave(state,world),world),state);
 console.info('WTW_1999_90_DAY_CIRCUIT_PASS',JSON.stringify({
  date:state.clock.date,horses:starting.size,completedDays:90,
  saveReopens:saves,shippingReviews:reviews.length,
  outbound:away.length,returns:returns.length,maxVisitors,
  officialModeledRaces:resultRaces.length,...accounting}));
});
