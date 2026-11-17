import test from 'node:test';
import assert from 'node:assert/strict';
import {
 JOCKEY_RETAINER_SCHEMA,quote1999JockeyRetainer,
 jockeyRetainerAction,advance1999JockeyRetainers,
 get1999JockeyRetainerPreference,validate1999JockeyRetainers
} from '../public/1999/engine/jockey-retainers-1999.mjs';
import {createRacingRuntime,jockeyBookingDecision}
 from '../src/game/racing-1999.js';
import {assessJockeySchedule}
 from '../public/1999/engine/jockey-engagements-1999.mjs';
import {propose1999AIRiderRetainers}
 from '../src/game/race-agents-1999.js';

const j='P-1999-RETAINER-JOCKEY',
 ownerA='O-1999-RETAINER-PLAYER',ownerB='O-1999-RETAINER-AI',
 trainerA='P-1999-TRAINER-A',trainerB='P-1999-TRAINER-B';
const t='T-0017',other='T-0028';
const world={entities:{
 organizations:[{id:ownerA},{id:ownerB}],
 people:[{id:j,role:'jockey'},{id:trainerA,role:'trainer'},
  {id:trainerB,role:'trainer'}],
 tracks:[{id:t,location:{state:'Florida',country:'USA'}},
  {id:other,location:{state:'California',country:'USA'}}]
}};
function fixture(){
 const rt=createRacingRuntime();
 rt.jockeys[j]={id:j,home_track_id:t,tier:'REGIONAL',starts:4,
  wins:1,skills:{judgment:.86,pace:.82,finish:.85,
   composure:.87,horse_handling:.9},game_reputation:.72};
 rt.jockey_finances_minor[j]=0;
 const h1='H-RETAINER-A',h2='H-RETAINER-B';
 const horses={
  [h1]:{horse_id:h1,trainer_id:trainerA,owner_organization_id:ownerA,
   current_residence_id:'F-FL-BARN',foaling_year:1996,sex:'COLT',
   home_track_id:t,host_track_id:t,
   starting_attributes:{temperament:.85,current_ability:90,
    potential_ability:93,dirt_aptitude:.9,turf_aptitude:.7,
    sprint_aptitude:.8,route_aptitude:.9},
   career:{starts:1,wins:0,earnings_minor:0}},
  [h2]:{horse_id:h2,trainer_id:trainerB,owner_organization_id:ownerB,
   current_residence_id:'F-FL-BARN',foaling_year:1996,sex:'COLT',
   home_track_id:t,host_track_id:t,
   starting_attributes:{temperament:.85,current_ability:90,
    potential_ability:93,dirt_aptitude:.9,turf_aptitude:.7,
    sprint_aptitude:.8,route_aptitude:.9},
   career:{starts:1,wins:0,earnings_minor:0}}};
 const care=()=>({policy:{feed:'HAY',care:'BALANCED',monthly_budget_minor:90000},
  finance:{spent_minor:0},history:[],training:{
   readiness:.95,fitness:.9,fatigue:.01,confidence:.85,stress:.1,
   currentRisk:.01,sorenessDays:0,speedCondition:.9,staminaCondition:.88}});
 return {clock:{date:'1999-06-01',days_elapsed:151},
  rng:{seed:19990101},player:{role:'owner',operation_id:ownerA},
  runtime:{racing:rt,registered_horses:{by_id:horses},
   horse:{[h1]:care(),[h2]:care()},people:{},
   races:{},entries:{},
   facilities:{sites:{'F-FL-BARN':{
    id:'F-FL-BARN',host_track_id:t,status:'ACTIVE',quality:.9}}},
   finances:{balance_minor:2000000,
    operation_balances_minor:{[ownerA]:2000000,[ownerB]:2000000},
    ledger:[]}}};
}
const act=(s,type,payload,actor)=>jockeyRetainerAction({
 state:s,world,command:{type,payload,actor},emit:()=>{}});
function propose(s,owner,trainer,fee,actor,start='1999-06-10',end='1999-06-23'){
 return act(s,'OFFER_1999_JOCKEY_RETAINER',{owner_id:owner,
  trainer_id:trainer,jockey_id:j,start_date:start,end_date:end,
  total_fee_minor:fee},actor);
}
function auction(){
 const s=fixture();
 const q=quote1999JockeyRetainer(s,{jockeyId:j,
  startDate:'1999-06-10',endDate:'1999-06-23'});
 const small=Math.ceil(q.minimum_fee_minor*1.1);
 const big=Math.ceil(q.minimum_fee_minor*1.45);
 const a=propose(s,ownerA,trainerA,small,'player');
 const b=propose(s,ownerB,trainerB,big,'system');
 assert.equal(s.runtime.finances.ledger.length,0,
  'unaccepted proposals must never reserve or transfer owner cash');
 s.clock.date='1999-06-09';
 const events=[],result=advance1999JockeyRetainers({
  state:s,world,emit:(kind,details)=>events.push({kind,details})});
 return {s,result,events,a,b,small,big};
}
test('two real rival owners compete, only winner pays and jockey receives exactly once',()=>{
 const {s,result,events,a,b,big}=auction();
 assert.equal(result.signed,1);
 assert.equal(result.declined,1);
 assert.equal(s.runtime.racing.retainers.schema,JOCKEY_RETAINER_SCHEMA);
 assert.equal(s.runtime.racing.retainers.offers[a.id].status,'DECLINED');
 assert.equal(s.runtime.racing.retainers.offers[b.id].status,'SIGNED');
 assert.equal(s.runtime.racing.retainers.contracts[b.id].total_fee_minor,big);
 assert.equal(s.runtime.finances.operation_balances_minor[ownerB],2000000-big);
 assert.equal(s.runtime.finances.operation_balances_minor[ownerA],2000000);
 assert.equal(s.runtime.finances.balance_minor,2000000);
 assert.equal(s.runtime.racing.jockey_finances_minor[j],big);
 assert.equal(s.runtime.finances.ledger.length,2);
 assert.equal(s.runtime.finances.ledger.reduce((a,b)=>a+b.amount_minor,0),0);
 assert.equal(events.filter(e=>e.kind==='JOCKEY_RETAINER_SIGNED').length,1);
 assert.equal(get1999JockeyRetainerPreference(s,{jockeyId:j,
  ownerId:ownerB,trainerId:trainerB,raceDate:'1999-06-12'}).priority,.05);
 assert.equal(get1999JockeyRetainerPreference(s,{jockeyId:j,
  ownerId:ownerA,trainerId:trainerA,raceDate:'1999-06-12'}).priority,0);
 assert.equal(get1999JockeyRetainerPreference(s,{jockeyId:j,
  ownerId:ownerB,trainerId:trainerB,raceDate:'1999-06-24'}).priority,0);
 validate1999JockeyRetainers(s,world);
 const reopened=JSON.parse(JSON.stringify(s));
 assert.deepEqual(advance1999JockeyRetainers({state:reopened,world,emit:()=>{}}),
  {signed:0,declined:0,terminated:0});
 assert.deepEqual(reopened,s);
});
test('signed priority improves rider acceptance but cannot bypass travel or another mounted horse',()=>{
 const {s}=auction();
 const race={id:'R-1999-RETAINER-ALLOWANCE',date:'1999-06-12',track_id:t,
  status:'ENTRIES_OPEN',stake_id:null,conditions:'Allowance',
  purse_minor:12000000};
 const horseB=s.runtime.registered_horses.by_id['H-RETAINER-B'];
 const offer=jockeyBookingDecision(s,world,race,horseB,j);
 assert.equal(offer.retainer.priority,.05);
 assert.equal(offer.retainer.nonexclusive,true);
 assert.equal(offer.accept,true,offer.reason);
 s.runtime.races['R-BOOKED-OTHER-TRACK']={id:'R-BOOKED-OTHER-TRACK',
  track_id:other,date:race.date,status:'ENTRIES_OPEN'};
 s.runtime.entries['R-BOOKED-OTHER-TRACK:H-RETAINER-A']={
  id:'R-BOOKED-OTHER-TRACK:H-RETAINER-A',race_id:'R-BOOKED-OTHER-TRACK',
  horse_id:'H-RETAINER-A',jockey_id:j,status:'BOOKED'};
 assert.equal(assessJockeySchedule(s,world,s.runtime.racing.jockeys[j],race).
  reason,'JOCKEY_LOCATION');
 assert.equal(jockeyBookingDecision(s,world,race,horseB,j).accept,false,
  'signed venue commitments remain stronger than a retainer');
});
test('pro-rated real injury reversal returns only unused contracted days and keeps audit',()=>{
 const {s,b,big}=auction();
 s.clock.date='1999-06-17';
 s.runtime.racing.jockeys[j].availability={kind:'INJURY',
  start_date:'1999-06-17',through_date:'1999-06-24',
  source_race_id:'R-1999-REAL-RESULT',reported_date:'1999-06-16'};
 const events=[],out=advance1999JockeyRetainers({state:s,world,
  emit:(kind,details)=>events.push({kind,details})});
 const refund=Math.floor(big*7/14),c=s.runtime.racing.retainers.contracts[b.id];
 assert.equal(out.terminated,1);
 assert.equal(c.status,'TERMINATED');
 assert.equal(c.refunded_minor,refund);
 assert.equal(s.runtime.finances.operation_balances_minor[ownerB],
  2000000-big+refund);
 assert.equal(s.runtime.racing.jockey_finances_minor[j],big-refund);
 assert.equal(s.runtime.finances.ledger.length,4);
 assert.equal(s.runtime.finances.ledger.reduce((a,b)=>a+b.amount_minor,0),0);
 assert.equal(get1999JockeyRetainerPreference(s,{jockeyId:j,
  ownerId:ownerB,trainerId:trainerB,raceDate:'1999-06-18'}).priority,0);
 assert.ok(events.some(x=>x.kind==='JOCKEY_RETAINER_TERMINATED'));
 const save=JSON.parse(JSON.stringify(s));
 validate1999JockeyRetainers(save,world);
 assert.deepEqual(advance1999JockeyRetainers({state:save,world,emit:()=>{}}),
  {signed:0,declined:0,terminated:0});
 assert.deepEqual(save,s);
});
test('withdrawn, underbid, unfunded and unauthorized offers never change the ledger',()=>{
 const s=fixture(),q=quote1999JockeyRetainer(s,{jockeyId:j,
  startDate:'1999-06-10',endDate:'1999-06-23'});
 assert.throws(()=>propose(s,ownerB,trainerB,q.minimum_fee_minor,'player'),
  /authorized owning operation/i);
 assert.throws(()=>propose(s,ownerA,trainerA,q.minimum_fee_minor,'system'),
  /authorized owning operation/i);
 const w=propose(s,ownerA,trainerA,q.minimum_fee_minor,'player');
 act(s,'WITHDRAW_1999_JOCKEY_RETAINER',{offer_id:w.id},'player');
 assert.equal(s.runtime.racing.retainers.offers[w.id].status,'WITHDRAWN');
 const x=propose(s,ownerB,trainerB,q.minimum_fee_minor-1000,'system');
 s.clock.date='1999-06-09';
 const result=advance1999JockeyRetainers({state:s,world,emit:()=>{}});
 assert.equal(result.signed,0);
 assert.equal(result.declined,1);
 assert.equal(s.runtime.racing.retainers.offers[x.id].status,'DECLINED');
 assert.equal(s.runtime.finances.ledger.length,0);
 assert.equal(s.runtime.racing.jockey_finances_minor[j],0);
});
test('retirement interrupts a genuine signed contract with correct owner refund',()=>{
 const {s,b,big}=auction();
 s.clock.date='2000-01-01';
 s.runtime.racing.jockeys[j].career_status='RETIRED';
 const out=advance1999JockeyRetainers({state:s,world,emit:()=>{}});
 assert.equal(out.terminated,0,'contract ended before annual retirement');
 assert.equal(s.runtime.racing.retainers.contracts[b.id].status,'EXPIRED');
 assert.equal(s.runtime.racing.jockey_finances_minor[j],big);
});

test('actual AI agents submit a market bid against player owner without debiting player cash',()=>{
 const s=fixture();
 s.clock.days_elapsed=7;
 s.runtime.finances.operation_balances_minor[ownerB]=5000000;
 const start='1999-06-06',end='1999-06-19';
 const q=quote1999JockeyRetainer(s,{jockeyId:j,startDate:start,endDate:end});
 const player=propose(s,ownerA,trainerA,
  Math.ceil(q.minimum_fee_minor*1.05),'player',start,end);
 const events=[],first=propose1999AIRiderRetainers({state:s,world,
  emit:(kind,details)=>events.push({kind,details})});
 assert.equal(first.offered,1);
 assert.ok(events.some(x=>x.kind==='AI_OWNER_JOCKEY_RETAINER_PROPOSED'));
 assert.equal(s.runtime.finances.ledger.length,0);
 assert.equal(s.runtime.finances.balance_minor,2000000);
 const again=propose1999AIRiderRetainers({state:s,world,emit:()=>{}});
 assert.equal(again.offered,0,'AI cannot repeat the same signed-date proposal');
 s.clock.date='1999-06-05';
 const resolution=advance1999JockeyRetainers({state:s,world,emit:()=>{}});
 assert.equal(resolution.signed,1);
 assert.equal(resolution.declined,1);
 assert.equal(s.runtime.racing.retainers.offers[player.id].status,'DECLINED');
 assert.equal(s.runtime.finances.balance_minor,2000000);
 assert.equal(s.runtime.finances.operation_balances_minor[ownerA],2000000);
 assert.equal(s.runtime.finances.ledger.length,2);
 validate1999JockeyRetainers(JSON.parse(JSON.stringify(s)),world);
});

test('owner may terminate live retainer once; explicit notice penalty and real refund ledger',()=>{
 const {s,b,big}=auction();
 s.clock.date='1999-06-13';
 const unused=Math.floor(big*11/14);
 const penalty=Math.floor(unused*.15),refund=unused-penalty;
 assert.throws(()=>act(s,'TERMINATE_1999_JOCKEY_RETAINER',
  {contract_id:b.id},'player'),/owning party/i);
 const out=act(s,'TERMINATE_1999_JOCKEY_RETAINER',
  {contract_id:b.id},'system');
 assert.equal(out.terminated,true);
 assert.equal(out.refunded_minor,refund);
 assert.equal(out.cancellation_penalty_minor,penalty);
 assert.equal(s.runtime.racing.retainers.contracts[b.id].status,'TERMINATED');
 assert.equal(s.runtime.finances.operation_balances_minor[ownerB],
  2000000-big+refund);
 assert.equal(s.runtime.racing.jockey_finances_minor[j],big-refund);
 assert.equal(s.runtime.finances.ledger.length,4);
 assert.equal(s.runtime.finances.ledger.reduce((a,x)=>a+x.amount_minor,0),0);
 assert.equal(get1999JockeyRetainerPreference(s,{jockeyId:j,
  ownerId:ownerB,trainerId:trainerB,raceDate:'1999-06-14'}).priority,0);
 assert.throws(()=>act(s,'TERMINATE_1999_JOCKEY_RETAINER',
  {contract_id:b.id},'system'),/live signed retainer/i);
 validate1999JockeyRetainers(JSON.parse(JSON.stringify(s)),world);
});
