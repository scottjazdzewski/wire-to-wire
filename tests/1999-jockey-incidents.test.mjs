import test from 'node:test';
import assert from 'node:assert/strict';
import {assessJockeySchedule}
 from '../public/1999/engine/jockey-engagements-1999.mjs';
import {modeled1999JockeyIncident,apply1999JockeyPostRaceConsequences}
 from '../public/1999/engine/jockey-incidents-1999.mjs';

const rider='P-1999-JOCKEY-REAL-ID',owner='O-1999-REAL-OWNER';
const world={entities:{tracks:[{id:'T-0017',
 location:{state:'Florida',country:'USA'}}]}};
const next=(date,n)=>new Date(Date.parse(date+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
function fixture(seed){
 const date='1999-05-29',raceId='R-1999-RESULTED-001';
 const jockey={id:rider,home_track_id:'T-0017',starts:19,wins:5,
  tier:'REGIONAL',skills:{judgment:.7,finish:.65,pace:.8,
   horse_handling:.75,composure:.75}};
 const future=(id,day,fee)=>({
  race:{id,date:next(date,day),track_id:'T-0017',status:'ENTRIES_OPEN'},
  entry:{id:id+':H-001',race_id:id,horse_id:'H-001',owner_id:owner,
   status:'BOOKED',jockey_id:rider,fee_minor:fee,mount_fee_minor:fee,
   premier_signing_bonus_minor:0,race_tactic:'LEAD'}
 });
 const mounts=[future('R-1999-FUTURE-ONE',2,12000),
  future('R-1999-FUTURE-TWO',6,14000),
  future('R-1999-FUTURE-LATER',80,15000)];
 const races=Object.fromEntries(mounts.map(m=>[m.race.id,m.race]));
 const entries=Object.fromEntries(mounts.map(m=>[m.entry.id,m.entry]));
 const state={clock:{date},rng:{seed},player:{operation_id:owner},
  runtime:{racing:{jockeys:{[rider]:jockey},
   jockey_finances_minor:{[rider]:41000},premier_offers:{}},
   races,entries,registered_horses:{by_id:{'H-001':{owner_organization_id:owner}}},
   finances:{balance_minor:100000,operation_balances_minor:{[owner]:100000},ledger:[]}}};
 return {state,jockey,results:[{jockey_id:rider,finish:1}],
  race:{id:raceId,date,status:'OFFICIAL_SIM_RESULT'}};
}
test('post-race injury or suspension cancels prepaid future mounts and refunds both ledgers',()=>{
 let seed=1;
 while(seed<100000&&!modeled1999JockeyIncident(seed,rider,'R-1999-RESULTED-001'))seed++;
 assert.ok(seed<100000,'incident seed found without mock production probabilities');
 const {state,race,results,jockey}=fixture(seed),events=[];
 jockey.starts=20;
 const incident=modeled1999JockeyIncident(seed,rider,race.id);
 const response=apply1999JockeyPostRaceConsequences({state,race,results,
  emit:(kind,details)=>events.push({kind,details})});
 assert.equal(response.incidents,1);
 assert.equal(response.refunded_mounts,2);
 assert.equal(jockey.availability.kind,incident.kind);
 assert.equal(state.runtime.entries['R-1999-FUTURE-ONE:H-001'].status,'ENTERED');
 assert.equal(state.runtime.entries['R-1999-FUTURE-ONE:H-001'].jockey_id,null);
 assert.equal(state.runtime.entries['R-1999-FUTURE-TWO:H-001'].status,'ENTERED');
 assert.equal(state.runtime.entries['R-1999-FUTURE-LATER:H-001'].status,'BOOKED');
 assert.equal(state.runtime.finances.operation_balances_minor[owner],126000);
 assert.equal(state.runtime.finances.balance_minor,126000);
 assert.equal(state.runtime.racing.jockey_finances_minor[rider],15000);
 assert.equal(state.runtime.finances.ledger.reduce((s,x)=>s+x.amount_minor,0),0);
 assert.equal(state.runtime.finances.ledger.length,4);
 assert.ok(events.some(x=>x.kind==='JOCKEY_POST_RACE_UNAVAILABLE'));
 assert.equal(jockey.skills.judgment,.702,'twenty completed rides develop real skill');
 const blocked={id:'R-1999-REPLACEMENT',date:next(state.clock.date,3),
  track_id:'T-0017'};
 assert.equal(assessJockeySchedule(state,world,jockey,blocked).allowed,false);
 const reloaded=JSON.parse(JSON.stringify(state));
 assert.deepEqual(reloaded,state);
 assert.equal(assessJockeySchedule(reloaded,world,
  reloaded.runtime.racing.jockeys[rider],blocked).allowed,false);
 const after={id:'R-1999-RECOVERED',date:next(state.clock.date,80),
  track_id:'T-0017'};
 assert.equal(assessJockeySchedule(reloaded,world,
  reloaded.runtime.racing.jockeys[rider],after).allowed,true);
});
test('settled same-day mounts remain untouched and riders without incidents stay available',()=>{
 const seed=19990101,{state,race,results,jockey}=fixture(seed);
 assert.equal(state.runtime.entries['R-1999-FUTURE-LATER:H-001'].status,'BOOKED');
 const future=modeled1999JockeyIncident(seed,rider,race.id);
 const response=apply1999JockeyPostRaceConsequences({state,race,results,emit:()=>{}});
 assert.equal(response.incidents,future?1:0);
 const noIncidentSeed=Array.from({length:500},(_,i)=>i+1).find(x=>
  !modeled1999JockeyIncident(x,rider,race.id));
 const fresh=fixture(noIncidentSeed), before=JSON.stringify(fresh.state.runtime.finances);
 const outcome=apply1999JockeyPostRaceConsequences({state:fresh.state,
  race:fresh.race,results:fresh.results,emit:()=>{}});
 assert.equal(outcome.incidents,0);
 assert.equal(JSON.stringify(fresh.state.runtime.finances),before);
 assert.equal(fresh.jockey.availability,undefined);
});
test('signed premier jockey contracts can be cancelled with full audit and replacement eligibility',()=>{
 let seed=1;while(seed<100000&&!modeled1999JockeyIncident(seed,rider,'R-1999-RESULTED-001'))seed++;
 const {state,race,results}=fixture(seed);
 state.runtime.racing.premier_offers.OFFER={
  id:'OFFER',status:'SIGNED',race_id:'R-1999-FUTURE-ONE',
  horse_id:'H-001',jockey_id:rider,final_fee_minor:12000};
 const events=[];
 apply1999JockeyPostRaceConsequences({state,race,results,
  emit:(kind,details)=>events.push({kind,details})});
 const offer=state.runtime.racing.premier_offers.OFFER;
 assert.equal(offer.status,'CANCELLED');
 assert.equal(offer.refunded_minor,12000);
 assert.equal(offer.reason,'SIGNED_RIDER_BECAME_UNAVAILABLE');
 assert.equal(state.runtime.entries['R-1999-FUTURE-ONE:H-001'].status,'ENTERED');
 assert.ok(events.some(e=>e.kind==='JOCKEY_PAID_MOUNT_CANCELLED_AND_REFUNDED'));
 assert.deepEqual(JSON.parse(JSON.stringify(state.runtime.racing.premier_offers)),
  state.runtime.racing.premier_offers);
});
