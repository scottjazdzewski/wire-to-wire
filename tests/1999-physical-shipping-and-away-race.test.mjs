import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 gameRaceProgram,raceEligibility,shippingAssessment,modeledShippingRoute,
 horseTravelStatus,effectiveHorseTrack,receivingBarnCapacity} from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const directory=read('../public/data/wtw-1999-founding-directory-v1.json');
const trainer=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockey=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const manifest=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...directory.people,...trainer.trainers,...jockey.jockeys].
 map(x=>[x.id,x])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'SHIPPING-PROVENANCE-JAN-1999',
  source:'MODELED_TEST_ONLY_NO_HISTORICAL_SHIPPING',
  sha256:createHash('sha256').update('shipping-pilot-1999-v1').digest('hex')},
 entities:{horses:directory.horses,organizations:directory.organizations,
  tracks:directory.tracks,people}};
const fresh=()=>build1999PilotGameRun({world,manifest,jockeys:jockey.jockeys});
const run=(s,id,type,payload,actor='system')=>
 dispatchGameCommand({state:s,world,command:{id,type,payload,actor}}).state;
const day=s=>run(s,'shipping:day:'+s.clock.date,'ADVANCE_DAY',{});
const ship=(s,h,site,actor='system')=>run(s,'shipping:'+h.horse_id+':'+site,
 'SHIP_1999_HORSE',{horse_id:h.horse_id,destination_site_id:site},actor);
const getPlayer=s=>Object.values(s.runtime.registered_horses.by_id).
 find(h=>h.owner_organization_id===s.player.operation_id&&h.host_track_id==='T-0017');
const away='F-1999-AQ-VENN';
test('quotes come from known 1999 source geography, never fabricated exact road miles',()=>{
 const s=fresh(),gp=s.runtime.facilities.sites['F-1999-GP-HOLDEN'];
 const aq=s.runtime.facilities.sites[away],
  sa=s.runtime.facilities.sites['F-1999-SA-IVES'];
 const east=modeledShippingRoute(gp,aq);
 assert.equal(east.supported,true);
 assert.equal(east.band,'INTERREGIONAL');
 assert.equal(east.days,3);
 assert.ok(east.cost_minor>0);
 assert.equal('miles' in east,false);
 assert.equal(modeledShippingRoute(gp,sa).band,'CROSS_COUNTRY');
 assert.equal(modeledShippingRoute(aq,gp).cost_minor,east.cost_minor);
 assert.equal(modeledShippingRoute(gp,{location:{city:'Toronto',state:'Ontario',country:'Canada'}}).supported,false);
});
test('shipping is a financed physical trip, preserves permanent barn and cannot arrive before elapsed travel days',()=>{
 let s=fresh();const h=getPlayer(s);assert.ok(h);
 const original={...h},cash=s.runtime.finances.operation_balances_minor[h.owner_organization_id];
 const available=receivingBarnCapacity(s,away),quoted=shippingAssessment(s,world,h.horse_id,away);
 assert.ok(quoted.allowed,JSON.stringify(quoted.reasons));
 s=ship(s,h,away,'player');
 const trip=horseTravelStatus(s,h.horse_id);
 assert.equal(trip.status,'OUTBOUND');
 assert.equal(effectiveHorseTrack(s,h),null);
 assert.equal(trip.arrival_date,'1999-01-04');
 assert.equal(s.runtime.finances.operation_balances_minor[h.owner_organization_id],cash-quoted.route.cost_minor);
 assert.equal(s.runtime.registered_horses.by_id[h.horse_id].current_residence_id,original.current_residence_id);
 assert.equal(receivingBarnCapacity(s,away),available-1);
 assert.equal(s.runtime.finances.ledger.filter(x=>x.horse_id===h.horse_id&&
  ['HORSE_OUTBOUND_SHIPPING_CHARGE','MODELED_HORSE_CARRIER_RECEIPT'].includes(x.kind)).
  reduce((n,x)=>n+x.amount_minor,0),0);
 assert.throws(()=>run(s,'shipping:duplicate-attempt','SHIP_1999_HORSE',
  {horse_id:h.horse_id,destination_site_id:away},'player'),x=>x.code==='SHIP_BLOCKED');
 for(let i=0;i<2;i++)s=day(s);
 assert.equal(horseTravelStatus(s,h.horse_id).status,'OUTBOUND');
 s=day(s);
 assert.equal(s.clock.date,'1999-01-04');
 assert.equal(horseTravelStatus(s,h.horse_id).status,'AT_DESTINATION');
 assert.equal(effectiveHorseTrack(s,h),'T-0001');
 assert.ok(s.runtime.horse[h.horse_id].training.fatigue>=0);
 assert.equal(s.runtime.horse[h.horse_id].history.at(-1).facility_id,away,
  'Actual receiving site must provide daily care after arrival');
 const saved=exportGameSave(s,world);
 assert.deepEqual(importGameSave(saved,world),s);
});
test('race entry requires arriving two days early; impossible route, money and permissions are rejected',()=>{
 let s=fresh(),h=getPlayer(s);assert.ok(h);
 const spot=Object.values(s.runtime.registered_horses.by_id).
  find(x=>x.horse_id!==h.horse_id&&x.owner_organization_id!==s.player.operation_id&&
   x.host_track_id==='T-0017');
 assert.ok(spot);
 assert.throws(()=>ship(s,spot,away,'player'),x=>x.code==='SHIP_PERMISSION');
 let race=null;
 for(let d=7;d<20;d++){
  const date=new Date(Date.UTC(1999,0,d)).toISOString().slice(0,10);
  race=gameRaceProgram(s,world,'T-0001',date).
   find(r=>!r.stakeId&&r.conditions==='Maiden Special Weight'&&
    r.ageRequirement==='3YO+'&&r.sexRestriction==='OPEN');
  if(race)break;
 }
 assert.ok(race);
 s=run(s,'open:away:'+race.id,'OPEN_1999_RACE',
  {race_id:race.id,track_id:'T-0001',date:race.date});
 const r=s.runtime.races[race.id];
 assert.ok(raceEligibility(s,h,r).reasons.includes('NOT_PHYSICALLY_AT_TRACK_OR_CONFIRMED_TO_ARRIVE'));
 const poor=structuredClone(s);
 poor.runtime.finances.operation_balances_minor[h.owner_organization_id]=100;
 poor.runtime.finances.balance_minor=100;
 const assessed=shippingAssessment(poor,world,h.horse_id,away);
 assert.ok(assessed.reasons.includes('OWNER_CANNOT_FUND_HAUL_AND_CARE_RESERVE'));
 assert.throws(()=>ship(poor,h,away,'player'),x=>x.code==='SHIP_BLOCKED');
 const maybe=shippingAssessment(s,world,h.horse_id,away,{targetRaceId:race.id});
 assert.equal(maybe.allowed,true,JSON.stringify(maybe.reasons));
 s=run(s,'ship:withrace','SHIP_1999_HORSE',
  {horse_id:h.horse_id,destination_site_id:away,target_race_id:race.id},'player');
 assert.ok(raceEligibility(s,h,s.runtime.races[race.id]).eligible);
});
test('return transport charges owner again, restores actual home, keeps trip receipt and lets welfare recover',()=>{
 let s=fresh(),h=getPlayer(s);
 s=ship(s,h,away,'player');
 for(let i=0;i<3;i++)s=day(s);
 const before=s.runtime.finances.operation_balances_minor[h.owner_organization_id];
 s=run(s,'return:'+h.horse_id,'RETURN_1999_HORSE',{horse_id:h.horse_id},'player');
 assert.equal(horseTravelStatus(s,h.horse_id).status,'RETURNING');
 assert.equal(effectiveHorseTrack(s,h),null);
 assert.ok(s.runtime.finances.operation_balances_minor[h.owner_organization_id]<before);
 for(let i=0;i<3;i++)s=day(s);
 assert.equal(horseTravelStatus(s,h.horse_id).status,'HOME');
 assert.equal(effectiveHorseTrack(s,h),h.host_track_id);
 assert.equal(s.runtime.registered_horses.by_id[h.horse_id].racing_barn_id,h.racing_barn_id);
 assert.ok(horseTravelStatus(s,h.horse_id).history.some(x=>x.event==='RETURNED_HOME'));
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});

test('AI trainers review away opportunities after opening campaigns, with welfare, cash and race-travel custody',()=>{
 let s=fresh();
 for(let i=0;i<31;i++)s=day(s);
 const reviews=s.event_log.filter(e=>e.kind==='AI_TRAINER_SHIPPING_REVIEW');
 const departures=s.event_log.filter(e=>e.kind==='HORSE_SHIPPING_DEPARTED');
 const decisions=s.event_log.filter(e=>e.kind==='AI_TRAINER_AWAY_CAMPAIGN');
 assert.ok(reviews.length>=1,'Weekly away-race opportunity review must actually occur');
 assert.equal(departures.length,decisions.length);
 assert.ok(decisions.every(e=>e.details.owner_id!==s.player.operation_id),
  'No player horse ships automatically');
 assert.ok(decisions.every(e=>e.details.net_opportunity_minor>0&&
  e.details.return_haul_budget_minor>0));
 for(const e of decisions){
  const t=horseTravelStatus(s,e.details.horse_id);
  assert.ok(t);
  assert.ok(t.history.some(x=>x.event==='SHIPPED_OUT'));
  const horse=s.runtime.registered_horses.by_id[e.details.horse_id];
  assert.equal(t.home_site_id,horse.current_residence_id);
 }
 const shippingMoney=s.runtime.finances.ledger.filter(x=>
  ['HORSE_OUTBOUND_SHIPPING_CHARGE','HORSE_RETURN_SHIPPING_CHARGE',
   'MODELED_HORSE_CARRIER_RECEIPT'].includes(x.kind));
 assert.equal(shippingMoney.reduce((n,x)=>n+x.amount_minor,0),0);
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
 console.info('WTW_1999_AUTONOMOUS_SHIPPING_QA',JSON.stringify({
  day:s.clock.date,reviews:reviews.length,shipped:departures.length,
  away_targets:decisions.map(d=>d.details.target_race_id),
  returns:s.event_log.filter(e=>e.kind==='HORSE_SHIPPING_RETURNED').length
 }));
});
