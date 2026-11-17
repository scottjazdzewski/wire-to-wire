import test from 'node:test';
import assert from 'node:assert/strict';
import {book1999UnavailableJockeyReplacements}
 from '../src/game/race-agents-1999.js';
import {createRacingRuntime}
 from '../src/game/racing-1999.js';

const T='T-0017',C='T-0028',O='O-AI-RACING-OWNER',P='O-PLAYER-OWNER';
const H='H-RACING-1999-001',R='R-1999-REPLACEMENT-001';
const J0='P-1999-INJURED',J1='P-1999-AVAILABLE',J2='P-1999-VISITING';
const world={entities:{tracks:[
 {id:T,location:{state:'Florida',country:'USA'}},
 {id:C,location:{state:'California',country:'USA'}}
],people:[]}};
const rider=(id,home)=>({id,home_track_id:home,
 tier:'REGIONAL',starts:12,wins:3,
 skills:{judgment:.9,horse_handling:.95,finish:.92,pace:.86,composure:.92},
 game_reputation:.72});
function fixture({playerHorse=false,date='1999-06-01',raceDate='1999-06-08'}={}){
 const rt=createRacingRuntime();
 rt.jockeys={[J0]:rider(J0,T),[J1]:rider(J1,T),[J2]:rider(J2,C)};
 rt.jockeys[J0].availability={kind:'INJURY',start_date:'1999-06-02',
  through_date:'1999-06-12',source_race_id:'R-ACTUAL-RESULT',
  reported_date:'1999-06-01'};
 rt.jockey_finances_minor={[J0]:0,[J1]:0,[J2]:0};
 const owner=playerHorse?P:O;
 const horse={horse_id:H,foaling_year:1996,sex:'COLT',
  trainer_id:'P-1999-TRAINER-01',owner_organization_id:owner,
  home_track_id:T,host_track_id:T,
  current_residence_id:'F-1999-LOCAL-BARN',
  starting_attributes:{current_ability:95,potential_ability:96,
   temperament:.9,dirt_aptitude:.9,turf_aptitude:.75,
   route_aptitude:.85,sprint_aptitude:.85,
   early_pace:.8,finishing_kick:.85,acceleration:.85,
   consistency:.85},career:{starts:2,wins:0,earnings_minor:0}};
 const race={id:R,date:raceDate,track_id:T,conditions:'Maiden Special Weight',
  age:'3YO+',sex:'OPEN',surface:'DIRT',distance_furlongs:8,
  purse_minor:7000000,field_capacity:10,status:'ENTRIES_OPEN',
  field:[R+':'+H],results:null};
 const entry={id:R+':'+H,race_id:R,horse_id:H,trainer_id:horse.trainer_id,
  owner_id:owner,status:'ENTERED',jockey_id:null,cancelled_jockey_id:J0,
  cancellation_reason:'JOCKEY_INJURY',refunded_minor:9000};
 const s={clock:{date,days_elapsed:151},rng:{seed:19990101},
  player:{operation_id:P,role:'owner'},
  runtime:{racing:rt,
   registered_horses:{by_id:{[H]:horse}},
   horse:{[H]:{policy:{feed:'HAY',care:'BALANCED',monthly_budget_minor:90000},
    finance:{spent_minor:0},history:[],
    training:{readiness:.98,fitness:.9,fatigue:.01,confidence:.85,
     stress:.1,currentRisk:.01,sorenessDays:0,speedCondition:.92,
     staminaCondition:.91}}},
   people:{},facilities:{sites:{'F-1999-LOCAL-BARN':{
    id:'F-1999-LOCAL-BARN',host_track_id:T,status:'ACTIVE',quality:.9}}},
   finances:{balance_minor:700000,
    operation_balances_minor:{[P]:700000,[O]:1000000},ledger:[]},
   races:{[R]:race},entries:{[entry.id]:entry}}};
 return s;
}
const execute=s=>{
 const events=[];
 const outcome=book1999UnavailableJockeyReplacements({state:s,world,
  emit:(kind,details)=>events.push({kind,details})});
 return {events,outcome};
};
test('AI signs and pays real replacement at correct track, no second refund or repeated booking',()=>{
 const s=fixture(),before=s.runtime.finances.operation_balances_minor[O];
 const {events,outcome}=execute(s);
 assert.equal(outcome.booked,1);
 assert.equal(outcome.unavailable,0);
 const e=s.runtime.entries[R+':'+H];
 assert.equal(e.status,'BOOKED');
 assert.equal(e.jockey_id,J1);
 assert.equal(e.cancelled_jockey_id,J0);
 assert.equal(s.runtime.racing.jockey_finances_minor[J0],0);
 assert.equal(s.runtime.racing.jockey_finances_minor[J1],e.fee_minor);
 assert.equal(s.runtime.finances.operation_balances_minor[O],
  before-e.fee_minor);
 assert.equal(s.runtime.finances.operation_balances_minor[P],700000);
 assert.ok(events.some(x=>x.kind==='AI_JOCKEY_REPLACEMENT_BOOKED'));
 const reopened=JSON.parse(JSON.stringify(s));
 assert.deepEqual(execute(reopened).outcome,
  {booked:0,player_decisions:0,unavailable:0});
 assert.deepEqual(reopened,s);
});
test('player owner is notified once and no unwanted replacement is signed',()=>{
 const s=fixture({playerHorse:true});
 assert.deepEqual(execute(s).outcome,
  {booked:0,player_decisions:1,unavailable:0});
 assert.deepEqual(execute(s).events,[]);
 assert.equal(s.runtime.entries[R+':'+H].status,'ENTERED');
 assert.equal(s.runtime.finances.ledger.length,0);
 assert.equal(s.runtime.finances.balance_minor,700000);
 assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
});
test('suspensions at destination and actual career dates block candidates until available',()=>{
 const s=fixture({raceDate:'1999-06-20'});
 s.runtime.racing.jockeys[J1].availability={kind:'SUSPENSION',
  start_date:'1999-06-01',through_date:'1999-06-18',
  reported_date:'1999-06-01',source_race_id:'R-1999-PRIOR'};
 // The only other rider is on the wrong coast and cannot travel for an ordinary maiden.
 const first=execute(s);
 assert.equal(first.outcome.booked,0);
 assert.equal(first.outcome.unavailable,1);
 s.clock.date='1999-06-19';
 const second=execute(s);
 assert.equal(second.outcome.booked,1);
 assert.equal(s.runtime.entries[R+':'+H].jockey_id,J1);
 assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
});
