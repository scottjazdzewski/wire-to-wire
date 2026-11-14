import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dispatchGameCommand,exportGameSave,importGameSave,
 quote1999PlayerRacePlan,get1999HorseRaceOpportunities} from '../src/game/index.js';
import {createPlaytestCareer} from '../public/1999/game/playtest-service.mjs';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const fixture={
 directory:read('../public/data/wtw-1999-founding-directory-v1.json'),
 trainers:read('../public/data/wtw-1999-trainer-pilot-v1.json'),
 jockeys:read('../public/data/wtw-1999-jockey-pilot-v1.json'),
 cohort:read('../public/data/wtw-1999-playtest-cohort-38-v1.json')
};
async function started(){
 const engine=await createPlaytestCareer(fixture);
 engine.advanceDay(); // Jan 2: actual source-condition game racing cards opened.
 return {state:engine.state,world:engine.world,engine};
}
function opportunities(state,world,horse){
 return get1999HorseRaceOpportunities(state,world,horse.horse_id,{includeProposals:false}).rows;
}
function selection(state,world,away=false){
 for(const h of Object.values(state.runtime.registered_horses.by_id).filter(h=>
  h.owner_organization_id===state.player.operation_id)){
  for(const r of opportunities(state,world,h)){
   if(r.status!==(away?'SHIPPING_REQUIRED':'PLAYER_CAN_ENTER'))continue;
   const js=r.available_jockeys.filter(j=>j.owner_can_pay);
   const sites=away?r.receiving_barn_options.filter(s=>s.allowed):[null];
   for(const j of js)for(const site of sites){
    const payload={horse_id:h.horse_id,race_id:r.race_id,jockey_id:j.jockey_id,
     destination_site_id:site?.destination_site_id||null};
    const quote=quote1999PlayerRacePlan(state,world,payload);
    if(quote.can_confirm)return {horse:h,race:r,jockey:j,site,quote,payload};
   }
  }
 }
 return null;
}
function command(state,world,id,payload,actor='player'){
 return dispatchGameCommand({state,world,command:{
  id,type:'CONFIRM_1999_RACE_PLAN',actor,payload
 }});
}
test('a local player quote is read-only and a single authorized command books entry and jockey with exact funds',async()=>{
 const {state,world,engine}=await started();
 const candidate=selection(state,world,false);
 assert.ok(candidate,'A local, game-enterable owned horse/race/jockey combination must exist');
 const {quote,payload,race,horse,jockey}=candidate;
 const prior=structuredClone(state),balance=quote.owner_cash_minor;
 const repeated=quote1999PlayerRacePlan(state,world,payload);
 assert.deepEqual(repeated,quote);
 assert.deepEqual(state,prior,'Inspecting the cost cannot alter horses, entries, money or journal');
 assert.equal(quote.needs_shipping,false);
 assert.equal(quote.immediate_total_minor,jockey.fee_minor);
 const result=command(state,world,'player:race-plan:local',{...payload,
  expected_revision:quote.expected_revision,maximum_total_minor:quote.immediate_total_minor});
 assert.equal(result.duplicate,false);
 const posted=result.state,entry=posted.runtime.entries[race.race_id+':'+horse.horse_id];
 assert.equal(entry?.status,'BOOKED');
 assert.equal(entry.jockey_id,jockey.jockey_id);
 assert.equal(posted.runtime.finances.operation_balances_minor[horse.owner_organization_id],
  balance-quote.immediate_total_minor);
 assert.ok(posted.event_log.some(e=>e.kind==='PLAYER_RACE_PLAN_CONFIRMED'&&
  e.details.horse_id===horse.horse_id&&e.details.jockey_id===jockey.jockey_id));
 assert.deepEqual(importGameSave(exportGameSave(posted,world),world),posted);
 const dupe=command(posted,world,'player:race-plan:local',{...payload,
  expected_revision:quote.expected_revision,maximum_total_minor:quote.immediate_total_minor});
 assert.equal(dupe.duplicate,true);
 assert.deepEqual(dupe.state,posted);
 assert.equal(engine.getSave(),exportGameSave(state,world),
  'A parallel quote and command against a game copy must not touch the live saved service');
});
test('stale revision, under-authorized cost and wrong ownership reject without partial payment',async()=>{
 const {state,world}=await started();
 const c=selection(state,world,false);assert.ok(c);
 const base={...c.payload,expected_revision:c.quote.expected_revision,
  maximum_total_minor:c.quote.immediate_total_minor};
 for(const [id,p,expected] of [
  ['stale',{...base,expected_revision:base.expected_revision-1},'RACE_PLAN_STALE'],
  ['under',{...base,maximum_total_minor:Math.max(0,base.maximum_total_minor-1)},'RACE_PLAN_PRICE_CHANGED'],
  ['other',{...base,horse_id:Object.values(state.runtime.registered_horses.by_id).
   find(h=>h.owner_organization_id!==state.player.operation_id).horse_id},'RACE_PLAN_BLOCKED']
 ]){
  const old=structuredClone(state);
  assert.throws(()=>command(state,world,'player:race-plan:'+id,p),
   error=>error.code===expected,id+' must reject with exact game error');
  assert.deepEqual(state,old,id+' must not charge or record a failed booking');
 }
});
test('away confirmation approves valid shipping, race entry and jockey fee in ONE rollback-safe command',async()=>{
 const {state,world}=await started();
 const c=selection(state,world,true);
 assert.ok(c,'A source-conditioned away game race with funded receiving barn must exist');
 const {quote,payload,horse,race,jockey,site}=c;
 assert.equal(quote.needs_shipping,true);
 assert.equal(quote.immediate_total_minor,
  quote.outbound_shipping_minor+quote.jockey_booking_minor);
 assert.equal(quote.jockey_booking_minor,jockey.fee_minor);
 assert.ok(quote.outbound_shipping_minor>0&&site.allowed&&site.stalls_available>=1);
 const before=structuredClone(state);
 const actual=command(state,world,'player:race-plan:ship',{...payload,
  expected_revision:quote.expected_revision,maximum_total_minor:quote.immediate_total_minor}).state;
 assert.deepEqual(state,before,'Original state must not mutate during atomic action');
 const trip=actual.runtime.racing.horse_travel[horse.horse_id];
 assert.equal(trip.status,'OUTBOUND');
 assert.equal(trip.destination_site_id,site.destination_site_id);
 assert.equal(trip.target_race_id,race.race_id);
 const booked=actual.runtime.entries[race.race_id+':'+horse.horse_id];
 assert.equal(booked.status,'BOOKED');
 assert.equal(booked.jockey_id,jockey.jockey_id);
 assert.equal(actual.runtime.finances.operation_balances_minor[horse.owner_organization_id],
  quote.owner_cash_minor-quote.immediate_total_minor);
 assert.equal(actual.runtime.finances.ledger.filter(row=>
  row.horse_id===horse.horse_id&&row.kind==='HORSE_OUTBOUND_SHIPPING_CHARGE').length,1);
 assert.equal(actual.runtime.finances.ledger.filter(row=>
  row.horse_id===horse.horse_id&&row.kind==='JOCKEY_MOUNT_AND_TRAVEL_FEE').length,1);
 assert.equal(actual.runtime.finances.ledger.filter(row=>
  row.horse_id===horse.horse_id&&row.kind==='HORSE_RETURN_SHIPPING_CHARGE').length,0);
 assert.deepEqual(importGameSave(exportGameSave(actual,world),world),actual);
});
test('a mounted-but-invalid jockey cannot leave a horse shipped or entered on a failed confirmation',async()=>{
 const {state,world}=await started();
 const c=selection(state,world,true);assert.ok(c);
 const before=structuredClone(state);
 const p={...c.payload,jockey_id:'P-UNKNOWN',expected_revision:state.revision,maximum_total_minor:999999};
 const quote=quote1999PlayerRacePlan(state,world,p);
 assert.equal(quote.can_confirm,false);
 assert.ok(quote.blockers.some(b=>b.code==='UNKNOWN_JOCKEY'));
 assert.throws(()=>command(state,world,'player:race-plan:bad-jockey',p),
  error=>error.code==='RACE_PLAN_BLOCKED');
 assert.deepEqual(state,before);
});
test('the existing browser game service exposes the same quote, and a one-step save is replayable',async()=>{
 const engine=await createPlaytestCareer(fixture);
 engine.advanceDay();const c=selection(engine.state,engine.world,false);
 assert.ok(c);
 const before=engine.getSave();
 assert.deepEqual(engine.getRacePlanQuote(c.payload),c.quote);
 assert.equal(engine.getSave(),before,'Browser service quote must not change the save');
 engine.command('CONFIRM_1999_RACE_PLAN',{...c.payload,
  expected_revision:c.quote.expected_revision,maximum_total_minor:c.quote.immediate_total_minor},
  {actor:'player',id:'player:race-plan:browser'});
 const after=engine.getSave();
 assert.notEqual(after,before);
 const restored=await createPlaytestCareer({...fixture,save:after});
 assert.deepEqual(restored.view(),engine.view());
 assert.deepEqual(restored.getRacePlanQuote(c.payload).can_confirm,false);
});
